import { NextResponse, type NextRequest } from 'next/server'
import { panelEnElProducto } from '@/lib/dominios'

/**
 * El panel solo se usa en el dominio del producto: abrirlo en otro lo manda ahí, con la
 * misma ruta (el porqué, en `panelEnElProducto`).
 *
 * Solo `GET` y `HEAD`: lo demás son acciones de servidor de una página que ya estaba
 * abierta, y redirigir un `POST` a otro dominio no lo convierte en una acción que funcione
 * ahí —la sesión es de cada dominio—. La siguiente navegación ya cae en la redirección.
 *
 * La API (`/api/*`) queda fuera a propósito: la app del teléfono sin actualizar todavía la
 * llama en el dominio viejo.
 */
export function proxy(request: NextRequest) {
  if (request.method !== 'GET' && request.method !== 'HEAD') return NextResponse.next()

  const { pathname, search } = request.nextUrl
  const destino = panelEnElProducto(request.headers.get('host'), `${pathname}${search}`)
  // 307 y no 308: una redirección permanente queda guardada en el navegador, y si algún
  // día el panel vuelve a responder en otro dominio, esos navegadores no se enterarían.
  return destino ? NextResponse.redirect(destino, 307) : NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/ingresar/:path*'],
}
