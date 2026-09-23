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
  ctaPrincipal: { texto: "Sube tu video", href: "/participa" },
  ctaSecundario: { texto: "Ver el repertorio", href: "/humoristas" },
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
  cta: { texto: "Explora la Academy", href: "/academia" },
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
  ctaPrincipal: { texto: "Descubre los eventos", href: "/eventos/final-miami-2027" },
  ctaSecundario: { texto: "Quiero participar", href: "/concursos/demo-miami-2027" },
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
  { texto: "Repertorio", href: "/humoristas" },
  { texto: "Academy", href: "/academia" },
  { texto: "Live", href: "/eventos/final-miami-2027" },
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


/* ---------------------------------------------------------------------------
   Lo que sigue sale del Business Plan 2027–2031 del propio COMICOMANÍA.

   Es material declarado por el negocio, igual que CIFRAS_DECLARADAS: la
   plataforma no lo calcula ni lo puede comprobar. Si algo deja de ser cierto,
   se corrige aquí o se quita.

   NO se trae nada financiero del plan —proyecciones, valuación, ronda semilla,
   múltiplos de retorno— y no es por gusto: ese documento es para
   inversionistas y él mismo dice que no es una oferta pública de valores.
   Publicar en una web abierta el precio de una participación es otra cosa
   distinta de hacer marketing, y tiene consecuencias legales.
   --------------------------------------------------------------------------- */

export const TESIS = {
  eyebrow: "Por qué existimos",
  titulo: ["El humor es el único gran arte", "que todavía no tiene su premio."],
  comparacion: [
    { arte: "El cine", premio: "los Oscars" },
    { arte: "La música", premio: "los Grammys" },
    { arte: "La televisión", premio: "los Emmys" },
    { arte: "El teatro", premio: "los Tonys" },
    { arte: "El humor", premio: null },
  ],
  entrada:
    "El humor no tiene premio, ni líder, ni industria. Y sin embargo lo consume todo el mundo, todos los días, en todas las edades y en todos los países.",
  texto:
    "Las computadoras y los teléfonos tuvieron que crear su necesidad. El humor no: siempre ha existido. Lo único que nunca ha tenido es quien lo organice.",
  remate: "Eso es lo que estamos construyendo.",
  cifras: [
    { valor: "600M+", texto: "personas hablan español en el mundo", fuente: "Instituto Cervantes, 2025" },
    { valor: "68M", texto: "hispanos en Estados Unidos, cerca del 20% de la población", fuente: "U.S. Census, 2024" },
  ],
} as const;

export const FUNDADOR = {
  eyebrow: "Quién está detrás",
  titulo: ["Ya lo hizo dos veces.", "Sin internet."],
  nombre: "Fernando Arau",
  cargo: "Creador y fundador de COMICOMANÍA",
  credencial: "Emmy honorario 2006 · Academia de Artes y Ciencias de la Televisión",
  entrada:
    "La mejor señal de lo que alguien va a hacer es lo que ya hizo. Fernando Arau ha convertido dos veces un talento disperso en un movimiento con público, artistas y marcas.",
  hitos: [
    {
      anio: "1985",
      nombre: "Rockotitlán",
      falta: "El rock en español no tenía dónde tocar.",
      hizo: "Abre con su hermano Sergio el primer foro de la Ciudad de México dedicado solo a ese rock.",
      resultado: "Por ese escenario pasaron Caifanes, Café Tacvba, Maldita Vecindad, Maná y Fobia.",
    },
    {
      anio: "1996",
      nombre: "RIATATÁN",
      falta: "Los humoristas amateurs no tenían escaparate.",
      hizo: "Crea el primer concurso de humoristas amateurs de México.",
      resultado: "Más de 500 inscritos y una gran final que llenó la Arena México con 27.000 personas.",
    },
    {
      anio: "2027",
      nombre: "COMICOMANÍA",
      falta: "El humor en español no tiene industria, premio ni líder.",
      hizo: "Un concurso global en línea, una agencia, una escuela y el Premio Humor.",
      resultado: "Ahora con internet, redes, inteligencia artificial y 600 millones de hispanohablantes.",
    },
  ],
  trayectoria: [
    "Mimo. Gana para México, con Toño Esparza, el Primer Encuentro Internacional de Pantomima del Festival Cervantino.",
    "Primer mimo de la televisión mexicana, en Noche a Noche de Verónica Castro (1980).",
    "“Chicho” en Cachún Cachún Ra Ra!, además de escritor y director (1981–1987).",
    "Conductor de Despierta América en Univision durante doce años seguidos (1997–2009).",
  ],
  cita: "Lo que le pido no es que crea en un sueño. Es que vea un patrón.",
} as const;

