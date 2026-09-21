-- Seed base. Catálogos, no datos de negocio.
-- Las ciudades de arranque se cargan acá para no hard-codearlas en el código:
-- abrir una ciudad nueva es un insert, no un deploy.

-- ---------------------------------------------------------------------------
insert into public.countries (iso2, name, path, currency_default, locale_default, legal_jurisdiction) values
  ('US', 'Estados Unidos', 'US', 'USD', 'es', 'US'),
  ('MX', 'México',         'MX', 'MXN', 'es', 'MX'),
  ('CO', 'Colombia',       'CO', 'COP', 'es', 'CO'),
  ('ES', 'España',         'ES', 'EUR', 'es', 'ES')
on conflict (iso2) do nothing;

insert into public.regions (country_id, slug, name, path)
select c.id, r.slug, r.name, c.path || '.' || upper(r.slug)
  from (values
    ('US', 'fl', 'Florida'),
    ('US', 'ny', 'Nueva York'),
    ('US', 'tx', 'Texas'),
    ('MX', 'cdmx', 'Ciudad de México'),
    ('CO', 'ant', 'Antioquia'),
    ('CO', 'cun', 'Cundinamarca'),
    ('ES', 'mad', 'Comunidad de Madrid')
  ) as r(iso2, slug, name)
  join public.countries c on c.iso2 = r.iso2
on conflict (country_id, slug) do nothing;

insert into public.cities (country_id, region_id, slug, name, path, timezone)
select c.id, rg.id, x.slug, x.name, rg.path || '.' || upper(x.slug), x.tz
  from (values
    ('US', 'fl',   'miami',    'Miami',        'America/New_York'),
    ('US', 'fl',   'orlando',  'Orlando',      'America/New_York'),
    ('US', 'fl',   'tampa',    'Tampa',        'America/New_York'),
    ('US', 'ny',   'nyc',      'Nueva York',   'America/New_York'),
    ('US', 'tx',   'houston',  'Houston',      'America/Chicago'),
    ('MX', 'cdmx', 'cdmx',     'Ciudad de México', 'America/Mexico_City'),
    ('CO', 'ant',  'medellin', 'Medellín',     'America/Bogota'),
    ('CO', 'cun',  'bogota',   'Bogotá',       'America/Bogota'),
    ('ES', 'mad',  'madrid',   'Madrid',       'Europe/Madrid')
  ) as x(iso2, region, slug, name, tz)
  join public.countries c on c.iso2 = x.iso2
  join public.regions rg on rg.country_id = c.id and rg.slug = x.region
on conflict (country_id, slug) do nothing;

-- ---------------------------------------------------------------------------
insert into public.user_types (slug, name, is_public, requires_profile) values
  ('HUMORISTA',         'Humorista',           true,  true),
  ('ESPECTADOR',        'Espectador',          true,  false),
  ('ESTUDIANTE',        'Estudiante',          true,  false),
  ('BUSINESS_OWNER',    'Dueño del negocio',   false, false),
  ('BUSINESS_OPERATOR', 'Operador',            false, false),
  ('JUDGE',             'Juez',                false, true),
  ('SPONSOR_CONTACT',   'Contacto de sponsor', false, false),
  ('TALENT_CLIENT',     'Cliente de talento',  false, false),
  ('AMBASSADOR',        'Embajador',           true,  false)
on conflict (slug) do nothing;

