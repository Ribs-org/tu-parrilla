import { Tabs } from 'expo-router'
import { COLORES, TIPO_TITULO } from '../../components/ui'
import { BotonPublicar, IconoNumeros, IconoParrilla } from '../../components/iconos'
import { BotonAjustes } from '../../components/boton-ajustes'

/**
 * Las tres pestañas del panel web, en el mismo orden de importancia: La Parrilla es la
 * entrada, Publicar va al medio porque es la acción principal, y Los Números cierra. Hasta
 * el 2026-10-16 eran cinco con nombres propios (Resumen, Contenido, Publicar, Cuentas,
 * Calendario); lo que mostraban vive ahora en estas tres, con el vocabulario del panel.
 *
 * Arriba a la derecha de cada una, el botón de Ajustes, como en el panel.
 */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: COLORES.fondo },
        headerRight: () => <BotonAjustes />,
        // El título de cada pestaña es el título de la pantalla: va en la voz de los títulos.
        headerTitleStyle: {
          color: COLORES.texto,
          fontFamily: TIPO_TITULO,
          letterSpacing: 1,
          textTransform: 'uppercase',
        },
        tabBarStyle: { backgroundColor: COLORES.tarjeta, borderTopColor: '#00000000' },
        // La pestaña activa en brasa: antes se distinguía solo por blanco contra gris.
        tabBarActiveTintColor: COLORES.brasa,
        tabBarInactiveTintColor: COLORES.tenue,
        // El rótulo también en la voz de los títulos, pero chico: el icono manda y el
        // texto confirma. Sin `textTransform` acá — a 10 puntos las mayúsculas de una
        // condensada como Oswald se empastan.
        tabBarLabelStyle: { fontFamily: TIPO_TITULO, fontSize: 11, letterSpacing: 0.6 },
      }}
    >
      {/* `color` ya llega resuelto por los dos tintes de arriba: el icono no decide su color. */}
      <Tabs.Screen
        name="index"
        options={{ title: 'La Parrilla', tabBarIcon: ({ color }) => <IconoParrilla color={color} /> }}
      />
      <Tabs.Screen
        name="publicar"
        options={{
          title: 'Publicar',
          tabBarIcon: ({ focused }) => (
            <BotonPublicar fondo={COLORES.tarjeta} brasa={COLORES.brasa} activo={focused} />
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
