import { describe, expect, it } from 'vitest'
import {
  MAX_CAMPOS_BORRADOR,
  borradorDemasiadoGrande,
  camposDesdeFormulario,
  camposDesdeTelefono,
  esBorradorDeHistoria,
  fechaParaDia,
  historiaDelTelefono,
  idDeBorrador,
  instagramMusicaInicial,
  instagramTrialInicial,
  musicaDelTelefono,
  opcionesConMusicaDelBorrador,
  reglaDelTelefono,
  reglaInicial,
  soloEnElPanel,
  telefonoDesdeCampos,
  textoDe,
  tieneContenido,
  tiktokDelTelefono,
  tiktokInicial,
  opcionesConYoutubeDelBorrador,
  youtubeDelTelefono,
  youtubeInicial,
} from './borrador'

const ZONA = 'America/Santiago'

describe('borradorDemasiadoGrande', () => {
  it('un borrador de verdad, aun con un texto largo, cabe de sobra', () => {
    expect(borradorDemasiadoGrande({ caption: ['x'.repeat(5000)], cuentas: ['a', 'b'] })).toBe(false)
  })

  it('lo que pasa del tope no se guarda', () => {
    expect(borradorDemasiadoGrande({ caption: ['x'.repeat(MAX_CAMPOS_BORRADOR)] })).toBe(true)
  })
})

describe('camposDesdeFormulario', () => {
  it('agrupa los valores por nombre y deja fuera archivos y campos de transporte', () => {
    const fd = new FormData()
    fd.append('caption', 'Hola')
    fd.append('cuentas', 'a')
    fd.append('cuentas', 'b')
    fd.append('mediaSubida', '[]')
    fd.append('borradorId', 'x')
    fd.append('$ACTION_ID_123', '')
    fd.append('archivo', new File(['x'], 'foto.jpg'))
    expect(camposDesdeFormulario(fd)).toEqual({ caption: ['Hola'], cuentas: ['a', 'b'] })
  })
})

describe('tieneContenido', () => {
  it('hace falta texto, un archivo o una palabra clave', () => {
    expect(tieneContenido({}, 0)).toBe(false)
    expect(tieneContenido({ caption: ['   '] }, 0)).toBe(false)
    expect(tieneContenido({ caption: ['Hola'] }, 0)).toBe(true)
    expect(tieneContenido({}, 1)).toBe(true)
    expect(tieneContenido({ reglaPalabra: ['GUIA'] }, 0)).toBe(true)
  })

  it('cuentas y fecha solas no alcanzan: vienen puestas solas al abrir', () => {
    expect(tieneContenido({ cuentas: ['a'], scheduledAt: ['2026-10-20T09:00'] }, 0)).toBe(false)
  })
})

describe('idDeBorrador', () => {
  it('acepta un uuid y rechaza todo lo demás', () => {
    expect(idDeBorrador('3f2a1b0c-0000-4000-8000-000000000000')).toBe('3f2a1b0c-0000-4000-8000-000000000000')
    expect(idDeBorrador('')).toBeNull()
    expect(idDeBorrador('1; drop table borradores')).toBeNull()
    expect(idDeBorrador(null)).toBeNull()
  })
})

describe('lo que se restaura de un borrador', () => {
  const campos = {
    caption: ['  Hola  '],
    'tiktokModo:t1': ['directo'],
    'tiktokPrivacidad:t1': ['PUBLIC_TO_EVERYONE'],
    'tiktokComentarios:t1': ['on'],
    'tiktokComercial:t1': ['patrocinado'],
    'tiktokModo:t2': ['borrador'],
    'tiktokComercial:t2': ['no'],
    'tiktokMusica:t1': ['on'],
    'instagramTrial:i1': ['on'],
    'instagramTrial:i2': [''],
    reglaPalabra: ['GUIA'],
    reglaMensaje: ['Acá va'],
    reglaRespuesta: ['Te lo mandé'],
  }

  it('las opciones de TikTok de cada cuenta', () => {
    expect(tiktokInicial(campos, 't1')).toEqual({
      borrador: false,
      privacidad: 'PUBLIC_TO_EVERYONE',
      comentarios: true,
      duo: false,
      pegar: false,
      comercial: 'patrocinado',
      ia: false,
      musica: true,
    })
    expect(tiktokInicial(campos, 't2')).toMatchObject({ borrador: true, comercial: 'no' })
    // Sin el interruptor a la vista (un video, o la bandeja) no dice nada: manda lo que la
    // cuenta recuerda.
    expect(tiktokInicial(campos, 't2')).not.toHaveProperty('musica')
    // Una cuenta que no tenía bloque en el borrador nace como la guía de TikTok exige.
    expect(tiktokInicial(campos, 'otra')).toBeNull()
  })

  it('el trial reel de cada cuenta de Instagram', () => {
    expect(instagramTrialInicial(campos, 'i1')).toBe(true)
    expect(instagramTrialInicial(campos, 'i2')).toBe(false)
    expect(instagramTrialInicial(campos, 'otra')).toBe(false)
  })

  it('la regla, solo si tenía palabra', () => {
    expect(reglaInicial(campos)).toEqual({ palabra: 'GUIA', mensaje: 'Acá va', respuestaPublica: 'Te lo mandé' })
    expect(reglaInicial({ reglaPalabra: [''], reglaMensaje: ['algo'] })).toBeNull()
  })

  it('el texto, sin espacios sobrantes', () => {
    expect(textoDe(campos)).toBe('Hola')
    expect(textoDe({})).toBe('')
  })
})

