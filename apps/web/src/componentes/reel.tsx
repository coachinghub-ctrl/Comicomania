/* El video de un humorista, venga de donde venga.

   Un reel de comedia vive casi siempre en YouTube o en Vimeo, porque ahí ya
   está transcodificado, servido y con su miniatura. A veces es un mp4 suelto.
   Esta pieza decide cuál de las dos cosas es y lo enseña como toca, en vez de
   obligar a que todo el mundo suba el archivo a un sitio concreto.

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

function idDeVimeo(u: URL): string | null {
  if (!/(^|\.)vimeo\.com$/.test(u.hostname)) return null;
  const m = u.pathname.match(/\/(\d+)/);
  return m ? m[1]! : null;
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
  const vimeo = youtube ? null : idDeVimeo(destino);

  if (youtube || vimeo) {
    const src = youtube
      ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(youtube)}`
      : `https://player.vimeo.com/video/${encodeURIComponent(vimeo!)}`;

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
