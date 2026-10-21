import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'
import { describe, expect, it, vi } from 'vitest'
import { TARGET_STATUSES } from '@/db/schema'
import { ARCHIVO_FALTANTE, BORRADOR_NO_EXISTE, TIPO_NO_PUBLICABLE } from './mobile-api'
import {
  NOMBRE_COCCION,
  NOMBRE_FORMATO,
  calorDelDia,
  carneDe,
  coccionDe,
  comoSalio,
  medianaDe,
} from './parrilla'
import { tipoDesdeNombre, typeFromContentType } from './social/publish/batch'
import { ARCHIVO_MUY_GRANDE, MAX_BYTES_ARCHIVO } from './social/publish/limites'

// `batch.ts` trae `usuarios.ts`, que es solo de servidor; acá no se habla con la base.
vi.mock('server-only', () => ({}))

/*
 * Lo que la app del teléfono repite del servidor. `mobile/` no importa del sitio —Metro no sale
 * de esa carpeta—, así que lo copia, y una copia sin guardia se separa sola. Estas son las copias
 * que, separadas, rompen algo sin que se note: la app reconoce algunas frases del servidor por su
 * texto exacto (un borrador que ya no existe, un archivo que falta), y con una coma distinta
 * trataría un borrador perdido como «sin señal». Las de los colores y el vocabulario tienen sus
 * propias guardias (`parrilla.test.ts`, `paleta.test.ts`, `vocabulario.test.ts`).
 */

const fuenteDelTelefono = (ruta: string) => readFileSync(new URL(`../../mobile/src/${ruta}`, import.meta.url), 'utf8')

/**
 * Un módulo de `mobile/src/lib/`, compilado acá y corrido aparte, con sus imports relativos. No
 * se importa directo: `mobile/` tiene su propio tsconfig, el de Expo, y en el CI del sitio la app
 * no está instalada. Los módulos de `lib/` que se comparan solo importan otros de `lib/`.
 */
function delTelefono<T>(nombre: string, cargados = new Map<string, unknown>()): T {
  const ya = cargados.get(nombre)
  if (ya) return ya as T
  const { outputText } = ts.transpileModule(fuenteDelTelefono(`lib/${nombre}.ts`), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  })
  const exports: Record<string, unknown> = {}
  cargados.set(nombre, exports)
  const require = (ruta: string) => {
    if (!ruta.startsWith('./')) throw new Error(`${nombre}.ts importa ${ruta}: acá solo se corren copias de lib/`)
    return delTelefono(ruta.slice(2), cargados)
  }
  runInNewContext(outputText, { exports, require })
  return exports as T
}

type Descrito = { tipo: string; mediaType: 'image' | 'video' } | { error: string }
const publicar = delTelefono<{
  ARCHIVO_FALTANTE: string
  TIPO_NO_PUBLICABLE: string
  ARCHIVO_MUY_GRANDE: string
  describirArchivo: (asset: { uri: string; fileName?: string | null; mimeType?: string | null; fileSize?: number | null }) => Descrito
}>('publicar')
const borradores = delTelefono<{ BORRADOR_NO_EXISTE: string }>('borradores')

describe('las frases que la app reconoce por su texto', () => {
  it('son las del servidor, letra por letra', () => {
    expect(borradores.BORRADOR_NO_EXISTE).toBe(BORRADOR_NO_EXISTE)
    expect(publicar.ARCHIVO_FALTANTE).toBe(ARCHIVO_FALTANTE)
  })

  it('las de un archivo que no se puede elegir dicen lo mismo que diría el servidor', () => {
    expect(publicar.TIPO_NO_PUBLICABLE).toBe(TIPO_NO_PUBLICABLE)
    expect(publicar.ARCHIVO_MUY_GRANDE).toBe(ARCHIVO_MUY_GRANDE)
  })
})

