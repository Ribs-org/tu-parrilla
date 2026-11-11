import { useCallback, useEffect, useState } from 'react'
import { Linking, Text, View } from 'react-native'
import { useFocusEffect, useRouter, type Href } from 'expo-router'

import { SesionCaducada } from '../lib/api'
import {
  NO_SE_PUDO_APAGAR,
  NO_SE_PUDO_LO_BUENO,
  SIN_PERMISO,
  ahoraNo,
  alAbrir,
  apagar,
  encender,
  guardarLoBueno,
  hayAvisos,
  leerLoBueno,
  leerPermiso,
  leerPreferencia,
  moduloDeAvisos,
  rutaDelAviso,
} from '../lib/avisos'
import type { Tema } from '../lib/tema'
import { useSesion } from './sesion'
import { useColores, useTema } from './tema'
import { Boton, Etiqueta } from './ui'
import { useVentanas } from './ventana'

/**
 * Cuánto se espera después de entrar antes de preguntar por los avisos: que la persona vea la app
 * primero, y no le salte una pregunta apenas abre.
 */
const ESPERA_PARA_PREGUNTAR_MS = 8_000

/** Lo que se le cuenta en la pregunta de la primera vez, con las palabras del modo. */
const PARA_QUE: Record<Tema, string> = {
  noche:
    'Cuando algo se quema, una cuenta se enfría, el chef te pregunta o te deja una comanda, el equipo te responde, te llegan comentarios a La Mesa o tus cortes traen algo bueno. Se apagan cuando quieras en Ajustes.',
  dia:
    'Cuando algo se echa a perder, una cuenta se desafila, el chef te pregunta o te deja una comanda, el equipo te responde, te llegan comentarios a La Mesa o tus piezas traen algo bueno. Se apagan cuando quieras en Ajustes.',
}

/**
 * Los avisos al teléfono, detrás de la sesión: vive en el layout de las pestañas, así que solo corre
 * adentro. Tres cosas, y ninguna si la app no trae el módulo nativo (`hayAvisos`):
 *
 * - Con la app abierta, el aviso se muestra igual, arriba y en la lista (`setNotificationHandler`).
 * - Tocar un aviso abre su pantalla (`rutaDelAviso`), también si la app estaba cerrada.
 * - La primera vez que se entra, un rato después, pregunta si avisar. «Avisarme» pide el permiso del
 *   sistema y registra el teléfono; «Ahora no» no vuelve a preguntar, y quedan en Ajustes. Con los
 *   avisos ya encendidos, vuelve a registrar el token en silencio, porque Expo lo puede cambiar.
 */
