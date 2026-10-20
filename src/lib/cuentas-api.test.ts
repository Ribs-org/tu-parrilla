import { describe, expect, it } from 'vitest'
import { CONEXION_DESCONECTADA, CONEXION_FALLO, CONEXION_POR_VENCER, CONEXION_VENCIDA } from './avisos/reglas'
import { cuentasParaApi } from './cuentas-api'
import type { CuentaRow } from './posts-kpis'

const AHORA = new Date('2026-10-20T12:00:00Z')
const DIA = 86_400_000
const ZONA = 'America/Santiago'

function cuenta(parcial: Partial<CuentaRow> = {}): CuentaRow {
  return {
    id: 'cuenta-1',
    network: 'instagram',
    handle: '@vicente',
    externalId: '17841400000000000',
    connected: true,
    lastSyncedAt: null,
    lastSyncError: null,
    expiresAt: null,
    ...parcial,
  }
}

function enDias(dias: number): string {
  return new Date(AHORA.getTime() + dias * DIA).toISOString()
}

describe('cuentasParaApi', () => {
  it('da el id de Tu Parrilla, el de la red, la red y el handle de cada cuenta, en el orden en que llegan', () => {
    const lista = cuentasParaApi(
      [cuenta(), cuenta({ id: 'cuenta-2', network: 'tiktok', handle: '@otra', externalId: 'open-id-9' })],
      ZONA,
      AHORA,
    )
    expect(lista.map(({ id, red, handle, externalId }) => ({ id, red, handle, externalId }))).toEqual([
      { id: 'cuenta-1', red: 'instagram', handle: '@vicente', externalId: '17841400000000000' },
      { id: 'cuenta-2', red: 'tiktok', handle: '@otra', externalId: 'open-id-9' },
    ])
  })

  it('una cuenta viva está al rojo y sin motivo, y dice cuándo vence en la zona del dueño', () => {
    const [viva] = cuentasParaApi([cuenta({ expiresAt: '2026-12-01T13:00:00.000Z' })], ZONA, AHORA)
    expect(viva).toMatchObject({ conectada: true, fierro: 'al-rojo', motivo: null, vence: '2026-12-01T10:00:00-03:00' })
  })

  it('la que vence en la semana se enfría, con la frase del resumen', () => {
    const [pronto] = cuentasParaApi([cuenta({ expiresAt: enDias(2) })], ZONA, AHORA)
    expect(pronto).toMatchObject({ fierro: 'enfriandose', motivo: CONEXION_POR_VENCER })
    expect(pronto!.vence).not.toBeNull()
  })

  it('una red que renueva sola su credencial no dice cuándo vence: la fecha es la de un token corto', () => {
    const [tiktok] = cuentasParaApi([cuenta({ network: 'tiktok', expiresAt: enDias(1) })], ZONA, AHORA)
    expect(tiktok).toMatchObject({ fierro: 'al-rojo', vence: null, motivo: null })
  })

  it('distingue la desconectada a propósito de la que se cayó', () => {
    const [aProposito, deBaja, rota, vencida] = cuentasParaApi(
      [
        cuenta({ connected: false, expiresAt: enDias(30) }),
        cuenta({ connected: false, lastSyncError: 'Quitaron la app desde Facebook' }),
        cuenta({ lastSyncError: 'Graph 190' }),
        cuenta({ expiresAt: enDias(-1) }),
      ],
      ZONA,
      AHORA,
    )
    expect(aProposito).toMatchObject({ conectada: false, fierro: 'frio', motivo: CONEXION_DESCONECTADA, vence: null })
    expect(deBaja).toMatchObject({ conectada: false, fierro: 'frio', motivo: CONEXION_FALLO })
    expect(rota).toMatchObject({ conectada: true, fierro: 'frio', motivo: CONEXION_FALLO })
    expect(vencida).toMatchObject({ conectada: true, fierro: 'frio', motivo: CONEXION_VENCIDA })
    expect(vencida!.vence).not.toBeNull()
  })

  it('marca las cuentas de una red en «Próximamente», aunque estén conectadas', () => {
    const lista = cuentasParaApi([cuenta({ network: 'threads' }), cuenta({ network: 'x' }), cuenta()], ZONA, AHORA)
    expect(lista.map((c) => [c.red, c.proximamente])).toEqual([
      ['threads', true],
      ['x', true],
      ['instagram', false],
    ])
  })
})
