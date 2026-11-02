'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { PackageOpen } from 'lucide-react'
import { Corte } from '@/components/corte'
import { DeNocheYDeDia } from '@/components/de-noche-y-de-dia'
import { Button } from '@/components/ui-boton'
import { Ventana } from '@/components/ventana'
import type { Carne } from '@/lib/parrilla'
import { cn } from '@/lib/utils'
import { ENVOLVIENDO, PARA_LLEVAR } from '@/lib/vocabulario'

/** Lo que devuelve `/api/admin/planilla/adelanto`. */
type Adelanto = { archivo: string; noCaben: Array<{ hoja: string; total: number; tope: number; cuales: string }> }

type Estado =
  | { paso: 'mirando'; adelanto: Adelanto | null }
  | { paso: 'armando'; desde: number; bytes: number }
  | { paso: 'listo'; archivo: string }
  | { paso: 'fallo' }

export const NO_SE_PUDO =
  'No se pudo armar la planilla. Prueba de nuevo; si el período es muy largo, prueba con uno más corto.'

const MIL = new Intl.NumberFormat('es-CL')

/** Los filtros de la pantalla que viajan a la planilla; `mas` y el resto, no. */
const CLAVES = ['range', 'desde', 'hasta', 'cuenta', 'profile', 'bots'] as const

function megas(bytes: number): string {
  return `${(bytes / 1_048_576).toLocaleString('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} MB`
}

/** El corte se va cocinando mientras se arma: crudo, sellado, a punto. */
function carneA(segundos: number): Carne {
  if (segundos < 1.2) return 'cruda'
  if (segundos < 2.6) return 'sellada'
  return 'punto'
}

/**
 * «Llevar para la casa» (de día, «Para llevar»): baja todo lo de Los Números a una planilla de
 * Excel. El botón vive al lado del título; abre una ventana que dice qué va, con los filtros de la
 * pantalla, y avisa antes si alguna hoja no cabe entera en el período. Mientras se arma, el corte
 * se cocina en la parrilla (de día, la pieza bajo el soplete) y se cuenta lo que ya llegó.
 *
 * `periodo` y `filtros` vienen del servidor, ya escritos: es quien sabe qué entendió de la URL.
 */
