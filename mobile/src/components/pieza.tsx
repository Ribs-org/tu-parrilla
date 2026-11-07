import { useEffect, useId, useState } from 'react'
import { Animated, View } from 'react-native'
import Svg, { Circle, ClipPath, Defs, Ellipse, G, LinearGradient, Path, Stop } from 'react-native-svg'
import { MOTAS, SILUETA, posiciones } from '../lib/corte'
import { CARNE, GRASA, QUEMO, type Carne, type Coccion, type Formato, type Sello } from '../lib/parrilla'
import { ESCALA, Lienzo, useQuieto, ANCHO } from './lienzo'
import { PiezaDeSushi } from './pieza-sushi'
import { useColores, useTema } from './tema'

/**
 * El corte del panel (`src/components/corte.tsx`), dibujado con `react-native-svg` y las mismas
 * curvas (`src/lib/corte.ts`): la silueta es el formato, la carne la cocción, una marca por destino
 * que se quema cuando ese destino confirma, el halo rojo y la banderita si algo se quemó, y el humo
 * mientras algo sale.
 *
 * Desde la 1.2.0 (2026-11-07). Hasta ahí la app no tenía `react-native-svg` y armaba cada silueta
 * con vistas de bordes redondeados: la entraña quedaba como una barra larga y angosta, casi el chori.
 * `react-native-svg` es nativo y solo llega con el build 1.2.0, así que **este archivo no se copia a
 * la rama `ota-1.1.0`**: en un binario sin el módulo, la app se caería al abrir La Parrilla.
 *
 * Lo que no viene del panel: los difuminados (`feGaussianBlur`), que en el teléfono se fingen con
 * opacidad, y el latido de las brasas y del quemado, que acá queda quieto salvo el halo.
 *
 * De día, la pieza de sushi (`pieza-sushi.tsx`), con la misma gramática: `Pieza` elige según
 * el modo de la cuenta.
 *
 * Es solo el dibujo: quien lo pone escribe al lado, en palabras, lo que dice.
 */

/** Lo que se dibuja del lienzo del panel: un poco más que 120 × 64, para la banderita y las marcas. */
const CAJA = { x: -4, y: -12, ancho: 128, alto: 80 }
const MARCO = {
  position: 'absolute' as const,
  left: CAJA.x * ESCALA,
  top: CAJA.y * ESCALA,
  width: CAJA.ancho * ESCALA,
  height: CAJA.alto * ESCALA,
}
const VIEWBOX = `${CAJA.x} ${CAJA.y} ${CAJA.ancho} ${CAJA.alto}`

/** El pan del choripán: se tuesta con el chori que lleva adentro, como en el panel. */
const PAN: Record<Carne, { miga: string; corteza: string }> = {
  cruda: { miga: '#f1d29a', corteza: '#d9a861' },
  sellada: { miga: '#ebc286', corteza: '#cf9550' },
  punto: { miga: '#e0ac68', corteza: '#b97a35' },
  quemada: { miga: '#5e4532', corteza: '#3a2a1f' },
}

/** Lo que acompaña a cada carne, como en el panel: se oscurece con la cocción; la quemada no brilla. */
const VETAS: Record<Carne, { grasa: string; hueso: string; tuetano: string; nudo: string; brillo: [string, number] | null }> = {
  cruda: { grasa: '#f6ead8', hueso: '#f2e9da', tuetano: '#c99a8a', nudo: '#b5504a', brillo: ['#ffffff', 0.24] },
  sellada: { grasa: '#f0d6b0', hueso: '#efe0c8', tuetano: '#b98366', nudo: '#93452c', brillo: ['#ffffff', 0.12] },
  punto: { grasa: '#e3b878', hueso: GRASA, tuetano: '#9a6a44', nudo: '#5e3418', brillo: ['#f6c27a', 0.22] },
  quemada: { grasa: '#4a3a33', hueso: '#5d4f47', tuetano: '#2e221d', nudo: '#1a1210', brillo: null },
}

/**
 * La marca de un destino: una diagonal del fierro sobre la carne, como en el panel. Con los
 * grosores del corte chico del panel (×1,35): a este tamaño, una marca tiene que seguir contándose.
 */
