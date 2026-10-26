import { MAX_HUESOS, QUEMO, type Carne, type Coccion, type Formato, type Sello } from '@/lib/parrilla'
import { cn } from '@/lib/utils'

/*
 * La pieza de sushi: el corte del modo día. Dice lo mismo que `Corte` (`corte.tsx`), con la
 * misma gramática, y por eso recibe las mismas props:
 * - la silueta, el formato: nigiri el video, un roll envuelto en salmón el carrusel, sashimi la
 *   foto, temaki el texto. El roll va entero mientras no se sirvió y en rodajas cuando salió,
 *   una por archivo, como el hueso de la tira: lo pidió el dueño el 2026-10-19;
 * - el pescado, la cocción: el soplete del aburi hace de parrilla, así que crudo es
 *   programado, sellado es saliendo y a punto es publicado. Lo que falló no se quema: el
 *   pescado que no se sirvió se echó a perder, y se ve pasado —verde gris, con moho y con su
 *   olor encima—. Lo pidió el dueño el 2026-10-19, junto con la palabra: de día, «Se quemó»
 *   dice «Se echó a perder» (`SE_QUEMO`, en `src/lib/vocabulario.ts`);
 * - las bandas de nori, una por destino, cómo le fue a cada uno (`Sello`);
 * - el halo rojo y la banderita, que algo falló, idénticos a los del corte;
 * - la llama del soplete, que algo está saliendo ahora (en el corte, el humo).
 *
 * El arroz, el nori, el shiso y el papel de soya no cambian con la cocción: solo el pescado,
 * para que el estado tenga una sola superficie. Va `aria-hidden`, como el corte: quien lo
 * pone dice al lado, en palabras, lo que el dibujo dice.
 *
 * Ver `docs/superpowers/specs/2026-10-19-modo-dia-sushi-design.md`.
 */

/**
 * El pescado según la cocción, de claro a oscuro, como la carne del corte: el orden por
 * luminosidad es lo que sobrevive a un daltonismo. Crudo es salmón fresco; sellado, con los
 * bordes ya dorados; a punto, el aburi tostado. Lo que falló (`quemada`, como la carne) no es
 * carbón: es pescado pasado, un verde gris hondo y sin brillo. Igual de oscuro que el carbón,
 * para que siga siendo el extremo de la escala.
 */
export const PESCADO: Record<Carne, { claro: string; medio: string; hondo: string }> = {
  cruda: { claro: '#ffd2c2', medio: '#ffb39a', hondo: '#f48d6f' },
  sellada: { claro: '#f4ad7e', medio: '#e5864a', hondo: '#c66737' },
  punto: { claro: '#d58e4f', medio: '#b46a33', hondo: '#86491f' },
  quemada: { claro: '#5d6a43', medio: '#282d20', hondo: '#161a10' },
}

/** El moho del pescado pasado y el olor que sube de él: un verde que no es el del shiso. */
const PASADO = { moho: '#cfd8b4', olor: '#7d8f52' }

/** Dónde cae el moho: unas manchas repartidas por todo el lienzo, que la silueta recorta. */
const MOHO: ReadonlyArray<readonly [number, number, number]> = [
  [30, 22, 4.6],
  [56, 16, 3.4],
  [82, 25, 4.2],
  [44, 40, 3.2],
  [94, 42, 3.8],
  [102, 16, 3.2],
  [22, 46, 3.4],
  [68, 47, 4],
]

/**
 * Lo que no se cocina: el arroz, el nori, el shiso, el wasabi, el papel de soya del temaki y el
 * relleno del roll, palta y queso crema.
 */
const ARROZ = { claro: '#ffffff', sombra: '#efe5d4', borde: '#d9ccb6', grano: '#e4d8c4' }
const NORI = { cuerpo: '#1f2c26', brillo: '#3d5649' }
const SHISO = { claro: '#7fbf5f', hondo: '#4f8f3a' }
const WASABI = '#a9c864'
const SOYA = { claro: '#fbd3df', hondo: '#efa9bf' }
const RELLENO = { palta: '#a7cc6c', queso: '#fffaf0' }

/** Las vetas blancas del salmón; en el pescado pasado, apagadas y verdosas. */
function vetas(carne: Carne): { color: string; opacidad: number } {
  if (carne === 'quemada') return { color: '#7a8566', opacidad: 0.35 }
  if (carne === 'punto') return { color: '#f3c99a', opacidad: 0.45 }
  return { color: '#ffffff', opacidad: carne === 'cruda' ? 0.75 : 0.55 }
}

