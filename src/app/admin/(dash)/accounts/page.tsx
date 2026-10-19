import { requireUser } from '@/lib/auth'
import { getCuentas } from '@/lib/posts'
import { env } from '@/lib/env'
import { ayudaDeConexion } from '@/lib/social/ayuda-conexion'
import { Encabezado } from '@/components/ui'
import { AvisoDeConexion } from './aviso-de-conexion'
import { Cuentas } from './cuentas'

export const dynamic = 'force-dynamic'

export default async function AccountsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  // El resultado del último login: una frase, una vez.
  const mensaje = typeof params.mensaje === 'string' ? params.mensaje.slice(0, 200) : null
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
      <Cuentas rows={cuentas} metaEnRevision={metaEnRevision} />
    </>
  )
}