export const LIMPIO = {
  eyebrow: "La decisión que nos distingue",
  titulo: ["No es lo mismo ser gracioso", "que hacerse el chistosito."],
  definicion:
    "Humor limpio es el humor ingenioso y divertido para todo público, que no recurre a palabras vulgares ni al doble sentido sexual ofensivo.",
  entrada:
    "No es una limitación: es una ventaja, y le sirve a todo el mundo por motivos distintos.",
  ventajas: [
    {
      para: "Para la familia",
      texto: "Se puede ver junta. Eso multiplica el público de cada episodio en vez de dividirlo por habitación.",
    },
    {
      para: "Para el humorista",
      texto: "Un humorista limpio trabaja en televisión, en eventos de empresa, en escuelas y en iglesias. Tiene más mercado, no menos.",
    },
    {
      para: "Para las marcas",
      texto: "Pueden patrocinar sin riesgo de aparecer al lado de algo ofensivo. Es el contenido que buscan los anunciantes familiares.",
    },
    {
      para: "Para las plataformas",
      texto: "El contenido apto para todo público se vende a más canales, más horarios y más países.",
    },
  ],
  ciencia: {
    titulo: "Y no es solo una idea bonita",
    estudios: [
      {
        hallazgo: "Reír en grupo aumenta la tolerancia al dolor, por la liberación de endorfinas.",
        fuente: "Dunbar y colegas · Universidad de Oxford · Proceedings of the Royal Society B (2012)",
      },
      {
        hallazgo: "La risa compartida libera opioides naturales en el cerebro, los asociados al placer y al vínculo entre personas.",
        fuente: "Manninen y colegas · Universidad de Turku · Journal of Neuroscience (2017)",
      },
    ],
  },
} as const;

export const PREMIO = {
  eyebrow: "COMICOMANÍA Premio Humor",
  titulo: ["La estatuilla", "que le faltaba al humor."],
  entrada:
    "Cada gran arte del entretenimiento tuvo un momento que lo convirtió en industria: el primer Oscar, el primer Grammy, el primer Emmy, el primer Tony. El humor todavía no ha tenido el suyo.",
  texto:
    "El Premio Humor es la estatuilla y la gala anual que reconocen a los mejores humoristas profesionales del mundo hispano. La primera, simbólica, será para Mario Moreno “Cantinflas”.",
  remate: "La industria del humor va a existir. La pregunta es quién la construye.",
} as const;

/* Los cinco negocios, con sus nombres reales. La web los llamaba Talent,
   Academy, Shop y Live —etiquetas genéricas— y el negocio tiene marcas
   propias. Un nombre propio se recuerda; una etiqueta, no. */
export const ECOSISTEMA = {
  eyebrow: "El ecosistema",
  titulo: ["Un concurso", "que alimenta cuatro negocios."],
  entrada:
    "El concurso es el arrancador. Cada temporada produce audiencia, contenido y talento nuevo que alimenta todo lo demás.",
  piezas: [
    {
      nombre: "Concurso COMICOMANÍA",
      texto: "El primer concurso en línea en español de humoristas amateurs. Abierto a todos los estilos: stand-up, mimos, magos, ventrílocuos, imitadores, músicos cómicos y humoristas digitales.",
      href: "/participa",
    },
    {
      nombre: "ProCómiCo",
      texto: "La agencia. Representa a los mejores talentos del concurso y a profesionales que buscan una agencia seria. El ganador no se queda solo cuando se apagan las cámaras.",
      href: "/humoristas",
    },
    {
      nombre: "Instituto Gracia",
      texto: "La escuela en línea: actuación exprés, dramaturgia, creatividad y comedia con certificación. Los ganadores entran con beca de tres meses.",
      href: "/academia",
    },
    {
      nombre: "Premio Humor",
      texto: "La estatuilla y la gala anual del humor hispano. El premio que esta industria nunca tuvo.",
      href: "#premio",
    },
    {
      nombre: "Humormanía",
      texto: "La versión en inglés del concurso y del premio, con el mismo formato y el mismo oficio detrás.",
      href: null,
    },
  ],
  ventaja:
    "La ventaja que no tienen los Oscars: la Academia de Cine no produce las películas ni representa a los actores. Aquí el talento se descubre, se forma, se representa, se lleva de gira y se premia.",
} as const;
