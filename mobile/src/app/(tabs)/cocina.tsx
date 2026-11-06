import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { useFocusEffect } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Casilla, CuotaDeLaCamara, FilaDeMaterial, RielDeLaComanda, TarjetaDeComanda } from '../../components/cocina'
import { Boton, BotonTexto, Cargando, Chip, ErrorConReintento, Etiqueta, Sello, TIPO_TITULO, Tarjeta } from '../../components/ui'
import { useSesion } from '../../components/sesion'
import { useColores, useTema } from '../../components/tema'
import { useVentanas } from '../../components/ventana'
import { RechazoApi, SesionCaducada, apiDelete, apiGet, apiPost } from '../../lib/api'
import { barrerCopias, conservar, existe, pesoDe, soltarCopia, subirTramo, type Fuente } from '../../lib/archivo-local'
import {
  CLAVE_PENDIENTES,
  EJEMPLOS_DE_INSTRUCCION,
  MAX_INSTRUCCION,
  cuerpoDeLaComanda,
  elegidosQueSiguen,
  faltaParaMandar,
  hayEnMarcha,
  leerPendientes,
  lineaDeLaCocina,
  nuevaRef,
  paraLaCamara,
  principalDe,
  sumarEjemplo,
  type ClaseMaterial,
  type Cocina,
  type Material,
  type Pendiente,
} from '../../lib/cocina'
import { subirALaCamara, type PedidoDeSubida } from '../../lib/subir-por-partes'
import { CAMARA, CAMARA_VACIA, MESON } from '../../lib/tema'
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
}

/** Lo que se guarda en el teléfono de una subida, para retomarla si la app se cierra. */
function pendienteDe(s: Subida): Pendiente {
  return { ...s.pedido, clave: s.clave, clase: s.clase, uri: s.fuente.uri, subidaId: s.subidaId, propio: s.propio }
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
  }
}

const ALTO_CABECERA = Platform.OS === 'ios' ? 44 : 56
/** Cada cuánto se vuelve a preguntar mientras alguna comanda está en marcha y la pestaña está a la vista. */
const CADA_MS = 20_000

const SE_CORTO = 'Se cortó la subida. Toca «Reintentar» para seguir donde quedó.'
const NO_SE_RESPONDIO = 'No se pudo mandar tu respuesta: revisa la señal y vuelve a intentarlo.'
const NO_SE_MANDO = 'No se pudo mandar: revisa la señal y vuelve a tocar «Mandar al chef». No se va a pedir dos veces.'
const QUE_ES =
  'El chef de la casa edita tus videos: le llevas un video largo, un podcast en videollamada o tus tomas sueltas, y te devuelve una tanda de clips y carruseles con sus textos, para que los programes en tus redes. Está en piloto, con pocas cuentas.'

let claves = 0

/**
 * La Cocina en el teléfono: grabar un video (o sacar una foto) y mandárselo al chef de la casa con
 * una instrucción, sin pasar por el panel. Lo grabado se guarda en la cámara de frío —de día, la
 * nevera— apenas vuelve de la cámara, subido por partes con su avance, y entra a la comanda ya
 * elegido; «Mandar al chef» la cuelga. Más abajo, lo que hay en la cámara para sumar a la comanda,
 * con su cuota, y las últimas comandas con su estado. Lo demás de La Cocina —el mesón, sacar de la
 * cámara, el formulario completo— sigue en el panel web.
 */
