import {
  bigint,
  boolean,
  date,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  unique,
  uuid,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core'

export const ROLES = ['admin', 'usuario'] as const
export type Rol = (typeof ROLES)[number]

/**
 * Quién usa Parrilla. Hasta el subproyecto de inquilinos todo el mundo ve todo; esta tabla
 * existe para que la sesión diga quién eres y para invitar. `sesion_version` cierra las
 * sesiones de una persona sin tocar a las demás ni rotar `AUTH_SECRET`, que además cifra
 * los tokens sociales.
 */
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  correo: text('correo').notNull().unique(),
  nombre: text('nombre'),
  rol: text('rol').$type<Rol>().notNull().default('usuario'),
  zona: text('zona').notNull().default('America/Santiago'),
  /**
   * El modo del panel y de la app del teléfono: la noche de siempre o el día con sushi. Es de
   * la cuenta y no del equipo, para que el teléfono y el panel vayan juntos. Ver
   * `src/lib/tema.ts`.
   */
  tema: text('tema').$type<'noche' | 'dia'>().notNull().default('noche'),
  sesionVersion: integer('sesion_version').notNull().default(1),
  invitadoEn: timestamp('invitado_en', { withTimezone: true }).notNull().defaultNow(),
  primerIngresoEn: timestamp('primer_ingreso_en', { withTimezone: true }),
  /**
   * Desde cuándo tiene La Cocina, el chef de la casa
   * (`docs/superpowers/specs/2026-10-22-la-cocina-design.md`). Nulo es que no la tiene: el chef no
   * ve sus comandas y el panel no le ofrece pedir. En el piloto la enciende el admin.
   */
  cocinaDesde: timestamp('cocina_desde', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}).enableRLS()

/** Un código de ingreso por correo: nunca el código, solo su hash. Diez minutos, un uso. */
export const codigosIngreso = pgTable(
  'codigos_ingreso',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    hash: text('hash').notNull(),
    expiraEn: timestamp('expira_en', { withTimezone: true }).notNull(),
    usadoEn: timestamp('usado_en', { withTimezone: true }),
    intentos: integer('intentos').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('codigos_ingreso_user_idx').on(t.userId, t.createdAt)],
).enableRLS()

/**
 * A public page. Every owner has exactly one default profile; the rest live at `/<slug>`.
 * Only the admin's default profile is served at `/` — a guest's default profile lives at
 * `/<slug>` too, same as their other pages (see `rutaPublicaDe` in `lib/utils.ts`).
 */
export const profiles = pgTable(
  'profiles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /**
     * Quién es dueño de esta fila. Nulable solo mientras dure la transición: el paso de
     * migrado adopta a nombre del admin lo que venga de antes, y la entrega 3 lo pone
     * NOT NULL. Las tablas hijas no la llevan: heredan por su clave foránea.
     */
    ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'restrict' }),
    slug: text('slug').notNull().unique(),
    displayName: text('display_name').notNull(),
    headline: text('headline'),
    bio: text('bio'),
    avatarUrl: text('avatar_url'),
    accentColor: text('accent_color').notNull().default('#8b7cff'),
    backgroundStyle: text('background_style').notNull().default('aurora'),
    ogImageUrl: text('og_image_url'),
    isDefault: boolean('is_default').notNull().default(false),
    isPublished: boolean('is_published').notNull().default(true),
    /** Private profiles opt out of search engines and the sitemap. */
    noindex: boolean('noindex').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('profiles_owner_idx').on(t.ownerId)],
).enableRLS()

/** `featured` renders as a large image card, `social` as an icon in the top row. */
export const LINK_KINDS = ['featured', 'standard', 'social', 'booking'] as const
export type LinkKind = (typeof LINK_KINDS)[number]

