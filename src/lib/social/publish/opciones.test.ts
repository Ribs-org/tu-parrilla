import { describe, expect, it } from 'vitest'
import {
  HISTORIA_DESTINOS,
  HISTORIA_JPG,
  HISTORIA_MUSICA,
  MUSICA_LOGIN_INSTAGRAM,
  HISTORIA_MEDIA,
  HISTORIA_SIN_CLAVE,
  HISTORIA_SIN_TEXTO,
  HISTORIA_TRIAL,
  OPCIONES_ERROR,
  TIKTOK_PATROCINADO_PRIVADO,
  TIKTOK_SIN_PRIVACIDAD,
  TRIAL_REEL_MEDIA,
  errorDeHistoria,
  errorDeMediaPorOpciones,
  esHistoria,
  historiaDe,
  musicaDe,
  musicaDesdeCampo,
  musicaParaRecordar,
  nombreDeCancion,
  opcionesDesdeFormularioPorCuenta,
  opcionesParaApi,
  resumenOpciones,
  validarOpciones,
  validarOpcionesPorCuenta,
  youtubeDe,
  youtubeDesdeFormulario,
} from './opciones'

const directo = {
  modo: 'directo',
  privacidad: 'SELF_ONLY',
  comentarios: true,
  duo: false,
  pegar: false,
  comercial: 'no',
}

describe('validarOpciones para tiktok', () => {
  it('acepta el modo directo completo', () => {
    expect(validarOpciones('tiktok', directo)).toEqual({ opciones: directo })
  })

  it('acepta el borrador y descarta lo demás', () => {
    expect(validarOpciones('tiktok', { modo: 'borrador', privacidad: 'SELF_ONLY', comentarios: true })).toEqual({
      opciones: { modo: 'borrador' },
    })
  })

  it('sin opciones: la frase apunta a la privacidad, que es lo que falta casi siempre', () => {
    expect(validarOpciones('tiktok', undefined)).toEqual({ error: TIKTOK_SIN_PRIVACIDAD })
    expect(validarOpciones('tiktok', null)).toEqual({ error: TIKTOK_SIN_PRIVACIDAD })
  })

  it('directo sin privacidad o con una desconocida', () => {
    expect(validarOpciones('tiktok', { ...directo, privacidad: undefined })).toEqual({ error: TIKTOK_SIN_PRIVACIDAD })
    expect(validarOpciones('tiktok', { ...directo, privacidad: '' })).toEqual({ error: TIKTOK_SIN_PRIVACIDAD })
    expect(validarOpciones('tiktok', { ...directo, privacidad: 'PRIVADO' })).toEqual({ error: TIKTOK_SIN_PRIVACIDAD })
  })

  it('las casillas ausentes valen false', () => {
    expect(validarOpciones('tiktok', { modo: 'directo', privacidad: 'PUBLIC_TO_EVERYONE' })).toEqual({
      opciones: {
        modo: 'directo',
        privacidad: 'PUBLIC_TO_EVERYONE',
        comentarios: false,
        duo: false,
        pegar: false,
        comercial: 'no',
      },
    })
  })

  it('patrocinado no puede ser privado', () => {
    expect(validarOpciones('tiktok', { ...directo, comercial: 'patrocinado' })).toEqual({
      error: TIKTOK_PATROCINADO_PRIVADO,
    })
    expect(
      validarOpciones('tiktok', { ...directo, privacidad: 'FOLLOWER_OF_CREATOR', comercial: 'patrocinado' }),
    ).toEqual({
      opciones: { ...directo, privacidad: 'FOLLOWER_OF_CREATOR', comercial: 'patrocinado' },
    })
  })

  it('rechaza la forma que no entiende', () => {
    expect(validarOpciones('tiktok', 'directo')).toEqual({ error: OPCIONES_ERROR })
    expect(validarOpciones('tiktok', ['directo'])).toEqual({ error: OPCIONES_ERROR })
    expect(validarOpciones('tiktok', { privacidad: 'SELF_ONLY' })).toEqual({ error: OPCIONES_ERROR })
    expect(validarOpciones('tiktok', { modo: 'programado' })).toEqual({ error: OPCIONES_ERROR })
    expect(validarOpciones('tiktok', { ...directo, comentarios: 'sí' })).toEqual({ error: OPCIONES_ERROR })
    expect(validarOpciones('tiktok', { ...directo, comercial: 'ads' })).toEqual({ error: OPCIONES_ERROR })
  })

  it('rechaza un objeto desmedido', () => {
    expect(validarOpciones('tiktok', { ...directo, relleno: 'x'.repeat(2000) })).toEqual({ error: OPCIONES_ERROR })
  })
})

describe('validarOpciones para otras redes', () => {
  it('sin opciones es null; con opciones es error', () => {
    expect(validarOpciones('threads', undefined)).toEqual({ opciones: null })
    expect(validarOpciones('threads', null)).toEqual({ opciones: null })
    expect(validarOpciones('threads', { modo: 'directo' })).toEqual({ error: OPCIONES_ERROR })
  })
})

