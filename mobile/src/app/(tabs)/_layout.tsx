import { useEffect } from 'react'
import { Tabs } from 'expo-router'
import { TIPO_TITULO } from '../../components/ui'
import { useColores, useTema } from '../../components/tema'
import { BotonPublicar, IconoNumeros, IconoParrilla } from '../../components/iconos'
import { BotonAjustes } from '../../components/boton-ajustes'
import { LA_PARRILLA } from '../../lib/tema'

/**
 * Las tres pestañas del panel web, en el mismo orden de importancia: La Parrilla es la
 * entrada, Publicar va al medio porque es la acción principal, y Los Números cierra. Hasta
 * el 2026-10-16 eran cinco con nombres propios (Resumen, Contenido, Publicar, Cuentas,
 * Calendario); lo que mostraban vive ahora en estas tres, con el vocabulario del panel. De día,
 * como en el panel, la primera se llama La Barra.
 *
 * Arriba a la derecha de cada una, el botón de Ajustes, como en el panel.
 */
export default function TabsLayout() {
  const colores = useColores()
  const { tema, sincronizar } = useTema()
  // Recién entrado, el modo de la cuenta: al abrir la app todavía no había sesión que preguntar.
  useEffect(() => {
    sincronizar()
  }, [sincronizar])
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colores.fondo },
        headerRight: () => <BotonAjustes />,
        // El título de cada pestaña es el título de la pantalla: va en la voz de los títulos.
        headerTitleStyle: {
          color: colores.texto,
          fontFamily: TIPO_TITULO,
          letterSpacing: 1,
          textTransform: 'uppercase',
        },
        tabBarStyle: { backgroundColor: colores.tarjeta, borderTopColor: '#00000000' },
        // La pestaña activa en brasa: antes se distinguía solo por blanco contra gris.
        tabBarActiveTintColor: colores.brasa,
        tabBarInactiveTintColor: colores.tenue,
        // El rótulo también en la voz de los títulos, pero chico: el icono manda y el
        // texto confirma. Sin `textTransform` acá — a 10 puntos las mayúsculas de una
        // condensada como Oswald se empastan.
        tabBarLabelStyle: { fontFamily: TIPO_TITULO, fontSize: 11, letterSpacing: 0.6 },
      }}
    >
      {/* `color` ya llega resuelto por los dos tintes de arriba: el icono no decide su color. */}
      <Tabs.Screen
        name="index"
        options={{ title: LA_PARRILLA[tema], tabBarIcon: ({ color }) => <IconoParrilla color={color} /> }}
      />
      <Tabs.Screen
        name="publicar"
        options={{
          title: 'Publicar',
          tabBarIcon: ({ focused }) => (
            <BotonPublicar fondo={colores.tarjeta} brasa={colores.brasa} activo={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="numeros"
        options={{ title: 'Los Números', tabBarIcon: ({ color }) => <IconoNumeros color={color} /> }}
      />
    </Tabs>
  )
}
