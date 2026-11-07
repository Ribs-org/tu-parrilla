'use server'

import { randomUUID } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { basePublica, keyDesdeUrl, tamanoEnAlmacen } from '@/lib/storage'
import { ARCHIVO_MUY_GRANDE, MAX_BYTES_ARCHIVO } from '@/lib/social/publish/limites'
import { and, eq, inArray, max, ne, sql } from 'drizzle-orm'
import { getDb, links, profiles, socialAccounts, socialPosts, scheduledPosts, scheduledPostTargets, users } from '@/db'
import { LINK_KINDS, type LinkKind } from '@/db/schema'
import { destroySession, requireAdmin, requireUser } from '@/lib/auth'
import { normalizeCampaignTag } from '@/lib/social/campaign'
import { volverDelEditor } from './(dash)/schedule/enlace'
import { validarRegla } from '@/lib/social/comentarios/reglas'
import { FUSION_FALLO, FUSION_NO_ES_TUYA, decidirFusion, pasosDeFusion } from '@/lib/social/fusion'
import { LINK_SIN_NOMBRE, LINK_SIN_URL } from '@/lib/revisiones'
import { BORRADO_YA_PUBLICADO } from '@/lib/schedule-api'
import { borrarPostProgramado } from '@/lib/social/publish/borrar'
import { DESTINO_NO_EXISTE, REPROGRAMAR_PASADO, reprogramarDestino } from '@/lib/social/publish/reprogramar'
import { FRASE_DE_FALLA, archivarDestino } from '@/lib/social/publish/archivar'
import { csvToBatchItems } from '@/lib/social/publish/csv'
import { scheduleBatch, MAX_BATCH_ITEMS } from '@/lib/social/publish/batch'
import {
  errorDeHistoria,
  errorDeMediaPorOpciones,
  musicaParaRecordar,
  opcionesDesdeFormularioPorCuenta,
  validarOpcionesPorCuenta,
} from '@/lib/social/publish/opciones'
import { extensionDe, validateScheduleDraft } from '@/lib/social/publish/validate'
import { validateAtributos, ATRIBUTOS_ERROR, type Atributos } from '@/lib/social/publish/atributos'
import { POST_NO_EXISTE, editarPostProgramado } from '@/lib/social/publish/editar'
import { BorradorConsumido, CreativoNoEsta, crearPostProgramado } from '@/lib/social/publish/crear'
import { CREATIVO_NO_ESTA } from '@/lib/cocina/meson-motivos'
import { BORRADOR_NO_EXISTE } from '@/lib/mobile-api'
import { REARME } from '@/lib/social/publish/publisher'
import { esUuid } from '@/lib/uuid'
import { conMensaje } from '@/lib/mensaje-firmado'
import { desconectarCuenta } from '@/lib/social/desconectar'
import { quitarCuenta } from '@/lib/social/quitar'
import { traspasarCuenta } from '@/lib/social/traspasar'
import { CuentaInvalida, verificarCuentas, type CuentaDestino } from '@/lib/social/cuentas'
// `guardarCuenta` de `social/conectar` guarda una cuenta *de una red*; la acción de abajo,
// con el mismo nombre, guarda la cuenta *del usuario*. Se renombra la de la red al
// importarla porque la acción es la que el formulario nombra desde fuera.
import {
  CuentaDeOtro,
  fraseCuentaDeOtro,
  guardarCuenta as guardarCuentaDeRed,
  nombreDeCandidata,
  tokensDePaginas,
  tomadasPorOtro,
} from '@/lib/social/conectar'
import { SIN_TOKEN_DE_PAGINA } from '@/lib/social/facebook'
import { tiktokConnector } from '@/lib/social/tiktok'
import { TIKTOK_SIN_CUENTA, consultarCreador, type CreadorTikTok } from '@/lib/social/publish/tiktok-creador'
import { COOKIE_PENDIENTE, LOGIN_VENCIDO, elegidas, leerPendiente } from '@/lib/social/pendiente'
import { networkLabel } from '@/lib/networks'
import { crearLlave, revocarLlave } from '@/lib/llaves'
import { borradorDemasiadoGrande, camposDesdeFormulario, idDeBorrador, primero } from '@/lib/borrador'
import { borrarBorrador, guardarBorrador, type MediaDeBorrador } from '@/lib/borradores'
import { ARCHIVO_AJENO, ARCHIVO_FALTANTE, CUERPO_ILEGIBLE, parseMediaMovil, type MediaMovil } from '@/lib/mobile-api'
import { esReservado } from '@/lib/slugs'
import { cerrarSesiones, esChoqueDeUnicidad, invitar, pedir, quitar } from '@/lib/usuarios'
import { encenderCocinaDe } from '@/lib/cocina/panel'
import { leerCuotaEnGb } from '@/lib/cocina/bodega'
import { cambiarCuotaDeLaCamara } from '@/lib/cocina/materiales'
import { nombreDe } from '@/lib/vocabulario'
import { fromZonedInput, normalizeUrl, slugify } from '@/lib/utils'
import { ZONA_INVALIDA, esZonaValida } from '@/lib/zona'
import { temaDe, type Tema } from '@/lib/tema'
import { proximamentePara } from '@/lib/redes-abiertas'

/**
 * Lo que devuelve una acción de formulario. `id` es el del post recién programado: con él, el
 * calendario lo enciende en su día al volver del compositor (`nuevo`, en `schedule/page.tsx`).
 */
export type FormState = { error?: string; ok?: boolean; aviso?: string; id?: string }

export async function logout() {
  await destroySession()
  redirect('/ingresar')
}

/* ---------------------------------------------------------------- profiles -- */

function readProfileForm(formData: FormData) {
  const displayName = String(formData.get('displayName') ?? '').trim()
  const rawSlugField = formData.get('slug')
  // Un input deshabilitado (la URL del principal de un invitado, en el editor) no viaja en
  // el FormData: `formData.get('slug')` da `null`, y eso dice «no toques el slug», algo
  // distinto de una cadena vacía —que sí es una instrucción real de quien puede editarlo—.
  // Confundir los dos era el bug: guardar el formulario de la página principal de un
  // invitado, sin tocar la URL, le cambiaba la dirección en silencio.
  const rawSlug = rawSlugField === null ? null : String(rawSlugField).trim()

  return {
    displayName,
    // `undefined` = no reescribir el slug que ya tiene el perfil. Solo pasa cuando el
    // campo no vino; si vino (aunque sea vacío), se resuelve con el mismo respaldo de
    // siempre, que sigue haciendo falta para dar de alta un perfil sin dirección todavía.
    slug:
      rawSlug === null
        ? undefined
        : slugify(rawSlug) || slugify(displayName) || `perfil-${randomUUID().slice(0, 6)}`,
    headline: String(formData.get('headline') ?? '').trim() || null,
    bio: String(formData.get('bio') ?? '').trim() || null,
    avatarUrl: String(formData.get('avatarUrl') ?? '').trim() || null,
    accentColor: String(formData.get('accentColor') ?? '#8b7cff').trim(),
    ogImageUrl: String(formData.get('ogImageUrl') ?? '').trim() || null,
    isPublished: formData.get('isPublished') === 'on',
    noindex: formData.get('noindex') === 'on',
    updatedAt: new Date(),
  }
}

