import { Panel } from '@/components/charts/panel'
import { RUBROS, type Parte } from '@/lib/social/tiktok-numeros'
import type { NumerosDeTiktok } from '@/lib/social/tiktok-numeros-guardar'
import { countryName, flagEmoji, formatNumber, formatPercent } from '@/lib/utils'
import { RubroTiktok } from './rubro-tiktok'

/** Los géneros como los da TikTok, en español. */
const GENEROS: Record<string, string> = { Female: 'Mujeres', Male: 'Hombres', Other: 'Otro' }

export const TITULO_TIKTOK_A_FONDO = 'TikTok, más a fondo'
export const SIN_AUDIENCIA = 'TikTok da la audiencia desde los 100 seguidores. Todavía no llega para esta cuenta.'
export const SIN_COMPARACION = 'TikTok todavía no dio la comparación para esta cuenta.'

function num(valor: number | null | undefined): string {
  return valor === null || valor === undefined ? '—' : formatNumber(Math.round(valor))
}

function pct(valor: number | null | undefined): string {
  return valor === null || valor === undefined ? '—' : formatPercent(valor * 100)
}

function Reparto({ titulo, partes, etiqueta }: { titulo: string; partes: Parte[]; etiqueta: (clave: string) => string }) {
  if (partes.length === 0) return null
  return (
    <div>
      <p className="font-mono text-[0.6rem] uppercase tracking-[0.14em] text-fg-faint">{titulo}</p>
      <ul className="mt-1 space-y-0.5 text-[0.8rem]">
        {partes.map((p) => (
          <li key={p.clave} className="flex justify-between gap-3">
            <span className="text-fg-muted">{etiqueta(p.clave)}</span>
            <span className="font-mono tabular-nums">{pct(p.parte)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * Lo que TikTok for Business da de cada cuenta de TikTok que lo activó (`tiktok-numeros.ts`): su
 * audiencia y la comparación con las cuentas de empresa de su rubro. Solo aparece con la reja
 * abierta y alguna cuenta activada (`numerosDeTiktok` llega vacío si no).
 */
export function TiktokAFondo({ numeros, nombres }: { numeros: NumerosDeTiktok[]; nombres: Record<string, string> }) {
  if (numeros.length === 0) return null
  return (
    <Panel
      title={TITULO_TIKTOK_A_FONDO}
      hint="Lo que da TikTok for Business: quién te sigue y cómo te va contra cuentas parecidas a la tuya. Llega con uno o dos días de atraso."
    >
      <div className="space-y-6">
        {numeros.map((n) => {
          const a = n.audiencia
          const c = n.comparacion
          const conAudiencia = a && (a.paises.length > 0 || a.generos.length > 0 || a.edades.length > 0)
          const filas: Array<{ rotulo: string; tuyo: string; ellos: string }> = [
            { rotulo: 'Seguidores', tuyo: num(a?.followers), ellos: num(c?.seguidores) },
            { rotulo: 'Seguidores ganados en 30 días', tuyo: num(a?.ganados30), ellos: num(c?.seguidoresGanados30) },
            { rotulo: 'Videos publicados', tuyo: num(a?.videos), ellos: num(c?.videos) },
            { rotulo: 'Interacción', tuyo: pct(n.interaccion), ellos: pct(c?.interaccion) },
          ]
          return (
            <section key={n.accountId} aria-label={nombres[n.accountId] ?? 'TikTok'}>
              <p className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-fg-faint">
                {nombres[n.accountId] ?? 'TikTok'}
              </p>
              <div className="mt-2 grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="rounded-2xl bg-velo/[0.04] p-4">
                  <p className="text-[0.85rem] font-semibold">Tu audiencia</p>
                  {conAudiencia ? (
                    <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <Reparto titulo="Países" partes={a.paises} etiqueta={(k) => `${flagEmoji(k)}  ${countryName(k)}`} />
                      <Reparto titulo="Género" partes={a.generos} etiqueta={(k) => GENEROS[k] ?? k} />
                      <Reparto titulo="Edad" partes={a.edades} etiqueta={(k) => `${k} años`} />
                    </div>
                  ) : (
                    <p className="mt-2 text-[0.8rem] text-fg-faint">{SIN_AUDIENCIA}</p>
                  )}
                </div>
                <div className="rounded-2xl bg-velo/[0.04] p-4">
                  <p className="text-[0.85rem] font-semibold">Cuentas parecidas a la tuya</p>
                  {c ? (
                    <>
                      <table className="mt-2 w-full text-[0.8rem]">
                        <thead>
                          <tr className="font-mono text-[0.6rem] uppercase tracking-[0.14em] text-fg-faint">
                            <th className="pb-1 text-left font-normal" />
                            <th className="pb-1 text-right font-normal">Tú</th>
                            <th className="pb-1 pl-3 text-right font-normal">Promedio del rubro</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filas.map((f) => (
                            <tr key={f.rotulo} className="border-t border-velo/[0.06]">
                              <td className="py-1 text-fg-muted">{f.rotulo}</td>
                              <td className="py-1 text-right font-mono tabular-nums">{f.tuyo}</td>
                              <td className="py-1 pl-3 text-right font-mono tabular-nums">{f.ellos}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <p className="mt-2 text-[0.72rem] text-fg-faint">
                        El promedio de las cuentas de empresa verificadas de «{RUBROS[c.rubro] ?? c.rubro}», según TikTok.
                        Tu interacción sale de tus videos del período: likes, comentarios y compartidos sobre views.
                      </p>
                    </>
                  ) : (
                    <p className="mt-2 text-[0.8rem] text-fg-faint">{SIN_COMPARACION}</p>
                  )}
                  <RubroTiktok cuentaId={n.accountId} rubro={n.rubro} />
                </div>
              </div>
            </section>
          )
        })}
      </div>
    </Panel>
  )
}
