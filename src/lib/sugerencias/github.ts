// El cliente de GitHub del libro de sugerencias: abre un issue en el repositorio y, la primera
// vez, crea las etiquetas que le faltan. Solo eso: el token (`SUGERENCIAS_GITHUB_TOKEN`) es uno
// fine-grained con permiso de Issues sobre ese repositorio y nada más.
//
// Es una interfaz para que las pruebas pongan un doble: ninguna prueba abre un issue de verdad.

import { env } from '@/lib/env'
import { ETIQUETAS } from './formato'

export type IssueNuevo = { titulo: string; cuerpo: string; etiquetas: string[] }
export type IssueCreado = { numero: number; url: string }

export type ClienteGithub = { crearIssue(issue: IssueNuevo): Promise<IssueCreado> }

/** Adónde van si nadie dice otra cosa: el repositorio de Tu Parrilla. */
export const REPO_POR_DEFECTO = 'Ribs-org/tu-parrilla'

/** Lo que queda anotado en una sugerencia que no salió porque no hay token. */
export const SIN_TOKEN = 'Sin SUGERENCIAS_GITHUB_TOKEN: queda guardada hasta que lo haya.'

const PLAZO_MS = 10_000

/**
 * El cliente del despliegue, o null si no hay token: entonces las sugerencias se guardan y
 * esperan. Un `SUGERENCIAS_REPO` que no tiene la forma `dueño/repo` también deja null, para no
 * mandar el token a una dirección armada con cualquier cosa.
 */
export function clienteGithub(): ClienteGithub | null {
  const token = env('SUGERENCIAS_GITHUB_TOKEN')
  if (!token) return null
  const repo = env('SUGERENCIAS_REPO') ?? REPO_POR_DEFECTO
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo)) {
    console.error('SUGERENCIAS_REPO no tiene la forma dueño/repo; las sugerencias quedan guardadas.')
    return null
  }
  return clienteDeGithub({ token, repo })
}

/** El cliente con su token y su repositorio, y un `fetch` que las pruebas pueden cambiar. */
export function clienteDeGithub({
  token,
  repo,
  pedir = fetch,
}: {
  token: string
  repo: string
  pedir?: typeof fetch
}): ClienteGithub {
  const listas = new Set<string>()

  function post(ruta: string, cuerpo: unknown): Promise<Response> {
    return pedir(`https://api.github.com/repos/${repo}${ruta}`, {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'tu-parrilla-sugerencias',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify(cuerpo),
      signal: AbortSignal.timeout(PLAZO_MS),
    })
  }

  /**
   * Crea la etiqueta si no existe: 201 es que la creó, 422 que ya estaba. Cualquier otra cosa
   * la deja afuera de este issue en vez de perderlo: un issue sin etiqueta sirve igual.
   */
  async function asegurar(nombre: string): Promise<boolean> {
    if (listas.has(nombre)) return true
    const datos = ETIQUETAS[nombre]
    const r = await post('/labels', { name: nombre, color: datos?.color ?? 'ededed', description: datos?.descripcion ?? '' })
    if (r.status === 201 || r.status === 422) {
      listas.add(nombre)
      return true
    }
    console.error(`GitHub respondió ${r.status} al crear la etiqueta «${nombre}»; el issue sale sin ella.`)
    return false
  }

  return {
    async crearIssue({ titulo, cuerpo, etiquetas }) {
      const conEtiqueta: string[] = []
      for (const nombre of etiquetas) if (await asegurar(nombre)) conEtiqueta.push(nombre)
      const r = await post('/issues', { title: titulo, body: cuerpo, labels: conEtiqueta })
      if (r.status !== 201) {
        // El texto de GitHub dice qué faltó (un permiso, el repositorio); nunca trae el token.
        const detalle = (await r.text().catch(() => '')).slice(0, 200)
        throw new Error(`GitHub respondió ${r.status} al abrir el issue: ${detalle}`)
      }
      const issue = (await r.json()) as { number?: unknown; html_url?: unknown }
      if (typeof issue.number !== 'number' || typeof issue.html_url !== 'string') {
        throw new Error('GitHub abrió el issue pero no devolvió su número')
      }
      return { numero: issue.number, url: issue.html_url }
    },
  }
}
