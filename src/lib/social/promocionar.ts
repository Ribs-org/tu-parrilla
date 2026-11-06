// Promocionar desde Tu Parrilla una publicación ya publicada de Instagram o de Facebook
// (`ads_management`, Marketing API). Lo de este archivo es puro: qué se acepta del formulario,
// cuánto es lo máximo que se puede gastar, qué se le manda a Meta y cómo se dice en castellano lo
// que Meta contesta. Lo que habla con Meta y escribe en la base está en `promocionar-meta.ts`.
//
// Lo que se arma es lo mismo que hace el botón «Promocionar» de la app, en cuatro piezas: una
// campaña (el objetivo, y `special_ad_categories: []`, que el dueño confirma), un conjunto de
// anuncios (el presupuesto, las fechas y el público), un creativo que apunta a la publicación que
// ya existe (`object_story_id` en Facebook, `source_instagram_media_id` en Instagram) y el anuncio.
// La campaña nace siempre en pausa y se enciende al final, solo si el dueño eligió eso: si algo
// falla a medio camino, lo que quedó no gasta nada (y se borra).
//
// Nunca se crea nada sin la confirmación del dueño: la acción exige que el gasto máximo que vio
// en la pantalla sea el mismo que calcula el servidor.

import { addDays } from '../schedule-week'
import { countryName, fromZonedInput } from '../utils'

export const OBJETIVOS = ['alcance', 'interaccion', 'trafico'] as const
export type Objetivo = (typeof OBJETIVOS)[number]

export const NOMBRE_OBJETIVO: Record<Objetivo, string> = {
  alcance: 'Que la vea más gente',
  interaccion: 'Más me gusta, comentarios y compartidos',
  trafico: 'Más visitas a tu página',
}

export const TIPOS_PRESUPUESTO = ['diario', 'total'] as const
export type TipoPresupuesto = (typeof TIPOS_PRESUPUESTO)[number]

/** Los países que se ofrecen, en este orden. Uno o varios. */
export const PAISES = ['CL', 'AR', 'PE', 'CO', 'MX', 'UY', 'PY', 'BO', 'EC', 'VE', 'CR', 'PA', 'GT', 'DO', 'ES', 'US', 'BR'] as const

export function nombreDePais(codigo: string): string {
  return countryName(codigo)
}

export const EDAD_MINIMA = 18
export const EDAD_MAXIMA = 65
/** Con el público Advantage+, Meta toma la edad mínima como un límite y deja de aceptarla sobre 25. */
export const EDAD_MINIMA_TOPE_ADVANTAGE = 25
/** Hasta cuándo se puede programar una promoción, contado desde hoy. */
export const DIAS_MAXIMOS = 90

/**
 * Las monedas que Meta cuenta en unidades enteras («offset 1»): un presupuesto de `5000` en CLP
 * son 5.000 pesos; en USD serían 50 dólares, porque se cuenta en centavos. Lista de
 * developers.facebook.com/docs/marketing-api/currencies.
 */
export const OFFSET_1 = new Set(['CLP', 'COP', 'CRC', 'HUF', 'ISK', 'IDR', 'JPY', 'KRW', 'PYG', 'TWD', 'VND'])

/** De lo que escribe el dueño («5000», «12,50») a la unidad mínima que pide Meta. */
export function aUnidadMinima(monto: number, moneda: string): number {
  return OFFSET_1.has(moneda) ? Math.round(monto) : Math.round(monto * 100)
}

export function deUnidadMinima(minimo: number, moneda: string): number {
  return OFFSET_1.has(moneda) ? minimo : minimo / 100
}

/** «15.000 CLP», «12,50 USD»: el monto en la moneda de la cuenta publicitaria. */
export function formatearMonto(minimo: number, moneda: string): string {
  const monto = deUnidadMinima(minimo, moneda)
  try {
    return new Intl.NumberFormat('es', { style: 'currency', currency: moneda, currencyDisplay: 'code' }).format(monto)
  } catch {
    return `${new Intl.NumberFormat('es', { maximumFractionDigits: 2 }).format(monto)} ${moneda}`
  }
}