export async function createProfile(): Promise<never> {
  const { id: ownerId } = await requireUser()
  const db = getDb()
  const suffix = randomUUID().slice(0, 6)

  const [row] = await db
    .insert(profiles)
    .values({
      ownerId,
      slug: `perfil-${suffix}`,
      displayName: 'Perfil nuevo',
      accentColor: '#8b7cff',
      isPublished: false,
      noindex: true,
    })
    .returning({ id: profiles.id })

  revalidatePath('/admin/profiles')
  redirect(`/admin/profiles/${row!.id}`)
}

export async function updateProfile(
  profileId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { id: ownerId } = await requireUser()
  const values = readProfileForm(formData)

  if (!values.displayName) return { error: 'El nombre no puede quedar vacío.' }
  if (values.slug !== undefined && esReservado(values.slug)) {
    return {
      error: `«${values.slug}» es una dirección reservada del sistema: elige otro nombre o escribe una URL distinta.`,
    }
  }

  try {
    await getDb()
      .update(profiles)
      .set(values)
      .where(and(eq(profiles.id, profileId), eq(profiles.ownerId, ownerId)))
  } catch (error) {
    // `String(error)` nunca casaba: drizzle envuelve la consulta fallida en un
    // `DrizzleQueryError` cuyo propio mensaje es solo `Failed query: <sql>\nparams:
    // <params>` — ni el nombre de la restricción ni "duplicate key" aparecen ahí, solo en
    // `cause`, que es justo donde mira `esChoqueDeUnicidad` (ya usada, y ya probada, en
    // `lib/usuarios.ts`).
    if (esChoqueDeUnicidad(error)) {
      return {
        error:
          values.slug !== undefined
            ? `La URL /${values.slug} ya está en uso por otro perfil.`
            : 'No se pudo guardar. Intenta de nuevo.',
      }
    }
    return { error: 'No se pudo guardar. Intenta de nuevo.' }
  }

  revalidatePath('/admin/profiles')
  revalidatePath(`/admin/profiles/${profileId}`)
  revalidatePath('/', 'layout')
  return { ok: true }
}

/**
 * Promotes one profile to default and demotes the rest — but only within the same owner:
 * each user has exactly one default profile, not the whole deployment. And `/` only ever
 * serves the admin's default profile; a guest's default profile lives at `/<slug>` like
 * any other of theirs (see `rutaPublicaDe` in `lib/utils.ts`).
 */
export async function makeDefault(profileId: string) {
  const { id: ownerId } = await requireUser()
  const db = getDb()
  const [profile] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(and(eq(profiles.id, profileId), eq(profiles.ownerId, ownerId)))
  if (!profile) return

  // Las dos escrituras van juntas en una transacción: degradar a todos y no llegar a
  // promover a nadie (p.ej. la conexión se cae entre medio) dejaría al dueño sin ninguna
  // página principal — y si es el admin, sin raíz en su dominio personal, ya en
  // producción. Es la misma herida que `deleteProfile` cierra del otro lado.
  await db.transaction(async (tx) => {
    await tx
      .update(profiles)
      .set({ isDefault: false })
      .where(and(ne(profiles.id, profileId), eq(profiles.ownerId, ownerId)))
    await tx
      .update(profiles)
      .set({ isDefault: true, isPublished: true })
      .where(and(eq(profiles.id, profileId), eq(profiles.ownerId, ownerId)))
  })

  revalidatePath('/admin/profiles')
  revalidatePath('/', 'layout')
}

/**
 * Se niega en dos casos: si es la última página del dueño, o si es la principal
 * (`isDefault`) y hay otras. Lo segundo no es un capricho: `getDefaultProfile(adminId)` en
 * `src/app/page.tsx` da por hecho que el admin del despliegue siempre tiene una principal, y
 * nada repromueve otra si esta se borra — dejarlo pasar serviría la pantalla de primer
 * arranque en la raíz de un dominio personal ya en producción. El mensaje dice cómo salir:
 * hacer principal a otra página primero (`makeDefault`, en La Vitrina). El panel ya no
 * ofrece el botón en ninguno de los dos casos (ver el editor), pero el servidor es quien
 * tiene que garantizarlo de verdad.
 *
 * Contar las páginas del dueño y decidir si esta es de las dos que no se pueden borrar
 * corre en la misma transacción que el borrado: sueltas, dos borrados a la vez podrían leer
 * ambos «tengo dos» antes de que el otro termine, y dejar al dueño en cero.
 *
 * Antes no devolvía nada (siempre redirigía); ahora devuelve `{ error }` en el caso que
 * bloquea, así que quien llama necesita leer el resultado en vez de solo disparar la
 * promesa. En el camino feliz sigue sin cambiar: redirige, fuera de cualquier try/catch que
 * pudiera tragarse su propio error de navegación (mismo motivo que en `conectarElegidas`).
 */
export async function deleteProfile(profileId: string): Promise<{ error?: string }> {
  const { id: ownerId } = await requireUser()
  const db = getDb()

  const bloqueo = await db.transaction(async (tx) => {
    // Las páginas del dueño, bloqueadas hasta terminar (`FOR UPDATE`): dos borrados a la vez
    // de sus dos últimas páginas veían dos cada uno, y se llevaban las dos. Con el bloqueo, el
    // segundo espera al primero y ve una.
    const propios = await tx
      .select({ id: profiles.id, isDefault: profiles.isDefault })
      .from(profiles)
      .where(eq(profiles.ownerId, ownerId))
      .for('update')
    if (propios.length <= 1) {
      return 'No puedes borrar tu única página: todo usuario necesita al menos una.'
    }
    if (propios.find((p) => p.id === profileId)?.isDefault) {
      return `No puedes borrar tu página principal: primero haz principal a otra página, desde «${nombreDe('/admin/profiles')}».`
    }

    await tx.delete(profiles).where(and(eq(profiles.id, profileId), eq(profiles.ownerId, ownerId)))
    return null
  })
  if (bloqueo) return { error: bloqueo }

  revalidatePath('/admin/profiles')
  redirect('/admin/profiles')
}

/** A fresh random suffix, for when a private URL has been shared too widely. */
export async function rotateSlug(profileId: string) {
  const { id: ownerId } = await requireUser()
  const [row] = await getDb()
    .select({ slug: profiles.slug })
    .from(profiles)
    .where(and(eq(profiles.id, profileId), eq(profiles.ownerId, ownerId)))
  const base = (row?.slug ?? 'perfil').replace(/-[0-9a-f]{8}$/, '')

  await getDb()
    .update(profiles)
    .set({ slug: `${base}-${randomUUID().slice(0, 8)}`, updatedAt: new Date() })
    .where(and(eq(profiles.id, profileId), eq(profiles.ownerId, ownerId)))

  revalidatePath(`/admin/profiles/${profileId}`)
  revalidatePath('/admin/profiles')
}

/* ------------------------------------------------------------------- links -- */

/** `zona` es la del dueño de la sesión: la misma en la que el editor pintó las ventanas. */
function readLinkForm(formData: FormData, zona: string) {
  const kind = String(formData.get('kind') ?? 'standard')

  return {
    kind: (LINK_KINDS as readonly string[]).includes(kind) ? (kind as LinkKind) : 'standard',
    label: String(formData.get('label') ?? '').trim(),
    sublabel: String(formData.get('sublabel') ?? '').trim() || null,
    url: normalizeUrl(String(formData.get('url') ?? '')),
    icon: String(formData.get('icon') ?? '').trim() || null,
    imageUrl: String(formData.get('imageUrl') ?? '').trim() || null,
    isActive: formData.get('isActive') === 'on',
    // Read in the same zone the editor rendered them in, so re-saving a link —
    // which the row toggle does on every click — leaves the window untouched.
    startsAt: fromZonedInput(String(formData.get('startsAt') ?? ''), zona),
    endsAt: fromZonedInput(String(formData.get('endsAt') ?? ''), zona),
  }
}

