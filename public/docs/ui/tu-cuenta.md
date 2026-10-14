# Tu Cuenta — tu nombre, tu hora y tus llaves

`/admin/cuenta`, dentro del engranaje «Ajustes» de la barra de arriba (es la última entrada del
menú). La ven todos los usuarios.

Tu Cuenta guarda dos datos de la persona, su nombre y su zona horaria, y es donde se generan y
se revocan las llaves de API: lo que un programa —por ejemplo, el agente que le edita los
videos— necesita para programar publicaciones, sacarlas y leer el calendario y las métricas a
nombre de esta persona, sin entrar al panel. Cómo usa la llave ese programa está en la guía de
la API ([../api-llm.md](../api-llm.md); la versión para personas,
[../api-editor.md](../api-editor.md)).

## Cómo se llega

1. En la barra de arriba, apretar el engranaje «Ajustes» (en una pantalla angosta, como la del
   teléfono, se ve solo el engranaje, sin la palabra).
2. En el menú que se abre, apretar «Tu Cuenta», la que tiene debajo «tu nombre, tu hora y tus
   llaves».

O directo: `https://tu-parrilla.cl/admin/cuenta`.

## Qué se ve

Arriba, el título «Tu Cuenta» (se ve en mayúsculas), debajo «tu nombre, tu hora y tus llaves»,
y el párrafo «Con qué nombre apareces, en qué zona horaria vives y las llaves que les das a tus
agentes. El correo con el que entras no se cambia acá.». Después, dos bloques.

### Bloque «Tus datos»

- El campo «Nombre», con la ayuda «Con el que apareces en el panel. Puede quedar vacío.». Hoy
  ese nombre solo se ve en la lista de Los Maestros (quién puede entrar), que mira el admin.
- La lista desplegable «Zona horaria», con los nombres internacionales de zona horaria, en orden
  alfabético y en inglés (del tipo `America/Santiago`).
- La línea «Ahora son las HH:MM en <zona>.». La zona de esa línea es la **guardada**, no la que
  está elegida en la lista: cambia recién después de apretar «Guardar».
- El botón «Guardar» (mientras trabaja, «Guardando…»), y al lado, «Guardado.» en verde o un
  error en rojo.

### Bloque «Llaves para tus agentes»

Bajo el título, en letra chica: «Con una llave, un programa —tu agente que edita videos, un
script— programa posts, los saca, lee tu calendario y tus métricas a tu nombre, sin entrar al
panel.». Después, el párrafo «Quien tenga la llave puede hacer todo eso con tus cuentas: dásela
solo al agente que la va a usar. Lo que tiene que leer para saber usarla está en la guía de la
API.», donde «la guía de la API» es un enlace que abre esa guía en otra pestaña.

**El formulario para generar.** El campo «Nombre», obligatorio y de hasta 60 caracteres, con el
texto de ejemplo «Editor de videos» y la ayuda «Para reconocerla en la lista: el del agente o el
programa que la usa.». Al lado, el botón «Generar llave» (mientras trabaja, «Generando…»).

**La llave recién generada.** Aparece solo justo después de generar, en un recuadro con borde
anaranjado:

- la frase «Tu llave «<nombre>». Cópiala ahora: no se vuelve a mostrar. Si la pierdes,
  revócala y genera otra.», con «Cópiala ahora:» en negrita;
- la llave completa, que empieza con `tp_`. Un clic sobre ella la selecciona entera;
- dos botones: «Copiar con instrucciones para tu agente» y «Copiar solo la llave». Al copiar, el
  botón que se apretó dice «Copiado» por dos segundos.

El recuadro desaparece al recargar la página o salir de ella, y con él la llave: desde ese
momento no hay forma de volver a verla.

«Copiar con instrucciones para tu agente» copia este texto, con la dirección donde está abierto
el panel (en uso normal, `https://tu-parrilla.cl`) y la llave en su lugar:

```
API de Tu Parrilla
Base: https://tu-parrilla.cl
Llave: tp_…
Va en cada petición como el header «Authorization: Bearer tp_…».
Antes de llamar, lee la guía: https://tu-parrilla.cl/docs/api-llm.md
Si la persona se pierde en su panel, la wiki de la interfaz: https://tu-parrilla.cl/docs/ui/index.md
```

«Copiar solo la llave» copia únicamente la llave.

**La lista de llaves.** Una fila por llave, de la más antigua a la más nueva:

- el nombre que se le puso;
- `tp_…` y los últimos cuatro caracteres de la llave, para reconocerla;
- «creada <fecha> · sin usar», o «creada <fecha> · usada por última vez <fecha y hora>». El
  último uso se anota cada vez que un programa llama a la API con esa llave;
- el botón rojo «Revocar» (mientras trabaja, «Revocando…»).

Sin ninguna llave, en lugar de la lista dice «Todavía no tienes llaves.».

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

### Para darle una llave a un agente

1. En «Llaves para tus agentes», escribir en «Nombre» el nombre del agente o programa (por
   ejemplo, «Editor de videos»).
2. Apretar «Generar llave».
3. Apretar «Copiar con instrucciones para tu agente» y pegar ese texto donde el agente recibe
   instrucciones (su chat, su configuración). Si el agente pide solo la llave, usar «Copiar solo
   la llave».
4. Confirmar que quedó pegada **antes** de recargar o salir de la pantalla: después ya no se
   puede ver.

Si los botones de copiar no hacen nada, hacer un clic sobre la llave (queda seleccionada entera)
y copiarla con el teclado o el menú del navegador.

### Para revocar una llave

