import { describe, expect, it } from 'vitest'
import { contraSuCuenta } from './igual-edad'
import type { PostRow } from './posts-kpis'
import {
  PARA_DESTACAR,
  cancionDe,
  fraseDe,
  fraseDeGrupo,
  fraseDeMusica,
  musicaDe,
  queFunciona,
  queFuncionaApi,
  queFuncionaLaMusica,
  veces,
  type Publicado,
  type Veredicto,
} from './que-funciona'
import type { Atributos } from './social/publish/atributos'

let siguiente = 0

function fila(overrides: Partial<PostRow>): PostRow {
  siguiente += 1
  return {
    id: `post-${siguiente}`,
    network: 'instagram',
    accountId: 'acc-1',
    externalId: `ext-${siguiente}`,
    permalink: null,
    caption: null,
    thumbnailUrl: null,
    mediaType: 'reel',
    publishedLabel: '1 ago',
    publishedAt: new Date('2026-08-01T12:00:00Z'),
    campaign: `reel-${siguiente}`,
    archived: false,
    views: null,
    viewsChange: null,
    viewsA7Dias: null,
    viewsA48h: null,
    likesChange: null,
    commentsChange: null,
    sharesChange: null,
    isNew: false,
    likes: null,
    comments: null,
    shares: null,
    saves: null,
    reach: null,
    visits: null,
    uniques: null,
    clicks: null,
    ctr: null,
    pull: null,
    ...overrides,
  }
}

type Entrada = { fila: PostRow; atributos: Atributos | null; publicado?: Publicado | null }

/** `n` publicaciones de una cuenta con estos atributos y estas views a los 7 días. */
function varias(n: number, atributos: Atributos | null, viewsA7Dias: number | null, extra: Partial<PostRow> = {}): Entrada[] {
  return Array.from({ length: n }, () => ({ atributos, fila: fila({ viewsA7Dias, ...extra }) }))
}

function veredictos(entradas: Entrada[]): Record<string, Veredicto> {
  const lista = queFunciona(entradas, contraSuCuenta(entradas.map((e) => e.fila)))
  return Object.fromEntries(lista.map((v) => [v.clave, v]))
}

