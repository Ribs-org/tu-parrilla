import { useId } from 'react'
import { GANCHOS, nivelDePeso, type ClaseMaterial, type EstadoDeLaCuota } from '@/lib/cocina/bodega'
import { cn } from '@/lib/utils'
import {
  ATUN,
  CRUDA,
  Degradado,
  FIERRO,
  FiguraArroz,
  FiguraAtun,
  FiguraChoclo,
  FiguraPimenton,
  FiguraRes,
  FiguraSalmon,
  FiguraVerduras,
  GRASA,
  HUESO,
  MADERA,
  Pescado,
  Tabla,
} from './dibujos-insumo'

/*
 * Lo que hay en la cámara de frío (de día, la nevera), dibujado: cada material tiene la forma de lo
 * que es y el tamaño de lo que pesa (`docs/superpowers/specs/2026-11-02-la-bodega-design.md`). Los
 * nombres de cada tamaño están en `NOMBRES_DE_PESO` (`src/lib/cocina/bodega.ts`), y el dibujo va
 * siempre con ellos al lado, en palabras.
 *
 * | Lo que es | De noche, la carnicería                                    | De día, la barra de sushi                              |
 * |-----------|------------------------------------------------------------|--------------------------------------------------------|
 * | Video     | un corte, un lomo, un cuarto, media res, la vaca entera     | un trozo, un filete, un salmón, un atún, un atún gigante |
 * | Audio     | una longaniza, un par, una ristra, la ristra larga          | un tentáculo, medio pulpo, un pulpo, un pulpo gigante   |
 * | Imagen    | un pimentón, el choclo y el pimentón, un cajón de verduras  | un onigiri, un bol de arroz, una tina de arroz          |
 * | Otro      | un paquete de papel de carnicería, un fardo                 | un furoshiki, uno grande                                |
 *
 * La ristra de longanizas y los tentáculos se parecen a la onda de un sonido, y por eso son el audio.
 * Lo más grande no cabe: la vaca son las dos medias reses, y el atún gigante se sale de la tabla.
 * Los dos modos van en la página y el modo esconde uno (`.solo-noche`, `.solo-dia`). Lienzo de
 * 96 × 96, como los demás dibujos de la cocina.
 */

const PAPEL = { claro: '#efe4cf', hondo: '#dccaa9' }
const PITA = '#a07850'
const LONGANIZA = { claro: '#d57a5c', medio: '#b4533c', hondo: '#8a3826' }
const PULPO = { claro: '#ec9a86', medio: '#d9725f', hondo: '#b4513f', ventosa: '#f8d3c7' }
const HIELO = { claro: '#f2f9fd', medio: '#d7ebf6', borde: '#a9cfe3' }

// --- De noche --------------------------------------------------------------------------------

/** Un bife sobre su papel: el corte más chico. */
function UnCorte({ id }: { id: string }) {
  return (
    <>
      <defs>
        <Degradado id={`${id}c`} c={CRUDA} />
      </defs>
      <rect x="17" y="31" width="62" height="44" rx="3" fill={PAPEL.claro} stroke={PAPEL.hondo} transform="rotate(-6 48 53)" />
      <path d="M30 51C30 41 40 37 50 38C62 39 68 45 67 54C66 63 57 69 47 68C36 67 30 61 30 51Z" fill={`url(#${id}c)`} />
      <path d="M31.5 47C34 41 41 37.5 50 38" stroke={GRASA} strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M38 53Q45 50 55 54M41 60Q48 58 57 61" stroke={GRASA} strokeOpacity=".55" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </>
  )
}

