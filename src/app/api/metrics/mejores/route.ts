import { NextResponse } from 'next/server'
import {
  METRICA_ERROR,
  METRICA_POR_DEFECTO,
  PERCENTIL_ERROR,
  PERCENTIL_POR_DEFECTO,
  POCAS_PARA_CONCLUIR,
  esMetrica,
  leerPercentil,
  mejores,
} from '@/lib/mejores'
import { buildMetricPost } from '@/lib/metrics-api'
import { leerConsultaDeMetricas } from '@/lib/metrics-consulta'
import { attributesFor } from '@/lib/post-attributes'
import { getPostRows } from '@/lib/posts'

export const dynamic = 'force-dynamic'

// El mismo tope que `/api/metrics/posts` y que Comparar por atributo.
const MAX_POSTS = 2000

/**
 * El mejor X % de lo publicado en el período, según una métrica, con el corte para entrar,
 * las medianas de arriba contra las del resto y lo que las de arriba tienen en común. El
 * rango filtra por fecha de publicación, igual que `/api/metrics/posts`.
 */
export async function GET(request: Request) {
  const consulta = await leerConsultaDeMetricas(request)
  if (consulta instanceof NextResponse) return consulta
  const { ownerId, zone, from, to, red, cuenta, cuentasPorId, url } = consulta

  const metricaPedida = url.searchParams.get('metrica')
  if (metricaPedida !== null && !esMetrica(metricaPedida)) {
    return NextResponse.json({ error: METRICA_ERROR }, { status: 400 })
  }
  const metrica = metricaPedida ?? METRICA_POR_DEFECTO

  const percentilPedido = url.searchParams.get('percentil')
  const percentil = percentilPedido === null ? PERCENTIL_POR_DEFECTO : leerPercentil(percentilPedido)
  if (percentil === null) return NextResponse.json({ error: PERCENTIL_ERROR }, { status: 400 })

  const all = await getPostRows(
    { ownerId, zone, from, to, profileId: null, includeBots: false },
    false,
    { publishedFrom: from, publishedTo: to, limit: MAX_POSTS, ...(cuenta ? { accountId: cuenta.id } : {}) },
  )
  const filas = red === null ? all : all.filter((row) => row.network === red)
  const atributosDe = await attributesFor(ownerId, filas)
  const atributosDeFila = (fila: (typeof filas)[number]) => atributosDe.get(`${fila.network}:${fila.externalId}`) ?? null

  const r = mejores(
    filas.map((fila) => ({ fila, atributos: atributosDeFila(fila) })),
    metrica,
    percentil,
    zone,
  )

  return NextResponse.json({
    metrica: r.metrica,
    percentil: r.percentil,
    cuenta: cuenta ? (cuentasPorId.get(cuenta.id) ?? null) : null,
    publicaciones: r.publicaciones,
    compiten: r.compiten,
    pocas: r.compiten < POCAS_PARA_CONCLUIR,
    corte: r.corte,
    rinden: r.rinden,
    truncado: all.length >= MAX_POSTS,
    mejores: r.mejores.map((m) => ({
      puesto: m.puesto,
      valor: m.valor,
      ...buildMetricPost(m.fila, m.atributos, zone, cuentasPorId.get(m.fila.accountId) ?? null),
    })),
    medianas: r.medianas,
    enComun: r.enComun,
  })
}
