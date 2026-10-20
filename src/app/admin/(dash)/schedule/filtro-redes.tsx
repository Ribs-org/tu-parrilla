import Link from 'next/link'
import type { ReactNode } from 'react'
import { Icon } from '@/components/icon'
import { colorDeRed } from '@/lib/color-de-red'
import { networkLabel } from '@/lib/networks'
import { cn } from '@/lib/utils'
import type { Filtro, RedEnElFiltro } from './filtro-red'

const CHIP = 'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[0.75rem] transition-colors'
const CHIP_ACTIVO = 'border-brasa/70 bg-brasa/[0.12] text-fg'
const CHIP_QUIETO = 'border-acero-700 text-fg-muted hover:border-acero-600 hover:text-fg'

/**
 * El filtro por red de La Parrilla: «Todas» y un botón por red, cada uno con cuántos cortes
 * tiene en lo que se mira. Va en la dirección (`?red=`), así que sobrevive al cambiar de
 * semana o de vista. «Se quemó» no lo obedece: es lo que pide la mano del dueño, y un filtro
 * olvidado no puede esconderlo.
 *
 * Las cuentas de una red con varias no se ven de entrada —el dueño pidió no mostrar tanto—:
 * aparecen al pasar el mouse por la red, o al llegar con el teclado (`.cuentas-al-pasar`, en
 * globals.css). Sin mouse no hay «pasar por encima»: con esa red elegida, sus cuentas van en
 * una fila debajo (`.cuentas-en-fila`). Un clic en la red elegida la suelta; en la red de una
 * cuenta elegida, vuelve a la red entera.
 */
export function FiltroDeRedes({
  todas,
  redes,
  filtro,
  hrefDe,
}: {
  todas: number
  redes: readonly RedEnElFiltro[]
  filtro: Filtro | null
  /** La parrilla con `?red=` en ese valor: una red, el id de una cuenta, o null para «Todas». */
  hrefDe: (valor: string | null) => string
}) {
  const elegida = filtro ? redes.find((r) => r.red === filtro.red) : undefined
  const handleDe = (r: RedEnElFiltro, id: string) => r.cuentas.find((c) => c.id === id)?.handle ?? networkLabel(r.red)

  return (
    <div className="flex flex-col gap-2 sm:items-end">
      {/* En el teléfono, en un solo renglón que se desliza de lado: en dos o tres, el filtro
          empujaba la semana media pantalla hacia abajo. */}
      <nav aria-label="Filtrar por red" className="flex flex-wrap items-center gap-1.5 max-sm:flex-nowrap max-sm:overflow-x-auto">
        <Link href={hrefDe(null)} scroll={false} aria-current={filtro ? undefined : 'true'} className={cn(CHIP, filtro ? CHIP_QUIETO : CHIP_ACTIVO)}>
          Todas
          <Cuantos n={todas} />
        </Link>
        {redes.map((r) => {
          const activa = filtro?.red === r.red
          const cuenta = activa && filtro?.cuenta ? r.cuentas.find((c) => c.id === filtro.cuenta) : undefined
          return (
            <span key={r.red} className="filtro-red relative inline-flex">
              <Link
                // La red elegida entera se suelta; con una cuenta elegida, se vuelve a la red.
                href={hrefDe(activa && !cuenta ? null : r.red)}
                scroll={false}
                aria-current={activa ? 'true' : undefined}
                className={cn(CHIP, activa ? CHIP_ACTIVO : CHIP_QUIETO)}
              >
                <Icon name={r.red} className={cn('h-3.5 w-3.5 shrink-0', colorDeRed(r.red))} />
                {networkLabel(r.red)}
                {cuenta ? (
                  <>
                    <span aria-hidden>·</span>
                    <span className="max-w-[10rem] truncate">{cuenta.handle ?? networkLabel(r.red)}</span>
                  </>
                ) : null}
                <Cuantos n={cuenta ? cuenta.cuantos : r.cuantos} />
              </Link>
              {r.cuentas.length > 1 ? (
                // El `pt-1` es parte del menú: el mouse cruza ese hueco sin salir de la red.
                <span className="cuentas-al-pasar absolute left-0 top-full z-30 pt-1">
                  <span className="flex min-w-[13rem] flex-col gap-0.5 rounded-lg border border-acero-700 bg-acero-900 p-1 shadow-lg">
                    <span className="px-2 pb-0.5 pt-1 font-titulo text-[0.6rem] uppercase tracking-[0.12em] text-fg-faint">
                      Por cuenta
                    </span>
                    {cuenta ? (
                      <OpcionDeCuenta href={hrefDe(r.red)} activa={false} n={r.cuantos}>
                        Todas las de {networkLabel(r.red)}
                      </OpcionDeCuenta>
                    ) : null}
                    {r.cuentas.map((c) => (
                      <OpcionDeCuenta key={c.id} href={hrefDe(c.id)} activa={cuenta?.id === c.id} n={c.cuantos}>
                        {c.handle ?? networkLabel(r.red)}
                      </OpcionDeCuenta>
                    ))}
                  </span>
                </span>
              ) : null}
            </span>
          )
        })}
      </nav>

      {elegida && elegida.cuentas.length > 1 ? (
        <nav aria-label={`Cuentas de ${networkLabel(elegida.red)}`} className="cuentas-en-fila flex-wrap items-center gap-1.5 max-sm:flex-nowrap max-sm:overflow-x-auto">
          <Link
            href={hrefDe(elegida.red)}
            scroll={false}
            aria-current={filtro?.cuenta ? undefined : 'true'}
            className={cn(CHIP, 'py-0.5 text-[0.7rem]', filtro?.cuenta ? CHIP_QUIETO : CHIP_ACTIVO)}
          >
            Todas las de {networkLabel(elegida.red)}
            <Cuantos n={elegida.cuantos} />
          </Link>
          {elegida.cuentas.map((c) => (
            <Link
              key={c.id}
              href={hrefDe(c.id)}
              scroll={false}
              aria-current={filtro?.cuenta === c.id ? 'true' : undefined}
              className={cn(CHIP, 'py-0.5 text-[0.7rem]', filtro?.cuenta === c.id ? CHIP_ACTIVO : CHIP_QUIETO)}
            >
              <span className="max-w-[10rem] truncate">{handleDe(elegida, c.id)}</span>
              <Cuantos n={c.cuantos} />
            </Link>
          ))}
        </nav>
      ) : null}
    </div>
  )
}

function Cuantos({ n }: { n: number }) {
  return <span className="font-mono text-[0.68rem] text-fg-faint">{n}</span>
}

function OpcionDeCuenta({
  href,
  activa,
  n,
  children,
}: {
  href: string
  activa: boolean
  n: number
  children: ReactNode
}) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={activa ? 'true' : undefined}
      className={cn(
        'flex items-center justify-between gap-3 rounded px-2 py-1 text-[0.75rem] transition-colors hover:bg-velo/[0.06] hover:text-fg',
        activa ? 'bg-velo/[0.08] text-fg' : 'text-fg-muted',
      )}
    >
      <span className="truncate">{children}</span>
      <Cuantos n={n} />
    </Link>
  )
}
