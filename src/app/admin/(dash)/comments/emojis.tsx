'use client'

import { useState } from 'react'

/**
 * Los emojis que más se usan al contestar un comentario: agradecer, querer, celebrar, reírse.
 * No es un teclado entero: para lo raro está el del sistema (Win + . en Windows, el del
 * teléfono). Cada uno es un solo punto de código o una secuencia que todos los sistemas
 * dibujan, para que el contador de caracteres de la red no se lleve sorpresas. La bandera de
 * Chile es la excepción a lo de «todos dibujan»: Windows no pinta banderas y la escribe «CL».
 * Por eso su botón la dibuja (`DIBUJOS`), aunque en el cuadro de texto se siga viendo «CL»; en
 * las apps de las redes sale la bandera.
 */
export const EMOJIS = [
  '🙌', '🙏', '❤️', '🔥', '😊', '😂', '🥹', '😍',
  '👏', '💪', '✨', '🎉', '👀', '😉', '🤝', '💯',
  '👌', '🥳', '😅', '🤗', '💛', '🧡', '⭐', '✅',
  '🇨🇱',
] as const

/** La bandera de Chile en 3:2, con su estrella: para que el botón se vea igual en Windows. */
function BanderaChile() {
  return (
    <svg viewBox="0 0 3 2" aria-hidden className="h-3 w-[18px] rounded-[2px] ring-1 ring-black/10">
      <rect width="3" height="2" fill="#D52B1E" />
      <rect width="3" height="1" fill="#fff" />
      <rect width="1" height="1" fill="#0039A6" />
      <polygon
        fill="#fff"
        points="0.500,0.200 0.571,0.403 0.785,0.407 0.614,0.537 0.676,0.743 0.500,0.620 0.324,0.743 0.386,0.537 0.215,0.407 0.429,0.403"
      />
    </svg>
  )
}

/** Los que el botón dibuja en vez de confiar en la letra del sistema, con su nombre. */
const DIBUJOS: Partial<Record<(typeof EMOJIS)[number], { dibujo: React.ReactNode; nombre: string; ayuda: string }>> = {
  '🇨🇱': {
    dibujo: <BanderaChile />,
    nombre: 'la bandera de Chile',
    ayuda: 'Bandera de Chile. En Windows, en el cuadro se ve como «CL»; en la red sale la bandera.',
  },
}

/**
 * Pone `emoji` donde estaba el cursor del cuadro (o reemplaza lo seleccionado), y devuelve el
 * texto nuevo y dónde queda el cursor: justo después del emoji.
 */
export function insertar(texto: string, emoji: string, desde: number, hasta: number) {
  const inicio = Math.max(0, Math.min(desde, texto.length))
  const fin = Math.max(inicio, Math.min(hasta, texto.length))
  return { texto: texto.slice(0, inicio) + emoji + texto.slice(fin), cursor: inicio + emoji.length }
}

/**
 * El botón «Emojis» y, al apretarlo, la fila de emojis para sumar a la respuesta. Va arriba del
 * cuadro y en voz baja: es un adorno de la respuesta, no compite con «Enviar».
 */
export function Emojis({
  alElegir,
  disabled,
  className,
}: {
  alElegir: (emoji: string) => void
  disabled?: boolean
  className?: string
}) {
  const [abierto, setAbierto] = useState(false)
  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setAbierto((a) => !a)}
        disabled={disabled}
        aria-expanded={abierto}
        className="text-[0.72rem] text-fg-faint opacity-70 transition-opacity hover:opacity-100 disabled:opacity-40"
      >
        <span aria-hidden>🙂</span> {abierto ? 'Cerrar emojis' : 'Emojis'}
      </button>
      {abierto ? (
        <div role="group" aria-label="Emojis" className="mt-1 flex flex-wrap gap-0.5">
          {EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => alElegir(e)}
              disabled={disabled}
              aria-label={`Poner ${DIBUJOS[e]?.nombre ?? e}`}
              title={DIBUJOS[e]?.ayuda}
              className="grid h-7 w-7 place-items-center rounded-md text-base opacity-75 transition hover:bg-velo/[0.06] hover:opacity-100 disabled:opacity-40"
            >
              {DIBUJOS[e]?.dibujo ?? e}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
