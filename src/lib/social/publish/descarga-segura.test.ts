import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  descargarSeguro,
  hostPermitido,
  leerConTope,
  PLAZO_QUIETO_MS,
  PLAZO_RESPUESTA_MS,
  type Descarga,
} from './descarga-segura'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

/** La respuesta de una descarga que tenía que andar; si no anduvo, el test cae con su motivo. */
function respuesta(descarga: Descarga): Response {
  if (!descarga.ok) throw new Error(`la descarga falló: ${descarga.motivo}`)
  return descarga.response
}

/** Un `fetch` que nunca debería llamarse: si se llama, el mock lanza y el `catch` de
 * `descargarSeguro` lo convierte en un fallo — el mismo `ok: false` que «rechazado antes de
 * tocar la red». Por eso el test tiene que comprobar la llamada en sí
 * (`.not.toHaveBeenCalled()`), no solo el valor devuelto. */
function fetchQueNuncaDeberiaLlamarse() {
  const mock = vi.fn(async () => {
    throw new Error('no debía tocar la red')
  })
  vi.stubGlobal('fetch', mock)
  return mock
}

describe('hostPermitido', () => {
  it('permite un host público normal', () => {
    expect(hostPermitido('https://ej.com/g.pdf')).toBe(true)
  })

  it('rechaza localhost, por nombre, con y sin el punto final del FQDN absoluto', () => {
    expect(hostPermitido('http://localhost:4000/')).toBe(false)
    expect(hostPermitido('http://localhost./')).toBe(false)
  })

  it('rechaza loopback IPv4 e IPv6, incluidas sus formas "sin especificar"', () => {
    expect(hostPermitido('http://127.0.0.1/')).toBe(false)
    expect(hostPermitido('http://[::1]/')).toBe(false)
    // 0.0.0.0/8 y `::` (sin especificar): en Linux, conectar ahí es conectar a loopback.
    expect(hostPermitido('http://0.0.0.0/')).toBe(false)
    expect(hostPermitido('http://0/')).toBe(false)
    expect(hostPermitido('http://[::]/')).toBe(false)
  })

  it('rechaza los tres rangos privados IPv4 y su equivalente IPv6 (fc00::/7, ULA)', () => {
    expect(hostPermitido('http://10.1.2.3/')).toBe(false)
    expect(hostPermitido('http://172.16.0.1/')).toBe(false)
    expect(hostPermitido('http://172.31.255.255/')).toBe(false)
    expect(hostPermitido('http://192.168.0.1/')).toBe(false)
    expect(hostPermitido('http://[fc00::1]/')).toBe(false)
    expect(hostPermitido('http://[fdff::1]/')).toBe(false)
    // Fuera de los rangos: no debe rechazarse por confundirlo con el privado.
    expect(hostPermitido('http://172.32.0.1/')).toBe(true)
    expect(hostPermitido('http://[fe00::1]/')).toBe(true)
  })

  it('rechaza link-local, incluida la dirección de metadata de la nube', () => {
    expect(hostPermitido('http://169.254.169.254/latest/meta-data')).toBe(false)
    expect(hostPermitido('http://[fe80::1]/')).toBe(false)
  })

  it('rechaza un IPv4 escrito en decimal, octal o hexadecimal', () => {
    // `new URL(...).hostname` ya los normaliza a la forma con puntos (estándar WHATWG);
    // este test protege ese supuesto, no una conversión propia de este archivo.
    expect(hostPermitido('http://2130706433/')).toBe(false) // 127.0.0.1 en decimal
    expect(hostPermitido('http://017700000001/')).toBe(false) // 127.0.0.1 en octal
    expect(hostPermitido('http://0x7f000001/')).toBe(false) // 127.0.0.1 en hex
    expect(hostPermitido('http://127.1/')).toBe(false) // 127.0.0.1, forma abreviada
    expect(hostPermitido('http://2852039166/')).toBe(false) // 169.254.169.254 en decimal
  })

  it('rechaza un IPv4 mapeado en IPv6', () => {
    // El bypass real: `::ffff:127.0.0.1` es loopback por otro camino, y a diferencia
    // del caso anterior, la URL lo normaliza a hex comprimido (`::ffff:7f00:1`), no a
    // la forma con puntos — hay que deshacer eso para reconocerlo.
    expect(hostPermitido('http://[::ffff:127.0.0.1]/')).toBe(false)
    expect(hostPermitido('http://[::ffff:10.0.0.5]/')).toBe(false)
    expect(hostPermitido('http://[::ffff:169.254.169.254]/')).toBe(false)
  })

  it('rechaza un IPv4 traducido (::ffff:0:a.b.c.d, RFC 6052/NAT64) y compatible (::a.b.c.d, RFC 4291)', () => {
    // Dos formas más de embeber un IPv4 en IPv6, cada una normalizada por `URL` a un
    // hex comprimido distinto del mapeado de arriba.
    expect(hostPermitido('http://[::ffff:0:127.0.0.1]/')).toBe(false)
    expect(hostPermitido('http://[::127.0.0.1]/')).toBe(false)
    expect(hostPermitido('http://[::10.0.0.5]/')).toBe(false)
  })

  it('rechaza el CGNAT (100.64.0.0/10), incluida la metadata de Alibaba Cloud', () => {
    expect(hostPermitido('http://100.64.0.1/')).toBe(false)
    expect(hostPermitido('http://100.100.100.200/')).toBe(false)
    // Fuera del rango (/10 es hasta 100.127.x.x): no debe rechazarse por confundirlo.
    expect(hostPermitido('http://100.128.0.1/')).toBe(true)
    expect(hostPermitido('http://100.63.255.255/')).toBe(true)
  })

  it('rechaza 192.0.0.0/24, incluida la metadata de Oracle Cloud', () => {
    expect(hostPermitido('http://192.0.0.1/')).toBe(false)
    expect(hostPermitido('http://192.0.0.192/')).toBe(false)
    // Fuera del /24: 192.0.1.x no es el mismo rango.
    expect(hostPermitido('http://192.0.1.1/')).toBe(true)
  })

  it('rechaza 240.0.0.0/4 (clase E) y 255.255.255.255 (broadcast)', () => {
    expect(hostPermitido('http://240.0.0.1/')).toBe(false)
    expect(hostPermitido('http://255.255.255.255/')).toBe(false)
    // El borde de abajo de la clase E es multicast, no una dirección pública: el último
    // unicast normal antes de los dos rangos es 223.255.255.255.
    expect(hostPermitido('http://223.255.255.255/')).toBe(true)
  })

  it('rechaza el multicast (224.0.0.0/4)', () => {
    // No sirve un recurso HTTP unicast, así que no es un SSRF clásico; se rechaza por la
    // misma regla que el resto — lo que no es una dirección pública normal no se pide en
    // nombre de un dueño — y porque una lista de rangos con un hueco invita a asumir que
    // no hay más huecos.
    expect(hostPermitido('http://224.0.0.1/')).toBe(false)
    expect(hostPermitido('http://239.255.255.255/')).toBe(false)
    expect(hostPermitido('http://223.255.255.255/')).toBe(true)
  })

  it('rechaza fec0::/10 (site-local, obsoleta pero enrutable donde esté configurada)', () => {
    expect(hostPermitido('http://[fec0::1]/')).toBe(false)
    expect(hostPermitido('http://[feff::1]/')).toBe(false)
    // fe00::/9 (antes de fe80) no es site-local ni link-local: sigue permitido.
    expect(hostPermitido('http://[fe00::1]/')).toBe(true)
  })

  it('rechaza "localhost.localdomain", el nombre que /etc/hosts apunta a 127.0.0.1 en varias distros', () => {
    expect(hostPermitido('http://localhost.localdomain/')).toBe(false)
  })

  it('rechaza cualquier esquema que no sea http/https', () => {
    // El caso real: un `Location:` de redirección con `data:` no tiene host —esta
    // comprobación de host nunca lo vería—, y `fetch` sí sabe descargarlo.
    expect(hostPermitido('data:application/pdf;base64,AAAA')).toBe(false)
    expect(hostPermitido('file:///etc/passwd')).toBe(false)
    expect(hostPermitido('ftp://ej.com/g.pdf')).toBe(false)
  })

  it('no resuelve DNS: un nombre público es una decisión, no un descuido', () => {
    // Documentado en el comentario de `normalizarHost`: si ese nombre resolviera en la
    // práctica a una IP interna, esta comprobación no lo vería. Resolverlo abriría una
    // carrera entre esta comprobación y la petición real.
    expect(hostPermitido('http://un-nombre-cualquiera.example/')).toBe(true)
  })

  it('rechaza lo que no es una URL', () => {
    expect(hostPermitido('no-es-una-url')).toBe(false)
  })
})

