'use client'

import { useState, useTransition } from 'react'
import { descartarCreativoPropio, programarCreativoPropio } from '@/app/admin/cocina-actions'
import { Button, Textarea } from '@/components/ui'
import { MAX_NOTA_DESCARTE, MOTIVOS_DESCARTE, NOMBRE_MOTIVO, type MotivoDescarte } from '@/lib/cocina/meson-motivos'

/**
 * «Programar» y «Descartar» de un creativo del mesón. Descartar pide el motivo de un toque —el corte,
 * la letra, el tema o el audio— y, si se quiere, una nota: le queda al chef como memoria de la marca.
 */
export function AccionesDelCreativo({ id }: { id: string }) {
  const [pending, start] = useTransition()
  const [descartando, setDescartando] = useState(false)
  const [motivo, setMotivo] = useState<MotivoDescarte | null>(null)
  const [nota, setNota] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (descartando) {
    return (
      <div className="mt-3 space-y-2 border-t border-acero-700 pt-3">
        <p className="text-xs text-fg-muted">¿Por qué no sirvió?</p>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="El motivo">
          {MOTIVOS_DESCARTE.map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={motivo === m}
              onClick={() => setMotivo(m)}
              className={
                motivo === m
                  ? 'rounded-full border border-brasa bg-brasa/15 px-2.5 py-1 text-xs text-fg'
                  : 'rounded-full border border-acero-700 px-2.5 py-1 text-xs text-fg-muted hover:text-fg'
              }
            >
              {NOMBRE_MOTIVO[m]}
            </button>
          ))}
        </div>
        <Textarea
          rows={2}
          maxLength={MAX_NOTA_DESCARTE}
          placeholder="Una nota para el chef (opcional)"
          aria-label="Una nota para el chef"
          value={nota}
          onChange={(e) => setNota(e.target.value)}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="danger"
            disabled={!motivo || pending}
            onClick={() =>
              start(async () => {
                const r = await descartarCreativoPropio(id, motivo, nota)
                setError(r.error ?? null)
              })
            }
          >
            {pending ? 'Descartando…' : 'Descartar'}
          </Button>
          <Button type="button" variant="ghost" disabled={pending} onClick={() => setDescartando(false)}>
            Volver
          </Button>
        </div>
        {error ? (
          <p role="alert" className="text-xs text-negative">
            {error}
          </p>
        ) : null}
      </div>
    )
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-acero-700 pt-3">
      <Button
        type="button"
        variant="primary"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await programarCreativoPropio(id)
            if (r?.error) setError(r.error)
          })
        }
      >
        {pending ? 'Abriendo…' : 'Programar'}
      </Button>
      <Button type="button" variant="danger" disabled={pending} onClick={() => setDescartando(true)}>
        Descartar
      </Button>
      {error ? (
        <p role="alert" className="w-full text-xs text-negative">
          {error}
        </p>
      ) : null}
    </div>
  )
}
