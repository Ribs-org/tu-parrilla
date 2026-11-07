// Las piezas puras de los borradores del compositor: qué se guarda de un formulario, cuándo
// hay algo que valga la pena guardar, y cómo se lee de vuelta cada campo para volver a
// llenar el formulario. Sin base ni `server-only`: lo usan el compositor (navegador), la
// acción que guarda y los tests.
import { addDays, dayKey } from './schedule-week'
import { musicaDe, musicaDesdeCampo, type MusicaInstagram } from './social/publish/opciones'
import { esUuid } from './uuid'

/** Los valores de un formulario, nombre por nombre, tal como los entrega `FormData.getAll`. */
export type Campos = Record<string, string[]>

/**
 * Los campos que no son del post sino del transporte: la media va aparte (en su tabla, por
 * el barrido de huérfanos), el id del borrador es la llave misma, y React planta los suyos
 * con `$` adelante cuando una acción va directa a un `<form>`.
 */
const INTERNOS = new Set(['mediaSubida', 'borradorId'])

/**
 * Lo más que ocupan los campos de un borrador, escritos como JSON. Un formulario de verdad
 * queda muy por debajo —el texto de un post no pasa de unos miles de caracteres—; esto es
 * para un cuerpo armado a mano, que sin tope guardaba lo que quisiera en la base.
 */
export const MAX_CAMPOS_BORRADOR = 100_000

/** Si los campos de un borrador pasan de `MAX_CAMPOS_BORRADOR`. */
export function borradorDemasiadoGrande(campos: Campos): boolean {
  return JSON.stringify(campos).length > MAX_CAMPOS_BORRADOR
}

/** Todo lo que el formulario dice, menos archivos y campos de transporte. */
export function camposDesdeFormulario(formData: FormData): Campos {
  const campos: Campos = {}
  for (const [nombre, valor] of formData.entries()) {
    if (typeof valor !== 'string' || INTERNOS.has(nombre) || nombre.startsWith('$')) continue
    ;(campos[nombre] ??= []).push(valor)
  }
  return campos
}

/**
 * El id de un borrador tal como llega del navegador, o null si no tiene forma de id. Va
 * antes de cualquier consulta: Postgres rechaza con un error —no con cero filas— un texto
 * que no es uuid en una columna uuid.
 */
export function idDeBorrador(valor: unknown): string | null {
  return esUuid(valor) ? valor : null
}

/** El primer valor de un campo, o cadena vacía. */
export function primero(campos: Campos, nombre: string): string {
  return campos[nombre]?.[0] ?? ''
}

/**
 * Si un formulario tiene algo que guardar. Abrir el compositor y cerrarlo sin escribir no
 * deja un borrador vacío: hace falta texto, un archivo o una palabra clave. Elegir cuentas
 * o una fecha sola no alcanza, porque eso viene puesto solo (la cuenta única, el día en
 * que se hizo clic en el calendario).
 */
export function tieneContenido(campos: Campos, archivos: number): boolean {
  return primero(campos, 'caption').trim() !== '' || archivos > 0 || primero(campos, 'reglaPalabra').trim() !== ''
}

/** Lo que el bloque de TikTok de una cuenta tenía elegido, para volver a mostrarlo. */
export type TikTokInicial = {
  borrador: boolean
  privacidad: string
  comentarios: boolean
  duo: boolean
  pegar: boolean
  comercial: 'no' | 'marca_propia' | 'patrocinado'
  ia: boolean
  /**
   * «Música de TikTok» como quedó, o undefined si el interruptor no estaba a la vista (un video,
   * o sin archivos todavía): entonces manda lo que la cuenta recuerda.
   */
  musica?: boolean
}

export function tiktokInicial(campos: Campos, cuentaId: string): TikTokInicial | null {
  if (!(`tiktokModo:${cuentaId}` in campos)) return null
  const comercial = primero(campos, `tiktokComercial:${cuentaId}`)
  return {
    borrador: primero(campos, `tiktokModo:${cuentaId}`) === 'borrador',
    privacidad: primero(campos, `tiktokPrivacidad:${cuentaId}`),
    comentarios: primero(campos, `tiktokComentarios:${cuentaId}`) === 'on',
    duo: primero(campos, `tiktokDuo:${cuentaId}`) === 'on',
    pegar: primero(campos, `tiktokPegar:${cuentaId}`) === 'on',
    comercial: comercial === 'marca_propia' || comercial === 'patrocinado' ? comercial : 'no',
    ia: primero(campos, `tiktokIA:${cuentaId}`) === 'on',
    ...(`tiktokMusica:${cuentaId}` in campos ? { musica: primero(campos, `tiktokMusica:${cuentaId}`) === 'on' } : {}),
  }
}

/** Si el reel de esa cuenta de Instagram iba como trial reel. */
export function instagramTrialInicial(campos: Campos, cuentaId: string): boolean {
  return primero(campos, `instagramTrial:${cuentaId}`) === 'on'
}

/**
 * La canción de «Música de Instagram» de esa cuenta, o null si no tenía (o si lo guardado ya
 * no se entiende: entonces el bloque nace sin canción, en vez de mandar algo que se rechazaría).
 */