describe('validarOpcionesPorCuenta', () => {
  // Dos cuentas con valores que se distinguen entre sí (una en borrador, otra directa
  // con una privacidad concreta) a propósito: si algún día se cruzaran las identidades
  // —que 'tt-1' terminara leyendo lo de 'tt-2' y viceversa— este test lo vería, porque
  // comprobar solo las claves no lo detectaría.
  it('valida las opciones de cada cuenta por separado, sin cruzar identidades', () => {
    const cuentas = [
      { id: 'tt-1', network: 'tiktok', handle: '@vicente' },
      { id: 'tt-2', network: 'tiktok', handle: '@vicenteclips' },
    ]
    const raw = {
      'tt-1': { modo: 'borrador' },
      'tt-2': {
        modo: 'directo',
        privacidad: 'PUBLIC_TO_EVERYONE',
        comentarios: true,
        duo: false,
        pegar: false,
        comercial: 'no',
      },
    }
    const check = validarOpcionesPorCuenta(cuentas, raw)
    expect('error' in check).toBe(false)
    if ('error' in check) return
    expect(check.opciones['tt-1']).toEqual({ modo: 'borrador' })
    expect(check.opciones['tt-2']).toEqual(raw['tt-2'])
  })

  // Una clave sobrante en `raw` no es un error, es una decisión documentada.
  it('ignora las claves de raw que no corresponden a ninguna cuenta pedida', () => {
    const cuentas = [{ id: 'tt-1', network: 'tiktok', handle: '@vicente' }]
    const raw = { 'tt-1': { modo: 'borrador' }, 'tt-2': { modo: 'directo', privacidad: 'SELF_ONLY' } }
    expect(validarOpcionesPorCuenta(cuentas, raw)).toEqual({ opciones: { 'tt-1': { modo: 'borrador' } } })
  })

  it('una cuenta de TikTok sin privacidad falla nombrando su frase', () => {
    const cuentas = [{ id: 'tt-1', network: 'tiktok', handle: '@vicente' }]
    const check = validarOpcionesPorCuenta(cuentas, { 'tt-1': { modo: 'directo', privacidad: '' } })
    expect(check).toEqual({ error: TIKTOK_SIN_PRIVACIDAD })
  })

  // Cubre los dos lados: con dos cuentas de la misma red el error nombra la que falló
  // (arriba, «una cuenta de TikTok sin privacidad...», cubre el lado sin ambigüedad —una
  // sola cuenta de la red, la frase queda tal cual porque nombrarla sería ruido).
  it('con dos cuentas de la misma red, el error antepone el handle de la que falló', () => {
    const cuentas = [
      { id: 'tt-1', network: 'tiktok', handle: '@vicente' },
      { id: 'tt-2', network: 'tiktok', handle: '@vicenteclips' },
    ]
    const raw = { 'tt-1': { modo: 'directo', privacidad: '' }, 'tt-2': { modo: 'borrador' } }
    expect(validarOpcionesPorCuenta(cuentas, raw)).toEqual({ error: `«@vicente»: ${TIKTOK_SIN_PRIVACIDAD}` })
  })

  // Separa «dos cuentas en total» de «dos cuentas de la misma red»: aquí hay dos cuentas,
  // pero de redes distintas, así que TikTok sigue apareciendo una sola vez y la frase no
  // debe llevar prefijo. Si la condición contara el total en vez de contar por red, este
  // test lo delataría — es justo lo que separa las dos hipótesis.
  it('con dos cuentas de redes distintas, la que falla no lleva prefijo: su red no es ambigua', () => {
    const cuentas = [
      { id: 'ig-1', network: 'instagram', handle: '@insta' },
      { id: 'tt-1', network: 'tiktok', handle: '@vicente' },
    ]
    const raw = { 'tt-1': { modo: 'directo', privacidad: '' } }
    expect(validarOpcionesPorCuenta(cuentas, raw)).toEqual({ error: TIKTOK_SIN_PRIVACIDAD })
  })
})

