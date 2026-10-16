import {
  CARNE,
  GRASA,
  ORDEN_CARNE,
  QUEMO,
  type Carne,
  type Coccion,
  type Formato,
  type Sello,
} from '@/lib/parrilla'
import { cn } from '@/lib/utils'

/*
 * El corte, dibujado. Reemplaza a la tarjeta teñida de antes (`.corte-*`), donde el color
 * cargaba todo y no le alcanzaba: cuatro cafés casi iguales, un solo color para varias redes
 * y lo quemado camuflado en la parrilla oscura.
 *
 * Acá cada cosa dice una sola cosa:
 * - la silueta, el formato (`formatoDe`, `src/lib/parrilla.ts`);
 * - la carne, la cocción (`CARNE`);
 * - las marcas, una por destino, cómo le fue a cada uno (`Sello`);
 * - el halo rojo y la banderita, que algo se quemó;
 * - el humo, que algo está saliendo ahora.
 *
 * Es un dibujo y nada más: no lleva texto encima. La hora, el texto del post y el estado en
 * palabras van debajo, en la chapa, donde se leen.
 *
 * Ver `docs/superpowers/specs/2026-10-16-el-corte-que-se-lee-design.md`.
 */

/** Las siluetas, en un lienzo de 120 × 64. */
const SILUETA: Record<Formato, string> = {
  bife: 'M12 33C10 17 30 7 58 7C86 7 110 13 111 31C112 47 94 58 64 58C36 58 14 50 12 33Z',
  tira: 'M5 20C28 14 92 14 115 20C117 28 117 38 115 46C92 52 28 52 5 46C3 38 3 28 5 20Z',
  entrana:
    'M3 30C16 20 32 18 48 22C64 26 76 28 92 23C104 19 113 19 117 23C119 30 118 37 116 42C104 40 94 43 82 46C64 50 50 46 36 45C22 44 11 47 4 48C1 42 1 36 3 30Z',
  chori: 'M14 31C14 21 26 18 40 19C54 20 66 23 80 22C96 21 106 23 107 32C108 42 96 46 80 46C66 46 54 43 40 44C26 45 14 41 14 31Z',
}

const FORMATOS = Object.keys(SILUETA) as Formato[]

/**
 * Lo que acompaña a cada carne: la grasa, los huesos de la tira, los nudos del chori y el
 * brillo. Se oscurecen con la cocción, como en una parrilla de verdad; la quemada no brilla.
 */
const VETAS: Record<Carne, { grasa: string; hueso: string; tuetano: string; nudo: string; brillo: [string, number] | null }> = {
  cruda: { grasa: '#f6ead8', hueso: '#f2e9da', tuetano: '#c99a8a', nudo: '#b5504a', brillo: ['#ffffff', 0.24] },
  sellada: { grasa: '#f0d6b0', hueso: '#efe0c8', tuetano: '#b98366', nudo: '#93452c', brillo: ['#ffffff', 0.12] },
  punto: { grasa: '#e3b878', hueso: GRASA, tuetano: '#9a6a44', nudo: '#5e3418', brillo: ['#f6c27a', 0.22] },
  quemada: { grasa: '#4a3a33', hueso: '#5d4f47', tuetano: '#2e221d', nudo: '#1a1210', brillo: null },
}

/** Las motas del chori. */
const MOTAS: Array<[number, number, number]> = [
  [26, 27, 1.6], [34, 36, 1.3], [44, 29, 1.8], [52, 38, 1.2], [60, 27, 1.5], [68, 35, 1.7], [76, 28, 1.2],
  [84, 38, 1.5], [92, 30, 1.6], [98, 36, 1.1], [30, 40, 1.1], [64, 42, 1.2], [88, 25, 1],
]

/**
 * Lo que comparten todos los cortes de la página: el degradado de cada carne, la silueta
 * de cada formato para recortar lo de adentro, y los tres difuminados. Va una sola vez,
 * en el layout del panel: cada corte los nombra por id en vez de repetirlos.
 *
 * `width`/`height` en cero y no `display: none`: Safari no pinta un degradado definido
 * dentro de un SVG oculto con `display: none`.
 */
