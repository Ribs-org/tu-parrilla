import { describe, expect, it } from 'vitest'
import {
  CANCELABLES,
  ESTADOS_COMANDA,
  NOMBRE_ESTADO,
  PREGUNTAN_DESDE,
  TERMINALES,
  esEstado,
  puedePasar,
  puedePreguntar,
  tandasEnPalabras,
} from './estados'

describe('puedePasar', () => {
  it('el camino de siempre, de la revisión al mesón, con las tandas que llegan de a una', () => {
    expect(puedePasar('revisando', 'en_preparacion')).toBe(true)
    expect(puedePasar('en_preparacion', 'en_el_horno')).toBe(true)
    expect(puedePasar('en_el_horno', 'sirviendo')).toBe(true)
    // Cada tanda que llega actualiza el «3 de 5» sin cambiar de estado.
    expect(puedePasar('sirviendo', 'sirviendo')).toBe(true)
    expect(puedePasar('sirviendo', 'lista')).toBe(true)
  })

  it('la primera tanda puede salir mientras las otras se preparan', () => {
    expect(puedePasar('en_preparacion', 'sirviendo')).toBe(true)
  })

  it('lo que no está fuera de alcance se rechaza al revisar, y nada más tarde', () => {
    expect(puedePasar('revisando', 'rechazada')).toBe(true)
    expect(puedePasar('en_el_horno', 'rechazada')).toBe(false)
  })

  it('cualquier paso en curso puede fallar', () => {
    for (const de of ['revisando', 'en_preparacion', 'en_el_horno', 'sirviendo'] as const) {
      expect(puedePasar(de, 'fallida'), de).toBe(true)
    }
  })

  it('no se saltan pasos, no se sale de lo terminado, y tomar no es un cambio de estado', () => {
    expect(puedePasar('revisando', 'lista')).toBe(false)
    expect(puedePasar('recibida', 'revisando')).toBe(false)
    for (const terminal of TERMINALES) {
      for (const a of ESTADOS_COMANDA) expect(puedePasar(terminal, a), `${terminal} → ${a}`).toBe(false)
    }
  })

  it('servir y cancelar son del usuario: el chef no lleva a ninguno de los dos', () => {
    for (const de of ESTADOS_COMANDA) {
      expect(puedePasar(de, 'servida'), de).toBe(false)
      expect(puedePasar(de, 'cancelada'), de).toBe(false)
    }
  })

  it('a la pregunta no se entra con un cambio de estado, y la prueba espera su fase', () => {
    for (const de of ESTADOS_COMANDA) {
      expect(puedePasar(de, 'pregunta'), de).toBe(false)
      expect(puedePasar(de, 'probando'), de).toBe(false)
    }
  })

  it('de la pregunta no la saca el chef: la saca la respuesta, o el plazo', () => {
    for (const a of ESTADOS_COMANDA) expect(puedePasar('pregunta', a), a).toBe(false)
  })
})

describe('puedePreguntar', () => {
  it('se pregunta al revisar y mientras se eligen los cortes', () => {
    expect(puedePreguntar('revisando')).toBe(true)
    expect(puedePreguntar('en_preparacion')).toBe(true)
  })

  it('no antes de tomarla, no en el horno, no dos veces seguidas y no en lo terminado', () => {
    for (const de of ['recibida', 'pregunta', 'probando', 'en_el_horno', 'sirviendo', 'lista', ...TERMINALES] as const) {
      expect(puedePreguntar(de), de).toBe(false)
    }
  })

  it('todo lo que pregunta se puede cancelar mientras espera', () => {
    expect(CANCELABLES.has('pregunta')).toBe(true)
    for (const de of PREGUNTAN_DESDE) expect(CANCELABLES.has(de), de).toBe(true)
  })
})

describe('lo demás de los estados', () => {
  it('se cancela mientras no esté en el horno', () => {
    expect(CANCELABLES.has('recibida')).toBe(true)
    expect(CANCELABLES.has('en_preparacion')).toBe(true)
    expect(CANCELABLES.has('en_el_horno')).toBe(false)
    expect(CANCELABLES.has('sirviendo')).toBe(false)
  })

  it('cada estado tiene su nombre de noche y de día, y ninguno usa «Se quemó» ni «La Barra»', () => {
    for (const estado of ESTADOS_COMANDA) {
      expect(NOMBRE_ESTADO[estado].noche, estado).toBeTruthy()
      expect(NOMBRE_ESTADO[estado].dia, estado).toBeTruthy()
      for (const nombre of Object.values(NOMBRE_ESTADO[estado])) {
        expect(nombre).not.toMatch(/se quemó|la barra/i)
      }
    }
  })

  it('reconoce un estado por su nombre exacto', () => {
    expect(esEstado('sirviendo')).toBe(true)
    expect(esEstado('Sirviendo')).toBe(false)
    expect(esEstado(3)).toBe(false)
  })

  it('el «3 de 5» en el mesón de noche y en la bandeja de día', () => {
    expect(tandasEnPalabras(3, 5, 'noche')).toBe('3 de 5 tandas en el mesón')
    expect(tandasEnPalabras(1, 1, 'dia')).toBe('1 de 1 tanda en la bandeja')
    expect(tandasEnPalabras(2, null, 'noche')).toBe('2 tandas en el mesón')
  })
})
