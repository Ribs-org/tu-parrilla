// La base y el correo de los avisos: la caída de una cuenta y el resumen del día. Las
// reglas —qué es una caída, qué entra en el resumen, qué dice cada correo— están en
// `./reglas.ts`, puras; esto solo las alimenta y manda lo que digan.
import { and, count, desc, eq, gt, gte, inArray, isNotNull, isNull, lt, max, sql } from 'drizzle-orm'
import { creativos, getDb, insumos, scheduledPosts, scheduledPostTargets, socialAccounts, users } from '@/db'
import { DIAS_DE_AVISO } from '@/lib/cocina/barrido'
import { dominioProducto } from '@/lib/dominios'
import { destinatario, enviarAviso } from '@/lib/social/publish/alert'
import { avisoDeFierro } from '@/lib/push/avisos'
import { avisarAlTelefono, noSalio } from '@/lib/push/enviar'
import { temaDe } from '@/lib/tema'
import { ZONA_POR_DEFECTO } from '@/lib/zona'
import {
  DIAS_DE_PISTA,
  DIAS_EN_USO,
  HORAS_DE_FALLIDOS,
  correoDeCaida,
  correoDeResumen,
  cuentasEnRiesgo,
  estaCaida,
  fierroQueAvisa,
  pistaCorta,
  type CuentaVigilada,
  type PorVencer,
  type Resumen,
} from './reglas'

const PENDIENTES = ['scheduled', 'publishing'] as const

/** El origen del panel para los enlaces del correo; sin dominio del producto, la ruta sola. */
function sitio(): string {
  const dominio = dominioProducto()
  return dominio ? `https://${dominio}` : ''
}

/** Lo que `reglas.ts` necesita de una cuenta, sin traer el token: basta saber si lo hay. */
const columnasVigiladas = {
  id: socialAccounts.id,
  ownerId: socialAccounts.ownerId,
  network: socialAccounts.network,
  handle: socialAccounts.handle,
  conCredencial: sql<boolean>`${socialAccounts.accessToken} is not null`,
  expiresAt: socialAccounts.expiresAt,
  lastSyncError: socialAccounts.lastSyncError,
  caidaAvisadaEn: socialAccounts.caidaAvisadaEn,
}

/**
 * Un destino falló porque la red rechazó la conexión (`MOTIVOS_DE_CONEXION`): se anota en
 * la cuenta, para que su fierro se enfríe en el panel y `vigilarConexiones` mande el correo.
 * Hace falta porque la red puede rechazar al publicar una conexión que la sincronización
 * todavía da por buena.
 *
 * Solo en una cuenta con credencial y sin un error ya escrito: una desconectada a
 * propósito no se convierte en caída, y un motivo anterior no se pisa. La sincronización
 * siguiente que funcione lo borra, como cualquier otro error suyo. Falla en silencio: no
 * poder anotarlo no es motivo para tumbar la corrida que publica.
 */
export async function marcarCaida(accountId: string, motivo: string): Promise<void> {
  try {
    await getDb()
      .update(socialAccounts)
      .set({ lastSyncError: motivo })
      .where(and(eq(socialAccounts.id, accountId), isNotNull(socialAccounts.accessToken), isNull(socialAccounts.lastSyncError)))
  } catch (error) {
    console.error('No se pudo anotar la caída de la cuenta:', String(error).slice(0, 300))
  }
}

/**
 * Manda un correo por cada cuenta que se cayó desde la última vez, y olvida las que se
 * recuperaron. Corre en cada pasada del cron de publicación, así que el aviso sale cinco
 * minutos después de que la caída quedó escrita —por la sincronización del día, por una
 * baja desde Facebook o por un destino que la red rechazó (`marcarCaida`)— o de que venció
 * el permiso.
 *
 * Uno por caída y no uno por post: `caidaAvisadaEn` lo marca al avisar y se borra cuando el
 * fierro vuelve a calentarse. La marca se toma antes de mandar, con la columna todavía nula
 * en el `where`, porque dos corridas pueden cruzarse; si el correo no sale, se suelta para
 * que la pasada siguiente lo intente de nuevo.
 */
