# La Cocina — el chef de la casa y tu propio chef

`/admin/ia`, la cuarta pestaña de la barra de arriba, la última, con el dibujo de un maestro
cocinero al lado del nombre. La ven todos los usuarios.

La Cocina junta a los dos chefs que pueden cocinar para la persona:

- **El chef de la casa**, arriba, edita sus videos: le lleva el material crudo y le devuelve
  los creativos listos para programar. Está en piloto, y se enciende por cuenta.
- **Tu propio chef**, abajo, es su propia IA —el agente que le edita los videos, un asistente
  con herramientas, un script—, que programa publicaciones, las saca y lee el calendario y los
  números a su nombre, sin entrar al panel. Son dos pasos: generar una llave y darle la guía. Lo
  que la IA hace con la llave está en la guía de la API ([../api-llm.md](../api-llm.md); la
  versión para personas, [../api-editor.md](../api-editor.md)).

Al final está el manual del parrillero: esta misma wiki, armada para que la lea la persona.

Hasta el 2026-10-22 esta pestaña se llamaba **«Tu IA»** y tenía solo lo que hoy es «Tu propio
chef». Si alguien dice «Tu IA», es esta. Y hasta el 2026-10-19 las llaves estaban en Tu Cuenta,
dentro de Ajustes ([tu-cuenta.md](tu-cuenta.md) lo dice con un enlace).

## Cómo se llega

- En la barra de arriba, la pestaña «La Cocina», la cuarta, después de «Los Números». Lleva un
  maestro cocinero dibujado al lado: de noche, un parrillero de sombrero de ala ancha y
  delantal; de día, un maestro de sushi con su gorrito alto y la chaqueta de cuello cruzado.
  En un teléfono, si no se ve, deslizar la fila de pestañas hacia la izquierda.
- Desde Tu Cuenta, el enlace «La Cocina» del párrafo de arriba.
- O directo: `https://tu-parrilla.cl/admin/ia`.

## Qué se ve

Arriba, el título «La Cocina» (se ve en mayúsculas), debajo «el chef de la casa y tu propio
chef», y el párrafo «Dos chefs pueden cocinar para ti. El de la casa edita tus videos y te
devuelve los creativos, listos para programar. El tuyo es tu propia IA, que programa y lee en Tu
Parrilla a tu nombre, sin entrar al panel.». Después, el bloque del chef de la casa; debajo, la
sección «Tu propio chef» con tres bloques; y al final, el manual.

### Bloque «El chef de la casa», con la cocina apagada

Es lo que ve casi todo el mundo: la cocina se enciende cuenta por cuenta, en Los Maestros. El
párrafo «El chef de la casa edita tus videos: le llevas un video largo, un podcast en
videollamada o tus tomas sueltas, y te devuelve una tanda de clips y carruseles con sus textos,
para que los programes en tus redes. Está en piloto, con pocas cuentas.», y debajo:

- para una persona cualquiera, «Si quieres probarla, pídesela a quien administra Tu Parrilla.»;
- para el admin, «Se enciende por cuenta, en Los Maestros.», con «Los Maestros» como enlace a
  esa pantalla ([los-maestros.md](los-maestros.md)).

### Bloque «El chef de la casa», con la cocina encendida

Bajo el título, en letra chica: «Le llevas el material crudo y te devuelve los creativos, listos
para programar.». Después, una línea con un punto de color:

- punto verde y «La cocina está abierta.»: el servidor del chef está conectado;
- punto ámbar y «La cocina está cerrada por ahora: lo que pidas espera su turno.»: el servidor
  del chef no da señales hace más de diez minutos (un corte de luz o de internet donde está).
  Nada se pierde: las comandas esperan.

Debajo, el subtítulo «Las comandas» y, sin ninguna, «Todavía no tienes comandas.». Con comandas,
una tarjeta por comanda, de la más nueva a la más vieja (las últimas 50). Cada tarjeta trae:

- arriba, el nombre del archivo del plato principal (por ejemplo, «video9.mp4»), o «Comanda sin
  plato principal», y a la derecha «pedida <fecha y hora>»;
- el estado, en palabras (la tabla de abajo). Una comanda rechazada o que no se pudo terminar
  lleva el borde y el estado en rojo;
- mientras espera su turno, cuántas van antes: «Es la próxima en la fila.», «Hay 1 comanda antes
  que la tuya.» o «Hay N comandas antes que la tuya.»;
