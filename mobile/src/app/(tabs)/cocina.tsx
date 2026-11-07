import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { KeyboardAvoidingView, Platform, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { useFocusEffect } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import {
  Casilla,
  CuotaDeLaCamara,
  EnCurso,
  FilaDeMaterial,
  RielDeLaComanda,
  TarjetaDeComanda,
  TarjetaEnLaCamara,
  VentanaCambiar,
} from '../../components/cocina'
import { useSelectorFecha } from '../../components/selector-fecha'
import { Boton, BotonTexto, Cargando, Chip, ErrorConReintento, Etiqueta, Sello, TIPO_TITULO, Tarjeta } from '../../components/ui'
import { useSesion } from '../../components/sesion'
import { useColores, useTema } from '../../components/tema'
import { useVentanas } from '../../components/ventana'
import { RechazoApi, SesionCaducada, apiDelete, apiGet, apiPatch, apiPost } from '../../lib/api'
import { barrerCopias, conservar, existe, pesoDe, soltarCopia, subirTramo, type Fuente } from '../../lib/archivo-local'
import { armar, diaDe, diaEnPalabras } from '../../lib/calendario'
import {
  CLAVE_PENDIENTES,
  COMO_VIENE,
  EJEMPLOS_DE_INSTRUCCION,
  MAX_ACOMPANAMIENTOS,
  MAX_INSTRUCCION,
  RIEL_VACIO,
  alternarFormato,
  antesEnLaFila,
  cambiarRol,
  colgar,
  cuerpoDeLaComanda,
  faltaParaMandar,
  filtrosDeClase,
  hayEnMarcha,
  leerPendientes,
  lineaDeLaCocina,
  nuevaRef,
  paraLaCamara,
  resumenDeLaComanda,
  rielQueSigue,
  soltar,
  sumarEjemplo,
  type ClaseMaterial,
  type Cocina,
  type MarcaBasica,
  type Material,
  type OpcionesElegidas,
  type Pendiente,
  type Riel,
  type RolDeVideo,
} from '../../lib/cocina'
import { sePuedeGrabar } from '../../lib/grabar'
import { subirALaCamara, type PedidoDeSubida } from '../../lib/subir-por-partes'
import { CAMARA, CAMARA_VACIA, DE_LA_CAMARA, GUARDAR_EN_LA_CAMARA, MESON, SACAR_DE_LA_CAMARA } from '../../lib/tema'
import { useScreenData } from '../../lib/useScreenData'

/** Lo que se está guardando en la cámara desde acá: lo grabado o lo elegido de la galería. */
type Subida = {
  clave: string
  nombre: string
  clase: ClaseMaterial
  /** La foto, para verla mientras sube; un video no se previsualiza. */
  vista: string | null
  fuente: Fuente
  pedido: PedidoDeSubida
  progreso: number
  error: string | null
  /** El id de la subida en el servidor, apenas se abre: con él se retoma o se aborta. */
  subidaId: string | null
  /** Si el archivo es la copia de lo grabado que guardó la app: se borra al terminar o al quitarlo. */
  propio: boolean
  /** Si al terminar entra a la comanda («Tu comanda») o solo queda guardado («Guardar en la cámara»). */
  aLaComanda: boolean
}

/** Lo que se guarda en el teléfono de una subida, para retomarla si la app se cierra. */
function pendienteDe(s: Subida): Pendiente {
  return { ...s.pedido, clave: s.clave, clase: s.clase, uri: s.fuente.uri, subidaId: s.subidaId, propio: s.propio, aLaComanda: s.aLaComanda }
}

function subidaDe(p: Pendiente): Subida {
  return {
    clave: p.clave,
    nombre: p.nombre,
    clase: p.clase,
    vista: p.clase === 'imagen' ? p.uri : null,
    fuente: { uri: p.uri },
    pedido: { nombre: p.nombre, tipo: p.tipo, bytes: p.bytes, uso: p.uso, duracionS: p.duracionS },
    progreso: 0,
    error: null,
    subidaId: p.subidaId,
    propio: p.propio,
    aLaComanda: p.aLaComanda ?? true,
  }
}

/** Las tres partes de la pestaña: pedir, la cámara por dentro y las comandas que ya salieron. */
type Vista = 'comanda' | 'camara' | 'comandas'

const ALTO_CABECERA = Platform.OS === 'ios' ? 44 : 56
/** Cada cuánto se vuelve a preguntar mientras alguna comanda está en marcha y la pestaña está a la vista. */
const CADA_MS = 20_000

const SE_CORTO = 'Se cortó la subida. Toca «Reintentar» para seguir donde quedó.'
const NO_SE_RESPONDIO = 'No se pudo mandar tu respuesta: revisa la señal y vuelve a intentarlo.'
const NO_SE_MANDO = 'No se pudo mandar: revisa la señal y vuelve a tocar «Mandar al chef». No se va a pedir dos veces.'
const SIN_SENAL = 'No se pudo: revisa la señal y vuelve a intentarlo.'
const QUE_ES =
  'El chef de la casa edita tus videos: le llevas un video largo, un podcast en videollamada o tus tomas sueltas, y te devuelve una tanda de clips y carruseles con sus textos, para que los programes en tus redes. Está en piloto, con pocas cuentas.'

let claves = 0

const marcaDe = (data: Cocina): MarcaBasica => data.tuMarca ?? { nombre: data.marca ?? '', handle: null, acento: null, ctaTexto: null }

/**
 * La Cocina en el teléfono, en tres partes, como el panel: **Tu comanda** —grabar un video (o sacar
 * una foto, o elegir de la galería), elegir de la cámara de frío lo que va, decir qué es cada cosa
 * y qué quieres que salga, y «Mandar al chef»—; **la cámara de frío** —de día, la nevera—, con su
 * cuota, guardar sin pedir comanda, «Cambiar» y «Sacar de la cámara»; y **Tus comandas**, con su
 * estado, lo que pregunta el chef, «Lo que pasó» y «Cancelar la comanda». Lo grabado se guarda en la
 * cámara apenas vuelve de la cámara del teléfono, subido por partes con su avance.
 *
 * Contra un servidor de antes del 2026-11-06, que no manda las opciones del pedido (`opciones`),
 * queda el camino corto de la 1.2.0: el riel y la instrucción, sin cambiar, sacar ni cancelar. En
 * un teléfono cuyo binario no trae el permiso de la cámara (la 1.1.0, que recibe esto por aire) no
 * aparecen «Grabar video» ni «Sacar foto» (`src/lib/grabar.ts`). El mesón sigue en el panel web.
 */
export default function LaCocina() {
  const colores = useColores()
  const { tema } = useTema()
  const { token, salir } = useSesion()
  const { avisar, preguntar } = useVentanas()
  const insets = useSafeAreaInsets()
  const { abrir: abrirSelector, selector } = useSelectorFecha()
  const { data, cargando, error, sello, refrescar, refrescarSiVieja } = useScreenData<Cocina>('cocina', '/api/mobile/cocina', token, salir)
  const [grabar] = useState(sePuedeGrabar)

  const [vista, setVista] = useState<Vista>('comanda')
  const [riel, setRiel] = useState<Riel>(RIEL_VACIO)
  const [guardadosAca, setGuardadosAca] = useState<Material[]>([])
  const [sacados, setSacados] = useState<string[]>([])
  const [subidas, setSubidasEnPantalla] = useState<Subida[]>([])
  const [instruccion, setInstruccion] = useState('')
  const [derechos, setDerechos] = useState(false)
  const [ref, setRef] = useState(nuevaRef)
  const [mandando, setMandando] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)
  const [elegidasAca, setElegidas] = useState<OpcionesElegidas | null>(null)
  const [verMarca, setVerMarca] = useState(false)
  const [usoAlGuardar, setUsoAlGuardar] = useState<string | null>(null)
  const [filtro, setFiltro] = useState<ClaseMaterial | null>(null)
  const [editando, setEditando] = useState<Material | null>(null)
  const [sacando, setSacando] = useState<string | null>(null)
  const [errorDe, setErrorDe] = useState<Record<string, string>>({})

  const opciones = data?.opciones
  // El formulario completo: lo que se elige además del riel. Hasta que se toca algo, como viene, con
  // la marca de la cuenta; solo con un servidor que manda las opciones.
  const elegidas = elegidasAca ?? (data?.opciones ? { ...COMO_VIENE, marca: marcaDe(data) } : null)
  const completo = opciones ? elegidas : null

  // Lo de la cámara: lo que mandó el servidor más lo recién guardado acá, que llega antes que la
  // próxima lectura, menos lo que se acaba de sacar.
  const materiales = useMemo(() => {
    const delServidor = data?.materiales ?? []
    return [...guardadosAca.filter((m) => !delServidor.some((d) => d.id === m.id)), ...delServidor].filter((m) => !sacados.includes(m.id))
  }, [data, guardadosAca, sacados])
  const vigente = rielQueSigue(riel, materiales)
  const colgados = vigente.elegidos.flatMap((e) => {
    const material = materiales.find((m) => m.id === e.id)
    return material ? [{ material, rol: e.rol }] : []
  })
  const filtros = filtrosDeClase(materiales)
  const visibles = filtro && filtros.length > 0 ? materiales.filter((m) => m.clase === filtro) : materiales
  const max = opciones?.maxAcompanamientos ?? MAX_ACOMPANAMIENTOS

  /* ---- al volver a la pestaña, y mientras el chef trabaja ---- */

  useFocusEffect(
    useCallback(() => {
      refrescarSiVieja()
      if (!hayEnMarcha(data)) return
      const reloj = setInterval(() => void refrescar(), CADA_MS)
      return () => clearInterval(reloj)
    }, [refrescarSiVieja, refrescar, data]),
  )

  /* ---- la cola de subida: de a un archivo ---- */

  const subidasRef = useRef<Subida[]>([])
  const enCurso = useRef<{ clave: string; control: AbortController } | null>(null)
  const cambiarSubidas = useCallback((cambio: (lista: Subida[]) => Subida[]) => {
    subidasRef.current = cambio(subidasRef.current)
    setSubidasEnPantalla(subidasRef.current)
  }, [])

  const bombear = useCallback(async () => {
    if (enCurso.current || !token) return
    for (;;) {
      const siguiente = subidasRef.current.find((s) => s.error === null)
      if (!siguiente) return
      const control = new AbortController()
      enCurso.current = { clave: siguiente.clave, control }
      const cambiarEsta = (cambio: Partial<Subida>) =>
        cambiarSubidas((lista) => lista.map((s) => (s.clave === siguiente.clave ? { ...s, ...cambio } : s)))
      try {
        const material = await subirALaCamara(
          siguiente.pedido,
          {
            retomar: siguiente.subidaId,
            alAbrir: (id) => cambiarEsta({ subidaId: id }),
            alAvanzar: (progreso) => cambiarEsta({ progreso }),
            senal: control.signal,
          },
          {
            post: (ruta, cuerpo) => apiPost(ruta, token, cuerpo),
            get: (ruta) => apiGet(ruta, token),
            subirParte: (url, desde, hasta, alAvanzar, senal) => subirTramo(siguiente.fuente, url, desde, hasta, alAvanzar, senal),
            esperar: (ms) => new Promise((listo) => setTimeout(listo, ms)),
          },
        )
        if (control.signal.aborted) continue
        // Guardado: deja de subir y, si se grabó o eligió para la comanda, entra ya elegido. La
        // copia de lo grabado ya no hace falta.
        if (siguiente.propio) void soltarCopia(siguiente.fuente.uri)
        setGuardadosAca((lista) => [material, ...lista])
        if (siguiente.aLaComanda) setRiel((r) => colgar(r, material.id, [material], max))
        cambiarSubidas((lista) => lista.filter((s) => s.clave !== siguiente.clave))
      } catch (e) {
        if (e instanceof SesionCaducada) {
          enCurso.current = null
          await salir()
          return
        }
        if (control.signal.aborted) continue
        if (!(e instanceof RechazoApi)) console.warn('cocina, subida:', String(e).slice(0, 300))
        cambiarEsta({ error: e instanceof RechazoApi ? e.message : SE_CORTO })
      } finally {
        enCurso.current = null
      }
    }
  }, [token, salir, cambiarSubidas, max])

  // Al irse de la pantalla del todo (cerrar sesión), lo que sube se corta.
  useEffect(() => () => enCurso.current?.control.abort(), [])

  // Lo que quedó subiendo la vez anterior —la app se cerró a medias— vuelve a la cola y sigue donde
  // quedó; las copias de lo grabado que ya nadie espera se borran. Hasta haberlo leído no se escribe
  // nada encima.
  const restaurado = useRef(false)
  useEffect(() => {
    if (!token || restaurado.current) return
    let vivo = true
    void (async () => {
      const guardados = leerPendientes(await AsyncStorage.getItem(CLAVE_PENDIENTES).catch(() => null))
      const siguen: Subida[] = []
      for (const p of guardados) if (await existe({ uri: p.uri })) siguen.push(subidaDe(p))
      await barrerCopias(siguen.filter((s) => s.propio).map((s) => s.fuente.uri))
      if (!vivo) return
      restaurado.current = true
      if (siguen.length === 0) return
      cambiarSubidas((lista) => [...siguen.filter((s) => !lista.some((x) => x.clave === s.clave)), ...lista])
      void bombear()
    })()
    return () => {
      vivo = false
    }
  }, [token, bombear, cambiarSubidas])

  // Cada cambio en la cola queda en el teléfono. Lo elegido en la web no: es un archivo del navegador.
  useEffect(() => {
    if (!restaurado.current) return
    const lista = subidas.filter((s) => !s.fuente.web).map(pendienteDe)
    void AsyncStorage.setItem(CLAVE_PENDIENTES, JSON.stringify(lista)).catch(() => {})
  }, [subidas])

  /**
   * Lo que vuelve de la cámara o de la galería, a la cola. `aLaComanda`: entra a la comanda al
   * terminar; si no, solo queda guardado, con el uso que se eligió en «Para qué es».
   */
  const agregar = useCallback(
    async (assets: ImagePicker.ImagePickerAsset[], grabado: boolean, aLaComanda: boolean, uso: string | null) => {
      const nuevas: Subida[] = []
      for (const asset of assets) {
        const descrito = paraLaCamara(asset, grabado, new Date())
        const web = (asset as { file?: Blob }).file ?? null
        // Lo grabado vive en la caché, que el sistema limpia: se pasa a una carpeta que no, hasta
        // que termine de subir. Lo de la galería sigue en la galería.
        let uri = asset.uri
        let propio = false
        if (grabado && !web) {
          try {
            uri = await conservar(asset.uri)
            propio = true
          } catch (e) {
            console.warn('cocina, conservar lo grabado:', String(e).slice(0, 300))
          }
        }
        const fuente: Fuente = { uri, web }
        let bytes: number
        try {
          bytes = await pesoDe(fuente)
        } catch {
          bytes = asset.fileSize ?? 0
        }
        if (!bytes) {
          setAviso(`No se pudo leer «${descrito.nombre}». Vuelve a intentarlo.`)
          continue
        }
        nuevas.push({
          clave: `s${++claves}`,
          nombre: descrito.nombre,
          clase: descrito.clase,
          vista: descrito.clase === 'imagen' ? uri : null,
          fuente,
          pedido: { nombre: descrito.nombre, tipo: descrito.tipo, bytes, uso: aLaComanda ? descrito.uso : uso, duracionS: descrito.duracionS },
          progreso: 0,
          error: null,
          subidaId: null,
          propio,
          aLaComanda,
        })
      }
      if (nuevas.length === 0) return
      cambiarSubidas((lista) => [...lista, ...nuevas])
      void bombear()
    },
    [bombear, cambiarSubidas],
  )

  // En Android el sistema puede cerrar la app mientras la cámara está abierta; lo grabado no se
  // pierde: queda pendiente y se recoge al volver, para la comanda.
  useEffect(() => {
    if (Platform.OS !== 'android') return
    void ImagePicker.getPendingResultAsync().then((pendiente) => {
      if (pendiente && 'assets' in pendiente && !pendiente.canceled && pendiente.assets?.length) void agregar(pendiente.assets, true, true, null)
    })
  }, [agregar])

  /* ---- grabar, sacar, elegir ---- */

  async function conLaCamara(que: 'videos' | 'images', aLaComanda: boolean) {
    setAviso(null)
    const permiso = await ImagePicker.requestCameraPermissionsAsync()
    if (!permiso.granted) {
      void avisar('Sin permiso para la cámara', 'Dale permiso a Tu Parrilla para usar la cámara en los ajustes del teléfono, y vuelve a intentarlo.')
      return
    }
    const resultado = await ImagePicker.launchCameraAsync({ mediaTypes: [que], quality: 1 })
    if (!resultado.canceled) await agregar(resultado.assets, true, aLaComanda, usoAlGuardar)
  }

  async function deLaGaleria(aLaComanda: boolean) {
    setAviso(null)
    if (Platform.OS !== 'ios') {
      const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (!permiso.granted) {
        setAviso('Sin permiso para ver la galería.')
        return
      }
    }
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos', 'images'],
      allowsMultipleSelection: true,
      selectionLimit: 10,
      // Tal como está: convertir a lo «compatible» transcodificaría en el iPhone un video de varios
      // GB antes de subirlo. El chef corta con ffmpeg y lee HEVC y HEIC.
      preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Current,
    })
    if (!resultado.canceled) await agregar(resultado.assets, false, aLaComanda, usoAlGuardar)
  }

  function reintentar(clave: string) {
    cambiarSubidas((lista) => lista.map((s) => (s.clave === clave ? { ...s, error: null } : s)))
    void bombear()
  }

  function quitarSubida(clave: string) {
    const subida = subidasRef.current.find((s) => s.clave === clave)
    if (enCurso.current?.clave === clave) enCurso.current.control.abort()
    cambiarSubidas((lista) => lista.filter((s) => s.clave !== clave))
    if (subida?.propio) void soltarCopia(subida.fuente.uri)
    // La subida abierta reserva su lugar en la cuota: abortarla lo libera.
    if (subida?.subidaId && token) {
      void apiDelete(`/api/mobile/cocina/subidas/${encodeURIComponent(subida.subidaId)}`, token).catch(() => {})
    }
  }

  function alternar(id: string) {
    setRiel((r) => (r.elegidos.some((e) => e.id === id) ? soltar(r, id, materiales) : colgar(r, id, materiales, max)))
  }

  /** Lo que falla en una acción: la frase del servidor, o la de la señal. La sesión caducada saca. */
  async function frase(e: unknown): Promise<string | null> {
    if (e instanceof SesionCaducada) {
      await salir()
      return null
    }
    return e instanceof RechazoApi ? e.message : SIN_SENAL
  }

  /* ---- la cámara por dentro: cambiar y sacar ---- */

  async function guardarCambio(m: Material, nombre: string, uso: string | null): Promise<string | null> {
    if (!token) return null
    try {
      await apiPatch(`/api/mobile/cocina/materiales/${encodeURIComponent(m.id)}`, token, { nombre, uso })
      setGuardadosAca((lista) => lista.map((x) => (x.id === m.id ? { ...x, nombre: nombre.trim(), uso } : x)))
      await refrescar()
      setEditando(null)
      return null
    } catch (e) {
      return frase(e)
    }
  }

  async function sacar(m: Material) {
    if (!token) return
    const lugar = tema === 'dia' ? 'la nevera' : 'la cámara'
    const si = await preguntar({
      titulo: `¿Sacar «${m.nombre}» de ${lugar}?`,
      detalle: 'Se borra, y no se puede deshacer. Las comandas que ya lo usaron no cambian.',
      accion: SACAR_DE_LA_CAMARA[tema],
      cancelar: 'Cancelar',
      peligro: true,
    })
    if (!si) return
    setSacando(m.id)
    setErrorDe((errores) => Object.fromEntries(Object.entries(errores).filter(([id]) => id !== m.id)))
    try {
      await apiDelete(`/api/mobile/cocina/materiales/${encodeURIComponent(m.id)}`, token)
      setSacados((lista) => [...lista, m.id])
      setRiel((r) => soltar(r, m.id, materiales))
      void refrescar()
    } catch (e) {
      const f = await frase(e)
      if (f) setErrorDe((errores) => ({ ...errores, [m.id]: f }))
    } finally {
      setSacando(null)
    }
  }

  /* ---- mandar al chef ---- */

  // Lo que se cayó no espera: queda con su «Reintentar», y la comanda puede salir sin eso.
  const subiendoALaComanda = subidas.filter((s) => s.aLaComanda && s.error === null).length
  const falta = faltaParaMandar({ riel, materiales, subiendo: subiendoALaComanda, instruccion, marca: data?.marca ?? null, opciones: completo })

  async function mandar() {
    if (!token || falta) return
    setMandando(true)
    setAviso(null)
    try {
      await apiPost('/api/mobile/cocina/comandas', token, cuerpoDeLaComanda(ref, riel, materiales, instruccion, completo))
      setRiel(RIEL_VACIO)
      setInstruccion('')
      setRef(nuevaRef())
      // La marca queda guardada para la próxima, como en el panel; lo demás vuelve a como viene.
      if (elegidas) setElegidas({ ...COMO_VIENE, marca: elegidas.marca })
      void refrescar()
      void avisar(
        'Comanda colgada',
        'El chef la toma en su turno. La ves avanzar en «Tus comandas» y te avisamos por correo cuando esté lista.',
      )
    } catch (e) {
      if (e instanceof SesionCaducada) {
        await salir()
        return
      }
      setAviso(e instanceof RechazoApi ? e.message : NO_SE_MANDO)
    } finally {
      setMandando(false)
    }
  }

  /* ---- contestarle al chef y cancelar ---- */

  /** La respuesta a una pregunta del chef. Devuelve la frase del error, o null si salió y la lista se vuelve a leer. */
  const responder = useCallback(
    async (preguntaId: string, respuesta: string): Promise<string | null> => {
      if (!token) return null
      try {
        await apiPost(`/api/mobile/cocina/preguntas/${encodeURIComponent(preguntaId)}/respuesta`, token, { respuesta })
        void refrescar()
        return null
      } catch (e) {
        if (e instanceof SesionCaducada) {
          await salir()
          return null
        }
        // Una que ya no espera (se contestó desde el panel, pasó el plazo): la lista se vuelve a leer.
        if (e instanceof RechazoApi) {
          void refrescar()
          return e.message
        }
        return NO_SE_RESPONDIO
      }
    },
    [token, salir, refrescar],
  )

  async function cancelar(id: string): Promise<string | null> {
    if (!token) return null
    const si = await preguntar({
      titulo: '¿Cancelar esta comanda?',
      detalle: tema === 'dia' ? 'El chef deja de prepararla. Lo que llevaba sigue en tu nevera.' : 'El chef deja de prepararla. Lo que llevaba sigue en tu cámara de frío.',
      accion: 'Cancelar la comanda',
      // «Cancelar», aquí, haría lo contrario de lo que dice.
      cancelar: 'Volver',
      peligro: true,
    })
    if (!si) return null
    try {
      await apiPost(`/api/mobile/cocina/comandas/${encodeURIComponent(id)}/cancelar`, token, {})
      await refrescar()
      return null
    } catch (e) {
      // Una que el chef ya metió al horno: la lista se vuelve a leer para que lo diga.
      if (e instanceof RechazoApi) void refrescar()
      return frase(e)
    }
  }

  /* ---- lo que se ve ---- */

  if (!data) {
    if (cargando) return <Cargando />
    return (
      <View style={{ flex: 1, padding: 16, backgroundColor: colores.fondo }}>
        <ErrorConReintento mensaje={error ?? 'No se pudo cargar La Cocina.'} onReintentar={() => void refrescar()} />
      </View>
    )
  }

  const refresco = <RefreshControl refreshing={cargando} onRefresh={() => void refrescar()} tintColor={colores.suave} />

  if (!data.encendida) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: colores.fondo }} contentContainerStyle={{ padding: 16, gap: 12 }} refreshControl={refresco}>
        <Etiqueta>El chef de la casa</Etiqueta>
        <Tarjeta>
          <Text style={{ color: colores.texto, fontSize: 14, lineHeight: 20 }}>{QUE_ES}</Text>
          <Text style={{ color: colores.suave, fontSize: 13, lineHeight: 19, marginTop: 6 }}>
            Si quieres probarla, pídesela a quien administra Tu Parrilla.
          </Text>
        </Tarjeta>
      </ScrollView>
    )
  }

  const ocupado = mandando
  const linea = lineaDeLaCocina(data)
  const largo = instruccion.trim().length
  const preguntas = data.comandas.filter((c) => c.estado === 'pregunta' && c.pregunta).length
  const titulo = { color: colores.texto, fontFamily: TIPO_TITULO, fontSize: 18, letterSpacing: 1, textTransform: 'uppercase' } as const
  const rotulo = { color: colores.tenue, fontSize: 11, fontFamily: TIPO_TITULO, letterSpacing: 1.2, textTransform: 'uppercase' } as const
  const tarjeta = { backgroundColor: colores.tarjeta, borderRadius: 16, borderTopWidth: 3, borderTopColor: colores.brasa, padding: 14, gap: 12 } as const

  /** Grabar, sacar foto y elegir de la galería: los mismos en «Tu comanda» y en «Guardar en la cámara». */
  const botonesParaGuardar = (aLaComanda: boolean) => (
    <>
      <Casilla
        texto="Tengo los derechos de lo que guardo y el permiso de quienes aparecen."
        marcada={derechos}
        onCambiar={() => setDerechos(!derechos)}
        deshabilitado={ocupado}
      />
      {grabar ? (
        <>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Boton texto="Grabar video" onPress={() => void conLaCamara('videos', aLaComanda)} deshabilitado={!derechos || ocupado} destacado />
            <Boton texto="Sacar foto" onPress={() => void conLaCamara('images', aLaComanda)} deshabilitado={!derechos || ocupado} />
          </View>
          <View style={{ alignItems: 'flex-start' }}>
            <BotonTexto texto="Elegir de la galería" onPress={() => void deLaGaleria(aLaComanda)} deshabilitado={!derechos || ocupado} />
          </View>
        </>
      ) : (
        <View style={{ flexDirection: 'row' }}>
          <Boton texto="Elegir de la galería" onPress={() => void deLaGaleria(aLaComanda)} deshabilitado={!derechos || ocupado} destacado />
        </View>
      )}
      {!derechos ? (
        <Text style={{ color: colores.tenue, fontSize: 11 }}>
          {grabar ? 'Marca la casilla de los derechos para grabar o elegir.' : 'Marca la casilla de los derechos para elegir.'}
        </Text>
      ) : null}
    </>
  )

  const filtrosDeArriba =
    filtros.length > 0 ? (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
        {filtros.map((f) => (
          <Chip key={f.clase ?? 'todo'} texto={f.texto} activo={filtro === f.clase} onPress={() => setFiltro(f.clase)} />
        ))}
      </ScrollView>
    ) : null

  const paraCuando = completo?.paraCuando ?? null

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={insets.top + ALTO_CABECERA}
      style={{ flex: 1, backgroundColor: colores.fondo }}
    >
      <ScrollView
        style={{ flex: 1, backgroundColor: colores.fondo }}
        contentContainerStyle={{ padding: 16, paddingBottom: 48, gap: 12 }}
        keyboardShouldPersistTaps="handled"
        refreshControl={refresco}
      >
        <Sello texto={sello} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: linea.tono === 'verde' ? colores.verde : colores.ambar }} />
          <Text style={{ color: colores.suave, fontSize: 13, flex: 1 }}>{linea.texto}</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          <Chip texto="Tu comanda" activo={vista === 'comanda'} onPress={() => setVista('comanda')} />
          <Chip texto={CAMARA[tema]} activo={vista === 'camara'} onPress={() => setVista('camara')} />
          <Chip texto="Tus comandas" activo={vista === 'comandas'} onPress={() => setVista('comandas')} />
        </ScrollView>
        {preguntas > 0 && vista !== 'comandas' ? (
          <Pressable onPress={() => setVista('comandas')} accessibilityRole="button" style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
            <Text style={{ color: colores.brasa, fontSize: 13, fontWeight: '600' }}>El chef te pregunta algo: contéstale en «Tus comandas».</Text>
          </Pressable>
        ) : null}

        {vista === 'comanda' ? (
          <View style={tarjeta}>
            <Text style={titulo}>Tu comanda</Text>
            <Text style={{ color: colores.suave, fontSize: 13, lineHeight: 19 }}>
              {grabar
                ? `Graba el video, dile al chef qué quieres que salga y mándaselo. Lo grabado queda guardado en ${CAMARA[tema].toLowerCase()}.`
                : `Elige el video de la galería o de ${CAMARA[tema].toLowerCase()}, dile al chef qué quieres que salga y mándaselo.`}
            </Text>
            {botonesParaGuardar(true)}

            {/* Lo guardado, para colgarlo en la comanda. */}
            <Etiqueta margenArriba>{DE_LA_CAMARA[tema]}</Etiqueta>
            {materiales.length === 0 ? (
              <Text style={{ color: colores.tenue, fontSize: 13 }}>{CAMARA_VACIA[tema]}</Text>
            ) : (
              <>
                <Text style={{ color: colores.tenue, fontSize: 11 }}>Toca lo que va en esta comanda: un video es el plato principal, y lo demás lo acompaña.</Text>
                {filtrosDeArriba}
                {visibles.map((m) => {
                  const elegido = vigente.elegidos.some((e) => e.id === m.id)
                  return (
                    <FilaDeMaterial
                      key={m.id}
                      material={m}
                      elegido={elegido}
                      principal={m.id === vigente.principal}
                      onTocar={() => alternar(m.id)}
                      deshabilitado={ocupado || (!elegido && vigente.elegidos.length >= max + 1)}
                    />
                  )
                })}
              </>
            )}

            <Etiqueta margenArriba>El riel de la comanda</Etiqueta>
            {colgados.length === 0 && subidas.every((s) => !s.aLaComanda) ? (
              <Text style={{ color: colores.tenue, fontSize: 13 }}>Todavía no hay nada colgado: toca un material para traerlo.</Text>
            ) : (
              <RielDeLaComanda
                colgados={colgados}
                subiendo={subidas.filter((s) => s.aLaComanda)}
                principal={vigente.principal}
                onSoltar={(id) => setRiel((r) => soltar(r, id, materiales))}
                onReintentar={reintentar}
                onQuitarSubida={quitarSubida}
                deshabilitado={ocupado}
                roles={completo ? opciones?.roles : undefined}
                usos={opciones?.usos}
                onRol={(id: string, rol: RolDeVideo | 'principal') => setRiel((r) => cambiarRol(r, id, rol, materiales))}
              />
            )}

            {completo && opciones ? (
              <>
                {vigente.principal ? (
                  <>
                    <Text style={rotulo}>Qué es el plato principal</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                      {opciones.subtipos.map((s) => (
                        <Chip key={s.valor} texto={s.nombre} activo={completo.subtipo === s.valor} onPress={() => setElegidas({ ...completo, subtipo: s.valor })} deshabilitado={ocupado} />
                      ))}
                    </View>
                    {opciones.subtipos.find((s) => s.valor === completo.subtipo)?.ayuda ? (
                      <Text style={{ color: colores.tenue, fontSize: 11 }}>{opciones.subtipos.find((s) => s.valor === completo.subtipo)?.ayuda}</Text>
                    ) : null}
                  </>
                ) : null}

                <Etiqueta margenArriba>Qué quieres que salga</Etiqueta>
                <Text style={rotulo}>Los formatos</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {opciones.formatos.map((f) => (
                    <Chip
                      key={f.valor}
                      texto={f.nombre}
                      activo={completo.formatos.includes(f.valor)}
                      onPress={() => setElegidas({ ...completo, formatos: alternarFormato(completo.formatos, f.valor, opciones.formatos) })}
                      deshabilitado={ocupado}
                    />
                  ))}
                </View>
                <Text style={rotulo}>Cuántos, más o menos</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {opciones.cantidades.map((c) => (
                    <Chip key={c.valor} texto={c.nombre} activo={completo.cantidad === c.valor} onPress={() => setElegidas({ ...completo, cantidad: c.valor })} deshabilitado={ocupado} />
                  ))}
                </View>
                <Text style={{ color: colores.suave, fontSize: 12 }}>Los estilos los elige el chef, con lo que mejor le vaya al material.</Text>
                <Text style={rotulo}>Para cuándo (opcional)</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
                  <Chip
                    texto={paraCuando ? diaEnPalabras(paraCuando) : 'Elegir el día'}
                    activo={Boolean(paraCuando)}
                    deshabilitado={ocupado}
                    onPress={() =>
                      abrirSelector(paraCuando ? armar(paraCuando, 12, 0) : new Date(), (fecha) => setElegidas({ ...completo, paraCuando: diaDe(fecha) }), {
                        soloDia: true,
                        titulo: 'Para cuándo',
                      })
                    }
                  />
                  {paraCuando ? <BotonTexto texto="Quitar" onPress={() => setElegidas({ ...completo, paraCuando: null })} deshabilitado={ocupado} /> : null}
                </View>
                <Text style={{ color: colores.tenue, fontSize: 11 }}>Informativo: la hora real la estima el chef.</Text>
              </>
            ) : null}

            <Etiqueta margenArriba>Tu instrucción al chef</Etiqueta>
            <TextInput
              value={instruccion}
              onChangeText={setInstruccion}
              multiline
              editable={!ocupado}
              placeholder="Qué quieres que salga: la duración, el tono, qué destacar o qué evitar."
              placeholderTextColor={colores.tenue}
              style={{
                backgroundColor: colores.fondo,
                color: colores.texto,
                borderRadius: 12,
                padding: 12,
                minHeight: 96,
                textAlignVertical: 'top',
                fontSize: 14,
              }}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: colores.tenue, fontSize: 11 }}>Si no escribes nada, el chef elige.</Text>
              <Text style={{ color: largo > MAX_INSTRUCCION ? colores.rojo : colores.tenue, fontSize: 11 }}>
                {largo} / {MAX_INSTRUCCION}
              </Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }} keyboardShouldPersistTaps="handled">
              {EJEMPLOS_DE_INSTRUCCION.map((ejemplo) => (
                <Chip key={ejemplo} texto={`+ ${ejemplo}`} activo={false} onPress={() => setInstruccion((t) => sumarEjemplo(t, ejemplo))} deshabilitado={ocupado} />
              ))}
            </ScrollView>

            {completo ? (
              <>
                <Etiqueta margenArriba>Tu marca</Etiqueta>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Text style={{ color: colores.suave, fontSize: 12, flex: 1 }}>
                    {completo.marca.nombre.trim() ? `El chef firma los videos con «${completo.marca.nombre.trim()}».` : 'Todavía no tiene nombre.'}
                  </Text>
                  <BotonTexto texto={verMarca ? 'Listo' : 'Cambiar'} onPress={() => setVerMarca(!verMarca)} deshabilitado={ocupado} />
                </View>
                {verMarca ? (
                  <View style={{ gap: 8 }}>
                    <Text style={{ color: colores.tenue, fontSize: 11 }}>Lo que el chef usa para vestir lo que cocina. Se guarda para las comandas que vengan.</Text>
                    {(
                      [
                        ['nombre', 'El nombre', 80, ''],
                        ['handle', 'El @ (opcional)', 60, '@tumarca'],
                        ['ctaTexto', 'El llamado final (opcional)', 120, 'Sígueme para más'],
                      ] as const
                    ).map(([campo, etiqueta, tope, ejemplo]) => (
                      <View key={campo} style={{ gap: 4 }}>
                        <Text style={rotulo}>{etiqueta}</Text>
                        <TextInput
                          value={completo.marca[campo] ?? ''}
                          onChangeText={(texto) => setElegidas({ ...completo, marca: { ...completo.marca, [campo]: texto } })}
                          editable={!ocupado}
                          maxLength={tope}
                          placeholder={ejemplo}
                          placeholderTextColor={colores.tenue}
                          accessibilityLabel={etiqueta}
                          autoCapitalize={campo === 'handle' ? 'none' : 'sentences'}
                          style={{ backgroundColor: colores.fondo, color: colores.texto, borderRadius: 12, padding: 12, fontSize: 14 }}
                        />
                      </View>
                    ))}
                    <Text style={{ color: colores.tenue, fontSize: 11 }}>
                      {completo.marca.acento ? `El color de acento, ${completo.marca.acento}, se cambia en el panel web.` : 'El color de acento se elige en el panel web; sin él, el chef usa el del estilo.'}
                    </Text>
                  </View>
                ) : null}
              </>
            ) : data.marca ? (
              <Text style={{ color: colores.tenue, fontSize: 11 }}>El chef firma los videos con tu marca: «{data.marca}».</Text>
            ) : null}

            {completo && opciones ? (
              <>
                <Etiqueta margenArriba>Confirmar</Etiqueta>
                <View style={{ gap: 3 }}>
                  {resumenDeLaComanda(riel, materiales, completo, opciones, diaEnPalabras).map((l) => (
                    <Text key={l} style={{ color: colores.suave, fontSize: 12, lineHeight: 17 }}>
                      {l}
                    </Text>
                  ))}
                </View>
                {data.nueva ? (
                  <View style={{ gap: 2 }}>
                    <Text style={{ color: colores.texto, fontSize: 12 }}>{antesEnLaFila(data.nueva.antes)}</Text>
                    {data.nueva.eta ? (
                      <Text style={{ color: colores.texto, fontSize: 12 }}>
                        Hora estimada: {new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(data.nueva.eta))}
                      </Text>
                    ) : null}
                  </View>
                ) : null}
              </>
            ) : null}

            {aviso ? <Text style={{ color: colores.rojo, fontSize: 13 }}>{aviso}</Text> : null}
            {falta && !aviso ? <Text style={{ color: colores.tenue, fontSize: 12 }}>{falta}</Text> : null}
            <View style={{ flexDirection: 'row' }}>
              <Boton texto={mandando ? 'Mandando…' : 'Mandar al chef'} onPress={() => void mandar()} deshabilitado={Boolean(falta) || ocupado} destacado />
            </View>
          </View>
        ) : null}

        {vista === 'camara' ? (
          <>
            {data.camara ? <CuotaDeLaCamara camara={data.camara} /> : null}
            <View style={tarjeta}>
              <Text style={titulo}>{GUARDAR_EN_LA_CAMARA[tema]}</Text>
              <Text style={{ color: colores.suave, fontSize: 13, lineHeight: 19 }}>Sin pedir comanda: queda guardado, y de acá lo eliges cuando pidas una.</Text>
              {opciones ? (
                <>
                  <Text style={rotulo}>Para qué es (opcional)</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    <Chip texto="Sin uso" activo={usoAlGuardar === null} onPress={() => setUsoAlGuardar(null)} />
                    {opciones.usos.map((u) => (
                      <Chip key={u.valor} texto={u.nombre} activo={usoAlGuardar === u.valor} onPress={() => setUsoAlGuardar(u.valor)} />
                    ))}
                  </View>
                  <Text style={{ color: colores.tenue, fontSize: 11 }}>Le dice al chef para qué es: tu intro, tu música, tu logo. Se cambia después.</Text>
                </>
              ) : null}
              {botonesParaGuardar(false)}
              {subidas
                .filter((s) => !s.aLaComanda)
                .map((s) => (
                  <EnCurso key={s.clave} subida={s} onReintentar={reintentar} onQuitar={quitarSubida} />
                ))}
              {aviso ? <Text style={{ color: colores.rojo, fontSize: 13 }}>{aviso}</Text> : null}
            </View>

            <Etiqueta margenArriba>{`Lo que hay adentro (${materiales.length})`}</Etiqueta>
            {materiales.length === 0 ? (
              <Text style={{ color: colores.tenue, fontSize: 13 }}>{CAMARA_VACIA[tema]} Lo que guardes queda acá, y no vence.</Text>
            ) : (
              <>
                {filtrosDeArriba}
                {visibles.map((m) => (
                  <TarjetaEnLaCamara
                    key={m.id}
                    material={m}
                    usos={opciones?.usos}
                    sacando={sacando === m.id}
                    error={errorDe[m.id] ?? null}
                    onCambiar={opciones ? () => setEditando(m) : undefined}
                    onSacar={opciones ? () => void sacar(m) : undefined}
                  />
                ))}
              </>
            )}
            {!opciones ? <Text style={{ color: colores.tenue, fontSize: 11 }}>Cambiar o sacar algo de {CAMARA[tema].toLowerCase()} se hace en el panel web.</Text> : null}
          </>
        ) : null}

        {vista === 'comandas' ? (
          <>
            {data.comandas.length === 0 ? (
              <Text style={{ color: colores.tenue, fontSize: 13 }}>Todavía no tienes comandas.</Text>
            ) : (
              data.comandas.map((c) => <TarjetaDeComanda key={c.id} comanda={c} onResponder={responder} onCancelar={opciones ? cancelar : undefined} />)
            )}
            <Text style={{ color: colores.tenue, fontSize: 11, lineHeight: 16 }}>
              Lo que el chef cocina espera en {MESON[tema].toLowerCase()}, en el panel web: desde ahí lo programas o lo descartas.
            </Text>
          </>
        ) : null}
        {error ? <Text style={{ color: colores.rojo, fontSize: 12 }}>{error}</Text> : null}
      </ScrollView>
      {editando && opciones ? (
        <VentanaCambiar material={editando} usos={opciones.usos} onGuardar={(nombre, uso) => guardarCambio(editando, nombre, uso)} onCancelar={() => setEditando(null)} />
      ) : null}
      {selector}
    </KeyboardAvoidingView>
  )
}
