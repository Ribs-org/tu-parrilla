import { describe, expect, it } from 'vitest'

import {
  ARCHIVO_MUY_GRANDE,
  ENVIO_INICIAL,
  MAX_BYTES,
  SIN_SENAL_SUBIDA,
  TIPO_NO_PUBLICABLE,
  archivoDelBorrador,
  archivoElegido,
  cuentasConTrial,
  describirArchivo,
  estadoSubidas,
  etiquetaCuenta,
  etiquetaEnvio,
  fechaParaElDia,
  hayPendientes,
  notaDeArchivo,
  opcionesDelBorrador,
  proximaHoraEnPunto,
  puedeEnviar,
  reducirEnvio,
  subidos,
  textoConfirmacion,
  vieneMarcada,
  volverASubir,
  type Envio,
} from './publicar'
import type { CuentaApp } from './tipos'

describe('describirArchivo', () => {
  it('toma el tipo que entrega el selector', () => {
    expect(
      describirArchivo({ uri: 'content://media/1', fileName: 'VID_1.mp4', mimeType: 'video/mp4', fileSize: 500 }),
    ).toEqual({ uri: 'content://media/1', nombre: 'VID_1.mp4', tipo: 'video/mp4', bytes: 500, mediaType: 'video' })
  })

  it('sin mimeType, lo deduce de la extensión con la misma tabla del sitio', () => {
    expect(describirArchivo({ uri: 'file:///a/clip.MOV', fileName: 'clip.MOV', fileSize: 1 })).toMatchObject({
      tipo: 'video/quicktime',
      mediaType: 'video',
    })
    expect(describirArchivo({ uri: 'file:///a/f.jpg', fileName: 'f.jpg', fileSize: 1 })).toMatchObject({
      tipo: 'image/jpeg',
      mediaType: 'image',
    })
  })

  it('sin nombre, usa el último segmento de la uri', () => {
    expect(describirArchivo({ uri: 'file:///cache/foto.png', mimeType: 'image/png', fileSize: 1 })).toMatchObject({
      nombre: 'foto.png',
    })
  })

  it('con fileName vacío, también cae al último segmento de la uri', () => {
    expect(
      describirArchivo({ uri: 'file:///cache/foto.png', fileName: '', mimeType: 'image/png', fileSize: 1 }),
    ).toMatchObject({ nombre: 'foto.png' })
  })

  it('rechaza lo que no es imagen ni video, y lo que no tiene ni tipo ni extensión', () => {
    expect(describirArchivo({ uri: 'file:///a/doc.pdf', fileName: 'doc.pdf', mimeType: 'application/pdf', fileSize: 1 })).toEqual({
      error: TIPO_NO_PUBLICABLE,
    })
    expect(describirArchivo({ uri: 'content://media/9', fileSize: 1 })).toEqual({ error: TIPO_NO_PUBLICABLE })
  })

  it('rechaza al elegir un formato que la subida no acepta, aunque sea imagen o video', () => {
    expect(describirArchivo({ uri: 'file:///a/f.heic', fileName: 'f.heic', mimeType: 'image/heic', fileSize: 1 })).toEqual({
      error: TIPO_NO_PUBLICABLE,
    })
    expect(describirArchivo({ uri: 'file:///a/v.3gp', fileName: 'v.3gp', mimeType: 'video/3gpp', fileSize: 1 })).toEqual({
      error: TIPO_NO_PUBLICABLE,
    })
  })

  it('un image/jpg de la galería sale como image/jpeg, el tipo que firma el servidor', () => {
    expect(describirArchivo({ uri: 'file:///a/f.jpg', fileName: 'f.jpg', mimeType: 'image/jpg', fileSize: 1 })).toMatchObject({
      tipo: 'image/jpeg',
      mediaType: 'image',
    })
  })

  it('rechaza más de 500 MB antes de pedir una URL que el servidor va a negar', () => {
    expect(describirArchivo({ uri: 'file:///v.mp4', mimeType: 'video/mp4', fileSize: MAX_BYTES + 1 })).toEqual({
      error: ARCHIVO_MUY_GRANDE,
    })
  })

  it('un tamaño desconocido no bloquea: el servidor es la puerta', () => {
    expect(describirArchivo({ uri: 'file:///v.mp4', mimeType: 'video/mp4' })).toMatchObject({ bytes: 0 })
  })
})