describe('queFunciona', () => {
  it('dice qué tema gana, contra lo normal de cada cuenta y no por el tamaño de la cuenta', () => {
    // Una cuenta chica y una grande. «recetas» duplica lo normal en las dos; en views a secas,
    // «humor», que solo sale en la grande, taparía todo.
    const entradas = [
      ...varias(5, { tema: 'recetas' }, 200, { accountId: 'chica' }),
      ...varias(5, { tema: 'recetas' }, 20_000, { accountId: 'grande' }),
      ...varias(6, { tema: 'humor' }, 100, { accountId: 'chica' }),
      ...varias(6, { tema: 'humor' }, 10_000, { accountId: 'grande' }),
    ]
    const { tema } = veredictos(entradas)
    expect(tema!.estado).toBe('gana')
    expect(tema!.primero!.valor).toBe('recetas')
    expect(tema!.primero!.medidas).toBe(10)
    expect(tema!.segundo!.valor).toBe('humor')
    expect(tema!.primero!.contraSuCuenta! / tema!.segundo!.contraSuCuenta!).toBeCloseTo(2)
    expect(fraseDe(tema!)).toBe(
      'Lo de tema «recetas» tuvo ×2,0 las views normales de su cuenta a los 7 días (10 publicaciones). ' +
        'Le sigue «humor», con ×1,0 (12 publicaciones).',
    )
  })

  it('con menos de 10 medidas no declara ganador, aunque la diferencia sea enorme', () => {
    const entradas = [
      ...varias(2, { tema: 'recetas' }, 5_000),
      ...varias(12, { tema: 'humor' }, 100),
    ]
    const { tema } = veredictos(entradas)
    expect(tema!.estado).toBe('faltan')
    expect(tema!.primero).toBeNull()
    expect(fraseDe(tema!)).toBe(
      'Todavía no alcanza para decirlo: hacen falta dos temas con al menos 10 publicaciones medidas a los 7 ' +
        'días cada uno. Hoy: «humor» 12 y «recetas» 2.',
    )
  })

  it('la muestra son las medidas: lo que no tiene sus 7 días no cuenta para el mínimo', () => {
    const entradas = [
      ...varias(4, { tema: 'recetas' }, 400),
      ...varias(8, { tema: 'recetas' }, null),
      ...varias(10, { tema: 'humor' }, 100),
    ]
    const { tema } = veredictos(entradas)
    expect(tema!.valores.find((v) => v.valor === 'recetas')).toMatchObject({ publicaciones: 12, medidas: 4 })
    expect(tema!.estado).toBe('faltan')
  })

  it('parejo cuando el mejor no llega a destacar', () => {
    const entradas = [...varias(10, { tema: 'recetas' }, 110), ...varias(10, { tema: 'humor' }, 100)]
    const { tema } = veredictos(entradas)
    expect(tema!.primero!.contraSuCuenta!).toBeLessThan(PARA_DESTACAR)
    expect(tema!.estado).toBe('parejo')
    expect(fraseDe(tema!)).toMatch(/^Ningún tema se sale de lo normal: el que mejor anduvo, «recetas», tuvo ×1,0/)
  })

  it('el formato sale de la red, no de un atributo', () => {
    const entradas = [
      ...varias(10, null, 300, { mediaType: 'carousel' }),
      ...varias(10, null, 100, { mediaType: 'reel' }),
    ]
    const { formato, tema, estilo } = veredictos(entradas)
    expect(formato!.estado).toBe('gana')
    expect(formato!.primero!.valor).toBe('Carrusel')
    expect(formato!.segundo!.valor).toBe('Reel')
    expect(tema!.estado).toBe('sinValor')
    expect(fraseDe(tema!)).toBe('Nada de lo publicado en el período lleva «tema» en sus atributos.')
    expect(estilo!.estado).toBe('sinValor')
  })

  it('un solo valor no tiene con qué compararse', () => {
    const { formato } = veredictos(varias(20, null, 100, { network: 'tiktok', mediaType: 'video' }))
    expect(formato!.estado).toBe('faltan')
    expect(fraseDe(formato!)).toBe('Hay un solo formato en el período, «Video»: no hay con qué compararlo.')
  })

  it('sin lecturas de los 7 días (YouTube, o lo de la última semana) no hay cómo medir', () => {
    const entradas = [
      ...varias(10, { estilo: 'tutorial' }, null, { network: 'youtube', mediaType: 'short' }),
      ...varias(10, { estilo: 'storytime' }, null, { network: 'youtube', mediaType: 'video' }),
    ]
    const { estilo } = veredictos(entradas)
    expect(estilo!.estado).toBe('faltan')
    expect(fraseDe(estilo!)).toMatch(/^Todavía no hay cómo medirlo: .* al menos 5 publicaciones medidas/)
  })

  it('«sin tema» no compite: es la vara, no un valor', () => {
    const entradas = [...varias(10, null, 1_000), ...varias(10, { tema: 'recetas' }, 100)]
    const { tema } = veredictos(entradas)
    expect(tema!.valores.map((v) => v.valor)).toEqual(['recetas'])
    expect(tema!.estado).toBe('faltan')
  })
})

describe('queFuncionaApi', () => {
  it('una clave por dimensión, con la frase del tablero y los valores sin «sin valor»', () => {
    const entradas = [
      ...varias(10, { tema: 'recetas' }, 300, { mediaType: 'carousel' }),
      ...varias(10, { tema: 'humor' }, 100),
      ...varias(3, null, 100),
    ]
    const api = queFuncionaApi(entradas, contraSuCuenta(entradas.map((e) => e.fila)))
    expect(Object.keys(api)).toEqual(['tema', 'estilo', 'formato', 'musica'])
    expect(api.tema.estado).toBe('gana')
    expect(api.tema.frase).toBe(fraseDe(veredictos(entradas).tema!))
    expect(api.tema.primero).toEqual({ valor: 'recetas', publicaciones: 10, medidas: 10, contraSuCuenta: 3 })
    expect(api.tema.valores.map((v) => v.valor).sort()).toEqual(['humor', 'recetas'])
    expect(api.estilo).toMatchObject({ estado: 'sinValor', primero: null, segundo: null, valores: [] })
    // Nada salió desde Tu Parrilla: de la música no se sabe nada.
    expect(api.musica).toEqual({
      estado: 'sinValor',
      frase: 'Nada de lo publicado desde Tu Parrilla en el período llevó música de la red (como «Música de TikTok» en las fotos).',
      sinSaber: 23,
      grupos: [],
    })
  })

  it('la música: un grupo por red y formato, con su frase, sus valores y sus canciones', () => {
    const entradas = [
      ...varias(10, null, 300, { network: 'instagram', mediaType: 'reel' }).map((e, i) => ({
        ...e,
        publicado: {
          opciones: { musica: { audioId: `a${i}`, titulo: i < 6 ? 'Canción uno' : 'Canción dos', artista: 'X' } },
          soloFotos: false,
        },
      })),
      ...conPublicado(varias(10, null, 100, { network: 'instagram', mediaType: 'reel' }), null, false),
    ]
    const api = queFuncionaApi(entradas, contraSuCuenta(entradas.map((e) => e.fila)))
    expect(api.musica.estado).toBe('gana')
    expect(api.musica.sinSaber).toBe(0)
    expect(api.musica.grupos).toHaveLength(1)
    const [grupo] = api.musica.grupos
    expect(grupo).toMatchObject({
      red: 'instagram',
      formato: 'Reel',
      estado: 'gana',
      primero: { valor: 'con música', publicaciones: 10, medidas: 10 },
      segundo: { valor: 'sin música', publicaciones: 10, medidas: 10 },
    })
    expect(grupo!.frase).toBe(api.musica.frase)
    expect(grupo!.frase).toMatch(/^Los reels de Instagram anduvieron mejor con música: ×/)
    expect(grupo!.valores.map((v) => v.valor)).toEqual(['con música', 'sin música'])
    expect(grupo!.canciones.map((c) => [c.valor, c.publicaciones])).toEqual([
      ['Canción uno', 6],
      ['Canción dos', 4],
    ])
  })
})

