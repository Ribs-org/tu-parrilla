'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { startTransition, useActionState, useEffect, useId, useMemo, useRef, useState } from 'react'
import { X } from 'lucide-react'
import {
  createScheduledPost,
  descartarBorrador,
  guardarBorradorAccion,
  type FormState,
} from '@/app/admin/actions'
import { Button, Field, GroupLabel, Input, Textarea } from '@/components/ui'
import {
  camposDesdeFormulario,
  instagramTrialInicial,
  primero,
  reglaInicial,
  tieneContenido,
  tiktokInicial,
  type Campos,
} from '@/lib/borrador'
import type { CuentaRow } from '@/lib/posts-kpis'
import { networkLabel } from '@/lib/networks'
import { calorDelDia, type Calor } from '@/lib/parrilla'
import { subirArchivos, type MediaSubida } from '@/lib/subida-directa'
import { cn } from '@/lib/utils'
import { InstagramOpciones } from './instagram-opciones'
import { PanelLateral } from './panel-lateral'
import { ReglaClave } from './regla-clave'
import { RevisionMedia } from './revision-media'
import { TikTokOpciones } from './tiktok-opciones'

// Twin of PUBLISHABLE (publish/batch.ts). NETWORKS in the editor
// (schedule/[id]/editor.tsx) deliberately lacks tiktok: the editor cannot collect
// its options, so that destination is created here or in the batch only.
const ENABLED = new Set(['instagram', 'facebook', 'youtube', 'threads', 'x', 'tiktok'])

/** Cuánto espera el compositor después de la última tecla para guardar el borrador. */
const PAUSA_MS = 1000

/**
 * Si tienes una sola cuenta publicable y conectada, viene marcada: no hay entre qué elegir.
 * Con dos o más no viene ninguna, porque marcar una por ti es exactamente el problema que
 * esta entrega vino a resolver, en pequeño.
 */
export function vieneMarcada(
  cuenta: { id: string; connected: boolean },
  publicables: Array<{ connected: boolean }>,
): boolean {
  return cuenta.connected && publicables.filter((c) => c.connected).length === 1
}

/**
 * Las cuentas publicables de una red que empiezan marcadas: la semilla de `cuentasTikTok`
 * y `cuentasInstagram`. Sin esto, un dueño cuya única cuenta publicable es de esa red ve la
 * casilla marcada por `vieneMarcada` (que sí corre en `defaultChecked`) pero ningún bloque
 * de opciones, porque `alternar` solo corre en `onChange` y eso no se dispara en el primer
 * render — queda sin poder programar nada hasta desmarcar y volver a marcar.
 */
export function cuentasInicialesDe<T extends { id: string; network: string; connected: boolean }>(
  publicables: T[],
  network: string,
): T[] {
  return publicables.filter((c) => c.network === network && vieneMarcada(c, publicables))
}

/**
 * Cómo está la parrilla del día que se eligió.
 *
 * Es la única pieza del compositor que habla antes de que pase algo: el calendario y el
 * fierro describen, esta aconseja. Y aconseja lo que el producto promete —repartir el
 * volumen— en el único momento en que se puede hacer algo al respecto, que es mientras se
 * elige la hora.
 */
function CargaDelDia({ carga, cuando }: { carga: Record<string, number>; cuando: string }) {
  // El campo viene «YYYY-MM-DDTHH:MM» en hora del sitio, o vacío, o a medio escribir.
  const dia = cuando.slice(0, 10)
  if (dia.length !== 10) return null

  const cortes = carga[dia] ?? 0
  const calor = calorDelDia(cortes)

  return (
    <p className="mt-1.5 flex items-center gap-2 text-[0.72rem] text-fg-muted">
      <span className={cn('grilla h-3 w-6 shrink-0', CLASE_CALOR[calor])} aria-hidden />
      {calor === 'apagada'
        ? 'Ese día está apagado. Buen lugar para este.'
        : calor === 'llena'
          ? `Ese día ya va lleno, con ${cortes}. Mira si te sirve uno más flojo.`
          : `Ese día ya tiene ${cortes === 1 ? 'un corte' : `${cortes} cortes`}.`}
    </p>
  )
}

