/* Dónde está la gente.

   Es una proyección equirectangular acotada a la región donde opera
   COMICOMANÍA —de Norteamérica a España—, con un punto por ciudad y el
   tamaño según cuánta gente hay.

   Lo llamo distribución y no mapa a propósito: no lleva costas ni fronteras.
   Dibujar un mapamundi a mano sale mal, y un contorno equivocado es peor que
   ninguno. Los puntos están en su latitud y longitud reales, así que las
   posiciones relativas sí son ciertas.

   Los datos llegan agregados desde la base: nunca filas de personas. Un mapa
   no necesita saber quién es cada punto, y exponer a la gente para dibujar un
   círculo sería regalar la base de usuarios a cambio de un gráfico. */

export type PuntoGeo = {
  ciudad: string;
  pais: string;
  path: string;
  latitud: number | null;
  longitud: number | null;
  personas: number;
  inscritos: number;
};

// Ventana del gráfico, en grados. Cubre de Alaska a Madrid y de Canadá a Chile.
const OESTE = -125;
const ESTE = 10;
const NORTE = 52;
const SUR = -40;

const ANCHO = 1000;
const ALTO = Math.round((ANCHO * (NORTE - SUR)) / (ESTE - OESTE));

function aX(lon: number) {
  return ((lon - OESTE) / (ESTE - OESTE)) * ANCHO;
}
function aY(lat: number) {
  return ((NORTE - lat) / (NORTE - SUR)) * ALTO;
}

export function MapaDeParticipantes({
  puntos,
  sinUbicar,
}: {
  puntos: PuntoGeo[];
  sinUbicar: number;
}) {
  const ubicables = puntos.filter(
    (p) => p.latitud !== null && p.longitud !== null,
  );

  if (ubicables.length === 0) {
    return (
      <p className="rounded-lg border border-line bg-surface-2 p-6 text-sm text-ink-soft">
        Todavía no hay nadie con ciudad puesta.{" "}
        {sinUbicar > 0 && `${sinUbicar} personas sin ubicar.`}
      </p>
    );
  }

  const mayor = Math.max(...ubicables.map((p) => p.personas));
  // Raíz cuadrada: el área del círculo crece con la cantidad, no el radio.
  // Con el radio, una ciudad del doble se ve cuatro veces más grande.
  const radio = (n: number) => 8 + Math.sqrt(n / mayor) * 26;

  const porPais = new Map<string, number>();
  for (const p of puntos) {
    porPais.set(p.pais, (porPais.get(p.pais) ?? 0) + p.personas);
  }
  const paises = [...porPais.entries()].sort((a, b) => b[1] - a[1]);
  const total = puntos.reduce((t, p) => t + p.personas, 0);

  return (
    <div>
      <div className="overflow-hidden rounded-lg border border-line bg-stage-1000">
        <svg
          viewBox={`0 0 ${ANCHO} ${ALTO}`}
          className="w-full"
          role="img"
          aria-label={`Distribución de ${total} personas en ${ubicables.length} ciudades`}
        >
          {/* Retícula cada 20 grados: da escala sin fingir un mapa. */}
          <g stroke="#2E1A1B" strokeWidth={1}>
            {Array.from({ length: Math.floor((ESTE - OESTE) / 20) + 1 }, (_, i) => {
              const lon = OESTE + i * 20;
              return (
                <line key={`m${lon}`} x1={aX(lon)} y1={0} x2={aX(lon)} y2={ALTO} />
              );
            })}
            {Array.from({ length: Math.floor((NORTE - SUR) / 20) + 1 }, (_, i) => {
              const lat = SUR + i * 20;
              return (
                <line key={`p${lat}`} x1={0} y1={aY(lat)} x2={ANCHO} y2={aY(lat)} />
              );
            })}
          </g>

          {/* El ecuador, más marcado: es la única referencia que orienta. */}
          <line
            x1={0}
            y1={aY(0)}
            x2={ANCHO}
            y2={aY(0)}
            stroke="#620700"
            strokeWidth={1.5}
            strokeDasharray="6 6"
          />
          <text x={8} y={aY(0) - 8} fill="#8A8078" fontSize={16}>
            Ecuador
          </text>

          {ubicables.map((p) => {
            const x = aX(p.longitud!);
            const y = aY(p.latitud!);
            const r = radio(p.personas);
            return (
              <g key={p.path}>
                <circle cx={x} cy={y} r={r} fill="#EB1701" fillOpacity={0.18} />
                <circle cx={x} cy={y} r={r * 0.45} fill="#EB1701" />
                <text
                  x={x}
                  y={y + r + 22}
                  textAnchor="middle"
                  fill="#F3F1D4"
                  fontSize={20}
                  fontWeight={600}
                >
                  {p.ciudad}
                </text>
                <text
                  x={x}
                  y={y + r + 42}
                  textAnchor="middle"
                  fill="#B9AFA6"
                  fontSize={18}
                >
                  {p.personas}
                  {p.inscritos > 0 ? ` · ${p.inscritos} inscritos` : ""}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <p className="mt-2 text-xs text-ink-faint">
        Posiciones reales por latitud y longitud. No lleva costas ni fronteras:
        un contorno dibujado a ojo es peor que ninguno.
        {sinUbicar > 0 && (
          <>
            {" "}
            <strong className="text-red-600">
              {sinUbicar} {sinUbicar === 1 ? "persona" : "personas"} sin ciudad
            </strong>{" "}
            no aparecen aquí.
          </>
        )}
      </p>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div>
          <h3 className="font-display text-sm text-ink uppercase">Por país</h3>
          <ul className="mt-3 space-y-2">
            {paises.map(([pais, n]) => (
              <li key={pais}>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="text-ink">{pais}</span>
                  <span className="text-ink tabular-nums">{n}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-line">
                  <div
                    className="h-full bg-red-600"
                    style={{ width: `${total > 0 ? (n / total) * 100 : 0}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-display text-sm text-ink uppercase">Por ciudad</h3>
          <ul className="mt-3 space-y-2">
            {puntos.map((p) => (
              <li
                key={p.path}
                className="flex items-baseline justify-between gap-3 text-sm"
              >
                <span className="min-w-0 truncate text-ink">
                  {p.ciudad}
                  <span className="ml-2 font-mono text-xs text-ink-faint">
                    {p.path}
                  </span>
                </span>
                <span className="shrink-0 text-ink-soft tabular-nums">
                  {p.personas}
                  {p.inscritos > 0 && (
                    <span className="ml-2 text-xs text-success-ink">
                      {p.inscritos} inscritos
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