export function CorteDefs() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden focusable="false">
      <defs>
        {ORDEN_CARNE.map((carne) => (
          <linearGradient key={carne} id={`tp-carne-${carne}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={CARNE[carne].claro} />
            <stop offset="0.5" stopColor={CARNE[carne].medio} />
            <stop offset="1" stopColor={CARNE[carne].hondo} />
          </linearGradient>
        ))}
        {FORMATOS.map((formato) => (
          <clipPath key={formato} id={`tp-silueta-${formato}`}>
            <path d={SILUETA[formato]} />
          </clipPath>
        ))}
        <filter id="tp-difuso" x="-20%" y="-50%" width="140%" height="200%">
          <feGaussianBlur stdDeviation="1.4" />
        </filter>
        <filter id="tp-sombra" x="-20%" y="-200%" width="140%" height="500%">
          <feGaussianBlur stdDeviation="2.6" />
        </filter>
        <filter id="tp-brillo" x="-30%" y="-60%" width="160%" height="220%">
          <feGaussianBlur stdDeviation="1.8" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
    </svg>
  )
}

function Textura({ formato, carne, huesos }: { formato: Formato; carne: Carne; huesos: number }) {
  const v = VETAS[carne]
  if (formato === 'bife') {
    return (
      <>
        <path d="M17 25C21 14 39 9 60 9C78 9 92 11 101 16" stroke={v.grasa} strokeWidth="6" strokeLinecap="round" fill="none" opacity=".85" />
        <ellipse cx="46" cy="32" rx="9" ry="5.5" fill={v.grasa} opacity=".5" />
        <path
          d="M62 26c6 2 10-1 16 2M70 41c5-2 9 1 14-1M28 42c4 1 7-1 10 1M84 31c4 1 6 0 9 2"
          stroke={v.grasa}
          strokeWidth="1.3"
          fill="none"
          strokeLinecap="round"
          opacity=".5"
        />
      </>
    )
  }
  if (formato === 'tira') {
    // Un hueso por archivo: cinco huesos son cinco láminas, y se cuentan sin abrir el post.
    const n = Math.max(huesos, 2)
    const paso = 110 / n
    const rx = Math.min(7, paso * 0.3)
    return (
      <>
        <path d="M6 21C30 15 90 15 114 21" stroke={v.grasa} strokeWidth="4" fill="none" opacity=".75" />
        {Array.from({ length: n }, (_, i) => {
          const cx = 5 + (i + 0.5) * paso
          return (
            <g key={i}>
              <ellipse cx={cx} cy="34" rx={rx} ry="9" fill={v.hueso} stroke="rgba(0,0,0,.28)" strokeWidth=".8" />
              <ellipse cx={cx} cy="34.5" rx={rx * 0.42} ry="3.6" fill={v.tuetano} />
            </g>
          )
        })}
      </>
    )
  }
  if (formato === 'entrana') {
    // La fibra en diagonal: es lo que hace que una tira larga se lea como entraña.
    return (
      <>
        {Array.from({ length: 19 }, (_, i) => {
          const x = 6 + i * 6
          return <path key={i} d={`M${x} 14L${x + 7} 54`} stroke="#000000" strokeOpacity=".16" strokeWidth="1" />
        })}
        <path d="M6 30C18 22 32 21 47 24C63 28 76 30 92 25C104 21 112 21 116 24" stroke={v.grasa} strokeWidth="1.8" fill="none" opacity=".55" />
      </>
    )
  }
  return (
    <>
      {MOTAS.map(([cx, cy, r]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} fill={v.grasa} opacity=".7" />
      ))}
      <path d="M24 23C40 21 70 25 96 24" stroke="#ffffff" strokeOpacity=".26" strokeWidth="2" fill="none" strokeLinecap="round" />
    </>
  )
}

/** Dónde cae la marca de cada destino: repartidas entre 34 y 92, o al centro si es una. */
function posiciones(n: number): number[] {
  if (n <= 1) return [62]
  return Array.from({ length: n }, (_, i) => 34 + (i * 58) / (n - 1))
}

/**
 * La marca de un destino: una diagonal del fierro sobre la carne.
 *
 * Punteada mientras no salió (y mientras sale: lo que se mueve ahí es el humo), quemada y
 * oscura cuando salió, carbonizada y con una brasa adentro cuando se quemó. La de la bandeja
 * de TikTok se quema hasta la mitad y lleva un punto ámbar: salió, pero falta la mano del
 * dueño. La de un reintento va en ámbar; la de un fierro frío, en acero.
 *
 * Los grosores suben en el corte chico para que, a 48 px, una marca se siga contando.
 */
function Marca({ x, sello, chico }: { x: number; sello: Sello; chico: boolean }) {
  const d = `M${x + 11} -2L${x - 11} 66`
  const g = chico ? 1.35 : 1
  const punteada = { fill: 'none', strokeLinecap: 'round' as const, strokeWidth: 3.2 * g, strokeDasharray: '3 5' }
  if (sello === 'bandeja') {
    return (
      <>
        <path d={`M${x + 11} -2L${x} 32`} fill="none" strokeLinecap="round" stroke="#24100a" strokeOpacity=".82" strokeWidth={5 * g} />
        <path d={`M${x} 32L${x - 11} 66`} {...punteada} stroke="rgba(30,10,6,.42)" />
        <circle cx={x} cy="32" r="3.4" style={{ fill: 'var(--color-caution)' }} stroke="#24100a" strokeWidth="1" />
      </>
    )
  }
  if (sello === 'pendiente' || sello === 'saliendo') return <path d={d} {...punteada} stroke="rgba(30,10,6,.42)" />
  if (sello === 'reintento') return <path d={d} {...punteada} style={{ stroke: 'var(--color-caution)' }} />
  if (sello === 'frio') {
    return <path d={d} fill="none" strokeLinecap="round" stroke="#9aa7b4" strokeOpacity=".8" strokeWidth={3 * g} strokeDasharray="2 4" />
  }
  if (sello === 'quemado') {
    return (
      <>
        <path d={d} fill="none" strokeLinecap="round" stroke="#0d0605" strokeWidth={6.5 * g} />
        <path d={d} className="late" fill="none" strokeLinecap="round" stroke="#ff5a2e" strokeWidth="1.6" filter="url(#tp-brillo)" />
      </>
    )
  }
  return <path d={d} fill="none" strokeLinecap="round" stroke="#24100a" strokeOpacity=".82" strokeWidth={5 * g} />
}

/**
 * Un corte. `sellos` son los de sus destinos, en el orden de sus destinos: una marca por
 * cada uno. `carne` es con qué se pinta y `coccion` si lleva el halo de quemado
 * (`carneDe` y `coccionDe`, en `src/lib/parrilla.ts`).
 *
 * Es solo el dibujo y va `aria-hidden`: quien lo pone escribe al lado, en palabras, lo que
 * el dibujo dice —el formato, la cocción y cómo le fue a cada destino—.
 */
export function Corte({
  formato,
  huesos = 0,
  carne,
  coccion,
  sellos,
  chico = false,
  llenado = 1,
  idDeLlenado = 'tp-llenado',
  className,
}: {
  formato: Formato
  huesos?: number
  carne: Carne
  coccion: Coccion
  sellos: readonly Sello[]
  /** El de «Se quemó», a 48 px: marcas más gruesas. */
  chico?: boolean
  /**
   * Cuánta carne tiene, de 0 a 1, de izquierda a derecha: el corte del compositor se va
   * llenando a medida que llegan sus archivos. Lo que falta se ve como la silueta punteada,
   * para que la forma final esté desde que se eligen.
   */
  llenado?: number
  /** El id del recorte del llenado: único por página si hay más de un corte a medio llenar. */
  idDeLlenado?: string
  className?: string
}) {
  const quemado = coccion === 'parcial' || coccion === 'quemada'
  const saliendo = sellos.includes('saliendo')
  const v = VETAS[carne]
  const xs = posiciones(sellos.length)
  const silueta = SILUETA[formato]
  const lleno = Math.max(0, Math.min(1, llenado))
  const aMedias = lleno < 1
  return (
    <span className={cn('relative block', className)} aria-hidden>
      {/* El humo: lo único que se repite, y solo mientras algo está saliendo. */}
      {saliendo ? (
        <svg viewBox="0 0 60 50" className="pointer-events-none absolute bottom-[calc(100%-0.5rem)] left-1/2 w-1/3 -translate-x-1/2 overflow-visible">
          {[20, 31, 42].map((x, i) => (
            <path
              key={x}
              className={cn('voluta', i === 1 && 'voluta-2', i === 2 && 'voluta-3')}
              d={`M${x} 48C${x - 6} 40 ${x + 6} 34 ${x} 26C${x - 6} 18 ${x + 6} 12 ${x} 4`}
              fill="none"
              stroke="rgba(236,230,222,.55)"
              strokeWidth="3.4"
              strokeLinecap="round"
            />
          ))}
        </svg>
      ) : null}
      <svg viewBox="0 0 120 64" className="block h-auto w-full overflow-visible">
        {aMedias ? (
          <defs>
            <clipPath id={idDeLlenado}>
              <rect x="-4" y="-12" width={128 * lleno} height="90" />
            </clipPath>
          </defs>
        ) : null}
        <ellipse cx="60" cy="59" rx="46" ry="4.5" fill="#000" opacity=".55" filter="url(#tp-sombra)" />
        {/* Lo que todavía no llegó: la silueta punteada, debajo de la carne que ya está. */}
        {aMedias ? (
          <path d={silueta} fill="rgba(242,235,226,.04)" stroke="rgba(242,235,226,.34)" strokeWidth="1.1" strokeDasharray="3 3" />
        ) : null}
        <g clipPath={aMedias ? `url(#${idDeLlenado})` : undefined}>
        {formato === 'chori' ? (
          <>
            <path d="M15 31L6 26.5L6.8 35.5Z" fill={v.nudo} />
            <path d="M106 32L115 27.5L114.4 36.5Z" fill={v.nudo} />
          </>
        ) : null}
        <g clipPath={`url(#tp-silueta-${formato})`}>
          <path d={silueta} fill={`url(#tp-carne-${carne})`} />
          <Textura formato={formato} carne={carne} huesos={huesos} />
          {v.brillo ? <ellipse cx="44" cy="19" rx="28" ry="5" fill={v.brillo[0]} opacity={v.brillo[1]} filter="url(#tp-difuso)" /> : null}
          {coccion === 'quemada' ? (
            <path
              className="late"
              d="M16 36l9-5 6 6 10-4 7 5M60 24l7 6 8-3 6 7M66 44l8-5 9 4 8-6"
              fill="none"
              stroke="#ff6b3d"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#tp-brillo)"
            />
          ) : null}
          {sellos.map((sello, i) => (
            <Marca key={i} x={xs[i]!} sello={sello} chico={chico} />
          ))}
        </g>
        <path d={silueta} fill="none" stroke="rgba(0,0,0,.45)" strokeWidth="1" />
        </g>
        {quemado ? (
          <>
            {/* El halo late tres veces y después queda encendido hasta que se resuelva. */}
            <path d={silueta} className="late" fill="none" stroke={QUEMO} strokeWidth="2.4" filter="url(#tp-brillo)" />
            <path d="M107 20V-9" stroke="#d9cbb5" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M107 -9L122 -4L107 1Z" fill={QUEMO} />
          </>
        ) : null}
      </svg>
    </span>
  )
}
