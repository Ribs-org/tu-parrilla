import { describe, expect, it } from 'vitest'
import { partesQueFaltan } from '@/lib/cocina/insumos'
import {
  INTENTOS,
  SUBIDA_CORTADA,
  SubidaFallida,
  cancelarSubida,
  claveDeRecuerdo,
  subirPorPartes,
  type Avance,
  type Dependencias,
} from './subida-por-partes'

// La subida por partes del navegador contra un servidor de mentira que hace las mismas cuentas que
// el de verdad (`src/lib/cocina/subidas.ts`): cuántas partes, cuáles llegaron con su peso, qué
// falta al cerrar. Lo que importa es lo que el usuario sufre si esto se equivoca: subir dos veces
// lo que ya estaba, perder lo subido al cortarse, o dar por terminada una subida incompleta.

const TAMANO = 10

type SubidaFalsa = { bytes: number; partes: Map<number, number>; insumo: Record<string, unknown> | null; nombre: string }

function json(status: number, cuerpo: unknown): Response {
  return new Response(JSON.stringify(cuerpo), { status, headers: { 'content-type': 'application/json' } })
}

function servidorFalso() {
  const subidas = new Map<string, SubidaFalsa>()
  const firmados: number[] = []
  const llamadas: string[] = []
  let siguiente = 1
  let alCerrar: ((s: SubidaFalsa) => void) | null = null

  const estado = (id: string, s: SubidaFalsa) => {
    const partes = Math.ceil(s.bytes / TAMANO)
    const faltan = new Set(partesQueFaltan(s.bytes, TAMANO, [...s.partes].map(([numero, bytes]) => ({ numero, bytes }))))
    const llegaron = Array.from({ length: partes }, (_, n) => n + 1).filter((n) => !faltan.has(n))
    return { id, nombre: s.nombre, bytes: s.bytes, tamanoParte: TAMANO, partes, llegaron, insumo: s.insumo }
  }

  const fetchFalso = async (entrada: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = String(entrada)
    const metodo = init?.method ?? 'GET'
    llamadas.push(`${metodo} ${url}`)
    const cuerpo = typeof init?.body === 'string' ? JSON.parse(init.body) : null
    if (url === '/api/admin/cocina/subidas' && metodo === 'POST') {
      const id = `s${siguiente++}`
      subidas.set(id, { bytes: cuerpo.bytes, partes: new Map(), insumo: null, nombre: cuerpo.nombre })
      return json(201, { id, tamanoParte: TAMANO, partes: Math.ceil(cuerpo.bytes / TAMANO) })
    }
    const [, id, accion] = url.match(/^\/api\/admin\/cocina\/subidas\/([^/]+)(?:\/(partes|cerrar))?$/) ?? []
    const s = id ? subidas.get(id) : undefined
    if (!id || !s) return json(404, { error: 'Esa subida no existe, o ya se abortó.' })
    if (accion === 'partes') {
      firmados.push(...cuerpo.partes)
      return json(200, { partes: cuerpo.partes.map((n: number) => ({ numero: n, url: `put://${id}/${n}` })) })
    }
    if (accion === 'cerrar') {
      alCerrar?.(s)
      alCerrar = null
      const { llegaron, partes } = estado(id, s)
      if (llegaron.length < partes) return json(409, { error: `Faltan ${partes - llegaron.length} partes por subir.` })
      s.insumo ??= { id: `insumo-${id}`, nombre: s.nombre, bytes: s.bytes }
      return json(201, { insumo: s.insumo })
    }
    if (metodo === 'DELETE') {
      subidas.delete(id)
      return json(200, { ok: true })
    }
    return json(200, estado(id, s))
  }

  /** Sube una parte: la anota con el peso que llegó, avisando a la mitad y al final. */
  const subirParte: Dependencias['subirParte'] = async (url, cuerpo, alAvanzar) => {
    const [, id, numero] = url.match(/^put:\/\/([^/]+)\/(\d+)$/)!
    alAvanzar(Math.floor(cuerpo.size / 2))
    subidas.get(id!)!.partes.set(Number(numero), cuerpo.size)
    alAvanzar(cuerpo.size)
  }

  return {
    subidas,
    firmados,
    llamadas,
    fetch: fetchFalso as typeof fetch,
    subirParte,
    /** Lo que pasa justo antes del próximo cierre: una parte que se pierde, por ejemplo. */
    antesDeCerrar(f: (s: SubidaFalsa) => void) {
      alCerrar = f
    },
  }
}

