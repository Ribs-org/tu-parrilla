import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { Modal, Pressable, Text, View } from 'react-native'
import { Boton, TIPO_TITULO } from './ui'
import { useColores } from './tema'

/**
 * Lo que se pregunta o se avisa. `accion` es el verbo del botón que sigue —«Publicar», no
 * «Aceptar»—, y `peligro` lo pinta de rojo cuando lo que hace no tiene vuelta. Sin `cancelar`, es
 * un aviso: un solo botón, «Entendido». `cerrable: false` no deja cerrarla tocando afuera ni con
 * el botón Atrás: hay que elegir.
 */
export type Pregunta = {
  titulo: string
  detalle?: string
  accion: string
  cancelar?: string
  peligro?: boolean
  cerrable?: boolean
}

type Ventanas = {
  /** La ventana con dos botones: resuelve true con la acción, false con cualquier otra salida. */
  preguntar: (pregunta: Pregunta & { cancelar: string }) => Promise<boolean>
  /** La ventana con un solo botón, «Entendido»: resuelve al cerrarla. */
  avisar: (titulo: string, detalle?: string) => Promise<void>
}

const Contexto = createContext<Ventanas | null>(null)

export function useVentanas(): Ventanas {
  const ventanas = useContext(Contexto)
  if (!ventanas) throw new Error('useVentanas necesita <ProveedorDeVentanas> arriba: está en el layout de la app.')
  return ventanas
}

/**
 * Las preguntas y los avisos de la app, en vez de `Alert.alert`: esa ventana la dibuja Android
 * (o iOS) con sus colores, oscura también de día, y con sus botones en mayúsculas. Esta es de la
 * app: la tarjeta del modo, el título en Oswald y los botones de la app, con el borde de arriba en
 * brasa, o en rojo si la acción no tiene vuelta.
 *
 * Es un `Modal` de react-native, que no pide nada nativo nuevo: llega por aire. Vive una sola vez
 * en el layout, debajo del tema, y cualquier pantalla la pide con `useVentanas()`.
 */
export function ProveedorDeVentanas({ children }: { children: ReactNode }) {
  const colores = useColores()
  const [abierta, setAbierta] = useState<Pregunta | null>(null)
  const responder = useRef<((si: boolean) => void) | null>(null)

  const abrir = useCallback(
    (pregunta: Pregunta) =>
      new Promise<boolean>((resolve) => {
        // Una pregunta nueva responde que no a la que estaba: ninguna promesa queda colgada.
        responder.current?.(false)
        responder.current = resolve
        setAbierta(pregunta)
      }),
    [],
  )

  const terminar = useCallback((si: boolean) => {
    responder.current?.(si)
    responder.current = null
    setAbierta(null)
  }, [])

  const [ventanas] = useState<Ventanas>(() => ({
    preguntar: (pregunta) => abrir(pregunta),
    avisar: (titulo, detalle) => abrir({ titulo, detalle, accion: 'Entendido' }).then(() => undefined),
  }))

  const cerrable = abierta?.cerrable !== false
  const borde = abierta?.peligro ? colores.rojo : colores.brasa

  return (
    <Contexto.Provider value={ventanas}>
      {children}
      <Modal
        visible={abierta !== null}
        transparent
        animationType="fade"
        statusBarTranslucent
        // El botón Atrás de Android: lo mismo que «Cancelar», salvo que haya que elegir.
        onRequestClose={() => {
          if (cerrable) terminar(false)
        }}
      >
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={abierta?.cancelar ?? 'Cerrar'}
            onPress={() => {
              if (cerrable) terminar(false)
            }}
            style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: '#000000aa' }}
          />
          {abierta ? (
            <View
              accessibilityViewIsModal
              style={{
                width: '100%',
                maxWidth: 420,
                backgroundColor: colores.tarjeta,
                borderRadius: 16,
                borderTopWidth: 3,
                borderTopColor: borde,
                padding: 18,
                gap: 10,
              }}
            >
              <Text
                accessibilityRole="header"
                style={{ color: colores.texto, fontFamily: TIPO_TITULO, fontSize: 16, letterSpacing: 0.8, textTransform: 'uppercase' }}
              >
                {abierta.titulo}
              </Text>
              {abierta.detalle ? <Text style={{ color: colores.suave, fontSize: 14, lineHeight: 20 }}>{abierta.detalle}</Text> : null}
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
                {abierta.cancelar ? <Boton texto={abierta.cancelar} onPress={() => terminar(false)} /> : null}
                <Boton
                  texto={abierta.accion}
                  onPress={() => terminar(true)}
                  destacado={!abierta.peligro}
                  peligro={abierta.peligro}
                />
              </View>
            </View>
          ) : null}
        </View>
      </Modal>
    </Contexto.Provider>
  )
}
