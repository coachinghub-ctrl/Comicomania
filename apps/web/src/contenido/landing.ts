/* Todo el texto de la landing, separado del JSX.
   La copia cambia seguido; el maquetado no. Ver el Prompt Maestro del sitio. */

export const HERO = {
  eyebrow: "El movimiento global del humor",
  titulo: ["El humor", "nos mueve"],
  subtitulo:
    "El movimiento global donde el humor conecta talento, audiencia, marcas y oportunidades.",
  texto:
    "Una plataforma de entretenimiento donde humoristas, creadores, espectadores, estudiantes, marcas y negocios se conectan alrededor de una misma pasión: hacer reír.",
  verbos: ["Descubre", "Participa", "Aprende", "Comparte", "Conecta", "Crece"],
  ctaPrincipal: { texto: "Únete al movimiento", href: "/entrar" },
  ctaSecundario: { texto: "Descubre COMICOMANÍA", href: "#movimiento" },
};

export const MOVIMIENTO = {
  titulo: ["No es solo humor.", "Es un movimiento."],
  parrafos: [
    "COMICOMANÍA nace para transformar la manera en que descubrimos, vivimos y compartimos el humor.",
    "Creamos un ecosistema donde nuevos talentos pueden darse a conocer, los humoristas pueden crecer, las audiencias pueden participar y las marcas pueden conectar con una comunidad activa a través del entretenimiento.",
  ],
  remate: "Aquí el espectador deja de ser solamente espectador.",
  verbos: [
    "Descubre",
    "Vota",
    "Comparte",
    "Participa",
    "Aprende",
    "Compite",
    "Conecta",
    "Crece",
  ],
};

export const JOURNEY = {
  titulo: "Todo comienza con una risa",
  pasos: [
    { verbo: "Descubre", texto: "Encuentra nuevos humoristas, creadores y contenido." },
    { verbo: "Mira", texto: "Disfruta videos, shows, competencias y experiencias." },
    { verbo: "Vota", texto: "Participa en concursos y ayuda a impulsar nuevos talentos." },
    { verbo: "Comparte", texto: "Haz que el humor viaje de persona a persona." },
    { verbo: "Aprende", texto: "Accede a cursos, talleres y experiencias de formación." },
    { verbo: "Participa", texto: "Forma parte de competencias, eventos y actividades." },
    { verbo: "Crece", texto: "Construye audiencia, presencia y oportunidades." },
    { verbo: "Conecta", texto: "Forma parte de una comunidad que cruza ciudades, países y culturas." },
  ],
};

export const PROPOSITO = {
  eyebrow: "Lo que defendemos",
  titulo: "Humor con propósito",
  entrada:
    "Queremos contribuir a rescatar el humor que hace reír sin destruir, sin humillar y sin recurrir constantemente a palabras ofensivas. Creemos en un humor creativo, inteligente, auténtico y capaz de conectar generaciones.",
  demostracion: "Queremos demostrar que se puede:",
  principios: [
    "Hacer reír con buenas palabras.",
    "Ser irreverente sin perder creatividad.",
    "Divertir sin destruir.",
    "Crear sin necesidad de ofender.",
    "Hacer del humor una herramienta de conexión.",
  ],
  giro: { antes: "No buscamos censurar la creatividad.", despues: "Buscamos elevarla." },
  puentes: {
    entrada: "El humor también puede tener propósito.",
    verbos: [
      "Puede unir.",
      "Puede sanar.",
      "Puede enseñar.",
      "Puede hacernos pensar.",
      "Puede abrir conversaciones.",
      "Puede descubrir talento.",
      "Puede crear oportunidades.",
    ],
    cierre: "Y, sobre todo: puede hacernos reír.",
  },
};

