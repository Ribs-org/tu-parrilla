import type { Metadata, Viewport } from 'next'
import { headers } from 'next/headers'
import { Landing, metadataLanding } from '@/components/landing'
import { esDominioDelProducto } from '@/lib/dominios'
import { COLOR_DE_BARRA, temaDelEnlace } from '@/lib/tema'
import { temaDeLaPortada } from '@/lib/tema-servidor'
import { getDefaultProfile } from '@/lib/profiles'
import { FirstRun, profileMetadata, renderProfile, type SearchParams } from '@/lib/serve-profile'
import { adminId } from '@/lib/usuarios'

export const dynamic = 'force-dynamic'

/**
 * Varios dominios apuntan a este mismo despliegue, y hasta la landing los dos que sirven
 * esta app mostraban el perfil del dueño. El del producto muestra la landing; el resto
 * sigue igual, y esa es la parte que importa: `esDominioDelProducto` devuelve `false` sin
 * `DOMINIO_PRODUCTO`, así que el camino de abajo no cambia ni aunque esta rama esté rota.
 */
async function enElProducto(): Promise<boolean> {
  return esDominioDelProducto((await headers()).get('host'))
}

async function load() {
  try {
    // La raíz sirve el perfil del dueño del despliegue; la página por usuario es el subproyecto 3.
    const id = await adminId()
    return { profile: await getDefaultProfile(id), failed: false }
  } catch {
    return { profile: null, failed: true }
  }
}

export async function generateMetadata({ searchParams }: { searchParams: Promise<SearchParams> }): Promise<Metadata> {
  const host = (await headers()).get('host')
  // La imagen para compartir sale de la dirección y no del equipo: quien lee la tarjeta es un
  // servidor ajeno, sin la cookie de nadie.
  if (esDominioDelProducto(host)) return metadataLanding(host, temaDelEnlace((await searchParams).modo) ?? 'noche')

  const { profile } = await load()
  return profile ? profileMetadata(profile) : { title: 'Portafolio' }
}

/** La barra del navegador del teléfono, del fondo de la portada en su modo. La página de un creador se queda con la del layout. */
export async function generateViewport({ searchParams }: { searchParams: Promise<SearchParams> }): Promise<Viewport> {
  if (!(await enElProducto())) return {}
  const { tema } = await temaDeLaPortada((await searchParams).modo)
  return { themeColor: COLOR_DE_BARRA[tema] }
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  if (await enElProducto()) {
    const { tema, delEnlace } = await temaDeLaPortada((await searchParams).modo)
    return <Landing tema={tema} delEnlace={delEnlace} />
  }

  const { profile, failed } = await load()
  if (!profile) return <FirstRun reason={failed ? 'error' : 'empty'} />
  return renderProfile(profile, await searchParams)
}