export function instagramMusicaInicial(campos: Campos, cuentaId: string): MusicaInstagram | null {
  return musicaDe('instagram', { musica: musicaDesdeCampo(primero(campos, `${MUSICA}${cuentaId}`)) })
}

/** La regla de palabra clave guardada, o null si no tenía palabra. */
export function reglaInicial(campos: Campos): { palabra: string; mensaje: string; respuestaPublica: string } | null {
  const palabra = primero(campos, 'reglaPalabra')
  if (palabra.trim() === '') return null
  return { palabra, mensaje: primero(campos, 'reglaMensaje'), respuestaPublica: primero(campos, 'reglaRespuesta') }
}

/** Las primeras líneas del texto, para la lista de borradores y el calendario. */
export function textoDe(campos: Campos): string {
  return primero(campos, 'caption').trim()
}

/** La hora con que nace un post creado desde un día del calendario, si no hay otra. */
export const HORA_POR_DEFECTO = '09:00'

/**
 * El valor inicial del campo «Fecha y hora» cuando se programa desde un día del
 * calendario: ese día a las 9, o, si el día es hoy y las 9 ya pasaron, la hora en punto
 * siguiente. Si esa hora ya cae mañana, el día queda sin hora sugerida (vacío) en vez de
 * proponer otro día: se hizo clic en hoy. Un día pasado no tiene fecha que sugerir.
 */
export function fechaParaDia(dia: string, ahora: Date, zona: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dia) || addDays(dia, 0) !== dia) return ''
  const hoy = dayKey(ahora, zona)
  if (dia < hoy) return ''
  if (dia > hoy) return `${dia}T${HORA_POR_DEFECTO}`
  const hora = Number(
    new Intl.DateTimeFormat('en-GB', { timeZone: zona, hour: '2-digit', hour12: false }).format(ahora),
  )
  const siguiente = Math.max(hora + 1, Number(HORA_POR_DEFECTO.slice(0, 2)))
  if (siguiente > 23) return ''
  return `${dia}T${String(siguiente).padStart(2, '0')}:00`
}

/* ------------------------------------------------------------- el teléfono -- */

/**
 * Lo que la app del teléfono sabe editar de un borrador. Es menos que el compositor: no
 * tiene las opciones de TikTok ni la palabra clave, así que esos campos no viajan.
 */
export type BorradorDelTelefono = {
  texto: string
  cuentas: string[]
  /** «YYYY-MM-DDTHH:MM» en la zona del dueño, o vacío si no tiene fecha. */
  scheduledAt: string
  /** Las cuentas de Instagram que van como trial reel. */
  trial: string[]
  /**
   * La canción de «Música de Instagram» de cada cuenta que la lleva. Ausente en una app que
   * todavía no conoce la música (la 1.1.0 antes de su actualización por aire): entonces se
   * conserva la que dejó el panel, porque esa app no pudo haberla quitado.
   */
  musica?: Record<string, MusicaInstagram>
  /**
   * Si es una historia (el selector «Post · Historia» de Publicar). Ausente en una app que
   * todavía no sabe de historias: entonces se conserva lo que el borrador decía.
   */
  historia?: boolean
}

/** Los campos que el teléfono escribe enteros cada vez que guarda. */
const DEL_TELEFONO = new Set(['caption', 'cuentas', 'scheduledAt', 'cuandoAhora'])
const TRIAL = 'instagramTrial:'
const MUSICA = 'instagramMusica:'
/**
 * El campo del modo: `historia`, o ausente si es un post. El compositor del panel todavía no
 * tiene el selector (`docs/pendientes.md`): hasta entonces lo escribe solo el teléfono, y el
 * panel abre ese borrador como un post.
 */
export const MODO = 'modo'

/** Si los campos de un borrador son de una historia. */
export function esBorradorDeHistoria(campos: Campos): boolean {
  return primero(campos, MODO) === 'historia'
}

/**
 * El modo que manda el teléfono al guardar: `modo: 'historia'` o `modo: 'post'`. Sin `modo`
 * —una app que todavía no sabe de historias— es undefined, y se conserva el del borrador.
 */
export function historiaDelTelefono(body: unknown): boolean | undefined {
  const modo = (body as { modo?: unknown } | null)?.modo
  return modo === 'historia' ? true : modo === 'post' ? false : undefined
}

/**
 * Programar como post un borrador que es una historia: lo manda una app que todavía no sabe de
 * historias, que lo muestra como post. Saldría un carrusel en vez de las historias que se armaron.
 */
export const BORRADOR_ES_HISTORIA =
  'Este borrador es una historia, y esta versión de la app todavía no las programa: ábrela de nuevo con señal para que se actualice.'

/**
 * Los campos de un borrador después de que el teléfono lo guarda. El teléfono escribe lo
 * suyo y todo lo demás queda como lo dejó el panel: las opciones de TikTok, la palabra
 * clave. Así un borrador que empezó en el panel no pierde nada por tocarlo en el teléfono.
 *
 * `ajenas` son las cuentas que el teléfono no puede mostrar (hoy, las de TikTok), con el
 * nombre de su red: no las ve, así que no puede haberlas desmarcado, y se conservan entre
 * las elegidas.
 */