export function ParaLlevar({ periodo, filtros }: { periodo: string; filtros: string[] }) {
  const ventana = useRef<HTMLDialogElement>(null)
  const params = useSearchParams()
  const titulo = useId()
  const [estado, setEstado] = useState<Estado>({ paso: 'mirando', adelanto: null })
  const [ahora, setAhora] = useState(0)
  const pedido = useRef<AbortController | null>(null)

  const consulta = new URLSearchParams()
  for (const clave of CLAVES) for (const valor of params.getAll(clave)) consulta.append(clave, valor)
  const query = consulta.toString()

  // El reloj de la animación: solo corre mientras se arma.
  useEffect(() => {
    if (estado.paso !== 'armando') return
    const reloj = setInterval(() => setAhora(Date.now()), 200)
    return () => clearInterval(reloj)
  }, [estado.paso])

  async function abrir() {
    setEstado({ paso: 'mirando', adelanto: null })
    ventana.current?.showModal()
    try {
      const respuesta = await fetch(`/api/admin/planilla/adelanto?${query}`, { cache: 'no-store' })
      if (!respuesta.ok) return
      const adelanto = (await respuesta.json()) as Adelanto
      setEstado((e) => (e.paso === 'mirando' ? { paso: 'mirando', adelanto } : e))
    } catch {
      // Sin adelanto se puede armar igual: la hoja «Léeme» dirá lo que quede fuera.
    }
  }

  async function armar() {
    const control = new AbortController()
    pedido.current = control
    const desde = Date.now()
    setAhora(desde)
    setEstado({ paso: 'armando', desde, bytes: 0 })
    try {
      const respuesta = await fetch(`/api/admin/planilla?${query}`, { cache: 'no-store', signal: control.signal })
      if (!respuesta.ok || !respuesta.body) throw new Error(`HTTP ${respuesta.status}`)
      const archivo = /filename="([^"]+)"/.exec(respuesta.headers.get('Content-Disposition') ?? '')?.[1] ?? 'tu-parrilla-numeros.xlsx'
      const lector = respuesta.body.getReader()
      const trozos: BlobPart[] = []
      let bytes = 0
      for (;;) {
        const { value, done } = await lector.read()
        if (done) break
        trozos.push(value as Uint8Array<ArrayBuffer>)
        bytes += value.length
        setEstado({ paso: 'armando', desde, bytes })
      }
      const enlace = document.createElement('a')
      enlace.href = URL.createObjectURL(new Blob(trozos, { type: respuesta.headers.get('Content-Type') ?? undefined }))
      enlace.download = archivo
      document.body.appendChild(enlace)
      enlace.click()
      enlace.remove()
      setTimeout(() => URL.revokeObjectURL(enlace.href), 60_000)
      setEstado({ paso: 'listo', archivo })
    } catch {
      if (control.signal.aborted) return
      setEstado({ paso: 'fallo' })
    } finally {
      if (pedido.current === control) pedido.current = null
    }
  }

  function cerrar() {
    pedido.current?.abort()
    pedido.current = null
    ventana.current?.close()
  }

  const adelanto = estado.paso === 'mirando' ? estado.adelanto : null
  const segundos = estado.paso === 'armando' ? Math.max(0, (ahora - estado.desde) / 1000) : 0

  return (
    <>
      <button
        type="button"
        onClick={abrir}
        className="inline-flex items-center gap-1.5 rounded-lg border border-acero-700 px-3 py-1.5 text-[0.8rem] text-fg-muted transition-colors hover:border-brasa/60 hover:bg-acero-800 hover:text-fg"
      >
        <PackageOpen className="h-3.5 w-3.5" aria-hidden />
        <DeNocheYDeDia noche={PARA_LLEVAR.noche} dia={PARA_LLEVAR.dia} />
      </button>

      <Ventana
        ref={ventana}
        aria-labelledby={titulo}
        // Cerrar con Esc o con el velo también corta lo que se estaba armando.
        onClose={() => {
          pedido.current?.abort()
          pedido.current = null
          // Y el reloj de la animación se detiene: cerrada, la ventana no está armando nada.
          setEstado({ paso: 'mirando', adelanto: null })
        }}
        // Un clic afuera mientras se arma no tira lo que ya se cocinó: para eso está «Cancelar».
        alVelo={() => {
          if (estado.paso !== 'armando') cerrar()
        }}
        className="ventana-candente w-[30rem] border-t-2 border-t-brasa"
      >
        <div className="space-y-3 p-4">
          <p id={titulo} className="font-titulo text-sm font-semibold uppercase tracking-[0.03em]">
            <DeNocheYDeDia noche={PARA_LLEVAR.noche} dia={PARA_LLEVAR.dia} />
          </p>

          {estado.paso === 'mirando' ? (
            <>
              <p className="text-sm text-fg-muted">
                Una planilla de Excel con todo lo de Los Números de <span className="text-fg">{periodo}</span>: tus
                publicaciones con sus números y atributos, los seguidores de cada cuenta día a día, las visitas y los
                clicks de tus páginas con su etiqueta <span className="whitespace-nowrap">?s=</span> y sus UTM, lo programado, lo publicado y lo quemado, y los
                comentarios de La Mesa. Una hoja por tema, y una primera, «Léeme», que explica cada columna.
              </p>
              {filtros.length > 0 ? (
                <p className="text-[0.78rem] text-fg-muted">Con los filtros de la pantalla: {filtros.join('; ')}.</p>
              ) : null}
              {adelanto === null ? (
                <p className="text-[0.78rem] text-fg-faint" aria-live="polite">
                  Midiendo cuánto hay…
                </p>
              ) : adelanto.noCaben.length > 0 ? (
                <div className="rounded-lg border border-caution/40 bg-caution/10 p-2.5 text-[0.78rem]" aria-live="polite">
                  <p className="font-medium text-fg">Este período no cabe entero.</p>
                  <ul className="mt-1 space-y-0.5 text-fg-muted">
                    {adelanto.noCaben.map((h) => (
                      <li key={h.hoja}>
                        {h.hoja}: lleva {h.cuales}, {MIL.format(h.tope)} de {MIL.format(h.total)}.
                      </li>
                    ))}
                  </ul>
                  <p className="mt-1 text-fg-muted">Para tenerlo todo, elige un período más corto.</p>
                </div>
              ) : null}
              <p className="text-[0.72rem] text-fg-faint">
                De YouTube va solo lo que entrega YouTube, de los últimos 30 días: sus reglas no dejan calcular nada
                con sus datos.
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button type="button" variant="primary" onClick={armar}>
                  Armar la planilla
                </Button>
                <Button type="button" onClick={cerrar}>
                  Cancelar
                </Button>
              </div>
            </>
          ) : null}

          {estado.paso === 'armando' ? (
            <div className="flex items-center gap-4" aria-live="polite">
              <div className={cn('grilla grilla-prendida w-28 shrink-0 rounded-lg px-2 pb-2 pt-6', 'tibio')}>
                <Corte
                  formato="bife"
                  carne={carneA(segundos)}
                  coccion={carneA(segundos)}
                  sellos={['saliendo', 'saliendo']}
                  idDeLlenado="tp-llenado-para-llevar"
                />
              </div>
              <div className="min-w-0 space-y-1">
                <p className="text-sm text-fg">
                  <DeNocheYDeDia noche={ENVOLVIENDO.noche} dia={ENVOLVIENDO.dia} />
                </p>
                <p className="font-mono text-[0.72rem] text-fg-faint">
                  {estado.bytes > 0 ? `Llevamos ${megas(estado.bytes)}` : 'Leyendo tus números'} · {Math.floor(segundos)} s
                </p>
                <Button type="button" onClick={cerrar} className="mt-1">
                  Cancelar
                </Button>
              </div>
            </div>
          ) : null}

          {estado.paso === 'listo' ? (
            <>
              <div className="flex items-center gap-4" aria-live="polite">
                <div className="grilla w-20 shrink-0 rounded-lg px-1.5 pb-1.5 pt-3">
                  <Corte formato="bife" carne="punto" coccion="punto" sellos={['servido', 'servido']} idDeLlenado="tp-llenado-para-llevar" />
                </div>
                <p className="min-w-0 text-sm text-fg">
                  Listo: se descargó <span className="break-all font-mono text-[0.78rem]">{estado.archivo}</span>. Ábrela en
                  Excel, Numbers o Google Sheets, y empieza por la hoja «Léeme».
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button type="button" variant="primary" onClick={cerrar}>
                  Cerrar
                </Button>
              </div>
            </>
          ) : null}

          {estado.paso === 'fallo' ? (
            <>
              <p role="alert" className="text-sm text-negative">
                {NO_SE_PUDO}
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button type="button" variant="primary" onClick={armar}>
                  Probar de nuevo
                </Button>
                <Button type="button" onClick={cerrar}>
                  Cerrar
                </Button>
              </div>
            </>
          ) : null}
        </div>
      </Ventana>
    </>
  )
}
