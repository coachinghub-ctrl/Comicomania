import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await crearClienteServidor();
  await supabase.auth.signOut();
  redirect("/");
}