export async function createLink(
  profileId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { id: ownerId, zona } = await requireUser()
  const values = readLinkForm(formData, zona)

  if (!values.label) return { error: LINK_SIN_NOMBRE }
  if (!values.url) return { error: LINK_SIN_URL }

  const db = getDb()
  const [profile] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(and(eq(profiles.id, profileId), eq(profiles.ownerId, ownerId)))
  if (!profile) return { error: 'El perfil ya no existe.' }

  const [{ highest }] = await db
    .select({ highest: max(links.position) })
    .from(links)
    .where(eq(links.profileId, profileId))

  await db.insert(links).values({ ...values, profileId, position: (highest ?? -1) + 1 })

  revalidatePath(`/admin/profiles/${profileId}`)
  revalidatePath('/', 'layout')
  return { ok: true }
}

export async function updateLink(
  linkId: string,
  profileId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { id: ownerId, zona } = await requireUser()
  const values = readLinkForm(formData, zona)

  if (!values.label) return { error: LINK_SIN_NOMBRE }
  if (!values.url) return { error: LINK_SIN_URL }

  await getDb()
    .update(links)
    .set(values)
    .where(
      and(
        eq(links.id, linkId),
        eq(links.profileId, profileId),
        inArray(links.profileId, getDb().select({ id: profiles.id }).from(profiles).where(eq(profiles.ownerId, ownerId))),
      ),
    )

  revalidatePath(`/admin/profiles/${profileId}`)
  revalidatePath('/', 'layout')
  return { ok: true }
}

export async function deleteLink(linkId: string, profileId: string) {
  const { id: ownerId } = await requireUser()
  await getDb()
    .delete(links)
    .where(
      and(
        eq(links.id, linkId),
        eq(links.profileId, profileId),
        inArray(links.profileId, getDb().select({ id: profiles.id }).from(profiles).where(eq(profiles.ownerId, ownerId))),
      ),
    )

  revalidatePath(`/admin/profiles/${profileId}`)
  revalidatePath('/', 'layout')
}

/** Persists the order produced by the drag-and-drop list. */
export async function reorderLinks(profileId: string, orderedIds: string[]) {
  const { id: ownerId } = await requireUser()
  const db = getDb()

  // Una sola sentencia, con la posición de cada enlace en un `case`: el orden se escribe entero
  // o no se escribe. Antes era un `UPDATE` por enlace, todos a la vez: un corte a la mitad
  // dejaba el orden mezclado, y más enlaces que conexiones en el pool es la forma de consulta
  // que una vez se colgó contra el pooler (ver `docs/pendientes.md`). Un id sin forma de uuid
  // no llega a la base: haría fallar la sentencia entera.
  const ids = orderedIds.filter(esUuid)
  if (ids.length > 0) {
    const posicion = sql`case ${sql.join(
      ids.map((id, i) => sql`when ${links.id} = ${id} then ${i}::integer`),
      sql` `,
    )} end`
    await db
      .update(links)
      .set({ position: posicion })
      .where(
        and(
          inArray(links.id, ids),
          eq(links.profileId, profileId),
          inArray(links.profileId, db.select({ id: profiles.id }).from(profiles).where(eq(profiles.ownerId, ownerId))),
        ),
      )
  }

  revalidatePath(`/admin/profiles/${profileId}`)
  revalidatePath('/', 'layout')
}

/* ------------------------------------------------------------------ social -- */

/**
 * Best effort only: serverless instances are ephemeral and there may be several, so
 * this slows down repeated presses of the sync button from one instance rather than
 * enforcing any real limit. Por dueño: el botón de uno no debe bloquear el de otro.
 */
const lastSyncStartedAtByOwner = new Map<string, number>()
const SYNC_COOLDOWN_MS = 5 * 60 * 1000

export async function syncSocialNow(): Promise<{ ok?: boolean; error?: string }> {
  const { id: ownerId } = await requireUser()

  const lastSyncStartedAt = lastSyncStartedAtByOwner.get(ownerId) ?? 0
  if (Date.now() - lastSyncStartedAt < SYNC_COOLDOWN_MS) {
    return { error: 'Espera unos minutos antes de volver a sincronizar.' }
  }
  lastSyncStartedAtByOwner.set(ownerId, Date.now())
  // Se poda al escribir: sin esto el mapa crece sin límite, un dueño nuevo por siempre.
  for (const [id, at] of lastSyncStartedAtByOwner) {
    if (Date.now() - at >= SYNC_COOLDOWN_MS) lastSyncStartedAtByOwner.delete(id)
  }

  // Deferred: syncAll pulls in the three connectors and the token-crypto helpers behind
  // it, weight that the rest of this file's actions have no reason to carry.
  const { syncAll } = await import('@/lib/social/sync')

  let report
  try {
    report = await syncAll(ownerId)
  } catch (error) {
    // syncAll settles every network on its own, so a throw here is the orchestrator
    // itself failing. Letting it propagate would reach the button as an opaque digest
    // instead of the sentence this function already returns for its other failures.
    console.error('Falló la sincronización de redes:', error)
    return { error: 'No se pudo sincronizar. Intenta de nuevo.' }
  }

  revalidatePath('/admin/accounts')

  const failed = report.filter((r) => !r.ok)
  // Una instalación sin cuentas conectadas no tiene nada que fallar.
  if (report.length > 0 && failed.length === report.length) {
    return { error: 'Ninguna red respondió. Revisa las cuentas de abajo.' }
  }
  return { ok: true }
}

/**
 * «Quitar» en Los Fierros: la cuenta sale de Tu Parrilla con su historial y queda libre para
 * otro usuario. Las reglas —solo desconectada, sin publicaciones por salir— viven en
 * `quitarCuenta`. Al salir bien vuelve a Los Fierros con el aviso; la tarjeta ya no está.
 */
export async function quitarCuentaAccion(accountId: string): Promise<{ error: string }> {
  const usuario = await requireUser()
  const resultado = await quitarCuenta(usuario.id, accountId, usuario.tema)
  if ('error' in resultado) return resultado
  // Lo que se borró se veía también en La Parrilla y en Los Números.
  revalidatePath('/admin', 'layout')
  redirect(conMensaje('/admin/accounts', `«${resultado.nombre}» quitada de Tu Parrilla.`))
}

/**
 * «Desconectar» en Los Fierros. Revoca credenciales, no identidad: la fila se queda, y con ella
 * el historial, salvo en YouTube, donde lo que vino de su API se borra en el acto
 * (`desconectarCuenta`).
 */
export async function disconnectAccount(accountId: string): Promise<void> {
  const usuario = await requireUser()
  await desconectarCuenta(usuario.id, accountId)
  // Lo de YouTube que se borró se veía también en La Mesa y en Los Números.
  revalidatePath('/admin', 'layout')
}

