import { useEffect, useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSelectorFecha } from '../../components/selector-fecha'
import { useSesion } from '../../components/sesion'
import { useColores } from '../../components/tema'
import { Boton, BotonTexto, Cargando, Chip, ErrorConReintento, Etiqueta, Tarjeta } from '../../components/ui'
import { useVentanas } from '../../components/ventana'
import { colorDeRed } from '../../components/colores'
import { RechazoApi, SesionCaducada, apiDelete, apiGet, apiPatch } from '../../lib/api'
import { fechaLegible } from '../../lib/calendario'
import { anotarCambio } from '../../lib/cambios'
import { NO_SE_ABRIO_POST, cuerpoDeLaEdicion, destinosQueSiguen, limiteDelTexto, sePuedeQuitar } from '../../lib/editar'
import { SIN_SENAL, etiquetaCuenta } from '../../lib/publicar'
import type { PostEditable } from '../../lib/tipos'

// Como en Publicar: el teclado se mide desde la pantalla y en medio está la cabecera.
const ALTO_CABECERA = Platform.OS === 'ios' ? 44 : 56

/**
 * Corregir un post programado sin ir al panel: se abre al tocar su tarjeta en La Parrilla. Se
 * cambia el texto y la hora, se quitan cuentas o se borra entero. Lo demás —los archivos, la
 * portada, la palabra clave, las opciones de cada red— lo guarda el servidor como está, y la
 * nota amarilla lo dice. Las reglas son las del editor del panel: las aplica el servidor, que
 * contesta con sus mismas frases.
 */
