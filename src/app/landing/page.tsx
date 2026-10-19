import type { Metadata, Viewport } from 'next'
import { headers } from 'next/headers'
import { Landing, metadataLanding } from '@/components/landing'
import { COLOR_DE_BARRA, temaDelEnlace } from '@/lib/tema'
import { temaDeLaPortada } from '@/lib/tema-servidor'

type Busqueda = Promise<{ modo?: string | string[] }>

/**
 * La landing, siempre alcanzable por su ruta.
 *
 * La raíz solo la muestra en el dominio del producto, y los previews corren en
 * `*.vercel.app`, donde ese chequeo nunca da verdadero. Sin esta ruta no habría forma de
 * revisar la landing antes de mergear, que es justo cuando conviene mirarla.
 */
export async function generateMetadata({ searchParams }: { searchParams: Busqueda }): Promise<Metadata> {
  return {
    ...metadataLanding((await headers()).get('host'), temaDelEnlace((await searchParams).modo) ?? 'noche'),
    // El mismo contenido vive en la raíz del dominio del producto. Sin esto un buscador
    // indexaría las dos direcciones y repartiría las señales entre ellas. Esta existe para
    // poder mirarla en un preview, no para que la encuentre nadie.
    robots: { index: false, follow: true },
  }
}

export async function generateViewport({ searchParams }: { searchParams: Busqueda }): Promise<Viewport> {
  const { tema } = await temaDeLaPortada((await searchParams).modo)
  return { themeColor: COLOR_DE_BARRA[tema] }
}

export default async function LandingPage({ searchParams }: { searchParams: Busqueda }) {
  const { tema, delEnlace } = await temaDeLaPortada((await searchParams).modo)
  return <Landing tema={tema} delEnlace={delEnlace} />
}
