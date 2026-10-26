import { useEffect, useState, type ReactNode } from 'react'
import { Animated, View, type ViewStyle } from 'react-native'
import { PESCADO, QUEMO, type Carne, type Sello } from '../lib/parrilla'
import { ROLL, posiciones, posicionesMaki, rodajas, rollCortado, rollEntero } from '../lib/pieza-sushi'
import { ESCALA, Lienzo, useQuieto } from './lienzo'
import type { PropsDePieza } from './pieza'
import { useColores } from './tema'

/**
 * La pieza de sushi del panel (`src/components/pieza-sushi.tsx`), dibujada con vistas: el corte
 * del modo día. Como el corte de la noche (`pieza.tsx`), las siluetas son aproximadas —sin
 * `react-native-svg`, que pide un build nuevo—, pero dicen lo mismo con la misma gramática:
 * - la silueta es el formato: nigiri el video, un roll envuelto en salmón el carrusel (entero
 *   mientras no se sirvió, en rodajas cuando salió), sashimi la foto, temaki el texto;
 * - el pescado es la cocción: crudo, dorado y tostado bajo el soplete, y pasado —verde gris, con
 *   moho y olor— si falló;
 * - una banda de nori por destino, el halo rojo y la banderita si algo falló, y la llama del
 *   soplete mientras algo sale.
 *
 * Las medidas salen del lienzo del panel (`lib/pieza-sushi.ts`), escaladas con `u`.
 */

/** Lo que no se cocina: el arroz, el nori, el shiso, el wasabi, el papel de soya y el relleno. */
const ARROZ = { claro: '#ffffff', borde: '#d9ccb6' }
const NORI = { cuerpo: '#1f2c26', brillo: '#3d5649' }
const SHISO = '#5f9f45'
const WASABI = '#a9c864'
const SOYA = '#f6bccd'
const RELLENO = { palta: '#a7cc6c', queso: '#fffaf0' }
/** El moho y el olor del pescado pasado: un verde que no es el del shiso. */
const PASADO = { moho: '#cfd8b4', olor: '#7d8f52' }

/** Del lienzo del panel (120 × 64) al de la app. */
const u = (x: number) => x * ESCALA

/** Las vetas del salmón, más apagadas a punto; el pescado pasado no tiene, tiene moho. */
function vetas(carne: Carne): { color: string; opacidad: number } {
  if (carne === 'punto') return { color: '#f3c99a', opacidad: 0.45 }
  return { color: '#ffffff', opacidad: carne === 'cruda' ? 0.7 : 0.5 }
}

/** Una raya vertical de alto libre, llena o punteada: las bandas y las líneas del corte. */
function Raya({ alto, ancho, color, punteada = false, opacidad = 1 }: { alto: number; ancho: number; color: string; punteada?: boolean; opacidad?: number }) {
  if (!punteada) return <View style={{ width: ancho, height: alto, backgroundColor: color, opacity: opacidad }} />
  const tramos = Math.max(1, Math.floor((alto + 2) / 5))
  return (
    <View style={{ width: ancho, height: alto, gap: 2, opacity: opacidad }}>
      {Array.from({ length: tramos }, (_, i) => (
        <View key={i} style={{ width: ancho, height: 3, borderRadius: ancho / 2, backgroundColor: color }} />
      ))}
    </View>
  )
}

/**
 * La banda de nori de un destino, de arriba abajo y apenas inclinada, dentro de la forma que la
 * recorta: entera cuando salió, punteada mientras no, pasada y cruzada por el rojo del halo cuando
 * falló, a medias con el punto ámbar en la bandeja de TikTok, punteada en ámbar el reintento, en
 * acero el fierro frío. `x` va medido desde el borde izquierdo de esa forma.
 */
