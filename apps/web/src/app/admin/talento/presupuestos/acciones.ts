"use server";

import { revalidatePath } from "next/cache";
import { puede } from "@comicomania/authz";
import { cargarActor } from "@/lib/autorizacion";
import { crearClienteServidor } from "@/lib/supabase/server";

export type Resultado =
  | { estado: "inicial" }
  | { estado: "ok"; mensaje: string }
  | { estado: "error"; mensaje: string };

const RUTA = "/admin/talento/presupuestos";

async function permiso(accion: "VIEW" | "EDIT" = "EDIT") {
  const actor = await cargarActor();
  const decision = puede(actor, { seccion: "BOOKINGS", accion });
  return { actor, decision };
}

async function anotar(
  objeto: string,
  id: string,
  valor: Record<string, string | number | boolean | null>,
) {
  const { actor, decision } = await permiso();
  const supabase = await crearClienteServidor();
  await supabase.from("audit_logs").insert({
    actor_user_id: actor.usuarioId,
    actor_role: decision.grant?.rol ?? null,
    section: "BOOKINGS",
    action: "EDIT",
    object_type: objeto,
    object_id: id,
    new_value: valor,
    result: "ALLOWED",
  });
}

/* Crear un presupuesto desde una solicitud.

   Nace CON su línea de caché, no vacío: un presupuesto sin la línea principal
   es una hoja en blanco, y lo primero que se hace en una hoja en blanco es
   escribir el precio a ojo. La línea sale del tarifario del humorista para la
   duración pedida, así que el precio de partida es el que está acordado y no
   el que alguien recuerda.

   Es la misma regla que ya rige en la casa: nace entero o no nace. */