export default function LaCocina() {
  const colores = useColores()
  const { tema } = useTema()
  const { token, salir } = useSesion()
  const { avisar } = useVentanas()
  const insets = useSafeAreaInsets()
  const { data, cargando, error, sello, refrescar, refrescarSiVieja } = useScreenData<Cocina>('cocina', '/api/mobile/cocina', token, salir)

  const [elegidos, setElegidos] = useState<string[]>([])
  const [guardadosAca, setGuardadosAca] = useState<Material[]>([])
  const [subidas, setSubidasEnPantalla] = useState<Subida[]>([])
  const [instruccion, setInstruccion] = useState('')
  const [derechos, setDerechos] = useState(false)
  const [ref, setRef] = useState(nuevaRef)
  const [mandando, setMandando] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)

  // Lo de la cámara: lo que mandó el servidor más lo recién guardado acá, que llega antes que la
  // próxima lectura.
  const materiales = useMemo(() => {
    const delServidor = data?.materiales ?? []
    return [...guardadosAca.filter((m) => !delServidor.some((d) => d.id === m.id)), ...delServidor]
  }, [data, guardadosAca])
  const colgados = elegidosQueSiguen(elegidos, materiales).flatMap((id) => materiales.filter((m) => m.id === id))
  const principal = principalDe(elegidos, materiales)

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
        // Guardado: deja de subir y entra a la comanda, ya elegido. La copia de lo grabado ya no hace falta.
        if (siguiente.propio) void soltarCopia(siguiente.fuente.uri)
        setGuardadosAca((lista) => [material, ...lista])
        setElegidos((lista) => (lista.includes(material.id) ? lista : [...lista, material.id]))
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
  }, [token, salir, cambiarSubidas])

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

  /** Lo que vuelve de la cámara o de la galería, a la cola. */
  const agregar = useCallback(
    async (assets: ImagePicker.ImagePickerAsset[], grabado: boolean) => {
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
          pedido: { nombre: descrito.nombre, tipo: descrito.tipo, bytes, uso: descrito.uso, duracionS: descrito.duracionS },
          progreso: 0,
          error: null,
          subidaId: null,
          propio,
        })
      }
      if (nuevas.length === 0) return
      cambiarSubidas((lista) => [...lista, ...nuevas])
      void bombear()
    },
    [bombear, cambiarSubidas],
  )

  // En Android el sistema puede cerrar la app mientras la cámara está abierta; lo grabado no se
  // pierde: queda pendiente y se recoge al volver.
  useEffect(() => {
    if (Platform.OS !== 'android') return
    void ImagePicker.getPendingResultAsync().then((pendiente) => {
      if (pendiente && 'assets' in pendiente && !pendiente.canceled && pendiente.assets?.length) void agregar(pendiente.assets, true)
    })
  }, [agregar])

  /* ---- grabar, sacar, elegir ---- */

  async function conLaCamara(que: 'videos' | 'images') {
    setAviso(null)
    const permiso = await ImagePicker.requestCameraPermissionsAsync()
    if (!permiso.granted) {
      void avisar('Sin permiso para la cámara', 'Dale permiso a Tu Parrilla para usar la cámara en los ajustes del teléfono, y vuelve a intentarlo.')
      return
    }
    const resultado = await ImagePicker.launchCameraAsync({ mediaTypes: [que], quality: 1 })
    if (!resultado.canceled) await agregar(resultado.assets, true)
  }

  async function deLaGaleria() {
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
    if (!resultado.canceled) await agregar(resultado.assets, false)
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
    setElegidos((lista) => (lista.includes(id) ? lista.filter((x) => x !== id) : [...lista, id]))
  }

  /* ---- mandar al chef ---- */

  // Lo que se cayó no espera: queda con su «Reintentar», y la comanda puede salir sin eso.
  const falta = faltaParaMandar({
    elegidos,
    materiales,
    subiendo: subidas.filter((s) => s.error === null).length,
    instruccion,
    marca: data?.marca ?? null,
  })

  async function mandar() {
    if (!token || falta) return
    setMandando(true)
    setAviso(null)
    try {
      await apiPost('/api/mobile/cocina/comandas', token, cuerpoDeLaComanda(ref, elegidos, materiales, instruccion))
      setElegidos([])
      setInstruccion('')
      setRef(nuevaRef())
      void refrescar()
      void avisar(
        'Comanda colgada',
        'El chef la toma en su turno. La ves avanzar en «Tus comandas», acá abajo, y te avisamos por correo cuando esté lista.',
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

  /* ---- contestarle al chef ---- */

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

        {/* La comanda: el camino corto. Grabar, decirle al chef qué quieres, mandar. */}
        <View
          style={{
            backgroundColor: colores.tarjeta,
            borderRadius: 16,
            borderTopWidth: 3,
            borderTopColor: colores.brasa,
            padding: 14,
            gap: 12,
          }}
        >
          <Text style={{ color: colores.texto, fontFamily: TIPO_TITULO, fontSize: 18, letterSpacing: 1, textTransform: 'uppercase' }}>
            Tu comanda
          </Text>
          <Text style={{ color: colores.suave, fontSize: 13, lineHeight: 19 }}>
            Graba el video, dile al chef qué quieres que salga y mándaselo. Lo grabado queda guardado en {CAMARA[tema].toLowerCase()}.
          </Text>

          <Casilla
            texto="Tengo los derechos de lo que guardo y el permiso de quienes aparecen."
            marcada={derechos}
            onCambiar={() => setDerechos(!derechos)}
            deshabilitado={ocupado}
          />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Boton texto="Grabar video" onPress={() => void conLaCamara('videos')} deshabilitado={!derechos || ocupado} destacado />
            <Boton texto="Sacar foto" onPress={() => void conLaCamara('images')} deshabilitado={!derechos || ocupado} />
          </View>
          <View style={{ alignItems: 'flex-start' }}>
            <BotonTexto texto="Elegir de la galería" onPress={() => void deLaGaleria()} deshabilitado={!derechos || ocupado} />
          </View>
          {!derechos ? (
            <Text style={{ color: colores.tenue, fontSize: 11 }}>Marca la casilla de los derechos para grabar o elegir.</Text>
          ) : null}

          <RielDeLaComanda
            colgados={colgados}
            subiendo={subidas}
            principal={principal}
            onSoltar={(id) => setElegidos((lista) => lista.filter((x) => x !== id))}
            onReintentar={reintentar}
            onQuitarSubida={quitarSubida}
            deshabilitado={ocupado}
          />

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

          {data.marca ? (
            <Text style={{ color: colores.tenue, fontSize: 11 }}>El chef firma los videos con tu marca: «{data.marca}».</Text>
          ) : null}
          {aviso ? <Text style={{ color: colores.rojo, fontSize: 13 }}>{aviso}</Text> : null}
          {falta && !aviso ? <Text style={{ color: colores.tenue, fontSize: 12 }}>{falta}</Text> : null}
          <View style={{ flexDirection: 'row' }}>
            <Boton texto={mandando ? 'Mandando…' : 'Mandar al chef'} onPress={() => void mandar()} deshabilitado={Boolean(falta) || ocupado} destacado />
          </View>
        </View>

        {/* La cámara de frío: lo guardado, para sumarlo a la comanda. */}
        <Etiqueta margenArriba>{CAMARA[tema]}</Etiqueta>
        {data.camara ? <CuotaDeLaCamara camara={data.camara} /> : null}
        {materiales.length === 0 ? (
          <Text style={{ color: colores.tenue, fontSize: 13 }}>{CAMARA_VACIA[tema]}</Text>
        ) : (
          <>
            <Text style={{ color: colores.tenue, fontSize: 11 }}>Toca lo que quieras sumar a la comanda. El primer video es el plato principal.</Text>
            {materiales.map((m) => (
              <FilaDeMaterial
                key={m.id}
                material={m}
                elegido={elegidos.includes(m.id)}
                principal={m.id === principal}
                onTocar={() => alternar(m.id)}
                deshabilitado={ocupado}
              />
            ))}
          </>
        )}

        <Etiqueta margenArriba>Tus comandas</Etiqueta>
        {data.comandas.length === 0 ? (
          <Text style={{ color: colores.tenue, fontSize: 13 }}>Todavía no tienes comandas.</Text>
        ) : (
          data.comandas.map((c) => <TarjetaDeComanda key={c.id} comanda={c} onResponder={responder} />)
        )}
        <Text style={{ color: colores.tenue, fontSize: 11, lineHeight: 16 }}>
          Lo que el chef cocina espera en {MESON[tema].toLowerCase()}, en el panel web: desde ahí lo programas. Sacar algo de{' '}
          {CAMARA[tema].toLowerCase()} también se hace en el panel.
        </Text>
        {error ? <Text style={{ color: colores.rojo, fontSize: 12 }}>{error}</Text> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