describe('reducirEnvio', () => {
  it('recorre el camino feliz: un solo pedido, porque los archivos ya subieron', () => {
    let e: Envio = ENVIO_INICIAL
    e = reducirEnvio(e, { tipo: 'crear', ahora: false })
    expect(e).toEqual({ paso: 'creando', ahora: false })
    e = reducirEnvio(e, { tipo: 'hecho' })
    expect(e).toEqual({ paso: 'hecho' })
  })

  it('un rechazo, o la red caída, vuelve a listo con la frase: reintentar es tocar de nuevo', () => {
    expect(
      reducirEnvio({ paso: 'creando', ahora: false }, { tipo: 'rechazado', mensaje: 'X recibe hasta cuatro imágenes.' }),
    ).toEqual({ paso: 'listo', error: 'X recibe hasta cuatro imágenes.' })
  })

  it('cancelar vuelve a listo sin error', () => {
    expect(reducirEnvio({ paso: 'hecho' }, { tipo: 'cancelar' })).toEqual(ENVIO_INICIAL)
  })
})

describe('etiquetaEnvio', () => {
  it('dice en qué va, en español', () => {
    expect(etiquetaEnvio({ paso: 'listo', error: null })).toBeNull()
    expect(etiquetaEnvio({ paso: 'creando', ahora: false })).toBe('Programando…')
    expect(etiquetaEnvio({ paso: 'creando', ahora: true })).toBe('Publicando…')
    expect(etiquetaEnvio({ paso: 'hecho' })).toBe('Listo')
  })
})

describe('los archivos y sus subidas', () => {
  const foto = { uri: 'file:///f.jpg', nombre: 'f.jpg', tipo: 'image/jpeg', bytes: 10, mediaType: 'image' as const }

  it('uno elegido entra subiendo; uno de un borrador ya está listo', () => {
    expect(archivoElegido(foto)).toMatchObject({ estado: 'subiendo', url: null, vista: 'file:///f.jpg', local: foto })
    expect(archivoDelBorrador({ url: 'https://cdn/a.jpg', mediaType: 'image', nombre: 'a.jpg' })).toMatchObject({
      estado: 'listo',
      url: 'https://cdn/a.jpg',
      vista: 'https://cdn/a.jpg',
      local: null,
    })
  })

  it('se suben de a uno: el primero que sube dice su porcentaje y los demás esperan', () => {
    const lista = [
      archivoDelBorrador({ url: 'https://cdn/a.jpg', mediaType: 'image', nombre: 'a.jpg' }),
      { ...archivoElegido(foto), progreso: 0.456 },
      archivoElegido(foto),
      { ...archivoElegido(foto), estado: 'fallo' as const, error: SIN_SENAL_SUBIDA },
    ]
    expect(lista.map((_, i) => notaDeArchivo(lista, i))).toEqual([null, '46 %', 'En cola', 'Reintentar'])
    expect(hayPendientes(lista)).toBe(true)
    expect(hayPendientes([lista[0]!])).toBe(false)
  })

  it('una subida caída pesa más que las que siguen, y dice cómo reintentar', () => {
    const caido = { ...archivoElegido(foto), estado: 'fallo' as const, error: SIN_SENAL_SUBIDA }
    expect(estadoSubidas([archivoElegido(foto), caido])).toEqual({
      texto: 'No se pudo subir el archivo. Revisa tu señal. Toca el archivo para reintentar.',
      error: true,
    })
    expect(estadoSubidas([archivoElegido(foto), archivoElegido(foto)])).toEqual({ texto: 'Subiendo 2 archivos…', error: false })
    expect(estadoSubidas([archivoElegido(foto)])).toEqual({ texto: 'Subiendo el archivo…', error: false })
    expect(estadoSubidas([])).toBeNull()
  })

  it('volver a subir devuelve a la cola solo los del teléfono', () => {
    const remoto = archivoDelBorrador({ url: 'https://cdn/a.jpg', mediaType: 'image', nombre: 'a.jpg' })
    const local = { ...archivoElegido(foto), url: 'https://cdn/f.jpg', estado: 'listo' as const, progreso: 1 }
    const [r, l] = volverASubir([remoto, local])
    expect(r).toBe(remoto)
    expect(l).toMatchObject({ estado: 'subiendo', url: null, progreso: 0 })
    expect(subidos([remoto, l!])).toEqual([{ url: 'https://cdn/a.jpg', mediaType: 'image', nombre: 'a.jpg' }])
  })
})