/** Cuántos días de calendario corre: los dos extremos incluidos. */
export function diasDePromocion(desde: string, hasta: string): number {
  const ms = Date.parse(`${hasta}T00:00:00Z`) - Date.parse(`${desde}T00:00:00Z`)
  return Math.round(ms / 864e5) + 1
}

/** Lo que llega del formulario, ya leído pero sin revisar. */
export type EntradaPromocion = {
  cuentaPublicitariaId: string
  objetivo: string
  tipoPresupuesto: string
  monto: number | null
  desde: string
  hasta: string
  paises: string[]
  edadMin: number
  edadMax: number | null
  advantage: boolean
  /** Que no es vivienda, empleo, crédito ni política: lo confirma el dueño. */
  categorias: boolean
  /** Activa desde la fecha de inicio, o creada en pausa. */
  activar: boolean
  /** El gasto máximo, en unidad mínima, que el dueño vio al confirmar. */
  gastoConfirmado: number | null
}

function entero(valor: FormDataEntryValue | null): number | null {
  if (typeof valor !== 'string' || !/^\d{1,9}$/.test(valor.trim())) return null
  return Number(valor.trim())
}

/** «5.000», «5000», «12,50», «12.5»: el punto de miles chileno y la coma decimal. */
export function leerMonto(texto: string): number | null {
  let t = texto.trim().replace(/\s/g, '')
  if (!t) return null
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.')
  else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, '')
  if (!/^\d+(\.\d{1,2})?$/.test(t)) return null
  const n = Number(t)
  return Number.isFinite(n) && n > 0 ? n : null
}

export function leerFormulario(formData: FormData): EntradaPromocion {
  const texto = (nombre: string) => {
    const v = formData.get(nombre)
    return typeof v === 'string' ? v.trim() : ''
  }
  return {
    cuentaPublicitariaId: texto('cuenta'),
    objetivo: texto('objetivo'),
    tipoPresupuesto: texto('tipoPresupuesto'),
    monto: leerMonto(texto('monto')),
    desde: texto('desde'),
    hasta: texto('hasta'),
    paises: formData.getAll('pais').filter((p): p is string => typeof p === 'string'),
    edadMin: entero(formData.get('edadMin')) ?? EDAD_MINIMA,
    edadMax: entero(formData.get('edadMax')),
    advantage: formData.get('advantage') === '1',
    categorias: formData.get('categorias') === '1',
    activar: formData.get('activar') === '1',
    gastoConfirmado: entero(formData.get('gastoConfirmado')),
  }
}

/** Una cuenta publicitaria como la ofrece el formulario. */
export type CuentaParaPromocionar = {
  id: string
  nombre: string | null
  moneda: string
  /** Por qué no se puede promocionar con ella, o null. */
  problema: string | null
  /** El presupuesto diario mínimo de Meta para esta cuenta, en unidad mínima; null si no se supo. */
  minimoDiario: number | null
}

export type Contexto = {
  network: 'instagram' | 'facebook'
  /** Hoy, en la zona del dueño. */
  hoy: string
  cuentas: readonly CuentaParaPromocionar[]
  /** Si la publicación tiene a dónde mandar las visitas (su link de Tu Parrilla). */
  conEnlace: boolean
}

export type Plan = {
  cuenta: CuentaParaPromocionar
  objetivo: Objetivo
  tipoPresupuesto: TipoPresupuesto
  /** En unidad mínima. */
  presupuesto: number
  gastoMaximo: number
  dias: number
  desde: string
  hasta: string
  paises: string[]
  edadMin: number
  edadMax: number | null
  advantage: boolean
  activar: boolean
}

export const FALTA_CONFIRMAR_CATEGORIAS =
  'Confirma que no es un anuncio de vivienda, empleo, crédito, ni de temas sociales, electorales o políticos: esos Meta los revisa aparte y Tu Parrilla no los arma.'
export const GASTO_CAMBIO = 'El gasto máximo cambió desde que lo revisaste: revísalo de nuevo antes de confirmar.'

