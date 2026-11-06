import { NextResponse } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

// Se doblan la llave, el usuario y lo que hay detrás de la puerta: lo que se prueba acá es la
// puerta de la cámara para la API —sin una llave con dueño no se abre nada, con la cocina apagada
// no se sube— y que cada ruta le pase al dueño de la llave a las mismas respuestas del panel y del
// teléfono (`subidas-http.ts`, que prueban `subidas.integracion.test.ts` y compañía).
const dueno = vi.fn()
vi.mock('@/lib/llaves', () => ({ duenoDeLaLlave: (...a: unknown[]) => dueno(...a) }))
const buscar = vi.fn()
vi.mock('@/lib/usuarios', () => ({ buscarPorId: (...a: unknown[]) => buscar(...a) }))
const materiales = vi.fn()
vi.mock('@/lib/cocina/materiales', () => ({ materialesDeLaCamara: (...a: unknown[]) => materiales(...a) }))
const uso = vi.fn()
vi.mock('@/lib/cocina/subidas', async (importOriginal) => {
  const real = await importOriginal<typeof import('@/lib/cocina/subidas')>()
  return { ...real, usoDeLaCamara: (...a: unknown[]) => uso(...a) }
})
const respondio = vi.fn()
const respuesta = (nombre: string) => (...a: unknown[]) => {
  respondio(nombre, ...a)
  return NextResponse.json({ por: nombre })
}
vi.mock('@/lib/cocina/subidas-http', () => ({
  responderAbrir: respuesta('abrir'),
  responderEstado: respuesta('estado'),
  responderAbortar: respuesta('abortar'),
  responderPartes: respuesta('partes'),
  responderCerrar: respuesta('cerrar'),
}))

const camara = await import('./route')
const subidas = await import('./subidas/route')
const una = await import('./subidas/[id]/route')
const partes = await import('./subidas/[id]/partes/route')
const cerrar = await import('./subidas/[id]/cerrar/route')
const { COCINA_APAGADA } = await import('@/lib/cocina/subidas')

const CON_COCINA = { id: 'usuario-7', cocinaDesde: new Date('2026-10-22T12:00:00Z') }
const SIN_COCINA = { id: 'usuario-7', cocinaDesde: null }
const ID = { params: Promise.resolve({ id: 'subida-1' }) }

function peticion(metodo = 'POST', cuerpo?: unknown): Request {
  return new Request('https://ejemplo.cl/api/bodega', {
    method: metodo,
    headers: { authorization: 'Bearer tp_llave', 'content-type': 'application/json' },
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  dueno.mockResolvedValue('usuario-7')
  buscar.mockResolvedValue(CON_COCINA)
})

describe('/api/bodega — la puerta', () => {
  it('sin una llave que sirva es 401 en todas, y nadie responde detrás', async () => {
    dueno.mockResolvedValue(null)
    const todas = [
      camara.GET(peticion('GET')),
      subidas.POST(peticion('POST', {})),
      una.GET(peticion('GET'), ID),
      una.DELETE(peticion('DELETE'), ID),
      partes.POST(peticion('POST', { partes: [1] }), ID),
      cerrar.POST(peticion('POST'), ID),
    ]
    for (const r of await Promise.all(todas)) {
      expect(r.status).toBe(401)
      expect(await r.text()).toBe('No autorizado')
    }
    expect(buscar).not.toHaveBeenCalled()
    expect(respondio).not.toHaveBeenCalled()
  })

  it('una llave cuyo dueño ya no existe tampoco abre', async () => {
    buscar.mockResolvedValue(null)
    const r = await subidas.POST(peticion('POST', {}))
    expect(r.status).toBe(401)
    expect(respondio).not.toHaveBeenCalled()
  })

  it('con la cocina apagada no se lista, no se abre, no se firma ni se cierra', async () => {
    buscar.mockResolvedValue(SIN_COCINA)
    const todas = [camara.GET(peticion('GET')), subidas.POST(peticion('POST', {})), partes.POST(peticion('POST', {}), ID), cerrar.POST(peticion('POST'), ID)]
    for (const r of await Promise.all(todas)) {
      expect(r.status).toBe(403)
      expect(await r.json()).toEqual({ error: COCINA_APAGADA })
    }
    expect(respondio).not.toHaveBeenCalled()
  })

  it('con la cocina apagada igual se mira y se aborta una subida: lo propio se puede limpiar', async () => {
    buscar.mockResolvedValue(SIN_COCINA)
    expect((await una.GET(peticion('GET'), ID)).status).toBe(200)
    expect((await una.DELETE(peticion('DELETE'), ID)).status).toBe(200)
    expect(respondio.mock.calls.map((c) => c[0])).toEqual(['estado', 'abortar'])
  })
})

describe('/api/bodega — detrás de la puerta, el dueño de la llave', () => {
  it('cada ruta llama a su respuesta con el usuario de la llave y el id de la ruta', async () => {
    await subidas.POST(peticion('POST', { nombre: 'intro.mp4' }))
    await una.GET(peticion('GET'), ID)
    await una.DELETE(peticion('DELETE'), ID)
    await partes.POST(peticion('POST', { partes: [1] }), ID)
    await cerrar.POST(peticion('POST'), ID)
    const llamadas = respondio.mock.calls
    expect(llamadas.map((c) => c[0])).toEqual(['abrir', 'estado', 'abortar', 'partes', 'cerrar'])
    for (const c of llamadas) expect(c[1]).toBe(CON_COCINA)
    expect(llamadas[1]![2]).toBe('subida-1')
    expect(llamadas[3]![3]).toBe('subida-1')
  })

  it('GET lista la cámara del dueño de la llave con su cuota, sin caché', async () => {
    materiales.mockResolvedValue([{ id: 'm1', nombre: 'Intro', uso: 'intro', enMarcha: 0 }])
    uso.mockResolvedValue({ cuantos: 1, guardados: 10, subiendo: 0, cuota: 100 })
    const r = await camara.GET(peticion('GET'))
    expect(r.status).toBe(200)
    expect(r.headers.get('cache-control')).toBe('no-store')
    expect(await r.json()).toEqual({
      camara: { cuantos: 1, guardados: 10, subiendo: 0, cuota: 100 },
      materiales: [{ id: 'm1', nombre: 'Intro', uso: 'intro', enMarcha: 0 }],
    })
    expect(materiales).toHaveBeenCalledWith('usuario-7')
    expect(uso).toHaveBeenCalledWith('usuario-7')
  })
})
