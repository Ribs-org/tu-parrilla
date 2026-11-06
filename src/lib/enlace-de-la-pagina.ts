import 'server-only'
import { headers } from 'next/headers'
import { dominioProducto, esDominioDelProducto } from './dominios'
import { getAllProfiles } from './profiles'
import { adminId } from './usuarios'
import { urlPublicaDe } from './utils'

/**
 * La dirección pública de la página principal del dueño, ya resuelta contra el host: es a la que
 * tiene que llevar el link con `?s=` de cada publicación (ver `urlPublicaDe`). La usan el link que
 * se copia en «Tus publicaciones» y la promoción que pide visitas.
 */
export async function enlaceDeLaPaginaPrincipal(ownerId: string): Promise<string> {
  const cabeceras = await headers()
  const host = cabeceras.get('host') ?? 'localhost:3000'
  const protocolo = cabeceras.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')
  const perfiles = await getAllProfiles(ownerId)
  const principal = perfiles.find((p) => p.isDefault) ?? perfiles[0]
  if (!principal) return `${protocolo}://${host}/`
  const admin = await adminId()
  return urlPublicaDe(
    principal,
    admin,
    { enElProducto: esDominioDelProducto(host), dominioProducto: dominioProducto() },
    `${protocolo}://${host}`,
  )
}

/** Si el dueño tiene una página a la que mandar visitas. */
export async function tienePagina(ownerId: string): Promise<boolean> {
  return (await getAllProfiles(ownerId)).length > 0
}