function cuenta(red: string, handle: string | null): CuentaApp {
  return { id: `${red}-1`, red, handle, conectada: true }
}

describe('textoConfirmacion', () => {
  it('nombra los handles con «y» al final y avisa el plazo', () => {
    expect(textoConfirmacion([cuenta('instagram', '@mi_ig')])).toBe(
      '¿Publicar ahora en @mi_ig? Saldrá en los próximos 5 minutos.',
    )
    expect(textoConfirmacion([cuenta('instagram', '@mi_ig'), cuenta('youtube', '@mi_canal')])).toBe(
      '¿Publicar ahora en @mi_ig y @mi_canal? Saldrá en los próximos 5 minutos.',
    )
    expect(
      textoConfirmacion([cuenta('instagram', '@mi_ig'), cuenta('facebook', '@mi_fb'), cuenta('x', '@mi_x')]),
    ).toBe('¿Publicar ahora en @mi_ig, @mi_fb y @mi_x? Saldrá en los próximos 5 minutos.')
  })

  it('sin handle, cae al nombre de la red', () => {
    expect(textoConfirmacion([cuenta('youtube', null)])).toBe(
      '¿Publicar ahora en YouTube? Saldrá en los próximos 5 minutos.',
    )
  })
})

describe('vieneMarcada', () => {
  it('con una sola cuenta conectada, viene marcada', () => {
    const sola = cuenta('instagram', '@mi_ig')
    expect(vieneMarcada(sola, [sola])).toBe(true)
  })

  it('con dos cuentas conectadas, no viene ninguna', () => {
    const a = cuenta('instagram', '@mi_ig')
    const b = cuenta('facebook', '@mi_fb')
    expect(vieneMarcada(a, [a, b])).toBe(false)
    expect(vieneMarcada(b, [a, b])).toBe(false)
  })

  it('una desconectada no cuenta para decidir ni viene marcada', () => {
    const viva = cuenta('instagram', '@mi_ig')
    const muerta = { ...cuenta('facebook', '@mi_fb'), conectada: false }
    expect(vieneMarcada(viva, [viva, muerta])).toBe(true)
    expect(vieneMarcada(muerta, [viva, muerta])).toBe(false)
  })
})

describe('etiquetaCuenta', () => {
  it('junta el nombre de la red y el handle', () => {
    expect(etiquetaCuenta(cuenta('instagram', '@mi_ig'))).toBe('Instagram · @mi_ig')
  })

  it('sin handle, dice «sin nombre»', () => {
    expect(etiquetaCuenta(cuenta('facebook', null))).toBe('Facebook · sin nombre')
  })

  it('una red sin nombre conocido usa el código tal cual', () => {
    expect(etiquetaCuenta(cuenta('mastodon', '@yo'))).toBe('mastodon · @yo')
  })
})

describe('proximaHoraEnPunto', () => {
  it('redondea hacia arriba a la hora siguiente', () => {
    expect(proximaHoraEnPunto(new Date(2026, 8, 9, 15, 20, 30))).toEqual(new Date(2026, 8, 9, 16, 0, 0, 0))
  })

  it('en punto exacto, igual salta a la siguiente: «la próxima» nunca es ahora mismo', () => {
    expect(proximaHoraEnPunto(new Date(2026, 8, 9, 15, 0, 0))).toEqual(new Date(2026, 8, 9, 16, 0, 0, 0))
  })
})

