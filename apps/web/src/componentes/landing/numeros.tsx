import { crearClienteServidor } from "@/lib/supabase/server";
import { Seccion, Titulo } from "./piezas";

/* El movimiento en números.
   Las cifras salen de metricas_publicas(), nunca de constantes. Una métrica
   en cero no se muestra: es preferible decir menos que decir algo falso o
   deprimente. Cuando existan videos, votos y eventos (Fase E y J) se suman
   solos, sin tocar este componente. */

const ETIQUETAS: Record<string, string> = {
  usuarios: "Miembros",
  humoristas: "Humoristas",
  videos: "Videos",
  votos: "Votos",
  eventos: "Eventos",
  ciudades: "Ciudades",
  paises: "Países",
};

const ORDEN = ["humoristas", "videos", "votos", "usuarios", "eventos", "ciudades", "paises"];

export async function Numeros() {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.rpc("metricas_publicas");

  const metricas = (error ? [] : (data ?? []))
    .filter((m) => Number(m.valor) > 0 && ETIQUETAS[m.clave])
    .sort((a, b) => ORDEN.indexOf(a.clave) - ORDEN.indexOf(b.clave));

  if (metricas.length === 0) return null;

  return (
    <Seccion id="numeros">
      <Titulo className="aparece">El movimiento en números</Titulo>
      <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-stage-600 bg-stage-600 sm:grid-cols-3 lg:grid-cols-4">
        {metricas.map((m) => (
          <div key={m.clave} className="aparece bg-stage-900 px-5 py-8 text-center">
            <dt className="text-xs tracking-[0.2em] text-muted-dim uppercase">
              {ETIQUETAS[m.clave]}
            </dt>
            <dd className="font-display mt-2 text-4xl text-gold-400 tabular-nums sm:text-5xl">
              {Number(m.valor).toLocaleString("es")}
            </dd>
          </div>
        ))}
      </dl>
    </Seccion>
  );
}
