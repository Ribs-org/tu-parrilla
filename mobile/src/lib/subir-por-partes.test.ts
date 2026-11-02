import { describe, expect, it } from 'vitest'
import { RechazoApi } from './api'
import type { Material } from './cocina'
import { INTENTOS, subirALaCamara, type Dependencias } from './subir-por-partes'

// La subida por partes del teléfono contra un servidor y un almacén de mentira: que abra con la
// casilla de los derechos, suba cada parte con su enlace, cierre y devuelva el material; que
// reintente una parte que falla; que retome sin repetir lo que llegó; y que la frase del servidor
// —la de la cuota— suba tal cual.

const MB = 1024 * 1024
const TAMANO = 64 * MB
const material = (bytes: number): Material => ({
  id: 'm-1',
  nombre: 'Video del 2 de nov, 14.05.mp4',
  uso: 'crudo',
  bytes,
  duracionS: 95,
  tipoArchivo: 'video/mp4',
  clase: 'video',
  creadoEn: '2026-11-02T17:05:00.000Z',
  enMarcha: 0,
})

function servidor(bytes: number, opciones: { fallaParte?: Map<number, number>; llegaron?: number[]; cuota?: string } = {}) {
  const partes = Math.ceil(bytes / TAMANO)
  const subidas: [number, number, number][] = []
  const llamadas: string[] = []
  const llegaron = new Set(opciones.llegaron ?? [])
  const fallos = new Map(opciones.fallaParte ?? [])
  const d: Dependencias = {
    post: async <T,>(ruta: string, cuerpo: unknown): Promise<T> => {
      llamadas.push(`POST ${ruta}`)
      if (ruta === '/api/mobile/cocina/subidas') {
        if (opciones.cuota) throw new RechazoApi(opciones.cuota)
        expect(cuerpo).toMatchObject({ derechos: true, bytes })
        return { id: 's-1', tamanoParte: TAMANO, partes } as T
      }
      if (ruta.endsWith('/partes')) {
        const [numero] = (cuerpo as { partes: number[] }).partes
        return { partes: [{ numero, url: `https://r2/parte-${numero}`, bytes: 0 }] } as T
      }
      if (ruta.endsWith('/cerrar')) {
        const faltan = Array.from({ length: partes }, (_, n) => n + 1).filter((n) => !llegaron.has(n))
        if (faltan.length) throw new RechazoApi(`Faltan ${faltan.length} partes por subir: súbelas y vuelve a cerrar.`)
        return { material: material(bytes) } as T
      }
      throw new Error(`ruta inesperada ${ruta}`)
    },
    get: async <T,>(ruta: string): Promise<T> => {
      llamadas.push(`GET ${ruta}`)
      if (ruta === '/api/mobile/cocina/subidas/vieja') throw new RechazoApi('Esa subida no existe, o ya se abortó.')
      return { id: 's-1', tamanoParte: TAMANO, partes, bytes, llegaron: [...llegaron], material: null } as T
    },
    subirParte: async (url, desde, hasta, alAvanzar) => {
      const numero = Number(url.split('-').pop())
      const quedan = fallos.get(numero) ?? 0
      if (quedan > 0) {
        fallos.set(numero, quedan - 1)
        throw new Error('Sin red')
      }
      alAvanzar((hasta - desde) / 2)
      subidas.push([numero, desde, hasta])
      llegaron.add(numero)
    },
    esperar: async () => {},
  }
  return { d, subidas, llamadas }
}

describe('subir a la cámara desde el teléfono', () => {
  it('abre, sube cada parte con su tramo del archivo, cierra y devuelve el material, avisando el avance', async () => {
    const bytes = 2 * TAMANO + 10 * MB
    const { d, subidas } = servidor(bytes)
    const avances: number[] = []
    let abierta = ''
    const m = await subirALaCamara(
      { nombre: 'v.mp4', tipo: 'video/mp4', bytes, uso: 'crudo', duracionS: 95 },
      { senal: new AbortController().signal, alAbrir: (id) => (abierta = id), alAvanzar: (f) => avances.push(f) },
      d,
    )
    expect(m.id).toBe('m-1')
    expect(abierta).toBe('s-1')
    expect(subidas).toEqual([
      [1, 0, TAMANO],
      [2, TAMANO, 2 * TAMANO],
      [3, 2 * TAMANO, bytes],
    ])
    expect(avances[0]).toBe(0)
    expect(avances.at(-1)).toBe(1)
    expect(avances).toEqual([...avances].sort((a, b) => a - b))
  })

  it('una parte que falla se reintenta con un enlace nuevo; pasados los intentos, se rinde', async () => {
    const bytes = TAMANO + 1
    const bien = servidor(bytes, { fallaParte: new Map([[2, INTENTOS - 1]]) })
    await expect(subirALaCamara({ nombre: 'v.mp4', tipo: 'video/mp4', bytes, uso: null, duracionS: null }, { senal: new AbortController().signal }, bien.d)).resolves.toMatchObject({ id: 'm-1' })
    expect(bien.llamadas.filter((l) => l.endsWith('/partes'))).toHaveLength(1 + INTENTOS)

    const mal = servidor(bytes, { fallaParte: new Map([[1, INTENTOS]]) })
    await expect(subirALaCamara({ nombre: 'v.mp4', tipo: 'video/mp4', bytes, uso: null, duracionS: null }, { senal: new AbortController().signal }, mal.d)).rejects.toThrow('Sin red')
  })

  it('retoma una subida cortada sin repetir lo que ya llegó', async () => {
    const bytes = 3 * TAMANO
    const { d, subidas, llamadas } = servidor(bytes, { llegaron: [1, 2] })
    await subirALaCamara({ nombre: 'v.mp4', tipo: 'video/mp4', bytes, uso: 'crudo', duracionS: null }, { senal: new AbortController().signal, retomar: 's-1' }, d)
    expect(subidas.map(([n]) => n)).toEqual([3])
    expect(llamadas).not.toContain('POST /api/mobile/cocina/subidas')
  })

  it('una que el servidor ya no conoce se abre de nuevo', async () => {
    const { d, llamadas } = servidor(10)
    await subirALaCamara({ nombre: 'v.mp4', tipo: 'video/mp4', bytes: 10, uso: null, duracionS: null }, { senal: new AbortController().signal, retomar: 'vieja' }, d)
    expect(llamadas).toContain('POST /api/mobile/cocina/subidas')
  })

  it('la frase del servidor sube tal cual: la de la cuota, sin intentar nada más', async () => {
    const frase = 'No hay espacio para «v.mp4»: pesa 2 GB y te quedan 1 GB libres de 20 GB. Saca algo que ya no uses, o pide más espacio.'
    const { d, subidas } = servidor(2 * 1024 * MB, { cuota: frase })
    await expect(subirALaCamara({ nombre: 'v.mp4', tipo: 'video/mp4', bytes: 2 * 1024 * MB, uso: null, duracionS: null }, { senal: new AbortController().signal }, d)).rejects.toThrow(frase)
    expect(subidas).toEqual([])
  })

  it('abortada, no sube nada más', async () => {
    const control = new AbortController()
    control.abort()
    const { d, subidas } = servidor(TAMANO)
    await expect(subirALaCamara({ nombre: 'v.mp4', tipo: 'video/mp4', bytes: TAMANO, uso: null, duracionS: null }, { senal: control.signal }, d)).rejects.toThrow()
    expect(subidas).toEqual([])
  })
})