describe('lo que la app deja elegir', () => {
  const elegido = (nombre: string, cambios: { mimeType?: string; fileSize?: number } = {}) =>
    publicar.describirArchivo({ uri: `file:///galeria/${nombre}`, fileName: nombre, mimeType: '', fileSize: 10, ...cambios })

  // Cuando el selector no dice el tipo, la app lo saca de la extensión. Lo que saca tiene que ser
  // lo que la subida acepta; si no, el archivo se elige y falla después, al subir.
  it.each(['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'mov', 'webm', 'heic', 'avi', 'svg', 'txt'])(
    'un .%s sin tipo declarado: la app y el servidor le dan el mismo',
    (extension) => {
      const enLaApp = elegido(`archivo.${extension}`)
      const enElServidor = tipoDesdeNombre(`archivo.${extension}`)
      const loAcepta = enElServidor !== '' && typeFromContentType(enElServidor) !== null
      if (!loAcepta) {
        expect(enLaApp).toEqual({ error: TIPO_NO_PUBLICABLE })
        return
      }
      expect('tipo' in enLaApp && enLaApp.tipo).toBe(typeFromContentType(enElServidor)!.tipo)
    },
  )

  // Cuando el selector sí dice el tipo, manda ese: la app tiene que aceptar lo mismo que la subida,
  // y mandarlo como lo firma el servidor (un `image/jpg` sale `image/jpeg`).
  it.each([
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/avif', 'image/svg+xml',
    'video/mp4', 'video/quicktime', 'video/webm', 'video/3gpp', 'video/x-matroska',
  ])('declarado %s: la app lo acepta si la subida lo acepta, con el mismo tipo', (declarado) => {
    const enLaApp = elegido('archivo', { mimeType: declarado })
    const enElServidor = typeFromContentType(declarado)
    if (!enElServidor) {
      expect(enLaApp).toEqual({ error: TIPO_NO_PUBLICABLE })
      return
    }
    expect(enLaApp).toMatchObject({ tipo: enElServidor.tipo, mediaType: enElServidor.mediaType })
  })

  it('el tope de tamaño es el del servidor', () => {
    expect(elegido('clip.mp4', { fileSize: MAX_BYTES_ARCHIVO })).toMatchObject({ tipo: 'video/mp4' })
    expect(elegido('clip.mp4', { fileSize: MAX_BYTES_ARCHIVO + 1 })).toEqual({ error: ARCHIVO_MUY_GRANDE })
  })
})

describe('los fierros', () => {
  // La app escribe a mano los estados del fierro que llegan en `GET /api/mobile/fierros`. Uno que
  // el servidor agregue y la app no conozca se vería «Al rojo: conectada».
  const estados = (texto: string) => new Set([...texto.matchAll(/'([a-z-]+)'/g)].map((m) => m[1]))
  const delServidor = estados(readFileSync(new URL('./parrilla.ts', import.meta.url), 'utf8').match(/export type Fierro = ([^\n]+)/)![1]!)

  it('la app conoce los mismos estados que el servidor manda', () => {
    expect(delServidor).toEqual(new Set(['al-rojo', 'enfriandose', 'frio']))
    const tipos = fuenteDelTelefono('lib/tipos.ts').match(/fierro: ([^}]+?) \}/)![1]!
    expect(estados(tipos)).toEqual(delServidor)
    const ajustes = fuenteDelTelefono('app/ajustes.tsx').match(/DICE_EL_FIERRO: Record<Tema, Record<([^,]+), string>>/)![1]!
    expect(estados(ajustes)).toEqual(delServidor)
  })
})

describe('las reglas de la parrilla dan lo mismo en el teléfono', () => {
  // `parrilla.test.ts` compara los colores de la copia; esto, lo que la copia decide.
  const movil = delTelefono<{
    NOMBRE_COCCION: typeof NOMBRE_COCCION
    NOMBRE_FORMATO: typeof NOMBRE_FORMATO
    calorDelDia: typeof calorDelDia
    coccionDe: (estados: readonly string[]) => string
    carneDe: (estados: readonly string[]) => string
    medianaDe: typeof medianaDe
    comoSalio: typeof comoSalio
  }>('parrilla')

  // Todas las combinaciones de hasta tres destinos: los estados de un post, en cualquier orden.
  const combinaciones: string[][] = [[]]
  for (let largo = 1; largo <= 3; largo++) {
    for (const previa of combinaciones.filter((c) => c.length === largo - 1)) {
      for (const estado of TARGET_STATUSES) combinaciones.push([...previa, estado])
    }
  }

  it('los mismos nombres', () => {
    expect(movil.NOMBRE_COCCION).toEqual(NOMBRE_COCCION)
    expect(movil.NOMBRE_FORMATO).toEqual(NOMBRE_FORMATO)
  })

  it('la misma cocción y la misma carne para cada combinación de estados', () => {
    for (const estados of combinaciones) {
      const comoEnElPanel = estados as (typeof TARGET_STATUSES)[number][]
      expect(movil.coccionDe(estados), estados.join(',')).toBe(coccionDe(comoEnElPanel))
      expect(movil.carneDe(estados), estados.join(',')).toBe(carneDe(comoEnElPanel))
    }
  })

  it('el mismo calor del día, la misma mediana y la misma marca', () => {
    for (let cortes = -1; cortes <= 12; cortes++) expect(movil.calorDelDia(cortes)).toBe(calorDelDia(cortes))
    for (const valores of [[], [5], [1, 9], [3, 1, 2], [10, 0, 4, 4]]) expect(movil.medianaDe(valores)).toBe(medianaDe(valores))
    for (const [ganadas, mediana] of [[null, 10], [10, null], [5, 0], [25, 10], [20, 10], [12, 10], [3, 10]] as const) {
      expect(movil.comoSalio(ganadas, mediana)).toBe(comoSalio(ganadas, mediana))
    }
  })
})