export const PERFILES = [
  {
    id: "humorista",
    titulo: "Soy humorista",
    promesa: "Tu escenario ahora puede estar en cualquier lugar.",
    items: [
      "Crea tu perfil",
      "Sube contenido",
      "Participa en competencias",
      "Construye audiencia",
      "Conecta con marcas",
      "Encuentra oportunidades",
    ],
    remate: "Lleva tu talento más lejos.",
    cta: { texto: "Quiero participar", href: "/entrar" },
    destacado: true,
  },
  {
    id: "espectador",
    titulo: "Soy espectador",
    promesa: "Aquí no solamente vienes a mirar.",
    items: [
      "Descubre nuevos talentos",
      "Mira contenido",
      "Vota por tus favoritos",
      "Comparte y participa",
      "Asiste a eventos",
      "Forma parte de la comunidad",
    ],
    remate: null,
    cta: { texto: "Quiero explorar", href: "/entrar" },
    destacado: false,
  },
  {
    id: "estudiante",
    titulo: "Soy estudiante",
    promesa: "El humor también se aprende, se practica y se desarrolla.",
    items: ["Cursos", "Talleres", "Recursos", "Referentes", "Experiencias"],
    remate: "Diseñado para ayudarte a desarrollar tu talento.",
    cta: { texto: "Quiero aprender", href: "/entrar" },
    destacado: false,
  },
  {
    id: "marca",
    titulo: "Soy una marca o negocio",
    promesa: "Conecta tu marca con una comunidad que quiere entretenerse.",
    items: [
      "Patrocinio",
      "Publicidad",
      "Activaciones",
      "Branded content",
      "Eventos y concursos",
      "Creadores y experiencias",
    ],
    remate: null,
    cta: { texto: "Quiero conectar mi marca", href: "/entrar" },
    destacado: false,
  },
  {
    id: "operador",
    titulo: "Soy operador",
    promesa: "Desarrolla COMICOMANÍA en tu territorio.",
    items: [
      "Administra una ciudad o un país",
      "Alcance definido por la administración general",
      "Talento, eventos y comunidad local",
    ],
    remate: "Los operadores autorizados administran territorios específicos.",
    cta: { texto: "Quiero conocer más", href: "/entrar" },
    destacado: false,
  },
] as const;


export const TALENT = {
  marca: "COMICOMANÍA Talent",
  titulo: ["¿Tienes lo que hace falta para", "hacer reír", "al mundo?"],
  entrada: "Tu talento merece algo más que un video perdido en las redes.",
  texto:
    "COMICOMANÍA TALENT es el escenario donde nuevos humoristas pueden mostrar lo que hacen, conectar con una audiencia, competir y convertir su talento en oportunidades reales.",
  remate: "De tu ciudad para el mundo.",
  ctaPrincipal: { texto: "Sube tu video", href: "/entrar" },
  ctaSecundario: { texto: "Ver talentos", href: "/entrar" },
  pasos: [
    { icono: "Video", verbo: "Sube tu video", texto: "Muestra tu talento al mundo." },
    { icono: "Grupo", verbo: "Participa", texto: "Sé parte de la competencia." },
    { icono: "Crece", verbo: "Consigue votos", texto: "Haz crecer tu audiencia." },
    { icono: "Estrella", verbo: "Avanza", texto: "Supera nuevas etapas." },
    { icono: "Cohete", verbo: "Hazte visible", texto: "Conecta con oportunidades." },
    { icono: "Conecta", verbo: "Crece", texto: "Lleva tu talento más lejos." },
  ],
} as const;


export const ACADEMY = {
  marca: "COMICOMANÍA Academy",
  titulo: ["El talento te abre la puerta.", "La preparación te lleva más lejos."],
  entrada: "Tener talento es solo el comienzo.",
  texto:
    "COMICOMANÍA Academy es el espacio donde humoristas y creadores desarrollan las habilidades para transformar su creatividad en contenido, audiencia, marca y oportunidades.",
  cta: { texto: "Explora la Academy", href: "/entrar" },
  pilares: [
    {
      icono: "Idea",
      verbo: "Crea",
      temas: [
        "Storytelling",
        "Escritura humorística",
        "Creación de personajes",
        "Improvisación",
      ],
    },
    {
      icono: "Participa",
      verbo: "Comunica",
      temas: [
        "Stand-up comedy",
        "Escenario",
        "Comunicación efectiva",
        "Contenido para redes",
      ],
    },
    {
      icono: "Grupo",
      verbo: "Construye",
      temas: [
        "Marca personal",
        "Construcción de audiencia",
        "Producción de contenido",
        "Estrategia digital",
      ],
    },
    {
      icono: "Crece",
      verbo: "Monetiza",
      temas: [
        "Negocio del entretenimiento",
        "Oportunidades",
        "IA aplicada a contenido",
        "Monetización",
      ],
    },
  ],
  recorrido: ["Descubre tu talento", "Desarróllalo", "Conviértelo en una carrera"],
} as const;


