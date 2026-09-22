import type { Route } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@comicomania/ui";
import { crearClienteServidor } from "@/lib/supabase/server";
import { FormularioPerfil, type Ciudad, type Opcion } from "./formulario";

export const metadata = { title: "Tu perfil" };

export default async function Perfil({
  searchParams,
}: {
  searchParams: Promise<{ primera?: string }>;
}) {
  const { primera } = await searchParams;
  const supabase = await crearClienteServidor();

  const {
    data: { user: credencial },
  } = await supabase.auth.getUser();
  if (!credencial) redirect("/entrar?volver=/mi/perfil" as Route);

  const [{ data: yo }, { data: paises }, { data: ciudades }] = await Promise.all([
    supabase
      .from("users")
      .select("first_name, last_name, country_id, city_id, birth_date, whatsapp, handle, avatar_url, email, profile_complete")
      .eq("id", credencial.id)
      .single(),
    supabase.from("countries").select("id, name").eq("is_active", true).order("name"),
    supabase.from("cities").select("id, name, country_id").eq("is_active", true).order("name"),
  ]);

  const esPrimeraVez = primera === "1" || !yo?.profile_complete;

  return (
    <main className="min-h-dvh">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-5 py-5">
        <a href="/">
          <Logo ancho={120} prioridad />
        </a>
        {!esPrimeraVez && (
          <a href="/mi" className="text-sm text-muted transition-colors hover:text-paper-pure">
            Volver
          </a>
        )}
      </header>

      <div className="mx-auto max-w-3xl px-5 pb-20">
        <h1 className="font-display text-4xl text-paper uppercase">
          {esPrimeraVez ? "Completa tu perfil" : "Tu perfil"}
        </h1>

        {esPrimeraVez ? (
          <p className="mt-3 max-w-xl text-muted">
            Te falta un paso antes de entrar. Son datos que hacen falta de
            verdad: sin ciudad no sabemos qué concursos te tocan, sin fecha de
            nacimiento no hay categoría, y sin WhatsApp no hay cómo avisarte si
            pasas de ronda.
          </p>
        ) : (
          <p className="mt-3 max-w-xl text-muted">
            Esto es lo que ve la comunidad de ti, y lo que usamos para saber qué
            concursos te corresponden.
          </p>
        )}

        <div className="mt-8">
          <FormularioPerfil
            actual={{
              nombre: yo?.first_name ?? "",
              apellido: yo?.last_name ?? "",
              paisId: yo?.country_id ?? "",
              ciudadId: yo?.city_id ?? "",
              nacimiento: yo?.birth_date ?? "",
              whatsapp: yo?.whatsapp ?? "",
              handle: yo?.handle ?? "",
              avatarUrl: yo?.avatar_url ?? null,
              email: yo?.email ?? credencial.email ?? "",
            }}
            paises={(paises ?? []).map((p): Opcion => ({ id: p.id, nombre: p.name }))}
            ciudades={(ciudades ?? []).map((c): Ciudad => ({
              id: c.id,
              nombre: c.name,
              paisId: c.country_id,
            }))}
          />
        </div>

        <p className="mt-8 max-w-xl text-xs text-muted-dim">
          Tu WhatsApp y tu fecha de nacimiento no son públicos: los ve quien
          administra tu territorio, y nadie más. Tu foto, tu nombre y tu usuario
          sí, porque son tu cara en la comunidad.
        </p>
      </div>
    </main>
  );
}
