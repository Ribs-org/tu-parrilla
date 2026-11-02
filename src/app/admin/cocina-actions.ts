'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { CREATIVO_NO_ESTA, descartarCreativo, leerDescarte, programarCreativo } from '@/lib/cocina/meson'
import { COMANDA_AJENA, COMANDA_NO_CANCELABLE, cancelarComanda } from '@/lib/cocina/panel'
import { MATERIAL_EN_USO, MATERIAL_NO_EXISTE, USO_DESCONOCIDO, esUso, leerNombre } from '@/lib/cocina/bodega'
import { editarMaterial, sacarMaterial } from '@/lib/cocina/materiales'
import { leerPedido } from '@/lib/cocina/pedido'
import { ACOMPANAMIENTO_NO_SIRVE, PRINCIPAL_NO_SIRVE, pedirComanda } from '@/lib/cocina/pedir'
import { COCINA_APAGADA } from '@/lib/cocina/subidas'
import { esUuid } from '@/lib/uuid'

// Lo que el dueño hace con sus comandas desde La Cocina. Aparte de `actions.ts`, que ya es largo:
// la cocina va a sumar pedir, responder y programar desde el mesón. El id del dueño sale siempre de
// la sesión, nunca de lo que llega.

/** Cancela una comanda propia que todavía no está en el horno. No pide la cocina encendida: si el admin la apagó, igual se puede cancelar. */
export async function cancelarComandaPropia(id: string): Promise<{ error?: string }> {
  const usuario = await requireUser()
  if (!esUuid(id)) return { error: COMANDA_AJENA }
  const r = await cancelarComanda(usuario.id, id, new Date())
  revalidatePath('/admin/ia')
  if ('falla' in r) return { error: r.falla === 'no-existe' ? COMANDA_AJENA : COMANDA_NO_CANCELABLE }
  return {}
}

const NO_SE_PIDIO = {
  apagada: COCINA_APAGADA,
  principal: PRINCIPAL_NO_SIRVE,
  acompanamiento: ACOMPANAMIENTO_NO_SIRVE,
} as const

/**
 * Cuelga una comanda con lo que el formulario eligió de la cámara de frío y lo que pidió, y vuelve a
 * La Cocina, donde aparece arriba. Llega como objeto y no como `FormData`: los archivos ya están en
 * la cámara, y lo que viaja son sus ids. Mandarla dos veces no la duplica (`ref`).
 */
export async function pedirComandaPropia(datos: unknown): Promise<{ error?: string }> {
  const usuario = await requireUser()
  const pedido = leerPedido(datos)
  if ('error' in pedido) return { error: pedido.error }
  const r = await pedirComanda(usuario, pedido, new Date())
  if ('falla' in r) return { error: NO_SE_PIDIO[r.falla] }
  revalidatePath('/admin/ia')
  redirect('/admin/ia')
}

/**
 * Saca un creativo del mesón con su motivo y su nota, que le quedan al chef. Si era lo último de una
 * comanda lista, la comanda queda servida.
 */
export async function descartarCreativoPropio(id: string, motivo: unknown, nota: unknown): Promise<{ error?: string }> {
  const usuario = await requireUser()
  if (!esUuid(id)) return { error: CREATIVO_NO_ESTA }
  const descarte = leerDescarte(motivo, nota)
  if ('error' in descarte) return { error: descarte.error }
  const r = await descartarCreativo(usuario.id, id, descarte.motivo, descarte.nota, new Date())
  revalidatePath('/admin/ia/meson')
  revalidatePath('/admin/ia')
  return 'falla' in r ? { error: CREATIVO_NO_ESTA } : {}
}

/**
 * «Programar» desde el mesón: lo pasa a un borrador de La Parrilla con su texto, su título de YouTube
 * y su media, y abre el compositor con ese borrador. Faltan las cuentas y la hora; la portada y los
 * atributos los pone el post al programarse.
 */
export async function programarCreativoPropio(id: string): Promise<{ error?: string }> {
  const usuario = await requireUser()
  if (!esUuid(id)) return { error: CREATIVO_NO_ESTA }
  const r = await programarCreativo(usuario.id, id, new Date())
  if ('falla' in r) return { error: CREATIVO_NO_ESTA }
  revalidatePath('/admin/ia/meson')
  revalidatePath('/admin/schedule')
  redirect(`/admin/schedule?borrador=${r.borradorId}`)
}

/**
 * Le cambia el nombre y el uso a un material de la cámara de frío. Lo que ya se pidió con él no
 * cambia: la comanda guardó su foto. No pide la cocina encendida, como sacar.
 */
export async function editarMaterialPropio(id: string, nombre: unknown, uso: unknown): Promise<{ error?: string }> {
  const usuario = await requireUser()
  const limpio = leerNombre(nombre)
  if (typeof limpio !== 'string') return { error: limpio.error }
  if (uso !== null && !esUso(uso)) return { error: USO_DESCONOCIDO }
  const r = await editarMaterial(usuario.id, id, { nombre: limpio, uso })
  revalidatePath('/admin/ia/bodega')
  return 'falla' in r ? { error: MATERIAL_NO_EXISTE } : {}
}

const NO_SE_SACO = 'No se pudo sacar: el almacén no respondió. Vuelve a intentarlo en un rato.'

/**
 * Saca un material de la cámara y lo borra del almacén, si ninguna comanda en marcha lo usa. No
 * pide la cocina encendida: si el admin la apagó, el dueño igual puede hacer espacio.
 */
export async function sacarMaterialPropio(id: string): Promise<{ error?: string }> {
  const usuario = await requireUser()
  let r: Awaited<ReturnType<typeof sacarMaterial>>
  try {
    r = await sacarMaterial(usuario.id, id, new Date())
  } catch (e) {
    // El archivo se borra antes de soltar el material: si el almacén falla, nada cambió.
    console.error('sacarMaterialPropio:', String(e).slice(0, 300))
    return { error: NO_SE_SACO }
  }
  revalidatePath('/admin/ia/bodega')
  revalidatePath('/admin/ia')
  if ('falla' in r) return { error: r.falla === 'en-uso' ? MATERIAL_EN_USO : MATERIAL_NO_EXISTE }
  return {}
}
