import { afterEach, describe, expect, it, vi } from 'vitest'
import type { SocialAccount } from '@/db'
import { COMENTARIO_AUSENTE } from './comentarista'
import { normalizeThreadsConversation, threadsComentarista } from './threads'
import { estadoInicial, respuestaDelDueno } from './ventana'

const CUENTA = { id: 'a1', externalId: '2600000000000001', handle: 'vicente', accessToken: 'cifrado' } as unknown as SocialAccount

/** Lo que conteste `responder` según la llamada, con las urls y los cuerpos pedidos en orden. */
function stubThreads(responder: (n: number) => { status?: number; body: unknown }) {
  const pedidos: Array<{ url: string; cuerpo: string | null }> = []
  vi.stubGlobal('fetch', (url: string, init?: RequestInit) => {
    const { status = 200, body } = responder(pedidos.length)
    pedidos.push({ url: String(url), cuerpo: init?.body ? String(init.body) : null })
    return Promise.resolve(new Response(typeof body === 'string' ? body : JSON.stringify(body), { status }))
  })
  return pedidos
}

afterEach(() => {
  vi.unstubAllGlobals()
})

const POST = '1801'

describe('normalizeThreadsConversation', () => {
  const conversacion = [
    { id: 'c1', text: '¿Dónde lo compraste?', username: 'alguien', timestamp: '2026-11-04T10:00:00+0000', replied_to: { id: POST } },
    { id: 'c2', text: 'Gracias a todos', username: 'vicente', timestamp: '2026-11-04T11:00:00+0000', replied_to: { id: POST }, is_reply_owned_by_me: true },
    { id: 'r1', text: 'En la feria', username: 'vicente', replied_to: { id: 'c1' }, is_reply_owned_by_me: true },
    { id: 'r2', text: 'yo también quiero', username: 'otra', replied_to: { id: 'c1' } },
    { id: 'c3', text: 'feo', username: 'troll', replied_to: { id: POST }, hide_status: 'HIDDEN' },
  ]

  it('los comentarios son las respuestas directas al post, con las suyas adentro', () => {
    const leidos = normalizeThreadsConversation(conversacion, POST, CUENTA)
    expect(leidos.map((c) => c.externalId)).toEqual(['c1', 'c2'])
    expect(leidos[0]).toMatchObject({
      postExternalId: POST,
      author: '@alguien',
      authorExternalId: null,
      text: '¿Dónde lo compraste?',
    })
    expect(leidos[0]!.publishedAt.toISOString()).toBe('2026-11-04T10:00:00.000Z')
    expect(leidos[0]!.respuestas).toEqual([
      { externalId: 'r1', author: '@vicente', authorExternalId: '2600000000000001', text: 'En la feria' },
      { externalId: 'r2', author: '@otra', authorExternalId: null, text: 'yo también quiero' },
    ])
  })

  it('lo del propio dueño se reconoce: su comentario no entra a la cola y su respuesta lo saca', () => {
    const [c1, c2] = normalizeThreadsConversation(conversacion, POST, CUENTA)
    expect(estadoInicial(c2!.authorExternalId, CUENTA.externalId)).toBe('propio')
    expect(estadoInicial(c1!.authorExternalId, CUENTA.externalId)).toBe('pendiente')
    expect(respuestaDelDueno(c1!.respuestas, CUENTA)?.externalId).toBe('r1')
  })

  it('lo que Threads ocultó no entra, y sin fecha usa la del descubrimiento', () => {
    const antes = Date.now()
    const [c] = normalizeThreadsConversation([{ id: 'x', replied_to: { id: POST } }], POST, CUENTA)
    expect(c!.text).toBe('')
    expect(c!.publishedAt.getTime()).toBeGreaterThanOrEqual(antes)
  })
})

describe('threadsComentarista.listar', () => {
  it('pide la conversación del post y sigue el cursor hasta una página vacía', async () => {
    const pedidos = stubThreads((n) =>
      n === 0
        ? { body: { data: [{ id: 'c1', replied_to: { id: POST } }], paging: { cursors: { after: 'CUR' } } } }
        : { body: { data: [], paging: { cursors: { after: 'CUR2' } } } },
    )
    const leidos = await threadsComentarista.listar(CUENTA, 'TOKEN', POST)
    expect(leidos.map((c) => c.externalId)).toEqual(['c1'])
    expect(pedidos).toHaveLength(2)
    expect(pedidos[0]!.url).toContain(`/${POST}/conversation?`)
    expect(pedidos[0]!.url).toContain('reverse=false')
    expect(new URL(pedidos[1]!.url).searchParams.get('after')).toBe('CUR')
  })

  it('se corta en cinco páginas aunque Threads siga ofreciendo cursor', async () => {
    const pedidos = stubThreads((n) => ({
      body: { data: [{ id: `c${n}`, replied_to: { id: POST } }], paging: { next: `https://graph.threads.net/p${n + 1}` } },
    }))
    const leidos = await threadsComentarista.listar(CUENTA, 'TOKEN', POST)
    expect(pedidos).toHaveLength(5)
    expect(leidos).toHaveLength(5)
  })
})

describe('threadsComentarista.responder', () => {
  it('crea un contenedor de texto que responde al comentario y lo publica', async () => {
    const pedidos = stubThreads((n) => ({ body: { id: n === 0 ? 'contenedor-1' : 'respuesta-1' } }))
    const id = await threadsComentarista.responder(CUENTA, 'TOKEN', 'c1', '  ¡Gracias!  ')
    expect(id).toBe('respuesta-1')
    expect(pedidos[0]!.url).toBe('https://graph.threads.net/v1.0/2600000000000001/threads')
    const contenedor = new URLSearchParams(pedidos[0]!.cuerpo!)
    expect(contenedor.get('media_type')).toBe('TEXT')
    expect(contenedor.get('reply_to_id')).toBe('c1')
    expect(contenedor.get('text')).toBe('¡Gracias!')
    expect(pedidos[1]!.url).toBe('https://graph.threads.net/v1.0/2600000000000001/threads_publish')
    expect(new URLSearchParams(pedidos[1]!.cuerpo!).get('creation_id')).toBe('contenedor-1')
  })

  it('recorta a los 500 caracteres de Threads', async () => {
    const pedidos = stubThreads((n) => ({ body: { id: `id-${n}` } }))
    await threadsComentarista.responder(CUENTA, 'TOKEN', 'c1', 'a'.repeat(600))
    expect(new URLSearchParams(pedidos[0]!.cuerpo!).get('text')).toHaveLength(500)
    expect(threadsComentarista.limiteTexto).toBe(500)
  })

  it('el código 100 al crear el contenedor es la respuesta que ya no está', async () => {
    stubThreads(() => ({ status: 400, body: { error: { code: 100, message: 'Invalid reply_to_id' } } }))
    await expect(threadsComentarista.responder(CUENTA, 'TOKEN', 'c1', 'hola')).rejects.toThrow(COMENTARIO_AUSENTE)
  })

  it('otro rechazo, o uno al publicar, es el error genérico de la red', async () => {
    stubThreads(() => ({ status: 400, body: { error: { code: 10, message: 'Permission denied' } } }))
    await expect(threadsComentarista.responder(CUENTA, 'TOKEN', 'c1', 'hola')).rejects.toThrow(/^Threads 400:/)

    stubThreads((n) => (n === 0 ? { body: { id: 'contenedor-1' } } : { status: 400, body: { error: { code: 100 } } }))
    await expect(threadsComentarista.responder(CUENTA, 'TOKEN', 'c1', 'hola')).rejects.toThrow(/^Threads 400:/)
  })
})
