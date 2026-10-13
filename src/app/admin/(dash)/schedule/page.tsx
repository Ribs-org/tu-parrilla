import Link from 'next/link'
import { Plus } from 'lucide-react'
import { ENLACE_BOTON, ENLACE_BOTON_SECUNDARIO } from '@/components/boton'
import { Encabezado } from '@/components/ui'
import { requireUser } from '@/lib/auth'
import { fechaParaDia, idDeBorrador, primero, textoDe } from '@/lib/borrador'
import { cargarBorrador, listarBorradores } from '@/lib/borradores'
import { pieDeAyer, quemados } from '@/lib/fuego'
import { getCuentas } from '@/lib/posts'
import { addDays, contarPorDia, dayKey, dayLabelConMes, hourLabel, normalizeWeekParam } from '@/lib/schedule-week'
import { servidosAyer, todosLosCortes } from '@/lib/social/publish/cortes'
import { cn, toZonedInput } from '@/lib/utils'
import { nombreDe } from '@/lib/vocabulario'
import { BatchUpload } from './batch-upload'
import { WeekCalendar } from './calendar'
import { Composer } from './composer'
import { scheduleHref } from './enlace'
import { ListaBorradores } from './lista-borradores'
import { ordenarCola } from './orden'
import { Queue } from './queue'
import { SeQuemo } from './se-quemo'

export const dynamic = 'force-dynamic'

/**
 * La Parrilla, que es también la entrada del panel (`/admin` lleva acá).
 *
 * De arriba abajo: lo que se quemó —lo único que pide una acción sin que nadie la busque—,
 * el calendario de la semana (o la lista, a un clic) y, al pie, cuánto salió ayer. Componer,
 * abrir un borrador y subir un CSV pasan en un panel lateral que la URL abre
 * (`?componer=1`, `?borrador=…`, `?panel=…`), para que el calendario siga a la vista detrás.
 */
