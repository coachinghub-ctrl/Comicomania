"use server";

import { revalidatePath } from "next/cache";
import { contieneTerritorio, puede } from "@comicomania/authz";
import { cargarActor } from "@/lib/autorizacion";
import { crearClienteServidor } from "@/lib/supabase/server";

export type Resultado =
  | { estado: "inicial" }
  | { estado: "ok"; mensaje: string; slug: string }
  | { estado: "error"; mensaje: string };

/* Crear un concurso de punta a punta.

   El concurso no nace solo: nace con sus categorías y sus rondas, porque un
   concurso sin categorías no admite inscripciones y uno sin rondas no tiene
   dónde recibir videos. Dejarlo a medias es la forma más fácil de que alguien
   abra inscripciones a un concurso roto.

   Las tres categorías por defecto son las que recomienda docs/04 para la
   primera ciudad: 18–25, 26–39 y 40+. Con ~300 inscritos quedan ~100 por
   categoría, que es un concurso vivo en cada una. Se editan después.

   Los menores quedan fuera a propósito: admitirlos activa consentimiento de
   tutor, datos minimizados y moderación previa, y eso es una decisión legal
   por país, no una casilla que se marca desde acá. */

const CATEGORIAS_POR_DEFECTO = [
  { slug: "joven", name: "JOVEN", min_age: 18, max_age: 25, min_participants: 25 },
  { slug: "adulto", name: "ADULTO", min_age: 26, max_age: 39, min_participants: 25 },
  { slug: "master", name: "MASTER", min_age: 40, max_age: null, min_participants: 20 },
];

const RONDAS_POR_DEFECTO = [
  { order: 1, name: "Clasificatoria", type: "SUBMISSION" as const },
  { order: 2, name: "Semifinal", type: "MIXED" as const },
  { order: 3, name: "Final", type: "LIVE" as const },
];

