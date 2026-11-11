// Qué versión de la app del teléfono tiene que tener cada uno, para el aviso de actualizar
// (`GET /api/mobile/version`, ver «Cuando hay que ir a la tienda» en `mobile/README.md`). La app
// compara su propia versión, la del binario que se instaló desde la tienda, con estas dos:
//
// - por debajo de la `recomendada`, un aviso que se cierra con «Después», una vez por versión;
// - por debajo de la `minima`, una pantalla que no deja seguir sin actualizar.
//
// Lo que llega por aire no cuenta: una actualización por aire no cambia la versión del binario.

export type VersionDeLaApp = {
  /** La que se le sugiere a quien tiene una más vieja. */
  recomendada: string
  /** Desde cuál se puede seguir usando: más abajo, la app no deja pasar. */
  minima: string
  /** Dónde se actualiza. */
  tienda: string
  /** Lo que trae la recomendada, en una frase, para el aviso. Sin palabras del modo. */
  novedades: string
}

/**
 * Por plataforma; `null` donde la app todavía no está en la tienda (iPhone), y ahí no se avisa
 * nada.
 *
 * **La `minima` solo sube cuando la versión ya está en la tienda para todos**, no solo en la pista
 * de pruebas: a quien no está entre los probadores, la tienda no le ofrece la versión nueva, y con
 * la mínima arriba se queda sin app. La 1.2.0 está solo en la pista interna desde el 2026-11-08;
 * por eso hoy la mínima es la 1.1.0, que no bloquea a nadie (`docs/pendientes.md`).
 */
export const VERSION_DE_LA_APP: { android: VersionDeLaApp | null; ios: VersionDeLaApp | null } = {
  android: {
    recomendada: '1.2.0',
    minima: '1.1.0',
    tienda: 'https://play.google.com/store/apps/details?id=cl.tuparrilla.app',
    novedades: 'Trae los avisos al teléfono y grabar video con la cámara.',
  },
  ios: null,
}
