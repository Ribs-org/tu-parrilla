import { describe, expect, it } from 'vitest'
import nextConfig from '../../next.config'

// Las cabeceras de seguridad viven en `next.config.ts`, fuera de `src/`: esto es lo que avisa
// si una se cae al tocar ese archivo por otra cosa.
describe('las cabeceras de seguridad', () => {
  it('van en todas las rutas: el tipo, los marcos, el referer y los permisos', async () => {
    const reglas = await nextConfig.headers!()
    const todas = reglas.find((regla) => regla.source === '/:path*')
    const cabeceras = Object.fromEntries((todas?.headers ?? []).map((h) => [h.key, h.value]))
    expect(cabeceras).toMatchObject({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    })
    expect(cabeceras['Permissions-Policy']).toContain('camera=()')
  })

  it('sin X-Powered-By, que solo dice con qué está hecho el sitio', () => {
    expect(nextConfig.poweredByHeader).toBe(false)
  })
})