describe('puedeEnviar', () => {
  it('sin texto ni archivo, no envía aunque haya una cuenta elegida', () => {
    expect(puedeEnviar('', 0, 1)).toBe(false)
    expect(puedeEnviar('   ', 0, 1)).toBe(false)
  })

  it('con texto o archivo, pero sin ninguna cuenta elegida, tampoco envía', () => {
    expect(puedeEnviar('Hola', 0, 0)).toBe(false)
    expect(puedeEnviar('', 1, 0)).toBe(false)
  })

  it('con algo que mandar y al menos una cuenta, envía: el resto lo dice el servidor', () => {
    expect(puedeEnviar('Hola', 0, 1)).toBe(true)
    expect(puedeEnviar('', 1, 1)).toBe(true)
    expect(puedeEnviar('Hola', 0, 2)).toBe(true)
  })
})

describe('cuentasConTrial y opcionesDelBorrador', () => {
  const ig1: CuentaApp = { id: 'ig-1', red: 'instagram', handle: 'vicente', conectada: true }
  const ig2: CuentaApp = { id: 'ig-2', red: 'instagram', handle: 'clips', conectada: true }
  const yt: CuentaApp = { id: 'yt-1', red: 'youtube', handle: 'vicente', conectada: true }
  const video = { mediaType: 'video' as const }
  const foto = { mediaType: 'image' as const }

  it('ofrece el trial solo en las cuentas de Instagram marcadas, y solo con un video', () => {
    expect(cuentasConTrial([ig1, ig2, yt], ['ig-1', 'yt-1'], [video])).toEqual([ig1])
    expect(cuentasConTrial([ig1, ig2, yt], ['ig-1', 'ig-2'], [video])).toEqual([ig1, ig2])
    expect(cuentasConTrial([ig1, yt], ['ig-1'], [foto])).toEqual([])
    expect(cuentasConTrial([ig1, yt], ['ig-1'], [video, foto])).toEqual([])
    expect(cuentasConTrial([ig1, yt], ['ig-1'], [])).toEqual([])
    expect(cuentasConTrial([ig1, yt], ['yt-1'], [video])).toEqual([])
  })

  it('viaja solo lo que se ofrece Y está encendido', () => {
    expect(opcionesDelBorrador([ig1, ig2, yt], ['ig-1', 'ig-2'], ['ig-1'], [video])).toEqual({
      'ig-1': { trialReel: true },
    })
    // Encendido pero ya sin video: no viaja, sin que nadie tenga que apagarlo.
    expect(opcionesDelBorrador([ig1, yt], ['ig-1'], ['ig-1'], [video, foto])).toEqual({})
    // Encendido pero desmarcada la cuenta: tampoco.
    expect(opcionesDelBorrador([ig1, yt], ['yt-1'], ['ig-1'], [video])).toEqual({})
    expect(opcionesDelBorrador([ig1, yt], ['ig-1'], [], [video])).toEqual({})
  })
})

describe('fechaParaElDia', () => {
  // Fechas locales a propósito: la regla trabaja en la hora del teléfono, igual que el selector.
  const ahora = new Date(2026, 9, 15, 15, 20)

  it('otro día, a la hora en punto que viene', () => {
    expect(fechaParaElDia('2026-10-17', ahora)).toEqual(new Date(2026, 9, 17, 16, 0))
  })

  it('hoy, o un día que ya pasó, es la próxima hora en punto', () => {
    expect(fechaParaElDia('2026-10-15', ahora)).toEqual(new Date(2026, 9, 15, 16, 0))
    expect(fechaParaElDia('2026-10-01', ahora)).toEqual(new Date(2026, 9, 15, 16, 0))
  })

  it('un día ilegible no cambia nada', () => {
    expect(fechaParaElDia('mañana', ahora)).toEqual(new Date(2026, 9, 15, 16, 0))
  })
})