export const links = pgTable(
  'links',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    profileId: uuid('profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    kind: text('kind').notNull().default('standard'),
    label: text('label').notNull(),
    sublabel: text('sublabel'),
    url: text('url').notNull(),
    icon: text('icon'),
    imageUrl: text('image_url'),
    position: integer('position').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    startsAt: timestamp('starts_at', { withTimezone: true }),
    endsAt: timestamp('ends_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('links_profile_position_idx').on(t.profileId, t.position)],
).enableRLS()

/**
 * One row per page view. `visitorHash` is SHA-256 over IP + user agent + a secret
 * salt + the UTC date, so the raw IP is never stored and the hash rotates daily.
 */
export const visits = pgTable(
  'visits',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    profileId: uuid('profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    visitorHash: text('visitor_hash').notNull(),
    country: text('country'),
    region: text('region'),
    city: text('city'),
    timezone: text('timezone'),
    latitude: doublePrecision('latitude'),
    longitude: doublePrecision('longitude'),
    deviceType: text('device_type'),
    os: text('os'),
    browser: text('browser'),
    referrer: text('referrer'),
    /** Normalised source: instagram, tiktok, x, youtube, direct, ... */
    referrerNetwork: text('referrer_network'),
    /** The `?s=` tag — which specific reel or post drove this visit. */
    campaign: text('campaign'),
    utmSource: text('utm_source'),
    utmMedium: text('utm_medium'),
    utmCampaign: text('utm_campaign'),
    utmContent: text('utm_content'),
    language: text('language'),
    isBot: boolean('is_bot').notNull().default(false),
  },
  (t) => [
    index('visits_profile_created_idx').on(t.profileId, t.createdAt),
    index('visits_created_idx').on(t.createdAt),
    index('visits_campaign_idx').on(t.campaign),
    index('visits_hash_idx').on(t.visitorHash),
  ],
).enableRLS()

/**
 * `profileId` is denormalised so dashboard queries never need a join to `visits`.
 *
 * `visitId` deliberately carries no foreign key: the visit row is written in an
 * `after()` callback once the response has been flushed, so a very fast click could
 * otherwise race the insert and be rejected. Analytics tolerates a dangling id far
 * better than it tolerates dropped clicks.
 */
export const clicks = pgTable(
  'clicks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    visitId: uuid('visit_id'),
    linkId: uuid('link_id').references(() => links.id, { onDelete: 'set null' }),
    profileId: uuid('profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    /** Milliseconds between page load and the click. */
    msOnPage: integer('ms_on_page'),
    position: integer('position'),
    /** Denormalised from the visit so dashboard filters never need a join. */
    isBot: boolean('is_bot').notNull().default(false),
  },
  (t) => [
    index('clicks_profile_created_idx').on(t.profileId, t.createdAt),
    index('clicks_link_idx').on(t.linkId),
    index('clicks_visit_idx').on(t.visitId),
  ],
).enableRLS()

// La lista vive en `lib/networks.ts`, que el navegador puede importar sin arrastrar el ORM.
// Ruta relativa a propósito: `drizzle-kit` lee este archivo sin los alias de TypeScript.
export { SOCIAL_NETWORKS, type SocialNetwork } from '../lib/networks'

/**
 * One connected account. Several rows can share a network; `(network, external_id)` is
 * the identity. Tokens are stored encrypted — see `lib/social/crypto`. La fila de YouTube
 * que nace de `YOUTUBE_CHANNEL_ID` llega con los dos tokens en null y solo el id del
 * canal: queda desconectada hasta que su dueño la conecte con OAuth.
 */
export const socialAccounts = pgTable(
  'social_accounts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'restrict' }),
    network: text('network').notNull(),
    handle: text('handle'),
    externalId: text('external_id'),
    // El id de usuario de la app de Meta, que no es el de la página ni el de la cuenta de
    // Instagram: es el que Meta manda en los callbacks de baja y borrado. Nulo en las
    // cuentas conectadas antes del 2026-09-30, hasta que su dueño reconecte.
    metaUserId: text('meta_user_id'),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
    lastSyncError: text('last_sync_error'),
    // Cuándo salió el correo de que esta conexión se cayó; nula mientras esté bien. La
    // escribe `vigilarConexiones` (`lib/avisos/run.ts`) al avisar y la borra cuando el fierro
    // vuelve a calentarse: así llega un correo por caída, no uno por cada post que no sale.
    caidaAvisadaEn: timestamp('caida_avisada_en', { withTimezone: true }),
    // Si la cuenta acepta trial reels, aprendido de Meta al publicar (`trial-reels.ts`): «no»
    // cuando rechazó uno por elegibilidad (pocos seguidores, el subcódigo 2207081), «si» cuando
    // uno salió. Nulo mientras no se sepa. Solo Instagram. El motivo es la frase del rechazo,
    // para mostrarla tal cual.
    trialReels: text('trial_reels').$type<'si' | 'no'>(),
    trialReelsMotivo: text('trial_reels_motivo'),
    trialReelsEn: timestamp('trial_reels_en', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique('social_accounts_network_external_key').on(t.network, t.externalId),
    index('social_accounts_owner_idx').on(t.ownerId),
    index('social_accounts_meta_user_idx').on(t.metaUserId),
  ],
).enableRLS()

/**
 * A published piece of content.
 *
 * `campaign` is the `?s=` tag that joins this post to `visits`. The join is by string
 * and not by foreign key on purpose: visits are written long before the post exists
 * here, and editing the tag re-links the whole history without migrating a row.
 * The sync never overwrites it.
 *
 * `archivedAt` marks a post deleted on the network. The row survives — dropping it
 * would erase traffic that really happened.
 */
export const socialPosts = pgTable(
  'social_posts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'restrict' }),
    network: text('network').notNull(),
    accountId: uuid('account_id')
      .notNull()
      .references(() => socialAccounts.id),
    externalId: text('external_id').notNull(),
    permalink: text('permalink'),
    caption: text('caption'),
    thumbnailUrl: text('thumbnail_url'),
    mediaType: text('media_type'),
    publishedAt: timestamp('published_at', { withTimezone: true }).notNull(),
    campaign: text('campaign').notNull().unique(),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // Las columnas van en el orden físico de la tabla (external_id existe desde antes que
    // account_id): declararlas al revés haría que `drizzle-kit generate` propusiera
    // recrear la unique.
    unique('social_posts_account_external_key').on(t.externalId, t.accountId),
    // Las de una cuenta por fecha: el sondeo de comentarios (cada cinco minutos) y la
    // sincronización leen por cuenta, y la unique de arriba empieza por `external_id`.
    // `campaign` no lleva índice propio: su unique ya es uno.
    index('social_posts_account_published_idx').on(t.accountId, t.publishedAt),
    index('social_posts_published_idx').on(t.publishedAt),
    // Las del dueño por fecha: Los Números filtran por dueño y por rango.
    index('social_posts_owner_published_idx').on(t.ownerId, t.publishedAt),
  ],
).enableRLS()

/**
 * One cumulative snapshot per post per local day — cumulative because that is what
 * all three APIs return. A period's growth is the difference between two snapshots.
 *
 * Every metric is nullable: null means the network does not report it, which is not
 * the same as zero. TikTok has no saves or reach; the YouTube Data API has no shares
 * or saves.
 *
 * The unique on `(postId, day)` is what makes the sync idempotent.
 */
export const postMetrics = pgTable(
  'post_metrics',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    postId: uuid('post_id')
      .notNull()
      .references(() => socialPosts.id, { onDelete: 'cascade' }),
    day: date('day').notNull(),
    views: integer('views'),
    likes: integer('likes'),
    comments: integer('comments'),
    shares: integer('shares'),
    saves: integer('saves'),
    reach: integer('reach'),
    capturedAt: timestamp('captured_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique('post_metrics_post_day_key').on(t.postId, t.day), index('post_metrics_day_idx').on(t.day)],
).enableRLS()

/**
 * Cómo va la cuenta, no cada publicación. Dos clases de columna conviven acá y no
 * deben mezclarse: los contadores acumulados (seguidores, views totales) se leen
 * enteros cada día y su crecimiento sale por diferencia, mientras que los valores del
 * día vienen ya calculados por la red. Sumar los primeros como si fueran los segundos
 * daría un total de seguidores que crece cada 24 horas.
 */
export const accountMetrics = pgTable(
  'account_metrics',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    network: text('network').notNull(),
    accountId: uuid('account_id')
      .notNull()
      .references(() => socialAccounts.id),
    day: date('day').notNull(),
    // Acumulados
    followers: integer('followers'),
    totalViews: integer('total_views'),
    videoCount: integer('video_count'),
    // Valores del día
    profileViews: integer('profile_views'),
    reach: integer('reach'),
    views: integer('views'),
    accountsEngaged: integer('accounts_engaged'),
    capturedAt: timestamp('captured_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // Orden físico, como en social_posts: ver el comentario de esa unique.
    unique('account_metrics_account_day_key').on(t.day, t.accountId),
    index('account_metrics_day_idx').on(t.day),
  ],
).enableRLS()

export const TARGET_STATUSES = ['scheduled', 'publishing', 'published', 'failed'] as const
export type TargetStatus = (typeof TARGET_STATUSES)[number]

/**
 * What the owner composes once. No status column of its own: the post's state is the
 * summary of its targets, and duplicating it here would let the two disagree.
 */
export const scheduledPosts = pgTable(
  'scheduled_posts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'restrict' }),
    caption: text('caption').notNull(),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),
    // Diseñada, no un fotograma: la aplican los publishers que pueden (IG/FB/YT).
    coverUrl: text('cover_url'),
    // Los videos que el post llevaba y ya no están en el almacén: cuando sale en todas sus
    // redes, el video se borra de R2 y su fila con él (`limpiarMedia`, en `publish/run.ts`).
    // Con la fila se iba lo único que decía que el post era un video, y el corte de una
    // entraña publicada se dibujaba como chori. La forma los cuenta (`formatoDe`).
    videosLiberados: integer('videos_liberados').notNull().default(0),
    // La taxonomía libre del editor-LLM ({"hook": "...", "tema": "..."}); el
    // endpoint de métricas la devuelve junto a los números para cerrar su loop.
    atributos: jsonb('atributos'),
    // La referencia que el que llama a `POST /api/schedule/batch` le pone a la fila. Es
    // única por dueño: reenviar un lote que se cortó a medias devuelve el post que ya
    // entró en vez de programarlo dos veces (`scheduleBatch`). Nula en lo que no vino por
    // la API o vino sin ella.
    ref: text('ref'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // Lo del dueño por hora: La Parrilla lee una semana o un día. Lo que busca por dueño solo
    // lo sirve este, o la unique de abajo.
    index('scheduled_posts_owner_scheduled_idx').on(t.ownerId, t.scheduledAt),
    // Los nulos no chocan entre sí: un post sin `ref` nunca se topa con otro.
    unique('scheduled_posts_owner_ref_key').on(t.ownerId, t.ref),
  ],
).enableRLS()

/**
 * One row per destination network, each living its own publish cycle: if Instagram
 * publishes and a future network fails, the calendar shows exactly that.
 *
 * `containerId` is Meta's async-processing handle: a video target parks in
 * 'publishing' holding it, and the next cron run asks Meta whether it finished.
 * `lastError` is one of our Spanish sentences. Almost all are fixed; Instagram's rejections
 * name the account and quote what Meta said (`rechazoDeInstagram` y compañía, en
 * `social/publish/publisher.ts`), porque sin eso no se sabía qué hacer con el fallo.
 */
export const scheduledPostTargets = pgTable(
  'scheduled_post_targets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    postId: uuid('post_id')
      .notNull()
      .references(() => scheduledPosts.id, { onDelete: 'cascade' }),
    network: text('network').notNull(),
    accountId: uuid('account_id')
      .notNull()
      .references(() => socialAccounts.id),
    captionOverride: text('caption_override'),
    status: text('status').$type<TargetStatus>().notNull().default('scheduled'),
    containerId: text('container_id'),
    externalId: text('external_id'),
    attemptCount: integer('attempt_count').notNull().default(0),
    lastError: text('last_error'),
    // No se intenta antes de esta hora. La pone `resolveOutcome`: la espera entre un intento
    // fallido y el siguiente (`ESPERAS_TRAS_FALLO_MS`), o la que pide una red sin cupo (el
    // tope diario de Instagram). Nula = sale en la primera corrida después de su hora.
    reintentarDesde: timestamp('reintentar_desde', { withTimezone: true }),
    // Lo que la red exige elegir por destino antes de publicar (TikTok: modo, privacidad,
    // interacciones, comercial). Null en las redes que no piden nada. La forma la valida
    // `lib/social/publish/opciones`; el editor la muestra pero no la cambia.
    opciones: jsonb('opciones'),
    // El reclamo de la corrida que está publicando este destino ahora mismo: nadie más lo
    // toca hasta esta hora. Lo pone `publishDue` al empezar un intento y lo saca al escribir
    // el resultado; si la corrida muere, vence solo (`RECLAMO_MS`). Nulo = nadie lo tiene.
    // Precisión 3 por la misma razón que `updatedAt`: la escritura final compara por
    // igualdad contra el valor que la corrida puso.
    reclamadoHasta: timestamp('reclamado_hasta', { withTimezone: true, precision: 3 }),
    // Desde cuándo está en `publishing`: el corte de las 24 horas se mide desde acá y no
    // desde la hora del post. Una publicación vieja que se rearma entra a `publishing` hoy,
    // y medirla desde su hora la daba por vencida al primer sondeo. Nulo fuera de `publishing`.
    publicandoDesde: timestamp('publicando_desde', { withTimezone: true }),
    // Cuándo se archivó un destino quemado: «Se quemó» (panel y teléfono), el resumen y el
    // correo del día ya no lo cuentan. Sigue `failed` y con su error —archivar no cambia lo que
    // pasó, solo deja de pedir una acción—, y el calendario lo sigue dibujando quemado. Solo
    // un destino `failed` se archiva (`archivar.ts`); el rearme lo vuelve a nulo (`REARME`).
    // No toca `updatedAt`, que es lo que comparan el reclamo del cron y las guardas del editor.
    archivadoEn: timestamp('archivado_en', { withTimezone: true }),
    // precision 3 is load-bearing: the cron's optimistic claim and the editor's
    // guards compare this column by equality against a value that round-tripped
    // through a JS Date (millisecond precision). With Postgres's default
    // microseconds the comparison can never match and every write silently no-ops.
    updatedAt: timestamp('updated_at', { withTimezone: true, precision: 3 })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique('scheduled_post_targets_post_account_key').on(t.postId, t.accountId),
    index('scheduled_post_targets_status_idx').on(t.status),
    // No unique: filas históricas pueden repetir external_id (o traerlo null) y un unique
    // fallaría al aplicarse sobre filas históricas. Solo acelera la búsqueda de reglas por
    // cuenta + external_id que hace `aplicarReglas`/`reglasPara` en cada sondeo.
    index('scheduled_post_targets_account_external_idx').on(t.accountId, t.externalId),
    // Por `external_id` solo: los atributos de una publicación (`post-attributes.ts`) cruzan
    // por el id de la red sin saber la cuenta.
    index('scheduled_post_targets_external_idx').on(t.externalId),
  ],
).enableRLS()

