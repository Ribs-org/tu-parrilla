import { describe, expect, it } from 'vitest'
import {
  CONEXION_FALLO,
  CONEXION_POR_VENCER,
  CONEXION_VENCIDA,
  DIAS_ERROR,
  HORAS_DE_FALLIDOS,
  HORAS_ERROR,
  MAX_FALLIDOS_EN_CORREO,
  correoDeCaida,
  correoDeResumen,
  cuentasEnRiesgo,
  estaCaida,
  opcionesDelResumen,
  pistaCorta,
  resumenParaApi,
  type CuentaVigilada,
  type Fallido,
  type Resumen,
} from './reglas'

const AHORA = new Date('2026-10-17T12:00:00Z')
const DIA = 86_400_000
const ZONA = 'America/Santiago'

function cuenta(overrides: Partial<CuentaVigilada> = {}): CuentaVigilada {
  return {
    id: 'ig-1',
    network: 'instagram',
    handle: '@vicente',
    conCredencial: true,
    expiresAt: new Date(AHORA.getTime() + 40 * DIA),
    lastSyncError: null,
    ...overrides,
  }
}

describe('estaCaida', () => {
  it('una cuenta viva no está caída', () => {
    expect(estaCaida(cuenta(), AHORA)).toBe(false)
  })

  it('la sincronización rota, el permiso vencido o una baja desde Facebook: caída', () => {
    expect(estaCaida(cuenta({ lastSyncError: 'Graph 190' }), AHORA)).toBe(true)
    expect(estaCaida(cuenta({ expiresAt: new Date(AHORA.getTime() - 1) }), AHORA)).toBe(true)
    expect(estaCaida(cuenta({ conCredencial: false, lastSyncError: 'Quitaste la app desde Facebook: vuelve a conectar.' }), AHORA)).toBe(true)
  })

  it('«Desconectar» deja la cuenta sin credencial y sin error: fue el dueño, no avisa', () => {
    expect(estaCaida(cuenta({ conCredencial: false, expiresAt: null }), AHORA)).toBe(false)
  })

  it('enfriándose todavía no es caída: eso va en el resumen, no en el correo de la caída', () => {
    expect(estaCaida(cuenta({ expiresAt: new Date(AHORA.getTime() + 2 * DIA) }), AHORA)).toBe(false)
  })

  it('TikTok no cae por la fecha de su token corto, que se renueva solo', () => {
    expect(estaCaida(cuenta({ network: 'tiktok', expiresAt: new Date(AHORA.getTime() - DIA) }), AHORA)).toBe(false)
  })
})

describe('cuentasEnRiesgo', () => {
  it('las frías y las que se enfrían, cada una con su motivo; las vivas y las desconectadas a propósito, fuera', () => {
    const vence = new Date(AHORA.getTime() + 2 * DIA)
    const riesgo = cuentasEnRiesgo(
      [
        cuenta({ id: 'viva' }),
        cuenta({ id: 'rota', lastSyncError: 'Graph 190' }),
        cuenta({ id: 'vencida', expiresAt: new Date(AHORA.getTime() - DIA) }),
        cuenta({ id: 'pronto', expiresAt: vence }),
        cuenta({ id: 'apagada', conCredencial: false, expiresAt: null }),
      ],
      AHORA,
    )
    expect(riesgo.map((c) => [c.cuentaId, c.fierro, c.motivo])).toEqual([
      ['rota', 'frio', CONEXION_FALLO],
      ['vencida', 'frio', CONEXION_VENCIDA],
      ['pronto', 'enfriandose', CONEXION_POR_VENCER],
    ])
    expect(riesgo.find((c) => c.cuentaId === 'pronto')!.vence).toEqual(vence)
  })

  it('una red que renueva su token sola no dice cuándo vence: su fecha es la del token corto', () => {
    const [tiktok] = cuentasEnRiesgo([cuenta({ network: 'tiktok', lastSyncError: 'x' })], AHORA)
    expect(tiktok!.vence).toBeNull()
  })
})

describe('pistaCorta', () => {
  const ig = { id: 'ig-1', network: 'instagram', handle: '@ig' }
  const tt = { id: 'tt-1', network: 'tiktok', handle: '@tt' }
  const fb = { id: 'fb-1', network: 'facebook', handle: 'Página' }

  it('entra la cuenta con menos días que el umbral, y la que no tiene nada; las más cortas primero', () => {
    const ultimas = new Map([
      ['ig-1', new Date(AHORA.getTime() + 2.5 * DIA)],
      ['fb-1', new Date(AHORA.getTime() + 10 * DIA)],
    ])
    expect(pistaCorta([ig, tt, fb], ultimas, AHORA, 3)).toEqual([
      { cuentaId: 'tt-1', red: 'tiktok', handle: '@tt', ultima: null, dias: 0 },
      { cuentaId: 'ig-1', red: 'instagram', handle: '@ig', ultima: ultimas.get('ig-1'), dias: 2 },
    ])
  })

  it('con justo el umbral, ya no entra', () => {
    const ultimas = new Map([['ig-1', new Date(AHORA.getTime() + 3 * DIA)]])
    expect(pistaCorta([ig], ultimas, AHORA, 3)).toEqual([])
  })
})

