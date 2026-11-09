import type { ClavePlan } from '@/db/schema'
import { getDb } from '@/db'
import { usoDeLaCamara } from '@/lib/cocina/subidas'
import { cuentasConectadas, esperandoEnLaParrilla, leerPlanes, planDe, tokensDelMes, type PlanDeAlguien } from './planes'
import type { Plan } from './plan'

// Lo que dibuja «Tu plan», en Tu Cuenta: el plan que rige, los dos para comparar, y lo que lleva
// usado de cada tope. Aparte de `planes.ts` porque lee la cámara de frío, que a su vez lee el plan.

export type UsoDelPlan = PlanDeAlguien & {
  planes: Record<ClavePlan, Plan>
  cuentas: number
  enLaParrilla: number
  camara: { ocupados: number; cuota: number }
  tokens: number
}

export async function usoDelPlan(ownerId: string, ahora = new Date()): Promise<UsoDelPlan> {
  const db = getDb()
  const deAlguien = await planDe(ownerId, ahora, db)
  const camara = await usoDeLaCamara(ownerId)
  return {
    ...deAlguien,
    planes: await leerPlanes(db),
    cuentas: await cuentasConectadas(db, ownerId),
    enLaParrilla: await esperandoEnLaParrilla(db, ownerId),
    camara: { ocupados: camara.guardados + camara.subiendo, cuota: camara.cuota },
    tokens: await tokensDelMes(db, ownerId, deAlguien.persona.zona, ahora),
  }
}
