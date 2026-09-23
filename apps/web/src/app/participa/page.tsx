import type { Route } from "next";
import { ButtonLink, Logo } from "@comicomania/ui";
import { crearClienteServidor } from "@/lib/supabase/server";
import { Inscripcion, type Categoria } from "./formulario";

export const metadata = {
  title: "Sube tu video · COMICOMANÍA",
  description:
    "Cómo funciona el concurso de COMICOMANÍA, qué se pide del video y cómo inscribirte. Dos minutos, humor limpio, y diez jueces famosos del mundo hispano.",
};

/* Sube tu video: la mecánica entera antes del formulario.

   El orden importa y no es decorativo. Quien llega aquí desde el home no sabe
   qué se le pide, y un formulario sin explicación produce cien videos que hay
   que rechazar uno por uno — cada rechazo, una persona enfadada con razón
   porque nadie le dijo que dos minutos eran dos minutos.

   Así que primero la mecánica, luego los requisitos, luego las fechas, y solo
   al final el formulario.

   Esto no se puede leer sin cuenta hasta el final: la mecánica sí, la
   inscripción no. El consentimiento tiene que quedar a nombre de alguien y la
   edad tiene que salir de un perfil, no de una casilla. */

/* La mecánica real, la del formato, no una genérica.

   Lo que había aquí me lo inventé antes de leer el plan de negocio. Esto sale
   de ahí: tres temporadas de trece semanas, competencias de lunes a viernes,
   diez jueces famosos, y la segunda oportunidad del Ave Fénix. Es mejor que
   lo que escribí yo, y además es lo que va a pasar de verdad. */
const PASOS = [
  {
    titulo: "Te inscribes",
    texto:
      "Con tu cuenta y tu perfil completo. La fecha de nacimiento decide tu categoría y se congela con la fecha de referencia del concurso: cumplir años compitiendo no te cambia de grupo.",
  },
  {
    titulo: "Mandas tu video",
    texto:
      "De dos a tres minutos, y más largos conforme avanzas de etapa. Lo subes donde quieras —YouTube, Vimeo, Drive— y aquí pegas el enlace.",
  },
  {
    titulo: "Alguien lo mira",
    texto:
      "Cada envío pasa por revisión humana: duración, autoría y derechos. No es un filtro automático, y por eso tarda. Si algo falla te decimos exactamente qué, y puedes corregirlo.",
  },
  {
    titulo: "Compites toda la semana",
    texto:
      "De lunes a viernes en YouTube, Instagram, Facebook, TikTok y Telegram. Los fines de semana, resumen en vivo con Fernando Arau y los jueces.",
  },
  {
    titulo: "Te ven diez jueces famosos",
    texto:
      "Cada uno trae su propia audiencia de su país. Y vota el público: un voto por persona, con el peso del jurado controlado frente al voto popular.",
  },
  {
    titulo: "Y si caes, el Ave Fénix",
    texto:
      "Cada temporada da diez ganadores y seis más por la vía “Ave Fénix: Mi Segunda Oportunidad”. Quedarse fuera en una ronda no es el final del camino.",
  },
];

/* Lo que se lleva quien gana. Estaba en el plan y no en la web, y es
   exactamente la razón por la que alguien se molesta en grabar y mandar. */
const PREMIOS = [
  "Premio en efectivo y productos de los patrocinadores.",
  "Beca de tres meses en el Instituto Gracia, la escuela de la casa.",
  "Mentoría personal de Fernando Arau.",
  "Posibilidad de que te represente ProCómiCo, la agencia.",
  "Visibilidad ante diez jueces famosos y una audiencia internacional.",
];

/* La regla editorial del concurso, dicha antes de que alguien grabe dos
   minutos que no van a poder entrar. */
const LIMPIO =
  "Humor limpio: ingenioso y divertido para todo público, sin palabras vulgares ni doble sentido sexual ofensivo. No es una limitación — es lo que permite que tu material se vea en televisión, en eventos de empresa y en cualquier casa del mundo hispano.";

