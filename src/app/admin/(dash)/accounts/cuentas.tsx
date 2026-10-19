'use client'

import { useEffect, useId, useRef, useState, useTransition } from 'react'
import { AlertTriangle, Check, ChevronDown, Copy, RefreshCw } from 'lucide-react'
import { disconnectAccount, fusionarCuenta, quitarCuentaAccion, syncSocialNow } from '@/app/admin/actions'
import { Icon } from '@/components/icon'
import { Button } from '@/components/ui'
import { PINTURA } from '@/components/charts/theme'
import { SOCIAL_NETWORKS } from '@/db/schema'
import type { CuentaRow } from '@/lib/posts-kpis'
import { CONEXION_FALLO } from '@/lib/avisos/reglas'
import { PROXIMAMENTE, REDES_PROXIMAMENTE, avisosDe, networkLabel } from '@/lib/networks'
import { estadoDelFierro, type Fierro } from '@/lib/parrilla'
import { cn } from '@/lib/utils'

const RELATIVE = new Intl.RelativeTimeFormat('es', { numeric: 'auto' })

/** Lo que dura un acuse de recibo antes de irse solo, como los «Copiado» del panel. */
const AVISO_MS = 2000

/**
 * Lo que devuelve Meta cuando un token murió es una frase en inglés con códigos adentro,
 * y aparece justo cuando algo se rompió. La pantalla dice qué hacer; el texto original
 * queda en el `title` para quien lo necesite. Es la misma frase del resumen del día y de
 * `GET /api/schedule/resumen`, para que la tarjeta y el aviso digan lo mismo.
 */
const FALLO_DE_SYNC = CONEXION_FALLO

const CLASE_FIERRO: Record<Fierro, string> = {
  'al-rojo': 'fierro-al-rojo',
  enfriandose: 'fierro-enfriandose',
  frio: 'fierro-frio',
}

/** «en 3 días», «mañana». La cuenta regresiva que antes había que sacar de la nada. */
function venceEn(iso: string): string {
  const dias = Math.round((new Date(iso).getTime() - Date.now()) / 86.4e6)
  if (dias <= 0) return 'hoy'
  return RELATIVE.format(dias, 'day')
}

function syncedAgo(iso: string | null): string {
  if (!iso) return 'nunca'
  const hours = Math.round((Date.now() - new Date(iso).getTime()) / 3.6e6)
  if (hours < 1) return 'recién'
  if (hours < 24) return RELATIVE.format(-hours, 'hour')
  return RELATIVE.format(-Math.round(hours / 24), 'day')
}

function nombreDe(row: CuentaRow): string {
  return row.handle ?? row.externalId ?? 'Sin nombre'
}

/**
 * Donde iría «Conectar →» o «Agregar cuenta →» en una red de `REDES_PROXIMAMENTE`: un texto y
 * no un enlace, porque no hay adónde ir. La conexión tampoco arranca si alguien la pide a mano.
 */
function Proximamente() {
  return <span className="ml-auto text-[0.75rem] text-fg-faint">{PROXIMAMENTE}</span>
}

/**
 * Las redes con cuentas, una debajo de otra en una sola chapa, con una fila corta por
 * cuenta; las redes sin ninguna, juntas al final en una lista de una línea cada una.
 * Conectar suma; la misma cuenta solo renueva.
 *
 * Antes cada cuenta era una tarjeta alta con todo a la vista —dos ids, botones, avisos— y
 * cada red sin cuentas ocupaba su propio bloque con «Sin cuentas.»: mucho volumen para lo que
 * se mira casi siempre, que es si cada fierro está al rojo. Ahora la fila dice eso y, si hace
 * falta, por qué no; lo demás se abre con la flecha de la fila (`Fila`).
 */
