'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { startTransition, useActionState, useEffect, useId, useMemo, useRef, useState } from 'react'
import {
  createScheduledPost,
  descartarBorrador,
  guardarBorradorAccion,
  type FormState,
} from '@/app/admin/actions'
import { DeNocheYDeDia, NombreDe } from '@/components/de-noche-y-de-dia'
import { Icon } from '@/components/icon'
import { Button, Field, GroupLabel, Input, Textarea } from '@/components/ui'
import {
  camposDesdeFormulario,
  fechaParaDia,
  instagramTrialInicial,
  primero,
  reglaInicial,
  tieneContenido,
  tiktokInicial,
  type Campos,
} from '@/lib/borrador'
import type { CuentaRow } from '@/lib/posts-kpis'
import { REDES_PROXIMAMENTE, networkLabel } from '@/lib/networks'
import { calorDelDia, estadoDelFierro, type Calor, type Fierro, type Sello } from '@/lib/parrilla'
import { addDays, dayKey, dayLabelConMes, mondayOfKey } from '@/lib/schedule-week'
import { subirUno, type MediaSubida } from '@/lib/subida-directa'
import type { Tema } from '@/lib/tema'
import { cn, toZonedInput } from '@/lib/utils'
import { SE_ENFRIA, cortes as cortesEnPalabras } from '@/lib/vocabulario'
import { TablaDeArchivos } from './archivos'
import { InstagramOpciones } from './instagram-opciones'
import { PanelLateral } from './panel-lateral'
import { ReglaClave } from './regla-clave'
import { RevisionMedia } from './revision-media'
import { formatoConLoQueSube, fraseDeLlegada, llenadoDe, siguienteEnCola, tipoDe, type Subida } from './subidas'
import { TikTokOpciones } from './tiktok-opciones'
import { venceAntesDe } from './vence'
import { VistaPrevia } from './vista-previa'

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
  const consejo = (tema: Tema) =>
    calor === 'apagada'
      ? `Ese día está ${tema === 'dia' ? 'vacío' : 'apagado'}. Buen lugar para este.`
      : calor === 'llena'
        ? `Ese día ya va lleno, con ${cortes}. Mira si te sirve uno más flojo.`
        : `Ese día ya tiene ${cortesEnPalabras(cortes, tema)}.`

  return (
    <p className="mt-1.5 flex items-center gap-2 text-[0.72rem] text-fg-muted">
      <span className={cn('grilla h-3 w-6 shrink-0', CLASE_CALOR[calor])} aria-hidden />
      <span>
        <DeNocheYDeDia noche={consejo('noche')} dia={consejo('dia')} />
      </span>
    </p>
  )
}

const CLASE_CALOR: Record<Calor, string> = {
  apagada: 'grilla-apagada',
  prendida: 'grilla-prendida',
  llena: 'grilla-llena',
}

/** El fierro de cada ficha de cuenta: las mismas clases que en Los Fierros. */
const CLASE_FIERRO: Record<Fierro, string> = {
  'al-rojo': 'fierro-al-rojo',
  enfriandose: 'fierro-enfriandose',
  frio: 'fierro-frio',
}

/** El calor de cada día de la semana en chico, para el lector de pantalla. */
const PALABRA_CALOR: Record<Tema, Record<Calor, string>> = {
  noche: { apagada: 'apagada', prendida: 'prendida', llena: 'llena' },
  dia: { apagada: 'vacía', prendida: 'con piezas', llena: 'llena' },
}

/** Los días que muestra la semana en chico, desde hoy. */
const DIAS_A_LA_VISTA = 7

/**
 * Adónde vuelve el compositor al programar: la vista de la que vino, con el aviso de
 * «programado» y el post recién puesto (`nuevo`) para que se encienda en su día. En la semana
 * se pasa a la del día elegido, y en la vista «Día» a ese día: si no, el corte caería fuera de
 * la vista y no se vería dónde.
 */
export function hrefDeVuelta(listoHref: string, id: string | undefined, dia: string | null): string {
  if (!id) return listoHref
  const url = new URL(listoHref, 'https://x')
  url.searchParams.set('nuevo', id)
  if (dia && /^\d{4}-\d{2}-\d{2}$/.test(dia)) {
    const vista = url.searchParams.get('vista')
    if (vista === 'dia') url.searchParams.set('fecha', dia)
    else if (vista !== 'lista') url.searchParams.set('semana', mondayOfKey(dia))
  }
  return `${url.pathname}?${url.searchParams.toString()}`
}

