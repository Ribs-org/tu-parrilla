// Las piezas puras de los borradores del compositor: qué se guarda de un formulario, cuándo
// hay algo que valga la pena guardar, y cómo se lee de vuelta cada campo para volver a
// llenar el formulario. Sin base ni `server-only`: lo usan el compositor (navegador), la
// acción que guarda y los tests.
import { addDays, dayKey } from './schedule-week'
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
  }
}

/** Si el reel de esa cuenta de Instagram iba como trial reel. */
export function instagramTrialInicial(campos: Campos, cuentaId: string): boolean {
  return primero(campos, `instagramTrial:${cuentaId}`) === 'on'
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
}

/** Los campos que el teléfono escribe enteros cada vez que guarda. */
const DEL_TELEFONO = new Set(['caption', 'cuentas', 'scheduledAt', 'cuandoAhora'])
const TRIAL = 'instagramTrial:'

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
    if (!DEL_TELEFONO.has(nombre) && !nombre.startsWith(TRIAL)) campos[nombre] = valores
  }
  const conservadas = (anteriores?.cuentas ?? []).filter((id) => ajenas.has(id))
  const cuentas = [...new Set([...telefono.cuentas, ...conservadas])]
  campos.caption = [telefono.texto]
  campos.cuentas = cuentas
  campos.scheduledAt = [telefono.scheduledAt]
  for (const id of telefono.trial) if (cuentas.includes(id)) campos[`${TRIAL}${id}`] = ['on']
  return campos
}

/** Lo que el teléfono necesita de los campos de un borrador para volver a llenar Publicar. */
export function telefonoDesdeCampos(campos: Campos): Omit<BorradorDelTelefono, 'scheduledAt'> {
  const cuentas = campos.cuentas ?? []
  return {
    texto: primero(campos, 'caption'),
    cuentas,
    trial: cuentas.filter((id) => instagramTrialInicial(campos, id)),
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
