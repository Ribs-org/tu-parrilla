// El servicio de push de Expo, sin base: qué token se acepta, cómo se arma cada mensaje, cómo se
// parte en lotes y qué tokens dice Expo que ya no sirven. Lo que lee y borra en la base está en
// `./enviar.ts`; esto lo prueban los tests con un `fetch` de mentira.
//
// Referencia: «Send notifications with the Expo Push Service», docs.expo.dev (SDK 57). Hasta 100
// mensajes por pedido, una respuesta con un ticket por mensaje en el mismo orden, y
// `DeviceNotRegistered` en el ticket cuando el teléfono ya no usa ese token.

export const URL_EXPO_PUSH = 'https://exp.host/--/api/v2/push/send'

/** El tope de Expo por pedido: más de 100 responde `PUSH_TOO_MANY_NOTIFICATIONS`. */
export const LOTE_EXPO = 100

/** El canal de Android que la app crea al encender los avisos (`mobile/src/lib/avisos.ts`). */
export const CANAL_ANDROID = 'avisos'

/** Lo que dice el servidor cuando el token que manda el teléfono no tiene la forma de uno de Expo. */
export const TOKEN_INVALIDO = 'El token de los avisos no es uno de Expo.'
export const PLATAFORMA_INVALIDA = '«plataforma» tiene que ser android o ios.'

/**
 * Adónde lleva tocar el aviso. La app traduce cada uno a su pantalla (`rutaDelAviso`, en
 * `mobile/src/lib/avisos.ts`): el servidor no sabe las rutas del teléfono.
 */
export type TipoDeAviso = 'comentarios' | 'quemado' | 'fierro' | 'pregunta' | 'comanda' | 'sugerencia'

/** Un aviso para el teléfono: lo que se lee en la notificación y adónde lleva tocarla. */
export type AvisoAlTelefono = {
  titulo: string
  cuerpo: string
  tipo: TipoDeAviso
  /** El id de lo que avisa (la comanda, el post, la sugerencia), si la pantalla lo usa. */
  id?: string
}

export type MensajeExpo = {
  to: string
  title: string
  body: string
  data: { tipo: TipoDeAviso; id?: string }
  sound: 'default'
  priority: 'high'
  channelId: string
}

/**
 * Si un texto tiene la forma de un token de Expo: `ExponentPushToken[…]` o `ExpoPushToken[…]`. Lo
 * que no la tiene no se guarda: Expo rechazaría el lote entero.
 */
export function esTokenDeExpo(token: unknown): token is string {
  return typeof token === 'string' && token.length <= 200 && /^Expo(nent)?PushToken\[[A-Za-z0-9_-]{8,}\]$/.test(token)
}

/** El cuerpo de `POST /api/mobile/push`, o la frase del error. */
export function registroDelCuerpo(cuerpo: unknown): { token: string; plataforma: 'android' | 'ios' } | { error: string } {
  const c = (cuerpo && typeof cuerpo === 'object' ? cuerpo : {}) as { token?: unknown; plataforma?: unknown }
  if (!esTokenDeExpo(c.token)) return { error: TOKEN_INVALIDO }
  if (c.plataforma !== 'android' && c.plataforma !== 'ios') return { error: PLATAFORMA_INVALIDA }
  return { token: c.token, plataforma: c.plataforma }
}

/** Corta un texto para la notificación: el teléfono muestra dos o tres renglones, y Expo pide menos de 4 KB. */
export function recortar(texto: string, max: number): string {
  const limpio = texto.replace(/\s+/g, ' ').trim()
  return limpio.length > max ? `${limpio.slice(0, max - 1).trimEnd()}…` : limpio
}

export function mensajeExpo(token: string, aviso: AvisoAlTelefono): MensajeExpo {
  return {
    to: token,
    title: recortar(aviso.titulo, 80),
    body: recortar(aviso.cuerpo, 240),
    data: aviso.id ? { tipo: aviso.tipo, id: aviso.id } : { tipo: aviso.tipo },
    sound: 'default',
    priority: 'high',
    channelId: CANAL_ANDROID,
  }
}