export const SHOP = {
  marca: "COMICOMANÍA Shop",
  titulo: ["No es merch.", "Es parte del movimiento."],
  entrada: "El humor también se lleva puesto.",
  texto:
    "COMICOMANÍA Shop reúne productos oficiales, colecciones de humoristas y colaboraciones especiales creadas para quienes no solo siguen el movimiento:",
  remate: "forman parte de él.",
  cta: { texto: "Explora la tienda", href: "/tienda" },
  garantias: [
    { icono: "Envio", texto: "Envíos a todo el mundo" },
    { icono: "Escudo", texto: "Productos oficiales" },
    { icono: "Pago", texto: "Pago seguro y confiable" },
  ],
  familias: [
    {
      icono: "Percha",
      nombre: "Originals",
      texto: "La identidad oficial de COMICOMANÍA.",
      items: ["T-shirts", "Hoodies", "Gorras", "Accesorios"],
    },
    {
      icono: "Grupo",
      nombre: "Creator collections",
      texto: "El humor de tus creadores favoritos convertido en productos.",
      items: ["Colecciones", "Frases", "Personajes", "Colaboraciones"],
    },
    {
      icono: "Regalo",
      nombre: "Special drops",
      texto: "Productos que cuentan momentos del movimiento.",
      items: ["Eventos", "Ciudades", "Competencias", "Ediciones limitadas"],
    },
  ],
  firma: { lemas: ["Ríete.", "Conecta.", "Pertenece."], cierre: "Llévalo contigo." },
} as const;


export const LIVE = {
  marca: "COMICOMANÍA Live",
  titulo: ["De la pantalla al escenario.", "De tu ciudad al mundo."],
  entrada: "El humor se vive mejor cuando lo compartimos.",
  texto:
    "COMICOMANÍA LIVE convierte la comunidad digital en experiencias reales donde humoristas, audiencias, ciudades y marcas se encuentran cara a cara.",
  ctaPrincipal: { texto: "Descubre los eventos", href: "/entrar" },
  ctaSecundario: { texto: "Quiero participar", href: "/entrar" },
  /* El aviso del próximo evento. Sin fecha y sin venta: todavía no hay
     entradas, así que el botón apunta a avisar, no a comprar. Cuando el
     Contest Engine y Ticketing existan (Fase E y J), esto sale de la base. */
  aviso: {
    etiqueta: "Próximo COMICOMANÍA Live",
    ciudad: "Miami",
    estado: "Próximamente",
    cta: { texto: "Avísame", href: "/entrar" },
  },
  familias: [
    {
      icono: "Participa",
      nombre: "Shows & festivals",
      texto: "Grandes escenarios, festivales y experiencias en vivo.",
    },
    {
      icono: "Grupo",
      nombre: "Open mics & competencias",
      texto:
        "El escenario donde nuevos talentos tienen la oportunidad de demostrar lo que pueden hacer.",
    },
    {
      icono: "Ubicacion",
      nombre: "Tours & cities",
      texto:
        "COMICOMANÍA viajando y conectando comunidades en diferentes ciudades y países.",
    },
    {
      icono: "Estrella",
      nombre: "Brand experiences",
      texto:
        "Activaciones, grabaciones y experiencias donde las marcas forman parte del entretenimiento.",
    },
  ],
  firma: {
    antes: "La comunidad nace digital.",
    despues: "La experiencia se vive en persona.",
  },
} as const;

export const MARCAS = {
  eyebrow: "Para marcas",
  titulo: ["No interrumpas el entretenimiento.", "Forma parte de él."],
  texto:
    "COMICOMANÍA conecta marcas con audiencias a través del humor, talento, contenido y experiencias que las personas realmente quieren compartir.",
  formula: ["Tu marca", "Nuestro talento", "Nuestra comunidad"],
  cta: { texto: "Quiero conectar mi marca", href: "/entrar" },
  bloques: [
    {
      icono: "Contenido",
      nombre: "Content & talent",
      items: ["Branded content", "Humoristas", "Creadores", "Colaboraciones"],
      texto: "Tu marca integrada naturalmente en contenido que entretiene.",
    },
    {
      icono: "Grupo",
      nombre: "Experiences",
      items: ["Patrocinios", "Eventos", "Activaciones", "Competencias"],
      texto: "Convierte la marca en una experiencia que la audiencia pueda vivir.",
    },
    {
      icono: "Crece",
      nombre: "Media & amplification",
      items: ["Plataforma", "Social", "Promociones", "Distribución"],
      texto:
        "Lleva el mensaje más allá del evento y amplifica su alcance dentro del ecosistema.",
    },
    {
      icono: "Tarta",
      nombre: "Data & insights",
      items: ["Audiencia", "Participación", "Tendencias", "Resultados"],
      texto:
        "Entiende cómo interactúa la comunidad y mide el impacto de cada acción, respetando las políticas de privacidad aplicables.",
    },
  ],
  cadena: {
    titulo: "Una idea. Múltiples puntos de conexión.",
    puntos: [
      { icono: "Pantalla", nombre: "Digital" },
      { icono: "Contenido", nombre: "Content" },
      { icono: "Grupo", nombre: "Talent" },
      { icono: "Calendario", nombre: "Live" },
      { icono: "Comparte", nombre: "Social" },
      { icono: "Conecta", nombre: "Community" },
    ],
    remate: {
      antes: "Tu marca no tiene que mirar el movimiento desde afuera.",
      despues: "Puede ser parte de él.",
    },
    cta: { texto: "Hablemos de tu marca", href: "/entrar" },
  },
} as const;