describe('fechaParaDia', () => {
  // 13 de octubre de 2026, 14:20 en Chile (UTC-3).
  const AHORA = new Date('2026-10-13T17:20:00Z')

  it('un día que viene, a las 9', () => {
    expect(fechaParaDia('2026-10-16', AHORA, ZONA)).toBe('2026-10-16T09:00')
  })

  it('hoy, la hora en punto siguiente', () => {
    expect(fechaParaDia('2026-10-13', AHORA, ZONA)).toBe('2026-10-13T15:00')
  })

  it('hoy antes de las 9, las 9', () => {
    expect(fechaParaDia('2026-10-13', new Date('2026-10-13T09:30:00Z'), ZONA)).toBe('2026-10-13T09:00')
  })

  it('hoy pasadas las 23, sin hora: no se propone otro día', () => {
    expect(fechaParaDia('2026-10-13', new Date('2026-10-14T02:30:00Z'), ZONA)).toBe('')
  })

  it('un día pasado o que no es fecha, vacío', () => {
    expect(fechaParaDia('2026-10-12', AHORA, ZONA)).toBe('')
    expect(fechaParaDia('mañana', AHORA, ZONA)).toBe('')
    expect(fechaParaDia('2026-02-30', AHORA, ZONA)).toBe('')
    expect(fechaParaDia('', AHORA, ZONA)).toBe('')
  })
})

const TIKTOK = new Map([['tt-1', 'TikTok']])

