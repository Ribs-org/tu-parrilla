import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import * as LocalAuthentication from 'expo-local-authentication'
import { barrerCachesViejas } from '../lib/cache'
import { cerrarEnElTelefono, readToken } from '../lib/session'

/**
 * Dónde está la sesión: todavía averiguándolo (el llavero y el candado), afuera —la pantalla de
 * entrada— o adentro con su token. La raíz protege las pantallas con esto (`Stack.Protected`):
 * afuera no hay ninguna pantalla de la cuenta a la que llegar, ni por un enlace ni volviendo
 * atrás, y pasar de adentro a afuera saca de la pila todas las que había.
 */
export type EstadoDeSesion = 'arrancando' | 'fuera' | 'dentro'

type LaSesion = {
  estado: EstadoDeSesion
  /** El token de la sesión abierta; null fuera de ella. */
  token: string | null
  /** Abre la sesión con el token recién canjeado (ya guardado en el llavero por `entrar`). */
  abrir: (token: string) => void
  /** Sale en este teléfono: borra el token y lo guardado de la cuenta, y vuelve a la entrada. */
  salir: () => Promise<void>
}

const Contexto = createContext<LaSesion>({ estado: 'arrancando', token: null, abrir: () => {}, salir: async () => {} })

type Estado = { estado: 'arrancando' | 'fuera'; token: null } | { estado: 'dentro'; token: string }

/**
 * Al abrir la app: con un token en el llavero, el candado del dispositivo antes de entrar.
 * `hasHardwareAsync`/`isEnrolledAsync` solo ven biometría (huella o cara), así que un teléfono
 * con solo PIN o patrón pasaba directo sin pedir nada — pese a que el README promete que ese
 * candado también protege. `getEnrolledLevelAsync` cubre los tres: PIN, patrón y biometría. Si
 * no hay nada inscrito (`SecurityLevel.NONE`), no se inventa una barrera propia — el token ya
 * está en el llavero del sistema. Si se cancela, afuera; el token se queda, y abrir la app de
 * nuevo vuelve a pedir el candado.
 */
async function arrancar(): Promise<Estado> {
  const token = await readToken()
  if (!token) return { estado: 'fuera', token: null }
  const nivel = await LocalAuthentication.getEnrolledLevelAsync()
  if (nivel !== LocalAuthentication.SecurityLevel.NONE) {
    const { success } = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Desbloquea para entrar a Tu Parrilla',
    })
    if (!success) return { estado: 'fuera', token: null }
  }
  return { estado: 'dentro', token }
}

/** La sesión de la app, para la raíz y para cada pantalla que le habla al servidor. */
export function ProveedorDeSesion({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<Estado>({ estado: 'arrancando', token: null })

  useEffect(() => {
    // El `setState` va dentro del `.then`: leer el llavero y el candado no tiene versión síncrona.
    // Si algo de eso revienta, afuera: quedarse en «arrancando» sería una pantalla de carga eterna.
    void arrancar()
      .catch((): Estado => ({ estado: 'fuera', token: null }))
      .then(setSesion)
    void barrerCachesViejas()
  }, [])

  const abrir = useCallback((token: string) => setSesion({ estado: 'dentro', token }), [])

  const salir = useCallback(async () => {
    await cerrarEnElTelefono()
    setSesion({ estado: 'fuera', token: null })
  }, [])

  const valor = useMemo(() => ({ ...sesion, abrir, salir }), [sesion, abrir, salir])
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

/** La sesión: el token para pedir, y `salir` para cuando el servidor dice que ya no vale. */
export function useSesion(): LaSesion {
  return useContext(Contexto)
}
