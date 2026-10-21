import { NextResponse } from 'next/server'
import { localDay } from '@/lib/analytics'
import { buildAccountCards, buildAccountSeries } from '@/lib/account-stats'
import { lecturasDeCuentas } from '@/lib/lecturas-cuentas'
import { requireMobileUser } from '@/lib/mobile-guardia'
import { parseRango } from '@/lib/mobile-api'
import { getCuentas } from '@/lib/posts'

export const dynamic = 'force-dynamic'

/**
 * Las tarjetas de «⋯ Más: tus cuentas» en Los Números del teléfono: una por cuenta, con su
 * nombre en la red —con dos cuentas de Instagram, dos tarjetas—, y la serie diaria de visitas al
 * perfil. Las mismas lecturas y las mismas reglas que el panel (`lecturasDeCuentas`,
 * `buildAccountCards`), en el español que habla el resto de la API móvil.
 */
export async function GET(request: Request) {
  const usuario = await requireMobileUser(request)
  if (!usuario) {
    return new NextResponse('No autorizado', { status: 401 })
  }

  const now = new Date()
  const { from, to } = parseRango(new URL(request.url).searchParams.get('rango'), now)
  const desde = localDay(from, usuario.zona)
  const hasta = localDay(to, usuario.zona)

  // En serie: más consultas a la vez que conexiones en el pool se colgaron una vez contra el
  // pooler de Supabase (`docs/pendientes.md`).
  const filas = await lecturasDeCuentas(usuario.id)
  const nombres = new Map((await getCuentas(usuario.id)).map((c) => [c.id, c.handle]))

  const cuentas = buildAccountCards(filas, desde, hasta).map((cuenta) => ({
    id: cuenta.accountId,
    red: cuenta.network,
    nombre: cuenta.accountId ? (nombres.get(cuenta.accountId) ?? null) : null,
    seguidores: cuenta.followers,
    seguidoresGanados: cuenta.followersChange,
    visitasAlPerfil: cuenta.profileViews,
    alcance: cuenta.reach,
    dia: cuenta.dayLabel,
  }))
  const serie = buildAccountSeries(filas, desde, hasta).map((punto) => ({
    fecha: punto.date,
    visitasAlPerfil: punto.profileViews,
    alcance: punto.reach,
  }))

  return NextResponse.json({ desde, hasta, cuentas, serie })
}