describe('camposDesdeTelefono', () => {
  const telefono = { texto: 'Hola', cuentas: ['ig-1'], scheduledAt: '2026-10-20T19:00', trial: ['ig-1'] }

  it('un borrador nuevo lleva solo lo que el teléfono sabe', () => {
    expect(camposDesdeTelefono(null, telefono, new Map())).toEqual({
      caption: ['Hola'],
      cuentas: ['ig-1'],
      scheduledAt: ['2026-10-20T19:00'],
      'instagramTrial:ig-1': ['on'],
    })
  })

  it('conserva lo que solo el panel sabe: TikTok, sus opciones y la palabra clave', () => {
    const anteriores = {
      caption: ['Viejo'],
      cuentas: ['ig-1', 'fb-1', 'tt-1'],
      scheduledAt: ['2026-10-19T09:00'],
      cuandoAhora: ['on'],
      'instagramTrial:ig-1': ['on'],
      'tiktokModo:tt-1': ['directo'],
      'tiktokPrivacidad:tt-1': ['SELF_ONLY'],
      reglaPalabra: ['GUIA'],
      reglaMensaje: ['Te la mando'],
    }
    const campos = camposDesdeTelefono(anteriores, { ...telefono, trial: [] }, TIKTOK)
    expect(campos).toEqual({
      caption: ['Hola'],
      // fb-1 se desmarcó en el teléfono; tt-1 el teléfono no la ve, así que sigue.
      cuentas: ['ig-1', 'tt-1'],
      scheduledAt: ['2026-10-20T19:00'],
      'tiktokModo:tt-1': ['directo'],
      'tiktokPrivacidad:tt-1': ['SELF_ONLY'],
      reglaPalabra: ['GUIA'],
      reglaMensaje: ['Te la mando'],
    })
  })

  it('la música del panel se conserva con una app que no la conoce, y la reemplaza la de una que sí', () => {
    const musica = { audioId: '587784541076604', titulo: 'Tusa', artista: 'Karol G', volumenMusica: 50, volumenVideo: 100 }
    const anteriores = { cuentas: ['ig-1'], 'instagramMusica:ig-1': [JSON.stringify(musica)] }
    expect(camposDesdeTelefono(anteriores, telefono, new Map())['instagramMusica:ig-1']).toEqual([JSON.stringify(musica)])
    expect(camposDesdeTelefono(anteriores, { ...telefono, musica: {} }, new Map())['instagramMusica:ig-1']).toBeUndefined()
    const otra = { ...musica, audioId: '42', volumenMusica: 20 }
    expect(camposDesdeTelefono(anteriores, { ...telefono, musica: { 'ig-1': otra } }, new Map())['instagramMusica:ig-1']).toEqual([
      JSON.stringify(otra),
    ])
  })

  it('el modo historia lo escribe la app que lo conoce; la que no, lo conserva', () => {
    expect(camposDesdeTelefono(null, { ...telefono, historia: true }, new Map()).modo).toEqual(['historia'])
    const deHistoria = { cuentas: ['ig-1'], modo: ['historia'] }
    expect(camposDesdeTelefono(deHistoria, telefono, new Map()).modo).toEqual(['historia'])
    expect(camposDesdeTelefono(deHistoria, { ...telefono, historia: false }, new Map()).modo).toBeUndefined()
    expect(esBorradorDeHistoria(deHistoria)).toBe(true)
    expect(telefonoDesdeCampos(deHistoria).historia).toBe(true)
  })

  it('el modo que manda el teléfono: historia, post, o nada si la app no sabe de historias', () => {
    expect(historiaDelTelefono({ modo: 'historia' })).toBe(true)
    expect(historiaDelTelefono({ modo: 'post' })).toBe(false)
    expect(historiaDelTelefono({})).toBeUndefined()
    expect(historiaDelTelefono({ modo: 'reel' })).toBeUndefined()
  })

  it('una app con el bloque de TikTok reemplaza sus opciones, y el compositor las lee igual', () => {
    const anteriores = {
      cuentas: ['ig-1', 'tt-1', 'tt-2'],
      'tiktokModo:tt-1': ['directo'],
      'tiktokPrivacidad:tt-1': ['SELF_ONLY'],
      'tiktokTipoComercial:tt-1': ['patrocinado'],
      'tiktokModo:tt-2': ['borrador'],
    }
    const tiktok = {
      'tt-1': {
        borrador: false,
        privacidad: 'PUBLIC_TO_EVERYONE',
        comentarios: true,
        duo: false,
        pegar: true,
        comercial: 'marca_propia' as const,
        ia: true,
        musica: false,
      },
    }
    const campos = camposDesdeTelefono(anteriores, { ...telefono, cuentas: ['ig-1', 'tt-1'], tiktok }, new Map())
    // tt-2 se desmarcó en el teléfono: sale con sus opciones.
    expect(campos.cuentas).toEqual(['ig-1', 'tt-1'])
    expect(Object.keys(campos).filter((c) => c.startsWith('tiktok')).sort()).toEqual([
      'tiktokComentarios:tt-1',
      'tiktokComercial:tt-1',
      'tiktokIA:tt-1',
      'tiktokModo:tt-1',
      'tiktokMusica:tt-1',
      'tiktokPegar:tt-1',
      'tiktokPrivacidad:tt-1',
    ])
    expect(tiktokInicial(campos, 'tt-1')).toEqual(tiktok['tt-1'])
    expect(telefonoDesdeCampos(campos).tiktok).toEqual(tiktok)
  })

  it('la palabra clave la escribe la app que la muestra; null la borra; la que no la muestra, la conserva', () => {
    const anteriores = { cuentas: ['ig-1'], reglaPalabra: ['GUIA'], reglaMensaje: ['Toma'], reglaRespuesta: ['Va'] }
    expect(reglaInicial(camposDesdeTelefono(anteriores, telefono, new Map()))).toEqual({
      palabra: 'GUIA',
      mensaje: 'Toma',
      respuestaPublica: 'Va',
    })
    expect(reglaInicial(camposDesdeTelefono(anteriores, { ...telefono, regla: null }, new Map()))).toBeNull()
    const nueva = { palabra: 'PDF', mensaje: 'Acá está', respuestaPublica: 'Te lo mandé por privado 📩' }
    const campos = camposDesdeTelefono(anteriores, { ...telefono, regla: nueva }, new Map())
    expect(reglaInicial(campos)).toEqual(nueva)
    expect(telefonoDesdeCampos(campos).regla).toEqual(nueva)
  })

  it('sin fecha, el campo va vacío como lo deja el panel; el trial de una cuenta no elegida no viaja', () => {
    const campos = camposDesdeTelefono(null, { texto: '', cuentas: [], scheduledAt: '', trial: ['ig-1'] }, new Map())
    expect(campos).toEqual({ caption: [''], cuentas: [], scheduledAt: [''] })
  })
})

