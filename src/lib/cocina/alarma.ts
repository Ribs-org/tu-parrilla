import { and, eq, inArray, isNotNull, isNull } from 'drizzle-orm'
import { comandas, getDb, insumos, users, type EstadoComanda } from '@/db'
import { dominioProducto } from '@/lib/dominios'
import { env } from '@/lib/env'
import { destinatario, enviarAviso } from '@/lib/social/publish/alert'
import { ZONA_POR_DEFECTO } from '@/lib/zona'
import { NOMBRE_ESTADO } from './nombres'
import { instruccionDe } from './pedido'

// La red de seguridad de la cocina: un correo al admin cuando una comanda lleva rato sin que el
// chef la mueva. No es el proceso —el chef toma, cocina y entrega solo, o lo hace una persona—, es
// lo que avisa si el proceso se cayó. Nació el 2026-11-06, después de que la comanda de un cliente
// pasó cuatro días en «Comanda colgada» sin que nadie se enterara (VicentePareja/marca-personal#22).
//
// Dos motivos, cada uno una vez por comanda:
//
// - **sin tomar:** lleva más de `MINUTOS_SIN_TOMAR` en `recibida`. Se marca en
//   `comandas.alarma_recibida_en`, y no vuelve a sonar aunque siga ahí;
// - **atrasada:** su hora estimada pasó hace más de `MINUTOS_PASADA_LA_ETA` y el chef no dio otra.
//   Se marca la hora estimada que ya sonó (`comandas.alarma_eta`): si el chef da una nueva y
//   también pasa, es otro atraso y vuelve a sonar. Solo mientras la tiene el chef: en `pregunta`
//   espera al dueño, no al chef.
//
// Corre en cada pasada del cron de publicación (cada cinco minutos) y junta todo lo nuevo en un
// solo correo. La marca se toma antes de mandar, con la condición en el `where`, porque dos
// corridas pueden cruzarse; si el correo no sale, se suelta para que la pasada siguiente lo intente.
// Lee comandas de todos los dueños con la cocina encendida, como el chef: es el admin el que avisa.

export const MINUTOS_SIN_TOMAR = 30
export const MINUTOS_PASADA_LA_ETA = 60

/** Donde la comanda espera al chef y su hora estimada es una promesa suya. */
export const LAS_TIENE_EL_CHEF: ReadonlySet<EstadoComanda> = new Set(['revisando', 'en_preparacion', 'en_el_horno', 'sirviendo'])

export type MotivoDeAlarma = 'sin-tomar' | 'atrasada'

export type ParaLaAlarma = {
  estado: EstadoComanda
  creadaEn: Date
  eta: Date | null
  alarmaRecibidaEn: Date | null
  alarmaEta: Date | null
}

/** Si esta comanda tiene que sonar ahora, y por qué; null si no, o si ya sonó por eso. */
export function motivoDeAlarma(c: ParaLaAlarma, ahora: Date): MotivoDeAlarma | null {
  if (c.estado === 'recibida') {
    return !c.alarmaRecibidaEn && ahora.getTime() - c.creadaEn.getTime() > MINUTOS_SIN_TOMAR * 60_000 ? 'sin-tomar' : null
  }
  if (!LAS_TIENE_EL_CHEF.has(c.estado) || !c.eta) return null
  if (ahora.getTime() - c.eta.getTime() <= MINUTOS_PASADA_LA_ETA * 60_000) return null
  return c.alarmaEta?.getTime() === c.eta.getTime() ? null : 'atrasada'
}

/** «45 min», «1 h 20 min», «4 días»: cuánto lleva, para leerlo de un vistazo. */
export function tiempoEnPalabras(ms: number): string {
  const minutos = Math.max(1, Math.round(ms / 60_000))
  if (minutos < 60) return `${minutos} min`
  const horas = Math.floor(minutos / 60)
  if (horas < 48) {
    const resto = minutos % 60
    return resto ? `${horas} h ${resto} min` : `${horas} h`
  }
  return `${Math.floor(horas / 24)} días`
}

