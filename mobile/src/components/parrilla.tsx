import { View, Text } from 'react-native'
import type { ReactNode } from 'react'
import type { Resumen } from '../lib/agenda'
import { calorDelDia, type Calor } from '../lib/parrilla'
import { ROTULO_CALOR, servidos, type Tema } from '../lib/tema'
import { NOMBRE_RED } from '../lib/tipos'
import { colorDeRed } from './colores'
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

/**
 * A qué red va lo del día: una barra fina con un tramo por red, del largo de sus destinos y en su
 * color, como en el panel (`MezclaDelDia`, en `schedule/calendar.tsx`).
 */
export function MezclaDelDia({ mezcla }: { mezcla: readonly { red: string; destinos: number }[] }) {
  const colores = useColores()
  if (mezcla.length === 0) return null
  return (
    <View
      accessible
      accessibilityLabel={`A qué red va: ${mezcla.map((m) => `${NOMBRE_RED[m.red] ?? m.red} ${m.destinos}`).join(', ')}`}
      style={{ flexDirection: 'row', height: 4, borderRadius: 2, overflow: 'hidden', backgroundColor: colores.acero, marginBottom: 5 }}
    >
      {mezcla.map((m) => (
        <View key={m.red} style={{ flex: m.destinos, backgroundColor: colorDeRed(colores, m.red) }} />
      ))}
    </View>
  )
}

/**
 * Cuánto salió, cuánto se quemó y cuánto falta del día, con los signos de los chips del panel:
 * «21 ✓ · 23 por salir». El lector de pantalla lo oye en palabras.
 */
export function ResumenDelDia({ resumen }: { resumen: Resumen }) {
  const colores = useColores()
  const { tema } = useTema()
  const { servidos: salieron, fallaron, porSalir } = resumen
  const enPalabras = [
    salieron > 0 ? servidos(salieron, tema) : null,
    fallaron > 0 ? (fallaron === 1 ? '1 falló' : `${fallaron} fallaron`) : null,
    porSalir > 0 ? `${porSalir} por salir` : null,
  ].filter(Boolean)
  if (enPalabras.length === 0) return null
  const partes = [
    salieron > 0 ? { clave: 's', texto: `${salieron} ✓`, color: colores.verde } : null,
    fallaron > 0 ? { clave: 'f', texto: `${fallaron} ✕`, color: colores.rojo } : null,
    porSalir > 0 ? { clave: 'p', texto: `${porSalir} por salir`, color: colores.suave } : null,
  ].filter((p) => p !== null)
  return (
    <Text accessibilityLabel={enPalabras.join(', ')} style={{ color: colores.suave, fontSize: 11, marginBottom: 6 }}>
      {partes.map((p, i) => (
        <Text key={p.clave}>
          {i > 0 ? ' · ' : ''}
          <Text style={{ color: p.color }}>{p.texto}</Text>
        </Text>
      ))}
    </Text>
  )
}

/** La raya de «ahora» en el día de hoy, con la hora escrita: la brasa, porque es lo que está pasando. */
export function LineaDeAhora({ hora }: { hora: string }) {
  const colores = useColores()
  return (
    <View accessible accessibilityLabel={`Ahora, ${hora}`} style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 2 }}>
      <View style={{ backgroundColor: colores.brasa, borderRadius: 3, paddingHorizontal: 5, paddingVertical: 1 }}>
        <Text style={{ color: colores.fondo, fontSize: 10, fontWeight: '600', fontVariant: ['tabular-nums'] }}>ahora · {hora}</Text>
      </View>
      <View style={{ flex: 1, height: 2, backgroundColor: colores.brasa }} />
    </View>
  )
}
