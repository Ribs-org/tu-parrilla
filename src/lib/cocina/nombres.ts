import type { EstadoComanda } from '@/db/schema'
import type { Tema } from '@/lib/tema'

// Cómo se dice cada estado de una comanda, de noche y de día. Aparte de `estados.ts` porque lo
// lee también el navegador (el vocabulario de día, `PALABRAS_DE_DIA`), y `estados.ts` trae el
// esquema entero: acá solo entra su tipo.

/**
 * «Se quemó» y «La Barra» ya tienen dueño —los posts que fallaron y el calendario de día—, así
 * que ninguna comanda las usa.
 */
export const NOMBRE_ESTADO: Record<EstadoComanda, Record<Tema, string>> = {
  recibida: { noche: 'Comanda colgada', dia: 'Comanda colgada' },
  revisando: { noche: 'El chef mira la res', dia: 'El chef mira el atún' },
  en_preparacion: { noche: 'El desposte', dia: 'El despiece' },
  probando: { noche: 'La degustación', dia: 'La degustación' },
  pregunta: { noche: 'El chef te pregunta', dia: 'El chef te pregunta' },
  en_el_horno: { noche: 'Al fuego', dia: 'Armando las piezas' },
  sirviendo: { noche: 'Sirviendo', dia: 'Sirviendo' },
  lista: { noche: 'Lista en el mesón', dia: 'Lista en la vitrina' },
  servida: { noche: 'Servida', dia: 'Servida' },
  rechazada: { noche: 'No se puede cocinar', dia: 'No se puede preparar' },
  cancelada: { noche: 'Cancelada', dia: 'Cancelada' },
  fallida: { noche: 'No se pudo terminar', dia: 'No se pudo terminar' },
}

/** «3 de 5 tandas en el mesón» (de día, en la vitrina), o solo cuántas si el total no se sabe. */
export function tandasEnPalabras(servidas: number, total: number | null, tema: Tema): string {
  const donde = tema === 'dia' ? 'en la vitrina' : 'en el mesón'
  const tandas = (n: number) => (n === 1 ? 'tanda' : 'tandas')
  if (total && total > 0) return `${servidas} de ${total} ${tandas(total)} ${donde}`
  return `${servidas} ${tandas(servidas)} ${donde}`
}