function Banda({ x, alto, sello }: { x: number; alto: number; sello: Sello }) {
  const colores = useColores()
  const largo = alto + 12
  const base: ViewStyle = { position: 'absolute', left: x - 1.8, top: -6, width: 3.6, height: largo, alignItems: 'center', transform: [{ rotate: '5deg' }] }
  if (sello === 'servido') {
    return (
      <View style={[base, { backgroundColor: NORI.cuerpo }]}>
        <View style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 0.6, backgroundColor: NORI.brillo }} />
      </View>
    )
  }
  if (sello === 'quemado') {
    // Sin brasa: de día nada se quema. El rojo es el del halo, el de lo que falló.
    return (
      <View style={[base, { backgroundColor: PESCADO.quemada.medio }]}>
        <View style={{ width: 1, height: largo, backgroundColor: QUEMO }} />
      </View>
    )
  }
  if (sello === 'bandeja') {
    return (
      <View style={base}>
        <View style={{ width: 3.6, height: largo / 2, backgroundColor: NORI.cuerpo }} />
        <Raya alto={largo / 2} ancho={1.6} color="rgba(31,44,38,0.5)" punteada />
        <View style={{ position: 'absolute', top: largo / 2 - 2.2, width: 4.4, height: 4.4, borderRadius: 2.2, backgroundColor: colores.ambar, borderWidth: 0.5, borderColor: NORI.cuerpo }} />
      </View>
    )
  }
  if (sello === 'reintento') return <View style={base}><Raya alto={largo} ancho={1.6} color={colores.ambar} punteada /></View>
  if (sello === 'frio') return <View style={base}><Raya alto={largo} ancho={1.6} color="#8d9aa6" punteada opacidad={0.8} /></View>
  return <View style={base}><Raya alto={largo} ancho={1.6} color="rgba(31,44,38,0.5)" punteada /></View>
}

/** Las bandas que caen dentro de una forma: `izquierda` y `ancho` son los de esa forma, en el lienzo de la app. */
function Bandas({ xs, sellos, izquierda, ancho, alto }: { xs: number[]; sellos: readonly Sello[]; izquierda: number; ancho: number; alto: number }) {
  return (
    <>
      {sellos.map((sello, i) => {
        const x = xs[i]! - izquierda
        return x > -3 && x < ancho + 3 ? <Banda key={i} x={x} alto={alto} sello={sello} /> : null
      })}
    </>
  )
}

/** El moho del pescado pasado: manchas pálidas y quietas, repartidas por la forma. */
function Moho() {
  return (
    <>
      {[
        ['18%', '22%', 3.2],
        ['46%', '12%', 2.4],
        ['70%', '40%', 3],
        ['32%', '60%', 2.2],
        ['84%', '18%', 2.2],
      ].map(([left, top, d]) => (
        <View
          key={`${left}-${top}`}
          style={{ position: 'absolute', left: left as `${number}%`, top: top as `${number}%`, width: d as number, height: d as number, borderRadius: (d as number) / 2, backgroundColor: PASADO.moho, opacity: 0.75 }}
        />
      ))}
    </>
  )
}

/**
 * Una superficie de pescado: el degradado fingido con tres capas, como la carne del corte, y
 * encima las vetas del salmón o el moho del pasado. `style` dice dónde va y con qué esquinas.
 */
function Pescado({ carne, style, ancho, children }: { carne: Carne; style: ViewStyle; ancho: number; children?: ReactNode }) {
  const p = PESCADO[carne]
  const v = vetas(carne)
  return (
    <View style={[{ position: 'absolute', overflow: 'hidden', backgroundColor: p.medio, borderWidth: 0.4, borderColor: 'rgba(120,40,20,0.25)' }, style]}>
      <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: '45%', backgroundColor: p.claro, opacity: 0.55 }} />
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '35%', backgroundColor: p.hondo, opacity: 0.5 }} />
      {carne === 'quemada' ? (
        <Moho />
      ) : (
        Array.from({ length: Math.max(1, Math.floor(ancho / 6)) }, (_, i) => (
          <View
            key={i}
            style={{ position: 'absolute', left: 2 + i * 6, top: '-30%', width: 1.1, height: '160%', backgroundColor: v.color, opacity: v.opacidad, transform: [{ rotate: '22deg' }] }}
          />
        ))
      )}
      {children}
    </View>
  )
}

