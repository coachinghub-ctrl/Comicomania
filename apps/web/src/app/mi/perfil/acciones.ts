"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/server";

export type Resultado =
  | { estado: "inicial" }
  | { estado: "ok"; mensaje: string }
  | { estado: "error"; mensaje: string; campo?: string };

/* Guardar el perfil.

   Lo que valida de verdad es la base: el formato del WhatsApp y la edad
   mínima son constraints, y `profile_complete` es una columna generada. Acá se
   valida además para poder decir QUÉ campo está mal, que una constraint no
   sabe explicar.

   La edad mínima de 13 años es el piso de COPPA en EE. UU. Concursar sigue
   siendo desde 18: eso lo decide la categoría del concurso, no esta pantalla. */

const EDAD_MINIMA = 13;
const MAX_FOTO = 2 * 1024 * 1024;
const TIPOS_FOTO = ["image/jpeg", "image/png", "image/webp"];

function edadEn(fecha: string): number {
  const nacimiento = new Date(`${fecha}T00:00:00`);
  const hoy = new Date();
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
  return edad;
}

export async function guardarPerfil(
  _previo: Resultado,
  datos: FormData,
): Promise<Resultado> {
  const supabase = await crearClienteServidor();
  const {
    data: { user: credencial },
  } = await supabase.auth.getUser();

  if (!credencial) {
    return { estado: "error", mensaje: "Tu sesión venció. Vuelve a entrar." };
  }

  const nombre = String(datos.get("nombre") ?? "").trim();
  const apellido = String(datos.get("apellido") ?? "").trim();
  const pais = String(datos.get("pais") ?? "").trim();
  const ciudad = String(datos.get("ciudad") ?? "").trim();
  const nacimiento = String(datos.get("nacimiento") ?? "").trim();
  const whatsapp = String(datos.get("whatsapp") ?? "").replace(/[\s()-]/g, "");
  const handle = String(datos.get("handle") ?? "").trim().toLowerCase();
  const foto = datos.get("foto") as File | null;

  if (!nombre) return { estado: "error", campo: "nombre", mensaje: "Falta tu nombre." };
  if (!apellido) return { estado: "error", campo: "apellido", mensaje: "Falta tu apellido." };
  if (!pais) return { estado: "error", campo: "pais", mensaje: "Elige tu país." };
  if (!ciudad) return { estado: "error", campo: "ciudad", mensaje: "Elige tu ciudad." };

  if (!nacimiento) {
    return { estado: "error", campo: "nacimiento", mensaje: "Falta tu fecha de nacimiento." };
  }
  const edad = edadEn(nacimiento);
  if (Number.isNaN(edad) || edad < 0 || edad > 120) {
    return { estado: "error", campo: "nacimiento", mensaje: "Esa fecha no parece correcta." };
  }
  if (edad < EDAD_MINIMA) {
    return {
      estado: "error",
      campo: "nacimiento",
      mensaje: `Para tener cuenta hay que tener al menos ${EDAD_MINIMA} años.`,
    };
  }

  if (!/^\+[1-9][0-9]{6,14}$/.test(whatsapp)) {
    return {
      estado: "error",
      campo: "whatsapp",
      mensaje: "Escribe el número con el código del país, por ejemplo +13055550101.",
    };
  }

  if (handle && !/^[a-z0-9][a-z0-9_-]{2,29}$/.test(handle)) {
    return {
      estado: "error",
      campo: "handle",
      mensaje: "El usuario va en minúsculas, sin espacios ni acentos, de 3 a 30 caracteres.",
    };
  }

  /* La foto se sube ANTES de tocar el perfil. Si fallara después de haber
     guardado los datos, quedaría un perfil apuntando a una imagen que no
     existe. */
  let avatarUrl: string | undefined;
  if (foto && foto.size > 0) {
    if (!TIPOS_FOTO.includes(foto.type)) {
      return { estado: "error", campo: "foto", mensaje: "La foto debe ser JPG, PNG o WebP." };
    }
    if (foto.size > MAX_FOTO) {
      return {
        estado: "error",
        campo: "foto",
        mensaje: `Esa foto pesa ${(foto.size / 1024 / 1024).toFixed(1)} MB y el máximo son 2 MB.`,
      };
    }

    const extension = foto.type.split("/")[1]!.replace("jpeg", "jpg");
    // La carpeta ES el id de la persona: la política de storage solo deja
    // escribir ahí, así que nadie puede pisar la foto de otro.
    const ruta = `${credencial.id}/avatar.${extension}`;

    const { error: falloSubida } = await supabase.storage
      .from("avatares")
      .upload(ruta, foto, { upsert: true, contentType: foto.type });

    if (falloSubida) {
      return { estado: "error", campo: "foto", mensaje: `No se pudo subir la foto: ${falloSubida.message}` };
    }

    const { data: publica } = supabase.storage.from("avatares").getPublicUrl(ruta);
    // El sufijo obliga al navegador a volver a pedirla cuando se reemplaza.
    avatarUrl = `${publica.publicUrl}?v=${Date.now()}`;
  }

  const { error } = await supabase
    .from("users")
    .update({
      first_name: nombre,
      last_name: apellido,
      display_name: `${nombre} ${apellido}`,
      country_id: pais,
      city_id: ciudad,
      birth_date: nacimiento,
      whatsapp,
      ...(handle ? { handle } : {}),
      ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
    })
    .eq("id", credencial.id);

  if (error) {
    if (error.message.includes("users_handle_key")) {
      return { estado: "error", campo: "handle", mensaje: "Ese usuario ya está tomado." };
    }
    if (error.message.includes("users_edad_minima")) {
      return { estado: "error", campo: "nacimiento", mensaje: `Hay que tener al menos ${EDAD_MINIMA} años.` };
    }
    if (error.message.includes("users_whatsapp_formato")) {
      return { estado: "error", campo: "whatsapp", mensaje: "El número tiene que ir en formato internacional." };
    }
    return { estado: "error", mensaje: `No se pudo guardar: ${error.message}` };
  }

  revalidatePath("/mi");
  revalidatePath("/mi/perfil");
  return { estado: "ok", mensaje: "Perfil guardado." };
}
