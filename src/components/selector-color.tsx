'use client'

import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { CONTROL } from '@/components/boton'
import { leerHex, muestraDeColores } from '@/lib/paleta-de-acento'
import { cn } from '@/lib/utils'
import { Button } from './ui-boton'
import { Ventana } from './ventana'

const MUESTRA = muestraDeColores()
const COLUMNAS = MUESTRA[0]!.length

/**
 * El color a elección, en vez del `type="color"` del navegador, que abre el selector del sistema:
 * otra ventana, con otra letra, otro idioma y otros colores. Este es un cuadrado del color, que
 * abre una `Ventana` con una muestra para elegir con el dedo y el código para escribirlo exacto.
 * «Listo» lo pone; «Cancelar», Esc o un clic fuera lo dejan como estaba.
 *
 * Con `name`, el valor viaja en el formulario como «#rrggbb», como el del navegador. La ventana va
 * en un portal por lo mismo que la del calendario (`selector-fecha.tsx`): fuera del `<label>`.
 */
export function SelectorColor({
  value,
  onChange,
  name,
  'aria-label': etiqueta,
  className,
}: {
  value: string
  onChange: (color: string) => void
  name?: string
  'aria-label': string
  className?: string
}) {
  const [abierto, setAbierto] = useState(false)
  return (
    <>
      <button
        type="button"
        aria-label={`${etiqueta}: ${value}`}
        aria-haspopup="dialog"
        aria-expanded={abierto}
        onClick={() => setAbierto(true)}
        className={cn('h-7 w-10 shrink-0 rounded border border-velo/20 transition-transform hover:scale-105', className)}
        style={{ background: value }}
      />
      {name ? <input type="hidden" name={name} value={value} /> : null}
      {abierto
        ? createPortal(
            <Muestra
              inicial={value}
              titulo={etiqueta}
              onElegir={(color) => {
                onChange(color)
                setAbierto(false)
              }}
              onCerrar={() => setAbierto(false)}
            />,
            document.querySelector('.acerado') ?? document.body,
          )
        : null}
    </>
  )
}

function Muestra({
  inicial,
  titulo,
  onElegir,
  onCerrar,
}: {
  inicial: string
  titulo: string
  onElegir: (color: string) => void
  onCerrar: () => void
}) {
  const ventana = useRef<HTMLDialogElement>(null)
  const grilla = useRef<HTMLDivElement>(null)
  const [color, setColor] = useState(leerHex(inicial) ?? '#e8621f')
  const [escrito, setEscrito] = useState(color)
  const plano = MUESTRA.flat()
  const [foco, setFoco] = useState(Math.max(0, plano.indexOf(color)))
  const leido = leerHex(escrito)

  useEffect(() => {
    if (!ventana.current?.open) ventana.current?.showModal()
    grilla.current?.querySelector<HTMLButtonElement>('[tabindex="0"]')?.focus()
  }, [])

  function poner(nuevo: string) {
    setColor(nuevo)
    setEscrito(nuevo)
  }

  /** Las flechas recorren la muestra como un mes del calendario: un solo punto de tabulación. */
  function tecla(event: KeyboardEvent<HTMLDivElement>) {
    const paso = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -COLUMNAS, ArrowDown: COLUMNAS }[event.key]
    if (paso === undefined) return
    event.preventDefault()
    const siguiente = Math.min(plano.length - 1, Math.max(0, foco + paso))
    setFoco(siguiente)
    grilla.current?.querySelectorAll<HTMLButtonElement>('button')[siguiente]?.focus()
  }

  function listo() {
    ventana.current?.close()
    onElegir(color)
  }

  return (
    <Ventana
      ref={ventana}
      aria-label={titulo}
      alVelo={() => ventana.current?.close()}
      onClose={onCerrar}
      className="ventana-candente w-[22rem] border-t-2 border-t-brasa"
    >
      <div className="space-y-3 p-4">
        <p className="font-titulo text-sm font-semibold uppercase tracking-[0.06em]">{titulo}</p>
        <div ref={grilla} role="group" aria-label="Muestra de colores" onKeyDown={tecla} className="grid grid-cols-12 gap-1">
          {plano.map((muestra, i) => (
            <button
              key={muestra}
              type="button"
              tabIndex={i === foco ? 0 : -1}
              aria-label={muestra}
              aria-pressed={muestra === color}
              onClick={() => {
                setFoco(i)
                poner(muestra)
              }}
              className={cn(
                'aspect-square w-full rounded-[3px] transition-transform hover:scale-110',
                muestra === color && 'ring-2 ring-fg ring-offset-2 ring-offset-acero-900',
              )}
              style={{ background: muestra }}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="h-9 w-12 shrink-0 rounded border border-velo/20" style={{ background: color }} aria-hidden />
          <input
            aria-label="Código del color"
            value={escrito}
            spellCheck={false}
            onChange={(event) => {
              setEscrito(event.target.value)
              const nuevo = leerHex(event.target.value)
              if (nuevo) setColor(nuevo)
            }}
            onKeyDown={(event) => {
              if (event.key !== 'Enter') return
              event.preventDefault()
              if (leido) listo()
            }}
            className={cn(CONTROL, 'font-mono', !leido && 'border-negative/60')}
          />
        </div>
        {leido ? null : <p className="text-[0.75rem] text-negative">Escribe un código como #3d7bff.</p>}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Button type="button" variant="primary" disabled={!leido} onClick={listo}>
            Listo
          </Button>
          <Button type="button" className="ml-auto" onClick={() => ventana.current?.close()}>
            Cancelar
          </Button>
        </div>
      </div>
    </Ventana>
  )
}
