"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/server";

export type Resultado =
  | { estado: "inicial" }
  | { estado: "ok"; mensaje: string }
  | { estado: "error"; mensaje: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/* "Quiero contratarte".

   Esto se puede mandar SIN cuenta, a propósito y al revés que la inscripción
   a un concurso. Quien contrata es una empresa que busca a alguien para su
   cena de fin de año: obligarla a crear una cuenta en una plataforma de
   humor para pedir un presupuesto es perder el encargo.

   La diferencia con el concurso no es de criterio suelto: allí hay que ceder
   derechos sobre un video y eso tiene que quedar a nombre de una persona.
   Aquí solo se pide un precio.

   Leerlas sí necesita permiso: la política de la base deja INSERTAR a
   cualquiera y SELECT solo a quien tiene BOOKINGS.VIEW, al humorista o al
   propio cliente. */
export async function pedirPresupuesto(
  _previo: Resultado,
  datos: FormData,
): Promise<Resultado> {
  const supabase = await crearClienteServidor();

  const talento = String(datos.get("talento") ?? "").trim();
  const handle = String(datos.get("handle") ?? "").trim();
  const nombre = String(datos.get("nombre") ?? "").trim();
  const empresa = String(datos.get("empresa") ?? "").trim();
  const email = String(datos.get("email") ?? "").trim().toLowerCase();
  const telefono = String(datos.get("telefono") ?? "").trim();
  const tipo = String(datos.get("tipo") ?? "").trim();
  const fecha = String(datos.get("fecha") ?? "").trim();
  const presupuesto = String(datos.get("presupuesto") ?? "").trim();
  const mensaje = String(datos.get("mensaje") ?? "").trim();

  if (!nombre) return { estado: "error", mensaje: "Falta tu nombre." };
  if (!EMAIL.test(email)) {
    return { estado: "error", mensaje: "Ese correo no parece válido." };
  }
  if (!talento) {
    return { estado: "error", mensaje: "No se sabe a quién quieres contratar." };
  }

  /* Si quien pide tiene sesión abierta, la solicitud queda atada a su cuenta
     y así puede seguirla desde su espacio. Si no, sigue valiendo. */
  const {
    data: { user: credencial },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("booking_requests").insert({
    talent_id: talento,
    client_user_id: credencial?.id ?? null,
    client_company: empresa || null,
    contact_name: nombre,
    email,
    phone: telefono || null,
    event_type: tipo || null,
    event_date: fecha || null,
    budget_amount: presupuesto ? Number(presupuesto) : null,
    currency: "USD",
    message: mensaje || null,
    status: "NEW",
  });

  if (error) {
    return {
      estado: "error",
      mensaje: `No se pudo enviar: ${error.message}`,
    };
  }

  revalidatePath("/admin/talento/contrataciones");

  return {
    estado: "ok",
    mensaje: handle
      ? "Recibido. El equipo de contrataciones te escribe a ese correo."
      : "Recibido.",
  };
}
