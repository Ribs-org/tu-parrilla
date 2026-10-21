import { NextResponse } from 'next/server'
import { vigilarConexiones } from '@/lib/avisos/run'
import { sondearComentarios } from '@/lib/social/comentarios/run'
import { publishDue } from '@/lib/social/publish/run'
import { barrerHuerfanos } from '@/lib/storage-gc'
import { env } from '@/lib/env'
import { cronAutorizado } from '@/lib/cron-auth'

export const dynamic = 'force-dynamic'
// 240 segundos, debajo de los 5 minutos del pinger. Dos corridas igual pueden cruzarse —el
// respaldo diario de Vercel cae encima del pinger, «Subir ahora» encima de cualquiera—, y lo
// que impide publicar dos veces es el reclamo de cada destino (`publishDue`), no este número.
export const maxDuration = 240

/**
 * Los plazos de la corrida para `publishDue`, contados desde su inicio. Ningún intento
 * empieza pasados los 120 segundos: lo que queda es para que terminen y para las otras
 * fases —el sondeo de comentarios también corta a los 120 (`MAX_MS_POR_CORRIDA`), porque
 * publicar manda—. Y un intento largo (subir un video nuevo a YouTube) empieza solo si cabe
 * entero antes del corte de Vercel, con diez segundos de margen (`alcanzaElTiempo`).
 */
const EMPEZAR_HASTA_MS = 120_000
const MARGEN_MS = 10_000

/**
 * El barrido de huérfanos va una vez por hora y no en cada corrida: lista el almacén entero
 * y lee siete tablas completas, y cada cinco minutos eso era tráfico de la base para nada.
 * Le toca a la corrida que empieza en los primeros cinco minutos de la hora —con el pinger
 * cada cinco minutos, siempre hay una— y que no viene atrasada: una que ya gastó su mitad
 * publicando lo deja para la hora siguiente. El barrido espera de todos modos una hora antes
 * de tocar un archivo (`storage-gc.ts`).
 */
function tocaBarrer(inicio: number, ahora: number): boolean {
  return new Date(inicio).getUTCMinutes() < 5 && ahora - inicio < EMPEZAR_HASTA_MS
}

export async function GET(request: Request) {
  const secret = env('CRON_SECRET')
  // Same discipline as sync-social: without a secret the endpoint stays shut.
  if (!cronAutorizado(request.headers.get('authorization'), secret)) {
    return new NextResponse('No autorizado', { status: 401 })
  }

  // Una línea por fase con el tiempo acumulado. Si la corrida muere por `maxDuration`, la
  // fase que se colgó es la primera que no alcanzó a escribir la suya: sin esto, el log de
  // un 504 no dice dónde se fueron los 240 segundos.
  const inicio = Date.now()
  const marca = (fase: string) => console.log(`[cron] ${fase} listo a los ${Date.now() - inicio} ms`)

  try {
    // Failed targets answer 200 on purpose: each one wrote its own lastError and the
    // calendar shows it. A non-2xx here means the orchestrator itself broke.
    const report = await publishDue(new Date(), undefined, {
      empezarHasta: inicio + EMPEZAR_HASTA_MS,
      terminarAntesDe: inicio + maxDuration * 1000 - MARGEN_MS,
    })
    marca('publicar')
    // Justo después de publicar: un destino que la red rechazó por la conexión acaba de
    // anotarlo en su cuenta (`marcarCaida`), y el correo de la caída sale en esta misma
    // pasada. Su fallo no tumba la corrida, que ya publicó.
    let conexiones: Awaited<ReturnType<typeof vigilarConexiones>> | { error: string }
    try {
      conexiones = await vigilarConexiones()
    } catch (error) {
      console.error('Falló la vigilancia de conexiones:', String(error).slice(0, 300))
      conexiones = { error: 'La vigilancia de conexiones falló; ver el log.' }
    }
    marca('conexiones')
    // Después de publicar y antes de barrer: publicar a tiempo manda sobre responder a
    // tiempo, y el sondeo no debe quitarle segundos a la publicación de esta pasada.
    // Su fallo no puede tumbar la corrida, que ya publicó.
    let comentarios: Awaited<ReturnType<typeof sondearComentarios>> = {
      cuentas: [],
      sinSondear: 0,
      redaccion: { redactados: 0, fallidos: 0, sinPasarela: false },
    }
    try {
      comentarios = await sondearComentarios(new Date(), inicio)
    } catch (error) {
      console.error('Falló el sondeo de comentarios:', String(error).slice(0, 300))
    }
    marca('comentarios')
    // Después de publicar, no antes: `limpiarMedia` acaba de liberar los videos, y el
    // barrido los ve en su pasada de la hora. No hace falta envolverlo: `barrerHuerfanos`
    // no lanza nunca.
    const barrido = tocaBarrer(inicio, Date.now()) ? await barrerHuerfanos() : null
    marca('barrido')
    return NextResponse.json({ report, conexiones, comentarios, barrido })
  } catch (error) {
    console.error('Falló la corrida de publicación:', error)
    return NextResponse.json({ error: 'La publicación falló por completo.' }, { status: 500 })
  }
}
