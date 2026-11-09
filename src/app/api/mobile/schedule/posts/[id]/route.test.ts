import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Usuario } from '@/db'
import { CUERPO_ILEGIBLE } from '@/lib/mobile-api'
import { BORRADO_YA_PUBLICADO } from '@/lib/schedule-api'
import { CONSERVAR, EN_CURSO, POST_NO_EXISTE, YA_SALIO_EN_ALGUNA } from '@/lib/social/publish/editar'

// `@/lib/mobile-api` llega a `@/lib/usuarios` por `publish/batch`, que trae `server-only`
// (no resuelve bajo Vitest). Mismo arreglo que `../../route.test.ts`.
vi.mock('server-only', () => ({}))

const USUARIO: Usuario = {
  id: 'owner-1',
  correo: 'dueno@example.com',
  nombre: null,
  rol: 'usuario',
  zona: 'America/Santiago',
  tema: 'noche',
  sesionVersion: 1,
  invitadoEn: new Date('2026-01-01'),
  primerIngresoEn: new Date('2026-01-01'),
  cocinaDesde: null,
  bodegaBytes: null,
  pushComentariosHasta: null,
  plan: 'gratis',
  planHasta: null,
  planOrigen: null,
  pruebaUsadaEn: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
}

let usuario: Usuario | null = USUARIO
vi.mock('@/lib/mobile-guardia', () => ({ requireMobileUser: async () => usuario }))

const editarPostProgramado = vi.fn()
vi.mock('@/lib/social/publish/editar', async (importOriginal) => {
  const real = await importOriginal<typeof import('@/lib/social/publish/editar')>()
  return { ...real, editarPostProgramado: (...args: unknown[]) => editarPostProgramado(...args) }
})
const borrarPostProgramado = vi.fn()
vi.mock('@/lib/social/publish/borrar', () => ({
  borrarPostProgramado: (...args: unknown[]) => borrarPostProgramado(...args),
}))
const postParaEditarEnElTelefono = vi.fn()
vi.mock('@/lib/editar-movil', () => ({
  postParaEditarEnElTelefono: (...args: unknown[]) => postParaEditarEnElTelefono(...args),
}))

const { DELETE, GET, PATCH } = await import('./route')

const ID = '6f1c2a54-9b1e-4c3d-8f00-0123456789ab'
const URL_POST = `https://tu-parrilla.cl/api/mobile/schedule/posts/${ID}`

function contexto(id = ID) {
  return { params: Promise.resolve({ id }) }
}

function pedir(cuerpo: unknown, metodo = 'PATCH'): Request {
  return new Request(URL_POST, {
    method: metodo,
    headers: { 'content-type': 'application/json' },
    body: typeof cuerpo === 'string' ? cuerpo : JSON.stringify(cuerpo),
  })
}

beforeEach(() => {
  usuario = USUARIO
  editarPostProgramado.mockReset()
  editarPostProgramado.mockResolvedValue({ ok: true })
  borrarPostProgramado.mockReset()
  borrarPostProgramado.mockResolvedValue('borrado')
  postParaEditarEnElTelefono.mockReset()
})

describe('GET /api/mobile/schedule/posts/{id}', () => {
  it('devuelve el post del dueño en su zona', async () => {
    const post = { id: ID, texto: 'Hola', cuando: '2026-11-06T19:00:00-03:00', destinos: [], seConserva: null, bloqueo: null }
    postParaEditarEnElTelefono.mockResolvedValue(post)

    const respuesta = await GET(new Request(URL_POST), contexto())
    expect(respuesta.status).toBe(200)
    expect(await respuesta.json()).toEqual(post)
    expect(postParaEditarEnElTelefono).toHaveBeenCalledWith('owner-1', ID, 'America/Santiago')
  })

  it('uno que no existe, o que es de otro, es 404', async () => {
    postParaEditarEnElTelefono.mockResolvedValue(null)
    const respuesta = await GET(new Request(URL_POST), contexto())
    expect(respuesta.status).toBe(404)
    expect(await respuesta.json()).toEqual({ error: POST_NO_EXISTE })
  })

  it('sin sesión, 401', async () => {
    usuario = null
    expect((await GET(new Request(URL_POST), contexto())).status).toBe(401)
  })
})

