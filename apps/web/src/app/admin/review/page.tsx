import { notFound } from "next/navigation";
import { puede } from "@comicomania/authz";
import { cargarActor, alcanceDelActor, puedeActor } from "@/lib/autorizacion";
import { crearClienteServidor } from "@/lib/supabase/server";
import { Decidir } from "./decidir";

export const metadata = { title: "Revisión de video" };

/* La cola solo muestra lo que espera decisión. Un listado de todos los videos
   no es una cola: es un archivo, y con volumen nadie sabe por dónde empezar. */
const EN_COLA = ["SUBMITTED", "IN_REVIEW", "PENDING_RIGHTS"] as const;

const DERECHOS: Record<string, { texto: string; color: string }> = {
  PENDING: { texto: "Sin declarar", color: "text-red-700" },
  DECLARED: { texto: "Declarados", color: "text-ink-soft" },
  REVIEW_REQUIRED: { texto: "Requieren revisión", color: "text-red-600" },
  CLEARED: { texto: "Libres", color: "text-success-ink" },
  RESTRICTED: { texto: "Restringidos", color: "text-red-600" },
  EXPIRED: { texto: "Vencidos", color: "text-red-700" },
  BLOCKED: { texto: "Bloqueados", color: "text-red-700" },
};

const BLOQUEAN_PUBLICACION = ["PENDING", "REVIEW_REQUIRED", "RESTRICTED", "BLOCKED"];

export default async function Review() {
  if (!(await puedeActor({ seccion: "VIDEO_REVIEW", accion: "VIEW" }))) notFound();

  const actor = await cargarActor();
  const alcance = await alcanceDelActor("VIDEO_REVIEW");
  const supabase = await crearClienteServidor();

  const puedeDecidir = puede(actor, {
    seccion: "VIDEO_REVIEW",
    accion: "APPROVE",
  }).permitido;

  const { data: videos, error } = await supabase
    .from("videos")
    .select(
      "id, title, description, status, rights_status, duration_s, master_url, created_at, users(display_name, email), contests(name, cities(name), countries(name)), rounds(name), categories(name)",
    )
    .in("status", [...EN_COLA])
    .order("created_at", { ascending: true })
    .limit(50);

  return (
    <div>
      <p className="text-xs tracking-[0.2em] text-ink-faint uppercase">Concursos</p>
      <h1 className="font-display mt-1 text-3xl text-ink uppercase">
        Revisión de video
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-soft">
        {alcance.global
          ? "Ves la cola de todos los territorios."
          : `Ves la cola de ${alcance.paths.join(", ") || "ningún territorio"}.`}{" "}
        Los más antiguos primero: quien subió hace una semana lleva una semana
        esperando.
      </p>

      <div className="mt-4 max-w-2xl rounded-md border border-line bg-surface-2 p-4 text-sm">
        <p className="text-ink-soft">
          Un video con los derechos sin resolver <strong>no se puede publicar</strong>,
          y eso no lo decide esta pantalla: lo impide una restricción en la base
          de datos. Publicar material sin derechos no es un fallo técnico, es una
          demanda.
        </p>
        <p className="mt-2 text-xs text-ink-faint">
          La subida a R2 y la distribución a YouTube llegan con el
          almacenamiento y las credenciales. Lo que decide si un video puede
          salir ya funciona.
        </p>
      </div>

      {error && (
        <p role="alert" className="mt-6 rounded-md border border-red-600/40 bg-red-700/5 p-3 text-sm text-red-700">
          No se pudo leer la cola: {error.message}
        </p>
      )}

      {!error && (videos?.length ?? 0) === 0 && (
        <div className="mt-8 rounded-lg border border-line bg-surface-2 p-8">
          <p className="text-ink">La cola está vacía.</p>
          <p className="mt-2 text-sm text-ink-soft">
            Aparecerán aquí los videos presentados que esperan decisión.
          </p>
        </div>
      )}

      <ul className="mt-8 space-y-4">
        {(videos ?? []).map((v) => {
          const autor = v.users as { display_name: string | null; email: string | null } | null;
          const concurso = v.contests as {
            name: string;
            cities: { name: string } | null;
            countries: { name: string } | null;
          } | null;
          const ronda = v.rounds as { name: string } | null;
          const categoria = v.categories as { name: string } | null;
          const derechos = DERECHOS[v.rights_status] ?? {
            texto: v.rights_status,
            color: "text-ink-faint",
          };
          const bloqueado = BLOQUEAN_PUBLICACION.includes(v.rights_status);

          return (
            <li key={v.id} className="rounded-lg border border-line p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="font-display text-lg text-ink">{v.title}</h2>
                  <p className="mt-1 text-sm text-ink-soft">
                    {autor?.display_name ?? autor?.email ?? "—"} ·{" "}
                    {concurso?.name ?? "—"} ·{" "}
                    {concurso?.cities?.name ?? concurso?.countries?.name ?? ""}
                  </p>
                  <p className="mt-1 text-xs text-ink-faint">
                    {ronda?.name ?? "sin ronda"} · {categoria?.name ?? "sin categoría"} ·{" "}
                    {v.duration_s ? `${Math.round(v.duration_s / 60)} min` : "duración desconocida"}{" "}
                    · esperando desde{" "}
                    {new Date(v.created_at).toLocaleDateString("es")}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-xs text-ink">{v.status}</span>
                  <span className={`block text-xs ${derechos.color}`}>
                    Derechos: {derechos.texto}
                  </span>
                </div>
              </div>

              {v.description && (
                <p className="mt-3 text-sm text-ink-soft">{v.description}</p>
              )}

              {v.master_url && (
                <a
                  href={v.master_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-block text-sm text-red-600 underline"
                >
                  Abrir el máster
                </a>
              )}

              {bloqueado && (
                <p className="mt-3 rounded-md border border-red-600/40 bg-red-700/5 p-2.5 text-xs text-red-700">
                  Aunque lo apruebes, no podrá publicarse mientras los derechos
                  estén «{derechos.texto.toLowerCase()}».
                </p>
              )}

              {puedeDecidir && (
                <div className="mt-4 border-t border-line pt-4">
                  <Decidir videoId={v.id} titulo={v.title} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
