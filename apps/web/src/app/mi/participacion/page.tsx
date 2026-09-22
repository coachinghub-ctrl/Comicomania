import type { Route } from "next";
import { redirect } from "next/navigation";
import { ButtonLink, Logo } from "@comicomania/ui";
import { Reel } from "@/componentes/reel";
import { crearClienteServidor } from "@/lib/supabase/server";

export const metadata = { title: "Mi participación" };

/* Mi participación: dónde está mi video.

   Esta pantalla existe porque enviar un video y no volver a saber nada es la
   forma más rápida de perder a alguien. Lo que se responde aquí es una sola
   pregunta: ¿en qué punto está lo mío?

   Los estados se dicen en castellano y con lo que implican, no con la palabra
   de la base. "IN_REVIEW" no le dice nada a nadie; "alguien lo está mirando"
   sí. */

const ESTADO: Record<
  string,
  { texto: string; explica: string; clase: string }
> = {
  DRAFT: {
    texto: "Sin enviar",
    explica: "Todavía no entró a la cola.",
    clase: "text-muted-dim",
  },
  SUBMITTED: {
    texto: "Enviado",
    explica:
      "Está en la cola de revisión. Se mira en orden de llegada, por personas, no por un filtro automático: por eso tarda.",
    clase: "text-gold-400",
  },
  IN_REVIEW: {
    texto: "Lo están mirando",
    explica: "Alguien del equipo lo tiene abierto ahora mismo.",
    clase: "text-gold-400",
  },
  CHANGES_REQUESTED: {
    texto: "Necesita un ajuste",
    explica:
      "No está rechazado. Abajo está el comentario exacto: corrige eso y vuelve a mandarlo.",
    clase: "text-red-300",
  },
  APPROVED: {
    texto: "Aprobado",
    explica: "Pasó la revisión. Entra a la ronda que le toque.",
    clase: "text-success",
  },
  PUBLISHED: {
    texto: "Publicado",
    explica: "Ya se puede ver y votar. Los votos los traes tú.",
    clase: "text-success",
  },
  REJECTED: {
    texto: "Rechazado",
    explica: "Abajo está el motivo. Se puede apelar.",
    clase: "text-red-300",
  },
  BLOCKED: {
    texto: "Bloqueado",
    explica: "Hay un caso abierto sobre este video.",
    clase: "text-red-300",
  },
};

const DERECHOS: Record<string, string> = {
  PENDING: "Sin comprobar todavía",
  DECLARED: "Declaraste que el material es tuyo. Falta comprobarlo.",
  REVIEW_REQUIRED: "Hay algo que suena o se ve y hay que mirarlo.",
  CLEARED: "Comprobado: se puede publicar.",
  RESTRICTED: "Se puede usar, pero con límites.",
  BLOCKED: "No se puede publicar con ese material.",
};

