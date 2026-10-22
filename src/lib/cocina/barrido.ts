import { and, eq, isNull, lt } from 'drizzle-orm'
import { creativos, getDb, insumos } from '@/db'
import { borrar } from '@/lib/storage'
import { servirSiTermino, soltarArchivos } from './meson'

// El barrido de la cocina, una vez por hora junto al de huérfanos (`/api/cron/publish-social`).
// Cumple la retención del diseño (`docs/superpowers/specs/2026-10-22-la-cocina-design.md`, «Lo que
// se guarda»):
//
// - lo crudo se borra a los 14 días de terminada su comanda: `insumos.expira_en` lo ponen cancelar,
//   rechazar, fallar y servir;
// - lo que pasa 30 días en el mesón sin que nadie lo programe se borra: `creativos.expira_en` lo
//   pone el cierre de cada creativo. Lo que espera en un borrador no vence: ya está en La Parrilla.

/** El motivo de lo que se borró por viejo: no es un juicio sobre lo que cocinó el chef. */
export const MOTIVO_VENCIDO = 'vencido'

export type BarridoDeLaCocina = { crudos: number; vencidos: number; servidas: number; error?: string }

/** Nunca lanza, como los otros barridos: la corrida que lo llama ya publicó. */
export async function barrerCocina(ahora: Date = new Date()): Promise<BarridoDeLaCocina> {
  const db = getDb()
  let crudos = 0
  let vencidos = 0
  let servidas = 0
  try {
    // Lo crudo vencido se borra del almacén; la fila queda, con `borrado_en`, para la historia de su
    // comanda. Uno que no se pudo borrar queda sin marcar y se intenta en la pasada siguiente: su
    // URL todavía lo nombra, así que el barrido de huérfanos no lo va a recoger.
    const crudosVencidos = await db
      .select({ id: insumos.id, url: insumos.url })
      .from(insumos)
      .where(and(isNull(insumos.borradoEn), lt(insumos.expiraEn, ahora)))
    for (const i of crudosVencidos) {
      try {
        await borrar(i.url)
      } catch (e) {
        console.error('barrido de la cocina: no se pudo borrar un insumo', String(e).slice(0, 200))
        continue
      }
      await db.update(insumos).set({ borradoEn: ahora }).where(eq(insumos.id, i.id))
      crudos += 1
    }

    // Lo que nadie programó: sale del mesón como descartado por viejo, y sus archivos se sueltan.
    const enMesaVencidos = await db
      .update(creativos)
      .set({ estado: 'descartado', descarteMotivo: MOTIVO_VENCIDO })
      .where(and(eq(creativos.estado, 'mesa'), lt(creativos.expiraEn, ahora)))
      .returning({ id: creativos.id, comandaId: creativos.comandaId, portadaUrl: creativos.portadaUrl })
    for (const c of enMesaVencidos) {
      await soltarArchivos(c.id, c.portadaUrl)
      vencidos += 1
    }
    // La comanda que se quedó sin nada por decidir queda servida, y su crudo empieza sus 14 días.
    for (const comandaId of new Set(enMesaVencidos.map((c) => c.comandaId))) {
      if (await servirSiTermino(comandaId, ahora)) servidas += 1
    }
    return { crudos, vencidos, servidas }
  } catch (error) {
    console.error('Falló el barrido de la cocina:', String(error).slice(0, 300))
    return { crudos, vencidos, servidas, error: 'El barrido de la cocina falló; ver el log.' }
  }
}

/** Cuántos días antes de vencer se avisa lo que espera en el mesón. */
export const DIAS_DE_AVISO = 7