function aSlug(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function crearConcurso(
  _previo: Resultado,
  datos: FormData,
): Promise<Resultado> {
  const actor = await cargarActor();
  const supabase = await crearClienteServidor();

  const nombre = String(datos.get("nombre") ?? "").trim();
  const temporadaId = String(datos.get("temporada") ?? "").trim();
  const paisId = String(datos.get("pais") ?? "").trim();
  const ciudadId = String(datos.get("ciudad") ?? "").trim() || null;
  const abre = String(datos.get("abre") ?? "").trim();
  const cierra = String(datos.get("cierra") ?? "").trim();
  const entrega = String(datos.get("entrega") ?? "").trim();

  if (!nombre || !temporadaId || !paisId) {
    return { estado: "error", mensaje: "Faltan el nombre, la temporada o el país." };
  }
  if (!cierra) {
    return {
      estado: "error",
      mensaje:
        "El cierre de inscripciones es obligatorio: de ahí sale la fecha con la que se congela la edad.",
    };
  }

  /* El territorio del concurso decide el permiso. Se resuelve contra la base y
     no contra lo que mandó el formulario: un id de ciudad puede venir de
     cualquier parte, su path no. */
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

  const decision = puede(actor, {
    seccion: "CONTESTS",
    accion: "CREATE",
    path,
  });
  if (!decision.permitido) {
    return {
      estado: "error",
      mensaje:
        decision.motivo === "FUERA_DE_TERRITORIO"
          ? `No puedes crear concursos en ${path}.`
          : `No permitido: ${decision.motivo.toLowerCase().replaceAll("_", " ")}.`,
    };
  }

  // Cinturón además del tirante: el guard ya lo dijo, pero el path se vuelve
  // a comparar acá por si algún día el guard cambia de forma.
  const alcanza = actor.grants.some(
    (g) =>
      g.estado === "ACTIVE" &&
      (g.tipoAlcance === "GLOBAL" || contieneTerritorio(g.alcancePath, path)),
  );
  if (!alcanza) {
    return { estado: "error", mensaje: `No puedes crear concursos en ${path}.` };
  }

  const slug = aSlug(`${nombre}-${path}`);

  const { data: concurso, error } = await supabase
    .from("contests")
    .insert({
      season_id: temporadaId,
      slug,
      name: nombre,
      status: "DRAFT",
      country_id: paisId,
      city_id: ciudadId,
      registration_opens_at: abre ? new Date(`${abre}T00:00:00`).toISOString() : null,
      registration_closes_at: new Date(`${cierra}T23:59:59`).toISOString(),
      submission_deadline: entrega
        ? new Date(`${entrega}T23:59:59`).toISOString()
        : null,
      // Por defecto el cierre de inscripciones. Se congela y no se recalcula.
      age_reference_date: cierra,
      created_by: actor.usuarioId,
    })
    .select("id, slug")
    .single();

  if (error) {
    return {
      estado: "error",
      mensaje: error.message.includes("contests_slug_key")
        ? "Ya existe un concurso con ese nombre en ese territorio."
        : `La base rechazó el concurso: ${error.message}`,
    };
  }

  /* Categorías y rondas. Si algo de esto falla, el concurso queda inservible y
     es mejor borrarlo que dejarlo a medias: nace en DRAFT, así que nadie lo ha
     visto todavía. */
  const [{ error: falloCategorias }, { error: falloRondas }] = await Promise.all([
    supabase.from("categories").insert(
      CATEGORIAS_POR_DEFECTO.map((c, i) => ({
        contest_id: concurso.id,
        slug: c.slug,
        name: c.name,
        order: i + 1,
        min_age: c.min_age,
        max_age: c.max_age,
        min_participants: c.min_participants,
        assignment: "AUTO" as const,
      })),
    ),
    supabase.from("rounds").insert(
      RONDAS_POR_DEFECTO.map((r) => ({
        contest_id: concurso.id,
        order: r.order,
        name: r.name,
        type: r.type,
      })),
    ),
  ]);

  if (falloCategorias || falloRondas) {
    await supabase.from("contests").delete().eq("id", concurso.id);
    return {
      estado: "error",
      mensaje: `No se pudo completar el concurso, así que no se creó a medias: ${
        (falloCategorias ?? falloRondas)!.message
      }`,
    };
  }

  await supabase.from("audit_logs").insert({
    actor_user_id: actor.usuarioId,
    actor_role: decision.grant?.rol ?? null,
    scope_type: ciudadId ? "CITY" : "COUNTRY",
    scope_path: path,
    section: "CONTESTS",
    action: "CREATE",
    object_type: "contest",
    object_id: concurso.id,
    new_value: { nombre, slug, path, cierra },
    result: "ALLOWED",
  });

  revalidatePath("/admin/concursos");
  return {
    estado: "ok",
    slug: concurso.slug,
    mensaje: `"${nombre}" creado en borrador, con 3 categorías por edad y 3 rondas.`,
  };
}

/* Crear una temporada suelta. Un concurso necesita una, y obligar a pedirla
   por otro canal es la clase de fricción que termina en una temporada
   "varios" donde cae todo. */
export async function crearTemporada(
  _previo: Resultado,
  datos: FormData,
): Promise<Resultado> {
  const actor = await cargarActor();

  const decision = puede(actor, { seccion: "SEASONS", accion: "CREATE" });
  if (!decision.permitido) {
    return {
      estado: "error",
      mensaje: `No puedes crear temporadas: ${decision.motivo.toLowerCase().replaceAll("_", " ")}.`,
    };
  }

  const nombre = String(datos.get("nombreTemporada") ?? "").trim();
  const anio = Number(String(datos.get("anio") ?? "").trim());
  const serieNombre = String(datos.get("serie") ?? "").trim();

  if (!nombre || !anio || !serieNombre) {
    return { estado: "error", mensaje: "Faltan la serie, el nombre o el año." };
  }

  const supabase = await crearClienteServidor();
  const serieSlug = aSlug(serieNombre);

  const { data: serie } = await supabase
    .from("series")
    .select("id")
    .eq("slug", serieSlug)
    .maybeSingle();

  let serieId = serie?.id;
  if (!serieId) {
    const { data: nueva, error } = await supabase
      .from("series")
      .insert({ slug: serieSlug, name: serieNombre })
      .select("id")
      .single();
    if (error) {
      return { estado: "error", mensaje: `No se pudo crear la serie: ${error.message}` };
    }
    serieId = nueva.id;
  }

  const { error } = await supabase.from("seasons").insert({
    series_id: serieId,
    slug: aSlug(`${nombre}-${anio}`),
    name: nombre,
    year: anio,
  });

  if (error) {
    return { estado: "error", mensaje: `No se pudo crear la temporada: ${error.message}` };
  }

  revalidatePath("/admin/concursos");
  return { estado: "ok", slug: "", mensaje: `Temporada "${nombre}" creada.` };
}