describe('opcionesDelResumen', () => {
  it('sin parámetros, tres días de pista y las últimas 24 horas', () => {
    expect(opcionesDelResumen(null, null)).toEqual({ dias: 3, horas: 24 })
  })

  it('acepta enteros dentro del rango', () => {
    expect(opcionesDelResumen('7', '48')).toEqual({ dias: 7, horas: 48 })
  })

  it('fuera de rango o que no es entero: la frase de cada uno', () => {
    for (const mal of ['0', '31', '2.5', 'tres', '']) expect(opcionesDelResumen(mal, null)).toEqual({ error: DIAS_ERROR })
    for (const mal of ['0', '169', '-1']) expect(opcionesDelResumen(null, mal)).toEqual({ error: HORAS_ERROR })
  })
})

const fallido: Fallido = {
  postId: 'p1',
  fecha: new Date('2026-10-17T02:00:00Z'),
  texto: 'Cinco errores al pedir un aumento',
  red: 'instagram',
  cuentaId: 'ig-1',
  handle: '@vicente',
  error: 'Instagram rechazó la publicación.',
  intentos: 3,
}

describe('resumenParaApi', () => {
  it('las horas van con el offset de la zona del dueño, como el resto de la API', () => {
    const r: Resumen = {
      fallidos: [fallido],
      cuentas: [{ cuentaId: 'ig-1', red: 'instagram', handle: '@vicente', fierro: 'enfriandose', vence: new Date('2026-10-19T15:00:00Z'), motivo: CONEXION_POR_VENCER }],
      pista: [{ cuentaId: 'tt-1', red: 'tiktok', handle: '@tt', ultima: null, dias: 0 }],
      meson: [{ comanda: 'video9.mp4', cuantos: 2, vence: new Date('2026-10-20T15:00:00Z') }],
    }
    // Lo del mesón va solo en el correo: la API sigue con sus tres secciones.
    expect(resumenParaApi(r, ZONA, AHORA, { dias: 3, horas: 24 })).toEqual({
      generado: '2026-10-17T09:00:00-03:00',
      horas: 24,
      dias: 3,
      fallidos: [{ ...fallido, fecha: '2026-10-16T23:00:00-03:00' }],
      cuentas: [{ cuentaId: 'ig-1', red: 'instagram', handle: '@vicente', fierro: 'enfriandose', vence: '2026-10-19T12:00:00-03:00', motivo: CONEXION_POR_VENCER }],
      pista: [{ cuentaId: 'tt-1', red: 'tiktok', handle: '@tt', ultima: null, dias: 0 }],
    })
  })
})

describe('correoDeCaida', () => {
  it('dice qué cuenta, qué se pierde y adónde ir', () => {
    const correo = correoDeCaida({ red: 'tiktok', handle: '@vicente', vencida: false }, 13, 'https://tu-parrilla.cl')
    expect(correo.subject).toBe('Se cayó la conexión con TikTok · @vicente')
    expect(correo.text).toContain('TikTok dejó de aceptar la conexión de Tu Parrilla con TikTok · @vicente.')
    expect(correo.text).toContain('Tiene 13 publicaciones por salir ahí')
    expect(correo.text).toContain('https://tu-parrilla.cl/admin/accounts')
  })

  it('vencida lo dice así, y sin nada programado no inventa pérdidas', () => {
    const correo = correoDeCaida({ red: 'instagram', handle: null, vencida: true }, 0, '')
    expect(correo.text).toContain('Venció el permiso de Tu Parrilla para publicar en Instagram.')
    expect(correo.text).toContain('Lo que programes ahí no va a salir')
    expect(correo.text).toContain('Reconéctala en Los Fierros: /admin/accounts')
  })

  it('una sola publicación va en singular', () => {
    expect(correoDeCaida({ red: 'x', handle: '@v', vencida: false }, 1, '').text).toContain('Tiene 1 publicación por salir')
  })

  it('de día manda a Los Cuchillos, como se llama la pantalla en ese modo', () => {
    const correo = correoDeCaida({ red: 'instagram', handle: null, vencida: true }, 0, '', 'dia')
    expect(correo.text).toContain('Reconéctala en Los Cuchillos: /admin/accounts')
    expect(correo.text).not.toContain('Los Fierros')
  })
})

