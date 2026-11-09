'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { verEntregaPropia } from '@/app/admin/cocina-actions'
import type { EntregaDeComanda } from '@/db/schema'
import { cn } from '@/lib/utils'

// La entrega: la primera vez que el dueño ve una comanda que pasó a sirviendo (la primera tanda en
// el mesón) o a lista (la comanda entera), el plato sale de la cocina. Envuelve la estación de la
// comanda (`estacion-comanda.tsx`) y le pone encima, por unos tres segundos, lo que la tapa: de
// noche la campana de acero, que se levanta y deja subir el humo; de día la cortina del pase, que
// se abre y deja pasar el destello por la bandeja. La tarjeta se enciende en brasa y se apaga, y
// arriba de lo demás queda «Salió la primera tanda» o «Recién salida de la cocina» mientras la
// página siga abierta. Los movimientos, y su versión quieta, viven en `globals.css`.
//
// Una vez por entrega, y no una vez por navegador: lo vio se anota en el servidor
// (`comandas.entrega_vista`, con `verEntregaPropia`) apenas empieza la animación. Con
// `localStorage` volvería a salir en el teléfono, en otro computador o al borrar los datos del
// sitio, y la entrega se vería cada vez como si fuera nueva; en la base, quien la vio en el panel
// de la oficina no la vuelve a ver en el de la casa. No empieza con la pestaña oculta: espera a que
// esté a la vista, para que no la gaste una pestaña abierta en segundo plano.

/** Lo que dura la entrega: la campana, el humo y la tarjeta encendida (`globals.css`). */
const DURA_MS = 3_200

/** Dónde va la campana, y el humo que sube al levantarla, según dónde queda lo servido en la estación. */
const CAMPANA: Record<EntregaDeComanda, { cx: number; ancho: number; base: number; alto: number; humo: number[] }> = {
  lista: { cx: 57, ancho: 42, base: 67, alto: 36, humo: [38, 57, 76] },
  sirviendo: { cx: 86, ancho: 25, base: 69, alto: 26, humo: [80, 93] },
}

/** Por dónde cruza el destello de día: la bandeja entera, o la de la derecha mientras sirve. */
const BANDEJA: Record<EntregaDeComanda, { x: number; ancho: number }> = {
  lista: { x: 14, ancho: 92 },
  sirviendo: { x: 58, ancho: 56 },
}

const QUE_SALIO: Record<EntregaDeComanda, string> = {
  sirviendo: 'Salió la primera tanda',
  lista: 'Recién salida de la cocina',
}