/** El formato en palabras, para «Así va a quedar». */
function formaEnPalabras(formato: string, huesos: number): string {
  if (formato === 'entrana') return 'Un video'
  if (formato === 'tira') return `Un carrusel de ${huesos}`
  if (formato === 'bife') return 'Una foto'
  return 'Solo texto'
}

/**
 * A quién va, en palabras: «A Instagram y TikTok.». Con dos cuentas de la misma red, cada una
 * con su nombre, para que se sepa cuál; sin ninguna, que falta elegir.
 */
export function destinosEnPalabras(cuentas: ReadonlyArray<{ network: string; handle: string | null }>): string {
  if (cuentas.length === 0) return 'Todavía sin cuenta: elige al menos una.'
  const repetidas = new Set(cuentas.map((c) => c.network).filter((red, i, todas) => todas.indexOf(red) !== i))
  const nombres = cuentas.map((c) =>
    repetidas.has(c.network) && c.handle ? `${networkLabel(c.network)} · ${c.handle}` : networkLabel(c.network),
  )
  const lista = nombres.length === 1 ? nombres[0] : `${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}`
  return `A ${lista}.`
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
  zona,
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
  /** La zona del dueño: la de la fecha del campo, de la semana en chico y de los vencimientos. */
  zona: string
}) {
  const router = useRouter()
  const captionId = useId()
  const campos = borrador?.campos ?? null

  // Cuentas cuya red todavía publica desde aquí. Una cuenta de una red que no está en
  // `ENABLED`, o que está en «Próximamente» (`REDES_PROXIMAMENTE`), no se ofrece, esté o no
  // conectada.
  const publicables = cuentas.filter((c) => ENABLED.has(c.network) && !REDES_PROXIMAMENTE.has(c.network))
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
  // Todas las marcadas, para la marca de cada una en «Así va a quedar».
  const [marcadas, setMarcadas] = useState<ReadonlySet<string>>(
    () => new Set(publicables.filter((c) => marcadaAlAbrir(c)).map((c) => c.id)),
  )

  // La media ya subida, en el orden del carrusel. Los `File` de lo que se eligió en esta
  // sesión se guardan aparte solo para medirlos: lo que vino de un borrador no tiene `File`.
  const [media, setMedia] = useState<MediaSubida[]>(borrador?.media ?? [])
  const mediaRef = useRef(media)
  const [locales, setLocales] = useState<Record<string, File>>({})
  // Lo elegido que todavía no es media: espera, sube o no llegó (`subidas.ts`). La acción de
  // programar puede correr con un cierre viejo, así que la cola se lee también de un ref.
  const [subidas, setSubidas] = useState<Subida[]>([])
  const subidasRef = useRef<Subida[]>([])
  const archivos = useRef(new Map<string, File>())
  const [miniaturas, setMiniaturas] = useState<Record<string, string>>({})
  const miniaturasRef = useRef<Record<string, string>>({})
  const enSubida = useRef<{ clave: string; control: AbortController } | null>(null)
  const procesando = useRef(false)
  // La clave de cada archivo elegido: un contador y no `crypto.randomUUID`, que no existe fuera
  // de un contexto seguro (el panel abierto por IP en la red local, por ejemplo).
  const contador = useRef(0)
  const idDeLlenado = useId()
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

  function ponerSubidas(cambio: (antes: Subida[]) => Subida[]) {
    subidasRef.current = cambio(subidasRef.current)
    setSubidas(subidasRef.current)
  }

  function ponerMiniatura(clave: string, url: string | null) {
    const siguientes = { ...miniaturasRef.current }
    if (url) siguientes[clave] = url
    else delete siguientes[clave]
    miniaturasRef.current = siguientes
    setMiniaturas(siguientes)
  }

  // Las miniaturas son URLs `blob:` que el navegador guarda hasta que se sueltan.
  useEffect(() => () => Object.values(miniaturasRef.current).forEach((url) => URL.revokeObjectURL(url)), [])

  /** Los archivos elegidos o soltados: a la cola, con su miniatura, y a subir. */
  function agregar(files: File[]) {
    const nuevas = files.map((file) => {
      contador.current += 1
      const clave = `archivo-${contador.current}`
      archivos.current.set(clave, file)
      ponerMiniatura(clave, URL.createObjectURL(file))
      return { clave, nombre: file.name, tipo: tipoDe(file), estado: 'cola', progreso: 0, error: null } satisfies Subida
    })
    ponerSubidas((antes) => [...antes, ...nuevas])
    void procesar()
  }

  /**
   * Sube lo que está en la cola, de a uno y en orden (`siguienteEnCola`). Cada uno que llega
   * pasa a la media del post —con su miniatura— y se guarda el borrador; si uno no llega, la
   * cola se detiene en él hasta que se reintente o se quite.
   */
  async function procesar() {
    if (procesando.current) return
    procesando.current = true
    try {
      for (let siguiente = siguienteEnCola(subidasRef.current); siguiente; siguiente = siguienteEnCola(subidasRef.current)) {
        const { clave } = siguiente
        const file = archivos.current.get(clave)
        if (!file) {
          ponerSubidas((antes) => antes.filter((s) => s.clave !== clave))
          continue
        }
        const control = new AbortController()
        enSubida.current = { clave, control }
        ponerSubidas((antes) => antes.map((s) => (s.clave === clave ? { ...s, estado: 'subiendo', progreso: 0, error: null } : s)))
        try {
          const subida = await subirUno(
            file,
            (fraccion) => ponerSubidas((antes) => antes.map((s) => (s.clave === clave ? { ...s, progreso: fraccion } : s))),
            control.signal,
          )
          ponerSubidas((antes) => antes.filter((s) => s.clave !== clave))
          archivos.current.delete(clave)
          // La miniatura sigue siendo la misma imagen: ahora la nombra su URL.
          const miniatura = miniaturasRef.current[clave]
          ponerMiniatura(clave, null)
          if (miniatura) ponerMiniatura(subida.url, miniatura)
          setLocales((antes) => ({ ...antes, [subida.url]: file }))
          mediaRef.current = [...mediaRef.current, subida]
          setMedia(mediaRef.current)
          alCambiar()
        } catch (error) {
          // Quitado mientras subía: ya salió de la cola, no hay nada que marcar.
          if (control.signal.aborted) continue
          const frase = error instanceof Error ? error.message : 'No se pudo subir el archivo.'
          ponerSubidas((antes) => antes.map((s) => (s.clave === clave ? { ...s, estado: 'fallo', error: frase } : s)))
        } finally {
          enSubida.current = null
        }
      }
    } finally {
      procesando.current = false
    }
  }

  function quitar(url: string) {
    mediaRef.current = mediaRef.current.filter((m) => m.url !== url)
    setMedia(mediaRef.current)
    const miniatura = miniaturasRef.current[url]
    if (miniatura) {
      URL.revokeObjectURL(miniatura)
      ponerMiniatura(url, null)
    }
    alCambiar()
  }

  /** Lo que todavía no es media: si estaba subiendo, se corta su subida; la cola sigue. */
  function quitarSubida(clave: string) {
    if (enSubida.current?.clave === clave) enSubida.current.control.abort()
    ponerSubidas((antes) => antes.filter((s) => s.clave !== clave))
    archivos.current.delete(clave)
    const miniatura = miniaturasRef.current[clave]
    if (miniatura) {
      URL.revokeObjectURL(miniatura)
      ponerMiniatura(clave, null)
    }
    void procesar()
  }

  function reintentar(clave: string) {
    ponerSubidas((antes) => antes.map((s) => (s.clave === clave ? { ...s, estado: 'cola', progreso: 0, error: null } : s)))
    void procesar()
  }

  function alternar(cuenta: CuentaRow, marcada: boolean) {
    setMarcadas((antes) => {
      const siguientes = new Set(antes)
      if (marcada) siguientes.add(cuenta.id)
      else siguientes.delete(cuenta.id)
      return siguientes
    })
    const setCuentas =
      cuenta.network === 'tiktok' ? setCuentasTikTok : cuenta.network === 'instagram' ? setCuentasInstagram : null
    if (!setCuentas) return
    setCuentas((prev) => (marcada ? [...prev, cuenta] : prev.filter((c) => c.id !== cuenta.id)))
  }

  /* ---- programar ---- */

  const [state, programar, programando] = useActionState(async (prev: FormState, formData: FormData): Promise<FormState> => {
    if (subidasRef.current.some((s) => s.estado === 'fallo')) {
      return { error: 'Un archivo no llegó: reintenta o quítalo antes de programar.' }
    }
    if (subidasRef.current.length > 0) return { error: 'Espera a que terminen de subir los archivos.' }
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
      const diaProgramado = ahora ? dayKey(new Date(), zona) : String(formData.get('scheduledAt') ?? '').slice(0, 10)
      router.replace(hrefDeVuelta(listoHref, resultado.id, diaProgramado), { scroll: false })
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

  // «Así va a quedar»: la silueta con todo lo elegido, una marca por cuenta marcada (fría si su
  // fierro se apagó), cuánta carne llegó y la parrilla del día elegido con este post encima.
  const { formato, huesos } = formatoConLoQueSube(media, subidas)
  const elegidas = publicables.filter((c) => marcadas.has(c.id))
  const ahoraMismo = new Date()
  const fierroDe = (c: CuentaRow): Fierro =>
    estadoDelFierro({ connected: c.connected, expiraEn: c.expiresAt, ultimoError: c.lastSyncError, red: c.network }, ahoraMismo)
  // Las marcadas cuyo permiso vence antes de la hora elegida: así como está, ahí no va a salir.
  const vencenAntes = ahora
    ? []
    : elegidas.flatMap((c) => {
        const vence = venceAntesDe(c, cuando, zona)
        return vence ? [{ cuenta: c, vence }] : []
      })
  const sellosPrevia: Sello[] = elegidas.map((c) =>
    fierroDe(c) === 'frio' || vencenAntes.some((v) => v.cuenta.id === c.id) ? 'frio' : 'pendiente',
  )
  // La semana en chico: hoy y los seis días que siguen, cada uno con su fuego.
  const hoy = dayKey(ahoraMismo, zona)
  const diasALaVista = Array.from({ length: DIAS_A_LA_VISTA }, (_, i) => addDays(hoy, i))

  /** Un día de la semana en chico: ese día, con la hora que ya tenía si todavía no pasó. */
  function elegirDia(dia: string) {
    const hora = cuando.slice(11, 16)
    const conSuHora = hora ? `${dia}T${hora}` : ''
    const yaPaso = conSuHora !== '' && conSuHora <= toZonedInput(new Date(), zona).slice(0, 16)
    setCuando(conSuHora && !yaPaso ? conSuHora : fechaParaDia(dia, new Date(), zona) || conSuHora || cuando)
  }
  const diaElegido = ahora ? null : cuando.slice(0, 10)
  const calorPrevia = calorDelDia((diaElegido && diaElegido.length === 10 ? (carga[diaElegido] ?? 0) : 0) + 1)
  const llegada = fraseDeLlegada(media.length, subidas)
  const frasePrevia = [`${formaEnPalabras(formato, huesos)}.`, destinosEnPalabras(elegidas), llegada].filter(Boolean).join(' ')

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
          <VistaPrevia
            formato={formato}
            huesos={huesos}
            sellos={sellosPrevia}
            llenado={llenadoDe(media.length, subidas)}
            noLlego={subidas.some((sub) => sub.estado === 'fallo')}
            calor={calorPrevia}
            frase={frasePrevia}
            idDeLlenado={`llenado-${idDeLlenado.replace(/[^a-zA-Z0-9_-]/g, '')}`}
          />

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

          <TablaDeArchivos
            media={media}
            subidas={subidas}
            miniaturas={miniaturas}
            onElegir={agregar}
            onQuitarMedia={quitar}
            onQuitarSubida={quitarSubida}
            onReintentar={reintentar}
          />

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
              <div className="flex flex-wrap gap-2">
                {/* Fichas y no casillas: la casilla sigue adentro, para el formulario y el teclado,
                    pero lo que se ve es el fierro de la cuenta, su red y su nombre, y la ficha
                    marcada se enciende. */}
                {publicables.map((cuenta) => {
                  const fierro = fierroDe(cuenta)
                  return (
                    <label
                      key={cuenta.id}
                      className={cn(
                        'inline-flex items-center gap-2 rounded-full border border-acero-600 px-3 py-1.5 text-sm text-fg-muted transition-colors',
                        'has-[:checked]:border-brasa has-[:checked]:bg-brasa/10 has-[:checked]:text-fg',
                        'has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brasa',
                        cuenta.connected ? 'cursor-pointer hover:text-fg' : 'cursor-not-allowed opacity-50',
                      )}
                    >
                      <input
                        type="checkbox"
                        name="cuentas"
                        value={cuenta.id}
                        disabled={!cuenta.connected}
                        defaultChecked={marcadaAlAbrir(cuenta)}
                        onChange={(e) => alternar(cuenta, e.target.checked)}
                        className="sr-only"
                      />
                      <span className={cn('fierro w-3.5 shrink-0', CLASE_FIERRO[fierro])} aria-hidden />
                      <Icon name={cuenta.network} className="h-3.5 w-3.5 shrink-0" />
                      {networkLabel(cuenta.network)} · {cuenta.handle ?? 'sin nombre'}
                      {!cuenta.connected ? (
                        <span className="text-xs text-fg-faint">reconéctala</span>
                      ) : fierro === 'enfriandose' ? (
                        <span className="text-xs text-caution">
                          <DeNocheYDeDia noche={SE_ENFRIA.noche} dia={SE_ENFRIA.dia} />
                        </span>
                      ) : null}
                    </label>
                  )
                })}
              </div>
            )}
            {vencenAntes.map(({ cuenta, vence }) => (
              <p
                key={cuenta.id}
                role="status"
                className="mt-2 rounded-lg border border-caution/40 bg-caution/10 px-3 py-2 text-[0.8rem] text-caution"
              >
                El permiso de {networkLabel(cuenta.network)} · {cuenta.handle ?? 'sin nombre'} vence el{' '}
                {dayLabelConMes(vence.slice(0, 10))} a las {vence.slice(11, 16)}, antes de que salga esto: así no va a
                salir ahí.{' '}
                <Link className="underline" href="/admin/accounts">
                  Reconéctala en <NombreDe ruta="/admin/accounts" />
                </Link>{' '}
                antes, o elige un día anterior.
              </p>
            ))}
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
            {/* La semana en chico: hoy y los seis días que siguen, con el fuego de cada uno. Un
                clic pone ese día en el campo, con la hora que ya tenía si todavía no pasó. Con
                «Ahora» no hay día que elegir. */}
            {ahora ? null : (
              <div className="mt-2 grid max-w-md grid-cols-7 gap-1" role="group" aria-label="Elegir el día">
                {diasALaVista.map((dia) => {
                  const [dow, numero] = dayLabelConMes(dia).split(' ')
                  const cortes = carga[dia] ?? 0
                  const calor = calorDelDia(cortes)
                  const elegido = cuando.slice(0, 10) === dia
                  return (
                    <button
                      key={dia}
                      type="button"
                      aria-pressed={elegido}
                      onClick={() => elegirDia(dia)}
                      className={cn(
                        'flex flex-col items-center gap-1 rounded-lg border px-1 pb-1 pt-1.5 transition-colors',
                        elegido ? 'border-brasa text-fg' : 'border-acero-700 text-fg-muted hover:text-fg',
                      )}
                    >
                      <span className="font-titulo text-[0.62rem] uppercase tracking-[0.08em]">{dia === hoy ? 'hoy' : dow}</span>
                      <span className="font-mono text-[0.78rem] text-fg">{numero}</span>
                      <span className={cn('grilla h-2.5 w-full', CLASE_CALOR[calor])} aria-hidden />
                      <span className="sr-only">
                        <DeNocheYDeDia
                          noche={`${dayLabelConMes(dia)}: ${PALABRA_CALOR.noche[calor]}${cortes > 0 ? `, ${cortesEnPalabras(cortes, 'noche')}` : ''}`}
                          dia={`${dayLabelConMes(dia)}: ${PALABRA_CALOR.dia[calor]}${cortes > 0 ? `, ${cortesEnPalabras(cortes, 'dia')}` : ''}`}
                        />
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
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
            <Button type="submit" variant="primary" disabled={programando || subidas.length > 0 || estado === 'perdido'}>
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
