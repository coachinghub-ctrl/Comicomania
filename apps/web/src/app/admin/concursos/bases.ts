"use server";

import { revalidatePath } from "next/cache";
import { puede } from "@comicomania/authz";
import { cargarActor } from "@/lib/autorizacion";
import { crearClienteServidor } from "@/lib/supabase/server";

export type Resultado =
  | { estado: "inicial" }
  | { estado: "ok"; mensaje: string }
  | { estado: "error"; mensaje: string };

const MAX_ARTE = 5 * 1024 * 1024;
const TIPOS = ["image/jpeg", "image/png", "image/webp"];

/* Las bases del concurso: qué es, cómo se entra, qué se pide y el arte que se
   comparte.

   Esto no es decoración. Un concurso que no explica sus requisitos recibe
   cien videos que hay que rechazar uno por uno, y cada rechazo es una persona
   enfadada con razón: nadie le dijo que dos minutos eran dos minutos.

   El territorio se comprueba contra el concurso guardado, nunca contra lo que
   llega del formulario. */
export async function guardarBases(
  _previo: Resultado,
  datos: FormData,
): Promise<Resultado> {
  const actor = await cargarActor();
  const supabase = await crearClienteServidor();

  const concursoId = String(datos.get("concurso") ?? "").trim();
  if (!concursoId) return { estado: "error", mensaje: "Falta el concurso." };

  const { data: concurso } = await supabase
    .from("contests")
    .select("id, slug, name, cities(path), countries(path)")
    .eq("id", concursoId)
    .single();

  if (!concurso) {
    return { estado: "error", mensaje: "Ese concurso no existe o no lo alcanzas." };
  }

  const ciudad = concurso.cities as { path: string } | null;
  const pais = concurso.countries as { path: string } | null;
  const path = ciudad?.path ?? pais?.path ?? null;

  const decision = puede(actor, { seccion: "CONTESTS", accion: "EDIT", path });
  if (!decision.permitido) {
    return {
      estado: "error",
      mensaje: `No permitido: ${decision.motivo.toLowerCase().replaceAll("_", " ")}.`,
    };
  }

  const descripcion = String(datos.get("descripcion") ?? "").trim();
  const comoEntrar = String(datos.get("comoEntrar") ?? "").trim();
  const altArte = String(datos.get("altArte") ?? "").trim();
  const arte = datos.get("arte") as File | null;

  let arteUrl: string | undefined;
  if (arte && arte.size > 0) {
    if (!TIPOS.includes(arte.type)) {
      return { estado: "error", mensaje: "El arte debe ser JPG, PNG o WebP." };
    }
    if (arte.size > MAX_ARTE) {
      return {
        estado: "error",
        mensaje: `Ese archivo pesa ${(arte.size / 1024 / 1024).toFixed(1)} MB y el máximo son 5 MB.`,
      };
    }
    if (!altArte) {
      /* Se exige antes de subir, no después: un arte sin descripción deja
         fuera a quien usa lector de pantalla, y la invitación es justo lo que
         más se comparte. */
      return {
        estado: "error",
        mensaje: "Describe qué se ve en el arte. Sin eso, quien no lo ve se queda sin la invitación.",
      };
    }

    const extension = arte.type.split("/")[1]!.replace("jpeg", "jpg");
    const ruta = `invitaciones/${concurso.slug}-${Date.now()}.${extension}`;

    const { error: fallo } = await supabase.storage
      .from("concursos")
      .upload(ruta, arte, { upsert: false, contentType: arte.type });

    if (fallo) {
      return { estado: "error", mensaje: `No se pudo subir el arte: ${fallo.message}` };
    }
    arteUrl = supabase.storage.from("concursos").getPublicUrl(ruta).data.publicUrl;
  }

  const { error } = await supabase
    .from("contests")
    .update({
      description: descripcion || null,
      how_to_enter: comoEntrar || null,
      ...(altArte ? { invitation_image_alt: altArte } : {}),
      ...(arteUrl ? { invitation_image_url: arteUrl } : {}),
    })
    .eq("id", concursoId);

  if (error) {
    return { estado: "error", mensaje: `No se pudo guardar: ${error.message}` };
  }

  await supabase.from("audit_logs").insert({
    actor_user_id: actor.usuarioId,
    actor_role: decision.grant?.rol ?? null,
    scope_path: path,
    section: "CONTESTS",
    action: "EDIT",
    object_type: "contest",
    object_id: concursoId,
    new_value: { bases: true, arte_nuevo: Boolean(arteUrl) },
    result: "ALLOWED",
  });

  revalidatePath("/admin/concursos");
  revalidatePath(`/concursos/${concurso.slug}`);
  return { estado: "ok", mensaje: "Bases guardadas." };
}

/* Agregar un requisito.

   Uno por fila y no todos en un párrafo: separados se pueden ordenar, marcar
   como obligatorios y mostrar como lista de chequeo. Un párrafo con seis
   condiciones adentro no se puede hacer nada de eso, y además nadie lo lee. */
export async function agregarRequisito(
  _previo: Resultado,
  datos: FormData,
): Promise<Resultado> {
  const actor = await cargarActor();
  const supabase = await crearClienteServidor();

  const concursoId = String(datos.get("concurso") ?? "").trim();
  const titulo = String(datos.get("titulo") ?? "").trim();
  const detalle = String(datos.get("detalle") ?? "").trim();
  const falla = String(datos.get("falla") ?? "").trim();
  const obligatorio = datos.get("obligatorio") === "on";

  if (!titulo) return { estado: "error", mensaje: "Falta el requisito." };

  const { data: concurso } = await supabase
    .from("contests")
    .select("id, slug, cities(path), countries(path)")
    .eq("id", concursoId)
    .single();
  if (!concurso) return { estado: "error", mensaje: "Ese concurso no existe." };

  const ciudad = concurso.cities as { path: string } | null;
  const pais = concurso.countries as { path: string } | null;
  const path = ciudad?.path ?? pais?.path ?? null;

  if (!puede(actor, { seccion: "CONTESTS", accion: "EDIT", path }).permitido) {
    return { estado: "error", mensaje: "No puedes editar este concurso." };
  }

  const { data: ultimo } = await supabase
    .from("contest_requirements")
    .select("order")
    .eq("contest_id", concursoId)
    .order("order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("contest_requirements").insert({
    contest_id: concursoId,
    order: (ultimo?.order ?? 0) + 1,
    title: titulo,
    detail: detalle || null,
    fails_when: falla || null,
    is_required: obligatorio,
  });

  if (error) {
    return { estado: "error", mensaje: `No se pudo agregar: ${error.message}` };
  }

  revalidatePath("/admin/concursos");
  revalidatePath(`/concursos/${concurso.slug}`);
  return { estado: "ok", mensaje: "Requisito agregado." };
}
