"use server";

import { revalidatePath } from "next/cache";
import { contieneTerritorio, puede } from "@comicomania/authz";
import { cargarActor } from "@/lib/autorizacion";
import { crearClienteServidor } from "@/lib/supabase/server";

export type Resultado =
  | { estado: "inicial" }
  | { estado: "ok"; mensaje: string; slug: string }
  | { estado: "error"; mensaje: string };

/* Crear un evento desde la plantilla.

   El evento nace CON sus tipos de entrada, o no nace. Uno sin tipos de entrada
   no puede vender nada, y alguien acabaría anunciándolo igual: es la misma
   regla que ya rige para los concursos y sus categorías.

   Los tres niveles son los del formato: General, Preferencial y VIP con meet
   & greet. Se editan después; lo que no se puede es quedarse sin ninguno.

   Las cantidades se reparten sobre el aforo —60 / 30 / 10— porque un cupo
   suelto por nivel deja vender más entradas que asientos hay, y eso solo se
   descubre en la puerta. */

/* Un evento gratuito no lleva tres niveles: lleva uno, a cero, y lo que
   importa es la LISTA de quién va a ir — esa es la razón de hacerlo gratis.
   La reserva de un lugar gratis no necesita pasarela, así que es lo único
   del comercio que funciona de verdad hoy. */
const PLANTILLA_GRATIS = [
  { nombre: "Entrada libre", kind: "COMP" as const, porcentaje: 1, incluye: ["acceso general"] },
];

const PLANTILLA = [
  { nombre: "General", kind: "GENERAL" as const, porcentaje: 0.6, incluye: ["entrada general"] },
  { nombre: "Preferencial", kind: "PREMIUM" as const, porcentaje: 0.3, incluye: ["primeras filas", "acceso 1 hora antes"] },
  { nombre: "VIP · meet & greet", kind: "VIP" as const, porcentaje: 0.1, incluye: ["primera fila", "meet & greet", "poster firmado"] },
];

const MAX_ARTE = 5 * 1024 * 1024;
const TIPOS_ARTE = ["image/jpeg", "image/png", "image/webp"];

