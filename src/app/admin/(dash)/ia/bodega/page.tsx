import Link from 'next/link'
import { redirect } from 'next/navigation'
import { DeNocheYDeDia } from '@/components/de-noche-y-de-dia'
import { requireUser } from '@/lib/auth'
import { materialesDeLaCamara } from '@/lib/cocina/materiales'
import { usoDeLaCamara } from '@/lib/cocina/subidas'
import { CAMARA, nombreDe } from '@/lib/vocabulario'
import { LaCamara } from './camara'

export const dynamic = 'force-dynamic'

/**
 * La cámara de frío (de día, la nevera), dentro de La Cocina: el material en bruto del dueño, que se
 * guarda sin pedir comanda y no vence, con su cuota dibujada
 * (`docs/superpowers/specs/2026-11-02-la-bodega-design.md`). Se llama «bodega» por dentro, que es la
 * palabra que no cambia de día. Guardar pide la cocina encendida; con la cocina apagada, quien tiene
 * algo adentro igual lo ve y lo puede sacar, para hacer espacio. Sin cocina y sin nada, vuelve a La
 * Cocina, que dice cómo pedirla.
 */
export default async function LaCamaraPage() {
  const usuario = await requireUser()
  // En serie, como el resto de la cocina (`src/lib/cocina/panel.ts`).
  const materiales = await materialesDeLaCamara(usuario.id)
  if (!usuario.cocinaDesde && materiales.length === 0) redirect('/admin/ia')
  const { subiendo, cuota } = await usoDeLaCamara(usuario.id)

  return (
    <>
      <header className="mb-6">
        <Link href="/admin/ia" className="text-sm text-fg-muted hover:text-fg">
          ← {nombreDe('/admin/ia')}
        </Link>
        <h1 className="mt-3 font-titulo text-2xl font-semibold uppercase tracking-[0.03em]">
          <DeNocheYDeDia noche={CAMARA.noche} dia={CAMARA.dia} />
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-fg-muted">
          Tu material en bruto, guardado en frío: un video largo, tu intro y tu outro, tu música, tu logo, fotos. Lo que
          guardas acá no vence, y de acá sale lo que le llevas al chef en cada comanda.
        </p>
      </header>
      <LaCamara materiales={materiales} subiendo={subiendo} cuota={cuota} puedeGuardar={Boolean(usuario.cocinaDesde)} />
    </>
  )
}
