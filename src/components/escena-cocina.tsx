import { useId } from 'react'
import { cn } from '@/lib/utils'

/*
 * La escena de La Cocina, arriba de «El chef de la casa»: de noche, un parrillero medio gaucho
 * aviva el fuego de un asado al palo; de día, un maestro de sushi espera con el cuchillo largo
 * junto a un atún entero. Es un dibujo y nada más: el estado va en palabras debajo. Lo único que
 * cambia con el estado es la luz: con la cocina abierta, el fuego arde (de día, el farol está
 * prendido); cerrada, quedan las brasas y el farol apagado.
 *
 * Misma gramática que el corte y la pieza de sushi: siluetas planas, la carne y el pescado con
 * sus degradados, la madera de la tabla. Los dos modos van en la página y el modo esconde uno
 * (`.solo-noche`, `.solo-dia`). Lienzo de 640 × 220: cabe de ancho en el panel, y en un teléfono
 * baja a unos 110 px de alto sin perder la silueta de nadie.
 */

const ESTRELLAS: Array<[number, number, number]> = [
  [40, 30, 1.2], [92, 58, 0.9], [150, 22, 1.1], [210, 46, 0.8], [276, 18, 1.2], [340, 40, 0.9],
  [398, 24, 1], [452, 52, 0.8], [612, 70, 1], [600, 18, 0.9], [120, 90, 0.7], [380, 80, 0.7],
]

