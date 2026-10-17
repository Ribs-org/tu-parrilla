// La semana del inicio de la portada, sin pantalla: la dibujan la portada (`landing.tsx`) y la
// imagen para compartirla (`app/api/og/route.tsx`), y tienen que decir lo mismo.

export type Estado = 'scheduled' | 'publishing' | 'published' | 'failed'
export type CorteDeMuestra = {
  hora: string
  texto: string
  media: ReadonlyArray<{ mediaType: 'video' | 'image' }>
  destinos: ReadonlyArray<{ network: string; status: Estado }>
  /** El que acaba de caer: se enciende una vez al abrir, como al volver del compositor. */
  recien?: true
}
export type DiaDeMuestra = {
  dia: string
  hoy?: true
  /** Un día que ya pasó no invita a poner nada. */
  paso?: true
  cortes: readonly CorteDeMuestra[]
}

export const VIDEO = { mediaType: 'video' } as const
export const FOTO = { mediaType: 'image' } as const
export const fotos = (n: number) => Array.from({ length: n }, () => FOTO)

/**
 * La semana del inicio. Estática a propósito: es una ilustración, no datos de nadie. Tiene de
 * todo lo que la parrilla dice sin palabras: un día lleno, dos fríos, uno saliendo con su
 * humo, uno recién puesto, y los cuatro formatos.
 */
export const SEMANA: readonly DiaDeMuestra[] = [
  {
    dia: 'lun',
    paso: true,
    cortes: [
      {
        hora: '09:00',
        texto: 'Antes y después del color',
        media: [VIDEO],
        destinos: [
          { network: 'instagram', status: 'published' },
          { network: 'tiktok', status: 'published' },
        ],
      },
    ],
  },
  { dia: 'mar', paso: true, cortes: [] },
  {
    dia: 'mié',
    paso: true,
    cortes: [
      {
        hora: '08:00',
        texto: 'Mi semana en ocho fotos',
        media: fotos(8),
        destinos: [
          { network: 'instagram', status: 'published' },
          { network: 'facebook', status: 'published' },
        ],
      },
      {
        hora: '13:00',
        texto: 'Tres errores al editar un reel',
        media: [VIDEO],
        destinos: [
          { network: 'instagram', status: 'published' },
          { network: 'youtube', status: 'published' },
        ],
      },
      {
        hora: '19:30',
        texto: 'Por qué publico todos los días',
        media: [],
        destinos: [
          { network: 'threads', status: 'published' },
          { network: 'x', status: 'published' },
        ],
      },
    ],
  },
  {
    dia: 'jue',
    hoy: true,
    cortes: [
      {
        hora: '10:00',
        texto: 'El setup nuevo, de cerca',
        media: [FOTO],
        destinos: [
          { network: 'instagram', status: 'published' },
          { network: 'facebook', status: 'published' },
        ],
      },
      {
        hora: '18:00',
        texto: 'Detrás de cámara: cómo grabo un reel',
        media: [VIDEO],
        destinos: [
          { network: 'instagram', status: 'publishing' },
          { network: 'tiktok', status: 'publishing' },
          { network: 'youtube', status: 'publishing' },
        ],
      },
    ],
  },
  {
    dia: 'vie',
    cortes: [
      {
        hora: '12:00',
        texto: 'Cinco apps que uso todos los días',
        media: fotos(5),
        destinos: [
          { network: 'instagram', status: 'scheduled' },
          { network: 'tiktok', status: 'scheduled' },
        ],
        recien: true,
      },
    ],
  },
  { dia: 'sáb', cortes: [] },
  {
    dia: 'dom',
    cortes: [
      {
        hora: '11:00',
        texto: 'La pregunta de la semana',
        media: [],
        destinos: [{ network: 'facebook', status: 'scheduled' }],
      },
    ],
  },
]
