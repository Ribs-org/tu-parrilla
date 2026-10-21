import 'server-only'
import { NextResponse } from 'next/server'
import { SOCIAL_NETWORKS } from '@/lib/networks'
import { duenoDeLaLlave } from './llaves'
import { cuentaApi, parseRango, resolverCuenta, type CuentaApi } from './metrics-api'
import { getCuentas, type CuentaRow } from './posts'
import { buscarPorId } from './usuarios'
import { ZONA_POR_DEFECTO } from './zona'

export type ConsultaDeMetricas = {
  ownerId: string
  zone: string
  from: Date
  to: Date
  red: string | null
  /** La cuenta pedida con `?cuenta=`, o null si se piden todas. */
  cuenta: CuentaRow | null
  /** Todas las cuentas del dueño, por id, para nombrar la de cada publicación. */
  cuentasPorId: Map<string, CuentaApi>
  url: URL
}

/**
 * Lo que comparten las rutas de `/api/metrics/*`: el dueño de la llave, su zona, el rango,
 * la red y la cuenta. Devuelve la respuesta de error lista para mandar si algo no se
 * entiende. El dueño va antes que el rango: `desde`/`hasta` son días, y un día solo existe
 * en una zona, la de Tu Cuenta.
 */
export async function leerConsultaDeMetricas(request: Request): Promise<ConsultaDeMetricas | NextResponse> {
  const ownerId = await duenoDeLaLlave(request)
  if (!ownerId) return new NextResponse('No autorizado', { status: 401 })
  const zone = (await buscarPorId(ownerId))?.zona ?? ZONA_POR_DEFECTO

  const url = new URL(request.url)
  const rango = parseRango(url.searchParams.get('desde'), url.searchParams.get('hasta'), new Date(), zone)
  if ('error' in rango) return NextResponse.json({ error: rango.error }, { status: 400 })

  const red = url.searchParams.get('red')
  if (red !== null && !(SOCIAL_NETWORKS as readonly string[]).includes(red)) {
    return NextResponse.json({ error: `Red desconocida: ${red}.` }, { status: 400 })
  }

  const cuentas = await getCuentas(ownerId)
  let cuenta: CuentaRow | null = null
  const pedida = url.searchParams.get('cuenta')
  if (pedida !== null) {
    const resuelta = resolverCuenta(pedida, cuentas, red)
    if ('error' in resuelta) return NextResponse.json({ error: resuelta.error }, { status: 400 })
    cuenta = resuelta.cuenta
  }

  return {
    ownerId,
    zone,
    from: rango.from,
    to: rango.to,
    red,
    cuenta,
    cuentasPorId: new Map(cuentas.map((c) => [c.id, cuentaApi(c)])),
    url,
  }
}
