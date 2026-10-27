import { afterEach, describe, expect, it, vi } from 'vitest'
import type { SocialAccount } from '@/db'
import { DIAS_PRIVADO, mandarPrivado, paginaParaPrivado, privadoActivo, tocaPrivado } from './privado'

const AHORA = new Date('2026-09-14T12:00:00.000Z')
const hace = (dias: number) => new Date(AHORA.getTime() - dias * 864e5)

describe('tocaPrivado', () => {
  it('nunca con la bandera apagada', () => {
    expect(tocaPrivado('instagram', hace(1), AHORA, false)).toBe(false)
  })

  it('solo en Instagram y Facebook', () => {
    expect(tocaPrivado('instagram', hace(1), AHORA, true)).toBe(true)
    expect(tocaPrivado('facebook', hace(1), AHORA, true)).toBe(true)
    expect(tocaPrivado('youtube', hace(1), AHORA, true)).toBe(false)
  })

  it('solo dentro de la ventana de Meta', () => {
    expect(tocaPrivado('instagram', hace(DIAS_PRIVADO - 1), AHORA, true)).toBe(true)
    expect(tocaPrivado('instagram', hace(DIAS_PRIVADO + 1), AHORA, true)).toBe(false)
  })
})

describe('privadoActivo', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('apagado sin la bandera; con 1, para todos', () => {
    vi.stubEnv('COMENTARIOS_DM', '')
    expect(privadoActivo('u-1')).toBe(false)
    vi.stubEnv('COMENTARIOS_DM', '1')
    expect(privadoActivo('u-1')).toBe(true)
    expect(privadoActivo(null)).toBe(true)
  })

  it('con una lista de ids, solo para esos', () => {
    vi.stubEnv('COMENTARIOS_DM', 'revisor, otro')
    expect(privadoActivo('revisor')).toBe(true)
    expect(privadoActivo('otro')).toBe(true)
    expect(privadoActivo('u-1')).toBe(false)
    expect(privadoActivo(null)).toBe(false)
  })
})

describe('el privado sale de la página', () => {
  afterEach(() => vi.unstubAllGlobals())

  const cuenta = (network: string) => ({ network, externalId: 'IG_1' }) as unknown as SocialAccount

  it('en Facebook la página es la cuenta misma, con su token', async () => {
    expect(await paginaParaPrivado(cuenta('facebook'), 't-pagina')).toEqual({ id: 'IG_1', token: 't-pagina' })
  })

  it('en Instagram busca la página enlazada y usa su token, no el del usuario', async () => {
    const fetchMock = vi
      .fn<(url: string, init?: RequestInit) => Promise<Response>>()
      .mockResolvedValueOnce(
        Response.json({
          data: [
            { id: 'P_OTRA', access_token: 't-otra', instagram_business_account: { id: 'IG_9' } },
            { id: 'P_1', access_token: 't-p1', instagram_business_account: { id: 'IG_1' } },
          ],
        }),
      )
      .mockResolvedValueOnce(Response.json({ recipient_id: 'r', message_id: 'm-1' }))
    vi.stubGlobal('fetch', fetchMock)
    expect(await mandarPrivado(cuenta('instagram'), 't-usuario', 'C_1', 'Hola')).toBe('m-1')
    expect(String(fetchMock.mock.calls[1]![0])).toContain('/P_1/messages')
    const cuerpo = JSON.parse(String(fetchMock.mock.calls[1]![1]!.body))
    expect(cuerpo).toEqual({ recipient: { comment_id: 'C_1' }, message: { text: 'Hola' }, access_token: 't-p1' })
  })

  it('sin la página enlazada no manda nada', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ data: [] })))
    await expect(mandarPrivado(cuenta('instagram'), 't', 'C_1', 'Hola')).rejects.toThrow(/página/)
  })
})