/** El corte de un roll envuelto en salmón, de afuera adentro: el pescado, el arroz, el nori y la palta. */
function Anillos({ ancho, alto }: { ancho: number; alto: number }) {
  const anillo = (f: number, color: string) => (
    <View
      style={{
        position: 'absolute',
        left: (ancho * (1 - f)) / 2,
        top: (alto * (1 - f)) / 2,
        width: ancho * f,
        height: alto * f,
        borderRadius: (Math.min(ancho, alto) * f) / 2,
        backgroundColor: color,
      }}
    />
  )
  return (
    <>
      {anillo(0.66, ARROZ.claro)}
      {anillo(0.42, NORI.cuerpo)}
      {anillo(0.34, RELLENO.palta)}
      <View style={{ position: 'absolute', left: ancho * 0.52, top: alto * 0.4, width: ancho * 0.14, height: alto * 0.14, borderRadius: 2, backgroundColor: RELLENO.queso }} />
    </>
  )
}

/** La llama del soplete: la boquilla en acero y una llama azul que titila. Quieta, encendida. */
function Llama({ quieto }: { quieto: boolean }) {
  const [valor] = useState(() => new Animated.Value(0))
  useEffect(() => {
    if (quieto) return
    const bucle = Animated.loop(
      Animated.sequence([
        Animated.timing(valor, { toValue: 1, duration: 260, useNativeDriver: true }),
        Animated.timing(valor, { toValue: 0, duration: 340, useNativeDriver: true }),
      ]),
    )
    bucle.start()
    return () => bucle.stop()
  }, [quieto, valor])
  const titilar = quieto ? [] : [{ scaleY: valor.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.1] }) }]
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: u(60) - 3, top: -15, width: 6, alignItems: 'center' }}>
      <View style={{ width: 6, height: 4, borderRadius: 1, backgroundColor: '#8d9aa6' }} />
      <Animated.View style={{ width: 4, height: 10, borderBottomLeftRadius: 2, borderBottomRightRadius: 2, backgroundColor: '#6fa8ff', opacity: 0.9, alignItems: 'center', transformOrigin: 'top', transform: titilar }}>
        <View style={{ width: 1.6, height: 6, borderBottomLeftRadius: 1, borderBottomRightRadius: 1, backgroundColor: '#eef6ff' }} />
      </Animated.View>
    </View>
  )
}

/** El olor del pescado pasado: tres ondas quietas sobre la pieza, a la izquierda de la banderita. */
function Olor() {
  return (
    <>
      {[36, 52, 68].map((x) => (
        <View key={x} pointerEvents="none" style={{ position: 'absolute', left: u(x) - 1.5, top: -11, width: 3, height: 10 }}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={{ position: 'absolute', left: 1, top: i * 3.3, width: 1.2, height: 3.6, borderRadius: 0.6, backgroundColor: PASADO.olor, opacity: 0.85, transform: [{ rotate: i % 2 ? '-25deg' : '25deg' }] }}
            />
          ))}
        </View>
      ))}
    </>
  )
}

