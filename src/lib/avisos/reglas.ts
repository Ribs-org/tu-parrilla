// Las reglas de los avisos: cuándo una cuenta está caída, qué entra en el resumen del día
// y cómo se escribe cada correo. Puro a propósito —la base y el envío viven en `./run.ts`—
// para que la API (`GET /api/schedule/resumen`), el correo y los tests lean lo mismo.
import { isoInZone } from '@/lib/metrics-api'
import { networkLabel } from '@/lib/networks'
import { estadoDelFierro, seRenuevaSola, type Fierro } from '@/lib/parrilla'
import type { Tema } from '@/lib/tema'
import { MESON, SE_QUEMO, nombreDe } from '@/lib/vocabulario'

/** Debajo de cuántos días programados una cuenta entra en el resumen por quedarse sin parrilla. */
export const DIAS_DE_PISTA = 3
/** Cuántas horas hacia atrás mira el resumen los destinos que se quemaron: un día, lo que separa un resumen del siguiente. */
export const HORAS_DE_FALLIDOS = 24
/**
 * Una cuenta está en uso si tuvo algo programado en los últimos treinta días. Las demás no
 * piden parrilla: una cuenta conectada solo para mirar sus números diría «no tiene nada
 * programado» todos los días, y el aviso se volvería paisaje.
 */
export const DIAS_EN_USO = 30
/** Cuántos destinos quemados nombra el correo; el resto va como «y N más». La API los da todos. */
export const MAX_FALLIDOS_EN_CORREO = 20

export const MAX_DIAS = 30
export const MAX_HORAS = 168
export const DIAS_ERROR = `«dias» tiene que ser un entero de 1 a ${MAX_DIAS}.`
export const HORAS_ERROR = `«horas» tiene que ser un entero de 1 a ${MAX_HORAS}.`

// Lo que dice cada cuenta del resumen. La primera es la misma de su tarjeta en Los Fierros.
export const CONEXION_FALLO = 'La conexión falló; reconecta la cuenta.'
export const CONEXION_VENCIDA = 'La conexión venció; reconecta la cuenta.'
export const CONEXION_POR_VENCER = 'La conexión está por vencer; reconéctala antes.'
// Esta no entra al resumen —desconectar es una decisión del dueño, y no avisa nada—, pero la
// lista de cuentas de la API (`GET /api/schedule/cuentas`) nombra todas, también esas.
export const CONEXION_DESCONECTADA = 'La cuenta está desconectada; reconéctala para programarle.'

const DIA_MS = 86_400_000

/** Una cuenta con lo que hace falta para leer su fierro, sin el token: basta saber si lo hay. */
export type CuentaVigilada = {
  id: string
  network: string
  handle: string | null
  conCredencial: boolean
  expiresAt: Date | null
  lastSyncError: string | null
}

type Riesgo = 'enfriandose' | 'frio'

function fierroDe(c: CuentaVigilada, ahora: Date) {
  return estadoDelFierro(
    { connected: c.conCredencial, expiraEn: c.expiresAt?.toISOString() ?? null, ultimoError: c.lastSyncError, red: c.network },
    ahora,
  )
}

/**
 * «Desconectar» deja la cuenta sin credencial y sin error: es una decisión del dueño, y no
 * avisa nada. Sin credencial pero con el error escrito —una baja desde Facebook— sí es una
 * caída: la cuenta no se fue porque él quisiera.
 */
function desconectadaAProposito(c: Pick<CuentaVigilada, 'conCredencial' | 'lastSyncError'>): boolean {
  return !c.conCredencial && !c.lastSyncError
}

/**
 * Si la conexión de una cuenta se cayó: su fierro está frío —vencida, sin credencial o con
 * la sincronización rota— y no porque el dueño la desconectara. Es la misma lectura que
 * pinta la tarjeta de Los Fierros, así que el correo nunca dice algo que el panel no.
 */
export function estaCaida(c: CuentaVigilada, ahora: Date): boolean {
  return !desconectadaAProposito(c) && fierroDe(c, ahora) === 'frio'
}

export type CuentaEnRiesgo = {
  cuentaId: string
  red: string
  handle: string | null
  fierro: Riesgo
  /** Cuándo vence el permiso; nulo cuando la red lo renueva sola y su fecha no dice nada. */
  vence: Date | null
  motivo: string
}

