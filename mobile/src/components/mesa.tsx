import { useState } from 'react'
import { Linking, Pressable, Text, TextInput, View } from 'react-native'
import { Image } from 'expo-image'
import { useFocusEffect, useRouter } from 'expo-router'
import { RechazoApi, SesionCaducada, apiPost } from '../lib/api'
import { anotarCambio } from '../lib/cambios'
import { esEnlaceSeguro } from '../lib/format'
import {
  MESA_SIN_SERVIDOR,
  SE_CORTO_LA_MESA,
  SUBTITULO_DE_LA_MESA,
  botonDeBorrador,
  esEditable,
  esServidorSinLaMesa,
  frasePendientes,
  hace,
  lineaDelPrivado,
  seCorrigio,
  type ComentarioDeLaMesa,
  type PublicacionDeLaMesa,
} from '../lib/mesa'
import { NOMBRE_RED } from '../lib/tipos'
import { useScreenData } from '../lib/useScreenData'
import { colorDeRed } from './colores'
import { useColores } from './tema'
import { Boton, BotonTexto, TIPO_TITULO } from './ui'
import { useSesion } from './sesion'
import { useVentanas } from './ventana'

/**
 * El acceso a La Mesa desde La Parrilla: una tarjeta con cuántos comentarios esperan respuesta, que
 * abre La Mesa. Contra un servidor que todavía no cuenta (`/api/mobile/comentarios/pendientes` no
 * existe), dice el subtítulo en vez del número, y La Mesa explica lo demás al abrirla.
 */
export function AccesoALaMesa() {
  const colores = useColores()
  const router = useRouter()
  const { token, salir } = useSesion()
  const { data, refrescarSiVieja } = useScreenData<{ pendientes: number }>(
    'mesa:pendientes',
    '/api/mobile/comentarios/pendientes',
    token,
    salir,
  )
  // Al volver de La Mesa, después de responder, el número se pone al día.
  useFocusEffect(refrescarSiVieja)
  const cuantos = typeof data?.pendientes === 'number' ? data.pendientes : null
  return (
    <Pressable
      onPress={() => router.push('/mesa')}
      accessibilityRole="button"
      accessibilityLabel={`La Mesa. ${cuantos === null ? SUBTITULO_DE_LA_MESA : frasePendientes(cuantos)}`}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: colores.tarjeta,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: cuantos ? colores.brasa + '99' : '#00000000',
        paddingVertical: 12,
        paddingHorizontal: 14,
        minHeight: 48,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ color: colores.texto, fontFamily: TIPO_TITULO, fontSize: 13, letterSpacing: 1.2, textTransform: 'uppercase' }}>
          La Mesa
        </Text>
        <Text style={{ color: colores.suave, fontSize: 13 }}>
          {cuantos === null ? SUBTITULO_DE_LA_MESA : frasePendientes(cuantos)}
        </Text>
      </View>
      {cuantos ? (
        <View style={{ minWidth: 26, height: 26, borderRadius: 13, paddingHorizontal: 7, backgroundColor: colores.brasa, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: colores.fondo, fontSize: 13, fontWeight: '700', fontVariant: ['tabular-nums'] }}>{cuantos > 99 ? '99+' : cuantos}</Text>
        </View>
      ) : null}
      <Text style={{ color: colores.tenue, fontSize: 18 }}>›</Text>
    </Pressable>
  )
}

type Acciones = {
  token: string | null
  /** La sesión dejó de valer: vuelve a la entrada. */
  salir: () => Promise<void> | void
  /** Algo cambió en el servidor: vuelve a leer la cola. */
  alCambiar: () => Promise<void>
  ahora: number
}

/** Lo que dice la tarjeta cuando un pedido falla: la frase del servidor, o la de no saber. */
function fraseDelFallo(e: unknown): string {
  if (e instanceof RechazoApi) return e.message
  if (esServidorSinLaMesa(e)) return MESA_SIN_SERVIDOR
  return SE_CORTO_LA_MESA
}

/**
 * Una publicación con sus comentarios, como un grupo de la cola del panel: la miniatura, «Instagram ·
 * @cuenta», las primeras líneas del texto —que abren la publicación en la red— y, si tiene, la
 * palabra clave de la respuesta automática.
 */