describe('opcionesDesdeFormularioPorCuenta', () => {
  it('el formulario lee los campos con el sufijo de cada cuenta', () => {
    const fd = new FormData()
    fd.set('tiktokModo:tt-1', 'borrador')
    fd.set('tiktokModo:tt-2', 'directo')
    fd.set('tiktokPrivacidad:tt-2', 'SELF_ONLY')
    const cuentas = [
      { id: 'tt-1', network: 'tiktok', handle: '@a' },
      { id: 'tt-2', network: 'tiktok', handle: '@b' },
    ]
    const raw = opcionesDesdeFormularioPorCuenta(fd, cuentas)
    expect(raw['tt-1']).toEqual({ modo: 'borrador' })
    expect((raw['tt-2'] as Record<string, unknown>).privacidad).toBe('SELF_ONLY')
  })

  // Con cuentas de dos redes en la misma fila (el caso que esta entrega hizo posible),
  // una cuenta que no es de TikTok no puede dejar entrada: si la dejara, ese valor no
  // vacío llegaría a `validarOpciones` para una red que no acepta nada, y la fila entera
  // se rechazaría con el error de forma en vez de publicarse en la cuenta de TikTok.
  it('una cuenta que no es de TikTok no produce entrada, aunque venga marcada', () => {
    const fd = new FormData()
    fd.set('tiktokModo:tt-1', 'directo')
    fd.set('tiktokPrivacidad:tt-1', 'SELF_ONLY')
    const cuentas = [
      { id: 'ig-1', network: 'instagram', handle: '@insta' },
      { id: 'tt-1', network: 'tiktok', handle: '@vicente' },
    ]
    const raw = opcionesDesdeFormularioPorCuenta(fd, cuentas)
    expect(Object.keys(raw)).toEqual(['tt-1'])
    // De punta a punta: mezclar una cuenta de otra red no revienta la validación.
    expect(validarOpcionesPorCuenta(cuentas, raw)).toEqual({
      opciones: {
        'tt-1': {
          modo: 'directo',
          privacidad: 'SELF_ONLY',
          comentarios: false,
          duo: false,
          pegar: false,
          comercial: 'no',
        },
      },
    })
  })

  // El comentario de la función dice que esto es a propósito: sin campos, la privacidad
  // viaja vacía (no ausente) para que la validación responda con su frase propia —
  // `TIKTOK_SIN_PRIVACIDAD`— y no con la del formulario que no entiende `OPCIONES_ERROR`.
  it('con TikTok marcado y sin campos, la privacidad viaja vacía a propósito', () => {
    const cuentas = [{ id: 'tt-1', network: 'tiktok', handle: '@a' }]
    const raw = opcionesDesdeFormularioPorCuenta(new FormData(), cuentas)
    expect(raw['tt-1']).toEqual({
      modo: 'directo',
      privacidad: '',
      comentarios: false,
      duo: false,
      pegar: false,
      comercial: 'no',
      ia: false,
      musica: false,
    })
    expect(validarOpcionesPorCuenta(cuentas, raw)).toEqual({ error: TIKTOK_SIN_PRIVACIDAD })
  })
})

describe('resumenOpciones', () => {
  it('resume el directo y el borrador en una línea', () => {
    expect(resumenOpciones('tiktok', directo)).toBe('Directo · Solo yo · con comentarios · sin dúo · sin pegar · sin comercial')
    expect(
      resumenOpciones('tiktok', { ...directo, privacidad: 'PUBLIC_TO_EVERYONE', duo: true, comercial: 'patrocinado' }),
    ).toBe('Directo · Todos · con comentarios · con dúo · sin pegar · patrocinado')
    expect(resumenOpciones('tiktok', { modo: 'borrador' })).toBe('Borrador a tu bandeja de TikTok')
  })

  it('nada que resumir da null', () => {
    expect(resumenOpciones('tiktok', null)).toBeNull()
    expect(resumenOpciones('instagram', { modo: 'directo' })).toBeNull()
    expect(resumenOpciones('tiktok', 'basura')).toBeNull()
  })
})

describe('validarOpciones para instagram', () => {
  it('sin opciones, o con trialReel apagado, es null: reel normal y no se guarda nada', () => {
    expect(validarOpciones('instagram', undefined)).toEqual({ opciones: null })
    expect(validarOpciones('instagram', null)).toEqual({ opciones: null })
    expect(validarOpciones('instagram', { trialReel: false })).toEqual({ opciones: null })
  })

  it('trialReel: true se guarda tal cual', () => {
    expect(validarOpciones('instagram', { trialReel: true })).toEqual({ opciones: { trialReel: true } })
  })

  it('cualquier otra forma es la frase de forma: un modelo no puede mandar algo que se ignore', () => {
    // Un `trialreel` mal escrito, o una clave que todavía no existe (`graduacion`), no
    // pueden pasar en silencio como reel normal: el que la manda cree que se aplicó.
    expect(validarOpciones('instagram', { trialreel: true })).toEqual({ error: OPCIONES_ERROR })
    expect(validarOpciones('instagram', { trialReel: 'sí' })).toEqual({ error: OPCIONES_ERROR })
    expect(validarOpciones('instagram', { trialReel: true, graduacion: 'manual' })).toEqual({ error: OPCIONES_ERROR })
    expect(validarOpciones('instagram', 'trial')).toEqual({ error: OPCIONES_ERROR })
  })
})