function Marca({ x, sello, ambar }: { x: number; sello: Sello; ambar: string }) {
  const d = `M${x + 11} -2L${x - 11} 66`
  const g = 1.35
  const punteada = { fill: 'none', strokeLinecap: 'round' as const, strokeWidth: 3.2 * g, strokeDasharray: '3 5' }
  if (sello === 'bandeja') {
    // Quemada hasta la mitad, con el punto ámbar: salió, pero falta la mano del dueño.
    return (
      <>
        <Path d={`M${x + 11} -2L${x} 32`} fill="none" strokeLinecap="round" stroke="#24100a" strokeOpacity={0.82} strokeWidth={5 * g} />
        <Path d={`M${x} 32L${x - 11} 66`} {...punteada} stroke="#1e0a06" strokeOpacity={0.42} />
        <Circle cx={x} cy={32} r={3.4} fill={ambar} stroke="#24100a" strokeWidth={1} />
      </>
    )
  }
  if (sello === 'pendiente' || sello === 'saliendo') return <Path d={d} {...punteada} stroke="#1e0a06" strokeOpacity={0.42} />
  if (sello === 'reintento') return <Path d={d} {...punteada} stroke={ambar} />
  if (sello === 'frio') {
    return <Path d={d} fill="none" strokeLinecap="round" stroke="#9aa7b4" strokeOpacity={0.8} strokeWidth={3 * g} strokeDasharray="2 4" />
  }
  if (sello === 'quemado') {
    return (
      <>
        <Path d={d} fill="none" strokeLinecap="round" stroke="#0d0605" strokeWidth={6.5 * g} />
        <Path d={d} fill="none" strokeLinecap="round" stroke="#ff5a2e" strokeOpacity={0.35} strokeWidth={4} />
        <Path d={d} fill="none" strokeLinecap="round" stroke="#ff5a2e" strokeWidth={1.6} />
      </>
    )
  }
  return <Path d={d} fill="none" strokeLinecap="round" stroke="#24100a" strokeOpacity={0.82} strokeWidth={5 * g} />
}

function Textura({ formato, carne, huesos }: { formato: Formato; carne: Carne; huesos: number }) {
  const v = VETAS[carne]
  if (formato === 'bife') {
    return (
      <>
        <Path d="M17 25C21 14 39 9 60 9C78 9 92 11 101 16" stroke={v.grasa} strokeWidth={6} strokeLinecap="round" fill="none" opacity={0.85} />
        <Ellipse cx={46} cy={32} rx={9} ry={5.5} fill={v.grasa} opacity={0.5} />
        <Path
          d="M62 26c6 2 10-1 16 2M70 41c5-2 9 1 14-1M28 42c4 1 7-1 10 1M84 31c4 1 6 0 9 2"
          stroke={v.grasa}
          strokeWidth={1.3}
          fill="none"
          strokeLinecap="round"
          opacity={0.5}
        />
      </>
    )
  }
  if (formato === 'tira') {
    // Un hueso por archivo, como en el panel: se cuentan sin abrir el post.
    const n = Math.max(huesos, 2)
    const paso = 110 / n
    const rx = Math.min(7, paso * 0.3)
    return (
      <>
        <Path d="M6 21C30 15 90 15 114 21" stroke={v.grasa} strokeWidth={4} fill="none" opacity={0.75} />
        {Array.from({ length: n }, (_, i) => {
          const cx = 5 + (i + 0.5) * paso
          return (
            <G key={i}>
              <Ellipse cx={cx} cy={34} rx={rx} ry={9} fill={v.hueso} stroke="#000000" strokeOpacity={0.28} strokeWidth={0.8} />
              <Ellipse cx={cx} cy={34.5} rx={rx * 0.42} ry={3.6} fill={v.tuetano} />
            </G>
          )
        })}
      </>
    )
  }
  if (formato === 'choripan') {
    // Las dos mitades del pan tapan los costados: al medio queda el chori, que lleva la cocción.
    const pan = PAN[carne]
    return (
      <>
        {[6, 22, 38, 58].map((cy, i) => (
          <Circle key={cy} cx={i % 2 ? 58 : 62} cy={cy} r={1.3} fill={v.grasa} opacity={0.7} />
        ))}
        <Path d="M40 10H54C52 22 52 43 54 55H40Z" fill={pan.miga} />
        <Path d="M80 10H66C68 22 68 43 66 55H80Z" fill={pan.miga} />
        <Path d="M54 10C52 22 52 43 54 55M66 10C68 22 68 43 66 55" stroke={pan.corteza} strokeWidth={1.6} fill="none" />
        <Path d="M42 13C46 11 50 11 54 12M66 12C70 11 74 11 78 13" stroke={pan.corteza} strokeWidth={1.2} fill="none" />
        <Path d="M46 16C45 28 45 40 47 51M74 16C75 28 75 40 73 51" stroke="#ffffff" strokeOpacity={0.22} strokeWidth={1.4} fill="none" strokeLinecap="round" />
      </>
    )
  }
  if (formato === 'entrana') {
    // La fibra en diagonal: es lo que hace que una tira larga se lea como entraña.
    return (
      <>
        {Array.from({ length: 19 }, (_, i) => {
          const x = 6 + i * 6
          return <Path key={i} d={`M${x} 14L${x + 7} 54`} stroke="#000000" strokeOpacity={0.16} strokeWidth={1} />
        })}
        <Path d="M6 30C18 22 32 21 47 24C63 28 76 30 92 25C104 21 112 21 116 24" stroke={v.grasa} strokeWidth={1.8} fill="none" opacity={0.55} />
      </>
    )
  }
  return (
    <>
      {MOTAS.map(([cx, cy, r]) => (
        <Circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} fill={v.grasa} opacity={0.7} />
      ))}
      <Path d="M24 23C40 21 70 25 96 24" stroke="#ffffff" strokeOpacity={0.26} strokeWidth={2} fill="none" strokeLinecap="round" />
    </>
  )
}

