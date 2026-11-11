import { useEffect, useRef, useState } from 'react'
import { AccessibilityInfo, Animated, Easing, Modal, Pressable, Text, View, useWindowDimensions } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useRouter } from 'expo-router'
import { SesionCaducada, apiPost } from '../lib/api'
import { VER_EL_CORTE, quedanPorCelebrar, sumarCelebrado, tituloDelHito, type HitoPorCelebrar } from '../lib/lo-que-trajo'
import { carneDe, coccionDe, selloPorEstado } from '../lib/parrilla'
import { Llama } from './llama'
import { Pieza } from './pieza'
import { useSesion } from './sesion'
import { useColores, useTema } from './tema'
import { Boton, TIPO_TITULO } from './ui'

/** Los ids de los hitos que este teléfono ya celebró, en AsyncStorage. */
const CLAVE_CELEBRADOS = 'hitos-celebrados'

/** Las llamas que cruzan, de alto distinto para que no parezcan una fila de soldados. */
const LLAMAS = [46, 70, 54, 88, 62, 78, 50]

/** Cuánto tarda el fuego en cruzar la pantalla. */
const CRUCE_MS = 1800

/**
 * La celebración de los hitos en La Parrilla: cuando un corte pasa 100, 1.000, 10.000… vistas, al
 * abrir cruza la pantalla una fila de llamas —fuego de noche, el soplete de día— y queda una tarjeta
 * con el corte y «Tu corte pasó las 1.000 vistas». Una vez por hito: al mostrarla se le avisa al
 * servidor (`POST /api/mobile/hitos/{id}/celebrado`) y el teléfono anota el id, porque lo guardado
 * de la vez anterior puede traer uno que ya se celebró. Si llegan varios, uno detrás de otro.
 *
 * `hitos` viene con la fila (`GET /api/mobile/lo-que-trajo`); un sitio de antes no lo manda.
 */
export function CelebracionDeHitos({ hitos }: { hitos: HitoPorCelebrar[] | undefined }) {
  const { token, salir } = useSesion()
  const router = useRouter()
  // Hasta leer lo que el teléfono ya celebró, no se celebra nada: podría repetirse uno.
  const [celebrados, setCelebrados] = useState<ReadonlySet<string> | null>(null)
  // Los que ya se le avisaron al servidor en esta vuelta: el aviso sale una vez aunque se redibuje.
  const avisados = useRef(new Set<string>())

  useEffect(() => {
    let vivo = true
    void AsyncStorage.getItem(CLAVE_CELEBRADOS)
      .then((guardado) => leerLista(guardado))
      .catch(() => [])
      .then((lista) => {
        if (vivo) setCelebrados(new Set(lista))
      })
    return () => {
      vivo = false
    }
  }, [])

  const actual = celebrados ? (quedanPorCelebrar(hitos, celebrados)[0] ?? null) : null

  useEffect(() => {
    if (!actual || !token || avisados.current.has(actual.id)) return
    avisados.current.add(actual.id)
    // Se anota apenas se muestra: si la app se cierra con la tarjeta abierta, igual quedó vista.
    void AsyncStorage.getItem(CLAVE_CELEBRADOS)
      .then((guardado) => AsyncStorage.setItem(CLAVE_CELEBRADOS, JSON.stringify(sumarCelebrado(leerLista(guardado), actual.id))))
      .catch(() => {})
    // Si no llega, el servidor lo vuelve a mandar, y este teléfono ya no lo celebra; otro sí.
    apiPost(`/api/mobile/hitos/${encodeURIComponent(actual.id)}/celebrado`, token, {}).catch((e) => {
      if (e instanceof SesionCaducada) void salir()
    })
  }, [actual, token, salir])

  if (!celebrados) return null
  const cerrar = () => {
    if (actual) setCelebrados(new Set([...celebrados, actual.id]))
  }
  // Un solo `Modal` para todas, que cambia de tarjeta adentro: en iOS, cerrar uno y abrir otro al
  // instante puede dejar el segundo sin mostrarse.
  return (
    <Modal transparent visible={actual !== null} animationType="fade" onRequestClose={cerrar} statusBarTranslucent>
      {actual ? (
        <Celebracion
          key={actual.id}
          hito={actual}
          onCerrar={cerrar}
          onVer={() => {
            cerrar()
            router.push({ pathname: '/corte/[id]', params: { id: actual.corte.id } })
          }}
        />
      ) : null}
    </Modal>
  )
}

