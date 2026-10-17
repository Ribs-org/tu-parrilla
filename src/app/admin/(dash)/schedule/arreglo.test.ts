import { describe, expect, it } from 'vitest'
import { FACEBOOK_REJECTED } from '@/lib/social/publish/facebook'
import { NO_PUBLISH_TOKEN, PUBLISH_NETWORK_ERROR } from '@/lib/social/publish/publisher'
import { TIKTOK_ARCHIVO, TIKTOK_PRIVACIDAD_NO_DISPONIBLE } from '@/lib/social/publish/tiktok'
import { TIKTOK_RECONECTAR } from '@/lib/social/publish/tiktok-creador'
import { YOUTUBE_ONLY_VIDEO } from '@/lib/social/publish/youtube'
import { RECONECTAR_EN, arregloDe } from './arreglo'

const ARCHIVOS = '/admin/schedule/abc?volver=%2Fadmin%2Fschedule#media'

describe('arregloDe', () => {
  it('una cuenta sin conexión se arregla en Los Fierros', () => {
    expect(arregloDe(NO_PUBLISH_TOKEN, ARCHIVOS)).toEqual({ texto: 'Reconectar', href: RECONECTAR_EN })
    expect(arregloDe(TIKTOK_RECONECTAR, ARCHIVOS)).toEqual({ texto: 'Reconectar', href: RECONECTAR_EN })
  })

  it('un archivo que la red no acepta se arregla en los archivos del post', () => {
    expect(arregloDe(TIKTOK_ARCHIVO, ARCHIVOS)).toEqual({ texto: 'Cambiar el archivo', href: ARCHIVOS })
    expect(arregloDe(YOUTUBE_ONLY_VIDEO, ARCHIVOS)).toEqual({ texto: 'Cambiar el archivo', href: ARCHIVOS })
  })

  it('un rechazo sin explicación no ofrece más arreglo que reprogramar', () => {
    expect(arregloDe(FACEBOOK_REJECTED, ARCHIVOS)).toBeNull()
    expect(arregloDe(PUBLISH_NETWORK_ERROR, ARCHIVOS)).toBeNull()
  })

  it('lo que el editor no deja cambiar no se ofrece: las opciones de TikTok no se editan ahí', () => {
    expect(arregloDe(TIKTOK_PRIVACIDAD_NO_DISPONIBLE, ARCHIVOS)).toBeNull()
  })

  it('sin motivo, o con uno que no conoce, no inventa', () => {
    expect(arregloDe(null, ARCHIVOS)).toBeNull()
    expect(arregloDe('Una frase que todavía no existe.', ARCHIVOS)).toBeNull()
  })
})
