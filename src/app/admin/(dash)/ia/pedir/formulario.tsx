'use client'

import { useCallback, useId, useState, useTransition } from 'react'
import Link from 'next/link'
import { pedirComandaPropia } from '@/app/admin/cocina-actions'
import { Panel } from '@/components/charts/panel'
import { DeNocheYDeDia } from '@/components/de-noche-y-de-dia'
import { DibujoDeMaterial } from '@/components/dibujos-material'
import { SelectorColor } from '@/components/selector-color'
import { SelectorFecha } from '@/components/selector-fecha'
import { Button, Field, Input, Textarea } from '@/components/ui'
import { NOMBRE_USO, type ClaseMaterial } from '@/lib/cocina/bodega'
import { SUBTIPOS_PRINCIPAL, type SubtipoPrincipal } from '@/lib/cocina/insumos'
import type { MaterialDeLaCamara } from '@/lib/cocina/materiales'
import {
  AYUDA_ROL,
  AYUDA_SUBTIPO,
  CANTIDADES,
  EJEMPLOS_DE_INSTRUCCION,
  FORMATOS,
  INSTRUCCION_LARGA,
  MAX_ACOMPANAMIENTOS,
  MAX_INSTRUCCION,
  NOMBRE_CANTIDAD,
  NOMBRE_FORMATO,
  NOMBRE_ROL,
  NOMBRE_SUBTIPO,
  ROLES_DE_VIDEO,
  largoDeInstruccion,
  minutosDe,
  type CantidadPedida,
  type FormatoPedido,
  type MarcaBasica,
  type RolDeVideo,
} from '@/lib/cocina/pedido'
import type { MaterialSubido } from '@/lib/cocina/subidas'
import { cn } from '@/lib/utils'
import { CAMARA, DE_LA_CAMARA } from '@/lib/vocabulario'
import { FiltroDeClase, PesoDeMaterial, duracionEnPalabras } from '../bodega/camara'
import { GuardarEnLaCamara } from '../bodega/guardar'

// El formulario de una comanda (`docs/superpowers/specs/2026-10-22-la-cocina-design.md`, «La comanda
// nueva», y `2026-11-02-la-bodega-design.md`): se elige de la cámara de frío (de día, la nevera)
// cualquier combinación —dos de cuatro videos y cuatro fotos—, y cada material elegido sale volando
// de la cámara al riel de la comanda, donde se cuelga. Uno de los videos es el plato principal; los
// demás dicen qué son. Desde acá también se guarda algo nuevo, que entra elegido. Colgar la comanda
// manda solo los ids. «Tu instrucción al chef» tiene su propio bloque: es lo único que el chef lee en
// palabras de la persona.

type Elegido = { id: string; rol: RolDeVideo }

/**
 * La pieza sale de su lugar en la cámara y vuela hasta su gancho en el riel, en arco, achicándose:
 * un clon del dibujo, puesto encima de todo mientras dura. Va dentro del contenedor con el modo
 * (`data-tema`), para que el clon se dibuje en el modo que se ve. Con movimiento reducido no vuela.
 */
