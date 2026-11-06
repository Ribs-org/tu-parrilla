import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { materialesDeLaCamara } from '@/lib/cocina/materiales'
import { COCINA_A_MANO } from '@/lib/cocina/latido'
import { estadoDeLaCocina, etaEnLaFila } from '@/lib/cocina/panel'
import { lugarDeUnaNueva, marcaDe } from '@/lib/cocina/pedir'
import { usoDeLaCamara } from '@/lib/cocina/subidas'
import { nombreDe } from '@/lib/vocabulario'
import { FormularioComanda } from './formulario'

export const dynamic = 'force-dynamic'

/**
 * «Pedir una comanda», dentro de La Cocina: lo que se elige de la cámara de frío (de día, la
 * nevera), que cuelga en el riel de la comanda; qué quiere que salga; la instrucción al chef; su
 * marca, y la confirmación con la fila y la hora estimada. Solo con la cocina encendida: sin ella,
 * vuelve a La Cocina, que dice cómo pedirla.
 */
export default async function PedirComandaPage() {
  const usuario = await requireUser()
  if (!usuario.cocinaDesde) redirect('/admin/ia')
  const ahora = new Date()
  // En serie, como el resto de la cocina (`src/lib/cocina/panel.ts`).
  const marca = await marcaDe(usuario.id)
  const materiales = await materialesDeLaCamara(usuario.id)
  const { subiendo, cuota } = await usoDeLaCamara(usuario.id)
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
          Eliges de tu material guardado lo que le llevas al chef de la casa, y le dices qué quieres que salga. Lo
          cocina en unas horas, o al día siguiente, y te avisa en cada paso.
        </p>
      </header>
      <FormularioComanda
        materiales={materiales}
        subiendo={subiendo}
        cuota={cuota}
        marca={marca ?? { nombre: usuario.nombre ?? '', handle: null, acento: null, ctaTexto: null }}
        antes={antes}
        eta={eta ? eta.toISOString() : null}
        avisoDeLaCocina={
          cocina.atiende === 'sola' ? null : cocina.atiende === 'a-mano' ? COCINA_A_MANO : 'La cocina está cerrada por ahora: tu comanda espera su turno.'
        }
        zona={usuario.zona}
      />
    </>
  )
}
