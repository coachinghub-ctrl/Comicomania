import { notFound } from "next/navigation";
import { puede } from "@comicomania/authz";
import { cargarActor, puedeActor } from "@/lib/autorizacion";
import { crearClienteServidor } from "@/lib/supabase/server";
import { EditorDeFicha, type Cuenta, type Ficha } from "./formulario";

export const metadata = { title: "Repertorio" };

const COLOR_ESTADO: Record<string, string> = {
  DRAFT: "text-ink-faint",
  PENDING_REVIEW: "text-red-600",
  ACTIVE: "text-success-ink",
  PAUSED: "text-ink-soft",
  RETIRED: "text-ink-faint",
  BLOCKED: "text-red-700",
};

/* El repertorio, por dentro.

   Esta pantalla administra lo que el público ve en /humoristas: quién está,
   con qué video y con qué biografía. Lo que no se ve aquí —solicitudes y
   contratos— vive en Contrataciones, porque gestionar un catálogo de artistas
   y gestionar un pipeline de ventas no se parecen en nada.

   Las columnas se nombran una a una y nunca "*": el nombre legal y el
   contacto de contratación están restringidos por permisos de columna, y un
   asterisco haría que Postgres rechace la consulta entera. */

const PUBLICAS =
  "user_id, stage_name, handle, tagline, bio, photo_url, photo_alt, " +
  "reel_url, reel_title, comedy_styles, languages, markets, set_durations, " +
  "travel_availability, display_order, status, public_visible";

