import type { Metadata } from 'next'
import Link from 'next/link'
import { ElPase } from '@/components/pase/el-pase'
import { entrarConCodigo, paseParaLaApi } from '@/lib/pase/pase'
import { PASE_NO_EXISTE } from '@/lib/pase/reglas'

export const dynamic = 'force-dynamic'

// El código es la llave: no se indexa, y el título no dice de quién es.
export const metadata: Metadata = { title: 'El Pase', robots: { index: false, follow: false } }

/**
 * El Pase por dentro, para quien revisa o quien edita según el código (`/pase/rev_…` o `/pase/edi_…`).
 * Sin sesión: el código abre el pase. El diseño, en `docs/superpowers/specs/2026-11-13-el-pase-design.md`.
 */
export default async function PasePage({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params
  const entrada = await entrarConCodigo(codigo)
  if (!entrada) {
    return (
      <main className="acerado grid min-h-dvh place-items-center bg-acero-950 px-6 text-fg" data-tema="noche">
        <div className="chapa w-full max-w-sm space-y-3 rounded-3xl p-8">
          <p className="font-titulo text-[0.68rem] uppercase tracking-[0.22em] text-fg-faint">El Pase</p>
          <h1 className="font-titulo text-2xl font-semibold uppercase tracking-[0.06em]">Este enlace no abre</h1>
          <p className="text-[0.9rem] text-fg-muted">{PASE_NO_EXISTE}</p>
          <Link href="/" className="inline-block text-[0.85rem] text-fg-muted underline underline-offset-4 hover:text-fg">
            Ir a Tu Parrilla
          </Link>
        </div>
      </main>
    )
  }
  const pase = await paseParaLaApi(entrada.pase, entrada.rol)
  return <ElPase codigo={codigo} inicial={pase} />
}