/**
 * Por qué hay que reconectar una cuenta, según su fierro; nulo si está al rojo. La misma frase
 * en el resumen y en la lista de cuentas de la API, para que las dos no se contradigan.
 */
export function motivoDelFierro(
  c: Pick<CuentaVigilada, 'conCredencial' | 'lastSyncError'>,
  fierro: Fierro,
): string | null {
  if (fierro === 'al-rojo') return null
  if (fierro === 'enfriandose') return CONEXION_POR_VENCER
  if (desconectadaAProposito(c)) return CONEXION_DESCONECTADA
  return c.lastSyncError || !c.conCredencial ? CONEXION_FALLO : CONEXION_VENCIDA
}

/** Las cuentas que hay que reconectar ya (frías) o pronto (enfriándose), sin las desconectadas a propósito. */
export function cuentasEnRiesgo(cuentas: readonly CuentaVigilada[], ahora: Date): CuentaEnRiesgo[] {
  return cuentas.flatMap((c) => {
    if (desconectadaAProposito(c)) return []
    const fierro = fierroDe(c, ahora)
    const motivo = motivoDelFierro(c, fierro)
    if (fierro === 'al-rojo' || motivo === null) return []
    const vence = seRenuevaSola(c.network) ? null : c.expiresAt
    return [{ cuentaId: c.id, red: c.network, handle: c.handle, fierro, vence, motivo }]
  })
}

export type Pista = {
  cuentaId: string
  red: string
  handle: string | null
  /** La hora del último destino de la cuenta que todavía espera salir; nula si no queda ninguno. */
  ultima: Date | null
  /** Días completos de aquí a `ultima`; cero si no queda nada o sale hoy. */
  dias: number
}

/**
 * Las cuentas en uso a las que les queda programado menos de `dias` días, las más cortas
 * primero. `ultimas` trae, por cuenta, la hora del último destino que espera salir; quien
 * llama decide qué cuentas están en uso (`DIAS_EN_USO`).
 */
export function pistaCorta(
  enUso: ReadonlyArray<{ id: string; network: string; handle: string | null }>,
  ultimas: ReadonlyMap<string, Date>,
  ahora: Date,
  dias: number,
): Pista[] {
  return enUso
    .flatMap((c) => {
      const ultima = ultimas.get(c.id) ?? null
      const quedan = ultima ? Math.max(Math.floor((ultima.getTime() - ahora.getTime()) / DIA_MS), 0) : 0
      return quedan < dias ? [{ cuentaId: c.id, red: c.network, handle: c.handle, ultima, dias: quedan }] : []
    })
    .sort((a, b) => a.dias - b.dias || (a.ultima?.getTime() ?? 0) - (b.ultima?.getTime() ?? 0))
}

export type Fallido = {
  postId: string
  /** La hora de salida del post. */
  fecha: Date
  texto: string
  red: string
  cuentaId: string
  handle: string | null
  error: string | null
  intentos: number
}

/**
 * Lo que espera en el mesón de La Cocina y se borra pronto si nadie lo programa, por comanda: cuántos
 * y cuándo vence el primero. Va en el correo y no en `GET /api/schedule/resumen`.
 */
export type PorVencer = { comanda: string | null; cuantos: number; vence: Date }

export type Resumen = { fallidos: Fallido[]; cuentas: CuentaEnRiesgo[]; pista: Pista[]; meson: PorVencer[] }

export function resumenVacio(r: Resumen): boolean {
  return r.fallidos.length === 0 && r.cuentas.length === 0 && r.pista.length === 0 && r.meson.length === 0
}

/** Los parámetros de `GET /api/schedule/resumen`, con sus defaults, o la frase del error. */
export function opcionesDelResumen(
  dias: string | null,
  horas: string | null,
): { dias: number; horas: number } | { error: string } {
  const d = entero(dias, DIAS_DE_PISTA)
  if (d === null || d < 1 || d > MAX_DIAS) return { error: DIAS_ERROR }
  const h = entero(horas, HORAS_DE_FALLIDOS)
  if (h === null || h < 1 || h > MAX_HORAS) return { error: HORAS_ERROR }
  return { dias: d, horas: h }
}

function entero(valor: string | null, porDefecto: number): number | null {
  if (valor === null) return porDefecto
  return /^\d{1,4}$/.test(valor.trim()) ? Number(valor.trim()) : null
}

