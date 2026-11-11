import { View } from 'react-native'
import type { Tema } from '../lib/tema'
import { useTema } from './tema'

/**
 * La llama de «Lo que trajo»: la de la racha, la llamita de la burbuja con un hito y las de la
 * celebración. De noche es fuego; de día, la llama azul del soplete con que se sella el sushi.
 *
 * Dibujada con vistas, como los íconos de la barra (`iconos.tsx`): `react-native-svg` no está en
 * la 1.1.0 y esto le llega por aire. Cada lengua es un cuadrado con tres esquinas redondas, girado
 * para que la esquina viva quede arriba y estirado hacia arriba: una gota con punta. Encima, una
 * lengua más chica y más clara, el corazón de la llama.
 */

/** Los colores del dibujo, aparte de la paleta de la app, como la carne de `Pieza`. */
const COLORES_LLAMA: Record<Tema, { afuera: string; adentro: string }> = {
  noche: { afuera: '#e8621f', adentro: '#f7c04a' },
  dia: { afuera: '#2f6fe4', adentro: '#bfe2ff' },
}

/** Cuánto más alta que ancha es cada lengua. */
const ESTIRON = 1.3

/** El alto de una lengua de este ancho: el círculo de abajo, estirado, más la punta. */
function altoDe(ancho: number): number {
  return ancho * (0.5 + Math.SQRT1_2) * ESTIRON
}

function Lengua({ ancho, color, abajo, izquierda }: { ancho: number; color: string; abajo: number; izquierda: number }) {
  const alto = altoDe(ancho)
  return (
    <View style={{ position: 'absolute', left: izquierda, bottom: abajo, width: ancho, height: alto }}>
      <View
        style={{
          position: 'absolute',
          left: 0,
          // El centro del cuadrado, a medio ancho estirado del piso: así el círculo apoya abajo.
          top: alto - ancho * 0.5 * ESTIRON - ancho / 2,
          width: ancho,
          height: ancho,
          backgroundColor: color,
          borderRadius: ancho / 2,
          borderTopLeftRadius: 0,
          transform: [{ scaleY: ESTIRON }, { rotate: '45deg' }],
        }}
      />
    </View>
  )
}

/** Una llama de `alto` de alto. Es solo el dibujo: quien la pone dice al lado, en palabras, qué es. */
export function Llama({ alto }: { alto: number }) {
  const { tema } = useTema()
  const colores = COLORES_LLAMA[tema]
  const ancho = alto / altoDe(1)
  const corazon = ancho * 0.55
  return (
    <View
      style={{ width: ancho, height: alto }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Lengua ancho={ancho} color={colores.afuera} abajo={0} izquierda={0} />
      <Lengua ancho={corazon} color={colores.adentro} abajo={ancho * 0.06} izquierda={(ancho - corazon) / 2} />
    </View>
  )
}