/*
 * Las siluetas, en el mismo lienzo de 120 × 64 que el corte. Cada una es la forma entera de
 * la pieza: recorta las bandas, lleva el contorno y, si algo falló, el halo.
 */
const NIGIRI = {
  silueta: 'M8 29C9 17 30 10 60 10C90 10 111 16 112 27C113 33 108 36 103 37C103 49 89 55 60 55C31 55 17 49 17 37C11 36 7 34 8 29Z',
  arroz: 'M17 37C17 30 31 27 60 27C89 27 103 30 103 37C103 49 89 55 60 55C31 55 17 49 17 37Z',
  pescado: 'M8 29C9 17 30 10 60 10C90 10 111 16 112 27C113 34 104 37 92 36C76 35 44 35 28 36C16 37 7 35 8 29Z',
}

const SASHIMI = {
  // Tres láminas en abanico sobre una hoja de shiso.
  laminas: [
    'M14 46C11 34 15 21 26 17L52 12C58 11 61 15 60 21L56 46C55 52 50 55 44 55L24 56C19 56 15 52 14 46Z',
    'M38 47C35 35 39 21 50 16L75 12C81 11 85 15 84 21L80 47C79 53 74 56 68 56L48 56C43 56 39 53 38 47Z',
    'M62 47C60 35 64 22 74 17L98 13C104 12 108 16 107 22L103 47C102 53 97 56 91 56L72 56C67 56 63 53 62 47Z',
  ],
  silueta: 'M14 46C11 34 15 21 26 17L52 12L75 12L98 13C104 12 108 16 107 22L103 47C102 53 97 56 91 56L24 56C19 56 15 52 14 46Z',
  shiso: 'M6 30C14 12 40 4 62 6C50 12 30 18 18 34C14 40 8 40 6 30Z',
  wasabi: 'M100 52C104 47 112 47 114 52C115 56 110 58 106 57C102 57 99 55 100 52Z',
}

const TEMAKI = {
  // El cono, acostado: la punta a la izquierda y la boca a la derecha.
  cono: 'M6 44C26 36 64 18 92 9C98 16 102 30 101 48C76 51 34 50 6 44Z',
  pescado: 'M84 10C96 2 112 4 116 12C118 20 112 26 104 28C96 30 90 24 84 10Z',
  arroz: 'M88 12C96 14 103 24 104 34C104 42 100 48 96 49C92 40 90 26 88 12Z',
  silueta: 'M6 44C26 36 64 18 86 10C96 2 112 4 116 12C118 20 112 26 105 28C104 36 102 44 101 48C76 51 34 50 6 44Z',
}

/**
 * El onigiri, la historia: lo que se come al paso en Japón, como el choripán acá. Un triángulo
 * de arroz parado, con el salmón asomando arriba —lo que se cocina— y la banda de nori abajo.
 */
const ONIGIRI = {
  silueta: 'M60 3C66 3 70 7 74 14L89 44C93 52 89 60 79 60L41 60C31 60 27 52 31 44L46 14C50 7 54 3 60 3Z',
  pescado: 'M51 21C52 14 68 14 69 21C71 28 65 33 60 33C55 33 49 28 51 21Z',
  nori: 'M46 40H74L76 60H44Z',
}

/**
 * Dónde va cada rodaja del maki, y su radio: como los huesos de la tira, una por archivo.
 * Juntas, apenas montadas una sobre otra: separadas, las bandas caían en los huecos y no se
 * veían, y el pescado del centro quedaba chico para decir la cocción.
 */
export function rodajas(n: number): Array<{ cx: number; r: number }> {
  const cuantas = Math.max(n, 2)
  const r = Math.min(21, 118 / (cuantas * 2 - (cuantas - 1) * 0.12))
  const paso = 2 * r * 0.94
  const inicio = 60 - (paso * (cuantas - 1)) / 2
  return Array.from({ length: cuantas }, (_, i) => ({ cx: inicio + i * paso, r }))
}

/** La silueta del maki en rodajas: sus discos, para recortar y para el contorno. */
function siluetaMaki(n: number): string {
  return rodajas(n)
    .map(({ cx, r }) => `M${cx - r} 34a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`)
    .join('')
}