export type ComandaEnAlarma = {
  id: string
  motivo: MotivoDeAlarma
  estado: EstadoComanda
  cliente: { nombre: string | null; correo: string | null }
  creadaEn: Date
  eta: Date | null
  principal: string | null
  instruccion: string | null
}

/** El correo al admin con todo lo que sonó en esta pasada. `sitio` es el origen del panel, o vacío. */
export function correoDeAlarma(
  lista: readonly ComandaEnAlarma[],
  ahora: Date,
  sitio: string,
  zona: string = ZONA_POR_DEFECTO,
): { subject: string; text: string } {
  const fecha = new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeStyle: 'short', timeZone: zona })
  const sinTomar = lista.filter((c) => c.motivo === 'sin-tomar').length
  const atrasadas = lista.length - sinTomar
  const partes = [
    sinTomar ? (sinTomar === 1 ? 'una comanda sin tomar' : `${sinTomar} comandas sin tomar`) : null,
    atrasadas ? (atrasadas === 1 ? 'una comanda atrasada' : `${atrasadas} comandas atrasadas`) : null,
  ].filter(Boolean)
  const bloques = lista.map((c) => {
    const cliente = [c.cliente.nombre?.trim() || 'Sin nombre', c.cliente.correo ? `(${c.cliente.correo})` : null].filter(Boolean).join(' ')
    const cual = `comanda ${c.id.slice(0, 8)}${c.principal ? ` («${c.principal}»)` : ''}`
    const titulo =
      c.motivo === 'sin-tomar'
        ? `Sin tomar hace ${tiempoEnPalabras(ahora.getTime() - c.creadaEn.getTime())}: ${cliente}, ${cual}.`
        : `Pasó su hora estimada hace ${tiempoEnPalabras(ahora.getTime() - c.eta!.getTime())}, en «${NOMBRE_ESTADO[c.estado].noche}»: ${cliente}, ${cual}.`
    return [
      `- ${titulo}`,
      `  Pedida el ${fecha.format(c.creadaEn)}${c.eta ? `; hora estimada, ${fecha.format(c.eta)}` : ''}.`,
      `  Pidió: ${c.instruccion ? `«${c.instruccion}»` : 'sin instrucción al chef'}.`,
      `  Id: ${c.id}`,
    ].join('\n')
  })
  return {
    subject: `La Cocina: ${partes.join(' y ')}`,
    text: [
      'Una red de seguridad, no el proceso: estas comandas llevan rato sin que el chef las mueva.',
      '',
      ...bloques.flatMap((b) => [b, '']),
      'Para tomarlas a mano, el chef tiene su línea de comandos en marca-personal (pipeline/cocina/AGENTS.md). La cuenta de cada cliente, y si tiene la cocina encendida, en Los Maestros: ' +
        `${sitio}/admin/usuarios`,
      '',
      `Llega una vez por comanda y por motivo: sin tomar a los ${MINUTOS_SIN_TOMAR} minutos, y atrasada cuando su hora estimada pasó hace más de ${MINUTOS_PASADA_LA_ETA / 60 === 1 ? 'una hora' : `${MINUTOS_PASADA_LA_ETA / 60} horas`}; otra vez si el chef da una hora nueva y también pasa.`,
    ].join('\n'),
  }
}

function sitio(): string {
  const dominio = dominioProducto()
  return dominio ? `https://${dominio}` : ''
}

export type VigiliaDeLaCocina = { avisadas: number; error?: string }

/**
 * Mira las comandas en marcha de quienes tienen la cocina encendida y le manda al admin un correo
 * con las que sonaron en esta pasada (`motivoDeAlarma`). Sin `ADMIN_EMAIL` (o `PUBLISH_ALERT_TO`)
 * ni `RESEND_API_KEY` no hay a quién ni cómo avisar, y no marca nada. Nunca lanza: la corrida que lo
 * llama ya publicó.
 */
