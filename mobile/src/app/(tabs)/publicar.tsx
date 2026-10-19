import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { Alert, AppState, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useSelectorFecha } from '../../components/selector-fecha'
import { Boton, BotonTexto, Chip, ErrorConReintento, Miniatura } from '../../components/ui'
import { useColores } from '../../components/tema'
import { RechazoApi, SesionCaducada, apiDelete, apiGet, apiPost } from '../../lib/api'
import {
  BORRADOR_NO_EXISTE,
  FRASE_BORRADOR,
  NO_SE_ABRIO,
  NO_SE_DESCARTO,
  PAUSA_MS,
  YA_NO_EXISTE,
  cuentasDelBorrador,
  cuerpoDelBorrador,
  tieneContenido,
  type EstadoBorrador,
  type Formulario,
} from '../../lib/borradores'
import { anotarCambio } from '../../lib/cambios'
import {
  ARCHIVO_FALTANTE,
  ENVIO_INICIAL,
  MAX_ARCHIVOS,
  SIN_SENAL,
  SIN_SENAL_SUBIDA,
  archivoDelBorrador,
  archivoElegido,
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
import { clearToken } from '../../lib/session'
import { subirUno } from '../../lib/subir'
import type { BorradorAbierto, CuentaApp } from '../../lib/tipos'
import { useToken } from '../../lib/useToken'

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

function fechaLegible(fecha: Date): string {
  const dd = String(fecha.getDate()).padStart(2, '0')
  const mm = String(fecha.getMonth() + 1).padStart(2, '0')
  const hh = String(fecha.getHours()).padStart(2, '0')
  const mi = String(fecha.getMinutes()).padStart(2, '0')
  return `${dd}/${mm} a las ${hh}:${mi}`
}

/**
 * Publicar, el compositor del teléfono. Como el del panel, lo que se escribe se guarda solo
 * como borrador —un rato después del último cambio— y los archivos se suben apenas se
 * eligen, para que el borrador los conserve. Los borradores son los mismos del panel: se
 * abren desde La Parrilla y se siguen en cualquiera de los dos lados. «Programar» convierte
 * el borrador en post y el servidor lo borra; «Descartar» lo borra sin programar.
 */
export default function Publicar() {
  const colores = useColores()
  const token = useToken()
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
  const [envio, despachar] = useReducer(reducirEnvio, ENVIO_INICIAL)
  const [aviso, setAviso] = useState<string | null>(null)
  const [abriendo, setAbriendo] = useState(false)
  const [soloEnElPanel, setSoloEnElPanel] = useState<string | null>(null)
  const [estadoBorrador, setEstadoBorrador] = useState<EstadoBorrador>('nada')

  const salir = useCallback(async () => {
    await clearToken()
    router.replace('/login')
  }, [router])

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
  const formRef = useRef<Formulario>({ texto, cuentas, trial, fecha, fechaPuesta, archivos })
  const disponiblesRef = useRef<CuentaApp[]>([])
  useEffect(() => {
    formRef.current = { texto, cuentas, trial, fecha, fechaPuesta, archivos: archivosRef.current }
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
      if ((!borradorId.current && !tieneContenido(cuerpo.texto, cuerpo.media)) || firma === ultimaFirma.current) {
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
  }, [texto, cuentas, trial, fecha, fechaPuesta, firmaMedia, guardar])

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
    setFecha(ahora)
    setFechaPuesta(false)
    setAviso(null)
    setSoloEnElPanel(null)
    setEstadoBorrador('nada')
    despachar({ tipo: 'cancelar' })
    borradorId.current = null
    ultimaFirma.current = null
    sinGuardar.current = false
    perdido.current = false
    quieto.current = false
    formRef.current = { texto: '', cuentas: marcadas, trial: [], fecha: ahora, fechaPuesta: false, archivos: [] }
  }, [cambiarArchivos])

  /**
   * Antes de dejar lo que hay en pantalla —por otro borrador, por un día nuevo, por «Nueva
   * publicación»—, que quede guardado. Con un archivo que no terminó de subir no se suelta:
   * el borrador lo perdería.
   */
  async function soltar(): Promise<boolean> {
    if (hayPendientes(archivosRef.current)) {
      Alert.alert(
        'Hay un archivo que no terminó de subir',
        'Espera a que termine, reinténtalo o quítalo antes de dejar esta publicación.',
      )
      return false
    }
    if (perdido.current) return true
    await guardarYa()
    if (!sinGuardar.current) return true
    return new Promise<boolean>((resolve) =>
      Alert.alert(
        'No se pudo guardar el borrador',
        'Si sigues, lo último que cambiaste se pierde.',
        [
          { text: 'Quedarme', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Seguir igual', style: 'destructive', onPress: () => resolve(true) },
        ],
        { cancelable: false },
      ),
    )
  }

  /** Lo que llegó de un borrador, en pantalla, ya guardado tal como está. */
  function cargar(b: BorradorAbierto) {
    const lista = b.media.map(archivoDelBorrador)
    const listas = disponiblesRef.current.length > 0 ? disponiblesRef.current : null
    const form: Formulario = {
      texto: b.texto,
      cuentas: cuentasDelBorrador(b.cuentas, listas),
      trial: b.trial,
      fecha: b.cuando ? new Date(b.cuando) : proximaHoraEnPunto(new Date()),
      fechaPuesta: Boolean(b.cuando),
      archivos: lista,
    }
    cambiarArchivos(() => lista)
    setTexto(form.texto)
    setCuentas(form.cuentas)
    setTrial(form.trial)
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
      nuevos.push(archivoElegido(descrito))
    }
    setAviso(null)
    cambiarArchivos((lista) => [...lista, ...nuevos].slice(0, MAX_ARCHIVOS))
    void bombear()
  }

  function quitar(clave: string) {
    if (enSubida.current?.clave === clave) enSubida.current.control.abort()
    cambiarArchivos((lista) => lista.filter((a) => a.clave !== clave))
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
    quieto.current = true
    try {
      await apiPost('/api/mobile/schedule', token, {
        texto: texto.trim(),
        cuentas,
        cuando: ahora ? null : fecha.toISOString(),
        ahora,
        opciones: opcionesDelBorrador(disponibles, cuentas, trial, archivos),
        media: subidos(archivos).map(({ url, mediaType }) => ({ url, mediaType })),
        borradorId: borradorId.current ?? undefined,
      })
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
    const elegidas = disponibles.filter((c) => cuentas.includes(c.id))
    Alert.alert('Publicar ahora', textoConfirmacion(elegidas), [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Publicar', onPress: () => void enviar(true) },
    ])
  }

  async function nueva() {
    if (await soltar()) reiniciar()
  }

  function descartar() {
    Alert.alert('Descartar', '¿Descartar este borrador? Lo escrito y los archivos elegidos se pierden.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Descartar', style: 'destructive', onPress: () => void descartarYa() },
    ])
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
  const sePuedeEnviar =
    puedeEnviar(texto, archivos.length, cuentas.length) &&
    !hayPendientes(archivos) &&
    soloEnElPanel === null &&
    estadoBorrador !== 'perdido'
  const hayAlgo = texto.trim() !== '' || archivos.length > 0 || estadoBorrador !== 'nada'

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

        {cuentasEstado.paso === 'cargando' ? (
          <Text style={{ color: colores.tenue, fontSize: 12 }}>Cargando cuentas…</Text>
        ) : cuentasEstado.paso === 'error' ? (
          <ErrorConReintento mensaje="No se pudieron cargar las cuentas." onReintentar={() => void cargarCuentas()} />
        ) : disponibles.length === 0 ? (
          // Cierto tanto si no hay ninguna cuenta como si la única que hay es de una
          // red que el teléfono no ofrece (hoy, TikTok): el endpoint ya las filtró, y
          // desde acá no se puede distinguir un caso del otro.
          <Text style={{ color: colores.tenue, fontSize: 12 }}>
            No hay ninguna cuenta lista para publicar desde el teléfono. Conéctala en el panel
            web, en Los Fierros.
          </Text>
        ) : (
          <>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {disponibles.map((c) =>
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
            {cuentas.length === 0 ? (
              <Text style={{ color: colores.tenue, fontSize: 11 }}>Elige al menos una cuenta.</Text>
            ) : null}
            {cuentasConTrial(disponibles, cuentas, archivos).length > 0 ? (
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
              </>
            ) : null}
          </>
        )}

        <Chip texto={`Cuándo: ${fechaLegible(fecha)}`} activo onPress={elegirFecha} deshabilitado={ocupado} />

        {aviso ? <Text style={{ color: colores.rojo }}>{aviso}</Text> : null}
        {error ? <Text style={{ color: colores.rojo }}>{error}</Text> : null}
        {subidas ? <Text style={{ color: subidas.error ? colores.rojo : colores.suave }}>{subidas.texto}</Text> : null}
        {etiqueta ? <Text style={{ color: colores.suave }}>{etiqueta}</Text> : null}

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Boton
            texto="Programar"
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
          {FRASE_BORRADOR[estadoBorrador]}
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
