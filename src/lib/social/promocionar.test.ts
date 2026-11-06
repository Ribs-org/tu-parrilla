import { describe, expect, it } from 'vitest'
import {
  FALTA_CONFIRMAR_CATEGORIAS,
  GASTO_CAMBIO,
  accionesPosibles,
  aUnidadMinima,
  cuerpoCampana,
  cuerpoConjunto,
  cuerpoCreativo,
  diasDePromocion,
  etiquetaDeEstado,
  formatearMonto,
  fraseDeMeta,
  fraseDelGasto,
  horario,
  leerFormulario,
  leerMonto,
  problemaDeCuenta,
  revisarPromocion,
  type Contexto,
  type EntradaPromocion,
  type Plan,
} from './promocionar'

const CLP = { id: 'act_1', nombre: 'Mi cuenta', moneda: 'CLP', problema: null, minimoDiario: 1000 }
const USD = { id: 'act_2', nombre: 'En dólares', moneda: 'USD', problema: null, minimoDiario: 100 }

const CONTEXTO: Contexto = { network: 'instagram', hoy: '2026-11-05', cuentas: [CLP, USD], conEnlace: true }

function entrada(extra: Partial<EntradaPromocion> = {}): EntradaPromocion {
  return {
    cuentaPublicitariaId: 'act_1',
    objetivo: 'alcance',
    tipoPresupuesto: 'diario',
    monto: 5000,
    desde: '2026-11-05',
    hasta: '2026-11-11',
    paises: ['CL'],
    edadMin: 18,
    edadMax: 65,
    advantage: false,
    categorias: true,
    activar: false,
    gastoConfirmado: 35000,
    ...extra,
  }
}

function plan(extra: Partial<EntradaPromocion> = {}, contexto = CONTEXTO): Plan {
  const r = revisarPromocion(entrada(extra), contexto, false)
  if ('error' in r) throw new Error(r.error)
  return r.plan
}

describe('los montos', () => {
  it('en pesos chilenos se cuenta en pesos enteros; en dólares, en centavos', () => {
    expect(aUnidadMinima(5000, 'CLP')).toBe(5000)
    expect(aUnidadMinima(12.5, 'USD')).toBe(1250)
    expect(formatearMonto(5000, 'CLP')).toMatch(/^5000\sCLP$/)
    expect(formatearMonto(1250, 'USD')).toMatch(/^12,50\sUSD$/)
  })

  it('lee lo que escribe una persona en Chile', () => {
    expect(leerMonto('5.000')).toBe(5000)
    expect(leerMonto('5000')).toBe(5000)
    expect(leerMonto('12,50')).toBe(12.5)
    expect(leerMonto('1.234,5')).toBe(1234.5)
    expect(leerMonto('12.5')).toBe(12.5)
    expect(leerMonto('')).toBeNull()
    expect(leerMonto('cinco')).toBeNull()
    expect(leerMonto('0')).toBeNull()
  })

  it('los días van con los dos extremos', () => {
    expect(diasDePromocion('2026-11-05', '2026-11-11')).toBe(7)
    expect(diasDePromocion('2026-11-05', '2026-11-05')).toBe(1)
  })
})

