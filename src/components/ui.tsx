// Las piezas del panel. Este módulo no es `'use client'`: lo que no tiene estado (el título,
// los campos, el botón) se dibuja en el servidor cuando lo pide una página del servidor, y lo
// que necesita el navegador —el envío con su estado, los interruptores— vive en `ui-cliente.tsx`
// y se reexporta acá, así que quien importa no tiene que saber de qué lado está cada una.
import { DeNocheYDeDia } from '@/components/de-noche-y-de-dia'
import { nombreEn, pantallaDe } from '@/lib/vocabulario'
import { cn } from '@/lib/utils'

export { Button } from './ui-boton'
export { Submit, Switch, Toggle } from './ui-cliente'

// `color-scheme: dark` es para lo que dibuja el sistema y no el CSS: la lista desplegable de
// un `<select>` y el calendario de un `datetime-local`. Sin él salen con fondo claro y
// heredan el texto claro del panel, así que se leen blanco sobre blanco.
const CONTROL =
  'w-full rounded-lg border border-acero-700 bg-acero-800 px-3 py-2 text-sm outline-none transition-colors [color-scheme:dark] placeholder:text-fg-faint focus:border-brasa'

/**
 * El título de una pantalla del panel, con su subtítulo en llano debajo: la red de
 * seguridad de los nombres del asado (dirección visual, §2). Sale del vocabulario, así que
 * una pantalla no puede llamarse distinto en la barra y en su título, ni de noche ni de día.
 * `children` es lo que la pantalla quiera a la derecha —un selector, un botón— y se alinea con
 * el título.
 */
export function Encabezado({ ruta, children }: { ruta: string; children?: React.ReactNode }) {
  const pantalla = pantallaDe(ruta)
  if (!pantalla) throw new Error(`Encabezado: ${ruta} no está en el vocabulario`)
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-titulo text-2xl font-semibold uppercase tracking-[0.03em]">
          <DeNocheYDeDia noche={pantalla.nombre} dia={nombreEn(pantalla, 'dia')} />
        </h1>
        <p className="mt-0.5 text-[0.78rem] text-fg-faint">{pantalla.subtitulo}</p>
      </div>
      {children}
    </div>
  )
}

/**
 * Encabezado de un grupo de controles. `Field` rotula uno solo: su `<label>` alrededor
 * de varios dejaría el nombre apuntando al primero.
 */
export function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-2 block font-titulo text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-fg-faint">
      {children}
    </span>
  )
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <GroupLabel>{label}</GroupLabel>
      {children}
      {hint ? <span className="mt-1 block text-[0.72rem] text-fg-faint">{hint}</span> : null}
    </label>
  )
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(CONTROL, props.className)} />
}

// Con `ref`: La Mesa pone el emoji donde está el cursor.
export function Textarea(props: React.ComponentProps<'textarea'>) {
  return <textarea {...props} className={cn(CONTROL, 'resize-y', props.className)} />
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(CONTROL, props.className)} />
}
