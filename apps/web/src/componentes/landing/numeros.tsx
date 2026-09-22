import { crearClienteServidor } from "@/lib/supabase/server";
import { CIFRAS_DECLARADAS } from "@/contenido/landing";
import { Seccion, Titulo } from "./piezas";

/* El movimiento en números.
   Dos orígenes distintos y a propósito: las métricas de la plataforma salen
   de metricas_publicas() y nadie las puede inflar; las cifras declaradas son
   una afirmación del negocio. Una métrica en cero no se muestra.
   Cuando existan videos, votos y eventos se suman solas. */

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

type Tarjeta = { clave: string; etiqueta: string; valor: number; prefijo?: string };

export async function Numeros() {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.rpc("metricas_publicas");

  const dePlataforma: Tarjeta[] = (error ? [] : (data ?? []))
    .filter((m) => Number(m.valor) > 0 && ETIQUETAS[m.clave])
    .sort((a, b) => ORDEN.indexOf(a.clave) - ORDEN.indexOf(b.clave))
    .map((m) => ({
      clave: m.clave,
      etiqueta: ETIQUETAS[m.clave]!,
      valor: Number(m.valor),
    }));

  const tarjetas: Tarjeta[] = [...CIFRAS_DECLARADAS, ...dePlataforma];
  if (tarjetas.length === 0) return null;

  return (
    <Seccion id="numeros">
      <Titulo className="aparece">El movimiento en números</Titulo>
      {/* Cada tarjeta lleva su propio borde. Con el truco de la rejilla de
          un píxel, las celdas que sobran dejaban un bloque de color vacío. */}
      {/* Las cuatro en una fila: tres arriba y una sola debajo se lee como si
          la cuarta fuera de otra cosa, y las cuatro son la misma idea. */}
      <dl className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tarjetas.map((t) => (
          <div
            key={t.clave}
            className="aparece rounded-lg border border-stage-600 bg-stage-900 px-5 py-8 text-center"
          >
            <dt className="text-xs tracking-[0.2em] text-muted-dim uppercase">
              {t.etiqueta}
            </dt>
            <dd className="font-display mt-2 text-4xl text-gold-400 tabular-nums sm:text-5xl">
              {t.prefijo}
              {t.valor.toLocaleString("es")}
            </dd>
          </div>
        ))}
      </dl>
    </Seccion>
  );
}