/**
 * «Es la misma cuenta que…»: absorbe una fila sin credencial en una viva de la misma red.
 * TikTok, Instagram y Facebook dan un identificador distinto por app, así que al pasar
 * del sandbox a la app real la misma cuenta vuelve como fila nueva y la vieja queda muerta
 * con su historial colgando. La decisión y los pasos son puros (`social/fusion.ts`); acá
 * solo se leen las dos filas atadas al dueño y se corre la transacción. Nunca lanza: la
 * tarjeta muestra la frase.
 */
export async function fusionarCuenta(muertaId: string, vivaId: string): Promise<{ ok: true } | { error: string }> {
  const usuario = await requireUser()
  const db = getDb()
  const filas = await db
    .select({
      id: socialAccounts.id,
      ownerId: socialAccounts.ownerId,
      network: socialAccounts.network,
      accessToken: socialAccounts.accessToken,
    })
    .from(socialAccounts)
    .where(and(inArray(socialAccounts.id, [muertaId, vivaId]), eq(socialAccounts.ownerId, usuario.id)))
  const muerta = filas.find((f) => f.id === muertaId)
  const viva = filas.find((f) => f.id === vivaId)
  if (!muerta || !viva) return { error: FUSION_NO_ES_TUYA }
  const decision = decidirFusion(
    { id: muerta.id, ownerId: muerta.ownerId, network: muerta.network, conectada: muerta.accessToken !== null },
    { id: viva.id, ownerId: viva.ownerId, network: viva.network, conectada: viva.accessToken !== null },
    usuario.id,
  )
  if ('error' in decision) return decision
  try {
    await db.transaction(async (tx) => {
      for (const paso of pasosDeFusion(muertaId, vivaId, usuario.id)) await tx.execute(paso)
    })
  } catch (error) {
    console.error('Fusionar cuentas:', String(error).slice(0, 300))
    return { error: FUSION_FALLO }
  }
  revalidatePath('/admin/accounts')
  return { ok: true }
}

/**
 * El final de un login con varias candidatas: crea una fila por cuenta marcada. Lee la
 * cookie de nuevo en vez de confiar en el formulario, así lo único que el navegador
 * decide es qué casillas marcó.
 */
export async function conectarElegidas(formData: FormData): Promise<void> {
  const usuario = await requireUser()
  const jar = await cookies()
  const pendiente = leerPendiente(jar.get(COOKIE_PENDIENTE)?.value)
  if (!pendiente || pendiente.sub !== usuario.id) {
    redirect(conMensaje('/admin/accounts', LOGIN_VENCIDO))
  }

  const marcadas = elegidas(pendiente.candidatas, formData.getAll('ids').map(String))
  if (marcadas.length === 0) {
    redirect(conMensaje('/admin/accounts/elegir', 'Elige al menos una cuenta.'))
  }

  // Una cuenta que ya es de otro usuario no se puede marcar en la lista, pero el formulario
  // puede llegar igual (una pestaña vieja). Se revisan todas antes de guardar ninguna: si
  // no, las que iban antes en la lista quedaban guardadas y las de después no.
  const tomadas = await tomadasPorOtro(usuario.id, pendiente.network, marcadas.map((c) => c.externalId))
  if (tomadas.size > 0) {
    const nombres = marcadas.filter((c) => tomadas.has(c.externalId)).map(nombreDeCandidata)
    redirect(conMensaje('/admin/accounts/elegir', fraseCuentaDeOtro(nombres)))
  }

  // Facebook: el token de cada página no viajó en la cookie; se pide ahora con el de usuario.
  let tokens = new Map<string, string>()
  if (pendiente.network === 'facebook') {
    try {
      tokens = await tokensDePaginas(pendiente.accessToken)
    } catch (error) {
      console.error('tokensDePaginas:', String(error).slice(0, 300))
      redirect(conMensaje('/admin/accounts', SIN_TOKEN_DE_PAGINA))
    }
  }

  // No se guarda nada hasta que toda cuenta elegida tenga token, así una falla nunca deja
  // la conexión a medias.
  if (pendiente.network === 'facebook' && marcadas.some((c) => !tokens.get(c.externalId))) {
    redirect(conMensaje('/admin/accounts', SIN_TOKEN_DE_PAGINA))
  }

  let fallo: string | null = null
  try {
    for (const cuenta of marcadas) {
      await guardarCuentaDeRed(usuario.id, pendiente.network, {
        externalId: cuenta.externalId,
        handle: cuenta.handle,
        accessToken:
          pendiente.network === 'facebook' ? tokens.get(cuenta.externalId)! : pendiente.accessToken,
        refreshToken: pendiente.refreshToken,
        expiresAt: pendiente.expiresAt ? new Date(pendiente.expiresAt) : null,
        metaUserId: pendiente.metaUserId,
      })
    }
  } catch (error) {
    if (error instanceof CuentaDeOtro) {
      // Solo si otro la tomó entre la revisión de arriba y este guardado.
      fallo = error.message
    } else {
      console.error('conectarElegidas:', String(error).slice(0, 300))
      fallo = 'No se pudo guardar la cuenta. Inténtalo de nuevo.'
    }
  }
  // Fuera del try a propósito: redirect() lanza su propio error de navegación, y dentro
  // el catch lo tragaría como si fuera una falla de la base.
  if (fallo) redirect(conMensaje('/admin/accounts', fallo))

  // Con el mismo path con que la puso el callback: borrarla sin path escribe sobre otra
  // cookie y deja esta viva sus diez minutos.
  jar.delete({ name: COOKIE_PENDIENTE, path: '/admin/accounts' })
  revalidatePath('/admin/accounts')
  const mensaje =
    marcadas.length === 1 ? `${networkLabel(pendiente.network)} conectado.` : `${marcadas.length} cuentas conectadas.`
  redirect(conMensaje('/admin/accounts', mensaje))
}

export async function updatePostCampaign(
  postId: string,
  campaign: string,
): Promise<{ ok?: boolean; campaign?: string; error?: string }> {
  const { id: ownerId } = await requireUser()

  const clean = normalizeCampaignTag(campaign)
  if (!clean) return { error: 'La etiqueta no puede quedar vacía.' }

  try {
    await getDb()
      .update(socialPosts)
      .set({ campaign: clean })
      .where(and(eq(socialPosts.id, postId), eq(socialPosts.ownerId, ownerId)))
  } catch (error) {
    // Deferred with syncAll's rationale: isCampaignUniqueViolation lives in sync.ts,
    // which pulls in the connector tree, and that weight has no reason to load just to
    // save a campaign tag.
    const { isCampaignUniqueViolation } = await import('@/lib/social/sync')
    if (isCampaignUniqueViolation(error)) {
      // The unique index is what rejects it; two posts sharing a tag would merge histories.
      return { error: 'Otra pieza de contenido ya usa esa etiqueta.' }
    }
    return { error: 'No se pudo guardar. Intenta de nuevo.' }
  }

  revalidatePath('/admin/analytics/publicaciones')
  revalidatePath('/admin/analytics')
  // Return the normalised value: the caller's typed text and what actually got
  // stored can differ (spaces become hyphens, etc), and the copy button must hand
  // out a link with the tag the database actually holds.
  return { ok: true, campaign: clean }
}

/* ---------------------------------------------------------- scheduling -- */

/**
 * Lo que el bloque de TikTok del compositor necesita al abrirse: nombre, avatar y qué
 * privacidades puede elegir el dueño hoy. Por la cuenta que se le pide, no por «la»
 * cuenta de TikTok: con dos conectadas, las privacidades permitidas pueden diferir.
 */