- «Hora estimada: <fecha y hora>», si se sabe: la da el chef al tomarla y la corrige en cada
  paso; mientras espera, sale de la fila y de lo que tarda una comanda en promedio;
- «El chef: «<mensaje>»», si el chef dejó un mensaje en el último paso;
- en una rechazada o que no se pudo terminar, el motivo que escribió el chef, en palabras;
- «Lo que pasó», un desplegable con cada paso: la fecha y hora, el estado y, si lo hubo, el
  mensaje del chef;
- «Cancelar la comanda», el botón rojo, mientras no esté en el horno (mientras está «Comanda
  colgada», «El chef mira la res» o «El desposte»). Mientras trabaja dice «Cancelando…».

| Estado en la tarjeta | Qué pasa | Quién la mueve |
|---|---|---|
| «Comanda colgada» | Espera que el chef la tome. | — |
| «El chef mira la res» | El chef bajó el material y lo revisa: duración, idioma, persona a cámara. Son minutos. | El chef |
| «El desposte» | El chef elige los cortes y escribe titulares y textos. Son horas. | El chef |
| «Al fuego» | Se arman las piezas en cada estilo. Son horas. | El chef |
| «Sirviendo: 3 de 5 tandas en el mesón» | Llegaron algunas tandas al mesón y otras siguen en el horno. «Sirviendo: 2 tandas en el mesón» si el chef no sabe cuántas van a ser. | El chef, con cada tanda |
| «Lista en el mesón: N cortes» | Todo llegó al mesón. | El chef |
| «No se puede cocinar» | El chef la rechazó al revisarla, por algo fuera de alcance. El motivo va debajo. | El chef |
| «No se pudo terminar» | Algo se rompió. El motivo va debajo. | El chef |
| «Cancelada» | La canceló la persona. | La persona |

De día, «El chef mira la res» es «El chef mira el atún», «El desposte» es «El despiece», «Al
fuego» es «Armando las piezas», el mesón es «la vitrina», los cortes son piezas y «No se puede
cocinar» es «No se puede preparar» (ver «El modo día» en [index.md](index.md)).

### Sección «Tu propio chef»

El título «Tu propio chef» y el párrafo «Tu IA puede programar y leer en Tu Parrilla por ti: le
pides «programa estos cinco videos para la semana» o «¿qué publicación me trajo más visitas?», y
lo hace a tu nombre, sin entrar al panel. Sirve cualquier agente que sepa llamar a una API: el
que te edita los videos, un asistente con herramientas, un script. Son dos pasos.». Después, tres
bloques.

### Bloque «1. Su llave»

Bajo el título, en letra chica: «Con una llave, tu IA programa posts, los saca, lee tu
calendario y tus números a tu nombre, sin entrar al panel.». Después, el párrafo «Quien tenga la
llave puede hacer todo eso con tus cuentas: dásela solo a la IA que la va a usar. Una por cada
IA: así revocas la de una sin tocar las otras.».

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

### Bloque «2. Su guía»

Bajo el título, en letra chica: «Tu IA no conoce Tu Parrilla: todo lo que sabe hacer acá está en
la guía.». Después, el párrafo «Al generar la llave, «Copiar con instrucciones para tu agente»
le pasa todo de una vez: la llave, dónde está la API y qué leer. Pégaselo en su chat o en su
configuración. Si te pide los enlaces, son estos:», y cuatro enlaces, cada uno con su dirección
completa al lado, en letra chica, y una línea debajo. Todos abren en otra pestaña:

- «La guía para tu IA» (`/docs/api-llm.md`): «Qué mandar, qué falla y cómo, y qué no existe. Es
  lo que tu IA tiene que leer antes de empezar.»
- «La guía para personas» (`/docs/api-editor.md`): «La misma API, explicada para quien la
  programa a mano o le escribe un script.»
- «El esquema» (`/docs/api.json`): «La forma exacta de cada campo, para las herramientas que
  leen OpenAPI.»
- «La wiki del panel» (`/docs/ui/index.md`): «Para que tu IA te guíe cuando te pierdas en el
  panel: cada pantalla, con el texto de cada botón.»

### Bloque «Lo que puede hacer»

Una lista:

- «Programar publicaciones, de a una o de a cientos, con sus archivos, sus redes y sus reglas de
  comentarios.»
- «Sacar lo que programaste y todavía no sale.»
- «Leer tu calendario: lo que viene y cómo salió lo que ya se fue.»
- «Leer lo que pide atención: lo que falló, las cuentas por reconectar y las que se quedan sin
  nada programado.»
