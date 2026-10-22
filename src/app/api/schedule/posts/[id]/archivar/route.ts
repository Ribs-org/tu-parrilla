import { responderArchivo } from '@/lib/archivar-api'

export const dynamic = 'force-dynamic'

/**
 * Archiva lo quemado de un post sin borrarlo: deja de salir en «Se quemó», en el resumen y en
 * el correo del día, y conserva su error y sus intentos. Con `{ "cuentaId": "…" }`, solo ese
 * destino; sin cuerpo, todos los quemados del post. La regla vive en `archivarQuemados`.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return responderArchivo(request, params, true)
}
