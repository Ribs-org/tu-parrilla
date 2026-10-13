import { describe, expect, it } from 'vitest'
import { formatNumber } from './utils'
import { horaConDia, miradasDe, pieDeAyer, quemados, type Corte } from './fuego'

const ZONE = 'America/Santiago'
// 29 de septiembre de 2026, 15:00 en Chile (UTC-3 en horario de verano).
const AHORA = new Date('2026-09-29T18:00:00Z')

function corte(id: string, iso: string, targets: Corte['targets'] = []): Corte {
  return { post: { id, caption: `Corte ${id}`, scheduledAt: new Date(iso) }, targets }
}
const destino = (status: string, lastError: string | null = null): Corte['targets'][number] => ({
  id: `t-${status}`,
  network: 'instagram',
  handle: 'vicente',
  status,
  externalId: null,
  opciones: null,
  lastError,
})

describe('horaConDia', () => {
  it('lo de hoy lleva solo la hora; lo de otro día, su día y su mes delante', () => {
    // «Se quemó» no tiene ventana de fecha: sin el día, un fallo de la semana pasada se
    // lee igual que uno de esta mañana en la pantalla que dice qué pide una acción hoy.
    expect(horaConDia(new Date('2026-09-29T22:00:00Z'), AHORA, ZONE)).toBe('19:00')
    expect(horaConDia(new Date('2026-09-25T12:15:00Z'), AHORA, ZONE)).toBe('vie 25 de sep · 09:15')
  })

  it('el mes va siempre, porque un fallo puede ser de hace dos meses', () => {
    // Justamente la lista sin ventana: «mié 12» no dice si es de agosto o de este mes.
    expect(horaConDia(new Date('2026-08-12T22:30:00Z'), AHORA, ZONE)).toBe('mié 12 de ago · 18:30')
  })
})

describe('quemados', () => {
  it('cada destino fallido con su corte, y nada más', () => {
    const conFallo = corte('f', '2026-09-28T12:00:00Z', [destino('published'), destino('failed', 'Instagram rechazó la publicación.')])
    const sano = corte('s', '2026-09-28T12:00:00Z', [destino('published')])
    const q = quemados([sano, conFallo])
    expect(q).toHaveLength(1)
    expect(q[0]!.corte.post.id).toBe('f')
    expect(q[0]!.destino.status).toBe('failed')
  })

  it('el más reciente arriba: lo de hoy pide la acción antes que lo de la semana pasada', () => {
    const viejo = corte('v', '2026-09-22T12:00:00Z', [destino('failed', 'Falló.')])
    const hoy = corte('h', '2026-09-29T12:00:00Z', [destino('failed', 'Falló.')])
    const medio = corte('m', '2026-09-25T12:00:00Z', [destino('failed', 'Falló.')])
    // Entran en el orden en que los da la base, que es ascendente por hora.
    expect(quemados([viejo, medio, hoy]).map((q) => q.corte.post.id)).toEqual(['h', 'm', 'v'])
  })
})

describe('pieDeAyer', () => {
  it('cuenta los cortes servidos y solo suma las miradas cuando existen', () => {
    // El número lo formatea `formatNumber` (compacto solo desde 10000): la expectativa se
    // construye con la propia función para no fijar en este test un formato que es de
    // `utils`, y 12345 cubre la forma compacta real («12.3k») además de la estándar.
    expect(pieDeAyer(6, 1234)).toBe(`Ayer: 6 cortes servidos · ${formatNumber(1234)} miradas`)
    expect(pieDeAyer(6, 12345)).toBe(`Ayer: 6 cortes servidos · ${formatNumber(12345)} miradas`)
    expect(pieDeAyer(1, null)).toBe('Ayer: 1 corte servido')
    expect(pieDeAyer(0, null)).toBe('Ayer no salió nada.')
  })
})

describe('miradasDe', () => {
  it('suma el último día de cada post, y un post cuyo último día no trae número no aporta', () => {
    expect(
      miradasDe([
        { postId: 'a', day: '2026-09-27', views: 100 },
        { postId: 'a', day: '2026-09-28', views: 150 },
        { postId: 'b', day: '2026-09-28', views: 20 },
        { postId: 'b', day: '2026-09-27', views: 999 },
        { postId: 'c', day: '2026-09-28', views: null },
      ]),
    ).toBe(170)
  })

  it('un cero de verdad se distingue de «no se sabe»', () => {
    expect(miradasDe([{ postId: 'a', day: '2026-09-28', views: 0 }])).toBe(0)
    expect(miradasDe([{ postId: 'a', day: '2026-09-28', views: null }])).toBeNull()
    expect(miradasDe([])).toBeNull()
  })
})
