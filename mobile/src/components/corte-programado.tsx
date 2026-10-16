import { Text, View } from 'react-native'
import { Image } from 'expo-image'
import { COLORES, TIPO_TITULO } from './ui'
import { Corte, CorteMedia } from './parrilla'
import { coccionDe, NOMBRE_COCCION } from '../lib/parrilla'
import { etiquetaCuenta } from '../lib/publicar'
import type { PostProgramado } from '../lib/tipos'

/**
 * Un post programado como corte sobre el fierro: la hora, la miniatura, el texto, una línea
 * por cuenta de destino (con su error si falló) y el estado en palabras. Era el cuerpo del
 * Calendario hasta que La Parrilla lo absorbió (2026-10-16).
 */
export function CorteProgramado({ post }: { post: PostProgramado }) {
  const coccion = coccionDe(post.redes.map((r) => r.estado))
  // La miniatura primero y la portada como respaldo: la portada es la carátula diseñada de
  // un video, o sea lo que se ve si no hay imagen propia.
  const uri = post.miniatura ?? post.portada
  return (
    <Corte coccion={coccion}>
      <Text style={{ color: COLORES.texto, fontSize: 10, fontFamily: TIPO_TITULO, letterSpacing: 1 }}>
        {post.cuando.slice(11, 16)}
        {coccion === 'sellada' ? '  ·  SALIENDO' : ''}
      </Text>

      {uri ? (
        <CorteMedia coccion={coccion}>
          <Image source={{ uri }} style={{ width: '100%', height: 72 }} contentFit="cover" />
        </CorteMedia>
      ) : null}

      <Text style={{ color: COLORES.texto, fontSize: 14 }} numberOfLines={2}>
        {post.texto || '(sin texto)'}
      </Text>

      {/*
        Las redes en texto, sin el punto de color: la cocción del corte ya dice el estado
        del conjunto. Lo que el corte no puede decir es cuál de las redes falló, y eso es
        justo lo que queda acá.
      */}
      <View style={{ gap: 2, marginTop: 2 }}>
        {post.redes.map((r) => (
          <Text
            // `r.id` es el destino, no la red: con dos cuentas de la misma red, `r.red` se
            // repite dentro de un post.
            key={r.id}
            // Sin opacidad: sobre la carne cruda, que es la cocción más clara, el texto al
            // 70% cae a 3.12:1 y no llega al mínimo. La jerarquía la hace el tamaño.
            style={{ color: COLORES.texto, fontSize: 12 }}
            numberOfLines={2}
          >
            {etiquetaCuenta(r)}
            {r.error ? ` — ${r.error}` : ''}
          </Text>
        ))}
      </View>

      {/* El estado en palabras: el color nunca es la única señal. */}
      <Text
        style={{
          color: COLORES.texto,
          fontSize: 10,
          fontFamily: TIPO_TITULO,
          textTransform: 'uppercase',
          letterSpacing: 1,
        }}
      >
        {NOMBRE_COCCION[coccion]}
      </Text>
    </Corte>
  )
}
