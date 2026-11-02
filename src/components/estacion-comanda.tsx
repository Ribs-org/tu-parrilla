import { useId } from 'react'
import type { EstadoComanda } from '@/db/schema'
import { cn } from '@/lib/utils'
import { FiguraAtun, FiguraRes } from './dibujos-insumo'

/*
 * La estación de una comanda: el dibujo a la izquierda de su tarjeta en La Cocina, que dice en qué
 * va sin palabras —las palabras van al lado— y, mientras el chef trabaja, se mueve. Un movimiento
 * por estado, cada uno con un solo significado:
 *
 * | Estado            | De noche, la parrilla                          | De día, la barra de sushi                     |
 * |-------------------|------------------------------------------------|-----------------------------------------------|
 * | Comanda colgada   | la comanda se mece en el riel                  | lo mismo, en el riel de madera                |
 * | El chef mira      | la lupa recorre la res                         | la lupa recorre el atún                       |
 * | El desposte       | el cuchillo va y viene; las líneas avanzan     | lo mismo, con el atún                         |
 * | Al fuego          | los cortes en la parrilla, el fuego y el humo  | el pescado cae sobre el arroz, y el soplete   |
 * | Sirviendo         | un corte viaja de la parrilla a la tabla       | una pieza viaja a la bandeja                  |
 * | Lista             | la tabla llena, humeando                       | la bandeja llena, con un destello             |
 * | Servida           | la tabla vacía                                 | la bandeja vacía                              |
 * | Terminó mal       | la res, apagada                                | el atún, apagado                              |
 *
 * La tabla y la bandeja llevan tantas piezas como tandas llegaron (hasta cuatro): es el «3 de 5»
 * dibujado. Cada movimiento parte de su cuadro quieto, el que queda con `prefers-reduced-motion`
 * (`globals.css`): la comanda derecha, la lupa sobre la carne, la pieza ya en la tabla. Las clases
 * viven en `globals.css`, junto al humo del corte y la fogata de la escena.
 *
 * Lienzo de 120 × 90, con su marco: de noche la cocina a oscuras, de día el papel de la barra.
 */

type Props = { estado: EstadoComanda; tandasServidas: number; className?: string }

const MADERA_NOCHE = { claro: '#c99a62', medio: '#a8763f', veta: '#87592c' }
const MADERA_DIA = { claro: '#e2c497', medio: '#d2ad78', veta: '#b98f5a' }
const FIERRO = '#8d9aa6'
const HUMO = 'rgba(214,220,227,.6)'

/** Cuántas piezas lleva la tabla: las tandas que llegaron, de una a cuatro. */
function piezasEnLaTabla(estado: EstadoComanda, servidas: number): number {
  if (estado === 'lista') return 4
  return Math.max(1, Math.min(servidas, 3))
}

