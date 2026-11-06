// Si la cocina está abierta, y cómo: lo que dicen los latidos del chef (`POST /api/cocina/latido`),
// sin base. Desde el 2026-11-06 no basta con que lata: una comanda de un cliente esperó cuatro
// días en «Comanda colgada» mientras el temporizador del latido seguía latiendo y el panel decía
// «abierta», porque nadie la estaba tomando. Ahora el servicio que toma las comandas solo lo dice
// en su latido (`datos.automatico: true`), y el panel distingue tres casos:
//
// - **sola:** algún trabajador que toma solo latió hace poco. La cocina está abierta, y la hora
//   estimada de lo que espera sale de lo que contó (`trabajos`, `minutosPorComanda`);
// - **a mano:** late, pero nadie toma solo: una persona toma las comandas, y puede ser al día
//   hábil siguiente. No se promete una hora;
// - **cerrada:** nadie latió en `MINUTOS_SIN_LATIDO`.
//
// El contrato del latido, con esos campos, en `docs/cocina-api.md`.

/** Sin latido por más de esto, la cocina está cerrada por ahora. */
export const MINUTOS_SIN_LATIDO = 10

export type AtiendeLaCocina = 'sola' | 'a-mano' | 'cerrada'

export type EstadoDeLaCocina = {
  /** Algún trabajador latió en los últimos `MINUTOS_SIN_LATIDO`, tome solo o a mano. */
  abierta: boolean
  /** Cómo atiende: sola, a mano o cerrada. */
  atiende: AtiendeLaCocina
  /** Cuándo latió por última vez, si alguna vez latió. */
  ultimoLatido: Date | null
  /** Lo que contó el trabajador que toma solo, si lo contó: lo usa la hora estimada. */
  trabajos: number | null
  minutosPorComanda: number | null
}

export type Latido = { en: Date; datos: Record<string, unknown> | null }

function numero(valor: unknown): number | null {
  return typeof valor === 'number' && Number.isFinite(valor) && valor > 0 ? valor : null
}

/**
 * Cómo está la cocina según los latidos de todos sus trabajadores: puede haber más de uno —el
 * temporizador de siempre y el servicio que toma solo—, y basta uno vivo que tome solo para que
 * atienda sola. La hora estimada sale de lo que contó ese, el más reciente si hay varios.
 */
export function clasificarCocina(latidos: readonly Latido[], ahora: Date): EstadoDeLaCocina {
  const ordenados = [...latidos].sort((a, b) => b.en.getTime() - a.en.getTime())
  const ultimoLatido = ordenados[0]?.en ?? null
  const vivos = ordenados.filter((l) => ahora.getTime() - l.en.getTime() <= MINUTOS_SIN_LATIDO * 60_000)
  const solo = vivos.find((l) => l.datos?.automatico === true)
  if (solo) {
    return {
      abierta: true,
      atiende: 'sola',
      ultimoLatido,
      trabajos: numero(solo.datos?.trabajos),
      minutosPorComanda: numero(solo.datos?.minutosPorComanda),
    }
  }
  return { abierta: vivos.length > 0, atiende: vivos.length > 0 ? 'a-mano' : 'cerrada', ultimoLatido, trabajos: null, minutosPorComanda: null }
}

/**
 * La hora estimada de una que espera, antes de que el chef dé la suya: las que van antes más ella,
 * repartidas entre los trabajos que hace a la vez, a lo que tarda una en promedio. Solo si la
 * cocina atiende sola y contó cuánto tarda: a mano, o sin esos datos, no se adivina.
 */
export function etaEnLaFila(antes: number, cocina: EstadoDeLaCocina, ahora: Date): Date | null {
  if (cocina.atiende !== 'sola' || !cocina.minutosPorComanda) return null
  const tandas = Math.ceil((antes + 1) / (cocina.trabajos ?? 1))
  return new Date(ahora.getTime() + tandas * cocina.minutosPorComanda * 60_000)
}

/** «unos 40 minutos», «una hora», «unas 4 horas». */
export function duracionEnPalabras(minutos: number): string {
  if (minutos < 50) return `unos ${Math.max(5, Math.round(minutos / 5) * 5)} minutos`
  const horas = Math.round(minutos / 60)
  return horas <= 1 ? 'una hora' : `unas ${horas} horas`
}

export const COCINA_SOLA = 'La cocina está abierta: el chef toma las comandas apenas llegan.'
export const COCINA_A_MANO =
  'La cocina atiende a mano: una persona toma las comandas, así que la tuya puede tardar hasta el próximo día hábil.'
export const COCINA_CERRADA = 'La cocina está cerrada por ahora: lo que pidas espera su turno.'

/** La línea de arriba de La Cocina, en el panel y en el teléfono. */
export function cocinaEnPalabras(cocina: Pick<EstadoDeLaCocina, 'atiende' | 'minutosPorComanda'>): string {
  if (cocina.atiende === 'sola') {
    return cocina.minutosPorComanda ? `${COCINA_SOLA} Cada una tarda ${duracionEnPalabras(cocina.minutosPorComanda)}.` : COCINA_SOLA
  }
  return cocina.atiende === 'a-mano' ? COCINA_A_MANO : COCINA_CERRADA
}
