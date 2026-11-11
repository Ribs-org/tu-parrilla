import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { AppState, Text, View } from 'react-native'
import {
  IR_A_LA_TIENDA,
  abrirLaTienda,
  faltaAvisar,
  leerVersion,
  loQueToca,
  marcarAvisada,
  versionGuardada,
  versionPropia,
  type LoQueToca,
  type VersionDelServidor,
} from '../lib/version'
import { useColores } from './tema'
import { Boton, TIPO_TITULO } from './ui'
import { useVentanas } from './ventana'

/**
 * Cuánto se espera, ya dibujada la app, antes del aviso de la versión nueva: que se vea la app
 * primero. Va antes que la pregunta de los avisos (ocho segundos, `avisos.tsx`).
 */
const ESPERA_PARA_AVISAR_MS = 3_000

type Version = { toca: LoQueToca; servidor: VersionDelServidor | null }

const Contexto = createContext<Version>({ toca: null, servidor: null })

/** Si hay que ir a la tienda y qué dice el servidor de la versión (`src/lib/version.ts`). */
export function useVersion(): Version {
  return useContext(Contexto)
}

/**
 * Lo que dice el servidor de la versión, para toda la app: arranca con lo guardado de la vez
 * anterior, lo pide de nuevo y vuelve a pedirlo cada vez que la app vuelve al frente. Así una
 * mínima que sube alcanza también a una app que se queda abierta días. Vive en el layout, arriba
 * de la sesión: vale también en la pantalla de entrada.
 */
export function ProveedorDeVersion({ children }: { children: ReactNode }) {
  const [servidor, setServidor] = useState<VersionDelServidor | null>(null)

  useEffect(() => {
    let vigente = true
    const pedir = () =>
      void leerVersion().then((v) => {
        if (vigente && v !== undefined) setServidor(v)
      })
    void versionGuardada().then((v) => {
      if (vigente && v) setServidor((actual) => actual ?? v)
      pedir()
    })
    const suscripcion = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') pedir()
    })
    return () => {
      vigente = false
      suscripcion.remove()
    }
  }, [])

  const [propia] = useState(versionPropia)
  return <Contexto.Provider value={{ toca: loQueToca(propia, servidor), servidor }}>{children}</Contexto.Provider>
}

/**
 * La pantalla de la mínima, en lugar de toda la app: sin pestañas ni vuelta atrás, solo el botón a
 * la tienda. Al volver ya actualizada, la app arranca de nuevo con el binario nuevo y no sale.
 */
export function PantallaDeActualizar({ servidor }: { servidor: VersionDelServidor }) {
  const colores = useColores()
  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24, gap: 12, backgroundColor: colores.fondo }}>
      <Text accessibilityRole="header" style={{ color: colores.texto, fontFamily: TIPO_TITULO, fontSize: 22, letterSpacing: 0.8 }}>
        Actualiza Tu Parrilla
      </Text>
      <Text style={{ color: colores.suave, fontSize: 15, lineHeight: 22 }}>
        Esta versión de la app ya no funciona. Actualízala en la tienda para seguir: se instala encima de esta y no
        pierdes nada. {servidor.novedades}
      </Text>
      <View style={{ flexDirection: 'row', marginTop: 8 }}>
        <Boton texto={IR_A_LA_TIENDA} onPress={() => void abrirLaTienda(servidor)} destacado />
      </View>
    </View>
  )
}

/**
 * El aviso de la recomendada, una vez por versión: «Actualizar» lleva a la tienda y «Después» no
 * vuelve a preguntar por esa versión; queda el botón al pie de Ajustes (`ActualizarDesdeAjustes`).
 */
export function AvisoDeVersionNueva() {
  const { toca, servidor } = useVersion()
  const { preguntar } = useVentanas()

  useEffect(() => {
    if (toca !== 'sugerida' || !servidor) return
    let vigente = true
    const reloj = setTimeout(async () => {
      if (!(await faltaAvisar(servidor.recomendada)) || !vigente) return
      await marcarAvisada(servidor.recomendada)
      const si = await preguntar({
        titulo: 'Hay una versión nueva',
        detalle: `${servidor.novedades} Se instala desde la tienda, encima de esta: no pierdes nada.`,
        cancelar: 'Después',
        accion: 'Actualizar',
      })
      if (si) await abrirLaTienda(servidor)
    }, ESPERA_PARA_AVISAR_MS)
    return () => {
      vigente = false
      clearTimeout(reloj)
    }
  }, [toca, servidor, preguntar])

  return null
}

/** Al pie de Ajustes, con la recomendada pendiente: lo que trae y el botón a la tienda. */
export function ActualizarDesdeAjustes() {
  const colores = useColores()
  const { toca, servidor } = useVersion()
  if (toca !== 'sugerida' || !servidor) return null
  return (
    <View style={{ gap: 6, marginTop: 16 }}>
      <Text style={{ color: colores.suave, fontSize: 12 }}>
        Hay una versión nueva de la app en la tienda. {servidor.novedades}
      </Text>
      <View style={{ flexDirection: 'row' }}>
        <Boton texto="Actualizar la app" onPress={() => void abrirLaTienda(servidor)} />
      </View>
    </View>
  )
}