export async function leerCreadorTikTok(accountId: string): Promise<{ creador: CreadorTikTok } | { error: string }> {
  const { id: ownerId } = await requireUser()
  const [account] = await getDb()
    .select()
    .from(socialAccounts)
    .where(and(eq(socialAccounts.id, accountId), eq(socialAccounts.ownerId, ownerId)))
  // Sin esto, el identificador de una cuenta propia de otra red pasa el filtro del dueño
  // y `ensureCredential` manda su token a la API de TikTok igual.
  if (!account || account.network !== 'tiktok') return { error: TIKTOK_SIN_CUENTA }
  const token = await tiktokConnector.ensureCredential(account)
  if (!token) return { error: TIKTOK_SIN_CUENTA }
  return consultarCreador(token)
}

/** Los tres campos del bloque de palabra clave, crudos, listos para `validarRegla`. */
/**
 * Palabra vacía = sin regla, aunque el mensaje o la respuesta pública sigan escritos: es
 * la forma de borrar la regla desde el compositor o el editor sin tener que vaciar los
 * tres campos. `undefined` es lo que `validarRegla` lee como «sin regla».
 */
function reglaDesdeFormulario(formData: FormData): unknown {
  const palabra = String(formData.get('reglaPalabra') ?? '')
  if (palabra.trim().length === 0) return undefined
  return {
    palabra,
    mensaje: String(formData.get('reglaMensaje') ?? ''),
    respuestaPublica: String(formData.get('reglaRespuesta') ?? ''),
  }
}

/**
 * La media que el navegador ya subió a R2, comprobada.
 *
 * Llega como JSON y no como archivos porque Vercel corta los cuerpos de petición en
 * ~4,5 MB —medido contra producción el 2026-09-23— y un video de tamaño real devolvía
 * `413` sin llegar nunca a esta función. El compositor pide una URL firmada, sube él
 * mismo, y acá solo se verifica. Ver `docs/deuda-tecnica.md`.
 *
 * Se comprueban dos cosas distintas y las dos hacen falta: que la URL sea de nuestro
 * bucket y bajo `scheduled/` —si no, cualquiera podría hacer que un post apunte a donde
 * quiera— y que el objeto exista, porque una URL bien formada no prueba que el PUT del
 * navegador haya terminado.
 */
async function mediaYaSubida(
  crudo: FormDataEntryValue | null,
): Promise<{ lista: MediaMovil[] } | { error: string }> {
  let parsed: unknown
  try {
    parsed = JSON.parse(String(crudo ?? '[]'))
  } catch {
    return { error: CUERPO_ILEGIBLE }
  }

  const lista = parseMediaMovil({ media: parsed })
  if ('error' in lista) return { error: lista.error }

  const base = basePublica()
  for (const m of lista) {
    const key = base ? keyDesdeUrl(base, m.url) : null
    if (!key || !key.startsWith('scheduled/')) return { error: ARCHIVO_AJENO }
  }
  // Que exista, y lo que de verdad pesa: la subida firmada no fija un tamaño.
  for (const m of lista) {
    const bytes = await tamanoEnAlmacen(m.url)
    if (bytes === null) return { error: ARCHIVO_FALTANTE }
    if (bytes > MAX_BYTES_ARCHIVO) return { error: ARCHIVO_MUY_GRANDE }
  }
  return { lista }
}

export async function createScheduledPost(_prev: FormState, formData: FormData): Promise<FormState> {
  const { id: ownerId, zona } = await requireUser()

  const caption = String(formData.get('caption') ?? '').trim()

  // No `elegidas`: taparía la función homónima que este archivo importa de
  // `@/lib/social/pendiente` y ya usa más arriba, en `conectarElegidas`.
  const idsElegidos = formData.getAll('cuentas').map(String)
  if (idsElegidos.length === 0) return { error: 'Elige al menos una cuenta.' }

  let cuentas: CuentaDestino[]
  try {
    cuentas = await verificarCuentas(ownerId, idsElegidos)
  } catch (error) {
    if (error instanceof CuentaInvalida) return { error: error.message }
    throw error
  }

  // `validateScheduleDraft` razona en redes (el vídeo obligatorio de TikTok, los 280 de
  // X): las redes son las de las cuentas elegidas, sin repetir.
  const networks = [...new Set(cuentas.map((c) => c.network))]

  // El botón «Ahora» del compositor no manda una hora, manda esta marca: el reloj del
  // navegador puede ir atrasado y quien decide si algo está en el futuro es este proceso.
  // Un minuto de margen para que la validación no dependa de cuánto tardó el envío.
  const scheduledAt =
    formData.get('cuandoAhora') === 'on'
      ? new Date(Date.now() + 60_000)
      : fromZonedInput(String(formData.get('scheduledAt') ?? ''), zona)
  const subida = await mediaYaSubida(formData.get('mediaSubida'))
  if ('error' in subida) return { error: subida.error }
  const uploaded = subida.lista

  const videoCount = uploaded.filter((m) => m.mediaType === 'video').length
  const error = validateScheduleDraft(
    {
      caption,
      imageCount: uploaded.length - videoCount,
      videoCount,
      networks,
      scheduledAt,
      // `extensionDe` acepta nombre o URL, y la clave termina con el nombre original.
      formats: uploaded.map((m) => extensionDe(m.url)),
    },
    new Date(),
    { proximamente: proximamentePara(ownerId) },
  )
  if (error) return { error }

  // Lo que la red exige por destino. Ya no protege la subida —el navegador subió antes de
  // enviar—, pero sigue evitando que se cree un post que ninguna red aceptaría. Lo que
  // quede huérfano en el bucket lo borra el barrido diario.
  const opcionesCheck = validarOpcionesPorCuenta(cuentas, opcionesDesdeFormularioPorCuenta(formData, cuentas))
  if ('error' in opcionesCheck) return { error: opcionesCheck.error }

  // Un trial reel es un solo video: la opción ya está resuelta por cuenta y los tipos
  // son reales (el navegador subió antes de enviar), así que no hay `sinTipo`.
  const mediaPorOpciones = errorDeMediaPorOpciones(opcionesCheck.opciones, {
    videos: videoCount,
    fotos: uploaded.length - videoCount,
    sinTipo: 0,
  })
  if (mediaPorOpciones) return { error: mediaPorOpciones }

  const reglaCheck = validarRegla(reglaDesdeFormulario(formData))
  if ('error' in reglaCheck) return { error: reglaCheck.error }

  const historia = errorDeHistoria(opcionesCheck.opciones, {
    caption,
    conPalabraClave: reglaCheck.regla !== null,
    aInstagram: networks.includes('instagram'),
    fotos: uploaded.filter((m) => m.mediaType !== 'video').map((m) => extensionDe(m.url)),
  })
  if (historia) return { error: historia }

  // Si salió de un borrador, el borrador se consume en la misma transacción que crea el post
  // (`crearPostProgramado`): si ya no estaba —se programó en otra pestaña o en el teléfono, o
  // se descartó—, no sale un segundo post, y si crear falla, el borrador sigue.
  let id: string
  try {
    id = await crearPostProgramado(ownerId, {
      caption,
      scheduledAt: scheduledAt!,
      media: uploaded,
      cuentas,
      opciones: opcionesCheck.opciones,
      regla: reglaCheck.regla,
      borradorId: idDeBorrador(formData.get('borradorId')),
      // Solo lo dibuja el compositor de un borrador del mesón; vacío también cuenta: sin título.
      tituloYoutube: formData.has('tituloYoutube') ? String(formData.get('tituloYoutube')).trim().slice(0, 100) : undefined,
    })
  } catch (error) {
    if (error instanceof BorradorConsumido) return { error: BORRADOR_NO_EXISTE }
    if (error instanceof CreativoNoEsta) return { error: CREATIVO_NO_ESTA }
    throw error
  }

  // «Música de TikTok» queda recordada por cuenta: el interruptor nace así la próxima vez que
  // se programen fotos ahí. Después de crear y fuera de la transacción a propósito: si esto
  // falla, el post ya quedó programado y solo se pierde el recuerdo, así que no se le dice a
  // la persona que algo salió mal.
  try {
    for (const { cuentaId, musica } of musicaParaRecordar(opcionesCheck.opciones, {
      videos: videoCount,
      fotos: uploaded.length - videoCount,
    })) {
      await getDb()
        .update(socialAccounts)
        .set({ tiktokMusica: musica })
        .where(and(eq(socialAccounts.id, cuentaId), eq(socialAccounts.ownerId, ownerId)))
    }
  } catch (error) {
    console.error('Recordar la música de TikTok:', String(error).slice(0, 300))
  }

  revalidatePath('/admin/schedule')
  return { ok: true, id }
}

