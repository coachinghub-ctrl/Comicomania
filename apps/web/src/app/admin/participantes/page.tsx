import { notFound } from "next/navigation";
import { alcanceDelActor, puedeActor } from "@/lib/autorizacion";
import { crearClienteServidor } from "@/lib/supabase/server";

export const metadata = { title: "Participantes" };

const COLOR_ESTADO: Record<string, string> = {
  REGISTERED: "text-ink-soft",
  VERIFIED: "text-success-ink",
  SUBMITTED: "text-success-ink",
  ADVANCED: "text-success-ink",
  ELIMINATED: "text-ink-faint",
  WITHDRAWN: "text-ink-faint",
  DISQUALIFIED: "text-red-700",
};

/* La verificación de edad es escalonada a propósito: se declara al
   inscribirse y el documento se exige solo al clasificar a semifinal o final.
   Pedirlo antes mata la conversión; no pedirlo nunca es un problema el día que
   se entrega un premio. Un MISMATCH abre un caso, no una descalificación. */
const VERIFICACION: Record<string, { texto: string; color: string }> = {
  DECLARED: { texto: "Declarada", color: "text-ink-faint" },
  DOCUMENT_REQUESTED: { texto: "Documento pedido", color: "text-red-600" },
  VERIFIED: { texto: "Verificada", color: "text-success-ink" },
  MISMATCH: { texto: "No coincide", color: "text-red-700" },
};

export default async function Participantes() {
  if (!(await puedeActor({ seccion: "PARTICIPANTS", accion: "VIEW" }))) notFound();

  const alcance = await alcanceDelActor("PARTICIPANTS");
  const supabase = await crearClienteServidor();

  /* Sin filtro de territorio a mano: lo aplica RLS comparando el path del
     concurso contra el alcance del grant. Si esta consulta se escribiera mal,
     la base seguiría sin devolver a nadie de otra ciudad. */
  const { data: participantes, error } = await supabase
    .from("participants")
    .select(
      "id, status, registered_at, age_at_reference, age_verification, users(display_name, email), categories(name, min_age, max_age), contests(name, slug, cities(name), countries(name))",
    )
    .order("registered_at", { ascending: false })
    .limit(100);

  return (
    <div>
      <p className="text-xs tracking-[0.2em] text-ink-faint uppercase">Concursos</p>
      <h1 className="font-display mt-1 text-3xl text-ink uppercase">Participantes</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-soft">
        {alcance.global
          ? "Ves los inscritos de todos los territorios."
          : `Ves los inscritos de ${alcance.paths.join(", ") || "ningún territorio"}.`}
      </p>

      {error && (
        <p role="alert" className="mt-6 rounded-md border border-red-600/40 bg-red-700/5 p-3 text-sm text-red-700">
          No se pudo leer el listado: {error.message}
        </p>
      )}

      {!error && (participantes?.length ?? 0) === 0 && (
        <div className="mt-8 rounded-lg border border-line bg-surface-2 p-8">
          <p className="text-ink">Todavía no hay inscritos.</p>
          <p className="mt-2 text-sm text-ink-soft">
            Aparecerán aquí en cuanto se abra un concurso y alguien se inscriba.
            La categoría se asigna sola desde la edad congelada: nadie la elige,
            y por eso no se puede inscribir como juvenil quien tiene treinta.
          </p>
        </div>
      )}

      {(participantes?.length ?? 0) > 0 && (
        <div className="mt-8 overflow-x-auto rounded-lg border border-line">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-2 text-xs tracking-wider text-ink-faint uppercase">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Persona</th>
                <th scope="col" className="px-4 py-3 font-medium">Concurso</th>
                <th scope="col" className="px-4 py-3 font-medium">Categoría</th>
                <th scope="col" className="px-4 py-3 font-medium">Edad</th>
                <th scope="col" className="px-4 py-3 font-medium">Inscrito</th>
                <th scope="col" className="px-4 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {participantes!.map((p, i) => {
                const persona = p.users as { display_name: string | null; email: string | null } | null;
                const categoria = p.categories as { name: string; min_age: number | null; max_age: number | null } | null;
                const concurso = p.contests as {
                  name: string;
                  cities: { name: string } | null;
                  countries: { name: string } | null;
                } | null;
                const verif = VERIFICACION[p.age_verification] ?? {
                  texto: p.age_verification,
                  color: "text-ink-faint",
                };
                return (
                  <tr key={p.id} className={i % 2 === 1 ? "bg-surface-2" : undefined}>
                    <td className="px-4 py-3">
                      <span className="block text-ink">
                        {persona?.display_name ?? "—"}
                      </span>
                      <span className="block text-xs text-ink-soft">
                        {persona?.email}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink-soft">
                      {concurso?.name ?? "—"}
                      <span className="block text-xs text-ink-faint">
                        {concurso?.cities?.name ?? concurso?.countries?.name ?? ""}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink-soft">
                      {categoria?.name ?? "Sin asignar"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-ink tabular-nums">
                        {p.age_at_reference ?? "—"}
                      </span>
                      <span className={`block text-xs ${verif.color}`}>
                        {verif.texto}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink-soft tabular-nums">
                      {new Date(p.registered_at).toLocaleDateString("es")}
                    </td>
                    <td className="px-4 py-3">
                      <span className={COLOR_ESTADO[p.status] ?? "text-ink-soft"}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
