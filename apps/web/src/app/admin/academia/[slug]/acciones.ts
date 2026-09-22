"use server";

import { revalidatePath } from "next/cache";
import { puede } from "@comicomania/authz";
import { cargarActor } from "@/lib/autorizacion";
import { crearClienteServidor } from "@/lib/supabase/server";

export type Resultado =
  | { estado: "inicial" }
  | { estado: "ok"; mensaje: string }
  | { estado: "error"; mensaje: string };

async function permiso() {
  const actor = await cargarActor();
  const decision = puede(actor, { seccion: "ACADEMY", accion: "EDIT" });
  return { actor, decision };
}

/* El programa de un curso: módulos y clases.

   Una clase puede ser grabada o en vivo, y la diferencia no es cosmética: una
   clase en vivo sin fecha no es una clase, es una promesa. La base lo rechaza
   con una restricción; aquí se dice con palabras antes de llegar a ella.

   El enlace de la sala se guarda en una columna que el público no puede leer
   —permiso por columna, igual que el contenido de las lecciones—, porque un
   enlace de reunión filtrado es una clase con gente que no pagó dentro. */

export async function anadirModulo(
  _previo: Resultado,
  datos: FormData,
): Promise<Resultado> {
  const { actor, decision } = await permiso();
  if (!decision.permitido) {
    return { estado: "error", mensaje: "No tienes permiso para editar cursos." };
  }

  const supabase = await crearClienteServidor();
  const cursoId = String(datos.get("curso") ?? "").trim();
  const slug = String(datos.get("slug") ?? "").trim();
  const titulo = String(datos.get("titulo") ?? "").trim();

  if (!titulo) return { estado: "error", mensaje: "Ponle nombre al módulo." };

  const { data: ultimo } = await supabase
    .from("course_modules")
    .select("order")
    .eq("course_id", cursoId)
    .order("order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("course_modules").insert({
    course_id: cursoId,
    title: titulo,
    order: (ultimo?.order ?? 0) + 1,
  });

  if (error) {
    return { estado: "error", mensaje: `No se pudo añadir: ${error.message}` };
  }

  await supabase.from("audit_logs").insert({
    actor_user_id: actor.usuarioId,
    actor_role: decision.grant?.rol ?? null,
    section: "ACADEMY",
    action: "EDIT",
    object_type: "course",
    object_id: cursoId,
    new_value: { modulo_nuevo: titulo },
    result: "ALLOWED",
  });

  revalidatePath(`/admin/academia/${slug}`);
  revalidatePath(`/academia/${slug}`);
  return { estado: "ok", mensaje: `Módulo "${titulo}" añadido.` };
}

export async function anadirLeccion(
  _previo: Resultado,
  datos: FormData,
): Promise<Resultado> {
  const { actor, decision } = await permiso();
  if (!decision.permitido) {
    return { estado: "error", mensaje: "No tienes permiso para editar cursos." };
  }

  const supabase = await crearClienteServidor();

  const moduloId = String(datos.get("modulo") ?? "").trim();
  const cursoId = String(datos.get("curso") ?? "").trim();
  const slug = String(datos.get("slug") ?? "").trim();
  const titulo = String(datos.get("titulo") ?? "").trim();
  const tipo = String(datos.get("tipo") ?? "VIDEO").trim();
  const minutos = Number(String(datos.get("minutos") ?? "").trim());
  const muestra = datos.get("muestra") === "on";
  const fecha = String(datos.get("fecha") ?? "").trim();
  const hora = String(datos.get("hora") ?? "19:00").trim();
  const sala = String(datos.get("sala") ?? "").trim();
  const material = String(datos.get("material") ?? "").trim();

  if (!titulo) return { estado: "error", mensaje: "Ponle título a la clase." };

  const enVivo = tipo === "LIVE";
  if (enVivo && !fecha) {
    return {
      estado: "error",
      mensaje:
        "Una clase en vivo necesita día y hora. Sin fecha no es una clase, es una promesa.",
    };
  }
  if (enVivo && sala && !/^https?:\/\//i.test(sala)) {
    return {
      estado: "error",
      mensaje: "El enlace de la sala tiene que empezar por https://.",
    };
  }

  const { data: ultima } = await supabase
    .from("lessons")
    .select("order")
    .eq("module_id", moduloId)
    .order("order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const comienza = enVivo ? new Date(`${fecha}T${hora || "19:00"}:00`) : null;
  const duracion =
    Number.isFinite(minutos) && minutos > 0 ? Math.round(minutos * 60) : null;

  const { error } = await supabase.from("lessons").insert({
    module_id: moduloId,
    title: titulo,
    type: tipo,
    order: (ultima?.order ?? 0) + 1,
    duration_s: duracion,
    is_preview: muestra,
    starts_at: comienza?.toISOString() ?? null,
    ends_at:
      comienza && duracion
        ? new Date(comienza.getTime() + duracion * 1000).toISOString()
        : null,
    meeting_url: enVivo && sala ? sala : null,
    asset_ref: material ? { url: material } : {},
  });

  if (error) {
    if (error.message.includes("clase_en_vivo_tiene_fecha")) {
      return {
        estado: "error",
        mensaje: "La base rechazó la clase en vivo porque le falta la fecha.",
      };
    }
    return { estado: "error", mensaje: `No se pudo añadir: ${error.message}` };
  }

  await supabase.from("audit_logs").insert({
    actor_user_id: actor.usuarioId,
    actor_role: decision.grant?.rol ?? null,
    section: "ACADEMY",
    action: "EDIT",
    object_type: "course",
    object_id: cursoId,
    new_value: { leccion_nueva: titulo, tipo, en_vivo: enVivo, muestra },
    result: "ALLOWED",
  });

  revalidatePath(`/admin/academia/${slug}`);
  revalidatePath(`/academia/${slug}`);
  return {
    estado: "ok",
    mensaje: enVivo
      ? `Clase en vivo "${titulo}" añadida para el ${comienza!.toLocaleDateString("es")}.`
      : `Lección "${titulo}" añadida.`,
  };
}

/* Quitar una lección.

   Se puede, y a propósito: una lección no es un certificado ni un voto. Lo
   que sí arrastra es el progreso de quien ya la vio, así que el progreso se
   recalcula solo después — de eso ya se encarga la base. */
export async function quitarLeccion(
  _previo: Resultado,
  datos: FormData,
): Promise<Resultado> {
  const { actor, decision } = await permiso();
  if (!decision.permitido) {
    return { estado: "error", mensaje: "No tienes permiso para editar cursos." };
  }

  const supabase = await crearClienteServidor();
  const leccionId = String(datos.get("leccion") ?? "").trim();
  const slug = String(datos.get("slug") ?? "").trim();

  const { error } = await supabase.from("lessons").delete().eq("id", leccionId);
  if (error) {
    return { estado: "error", mensaje: `No se pudo quitar: ${error.message}` };
  }

  await supabase.from("audit_logs").insert({
    actor_user_id: actor.usuarioId,
    actor_role: decision.grant?.rol ?? null,
    section: "ACADEMY",
    action: "EDIT",
    object_type: "lesson",
    object_id: leccionId,
    new_value: { borrada: true },
    result: "ALLOWED",
  });

  revalidatePath(`/admin/academia/${slug}`);
  revalidatePath(`/academia/${slug}`);
  return { estado: "ok", mensaje: "Lección quitada." };
}
