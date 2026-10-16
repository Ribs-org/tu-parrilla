import { cn } from '@/lib/utils'

/**
 * El ícono de Ajustes: un cuchillo parrillero y un trinche de dos puntas, cruzados por los
 * mangos, con las cabezas arriba. Reemplaza al engranaje, que no decía nada de una parrilla.
 *
 * Cada herramienta se dibuja derecha, de punta hacia arriba, y se gira 40° sobre un punto
 * bajo (12, 15): así se cruzan por los mangos y las cabezas quedan separadas en las dos
 * esquinas de arriba, que es lo que hace que se lean a 16 px. Mismo trazo que los íconos de
 * `lucide-react` del resto del panel: 2 de ancho, puntas redondas, color del texto.
 */
export function IconoAjustes({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('shrink-0', className)}
      aria-hidden
    >
      {/* El trinche: dos puntas unidas en una U, y el mango. */}
      <g transform="rotate(-40 12 15)">
        <path d="M9.4 1.8V6.2Q9.4 9 12 9Q14.6 9 14.6 6.2V1.8" />
        <path d="M12 9V22" />
      </g>
      {/* El cuchillo: la hoja con el filo curvo, la guarda y un mango más grueso. */}
      <g transform="rotate(40 12 15)">
        <path d="M11 10V3.4Q11 1.4 12.8 1Q14.3 4.6 14 10Z" />
        <path d="M10 10.2H15" />
        <path d="M12.5 10.6V22" strokeWidth="2.9" />
      </g>
    </svg>
  )
}
