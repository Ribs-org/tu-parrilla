import { useEffect, useMemo, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, type ErrorBoundaryProps, type Theme } from 'expo-router'
// Del subcamino y no del paquete: el índice reexporta los seis grosores de Oswald y
// Metro se lleva los seis al paquete — 528 KB de tipografía para usar 88. `useFonts`
// sale de `expo-font`, que ya es dependencia directa.
import { Oswald_600SemiBold } from '@expo-google-fonts/oswald/600SemiBold'
import { useFonts } from 'expo-font'
import { StatusBar } from 'expo-status-bar'
import { PALETAS } from '../components/colores'
import { ProveedorDeSesion, useSesion } from '../components/sesion'
import { Cargando, TIPO_TITULO } from '../components/ui'
import { ProveedorDeTema, useColores, useTema } from '../components/tema'
import { borrarCaches } from '../lib/cache'

/** El modo de la cuenta, para toda la app: cada pantalla pide sus colores con `useColores()`. */
export default function RootLayout() {
  return (
    <ProveedorDeTema>
      <ProveedorDeSesion>
        <Raiz />
      </ProveedorDeSesion>
    </ProveedorDeTema>
  )
}

/**
 * Lo que se ve si algo se rompe al dibujarse, en vez de la app cerrándose sola. Envuelve todo
 * —también los proveedores, que pueden ser lo que se rompió—, así que no usa ninguno: los
 * colores de la noche, el modo de entrada, y la letra del sistema. «Reintentar» borra antes lo
 * guardado de las pantallas: lo más probable es que lo roto sea un dato que guardó una versión
 * anterior de la app, y sin borrarlo se rompería de nuevo al volver a dibujarlo.
 */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const colores = PALETAS.noche
  const [reintentando, setReintentando] = useState(false)
  // A la consola del sistema, que es lo que se lee conectando el teléfono: la pantalla no lo muestra.
  useEffect(() => {
    console.error('pantalla rota:', error)
  }, [error])

  async function reintentar() {
    setReintentando(true)
    await borrarCaches()
    await retry()
    setReintentando(false)
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24, gap: 12, backgroundColor: colores.fondo }}>
      <Text style={{ color: colores.texto, fontSize: 22, fontWeight: '600' }}>Algo se rompió</Text>
      <Text style={{ color: colores.suave }}>
        No fue nada que hicieras. Vuelve a intentarlo; si se repite, cierra la app y ábrela de nuevo.
      </Text>
      <Pressable
        onPress={() => void reintentar()}
        disabled={reintentando}
        accessibilityRole="button"
        style={{ alignSelf: 'flex-start', backgroundColor: colores.brasa, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 20 }}
      >
        <Text style={{ color: colores.fondo, fontWeight: '600' }}>{reintentando ? 'Reintentando…' : 'Reintentar'}</Text>
      </Pressable>
    </View>
  )
}

function Raiz() {
  const colores = useColores()
  const { tema } = useTema()
  const { estado } = useSesion()
  // Sin esto el navegador pinta su tema por defecto debajo de todo: el fondo de escena y las
  // cabeceras nativas salían blancos aunque cada pantalla se dibujara oscura. De día, el claro.
  const navegacion: Theme = useMemo(() => {
    const base = tema === 'dia' ? DefaultTheme : DarkTheme
    return {
      ...base,
      colors: { ...base.colors, background: colores.fondo, card: colores.tarjeta, text: colores.texto, border: colores.acero, primary: colores.brasa },
    }
  }, [tema, colores])
  /*
   * Oswald en tiempo de ejecución y no por el plugin de `expo-font`: el plugin es más
   * eficiente pero exige `prebuild`, o sea tocar la tubería nativa, y esto es un cambio
   * de piel. La espera cae dentro de la compuerta de carga que esta pantalla ya tenía.
   * Si la fuente no carga, se entra igual con la del sistema: quedarse en la pantalla de
   * inicio por una tipografía sería peor que verse distinto.
   */
  const [fuentesListas, errorFuentes] = useFonts({ Oswald_600SemiBold })
  const dentro = estado === 'dentro'

  return (
    <ThemeProvider value={navegacion}>
      {/* La hora y la batería, claras sobre la noche y oscuras sobre el papel de arroz. */}
      <StatusBar style={tema === 'dia' ? 'dark' : 'light'} />
      {estado !== 'arrancando' && (fuentesListas || errorFuentes) ? (
        <Stack
          screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colores.fondo } }}
        >
          {/* Cada pantalla de la cuenta, detrás de la sesión: afuera no se llega a ninguna, ni por
              un enlace ni volviendo atrás, y al salir se van todas de la pila. Una ruta que no
              esté nombrada acá queda fuera de la reja: expo-router la agrega igual, sin guardia. */}
          <Stack.Protected guard={dentro}>
            <Stack.Screen name="(tabs)" />
            {/* La única pantalla con cabecera: el detalle se empuja sobre esta pila y sin
                ella no hay cómo volver ni queda libre la franja de la hora. Declararla
                acá y no en el propio archivo la deja puesta también mientras el detalle
                busca en la caché y cuando no encuentra el post — ese archivo vuelve
                antes con `Cargando`. */}
            <Stack.Screen
              name="post/[id]"
              options={{
                headerShown: true,
                title: 'Publicación',
                headerTitleStyle: { color: colores.texto, fontFamily: TIPO_TITULO },
                headerTintColor: colores.brasa,
                headerStyle: { backgroundColor: colores.tarjeta },
                contentStyle: { backgroundColor: colores.fondo },
              }}
            />
            {/* Ajustes se abre desde el botón de Ajustes de cualquier pestaña y vuelve ahí. */}
            <Stack.Screen
              name="ajustes"
              options={{
                headerShown: true,
                title: 'Ajustes',
                headerTitleStyle: { color: colores.texto, fontFamily: TIPO_TITULO },
                headerTintColor: colores.brasa,
                headerStyle: { backgroundColor: colores.tarjeta },
                contentStyle: { backgroundColor: colores.fondo },
              }}
            />
            {/* «Tus publicaciones» se abre desde Los Números y vuelve ahí: la misma cabecera. */}
            <Stack.Screen
              name="publicaciones"
              options={{
                headerShown: true,
                title: 'Tus publicaciones',
                headerTitleStyle: { color: colores.texto, fontFamily: TIPO_TITULO },
                headerTintColor: colores.brasa,
                headerStyle: { backgroundColor: colores.tarjeta },
                contentStyle: { backgroundColor: colores.fondo },
              }}
            />
          </Stack.Protected>
          {/* Y la entrada, solo afuera: entrar la saca de la pila, y no se vuelve a ella atrás. */}
          <Stack.Protected guard={!dentro}>
            <Stack.Screen name="login" />
          </Stack.Protected>
        </Stack>
      ) : (
        <Cargando />
      )}
    </ThemeProvider>
  )
}
