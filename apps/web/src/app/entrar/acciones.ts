"use server";

import { headers } from "next/headers";
import type { Route } from "next";
import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/server";
import { rutaSegura } from "@/lib/volver";
import { proveedoresActivos } from "./activos";
import { PROVEEDORES, type Proveedor } from "./catalogo";

export type EstadoEnvio =
  | { estado: "inicial" }
  | { estado: "enviado"; email: string }
  | { estado: "error"; mensaje: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/* Dónde vive el sitio, según desde dónde se pida.

   En local el host no lleva TLS: con https el enlace de vuelta caería fuera
   de la lista blanca de Supabase y volvería roto. */
async function origenDelSitio(): Promise<string> {
  const cabeceras = await headers();
  const host = cabeceras.get("host") ?? "localhost:3100";
  const esquema =
    host.startsWith("localhost") || host.startsWith("127.0.0.1")
      ? "http"
      : "https";
  return process.env.NEXT_PUBLIC_SITE_URL ?? `${esquema}://${host}`;
}

export async function enviarEnlace(
  _previo: EstadoEnvio,
  datos: FormData,
): Promise<EstadoEnvio> {
  const email = String(datos.get("email") ?? "").trim().toLowerCase();
  const volver = rutaSegura(String(datos.get("volver") ?? ""));

  if (!EMAIL.test(email)) {
    return { estado: "error", mensaje: "Ese email no parece válido." };
  }

  const origen = await origenDelSitio();
  const supabase = await crearClienteServidor();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      // El trigger de la base crea el COMICOMANIA ID al nacer la credencial.
      shouldCreateUser: true,
      emailRedirectTo: `${origen}/auth/confirmar?volver=${encodeURIComponent(volver)}`,
    },
  });

  if (error) {
    // No se filtra si el email existe o no: eso permitiría enumerar usuarios.
    return {
      estado: "error",
      mensaje: "No pudimos enviar el enlace. Inténtalo de nuevo en un minuto.",
    };
  }

  return { estado: "enviado", email };
}

/* Entrar con Google, Apple o Microsoft.

   Supabase devuelve la dirección del proveedor y aquí se redirige. El código
   que vuelve lo canjea /auth/confirmar, que ya sabía hacerlo para el enlace
   por correo: es el mismo mecanismo PKCE, así que no hace falta una segunda
   puerta de entrada — y no tenerla es lo que impide que se olvide cerrar una.

   Qué pide cada uno, y qué NO:
     · Google    manda nombre, apellido y foto.
     · Microsoft manda el nombre completo.
     · Apple     manda el nombre SOLO la primera vez que autorizas, y puede
                 dar un correo de reenvío privado en vez del real.

   Solo se piden los datos básicos. Nada de contactos, calendario ni archivos:
   pedir permisos que no se van a usar es la forma más rápida de que alguien
   cancele la pantalla del proveedor.

   El perfil sigue siendo obligatorio después. El proveedor ahorra el nombre y
   la foto; la ciudad, la fecha de nacimiento y el WhatsApp los pone la
   persona, porque de eso dependen la categoría del concurso y el aviso de que
   pasó de ronda. */
export async function entrarConProveedor(datos: FormData): Promise<void> {
  const pedido = String(datos.get("proveedor") ?? "");
  const volver = rutaSegura(String(datos.get("volver") ?? ""));

  if (!(pedido in PROVEEDORES)) {
    redirect("/entrar?error=proveedor_desconocido" as Route);
  }
  const proveedor = pedido as Proveedor;

  /* Se vuelve a comprobar aquí y no solo al pintar el botón: un formulario se
     envía a mano. Sin esto, la persona acabaría en una página de error en
     JSON de Supabase, que es exactamente lo que pasaba antes de mirarlo. */
  const activos = await proveedoresActivos();
  if (!activos.includes(proveedor)) {
    redirect(
      `/entrar?error=proveedor_no_disponible&p=${proveedor}` as Route,
    );
  }

  const origen = await origenDelSitio();
  const supabase = await crearClienteServidor();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: proveedor,
    options: {
      redirectTo: `${origen}/auth/confirmar?volver=${encodeURIComponent(volver)}`,
      // Apple y Microsoft necesitan que se pidan los datos de la persona.
      scopes: proveedor === "apple" ? "name email" : undefined,
    },
  });

  if (error || !data?.url) {
    /* El motivo más común es que el proveedor no esté configurado todavía en
       Supabase. Se dice así y no "algo salió mal": quien administra necesita
       saber dónde mirar, y quien entra necesita saber que no es culpa suya. */
    redirect(`/entrar?error=proveedor_no_disponible&p=${proveedor}` as Route);
  }

  /* Aquí sí se sale del sitio, y es lo correcto: la dirección la acaba de
     construir Supabase con el proveedor elegido, no viene de la URL. */
  redirect(data.url as Route);
}
