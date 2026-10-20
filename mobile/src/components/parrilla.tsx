import { View, Text } from 'react-native'
import type { ReactNode } from 'react'
import { calorDelDia, type Calor } from '../lib/parrilla'
import { ROTULO_CALOR, type Tema } from '../lib/tema'
import { TIPO_TITULO } from './ui'
import { useColores, useTema } from './tema'

/**
 * La parrilla en el teléfono. Gemela de la clase `.grilla` del panel
 * (`src/app/globals.css`); el corte que va encima está en `pieza.tsx`. Dos diferencias que
 * impone React Native y que no son pereza:
 *
 * 1. **Sin degradados.** No hay `expo-linear-gradient` instalado y agregarlo es una
 *    dependencia nativa, o sea un build nuevo y una reinstalación a mano; esto viaja por
 *    aire al que ya está en el teléfono. El fuego se arma con capas superpuestas.
 * 2. **Sin los fierros de la grilla.** En el panel son bandas cada 13 px sobre el fuego.
 *    Acá habría que dibujarlas una por una porque no existe `repeating-linear-gradient`,
 *    y serían cientos de vistas en una lista que se desplaza. Las marcas del corte sí
 *    están, que son las que cuentan cómo le fue a cada destino; las de la grilla eran
 *    ambiente.
 */

/**
 * Las tres capas con las que se finge el fuego, de arriba abajo. De día no hay fuego: la tabla
 * de servir se lava de salmón desde abajo, más fuerte con la tabla llena, como el panel
 * (`.grilla-prendida` y `.grilla-llena` de día, en `globals.css`).
 */
const FUEGO: Record<Tema, Record<Calor, { color: string; alto: number }[]>> = {
  noche: {
    apagada: [],
    prendida: [
      { color: 'rgba(196,52,26,0.05)', alto: 0.4 },
      { color: 'rgba(232,98,31,0.13)', alto: 0.35 },
      { color: 'rgba(255,138,61,0.22)', alto: 0.25 },
    ],
    llena: [
      { color: 'rgba(196,52,26,0.12)', alto: 0.4 },
      { color: 'rgba(232,98,31,0.3)', alto: 0.35 },
      { color: 'rgba(255,138,61,0.46)', alto: 0.25 },
    ],
  },
  dia: {
    apagada: [],
    prendida: [
      { color: 'rgba(242,140,104,0.04)', alto: 0.4 },
      { color: 'rgba(242,140,104,0.14)', alto: 0.35 },
      { color: 'rgba(242,140,104,0.22)', alto: 0.25 },
    ],
    llena: [
      { color: 'rgba(242,140,104,0.1)', alto: 0.4 },
      { color: 'rgba(242,140,104,0.26)', alto: 0.35 },
      { color: 'rgba(242,140,104,0.4)', alto: 0.25 },
    ],
  },
}

/** El borde de la parrilla llena: la brasa de noche, el salmón tostado de día. */
const BORDE_LLENA: Record<Tema, string> = { noche: 'rgba(232,98,31,0.4)', dia: 'rgba(184,61,11,0.35)' }

/** Un día: el fuego debajo y los cortes encima. */
export function Grilla({ calor, children }: { calor: Calor; children: ReactNode }) {
  const colores = useColores()
  const { tema } = useTema()
  return (
    <View
      style={{
        position: 'relative',
        borderRadius: 4,
        borderWidth: 1,
        borderStyle: calor === 'apagada' ? 'dashed' : 'solid',
        borderColor: calor === 'llena' ? BORDE_LLENA[tema] : colores.tarjeta,
        backgroundColor: calor === 'apagada' ? colores.tarjeta : colores.fondo,
        overflow: 'hidden',
        padding: 10,
        gap: 8,
      }}
    >
      {/* El fuego, detrás de todo. `flex` reparte las tres capas de arriba abajo. */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} pointerEvents="none">
        {FUEGO[tema][calor].map((capa, i) => (
          <View key={i} style={{ flex: capa.alto, backgroundColor: capa.color }} />
        ))}
      </View>
      {children}
    </View>
  )
}

/** El rótulo de un día: qué día es y cómo está la parrilla. */
export function RotuloDia({ dia, cortes }: { dia: string; cortes: number }) {
  const colores = useColores()
  const { tema } = useTema()
  const calor = calorDelDia(cortes)
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginTop: 8,
        marginBottom: 6,
        gap: 8,
      }}
    >
      <Text
        style={{
          color: colores.suave,
          fontSize: 11,
          textTransform: 'uppercase',
          fontFamily: TIPO_TITULO,
          letterSpacing: 1.2,
        }}
      >
        {dia}
      </Text>
      <Text
        style={{
          color: calor === 'llena' ? colores.brasa : colores.suave,
          fontSize: 10,
          textTransform: 'uppercase',
          fontFamily: TIPO_TITULO,
          letterSpacing: 1,
        }}
      >
        {ROTULO_CALOR[tema][calor]}
      </Text>
    </View>
  )
}

/**
 * La miniatura de una fila de Contenido, con forma de corte.
 *
 * Contenido es una lista que se lee de corrido y volverla tarjetas la engordaría, así
 * que la parrilla entra por lo único que tiene superficie: las cuatro esquinas con
 * radios distintos y el rayado del fierro encima. El paso del rayado es más apretado
 * que en el corte grande porque a 48 px el de 14 dejaría tres rayas y media. De día, en vez
 * del rayado, una banda de nori en el borde izquierdo, como en el panel (`.corte-mini`).
 */
export function MiniCorte({ children }: { children: ReactNode }) {
  const { tema } = useTema()
  return (
    <View
      style={{
        position: 'relative',
        borderTopLeftRadius: 11,
        borderTopRightRadius: 4,
        borderBottomRightRadius: 12,
        borderBottomLeftRadius: 5,
        overflow: 'hidden',
      }}
    >
      {children}
      <View
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        pointerEvents="none"
      >
        {tema === 'dia' ? (
          <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: 'rgba(31,44,38,0.85)' }} />
        ) : (
          Array.from({ length: 6 }, (_, i) => (
            <View
              key={i}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: i * 9,
                height: 2,
                backgroundColor: 'rgba(0,0,0,0.3)',
              }}
            />
          ))
        )}
      </View>
    </View>
  )
}
