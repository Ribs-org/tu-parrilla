// Cómo viaja un archivo grande a la cocina, sin base y sin almacén: las partes de la subida y el
// nombre en su clave. Lo leen el servidor (`subidas.ts`) y el navegador (`subida-por-partes.ts`).
// Qué se puede guardar en la cámara de frío, sus topes y la cuota están en `bodega.ts`.

/** Qué es el plato principal: un video largo, un podcast en videollamada o tomas sueltas. */
export const SUBTIPOS_PRINCIPAL = ['largo', 'podcast', 'tomas'] as const
export type SubtipoPrincipal = (typeof SUBTIPOS_PRINCIPAL)[number]

/**
 * 64 MB por parte. El almacén pide que todas las partes pesen lo mismo salvo la última, y que
 * pesen al menos 5 MB: con 64, un largo de 20 GB son 320 partes, y una que se corta se repite sin
 * perder mucho.
 */
export const TAMANO_PARTE = 64 * 1024 * 1024
/** Cuántos enlaces de parte se firman por pedido: el navegador pide más a medida que sube. */
export const MAX_PARTES_POR_PEDIDO = 50

/**
 * El nombre de un archivo como va en su clave: sin extensión, sin tildes y sin lo que no sea letra,
 * número o guion. La clave lleva además un uuid, así que dos archivos que se llaman igual no chocan.
 */
export function baseDeNombre(nombre: string): string {
  return (
    nombre
      .replace(/\.[^.]+$/, '')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-zA-Z0-9-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'archivo'
  )
}

/** Cuántas partes tiene un archivo. */
export function cuantasPartes(bytes: number, tamano: number = TAMANO_PARTE): number {
  return Math.ceil(bytes / tamano)
}

/** Lo que tiene que pesar una parte (1..N): todas `tamano`, salvo la última, que lleva el resto. */
export function bytesDeParte(numero: number, bytes: number, tamano: number = TAMANO_PARTE): number {
  return Math.min(tamano, bytes - (numero - 1) * tamano)
}

/** Los bytes de una parte, como los corta `File.slice`: desde incluido, hasta excluido. */
export function rangoDeParte(numero: number, bytes: number, tamano: number = TAMANO_PARTE): { desde: number; hasta: number } {
  const desde = (numero - 1) * tamano
  return { desde, hasta: desde + bytesDeParte(numero, bytes, tamano) }
}

/**
 * Las partes que faltan, en orden. Una que llegó con otro peso cuenta como faltante: se vuelve a
 * subir con el mismo número, que la reemplaza.
 */
export function partesQueFaltan(
  bytes: number,
  tamano: number,
  llegaron: ReadonlyArray<{ numero: number; bytes: number }>,
): number[] {
  const bien = new Set(llegaron.filter((p) => p.bytes === bytesDeParte(p.numero, bytes, tamano)).map((p) => p.numero))
  const faltan: number[] = []
  for (let n = 1; n <= cuantasPartes(bytes, tamano); n++) if (!bien.has(n)) faltan.push(n)
  return faltan
}
