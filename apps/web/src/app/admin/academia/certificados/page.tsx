import { notFound } from "next/navigation";
import { puedeActor } from "@/lib/autorizacion";
import { crearClienteServidor } from "@/lib/supabase/server";

export const metadata = { title: "Certificados" };

/* Los certificados emitidos.

   Esta pantalla no tiene botón de emitir a mano, y es a propósito: un
   certificado solo se puede crear cuando el curso está al 100%, y eso lo
   impide un trigger de la base. Poner aquí un botón daría a entender que hay
   una puerta de atrás, y no la hay.

   Tampoco se borran. Un certificado que desaparece deja a alguien con un
   documento que ya no se puede verificar, y esa es toda la utilidad que
   tiene. */

export default async function Certificados() {
  if (!(await puedeActor({ seccion: "ACADEMY", accion: "VIEW" }))) notFound();

  const supabase = await crearClienteServidor();

  const { data: certificados, error } = await supabase
    .from("certificates")
    .select(
      "id, serial, issued_at, pdf_url, course_enrollments(progress_pct, completed_at, users(display_name, email), courses(title))",
    )
    .order("issued_at", { ascending: false })
    .limit(200);

  // Quien terminó pero todavía no tiene certificado: es una tarea pendiente,
  // no una estadística.
  const { data: terminadosSinCertificado } = await supabase
    .from("course_enrollments")
    .select("id, completed_at, users(display_name, email), courses(title), certificates(id)")
    .eq("progress_pct", 100)
    .limit(100);

  const pendientes = (terminadosSinCertificado ?? []).filter(
    (e) => ((e.certificates ?? []) as unknown[]).length === 0,
  );

  return (
    <div>
      <p className="text-xs tracking-[0.2em] text-ink-faint uppercase">Academia</p>
      <h1 className="font-display mt-1 text-3xl text-ink uppercase">Certificados</h1>

      <div className="mt-4 max-w-2xl rounded-md border border-line bg-surface-2 p-4 text-sm">
        <p className="text-ink-soft">
          <strong>No hay botón de emitir.</strong> Un certificado solo se crea
          cuando el curso está al 100%, y eso lo impide un trigger de la base.
          Poner un botón aquí daría a entender que hay una puerta de atrás, y no
          la hay.
        </p>
        <p className="mt-2 text-ink-soft">
          Tampoco se borran. Un certificado que desaparece deja a alguien con un
          documento que ya no se puede verificar, y esa es toda la utilidad que
          tiene.
        </p>
        <p className="mt-2 text-xs text-ink-faint">
          Cualquiera puede comprobar uno por su número de serie: por eso la
          serie es pública.
        </p>
      </div>

      {error && (
        <p role="alert" className="mt-6 rounded-md border border-red-600/40 bg-red-700/5 p-3 text-sm text-red-700">
          No se pudo leer: {error.message}
        </p>
      )}

      {pendientes.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-lg text-ink uppercase">
            Terminaron y les falta el certificado
          </h2>
          <ul className="mt-3 space-y-2">
            {pendientes.map((e) => {
              const alumno = e.users as { display_name: string | null; email: string | null } | null;
              const curso = e.courses as { title: string } | null;
              return (
                <li
                  key={e.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-gold-700/40 bg-gold-400/5 px-4 py-2.5 text-sm"
                >
                  <span className="text-ink">
                    {alumno?.display_name ?? alumno?.email ?? "—"}
                  </span>
                  <span className="text-ink-soft">{curso?.title}</span>
                  <span className="text-xs text-ink-faint tabular-nums">
                    terminó el{" "}
                    {e.completed_at
                      ? new Date(e.completed_at).toLocaleDateString("es")
                      : "—"}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="mt-10">
        <h2 className="font-display text-lg text-ink uppercase">Emitidos</h2>

        {(certificados?.length ?? 0) === 0 ? (
          <p className="mt-4 rounded-lg border border-line bg-surface-2 p-6 text-sm text-ink-soft">
            Todavía no hay certificados. Se emiten solos cuando alguien termina
            un curso.
          </p>
        ) : (
          <div className="mt-4 rounded-lg border border-line">
            <table className="w-full table-fixed text-left text-sm">
              <thead className="bg-surface-2 text-xs tracking-wider text-ink-faint uppercase">
                <tr>
                  <th scope="col" className="w-1/4 px-4 py-3 font-medium">Serie</th>
                  <th scope="col" className="px-4 py-3 font-medium">Alumno</th>
                  <th scope="col" className="px-4 py-3 font-medium">Curso</th>
                  <th scope="col" className="px-4 py-3 font-medium">Emitido</th>
                </tr>
              </thead>
              <tbody>
                {certificados!.map((c, i) => {
                  const inscripcion = c.course_enrollments as {
                    users: { display_name: string | null; email: string | null } | null;
                    courses: { title: string } | null;
                  } | null;
                  return (
                    <tr key={c.id} className={i % 2 === 1 ? "bg-surface-2" : undefined}>
                      <td className="px-4 py-3">
                        <span className="block truncate font-mono text-xs text-ink">
                          {c.serial}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-ink-soft">
                        {inscripcion?.users?.display_name ??
                          inscripcion?.users?.email ??
                          "—"}
                      </td>
                      <td className="px-4 py-3 text-ink-soft">
                        {inscripcion?.courses?.title ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-ink-soft tabular-nums">
                        {new Date(c.issued_at).toLocaleDateString("es")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
