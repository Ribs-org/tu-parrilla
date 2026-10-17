import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { contraste, simular } from '../components/charts/color'
import {
  CARNE,
  GRASA,
  MAX_HUESOS,
  NOMBRE_COCCION,
  NOMBRE_FORMATO,
  ORDEN_CARNE,
  QUEMO,
  calorDelDia,
  carneDe,
  coccionDe,
  avisoDeFierros,
  comoSalio,
  cuentasFrias,
  estadoDelFierro,
  formatoDe,
  fraseDelAviso,
  medianaDe,
  selloDe,
  type Coccion,
} from './parrilla'

describe('calorDelDia', () => {
  it('sin cortes la parrilla está apagada', () => {
    expect(calorDelDia(0)).toBe('apagada')
  })

  it('uno o dos cortes la dejan prendida', () => {
    expect(calorDelDia(1)).toBe('prendida')
    expect(calorDelDia(2)).toBe('prendida')
  })

  // El umbral sale de la promesa del producto: publicar a volumen. Tres es un día de
  // trabajo normal, no un trofeo. Los dos bordes van explícitos porque mover este
  // número es una decisión de producto, no un ajuste.
  it('tres cortes o más la dejan llena', () => {
    expect(calorDelDia(3)).toBe('llena')
    expect(calorDelDia(12)).toBe('llena')
  })
})

describe('NOMBRE_COCCION', () => {
  it('cada cocción tiene su nombre en palabras, que es la lectura que no depende del color', () => {
    // El color es la primera señal y las palabras la segunda: el calendario las pone en un
    // `sr-only` bajo cada corte. Una cocción sin nombre dejaría un corte mudo para el lector
    // de pantalla, y eso el typecheck no lo ve porque `Record` admite la cadena vacía.
    const todas: Coccion[] = ['cruda', 'sellada', 'punto', 'parcial', 'quemada']
    for (const coccion of todas) expect(NOMBRE_COCCION[coccion].length).toBeGreaterThan(0)
    expect(NOMBRE_COCCION.quemada).toBe('Falló')
    expect(NOMBRE_COCCION.parcial).toBe('Falló en parte')
  })
})

describe('coccionDe', () => {
  it('sin destinos queda cruda', () => {
    expect(coccionDe([])).toBe('cruda')
  })

  it('programada sin publicar queda cruda', () => {
    expect(coccionDe(['scheduled', 'scheduled'])).toBe('cruda')
  })

  it('algo en curso la sella', () => {
    expect(coccionDe(['scheduled', 'publishing'])).toBe('sellada')
  })

  it('todos publicados la dejan a punto', () => {
    expect(coccionDe(['published', 'published'])).toBe('punto')
  })

  it('publicados a medias no llegan a punto', () => {
    expect(coccionDe(['published', 'scheduled'])).toBe('cruda')
  })

  // Un fallo gana sobre todo lo demás porque es lo que necesita el ojo. Pero uno solo no
  // quema el corte entero: antes, salir en Instagram y fallar en TikTok se veía igual que
  // no salir en ninguna.
  it('un fallo entre otros destinos lo quema en parte', () => {
    expect(coccionDe(['published', 'failed'])).toBe('parcial')
    expect(coccionDe(['publishing', 'failed'])).toBe('parcial')
    expect(coccionDe(['failed', 'published', 'publishing'])).toBe('parcial')
    expect(coccionDe(['scheduled', 'failed'])).toBe('parcial')
  })

  it('si fallaron todos, se quemó entero', () => {
    expect(coccionDe(['failed'])).toBe('quemada')
    expect(coccionDe(['failed', 'failed'])).toBe('quemada')
  })
})

describe('carneDe', () => {
  it('sin fallos, la carne es la cocción', () => {
    expect(carneDe(['scheduled'])).toBe('cruda')
    expect(carneDe(['publishing'])).toBe('sellada')
    expect(carneDe(['published'])).toBe('punto')
    expect(carneDe(['failed'])).toBe('quemada')
  })

  // El halo dice que algo se quemó; la carne, cómo va lo demás.
  it('quemado en parte se pinta con lo que no se quemó', () => {
    expect(carneDe(['published', 'failed'])).toBe('punto')
    expect(carneDe(['scheduled', 'failed'])).toBe('cruda')
    expect(carneDe(['publishing', 'failed', 'published'])).toBe('sellada')
  })
})

