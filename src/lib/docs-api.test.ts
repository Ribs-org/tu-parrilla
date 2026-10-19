import { readFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import {
  MAX_DOCUMENTO_BYTES,
  MAX_MENSAJE,
  MAX_PALABRA,
  MAX_RESPUESTA,
  REGLA_DOCUMENTO,
  REGLA_MENSAJE,
  REGLA_PALABRA,
  REGLA_RESPUESTA,
} from './social/comentarios/reglas'
import { MAX_BATCH_ITEMS, MAX_REF, REF_ERROR } from './social/publish/batch'
import { TOPE_INSTAGRAM, TRIAL_REEL_NO_DISPONIBLE } from './social/publish/publisher'
import { DIAS_ERROR, HORAS_ERROR } from './avisos/reglas'
import { BORRADO_YA_PUBLICADO } from './schedule-api'
import { TRIAL_REEL_MEDIA } from './social/publish/opciones'
import { LADO_ERROR, METRICA_ERROR, PERCENTIL_ERROR, RECIENTES_ERROR } from './mejores'
import { RANGO_ERROR, cuentaAmbigua, cuentaDesconocida } from './metrics-api'

// `batch.ts` importa `@/lib/usuarios` (la zona del dueño del lote), que trae
// `server-only` y no resuelve bajo Vitest. Mismo arreglo que en `aislamiento.test.ts`.
vi.mock('server-only', () => ({}))

// Estas tres pruebas son la reja que impide que `public/docs/api.json` y
// `public/docs/api-llm.md` —la documentación para un LLM que llama a la API a ciegas—
// se desvíen del código real. Ver la sección 9 de
// docs/superpowers/specs/2026-09-26-documento-por-privado-design.md.

describe('la documentación para LLM no le miente al código', () => {
  it('cada frase de error de la guía existe como constante del código', () => {
    const guia = readFileSync('public/docs/api-llm.md', 'utf8')
    for (const frase of [
      REGLA_PALABRA,
      REGLA_MENSAJE,
      REGLA_RESPUESTA,
      REGLA_DOCUMENTO,
      TRIAL_REEL_MEDIA,
      TRIAL_REEL_NO_DISPONIBLE,
      BORRADO_YA_PUBLICADO,
    ]) {
      expect(guia).toContain(frase)
    }
  })

  it('las frases de la ref, del resumen y del tope de Instagram son las del código, en las dos guías', () => {
    for (const archivo of ['public/docs/api-llm.md', 'public/docs/api-editor.md']) {
      const guia = readFileSync(archivo, 'utf8')
      for (const frase of [REF_ERROR, DIAS_ERROR, HORAS_ERROR, TOPE_INSTAGRAM]) {
        expect(guia, `${archivo}: ${frase}`).toContain(frase)
      }
    }
  })

  it('las frases de error de la lectura de métricas son las del código, en las dos guías', () => {
    for (const archivo of ['public/docs/api-llm.md', 'public/docs/api-editor.md']) {
      const guia = readFileSync(archivo, 'utf8')
      for (const frase of [
        RANGO_ERROR,
        METRICA_ERROR,
        PERCENTIL_ERROR,
        LADO_ERROR,
        RECIENTES_ERROR,
        cuentaDesconocida('<valor>'),
        cuentaAmbigua('<valor>'),
      ]) {
        expect(guia, `${archivo}: ${frase}`).toContain(frase)
      }
    }
  })

  it('las dos guías recomiendan el mismo vocabulario de atributos', () => {
    // El vocabulario no se valida en el código —es una recomendación—, así que lo único que
    // impide que las dos guías se separen es esto.
    const vocabulario = ['tema', 'hook', 'estilo', 'serie', 'color', 'fuente', 'ritmo', 'musica', 'duracion']
    for (const archivo of ['public/docs/api-llm.md', 'public/docs/api-editor.md']) {
      const guia = readFileSync(archivo, 'utf8')
      for (const clave of vocabulario) expect(guia, `${archivo}: ${clave}`).toContain(`| \`${clave}\` |`)
    }
  })

  it('cada límite del esquema es el que el validador aplica', () => {
    const esquema = JSON.parse(readFileSync('public/docs/api.json', 'utf8'))
    // El tope de filas por lote también: la guía lo dice en su tabla de errores («Máximo 50
    // posts por lote»), así que si la constante cambiara y el esquema no, el documento miente.
    expect(esquema.properties.posts.maxItems).toBe(MAX_BATCH_ITEMS)
    const regla = esquema.properties.posts.items.properties.regla.properties
    expect(regla.palabra.maxLength).toBe(MAX_PALABRA)
    expect(regla.mensaje.maxLength).toBe(MAX_MENSAJE)
    expect(regla.respuestaPublica.maxLength).toBe(MAX_RESPUESTA)
    // `maxBytes` no es una palabra clave de JSON Schema: es una anotación nuestra, porque el
    // tope no es del largo de la URL sino del archivo que hay detrás, y el esquema no tiene
    // forma de expresar eso. Los validadores la ignoran; el LLM la lee. Que quede dicho en
    // el propio esquema con una `description`, para que nadie la confunda con estándar.
    expect(regla.documentoUrl.maxBytes).toBe(MAX_DOCUMENTO_BYTES)
    expect(esquema.properties.posts.items.properties.ref.maxLength).toBe(MAX_REF)
  })

  it('el esquema declara exactamente los campos que el validador lee', () => {
    // En los dos sentidos: un campo que el esquema inventa haría que un LLM mande algo
    // que se ignora, y uno que el validador lee y el esquema no declara haría que nunca
    // lo use. Las dos son formas de mentir.
    const esquema = JSON.parse(readFileSync('public/docs/api.json', 'utf8'))
    const declarados = Object.keys(esquema.properties.posts.items.properties).sort()
    expect(declarados).toEqual(
      ['atributos', 'cuentas', 'fecha', 'media', 'opciones', 'portada', 'redes', 'ref', 'regla', 'texto'].sort(),
    )
  })
})
