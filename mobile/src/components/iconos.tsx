import { View, type ColorValue } from 'react-native'

/**
 * Los iconos de la barra de abajo, dibujados con `View`.
 *
 * Dibujados y no de una librería por dos razones. La primera es que ni
 * `@expo/vector-icons` ni `react-native-svg` están instalados, y los dos son dependencia
 * nativa: agregarlos obliga a compilar un build nuevo y a reinstalarlo a mano, mientras
 * que esto viaja en una actualización por aire al build que ya está en el teléfono. La
 * segunda es que un set genérico no tiene una parrilla, y es justo la que cuenta acá.
 *
 * Desde el 2026-10-16 la barra tiene tres pestañas, las del panel —La Parrilla, Publicar y
 * Los Números—; el fuego, el corte y la silueta de las cinco de antes se fueron con ellas.
 *
 * `tabBarIcon` recibe `{ color, focused, size }` y devuelve cualquier nodo de React
 * (ver https://docs.expo.dev/router/advanced/tabs/), así que no hace falta más.
 */

const CAJA = 24

function Caja({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ width: CAJA, height: CAJA, alignItems: 'center', justifyContent: 'center' }}>
      {children}
    </View>
  )
}

/**
 * La parrilla vista desde arriba, para La Parrilla: el marco y los tres fierros. Es el
 * icono que más se parece a lo que la pantalla hace, que es repartir cortes sobre los
 * fierros de cada día.
 */
export function IconoParrilla({ color }: { color: ColorValue }) {
  return (
    <Caja>
      <View
        style={{
          width: 19,
          height: 19,
          borderWidth: 1.8,
          borderColor: color,
          borderRadius: 4,
          justifyContent: 'space-evenly',
          paddingHorizontal: 2.5,
        }}
      >
        {[0, 1, 2].map((i) => (
          <View key={i} style={{ height: 1.8, borderRadius: 1, backgroundColor: color }} />
        ))}
      </View>
    </Caja>
  )
}

/**
 * Poner algo al fuego, para Publicar. Una cruz y no un corte sobre la parrilla: a 24
 * puntos los dos dibujos juntos se empastan, y esta es la acción principal de la app
 * — vale más que se lea de una que que rime con el resto.
 */
export function IconoPoner({ color }: { color: ColorValue }) {
  return (
    <Caja>
      <View style={{ width: 18, height: 18, alignItems: 'center', justifyContent: 'center' }}>
        <View
          style={{
            position: 'absolute',
            width: 18,
            height: 2.6,
            borderRadius: 2,
            backgroundColor: color,
          }}
        />
        <View
          style={{
            position: 'absolute',
            width: 2.6,
            height: 18,
            borderRadius: 2,
            backgroundColor: color,
          }}
        />
      </View>
    </Caja>
  )
}

/**
 * Publicar en la barra: la cruz sobre un círculo de brasa, más grande que los otros dos.
 * Es la acción principal y va al medio; activa o no, el círculo es siempre brasa y la cruz
 * del color del fondo, para que no dependa del tinte de la pestaña.
 */
export function BotonPublicar({ fondo, brasa, activo }: { fondo: ColorValue; brasa: ColorValue; activo: boolean }) {
  return (
    <View
      style={{
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: brasa,
        alignItems: 'center',
        justifyContent: 'center',
        // Activo, un aro del color del fondo lo separa de la barra: el mismo «estoy acá»
        // que el tinte les da a las otras dos.
        borderWidth: activo ? 3 : 0,
        borderColor: fondo,
      }}
    >
      <IconoPoner color={fondo} />
    </View>
  )
}

/** Tres barras de distinta altura, para Los Números. */
export function IconoNumeros({ color }: { color: ColorValue }) {
  return (
    <Caja>
      <View style={{ width: 18, height: 18, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        {[9, 18, 13].map((alto, i) => (
          <View key={i} style={{ width: 4, height: alto, borderRadius: 1.5, backgroundColor: color }} />
        ))}
      </View>
    </Caja>
  )
}
