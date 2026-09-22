import type { Route } from "next";
import { redirect } from "next/navigation";
import { ButtonLink, Logo } from "@comicomania/ui";
import { siguientePaso, type EstadoUsuario } from "@comicomania/domain";
import { crearClienteServidor } from "@/lib/supabase/server";
import { cargarActor } from "@/lib/autorizacion";

export const metadata = { title: "Mi COMICOMANÍA" };

/* Los campos que el perfil exige. Son los mismos que decide la columna
   generada `profile_complete` de la base: acá solo se cuentan para poder
   mostrar un porcentaje, nunca para decidir si está completo. Si esta lista y
   la de la base discreparan, mandaría la base. */
const CAMPOS_DEL_PERFIL = [
  "first_name",
  "last_name",
  "country_id",
  "city_id",
  "birth_date",
  "whatsapp",
] as const;

function completitud(u: Record<string, unknown>): number {
  const puestos = CAMPOS_DEL_PERFIL.filter((c) => Boolean(u[c])).length;
  return Math.round((puestos / CAMPOS_DEL_PERFIL.length) * 100);
}

export default async function MiComicomania() {
  const supabase = await crearClienteServidor();

  const {
    data: { user: credencial },
  } = await supabase.auth.getUser();
  if (!credencial) redirect("/entrar?volver=/mi" as Route);

  // Un operador de otra ciudad no podría leer esta fila aunque cambiara el
  // id en la URL: RLS solo devuelve la del propio auth.uid().
  const { data: id } = await supabase
    .from("users")
    .select("*")
    .eq("id", credencial.id)
    .single();

  /* Sin perfil no se pasa. No es una molestia burocrática: sin ciudad no se
     sabe qué concursos le tocan, sin fecha de nacimiento no hay categoría, y
     sin WhatsApp no hay cómo avisarle que pasó de ronda. Quien lo complete a
     medias vuelve acá solo. */
  if (id && !id.profile_complete) {
    redirect("/mi/perfil?primera=1" as Route);
  }

  const { data: tipos } = await supabase
    .from("user_type_assignments")
    .select("user_types(slug, name)")
    .eq("user_id", credencial.id);

  const slugs = (tipos ?? [])
    .map((t) => (t.user_types as { slug: string } | null)?.slug)
    .filter(Boolean) as string[];

  const estado: EstadoUsuario = {
    emailVerificado: Boolean(id?.email_verified_at ?? credencial.email_confirmed_at),
    completitudPerfil: id ? completitud(id) : 0,
    esHumorista: slugs.includes("HUMORISTA"),
    // Estos llegan con el Contest Engine (Fase E) y el Commerce (Fase I).
    concursoAbierto: null,
    participacion: null,
    votacionAbierta: false,
    haVotado: false,
    talentosQueSigue: 0,
    entradas: 0,
    cursosActivos: 0,
    diasSinActividad: 0,
  };

  const accion = siguientePaso(estado);
  const nombre = id?.display_name ?? credencial.email?.split("@")[0] ?? "";

  /* Quien opera la plataforma también es usuario, y entra por la misma puerta.
     Sin esto un OWNER aterriza en la vista de espectador sin forma de llegar
     al panel. Los grants los lee RLS: si no tiene, no se pinta nada. */
  const actor = await cargarActor();
  const vigentes = actor.grants.filter(
    (g) => g.estado === "ACTIVE" && (!g.hasta || g.hasta > new Date()),
  );
  const roles = [...new Set(vigentes.map((g) => g.rol))].join(", ");
  const alcance = vigentes.some((g) => g.tipoAlcance === "GLOBAL")
    ? "Global"
    : [...new Set(vigentes.map((g) => g.alcancePath).filter(Boolean))].join(" · ");

  return (
    <main className="min-h-dvh">
      <header className="mx-auto flex max-w-4xl items-center justify-between px-5 py-5">
        <a href="/">
          <Logo ancho={120} prioridad />
        </a>
        <form action="/auth/salir" method="post">
          <button className="text-sm text-muted transition-colors hover:text-paper-pure">
            Salir
          </button>
        </form>
      </header>

      <div className="mx-auto max-w-4xl px-5 pb-16">
        <div className="flex items-center gap-3">
          {id?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={id.avatar_url}
              alt=""
              width={40}
              height={40}
              className="size-10 shrink-0 rounded-full border border-stage-600 object-cover"
            />
          ) : null}
          <p className="text-sm text-muted">Hola, {nombre}</p>
        </div>
        <h1 className="font-display mt-1 mb-8 text-4xl text-paper uppercase">
          Mi COMICOMANÍA
        </h1>

        {vigentes.length > 0 && (
          <section className="mb-6 flex flex-col gap-4 rounded-lg border border-gold-400/50 bg-stage-800 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs tracking-[0.2em] text-gold-400 uppercase">
                Tienes acceso al Control Center
              </p>
              <p className="mt-1 text-sm text-muted">
                {roles}
                {alcance ? ` · ${alcance}` : ""}
              </p>
            </div>
            <ButtonLink href={"/admin" as Route} variante="secundaria">
              Ir al panel
            </ButtonLink>
          </section>
        )}

        {/* Una sola acción, grande. El usuario nunca se queda sin saber qué sigue. */}
        <section className="rounded-lg border border-red-500/40 bg-stage-800 p-6 sm:p-8">
          <p className="mb-2 text-xs tracking-[0.2em] text-gold-400 uppercase">
            Tu siguiente paso
          </p>
          <h2 className="font-display text-2xl text-paper uppercase sm:text-3xl">
            {accion.titulo}
          </h2>
          <p className="mt-2 text-muted">{accion.descripcion}</p>
          <ButtonLink href={accion.href as Route} tamano="lg" className="mt-6">
            Vamos
          </ButtonLink>
        </section>

        <section className="mt-10 grid gap-4 sm:grid-cols-3">
          {[
            { etiqueta: "Mi participación", valor: "Sin concursos todavía", href: "/mi/participacion" },
            { etiqueta: "Mis entradas", valor: String(estado.entradas), href: "/mi/entradas" },
            { etiqueta: "Mi academia", valor: String(estado.cursosActivos), href: "/mi/academia" },
          ].map((tarjeta) => (
            <a
              key={tarjeta.etiqueta}
              href={tarjeta.href as Route}
              className="rounded-lg border border-stage-600 bg-stage-900 p-5 transition-colors hover:border-stage-600 hover:bg-stage-800"
            >
              <p className="text-xs tracking-wider text-muted-dim uppercase">
                {tarjeta.etiqueta}
              </p>
              <p className="mt-2 text-lg text-paper-pure">{tarjeta.valor}</p>
            </a>
          ))}
        </section>

        <section className="mt-10 rounded-lg border border-stage-600 bg-stage-900 p-5">
          <p className="text-xs tracking-wider text-muted-dim uppercase">
            Tu identidad
          </p>
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <div className="flex gap-2">
              <dt className="text-muted">Email:</dt>
              <dd className="text-paper-pure">{credencial.email}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted">Perfil:</dt>
              <dd className="text-paper-pure">{estado.completitudPerfil}% completo</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted">Tipos:</dt>
              <dd className="text-paper-pure">{slugs.join(", ") || "—"}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted">Código de referido:</dt>
              <dd className="font-mono text-gold-400">{id?.referral_code ?? "—"}</dd>
            </div>
          </dl>
          <a
            href="/mi/perfil"
            className="mt-4 inline-block text-sm text-red-300 transition-colors hover:text-red-400"
          >
            Editar mi perfil y mi foto
          </a>
        </section>
      </div>
    </main>
  );
}