/** Un lomo entero amarrado con pita, sobre el papel. */
function UnLomo({ id }: { id: string }) {
  return (
    <>
      <defs>
        <Degradado id={`${id}c`} c={CRUDA} />
      </defs>
      <rect x="7" y="36" width="82" height="36" rx="3" fill={PAPEL.claro} stroke={PAPEL.hondo} transform="rotate(-4 48 54)" />
      <path d="M13 54C13 46 21 43 33 43H67C79 43 85 47 85 54C85 61 79 65 67 65H33C21 65 13 62 13 54Z" fill={`url(#${id}c)`} />
      <ellipse cx="82" cy="54" rx="4" ry="10" fill="#d0675a" />
      <path d="M81 48Q83 54 81 60" stroke={GRASA} strokeOpacity=".6" strokeWidth="1.2" fill="none" />
      <path d="M17 49C24 45 50 44.5 74 46" stroke={GRASA} strokeOpacity=".7" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      {[30, 46, 62].map((x) => (
        <path key={x} d={`M${x} 42.5C${x - 2} 50 ${x - 2} 58 ${x} 65.5`} stroke={PITA} strokeWidth="1.8" fill="none" />
      ))}
    </>
  )
}

/** Un cuarto trasero colgando del gancho, con la punta del hueso arriba: más chico que la media res. */
function UnCuarto({ id }: { id: string }) {
  return (
    <>
      <defs>
        <Degradado id={`${id}c`} c={CRUDA} />
      </defs>
      <path d="M32 7H64" stroke={FIERRO} strokeWidth="3" strokeLinecap="round" />
      <path d="M48 7V14C48 18 44 19 42.5 17" stroke={FIERRO} strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <path d="M41 22C35 26 31 37 33 49C35 61 40 70 45 76C48 80 54 79 56 74C60 64 63 51 61 39C59 28 54 21 48 20.5C45.5 20.3 43 20.8 41 22Z" fill={`url(#${id}c)`} />
      <path d="M54 23C59 30 61.5 41 60 53C59 62 57 68 55 73" stroke={GRASA} strokeWidth="3.6" fill="none" strokeLinecap="round" />
      <circle cx="45.5" cy="22" r="4.8" fill={HUESO} />
      <circle cx="45.5" cy="22" r="2" fill="#e6d9c3" />
      <path d="M37 52Q46 50 56 53M39 61Q47 59.5 55 62" stroke={GRASA} strokeOpacity=".55" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </>
  )
}

/** La vaca entera: las dos medias reses colgadas una al lado de la otra, que casi no caben. */
function LaVacaEntera({ id }: { id: string }) {
  return (
    <>
      <path d="M3 6H93" stroke={FIERRO} strokeWidth="3" strokeLinecap="round" />
      <g transform="translate(-19 0)">
        <FiguraRes id={`${id}i`} />
      </g>
      <g transform="translate(115 0) scale(-1 1)">
        <FiguraRes id={`${id}d`} />
      </g>
    </>
  )
}

/** Una longaniza, acostada: el largo va a lo ancho y el `transform` la pone donde va. */
function Longaniza({ id, x, y, giro }: { id: string; x: number; y: number; giro: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${giro})`}>
      <rect x="-11" y="-4.6" width="22" height="9.2" rx="4.6" fill={`url(#${id})`} />
      <path d="M-7 -2.2H6" stroke="#e9a084" strokeOpacity=".7" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="-11.6" cy="0" r="1.4" fill={PITA} />
      <circle cx="11.6" cy="0" r="1.4" fill={PITA} />
    </g>
  )
}

type Punto = { x: number; y: number; giro: number }

/** Dónde va cada pieza de una ristra que cuelga entre dos puntos: a lo largo de la curva, siguiendo su pendiente. */
function aLoLargo(x0: number, y0: number, x1: number, y1: number, caida: number, n: number): { camino: string; puntos: Punto[] } {
  const cx = (x0 + x1) / 2
  const cy = (y0 + y1) / 2 + caida * 2
  const puntos = Array.from({ length: n }, (_, i) => {
    const t = (i + 1) / (n + 1)
    const x = (1 - t) ** 2 * x0 + 2 * (1 - t) * t * cx + t ** 2 * x1
    const y = (1 - t) ** 2 * y0 + 2 * (1 - t) * t * cy + t ** 2 * y1
    const dx = 2 * (1 - t) * (cx - x0) + 2 * t * (x1 - cx)
    const dy = 2 * (1 - t) * (cy - y0) + 2 * t * (y1 - cy)
    return { x, y, giro: (Math.atan2(dy, dx) * 180) / Math.PI }
  })
  return { camino: `M${x0} ${y0}Q${cx} ${cy} ${x1} ${y1}`, puntos }
}