function Marco({ id, tema, fuego = false }: { id: string; tema: 'noche' | 'dia'; fuego?: boolean }) {
  return tema === 'noche' ? (
    <>
      <defs>
        <linearGradient id={`${id}fondo`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#141a21" />
          <stop offset="1" stopColor="#232a33" />
        </linearGradient>
        <radialGradient id={`${id}brillo`} cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#ff8a3d" stopOpacity=".5" />
          <stop offset="1" stopColor="#ff8a3d" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="120" height="90" rx="12" fill={`url(#${id}fondo)`} />
      {fuego ? <ellipse className="brasa-viva" cx="60" cy="62" rx="58" ry="30" fill={`url(#${id}brillo)`} /> : null}
    </>
  ) : (
    <>
      <defs>
        <linearGradient id={`${id}fondo`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fbf6ee" />
          <stop offset="1" stopColor="#efe4d1" />
        </linearGradient>
      </defs>
      <rect x=".5" y=".5" width="119" height="89" rx="11.5" fill={`url(#${id}fondo)`} stroke="#e2d8c9" />
    </>
  )
}

/** La comanda de papel colgando del riel, con su borde de abajo dentado. */
function Comanda({ tema }: { tema: 'noche' | 'dia' }) {
  const dientes = Array.from({ length: 8 }, (_, n) => `l3.25 ${n % 2 === 0 ? 2.5 : -2.5}`).join('')
  return (
    <>
      <path d="M16 11H104" stroke={tema === 'noche' ? FIERRO : '#8f6b45'} strokeWidth="3" strokeLinecap="round" />
      <g className="vaiven">
        <rect x="56" y="8" width="8" height="7" rx="1.5" fill={tema === 'noche' ? '#c9d3dc' : '#5c564e'} />
        <path d={`M47 14H73V46${dientes.replace(/l3\.25/g, 'l-3.25')}V14Z`} fill="#f6efe2" stroke={tema === 'noche' ? 'none' : '#d9ccb6'} strokeWidth=".8" />
        <rect x="47" y="14" width="26" height="4.5" fill={tema === 'noche' ? '#c0392b' : '#2f4a6b'} />
        <path d="M51 24H68M51 29H65M51 34H69M51 39H62" stroke="#a89a84" strokeWidth="1.3" strokeLinecap="round" />
      </g>
      {/* El pase, con su campanilla: donde la comanda espera que alguien la tome. */}
      <rect x="12" y="72" width="96" height="5" rx="2.5" fill={tema === 'noche' ? '#3a4046' : '#d2ad78'} />
      <path d="M86 72a6 6 0 0 1 12 0Z" fill={tema === 'noche' ? '#c9a227' : '#b98f5a'} />
      <circle cx="92" cy="64.5" r="1.4" fill={tema === 'noche' ? '#c9a227' : '#b98f5a'} />
    </>
  )
}

/** La lupa del que revisa: recorre la pieza entera. */
function Lupa({ x, y }: { x: number; y: number }) {
  return (
    <g className="lupa">
      <path d={`M${x + 7} ${y + 7}L${x + 16} ${y + 16}`} stroke="#6b4a2e" strokeWidth="4.5" strokeLinecap="round" />
      <circle cx={x} cy={y} r="10" fill="rgba(255,255,255,.22)" stroke="#e6edf2" strokeWidth="2.6" />
      <path d={`M${x - 6} ${y - 2}A6.5 6.5 0 0 1 ${x - 1} ${y - 6.5}`} stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity=".8" />
    </g>
  )
}

/** El cuchillo que corta: de noche la cuchilla del desposte, de día el yanagiba largo. */
function Cuchillo({ y, largo }: { y: number; largo: number }) {
  const x = 60 - largo / 2
  return (
    <g className="cuchillo">
      <path d={`M${x} ${y + 1}L${x + largo} ${y - 3}L${x + largo + 1} ${y + 3}L${x + 4} ${y + 4}Z`} fill="#e6edf2" stroke={FIERRO} strokeWidth=".8" />
      <path d={`M${x + 4} ${y + 0.8}L${x + largo} ${y - 2.2}`} stroke="#ffffff" strokeWidth=".7" opacity=".9" />
      <rect x={x + largo + 1} y={y - 3.2} width="13" height="5.6" rx="2" fill="#5b3a22" transform={`rotate(-5 ${x + largo + 1} ${y})`} />
    </g>
  )
}

/** Un corte asado, con sus marcas de la parrilla. */
function Asado({ x, y, id, className }: { x: number; y: number; id: string; className?: string }) {
  return (
    <g className={className}>
      <path
        d={`M${x} ${y + 4.5}C${x} ${y + 1} ${x + 4} ${y} ${x + 9} ${y}C${x + 15} ${y} ${x + 18} ${y + 2} ${x + 18} ${y + 5}C${x + 18} ${y + 8} ${x + 14} ${y + 9} ${x + 9} ${y + 9}C${x + 3} ${y + 9} ${x} ${y + 8} ${x} ${y + 4.5}Z`}
        fill={`url(#${id}carne)`}
      />
      <path d={`M${x + 3} ${y + 1.6}C${x + 7} ${y + 0.4} ${x + 12} ${y + 0.4} ${x + 16} ${y + 2}`} stroke="#f0d6b0" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity=".6" />
      <path d={`M${x + 5} ${y + 2}l3 5.5M${x + 10} ${y + 2}l3 5.5`} stroke="#4a2414" strokeWidth="1.4" strokeLinecap="round" opacity=".75" />
    </g>
  )
}

function DegradadoCarne({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient id={`${id}carne`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#d47d50" />
        <stop offset=".5" stopColor="#b8603a" />
        <stop offset="1" stopColor="#8f4426" />
      </linearGradient>
    </defs>
  )
}

/** Tres volutas de humo, a destiempo: lo que se repite mientras algo se cocina. */
function Humo({ xs, y }: { xs: number[]; y: number }) {
  return (
    <>
      {xs.map((x, i) => (
        <path
          key={x}
          className={cn('voluta', i === 1 && 'voluta-2', i === 2 && 'voluta-3')}
          d={`M${x} ${y}C${x - 4} ${y - 5} ${x + 4} ${y - 9} ${x} ${y - 14}C${x - 4} ${y - 19} ${x + 4} ${y - 22} ${x} ${y - 26}`}
          fill="none"
          stroke={HUMO}
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      ))}
    </>
  )
}

const LLAMAS = [
  { x: 34, alto: 43, color: '#e8590c' },
  { x: 50, alto: 38, color: '#ff8a3d' },
  { x: 66, alto: 40, color: '#e8590c' },
  { x: 82, alto: 44, color: '#ff8a3d' },
]

/** La parrilla prendida: el brasero, las brasas, las llamas, la rejilla y los cortes encima. */
function Parrilla({ id, cortes }: { id: string; cortes: number[] }) {
  return (
    <>
      {/* Las patas y el brasero. */}
      <path d="M30 78L27 86M90 78L93 86" stroke="#3a4046" strokeWidth="3" strokeLinecap="round" />
      <path d="M18 56H102L95 79H25Z" fill="#2a2e33" stroke="#3a4046" strokeWidth="1.2" />
      <ellipse className="brasa-viva" cx="60" cy="58.5" rx="38" ry="3.6" fill="#ff5a1f" />
      <ellipse cx="60" cy="58" rx="22" ry="1.8" fill="#ffd166" opacity=".85" />
      {/* Las llamas, detrás de la rejilla: crecen desde las brasas. */}
      {LLAMAS.map(({ x, alto, color }, i) => (
        <path
          key={x}
          className={cn('fogata', i % 2 === 1 && 'fogata-2')}
          d={`M${x} ${alto}C${x + 3} ${alto + 6} ${x + 7} ${alto + 9} ${x + 6} 57H${x - 6}C${x - 7} ${alto + 9} ${x - 3} ${alto + 6} ${x} ${alto}Z`}
          fill={color}
        />
      ))}
      {/* La rejilla. */}
      <path d="M16 48H104" stroke={FIERRO} strokeWidth="2.6" strokeLinecap="round" />
      {Array.from({ length: 11 }, (_, n) => 20 + n * 8).map((x) => (
        <path key={x} d={`M${x} 46.5V49.5`} stroke="#6b7782" strokeWidth="1.4" />
      ))}
      {cortes.map((x) => (
        <Asado key={x} id={id} x={x} y={38} />
      ))}
    </>
  )
}

/** La tabla de madera donde se sirve: con su manija, y los cortes que ya llegaron. */
function Tabla({ x, ancho, y }: { x: number; ancho: number; y: number }) {
  return (
    <>
      <rect x={x} y={y} width={ancho} height="8" rx="3" fill={MADERA_NOCHE.medio} />
      <rect x={x} y={y} width={ancho} height="2.4" rx="1.2" fill={MADERA_NOCHE.claro} />
      <path d={`M${x + 5} ${y + 5}H${x + ancho * 0.4}M${x + ancho * 0.55} ${y + 5.6}H${x + ancho - 8}`} stroke={MADERA_NOCHE.veta} strokeWidth="1" strokeLinecap="round" />
      <rect x={x + ancho - 1} y={y + 2} width="8" height="4" rx="2" fill={MADERA_NOCHE.medio} />
    </>
  )
}

/** Una ramita de romero, sobre la tabla: la cocina que cuida el plato. */
function Romero({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <path d={`M${x} ${y}Q${x + 7} ${y - 4} ${x + 14} ${y - 3}`} stroke="#4f8f3a" strokeWidth="1.3" strokeLinecap="round" fill="none" />
      {[2, 5, 8, 11].map((d) => (
        <path key={d} d={`M${x + d} ${y - d * 0.28}l1.5 -2.6M${x + d} ${y - d * 0.28}l2 1.6`} stroke="#7fbf5f" strokeWidth="1.2" strokeLinecap="round" />
      ))}
    </g>
  )
}

function Noche({ estado, tandasServidas, className }: Props) {
  const id = useId()
  const apagada = estado === 'rechazada' || estado === 'fallida' || estado === 'cancelada'
  const fuego = estado === 'en_el_horno' || estado === 'sirviendo'
  return (
    <svg viewBox="0 0 120 90" className={cn('solo-noche shrink-0', className)} aria-hidden>
      <Marco id={id} tema="noche" fuego={fuego} />
      <DegradadoCarne id={id} />
      {estado === 'recibida' ? <Comanda tema="noche" /> : null}

      {estado === 'revisando' || estado === 'en_preparacion' || estado === 'probando' || estado === 'pregunta' || apagada ? (
        <g transform="translate(22 2) scale(.8)" className={cn(apagada && 'opacity-40 grayscale')}>
          <FiguraRes id={id} cortada={estado === 'en_preparacion'} claseCorte="marcha" />
        </g>
      ) : null}
      {estado === 'revisando' ? <Lupa x={58} y={38} /> : null}
      {estado === 'en_preparacion' ? <Cuchillo y={45} largo={34} /> : null}

      {estado === 'en_el_horno' ? (
        <>
          <Humo xs={[38, 60, 82]} y={34} />
          <Parrilla id={id} cortes={[29, 51, 73]} />
        </>
      ) : null}

      {estado === 'sirviendo' ? (
        <>
          <g transform="translate(-6 10) scale(.62)">
            <Parrilla id={id} cortes={[40, 62]} />
          </g>
          <Humo xs={[24, 40]} y={36} />
          <Tabla x={64} ancho={44} y={66} />
          {Array.from({ length: piezasEnLaTabla(estado, tandasServidas) - 1 }, (_, n) => (
            <Asado key={n} id={id} x={66 + n * 12} y={57} />
          ))}
          {/* La tanda que sale: de la parrilla a la tabla, y otra vez. */}
          <Asado id={id} x={66 + (piezasEnLaTabla(estado, tandasServidas) - 1) * 12} y={57} className="viaja" />
        </>
      ) : null}

      {estado === 'lista' || estado === 'servida' ? (
        <>
          {estado === 'lista' ? <Humo xs={[40, 62, 82]} y={50} /> : null}
          <Tabla x={18} ancho={78} y={64} />
          {estado === 'lista' ? [22, 40, 58, 76].map((x) => <Asado key={x} id={id} x={x} y={55} />) : null}
          <Romero x={estado === 'lista' ? 70 : 48} y={estado === 'lista' ? 54 : 63} />
        </>
      ) : null}
    </svg>
  )
}

/** Un nigiri: el arroz y el pescado encima, con sus vetas. `claseNeta` mueve solo el pescado. */
function Nigiri({ cx, cy, claseNeta, className }: { cx: number; cy: number; claseNeta?: string; className?: string }) {
  return (
    <g className={className}>
      <ellipse cx={cx} cy={cy + 3} rx="10" ry="5" fill="#fffdf8" stroke="#d9ccb6" strokeWidth=".9" />
      <g className={claseNeta}>
        <path
          d={`M${cx - 12} ${cy}C${cx - 11} ${cy - 5.5} ${cx + 11} ${cy - 6} ${cx + 12.5} ${cy - 1}C${cx + 12.5} ${cy + 2} ${cx - 12} ${cy + 3} ${cx - 12} ${cy}Z`}
          fill="#f08a5d"
        />
        <path d={`M${cx - 7} ${cy - 2.6}q3 2 2 4.5M${cx} ${cy - 3.6}q3 2 2 5M${cx + 7} ${cy - 3}q2.5 2 1.6 4.4`} stroke="#ffffff" strokeWidth=".9" strokeLinecap="round" fill="none" opacity=".75" />
      </g>
    </g>
  )
}

/** El geta: la tabla de madera con patas donde se arman y se sirven las piezas. */
function Geta({ x, ancho, y }: { x: number; ancho: number; y: number }) {
  return (
    <>
      <rect x={x + 6} y={y + 7} width="6" height="5" rx="1" fill={MADERA_DIA.veta} />
      <rect x={x + ancho - 12} y={y + 7} width="6" height="5" rx="1" fill={MADERA_DIA.veta} />
      <rect x={x} y={y} width={ancho} height="8" rx="2.5" fill={MADERA_DIA.medio} />
      <rect x={x} y={y} width={ancho} height="2.4" rx="1.2" fill={MADERA_DIA.claro} />
    </>
  )
}

/** El soplete del aburi: de día, lo que arde mientras se arman las piezas. */
function Soplete() {
  return (
    <g>
      <path d="M101 10L109 16L96 33L90 29Z" fill="#5c564e" />
      <rect x="99" y="6" width="9" height="6" rx="2" transform="rotate(37 103 9)" fill="#c0392b" />
      <path d="M90 29L87 34" stroke="#3a4046" strokeWidth="3" strokeLinecap="round" />
      {/* La llama sale de la boquilla y lame el pescado. */}
      <g transform="rotate(32 87 34)">
        <path className="llama" d="M84 34H90C90.5 39 89 45 87 51C85 45 83.5 39 84 34Z" fill="#6fa8ff" opacity=".9" />
        <path className="llama llama-2" d="M85.5 34H88.5C88.8 38 88 42 87 46C86 42 85.2 38 85.5 34Z" fill="#eef6ff" />
      </g>
    </g>
  )
}

/** Una hoja de shiso y el wasabi: lo que acompaña la bandeja. */
function Shiso({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <path d={`M${x} ${y}C${x + 4} ${y - 9} ${x + 14} ${y - 11} ${x + 20} ${y - 9}C${x + 15} ${y - 4} ${x + 8} ${y + 1} ${x} ${y}Z`} fill="#7fbf5f" />
      <path d={`M${x + 1} ${y - 0.5}C${x + 7} ${y - 4} ${x + 12} ${y - 7} ${x + 18} ${y - 8.5}`} stroke="#4f8f3a" strokeWidth=".8" fill="none" />
      <path d={`M${x + 22} ${y}c1.5-4 7-4 8 0c.5 2-2.5 3-4 2.6c-2 .4-4.5-.4-4-2.6Z`} fill="#a9c864" />
    </g>
  )
}

function Dia({ estado, tandasServidas, className }: Props) {
  const id = useId()
  const apagada = estado === 'rechazada' || estado === 'fallida' || estado === 'cancelada'
  return (
    <svg viewBox="0 0 120 90" className={cn('solo-dia shrink-0', className)} aria-hidden>
      <Marco id={id} tema="dia" />
      {estado === 'recibida' ? <Comanda tema="dia" /> : null}

      {estado === 'revisando' || estado === 'en_preparacion' || estado === 'probando' || estado === 'pregunta' || apagada ? (
        <g transform="translate(5 -14) scale(1.15)" className={cn(apagada && 'opacity-40 grayscale')}>
          <FiguraAtun id={id} cortada={estado === 'en_preparacion'} claseCorte="marcha" />
        </g>
      ) : null}
      {estado === 'revisando' ? <Lupa x={52} y={40} /> : null}
      {estado === 'en_preparacion' ? <Cuchillo y={30} largo={46} /> : null}

      {estado === 'en_el_horno' ? (
        <>
          <Geta x={10} ancho={92} y={58} />
          {[30, 56, 82].map((cx, i) => (
            <Nigiri key={cx} cx={cx} cy={52} claseNeta={cn('cae', i === 1 && 'cae-2', i === 2 && 'cae-3')} />
          ))}
          <Soplete />
        </>
      ) : null}

      {estado === 'sirviendo' ? (
        <>
          <Geta x={6} ancho={44} y={62} />
          <Nigiri cx={28} cy={56} />
          <Soplete />
          <Geta x={60} ancho={52} y={62} />
          {Array.from({ length: piezasEnLaTabla(estado, tandasServidas) - 1 }, (_, n) => (
            <Nigiri key={n} cx={72 + n * 14} cy={56} />
          ))}
          {/* La pieza que sale: de la tabla del maestro a la bandeja, y otra vez. */}
          <Nigiri cx={72 + (piezasEnLaTabla(estado, tandasServidas) - 1) * 14} cy={56} className="viaja" />
        </>
      ) : null}

      {estado === 'lista' || estado === 'servida' ? (
        <>
          <defs>
            <clipPath id={`${id}bandeja`}>
              <rect x="14" y="36" width="92" height="36" />
            </clipPath>
          </defs>
          <Geta x={14} ancho={92} y={62} />
          {estado === 'lista' ? [28, 50, 72].map((cx) => <Nigiri key={cx} cx={cx} cy={56} />) : null}
          <Shiso x={estado === 'lista' ? 82 : 46} y={60} />
          {estado === 'lista' ? (
            <g clipPath={`url(#${id}bandeja)`}>
              <g transform="skewX(-20)">
                <rect className="destello" x="20" y="30" width="9" height="44" fill="#ffffff" />
              </g>
            </g>
          ) : null}
        </>
      ) : null}
    </svg>
  )
}

/** La estación en los dos modos, y el modo esconde una. */
export function EstacionDeLaComanda(props: Props) {
  return (
    <>
      <Noche {...props} />
      <Dia {...props} />
    </>
  )
}
