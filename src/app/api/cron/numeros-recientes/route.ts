import { NextResponse } from 'next/server'
import { detectarHitosEnLaCorrida } from '@/lib/hitos'
import { avisarLoBueno } from '@/lib/push/bueno'
import { leerLoReciente } from '@/lib/social/reciente'
import { env } from '@/lib/env'
import { cronAutorizado } from '@/lib/cron-auth'

export const dynamic = 'force-dynamic'
// Las cuentas se empiezan hasta los 200 segundos (`PLAZO_DE_LO_RECIENTE_MS`); el resto es para
// que termine la que va. La llama cada hora el pinger externo, no Vercel: el plan Hobby no deja
// más crons que los dos diarios de `vercel.json`.
export const maxDuration = 240

/**
 * Los números de cada hora: lo publicado en las últimas 48 horas en Instagram, Facebook y TikTok,
 * leído de nuevo (`social/reciente.ts`); después, los hitos que esas lecturas dejaron
 * (`hitos.ts`), y el aviso de lo bueno al teléfono de quien le toque (`push/bueno.ts`).
 */
export async function GET(request: Request) {
  // Cerrada sin secreto, como las demás: cada corrida gasta llamadas a las redes.
  if (!cronAutorizado(request.headers.get('authorization'), env('CRON_SECRET'))) {
    return new NextResponse('No autorizado', { status: 401 })
  }
  try {
    // Con cuentas que fallaron contesta 200 igual: cada una dejó su error en el informe y en el
    // log, y la hora siguiente lo intenta de nuevo. Los hitos, después de leer y por su cuenta: si
    // fallan, la lectura ya quedó escrita.
    const informe = await leerLoReciente()
    const hitos = await detectarHitosEnLaCorrida(new Date())
    // Al final y sin lanzar: un aviso que no sale no deshace la lectura.
    return NextResponse.json({ informe, hitos, bueno: await avisarLoBueno() })
  } catch (error) {
    // Acá llega solo si la corrida entera se rompió (la base, casi siempre). Cuerpo fijo: el
    // error de verdad va al log.
    console.error('Falló la lectura de cada hora:', error)
    return NextResponse.json({ error: 'La lectura de cada hora falló por completo.' }, { status: 500 })
  }
}