function leerLista(guardado: string | null): string[] {
  if (!guardado) return []
  try {
    const lista: unknown = JSON.parse(guardado)
    return Array.isArray(lista) ? lista.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

function Celebracion({ hito, onCerrar, onVer }: { hito: HitoPorCelebrar; onCerrar: () => void; onVer: () => void }) {
  const colores = useColores()
  const { tema } = useTema()
  const { width } = useWindowDimensions()
  const [cruce] = useState(() => new Animated.Value(0))
  const [entrada] = useState(() => new Animated.Value(0))

  useEffect(() => {
    let vivo = true
    // Con «reducir movimiento» encendido, la tarjeta aparece sin el fuego que cruza.
    void AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((quieto) => {
        if (!vivo) return
        if (quieto) {
          cruce.setValue(1)
          entrada.setValue(1)
          return
        }
        Animated.parallel([
          Animated.timing(cruce, { toValue: 1, duration: CRUCE_MS, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
          Animated.spring(entrada, { toValue: 1, delay: CRUCE_MS * 0.35, friction: 6, tension: 70, useNativeDriver: true }),
        ]).start()
      })
    return () => {
      vivo = false
    }
  }, [cruce, entrada])

  const titulo = tituloDelHito(hito.umbral, tema)
  const estados = hito.corte.redes.map((r) => r.estado)
  // La fila de llamas entra por la izquierda y sale por la derecha, más ancha que la pantalla.
  const anchoDeLasLlamas = LLAMAS.length * 56
  const x = cruce.interpolate({ inputRange: [0, 1], outputRange: [-anchoDeLasLlamas, width] })
  const brillo = cruce.interpolate({ inputRange: [0, 0.15, 0.85, 1], outputRange: [0, 1, 1, 0] })

  return (
    <>
      {/* El fondo cierra al tocarlo; para un lector de pantalla, cierra «Seguir». */}
      <Pressable
        onPress={onCerrar}
        accessible={false}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.62)', justifyContent: 'center', padding: 24 }}
      >
        <Animated.View
          pointerEvents="none"
          style={{
            // Abajo, debajo de la tarjeta y no detrás: así se ve cruzar entera.
            position: 'absolute',
            left: 0,
            bottom: '9%',
            flexDirection: 'row',
            alignItems: 'flex-end',
            gap: 14,
            opacity: brillo,
            transform: [{ translateX: x }],
          }}
        >
          {LLAMAS.map((alto, i) => (
            <Llama key={i} alto={alto} />
          ))}
        </Animated.View>

        <Animated.View
          style={{
            opacity: entrada,
            transform: [{ scale: entrada.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }],
          }}
        >
          {/* Tocar la tarjeta no la cierra: solo el fondo y los botones. */}
          <Pressable
            onPress={() => {}}
            accessible={false}
            style={{ backgroundColor: colores.tarjeta, borderRadius: 20, padding: 20, gap: 14, alignItems: 'center' }}
          >
            <View style={{ width: 116, height: 76, overflow: 'hidden' }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <View style={{ transform: [{ scale: 1.4 }], transformOrigin: 'top left' }}>
                <Pieza
                  formato={hito.corte.formato ?? 'bife'}
                  huesos={hito.corte.huesos ?? 0}
                  carne={carneDe(estados)}
                  coccion={coccionDe(estados)}
                  sellos={hito.corte.redes.map((r) => r.sello ?? selloPorEstado(r.estado, r.error))}
                />
              </View>
            </View>
            <Text
              accessibilityRole="header"
              style={{ color: colores.texto, fontFamily: TIPO_TITULO, fontSize: 24, textAlign: 'center', letterSpacing: 0.3 }}
            >
              {titulo}
            </Text>
            {hito.corte.texto ? (
              <Text style={{ color: colores.suave, fontSize: 13, textAlign: 'center' }} numberOfLines={2}>
                {hito.corte.texto}
              </Text>
            ) : null}
            <View style={{ flexDirection: 'row', gap: 8, alignSelf: 'stretch' }}>
              <Boton texto="Seguir" onPress={onCerrar} />
              <Boton texto={VER_EL_CORTE[tema]} onPress={onVer} destacado />
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </>
  )
}
