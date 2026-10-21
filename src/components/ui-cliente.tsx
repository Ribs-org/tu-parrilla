'use client'

// Las piezas del panel que necesitan el navegador: el envío que lee el estado de su
// formulario y los interruptores. Se importan desde `ui.tsx`, que las reexporta.
import { useId } from 'react'
import { useFormStatus } from 'react-dom'
import { cn } from '@/lib/utils'
import { Button } from './ui-boton'

/**
 * El botón que envía un formulario y lo dice: mientras el server action viaja se apaga
 * y se renombra con `pendingLabel`.
 *
 * Tiene que ser un componente aparte del `<form>` porque `useFormStatus` solo lee el
 * formulario que está por encima de quien lo llama — dentro del mismo componente que
 * renderiza el `<form>` devolvería siempre `pending: false`.
 *
 * `confirm` pregunta antes de enviar. El diálogo va en el click y no en el `onSubmit`
 * del formulario para que un «cancelar» no llegue nunca a encolar la acción.
 *
 * `icono` va aparte de los hijos porque es lo único que sobrevive al cambio de texto:
 * adentro de `children` desaparecería al llegar `pendingLabel`, y el botón encogería
 * justo cuando hay que mirarlo.
 */
export function Submit({
  children,
  icono,
  pendingLabel,
  confirm: question,
  variant = 'primary',
  onClick,
  disabled,
  ...props
}: Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> & {
  variant?: 'primary' | 'ghost' | 'danger'
  icono?: React.ReactNode
  pendingLabel: string
  confirm?: string
}) {
  const { pending } = useFormStatus()

  return (
    <Button
      {...props}
      type="submit"
      variant={variant}
      disabled={pending || disabled}
      onClick={(event) => {
        if (question && !window.confirm(question)) {
          event.preventDefault()
          return
        }
        onClick?.(event)
      }}
    >
      {icono}
      {pending ? pendingLabel : children}
    </Button>
  )
}

/**
 * The switch on its own, for rows that already say what it controls.
 *
 * `label` is the accessible name, never drawn. Anything that needs visible text
 * beside it wants `Toggle`, which composes this one — rendering an empty label
 * here would leave the parent's gap as dead space next to the switch.
 */
export function Switch({
  label,
  id,
  checked,
  onChange,
  className,
}: {
  label: string
  id?: string
  checked: boolean
  onChange: (value: boolean) => void
  className?: string
}) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-label={label}
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-5 w-9 shrink-0 rounded-full transition-colors',
        checked ? 'bg-brasa/70' : 'bg-acero-700',
        className,
      )}
    >
      {/*
        `left-0` no es decorativo: sin él, la posición estática de un absoluto dentro de un
        botón la decide el `text-align: center` del botón, así que la perilla nacía centrada
        y al encenderse se salía de la pista. Con `left-0`, apagada queda a 2px del borde
        izquierdo y encendida a 2px del derecho (36 - 16 - 2 = 18px = 1.125rem).
      */}
      <span
        className={cn(
          'absolute left-0 top-0.5 h-4 w-4 rounded-full bg-fg transition-transform',
          checked ? 'translate-x-[1.125rem]' : 'translate-x-0.5',
        )}
      />
    </button>
  )
}

export function Toggle({
  label,
  hint,
  name,
  checked,
  onChange,
}: {
  label: string
  hint?: string
  name?: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  const id = useId()
  return (
    <div className="flex items-start gap-3">
      {/* mt-0.5 lines the switch up with the first line of the label, not the block. */}
      <Switch id={id} label={label} checked={checked} onChange={onChange} className="mt-0.5" />
      <label htmlFor={id} className="cursor-pointer select-none">
        <span className="block text-sm">{label}</span>
        {hint ? <span className="block text-[0.72rem] text-fg-faint">{hint}</span> : null}
      </label>
      {name ? <input type="hidden" name={name} value={checked ? 'on' : ''} /> : null}
    </div>
  )
}
