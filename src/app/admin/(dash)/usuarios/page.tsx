import { Panel } from '@/components/charts/panel'
import { Encabezado } from '@/components/ui'
import { requireAdmin } from '@/lib/auth'
import { listarUsuarios } from '@/lib/usuarios'
import { FormularioInvitar, BotonQuitar, BotonCerrarSesiones, BotonCocina } from './formularios'

export const dynamic = 'force-dynamic'

export default async function UsuariosPage() {
  const { zona } = await requireAdmin()
  // En la zona del admin: sin `timeZone`, el formato usaba la del servidor (UTC en Vercel), y
  // una invitación de las nueve de la noche en Chile salía con la fecha del día siguiente.
  const FECHA = new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeZone: zona })
  const usuarios = await listarUsuarios()
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
              {u.rol !== 'admin' && !u.primerIngresoEn ? <BotonQuitar id={u.id} /> : null}
              {u.rol !== 'admin' && u.primerIngresoEn ? <BotonCerrarSesiones id={u.id} /> : null}
              {/* El id, para copiarlo: es lo que llevan las variables que encienden algo solo para una
                  cuenta (`COMENTARIOS_DM`, `THREADS_ABIERTO_PARA`). */}
              <span className="basis-full select-all font-mono text-[0.7rem] text-fg-faint">id {u.id}</span>
            </li>
          ))}
        </ul>
      </Panel>
    </>
  )
}