/** La ristra de longanizas, que se alarga con el audio: una, dos, cuatro o siete. */
function Ristra({ id, nivel }: { id: string; nivel: number }) {
  const tramos =
    nivel === 0
      ? [{ camino: 'M48 6V30', puntos: [{ x: 48, y: 42, giro: 90 }] }]
      : nivel === 1
        ? [aLoLargo(30, 10, 66, 10, 22, 2)]
        : nivel === 2
          ? [aLoLargo(12, 10, 84, 10, 30, 4)]
          : [aLoLargo(6, 10, 48, 10, 26, 3), aLoLargo(48, 10, 90, 10, 34, 4)]
  return (
    <>
      <defs>
        <Degradado id={id} c={LONGANIZA} />
      </defs>
      <path d={nivel === 0 ? 'M36 6H60' : 'M4 10H92'} stroke={FIERRO} strokeWidth="2.6" strokeLinecap="round" />
      {tramos.map((t) => (
        <path key={t.camino} d={t.camino} stroke={PITA} strokeWidth="1.4" fill="none" />
      ))}
      {tramos
        .flatMap((t) => t.puntos)
        .map((p, i) => (
          <Longaniza key={i} id={id} {...p} />
        ))}
    </>
  )
}

/** Un cajón de madera con verduras asomando: el choclo, el pimentón y tomates. */
function UnCajon() {
  return (
    <>
      <g transform="translate(-6 -8) scale(.9)">
        <FiguraChoclo />
      </g>
      <g transform="translate(-30 -18)">
        <FiguraPimenton />
      </g>
      <circle cx="60" cy="47" r="8" fill="#d9473f" />
      <circle cx="73" cy="49" r="7" fill="#c73c35" />
      <path d="M57 40.5L60 43L63 40.5M70 43L73 45L76 43" stroke="#4f8f3a" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <rect x="9" y="50" width="78" height="32" rx="2" fill="#a8763f" />
      <path d="M9 61H87M9 72H87" stroke="#87592c" strokeWidth="1.6" />
      <rect x="9" y="50" width="78" height="4" fill="#c99a62" />
      <path d="M14 50V82M82 50V82" stroke="#87592c" strokeWidth="2.4" />
    </>
  )
}

/** Un paquete envuelto en papel de carnicería y amarrado con pita en cruz. */
function Paquete({ x, y, ancho, alto }: { x: number; y: number; ancho: number; alto: number }) {
  return (
    <g>
      <rect x={x} y={y} width={ancho} height={alto} rx="3" fill={PAPEL.claro} stroke={PAPEL.hondo} strokeWidth="1.2" />
      <path d={`M${x + 4} ${y + 4}L${x + ancho * 0.35} ${y + alto * 0.5}`} stroke={PAPEL.hondo} strokeWidth="1" />
      <path d={`M${x + ancho / 2} ${y}V${y + alto}M${x} ${y + alto / 2}H${x + ancho}`} stroke={PITA} strokeWidth="1.8" />
      <path d={`M${x + ancho / 2} ${y + alto / 2}c-5 -6 -9 -3 -6 0c-3 3 1 6 6 0c5 -6 9 -3 6 0c3 3 -1 6 -6 0Z`} fill="none" stroke={PITA} strokeWidth="1.5" />
    </g>
  )
}

// --- De día ----------------------------------------------------------------------------------

