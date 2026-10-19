'use client'

import Link from 'next/link'
import { useEffect, useState, useTransition, type ReactNode } from 'react'
import { deleteScheduledPost, subirAhora } from '@/app/admin/actions'
import type { ScheduledPost, ScheduledPostTarget } from '@/db/schema'
import { cn } from '@/lib/utils'
import { CONFIRMAR_ELIMINAR, motivoDestino, nombreDestino } from './etiqueta'
import { cortarCola } from './orden'
import { Redes } from './redes'
import { Reprogramar } from './reprogramar'

// El mismo corte que la tabla de contenido: de entrada solo las primeras veinte, que
// casi siempre alcanzan para todo lo pendiente. El resto espera detrás del botón.
const VISTA_PREVIA = 20

/**
 * La lista. Cada fila llega del servidor con su corte ya dibujado (el mismo corte chico de «Se
 * quemó») y su fecha ya escrita en la zona del dueño (`diaYHora`): la página es la que sabe qué
 * cuentas están frías y en qué zona vive el dueño, y esta lista solo maneja los botones.
 */
export function Queue({
  items,
  volver,
  recien = null,
}: {
  items: Array<{
    post: ScheduledPost
    targets: Array<ScheduledPostTarget & { handle: string | null }>
    corte: ReactNode
    cuando: string
  }>
  volver: string
  /** El post recién programado: su fila se enciende una vez, y la lista la trae a la vista. */
  recien?: string | null
}) {
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  // Lo que devolvió «Subir ahora»: cuántos destinos salieron y cuántos quedaron en proceso.
  const [aviso, setAviso] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  // El recién programado puede caer lejos en la lista: se la trae a la vista una vez.
  useEffect(() => {
    if (recien) document.querySelector('[data-recien]')?.scrollIntoView({ block: 'center' })
  }, [recien])

  if (items.length === 0) {
    return <p className="py-8 text-center text-sm text-fg-faint">Nada programado todavía.</p>
  }

  const { visibles, ocultos } = cortarCola(items, VISTA_PREVIA)
  const mostrados = expanded ? items : visibles

  return (
    <>
      {error && <p className="mb-3 text-sm text-negative">{error}</p>}
      {aviso && <p className="mb-3 text-sm text-positive">{aviso}</p>}
      <ul className="space-y-3">
      {mostrados.map(({ post, targets, corte, cuando }) => (
        <li
          key={post.id}
          data-recien={post.id === recien ? '' : undefined}
          className={cn('flex items-start gap-3 rounded-xl bg-velo/[0.03] p-4', post.id === recien && 'recien')}
        >
          {/* El corte chico, como en «Se quemó»: la lista se lee igual que el calendario. El
              margen deja asomar la banderita de lo quemado sin taparla. */}
          <span className="mt-2 w-12 shrink-0">{corte}</span>
          <div className="min-w-0 flex-1">
          {/* En el teléfono los botones bajan debajo del texto: al lado, con el corte a la
              izquierda, apretaban el título a dos palabras por renglón. */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
            <div className="min-w-0">
              <p className="line-clamp-2 text-sm">{post.caption || '(sin texto)'}</p>
              {/* Escrita en el servidor, en la zona del dueño: un cliente no tiene forma de
                  saberla, y en Vercel (UTC) la lista decía otra hora que el calendario. */}
              <p className="mt-1 font-mono text-[0.72rem] text-fg-faint">{cuando}</p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <Link
                href={`/admin/schedule/${post.id}?volver=${encodeURIComponent(volver)}`}
                // Sin prefetch, como en el calendario: veinte filas eran veinte editores
                // pedidos por adelantado.
                prefetch={false}
                className="text-xs text-fg-faint hover:text-fg"
              >
                Editar
              </Link>
              {/* También en las fallidas: la acción las devuelve a pendiente antes de publicar. */}
              {targets.some(
                (t) => t.status === 'scheduled' || t.status === 'publishing' || t.status === 'failed',
              ) ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    if (!confirm('¿Subirlo ahora, sin esperar la hora programada? Se publica en tus redes de inmediato.')) return
                    start(async () => {
                      setError(null)
                      setAviso(null)
                      const result = await subirAhora(post.id)
                      if (result.error) setError(result.error)
                      else if (result.ok) setAviso(result.ok)
                    })
                  }}
                  className="text-xs text-fg-faint hover:text-fg"
                >
                  {pending ? 'Subiendo…' : 'Subir ahora'}
                </button>
              ) : null}
              {/* Pregunta, como «Subir ahora»: borrar no se deshace. Lo ya publicado en una red
                  no se puede eliminar (`borrarPostProgramado`), así que la pregunta no promete
                  borrar nada de las redes. */}
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  if (!confirm(CONFIRMAR_ELIMINAR)) return
                  start(async () => {
                    setError(null)
                    const result = await deleteScheduledPost(post.id)
                    if (result.error) setError(result.error)
                  })
                }}
                className="text-xs text-fg-faint hover:text-fg"
              >
                Eliminar
              </button>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {targets.map((target) => (
              <span
                key={target.id}
                className={cn(
                  'rounded-full px-2.5 py-1 text-xs',
                  target.status === 'published' && 'bg-positive/15 text-positive',
                  target.status === 'failed' && 'bg-negative/15 text-negative',
                  (target.status === 'scheduled' || target.status === 'publishing') &&
                    'bg-velo/[0.08] text-fg-muted',
                )}
              >
                <Redes targets={[target]} detalle />
                {/* Quemado o esperando el siguiente intento: en los dos casos el motivo es
                    lo único que dice qué hacer. */}
                {motivoDestino(target) && ` — ${motivoDestino(target)}`}
                {target.status === 'failed' && <Reprogramar targetId={target.id} titulo={nombreDestino(target)} />}
              </span>
            ))}
          </div>
          </div>
        </li>
      ))}
      </ul>
      {ocultos > 0 ? (
        <div className="mt-3 border-t border-velo/[0.06] pt-2 text-center">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="rounded px-2 py-1 font-mono text-[0.7rem] uppercase tracking-[0.14em] text-fg-faint transition-colors hover:text-fg"
          >
            {expanded
              ? 'Mostrar menos'
              : ocultos === 1
                ? 'Ver el restante'
                : `Ver los ${ocultos} restantes`}
          </button>
        </div>
      ) : null}
    </>
  )
}