/** El resumen como lo devuelve la API: horas ISO con el offset de la zona del dueño, como el resto de la API. */
export function resumenParaApi(
  r: Resumen,
  zona: string,
  generado: Date,
  opciones: { dias: number; horas: number },
) {
  return {
    generado: isoInZone(generado, zona),
    horas: opciones.horas,
    dias: opciones.dias,
    fallidos: r.fallidos.map((f) => ({
      postId: f.postId,
      fecha: isoInZone(f.fecha, zona),
      texto: f.texto,
      red: f.red,
      cuentaId: f.cuentaId,
      handle: f.handle,
      error: f.error,
      intentos: f.intentos,
    })),
    cuentas: r.cuentas.map((c) => ({
      cuentaId: c.cuentaId,
      red: c.red,
      handle: c.handle,
      fierro: c.fierro,
      vence: c.vence ? isoInZone(c.vence, zona) : null,
      motivo: c.motivo,
    })),
    pista: r.pista.map((p) => ({
      cuentaId: p.cuentaId,
      red: p.red,
      handle: p.handle,
      ultima: p.ultima ? isoInZone(p.ultima, zona) : null,
      dias: p.dias,
    })),
  }
}

function cuentaLegible(red: string, handle: string | null): string {
  return handle ? `${networkLabel(red)} · ${handle}` : networkLabel(red)
}