export function GrupoDeLaMesa({ publicacion, ...acciones }: { publicacion: PublicacionDeLaMesa } & Acciones) {
  const colores = useColores()
  const enlace = esEnlaceSeguro(publicacion.enlace) ? publicacion.enlace : null
  const nombre = NOMBRE_RED[publicacion.red] ?? publicacion.red
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
        {publicacion.miniatura ? (
          <Image source={{ uri: publicacion.miniatura }} style={{ width: 48, height: 48, borderRadius: 8 }} />
        ) : null}
        <View style={{ flex: 1, gap: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colorDeRed(colores, publicacion.red) }} />
            <Text style={{ color: colores.tenue, fontSize: 11, fontFamily: TIPO_TITULO, letterSpacing: 1, textTransform: 'uppercase' }} numberOfLines={1}>
              {nombre}
              {publicacion.cuenta ? ` · ${publicacion.cuenta}` : ''}
            </Text>
          </View>
          <Pressable
            onPress={enlace ? () => void Linking.openURL(enlace) : undefined}
            disabled={!enlace}
            accessibilityRole={enlace ? 'link' : undefined}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <Text style={{ color: colores.suave, fontSize: 13 }} numberOfLines={2}>
              {publicacion.texto || '(sin texto)'}
            </Text>
          </Pressable>
          {publicacion.palabraClave ? (
            <Text style={{ color: colores.tenue, fontSize: 11 }}>Palabra clave: {publicacion.palabraClave}</Text>
          ) : null}
        </View>
      </View>
      {publicacion.comentarios.map((c) => (
        <TarjetaDeComentario key={c.id} comentario={c} red={publicacion.red} {...acciones} />
      ))}
    </View>
  )
}

type Trabajo = 'enviando' | 'descartando' | 'redactando'

/**
 * Un comentario. Si espera respuesta (o falló): el cuadro con el borrador, «Enviar», «Descartar» y
 * el botón para pedir otro borrador, con las preguntas del panel antes de lo que no tiene vuelta. Si
 * ya se resolvió, lo que salió, sin botones.
 */
