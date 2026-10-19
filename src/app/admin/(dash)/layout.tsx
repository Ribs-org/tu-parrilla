import { BotonTema } from '@/components/boton-tema'
import { CorteDefs } from '@/components/corte'
import { PiezaDefs } from '@/components/pieza-sushi'
import { requireUser } from '@/lib/auth'
import { avisoDeFierros } from '@/lib/parrilla'
import { getCuentas } from '@/lib/posts'
import { COLOR_DE_BARRA } from '@/lib/tema'
import { temaPedido } from '@/lib/tema-servidor'
import { guardarTema, logout } from '../actions'
import { AdminNav } from './nav'

export const metadata = { title: 'Panel', robots: { index: false, follow: false } }
// Calza la barra del navegador del teléfono con el fondo del panel, de noche o de día — el
// layout raíz se queda en el fondo viejo porque ese es el de la página pública. Sale de la
// cookie del equipo y no de la cuenta, para no leer la base dos veces: si la cuenta cambió en
// otro lado, el botón del modo la corrige al cargar.
export async function generateViewport() {
  return { themeColor: COLOR_DE_BARRA[await temaPedido()] }
}
export const dynamic = 'force-dynamic'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const usuario = await requireUser()
  // El botón de Ajustes avisa si un fierro se enfría o se apagó: Los Fierros vive adentro de
  // Ajustes, y un aviso que solo se ve ahí no lo ve nadie.
  const aviso = avisoDeFierros(await getCuentas(usuario.id), new Date())
  // El modo es de la cuenta: el mismo en el teléfono y en cualquier equipo donde se entre.
  const tema = usuario.tema

  return (
    <div className="acerado min-h-dvh bg-acero-950" data-tema={tema}>
      {/* Los degradados y siluetas que comparten todos los cortes del panel: de noche y de día. */}
      <CorteDefs />
      <PiezaDefs />
      <header className="sticky top-0 z-30 border-b border-acero-700 bg-acero-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3 sm:gap-4 sm:px-6">
          {/* En un teléfono el rótulo no cabe junto a las tres pestañas: cede su lugar. */}
          <span className="hidden font-titulo text-sm font-semibold uppercase tracking-[0.1em] sm:inline">Panel</span>
          <AdminNav esAdmin={usuario.rol === 'admin'} aviso={aviso} />
          <BotonTema key={tema} inicial={tema} guardar={guardarTema} />
          <form action={logout}>
            <button
              type="submit"
              className="rounded-lg px-3 py-1.5 text-xs font-titulo uppercase tracking-[0.1em] text-fg-faint transition-colors hover:text-fg"
            >
              Salir
            </button>
          </form>
        </div>
      </header>

      <div className="reja mx-auto max-w-6xl" aria-hidden />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  )
}
