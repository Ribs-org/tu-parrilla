import { NextResponse } from 'next/server'
import { localDay } from '@/lib/analytics'
import { aceptaChoripan, corteParaElTelefono } from '@/lib/cortes-movil'
import { leerLoQueTrajo } from '@/lib/lo-que-trajo'
import { requireMobileUser } from '@/lib/mobile-guardia'

export const dynamic = 'force-dynamic'

/**
 * La fila «Lo que trajo» de La Parrilla del teléfono: los cortes que salieron en los últimos siete
 * días, del más nuevo al más viejo, cada uno con su dibujo y lo que llegó desde que se miró
 * (`src/lib/lo-que-trajo.ts`), y `numero`, el del ícono de la app y de la pestaña: los cortes con
 * algo nuevo más los comentarios que esperan respuesta en La Mesa. `hoy`, el día en la zona del
 * dueño, para que la app diga «hoy» y «ayer» sin el reloj del teléfono.
 */
export async function GET(request: Request) {
  const usuario = await requireMobileUser(request)
  if (!usuario) return new NextResponse('No autorizado', { status: 401 })

  const ahora = new Date()
  const { cortes, numero } = await leerLoQueTrajo(usuario.id, ahora)
  const conChoripan = aceptaChoripan(request)
  return NextResponse.json({
    hoy: localDay(ahora, usuario.zona),
    cortes: cortes.map((c) => ({ ...corteParaElTelefono(c.corte, usuario.zona, conChoripan), nuevo: c.nuevo })),
    numero,
  })
}