/** One row per file, already living in Cloudflare R2; `position` orders the carousel. */
export const scheduledPostMedia = pgTable(
  'scheduled_post_media',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    postId: uuid('post_id')
      .notNull()
      .references(() => scheduledPosts.id, { onDelete: 'cascade' }),
    blobUrl: text('blob_url').notNull(),
    mediaType: text('media_type').$type<'image' | 'video'>().notNull(),
    position: integer('position').notNull(),
  },
  (t) => [index('scheduled_post_media_post_idx').on(t.postId)],
).enableRLS()

/**
 * La palabra clave de un post programado y qué responder cuando alguien la comenta. Una
 * por post; se edita después de publicar (a diferencia de `opciones`), así que vive en
 * su propia tabla y no en el post. `palabra` se guarda ya normalizada.
 */
export const reglasClave = pgTable('reglas_clave', {
  id: uuid('id').primaryKey().defaultRandom(),
  postId: uuid('post_id')
    .notNull()
    .unique()
    .references(() => scheduledPosts.id, { onDelete: 'cascade' }),
  palabra: text('palabra').notNull(),
  mensaje: text('mensaje').notNull(),
  respuestaPublica: text('respuesta_publica').notNull(),
  // El PDF que acompaña al mensaje, ya copiado a R2. Nulable: la mayoría de las reglas
  // no llevan documento. Va en `storage-gc` — si no, el barrido lo borra en una hora.
  documentoUrl: text('documento_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}).enableRLS()

export const COMMENT_STATES = ['pendiente', 'enviado', 'descartado', 'propio', 'fallido'] as const
export type CommentState = (typeof COMMENT_STATES)[number]

/** El privado de la sección 7 del diseño: `no` hasta que la bandera lo encienda. */
export const DM_STATES = ['no', 'pendiente', 'enviado', 'fallido'] as const
export type DmState = (typeof DM_STATES)[number]

/**
 * Un comentario que alguien dejó en una publicación del dueño, y qué se hizo con él.
 *
 * La identidad es `(account_id, external_id)`: es lo que impide que el sondeo lo
 * procese dos veces, y por eso la fila sobrevive al envío en vez de borrarse. `propio`
 * marca los comentarios del dueño mismo — sus propias respuestas — que nunca reciben
 * borrador.
 *
 * `draft` y `draft_error` los llena la entrega 2; `reply_external_id` y `error`, la 3.
 */
export const postComments = pgTable(
  'post_comments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    accountId: uuid('account_id')
      .notNull()
      .references(() => socialAccounts.id, { onDelete: 'cascade' }),
    network: text('network').notNull(),
    postExternalId: text('post_external_id').notNull(),
    externalId: text('external_id').notNull(),
    author: text('author'),
    authorExternalId: text('author_external_id'),
    text: text('text').notNull(),
    publishedAt: timestamp('published_at', { withTimezone: true }).notNull(),
    draft: text('draft'),
    draftError: text('draft_error'),
    state: text('state').$type<CommentState>().notNull().default('pendiente'),
    replyExternalId: text('reply_external_id'),
    error: text('error'),
    dmState: text('dm_state').$type<DmState>().notNull().default('no'),
    dmError: text('dm_error'),
    // Lo respondió una regla de palabra clave, no el dueño: la cola lo etiqueta y la IA
    // nunca le pidió borrador.
    automatico: boolean('automatico').notNull().default(false),
    // Quien está mandando la respuesta ahora mismo la reclama hasta esta hora: dos toques,
    // dos pestañas del panel o un sondeo encima de otro mandan una sola. Lo pone
    // `reclamarEnvio` y lo saca la escritura del resultado; si el envío muere, vence solo.
    enviandoHasta: timestamp('enviando_hasta', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // Al revés que en social_posts, por la misma regla: la unique va en el orden físico de
    // la tabla, y como esta tabla es nueva, la migración inicial la crea tal como está
    // declarada, así que su orden de declaración es su orden físico. Con `account_id`
    // primero sirve además la consulta del sondeo, que filtra por cuenta y luego por
    // publicación.
    unique('post_comments_account_external_key').on(t.accountId, t.externalId),
    index('post_comments_state_idx').on(t.state),
    index('post_comments_published_idx').on(t.publishedAt),
  ],
).enableRLS()

export const SOURCE_POST_STATES = ['cruda', 'lista', 'aprobada', 'rechazada', 'fallida'] as const
export type SourcePostState = (typeof SOURCE_POST_STATES)[number]

/**
 * La lista curada de creadores que el modo Tinder lee. `since_id` es el control de costo
 * entero: X cobra por publicación leída, así que la consulta arranca desde el último tuit
 * ya visto y un creador que no publicó nada sale gratis.
 */
export const sourceAuthors = pgTable(
  'source_authors',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'restrict' }),
    network: text('network').notNull(),
    username: text('username').notNull(),
    // El id numérico de X. Se resuelve una sola vez: si el creador se cambia el nombre de
    // usuario, el id sigue siendo el mismo y la traída no se entera, que es lo correcto.
    externalId: text('external_id'),
    active: boolean('active').notNull().default(true),
    sinceId: text('since_id'),
    lastError: text('last_error'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // `network` se declara antes que `username`, y en una tabla nueva el orden de
    // declaración es el orden físico: drizzle-kit introspecta las uniques por ese orden.
    unique('source_authors_network_username_key').on(t.network, t.username),
    index('source_authors_owner_idx').on(t.ownerId),
  ],
).enableRLS()

/**
 * Una ficha por tuit traído. `author_handle` y `url` van copiados para que la baraja se
 * lea sin join, y `original_text` se guarda porque la ficha muestra el original plegado
 * debajo del texto reescrito.
 *
 * `draft` y `draft_error` los llena la entrega 2; `scheduled_post_id`, la 3.
 */
export const sourcePosts = pgTable(
  'source_posts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    authorId: uuid('author_id')
      .notNull()
      .references(() => sourceAuthors.id, { onDelete: 'cascade' }),
    network: text('network').notNull(),
    externalId: text('external_id').notNull(),
    url: text('url').notNull(),
    authorHandle: text('author_handle').notNull(),
    originalText: text('original_text').notNull(),
    publishedAt: timestamp('published_at', { withTimezone: true }).notNull(),
    draft: text('draft'),
    draftError: text('draft_error'),
    state: text('state').$type<SourcePostState>().notNull().default('cruda'),
    scheduledPostId: uuid('scheduled_post_id').references(() => scheduledPosts.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // Mismo orden físico que la declaración: `author_id` es la segunda columna y
    // `external_id` la cuarta. Declararla al revés haría que `drizzle-kit generate`
    // quisiera recrearla.
    unique('source_posts_author_external_key').on(t.authorId, t.externalId),
    index('source_posts_state_idx').on(t.state),
    index('source_posts_published_idx').on(t.publishedAt),
  ],
).enableRLS()

/**
 * Preferencias del panel, una fila por clave. Tabla de clave y valor y no columnas en otra
 * tabla porque esta es la primera de varias: lo que se guarda acá no tiene dueño natural
 * en ninguna entidad del dominio.
 */
export const ajustes = pgTable(
  'ajustes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'restrict' }),
    clave: text('clave').notNull(),
    valor: text('valor').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  // La única va sobre el par, no sobre la clave: cada dueño tiene su propia fila para la
  // misma clave. `owner_id` sigue nulable hasta la entrega 3, y en Postgres dos NULL no
  // chocan entre sí, cosa que el paso de adopción del despliegue resuelve enseguida.
  (t) => [unique('ajustes_owner_clave_key').on(t.ownerId, t.clave), index('ajustes_owner_idx').on(t.ownerId)],
).enableRLS()

/**
 * Lo que alguien dejó a medio escribir en el compositor de La Parrilla. Se guarda solo
 * mientras escribe, como un borrador de correo, y se borra al programarlo o descartarlo.
 *
 * Es estado del formulario, no una publicación: por eso vive aparte de `scheduled_posts` y
 * ni el publicador ni la API lo ven. La app del teléfono sí: Publicar guarda en las mismas
 * filas (`api/mobile/borradores`), así que lo empezado en un lado se sigue en el otro. `campos` son los valores del formulario tal como los
 * lee `createScheduledPost` (nombre → valores), y `fecha` es la de su campo «Fecha y hora»
 * ya resuelta en la zona del dueño, que es lo que el calendario necesita para ponerlo en
 * su día. Sin fecha, el borrador solo aparece en la lista de borradores.
 */
export const borradores = pgTable(
  'borradores',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    campos: jsonb('campos').$type<Record<string, string[]>>().notNull().default({}),
    fecha: timestamp('fecha', { withTimezone: true }),
    creadoEn: timestamp('creado_en', { withTimezone: true }).notNull().defaultNow(),
    actualizadoEn: timestamp('actualizado_en', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('borradores_owner_idx').on(t.ownerId)],
).enableRLS()

/**
 * Los archivos de un borrador, ya subidos a R2: el compositor sube cada uno apenas se elige,
 * para que el borrador lo conserve. Tabla y no un campo dentro de `campos` porque el
 * barrido de huérfanos solo protege lo que una columna nombra (`storage-gc.ts`).
 */
export const borradorMedia = pgTable(
  'borrador_media',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    borradorId: uuid('borrador_id')
      .notNull()
      .references(() => borradores.id, { onDelete: 'cascade' }),
    blobUrl: text('blob_url').notNull(),
    mediaType: text('media_type').$type<'image' | 'video'>().notNull(),
    nombre: text('nombre').notNull(),
    position: integer('position').notNull(),
  },
  (t) => [index('borrador_media_borrador_idx').on(t.borradorId)],
).enableRLS()

