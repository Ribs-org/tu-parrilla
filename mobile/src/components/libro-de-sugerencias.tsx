import { useEffect, useState } from 'react'
import { Animated, Platform, Pressable, Text, TextInput, View } from 'react-native'
import Constants from 'expo-constants'
import * as Updates from 'expo-updates'
import { Boton, BotonTexto, Chip, Etiqueta, Tarjeta } from './ui'
import type { Colores } from './colores'
import { useSesion } from './sesion'
import { useColores, useTema } from './tema'
import { RechazoApi, SesionCaducada, apiPost } from '../lib/api'
import {
  LIBRO_ESCRIBIR,
  LO_QUE_NOS_ESCRIBISTE,
  MAX_TEXTO_SUGERENCIA,
  SUGERENCIA_VACIA,
  TIPOS,
  TIPOS_SUGERENCIA,
  conLeidas,
  respuestasNuevas,
  type LibroLeido,
  type TipoSugerencia,
} from '../lib/sugerencias'
import { ECHAR_AL_LIBRO, LIBRO, QUEDO_EN_EL_LIBRO, type Tema } from '../lib/tema'
import { useScreenData } from '../lib/useScreenData'

const SIN_SENAL = 'No se pudo mandar. Revisa tu señal: lo que escribiste sigue acá.'

/**
 * El dibujo del libro de sugerencias, con vistas y `Animated` de react-native: nada nativo
 * nuevo, llega por aire. De noche, un libro abierto; de día, la caja de madera con su ranura,
 * como en el panel (`src/components/libro-de-sugerencias.tsx`). Al recibirse, de noche la hoja
 * cae en la página derecha y la página da vuelta; de día la hoja entra por la ranura.
 */
function Dibujo({ tema, colores, recibido }: { tema: Tema; colores: Colores; recibido: boolean }) {
  const [caida] = useState(() => new Animated.Value(0))
  const [vuelta] = useState(() => new Animated.Value(0))

  useEffect(() => {
    if (!recibido) {
      caida.setValue(0)
      vuelta.setValue(0)
      return
    }
    Animated.sequence([
      Animated.timing(caida, { toValue: 1, duration: 420, useNativeDriver: true }),
      Animated.timing(vuelta, { toValue: 1, duration: 520, useNativeDriver: true }),
    ]).start()
  }, [recibido, caida, vuelta])

  const hoja = (ancho: number, alto: number) => (
    <View
      style={{
        width: ancho,
        height: alto,
        borderRadius: 2,
        borderWidth: 1.5,
        borderColor: colores.brasa,
        backgroundColor: tema === 'dia' ? colores.tarjeta : colores.texto,
        paddingHorizontal: 4,
        paddingTop: 5,
        gap: 4,
      }}
    >
      {[1, 0.8, 1].map((largo, i) => (
        <View key={i} style={{ height: 1.5, width: `${largo * 100}%`, backgroundColor: colores.brasa }} />
      ))}
    </View>
  )

  if (tema === 'dia') {
    // La hoja baja y se esconde detrás del techo de la caja: el recorte es la ventana de arriba.
    const baja = caida.interpolate({ inputRange: [0, 1], outputRange: [0, 34] })
    return (
      <View style={{ alignSelf: 'center', width: 120, height: 84, alignItems: 'center' }} accessible={false}>
        <View style={{ height: 34, width: 40, overflow: 'hidden', alignItems: 'center' }}>
          <Animated.View style={{ marginTop: 4, transform: [{ translateY: baja }] }}>{hoja(24, 30)}</Animated.View>
        </View>
        {/* El techo con la ranura, y la caja. */}
        <View
          style={{
            width: 84,
            height: 10,
            borderTopLeftRadius: 10,
            borderTopRightRadius: 10,
            backgroundColor: colores.acero,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View style={{ width: 34, height: 3, borderRadius: 2, backgroundColor: colores.texto }} />
        </View>
        <View
          style={{
            width: 76,
            height: 38,
            backgroundColor: colores.velo + '14',
            borderWidth: 1.5,
            borderColor: colores.suave,
            borderRadius: 3,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View style={{ width: 14, height: 28, borderRadius: 1, backgroundColor: colores.tarjeta, borderWidth: 1, borderColor: colores.suave }} />
        </View>
      </View>
    )
  }

  const cae = caida.interpolate({ inputRange: [0, 1], outputRange: [-22, 0] })
  const hojaSeVa = vuelta.interpolate({ inputRange: [0, 0.5, 0.51, 1], outputRange: [1, 1, 0, 0] })
  const gira = vuelta.interpolate({ inputRange: [0, 1], outputRange: [1, -1] })
  const pagina = { width: 52, height: 44, backgroundColor: colores.texto, borderRadius: 3 }
  return (
    <View style={{ alignSelf: 'center', width: 120, height: 84, justifyContent: 'flex-end' }} accessible={false}>
      {/* Las tapas, de cuero, y las dos páginas. */}
      <View style={{ position: 'absolute', bottom: 0, left: 4, right: 4, height: 50, borderRadius: 4, backgroundColor: colores.brasa }} />
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 4, gap: 2 }}>
        <View style={[pagina, { paddingHorizontal: 6, paddingTop: 8, gap: 6 }]}>
          {[1, 0.8, 0.9].map((largo, i) => (
            <View key={i} style={{ height: 1.5, width: `${largo * 100}%`, backgroundColor: colores.acero }} />
          ))}
        </View>
        <View style={pagina}>
          <Animated.View style={[pagina, { position: 'absolute', transformOrigin: 'left', transform: [{ scaleX: gira }] }]}>
            <Animated.View style={{ opacity: hojaSeVa, alignItems: 'center', transform: [{ translateY: cae }] }}>
              <View style={{ marginTop: 6 }}>{hoja(30, 32)}</View>
            </Animated.View>
          </Animated.View>
        </View>
      </View>
    </View>
  )
}

/** El punto de brasa de «sin leer», el mismo del panel. */
function Punto({ colores }: { colores: Colores }) {
  return <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colores.brasa }} />
}