export function AvisosAlTelefono() {
  const { token, salir } = useSesion()
  const { preguntar, avisar } = useVentanas()
  const { tema } = useTema()
  const router = useRouter()

  useEffect(() => {
    const N = moduloDeAvisos()
    if (!N) return
    N.setNotificationHandler({
      handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
    })
    const abrir = (respuesta: { actionIdentifier: string; notification: { request: { content: { data?: unknown } } } }) => {
      if (respuesta.actionIdentifier !== N.DEFAULT_ACTION_IDENTIFIER) return
      N.clearLastNotificationResponse()
      router.navigate(rutaDelAviso(respuesta.notification.request.content.data) as Href)
    }
    // El aviso que abrió la app estando cerrada: llegó antes de que esto escuchara.
    const ultima = N.getLastNotificationResponse()
    if (ultima) abrir(ultima)
    const suscripcion = N.addNotificationResponseReceivedListener(abrir)
    return () => suscripcion.remove()
  }, [router])

  useEffect(() => {
    if (!token || !hayAvisos()) return
    let vigente = true
    let reloj: ReturnType<typeof setTimeout> | undefined
    const siCaduca = (error: unknown) => {
      if (error instanceof SesionCaducada) void salir()
    }
    void leerPreferencia().then((preferencia) => {
      if (!vigente) return
      if (preferencia === 'encendidos') return void alAbrir(token).catch(siCaduca)
      if (preferencia === 'apagados') return
      reloj = setTimeout(async () => {
        try {
          const si = await preguntar({
            titulo: '¿Te avisamos al teléfono?',
            detalle: PARA_QUE[tema],
            cancelar: 'Ahora no',
            accion: 'Avisarme',
          })
          if (!vigente) return
          if (!si) return void (await ahoraNo())
          const r = await encender(token)
          if (r.ok) return
          // No se vuelve a preguntar en cada apertura: quedan apagados, y se encienden en Ajustes.
          await ahoraNo()
          await avisar('No se encendieron los avisos', `${r.error} Puedes encenderlos después en Ajustes.`)
        } catch (error) {
          siCaduca(error)
        }
      }, ESPERA_PARA_PREGUNTAR_MS)
    })
    return () => {
      vigente = false
      if (reloj) clearTimeout(reloj)
    }
    // El modo no está en la lista a propósito: cambiarlo no vuelve a preguntar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, preguntar, avisar, salir])

  return null
}

type EstadoDeAvisos = 'cargando' | 'sin-modulo' | 'encendidos' | 'apagados' | 'sin-permiso'

/** Lo que avisa, en Ajustes, con las palabras del modo. */
const QUE_AVISA: Record<Tema, string> = {
  noche:
    'lo que se quemó, las cuentas que se enfrían o se apagan, las preguntas del chef, las comandas que terminan, las respuestas del equipo y, una vez por hora como mucho, los comentarios nuevos de La Mesa. El correo te sigue llegando igual.',
  dia: 'lo que se echó a perder, las cuentas que se desafilan o quedan sin filo, las preguntas del chef, las comandas que terminan, las respuestas del equipo y, una vez por hora como mucho, los comentarios nuevos de La Mesa. El correo te sigue llegando igual.',
}

/** Qué trae el aviso de lo bueno (`src/lib/push/bueno.ts` en la raíz), con las palabras del modo. */
const QUE_ES_LO_BUENO: Record<Tema, string> = {
  noche:
    'Uno al día como mucho, entre las 9 y las 22: cuando un corte pasa un número de vistas que no es lo de siempre, o desde las 19:00, lo que trajeron tus cortes en el día.',
  dia: 'Uno al día como mucho, entre las 9 y las 22: cuando una pieza pasa un número de vistas que no es lo de siempre, o desde las 19:00, lo que trajeron tus piezas en el día.',
}

/**
 * El bloque «Los avisos» de Ajustes: encenderlos o apagarlos en este teléfono. Apagar borra el token
 * del servidor, así que ya no sale ninguno a este teléfono; el correo sigue igual. Sin el módulo
 * nativo (la 1.1.0), dice que llegan con la versión nueva. Sin el permiso del sistema, lleva a los
 * ajustes del teléfono, que es el único lugar donde se devuelve.
 */
export function AjusteDeAvisos() {
  const colores = useColores()
  const { tema } = useTema()
  const { token, salir } = useSesion()
  const { avisar } = useVentanas()
  const [estado, setEstado] = useState<EstadoDeAvisos>('cargando')
  const [ocupado, setOcupado] = useState(false)

  const leer = useCallback(async () => {
    if (!hayAvisos()) return setEstado('sin-modulo')
    const [preferencia, permiso] = await Promise.all([leerPreferencia(), leerPermiso().catch(() => null)])
    if (preferencia !== 'encendidos') return setEstado('apagados')
    setEstado(permiso === 'concedido' ? 'encendidos' : 'sin-permiso')
  }, [])

  // Al volver de los ajustes del teléfono, el permiso pudo cambiar.
  useFocusEffect(
    useCallback(() => {
      void leer()
    }, [leer]),
  )

  async function cambiar(encenderlos: boolean) {
    if (!token) return
    setOcupado(true)
    try {
      if (encenderlos) {
        const r = await encender(token)
        // Sin permiso no hace falta la ventana: el bloque lo dice y lleva a los ajustes del teléfono.
        if (!r.ok && r.permiso !== 'negado') await avisar('No se encendieron los avisos', r.error)
      } else {
        await apagar(token)
      }
    } catch (error) {
      if (error instanceof SesionCaducada) return void salir()
      await avisar('No se apagaron los avisos', NO_SE_PUDO_APAGAR)
    } finally {
      setOcupado(false)
    }
    await leer()
  }

  const texto =
    estado === 'cargando'
      ? '…'
      : estado === 'sin-modulo'
        ? 'Este teléfono todavía no tiene los avisos: llegan con la versión nueva de la app, la que se instala desde la tienda.'
        : estado === 'sin-permiso'
          ? SIN_PERMISO
          : estado === 'encendidos'
            ? `Te llegan a este teléfono: ${QUE_AVISA[tema]}`
            : `Apagados en este teléfono. Encendidos, te llegan: ${QUE_AVISA[tema]}`

  return (
    <>
      <Etiqueta margenArriba>Los avisos</Etiqueta>
      <Text style={{ color: colores.suave, fontSize: 12 }}>{texto}</Text>
      {estado === 'encendidos' || estado === 'apagados' || estado === 'sin-permiso' ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {estado === 'sin-permiso' ? <Boton texto="Abrir los ajustes del teléfono" onPress={() => void Linking.openSettings()} /> : null}
          <Boton
            texto={estado === 'apagados' ? 'Encender los avisos' : 'Apagar los avisos'}
            onPress={() => void cambiar(estado === 'apagados')}
            deshabilitado={ocupado}
          />
        </View>
      ) : null}
      {estado === 'encendidos' ? <AvisosDeLoBueno /> : null}
    </>
  )
}

/**
 * «Avisos de lo bueno», debajo de los avisos cuando están encendidos: se apagan aparte, y son de la
 * cuenta, no del teléfono (`PUT /api/mobile/push/bueno`). Sin señal o con un sitio de antes, solo
 * el texto, sin el botón.
 */
function AvisosDeLoBueno() {
  const colores = useColores()
  const { tema } = useTema()
  const { token, salir } = useSesion()
  const { avisar } = useVentanas()
  const [encendido, setEncendido] = useState<boolean | null>(null)
  const [ocupado, setOcupado] = useState(false)

  useFocusEffect(
    useCallback(() => {
      if (!token) return
      let vigente = true
      leerLoBueno(token)
        .then((valor) => {
          if (vigente) setEncendido(valor)
        })
        .catch((error) => {
          if (error instanceof SesionCaducada) void salir()
        })
      return () => {
        vigente = false
      }
    }, [token, salir]),
  )

  async function cambiar() {
    if (!token || encendido === null) return
    setOcupado(true)
    try {
      setEncendido(await guardarLoBueno(token, !encendido))
    } catch (error) {
      if (error instanceof SesionCaducada) return void salir()
      await avisar('No se pudo cambiar', NO_SE_PUDO_LO_BUENO)
    } finally {
      setOcupado(false)
    }
  }

  return (
    <View style={{ gap: 6, marginTop: 6 }}>
      <Text style={{ color: colores.texto, fontSize: 14, fontWeight: '600' }}>Avisos de lo bueno</Text>
      <Text style={{ color: colores.suave, fontSize: 12 }}>
        {encendido === false ? `Apagados. Encendidos, te llega: ${QUE_ES_LO_BUENO[tema].charAt(0).toLowerCase()}${QUE_ES_LO_BUENO[tema].slice(1)}` : QUE_ES_LO_BUENO[tema]}
      </Text>
      {encendido !== null ? (
        <View style={{ flexDirection: 'row' }}>
          <Boton
            texto={encendido ? 'Apagar los avisos de lo bueno' : 'Encender los avisos de lo bueno'}
            onPress={() => void cambiar()}
            deshabilitado={ocupado}
          />
        </View>
      ) : null}
    </View>
  )
}