/**
 * El roll entero, visto de lado: un tronco de alto fijo que va de punta a punta de donde caerían
 * sus rodajas, con la punta izquierda redonda y, a la derecha, la cara del corte de la orilla.
 * `cortes` son las líneas por donde se va a cortar: una menos que rodajas, así el roll entero
 * también cuenta los archivos.
 */
const ROLL = { arriba: 20, abajo: 48, punta: 8, cara: 7 }

export function rollEntero(n: number): { x0: number; x1: number; cortes: number[] } {
  const discos = rodajas(n)
  const primero = discos[0]!
  const ultimo = discos[discos.length - 1]!
  return {
    x0: primero.cx - primero.r,
    x1: ultimo.cx + ultimo.r,
    cortes: discos.slice(1).map((d, i) => (discos[i]!.cx + d.cx) / 2),
  }
}

function siluetaRoll(n: number): string {
  const { x0, x1 } = rollEntero(n)
  const { arriba, abajo, punta, cara } = ROLL
  const ry = (abajo - arriba) / 2
  return `M${x0 + punta} ${arriba}H${x1 - cara}A${cara} ${ry} 0 0 1 ${x1 - cara} ${abajo}H${x0 + punta}A${punta} ${ry} 0 0 1 ${x0 + punta} ${arriba}Z`
}

/**
 * Si el roll va en rodajas: cuando se sirvió, o sea cuando su pescado está a punto —publicado,
 * o publicado en todo lo que no falló—. Mientras está programado o saliendo, y si falló en
 * todas partes, va entero: no se llegó a servir.
 */
export function rollCortado(carne: Carne): boolean {
  return carne === 'punto'
}

export function siluetaDe(formato: Formato, huesos: number, cortado = true): string {
  if (formato === 'entrana') return NIGIRI.silueta
  if (formato === 'tira') return cortado ? siluetaMaki(huesos) : siluetaRoll(huesos)
  if (formato === 'bife') return SASHIMI.silueta
  if (formato === 'choripan') return ONIGIRI.silueta
  return TEMAKI.silueta
}

/** El id del recorte de una silueta: el roll tiene uno por cantidad de rodajas, entero y cortado. */
function idDeSilueta(formato: Formato, huesos: number, cortado = true): string {
  if (formato !== 'tira') return `tp-sushi-silueta-${formato}`
  return `tp-sushi-silueta-tira-${cortado ? '' : 'entero-'}${Math.min(Math.max(huesos, 2), MAX_HUESOS)}`
}

/**
 * Lo que comparten todas las piezas de la página, una sola vez, como `CorteDefs`: los
 * degradados, los difuminados y los recortes de cada silueta —los del roll, uno por cantidad de
 * rodajas, de dos a diez, entero y cortado—. Va en el layout del panel. `width`/`height` en cero y no
 * `display: none`, por lo mismo que `CorteDefs`: Safari no pinta un degradado definido en un SVG
 * oculto.
 */