/**
 * Lo que se va a crear, o la primera razón por la que no. `confirmando` pide además las dos
 * confirmaciones del último paso: las categorías y el gasto máximo que el dueño vio. Sin
 * `confirmando` sirve para el «Revisar», que muestra el resumen antes de preguntar.
 */
export function revisarPromocion(e: EntradaPromocion, c: Contexto, confirmando: boolean): { error: string } | { plan: Plan } {
  const cuenta = c.cuentas.find((x) => x.id === e.cuentaPublicitariaId)
  if (!cuenta) return { error: 'Elige la cuenta publicitaria con que se paga.' }
  if (cuenta.problema) return { error: cuenta.problema }

  if (!(OBJETIVOS as readonly string[]).includes(e.objetivo)) return { error: 'Elige qué quieres conseguir.' }
  const objetivo = e.objetivo as Objetivo
  if (objetivo === 'trafico' && (c.network !== 'instagram' || !c.conEnlace)) {
    return { error: 'Las visitas a tu página solo se pueden pedir para una publicación de Instagram con su link de Tu Parrilla.' }
  }

  if (!(TIPOS_PRESUPUESTO as readonly string[]).includes(e.tipoPresupuesto)) return { error: 'Elige si el presupuesto es por día o total.' }
  const tipoPresupuesto = e.tipoPresupuesto as TipoPresupuesto
  if (e.monto === null) return { error: `Escribe el presupuesto en ${cuenta.moneda}, solo con números.` }
  const presupuesto = aUnidadMinima(e.monto, cuenta.moneda)
  if (presupuesto < 1) return { error: 'El presupuesto tiene que ser más que cero.' }

  const dia = /^\d{4}-\d{2}-\d{2}$/
  if (!dia.test(e.desde) || addDays(e.desde, 0) !== e.desde) return { error: 'Elige el día en que empieza.' }
  if (!dia.test(e.hasta) || addDays(e.hasta, 0) !== e.hasta) return { error: 'Elige el día en que termina: sin fin no se puede saber cuánto es lo máximo que gastas.' }
  if (e.desde < c.hoy) return { error: 'El día en que empieza ya pasó.' }
  if (e.hasta < e.desde) return { error: 'El día en que termina tiene que ir después del día en que empieza.' }
  if (e.hasta > addDays(c.hoy, DIAS_MAXIMOS)) return { error: `Se puede programar hasta ${DIAS_MAXIMOS} días desde hoy.` }
  if (tipoPresupuesto === 'diario' && e.hasta === e.desde) {
    return { error: 'Con presupuesto por día, Meta pide que dure más de un día. Para un solo día, usa un presupuesto total.' }
  }
  const dias = diasDePromocion(e.desde, e.hasta)

  const paises = [...new Set(e.paises)]
  if (paises.length === 0) return { error: 'Elige al menos un país.' }
  if (paises.some((p) => !(PAISES as readonly string[]).includes(p))) return { error: 'Uno de los países no se puede elegir.' }

  if (e.edadMin < EDAD_MINIMA || e.edadMin > EDAD_MAXIMA) return { error: `La edad mínima va de ${EDAD_MINIMA} a ${EDAD_MAXIMA}.` }
  let edadMax: number | null = null
  if (e.advantage) {
    if (e.edadMin > EDAD_MINIMA_TOPE_ADVANTAGE) {
      return { error: `Con el público Advantage+, la edad mínima puede ser como mucho ${EDAD_MINIMA_TOPE_ADVANTAGE}.` }
    }
  } else {
    edadMax = e.edadMax ?? EDAD_MAXIMA
    if (edadMax < e.edadMin || edadMax > EDAD_MAXIMA) return { error: `La edad máxima va de la mínima a ${EDAD_MAXIMA}.` }
  }

  if (cuenta.minimoDiario !== null) {
    const minimo = tipoPresupuesto === 'diario' ? cuenta.minimoDiario : cuenta.minimoDiario * dias
    if (presupuesto < minimo) {
      return {
        error:
          tipoPresupuesto === 'diario'
            ? `Meta pide al menos ${formatearMonto(minimo, cuenta.moneda)} al día en esta cuenta.`
            : `Para ${dias} ${dias === 1 ? 'día' : 'días'}, Meta pide al menos ${formatearMonto(minimo, cuenta.moneda)} en total en esta cuenta.`,
      }
    }
  }

  const gastoMaximo = tipoPresupuesto === 'diario' ? presupuesto * dias : presupuesto
  if (confirmando) {
    if (!e.categorias) return { error: FALTA_CONFIRMAR_CATEGORIAS }
    if (e.gastoConfirmado !== gastoMaximo) return { error: GASTO_CAMBIO }
  }

  return {
    plan: {
      cuenta,
      objetivo,
      tipoPresupuesto,
      presupuesto,
      gastoMaximo,
      dias,
      desde: e.desde,
      hasta: e.hasta,
      paises,
      edadMin: e.edadMin,
      edadMax,
      advantage: e.advantage,
      activar: e.activar,
    },
  }
}

