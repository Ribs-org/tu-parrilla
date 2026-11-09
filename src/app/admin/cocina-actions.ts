'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { borrarAjuste, guardarAjuste } from '@/lib/ajustes'
import { requireUser } from '@/lib/auth'
import { CLAVE_CORREOS_DE_LA_COCINA, CORREOS_APAGADOS } from '@/lib/cocina/correo-de-comanda'
import { CREATIVO_NO_ESTA, descartarCreativo, leerDescarte, programarCreativo } from '@/lib/cocina/meson'
import { cambiarElMaterial, cancelarLaComanda, sacarDeLaCamara } from '@/lib/cocina/del-dueno'
import { verEntrega } from '@/lib/cocina/panel'
import { leerPedido } from '@/lib/cocina/pedido'
import { NO_SE_PIDIO, pedirComanda } from '@/lib/cocina/pedir'
import { responderPregunta } from '@/lib/cocina/preguntar'
import { esUuid } from '@/lib/uuid'

// Lo que el dueño hace con sus comandas desde La Cocina. Aparte de `actions.ts`, que ya es largo:
// pedir, cancelar, contestarle al chef, programar y descartar desde el mesón, la cámara de frío,
// la entrega que ya vio salir y sus correos. El id del dueño sale siempre de la sesión, nunca de lo
// que llega. Cancelar, cambiar y sacar son los mismos que hace la app del teléfono
// (`src/lib/cocina/del-dueno.ts`).

/** Cancela una comanda propia que todavía no está en el horno. No pide la cocina encendida: si el admin la apagó, igual se puede cancelar. */
export async function cancelarComandaPropia(id: string): Promise<{ error?: string }> {
  const usuario = await requireUser()
  const r = await cancelarLaComanda(usuario.id, id, new Date())
  revalidatePath('/admin/ia')
  return 'error' in r ? { error: r.error } : {}
}

/**
 * Le contesta al chef una pregunta propia que sigue esperando: una de sus opciones, o el texto
 * libre. La comanda vuelve a donde estaba, y el chef lo lee en su próxima vuelta. No pide la cocina
 * encendida, como cancelar.
 */
export async function responderPreguntaPropia(preguntaId: string, respuesta: unknown): Promise<{ error?: string }> {
  const usuario = await requireUser()
  const r = await responderPregunta(usuario.id, preguntaId, respuesta, new Date())
  revalidatePath('/admin/ia')
  return 'error' in r ? { error: r.error } : {}
}

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
  const r = await cambiarElMaterial(usuario.id, id, nombre, uso)
  revalidatePath('/admin/ia/bodega')
  return 'error' in r ? { error: r.error } : {}
}

/**
 * Saca un material de la cámara y lo borra del almacén, si ninguna comanda en marcha lo usa. No
 * pide la cocina encendida: si el admin la apagó, el dueño igual puede hacer espacio.
 */
export async function sacarMaterialPropio(id: string): Promise<{ error?: string }> {
  const usuario = await requireUser()
  const r = await sacarDeLaCamara(usuario.id, id, new Date())
  revalidatePath('/admin/ia/bodega')
  revalidatePath('/admin/ia')
  return 'error' in r ? { error: r.error } : {}
}

/**
 * Anota que el dueño vio salir esa entrega de una comanda suya —la primera tanda o la comanda
 * lista—, para que la animación no se repita (`entrega-del-plato.tsx`). La llama la tarjeta al
 * empezar a animarla. No revalida nada: la página ya muestra lo que hay, y volver a dibujarla
 * cortaría la animación.
 */
export async function verEntregaPropia(id: unknown, entrega: unknown): Promise<void> {
  const usuario = await requireUser()
  if (typeof id !== 'string' || !esUuid(id)) return
  if (entrega !== 'sirviendo' && entrega !== 'lista') return
  await verEntrega(usuario.id, id, entrega)
}

/**
 * Enciende o apaga los correos de La Cocina del dueño: los de cada entrega y cada final de sus
 * comandas. Encendidos es sin fila, como antes de que se pudieran apagar; apagados, la fila
 * (`CLAVE_CORREOS_DE_LA_COCINA`). Lo que llega se valida: solo `true` los enciende.
 */
export async function guardarCorreosDeLaCocina(encendidos: unknown): Promise<{ error?: string }> {
  const usuario = await requireUser()
  if (encendidos === true) await borrarAjuste(usuario.id, CLAVE_CORREOS_DE_LA_COCINA)
  else await guardarAjuste(usuario.id, CLAVE_CORREOS_DE_LA_COCINA, CORREOS_APAGADOS)
  revalidatePath('/admin/cuenta')
  return {}
}
