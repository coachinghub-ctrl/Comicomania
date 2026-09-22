import { notFound } from "next/navigation";
import { puedeActor } from "@/lib/autorizacion";
import { crearClienteServidor } from "@/lib/supabase/server";
import { EditorDeArte, type EventoEditable } from "./editor-arte";
import { NuevoEvento, type Ciudad, type Opcion, type Sede } from "./formulario";
import { puede } from "@comicomania/authz";
import { cargarActor } from "@/lib/autorizacion";

export const metadata = { title: "Eventos" };

const COLOR_ESTADO: Record<string, string> = {
  DRAFT: "text-ink-faint",
  ANNOUNCED: "text-red-600",
  ON_SALE: "text-success-ink",
  SOLD_OUT: "text-red-700",
  LIVE: "text-success-ink",
  FINISHED: "text-ink-soft",
  CANCELLED: "text-ink-faint",
};

export default async function Eventos() {
  if (!(await puedeActor({ seccion: "EVENTS", accion: "VIEW" }))) notFound();

  const actor = await cargarActor();
  const supabase = await crearClienteServidor();
  const puedeCrear = puede(actor, { seccion: "EVENTS", accion: "CREATE" }).permitido;

  const [
    { data: eventos, error },
    { data: duplicados },
    { data: paises },
    { data: ciudades },
    { data: sedes },
    { data: concursos },
    { data: reservas },
  ] = await Promise.all([
    supabase
      .from("events")
      .select(
        "id, slug, name, type, starts_at, capacity, status, is_free, tagline, subtitle, poster_url, poster_alt, venues(name, capacity), cities(name), tickets(id, status), ticket_types(id, name, quantity, price, currency)",
      )
      .order("starts_at", { ascending: true })
      .limit(50),
    supabase
      .from("checkins")
      .select("id, scanned_at, gate, result, tickets(code, events(name))")
      .in("result", ["DUPLICATE", "INVALID", "VOID"])
      .order("scanned_at", { ascending: false })
      .limit(20),
    supabase.from("countries").select("id, name").eq("is_active", true).order("name"),
    supabase.from("cities").select("id, name, country_id").eq("is_active", true).order("name"),
    supabase.from("venues").select("id, name, city_id, capacity").order("name"),
    supabase.from("contests").select("id, name").order("created_at", { ascending: false }).limit(20),
    /* La lista de reservas es la razón de hacer un evento gratis: quién va a
       ir, para poder escribirle antes y después. Entra al CRM sola con el
       evento como fuente. */
    supabase
      .from("event_registrations")
      .select("id, email, full_name, created_at, attended, user_id, events(name, slug, is_free)")
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  const reservasPorEvento = new Map<string, number>();
  for (const r of reservas ?? []) {
    const e = r.events as { slug: string } | null;
    if (e?.slug) reservasPorEvento.set(e.slug, (reservasPorEvento.get(e.slug) ?? 0) + 1);
  }

  return (
    <div>
      <p className="text-xs tracking-[0.2em] text-ink-faint uppercase">Comercio</p>
      <h1 className="font-display mt-1 text-3xl text-ink uppercase">Eventos</h1>

      <div className="mt-4 max-w-2xl rounded-md border border-line bg-surface-2 p-4 text-sm">
        <p className="text-ink-soft">
          <strong>No se emiten más entradas que el aforo.</strong> Lo impide la
          base, no el formulario: explicarle a cuarenta personas en la puerta
          que su entrada no existe es peor que cualquier caída.
        </p>
        <p className="mt-2 text-ink-soft">
          En la puerta, <strong>primer scan gana</strong>. El segundo no se
          descarta: se guarda como duplicado, porque descartarlo sería perder
          justo la evidencia de que alguien clonó una entrada.
        </p>
        <p className="mt-2 text-xs text-ink-faint">
          El escáner de puerta —una PWA que funciona sin red y sincroniza
          después— llega con esta fase. El padrón y las reglas que valida ya
          están.
        </p>
      </div>

      {puedeCrear && (
        <section className="mt-8">
          <h2 className="font-display text-lg text-ink uppercase">Nuevo evento</h2>
          <p className="mt-1 max-w-2xl text-sm text-ink-soft">
            Nace con sus tipos de entrada, o no nace: uno sin entradas no puede
            vender nada y alguien acabaría anunciándolo igual. Si es gratuito,
            lleva un solo nivel a cero y lo que importa es la lista.
          </p>
          <div className="mt-4">
            <NuevoEvento
              paises={(paises ?? []).map((p): Opcion => ({ id: p.id, nombre: p.name }))}
              ciudades={(ciudades ?? []).map((c): Ciudad => ({
                id: c.id,
                nombre: c.name,
                paisId: c.country_id,
              }))}
              sedes={(sedes ?? []).map((v): Sede => ({
                id: v.id,
                nombre: v.name,
                ciudadId: v.city_id,
                aforo: v.capacity,
              }))}
              concursos={(concursos ?? []).map((c): Opcion => ({ id: c.id, nombre: c.name }))}
            />
          </div>
        </section>
      )}

      {error && (
        <p role="alert" className="mt-6 rounded-md border border-red-600/40 bg-red-700/5 p-3 text-sm text-red-700">
          No se pudo leer la cartelera: {error.message}
        </p>
      )}

      {(duplicados?.length ?? 0) > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-lg text-ink uppercase">
            Scans rechazados
          </h2>
          <ul className="mt-3 space-y-2">
            {duplicados!.map((c) => {
              const ticket = c.tickets as {
                code: string;
                events: { name: string } | null;
              } | null;
              return (
                <li
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-red-600/40 bg-red-700/5 px-4 py-2.5 text-sm"
                >
                  <span className="font-mono text-xs text-ink">{ticket?.code}</span>
                  <span className="text-ink-soft">{ticket?.events?.name}</span>
                  <span className="text-red-700">{c.result}</span>
                  <span className="text-xs text-ink-faint tabular-nums">
                    {new Date(c.scanned_at).toLocaleString("es", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}{" "}
                    · {c.gate ?? "sin puerta"}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="mt-10">
        <h2 className="font-display text-lg text-ink uppercase">Cartelera</h2>
        {(eventos?.length ?? 0) === 0 ? (
          <p className="mt-4 rounded-lg border border-line bg-surface-2 p-6 text-sm text-ink-soft">
            Todavía no hay eventos programados.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {eventos!.map((e) => {
              const sede = e.venues as { name: string; capacity: number | null } | null;
              const ciudad = e.cities as { name: string } | null;
              const entradas = (e.tickets ?? []) as { status: string }[];
              const tipos = (e.ticket_types ?? []) as {
                id: string;
                name: string;
                quantity: number;
                price: number;
                currency: string;
              }[];
              const aforo = e.capacity ?? sede?.capacity ?? null;
              const emitidas = entradas.filter((t) => t.status !== "VOID").length;
              const usadas = entradas.filter((t) => t.status === "USED").length;

              return (
                <li key={e.id} className="rounded-lg border border-line p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex gap-4">
                      {e.poster_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={e.poster_url}
                          alt=""
                          width={64}
                          height={80}
                          className="h-20 w-16 shrink-0 rounded border border-line object-cover"
                        />
                      ) : (
                        <span className="flex h-20 w-16 shrink-0 items-center justify-center rounded border border-dashed border-line-strong px-1 text-center text-[0.6rem] text-ink-faint">
                          sin cartel
                        </span>
                      )}
                      <div>
                      <h3 className="font-display text-lg text-ink">{e.name}</h3>
                      <p className="mt-1 text-sm text-ink-soft">
                        {new Date(e.starts_at).toLocaleString("es", {
                          dateStyle: "full",
                          timeStyle: "short",
                        })}
                      </p>
                      <p className="mt-1 text-xs text-ink-faint">
                        {sede?.name ?? "online"} · {ciudad?.name ?? "—"} · {e.type}
                      </p>
                      {e.tagline && (
                        <p className="mt-1 text-xs text-ink-soft italic">
                          «{e.tagline}»
                        </p>
                      )}
                      </div>
                    </div>
                    <span className={COLOR_ESTADO[e.status] ?? "text-ink-soft"}>
                      {e.status}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-6 border-t border-line pt-4 text-sm">
                    <span className="text-ink-soft">
                      Emitidas{" "}
                      <strong className="text-ink tabular-nums">
                        {emitidas}
                        {aforo ? ` / ${aforo}` : ""}
                      </strong>
                    </span>
                    <span className="text-ink-soft">
                      Ingresaron{" "}
                      <strong className="text-ink tabular-nums">{usadas}</strong>
                    </span>
                    {e.is_free && (
                      <span className="text-ink-soft">
                        Reservaron{" "}
                        <strong className="text-success-ink tabular-nums">
                          {reservasPorEvento.get(e.slug) ?? 0}
                        </strong>
                      </span>
                    )}
                    {aforo && emitidas >= aforo && (
                      <span className="text-red-700">Aforo completo</span>
                    )}
                  </div>

                  <EditorDeArte
                    evento={{
                      id: e.id,
                      slug: e.slug,
                      name: e.name,
                      tagline: e.tagline,
                      subtitle: e.subtitle,
                      poster_url: e.poster_url,
                      poster_alt: e.poster_alt,
                    } satisfies EventoEditable}
                  />

                  {tipos.length > 0 && (
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {tipos.map((t) => (
                        <li
                          key={t.id}
                          className="rounded-full border border-line px-3 py-1 text-xs text-ink-soft"
                        >
                          {t.name} · {t.price} {t.currency} · {t.quantity} cupos
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {(reservas?.length ?? 0) > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-lg text-ink uppercase">
            Lista de asistentes
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-ink-soft">
            Quién reservó lugar en los eventos gratuitos. Cada uno entró al CRM
            con el evento como fuente, así que desde ahí se puede segmentar una
            campaña sin copiar ni pegar nada.
          </p>

          <div className="mt-4 rounded-lg border border-line">
            <table className="w-full table-fixed text-left text-sm">
              <thead className="bg-surface-2 text-xs tracking-wider text-ink-faint uppercase">
                <tr>
                  <th scope="col" className="w-2/5 px-4 py-3 font-medium">Persona</th>
                  <th scope="col" className="px-4 py-3 font-medium">Evento</th>
                  <th scope="col" className="px-4 py-3 font-medium">Reservó</th>
                  <th scope="col" className="px-4 py-3 font-medium">Cuenta</th>
                </tr>
              </thead>
              <tbody>
                {reservas!.map((r, i) => {
                  const ev = r.events as { name: string } | null;
                  return (
                    <tr key={r.id} className={i % 2 === 1 ? "bg-surface-2" : undefined}>
                      <td className="px-4 py-3">
                        <span className="block text-ink">{r.full_name ?? "—"}</span>
                        <span
                          className="block truncate text-xs text-ink-soft"
                          title={r.email}
                        >
                          {r.email}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-ink-soft">{ev?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-ink-soft tabular-nums">
                        {new Date(r.created_at).toLocaleDateString("es")}
                      </td>
                      <td className="px-4 py-3">
                        <span className={r.user_id ? "text-success-ink" : "text-ink-faint"}>
                          {r.user_id ? "Tiene cuenta" : "Solo correo"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="mt-2 text-xs text-ink-faint">
            Quien reserve sin cuenta y se registre después con el mismo correo
            se vincula solo: la reserva no se queda huérfana.
          </p>
        </section>
      )}
    </div>
  );
}