- «Leer los números de cada publicación, y cuáles son tu mejor y tu peor 10 %.»

Y debajo: «Lo que no hace: editar un post ya programado (lo saca y lo programa de nuevo),
publicar en el acto, conectar tus redes ni cambiar tu página. Eso lo haces tú, en el panel.».

### Al final: el manual del parrillero

Bajo una raya, el título «¿Quieres saber más de Tu Parrilla?», el párrafo «Cada pantalla del
panel, botón por botón, con lo que dice cada mensaje y qué hacer con él. Lo escribimos para que
tu IA te guíe sin ver tu pantalla, y por eso es así de detallado: sirve igual para leerlo tú.» y
el enlace «El manual del parrillero →». De día, el enlace dice «El manual del maestro de sushi →»
y el manual lleva ese título.

### El manual del parrillero

`/admin/ia/manual`, y una dirección por página: `/admin/ia/manual/la-parrilla`,
`/admin/ia/manual/los-fierros`… Es esta misma wiki, para leerla en el panel. Mientras se lee, la
pestaña «La Cocina» queda marcada.

- Arriba, el enlace «← La Cocina», el título «El manual del parrillero» y el párrafo «Cada
  pantalla del panel, botón por botón, con el texto literal de cada uno, lo que dice cada mensaje
  y qué hacer con él. Lo escribimos para que tu IA te guíe sin ver tu pantalla —por eso a ratos le
  habla a ella—, y sirve igual para leerlo tú.».
- Al lado (en un teléfono, arriba), la lista de páginas: «Para empezar» (la entrada de esta
  wiki), «Entrar al panel», «La Parrilla», «La Mesa», «Los Números», «La Cocina», «Los Fierros»,
  «La Vitrina», «Los Maestros», «Tu Cuenta» y «La app del teléfono». La que se está leyendo,
  marcada.
- La página, con su título arriba. Las tablas anchas se deslizan de lado. Los enlaces a otra
  página llevan a esa página del manual; los de las guías de la API abren aparte. Sin la última
  sección de cada página, la de los archivos de donde sale, que es para quien la mantiene.

## Qué se puede hacer

### Para seguir una comanda

En «El chef de la casa», buscar su tarjeta por el nombre del plato principal. El estado dice en
qué va, y «Lo que pasó» cuenta cada paso con su hora. La página no se actualiza sola: recargar
para ver el último paso.

### Para cancelar una comanda

Solo mientras no esté en el horno: con «Comanda colgada», «El chef mira la res» o «El desposte».

1. Apretar «Cancelar la comanda» en su tarjeta.
2. El navegador pregunta «¿Cancelar esta comanda? El chef deja de prepararla, y lo que subiste se
   borra en 14 días.». Aceptar.

La tarjeta queda «Cancelada». Lo que se había subido para ella se guarda 14 días y después se
borra.

### Para conectar una IA

1. En «1. Su llave», escribir en «Nombre» el nombre de la IA o el programa (por ejemplo,
   «Editor de videos»).
2. Apretar «Generar llave».
3. Apretar «Copiar con instrucciones para tu agente» y pegar ese texto donde la IA recibe
   instrucciones (su chat, su configuración). Si pide solo la llave, usar «Copiar solo la
   llave».
4. Confirmar que quedó pegada **antes** de recargar o salir de la pantalla: después ya no se
   puede ver.

Si los botones de copiar no hacen nada, hacer un clic sobre la llave (queda seleccionada entera)
y copiarla con el teclado o el menú del navegador.

### Para pasarle la guía a mano

Si la IA pide un enlace, en «2. Su guía»: «La guía para tu IA» es la que tiene que leer; «La wiki
del panel», para cuando haya que guiar a la persona en su panel.

### Para revocar una llave

1. En la lista, encontrar la fila por su nombre y por sus últimos cuatro caracteres.
2. Apretar «Revocar».
3. El navegador pregunta «¿Revocar «<nombre>»? Lo que la use deja de entrar en su próxima
   petición.». Aceptar.

La fila desaparece de la lista. La IA que la usaba recibe `401 No autorizado` desde su siguiente
llamada ([../api-llm.md](../api-llm.md)).

### Para reemplazar una llave perdida o filtrada

1. Revocar la vieja (ver arriba).
2. Generar una nueva y dársela a la IA.