insert into public.user_levels (slug, track, name, rank) values
  ('MEMBER',              'community', 'Miembro',              1),
  ('ACTIVE_MEMBER',       'community', 'Miembro activo',       2),
  ('INSIDER',             'community', 'Insider',              3),
  ('VIP',                 'community', 'VIP',                  4),
  ('AMBASSADOR',          'community', 'Embajador',            5),
  ('REGISTERED_COMEDIAN', 'comedian',  'Humorista registrado', 1),
  ('CONTESTANT',          'comedian',  'Concursante',          2),
  ('ALUMNI',              'comedian',  'Alumni',               3),
  ('DEVELOPING_TALENT',   'comedian',  'Talento en desarrollo',4),
  ('FEATURED_TALENT',     'comedian',  'Talento destacado',    5),
  ('COMICOMANIA_TALENT',  'comedian',  'COMICOMANIA Talent',   6),
  ('REPRESENTED_TALENT',  'comedian',  'Talento representado', 7),
  ('STUDENT',             'student',   'Estudiante',           1),
  ('ACTIVE_STUDENT',      'student',   'Estudiante activo',    2),
  ('GRADUATE',            'student',   'Graduado',             3),
  ('CERTIFIED',           'student',   'Certificado',          4),
  ('ADVANCED',            'student',   'Avanzado',             5),
  ('ASSISTANT',           'operator',  'Asistente',            1),
  ('OPERATOR',            'operator',  'Operador',             2),
  ('MANAGER',             'operator',  'Manager',              3),
  ('DIRECTOR',            'operator',  'Director',             4),
  ('EXECUTIVE',           'operator',  'Ejecutivo',            5)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Catálogo de permisos: el producto cartesiano de secciones por acciones que
-- tienen sentido. Las que exigen MFA quedan marcadas acá y no en el código.
insert into public.permissions (section, action, requires_mfa)
select s.section, a.action,
       (s.section, a.action) in (
         ('ACCESS_CONTROL','MANAGE'), ('ACCESS_CONTROL','VIEW'),
         ('FINANCE','VIEW'), ('FINANCE','EXPORT'),
         ('ORDERS','REFUND'), ('SCORING','EDIT'), ('VOTING','MANAGE'),
         ('LEGAL','CONFIGURE'), ('SETTINGS','CONFIGURE'), ('INFRA','MANAGE')
       )
  from (values
    ('COMMUNITY'),('USERS'),('ACCESS_CONTROL'),('CRM'),('SERIES'),('SEASONS'),
    ('CONTESTS'),('PARTICIPANTS'),('VIDEOS'),('VIDEO_REVIEW'),('JUDGES'),
    ('SCORING'),('VOTING'),('CAMPAIGNS'),('CONTENT'),('EVENTS'),('TICKETING'),
    ('STORE'),('PRODUCTS'),('INVENTORY'),('ORDERS'),('SHIPPING'),('MEMBERSHIPS'),
    ('EXPERIENCES'),('TOURS'),('ACADEMY'),('TALENT'),('BOOKINGS'),('SPONSORS'),
    ('COMMERCIAL_INVENTORY'),('LICENSING'),('FINANCE'),('ANALYTICS'),
    ('AUTOMATIONS'),('LEGAL'),('TRUST_SAFETY'),('AUDIT'),('REPORTS'),
    ('SETTINGS'),('INFRA')
  ) as s(section)
  cross join (values
    ('VIEW'),('CREATE'),('EDIT'),('DELETE'),('APPROVE'),('REJECT'),('PUBLISH'),
    ('UNPUBLISH'),('ASSIGN'),('EXPORT'),('IMPORT'),('REFUND'),('PAY'),('INVITE'),
    ('CONFIGURE'),('MANAGE')
  ) as a(action)
on conflict (section, action) do nothing;