describe('revisarPromocion', () => {
  it('con presupuesto diario, lo máximo es el diario por los días', () => {
    const p = plan()
    expect(p).toMatchObject({ presupuesto: 5000, gastoMaximo: 35000, dias: 7 })
    expect(fraseDelGasto(p)).toMatch(/^Vas a gastar como máximo 35\.000\sCLP: 5000\sCLP al día durante 7 días\./)
  })

  it('con presupuesto total, lo máximo es el total', () => {
    const p = plan({ tipoPresupuesto: 'total', monto: 20000 })
    expect(p.gastoMaximo).toBe(20000)
    expect(fraseDelGasto(p)).toMatch(/^Vas a gastar como máximo 20\.000\sCLP, repartido en 7 días\.$/)
  })

  it('pide el mínimo de Meta: por día, o por los días si es total', () => {
    expect(revisarPromocion(entrada({ monto: 500 }), CONTEXTO, false)).toEqual({
      error: expect.stringMatching(/^Meta pide al menos 1000\sCLP al día en esta cuenta\.$/),
    })
    expect(revisarPromocion(entrada({ tipoPresupuesto: 'total', monto: 6000 }), CONTEXTO, false)).toEqual({
      error: expect.stringMatching(/^Para 7 días, Meta pide al menos 7000\sCLP en total/),
    })
  })

  it('al confirmar, exige las categorías y el mismo gasto máximo que vio el dueño', () => {
    expect(revisarPromocion(entrada({ categorias: false }), CONTEXTO, true)).toEqual({ error: FALTA_CONFIRMAR_CATEGORIAS })
    expect(revisarPromocion(entrada({ gastoConfirmado: 30000 }), CONTEXTO, true)).toEqual({ error: GASTO_CAMBIO })
    expect(revisarPromocion(entrada({ gastoConfirmado: null }), CONTEXTO, true)).toEqual({ error: GASTO_CAMBIO })
    expect('plan' in revisarPromocion(entrada(), CONTEXTO, true)).toBe(true)
  })

  it('las fechas: sin fin no hay máximo, nada en el pasado, y un solo día solo con total', () => {
    expect(revisarPromocion(entrada({ hasta: '' }), CONTEXTO, false)).toEqual({ error: expect.stringContaining('sin fin') })
    expect(revisarPromocion(entrada({ desde: '2026-11-04' }), CONTEXTO, false)).toEqual({ error: 'El día en que empieza ya pasó.' })
    expect(revisarPromocion(entrada({ hasta: '2026-11-04' }), CONTEXTO, false)).toEqual({
      error: 'El día en que termina tiene que ir después del día en que empieza.',
    })
    expect(revisarPromocion(entrada({ hasta: '2026-11-05' }), CONTEXTO, false)).toEqual({ error: expect.stringContaining('presupuesto total') })
    expect('plan' in revisarPromocion(entrada({ hasta: '2026-11-05', tipoPresupuesto: 'total', monto: 1000, gastoConfirmado: 1000 }), CONTEXTO, true)).toBe(true)
    expect(revisarPromocion(entrada({ hasta: '2027-03-01' }), CONTEXTO, false)).toEqual({ error: 'Se puede programar hasta 90 días desde hoy.' })
  })

  it('una cuenta con problema no se puede usar, y dice por qué', () => {
    const conProblema = { ...CLP, problema: 'Esta cuenta publicitaria no tiene un medio de pago.' }
    expect(revisarPromocion(entrada(), { ...CONTEXTO, cuentas: [conProblema] }, false)).toEqual({
      error: 'Esta cuenta publicitaria no tiene un medio de pago.',
    })
  })

  it('las visitas solo se piden para Instagram con su link', () => {
    expect('plan' in revisarPromocion(entrada({ objetivo: 'trafico' }), CONTEXTO, false)).toBe(true)
    expect(revisarPromocion(entrada({ objetivo: 'trafico' }), { ...CONTEXTO, network: 'facebook' }, false)).toEqual({
      error: expect.stringContaining('Instagram'),
    })
    expect(revisarPromocion(entrada({ objetivo: 'trafico' }), { ...CONTEXTO, conEnlace: false }, false)).toEqual({
      error: expect.stringContaining('link'),
    })
  })

  it('el público: países de la lista y edades; con Advantage+, la mínima hasta 25 y sin máxima', () => {
    expect(revisarPromocion(entrada({ paises: [] }), CONTEXTO, false)).toEqual({ error: 'Elige al menos un país.' })
    expect(revisarPromocion(entrada({ paises: ['XX'] }), CONTEXTO, false)).toEqual({ error: 'Uno de los países no se puede elegir.' })
    expect(revisarPromocion(entrada({ edadMin: 40, edadMax: 30 }), CONTEXTO, false)).toEqual({ error: expect.stringContaining('edad máxima') })
    expect(revisarPromocion(entrada({ advantage: true, edadMin: 30 }), CONTEXTO, false)).toEqual({
      error: 'Con el público Advantage+, la edad mínima puede ser como mucho 25.',
    })
    expect(plan({ advantage: true, edadMin: 21 }).edadMax).toBeNull()
  })
})

