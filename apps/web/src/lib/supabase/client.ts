"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./tipos";

/* Cliente de navegador. Solo la anon key: toda la autoridad real vive en RLS
   y en has_permission(), nunca en lo que el cliente diga que es. */
export function crearClienteNavegador() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
