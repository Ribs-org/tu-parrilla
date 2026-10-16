import { cn } from '@/lib/utils'

/**
 * El ícono de Ajustes: un trinche de dos puntas y un cuchillo criollo, de pie y lado a lado,
 * como se dejan junto a la parrilla. Reemplaza al engranaje, que no decía nada de una parrilla.
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
export function IconoAjustes({ className }: { className?: string }) {
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
