-- ---------------------------------------------------------------------------
-- Los tres cursos de la Academia, con su arte.
--
-- Igual que el catálogo de la tienda: NO son datos demo, son los cursos
-- oficiales. No llevan marca demo y no los borra quitar.sql.
--
-- Los precios son una PROPUESTA, puestos para que la academia se pueda ver y
-- probar. Hay que confirmarlos antes de cobrar el primero.
-- ---------------------------------------------------------------------------

alter table public.courses add column if not exists cover_alt text;
alter table public.courses add column if not exists subtitle text;
alter table public.courses add column if not exists promise text;
alter table public.courses add column if not exists highlights text[] not null default '{}';
alter table public.courses add column if not exists display_order smallint not null default 100;

comment on column public.courses.cover_alt is
  'Qué se ve en el arte del curso. El cartel es lo que vende y lo que se '
  'comparte: sin descripción, quien no lo ve no sabe qué está comprando.';

comment on column public.courses.highlights is
  'Lo que incluye, en bala. Va aparte del temario porque responde otra '
  'pregunta: el temario dice qué se aprende, esto dice qué te llevas.';

comment on column public.courses.promise is
  'La frase del cartel. En texto, para que exista fuera de la imagen.';

-- ---------------------------------------------------------------------------
do $$
declare
  v_curso uuid;
  v_modulo uuid;
