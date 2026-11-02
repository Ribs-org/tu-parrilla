import { afterEach, describe, expect, it, vi } from 'vitest'
import { clienteDeGithub, clienteGithub } from './github'

// El cliente de GitHub con un `fetch` falso: ninguna prueba abre un issue de verdad.

type Pedido = { url: string; init: RequestInit; cuerpo: Record<string, unknown> }

function falso(respuestas: Array<(p: Pedido) => Response>) {
  const pedidos: Pedido[] = []
  const pedir = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    const pedido = { url: String(url), init: init ?? {}, cuerpo: JSON.parse(String(init?.body ?? '{}')) }
    pedidos.push(pedido)
    const responder = respuestas.shift()
    if (!responder) throw new Error('github.test: un pedido de más')
    return responder(pedido)
  })
  return { pedidos, pedir: pedir as unknown as typeof fetch }
}

const creada = () => new Response('{}', { status: 201 })
const yaEstaba = () => new Response('{"message":"Validation Failed"}', { status: 422 })
const issue = () => new Response(JSON.stringify({ number: 301, html_url: 'https://github.com/Ribs-org/tu-parrilla/issues/301' }), { status: 201 })

const ISSUE = { titulo: 'Sugerencia · Una idea: x', cuerpo: '## Qué pidió', etiquetas: ['sugerencia', 'sugerencia: idea'] }

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('el cliente de GitHub', () => {
  it('crea las etiquetas que faltan, abre el issue con ellas y devuelve su número', async () => {
    const { pedidos, pedir } = falso([creada, yaEstaba, issue])
    const cliente = clienteDeGithub({ token: 'tok-secreto', repo: 'Ribs-org/tu-parrilla', pedir })
    expect(await cliente.crearIssue(ISSUE)).toEqual({ numero: 301, url: 'https://github.com/Ribs-org/tu-parrilla/issues/301' })

    expect(pedidos.map((p) => p.url)).toEqual([
      'https://api.github.com/repos/Ribs-org/tu-parrilla/labels',
      'https://api.github.com/repos/Ribs-org/tu-parrilla/labels',
      'https://api.github.com/repos/Ribs-org/tu-parrilla/issues',
    ])
    expect(pedidos[0]!.cuerpo).toMatchObject({ name: 'sugerencia', color: 'e8621f' })
    expect(pedidos[2]!.cuerpo).toEqual({ title: ISSUE.titulo, body: ISSUE.cuerpo, labels: ISSUE.etiquetas })
    expect((pedidos[2]!.init.headers as Record<string, string>).Authorization).toBe('Bearer tok-secreto')
  })

  it('las etiquetas se crean una sola vez por cliente', async () => {
    const { pedidos, pedir } = falso([creada, creada, issue, issue])
    const cliente = clienteDeGithub({ token: 't', repo: 'a/b', pedir })
    await cliente.crearIssue(ISSUE)
    await cliente.crearIssue(ISSUE)
    expect(pedidos.filter((p) => p.url.endsWith('/labels'))).toHaveLength(2)
  })

  it('una etiqueta que no se pudo crear no tumba el issue: sale sin ella', async () => {
    const { pedidos, pedir } = falso([creada, () => new Response('', { status: 403 }), issue])
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const cliente = clienteDeGithub({ token: 't', repo: 'a/b', pedir })
    await cliente.crearIssue(ISSUE)
    expect(pedidos[2]!.cuerpo.labels).toEqual(['sugerencia'])
  })

  it('si GitHub no abre el issue, lanza con su respuesta y sin el token', async () => {
    const { pedir } = falso([creada, creada, () => new Response('{"message":"Resource not accessible by personal access token"}', { status: 403 })])
    const cliente = clienteDeGithub({ token: 'tok-secreto', repo: 'a/b', pedir })
    const error = await cliente.crearIssue(ISSUE).catch((e: Error) => e)
    expect(error).toBeInstanceOf(Error)
    expect((error as Error).message).toContain('GitHub respondió 403')
    expect((error as Error).message).not.toContain('tok-secreto')
  })

  it('sin token no hay cliente; con un repositorio mal escrito, tampoco', () => {
    vi.stubEnv('SUGERENCIAS_GITHUB_TOKEN', '')
    expect(clienteGithub()).toBeNull()
    vi.stubEnv('SUGERENCIAS_GITHUB_TOKEN', 'tok')
    vi.stubEnv('SUGERENCIAS_REPO', 'https://malo.example/x?y')
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(clienteGithub()).toBeNull()
    vi.stubEnv('SUGERENCIAS_REPO', 'Ribs-org/tu-parrilla')
    expect(clienteGithub()).not.toBeNull()
  })
})
