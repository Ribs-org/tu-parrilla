import { Panel } from '@/components/charts/panel'
import { Encabezado } from '@/components/ui'
import { requireAdmin } from '@/lib/auth'
import { listarCuentasTraspasables } from '@/lib/social/traspasar'
import { listarUsuarios } from '@/lib/usuarios'
import { CUOTA_BODEGA_POR_DEFECTO, pesoEnPalabras } from '@/lib/cocina/bodega'
import { ocupadoPorUsuario } from '@/lib/cocina/materiales'
import { DeNocheYDeDia } from '@/components/de-noche-y-de-dia'
import { CAMARA, nombreDe } from '@/lib/vocabulario'
import { FormularioInvitar, FormularioTraspaso, BotonQuitar, BotonCerrarSesiones, BotonCocina, BotonCuota } from './formularios'

export const dynamic = 'force-dynamic'

export default async function UsuariosPage() {
  const { tema, zona } = await requireAdmin()
  // En la zona del admin: sin `timeZone`, el formato usaba la del servidor (UTC en Vercel), y
  // una invitación de las nueve de la noche en Chile salía con la fecha del día siguiente.
  const FECHA = new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeZone: zona })
  const [usuarios, cuentas, ocupado] = [await listarUsuarios(), await listarCuentasTraspasables(), await ocupadoPorUsuario()]
  return (
    <>
      <header className="mb-6">
        <Encabezado ruta="/admin/usuarios" />
        <p className="mt-1 text-sm text-fg-muted">Quién puede entrar a Parrilla. Invitar manda el primer código al correo.</p>
      </header>
      <Panel title="Invitar" className="mb-6">
        <FormularioInvitar />
      </Panel>
      <Panel title="Invitados">
        <ul className="divide-y divide-velo/[0.06]">
          {usuarios.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
              <span className="min-w-0 flex-1 truncate">{u.nombre ? `${u.nombre} · ` : ''}{u.correo}</span>
              <span className="text-xs text-fg-faint">{u.rol === 'admin' ? 'admin' : u.primerIngresoEn ? `entró ${FECHA.format(u.primerIngresoEn)}` : `invitado ${FECHA.format(u.invitadoEn)}`}</span>
              {u.cocinaDesde ? <span className="text-xs text-fg-faint">cocina desde {FECHA.format(u.cocinaDesde)}</span> : null}
              <BotonCocina id={u.id} correo={u.correo} encendida={Boolean(u.cocinaDesde)} />
              {/* La cuota de su cámara de frío: lo que tiene guardado y lo que le cabe. Solo con la cocina
                  encendida, o si quedó algo adentro de cuando la tuvo. */}
              {u.cocinaDesde || ocupado.has(u.id) ? (
                <>
                  <span className="text-xs text-fg-faint">
                    <DeNocheYDeDia noche={CAMARA.noche} dia={CAMARA.dia} />: {pesoEnPalabras(ocupado.get(u.id) ?? 0)} de{' '}
                    {pesoEnPalabras(u.bodegaBytes ?? CUOTA_BODEGA_POR_DEFECTO)}
                    {u.bodegaBytes === null ? '' : ' (a mano)'}
                  </span>
                  <BotonCuota id={u.id} correo={u.correo} gigas={u.bodegaBytes === null ? '' : String(Math.round((u.bodegaBytes / 1024 ** 3) * 10) / 10)} />
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
