import { ImageResponse } from 'next/og'
import { SILUETA } from '@/components/corte'
import { SEMANA } from '@/components/landing-semana'
import { CARNE, calorDelDia, carneDe, formatoDe, type Carne, type Formato } from '@/lib/parrilla'

export const dynamic = 'force-static'

/**
 * La imagen con la que se ve la landing al compartirla.
 *
 * Las páginas de los creadores ya armaban tarjeta completa —`profileMetadata` les pone
 * `openGraph` y `twitter` con su avatar—, pero la puerta de entrada del producto salía
 * como un enlace pelado. Estaba al revés.
 *
 * Vive en una ruta propia y no en el archivo `opengraph-image.tsx` porque la raíz sirve dos
 * cosas según el dominio: la landing en el del producto y el perfil del dueño en el suyo.
 * El archivo se aplicaría a las dos y le pisaría la imagen al perfil.
 *
 * Se dibuja con estilos en línea: el motor de `next/og` no entiende clases de Tailwind ni
 * las variables CSS del proyecto, así que los colores van literales. Son los mismos de
 * `globals.css`: acero y brasa. La semana es la del inicio de la portada (`landing-semana.ts`),
 * con la silueta y la carne de cada corte (`SILUETA`, `CARNE`): sin las marcas ni la textura,
 * que a este tamaño no se leen.
 */
const ACERO_950 = '#16181a'
const ACERO_900 = '#1d2124'
const ACERO_700 = '#2a2e33'
const FG = '#f2ebe2'

/** Los fierros de cada parrilla: negros sobre el fuego, ceniza en la fría (`.grilla-*`). */
const FIERROS = 'repeating-linear-gradient(to bottom, rgba(0,0,0,0.44) 0px, rgba(0,0,0,0.44) 3px, transparent 3px, transparent 13px)'
const CENIZA = 'repeating-linear-gradient(to bottom, rgba(150,160,170,0.13) 0px, rgba(150,160,170,0.13) 3px, transparent 3px, transparent 13px)'

const FONDO = {
  apagada: `${CENIZA}, linear-gradient(to bottom, ${ACERO_900}, ${ACERO_950} 60%, ${ACERO_900})`,
  prendida: `${FIERROS}, linear-gradient(to bottom, rgba(196,52,26,0.04), rgba(232,98,31,0.13) 62%, rgba(255,138,61,0.22))`,
  llena: `${FIERROS}, linear-gradient(to bottom, rgba(196,52,26,0.1), rgba(232,98,31,0.28) 58%, rgba(255,138,61,0.46))`,
} as const

/** Un corte en chico: su silueta con el degradado de su carne y el borde oscuro del panel. */
function CorteOg({ formato, carne }: { formato: Formato; carne: Carne }) {
  const c = CARNE[carne]
  return (
    <svg width="112" height="60" viewBox="0 0 120 64">
      <defs>
        <linearGradient id="carne" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={c.claro} />
          <stop offset="0.5" stopColor={c.medio} />
          <stop offset="1" stopColor={c.hondo} />
        </linearGradient>
      </defs>
      <path d={SILUETA[formato]} fill="url(#carne)" stroke="rgba(0,0,0,0.45)" strokeWidth="1" />
    </svg>
  )
}

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: ACERO_950,
          padding: 64,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 24, letterSpacing: 8, color: '#6b7076' }}>TU PARRILLA</div>
          <div style={{ marginTop: 22, fontSize: 68, fontWeight: 700, color: FG, lineHeight: 1.08 }}>
            Programa la semana.
          </div>
          <div style={{ fontSize: 68, fontWeight: 700, color: FG, lineHeight: 1.08 }}>
            Mira qué trajo cada corte.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          {SEMANA.map((dia) => {
            const calor = calorDelDia(dia.cortes.length)
            return (
              <div
                key={dia.dia}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                  width: 141,
                  height: 236,
                  padding: '12px 8px',
                  borderRadius: 4,
                  // Hoy, con el borde más claro: el motor no dibuja `outline`.
                  border: `1px solid ${dia.hoy ? 'rgba(255,255,255,0.3)' : calor === 'llena' ? 'rgba(232,98,31,0.4)' : ACERO_700}`,
                  backgroundImage: FONDO[calor],
                }}
              >
                {dia.cortes.map((corte) => (
                  <CorteOg
                    key={corte.hora}
                    {...formatoDe(corte.media)}
                    carne={carneDe(corte.destinos.map((d) => d.status))}
                  />
                ))}
              </div>
            )
          })}
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  )
}
