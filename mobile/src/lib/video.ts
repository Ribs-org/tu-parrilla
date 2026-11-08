import { requireOptionalNativeModule } from 'expo'
import { Platform } from 'react-native'

// Si esta app puede reproducir un video adentro, con `expo-video`, que llegó con el build 1.2.0.
//
// Como `expo-audio` (`reproductor.ts`): `import 'expo-video'` en un binario sin el módulo nativo
// revienta al cargar (su `NativeVideoModule` llama a `requireNativeModule('ExpoVideo')`), así que
// quien lo usa pregunta antes y lo carga con un `require` adentro. La pantalla del mesón no se copia a
// la rama `ota-1.1.0`, pero si alguna vez se hace, sin el módulo el video se abre fuera de la app
// con `Linking` en vez de cerrarla. En la web de prueba, `expo-video` usa el `<video>` del navegador.

/** Si `expo-video` se puede cargar: la 1.2.0 en adelante, o la web. */
export function hayVideoNativo(): boolean {
  if (Platform.OS === 'web') return true
  try {
    return requireOptionalNativeModule('ExpoVideo') !== null
  } catch {
    return false
  }
}