describe('formatoDe', () => {
  it('sin archivos es un chori: texto', () => {
    expect(formatoDe([])).toEqual({ formato: 'chori', huesos: 0 })
  })

  it('un video es una entraña y una foto un bife', () => {
    expect(formatoDe([{ mediaType: 'video' }])).toEqual({ formato: 'entrana', huesos: 0 })
    expect(formatoDe([{ mediaType: 'image' }])).toEqual({ formato: 'bife', huesos: 0 })
  })

  it('dos archivos o más son una tira, con un hueso por archivo', () => {
    expect(formatoDe([{ mediaType: 'image' }, { mediaType: 'video' }])).toEqual({ formato: 'tira', huesos: 2 })
    const cinco = Array.from({ length: 5 }, () => ({ mediaType: 'image' }))
    expect(formatoDe(cinco)).toEqual({ formato: 'tira', huesos: 5 })
  })

  // Al salir en todas sus redes, el video se borra del almacén con su fila (`limpiarMedia`) y
  // el post se queda con la cuenta. Antes no la había, y toda entraña publicada era un chori.
  it('los videos que ya se borraron del almacén cuentan: lo publicado no cambia de forma', () => {
    expect(formatoDe([], 1)).toEqual({ formato: 'entrana', huesos: 0 })
    expect(formatoDe([{ mediaType: 'image' }, { mediaType: 'image' }], 1)).toEqual({ formato: 'tira', huesos: 3 })
    expect(formatoDe([{ mediaType: 'image' }], 1)).toEqual({ formato: 'tira', huesos: 2 })
    expect(formatoDe([], 0)).toEqual({ formato: 'chori', huesos: 0 })
  })

  // Un carrusel de TikTok lleva hasta 35 fotos; en 120 de ancho, once huesos ya no se cuentan.
  it('los huesos tienen tope', () => {
    const muchas = Array.from({ length: 35 }, () => ({ mediaType: 'image' }))
    expect(formatoDe(muchas).huesos).toBe(MAX_HUESOS)
  })

  it('cada formato tiene su nombre, que es lo que lee el lector de pantalla', () => {
    for (const nombre of Object.values(NOMBRE_FORMATO)) expect(nombre.length).toBeGreaterThan(0)
  })
})

describe('selloDe', () => {
  const destino = { network: 'instagram', status: 'scheduled', lastError: null, opciones: null }

  it('lee el estado del destino', () => {
    expect(selloDe(destino)).toBe('pendiente')
    expect(selloDe({ ...destino, status: 'publishing' })).toBe('saliendo')
    expect(selloDe({ ...destino, status: 'published' })).toBe('servido')
    expect(selloDe({ ...destino, status: 'failed', lastError: 'x' })).toBe('quemado')
  })

  it('un programado con motivo está esperando otro intento', () => {
    expect(selloDe({ ...destino, lastError: 'Instagram no respondió.' })).toBe('reintento')
  })

  // Salió, pero falta la mano del dueño: no es lo mismo que servido.
  it('el borrador en la bandeja de TikTok queda a medio quemar', () => {
    const tiktok = { network: 'tiktok', status: 'published', lastError: null, opciones: { modo: 'borrador' } }
    expect(selloDe(tiktok)).toBe('bandeja')
    expect(selloDe({ ...tiktok, opciones: { modo: 'directo' } })).toBe('servido')
    // Cuando el dueño lo publica desde su app, la sincronización le encuentra el video.
    expect(selloDe({ ...tiktok, externalId: '7001' })).toBe('servido')
  })

  it('programado en un fierro frío no va a salir así como está', () => {
    expect(selloDe(destino, 'frio')).toBe('frio')
    expect(selloDe(destino, 'enfriandose')).toBe('pendiente')
    // Lo que ya salió o ya falló no cambia porque la cuenta se haya enfriado después.
    expect(selloDe({ ...destino, status: 'published' }, 'frio')).toBe('servido')
    expect(selloDe({ ...destino, status: 'failed' }, 'frio')).toBe('quemado')
  })
})