/**
 * Las llaves de API que un usuario genera en Tu Cuenta para dárselas a un programa —su
 * agente que edita videos, un script—. Quien llama con una actúa como su dueño.
 *
 * Nunca la llave, solo su hash: se muestra una vez al generarla y no se puede volver a
 * leer. `final` son sus últimos caracteres, para reconocerla en la lista. Revocar es
 * borrar la fila; quitar al usuario se lleva sus llaves.
 */
export const llavesApi = pgTable(
  'llaves_api',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    nombre: text('nombre').notNull(),
    hash: text('hash').notNull().unique(),
    final: text('final').notNull(),
    creadaEn: timestamp('creada_en', { withTimezone: true }).notNull().defaultNow(),
    usadaEn: timestamp('usada_en', { withTimezone: true }),
  },
  (t) => [index('llaves_api_owner_idx').on(t.ownerId)],
).enableRLS()

/**
 * Cada borrado que Meta nos pidió (data deletion callback): el código que devolvimos y
 * cuántas cuentas cayeron. Sin dueño a propósito: cuando se inserta, el dueño ya no tiene
 * cuentas de Meta y Meta no sabe quién es; la página de estado solo muestra fecha y número.
 */
export const solicitudesBorrado = pgTable('solicitudes_borrado', {
  id: uuid('id').primaryKey().defaultRandom(),
  codigo: text('codigo').notNull().unique(),
  red: text('red').notNull(),
  metaUserId: text('meta_user_id').notNull(),
  cuentas: integer('cuentas').notNull(),
  creadoEn: timestamp('creado_en', { withTimezone: true }).notNull().defaultNow(),
}).enableRLS()

