import { NextResponse } from 'next/server'
import { cierreDe, contraSuCuenta } from '@/lib/igual-edad'
import {
  LADO_ERROR,
  LADO_POR_DEFECTO,
  METRICA_ERROR,
  METRICA_POR_DEFECTO_API,
  PERCENTIL_ERROR,
  PERCENTIL_POR_DEFECTO,
  POCAS_PARA_CONCLUIR,
  RECIENTES_ERROR,
  esLado,
  esMetrica,
  leerPercentil,
  tajada,
} from '@/lib/mejores'
import { buildMetricPost } from '@/lib/metrics-api'
import { leerConsultaDeMetricas } from '@/lib/metrics-consulta'
import { attributesFor } from '@/lib/post-attributes'
import { MAX_PUBLICACIONES_LEIDAS, getPostRows } from '@/lib/posts'

export const dynamic = 'force-dynamic'

/**
 * El mejor X % (o el peor) de lo publicado en el período, según una métrica, con el corte
 * para entrar, las medianas del grupo contra las del resto y lo que el grupo tiene en común.
 * El rango filtra por fecha de publicación, igual que `/api/metrics/posts`.
 *
 * Lee tanto como la pantalla «Tu mejor 10 %» (`MAX_PUBLICACIONES_LEIDAS`), no el tope de
 * `/api/metrics/posts`: la respuesta trae solo el grupo, así que no pesa como la lista entera.
 *
 * Lo que la pantalla cambió por defecto (la métrica, las de menos de 7 días) acá no cambia:
 * le movería la respuesta a quien ya la usa. Las claves del grupo se nombran por su lado
 * —`mejores` o `peores`, también en `medianas` y en `enComun`—, para que nadie lea lo de abajo
 * como lo de arriba.
 */
export async function GET(request: Request) {
  const consulta = await leerConsultaDeMetricas(request)
  if (consulta instanceof NextResponse) return consulta
  const { ownerId, zone, from, to, red, cuenta, cuentasPorId, url } = consulta

  const metricaPedida = url.searchParams.get('metrica')
  if (metricaPedida !== null && !esMetrica(metricaPedida)) {
    return NextResponse.json({ error: METRICA_ERROR }, { status: 400 })
  }
  const metrica = metricaPedida ?? METRICA_POR_DEFECTO_API

  const percentilPedido = url.searchParams.get('percentil')
  const percentil = percentilPedido === null ? PERCENTIL_POR_DEFECTO : leerPercentil(percentilPedido)
  if (percentil === null) return NextResponse.json({ error: PERCENTIL_ERROR }, { status: 400 })

  const ladoPedido = url.searchParams.get('lado')
  if (ladoPedido !== null && !esLado(ladoPedido)) return NextResponse.json({ error: LADO_ERROR }, { status: 400 })
  const lado = ladoPedido ?? LADO_POR_DEFECTO

  const recientes = url.searchParams.get('recientes') ?? 'si'
  if (recientes !== 'si' && recientes !== 'no') return NextResponse.json({ error: RECIENTES_ERROR }, { status: 400 })

  const all = await getPostRows(
    { ownerId, zone, from, to, profileId: null, includeBots: false },
    false,
    {
      publishedFrom: from,
      publishedTo: to,
      limit: MAX_PUBLICACIONES_LEIDAS,
      aLos7Dias: true,
      ...(cuenta ? { accountId: cuenta.id } : {}),
    },
  )
  const filas = red === null ? all : all.filter((row) => row.network === red)
  const atributosDe = await attributesFor(ownerId, filas)
  const atributosDeFila = (fila: (typeof filas)[number]) => atributosDe.get(`${fila.network}:${fila.externalId}`) ?? null
  const relativos = contraSuCuenta(filas)

  const r = tajada(
    filas.map((fila) => ({ fila, atributos: atributosDeFila(fila) })),
    metrica,
    percentil,
    zone,
    { lado, conRecientes: recientes === 'si', cierre: cierreDe(to) },
  )
  const grupo = lado === 'peor' ? 'peores' : 'mejores'
  const enElGrupo = lado === 'peor' ? 'enPeores' : 'enMejores'

  return NextResponse.json({
    metrica: r.metrica,
    lado: r.lado,
    percentil: r.percentil,
    recientes,
    cuenta: cuenta ? (cuentasPorId.get(cuenta.id) ?? null) : null,
    publicaciones: r.publicaciones,
    compiten: r.compiten,
    fueraPorRecientes: r.fueraPorRecientes,
    pocas: r.compiten < POCAS_PARA_CONCLUIR,
    corte: r.corte,
    rinden: r.rinden,
    truncado: all.length >= MAX_PUBLICACIONES_LEIDAS,
    [grupo]: r.grupo.map((m) => ({
      puesto: m.puesto,
      valor: m.valor,
      ...buildMetricPost(m.fila, m.atributos, zone, cuentasPorId.get(m.fila.accountId) ?? null, relativos.get(m.fila.id) ?? null),
    })),
    medianas: { [grupo]: r.medianas.grupo, resto: r.medianas.resto },
    enComun: r.enComun.map((rasgo) => ({
      rasgo: rasgo.rasgo,
      valor: rasgo.valor,
      [enElGrupo]: rasgo.enElGrupo,
      [grupo]: rasgo.grupo,
      enTodas: rasgo.enTodas,
      todas: rasgo.todas,
      veces: rasgo.veces,
    })),
  })
}
