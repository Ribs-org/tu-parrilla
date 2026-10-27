import { requireUser } from '@/lib/auth'
import { getCuentas } from '@/lib/posts'
import { env } from '@/lib/env'
import { ayudaDeConexion } from '@/lib/social/ayuda-conexion'
import { Encabezado } from '@/components/ui'
import { mensajeDeLaUrl } from '@/lib/mensaje-firmado'
import { AvisoDeConexion } from './aviso-de-conexion'
import { Cuentas } from './cuentas'
import { proximamentePara } from '@/lib/redes-abiertas'

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
  return (
    <>
      <header className="mb-6">
        <Encabezado ruta="/admin/accounts" />
      </header>
      {/* La ayuda se arma acá, en el servidor: sus frases vienen de los conectores de Meta, que
          no viajan al navegador. */}
      {mensaje ? <AvisoDeConexion mensaje={mensaje} ayuda={ayudaDeConexion(mensaje)} /> : null}
      <Cuentas
        rows={cuentas}
        metaEnRevision={metaEnRevision}
        desde={ahora.getTime()}
        proximamente={[...proximamentePara(ownerId)]}
      />
    </>
  )
}
