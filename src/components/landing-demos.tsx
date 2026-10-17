'use client'

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import { Redes } from '@/app/admin/(dash)/schedule/redes'
import { fraseDeLlegada, formatoConLoQueSube, llenadoDe, type Subida } from '@/app/admin/(dash)/schedule/subidas'
import { VistaPrevia } from '@/app/admin/(dash)/schedule/vista-previa'
import { BOTON_CHICO } from '@/components/boton'
import { Corte } from '@/components/corte'
import { Icon } from '@/components/icon'
import { networkLabel } from '@/lib/networks'
import {
  CARNE,
  NOMBRE_COCCION,
  NOMBRE_FORMATO,
  carneDe,
  coccionDe,
  formatoDe,
  selloDe,
  type Coccion,
  type Sello,
} from '@/lib/parrilla'
import { NO_PUBLISH_TOKEN } from '@/lib/social/publish/publisher'
import { cn } from '@/lib/utils'

/*
 * Las dos piezas de la portada que se tocan. No son maquetas: dibujan con las mismas funciones
 * que el panel —`coccionDe`, `selloDe`, `llenadoDe`, la «Así va a quedar» del compositor—, así
 * que lo que se ve acá es lo que se ve adentro. Si el corte cambia, la portada cambia con él.
 */

/** La ficha del compositor, con su casilla adentro: la marcada se enciende. */
const FICHA =
  'inline-flex items-center gap-2 rounded-full border border-acero-600 px-3 py-1.5 text-sm text-fg-muted transition-colors has-[:checked]:border-brasa has-[:checked]:bg-brasa/10 has-[:checked]:text-fg has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brasa'

/** El color del estado en palabras, como al lado de la hora en el calendario (`calendar.tsx`). */
const COLOR_ESTADO: Record<Coccion, string> = {
  cruda: 'text-fg',
  sellada: 'text-fg',
  punto: 'text-positive',
  parcial: 'text-negative',
  quemada: 'text-negative',
}

type Lleva = 'video' | 'carrusel' | 'foto' | 'texto'
type Va = 'programada' | 'saliendo' | 'publicada' | 'quemada'
type Red = 'instagram' | 'facebook' | 'tiktok' | 'youtube'

const LLEVA: ReadonlyArray<{ clave: Lleva; nombre: string; media: ReadonlyArray<{ mediaType: string }> }> = [
  { clave: 'video', nombre: 'Un video', media: [{ mediaType: 'video' }] },
  { clave: 'carrusel', nombre: 'Cinco fotos', media: Array.from({ length: 5 }, () => ({ mediaType: 'image' })) },
  { clave: 'foto', nombre: 'Una foto', media: [{ mediaType: 'image' }] },
  { clave: 'texto', nombre: 'Solo texto', media: [] },
]

const VA: ReadonlyArray<{ clave: Va; nombre: string }> = [
  { clave: 'programada', nombre: 'Programada' },
  { clave: 'saliendo', nombre: 'Saliendo' },
  { clave: 'publicada', nombre: 'Publicada' },
  { clave: 'quemada', nombre: 'Se quemó en una' },
]

const REDES: readonly Red[] = ['instagram', 'facebook', 'tiktok', 'youtube']

/**
 * La cuenta de muestra de cada red. Con nombre y no sin él: sin usuario, la lista dice la red
 * dos veces al lector de pantalla («Instagram · Instagram · Publicado»).
 */
const CUENTA: Record<Red, string> = {
  instagram: '@tu.cuenta',
  facebook: 'Tu Página',
  tiktok: '@tu.cuenta',
  youtube: 'Tu Canal',
}

/**
 * Las reglas del compositor, para no ofrecer lo que adentro se rechaza: Instagram, TikTok y
 * YouTube necesitan un archivo (`validate.ts`), y YouTube solo recibe video (`youtube.ts`).
 */
function admite(red: Red, lleva: Lleva): boolean {
  if (lleva === 'texto') return red === 'facebook'
  if (red === 'youtube') return lleva === 'video'
  return true
}