describe('medianaDe', () => {
  it('sin valores no hay mediana', () => {
    expect(medianaDe([])).toBeNull()
  })

  it('con impares toma el del medio', () => {
    expect(medianaDe([5, 1, 3])).toBe(3)
  })

  it('con pares promedia los dos del medio', () => {
    expect(medianaDe([1, 3, 5, 7])).toBe(4)
  })

  /*
   * La razón de que sea mediana y no promedio. A un creador con un post viral el
   * promedio se le va arriba y todo lo demás le aparece frío, que es el mensaje
   * contrario al que el producto quiere dar.
   */
  it('un solo viral no la arrastra', () => {
    expect(medianaDe([100, 110, 120, 130, 50_000])).toBe(120)
  })
})

describe('comoSalio', () => {
  it('sin vistas ganadas no se puede comparar', () => {
    expect(comoSalio(null, 100)).toBe('sin-datos')
  })

  it('sin mediana tampoco', () => {
    expect(comoSalio(500, null)).toBe('sin-datos')
  })

  /*
   * En una semana sin movimiento, cualquier post con una sola vista sería «se pasó».
   * Eso es ruido, no información.
   */
  it('con la mediana en cero no se compara nada', () => {
    expect(comoSalio(1, 0)).toBe('sin-datos')
  })

  it('por debajo de la mediana es normal', () => {
    expect(comoSalio(99, 100)).toBe('normal')
  })

  it('en la mediana ya salió bien', () => {
    expect(comoSalio(100, 100)).toBe('salio-bien')
  })

  // Los dos bordes explícitos: el doble es una decisión, no un ajuste.
  it('el doble de la mediana es pasarse', () => {
    expect(comoSalio(199, 100)).toBe('salio-bien')
    expect(comoSalio(200, 100)).toBe('se-paso')
  })
})

