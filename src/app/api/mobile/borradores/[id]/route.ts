import { NextResponse } from 'next/server'
import { idDeBorrador } from '@/lib/borrador'
import { borrarBorrador, cargarBorrador } from '@/lib/borradores'
import { abrirEnElTelefono, cuentasParaElTelefono } from '@/lib/borradores-movil'
import { BORRADOR_NO_EXISTE } from '@/lib/mobile-api'
import { requireMobileUser } from '@/lib/mobile-guardia'

export const dynamic = 'force-dynamic'

/**
 * Un borrador para abrirlo en Publicar, con lo que el teléfono sabe mostrar. 404 si no
 * existe o es de otro —sin distinguir, como el resto de la API—, o si se programó o se
 * descartó desde que La Parrilla lo listó.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const usuario = await requireMobileUser(request)
  if (!usuario) return new NextResponse('No autorizado', { status: 401 })

  const id = idDeBorrador((await params).id)
  const borrador = id ? await cargarBorrador(usuario.id, id) : null
  if (!borrador) return NextResponse.json({ error: BORRADOR_NO_EXISTE }, { status: 404 })

  const { ajenas } = await cuentasParaElTelefono(usuario.id)
  return NextResponse.json(abrirEnElTelefono(borrador, usuario.zona, ajenas))
}

/**
 * «Descartar» en Publicar. Siempre responde que salió: uno que ya no estaba es lo mismo
 * que uno recién borrado. Sus archivos los borra el barrido de huérfanos.
 */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const usuario = await requireMobileUser(request)
  if (!usuario) return new NextResponse('No autorizado', { status: 401 })

  const id = idDeBorrador((await params).id)
  if (id) await borrarBorrador(usuario.id, id)
  return NextResponse.json({ ok: true })
}