describe('leerFormulario', () => {
  it('lee los campos del último paso', () => {
    const f = new FormData()
    for (const [k, v] of Object.entries({
      cuenta: 'act_1',
      objetivo: 'alcance',
      tipoPresupuesto: 'diario',
      monto: '5.000',
      desde: '2026-11-05',
      hasta: '2026-11-11',
      edadMin: '18',
      edadMax: '65',
      advantage: '0',
      categorias: '1',
      activar: '1',
      gastoConfirmado: '35000',
    })) {
      f.set(k, v)
    }
    f.append('pais', 'CL')
    f.append('pais', 'AR')
    expect(leerFormulario(f)).toMatchObject({ monto: 5000, paises: ['CL', 'AR'], categorias: true, activar: true, gastoConfirmado: 35000 })
    // Sin la casilla, no hay confirmación; sin elegir, queda en pausa.
    f.delete('categorias')
    f.delete('activar')
    expect(leerFormulario(f)).toMatchObject({ categorias: false, activar: false })
  })
})

describe('lo que se le manda a Meta', () => {
  const ig = { network: 'instagram' as const, mediaId: 'IG_M', instagramUserId: 'IG_U', paginaId: 'PAGE', enlace: 'https://tu.cl/juan?s=reel' }
  const fb = { network: 'facebook' as const, storyId: 'PAGE_POST' }

  it('la campaña nace en pausa, sin categoría especial y con el presupuesto en el conjunto', () => {
    expect(cuerpoCampana(plan(), 'n')).toEqual({
      name: 'n',
      objective: 'OUTCOME_AWARENESS',
      status: 'PAUSED',
      special_ad_categories: [],
      is_adset_budget_sharing_enabled: false,
    })
  })

  it('el conjunto lleva el presupuesto, las fechas, el público y dónde se publicó', () => {
    const inicio = new Date('2026-11-05T15:00:00Z')
    const fin = new Date('2026-11-12T02:59:00Z')
    const c = cuerpoConjunto(plan(), 'n', 'CAMP', ig, inicio, fin)
    expect(c).toMatchObject({
      campaign_id: 'CAMP',
      daily_budget: 5000,
      billing_event: 'IMPRESSIONS',
      optimization_goal: 'REACH',
      start_time: '2026-11-05T15:00:00.000Z',
      end_time: '2026-11-12T02:59:00.000Z',
      status: 'ACTIVE',
      targeting: {
        geo_locations: { countries: ['CL'] },
        age_min: 18,
        age_max: 65,
        publisher_platforms: ['instagram'],
        targeting_automation: { advantage_audience: 0 },
      },
    })
    expect(c).not.toHaveProperty('lifetime_budget')
    const total = cuerpoConjunto(plan({ tipoPresupuesto: 'total', monto: 20000 }), 'n', 'C', fb, inicio, fin)
    expect(total).toMatchObject({ lifetime_budget: 20000, targeting: { publisher_platforms: ['facebook'] } })
    const conAdvantage = cuerpoConjunto(plan({ advantage: true }), 'n', 'C', ig, inicio, fin)
    expect(conAdvantage.targeting).toMatchObject({ targeting_automation: { advantage_audience: 1 } })
    expect(conAdvantage.targeting).not.toHaveProperty('age_max')
    expect(cuerpoConjunto(plan({ objetivo: 'interaccion' }), 'n', 'C', ig, inicio, fin)).toMatchObject({
      optimization_goal: 'POST_ENGAGEMENT',
      destination_type: 'ON_POST',
    })
  })

  it('el creativo apunta a la publicación que ya existe; el link solo cuando se piden visitas', () => {
    expect(cuerpoCreativo(plan(), 'n', fb)).toEqual({ name: 'n', object_story_id: 'PAGE_POST' })
    expect(cuerpoCreativo(plan(), 'n', ig)).toEqual({ name: 'n', object_id: 'PAGE', instagram_user_id: 'IG_U', source_instagram_media_id: 'IG_M' })
    expect(cuerpoCreativo(plan({ objetivo: 'trafico' }), 'n', ig)).toMatchObject({
      call_to_action: { type: 'LEARN_MORE', value: { link: 'https://tu.cl/juan?s=reel' } },
    })
  })

  it('hoy empieza en unos minutos; otro día, a medianoche del dueño; termina a las 23:59', () => {
    const ahora = new Date('2026-11-05T15:00:00Z')
    const hoy = horario({ desde: '2026-11-05', hasta: '2026-11-06' }, '2026-11-05', ahora, 'America/Santiago')
    expect(hoy.inicio.toISOString()).toBe('2026-11-05T15:10:00.000Z')
    expect(hoy.fin.toISOString()).toBe('2026-11-07T02:59:00.000Z')
    const otro = horario({ desde: '2026-11-07', hasta: '2026-11-08' }, '2026-11-05', ahora, 'America/Santiago')
    expect(otro.inicio.toISOString()).toBe('2026-11-07T03:00:00.000Z')
  })
})

