import type { NextConfig } from 'next'

/**
 * `next.config.ts` no forma parte del grafo de módulos de la app —importar `env()`
 * de `src/lib/env.ts` aquí no vale la pena—, así que este es el único lugar del
 * código donde leer `process.env` directamente es correcto. Next.js evalúa este
 * archivo en build time y Vercel expone las variables de entorno en ese momento.
 */
function hostR2(): string | null {
  const base = process.env.R2_PUBLIC_BASE?.trim()
  if (!base) return null
  try {
    const { protocol, hostname } = new URL(base)
    if (protocol !== 'https:') return null
    return hostname
  } catch {
    // R2_PUBLIC_BASE mal formado: se omite el patrón en vez de romper el build.
    return null
  }
}

const hostnameR2 = hostR2()

/**
 * Las cabeceras de seguridad de todo lo que sirve la app. Ninguna cambia lo que se ve: le
 * dicen al navegador lo que esta app no hace, para que nadie más pueda hacerlo en su nombre.
 * La política de contenido (CSP), que es la que más protege, queda pendiente: pide revisar
 * cada script y estilo en línea de Next (ver `docs/deuda-tecnica.md`).
 */
const CABECERAS = [
  // Que el navegador no adivine el tipo de un archivo: lo que dice ser una imagen no se ejecuta.
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Ninguna página se dibuja dentro de un marco de otro sitio: el panel tiene botones que
  // publican y borran, y un marco invisible encima es la forma de hacerlos apretar.
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  // A los sitios que se abren desde acá les llega el origen, no la dirección entera.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Ni cámara, ni micrófono, ni ubicación: la app no los usa, y así no se los puede pedir nadie.
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: '/:path*', headers: CABECERAS }]
  },

  // `postgres` abre sockets con `node:net`/`node:tls`. No está en la lista que Next
  // excluye sola (ahí figura `pg`, que es otro paquete), así que se declara acá para que
  // el compilador de Server Components no lo empaquete y lo cargue con `require` nativo.
  serverExternalPackages: ['postgres'],

  /**
   * El manual del parrillero (`/admin/ia/manual`) lee la wiki de la UI del disco, y lo de
   * `public/` lo sirve la CDN: sin esto, la función se despliega sin los archivos y el manual
   * no encuentra ninguna página.
   */
  outputFileTracingIncludes: {
    // La clave es un glob de picomatch: los corchetes y los puntos de `[[...pagina]]` van escapados.
    '/admin/ia/manual/\\[\\[\\.\\.\\.pagina\\]\\]': ['./public/docs/ui/*.md'],
  },

  /**
   * Los archivos del panel ya no cruzan las acciones de servidor: el compositor, el editor y
   * las imágenes del perfil suben directo a R2 con una URL firmada (`lib/subida-directa.ts`).
   * Lo único que todavía viaja dentro de un formulario es el CSV de la carga masiva, y 4 MB es
   * casi lo más que Vercel deja pasar (corta los cuerpos en ~4,5 MB antes de que Next mire): un
   * tope mayor no serviría de nada, y el de fábrica (1 MB) rechazaría un CSV largo.
   */
  experimental: {
    serverActions: { bodySizeLimit: '4mb' },
  },
  images: {
    remotePatterns: [
      // El host sale de R2_PUBLIC_BASE en vez de ir literal: así ambos no pueden
      // desincronizarse. Si falta o está mal formada, se omite el patrón —el avatar
      // del perfil público (src/components/profile-view.tsx) deja de renderizar,
      // pero el build no se rompe.
      ...(hostnameR2 ? [{ protocol: 'https' as const, hostname: hostnameR2 }] : []),
      // Post thumbnails from the connected networks. Rendered with `unoptimized`:
      // these URLs expire in hours, so caching an optimized copy just goes stale.
      { protocol: 'https', hostname: '**.cdninstagram.com' },
      { protocol: 'https', hostname: '**.fbcdn.net' },
      { protocol: 'https', hostname: '**.tiktokcdn.com' },
      { protocol: 'https', hostname: 'i.ytimg.com' },
    ],
  },
}

export default nextConfig
