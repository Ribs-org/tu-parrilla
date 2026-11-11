import { NextResponse } from 'next/server'
import { enviarResumenes } from '@/lib/avisos/run'
import { detectarHitosEnLaCorrida } from '@/lib/hitos'
import { purgarYoutubeViejo } from '@/lib/social/retencion-youtube'
import { syncAll } from '@/lib/social/sync'
import { clienteGithub } from '@/lib/sugerencias/github'
import { reintentarSugerencias } from '@/lib/sugerencias/guardar'
import { releerSuscripciones } from '@/lib/pagos/suscripciones'
import { env } from '@/lib/env'
import { cronAutorizado } from '@/lib/cron-auth'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(request: Request) {
  const secret = env('CRON_SECRET')
  // Without a secret the endpoint stays shut rather than open: an unauthenticated
  // sync is a free way for anyone to burn the day's API quota.
  if (!cronAutorizado(request.headers.get('authorization'), secret)) {
    return new NextResponse('No autorizado', { status: 401 })
  }

  try {
    // A report where all three networks failed still answers 200, deliberately. That is
    // the orchestrator running correctly and telling us three connectors failed: each one
    // wrote its own `lastSyncError`, so the connection cards will say so. Nothing is lost.
    const report = await syncAll()
    // Los hitos que dejó la lectura del día (`hitos.ts`), en cuanto termina. Si fallan, la
    // lectura ya quedó escrita y la de la hora siguiente los encuentra.
    const hitos = await detectarHitosEnLaCorrida(new Date())
    // Después del sync y por su cuenta: si la retención falla, el sync del día ya quedó
    // escrito, y lo que no se borró hoy se borra mañana. El error va al log con su
    // nombre, porque es la única señal de que un dato de YouTube se está pasando del
    // plazo que sus políticas permiten (`retencion-youtube`).
    let retencion: Awaited<ReturnType<typeof purgarYoutubeViejo>> | { error: string }
    try {
      retencion = await purgarYoutubeViejo()
    } catch (error) {
      console.error('Falló la retención de datos de YouTube:', error)
      retencion = { error: 'La retención de YouTube falló; ver el log.' }
    }
    // El resumen del día, al final: así lee el estado de las cuentas que esta misma
    // sincronización acaba de dejar. Mismo trato que la retención: si falla, el sync ya quedó.
    let resumenes: Awaited<ReturnType<typeof enviarResumenes>> | { error: string }
    try {
      resumenes = await enviarResumenes()
    } catch (error) {
      console.error('Falló el resumen del día:', error)
      resumenes = { error: 'El resumen del día falló; ver el log.' }
    }
    // Las sugerencias que no alcanzaron a salir a GitHub —no había token, o GitHub falló— se
    // reintentan acá, una vez al día. Mismo trato: si falla, siguen guardadas para mañana.
    let sugerencias: Awaited<ReturnType<typeof reintentarSugerencias>> | { error: string }
    try {
      sugerencias = await reintentarSugerencias(clienteGithub())
    } catch (error) {
      console.error('Falló el reintento de las sugerencias:', String(error).slice(0, 300))
      sugerencias = { error: 'El reintento de las sugerencias falló; ver el log.' }
    }
    // Las suscripciones del plan pagado, releídas en Mercado Pago: un webhook perdido no deja a
    // nadie con el plan equivocado más de un día. Mismo trato: si falla, mañana se releen.
    let pagos: Awaited<ReturnType<typeof releerSuscripciones>> | { error: string }
    try {
      pagos = await releerSuscripciones()
    } catch (error) {
      console.error('Falló la relectura de las suscripciones:', String(error).slice(0, 300))
      pagos = { error: 'La relectura de las suscripciones falló; ver el log.' }
    }
    return NextResponse.json({ report, hitos, retencion, resumenes, sugerencias, pagos })
  } catch (error) {
    // Reaching here is the other case entirely: syncAll settles every network on its own,
    // so a throw is the orchestrator itself breaking, before any per-network catch could
    // record anything. No `lastSyncError` gets written and the cards keep showing the
    // previous run — which makes Vercel's cron status the only place a total failure is
    // visible, and that keys off a non-2xx. Hence the 500, and hence the two failure paths
    // answering differently on purpose.
    //
    // Fixed body, same discipline as the OAuth callback: the real error goes to the log,
    // never into the response.
    console.error('Falló la sincronización de redes:', error)
    return NextResponse.json({ error: 'La sincronización falló por completo.' }, { status: 500 })
  }
}