/** El humo: tres volutas que suben y se apagan, desfasadas. Quieto, dos volutas fijas. */
function Humo({ quieto }: { quieto: boolean }) {
  // En estado y no en un ref: se crean una vez y se leen al dibujar, que un ref no deja.
  const [valores] = useState(() => [0, 1, 2].map(() => new Animated.Value(0)))
  useEffect(() => {
    if (quieto) return
    const bucles = valores.map((valor, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 800),
          Animated.timing(valor, { toValue: 1, duration: 2400, useNativeDriver: true }),
          Animated.timing(valor, { toValue: 0, duration: 0, useNativeDriver: true }),
        ]),
      ),
    )
    bucles.forEach((b) => b.start())
    return () => bucles.forEach((b) => b.stop())
  }, [quieto, valores])
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: ANCHO / 2 - 12, top: -16, width: 24, height: 20, flexDirection: 'row', justifyContent: 'space-between' }}>
      {valores.map((valor, i) => (
        <Animated.View
          key={i}
          style={{
            width: 3,
            height: 12,
            borderRadius: 2,
            marginTop: 6,
            backgroundColor: 'rgba(236,230,222,0.55)',
            opacity: quieto ? (i === 2 ? 0 : 0.42) : valor.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0, 0.75, 0] }),
            transform: quieto ? [] : [{ translateY: valor.interpolate({ inputRange: [0, 1], outputRange: [6, -8] }) }],
          }}
        />
      ))}
    </View>
  )
}

/**
 * El halo rojo alrededor de la silueta: late tres veces y después queda encendido. Quieto,
 * encendido de una. Va en su propio lienzo para que lo que late sea una vista, con el
 * `Animated` de siempre, y no un atributo del SVG.
 */