describe('correoDeResumen', () => {
  const vacio: Resumen = { fallidos: [], cuentas: [], pista: [], meson: [] }

  it('sin nada que contar no hay correo', () => {
    expect(correoDeResumen(vacio, ZONA, '', AHORA)).toBeNull()
  })

  it('el asunto cuenta cada sección, y el cuerpo nombra cada cosa con su enlace', () => {
    const correo = correoDeResumen(
      {
        fallidos: [fallido],
        cuentas: [{ cuentaId: 'tt-1', red: 'tiktok', handle: '@tt', fierro: 'frio', vence: null, motivo: CONEXION_FALLO }],
        pista: [
          { cuentaId: 'ig-1', red: 'instagram', handle: '@vicente', ultima: new Date('2026-10-18T22:00:00Z'), dias: 1 },
          { cuentaId: 'fb-1', red: 'facebook', handle: 'Página', ultima: null, dias: 0 },
        ],
        meson: [],
      },
      ZONA,
      'https://tu-parrilla.cl',
      AHORA,
    )!
    expect(correo.subject).toBe('Tu parrilla hoy: 1 destino quemado, 1 cuenta por reconectar, 2 cuentas con poca parrilla')
    expect(correo.text).toContain('Instagram · @vicente · «Cinco errores al pedir un aumento» — Instagram rechazó la publicación.')
    expect(correo.text).toContain('https://tu-parrilla.cl/admin/schedule')
    expect(correo.text).toContain(`TikTok · @tt — ${CONEXION_FALLO}`)
    expect(correo.text).toContain('https://tu-parrilla.cl/admin/accounts')
    expect(correo.text).toContain('Facebook · Página — no tiene nada programado.')
    expect(correo.text).toContain('Instagram · @vicente — lo último sale el')
  })

  it('lo que vence en el mesón: cuántos por comanda y desde cuándo, con su enlace, y de día en la bandeja', () => {
    const meson = [
      { comanda: 'video9.mp4', cuantos: 3, vence: new Date('2026-10-20T15:00:00Z') },
      { comanda: null, cuantos: 1, vence: new Date('2026-10-22T15:00:00Z') },
    ]
    const correo = correoDeResumen({ ...vacio, meson }, ZONA, 'https://tu-parrilla.cl', AHORA)!
    expect(correo.subject).toBe('Tu parrilla hoy: 4 creativos por vencer en el mesón')
    expect(correo.text).toContain('El mesón: lo que nadie programa en 30 días se borra (4):')
    expect(correo.text).toContain('- video9.mp4: 3 creativos, desde el')
    expect(correo.text).toContain('- Una comanda: 1 creativo, desde el')
    expect(correo.text).toContain('https://tu-parrilla.cl/admin/ia/meson')
    expect(correo.text).toContain('salvo lo del mesón')

    const deDia = correoDeResumen({ ...vacio, meson: meson.slice(1) }, ZONA, '', AHORA, 'dia')!
    expect(deDia.subject).toContain('1 creativo por vencer en la bandeja')
    expect(deDia.text).toContain('La bandeja: lo que nadie programa en 30 días se borra (1):')
  })

  it('con muchos quemados nombra los primeros y cuenta el resto', () => {
    const muchos = Array.from({ length: MAX_FALLIDOS_EN_CORREO + 4 }, (_, i) => ({ ...fallido, postId: `p${i}` }))
    const correo = correoDeResumen({ ...vacio, fallidos: muchos }, ZONA, '', AHORA)!
    expect(correo.text).toContain('y 4 más.')
    expect(correo.text.match(/^- /gm)).toHaveLength(MAX_FALLIDOS_EN_CORREO)
  })

  it('de día, lo que falló se echó a perder: nombra la sección y las pantallas como las ve la persona', () => {
    const correo = correoDeResumen(
      {
        fallidos: [fallido],
        cuentas: [{ cuentaId: 'tt-1', red: 'tiktok', handle: '@tt', fierro: 'frio', vence: null, motivo: CONEXION_FALLO }],
        pista: [{ cuentaId: 'fb-1', red: 'facebook', handle: 'Página', ultima: null, dias: 0 }],
        meson: [],
      },
      ZONA,
      'https://tu-parrilla.cl',
      AHORA,
      'dia',
    )!
    expect(correo.subject).toBe('Tu barra hoy: 1 destino echado a perder, 1 cuenta por reconectar, 1 cuenta con poco en la barra')
    expect(correo.text).toContain(`Se echaron a perder en las últimas ${HORAS_DE_FALLIDOS} horas (1):`)
    expect(correo.text).toContain('Revísalos en «Se echó a perder», en La Barra: https://tu-parrilla.cl/admin/schedule')
    expect(correo.text).toContain('Reconéctalas en Los Cuchillos: https://tu-parrilla.cl/admin/accounts')
    expect(correo.text).not.toMatch(/quem|La Parrilla|Los Fierros/i)
  })

  it('sin modo, la noche: el correo de siempre', () => {
    const correo = correoDeResumen({ ...vacio, fallidos: [fallido] }, ZONA, '', AHORA)!
    expect(correo.subject).toBe('Tu parrilla hoy: 1 destino quemado')
    expect(correo.text).toContain('Revísalos en «Se quemó», en La Parrilla')
  })
})
