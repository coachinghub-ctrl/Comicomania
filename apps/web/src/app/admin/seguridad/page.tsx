import { crearClienteServidor } from "@/lib/supabase/server";
import { SegundoFactor } from "./formulario";

export const metadata = { title: "Seguridad" };

/* Sin guard de sección: la seguridad de la propia cuenta no se le niega a
   nadie que ya entró. El layout ya exigió sesión. */
export default async function Seguridad() {
  const supabase = await crearClienteServidor();
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  return (
    <div>
      <p className="text-xs tracking-[0.2em] text-ink-faint uppercase">Tu cuenta</p>
      <h1 className="font-display mt-1 text-3xl text-ink uppercase">Seguridad</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-soft">
        Los permisos que mueven dinero, deciden resultados o reparten accesos
        exigen un segundo factor. No basta con tener el rol: hay que demostrar en
        cada sesión que tienes el teléfono.
      </p>

      <div className="mt-8">
        <SegundoFactor nivelInicial={aal?.currentLevel ?? null} />
      </div>
    </div>
  );
}
