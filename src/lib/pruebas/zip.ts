// Para las pruebas: abre un zip y devuelve cada archivo como texto, para mirar el XML de una
// planilla tal como quedó. Lee el índice central del final, que es lo que hace cualquier lector de
// zip, y no los encabezados de cada archivo: así no depende de cómo los escribió `zip.ts`.

import { inflateRawSync } from 'node:zlib'

export function archivosDelZip(zip: Buffer): Map<string, string> {
  const fin = zip.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]))
  if (fin < 0) throw new Error('No es un zip: falta el registro de cierre')
  const cuantos = zip.readUInt16LE(fin + 10)
  let p = zip.readUInt32LE(fin + 16)
  const archivos = new Map<string, string>()
  for (let i = 0; i < cuantos; i++) {
    if (zip.readUInt32LE(p) !== 0x02014b50) throw new Error(`Índice central roto en la entrada ${i}`)
    const metodo = zip.readUInt16LE(p + 10)
    const comprimido = zip.readUInt32LE(p + 20)
    const largoNombre = zip.readUInt16LE(p + 28)
    const largoExtra = zip.readUInt16LE(p + 30)
    const largoComentario = zip.readUInt16LE(p + 32)
    const local = zip.readUInt32LE(p + 42)
    const nombre = zip.subarray(p + 46, p + 46 + largoNombre).toString('utf8')
    if (zip.readUInt32LE(local) !== 0x04034b50) throw new Error(`Encabezado local roto: ${nombre}`)
    const inicio = local + 30 + zip.readUInt16LE(local + 26) + zip.readUInt16LE(local + 28)
    const datos = zip.subarray(inicio, inicio + comprimido)
    archivos.set(nombre, (metodo === 8 ? inflateRawSync(datos) : datos).toString('utf8'))
    p += 46 + largoNombre + largoExtra + largoComentario
  }
  return archivos
}
