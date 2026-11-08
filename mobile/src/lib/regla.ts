// La respuesta automática por palabra clave en Publicar, sin pantalla. Es el bloque del compositor
// del panel (`src/app/admin/(dash)/schedule/regla-clave.tsx`): los mismos tres campos, los mismos
// topes y los mismos textos, que compara `src/lib/telefono-copias.test.ts`. Las reglas —una sola
// palabra, el mensaje de 1 a 1000— las aplica el servidor al programar, con sus frases, como en
// el panel.

/** Los tres campos, crudos, como los guarda el borrador. */
export type ReglaApp = { palabra: string; mensaje: string; respuestaPublica: string }

export const MAX_PALABRA = 30
export const MAX_MENSAJE = 1000
export const MAX_RESPUESTA = 300
export const RESPUESTA_PUBLICA_POR_DEFECTO = 'Te lo mandé por privado 📩'

export const TEXTOS_REGLA = {
  titulo: 'Respuesta automática por palabra clave',
  palabra: 'Palabra clave',
  palabraPista: 'Una sola palabra. Quien la comente recibe la respuesta sin que hagas nada.',
  palabraEjemplo: 'GUIA',
  mensaje: 'Mensaje',
  // «Los Números» se llama igual de noche y de día.
  mensajePista: 'Pon el enlace aquí; si es de tu sitio se mide solo en Los Números.',
  mensajeEjemplo: 'Acá tienes la guía: https://…',
  respuesta: 'Respuesta pública',
  respuestaPista: 'La que se publica bajo el comentario cuando el mensaje sale por privado.',
  nota:
    'Con el mensaje privado encendido para tu cuenta, en Instagram y Facebook se publica esta respuesta y el mensaje con el enlace va por privado, una vez a cada persona. Si no, en YouTube o pasados siete días, el mensaje con el enlace se publica como respuesta. En TikTok todavía no hay cola de comentarios.',
} as const

/**
 * En Historia la regla no viaja —una historia no tiene comentarios— pero queda guardada para
 * cuando se vuelva a Post, como el texto.
 */
export const HISTORIA_SIN_CLAVE_AQUI =
  'Una historia no lleva palabra clave. La que pusiste se guarda en el borrador y vuelve si cambias a Post.'

/** Cómo nace el bloque: lo que traía el borrador, o vacío con la respuesta pública de siempre. */
export function reglaInicial(guardada: ReglaApp | null | undefined): ReglaApp {
  return guardada ?? { palabra: '', mensaje: '', respuestaPublica: RESPUESTA_PUBLICA_POR_DEFECTO }
}

/** Si hay regla: como en el panel, la palabra vacía es «sin regla» aunque el mensaje siga escrito. */
export function hayRegla(r: ReglaApp): boolean {
  return r.palabra.trim() !== ''
}

/** Lo que viaja en `regla`, al guardar y al programar: los tres campos, o null sin palabra. */
export function reglaParaEnviar(r: ReglaApp): ReglaApp | null {
  return hayRegla(r) ? r : null
}
