import { describe, expect, it } from 'vitest'
import readXlsxFile from 'read-excel-file/node'
import { archivosDelZip } from '@/lib/pruebas/zip'
import { ESTILO, Libro, MAX_CARACTERES, letraDeColumna, serialDeDia, serialEnZona, textoSeguro, type Columna, type Fila } from './xlsx'

// El formato a mano: que lo que sale sea un `.xlsx` que otro programa abre (`read-excel-file`, que
// no comparte nada con este código), y que ningún texto llegue a ser una fórmula.

async function planilla(filas: readonly Fila[], columnas: readonly Columna[]): Promise<Buffer> {
  const libro = new Libro(['Léeme', 'Datos'], new Date('2026-11-02T13:00:00Z'))
  const partes: Buffer[] = [...(await libro.inicio('Prueba'))]
  async function* tandas() {
    yield filas.slice(0, 1)
    yield filas.slice(1)
  }
  partes.push(...(await libro.tabla(1, columnas, tandas())).bytes)
  partes.push(...(await libro.libre(0, [20, 60], [[{ valor: 'Título', estilo: ESTILO.titulo }], [{ valor: '=peligro' }]])))
  partes.push(...(await libro.cierre()))
  return Buffer.concat(partes)
}

const COLUMNAS: Columna[] = [
  { titulo: 'Texto', formato: 'texto', descripcion: 'x' },
  { titulo: 'Número', formato: 'entero', descripcion: 'x' },
  { titulo: 'Porcentaje', formato: 'porcentaje', descripcion: 'x' },
  { titulo: 'Fecha', formato: 'fecha', descripcion: 'x' },
]

describe('textoSeguro: un texto de un tercero nunca es una fórmula', () => {
  it.each([
    ['=HYPERLINK("http://malo.example","clic")', `'=HYPERLINK("http://malo.example","clic")`],
    ['+56 9 1234 5678', `'+56 9 1234 5678`],
    ['-1+1', `'-1+1`],
    ['@SUM(A1:A9)', `'@SUM(A1:A9)`],
    ['\tcmd', `'\tcmd`],
    ['\rcmd', `'\rcmd`],
  ])('%j lleva un apóstrofo adelante', (entra, sale) => {
    expect(textoSeguro(entra)).toBe(sale)
  })

  it('no toca lo que no empieza como fórmula', () => {
    expect(textoSeguro('hola = chao')).toBe('hola = chao')
    expect(textoSeguro(' =1+1')).toBe(' =1+1')
    expect(textoSeguro('')).toBe('')
  })

  it('quita los caracteres que XML no admite, también antes de mirar el primero', () => {
    expect(textoSeguro('a\u0000b\u0008c\u000Bd￾e')).toBe('abcde')
    expect(textoSeguro('\u0001=1+1')).toBe(`'=1+1`)
    // Una mitad suelta de un par sustituto se va; un emoji entero queda.
    expect(textoSeguro('x\uD800y🔥')).toBe('xy🔥')
  })

  it('no pasa el tope de caracteres de una celda de Excel', () => {
    expect(textoSeguro('a'.repeat(MAX_CARACTERES + 50))).toHaveLength(MAX_CARACTERES)
  })
})

describe('las piezas del formato', () => {
  it('nombra las columnas como Excel', () => {
    expect([1, 26, 27, 52, 53, 702, 703].map(letraDeColumna)).toEqual(['A', 'Z', 'AA', 'AZ', 'BA', 'ZZ', 'AAA'])
  })

  it('pasa un día y un instante a número de serie, en la zona de quien mira', () => {
    expect(serialDeDia('1970-01-01')).toBe(25_569)
    expect(serialDeDia('2026-11-02')).toBe(46_328)
    // 13:00 UTC son las 10:00 en Santiago en noviembre (UTC-3).
    expect(serialEnZona(new Date('2026-11-02T13:00:00Z'), 'America/Santiago')).toBeCloseTo(46_328 + 10 / 24, 8)
    expect(serialEnZona(new Date('2026-11-02T13:00:00Z'), 'UTC')).toBeCloseTo(46_328 + 13 / 24, 8)
  })

  it('no acepta un nombre de hoja que Excel rechazaría', () => {
    expect(() => new Libro(['a/b'])).toThrow()
    expect(() => new Libro(['x'.repeat(32)])).toThrow()
  })

  it('no cierra un libro con hojas sin escribir', async () => {
    const libro = new Libro(['Una', 'Otra'])
    await libro.inicio('x')
    await libro.libre(0, [10], [])
    await expect(libro.cierre()).rejects.toThrow(/Otra/)
  })
})

describe('el archivo que sale', () => {
  const filas: Fila[] = [
    ['=1+1', 3, 0.05, serialDeDia('2026-10-03')],
    ['@cmd', null, null, null],
    ['<b>&"</b>', -4, 1, null],
  ]

  it('lo abre otro lector, con las hojas en orden y los valores donde van', async () => {
    const hojas = await readXlsxFile(await planilla(filas, COLUMNAS))
    expect(hojas.map((h) => h.sheet)).toEqual(['Léeme', 'Datos'])
    const datos = hojas[1]!.data
    expect(datos[0]).toEqual(['Texto', 'Número', 'Porcentaje', 'Fecha'])
    expect(datos[1]![0]).toBe(`'=1+1`)
    expect(datos[1]![1]).toBe(3)
    expect(datos[1]![2]).toBe(0.05)
    expect(datos[1]![3]).toEqual(new Date('2026-10-03T00:00:00Z'))
    expect(datos[2]![0]).toBe(`'@cmd`)
    expect(datos[2]![1]).toBeNull()
    expect(datos[3]![0]).toBe('<b>&"</b>')
    expect(hojas[0]!.data[1]![0]).toBe(`'=peligro`)
  })

  it('no lleva ninguna fórmula, y sí el encabezado fijo y los filtros', async () => {
    const archivos = archivosDelZip(await planilla(filas, COLUMNAS))
    const hoja = archivos.get('xl/worksheets/sheet2.xml')!
    for (const [nombre, xml] of archivos) expect(xml, nombre).not.toMatch(/<f[ >]/)
    expect(hoja).toContain('state="frozen"')
    expect(hoja).toContain('<autoFilter ref="A1:D4"/>')
    expect(archivos.get('xl/workbook.xml')).toContain(`'Datos'!$A$1:$D$4`)
    expect([...archivos.keys()]).toEqual(
      expect.arrayContaining(['[Content_Types].xml', '_rels/.rels', 'xl/workbook.xml', 'xl/_rels/workbook.xml.rels', 'xl/styles.xml']),
    )
  })
})
