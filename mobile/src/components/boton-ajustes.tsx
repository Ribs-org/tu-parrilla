import { useCallback } from 'react'
import { Pressable, View, type ColorValue } from 'react-native'
import { useRouter } from 'expo-router'
import { useColores } from './tema'
import { clearToken } from '../lib/session'
import type { Fierros } from '../lib/tipos'
import { useScreenData } from '../lib/useScreenData'
import { useToken } from '../lib/useToken'

/**
 * El ícono de Ajustes, como el del panel (`src/components/icono-ajustes.tsx`): un trinche de
 * dos puntas y un cuchillo criollo, de pie y lado a lado. Dibujado con vistas, como los íconos
 * de la barra (`iconos.tsx`), con las medidas del SVG del panel pasadas de 24 a 22.
 *
 * Cruzados en X se leían como herramientas —una llave y un destornillador— y no como cuchillo.
 * De pie, la hoja es un rectángulo con la esquina de arriba a la derecha muy redondeada: el lomo
 * queda recto, la punta arriba y el filo con panza, y es bastante más ancha que el mango, que
 * lleva dos remaches del color del fondo.
 */
export function IconoAjustes({ color, fondo }: { color: ColorValue; fondo: ColorValue }) {
  const pieza = { position: 'absolute' as const, backgroundColor: color }
  return (
    <View style={{ width: 22, height: 22 }}>
      {/* El trinche: dos puntas, el puente que las une, el cuello y el mango. */}
      <View style={{ ...pieza, left: 3.6, top: 1.5, width: 1.75, height: 7.6, borderTopLeftRadius: 0.9, borderTopRightRadius: 0.9 }} />
      <View style={{ ...pieza, left: 7.5, top: 1.5, width: 1.75, height: 7.6, borderTopLeftRadius: 0.9, borderTopRightRadius: 0.9 }} />
      <View style={{ ...pieza, left: 3.6, top: 7.8, width: 5.65, height: 2.55, borderBottomLeftRadius: 1.3, borderBottomRightRadius: 1.3 }} />
      <View style={{ ...pieza, left: 5.6, top: 10.2, width: 1.65, height: 2.4 }} />
      <View style={{ ...pieza, left: 4.9, top: 12.45, width: 3.05, height: 8.45, borderRadius: 1.45 }} />
      {/* El cuchillo: la hoja con el filo hacia la punta, la guarda y el mango con sus remaches. */}
      <View style={{ ...pieza, left: 12.2, top: 0.55, width: 6.3, height: 11.1, borderTopLeftRadius: 0.5, borderTopRightRadius: 5.8 }} />
      <View style={{ ...pieza, left: 11.75, top: 11.55, width: 7.25, height: 1.65, borderRadius: 0.65 }} />
      <View
        style={{
          ...pieza,
          left: 13.05,
          top: 13.2,
          width: 4.2,
          height: 7.9,
          borderTopLeftRadius: 0.9,
          borderTopRightRadius: 0.9,
          borderBottomLeftRadius: 1.2,
          borderBottomRightRadius: 1.2,
          alignItems: 'center',
          justifyContent: 'space-evenly',
        }}
      >
        <View style={{ width: 1.2, height: 1.2, borderRadius: 0.6, backgroundColor: fondo }} />
        <View style={{ width: 1.2, height: 1.2, borderRadius: 0.6, backgroundColor: fondo }} />
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
  const colores = useColores()
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
        borderColor: colores.velo + '1f',
        backgroundColor: colores.tarjeta,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <IconoAjustes color={colores.texto} fondo={colores.tarjeta} />
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
            borderColor: colores.fondo,
            backgroundColor: aviso.nivel === 'apagado' ? colores.rojo : colores.ambar,
          }}
        />
      ) : null}
    </Pressable>
  )
}