function TarjetaDeComentario({
  comentario: c,
  red,
  token,
  salir,
  alCambiar,
  ahora,
}: { comentario: ComentarioDeLaMesa; red: string } & Acciones) {
  const colores = useColores()
  const { preguntar } = useVentanas()
  const [texto, setTexto] = useState(c.borrador ?? '')
  // Cuando llega otro borrador del servidor («Escribir otro borrador», o la cola que se volvió a
  // leer), el cuadro lo toma: sin esto se quedaría con el de antes.
  const [previo, setPrevio] = useState(c.borrador)
  if (c.borrador !== previo) {
    setPrevio(c.borrador)
    setTexto(c.borrador ?? '')
  }
  const [trabajo, setTrabajo] = useState<Trabajo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const editable = esEditable(c)
  const otroBorrador = botonDeBorrador(c)
  const ocupado = trabajo !== null

  async function pedir(cual: Trabajo, ruta: string, cuerpo: unknown) {
    if (!token) return
    setError(null)
    setTrabajo(cual)
    try {
      await apiPost(ruta, token, cuerpo)
      anotarCambio()
      await alCambiar()
    } catch (e) {
      if (e instanceof SesionCaducada) {
        await salir()
        return
      }
      setError(fraseDelFallo(e))
    } finally {
      setTrabajo(null)
    }
  }

  const base = `/api/mobile/comentarios/${encodeURIComponent(c.id)}`

  function enviar() {
    void pedir('enviando', `${base}/respuesta`, { texto })
  }

  async function descartar() {
    const si = await preguntar({
      titulo: '¿Descartar este comentario?',
      detalle: 'No se va a responder.',
      accion: 'Descartar',
      cancelar: 'Cancelar',
      peligro: true,
    })
    if (si) void pedir('descartando', `${base}/descartar`, {})
  }

  async function redactar() {
    // Lo que se corrigió a mano no se pierde sin preguntar.
    if (seCorrigio(texto, c.borrador)) {
      const si = await preguntar({
        titulo: '¿Cambiar lo que escribiste por un borrador nuevo?',
        accion: 'Cambiarlo',
        cancelar: 'Cancelar',
        peligro: true,
      })
      if (!si) return
    }
    void pedir('redactando', `${base}/borrador`, {})
  }

  const nombreRed = NOMBRE_RED[red] ?? red
  const privado = lineaDelPrivado(c.privado)

  return (
    <View style={{ backgroundColor: colores.tarjeta, borderRadius: 16, padding: 14, gap: 8 }}>
      <Text style={{ color: colores.tenue, fontSize: 12 }}>
        <Text style={{ color: colores.texto }}>{c.autor ?? 'Alguien'}</Text> · {hace(c.publicadoEl, ahora)}
      </Text>
      {/* Hay comentarios que llegan sin texto (ver docs/pendientes.md): se dice, en vez de un hueco. */}
      {c.texto.trim() ? (
        <Text style={{ color: colores.texto, fontSize: 14, lineHeight: 20 }}>{c.texto}</Text>
      ) : (
        <Text style={{ color: colores.tenue, fontSize: 14, fontStyle: 'italic' }}>(sin texto)</Text>
      )}

      {editable ? (
        <>
          {c.borrador === null && c.borradorError ? (
            <Text style={{ color: colores.rojo, fontSize: 13 }}>{c.borradorError}</Text>
          ) : null}
          {c.automatico && c.estado === 'fallido' ? (
            <Text style={{ color: colores.tenue, fontSize: 12 }}>
              La regla de palabra clave intentó responder y la red no aceptó; «Enviar» lo reintenta.
            </Text>
          ) : null}
          <TextInput
            value={texto}
            onChangeText={setTexto}
            multiline
            editable={!ocupado}
            accessibilityLabel="Tu respuesta"
            placeholder="Tu respuesta…"
            placeholderTextColor={colores.tenue}
            style={{
              backgroundColor: colores.fondo,
              color: colores.texto,
              borderRadius: 12,
              padding: 12,
              minHeight: 84,
              fontSize: 14,
              textAlignVertical: 'top',
              opacity: ocupado ? 0.6 : 1,
            }}
          />
          {c.estado === 'fallido' && c.error ? <Text style={{ color: colores.rojo, fontSize: 13 }}>{c.error}</Text> : null}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Boton texto={trabajo === 'enviando' ? 'Enviando…' : 'Enviar'} onPress={enviar} destacado deshabilitado={ocupado} />
            <Boton texto={trabajo === 'descartando' ? 'Descartando…' : 'Descartar'} onPress={() => void descartar()} deshabilitado={ocupado} />
          </View>
          {otroBorrador ? (
            <View style={{ alignItems: 'flex-start' }}>
              <BotonTexto
                texto={trabajo === 'redactando' ? 'Escribiendo el borrador…' : `↺ ${otroBorrador}`}
                onPress={() => void redactar()}
                deshabilitado={ocupado}
              />
            </View>
          ) : null}
          {error ? (
            <Text accessibilityRole="alert" style={{ color: colores.rojo, fontSize: 13 }}>
              {error}
            </Text>
          ) : null}
        </>
      ) : (
        <View style={{ gap: 4 }}>
          {c.estado === 'enviado' ? (
            <Text style={{ color: colores.suave, fontSize: 14 }}>
              <Text style={{ color: colores.verde }}>Respondido:</Text> {c.borrador}
              {c.automatico ? <Text style={{ color: colores.tenue, fontSize: 12 }}>  · Automática</Text> : null}
            </Text>
          ) : c.estado === 'en_la_red' ? (
            <Text style={{ color: colores.suave, fontSize: 14 }}>
              <Text style={{ color: colores.verde }}>Respondido desde {nombreRed}:</Text> {c.borrador}
            </Text>
          ) : (
            <Text style={{ color: colores.tenue, fontSize: 14 }}>Descartado{c.error ? ` · ${c.error}` : ''}</Text>
          )}
          {privado ? <Text style={{ color: colores.tenue, fontSize: 12 }}>{privado}</Text> : null}
        </View>
      )}
    </View>
  )
}