const CLASE_CALOR: Record<Calor, string> = {
  apagada: 'grilla-apagada',
  prendida: 'grilla-prendida',
  llena: 'grilla-llena',
}

type EstadoBorrador = 'nada' | 'guardando' | 'guardado' | 'error' | 'perdido'

const FRASE_BORRADOR: Record<Exclude<EstadoBorrador, 'nada'>, string> = {
  guardando: 'Guardando borrador…',
  guardado: 'Borrador guardado.',
  error: 'No se pudo guardar el borrador.',
  perdido:
    'Este borrador ya no existe: se programó o se descartó en otra pestaña o en el teléfono. Cierra el panel para ver cómo quedó.',
}

/**
 * El compositor, dentro de su panel lateral. Lo que se escribe se guarda solo como borrador
 * —un segundo después de la última tecla, como un correo— y vuelve igual si se abre ese
 * borrador. «Programar» lo convierte en publicación y lo saca de los borradores;
 * «Descartar» lo borra.
 *
 * Los archivos se suben a R2 apenas se eligen y no al programar: un borrador tiene que poder
 * guardarlos. Subirlos dentro del formulario devolvía `413` (Vercel corta los cuerpos de
 * petición en ~4,5 MB; ver `lib/subida-directa` y `docs/deuda-tecnica.md`), así que a las
 * acciones les llegan solo las URLs.
 *
 * Al ser funciones del cliente, este formulario no anda sin JavaScript. Para el panel es
 * aceptable; para la página pública no lo sería.
 */