describe('telefonoDesdeCampos', () => {
  it('devuelve el texto, las cuentas y los trial reels encendidos', () => {
    expect(
      telefonoDesdeCampos({ caption: ['Hola'], cuentas: ['ig-1', 'ig-2'], 'instagramTrial:ig-2': ['on'] }),
    ).toEqual({ texto: 'Hola', cuentas: ['ig-1', 'ig-2'], historia: false, trial: ['ig-2'], musica: {}, tiktok: {}, regla: null, youtube: {} })
  })

  it('de un borrador vacío, todo vacío', () => {
    expect(telefonoDesdeCampos({})).toEqual({
      texto: '',
      cuentas: [],
      historia: false,
      trial: [],
      musica: {},
      tiktok: {},
      regla: null,
      youtube: {},
    })
  })

  it('devuelve la música de Instagram de las cuentas elegidas, y no la que ya no se entiende', () => {
    const musica = { audioId: '587784541076604', titulo: 'Tusa', artista: 'Karol G', volumenMusica: 50, volumenVideo: 100 }
    expect(
      telefonoDesdeCampos({
        cuentas: ['ig-1', 'ig-2'],
        'instagramMusica:ig-1': [JSON.stringify(musica)],
        'instagramMusica:ig-2': ['{roto'],
        'instagramMusica:ig-3': [JSON.stringify(musica)],
      }).musica,
    ).toEqual({ 'ig-1': musica })
  })
})

describe('instagramMusicaInicial', () => {
  it('lee la canción guardada; vacío, roto o con forma ajena es sin canción', () => {
    const musica = { audioId: '587784541076604', titulo: 'Tusa', artista: 'Karol G', volumenMusica: 50, volumenVideo: 100 }
    expect(instagramMusicaInicial({ 'instagramMusica:ig-1': [JSON.stringify(musica)] }, 'ig-1')).toEqual(musica)
    expect(instagramMusicaInicial({ 'instagramMusica:ig-1': [''] }, 'ig-1')).toBeNull()
    expect(instagramMusicaInicial({ 'instagramMusica:ig-1': ['{roto'] }, 'ig-1')).toBeNull()
    expect(instagramMusicaInicial({ 'instagramMusica:ig-1': ['{"audioId":"1"}'] }, 'ig-1')).toBeNull()
    expect(instagramMusicaInicial({}, 'ig-1')).toBeNull()
  })
})

describe('opcionesConMusicaDelBorrador', () => {
  const musica = { audioId: '587784541076604', titulo: 'Tusa', artista: 'Karol G', volumenMusica: 50, volumenVideo: 100 }
  const campos = { cuentas: ['ig-1', 'ig-2'], 'instagramMusica:ig-1': [JSON.stringify(musica)] }

  it('sin `conMusica`, suma la canción del borrador a lo que mandó la app, sin pisar el trial', () => {
    expect(opcionesConMusicaDelBorrador({}, { 'ig-1': { trialReel: true } }, campos)).toEqual({
      'ig-1': { trialReel: true, musica },
    })
  })

  it('con `conMusica`, o sin borrador, queda lo que mandó la app', () => {
    expect(opcionesConMusicaDelBorrador({ conMusica: true }, {}, campos)).toEqual({})
    expect(opcionesConMusicaDelBorrador({}, { 'ig-1': { trialReel: true } }, null)).toEqual({ 'ig-1': { trialReel: true } })
  })
})

