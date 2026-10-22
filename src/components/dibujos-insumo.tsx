import { useId } from 'react'
import type { TipoInsumo } from '@/db/schema'
import { cn } from '@/lib/utils'

/*
 * Lo que se le lleva a la cocina, dibujado: cada insumo tiene su cara, de noche en la parrilla y de
 * día en la barra de sushi (`docs/superpowers/specs/2026-10-22-la-cocina-design.md`, «Los insumos y
 * sus dibujos»). El dibujo es la cara del tipo, no su reemplazo: el nombre va al lado, en palabras.
 *
 * Misma gramática que el corte y la pieza de sushi (`corte.tsx`, `pieza-sushi.tsx`): los colores de
 * la carne cruda y del pescado, la grasa y el hueso en crema, la tabla de madera. Los dos modos van
 * en la página y el modo esconde uno (`.solo-noche`, `.solo-dia`). En un lienzo de 96 × 96, probados
 * a 48 px, el tamaño de la fila de un archivo: lo que los separa a esa escala es la silueta.
 */

const CRUDA = { claro: '#f0a08f', medio: '#e8907f', hondo: '#c45a52' }
const CERDO = { claro: '#f8c6b8', medio: '#efa797', hondo: '#d47b6e' }
const GRASA = '#f6ead8'
const HUESO = '#f2e9da'
const FIERRO = '#8d9aa6'
const MADERA = { claro: '#e2c497', medio: '#d2ad78', veta: '#b98f5a' }

type Dibujo = { className?: string }

function Degradado({ id, c }: { id: string; c: { claro: string; medio: string; hondo: string } }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor={c.claro} />
      <stop offset=".5" stopColor={c.medio} />
      <stop offset="1" stopColor={c.hondo} />
    </linearGradient>
  )
}

/** La media res, colgada del gancho: ancha arriba, el cuarto trasero; angosta abajo. */
export function Res({ className, cortada = false }: Dibujo & { cortada?: boolean }) {
  const id = useId()
  return (
    <svg viewBox="0 0 96 96" className={cn('shrink-0', className)} aria-hidden>
      <defs>
        <Degradado id={`${id}c`} c={CRUDA} />
      </defs>
      <path d="M28 7H68" stroke={FIERRO} strokeWidth="3" strokeLinecap="round" />
      <path d="M48 7V15C48 19.5 43.5 20.5 41.5 18" stroke={FIERRO} strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <path
        d="M37 19C28 21 24 31 25 43C26 57 31 70 38 81C42 88 50 89 54 83C61 71 66 57 67 43C68 30 62 20 52 18.5C46.5 17.8 41.5 18 37 19Z"
        fill={`url(#${id}c)`}
      />
      <path d="M53 19.5C62 22 67 31 66.5 43C66 57 61 70 54.5 82" stroke={GRASA} strokeWidth="4.5" fill="none" strokeLinecap="round" />
      <path d="M38.5 20L43.5 32" stroke={HUESO} strokeWidth="4.5" strokeLinecap="round" />
      <path
        d="M31 50Q43 47.5 58 51M32.5 58Q44 55.5 56.5 59.5M35 66Q45 64 54 67.5"
        stroke={GRASA}
        strokeOpacity=".6"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
      />
      {cortada ? (
        <path
          d="M26 40H67M28 54H65M32 68H61"
          stroke="#fff6e8"
          strokeWidth="1.6"
          strokeDasharray="3 3"
          strokeLinecap="round"
        />
      ) : null}
    </svg>
  )
}

/** El costillar de cerdo: una tira con sus huesos a lo ancho, más chica que la res. */
export function Cerdo({ className }: Dibujo) {
  const id = useId()
  const huesos = [24, 34, 44, 54, 64, 74]
  return (
    <svg viewBox="0 0 96 96" className={cn('shrink-0', className)} aria-hidden>
      <defs>
        <Degradado id={`${id}c`} c={CERDO} />
      </defs>
      <path d="M14 38C26 32 70 31 82 36C85 46 84 56 81 63C68 68 28 69 15 64C11 56 11 46 14 38Z" fill={`url(#${id}c)`} />
      <path d="M15 38C28 33 69 32 81 36.5" stroke={GRASA} strokeWidth="4" fill="none" strokeLinecap="round" />
      {huesos.map((x) => (
        <g key={x}>
          <path d={`M${x} 41V62`} stroke={HUESO} strokeWidth="3.4" strokeLinecap="round" />
          <circle cx={x} cy="64.5" r="2.6" fill={HUESO} />
        </g>
      ))}
    </svg>
  )
}