/** Un trozo de atún para sashimi (el saku) sobre una tabla chica. */
function UnTrozo({ id }: { id: string }) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}t`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d4535b" />
          <stop offset="1" stopColor="#a3303b" />
        </linearGradient>
      </defs>
      <rect x="20" y="58" width="56" height="11" rx="3" fill={MADERA.medio} />
      <rect x="20" y="58" width="56" height="3.5" rx="1.75" fill={MADERA.claro} />
      <rect x="27" y="39" width="42" height="19" rx="3" fill={`url(#${id}t)`} />
      <path d="M33 41L39 56M43 41L49 56M53 41L59 56" stroke="#f3c9c3" strokeOpacity=".55" strokeWidth="1.3" />
    </>
  )
}

/** Un filete de salmón sobre la tabla, con sus vetas blancas. */
function UnFilete() {
  return (
    <>
      <Tabla />
      <path d="M12 51C18 40 58 38 80 44C85 49 82 56 77 58C58 63 22 63 12 51Z" fill="#ef8a5c" />
      <path d="M12 51C18 46 40 44 80 44C85 49 82 56 77 58C58 63 22 63 12 51Z" fill="#e8743f" opacity=".45" />
      {[26, 38, 50, 62].map((x) => (
        <path key={x} d={`M${x} 44Q${x + 5} 51 ${x + 1} 59`} stroke="#ffe0cf" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      ))}
    </>
  )
}

/** El atún gigante: más largo que la tabla, sobre su cama de hielo. Se sale del cuadro. */
function UnAtunGigante({ id }: { id: string }) {
  return (
    <>
      <Tabla />
      {[12, 26, 40, 54, 68, 80].map((x, i) => (
        <rect key={x} x={x} y={i % 2 ? 55 : 57} width="9" height="6" rx="2" fill={HIELO.claro} stroke={HIELO.borde} strokeWidth=".8" />
      ))}
      <g transform="translate(-6 -4)">
        <Pescado id={`${id}p`} largo={88} {...ATUN} />
      </g>
    </>
  )
}

/** Un tentáculo que se enrolla: círculos que se achican a lo largo de una espiral, con sus ventosas. */
function Tentaculo({ x, y, angulo, largo, curva, grosor }: { x: number; y: number; angulo: number; largo: number; curva: number; grosor: number }) {
  const pasos = Math.round(largo / 2.2)
  let px = x
  let py = y
  const puntos: Array<{ x: number; y: number; r: number; a: number }> = []
  for (let i = 0; i <= pasos; i++) {
    const s = i / pasos
    const a = ((angulo + curva * s ** 1.6) * Math.PI) / 180
    puntos.push({ x: px, y: py, r: grosor * (1 - 0.78 * s), a })
    px += Math.cos(a) * 2.2
    py += Math.sin(a) * 2.2
  }
  return (
    <g>
      {puntos.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={p.r} fill={PULPO.medio} />
      ))}
      {puntos
        .filter((_, i) => i % 3 === 1)
        .map((p, i) => (
          <circle
            key={`v${i}`}
            cx={p.x + Math.cos(p.a + Math.PI / 2) * p.r * 0.55}
            cy={p.y + Math.sin(p.a + Math.PI / 2) * p.r * 0.55}
            r={Math.max(0.7, p.r * 0.32)}
            fill={PULPO.ventosa}
          />
        ))}
    </g>
  )
}

/** La cabeza del pulpo, con sus ojos. */
function CabezaDePulpo({ x, y, r, id }: { x: number; y: number; r: number; id: string }) {
  return (
    <g>
      <defs>
        <radialGradient id={`${id}cab`} cx=".4" cy=".35" r=".7">
          <stop offset="0" stopColor={PULPO.claro} />
          <stop offset="1" stopColor={PULPO.hondo} />
        </radialGradient>
      </defs>
      <ellipse cx={x} cy={y} rx={r} ry={r * 1.15} fill={`url(#${id}cab)`} />
      <circle cx={x - r * 0.38} cy={y + r * 0.45} r={r * 0.16} fill="#ffffff" />
      <circle cx={x + r * 0.38} cy={y + r * 0.45} r={r * 0.16} fill="#ffffff" />
      <circle cx={x - r * 0.38} cy={y + r * 0.48} r={r * 0.08} fill="#2b1d1a" />
      <circle cx={x + r * 0.38} cy={y + r * 0.48} r={r * 0.08} fill="#2b1d1a" />
    </g>
  )
}