describe('musicaDelTelefono', () => {
  const musica = { audioId: '587784541076604', titulo: 'Tusa', artista: 'Karol G', volumenMusica: 50, volumenVideo: 100 }

  it('una app sin `conMusica` no dice nada: se conserva la del panel', () => {
    expect(musicaDelTelefono({ opciones: {} }, { 'ig-1': { musica } }, ['ig-1'])).toBeUndefined()
  })

  it('una app que sabe de música manda la suya, solo de cuentas elegidas y válida', () => {
    expect(
      musicaDelTelefono(
        { conMusica: true },
        { 'ig-1': { musica }, 'ig-2': { musica: { audioId: 'x' } }, 'ig-3': { musica } },
        ['ig-1', 'ig-2'],
      ),
    ).toEqual({ 'ig-1': musica })
    expect(musicaDelTelefono({ conMusica: true }, {}, ['ig-1'])).toEqual({})
  })
})

describe('soloEnElPanel', () => {
  it('sin TikTok ni palabra clave, el teléfono lo puede programar', () => {
    expect(soloEnElPanel({ caption: ['Hola'], cuentas: ['ig-1'], reglaPalabra: ['  '] }, TIKTOK)).toBeNull()
  })

  it('nombra la red que el teléfono no publica', () => {
    expect(soloEnElPanel({ cuentas: ['ig-1', 'tt-1'] }, TIKTOK)).toBe(
      'Este borrador va también a TikTok: eso se programa en el panel web.',
    )
  })

  it('nombra la palabra clave, y junta las dos razones', () => {
    expect(soloEnElPanel({ cuentas: ['ig-1'], reglaPalabra: [' GUIA '] }, TIKTOK)).toBe(
      'Este borrador tiene la palabra clave «GUIA»: eso se programa en el panel web.',
    )
    expect(soloEnElPanel({ cuentas: ['tt-1'], reglaPalabra: ['GUIA'] }, TIKTOK)).toBe(
      'Este borrador va también a TikTok y tiene la palabra clave «GUIA»: eso se programa en el panel web.',
    )
  })

  it('a una app que muestra la palabra clave y TikTok (sin ajenas), no le dice nada', () => {
    expect(soloEnElPanel({ cuentas: ['tt-1'], reglaPalabra: ['GUIA'] }, new Map(), { conRegla: true })).toBeNull()
    expect(soloEnElPanel({ cuentas: ['ig-1'], reglaPalabra: ['GUIA'] }, TIKTOK, { conRegla: true })).toBeNull()
    expect(soloEnElPanel({ cuentas: ['tt-1'], reglaPalabra: ['GUIA'] }, TIKTOK, { conRegla: true })).toBe(
      'Este borrador va también a TikTok: eso se programa en el panel web.',
    )
  })
})

describe('tiktokDelTelefono', () => {
  it('lee el bloque de cada cuenta de TikTok elegida, a medias si hace falta', () => {
    const opciones = {
      'tt-1': { modo: 'directo', privacidad: '', comentarios: true, comercial: 'patrocinado', musica: true },
      'tt-2': { modo: 'borrador' },
      'tt-3': { modo: 'directo', privacidad: 'SELF_ONLY' },
      'ig-1': { trialReel: true },
    }
    expect(tiktokDelTelefono(opciones, ['tt-1', 'tt-2', 'ig-1'], new Set(['tt-1', 'tt-2', 'tt-3']))).toEqual({
      'tt-1': {
        borrador: false,
        privacidad: '',
        comentarios: true,
        duo: false,
        pegar: false,
        comercial: 'patrocinado',
        ia: false,
        musica: true,
      },
      'tt-2': { borrador: true, privacidad: '', comentarios: false, duo: false, pegar: false, comercial: 'no', ia: false },
    })
  })

  it('lo que no se entiende nace como el bloque: sin privacidad, todo apagado', () => {
    expect(tiktokDelTelefono({ 'tt-1': { privacidad: 'TODOS', comentarios: 'si', comercial: 'x' } }, ['tt-1'], new Set(['tt-1']))).toEqual({
      'tt-1': { borrador: false, privacidad: '', comentarios: false, duo: false, pegar: false, comercial: 'no', ia: false },
    })
    expect(tiktokDelTelefono({}, ['tt-1'], new Set(['tt-1']))['tt-1']!.privacidad).toBe('')
  })
})

