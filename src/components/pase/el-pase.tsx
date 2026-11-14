'use client'

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { Columns2, Copy, Image as IconoImagen, Plus, Sparkles, Square, Video, X } from 'lucide-react'
import type { EstadoPiezaDelPase, ZonaDelCuadro } from '@/db/schema'
import { CorteDefs, MarcaDeTuParrilla } from '@/components/corte'
import { NOMBRE_DEL_ESTADO, nombreDeVersion, type ComentarioParaLaApi, type PaseParaLaApi, type PiezaParaLaApi } from '@/lib/pase/reglas'
import { cn } from '@/lib/utils'
import { ListaDeCriticas, NuevaCritica, Veredicto, type Accion } from './criticas'
import { Reproductor, type ManejoDelReproductor, type Marca } from './reproductor'
import { SubirAlPase } from './subir'

// El Pase por dentro (`/pase/{código}`): las piezas arriba, el video o la imagen a la izquierda y la
// crítica a la derecha. Quien revisa pausa y escribe; quien edita lee la lista de tareas, contesta y
// sube la versión siguiente. El diseño, en `docs/superpowers/specs/2026-11-13-el-pase-design.md`.

const AUTOR = 'pase-autor'
/** Cada cuánto se vuelve a leer el pase con la pestaña a la vista: otra persona puede estar comentando. */
const CADA_MS = 15_000

const COLOR_DEL_ESTADO: Record<EstadoPiezaDelPase, string> = {
  en_revision: 'text-fg-faint',
  aprobada: 'text-positive',
  cambios: 'text-caution',
  descartada: 'text-negative',
}

type Grupo = { grupo: string; versiones: PiezaParaLaApi[] }

/** Las piezas por creativo, en el orden en que llegó cada uno; sus versiones, de la primera a la última. */
function agrupar(piezas: PiezaParaLaApi[]): Grupo[] {
  const grupos = new Map<string, PiezaParaLaApi[]>()
  for (const p of piezas) grupos.set(p.grupo, [...(grupos.get(p.grupo) ?? []), p])
  return [...grupos.entries()].map(([grupo, versiones]) => ({
    grupo,
    versiones: versiones.sort((a, b) => a.version - b.version || (a.variante ?? '').localeCompare(b.variante ?? '')),
  }))
}

const SIN_MARCA: Marca = { desdeMs: null, hastaMs: null, zona: null }

/**
 * El nombre de quien revisa, guardado en su navegador: se escribe una vez. Se lee como almacén
 * externo, para que el servidor (que no lo sabe) y el navegador no dibujen cosas distintas.
 */
const avisarAutor = new Set<() => void>()
function leerAutor(): string {
  try {
    return localStorage.getItem(AUTOR) ?? ''
  } catch {
    return ''
  }
}
function guardarAutor(nombre: string) {
  try {
    localStorage.setItem(AUTOR, nombre)
  } catch {
    // Sin almacenamiento (modo privado estricto): sirve por esta visita.
    autorEnMemoria = nombre
  }
  for (const avisar of avisarAutor) avisar()
}
let autorEnMemoria = ''
function useAutor(): string {
  return useSyncExternalStore(
    (avisar) => {
      avisarAutor.add(avisar)
      return () => avisarAutor.delete(avisar)
    },
    () => leerAutor() || autorEnMemoria,
    () => '',
  )
}