/**
 * La frase del resumen: «Vas a gastar como máximo 35.000 CLP: 5.000 CLP al día durante 7 días.»
 * Con presupuesto diario, Meta puede gastar más un día y menos otro, pero nunca más que el diario
 * por la cantidad de días.
 */
export function fraseDelGasto(plan: Pick<Plan, 'tipoPresupuesto' | 'presupuesto' | 'gastoMaximo' | 'dias' | 'cuenta'>): string {
  const total = formatearMonto(plan.gastoMaximo, plan.cuenta.moneda)
  const dias = `${plan.dias} ${plan.dias === 1 ? 'día' : 'días'}`
  return plan.tipoPresupuesto === 'diario'
    ? `Vas a gastar como máximo ${total}: ${formatearMonto(plan.presupuesto, plan.cuenta.moneda)} al día durante ${dias}. Meta puede gastar más un día y menos otro, pero nunca más que eso en total.`
    : `Vas a gastar como máximo ${total}, repartido en ${dias}.`
}

/** Inicio y fin para Meta: hoy empieza en unos minutos; otro día, a medianoche; termina a las 23:59. */
export function horario(plan: Pick<Plan, 'desde' | 'hasta'>, hoy: string, ahora: Date, zona: string): { inicio: Date; fin: Date } {
  const inicio = plan.desde === hoy ? new Date(ahora.getTime() + 10 * 60_000) : fromZonedInput(`${plan.desde}T00:00`, zona)!
  const fin = fromZonedInput(`${plan.hasta}T23:59`, zona)!
  return { inicio, fin }
}

const CAMPANA: Record<Objetivo, { objective: string; optimization_goal: string; destination_type?: string }> = {
  alcance: { objective: 'OUTCOME_AWARENESS', optimization_goal: 'REACH' },
  interaccion: { objective: 'OUTCOME_ENGAGEMENT', optimization_goal: 'POST_ENGAGEMENT', destination_type: 'ON_POST' },
  trafico: { objective: 'OUTCOME_TRAFFIC', optimization_goal: 'LINK_CLICKS', destination_type: 'WEBSITE' },
}

/** El nombre con que se reconoce en el Administrador de anuncios. */
export function nombreDePromocion(caption: string | null, campaign: string, hoy: string): string {
  const texto = (caption || campaign).replace(/\s+/g, ' ').trim().slice(0, 40)
  return `Tu Parrilla · ${texto} · ${hoy}`
}

/** Lo que identifica a la publicación promocionada. */
export type Publicacion =
  | { network: 'facebook'; storyId: string }
  | { network: 'instagram'; mediaId: string; instagramUserId: string; paginaId: string; enlace: string | null }

export type Cuerpo = Record<string, unknown>

/** La campaña: siempre en pausa al nacer (ver arriba). */
export function cuerpoCampana(plan: Plan, nombre: string): Cuerpo {
  return {
    name: nombre,
    objective: CAMPANA[plan.objetivo].objective,
    status: 'PAUSED',
    special_ad_categories: [],
    // El presupuesto va en el conjunto, no en la campaña; Meta pide decirlo.
    is_adset_budget_sharing_enabled: false,
  }
}