function volar(origen: HTMLElement | null, destino: HTMLElement | null, listo: () => void) {
  if (!origen || !destino || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return listo()
  const a = origen.getBoundingClientRect()
  const b = destino.getBoundingClientRect()
  const clon = origen.cloneNode(true) as HTMLElement
  Object.assign(clon.style, {
    position: 'fixed',
    left: `${a.left}px`,
    top: `${a.top}px`,
    width: `${a.width}px`,
    height: `${a.height}px`,
    margin: '0',
    zIndex: '60',
    pointerEvents: 'none',
  })
  clon.setAttribute('aria-hidden', 'true')
  ;(origen.closest('[data-tema]') ?? document.body).appendChild(clon)
  const dx = b.left + b.width / 2 - (a.left + a.width / 2)
  const dy = b.top + b.height / 2 - (a.top + a.height / 2)
  const escala = b.width / a.width
  const vuelo = clon.animate(
    [
      { transform: 'translate(0, 0) scale(1) rotate(0deg)' },
      { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 70}px) scale(${(1 + escala) / 2}) rotate(-10deg)`, offset: 0.5 },
      { transform: `translate(${dx}px, ${dy}px) scale(${escala}) rotate(0deg)` },
    ],
    { duration: 650, easing: 'cubic-bezier(.3,.7,.3,1)' },
  )
  const terminar = () => {
    clon.remove()
    listo()
  }
  vuelo.onfinish = terminar
  vuelo.oncancel = terminar
}

export function FormularioComanda({
  materiales: iniciales,
  subiendo,
  cuota,
  marca: marcaInicial,
  antes,
  eta,
  cocinaAbierta,
  zona,
}: {
  materiales: MaterialDeLaCamara[]
  subiendo: number
  cuota: number
  marca: MarcaBasica
  antes: number
  eta: string | null
  cocinaAbierta: boolean
  zona: string
}) {
  // La `ref` nace con el formulario: mandarlo dos veces cuelga una sola comanda.
  const [ref] = useState(() => crypto.randomUUID())
  const [materiales, setMateriales] = useState(iniciales)
  const [elegidos, setElegidos] = useState<Elegido[]>([])
  const [principalId, setPrincipalId] = useState<string | null>(null)
  const [volando, setVolando] = useState<ReadonlySet<string>>(new Set())
  const [filtro, setFiltro] = useState<ClaseMaterial | null>(null)
  const [subtipo, setSubtipo] = useState<SubtipoPrincipal>('largo')
  const [formatos, setFormatos] = useState<FormatoPedido[]>(['clips'])
  const [cantidad, setCantidad] = useState<CantidadPedida>('lo-que-de')
  const [notas, setNotas] = useState('')
  const [paraCuando, setParaCuando] = useState('')
  const [marca, setMarca] = useState<MarcaBasica>(marcaInicial)
  const [subiendoAca, setSubiendoAca] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [enviando, enviar] = useTransition()

  const porId = new Map(materiales.map((m) => [m.id, m]))
  const enLaComanda = elegidos.map((e) => ({ ...e, material: porId.get(e.id)! })).filter((e) => e.material)
  const principal = principalId ? porId.get(principalId) ?? null : null
  const acompanamientos = enLaComanda.filter((e) => e.id !== principalId)
  const visibles = filtro ? materiales.filter((m) => m.clase === filtro) : materiales
  const guardados = materiales.reduce((suma, m) => suma + m.bytes, 0)

  function colgar(id: string, rol: RolDeVideo = 'imagen') {
    const m = porId.get(id)
    if (!m || elegidos.some((e) => e.id === id)) return
    if (elegidos.length >= MAX_ACOMPANAMIENTOS + 1) return
    setElegidos((lista) => [...lista, { id, rol }])
    // El primer video que se elige es el plato principal: el chef cocina a partir de uno.
    if (!principalId && m.clase === 'video') setPrincipalId(id)
  }

  function elegir(id: string) {
    const origen = document.querySelector<HTMLElement>(`[data-dibujo-de="${id}"]`)
    setVolando((v) => new Set(v).add(id))
    colgar(id)
    // Dos cuadros: el primero pinta el gancho nuevo en el riel, el segundo ya sabe dónde quedó.
    requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        volar(origen, document.querySelector<HTMLElement>(`[data-en-el-riel="${id}"]`), () =>
          setVolando((v) => {
            const sin = new Set(v)
            sin.delete(id)
            return sin
          }),
        ),
      ),
    )
  }

  function soltar(id: string) {
    const quedan = elegidos.filter((e) => e.id !== id)
    setElegidos(quedan)
    if (principalId === id) setPrincipalId(quedan.find((e) => porId.get(e.id)?.clase === 'video')?.id ?? null)
  }

  function cambiarRol(id: string, rol: RolDeVideo | 'principal') {
    if (rol === 'principal') return setPrincipalId(id)
    setElegidos((lista) => lista.map((e) => (e.id === id ? { ...e, rol } : e)))
    if (principalId === id) setPrincipalId(elegidos.find((e) => e.id !== id && porId.get(e.id)?.clase === 'video')?.id ?? null)
  }

  const alGuardar = useCallback((m: MaterialSubido) => {
    setMateriales((lista) => [{ ...m, enMarcha: 0 }, ...lista])
    setElegidos((lista) => [...lista, { id: m.id, rol: 'imagen' }])
    setPrincipalId((actual) => actual ?? (m.clase === 'video' ? m.id : null))
  }, [])

  const minutos = minutosDe(principal?.duracionS ?? null)
  const fechaHora = new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeStyle: 'short', timeZone: zona })
  const falta =
    subiendoAca > 0
      ? 'Espera a que termine de guardarse lo que sube.'
      : !principal
        ? 'Elige un video de la cámara: es el plato principal.'
        : formatos.length === 0
          ? 'Elige qué quieres que salga.'
          : largoDeInstruccion(notas) > MAX_INSTRUCCION
            ? 'Acorta tu instrucción al chef.'
            : null

  function mandar() {
    setError(null)
    enviar(async () => {
      const r = await pedirComandaPropia({
        ref,
        principal: principal?.id,
        subtipo,
        acompanamientos: acompanamientos.map((e) => ({ id: e.id, rol: e.rol })),
        formatos,
        cantidad,
        notas,
        paraCuando,
        marca,
      })
      if (r?.error) setError(r.error)
    })
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-5 lg:items-start">
        <Panel
          className="lg:col-span-3"
          title={
            <>
              1. <DeNocheYDeDia noche={DE_LA_CAMARA.noche} dia={DE_LA_CAMARA.dia} />
            </>
          }
          hint="Toca lo que va en esta comanda: un video es el plato principal, y lo demás lo acompaña. Lo que elijas sigue guardado después."
        >
          {materiales.length === 0 ? (
            <p className="mb-4 text-sm text-fg-faint">
              Todavía no tienes nada guardado. Guarda abajo tu video, y entra solo a la comanda.
            </p>
          ) : (
            <>
              <FiltroDeClase materiales={materiales} valor={filtro} onCambiar={setFiltro} />
              <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {visibles.map((m) => {
                  const elegido = elegidos.some((e) => e.id === m.id)
                  return (
                    <li key={m.id}>
                      <button
                        type="button"
                        aria-pressed={elegido}
                        onClick={() => (elegido ? soltar(m.id) : elegir(m.id))}
                        disabled={!elegido && elegidos.length >= MAX_ACOMPANAMIENTOS + 1}
                        className={cn(
                          'flex h-full w-full flex-col items-center gap-1 rounded-lg border p-2 text-center transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                          elegido ? 'border-brasa bg-acero-800' : 'border-acero-700 hover:border-acero-600 hover:bg-acero-800',
                        )}
                      >
                        <span data-dibujo-de={m.id} className={cn('relative flex h-16 w-16 transition-opacity', elegido && 'opacity-25')}>
                          <DibujoDeMaterial clase={m.clase} bytes={m.bytes} className="h-16 w-16" />
                        </span>
                        <span className="line-clamp-2 w-full break-words text-xs font-medium">{m.nombre}</span>
                        <span className="text-[0.68rem] text-fg-faint">
                          <PesoDeMaterial clase={m.clase} bytes={m.bytes} />
                        </span>
                        <span className={cn('text-[0.68rem]', elegido ? 'text-brasa' : 'text-fg-faint')}>
                          {elegido ? 'En la comanda' : m.uso ? NOMBRE_USO[m.uso] : ' '}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </>
          )}
          <details className="mt-5 rounded-lg border border-acero-700 p-3" open={materiales.length === 0}>
            <summary className="cursor-pointer text-sm font-medium">Guardar algo nuevo</summary>
            <div className="mt-3">
              <GuardarEnLaCamara libres={cuota - guardados - subiendo} cuota={cuota} alGuardar={alGuardar} alCambiarSubiendo={setSubiendoAca} />
            </div>
          </details>
          <p className="mt-3 text-xs text-fg-faint">
            Para renombrar o sacar algo, ve a{' '}
            <Link href="/admin/ia/bodega" className="text-brasa underline-offset-2 hover:underline">
              <DeNocheYDeDia noche={CAMARA.noche.toLowerCase()} dia={CAMARA.dia.toLowerCase()} />
            </Link>
            .
          </p>
        </Panel>

        <Panel className="lg:sticky lg:top-4 lg:col-span-2" title="2. El riel de la comanda" hint="Lo que lleva esta comanda, colgado en orden. El plato principal es el que el chef cocina.">
          <Riel
            enLaComanda={enLaComanda}
            principalId={principalId}
            volando={volando}
            onRol={cambiarRol}
            onSoltar={soltar}
          />
          {principal ? (
            <fieldset className="mt-5">
              <legend className="mb-2 font-titulo text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-fg-faint">
                Qué es el plato principal
              </legend>
              <div className="space-y-1.5">
                {SUBTIPOS_PRINCIPAL.map((s) => (
                  <label key={s} className="flex items-start gap-2 text-sm">
                    <input type="radio" name="subtipo" className="mt-1" checked={subtipo === s} onChange={() => setSubtipo(s)} />
                    <span>
                      {NOMBRE_SUBTIPO[s]} <span className="text-xs text-fg-faint">{AYUDA_SUBTIPO[s]}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          ) : null}
        </Panel>
      </div>

      <Panel title="3. Qué quieres que salga">
        <div className="grid gap-6 sm:grid-cols-2">
          <fieldset>
            <legend className="mb-2 font-titulo text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-fg-faint">Los formatos</legend>
            <div className="space-y-1.5">
              {FORMATOS.map((f) => (
                <label key={f} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={formatos.includes(f)}
                    onChange={(e) => setFormatos((lista) => (e.target.checked ? FORMATOS.filter((x) => x === f || lista.includes(x)) : lista.filter((x) => x !== f)))}
                  />
                  {NOMBRE_FORMATO[f]}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-2 font-titulo text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-fg-faint">Cuántos, más o menos</legend>
            <div className="space-y-1.5">
              {CANTIDADES.map((c) => (
                <label key={c} className="flex items-center gap-2 text-sm">
                  <input type="radio" name="cantidad" checked={cantidad === c} onChange={() => setCantidad(c)} />
                  {NOMBRE_CANTIDAD[c]}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
        <p className="mt-4 text-sm text-fg-muted">Los estilos los elige el chef, con lo que mejor le vaya al material.</p>
        <div className="mt-4 max-w-[14rem]">
          <Field label="Para cuándo (opcional)" hint="Informativo: la hora real la estima el chef.">
            <SelectorFecha modo="fecha" quitable value={paraCuando} onChange={setParaCuando} />
          </Field>
        </div>
      </Panel>

      <InstruccionAlChef valor={notas} onCambiar={setNotas} />

      <Panel title="Tu marca" hint="Lo que el chef usa para vestir lo que cocina. Se guarda para las comandas que vengan.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="El nombre">
            <Input value={marca.nombre} maxLength={80} onChange={(e) => setMarca({ ...marca, nombre: e.target.value })} />
          </Field>
          <Field label="El @ (opcional)">
            <Input value={marca.handle ?? ''} maxLength={60} placeholder="@tumarca" onChange={(e) => setMarca({ ...marca, handle: e.target.value })} />
          </Field>
          <Field label="El color de acento (opcional)" hint="El de los titulares. Sin él, el chef usa el del estilo.">
            <span className="flex items-center gap-2">
              <SelectorColor
                aria-label="El color de acento"
                className="h-9 w-12"
                value={marca.acento ?? '#3D7BFF'}
                onChange={(acento) => setMarca({ ...marca, acento: acento.toUpperCase() })}
              />
              <span className="font-mono text-xs text-fg-faint">{marca.acento ?? 'el del estilo'}</span>
              {marca.acento ? (
                <Button type="button" variant="ghost" onClick={() => setMarca({ ...marca, acento: null })}>
                  Usar el del estilo
                </Button>
              ) : null}
            </span>
          </Field>
          <Field label="El llamado final (opcional)" hint="El texto del cierre: «Sígueme para más», «Agenda tu clase».">
            <Input value={marca.ctaTexto ?? ''} maxLength={120} onChange={(e) => setMarca({ ...marca, ctaTexto: e.target.value })} />
          </Field>
        </div>
      </Panel>

      <Panel title="5. Confirmar">
        <ul className="max-w-2xl space-y-1 text-sm text-fg-muted">
          <li>
            Plato principal: {principal ? `${principal.nombre} (${NOMBRE_SUBTIPO[subtipo]})` : 'todavía no'}
            {minutos > 0 ? ` · ${minutos} min` : ''}
          </li>
          {acompanamientos.length > 0 ? (
            <li className="break-words">
              Lo acompañan: {acompanamientos.map((e) => `${e.material.nombre} (${rolEnPalabras(e.material.clase, e.rol, e.material.uso)})`).join(', ')}
            </li>
          ) : null}
          <li>
            Qué sale: {formatos.map((f) => NOMBRE_FORMATO[f]).join(' y ') || 'nada todavía'} · {NOMBRE_CANTIDAD[cantidad]}
          </li>
          <li>Los estilos: los elige el chef</li>
          <li className="line-clamp-3 whitespace-pre-line break-words">Tu instrucción al chef: {notas.trim() ? `«${notas.trim()}»` : 'ninguna'}</li>
          <li>
            Tu marca: {marca.nombre || 'sin nombre'}
            {marca.handle ? ` · ${marca.handle}` : ''}
            {marca.ctaTexto ? ` · «${marca.ctaTexto}»` : ''}
          </li>
        </ul>
        <div className="mt-4 max-w-2xl space-y-1 text-sm">
          <p>{antes === 0 ? 'Es la próxima en la fila.' : antes === 1 ? 'Hay 1 comanda antes que la tuya.' : `Hay ${antes} comandas antes que la tuya.`}</p>
          {eta ? <p>Hora estimada: {fechaHora.format(new Date(eta))}</p> : null}
          {!cocinaAbierta ? <p className="text-fg-muted">La cocina está cerrada por ahora: tu comanda espera su turno.</p> : null}
          {minutos > 0 ? <p className="text-fg-muted">Consume {minutos} minutos de tu cupo, los del plato principal. Por ahora el cupo no tiene tope.</p> : null}
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button type="button" variant="primary" disabled={Boolean(falta) || enviando} onClick={mandar}>
            {enviando ? 'Colgando…' : 'Colgar la comanda'}
          </Button>
          {falta ? <span className="text-xs text-fg-faint">{falta}</span> : null}
          {error ? (
            <span role="alert" className="text-sm text-negative">
              {error}
            </span>
          ) : null}
        </div>
      </Panel>
    </div>
  )
}

/** Qué es en la comanda, en palabras, para el resumen. */
function rolEnPalabras(clase: ClaseMaterial, rol: RolDeVideo, uso: MaterialDeLaCamara['uso']): string {
  if (clase === 'video') return NOMBRE_ROL[rol].toLowerCase()
  if (clase === 'imagen') return NOMBRE_ROL.imagen.toLowerCase()
  return uso ? NOMBRE_USO[uso].toLowerCase() : 'aparte'
}

/**
 * El riel de la comanda: una barra con un gancho por material, del que cuelga su dibujo, y al lado
 * su nombre y qué es. Un video elige si es el plato principal, para intercalar, otra cámara o la
 * pantalla; una foto va para intercalar; lo demás va aparte, con su uso. Lo que llega volando se
 * esconde hasta que aterriza, y entonces se mece al colgarse.
 */
function Riel({
  enLaComanda,
  principalId,
  volando,
  onRol,
  onSoltar,
}: {
  enLaComanda: Array<Elegido & { material: MaterialDeLaCamara }>
  principalId: string | null
  volando: ReadonlySet<string>
  onRol: (id: string, rol: RolDeVideo | 'principal') => void
  onSoltar: (id: string) => void
}) {
  const id = useId()
  if (enLaComanda.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-acero-700 p-4">
        <div aria-hidden className="mb-3 h-1.5 rounded-full bg-acero-600" />
        <p className="text-sm text-fg-faint">Todavía no hay nada colgado: toca un material para traerlo.</p>
      </div>
    )
  }
  return (
    <div>
      <div aria-hidden className="h-1.5 rounded-full bg-acero-600" />
      <ul className="space-y-2 pt-1">
        {enLaComanda.map(({ id: materialId, rol, material: m }) => {
          const esPrincipal = materialId === principalId
          return (
            <li key={materialId} className={cn('relative flex gap-3 rounded-lg border p-2.5 pt-3', esPrincipal ? 'border-brasa' : 'border-acero-700')}>
              {/* El gancho: del riel al dibujo. */}
              <span aria-hidden className="absolute -top-2 left-[2.15rem] h-3.5 w-px bg-acero-600" />
              <span
                data-en-el-riel={materialId}
                className={cn('relative flex h-12 w-12 shrink-0', volando.has(materialId) ? 'invisible' : 'se-cuelga')}
              >
                <DibujoDeMaterial clase={m.clase} bytes={m.bytes} className="h-12 w-12" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{m.nombre}</p>
                <p className="text-[0.7rem] text-fg-faint">
                  <PesoDeMaterial clase={m.clase} bytes={m.bytes} />
                  {duracionEnPalabras(m.duracionS) ? ` · ${duracionEnPalabras(m.duracionS)}` : ''}
                </p>
                {m.clase === 'video' ? (
                  <fieldset className="mt-1.5">
                    <legend className="sr-only">Qué es «{m.nombre}» en la comanda</legend>
                    <div className="flex flex-wrap gap-1">
                      {(['principal', ...ROLES_DE_VIDEO] as const).map((r) => {
                        const marcado = r === 'principal' ? esPrincipal : !esPrincipal && rol === r
                        return (
                          <label
                            key={r}
                            data-globito={r === 'principal' ? 'El video que el chef cocina.' : AYUDA_ROL[r]}
                            className={cn(
                              'cursor-pointer rounded-full border px-2 py-0.5 text-[0.7rem] transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brasa',
                              marcado ? 'border-brasa bg-brasa text-acero-950' : 'border-acero-700 text-fg-muted hover:text-fg',
                            )}
                          >
                            <input type="radio" name={`${id}${materialId}`} className="sr-only" checked={marcado} onChange={() => onRol(materialId, r)} />
                            {r === 'principal' ? 'Plato principal' : NOMBRE_ROL[r]}
                          </label>
                        )
                      })}
                    </div>
                  </fieldset>
                ) : (
                  <p className="mt-1 text-[0.72rem] text-fg-muted">
                    {m.clase === 'imagen' ? 'Para intercalar' : m.uso ? `Va aparte: ${NOMBRE_USO[m.uso].toLowerCase()}` : 'Va aparte, para que el chef lo use'}
                  </p>
                )}
              </div>
              <Button type="button" className="self-start" onClick={() => onSoltar(materialId)}>
                Quitar
              </Button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/**
 * «Tu instrucción al chef»: lo que la persona le pide en sus palabras —«Quiero que este contenido
 * sea formato bajo 30 segundos»—, que el chef recibe tal cual (`instruccion`, en
 * `docs/cocina-api.md`). Con su contador y su aviso en línea al pasarse del tope, y unas ideas que
 * se suman al texto con un toque. El tope lo cuenta igual que el servidor: sin los espacios de las
 * puntas (`largoDeInstruccion`).
 */
function InstruccionAlChef({ valor, onCambiar }: { valor: string; onCambiar: (valor: string) => void }) {
  const id = useId()
  const largo = largoDeInstruccion(valor)
  const pasada = largo > MAX_INSTRUCCION
  const cerca = !pasada && largo >= MAX_INSTRUCCION * 0.9

  function sumar(ejemplo: string) {
    const actual = valor.trimEnd()
    if (!actual) return onCambiar(ejemplo)
    onCambiar(`${actual}${/[.!?…»]$/.test(actual) ? '' : '.'} ${ejemplo}`)
  }

  return (
    <Panel
      title="4. Tu instrucción al chef"
      hint="Opcional. Lo que le dirías al chef al pasarle el material: la duración, el tono, qué destacar o qué evitar."
    >
      <label htmlFor={`${id}texto`} className="sr-only">
        Tu instrucción al chef
      </label>
      <Textarea
        id={`${id}texto`}
        rows={4}
        value={valor}
        onChange={(e) => onCambiar(e.target.value)}
        placeholder="Por ejemplo: «Quiero que este contenido sea formato bajo 30 segundos.»"
        aria-invalid={pasada || undefined}
        aria-describedby={`${id}cuenta ${id}error`}
        className={cn('max-w-2xl', pasada && 'border-negative/70 focus:border-negative')}
      />
      <div className="mt-1 flex max-w-2xl flex-wrap items-start justify-between gap-x-4 gap-y-1">
        <p className="text-[0.72rem] text-fg-faint">El chef la lee tal cual, junto con tu material y tu marca.</p>
        <span
          id={`${id}cuenta`}
          className={cn('font-mono text-[0.72rem] tabular-nums', pasada ? 'text-negative' : cerca ? 'text-caution' : 'text-fg-faint')}
        >
          {largo} / {MAX_INSTRUCCION}
        </span>
      </div>
      <p id={`${id}error`} role="alert" className="mt-1 max-w-2xl text-sm text-negative empty:hidden">
        {pasada ? INSTRUCCION_LARGA : null}
      </p>

      <p className="mt-4 text-xs text-fg-muted">Ideas para empezar: un toque las suma a lo que escribiste.</p>
      <ul className="mt-2 flex max-w-2xl flex-wrap gap-2">
        {EJEMPLOS_DE_INSTRUCCION.map((ejemplo) => {
          const yaEsta = valor.includes(ejemplo)
          const noCabe = largo + ejemplo.length + 2 > MAX_INSTRUCCION
          return (
            <li key={ejemplo}>
              <button
                type="button"
                onClick={() => sumar(ejemplo)}
                disabled={yaEsta || noCabe}
                className="rounded-full border border-acero-600 px-3 py-1 text-left text-xs text-fg-muted transition hover:border-brasa hover:text-fg disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-acero-600 disabled:hover:text-fg-muted"
              >
                <span aria-hidden className="mr-1 text-brasa">+</span>
                {ejemplo}
              </button>
            </li>
          )
        })}
      </ul>
    </Panel>
  )
}
