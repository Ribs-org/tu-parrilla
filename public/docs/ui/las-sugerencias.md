# Las Sugerencias — lo que escriben al equipo y sus respuestas

`/admin/sugerencias`, dentro del botón «Ajustes» de la barra de arriba, **solo para el admin**.
Los demás usuarios no la ven en el menú, y si abren la dirección, el panel los devuelve a La
Parrilla sin aviso.

Es el otro lado del libro de sugerencias ([libro-de-sugerencias.md](libro-de-sugerencias.md)):
acá el admin lee lo que toda la gente dejó en el libro —ideas, reclamos, preguntas— y le responde.
La respuesta la lee la persona en el mismo libro, en «Lo que nos escribiste»; la primera vez le
llega además un correo, y queda como comentario en el issue de GitHub de esa sugerencia, sin su
nombre ni su correo. De día se llama igual.

## Cómo se llega

1. En la barra de arriba, apretar el botón «Ajustes» (en una pantalla angosta se ve solo el
   ícono: un trinche y un cuchillo, lado a lado; de día, dos palillos).
2. En el menú, apretar «Las Sugerencias», la que tiene debajo «lo que escriben al equipo y sus
   respuestas». Está entre Los Maestros y Tu Cuenta.

O directo: `https://tu-parrilla.cl/admin/sugerencias`.

## Qué se ve

Arriba, el título «Las Sugerencias» (en mayúsculas), debajo «lo que escriben al equipo y sus
respuestas», y a la derecha dos botones redondeados: «Todas» y «Sin responder»; el elegido se
pinta de naranjo. Debajo, la frase «Lo que escriben en el libro de sugerencias (de día, «la caja
de sugerencias»), de lo más nuevo a lo más viejo. Lo que respondas lo lee la persona ahí mismo, le
llega un correo la primera vez y queda como comentario en el issue, sin su nombre ni su correo.».

Después, un bloque titulado «Todas» (o «Sin responder»), con las 200 más nuevas; si hay justo 200,
debajo del título dice «Las 200 más nuevas.». Cada sugerencia trae:

- Una línea chica con su tipo en una cápsula («Una idea», «Algo no funciona» u «Otra cosa»), la
  fecha («6 nov 2026»), «desde el panel» o «desde el teléfono», «<nombre> · <correo>» de quien la
  escribió (o solo el correo), y «issue #<número>», que abre el issue en GitHub en otra pestaña, o
  «sin issue todavía» si todavía no salió a GitHub.
- Lo que escribió, entero.
- La respuesta, con una raya naranja a la izquierda: el rótulo «Responder» (o «La respuesta del
  equipo» si ya tiene), el campo para escribirla —con lo que ya se respondió, si hay— y el botón
  «Responder», lleno de naranjo (o «Cambiar la respuesta», sin relleno, si ya tiene); mientras
  guarda, «Guardando…». Al lado del botón, si ya tiene respuesta: «Respondida el <fecha> por
  <nombre o correo de quien respondió> · leída el <fecha>» o «… · sin leer todavía».

Sin nada que mostrar: «Nadie ha escrito todavía.» o, en «Sin responder», «No hay nada sin
responder.».

## Qué se puede hacer

### Para responder una sugerencia

1. Buscarla (con «Sin responder» se ven solo las que esperan).
2. Escribir la respuesta en su campo. La lee la persona tal cual; en el issue público se cita sin
   su nombre ni su correo.
3. Apretar «Responder». Sale «Respondida. Le llega un correo y la lee en el libro.» en verde.

La persona ve un punto naranjo en su botón «Ajustes» y «Respuesta nueva» en el libro hasta que la
abre; ahí la línea de la respuesta pasa a decir «leída el <fecha>».

### Para cambiar una respuesta

1. Corregir el texto en su campo.
2. Apretar «Cambiar la respuesta». Sale «Respuesta cambiada. Le aparece sin leer en el libro, sin
   otro correo.».

Le vuelve a aparecer como «Respuesta nueva», sin otro correo, y en el issue queda otro comentario
con la respuesta nueva.

### Para responder sin el navegador

El equipo de desarrollo, que trabaja desde los issues de GitHub, puede responder con una llave de
API del admin: `POST /api/sugerencias/respuesta` con el número del issue y la respuesta. Está
contado en la guía de la API ([../api-editor.md](../api-editor.md)). Hace lo mismo que el botón.

## Mensajes que puede ver

| Lo que dice la pantalla | Qué significa | Qué hacer |
|---|---|---|
| «Respondida. Le llega un correo y la lee en el libro.» | Se guardó la primera respuesta. | Nada. |
| «Respuesta cambiada. Le aparece sin leer en el libro, sin otro correo.» | Se guardó una respuesta nueva encima de la que tenía. | Nada. |
| «Es la misma respuesta que ya tenía: no se cambió nada.» | Se apretó el botón sin cambiar el texto. | Nada, o cambiar el texto. |
| «Escribe la respuesta antes de guardarla.» | El campo está vacío. | Escribir la respuesta. |
| «La respuesta es muy larga: el máximo son 4000 caracteres.» | Se pasó del largo. | Acortarla. |
| «No hay ninguna sugerencia con ese issue o ese id.» | Esa sugerencia ya no existe (se quitó a quien la escribió). | Recargar. |
| «No se pudo guardar: revisa tu conexión y vuelve a intentarlo.» | No llegó al servidor. | Revisar la conexión y apretar de nuevo. |

## Si el humano dice…

- **«No veo Las Sugerencias».** Solo el admin la ve.
- **«¿Le llegó el correo?».** La pantalla no lo dice. Sale la primera vez que se responde, si el
  servicio de correo está configurado; aunque no salga, la respuesta está en su libro.
- **«No aparece el comentario en el issue».** Sale después de guardar, solo si la sugerencia ya
  tiene su issue («issue #<número>») y el sitio tiene su token de GitHub. Si dice «sin issue
  todavía», la respuesta queda igual en el libro, pero ese comentario no se manda después.
- **«¿Sabe la persona quién le respondió?».** No: en el libro dice «Te respondió el equipo».
- **«Quiero saber si la leyó».** La línea de al lado del botón: «leída el <fecha>» o «sin leer
  todavía».

## Lo que esta pantalla no hace

- No permite varias respuestas por sugerencia ni una conversación: hay una sola respuesta, y
  cambiarla reemplaza la anterior.
- No borra respuestas ni sugerencias.
- No cierra ni etiqueta el issue de GitHub: solo deja el comentario.
- No busca por texto ni filtra por tipo o por persona.

## Para quien mantiene esta página

Sale de:

- `src/app/admin/(dash)/sugerencias/page.tsx`: la pantalla, los filtros y cada sugerencia.
- `src/app/admin/(dash)/sugerencias/formulario.tsx`: el campo, el botón y sus mensajes.
- `src/app/admin/sugerencias-actions.ts` (`responderSugerenciaAccion`): lo que guarda y lo que dice.
- `src/lib/sugerencias/responder.ts`: qué se lee, cómo se guarda y el correo y el comentario que salen después.
- `src/lib/sugerencias/respuestas.ts`: las frases de error, el largo, la fecha, el correo y el comentario del issue.
- `src/app/api/sugerencias/respuesta/route.ts`: lo mismo sin el navegador.
- `src/lib/vocabulario.ts` y `src/app/admin/(dash)/nav.tsx`: el nombre, el subtítulo y que solo
  el admin la vea en «Ajustes».

Si cambias lo que se ve en alguno de ellos, actualiza esta página en el mismo commit.
