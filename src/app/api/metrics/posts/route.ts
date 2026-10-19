import { NextResponse } from 'next/server'
import { contraSuCuenta } from '@/lib/igual-edad'
import { buildMetricPost } from '@/lib/metrics-api'
import { leerConsultaDeMetricas } from '@/lib/metrics-consulta'
import { attributesFor } from '@/lib/post-attributes'
import { getPostRows } from '@/lib/posts'

export const dynamic = 'force-dynamic'

// Un mes de la parrilla actual (20 posts/día × 3 redes) cabe holgado; `truncado`
// avisa cuando el tope mordió, para que nadie concluya sobre datos a medias.
const MAX_POSTS = 2000

export async function GET(request: Request) {
  const consulta = await leerConsultaDeMetricas(request)
  if (consulta instanceof NextResponse) return consulta
  const { ownerId, zone, from, to, red, cuenta, cuentasPorId } = consulta

  // Mismo motor que el panel: acumulado + ganado en la ventana, visitas por ?s=. La
  // ventana viaja además como filtro de publicación, para que el tope acote lo pedido
  // y no las 200 filas más nuevas del catálogo entero. La cuenta, también en la consulta:
  // filtrar después del tope le quitaría sus publicaciones a una cuenta poco activa.
  const all = await getPostRows(
    { ownerId, zone, from, to, profileId: null, includeBots: false },
    false,
    { publishedFrom: from, publishedTo: to, limit: MAX_POSTS, aLos7Dias: true, ...(cuenta ? { accountId: cuenta.id } : {}) },
  )
  const rows = red === null ? all : all.filter((row) => row.network === red)
  // Cada una contra lo normal de su cuenta en el rango: hace falta la lista entera.
  const relativos = contraSuCuenta(rows)

  // Los atributos del calendario, unidos por (red, externalId) en memoria: un post
  // orgánico simplemente no aparece aquí y sale con atributos null.
  const atributosByKey = await attributesFor(ownerId, rows)

  return NextResponse.json({
    truncado: all.length >= MAX_POSTS,
    posts: rows.map((row) =>
      buildMetricPost(
        row,
        atributosByKey.get(`${row.network}:${row.externalId}`) ?? null,
        zone,
        cuentasPorId.get(row.accountId) ?? null,
        relativos.get(row.id) ?? null,
      ),
    ),
  })
}
