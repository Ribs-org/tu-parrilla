/**
 * Copia `texto` al portapapeles y dice si de verdad se copió. Sin contexto seguro (http que
 * no es localhost) `navigator.clipboard` no existe, y leer `.writeText` de algo que no existe
 * lanza en el acto, antes de cualquier `.catch`; con un permiso negado, la escritura rechaza.
 * En los dos casos devuelve `false`: un «Copiado» que miente es peor que ninguno.
 *
 * Antes cada pantalla tenía su copia de esta guarda, y una —el editor de páginas— no la
 * tenía: decía «Copiado» siempre.
 */
export async function copiarAlPortapapeles(texto: string): Promise<boolean> {
  const portapapeles = typeof navigator === 'undefined' ? undefined : navigator.clipboard
  if (!portapapeles) return false
  try {
    await portapapeles.writeText(texto)
    return true
  } catch {
    return false
  }
}
