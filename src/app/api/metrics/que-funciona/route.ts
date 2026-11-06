import { NextResponse } from 'next/server'
import { contraSuCuenta } from '@/lib/igual-edad'
import { leerConsultaDeMetricas } from '@/lib/metrics-consulta'
import { POCAS_PUBLICACIONES } from '@/lib/pieza'
import { attributesFor } from '@/lib/post-attributes'
import { MAX_PUBLICACIONES_LEIDAS, getPostRows } from '@/lib/posts'
import { PARA_DESTACAR, queFuncionaApi } from '@/lib/que-funciona'

export const dynamic = 'force-dynamic'

/**
 * Qué tema, qué estilo y qué formato anduvieron mejor en el rango, contra lo normal de cada
 * cuenta: lo mismo que el panel «Qué te funciona» de Los Números, con su frase. El rango
 * filtra por fecha de publicación, como `/api/metrics/posts`, y se lee tanto como la pantalla
 * (`MAX_PUBLICACIONES_LEIDAS`): la respuesta trae solo las medianas por valor.
 */
export async function GET(request: Request) {
  const consulta = await leerConsultaDeMetricas(request)
  if (consulta instanceof NextResponse) return consulta
  const { ownerId, zone, from, to, red, cuenta, cuentasPorId } = consulta

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
  const entradas = filas.map((fila) => ({ fila, atributos: atributosDe.get(`${fila.network}:${fila.externalId}`) ?? null }))

  return NextResponse.json({
    cuenta: cuenta ? (cuentasPorId.get(cuenta.id) ?? null) : null,
    publicaciones: filas.length,
    truncado: all.length >= MAX_PUBLICACIONES_LEIDAS,
    minimo: POCAS_PUBLICACIONES,
    paraDestacar: PARA_DESTACAR,
    ...queFuncionaApi(entradas, contraSuCuenta(filas)),
  })
}