function aSlug(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function crearEvento(
  _previo: Resultado,
  datos: FormData,
): Promise<Resultado> {
  const actor = await cargarActor();
  const supabase = await crearClienteServidor();

  const nombre = String(datos.get("nombre") ?? "").trim();
  const tipo = String(datos.get("tipo") ?? "SHOW").trim();
  const paisId = String(datos.get("pais") ?? "").trim();
  const ciudadId = String(datos.get("ciudad") ?? "").trim() || null;
  const sedeId = String(datos.get("sede") ?? "").trim() || null;
  const sedeNueva = String(datos.get("sedeNueva") ?? "").trim();
  const direccion = String(datos.get("direccion") ?? "").trim();
  const fecha = String(datos.get("fecha") ?? "").trim();
  const hora = String(datos.get("hora") ?? "20:00").trim();
  const aforoBruto = String(datos.get("aforo") ?? "").trim();
  const subtitulo = String(datos.get("subtitulo") ?? "").trim();
  const tagline = String(datos.get("tagline") ?? "").trim();
  const descripcion = String(datos.get("descripcion") ?? "").trim();
  const concursoId = String(datos.get("concurso") ?? "").trim() || null;
  const altArte = String(datos.get("altArte") ?? "").trim();
  const arte = datos.get("arte") as File | null;

  const gratis = datos.get("gratis") === "on";
  const plantilla = gratis ? PLANTILLA_GRATIS : PLANTILLA;

  const precios = plantilla.map((p, i) =>
    Number(String(datos.get(`precio${i}`) ?? "").trim()),
  );

  if (!nombre) return { estado: "error", mensaje: "Falta el nombre del evento." };
  if (!paisId) return { estado: "error", mensaje: "Elige el país." };
  if (!fecha) return { estado: "error", mensaje: "Falta la fecha." };
  if (!sedeId && !sedeNueva) {
    return { estado: "error", mensaje: "Elige una sede o escribe una nueva." };
  }
  if (!gratis && precios.some((p) => !Number.isFinite(p) || p < 0)) {
    return { estado: "error", mensaje: "Revisa los precios: tienen que ser números." };
  }

  /* El territorio sale de la base, no del formulario: un id de ciudad puede
     venir de cualquier parte, su path no. */
  const [{ data: ciudad }, { data: pais }] = await Promise.all([
    ciudadId
      ? supabase.from("cities").select("path, country_id").eq("id", ciudadId).single()
      : Promise.resolve({ data: null }),
    supabase.from("countries").select("path").eq("id", paisId).single(),
  ]);

  if (!pais) return { estado: "error", mensaje: "Ese país no existe." };
  if (ciudadId && !ciudad) return { estado: "error", mensaje: "Esa ciudad no existe." };
  if (ciudad && ciudad.country_id !== paisId) {
    return { estado: "error", mensaje: "Esa ciudad no pertenece al país elegido." };
  }

  const path = ciudad?.path ?? pais.path;

  const decision = puede(actor, { seccion: "EVENTS", accion: "CREATE", path });
  if (!decision.permitido) {
    return {
      estado: "error",
      mensaje:
        decision.motivo === "FUERA_DE_TERRITORIO"
          ? `No puedes crear eventos en ${path}.`
          : `No permitido: ${decision.motivo.toLowerCase().replaceAll("_", " ")}.`,
    };
  }

  const alcanza = actor.grants.some(
    (g) =>
      g.estado === "ACTIVE" &&
      (g.tipoAlcance === "GLOBAL" || contieneTerritorio(g.alcancePath, path)),
  );
  if (!alcanza) {
    return { estado: "error", mensaje: `No puedes crear eventos en ${path}.` };
  }

  // La sede: la existente, o una nueva con su aforo.
  let venueId = sedeId;
  let aforoSede: number | null = null;

  if (!venueId) {
    const { data: nueva, error } = await supabase
      .from("venues")
      .insert({
        name: sedeNueva,
        address: direccion || null,
        city_id: ciudadId,
        capacity: aforoBruto ? Number(aforoBruto) : null,
      })
      .select("id, capacity")
      .single();
    if (error) {
      return { estado: "error", mensaje: `No se pudo crear la sede: ${error.message}` };
    }
    venueId = nueva.id;
    aforoSede = nueva.capacity;
  } else {
    const { data: existente } = await supabase
      .from("venues")
      .select("capacity")
      .eq("id", venueId)
      .single();
    aforoSede = existente?.capacity ?? null;
  }

  const aforo = aforoBruto ? Number(aforoBruto) : aforoSede;
  if (!aforo || aforo <= 0) {
    return {
      estado: "error",
      mensaje: "Falta el aforo. Sin aforo no se puede repartir el cupo de entradas.",
    };
  }

  /* El arte se sube ANTES de crear el evento. Si fallara después, quedaría un
     evento apuntando a una imagen que no existe. */
  let arteUrl: string | null = null;
  const slug = aSlug(`${nombre}-${path}`);

  if (arte && arte.size > 0) {
    if (!TIPOS_ARTE.includes(arte.type)) {
      return { estado: "error", mensaje: "El arte debe ser JPG, PNG o WebP." };
    }
    if (arte.size > MAX_ARTE) {
      return {
        estado: "error",
        mensaje: `Ese archivo pesa ${(arte.size / 1024 / 1024).toFixed(1)} MB y el máximo son 5 MB.`,
      };
    }
    if (!altArte) {
      return {
        estado: "error",
        mensaje: "Describe qué se ve en el cartel. Es lo que más se comparte.",
      };
    }

    const extension = arte.type.split("/")[1]!.replace("jpeg", "jpg");
    const ruta = `carteles/${slug}-${Date.now()}.${extension}`;
    const { error: fallo } = await supabase.storage
      .from("concursos")
      .upload(ruta, arte, { upsert: false, contentType: arte.type });

    if (fallo) {
      return { estado: "error", mensaje: `No se pudo subir el cartel: ${fallo.message}` };
    }
    arteUrl = supabase.storage.from("concursos").getPublicUrl(ruta).data.publicUrl;
  }

  const comienza = new Date(`${fecha}T${hora}:00`);
  // La venta cierra dos horas antes: quien compra en la puerta lo hace en la
  // puerta, no por la web mientras hace la fila.
  const cierraVenta = new Date(comienza.getTime() - 2 * 60 * 60 * 1000);

  const { data: evento, error } = await supabase
    .from("events")
    .insert({
      slug,
      name: nombre,
      type: tipo,
      description: descripcion || null,
      tagline: tagline || null,
      subtitle: subtitulo || null,
      starts_at: comienza.toISOString(),
      ends_at: new Date(comienza.getTime() + 3 * 60 * 60 * 1000).toISOString(),
      venue_id: venueId,
      country_id: paisId,
      city_id: ciudadId,
      capacity: aforo,
      contest_id: concursoId,
      sales_start: new Date().toISOString(),
      sales_end: cierraVenta.toISOString(),
      // Nace en borrador: nadie anuncia por accidente algo a medio armar.
      status: "DRAFT",
      is_free: gratis,
      poster_url: arteUrl,
      poster_alt: altArte || null,
    })
    .select("id, slug")
    .single();

  if (error) {
    return {
      estado: "error",
      mensaje: error.message.includes("events_slug_key")
        ? "Ya existe un evento con ese nombre en ese territorio."
        : `La base rechazó el evento: ${error.message}`,
    };
  }

  const { error: falloEntradas } = await supabase.from("ticket_types").insert(
    plantilla.map((p, i) => ({
      event_id: evento.id,
      name: p.nombre,
      kind: p.kind,
      price: gratis ? 0 : precios[i]!,
      quantity: Math.max(1, Math.floor(aforo * p.porcentaje)),
      sales_start: new Date().toISOString(),
      sales_end: cierraVenta.toISOString(),
      benefits: { incluye: p.incluye },
    })),
  );

  /* Si los tipos de entrada fallan, el evento queda inservible. Se borra en
     vez de dejarlo a medias: nace en borrador, así que nadie lo ha visto. */
  if (falloEntradas) {
    await supabase.from("events").delete().eq("id", evento.id);
    return {
      estado: "error",
      mensaje: `No se pudo completar el evento, así que no se creó a medias: ${falloEntradas.message}`,
    };
  }

  await supabase.from("audit_logs").insert({
    actor_user_id: actor.usuarioId,
    actor_role: decision.grant?.rol ?? null,
    scope_type: ciudadId ? "CITY" : "COUNTRY",
    scope_path: path,
    section: "EVENTS",
    action: "CREATE",
    object_type: "event",
    object_id: evento.id,
    new_value: { nombre, slug, aforo, gratis, con_cartel: Boolean(arteUrl) },
    result: "ALLOWED",
  });

  revalidatePath("/admin/eventos");
  revalidatePath("/");
  return {
    estado: "ok",
    slug: evento.slug,
    mensaje: gratis
      ? `"${nombre}" creado en borrador, gratuito, con ${aforo} lugares. Quien reserve entra al CRM con el evento como fuente.`
      : `"${nombre}" creado en borrador, con sus tres tipos de entrada sobre ${aforo} lugares.`,
  };
}