/** El pulpo, que crece con el audio: un tentáculo, medio pulpo, un pulpo, un pulpo gigante. */
function Pulpo({ id, nivel }: { id: string; nivel: number }) {
  const plato = <ellipse cx="48" cy="80" rx={nivel === 0 ? 26 : 38} ry="6" fill="#2b2b2b" opacity=".85" />
  if (nivel === 0) {
    return (
      <>
        {plato}
        <Tentaculo x={30} y={70} angulo={-30} largo={52} curva={-230} grosor={6.5} />
      </>
    )
  }
  const escala = nivel === 1 ? 0.85 : nivel === 2 ? 1 : 1.32
  const brazos = nivel === 1 ? [200, 250, 300] : [150, 190, 230, 310, 350, 30]
  return (
    <>
      {plato}
      <g transform={`translate(48 ${nivel === 3 ? 44 : 48}) scale(${escala}) translate(-48 -48)`}>
        {brazos.map((angulo, i) => (
          <Tentaculo
            key={angulo}
            x={48 + Math.cos((angulo * Math.PI) / 180) * 8}
            y={52 + Math.abs(Math.sin((angulo * Math.PI) / 180)) * 4}
            angulo={angulo > 90 && angulo < 270 ? 160 + (i % 2) * 10 : 20 - (i % 2) * 10}
            largo={nivel === 1 ? 30 : 36}
            curva={angulo > 90 && angulo < 270 ? -160 : 160}
            grosor={4.8}
          />
        ))}
        <CabezaDePulpo x={48} y={38} r={nivel === 1 ? 11 : 13} id={id} />
      </g>
    </>
  )
}

/** Un onigiri: el triángulo de arroz con su banda de nori. */
function UnOnigiri() {
  return (
    <>
      <ellipse cx="48" cy="80" rx="22" ry="3" fill="#6b5a44" opacity=".18" />
      <path d="M48 24C53 24 56 28 60 36L71 58C75 66 70 76 61 76H35C26 76 21 66 25 58L36 36C40 28 43 24 48 24Z" fill="#ffffff" stroke="#d9ccb6" strokeWidth="1.4" />
      <rect x="35" y="56" width="26" height="20" rx="2" fill="#1f2c26" />
      <path d="M38 60H58" stroke="#3a4a42" strokeWidth="1" />
      {[[44, 36], [50, 42], [42, 46], [54, 50]].map(([cx, cy]) => (
        <ellipse key={`${cx}-${cy}`} cx={cx} cy={cy} rx="2" ry="1" fill="#e9dfcd" />
      ))}
    </>
  )
}

/** La tina de madera del arroz (el hangiri), ancha y baja, con su paleta. */
function UnaTina() {
  return (
    <>
      <ellipse cx="48" cy="82" rx="42" ry="4" fill="#6b5a44" opacity=".2" />
      <path d="M8 52H88L84 72C83 77 76 80 48 80C20 80 13 77 12 72Z" fill={MADERA.medio} />
      {[20, 32, 44, 56, 68, 78].map((x) => (
        <path key={x} d={`M${x} 53L${x - (x < 48 ? 1.5 : -1.5)} 79`} stroke={MADERA.veta} strokeWidth="1.2" />
      ))}
      <path d="M10 62H86M12 71H84" stroke="#b1874f" strokeWidth="2.2" />
      <ellipse cx="48" cy="52" rx="40" ry="8" fill="#c99a62" />
      <ellipse cx="48" cy="51" rx="36" ry="6" fill="#ffffff" stroke="#d9ccb6" />
      <path d="M22 50C30 44 40 42 48 42C58 42 66 44 74 50" fill="#ffffff" stroke="#d9ccb6" />
      <rect x="54" y="30" width="7" height="24" rx="3.5" fill="#e2c497" transform="rotate(28 57 42)" />
      <rect x="61" y="18" width="3" height="16" rx="1.5" fill="#c9a26c" transform="rotate(28 62 26)" />
    </>
  )
}