describe('PATCH /api/mobile/schedule/posts/{id}', () => {
  it('guarda el texto, la hora nueva y los destinos quitados, y conserva todo lo demás', async () => {
    const cuando = '2030-01-01T13:00:00.000Z'
    const respuesta = await PATCH(pedir({ texto: '  Texto nuevo  ', cuando, quitar: ['destino-2'] }), contexto())

    expect(respuesta.status).toBe(200)
    expect(await respuesta.json()).toEqual({ ok: true })
    expect(editarPostProgramado).toHaveBeenCalledWith(
      'owner-1',
      ID,
      {
        caption: 'Texto nuevo',
        scheduledAt: new Date(cuando),
        cuentas: { quitar: ['destino-2'] },
        media: CONSERVAR,
        portada: CONSERVAR,
        atributos: CONSERVAR,
        regla: CONSERVAR,
      },
      { soloSinPublicar: true },
    )
  })

  it('sin `cuando`, la hora queda como está; sin `quitar`, no se quita nada', async () => {
    await PATCH(pedir({ texto: 'Hola' }), contexto())
    expect(editarPostProgramado.mock.calls[0]![2]).toMatchObject({ scheduledAt: CONSERVAR, cuentas: { quitar: [] } })
  })

  it('un `cuando` ilegible llega como fecha que no se entendió, para la frase de siempre', async () => {
    await PATCH(pedir({ texto: 'Hola', cuando: 'mañana' }), contexto())
    expect(editarPostProgramado.mock.calls[0]![2]).toMatchObject({ scheduledAt: null })
  })

  it('el rechazo sale con la frase del panel, y su código', async () => {
    const casos: Array<[string, number]> = [
      ['El texto excede los 280 caracteres de X.', 400],
      [EN_CURSO, 409],
      [YA_SALIO_EN_ALGUNA, 409],
      [POST_NO_EXISTE, 404],
    ]
    for (const [error, status] of casos) {
      editarPostProgramado.mockResolvedValueOnce({ error })
      const respuesta = await PATCH(pedir({ texto: 'Hola' }), contexto())
      expect(respuesta.status).toBe(status)
      expect(await respuesta.json()).toEqual({ error })
    }
  })

  it('un cuerpo sin texto, con `quitar` raro o ilegible no se entiende', async () => {
    for (const cuerpo of [{ cuando: '2030-01-01T13:00:00Z' }, { texto: 'Hola', quitar: 'destino-1' }, { texto: 'Hola', quitar: [3] }, { texto: 'Hola', cuando: 5 }, '{no es json', 'null']) {
      const respuesta = await PATCH(pedir(cuerpo), contexto())
      expect(respuesta.status).toBe(400)
      expect(await respuesta.json()).toEqual({ error: CUERPO_ILEGIBLE })
    }
    expect(editarPostProgramado).not.toHaveBeenCalled()
  })

  it('un id sin forma de uuid no existe, sin preguntarle a la base', async () => {
    const respuesta = await PATCH(pedir({ texto: 'Hola' }), contexto('no-es-uuid'))
    expect(respuesta.status).toBe(404)
    expect(editarPostProgramado).not.toHaveBeenCalled()
  })

  it('sin sesión, 401', async () => {
    usuario = null
    expect((await PATCH(pedir({ texto: 'Hola' }), contexto())).status).toBe(401)
    expect(editarPostProgramado).not.toHaveBeenCalled()
  })
})

describe('DELETE /api/mobile/schedule/posts/{id}', () => {
  it('borra el post del dueño con la regla del panel', async () => {
    const respuesta = await DELETE(new Request(URL_POST, { method: 'DELETE' }), contexto())
    expect(respuesta.status).toBe(200)
    expect(await respuesta.json()).toEqual({ ok: true })
    expect(borrarPostProgramado).toHaveBeenCalledWith('owner-1', ID)
  })

  it('lo que ya salió no se borra: la frase de siempre, 409', async () => {
    borrarPostProgramado.mockResolvedValue('publicado')
    const respuesta = await DELETE(new Request(URL_POST, { method: 'DELETE' }), contexto())
    expect(respuesta.status).toBe(409)
    expect(await respuesta.json()).toEqual({ error: BORRADO_YA_PUBLICADO })
  })

  it('uno que no existe, o que es de otro, es 404', async () => {
    borrarPostProgramado.mockResolvedValue('no-existe')
    const respuesta = await DELETE(new Request(URL_POST, { method: 'DELETE' }), contexto())
    expect(respuesta.status).toBe(404)
    expect(await respuesta.json()).toEqual({ error: POST_NO_EXISTE })
  })

  it('sin sesión, 401', async () => {
    usuario = null
    expect((await DELETE(new Request(URL_POST, { method: 'DELETE' }), contexto())).status).toBe(401)
    expect(borrarPostProgramado).not.toHaveBeenCalled()
  })
})
