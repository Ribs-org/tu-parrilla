// El `.xlsx` de «Llevar para la casa», escrito a mano sobre `zip.ts`: el mínimo de SpreadsheetML
// que Excel, LibreOffice y Google Sheets abren sin pedir reparar nada. Una hoja es una lista de
// columnas con su formato y filas que llegan por tandas, así que nunca está entera en memoria.
//
// Lo que esto garantiza y los tests revisan (`xlsx.test.ts`):
// - Ningún texto es una fórmula. Las celdas de texto van como `inlineStr`, que Excel nunca
//   evalúa, y además un texto que empieza con `=`, `+`, `-`, `@`, tabulador o retorno de carro
//   lleva un apóstrofo adelante (`textoSeguro`): si alguien copia la celda o guarda la hoja como
//   CSV, sigue siendo texto. Los comentarios, los textos de las publicaciones, los referrers y las
//   UTM los escribe cualquiera.
// - El XML es válido aunque el texto traiga caracteres de control, que XML no admite y que un
//   comentario puede traer: se quitan.
// - Ninguna celda pasa los 32.767 caracteres, el tope de Excel.
//
// Sin fórmulas en ninguna parte: los números van calculados.

import { Zip } from './zip'

/** Cómo se ve una columna en Excel. Los porcentajes van como fracción (0,05 se ve 5,00 %). */
export type Formato = 'texto' | 'entero' | 'decimal' | 'porcentaje' | 'veces' | 'fecha' | 'fechaHora'

export type Columna = {
  titulo: string
  formato: Formato
  /** Lo que la hoja «Léeme» dice de esta columna. */
  descripcion: string
  /** En caracteres; sin él, según el formato. */
  ancho?: number
}

/**
 * Un número (o una fecha ya pasada a número de serie de Excel), un texto, o vacío. Un número con
 * su propio formato es para la columna que mezcla (en «Resumen», un conteo y un porcentaje).
 */
export type Valor = string | number | null | { numero: number; formato: Formato }
export type Fila = readonly Valor[]

/** El tope de caracteres de una celda de Excel. */
export const MAX_CARACTERES = 32_767

/** El tope de filas de una hoja de Excel, encabezado incluido. */
export const MAX_FILAS_EXCEL = 1_048_576

