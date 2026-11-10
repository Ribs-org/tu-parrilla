import { cookies } from 'next/headers'
import { requireUser } from '@/lib/auth'
import { COOKIE_DESDE_LA_APP } from '@/lib/puente'
import { getCuentas } from '@/lib/posts'
import { env } from '@/lib/env'
import { ayudaDeConexion } from '@/lib/social/ayuda-conexion'
import { Encabezado } from '@/components/ui'
import { mensajeDeLaUrl } from '@/lib/mensaje-firmado'
import { AvisoDeConexion } from './aviso-de-conexion'
import { Cuentas } from './cuentas'
import { loginDeInstagramAbiertoPara, proximamentePara, tiktokBusinessAbiertoPara } from '@/lib/redes-abiertas'
import { cuentasConComentarios } from '@/lib/social/tiktok-business'

export const dynamic = 'force-dynamic'

export default async function AccountsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  // La hora con que se arma la página: los tiempos relativos de Los Fierros parten de ella.
  const ahora = new Date()
  // El resultado del último login: una frase, una vez, y solo si la firmó el servidor
  // (`mensajeDeLaUrl`): un enlace armado a mano no pone texto en el panel.
  const mensaje = mensajeDeLaUrl(params, 200)
  const { id: ownerId } = await requireUser()
  const cuentas = await getCuentas(ownerId)
  const metaEnRevision = env('META_EN_REVISION') === '1'
  // Abierta desde la app por el puente (`lib/puente.ts`): después de conectar, el navegador se
  // queda acá y nada le decía a la persona que ya podía volver.
  const desdeLaApp = (await cookies()).has(COOKIE_DESDE_LA_APP)
  // TikTok for Business, solo para quien lo tiene abierto: qué cuentas ya lo activaron.
  const comentariosTiktok = tiktokBusinessAbiertoPara(ownerId)
    ? await cuentasConComentarios(
        ownerId,
        cuentas.filter((c) => c.network === 'tiktok').map((c) => c.id),
      )
    : null
  return (
    <>
      <header className="mb-6">
        <Encabezado ruta="/admin/accounts" />
      </header>
      {/* La ayuda se arma acá, en el servidor: sus frases vienen de los conectores de Meta, que
          no viajan al navegador. */}
      {desdeLaApp ? (
        <p className="mb-4 rounded-2xl border border-acero-700 bg-acero-800 px-4 py-3 text-sm text-fg-muted">
          Cuando termines, vuelve a la app de Tu Parrilla: ahí vas a ver tus redes.
        </p>
      ) : null}
      {mensaje ? <AvisoDeConexion mensaje={mensaje} ayuda={ayudaDeConexion(mensaje)} /> : null}
      <Cuentas
        rows={cuentas}
        metaEnRevision={metaEnRevision}
        desde={ahora.getTime()}
        proximamente={[...proximamentePara(ownerId)]}
        loginDeInstagram={loginDeInstagramAbiertoPara(ownerId)}
        comentariosTiktok={comentariosTiktok}
      />
    </>
  )
}
