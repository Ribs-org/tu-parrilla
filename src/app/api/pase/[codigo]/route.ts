import { NextResponse } from 'next/server'
import { paseParaLaApi } from '@/lib/pase/pase'
import { abrirPase } from '@/lib/pase/http'
import { criticaEnTexto } from '@/lib/pase/reglas'

export const dynamic = 'force-dynamic'

/**
 * El pase entero: cada pieza con sus versiones y su crítica, los tiempos en segundos y en texto, la
 * zona en fracciones del cuadro. Con `?formato=texto`, la misma crítica como lista de tareas en
 * Markdown, para el prompt de una IA que edita. La guía está en `public/docs/pase-api.md`.
 */
export async function GET(request: Request, { params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params
  const entrada = await abrirPase(codigo)
  if (entrada instanceof NextResponse) return entrada
  const pase = await paseParaLaApi(entrada.pase, entrada.rol)
  if (new URL(request.url).searchParams.get('formato') === 'texto') {
    const enlace = entrada.rol === 'editor' ? new URL(`/api/pase/${codigo}`, request.url).toString() : null
    return new NextResponse(criticaEnTexto(pase, enlace), { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } })
  }
  return NextResponse.json(pase)
}
