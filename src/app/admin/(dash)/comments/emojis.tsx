'use client'

import { useState } from 'react'

/**
 * Los emojis que más se usan al contestar un comentario: agradecer, querer, celebrar, reírse.
 * No es un teclado entero: para lo raro está el del sistema (Win + . en Windows, el del
 * teléfono). Cada uno es un solo punto de código o una secuencia que todos los sistemas
 * dibujan, para que el contador de caracteres de la red no se lleve sorpresas.
 */
export const EMOJIS = [
  '🙌', '🙏', '❤️', '🔥', '😊', '😂', '🥹', '😍',
  '👏', '💪', '✨', '🎉', '👀', '😉', '🤝', '💯',
  '👌', '🥳', '😅', '🤗', '💛', '🧡', '⭐', '✅',
] as const

/**
 * Pone `emoji` donde estaba el cursor del cuadro (o reemplaza lo seleccionado), y devuelve el
 * texto nuevo y dónde queda el cursor: justo después del emoji.
 */
export function insertar(texto: string, emoji: string, desde: number, hasta: number) {
  const inicio = Math.max(0, Math.min(desde, texto.length))
  const fin = Math.max(inicio, Math.min(hasta, texto.length))
  return { texto: texto.slice(0, inicio) + emoji + texto.slice(fin), cursor: inicio + emoji.length }
}

/** El botón «Emojis» y, al apretarlo, la fila de emojis para sumar a la respuesta. */
export function Emojis({ alElegir, disabled }: { alElegir: (emoji: string) => void; disabled?: boolean }) {
  const [abierto, setAbierto] = useState(false)
  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setAbierto((a) => !a)}
        disabled={disabled}
        aria-expanded={abierto}
        className="text-[0.78rem] text-fg-faint hover:text-fg disabled:opacity-50"
      >
        <span aria-hidden>🙂</span> {abierto ? 'Cerrar emojis' : 'Emojis'}
      </button>
      {abierto ? (
        <div role="group" aria-label="Emojis" className="mt-1.5 flex flex-wrap gap-1">
          {EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => alElegir(e)}
              disabled={disabled}
              aria-label={`Poner ${e}`}
              className="grid h-8 w-8 place-items-center rounded-md text-lg hover:bg-velo/[0.08] disabled:opacity-50"
            >
              {e}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
