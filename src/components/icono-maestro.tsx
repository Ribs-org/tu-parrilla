import { cn } from '@/lib/utils'

/*
 * El ícono de Tu IA: el maestro que cocina por ti. De noche, un parrillero de sombrero de ala
 * ancha, pañuelo al cuello y delantal; de día, un maestro de sushi con su gorrito de chef y el
 * cuello cruzado de la chaqueta japonesa. Los dos van en la página y el modo esconde uno, como
 * el corte y la pieza de sushi (`.solo-noche`, `.solo-dia` en `globals.css`).
 *
 * Mismo oficio que el trinche y el cuchillo de Ajustes (`icono-ajustes.tsx`): siluetas llenas y
 * los detalles como agujeros (`evenodd`) —el delantal, el cuello—, así se ven del color de lo
 * que haya detrás, también sobre la brasa de la pestaña activa. Probados a 16 px, el tamaño de
 * la barra: lo que los separa a esa escala es el sombrero, de ala ancha el uno y alto y sin ala
 * el otro.
 */

/** El parrillero: sombrero de ala ancha, la cara, el pañuelo y el delantal sobre los hombros. */
function Parrillero({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={cn('shrink-0', className)} aria-hidden>
      {/* La copa y el ala del sombrero. */}
      <path d="M7.7 7.4L8.3 3.4Q12 2.2 15.7 3.4L16.3 7.4Z" />
      <ellipse cx="12" cy="8.1" rx="9.4" ry="1.55" />
      {/* La cara, bajo el ala. */}
      <circle cx="12" cy="12.6" r="3" />
      {/* El pañuelo anudado al cuello. */}
      <path d="M9.9 16.2H14.1L12 18.4Z" />
      {/* Los hombros, con el delantal recortado: el agujero es la tela clara sobre la camisa. */}
      <path
        fillRule="evenodd"
        d="M3.6 23.6Q3.9 18.6 9.2 17.1L12 19.6L14.8 17.1Q20.1 18.6 20.4 23.6ZM9.1 23.6V20.9Q9.1 20.1 9.9 20.1H14.1Q14.9 20.1 14.9 20.9V23.6Z"
      />
    </svg>
  )
}

/** El maestro de sushi: el gorrito alto y sin ala, la cara y la chaqueta de cuello cruzado. */
function MaestroDeSushi({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={cn('shrink-0', className)} aria-hidden>
      {/* El gorrito: alto, recto y sin ala, con el borde doblado abajo. */}
      <path fillRule="evenodd" d="M7.9 8.6V3.9Q12 2.4 16.1 3.9V8.6ZM7.9 7.2H16.1V6.3H7.9Z" />
      {/* La cara. */}
      <circle cx="12" cy="12.4" r="3" />
      {/* Los hombros, con el cuello cruzado: la solapa de arriba entera y la de abajo hasta que
          se mete bajo ella. */}
      <path
        fillRule="evenodd"
        d="M3.6 23.6Q3.9 18.4 9.4 16.6H14.6Q20.1 18.4 20.4 23.6ZM9.2 17.2L10.7 17.2L14.6 23.6H13.1ZM14.8 17.2L13.3 17.2L11.6 20.2L12.4 21.4Z"
      />
    </svg>
  )
}

/** El maestro de cada modo: el parrillero de noche, el de sushi de día. */
export function IconoMaestro({ className }: { className?: string }) {
  return (
    <>
      <Parrillero className={cn('solo-noche', className)} />
      <MaestroDeSushi className={cn('solo-dia', className)} />
    </>
  )
}
