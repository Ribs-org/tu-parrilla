import { useEffect, useRef, useState } from 'react'
import { Pressable, Text } from 'react-native'
import { comoSeCopia, copiarTexto } from '../lib/portapapeles'
import { useColores } from './tema'
import { useVentanas } from './ventana'

/**
 * «Copiar el texto» de un post que espera en la bandeja de TikTok, para pegarlo al terminarlo
 * allá. Con el portapapeles (`expo-clipboard`, desde la 1.2.0) copia y dice «Copiado» un momento.
 * Sin él —la 1.1.0, que se actualiza por aire y no puede sumar un módulo nativo— abre la lista de
 * compartir del sistema y el botón dice «Pasar el texto…»: ahí casi siempre está «Copiar», pero no
 * en todos los teléfonos, y el botón no promete lo que no sabe (`lib/portapapeles.ts`).
 *
 * Va dentro de la tarjeta, que también se toca: este botón se queda con su toque y no abre
 * «Editar publicación».
 */
export function CopiarTexto({ texto }: { texto: string }) {
  const colores = useColores()
  const { avisar } = useVentanas()
  const [modo] = useState(comoSeCopia)
  const [copiado, setCopiado] = useState(false)
  const reloj = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (reloj.current) clearTimeout(reloj.current)
    },
    [],
  )

  async function copiar() {
    const resultado = await copiarTexto(texto)
    if (resultado === 'copiado') {
      setCopiado(true)
      if (reloj.current) clearTimeout(reloj.current)
      reloj.current = setTimeout(() => setCopiado(false), 1500)
    } else if (resultado === 'fallo') {
      void avisar('No se pudo copiar', 'Abre la publicación y mantén apretado su texto para copiarlo.')
    }
  }

  const rotulo = copiado ? 'Copiado' : modo === 'portapapeles' ? 'Copiar el texto' : 'Pasar el texto…'
  return (
    <Pressable
      onPress={() => void copiar()}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      accessibilityHint={modo === 'compartir' ? 'Abre la lista para compartir; ahí elige Copiar' : undefined}
      style={({ pressed }) => ({
        alignSelf: 'flex-start',
        minHeight: 36,
        justifyContent: 'center',
        paddingHorizontal: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: colores.ambar,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Text style={{ color: copiado ? colores.verde : colores.ambar, fontSize: 13, fontWeight: '600' }}>{rotulo}</Text>
    </Pressable>
  )
}