describe('estadoDelFierro', () => {
  const AHORA = new Date('2026-09-18T12:00:00Z')
  const en = (dias: number) =>
    new Date(AHORA.getTime() + dias * 86_400_000).toISOString()
  const sano = { connected: true, expiraEn: null, ultimoError: null }

  it('sin credencial el fierro está frío', () => {
    expect(estadoDelFierro({ ...sano, connected: false }, AHORA)).toBe('frio')
  })

  it('una cuenta conectada y sin caducidad está al rojo', () => {
    expect(estadoDelFierro(sano, AHORA)).toBe('al-rojo')
  })

  it('un token con meses por delante está al rojo', () => {
    expect(estadoDelFierro({ ...sano, expiraEn: en(60) }, AHORA)).toBe('al-rojo')
  })

  it('un token que vence dentro de la semana se está enfriando', () => {
    expect(estadoDelFierro({ ...sano, expiraEn: en(3) }, AHORA)).toBe('enfriandose')
  })

  it('TikTok no se mide por su token de 24 horas: conectada y sin error, está al rojo', () => {
    // Su token corto se renueva solo con el de refresco, que dura un año. Sin esto, toda
    // cuenta de TikTok decía «vence mañana» desde el día que se conectaba.
    expect(estadoDelFierro({ ...sano, red: 'tiktok', expiraEn: en(0.5) }, AHORA)).toBe('al-rojo')
    expect(estadoDelFierro({ ...sano, red: 'tiktok', expiraEn: en(-1) }, AHORA)).toBe('al-rojo')
    // Lo que sí la enfría sigue enfriándola: sin credencial, o con la sincronización rota.
    expect(estadoDelFierro({ ...sano, red: 'tiktok', connected: false }, AHORA)).toBe('frio')
    expect(estadoDelFierro({ ...sano, red: 'tiktok', ultimoError: 'x' }, AHORA)).toBe('frio')
    // Y las demás redes no cambian.
    expect(estadoDelFierro({ ...sano, red: 'instagram', expiraEn: en(3) }, AHORA)).toBe('enfriandose')
  })

  it('YouTube tampoco se mide por su token de una hora', () => {
    // Google entrega uno de acceso que dura una hora y lo renueva con el de refresco
    // (`social/publish/youtube.ts`). Medido por la hora, la cuenta decía «vence hoy» recién
    // conectada y quedaba fría a la hora siguiente.
    expect(estadoDelFierro({ ...sano, red: 'youtube', expiraEn: en(0.04) }, AHORA)).toBe('al-rojo')
    expect(estadoDelFierro({ ...sano, red: 'youtube', expiraEn: en(-1) }, AHORA)).toBe('al-rojo')
    expect(estadoDelFierro({ ...sano, red: 'youtube', connected: false }, AHORA)).toBe('frio')
    expect(estadoDelFierro({ ...sano, red: 'youtube', ultimoError: 'x' }, AHORA)).toBe('frio')
  })

  // Su token dura dos horas y se renueva al publicar. Medido por ahí, decía «vence hoy» al
  // conectarla y quedaba fría a las dos horas (la auditoría de la wiki, §1.4).
  it('X tampoco se mide por su token de dos horas', () => {
    expect(estadoDelFierro({ ...sano, red: 'x', expiraEn: en(0.05) }, AHORA)).toBe('al-rojo')
    expect(estadoDelFierro({ ...sano, red: 'x', expiraEn: en(-1) }, AHORA)).toBe('al-rojo')
    expect(estadoDelFierro({ ...sano, red: 'x', connected: false }, AHORA)).toBe('frio')
    expect(estadoDelFierro({ ...sano, red: 'x', ultimoError: 'x' }, AHORA)).toBe('frio')
  })

  // Los dos bordes explícitos: mover el aviso es una decisión, no un ajuste.
  it('el aviso empieza justo en el día siete', () => {
    expect(estadoDelFierro({ ...sano, expiraEn: en(7) }, AHORA)).toBe('enfriandose')
    expect(estadoDelFierro({ ...sano, expiraEn: en(7.01) }, AHORA)).toBe('al-rojo')
  })

  it('un token vencido deja el fierro frío', () => {
    expect(estadoDelFierro({ ...sano, expiraEn: en(-1) }, AHORA)).toBe('frio')
  })

  /*
   * La credencial puede seguir vigente y la conexión estar rota igual —permisos
   * revocados desde la red, por ejemplo—. Para el caso da lo mismo: hay que reconectar.
   */
  it('un error de sincronización enfría el fierro aunque el token siga vivo', () => {
    expect(
      estadoDelFierro({ connected: true, expiraEn: en(60), ultimoError: 'OAuthException' }, AHORA),
    ).toBe('frio')
  })
})

describe('cuentasFrias', () => {
  const ahora = new Date('2026-10-16T12:00:00Z')
  const cuenta = { network: 'instagram', connected: true, expiresAt: null, lastSyncError: null }

  it('junta las desconectadas, las vencidas y las que no sincronizan', () => {
    const frias = cuentasFrias(
      [
        { ...cuenta, id: 'viva' },
        { ...cuenta, id: 'desconectada', connected: false },
        { ...cuenta, id: 'vencida', expiresAt: '2026-10-01T00:00:00Z' },
        { ...cuenta, id: 'rota', lastSyncError: 'x' },
        // Enfriándose todavía publica: no es fría.
        { ...cuenta, id: 'por-vencer', expiresAt: '2026-10-19T00:00:00Z' },
      ],
      ahora,
    )
    expect([...frias].sort()).toEqual(['desconectada', 'rota', 'vencida'])
  })
})