/** Las mismas entradas, como si hubieran salido desde Tu Parrilla con estas opciones. */
function conPublicado(entradas: Entrada[], opciones: unknown, soloFotos: boolean): Entrada[] {
  return entradas.map((e) => ({ ...e, publicado: { opciones, soloFotos } }))
}

describe('musicaDe', () => {
  const directo = { modo: 'directo', privacidad: 'PUBLIC_TO_EVERYONE', comentarios: true }

  it('lo subido directo en la red no se sabe: no es «sin música»', () => {
    expect(musicaDe('instagram', null)).toBeNull()
    expect(musicaDe('tiktok', undefined)).toBeNull()
  })

  it('TikTok: con música solo en fotos publicadas directo', () => {
    expect(musicaDe('tiktok', { opciones: { ...directo, musica: true }, soloFotos: true })).toBe('con')
    expect(musicaDe('tiktok', { opciones: directo, soloFotos: true })).toBe('sin')
    // Guardada en un video no se mandó: TikTok no deja ponerle música a un video.
    expect(musicaDe('tiktok', { opciones: { ...directo, musica: true }, soloFotos: false })).toBe('sin')
    // A la bandeja, la persona lo termina en la app y ahí pudo ponerle música.
    expect(musicaDe('tiktok', { opciones: { modo: 'borrador' }, soloFotos: true })).toBeNull()
  })

  it('las demás redes: cuenta la clave `musica` encendida, con cualquier forma', () => {
    expect(musicaDe('instagram', { opciones: { musica: { audioId: '1', titulo: 'Tema' } }, soloFotos: false })).toBe('con')
    expect(musicaDe('instagram', { opciones: { trialReel: true }, soloFotos: false })).toBe('sin')
    expect(musicaDe('instagram', { opciones: null, soloFotos: false })).toBe('sin')
    expect(musicaDe('facebook', { opciones: { musica: false }, soloFotos: false })).toBe('sin')
  })

  it('el título de la canción, solo si la red lo guardó', () => {
    expect(cancionDe({ opciones: { musica: { titulo: '  Tema  ' } }, soloFotos: false })).toBe('Tema')
    expect(cancionDe({ opciones: { musica: true }, soloFotos: true })).toBeNull()
    expect(cancionDe({ opciones: { musica: { titulo: '' } }, soloFotos: false })).toBeNull()
    expect(cancionDe(null)).toBeNull()
  })
})

