-- ---------------------------------------------------------------------------
-- Fase F · Video y revisión.
--
-- La máquina de estados de docs/05, y la cola de revisión que la mueve.
--
-- La subida a R2 y la distribución a YouTube no están acá: necesitan
-- almacenamiento y credenciales que todavía no existen. Lo que sí está es
-- todo lo que decide si un video puede publicarse, porque esa parte no
-- depende de ninguna integración y es la que tiene consecuencias legales.
-- ---------------------------------------------------------------------------

create type public.video_status as enum (
  'DRAFT', 'UPLOADING', 'UPLOADED', 'VALIDATING', 'VALIDATION_FAILED',
  'PENDING_RIGHTS', 'SUBMITTED', 'IN_REVIEW', 'CHANGES_REQUESTED',
  'REJECTED', 'APPROVED', 'DISTRIBUTING', 'PUBLISHED', 'UNPUBLISHED', 'BLOCKED'
);

create type public.rights_status as enum (
  'PENDING', 'DECLARED', 'REVIEW_REQUIRED', 'CLEARED',
  'RESTRICTED', 'EXPIRED', 'BLOCKED'
);

create type public.review_decision as enum
  ('APPROVED', 'CHANGES_REQUESTED', 'REJECTED');

create table public.videos (
  id          uuid primary key default public.uuid_generate_v7(),
  user_id     uuid not null references public.users(id) on delete cascade,
  contest_id  uuid not null references public.contests(id) on delete cascade,
  round_id    uuid references public.rounds(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,

  title       text not null,
  description text,
  status        public.video_status  not null default 'DRAFT',
  rights_status public.rights_status not null default 'PENDING',

  duration_s  integer,
  -- Apuntan a `files` cuando exista el almacenamiento. Por ahora, la URL del
  -- máster que el revisor abre a mano.
  master_url    text,
  thumbnail_url text,

  published_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  /* La regla dura de docs/05, escrita donde no se puede saltar. Un video con
     los derechos sin resolver no se publica ni aunque alguien escriba mal la
     aplicación, llame a la API desde fuera o corra un UPDATE a mano. Publicar
     material sin derechos no es un bug: es una demanda. */
  constraint video_publicado_exige_derechos check (
    status not in ('PUBLISHED', 'DISTRIBUTING')
    or rights_status not in ('PENDING', 'REVIEW_REQUIRED', 'RESTRICTED', 'BLOCKED')
  ),
  constraint video_publicado_tiene_fecha check (
    status <> 'PUBLISHED' or published_at is not null
  )
);

create index videos_cola     on public.videos (status, created_at);
create index videos_concurso on public.videos (contest_id, status);
create index videos_autor    on public.videos (user_id);

create trigger videos_updated_at before update on public.videos
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Entries: qué video presentó cada participante en cada ronda. Uno por ronda.
-- ---------------------------------------------------------------------------
create table public.entries (
  id             uuid primary key default public.uuid_generate_v7(),
  participant_id uuid not null references public.participants(id) on delete cascade,
  round_id       uuid not null references public.rounds(id) on delete cascade,
  video_id       uuid references public.videos(id) on delete set null,
  status         text not null default 'DRAFT'
                 check (status in ('DRAFT', 'SUBMITTED', 'ACCEPTED', 'REJECTED', 'WITHDRAWN')),
  submitted_at   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (participant_id, round_id)
);

create trigger entries_updated_at before update on public.entries
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Historial de revisiones. Cada decisión deja una fila: quién, cuándo, qué
-- decidió y por qué. No se edita ni se borra, igual que la auditoría: si una
-- decisión pudiera reescribirse, el historial no serviría para defenderse.
-- ---------------------------------------------------------------------------
create table public.video_reviews (
  id          uuid primary key default public.uuid_generate_v7(),
  video_id    uuid not null references public.videos(id) on delete cascade,
  reviewer_id uuid references public.users(id) on delete set null,
  decision    public.review_decision not null,
  comment     text,
  timecodes   jsonb not null default '[]'::jsonb,
  created_at  timestamptz not null default now()
);

create index video_reviews_video on public.video_reviews (video_id, created_at desc);

create rule video_reviews_sin_update as
  on update to public.video_reviews do instead nothing;
create rule video_reviews_sin_delete as
  on delete to public.video_reviews do instead nothing;

-- ---------------------------------------------------------------------------
-- RLS.
-- ---------------------------------------------------------------------------
alter table public.videos        enable row level security;
alter table public.entries       enable row level security;
alter table public.video_reviews enable row level security;

-- Su autor ve el suyo siempre. Los publicados los ve cualquiera. El resto,
-- solo quien revisa, y solo dentro de su territorio.
create policy "veo mi video, el publicado, o el que me toca revisar" on public.videos
  for select using (
    user_id = auth.uid()
    or status = 'PUBLISHED'
    or public.has_permission('VIDEO_REVIEW', 'VIEW', public.path_de_concurso(contest_id))
  );

create policy "el autor sube el suyo" on public.videos
  for insert with check (user_id = auth.uid());

/* Editar un video es mover la máquina de estados, y eso solo lo hace quien
   revisa. El autor corrige subiendo de nuevo, no cambiando el estado: si
   pudiera, un rechazado volvería a aprobado sin que nadie lo mirara. */
create policy "el estado lo mueve quien revisa" on public.videos
  for update using (
    public.has_permission('VIDEO_REVIEW', 'APPROVE', public.path_de_concurso(contest_id))
  )
  with check (
    public.has_permission('VIDEO_REVIEW', 'APPROVE', public.path_de_concurso(contest_id))
  );

create policy "veo mi entry o las de mi territorio" on public.entries
  for select using (
    exists (
      select 1 from public.participants p
       where p.id = participant_id
         and (p.user_id = auth.uid()
              or public.has_permission('PARTICIPANTS', 'VIEW', public.path_de_concurso(p.contest_id)))
    )
  );
create policy "entries con permiso" on public.entries
  for all using (
    exists (
      select 1 from public.participants p
       where p.id = participant_id
         and public.has_permission('PARTICIPANTS', 'EDIT', public.path_de_concurso(p.contest_id))
    )
  )
  with check (
    exists (
      select 1 from public.participants p
       where p.id = participant_id
         and public.has_permission('PARTICIPANTS', 'EDIT', public.path_de_concurso(p.contest_id))
    )
  );

-- El autor ve por qué le rechazaron: una decisión que no se puede leer no se
-- puede corregir.
create policy "veo las revisiones de mi video o las de mi territorio"
  on public.video_reviews
  for select using (
    exists (
      select 1 from public.videos v
       where v.id = video_id
         and (v.user_id = auth.uid()
              or public.has_permission('VIDEO_REVIEW', 'VIEW', public.path_de_concurso(v.contest_id)))
    )
  );

create policy "solo quien revisa deja revisiones" on public.video_reviews
  for insert with check (
    exists (
      select 1 from public.videos v
       where v.id = video_id
         and public.has_permission('VIDEO_REVIEW', 'APPROVE', public.path_de_concurso(v.contest_id))
    )
  );
