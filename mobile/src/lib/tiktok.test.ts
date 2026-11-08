import { describe, expect, it } from 'vitest'

import {
  avisoPatrocinado,
  cuentasDeTikTok,
  duracionMaxima,
  elegirComercial,
  lineaDeLaCuenta,
  opcionesTikTok,
  privacidadesDe,
  segundosLegibles,
  soloFotos,
  tiktokInicial,
  tiktokParaGuardar,
  videoMuyLargo,
  type CreadorTikTok,
  type TikTokElegido,
} from './tiktok'
import type { CuentaApp } from './tipos'

const CREADOR: CreadorTikTok = {
  nombre: 'Vicente',
  avatarUrl: null,
  privacidades: ['PUBLIC_TO_EVERYONE', 'SELF_ONLY'],
  comentariosDeshabilitados: false,
  duoDeshabilitado: true,
  pegarDeshabilitado: false,
  maxDuracionSeg: 600,
}

const NUEVO: TikTokElegido = tiktokInicial(undefined, {})

describe('cómo nace el bloque', () => {
  it('como exige la guía de TikTok: privacidad sin elegir, todo apagado', () => {
    expect(NUEVO).toEqual({
      borrador: false,
      privacidad: '',
      comentarios: false,
      duo: false,
      pegar: false,
      comercial: 'no',
      ia: false,
      musica: false,
    })
  })

  it('la música nace como la recuerda la cuenta; lo del borrador manda', () => {
    expect(tiktokInicial(undefined, { tiktokMusica: true }).musica).toBe(true)
    expect(tiktokInicial({ ...NUEVO, musica: false }, { tiktokMusica: true }).musica).toBe(false)
    const guardado = { ...NUEVO, privacidad: 'SELF_ONLY', comentarios: true, musica: undefined }
    expect(tiktokInicial(guardado, { tiktokMusica: true })).toMatchObject({ privacidad: 'SELF_ONLY', comentarios: true, musica: true })
  })

  it('una privacidad que no se entiende nace sin elegir', () => {
    expect(tiktokInicial({ ...NUEVO, privacidad: 'TODOS' }, {}).privacidad).toBe('')
  })
})

describe('lo que se ve', () => {
  it('la cuenta: el nombre de creator_info, el aviso o «Leyendo tu cuenta…»', () => {
    expect(lineaDeLaCuenta(CREADOR, null)).toBe('Se publicará en la cuenta Vicente')
    expect(lineaDeLaCuenta(null, 'No pude leer tu cuenta de TikTok.')).toBe('No pude leer tu cuenta de TikTok.')
    expect(lineaDeLaCuenta(null, null)).toBe('Leyendo tu cuenta…')
  })

  it('las privacidades de creator_info, o las cuatro sin él', () => {
    expect(privacidadesDe(CREADOR)).toEqual(['PUBLIC_TO_EVERYONE', 'SELF_ONLY'])
    expect(privacidadesDe(null)).toHaveLength(4)
  })

  it('un bloque por cada cuenta de TikTok marcada y conectada', () => {
    const cuentas: CuentaApp[] = [
      { id: 'tt-1', red: 'tiktok', handle: '@a', conectada: true },
      { id: 'tt-2', red: 'tiktok', handle: '@b', conectada: false },
      { id: 'ig-1', red: 'instagram', handle: '@c', conectada: true },
    ]
    expect(cuentasDeTikTok(cuentas, ['tt-1', 'tt-2', 'ig-1']).map((c) => c.id)).toEqual(['tt-1'])
  })

  it('todo fotos, con al menos una', () => {
    expect(soloFotos([])).toBe(false)
    expect(soloFotos([{ mediaType: 'image' }, { mediaType: 'image' }])).toBe(true)
    expect(soloFotos([{ mediaType: 'image' }, { mediaType: 'video' }])).toBe(false)
  })
})

