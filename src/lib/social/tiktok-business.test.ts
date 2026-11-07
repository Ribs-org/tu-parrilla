import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { SocialAccount } from '@/db'

const ajustes = vi.hoisted(() => ({ leerAjuste: vi.fn(), guardarAjuste: vi.fn(), borrarAjuste: vi.fn() }))
vi.mock('@/lib/ajustes', () => ajustes)

const {
  canjearCodigo,
  cifrar,
  claveDeComentarios,
  credencialDeComentarios,
  descifrar,
  desempaquetar,
  necesitaRenovar,
  permisosQueFaltan,
  urlDeAutorizacion,
  vueltaDe,
} = await import('./tiktok-business')
const { tiktokComentariosAbiertoPara } = await import('@/lib/redes-abiertas')

const DUENO = 'owner-1'
const CUENTA = { id: 'acc-1', ownerId: DUENO, network: 'tiktok', externalId: 'open-publicar', accessToken: 'cifrado' } as unknown as SocialAccount
const BASE = 'https://www.tiktok.com/v2/auth/authorize?client_key=abc&scope=comment.list%2Ccomment.list.manage&response_type=code&redirect_uri=https%3A%2F%2Ftu-parrilla.cl%2Fapi%2Fsocial%2Ftiktok%2Fcomentarios%2Fvuelta%2F'

function abrir(para = '1') {
  vi.stubEnv('TIKTOK_BUSINESS_APP_ID', 'app-id')
  vi.stubEnv('TIKTOK_BUSINESS_SECRET', 'app-secret')
  vi.stubEnv('TIKTOK_BUSINESS_AUTORIZACION', BASE)
  vi.stubEnv('TIKTOK_COMENTARIOS_ABIERTO_PARA', para)
}

function stubFetch(responder: (n: number) => unknown) {
  const pedidos: Array<{ url: string; cuerpo: string | null }> = []
  vi.stubGlobal('fetch', (url: string, init?: RequestInit) => {
    const body = responder(pedidos.length)
    pedidos.push({ url: String(url), cuerpo: init?.body ? String(init.body) : null })
    return Promise.resolve(new Response(JSON.stringify(body), { status: 200 }))
  })
  return pedidos
}

const CREDENCIAL = {
  openId: 'open-business',
  accessToken: 'act.viejo',
  refreshToken: 'rft.1',
  expiraEn: new Date(Date.now() + 20 * 3600e3).toISOString(),
  scope: 'comment.list,comment.list.manage',
}

