import { Panel } from '@/components/charts/panel'
import { FUENTES, type VideoAFondo } from '@/lib/social/tiktok-numeros'
import { formatNumber, formatPercent } from '@/lib/utils'

export type VersionAFondo = { clave: string; nombre: string; video: VideoAFondo }

export const TITULO_VIDEO_A_FONDO = 'En TikTok, más a fondo'

function num(valor: number | null): string {
  return valor === null ? '—' : formatNumber(valor)
}

function pct(valor: number | null): string {
  return valor === null ? '—' : formatPercent(valor * 100)
}

/** Segundos como «12,4 s». */
function segundos(valor: number | null): string {
  return valor === null ? '—' : `${valor.toLocaleString('es', { maximumFractionDigits: 1 })} s`
}

/**
 * Lo que TikTok for Business da de cada versión de TikTok de la pieza, además de lo de siempre
 * (`tiktok-numeros.ts`): el tiempo visto, cuántos llegaron al final, los seguidores que trajo y de
 * dónde llegó la gente. Son totales de toda la vida del video, no del período. Sin versiones con
 * esos datos —reja cerrada, cuenta sin activar o TikTok todavía no los da— no dibuja nada.
 */
export function VideoTiktokAFondo({ versiones }: { versiones: VersionAFondo[] }) {
  if (versiones.length === 0) return null
  return (
    <Panel
      className="mt-3"
      title={TITULO_VIDEO_A_FONDO}
      hint="Lo que da TikTok for Business de cada versión en TikTok. Son de toda la vida del video, no del período, y llegan con uno o dos días de atraso."
    >
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {versiones.map(({ clave, nombre, video }) => {
          const cifras: Array<[string, string]> = [
            ['Alcance', num(video.alcance)],
            ['Guardados', num(video.guardados)],
            ['Tiempo visto, en promedio', segundos(video.vistoPromedio)],
            ['Lo vieron completo', pct(video.vieronCompleto)],
            ['Seguidores nuevos', num(video.seguidoresNuevos)],
            ['Visitas al perfil', num(video.visitasAlPerfil)],
            ['No te seguían', pct(video.noSeguidores)],
          ]
          return (
            <div key={clave} className="rounded-2xl bg-velo/[0.04] p-4">
              <p className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-fg-faint">{nombre}</p>
              <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[0.8rem]">
                {cifras.map(([rotulo, valor]) => (
                  <div key={rotulo} className="flex justify-between gap-2">
                    <dt className="text-fg-muted">{rotulo}</dt>
                    <dd className="font-mono tabular-nums">{valor}</dd>
                  </div>
                ))}
              </dl>
              {video.fuentes.length > 0 ? (
                <>
                  <p className="mt-3 font-mono text-[0.6rem] uppercase tracking-[0.14em] text-fg-faint">
                    De dónde llegaron
                  </p>
                  <ul className="mt-1 space-y-0.5 text-[0.8rem]">
                    {video.fuentes.map((f) => (
                      <li key={f.clave} className="flex justify-between gap-3">
                        <span className="text-fg-muted">{FUENTES[f.clave] ?? f.clave}</span>
                        <span className="font-mono tabular-nums">{pct(f.parte)}</span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
            </div>
          )
        })}
      </div>
    </Panel>
  )
}
