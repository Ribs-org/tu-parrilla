import { useCallback } from 'react'
import { Alert, Linking, Text, View } from 'react-native'
import Constants from 'expo-constants'
import * as Updates from 'expo-updates'
import { useFocusEffect, useRouter } from 'expo-router'
import { Boton, BotonTexto, Etiqueta, Pantalla, Sello, Tarjeta } from '../components/ui'
import type { Colores } from '../components/colores'
import { useColores, useTema } from '../components/tema'
import { useFierros } from '../components/boton-ajustes'
import { API_BASE } from '../lib/config'
import { clearToken } from '../lib/session'
import { otroTema } from '../lib/tema'
import { NOMBRE_RED, type Fierros } from '../lib/tipos'

/** El fierro en palabras y en color, como la barra de cada tarjeta de Los Fierros. */
function fierroDe(cuenta: Fierros['cuentas'][number], colores: Colores): { color: string; barra: string; texto: string } {
  if (!cuenta.conectada) return { color: colores.tenue, barra: colores.acero, texto: 'Desconectada.' }
  if (cuenta.fierro === 'frio') {
    return { color: colores.rojo, barra: colores.acero, texto: 'Se apagó: así no publica. Reconéctala en el panel.' }
  }
  if (cuenta.fierro === 'enfriandose') {
    return { color: colores.ambar, barra: colores.ambar, texto: 'Se está enfriando: su permiso vence esta semana. Reconéctala en el panel.' }
  }
  return { color: colores.suave, barra: colores.brasa, texto: 'Al rojo: conectada.' }
}

/**
 * Ajustes, detrás del botón de la cabecera de cada pestaña (un trinche y un cuchillo, lado a lado): Los Fierros, tus cuentas con su temperatura
 * —las mismas tarjetas de Los Fierros, para leer; conectar y reconectar se hace en el panel,
 * que abre en el navegador— y «Cerrar sesión», que la app no tenía: hasta acá, la única forma
 * de salir era borrar la app.
 */
export default function Ajustes() {
  const colores = useColores()
  const { tema, cambiarTema } = useTema()
  const router = useRouter()
  const { data, cargando, error, sello, refrescar, refrescarSiVieja } = useFierros()

  useFocusEffect(
    useCallback(() => {
      refrescarSiVieja()
    }, [refrescarSiVieja]),
  )

  function cerrarSesion() {
    Alert.alert('¿Cerrar sesión en este teléfono?', 'Para volver a entrar te va a llegar un código a tu correo.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión',
        style: 'destructive',
        onPress: async () => {
          await clearToken()
          router.replace('/login')
        },
      },
    ])
  }

  // La versión del build y la de la última actualización por aire: lo primero que hay que
  // saber para ayudar a alguien con un problema.
  const version = Constants.expoConfig?.version ?? '—'
  // Sin actualización por aire (la versión que trae el build, o en desarrollo), solo la versión.
  const actualizacion = Updates.updateId ? ` · actualización ${Updates.updateId.slice(0, 8)}` : ''

  return (
    <Pantalla refrescando={cargando} onRefrescar={refrescar}>
      {/* «Los Fierros» y no «Tus cuentas»: así se llama en el panel, y «Tus cuentas» ya es
          otra cosa en Los Números (los seguidores de cada red). */}
      <Etiqueta>Los Fierros</Etiqueta>
      <Sello texto={sello} />
      {!data ? (
        <Text style={{ color: colores.suave, fontSize: 13 }}>
          {cargando ? 'Cargando tus cuentas…' : (error ?? 'No se pudo cargar.')}
        </Text>
      ) : data.cuentas.length === 0 ? (
        <Text style={{ color: colores.suave, fontSize: 13 }}>Todavía no conectas ninguna cuenta.</Text>
      ) : (
        data.cuentas.map((cuenta) => {
          const f = fierroDe(cuenta, colores)
          return (
            <Tarjeta key={cuenta.id}>
              <Text style={{ color: colores.texto, fontSize: 14, fontWeight: '600' }}>
                {NOMBRE_RED[cuenta.red] ?? cuenta.red} · {cuenta.handle ?? 'sin nombre'}
              </Text>
              {/* El fierro: una barra que dice si la conexión está viva, como en el panel. */}
              <View style={{ height: 4, borderRadius: 2, backgroundColor: f.barra, marginVertical: 2 }} />
              <Text style={{ color: f.color, fontSize: 12 }}>{f.texto}</Text>
            </Tarjeta>
          )
        })
      )}
      <Text style={{ color: colores.suave, fontSize: 12 }}>
        Tus redes conectadas. Se conectan y se reconectan en el panel web.
      </Text>
      <View style={{ flexDirection: 'row' }}>
        <Boton texto="Abrir Los Fierros en el panel" onPress={() => void Linking.openURL(`${API_BASE}/admin/accounts`)} />
      </View>

      {/* El modo, como el botón de la barra del panel: dice adónde lleva, no el que está puesto.
          Es de la cuenta, así que vale también en el panel web. */}
      <Etiqueta margenArriba>El modo</Etiqueta>
      <Text style={{ color: colores.suave, fontSize: 12 }}>
        {tema === 'dia' ? 'De día: el fondo claro y piezas de sushi.' : 'De noche: el acero y los cortes de la parrilla.'} Se
        guarda en tu cuenta: vale también en el panel web.
      </Text>
      <View style={{ flexDirection: 'row' }}>
        <Boton texto={tema === 'dia' ? 'Modo noche' : 'Modo día'} onPress={() => cambiarTema(otroTema(tema))} />
      </View>

      <Etiqueta margenArriba>Tu sesión</Etiqueta>
      <View style={{ alignItems: 'flex-start' }}>
        <BotonTexto texto="Cerrar sesión" onPress={cerrarSesion} peligro />
      </View>

      <Text style={{ color: colores.tenue, fontSize: 11, marginTop: 16 }}>
        Versión {version}
        {actualizacion}
      </Text>
    </Pantalla>
  )
}
