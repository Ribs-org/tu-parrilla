/**
 * Si un valor tiene forma de uuid. Lo que llega de una URL, de un formulario o del teléfono se
 * mira antes de ir a la base: un id con otra forma no es «no existe», es un error de Postgres
 * que tumba la consulta entera. Sin base, así lo usan también el navegador y las pruebas.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function esUuid(valor: unknown): valor is string {
  return typeof valor === 'string' && UUID.test(valor)
}