describe('errorDeMediaPorOpciones', () => {
  const trial = { ig: { trialReel: true as const } }

  it('un trial reel exige exactamente un video, sin fotos', () => {
    expect(errorDeMediaPorOpciones(trial, { videos: 1, fotos: 0, sinTipo: 0 })).toBeNull()
    expect(errorDeMediaPorOpciones(trial, { videos: 0, fotos: 1, sinTipo: 0 })).toBe(TRIAL_REEL_MEDIA)
    expect(errorDeMediaPorOpciones(trial, { videos: 1, fotos: 1, sinTipo: 0 })).toBe(TRIAL_REEL_MEDIA)
    expect(errorDeMediaPorOpciones(trial, { videos: 2, fotos: 0, sinTipo: 0 })).toBe(TRIAL_REEL_MEDIA)
    expect(errorDeMediaPorOpciones(trial, { videos: 0, fotos: 0, sinTipo: 0 })).toBe(TRIAL_REEL_MEDIA)
  })

  it('antes de descargar, un archivo sin tipo conocido (un link de Drive) puede ser el video', () => {
    // La re-validación con los tipos reales da el veredicto final; acá no se rechaza
    // lo que todavía puede ser correcto.
    expect(errorDeMediaPorOpciones(trial, { videos: 0, fotos: 0, sinTipo: 1 })).toBeNull()
    expect(errorDeMediaPorOpciones(trial, { videos: 0, fotos: 0, sinTipo: 2 })).toBe(TRIAL_REEL_MEDIA)
    expect(errorDeMediaPorOpciones(trial, { videos: 1, fotos: 0, sinTipo: 1 })).toBe(TRIAL_REEL_MEDIA)
  })

  it('sin trial reel no opina, aunque haya opciones de TikTok', () => {
    expect(errorDeMediaPorOpciones({}, { videos: 0, fotos: 3, sinTipo: 0 })).toBeNull()
    expect(errorDeMediaPorOpciones({ tt: { modo: 'borrador' } }, { videos: 0, fotos: 3, sinTipo: 0 })).toBeNull()
  })
})

describe('opcionesDesdeFormularioPorCuenta para instagram', () => {
  const ig = { id: 'ig-1', network: 'instagram', handle: 'vicente' }

  it('el interruptor encendido produce trialReel: true; apagado o ausente, nada', () => {
    const encendido = new FormData()
    encendido.set('instagramTrial:ig-1', 'on')
    expect(opcionesDesdeFormularioPorCuenta(encendido, [ig])).toEqual({ 'ig-1': { trialReel: true } })

    const apagado = new FormData()
    apagado.set('instagramTrial:ig-1', '')
    expect(opcionesDesdeFormularioPorCuenta(apagado, [ig])).toEqual({})
    expect(opcionesDesdeFormularioPorCuenta(new FormData(), [ig])).toEqual({})
  })
})

describe('resumenOpciones para instagram', () => {
  it('un trial reel se resume en una línea que dice quién lo comparte', () => {
    expect(resumenOpciones('instagram', { trialReel: true })).toBe('Trial reel — lo compartes tú desde Instagram')
    expect(resumenOpciones('instagram', null)).toBeNull()
    expect(resumenOpciones('instagram', { trialReel: false })).toBeNull()
  })
})

describe('la etiqueta de IA de TikTok', () => {
  it('encendida se guarda; apagada o ausente no deja rastro, como lo guardado antes', () => {
    expect(validarOpciones('tiktok', { ...directo, ia: true })).toEqual({ opciones: { ...directo, ia: true } })
    expect(validarOpciones('tiktok', { ...directo, ia: false })).toEqual({ opciones: directo })
    expect(validarOpciones('tiktok', directo)).toEqual({ opciones: directo })
  })

  it('algo que no es booleano es un error de forma', () => {
    expect(validarOpciones('tiktok', { ...directo, ia: 'si' })).toEqual({ error: OPCIONES_ERROR })
  })

  it('el formulario la lee de tiktokIA:<id>', () => {
    const fd = new FormData()
    fd.set('tiktokModo:t1', 'directo')
    fd.set('tiktokPrivacidad:t1', 'SELF_ONLY')
    fd.set('tiktokIA:t1', 'on')
    const raw = opcionesDesdeFormularioPorCuenta(fd, [{ id: 't1', network: 'tiktok' } as never])
    expect(raw.t1).toMatchObject({ ia: true })
  })

  it('el resumen la nombra al final', () => {
    expect(resumenOpciones('tiktok', { ...directo, ia: true })).toBe(
      'Directo · Solo yo · con comentarios · sin dúo · sin pegar · sin comercial · hecho con IA',
    )
  })
})

