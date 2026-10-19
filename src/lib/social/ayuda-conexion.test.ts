import { describe, expect, it } from 'vitest'
import { ayudaDeConexion } from './ayuda-conexion'
import { NO_FACEBOOK_PAGE } from './facebook'
import { NO_INSTAGRAM_ACCOUNT } from './instagram'

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
})