describe('reglaDelTelefono', () => {
  it('los tres campos, sin documento; la palabra vacía es sin regla', () => {
    expect(
      reglaDelTelefono({ regla: { palabra: 'GUIA', mensaje: 'Toma', respuestaPublica: 'Va', documentoUrl: 'https://x.cl/a.pdf' } }),
    ).toEqual({ palabra: 'GUIA', mensaje: 'Toma', respuestaPublica: 'Va' })
    expect(reglaDelTelefono({ regla: { palabra: '  ', mensaje: 'Toma' } })).toBeNull()
    expect(reglaDelTelefono({ regla: null })).toBeNull()
    expect(reglaDelTelefono({})).toBeNull()
    expect(reglaDelTelefono({ regla: { palabra: 'GUIA', mensaje: 3 } })).toEqual({ palabra: 'GUIA', mensaje: '', respuestaPublica: '' })
  })
})

describe('las opciones de YouTube en un borrador', () => {
  const campos = {
    cuentas: ['yt-1', 'yt-2'],
    'youtubeVisibilidad:yt-1': ['unlisted'],
    'youtubeIA:yt-1': ['on'],
    'youtubePlaylist:yt-1': ['PL1'],
    'youtubeVisibilidad:yt-2': ['public'],
    'youtubeIA:yt-2': [''],
    'youtubePlaylist:yt-2': [''],
  }

  it('youtubeInicial vuelve a mostrar lo elegido, y null si el bloque no estaba', () => {
    expect(youtubeInicial(campos, 'yt-1')).toEqual({ visibilidad: 'unlisted', ia: true, playlist: 'PL1' })
    expect(youtubeInicial(campos, 'yt-2')).toEqual({ visibilidad: 'public', ia: false, playlist: '' })
    expect(youtubeInicial(campos, 'otra')).toBeNull()
    expect(youtubeInicial({ 'youtubeVisibilidad:x': ['oculto'] }, 'x')!.visibilidad).toBe('public')
  })

  it('telefonoDesdeCampos se las da al teléfono por cuenta', () => {
    expect(telefonoDesdeCampos(campos).youtube).toEqual({
      'yt-1': { visibilidad: 'unlisted', ia: true, playlist: 'PL1' },
      'yt-2': { visibilidad: 'public', ia: false, playlist: '' },
    })
  })

  it('youtubeDelTelefono lee las opciones del teléfono sin validar, solo de las cuentas de YouTube elegidas', () => {
    expect(
      youtubeDelTelefono(
        { 'yt-1': { visibilidad: 'private', ia: true, playlist: 'PL9' }, 'yt-2': { visibilidad: 'nada', ia: 'si' }, 'ig-1': { trialReel: true } },
        ['yt-1', 'yt-2', 'ig-1'],
        new Set(['yt-1', 'yt-2']),
      ),
    ).toEqual({
      'yt-1': { visibilidad: 'private', ia: true, playlist: 'PL9' },
      'yt-2': { visibilidad: 'public', ia: false, playlist: '' },
    })
  })

  it('camposDesdeTelefono: una app con el bloque las reescribe; una sin él las conserva', () => {
    const telefono = { texto: 'Hola', cuentas: ['yt-1'], scheduledAt: '', trial: [] }
    const anteriores = { cuentas: ['yt-1'], 'youtubeVisibilidad:yt-1': ['private'], 'youtubePlaylist:yt-1': ['PL1'] }
    const sinBloque = camposDesdeTelefono(anteriores, telefono, new Map())
    expect(sinBloque['youtubeVisibilidad:yt-1']).toEqual(['private'])
    expect(sinBloque['youtubePlaylist:yt-1']).toEqual(['PL1'])
    const conBloque = camposDesdeTelefono(
      anteriores,
      { ...telefono, youtube: { 'yt-1': { visibilidad: 'unlisted', ia: true, playlist: '' } } },
      new Map(),
    )
    expect(conBloque['youtubeVisibilidad:yt-1']).toEqual(['unlisted'])
    expect(conBloque['youtubeIA:yt-1']).toEqual(['on'])
    expect(conBloque['youtubePlaylist:yt-1']).toBeUndefined()
  })

  it('opcionesConYoutubeDelBorrador: a una app sin el bloque le pone las del borrador; a una con él, no', () => {
    expect(opcionesConYoutubeDelBorrador(false, { 'ig-1': { trialReel: true } }, campos)).toEqual({
      'ig-1': { trialReel: true },
      'yt-1': { visibilidad: 'unlisted', ia: true, playlist: 'PL1' },
    })
    expect(opcionesConYoutubeDelBorrador(true, {}, campos)).toEqual({})
    expect(opcionesConYoutubeDelBorrador(false, {}, null)).toEqual({})
  })
})