### Para leer el manual

Al final de la pantalla, «El manual del parrillero →». Adentro, elegir la página en la lista.

## Mensajes que puede ver

| Lo que dice la pantalla | Qué significa | Qué hacer |
|---|---|---|
| «Si quieres probarla, pídesela a quien administra Tu Parrilla.» | La cocina no está encendida para esta cuenta. | Pedírsela al admin, que la enciende en Los Maestros. |
| «La cocina está abierta.» | El servidor del chef está conectado. | Nada. |
| «La cocina está cerrada por ahora: lo que pidas espera su turno.» | El servidor del chef no da señales hace más de diez minutos. | Esperar: las comandas no se pierden, pero la hora estimada se corre. |
| «Todavía no tienes comandas.» | No hay ninguna comanda en esta cuenta. | Nada. |
| «¿Cancelar esta comanda? El chef deja de prepararla, y lo que subiste se borra en 14 días.» | Confirmación antes de cancelar. | Aceptar para cancelar; cancelar para dejarla. |
| «Esa comanda ya está en el horno o terminó: no se puede cancelar.» | El chef la metió al horno, o terminó, entre que se cargó la página y se apretó el botón. | Recargar: la tarjeta muestra su estado de ahora. |
| «Esa comanda no existe.» | La comanda ya no está, o no es de esta cuenta. | Recargar. |
| «Ponle un nombre: el del agente que la va a usar.» | El nombre de la llave quedó vacío (por ejemplo, solo con espacios). | Escribir un nombre y volver a «Generar llave». |
| «El nombre puede tener hasta 60 caracteres.» | El nombre de la llave es demasiado largo. | Acortarlo. |
| «Ya tienes 10 llaves: revoca una antes de generar otra.» | Se llegó al tope de diez llaves por persona. | Revocar alguna que no se use (las «sin usar», o las de uso más viejo) y generar de nuevo. |
| «Tu llave «<nombre>». Cópiala ahora: no se vuelve a mostrar. Si la pierdes, revócala y genera otra.» | La llave se generó. | Copiarla ahora con uno de los dos botones. |
| «Copiado» | El texto quedó en el portapapeles. | Pegarlo donde corresponda. |
| «¿Revocar «<nombre>»? Lo que la use deja de entrar en su próxima petición.» | Confirmación antes de revocar. | Aceptar para revocar; cancelar para dejarla. |
| «Todavía no tienes llaves.» | No hay ninguna llave viva. | Generar una si una IA la necesita. |

Si se aprieta «Generar llave» con el nombre vacío, el navegador muestra su propio aviso de campo
obligatorio, en su idioma.

## Si el humano dice…

- **«¿Dónde está Tu IA?».** Es esta pestaña: desde el 2026-10-22 se llama «La Cocina», y lo de
  Tu IA está abajo, en «Tu propio chef». Las llaves que tenía siguen vivas, con su mismo nombre.
- **«¿Qué es el chef de la casa?».** Un editor de videos: se le lleva el material crudo y
  devuelve clips y carruseles con sus textos, para programarlos. Está en piloto y se enciende
  cuenta por cuenta.
- **«Quiero el chef de la casa» / «No me deja pedir».** Si la pantalla dice «Si quieres probarla,
  pídesela a quien administra Tu Parrilla.», su cuenta no tiene la cocina encendida: se la tiene
  que encender el admin, en Los Maestros.
- **«¿Cómo pido una comanda?».** Todavía no se pide desde el panel: las de ahora las encarga
  quien administra la cocina. Lo que se ve acá es el seguimiento.
- **«¿Cuándo está lista mi comanda?».** En su tarjeta, «Hora estimada». Si no aparece, el chef
  todavía no la estimó.
- **«Dice que la cocina está cerrada».** El servidor del chef no da señales hace más de diez
  minutos. Las comandas esperan y no se pierden; la hora estimada se corre.
- **«Mi comanda dice No se puede cocinar» / «No se pudo terminar».** El motivo está en la
  tarjeta, debajo del estado. Lo que se subió para ella se guarda 14 días.
- **«Quiero cancelar una comanda».** «Cancelar la comanda», en su tarjeta, mientras no esté en el
  horno. Si ya está «Al fuego» o después, no se puede.
- **«¿Dónde genero una llave?».** Acá: la pestaña «La Cocina» → sección «Tu propio chef» → bloque
  «1. Su llave» → «Generar llave».
