import { esUuid } from '@/lib/uuid'
import { MATERIAL_EN_USO, MATERIAL_NO_EXISTE, USO_DESCONOCIDO, esUso, leerNombre } from './bodega'
import { editarMaterial, sacarMaterial } from './materiales'
import { COMANDA_AJENA, COMANDA_NO_CANCELABLE, cancelarComanda } from './panel'

// Lo que el dueño hace con lo suyo en La Cocina, una sola vez para las dos puertas: el panel
// (`src/app/admin/cocina-actions.ts`, con la sesión) y la app del teléfono
// (`/api/mobile/cocina/…`, con su token). Cada puerta averigua quién pregunta a su manera y llama
// acá con su id: lo que se valida y las frases son las mismas. `codigo` es el que responde la API
// del teléfono; el panel solo lee la frase. Ninguna pide la cocina encendida: si el admin la apagó
// entre medio, el dueño igual puede cancelar, ordenar y hacer espacio.

export type FallaDelDueno = { error: string; codigo: 400 | 404 | 409 | 500 }

/** Cancela una comanda propia que todavía no está en el horno. */
export async function cancelarLaComanda(ownerId: string, id: string, ahora: Date): Promise<{ ok: true } | FallaDelDueno> {
  if (!esUuid(id)) return { error: COMANDA_AJENA, codigo: 404 }
  const r = await cancelarComanda(ownerId, id, ahora)
  if ('falla' in r) return r.falla === 'no-existe' ? { error: COMANDA_AJENA, codigo: 404 } : { error: COMANDA_NO_CANCELABLE, codigo: 409 }
  return { ok: true }
}

/**
 * Le cambia el nombre y el uso a un material de la cámara de frío (`uso` null: sin uso). Lo que ya
 * se pidió con él no cambia: la comanda guardó su foto.
 */
export async function cambiarElMaterial(ownerId: string, id: string, nombre: unknown, uso: unknown): Promise<{ ok: true } | FallaDelDueno> {
  const limpio = leerNombre(nombre)
  if (typeof limpio !== 'string') return { error: limpio.error, codigo: 400 }
  if (uso !== null && !esUso(uso)) return { error: USO_DESCONOCIDO, codigo: 400 }
  const r = await editarMaterial(ownerId, id, { nombre: limpio, uso })
  return 'falla' in r ? { error: MATERIAL_NO_EXISTE, codigo: 404 } : { ok: true }
}

export const NO_SE_SACO = 'No se pudo sacar: el almacén no respondió. Vuelve a intentarlo en un rato.'

/** Saca un material de la cámara y lo borra del almacén, si ninguna comanda en marcha lo usa. */
export async function sacarDeLaCamara(ownerId: string, id: string, ahora: Date): Promise<{ ok: true } | FallaDelDueno> {
  let r: Awaited<ReturnType<typeof sacarMaterial>>
  try {
    r = await sacarMaterial(ownerId, id, ahora)
  } catch (e) {
    // El archivo se borra antes de soltar el material: si el almacén falla, nada cambió.
    console.error('sacarDeLaCamara:', String(e).slice(0, 300))
    return { error: NO_SE_SACO, codigo: 500 }
  }
  if ('falla' in r) return r.falla === 'en-uso' ? { error: MATERIAL_EN_USO, codigo: 409 } : { error: MATERIAL_NO_EXISTE, codigo: 404 }
  return { ok: true }
}