// --- La Cocina ----------------------------------------------------------------------------
// El diseño, con el porqué de cada tabla, está en
// `docs/superpowers/specs/2026-10-22-la-cocina-design.md`, «Lo que se guarda». La API con la que
// el chef las lee y las escribe, en `docs/cocina-api.md`.

export const ESTADOS_COMANDA = [
  'recibida',
  'revisando',
  'en_preparacion',
  'probando',
  'pregunta',
  'en_el_horno',
  'sirviendo',
  'lista',
  'servida',
  'rechazada',
  'cancelada',
  'fallida',
] as const
export type EstadoComanda = (typeof ESTADOS_COMANDA)[number]

export const TIPOS_COMANDA = ['tanda', 'prueba', 'reestilo'] as const
export type TipoComanda = (typeof TIPOS_COMANDA)[number]

/** El plato principal y sus acompañamientos: cada tipo entra al chef por un camino distinto. */
export const TIPOS_INSUMO = ['principal', 'camara', 'pantalla', 'imagen'] as const
export type TipoInsumo = (typeof TIPOS_INSUMO)[number]

/** `subiendo` mientras el chef sube sus archivos; `mesa` está en el mesón, por revisar. */
export const ESTADOS_CREATIVO = ['subiendo', 'mesa', 'programado', 'descartado'] as const
export type EstadoCreativo = (typeof ESTADOS_CREATIVO)[number]