export function PiezaDefs() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden focusable="false">
      <defs>
        {(['entrana', 'bife', 'chori', 'choripan'] as const).map((formato) => (
          <clipPath key={formato} id={idDeSilueta(formato, 0)}>
            <path d={siluetaDe(formato, 0)} />
          </clipPath>
        ))}
        {Array.from({ length: MAX_HUESOS - 1 }, (_, i) => i + 2).flatMap((n) => [
          <clipPath key={n} id={idDeSilueta('tira', n)}>
            <path d={siluetaMaki(n)} />
          </clipPath>,
          <clipPath key={`entero-${n}`} id={idDeSilueta('tira', n, false)}>
            <path d={siluetaRoll(n)} />
          </clipPath>,
        ])}
        <clipPath id="tp-sushi-nigiri-pescado">
          <path d={NIGIRI.pescado} />
        </clipPath>
        <clipPath id="tp-sushi-sashimi-laminas">
          {SASHIMI.laminas.map((d) => (
            <path key={d} d={d} />
          ))}
        </clipPath>
        {(Object.keys(PESCADO) as Carne[]).map((carne) => (
          <linearGradient key={carne} id={`tp-pescado-${carne}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={PESCADO[carne].claro} />
            <stop offset="0.55" stopColor={PESCADO[carne].medio} />
            <stop offset="1" stopColor={PESCADO[carne].hondo} />
          </linearGradient>
        ))}
        <linearGradient id="tp-arroz" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={ARROZ.claro} />
          <stop offset="1" stopColor={ARROZ.sombra} />
        </linearGradient>
        <linearGradient id="tp-soya" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={SOYA.claro} />
          <stop offset="1" stopColor={SOYA.hondo} />
        </linearGradient>
        <linearGradient id="tp-shiso" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={SHISO.claro} />
          <stop offset="1" stopColor={SHISO.hondo} />
        </linearGradient>
        <filter id="tp-sushi-difuso" x="-20%" y="-50%" width="140%" height="200%">
          <feGaussianBlur stdDeviation="1.4" />
        </filter>
        <filter id="tp-sushi-sombra" x="-20%" y="-200%" width="140%" height="500%">
          <feGaussianBlur stdDeviation="2.4" />
        </filter>
        <filter id="tp-sushi-brillo" x="-30%" y="-60%" width="160%" height="220%">
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

/** Los granos de arroz: unos pocos óvalos, lo justo para que se lea arroz y no queso. */
function Granos({ puntos }: { puntos: Array<[number, number, number]> }) {
  return (
    <>
      {puntos.map(([cx, cy, giro]) => (
        <ellipse key={`${cx}-${cy}`} cx={cx} cy={cy} rx="2.6" ry="1.3" transform={`rotate(${giro} ${cx} ${cy})`} fill="none" stroke={ARROZ.grano} strokeWidth=".8" />
      ))}
    </>
  )
}

function Nigiri({ carne }: { carne: Carne }) {
  const v = vetas(carne)
  return (
    <>
      <path d={NIGIRI.arroz} fill="url(#tp-arroz)" stroke={ARROZ.borde} strokeWidth=".9" />
      <Granos puntos={[[30, 47, 20], [42, 51, -15], [56, 49, 10], [70, 51, -20], [84, 47, 15], [36, 41, -10], [92, 42, 25]]} />
      <path d={NIGIRI.pescado} fill={`url(#tp-pescado-${carne})`} />
      {/* Las vetas en diagonal, como la fibra de la entraña: es lo que hace leer salmón. */}
      <g clipPath="url(#tp-sushi-nigiri-pescado)">
        {Array.from({ length: 9 }, (_, i) => {
          const x = 16 + i * 11
          return <path key={i} d={`M${x} 9C${x + 5} 18 ${x + 4} 27 ${x - 1} 38`} stroke={v.color} strokeOpacity={v.opacidad} strokeWidth="2.2" fill="none" strokeLinecap="round" />
        })}
      </g>
    </>
  )
}

/** El corte de un roll envuelto en salmón: el pescado afuera, el arroz, el nori y el relleno. */
function CaraDelRoll({ cx, cy, rx, ry, carne }: { cx: number; cy: number; rx: number; ry: number; carne: Carne }) {
  return (
    <>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={`url(#tp-pescado-${carne})`} stroke="rgba(120,40,20,.25)" strokeWidth=".8" />
      <ellipse cx={cx} cy={cy} rx={rx * 0.66} ry={ry * 0.66} fill="url(#tp-arroz)" />
      <ellipse cx={cx} cy={cy} rx={rx * 0.42} ry={ry * 0.42} fill={NORI.cuerpo} />
      <ellipse cx={cx} cy={cy} rx={rx * 0.34} ry={ry * 0.34} fill={RELLENO.palta} />
      <ellipse cx={cx + rx * 0.1} cy={cy - ry * 0.08} rx={rx * 0.15} ry={ry * 0.15} fill={RELLENO.queso} />
    </>
  )
}

/**
 * El roll en rodajas, ya servido: una por archivo, cada una con su vuelta de salmón, que es lo
 * que dice la cocción. El salmón va afuera, como en el roll entero, para que la cocción tenga
 * la misma superficie antes y después de cortar.
 */
function MakiEnRodajas({ carne, n }: { carne: Carne; n: number }) {
  const v = vetas(carne)
  return (
    <>
      {rodajas(n).map(({ cx, r }, i) => (
        <g key={i}>
          <CaraDelRoll cx={cx} cy={34} rx={r} ry={r} carne={carne} />
          {/* Una veta en la vuelta del salmón: lo justo para que se lea pescado y no tomate. */}
          <path d={`M${cx - r * 0.62} ${34 - r * 0.62}A${r * 0.86} ${r * 0.86} 0 0 1 ${cx + r * 0.3} ${34 - r * 0.81}`} stroke={v.color} strokeOpacity={v.opacidad} strokeWidth="1.3" fill="none" strokeLinecap="round" />
        </g>
      ))}
    </>
  )
}

/**
 * El roll entero, sin servir: el tronco envuelto en salmón, con sus vetas, las líneas por donde
 * se va a cortar —una rodaja por archivo— y, a la derecha, la cara del corte de la orilla.
 */
function MakiEntero({ carne, n }: { carne: Carne; n: number }) {
  const v = vetas(carne)
  const { x0, x1, cortes } = rollEntero(n)
  const { arriba, abajo, cara } = ROLL
  const medio = (arriba + abajo) / 2
  // Las líneas del corte van enteras y finas: punteada es la banda del destino que no salió.
  // Sobre el pescado pasado, que es oscuro, van claras.
  const linea = carne === 'quemada' ? 'rgba(255,255,255,.4)' : 'rgba(90,30,15,.55)'
  return (
    <>
      <path d={siluetaRoll(n)} fill={`url(#tp-pescado-${carne})`} stroke="rgba(120,40,20,.25)" strokeWidth=".8" />
      <g clipPath={`url(#${idDeSilueta('tira', n, false)})`}>
        {/* Las vetas, más ralas que en el nigiri: las líneas que cuentan son las del corte. */}
        {Array.from({ length: Math.ceil((x1 - x0) / 14) }, (_, i) => {
          const x = x0 + 6 + i * 14
          return <path key={i} d={`M${x} ${arriba - 1}C${x + 6} ${arriba + 7} ${x + 5} ${abajo - 11} ${x - 1} ${abajo + 1}`} stroke={v.color} strokeOpacity={v.opacidad * 0.7} strokeWidth="1.5" fill="none" strokeLinecap="round" />
        })}
      </g>
      {cortes.map((x) => (
        <path key={x} d={`M${x} ${arriba + 1.5}C${x + 2} ${arriba + 10} ${x + 2} ${abajo - 10} ${x} ${abajo - 1.5}`} stroke={linea} strokeWidth="1.1" fill="none" />
      ))}
      <CaraDelRoll cx={x1 - cara} cy={medio} rx={cara} ry={(abajo - arriba) / 2} carne={carne} />
    </>
  )
}

function Sashimi({ carne }: { carne: Carne }) {
  const v = vetas(carne)
  return (
    <>
      <path d={SASHIMI.shiso} fill="url(#tp-shiso)" />
      <path d="M10 30C24 18 40 12 58 8" stroke={SHISO.hondo} strokeWidth="1" fill="none" opacity=".7" />
      {SASHIMI.laminas.map((d, i) => (
        <g key={i}>
          <path d={d} fill={`url(#tp-pescado-${carne})`} stroke="rgba(120,40,20,.18)" strokeWidth=".8" />
        </g>
      ))}
      <g clipPath="url(#tp-sushi-sashimi-laminas)">
        {Array.from({ length: 10 }, (_, i) => {
          const x = 16 + i * 10
          return <path key={i} d={`M${x} 12C${x + 6} 24 ${x + 5} 38 ${x - 2} 56`} stroke={v.color} strokeOpacity={v.opacidad} strokeWidth="1.8" fill="none" strokeLinecap="round" />
        })}
      </g>
      <path d={SASHIMI.wasabi} fill={WASABI} stroke="rgba(60,90,20,.25)" strokeWidth=".8" />
    </>
  )
}

function Temaki({ carne }: { carne: Carne }) {
  const v = vetas(carne)
  return (
    <>
      <path d={TEMAKI.cono} fill="url(#tp-soya)" stroke="rgba(150,60,90,.25)" strokeWidth=".8" />
      <path d="M14 43C40 34 66 22 90 13" stroke="#ffffff" strokeOpacity=".5" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <path d={TEMAKI.arroz} fill="url(#tp-arroz)" stroke={ARROZ.borde} strokeWidth=".8" />
      <path d="M95 30L110 26" stroke={WASABI} strokeWidth="3" strokeLinecap="round" />
      <path d={TEMAKI.pescado} fill={`url(#tp-pescado-${carne})`} />
      <path d="M90 11C98 6 108 6 113 11" stroke={v.color} strokeOpacity={v.opacidad} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M92 17C99 13 107 13 112 17" stroke={v.color} strokeOpacity={v.opacidad} strokeWidth="1.6" fill="none" strokeLinecap="round" />
      {[[30, 41], [44, 37], [58, 32], [72, 27], [38, 44], [64, 38]].map(([cx, cy]) => (
        <ellipse key={`${cx}-${cy}`} cx={cx} cy={cy} rx="1.3" ry=".8" fill="#fff6e8" opacity=".9" />
      ))}
    </>
  )
}

function Onigiri({ carne }: { carne: Carne }) {
  const v = vetas(carne)
  return (
    <>
      <path d={ONIGIRI.silueta} fill="url(#tp-arroz)" stroke={ARROZ.borde} strokeWidth=".9" />
      <Granos puntos={[[48, 36, 20], [72, 35, -15], [40, 50, 10], [80, 51, -20], [56, 9, 15], [64, 38, -10]]} />
      <path d={ONIGIRI.pescado} fill={`url(#tp-pescado-${carne})`} />
      <path d="M54 20C57 17 63 17 66 20M54 26C57 23 63 23 66 26" stroke={v.color} strokeOpacity={v.opacidad} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d={ONIGIRI.nori} fill={NORI.cuerpo} />
      <path d="M72 40L74 60" stroke={NORI.brillo} strokeWidth=".9" />
    </>
  )
}

/** Una elipse como trazo, para el motor de la imagen para compartir, que se queda con trazos. */
function elipse(cx: number, cy: number, rx: number, ry: number): string {
  return `M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${2 * rx} 0a${rx} ${ry} 0 1 0 ${-2 * rx} 0Z`
}

/** Una capa de una pieza en plano: un trazo y su color, o el degradado del pescado. */
export type CapaDeMuestra = { d: string; relleno: string }

/** El corte de un roll en capas, de afuera adentro: el salmón, el arroz, el nori y la palta. */
function capasDelCorte(cx: number, cy: number, rx: number, ry: number): CapaDeMuestra[] {
  return [
    { d: elipse(cx, cy, rx, ry), relleno: 'pescado' },
    { d: elipse(cx, cy, rx * 0.66, ry * 0.66), relleno: ARROZ.claro },
    { d: elipse(cx, cy, rx * 0.42, ry * 0.42), relleno: NORI.cuerpo },
    { d: elipse(cx, cy, rx * 0.34, ry * 0.34), relleno: RELLENO.palta },
  ]
}

/**
 * Una pieza en capas planas, para la imagen con que se comparte la portada de día
 * (`/api/og/dia`). A ese tamaño no se leen las bandas ni las vetas, y su motor no dibuja
 * recortes: cada capa es un trazo con un color, y la del pescado, `relleno: 'pescado'`, va con
 * el degradado de su cocción. Son las mismas formas que `PiezaSushi`, el roll entero o cortado
 * igual que en el panel.
 */
export function capasDeMuestra(formato: Formato, huesos: number, carne: Carne): CapaDeMuestra[] {
  if (formato === 'entrana') return [{ d: NIGIRI.arroz, relleno: ARROZ.claro }, { d: NIGIRI.pescado, relleno: 'pescado' }]
  if (formato === 'bife') {
    return [
      { d: SASHIMI.shiso, relleno: SHISO.hondo },
      ...SASHIMI.laminas.map((d) => ({ d, relleno: 'pescado' })),
      { d: SASHIMI.wasabi, relleno: WASABI },
    ]
  }
  if (formato === 'choripan') {
    return [
      { d: ONIGIRI.silueta, relleno: ARROZ.claro },
      { d: ONIGIRI.pescado, relleno: 'pescado' },
      { d: ONIGIRI.nori, relleno: NORI.cuerpo },
    ]
  }
  if (formato === 'chori') {
    return [
      { d: TEMAKI.cono, relleno: SOYA.claro },
      { d: TEMAKI.arroz, relleno: ARROZ.claro },
      { d: TEMAKI.pescado, relleno: 'pescado' },
    ]
  }
  if (rollCortado(carne)) return rodajas(huesos).flatMap(({ cx, r }) => capasDelCorte(cx, 34, r, r))
  const { x1 } = rollEntero(huesos)
  const { arriba, abajo, cara } = ROLL
  return [{ d: siluetaRoll(huesos), relleno: 'pescado' }, ...capasDelCorte(x1 - cara, (arriba + abajo) / 2, cara, (abajo - arriba) / 2)]
}

/**
 * Dónde cae la banda de cada destino: repartidas entre 30 y 90, o al centro si es una. En el
 * onigiri, que es más angosto, entre 46 y 74.
 */
function posiciones(n: number, formato: Formato): number[] {
  const [desde, hasta] = formato === 'choripan' ? [46, 74] : [30, 90]
  if (n <= 1) return [60]
  return Array.from({ length: n }, (_, i) => desde + (i * (hasta - desde)) / (n - 1))
}

/**
 * En el roll, cada banda cruza el centro de una rodaja y nunca la juntura de dos, donde se
 * perdía entre las orillas de las dos. Con el roll entero, caen donde van a quedar sus
 * rodajas. Con más destinos que rodajas, van de a varias por rodaja, repartidas dentro de ella.
 */
export function posicionesMaki(bandas: number, huesos: number): number[] {
  const discos = rodajas(huesos)
  if (bandas <= discos.length) {
    return Array.from({ length: bandas }, (_, i) => {
      const j = bandas === 1 ? Math.floor(discos.length / 2) : Math.round((i * (discos.length - 1)) / (bandas - 1))
      return discos[j]!.cx
    })
  }
  const porDisco = Math.ceil(bandas / discos.length)
  return Array.from({ length: bandas }, (_, i) => {
    const d = discos[Math.floor(i / porDisco)]!
    const enEste = Math.min(porDisco, bandas - Math.floor(i / porDisco) * porDisco)
    const k = i % porDisco
    return enEste === 1 ? d.cx : d.cx - d.r * 0.45 + (k * d.r * 0.9) / (enEste - 1)
  })
}

/**
 * La banda de nori de un destino, de arriba abajo, apenas inclinada. Las mismas siete formas
 * que la marca del corte: punteada mientras no salió, entera cuando salió, pasada y cruzada
 * por el rojo del halo cuando falló, a medias con un punto ámbar en la bandeja de TikTok,
 * punteada en ámbar el reintento, en acero el fierro frío.
 */
function Banda({ x, sello, chico }: { x: number; sello: Sello; chico: boolean }) {
  const ancho = (chico ? 8 : 6.5) / 2
  const d = `M${x - ancho + 3} -2L${x + ancho + 3} -2L${x + ancho - 3} 66L${x - ancho - 3} 66Z`
  const eje = `M${x + 3} -2L${x - 3} 66`
  const g = chico ? 1.35 : 1
  const punteada = { fill: 'none', strokeWidth: 1.4 * g, strokeDasharray: '3 3' }
  if (sello === 'bandeja') {
    return (
      <>
        <path d={`M${x - ancho + 3} -2L${x + ancho + 3} -2L${x + ancho} 32L${x - ancho} 32Z`} fill={NORI.cuerpo} />
        <path d={`M${x - ancho} 32L${x + ancho} 32L${x + ancho - 3} 66L${x - ancho - 3} 66Z`} {...punteada} stroke="rgba(31,44,38,.5)" />
        <circle cx={x} cy="32" r="3.4" style={{ fill: 'var(--color-caution)' }} stroke={NORI.cuerpo} strokeWidth="1" />
      </>
    )
  }
  if (sello === 'pendiente' || sello === 'saliendo') return <path d={d} {...punteada} stroke="rgba(31,44,38,.5)" />
  if (sello === 'reintento') return <path d={d} {...punteada} style={{ stroke: 'var(--color-caution)' }} />
  if (sello === 'frio') return <path d={d} {...punteada} stroke="#8d9aa6" />
  if (sello === 'quemado') {
    // Sin brasa: de día nada se quema. El rojo es el del halo, el de lo que falló.
    return (
      <>
        <path d={d} fill={PESCADO.quemada.medio} />
        <path d={eje} className="late" fill="none" strokeLinecap="round" stroke={QUEMO} strokeWidth="1.6" />
      </>
    )
  }
  return (
    <>
      <path d={d} fill={NORI.cuerpo} />
      <path d={`M${x + ancho + 1.5} -2L${x + ancho - 4.5} 66`} stroke={NORI.brillo} strokeWidth=".9" />
    </>
  )
}

/**
 * Una pieza. Las mismas props que `Corte`, para que el modo día cambie el dibujo y nada más.
 * `huesos` es cuántas rodajas lleva el roll, cortado o por cortar.
 */
export function PiezaSushi({
  formato,
  huesos = 0,
  carne,
  coccion,
  sellos,
  chico = false,
  llenado = 1,
  idDeLlenado = 'tp-llenado-sushi',
  className,
}: {
  formato: Formato
  huesos?: number
  carne: Carne
  coccion: Coccion
  sellos: readonly Sello[]
  chico?: boolean
  llenado?: number
  idDeLlenado?: string
  className?: string
}) {
  const quemado = coccion === 'parcial' || coccion === 'quemada'
  const saliendo = sellos.includes('saliendo')
  const xs = formato === 'tira' ? posicionesMaki(sellos.length, huesos) : posiciones(sellos.length, formato)
  const cortado = rollCortado(carne)
  const silueta = siluetaDe(formato, huesos, cortado)
  const lleno = Math.max(0, Math.min(1, llenado))
  const aMedias = lleno < 1
  const recorte = idDeSilueta(formato, huesos, cortado)
  // El brillo de arriba cae sobre el lomo de la pieza: el roll entero empieza más abajo.
  const brilloY = formato === 'tira' && !cortado ? ROLL.arriba + 5 : 17
  return (
    <span className={cn('relative block', className)} aria-hidden>
      {/* La llama del soplete: lo único que se repite, y solo mientras algo está saliendo. */}
      {saliendo ? (
        // El soplete apunta hacia abajo, a la pieza: la llama sale de la boquilla y lame el pescado.
        <svg viewBox="0 0 40 50" className="pointer-events-none absolute bottom-[calc(100%-0.9rem)] left-1/2 w-1/4 -translate-x-1/2 overflow-visible">
          <rect x="14" y="0" width="12" height="9" rx="2" fill="#8d9aa6" />
          <path className="llama" d="M14 9H26C27 20 24 34 20 48C16 34 13 20 14 9Z" fill="#6fa8ff" opacity=".9" />
          <path className="llama llama-2" d="M17 9H23C23.5 17 22 27 20 37C18 27 16.5 17 17 9Z" fill="#eef6ff" />
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
        <ellipse cx="60" cy="59" rx={formato === 'choripan' ? 30 : 46} ry="4" fill="#6b5a44" opacity=".22" filter="url(#tp-sushi-sombra)" />
        {aMedias ? <path d={silueta} fill="rgba(34,31,28,.03)" stroke="rgba(34,31,28,.32)" strokeWidth="1.1" strokeDasharray="3 3" /> : null}
        <g clipPath={aMedias ? `url(#${idDeLlenado})` : undefined}>
          {formato === 'entrana' ? <Nigiri carne={carne} /> : null}
          {formato === 'tira' ? (cortado ? <MakiEnRodajas carne={carne} n={huesos} /> : <MakiEntero carne={carne} n={huesos} />) : null}
          {formato === 'bife' ? <Sashimi carne={carne} /> : null}
          {formato === 'chori' ? <Temaki carne={carne} /> : null}
          {formato === 'choripan' ? <Onigiri carne={carne} /> : null}
          {carne !== 'quemada' ? (
            <ellipse cx="46" cy={brilloY} rx="24" ry="4" fill="#ffffff" opacity={carne === 'cruda' ? 0.4 : 0.22} filter="url(#tp-sushi-difuso)" clipPath={`url(#${recorte})`} />
          ) : null}
          {coccion === 'quemada' ? (
            // El moho: manchas difusas, quietas. Lo único que se mueve es la llama del soplete.
            <g clipPath={`url(#${recorte})`} fill={PASADO.moho} opacity=".75">
              {MOHO.map(([cx, cy, r]) => (
                <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} filter="url(#tp-sushi-difuso)" />
              ))}
            </g>
          ) : null}
          <g clipPath={`url(#${recorte})`}>
            {sellos.map((sello, i) => (
              <Banda key={i} x={xs[i]!} sello={sello} chico={chico} />
            ))}
          </g>
          <path d={silueta} fill="none" stroke="rgba(60,40,30,.28)" strokeWidth=".9" />
        </g>
        {coccion === 'quemada' ? (
          // El olor que sube del pescado pasado: tres ondas quietas, a la izquierda de la banderita.
          <path
            d="M36 4c-3-3 3-5 0-8s3-5 0-8M52 2c-3-3 3-5 0-8s3-5 0-8M68 4c-3-3 3-5 0-8s3-5 0-8"
            fill="none"
            stroke={PASADO.olor}
            strokeWidth="1.6"
            strokeLinecap="round"
            opacity=".85"
          />
        ) : null}
        {quemado ? (
          <>
            {/* El halo y la banderita, idénticos a los del corte: lo que falló se ve igual en todas partes. */}
            <path d={silueta} className="late" fill="none" stroke={QUEMO} strokeWidth="2.4" filter="url(#tp-sushi-brillo)" />
            <path d="M107 20V-9" stroke="#8f8170" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M107 -9L122 -4L107 1Z" fill={QUEMO} />
          </>
        ) : null}
      </svg>
    </span>
  )
}
