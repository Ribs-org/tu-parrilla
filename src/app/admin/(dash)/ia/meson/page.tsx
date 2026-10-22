import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Panel } from '@/components/charts/panel'
import { DeNocheYDeDia, NombreDe } from '@/components/de-noche-y-de-dia'
import { requireUser } from '@/lib/auth'
import { cuantosEnBorradores, mesonDelDueno } from '@/lib/cocina/meson'
import { esUuid } from '@/lib/uuid'
import { MESON, nombreDe } from '@/lib/vocabulario'
import { TarjetaDelCreativo } from './tarjeta'

export const dynamic = 'force-dynamic'

/**
 * El mesón —de día, la vitrina—: lo que el chef entregó, por comanda y por pieza, para revisarlo y
 * programarlo o descartarlo (`docs/superpowers/specs/2026-10-22-la-cocina-design.md`, «El mesón»).
 * Con `?comanda=`, solo lo de esa. Solo con la cocina encendida.
 */
export default async function MesonPage({ searchParams }: { searchParams: Promise<{ comanda?: string }> }) {
  const usuario = await requireUser()
  if (!usuario.cocinaDesde) redirect('/admin/ia')
  const { comanda } = await searchParams
  const soloUna = comanda && esUuid(comanda) ? comanda : undefined
  const meson = await mesonDelDueno(usuario.id, soloUna)
  const enBorradores = await cuantosEnBorradores(usuario.id)
  const fecha = new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeZone: usuario.zona })

  return (
    <>
      <header className="mb-6">
        <Link href="/admin/ia" className="text-sm text-fg-muted hover:text-fg">
          ← {nombreDe('/admin/ia')}
        </Link>
        <h1 className="mt-3 font-titulo text-2xl font-semibold uppercase tracking-[0.03em]">
          <DeNocheYDeDia noche={MESON.noche} dia={MESON.dia} />
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-fg-muted">
          Lo que el chef te entregó, listo para programar. Las versiones de una misma pieza —la misma idea en
          estilos distintos— van juntas. Programa las que te gusten y descarta las que no, diciendo por qué: el
          chef aprende de eso.
        </p>
        {soloUna ? (
          <Link href="/admin/ia/meson" className="mt-2 inline-block text-sm text-brasa underline-offset-2 hover:underline">
            <DeNocheYDeDia noche="Ver todo el mesón" dia="Ver toda la vitrina" />
          </Link>
        ) : null}
        {enBorradores > 0 ? (
          <p className="mt-2 text-sm text-fg-muted">
            {enBorradores === 1 ? '1 espera' : `${enBorradores} esperan`} en tus borradores de{' '}
            <NombreDe ruta="/admin/schedule" />, con sus cuentas y su hora por elegir.{' '}
            <Link href="/admin/schedule?panel=borradores" className="text-brasa underline-offset-2 hover:underline">
              Ver los borradores
            </Link>
          </p>
        ) : null}
      </header>

      {meson.length === 0 ? (
        <p className="text-sm text-fg-faint">
          <DeNocheYDeDia noche="Todavía no hay nada en el mesón." dia="Todavía no hay nada en la vitrina." />
        </p>
      ) : (
        <div className="space-y-6">
          {meson.map((c) => (
            <Panel key={c.id} title={c.principal ?? 'Comanda sin plato principal'} hint={`Pedida el ${fecha.format(c.creadaEn)}`}>
              <div className="space-y-6">
                {c.piezas.map((p) => (
                  <section key={p.pieza ?? p.creativos[0]!.id}>
                    {p.pieza ? (
                      <h3 className="mb-2 text-xs text-fg-faint">
                        Pieza «{p.pieza}»{p.creativos.length > 1 ? ` · ${p.creativos.length} estilos` : ''}
                      </h3>
                    ) : null}
                    <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                      {p.creativos.map((cr) => (
                        <TarjetaDelCreativo key={cr.id} creativo={cr} />
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            </Panel>
          ))}
        </div>
      )}
    </>
  )
}
