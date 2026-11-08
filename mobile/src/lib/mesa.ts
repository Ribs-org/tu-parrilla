/*
 * La Mesa en el teléfono: los comentarios que esperan respuesta, con el borrador de la IA, como
 * en el panel (`/admin/comments`). Lo que viaja lo arma el servidor (`GET /api/mobile/comentarios`,
 * con `src/lib/comentarios-movil.ts` de la raíz) y las reglas —qué entra en cada filtro, el largo de
 * cada red, quién puede responder qué— las aplica él con las frases del panel. Puro: lo leen la
 * pantalla (`app/mesa.tsx`), sus tarjetas (`components/mesa.tsx`) y el acceso desde La Parrilla.
 *
 * Las frases que se repiten del panel (`frasePendientes`, `fraseColaVacia` y `hace`) las compara
 * con las suyas `src/lib/telefono-copias.test.ts`, en la raíz.
 */

export type EstadoDeLaMesa = 'pendientes' | 'enviados' | 'automaticas'
export type EstadoDelComentario = 'pendiente' | 'enviado' | 'fallido' | 'descartado' | 'en_la_red'

export type ComentarioDeLaMesa = {
  id: string
  autor: string | null
  /** Puede llegar vacío: hay comentarios de Instagram que la API entrega sin texto. */
  texto: string
  publicadoEl: string
  estado: EstadoDelComentario
  borrador: string | null
  borradorError: string | null
  error: string | null
  automatico: boolean
  privado: { estado: 'pendiente' | 'enviado' | 'fallido'; error: string | null } | null
}

export type PublicacionDeLaMesa = {
  id: string
  red: string
  cuenta: string | null
  texto: string | null
  miniatura: string | null
  enlace: string | null
  palabraClave: string | null
  comentarios: ComentarioDeLaMesa[]
}

export type LaMesa = {
  estado: EstadoDeLaMesa
  red: string | null
  redes: string[]
  pendientes: number
  publicaciones: PublicacionDeLaMesa[]
}

/** Los filtros por estado del teléfono, con los nombres del panel. «Descartados» y «Todos», allá. */
export const ESTADOS_DE_LA_MESA: readonly { estado: EstadoDeLaMesa; texto: string }[] = [
  { estado: 'pendientes', texto: 'Pendientes' },
  { estado: 'enviados', texto: 'Enviados' },
  { estado: 'automaticas', texto: 'Automáticas' },
]

export const SUBTITULO_DE_LA_MESA = 'lo que te responden y tus respuestas'

/** Lo que pide la pantalla para un filtro, y la clave con que lo guarda. */
export function pedidoDeLaMesa(estado: EstadoDeLaMesa, red: string | null): { clave: string; ruta: string } {
  const consulta = `estado=${estado}${red ? `&red=${encodeURIComponent(red)}` : ''}`
  return { clave: `mesa:${estado}:${red ?? 'todas'}`, ruta: `/api/mobile/comentarios?${consulta}` }
}

/** Copia de `frasePendientes` del panel (`src/lib/social/comentarios/la-mesa.ts`). */
export function frasePendientes(cuantos: number): string {
  if (cuantos === 0) return 'No hay nada esperando respuesta.'
  if (cuantos === 1) return 'Un comentario espera tu respuesta.'
  return `${cuantos} comentarios esperan tu respuesta.`
}

/** Copia de `fraseColaVacia` del panel. */
export function fraseColaVacia(conCronico: boolean): string {
  return `No hay comentarios aquí.${conCronico ? ' Los nuevos llegan cada cinco minutos.' : ''}`
}

/**
 * Hace cuánto llegó, como el panel: «recién», «hace 3 horas», «ayer», «anteayer», «hace 5 días».
 * Escrito a mano y no con `Intl.RelativeTimeFormat`, que el motor de la app no trae completo en
 * todos los teléfonos; el test de la raíz lo compara con el del panel hora por hora.
 */
export function hace(iso: string, ahora: number): string {
  const horas = Math.round((ahora - Date.parse(iso)) / 3.6e6)
  if (horas < 1) return 'recién'
  if (horas < 24) return horas === 1 ? 'hace 1 hora' : `hace ${horas} horas`
  const dias = Math.round(horas / 24)
  if (dias === 1) return 'ayer'
  if (dias === 2) return 'anteayer'
  return `hace ${dias} días`
}

/** Se puede responder (o descartar) desde la tarjeta: lo que espera y lo que falló. */
export function esEditable(c: Pick<ComentarioDeLaMesa, 'estado'>): boolean {
  return c.estado === 'pendiente' || c.estado === 'fallido'
}

/**
 * La flecha del panel, aquí con su nombre: «Reintentar borrador» si todavía no hay uno, y «Escribir
 * otro borrador» si lo hay. No la tiene lo que tomó la respuesta automática: su cuadro trae el
 * mensaje de la regla, y un borrador lo cambiaría por otra cosa.
 */
export function botonDeBorrador(c: Pick<ComentarioDeLaMesa, 'automatico' | 'borrador'>): string | null {
  if (c.automatico) return null
  return c.borrador === null ? 'Reintentar borrador' : 'Escribir otro borrador'
}

/** Si el cuadro ya tiene algo escrito a mano: entonces pedir otro borrador pregunta antes. */
export function seCorrigio(texto: string, borrador: string | null): boolean {
  return texto.trim() !== '' && texto !== (borrador ?? '')
}

const ETIQUETA_PRIVADO: Record<'pendiente' | 'enviado' | 'fallido', string> = {
  pendiente: 'pendiente',
  enviado: 'enviado',
  fallido: 'no salió',
}

/** «Privado: enviado», o «Privado: no salió · No se pudo mandar el privado.», como el panel. */
export function lineaDelPrivado(privado: ComentarioDeLaMesa['privado']): string | null {
  if (!privado) return null
  return `Privado: ${ETIQUETA_PRIVADO[privado.estado]}${privado.error ? ` · ${privado.error}` : ''}`
}

/**
 * Un servidor de antes de La Mesa en el teléfono no tiene estas rutas: contesta `404` sin frase,
 * que `api.ts` sube como `HTTP 404`. Un `404` con frase («El comentario ya no está en la red.»)
 * llega como `RechazoApi` y no pasa por acá.
 */
export const MESA_SIN_SERVIDOR =
  'Tu Parrilla todavía no responde comentarios desde el teléfono. Mientras, respóndelos en La Mesa del panel web.'

export function esServidorSinLaMesa(e: unknown): boolean {
  return e instanceof Error && e.message === 'HTTP 404'
}

/**
 * Lo que dice la tarjeta cuando el pedido mismo no volvió —sin señal, o se cortó—: como en el
 * panel, no se sabe si la respuesta salió, así que pide actualizar y mirar antes de mandarla otra vez.
 */
export const SE_CORTO_LA_MESA =
  'No se pudo hablar con Tu Parrilla. Tira la pantalla hacia abajo para actualizar: si la respuesta salió, está en «Enviados».'
