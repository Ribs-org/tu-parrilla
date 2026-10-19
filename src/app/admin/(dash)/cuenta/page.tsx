import { headers } from 'next/headers'
import { Panel } from '@/components/charts/panel'
import { Encabezado } from '@/components/ui'
import { requireUser } from '@/lib/auth'
import { listarLlaves } from '@/lib/llaves'
import { MAX_NOMBRE, PREFIJO } from '@/lib/llaves-api'
import { horaEn, zonasDisponibles } from '@/lib/zona'
import { FormularioCuenta } from './formulario'
import { BotonRevocar, FormularioLlave } from './llaves'

export const dynamic = 'force-dynamic'

export default async function CuentaPage() {
  const usuario = await requireUser()
  const llaves = await listarLlaves(usuario.id)

  // La base de la API es el dominio donde está abierto el panel: en producción el panel
  // solo se abre en el del producto (`panelEnElProducto`), y en local o en un preview la
  // llave sirve contra ese mismo despliegue, no contra producción.
  const cabeceras = await headers()
  const host = cabeceras.get('host') ?? 'localhost:3000'
  const protocolo = cabeceras.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')
  const base = `${protocolo}://${host}`

  // Las fechas en la zona de quien mira, como el resto del panel.
  const fecha = new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeZone: usuario.zona })
  const fechaHora = new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeStyle: 'short', timeZone: usuario.zona })

  return (
    <>
      <header className="mb-6">
        <Encabezado ruta="/admin/cuenta" />
        <p className="mt-1 text-sm text-fg-muted">
          Con qué nombre apareces, en qué zona horaria vives y las llaves que les das a tus agentes.
          El correo con el que entras no se cambia acá.
        </p>
      </header>
      <Panel title="Tus datos" className="mb-6">
        <FormularioCuenta
          nombre={usuario.nombre}
          zona={usuario.zona}
          zonas={zonasDisponibles()}
          // La hora se calcula acá, en el servidor, y no en el navegador: el reloj del
          // computador puede estar en otra zona (o mal), y lo que hay que mostrar es lo que
          // el servidor entiende por «ahora» en la zona guardada. Tras guardar, el
          // `revalidatePath` de la acción vuelve a pintar esta página y la trae nueva.
          ahora={horaEn(usuario.zona, new Date())}
        />
      </Panel>
      <Panel
        title="Llaves para tus agentes"
        hint="Con una llave, un programa —tu agente que edita videos, un script— programa posts, los saca, lee tu calendario y tus métricas a tu nombre, sin entrar al panel."
      >
        <p className="mb-4 max-w-2xl text-sm text-fg-muted">
          Quien tenga la llave puede hacer todo eso con tus cuentas: dásela solo al agente que la va a
          usar. Lo que tiene que leer para saber usarla está en{' '}
          <a href="/docs/api-llm.md" target="_blank" rel="noreferrer" className="text-brasa underline-offset-2 hover:underline">
            la guía de la API
          </a>
          .
        </p>
        <FormularioLlave base={base} maxNombre={MAX_NOMBRE} />
        {llaves.length > 0 ? (
          <ul className="mt-6 divide-y divide-velo/[0.06] border-t border-velo/[0.06]">
            {llaves.map((llave) => (
              <li key={llave.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
                <span className="min-w-0 flex-1 truncate">{llave.nombre}</span>
                <span className="font-mono text-xs text-fg-faint">
                  {PREFIJO}…{llave.final}
                </span>
                <span className="text-xs text-fg-faint">
                  creada {fecha.format(llave.creadaEn)} ·{' '}
                  {llave.usadaEn ? `usada por última vez ${fechaHora.format(llave.usadaEn)}` : 'sin usar'}
                </span>
                <BotonRevocar id={llave.id} nombre={llave.nombre} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-6 text-sm text-fg-faint">Todavía no tienes llaves.</p>
        )}
      </Panel>
    </>
  )
}
