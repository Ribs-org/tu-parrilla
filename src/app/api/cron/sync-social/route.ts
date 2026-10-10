import { NextResponse } from 'next/server'
import { purgarYoutubeViejo } from '@/lib/social/retencion-youtube'
import { syncAll } from '@/lib/social/sync'
import { env } from '@/lib/env'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(request: Request) {
  const secret = env('CRON_SECRET')
  // Without a secret the endpoint stays shut rather than open: an unauthenticated
  // sync is a free way for anyone to burn the day's API quota.
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return new NextResponse('No autorizado', { status: 401 })
  }

  try {
    // A report where all three networks failed still answers 200, deliberately. That is
    // the orchestrator running correctly and telling us three connectors failed: each one
    // wrote its own `lastSyncError`, so the connection cards will say so. Nothing is lost.
    const report = await syncAll()
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
    return NextResponse.json({ report, retencion })
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
