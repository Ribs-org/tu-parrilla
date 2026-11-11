import { NextResponse } from 'next/server'
import { localDay } from '@/lib/analytics'
import { aceptaChoripan, corteParaElTelefono } from '@/lib/cortes-movil'
import { hitoMasAlto, hitosDeLosCortes, porCelebrar } from '@/lib/hitos'
import { leerLoQueTrajo } from '@/lib/lo-que-trajo'
import { requireMobileUser } from '@/lib/mobile-guardia'
import { leerRacha } from '@/lib/racha'

export const dynamic = 'force-dynamic'

/**
 * La fila «Lo que trajo» de La Parrilla del teléfono: los cortes que salieron en los últimos siete
 * días, del más nuevo al más viejo, cada uno con su dibujo, lo que llegó desde que se miró
 * (`src/lib/lo-que-trajo.ts`) y `hito`, el umbral más alto que pasaron sus vistas, o null
 * (`src/lib/hitos.ts`). `numero`, el del ícono de la app y de la pestaña: los cortes con algo nuevo
 * más los comentarios que esperan respuesta en La Mesa. `racha`, los días seguidos con algo servido
 * (`src/lib/racha.ts`). `porCelebrar`, los hitos que la app celebra al abrir, de cualquier fecha,
 * con su corte: solo los raros para el dueño (`esRaro`). `hoy`, el día en la zona del dueño, para
 * que la app diga «hoy» y «ayer» sin el reloj del teléfono.
 */
export async function GET(request: Request) {
  const usuario = await requireMobileUser(request)
  if (!usuario) return new NextResponse('No autorizado', { status: 401 })

  const ahora = new Date()
  const [{ cortes, numero }, racha, celebraciones] = await Promise.all([
    leerLoQueTrajo(usuario.id, ahora),
    leerRacha(usuario.id, ahora, usuario.zona),
    porCelebrar(usuario.id, ahora),
  ])
  const hitos = await hitosDeLosCortes(
    usuario.id,
    cortes.map((c) => c.corte.post.id),
  )
  const conChoripan = aceptaChoripan(request)
  return NextResponse.json({
    hoy: localDay(ahora, usuario.zona),
    cortes: cortes.map((c) => ({
      ...corteParaElTelefono(c.corte, usuario.zona, conChoripan),
      nuevo: c.nuevo,
      hito: hitoMasAlto(hitos.get(c.corte.post.id)),
    })),
    numero,
    racha,
    porCelebrar: celebraciones.map((h) => ({ id: h.id, umbral: h.umbral, corte: corteParaElTelefono(h.corte, usuario.zona, conChoripan) })),
  })
}