describe('la música de TikTok', () => {
  it('encendida se guarda; apagada o ausente no deja rastro', () => {
    expect(validarOpciones('tiktok', { ...directo, musica: true })).toEqual({ opciones: { ...directo, musica: true } })
    expect(validarOpciones('tiktok', { ...directo, musica: false })).toEqual({ opciones: directo })
    expect(validarOpciones('tiktok', directo)).toEqual({ opciones: directo })
  })

  it('algo que no es booleano es un error de forma; en la bandeja no se guarda', () => {
    expect(validarOpciones('tiktok', { ...directo, musica: 'si' })).toEqual({ error: OPCIONES_ERROR })
    expect(validarOpciones('tiktok', { modo: 'borrador', musica: true })).toEqual({ opciones: { modo: 'borrador' } })
  })

  it('el formulario la lee de tiktokMusica:<id>; sin el interruptor vale apagada', () => {
    const fd = new FormData()
    fd.set('tiktokModo:t1', 'directo')
    fd.set('tiktokPrivacidad:t1', 'SELF_ONLY')
    fd.set('tiktokMusica:t1', 'on')
    fd.set('tiktokModo:t2', 'directo')
    fd.set('tiktokPrivacidad:t2', 'SELF_ONLY')
    const raw = opcionesDesdeFormularioPorCuenta(fd, [{ id: 't1', network: 'tiktok' } as never, { id: 't2', network: 'tiktok' } as never])
    expect(raw.t1).toMatchObject({ musica: true })
    expect(raw.t2).toMatchObject({ musica: false })
  })

  it('el resumen la nombra solo cuando el post es todo fotos', () => {
    expect(resumenOpciones('tiktok', { ...directo, musica: true }, true)).toBe(
      'Directo · Solo yo · con comentarios · sin dúo · sin pegar · sin comercial · con música de TikTok',
    )
    expect(resumenOpciones('tiktok', { ...directo, musica: true }, false)).toBe(
      'Directo · Solo yo · con comentarios · sin dúo · sin pegar · sin comercial',
    )
    expect(resumenOpciones('tiktok', { ...directo, musica: true })).not.toContain('música')
  })

  it('se recuerda por cuenta solo cuando el interruptor estaba a la vista: fotos y directo', () => {
    const opciones = {
      t1: { ...directo, musica: true } as never,
      t2: directo as never,
      t3: { modo: 'borrador' } as never,
      ig: { trialReel: true } as never,
    }
    expect(musicaParaRecordar(opciones, { videos: 0, fotos: 3 })).toEqual([
      { cuentaId: 't1', musica: true },
      { cuentaId: 't2', musica: false },
    ])
    expect(musicaParaRecordar(opciones, { videos: 1, fotos: 0 })).toEqual([])
    expect(musicaParaRecordar(opciones, { videos: 0, fotos: 0 })).toEqual([])
  })
})

describe('historias', () => {
  const secuencia = { secuencia: 'abc-123', orden: 2 }

  it('Instagram y Facebook aceptan una historia suelta o de una secuencia', () => {
    expect(validarOpciones('instagram', { historia: true })).toEqual({ opciones: { historia: true } })
    expect(validarOpciones('facebook', { historia: true })).toEqual({ opciones: { historia: true } })
    expect(validarOpciones('facebook', { historia: secuencia })).toEqual({ opciones: { historia: secuencia } })
  })

  it('historia apagada o ausente no guarda nada; Facebook sin opciones sigue siendo null', () => {
    expect(validarOpciones('instagram', { historia: false })).toEqual({ opciones: null })
    expect(validarOpciones('facebook', { historia: false })).toEqual({ opciones: null })
    expect(validarOpciones('facebook', undefined)).toEqual({ opciones: null })
  })

  it('historia y trial reel se excluyen', () => {
    expect(validarOpciones('instagram', { historia: true, trialReel: true })).toEqual({ error: HISTORIA_TRIAL })
  })

  it('una forma de secuencia que no se entiende es error de forma', () => {
    for (const historia of [
      'si',
      { secuencia: 'a b', orden: 1 },
      { secuencia: 'a', orden: 0 },
      { secuencia: 'a', orden: 1.5 },
      { secuencia: 'a', orden: 31 },
      { secuencia: 'a', orden: 1, extra: true },
    ]) {
      expect(validarOpciones('instagram', { historia })).toEqual({ error: OPCIONES_ERROR })
    }
    expect(validarOpciones('facebook', { trialReel: true })).toEqual({ error: OPCIONES_ERROR })
  })

  it('todos los destinos de un post historia son historia, y la misma', () => {
    const cuentas = [
      { id: 'ig', network: 'instagram', handle: '@a' },
      { id: 'fb', network: 'facebook', handle: 'Página' },
    ]
    expect(validarOpcionesPorCuenta(cuentas, { ig: { historia: true }, fb: { historia: true } })).toEqual({
      opciones: { ig: { historia: true }, fb: { historia: true } },
    })
    expect(validarOpcionesPorCuenta(cuentas, { ig: { historia: true } })).toEqual({ error: HISTORIA_DESTINOS })
    expect(validarOpcionesPorCuenta(cuentas, { ig: { historia: true }, fb: { historia: secuencia } })).toEqual({
      error: OPCIONES_ERROR,
    })
    const conTikTok = [...cuentas, { id: 'tt', network: 'tiktok', handle: '@t' }]
    expect(
      validarOpcionesPorCuenta(conTikTok, { ig: { historia: true }, fb: { historia: true }, tt: { modo: 'borrador' } }),
    ).toEqual({ error: HISTORIA_DESTINOS })
  })

  it('una historia es exactamente un archivo, foto o video', () => {
    const opciones = { ig: { historia: true as const } }
    expect(errorDeMediaPorOpciones(opciones, { videos: 1, fotos: 0, sinTipo: 0 })).toBeNull()
    expect(errorDeMediaPorOpciones(opciones, { videos: 0, fotos: 1, sinTipo: 0 })).toBeNull()
    expect(errorDeMediaPorOpciones(opciones, { videos: 0, fotos: 0, sinTipo: 1 })).toBeNull()
    expect(errorDeMediaPorOpciones(opciones, { videos: 1, fotos: 1, sinTipo: 0 })).toBe(HISTORIA_MEDIA)
    expect(errorDeMediaPorOpciones(opciones, { videos: 0, fotos: 0, sinTipo: 0 })).toBe(HISTORIA_MEDIA)
  })

  it('sin texto, sin palabra clave y, hacia Instagram, la foto en JPG', () => {
    const opciones = { ig: { historia: true as const } }
    const base = { caption: '', conPalabraClave: false, aInstagram: true, fotos: ['jpg'] }
    expect(errorDeHistoria(opciones, base)).toBeNull()
    expect(errorDeHistoria(opciones, { ...base, caption: 'hola' })).toBe(HISTORIA_SIN_TEXTO)
    expect(errorDeHistoria(opciones, { ...base, caption: '   ' })).toBeNull()
    expect(errorDeHistoria(opciones, { ...base, conPalabraClave: true })).toBe(HISTORIA_SIN_CLAVE)
    expect(errorDeHistoria(opciones, { ...base, fotos: ['png'] })).toBe(HISTORIA_JPG)
    expect(errorDeHistoria(opciones, { ...base, aInstagram: false, fotos: ['png'] })).toBeNull()
    // Un post que no es historia no se mira.
    expect(errorDeHistoria({}, { ...base, caption: 'hola', fotos: ['png'] })).toBeNull()
  })

  it('historiaDe y esHistoria leen lo guardado', () => {
    expect(historiaDe('instagram', { historia: secuencia })).toEqual(secuencia)
    expect(historiaDe('facebook', { historia: true })).toBe(true)
    expect(historiaDe('instagram', { trialReel: true })).toBeNull()
    expect(historiaDe('youtube', { historia: true })).toBeNull()
    expect(esHistoria({ historia: true })).toBe(true)
    expect(esHistoria({ trialReel: true })).toBe(false)
    expect(esHistoria(null)).toBe(false)
  })

  it('el resumen dice que es una historia y, si es de una secuencia, cuál', () => {
    expect(resumenOpciones('instagram', { historia: true })).toBe('Historia')
    expect(resumenOpciones('facebook', { historia: secuencia })).toBe('Historia 2 de una secuencia')
  })
})