export default async function Repertorio() {
  if (!(await puedeActor({ seccion: "TALENT", accion: "VIEW" }))) notFound();

  const actor = await cargarActor();
  const supabase = await crearClienteServidor();

  const puedeEditar = puede(actor, { seccion: "TALENT", accion: "EDIT" }).permitido;
  const columnas = puedeEditar
    ? `${PUBLICAS}, legal_name, booking_contact`
    : PUBLICAS;

  const [{ data: talentos, error }, { data: cuentas }] = await Promise.all([
    supabase
      .from("talent_profiles")
      .select(columnas)
      .order("public_visible", { ascending: false })
      .order("display_order")
      .order("stage_name")
      .limit(200),
    puedeEditar
      ? supabase
          .from("users")
          .select("id, display_name, email")
          .order("display_name")
          .limit(300)
      : Promise.resolve({ data: [] }),
  ]);

  const fichas = (talentos ?? []) as unknown as Ficha[];
  const conCuenta = new Set(fichas.map((f) => f.user_id));

  const disponibles: Cuenta[] = ((cuentas ?? []) as {
    id: string;
    display_name: string | null;
    email: string | null;
  }[])
    .filter((u) => !conCuenta.has(u.id))
    .map((u) => ({ id: u.id, nombre: u.display_name ?? u.email ?? u.id }));

  const publicadas = fichas.filter((f) => f.public_visible);
  const aMedias = fichas.filter(
    (f) => !f.public_visible && (!f.photo_url || !f.reel_url || (f.bio ?? "").length < 40),
  );

  return (
    <div>
      <p className="text-xs tracking-[0.2em] text-ink-faint uppercase">Talento</p>
      <h1 className="font-display mt-1 text-3xl text-ink uppercase">Repertorio</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-soft">
        Quién está en <strong>/humoristas</strong>, con qué video y con qué
        biografía. A un humorista no lo contratan por su ficha: lo contratan
        porque vieron dos minutos suyos y se rieron.
      </p>

      <div className="mt-4 max-w-2xl rounded-md border border-line bg-surface-2 p-4 text-sm">
        <p className="text-ink-soft">
          La ficha es <strong>pública</strong> —esa es su función, que lo
          contraten— pero la misma fila guarda el nombre legal y el contacto de
          contratación. RLS no resuelve eso: decide filas enteras, no columnas.
          Aquí se usan <strong>permisos por columna</strong> de Postgres, así
          que esos dos datos no viajan con la ficha aunque la ficha sea
          visible.
        </p>
        {!puedeEditar && (
          <p className="mt-2 text-xs text-ink-faint">
            Tu acceso no incluye esos campos, así que esta pantalla ni siquiera
            los pide.
          </p>
        )}
      </div>

      {error && (
        <p
          role="alert"
          className="mt-6 rounded-md border border-red-600/40 bg-red-700/5 p-3 text-sm text-red-700"
        >
          No se pudo leer el repertorio: {error.message}
        </p>
      )}

      <section className="mt-8">
        <dl className="grid gap-4 sm:grid-cols-4">
          {[
            { etiqueta: "Fichas", valor: fichas.length },
            { etiqueta: "En el repertorio", valor: publicadas.length },
            { etiqueta: "Con video", valor: fichas.filter((f) => f.reel_url).length },
            { etiqueta: "A medias", valor: aMedias.length },
          ].map((t) => (
            <div
              key={t.etiqueta}
              className="rounded-lg border border-line bg-surface-2 px-5 py-4"
            >
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

      {puedeEditar && (
        <section className="mt-8">
          <EditorDeFicha cuentas={disponibles} veContacto={puedeEditar} />
        </section>
      )}

      <section className="mt-10">
        <h2 className="font-display text-lg text-ink uppercase">Fichas</h2>

        {fichas.length === 0 ? (
          <p className="mt-4 rounded-lg border border-line bg-surface-2 p-6 text-sm text-ink-soft">
            Todavía no hay fichas de talento.
          </p>
        ) : (
          <ul className="mt-4 grid gap-4 lg:grid-cols-2">
            {fichas.map((t) => {
              const falta = [
                t.photo_url ? null : "foto",
                t.reel_url ? null : "video",
                (t.bio ?? "").length >= 40 ? null : "biografía",
              ].filter(Boolean) as string[];

              return (
                <li
                  key={t.user_id}
                  className="flex gap-4 rounded-lg border border-line p-4"
                >
                  {t.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={t.photo_url}
                      alt=""
                      width={96}
                      height={120}
                      className="aspect-4/5 w-20 shrink-0 rounded-md border border-line object-cover"
                    />
                  ) : (
                    <span className="flex aspect-4/5 w-20 shrink-0 items-center justify-center rounded-md border border-dashed border-line-strong text-xs text-ink-faint">
                      sin foto
                    </span>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-display text-sm text-ink uppercase">
                        {t.stage_name}
                      </p>
                      <span
                        className={`shrink-0 text-xs ${COLOR_ESTADO[t.status ?? ""] ?? "text-ink-soft"}`}
                      >
                        {t.status}
                      </span>
                    </div>

                    {t.tagline && (
                      <p className="mt-1 text-sm text-ink-soft">{t.tagline}</p>
                    )}

                    <p className="mt-2 text-xs text-ink-faint">
                      {t.public_visible ? (
                        <a
                          href={`/humoristas/${t.handle}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-success-ink underline"
                        >
                          En el repertorio · /humoristas/{t.handle}
                        </a>
                      ) : falta.length > 0 ? (
                        <span className="text-red-700">
                          No publicada · falta {falta.join(", ")}
                        </span>
                      ) : (
                        "Lista para publicar, sin publicar"
                      )}
                    </p>

                    {(t.comedy_styles?.length ?? 0) > 0 && (
                      <p className="mt-2 text-xs text-ink-faint">
                        {t.comedy_styles!.join(" · ")}
                      </p>
                    )}

                    {puedeEditar && (t.legal_name || t.booking_contact) && (
                      <p className="mt-2 border-t border-line pt-2 text-xs text-ink-faint">
                        {t.legal_name}
                        {t.booking_contact ? ` · ${t.booking_contact}` : ""}
                      </p>
                    )}

                    {puedeEditar && (
                      <div className="mt-3">
                        <EditorDeFicha
                          cuentas={disponibles}
                          ficha={t}
                          veContacto={puedeEditar}
                        />
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