export const EXPANSION = {
  eyebrow: "COMICOMANÍA Global",
  titulo: ["Una plataforma.", "Muchas ciudades.", "Un solo movimiento."],
  entrada: "COMICOMANÍA nace global, pero crece localmente.",
  texto:
    "Conectamos talento, audiencias, operadores, marcas y experiencias en diferentes ciudades, manteniendo todo dentro de un mismo ecosistema.",
  escalera: [
    { icono: "Ciudad", nivel: "Ciudad", texto: "Descubrimos talento local." },
    { icono: "Corona", nivel: "País", texto: "Creamos comunidad." },
    { icono: "Region", nivel: "Región", texto: "Generamos experiencias." },
    { icono: "Conecta", nivel: "Mundo", texto: "Conectamos el mundo." },
  ],
  desarrolla: [
    "Talento local",
    "Eventos",
    "Competencias",
    "Alianzas",
    "Patrocinantes",
    "Contenido",
    "Comunidad",
    "Experiencias",
  ],
  cta: { texto: "Quiero llevar COMICOMANÍA a mi ciudad", href: "/entrar" },
  firma: {
    antes: "El humor nace en cualquier lugar.",
    despues: "COMICOMANÍA lo conecta con el mundo.",
  },
  coda: ["Más personas.", "Más ciudades.", "Más historias."],
} as const;

export const MANIFIESTO = {
  titulo: "Creemos en el poder de hacer reír.",
  creencias: [
    "Creemos que detrás de cada gran humorista hubo un día en el que nadie conocía su nombre.",
    "Creemos que el talento puede aparecer en cualquier barrio, ciudad o país.",
    "Creemos que no necesitas destruir a alguien para hacer reír.",
    "Creemos en la creatividad. En las buenas palabras. En las historias. En los personajes. En la capacidad de encontrar humor incluso en las cosas más simples de la vida.",
    "Creemos que una audiencia puede cambiar una carrera. Que una oportunidad puede cambiar una vida. Que una risa puede cruzar fronteras.",
    "Y creemos que el humor puede volver a convertirse en un espacio que podamos compartir entre generaciones.",
  ],
  cierre:
    "Por eso creamos un lugar donde el talento pueda ser descubierto, donde las personas puedan participar y donde el humor pueda convertirse en una oportunidad.",
  lemas: ["Humor con propósito.", "Humor que conecta.", "Humor que nos mueve."],
  firma: ["Esto es COMICOMANÍA.", "Y apenas estamos comenzando."],
};

export const CIERRE = {
  titulo: "¿Listo para ser parte del movimiento?",
  texto:
    "No importa si haces reír, quieres reír, quieres aprender, quieres descubrir talento o quieres conectar tu marca con nuevas audiencias. Hay un lugar para ti en COMICOMANÍA.",
  ctaPrincipal: { texto: "Únete a COMICOMANÍA", href: "/entrar" },
  ctaSecundario: { texto: "Crear mi cuenta", href: "/entrar" },
};

export const NAVEGACION = [
  { texto: "Descubre", href: "#movimiento" },
  { texto: "Talent", href: "#talent" },
  { texto: "Academy", href: "#academy" },
  { texto: "Live", href: "#live" },
  { texto: "Shop", href: "/tienda" },
  { texto: "Para marcas", href: "#marcas" },
  { texto: "Nosotros", href: "#manifiesto" },
];

/* Cifras declaradas por el negocio, no calculadas por la plataforma.
   Van aparte de metricas_publicas() a propósito: esas salen de la base y
   no se pueden inflar; estas son una afirmación de COMICOMANÍA y alguien
   tiene que responder por ellas. Si dejan de ser ciertas, se corrigen
   acá o se quitan. */
export const CIFRAS_DECLARADAS = [
  { clave: "personas", etiqueta: "Personas impactadas", valor: 10000, prefijo: "+" },
] as const;
