import { afterEach, describe, expect, it, vi } from 'vitest'
import type { SocialAccount } from '@/db'

vi.mock('@/lib/ajustes', () => ({ leerAjuste: vi.fn(), guardarAjuste: vi.fn(), borrarAjuste: vi.fn() }))

const { normalizeTikTokComments, tiktokComentarista } = await import('./tiktok')
const { estadoInicial, respuestaDelDueno } = await import('./ventana')

// El id de la fila es el de la app de publicar; el de la app de TikTok for Business va en el token.
const CUENTA = { id: 'a1', network: 'tiktok', externalId: 'open-publicar', handle: 'Vicente', accessToken: 'cifrado' } as unknown as SocialAccount
const TOKEN = JSON.stringify({ openId: 'open-business', token: 'act.123' })
const VIDEO = '7430000000000000001'

/** Lo que conteste TikTok según la llamada, con las urls, cabeceras y cuerpos pedidos en orden. */
function stubTikTok(responder: (n: number) => { status?: number; body: unknown }) {
  const pedidos: Array<{ url: string; headers: Record<string, string>; cuerpo: string | null }> = []
  vi.stubGlobal('fetch', (url: string, init?: RequestInit) => {
    const { status = 200, body } = responder(pedidos.length)
    pedidos.push({
      url: String(url),
      headers: (init?.headers ?? {}) as Record<string, string>,
      cuerpo: init?.body ? String(init.body) : null,
    })
    return Promise.resolve(new Response(typeof body === 'string' ? body : JSON.stringify(body), { status }))
  })
  return pedidos
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('normalizeTikTokComments', () => {
  const comentarios = [
    {
      comment_id: '111',
      video_id: VIDEO,
      text: '¿Qué cámara usas?',
      username: 'alguien',
      display_name: 'Alguien',
      unique_identifier: 'uid-alguien',
      create_time: '1793900000',
      status: 'PUBLIC',
      owner: false,
      reply_list: [
        { comment_id: 222, text: 'Una Sony', username: 'vicente', owner: true },
        { comment_id: 223, text: 'yo también quiero saber', username: 'otra', unique_identifier: 'uid-otra' },
      ],
    },
    { comment_id: '112', text: 'Gracias a todos', username: 'vicente', owner: true, create_time: '1793900100' },
    { comment_id: '113', text: 'respuesta suelta', parent_comment_id: '111' },
    { comment_id: '114', text: 'feo', status: 'HIDDEN' },
  ]

  it('los de primer nivel, con sus respuestas, el autor con @ y la fecha en segundos', () => {
    const leidos = normalizeTikTokComments(comentarios, VIDEO, CUENTA)
    expect(leidos.map((c) => c.externalId)).toEqual(['111', '112'])
    expect(leidos[0]).toMatchObject({
      postExternalId: VIDEO,
      author: '@alguien',
      authorExternalId: 'uid-alguien',
      text: '¿Qué cámara usas?',
    })
    expect(leidos[0]!.publishedAt.getTime()).toBe(1793900000 * 1000)
    expect(leidos[0]!.respuestas).toEqual([
      { externalId: '222', author: '@vicente', authorExternalId: 'open-publicar', text: 'Una Sony' },
      { externalId: '223', author: '@otra', authorExternalId: 'uid-otra', text: 'yo también quiero saber' },
    ])
  })

  it('lo del dueño lleva el id de la fila: su comentario no entra a la cola y su respuesta lo saca', () => {
    const [c1, c2] = normalizeTikTokComments(comentarios, VIDEO, CUENTA)
    expect(estadoInicial(c2!.authorExternalId, CUENTA.externalId)).toBe('propio')
    expect(estadoInicial(c1!.authorExternalId, CUENTA.externalId)).toBe('pendiente')
    expect(respuestaDelDueno(c1!.respuestas, CUENTA)?.externalId).toBe('222')
  })

  it('sin usuario, el nombre visible; sin fecha, la del descubrimiento', () => {
    const antes = Date.now()
    const [c] = normalizeTikTokComments([{ comment_id: 9, display_name: 'Sin Arroba' }], VIDEO, CUENTA)
    expect(c!.author).toBe('Sin Arroba')
    expect(c!.text).toBe('')
    expect(c!.publishedAt.getTime()).toBeGreaterThanOrEqual(antes)
  })
})

describe('tiktokComentarista.listar', () => {
  it('pide los comentarios públicos del video con el id y el token de la app de TikTok for Business', async () => {
    const pedidos = stubTikTok(() => ({
      body: { code: 0, message: 'OK', data: { comments: [{ comment_id: '111', text: 'hola' }], has_more: false, cursor: 1 } },
    }))
    const leidos = await tiktokComentarista.listar(CUENTA, TOKEN, VIDEO)
    expect(leidos.map((c) => c.externalId)).toEqual(['111'])
    const url = new URL(pedidos[0]!.url)
    expect(url.origin + url.pathname).toBe('https://business-api.tiktok.com/open_api/v1.3/business/comment/list/')
    expect(url.searchParams.get('business_id')).toBe('open-business')
    expect(url.searchParams.get('video_id')).toBe(VIDEO)
    expect(url.searchParams.get('include_replies')).toBe('true')
    expect(url.searchParams.get('status')).toBe('PUBLIC')
    expect(pedidos[0]!.headers['Access-Token']).toBe('act.123')
  })

  it('sigue el cursor mientras haya más, y para en la quinta página', async () => {
    const pedidos = stubTikTok((n) => ({
      body: { code: 0, data: { comments: [{ comment_id: `c${n}` }], has_more: true, cursor: (n + 1) * 30 } },
    }))
    const leidos = await tiktokComentarista.listar(CUENTA, TOKEN, VIDEO)
    expect(pedidos).toHaveLength(5)
    expect(pedidos.map((p) => new URL(p.url).searchParams.get('cursor'))).toEqual(['0', '30', '60', '90', '120'])
    expect(leidos).toHaveLength(5)
  })

  it('un código distinto de cero es un fallo, aunque el HTTP sea 200', async () => {
    stubTikTok(() => ({ body: { code: 40001, message: 'No permission', data: {} } }))
    await expect(tiktokComentarista.listar(CUENTA, TOKEN, VIDEO)).rejects.toThrow('40001')
  })
})

describe('tiktokComentarista.responder', () => {
  it('responde con el video, el comentario y el texto, y devuelve el id de la respuesta', async () => {
    const pedidos = stubTikTok(() => ({ body: { code: 0, data: { comment_id: 333, parent_comment_id: '111' } } }))
    const id = await tiktokComentarista.responder(CUENTA, TOKEN, '111', '¡Gracias!', VIDEO)
    expect(id).toBe('333')
    expect(pedidos[0]!.url).toBe('https://business-api.tiktok.com/open_api/v1.3/business/comment/reply/create/')
    expect(JSON.parse(pedidos[0]!.cuerpo!)).toEqual({
      business_id: 'open-business',
      video_id: VIDEO,
      comment_id: '111',
      text: '¡Gracias!',
    })
  })

  it('sin el video no hay a qué responder, y no llama a TikTok', async () => {
    const pedidos = stubTikTok(() => ({ body: { code: 0, data: {} } }))
    await expect(tiktokComentarista.responder(CUENTA, TOKEN, '111', 'hola')).rejects.toThrow('video')
    expect(pedidos).toHaveLength(0)
  })

  it('recorta al tope de TikTok', async () => {
    const pedidos = stubTikTok(() => ({ body: { code: 0, data: { comment_id: '1' } } }))
    await tiktokComentarista.responder(CUENTA, TOKEN, '111', 'a'.repeat(1500), VIDEO)
    expect([...JSON.parse(pedidos[0]!.cuerpo!).text].length).toBeLessThanOrEqual(tiktokComentarista.limiteTexto)
  })
})
