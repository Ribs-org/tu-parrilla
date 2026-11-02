// El zip de la planilla: un `.xlsx` es un zip con XML adentro. Escrito a mano y no con una
// biblioteca porque las que hay para Excel en npm arrastran dependencias con avisos de seguridad
// abiertos (`exceljs` 4.4, la última, trae nueve por `archiver` y `uuid`) o están abandonadas
// (`xlsx`), y lo que hace falta acá es poco: guardar archivos comprimidos con deflate, que Node
// trae (`node:zlib`, con su `crc32` desde Node 22). Ver `docs/deuda-tecnica.md` si algún día
// hace falta algo que el formato a mano no cubra.
//
// Cada archivo se comprime entero antes de escribir su encabezado: así el encabezado lleva el
// CRC y los tamaños de verdad y no hacen falta los «data descriptors», que algunos lectores
// toleran peor. Lo que se tiene en memoria a la vez es un archivo comprimido —una hoja—, no la
// planilla entera. Sin ZIP64: la planilla tiene topes de filas muy por debajo de los 4 GB.

import { once } from 'node:events'
import { createDeflateRaw, crc32 } from 'node:zlib'

type Entrada = { nombre: Buffer; crc: number; comprimido: number; original: number; desplazamiento: number }

const FIRMA_LOCAL = 0x04034b50
const FIRMA_CENTRAL = 0x02014b50
const FIRMA_FIN = 0x06054b50
/** Deflate. */
const METODO = 8
/** 2.0: deflate, sin ZIP64. */
const VERSION = 20
/** Bit 11: el nombre va en UTF-8. */
const BANDERAS = 0x0800

/** La fecha y la hora en el formato de MS-DOS, que es el que lleva cada entrada del zip. */
export function fechaDos(fecha: Date): { hora: number; dia: number } {
  const ano = Math.max(fecha.getUTCFullYear(), 1980)
  return {
    hora: (fecha.getUTCHours() << 11) | (fecha.getUTCMinutes() << 5) | Math.floor(fecha.getUTCSeconds() / 2),
    dia: ((ano - 1980) << 9) | ((fecha.getUTCMonth() + 1) << 5) | fecha.getUTCDate(),
  }
}

/**
 * Un zip que se escribe de a un archivo: `archivo()` comprime uno y devuelve sus bytes —el
 * encabezado y el contenido—, y `cierre()` devuelve el índice del final. Quien lo usa manda los
 * bytes en ese orden, tal como salen.
 */
export class Zip {
  private entradas: Entrada[] = []
  private escritos = 0
  private readonly fecha: { hora: number; dia: number }

  constructor(ahora: Date = new Date()) {
    this.fecha = fechaDos(ahora)
  }

  /** Comprime un archivo que llega por partes (texto en UTF-8 o bytes) y devuelve sus bytes. */
  async archivo(nombre: string, partes: AsyncIterable<string | Uint8Array> | Iterable<string | Uint8Array>): Promise<Buffer[]> {
    const deflate = createDeflateRaw({ level: 6 })
    const salida: Buffer[] = []
    deflate.on('data', (trozo: Buffer) => salida.push(trozo))
    const fin = once(deflate, 'end')

    let crc = 0
    let original = 0
    for await (const parte of partes) {
      const bytes = typeof parte === 'string' ? Buffer.from(parte, 'utf8') : parte
      if (bytes.length === 0) continue
      crc = crc32(bytes, crc)
      original += bytes.length
      if (!deflate.write(bytes)) await once(deflate, 'drain')
    }
    deflate.end()
    await fin

    const comprimido = salida.reduce((total, trozo) => total + trozo.length, 0)
    const nombreBytes = Buffer.from(nombre, 'utf8')
    const encabezado = Buffer.alloc(30)
    encabezado.writeUInt32LE(FIRMA_LOCAL, 0)
    encabezado.writeUInt16LE(VERSION, 4)
    encabezado.writeUInt16LE(BANDERAS, 6)
    encabezado.writeUInt16LE(METODO, 8)
    encabezado.writeUInt16LE(this.fecha.hora, 10)
    encabezado.writeUInt16LE(this.fecha.dia, 12)
    encabezado.writeUInt32LE(crc >>> 0, 14)
    encabezado.writeUInt32LE(comprimido, 18)
    encabezado.writeUInt32LE(original, 22)
    encabezado.writeUInt16LE(nombreBytes.length, 26)
    encabezado.writeUInt16LE(0, 28)

    this.entradas.push({ nombre: nombreBytes, crc: crc >>> 0, comprimido, original, desplazamiento: this.escritos })
    this.escritos += encabezado.length + nombreBytes.length + comprimido
    return [encabezado, nombreBytes, ...salida]
  }

  /** El índice central y el registro de cierre: lo último del zip. */
  cierre(): Buffer[] {
    const partes: Buffer[] = []
    let tamano = 0
    for (const e of this.entradas) {
      const central = Buffer.alloc(46)
      central.writeUInt32LE(FIRMA_CENTRAL, 0)
      central.writeUInt16LE(VERSION, 4)
      central.writeUInt16LE(VERSION, 6)
      central.writeUInt16LE(BANDERAS, 8)
      central.writeUInt16LE(METODO, 10)
      central.writeUInt16LE(this.fecha.hora, 12)
      central.writeUInt16LE(this.fecha.dia, 14)
      central.writeUInt32LE(e.crc, 16)
      central.writeUInt32LE(e.comprimido, 20)
      central.writeUInt32LE(e.original, 24)
      central.writeUInt16LE(e.nombre.length, 28)
      // Comentario, disco, atributos internos y externos: nada.
      central.writeUInt32LE(e.desplazamiento, 42)
      partes.push(central, e.nombre)
      tamano += central.length + e.nombre.length
    }
    const fin = Buffer.alloc(22)
    fin.writeUInt32LE(FIRMA_FIN, 0)
    fin.writeUInt16LE(this.entradas.length, 8)
    fin.writeUInt16LE(this.entradas.length, 10)
    fin.writeUInt32LE(tamano, 12)
    fin.writeUInt32LE(this.escritos, 16)
    partes.push(fin)
    return partes
  }
}