function Campana({ entrega }: { entrega: EntregaDeComanda }) {
  const id = useId()
  const { cx, ancho, base, alto, humo } = CAMPANA[entrega]
  const domo = `M${cx - ancho} ${base}C${cx - ancho} ${base - alto * 0.78} ${cx - ancho * 0.5} ${base - alto} ${cx} ${base - alto}C${cx + ancho * 0.5} ${base - alto} ${cx + ancho} ${base - alto * 0.78} ${cx + ancho} ${base}Z`
  return (
    <svg viewBox="0 0 120 90" className="solo-noche pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
      <defs>
        <linearGradient id={`${id}acero`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e6edf2" />
          <stop offset=".45" stopColor="#b7c2cc" />
          <stop offset="1" stopColor="#6b7782" />
        </linearGradient>
      </defs>
      {humo.map((x, i) => (
        <path
          key={x}
          className={cn('humo-de-la-entrega', i === 1 && 'humo-de-la-entrega-2', i === 2 && 'humo-de-la-entrega-3')}
          d={`M${x} ${base - 12}C${x - 4} ${base - 17} ${x + 4} ${base - 21} ${x} ${base - 26}C${x - 4} ${base - 31} ${x + 4} ${base - 34} ${x} ${base - 38}`}
          fill="none"
          stroke="rgba(214,220,227,.6)"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      ))}
      <g className="campana">
        <path d={domo} fill={`url(#${id}acero)`} stroke="#6b7782" strokeWidth=".8" />
        <path
          d={`M${cx - ancho * 0.62} ${base - alto * 0.42}C${cx - ancho * 0.5} ${base - alto * 0.8} ${cx - ancho * 0.2} ${base - alto * 0.9} ${cx} ${base - alto * 0.92}`}
          stroke="#ffffff"
          strokeWidth="1.6"
          strokeLinecap="round"
          fill="none"
          opacity=".7"
        />
        <rect x={cx - ancho - 2} y={base - 1.5} width={ancho * 2 + 4} height="3.6" rx="1.8" fill="#8d9aa6" />
        <rect x={cx - 1.2} y={base - alto - 4} width="2.4" height="4.5" fill="#8d9aa6" />
        <circle cx={cx} cy={base - alto - 5} r="3.2" fill="#c9d3dc" stroke="#6b7782" strokeWidth=".6" />
      </g>
    </svg>
  )
}

function Cortina({ entrega }: { entrega: EntregaDeComanda }) {
  const id = useId()
  const { x, ancho } = BANDEJA[entrega]
  const panel = (lado: 'izquierda' | 'derecha') => {
    const x0 = lado === 'izquierda' ? 6 : 61
    // La media luna del emblema, cortada por la mitad como en toda cortina de dos paños.
    const media = lado === 'izquierda' ? 'M60 22A9 9 0 0 0 60 40Z' : 'M60 22A9 9 0 0 1 60 40Z'
    return (
      <g className={`cortina-${lado}`}>
        <rect x={x0} y="4" width="53" height="58" rx="2" fill="#2f4a6b" />
        <rect x={x0} y="4" width="53" height="6" rx="2" fill="#243a55" />
        <path d={`M${x0 + 3} 58H${x0 + 50}`} stroke="#3d5d84" strokeWidth="1.2" />
        <path d={media} fill="#f6efe2" />
      </g>
    )
  }
  return (
    <svg viewBox="0 0 120 90" className="solo-dia pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
      <defs>
        <clipPath id={`${id}bandeja`}>
          <rect x={x} y="34" width={ancho} height="38" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}bandeja)`}>
        <g transform="skewX(-20)">
          <rect className="destello-de-la-entrega" x={x + 10} y="30" width="9" height="44" fill="#ffffff" />
        </g>
      </g>
      {panel('izquierda')}
      {panel('derecha')}
    </svg>
  )
}

export function EntregaDelPlato({
  comandaId,
  entrega,
  estacion,
  como: Como = 'li',
  className,
  claseEstacion,
  children,
}: {
  comandaId: string
  /** La entrega que el dueño todavía no vio salir, o null: la dice el servidor (`entregaSinVer`). */
  entrega: EntregaDeComanda | null
  /** La estación de la comanda, ya dibujada. */
  estacion: React.ReactNode
  como?: 'li' | 'div'
  className?: string
  /** El tamaño del cuadro de la estación. */
  claseEstacion?: string
  children?: React.ReactNode
}) {
  // La que salió en esta página: su frase queda arriba aunque la vigía traiga la tarjeta nueva,
  // que ya no la trae como pendiente.
  const [salio, setSalio] = useState<EntregaDeComanda | null>(null)
  const [animando, setAnimando] = useState(false)
  const vista = useRef<EntregaDeComanda | null>(null)

  useEffect(() => {
    if (!entrega || vista.current === entrega) return
    function salir() {
      if (document.hidden || !entrega) return
      document.removeEventListener('visibilitychange', salir)
      vista.current = entrega
      setSalio(entrega)
      setAnimando(true)
      // Si no llega, la próxima visita la vuelve a mostrar: mejor eso que perderla.
      verEntregaPropia(comandaId, entrega).catch(() => {})
    }
    document.addEventListener('visibilitychange', salir)
    salir()
    return () => document.removeEventListener('visibilitychange', salir)
  }, [comandaId, entrega])

  // Aparte del de arriba: si React lo monta dos veces, el reloj se arma de nuevo y la campana no
  // queda puesta.
  useEffect(() => {
    if (!animando) return
    const reloj = setTimeout(() => setAnimando(false), DURA_MS)
    return () => clearTimeout(reloj)
  }, [animando])

  return (
    <Como className={cn(className, animando && 'entrega-recien')}>
      <span className={cn('relative block shrink-0 self-start leading-none', claseEstacion)}>
        <span className={cn('relative block', animando && 'plato-sale')}>
          {estacion}
          {animando && salio ? (
            <>
              <Campana entrega={salio} />
              <Cortina entrega={salio} />
            </>
          ) : null}
        </span>
      </span>
      <div className="min-w-0 flex-1">
        {salio ? (
          <p className="mb-1 font-titulo text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-brasa">{QUE_SALIO[salio]}</p>
        ) : null}
        {children}
      </div>
    </Como>
  )
}