/** «vie, 17 oct, 19:00» en la zona del dueño: lo que se lee de una pasada en un correo. */
export function fechaLegible(fecha: Date, zona: string): string {
  return new Intl.DateTimeFormat('es-CL', {
    timeZone: zona,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(fecha)
}

function plural(n: number, uno: string, varios: string): string {
  return `${n} ${n === 1 ? uno : varios}`
}

function extracto(texto: string): string {
  const limpio = texto.replace(/\s+/g, ' ').trim()
  if (!limpio) return '(sin texto)'
  return limpio.length > 60 ? `${limpio.slice(0, 60)}…` : limpio
}

/**
 * El correo de una cuenta caída. `pendientes` son sus destinos que todavía esperan salir:
 * es lo que se pierde si nadie la reconecta, y lo que el correo tiene que decir primero.
 * `sitio` es el origen del panel (`https://tu-parrilla.cl`), o vacío para dejar la ruta sola.
 * Nombra la pantalla como la ve la cuenta (`tema`): de día, Los Cuchillos.
 */
export function correoDeCaida(
  cuenta: { red: string; handle: string | null; vencida: boolean },
  pendientes: number,
  sitio: string,
  tema: Tema = 'noche',
): { subject: string; text: string } {
  const nombre = cuentaLegible(cuenta.red, cuenta.handle)
  const que = cuenta.vencida
    ? `Venció el permiso de Tu Parrilla para publicar en ${nombre}.`
    : `${networkLabel(cuenta.red)} dejó de aceptar la conexión de Tu Parrilla con ${nombre}.`
  const loQueSePierde =
    pendientes > 0
      ? `Tiene ${plural(pendientes, 'publicación', 'publicaciones')} por salir ahí, y no van a salir hasta que la reconectes.`
      : 'Lo que programes ahí no va a salir hasta que la reconectes.'
  return {
    subject: `Se cayó la conexión con ${nombre}`,
    text: [
      que,
      loQueSePierde,
      '',
      `Reconéctala en ${nombreDe('/admin/accounts', tema)}: ${sitio}/admin/accounts`,
      '',
      'Este aviso llega una vez por caída: si la reconectas y se vuelve a caer, llega otro.',
    ].join('\n'),
  }
}

/**
 * Cómo cuenta el correo lo que falló, en el modo de la cuenta: tiene que nombrar la sección que
 * la persona ve en La Parrilla, y de día esa sección no dice «Se quemó» (`SE_QUEMO`).
 */
const LO_QUE_FALLO: Record<Tema, { uno: string; varios: string; cuando: string }> = {
  noche: { uno: 'destino quemado', varios: 'destinos quemados', cuando: 'Se quemaron' },
  dia: { uno: 'destino echado a perder', varios: 'destinos echados a perder', cuando: 'Se echaron a perder' },
}

/** El asunto y la cuenta que se queda sin nada programado, también en el modo de la cuenta. */
const DEL_RESUMEN: Record<Tema, { asunto: string; poca: { uno: string; varios: string } }> = {
  noche: { asunto: 'Tu parrilla hoy', poca: { uno: 'cuenta con poca parrilla', varios: 'cuentas con poca parrilla' } },
  dia: { asunto: 'Tu barra hoy', poca: { uno: 'cuenta con poco en la barra', varios: 'cuentas con poco en la barra' } },
}

/**
 * El resumen del día, o `null` si no hay nada que contar: un correo que llega todos los días
 * diciendo «todo bien» enseña a no abrirlo. Habla en el modo de la cuenta (`tema`), el mismo
 * del panel.
 */
export function correoDeResumen(
  r: Resumen,
  zona: string,
  sitio: string,
  ahora: Date,
  tema: Tema = 'noche',
): { subject: string; text: string } | null {
  if (resumenVacio(r)) return null

  const partes: string[] = []
  const lineas: string[] = []

  if (r.fallidos.length > 0) {
    const fallo = LO_QUE_FALLO[tema]
    partes.push(plural(r.fallidos.length, fallo.uno, fallo.varios))
    lineas.push(`${fallo.cuando} en las últimas ${HORAS_DE_FALLIDOS} horas (${r.fallidos.length}):`)
    for (const f of r.fallidos.slice(0, MAX_FALLIDOS_EN_CORREO)) {
      lineas.push(`- ${fechaLegible(f.fecha, zona)} · ${cuentaLegible(f.red, f.handle)} · «${extracto(f.texto)}» — ${f.error ?? 'sin motivo'}`)
    }
    if (r.fallidos.length > MAX_FALLIDOS_EN_CORREO) lineas.push(`y ${r.fallidos.length - MAX_FALLIDOS_EN_CORREO} más.`)
    lineas.push(`Revísalos en «${SE_QUEMO[tema]}», en ${nombreDe('/admin/schedule', tema)}: ${sitio}/admin/schedule`, '')
  }

  if (r.cuentas.length > 0) {
    partes.push(plural(r.cuentas.length, 'cuenta por reconectar', 'cuentas por reconectar'))
    lineas.push(`Cuentas por reconectar (${r.cuentas.length}):`)
    for (const c of r.cuentas) {
      const cuando = c.fierro === 'enfriandose' && c.vence ? ` Vence el ${fechaLegible(c.vence, zona)}.` : ''
      lineas.push(`- ${cuentaLegible(c.red, c.handle)} — ${c.motivo}${cuando}`)
    }
    lineas.push(`Reconéctalas en ${nombreDe('/admin/accounts', tema)}: ${sitio}/admin/accounts`, '')
  }

  if (r.pista.length > 0) {
    partes.push(plural(r.pista.length, DEL_RESUMEN[tema].poca.uno, DEL_RESUMEN[tema].poca.varios))
    lineas.push(`Cuentas con menos de ${DIAS_DE_PISTA} días programados (${r.pista.length}):`)
    for (const p of r.pista) {
      const cuanto = p.ultima ? `lo último sale el ${fechaLegible(p.ultima, zona)}` : 'no tiene nada programado'
      lineas.push(`- ${cuentaLegible(p.red, p.handle)} — ${cuanto}.`)
    }
    lineas.push('')
  }

  if (r.meson.length > 0) {
    const total = r.meson.reduce((suma, m) => suma + m.cuantos, 0)
    const donde = tema === 'dia' ? 'en la vitrina' : 'en el mesón'
    partes.push(plural(total, `creativo por vencer ${donde}`, `creativos por vencer ${donde}`))
    lineas.push(`${MESON[tema]}: lo que nadie programa en 30 días se borra (${total}):`)
    for (const m of r.meson) {
      lineas.push(`- ${m.comanda ?? 'Una comanda'}: ${plural(m.cuantos, 'creativo', 'creativos')}, desde el ${fechaLegible(m.vence, zona)}.`)
    }
    lineas.push(`Prográmalos o descártalos: ${sitio}/admin/ia/meson`, '')
  }

  return {
    subject: `${DEL_RESUMEN[tema].asunto}: ${partes.join(', ')}`,
    text: [
      `Resumen de Tu Parrilla, ${fechaLegible(ahora, zona)}.`,
      '',
      ...lineas,
      r.meson.length > 0
        ? 'Este resumen llega solo los días en que hay algo que mirar. Lo mismo, salvo lo del mesón, para un agente, en GET /api/schedule/resumen.'
        : 'Este resumen llega solo los días en que hay algo que mirar. Lo mismo, para un agente, en GET /api/schedule/resumen.',
    ].join('\n'),
  }
}
