import Link from 'next/link'
import { Plus } from 'lucide-react'
import { ENLACE_BOTON, ENLACE_BOTON_SECUNDARIO } from '@/components/boton'
import { Corte } from '@/components/corte'
import { DeNocheYDeDia, NombreDe } from '@/components/de-noche-y-de-dia'
import { Encabezado } from '@/components/ui'
import { requireUser } from '@/lib/auth'
import { fechaParaDia, idDeBorrador, primero, textoDe } from '@/lib/borrador'
import { cargarBorrador, listarBorradores } from '@/lib/borradores'
import { pieDeAyer, quemados } from '@/lib/fuego'
import { networkLabel } from '@/lib/networks'
import { cuentasFrias } from '@/lib/parrilla'
import { getCuentas } from '@/lib/posts'
import {
  addDays,
  contarPorDia,
  dayKey,
  dayLabelConMes,
  diaYHora,
  hourLabel,
  mondayOfKey,
  normalizeWeekParam,
  ventanaParaDibujar,
  weekDays,
} from '@/lib/schedule-week'
import { cortesEntre, cortesQuemados, horasPorVenir, servidosAyer, todosLosCortes } from '@/lib/social/publish/cortes'
import { cn, toZonedInput } from '@/lib/utils'
import { BatchUpload } from './batch-upload'
import { WeekCalendar } from './calendar'
import { Composer } from './composer'
import { columnasDelDia, normalizarFecha } from './dia'
import { dibujoDe } from './dibujo'
import { scheduleHref } from './enlace'
import { borradoresDelFiltro, conAlguno, filtroDeLaUrl, hayQueFiltrar, opcionesDelFiltro, recortar } from './filtro-red'
import { FiltroDeRedes } from './filtro-redes'
import { ListaBorradores } from './lista-borradores'
import { ordenarCola } from './orden'
import { Queue } from './queue'
import { SeQuemo } from './se-quemo'
import { SemanaPorHora } from './semana-por-hora'
import { VistaDia } from './vista-dia'

export const dynamic = 'force-dynamic'