/**
 * La marca de un usuario, la que el chef usa para vestir lo que cocina. En la fase 0 es la
 * básica —nombre, @, el color de acento y el texto del llamado final—; las letras, el logo y la
 * música entran con «Tu marca», en la fase 2. Una por usuario por ahora, aunque la tabla permite
 * varias (una agencia).
 */
export const marcas = pgTable(
  'marcas',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    nombre: text('nombre').notNull(),
    handle: text('handle'),
    acento: text('acento'),
    ctaTexto: text('cta_texto'),
    creadaEn: timestamp('creada_en', { withTimezone: true }).notNull().defaultNow(),
    actualizadaEn: timestamp('actualizada_en', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('marcas_owner_idx').on(t.ownerId)],
).enableRLS()

/**
 * Un encargo al chef. `receta` es lo que se congeló al crearla —la marca y lo que se pidió—, y no
 * cambia aunque el usuario cambie su marca después: lo que está en el horno no cambia. `ref` evita
 * duplicarla si el formulario se manda dos veces. `minutos` es lo que consume del cupo (el plato
 * principal); el cupo todavía no tiene tope. Los estados y quién mueve cada uno están en
 * `src/lib/cocina/estados.ts`.
 */
export const comandas = pgTable(
  'comandas',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    marcaId: uuid('marca_id').references(() => marcas.id, { onDelete: 'set null' }),
    ref: text('ref').notNull(),
    tipo: text('tipo').$type<TipoComanda>().notNull().default('tanda'),
    // La comanda servida cuyo material reusa un `reestilo`.
    origenId: uuid('origen_id').references((): AnyPgColumn => comandas.id, { onDelete: 'set null' }),
    estado: text('estado').$type<EstadoComanda>().notNull().default('recibida'),
    pedido: jsonb('pedido').$type<Record<string, unknown>>().notNull(),
    receta: jsonb('receta').$type<Record<string, unknown>>().notNull(),
    minutos: integer('minutos').notNull().default(0),
    // La hora estimada de entrega que dio el chef en su último cambio, y lo que dijo.
    eta: timestamp('eta', { withTimezone: true }),
    mensaje: text('mensaje'),
    // Por qué se rechazó o falló, en palabras para el usuario.
    motivo: text('motivo'),
    // El «3 de 5»: las tandas que ya están en el mesón, y cuántas son (nulo si no se sabe).
    tandasServidas: integer('tandas_servidas').notNull().default(0),
    tandasTotal: integer('tandas_total'),
    // Quién la tomó, del lado del chef, y cuándo.
    tomadaPor: text('tomada_por'),
    tomadaEn: timestamp('tomada_en', { withTimezone: true }),
    listaEn: timestamp('lista_en', { withTimezone: true }),
    servidaEn: timestamp('servida_en', { withTimezone: true }),
    creadaEn: timestamp('creada_en', { withTimezone: true }).notNull().defaultNow(),
    actualizadaEn: timestamp('actualizada_en', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique('comandas_owner_ref_key').on(t.ownerId, t.ref),
    index('comandas_owner_idx').on(t.ownerId, t.creadaEn),
    index('comandas_estado_idx').on(t.estado),
  ],
).enableRLS()

