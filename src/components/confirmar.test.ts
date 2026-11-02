import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { confirmarEliminar } from '@/app/admin/(dash)/schedule/etiqueta'
import { Confirmaciones, useConfirmar } from './confirmar'
import { Submit } from './ui-cliente'

describe('Confirmaciones', () => {
  it('deja la ventana del panel cerrada y vacía hasta que alguien pregunta', () => {
    const html = renderToStaticMarkup(createElement(Confirmaciones, null, 'la pantalla'))
    expect(html).toContain('la pantalla')
    expect(html).toMatch(/<dialog[^>]*role="alertdialog"/)
    expect(html).toMatch(/<dialog[^>]*aria-modal="true"/)
    expect(html).not.toMatch(/<dialog[^>]* open/)
    expect(html).not.toContain('Cancelar')
  })

  it('preguntar fuera del panel falla: una acción no puede seguir sin preguntar', () => {
    let confirmar: ReturnType<typeof useConfirmar> | null = null
    function Sonda() {
      confirmar = useConfirmar()
      return null
    }
    renderToStaticMarkup(createElement(Sonda))
    expect(() => confirmar!({ titulo: '¿Seguro?', accion: 'Seguir' })).toThrow(/Confirmaciones/)
  })

  it('un Submit sin pregunta se dibuja también fuera del panel: /ingresar no tiene la ventana', () => {
    const html = renderToStaticMarkup(createElement(Submit, { pendingLabel: 'Enviando…' }, 'Entrar'))
    expect(html).toContain('Entrar')
  })
})

describe('confirmarEliminar', () => {
  it('nombra la pantalla como se llama en cada modo, y pinta de rojo', () => {
    expect(confirmarEliminar('noche')).toEqual({
      titulo: '¿Eliminar este post?',
      detalle: 'Se borra de La Parrilla y ya no sale en ninguna red.',
      accion: 'Eliminar',
      peligro: true,
    })
    expect(confirmarEliminar('dia').detalle).toContain('La Barra')
  })
})
