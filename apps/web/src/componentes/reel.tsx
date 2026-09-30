/* El video de un humorista.

   YouTube o un mp4 alojado fuera. Vimeo estaba y se quitó: el canal de la
   casa es uno solo, y sostener varias plataformas de origen cuesta trabajo de
   operación y de auditoría sin dar nada a cambio.

   Un reel en YouTube llega ya transcodificado, servido y con su miniatura, y
   no le cuesta nada a COMICOMANÍA. Un mp4 suelto sigue valiendo para el
   material propio que ya vive en el almacenamiento de la casa.

   No se fía de la URL para decidir: la parsea. Una cadena que empiece por
   "javascript:" o por "data:" no es un video, y un href así dentro de un
   iframe es exactamente el agujero que alguien buscaría. */

function idDeYouTube(u: URL): string | null {
  if (u.hostname === "youtu.be") return u.pathname.slice(1) || null;
  if (!/(^|\.)youtube(-nocookie)?\.com$/.test(u.hostname)) return null;
  if (u.pathname === "/watch") return u.searchParams.get("v");
  const m = u.pathname.match(/^\/(embed|shorts|live)\/([\w-]+)/);
  return m ? m[2]! : null;
}

export function Reel({
  url,
  titulo,
  poster,
}: {
  url: string;
  titulo: string;
  poster?: string | null;
}) {
  let destino: URL;
  try {
    destino = new URL(url);
  } catch {
    return null;
  }
  if (destino.protocol !== "https:" && destino.protocol !== "http:") return null;

  const youtube = idDeYouTube(destino);

  if (youtube) {
    // nocookie: no planta la cookie de seguimiento de YouTube hasta que
    // alguien le da al play.
    const src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(youtube)}`;

    return (
      <div className="aspect-video w-full overflow-hidden rounded-lg border border-stage-600 bg-black">
        <iframe
          src={src}
          title={titulo}
          allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="h-full w-full"
        />
      </div>
    );
  }

  /* Un archivo servido directamente. `preload="none"` a propósito: en una
     página con cuatro humoristas, precargar cuatro videos gasta los datos de
     quien entra desde el móvil sin haberle preguntado. */
  return (
    <video
      src={url}
      controls
      preload="none"
      poster={poster ?? undefined}
      className="aspect-video w-full rounded-lg border border-stage-600 bg-black"
    >
      <track kind="captions" />
      {titulo}
    </video>
  );
}
