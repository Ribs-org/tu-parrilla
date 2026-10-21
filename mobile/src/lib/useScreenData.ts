import { useCallback, useEffect, useRef, useState } from 'react'
import { SesionCaducada, apiGet } from './api'
import { freshness, readCache, writeCache } from './cache'
import { huboCambioDesde } from './cambios'

/** Lo que la pantalla muestra, con la clave a la que pertenece: un dato de otra clave no se muestra. */
type Lectura<T> = { key: string; data: T | null; sello: string | null; error: string | null }

/** Cuándo se guardó lo que está en pantalla, y de qué clave. */
export type Guardado = { key: string; en: number }

/**
 * Si lo leído del disco todavía sirve: no, si la red ya trajo para la misma clave algo igual de
 * nuevo o más. El disco suele contestar primero, pero no siempre, y lo guardado no tiene que
 * pisar lo que acaba de llegar.
 */
export function sirveLoGuardado(enPantalla: Guardado | null, key: string, guardadoEn: number): boolean {
  return !(enPantalla && enPantalla.key === key && enPantalla.en >= guardadoEn)
}

/**
 * El patrón de las cuatro pantallas: muestra lo último que se supo apenas abre y
 * refresca por detrás. Es lo que hace que «el vistazo» sea instantáneo y que la app
 * sirva en el metro; una pantalla en blanco esperando la red sería lo contrario.
 *
 * La clave cambia con lo que se pide —el rango de Los Números, la cuenta—: lo de una clave no
 * se muestra bajo otra, y la respuesta de un pedido que otro ya reemplazó (se cambió de rango
 * mientras cargaba) se guarda para su clave pero no se dibuja.
 */
export function useScreenData<T>(
  key: string,
  path: string,
  token: string | null,
  onSesionCaducada: () => void,
) {
  // El sello se calcula al guardar, no al dibujar: `Date.now()` durante el render es
  // impuro y el compilador de React puede rehacerlo cuando se le antoje, dando una
  // antigüedad que salta sola. Acá se fija una vez por lectura, que es cuando cambia.
  const [lectura, setLectura] = useState<Lectura<T>>({ key, data: null, sello: null, error: null })
  const [cargando, setCargando] = useState(true)
  // Cuándo se guardó lo que está en pantalla, para decidir al recibir foco si vale
  // la pena refrescar. Un ref y no un estado: cambiarlo no debe redibujar nada.
  const guardadoEn = useRef<Guardado | null>(null)
  // El último pedido de red: uno anterior que conteste tarde ya no manda en la pantalla.
  const ultimo = useRef(0)

  const refrescar = useCallback(async () => {
    // Sin token no hay con qué pedir: pedir con esa credencial vacía es un 401 garantizado que
    // esta misma función traduce en «sesión caducada». Las pantallas de la cuenta solo se
    // montan con la sesión abierta, pero el guard queda acá por si algo llama a `refrescar`
    // directamente.
    if (!token) return
    const este = ++ultimo.current
    setCargando(true)
    try {
      const fresco = await apiGet<T>(path, token)
      // Vale para su clave aunque la pantalla ya pida otra: la próxima vez que se abra, está.
      void writeCache(key, fresco)
      if (este !== ultimo.current) return
      const cuando = Date.now()
      guardadoEn.current = { key, en: cuando }
      setLectura({ key, data: fresco, sello: freshness(cuando, cuando).etiqueta, error: null })
    } catch (e) {
      if (e instanceof SesionCaducada) {
        onSesionCaducada()
        return
      }
      if (este !== ultimo.current) return
      // Con datos viejos en pantalla el error es una nota al pie; sin ellos, la
      // pantalla entera.
      setLectura((antes) => ({
        ...(antes.key === key ? antes : { key, data: null, sello: null }),
        error: 'No se pudo actualizar.',
      }))
    } finally {
      if (este === ultimo.current) setCargando(false)
    }
  }, [key, path, token, onSesionCaducada])

  // El vistazo instantáneo no depende del token: la caché ya está en disco apenas se monta la
  // pantalla. Separado del refresco de red para no acoplar «mostrar lo que ya sabemos» a
  // «tener credencial para pedir más».
  useEffect(() => {
    let vivo = true
    void readCache<T>(key).then((guardado) => {
      // Sin este guard, una pantalla desmontada (cambio de pestaña, navegación) o que ya
      // cambió de clave igual terminaría dibujando lo leído cuando la lectura resuelve tarde.
      if (!vivo || !guardado) return
      if (!sirveLoGuardado(guardadoEn.current, key, guardado.savedAt)) return
      guardadoEn.current = { key, en: guardado.savedAt }
      setLectura({ key, data: guardado.data, sello: freshness(guardado.savedAt, Date.now()).etiqueta, error: null })
      setCargando(false)
    })
    return () => {
      vivo = false
    }
  }, [key])

  // El refresco de red espera a que haya token: con el de un primer render todavía vacío, un
  // pedido sin credencial volvía con 401 y la app se autoexpulsaba a la entrada en bucle.
  useEffect(() => {
    if (!token) return
    // La regla ve `setCargando(true)` antes del primer `await` dentro de
    // `refrescar` y no puede saber que es el arranque legítimo del pedido de
    // red, no un `setState` gratuito disparado a ciegas desde el efecto.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refrescar()
  }, [token, refrescar])

  /**
   * Para `useFocusEffect`: refresca al volver a una pestaña solo si la caché pasó de
   * fresca, o si la app escribió algo (un post nuevo) después de guardarla. Sin esto,
   * el post recién programado no aparecería en Calendario hasta tirar para refrescar.
   */
  const refrescarSiVieja = useCallback(() => {
    const cuando = guardadoEn.current?.key === key ? guardadoEn.current.en : null
    if (!freshness(cuando, Date.now()).fresca || huboCambioDesde(cuando)) void refrescar()
  }, [key, refrescar])

  // Lo de otra clave no se muestra: hasta que llegue lo de esta —del disco o de la red, o su
  // error—, la pantalla está cargando, aunque el pedido todavía no haya salido.
  const actual = lectura.key === key ? lectura : null
  return {
    data: actual?.data ?? null,
    cargando: cargando || actual === null,
    error: actual?.error ?? null,
    sello: actual?.sello ?? null,
    refrescar,
    refrescarSiVieja,
  }
}
