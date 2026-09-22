"use server";

import { revalidatePath } from "next/cache";
import { puede } from "@comicomania/authz";
import { cargarActor } from "@/lib/autorizacion";
import { crearClienteServidor } from "@/lib/supabase/server";

export type Resultado =
  | { estado: "inicial" }
  | { estado: "ok"; mensaje: string; slug?: string }
  | { estado: "error"; mensaje: string };

const MAX_PORTADA = 5 * 1024 * 1024;
const TIPOS = ["image/jpeg", "image/png", "image/webp"];

/* El esqueleto con el que nace un curso.

   Un curso sin módulos es una ficha de venta, no un programa: quien lo compra
   entra y no hay nada. Es la misma regla que ya rige para los concursos y sus
   categorías o para los eventos y sus tipos de entrada — nace entero o no
   nace. Los tres módulos se renombran, se reordenan y se borran después; lo
   que no se puede es quedarse sin ninguno. */
const ESQUELETO = [
  "Fundamentos",
  "Práctica",
  "Al escenario",
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

export async function crearCurso(
  _previo: Resultado,
  datos: FormData,
): Promise<Resultado> {
  const actor = await cargarActor();
  const supabase = await crearClienteServidor();

  const decision = puede(actor, { seccion: "ACADEMY", accion: "CREATE" });
  if (!decision.permitido) {
    return {
      estado: "error",
      mensaje: `No permitido: ${decision.motivo.toLowerCase().replaceAll("_", " ")}.`,
    };
  }

  const titulo = String(datos.get("titulo") ?? "").trim();
  const subtitulo = String(datos.get("subtitulo") ?? "").trim();
  const promesa = String(datos.get("promesa") ?? "").trim();
  const descripcion = String(datos.get("descripcion") ?? "").trim();
  const nivel = String(datos.get("nivel") ?? "BEGINNER").trim();
  const modalidad = String(datos.get("modalidad") ?? "RECORDED").trim();
  const instructor = String(datos.get("instructor") ?? "").trim();
  const precio = Number(String(datos.get("precio") ?? "").trim());
  const moneda = String(datos.get("moneda") ?? "USD").trim().toUpperCase();
  const horas = Number(String(datos.get("horas") ?? "").trim());
  const arranca = String(datos.get("arranca") ?? "").trim();
  const cupos = String(datos.get("cupos") ?? "").trim();
  const altPortada = String(datos.get("altPortada") ?? "").trim();
  const orden = Number(String(datos.get("orden") ?? "100").trim());
  const portada = datos.get("portada") as File | null;

  const puntos = String(datos.get("puntos") ?? "")
    .split("\n")
    .map((p) => p.trim())
    .filter(Boolean);

  if (!titulo) return { estado: "error", mensaje: "Falta el título del curso." };
  if (!promesa) {
    return {
      estado: "error",
      mensaje:
        "Falta la promesa: qué sabrá hacer alguien al terminar. Es lo primero que se lee y lo que decide si compra.",
    };
  }
  if (!Number.isFinite(precio) || precio < 0) {
    return { estado: "error", mensaje: "Revisa el precio: tiene que ser un número." };
  }

  const enVivo = modalidad === "LIVE" || modalidad === "BLENDED";
  if (enVivo && !arranca) {
    return {
      estado: "error",
      mensaje:
        "Un curso con clases en vivo necesita fecha de arranque. Vender una cohorte sin decir cuándo empieza es vender una fecha que no existe.",
    };
  }

  const slug = aSlug(titulo);
  if (slug.length < 3) {
    return { estado: "error", mensaje: "Ese título no da una dirección usable." };
  }

  /* La portada se sube ANTES de crear el curso. Si fallara después, quedaría
     un curso apuntando a una imagen que no existe. */
  let portadaUrl: string | null = null;
  if (portada && portada.size > 0) {
    if (!TIPOS.includes(portada.type)) {
      return { estado: "error", mensaje: "La portada debe ser JPG, PNG o WebP." };
    }
    if (portada.size > MAX_PORTADA) {
      return {
        estado: "error",
        mensaje: `Esa imagen pesa ${(portada.size / 1024 / 1024).toFixed(1)} MB y el máximo son 5 MB.`,
      };
    }
    if (!altPortada) {
      return {
        estado: "error",
        mensaje: "Describe qué se ve en la portada. Es lo que más se comparte.",
      };
    }

    const extension = portada.type.split("/")[1]!.replace("jpeg", "jpg");
    const ruta = `academia/${slug}-${Date.now()}.${extension}`;
    const { error: fallo } = await supabase.storage
      .from("concursos")
      .upload(ruta, portada, { upsert: false, contentType: portada.type });

    if (fallo) {
      return { estado: "error", mensaje: `No se pudo subir la portada: ${fallo.message}` };
    }
    portadaUrl = supabase.storage.from("concursos").getPublicUrl(ruta).data.publicUrl;
  }

  const { data: curso, error } = await supabase
    .from("courses")
    .insert({
      slug,
      title: titulo,
      subtitle: subtitulo || null,
      promise: promesa,
      description: descripcion || null,
      level: nivel,
      modality: modalidad,
      instructor_name: instructor || null,
      price: precio,
      currency: moneda,
      duration_min: Number.isFinite(horas) && horas > 0 ? Math.round(horas * 60) : null,
      starts_on: enVivo && arranca ? arranca : null,
      seats: enVivo && cupos ? Number(cupos) : null,
      cover_url: portadaUrl,
      cover_alt: altPortada || null,
      highlights: puntos,
      display_order: Number.isFinite(orden) ? orden : 100,
      // Nace en borrador: nadie anuncia por accidente algo a medio armar.
      status: "DRAFT",
    })
    .select("id, slug, title")
    .single();

  if (error) {
    return {
      estado: "error",
      mensaje: error.message.includes("courses_slug_key")
        ? "Ya existe un curso con ese título."
        : `La base rechazó el curso: ${error.message}`,
    };
  }

  const { error: falloModulos } = await supabase.from("course_modules").insert(
    ESQUELETO.map((titulo, i) => ({
      course_id: curso.id,
      title: titulo,
      order: i + 1,
    })),
  );

  /* Si los módulos fallan, el curso queda inservible. Se borra en vez de
     dejarlo a medias: nace en borrador, así que nadie lo ha visto. */
  if (falloModulos) {
    await supabase.from("courses").delete().eq("id", curso.id);
    return {
      estado: "error",
      mensaje: `No se pudo montar el programa, así que el curso no se creó a medias: ${falloModulos.message}`,
    };
  }

  await supabase.from("audit_logs").insert({
    actor_user_id: actor.usuarioId,
    actor_role: decision.grant?.rol ?? null,
    section: "ACADEMY",
    action: "CREATE",
    object_type: "course",
    object_id: curso.id,
    new_value: { titulo, slug, modalidad, precio, con_portada: Boolean(portadaUrl) },
    result: "ALLOWED",
  });

  revalidatePath("/admin/academia");
  revalidatePath("/academia");

  return {
    estado: "ok",
    slug: curso.slug,
    mensaje: `"${titulo}" creado en borrador, con tres módulos para rellenar. No sale en la academia pública hasta que lo publiques.`,
  };
}

/* Publicar o retirar un curso.

   Retirar no borra: un curso archivado sigue teniendo alumnos dentro, con su
   progreso y sus certificados. Lo que deja de pasar es que se venda. */
export async function cambiarEstadoCurso(
  _previo: Resultado,
  datos: FormData,
): Promise<Resultado> {
  const actor = await cargarActor();
  const supabase = await crearClienteServidor();

  const decision = puede(actor, { seccion: "ACADEMY", accion: "EDIT" });
  if (!decision.permitido) {
    return {
      estado: "error",
      mensaje: `No permitido: ${decision.motivo.toLowerCase().replaceAll("_", " ")}.`,
    };
  }

  const cursoId = String(datos.get("curso") ?? "").trim();
  const estado = String(datos.get("estado") ?? "").trim();

  if (!["DRAFT", "PUBLISHED", "ARCHIVED"].includes(estado)) {
    return { estado: "error", mensaje: "Ese estado no existe." };
  }

  // Publicar un curso sin una sola lección es publicar una ficha vacía.
  if (estado === "PUBLISHED") {
    const { data: modulos } = await supabase
      .from("course_modules")
      .select("id, lessons(id)")
      .eq("course_id", cursoId);

    const lecciones = (modulos ?? []).reduce(
      (t, m) => t + ((m.lessons as unknown[])?.length ?? 0),
      0,
    );
    if (lecciones === 0) {
      return {
        estado: "error",
        mensaje:
          "Este curso no tiene ni una lección. Publicarlo sería vender un temario vacío.",
      };
    }
  }

  const { data: curso, error } = await supabase
    .from("courses")
    .update({ status: estado })
    .eq("id", cursoId)
    .select("slug, title")
    .single();

  if (error) {
    return { estado: "error", mensaje: `No se pudo cambiar: ${error.message}` };
  }

  await supabase.from("audit_logs").insert({
    actor_user_id: actor.usuarioId,
    actor_role: decision.grant?.rol ?? null,
    section: "ACADEMY",
    action: "EDIT",
    object_type: "course",
    object_id: cursoId,
    new_value: { estado },
    result: "ALLOWED",
  });

  revalidatePath("/admin/academia");
  revalidatePath(`/admin/academia/${curso.slug}`);
  revalidatePath("/academia");
  revalidatePath(`/academia/${curso.slug}`);

  const dicho: Record<string, string> = {
    DRAFT: "vuelve a borrador",
    PUBLISHED: "está publicado",
    ARCHIVED: "queda archivado: deja de venderse, pero quien ya está dentro sigue dentro",
  };

  return { estado: "ok", mensaje: `"${curso.title}" ${dicho[estado]}.` };
}