/* -------------------------------------------------------------- borradores -- */

export type BorradorGuardado = { id?: string; perdido?: boolean; error?: string }

/**
 * Lo que el compositor manda mientras se escribe, cada vez que se detiene un momento. Sin
 * `revalidatePath` a propósito: corre a cada pausa, y repintar la parrilla entera en cada
 * una no le sirve a nadie. La parrilla se pone al día al cerrar el panel, que navega.
 *
 * La media se revisa como en `mediaYaSubida` salvo por la existencia de cada archivo: un
 * HEAD por archivo en cada pausa es caro, y al programar se comprueba igual.
 */
export async function guardarBorradorAccion(formData: FormData): Promise<BorradorGuardado> {
  const { id: ownerId, zona } = await requireUser()

  let crudo: unknown
  try {
    crudo = JSON.parse(String(formData.get('mediaSubida') ?? '[]'))
  } catch {
    return { error: CUERPO_ILEGIBLE }
  }
  const lista = parseMediaMovil({ media: crudo })
  if ('error' in lista) return { error: lista.error }
  const base = basePublica()
  for (const m of lista) {
    const key = base ? keyDesdeUrl(base, m.url) : null
    if (!key || !key.startsWith('scheduled/')) return { error: ARCHIVO_AJENO }
  }
  const nombres = Array.isArray(crudo) ? crudo : []
  const media: MediaDeBorrador[] = lista.map((m, i) => {
    const nombre = (nombres[i] as { nombre?: unknown } | undefined)?.nombre
    return { ...m, nombre: typeof nombre === 'string' && nombre !== '' ? nombre : (m.url.split('/').pop() ?? '') }
  })

  const campos = camposDesdeFormulario(formData)
  if (borradorDemasiadoGrande(campos)) return { error: CUERPO_ILEGIBLE }
  // La fecha del calendario sale del mismo campo y en la misma zona que al programar. Con
  // «Ahora» no hay día en que ponerlo: el borrador queda sin fecha.
  const fecha = primero(campos, 'cuandoAhora') === 'on' ? null : fromZonedInput(primero(campos, 'scheduledAt'), zona)

  const resultado = await guardarBorrador(ownerId, {
    id: idDeBorrador(formData.get('borradorId')),
    campos,
    fecha,
    media,
  })
  return 'perdido' in resultado ? { perdido: true } : { id: resultado.id }
}

export async function descartarBorrador(id: string): Promise<{ error?: string }> {
  const { id: ownerId } = await requireUser()
  const borradorId = idDeBorrador(id)
  if (borradorId) await borrarBorrador(ownerId, borradorId)
  revalidatePath('/admin/schedule')
  return {}
}

export async function updateScheduledPost(
  postId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { id: ownerId, zona } = await requireUser()

  // Los archivos nuevos ya subieron directo al almacén desde el navegador; acá llegan sus
  // direcciones (`mediaSubida`), que se revisan como al programar: del almacén, bajo
  // `scheduled/`, y con lo que de verdad pesan (`mediaYaSubida`). Antes el archivo viajaba
  // dentro del formulario, y Vercel corta los cuerpos en ~4,5 MB.
  const subida = await mediaYaSubida(formData.get('mediaSubida'))
  if ('error' in subida) return { error: subida.error }

  const atributosRaw = String(formData.get('atributos') ?? '').trim()
  let atributos: Atributos | null = null
  if (atributosRaw) {
    let parsed: unknown
    try {
      parsed = JSON.parse(atributosRaw)
    } catch {
      return { error: ATRIBUTOS_ERROR }
    }
    const check = validateAtributos(parsed)
    if ('error' in check) return { error: check.error }
    atributos = check.atributos
  }

  // La regla —qué se puede cambiar, cuándo, y cómo se escribe sin pisar un intento en curso—
  // vive en `editarPostProgramado`, compartida con la app del teléfono.
  const resultado = await editarPostProgramado(ownerId, postId, {
    caption: String(formData.get('caption') ?? '').trim(),
    scheduledAt: fromZonedInput(String(formData.get('scheduledAt') ?? ''), zona),
    cuentas: formData.getAll('cuentas').map(String),
    media: {
      kept: formData.getAll('keptMedia').map(String),
      nuevos: subida.lista,
      urls: String(formData.get('mediaUrls') ?? '')
        .split(/\r?\n/)
        .map((u) => u.trim())
        .filter(Boolean),
    },
    portada: {
      conservar: String(formData.get('keepPortada') ?? '').trim(),
      nueva: String(formData.get('portadaUrl') ?? '').trim(),
    },
    atributos,
    regla: { cruda: reglaDesdeFormulario(formData) },
  })
  if ('error' in resultado) return { error: resultado.error }

  revalidatePath('/admin/schedule')

  // Solo las vistas propias valen como vuelta (`volverDelEditor`); un formulario armado a
  // mano cae en la parrilla pelada.
  redirect(volverDelEditor(formData.get('volver')))
}

export async function rescheduleTarget(targetId: string, localDatetime: string): Promise<FormState> {
  const { id: ownerId, zona } = await requireUser()

  // La hora llega del formulario en pantalla, que la escribió en la zona del dueño.
  const scheduledAt = fromZonedInput(localDatetime, zona)
  if (!scheduledAt || scheduledAt.getTime() <= Date.now()) {
    return { error: REPROGRAMAR_PASADO }
  }

  // La regla, compartida con la app del teléfono, vive en `reprogramarDestino`.
  if ((await reprogramarDestino(ownerId, targetId, scheduledAt)) === 'no-existe') {
    return { error: DESTINO_NO_EXISTE }
  }

  // «Se quemó», arriba del calendario, muestra los mismos destinos con el mismo botón: sin
  // esto, la fila que se acaba de arreglar sigue pidiendo una acción que ya se hizo.
  revalidatePath('/admin/schedule')
  return { ok: true }
}

/**
 * «Archivar» un destino quemado: deja de salir en «Se quemó», en el resumen y en el correo del
 * día, y se queda con su error y sus intentos. «Desarchivar» lo devuelve. La regla, la misma de
 * `POST /api/schedule/posts/{id}/archivar`, vive en `archivarQuemados`.
 */
