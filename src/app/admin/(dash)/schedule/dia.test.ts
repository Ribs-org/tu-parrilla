import { describe, expect, it } from 'vitest'
import type { ScheduledPost } from '@/db/schema'
import {
  SIN_CUENTA,
  columnasDelDia,
  cortesDelDia,
  normalizarFecha,
  rotuloDelDia,
  type BorradorDelDia,
  type CuentaDelDia,
  type DestinoConHandle,
} from './dia'

const ZONA = 'America/Santiago'
const DIA = '2026-10-17'

const IG: CuentaDelDia = { id: 'ig', network: 'instagram', handle: '@ig', connected: true }
const FB: CuentaDelDia = { id: 'fb', network: 'facebook', handle: 'Página', connected: true }
const VIEJA: CuentaDelDia = { id: 'vieja', network: 'instagram', handle: '@vieja', connected: false }
const OTRA_VIEJA: CuentaDelDia = { id: 'otra', network: 'x', handle: '@x', connected: false }

function destino(id: string, accountId: string, network: string, status = 'scheduled'): DestinoConHandle {
  return {
    id,
    postId: 'p',
    network,
    accountId,
    captionOverride: null,
    status: status as DestinoConHandle['status'],
    containerId: null,
    externalId: null,
    attemptCount: 0,
    lastError: null,
    reintentarDesde: null,
    opciones: null,
    reclamadoHasta: null,
    publicandoDesde: null,
    updatedAt: new Date(),
    handle: null,
  }
}

function item(id: string, cuando: string, ...destinos: DestinoConHandle[]) {
  const post = { id, caption: id, scheduledAt: new Date(cuando) } as ScheduledPost
  return { post, targets: destinos, media: [] }
}

function borrador(id: string, cuando: string, cuentas: string[]): BorradorDelDia {
  return { id, href: `/b/${id}`, fecha: new Date(cuando), texto: id, cuentas }
}

describe('normalizarFecha', () => {
  const ahora = new Date('2026-10-16T15:00:00Z')
  it('deja un día de verdad, y lo demás es hoy en la zona del dueño', () => {
    expect(normalizarFecha('2026-10-20', ahora, ZONA)).toBe('2026-10-20')
    expect(normalizarFecha('2026-02-31', ahora, ZONA)).toBe('2026-10-16')
    expect(normalizarFecha('mañana', ahora, ZONA)).toBe('2026-10-16')
    expect(normalizarFecha(undefined, ahora, ZONA)).toBe('2026-10-16')
  })
})

describe('rotuloDelDia', () => {
  it('nombra hoy, mañana y ayer; los demás, solo el día', () => {
    expect(rotuloDelDia('2026-10-16', '2026-10-16')).toBe('Hoy · vie 16 de oct')
    expect(rotuloDelDia('2026-10-17', '2026-10-16')).toBe('Mañana · sáb 17 de oct')
    expect(rotuloDelDia('2026-10-15', '2026-10-16')).toBe('Ayer · jue 15 de oct')
    expect(rotuloDelDia('2026-10-20', '2026-10-16')).toBe('mar 20 de oct')
  })
})

describe('columnasDelDia', () => {
  it('cada cuenta conectada tiene su columna aunque esté vacía; una desconectada, solo con algo ese día', () => {
    const columnas = columnasDelDia({
      dia: DIA,
      cuentas: [IG, VIEJA, OTRA_VIEJA, FB],
      items: [item('a', '2026-10-17T15:00:00-03:00', destino('a-v', 'vieja', 'instagram', 'published'))],
      borradores: [],
      zone: ZONA,
    })
    expect(columnas.map((c) => c.clave)).toEqual(['ig', 'vieja', 'fb'])
    expect(columnas[0]!.cortes).toEqual([])
  })

  it('un post que sale a dos cuentas va en las dos, con su propio destino y el otro como «también»', () => {
    const [ig, fb] = columnasDelDia({
      dia: DIA,
      cuentas: [IG, FB],
      items: [
        item('tarde', '2026-10-17T19:00:00-03:00', destino('t-ig', 'ig', 'instagram')),
        item('doble', '2026-10-17T09:00:00-03:00', destino('d-ig', 'ig', 'instagram', 'published'), destino('d-fb', 'fb', 'facebook', 'failed')),
        item('otro-dia', '2026-10-18T09:00:00-03:00', destino('o-ig', 'ig', 'instagram')),
      ],
      borradores: [],
      zone: ZONA,
    })
    // Por hora, y sin lo de otro día.
    expect(ig!.cortes.map((c) => c.destino.id)).toEqual(['d-ig', 't-ig'])
    expect(fb!.cortes.map((c) => c.destino.id)).toEqual(['d-fb'])
    expect(fb!.cortes[0]!.otros.map((t) => t.id)).toEqual(['d-ig'])
    expect(cortesDelDia([ig!, fb!])).toBe(2)
  })

  it('el día se cuenta en la zona del dueño, no en UTC', () => {
    // 01:30 UTC del 18 son las 22:30 del 17 en Santiago.
    const [ig] = columnasDelDia({
      dia: DIA,
      cuentas: [IG],
      items: [item('noche', '2026-10-18T01:30:00Z', destino('n', 'ig', 'instagram'))],
      borradores: [],
      zone: ZONA,
    })
    expect(ig!.cortes).toHaveLength(1)
  })

  it('un borrador va en cada cuenta marcada; sin ninguna conocida, en su columna al final', () => {
    const columnas = columnasDelDia({
      dia: DIA,
      cuentas: [IG, FB],
      items: [],
      borradores: [
        borrador('ambas', '2026-10-17T10:00:00-03:00', ['ig', 'fb']),
        borrador('sin', '2026-10-17T11:00:00-03:00', []),
        borrador('ajena', '2026-10-17T12:00:00-03:00', ['ya-no-esta']),
        borrador('manana', '2026-10-18T10:00:00-03:00', ['ig']),
      ],
      zone: ZONA,
    })
    expect(columnas.map((c) => [c.clave, c.borradores.map((b) => b.id)])).toEqual([
      ['ig', ['ambas']],
      ['fb', ['ambas']],
      [SIN_CUENTA, ['sin', 'ajena']],
    ])
  })

  it('un destino de una cuenta que no está en la lista no se esconde: va al final, por red', () => {
    const columnas = columnasDelDia({
      dia: DIA,
      cuentas: [IG],
      items: [item('x', '2026-10-17T10:00:00-03:00', destino('x-1', 'desconocida', 'x'))],
      borradores: [borrador('sin', '2026-10-17T11:00:00-03:00', [])],
      zone: ZONA,
    })
    expect(columnas.map((c) => [c.clave, c.red])).toEqual([
      ['ig', null],
      ['red:x', 'x'],
      [SIN_CUENTA, null],
    ])
  })
})