/** Un furoshiki: el paño anudado arriba, con su estampado. */
function Furoshiki({ x, y, ancho, alto, id }: { x: number; y: number; ancho: number; alto: number; id: string }) {
  return (
    <g>
      <defs>
        <pattern id={`${id}est`} width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="3.5" cy="3.5" r="1.1" fill="#e8e1d0" opacity=".75" />
        </pattern>
      </defs>
      <path
        d={`M${x} ${y + alto * 0.3}C${x} ${y + alto * 0.1} ${x + ancho * 0.15} ${y} ${x + ancho * 0.3} ${y}H${x + ancho * 0.7}C${x + ancho * 0.85} ${y} ${x + ancho} ${y + alto * 0.1} ${x + ancho} ${y + alto * 0.3}V${y + alto * 0.85}C${x + ancho} ${y + alto} ${x + ancho * 0.85} ${y + alto} ${x + ancho * 0.75} ${y + alto}H${x + ancho * 0.25}C${x + ancho * 0.15} ${y + alto} ${x} ${y + alto} ${x} ${y + alto * 0.85}Z`}
        fill="#3b4f8a"
      />
      <path
        d={`M${x} ${y + alto * 0.3}C${x} ${y + alto * 0.1} ${x + ancho * 0.15} ${y} ${x + ancho * 0.3} ${y}H${x + ancho * 0.7}C${x + ancho * 0.85} ${y} ${x + ancho} ${y + alto * 0.1} ${x + ancho} ${y + alto * 0.3}V${y + alto * 0.85}C${x + ancho} ${y + alto} ${x + ancho * 0.85} ${y + alto} ${x + ancho * 0.75} ${y + alto}H${x + ancho * 0.25}C${x + ancho * 0.15} ${y + alto} ${x} ${y + alto} ${x} ${y + alto * 0.85}Z`}
        fill={`url(#${id}est)`}
      />
      <path d={`M${x + ancho * 0.5} ${y + 2}L${x + ancho * 0.3} ${y - alto * 0.32}L${x + ancho * 0.44} ${y - alto * 0.08}Z`} fill="#2f4078" />
      <path d={`M${x + ancho * 0.5} ${y + 2}L${x + ancho * 0.72} ${y - alto * 0.3}L${x + ancho * 0.57} ${y - alto * 0.06}Z`} fill="#2f4078" />
      <ellipse cx={x + ancho * 0.5} cy={y + 1} rx={ancho * 0.09} ry={alto * 0.08} fill="#28376a" />
    </g>
  )
}

// --- Cada material ----------------------------------------------------------------------------

