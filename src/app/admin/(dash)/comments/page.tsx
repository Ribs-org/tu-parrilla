import Link from 'next/link'
import { Panel } from '@/components/charts/panel'
import { requireUser } from '@/lib/auth'
import { leerAjuste } from '@/lib/ajustes'
import {
  contarPendientes,
  ESTADOS_COLA,
  getCola,
  getComentariosQueFaltan,
  type EstadoCola,
} from '@/lib/comentarios-cola'
import {
  CLAVE_INSTRUCCIONES,
  INSTRUCCIONES_POR_DEFECTO,
  TOPE_INSTRUCCIONES,
} from '@/lib/social/comentarios/instrucciones'
import { privadoActivo } from '@/lib/social/comentarios/privado'
import { networkLabel } from '@/lib/networks'
import { proximamentePara } from '@/lib/redes-abiertas'
import { permisosExtraDeThreads } from '@/lib/social/threads'
import { cn } from '@/lib/utils'
import { Encabezado } from '@/components/ui'
import { Cola } from './cola'
import { Faltantes } from './faltantes'
import { Instrucciones } from './instrucciones'

export const dynamic = 'force-dynamic'

const REDES = ['instagram', 'facebook', 'youtube'] as const

/**
 * Los botones de red de este dueño. Threads solo aparece donde ya trae respuestas: abierta para
 * él (`proximamentePara`, la cuenta del revisor de Meta) y con sus permisos de lectura pedidos
 * (`permisosExtraDeThreads`). Para los demás está en «Próximamente» y su botón no filtraría nada.
 */
function redesDe(ownerId: string): readonly string[] {
  const conThreads = permisosExtraDeThreads() && !proximamentePara(ownerId).has('threads')
  return conThreads ? [...REDES, 'threads'] : REDES
}

const ETIQUETA_ESTADO: Record<EstadoCola, string> = {
  pendientes: 'Pendientes',
  enviados: 'Enviados',
  automaticas: 'Automáticas',
  descartados: 'Descartados',
  todos: 'Todos',
}

function href(estado: EstadoCola, red: string | null): string {
  const p = new URLSearchParams()
  if (estado !== 'pendientes') p.set('estado', estado)
  if (red) p.set('red', red)
  const q = p.toString()
  return q ? `/admin/comments?${q}` : '/admin/comments'
}

export default async function CommentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  // La hora con que se arma la página: «hace 3 horas» parte de ella.
  const ahora = new Date()
  const estado = (ESTADOS_COLA as readonly string[]).includes(String(params.estado))
    ? (params.estado as EstadoCola)
    : 'pendientes'
  const { id: ownerId } = await requireUser()
  const redes = redesDe(ownerId)
  const red = redes.includes(String(params.red)) ? String(params.red) : null
  const [filas, pendientes, instrucciones, faltantes] = await Promise.all([
    getCola(ownerId, { estado, red }),
    contarPendientes(ownerId, red),
    leerAjuste(ownerId, CLAVE_INSTRUCCIONES),
    // Solo Instagram cuenta comentarios que no entrega: con otra red elegida, no se pregunta.
    red === null || red === 'instagram' ? getComentariosQueFaltan(ownerId, ahora) : Promise.resolve([]),
  ])

  const chip = (activo: boolean) =>
    cn(
      'rounded-full px-3 py-1 text-[0.72rem] transition-colors',
      activo ? 'bg-velo/[0.12] text-fg' : 'bg-velo/[0.04] text-fg-muted hover:text-fg',
    )

  return (
    <>
      <header className="mb-6">
        <Encabezado ruta="/admin/comments" />
        <p className="mt-1 text-sm text-fg-muted">
          {pendientes === 0
            ? 'No hay nada esperando respuesta.'
            : pendientes === 1
              ? 'Un comentario espera tu respuesta.'
              : `${pendientes} comentarios esperan tu respuesta.`}
        </p>
      </header>

      <Panel
        title="Instrucciones para el modelo"
        hint="Se guardan en la base y rigen desde el siguiente borrador."
        className="mb-6"
      >
        <Instrucciones valor={instrucciones ?? INSTRUCCIONES_POR_DEFECTO} tope={TOPE_INSTRUCCIONES} />
      </Panel>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {ESTADOS_COLA.map((e) => (
          <Link key={e} href={href(e, red)} className={chip(e === estado)}>
            {ETIQUETA_ESTADO[e]}
          </Link>
        ))}
        <span className="mx-1 text-fg-faint">·</span>
        <Link href={href(estado, null)} className={chip(red === null)}>Todas</Link>
        {redes.map((r) => (
          <Link key={r} href={href(estado, r)} className={chip(red === r)}>
            {networkLabel(r)}
          </Link>
        ))}
      </div>

      <Faltantes publicaciones={faltantes} />

      <Cola filas={filas} mostrarPrivado={privadoActivo(ownerId)} estado={estado} desde={ahora.getTime()} />
    </>
  )
}
