"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/server";

export type Resultado =
  | { estado: "inicial" }
  | { estado: "ok"; mensaje: string; categoria: string; edad: number }
  | { estado: "error"; mensaje: string };

/* Inscribirse a un concurso.

   Casi todo lo que hay que comprobar —que el concurso esté abierto, que la
   edad cuadre con la categoría, que no estés ya dentro, que las cuatro
   casillas estén marcadas— lo comprueba la base dentro de una sola función,
   y por una razón: la inscripción, el video y la aceptación de las bases
   tienen que ocurrir JUNTOS. Un participante sin consentimiento registrado no
   es un registro a medias, es un agujero legal.

   Aquí solo se recoge el formulario, se pide la duración en un formato humano
   y se devuelve lo que la base diga. */

function aSegundos(bruto: string): number | null {
  const texto = bruto.trim();
  if (!texto) return null;
  // "1:45" o "105"
  const reloj = texto.match(/^(\d{1,2}):([0-5]\d)$/);
  if (reloj) return Number(reloj[1]) * 60 + Number(reloj[2]);
  const n = Number(texto);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

export async function inscribirme(
  _previo: Resultado,
  datos: FormData,
): Promise<Resultado> {
  const supabase = await crearClienteServidor();

  const {
    data: { user: credencial },
  } = await supabase.auth.getUser();

  if (!credencial) {
    return {
      estado: "error",
      mensaje:
        "Hay que entrar con tu cuenta. El consentimiento tiene que quedar a nombre de alguien: es lo que después permite publicar tu video.",
    };
  }

  const concurso = String(datos.get("concurso") ?? "").trim();
  const categoria = String(datos.get("categoria") ?? "").trim();
  const titulo = String(datos.get("titulo") ?? "").trim();
  const descripcion = String(datos.get("descripcion") ?? "").trim();
  const video = String(datos.get("video") ?? "").trim();
  const duracion = aSegundos(String(datos.get("duracion") ?? ""));

  if (!titulo) return { estado: "error", mensaje: "Ponle un título a tu video." };
  if (!video) {
    return {
      estado: "error",
      mensaje: "Falta el enlace al video. Puede ser de YouTube, Vimeo o Drive.",
    };
  }
  if (duracion === null) {
    return {
      estado: "error",
      mensaje: "Pon cuánto dura, en minutos:segundos. Por ejemplo 1:45.",
    };
  }

  const aceptado = {
    bases: datos.get("bases") === "on",
    material_propio: datos.get("materialPropio") === "on",
    derechos: datos.get("derechos") === "on",
    uso_de_imagen: datos.get("usoDeImagen") === "on",
  };

  const { data, error } = await supabase.rpc("inscribirme_en_concurso", {
    p_concurso: concurso,
    p_titulo: titulo,
    p_video_url: video,
    p_aceptado: aceptado,
    ...(categoria ? { p_categoria: categoria } : {}),
    ...(descripcion ? { p_descripcion: descripcion } : {}),
    p_duracion: duracion,
  });

  if (error) {
    /* Los mensajes de esta función están escritos para leerse: dicen qué
       falta y por qué. No hace falta traducirlos otra vez aquí. */
    return { estado: "error", mensaje: error.message };
  }

  const resultado = data as {
    edad: number;
    categoria: string;
    participante: string;
  };

  revalidatePath("/mi");
  revalidatePath("/participa");

  return {
    estado: "ok",
    mensaje:
      "Tu video quedó enviado. Ahora entra en la cola de revisión: se comprueba la duración, la autoría y que no suene nada con derechos.",
    categoria: resultado.categoria,
    edad: resultado.edad,
  };
}
