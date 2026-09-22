"use server";

import { revalidatePath } from "next/cache";
import { puede } from "@comicomania/authz";
import { cargarActor } from "@/lib/autorizacion";
import { crearClienteServidor } from "@/lib/supabase/server";

export type Resultado =
  | { estado: "inicial" }
  | { estado: "ok"; mensaje: string; handle: string | null }
  | { estado: "error"; mensaje: string };

const MAX_FOTO = 5 * 1024 * 1024;
const TIPOS_FOTO = ["image/jpeg", "image/png", "image/webp"];

/* Lo mínimo para que una ficha se pueda publicar. Lo repite la base con una
   restricción; aquí está para poder decirlo con palabras en vez de con un
   código de error de Postgres. */
const BIO_MINIMA = 40;

function aHandle(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function lista(valor: FormDataEntryValue | null): string[] {
  return String(valor ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/* Crear o actualizar la ficha de un humorista.

   Una ficha es una fila de talent_profiles, y su clave primaria es el id de
   una CUENTA. No hay humoristas sin cuenta: la ficha es de alguien, no de un
   nombre suelto. Por eso el formulario pide a quién pertenece en vez de
   inventarse una persona nueva.

   Publicar es lo último que se decide, y solo se puede si hay foto, video y
   biografía. Esa regla vive en la base —una ficha publicada a medias es una
   entrada de listín telefónico— y aquí solo se traduce a castellano. */
export async function guardarFicha(
  _previo: Resultado,
  datos: FormData,
): Promise<Resultado> {
  const actor = await cargarActor();
  const supabase = await crearClienteServidor();

  const decision = puede(actor, { seccion: "TALENT", accion: "EDIT" });
  if (!decision.permitido) {
    return {
      estado: "error",
      mensaje: `No permitido: ${decision.motivo.toLowerCase().replaceAll("_", " ")}.`,
    };
  }

  const usuarioId = String(datos.get("usuario") ?? "").trim();
  const nombre = String(datos.get("nombre") ?? "").trim();
  const handleBruto = String(datos.get("handle") ?? "").trim();
  const tagline = String(datos.get("tagline") ?? "").trim();
  const bio = String(datos.get("bio") ?? "").trim();
  const reelUrl = String(datos.get("reel") ?? "").trim();
  const reelTitulo = String(datos.get("reelTitulo") ?? "").trim();
  const altFoto = String(datos.get("altFoto") ?? "").trim();
  const nombreLegal = String(datos.get("nombreLegal") ?? "").trim();
  const contacto = String(datos.get("contacto") ?? "").trim();
  const viaja = String(datos.get("viaja") ?? "").trim();
  const orden = Number(String(datos.get("orden") ?? "100").trim());
  const publicar = datos.get("publicar") === "on";
  const foto = datos.get("foto") as File | null;

  const estilos = lista(datos.get("estilos"));
  const idiomas = lista(datos.get("idiomas"));
  const mercados = lista(datos.get("mercados"));
  const duraciones = lista(datos.get("duraciones"))
    .map(Number)
    .filter((n) => Number.isFinite(n) && n > 0);

  if (!usuarioId) {
    return {
      estado: "error",
      mensaje:
        "Elige a quién pertenece la ficha. Una ficha de talento es de una cuenta, no de un nombre suelto.",
    };
  }
  if (!nombre) return { estado: "error", mensaje: "Falta el nombre artístico." };

  const handle = aHandle(handleBruto || nombre);
  if (handle.length < 3) {
    return {
      estado: "error",
      mensaje: "La dirección de la ficha necesita al menos tres caracteres.",
    };
  }

  if (reelUrl && !/^https?:\/\//i.test(reelUrl)) {
    return {
      estado: "error",
      mensaje: "El video tiene que ser una dirección que empiece por https://.",
    };
  }

  // ¿Ya existe la ficha? De eso depende qué foto hay y si hace falta subir una.
  const { data: existente } = await supabase
    .from("talent_profiles")
    .select("user_id, photo_url, handle, status")
    .eq("user_id", usuarioId)
    .maybeSingle();

  /* La foto se sube ANTES de escribir la fila. Si fallara después, quedaría
     una ficha apuntando a una imagen que no existe. */
  let fotoUrl: string | null = existente?.photo_url ?? null;

  if (foto && foto.size > 0) {
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
          "Describe qué se ve en la foto. Sin descripción, quien no la ve se queda fuera del repertorio.",
      };
    }

    const extension = foto.type.split("/")[1]!.replace("jpeg", "jpg");
    const ruta = `talento/${handle}-${Date.now()}.${extension}`;
    const { error: fallo } = await supabase.storage
      .from("concursos")
      .upload(ruta, foto, { upsert: false, contentType: foto.type });

    if (fallo) {
      return { estado: "error", mensaje: `No se pudo subir la foto: ${fallo.message}` };
    }
    fotoUrl = supabase.storage.from("concursos").getPublicUrl(ruta).data.publicUrl;
  }

  // Lo que falta para publicar, dicho antes de que lo diga la base.
  if (publicar) {
    const faltan: string[] = [];
    if (!fotoUrl) faltan.push("una foto");
    if (!reelUrl) faltan.push("un video");
    if (bio.length < BIO_MINIMA) faltan.push("una biografía de verdad");
    if (faltan.length > 0) {
      return {
        estado: "error",
        mensaje: `Para publicar la ficha falta ${faltan.join(", ")}. Una ficha sin eso es una entrada de listín telefónico: el repertorio existe para que alguien mire y decida.`,
      };
    }
  }

  const fila = {
    user_id: usuarioId,
    stage_name: nombre,
    handle,
    tagline: tagline || null,
    bio: bio || null,
    photo_url: fotoUrl,
    photo_alt: altFoto || null,
    reel_url: reelUrl || null,
    reel_title: reelTitulo || null,
    comedy_styles: estilos,
    languages: idiomas,
    markets: mercados,
    set_durations: duraciones,
    travel_availability: viaja || null,
    legal_name: nombreLegal || null,
    booking_contact: contacto || null,
    display_order: Number.isFinite(orden) ? orden : 100,
    public_visible: publicar,
    /* Publicar activa la ficha. Despublicar NO la retira: una ficha que se
       quita del repertorio puede estar en pausa, retirada o bloqueada, y esa
       diferencia es la que guarda el historial de estado. Se respeta el que
       ya tenía, y una ficha nueva nace en borrador. */
    status: publicar ? "ACTIVE" : existente?.status ?? "DRAFT",
  };

  const { error } = await supabase
    .from("talent_profiles")
    .upsert(fila, { onConflict: "user_id" });

  if (error) {
    if (error.message.includes("talent_handle_unico")) {
      return {
        estado: "error",
        mensaje: `Ya hay otra ficha en /humoristas/${handle}. Elige otra dirección.`,
      };
    }
    if (error.message.includes("visible_exige_ficha_completa")) {
      return {
        estado: "error",
        mensaje:
          "La base rechazó publicar la ficha porque le falta foto, video o biografía.",
      };
    }
    return { estado: "error", mensaje: `No se pudo guardar: ${error.message}` };
  }

  await supabase.from("audit_logs").insert({
    actor_user_id: actor.usuarioId,
    actor_role: decision.grant?.rol ?? null,
    section: "TALENT",
    action: "EDIT",
    object_type: "talent_profile",
    object_id: usuarioId,
    new_value: {
      nombre,
      handle,
      publicada: publicar,
      con_video: Boolean(reelUrl),
      foto_nueva: Boolean(foto && foto.size > 0),
    },
    result: "ALLOWED",
  });

  revalidatePath("/admin/talento");
  revalidatePath("/humoristas");
  revalidatePath(`/humoristas/${handle}`);
  if (existente?.handle && existente.handle !== handle) {
    revalidatePath(`/humoristas/${existente.handle}`);
  }

  return {
    estado: "ok",
    handle: publicar ? handle : null,
    mensaje: publicar
      ? `"${nombre}" está en el repertorio, en /humoristas/${handle}.`
      : `"${nombre}" quedó guardada sin publicar. No sale en el repertorio hasta que la publiques.`,
  };
}

/* Quitar una ficha del repertorio.

   No la borra: la despublica. La ficha guarda historial de estado, contratos
   y solicitudes de contratación colgando de ella, y borrarla se llevaría por
   delante la historia de alguien que trabajó. Para dejar de enseñarla basta
   con dejar de enseñarla. */
export async function despublicarFicha(
  _previo: Resultado,
  datos: FormData,
): Promise<Resultado> {
  const actor = await cargarActor();
  const supabase = await crearClienteServidor();

  const decision = puede(actor, { seccion: "TALENT", accion: "EDIT" });
  if (!decision.permitido) {
    return {
      estado: "error",
      mensaje: `No permitido: ${decision.motivo.toLowerCase().replaceAll("_", " ")}.`,
    };
  }

  const usuarioId = String(datos.get("usuario") ?? "").trim();
  if (!usuarioId) return { estado: "error", mensaje: "Falta la ficha." };

  const { data: ficha, error } = await supabase
    .from("talent_profiles")
    .update({ public_visible: false })
    .eq("user_id", usuarioId)
    .select("stage_name, handle")
    .single();

  if (error) {
    return { estado: "error", mensaje: `No se pudo quitar: ${error.message}` };
  }

  await supabase.from("audit_logs").insert({
    actor_user_id: actor.usuarioId,
    actor_role: decision.grant?.rol ?? null,
    section: "TALENT",
    action: "EDIT",
    object_type: "talent_profile",
    object_id: usuarioId,
    new_value: { despublicada: true },
    result: "ALLOWED",
  });

  revalidatePath("/admin/talento");
  revalidatePath("/humoristas");
  if (ficha?.handle) revalidatePath(`/humoristas/${ficha.handle}`);

  return {
    estado: "ok",
    handle: null,
    mensaje: `"${ficha?.stage_name}" salió del repertorio. La ficha y su historial siguen ahí.`,
  };
}