/** La línea de tiempo de una comanda: cada cambio, con lo que dijo el chef y su hora estimada. */
export const comandaEventos = pgTable(
  'comanda_eventos',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    comandaId: uuid('comanda_id')
      .notNull()
      .references(() => comandas.id, { onDelete: 'cascade' }),
    estado: text('estado').$type<EstadoComanda>().notNull(),
    mensaje: text('mensaje'),
    eta: timestamp('eta', { withTimezone: true }),
    creadoEn: timestamp('creado_en', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('comanda_eventos_comanda_idx').on(t.comandaId, t.creadoEn)],
).enableRLS()

/**
 * Un archivo que el usuario le lleva al chef: el plato principal o un acompañamiento. Vive en el
 * almacén (`cocina/<dueño>/…`) y se borra a los 14 días de terminada la comanda (`expiraEn`,
 * `borradoEn`). `derechosEn` es cuándo el usuario declaró que tiene los derechos de lo que sube.
 * Sin comanda mientras el formulario no se manda: una subida abandonada se barre.
 */
export const insumos = pgTable(
  'insumos',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    comandaId: uuid('comanda_id').references(() => comandas.id, { onDelete: 'cascade' }),
    tipo: text('tipo').$type<TipoInsumo>().notNull(),
    // Del plato principal: un largo, un podcast en videollamada o tomas sueltas.
    subtipo: text('subtipo'),
    nombre: text('nombre').notNull(),
    url: text('url').notNull(),
    bytes: bigint('bytes', { mode: 'number' }).notNull(),
    duracionS: real('duracion_s'),
    tipoArchivo: text('tipo_archivo').notNull(),
    derechosEn: timestamp('derechos_en', { withTimezone: true }).notNull(),
    expiraEn: timestamp('expira_en', { withTimezone: true }),
    borradoEn: timestamp('borrado_en', { withTimezone: true }),
    creadoEn: timestamp('creado_en', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('insumos_owner_idx').on(t.ownerId), index('insumos_comanda_idx').on(t.comandaId)],
).enableRLS()

