"use server";

import { revalidatePath } from "next/cache";
import { puede } from "@comicomania/authz";
import { cargarActor } from "@/lib/autorizacion";
import { crearClienteServidor } from "@/lib/supabase/server";

export type Resultado =
  | { estado: "inicial" }
  | { estado: "ok"; mensaje: string; slug: string }
  | { estado: "error"; mensaje: string };

/* Crear un producto con el formato de la tienda.

   Nace con foto, variantes y existencias, o no nace. Un producto sin variante
   no se puede comprar, y uno sin existencias se vende hasta que alguien
   descubre que no hay. Es la misma regla que rige para concursos y eventos:
   las piezas que lo hacen funcionar van juntas o no va ninguna.

   La foto y su descripción son obligatorias. Una tienda sin fotos no vende, y
   una foto sin descripción deja la tienda inutilizable con lector de
   pantalla — que en comercio no es un detalle, es gente que no puede comprar. */

const FORMATOS = {
  TALLAS: {
    etiqueta: "Ropa · tallas S a XL",
    opcion: "talla",
    variantes: ["S", "M", "L", "XL"],
    envio: true,
    peso: 180,
  },
  UNICA: {
    etiqueta: "Talla o tamaño único",
    opcion: "tamaño",
    variantes: ["Única"],
    envio: true,
    peso: 200,
  },
  JUEGO: {
    etiqueta: "Juego o pack",
    opcion: "juego",
    variantes: ["Juego completo"],
    envio: true,
    peso: 60,
  },
  DIGITAL: {
    etiqueta: "Digital · sin envío",
    opcion: "formato",
    variantes: ["Descarga"],
    envio: false,
    peso: 0,
  },
} as const;

export type FormatoProducto = keyof typeof FORMATOS;

const MAX_FOTO = 5 * 1024 * 1024;
const TIPOS_FOTO = ["image/jpeg", "image/png", "image/webp"];

