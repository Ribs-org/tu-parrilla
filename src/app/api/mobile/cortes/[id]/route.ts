import { NextResponse } from 'next/server'
import { aceptaChoripan, corteParaElTelefono } from '@/lib/cortes-movil'
import { CORTE_NO_ESTA, leerCorte, seguidoresDe } from '@/lib/lo-que-trajo'
import { isoInZone } from '@/lib/metrics-api'
import { requireMobileUser } from '@/lib/mobile-guardia'
import { sinMetricasDerivadas } from '@/lib/social/politica-youtube'

export const dynamic = 'force-dynamic'

/**
 * El detalle de un corte en el teléfono: el corte, lo nuevo desde que se miró (`vistoEn`, null si
 * nunca), lo que lleva cada red tal como la red lo da —con los seguidores donde los da—, y las
 * visitas a las páginas del dueño desde sus publicaciones. No deja la marca: eso es
 * `POST /api/mobile/cortes/{id}/visto`, que la app llama después de mostrar lo nuevo. 404 si no
 * existe, es de otro o todavía no salió, sin distinguir.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const usuario = await requireMobileUser(request)
  if (!usuario) return new NextResponse('No autorizado', { status: 401 })

  const corte = await leerCorte(usuario.id, (await params).id)
  if (!corte) return NextResponse.json({ error: CORTE_NO_ESTA }, { status: 404 })

  const seguidores = await seguidoresDe(usuario.id, corte.servidos)
  return NextResponse.json({
    corte: corteParaElTelefono(corte.corte, usuario.zona, aceptaChoripan(request)),
    nuevo: corte.nuevo,
    vistoEn: corte.marca ? isoInZone(corte.marca.vistoEn, usuario.zona) : null,
    redes: corte.servidos.map((s) => ({
      id: s.id,
      red: s.red,
      handle: s.handle,
      views: s.lectura?.views ?? null,
      likes: s.lectura?.likes ?? null,
      comments: s.lectura?.comments ?? null,
      seguidores: seguidores.get(s.id) ?? null,
      // YouTube va tal como lo da, y se lee que es suyo (`politica-youtube.ts`).
      segunLaRed: sinMetricasDerivadas(s.red),
    })),
    visitas: corte.visitas,
  })
}