export default function EditarProgramado() {
  const colores = useColores()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { token, salir } = useSesion()
  const { avisar, preguntar } = useVentanas()
  const { abrir: abrirSelector, selector } = useSelectorFecha()

  const [post, setPost] = useState<PostEditable | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [texto, setTexto] = useState('')
  // La hora nueva, o null mientras no se elija otra: así no se manda y queda la que estaba.
  const [fechaNueva, setFechaNueva] = useState<Date | null>(null)
  const [quitados, setQuitados] = useState<string[]>([])
  const [ocupado, setOcupado] = useState<'guardando' | 'borrando' | null>(null)

  // Sube con «Reintentar»: vuelve a correr la lectura de abajo.
  const [intento, setIntento] = useState(0)

  // Leer el post es asíncrono: el `setState` ocurre dentro de `cargar()`, después de la
  // respuesta, no en el cuerpo del efecto (mismo arranque que el detalle de una publicación).
  useEffect(() => {
    if (!token || !id) return
    let vigente = true
    async function cargar() {
      try {
        const abierto = await apiGet<PostEditable>(`/api/mobile/schedule/posts/${encodeURIComponent(id!)}`, token!)
        if (!vigente) return
        setPost(abierto)
        setTexto(abierto.texto)
        setFechaNueva(null)
        setQuitados([])
      } catch (e) {
        if (e instanceof SesionCaducada) {
          await salir()
          return
        }
        if (vigente) setError(e instanceof RechazoApi ? e.message : NO_SE_ABRIO_POST)
      }
    }
    void cargar()
    return () => {
      vigente = false
    }
  }, [id, token, salir, intento])

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: colores.fondo, padding: 16, gap: 12 }}>
        <ErrorConReintento
          mensaje={error}
          onReintentar={() => {
            setError(null)
            setIntento(intento + 1)
          }}
        />
        <View style={{ flexDirection: 'row' }}>
          <Boton texto="Volver" onPress={() => router.back()} />
        </View>
      </View>
    )
  }
  if (!post) return <Cargando />

  const fecha = fechaNueva ?? new Date(post.cuando)
  const siguen = destinosQueSiguen(post, quitados)
  const limite = limiteDelTexto(post, quitados)

  async function guardar() {
    if (!token || !post) return
    setOcupado('guardando')
    try {
      await apiPatch(`/api/mobile/schedule/posts/${encodeURIComponent(post.id)}`, token, cuerpoDeLaEdicion(texto, fechaNueva, quitados))
      anotarCambio()
      router.back()
    } catch (e) {
      if (e instanceof SesionCaducada) {
        await salir()
        return
      }
      void avisar('No se pudo guardar', e instanceof RechazoApi ? e.message : SIN_SENAL)
    } finally {
      setOcupado(null)
    }
  }

  async function borrar() {
    if (!token || !post) return
    const si = await preguntar({
      titulo: 'Borrar publicación',
      detalle: '¿Borrar esta publicación? Sale de La Parrilla y no se publica en ninguna cuenta.',
      accion: 'Borrar',
      cancelar: 'Cancelar',
      peligro: true,
    })
    if (!si) return
    setOcupado('borrando')
    try {
      await apiDelete(`/api/mobile/schedule/posts/${encodeURIComponent(post.id)}`, token)
      anotarCambio()
      router.back()
    } catch (e) {
      if (e instanceof SesionCaducada) {
        await salir()
        return
      }
      void avisar('No se pudo borrar', e instanceof RechazoApi ? e.message : SIN_SENAL)
    } finally {
      setOcupado(null)
    }
  }

  // Ya salió en alguna cuenta, o está saliendo: se muestra el texto y por qué, sin el formulario.
  if (post.bloqueo) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: colores.fondo }} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 48 }}>
        <Text style={{ color: colores.ambar, fontSize: 14 }}>{post.bloqueo}</Text>
        <Tarjeta>
          {/* Seleccionable: un borrador que llegó a la bandeja de TikTok sin su texto se termina
              allá, y de aquí se copia con un toque largo. */}
          <Text selectable style={{ color: colores.texto, fontSize: 14 }}>
            {post.texto || '(sin texto)'}
          </Text>
        </Tarjeta>
        <View style={{ flexDirection: 'row' }}>
          <Boton texto="Volver" onPress={() => router.back()} />
        </View>
      </ScrollView>
    )
  }

  const largo = texto.trim().length
  return (
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
        <Etiqueta>Texto</Etiqueta>
        <TextInput
          value={texto}
          onChangeText={setTexto}
          multiline
          editable={ocupado === null}
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
        {/* El tope es el de la red más estricta que sigue (X, 280): pasado, se pone rojo. */}
        <Text style={{ color: largo > limite ? colores.rojo : colores.tenue, fontSize: 11, textAlign: 'right' }}>
          {largo} / {limite}
        </Text>

        <Etiqueta>Cuándo sale</Etiqueta>
        <View style={{ flexDirection: 'row' }}>
          <Chip
            texto={`Cuándo: ${fechaLegible(fecha)}`}
            activo
            onPress={() => abrirSelector(fecha, setFechaNueva)}
            deshabilitado={ocupado !== null}
          />
        </View>

        <Etiqueta>Cuentas</Etiqueta>
        <View style={{ gap: 4 }}>
          {post.destinos.map((d) => {
            const quitado = quitados.includes(d.id)
            return (
              <View key={d.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colorDeRed(colores, d.red), opacity: quitado ? 0.4 : 1 }} />
                <Text
                  style={{
                    flex: 1,
                    color: quitado ? colores.tenue : colores.texto,
                    fontSize: 14,
                    textDecorationLine: quitado ? 'line-through' : 'none',
                  }}
                  numberOfLines={1}
                >
                  {etiquetaCuenta(d)}
                  {quitado ? ' · se quita al guardar' : ''}
                </Text>
                {quitado ? (
                  <BotonTexto texto="Devolver" onPress={() => setQuitados(quitados.filter((q) => q !== d.id))} deshabilitado={ocupado !== null} />
                ) : (
                  <BotonTexto
                    texto="Quitar"
                    onPress={() => setQuitados([...quitados, d.id])}
                    deshabilitado={ocupado !== null || !sePuedeQuitar(post, quitados, d.id)}
                  />
                )}
              </View>
            )
          })}
          {siguen.length === 1 && post.destinos.length > 0 ? (
            <Text style={{ color: colores.tenue, fontSize: 11 }}>Para sacarla de la última cuenta, borra la publicación.</Text>
          ) : null}
        </View>

        {post.seConserva ? <Text style={{ color: colores.ambar, fontSize: 13 }}>{post.seConserva}</Text> : null}

        <View style={{ flexDirection: 'row', marginTop: 4 }}>
          <Boton texto={ocupado === 'guardando' ? 'Guardando…' : 'Guardar'} onPress={() => void guardar()} destacado deshabilitado={ocupado !== null} />
        </View>
        <View style={{ alignItems: 'center' }}>
          <BotonTexto texto={ocupado === 'borrando' ? 'Borrando…' : 'Borrar publicación'} onPress={() => void borrar()} peligro deshabilitado={ocupado !== null} />
        </View>
      </ScrollView>
      {selector}
    </KeyboardAvoidingView>
  )
}
