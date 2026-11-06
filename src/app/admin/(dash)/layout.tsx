import Link from 'next/link'
import { BotonTema } from '@/components/boton-tema'
import { Confirmaciones } from '@/components/confirmar'
import { CorteDefs } from '@/components/corte'
import { PiezaDefs } from '@/components/pieza-sushi'
import { requireUser } from '@/lib/auth'
import { avisoDeFierros } from '@/lib/parrilla'
import { getCuentas } from '@/lib/posts'
import { respuestasSinLeer } from '@/lib/sugerencias/responder'
import { COLOR_DE_BARRA } from '@/lib/tema'
import { PANTALLAS } from '@/lib/vocabulario'
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

/** La entrada del panel: la primera pestaña, adonde manda también `/admin`. */
const ENTRADA = PANTALLAS[0].ruta

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const usuario = await requireUser()
  // El botón de Ajustes avisa si un fierro se enfría o se apagó: Los Fierros vive adentro de
  // Ajustes, y un aviso que solo se ve ahí no lo ve nadie.
  const aviso = avisoDeFierros(await getCuentas(usuario.id), new Date())
  // Y si el equipo le respondió algo del libro de sugerencias que todavía no abre. Un punto que no
  // se pudo contar no tumba el panel entero: queda sin punto (un preview contra una base sin la
  // migración 0029, por ejemplo).
  const respuestas = await respuestasSinLeer(usuario.id).catch((error: unknown) => {
    console.error('No se pudieron contar las respuestas sin leer:', String(error).slice(0, 300))
    return 0
  })
  // El modo es de la cuenta: el mismo en el teléfono y en cualquier equipo donde se entre.
  const tema = usuario.tema

  return (
    <div className="acerado min-h-dvh bg-acero-950" data-tema={tema}>
      {/* Los degradados y siluetas que comparten todos los cortes del panel: de noche y de día. */}
      <CorteDefs />
      <PiezaDefs />
      <Confirmaciones>
        <header className="sticky top-0 z-30 border-b border-acero-700 bg-acero-950/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3 sm:gap-4 sm:px-6">
            {/* En un teléfono el rótulo no cabe junto a las cuatro pestañas: cede su lugar. Lleva a
                la entrada, como el nombre de cualquier sitio: era un rótulo quieto, y quien le hizo
                clic esperando volver al inicio creyó que estaba roto (#301). */}
            <Link
              href={ENTRADA}
              title="Volver al inicio del panel"
              className="hidden rounded-lg font-titulo text-sm font-semibold uppercase tracking-[0.1em] text-fg transition-colors hover:text-fg-faint sm:inline"
            >
              Panel
            </Link>
            <AdminNav esAdmin={usuario.rol === 'admin'} aviso={aviso} respuestas={respuestas} />
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
      </Confirmaciones>
    </div>
  )
}
