import { Platform } from 'react-native'
import * as Updates from 'expo-updates'

/**
 * Si este teléfono puede grabar un video o sacar una foto para La Cocina. El permiso de la cámara y
 * el del micrófono viven en el binario (`app.json`, plugin `expo-image-picker`), no en el
 * JavaScript, y llegaron en la 1.2.0: un teléfono con la 1.1.0 que recibe La Cocina por aire no
 * los tiene, y ahí Android responde que no al pedirlos, sin preguntar —«Grabar video» diría «Sin
 * permiso para la cámara» y mandaría a buscar un permiso que no existe en los ajustes—. Por eso la
 * pantalla ni los ofrece: queda «Elegir de la galería», que la 1.1.0 sí trae.
 *
 * Lo que se mira es la versión del binario (`Updates.runtimeVersion`, que con la política
 * `appVersion` es la versión de `app.json` el día del build). No sirve preguntarle al sistema por el
 * permiso: sin declararlo, Android dice lo mismo que cuando la persona lo negó para siempre.
 * `Constants.expoConfig.version` tampoco: viaja con la actualización y dice la versión de la rama
 * que la publicó, no la del binario. En la web y en desarrollo (sin versión) se graba, como hasta
 * ahora. Lo cuida `grabar.test.ts`.
 */
export const PRIMERA_CON_CAMARA = '1.2.0'

function partes(version: string): number[] | null {
  const m = /^(\d+)\.(\d+)(?:\.(\d+))?/.exec(version.trim())
  return m ? [Number(m[1]), Number(m[2]), Number(m[3] ?? 0)] : null
}

/** Sin el teléfono a mano: si un binario de esa plataforma y esa versión trae la cámara. */
export function binarioConCamara(plataforma: string, runtimeVersion: string | null | undefined): boolean {
  if (plataforma === 'web' || !runtimeVersion) return true
  const tiene = partes(runtimeVersion)
  const desde = partes(PRIMERA_CON_CAMARA)!
  // Una versión que no se entiende es de un esquema nuevo, no de uno más viejo que la 1.2.0.
  if (!tiene) return true
  for (let i = 0; i < 3; i++) {
    if (tiene[i]! !== desde[i]!) return tiene[i]! > desde[i]!
  }
  return true
}

/** Si este teléfono puede grabar: lo que decide si aparecen «Grabar video» y «Sacar foto». */
export function sePuedeGrabar(): boolean {
  return binarioConCamara(Platform.OS, Updates.runtimeVersion)
}