export function cuerpoConjunto(plan: Plan, nombre: string, campanaId: string, pub: Publicacion, inicio: Date, fin: Date): Cuerpo {
  const meta = CAMPANA[plan.objetivo]
  return {
    name: nombre,
    campaign_id: campanaId,
    [plan.tipoPresupuesto === 'diario' ? 'daily_budget' : 'lifetime_budget']: plan.presupuesto,
    billing_event: 'IMPRESSIONS',
    optimization_goal: meta.optimization_goal,
    ...(meta.destination_type ? { destination_type: meta.destination_type } : {}),
    bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
    start_time: inicio.toISOString(),
    end_time: fin.toISOString(),
    targeting: {
      geo_locations: { countries: plan.paises },
      age_min: plan.edadMin,
      ...(plan.edadMax !== null ? { age_max: plan.edadMax } : {}),
      // Donde se publicó: una publicación de Instagram se promociona en Instagram.
      publisher_platforms: [pub.network],
      // Desde v23 Meta pide decirlo siempre, sí o no.
      targeting_automation: { advantage_audience: plan.advantage ? 1 : 0 },
    },
    status: 'ACTIVE',
  }
}

export function cuerpoCreativo(plan: Plan, nombre: string, pub: Publicacion): Cuerpo {
  if (pub.network === 'facebook') return { name: nombre, object_story_id: pub.storyId }
  return {
    name: nombre,
    object_id: pub.paginaId,
    instagram_user_id: pub.instagramUserId,
    source_instagram_media_id: pub.mediaId,
    ...(plan.objetivo === 'trafico' && pub.enlace
      ? { call_to_action: { type: 'LEARN_MORE', value: { link: pub.enlace } } }
      : {}),
  }
}

export function cuerpoAnuncio(nombre: string, conjuntoId: string, creativoId: string): Cuerpo {
  return { name: nombre, adset_id: conjuntoId, creative: { creative_id: creativoId }, status: 'ACTIVE' }
}

/** Lo que importa de una cuenta publicitaria para saber si se puede usar. */
export type CuentaGraph = {
  id?: string
  name?: string
  currency?: string
  account_status?: number
  funding_source?: string | null
  user_tasks?: string[]
}

/**
 * Por qué no se puede promocionar con esta cuenta, en castellano, o null. Lo dice antes de
 * intentar: un pago pendiente o una cuenta deshabilitada se ven en la cuenta misma, y la frase de
 * Meta al rechazar el anuncio es menos clara. `account_status`: 1 activa, 2 deshabilitada, 3 con
 * un pago pendiente, 7 en revisión, 8 por liquidar, 9 en período de gracia, 100 y 101 cerrándose
 * o cerrada.
 */
export function problemaDeCuenta(c: CuentaGraph): string | null {
  switch (c.account_status) {
    case undefined:
    case 1:
      break
    case 2:
      return 'Meta deshabilitó esta cuenta publicitaria. El motivo está en el Administrador de anuncios, en la Calidad de la cuenta.'
    case 3:
    case 8:
      return 'Esta cuenta publicitaria tiene un pago pendiente: págalo en el Administrador de anuncios (Facturación) y vuelve.'
    case 7:
      return 'Meta está revisando esta cuenta publicitaria: espera a que termine para promocionar con ella.'
    case 9:
      return 'Esta cuenta publicitaria está en período de gracia por un pago: regularízalo en el Administrador de anuncios antes de gastar más.'
    default:
      return 'Esta cuenta publicitaria está cerrada.'
  }
  if (c.user_tasks && !c.user_tasks.some((t) => t === 'ADVERTISE' || t === 'MANAGE')) {
    return 'Tu usuario de Facebook puede ver esta cuenta publicitaria, pero no anunciar con ella: pídele a quien la administra el permiso para anunciar.'
  }
  if (c.funding_source === null || c.funding_source === '') {
    return 'Esta cuenta publicitaria no tiene un medio de pago. Agrégalo en el Administrador de anuncios, en Configuración de pagos, y vuelve.'
  }
  return null
}

/** Un error de Graph tal como viene en `body.error`. */
export type ErrorGraph = {
  message?: string
  code?: number
  error_subcode?: number
  error_user_title?: string
  error_user_msg?: string
}