describe('opcionesParaApi', () => {
  const directo = { modo: 'directo', privacidad: 'SELF_ONLY', comentarios: true, duo: false, pegar: false, comercial: 'no' }

  it('TikTok directo sale con las casillas de IA y de música explícitas, encendidas o apagadas', () => {
    expect(opcionesParaApi('tiktok', directo)).toEqual({ ...directo, ia: false, musica: false })
    expect(opcionesParaApi('tiktok', { ...directo, ia: true })).toEqual({ ...directo, ia: true, musica: false })
    expect(opcionesParaApi('tiktok', { ...directo, musica: true })).toEqual({ ...directo, ia: false, musica: true })
  })

  it('un borrador, un trial reel y una red sin opciones salen como se guardaron', () => {
    expect(opcionesParaApi('tiktok', { modo: 'borrador' })).toEqual({ modo: 'borrador' })
    expect(opcionesParaApi('instagram', { trialReel: true })).toEqual({ trialReel: true })
    expect(opcionesParaApi('threads', null)).toBeNull()
  })

  it('una fila vieja que ya no valida sale tal cual, no se pierde', () => {
    expect(opcionesParaApi('tiktok', { modo: 'otro' })).toEqual({ modo: 'otro' })
    expect(opcionesParaApi('tiktok', 'basura')).toBeNull()
  })
})