export function ElPase({ codigo, inicial }: { codigo: string; inicial: PaseParaLaApi }) {
  const [pase, setPase] = useState(inicial)
  const rol = pase.rol
  const grupos = useMemo(() => agrupar(pase.piezas), [pase.piezas])
  const [activaId, setActivaId] = useState<string | null>(() => grupos[0]?.versiones.at(-1)?.id ?? null)
  const activa = pase.piezas.find((p) => p.id === activaId) ?? grupos[0]?.versiones.at(-1) ?? null
  const grupo = grupos.find((g) => g.grupo === activa?.grupo) ?? null

  const [marca, setMarca] = useState<Marca>(SIN_MARCA)
  const [tramo, setTramo] = useState<'ninguno' | 'abierto' | 'cerrado'>('ninguno')
  const [general, setGeneral] = useState(false)
  const [dibujando, setDibujando] = useState(false)
  const [elegidoId, setElegidoId] = useState<string | null>(null)
  const autor = useAutor()
  const [subir, setSubir] = useState<{ base: PiezaParaLaApi | null } | null>(null)
  const [compararCon, setCompararCon] = useState<string | null>(null)
  const [paraIa, setParaIa] = useState(false)
  const jugador = useRef<ManejoDelReproductor>(null)
  const otro = useRef<ManejoDelReproductor>(null)

  const elegido = activa?.comentarios.find((c) => c.id === elegidoId) ?? null
  const comparada = compararCon ? pase.piezas.find((p) => p.id === compararCon) ?? null : null
  // Dónde estaba la primera al elegir con cuál comparar: la segunda arranca ahí.
  const [inicioDeLaComparada, setInicioDeLaComparada] = useState(0)

  const releer = useCallback(async () => {
    const r = await fetch(`/api/pase/${codigo}`, { cache: 'no-store' })
    if (r.ok) setPase((await r.json()) as PaseParaLaApi)
  }, [codigo])

  useEffect(() => {
    const reloj = setInterval(() => {
      if (document.visibilityState === 'visible') void releer()
    }, CADA_MS)
    return () => clearInterval(reloj)
  }, [releer])

  // Otra pieza: se empieza de cero. Se ajusta al dibujar, no en un efecto, para no pintar una vez
  // la pieza nueva con lo marcado en la anterior.
  const [piezaDeLaMarca, setPiezaDeLaMarca] = useState(activa?.id)
  if (piezaDeLaMarca !== activa?.id) {
    setPiezaDeLaMarca(activa?.id)
    setMarca(SIN_MARCA)
    setTramo('ninguno')
    setGeneral(false)
    setDibujando(false)
    setElegidoId(null)
    setCompararCon(null)
  }

  const accion: Accion = useCallback(
    async (metodo, ruta, cuerpo) => {
      const r = await fetch(ruta, {
        method: metodo,
        headers: cuerpo === undefined ? undefined : { 'Content-Type': 'application/json' },
        body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
      })
      if (!r.ok) {
        const c = (await r.json().catch(() => ({}))) as { error?: string }
        return c.error ?? 'No se pudo. Revisa tu conexión e inténtalo de nuevo.'
      }
      await releer()
      return null
    },
    [releer],
  )

  const alTiempo = useCallback(
    (ms: number) => {
      if (tramo === 'ninguno') setMarca((m) => ({ ...m, desdeMs: Math.round(ms) }))
      if (compararCon) otro.current?.ir(ms)
    },
    [tramo, compararCon],
  )

  const elegir = useCallback((c: ComentarioParaLaApi) => {
    setElegidoId(c.id)
    if (c.desde !== null) {
      jugador.current?.pausar()
      jugador.current?.ir(c.desde * 1000)
    }
  }, [])

  // Los atajos de quien revisa (y los de mirar, para quien edita), fuera de los campos de texto.
  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t.closest('input, textarea, select, [contenteditable="true"]') || e.metaKey || e.ctrlKey || e.altKey) return
      const j = jugador.current
      const tecla = e.key.toLowerCase()
      if (e.key === ' ') {
        e.preventDefault()
        j?.alternar()
        otro.current?.alternar()
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault()
        const paso = (e.shiftKey ? 1000 / 30 : 1000) * (e.key === 'ArrowLeft' ? -1 : 1)
        j?.mover(paso)
      } else if (tecla === 'i' && rol === 'revisor') {
        const ms = Math.round(j?.tiempoMs() ?? 0)
        setMarca((m) => ({ ...m, desdeMs: ms, hastaMs: null }))
        setTramo('abierto')
        setGeneral(false)
      } else if (tecla === 'o' && rol === 'revisor') {
        const ms = Math.round(j?.tiempoMs() ?? 0)
        setMarca((m) => {
          const desde = m.desdeMs ?? 0
          return ms > desde ? { ...m, hastaMs: ms } : { ...m, desdeMs: ms, hastaMs: desde > ms ? desde : null }
        })
        setTramo('cerrado')
        setGeneral(false)
      } else if (tecla === 'z' && rol === 'revisor') {
        j?.pausar()
        setDibujando((d) => !d)
      } else if (tecla === 'c' && rol === 'revisor') {
        e.preventDefault()
        document.querySelector<HTMLTextAreaElement>('textarea[data-critica]')?.focus()
      } else if (e.key === 'Escape') {
        setDibujando(false)
        setElegidoId(null)
      }
    }
    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  }, [rol])

  async function dejarCritica({ texto, etiqueta }: { texto: string; etiqueta: string }) {
    if (!activa) return 'Elige una pieza.'
    const conTiempo = activa.tipo === 'video' && !general && marca.desdeMs !== null
    const fallo = await accion('POST', `/api/pase/${codigo}/comentarios`, {
      pieza: activa.id,
      autor,
      texto,
      etiqueta,
      desde: conTiempo ? marca.desdeMs! / 1000 : undefined,
      hasta: conTiempo && marca.hastaMs !== null ? marca.hastaMs / 1000 : undefined,
      zona: marca.zona ?? undefined,
    })
    if (!fallo) {
      setMarca((m) => ({ ...m, hastaMs: null, zona: null }))
      setTramo('ninguno')
      setDibujando(false)
    }
    return fallo
  }

  const abiertasDelGrupo = grupo ? grupo.versiones.flatMap((v) => v.comentarios.filter((c) => c.estado === 'abierto')) : []

  return (
    <main className="acerado min-h-dvh bg-acero-950 px-4 py-5 text-fg sm:px-6" data-tema="noche">
      <CorteDefs />
      <div className="mx-auto w-full max-w-7xl space-y-5">
        <header className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <p className="flex items-center gap-2.5">
            <MarcaDeTuParrilla className="w-8" />
            <span className="font-titulo text-[0.75rem] font-semibold uppercase tracking-[0.26em] text-fg-muted">El Pase</span>
          </p>
          <h1 className="min-w-0 flex-1 truncate font-titulo text-xl font-semibold uppercase tracking-[0.04em] sm:text-2xl">{pase.titulo}</h1>
          <span className={cn('rounded-full px-2.5 py-1 text-[0.75rem]', rol === 'revisor' ? 'bg-brasa/15 text-fg' : 'bg-positive/15 text-fg')}>
            {rol === 'revisor' ? 'Revisas' : 'Editas'}
          </span>
          {rol === 'revisor' && autor ? (
            <button type="button" className="text-[0.75rem] text-fg-faint hover:text-fg" onClick={() => guardarAutor('')} title="Cambiar tu nombre">
              como {autor}
            </button>
          ) : null}
          {rol === 'editor' ? (
            <button type="button" onClick={() => setParaIa(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-acero-700 px-3 py-1.5 text-[0.8rem] text-fg-muted hover:bg-acero-800 hover:text-fg">
              <Sparkles className="h-3.5 w-3.5" aria-hidden /> Para tu IA
            </button>
          ) : null}
        </header>
        {pase.instrucciones ? (
          <p className="max-w-[80ch] whitespace-pre-wrap rounded-xl border border-acero-700 bg-acero-900/60 px-4 py-3 text-[0.85rem] text-fg-muted">
            <span className="text-fg-faint">Lo que importa: </span>
            {pase.instrucciones}
          </p>
        ) : null}

        {/* Las piezas: una por creativo, con su última versión. */}
        <nav aria-label="Las piezas" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {grupos.map((g) => {
            const ultima = g.versiones.at(-1)!
            const abiertas = g.versiones.reduce((n, v) => n + v.comentarios.filter((c) => c.estado === 'abierto').length, 0)
            const esta = activa?.grupo === g.grupo
            return (
              <button
                key={g.grupo}
                type="button"
                onClick={() => setActivaId(ultima.id)}
                className={cn(
                  'flex w-52 shrink-0 flex-col gap-1 rounded-xl border px-3 py-2.5 text-left transition-colors',
                  esta ? 'border-brasa bg-brasa/10' : 'border-acero-700 bg-acero-900/60 hover:border-acero-600',
                )}
              >
                <span className="flex items-center gap-1.5 text-[0.7rem] text-fg-faint">
                  {ultima.tipo === 'video' ? <Video className="h-3 w-3" aria-hidden /> : <IconoImagen className="h-3 w-3" aria-hidden />}
                  {nombreDeVersion(ultima)}
                  {g.versiones.length > 1 ? ` · ${g.versiones.length} versiones` : ''}
                </span>
                <span className="truncate text-[0.9rem] text-fg">{ultima.titulo}</span>
                <span className="flex items-center justify-between text-[0.7rem]">
                  <span className={COLOR_DEL_ESTADO[ultima.estado]}>{NOMBRE_DEL_ESTADO[ultima.estado]}</span>
                  {abiertas > 0 ? <span className="rounded-full bg-brasa/20 px-1.5 font-mono text-fg">{abiertas}</span> : null}
                </span>
              </button>
            )
          })}
          {rol === 'editor' ? (
            <button
              type="button"
              onClick={() => setSubir({ base: null })}
              className="flex w-40 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-acero-600 px-3 py-2.5 text-[0.8rem] text-fg-muted hover:text-fg"
            >
              <Plus className="h-4 w-4" aria-hidden /> Pieza nueva
            </button>
          ) : null}
        </nav>

        {!activa ? (
          <div className="rounded-2xl border border-dashed border-acero-700 px-6 py-16 text-center">
            <p className="font-titulo text-lg uppercase tracking-[0.06em]">Todavía no hay nada en el pase</p>
            <p className="mt-2 text-[0.9rem] text-fg-muted">
              {rol === 'editor' ? 'Sube la primera pieza: un short o una imagen.' : 'Cuando el editor suba algo, aparece acá.'}
            </p>
            {rol === 'editor' ? (
              <button type="button" onClick={() => setSubir({ base: null })} className="mt-5 rounded-lg bg-brasa px-4 py-2 text-sm font-medium text-acero-950">
                Subir la primera pieza
              </button>
            ) : null}
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
            <section className="min-w-0 space-y-3" aria-label="La pieza">
              {/* Las versiones de este creativo, y comparar dos. */}
              <div className="flex flex-wrap items-center gap-1.5">
                {grupo!.versiones.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setActivaId(v.id)}
                    className={cn(
                      'rounded-full border px-2.5 py-1 font-mono text-[0.75rem] transition-colors',
                      v.id === activa.id ? 'border-brasa bg-brasa/15 text-fg' : 'border-acero-700 text-fg-muted hover:text-fg',
                    )}
                    title={`${NOMBRE_DEL_ESTADO[v.estado]}${v.notas ? ` · ${v.notas}` : ''}`}
                  >
                    {nombreDeVersion(v)}
                  </button>
                ))}
                {grupo!.versiones.length > 1 ? (
                  <label className="ml-auto inline-flex items-center gap-1.5 text-[0.75rem] text-fg-muted">
                    <Columns2 className="h-3.5 w-3.5" aria-hidden />
                    <select
                      className="rounded-lg border border-acero-700 bg-acero-800 px-2 py-1 text-[0.75rem] [color-scheme:dark]"
                      value={compararCon ?? ''}
                      onChange={(e) => {
                        setInicioDeLaComparada(Math.round(jugador.current?.tiempoMs() ?? 0))
                        setCompararCon(e.target.value || null)
                      }}
                      aria-label="Comparar con otra versión"
                    >
                      <option value="">Comparar con…</option>
                      {grupo!.versiones
                        .filter((v) => v.id !== activa.id)
                        .map((v) => (
                          <option key={v.id} value={v.id}>
                            {nombreDeVersion(v)}
                          </option>
                        ))}
                    </select>
                  </label>
                ) : null}
              </div>
              {activa.notas ? (
                <p className="text-[0.8rem] text-fg-muted">
                  <span className="text-fg-faint">El editor, en esta versión: </span>
                  {activa.notas}
                </p>
              ) : null}

              <div className={cn(comparada && 'grid gap-3 sm:grid-cols-2')}>
                <div className="min-w-0 space-y-1">
                  {comparada ? <p className="text-center font-mono text-[0.75rem] text-fg-muted">{nombreDeVersion(activa)}</p> : null}
                  <Reproductor
                    key={activa.id}
                    manejo={jugador}
                    url={activa.url}
                    tipo={activa.tipo}
                    comentarios={activa.comentarios}
                    marca={rol === 'revisor' ? marca : SIN_MARCA}
                    elegido={elegido}
                    dibujando={dibujando}
                    onZona={(zona: ZonaDelCuadro) => {
                      setMarca((m) => ({ ...m, zona }))
                      setDibujando(false)
                    }}
                    onElegir={elegir}
                    onTiempo={alTiempo}
                  />
                </div>
                {comparada ? (
                  <div className="min-w-0 space-y-1">
                    <p className="flex items-center justify-center gap-2 font-mono text-[0.75rem] text-fg-muted">
                      {nombreDeVersion(comparada)}
                      <button type="button" onClick={() => setCompararCon(null)} aria-label="Dejar de comparar" className="text-fg-faint hover:text-fg">
                        <X className="h-3.5 w-3.5" aria-hidden />
                      </button>
                    </p>
                    <Reproductor
                      key={comparada.id}
                      manejo={otro}
                      url={comparada.url}
                      tipo={comparada.tipo}
                      comentarios={comparada.comentarios}
                      marca={SIN_MARCA}
                      elegido={null}
                      dibujando={false}
                      onZona={() => {}}
                      onElegir={(c) => {
                        setActivaId(comparada.id)
                        setElegidoId(c.id)
                      }}
                      inicioMs={inicioDeLaComparada}
                      silenciado
                    />
                  </div>
                ) : null}
              </div>

              {rol === 'revisor' ? (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      jugador.current?.pausar()
                      setDibujando((d) => !d)
                    }}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[0.8rem] transition-colors',
                      dibujando ? 'border-brasa bg-brasa/15 text-fg' : 'border-acero-700 text-fg-muted hover:text-fg',
                    )}
                    title="Marcar una zona del cuadro (Z)"
                  >
                    <Square className="h-3.5 w-3.5" aria-hidden /> {dibujando ? 'Dibujando la zona…' : 'Marcar una zona'}
                  </button>
                  {activa.tipo === 'video' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          const ms = Math.round(jugador.current?.tiempoMs() ?? 0)
                          setMarca((m) => ({ ...m, desdeMs: ms, hastaMs: null }))
                          setTramo('abierto')
                          setGeneral(false)
                        }}
                        className="rounded-lg border border-acero-700 px-3 py-1.5 text-[0.8rem] text-fg-muted hover:text-fg"
                        title="El tramo empieza acá (I)"
                      >
                        Desde acá
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const ms = Math.round(jugador.current?.tiempoMs() ?? 0)
                          setMarca((m) => (ms > (m.desdeMs ?? 0) ? { ...m, hastaMs: ms } : m))
                          setTramo('cerrado')
                          setGeneral(false)
                        }}
                        className="rounded-lg border border-acero-700 px-3 py-1.5 text-[0.8rem] text-fg-muted hover:text-fg"
                        title="El tramo termina acá (O)"
                      >
                        Hasta acá
                      </button>
                    </>
                  ) : null}
                  <div className="ml-auto">
                    <Veredicto estado={activa.estado} onCambiar={(estado) => void accion('PUT', `/api/pase/${codigo}/piezas/${activa.id}/estado`, { estado, autor: autor || 'Sin nombre' })} />
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cn('text-[0.8rem]', COLOR_DEL_ESTADO[activa.estado])}>
                    {NOMBRE_DEL_ESTADO[activa.estado]}
                    {activa.estadoPor ? ` · ${activa.estadoPor}` : ''}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSubir({ base: activa })}
                    className="ml-auto rounded-lg bg-brasa px-3.5 py-2 text-sm font-medium text-acero-950 transition-[filter] hover:brightness-110"
                  >
                    Subir la v{activa.version + 1}
                  </button>
                </div>
              )}
            </section>

            <aside className="min-w-0 space-y-4">
              {rol === 'revisor' ? (
                <NuevaCritica
                  pieza={activa}
                  marca={marca}
                  general={general}
                  autor={autor}
                  onAutor={guardarAutor}
                  onGeneral={setGeneral}
                  onLimpiarTramo={() => {
                    setMarca((m) => ({ ...m, hastaMs: null, desdeMs: Math.round(jugador.current?.tiempoMs() ?? 0) }))
                    setTramo('ninguno')
                  }}
                  onLimpiarZona={() => setMarca((m) => ({ ...m, zona: null }))}
                  onEnfocar={() => {
                    jugador.current?.pausar()
                    if (tramo === 'ninguno') setMarca((m) => ({ ...m, desdeMs: Math.round(jugador.current?.tiempoMs() ?? 0) }))
                  }}
                  enviar={dejarCritica}
                />
              ) : null}
              <ListaDeCriticas rol={rol} comentarios={activa.comentarios} elegido={elegido} onElegir={elegir} accion={accion} codigo={codigo} />
              {rol === 'editor' && abiertasDelGrupo.length > activa.comentarios.filter((c) => c.estado === 'abierto').length ? (
                <p className="text-[0.75rem] text-fg-faint">Hay críticas abiertas en otras versiones de esta pieza: tócalas arriba para verlas.</p>
              ) : null}
            </aside>
          </div>
        )}
      </div>

      {subir ? (
        <SubirAlPase
          codigo={codigo}
          base={subir.base}
          abiertas={subir.base ? abiertasDelGrupo : []}
          ocupadas={
            subir.base && grupo ? grupo.versiones.filter((v) => v.version === subir.base!.version + 1).map((v) => v.variante) : []
          }
          onCerrar={() => setSubir(null)}
          onListo={async (id) => {
            setSubir(null)
            await releer()
            setActivaId(id)
          }}
        />
      ) : null}
      {paraIa ? <ParaTuIa codigo={codigo} onCerrar={() => setParaIa(false)} /> : null}
    </main>
  )
}