export async function archivarDestinoQuemado(targetId: string): Promise<FormState> {
  return cambiarArchivo(targetId, true)
}

export async function desarchivarDestinoQuemado(targetId: string): Promise<FormState> {
  return cambiarArchivo(targetId, false)
}

async function cambiarArchivo(targetId: string, archivar: boolean): Promise<FormState> {
  const { id: ownerId } = await requireUser()
  const resultado = await archivarDestino(ownerId, targetId, archivar)
  if ('falla' in resultado) {
    return { error: resultado.falla === 'no-existe' ? DESTINO_NO_EXISTE : FRASE_DE_FALLA[resultado.falla] }
  }
  // «Se quemó» vive arriba del calendario, y el editor del post muestra el mismo destino.
  revalidatePath('/admin/schedule')
  revalidatePath(`/admin/schedule/${resultado.postId}`)
  return { ok: true }
}

export async function deleteScheduledPost(postId: string): Promise<FormState> {
  const { id: ownerId } = await requireUser()
  // La regla —no borrar lo que ya salió— vive en `borrarPostProgramado`, compartida con
  // `DELETE /api/schedule/posts/{id}` para que el panel y la API no puedan divergir.
  const resultado = await borrarPostProgramado(ownerId, postId)
  if (resultado === 'publicado') return { error: BORRADO_YA_PUBLICADO }
  if (resultado === 'no-existe') return { error: POST_NO_EXISTE }
  revalidatePath('/admin/schedule')
  return { ok: true }
}

/**
 * «Subir ahora»: publica este post sin esperar la corrida del cron.
 *
 * Corre la misma función del cron acotada a este post en vez de un camino propio, y eso es
 * lo importante: así respeta las opciones guardadas de cada destino —la privacidad de
 * TikTok, las interacciones, el contenido comercial— y hereda el reclamo de fila que evita
 * publicar dos veces si el cron entra a la vez.
 */
export async function subirAhora(postId: string): Promise<{ error?: string; ok?: string }> {
  const { id: ownerId } = await requireUser()
  const db = getDb()
  const [post] = await db
    .select({ id: scheduledPosts.id })
    .from(scheduledPosts)
    .where(and(eq(scheduledPosts.id, postId), eq(scheduledPosts.ownerId, ownerId)))
  if (!post) return { error: 'El post ya no existe.' }

  const ahora = new Date()
  // La hora pasa a ahora: dejarla en el futuro mostraría una fecha que ya no describe nada,
  // y un reintento posterior del cron no vería el destino como vencido.
  await db
    .update(scheduledPosts)
    .set({ scheduledAt: ahora, updatedAt: ahora })
    .where(eq(scheduledPosts.id, post.id))

  // Lo que falló vuelve a pendiente: pulsar «Subir ahora» sobre algo que no salió es justo
  // cuando más se quiere reintentar, y mandar al dueño a reprogramar con fecha y hora sería
  // un rodeo. Los intentos se reinician porque esto es una decisión suya, no un reintento
  // automático más. Lo ya publicado no se toca: republicar no es lo que pidió. El contenedor
  // se queda (`REARME`): si el intento anterior sí salió, el siguiente lo descubre.
  await db
    .update(scheduledPostTargets)
    .set({ ...REARME, updatedAt: ahora })
    .where(and(eq(scheduledPostTargets.postId, post.id), eq(scheduledPostTargets.status, 'failed')))

  const { publishDue } = await import('@/lib/social/publish/run')
  const report = await publishDue(ahora, post.id)
  revalidatePath('/admin/schedule')
  return { ok: resumenDeSubida(report) }
}

/** Lo que el calendario dice tras «Subir ahora». Sin nada pendiente lo dice, en vez de callar. */
function resumenDeSubida(report: {
  published: number
  processing: number
  retried: number
  deferred: number
  failed: number
}): string {
  const partes: string[] = []
  if (report.published > 0) partes.push(`${report.published} publicado${report.published === 1 ? '' : 's'}`)
  if (report.processing > 0) partes.push(`${report.processing} en proceso`)
  if (report.deferred > 0) partes.push(`${report.deferred} en espera de la red`)
  if (report.retried > 0) partes.push(`${report.retried} para reintentar`)
  if (report.failed > 0) partes.push(`${report.failed} con error`)
  return partes.length === 0 ? 'Este post no tenía destinos pendientes.' : `${partes.join(', ')}.`
}

/* ---------------------------------------------------------- batch upload -- */

export type BatchRow = { fila: number; ok: boolean; detalle: string }
export type BatchState = { error?: string; filas?: BatchRow[] }

export async function uploadBatch(_prev: BatchState, formData: FormData): Promise<BatchState> {
  const { id: ownerId } = await requireUser()

  const file = formData.get('archivo')
  if (!(file instanceof File) || file.size === 0) return { error: 'Adjunta un archivo CSV.' }

  const parsed = csvToBatchItems(await file.text())
  if ('error' in parsed) return { error: parsed.error }
  if (parsed.items.length === 0) return { error: 'El CSV no trae filas de posts.' }
  if (parsed.items.length > MAX_BATCH_ITEMS) {
    return { error: `Máximo ${MAX_BATCH_ITEMS} posts por lote.` }
  }

  const resultados = await scheduleBatch(ownerId, parsed.items)
  revalidatePath('/admin/schedule')
  return {
    // +2: la fila 1 del archivo es el encabezado, y la gente cuenta desde 1.
    filas: resultados.map((r) => ({
      fila: r.index + 2,
      ok: r.ok,
      detalle: r.ok ? 'Programado' : r.error,
    })),
  }
}

/* -------------------------------------------------------- comentarios -- */

export async function responderComentario(id: string, texto: string): Promise<FormState> {
  const { id: ownerId } = await requireUser()
  // Diferido: el módulo carga los conectores de cada red solo cuando alguien de verdad
  // aprieta «Enviar».
  const { responderComentario: responder } = await import('@/lib/social/comentarios/responder')
  const resultado = await responder(ownerId, id, texto)
  revalidatePath('/admin/comments')
  return 'error' in resultado ? { error: resultado.error } : { ok: true }
}

export async function descartarComentario(id: string): Promise<FormState> {
  const { id: ownerId } = await requireUser()
  const { descartarComentario: descartar } = await import('@/lib/social/comentarios/responder')
  await descartar(ownerId, id)
  revalidatePath('/admin/comments')
  return { ok: true }
}

export async function reintentarBorrador(id: string): Promise<FormState> {
  const { id: ownerId } = await requireUser()
  const { redactarUno } = await import('@/lib/social/comentarios/redaccion')
  const resultado = await redactarUno(ownerId, id)
  revalidatePath('/admin/comments')
  return 'error' in resultado ? { error: resultado.error } : { ok: true }
}

/** «Regenerar todos», en las instrucciones de La Mesa. */
export async function regenerarBorradoresComentarios(): Promise<
  { regenerados: number; fallidos: number; quedan: number } | { error: string }
> {
  const { id: ownerId } = await requireUser()
  const { regenerarBorradores } = await import('@/lib/social/comentarios/redaccion')
  const resultado = await regenerarBorradores(ownerId)
  revalidatePath('/admin/comments')
  return resultado
}

