import type { ComandaEnElMeson, CreativoDelMeson } from './meson'
import { MAX_NOTA_DESCARTE, MOTIVOS_DESCARTE, NOMBRE_MOTIVO, type MotivoDescarte } from './meson-motivos'

// El mesón (de día, la bandeja) en la app del teléfono, sin base: lo mismo que la página del panel
// (`src/app/admin/(dash)/ia/meson/`), en el JSON que lee la app. Las frases que dependen de la zona
// de la cuenta —«Se borra el 12-11-2026 si no lo programas.»— salen hechas de acá, porque el
// `Intl` de Hermes no trae las fechas en español completas. Los motivos de un descarte también
// viajan con sus nombres, como las opciones del pedido: la app no tiene una copia que se desfase.

/** Los atributos que se muestran aparte: el estilo y la pieza ya tienen su lugar, como en el panel. */
const YA_A_LA_VISTA = new Set(['estilo', 'pieza'])

export type CreativoDelTelefono = {
  id: string
  tipo: CreativoDelMeson['tipo']
  texto: string
  tituloYoutube: string | null
  estilo: string | null
  duracionS: number | null
  /** La portada del video, para mostrarla antes de reproducirlo. */
  portadaUrl: string | null
  media: CreativoDelMeson['media']
  /** Lo que rotó el chef, como «clave: valor», sin el estilo ni la pieza. */
  atributos: string[]
  /** En su última semana, cuándo se borra, en palabras; si no, null. */
  seBorra: string | null
}

export type MesonDelTelefono = {
  comandas: Array<{
    id: string
    principal: string | null
    creadaEn: string
    piezas: Array<{ pieza: string | null; creativos: CreativoDelTelefono[] }>
  }>
  /** Cuántos salieron del mesón y esperan en un borrador de La Parrilla, con sus cuentas y su hora. */
  enBorradores: number
  motivos: Array<{ valor: MotivoDescarte; nombre: string }>
  maxNota: number
}

export function mesonParaElTelefono(
  meson: ComandaEnElMeson[],
  enBorradores: number,
  ahora: Date,
  zona: string,
  diasDeAviso: number,
): MesonDelTelefono {
  const fecha = new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeZone: zona })
  const creativo = (c: CreativoDelMeson): CreativoDelTelefono => {
    const porVencer = c.expiraEn && c.expiraEn.getTime() - ahora.getTime() < diasDeAviso * 86_400_000 ? c.expiraEn : null
    return {
      id: c.id,
      tipo: c.tipo,
      texto: c.texto,
      tituloYoutube: c.tituloYoutube,
      estilo: c.estilo,
      duracionS: c.duracionS,
      portadaUrl: c.portadaUrl,
      media: c.media,
      atributos: Object.entries(c.atributos)
        .filter(([clave]) => !YA_A_LA_VISTA.has(clave))
        .map(([clave, valor]) => `${clave}: ${String(valor)}`),
      seBorra: porVencer ? `Se borra el ${fecha.format(porVencer)} si no lo programas.` : null,
    }
  }
  return {
    comandas: meson.map((c) => ({
      id: c.id,
      principal: c.principal,
      creadaEn: c.creadaEn.toISOString(),
      piezas: c.piezas.map((p) => ({ pieza: p.pieza, creativos: p.creativos.map(creativo) })),
    })),
    enBorradores,
    motivos: MOTIVOS_DESCARTE.map((valor) => ({ valor, nombre: NOMBRE_MOTIVO[valor] })),
    maxNota: MAX_NOTA_DESCARTE,
  }
}
