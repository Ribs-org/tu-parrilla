import { useEffect, useState, type ReactNode } from 'react'
import { AccessibilityInfo, View } from 'react-native'

/*
 * Lo que comparten el corte de la noche (`pieza.tsx`) y la pieza de sushi del día
 * (`pieza-sushi.tsx`): el lienzo donde se dibujan, «quitar animaciones» y la línea punteada.
 */

/** El lienzo: 120 × 64 del panel, a poco más de la mitad. Se dibuja ahí y se agranda entero. */
export const ANCHO = 64
export const ALTO = 34
export const AUMENTO = 1.3

/** Del lienzo del panel (120 de ancho) al de la app. */
export const ESCALA = ANCHO / 120

/** «Quitar animaciones» del teléfono: con eso prendido, el humo, la llama y el latido quedan quietos. */
export function useQuieto(): boolean {
  const [quieto, setQuieto] = useState(false)
  useEffect(() => {
    let vivo = true
    AccessibilityInfo.isReduceMotionEnabled().then((v) => vivo && setQuieto(v))
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setQuieto)
    return () => {
      vivo = false
      sub.remove()
    }
  }, [])
  return quieto
}

/** Una línea punteada de segmentos: RN no dibuja bien un borde punteado de un solo lado. */
export function Punteada({ color, ancho, opacidad = 1 }: { color: string; ancho: number; opacidad?: number }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 3, opacity: opacidad }}>
      {Array.from({ length: 7 }, (_, i) => (
        <View key={i} style={{ width: ancho, height: 4, borderRadius: ancho / 2, backgroundColor: color }} />
      ))}
    </View>
  )
}

/**
 * El lienzo de una pieza, del tamaño del panel a poco más de la mitad y agrandado entero. Va
 * escondido para el lector de pantalla: quien lo pone escribe al lado, en palabras, lo que dice.
 */
export function Lienzo({ children }: { children: ReactNode }) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width: ANCHO * AUMENTO, height: ALTO * AUMENTO, marginTop: 10 }}
    >
      <View style={{ width: ANCHO, height: ALTO, transform: [{ scale: AUMENTO }], transformOrigin: 'top left' }}>{children}</View>
    </View>
  )
}