export async function guardarInstruccionesComentarios(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { id: ownerId } = await requireUser()
  const { CLAVE_INSTRUCCIONES, normalizarInstrucciones } = await import(
    '@/lib/social/comentarios/instrucciones'
  )
  const { guardarAjuste } = await import('@/lib/ajustes')
  const bruto = String(formData.get('instrucciones') ?? '')
  await guardarAjuste(ownerId, CLAVE_INSTRUCCIONES, normalizarInstrucciones(bruto))
  revalidatePath('/admin/comments')
  return { ok: true }
}

/* --- usuarios -- */

export async function invitarUsuario(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin()
  let resultado: Awaited<ReturnType<typeof invitar>>
  try {
    resultado = await invitar(String(formData.get('correo') ?? ''), String(formData.get('nombre') ?? '') || null)
  } catch (error) {
    // `invitar()` lanza cuando el usuario se creó pero su página no —ya compensado
    // borrando la fila—, para que ese fallo no quede escondido detrás de un `{ error }`
    // normal. Acá se atrapa igual, con un mensaje que le sirve a quien invita, sin
    // filtrar el detalle técnico.
    console.error('invitarUsuario:', error)
    return { error: 'No se pudo invitar: la página del usuario no se pudo crear. Intenta de nuevo.' }
  }
  if ('error' in resultado) return { error: resultado.error }
  // El primer código sale con la invitación: el invitado entra sin pedir nada.
  const enviado = await pedir(resultado.usuario.correo)
  revalidatePath('/admin/usuarios')
  if (!enviado) return { ok: true, aviso: 'Invitado, pero el correo no salió: revisa Resend.' }
  return { ok: true }
}

export async function quitarUsuario(id: string): Promise<{ error?: string }> {
  await requireAdmin()
  const resultado = await quitar(id)
  revalidatePath('/admin/usuarios')
  return 'error' in resultado ? { error: resultado.error } : {}
}

export async function cerrarSesionesUsuario(id: string): Promise<{ error?: string }> {
  await requireAdmin()
  await cerrarSesiones(id)
  revalidatePath('/admin/usuarios')
  return {}
}

/**
 * Le enciende o le apaga La Cocina a alguien, desde Los Maestros. Apagarla es despedir al chef:
 * deja de ver sus comandas, aunque ellas siguen ahí. Solo el admin.
 */
export async function encenderCocina(id: string, encender: boolean): Promise<{ error?: string }> {
  await requireAdmin()
  if (!esUuid(id) || !(await encenderCocinaDe(id, encender, new Date()))) return { error: 'Esa persona ya no está en Los Maestros.' }
  revalidatePath('/admin/usuarios')
  revalidatePath('/admin/ia')
  return {}
}

/**
 * Le cambia a alguien la cuota de la cámara de frío de La Cocina, desde Los Maestros: en GB, y
 * vacía vuelve a la de siempre (20 GB). Solo el admin. Lo que ya está guardado no se borra aunque
 * la cuota baje: deja de poder guardar más hasta que haga espacio.
 */
export async function cambiarCuotaDeLaCamaraAccion(id: string, gigas: string): Promise<{ error?: string }> {
  await requireAdmin()
  const bytes = leerCuotaEnGb(gigas)
  if (bytes !== null && typeof bytes === 'object') return { error: bytes.error }
  if (!esUuid(id) || !(await cambiarCuotaDeLaCamara(id, bytes))) return { error: 'Esa persona ya no está en Los Maestros.' }
  revalidatePath('/admin/usuarios')
  revalidatePath('/admin/ia/bodega')
  return {}
}

/**
 * Le cambia el dueño a una cuenta, con lo que se bajó de ella, desde Los Maestros. Cruza dueños a
 * propósito y por eso solo la llama el admin: ver `traspasarCuenta`.
 */
export async function traspasarCuentaAccion(
  cuentaId: string,
  destinoId: string,
): Promise<{ error: string } | { nombre: string; correo: string }> {
  await requireAdmin()
  const resultado = await traspasarCuenta(cuentaId, destinoId)
  if ('error' in resultado) return resultado
  for (const ruta of ['/admin/usuarios', '/admin/accounts', '/admin/schedule', '/admin/comments', '/admin/analytics']) {
    revalidatePath(ruta)
  }
  return resultado
}

/* ------------------------------------------------------------------ cuenta -- */

/**
 * «Tu Cuenta»: el nombre con que aparece y la zona horaria en que vive.
 *
 * Escribe su propia fila de `users`, así que el filtro por dueño acá es `users.id` y no un
 * `owner_id`: el id sale de la sesión (`requireUser`), nunca del formulario. La zona se
 * valida contra `Intl` antes de escribir, porque un `<select>` se edita en el navegador.
 *
 * `(prev, formData)` es la firma que pide `useActionState`, y por eso la llevan todas las
 * acciones de formulario del panel: pasada así, directa y sin envolver en una función del
 * cliente, React puede plantar los campos ocultos que hacen que el formulario siga
 * guardando sin JavaScript.
 */
export async function guardarCuenta(_prev: FormState, formData: FormData): Promise<FormState> {
  const usuario = await requireUser()
  const nombre = String(formData.get('nombre') ?? '').trim() || null
  const zona = String(formData.get('zona') ?? '')
  if (!esZonaValida(zona)) return { error: ZONA_INVALIDA }

  await getDb().update(users).set({ nombre, zona }).where(eq(users.id, usuario.id))

  // La hora que se ve bajo el selector se calcula en el servidor: sin revalidar esta
  // pantalla seguiría mostrando la de la zona vieja. `/admin` va también porque la zona es
  // de todo el panel, no de esta pantalla.
  revalidatePath('/admin')
  revalidatePath('/admin/cuenta')
  return { ok: true }
}

/**
 * El modo del panel, en la cuenta: lo llama el botón del modo (`boton-tema.tsx`) después de
 * cambiar el dibujo en el momento, y vale también en la app del teléfono. Escribe su propia
 * fila de `users`, como `guardarCuenta`, con el id de la sesión. Lo que llega se valida: una
 * acción del servidor se puede llamar con cualquier cosa, y lo que no es el día es la noche.
 *
 * No toca la cookie del equipo ni revalida nada: el botón ya escribió la cookie y el dibujo, y
 * una cookie escrita acá haría que Next volviera a dibujar la página entera.
 */
export async function guardarTema(tema: Tema): Promise<void> {
  const usuario = await requireUser()
  await getDb()
    .update(users)
    .set({ tema: temaDe(typeof tema === 'string' ? tema : null) })
    .where(eq(users.id, usuario.id))
}

/* ------------------------------------------------------------ llaves de API -- */

export type LlaveState = { error?: string; llave?: string; nombre?: string }

/**
 * Genera una llave a nombre de quien está en la sesión. La llave completa viaja de vuelta
 * en el estado del formulario y es la única vez que se ve: la pantalla la muestra para
 * copiarla, y al recargar ya no está —en la tabla vive solo su hash—.
 */
export async function generarLlaveApi(_prev: LlaveState, formData: FormData): Promise<LlaveState> {
  const { id: ownerId } = await requireUser()
  const nombre = String(formData.get('nombre') ?? '')
  const resultado = await crearLlave(ownerId, nombre)
  if ('error' in resultado) return { error: resultado.error }
  revalidatePath('/admin/ia')
  return { llave: resultado.llave, nombre: nombre.trim() }
}

export async function revocarLlaveApi(id: string): Promise<{ error?: string }> {
  const { id: ownerId } = await requireUser()
  await revocarLlave(ownerId, id)
  revalidatePath('/admin/ia')
  return {}
}
