import { useCallback } from 'react'
import { Pressable, View, type ColorValue } from 'react-native'
import { useRouter } from 'expo-router'
import { COLORES } from './ui'
import { clearToken } from '../lib/session'
import type { Fierros } from '../lib/tipos'
import { useScreenData } from '../lib/useScreenData'
import { useToken } from '../lib/useToken'

/**
 * El engranaje dibujado con vistas, como los iconos de la barra (`iconos.tsx`): cuatro
 * barras cruzadas hacen los dientes, un disco las tapa al medio y un agujero del color del
 * fondo lo vuelve rueda.
 */
export function IconoEngranaje({ color, fondo }: { color: ColorValue; fondo: ColorValue }) {
  return (
    <View style={{ width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}>
      {[0, 45, 90, 135].map((giro) => (
        <View
          key={giro}
          style={{ position: 'absolute', width: 4, height: 19, borderRadius: 1, backgroundColor: color, transform: [{ rotate: `${giro}deg` }] }}
        />
      ))}
      <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: color }} />
      <View style={{ position: 'absolute', width: 6, height: 6, borderRadius: 3, backgroundColor: fondo }} />
    </View>
  )
}

/** Los fierros del dueño, de la caché primero: los comparten el engranaje y Ajustes. */
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
 * El engranaje de la cabecera de cada pestaña, como el del panel: abre Ajustes y lleva un
 * punto cuando algo adentro necesita al dueño —ámbar si un fierro se enfría, rojo si se
 * apagó—. Sin nada que avisar, no hay punto. Un servidor de antes no tiene la ruta: el
 * engranaje queda sin punto y Ajustes lo dice.
 */
export function Engranaje() {
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
      <IconoEngranaje color={COLORES.texto} fondo={COLORES.tarjeta} />
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