export function Composer({
  carga,
  cuentas,
  borrador,
  fechaInicial = '',
  cuentaInicial = '',
  listoHref,
  cerrarHref,
}: {
  carga: Record<string, number>
  cuentas: CuentaRow[]
  /** El borrador que se abre; sin él, el formulario nace vacío. */
  borrador?: { id: string; campos: Campos; media: MediaSubida[] } | null
  /** «YYYY-MM-DDTHH:MM» en la zona del dueño: la del borrador, o la del día del calendario. */
  fechaInicial?: string
  /**
   * La cuenta que viene marcada sola, sin borrador: el «+» de una columna de la vista «Día».
   * Una que no está o no está conectada no marca nada, y vale la regla de siempre.
   */
  cuentaInicial?: string
  /** Adónde ir al programar: la parrilla con el aviso de que salió. */
  listoHref: string
  /** Adónde ir al cerrar o descartar. */
  cerrarHref: string
}) {
  const router = useRouter()
  const captionId = useId()
  const campos = borrador?.campos ?? null

  // Cuentas cuya red todavía publica desde aquí. Una cuenta de una red que no está en
  // `ENABLED` no se ofrece, esté o no conectada.
  const publicables = cuentas.filter((c) => ENABLED.has(c.network))
  // Las marcadas al abrir: las del borrador; si no, la que pidió la vista «Día»; si no, la
  // única conectada.
  const pedida = publicables.find((c) => c.id === cuentaInicial && c.connected)
  const marcadaAlAbrir = (cuenta: CuentaRow) =>
    campos
      ? cuenta.connected && (campos.cuentas ?? []).includes(cuenta.id)
      : pedida
        ? cuenta.id === pedida.id
        : vieneMarcada(cuenta, publicables)

  // Con dos cuentas de TikTok marcadas, cada una necesita su propio bloque de opciones. Se
  // siembra con las que nacen marcadas: `onChange` no corre en el primer render para
  // ponerlas de acuerdo. Instagram funciona igual.
  const [cuentasTikTok, setCuentasTikTok] = useState<CuentaRow[]>(() =>
    campos || pedida
      ? publicables.filter((c) => c.network === 'tiktok' && marcadaAlAbrir(c))
      : cuentasInicialesDe(publicables, 'tiktok'),
  )
  const [cuentasInstagram, setCuentasInstagram] = useState<CuentaRow[]>(() =>
    campos || pedida
      ? publicables.filter((c) => c.network === 'instagram' && marcadaAlAbrir(c))
      : cuentasInicialesDe(publicables, 'instagram'),
  )

  // La media ya subida, en el orden del carrusel. Los `File` de lo que se eligió en esta
  // sesión se guardan aparte solo para medirlos: lo que vino de un borrador no tiene `File`.
  const [media, setMedia] = useState<MediaSubida[]>(borrador?.media ?? [])
  const mediaRef = useRef(media)
  const [locales, setLocales] = useState<Record<string, File>>({})
  const [subiendo, setSubiendo] = useState('')
  // La acción de programar puede correr con un cierre viejo: lo que sube se lee de acá.
  const subiendoRef = useRef(false)
  const [errorSubida, setErrorSubida] = useState<string | null>(null)
  const soloFotos = media.length > 0 && media.every((m) => m.mediaType === 'image')
  // Exactamente un video: la única condición bajo la que se monta el bloque de Instagram,
  // porque un trial reel no admite fotos ni carrusel.
  const unVideo = media.length === 1 && media[0]!.mediaType === 'video'
  const archivosParaRevisar = useMemo(
    () => media.map((m) => locales[m.url]).filter((f): f is File => Boolean(f)),
    [media, locales],
  )

  const [cuando, setCuando] = useState(fechaInicial)
  // «Ahora» deja el campo de fecha fuera de juego: la hora la decide el servidor.
  const [ahora, setAhora] = useState(false)

  /* ---- el borrador ---- */

  const formRef = useRef<HTMLFormElement>(null)
  const borradorId = useRef<string | null>(borrador?.id ?? null)
  const [estado, setEstado] = useState<EstadoBorrador>('nada')
  // La foto más reciente del formulario: el guardado del cierre puede correr cuando el
  // formulario ya se desmontó, y entonces es lo único que queda de lo escrito.
  const ultimaFoto = useRef<FormData | null>(null)
  const pausa = useRef<ReturnType<typeof setTimeout> | null>(null)
  // El guardado en curso, para no mandar dos a la vez ni programar antes de saber el id.
  const enCurso = useRef<Promise<void>>(Promise.resolve())
  // Prendido al programar o descartar: desde ahí no se guarda nada más.
  const terminado = useRef(false)
  // Lo último que se guardó: un clic que no cambió nada —poner el cursor en el texto— no
  // vuelve a escribir el mismo borrador.
  const ultimaFirma = useRef<string | null>(null)

  function fotografiar() {
    if (formRef.current) ultimaFoto.current = new FormData(formRef.current)
  }

  function firmaDe(foto: FormData): string {
    return JSON.stringify([camposDesdeFormulario(foto), mediaRef.current])
  }

  // Cada render puede haber cambiado un campo oculto (un interruptor, «Ahora»): la foto se
  // toma después de pintar. El texto que se escribe no rinde, así que eso lo cubre `onInput`.
  // Un borrador recién abierto ya está guardado tal como se pintó la primera vez.
  useEffect(() => {
    fotografiar()
    if (borrador && ultimaFirma.current === null && ultimaFoto.current) {
      ultimaFirma.current = firmaDe(ultimaFoto.current)
    }
  })

  function guardar(): Promise<void> {
    const anterior = enCurso.current
    const siguiente = anterior.then(async () => {
      if (terminado.current) return
      const foto = formRef.current ? new FormData(formRef.current) : ultimaFoto.current
      if (!foto) return
      if (!borradorId.current && !tieneContenido(camposDesdeFormulario(foto), mediaRef.current.length)) return
      const firma = firmaDe(foto)
      if (firma === ultimaFirma.current) return
      foto.set('mediaSubida', JSON.stringify(mediaRef.current))
      if (borradorId.current) foto.set('borradorId', borradorId.current)
      setEstado('guardando')
      try {
        const r = await guardarBorradorAccion(foto)
        if (r.id) {
          borradorId.current = r.id
          ultimaFirma.current = firma
          setEstado('guardado')
        } else if (r.perdido) {
          terminado.current = true
          setEstado('perdido')
        } else {
          setEstado('error')
        }
      } catch {
        setEstado('error')
      }
    })
    enCurso.current = siguiente
    return siguiente
  }

  function alCambiar() {
    if (terminado.current) return
    fotografiar()
    if (pausa.current) clearTimeout(pausa.current)
    pausa.current = setTimeout(() => {
      pausa.current = null
      void guardar()
    }, PAUSA_MS)
  }

  /** Lo pendiente, ya: antes de cerrar o de programar. */
  async function guardarYa() {
    if (pausa.current) {
      clearTimeout(pausa.current)
      pausa.current = null
      await guardar()
    } else {
      await enCurso.current
    }
  }

  // Si el panel se desmonta con algo por guardar —el botón Atrás del navegador, por
  // ejemplo—, se manda igual. Nadie lo espera: la acción viaja aunque el panel ya no esté.
  useEffect(
    () => () => {
      if (pausa.current) {
        clearTimeout(pausa.current)
        void guardar()
      }
    },
    // Solo al desmontar. `guardar` lee refs: el del primer render sirve igual que uno nuevo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  async function cerrar() {
    await guardarYa()
    router.replace(cerrarHref, { scroll: false })
  }

  async function descartar() {
    // Sin borrador y sin nada escrito no hay qué perder: se cierra sin preguntar.
    const foto = formRef.current ? new FormData(formRef.current) : ultimaFoto.current
    const hayAlgo = Boolean(borradorId.current) || (foto ? tieneContenido(camposDesdeFormulario(foto), mediaRef.current.length) : false)
    if (hayAlgo && !window.confirm('¿Descartar este borrador? Lo escrito y los archivos elegidos se pierden.')) return
    terminado.current = true
    if (pausa.current) clearTimeout(pausa.current)
    await enCurso.current
    if (borradorId.current) await descartarBorrador(borradorId.current)
    router.replace(cerrarHref, { scroll: false })
  }

  /* ---- los archivos ---- */

  async function alElegir(input: HTMLInputElement) {
    const files = Array.from(input.files ?? [])
    if (files.length === 0) return
    setErrorSubida(null)
    subiendoRef.current = true
    try {
      const subidos = await subirArchivos(files, (hechos, total) =>
        setSubiendo(total > 1 ? `Subiendo ${hechos} de ${total}…` : 'Subiendo…'),
      )
      const nuevos: Record<string, File> = {}
      subidos.forEach((m, i) => (nuevos[m.url] = files[i]!))
      setLocales((prev) => ({ ...prev, ...nuevos }))
      mediaRef.current = [...mediaRef.current, ...subidos]
      setMedia(mediaRef.current)
      alCambiar()
    } catch (error) {
      setErrorSubida(error instanceof Error ? error.message : 'No se pudo subir el archivo.')
    } finally {
      subiendoRef.current = false
      setSubiendo('')
      // Vaciado para que elegir el mismo archivo otra vez vuelva a disparar `onChange`.
      input.value = ''
    }
  }

  function quitar(url: string) {
    mediaRef.current = mediaRef.current.filter((m) => m.url !== url)
    setMedia(mediaRef.current)
    alCambiar()
  }

  function alternar(cuenta: CuentaRow, marcada: boolean) {
    const setCuentas =
      cuenta.network === 'tiktok' ? setCuentasTikTok : cuenta.network === 'instagram' ? setCuentasInstagram : null
    if (!setCuentas) return
    setCuentas((prev) => (marcada ? [...prev, cuenta] : prev.filter((c) => c.id !== cuenta.id)))
  }

  /* ---- programar ---- */

  const [state, programar, programando] = useActionState(async (prev: FormState, formData: FormData): Promise<FormState> => {
    if (subiendoRef.current) return { error: 'Espera a que terminen de subir los archivos.' }
    // Primero que termine lo que estaba guardando: así se sabe qué borrador sacar, y ningún
    // guardado atrasado vuelve a crear uno después de programar.
    terminado.current = true
    if (pausa.current) {
      clearTimeout(pausa.current)
      pausa.current = null
    }
    await enCurso.current
    formData.set('mediaSubida', JSON.stringify(mediaRef.current))
    if (borradorId.current) formData.set('borradorId', borradorId.current)
    const resultado = await createScheduledPost(prev, formData)
    if (resultado.ok) {
      router.replace(listoHref, { scroll: false })
    } else if (estado !== 'perdido') {
      // No salió: se sigue escribiendo. El guardado que el clic dejó pendiente se canceló
      // arriba, así que se vuelve a pedir: lo del último segundo no se pierde.
      terminado.current = false
      alCambiar()
    }
    return resultado
  }, {})

  // El panel se abre para escribir: el foco va al texto.
  useEffect(() => {
    document.getElementById(captionId)?.focus()
  }, [captionId])

  const reglaGuardada = campos ? reglaInicial(campos) : null

  return (
    <PanelLateral titulo={borrador ? 'Borrador' : 'Nueva publicación'} onCerrar={() => void cerrar()}>
      <form
        ref={formRef}
        // Se envía a mano y no con `action={…}`: con `action`, React vacía los campos del
        // formulario al terminar la acción, también cuando vuelve con un error de validación.
        // Eso borraba lo escrito, y el guardado siguiente pisaba el borrador con el vacío.
        onSubmit={(event) => {
          event.preventDefault()
          const datos = new FormData(event.currentTarget)
          startTransition(() => programar(datos))
        }}
        onInput={alCambiar}
        onChange={alCambiar}
        // Los interruptores son botones: no disparan `input` ni `change`, pero sí un clic.
        onClick={alCambiar}
        className="flex min-h-full flex-col"
      >
        <div className="flex-1 space-y-4 px-5 py-4">
          <Field label="Texto">
            <Textarea
              id={captionId}
              name="caption"
              rows={5}
              maxLength={2200}
              placeholder="Texto del post…"
              defaultValue={campos ? primero(campos, 'caption') : ''}
            />
          </Field>

          <div>
            <Field label="Archivos" hint="Imágenes o video, opcional. Se suben apenas los eliges.">
              <Input
                type="file"
                multiple
                accept="image/*,video/*"
                disabled={Boolean(subiendo)}
                onChange={(event) => void alElegir(event.currentTarget)}
              />
            </Field>
            {media.length > 0 ? (
              <ul className="mt-2 space-y-1">
                {media.map((m, i) => (
                  <li key={m.url} className="flex items-center gap-2 text-[0.8rem] text-fg-muted">
                    <span className="font-mono text-[0.68rem] text-fg-faint">{i + 1}</span>
                    <span className="min-w-0 flex-1 truncate">{m.nombre}</span>
                    <span className="text-[0.68rem] text-fg-faint">{m.mediaType === 'video' ? 'video' : 'imagen'}</span>
                    <button
                      type="button"
                      onClick={() => quitar(m.url)}
                      className="rounded p-0.5 text-fg-faint transition-colors hover:text-fg"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden />
                      <span className="sr-only">Quitar {m.nombre}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            {subiendo ? <p className="mt-2 text-sm text-fg-muted">{subiendo}</p> : null}
            {errorSubida ? <p className="mt-2 text-sm text-negative">{errorSubida}</p> : null}
          </div>

          <RevisionMedia files={archivosParaRevisar} activo={cuentasTikTok.length > 0} />

          <div>
            <GroupLabel>Cuentas</GroupLabel>
            {publicables.length === 0 ? (
              <p className="text-sm text-fg-muted">
                Todavía no tienes cuentas conectadas.{' '}
                <Link className="underline" href="/admin/accounts">
                  Conecta una
                </Link>{' '}
                para poder programar.
              </p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {publicables.map((cuenta) => (
                  <label
                    key={cuenta.id}
                    className={cn('flex items-center gap-2 text-sm', !cuenta.connected && 'opacity-40')}
                  >
                    <input
                      type="checkbox"
                      name="cuentas"
                      value={cuenta.id}
                      disabled={!cuenta.connected}
                      defaultChecked={marcadaAlAbrir(cuenta)}
                      onChange={(e) => alternar(cuenta, e.target.checked)}
                    />
                    {networkLabel(cuenta.network)} · {cuenta.handle ?? 'sin nombre'}
                    {!cuenta.connected && <span className="text-xs text-fg-faint">reconéctala</span>}
                  </label>
                ))}
              </div>
            )}
          </div>

          {cuentasTikTok.map((cuenta) => (
            <TikTokOpciones
              key={cuenta.id}
              cuenta={cuenta}
              soloFotos={soloFotos}
              inicial={campos ? tiktokInicial(campos, cuenta.id) : null}
            />
          ))}

          {unVideo
            ? cuentasInstagram.map((cuenta) => (
                <InstagramOpciones
                  key={cuenta.id}
                  cuenta={cuenta}
                  inicial={campos ? instagramTrialInicial(campos, cuenta.id) : false}
                />
              ))
            : null}

          <ReglaClave inicial={reglaGuardada} />

          <Field label="Fecha y hora">
            <div className="flex flex-wrap items-center gap-2">
              <Input
                type="datetime-local"
                name="scheduledAt"
                required={!ahora}
                disabled={ahora}
                className="max-w-[16rem]"
                value={ahora ? '' : cuando}
                onChange={(event) => setCuando(event.target.value)}
              />
              {/*
                «Ahora» no escribe una hora en el campo: manda una marca y la hora la pone el
                servidor. El reloj del navegador puede ir atrasado, y entonces el minuto que
                sumáramos aquí caería en el pasado del servidor y la validación lo rechazaría.
              */}
              <Button type="button" variant={ahora ? 'primary' : 'ghost'} onClick={() => setAhora(!ahora)}>
                Ahora
              </Button>
              {ahora ? <input type="hidden" name="cuandoAhora" value="on" /> : null}
            </div>
            {/* Con «Ahora» no hay día que mirar: la hora la pone el servidor al enviar. */}
            {ahora ? null : <CargaDelDia carga={carga} cuando={cuando} />}
          </Field>
        </div>

        <div className="sticky bottom-0 space-y-2 border-t border-acero-700 bg-acero-900 px-5 py-3">
          {state.error ? (
            <p role="alert" className="text-sm text-negative">
              {state.error}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-3">
            {/* Con el borrador perdido no se programa: si se programó en otro lado, saldría
                dos veces. */}
            <Button type="submit" variant="primary" disabled={programando || Boolean(subiendo) || estado === 'perdido'}>
              {programando ? 'Programando…' : 'Programar'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => void descartar()}>
              Descartar
            </Button>
            {estado !== 'nada' ? (
              <p
                role="status"
                className={cn(
                  'ml-auto text-[0.72rem]',
                  estado === 'error' || estado === 'perdido' ? 'text-negative' : 'text-fg-faint',
                )}
              >
                {FRASE_BORRADOR[estado]}
              </p>
            ) : null}
          </div>
        </div>
      </form>
    </PanelLateral>
  )
}
