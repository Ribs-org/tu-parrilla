import { Panel } from '@/components/charts/panel'
import { Encabezado } from '@/components/ui'
import { requireAdmin } from '@/lib/auth'
import { listarCuentasTraspasables } from '@/lib/social/traspasar'
import { listarUsuarios } from '@/lib/usuarios'
import { pesoEnPalabras } from '@/lib/cocina/bodega'
import { claveQueRige, cuotaDeLaCamara, planEnPalabras } from '@/lib/planes/plan'
import { leerPlanes } from '@/lib/planes/planes'
import { enPesos } from '@/lib/planes/plan'
import { mercadoPagoConfigurado } from '@/lib/pagos/mercadopago'
import { estadoDePagoEnPalabras } from '@/lib/pagos/reglas'
import { cobrosRecientes } from '@/lib/pagos/suscripciones'
import { dayKey } from '@/lib/schedule-week'
import { ocupadoPorUsuario } from '@/lib/cocina/materiales'
import { DeNocheYDeDia } from '@/components/de-noche-y-de-dia'
import { CAMARA, nombreDe } from '@/lib/vocabulario'
import { FormularioInvitar, FormularioTraspaso, BotonQuitar, BotonCerrarSesiones, BotonCocina, BotonCuota } from './formularios'
import { BotonPlan, TarjetaDePlan } from './planes'

export const dynamic = 'force-dynamic'

export default async function UsuariosPage() {
  const { tema, zona } = await requireAdmin()
  // En la zona del admin: sin `timeZone`, el formato usaba la del servidor (UTC en Vercel), y
  // una invitación de las nueve de la noche en Chile salía con la fecha del día siguiente.
  const FECHA = new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeZone: zona })
  const [usuarios, cuentas, ocupado, planes] = [
    await listarUsuarios(),
    await listarCuentasTraspasables(),
    await ocupadoPorUsuario(),
    await leerPlanes(),
  ]
  const cobros = await cobrosRecientes()
  const ahora = new Date()
  const hoy = dayKey(ahora, zona)
  return (
    <>
      <header className="mb-6">
        <Encabezado ruta="/admin/usuarios" />
        <p className="mt-1 text-sm text-fg-muted">Quién puede entrar a Tu Parrilla. Invitar manda el primer código al correo.</p>
      </header>
      <Panel title="Los planes" className="mb-6">
        <p className="mb-3 text-sm text-fg-muted">
          Lo que trae cada plan. Las funciones son las mismas en los dos; cambian los topes, el espacio, los tokens y
          quién pasa primero en las colas. Toda persona nace en el gratis.
        </p>
        <div className="grid gap-4 lg:grid-cols-2">
          <TarjetaDePlan plan={planes.gratis} />
          <TarjetaDePlan plan={planes.pagado} />
        </div>
      </Panel>
      {mercadoPagoConfigurado() || cobros.length > 0 ? (
        <Panel title="Los cobros" className="mb-6">
          {cobros.length === 0 ? (
            <p className="text-sm text-fg-muted">Todavía no hay cobros.</p>
          ) : (
            <ul className="divide-y divide-velo/[0.06] text-sm">
              {cobros.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center gap-3 py-2">
                  <span className="font-mono text-xs text-fg-faint">{FECHA.format(c.cobradoEn ?? c.creadoEn)}</span>
                  <span className="min-w-0 flex-1 truncate">{c.correo ?? '(persona borrada)'}</span>
                  <span className="font-mono">{enPesos(c.montoClp)}</span>
                  <span className={c.estadoPago === 'approved' ? 'text-positive' : 'text-fg-muted'}>
                    {estadoDePagoEnPalabras(c.estadoPago)}
                  </span>
                  {c.detalle && c.estadoPago !== 'approved' ? (
                    <span className="basis-full font-mono text-[0.7rem] text-fg-faint">{c.detalle}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      ) : null}
      <Panel title="Invitar" className="mb-6">
        <FormularioInvitar />
      </Panel>
      <Panel title="Invitados">
        <ul className="divide-y divide-velo/[0.06]">
          {usuarios.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
              <span className="min-w-0 flex-1 truncate">{u.nombre ? `${u.nombre} · ` : ''}{u.correo}</span>
              <span className="text-xs text-fg-faint">{u.rol === 'admin' ? 'admin' : u.primerIngresoEn ? `entró ${FECHA.format(u.primerIngresoEn)}` : `invitado ${FECHA.format(u.invitadoEn)}`}</span>
              <span className="text-xs text-fg-faint">{planEnPalabras(u, planes, ahora, (d) => FECHA.format(d))}</span>
              <BotonPlan
                id={u.id}
                correo={u.correo}
                rige={planEnPalabras(u, planes, ahora, (d) => FECHA.format(d))}
                pagado={planes.pagado.nombre}
                hoy={hoy}
              />
              {u.cocinaDesde ? <span className="text-xs text-fg-faint">cocina desde {FECHA.format(u.cocinaDesde)}</span> : null}
              <BotonCocina id={u.id} correo={u.correo} encendida={Boolean(u.cocinaDesde)} />
              {/* La cuota de su cámara de frío: lo que tiene guardado y lo que le cabe. Solo con la cocina
                  encendida, o si quedó algo adentro de cuando la tuvo. */}
              {u.cocinaDesde || ocupado.has(u.id) ? (
                <>
                  <span className="text-xs text-fg-faint">
                    <DeNocheYDeDia noche={CAMARA.noche} dia={CAMARA.dia} />: {pesoEnPalabras(ocupado.get(u.id) ?? 0)} de{' '}
                    {pesoEnPalabras(cuotaDeLaCamara(u, planes[claveQueRige(u, ahora)]))}
                    {u.bodegaBytes === null ? '' : ' (a mano)'}
                  </span>
                  <BotonCuota
                    id={u.id}
                    correo={u.correo}
                    gigas={u.bodegaBytes === null ? '' : String(Math.round((u.bodegaBytes / 1024 ** 3) * 10) / 10)}
                    delPlan={pesoEnPalabras(planes[claveQueRige(u, ahora)].bodegaBytes)}
                  />
                </>
              ) : null}
              {u.rol !== 'admin' && !u.primerIngresoEn ? <BotonQuitar id={u.id} /> : null}
              {u.rol !== 'admin' && u.primerIngresoEn ? <BotonCerrarSesiones id={u.id} /> : null}
              {/* El id, para copiarlo: es lo que llevan las variables que encienden algo solo para una
                  cuenta (`COMENTARIOS_DM`, `THREADS_ABIERTO_PARA`). */}
              <span className="basis-full select-all font-mono text-[0.7rem] text-fg-faint">id {u.id}</span>
            </li>
          ))}
        </ul>
      </Panel>
      <Panel title="Traspasar una cuenta" className="mt-6">
        <FormularioTraspaso
          cuentas={cuentas}
          personas={usuarios.map(({ id, correo }) => ({ id, correo }))}
          fierros={nombreDe('/admin/accounts', tema)}
        />
      </Panel>
    </>
  )
}
