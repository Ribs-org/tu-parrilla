'use client'

import { useState, useTransition } from 'react'
import { busquedasTiktokAccion } from '@/app/admin/tiktok-actions'
import { Button, GroupLabel, Input } from '@/components/ui'
import type { CuentaDestino } from '@/lib/social/cuentas'

export const TITULO_BUSQUEDAS = 'Lo que se busca en TikTok'
export const VER_BUSQUEDAS = 'Ver qué se busca'
export const BUSCAR_IDEAS = 'Ideas para…'

/**
 * «Lo que se busca en TikTok», debajo del bloque de TikTok de una cuenta con TikTok for Business
 * (`tiktok-numeros.ts`): las búsquedas en tendencia para esa cuenta, o las recomendadas para lo que
 * escribas en «Ideas para…». No pide nada hasta que se aprieta —TikTok da 40 llamadas por minuto y
 * el servidor recuerda cada respuesta seis horas—. Tocar una palabra la suma al final del texto.
 */
export function BusquedasTiktok({ cuenta, captionId }: { cuenta: CuentaDestino; captionId: string }) {
  const [palabras, setPalabras] = useState<string[] | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [consulta, setConsulta] = useState('')
  const [pendiente, start] = useTransition()

  function pedir(texto: string | null) {
    setAviso(null)
    start(async () => {
      const r = await busquedasTiktokAccion(cuenta.id, texto)
      if ('error' in r) {
        setPalabras(null)
        setAviso(r.error)
      } else {
        setPalabras(r.palabras)
        if (r.palabras.length === 0) setAviso('TikTok no dio búsquedas esta vez.')
      }
    })
  }

  /** Al final del texto, separada por un espacio; el `input` es el que guarda el borrador. */
  function agregar(palabra: string) {
    const campo = document.getElementById(captionId) as HTMLTextAreaElement | null
    if (!campo) return
    const antes = campo.value.trimEnd()
    campo.value = antes ? `${antes} ${palabra}` : palabra
    campo.dispatchEvent(new Event('input', { bubbles: true }))
  }

  return (
    <div className="space-y-2 rounded-lg border border-acero-700 p-3">
      <GroupLabel>
        {TITULO_BUSQUEDAS} · {cuenta.handle ?? 'sin nombre'}
      </GroupLabel>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="ghost" disabled={pendiente} onClick={() => pedir(null)}>
          {pendiente ? 'Buscando…' : VER_BUSQUEDAS}
        </Button>
        <Input
          aria-label={BUSCAR_IDEAS}
          placeholder={BUSCAR_IDEAS}
          value={consulta}
          maxLength={255}
          onChange={(e) => setConsulta(e.target.value)}
          onKeyDown={(e) => {
            // Enter no programa el post: pide las ideas.
            if (e.key === 'Enter') {
              e.preventDefault()
              if (consulta.trim()) pedir(consulta)
            }
          }}
          className="max-w-[14rem]"
        />
        <Button type="button" variant="ghost" disabled={pendiente || !consulta.trim()} onClick={() => pedir(consulta)}>
          Buscar
        </Button>
      </div>
      {palabras && palabras.length > 0 ? (
        <>
          <ul className="flex flex-wrap gap-1.5">
            {palabras.map((p) => (
              <li key={p}>
                <button
                  type="button"
                  onClick={() => agregar(p)}
                  className="rounded-full border border-acero-600 px-2.5 py-0.5 text-[0.78rem] text-fg-muted transition-colors hover:text-fg"
                >
                  {p}
                </button>
              </li>
            ))}
          </ul>
          <p className="text-[0.72rem] text-fg-faint">Toca una para sumarla al final del texto.</p>
        </>
      ) : null}
      {aviso ? (
        <p role="status" className="text-[0.75rem] text-fg-faint">
          {aviso}
        </p>
      ) : null}
    </div>
  )
}