export async function vigilarConexiones(ahora: Date = new Date()): Promise<{ avisadas: number; recuperadas: number; alTelefono: number }> {
  const db = getDb()
  const cuentas = await db
    .select({ ...columnasVigiladas, pushFierro: socialAccounts.pushFierro, correo: users.correo, tema: users.tema })
    .from(socialAccounts)
    .leftJoin(users, eq(users.id, socialAccounts.ownerId))

  let avisadas = 0
  let recuperadas = 0
  let alTelefono = 0
  for (const cuenta of cuentas) {
    if (await avisarFierroAlTelefono(cuenta, ahora)) alTelefono++
    const caida = estaCaida(cuenta, ahora)

    if (!caida && cuenta.caidaAvisadaEn) {
      await db.update(socialAccounts).set({ caidaAvisadaEn: null }).where(eq(socialAccounts.id, cuenta.id))
      recuperadas++
      continue
    }
    if (!caida || cuenta.caidaAvisadaEn) continue

    const para = destinatario(cuenta.correo ?? undefined)
    if (!para) continue
    const tomada = await db
      .update(socialAccounts)
      .set({ caidaAvisadaEn: ahora })
      .where(and(eq(socialAccounts.id, cuenta.id), isNull(socialAccounts.caidaAvisadaEn)))
      .returning({ id: socialAccounts.id })
    if (tomada.length === 0) continue

    const [{ pendientes } = { pendientes: 0 }] = await db
      .select({ pendientes: count() })
      .from(scheduledPostTargets)
      .where(and(eq(scheduledPostTargets.accountId, cuenta.id), inArray(scheduledPostTargets.status, [...PENDIENTES])))
    // Vencida es la única caída sin error escrito y con credencial: lo demás es la red diciendo que no.
    const vencida = cuenta.conCredencial && !cuenta.lastSyncError
    const enviado = await enviarAviso(
      para,
      correoDeCaida({ red: cuenta.network, handle: cuenta.handle, vencida }, pendientes, sitio(), temaDe(cuenta.tema)),
    )
    if (enviado) {
      avisadas++
    } else {
      await db
        .update(socialAccounts)
        .set({ caidaAvisadaEn: null })
        .where(and(eq(socialAccounts.id, cuenta.id), eq(socialAccounts.caidaAvisadaEn, ahora)))
    }
  }
  return { avisadas, recuperadas, alTelefono }
}

/**
 * El aviso al teléfono de una cuenta que se enfría o se apagó, uno por cada estado nuevo de su
 * fierro: `push_fierro` guarda el que ya se avisó y se borra cuando vuelve al rojo. Va aparte de la
 * marca del correo (`caidaAvisadaEn`), para no cambiar cuándo se reintenta el correo. La marca se toma
 * antes de mandar, con el valor leído en el `where`; si Expo no aceptó ninguno habiendo teléfonos, se
 * suelta para la pasada siguiente. Sin teléfonos se queda puesta: encender los avisos después no
 * trae el aviso de una caída vieja. Devuelve si salió. No lanza.
 */
async function avisarFierroAlTelefono(
  cuenta: { id: string; ownerId: string | null; network: string; handle: string | null; pushFierro: 'enfriandose' | 'frio' | null } & CuentaVigilada,
  ahora: Date,
): Promise<boolean> {
  try {
    const db = getDb()
    const estado = fierroQueAvisa(cuenta, ahora)
    if (estado === cuenta.pushFierro) return false
    const antes = cuenta.pushFierro
    const tomada = await db
      .update(socialAccounts)
      .set({ pushFierro: estado })
      .where(
        and(
          eq(socialAccounts.id, cuenta.id),
          antes ? eq(socialAccounts.pushFierro, antes) : isNull(socialAccounts.pushFierro),
        ),
      )
      .returning({ id: socialAccounts.id })
    if (tomada.length === 0 || !estado) return false
    const enviado = await avisarAlTelefono(cuenta.ownerId, (tema) =>
      avisoDeFierro({ red: cuenta.network, handle: cuenta.handle, estado }, tema),
    )
    if (noSalio(enviado)) {
      await db
        .update(socialAccounts)
        .set({ pushFierro: antes })
        .where(and(eq(socialAccounts.id, cuenta.id), eq(socialAccounts.pushFierro, estado)))
      return false
    }
    return enviado.aceptados > 0
  } catch (error) {
    console.error('[push] No se pudo avisar el fierro al teléfono:', String(error).slice(0, 300))
    return false
  }
}

/**
 * El resumen de un dueño: lo que se quemó en las últimas `horas`, las cuentas que hay que
 * reconectar y las cuentas en uso con menos de `dias` días programados. Lo leen el correo
 * del día y `GET /api/schedule/resumen`, con los mismos números.
 */