const POR_QUE_NO: Partial<Record<Lleva, string>> = {
  texto: 'Sin archivo, solo Facebook: Instagram, TikTok y YouTube necesitan uno.',
  carrusel: 'YouTube solo recibe video.',
  foto: 'YouTube solo recibe video.',
}

/** Cómo va cada destino. «Se quemó en una»: la primera red falló, y las demás salieron. */
function estadoDe(va: Va, i: number): 'scheduled' | 'publishing' | 'published' | 'failed' {
  if (va === 'programada') return 'scheduled'
  if (va === 'saliendo') return 'publishing'
  if (va === 'quemada' && i === 0) return 'failed'
  return 'published'
}

/**
 * Arma un corte: lo que lleva, dónde sale y cómo va, y el corte cambia como cambiaría en La
 * Parrilla. Es la leyenda del dibujo, pero tocándola se aprende en tres clics.
 */
export function ArmaUnCorte() {
  const [lleva, setLleva] = useState<Lleva>('video')
  const [marcadas, setMarcadas] = useState<ReadonlySet<Red>>(() => new Set<Red>(['instagram', 'tiktok']))
  const [va, setVa] = useState<Va>('programada')

  const media = LLEVA.find((l) => l.clave === lleva)!.media
  const redes = REDES.filter((red) => marcadas.has(red) && admite(red, lleva))
  const destinos = redes.map((network, i) => {
    const status = estadoDe(va, i)
    return { network, handle: CUENTA[network], externalId: null, opciones: null, status, lastError: status === 'failed' ? NO_PUBLISH_TOKEN : null }
  })
  const estados = destinos.map((d) => d.status)
  const sellos: Sello[] = destinos.map((d) => selloDe(d))
  const { formato, huesos } = formatoDe(media)
  const coccion = coccionDe(estados)
  const quemado = destinos.find((d) => d.status === 'failed')

  function elegirLleva(nueva: Lleva) {
    setLleva(nueva)
    // Lo que esa red no recibe se desmarca, como en el compositor; si no queda ninguna, la
    // primera que sí lo recibe, para que siempre haya un corte con su marca.
    setMarcadas((antes) => {
      const quedan = new Set([...antes].filter((red) => admite(red, nueva)))
      if (quedan.size === 0) quedan.add(REDES.find((red) => admite(red, nueva))!)
      return quedan
    })
  }

  function alternar(red: Red, marcada: boolean) {
    setMarcadas((antes) => {
      const despues = new Set(antes)
      if (marcada) despues.add(red)
      else despues.delete(red)
      return despues
    })
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:gap-12">
      <div>
        {/* Arriba se deja aire para el humo y la banderita, que se asoman por encima. */}
        <div className="grilla grilla-prendida flex min-h-[15rem] items-end justify-center px-8 pb-8 pt-16 sm:px-16">
          <Corte
            formato={formato}
            huesos={huesos}
            carne={carneDe(estados)}
            coccion={coccion}
            sellos={sellos}
            className="w-full max-w-[22rem]"
          />
        </div>
        {/* Lo que el dibujo dice, en palabras: el corte va oculto para el lector de pantalla. */}
        <div className="mt-4 space-y-2" aria-live="polite">
          <p className="font-titulo text-sm uppercase tracking-[0.12em] text-fg">
            {NOMBRE_FORMATO[formato]}
            {formato === 'tira' ? ` de ${huesos}` : ''} ·{' '}
            <span className={COLOR_ESTADO[coccion]}>{destinos.length > 0 ? NOMBRE_COCCION[coccion] : 'sin redes'}</span>
          </p>
          {destinos.length > 0 ? (
            <Redes targets={destinos} sellos={sellos} detalle />
          ) : (
            <p className="text-sm text-fg-muted">Elige al menos una red.</p>
          )}
          {quemado ? (
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[0.82rem] text-negative">
              {networkLabel(quemado.network)}: {NO_PUBLISH_TOKEN}
              <span className={BOTON_CHICO} aria-hidden>
                Reconectar
              </span>
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-6">
        <Grupo leyenda="Qué lleva">
          {LLEVA.map((l) => (
            <Ficha key={l.clave} tipo="radio" nombre="lleva" marcada={lleva === l.clave} onCambio={() => elegirLleva(l.clave)}>
              {l.nombre}
            </Ficha>
          ))}
        </Grupo>
        <Grupo leyenda="Dónde sale" nota={POR_QUE_NO[lleva]}>
          {REDES.map((red) => (
            <Ficha
              key={red}
              tipo="checkbox"
              nombre="redes"
              marcada={marcadas.has(red) && admite(red, lleva)}
              apagada={!admite(red, lleva)}
              onCambio={(marcada) => alternar(red, marcada)}
            >
              <Icon name={red} className="h-3.5 w-3.5 shrink-0" />
              {networkLabel(red)}
            </Ficha>
          ))}
        </Grupo>
        <Grupo leyenda="Cómo va">
          {VA.map((v) => (
            <Ficha key={v.clave} tipo="radio" nombre="va" marcada={va === v.clave} onCambio={() => setVa(v.clave)}>
              {v.nombre}
            </Ficha>
          ))}
        </Grupo>
      </div>
    </div>
  )
}

function Grupo({ leyenda, nota, children }: { leyenda: string; nota?: string; children: ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-2 font-titulo text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-fg-faint">{leyenda}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
      {nota ? <p className="mt-2 text-[0.75rem] text-fg-faint">{nota}</p> : null}
    </fieldset>
  )
}

function Ficha({
  tipo,
  nombre,
  marcada,
  apagada = false,
  onCambio,
  children,
}: {
  tipo: 'radio' | 'checkbox'
  nombre: string
  marcada: boolean
  apagada?: boolean
  onCambio: (marcada: boolean) => void
  children: ReactNode
}) {
  return (
    <label className={cn(FICHA, apagada ? 'cursor-not-allowed opacity-40' : 'cursor-pointer hover:text-fg')}>
      <input
        type={tipo}
        name={nombre}
        checked={marcada}
        disabled={apagada}
        onChange={(e) => onCambio(e.target.checked)}
        className="sr-only"
      />
      {children}
    </label>
  )
}

/* ------------------------------------------------------------ la subida -- */

const ARCHIVOS = 5
/** Lo que tarda cada archivo en llegar, en la muestra. */
const POR_ARCHIVO = 900
/** El que no llega la primera vez: el cuarto, cortado a mitad de camino. */
const FALLA = 3
const CORTE_DEL_FALLO = 0.6
/** Si nadie aprieta «Reintentar», la muestra reintenta sola. */
const ESPERA_DEL_REINTENTO = 2600

/** Los tonos de las fotos de muestra: apagados, para que no compitan con la carne. */
const FOTOS = [
  ['#45525e', '#1f262d'],
  ['#6a4e40', '#2a1f1a'],
  ['#4b5b4d', '#1e2721'],
  ['#5b4d68', '#262033'],
  ['#6b5d3e', '#2e271a'],
] as const

/**
 * Cómo va la subida en el instante `t` (en milisegundos desde que empezó), con el reintento
 * en `reintento` si ya se apretó. De a uno y en orden, como en el compositor: el cuarto se
 * corta, la cola se detiene ahí, y al reintentar vuelve a subir desde cero.
 */
function subidaEn(t: number, reintento: number | null): { listas: number; subidas: Subida[] } {
  const fila = (i: number, estado: Subida['estado'], progreso: number): Subida => ({
    clave: `foto-${i + 1}`,
    nombre: `foto-${i + 1}.jpg`,
    tipo: 'image',
    estado,
    progreso,
    error: estado === 'fallo' ? 'No llegó.' : null,
  })
  const desde = (listas: number, subiendo: number, progreso: number, fallo = false) => ({
    listas,
    subidas: Array.from({ length: ARCHIVOS - listas }, (_, k) => {
      const i = listas + k
      if (i !== subiendo) return fila(i, 'cola', 0)
      return fila(i, fallo ? 'fallo' : 'subiendo', progreso)
    }),
  })
  if (reintento === null || t < reintento) {
    if (t < FALLA * POR_ARCHIVO) {
      const listas = Math.floor(t / POR_ARCHIVO)
      return desde(listas, listas, (t % POR_ARCHIVO) / POR_ARCHIVO)
    }
    const progreso = (t - FALLA * POR_ARCHIVO) / POR_ARCHIVO
    if (progreso < CORTE_DEL_FALLO) return desde(FALLA, FALLA, progreso)
    return desde(FALLA, FALLA, CORTE_DEL_FALLO, true)
  }
  const dt = t - reintento
  const listas = Math.min(ARCHIVOS, FALLA + Math.floor(dt / POR_ARCHIVO))
  if (listas === ARCHIVOS) return { listas, subidas: [] }
  return desde(listas, listas, (dt % POR_ARCHIVO) / POR_ARCHIVO)
}

/** Cuándo se reintenta solo: lo que tarda en cortarse el cuarto, y la espera. */
const REINTENTO_SOLO = FALLA * POR_ARCHIVO + CORTE_DEL_FALLO * POR_ARCHIVO + ESPERA_DEL_REINTENTO

/** Desde el reintento, lo que falta: el cuarto de nuevo y el quinto. */
const DESPUES_DEL_REINTENTO = (ARCHIVOS - FALLA) * POR_ARCHIVO

/** Las cinco elegidas, esperando: así se ve antes de empezar, y así la dibuja el servidor. */
const EN_ESPERA = {
  listas: 0,
  subidas: Array.from({ length: ARCHIVOS }, (_, i): Subida => ({
    clave: `foto-${i + 1}`,
    nombre: `foto-${i + 1}.jpg`,
    tipo: 'image',
    estado: 'cola',
    progreso: 0,
    error: null,
  })),
}

const SIN_MOVIMIENTO = '(prefers-reduced-motion: reduce)'

/** Si el sistema pide reducir movimiento. En el servidor no se sabe: ahí, que no. */
function useSinMovimiento(): boolean {
  return useSyncExternalStore(
    (avisar) => {
      const consulta = matchMedia(SIN_MOVIMIENTO)
      consulta.addEventListener('change', avisar)
      return () => consulta.removeEventListener('change', avisar)
    },
    () => matchMedia(SIN_MOVIMIENTO).matches,
    () => false,
  )
}

/**
 * Cinco fotos que suben: el corte toma su forma apenas se eligen y se va llenando de carne
 * cruda a medida que llegan. La cuarta no llega: el corte se quema y la cola espera su
 * «Reintentar» (si nadie lo aprieta, se reintenta sola). Empieza cuando se ve, una vez, y se
 * detiene con las cinco arriba; con «reducir movimiento», queda quieta en su final.
 */
export function SeArmaMientrasSube() {
  const caja = useRef<HTMLDivElement>(null)
  // `null`: todavía no empezó. El reintento vive también en una ref, para que el reloj sepa
  // cuándo terminar sin esperar a que la pantalla se vuelva a dibujar.
  const [t, setT] = useState<number | null>(null)
  const [reintento, setReintento] = useState<number | null>(null)
  const reintentoVivo = useRef<number | null>(null)
  const [vuelta, setVuelta] = useState(0)
  // Sin movimiento, el final: lo que importa es cómo queda.
  const quieto = useSinMovimiento()

  useEffect(() => {
    const el = caja.current
    if (!el || quieto) return
    let cuadro = 0
    let inicio = 0
    const paso = (ahora: number) => {
      if (!inicio) inicio = ahora
      const dt = ahora - inicio
      setT(dt)
      const desde = reintentoVivo.current ?? (dt >= REINTENTO_SOLO ? REINTENTO_SOLO : null)
      if (desde === null || dt < desde + DESPUES_DEL_REINTENTO) cuadro = requestAnimationFrame(paso)
    }
    const mirador = new IntersectionObserver(
      ([entrada]) => {
        if (!entrada?.isIntersecting) return
        mirador.disconnect()
        cuadro = requestAnimationFrame(paso)
      },
      { threshold: 0.4 },
    )
    mirador.observe(el)
    return () => {
      mirador.disconnect()
      cancelAnimationFrame(cuadro)
    }
  }, [vuelta, quieto])

  const ahora = t ?? 0
  const desde = reintento ?? (ahora >= REINTENTO_SOLO ? REINTENTO_SOLO : null)
  const { listas, subidas } = quieto ? { listas: ARCHIVOS, subidas: [] } : t === null ? EN_ESPERA : subidaEn(ahora, desde)
  const terminado = listas === ARCHIVOS
  const { formato, huesos } = formatoConLoQueSube(Array.from({ length: listas }, () => ({ mediaType: 'image' })), subidas)
  // Una marca por cuenta marcada: Instagram y TikTok, todavía sin salir.
  const sellos: Sello[] = ['pendiente', 'pendiente']
  const frase = fraseDeLlegada(listas, subidas) ?? `Un carrusel de ${huesos}. A Instagram y TikTok.`

  return (
    <div ref={caja} className="w-full max-w-md space-y-3">
      <VistaPrevia
        formato={formato}
        huesos={huesos}
        sellos={sellos}
        llenado={llenadoDe(listas, subidas)}
        noLlego={subidas.some((s) => s.estado === 'fallo')}
        calor="prendida"
        frase={frase}
        idDeLlenado="llenado-portada"
      />
      <ul className="grid grid-cols-5 gap-2" aria-label="Las fotos">
        {Array.from({ length: ARCHIVOS }, (_, i) => {
          const sub = i < listas ? null : subidas[i - listas]
          return (
            <MiniaturaDeMuestra
              key={i}
              numero={i + 1}
              tonos={FOTOS[i]!}
              estado={sub ? sub.estado : 'lista'}
              progreso={sub ? sub.progreso : 1}
              onReintentar={() => {
                reintentoVivo.current = ahora
                setReintento(ahora)
              }}
            />
          )
        })}
      </ul>
      {terminado && !quieto ? (
        <button
          type="button"
          onClick={() => {
            reintentoVivo.current = null
            setReintento(null)
            setT(null)
            setVuelta((v) => v + 1)
          }}
          className="text-[0.78rem] text-fg-faint underline-offset-2 transition-colors hover:text-fg hover:underline"
        >
          Ver de nuevo
        </button>
      ) : null}
    </div>
  )
}

/** La miniatura del compositor (`archivos.tsx`), con una foto de mentira adentro. */
function MiniaturaDeMuestra({
  numero,
  tonos,
  estado,
  progreso,
  onReintentar,
}: {
  numero: number
  tonos: readonly [string, string]
  estado: 'lista' | Subida['estado']
  progreso: number
  onReintentar: () => void
}) {
  const llegando = estado === 'cola' || estado === 'subiendo'
  return (
    <li
      className={cn(
        'relative aspect-[4/5] overflow-hidden rounded-lg border bg-acero-950',
        estado === 'fallo' ? 'border-negative/70' : 'border-acero-700',
      )}
    >
      <span
        className={cn('block h-full w-full', llegando && 'opacity-50')}
        style={{ background: `linear-gradient(160deg, ${tonos[0]}, ${tonos[1]})` }}
        aria-hidden
      />
      <span className="absolute left-1 top-1 rounded bg-black/60 px-1 font-mono text-[0.6rem] text-white">{numero}</span>
      {llegando ? (
        <div className="absolute inset-x-0 bottom-0 bg-black/55 px-1.5 pb-1 pt-0.5">
          <span className="block font-mono text-[0.6rem] text-white">{estado === 'cola' ? 'En cola' : `${Math.round(progreso * 100)} %`}</span>
          <span className="mt-0.5 block h-1 overflow-hidden rounded bg-white/15">
            <span className="block h-full rounded" style={{ width: `${Math.round(progreso * 100)}%`, background: CARNE.cruda.medio }} />
          </span>
        </div>
      ) : null}
      {estado === 'fallo' ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/65 p-1 text-center">
          <span className="text-[0.62rem] text-negative">No llegó</span>
          <button
            type="button"
            onClick={onReintentar}
            className="rounded border border-negative/60 px-1.5 py-0.5 text-[0.62rem] text-fg transition-colors hover:bg-negative/15"
          >
            Reintentar
          </button>
        </div>
      ) : null}
    </li>
  )
}