/**
 * Lo que el chef entrega: un video, un carrusel o una imagen, con sus textos, su pieza y su estilo,
 * listo para programar. Vive en el mesón (de día, la vitrina) hasta que se programa o se descarta;
 * lo que nadie programó se borra a los 30 días (`expiraEn`). Sus archivos van en la carpeta del
 * dueño (`scheduled/<dueño>/cocina/…`), así que programarlo no los vuelve a bajar. `ref` evita
 * duplicarlo si el chef lo reenvía.
 */
export const creativos = pgTable(
  'creativos',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    comandaId: uuid('comanda_id')
      .notNull()
      .references(() => comandas.id, { onDelete: 'cascade' }),
    marcaId: uuid('marca_id').references(() => marcas.id, { onDelete: 'set null' }),
    ref: text('ref').notNull(),
    // La idea: varios creativos son la misma pieza en estilos distintos, y el mesón los junta.
    pieza: text('pieza'),
    tanda: text('tanda'),
    tipo: text('tipo').$type<'video' | 'carrusel' | 'imagen'>().notNull(),
    portadaUrl: text('portada_url'),
    texto: text('texto').notNull().default(''),
    // En YouTube la primera línea es el título: el chef lo escribe aparte, de hasta 100 caracteres.
    tituloYoutube: text('titulo_youtube'),
    estilo: text('estilo'),
    atributos: jsonb('atributos'),
    duracionS: real('duracion_s'),
    estado: text('estado').$type<EstadoCreativo>().notNull().default('subiendo'),
    descarteMotivo: text('descarte_motivo'),
    descarteNota: text('descarte_nota'),
    postId: uuid('post_id').references(() => scheduledPosts.id, { onDelete: 'set null' }),
    expiraEn: timestamp('expira_en', { withTimezone: true }),
    creadoEn: timestamp('creado_en', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique('creativos_comanda_ref_key').on(t.comandaId, t.ref),
    index('creativos_owner_idx').on(t.ownerId, t.estado),
  ],
).enableRLS()

/**
 * Los archivos de un creativo: el video o las láminas de un carrusel, en su orden (`rol` `media`), y
 * su portada (`rol` `portada`). La portada va también acá para que se verifique al cerrar el
 * creativo y para que el barrido de huérfanos la cuide como a los demás.
 */
export const creativoMedia = pgTable(
  'creativo_media',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    creativoId: uuid('creativo_id')
      .notNull()
      .references(() => creativos.id, { onDelete: 'cascade' }),
    url: text('url').notNull(),
    mediaType: text('media_type').$type<'image' | 'video'>().notNull(),
    rol: text('rol').$type<'media' | 'portada'>().notNull().default('media'),
    nombre: text('nombre').notNull(),
    tipoArchivo: text('tipo_archivo').notNull(),
    bytes: bigint('bytes', { mode: 'number' }).notNull(),
    position: integer('position').notNull(),
  },
  (t) => [index('creativo_media_creativo_idx').on(t.creativoId)],
).enableRLS()

/**
 * El último latido de cada trabajador del chef: si pasan diez minutos sin uno, el panel dice que
 * la cocina está cerrada por ahora. `datos` es lo que el chef cuenta de sí (cuántos trabajos
 * tiene, cuánto tarda una comanda en promedio, su versión).
 */
export const latidos = pgTable('latidos', {
  trabajador: text('trabajador').primaryKey(),
  en: timestamp('en', { withTimezone: true }).notNull(),
  datos: jsonb('datos').$type<Record<string, unknown>>(),
}).enableRLS()

export type Profile = typeof profiles.$inferSelect
export type Link = typeof links.$inferSelect
export type Visit = typeof visits.$inferSelect
export type Click = typeof clicks.$inferSelect
export type SocialAccount = typeof socialAccounts.$inferSelect
export type SocialPost = typeof socialPosts.$inferSelect
export type PostMetric = typeof postMetrics.$inferSelect
export type ScheduledPost = typeof scheduledPosts.$inferSelect
export type ScheduledPostTarget = typeof scheduledPostTargets.$inferSelect
export type ScheduledPostMedia = typeof scheduledPostMedia.$inferSelect
export type ReglaClave = typeof reglasClave.$inferSelect
export type PostComment = typeof postComments.$inferSelect
export type SourceAuthor = typeof sourceAuthors.$inferSelect
export type SourcePost = typeof sourcePosts.$inferSelect
export type Ajuste = typeof ajustes.$inferSelect
export type SolicitudBorrado = typeof solicitudesBorrado.$inferSelect
export type Usuario = typeof users.$inferSelect
export type CodigoIngreso = typeof codigosIngreso.$inferSelect
export type LlaveApi = typeof llavesApi.$inferSelect
export type Borrador = typeof borradores.$inferSelect
export type BorradorMedia = typeof borradorMedia.$inferSelect
export type Marca = typeof marcas.$inferSelect
export type Comanda = typeof comandas.$inferSelect
export type ComandaEvento = typeof comandaEventos.$inferSelect
export type Insumo = typeof insumos.$inferSelect
export type Creativo = typeof creativos.$inferSelect
export type CreativoMedia = typeof creativoMedia.$inferSelect
