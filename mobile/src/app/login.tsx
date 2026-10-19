import { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Boton, Titulo } from '../components/ui'
import { useColores } from '../components/tema'
import { CODIGO_ENVIADO, CORREO_INVALIDO, limpiarCodigo, normalizarCorreo } from '../lib/ingreso'
import { entrar, pedirCodigo } from '../lib/session'

/** Los dos pasos del panel web (/ingresar) en una sola pantalla: el correo y el código. */
export default function Login() {
  const colores = useColores()
  const campo = { backgroundColor: colores.tarjeta, color: colores.texto, borderRadius: 12, padding: 14, marginTop: 8 } as const
  const [paso, setPaso] = useState<'correo' | 'codigo'>('correo')
  const [correo, setCorreo] = useState('')
  const [codigo, setCodigo] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)
  const router = useRouter()
  // El proveedor ya lo monta expo-router en su raíz; acá solo se leen los márgenes.
  const insets = useSafeAreaInsets()

  async function mandar() {
    const limpio = normalizarCorreo(correo)
    if (!limpio) {
      setError(CORREO_INVALIDO)
      return
    }
    setOcupado(true)
    const resultado = await pedirCodigo(limpio)
    setOcupado(false)
    if ('error' in resultado) {
      setError(resultado.error)
      return
    }
    setCorreo(limpio)
    setCodigo('')
    setError(null)
    setPaso('codigo')
  }

  async function canjear() {
    if (codigo.length !== 6) return
    setOcupado(true)
    const resultado = await entrar(correo, codigo)
    setOcupado(false)
    if ('error' in resultado) {
      setError(resultado.error)
      return
    }
    router.replace('/(tabs)')
  }

  function otroCorreo() {
    setError(null)
    setPaso('correo')
  }

  return (
    // `height` es el `behavior` de Android: la app dibuja de borde a borde, así que la
    // ventana ya no se encoge sola al abrir el teclado. Y acá el teclado sale de
    // entrada por el `autoFocus`, con lo que el botón nacía tapado. En iOS corresponde `padding`.
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{
        flex: 1,
        backgroundColor: colores.fondo,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}
    >
      <View style={{ flex: 1, justifyContent: 'center', padding: 24, gap: 12 }}>
        {paso === 'correo' ? (
          <>
            <Titulo>Tu Parrilla</Titulo>
            <Text style={{ color: colores.suave }}>Entra con tu correo: te mandamos un código.</Text>
            <TextInput
              key="correo"
              value={correo}
              onChangeText={setCorreo}
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              keyboardType="email-address"
              onSubmitEditing={mandar}
              placeholder="tu@correo.cl"
              placeholderTextColor={colores.tenue}
              style={campo}
            />
          </>
        ) : (
          <>
            <Titulo>Tu código</Titulo>
            <Text style={{ color: colores.suave }}>{CODIGO_ENVIADO}</Text>
            <TextInput
              key="codigo"
              value={codigo}
              onChangeText={(texto) => setCodigo(limpiarCodigo(texto))}
              autoFocus
              autoComplete="one-time-code"
              keyboardType="number-pad"
              onSubmitEditing={canjear}
              placeholder="000000"
              placeholderTextColor={colores.tenue}
              style={{ ...campo, letterSpacing: 6 }}
            />
          </>
        )}
        {error ? <Text style={{ color: colores.rojo }}>{error}</Text> : null}
        {/* En fila porque `Boton` crece a lo ancho con `flex: 1`, y esta pantalla apila. */}
        <View style={{ flexDirection: 'row' }}>
          {paso === 'correo' ? (
            <Boton
              texto={ocupado ? 'Enviando…' : 'Mandarme un código'}
              onPress={mandar}
              deshabilitado={ocupado || correo.trim() === ''}
              destacado
            />
          ) : (
            <Boton
              texto={ocupado ? 'Entrando…' : 'Entrar'}
              onPress={canjear}
              deshabilitado={ocupado || codigo.length !== 6}
              destacado
            />
          )}
        </View>
        {paso === 'codigo' ? (
          <Pressable onPress={otroCorreo} disabled={ocupado} hitSlop={8} style={{ alignSelf: 'center', padding: 8 }}>
            <Text style={{ color: colores.tenue }}>Usar otro correo</Text>
          </Pressable>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  )
}