describe('«Música de Instagram» en las opciones de Instagram', () => {
  const musica = { audioId: '587784541076604', titulo: 'Tusa', artista: 'Karol G', volumenMusica: 50, volumenVideo: 100 }

  it('se guarda con la forma exacta; sola o con trial reel', () => {
    expect(validarOpciones('instagram', { musica })).toEqual({ opciones: { musica } })
    expect(validarOpciones('instagram', { trialReel: true, musica })).toEqual({ opciones: { trialReel: true, musica } })
  })

  it('ausente, null o false es sin música; sin trial ni música no se guarda nada', () => {
    expect(validarOpciones('instagram', { musica: null })).toEqual({ opciones: null })
    expect(validarOpciones('instagram', { musica: false, trialReel: false })).toEqual({ opciones: null })
    expect(validarOpciones('instagram', { trialReel: true, musica: undefined })).toEqual({ opciones: { trialReel: true } })
  })

  it('sin artista ni volúmenes: artista null y los dos al máximo, como Meta', () => {
    expect(validarOpciones('instagram', { musica: { audioId: '1', titulo: '  Tusa ' } })).toEqual({
      opciones: { musica: { audioId: '1', titulo: 'Tusa', artista: null, volumenMusica: 100, volumenVideo: 100 } },
    })
  })

  it('rechaza lo que no se entiende: id, título, volúmenes fuera de 1–100 o con decimales, claves de más', () => {
    for (const mala of [
      { ...musica, audioId: '' },
      { ...musica, audioId: 'con espacio' },
      { ...musica, titulo: '' },
      { ...musica, titulo: 3 },
      { ...musica, artista: 3 },
      { ...musica, volumenMusica: 0 },
      { ...musica, volumenVideo: 101 },
      { ...musica, volumenMusica: 50.5 },
      { ...musica, volumenVideo: '80' },
      { ...musica, downloadUrl: 'https://x' },
      'Tusa',
      true,
    ]) {
      expect(validarOpciones('instagram', { musica: mala })).toEqual({ error: OPCIONES_ERROR })
    }
  })

  it('una historia no lleva música', () => {
    expect(validarOpciones('instagram', { historia: true, musica })).toEqual({ error: HISTORIA_MUSICA })
  })

  it('una cuenta con el login de Instagram no la acepta; con dos cuentas, la frase la nombra', () => {
    const conIg = { id: 'ig-1', network: 'instagram', handle: '@a', login: 'instagram' }
    expect(validarOpcionesPorCuenta([conIg], { 'ig-1': { musica } })).toEqual({ error: MUSICA_LOGIN_INSTAGRAM })
    expect(
      validarOpcionesPorCuenta([conIg, { id: 'ig-2', network: 'instagram', handle: '@b' }], { 'ig-1': { musica } }),
    ).toEqual({ error: `«@a»: ${MUSICA_LOGIN_INSTAGRAM}` })
    expect(validarOpcionesPorCuenta([conIg], { 'ig-1': { trialReel: true } })).toEqual({
      opciones: { 'ig-1': { trialReel: true } },
    })
    expect(validarOpcionesPorCuenta([{ id: 'ig-1', network: 'instagram', handle: '@a' }], { 'ig-1': { musica } })).toEqual({
      opciones: { 'ig-1': { musica } },
    })
  })

  it('la música no es regla de media: con fotos se guarda igual y el publicador no la manda', () => {
    expect(errorDeMediaPorOpciones({ 'ig-1': { musica } }, { videos: 0, fotos: 2, sinTipo: 0 })).toBeNull()
  })

  it('musicaDe lee la guardada, y null en cualquier otra red o forma', () => {
    expect(musicaDe('instagram', { trialReel: true, musica })).toEqual(musica)
    expect(musicaDe('instagram', { trialReel: true })).toBeNull()
    expect(musicaDe('tiktok', { ...directo, musica: true })).toBeNull()
    expect(musicaDe('instagram', { musica: { audioId: '1' } })).toBeNull()
  })

  it('el formulario la manda en JSON por cuenta, junto al trial; un JSON roto se rechaza, no se pierde', () => {
    const ig = { id: 'ig-1', network: 'instagram', handle: 'vicente' }
    const datos = new FormData()
    datos.set('instagramTrial:ig-1', 'on')
    datos.set('instagramMusica:ig-1', JSON.stringify(musica))
    expect(opcionesDesdeFormularioPorCuenta(datos, [ig])).toEqual({ 'ig-1': { trialReel: true, musica } })

    const vacio = new FormData()
    vacio.set('instagramMusica:ig-1', '')
    expect(opcionesDesdeFormularioPorCuenta(vacio, [ig])).toEqual({})

    const roto = new FormData()
    roto.set('instagramMusica:ig-1', '{roto')
    const raw = opcionesDesdeFormularioPorCuenta(roto, [ig])
    expect(validarOpcionesPorCuenta([ig], raw)).toEqual({ error: OPCIONES_ERROR })
    expect(musicaDesdeCampo(undefined)).toBeUndefined()
  })

  it('el resumen la nombra solo en un video solo', () => {
    expect(resumenOpciones('instagram', { musica }, false, true)).toBe('Con música de Instagram: «Tusa» de Karol G')
    expect(resumenOpciones('instagram', { musica }, true, false)).toBeNull()
    expect(resumenOpciones('instagram', { trialReel: true, musica }, false, true)).toBe(
      'Trial reel — lo compartes tú desde Instagram · Con música de Instagram: «Tusa» de Karol G',
    )
    expect(nombreDeCancion({ titulo: 'Tusa', artista: null })).toBe('«Tusa»')
  })

  it('la API la devuelve tal como quedó', () => {
    expect(opcionesParaApi('instagram', { musica })).toEqual({ musica })
  })
})

