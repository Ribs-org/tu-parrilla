import type { TipoInsumo } from '@/db/schema'
import { bytesDeParte, rangoDeParte, type SubtipoPrincipal } from '@/lib/cocina/insumos'
import type { InsumoSubido } from '@/lib/cocina/subidas'

// La subida por partes desde el navegador, para los archivos de La Cocina: corta el archivo en
// partes, pide un enlace firmado para cada una y las sube directo al almacén, varias a la vez,
// avisando cuánto va. Si se corta —se cerró la pestaña, se cayó la red—, elegir el mismo archivo
// otra vez la retoma: el navegador recuerda qué subida era, y el servidor sabe qué partes
// llegaron. Lo que hace el servidor está en `src/lib/cocina/subidas.ts`.

export type PedidoDeSubida = {
  insumo: TipoInsumo
  subtipo: SubtipoPrincipal | null
  duracionS: number | null
  derechos: true
}

export type Avance = { subidos: number; total: number }

type Memoria = {
  leer(clave: string): string | null
  guardar(clave: string, valor: string): void
  olvidar(clave: string): void
}

export type Dependencias = {
  fetch: typeof fetch
  /** Sube los bytes de una parte a su enlace, avisando cuántos van. */
  subirParte: (url: string, cuerpo: Blob, alAvanzar: (bytes: number) => void, senal?: AbortSignal) => Promise<void>
  memoria: Memoria
  esperar: (ms: number) => Promise<void>
}

/** Cuántas partes suben a la vez: más no acelera una conexión doméstica, y cada una ocupa 64 MB de memoria. */
export const PARALELAS = 3
/** Cuántas veces se intenta cada parte, con un enlace nuevo cada vez. */
export const INTENTOS = 4
/** Los enlaces se firman de a pocos y justo antes de usarlos: con una red lenta, un lote grande vencería antes. */
const LOTE = PARALELAS * 2

export const SUBIDA_CORTADA = 'No se pudo terminar la subida: elige el mismo archivo otra vez para retomarla donde quedó.'
const SIN_FRASE = 'No se pudo subir el archivo.'

export class SubidaFallida extends Error {}

/** Con qué se recuerda una subida para retomarla: el mismo archivo es el mismo nombre, peso y fecha. */
export function claveDeRecuerdo(archivo: Pick<File, 'name' | 'size' | 'lastModified'>, insumo: TipoInsumo): string {
  return `tp:subida:${insumo}:${archivo.size}:${archivo.lastModified}:${archivo.name}`
}

async function fraseDe(respuesta: Response): Promise<string> {
  const cuerpo = (await respuesta.json().catch(() => null)) as { error?: unknown } | null
  return typeof cuerpo?.error === 'string' ? cuerpo.error : SIN_FRASE
}

const JSON_POST = { method: 'POST', headers: { 'content-type': 'application/json' } } as const

type Abierta = { id: string; tamanoParte: number; partes: number }
type Estado = Abierta & { bytes: number; llegaron: number[]; insumo: InsumoSubido | null }

/**
 * Sube un archivo de la cocina y devuelve su insumo, ya sin partes pendientes. Lanza
 * `SubidaFallida` con la frase para el usuario si no se puede, y deja recordada la subida para
 * retomarla; abortada con `senal`, lanza el `AbortError` y también la deja recordada.
 */