describe('avisoDeFierros', () => {
  const ahora = new Date('2026-10-16T12:00:00Z')
  const cuenta = { network: 'instagram', connected: true, expiresAt: null, lastSyncError: null }

  it('sin nada que avisar, no hay aviso', () => {
    expect(avisoDeFierros([cuenta], ahora)).toBeNull()
  })

  it('una desconectada a propósito no enciende nada', () => {
    expect(avisoDeFierros([{ ...cuenta, connected: false }], ahora)).toBeNull()
  })

  it('cuenta las que se enfrían', () => {
    const porVencer = { ...cuenta, expiresAt: '2026-10-19T00:00:00Z' }
    expect(avisoDeFierros([porVencer, porVencer, cuenta], ahora)).toEqual({ nivel: 'enfriandose', cuantos: 2 })
  })

  it('apagada gana sobre enfriándose', () => {
    const porVencer = { ...cuenta, expiresAt: '2026-10-19T00:00:00Z' }
    const rota = { ...cuenta, lastSyncError: 'x' }
    expect(avisoDeFierros([porVencer, rota], ahora)).toEqual({ nivel: 'apagado', cuantos: 1 })
  })

  it('lo dice en palabras', () => {
    expect(fraseDelAviso({ nivel: 'enfriandose', cuantos: 1 })).toBe('1 se enfría')
    expect(fraseDelAviso({ nivel: 'enfriandose', cuantos: 3 })).toBe('3 se enfrían')
    expect(fraseDelAviso({ nivel: 'apagado', cuantos: 1 })).toBe('1 se apagó')
    expect(fraseDelAviso({ nivel: 'apagado', cuantos: 2 })).toBe('2 se apagaron')
  })
})

// La chapa del panel: `--color-acero-900`, el fondo de las tarjetas.
const CHAPA = '#1d2124'

describe('los colores de la carne', () => {
  const medio = (carne: (typeof ORDEN_CARNE)[number]) => CARNE[carne].medio

  it('las carnes van estrictamente de clara a oscura', () => {
    // `contraste` contra negro es una lectura directa de la luminosidad relativa.
    const luces = ORDEN_CARNE.map((n) => contraste(medio(n), '#000000'))
    for (let i = 1; i < luces.length; i++) {
      expect(luces[i], `${ORDEN_CARNE[i]} no es más oscura que la anterior`).toBeLessThan(luces[i - 1]!)
    }
  })

  it('cada degradado va de su esquina clara a la honda', () => {
    for (const nombre of ORDEN_CARNE) {
      const { claro, medio, hondo } = CARNE[nombre]
      expect(contraste(claro, '#000000'), nombre).toBeGreaterThan(contraste(medio, '#000000'))
      expect(contraste(medio, '#000000'), nombre).toBeGreaterThan(contraste(hondo, '#000000'))
    }
  })

  // La escala de antes daba 1,32, 1,35 y 1,39 entre vecinas: en una casilla, cruda y
  // sellada eran el mismo café. Lo que el color no alcanza lo dicen las marcas y el halo.
  it('cada carne se distingue de su vecina', () => {
    for (let i = 1; i < ORDEN_CARNE.length; i++) {
      const ratio = contraste(medio(ORDEN_CARNE[i - 1]!), medio(ORDEN_CARNE[i]!))
      expect(ratio, `${ORDEN_CARNE[i - 1]} vs ${ORDEN_CARNE[i]}`).toBeGreaterThanOrEqual(1.5)
    }
  })

  it('la cruda y la quemada se separan de lejos', () => {
    expect(contraste(CARNE.cruda.medio, CARNE.quemada.medio)).toBeGreaterThanOrEqual(6)
  })

  /*
   * El umbral bajo daltonismo es más bajo que el de visión normal a propósito: la
   * simulación comprime los rojos hacia el pardo y achica todas las distancias. Lo que
   * tiene que sobrevivir es el orden de la escalera, con un piso de separación.
   */
  it.each(['protan', 'deutan', 'tritan'] as const)('la escalera sobrevive a %s', (tipo) => {
    const luces = ORDEN_CARNE.map((n) => contraste(simular(medio(n), tipo), '#000000'))
    for (let i = 1; i < luces.length; i++) {
      expect(luces[i], `${ORDEN_CARNE[i]} bajo ${tipo}`).toBeLessThan(luces[i - 1]!)
      const vecinas = contraste(simular(medio(ORDEN_CARNE[i - 1]!), tipo), simular(medio(ORDEN_CARNE[i]!), tipo))
      expect(vecinas, `${ORDEN_CARNE[i - 1]} vs ${ORDEN_CARNE[i]} bajo ${tipo}`).toBeGreaterThanOrEqual(1.5)
    }
    expect(contraste(simular(CARNE.cruda.medio, tipo), simular(CARNE.quemada.medio, tipo))).toBeGreaterThanOrEqual(5)
  })

  /*
   * Lo que guarda es la propiedad que hace que la grasa se lea como grasa: que sea más
   * clara que la carne. Si alguien la oscurece por debajo de la carne más clara, el
   * veteado se invierte y pasa a leerse como una sombra.
   */
  it('la grasa es más clara que las cuatro carnes', () => {
    const luzGrasa = contraste(GRASA, '#000000')
    for (const nombre of ORDEN_CARNE) {
      expect(luzGrasa, `la grasa no supera a ${nombre}`).toBeGreaterThan(contraste(CARNE[nombre].claro, '#000000'))
    }
  })

  /*
   * El halo es lo que hace visible un corte quemado: la carne quemada contra la chapa casi
   * no se ve (es lo que pasaba antes, a 1,19:1). Es un gráfico que hay que ver para
   * entender algo, así que WCAG le pide 3:1; se le exige el 4,5 del texto.
   */
  it('el halo de lo quemado se ve contra la chapa', () => {
    expect(contraste(QUEMO, CHAPA)).toBeGreaterThanOrEqual(4.5)
  })

  // Una copia del rojo vive en el CSS, para `text-negative` y los bordes del panel.
  it('el rojo de los mensajes del panel es el del halo', () => {
    const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
    expect(css).toMatch(new RegExp(`\\.acerado\\s*\\{[^}]*--color-negative:\\s*${QUEMO};`))
  })

  // Por qué el texto ya no va encima de la carne: sobre la cruda nueva no llega ni a 3:1.
  it('el texto del panel no se lee sobre la carne cruda', () => {
    expect(contraste('#f2ebe2', CARNE.cruda.medio)).toBeLessThan(3)
  })
})

