import { notFound } from "next/navigation";
import { puede } from "@comicomania/authz";
import { cargarActor, puedeActor } from "@/lib/autorizacion";
import { crearClienteServidor } from "@/lib/supabase/server";
import { Anular, type VotoSospechoso } from "./anular";

export const metadata = { title: "Votación" };

export default async function Votacion() {
  if (!(await puedeActor({ seccion: "VOTING", accion: "VIEW" }))) notFound();

  const actor = await cargarActor();
  const supabase = await crearClienteServidor();

  const decisionAnular = puede(actor, { seccion: "VOTING", accion: "MANAGE" });

  const { data: votos, error } = await supabase
    .from("votes")
    .select(
      // `votes` apunta dos veces a `users` —quien vota y quien anula—, así que
      // hay que decir por cuál se embebe o PostgREST no sabe cuál elegir.
      "id, status, created_at, invalidated_reason, users!votes_user_id_fkey(display_name, email), participants(users(display_name)), rounds(name, contests(name))",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  const porEstado = (votos ?? []).reduce<Record<string, number>>((acc, v) => {
    acc[v.status] = (acc[v.status] ?? 0) + 1;
    return acc;
  }, {});

  const sospechosos: VotoSospechoso[] = (votos ?? [])
    .filter((v) => v.status === "SUSPECT" || v.status === "PENDING_REVIEW")
    .map((v) => {
      const quien = v.users as { display_name: string | null; email: string | null } | null;
      const part = v.participants as { users: { display_name: string | null } | null } | null;
      return {
        id: v.id,
        quien: quien?.display_name ?? quien?.email ?? "—",
        participante: part?.users?.display_name ?? "—",
        cuando: new Date(v.created_at).toLocaleString("es", {
          dateStyle: "short",
          timeStyle: "short",
        }),
        estado: v.status,
        senal: null,
      };
    });

  return (
    <div>
      <p className="text-xs tracking-[0.2em] text-ink-faint uppercase">Concursos</p>
      <h1 className="font-display mt-1 text-3xl text-ink uppercase">Votación</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-soft">
        Nunca hay voto anónimo: todos cuelgan de una cuenta con email
        verificado, y eso lo comprueba la base, no el formulario.
      </p>

      <div className="mt-4 max-w-2xl rounded-md border border-line bg-surface-2 p-4 text-sm">
        <p className="text-ink-soft">
          <strong>Ningún voto se borra.</strong> Se marca. Un voto borrado no se
          puede auditar, y el día que alguien acuse de haber quitado votos no
          habría con qué responder. La base convierte el borrado en nada.
        </p>
        <p className="mt-2 text-ink-soft">
          Un usuario, un voto por participante y ronda. Es una restricción de la
          base —no una comprobación en código— así que no hay carrera ni
          reintento que la burle.
        </p>
      </div>

      {error && (
        <p role="alert" className="mt-6 rounded-md border border-red-600/40 bg-red-700/5 p-3 text-sm text-red-700">
          No se pudo leer la votación: {error.message}
        </p>
      )}

      <section className="mt-8">
        <h2 className="font-display text-lg text-ink uppercase">Estado de los votos</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-4">
          {[
            { clave: "VALID", etiqueta: "Válidos" },
            { clave: "SUSPECT", etiqueta: "Sospechosos" },
            { clave: "PENDING_REVIEW", etiqueta: "En revisión" },
            { clave: "INVALIDATED", etiqueta: "Anulados" },
          ].map((e) => (
            <div key={e.clave} className="rounded-lg border border-line bg-surface-2 px-5 py-4">
              <dt className="text-xs tracking-wider text-ink-faint uppercase">
                {e.etiqueta}
              </dt>
              <dd className="font-display mt-1 text-3xl text-red-600 tabular-nums">
                {porEstado[e.clave] ?? 0}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-2 text-xs text-ink-faint">
          Sobre los últimos 200 votos de tu territorio.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-lg text-ink uppercase">
          Cola de revisión
        </h2>
        <p className="mt-1 text-sm text-ink-soft">
          Lo que el antifraude marcó pero no decidió. La máquina señala; la
          decisión de anular es de una persona, y queda firmada.
        </p>

        {sospechosos.length === 0 ? (
          <p className="mt-4 rounded-lg border border-line bg-surface-2 p-6 text-sm text-ink-soft">
            No hay votos marcados. Cuando los haya, aparecerán aquí agrupados
            para poder anular una ráfaga entera de una vez.
          </p>
        ) : !decisionAnular.permitido ? (
          <div className="mt-4 rounded-lg border border-gold-700/40 bg-gold-400/5 p-4 text-sm">
            <p className="text-ink">
              Hay {sospechosos.length} votos marcados, pero no puedes anularlos.
            </p>
            <p className="mt-1 text-ink-soft">
              {decisionAnular.motivo === "MFA_REQUERIDA" ? (
                <>
                  Anular votos exige segundo factor.{" "}
                  <a href="/admin/seguridad" className="text-red-600 underline">
                    Verifícalo en Seguridad
                  </a>
                  .
                </>
              ) : (
                "Tu acceso no incluye administrar la votación."
              )}
            </p>
          </div>
        ) : (
          <div className="mt-4">
            <Anular votos={sospechosos} />
          </div>
        )}
      </section>
    </div>
  );
}