function aSlug(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function crearProducto(
  _previo: Resultado,
  datos: FormData,
): Promise<Resultado> {
  const actor = await cargarActor();

  const decision = puede(actor, { seccion: "PRODUCTS", accion: "CREATE" });
  if (!decision.permitido) {
    return {
      estado: "error",
      mensaje: `No permitido: ${decision.motivo.toLowerCase().replaceAll("_", " ")}.`,
    };
  }

  const nombre = String(datos.get("nombre") ?? "").trim();
  const descripcion = String(datos.get("descripcion") ?? "").trim();
  const formatoClave = String(datos.get("formato") ?? "UNICA") as FormatoProducto;
  const precio = Number(String(datos.get("precio") ?? "").trim());
  const moneda = String(datos.get("moneda") ?? "USD").trim().toUpperCase();
  const existencias = Number(String(datos.get("existencias") ?? "").trim());
  const minimo = Number(String(datos.get("minimo") ?? "5").trim());
  const altFoto = String(datos.get("altFoto") ?? "").trim();
  const foto = datos.get("foto") as File | null;

  const formato = FORMATOS[formatoClave];
  if (!formato) return { estado: "error", mensaje: "Ese formato no existe." };

  if (!nombre) return { estado: "error", mensaje: "Falta el nombre del producto." };
  if (!descripcion) {
    return {
      estado: "error",
      mensaje: "Escribe de qué es. Un producto sin descripción no se vende, se mira.",
    };
  }
  if (!Number.isFinite(precio) || precio < 0) {
    return { estado: "error", mensaje: "Revisa el precio." };
  }
  if (!Number.isFinite(existencias) || existencias < 0) {
    return { estado: "error", mensaje: "Revisa las existencias." };
  }
  if (!foto || foto.size === 0) {
    return {
      estado: "error",
      mensaje: "Falta la foto. Una tienda sin fotos no vende.",
    };
  }
  if (!TIPOS_FOTO.includes(foto.type)) {
    return { estado: "error", mensaje: "La foto debe ser JPG, PNG o WebP." };
  }
  if (foto.size > MAX_FOTO) {
    return {
      estado: "error",
      mensaje: `Esa foto pesa ${(foto.size / 1024 / 1024).toFixed(1)} MB y el máximo son 5 MB.`,
    };
  }
  if (!altFoto) {
    return {
      estado: "error",
      mensaje:
        "Describe qué se ve en la foto. Sin eso, quien usa lector de pantalla no puede comprar.",
    };
  }

  const supabase = await crearClienteServidor();
  const slug = aSlug(nombre);

  // La foto va antes: un producto apuntando a una imagen que no existe se ve
  // peor que no tener el producto.
  const extension = foto.type.split("/")[1]!.replace("jpeg", "jpg");
  const ruta = `productos/${slug}-${Date.now()}.${extension}`;
  const { error: falloFoto } = await supabase.storage
    .from("concursos")
    .upload(ruta, foto, { upsert: false, contentType: foto.type });

  if (falloFoto) {
    return { estado: "error", mensaje: `No se pudo subir la foto: ${falloFoto.message}` };
  }
  const fotoUrl = supabase.storage.from("concursos").getPublicUrl(ruta).data.publicUrl;

  const { data: ultimo } = await supabase
    .from("products")
    .select("display_order")
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: producto, error } = await supabase
    .from("products")
    .insert({
      slug,
      name: nombre,
      description: descripcion,
      type: formato.envio ? "PHYSICAL" : "DIGITAL",
      // Nace en borrador: nadie publica en la tienda por accidente.
      status: "DRAFT",
      requires_shipping: formato.envio,
      weight_g: formato.peso || null,
      image_url: fotoUrl,
      image_alt: altFoto,
      display_order: (ultimo?.display_order ?? 0) + 1,
    })
    .select("id, slug")
    .single();

  if (error) {
    return {
      estado: "error",
      mensaje: error.message.includes("products_slug_key")
        ? "Ya existe un producto con ese nombre."
        : `La base rechazó el producto: ${error.message}`,
    };
  }

  const prefijo = slug.toUpperCase().replace(/-/g, "").slice(0, 8);

  const { data: variantes, error: falloVariantes } = await supabase
    .from("product_variants")
    .insert(
      formato.variantes.map((v) => ({
        product_id: producto.id,
        sku: `CM-${prefijo}-${aSlug(v).toUpperCase().slice(0, 6)}`,
        option_values: { [formato.opcion]: v },
        price: precio,
        currency: moneda,
      })),
    )
    .select("id");

  if (falloVariantes || !variantes) {
    await supabase.from("products").delete().eq("id", producto.id);
    return {
      estado: "error",
      mensaje: `No se pudo completar el producto, así que no se creó a medias: ${falloVariantes?.message}`,
    };
  }

  // Una bodega, la que haya. Sin existencias el producto se vende hasta que
  // alguien descubre que no hay.
  let { data: bodega } = await supabase
    .from("inventory_locations")
    .select("id")
    .eq("name", "Bodega principal")
    .maybeSingle();

  if (!bodega) {
    const { data: nueva } = await supabase
      .from("inventory_locations")
      .insert({ type: "WAREHOUSE", name: "Bodega principal" })
      .select("id")
      .single();
    bodega = nueva;
  }

  if (bodega) {
    const { error: falloStock } = await supabase.from("inventory").insert(
      variantes.map((v) => ({
        variant_id: v.id,
        location_id: bodega!.id,
        on_hand: existencias,
        low_stock_threshold: Number.isFinite(minimo) ? minimo : 5,
      })),
    );
    if (falloStock) {
      await supabase.from("products").delete().eq("id", producto.id);
      return {
        estado: "error",
        mensaje: `No se pudo cargar el inventario, así que el producto no se creó: ${falloStock.message}`,
      };
    }
  }

  await supabase.from("audit_logs").insert({
    actor_user_id: actor.usuarioId,
    actor_role: decision.grant?.rol ?? null,
    section: "PRODUCTS",
    action: "CREATE",
    object_type: "product",
    object_id: producto.id,
    new_value: {
      nombre,
      slug,
      formato: formatoClave,
      variantes: formato.variantes.length,
      existencias,
    },
    result: "ALLOWED",
  });

  revalidatePath("/admin/tienda");
  revalidatePath("/tienda");
  return {
    estado: "ok",
    slug: producto.slug,
    mensaje: `"${nombre}" creado en borrador, con ${formato.variantes.length} ${
      formato.variantes.length === 1 ? "variante" : "variantes"
    } y ${existencias} unidades de cada una.`,
  };
}

/** Publicar o retirar un producto de la tienda pública. */
export async function cambiarEstadoProducto(
  _previo: Resultado,
  datos: FormData,
): Promise<Resultado> {
  const actor = await cargarActor();

  const decision = puede(actor, { seccion: "PRODUCTS", accion: "PUBLISH" });
  if (!decision.permitido) {
    return {
      estado: "error",
      mensaje:
        "Publicar en la tienda exige el permiso PRODUCTS.PUBLISH, que es distinto de poder editarla.",
    };
  }

  const id = String(datos.get("producto") ?? "").trim();
  const nuevo = String(datos.get("estado") ?? "").trim();
  if (!id || !["DRAFT", "ACTIVE", "ARCHIVED"].includes(nuevo)) {
    return { estado: "error", mensaje: "Estado no válido." };
  }

  const supabase = await crearClienteServidor();
  const { data: producto, error } = await supabase
    .from("products")
    .update({ status: nuevo })
    .eq("id", id)
    .select("slug, name")
    .single();

  if (error) {
    return { estado: "error", mensaje: `No se pudo cambiar: ${error.message}` };
  }

  await supabase.from("audit_logs").insert({
    actor_user_id: actor.usuarioId,
    actor_role: decision.grant?.rol ?? null,
    section: "PRODUCTS",
    action: nuevo === "ACTIVE" ? "PUBLISH" : "UNPUBLISH",
    object_type: "product",
    object_id: id,
    new_value: { status: nuevo },
    result: "ALLOWED",
  });

  revalidatePath("/admin/tienda");
  revalidatePath("/tienda");
  return {
    estado: "ok",
    slug: producto.slug,
    mensaje:
      nuevo === "ACTIVE"
        ? `"${producto.name}" ya está en la tienda pública.`
        : `"${producto.name}" salió de la tienda pública.`,
  };
}
