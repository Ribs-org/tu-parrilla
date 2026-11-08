// Lo que las políticas de los Servicios de API de YouTube no dejan hacer con sus datos,
// en un solo sitio. Libre de `server-only` a propósito: lo leen también los componentes
// del panel y los tests.
//
// Las reglas vienen de la sección III.E.4 de las políticas para desarrolladores
// (developers.google.com/youtube/terms/developer-policies), y la auditoría de cuota las
// revisa:
//
// - III.E.4.h: no se crean métricas nuevas ni derivadas con datos de la API. Lo ganado en
//   un período sale de restar dos lecturas, y el arrastre divide visitas por eso: las dos
//   son derivadas. Lo que sí se puede es mostrar los contadores tal como los da la API, y
//   al lado datos propios, siempre que se lea claro que no vienen de YouTube. Vale igual
//   para lo de YouTube Analytics: sus cifras se muestran tal como llegan, sin sumar días
//   ni restar ganados de perdidos.
// - III.E.4.b–d, según cómo se leyó el dato:
//   - Las estadísticas leídas sin OAuth (el sync las pide con la API key) son datos no
//     autorizados: no se guardan más de 30 días, y el resto de los datos se borra o se
//     refresca dentro de ese plazo (`DIAS_RETENCION_YOUTUBE`).
//   - Lo leído de la API de YouTube Analytics con el token del dueño
//     (`analitica-youtube.ts`) es dato autorizado de §III.E.4.b: se guarda mientras haga
//     falta, con una condición —comprobar cada 30 días que el dueño sigue autorizando, y
//     que el video sigue existiendo—. La comprobación es la propia lectura diaria: cada vez
//     que la API contesta con su token queda la marca `analitica_verificada_en`; sin una
//     marca en 30 días, o sin el permiso, `retencion-youtube` borra lo de analítica del
//     canal. La fila de un video que dejó de llegar se borra a los 30 días sin refrescar.
//   - Revocar desde Tu Parrilla («Desconectar») borra todo en el acto; §III.D.2 da siete
//     días. Revocar desde la cuenta de Google se nota en la lectura siguiente (401) y se
//     borra ahí mismo; §III.D.2 da 30.
//
// Hay un permiso aparte (III.L) para calcular métricas propias y guardar historia de las
// estadísticas de la Data API, pero es para desarrolladores de analítica que lo pidieron y
// se lo dieron. No se pidió: la historia del canal llega por la API de Analytics, que la
// da hecha, y lo ganado sigue fuera.

/** Las redes cuyos datos no pueden entrar en una métrica calculada por Tu Parrilla. */
export const REDES_SIN_DERIVADAS: readonly string[] = ['youtube']

export function sinMetricasDerivadas(network: string): boolean {
  return REDES_SIN_DERIVADAS.includes(network)
}

/** Cuánto vive un dato de YouTube que nadie refrescó: lecturas diarias, comentarios, títulos. */
export const DIAS_RETENCION_YOUTUBE = 30

/**
 * Cada cuánto hay que comprobar que el dueño sigue autorizando la analítica (§III.E.4.b). Es el
 * mismo número que el de arriba, pero otra regla: aquí lo que vence no es el dato, es la prueba
 * de que se puede seguir guardando.
 */
export const DIAS_PARA_COMPROBAR_AUTORIZACION = 30
