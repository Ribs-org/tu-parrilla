// Lo que las políticas de los Servicios de API de YouTube no dejan hacer con sus datos,
// en un solo sitio. Libre de `server-only` a propósito: lo leen también los componentes
// del panel y los tests.
//
// Las dos reglas vienen de la sección III.E.4 de las políticas para desarrolladores
// (developers.google.com/youtube/terms/developer-policies), y la auditoría de cuota las
// revisa:
//
// - III.E.4.h: no se crean métricas nuevas ni derivadas con datos de la API. Lo ganado en
//   un período sale de restar dos lecturas, y el arrastre divide visitas por eso: las dos
//   son derivadas. Lo que sí se puede es mostrar los contadores tal como los da la API, y
//   al lado datos propios, siempre que se lea claro que no vienen de YouTube.
// - III.E.4.b–d: las estadísticas leídas sin OAuth (el sync las pide con la API key) no
//   se guardan más de 30 días, y el resto de los datos se borra o se refresca dentro de
//   ese plazo.
//
// Hay un permiso aparte (III.L) para calcular métricas propias y guardar historia, pero
// es para desarrolladores de analítica que lo pidieron y se lo dieron. Si algún día se
// pide y se obtiene, esto es lo que hay que aflojar.

/** Las redes cuyos datos no pueden entrar en una métrica calculada por Tu Parrilla. */
export const REDES_SIN_DERIVADAS: readonly string[] = ['youtube']

export function sinMetricasDerivadas(network: string): boolean {
  return REDES_SIN_DERIVADAS.includes(network)
}

/** Cuánto vive un dato de YouTube que nadie refrescó: lecturas diarias, comentarios, títulos. */
export const DIAS_RETENCION_YOUTUBE = 30
