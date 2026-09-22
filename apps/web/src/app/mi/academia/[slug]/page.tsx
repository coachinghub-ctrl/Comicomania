import type { Route } from "next";
import { notFound, redirect } from "next/navigation";
import { Logo } from "@comicomania/ui";
import { puedeActor } from "@/lib/autorizacion";
import { crearClienteServidor } from "@/lib/supabase/server";
import { Aula, type Modulo } from "./aula";

export const metadata = { title: "Aula" };

/* El aula de un curso.

   Aquí sí hace falta estar inscrito, y a diferencia del temario público esto
   no se negocia: el temario vende, el contenido es el producto.

   El material y el enlace de la sala NO se leen con un select. Son columnas
   que ni anon ni authenticated pueden seleccionar, así que se piden con
   `contenido_de_leccion`, que comprueba inscripción, muestra o permiso dentro
   de la base. Una sola puerta, y por eso no se olvida cerrar la segunda. */

export default async function AulaDelCurso({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ clase?: string }>;
}) {
  const { slug } = await params;
  const { clase: clasePedida } = await searchParams;

  const supabase = await crearClienteServidor();

  const {
    data: { user: credencial },
  } = await supabase.auth.getUser();
  if (!credencial) redirect(`/entrar?volver=/mi/academia/${slug}` as Route);

  const { data: curso } = await supabase
    .from("courses")
    .select(
      "id, slug, title, subtitle, modality, starts_on, course_modules(id, title, order, lessons(id, title, type, duration_s, order, is_preview, starts_at, ends_at))",
    )
    .eq("slug", slug)
    .maybeSingle();

  if (!curso) notFound();

  const { data: inscripcion } = await supabase
    .from("course_enrollments")
    .select("id, progress_pct, completed_at")
    .eq("course_id", curso.id)
    .eq("user_id", credencial.id)
    .maybeSingle();

  /* Sin inscripción no hay aula... salvo para quien administra la Academia.

     Se entra en VISTA PREVIA, sin poder marcar nada. La alternativa sería
     crear una inscripción de mentira para poder mirar, y eso ensucia la lista
     de alumnos y el porcentaje de avance de un curso con gente que no estudia.

     Quien no es ni una cosa ni la otra va a la página pública del curso, no a
     un 404: llega aquí queriendo entrar, no equivocado de dirección. */
  const previsualiza =
    !inscripcion && (await puedeActor({ seccion: "ACADEMY", accion: "VIEW" }));

  if (!inscripcion && !previsualiza) redirect(`/academia/${slug}` as Route);

  const modulosCrudos = ((curso.course_modules ?? []) as {
    id: string;
    title: string;
    order: number;
    lessons: {
      id: string;
      title: string;
      type: string;
      duration_s: number | null;
      order: number;
      is_preview: boolean;
      starts_at: string | null;
      ends_at: string | null;
    }[];
  }[]).sort((a, b) => a.order - b.order);

  const todasLasClases = modulosCrudos.flatMap((m) =>
    (m.lessons ?? []).map((l) => l.id),
  );

  // Qué ha visto ya, y el contenido de cada clase, en paralelo.
  const [{ data: progreso }, contenidos] = await Promise.all([
    inscripcion
      ? supabase
          .from("lesson_progress")
          .select("lesson_id, completed_at")
          .eq("enrollment_id", inscripcion.id)
      : Promise.resolve({ data: [] }),
    Promise.all(
      todasLasClases.map(async (id) => {
        const { data } = await supabase.rpc("contenido_de_leccion", {
          p_leccion: id,
        });
        const caja = (data ?? null) as {
          asset?: { url?: string; texto?: string } | null;
          sala?: string | null;
        } | null;
        return {
          id,
          material: caja?.asset?.url ?? caja?.asset?.texto ?? null,
          sala: caja?.sala ?? null,
        };
      }),
    ),
  ]);

  const vistas = new Set(
    (progreso ?? [])
      .filter((p) => p.completed_at)
      .map((p) => p.lesson_id),
  );
  const porClase = new Map(contenidos.map((c) => [c.id, c]));

  const modulos: Modulo[] = modulosCrudos.map((m) => ({
    id: m.id,
    titulo: m.title,
    orden: m.order,
    clases: (m.lessons ?? [])
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((l) => ({
        id: l.id,
        titulo: l.title,
        tipo: l.type,
        duracionS: l.duration_s,
        esMuestra: l.is_preview,
        empiezaEn: l.starts_at,
        terminaEn: l.ends_at,
        vista: vistas.has(l.id),
        material: porClase.get(l.id)?.material ?? null,
        sala: porClase.get(l.id)?.sala ?? null,
      })),
  }));

  /* Dónde retomar: la primera sin ver. Volver siempre a la clase uno obliga a
     buscar por dónde iba, y es lo que hace que alguien deje un curso. */
  const primeraSinVer =
    modulos.flatMap((m) => m.clases).find((c) => !c.vista)?.id ?? null;

  return (
    <main className="min-h-dvh">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <a href="/" aria-label="COMICOMANÍA">
          <Logo ancho={120} prioridad />
        </a>
        <nav className="flex items-center gap-5 text-sm">
          <a href="/mi/academia" className="text-muted hover:text-paper-pure">
            Mis cursos
          </a>
          <a href="/mi" className="text-muted hover:text-paper-pure">
            Mi COMICOMANÍA
          </a>
        </nav>
      </header>

      <div className="mx-auto max-w-6xl px-5 pb-16">
        <p className="text-xs tracking-[0.2em] text-gold-400 uppercase">
          COMICOMANÍA Academy
        </p>
        <h1 className="font-display mt-2 text-3xl text-paper uppercase sm:text-4xl">
          {curso.title}
        </h1>

        {inscripcion ? (
          <div className="mt-4 flex items-center gap-3">
            <div className="h-2 max-w-md flex-1 overflow-hidden rounded-full bg-stage-600">
              <div
                className={
                  inscripcion.completed_at ? "h-full bg-success" : "h-full bg-red-600"
                }
                style={{ width: `${inscripcion.progress_pct}%` }}
              />
            </div>
            <span className="text-sm text-paper tabular-nums">
              {inscripcion.progress_pct}%
            </span>
            {inscripcion.completed_at && (
              <span className="text-sm text-success">Terminado</span>
            )}
          </div>
        ) : (
          <p className="mt-4 rounded-md border border-gold-400/40 bg-gold-400/5 px-4 py-3 text-sm text-muted">
            <strong className="text-paper">Vista previa.</strong> Estás viendo
            el aula como la ve un alumno, pero no estás inscrito: no se puede
            marcar nada. Inscribirte solo para mirar ensuciaría la lista de
            alumnos y el avance del curso.
          </p>
        )}

        <div className="mt-10">
          <Aula
            slug={curso.slug}
            inscripcion={inscripcion?.id ?? null}
            modulos={modulos}
            empezarEn={clasePedida ?? primeraSinVer}
          />
        </div>
      </div>
    </main>
  );
}
