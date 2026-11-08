import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { AppState, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { MusicaInstagramBloque } from '../../components/musica-instagram'
import { ReglaClave } from '../../components/regla-clave'
import { TikTokOpciones } from '../../components/tiktok-opciones'
import { YoutubeOpciones } from '../../components/youtube-opciones'
import { TiraDeHistorias, VisorDeHistorias } from '../../components/visor-historias'
import { useSelectorFecha } from '../../components/selector-fecha'
import { fechaLegible } from '../../lib/calendario'
import { Boton, BotonTexto, Chip, ErrorConReintento, Miniatura } from '../../components/ui'
import { useSesion } from '../../components/sesion'
import { useColores, useTema } from '../../components/tema'
import { useVentanas } from '../../components/ventana'
import { RechazoApi, SesionCaducada, apiDelete, apiGet, apiPost } from '../../lib/api'
import {
  BORRADOR_NO_EXISTE,
  NO_SE_ABRIO,
  NO_SE_DESCARTO,
  PAUSA_MS,
  SIN_BORRADOR,
  YA_NO_EXISTE,
  cuentasDelBorrador,
  cuerpoDelBorrador,
  fraseDelBorrador,
  tieneContenido,
  type EstadoBorrador,
  type Formulario,
} from '../../lib/borradores'
import { LOS_FIERROS } from '../../lib/tema'
import { anotarCambio } from '../../lib/cambios'
import {
  ARCHIVO_FALTANTE,
  ENVIO_INICIAL,
  MAX_ARCHIVOS,
  SIN_SENAL,
  SIN_SENAL_SUBIDA,
  archivoDelBorrador,
  archivoElegido,
  avisoSinTrial,
  cuentasConTrial,
  describirArchivo,
  estadoSubidas,
  etiquetaCuenta,
  etiquetaEnvio,
  fechaParaElDia,
  hayPendientes,
  notaDeArchivo,
  opcionesDelBorrador,
  proximaHoraEnPunto,
  puedeEnviar,
  reducirEnvio,
  subidos,
  textoConfirmacion,
  vieneMarcada,
  volverASubir,
  type Archivo,
} from '../../lib/publicar'
import { cuentasConMusica, type MusicaInstagram } from '../../lib/musica'
import {
  HISTORIA_SIN_TEXTO_AQUI,
  SIN_CUENTAS_DE_HISTORIA,
  avisosDeHistoria,
  cuentasDeHistoria,
  cuentasQueVan,
  detalleDeHistorias,
  etiquetaProgramar,
  medidasDe,
  moverArchivo,
  opcionesDeHistoria,
  puedeEnviarHistoria,
  type Modo,
} from '../../lib/historias'
import { HISTORIA_SIN_CLAVE_AQUI, hayRegla, reglaInicial, reglaParaEnviar, type ReglaApp } from '../../lib/regla'
import { subirUno } from '../../lib/subir'
import {
  cuentasDeTikTok,
  opcionesTikTok,
  soloFotos,
  tiktokInicial,
  videoMuyLargo,
  type CreadorTikTok,
  type TikTokElegido,
} from '../../lib/tiktok'
import type { BorradorAbierto, CuentaApp } from '../../lib/tipos'
import { cuentasDeYoutube, opcionesYoutube, youtubeInicial, type YoutubeElegido } from '../../lib/youtube'

const MAX_TEXTO = 2200

/**
 * `disponibles` no alcanza para distinguir «todavía no sabemos» de «el dueño no tiene
 * ninguna»: las dos empiezan en una lista vacía. Este estado sí las distingue, para
 * poder dibujar cargando/error/vacío en vez de una fila de chips en blanco que se ve
 * igual en los tres casos.
 */
type EstadoCuentas = { paso: 'cargando' } | { paso: 'error' } | { paso: 'listo'; disponibles: CuentaApp[] }

// El contenedor mide desde su padre y el teclado desde la pantalla; en medio está la
// cabecera. Es el alto estándar de cada sistema —56 en Android, 44 en iOS— porque
// expo-router no reexporta `useHeaderHeight`: confirmar en el teléfono la primera vez.
const ALTO_CABECERA = Platform.OS === 'ios' ? 44 : 56

/**
 * Publicar, el compositor del teléfono. Como el del panel, lo que se escribe se guarda solo
 * como borrador —un rato después del último cambio— y los archivos se suben apenas se
 * eligen, para que el borrador los conserve. Los borradores son los mismos del panel: se
 * abren desde La Parrilla y se siguen en cualquiera de los dos lados. «Programar» convierte
 * el borrador en post y el servidor lo borra; «Descartar» lo borra sin programar.
 */
export default function Publicar() {
  const colores = useColores()
  const { tema } = useTema()
  const { token, salir } = useSesion()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [texto, setTexto] = useState('')
  const [archivos, setArchivosEnPantalla] = useState<Archivo[]>([])
  const [cuentas, setCuentas] = useState<string[]>([])
  // Solo ids de cuentas de Instagram con el interruptor de trial reel encendido. No hay
  // que limpiarlo cuando el chip deja de ofrecerse (sin video, o cuenta desmarcada):
  // `cuentasConTrial` y `opcionesDelBorrador` derivan lo que se ve y lo que viaja a
  // partir de este estado y del resto, así que un id que ya no aplica no se dibuja ni
  // se manda solo.
  const [trial, setTrial] = useState<string[]>([])
  // La canción de «Música de Instagram» por cuenta. Como el trial: lo que se ve y lo que viaja
  // se deriva (`cuentasConMusica`, `opcionesDelBorrador`), así que no se limpia al quitar el video.
  const [musica, setMusica] = useState<Record<string, MusicaInstagram>>({})
  // Lo elegido en el bloque de TikTok de cada cuenta que se tocó o vino de un borrador; las demás
  // se ven como nace el bloque (`tiktokInicial`). Como el trial, no se limpia al desmarcar.
  const [tiktok, setTiktok] = useState<Record<string, TikTokElegido>>({})
  // Lo que dijo `creator_info` de cada cuenta de TikTok: arma el envío y el largo máximo del video.
  const [creadores, setCreadores] = useState<Record<string, CreadorTikTok | null>>({})
  // Lo elegido en el bloque de YouTube de cada cuenta que se tocó o vino de un borrador; las demás
  // se ven como nace el bloque (`youtubeInicial`). Como el de TikTok, no se limpia al desmarcar.
  const [youtube, setYoutube] = useState<Record<string, YoutubeElegido>>({})
  // La respuesta automática por palabra clave. En Historia no viaja, pero queda guardada.
  const [regla, setRegla] = useState<ReglaApp>(() => reglaInicial(null))
  // Cambia al abrir otro borrador o empezar otra publicación: el bloque de la palabra clave se
  // vuelve a armar, abierto si lo que llegó trae una.
  const [generacion, setGeneracion] = useState(0)
  const [cuentasEstado, setCuentasEstado] = useState<EstadoCuentas>({ paso: 'cargando' })
  // Solo cuando ya se supo qué cuentas hay: mientras carga o si falló, no hay ninguna
  // que ofrecer — el estado de arriba es el que distingue esos dos casos de «ninguna».
  // Memoizada: un `[]` nuevo en cada render volvía a disparar los efectos que la usan.
  const disponibles = useMemo(
    () => (cuentasEstado.paso === 'listo' ? cuentasEstado.disponibles : []),
    [cuentasEstado],
  )
  const [fecha, setFecha] = useState<Date>(() => proximaHoraEnPunto(new Date()))
  // Si la fecha la puso alguien (el selector, el «+» de un día, un borrador). La de partida
  // no se guarda en el borrador: ver `cuerpoDelBorrador`.
  const [fechaPuesta, setFechaPuesta] = useState(false)
  // Los diálogos de Android o la hoja de iOS: el mismo `abrir` para las dos.
  const { abrir: abrirSelector, selector } = useSelectorFecha()
  const { preguntar, avisar } = useVentanas()
  const [envio, despachar] = useReducer(reducirEnvio, ENVIO_INICIAL)
  const [aviso, setAviso] = useState<string | null>(null)
  const [abriendo, setAbriendo] = useState(false)
  const [soloEnElPanel, setSoloEnElPanel] = useState<string | null>(null)
  const [estadoBorrador, setEstadoBorrador] = useState<EstadoBorrador>('nada')
  // «Post · Historia». En Historia cada archivo es una historia, en el orden de la lista; el
  // texto, el trial reel y la canción quedan guardados pero no viajan (`historias.ts`).
  const [modo, setModo] = useState<Modo>('post')
  // La historia que se ve en el visor.
  const [actual, setActual] = useState(0)
  // Las cuentas marcadas que van: en Historia, solo las de Instagram y Facebook.
  const van = cuentasQueVan(modo, cuentas, disponibles)

  /* ---- los archivos: se suben apenas se eligen ---- */

  // La lista vive también en un ref: la cola la lee y la cambia entre awaits, y un estado
  // leído desde un cierre viejo pisaría lo que cambió mientras tanto.
  const archivosRef = useRef<Archivo[]>([])
  const enSubida = useRef<{ clave: string; control: AbortController } | null>(null)

  const cambiarArchivos = useCallback((cambio: (lista: Archivo[]) => Archivo[]) => {
    archivosRef.current = cambio(archivosRef.current)
    setArchivosEnPantalla(archivosRef.current)
  }, [])

  /* ---- lo que hay en pantalla, para lo que corre después ---- */

  // El guardado corre un rato después del último cambio, y la cola de subida entre awaits:
  // los dos leen lo de ahora y no lo del render en que empezaron. Se copia después de
  // pintar, porque escribir un ref durante el render no está permitido.
  const formRef = useRef<Formulario>({
    texto,
    cuentas,
    trial,
    musica,
    fecha,
    fechaPuesta,
    archivos,
    historia: false,
    tiktok,
    regla,
    youtube,
  })
  const disponiblesRef = useRef<CuentaApp[]>([])
  useEffect(() => {
    formRef.current = {
      texto,
      cuentas,
      trial,
      musica,
      fecha,
      fechaPuesta,
      archivos: archivosRef.current,
      historia: modo === 'historia',
      tiktok,
      regla,
      youtube,
    }
    disponiblesRef.current = disponibles
  })

  /* ---- la cola de subida ---- */

  /**
   * La cola de subida: de a un archivo, en el orden elegido, hasta que no quede ninguno
   * esperando. Quitar el que sube lo cancela y la cola sigue con el siguiente.
   */
  const bombear = useCallback(async () => {
    if (enSubida.current || !token) return
    for (;;) {
      const siguiente = archivosRef.current.find((a) => a.estado === 'subiendo' && a.local)
      if (!siguiente?.local) return
      const control = new AbortController()
      enSubida.current = { clave: siguiente.clave, control }
      const cambiarEste = (cambio: Partial<Archivo>) =>
        cambiarArchivos((lista) => lista.map((a) => (a.clave === siguiente.clave ? { ...a, ...cambio } : a)))
      try {
        const hecha = await subirUno(
          token,
          siguiente.local,
          (progreso) => cambiarEste({ progreso: Math.min(1, Math.max(0, progreso)) }),
          control.signal,
        )
        if (!control.signal.aborted) cambiarEste({ url: hecha.url, estado: 'listo', progreso: 1 })
      } catch (e) {
        if (e instanceof SesionCaducada) {
          enSubida.current = null
          await salir()
          return
        }
        if (!(e instanceof RechazoApi) && !control.signal.aborted) console.warn('subida:', String(e).slice(0, 300))
        // Cancelado porque se quitó, o porque se vació el formulario: ya no está, y no hay
        // nada que marcar. Si sigue ahí, queda caído para reintentarlo a mano.
        cambiarEste({ estado: 'fallo', error: e instanceof RechazoApi ? e.message : SIN_SENAL_SUBIDA })
      } finally {
        enSubida.current = null
      }
    }
  }, [token, cambiarArchivos, salir])

  /* ---- el borrador ---- */

  const borradorId = useRef<string | null>(null)
  // Lo último que se guardó: un cambio que vuelve a lo mismo no escribe de nuevo.
  const ultimaFirma = useRef<string | null>(null)
  // El guardado en curso, para no mandar dos a la vez ni programar antes de saber el id.
  const enCurso = useRef<Promise<void>>(Promise.resolve())
  const pausa = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Prendido mientras se programa, y de ahí en adelante si el borrador se perdió.
  const quieto = useRef(false)
  const perdido = useRef(false)
  // Si lo que hay en pantalla quedó sin guardar porque el último intento falló.
  const sinGuardar = useRef(false)

  const guardar = useCallback((): Promise<void> => {
    const siguiente = enCurso.current.then(async () => {
      if (quieto.current || !token) return
      const cuerpo = cuerpoDelBorrador(formRef.current)
      const firma = JSON.stringify(cuerpo)
      if ((!borradorId.current && !tieneContenido(cuerpo.texto, cuerpo.media, cuerpo.regla)) || firma === ultimaFirma.current) {
        sinGuardar.current = false
        return
      }
      setEstadoBorrador('guardando')
      try {
        const { id } = await apiPost<{ id: string }>('/api/mobile/borradores', token, {
          ...cuerpo,
          id: borradorId.current,
        })
        borradorId.current = id
        ultimaFirma.current = firma
        sinGuardar.current = false
        // La Parrilla lista los borradores: que se ponga al día cuando se vuelva a ella.
        anotarCambio()
        setEstadoBorrador('guardado')
      } catch (e) {
        if (e instanceof SesionCaducada) {
          await salir()
          return
        }
        if (e instanceof RechazoApi && e.message === BORRADOR_NO_EXISTE) {
          // Se programó o se descartó en otro lado. Recrearlo resucitaría lo que alguien
          // sacó, y programarlo desde acá podría publicarlo dos veces.
          perdido.current = true
          quieto.current = true
          setEstadoBorrador('perdido')
          return
        }
        sinGuardar.current = true
        setEstadoBorrador('error')
      }
    })
    enCurso.current = siguiente
    return siguiente
  }, [token, salir])

  /** Lo pendiente, ya: antes de programar, de cambiar de borrador o de que la app se vaya. */
  const guardarYa = useCallback(async () => {
    if (pausa.current) {
      clearTimeout(pausa.current)
      pausa.current = null
    }
    await guardar()
  }, [guardar])

  // Cada cambio reinicia la espera; cuando se deja de tocar, se guarda.
  const firmaMedia = subidos(archivos)
    .map((m) => m.url)
    .join('\n')
  useEffect(() => {
    if (quieto.current) return
    if (pausa.current) clearTimeout(pausa.current)
    pausa.current = setTimeout(() => {
      pausa.current = null
      void guardar()
    }, PAUSA_MS)
  }, [texto, cuentas, trial, musica, tiktok, youtube, regla, fecha, fechaPuesta, firmaMedia, modo, guardar])

  // Si la app pasa a segundo plano, el sistema puede cerrarla sin avisar: lo pendiente se
  // manda antes. Igual al desmontar, si quedó algo esperando la pausa.
  useEffect(() => {
    const suscripcion = AppState.addEventListener('change', (estado) => {
      if (estado !== 'active' && pausa.current) void guardarYa()
    })
    return () => {
      suscripcion.remove()
      if (pausa.current) void guardarYa()
    }
  }, [guardarYa])

  /** El formulario vacío, como al abrir la app: otra publicación, sin borrador. */
  const reiniciar = useCallback(() => {
    enSubida.current?.control.abort()
    if (pausa.current) {
      clearTimeout(pausa.current)
      pausa.current = null
    }
    const lista = disponiblesRef.current
    const marcadas = lista.filter((c) => vieneMarcada(c, lista)).map((c) => c.id)
    const ahora = proximaHoraEnPunto(new Date())
    cambiarArchivos(() => [])
    setTexto('')
    setCuentas(marcadas)
    setTrial([])
    setMusica({})
    setTiktok({})
    setYoutube({})
    setRegla(reglaInicial(null))
    setGeneracion((g) => g + 1)
    setFecha(ahora)
    setFechaPuesta(false)
    setModo('post')
    setActual(0)
    setAviso(null)
    setSoloEnElPanel(null)
    setEstadoBorrador('nada')
    despachar({ tipo: 'cancelar' })
    borradorId.current = null
    ultimaFirma.current = null
    sinGuardar.current = false
    perdido.current = false
    quieto.current = false
    formRef.current = {
      texto: '',
      cuentas: marcadas,
      trial: [],
      musica: {},
      fecha: ahora,
      fechaPuesta: false,
      archivos: [],
      historia: false,
      tiktok: {},
      regla: reglaInicial(null),
      youtube: {},
    }
  }, [cambiarArchivos])

  /**
   * Antes de dejar lo que hay en pantalla —por otro borrador, por un día nuevo, por «Nueva
   * publicación»—, que quede guardado. Con un archivo que no terminó de subir no se suelta:
   * el borrador lo perdería.
   */
  async function soltar(): Promise<boolean> {
    if (hayPendientes(archivosRef.current)) {
      void avisar(
        'Hay un archivo que no terminó de subir',
        'Espera a que termine, reinténtalo o quítalo antes de dejar esta publicación.',
      )
      return false
    }
    if (perdido.current) return true
    await guardarYa()
    if (!sinGuardar.current) return true
    // Sin cerrar tocando afuera: hay que elegir, como con la alerta del sistema de antes.
    return preguntar({
      titulo: 'No se pudo guardar el borrador',
      detalle: 'Si sigues, lo último que cambiaste se pierde.',
      cancelar: 'Quedarme',
      accion: 'Seguir igual',
      peligro: true,
      cerrable: false,
    })
  }

  /** Lo que llegó de un borrador, en pantalla, ya guardado tal como está. */
  function cargar(b: BorradorAbierto) {
    const lista = b.media.map(archivoDelBorrador)
    const listas = disponiblesRef.current.length > 0 ? disponiblesRef.current : null
    const form: Formulario = {
      texto: b.texto,
      cuentas: cuentasDelBorrador(b.cuentas, listas),
      trial: b.trial,
      musica: b.musica ?? {},
      fecha: b.cuando ? new Date(b.cuando) : proximaHoraEnPunto(new Date()),
      fechaPuesta: Boolean(b.cuando),
      archivos: lista,
      historia: b.historia === true,
      tiktok: b.tiktok ?? {},
      regla: reglaInicial(b.regla),
      youtube: b.youtube ?? {},
    }
    cambiarArchivos(() => lista)
    setModo(form.historia ? 'historia' : 'post')
    setActual(0)
    setTexto(form.texto)
    setCuentas(form.cuentas)
    setTrial(form.trial)
    setMusica(form.musica ?? {})
    setTiktok(form.tiktok ?? {})
    setYoutube(form.youtube ?? {})
    setRegla(form.regla!)
    setGeneracion((g) => g + 1)
    setFecha(form.fecha)
    setFechaPuesta(form.fechaPuesta)
    setSoloEnElPanel(b.soloEnElPanel)
    setEstadoBorrador('abierto')
    borradorId.current = b.id
    formRef.current = form
    ultimaFirma.current = JSON.stringify(cuerpoDelBorrador(form))
  }

  /* ---- lo que llega desde La Parrilla ---- */

  // El «+» de un día llega con ese día, y un borrador de la lista con su id. Los dos traen
  // una marca `n` que cambia en cada toque: se atiende una vez por marca. Cada vez es otra
  // publicación; lo que había en pantalla queda en los borradores.
  const { dia, borrador, n } = useLocalSearchParams<{ dia?: string; borrador?: string; n?: string }>()
  const atendida = useRef<string | undefined>(undefined)

  async function atender(idBorrador: string | null, diaPedido: string | null) {
    if (!(await soltar())) return
    reiniciar()
    if (diaPedido) {
      setFecha(fechaParaElDia(diaPedido, new Date()))
      setFechaPuesta(true)
    }
    if (!idBorrador || !token) return
    setAbriendo(true)
    try {
      cargar(await apiGet<BorradorAbierto>(`/api/mobile/borradores/${encodeURIComponent(idBorrador)}`, token))
    } catch (e) {
      if (e instanceof SesionCaducada) {
        await salir()
        return
      }
      setAviso(e instanceof RechazoApi && e.message === BORRADOR_NO_EXISTE ? YA_NO_EXISTE : NO_SE_ABRIO)
    } finally {
      setAbriendo(false)
    }
  }

  useEffect(() => {
    if (!n || n === atendida.current || !token) return
    atendida.current = n
    void atender(borrador || null, dia || null)
    // Solo cuando llega una marca nueva: `atender` cambia en cada render y la marca ya
    // impide atender dos veces la misma.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n, borrador, dia, token])

  /* ---- las cuentas ---- */

  // La misma regla que la web: con una sola cuenta conectada viene marcada, porque no
  // hay entre qué elegir; con dos o más no viene ninguna (`vieneMarcada`). Si ya hay un
  // borrador en pantalla, se respetan las suyas, sin las que se desconectaron.
  const cargarCuentas = useCallback(async () => {
    if (!token) return
    setCuentasEstado({ paso: 'cargando' })
    let lista: CuentaApp[]
    try {
      ;({ cuentas: lista } = await apiGet<{ cuentas: CuentaApp[] }>('/api/mobile/schedule/accounts', token))
    } catch (e) {
      if (e instanceof SesionCaducada) {
        await salir()
        return
      }
      setCuentasEstado({ paso: 'error' })
      return
    }
    setCuentasEstado({ paso: 'listo', disponibles: lista })
    const hayBorrador = borradorId.current !== null
    setCuentas((antes) =>
      hayBorrador || antes.length > 0
        ? cuentasDelBorrador(antes, lista)
        : lista.filter((c) => vieneMarcada(c, lista)).map((c) => c.id),
    )
  }, [token, salir])

  useEffect(() => {
    // La regla ve `setCuentasEstado({ paso: 'cargando' })` antes del primer `await`
    // dentro de `cargarCuentas` y no puede saber que es el arranque legítimo del
    // pedido de red, no un `setState` gratuito disparado a ciegas desde el efecto.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void cargarCuentas()
  }, [cargarCuentas])

  /* ---- los controles ---- */

  async function elegir() {
    // En iOS el selector del sistema entrega solo lo que la persona elige y no pide acceso a
    // la galería entera; pedirlo igual sería un permiso de más, que Apple objeta.
    if (Platform.OS !== 'ios') {
      const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (!permiso.granted) {
        setAviso('Sin permiso para ver la galería.')
        return
      }
    }
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      selectionLimit: MAX_ARCHIVOS - archivosRef.current.length,
      // Solo iOS: el iPhone guarda las fotos en HEIC, que el servidor acepta pero Instagram
      // y Facebook rechazan al publicar. «Compatible» las entrega en JPEG. Android lo ignora.
      preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
    })
    if (resultado.canceled) return
    const nuevos: Archivo[] = []
    for (const asset of resultado.assets) {
      const descrito = describirArchivo(asset)
      if ('error' in descrito) {
        setAviso(descrito.error)
        return
      }
      nuevos.push(archivoElegido(descrito, medidasDe(asset)))
    }
    setAviso(null)
    cambiarArchivos((lista) => [...lista, ...nuevos].slice(0, MAX_ARCHIVOS))
    void bombear()
  }

  function quitar(clave: string) {
    if (enSubida.current?.clave === clave) enSubida.current.control.abort()
    cambiarArchivos((lista) => lista.filter((a) => a.clave !== clave))
    setActual((i) => Math.max(0, Math.min(i, archivosRef.current.length - 1)))
  }

  /** «Antes» y «Después» en la tira: la historia que se ve cambia de lugar, y el visor la sigue. */
  function mover(delta: -1 | 1) {
    const clave = archivosRef.current[actual]?.clave
    if (!clave) return
    cambiarArchivos((lista) => moverArchivo(lista, clave, delta))
    setActual(archivosRef.current.findIndex((a) => a.clave === clave))
  }

  function reintentarSubida(clave: string) {
    cambiarArchivos((lista) =>
      lista.map((a) => (a.clave === clave ? { ...a, estado: 'subiendo', progreso: 0, error: null } : a)),
    )
    void bombear()
  }

  function alternarCuenta(id: string) {
    setCuentas(cuentas.includes(id) ? cuentas.filter((c) => c !== id) : [...cuentas, id])
  }

  function elegirMusica(id: string, elegida: MusicaInstagram | null) {
    setMusica((antes) => {
      const { [id]: _quitada, ...resto } = antes
      return elegida ? { ...resto, [id]: elegida } : resto
    })
  }

  /** Lo que se ve en el bloque de YouTube de una cuenta: lo elegido, o como nace. */
  function youtubeDe(c: CuentaApp): YoutubeElegido {
    return youtubeInicial(youtube[c.id])
  }

  /** Lo que se ve en el bloque de TikTok de una cuenta: lo elegido, o como nace. */
  function tiktokDe(c: CuentaApp): TikTokElegido {
    return tiktokInicial(tiktok[c.id], c)
  }

  function alternarTrial(id: string) {
    setTrial(trial.includes(id) ? trial.filter((c) => c !== id) : [...trial, id])
  }

  function elegirFecha() {
    abrirSelector(fecha, (elegida) => {
      setFecha(elegida)
      setFechaPuesta(true)
    })
  }

  async function enviar(ahora: boolean) {
    if (!token) return
    despachar({ tipo: 'crear', ahora })
    // Lo último que se escribió entra al borrador antes: el post sale de él y el servidor lo
    // borra al crearlo. Si la respuesta se pierde y se vuelve a tocar, el borrador ya no
    // está y el servidor no publica dos veces.
    await guardarYa()
    if (perdido.current) {
      despachar({ tipo: 'cancelar' })
      return
    }
    // El guardado falló —sin señal— y no hay borrador del que salga el post: sin él, un toque
    // repetido publicaría dos veces (`SIN_BORRADOR`). Con el botón activo siempre hay qué
    // guardar, así que sin id es que no se pudo.
    if (!borradorId.current) {
      despachar({ tipo: 'rechazado', mensaje: SIN_BORRADOR })
      return
    }
    quieto.current = true
    const media = subidos(archivos).map(({ url, mediaType }) => ({ url, mediaType }))
    const cuando = ahora ? null : fecha.toISOString()
    // Que esta app sabe de música: sin esto el servidor le suma la que guardaba el borrador.
    const cuerpo =
      modo === 'historia'
        ? {
            // Sin texto ni opciones de post: una historia no los lleva. Con varios archivos, el
            // servidor arma una historia por archivo, en este orden y en una sola transacción.
            texto: '',
            cuentas: van,
            cuando,
            ahora,
            opciones: opcionesDeHistoria(van),
            media,
            secuencia: true,
            borradorId: borradorId.current,
            conMusica: true,
          }
        : {
            texto: texto.trim(),
            cuentas,
            cuando,
            ahora,
            opciones: {
              ...opcionesDelBorrador(disponibles, cuentas, trial, archivos, musica),
              // Cada cuenta de TikTok con lo que su bloque muestra, como lo manda el formulario del panel.
              ...Object.fromEntries(
                cuentasTikTok.map((c) => [c.id, opcionesTikTok(tiktokDe(c), fotos, creadores[c.id] ?? null)]),
              ),
              // Y cada canal de YouTube con lo que su bloque muestra.
              ...Object.fromEntries(cuentasYoutube.map((c) => [c.id, opcionesYoutube(youtubeDe(c))])),
            },
            media,
            regla: reglaParaEnviar(regla),
            borradorId: borradorId.current,
            conMusica: true,
          }
    try {
      await apiPost('/api/mobile/schedule', token, cuerpo)
      despachar({ tipo: 'hecho' })
    } catch (e) {
      quieto.current = false
      if (e instanceof SesionCaducada) {
        await salir()
        return
      }
      if (!(e instanceof RechazoApi)) {
        despachar({ tipo: 'rechazado', mensaje: SIN_SENAL })
        return
      }
      if (e.message === BORRADOR_NO_EXISTE) {
        perdido.current = true
        quieto.current = true
        setEstadoBorrador('perdido')
        despachar({ tipo: 'cancelar' })
        return
      }
      if (e.message === ARCHIVO_FALTANTE) {
        cambiarArchivos(volverASubir)
        void bombear()
      }
      despachar({ tipo: 'rechazado', mensaje: e.message })
    }
  }

  function programar() {
    void enviar(false)
  }

  function publicarAhora() {
    const elegidas = disponibles.filter((c) => van.includes(c.id))
    const detalle =
      modo === 'historia'
        ? `${textoConfirmacion(elegidas)} ${detalleDeHistorias(archivos.length)}`
        : textoConfirmacion(elegidas)
    void preguntar({ titulo: 'Publicar ahora', detalle, cancelar: 'Cancelar', accion: 'Publicar' }).then(
      (si) => {
        if (si) void enviar(true)
      },
    )
  }

  async function nueva() {
    if (await soltar()) reiniciar()
  }

  function descartar() {
    void preguntar({
      titulo: 'Descartar',
      detalle: '¿Descartar este borrador? Lo escrito y los archivos elegidos se pierden.',
      cancelar: 'Cancelar',
      accion: 'Descartar',
      peligro: true,
    }).then((si) => {
      if (si) void descartarYa()
    })
  }

  async function descartarYa() {
    quieto.current = true
    if (pausa.current) {
      clearTimeout(pausa.current)
      pausa.current = null
    }
    await enCurso.current
    const id = borradorId.current
    reiniciar()
    if (!id || !token) return
    try {
      await apiDelete(`/api/mobile/borradores/${encodeURIComponent(id)}`, token)
      anotarCambio()
    } catch (e) {
      if (e instanceof SesionCaducada) {
        await salir()
        return
      }
      setAviso(NO_SE_DESCARTO)
    }
  }

  // Tras «hecho»: se vacía el formulario y se salta a La Parrilla, que refresca al
  // recibir foco porque anotamos el cambio. Un efecto y no un `if` en el render:
  // navegar es un efecto secundario.
  useEffect(() => {
    if (envio.paso !== 'hecho') return
    anotarCambio()
    // La espera es la confirmación: limpiar y navegar en el mismo tick borraba
    // «Listo» antes de que alcanzara a dibujarse, y el envío terminaba sin acuse.
    const salto = setTimeout(() => {
      reiniciar()
      router.navigate('/(tabs)')
    }, 1000)
    return () => clearTimeout(salto)
  }, [envio.paso, router, reiniciar])

  // 'hecho' también cuenta: durante el segundo que se ve «Listo» la pantalla ya no
  // acepta nada, para que un toque de más no despache el mismo post dos veces.
  const ocupado = envio.paso === 'creando' || envio.paso === 'hecho' || abriendo
  const etiqueta = etiquetaEnvio(envio)
  const error = envio.paso === 'listo' ? envio.error : null
  const subidas = estadoSubidas(archivos)
  const esHistoria = modo === 'historia'
  // Lo que se avisa de cada historia, según adónde va: la foto que no es JPG solo importa en Instagram.
  const redesQueVan = new Set(disponibles.filter((c) => van.includes(c.id)).map((c) => c.red))
  const avisos = esHistoria
    ? archivos.map((a) => avisosDeHistoria(a, redesQueVan.has('instagram'), redesQueVan.has('facebook')))
    : []
  const bloqueada = avisos.some((lista) => lista.some((a) => a.bloquea))
  const fotos = soloFotos(archivos)
  const cuentasTikTok = esHistoria ? [] : cuentasDeTikTok(disponibles, cuentas)
  const cuentasYoutube = esHistoria ? [] : cuentasDeYoutube(disponibles, cuentas)
  // Un video más largo de lo que la cuenta de TikTok publica apaga «Programar»: TikTok lo
  // rechazaría después de subirlo (lo dice el bloque, en rojo).
  const tiktokMuyLargo = cuentasTikTok.some((c) => videoMuyLargo(archivos, creadores[c.id] ?? null) !== null)
  const sePuedeEnviar =
    (esHistoria
      ? puedeEnviarHistoria(archivos.length, van.length, bloqueada)
      : puedeEnviar(texto, archivos.length, cuentas.length) && !tiktokMuyLargo) &&
    !hayPendientes(archivos) &&
    soloEnElPanel === null &&
    estadoBorrador !== 'perdido'
  const hayAlgo = texto.trim() !== '' || archivos.length > 0 || estadoBorrador !== 'nada'
  const mostradas = esHistoria ? cuentasDeHistoria(disponibles) : disponibles
  const enVisor = Math.min(actual, Math.max(0, archivos.length - 1))

  return (
    // `height` es el `behavior` de Android: la app dibuja de borde a borde, así que la
    // ventana ya no se encoge sola al abrir el teclado y el texto largo dejaba
    // «Programar» y «Publicar ahora» debajo de las teclas. En iOS corresponde `padding`.
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={insets.top + ALTO_CABECERA}
      style={{ flex: 1, backgroundColor: colores.fondo }}
    >
      <ScrollView
        style={{ flex: 1, backgroundColor: colores.fondo }}
        contentContainerStyle={{ padding: 16, paddingBottom: 48, gap: 14 }}
        keyboardShouldPersistTaps="handled"
      >
        {abriendo ? <Text style={{ color: colores.suave, fontSize: 12 }}>Abriendo borrador…</Text> : null}
        {soloEnElPanel ? <Text style={{ color: colores.ambar, fontSize: 13 }}>{soloEnElPanel}</Text> : null}

        <SelectorDeModo modo={modo} onCambiar={setModo} deshabilitado={ocupado} />

        {esHistoria ? (
          <>
            {archivos.length > 0 ? (
              <>
                <VisorDeHistorias
                  archivos={archivos}
                  indice={enVisor}
                  onIndice={setActual}
                  avisos={avisos}
                  notas={archivos.map((_, i) => notaDeArchivo(archivos, i))}
                  onTocar={(i) => {
                    const a = archivos[i]
                    return a?.estado === 'fallo' && !ocupado ? () => reintentarSubida(a.clave) : undefined
                  }}
                />
                <TiraDeHistorias
                  archivos={archivos}
                  indice={enVisor}
                  onElegir={setActual}
                  onQuitar={ocupado ? undefined : quitar}
                  hayAvisos={avisos.map((lista) => lista.length > 0)}
                />
                {archivos.length > 1 ? (
                  <View style={{ flexDirection: 'row', gap: 20, alignItems: 'center' }}>
                    <Text style={{ color: colores.tenue, fontSize: 12 }}>
                      La {enVisor + 1} sale {enVisor === 0 ? 'primero' : `después de la ${enVisor}`}.
                    </Text>
                    <BotonTexto texto="← Antes" onPress={() => mover(-1)} deshabilitado={ocupado || enVisor === 0} />
                    <BotonTexto
                      texto="Después →"
                      onPress={() => mover(1)}
                      deshabilitado={ocupado || enVisor === archivos.length - 1}
                    />
                  </View>
                ) : null}
              </>
            ) : (
              <Text style={{ color: colores.tenue, fontSize: 12 }}>
                Cada foto o video es una historia, en 9:16. Con varios, salen una detrás de otra, en el orden de la tira.
              </Text>
            )}
            {archivos.length < MAX_ARCHIVOS && !ocupado ? (
              <View style={{ flexDirection: 'row' }}>
                <Chip texto="+ Fotos o video" activo={false} onPress={() => void elegir()} />
              </View>
            ) : null}
            {texto.trim() !== '' ? <Text style={{ color: colores.tenue, fontSize: 11 }}>{HISTORIA_SIN_TEXTO_AQUI}</Text> : null}
            {hayRegla(regla) ? <Text style={{ color: colores.tenue, fontSize: 11 }}>{HISTORIA_SIN_CLAVE_AQUI}</Text> : null}
          </>
        ) : (
          <>
            <TextInput
              value={texto}
              onChangeText={setTexto}
              multiline
              maxLength={MAX_TEXTO}
              editable={!ocupado}
              placeholder="Texto del post…"
              placeholderTextColor={colores.tenue}
              style={{
                backgroundColor: colores.tarjeta,
                color: colores.texto,
                borderRadius: 12,
                padding: 14,
                minHeight: 120,
                textAlignVertical: 'top',
              }}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: colores.tenue, fontSize: 11 }}>En YouTube el primer renglón es el título</Text>
              <Text style={{ color: colores.tenue, fontSize: 11 }}>
                {texto.length} / {MAX_TEXTO}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
              {archivos.map((a, i) => (
                <Miniatura
                  key={a.clave}
                  uri={a.vista}
                  esVideo={a.mediaType === 'video'}
                  nota={notaDeArchivo(archivos, i)}
                  onTocar={a.estado === 'fallo' && !ocupado ? () => reintentarSubida(a.clave) : undefined}
                  onQuitar={ocupado ? undefined : () => quitar(a.clave)}
                />
              ))}
              {archivos.length < MAX_ARCHIVOS && !ocupado ? (
                <Chip texto="+ Fotos o video" activo={false} onPress={() => void elegir()} />
              ) : null}
            </View>
          </>
        )}

        {cuentasEstado.paso === 'cargando' ? (
          <Text style={{ color: colores.tenue, fontSize: 12 }}>Cargando cuentas…</Text>
        ) : cuentasEstado.paso === 'error' ? (
          <ErrorConReintento mensaje="No se pudieron cargar las cuentas." onReintentar={() => void cargarCuentas()} />
        ) : disponibles.length === 0 ? (
          // Cierto tanto si no hay ninguna cuenta como si la única que hay es de una
          // red que el teléfono no ofrece (hoy, las de «Próximamente»): el endpoint ya
          // las filtró, y desde acá no se puede distinguir un caso del otro.
          <Text style={{ color: colores.tenue, fontSize: 12 }}>
            No hay ninguna cuenta lista para publicar desde el teléfono. Conéctala en el panel
            web, en {LOS_FIERROS[tema]}.
          </Text>
        ) : esHistoria && mostradas.length === 0 ? (
          <Text style={{ color: colores.tenue, fontSize: 12 }}>
            {SIN_CUENTAS_DE_HISTORIA} Conéctala en el panel web, en {LOS_FIERROS[tema]}.
          </Text>
        ) : (
          <>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {mostradas.map((c) =>
                c.conectada ? (
                  <Chip
                    key={c.id}
                    texto={etiquetaCuenta(c)}
                    activo={cuentas.includes(c.id)}
                    onPress={() => alternarCuenta(c.id)}
                    deshabilitado={ocupado}
                  />
                ) : (
                  // No es un `Chip`: nunca se puede tocar, así que no lleva su
                  // `deshabilitado` (que atenúa con opacidad 0.5 un texto ya tenue —
                  // el mismo contraste insuficiente que `corte-programado.tsx` evita para un
                  // estado transitorio, y acá sería uno permanente). Texto a contraste
                  // completo más la palabra que falta, como «reconéctala» en el panel.
                  <View
                    key={c.id}
                    style={{ paddingHorizontal: 12, paddingVertical: 10, minHeight: 44, justifyContent: 'center' }}
                  >
                    <Text style={{ color: colores.texto, fontSize: 12 }}>
                      {etiquetaCuenta(c)} · <Text style={{ color: colores.rojo }}>reconéctala</Text>
                    </Text>
                  </View>
                ),
              )}
            </View>
            {van.length === 0 ? (
              <Text style={{ color: colores.tenue, fontSize: 11 }}>
                {esHistoria ? 'Elige al menos una cuenta de Instagram o Facebook.' : 'Elige al menos una cuenta.'}
              </Text>
            ) : null}
            {!esHistoria && cuentasConTrial(disponibles, cuentas, archivos).length > 0 ? (
              <>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {cuentasConTrial(disponibles, cuentas, archivos).map((c) => (
                    <Chip
                      key={`trial:${c.id}`}
                      texto={`Trial reel · ${c.handle ?? 'sin nombre'}`}
                      activo={trial.includes(c.id)}
                      onPress={() => alternarTrial(c.id)}
                      deshabilitado={ocupado}
                    />
                  ))}
                </View>
                <Text style={{ color: colores.tenue, fontSize: 11 }}>
                  Un trial reel solo lo ven quienes no te siguen. Tú decides desde Instagram cuándo
                  compartirlo con todos.
                </Text>
                {/* Las cuentas donde Meta ya rechazó uno, con la frase del rechazo. */}
                {cuentasConTrial(disponibles, cuentas, archivos)
                  .filter((c) => c.trialReels === 'no')
                  .map((c) => (
                    <Text key={`sin-trial:${c.id}`} style={{ color: colores.ambar, fontSize: 11 }}>
                      {avisoSinTrial(c.trialReelsMotivo)}
                    </Text>
                  ))}
              </>
            ) : null}
            {(esHistoria ? [] : cuentasConMusica(disponibles, cuentas, archivos)).map((c) => (
              <MusicaInstagramBloque
                key={`musica:${c.id}`}
                cuenta={c}
                elegida={musica[c.id] ?? null}
                onElegir={(m) => elegirMusica(c.id, m)}
                texto={texto}
                deshabilitado={ocupado}
              />
            ))}
            {cuentasTikTok.map((c) => (
              <TikTokOpciones
                key={`tiktok:${c.id}`}
                cuenta={c}
                elegido={tiktokDe(c)}
                onCambiar={(e) => setTiktok((antes) => ({ ...antes, [c.id]: e }))}
                onCreador={(creador) => setCreadores((antes) => ({ ...antes, [c.id]: creador }))}
                fotos={fotos}
                archivos={archivos}
                deshabilitado={ocupado}
              />
            ))}
            {cuentasYoutube.map((c) => (
              <YoutubeOpciones
                // Con la generación: un borrador que se abre arma el bloque de nuevo, con su playlist.
                key={`youtube:${c.id}:${generacion}`}
                cuenta={c}
                elegido={youtubeDe(c)}
                onCambiar={(e) => setYoutube((antes) => ({ ...antes, [c.id]: e }))}
                deshabilitado={ocupado}
              />
            ))}
          </>
        )}

        {/* Como en el compositor del panel: después de las cuentas y sus opciones, antes de la fecha. */}
        {esHistoria ? null : <ReglaClave key={generacion} regla={regla} onCambiar={setRegla} deshabilitado={ocupado} />}

        <Chip texto={`Cuándo: ${fechaLegible(fecha)}`} activo onPress={elegirFecha} deshabilitado={ocupado} />

        {aviso ? <Text style={{ color: colores.rojo }}>{aviso}</Text> : null}
        {/* Lo que apaga «Programar» en una historia, dicho acá también: puede estar en otra del visor. */}
        {avisos.flatMap((lista, i) =>
          lista
            .filter((a) => a.bloquea)
            .map((a) => (
              <Text key={`bloquea:${i}:${a.texto}`} style={{ color: colores.rojo }}>
                {archivos.length > 1 ? `La ${i + 1}: ${a.texto}` : a.texto}
              </Text>
            )),
        )}
        {error ? <Text style={{ color: colores.rojo }}>{error}</Text> : null}
        {subidas ? <Text style={{ color: subidas.error ? colores.rojo : colores.suave }}>{subidas.texto}</Text> : null}
        {etiqueta ? <Text style={{ color: colores.suave }}>{etiqueta}</Text> : null}

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Boton
            texto={etiquetaProgramar(modo, archivos.length)}
            onPress={programar}
            deshabilitado={ocupado || !sePuedeEnviar}
          />
          <Boton
            texto="Publicar ahora"
            onPress={publicarAhora}
            deshabilitado={ocupado || !sePuedeEnviar}
            destacado
          />
        </View>

        <Text
          style={{
            color: estadoBorrador === 'error' || estadoBorrador === 'perdido' ? colores.rojo : colores.tenue,
            fontSize: 11,
          }}
        >
          {fraseDelBorrador(estadoBorrador, tema)}
        </Text>
        {hayAlgo ? (
          <View style={{ flexDirection: 'row', gap: 20 }}>
            <BotonTexto texto="Nueva publicación" onPress={() => void nueva()} deshabilitado={ocupado} />
            {estadoBorrador === 'perdido' ? null : (
              <BotonTexto texto="Descartar" onPress={descartar} deshabilitado={ocupado} peligro />
            )}
          </View>
        ) : null}
      </ScrollView>
      {selector}
    </KeyboardAvoidingView>
  )
}

