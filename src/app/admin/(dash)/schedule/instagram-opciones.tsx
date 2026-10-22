'use client'

import { useState } from 'react'
import { GroupLabel, Toggle } from '@/components/ui'
import type { CuentaDestino } from '@/lib/social/cuentas'
import { avisoSinTrial } from '@/lib/social/publish/opciones'

/**
 * Lo único que Instagram deja elegir por destino: si el reel sale como trial reel. Solo se
 * monta con exactamente un video elegido (lo decide el compositor), así que con fotos o
 * carrusel el interruptor ni existe y no manda nada. El campo lleva el id de la cuenta
 * como sufijo, igual que los de TikTok: puede haber dos bloques en el mismo formulario.
 * `inicial` es lo que tenía un borrador.
 *
 * Si Meta ya rechazó un trial reel de esta cuenta por elegibilidad (`trial-reels.ts`), lo dice
 * debajo, con la frase del rechazo. No apaga el interruptor: una cuenta que crece pasa a
 * aceptarlos, y el primero que sale lo corrige solo.
 */
export function InstagramOpciones({
  cuenta,
  inicial = false,
}: {
  cuenta: CuentaDestino & { trialReels?: 'si' | 'no' | null; trialReelsMotivo?: string | null }
  inicial?: boolean
}) {
  const [trial, setTrial] = useState(inicial)
  return (
    <div className="space-y-3 rounded-xl bg-velo/[0.04] p-4">
      <GroupLabel>Instagram · {cuenta.handle ?? 'sin nombre'}</GroupLabel>
      <Toggle
        name={`instagramTrial:${cuenta.id}`}
        label="Publicar como trial reel"
        hint="Solo lo ven quienes no te siguen. Tú decides desde Instagram cuándo compartirlo con todos."
        checked={trial}
        onChange={setTrial}
      />
      {cuenta.trialReels === 'no' ? (
        <p className="text-[0.78rem] text-caution">{avisoSinTrial(cuenta.trialReelsMotivo)}</p>
      ) : null}
    </div>
  )
}
