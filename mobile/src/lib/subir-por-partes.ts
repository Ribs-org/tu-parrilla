import { RechazoApi } from './api'
import type { Material } from './cocina'

/**
 * La subida por partes a la cámara de frío desde el teléfono, sin la red ni el disco: abre la
 * subida (`/api/mobile/cocina/subidas`, donde el servidor mira la cuota), pide el enlace firmado de
 * cada parte justo antes de subirla, la sube directo al almacén y, con todas arriba, la cierra y
 * nace el material. De a una parte por vez: cada una es un trozo del archivo copiado a un temporal
 * (`archivo-local.ts`), y dos a la vez doblarían lo que ocupa en el teléfono sin acelerar la señal
 * de un celular. Si se corta, se retoma con el id de la subida: el servidor dice qué partes
 * llegaron y solo se suben las que faltan.
 *
 * Lo que hace el servidor está en `src/lib/cocina/subidas.ts`, en la raíz.
 */

export type PedidoDeSubida = {
  nombre: string
  tipo: string
  bytes: number
  uso: string | null
  duracionS: number | null
}

type Abierta = { id: string; tamanoParte: number; partes: number }
type Estado = Abierta & { bytes: number; llegaron: number[]; material: Material | null }
type Firmadas = { partes: { numero: number; url: string; bytes: number }[] }

export type Dependencias = {
  /** `apiPost` con el token ya puesto: un 401 sube como `SesionCaducada`, una frase como `RechazoApi`. */
  post: <T>(ruta: string, cuerpo: unknown) => Promise<T>
  get: <T>(ruta: string) => Promise<T>
  /** Sube los bytes `[desde, hasta)` del archivo a `url`, avisando cuántos van de esta parte. */
  subirParte: (url: string, desde: number, hasta: number, alAvanzar: (bytes: number) => void, senal: AbortSignal) => Promise<void>
  esperar: (ms: number) => Promise<void>
}

/** Cuántas veces se intenta cada parte, con un enlace nuevo cada vez. */
export const INTENTOS = 4

export type Opciones = {
  /** Una subida que quedó a medias, para retomarla en vez de abrir otra. */
  retomar?: string | null
  /** Apenas se sabe el id de la subida: con él se retoma o se aborta. */
  alAbrir?: (id: string) => void
  /** De 0 a 1. */
  alAvanzar?: (fraccion: number) => void
  senal: AbortSignal
}

const RUTA = '/api/mobile/cocina/subidas'

function bytesDeParte(numero: number, total: number, tamano: number): number {
  return Math.min(tamano, total - (numero - 1) * tamano)
}

async function retomable(id: string, bytes: number, d: Dependencias): Promise<Estado | null> {
  try {
    const estado = await d.get<Estado>(`${RUTA}/${encodeURIComponent(id)}`)
    return estado.material || estado.bytes === bytes ? estado : null
  } catch (e) {
    // Ya no existe —se abortó, o el barrido se la llevó—: se abre otra.
    if (e instanceof RechazoApi) return null
    throw e
  }
}

/**
 * Sube un archivo a la cámara y devuelve su material. Lanza lo que lance la API (`RechazoApi` con
 * la frase del servidor, como la de la cuota), o el error de la red o del almacén después de
 * `INTENTOS` por parte; abortada con `senal`, lanza al tiro. La subida queda abierta en el
 * servidor para retomarla: abortarla del todo es de quien llama (`DELETE`).
 */
export async function subirALaCamara(pedido: PedidoDeSubida, opciones: Opciones, d: Dependencias): Promise<Material> {
  const { senal } = opciones
  let estado = opciones.retomar ? await retomable(opciones.retomar, pedido.bytes, d) : null
  if (estado?.material) return estado.material
  if (!estado) {
    const abierta = await d.post<Abierta>(RUTA, { ...pedido, derechos: true })
    estado = { ...abierta, bytes: pedido.bytes, llegaron: [], material: null }
  }
  const { id, tamanoParte, partes } = estado
  opciones.alAbrir?.(id)

  let llegaron = new Set(estado.llegaron)
  // Dos vueltas como mucho: si al cerrar el servidor dice que falta algo, se pregunta qué y se sube.
  for (let vuelta = 0; ; vuelta++) {
    let subidos = [...llegaron].reduce((suma, n) => suma + bytesDeParte(n, pedido.bytes, tamanoParte), 0)
    const avisar = (enCurso: number) => opciones.alAvanzar?.(pedido.bytes > 0 ? Math.min(1, (subidos + enCurso) / pedido.bytes) : 0)
    avisar(0)
    for (let numero = 1; numero <= partes; numero++) {
      if (llegaron.has(numero)) continue
      const desde = (numero - 1) * tamanoParte
      const hasta = desde + bytesDeParte(numero, pedido.bytes, tamanoParte)
      for (let intento = 1; ; intento++) {
        if (senal.aborted) throw new Error('Abortada')
        try {
          const { partes: [firmada] } = await d.post<Firmadas>(`${RUTA}/${encodeURIComponent(id)}/partes`, { partes: [numero] })
          if (!firmada) throw new Error('Sin enlace para la parte')
          await d.subirParte(firmada.url, desde, hasta, avisar, senal)
          break
        } catch (e) {
          // Una frase del servidor (la subida ya no existe, se cerró) no se arregla insistiendo.
          if (senal.aborted || e instanceof RechazoApi || intento >= INTENTOS) throw e
          await d.esperar(1000 * 2 ** (intento - 1))
        }
      }
      subidos += hasta - desde
      avisar(0)
    }

    try {
      const { material } = await d.post<{ material: Material }>(`${RUTA}/${encodeURIComponent(id)}/cerrar`, {})
      return material
    } catch (e) {
      if (vuelta >= 1 || !(e instanceof RechazoApi) || !/^Falta/.test(e.message)) throw e
      const otraVez = await d.get<Estado>(`${RUTA}/${encodeURIComponent(id)}`)
      if (otraVez.material) return otraVez.material
      llegaron = new Set(otraVez.llegaron)
    }
  }
}
