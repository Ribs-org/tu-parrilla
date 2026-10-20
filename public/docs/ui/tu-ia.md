# Tu IA — tu propio chef: la llave y la guía para conectarla

`/admin/ia`, la cuarta pestaña de la barra de arriba, la última, con el dibujo de un maestro
cocinero al lado del nombre. La ven todos los usuarios.

Tu IA es donde la persona conecta su propia IA —el agente que le edita los videos, un asistente
con herramientas, un script— para que programe publicaciones, las saque y lea el calendario y
los números a su nombre, sin entrar al panel. Son dos pasos: generar una llave y darle la guía.
Abajo está el manual del parrillero: esta misma wiki, armada para que la lea la persona. Lo que
la IA hace con la llave está en la guía de la API ([../api-llm.md](../api-llm.md); la versión
para personas, [../api-editor.md](../api-editor.md)).

Hasta el 2026-10-19 las llaves estaban en Tu Cuenta, dentro de Ajustes: si alguien las busca
ahí, ahora están acá ([tu-cuenta.md](tu-cuenta.md) lo dice con un enlace).

## Cómo se llega

- En la barra de arriba, la pestaña «Tu IA», la cuarta, después de «Los Números». Lleva un
  maestro cocinero dibujado al lado: de noche, un parrillero de sombrero de ala ancha y
  delantal; de día, un maestro de sushi con su gorrito alto y la chaqueta de cuello cruzado.
  En un teléfono, si no se ve, deslizar la fila de pestañas hacia la izquierda.
- Desde Tu Cuenta, el enlace «Tu IA» del párrafo de arriba.
- O directo: `https://tu-parrilla.cl/admin/ia`.

## Qué se ve

Arriba, el título «Tu IA» (se ve en mayúsculas), debajo «tu propio chef: la llave y la guía
para conectarla», y el párrafo «Tu IA puede programar y leer en Tu Parrilla por ti: le pides
«programa estos cinco videos para la semana» o «¿qué publicación me trajo más visitas?», y lo
hace a tu nombre, sin entrar al panel. Sirve cualquier agente que sepa llamar a una API: el que
te edita los videos, un asistente con herramientas, un script. Son dos pasos.». Después, tres
bloques y, al final, el manual.

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
pestaña «Tu IA» queda marcada.

- Arriba, el enlace «← Tu IA», el título «El manual del parrillero» y el párrafo «Cada pantalla
  del panel, botón por botón, con el texto literal de cada uno, lo que dice cada mensaje y qué
  hacer con él. Lo escribimos para que tu IA te guíe sin ver tu pantalla —por eso a ratos le
  habla a ella—, y sirve igual para leerlo tú.».
- Al lado (en un teléfono, arriba), la lista de páginas: «Para empezar» (la entrada de esta
  wiki), «Entrar al panel», «La Parrilla», «La Mesa», «Los Números», «Tu IA», «Los Fierros», «La
  Vitrina», «Los Maestros», «Tu Cuenta» y «La app del teléfono». La que se está leyendo, marcada.
- La página, con su título arriba. Las tablas anchas se deslizan de lado. Los enlaces a otra
  página llevan a esa página del manual; los de las guías de la API abren aparte. Sin la última
  sección de cada página, la de los archivos de donde sale, que es para quien la mantiene.

## Qué se puede hacer

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

- **«¿Dónde genero una llave?».** Acá: la pestaña «Tu IA» → bloque «1. Su llave» → «Generar
  llave».
- **«Antes la llave estaba en Tu Cuenta».** Se mudó a Tu IA el 2026-10-19; las que ya tenía
  siguen vivas, con su mismo nombre.
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
- **«¿Dónde está el manual?».** Al final de Tu IA, «El manual del parrillero →».
- **«No veo la pestaña Tu IA».** En un teléfono, deslizar la fila de pestañas hacia la izquierda:
  es la cuarta.

## Lo que esta pantalla no hace

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

- `src/app/admin/(dash)/ia/page.tsx`: la pantalla, el párrafo de arriba, los tres bloques, la
  lista de llaves y el final con el manual.
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