export default async function MiParticipacion() {
  const supabase = await crearClienteServidor();

  const {
    data: { user: credencial },
  } = await supabase.auth.getUser();
  if (!credencial) redirect("/entrar?volver=/mi/participacion" as Route);

  const [{ data: inscripciones }, { data: videos }] = await Promise.all([
    supabase
      .from("participants")
      .select(
        "id, contest_id, status, registered_at, age_at_reference, contests(slug, name, status, submission_deadline), categories(name)",
      )
      .eq("user_id", credencial.id)
      .order("registered_at", { ascending: false }),
    supabase
      .from("videos")
      .select(
        "id, title, description, status, rights_status, duration_s, master_url, created_at, contest_id, video_reviews(decision, notes, created_at)",
      )
      .eq("user_id", credencial.id)
      .order("created_at", { ascending: false }),
  ]);

  const lista = (inscripciones ?? []) as unknown as {
    id: string;
    contest_id: string;
    status: string;
    registered_at: string;
    age_at_reference: number | null;
    contests: {
      slug: string;
      name: string;
      status: string;
      submission_deadline: string | null;
    } | null;
    categories: { name: string } | null;
  }[];

  const misVideos = (videos ?? []) as unknown as {
    id: string;
    title: string;
    description: string | null;
    status: string;
    rights_status: string;
    duration_s: number | null;
    master_url: string | null;
    created_at: string;
    contest_id: string;
    video_reviews: { decision: string; notes: string | null; created_at: string }[];
  }[];

  return (
    <main className="min-h-dvh">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-5 py-5">
        <a href="/" aria-label="COMICOMANÍA">
          <Logo ancho={120} prioridad />
        </a>
        <a href="/mi" className="text-sm text-muted hover:text-paper-pure">
          Mi COMICOMANÍA
        </a>
      </header>

      <div className="mx-auto max-w-3xl px-5 pb-16">
        <h1 className="font-display text-4xl text-paper uppercase">
          Mi participación
        </h1>

        {lista.length === 0 ? (
          <section className="mt-8 rounded-lg border border-stage-600 bg-stage-900 p-6">
            <p className="text-muted">
              Todavía no estás inscrito en ningún concurso.
            </p>
            <ButtonLink href={"/participa" as Route} tamano="lg" className="mt-5">
              Ver cómo participar
            </ButtonLink>
          </section>
        ) : (
          <ul className="mt-8 space-y-8">
            {lista.map((p) => {
              /* El video de ESTE concurso, y el más reciente si mandó
                 varios: la consulta ya viene ordenada por fecha. */
              const suyo = misVideos.find((v) => v.contest_id === p.contest_id);
              const estado = suyo ? ESTADO[suyo.status] : null;
              const revision = suyo?.video_reviews
                ?.slice()
                .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];

              return (
                <li
                  key={p.id}
                  className="rounded-lg border border-stage-600 bg-stage-900 p-6"
                >
                  <p className="text-xs tracking-[0.2em] text-gold-400 uppercase">
                    {p.contests?.name}
                  </p>
                  <h2 className="font-display mt-1 text-2xl text-paper uppercase">
                    {suyo?.title ?? "Sin video todavía"}
                  </h2>

                  <p className="mt-2 text-sm text-muted-dim">
                    Categoría {p.categories?.name ?? "sin asignar"}
                    {p.age_at_reference !== null
                      ? ` · ${p.age_at_reference} años a la fecha del concurso`
                      : ""}
                  </p>

                  {suyo && estado && (
                    <>
                      <p className={`mt-5 font-display text-xl uppercase ${estado.clase}`}>
                        {estado.texto}
                      </p>
                      <p className="mt-1 text-muted">{estado.explica}</p>

                      <p className="mt-3 text-sm text-muted-dim">
                        Derechos: {DERECHOS[suyo.rights_status] ?? suyo.rights_status}
                      </p>

                      {revision?.notes && (
                        <div className="mt-5 rounded-md border border-red-500/40 bg-red-900/20 p-4">
                          <p className="text-xs tracking-wider text-red-200 uppercase">
                            Lo que dijo la revisión
                          </p>
                          <p className="mt-2 text-muted">{revision.notes}</p>
                        </div>
                      )}

                      {suyo.master_url && (
                        <div className="mt-6">
                          <Reel url={suyo.master_url} titulo={suyo.title} />
                        </div>
                      )}

                      <p className="mt-4 text-xs text-muted-dim tabular-nums">
                        Enviado el{" "}
                        {new Date(suyo.created_at).toLocaleDateString("es", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                        {suyo.duration_s
                          ? ` · ${Math.floor(suyo.duration_s / 60)}:${String(suyo.duration_s % 60).padStart(2, "0")}`
                          : ""}
                      </p>
                    </>
                  )}

                  {!suyo && (
                    <div className="mt-5">
                      <p className="text-muted">
                        Estás inscrito pero no hay video. Mándalo antes de que
                        cierre el plazo.
                      </p>
                      <ButtonLink
                        href={"/participa" as Route}
                        className="mt-4"
                      >
                        Mandar mi video
                      </ButtonLink>
                    </div>
                  )}

                  {p.contests?.submission_deadline && (
                    <p className="mt-4 border-t border-stage-600 pt-3 text-xs text-muted-dim tabular-nums">
                      El plazo para enviar cierra el{" "}
                      {new Date(p.contests.submission_deadline).toLocaleDateString(
                        "es",
                        { day: "numeric", month: "long", year: "numeric" },
                      )}
                      .
                    </p>
                  )}

                  <a
                    href={`/concursos/${p.contests?.slug}`}
                    className="mt-4 inline-block text-sm text-red-300 underline"
                  >
                    Ver las bases del concurso
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