/**
 * El libro de sugerencias de la app, al final de Ajustes: lo mismo que la ventana del panel. Su
 * rótulo, con el punto y «1 respuesta nueva» si el equipo respondió algo que la persona no abrió,
 * y dos pestañas: «Escribir» y «Lo que nos escribiste». Lo escrito va a
 * `POST /api/mobile/sugerencias`; lo ya escrito, con las respuestas, sale de `GET` en la misma
 * ruta, y abrir una respuesta nueva la marca leída (`POST /api/mobile/sugerencias/{id}/leida`).
 */
export function LibroDeSugerencias() {
  const colores = useColores()
  const { tema } = useTema()
  const { token, salir } = useSesion()
  const { data, error, refrescar } = useScreenData<LibroLeido>('sugerencias', '/api/mobile/sugerencias', token, salir)
  const [leidas, setLeidas] = useState<ReadonlySet<string>>(() => new Set())
  // Hasta que la persona elige, se abre en «Lo que nos escribiste» si hay algo sin leer.
  const [elegida, setElegida] = useState<'escribir' | 'leer' | null>(null)
  const libro = data ? conLeidas(data, leidas) : null
  const vista = elegida ?? (libro && libro.sinLeer > 0 ? 'leer' : 'escribir')

  function leer(id: string) {
    setLeidas((antes) => new Set(antes).add(id))
    if (!token) return
    // Si no llega, la respuesta vuelve a aparecer nueva la próxima vez: no se pierde nada.
    void apiPost(`/api/mobile/sugerencias/${id}/leida`, token, {})
      .then(() => refrescar())
      .catch(() => undefined)
  }

  return (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
        <Etiqueta>{LIBRO[tema]}</Etiqueta>
        {libro && libro.sinLeer > 0 ? (
          <View
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            accessible
            accessibilityLabel={respuestasNuevas(libro.sinLeer)}
          >
            <Punto colores={colores} />
            <Text style={{ color: colores.brasa, fontSize: 11, fontWeight: '600' }}>{respuestasNuevas(libro.sinLeer)}</Text>
          </View>
        ) : null}
      </View>
      <Tarjeta>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
          <Chip texto={LIBRO_ESCRIBIR} activo={vista === 'escribir'} onPress={() => setElegida('escribir')} />
          <View>
            <Chip texto={LO_QUE_NOS_ESCRIBISTE} activo={vista === 'leer'} onPress={() => setElegida('leer')} />
            {libro && libro.sinLeer > 0 ? (
              <View style={{ position: 'absolute', top: 2, right: 2 }}>
                <Punto colores={colores} />
              </View>
            ) : null}
          </View>
        </View>
        {vista === 'leer' ? <LoQueNosEscribiste libro={libro} error={error} alAbrir={leer} /> : null}
        {/* Escondida y no desmontada: lo que se estaba escribiendo sigue ahí al volver. */}
        <View style={{ display: vista === 'escribir' ? 'flex' : 'none', gap: 6 }}>
          <Escribir tema={tema} alRecibir={() => void refrescar()} />
        </View>
      </Tarjeta>
    </>
  )
}