function Halo({ silueta, quieto }: { silueta: string; quieto: boolean }) {
  const [valor] = useState(() => new Animated.Value(1))
  useEffect(() => {
    if (quieto) return
    const latido = Animated.loop(
      Animated.sequence([
        Animated.timing(valor, { toValue: 0.25, duration: 800, useNativeDriver: true }),
        Animated.timing(valor, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
      { iterations: 3 },
    )
    latido.start()
    return () => latido.stop()
  }, [quieto, valor])
  return (
    <Animated.View pointerEvents="none" style={[MARCO, { opacity: quieto ? 1 : valor }]}>
      <Svg width="100%" height="100%" viewBox={VIEWBOX}>
        {/* El brillo del panel, fingido: una raya ancha y tenue debajo de la del halo. */}
        <Path d={silueta} fill="none" stroke={QUEMO} strokeOpacity={0.3} strokeWidth={5} />
        <Path d={silueta} fill="none" stroke={QUEMO} strokeWidth={2.4} />
      </Svg>
    </Animated.View>
  )
}

export type PropsDePieza = {
  formato: Formato
  huesos?: number
  carne: Carne
  coccion: Coccion
  sellos: readonly Sello[]
}

/** La pieza de cada post: el corte de carne de noche, la de sushi de día. */
export function Pieza(props: PropsDePieza) {
  const { tema } = useTema()
  return tema === 'dia' ? <PiezaDeSushi {...props} /> : <PiezaDeCarne {...props} />
}

function PiezaDeCarne({ formato, huesos = 0, carne, coccion, sellos }: PropsDePieza) {
  const quieto = useQuieto()
  const colores = useColores()
  // Un id por pieza: en la web (Expo web) los `id` del SVG son de toda la página, y dos piezas
  // con el mismo recorte se pisarían. Solo letras y números, que `url(#…)` no se lleva bien con
  // los dos puntos de `useId`.
  const id = `tp${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const v = VETAS[carne]
  const xs = posiciones(sellos.length, formato)
  const silueta = SILUETA[formato]
  const quemado = coccion === 'parcial' || coccion === 'quemada'
  const tope = CARNE[carne]
  return (
    <Lienzo>
      {sellos.includes('saliendo') ? <Humo quieto={quieto} /> : null}
      <View pointerEvents="none" style={MARCO}>
        <Svg width="100%" height="100%" viewBox={VIEWBOX}>
          <Defs>
            <LinearGradient id={`${id}c`} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={tope.claro} />
              <Stop offset="0.5" stopColor={tope.medio} />
              <Stop offset="1" stopColor={tope.hondo} />
            </LinearGradient>
            <ClipPath id={`${id}s`}>
              <Path d={silueta} />
            </ClipPath>
          </Defs>
          {/* La sombra sobre la parrilla: en el panel va difuminada; acá, dos elipses tenues. */}
          <Ellipse cx={60} cy={59} rx={formato === 'choripan' ? 24 : 50} ry={6} fill="#000000" opacity={0.2} />
          <Ellipse cx={60} cy={59} rx={formato === 'choripan' ? 20 : 44} ry={4} fill="#000000" opacity={0.35} />
          {formato === 'chori' ? (
            <>
              <Path d="M15 31L6 26.5L6.8 35.5Z" fill={v.nudo} />
              <Path d="M106 32L115 27.5L114.4 36.5Z" fill={v.nudo} />
            </>
          ) : null}
          <G clipPath={`url(#${id}s)`}>
            <Path d={silueta} fill={`url(#${id}c)`} />
            <Textura formato={formato} carne={carne} huesos={huesos} />
            {v.brillo ? <Ellipse cx={44} cy={19} rx={28} ry={5} fill={v.brillo[0]} opacity={v.brillo[1] * 0.8} /> : null}
            {coccion === 'quemada' ? (
              <Path
                d="M16 36l9-5 6 6 10-4 7 5M60 24l7 6 8-3 6 7M66 44l8-5 9 4 8-6"
                fill="none"
                stroke="#ff6b3d"
                strokeWidth={1.2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}
            {sellos.map((sello, i) => (
              <Marca key={i} x={xs[i]!} sello={sello} ambar={colores.ambar} />
            ))}
          </G>
          <Path d={silueta} fill="none" stroke="#000000" strokeOpacity={0.45} strokeWidth={1} />
          {quemado ? (
            <>
              {/* La banderita: el asta y el triángulo rojo, asomados arriba a la derecha. */}
              <Path d="M107 20V-9" stroke="#d9cbb5" strokeWidth={1.5} strokeLinecap="round" />
              <Path d="M107 -9L122 -4L107 1Z" fill={QUEMO} />
            </>
          ) : null}
        </Svg>
      </View>
      {quemado ? <Halo silueta={silueta} quieto={quieto} /> : null}
    </Lienzo>
  )
}