/** La crítica en texto y la dirección de la API, para pasárselas a una IA que edita. */
function ParaTuIa({ codigo, onCerrar }: { codigo: string; onCerrar: () => void }) {
  const [texto, setTexto] = useState<string | null>(null)
  const [copiado, setCopiado] = useState<string | null>(null)
  const api = typeof window === 'undefined' ? `/api/pase/${codigo}` : `${window.location.origin}/api/pase/${codigo}`

  useEffect(() => {
    void fetch(`/api/pase/${codigo}?formato=texto`, { cache: 'no-store' })
      .then((r) => r.text())
      .then(setTexto)
  }, [codigo])

  async function copiar(que: string, valor: string) {
    try {
      await navigator.clipboard.writeText(valor)
      setCopiado(que)
    } catch {
      setCopiado(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-label="Para tu IA">
      <div className="chapa max-h-[92dvh] w-full max-w-2xl space-y-4 overflow-y-auto rounded-2xl p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-titulo text-[0.7rem] uppercase tracking-[0.22em] text-fg-faint">El Pase</p>
            <h2 className="mt-1 font-titulo text-xl font-semibold uppercase tracking-[0.04em]">Para tu IA</h2>
          </div>
          <button type="button" onClick={onCerrar} aria-label="Cerrar" className="text-fg-faint hover:text-fg">
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <p className="text-[0.85rem] text-fg-muted">
          Pégale a tu IA la crítica como lista de tareas, o dale la dirección de la API: con ella lee el pase en JSON, contesta, marca lo hecho y
          sube la versión siguiente. La guía completa está en{' '}
          <a href="/docs/pase-api.md" target="_blank" rel="noopener noreferrer" className="text-fg underline decoration-velo/30 underline-offset-4">
            /docs/pase-api.md
          </a>
          .
        </p>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[0.75rem] text-fg-faint">La dirección de la API (es la llave: no la publiques)</span>
            <button type="button" onClick={() => void copiar('api', api)} className="inline-flex items-center gap-1 text-[0.75rem] text-fg-muted hover:text-fg">
              <Copy className="h-3.5 w-3.5" aria-hidden /> {copiado === 'api' ? 'Copiada' : 'Copiar'}
            </button>
          </div>
          <code className="block overflow-x-auto rounded-lg bg-acero-800 px-3 py-2 font-mono text-[0.75rem] text-fg">{api}</code>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[0.75rem] text-fg-faint">La crítica, como lista de tareas</span>
            {texto ? (
              <button type="button" onClick={() => void copiar('texto', texto)} className="inline-flex items-center gap-1 text-[0.75rem] text-fg-muted hover:text-fg">
                <Copy className="h-3.5 w-3.5" aria-hidden /> {copiado === 'texto' ? 'Copiada' : 'Copiar'}
              </button>
            ) : null}
          </div>
          <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-lg bg-acero-800 px-3 py-2 font-mono text-[0.75rem] leading-relaxed text-fg-muted">
            {texto ?? 'Cargando…'}
          </pre>
        </div>
      </div>
    </div>
  )
}