export function enLotes<T>(lista: readonly T[], tamano = LOTE_EXPO): T[][] {
  const lotes: T[][] = []
  for (let i = 0; i < lista.length; i += tamano) lotes.push(lista.slice(i, i + tamano))
  return lotes
}

type Ticket = { status?: unknown; details?: { error?: unknown } }

/** Lo que salió de un envío: cuántos aceptó Expo y qué tokens ya no sirven. */
export type ResultadoExpo = { aceptados: number; vencidos: string[]; fallidos: number }

/**
 * Lee la respuesta de un lote. Un ticket «ok» solo dice que Expo lo recibió, no que llegó; uno con
 * `DeviceNotRegistered` dice que ese teléfono ya no usa el token, y se borra.
 */
export function leerTickets(lote: readonly MensajeExpo[], respuesta: unknown): ResultadoExpo {
  const datos = (respuesta && typeof respuesta === 'object' ? (respuesta as { data?: unknown }).data : null) ?? null
  const tickets: Ticket[] = Array.isArray(datos) ? (datos as Ticket[]) : []
  const resultado: ResultadoExpo = { aceptados: 0, vencidos: [], fallidos: 0 }
  lote.forEach((mensaje, i) => {
    const t = tickets[i]
    if (t?.status === 'ok') resultado.aceptados++
    else {
      resultado.fallidos++
      if (t?.details?.error === 'DeviceNotRegistered') resultado.vencidos.push(mensaje.to)
    }
  })
  return resultado
}

type Fetch = (url: string, init: RequestInit) => Promise<Response>

/** Cuántas veces se prueba un lote que Expo contestó con 429 o 5xx, y cuánto se espera entre una y otra. */
const INTENTOS = 2
const ESPERA_MS = 1_000

/**
 * Manda los mensajes a Expo, de a 100 por pedido. Reintenta una vez lo que Expo contestó con 429 o
 * con un 5xx, como piden sus docs; un 400 no se reintenta, porque es el mensaje mal armado. Nunca
 * lanza: un lote que no sale cuenta como fallido, y el resto sigue.
 */
export async function mandarAExpo(
  mensajes: readonly MensajeExpo[],
  opciones: { accessToken?: string; fetch?: Fetch; esperar?: (ms: number) => Promise<void> } = {},
): Promise<ResultadoExpo> {
  const pedir: Fetch = opciones.fetch ?? ((url, init) => fetch(url, init))
  const esperar = opciones.esperar ?? ((ms) => new Promise<void>((r) => setTimeout(r, ms)))
  const total: ResultadoExpo = { aceptados: 0, vencidos: [], fallidos: 0 }
  for (const lote of enLotes(mensajes)) {
    let leido: ResultadoExpo | null = null
    for (let intento = 1; intento <= INTENTOS && !leido; intento++) {
      try {
        const respuesta = await pedir(URL_EXPO_PUSH, {
          method: 'POST',
          signal: AbortSignal.timeout(15_000),
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'Accept-Encoding': 'gzip, deflate',
            ...(opciones.accessToken ? { Authorization: `Bearer ${opciones.accessToken}` } : {}),
          },
          body: JSON.stringify(lote),
        })
        if (respuesta.ok) {
          leido = leerTickets(lote, await respuesta.json().catch(() => null))
          break
        }
        const reintentable = respuesta.status === 429 || respuesta.status >= 500
        console.error('[push] Expo respondió', respuesta.status, (await respuesta.text().catch(() => '')).slice(0, 200))
        if (!reintentable) break
      } catch (error) {
        console.error('[push] No se pudo hablar con Expo:', String(error).slice(0, 200))
      }
      if (intento < INTENTOS) await esperar(ESPERA_MS * intento)
    }
    const r = leido ?? { aceptados: 0, vencidos: [], fallidos: lote.length }
    total.aceptados += r.aceptados
    total.fallidos += r.fallidos
    total.vencidos.push(...r.vencidos)
  }
  return total
}
