import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { estadoDeLaCocina, etaEnLaFila } from '@/lib/cocina/panel'
import { insumosSueltos, lugarDeUnaNueva, marcaDe } from '@/lib/cocina/pedir'
import { nombreDe } from '@/lib/vocabulario'
import { FormularioComanda } from './formulario'

export const dynamic = 'force-dynamic'

/**
 * «Pedir una comanda», dentro de La Cocina: el plato principal y lo que lo acompaña, que suben por
 * partes; qué quiere que salga; su marca, y la confirmación con la fila y la hora estimada. Solo con
 * la cocina encendida: sin ella, vuelve a La Cocina, que dice cómo pedirla.
 */
export default async function PedirComandaPage() {
  const usuario = await requireUser()
  if (!usuario.cocinaDesde) redirect('/admin/ia')
  const ahora = new Date()
  // En serie, como el resto de la cocina (`src/lib/cocina/panel.ts`).
  const marca = await marcaDe(usuario.id)
  const sueltos = await insumosSueltos(usuario.id)
  const cocina = await estadoDeLaCocina(ahora)
  const antes = await lugarDeUnaNueva(usuario.id, ahora)
  const eta = etaEnLaFila(antes, cocina, ahora)

  return (
    <>
      <header className="mb-6">
        <Link href="/admin/ia" className="text-sm text-fg-muted hover:text-fg">
          ← {nombreDe('/admin/ia')}
        </Link>
        <h1 className="mt-3 font-titulo text-2xl font-semibold uppercase tracking-[0.03em]">Pedir una comanda</h1>
        <p className="mt-1 max-w-2xl text-sm text-fg-muted">
          Le llevas al chef de la casa tu material crudo y le dices qué quieres que salga. Lo cocina en unas horas, o
          al día siguiente, y te avisa en cada paso.
        </p>
      </header>
      <FormularioComanda
        marca={marca ?? { nombre: usuario.nombre ?? '', handle: null, acento: null, ctaTexto: null }}
        sueltos={sueltos}
        antes={antes}
        eta={eta ? eta.toISOString() : null}
        cocinaAbierta={cocina.abierta}
        zona={usuario.zona}
      />
    </>
  )
}
