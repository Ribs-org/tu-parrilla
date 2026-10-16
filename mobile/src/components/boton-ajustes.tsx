import { useCallback } from 'react'
import { Pressable, View, type ColorValue } from 'react-native'
import { useRouter } from 'expo-router'
import { COLORES } from './ui'
import { clearToken } from '../lib/session'
import type { Fierros } from '../lib/tipos'
import { useScreenData } from '../lib/useScreenData'
import { useToken } from '../lib/useToken'

/**
 * El ícono de Ajustes, como el del panel (`src/components/icono-ajustes.tsx`): un cuchillo
 * parrillero y un trinche de dos puntas cruzados, con las cabezas arriba. Dibujado con vistas,
 * como los íconos de la barra (`iconos.tsx`): cada herramienta se arma derecha y se gira
 * sobre su centro.
 */
export function IconoAjustes({ color }: { color: ColorValue }) {
  const pieza = { position: 'absolute' as const, backgroundColor: color }
  // Se giran sobre un punto bajo y no sobre su centro: así se cruzan por los mangos y las
  // cabezas quedan separadas arriba, como en el panel.
  const giro = (grados: number) => ({ transform: [{ rotate: `${grados}deg` }], transformOrigin: '50% 70%' })
  return (
    <View style={{ width: 22, height: 22 }}>
      {/* El trinche: dos puntas, la U que las une y el mango. */}
      <View style={{ position: 'absolute', left: 6, top: 0, width: 10, height: 22, ...giro(-40) }}>
        <View style={{ ...pieza, left: 0, top: 0, width: 2, height: 8, borderRadius: 1 }} />
        <View style={{ ...pieza, right: 0, top: 0, width: 2, height: 8, borderRadius: 1 }} />
        <View style={{ ...pieza, left: 0, top: 7, width: 10, height: 2, borderBottomLeftRadius: 3, borderBottomRightRadius: 3 }} />
        <View style={{ ...pieza, left: 4, top: 8, width: 2, height: 14, borderRadius: 1 }} />
      </View>
      {/* El cuchillo: la hoja con la punta redondeada de un lado, la guarda y el mango. */}
      <View style={{ position: 'absolute', left: 8, top: 0, width: 6, height: 22, ...giro(40) }}>
        <View style={{ ...pieza, left: 1, top: 0, width: 4, height: 10, borderTopLeftRadius: 1, borderTopRightRadius: 4 }} />
        <View style={{ ...pieza, left: 0, top: 10, width: 6, height: 1.5, borderRadius: 1 }} />
        <View style={{ ...pieza, left: 1.25, top: 11.5, width: 3.5, height: 10.5, borderRadius: 1.5 }} />
      </View>
    </View>
  )
}

/** Los fierros del dueño, de la caché primero: los comparten el botón de Ajustes y la pantalla. */
export function useFierros() {
  const token = useToken()
  const router = useRouter()
  const salir = useCallback(async () => {
    await clearToken()
    router.replace('/login')
  }, [router])
  return useScreenData<Fierros>('fierros', '/api/mobile/fierros', token, salir)
}

/**
 * El botón de Ajustes de la cabecera de cada pestaña, como el del panel: abre Ajustes y lleva un
 * punto cuando algo adentro necesita al dueño —ámbar si un fierro se enfría, rojo si se
 * apagó—. Sin nada que avisar, no hay punto. Un servidor de antes no tiene la ruta: el
 * botón queda sin punto y Ajustes lo dice.
 */
export function BotonAjustes() {
  const router = useRouter()
  const { data } = useFierros()
  const aviso = data?.aviso ?? null
  return (
    <Pressable
      onPress={() => router.push('/ajustes')}
      accessibilityRole="button"
      accessibilityLabel={aviso ? `Ajustes: ${aviso.frase}` : 'Ajustes'}
      hitSlop={8}
      style={({ pressed }) => ({
        marginRight: 16,
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
        backgroundColor: COLORES.tarjeta,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <IconoAjustes color={COLORES.texto} />
      {aviso ? (
        <View
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: 10,
            height: 10,
            borderRadius: 5,
            borderWidth: 2,
            borderColor: COLORES.fondo,
            backgroundColor: aviso.nivel === 'apagado' ? COLORES.rojo : COLORES.ambar,
          }}
        />
      ) : null}
    </Pressable>
  )
}
