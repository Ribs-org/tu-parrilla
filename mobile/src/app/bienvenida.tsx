import { useCallback, useEffect, useState } from 'react'
import { AppState, BackHandler, ScrollView, Text, View } from 'react-native'
import { useFocusEffect } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFierros } from '../components/boton-ajustes'
import { usePrimeraVuelta } from '../components/primera-vuelta'
import { useSesion } from '../components/sesion'
import { useColores, useTema } from '../components/tema'
import { Boton, BotonTexto, Etiqueta, Tarjeta, Titulo } from '../components/ui'
import { useVentanas } from '../components/ventana'
import { SesionCaducada } from '../lib/api'
import { abrirLosFierros } from '../lib/puente'
import { LA_PARRILLA, LOS_FIERROS, type Tema } from '../lib/tema'
import { NOMBRE_RED } from '../lib/tipos'

const PRENDE: Record<Tema, string> = { noche: 'Prende los fierros', dia: 'Afila los cuchillos' }
const PRENDIDOS: Record<Tema, string> = { noche: 'Fierros prendidos', dia: 'Cuchillos afilados' }

/**
 * La bienvenida (`lib/primera-vuelta.ts`): la primera vez en el teléfono y sin redes conectadas,
 * esto en vez de La Parrilla vacía. Una acción, conectar, que abre Los Fierros del panel con la
 * sesión ya abierta (el puente); y «Después», que no vuelve a preguntar. Al volver del navegador
 * relee las cuentas: con una conectada, lo dice y lleva a La Parrilla.
 */
export default function Bienvenida() {
  const colores = useColores()
  const { tema } = useTema()
  const insets = useSafeAreaInsets()
  const { token, salir } = useSesion()
  const { terminarBienvenida } = usePrimeraVuelta()
  const { avisar } = useVentanas()
  const { data, refrescar } = useFierros()
  const [abriendo, setAbriendo] = useState(false)

  // Al volver del navegador, lo recién conectado.
  useEffect(() => {
    const suscripcion = AppState.addEventListener('change', (siguiente) => {
      if (siguiente === 'active') void refrescar()
    })
    return () => suscripcion.remove()
  }, [refrescar])

  // Atrás, en Android, es «Después»: sin esto cerraría la app, y la bienvenida saldría de nuevo.
  useFocusEffect(
    useCallback(() => {
      const suscripcion = BackHandler.addEventListener('hardwareBackPress', () => {
        terminarBienvenida()
        return true
      })
      return () => suscripcion.remove()
    }, [terminarBienvenida]),
  )

  const conectadas = data?.cuentas.filter((cuenta) => cuenta.conectada) ?? []

  async function conectar() {
    if (!token) return
    setAbriendo(true)
    try {
      await abrirLosFierros(token)
    } catch (error) {
      if (error instanceof SesionCaducada) return void salir()
      await avisar('No se pudo abrir el panel', 'Revisa la señal y prueba de nuevo.')
    } finally {
      setAbriendo(false)
    }
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colores.fondo }}
      contentContainerStyle={{ flexGrow: 1, padding: 24, paddingTop: insets.top + 48, paddingBottom: insets.bottom + 32, gap: 16 }}
    >
      <Etiqueta>Tu Parrilla</Etiqueta>
      {conectadas.length === 0 ? (
        <>
          <Titulo>{PRENDE[tema]}</Titulo>
          <Text style={{ color: colores.texto, fontSize: 15, lineHeight: 22 }}>
            Te damos la bienvenida. Para partir, conecta tus redes: Instagram, TikTok, YouTube o Facebook. Con eso publicas desde
            acá, ves cómo le va a cada corte y respondes los comentarios.
          </Text>
          <Text style={{ color: colores.suave, fontSize: 13, lineHeight: 19 }}>
            Se conectan en el panel web, en {LOS_FIERROS[tema]}. Te llevamos con tu sesión abierta; cuando termines, vuelve acá.
          </Text>
          <View style={{ gap: 8, marginTop: 8 }}>
            <Boton destacado texto={abriendo ? 'Abriendo…' : 'Conectar mis redes'} deshabilitado={abriendo} onPress={() => void conectar()} />
            <BotonTexto texto="Después" onPress={terminarBienvenida} />
          </View>
        </>
      ) : (
        <>
          <Titulo>{PRENDIDOS[tema]}</Titulo>
          <Text style={{ color: colores.texto, fontSize: 15, lineHeight: 22 }}>
            {conectadas.length === 1 ? 'Listo. Ya está conectada:' : 'Listo. Ya están conectadas:'}
          </Text>
          {conectadas.map((cuenta) => (
            <Tarjeta key={cuenta.id}>
              <Text style={{ color: colores.texto, fontSize: 14, fontWeight: '600' }}>
                {NOMBRE_RED[cuenta.red] ?? cuenta.red} · {cuenta.handle ?? 'sin nombre'}
              </Text>
            </Tarjeta>
          ))}
          <Text style={{ color: colores.suave, fontSize: 13, lineHeight: 19 }}>
            Puedes conectar otras cuando quieras, desde Ajustes.
          </Text>
          <View style={{ gap: 8, marginTop: 8 }}>
            <Boton destacado texto={`Ir a ${LA_PARRILLA[tema]}`} onPress={terminarBienvenida} />
            <BotonTexto texto={abriendo ? 'Abriendo…' : 'Conectar otra'} deshabilitado={abriendo} onPress={() => void conectar()} />
          </View>
        </>
      )}
    </ScrollView>
  )
}