// Lo que XML 1.0 no admite: los controles salvo tabulador, salto y retorno, los dos «no
// caracteres» del final del plano básico y las mitades sueltas de un par sustituto.
const NO_XML = /[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g

/** Lo que hace que Excel, LibreOffice o Sheets lean un texto como fórmula si lo pegan o lo importan. */
const PARECE_FORMULA = /^[=+\-@\t\r]/

/**
 * El texto tal como va a la celda: sin lo que XML no admite, sin pasar el tope de Excel, y con
 * un apóstrofo adelante si empieza como una fórmula.
 */
export function textoSeguro(texto: string): string {
  let limpio = texto.replace(NO_XML, '')
  if (PARECE_FORMULA.test(limpio)) limpio = `'${limpio}`
  if (limpio.length > MAX_CARACTERES) limpio = `${limpio.slice(0, MAX_CARACTERES - 1)}…`
  return limpio
}

export function escaparXml(texto: string): string {
  return texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/** 1 → A, 27 → AA. */
export function letraDeColumna(n: number): string {
  let letras = ''
  let resto = n
  while (resto > 0) {
    const m = (resto - 1) % 26
    letras = String.fromCharCode(65 + m) + letras
    resto = Math.floor((resto - 1) / 26)
  }
  return letras
}

/** Los días entre el 30 de diciembre de 1899 y el 1 de enero de 1970: el cero de Excel. */
const EPOCA_EXCEL = 25_569

/** Un día `YYYY-MM-DD` como número de serie de Excel. Sin zona: el día ya es de alguien. */
export function serialDeDia(dia: string): number {
  const [ano, mes, d] = dia.split('-').map(Number) as [number, number, number]
  return Date.UTC(ano, mes - 1, d) / 864e5 + EPOCA_EXCEL
}

const RELOJES = new Map<string, Intl.DateTimeFormat>()

/**
 * Un instante como número de serie de Excel, con la hora que marcaba el reloj en `zona`. Excel
 * no guarda zonas: la hoja «Léeme» dice cuál es.
 */
export function serialEnZona(fecha: Date, zona: string): number {
  let reloj = RELOJES.get(zona)
  if (!reloj) {
    reloj = new Intl.DateTimeFormat('en-US', {
      timeZone: zona,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hourCycle: 'h23',
    })
    RELOJES.set(zona, reloj)
  }
  const p: Record<string, number> = {}
  for (const parte of reloj.formatToParts(fecha)) if (parte.type !== 'literal') p[parte.type] = Number(parte.value)
  const pared = Date.UTC(p.year!, p.month! - 1, p.day!, p.hour!, p.minute!, p.second!)
  return pared / 864e5 + EPOCA_EXCEL
}

// --- estilos ---------------------------------------------------------------------------------
// Los colores son los del panel (`globals.css`): el acero de la noche para el encabezado y la
// brasa para los títulos. Un índice por estilo, en el orden de `cellXfs`.

export const ESTILO = {
  normal: 0,
  encabezado: 1,
  fecha: 2,
  fechaHora: 3,
  entero: 4,
  decimal: 5,
  porcentaje: 6,
  veces: 7,
  titulo: 8,
  envuelto: 9,
  negrita: 10,
  seccion: 11,
  nota: 12,
  /** La fecha de «Léeme», a la izquierda como el texto que la rodea. */
  fechaHoraSuelta: 13,
} as const

const ESTILO_DE: Record<Formato, number> = {
  texto: ESTILO.normal,
  entero: ESTILO.entero,
  decimal: ESTILO.decimal,
  porcentaje: ESTILO.porcentaje,
  veces: ESTILO.veces,
  fecha: ESTILO.fecha,
  fechaHora: ESTILO.fechaHora,
}

const ANCHO_DE: Record<Formato, number> = {
  texto: 24,
  entero: 12,
  decimal: 12,
  porcentaje: 11,
  veces: 10,
  fecha: 12,
  fechaHora: 17,
}

const XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
const NS_MAIN = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'
const NS_REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
const NS_PKG = 'http://schemas.openxmlformats.org/package/2006/relationships'

const ESTILOS = `${XML}<styleSheet xmlns="${NS_MAIN}">
<numFmts count="3"><numFmt numFmtId="164" formatCode="yyyy-mm-dd"/><numFmt numFmtId="165" formatCode="yyyy-mm-dd hh:mm"/><numFmt numFmtId="166" formatCode="0.00&quot;×&quot;"/></numFmts>
<fonts count="6">
<font><sz val="11"/><name val="Calibri"/><family val="2"/></font>
<font><b/><sz val="11"/><color rgb="FFF2EBE2"/><name val="Calibri"/><family val="2"/></font>
<font><b/><sz val="18"/><color rgb="FFE8621F"/><name val="Calibri"/><family val="2"/></font>
<font><b/><sz val="11"/><name val="Calibri"/><family val="2"/></font>
<font><b/><sz val="13"/><color rgb="FFB83D0B"/><name val="Calibri"/><family val="2"/></font>
<font><i/><sz val="11"/><color rgb="FF5C564E"/><name val="Calibri"/><family val="2"/></font>
</fonts>
<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF1D2124"/><bgColor indexed="64"/></patternFill></fill></fills>
<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left/><right/><top/><bottom style="medium"><color rgb="FFE8621F"/></bottom><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="14">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
<xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
<xf numFmtId="3" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
<xf numFmtId="4" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
<xf numFmtId="10" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
<xf numFmtId="166" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
<xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment vertical="top"/></xf>
<xf numFmtId="0" fontId="4" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="0" fontId="5" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment horizontal="left" vertical="top"/></xf>
</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`

function celdaTexto(ref: string, texto: string, estilo = 0): string {
  const s = estilo ? ` s="${estilo}"` : ''
  return `<c r="${ref}"${s} t="inlineStr"><is><t xml:space="preserve">${escaparXml(textoSeguro(texto))}</t></is></c>`
}

function celdaNumero(ref: string, numero: number, estilo: number): string {
  const s = estilo ? ` s="${estilo}"` : ''
  return `<c r="${ref}"${s}><v>${numero}</v></c>`
}

/**
 * Una celda. Un número en una columna de texto va como número igual —un id numérico de una red
 * se lee mejor así—, y un texto en una columna de números va como texto: nunca se convierte.
 */
function celda(ref: string, valor: Valor, formato: Formato): string {
  if (valor === null) return ''
  if (typeof valor === 'number') return Number.isFinite(valor) ? celdaNumero(ref, valor, ESTILO_DE[formato]) : ''
  if (typeof valor === 'object') return Number.isFinite(valor.numero) ? celdaNumero(ref, valor.numero, ESTILO_DE[valor.formato]) : ''
  return celdaTexto(ref, valor)
}

/** Una celda de la hoja «Léeme», con su estilo. */
export type CeldaLibre = { valor: Valor; estilo?: number }

type Registro = { nombre: string; rango: string | null }

/**
 * El libro. Se escribe en orden: `inicio`, las hojas en cualquier orden con su número de
 * posición, y `cierre`. El orden de las pestañas es el de los nombres de `inicio`, no el orden en
 * que se escriben: la hoja «Léeme» va primera aunque se escriba al final, cuando ya se sabe qué
 * quedó fuera.
 */
export class Libro {
  private readonly zip: Zip
  private readonly hojas: Registro[]
  private readonly escritas = new Set<number>()

  constructor(
    nombres: readonly string[],
    private readonly ahora: Date = new Date(),
  ) {
    for (const nombre of nombres) {
      if (nombre.length === 0 || nombre.length > 31 || /[:\\/?*[\]]/.test(nombre)) {
        throw new Error(`Nombre de hoja inválido: ${nombre}`)
      }
    }
    this.zip = new Zip(ahora)
    this.hojas = nombres.map((nombre) => ({ nombre, rango: null }))
  }

  /** Lo que va antes de las hojas: los tipos, las relaciones, las propiedades y los estilos. */
  async inicio(titulo: string): Promise<Buffer[]> {
    const tipos = `${XML}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
${this.hojas.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('\n')}
</Types>`
    const relaciones = `${XML}<Relationships xmlns="${NS_PKG}">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
</Relationships>`
    const iso = `${this.ahora.toISOString().slice(0, 19)}Z`
    const propiedades = `${XML}<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
<dc:title>${escaparXml(textoSeguro(titulo))}</dc:title><dc:creator>Tu Parrilla</dc:creator>
<dcterms:created xsi:type="dcterms:W3CDTF">${iso}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${iso}</dcterms:modified>
</cp:coreProperties>`

    return [
      ...(await this.zip.archivo('[Content_Types].xml', [tipos])),
      ...(await this.zip.archivo('_rels/.rels', [relaciones])),
      ...(await this.zip.archivo('docProps/core.xml', [propiedades])),
      ...(await this.zip.archivo('xl/styles.xml', [ESTILOS])),
    ]
  }

  /**
   * Una hoja de tabla: el encabezado en la primera fila, fijo al bajar y con filtros, y las filas
   * que vayan llegando por tandas. Devuelve sus bytes y cuántas filas de datos llevó.
   */
  async tabla(
    posicion: number,
    columnas: readonly Columna[],
    tandas: AsyncIterable<readonly Fila[]>,
  ): Promise<{ bytes: Buffer[]; filas: number }> {
    const registro = this.registro(posicion)
    const ultima = letraDeColumna(columnas.length)
    let filas = 0
    const elegida = posicion === 0

    async function* xml(): AsyncGenerator<string> {
      yield `${XML}<worksheet xmlns="${NS_MAIN}" xmlns:r="${NS_REL}">`
      yield `<sheetViews><sheetView workbookViewId="0"${elegida ? ' tabSelected="1"' : ''}><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A2" sqref="A2"/></sheetView></sheetViews>`
      yield '<sheetFormatPr defaultRowHeight="15"/><cols>'
      yield columnas
        .map((c, i) => `<col min="${i + 1}" max="${i + 1}" width="${c.ancho ?? ANCHO_DE[c.formato]}" customWidth="1"/>`)
        .join('')
      yield '</cols><sheetData><row r="1" ht="32" customHeight="1">'
      yield columnas.map((c, i) => celdaTexto(`${letraDeColumna(i + 1)}1`, c.titulo, ESTILO.encabezado)).join('')
      yield '</row>'
      for await (const tanda of tandas) {
        const partes: string[] = []
        for (const fila of tanda) {
          if (filas + 1 >= MAX_FILAS_EXCEL) break
          filas++
          const r = filas + 1
          partes.push(`<row r="${r}">`)
          for (let i = 0; i < columnas.length; i++) {
            partes.push(celda(`${letraDeColumna(i + 1)}${r}`, fila[i] ?? null, columnas[i]!.formato))
          }
          partes.push('</row>')
        }
        yield partes.join('')
      }
      yield `</sheetData><autoFilter ref="A1:${ultima}${filas + 1}"/></worksheet>`
    }

    const bytes = await this.zip.archivo(`xl/worksheets/sheet${posicion + 1}.xml`, xml())
    registro.rango = `$A$1:$${ultima}$${filas + 1}`
    return { bytes, filas }
  }

  /** Una hoja libre, como «Léeme»: cada fila con sus celdas y sus estilos, y el ancho de cada columna. */
  async libre(posicion: number, anchos: readonly number[], filas: ReadonlyArray<readonly CeldaLibre[]>): Promise<Buffer[]> {
    this.registro(posicion)
    const elegida = posicion === 0
    const partes: string[] = [
      `${XML}<worksheet xmlns="${NS_MAIN}" xmlns:r="${NS_REL}">`,
      `<sheetViews><sheetView workbookViewId="0" showGridLines="0"${elegida ? ' tabSelected="1"' : ''}/></sheetViews>`,
      '<sheetFormatPr defaultRowHeight="15"/><cols>',
      anchos.map((ancho, i) => `<col min="${i + 1}" max="${i + 1}" width="${ancho}" customWidth="1"/>`).join(''),
      '</cols><sheetData>',
    ]
    filas.forEach((fila, f) => {
      const r = f + 1
      partes.push(`<row r="${r}">`)
      fila.forEach((c, i) => {
        const ref = `${letraDeColumna(i + 1)}${r}`
        if (c.valor === null) return
        if (typeof c.valor === 'string') partes.push(celdaTexto(ref, c.valor, c.estilo ?? ESTILO.normal))
        else if (typeof c.valor === 'number') partes.push(celdaNumero(ref, c.valor, c.estilo ?? ESTILO.normal))
        else partes.push(celdaNumero(ref, c.valor.numero, ESTILO_DE[c.valor.formato]))
      })
      partes.push('</row>')
    })
    partes.push('</sheetData></worksheet>')
    return this.zip.archivo(`xl/worksheets/sheet${posicion + 1}.xml`, partes)
  }

  /** El libro, sus relaciones y el índice del zip. Después de esto no se escribe nada más. */
  async cierre(): Promise<Buffer[]> {
    const faltan = this.hojas.filter((h, i) => !this.escritas.has(i)).map((h) => h.nombre)
    if (faltan.length > 0) throw new Error(`Faltan hojas: ${faltan.join(', ')}`)

    const comillas = (nombre: string) => `'${nombre.replace(/'/g, "''")}'`
    const filtros = this.hojas
      .map((h, i) =>
        h.rango
          ? `<definedName name="_xlnm._FilterDatabase" localSheetId="${i}" hidden="1">${escaparXml(`${comillas(h.nombre)}!${h.rango}`)}</definedName>`
          : '',
      )
      .join('')
    const libro = `${XML}<workbook xmlns="${NS_MAIN}" xmlns:r="${NS_REL}">
<bookViews><workbookView activeTab="0"/></bookViews>
<sheets>${this.hojas.map((h, i) => `<sheet name="${escaparXml(h.nombre)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets>
${filtros ? `<definedNames>${filtros}</definedNames>` : ''}
</workbook>`
    const relaciones = `${XML}<Relationships xmlns="${NS_PKG}">
${this.hojas.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('\n')}
<Relationship Id="rId${this.hojas.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`
    return [
      ...(await this.zip.archivo('xl/workbook.xml', [libro])),
      ...(await this.zip.archivo('xl/_rels/workbook.xml.rels', [relaciones])),
      ...this.zip.cierre(),
    ]
  }

  private registro(posicion: number): Registro {
    const registro = this.hojas[posicion]
    if (!registro) throw new Error(`No hay hoja en la posición ${posicion}`)
    if (this.escritas.has(posicion)) throw new Error(`La hoja ${registro.nombre} ya se escribió`)
    this.escritas.add(posicion)
    return registro
  }
}
