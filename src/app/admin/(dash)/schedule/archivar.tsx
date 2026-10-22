'use client'

import { useState, useTransition } from 'react'
import { archivarDestinoQuemado, desarchivarDestinoQuemado } from '@/app/admin/actions'

/**
 * «Archivar» un destino quemado que ya no pide nada —se volvió a programar aparte, era una
 * prueba—, o «Desarchivar» uno archivado. Sin confirmación: no se pierde nada, el destino sigue
 * con su error y se desarchiva desde el editor del post.
 *
 * Al archivar desde «Se quemó» la fila se va sola: la acción repinta la página.
 */
export function Archivar({
  targetId,
  archivado = false,
  className,
}: {
  targetId: string
  archivado?: boolean
  className?: string
}) {
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function cambiar() {
    start(async () => {
      setError(null)
      const resultado = await (archivado ? desarchivarDestinoQuemado(targetId) : archivarDestinoQuemado(targetId))
      if (resultado.error) setError(resultado.error)
    })
  }

  return (
    <>
      <button type="button" disabled={pending} onClick={cambiar} className={className}>
        {pending ? (archivado ? 'Desarchivando…' : 'Archivando…') : archivado ? 'Desarchivar' : 'Archivar'}
      </button>
      {error ? (
        <span role="alert" className="text-[0.75rem] text-negative">
          {error}
        </span>
      ) : null}
    </>
  )
}