/*
 * La app del teléfono repite estas reglas en `mobile/src/lib/parrilla.ts`. Están
 * copiadas y no importadas porque `mobile/` es un paquete aparte con su propio
 * empaquetador: Metro no sale de esa carpeta. Montar un paquete común para cuatro
 * colores y dos funciones cuesta más de lo que ahorra, pero una copia sin guardia se
 * separa sola — y separada significa que la misma publicación se ve cruda en el panel y
 * quemada en el teléfono.
 */
describe('el teléfono no se separó del panel', () => {
  const movil = readFileSync(new URL('../../mobile/src/lib/parrilla.ts', import.meta.url), 'utf8')
  const sinComentarios = movil.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')

  it.each(ORDEN_CARNE)('%s tiene los mismos tres topes en el teléfono', (nombre) => {
    const { claro, medio, hondo } = CARNE[nombre]
    expect(sinComentarios).toContain(`${nombre}: { claro: '${claro}', medio: '${medio}', hondo: '${hondo}' }`)
  })

  it('el rojo de lo quemado es el mismo en el teléfono', () => {
    expect(sinComentarios).toContain(`export const QUEMO = '${QUEMO}'`)
  })

  it('la grasa es la misma en el teléfono', () => {
    expect(sinComentarios).toContain(`export const GRASA = '${GRASA}'`)
  })

  /*
   * El umbral de «parrilla llena» también: si el panel dice que un día está lleno con
   * tres y el teléfono con cinco, el mismo día se ve distinto en cada pantalla y no hay
   * forma de saber cuál miente.
   */
  it('el umbral de parrilla llena es el mismo en el teléfono', () => {
    expect(sinComentarios).toContain('if (cortes < 3) return \'prendida\'')
  })

  /*
   * Y el de «se pasó». Si el panel marca un post como destacado y el teléfono no, el
   * dueño no tiene forma de saber cuál de las dos pantallas le está mintiendo.
   */
  it('el umbral de «se pasó» es el mismo en el teléfono', () => {
    expect(sinComentarios).toContain("if (ganadas >= mediana * 2) return 'se-paso'")
    expect(sinComentarios).toContain("if (ganadas >= mediana) return 'salio-bien'")
  })
})
