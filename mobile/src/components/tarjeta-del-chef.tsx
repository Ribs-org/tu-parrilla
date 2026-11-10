import { useEffect, useState } from 'react'
import { Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { apiGet } from '../lib/api'
import type { Cocina } from '../lib/cocina'
import { puedePresentarAlChef, tocaElChef } from '../lib/primera-vuelta'
import { usePrimeraVuelta } from './primera-vuelta'
import { useSesion } from './sesion'
import { useColores } from './tema'
import { Boton, BotonTexto, Etiqueta, Tarjeta } from './ui'

/**
 * El chef, a la quinta apertura (`lib/primera-vuelta.ts`): una tarjeta arriba de La Parrilla, una
 * vez. Antes le pregunta a La Cocina si está encendida y si ya hay comandas; si no se puede saber,
 * no sale: es una presentación, no un aviso.
 */
export function TarjetaDelChef() {
  const colores = useColores()
  const router = useRouter()
  const { token } = useSesion()
  const { vuelta, presentarAlChef, conocerLaCocina } = usePrimeraVuelta()
  const [cocina, setCocina] = useState<{ encendida: boolean; comandas: number } | null>(null)
  const pregunta = puedePresentarAlChef(vuelta)

  useEffect(() => {
    if (!pregunta || !token) return
    let vigente = true
    // Si falla, no sale: el error de la sesión ya lo atienden las pantallas.
    void apiGet<Cocina>('/api/mobile/cocina', token)
      .then((c) => {
        if (!vigente) return
        // Con comandas ya lo conoce, aunque no haya abierto La Cocina en este teléfono: no se
        // vuelve a preguntar. Apagada sí, en otra apertura: el piloto se puede encender después.
        if (c.comandas.length > 0) return void conocerLaCocina()
        setCocina({ encendida: c.encendida, comandas: 0 })
      })
      .catch(() => undefined)
    return () => {
      vigente = false
    }
  }, [pregunta, token, conocerLaCocina])

  if (!tocaElChef(vuelta, cocina)) return null
  return (
    <Tarjeta>
      <Etiqueta>La Cocina</Etiqueta>
      <Text style={{ color: colores.texto, fontSize: 15, fontWeight: '600' }}>Te presento al chef</Text>
      <Text style={{ color: colores.suave, fontSize: 13, lineHeight: 19 }}>
        Le mandas lo que grabaste y te devuelve cortes listos para programar. Te espera en La Cocina.
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 4 }}>
        <Boton
          destacado
          texto="Ir a La Cocina"
          onPress={() => {
            presentarAlChef()
            router.navigate('/(tabs)/cocina')
          }}
        />
        <BotonTexto texto="Ahora no" onPress={presentarAlChef} />
      </View>
    </Tarjeta>
  )
}
