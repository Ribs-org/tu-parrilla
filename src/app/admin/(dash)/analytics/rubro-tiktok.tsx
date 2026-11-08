'use client'

import { useState, useTransition } from 'react'
import { cambiarRubroTiktokAccion } from '@/app/admin/tiktok-actions'
import { Select } from '@/components/ui'
import { RUBROS } from '@/lib/social/tiktok-rubros'

/**
 * «Tu rubro», debajo de «Cuentas parecidas a la tuya»: con qué cuentas de empresa se compara esta
 * cuenta de TikTok. Al elegir, se guarda y se pide la comparación nueva en el acto.
 */
export function RubroTiktok({ cuentaId, rubro }: { cuentaId: string; rubro: string }) {
  const [elegido, setElegido] = useState(rubro)
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null)
  const [pendiente, start] = useTransition()

  function cambiar(valor: string) {
    setElegido(valor)
    setAviso(null)
    start(async () => {
      setAviso(await cambiarRubroTiktokAccion(cuentaId, valor))
    })
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 text-[0.75rem]">
      <label className="flex items-center gap-2 text-fg-muted">
        Tu rubro
        <Select
          value={elegido}
          disabled={pendiente}
          onChange={(e) => cambiar(e.target.value)}
          className="w-auto py-1 text-[0.75rem]"
        >
          {Object.entries(RUBROS)
            .sort(([, a], [, b]) => a.localeCompare(b, 'es'))
            .map(([valor, texto]) => (
              <option key={valor} value={valor}>
                {texto}
              </option>
            ))}
        </Select>
      </label>
      {pendiente ? <span className="text-fg-faint">Pidiendo la comparación…</span> : null}
      {aviso ? (
        <span role="status" className={aviso.ok ? 'text-fg-muted' : 'text-negative'}>
          {aviso.texto}
        </span>
      ) : null}
    </div>
  )
}
