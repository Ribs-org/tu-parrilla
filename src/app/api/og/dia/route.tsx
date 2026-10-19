import { ImageResponse } from 'next/og'
import { SEMANA } from '@/components/landing-semana'
import { PESCADO, capasDeMuestra } from '@/components/pieza-sushi'
import { calorDelDia, carneDe, formatoDe, type Carne, type Formato } from '@/lib/parrilla'

export const dynamic = 'force-static'

/**
 * La imagen con que se comparte la portada de día: la misma de `/api/og`, con el papel de arroz,
 * las tablas de servir y las piezas de sushi. La pide la portada abierta con `?modo=dia`
 * (`metadataLanding`), que es el enlace para compartirla de día.
 *
 * Colores literales, como en la de noche: el motor de `next/og` no lee las variables del
 * proyecto. Son los del día en `globals.css` (`.acerado[data-tema='dia']` y sus `.grilla-*`). Las
 * piezas, en capas planas (`capasDeMuestra`): sin bandas ni vetas, que a este tamaño no se leen.
 */
const PAPEL = '#f6f1e9'
const BORDE = '#e2d8c9'
const TINTA = '#221f1c'
const TENUE = '#6b655d'

/** Las líneas de bambú de cada tabla; más suaves en la que está vacía. */
const BAMBU = 'repeating-linear-gradient(to bottom, rgba(120,100,70,0.1) 0px, rgba(120,100,70,0.1) 2px, transparent 2px, transparent 12px)'
const BAMBU_SUAVE = 'repeating-linear-gradient(to bottom, rgba(120,100,70,0.05) 0px, rgba(120,100,70,0.05) 2px, transparent 2px, transparent 12px)'

const FONDO = {
  apagada: `${BAMBU_SUAVE}, linear-gradient(to bottom, ${PAPEL}, ${PAPEL})`,
  prendida: `${BAMBU}, linear-gradient(to bottom, rgba(242,140,104,0.04), rgba(242,140,104,0.14) 62%, rgba(242,140,104,0.22))`,
  llena: `${BAMBU}, linear-gradient(to bottom, rgba(242,140,104,0.1), rgba(242,140,104,0.26) 58%, rgba(242,140,104,0.4))`,
} as const

/** Una pieza en chico: sus capas, con el degradado del pescado de su cocción. */
function PiezaOg({ formato, huesos, carne }: { formato: Formato; huesos: number; carne: Carne }) {
  const p = PESCADO[carne]
  return (
    <svg width="112" height="60" viewBox="0 0 120 64">
      <defs>
        <linearGradient id="pescado" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={p.claro} />
          <stop offset="0.55" stopColor={p.medio} />
          <stop offset="1" stopColor={p.hondo} />
        </linearGradient>
      </defs>
      {capasDeMuestra(formato, huesos, carne).map((capa, i) => (
        <path
          key={i}
          d={capa.d}
          fill={capa.relleno === 'pescado' ? 'url(#pescado)' : capa.relleno}
          stroke="rgba(60,40,30,0.28)"
          strokeWidth="0.9"
        />
      ))}
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
          background: PAPEL,
          padding: 64,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 24, letterSpacing: 8, color: TENUE }}>TU PARRILLA</div>
          <div style={{ marginTop: 22, fontSize: 68, fontWeight: 700, color: TINTA, lineHeight: 1.08 }}>
            Programa la semana.
          </div>
          <div style={{ fontSize: 68, fontWeight: 700, color: TINTA, lineHeight: 1.08 }}>
            Mira qué trajo cada pieza.
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
                  // Hoy, con el borde de la tinta: el motor no dibuja `outline`.
                  border: `1px solid ${dia.hoy ? 'rgba(34,31,28,0.3)' : calor === 'llena' ? 'rgba(184,61,11,0.35)' : BORDE}`,
                  backgroundImage: FONDO[calor],
                }}
              >
                {dia.cortes.map((corte) => (
                  <PiezaOg
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