export async function subirPorPartes(
  archivo: File,
  pedido: PedidoDeSubida,
  opciones: { alAvanzar?: (avance: Avance) => void; senal?: AbortSignal } = {},
  dependencias: Partial<Dependencias> = {},
): Promise<InsumoSubido> {
  const d: Dependencias = { ...predeterminadas(), ...dependencias }
  const recuerdo = claveDeRecuerdo(archivo, pedido.insumo)
  const total = archivo.size

  // Retomar la que quedó, si el servidor todavía la conoce y es de este mismo archivo.
  let subida: Abierta | null = null
  let llegaron: number[] = []
  const guardada = d.memoria.leer(recuerdo)
  if (guardada) {
    const r = await d.fetch(`/api/admin/cocina/subidas/${encodeURIComponent(guardada)}`, { signal: opciones.senal })
    if (r.ok) {
      const estado = (await r.json()) as Estado
      if (estado.insumo) {
        d.memoria.olvidar(recuerdo)
        return estado.insumo
      }
      if (estado.bytes === total) {
        subida = { id: estado.id, tamanoParte: estado.tamanoParte, partes: estado.partes }
        llegaron = estado.llegaron
      }
    }
    if (!subida) d.memoria.olvidar(recuerdo)
  }
  if (!subida) {
    const r = await d.fetch('/api/admin/cocina/subidas', {
      ...JSON_POST,
      signal: opciones.senal,
      body: JSON.stringify({
        nombre: archivo.name,
        tipo: archivo.type,
        bytes: total,
        insumo: pedido.insumo,
        subtipo: pedido.subtipo,
        duracionS: pedido.duracionS,
        derechos: pedido.derechos,
      }),
    })
    if (!r.ok) throw new SubidaFallida(await fraseDe(r))
    subida = (await r.json()) as Abierta
    d.memoria.guardar(recuerdo, subida.id)
  }
  const { id, tamanoParte, partes } = subida

  // Dos vueltas como mucho: si al cerrar el servidor dice que falta algo, se pregunta qué y se sube.
  for (let vuelta = 0; vuelta < 2; vuelta++) {
    const listas = new Set(llegaron)
    const faltan = Array.from({ length: partes }, (_, n) => n + 1).filter((n) => !listas.has(n))
    let subidos = [...listas].reduce((suma, n) => suma + bytesDeParte(n, total, tamanoParte), 0)
    const enCurso = new Map<number, number>()
    const avisar = () => opciones.alAvanzar?.({ subidos: subidos + [...enCurso.values()].reduce((a, b) => a + b, 0), total })
    avisar()

    const cola = [...faltan]
    const firmas = firmador(id, d, () => cola, opciones.senal)
    const trabajar = async () => {
      for (let n = cola.shift(); n !== undefined; n = cola.shift()) {
        const numero = n
        const { desde, hasta } = rangoDeParte(numero, total, tamanoParte)
        for (let intento = 1; ; intento++) {
          try {
            const url = await firmas.url(numero)
            await d.subirParte(url, archivo.slice(desde, hasta), (b) => {
              enCurso.set(numero, b)
              avisar()
            }, opciones.senal)
            break
          } catch (error) {
            enCurso.delete(numero)
            firmas.olvidar(numero)
            if (opciones.senal?.aborted || intento >= INTENTOS) {
              // Las demás terminan la parte que llevan, pero no toman otra.
              cola.length = 0
              throw error
            }
            await d.esperar(1000 * 2 ** (intento - 1))
          }
        }
        enCurso.delete(numero)
        subidos += hasta - desde
        avisar()
      }
    }
    try {
      await Promise.all(Array.from({ length: Math.min(PARALELAS, faltan.length) }, trabajar))
    } catch (error) {
      if (opciones.senal?.aborted) throw error
      throw new SubidaFallida(error instanceof SubidaFallida ? error.message : SUBIDA_CORTADA)
    }

    const cierre = await d.fetch(`/api/admin/cocina/subidas/${encodeURIComponent(id)}/cerrar`, { method: 'POST', signal: opciones.senal })
    if (cierre.ok) {
      d.memoria.olvidar(recuerdo)
      return ((await cierre.json()) as { insumo: InsumoSubido }).insumo
    }
    if (cierre.status !== 409) throw new SubidaFallida(await fraseDe(cierre))
    const r = await d.fetch(`/api/admin/cocina/subidas/${encodeURIComponent(id)}`, { signal: opciones.senal })
    if (!r.ok) {
      d.memoria.olvidar(recuerdo)
      throw new SubidaFallida(await fraseDe(cierre))
    }
    const estado = (await r.json()) as Estado
    if (estado.insumo) {
      d.memoria.olvidar(recuerdo)
      return estado.insumo
    }
    llegaron = estado.llegaron
  }
  throw new SubidaFallida(SUBIDA_CORTADA)
}

