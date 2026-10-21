import { NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { clicks, getDb, links, visits } from '@/db'
import { demasiadosIntentos } from '@/lib/limite-ip'
import { esUuid } from '@/lib/uuid'

const BOT_PATTERN = /bot|crawler|spider|headless|lighthouse/i
/** Mismo criterio que `VISITAS_POR_IP` en la baliza de visitas, con lugar para varios clics por visita. */
const CLICS_POR_IP = 1200

/**
 * Receives `sendBeacon` payloads from ClickTracker. Always answers 204: the browser
 * is already navigating away and there is nothing useful it could do with an error.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()

    const visitId = esUuid(body.visitId) ? body.visitId : null
    const linkId = esUuid(body.linkId) ? body.linkId : null
    const profileId = esUuid(body.profileId) ? body.profileId : null

    if (!profileId) return new NextResponse(null, { status: 204 })
    if (await demasiadosIntentos('clic', CLICS_POR_IP, 10 * 60_000)) return new NextResponse(null, { status: 204 })

    // El enlace y la visita tienen que ser de esa página: si no, un clic armado a mano metía
    // en los números de un dueño un enlace de otro, con su nombre y su dirección. Lo que no
    // calza se guarda sin eso, como un clic sin enlace o sin visita.
    const db = getDb()
    const [enlace] = linkId
      ? await db.select({ id: links.id }).from(links).where(and(eq(links.id, linkId), eq(links.profileId, profileId)))
      : []
    const [visita] = visitId
      ? await db.select({ id: visits.id }).from(visits).where(and(eq(visits.id, visitId), eq(visits.profileId, profileId)))
      : []

    const msOnPage = Number.isFinite(body.msOnPage)
      ? Math.min(Math.max(Math.round(body.msOnPage), 0), 86_400_000)
      : null
    const position = Number.isFinite(body.position) ? Math.round(body.position) : null

    await db.insert(clicks).values({
      visitId: visita ? visitId : null,
      linkId: enlace ? linkId : null,
      profileId,
      msOnPage,
      position,
      isBot: BOT_PATTERN.test(request.headers.get('user-agent') ?? ''),
    })
  } catch (error) {
    console.error('[analytics] failed to record click', error)
  }

  return new NextResponse(null, { status: 204 })
}