/**
 * «Post · Historia», arriba de todo: dos botones grandes, el elegido lleno de brasa. Cambiar no
 * borra nada: el texto, el trial reel y la canción quedan para cuando se vuelva a Post.
 */
function SelectorDeModo({
  modo,
  onCambiar,
  deshabilitado,
}: {
  modo: Modo
  onCambiar: (m: Modo) => void
  deshabilitado: boolean
}) {
  const colores = useColores()
  const opciones: { valor: Modo; texto: string }[] = [
    { valor: 'post', texto: 'Post' },
    { valor: 'historia', texto: 'Historia' },
  ]
  return (
    <View style={{ flexDirection: 'row', gap: 8 }} accessibilityRole="radiogroup">
      {opciones.map((o) => {
        const elegido = modo === o.valor
        return (
          <Pressable
            key={o.valor}
            onPress={() => onCambiar(o.valor)}
            disabled={deshabilitado}
            accessibilityRole="radio"
            accessibilityState={{ checked: elegido, disabled: deshabilitado }}
            style={({ pressed }) => ({
              flex: 1,
              minHeight: 48,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: elegido ? colores.brasa : colores.velo + '29',
              backgroundColor: elegido ? colores.brasa : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: deshabilitado ? 0.5 : pressed ? 0.7 : 1,
            })}
          >
            <Text style={{ color: elegido ? colores.fondo : colores.texto, fontSize: 15, fontWeight: '600' }}>
              {o.texto}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}