/** Las verduras: un choclo con su hoja y un pimentón. */
export function Verduras({ className }: Dibujo) {
  const granos: Array<[number, number]> = []
  for (let fila = 0; fila < 4; fila++) {
    for (let n = 0; n < 6; n++) granos.push([28 + n * 6.4 + (fila % 2) * 3.2, 33 + fila * 5.4])
  }
  return (
    <svg viewBox="0 0 96 96" className={cn('shrink-0', className)} aria-hidden>
      <g transform="rotate(-18 46 42)">
        <path d="M18 42C24 26 66 24 74 36C77 41 77 46 74 50C66 61 24 58 18 42Z" fill="#f2c94c" />
        {granos.map(([cx, cy]) => (
          <ellipse key={`${cx}-${cy}`} cx={cx} cy={cy} rx="2.3" ry="1.9" fill="#fbe08a" />
        ))}
        <path d="M74 36C82 32 88 34 90 40C84 40 80 43 76 49" fill="#7fbf5f" />
        <path d="M74 50C82 55 89 53 90 46C85 46 80 44 76 40" fill="#4f8f3a" />
      </g>
      <path d="M58 64C58 56 66 54 72 57C78 54 86 57 85 66C84 77 76 84 71 83C66 84 59 76 58 64Z" fill="#d9473f" />
      <path d="M64 61C65 70 67 77 70 81" stroke="#f08a7e" strokeOpacity=".7" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M71.5 57V51.5C71.5 49 73.5 47.5 76 48" stroke="#4f8f3a" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  )
}

/** La tabla de madera donde el pescado se pone entero. */
function Tabla() {
  return (
    <g>
      <rect x="5" y="60" width="86" height="15" rx="3.5" fill={MADERA.medio} />
      <rect x="5" y="60" width="86" height="4" rx="2" fill={MADERA.claro} />
      <path d="M14 68H38M48 71H70M76 67H84" stroke={MADERA.veta} strokeWidth="1.2" strokeLinecap="round" />
    </g>
  )
}

/** Un pescado entero sobre la tabla: el lomo oscuro, el vientre plateado, la cola en horquilla. */
function Pescado({ id, largo, lomo, vientre, aleta, cortado }: { id: string; largo: number; lomo: string; vientre: string; aleta: string; cortado?: boolean }) {
  // El cuerpo va de x=10 a x=10+largo, sobre la tabla; la cola sale del final.
  const fin = 10 + largo
  const mitad = 10 + largo / 2
  const alto = largo * 0.17
  const y = 50
  return (
    <g>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={lomo} />
          <stop offset=".55" stopColor={lomo} />
          <stop offset=".62" stopColor={vientre} />
          <stop offset="1" stopColor={vientre} />
        </linearGradient>
      </defs>
      <path
        d={`M10 ${y}C${10 + largo * 0.14} ${y - alto} ${mitad - largo * 0.1} ${y - alto * 1.1} ${mitad + largo * 0.1} ${y - alto * 0.95}C${fin - largo * 0.12} ${y - alto * 0.7} ${fin - 2} ${y - 2} ${fin} ${y}C${fin - 2} ${y + 2} ${fin - largo * 0.12} ${y + alto * 0.7} ${mitad + largo * 0.1} ${y + alto * 0.95}C${mitad - largo * 0.1} ${y + alto * 1.1} ${10 + largo * 0.14} ${y + alto} 10 ${y}Z`}
        fill={`url(#${id})`}
      />
      <path d={`M${fin - 1} ${y}L${fin + 11} ${y - 10}L${fin + 7} ${y}L${fin + 11} ${y + 10}Z`} fill={aleta} />
      <path d={`M${mitad - 4} ${y - alto * 1.02}L${mitad + 6} ${y - alto * 1.6}L${mitad + 8} ${y - alto * 0.9}Z`} fill={aleta} />
      <path d={`M${10 + largo * 0.2} ${y - alto * 0.55}Q${10 + largo * 0.24} ${y} ${10 + largo * 0.2} ${y + alto * 0.55}`} stroke={aleta} strokeOpacity=".7" strokeWidth="1.3" fill="none" />
      <circle cx={10 + largo * 0.1} cy={y - alto * 0.18} r="1.9" fill="#ffffff" />
      <circle cx={10 + largo * 0.1} cy={y - alto * 0.18} r="1" fill="#1f2c26" />
      {cortado ? (
        <path
          d={`M${mitad - largo * 0.18} ${y - alto}V${y + alto}M${mitad} ${y - alto * 1.05}V${y + alto * 1.05}M${mitad + largo * 0.18} ${y - alto * 0.9}V${y + alto * 0.9}`}
          stroke="#fff6e8"
          strokeWidth="1.4"
          strokeDasharray="2.5 2.5"
          strokeLinecap="round"
        />
      ) : null}
    </g>
  )
}

/** El atún entero, sobre la tabla. */
export function Atun({ className, cortada = false }: Dibujo & { cortada?: boolean }) {
  const id = useId()
  return (
    <svg viewBox="0 0 96 96" className={cn('shrink-0', className)} aria-hidden>
      <Tabla />
      <Pescado id={`${id}p`} largo={68} lomo="#2f4a6b" vientre="#c9d3dc" aleta="#24394f" cortado={cortada} />
    </svg>
  )
}

/** El salmón entero, más chico que el atún. */
export function Salmon({ className }: Dibujo) {
  const id = useId()
  return (
    <svg viewBox="0 0 96 96" className={cn('shrink-0', className)} aria-hidden>
      <Tabla />
      <g transform="translate(9 3)">
        <Pescado id={`${id}p`} largo={52} lomo="#e5864a" vientre="#ffd2c2" aleta="#c66737" />
      </g>
    </svg>
  )
}

/** El arroz: un bol con su cerro de arroz. */
export function Arroz({ className }: Dibujo) {
  const granos: Array<[number, number, number]> = [
    [36, 42, -20], [44, 38, 10], [52, 37, -10], [60, 40, 25], [40, 48, 15], [48, 45, -25], [56, 46, 5], [64, 47, -15], [32, 50, 30],
  ]
  return (
    <svg viewBox="0 0 96 96" className={cn('shrink-0', className)} aria-hidden>
      <ellipse cx="48" cy="80" rx="26" ry="3.5" fill="#6b5a44" opacity=".18" />
      {/* Con borde: de día el arroz blanco se perdía contra el papel de arroz del fondo. */}
      <path d="M24 50C24 40 36 32 48 32C60 32 72 40 72 50Z" fill="#ffffff" stroke="#d9ccb6" strokeWidth="1.4" />
      <path d="M24 50C30 46 38 45 48 45C58 45 66 46 72 50Z" fill="#efe5d4" />
      {granos.map(([cx, cy, giro]) => (
        <ellipse key={`${cx}-${cy}`} cx={cx} cy={cy} rx="2.4" ry="1.2" fill="#e4d8c4" transform={`rotate(${giro} ${cx} ${cy})`} />
      ))}
      <path d="M17 50H79C78 64 66 76 48 76C30 76 18 64 17 50Z" fill="#2b2b2b" />
      <path d="M17 50H79C79 52.5 78.6 54.5 78 56.5H18C17.4 54.5 17 52.5 17 50Z" fill="#b83a3a" />
      <path d="M38 76H58L56 80H40Z" fill="#1d1d1d" />
    </svg>
  )
}

/**
 * El dibujo de un insumo en los dos modos, y el modo esconde uno: el plato principal es la res y el
 * atún; lo que se sincroniza con él (otra cámara, la pantalla), el cerdo y el salmón; las imágenes
 * o el b-roll, las verduras y el arroz. `cortada` marca por dónde se va a cortar el plato principal:
 * la tarjeta de una comanda lo pide desde que el chef despieza.
 */
export function DibujoDeInsumo({ tipo, cortada = false, className }: { tipo: TipoInsumo; cortada?: boolean; className?: string }) {
  const noche = cn('solo-noche', className)
  const dia = cn('solo-dia', className)
  if (tipo === 'principal') {
    return (
      <>
        <Res cortada={cortada} className={noche} />
        <Atun cortada={cortada} className={dia} />
      </>
    )
  }
  if (tipo === 'imagen') {
    return (
      <>
        <Verduras className={noche} />
        <Arroz className={dia} />
      </>
    )
  }
  return (
    <>
      <Cerdo className={noche} />
      <Salmon className={dia} />
    </>
  )
}
