import { puede } from "@comicomania/authz";
import { cargarActor } from "@/lib/autorizacion";
import { crearClienteServidor } from "@/lib/supabase/server";

export const metadata = { title: "Resumen" };

export default async function PanelAdmin() {
  const actor = await cargarActor();
  const supabase = await crearClienteServidor();

  // El conteo pasa por RLS: cada quien ve lo de su territorio y nada más.
  const [{ count: usuarios }, { data: metricas }] = await Promise.all([
    supabase.from("users").select("id", { count: "exact", head: true }),
    supabase.rpc("metricas_publicas"),
  ]);

  const ciudades = metricas?.find((m) => m.clave === "ciudades")?.valor ?? 0;
  const paises = metricas?.find((m) => m.clave === "paises")?.valor ?? 0;

  const tarjetas = [
    { etiqueta: "Usuarios en tu territorio", valor: usuarios ?? 0 },
    { etiqueta: "Ciudades activas", valor: Number(ciudades) },
    { etiqueta: "Países", valor: Number(paises) },
  ];

  const grantsVigentes = actor.grants.filter((g) => g.estado === "ACTIVE");

  return (
    <div>
      <h1 className="font-display text-3xl text-ink uppercase">Resumen</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Hola, {actor.nombre}. Esto es lo que alcanzas desde tu acceso.
      </p>

      <dl className="mt-8 grid gap-4 sm:grid-cols-3">
        {tarjetas.map((t) => (
          <div
            key={t.etiqueta}
            className="rounded-lg border border-line bg-surface-2 px-5 py-6"
          >
            <dt className="text-xs tracking-wider text-ink-faint uppercase">
              {t.etiqueta}
            </dt>
            <dd className="font-display mt-2 text-4xl text-red-600 tabular-nums">
              {t.valor.toLocaleString("es")}
            </dd>
          </div>
        ))}
      </dl>

      <section className="mt-10">
        <h2 className="font-display text-lg text-ink uppercase">Tu acceso</h2>
        <ul className="mt-4 space-y-3">
          {grantsVigentes.map((g, i) => (
            <li
              key={`${g.rol}-${g.alcancePath ?? g.alcanceId ?? i}`}
              className="rounded-lg border border-line bg-surface-2 p-4"
            >
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-display text-sm text-ink uppercase">
                  {g.rol}
                </span>
                <span className="rounded-full border border-red-700/30 px-2.5 py-0.5 text-xs text-red-600">
                  {g.tipoAlcance === "GLOBAL" ? "Global" : (g.alcancePath ?? g.alcanceId)}
                </span>
                <span className="text-xs text-ink-soft">
                  {g.hasta
                    ? `hasta el ${g.hasta.toLocaleDateString("es")}`
                    : "sin fecha de fin"}
                </span>
              </div>
              <p className="mt-2 text-xs text-ink-soft">
                {g.secciones.length} secciones · {g.acciones.length} acciones ·
                finanzas: {g.nivelFinanciero}
              </p>
              {g.denegados.length > 0 && (
                <p className="mt-2 text-xs text-red-700">
                  Denegado siempre: {g.denegados.join(", ")}
                </p>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* Prueba viva del guard: se pregunta de verdad, no se simula. */}
      <section className="mt-10">
        <h2 className="font-display text-lg text-ink uppercase">
          Qué puedes hacer aquí
        </h2>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {[
            { s: "ACCESS_CONTROL", a: "MANAGE", t: "Crear y revocar accesos" },
            { s: "VIDEO_REVIEW", a: "APPROVE", t: "Aprobar videos" },
            { s: "VOTING", a: "MANAGE", t: "Invalidar votos" },
            { s: "ORDERS", a: "REFUND", t: "Emitir reembolsos" },
            { s: "FINANCE", a: "VIEW", t: "Ver finanzas" },
            { s: "INFRA", a: "MANAGE", t: "Tocar infraestructura" },
          ].map((p) => {
            const d = puede(actor, { seccion: p.s, accion: p.a });
            return (
              <li
                key={`${p.s}.${p.a}`}
                className="flex items-center justify-between gap-3 rounded-md border border-line bg-surface-2 px-4 py-2.5 text-sm"
              >
                <span className="text-ink">{p.t}</span>
                <span
                  className={d.permitido ? "text-success-ink" : "text-ink-faint"}
                  title={d.motivo}
                >
                  {d.permitido ? "Sí" : d.motivo.replaceAll("_", " ").toLowerCase()}
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