/** El halo rojo alrededor de cada forma —late tres veces y queda encendido— y la banderita. */
function Halo({ formas, quieto }: { formas: ViewStyle[]; quieto: boolean }) {
  const [valor] = useState(() => new Animated.Value(1))
  useEffect(() => {
    if (quieto) return
    const latido = Animated.loop(
      Animated.sequence([
        Animated.timing(valor, { toValue: 0.25, duration: 800, useNativeDriver: true }),
        Animated.timing(valor, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
      { iterations: 3 },
    )
    latido.start()
    return () => latido.stop()
  }, [quieto, valor])
  return (
    <>
      {formas.map((forma, i) => (
        <Animated.View key={i} pointerEvents="none" style={[forma, { position: 'absolute', borderWidth: 1.4, borderColor: QUEMO, opacity: quieto ? 1 : valor }]} />
      ))}
      {/* La banderita: un asta y un triángulo rojo, asomados arriba a la derecha. */}
      <View style={{ position: 'absolute', left: u(107), top: -6, width: 1.2, height: 16, backgroundColor: '#8f8170' }} />
      <View
        style={{
          position: 'absolute',
          left: u(107) + 1,
          top: -6,
          width: 0,
          height: 0,
          borderLeftWidth: 8,
          borderTopWidth: 3,
          borderBottomWidth: 3,
          borderLeftColor: QUEMO,
          borderTopColor: 'transparent',
          borderBottomColor: 'transparent',
        }}
      />
    </>
  )
}

/** Un rectángulo del lienzo del panel, en el de la app, con su radio. */
function caja(x: number, y: number, ancho: number, alto: number, radio: number): ViewStyle {
  return { left: u(x), top: u(y), width: u(ancho), height: u(alto), borderRadius: u(radio) }
}

export function PiezaDeSushi({ formato, huesos = 0, carne, coccion, sellos }: PropsDePieza) {
  const quieto = useQuieto()
  const cortado = rollCortado(carne)
  const xs = (formato === 'tira' ? posicionesMaki(sellos.length, huesos) : posiciones(sellos.length, formato)).map(u)
  // Las formas que llevan el halo si algo falló.
  const formas: ViewStyle[] = []
  let dibujo: ReactNode

  if (formato === 'entrana') {
    const arroz = caja(17, 27, 86, 28, 14)
    const pescado: ViewStyle = { ...caja(8, 10, 104, 26, 9), borderBottomLeftRadius: u(10), borderBottomRightRadius: u(10) }
    formas.push({ ...caja(7, 9, 106, 47, 14) })
    dibujo = (
      <>
        <View style={[arroz, { position: 'absolute', overflow: 'hidden', backgroundColor: ARROZ.claro, borderWidth: 0.5, borderColor: ARROZ.borde }]}>
          <Bandas xs={xs} sellos={sellos} izquierda={u(17)} ancho={u(86)} alto={u(28)} />
        </View>
        <Pescado carne={carne} style={pescado} ancho={u(104)}>
          <Bandas xs={xs} sellos={sellos} izquierda={u(8)} ancho={u(104)} alto={u(26)} />
        </Pescado>
      </>
    )
  } else if (formato === 'tira' && cortado) {
    const discos = rodajas(huesos)
    dibujo = discos.map(({ cx, r }, i) => {
      const forma = caja(cx - r, 34 - r, 2 * r, 2 * r, r)
      formas.push(forma)
      return (
        <Pescado key={i} carne={carne} style={forma} ancho={u(2 * r)}>
          <Anillos ancho={u(2 * r)} alto={u(2 * r)} />
          <Bandas xs={xs} sellos={sellos} izquierda={u(cx - r)} ancho={u(2 * r)} alto={u(2 * r)} />
        </Pescado>
      )
    })
  } else if (formato === 'tira') {
    const { x0, x1, cortes } = rollEntero(huesos)
    const alto = ROLL.abajo - ROLL.arriba
    const tronco = caja(x0, ROLL.arriba, x1 - x0, alto, alto / 2)
    formas.push(tronco)
    // Las líneas del corte, enteras y finas: punteada es la banda del destino que no salió.
    const linea = carne === 'quemada' ? 'rgba(255,255,255,0.4)' : 'rgba(90,30,15,0.55)'
    dibujo = (
      <Pescado carne={carne} style={tronco} ancho={u(x1 - x0)}>
        {cortes.map((x) => (
          <View key={x} style={{ position: 'absolute', left: u(x - x0), top: 1, bottom: 1, width: 0.8, backgroundColor: linea }} />
        ))}
        <Bandas xs={xs} sellos={sellos} izquierda={u(x0)} ancho={u(x1 - x0)} alto={u(alto)} />
        {/* La cara del corte de la orilla, a la derecha: el arroz, el nori y la palta. */}
        <View style={{ position: 'absolute', right: 0, top: 0, width: u(2 * ROLL.cara), height: u(alto) }}>
          <Anillos ancho={u(2 * ROLL.cara)} alto={u(alto)} />
        </View>
      </Pescado>
    )
  } else if (formato === 'bife') {
    // Tres láminas en abanico sobre la hoja de shiso, con el wasabi a un lado.
    const laminas = [14, 38, 62].map((x) => caja(x, 13, 45, 43, 6))
    formas.push(caja(12, 11, 98, 47, 8))
    dibujo = (
      <>
        <View style={{ position: 'absolute', left: u(6), top: u(10), width: u(58), height: u(13), borderRadius: u(7), backgroundColor: SHISO, transform: [{ rotate: '-18deg' }] }} />
        {laminas.map((lamina, i) => (
          <Pescado key={i} carne={carne} style={{ ...lamina, transform: [{ rotate: '-6deg' }] }} ancho={u(45)}>
            <Bandas xs={xs} sellos={sellos} izquierda={u([14, 38, 62][i]!)} ancho={u(45)} alto={u(43)} />
          </Pescado>
        ))}
        <View style={{ position: 'absolute', left: u(100), top: u(47), width: u(14), height: u(10), borderRadius: u(5), backgroundColor: WASABI }} />
      </>
    )
  } else if (formato === 'choripan') {
    // El onigiri, la historia: el triángulo de arroz parado —una caja con la punta redonda,
    // sin SVG—, el salmón asomando arriba, que es lo que se cocina, y la banda de nori abajo.
    const arroz: ViewStyle = { ...caja(31, 3, 58, 57, 10), borderTopLeftRadius: u(29), borderTopRightRadius: u(29) }
    formas.push(arroz)
    dibujo = (
      <>
        <View style={[arroz, { position: 'absolute', overflow: 'hidden', backgroundColor: ARROZ.claro, borderWidth: 0.5, borderColor: ARROZ.borde }]}>
          <View style={{ position: 'absolute', left: u(15), bottom: 0, width: u(28), height: u(20), backgroundColor: NORI.cuerpo }} />
          <Bandas xs={xs} sellos={sellos} izquierda={u(31)} ancho={u(58)} alto={u(57)} />
        </View>
        <Pescado carne={carne} style={caja(51, 15, 18, 18, 9)} ancho={u(18)} />
      </>
    )
  } else {
    // El temaki: el cono de papel de soya acostado, la punta a la izquierda y la boca a la
    // derecha, con el arroz y el pescado asomados. Las bandas van del alto del cono en cada punto.
    const ANCHO_CONO = u(92)
    const ALTO_CONO = u(36)
    formas.push(caja(4, 2, 114, 50, 12))
    dibujo = (
      <>
        <View style={{ position: 'absolute', left: u(6), top: u(12), width: ANCHO_CONO, height: ALTO_CONO, transform: [{ rotate: '-12deg' }] }}>
          <View
            style={{
              width: 0,
              height: 0,
              borderTopWidth: ALTO_CONO / 2,
              borderBottomWidth: ALTO_CONO / 2,
              borderRightWidth: ANCHO_CONO,
              borderTopColor: 'transparent',
              borderBottomColor: 'transparent',
              borderRightColor: SOYA,
            }}
          />
          {sellos.map((sello, i) => {
            const x = xs[i]! - u(6)
            const mitad = (ALTO_CONO / 2) * Math.max(0, Math.min(1, x / ANCHO_CONO))
            if (mitad < 2) return null
            return (
              <View key={i} style={{ position: 'absolute', left: x - 1.8, top: ALTO_CONO / 2 - mitad, width: 3.6, height: 2 * mitad, overflow: 'hidden' }}>
                <Banda x={1.8} alto={2 * mitad - 12} sello={sello} />
              </View>
            )
          })}
        </View>
        <View style={{ position: 'absolute', left: u(88), top: u(12), width: u(16), height: u(37), borderRadius: u(7), backgroundColor: ARROZ.claro, borderWidth: 0.5, borderColor: ARROZ.borde }} />
        <View style={{ position: 'absolute', left: u(95), top: u(26), width: u(15), height: u(3), borderRadius: 1, backgroundColor: WASABI, transform: [{ rotate: '-15deg' }] }} />
        <Pescado carne={carne} style={caja(84, 2, 34, 26, 12)} ancho={u(34)} />
      </>
    )
  }

  return (
    <Lienzo>
      {sellos.includes('saliendo') ? <Llama quieto={quieto} /> : null}
      {carne === 'quemada' ? <Olor /> : null}
      {/* La sombra sobre la tabla: la de la pieza, tibia, no la negra de la parrilla. */}
      <View style={{ position: 'absolute', left: u(16), right: u(16), bottom: 0, height: 3, borderRadius: 3, backgroundColor: 'rgba(107,90,68,0.22)' }} />
      {dibujo}
      {coccion === 'parcial' || coccion === 'quemada' ? <Halo formas={formas} quieto={quieto} /> : null}
    </Lienzo>
  )
}
