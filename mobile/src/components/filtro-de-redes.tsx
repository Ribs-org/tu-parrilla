import { Pressable, ScrollView, Text, View } from 'react-native'
import type { Filtro, RedEnElFiltro } from '../lib/filtro'
import { NOMBRE_RED } from '../lib/tipos'
import { colorDeRed } from './colores'
import { useColores } from './tema'

/**
 * El filtro por red de La Parrilla, como el del panel (`schedule/filtro-redes.tsx`): «Todas» y
 * un botón por red, cada uno con cuántos posts tiene de hoy en adelante, en un renglón que se
 * desliza de lado. Las cuentas de una red con varias no se ven hasta elegir esa red —el dueño
 * pidió no mostrar tanto—: entonces aparecen en un renglón debajo. Un toque en la red elegida la
 * suelta. «Se quemó» no obedece el filtro, como en el panel.
 */
export function FiltroDeRedes({
  todas,
  redes,
  filtro,
  alElegir,
}: {
  todas: number
  redes: readonly RedEnElFiltro[]
  filtro: Filtro | null
  alElegir: (filtro: Filtro | null) => void
}) {
  const colores = useColores()
  const elegida = filtro ? redes.find((r) => r.red === filtro.red) : undefined
  const nombre = (red: string) => NOMBRE_RED[red] ?? red
  return (
    <View style={{ gap: 6 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
        <Chip activo={!filtro} texto="Todas" cuantos={todas} onPress={() => alElegir(null)} />
        {redes.map((r) => {
          const activa = filtro?.red === r.red
          return (
            <Chip
              key={r.red}
              activo={activa}
              punto={colorDeRed(colores, r.red)}
              texto={nombre(r.red)}
              cuantos={r.cuantos}
              onPress={() => alElegir(activa && filtro?.cuenta === null ? null : { red: r.red, cuenta: null })}
            />
          )
        })}
      </ScrollView>
      {elegida && elegida.cuentas.length > 1 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          <Chip
            chico
            activo={filtro?.cuenta === null}
            texto={`Todas las de ${nombre(elegida.red)}`}
            cuantos={elegida.cuantos}
            onPress={() => alElegir({ red: elegida.red, cuenta: null })}
          />
          {elegida.cuentas.map((c) => (
            <Chip
              chico
              key={c.cuenta}
              activo={filtro?.cuenta === c.cuenta}
              texto={c.nombre ?? 'sin nombre'}
              cuantos={c.cuantos}
              onPress={() => alElegir({ red: elegida.red, cuenta: c.cuenta })}
            />
          ))}
        </ScrollView>
      ) : null}
    </View>
  )
}

/** Un botón del filtro: el punto de la red en su color, su nombre y cuántos tiene. */
function Chip({
  activo,
  punto,
  texto,
  cuantos,
  chico = false,
  onPress,
}: {
  activo: boolean
  punto?: string
  texto: string
  cuantos: number
  chico?: boolean
  onPress: () => void
}) {
  const colores = useColores()
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: activo }}
      accessibilityLabel={`${texto}, ${cuantos}`}
      hitSlop={6}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderWidth: 1,
        borderRadius: 999,
        borderColor: activo ? colores.brasa : colores.acero,
        backgroundColor: activo ? `${colores.brasa}1f` : 'transparent',
        paddingHorizontal: chico ? 10 : 12,
        paddingVertical: chico ? 5 : 7,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      {punto ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: punto }} /> : null}
      <Text style={{ color: activo ? colores.texto : colores.suave, fontSize: chico ? 12 : 13 }}>{texto}</Text>
      <Text style={{ color: colores.tenue, fontSize: 11, fontVariant: ['tabular-nums'] }}>{cuantos}</Text>
    </Pressable>
  )
}