/** Lo que va adentro del lienzo de 96 × 96 de un material, en un modo. Lo usan también el riel de la comanda y la cuota. */
export function FiguraDeMaterial({ clase, nivel, tema, id }: { clase: ClaseMaterial; nivel: number; tema: 'noche' | 'dia'; id: string }) {
  if (tema === 'noche') {
    if (clase === 'video') {
      return [<UnCorte key={0} id={id} />, <UnLomo key={1} id={id} />, <UnCuarto key={2} id={id} />, <FiguraRes key={3} id={id} />, <LaVacaEntera key={4} id={id} />][nivel] ?? null
    }
    if (clase === 'audio') return <Ristra id={`${id}l`} nivel={nivel} />
    if (clase === 'imagen') {
      if (nivel === 0) return <g transform="translate(-24 -22) scale(1.05)"><FiguraPimenton /></g>
      return nivel === 1 ? <FiguraVerduras /> : <UnCajon />
    }
    return nivel === 0 ? (
      <Paquete x={26} y={38} ancho={44} alto={30} />
    ) : (
      <>
        <Paquete x={12} y={52} ancho={72} alto={28} />
        <Paquete x={22} y={26} ancho={52} alto={26} />
      </>
    )
  }
  if (clase === 'video') {
    return [<UnTrozo key={0} id={id} />, <UnFilete key={1} />, <FiguraSalmon key={2} id={id} />, <FiguraAtun key={3} id={id} />, <UnAtunGigante key={4} id={id} />][nivel] ?? null
  }
  if (clase === 'audio') return <Pulpo id={id} nivel={nivel} />
  if (clase === 'imagen') return nivel === 0 ? <UnOnigiri /> : nivel === 1 ? <FiguraArroz /> : <UnaTina />
  return nivel === 0 ? <Furoshiki x={26} y={40} ancho={44} alto={34} id={id} /> : <Furoshiki x={10} y={32} ancho={76} alto={48} id={id} />
}

/**
 * El dibujo de un material en los dos modos, y el modo esconde uno: su forma dice lo que es y su
 * tamaño lo que pesa. `className` va en los dos `<svg>`.
 */
export function DibujoDeMaterial({ clase, bytes, className }: { clase: ClaseMaterial; bytes: number; className?: string }) {
  const id = useId()
  const nivel = nivelDePeso(clase, bytes)
  return (
    <>
      <svg viewBox="0 0 96 96" className={cn('solo-noche shrink-0 overflow-hidden', className)} aria-hidden>
        <FiguraDeMaterial clase={clase} nivel={nivel} tema="noche" id={`${id}n`} />
      </svg>
      <svg viewBox="0 0 96 96" className={cn('solo-dia shrink-0 overflow-hidden', className)} aria-hidden>
        <FiguraDeMaterial clase={clase} nivel={nivel} tema="dia" id={`${id}d`} />
      </svg>
    </>
  )
}

// --- La cuota ---------------------------------------------------------------------------------

const LUZ: Record<EstadoDeLaCuota, string> = { holgada: '#74bf6a', llenandose: '#e5a52a', llena: '#f2557a' }
const LUZ_DIA: Record<EstadoDeLaCuota, string> = { holgada: '#2f7a3b', llenandose: '#946000', llena: '#c0244c' }

/**
 * La cuota de la cámara, dibujada como la cámara misma. De noche, un riel con diez ganchos que se
 * van ocupando con medias reses; de día, la nevera de vidrio con diez lugares sobre el hielo que se
 * van llenando de pescado. Cada gancho es un décimo de la cuota (`ganchosOcupados`). La luz de la
 * puerta dice cómo va: verde, ámbar desde el 85 %, roja llena. Al abrirse, las piezas caen a su
 * gancho una detrás de la otra (`.gancho-cae`, en `globals.css`); con movimiento reducido, ya están.
 */