describe('opciones de YouTube', () => {
  it('lo de siempre —público, sin IA, sin playlist— no guarda nada', () => {
    expect(validarOpciones('youtube', undefined)).toEqual({ opciones: null })
    expect(validarOpciones('youtube', null)).toEqual({ opciones: null })
    expect(validarOpciones('youtube', {})).toEqual({ opciones: null })
    expect(validarOpciones('youtube', { visibilidad: 'public', ia: false, playlist: null })).toEqual({ opciones: null })
  })

  it('guarda solo lo que se sale de lo de siempre', () => {
    expect(validarOpciones('youtube', { visibilidad: 'unlisted' })).toEqual({ opciones: { visibilidad: 'unlisted' } })
    expect(validarOpciones('youtube', { visibilidad: 'private', ia: true, playlist: 'PLabc_-123' })).toEqual({
      opciones: { visibilidad: 'private', ia: true, playlist: 'PLabc_-123' },
    })
    expect(validarOpciones('youtube', { visibilidad: 'public', ia: true })).toEqual({ opciones: { ia: true } })
  })

  it('rechaza una visibilidad que no existe, una clave de más o un id de playlist sin forma', () => {
    expect(validarOpciones('youtube', { visibilidad: 'PUBLIC_TO_EVERYONE' })).toEqual({ error: OPCIONES_ERROR })
    expect(validarOpciones('youtube', { privacidad: 'private' })).toEqual({ error: OPCIONES_ERROR })
    expect(validarOpciones('youtube', { ia: 'si' })).toEqual({ error: OPCIONES_ERROR })
    expect(validarOpciones('youtube', { playlist: 'https://youtube.com/playlist?list=PL1' })).toEqual({
      error: OPCIONES_ERROR,
    })
    expect(validarOpciones('youtube', { playlist: '' })).toEqual({ error: OPCIONES_ERROR })
    expect(validarOpciones('youtube', 'privado')).toEqual({ error: OPCIONES_ERROR })
  })

  it('youtubeDe lee lo guardado, y null en otra red o con algo que no se entiende', () => {
    expect(youtubeDe('youtube', { ia: true })).toEqual({ ia: true })
    expect(youtubeDe('tiktok', { ia: true })).toBeNull()
    expect(youtubeDe('youtube', { otra: 1 })).toBeNull()
  })

  it('validarOpcionesPorCuenta las acepta por cuenta, y con dos canales nombra el que falló', () => {
    const cuentas = [
      { id: 'yt-1', network: 'youtube', handle: 'Canal uno' },
      { id: 'yt-2', network: 'youtube', handle: 'Canal dos' },
    ]
    expect(validarOpcionesPorCuenta(cuentas, { 'yt-1': { visibilidad: 'private' }, 'yt-2': { playlist: 'PL2' } })).toEqual({
      opciones: { 'yt-1': { visibilidad: 'private' }, 'yt-2': { playlist: 'PL2' } },
    })
    expect(validarOpcionesPorCuenta(cuentas, { 'yt-2': { visibilidad: 'oculto' } })).toEqual({
      error: `«Canal dos»: ${OPCIONES_ERROR}`,
    })
    // Sin opciones, un canal sigue saliendo como siempre: no hay nada que exigir.
    expect(validarOpcionesPorCuenta(cuentas, {})).toEqual({ opciones: {} })
  })

  it('el formulario las lee de youtubeVisibilidad, youtubeIA y youtubePlaylist con el sufijo de la cuenta', () => {
    const fd = new FormData()
    fd.set('youtubeVisibilidad:y1', 'unlisted')
    fd.set('youtubeIA:y1', 'on')
    fd.set('youtubePlaylist:y1', 'PL9')
    fd.set('youtubeVisibilidad:y2', 'public')
    fd.set('youtubeIA:y2', '')
    fd.set('youtubePlaylist:y2', '')
    const raw = opcionesDesdeFormularioPorCuenta(fd, [
      { id: 'y1', network: 'youtube' } as never,
      { id: 'y2', network: 'youtube' } as never,
    ])
    expect(raw).toEqual({ y1: { visibilidad: 'unlisted', ia: true, playlist: 'PL9' } })
    expect(youtubeDesdeFormulario(fd, 'y2')).toBeUndefined()
  })

  it('el resumen dice la visibilidad, la IA y la playlist', () => {
    expect(resumenOpciones('youtube', { visibilidad: 'unlisted', ia: true, playlist: 'PL1' })).toBe(
      'No listado · hecho con IA · a una playlist',
    )
    expect(resumenOpciones('youtube', { ia: true })).toBe('Público · hecho con IA')
    expect(resumenOpciones('youtube', null)).toBeNull()
  })

  it('la API las devuelve con las tres claves explícitas', () => {
    expect(opcionesParaApi('youtube', { ia: true })).toEqual({ visibilidad: 'public', ia: true, playlist: null })
    expect(opcionesParaApi('youtube', { visibilidad: 'private', playlist: 'PL1' })).toEqual({
      visibilidad: 'private',
      ia: false,
      playlist: 'PL1',
    })
    expect(opcionesParaApi('youtube', null)).toBeNull()
  })
})