describe('queFuncionaLaMusica', () => {
  const directo = { modo: 'directo', privacidad: 'PUBLIC_TO_EVERYONE' }
  const fotosTikTok = { network: 'tiktok', mediaType: 'video', accountId: 'tt' } as const

  function musica(entradas: Entrada[]) {
    return queFuncionaLaMusica(entradas, contraSuCuenta(entradas.map((e) => e.fila)))
  }

  it('compara fotos de TikTok con fotos de TikTok: los videos no entran', () => {
    const entradas = [
      ...conPublicado(varias(10, null, 300, fotosTikTok), { ...directo, musica: true }, true),
      ...conPublicado(varias(10, null, 100, fotosTikTok), directo, true),
      // Videos de TikTok, que no pueden llevar música: muchos y con muchas views.
      ...conPublicado(varias(30, null, 1_000, fotosTikTok), { ...directo, musica: true }, false),
    ]
    const v = musica(entradas)
    expect(v.grupos.map((g) => [g.red, g.formato])).toEqual([['tiktok', 'Foto']])
    const [g] = v.grupos
    expect(g!.estado).toBe('gana')
    expect(g!.primero!.valor).toBe('con música')
    expect(g!.primero!.contraSuCuenta! / g!.segundo!.contraSuCuenta!).toBeCloseTo(3)
    expect(v.estado).toBe('gana')
    // Las fotos andan bajo lo normal de la cuenta (los videos la suben), y aun así gana la música.
    expect(g!.primero!.contraSuCuenta!).toBeLessThan(1)
    expect(fraseDeMusica(v)).toBe(
      'Las fotos de TikTok anduvieron mejor con música: ×0,30 las views normales de su cuenta a los 7 días ' +
        '(10 publicaciones), contra ×0,10 sin música (10 publicaciones).',
    )
  })

  it('sin música también puede ganar', () => {
    const entradas = [
      ...conPublicado(varias(10, null, 100, fotosTikTok), { ...directo, musica: true }, true),
      ...conPublicado(varias(10, null, 200, fotosTikTok), directo, true),
    ]
    const [g] = musica(entradas).grupos
    expect(g!.estado).toBe('gana')
    expect(fraseDeGrupo(g!)).toMatch(/^Las fotos de TikTok anduvieron mejor sin música: ×1,3 .* contra ×0,67 con música/)
  })

  it('lo de fuera de Tu Parrilla y la bandeja de TikTok no entran: se cuentan en sinSaber', () => {
    const entradas = [
      ...conPublicado(varias(10, null, 300, fotosTikTok), { ...directo, musica: true }, true),
      ...conPublicado(varias(10, null, 100, fotosTikTok), directo, true),
      ...varias(7, null, 10_000, fotosTikTok),
      ...conPublicado(varias(3, null, 10_000, fotosTikTok), { modo: 'borrador' }, true),
    ]
    const v = musica(entradas)
    expect(v.sinSaber).toBe(10)
    expect(v.grupos[0]!.valores.map((x) => [x.valor, x.publicaciones])).toEqual([
      ['con música', 10],
      ['sin música', 10],
    ])
  })

  it('con menos de 10 medidas por lado no declara ganador, aunque la diferencia sea enorme', () => {
    const entradas = [
      ...conPublicado(varias(2, null, 5_000, fotosTikTok), { ...directo, musica: true }, true),
      ...conPublicado(varias(12, null, 100, fotosTikTok), directo, true),
    ]
    const v = musica(entradas)
    expect(v.estado).toBe('faltan')
    expect(v.grupos[0]!.primero).toBeNull()
    expect(fraseDeMusica(v)).toBe(
      'En las fotos de TikTok todavía no alcanza para decirlo: hacen falta al menos 10 publicaciones medidas a ' +
        'los 7 días con música y 10 sin música. Hoy: con música 2 y sin música 12.',
    )
  })

  it('parejo cuando un lado no saca ×1,2 lo del otro', () => {
    const entradas = [
      ...conPublicado(varias(10, null, 110, fotosTikTok), { ...directo, musica: true }, true),
      ...conPublicado(varias(10, null, 100, fotosTikTok), directo, true),
    ]
    const v = musica(entradas)
    expect(v.estado).toBe('parejo')
    expect(fraseDeMusica(v)).toMatch(/^En las fotos de TikTok la música no marca diferencia: con música tuvieron ×/)
  })

  it('todo con música no tiene con qué compararse', () => {
    const v = musica(conPublicado(varias(12, null, 100, fotosTikTok), { ...directo, musica: true }, true))
    expect(v.estado).toBe('faltan')
    expect(fraseDeMusica(v)).toBe(
      'En las fotos de TikTok, todo lo publicado desde Tu Parrilla llevó música: no hay con qué compararlo.',
    )
  })

  it('sin lecturas de los 7 días no hay cómo medirlo', () => {
    const entradas = [
      ...conPublicado(varias(10, null, null, fotosTikTok), { ...directo, musica: true }, true),
      ...conPublicado(varias(10, null, null, fotosTikTok), directo, true),
    ]
    expect(fraseDeMusica(musica(entradas))).toMatch(/^En las fotos de TikTok todavía no hay cómo medirlo: /)
  })

  it('donde nada llevó música no hay grupo', () => {
    const entradas = [
      ...conPublicado(varias(10, null, 300, { mediaType: 'reel' }), { trialReel: true }, false),
      ...conPublicado(varias(10, null, 100, { mediaType: 'reel' }), null, false),
    ]
    const v = musica(entradas)
    expect(v).toEqual({ estado: 'sinValor', grupos: [], sinSaber: 0 })
  })
})

describe('veces', () => {
  it('como en «Comparar por atributo»', () => {
    expect(veces(2.14)).toBe('×2,1')
    expect(veces(0.666)).toBe('×0,67')
  })
})