export function CuotaDeLaCamara({ ocupados, estado, className }: { ocupados: number; estado: EstadoDeLaCuota; className?: string }) {
  const id = useId()
  const xs = Array.from({ length: GANCHOS }, (_, i) => 31 + i * 28.6)
  return (
    <>
      <svg viewBox="0 0 320 72" className={cn('solo-noche h-auto w-full', className)} aria-hidden>
        <defs>
          <linearGradient id={`${id}pared`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#18212b" />
            <stop offset="1" stopColor="#24303b" />
          </linearGradient>
          <radialGradient id={`${id}escarcha`} cx="0" cy="0" r="1">
            <stop offset="0" stopColor="#dbe9f3" stopOpacity=".35" />
            <stop offset="1" stopColor="#dbe9f3" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="320" height="72" rx="12" fill={`url(#${id}pared)`} />
        <path d="M0 36H320M64 0V72M128 0V72M192 0V72M256 0V72" stroke="#ffffff" strokeOpacity=".035" />
        <rect width="90" height="48" fill={`url(#${id}escarcha)`} />
        <rect width="90" height="48" fill={`url(#${id}escarcha)`} transform="translate(320 72) rotate(180)" />
        <path d="M10 15H310" stroke={FIERRO} strokeWidth="3" strokeLinecap="round" />
        <circle cx="308" cy="7" r="3.6" fill={LUZ[estado]} className={estado === 'llena' ? 'late' : undefined} />
        {xs.map((x, i) =>
          i < ocupados ? (
            <g key={x} transform={`translate(${x - 48 * 0.58} ${15 - 7 * 0.58}) scale(.58)`}>
              <g className="gancho-cae" style={{ animationDelay: `${i * 90}ms` }}>
                <FiguraRes id={`${id}r${i}`} />
              </g>
            </g>
          ) : (
            <path key={x} d={`M${x} 15V20C${x} 22.5 ${x - 2.5} 23 ${x - 3.5} 21.5`} stroke={FIERRO} strokeWidth="1.6" fill="none" strokeLinecap="round" opacity=".7" />
          ),
        )}
        <path d="M8 66H312" stroke="#ffffff" strokeOpacity=".06" strokeWidth="2" />
      </svg>
      <svg viewBox="0 0 320 72" className={cn('solo-dia h-auto w-full', className)} aria-hidden>
        <defs>
          <linearGradient id={`${id}vidrio`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f3f9fc" />
            <stop offset="1" stopColor="#e4f0f6" />
          </linearGradient>
        </defs>
        <rect x=".5" y=".5" width="319" height="71" rx="11.5" fill="#fbf6ee" stroke="#e2d8c9" />
        <rect x="10" y="14" width="300" height="46" rx="6" fill={`url(#${id}vidrio)`} stroke={MADERA.medio} strokeWidth="3" />
        <path d="M30 16L52 58M80 16L96 46" stroke="#ffffff" strokeWidth="6" opacity=".55" />
        <rect x="12" y="46" width="296" height="12" fill={HIELO.medio} />
        {Array.from({ length: 30 }, (_, i) => (
          <rect key={i} x={14 + i * 9.8} y={i % 2 ? 47 : 50} width="8" height="6" rx="2" fill={HIELO.claro} stroke={HIELO.borde} strokeWidth=".6" />
        ))}
        <rect x="6" y="60" width="308" height="7" rx="2" fill={MADERA.medio} />
        <circle cx="308" cy="7" r="3.6" fill={LUZ_DIA[estado]} className={estado === 'llena' ? 'late' : undefined} />
        {xs.map((x, i) =>
          i < ocupados ? (
            <g key={x} className="gancho-cae" style={{ animationDelay: `${i * 90}ms` }}>
              {i % 2 === 0 ? (
                <>
                  <rect x={x - 11} y="34" width="22" height="12" rx="2.5" fill="#c8424a" />
                  <path d={`M${x - 6} 35L${x - 3} 45M${x + 1} 35L${x + 4} 45`} stroke="#f3c9c3" strokeOpacity=".55" strokeWidth="1" />
                </>
              ) : (
                <>
                  <path d={`M${x - 12} 42C${x - 9} 34 ${x + 6} 33 ${x + 12} 36C${x + 13} 40 ${x + 11} 44 ${x + 8} 45C${x} 47 ${x - 9} 47 ${x - 12} 42Z`} fill="#ef8a5c" />
                  <path d={`M${x - 5} 36Q${x - 2} 41 ${x - 4} 46M${x + 2} 35Q${x + 5} 40 ${x + 3} 46`} stroke="#ffe0cf" strokeWidth="1" fill="none" />
                </>
              )}
            </g>
          ) : (
            <ellipse key={x} cx={x} cy="47" rx="9" ry="1.6" fill="#a9cfe3" opacity=".6" />
          ),
        )}
      </svg>
    </>
  )
}