-- ---------------------------------------------------------------------------
-- Roles base. El rol es una PLANTILLA: el grant puede recortarla, nunca
-- ampliarla más allá de lo que el otorgante posee.
insert into public.roles (slug, name, is_system, default_sections, default_actions, denied_permissions) values
  ('OWNER', 'Dueño del negocio', true,
   array['COMMUNITY','USERS','ACCESS_CONTROL','CRM','SERIES','SEASONS','CONTESTS',
         'PARTICIPANTS','VIDEOS','VIDEO_REVIEW','JUDGES','SCORING','VOTING',
         'CAMPAIGNS','CONTENT','EVENTS','TICKETING','STORE','PRODUCTS','INVENTORY',
         'ORDERS','SHIPPING','MEMBERSHIPS','EXPERIENCES','TOURS','ACADEMY','TALENT',
         'BOOKINGS','SPONSORS','COMMERCIAL_INVENTORY','LICENSING','FINANCE',
         'ANALYTICS','AUTOMATIONS','LEGAL','TRUST_SAFETY','AUDIT','REPORTS','SETTINGS'],
   array['VIEW','CREATE','EDIT','DELETE','APPROVE','REJECT','PUBLISH','UNPUBLISH',
         'ASSIGN','EXPORT','IMPORT','REFUND','PAY','INVITE','CONFIGURE','MANAGE'],
   array['INFRA.MANAGE']),

  -- El técnico opera la plataforma, no el negocio.
  ('SUPER_ADMIN_TECH', 'Administrador técnico', true,
   array['INFRA','AUDIT','SETTINGS','ANALYTICS'],
   array['VIEW','CONFIGURE','MANAGE','EXPORT'],
   array['ORDERS.REFUND','FINANCE.VIEW','FINANCE.EXPORT','SCORING.EDIT',
         'VOTING.MANAGE','TALENT.MANAGE','LEGAL.CONFIGURE','ACCESS_CONTROL.MANAGE']),

  ('COUNTRY_DIRECTOR', 'Director de país', true,
   array['COMMUNITY','USERS','CRM','CONTESTS','PARTICIPANTS','VIDEOS','VIDEO_REVIEW',
         'JUDGES','SCORING','VOTING','CAMPAIGNS','CONTENT','EVENTS','TICKETING',
         'ORDERS','FINANCE','ANALYTICS','TRUST_SAFETY','AUDIT','REPORTS'],
   array['VIEW','CREATE','EDIT','APPROVE','REJECT','PUBLISH','UNPUBLISH','ASSIGN',
         'EXPORT','REFUND','MANAGE'],
   array['ACCESS_CONTROL.MANAGE','LEGAL.CONFIGURE','SETTINGS.CONFIGURE']),

  ('CITY_MANAGER', 'Manager de ciudad', true,
   array['COMMUNITY','CRM','CONTESTS','PARTICIPANTS','VIDEOS','VIDEO_REVIEW',
         'JUDGES','VOTING','CONTENT','EVENTS','TICKETING','FINANCE','ANALYTICS',
         'TRUST_SAFETY','REPORTS'],
   array['VIEW','CREATE','EDIT','APPROVE','REJECT','PUBLISH','ASSIGN','MANAGE'],
   array['ACCESS_CONTROL.MANAGE','ORDERS.REFUND','SCORING.EDIT','VOTING.MANAGE']),

  ('CONTEST_MANAGER', 'Manager de concurso', true,
   array['CONTESTS','PARTICIPANTS','VIDEOS','VIDEO_REVIEW','JUDGES','SCORING','VOTING'],
   array['VIEW','CREATE','EDIT','APPROVE','REJECT','ASSIGN'],
   array['CONTESTS.PUBLISH','SCORING.EDIT','VOTING.MANAGE']),

  ('CONTENT_REVIEWER', 'Revisor de contenido', true,
   array['VIDEOS','VIDEO_REVIEW','CONTENT','PARTICIPANTS','TRUST_SAFETY'],
   array['VIEW','EDIT','APPROVE','REJECT','PUBLISH','UNPUBLISH'],
   array[]::text[]),

  ('JUDGE', 'Juez', true,
   array['JUDGES','VIDEOS'],
   array['VIEW','CREATE'],
   array['SCORING.EDIT']),

  ('FINANCE_MANAGER', 'Manager de finanzas', true,
   array['FINANCE','ORDERS','REPORTS','ANALYTICS'],
   array['VIEW','CREATE','EDIT','EXPORT','REFUND','PAY'],
   array['ACCESS_CONTROL.MANAGE']),

  ('SUPPORT_AGENT', 'Soporte', true,
   array['USERS','CRM','PARTICIPANTS','ORDERS','TICKETING','TRUST_SAFETY'],
   array['VIEW','EDIT','CREATE'],
   array['ORDERS.REFUND','USERS.DELETE']),

  ('AUDITOR', 'Auditor', true,
   array['COMMUNITY','USERS','CONTESTS','PARTICIPANTS','VIDEOS','VOTING','SCORING',
         'ORDERS','FINANCE','ANALYTICS','AUDIT','REPORTS'],
   array['VIEW'],
   array['USERS.EXPORT','CRM.EXPORT'])
on conflict (slug) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
  from public.roles r
  join public.permissions p
    on p.section = any(r.default_sections)
   and p.action  = any(r.default_actions)
 where not ((p.section || '.' || p.action) = any(r.denied_permissions))
on conflict do nothing;