export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const texto = (clave: string) => (typeof params[clave] === 'string' ? (params[clave] as string) : '')
  // El calendario es la vista con que abre; la lista, a un clic. `vista=calendario`, de los
  // enlaces de antes, sigue cayendo en el calendario.
  const enLista = texto('vista') === 'lista'

  // La parrilla entera —qué semana es «esta», en qué casilla cae cada corte, qué hora dice
  // la lista— se dibuja en la zona del dueño.
  const { id: ownerId, zona } = await requireUser()
  const now = new Date()
  const monday = normalizeWeekParam(texto('semana') || undefined, now, zona)

  // En serie y no en paralelo: más consultas a la vez que conexiones en el pool se colgaron
  // una vez contra el pooler de Supabase (ver `docs/pendientes.md`), y estas son rápidas.
  const cuentas = await getCuentas(ownerId)
  // Posts, destinos con handle y media. Sin ventana: el calendario siempre mostró todo lo del
  // dueño. Vienen por hora ascendente, como el calendario los necesita; la lista los
  // reordena aparte, y «Se quemó» sale de estas mismas filas.
  const cortes = await todosLosCortes(ownerId)
  const ayer = await servidosAyer(ownerId, now, zona)
  const borradores = await listarBorradores(ownerId)

  const hayConectada = cuentas.some((c) => c.connected)
  // `volver` lleva al editor de vuelta a esta misma vista y semana; los parámetros de un solo
  // uso (el panel abierto, el aviso de «programado») no viajan.
  const volver = scheduleHref(params, {})

  // Lo que el compositor usa para decir cómo está el día que elegiste. Sale de estas
  // mismas filas y no de otra consulta, así el aviso y el calendario nunca se
  // contradicen. Solo lo que viene: no se puede programar en el pasado.
  const carga = contarPorDia(
    cortes.map(({ post }) => post).filter((post) => post.scheduledAt >= now),
    zona,
  )

  /** El panel lateral que pide la URL, o nada. */
  async function panelPedido() {
    const cerrarHref = scheduleHref(params, {})
    const pedido = idDeBorrador(texto('borrador'))

    if (texto('componer') === '1' || pedido) {
      const borrador = pedido ? await cargarBorrador(ownerId, pedido) : null
      if (pedido && !borrador) return listaDeBorradores(cerrarHref)
      return (
        <Composer
          // Otro borrador u otro día es otro formulario: se monta de cero.
          key={borrador?.id ?? `nuevo-${texto('dia')}`}
          carga={carga}
          cuentas={cuentas}
          borrador={borrador ? { id: borrador.id, campos: borrador.campos, media: borrador.media } : null}
          // El instante guardado, en la zona de hoy: si la zona cambió en Tu Cuenta, el
          // compositor y el calendario siguen diciendo la misma hora.
          fechaInicial={
            borrador
              ? borrador.fecha
                ? toZonedInput(borrador.fecha, zona)
                : primero(borrador.campos, 'scheduledAt')
              : fechaParaDia(texto('dia'), now, zona)
          }
          listoHref={scheduleHref(params, { hecho: 'programado' })}
          cerrarHref={cerrarHref}
        />
      )
    }
    if (texto('panel') === 'borradores') return listaDeBorradores(cerrarHref)
    if (texto('panel') === 'csv') return <BatchUpload cerrarHref={cerrarHref} />
    return null
  }

  function listaDeBorradores(cerrarHref: string) {
    return (
      <ListaBorradores
        cerrarHref={cerrarHref}
        filas={borradores.map((b) => ({
          id: b.id,
          href: scheduleHref(params, { borrador: b.id }),
          texto: textoDe(b.campos),
          cuando: b.fecha
            ? `para el ${dayLabelConMes(dayKey(b.fecha, zona))} a las ${hourLabel(b.fecha, zona)}`
            : 'sin fecha',
          guardado: `guardado el ${dayLabelConMes(dayKey(b.actualizadoEn, zona))} a las ${hourLabel(b.actualizadoEn, zona)}`,
          archivos: b.archivos,
        }))}
      />
    )
  }

  const panel = await panelPedido()

  return (
    <>
      <header className="mb-6">
        <Encabezado ruta="/admin/schedule">
          <div className="flex flex-wrap items-center gap-2">
            {borradores.length > 0 ? (
              <Link href={scheduleHref(params, { panel: 'borradores' })} scroll={false} className={ENLACE_BOTON_SECUNDARIO}>
                Borradores ({borradores.length})
              </Link>
            ) : null}
            <Link href={scheduleHref(params, { panel: 'csv' })} scroll={false} className={ENLACE_BOTON_SECUNDARIO}>
              Subir CSV
            </Link>
            <Link href={scheduleHref(params, { componer: '1' })} scroll={false} className={ENLACE_BOTON}>
              <Plus className="h-4 w-4" aria-hidden />
              Nueva publicación
            </Link>
          </div>
        </Encabezado>
      </header>

      {texto('hecho') === 'programado' ? (
        <p role="status" className="mb-4 text-sm text-positive">
          Programado.
        </p>
      ) : null}

      <div className="space-y-6">
        {hayConectada ? null : <PrimerDia />}

        <SeQuemo filas={quemados(cortes)} now={now} zone={zona} volver={volver} />

        <div>
          <div className="mb-3 flex items-center gap-1.5">
            {[
              { label: 'Calendario', href: scheduleHref(params, { vista: null }), active: !enLista },
              { label: 'Lista', href: scheduleHref(params, { vista: 'lista', semana: null }), active: enLista },
            ].map((tab) => (
              <Link
                key={tab.label}
                href={tab.href}
                className={cn(
                  'rounded-full px-2.5 py-1 font-mono text-[0.68rem] transition-colors',
                  tab.active ? 'bg-white/[0.14] text-fg' : 'bg-white/[0.05] text-fg-faint hover:text-fg',
                )}
              >
                {tab.label}
              </Link>
            ))}
          </div>
          {enLista ? (
            <Queue items={ordenarCola(cortes)} volver={volver} zone={zona} />
          ) : (
            <WeekCalendar
              monday={monday}
              items={cortes}
              borradores={borradores.flatMap((b) =>
                b.fecha ? [{ id: b.id, href: scheduleHref(params, { borrador: b.id }), fecha: b.fecha, texto: textoDe(b.campos) }] : [],
              )}
              zone={zona}
              volver={volver}
              prevHref={scheduleHref(params, { semana: addDays(monday, -7) })}
              nextHref={scheduleHref(params, { semana: addDays(monday, 7) })}
              nuevoEnDia={(dia) => scheduleHref(params, { componer: '1', dia })}
            />
          )}
        </div>

        {/* Ayer, en mono y al pie: las miradas solo si el sync ya las trajo; un cero
            inventado diría «nadie miró» cuando lo cierto es «todavía no se sabe». */}
        {hayConectada ? (
          <p className="font-mono text-[0.72rem] text-fg-faint">{pieDeAyer(ayer.servidos, ayer.miradas)}</p>
        ) : null}
      </div>

      {panel}
    </>
  )
}

/**
 * Sin ninguna red conectada no hay nada que programar: la tarjeta que manda a conectar la
 * primera va arriba de todo. Con una cuenta conectada, no vuelve a aparecer.
 */
function PrimerDia() {
  return (
    <section className="chapa rounded-2xl p-6">
      <h2 className="font-titulo text-lg font-semibold uppercase tracking-[0.03em]">Conecta tu primera red</h2>
      <p className="mt-2 text-sm text-fg-muted">Sin una red conectada no hay nada que poner al fuego.</p>
      <Link href="/admin/accounts" className={`mt-5 ${ENLACE_BOTON}`}>
        Ir a {nombreDe('/admin/accounts')} →
      </Link>
    </section>
  )
}
