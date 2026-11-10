import { COLOR_DE_BARRA } from '@/lib/tema'
import { temaPedido } from '@/lib/tema-servidor'
import { CruzarPuente } from '../formularios'

export const metadata = { title: 'Desde la app', robots: { index: false, follow: false } }
// Calza la barra del navegador del teléfono con el fondo de la puerta, de noche o de día.
export async function generateViewport() {
  return { themeColor: COLOR_DE_BARRA[await temaPedido()] }
}
export const dynamic = 'force-dynamic'

/**
 * La puerta que abre la app para ir a Los Fierros con la sesión ya abierta (`lib/puente.ts`). No
 * manda a /admin a quien ya tiene sesión, como las otras dos: puede ser la de otra persona, y la
 * llave abre la de quien viene de la app.
 */
export default async function PuentePage() {
  return (
    <main className="acerado grid min-h-dvh place-items-center bg-acero-950 px-6" data-tema={await temaPedido()}>
      <div className="chapa w-full max-w-sm rounded-3xl p-8">
        <p className="font-titulo text-[0.68rem] uppercase tracking-[0.22em] text-fg-faint">Parrilla</p>
        <h1 className="mt-2 font-titulo text-2xl font-semibold uppercase tracking-[0.06em]">Desde la app</h1>
        <CruzarPuente />
      </div>
    </main>
  )
}