export async function vigilarLaCocina(ahora: Date = new Date()): Promise<VigiliaDeLaCocina> {
  const para = destinatario(env('ADMIN_EMAIL'))
  if (!para || !env('RESEND_API_KEY')) return { avisadas: 0 }
  try {
    const db = getDb()
    const candidatas = await db
      .select({ comanda: comandas, nombre: users.nombre, correo: users.correo })
      .from(comandas)
      .innerJoin(users, eq(users.id, comandas.ownerId))
      .where(and(inArray(comandas.estado, ['recibida', ...LAS_TIENE_EL_CHEF]), isNotNull(users.cocinaDesde)))

    // Se toma la marca de cada una antes de mandar, con la misma condición en el `where`: si otra
    // corrida la tomó primero, esta no la cuenta.
    const tomadas: Array<{ alarma: ComandaEnAlarma; soltar: () => Promise<unknown> }> = []
    for (const { comanda: c, nombre, correo } of candidatas) {
      const motivo = motivoDeAlarma(c, ahora)
      if (!motivo) continue
      const alarma: ComandaEnAlarma = {
        id: c.id,
        motivo,
        estado: c.estado,
        cliente: { nombre, correo },
        creadaEn: c.creadaEn,
        eta: c.eta,
        principal: null,
        instruccion: instruccionDe(c.pedido),
      }
      if (motivo === 'sin-tomar') {
        const [fila] = await db
          .update(comandas)
          .set({ alarmaRecibidaEn: ahora })
          .where(and(eq(comandas.id, c.id), eq(comandas.estado, 'recibida'), isNull(comandas.alarmaRecibidaEn)))
          .returning({ id: comandas.id })
        if (!fila) continue
        tomadas.push({
          alarma,
          soltar: () =>
            db
              .update(comandas)
              .set({ alarmaRecibidaEn: null })
              .where(and(eq(comandas.id, c.id), eq(comandas.alarmaRecibidaEn, ahora))),
        })
      } else {
        const eta = c.eta!
        const anterior = c.alarmaEta
        const [fila] = await db
          .update(comandas)
          .set({ alarmaEta: eta })
          .where(
            and(
              eq(comandas.id, c.id),
              eq(comandas.eta, eta),
              anterior ? eq(comandas.alarmaEta, anterior) : isNull(comandas.alarmaEta),
            ),
          )
          .returning({ id: comandas.id })
        if (!fila) continue
        tomadas.push({
          alarma,
          soltar: () =>
            db
              .update(comandas)
              .set({ alarmaEta: anterior })
              .where(and(eq(comandas.id, c.id), eq(comandas.alarmaEta, eta))),
        })
      }
    }
    if (tomadas.length === 0) return { avisadas: 0 }

    const principales = await db
      .select({ comandaId: insumos.comandaId, nombre: insumos.nombre })
      .from(insumos)
      .where(and(inArray(insumos.comandaId, tomadas.map((t) => t.alarma.id)), eq(insumos.tipo, 'principal')))
    for (const t of tomadas) t.alarma.principal = principales.find((p) => p.comandaId === t.alarma.id)?.nombre ?? null

    const lista = tomadas.map((t) => t.alarma).sort((a, b) => a.creadaEn.getTime() - b.creadaEn.getTime())
    if (await enviarAviso(para, correoDeAlarma(lista, ahora, sitio()))) return { avisadas: lista.length }
    for (const t of tomadas) await t.soltar()
    return { avisadas: 0, error: 'El correo de la alarma de la cocina no salió; se intenta en la pasada siguiente.' }
  } catch (error) {
    console.error('Falló la alarma de la cocina:', String(error).slice(0, 300))
    return { avisadas: 0, error: 'La alarma de la cocina falló; ver el log.' }
  }
}
