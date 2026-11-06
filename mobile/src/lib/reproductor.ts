import { requireOptionalNativeModule } from 'expo'
import { Linking, Platform } from 'react-native'

// La muestra de una canción de «Música de Instagram», para escucharla antes de elegirla.
//
// `expo-audio` llegó con la 1.2.0. Los teléfonos con la 1.1.0 reciben este código por aire
// (rama `ota-1.1.0`, ver `mobile/README.md`) sin el módulo nativo, y `import 'expo-audio'` en
// esa app revienta al cargar: su `AudioModule` llama a `requireNativeModule('ExpoAudio')`, que
// lanza si no está. Por eso no se importa arriba: se pregunta primero si el módulo nativo existe
// (`requireOptionalNativeModule`, que devuelve null en vez de lanzar), y recién entonces se
// carga con un `require` adentro de la función —Metro evalúa un módulo la primera vez que se le
// pide, no al armar el paquete—. Sin el módulo, la muestra se abre afuera con `Linking`, en el
// navegador o el reproductor del teléfono. En la web de prueba suena con el `Audio` del navegador.

/** Lo mínimo de un reproductor: los tres caminos de abajo lo cumplen. */
type Reproductor = { tocar: (url: string, alTerminar: () => void) => Promise<'suena' | 'afuera'>; parar: () => void }

type JugadorExpo = {
  play: () => void
  pause: () => void
  remove: () => void
  addListener: (evento: 'playbackStatusUpdate', fn: (estado: { didJustFinish?: boolean }) => void) => { remove: () => void }
}

/** Si esta app trae el módulo nativo de audio (la 1.2.0 en adelante). */
export function hayAudioNativo(): boolean {
  if (Platform.OS === 'web') return false
  try {
    return requireOptionalNativeModule('ExpoAudio') !== null
  } catch {
    return false
  }
}

function conExpoAudio(): Reproductor {
  let jugador: JugadorExpo | null = null
  let escucha: { remove: () => void } | null = null
  const soltar = () => {
    escucha?.remove()
    escucha = null
    jugador?.pause()
    jugador?.remove()
    jugador = null
  }
  return {
    async tocar(url, alTerminar) {
      soltar()
      // Recién acá, y solo si `hayAudioNativo()`: ver arriba.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { createAudioPlayer } = require('expo-audio') as { createAudioPlayer: (fuente: { uri: string }) => JugadorExpo }
      const nuevo = createAudioPlayer({ uri: url })
      jugador = nuevo
      escucha = nuevo.addListener('playbackStatusUpdate', (estado) => {
        if (estado.didJustFinish) {
          soltar()
          alTerminar()
        }
      })
      nuevo.play()
      return 'suena'
    },
    parar: soltar,
  }
}

function conNavegador(): Reproductor {
  let audio: HTMLAudioElement | null = null
  return {
    async tocar(url, alTerminar) {
      audio?.pause()
      audio = new Audio(url)
      audio.onended = alTerminar
      await audio.play()
      return 'suena'
    },
    parar() {
      audio?.pause()
      audio = null
    },
  }
}

function afuera(): Reproductor {
  return {
    async tocar(url) {
      await Linking.openURL(url)
      return 'afuera'
    },
    parar() {},
  }
}

function hayAudioDelNavegador(): boolean {
  return Platform.OS === 'web' && typeof Audio !== 'undefined'
}

/** Si la muestra se va a abrir fuera de la app: la 1.1.0, sin el módulo nativo. */
export function muestraSeAbreAfuera(): boolean {
  return !hayAudioNativo() && !hayAudioDelNavegador()
}

/** El reproductor que esta app puede usar. */
export function crearReproductor(): Reproductor {
  if (hayAudioNativo()) return conExpoAudio()
  if (hayAudioDelNavegador()) return conNavegador()
  return afuera()
}