export async function crearPresupuesto(
  _previo: Resultado,
  datos: FormData,
): Promise<Resultado> {
  const { actor, decision } = await permiso();
  if (!decision.permitido) {
    return {
      estado: "error",
      mensaje: `No permitido: ${decision.motivo.toLowerCase().replaceAll("_", " ")}.`,
    };
  }

  const supabase = await crearClienteServidor();

  const solicitudId = String(datos.get("solicitud") ?? "").trim();
  const minutos = Number(String(datos.get("minutos") ?? "").trim());
  const comision = Number(String(datos.get("comision") ?? "15").trim());
  const impuesto = Number(String(datos.get("impuesto") ?? "0").trim());
  const descuento = Number(String(datos.get("descuento") ?? "0").trim());
  const vigencia = Number(String(datos.get("vigencia") ?? "30").trim());
  const notas = String(datos.get("notas") ?? "").trim();

  if (!solicitudId) {
    return { estado: "error", mensaje: "Elige la solicitud que vas a cotizar." };
  }
  if (!Number.isFinite(minutos) || minutos <= 0) {
    return { estado: "error", mensaje: "Elige la duración del show." };
  }

  const { data: solicitud } = await supabase
    .from("booking_requests")
    .select("id, talent_id, contact_name, client_company, currency")
    .eq("id", solicitudId)
    .maybeSingle();

  if (!solicitud) {
    return { estado: "error", mensaje: "Esa solicitud no existe o no la alcanzas." };
  }

  // La tarifa acordada para esa duración. Primero la del mercado, si la hay.
  const { data: tarifa } = await supabase
    .from("talent_rates")
    .select("fee, currency")
    .eq("talent_id", solicitud.talent_id)
    .eq("set_minutes", minutos)
    .order("market", { ascending: true, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  if (!tarifa) {
    return {
      estado: "error",
      mensaje: `No hay tarifa para ${minutos} minutos. Ponla abajo en el tarifario antes de cotizar: improvisar el precio de partida es como se pierde dinero sin enterarse.`,
    };
  }

  const vence = new Date();
  vence.setDate(vence.getDate() + (Number.isFinite(vigencia) ? vigencia : 30));

  // Qué versión toca: la siguiente de esta solicitud.
  const { data: ultima } = await supabase
    .from("booking_quotes")
    .select("version")
    .eq("booking_id", solicitudId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: presupuesto, error } = await supabase
    .from("booking_quotes")
    .insert({
      booking_id: solicitudId,
      talent_id: solicitud.talent_id,
      version: (ultima?.version ?? 0) + 1,
      currency: tarifa.currency ?? solicitud.currency ?? "USD",
      discount: Number.isFinite(descuento) ? descuento : 0,
      commission_pct: Number.isFinite(comision) ? comision : 0,
      tax_pct: Number.isFinite(impuesto) ? impuesto : 0,
      valid_until: vence.toISOString().slice(0, 10),
      notes: notas || null,
      created_by: actor.usuarioId,
      status: "DRAFT",
    })
    .select("id, version")
    .single();

  if (error) {
    return { estado: "error", mensaje: `No se pudo crear: ${error.message}` };
  }

  const { error: falloLinea } = await supabase.from("quote_lines").insert({
    quote_id: presupuesto.id,
    concept: `Show de ${minutos} minutos`,
    kind: "FEE",
    quantity: 1,
    unit_price: tarifa.fee,
    order: 1,
  });

  /* Si la línea falla, el presupuesto queda en blanco. Se borra en vez de
     dejarlo a medias: está en borrador, nadie lo ha visto. */
  if (falloLinea) {
    await supabase.from("booking_quotes").delete().eq("id", presupuesto.id);
    return {
      estado: "error",
      mensaje: `No se pudo montar el presupuesto, así que no se creó a medias: ${falloLinea.message}`,
    };
  }

  await anotar("booking_quote", presupuesto.id, {
    version: presupuesto.version,
    minutos,
    tarifa: tarifa.fee,
  });

  revalidatePath(RUTA);
  revalidatePath("/admin/talento/contrataciones");

  return {
    estado: "ok",
    mensaje: `Presupuesto v${presupuesto.version} creado en borrador para ${solicitud.client_company ?? solicitud.contact_name}, con la tarifa de ${minutos} minutos. Añádele viaje, hotel y técnica antes de enviarlo.`,
  };
}

export async function anadirLinea(
  _previo: Resultado,
  datos: FormData,
): Promise<Resultado> {
  const { decision } = await permiso();
  if (!decision.permitido) {
    return { estado: "error", mensaje: "No tienes permiso para editar presupuestos." };
  }

  const supabase = await crearClienteServidor();

  const quoteId = String(datos.get("presupuesto") ?? "").trim();
  const concepto = String(datos.get("concepto") ?? "").trim();
  const tipo = String(datos.get("tipo") ?? "OTHER").trim();
  const cantidad = Number(String(datos.get("cantidad") ?? "1").trim());
  const precio = Number(String(datos.get("precio") ?? "").trim());

  if (!concepto) return { estado: "error", mensaje: "Ponle concepto a la línea." };
  if (!Number.isFinite(cantidad) || cantidad <= 0) {
    return { estado: "error", mensaje: "La cantidad tiene que ser mayor que cero." };
  }
  if (!Number.isFinite(precio) || precio < 0) {
    return { estado: "error", mensaje: "El precio no puede ser negativo." };
  }

  const { data: ultima } = await supabase
    .from("quote_lines")
    .select("order")
    .eq("quote_id", quoteId)
    .order("order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("quote_lines").insert({
    quote_id: quoteId,
    concept: concepto,
    kind: tipo,
    quantity: cantidad,
    unit_price: precio,
    order: (ultima?.order ?? 0) + 1,
  });

  if (error) {
    return {
      estado: "error",
      mensaje: error.message.includes("ya se envió")
        ? "Ese presupuesto ya se envió: no se le pueden tocar las líneas. Emite una versión nueva."
        : `No se pudo añadir: ${error.message}`,
    };
  }

  revalidatePath(RUTA);
  return { estado: "ok", mensaje: `"${concepto}" añadido.` };
}

export async function quitarLinea(
  _previo: Resultado,
  datos: FormData,
): Promise<Resultado> {
  const { decision } = await permiso();
  if (!decision.permitido) {
    return { estado: "error", mensaje: "No tienes permiso para editar presupuestos." };
  }

  const supabase = await crearClienteServidor();
  const lineaId = String(datos.get("linea") ?? "").trim();

  const { error } = await supabase.from("quote_lines").delete().eq("id", lineaId);
  if (error) {
    return {
      estado: "error",
      mensaje: error.message.includes("ya se envió")
        ? "Ese presupuesto ya se envió: sus líneas no se tocan."
        : `No se pudo quitar: ${error.message}`,
    };
  }

  revalidatePath(RUTA);
  return { estado: "ok", mensaje: "Línea quitada." };
}

/* Enviar, aceptar, rechazar.

   Enviar es el punto de no retorno: a partir de ahí las cifras quedan
   congeladas, porque el cliente tiene un número en la mano. La base lo
   impone; aquí solo se dice antes.

   Aceptar mueve la solicitud a ganada, y eso también lo hace la base: si
   dependiera de esta pantalla, el embudo diría que nadie ha cerrado nada
   mientras los contratos se firman. */
export async function moverPresupuesto(
  _previo: Resultado,
  datos: FormData,
): Promise<Resultado> {
  const { decision } = await permiso();
  if (!decision.permitido) {
    return { estado: "error", mensaje: "No tienes permiso para editar presupuestos." };
  }

  const supabase = await crearClienteServidor();
  const quoteId = String(datos.get("presupuesto") ?? "").trim();
  const nuevo = String(datos.get("nuevo") ?? "").trim();

  if (!["SENT", "ACCEPTED", "REJECTED", "EXPIRED"].includes(nuevo)) {
    return { estado: "error", mensaje: "Ese estado no existe." };
  }

  // Enviar un presupuesto de una sola línea suele ser un olvido, no una
  // decisión: el viaje y el hotel se cobran igual aunque no estén escritos.
  if (nuevo === "SENT") {
    const { count } = await supabase
      .from("quote_lines")
      .select("id", { count: "exact", head: true })
      .eq("quote_id", quoteId);

    if ((count ?? 0) === 0) {
      return {
        estado: "error",
        mensaje: "Este presupuesto no tiene ni una línea. No hay nada que enviar.",
      };
    }
  }

  const ahora = new Date().toISOString();
  const { data: presupuesto, error } = await supabase
    .from("booking_quotes")
    .update({
      status: nuevo,
      ...(nuevo === "SENT" ? { sent_at: ahora } : {}),
      ...(nuevo === "ACCEPTED" || nuevo === "REJECTED"
        ? { decided_at: ahora }
        : {}),
    })
    .eq("id", quoteId)
    .select("version, total, currency")
    .single();

  if (error) {
    return { estado: "error", mensaje: `No se pudo mover: ${error.message}` };
  }

  await anotar("booking_quote", quoteId, { estado: nuevo });

  revalidatePath(RUTA);
  revalidatePath("/admin/talento/contrataciones");

  const dicho: Record<string, string> = {
    SENT: `enviado por ${presupuesto.total} ${presupuesto.currency}. Sus cifras quedan congeladas: para cambiarlas, emite otra versión.`,
    ACCEPTED: "aceptado. La solicitud pasó a ganada.",
    REJECTED: "rechazado.",
    EXPIRED: "marcado como caducado.",
  };

  return {
    estado: "ok",
    mensaje: `Presupuesto v${presupuesto.version} ${dicho[nuevo]}`,
  };
}

/* El tarifario.

   Existe para que el precio de partida de un presupuesto no dependa de lo que
   alguien recuerde un martes por la tarde. */
export async function guardarTarifa(
  _previo: Resultado,
  datos: FormData,
): Promise<Resultado> {
  const { decision } = await permiso();
  if (!decision.permitido) {
    return { estado: "error", mensaje: "No tienes permiso para editar tarifas." };
  }

  const supabase = await crearClienteServidor();

  const talento = String(datos.get("talento") ?? "").trim();
  const minutos = Number(String(datos.get("minutos") ?? "").trim());
  const tarifa = Number(String(datos.get("tarifa") ?? "").trim());
  const moneda = String(datos.get("moneda") ?? "USD").trim().toUpperCase();
  const mercado = String(datos.get("mercado") ?? "").trim().toUpperCase();

  if (!talento) return { estado: "error", mensaje: "Elige el humorista." };
  if (!Number.isFinite(minutos) || minutos <= 0 || minutos > 240) {
    return { estado: "error", mensaje: "La duración va entre 1 y 240 minutos." };
  }
  if (!Number.isFinite(tarifa) || tarifa < 0) {
    return { estado: "error", mensaje: "La tarifa no puede ser negativa." };
  }

  const { error } = await supabase.from("talent_rates").upsert(
    {
      talent_id: talento,
      set_minutes: minutos,
      fee: tarifa,
      currency: moneda,
      market: mercado || null,
    },
    { onConflict: mercado ? "talent_id,set_minutes,market" : "talent_id,set_minutes" },
  );

  if (error) {
    return { estado: "error", mensaje: `No se pudo guardar: ${error.message}` };
  }

  await anotar("talent_rate", talento, { minutos, tarifa, mercado: mercado || null });

  revalidatePath(RUTA);
  return {
    estado: "ok",
    mensaje: `Tarifa de ${minutos} min guardada: ${tarifa} ${moneda}${mercado ? ` para ${mercado}` : ""}.`,
  };
}