export default async function Participa() {
  const supabase = await crearClienteServidor();

  const {
    data: { user: credencial },
  } = await supabase.auth.getUser();

  const { data: concurso } = await supabase
    .from("contests")
    .select(
      "id, slug, name, status, description, how_to_enter, invitation_image_url, invitation_image_alt, registration_closes_at, submission_deadline, age_reference_date, prize, cities(name), countries(name), categories(id, name, min_age, max_age), rounds(name, order, type, starts_at, ends_at), contest_requirements(id, order, title, detail, fails_when, is_required)",
    )
    .eq("status", "OPEN")
    .order("registration_closes_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  // Perfil y estado de la persona, solo si hay sesión.
  let perfil:
    | { completo: boolean; edad: number | null; yaInscrito: boolean }
    | null = null;

  if (credencial && concurso) {
    const [{ data: yo }, { data: inscripcion }] = await Promise.all([
      supabase
        .from("users")
        .select("profile_complete, birth_date")
        .eq("id", credencial.id)
        .maybeSingle(),
      supabase
        .from("participants")
        .select("id, status")
        .eq("user_id", credencial.id)
        .eq("contest_id", concurso.id)
        .maybeSingle(),
    ]);

    let edad: number | null = null;
    if (yo?.birth_date) {
      const referencia = new Date(
        `${concurso.age_reference_date ?? new Date().toISOString().slice(0, 10)}T00:00:00`,
      );
      const nacimiento = new Date(`${yo.birth_date}T00:00:00`);
      edad = referencia.getFullYear() - nacimiento.getFullYear();
      const mes = referencia.getMonth() - nacimiento.getMonth();
      if (mes < 0 || (mes === 0 && referencia.getDate() < nacimiento.getDate())) {
        edad--;
      }
    }

    perfil = {
      completo: Boolean(yo?.profile_complete),
      edad,
      yaInscrito: Boolean(inscripcion),
    };
  }

  const ciudad = concurso?.cities as { name: string } | null;
  const pais = concurso?.countries as { name: string } | null;

  const requisitos = ((concurso?.contest_requirements ?? []) as {
    id: string;
    order: number;
    title: string;
    detail: string | null;
    fails_when: string | null;
    is_required: boolean;
  }[]).sort((a, b) => a.order - b.order);

  const rondas = ((concurso?.rounds ?? []) as {
    name: string;
    order: number;
    type: string;
    starts_at: string | null;
    ends_at: string | null;
  }[]).sort((a, b) => a.order - b.order);

  const categorias: Categoria[] = ((concurso?.categories ?? []) as {
    id: string;
    name: string;
    min_age: number | null;
    max_age: number | null;
  }[])
    .map((c) => ({
      id: c.id,
      nombre: c.name,
      minima: c.min_age,
      maxima: c.max_age,
    }))
    .sort((a, b) => (a.minima ?? 0) - (b.minima ?? 0));

  const fecha = (valor: string | null | undefined) =>
    valor
      ? new Date(valor).toLocaleDateString("es", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : null;

  return (
    <main className="min-h-dvh">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
        <a href="/" aria-label="COMICOMANÍA">
          <Logo ancho={130} prioridad />
        </a>
        <nav className="flex items-center gap-5 text-sm">
          <a href="/" className="text-muted transition-colors hover:text-paper-pure">
            Inicio
          </a>
          <a
            href="/humoristas"
            className="text-muted transition-colors hover:text-paper-pure"
          >
            Repertorio
          </a>
          <a
            href="/academia"
            className="text-muted transition-colors hover:text-paper-pure"
          >
            Academia
          </a>
          <a href="/entrar" className="text-muted transition-colors hover:text-paper-pure">
            Entrar
          </a>
        </nav>
      </header>

      <section className="mx-auto max-w-5xl px-5 pt-8 pb-10">
        <p className="text-xs tracking-[0.3em] text-gold-400 uppercase">
          COMICOMANÍA Talent
        </p>
        <h1 className="font-display mt-3 text-5xl text-paper uppercase sm:text-6xl">
          Sube tu video.{" "}
          <span className="block text-red-500">Así funciona.</span>
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-muted">
          El primer concurso en línea en español de humoristas amateurs.
          Abierto a todos los estilos: stand-up, mimos, magos, ventrílocuos,
          imitadores, músicos cómicos y humoristas digitales.
        </p>
        <p className="mt-4 max-w-2xl text-muted">
          Dos minutos, material tuyo, y alguien de verdad mirándolo del otro
          lado. Lee esto antes de enviar: casi todo lo que se rechaza se
          rechaza por algo que estaba escrito aquí.
        </p>

        {!concurso && (
          <p className="mt-8 rounded-lg border border-stage-600 bg-stage-800 p-6 text-muted">
            Ahora mismo no hay convocatoria abierta. En cuanto abra la
            siguiente, esta página lo dirá.
          </p>
        )}
      </section>

      {concurso && (
        <>
          {/* El concurso abierto, con su arte. */}
          <section className="mx-auto max-w-5xl px-5 pb-12">
            <div className="grid gap-8 overflow-hidden rounded-lg border border-stage-600 bg-stage-900 lg:grid-cols-[20rem_1fr]">
              {concurso.invitation_image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={concurso.invitation_image_url}
                  alt={concurso.invitation_image_alt ?? concurso.name}
                  width={1080}
                  height={1350}
                  className="aspect-4/5 w-full object-cover"
                />
              )}
              <div className="p-6 lg:py-8 lg:pr-8">
                <p className="text-xs tracking-[0.2em] text-success uppercase">
                  Inscripciones abiertas
                </p>
                <h2 className="font-display mt-2 text-3xl text-paper uppercase">
                  {concurso.name}
                </h2>
                <p className="mt-1 text-muted-dim">
                  {[ciudad?.name, pais?.name].filter(Boolean).join(" · ")}
                </p>
                {concurso.description && (
                  <p className="mt-4 text-muted">{concurso.description}</p>
                )}
                <p className="mt-4 text-sm text-muted-dim">
                  {fecha(concurso.registration_closes_at)
                    ? `Cierra el ${fecha(concurso.registration_closes_at)}.`
                    : ""}
                </p>
                <a
                  href={`/concursos/${concurso.slug}`}
                  className="mt-4 inline-block text-sm text-red-300 underline"
                >
                  Ver el concurso completo
                </a>
              </div>
            </div>
          </section>

          {/* La mecánica. */}
          <section className="mx-auto max-w-5xl px-5 pb-12">
            <h2 className="font-display text-2xl text-paper uppercase">
              De tu casa al escenario, paso a paso
            </h2>
            <ol className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {PASOS.map((p, i) => (
                <li
                  key={p.titulo}
                  className="rounded-lg border border-stage-600 bg-stage-900 p-5"
                >
                  <span className="font-display text-3xl text-red-500 tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="font-display mt-2 text-lg text-paper uppercase">
                    {p.titulo}
                  </h3>
                  <p className="mt-2 text-sm text-muted">{p.texto}</p>
                </li>
              ))}
            </ol>
          </section>

          {/* Qué se gana. Va antes de los requisitos a propósito: primero el
              motivo para molestarse, luego las condiciones. */}
          <section className="mx-auto max-w-5xl px-5 pb-12">
            <h2 className="font-display text-2xl text-paper uppercase">
              Qué te llevas si ganas
            </h2>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {PREMIOS.map((p) => (
                <li
                  key={p}
                  className="rounded-lg border border-stage-600 bg-stage-900 px-5 py-4 text-muted"
                >
                  {p}
                </li>
              ))}
            </ul>

            <p className="mt-8 rounded-lg border border-gold-400/40 bg-gold-400/5 p-5 text-muted">
              <strong className="text-paper">La única regla de fondo.</strong>{" "}
              {LIMPIO}
            </p>
          </section>

          {/* Requisitos, con el motivo exacto de rechazo. */}
          {requisitos.length > 0 && (
            <section className="mx-auto max-w-5xl px-5 pb-12">
              <h2 className="font-display text-2xl text-paper uppercase">
                Qué se pide del video
              </h2>
              <p className="mt-2 max-w-2xl text-muted">
                Cada requisito dice también cuándo se incumple. No es letra
                pequeña: es exactamente lo que mira quien revisa.
              </p>
              <ul className="mt-6 space-y-3">
                {requisitos.map((r) => (
                  <li
                    key={r.id}
                    className="rounded-lg border border-stage-600 bg-stage-900 p-5"
                  >
                    <div className="flex flex-wrap items-baseline gap-3">
                      <h3 className="font-display text-lg text-paper uppercase">
                        {r.title}
                      </h3>
                      {!r.is_required && (
                        <span className="text-xs text-muted-dim">recomendado</span>
                      )}
                    </div>
                    {r.detail && <p className="mt-2 text-muted">{r.detail}</p>}
                    {r.fails_when && (
                      <p className="mt-3 border-l-2 border-red-600 pl-3 text-sm text-red-200">
                        Se rechaza si: {r.fails_when}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Fechas. */}
          {(rondas.length > 0 || concurso.submission_deadline) && (
            <section className="mx-auto max-w-5xl px-5 pb-12">
              <h2 className="font-display text-2xl text-paper uppercase">
                Las fechas
              </h2>
              <ul className="mt-6 divide-y divide-stage-600 rounded-lg border border-stage-600 bg-stage-900">
                {concurso.registration_closes_at && (
                  <li className="flex flex-wrap items-baseline justify-between gap-3 px-5 py-4">
                    <span className="text-paper">Cierre de inscripciones</span>
                    <span className="text-muted tabular-nums">
                      {fecha(concurso.registration_closes_at)}
                    </span>
                  </li>
                )}
                {concurso.submission_deadline && (
                  <li className="flex flex-wrap items-baseline justify-between gap-3 px-5 py-4">
                    <span className="text-paper">Último día para enviar video</span>
                    <span className="text-muted tabular-nums">
                      {fecha(concurso.submission_deadline)}
                    </span>
                  </li>
                )}
                {rondas.map((r) => (
                  <li
                    key={r.name}
                    className="flex flex-wrap items-baseline justify-between gap-3 px-5 py-4"
                  >
                    <span className="text-paper">{r.name}</span>
                    <span className="text-muted tabular-nums">
                      {fecha(r.starts_at) ?? "por anunciar"}
                      {fecha(r.ends_at) ? ` – ${fecha(r.ends_at)}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* La inscripción. */}
          <section id="inscripcion" className="mx-auto max-w-5xl px-5 pb-20">
            <h2 className="font-display text-2xl text-paper uppercase">
              Inscríbete
            </h2>

            {!credencial ? (
              <div className="mt-6 rounded-lg border border-stage-600 bg-stage-900 p-6">
                <p className="text-muted">
                  Para inscribirte hace falta una cuenta, y no es por
                  burocracia: el consentimiento del uso de tu video tiene que
                  quedar <strong className="text-paper">a tu nombre</strong>, y
                  tu categoría sale de tu fecha de nacimiento. Nada de eso
                  funciona con un formulario anónimo.
                </p>
                <p className="mt-3 text-sm text-muted-dim">
                  Leer las bases, los requisitos y las fechas no requiere
                  cuenta. Enviar, sí.
                </p>
                <ButtonLink
                  href={"/entrar?volver=/participa" as Route}
                  tamano="lg"
                  className="mt-5"
                >
                  Entrar o crear mi cuenta
                </ButtonLink>
              </div>
            ) : perfil?.yaInscrito ? (
              <div className="mt-6 rounded-lg border border-success/40 bg-success/5 p-6">
                <p className="font-display text-xl text-paper uppercase">
                  Ya estás dentro
                </p>
                <p className="mt-2 text-muted">
                  Tu inscripción a {concurso.name} está hecha. Puedes ver cómo
                  va tu video desde tu espacio.
                </p>
                <a
                  href="/mi"
                  className="mt-4 inline-block rounded-md bg-red-600 px-5 py-2.5 text-sm font-semibold text-paper hover:bg-red-500"
                >
                  Ver mi inscripción
                </a>
              </div>
            ) : !perfil?.completo ? (
              <div className="mt-6 rounded-lg border border-gold-700/40 bg-gold-400/5 p-6">
                <p className="font-display text-xl text-paper uppercase">
                  Falta completar tu perfil
                </p>
                <p className="mt-2 text-muted">
                  Sin fecha de nacimiento no se puede decidir tu categoría, y
                  sin nombre y contacto no se te puede avisar del resultado de
                  la revisión. Son cinco campos.
                </p>
                <ButtonLink
                  href={"/mi/perfil?volver=/participa" as Route}
                  tamano="lg"
                  className="mt-5"
                >
                  Completar mi perfil
                </ButtonLink>
              </div>
            ) : (
              <div className="mt-6">
                <Inscripcion
                  concursoId={concurso.id}
                  concursoNombre={concurso.name}
                  categorias={categorias}
                  bases={`/concursos/${concurso.slug}`}
                  tuEdad={perfil.edad}
                />
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