export async function leerResumen(
  ownerId: string,
  ahora: Date,
  opciones: { dias: number; horas: number } = { dias: DIAS_DE_PISTA, horas: HORAS_DE_FALLIDOS },
): Promise<Resumen> {
  const db = getDb()
  const desdeFallidos = new Date(ahora.getTime() - opciones.horas * 3_600_000)
  const desdeEnUso = new Date(ahora.getTime() - DIAS_EN_USO * 86_400_000)

  const quemados = await db
    .select({
      postId: scheduledPosts.id,
      fecha: scheduledPosts.scheduledAt,
      texto: scheduledPosts.caption,
      red: scheduledPostTargets.network,
      cuentaId: scheduledPostTargets.accountId,
      handle: socialAccounts.handle,
      error: scheduledPostTargets.lastError,
      intentos: scheduledPostTargets.attemptCount,
    })
    .from(scheduledPostTargets)
    .innerJoin(scheduledPosts, eq(scheduledPosts.id, scheduledPostTargets.postId))
    .leftJoin(socialAccounts, eq(socialAccounts.id, scheduledPostTargets.accountId))
    .where(
      and(
        eq(scheduledPosts.ownerId, ownerId),
        eq(scheduledPostTargets.status, 'failed'),
        // Lo archivado ya no pide nada (`archivar.ts`): ni en el correo ni en la API.
        isNull(scheduledPostTargets.archivadoEn),
        gte(scheduledPostTargets.updatedAt, desdeFallidos),
      ),
    )
    .orderBy(desc(scheduledPostTargets.updatedAt))

  const cuentas: CuentaVigilada[] = await db
    .select(columnasVigiladas)
    .from(socialAccounts)
    .where(eq(socialAccounts.ownerId, ownerId))

  // En uso: con credencial y con algo programado en los últimos `DIAS_EN_USO` días, salido o no.
  const usadas = new Set(
    (
      await db
        .selectDistinct({ cuentaId: scheduledPostTargets.accountId })
        .from(scheduledPostTargets)
        .innerJoin(scheduledPosts, eq(scheduledPosts.id, scheduledPostTargets.postId))
        .where(and(eq(scheduledPosts.ownerId, ownerId), gte(scheduledPosts.scheduledAt, desdeEnUso)))
    ).map((f) => f.cuentaId),
  )
  // Lo último que cada cuenta tiene por salir, de ahora en adelante: lo atrasado no es parrilla.
  const ultimas = new Map<string, Date>()
  for (const f of await db
    .select({ cuentaId: scheduledPostTargets.accountId, ultima: max(scheduledPosts.scheduledAt) })
    .from(scheduledPostTargets)
    .innerJoin(scheduledPosts, eq(scheduledPosts.id, scheduledPostTargets.postId))
    .where(
      and(
        eq(scheduledPosts.ownerId, ownerId),
        inArray(scheduledPostTargets.status, [...PENDIENTES]),
        gt(scheduledPosts.scheduledAt, ahora),
      ),
    )
    .groupBy(scheduledPostTargets.accountId)) {
    if (f.ultima) ultimas.set(f.cuentaId, f.ultima)
  }

  return {
    fallidos: quemados,
    cuentas: cuentasEnRiesgo(cuentas, ahora),
    pista: pistaCorta(
      cuentas.filter((c) => c.conCredencial && usadas.has(c.id)),
      ultimas,
      ahora,
      opciones.dias,
    ),
    meson: await porVencerEnElMeson(ownerId, ahora),
  }
}

/** Lo que vence en el mesón en los próximos `DIAS_DE_AVISO` días, por comanda, del que vence antes al que vence después. */
async function porVencerEnElMeson(ownerId: string, ahora: Date): Promise<PorVencer[]> {
  const db = getDb()
  const hasta = new Date(ahora.getTime() + DIAS_DE_AVISO * 86_400_000)
  const filas = await db
    .select({ comandaId: creativos.comandaId, vence: creativos.expiraEn })
    .from(creativos)
    .where(and(eq(creativos.ownerId, ownerId), eq(creativos.estado, 'mesa'), gt(creativos.expiraEn, ahora), lt(creativos.expiraEn, hasta)))
  if (filas.length === 0) return []
  const porComanda = new Map<string, { cuantos: number; vence: Date }>()
  for (const f of filas) {
    const antes = porComanda.get(f.comandaId)
    porComanda.set(f.comandaId, {
      cuantos: (antes?.cuantos ?? 0) + 1,
      vence: antes && antes.vence < f.vence! ? antes.vence : f.vence!,
    })
  }
  const nombres = await db
    .select({ comandaId: insumos.comandaId, nombre: insumos.nombre })
    .from(insumos)
    .where(and(inArray(insumos.comandaId, [...porComanda.keys()]), eq(insumos.tipo, 'principal')))
  return [...porComanda]
    .map(([comandaId, p]) => ({ comanda: nombres.find((n) => n.comandaId === comandaId)?.nombre ?? null, ...p }))
    .sort((a, b) => a.vence.getTime() - b.vence.getTime())
}

/**
 * El correo del día, a cada dueño que tenga algo que mirar. Corre una vez al día, después de
 * la sincronización (`/api/cron/sync-social`), para que el estado de las cuentas sea el de
 * esa mañana. Un dueño que falla no detiene a los demás.
 */
export async function enviarResumenes(ahora: Date = new Date()): Promise<{ enviados: number; fallidos: number }> {
  const duenos = await getDb()
    .select({ id: users.id, correo: users.correo, zona: users.zona, tema: users.tema })
    .from(users)
  let enviados = 0
  let fallidos = 0
  for (const dueno of duenos) {
    try {
      const correo = correoDeResumen(
        await leerResumen(dueno.id, ahora),
        dueno.zona ?? ZONA_POR_DEFECTO,
        sitio(),
        ahora,
        dueno.tema,
      )
      if (!correo) continue
      if (await enviarAviso(dueno.correo, correo)) enviados++
      else fallidos++
    } catch (error) {
      fallidos++
      console.error('No se pudo armar el resumen de un dueño:', String(error).slice(0, 300))
    }
  }
  return { enviados, fallidos }
}