/** El parrillero, el asado al palo y el fuego. */
function AsadoAlPalo({ encendida, className }: { encendida: boolean; className?: string }) {
  const id = useId()
  return (
    <svg viewBox="0 0 640 220" className={className} aria-hidden>
      <defs>
        <linearGradient id={`${id}cielo`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0d131c" />
          <stop offset="1" stopColor="#1f2733" />
        </linearGradient>
        <radialGradient id={`${id}brillo`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ff8a3d" stopOpacity={encendida ? 0.55 : 0.22} />
          <stop offset="1" stopColor="#ff8a3d" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}carne`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d47d50" />
          <stop offset="0.5" stopColor="#c46a40" />
          <stop offset="1" stopColor="#8f4426" />
        </linearGradient>
        <clipPath id={`${id}marco`}>
          <rect width="640" height="220" rx="14" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}marco)`}>
        <rect width="640" height="220" fill={`url(#${id}cielo)`} />
        {ESTRELLAS.map(([x, y, r]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill="#f2ebe2" opacity="0.55" />
        ))}
        {/* La luna, en cuarto. */}
        <circle cx="562" cy="44" r="15" fill="#f2ebe2" opacity="0.9" />
        <circle cx="569" cy="39" r="13.5" fill="#111822" />
        {/* Los cerros y el suelo. */}
        <path d="M0 176C90 158 170 168 250 172S430 156 520 166S610 172 640 168V220H0Z" fill="#171310" />
        <ellipse cx="236" cy="184" rx="200" ry="74" fill={`url(#${id}brillo)`} />
        <path d="M0 194H640V220H0Z" fill="#120e0b" />

        {/* La cruz, clavada y tirada hacia el fuego, con el cordero abierto. */}
        <path d="M331 204L296 36" stroke="#8d9aa6" strokeWidth="5" strokeLinecap="round" />
        <path d="M349 54L255 74" stroke="#8d9aa6" strokeWidth="4" strokeLinecap="round" />
        <path d="M357 139L281 156" stroke="#8d9aa6" strokeWidth="4" strokeLinecap="round" />
        <g transform="rotate(-11.7 306 104)">
          {/* Las patas del cordero abierto, en las cuatro puntas. */}
          <path d="M266 62L248 44M346 62L364 44M266 146L250 166M346 146L362 166" stroke="#9a4a2e" strokeWidth="11" strokeLinecap="round" />
          <path d="M248 44l-4-4M364 44l4-4M250 166l-4 4M362 166l4 4" stroke="#f2e9da" strokeWidth="7" strokeLinecap="round" />
          <path
            d="M262 58C276 50 336 50 350 58C356 76 354 92 350 104C356 118 356 136 350 150C336 158 276 158 262 150C256 136 256 118 262 104C258 92 256 76 262 58Z"
            fill={`url(#${id}carne)`}
          />
          <path d="M262 58C276 50 336 50 350 58" stroke="#f0d6b0" strokeWidth="5" strokeLinecap="round" fill="none" />
          {[74, 90, 106, 122, 138].map((y) => (
            <path key={y} d={`M268 ${y}Q306 ${y - 4} 344 ${y}`} stroke="#f0d6b0" strokeOpacity="0.55" strokeWidth="3" strokeLinecap="round" fill="none" />
          ))}
        </g>
        {/* Los alambres que lo amarran a la cruz. */}
        <path d="M262 70l8 6M342 54l6 8M286 150l8 6M350 136l6 8" stroke="#c9d3dc" strokeWidth="1.6" strokeLinecap="round" />

        {/* El fuego: los leños, las brasas y, con la cocina abierta, las llamas. */}
        <g>
          <rect x="186" y="182" width="96" height="11" rx="5.5" fill="#5b3a22" transform="rotate(-10 234 187)" />
          <rect x="186" y="182" width="96" height="11" rx="5.5" fill="#4a2f1b" transform="rotate(12 234 187)" />
          <ellipse cx="234" cy="191" rx="44" ry="7" fill="#ff5a1f" opacity={encendida ? 0.95 : 0.75} />
          <ellipse cx="234" cy="190" rx="26" ry="4" fill="#ffd166" opacity={encendida ? 0.9 : 0.45} />
          {encendida ? (
            <>
              <path
                className="fogata"
                d="M234 104C242 126 270 138 266 168C264 184 250 191 234 191C218 191 203 184 202 168C199 144 224 132 234 104Z"
                fill="#e8590c"
              />
              <path
                className="fogata fogata-2"
                d="M234 126C240 140 258 150 255 172C253 185 244 190 234 190C224 190 215 185 214 172C212 154 228 144 234 126Z"
                fill="#ff8a3d"
              />
              <path
                className="fogata"
                d="M234 150C238 160 247 167 245 179C244 187 239 190 234 190C229 190 224 187 223 179C222 169 231 161 234 150Z"
                fill="#ffd166"
              />
              <path className="fogata fogata-2" d="M205 150C212 162 216 172 212 186L198 186C195 174 199 162 205 150Z" fill="#ff8a3d" />
              <path className="fogata" d="M265 156C271 166 274 176 270 188L258 188C256 178 259 166 265 156Z" fill="#ff8a3d" />
              {[[222, 92], [252, 80], [238, 66]].map(([x, y]) => (
                <circle key={`${x}`} cx={x} cy={y} r="1.8" fill="#ffd166" opacity="0.8" />
              ))}
            </>
          ) : (
            <path className="voluta" d="M238 176c-10-14 10-24 0-38c-8-12 8-20 2-32" stroke="#8d9aa6" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.4" />
          )}
        </g>

        {/* El parrillero: sombrero de ala, pañuelo, poncho y bombachas, con el mate en una mano y el
            atizador en la otra. */}
        <g>
          <path d="M440 132L268 184" stroke="#5b3a22" strokeWidth="4" strokeLinecap="round" />
          <circle cx="268" cy="184" r="3" fill="#ff8a3d" />
          {/* Las bombachas y las botas. */}
          <path d="M478 150L472 190H494L500 164L506 190H528L522 150Z" fill="#3a3f47" />
          <path d="M486 160L484 186M514 160L516 186" stroke="#4b515a" strokeWidth="2" strokeLinecap="round" />
          <rect x="466" y="186" width="30" height="13" rx="4" fill="#2a1d14" />
          <rect x="504" y="186" width="30" height="13" rx="4" fill="#2a1d14" />
          {/* El poncho, con sus listas y sus flecos. */}
          <path d="M470 100Q500 90 530 100L554 154Q500 162 446 154Z" fill="#7c2a1f" />
          <path d="M452 142Q500 150 548 142" stroke="#e8d7b8" strokeWidth="3" fill="none" />
          <path d="M450 148Q500 156 550 148" stroke="#1d1a18" strokeWidth="3" fill="none" />
          {Array.from({ length: 17 }, (_, n) => 450 + n * 6.2).map((x) => (
            <path key={x} d={`M${x} ${155 + Math.sin(((x - 446) / 108) * Math.PI) * 6}v6`} stroke="#e8d7b8" strokeWidth="1.3" strokeLinecap="round" />
          ))}
          {/* La mano del atizador y la del mate. */}
          <circle cx="442" cy="131" r="6.5" fill="#c98f6a" />
          <path d="M466 112Q452 120 444 128" stroke="#7c2a1f" strokeWidth="11" strokeLinecap="round" fill="none" />
          <path d="M532 112Q540 120 532 126" stroke="#7c2a1f" strokeWidth="11" strokeLinecap="round" fill="none" />
          <ellipse cx="528" cy="124" rx="7" ry="8" fill="#7a5232" />
          <path d="M530 117L535 106" stroke="#c9d3dc" strokeWidth="2" strokeLinecap="round" />
          <circle cx="524" cy="128" r="5.5" fill="#c98f6a" />
          {/* El pañuelo, la cara y el sombrero. */}
          <path d="M487 93H513L500 106Z" fill="#c0392b" />
          <circle cx="500" cy="80" r="14" fill="#c98f6a" />
          <path d="M490 86Q500 91 510 86Q506 92 500 91Q494 92 490 86Z" fill="#3b2a20" />
          <circle cx="494.5" cy="78" r="1.7" fill="#2a1d14" />
          <circle cx="505.5" cy="78" r="1.7" fill="#2a1d14" />
          <rect x="477" y="44" width="46" height="22" rx="4" fill="#1d1a18" />
          <rect x="477" y="58" width="46" height="5" fill="#8a2f22" />
          <ellipse cx="500" cy="66" rx="42" ry="7" fill="#1d1a18" />
        </g>
      </g>
    </svg>
  )
}