beforeEach(() => {
  vi.stubEnv('AUTH_SECRET', 'secreto-de-prueba-de-al-menos-32-caracteres')
  ajustes.leerAjuste.mockReset()
  ajustes.guardarAjuste.mockReset()
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('tiktokComentariosAbiertoPara', () => {
  it('nace cerrado, y sin la app tampoco abre aunque la bandera diga 1', () => {
    expect(tiktokComentariosAbiertoPara(DUENO)).toBe(false)
    vi.stubEnv('TIKTOK_COMENTARIOS_ABIERTO_PARA', '1')
    expect(tiktokComentariosAbiertoPara(DUENO)).toBe(false)
  })

  it('con la app: 1 para todos, o solo los ids de la lista', () => {
    abrir('1')
    expect(tiktokComentariosAbiertoPara(DUENO)).toBe(true)
    abrir('otro, owner-1')
    expect(tiktokComentariosAbiertoPara(DUENO)).toBe(true)
    expect(tiktokComentariosAbiertoPara('owner-2')).toBe(false)
    expect(tiktokComentariosAbiertoPara(null)).toBe(false)
  })
})

describe('el enlace y la vuelta', () => {
  it('al enlace del portal le suma el state y que TikTok muestre siempre su pantalla', () => {
    const url = urlDeAutorizacion(BASE, 'firmado')
    expect(url.searchParams.get('state')).toBe('firmado')
    expect(url.searchParams.get('disable_auto_auth')).toBe('1')
    expect(url.searchParams.get('client_key')).toBe('abc')
  })

  it('la vuelta es la del enlace del portal, con su barra final; si no la trae, la de la casa', () => {
    expect(vueltaDe(BASE, 'https://x.cl')).toBe('https://tu-parrilla.cl/api/social/tiktok/comentarios/vuelta/')
    expect(vueltaDe('https://www.tiktok.com/v2/auth/authorize?client_key=abc', 'https://x.cl')).toBe(
      'https://x.cl/api/social/tiktok/comentarios/vuelta/',
    )
  })

  it('pide los dos permisos de comentarios', () => {
    expect(permisosQueFaltan('user.info.basic,comment.list,comment.list.manage')).toEqual([])
    expect(permisosQueFaltan('user.info.basic,comment.list')).toEqual(['comment.list.manage'])
    expect(permisosQueFaltan('')).toEqual(['comment.list', 'comment.list.manage'])
  })
})

describe('canjearCodigo', () => {
  it('canjea en tt_user/oauth2/token con la app de TikTok for Business', async () => {
    abrir()
    const pedidos = stubFetch(() => ({
      code: 0,
      data: { access_token: 'act.1', refresh_token: 'rft.1', expires_in: 86400, open_id: 'open-business', scope: 'comment.list' },
    }))
    const credencial = await canjearCodigo('codigo', 'https://tu-parrilla.cl/api/social/tiktok/comentarios/vuelta/')
    expect(pedidos[0]!.url).toBe('https://business-api.tiktok.com/open_api/v1.3/tt_user/oauth2/token/')
    expect(JSON.parse(pedidos[0]!.cuerpo!)).toEqual({
      client_id: 'app-id',
      client_secret: 'app-secret',
      grant_type: 'authorization_code',
      auth_code: 'codigo',
      redirect_uri: 'https://tu-parrilla.cl/api/social/tiktok/comentarios/vuelta/',
    })
    expect(credencial).toMatchObject({ openId: 'open-business', accessToken: 'act.1', refreshToken: 'rft.1', scope: 'comment.list' })
  })

  it('un rechazo de TikTok lanza', async () => {
    abrir()
    stubFetch(() => ({ code: 40102, message: 'auth_code expired' }))
    await expect(canjearCodigo('viejo', 'x')).rejects.toThrow('40102')
  })
})

describe('la credencial guardada', () => {
  it('se guarda cifrada y vuelve igual; un valor ajeno no se lee', () => {
    const valor = cifrar(CREDENCIAL)
    expect(valor).not.toContain('act.viejo')
    expect(descifrar(valor)).toEqual(CREDENCIAL)
    expect(descifrar('basura')).toBeNull()
  })

  it('se renueva con una hora de margen', () => {
    const ahora = Date.now()
    expect(necesitaRenovar(CREDENCIAL, ahora)).toBe(false)
    expect(necesitaRenovar({ ...CREDENCIAL, expiraEn: new Date(ahora + 30 * 60e3).toISOString() }, ahora)).toBe(true)
  })
})

describe('credencialDeComentarios', () => {
  it('cerrado para el dueño, null sin mirar la base', async () => {
    expect(await credencialDeComentarios(CUENTA)).toBeNull()
    expect(ajustes.leerAjuste).not.toHaveBeenCalled()
  })

  it('una cuenta desconectada, o de otra red, no se sondea', async () => {
    abrir()
    expect(await credencialDeComentarios({ ...CUENTA, accessToken: null } as SocialAccount)).toBeNull()
    expect(await credencialDeComentarios({ ...CUENTA, network: 'youtube' } as SocialAccount)).toBeNull()
    expect(ajustes.leerAjuste).not.toHaveBeenCalled()
  })

  it('abierto pero sin activar: null', async () => {
    abrir()
    ajustes.leerAjuste.mockResolvedValue(null)
    expect(await credencialDeComentarios(CUENTA)).toBeNull()
    expect(ajustes.leerAjuste).toHaveBeenCalledWith(DUENO, claveDeComentarios('acc-1'))
  })

  it('vigente: el id de la app de TikTok for Business y el token, sin llamar a TikTok', async () => {
    abrir()
    ajustes.leerAjuste.mockResolvedValue(cifrar(CREDENCIAL))
    const pedidos = stubFetch(() => ({}))
    const token = await credencialDeComentarios(CUENTA)
    expect(desempaquetar(token!)).toEqual({ openId: 'open-business', token: 'act.viejo' })
    expect(pedidos).toHaveLength(0)
  })

  it('por vencer: la renueva, la guarda y devuelve la nueva', async () => {
    abrir()
    ajustes.leerAjuste.mockResolvedValue(cifrar({ ...CREDENCIAL, expiraEn: new Date(Date.now() - 1000).toISOString() }))
    const pedidos = stubFetch(() => ({
      code: 0,
      data: { access_token: 'act.nuevo', refresh_token: 'rft.2', expires_in: 86400, open_id: 'open-business', scope: CREDENCIAL.scope },
    }))
    const token = await credencialDeComentarios(CUENTA)
    expect(pedidos[0]!.url).toBe('https://business-api.tiktok.com/open_api/v1.3/tt_user/oauth2/refresh_token/')
    expect(JSON.parse(pedidos[0]!.cuerpo!)).toMatchObject({ grant_type: 'refresh_token', refresh_token: 'rft.1' })
    expect(desempaquetar(token!).token).toBe('act.nuevo')
    const [dueno, clave, valor] = ajustes.guardarAjuste.mock.calls[0]!
    expect([dueno, clave]).toEqual([DUENO, claveDeComentarios('acc-1')])
    expect(descifrar(valor as string)).toMatchObject({ accessToken: 'act.nuevo', refreshToken: 'rft.2' })
  })
})