begin
  -- -------------------------------------------------------------------------
  -- 1 · Stand up desde cero. El de entrada: el que compra quien nunca se
  --     subió a un escenario, que es la mayoría de la audiencia.
  -- -------------------------------------------------------------------------
  if not exists (select 1 from public.courses where slug = 'stand-up-desde-cero') then
    insert into public.courses (
      slug, title, subtitle, promise, description, level, price, currency,
      duration_min, cover_url, cover_alt, highlights, status, display_order
    ) values (
      'stand-up-desde-cero',
      'Stand Up desde cero',
      'Tu historia también puede hacer reír',
      'De no haberte subido nunca a un escenario a tener cinco minutos que funcionan.',
      'No hace falta ser gracioso de nacimiento ni tener años de tablas. Hace falta '
      'una historia propia y saber dónde ponerle el remate. Este curso te lleva desde '
      'la primera idea suelta hasta un set de cinco minutos que puedes presentar.',
      'BEGINNER', 79, 'USD', 240,
      '/academia/stand-up-desde-cero.webp',
      'Arte del curso: una laptop con el módulo 1 abierto, un cuaderno que dice '
      '"Grandes historias comienzan aquí" y la caja del curso sobre una mesa de madera.',
      array['Clases en video', 'Material descargable', 'Comunidad de comediantes',
            'Ejercicios prácticos', 'Feedback personalizado'],
      'PUBLISHED', 1
    ) returning id into v_curso;


    insert into public.course_modules (course_id, title, "order")
    values (v_curso, 'Encuentra tu historia', 1) returning id into v_modulo;
    insert into public.lessons (module_id, title, type, duration_s, "order", is_preview) values
      (v_modulo, 'Por qué tu vida ya tiene material', 'VIDEO', 840, 1, true),
      (v_modulo, 'De la anécdota al chiste', 'VIDEO', 1020, 2, false),
      (v_modulo, 'Ejercicio: veinte historias en una hoja', 'ASSIGNMENT', null, 3, false);

    insert into public.course_modules (course_id, title, "order")
    values (v_curso, 'La estructura del remate', 2) returning id into v_modulo;
    insert into public.lessons (module_id, title, type, duration_s, "order") values
      (v_modulo, 'Premisa, giro y remate', 'VIDEO', 960, 1),
      (v_modulo, 'Economía de palabras', 'VIDEO', 720, 2),
      (v_modulo, 'Ejercicio: recorta tu mejor historia a la mitad', 'ASSIGNMENT', null, 3);

    insert into public.course_modules (course_id, title, "order")
    values (v_curso, 'Subirte al escenario', 3) returning id into v_modulo;
    insert into public.lessons (module_id, title, type, duration_s, "order") values
      (v_modulo, 'El micrófono, el banco y tus manos', 'VIDEO', 780, 1),
      (v_modulo, 'Qué hacer cuando no se ríen', 'VIDEO', 900, 2),
      (v_modulo, 'Tu primer set de cinco minutos', 'ASSIGNMENT', null, 3);
  end if;

  -- -------------------------------------------------------------------------
  -- 2 · Escribe para hacer reír. El del medio: para quien ya se subió y
  --     quiere material que aguante más de una función.
  -- -------------------------------------------------------------------------
  if not exists (select 1 from public.courses where slug = 'escribe-para-hacer-reir') then
    insert into public.courses (
      slug, title, subtitle, promise, description, level, price, currency,
      duration_min, cover_url, cover_alt, highlights, status, display_order
    ) values (
      'escribe-para-hacer-reir',
      'Escribe para hacer reír',
      'Ideas que se convierten en grandes historias',
      'De ideas comunes a historias extraordinarias.',
      'Todo el mundo tiene ideas graciosas. Lo difícil es convertirlas en algo que '
      'funcione delante de gente que no te conoce. Acá se trabaja la escritura: '
      'estructura, personajes, edición y el método para que escribir deje de '
      'depender de la inspiración.',
      'INTERMEDIATE', 99, 'USD', 300,
      '/academia/escribe-para-hacer-reir.webp',
      'Arte del curso: la caja sobre un escritorio con bolas de papel arrugado, una '
      'taza que dice "Café Ideas Risas" y una lista marcada: ideas, personajes, '
      'historias, risas.',
      array['Técnicas de escritura', 'Estructura de chistes', 'Personajes y situaciones',
            'Feedback en vivo', 'Convierte ideas en rutinas'],
      'PUBLISHED', 2
    ) returning id into v_curso;

    insert into public.course_modules (course_id, title, "order")
    values (v_curso, 'El método antes que la inspiración', 1) returning id into v_modulo;
    insert into public.lessons (module_id, title, type, duration_s, "order", is_preview) values
      (v_modulo, 'Observar como oficio, no como talento', 'VIDEO', 900, 1, true),
      (v_modulo, 'Tu cuaderno de capturas', 'TEXT', null, 2, false),
      (v_modulo, 'Escribir mal a propósito: la primera versión', 'VIDEO', 840, 3, false);

    insert into public.course_modules (course_id, title, "order")
    values (v_curso, 'Estructura del chiste', 2) returning id into v_modulo;
    insert into public.lessons (module_id, title, type, duration_s, "order") values
      (v_modulo, 'Anatomía: premisa, tensión, sorpresa', 'VIDEO', 1080, 1),
      (v_modulo, 'Tags: exprimir un remate', 'VIDEO', 720, 2),
      (v_modulo, 'Callbacks y cómo cerrar un set', 'VIDEO', 780, 3);

    insert into public.course_modules (course_id, title, "order")
    values (v_curso, 'Personajes y situaciones', 3) returning id into v_modulo;
    insert into public.lessons (module_id, title, type, duration_s, "order") values
      (v_modulo, 'Construir un personaje en dos frases', 'VIDEO', 900, 1),
      (v_modulo, 'Del monólogo a la escena', 'VIDEO', 960, 2);

    insert into public.course_modules (course_id, title, "order")
    values (v_curso, 'Editar hasta que duela', 4) returning id into v_modulo;
    insert into public.lessons (module_id, title, type, duration_s, "order") values
      (v_modulo, 'Matar tus chistes favoritos', 'VIDEO', 840, 1),
      (v_modulo, 'Probar material: qué mirar en el público', 'VIDEO', 900, 2),
      (v_modulo, 'Ejercicio: una rutina de diez minutos', 'ASSIGNMENT', null, 3);
  end if;

  -- -------------------------------------------------------------------------
  -- 3 · Tu marca de comedia. El de arriba: para quien ya tiene material y
  --     quiere que el humor le dé de comer.
  -- -------------------------------------------------------------------------
  if not exists (select 1 from public.courses where slug = 'tu-marca-de-comedia') then
    insert into public.courses (
      slug, title, subtitle, promise, description, level, price, currency,
      duration_min, cover_url, cover_alt, highlights, status, display_order
    ) values (
      'tu-marca-de-comedia',
      'Tu marca de comedia',
      'Crea, conecta y haz crecer tu audiencia',
      'El humor también es negocio: del escenario al mundo digital.',
      'Tener material bueno no basta si nadie lo ve. Este curso es la parte que casi '
      'nadie enseña: cómo se construye una audiencia propia, cómo se produce contenido '
      'sin morir en el intento, y cómo el talento se convierte en ingresos sin dejar '
      'de ser gracioso.',
      'ADVANCED', 149, 'USD', 360,
      '/academia/marca-de-comedia.webp',
      'Arte del curso: la caja frente a una laptop con un video en edición, una taza '
      'que dice "Buen humor grandes ideas" y libros apilados: ideas, guiones, '
      'contenido, audiencia, resultados.',
      array['Creación de contenido', 'Estrategia digital', 'Conexión con audiencia',
            'Monetiza tu talento', 'Casos reales y plantillas'],
      'PUBLISHED', 3
    ) returning id into v_curso;

    insert into public.course_modules (course_id, title, "order")
    values (v_curso, 'Qué es tu marca y qué no', 1) returning id into v_modulo;
    insert into public.lessons (module_id, title, type, duration_s, "order", is_preview) values
      (v_modulo, 'Tu personaje fuera del escenario', 'VIDEO', 900, 1, true),
      (v_modulo, 'A quién le hablas: el público que sí es tuyo', 'VIDEO', 840, 2, false);

    insert into public.course_modules (course_id, title, "order")
    values (v_curso, 'Producir sin morir', 2) returning id into v_modulo;
    insert into public.lessons (module_id, title, type, duration_s, "order") values
      (v_modulo, 'Del set en vivo a diez piezas de contenido', 'VIDEO', 1080, 1),
      (v_modulo, 'Grabar bien con lo que ya tienes', 'VIDEO', 960, 2),
      (v_modulo, 'Un calendario que puedas sostener', 'TEXT', null, 3);

    insert into public.course_modules (course_id, title, "order")
    values (v_curso, 'Audiencia, no seguidores', 3) returning id into v_modulo;
    insert into public.lessons (module_id, title, type, duration_s, "order") values
      (v_modulo, 'La diferencia entre que te vean y que te sigan', 'VIDEO', 900, 1),
      (v_modulo, 'Tu lista propia: por qué no alquiles tu audiencia', 'VIDEO', 840, 2);

    insert into public.course_modules (course_id, title, "order")
    values (v_curso, 'Monetizar sin dejar de ser gracioso', 4) returning id into v_modulo;
    insert into public.lessons (module_id, title, type, duration_s, "order") values
      (v_modulo, 'Las cinco formas de cobrar por hacer reír', 'VIDEO', 1200, 1),
      (v_modulo, 'Marcas: cuándo decir que sí y cuándo no', 'VIDEO', 960, 2),
      (v_modulo, 'Plantillas: propuesta, rider y tarifario', 'TEXT', null, 3),
      (v_modulo, 'Ejercicio: tu plan de noventa días', 'ASSIGNMENT', null, 4);
  end if;
end;
$$;

-- El curso de prueba sale del catálogo público: mezclar demo con catálogo real
-- se nota justo donde más duele.
update public.courses set status = 'DRAFT' where slug like 'demo-%';
