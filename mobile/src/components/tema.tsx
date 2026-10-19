import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { AppState } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { apiGet, apiPut } from '../lib/api'
import { readToken } from '../lib/session'
import { CLAVE_TEMA, CLAVE_TEMA_SIN_SUBIR, temaDe, temaDeLaRespuesta, type Tema } from '../lib/tema'
import { PALETAS, type Colores } from './colores'

type ElModo = {
  tema: Tema
  /** Cambia el modo en el momento y lo guarda en la cuenta, para que el panel vaya con él. */
  cambiarTema: (tema: Tema) => void
  /** Vuelve a leer el de la cuenta: lo llama la app al entrar, y al volver al frente. */
  sincronizar: () => void
}

const Contexto = createContext<ElModo>({ tema: 'noche', cambiarTema: () => {}, sincronizar: () => {} })

/**
 * Le manda a la cuenta un cambio que no llegó (`CLAVE_TEMA_SIN_SUBIR`) y lee el modo que tiene.
 * Sin red, o con un servidor de antes que no tiene la ruta, devuelve null: queda el del teléfono.
 */
async function delaCuenta(): Promise<Tema | null> {
  const token = await readToken()
  if (!token) return null
  try {
    const pendiente = await AsyncStorage.getItem(CLAVE_TEMA_SIN_SUBIR)
    if (pendiente) {
      await apiPut('/api/mobile/tema', token, { tema: temaDe(pendiente) })
      await AsyncStorage.removeItem(CLAVE_TEMA_SIN_SUBIR)
    }
    return temaDeLaRespuesta(await apiGet<unknown>('/api/mobile/tema', token))
  } catch {
    return null
  }
}

/**
 * El modo de la app, para todas sus pantallas. Arranca con la copia del teléfono —está al
 * instante, sin red— y después le cree a la cuenta, que manda: el modo se cambia también en el
 * panel. Vuelve a preguntarle a la cuenta cada vez que la app pasa al frente.
 */
export function ProveedorDeTema({ children }: { children: ReactNode }) {
  const [tema, setTema] = useState<Tema>('noche')

  const adoptar = useCallback((nuevo: Tema) => {
    setTema(nuevo)
    void AsyncStorage.setItem(CLAVE_TEMA, nuevo).catch(() => {})
  }, [])

  const sincronizar = useCallback(() => {
    void delaCuenta().then((deLaCuenta) => {
      if (deLaCuenta) adoptar(deLaCuenta)
    })
  }, [adoptar])

  useEffect(() => {
    let vivo = true
    // La copia del teléfono primero: así la app no abre de noche para pasar al día un momento
    // después. El `setState` va dentro del `.then`, no en el cuerpo del efecto.
    void AsyncStorage.getItem(CLAVE_TEMA)
      .then((guardado) => {
        if (vivo && guardado) setTema(temaDe(guardado))
      })
      .catch(() => {})
      .finally(() => {
        if (vivo) sincronizar()
      })
    const sub = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') sincronizar()
    })
    return () => {
      vivo = false
      sub.remove()
    }
  }, [sincronizar])

  const cambiarTema = useCallback(
    (nuevo: Tema) => {
      adoptar(nuevo)
      void (async () => {
        const token = await readToken()
        if (!token) return
        try {
          await apiPut('/api/mobile/tema', token, { tema: nuevo })
          await AsyncStorage.removeItem(CLAVE_TEMA_SIN_SUBIR)
        } catch {
          // Sin señal: queda anotado y sube en la próxima vuelta (`delaCuenta`), así la cuenta no
          // le devuelve al teléfono el modo de antes.
          await AsyncStorage.setItem(CLAVE_TEMA_SIN_SUBIR, nuevo).catch(() => {})
        }
      })()
    },
    [adoptar],
  )

  const valor = useMemo(() => ({ tema, cambiarTema, sincronizar }), [tema, cambiarTema, sincronizar])
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

/** El modo y cómo cambiarlo. */
export function useTema(): ElModo {
  return useContext(Contexto)
}

/** Los colores del modo de la cuenta: los que pide cada pantalla para dibujarse. */
export function useColores(): Colores {
  return PALETAS[useTema().tema]
}