const MADERA = { claro: '#e2c497', medio: '#d2ad78', veta: '#b98f5a' }

/** El maestro de sushi, el atún entero sobre el mesón de madera y el farol. */
function FaenaDelAtun({ encendida, className }: { encendida: boolean; className?: string }) {
  const id = useId()
  const aletillas = [192, 176, 160, 144, 128]
  return (
    <svg viewBox="0 0 640 220" className={className} aria-hidden>
      <defs>
        <linearGradient id={`${id}fondo`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fbf6ee" />
          <stop offset="1" stopColor="#f0e6d4" />
        </linearGradient>
        <linearGradient id={`${id}atun`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1f3249" />
          <stop offset="0.45" stopColor="#2f4a6b" />
          <stop offset="0.6" stopColor="#c9d3dc" />
          <stop offset="1" stopColor="#eef2f5" />
        </linearGradient>
        <radialGradient id={`${id}farol`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffd166" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ffd166" stopOpacity="0" />
        </radialGradient>
        <clipPath id={`${id}marco`}>
          <rect width="640" height="220" rx="14" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}marco)`}>
        <rect width="640" height="220" fill={`url(#${id}fondo)`} />

        {/* El noren de la entrada, con su vara. */}
        <rect x="20" y="0" width="236" height="5" fill="#8f6b45" />
        {[24, 100, 176].map((x) => (
          <g key={x}>
            <rect x={x} y="5" width="72" height="44" fill="#2f4a6b" />
            <path d={`M${x + 8} 38H${x + 64}`} stroke="#fbf6ee" strokeWidth="2" opacity="0.7" />
          </g>
        ))}
        <circle cx="136" cy="24" r="9" fill="#fbf6ee" opacity="0.85" />

        {/* El farol de papel: prendido con la cocina abierta. */}
        <path d="M590 0V16" stroke="#1d1d1d" strokeWidth="1.5" />
        {encendida ? <circle cx="590" cy="40" r="48" fill={`url(#${id}farol)`} /> : null}
        <ellipse cx="590" cy="40" rx="17" ry="22" fill={encendida ? '#e04a3a' : '#bfa9a0'} />
        {[30, 40, 50].map((y) => (
          <path key={y} d={`M574 ${y}Q590 ${y + 3} 606 ${y}`} stroke="#000" strokeOpacity="0.15" strokeWidth="1" fill="none" />
        ))}
        <rect x="580" y="15" width="20" height="5" rx="1" fill="#1d1d1d" />
        <rect x="580" y="60" width="20" height="5" rx="1" fill="#1d1d1d" />

        {/* El maestro, detrás del mesón: gorrito alto, chaqueta de cuello cruzado y el cuchillo largo. */}
        <g>
          <path d="M474 168C474 120 488 102 512 100C536 102 550 120 550 168Z" fill="#ffffff" stroke="#d9ccb6" strokeWidth="1.5" />
          <path d="M499 101L505 100L531 140L525 142Z" fill="#2f4a6b" />
          <path d="M525 101L519 100L507 120L512 123Z" fill="#2f4a6b" />
          <path d="M546 120Q560 140 556 160" stroke="#ffffff" strokeWidth="12" strokeLinecap="round" fill="none" />
          <path d="M546 120Q560 140 556 160" stroke="#d9ccb6" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.6" />
          <circle cx="555" cy="163" r="6.5" fill="#eec39a" />
          <circle cx="512" cy="76" r="15" fill="#eec39a" />
          <path d="M503 74q3-2.5 6 0M515 74q3-2.5 6 0" stroke="#2b2b2b" strokeWidth="1.6" strokeLinecap="round" fill="none" />
          <path d="M507 84q5 3 10 0" stroke="#8a4b3a" strokeWidth="1.4" strokeLinecap="round" fill="none" />
          <path d="M489 26Q489 18 497 18H527Q535 18 535 26V60H489Z" fill="#ffffff" stroke="#d9ccb6" strokeWidth="1.5" />
          <rect x="489" y="51" width="46" height="9" fill="#f2ece2" stroke="#d9ccb6" strokeWidth="1" />
        </g>

        {/* El mesón de madera. */}
        <rect x="20" y="200" width="600" height="10" fill="#6b5a44" opacity="0.12" />
        <rect x="20" y="166" width="600" height="32" rx="4" fill={MADERA.medio} />
        <rect x="20" y="166" width="600" height="6" rx="3" fill={MADERA.claro} />
        <path d="M44 184H190M230 190H360M400 182H520M548 189H600" stroke={MADERA.veta} strokeWidth="1.4" strokeLinecap="round" />

        {/* El atún entero, de los de primera: el lomo azul, el vientre plateado y las aletillas amarillas. */}
        <g>
          <path d="M114 139C100 126 86 110 62 98C76 116 81 128 81 139C81 150 76 162 62 180C86 168 100 152 114 139Z" fill="#24394f" />
          <path d="M404 141C398 121 352 108 264 107C192 106 142 120 112 133L112 146C142 158 192 168 264 168C352 168 398 160 404 141Z" fill={`url(#${id}atun)`} />
          <path d="M320 108C314 96 302 88 286 85C292 96 294 102 292 109Z" fill="#24394f" />
          <path d="M216 111C212 101 204 95 195 92C197 100 197 106 195 112Z" fill="#24394f" />
          <path d="M216 165C212 173 205 178 196 180C198 174 198 170 196 166Z" fill="#24394f" />
          {aletillas.map((x, n) => (
            <g key={x}>
              <path d={`M${x} ${113 + n * 4}l-8-6l4 7Z`} fill="#e8b923" />
              <path d={`M${x} ${163 - n * 4}l-8 6l4-7Z`} fill="#e8b923" />
            </g>
          ))}
          <path d="M354 140C332 141 308 147 290 155C312 151 334 149 354 147Z" fill="#24394f" opacity="0.9" />
          <path d="M400 139C332 133 222 131 116 140" stroke="#5d7891" strokeWidth="1.5" opacity="0.6" fill="none" />
          <path d="M382 116C332 108 262 108 202 116" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" opacity="0.35" fill="none" />
          <path d="M368 119C374 133 374 147 366 161" stroke="#24394f" strokeWidth="2" opacity="0.55" fill="none" />
          <circle cx="381" cy="133" r="6" fill="#f4f6f8" stroke="#24394f" strokeWidth="1.5" />
          <circle cx="382" cy="133" r="3" fill="#111" />
          <path d="M404 141L393 145" stroke="#24394f" strokeWidth="1.6" strokeLinecap="round" />
          {/* El sello de la subasta: el de primera. */}
          <circle cx="132" cy="139" r="7" fill="#c0392b" />
          <circle cx="132" cy="139" r="4" fill="none" stroke="#fbf6ee" strokeWidth="1.3" />
        </g>

        {/* El brazo del cuchillo, con el cuchillo largo levantado sobre el lomo: listo para faenar. */}
        <g>
          <path d="M486 112Q470 112 460 110" stroke="#ffffff" strokeWidth="13" strokeLinecap="round" fill="none" />
          <path d="M486 112Q470 112 460 110" stroke="#d9ccb6" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.6" />
          <path d="M455 106L481 103L482 109L456 112Z" fill="#b98f5a" />
          <path d="M450 106L318 88L320 93L450 113Z" fill="#e6edf2" stroke="#8d9aa6" strokeWidth="1" />
          <path d="M447 109L324 91" stroke="#ffffff" strokeWidth="1" opacity="0.9" />
          <circle cx="455" cy="110" r="7" fill="#eec39a" />
        </g>

        {/* La soya y el wasabi, al lado. */}
        <ellipse cx="588" cy="166" rx="15" ry="4.5" fill="#ffffff" stroke="#d9ccb6" />
        <ellipse cx="588" cy="165.5" rx="9" ry="2.6" fill="#3b2414" />
        <path d="M600 167Q607 154 614 167Z" fill="#a9c864" />
      </g>
    </svg>
  )
}

/** La escena en los dos modos, y el modo esconde uno. */
export function EscenaCocina({ encendida, className }: { encendida: boolean; className?: string }) {
  return (
    <>
      <AsadoAlPalo encendida={encendida} className={cn('solo-noche mx-auto h-auto w-full max-w-2xl', className)} />
      <FaenaDelAtun encendida={encendida} className={cn('solo-dia mx-auto h-auto w-full max-w-2xl', className)} />
    </>
  )
}