export function Cuentas({ rows, metaEnRevision }: { rows: CuentaRow[]; metaEnRevision: boolean }) {
  const [pending, startTransition] = useTransition()
  const [aviso, setAviso] = useState<{ texto: string; ok: boolean } | null>(null)

  // El «Listo.» se iba solo nunca: se quedaba hasta recargar la página. Un error sí se
  // queda, porque describe algo que todavía hay que arreglar.
  useEffect(() => {
    if (!aviso?.ok) return
    const id = setTimeout(() => setAviso(null), AVISO_MS)
    return () => clearTimeout(id)
  }, [aviso])

  function sync() {
    startTransition(async () => {
      const result = await syncSocialNow()
      setAviso(result.error ? { texto: result.error, ok: false } : { texto: 'Listo.', ok: true })
    })
  }

  const conCuentas = SOCIAL_NETWORKS.filter((network) => rows.some((r) => r.network === network))
  const sinCuentas = SOCIAL_NETWORKS.filter((network) => !rows.some((r) => r.network === network))

  return (
    <section className="max-w-3xl space-y-4">
      {conCuentas.length > 0 ? (
        <div className="chapa divide-y divide-acero-700 rounded-xl">
          {conCuentas.map((network) => {
            const cuentas = rows.filter((r) => r.network === network)
            const avisos = avisosDe(network, metaEnRevision)
            // El enlace describe sus avisos: quien llega tabulando a «Agregar cuenta →» los
            // oye antes de pulsar, aunque en el DOM vayan después.
            const idsDeAvisos = avisos.map((_, i) => `aviso-${network}-${i}`)
            return (
              <div key={network} className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <Icon name={network} className="h-4 w-4 shrink-0" />
                  <h2 className="font-titulo text-sm font-semibold uppercase tracking-[0.03em]">{networkLabel(network)}</h2>
                  {REDES_PROXIMAMENTE.has(network) ? (
                    <Proximamente />
                  ) : (
                    <a
                      href={`/api/social/${network}/connect`}
                      aria-describedby={idsDeAvisos.length > 0 ? idsDeAvisos.join(' ') : undefined}
                      className="ml-auto text-[0.75rem] text-fg-muted transition-colors hover:text-fg"
                    >
                      Agregar cuenta →
                    </a>
                  )}
                </div>
                {/* Los avisos sirven antes de conectar: con la red ya conectada, a un clic. */}
                {avisos.length > 0 ? (
                  <details className="mt-1 text-[0.72rem] text-fg-faint">
                    <summary className="w-fit cursor-pointer list-none hover:text-fg-muted [&::-webkit-details-marker]:hidden">
                      Requisitos para agregar otra
                    </summary>
                    {avisos.map((aviso, i) => (
                      <p key={aviso} id={idsDeAvisos[i]} className="mt-1">
                        {aviso}
                      </p>
                    ))}
                  </details>
                ) : null}
                <ul className="mt-2 space-y-1">
                  {cuentas.map((row) => (
                    <Fila key={row.id} row={row} network={network} vivas={cuentas.filter((c) => c.connected && c.id !== row.id)} />
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      ) : null}

      {sinCuentas.length > 0 ? (
        <div className="chapa rounded-xl px-4 py-3">
          <h2 className="font-titulo text-[0.72rem] font-semibold uppercase tracking-[0.06em] text-fg-muted">Sin conectar</h2>
          <ul className="mt-2 space-y-2">
            {sinCuentas.map((network) => {
              const avisos = avisosDe(network, metaEnRevision)
              const idsDeAvisos = avisos.map((_, i) => `aviso-${network}-${i}`)
              return (
                <li key={network}>
                  <div className="flex items-center gap-2">
                    <Icon name={network} className="h-4 w-4 shrink-0 text-fg-muted" />
                    {REDES_PROXIMAMENTE.has(network) ? (
                      <>
                        <span className="text-sm text-fg-muted">{networkLabel(network)}</span>
                        <Proximamente />
                      </>
                    ) : (
                      <>
                        <span className="text-sm">{networkLabel(network)}</span>
                        <a
                          href={`/api/social/${network}/connect`}
                          aria-describedby={idsDeAvisos.length > 0 ? idsDeAvisos.join(' ') : undefined}
                          className="ml-auto text-[0.75rem] text-fg-muted transition-colors hover:text-fg"
                        >
                          Conectar →
                        </a>
                      </>
                    )}
                  </div>
                  {avisos.map((aviso, i) => (
                    <p key={aviso} id={idsDeAvisos[i]} className="mt-0.5 pl-6 text-[0.72rem] text-fg-faint">
                      {aviso}
                    </p>
                  ))}
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={sync}
          disabled={pending}
          className="chapa flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs text-fg-muted transition-colors hover:text-fg disabled:opacity-50"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', pending && 'animate-spin')} aria-hidden />
          Sincronizar ahora
        </button>
        {/* La región vive siempre, y el aviso entra y sale de ella: montarla con el texto
            adentro es un cambio que el lector de pantalla no siempre alcanza a ver. */}
        <span role="status" className="text-[0.78rem] text-fg-faint">
          {aviso ? aviso.texto : null}
        </span>
      </div>
    </section>
  )
}

/**
 * Una cuenta, en una fila: el fierro en chico, el nombre, una línea que dice cómo está y
 * «Reconectar». Lo que se usa poco —los dos ids, «Desconectar», «Quitar», fusionar— se abre
 * con la flecha de la derecha. Lo que pide una acción —el fierro que se enfría, la conexión
 * que falló— no se esconde: va en la línea de estado.
 *
 * Cada fila lleva su propio pendiente: desconectar una cuenta no tiene por qué apagar los
 * botones de las otras siete.
 *
 * `vivas` son las otras cuentas conectadas de la misma red: con ellas una fila sin
 * credencial ofrece fusionarse. Es el caso de la identidad que dio otra app —TikTok, Meta
 * y compañía dan un id distinto por app—: al pasar del sandbox a la app real la misma
 * cuenta vuelve como fila nueva, y esta queda muerta con su historial colgando.
 */
function Fila({ row, network, vivas }: { row: CuentaRow; network: string; vivas: CuentaRow[] }) {
  const [pending, startTransition] = useTransition()
  const [abierta, setAbierta] = useState(false)
  const detalle = useId()
  const [desconectada, setDesconectada] = useState(false)
  const [idCopiado, setIdCopiado] = useState(false)
  const [destino, setDestino] = useState(vivas[0]?.id ?? '')
  const [fusion, setFusion] = useState<{ texto: string; ok: boolean } | null>(null)
  const nombre = nombreDe(row)

  useEffect(() => {
    if (!desconectada) return
    const id = setTimeout(() => setDesconectada(false), AVISO_MS)
    return () => clearTimeout(id)
  }, [desconectada])

  useEffect(() => {
    if (!idCopiado) return
    const id = setTimeout(() => setIdCopiado(false), AVISO_MS)
    return () => clearTimeout(id)
  }, [idCopiado])

  // El id de esta cuenta: lo que `cuentas` de la carga masiva y de la API espera
  // cuando nombrar la red ya no alcanza porque hay dos conectadas de la misma. Con dos
  // cuentas de una red, es la única forma pública de conseguirlo para una recién
  // conectada — `GET /api/schedule/posts` solo trae ids de cuentas que ya tienen un
  // destino programado.
  function copiarId() {
    const clipboard = navigator.clipboard
    if (!clipboard) return
    clipboard
      .writeText(row.id)
      .then(() => setIdCopiado(true))
      .catch(() => {})
  }

  function desconectar() {
    const seguir = window.confirm(
      `Se desconecta «${nombre}» de ${networkLabel(network)}. Sus posts y métricas ya bajados se quedan, pero no se sincroniza nada más hasta que la vuelvas a conectar. ¿Seguir?`,
    )
    if (!seguir) return
    startTransition(async () => {
      await disconnectAccount(row.id)
      setDesconectada(true)
    })
  }

  function fusionar() {
    const viva = vivas.find((v) => v.id === destino)
    if (!viva) return
    const seguir = window.confirm(
      `«${nombre}» se fusiona en «${nombreDe(viva)}»: sus posts, sus métricas y su historial de publicaciones pasan a esa cuenta, y esta desaparece de la lista. No se puede deshacer. ¿Seguir?`,
    )
    if (!seguir) return
    startTransition(async () => {
      const resultado = await fusionarCuenta(row.id, viva.id)
      setFusion('error' in resultado ? { texto: resultado.error, ok: false } : { texto: `Fusionada en «${nombreDe(viva)}».`, ok: true })
    })
  }

  const fierro = estadoDelFierro(
    { connected: row.connected, expiraEn: row.expiresAt, ultimoError: row.lastSyncError, red: network },
    new Date(),
  )

  // La línea de estado: lo que pide una acción primero, y si no, cuándo se sincronizó.
  const estado = row.lastSyncError ? (
    <span className="text-negative" title={row.lastSyncError}>
      {FALLO_DE_SYNC}
    </span>
  ) : fierro === 'enfriandose' && row.expiresAt ? (
    <span className="text-caution">
      Este fierro se está enfriando: la conexión vence {venceEn(row.expiresAt)}. Reconéctala antes de que se apague.
    </span>
  ) : (
    <span className="font-mono text-fg-faint">
      {/* Una fila puede sincronizar sin credencial OAuth (YouTube lee con su API key): no
          debe decir lo contrario, así que las dos cosas van juntas. */}
      {!row.connected ? 'Sin credencial · ' : ''}
      {row.lastSyncedAt ? `Sincronizado ${syncedAgo(row.lastSyncedAt)}` : 'Sin sincronizar'}
    </span>
  )

  return (
    <li className="rounded-lg transition-colors hover:bg-velo/[0.03]">
      <div className="flex items-center gap-3 px-1 py-1.5">
        {/*
          El fierro, en chico y a la izquierda de todo. Dice la temperatura de la conexión
          antes de que la leas: al rojo irradia, frío no. La línea de estado la explica en
          palabras, porque el color nunca es la única señal.
        */}
        <span className={cn('fierro w-6 shrink-0', CLASE_FIERRO[fierro])} aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-sm">
            <span className="truncate">{nombre}</span>
            {row.lastSyncError ? (
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" style={{ color: PINTURA.baja }} aria-hidden />
            ) : row.connected ? (
              <Check className="h-3.5 w-3.5 shrink-0" style={{ color: PINTURA.sube }} aria-hidden />
            ) : null}
          </p>
          <p className="text-[0.72rem] leading-snug">{estado}</p>
        </div>
        {/* En una red en «Próximamente» el bloque ya lo dice arriba; la fila se queda con su
            detalle, para poder desconectarla o quitarla. */}
        {REDES_PROXIMAMENTE.has(network) ? null : (
          <a
            href={`/api/social/${network}/connect`}
            className="shrink-0 text-[0.75rem] text-fg-muted transition-colors hover:text-fg"
          >
            {row.connected ? 'Reconectar' : 'Conectar →'}
          </a>
        )}
        <button
          type="button"
          onClick={() => setAbierta(!abierta)}
          aria-expanded={abierta}
          aria-controls={detalle}
          className="shrink-0 rounded p-1 text-fg-faint transition-colors hover:bg-velo/[0.06] hover:text-fg"
        >
          <ChevronDown className={cn('h-4 w-4 transition-transform', abierta && 'rotate-180')} aria-hidden />
          <span className="sr-only">Más de {nombre}</span>
        </button>
      </div>

      <div role="status" className="pl-10">
        {desconectada ? <p className="pb-1 text-[0.72rem] text-fg-muted">Desconectada.</p> : null}
        {fusion ? (
          <p className={cn('pb-1 text-[0.72rem]', fusion.ok ? 'text-fg-muted' : 'text-caution')}>{fusion.texto}</p>
        ) : null}
      </div>

      <div id={detalle} hidden={!abierta} className="space-y-1.5 pb-2.5 pl-10 pr-1">
        {row.externalId ? (
          <p className="truncate font-mono text-[0.68rem] text-fg-faint">
            <span className="whitespace-nowrap text-fg-muted">En la red: </span>
            {row.externalId}
          </p>
        ) : null}
        {/*
          El id de la cuenta en Tu Parrilla: el que la carga masiva y la API esperan en
          `cuentas` cuando nombrar la red ya no alcanza. Es distinto del de arriba, el que le
          da la red.
        */}
        <button
          type="button"
          onClick={copiarId}
          title="Id de cuenta — para «cuentas» en el CSV o la API"
          className="flex max-w-full items-center gap-1 font-mono text-[0.68rem] text-fg-faint transition-colors hover:text-fg-muted"
        >
          <span className="shrink-0 whitespace-nowrap text-fg-muted">En Tu Parrilla: </span>
          <span className="truncate">{row.id}</span>
          {idCopiado ? (
            <Check className="h-3 w-3 shrink-0" style={{ color: PINTURA.sube }} aria-hidden />
          ) : (
            <Copy className="h-3 w-3 shrink-0" aria-hidden />
          )}
          <span className="sr-only">Copiar id de cuenta</span>
        </button>
        {/*
          Sin credencial y con otra cuenta viva de esta red: casi siempre es la misma persona
          con el id que le dio otra app (al salir del sandbox, por ejemplo). Fusionar es lo que
          conserva sus números en vez de empezar de cero; se ofrece solo aquí, donde ya no hay
          nada que reconectar.
        */}
        {!row.connected && !fusion?.ok && vivas.length > 0 ? (
          <div className="space-y-1.5 pt-1">
            <p className="text-[0.72rem] text-fg-muted">
              ¿Es la misma cuenta con otro identificador? Fusiónala y su historial pasa a la viva.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={destino}
                onChange={(e) => setDestino(e.target.value)}
                disabled={pending}
                aria-label="Cuenta en la que se fusiona"
                className="chapa rounded-lg bg-transparent px-2 py-1 text-[0.75rem] text-fg"
              >
                {vivas.map((v) => (
                  <option key={v.id} value={v.id}>
                    {nombreDe(v)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={fusionar}
                disabled={pending}
                className="text-[0.75rem] text-fg-muted transition-colors hover:text-fg disabled:opacity-50"
              >
                {pending ? 'Fusionando…' : 'Es la misma cuenta →'}
              </button>
            </div>
          </div>
        ) : null}
        <div className="flex items-center gap-3 pt-1">
          {row.connected ? (
            <button
              type="button"
              onClick={desconectar}
              disabled={pending}
              className="text-[0.75rem] text-fg-faint transition-colors hover:text-fg disabled:opacity-50"
            >
              {pending ? 'Desconectando…' : 'Desconectar'}
            </button>
          ) : (
            <Quitar id={row.id} nombre={nombre} red={networkLabel(network)} />
          )}
        </div>
      </div>
    </li>
  )
}

/**
 * «Quitar», solo en una cuenta desconectada: saca la cuenta de Tu Parrilla con todo lo que
 * se bajó de ella, y la deja libre para que otro usuario la conecte. No tiene vuelta, así que
 * pregunta en una ventana que dice qué se borra —el mismo `<dialog>` modal de «Reprogramar»
 * (`schedule/reprogramar.tsx`), por las mismas razones: Esc lo cierra, el foco no se escapa y
 * el velo se traga los clics—.
 */
function Quitar({ id, nombre, red }: { id: string; nombre: string; red: string }) {
  const ventana = useRef<HTMLDialogElement>(null)
  const titulo = useId()
  const [error, setError] = useState<string | null>(null)
  const [quitando, startQuitar] = useTransition()

  function quitar() {
    startQuitar(async () => {
      setError(null)
      // Si sale bien, la acción redirige a Los Fierros con el aviso y no vuelve.
      const resultado = await quitarCuentaAccion(id)
      if (resultado?.error) setError(resultado.error)
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null)
          ventana.current?.showModal()
        }}
        className="text-[0.75rem] text-fg-faint transition-colors hover:text-negative"
      >
        Quitar
      </button>
      <dialog
        ref={ventana}
        aria-labelledby={titulo}
        onClick={(event) => {
          if (event.target === event.currentTarget && !quitando) ventana.current?.close()
        }}
        className="m-auto w-[24rem] max-w-[calc(100vw-2rem)] rounded-xl border border-velo/10 bg-acero-900/95 text-fg shadow-xl backdrop-blur backdrop:bg-acero-950/80"
      >
        <div className="space-y-3 p-4">
          <p id={titulo} className="font-titulo text-sm font-semibold uppercase tracking-[0.03em]">
            ¿Quitar «{nombre}» de Tu Parrilla?
          </p>
          <p className="text-sm text-fg-muted">
            Se borran la cuenta, sus publicaciones y números ya bajados, sus comentarios y su historial en La
            Parrilla. No se puede deshacer. En {red} no se borra nada.
          </p>
          <p className="text-sm text-fg-muted">
            La cuenta queda libre: tú u otro usuario de Tu Parrilla la pueden volver a conectar, desde cero.
          </p>
          {error ? (
            <p role="alert" className="text-sm text-negative">
              {error}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="danger" disabled={quitando} onClick={quitar}>
              {quitando ? 'Quitando…' : 'Quitar para siempre'}
            </Button>
            <Button type="button" disabled={quitando} onClick={() => ventana.current?.close()}>
              Cancelar
            </Button>
          </div>
        </div>
      </dialog>
    </>
  )
}
