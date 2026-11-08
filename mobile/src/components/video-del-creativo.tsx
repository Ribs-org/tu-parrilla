import { VideoView, useVideoPlayer } from 'expo-video'

/**
 * El video de un creativo del mesón, con los controles del sistema y la pantalla completa. Empieza
 * a sonar apenas se monta: se monta solo cuando la persona toca «▶ Ver el video».
 *
 * Importa `expo-video` arriba, así que **nadie lo importa directo**: `components/meson.tsx` lo pide
 * con un `require` después de `hayVideoNativo()` (`lib/video.ts`). En un binario sin el módulo, este
 * archivo ni se carga.
 */
export function VideoDelCreativo({ url }: { url: string }) {
  const jugador = useVideoPlayer(url, (j) => {
    j.loop = false
    j.play()
  })
  return (
    <VideoView
      player={jugador}
      nativeControls
      contentFit="contain"
      fullscreenOptions={{ enable: true }}
      allowsPictureInPicture={false}
      style={{ width: '100%', height: '100%', backgroundColor: '#000' }}
    />
  )
}