1. En la lista, encontrar la fila por su nombre y por sus últimos cuatro caracteres.
2. Apretar «Revocar».
3. El navegador pregunta «¿Revocar «<nombre>»? Lo que la use deja de entrar en su próxima
   petición.». Aceptar.

La fila desaparece de la lista. El programa que la usaba recibe `401 No autorizado` desde su
siguiente llamada ([../api-llm.md](../api-llm.md)).

### Para reemplazar una llave perdida o filtrada

1. Revocar la vieja (ver arriba).
2. Generar una nueva y dársela al agente.

## Mensajes que puede ver

| Lo que dice la pantalla | Qué significa | Qué hacer |
|---|---|---|
| «Guardado.» | El nombre y la zona quedaron guardados. | Nada. |
| «Esa zona horaria no existe.» | Se mandó una zona que el sistema no conoce. Con la lista normal no debería pasar. | Recargar la página y elegir de la lista. |
| «Ponle un nombre: el del agente que la va a usar.» | El nombre de la llave quedó vacío (por ejemplo, solo con espacios). | Escribir un nombre y volver a «Generar llave». |
| «El nombre puede tener hasta 60 caracteres.» | El nombre de la llave es demasiado largo. | Acortarlo. |
| «Ya tienes 10 llaves: revoca una antes de generar otra.» | Se llegó al tope de diez llaves por persona. | Revocar alguna que no se use (las «sin usar», o las de uso más viejo) y generar de nuevo. |
| «Tu llave «<nombre>». Cópiala ahora: no se vuelve a mostrar. Si la pierdes, revócala y genera otra.» | La llave se generó. | Copiarla ahora con uno de los dos botones. |
| «Copiado» | El texto quedó en el portapapeles. | Pegarlo donde corresponda. |
| «¿Revocar «<nombre>»? Lo que la use deja de entrar en su próxima petición.» | Confirmación antes de revocar. | Aceptar para revocar; cancelar para dejarla. |
| «Todavía no tienes llaves.» | No hay ninguna llave viva. | Generar una si un agente la necesita. |

Si se aprieta «Generar llave» con el nombre vacío, el navegador muestra su propio aviso de campo
obligatorio, en su idioma.

## Si el humano dice…

- **«¿Dónde genero una llave?».** Acá: engranaje «Ajustes» → «Tu Cuenta» → bloque «Llaves para
  tus agentes» → «Generar llave».
- **«Perdí la llave» / «No la copié» / «¿Dónde veo mi llave?».** No se vuelve a mostrar nunca;
  la lista solo enseña los últimos cuatro caracteres. Revocar esa y generar otra.
- **«El botón de copiar no hace nada».** Hacer un clic sobre la llave, que la selecciona
  entera, y copiarla a mano.
- **«No me deja generar más llaves».** Tiene diez; hay que revocar una primero.
- **«Mi agente dice 401» / «No autorizado».** La llave fue revocada o se copió mal. Si ya no
  está en la lista, la revocaron. Generar una nueva y pegarla completa.
- **«¿Qué llave usa mi agente?».** Por el nombre y los últimos cuatro caracteres; «usada por
  última vez» dice si se está usando.
- **«Las horas me salen corridas».** Revisar «Zona horaria» y la línea «Ahora son las…».
- **«Quiero cambiar mi correo».** No se puede, ni acá ni en otra pantalla.
- **«Quiero cambiar el nombre o la foto de mi página».** Eso es La Vitrina (tus páginas
  públicas, [la-vitrina.md](la-vitrina.md)), no Tu Cuenta.
- **«No encuentro Tu Cuenta en la barra».** No es una pestaña: está dentro del engranaje
  «Ajustes», a la derecha de la barra.

## Lo que esta pantalla no hace

- No cambia el correo, y no hay contraseña que cambiar (se entra con código,
  [ingresar.md](ingresar.md)).
- No cambia el nombre, la foto ni la dirección de la página pública: eso es La Vitrina.
- No vuelve a mostrar una llave ya generada, no permite renombrarla y no limita lo que puede
  hacer: todas las llaves pueden lo mismo.
- Las llaves no vencen solas: valen hasta que se revocan.
- No conecta redes: eso es Los Fierros (tus redes conectadas, [los-fierros.md](los-fierros.md)).
- El admin no ve ni revoca las llaves de otra persona, y «Cerrar sesiones» en Los Maestros no
  las toca: solo su dueño las revoca, desde acá.

## Para quien mantiene esta página

Sale de:

- `src/app/admin/(dash)/cuenta/page.tsx`: la pantalla, el párrafo de arriba, los dos bloques y
  la lista de llaves.
- `src/app/admin/(dash)/cuenta/formulario.tsx`: «Tus datos».
- `src/app/admin/(dash)/cuenta/llaves.tsx`: generar, la llave visible una vez, los dos botones
  de copiar y su texto, y «Revocar».
- `src/lib/llaves-api.ts`: el prefijo `tp_`, el tope de diez, los sesenta caracteres y las
  frases de error.
- `src/lib/llaves.ts`: la lista, el último uso y qué hace revocar.
- `src/lib/zona.ts`: la lista de zonas, la hora y «Esa zona horaria no existe.».
- `src/app/admin/actions.ts` (`guardarCuenta`, `generarLlaveApi`, `revocarLlaveApi`).
- `src/components/charts/panel.tsx` y `src/components/ui.tsx`: los bloques, los campos y los
  botones.
- `src/lib/vocabulario.ts` y `src/app/admin/(dash)/nav.tsx`: el nombre, el subtítulo y su lugar
  en el menú «Ajustes».

Si cambias lo que se ve en alguno de ellos, actualiza esta página en el mismo commit.
