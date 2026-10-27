// Lo que devuelve `GET /api/schedule/cuentas`: las cuentas del dueño de la llave, con los dos
// ids y cómo está su conexión. Puro —la consulta vive en la ruta— para que el test lo lea sin
// base, como `schedule-api.ts`.
import { motivoDelFierro } from '@/lib/avisos/reglas'
import { isoInZone } from '@/lib/metrics-api'
import { REDES_PROXIMAMENTE } from '@/lib/networks'
import { estadoDelFierro, seRenuevaSola, type Fierro } from '@/lib/parrilla'
import type { CuentaRow } from '@/lib/posts-kpis'

export type CuentaParaApi = {
  /** El id de Tu Parrilla: el de `cuentas` al programar, `cuenta=` en las métricas y las claves de `opciones`. */
  id: string
  red: string
  handle: string | null
  /** El id que la red le da a la cuenta: el de Instagram, la página de Facebook, el canal de YouTube, el `open_id` de TikTok. */
  externalId: string | null
  /** Con credencial: sin ella, programarle se rechaza (`CUENTA_DESCONECTADA`). */
  conectada: boolean
  /** De una red en «Próximamente» (Threads, X): programarle se rechaza aunque esté conectada. */
  proximamente: boolean
  fierro: Fierro
  /** Cuándo vence el permiso, en la zona del dueño; nulo si la red lo renueva sola, si no lo dice o sin credencial. */
  vence: string | null
  /** Por qué hay que reconectarla, con la frase del resumen; nulo al rojo. */
  motivo: string | null
  /**
   * Si la cuenta acepta trial reels, aprendido de Meta al publicar: `si`, `no` o nulo mientras no
   * se sepa (y en las redes que no los tienen). Programar uno donde dice `no` se acepta igual,
   * porque una cuenta que crece pasa a aceptarlos, pero Meta lo va a rechazar.
   */
  trialReels: 'si' | 'no' | null
  /** La frase con que Meta rechazó el último, cuando `trialReels` es `no`. */
  trialReelsMotivo: string | null
}

/**
 * Cada cuenta del dueño, en el orden en que llegan (`getCuentas`: por red, en orden alfabético,
 * y dentro de una red la más antigua primero). Van todas, también las desconectadas: el panel
 * las muestra, y un agente que no las viera no sabría por qué el dueño le habla de una cuenta
 * que no está.
 */
export function cuentasParaApi(
  cuentas: readonly CuentaRow[],
  zona: string,
  ahora: Date,
  proximamente: ReadonlySet<string> = REDES_PROXIMAMENTE,
): CuentaParaApi[] {
  return cuentas.map((c) => {
    const fierro = estadoDelFierro(
      { connected: c.connected, expiraEn: c.expiresAt, ultimoError: c.lastSyncError, red: c.network },
      ahora,
    )
    return {
      id: c.id,
      red: c.network,
      handle: c.handle,
      externalId: c.externalId,
      conectada: c.connected,
      proximamente: proximamente.has(c.network),
      fierro,
      vence: c.connected && c.expiresAt && !seRenuevaSola(c.network) ? isoInZone(new Date(c.expiresAt), zona) : null,
      motivo: motivoDelFierro({ conCredencial: c.connected, lastSyncError: c.lastSyncError }, fierro),
      trialReels: c.network === 'instagram' ? (c.trialReels ?? null) : null,
      trialReelsMotivo: c.network === 'instagram' && c.trialReels === 'no' ? (c.trialReelsMotivo ?? null) : null,
    }
  })
}