describe('patrocinado', () => {
  it('elegirlo vacía «Solo yo», y avisa hasta que se vuelva a elegir', () => {
    const privado = { ...NUEVO, privacidad: 'SELF_ONLY' }
    const patrocinado = elegirComercial(privado, 'patrocinado')
    expect(patrocinado.privacidad).toBe('')
    expect(avisoPatrocinado(patrocinado)).toBe(true)
    expect(avisoPatrocinado({ ...patrocinado, privacidad: 'PUBLIC_TO_EVERYONE' })).toBe(false)
    expect(elegirComercial({ ...NUEVO, privacidad: 'PUBLIC_TO_EVERYONE' }, 'patrocinado').privacidad).toBe('PUBLIC_TO_EVERYONE')
    expect(elegirComercial(privado, 'marca_propia').privacidad).toBe('SELF_ONLY')
  })
})

describe('lo que viaja al programar', () => {
  const elegido: TikTokElegido = {
    borrador: false,
    privacidad: 'PUBLIC_TO_EVERYONE',
    comentarios: true,
    duo: true,
    pegar: true,
    comercial: 'marca_propia',
    ia: true,
    musica: true,
  }

  it('a la bandeja, solo el modo', () => {
    expect(opcionesTikTok({ ...elegido, borrador: true }, false, CREADOR)).toEqual({ modo: 'borrador' })
  })

  it('con un video: sin música, y lo que creator_info bloquea va apagado', () => {
    expect(opcionesTikTok(elegido, false, CREADOR)).toEqual({
      modo: 'directo',
      privacidad: 'PUBLIC_TO_EVERYONE',
      comentarios: true,
      duo: false,
      pegar: true,
      comercial: 'marca_propia',
      ia: true,
      musica: false,
    })
  })

  it('con fotos: sin dúo ni pegar, y con la música', () => {
    expect(opcionesTikTok(elegido, true, null)).toMatchObject({ duo: false, pegar: false, musica: true })
  })

  it('una privacidad que la cuenta ya no permite viaja vacía, para que el servidor la pida', () => {
    expect(opcionesTikTok({ ...elegido, privacidad: 'FOLLOWER_OF_CREATOR' }, false, CREADOR).privacidad).toBe('')
    expect(opcionesTikTok({ ...elegido, privacidad: 'FOLLOWER_OF_CREATOR' }, false, null).privacidad).toBe('FOLLOWER_OF_CREATOR')
  })

  it('el borrador guarda todo lo elegido, y la música solo con fotos', () => {
    expect(tiktokParaGuardar({ ...elegido, borrador: true }, false)).toEqual({
      modo: 'borrador',
      privacidad: 'PUBLIC_TO_EVERYONE',
      comentarios: true,
      duo: true,
      pegar: true,
      comercial: 'marca_propia',
      ia: true,
    })
    expect(tiktokParaGuardar(elegido, true)).toMatchObject({ modo: 'directo', musica: true })
  })
})

describe('el largo del video', () => {
  const video = (segundos: number | null) => ({
    mediaType: 'video' as const,
    medidas: { ancho: 1080, alto: 1920, duracionMs: segundos === null ? null : segundos * 1000 },
  })

  it('dice el máximo de la cuenta', () => {
    expect(duracionMaxima(CREADOR)).toBe('En esta cuenta, TikTok publica videos de hasta 10 min.')
    expect(duracionMaxima({ ...CREADOR, maxDuracionSeg: 180 })).toBe('En esta cuenta, TikTok publica videos de hasta 3 min.')
    expect(duracionMaxima({ ...CREADOR, maxDuracionSeg: null })).toBeNull()
    expect(duracionMaxima(null)).toBeNull()
  })

  it('avisa del video que se pasa; calla si cabe o si no se sabe cuánto dura', () => {
    expect(videoMuyLargo([video(601)], CREADOR)).toBe(
      'Este video dura 10 min 1 s y TikTok publica en esta cuenta videos de hasta 10 min.',
    )
    expect(videoMuyLargo([video(600)], CREADOR)).toBeNull()
    expect(videoMuyLargo([video(null)], CREADOR)).toBeNull()
    expect(videoMuyLargo([{ mediaType: 'video' }], CREADOR)).toBeNull()
    expect(videoMuyLargo([video(9999)], null)).toBeNull()
  })

  it('en palabras', () => {
    expect(segundosLegibles(45)).toBe('45 s')
    expect(segundosLegibles(60)).toBe('1 min')
    expect(segundosLegibles(210)).toBe('3 min 30 s')
  })
})
