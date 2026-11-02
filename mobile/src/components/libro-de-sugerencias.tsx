import { useEffect, useState } from 'react'
import { Animated, Platform, Text, TextInput, View } from 'react-native'
import Constants from 'expo-constants'
import * as Updates from 'expo-updates'
import { Boton, BotonTexto, Chip, Tarjeta } from './ui'
import type { Colores } from './colores'
import { useSesion } from './sesion'
import { useColores, useTema } from './tema'
import { RechazoApi, SesionCaducada, apiPost } from '../lib/api'
import { MAX_TEXTO_SUGERENCIA, SUGERENCIA_VACIA, TIPOS, TIPOS_SUGERENCIA, type TipoSugerencia } from '../lib/sugerencias'
import { ECHAR_AL_LIBRO, QUEDO_EN_EL_LIBRO, type Tema } from '../lib/tema'

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

/**
 * El libro de sugerencias de la app, al final de Ajustes: lo mismo que la ventana del panel. Lo
 * escrito va a `POST /api/mobile/sugerencias`, con la versión de la app y de la actualización.
 */
export function LibroDeSugerencias() {
  const colores = useColores()
  const { tema } = useTema()
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
    <Tarjeta>
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
    </Tarjeta>
  )
}
