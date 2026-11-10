import { describe, expect, it } from 'vitest'
import { codigoDelFragmento, enlaceDeEntrada } from './enlace-de-entrada'

describe('el enlace del correo del código', () => {
  it('el código va en el fragmento, que no llega al servidor', () => {
    const enlace = enlaceDeEntrada('https://tu-parrilla.cl', 'juana@ejemplo.cl', '123456')
    expect(enlace).toBe('https://tu-parrilla.cl/ingresar/codigo?correo=juana%40ejemplo.cl#codigo=123456')
    expect(new URL(enlace).search).not.toContain('123456')
    expect(codigoDelFragmento(new URL(enlace).hash)).toBe('123456')
  })

  it('solo seis dígitos, y nada sin fragmento', () => {
    expect(codigoDelFragmento('')).toBeNull()
    expect(codigoDelFragmento('#codigo=12345')).toBeNull()
    expect(codigoDelFragmento('#codigo=1234567')).toBeNull()
    expect(codigoDelFragmento('#codigo=12a456')).toBeNull()
    expect(codigoDelFragmento('#otro=1&codigo=654321')).toBe('654321')
    expect(codigoDelFragmento('#nocodigo=654321')).toBeNull()
  })
})
