import { cn } from '@/lib/utils'

/**
 * El ícono de Ajustes: un trinche de dos puntas y un cuchillo criollo, de pie y lado a lado,
 * como se dejan junto a la parrilla. Reemplaza al engranaje, que no decía nada de una parrilla.
 * De día, dos palillos: lo que se deja junto al sushi. Los dos van en la página y el modo esconde
 * uno (`.solo-noche`, `.solo-dia`), como el maestro de Tu IA (`icono-maestro.tsx`).
 *
 * Se probaron cruzados, en X y en V, y a 16 px —el tamaño de la barra— la X se leía como
 * «cerrar» y la V como una letra; de pie, cada uno conserva su cabeza: dos puntas el trinche,
 * hoja ancha el cuchillo. Lo que hace que el cuchillo se lea como cuchillo es que la hoja sea
 * bastante más ancha que el mango, con el lomo recto, la punta arriba y el filo con panza; con
 * la hoja del ancho del mango era un destornillador.
 *
 * Siluetas llenas, no trazos. Los remaches del mango son agujeros (`evenodd`), no círculos
 * pintados: así se ven del color de lo que haya detrás, también sobre la brasa del botón activo.
 * La app del teléfono dibuja lo mismo con vistas (`mobile/src/components/boton-ajustes.tsx`).
 */
function TrincheYCuchillo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={cn('shrink-0', className)} aria-hidden>
      {/* El trinche: dos puntas, el puente que las une, el cuello y el mango. */}
      <path d="M3.9 9.8V3.4L4.85 1.6L5.8 3.4V8.5H8.2V3.4L9.15 1.6L10.1 3.4V9.8Q10.1 11.3 8.6 11.3H7.9V13.6H6.1V11.3H5.4Q3.9 11.3 3.9 9.8Z" />
      <rect x="5.35" y="13.6" width="3.3" height="9.2" rx="1.55" />
      {/* El cuchillo: la hoja, la guarda y el mango con sus dos remaches. */}
      <path d="M13.3 12.6V3.6Q13.3 2.5 13.9 1.4L14.6 0.6Q20.2 3.2 20.2 9.9V12.6Z" />
      <rect x="12.8" y="12.6" width="7.9" height="1.8" rx=".7" />
      <path
        fillRule="evenodd"
        d="M15.15 14.4H17.85A.95.95 0 0 1 18.8 15.35V21.7A1.3 1.3 0 0 1 17.5 23H15.5A1.3 1.3 0 0 1 14.2 21.7V15.35A.95.95 0 0 1 15.15 14.4ZM15.85 16.9A.65.65 0 1 0 17.15 16.9A.65.65 0 1 0 15.85 16.9ZM15.85 20.5A.65.65 0 1 0 17.15 20.5A.65.65 0 1 0 15.85 20.5Z"
      />
    </svg>
  )
}

/**
 * Los palillos: dos, en diagonal, que se juntan hacia las puntas, como cuando se sostienen. En
 * diagonal y no de pie: dos barras verticales a 16 px son el ícono de pausa. Lo que los hace
 * palillos es el adelgazamiento, del extremo cuadrado a la punta redonda, y la franja de arriba,
 * la que separa la cabeza: sin ella, a 16 px eran dos barras inclinadas, «//».
 */
function Palillos({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={cn('shrink-0', className)} aria-hidden>
      {/* Cada palillo: la cabeza, y el resto hasta la punta. */}
      <path d="M13.74 0.48L17.06 2.32L14.61 6.25L11.71 4.64Z" />
      <path d="M11.25 5.57L14.06 7.13L4.81 21.94A.7.7 0 0 1 3.59 21.26Z" />
      <path d="M19.7 3.44L22.7 5.76L19.75 9.18L17.13 7.14Z" />
      <path d="M16.55 7.98L19.09 9.94L7.95 22.83A.7.7 0 0 1 6.85 21.97Z" />
    </svg>
  )
}

/** El ícono de Ajustes de cada modo: el trinche y el cuchillo de noche, los palillos de día. */
export function IconoAjustes({ className }: { className?: string }) {
  return (
    <>
      <TrincheYCuchillo className={cn('solo-noche', className)} />
      <Palillos className={cn('solo-dia', className)} />
    </>
  )
}
