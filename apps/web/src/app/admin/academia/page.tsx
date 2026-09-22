import { notFound } from "next/navigation";
import { puede } from "@comicomania/authz";
import { cargarActor, puedeActor } from "@/lib/autorizacion";
import { crearClienteServidor } from "@/lib/supabase/server";
import { NuevoCurso } from "./formulario";

export const metadata = { title: "Academia" };

/* Cómo se vive el curso, dicho en una línea. Es lo primero que pregunta quien
   va a pagar, porque decide si el curso le sirve: no es lo mismo conectarse
   un martes a las siete que verlo cuando se pueda. */
const MODALIDAD: Record<string, string> = {
  RECORDED: "Grabado",
  LIVE: "En vivo",
  BLENDED: "Mixto",
};

export default async function Academia() {
  if (!(await puedeActor({ seccion: "ACADEMY", accion: "VIEW" }))) notFound();

  const actor = await cargarActor();
  const supabase = await crearClienteServidor();

  const puedeCrear = puede(actor, { seccion: "ACADEMY", accion: "CREATE" }).permitido;

  const [{ data: cursos, error }, { data: inscripciones }, { data: certificados }] =
    await Promise.all([
      supabase
        .from("courses")
        .select(
          "id, slug, title, level, modality, price, currency, status, duration_min, starts_on, seats, instructor_name, users(display_name), course_modules(id, lessons(id))",
        )
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("course_enrollments")
        .select("id, progress_pct, completed_at, started_at, users(display_name, email), courses(title)")
        .order("started_at", { ascending: false })
        .limit(50),
      supabase
        .from("certificates")
        .select("id, serial, issued_at")
        .order("issued_at", { ascending: false })
        .limit(10),
    ]);

  const terminadas = (inscripciones ?? []).filter((e) => e.completed_at).length;

  return (
    <div>
      <p className="text-xs tracking-[0.2em] text-ink-faint uppercase">Academia</p>
      <h1 className="font-display mt-1 text-3xl text-ink uppercase">Academia</h1>

      <div className="mt-4 max-w-2xl rounded-md border border-line bg-surface-2 p-4 text-sm">
        <p className="text-ink-soft">
          <strong>El progreso no se mantiene a mano.</strong> Se recalcula desde
          las lecciones completadas cada vez que alguien avanza. Un porcentaje
          que alguien actualiza por su cuenta se desincroniza el primer día, y a
          partir de ahí nadie sabe quién terminó de verdad.
        </p>
        <p className="mt-2 text-ink-soft">
          <strong>No se certifica un curso sin terminar.</strong> Un certificado
          es un documento que la gente pone en su currículum: si se pudiera
          emitir a medias, no valdría nada.
        </p>
      </div>

      {error && (
        <p role="alert" className="mt-6 rounded-md border border-red-600/40 bg-red-700/5 p-3 text-sm text-red-700">
          No se pudo leer la academia: {error.message}
        </p>
      )}

      <section className="mt-8">
        <dl className="grid gap-4 sm:grid-cols-4">
          {[
            { etiqueta: "Cursos", valor: cursos?.length ?? 0 },
            { etiqueta: "Inscripciones", valor: inscripciones?.length ?? 0 },
            { etiqueta: "Terminadas", valor: terminadas },
            { etiqueta: "Certificados", valor: certificados?.length ?? 0 },
          ].map((t) => (
            <div key={t.etiqueta} className="rounded-lg border border-line bg-surface-2 px-5 py-4">
              <dt className="text-xs tracking-wider text-ink-faint uppercase">
                {t.etiqueta}
              </dt>
              <dd className="font-display mt-1 text-3xl text-red-600 tabular-nums">
                {t.valor}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {puedeCrear && (
        <section className="mt-8">
          <NuevoCurso />
        </section>
      )}

      <section className="mt-10">
        <h2 className="font-display text-lg text-ink uppercase">Catálogo</h2>
        {(cursos?.length ?? 0) === 0 ? (
          <p className="mt-4 rounded-lg border border-line bg-surface-2 p-6 text-sm text-ink-soft">
            Todavía no hay cursos.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-lg border border-line">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-2 text-xs tracking-wider text-ink-faint uppercase">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Curso</th>
                  <th scope="col" className="px-4 py-3 font-medium">Modalidad</th>
                  <th scope="col" className="px-4 py-3 font-medium">Instructor</th>
                  <th scope="col" className="px-4 py-3 font-medium">Temario</th>
                  <th scope="col" className="px-4 py-3 font-medium">Precio</th>
                  <th scope="col" className="px-4 py-3 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {cursos!.map((c, i) => {
                  const instructor = c.users as { display_name: string | null } | null;
                  const modulos = (c.course_modules ?? []) as { lessons: unknown[] }[];
                  const lecciones = modulos.reduce(
                    (t, m) => t + (m.lessons?.length ?? 0),
                    0,
                  );
                  return (
                    <tr key={c.id} className={i % 2 === 1 ? "bg-surface-2" : undefined}>
                      <td className="px-4 py-3">
                        <a
                          href={`/admin/academia/${c.slug}`}
                          className="block text-ink underline decoration-line-strong underline-offset-2 hover:text-red-600"
                        >
                          {c.title}
                        </a>
                        <span className="block text-xs text-ink-faint">{c.level}</span>
                      </td>
                      <td className="px-4 py-3 text-ink-soft">
                        {MODALIDAD[c.modality ?? "RECORDED"] ?? c.modality}
                        {c.starts_on && (
                          <span className="block text-xs text-ink-faint tabular-nums">
                            empieza el{" "}
                            {new Date(`${c.starts_on}T00:00:00`).toLocaleDateString("es")}
                            {c.seats ? ` · ${c.seats} cupos` : ""}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-ink-soft">
                        {c.instructor_name ?? instructor?.display_name ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-ink-soft tabular-nums">
                        {modulos.length} módulos · {lecciones} lecciones
                      </td>
                      <td className="px-4 py-3 text-ink tabular-nums">
                        {Number(c.price) === 0 ? "Gratis" : `${c.price} ${c.currency}`}
                      </td>
                      <td className="px-4 py-3">
                        <span className={c.status === "PUBLISHED" ? "text-success-ink" : "text-ink-faint"}>
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {(inscripciones?.length ?? 0) > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-lg text-ink uppercase">Avance del alumnado</h2>
          <ul className="mt-4 space-y-2">
            {inscripciones!.map((e) => {
              const alumno = e.users as { display_name: string | null; email: string | null } | null;
              const curso = e.courses as { title: string } | null;
              return (
                <li key={e.id} className="rounded-md border border-line px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                    <span className="text-ink">
                      {alumno?.display_name ?? alumno?.email ?? "—"}
                    </span>
                    <span className="text-ink-soft">{curso?.title}</span>
                    <span className="text-ink tabular-nums">{e.progress_pct}%</span>
                  </div>
                  <div
                    className="mt-2 h-1.5 overflow-hidden rounded-full bg-line"
                    role="progressbar"
                    aria-valuenow={e.progress_pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Avance de ${alumno?.display_name ?? "alumno"}`}
                  >
                    <div
                      className={e.completed_at ? "h-full bg-success-ink" : "h-full bg-red-600"}
                      style={{ width: `${e.progress_pct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