/**
 * Lo que Meta contestó, dicho para el dueño. Lo que tiene un arreglo conocido —reconectar, el
 * permiso, esperar— va con su frase; lo demás, con la explicación de Meta, que se pide en
 * castellano (`locale=es_LA`) y casi siempre dice qué cambiar.
 */
export function fraseDeMeta(e: ErrorGraph | undefined): string {
  if (!e) return 'Meta no contestó bien. Vuelve a intentarlo en un rato.'
  if (e.code === 190) return 'La conexión con Meta venció o se quitó: vuelve a conectar Instagram, en Ajustes → Cuentas.'
  if (e.code === 270) {
    return 'Mientras la app de Tu Parrilla espera la aprobación de Meta, solo pueden promocionar los administradores de la app que también administran la cuenta publicitaria.'
  }
  if (e.code === 4 || e.code === 17 || e.code === 613 || e.code === 80000 || e.code === 80004) {
    return 'Meta pide esperar un poco antes de seguir: vuelve a intentarlo en unos minutos.'
  }
  const deMeta = [e.error_user_title, e.error_user_msg].filter(Boolean).join(': ')
  if (deMeta) return `Meta no lo aceptó: ${deMeta}`
  if (e.code === 10 || e.code === 200 || (e.code !== undefined && e.code >= 200 && e.code < 300)) {
    return 'Meta no le dio a Tu Parrilla permiso para anunciar en esa cuenta: vuelve a conectar Instagram, en Ajustes → Cuentas, y acepta todos los permisos.'
  }
  return `Meta no lo aceptó: ${e.message ?? 'sin detalle'}`
}

export type EstadoPropio = 'activa' | 'pausada' | 'detenida'

/**
 * Cómo va, en palabras. Lo que Meta dice del anuncio (`effective_status`, leído en vivo o en la
 * última sincronización) manda sobre lo último que pidió el dueño: un anuncio rechazado no está
 * «Activo» aunque se haya pedido así.
 */
export function etiquetaDeEstado(efectivo: string | null, propio: EstadoPropio, hasta: Date, ahora: Date): string {
  if (propio === 'detenida') return 'Detenida'
  switch (efectivo) {
    case 'PENDING_REVIEW':
    case 'IN_PROCESS':
      return 'En revisión de Meta'
    case 'DISAPPROVED':
      return 'Rechazada por Meta'
    case 'WITH_ISSUES':
      return 'Con problemas en Meta'
    case 'PENDING_BILLING_INFO':
      return 'Falta el medio de pago'
    case 'PAUSED':
    case 'CAMPAIGN_PAUSED':
    case 'ADSET_PAUSED':
      return 'En pausa'
    case 'ARCHIVED':
    case 'DELETED':
      return 'Detenida'
    case 'PREAPPROVED':
      return 'Aprobada, por empezar'
    case 'ACTIVE':
      return hasta.getTime() < ahora.getTime() ? 'Terminó' : 'Activa'
    default:
      if (hasta.getTime() < ahora.getTime()) return 'Terminó'
      return propio === 'activa' ? 'Activa' : 'En pausa'
  }
}

export type Accion = 'pausar' | 'reanudar' | 'detener'

/** Lo que se le manda a la campaña por cada botón, y el estado que queda. Detener es archivar: los resultados quedan. */
export const POR_ACCION: Record<Accion, { status: string; estado: EstadoPropio }> = {
  pausar: { status: 'PAUSED', estado: 'pausada' },
  reanudar: { status: 'ACTIVE', estado: 'activa' },
  detener: { status: 'ARCHIVED', estado: 'detenida' },
}

/** Qué botones tiene, según cómo va. Detenida no tiene vuelta; terminada, tampoco hay qué pausar. */
export function accionesPosibles(propio: EstadoPropio, hasta: Date, ahora: Date): Accion[] {
  if (propio === 'detenida') return []
  if (hasta.getTime() < ahora.getTime()) return ['detener']
  return propio === 'activa' ? ['pausar', 'detener'] : ['reanudar', 'detener']
}