/**
 * Cada cosa que la persona escribió, cerrada en un renglón con su tipo, su fecha y si tiene
 * respuesta. Al tocarla se abre entera, con lo que le respondió el equipo.
 */
function LoQueNosEscribiste({
  libro,
  error,
  alAbrir,
}: {
  libro: LibroLeido | null
  error: string | null
  alAbrir: (id: string) => void
}) {
  const colores = useColores()
  const [abiertas, setAbiertas] = useState<ReadonlySet<string>>(() => new Set())

  if (!libro) {
    return <Text style={{ color: colores.suave, fontSize: 13 }}>{error ?? 'Abriendo…'}</Text>
  }
  if (libro.sugerencias.length === 0) {
    return (
      <Text style={{ color: colores.suave, fontSize: 13 }}>
        Todavía no nos escribes nada. Lo que escribas aparece acá, con lo que te respondamos.
      </Text>
    )
  }
  return (
    <View style={{ gap: 8 }}>
      {libro.sugerencias.map((s) => {
        const abierta = abiertas.has(s.id)
        const estado = s.nueva ? 'Respuesta nueva' : s.respuesta ? 'Respondida' : 'Sin respuesta todavía'
        return (
          <Pressable
            key={s.id}
            onPress={() => {
              setAbiertas((antes) => {
                const nuevas = new Set(antes)
                if (nuevas.has(s.id)) nuevas.delete(s.id)
                else nuevas.add(s.id)
                return nuevas
              })
              if (!abierta && s.nueva) alAbrir(s.id)
            }}
            accessibilityRole="button"
            accessibilityState={{ expanded: abierta }}
            style={({ pressed }) => ({
              borderWidth: 1,
              borderColor: colores.acero,
              borderRadius: 12,
              padding: 10,
              gap: 6,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ color: colores.tenue, fontSize: 11, flex: 1 }}>
                {TIPOS[s.tipo]?.nombre ?? s.tipo}
                {s.creadaEnTexto ? ` · ${s.creadaEnTexto}` : ''}
              </Text>
              {s.nueva ? <Punto colores={colores} /> : null}
              <Text style={{ color: s.nueva ? colores.brasa : colores.tenue, fontSize: 11, fontWeight: s.nueva ? '600' : '400' }}>
                {estado}
              </Text>
            </View>
            <Text style={{ color: colores.suave, fontSize: 13 }} numberOfLines={abierta ? undefined : 1}>
              {s.texto}
            </Text>
            {abierta ? (
              s.respuesta ? (
                <View style={{ borderLeftWidth: 2, borderLeftColor: colores.brasa, paddingLeft: 10, gap: 4 }}>
                  <Text style={{ color: colores.brasa, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' }}>
                    Te respondió el equipo{s.respondidaEnTexto ? ` · ${s.respondidaEnTexto}` : ''}
                  </Text>
                  <Text style={{ color: colores.texto, fontSize: 13 }}>{s.respuesta}</Text>
                </View>
              ) : (
                <Text style={{ color: colores.tenue, fontSize: 12 }}>
                  Todavía no te respondemos. Cuando lo hagamos, aparece acá y te llega un correo.
                </Text>
              )
            ) : null}
          </Pressable>
        )
      })}
    </View>
  )
}

/** La pestaña de escribir: lo que era el libro entero antes de las respuestas. */
function Escribir({ tema, alRecibir }: { tema: Tema; alRecibir: () => void }) {
  const colores = useColores()
  const { token, salir } = useSesion()
  const [tipo, setTipo] = useState<TipoSugerencia>('idea')
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [recibido, setRecibido] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function mandar() {
    if (!texto.trim()) {
      setError(SUGERENCIA_VACIA)
      return
    }
    if (!token) return
    setError(null)
    setEnviando(true)
    try {
      await apiPost('/api/mobile/sugerencias', token, {
        tipo,
        texto,
        app: {
          version: Constants.expoConfig?.version,
          actualizacion: Updates.updateId?.slice(0, 8),
          plataforma: Platform.OS,
        },
      })
      setRecibido(true)
      alRecibir()
    } catch (e) {
      if (e instanceof SesionCaducada) {
        await salir()
        return
      }
      setError(e instanceof RechazoApi ? e.message : SIN_SENAL)
    } finally {
      setEnviando(false)
    }
  }

  function otra() {
    setTexto('')
    setRecibido(false)
  }

  return (
    <>
      <Dibujo tema={tema} colores={colores} recibido={recibido} />
      {recibido ? (
        <View style={{ gap: 8, alignItems: 'center' }}>
          <Text style={{ color: colores.brasa, fontSize: 14, fontWeight: '700' }}>{QUEDO_EN_EL_LIBRO[tema]}</Text>
          <Text style={{ color: colores.suave, fontSize: 13, textAlign: 'center' }}>
            Gracias. Lo lee el equipo que hace Tu Parrilla: si es una idea, la pensamos; si algo no funciona, lo buscamos.
          </Text>
          <BotonTexto texto="Escribir otra" onPress={otra} />
        </View>
      ) : (
        <View style={{ gap: 8 }}>
          <Text style={{ color: colores.suave, fontSize: 13 }}>
            Lo lee el equipo que hace Tu Parrilla. No te prometemos hacerlo todo, pero lo leemos todo.
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {TIPOS_SUGERENCIA.map((t) => (
              <Chip key={t} texto={TIPOS[t].nombre} activo={tipo === t} onPress={() => setTipo(t)} />
            ))}
          </View>
          <Text style={{ color: colores.tenue, fontSize: 12 }}>{TIPOS[tipo].ayuda}</Text>
          <TextInput
            value={texto}
            onChangeText={(t) => {
              setTexto(t)
              if (error) setError(null)
            }}
            multiline
            maxLength={MAX_TEXTO_SUGERENCIA}
            editable={!enviando}
            placeholder={TIPOS[tipo].ejemplo}
            placeholderTextColor={colores.tenue}
            accessibilityLabel="Lo que nos quieres decir"
            style={{
              backgroundColor: colores.fondo,
              color: colores.texto,
              borderRadius: 12,
              padding: 12,
              minHeight: 110,
              textAlignVertical: 'top',
              borderWidth: 1,
              borderColor: error ? colores.rojo : colores.acero,
            }}
          />
          <Text style={{ color: colores.tenue, fontSize: 11, textAlign: 'right' }}>
            {texto.length} / {MAX_TEXTO_SUGERENCIA}
          </Text>
          <Text style={{ color: colores.tenue, fontSize: 11, lineHeight: 16 }}>
            Se publica en el repositorio público de Tu Parrilla en GitHub, sin tu nombre ni tu correo. Va con la versión
            de la app, el modo y cuántas cuentas tienes conectadas. No escribas contraseñas ni datos personales.
          </Text>
          {error ? (
            <Text accessibilityRole="alert" style={{ color: colores.rojo, fontSize: 13 }}>
              {error}
            </Text>
          ) : null}
          <View style={{ flexDirection: 'row' }}>
            <Boton
              texto={enviando ? 'Mandando…' : ECHAR_AL_LIBRO[tema]}
              onPress={() => void mandar()}
              deshabilitado={enviando}
              destacado
            />
          </View>
        </View>
      )}
    </>
  )
}
