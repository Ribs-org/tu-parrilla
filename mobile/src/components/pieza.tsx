import { useEffect, useState } from 'react'
import { Animated, View, type ViewStyle } from 'react-native'
import { CARNE, GRASA, QUEMO, type Carne, type Coccion, type Formato, type Sello } from '../lib/parrilla'
import { ANCHO, ESCALA, Lienzo, Punteada, useQuieto } from './lienzo'
import { PiezaDeSushi } from './pieza-sushi'
import { useColores, useTema } from './tema'

/**
 * El corte del panel (`src/components/corte.tsx`), dibujado con vistas.
 *
 * El panel lo dibuja en SVG; acá no hay `react-native-svg` instalado, y agregarlo es una
 * dependencia nativa: un build nuevo y reinstalar a mano. Esto viaja por aire a la app que
 * ya está en el teléfono, así que las siluetas son aproximadas —bordes redondeados en vez
 * de curvas—, pero dicen lo mismo: la silueta es el formato, la carne la cocción, una marca
 * por destino que se quema cuando ese destino confirma, el halo rojo y la banderita si algo
 * se quemó, y el humo mientras algo sale.
 *
 * De día, la pieza de sushi (`pieza-sushi.tsx`), con la misma gramática: `Pieza` elige según
 * el modo de la cuenta.
 *
 * Es solo el dibujo: quien lo pone escribe al lado, en palabras, lo que dice.
 */

/** Dónde va la carne de cada formato dentro del lienzo, y con qué esquinas. */
const SILUETA: Record<Formato, ViewStyle> = {
  bife: { left: 6, top: 4, width: 53, height: 27, borderTopLeftRadius: 17, borderTopRightRadius: 13, borderBottomRightRadius: 15, borderBottomLeftRadius: 11 },
  tira: { left: 2, top: 8, width: 60, height: 18, borderRadius: 5 },
  entrana: { left: 1, top: 11, width: 62, height: 14, borderTopLeftRadius: 8, borderTopRightRadius: 7, borderBottomRightRadius: 6, borderBottomLeftRadius: 5 },
  chori: { left: 8, top: 10, width: 48, height: 14, borderRadius: 7 },
}

/** Lo que acompaña a cada carne, como en el panel: se oscurece con la cocción. */
const VETAS: Record<Carne, { grasa: string; hueso: string; tuetano: string; nudo: string }> = {
  cruda: { grasa: '#f6ead8', hueso: '#f2e9da', tuetano: '#c99a8a', nudo: '#b5504a' },
  sellada: { grasa: '#f0d6b0', hueso: '#efe0c8', tuetano: '#b98366', nudo: '#93452c' },
  punto: { grasa: '#e3b878', hueso: GRASA, tuetano: '#9a6a44', nudo: '#5e3418' },
  quemada: { grasa: '#4a3a33', hueso: '#5d4f47', tuetano: '#2e221d', nudo: '#1a1210' },
}

/** Dónde cae la marca de cada destino, en el lienzo del panel: entre 34 y 92, o al centro. */
function posiciones(n: number): number[] {
  if (n <= 1) return [62]
  return Array.from({ length: n }, (_, i) => 34 + (i * 58) / (n - 1))
}

/** La marca de un destino: una diagonal del fierro, inclinada como en el panel. */
function Marca({ x, sello }: { x: number; sello: Sello }) {
  const colores = useColores()
  const base: ViewStyle = { position: 'absolute', left: x - 3, top: -8, width: 6, height: 50, transform: [{ rotate: '18deg' }] }
  if (sello === 'servido') {
    return (
      <View style={[base, { alignItems: 'center' }]}>
        <View style={{ flex: 1, width: 3, borderRadius: 2, backgroundColor: '#24100a', opacity: 0.82 }} />
      </View>
    )
  }
  if (sello === 'quemado') {
    return (
      <View style={[base, { alignItems: 'center', justifyContent: 'center' }]}>
        <View style={{ position: 'absolute', top: 0, bottom: 0, width: 4, borderRadius: 2, backgroundColor: '#0d0605' }} />
        <View style={{ position: 'absolute', top: 0, bottom: 0, width: 1.2, backgroundColor: '#ff5a2e' }} />
      </View>
    )
  }
  if (sello === 'bandeja') {
    // Quemada hasta la mitad, con el punto ámbar: salió, pero falta la mano del dueño.
    return (
      <View style={[base, { alignItems: 'center' }]}>
        <View style={{ height: 25, width: 3, borderRadius: 2, backgroundColor: '#24100a', opacity: 0.82 }} />
        <View style={{ flex: 1, width: 6 }}>
          <Punteada color="#1e0a06" ancho={2} opacidad={0.42} />
        </View>
        <View style={{ position: 'absolute', top: 22, width: 5, height: 5, borderRadius: 3, backgroundColor: colores.ambar, borderWidth: 0.5, borderColor: '#24100a' }} />
      </View>
    )
  }
  if (sello === 'reintento') return <View style={base}><Punteada color={colores.ambar} ancho={2} /></View>
  if (sello === 'frio') return <View style={base}><Punteada color="#9aa7b4" ancho={2} opacidad={0.8} /></View>
  return <View style={base}><Punteada color="#1e0a06" ancho={2} opacidad={0.42} /></View>
}

