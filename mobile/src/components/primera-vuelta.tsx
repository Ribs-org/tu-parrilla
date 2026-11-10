import AsyncStorage from '@react-native-async-storage/async-storage'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { AppState } from 'react-native'
import {
  CLAVE_PRIMERA_VUELTA,
  VUELTA_NUEVA,
  alArrancar,
  alEntrar,
  alSalir,
  alVolver,
  bienvenidaVista,
  chefPresentado,
  cocinaConocida,
  leerVuelta,
  type PrimeraVuelta,
} from '../lib/primera-vuelta'
import { useSesion } from './sesion'

type LaVuelta = {
  /** Ya se leyó lo guardado. La raíz lo espera: sin esto, La Parrilla se vería un instante antes de la bienvenida. */
  cargada: boolean
  vuelta: PrimeraVuelta
  /** Recién canjeado el código, antes de `abrir`: la primera apertura, con bienvenida si no hay redes. */
  entrar: (sinRedes: boolean) => void
  terminarBienvenida: () => void
  /** La persona abrió La Cocina: el chef ya no se presenta. */
  conocerLaCocina: () => void
  presentarAlChef: () => void
}

const Contexto = createContext<LaVuelta>({
  cargada: false,
  vuelta: VUELTA_NUEVA,
  entrar: () => {},
  terminarBienvenida: () => {},
  conocerLaCocina: () => {},
  presentarAlChef: () => {},
})

/**
 * La primera vuelta (`lib/primera-vuelta.ts`): lo que el teléfono recuerda de la bienvenida y del
 * chef, y las aperturas. Arrancar con la sesión abierta cuenta una; volver después de media hora
 * fuera, otra. Va dentro de la sesión: al salir se olvida, como lo demás de la cuenta.
 */
export function ProveedorDePrimeraVuelta({ children }: { children: ReactNode }) {
  const { estado } = useSesion()
  const [cargada, setCargada] = useState(false)
  const [vuelta, setVuelta] = useState<PrimeraVuelta>(VUELTA_NUEVA)
  // La de verdad, para cambiar sin esperar al render: dos cambios seguidos no se pisan.
  const actual = useRef<PrimeraVuelta>(VUELTA_NUEVA)
  const arranco = useRef(false)

  const cambiar = useCallback((cambio: (v: PrimeraVuelta) => PrimeraVuelta) => {
    const nueva = cambio(actual.current)
    // Abrir La Cocina por décima vez no cambia nada: no se reescribe.
    if (nueva === actual.current) return
    actual.current = nueva
    setVuelta(nueva)
    // Mejor esfuerzo: si no se guarda, lo peor es ver la bienvenida o el chef una vez más.
    void AsyncStorage.setItem(CLAVE_PRIMERA_VUELTA, JSON.stringify(nueva)).catch(() => undefined)
  }, [])

  useEffect(() => {
    void AsyncStorage.getItem(CLAVE_PRIMERA_VUELTA)
      .catch(() => null)
      .then((texto) => {
        actual.current = leerVuelta(texto)
        setVuelta(actual.current)
        setCargada(true)
      })
  }, [])

  // Arrancó con la sesión abierta: otra apertura. Si arrancó afuera, la cuenta `entrar`, que
  // además reemplaza lo de la cuenta de antes: al salir, lo guardado lo borra
  // `cerrarEnElTelefono`, y lo de la memoria no lo lee nadie mientras se está afuera.
  useEffect(() => {
    if (!cargada || estado === 'arrancando' || arranco.current) return
    arranco.current = true
    if (estado === 'dentro') cambiar(alArrancar)
  }, [cargada, estado, cambiar])

  useEffect(() => {
    if (estado !== 'dentro') return
    const suscripcion = AppState.addEventListener('change', (siguiente) => {
      if (siguiente === 'background') cambiar((v) => alSalir(v, Date.now()))
      else if (siguiente === 'active') cambiar((v) => alVolver(v, Date.now()))
    })
    return () => suscripcion.remove()
  }, [estado, cambiar])

  // Estables: las pantallas las ponen en sus efectos (el botón atrás, el foco de La Cocina).
  const entrar = useCallback((sinRedes: boolean) => cambiar(() => alEntrar(sinRedes)), [cambiar])
  const terminarBienvenida = useCallback(() => cambiar(bienvenidaVista), [cambiar])
  const conocerLaCocina = useCallback(() => cambiar(cocinaConocida), [cambiar])
  const presentarAlChef = useCallback(() => cambiar(chefPresentado), [cambiar])
  const valor = useMemo<LaVuelta>(
    () => ({ cargada, vuelta, entrar, terminarBienvenida, conocerLaCocina, presentarAlChef }),
    [cargada, vuelta, entrar, terminarBienvenida, conocerLaCocina, presentarAlChef],
  )
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

export function usePrimeraVuelta(): LaVuelta {
  return useContext(Contexto)
}
