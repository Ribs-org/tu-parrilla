import Link from 'next/link'
import { Empty, Panel } from '@/components/charts/panel'
import { NombreDe } from '@/components/de-noche-y-de-dia'
import type { Filters } from '@/lib/analytics'
import { DIAS_A_IGUAL_EDAD, contraSuCuenta } from '@/lib/igual-edad'
import { POCAS_PUBLICACIONES } from '@/lib/pieza'
import { attributesFor } from '@/lib/post-attributes'
import { MAX_PUBLICACIONES_LEIDAS, getPostRows } from '@/lib/posts'
import type { CuentaRow } from '@/lib/posts-kpis'
import { fraseDe, queFunciona, type ClaveDimension, type Veredicto } from '@/lib/que-funciona'
import { numerosHref, type Params } from '@/lib/tablero'
import { cn, formatNumber } from '@/lib/utils'

const RUTA = '/admin/analytics'

const ROTULOS: Record<ClaveDimension, string> = { tema: 'Tema', estilo: 'Estilo', formato: 'Formato' }

/** A dónde mirar el detalle: «Comparar por atributo» en lo anotado; el formato no es un atributo. */
function detalle(v: Veredicto, params: Params): { href: string; texto: string } | null {
  if (v.estado === 'sinValor') return null
  if (v.clave === 'formato') return { href: numerosHref(`${RUTA}/mejores`, params, { mas: null }), texto: 'Tu mejor 10 % →' }
  return {
    href: numerosHref(`${RUTA}/comparar`, params, { mas: null, atributo: v.clave }),
    texto: `Comparar por ${v.clave} →`,
  }
}

/**
 * «Qué te funciona», en la mitad «En las redes»: qué tema, qué estilo y qué formato anduvieron
 * mejor en el período, dicho en una frase (`src/lib/que-funciona.ts`). Lee lo mismo que
 * «Comparar por atributo» —lo publicado en el período, con su lectura de los 7 días—, que no
 * es lo que lee el resto del tablero (lo que tuvo actividad en el período): por eso hace su
 * propia consulta, y va en su propio `Suspense` para no atrasar las cifras de arriba.
 */
export async function QueFunciona({
  filters,
  params,
  cuenta,
}: {
  filters: Filters
  params: Params
  cuenta: CuentaRow | null
}) {
  const filas = await getPostRows(filters, false, {
    publishedFrom: filters.from,
    publishedTo: filters.to,
    limit: MAX_PUBLICACIONES_LEIDAS,
    aLos7Dias: true,
    ...(cuenta ? { accountId: cuenta.id } : {}),
  })
  const atributosDe = await attributesFor(filters.ownerId, filas)
  const entradas = filas.map((fila) => ({ fila, atributos: atributosDe.get(`${fila.network}:${fila.externalId}`) ?? null }))
  return (
    <QueFuncionaVista
      veredictos={queFunciona(entradas, contraSuCuenta(filas))}
      publicaciones={filas.length}
      params={params}
    />
  )
}

/** Lo que se ve, aparte de la consulta: así se puede mirar sin la base. */
export function QueFuncionaVista({
  veredictos,
  publicaciones,
  params,
}: {
  veredictos: Veredicto[]
  publicaciones: number
  params: Params
}) {
  const sinAnotar = veredictos.some((v) => v.clave !== 'formato' && v.estado === 'sinValor')

  return (
    <Panel
      className="mt-3"
      title="Qué te funciona"
      hint={`Lo publicado en el período, cada publicación a los ${DIAS_A_IGUAL_EDAD} días y contra lo normal de su cuenta: ×2 es el doble de lo normal. Dice cuál anda mejor solo si hay dos con al menos ${POCAS_PUBLICACIONES} publicaciones medidas.`}
    >
      {publicaciones === 0 ? (
        <Empty>No publicaste nada en este período. Amplía el período.</Empty>
      ) : (
        <>
          <ul className="divide-y divide-velo/[0.06]">
            {veredictos.map((v) => {
              const link = detalle(v, params)
              return (
                <li key={v.clave} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:gap-4">
                  <span className="w-20 shrink-0 font-mono text-[0.65rem] uppercase tracking-[0.14em] text-fg-faint">
                    {ROTULOS[v.clave]}
                  </span>
                  <p
                    className={cn(
                      'min-w-0 grow text-[0.85rem] leading-relaxed',
                      v.estado === 'gana' ? 'text-fg' : 'text-fg-muted',
                    )}
                  >
                    {fraseDe(v)}
                  </p>
                  {link ? (
                    <Link
                      href={link.href}
                      className="shrink-0 text-[0.75rem] text-fg-muted transition-colors hover:text-fg"
                    >
                      {link.texto}
                    </Link>
                  ) : null}
                </li>
              )
            })}
          </ul>
          <div className="mt-3 max-w-2xl space-y-2 text-[0.78rem] leading-relaxed text-fg-faint">
            {sinAnotar ? (
              <p>
                El tema y el estilo se anotan en los atributos de cada post al programarlo —por ejemplo,
                «tema: recetas» y «estilo: tutorial»—, en el campo «Atributos» del editor de{' '}
                <NombreDe ruta="/admin/schedule" /> o por la API, siempre escritos igual. El formato lo
                da la red.
              </p>
            ) : null}
            <p>
              Cuántos seguidores trajo cada publicación no se puede saber: TikTok da solo el total de
              la cuenta, e Instagram no lo da en los reels. Lo que ganó cada cuenta de Instagram y
              Facebook está en «Tus cuentas», en «⋯ Más».
              {publicaciones >= MAX_PUBLICACIONES_LEIDAS
                ? ` Se leyeron las ${formatNumber(MAX_PUBLICACIONES_LEIDAS)} publicaciones más recientes: acorta el período para verlas todas.`
                : ''}
            </p>
          </div>
        </>
      )}
    </Panel>
  )
}
