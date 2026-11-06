import { requireOptionalNativeModule } from 'expo'
import { Platform, Share } from 'react-native'

/**
 * Copiar un texto en el teléfono, con o sin el módulo del portapapeles.
 *
 * `expo-clipboard` entró en la 1.2.0, y un módulo nativo no llega por aire: el binario de la 1.1.0
 * no lo trae, y su actualización por aire (rama `ota-1.1.0`) lleva este mismo archivo. Por eso no
 * se importa `expo-clipboard` —su módulo de JavaScript llama a `requireNativeModule`, que lanza al
 * importarse si el nativo no está, y la app se caería al abrir—, sino que se le pide el nativo
 * por su nombre con `requireOptionalNativeModule`, que sin él devuelve null.
 *
 * Sin el nativo queda la lista de compartir del sistema (`Share`), que trae «Copiar» en Android
 * 10 en adelante y en iOS. No en todos los teléfonos: por eso ese botón no promete copiar
 * («Pasar el texto…», en `copiar-texto.tsx`). En la web (Expo web, para probar) se usa el
 * portapapeles del navegador.
 */

/** Lo que el módulo nativo de `expo-clipboard` expone; el segundo argumento lo exige Android. */
type ModuloPortapapeles = { setStringAsync(texto: string, opciones: Record<string, unknown>): Promise<boolean> }

export type ComoSeCopia = 'portapapeles' | 'compartir'
export type Resultado = 'copiado' | 'compartido' | 'fallo'

let nativo: ModuloPortapapeles | null | undefined

function moduloNativo(): ModuloPortapapeles | null {
  if (nativo === undefined) {
    nativo = Platform.OS === 'web' ? null : requireOptionalNativeModule<ModuloPortapapeles>('ExpoClipboard')
  }
  return nativo
}

function portapapelesWeb(): Clipboard | null {
  return Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard ? navigator.clipboard : null
}

/** Si este teléfono copia de verdad, o abre la lista de compartir. */
export function comoSeCopia(): ComoSeCopia {
  return moduloNativo() || portapapelesWeb() ? 'portapapeles' : 'compartir'
}

/**
 * Copia `texto`. «copiado» solo si de verdad quedó en el portapapeles; «compartido» si se abrió la
 * lista de compartir (lo que elija la persona ahí, la app no lo sabe); «fallo» si nada anduvo.
 * Si el portapapeles falla, todavía se prueba la lista de compartir.
 */
export async function copiarTexto(texto: string): Promise<Resultado> {
  try {
    const modulo = moduloNativo()
    if (modulo) {
      await modulo.setStringAsync(texto, {})
      return 'copiado'
    }
    const web = portapapelesWeb()
    if (web) {
      await web.writeText(texto)
      return 'copiado'
    }
  } catch {
    // Sigue con la lista de compartir.
  }
  try {
    await Share.share({ message: texto })
    return 'compartido'
  } catch {
    return 'fallo'
  }
}