export function camposDesdeTelefono(
  anteriores: Campos | null,
  telefono: BorradorDelTelefono,
  ajenas: ReadonlyMap<string, string>,
): Campos {
  const campos: Campos = {}
  for (const [nombre, valores] of Object.entries(anteriores ?? {})) {
    if (DEL_TELEFONO.has(nombre) || nombre.startsWith(TRIAL)) continue
    if (telefono.musica !== undefined && nombre.startsWith(MUSICA)) continue
    if (telefono.historia !== undefined && nombre === MODO) continue
    campos[nombre] = valores
  }
  if (telefono.historia) campos[MODO] = ['historia']
  const conservadas = (anteriores?.cuentas ?? []).filter((id) => ajenas.has(id))
  const cuentas = [...new Set([...telefono.cuentas, ...conservadas])]
  campos.caption = [telefono.texto]
  campos.cuentas = cuentas
  campos.scheduledAt = [telefono.scheduledAt]
  for (const id of telefono.trial) if (cuentas.includes(id)) campos[`${TRIAL}${id}`] = ['on']
  for (const [id, musica] of Object.entries(telefono.musica ?? {})) {
    if (cuentas.includes(id)) campos[`${MUSICA}${id}`] = [JSON.stringify(musica)]
  }
  return campos
}

/**
 * La «Música de Instagram» que manda el teléfono al guardar un borrador, o undefined si la app
 * no sabe de música. Una app que sí sabe manda `conMusica: true` aunque no lleve ninguna —así
 * quitar la canción en el teléfono la quita—; la 1.1.0 antes de su actualización por aire no lo
 * manda, y entonces se conserva la que dejó el panel (`camposDesdeTelefono`). Solo cuentas
 * elegidas y canciones que pasan la validación de Instagram.
 */
export function musicaDelTelefono(
  body: unknown,
  opciones: Record<string, unknown>,
  cuentas: readonly string[],
): Record<string, MusicaInstagram> | undefined {
  if ((body as { conMusica?: unknown } | null)?.conMusica !== true) return undefined
  const salida: Record<string, MusicaInstagram> = {}
  for (const [id, o] of Object.entries(opciones)) {
    const musica = cuentas.includes(id) ? musicaDe('instagram', o) : null
    if (musica) salida[id] = musica
  }
  return salida
}

/**
 * Las `opciones` con que el teléfono programa un borrador, con la «Música de Instagram» que el
 * borrador guardaba si la app no sabe de música (sin `conMusica`, la 1.1.0 antes de su
 * actualización por aire): esa app no la ve, así que no pudo haberla quitado, y sin esto el post
 * salía sin la canción que se eligió en el panel. Una app que sabe de música manda las suyas tal
 * cual, también cuando la quitó.
 */
export function opcionesConMusicaDelBorrador(
  body: unknown,
  opciones: Record<string, unknown>,
  campos: Campos | null,
): Record<string, unknown> {
  if (!campos || (body as { conMusica?: unknown } | null)?.conMusica === true) return opciones
  const salida: Record<string, unknown> = { ...opciones }
  for (const id of campos.cuentas ?? []) {
    const musica = instagramMusicaInicial(campos, id)
    if (!musica) continue
    const propias = salida[id]
    salida[id] = { ...(typeof propias === 'object' && propias !== null ? propias : {}), musica }
  }
  return salida
}

/** Lo que el teléfono necesita de los campos de un borrador para volver a llenar Publicar. */
export function telefonoDesdeCampos(campos: Campos): Omit<BorradorDelTelefono, 'scheduledAt'> {
  const cuentas = campos.cuentas ?? []
  return {
    texto: primero(campos, 'caption'),
    cuentas,
    historia: esBorradorDeHistoria(campos),
    trial: cuentas.filter((id) => instagramTrialInicial(campos, id)),
    musica: Object.fromEntries(
      cuentas.flatMap((id) => {
        const musica = instagramMusicaInicial(campos, id)
        return musica ? [[id, musica] as const] : []
      }),
    ),
  }
}

/**
 * Por qué un borrador no se puede programar desde el teléfono, o null si se puede. Va a
 * alguna cuenta que el teléfono no publica (`ajenas`, con el nombre de su red), o tiene
 * una palabra clave, que el teléfono no muestra. Programarlo desde ahí dejaría eso fuera
 * sin que nadie lo viera, y el borrador —que lo guardaba— se borraría al programar.
 */
export function soloEnElPanel(campos: Campos, ajenas: ReadonlyMap<string, string>): string | null {
  const partes: string[] = []
  const redes = [...new Set((campos.cuentas ?? []).flatMap((id) => (ajenas.has(id) ? [ajenas.get(id)!] : [])))]
  if (redes.length > 0) partes.push(`va también a ${redes.join(' y ')}`)
  const regla = reglaInicial(campos)
  if (regla) partes.push(`tiene la palabra clave «${regla.palabra.trim()}»`)
  return partes.length > 0 ? `Este borrador ${partes.join(' y ')}: eso se programa en el panel web.` : null
}