function Textura({ formato, carne, huesos, ancho }: { formato: Formato; carne: Carne; huesos: number; ancho: number }) {
  const v = VETAS[carne]
  if (formato === 'bife') {
    return (
      <>
        <View style={{ position: 'absolute', left: 6, right: 8, top: 2, height: 3, borderRadius: 2, backgroundColor: v.grasa, opacity: 0.85 }} />
        <View style={{ position: 'absolute', left: 16, top: 12, width: 10, height: 6, borderRadius: 4, backgroundColor: v.grasa, opacity: 0.5 }} />
      </>
    )
  }
  if (formato === 'tira') {
    // Un hueso por archivo, como en el panel: se cuentan sin abrir el post.
    const n = Math.max(huesos, 2)
    const paso = ancho / n
    const w = Math.min(7, paso * 0.6)
    return (
      <>
        <View style={{ position: 'absolute', left: 0, right: 0, top: 1, height: 2, backgroundColor: v.grasa, opacity: 0.75 }} />
        {Array.from({ length: n }, (_, i) => (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: (i + 0.5) * paso - w / 2,
              top: 4,
              width: w,
              height: 10,
              borderRadius: w / 2,
              backgroundColor: v.hueso,
              borderWidth: 0.5,
              borderColor: 'rgba(0,0,0,0.28)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View style={{ width: w * 0.42, height: 4, borderRadius: 2, backgroundColor: v.tuetano }} />
          </View>
        ))}
      </>
    )
  }
  if (formato === 'entrana') {
    return <View style={{ position: 'absolute', left: 3, right: 4, top: 5, height: 1.5, borderRadius: 1, backgroundColor: v.grasa, opacity: 0.55 }} />
  }
  return (
    <>
      {[8, 15, 22, 29, 36, 12, 26, 40].map((x, i) => (
        <View key={i} style={{ position: 'absolute', left: x, top: i < 5 ? 4 : 8, width: 2, height: 2, borderRadius: 1, backgroundColor: v.grasa, opacity: 0.7 }} />
      ))}
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

/** El halo rojo: late tres veces y después queda encendido. Quieto, encendido de una. */
function Halo({ silueta, quieto, giro }: { silueta: ViewStyle; quieto: boolean; giro: ViewStyle['transform'] }) {
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
  const derecha = (silueta.left as number) + (silueta.width as number)
  return (
    <>
      <Animated.View
        pointerEvents="none"
        style={[silueta, { position: 'absolute', borderWidth: 1.5, borderColor: QUEMO, opacity: quieto ? 1 : valor, transform: giro }]}
      />
      {/* La banderita: un asta y un triángulo rojo, asomados arriba a la derecha. */}
      <View style={{ position: 'absolute', left: derecha - 7, top: -6, width: 1.2, height: 16, backgroundColor: '#d9cbb5' }} />
      <View
        style={{
          position: 'absolute',
          left: derecha - 6,
          top: -6,
          width: 0,
          height: 0,
          borderLeftWidth: 8,
          borderTopWidth: 3,
          borderBottomWidth: 3,
          borderLeftColor: QUEMO,
          borderTopColor: 'transparent',
          borderBottomColor: 'transparent',
        }}
      />
    </>
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
  const silueta = SILUETA[formato]
  const izquierda = silueta.left as number
  const ancho = silueta.width as number
  const v = VETAS[carne]
  const xs = posiciones(sellos.length).map((x) => x * ESCALA - izquierda)
  // La entraña va apenas torcida: así una tira larga se lee como entraña y no como un palo.
  const giro: ViewStyle['transform'] = formato === 'entrana' ? [{ rotate: '-3deg' }] : []
  return (
    <Lienzo>
      {sellos.includes('saliendo') ? <Humo quieto={quieto} /> : null}
      {/* La sombra sobre la parrilla. */}
      <View style={{ position: 'absolute', left: 10, right: 10, bottom: 0, height: 4, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.45)' }} />
      {formato === 'chori' ? (
        <>
          <View style={{ position: 'absolute', left: 3, top: 14, width: 6, height: 6, borderRadius: 1, backgroundColor: v.nudo, transform: [{ rotate: '45deg' }] }} />
          <View style={{ position: 'absolute', left: 55, top: 14, width: 6, height: 6, borderRadius: 1, backgroundColor: v.nudo, transform: [{ rotate: '45deg' }] }} />
        </>
      ) : null}
      <View
        style={[
          silueta,
          {
            position: 'absolute',
            overflow: 'hidden',
            backgroundColor: CARNE[carne].medio,
            borderWidth: 0.5,
            borderColor: 'rgba(0,0,0,0.45)',
            transform: giro,
          },
        ]}
      >
        {/* El degradado, fingido: la esquina clara arriba y la honda abajo. */}
        <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: '45%', backgroundColor: CARNE[carne].claro, opacity: 0.55 }} />
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '35%', backgroundColor: CARNE[carne].hondo, opacity: 0.5 }} />
        <Textura formato={formato} carne={carne} huesos={huesos} ancho={ancho} />
        {sellos.map((sello, i) => (
          <Marca key={i} x={xs[i]!} sello={sello} />
        ))}
      </View>
      {coccion === 'parcial' || coccion === 'quemada' ? <Halo silueta={silueta} quieto={quieto} giro={giro} /> : null}
    </Lienzo>
  )
}