function memoriaFalsa(inicial: Record<string, string> = {}) {
  const mapa = new Map(Object.entries(inicial))
  return {
    mapa,
    leer: (clave: string) => mapa.get(clave) ?? null,
    guardar: (clave: string, valor: string) => void mapa.set(clave, valor),
    olvidar: (clave: string) => void mapa.delete(clave),
  }
}

// 24 bytes en partes de 10: dos llenas y una de 4.
const archivo = new File([new Uint8Array(24)], 'video9.mp4', { type: 'video/mp4', lastModified: 1 })
const pedido = { insumo: 'principal', subtipo: 'largo', duracionS: 1800, derechos: true } as const
const RECUERDO = claveDeRecuerdo(archivo, 'principal')
const sinEsperar = async () => {}

describe('subirPorPartes', () => {
  it('desde cero: abre, sube cada parte una vez, cierra y olvida la subida', async () => {
    const servidor = servidorFalso()
    const memoria = memoriaFalsa()
    const avances: Avance[] = []
    const insumo = await subirPorPartes(archivo, pedido, { alAvanzar: (a) => avances.push(a) }, { ...servidor, memoria, esperar: sinEsperar })

    expect(insumo).toEqual({ id: 'insumo-s1', nombre: 'video9.mp4', bytes: 24 })
    expect([...servidor.subidas.get('s1')!.partes].sort()).toEqual([
      [1, 10],
      [2, 10],
      [3, 4],
    ])
    expect(servidor.firmados.sort()).toEqual([1, 2, 3])
    expect(memoria.mapa.size).toBe(0)
    expect(avances.at(-1)).toEqual({ subidos: 24, total: 24 })
    expect(avances.every((a) => a.subidos <= a.total)).toBe(true)
  })

  it('retoma lo que quedó: no vuelve a subir las partes que llegaron', async () => {
    const servidor = servidorFalso()
    servidor.subidas.set('s9', { bytes: 24, nombre: 'video9.mp4', insumo: null, partes: new Map([[1, 10], [2, 10]]) })
    const memoria = memoriaFalsa({ [RECUERDO]: 's9' })
    const avances: Avance[] = []
    await subirPorPartes(archivo, pedido, { alAvanzar: (a) => avances.push(a) }, { ...servidor, memoria, esperar: sinEsperar })

    expect(servidor.firmados).toEqual([3])
    expect(servidor.llamadas).not.toContain('POST /api/admin/cocina/subidas')
    // El avance empieza donde quedó, no en cero.
    expect(avances[0]).toEqual({ subidos: 20, total: 24 })
  })

  it('una parte que llegó con otro peso se vuelve a subir', async () => {
    const servidor = servidorFalso()
    servidor.subidas.set('s9', { bytes: 24, nombre: 'video9.mp4', insumo: null, partes: new Map([[1, 10], [2, 3]]) })
    await subirPorPartes(archivo, pedido, {}, { ...servidor, memoria: memoriaFalsa({ [RECUERDO]: 's9' }), esperar: sinEsperar })
    expect(servidor.firmados.sort()).toEqual([2, 3])
  })

  it('si ya se había cerrado, devuelve su insumo sin subir nada', async () => {
    const servidor = servidorFalso()
    const cerrado = { id: 'insumo-viejo', nombre: 'video9.mp4', bytes: 24 }
    servidor.subidas.set('s9', { bytes: 24, nombre: 'video9.mp4', insumo: cerrado, partes: new Map() })
    const memoria = memoriaFalsa({ [RECUERDO]: 's9' })
    expect(await subirPorPartes(archivo, pedido, {}, { ...servidor, memoria, esperar: sinEsperar })).toEqual(cerrado)
    expect(servidor.firmados).toEqual([])
    expect(memoria.mapa.size).toBe(0)
  })

  it('una recordada que el servidor ya no conoce, o de otro peso, se olvida y se abre otra', async () => {
    const servidor = servidorFalso()
    await subirPorPartes(archivo, pedido, {}, { ...servidor, memoria: memoriaFalsa({ [RECUERDO]: 'perdida' }), esperar: sinEsperar })
    expect(servidor.llamadas).toContain('POST /api/admin/cocina/subidas')

    const otro = servidorFalso()
    otro.subidas.set('s9', { bytes: 999, nombre: 'video9.mp4', insumo: null, partes: new Map() })
    await subirPorPartes(archivo, pedido, {}, { ...otro, memoria: memoriaFalsa({ [RECUERDO]: 's9' }), esperar: sinEsperar })
    expect(otro.llamadas).toContain('POST /api/admin/cocina/subidas')
  })

  it('reintenta una parte que falla, cada vez con un enlace nuevo', async () => {
    const servidor = servidorFalso()
    let fallas = 0
    const subirParte: Dependencias['subirParte'] = async (url, cuerpo, alAvanzar) => {
      if (url.endsWith('/2') && fallas < 2) {
        fallas += 1
        throw new Error('Se cortó la conexión')
      }
      return servidor.subirParte(url, cuerpo, alAvanzar)
    }
    await subirPorPartes(archivo, pedido, {}, { ...servidor, subirParte, memoria: memoriaFalsa(), esperar: sinEsperar })
    expect(fallas).toBe(2)
    expect(servidor.firmados.filter((n) => n === 2)).toHaveLength(3)
    expect(servidor.subidas.get('s1')!.insumo).not.toBeNull()
  })

  it('se rinde después de los intentos, y deja la subida recordada para retomarla', async () => {
    const servidor = servidorFalso()
    let intentos = 0
    const subirParte: Dependencias['subirParte'] = async (url, cuerpo, alAvanzar) => {
      if (url.endsWith('/2')) {
        intentos += 1
        throw new Error('Se cortó la conexión')
      }
      return servidor.subirParte(url, cuerpo, alAvanzar)
    }
    const memoria = memoriaFalsa()
    const subida = subirPorPartes(archivo, pedido, {}, { ...servidor, subirParte, memoria, esperar: sinEsperar })
    await expect(subida).rejects.toEqual(new SubidaFallida(SUBIDA_CORTADA))
    expect(intentos).toBe(INTENTOS)
    expect(memoria.mapa.get(RECUERDO)).toBe('s1')
    expect(servidor.llamadas.some((l) => l.endsWith('/cerrar'))).toBe(false)
  })

  it('si el servidor no deja abrirla, dice por qué con su frase', async () => {
    const servidor = servidorFalso()
    const fetchQueRechaza = (async () => json(403, { error: 'La Cocina no está encendida para tu cuenta.' })) as typeof fetch
    const memoria = memoriaFalsa()
    await expect(
      subirPorPartes(archivo, pedido, {}, { ...servidor, fetch: fetchQueRechaza, memoria, esperar: sinEsperar }),
    ).rejects.toEqual(new SubidaFallida('La Cocina no está encendida para tu cuenta.'))
    expect(memoria.mapa.size).toBe(0)
  })

  it('si al cerrar falta una parte, pregunta cuál, la sube y cierra', async () => {
    const servidor = servidorFalso()
    servidor.antesDeCerrar((s) => s.partes.delete(3))
    const insumo = await subirPorPartes(archivo, pedido, {}, { ...servidor, memoria: memoriaFalsa(), esperar: sinEsperar })
    expect(insumo).toMatchObject({ id: 'insumo-s1' })
    expect(servidor.firmados.filter((n) => n === 3)).toHaveLength(2)
  })

  it('cancelada a mitad: para, no cierra y la deja recordada', async () => {
    const servidor = servidorFalso()
    const control = new AbortController()
    const subirParte: Dependencias['subirParte'] = async (url, cuerpo, alAvanzar, senal) => {
      if (url.endsWith('/1')) {
        control.abort()
        throw new DOMException('Subida cancelada', 'AbortError')
      }
      if (senal?.aborted) throw new DOMException('Subida cancelada', 'AbortError')
      return servidor.subirParte(url, cuerpo, alAvanzar)
    }
    const memoria = memoriaFalsa()
    const subida = subirPorPartes(archivo, pedido, { senal: control.signal }, { ...servidor, subirParte, memoria, esperar: sinEsperar })
    await expect(subida).rejects.toMatchObject({ name: 'AbortError' })
    expect(memoria.mapa.get(RECUERDO)).toBe('s1')
    expect(servidor.llamadas.some((l) => l.endsWith('/cerrar'))).toBe(false)
  })
})

describe('cancelarSubida', () => {
  it('aborta la recordada en el servidor y la olvida; sin una recordada, no hace nada', async () => {
    const servidor = servidorFalso()
    servidor.subidas.set('s9', { bytes: 24, nombre: 'video9.mp4', insumo: null, partes: new Map() })
    const memoria = memoriaFalsa({ [RECUERDO]: 's9' })
    await cancelarSubida(archivo, 'principal', { ...servidor, memoria })
    expect(servidor.subidas.has('s9')).toBe(false)
    expect(memoria.mapa.size).toBe(0)

    const llamadasAntes = servidor.llamadas.length
    await cancelarSubida(archivo, 'principal', { ...servidor, memoria })
    expect(servidor.llamadas.length).toBe(llamadasAntes)
  })
})
