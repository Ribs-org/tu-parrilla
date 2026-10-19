import { describe, expect, it } from 'vitest'
import { ayudaDeConexion } from './ayuda-conexion'
import { NO_FACEBOOK_PAGE } from './facebook'
import { NO_INSTAGRAM_ACCOUNT } from './instagram'
import { soloSeRenovo } from './vuelta'

describe('ayudaDeConexion', () => {
  it('Instagram sin página: el porqué, los tres pasos y volver a conectar, letra por letra', () => {
    expect(ayudaDeConexion(NO_INSTAGRAM_ACCOUNT)).toEqual({
      titulo: 'Instagram no se conectó',
      porque:
        'Aceptar los permisos de Meta no basta: Tu Parrilla encuentra tu Instagram a través de una página de Facebook, y Meta no entregó ninguna página tuya con un Instagram enlazado.',
      pasos: [
        'Tu Instagram tiene que ser una cuenta profesional, de creador o de empresa. Se cambia en la configuración de Instagram.',
        'Tiene que estar enlazado a una página de Facebook: en Instagram, en Editar perfil → «Página», conecta tu página o crea una. Enlazar las cuentas en el Centro de cuentas de Meta no sirve para esto.',
        'Al volver a conectar, entra con el Facebook que administra esa página y, cuando Meta pregunte qué compartir con Tu Parrilla, marca esa página y ese Instagram. Si ya lo pasaste sin marcarlos, corrígelo en la configuración de Facebook, en «Integraciones comerciales».',
      ],
      reintentar: { texto: 'Volver a conectar Instagram', href: '/api/social/instagram/connect' },
    })
  })

  it('Facebook sin página: el porqué, los dos pasos y volver a conectar, letra por letra', () => {
    expect(ayudaDeConexion(NO_FACEBOOK_PAGE)).toEqual({
      titulo: 'Facebook no se conectó',
      porque:
        'Tu Parrilla publica en una página de Facebook, no en un perfil personal, y Meta no entregó ninguna página que administre la cuenta con que entraste.',
      pasos: [
        'Si todavía no tienes una página, créala en Facebook, en «Páginas».',
        'Al volver a conectar, entra con la cuenta de Facebook que administra la página y, cuando Meta pregunte qué compartir con Tu Parrilla, márcala.',
      ],
      reintentar: { texto: 'Volver a conectar Facebook', href: '/api/social/facebook/connect' },
    })
  })

  it('las demás frases no traen ayuda: una conexión que salió, otro error, o nada', () => {
    expect(ayudaDeConexion('Instagram conectado.')).toBeNull()
    expect(ayudaDeConexion('La red no devolvió el código de autorización.')).toBeNull()
    expect(ayudaDeConexion(null)).toBeNull()
  })

  it('«Agregar cuenta →» con la de antes, en TikTok: cerrar la sesión y volver, letra por letra', () => {
    expect(ayudaDeConexion(soloSeRenovo('tiktok'))).toEqual({
      titulo: 'No se agregó otra cuenta de TikTok',
      porque: 'TikTok entró con la cuenta que tienes abierta en este navegador, que ya estaba conectada.',
      pasos: [
        'Abre tiktok.com en este mismo navegador y cierra la sesión, o cambia a la otra cuenta.',
        'Vuelve y aprieta «Agregar otra cuenta de TikTok»: TikTok te muestra con qué cuenta vas a autorizar antes de seguir.',
      ],
      reintentar: { texto: 'Agregar otra cuenta de TikTok', href: '/api/social/tiktok/connect?agregar=1' },
    })
  })

  it('«Agregar cuenta →» con la de antes, en Instagram: editar el acceso en Facebook, letra por letra', () => {
    expect(ayudaDeConexion(soloSeRenovo('instagram'))).toEqual({
      titulo: 'No se agregó otra cuenta de Instagram',
      porque: 'Meta entregó solo la cuenta que ya estaba conectada: repite lo que compartiste con Tu Parrilla la vez anterior.',
      pasos: [
        'La otra cuenta también tiene que ser profesional y estar enlazada a una página de Facebook que administres: en Instagram, en Editar perfil → «Página».',
        'En la ventana de Facebook, no sigas como la vez anterior: elige editar el acceso y marca también esa página y ese Instagram.',
        'De vuelta en Tu Parrilla, en «¿Qué cuentas de Instagram conectar?», marca la nueva.',
      ],
      reintentar: { texto: 'Agregar otra cuenta de Instagram', href: '/api/social/instagram/connect?agregar=1' },
    })
  })

  it('Facebook y YouTube también, y cada vuelta vuelve a «Agregar» de su red', () => {
    expect(ayudaDeConexion(soloSeRenovo('facebook'))?.titulo).toBe('No se agregó otra página de Facebook')
    expect(ayudaDeConexion(soloSeRenovo('facebook'))?.reintentar.href).toBe('/api/social/facebook/connect?agregar=1')
    expect(ayudaDeConexion(soloSeRenovo('youtube'))?.titulo).toBe('No se agregó otro canal de YouTube')
    expect(ayudaDeConexion(soloSeRenovo('youtube'))?.reintentar.href).toBe('/api/social/youtube/connect?agregar=1')
  })
})