describe('descargarSeguro', () => {
  it('sigue una redirección legítima, devuelve la respuesta final y no llama de más', async () => {
    const fetchMock = vi.fn(async () => {
      if (fetchMock.mock.calls.length === 1) {
        return new Response(null, { status: 302, headers: { location: 'https://ej.com/final.pdf' } })
      }
      return new Response('ok', { status: 200 })
    })
    vi.stubGlobal('fetch', fetchMock)
    const descarga = await descargarSeguro('https://ej.com/inicial.pdf', 'la prueba')
    expect(await respuesta(descarga).text()).toBe('ok')
    // Exactamente dos: la URL inicial y el destino de su redirección, ni una de más.
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('no sigue una redirección hacia la red interna: el segundo salto nunca se pide', async () => {
    const fetchMock = vi.fn(async () =>
      new Response(null, { status: 302, headers: { location: 'http://169.254.169.254/latest/meta-data' } }),
    )
    vi.stubGlobal('fetch', fetchMock)
    expect(await descargarSeguro('https://ej.com/redirige.pdf', 'la prueba')).toEqual({ ok: false, motivo: 'url prohibida' })
    // La comprobación de host corre antes de cada salto: si esto fuera 2, se habría
    // llegado a pedir la dirección de metadata, que es justo lo que hay que impedir.
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('no sigue una redirección hacia un esquema sin host (data:)', async () => {
    const fetchMock = vi.fn(async () =>
      new Response(null, { status: 302, headers: { location: 'data:application/pdf;base64,AAAA' } }),
    )
    vi.stubGlobal('fetch', fetchMock)
    expect(await descargarSeguro('https://ej.com/redirige.pdf', 'la prueba')).toEqual({ ok: false, motivo: 'url prohibida' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('cancela el cuerpo de la redirección: no deja el socket colgando', async () => {
    const stream = new ReadableStream()
    const cancelSpy = vi.spyOn(stream, 'cancel')
    const fetchMock = vi.fn(async () => {
      if (fetchMock.mock.calls.length === 1) {
        return new Response(stream, { status: 302, headers: { location: 'https://ej.com/final.pdf' } })
      }
      return new Response('ok', { status: 200 })
    })
    vi.stubGlobal('fetch', fetchMock)
    await descargarSeguro('https://ej.com/redirige.pdf', 'la prueba')
    // Una sola vez: la del único 3xx de esta cadena, no una por cada salto restante.
    expect(cancelSpy).toHaveBeenCalledTimes(1)
  })

  it('no lanza si el cuerpo del 3xx ya está "errored" cuando se cancela (arreglo #2)', async () => {
    // El caso real: la señal compartida de tiempo puede vencer entre que llegan los
    // headers del 3xx y este `cancel()`, o la conexión se corta sola — el stream queda
    // "errored" por su cuenta y `cancel()` sobre un stream así devuelve la promesa
    // RECHAZADA con ese mismo error (WHATWG Streams). Antes de este arreglo ese rechazo
    // salía por encima de `descargarSeguro`, que promete no lanzar nunca. El test de
    // cancelación de arriba usa un stream sano, por eso no lo vio.
    const fetchMock = vi.fn(async () => {
      if (fetchMock.mock.calls.length === 1) {
        const stream = new ReadableStream({
          start(controller) {
            controller.error(new Error('la conexión se cortó justo ahí'))
          },
        })
        return new Response(stream, { status: 302, headers: { location: 'https://ej.com/final.pdf' } })
      }
      return new Response('ok', { status: 200 })
    })
    vi.stubGlobal('fetch', fetchMock)
    const descarga = await descargarSeguro('https://ej.com/redirige.pdf', 'la prueba')
    // No lanzó, y siguió la redirección con normalidad: el rechazo del cancel() se
    // sostiene adentro, no interrumpe la cadena.
    expect(await respuesta(descarga).text()).toBe('ok')
  })

  it('rechaza un host interno antes de tocar la red', async () => {
    const fetchMock = fetchQueNuncaDeberiaLlamarse()
    expect(await descargarSeguro('http://127.0.0.1/', 'la prueba')).toEqual({ ok: false, motivo: 'url prohibida' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('una respuesta que no es ok dice su status', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('no', { status: 500 })))
    expect(await descargarSeguro('https://ej.com/muerto.pdf', 'la prueba')).toEqual({ ok: false, motivo: 'http 500' })
  })

  it('si la red falla dice «cortada», sin lanzar', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('dns') }))
    expect(await descargarSeguro('https://ej.com/inalcanzable.pdf', 'la prueba')).toEqual({ ok: false, motivo: 'cortada' })
  })

  it('si el destino de la redirección no se puede parsear dice «redirecciones», sin lanzar', async () => {
    // El origen es de un tercero: manda lo que quiera en `Location:`. `http://[` es
    // sintácticamente un IPv6 sin cerrar — `new URL()` lanza `TypeError` al intentar
    // parsearlo, y antes de este arreglo esa excepción salía por encima de esta función.
    const fetchMock = vi.fn(async () =>
      new Response(null, { status: 302, headers: { location: 'http://[' } }),
    )
    vi.stubGlobal('fetch', fetchMock)
    expect(await descargarSeguro('https://ej.com/redirige.pdf', 'la prueba')).toEqual({ ok: false, motivo: 'redirecciones' })
    // No hay segundo salto: el destino ni siquiera llegó a convertirse en una URL.
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})

/**
 * Un cuerpo que entrega `trozos` pedazos de un byte, esperando `cada` ms (del reloj falso)
 * antes de cada uno. Con `quietoTrasElPrimero`, después del primero no entrega nada más: el
 * origen que se queda quieto.
 */
function cuerpoLento(trozos: number, cada: number, quietoTrasElPrimero = false): ReadableStream<Uint8Array> {
  let entregados = 0
  return new ReadableStream<Uint8Array>(
    {
      async pull(salida) {
        if (quietoTrasElPrimero && entregados === 1) return new Promise<void>(() => {})
        await new Promise((seguir) => setTimeout(seguir, cada))
        entregados++
        salida.enqueue(new Uint8Array([entregados]))
        if (entregados === trozos) salida.close()
      },
    },
    { highWaterMark: 0 },
  )
}

function servir(cuerpo: ReadableStream<Uint8Array> | null) {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(cuerpo, { status: 200 })))
}

describe('los plazos de descargarSeguro', () => {
  it('un origen que no contesta corta a los treinta segundos con «sin respuesta»', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(() => {})))
    const descarga = descargarSeguro('https://ej.com/v.mp4', 'la prueba', Date.now() + 200_000)
    await vi.advanceTimersByTimeAsync(PLAZO_RESPUESTA_MS)
    expect(await descarga).toEqual({ ok: false, motivo: 'sin respuesta' })
  })

  it('un archivo que baja parejo no se corta aunque tarde mucho más que treinta segundos', async () => {
    // El caso de los videos de Drive del 2026-10-21: con treinta segundos para todo, morían a
    // medio cuerpo. Seis trozos cada veinte segundos son dos minutos de descarga.
    vi.useFakeTimers()
    servir(cuerpoLento(6, 20_000))
    const response = respuesta(await descargarSeguro('https://ej.com/v.mp4', 'la prueba', Date.now() + 200_000))
    const lectura = leerConTope(response, 100, 'https://ej.com/v.mp4', 'la prueba')
    await vi.advanceTimersByTimeAsync(6 * 20_000)
    const leido = await lectura
    expect('blob' in leido && leido.blob.size).toBe(6)
  })

  it('un archivo que deja de llegar se corta con «estancada»', async () => {
    vi.useFakeTimers()
    servir(cuerpoLento(Infinity, 1_000, true))
    const response = respuesta(await descargarSeguro('https://ej.com/v.mp4', 'la prueba', Date.now() + 200_000))
    const lectura = leerConTope(response, 100, 'https://ej.com/v.mp4', 'la prueba')
    vi.spyOn(console, 'error').mockImplementation(() => {})
    await vi.advanceTimersByTimeAsync(1_000 + PLAZO_QUIETO_MS)
    expect(await lectura).toEqual({ motivo: 'estancada' })
  })

  it('el tope de quien llama corta aunque el archivo siga llegando, con «sin tiempo»', async () => {
    vi.useFakeTimers()
    servir(cuerpoLento(10, 20_000))
    const response = respuesta(await descargarSeguro('https://ej.com/v.mp4', 'la prueba', Date.now() + 50_000))
    const lectura = leerConTope(response, 100, 'https://ej.com/v.mp4', 'la prueba')
    vi.spyOn(console, 'error').mockImplementation(() => {})
    await vi.advanceTimersByTimeAsync(50_000)
    expect(await lectura).toEqual({ motivo: 'sin tiempo' })
  })

  it('el rato en que nadie lee no cuenta como quieto', async () => {
    // El lote puede tener la respuesta abierta mientras espera su cupo de memoria: esa pausa
    // no es culpa del origen y no puede cortarlo.
    vi.useFakeTimers()
    servir(new Response('hola').body)
    const response = respuesta(await descargarSeguro('https://ej.com/v.mp4', 'la prueba', Date.now() + 200_000))
    await vi.advanceTimersByTimeAsync(PLAZO_QUIETO_MS * 2)
    expect(await response.text()).toBe('hola')
  })

  it('con el tope ya pasado no toca la red', async () => {
    const fetchMock = fetchQueNuncaDeberiaLlamarse()
    expect(await descargarSeguro('https://ej.com/v.mp4', 'la prueba', Date.now() - 1)).toEqual({ ok: false, motivo: 'sin tiempo' })
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('leerConTope', () => {
  it('lo que pasa del tope se corta con «muy grande»', async () => {
    const leido = await leerConTope(new Response(new Uint8Array(11)), 10, 'https://ej.com/v.mp4', 'la prueba')
    expect(leido).toEqual({ motivo: 'muy grande' })
  })

  it('un cuerpo vacío es «vacía»', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(await leerConTope(new Response(new Uint8Array(0)), 10, 'https://ej.com/v.mp4', 'la prueba')).toEqual({ motivo: 'vacía' })
    expect(await leerConTope(new Response(null), 10, 'https://ej.com/v.mp4', 'la prueba')).toEqual({ motivo: 'vacía' })
  })
})
