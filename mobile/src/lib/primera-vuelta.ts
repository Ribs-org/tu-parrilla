/**
 * La primera vuelta: lo justo para partir (`docs/superpowers/specs/2026-11-10-primera-vuelta-design.md`).
 * Dos momentos, y lo que el teléfono recuerda de ellos:
 *
 * - **La bienvenida**, al entrar sin ninguna red conectada: lleva a conectarlas en vez de a La
 *   Parrilla vacía. La decide el servidor en el ingreso (`sinRedes`); acá solo se anota si está a
 *   medias —el sistema puede cerrar la app mientras la persona conecta en el navegador— o ya vista.
 * - **El chef**, a la quinta apertura, si La Cocina está encendida y la persona no la conoce.
 *
 * Es de la cuenta, como la caché: se borra al salir y al entrar (`session.ts`).
 */

export const CLAVE_PRIMERA_VUELTA = 'primera-vuelta'

/** En qué apertura se presenta al chef. */
export const APERTURA_DEL_CHEF = 5

/** Cuánto tiene que estar fuera la app para que volver cuente como otra apertura. */
export const AUSENCIA_QUE_CUENTA_MS = 30 * 60_000

export type PrimeraVuelta = {
  /** `abierta`: a medias. `vista`: ya salió. null: no tocó (la cuenta ya tenía redes, o la app es de antes de esto). */
  bienvenida: 'abierta' | 'vista' | null
  /** Cuántas veces se abrió la app con esta cuenta. */
  aperturas: number
  /** Cuándo pasó la app a segundo plano por última vez (ms), para contar la vuelta. */
  salioEn: number | null
  /** `presentado`: ya salió su tarjeta. `conocido`: la persona abrió La Cocina antes. */
  chef: 'presentado' | 'conocido' | null
}

export const VUELTA_NUEVA: PrimeraVuelta = { bienvenida: null, aperturas: 0, salioEn: null, chef: null }

/** Lo guardado, o una vuelta nueva si no hay nada o no se entiende. */
export function leerVuelta(texto: string | null): PrimeraVuelta {
  if (!texto) return VUELTA_NUEVA
  try {
    const v = JSON.parse(texto) as Partial<PrimeraVuelta>
    return {
      bienvenida: v.bienvenida === 'abierta' || v.bienvenida === 'vista' ? v.bienvenida : null,
      aperturas: typeof v.aperturas === 'number' && Number.isFinite(v.aperturas) && v.aperturas >= 0 ? Math.floor(v.aperturas) : 0,
      salioEn: typeof v.salioEn === 'number' && Number.isFinite(v.salioEn) ? v.salioEn : null,
      chef: v.chef === 'presentado' || v.chef === 'conocido' ? v.chef : null,
    }
  } catch {
    return VUELTA_NUEVA
  }
}

/** Recién canjeado el código: la primera apertura de esta cuenta, con bienvenida si no hay redes. */
export function alEntrar(sinRedes: boolean): PrimeraVuelta {
  return { ...VUELTA_NUEVA, aperturas: 1, bienvenida: sinRedes ? 'abierta' : null }
}

/** La app arrancó con la sesión ya abierta: otra apertura. */
export function alArrancar(v: PrimeraVuelta): PrimeraVuelta {
  return { ...v, aperturas: v.aperturas + 1, salioEn: null }
}

export function alSalir(v: PrimeraVuelta, ahora: number): PrimeraVuelta {
  return { ...v, salioEn: ahora }
}

/** Volvió a primer plano: cuenta como apertura si estuvo fuera media hora o más. */
export function alVolver(v: PrimeraVuelta, ahora: number): PrimeraVuelta {
  const cuenta = v.salioEn !== null && ahora - v.salioEn >= AUSENCIA_QUE_CUENTA_MS
  return { ...v, aperturas: cuenta ? v.aperturas + 1 : v.aperturas, salioEn: null }
}

export function bienvenidaVista(v: PrimeraVuelta): PrimeraVuelta {
  return { ...v, bienvenida: 'vista' }
}

/** La persona abrió La Cocina por su cuenta: el chef ya no se presenta. */
export function cocinaConocida(v: PrimeraVuelta): PrimeraVuelta {
  return v.chef === null ? { ...v, chef: 'conocido' } : v
}

export function chefPresentado(v: PrimeraVuelta): PrimeraVuelta {
  return { ...v, chef: 'presentado' }
}

/** Si vale la pena preguntarle a La Cocina: ya es la quinta y el chef no se presentó. */
export function puedePresentarAlChef(v: PrimeraVuelta): boolean {
  return v.chef === null && v.aperturas >= APERTURA_DEL_CHEF
}

/**
 * Si sale la tarjeta del chef. Con La Cocina apagada no: sería presentar una puerta cerrada. Con
 * comandas tampoco: ya lo conoce.
 */
export function tocaElChef(v: PrimeraVuelta, cocina: { encendida: boolean; comandas: number } | null): boolean {
  return puedePresentarAlChef(v) && cocina !== null && cocina.encendida && cocina.comandas === 0
}