/**
 * La Parrilla, que es también la entrada del panel (`/admin` lleva acá).
 *
 * De arriba abajo: lo que se quemó —lo único que pide una acción sin que nadie la busque—,
 * el calendario de la semana (o la misma semana por hora, un día por cuenta o la lista, a un
 * clic) y, al pie, cuánto
 * salió ayer. Componer,
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
  // El calendario es la vista con que abre; la semana por hora, el día y la lista, a un clic.
  // `vista=calendario`, de los enlaces de antes, sigue cayendo en el calendario.
  const pedida = texto('vista')
  const vista = pedida === 'lista' ? 'lista' : pedida === 'dia' ? 'dia' : pedida === 'hora' ? 'hora' : 'semana'

  // La parrilla entera —qué semana es «esta», en qué casilla cae cada corte, qué hora dice
  // la lista— se dibuja en la zona del dueño.
  const { id: ownerId, zona } = await requireUser()
  const now = new Date()
  const monday = normalizeWeekParam(texto('semana') || undefined, now, zona)
  const hoy = dayKey(now, zona)
  // El día de la vista «Día». Sin `fecha`, hoy si cae en la semana que se estaba mirando, y
  // si no, el lunes de esa semana: cambiar de vista no te saca de donde estabas.
  const fecha = normalizarFecha(
    texto('fecha') || (weekDays(monday).includes(hoy) ? hoy : monday),
    now,
    zona,
  )

  // En serie y no en paralelo: más consultas a la vez que conexiones en el pool se colgaron
  // una vez contra el pooler de Supabase (ver `docs/pendientes.md`), y estas son rápidas.
  const cuentas = await getCuentas(ownerId)
  // Posts, destinos con handle y media, de lo que la vista dibuja: la semana (en filas o por
  // hora) o el día, con un día de margen a cada lado (`ventanaParaDibujar`); la lista, todo.
  // Vienen por hora ascendente, como el calendario los necesita; la lista los reordena aparte.
  // Antes cada vista cargaba el historial entero para dibujar siete días.
  const ventana =
    vista === 'lista' ? null : vista === 'dia' ? ventanaParaDibujar(fecha, 1, zona) : ventanaParaDibujar(monday, 7, zona)
  const cortes = ventana ? await cortesEntre(ownerId, ventana.desde, ventana.hasta) : await todosLosCortes(ownerId)
  // «Se quemó» y el aviso del compositor no siguen a la vista: lo quemado de cuando sea, y la
  // hora de lo que viene.
  const conQuemados = await cortesQuemados(ownerId)
  const porVenir = await horasPorVenir(ownerId, now)
  const ayer = await servidosAyer(ownerId, now, zona)
  const borradores = await listarBorradores(ownerId)

  const hayConectada = cuentas.some((c) => c.connected)
  // El filtro por red (`?red=`): una red, o una sola cuenta de una red. Lo obedecen la semana,
  // el día y la lista; «Se quemó», el pie de ayer y el aviso del compositor —que cuenta todo lo
  // que ya hay ese día— miran todo igual.
  const filtro = filtroDeLaUrl(texto('red'), cuentas)
  const nombreDelFiltro = filtro
    ? (cuentas.find((c) => c.id === filtro.cuenta)?.handle ?? networkLabel(filtro.red))
    : null
  // Los botones del filtro cuentan lo que se mira: la semana (en filas o por hora), el día o la
  // lista entera.
  const semanaALaVista = new Set(weekDays(monday))
  const enVista = cortes.filter(({ post }) => {
    if (vista === 'lista') return true
    const dia = dayKey(post.scheduledAt, zona)
    return vista === 'dia' ? dia === fecha : semanaALaVista.has(dia)
  })
  const opciones = opcionesDelFiltro(enVista, cuentas)
  // Los borradores con fecha, en su día: con un filtro, solo los que tienen marcada una cuenta
  // de esa red (o esa cuenta).
  const borradoresConFecha = borradoresDelFiltro(
    borradores.flatMap((b) =>
      b.fecha
        ? [
            {
              id: b.id,
              href: scheduleHref(params, { borrador: b.id }),
              fecha: b.fecha,
              texto: textoDe(b.campos),
              cuentas: b.campos.cuentas ?? [],
            },
          ]
        : [],
    ),
    filtro,
    cuentas,
  )
  // Las cuentas con el fierro frío: lo que se programó ahí lleva la marca fría en su corte.
  const frias = cuentasFrias(cuentas, now)
  // `volver` lleva al editor de vuelta a esta misma vista y semana; los parámetros de un solo
  // uso (el panel abierto, el aviso de «programado») no viajan.
  const volver = scheduleHref(params, {})
  // El post que se acaba de programar desde el compositor: se enciende una vez en su día.
  const recien = texto('nuevo') || null

  // Lo que el compositor usa para decir cómo está el día que elegiste: los mismos cortes que
  // dibuja el calendario (los que tienen algún destino), de ahora en adelante, porque no se
  // puede programar en el pasado.
  const carga = contarPorDia(porVenir, zona)

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
          key={borrador?.id ?? `nuevo-${texto('dia')}-${texto('cuenta')}`}
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
          cuentaInicial={borrador ? '' : texto('cuenta')}
          listoHref={scheduleHref(params, { hecho: 'programado' })}
          cerrarHref={cerrarHref}
          zona={zona}
          desde={now.getTime()}
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

        <SeQuemo filas={quemados(conQuemados)} now={now} zone={zona} volver={volver} frias={frias} />

        <div>
          <div className="mb-3 flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
            <div className="flex items-center gap-1.5">
              {[
                {
                  label: 'Calendario',
                  // Desde un día, a la semana que lo contiene.
                  href: scheduleHref(params, { vista: null, fecha: null, semana: vista === 'dia' ? mondayOfKey(fecha) : texto('semana') || null }),
                  active: vista === 'semana',
                },
                {
                  label: 'Por hora',
                  href: scheduleHref(params, { vista: 'hora', fecha: null, semana: vista === 'dia' ? mondayOfKey(fecha) : texto('semana') || null }),
                  active: vista === 'hora',
                },
                { label: 'Día', href: scheduleHref(params, { vista: 'dia', fecha, semana: null }), active: vista === 'dia' },
                { label: 'Lista', href: scheduleHref(params, { vista: 'lista', semana: null, fecha: null }), active: vista === 'lista' },
              ].map((tab) => (
                <Link
                  key={tab.label}
                  href={tab.href}
                  className={cn(
                    'rounded-full px-2.5 py-1 font-mono text-[0.68rem] transition-colors',
                    tab.active ? 'bg-velo/[0.14] text-fg' : 'bg-velo/[0.05] text-fg-faint hover:text-fg',
                  )}
                >
                  {tab.label}
                </Link>
              ))}
            </div>
            {hayQueFiltrar(opciones.redes) ? (
              <FiltroDeRedes
                todas={opciones.todas}
                redes={opciones.redes}
                filtro={filtro}
                hrefDe={(valor) => scheduleHref(params, { red: valor })}
              />
            ) : null}
          </div>
          {vista === 'lista' ? (
            <Queue
              items={conAlguno(ordenarCola(cortes), filtro).map((c) => ({
                ...c,
                corte: <Corte {...dibujoDe(c.targets, c.media, frias, c.post.videosLiberados)} chico className="w-full" />,
                cuando: diaYHora(c.post.scheduledAt, zona),
              }))}
              volver={volver}
              recien={recien}
              vacio={nombreDelFiltro ? `Nada programado en ${nombreDelFiltro}.` : undefined}
            />
          ) : vista === 'dia' ? (
            <VistaDia
              dia={fecha}
              hoy={hoy}
              columnas={columnasDelDia({
                dia: fecha,
                // Con un filtro, solo las columnas de esa red (o de esa cuenta).
                cuentas: filtro
                  ? cuentas.filter((c) => (filtro.cuenta ? c.id === filtro.cuenta : c.network === filtro.red))
                  : cuentas,
                items: recortar(cortes, filtro),
                borradores: borradoresConFecha,
                zone: zona,
              })}
              sinColumnas={
                filtro?.cuenta
                  ? `${nombreDelFiltro} no está conectada, y ese día no tiene nada.`
                  : nombreDelFiltro
                    ? `No tienes ninguna cuenta de ${nombreDelFiltro} conectada, y ese día no hay nada ahí.`
                    : undefined
              }
              zone={zona}
              volver={volver}
              prevHref={scheduleHref(params, { fecha: addDays(fecha, -1) })}
              nextHref={scheduleHref(params, { fecha: addDays(fecha, 1) })}
              hoyHref={scheduleHref(params, { fecha: hoy })}
              nuevoEnDia={(dia, cuenta) => scheduleHref(params, { componer: '1', dia, cuenta })}
              frias={frias}
              recien={recien}
              ahora={now}
            />
          ) : vista === 'hora' ? (
            <SemanaPorHora
              monday={monday}
              items={recortar(cortes, filtro)}
              borradores={borradoresConFecha}
              zone={zona}
              volver={volver}
              prevHref={scheduleHref(params, { semana: addDays(monday, -7) })}
              nextHref={scheduleHref(params, { semana: addDays(monday, 7) })}
              nuevoEnDia={(dia) => scheduleHref(params, { componer: '1', dia })}
              verDia={(dia) => scheduleHref(params, { vista: 'dia', fecha: dia, semana: null })}
              frias={frias}
              recien={recien}
              ahora={now}
            />
          ) : (
            <WeekCalendar
              monday={monday}
              items={recortar(cortes, filtro)}
              borradores={borradoresConFecha}
              zone={zona}
              volver={volver}
              prevHref={scheduleHref(params, { semana: addDays(monday, -7) })}
              nextHref={scheduleHref(params, { semana: addDays(monday, 7) })}
              nuevoEnDia={(dia) => scheduleHref(params, { componer: '1', dia })}
              verDia={(dia) => scheduleHref(params, { vista: 'dia', fecha: dia, semana: null })}
              frias={frias}
              recien={recien}
              ahora={now}
            />
          )}
        </div>

        {/* Ayer, en mono y al pie: las miradas solo si el sync ya las trajo; un cero
            inventado diría «nadie miró» cuando lo cierto es «todavía no se sabe». */}
        {hayConectada ? (
          <p className="font-mono text-[0.72rem] text-fg-faint">
            <DeNocheYDeDia
              noche={pieDeAyer(ayer.servidos, ayer.miradas, 'noche')}
              dia={pieDeAyer(ayer.servidos, ayer.miradas, 'dia')}
            />
          </p>
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
      <p className="mt-2 text-sm text-fg-muted">
        <DeNocheYDeDia
          noche="Sin una red conectada no hay nada que poner al fuego."
          dia="Sin una red conectada no hay nada que servir."
        />
      </p>
      <Link href="/admin/accounts" className={`mt-5 ${ENLACE_BOTON}`}>
        Ir a <NombreDe ruta="/admin/accounts" /> →
      </Link>
    </section>
  )
}
