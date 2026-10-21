import { describe, expect, it } from 'vitest'
import {
  MAX_CAMPOS_BORRADOR,
  borradorDemasiadoGrande,
  camposDesdeFormulario,
  camposDesdeTelefono,
  fechaParaDia,
  idDeBorrador,
  instagramTrialInicial,
  reglaInicial,
  soloEnElPanel,
  telefonoDesdeCampos,
  textoDe,
  tieneContenido,
  tiktokInicial,
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
    })
    expect(tiktokInicial(campos, 't2')).toMatchObject({ borrador: true, comercial: 'no' })
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

  it('sin fecha, el campo va vacío como lo deja el panel; el trial de una cuenta no elegida no viaja', () => {
    const campos = camposDesdeTelefono(null, { texto: '', cuentas: [], scheduledAt: '', trial: ['ig-1'] }, new Map())
    expect(campos).toEqual({ caption: [''], cuentas: [], scheduledAt: [''] })
  })
})

describe('telefonoDesdeCampos', () => {
  it('devuelve el texto, las cuentas y los trial reels encendidos', () => {
    expect(
      telefonoDesdeCampos({ caption: ['Hola'], cuentas: ['ig-1', 'ig-2'], 'instagramTrial:ig-2': ['on'] }),
    ).toEqual({ texto: 'Hola', cuentas: ['ig-1', 'ig-2'], trial: ['ig-2'] })
  })

  it('de un borrador vacío, todo vacío', () => {
    expect(telefonoDesdeCampos({})).toEqual({ texto: '', cuentas: [], trial: [] })
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
})