- **«Antes la llave estaba en Tu Cuenta».** Se mudó a Tu IA el 2026-10-19, que desde el
  2026-10-22 es «Tu propio chef», dentro de La Cocina; las que ya tenía siguen vivas.
- **«Perdí la llave» / «No la copié» / «¿Dónde veo mi llave?».** No se vuelve a mostrar nunca;
  la lista solo enseña los últimos cuatro caracteres. Revocar esa y generar otra.
- **«El botón de copiar no hace nada».** Hacer un clic sobre la llave, que la selecciona
  entera, y copiarla a mano.
- **«No me deja generar más llaves».** Tiene diez; hay que revocar una primero.
- **«Mi IA dice 401» / «No autorizado».** La llave fue revocada o se copió mal. Si ya no está
  en la lista, la revocaron. Generar una nueva y pegarla completa.
- **«¿Qué llave usa mi IA?».** Por el nombre y los últimos cuatro caracteres; «usada por
  última vez» dice si se está usando.
- **«¿Qué le digo a mi IA?».** Lo que copia «Copiar con instrucciones para tu agente» ya dice
  todo. Después, se le pide en palabras: «programa estos videos el martes a las 9», «¿qué
  publicación me trajo más visitas este mes?».
- **«¿Dónde está el manual?».** Al final de La Cocina, «El manual del parrillero →».
- **«No veo la pestaña La Cocina».** En un teléfono, deslizar la fila de pestañas hacia la
  izquierda: es la cuarta.

## Lo que esta pantalla no hace

- Todavía no pide comandas al chef de la casa: las de ahora las encarga quien administra la
  cocina. Tampoco muestra el mesón ni lo cocinado.
- No se actualiza sola: el estado de una comanda se ve al recargar.
- No vuelve a mostrar una llave ya generada, no permite renombrarla y no limita lo que puede
  hacer: todas las llaves pueden lo mismo.
- Las llaves no vencen solas: valen hasta que se revocan.
- No conecta la IA por su cuenta ni habla con ella: la persona le pega la llave y la guía.
- No elige ni recomienda una IA: sirve cualquiera que sepa llamar a una API.
- El admin no ve ni revoca las llaves de otra persona, y «Cerrar sesiones» en Los Maestros no
  las toca: solo su dueño las revoca, desde acá.
- El manual no se edita desde el panel: es esta wiki.

## Para quien mantiene esta página

Sale de:

- `src/app/admin/(dash)/ia/page.tsx`: la pantalla, el párrafo de arriba, «Tu propio chef» con sus
  tres bloques, la lista de llaves y el final con el manual.
- `src/app/admin/(dash)/ia/chef-de-la-casa.tsx`: «El chef de la casa», apagado y encendido, la
  línea de la cocina abierta o cerrada y las tarjetas de las comandas.
- `src/app/admin/(dash)/ia/cancelar.tsx` y `src/app/admin/cocina-actions.ts`: «Cancelar la
  comanda», su pregunta y sus mensajes.
- `src/lib/cocina/panel.ts`: qué comandas se ven, cuántas van antes, la hora estimada de la fila,
  los diez minutos sin señal y qué hace cancelar.
- `src/lib/cocina/nombres.ts` y `src/lib/cocina/tarjeta.ts`: el estado en palabras, de noche y de
  día, y cuántas van antes.
- `src/app/admin/(dash)/ia/llaves.tsx`: generar, la llave visible una vez, los dos botones de
  copiar y su texto, y «Revocar».
- `src/app/admin/(dash)/ia/manual/[[...pagina]]/page.tsx` y `src/lib/manual.ts`: el manual del
  parrillero, su lista de páginas y cómo se arma cada una.
- `src/components/icono-maestro.tsx`: el parrillero y el maestro de sushi de la pestaña.
- `src/lib/llaves-api.ts`: el prefijo `tp_`, el tope de diez, los sesenta caracteres y las
  frases de error.
- `src/lib/llaves.ts`: la lista, el último uso y qué hace revocar.
- `src/app/admin/actions.ts` (`generarLlaveApi`, `revocarLlaveApi`).
- `src/components/charts/panel.tsx` y `src/components/ui.tsx`: los bloques, los campos y los
  botones.
- `src/lib/vocabulario.ts` y `src/app/admin/(dash)/nav.tsx`: el nombre, el subtítulo y su lugar
  en la barra.

Si cambias lo que se ve en alguno de ellos, actualiza esta página en el mismo commit.
