import { describe, expect, it } from 'vitest'
import { CODIGO_INCORRECTO, CORREO_INVALIDO } from './ingreso-frases'
import { LINK_SIN_NOMBRE, LINK_SIN_URL, NOMBRE_VACIO, revisarCodigo, revisarCorreo, revisarLinkNuevo, revisarNombreDeLlave } from './revisiones'

function formulario(campos: Record<string, string>): FormData {
  const datos = new FormData()
  for (const [clave, valor] of Object.entries(campos)) datos.set(clave, valor)
  return datos
}

describe('las revisiones antes de enviar', () => {
  it('el correo: vacío o sin forma de correo, la frase del servidor, y el foco a ese campo', () => {
    expect(revisarCorreo(formulario({ correo: '' }))).toEqual({ campo: 'correo', mensaje: CORREO_INVALIDO })
    expect(revisarCorreo(formulario({ correo: 'vicente@' }))).toEqual({ campo: 'correo', mensaje: CORREO_INVALIDO })
    expect(revisarCorreo(formulario({}))).toEqual({ campo: 'correo', mensaje: CORREO_INVALIDO })
    expect(revisarCorreo(formulario({ correo: ' Vicente@Correo.CL ' }))).toBeNull()
  })

  it('el código: seis dígitos, sin contar lo que se pegó alrededor', () => {
    expect(revisarCodigo(formulario({ codigo: '12345' }))).toEqual({ campo: 'codigo', mensaje: CODIGO_INCORRECTO })
    expect(revisarCodigo(formulario({ codigo: 'abc' }))).toEqual({ campo: 'codigo', mensaje: CODIGO_INCORRECTO })
    expect(revisarCodigo(formulario({ codigo: '123456' }))).toBeNull()
    expect(revisarCodigo(formulario({ codigo: '123 456' }))).toBeNull()
  })

  it('el link nuevo: primero el nombre, después la URL', () => {
    expect(revisarLinkNuevo(formulario({ label: '  ', url: '' }))).toEqual({ campo: 'label', mensaje: LINK_SIN_NOMBRE })
    expect(revisarLinkNuevo(formulario({ label: 'Mi proyecto', url: ' ' }))).toEqual({ campo: 'url', mensaje: LINK_SIN_URL })
    expect(revisarLinkNuevo(formulario({ label: 'Mi proyecto', url: 'ejemplo.com' }))).toBeNull()
  })

  it('la llave: con nombre', () => {
    expect(revisarNombreDeLlave(formulario({ nombre: '   ' }))).toEqual({ campo: 'nombre', mensaje: NOMBRE_VACIO })
    expect(revisarNombreDeLlave(formulario({ nombre: 'Editor de videos' }))).toBeNull()
  })
})
