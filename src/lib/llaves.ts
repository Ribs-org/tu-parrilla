import 'server-only'
import { and, asc, count, eq } from 'drizzle-orm'
import { getDb, llavesApi } from '@/db'
import { env } from './env'
import {
  DEMASIADAS_LLAVES,
  MAX_LLAVES,
  PREFIJO,
  esLlaveDelDespliegue,
  finalDe,
  generarLlave,
  hashLlave,
  llaveDelHeader,
  validarNombre,
} from './llaves-api'
import { adminId } from './usuarios'

/** Lo que la lista de Tu Cuenta muestra de cada llave: nunca el hash. */
export type LlaveVisible = {
  id: string
  nombre: string
  final: string
  creadaEn: Date
  usadaEn: Date | null
}

/**
 * A nombre de quién viene una petición a la API, o null si no trae una llave válida.
 *
 * Dos llaves abren la puerta. `SCHEDULE_API_KEY`, la del despliegue, actúa como el admin:
 * es la que existía antes de que cada usuario tuviera las suyas, y el agente que ya la usa
 * sigue andando. Las de `llaves_api` actúan como su dueño. Una sola consulta busca la
 * llave y anota que se usó: el `RETURNING` trae al dueño, y una llave revocada (fila
 * borrada) no devuelve nada.
 */
export async function duenoDeLaLlave(request: Request): Promise<string | null> {
  const llave = llaveDelHeader(request.headers.get('authorization'))
  if (!llave) return null
  if (esLlaveDelDespliegue(llave, env('SCHEDULE_API_KEY'))) return adminId()
  // Sin el prefijo no puede ser una de usuario: no vale una consulta.
  if (!llave.startsWith(PREFIJO)) return null
  const [fila] = await getDb()
    .update(llavesApi)
    .set({ usadaEn: new Date() })
    .where(eq(llavesApi.hash, hashLlave(llave)))
    .returning({ ownerId: llavesApi.ownerId })
  return fila?.ownerId ?? null
}

export async function listarLlaves(ownerId: string): Promise<LlaveVisible[]> {
  return getDb()
    .select({
      id: llavesApi.id,
      nombre: llavesApi.nombre,
      final: llavesApi.final,
      creadaEn: llavesApi.creadaEn,
      usadaEn: llavesApi.usadaEn,
    })
    .from(llavesApi)
    .where(eq(llavesApi.ownerId, ownerId))
    .orderBy(asc(llavesApi.creadaEn))
}

/**
 * Genera una llave y devuelve el texto completo: es la única vez que existe fuera del
 * programa que la reciba, porque la tabla guarda solo su hash.
 *
 * El tope se cuenta antes de insertar, sin bloqueo: dos clics simultáneos pueden dejar
 * once llaves. No importa —el tope es para que nadie acumule, no una frontera de
 * seguridad—, y cerrarlo costaría una transacción serializable por un botón.
 */
export async function crearLlave(ownerId: string, nombreBruto: string): Promise<{ llave: string } | { error: string }> {
  const validado = validarNombre(nombreBruto)
  if ('error' in validado) return validado

  const db = getDb()
  const [{ total } = { total: 0 }] = await db
    .select({ total: count() })
    .from(llavesApi)
    .where(eq(llavesApi.ownerId, ownerId))
  if (total >= MAX_LLAVES) return { error: DEMASIADAS_LLAVES }

  const llave = generarLlave()
  await db.insert(llavesApi).values({
    ownerId,
    nombre: validado.nombre,
    hash: hashLlave(llave),
    final: finalDe(llave),
  })
  return { llave }
}

/**
 * Revocar es borrar: la próxima petición con esa llave ya no encuentra fila. Atada al dueño
 * por la misma razón que todo lo demás —el id viaja desde el navegador—, así que nadie
 * revoca la llave de otro adivinando un id.
 */
export async function revocarLlave(ownerId: string, id: string): Promise<void> {
  await getDb()
    .delete(llavesApi)
    .where(and(eq(llavesApi.id, id), eq(llavesApi.ownerId, ownerId)))
}
