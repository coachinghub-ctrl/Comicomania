/* Datos de muestra para la Fase A.
   Desaparecen en la Fase E, cuando el Contest Engine sirva ciudades y
   concursos reales desde la base. Nada de esto se hard-codea en producción:
   país, ciudad y temporada son filas en `countries`, `cities` y `contests`.
   Ver docs/04-contest-engine.md */
export type CiudadDemo = {
  nombre: string;
  estado: "abierto" | "votacion" | "proximo";
};

export const ciudadesDemo: CiudadDemo[] = [
  { nombre: "Miami", estado: "abierto" },
  { nombre: "Orlando", estado: "proximo" },
  { nombre: "CDMX", estado: "proximo" },
  { nombre: "Bogotá", estado: "proximo" },
  { nombre: "Madrid", estado: "proximo" },
];

export const pasos = [
  {
    numero: "01",
    titulo: "Crea tu COMICOMANIA ID",
    texto:
      "Una sola identidad para concursar, votar, comprar entradas y estudiar. Nunca vas a tener que crear otra cuenta.",
  },
  {
    numero: "02",
    titulo: "Sube tu rutina",
    texto:
      "Dos minutos de video, desde el teléfono. Te decimos al instante si cumple los requisitos técnicos.",
  },
  {
    numero: "03",
    titulo: "Que decidan el jurado y la gente",
    texto:
      "Un jurado con rúbrica pública y el voto del público, con una regla clara: un voto verificado por persona.",
  },
];

/* Los cinco principios de HUMOR CON PROPÓSITO, tal como los define la marca. */
export const principios = [
  "Hacer reír con buenas palabras.",
  "Ser irreverente sin perder creatividad.",
  "Divertir sin destruir.",
  "Crear sin necesidad de ofender.",
  "Hacer del humor una herramienta de conexión.",
];