/**
 * Los enlaces de las partes, pedidos de a `LOTE` y justo antes de usarlos. Una parte que falló se
 * olvida, y su próximo intento pide un enlace nuevo: el que venció o el que el almacén rechazó no
 * se repite.
 */
function firmador(id: string, d: Dependencias, pendientes: () => number[], senal?: AbortSignal) {
  const enlaces = new Map<number, Promise<string>>()
  return {
    url(numero: number): Promise<string> {
      const ya = enlaces.get(numero)
      if (ya) return ya
      const lote = [numero, ...pendientes().filter((m) => !enlaces.has(m) && m !== numero)].slice(0, LOTE)
      const pedido = d
        .fetch(`/api/admin/cocina/subidas/${encodeURIComponent(id)}/partes`, {
          ...JSON_POST,
          signal: senal,
          body: JSON.stringify({ partes: lote }),
        })
        .then(async (r) => {
          if (!r.ok) throw new SubidaFallida(await fraseDe(r))
          const { partes } = (await r.json()) as { partes: Array<{ numero: number; url: string }> }
          return new Map(partes.map((p) => [p.numero, p.url]))
        })
      for (const m of lote) {
        const enlace = pedido.then((mapa) => {
          const url = mapa.get(m)
          if (!url) throw new SubidaFallida(SIN_FRASE)
          return url
        })
        // Sin este `catch` vacío, un lote que falla deja promesas rechazadas sin nadie que las espere.
        enlace.catch(() => {})
        enlaces.set(m, enlace)
      }
      return enlaces.get(numero)!
    },
    olvidar(numero: number) {
      enlaces.delete(numero)
    },
  }
}

/**
 * Cancela la subida recordada de un archivo: el almacén borra las partes que alcanzaron a llegar.
 * Sin una recordada, no hace nada.
 */
export async function cancelarSubida(
  archivo: Pick<File, 'name' | 'size' | 'lastModified'>,
  insumo: TipoInsumo,
  dependencias: Partial<Dependencias> = {},
): Promise<void> {
  const d: Dependencias = { ...predeterminadas(), ...dependencias }
  const recuerdo = claveDeRecuerdo(archivo, insumo)
  const id = d.memoria.leer(recuerdo)
  if (!id) return
  await d.fetch(`/api/admin/cocina/subidas/${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => null)
  d.memoria.olvidar(recuerdo)
}

/** Lo de verdad, en el navegador: `fetch`, un `XMLHttpRequest` por parte (fetch no cuenta lo que sube) y `localStorage`. */
function predeterminadas(): Dependencias {
  return {
    fetch: (...args) => fetch(...args),
    subirParte: subirConXhr,
    memoria: {
      // Sin almacenamiento (una ventana privada, datos bloqueados), la subida anda igual: solo no se retoma.
      leer: (clave) => {
        try {
          return window.localStorage.getItem(clave)
        } catch {
          return null
        }
      },
      guardar: (clave, valor) => {
        try {
          window.localStorage.setItem(clave, valor)
        } catch {}
      },
      olvidar: (clave) => {
        try {
          window.localStorage.removeItem(clave)
        } catch {}
      },
    },
    esperar: (ms) => new Promise((resolver) => setTimeout(resolver, ms)),
  }
}

function subirConXhr(url: string, cuerpo: Blob, alAvanzar: (bytes: number) => void, senal?: AbortSignal): Promise<void> {
  return new Promise((resolver, rechazar) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', url)
    xhr.upload.onprogress = (e) => alAvanzar(e.loaded)
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolver() : rechazar(new Error(`El almacén respondió ${xhr.status}`)))
    xhr.onerror = () => rechazar(new Error('Se cortó la conexión'))
    xhr.onabort = () => rechazar(new DOMException('Subida cancelada', 'AbortError'))
    if (senal) {
      if (senal.aborted) return xhr.abort()
      senal.addEventListener('abort', () => xhr.abort(), { once: true })
    }
    xhr.send(cuerpo)
  })
}
