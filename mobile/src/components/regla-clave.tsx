import { useState } from 'react'
import { Pressable, Text, TextInput, View } from 'react-native'
import { MAX_MENSAJE, MAX_PALABRA, MAX_RESPUESTA, TEXTOS_REGLA as T, hayRegla, type ReglaApp } from '../lib/regla'
import { useColores } from './tema'

/**
 * «Respuesta automática por palabra clave» en Publicar: el bloque del compositor del panel
 * (`src/app/admin/(dash)/schedule/regla-clave.tsx`), plegado al nacer y abierto si el borrador
 * ya trae una palabra. Los tres campos viven en Publicar, que los guarda en el borrador y los
 * manda al programar; las reglas y sus frases las pone el servidor, como en el panel.
 */
export function ReglaClave({
  regla,
  onCambiar,
  deshabilitado,
}: {
  regla: ReglaApp
  onCambiar: (regla: ReglaApp) => void
  deshabilitado?: boolean
}) {
  const colores = useColores()
  // Abierto si al montarse ya había palabra (un borrador que la trae); después lo decide quien toca.
  const [abierto, setAbierto] = useState(() => hayRegla(regla))
  const estilo = {
    backgroundColor: colores.tarjeta,
    color: colores.texto,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  } as const
  const pista = { color: colores.tenue, fontSize: 11 } as const
  const etiqueta = { color: colores.texto, fontSize: 12, fontWeight: '600' } as const

  return (
    <View style={{ gap: 10, borderRadius: 12, padding: 14, backgroundColor: colores.velo + '0A' }}>
      <Pressable
        onPress={() => setAbierto(!abierto)}
        accessibilityRole="button"
        accessibilityState={{ expanded: abierto }}
        hitSlop={6}
        style={{ minHeight: 32, justifyContent: 'center' }}
      >
        <Text style={{ color: colores.texto, fontSize: 13, fontWeight: '600' }}>
          {abierto ? '▾' : '▸'} {T.titulo}
        </Text>
      </Pressable>
      {abierto ? (
        <>
          <View style={{ gap: 4 }}>
            <Text style={etiqueta}>{T.palabra}</Text>
            <TextInput
              value={regla.palabra}
              onChangeText={(palabra) => onCambiar({ ...regla, palabra })}
              maxLength={MAX_PALABRA}
              editable={!deshabilitado}
              autoCapitalize="characters"
              autoCorrect={false}
              placeholder={T.palabraEjemplo}
              placeholderTextColor={colores.tenue}
              accessibilityLabel={T.palabra}
              style={estilo}
            />
            <Text style={pista}>{T.palabraPista}</Text>
          </View>
          <View style={{ gap: 4 }}>
            <Text style={etiqueta}>{T.mensaje}</Text>
            <TextInput
              value={regla.mensaje}
              onChangeText={(mensaje) => onCambiar({ ...regla, mensaje })}
              maxLength={MAX_MENSAJE}
              editable={!deshabilitado}
              multiline
              placeholder={T.mensajeEjemplo}
              placeholderTextColor={colores.tenue}
              accessibilityLabel={T.mensaje}
              style={{ ...estilo, minHeight: 72, textAlignVertical: 'top' }}
            />
            <Text style={pista}>{T.mensajePista}</Text>
          </View>
          <View style={{ gap: 4 }}>
            <Text style={etiqueta}>{T.respuesta}</Text>
            <TextInput
              value={regla.respuestaPublica}
              onChangeText={(respuestaPublica) => onCambiar({ ...regla, respuestaPublica })}
              maxLength={MAX_RESPUESTA}
              editable={!deshabilitado}
              accessibilityLabel={T.respuesta}
              style={estilo}
            />
            <Text style={pista}>{T.respuestaPista}</Text>
          </View>
          <Text style={pista}>{T.nota}</Text>
        </>
      ) : null}
    </View>
  )
}
