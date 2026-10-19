# Tu Cuenta — tu nombre y tu hora

`/admin/cuenta`, dentro del botón «Ajustes» de la barra de arriba (es la última entrada del
menú). La ven todos los usuarios.

Tu Cuenta guarda dos datos de la persona: su nombre y su zona horaria. Las llaves de API, que
estaban acá hasta el 2026-10-19, se mudaron a Tu IA, la cuarta pestaña de la barra
([tu-ia.md](tu-ia.md)).

## Cómo se llega

1. En la barra de arriba, apretar el botón «Ajustes» (en una pantalla angosta, como la del
   teléfono, se ve solo el ícono, un trinche y un cuchillo, lado a lado, sin la palabra).
2. En el menú que se abre, apretar «Tu Cuenta», la que tiene debajo «tu nombre y tu hora».

O directo: `https://tu-parrilla.cl/admin/cuenta`.

## Qué se ve

Arriba, el título «Tu Cuenta» (se ve en mayúsculas), debajo «tu nombre y tu hora», y el párrafo
«Con qué nombre apareces y en qué zona horaria vives. El correo con el que entras no se cambia
acá. Las llaves para tu IA están en Tu IA.», donde «Tu IA» es un enlace a esa pantalla.
Después, un bloque.

### Bloque «Tus datos»

- El campo «Nombre», con la ayuda «Con el que apareces en el panel. Puede quedar vacío.». Hoy
  ese nombre solo se ve en la lista de Los Maestros (quién puede entrar), que mira el admin.
- La lista desplegable «Zona horaria», con los nombres internacionales de zona horaria, en orden
  alfabético y en inglés (del tipo `America/Santiago`).
- La línea «Ahora son las HH:MM en <zona>.». La zona de esa línea es la **guardada**, no la que
  está elegida en la lista: cambia recién después de apretar «Guardar».
- El botón «Guardar» (mientras trabaja, «Guardando…»), y al lado, «Guardado.» en verde o un
  error en rojo.

## Qué se puede hacer

### Para cambiar el nombre

1. En «Tus datos», escribir en «Nombre» (o dejarlo vacío).
2. Apretar «Guardar». Sale «Guardado.».

### Para cambiar la zona horaria

1. En «Tus datos», elegir la zona en «Zona horaria». Para Chile continental es
   `America/Santiago`.
2. Apretar «Guardar». Sale «Guardado.» y la línea «Ahora son las…» pasa a la zona nueva: ahí se
   comprueba que la hora sea la del reloj de la persona.

La zona manda en todo el panel: qué es hoy y qué es ayer en La Parrilla (la entrada del
panel), las horas del calendario y del formulario para programar, y las fechas que recibe la
API. Lo ya programado no se mueve: sale en el mismo momento de siempre, solo que el panel lo
muestra con la hora de la zona nueva.

## Mensajes que puede ver

| Lo que dice la pantalla | Qué significa | Qué hacer |
|---|---|---|
| «Guardado.» | El nombre y la zona quedaron guardados. | Nada. |
| «Esa zona horaria no existe.» | Se mandó una zona que el sistema no conoce. Con la lista normal no debería pasar. | Recargar la página y elegir de la lista. |

## Si el humano dice…

- **«¿Dónde genero una llave?» / «Antes las llaves estaban acá».** Se mudaron a Tu IA, la cuarta
  pestaña de la barra ([tu-ia.md](tu-ia.md)); el enlace «Tu IA» del párrafo de arriba lleva
  ahí. Las que ya tenía siguen vivas.
- **«Las horas me salen corridas».** Revisar «Zona horaria» y la línea «Ahora son las…».
- **«Quiero cambiar mi correo».** No se puede, ni acá ni en otra pantalla.
- **«Quiero cambiar el nombre o la foto de mi página».** Eso es La Vitrina (tus páginas
  públicas, [la-vitrina.md](la-vitrina.md)), no Tu Cuenta.
- **«No encuentro Tu Cuenta en la barra».** No es una pestaña: está dentro del botón
  «Ajustes», a la derecha de la barra.

## Lo que esta pantalla no hace

- No cambia el correo, y no hay contraseña que cambiar (se entra con código,
  [ingresar.md](ingresar.md)).
- No cambia el nombre, la foto ni la dirección de la página pública: eso es La Vitrina.
- No genera ni revoca llaves: eso es Tu IA.
- No conecta redes: eso es Los Fierros (tus redes conectadas, [los-fierros.md](los-fierros.md)).

## Para quien mantiene esta página

Sale de:

- `src/app/admin/(dash)/cuenta/page.tsx`: la pantalla, el párrafo de arriba y el bloque.
- `src/app/admin/(dash)/cuenta/formulario.tsx`: «Tus datos».
- `src/lib/zona.ts`: la lista de zonas, la hora y «Esa zona horaria no existe.».
- `src/app/admin/actions.ts` (`guardarCuenta`).
- `src/components/charts/panel.tsx` y `src/components/ui.tsx`: el bloque, los campos y el
  botón.
- `src/lib/vocabulario.ts` y `src/app/admin/(dash)/nav.tsx`: el nombre, el subtítulo y su lugar
  en el menú «Ajustes».

Si cambias lo que se ve en alguno de ellos, actualiza esta página en el mismo commit.
