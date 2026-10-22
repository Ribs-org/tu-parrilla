import { responderArchivo } from '@/lib/archivar-api'

export const dynamic = 'force-dynamic'

/**
 * Lo contrario de `…/archivar`: lo archivado vuelve a «Se quemó» y a contar en el resumen. Con
 * `{ "cuentaId": "…" }`, solo ese destino; sin cuerpo, todos los archivados del post.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return responderArchivo(request, params, false)
}