describe('la cuenta publicitaria', () => {
  it('dice por qué no se puede usar antes de intentar', () => {
    expect(problemaDeCuenta({ account_status: 1, funding_source: '123', user_tasks: ['ADVERTISE'] })).toBeNull()
    expect(problemaDeCuenta({ account_status: 1 })).toBeNull()
    expect(problemaDeCuenta({ account_status: 2 })).toMatch(/deshabilitó/)
    expect(problemaDeCuenta({ account_status: 3 })).toMatch(/pago pendiente/)
    expect(problemaDeCuenta({ account_status: 101 })).toMatch(/cerrada/)
    expect(problemaDeCuenta({ account_status: 1, funding_source: null })).toMatch(/no tiene un medio de pago/)
    expect(problemaDeCuenta({ account_status: 1, user_tasks: ['ANALYZE'] })).toMatch(/no anunciar con ella/)
  })
})

describe('fraseDeMeta', () => {
  it('lo conocido con su arreglo; lo demás, con la explicación de Meta', () => {
    expect(fraseDeMeta({ code: 190 })).toMatch(/vuelve a conectar Instagram/)
    expect(fraseDeMeta({ code: 270 })).toMatch(/administradores de la app/)
    expect(fraseDeMeta({ code: 17 })).toMatch(/esperar/)
    expect(fraseDeMeta({ code: 100, error_user_title: 'Falta el método de pago', error_user_msg: 'Agrega uno en la configuración.' })).toBe(
      'Meta no lo aceptó: Falta el método de pago: Agrega uno en la configuración.',
    )
    expect(fraseDeMeta({ code: 200, message: 'Requires ads_management' })).toMatch(/permiso para anunciar/)
    expect(fraseDeMeta({ code: 100, message: 'Invalid parameter' })).toBe('Meta no lo aceptó: Invalid parameter')
    expect(fraseDeMeta(undefined)).toMatch(/Vuelve a intentarlo/)
  })
})

describe('el estado y sus botones', () => {
  const ahora = new Date('2026-11-05T12:00:00Z')
  const despues = new Date('2026-11-10T00:00:00Z')
  const antes = new Date('2026-11-01T00:00:00Z')

  it('lo que dice Meta manda sobre lo último que pidió el dueño', () => {
    expect(etiquetaDeEstado('DISAPPROVED', 'activa', despues, ahora)).toBe('Rechazada por Meta')
    expect(etiquetaDeEstado('PENDING_REVIEW', 'activa', despues, ahora)).toBe('En revisión de Meta')
    expect(etiquetaDeEstado('CAMPAIGN_PAUSED', 'pausada', despues, ahora)).toBe('En pausa')
    expect(etiquetaDeEstado('ACTIVE', 'activa', despues, ahora)).toBe('Activa')
    expect(etiquetaDeEstado('ACTIVE', 'activa', antes, ahora)).toBe('Terminó')
    expect(etiquetaDeEstado(null, 'pausada', despues, ahora)).toBe('En pausa')
    expect(etiquetaDeEstado('ACTIVE', 'detenida', despues, ahora)).toBe('Detenida')
  })

  it('detenida no tiene vuelta; terminada solo se puede detener', () => {
    expect(accionesPosibles('activa', despues, ahora)).toEqual(['pausar', 'detener'])
    expect(accionesPosibles('pausada', despues, ahora)).toEqual(['reanudar', 'detener'])
    expect(accionesPosibles('activa', antes, ahora)).toEqual(['detener'])
    expect(accionesPosibles('detenida', despues, ahora)).toEqual([])
  })
})
