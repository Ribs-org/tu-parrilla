# La Cocina — el chef de la casa y tu propio chef

`/admin/ia`, la cuarta pestaña de la barra de arriba, la última, con el dibujo de un maestro
cocinero al lado del nombre. La ven todos los usuarios.

La Cocina junta a los dos chefs que pueden cocinar para la persona:

- **El chef de la casa**, arriba, edita sus videos: le lleva el material crudo y le devuelve
  los creativos listos para programar. Está en piloto, y se enciende por cuenta.
- **Tu propio chef**, abajo, es su propia IA —el agente que le edita los videos, un asistente
  con herramientas, un script—, que programa publicaciones, las saca, lee el calendario y los
  números y guarda material en la cámara de frío a su nombre, sin entrar al panel. Son dos pasos: generar una llave y darle la guía. Lo
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

Es lo que ve casi todo el mundo: la cocina se enciende cuenta por cuenta, en Los Maestros. Arriba,
un dibujo ancho (ver «La escena», abajo), con el fuego en brasas. Después, el párrafo «El chef de la casa edita tus videos: le llevas un video largo, un podcast en
videollamada o tus tomas sueltas, y te devuelve una tanda de clips y carruseles con sus textos,
para que los programes en tus redes. Está en piloto, con pocas cuentas.», y debajo:

- para una persona cualquiera, «Si quieres probarla, pídesela a quien administra Tu Parrilla.»;
- para el admin, «Se enciende por cuenta, en Los Maestros.», con «Los Maestros» como enlace a
  esa pantalla ([los-maestros.md](los-maestros.md)).

### Bloque «El chef de la casa», con la cocina encendida

Bajo el título, en letra chica: «Le llevas el material crudo y te devuelve los creativos, listos
para programar.». Después, el dibujo ancho de la escena y una línea con un punto de color:

- punto verde y «La cocina está abierta.»: el servidor del chef está conectado;
- punto ámbar y «La cocina está cerrada por ahora: lo que pidas espera su turno.»: el servidor
  del chef no da señales hace más de diez minutos (un corte de luz o de internet donde está).
  Nada se pierde: las comandas esperan.

Debajo, el subtítulo «Las comandas»; al lado, mientras alguna comanda está en marcha (de «Comanda
colgada» a «Sirviendo»), un punto anaranjado que late y «Se actualiza sola». A la derecha, los
botones:

- «La cámara de frío» —de día, «La nevera»—, con una puerta dibujada (de día, una nevera con un
  pescado) y, en chico, cuánto ocupa («19,3 GB de 20 GB») o «vacía». Lleva a la cámara, donde se
  guarda el material en bruto ([la-camara-de-frio.md](la-camara-de-frio.md));
- «El mesón (<N>)» —de día, «La bandeja (<N>)»—, si hay algo esperando en el mesón. Lleva al mesón
  (ver «El mesón», abajo);
- el botón anaranjado «Pedir una comanda», que lleva a pedir una (ver «Pedir una comanda», abajo). Sin ninguna comanda, «Todavía no tienes
comandas.». Con comandas, una tarjeta por comanda, de la más nueva a la más vieja (las últimas
50). Cada tarjeta trae:

- a la izquierda, un cuadro con su estación: un dibujo que cambia según en qué va la comanda y
  que, mientras el chef trabaja, se mueve (ver «La estación de cada comanda», abajo). Es solo un
  dibujo: no se aprieta;
- arriba, el nombre del archivo del plato principal (por ejemplo, «video9.mp4»), o «Comanda sin
  plato principal», y a la derecha «pedida <fecha y hora>»;
- el estado, en palabras (la tabla de abajo). Una comanda rechazada o que no se pudo terminar
  lleva el borde y el estado en rojo;
- debajo del estado, el recorrido: cinco rayitas, una por tramo —colgada, el chef mira, el
  desposte, al fuego y el mesón—. Las hechas van en anaranjado; la de ahora, con una luz que la
  cruza; al servir, la última se llena con las tandas que llegaron. Llena entera, la comanda llegó
  toda al mesón. Una rechazada, que no se pudo terminar o cancelada no lo lleva;
- mientras espera su turno, cuántas van antes: «Es la próxima en la fila.», «Hay 1 comanda antes
  que la tuya.» o «Hay N comandas antes que la tuya.»;
- «Hora estimada: <fecha y hora>», si se sabe: la da el chef al tomarla y la corrige en cada
  paso; mientras espera, sale de la fila y de lo que tarda una comanda en promedio;
- «El chef: «<mensaje>»», si el chef dejó un mensaje en el último paso;
- «Ver en el mesón →» —de día, «Ver en la bandeja →»—, si algo de esa comanda espera en el mesón:
  lleva al mesón con solo lo de esa comanda;
- en una rechazada o que no se pudo terminar, el motivo que escribió el chef, en palabras;
- «Tu instrucción al chef: «<texto>»», en letra chica, si se la escribió al pedirla (hasta tres
  líneas; lo que sigue se corta con «…»);
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
| «Servida» | Todo lo que entregó se programó, se descartó o venció a los 30 días: la comanda se cerró sola. | Sola |
| «No se puede cocinar» | El chef la rechazó al revisarla, por algo fuera de alcance. El motivo va debajo. | El chef |
| «No se pudo terminar» | Algo se rompió. El motivo va debajo. | El chef |
| «Cancelada» | La canceló la persona. | La persona |

De día, «El chef mira la res» es «El chef mira el atún», «El desposte» es «El despiece», «Al
fuego» es «Armando las piezas», el mesón es «la bandeja», los cortes son piezas y «No se puede
cocinar» es «No se puede preparar» (ver «El modo día» en [index.md](index.md)).

**La tarjeta se actualiza sola.** Mientras haya alguna comanda en marcha y la pestaña esté a la
vista, el panel mira cada pocos segundos si algo cambió y, si cambió, pone las tarjetas al día sin
recargar la página: el estado, la estación, el recorrido, el mensaje del chef, «Ver en el mesón
→». Un paso del chef se ve en unos 5 a 15 segundos. Con la pestaña en segundo plano no mira, y al
volver a ella mira de inmediato. Con todas listas, servidas o terminadas, deja de mirar y se va
«Se actualiza sola».

**Llega un correo cuando termina.** Al quedar «Lista en el mesón», el dueño recibe un correo con
cuántos cortes quedaron en el mesón y el enlace para verlos; al quedar «No se puede cocinar» o «No
se pudo terminar», uno con el motivo del chef. Llega uno por comanda, al correo con que entra al
panel, en su modo (de día, «Lista en la bandeja»). «Servida» y «Cancelada» no mandan correo: las
hace la persona.

### La estación de cada comanda

El cuadro a la izquierda de cada tarjeta. De noche es la parrilla, sobre fondo oscuro; de día, la
barra de sushi, sobre papel claro.

| Estado | De noche | De día |
|---|---|---|
| «Comanda colgada» | La comanda de papel, colgada de un riel, se mece; abajo, el pase con su campanilla. | Lo mismo, con el riel de madera. |
| «El chef mira la res» | Una lupa recorre la media res colgada. | Una lupa recorre el atún sobre la tabla. |
| «El desposte» | La res con las líneas por donde se corta, que avanzan, y un cuchillo que va y viene. | Lo mismo, con el atún y un cuchillo largo. |
| «Al fuego» | La parrilla prendida: tres cortes sobre la rejilla, las llamas y las brasas debajo, y el humo que sube. | Tres piezas de arroz sobre una tabla con patas; el pescado cae sobre cada una, y un soplete azul arde encima. |
| «Sirviendo» | La parrilla chica a la izquierda; un corte viaja de ella a la tabla de la derecha, donde esperan los que ya salieron (uno por tanda, hasta tres). | Lo mismo, con una pieza que viaja a la bandeja. |
| «Lista en el mesón» | La tabla llena, con cuatro cortes, una ramita de romero y el humo. | La bandeja con tres piezas, una hoja de shiso y wasabi, y una luz que la cruza. |
| «Servida» | La tabla vacía, con la ramita de romero. | La bandeja vacía, con la hoja de shiso. |
| «No se puede cocinar», «No se pudo terminar», «Cancelada» | La res apagada, en gris. | El atún apagado, en gris. |

Con el movimiento reducido del sistema (la opción de accesibilidad «Reducir movimiento», en el
teléfono o el computador), nada se mueve: cada estación queda quieta en un cuadro que dice lo
mismo —la comanda colgada, la lupa sobre la carne, la parrilla prendida, el corte ya en la tabla—,
y el punto de «Se actualiza sola» deja de latir. La tarjeta se sigue actualizando igual.

### La escena

Arriba del bloque «El chef de la casa», un dibujo ancho. Es solo un dibujo: no se aprieta.

- **De noche:** un parrillero medio gaucho, de sombrero, pañuelo rojo, poncho con flecos y mate en
  la mano, aviva con el atizador el fuego de un asado al palo, con el cordero abierto en la cruz.
- **De día:** un maestro de sushi, de gorrito alto y chaqueta de cuello cruzado, con el cuchillo
  largo levantado sobre un atún entero, sobre el mesón de madera, y un farol de papel colgando.

Con la cocina abierta, el fuego arde con sus llamas y el farol está prendido. Cerrada o apagada,
quedan las brasas con un hilo de humo, y el farol apagado. Dice lo mismo que la línea del punto de
color.

### Pedir una comanda

`/admin/ia/pedir`, desde «Pedir una comanda». Solo con la cocina encendida: sin ella, la
dirección lleva de vuelta a La Cocina. Mientras se está acá, la pestaña «La Cocina» queda marcada.

Arriba, el enlace «← La Cocina», el título «Pedir una comanda» y el párrafo «Eliges de tu material
guardado lo que le llevas al chef de la casa, y le dices qué quieres que salga. Lo cocina en unas
horas, o al día siguiente, y te avisa en cada paso.». Después, seis bloques. En un computador, los
dos primeros van lado a lado; en un teléfono, uno debajo del otro.

Desde el 2026-11-02 una comanda se arma con lo que hay en la cámara de frío
([la-camara-de-frio.md](la-camara-de-frio.md)): ya no se sube el plato principal y los
acompañamientos uno por uno en este formulario.

**Bloque «1. De la cámara de frío».** De día, «1. De la nevera». Bajo el título: «Toca lo que va en
esta comanda: un video es el plato principal, y lo demás lo acompaña. Lo que elijas sigue guardado
después.».

- Si hay de más de una clase, los filtros «Todo», «Videos», «Audios», «Imágenes», «Otros», con
  cuántos hay de cada uno.
- Una tarjeta por material de la cámara, de lo más nuevo a lo más viejo: su dibujo (el mismo de la
  cámara, que dice qué es y cuánto pesa), el nombre, el nombre de su tamaño y su peso («media res ·
  5,5 GB») y su uso. Se aprieta para elegirlo: el dibujo sale volando de la tarjeta hasta el riel
  de la comanda, a la derecha (en el teléfono, abajo), y se mece al colgarse; en la tarjeta queda
  apagado, con el borde anaranjado y «En la comanda». Apretarla otra vez lo saca de la comanda.
  Caben hasta 21: el plato principal y 20 más.
- Sin nada en la cámara: «Todavía no tienes nada guardado. Guarda abajo tu video, y entra solo a la
  comanda.».
- «Guardar algo nuevo», un desplegable (abierto si la cámara está vacía) con lo mismo que «Guardar
  en la cámara» de la cámara: la casilla de los derechos, «Para qué es (opcional)» y el recuadro para
  elegir o soltar archivos ([la-camara-de-frio.md](la-camara-de-frio.md)). Lo que se guarda desde acá
  queda en la cámara y entra elegido a la comanda.
- Al final, «Para renombrar o sacar algo, ve a la cámara de frío.», con el enlace a la cámara.

**Bloque «2. El riel de la comanda».** Bajo el título: «Lo que lleva esta comanda, colgado en orden.
El plato principal es el que el chef cocina.». Arriba, una barra gris: el riel. Sin nada elegido:
«Todavía no hay nada colgado: toca un material para traerlo.». Con algo, una fila por material,
colgada del riel, con su dibujo, su nombre, su tamaño y su peso, y el botón «Quitar». Debajo del
nombre, qué es en esta comanda:

- un video: cuatro botones redondeados, «Plato principal», «Para intercalar», «Otra cámara» y «La
  pantalla». El primer video que se elige es el plato principal, con el borde anaranjado; los demás
  van «Para intercalar» hasta que se cambie. Al pasar el puntero por cada uno, un globito lo explica:
  «El video que el chef cocina.»; «Un intro, un outro o b-roll: el chef lo pone donde va.»; «Otro
  ángulo del mismo momento: el chef lo sincroniza con el principal por el audio.»; «La pantalla
  grabada mientras hablas: también se sincroniza por el audio.»;
- una imagen: «Para intercalar»;
- un audio u otro archivo: «Va aparte: <su uso>» (por ejemplo, «Va aparte: música»), o sin uso «Va
  aparte, para que el chef lo use».

Con un plato principal elegido, debajo, «Qué es el plato principal», con tres opciones; viene
marcada la primera:

- «Un video largo»: «Una persona a cámara: una charla, una clase, un video editado o crudo.»
- «Un podcast en videollamada»: «Una videollamada con varias caras en mosaico.»
- «Tomas sueltas»: «Varias respuestas cortas de una persona.»

Si se quita el plato principal, pasa a serlo el siguiente video del riel.

**Bloque «3. Qué quieres que salga».**

- «Los formatos»: «Clips verticales» (viene marcado) y «Carruseles». Al menos uno.
- «Cuántos, más o menos»: «Lo que dé el material» (viene marcado), «Unos 10» o «Unos 20».
- La línea «Los estilos los elige el chef, con lo que mejor le vaya al material.».
- «Para cuándo (opcional)», un campo de fecha que abre el calendario del panel («Quitar» la borra), con la ayuda «Informativo: la hora real la estima el
  chef.».

**Bloque «4. Tu instrucción al chef».** Bajo el título: «Opcional. Lo que le dirías al chef al
pasarle el material: la duración, el tono, qué destacar o qué evitar.». Hasta el 2026-11-02 esto
era el campo «Qué destacar o qué evitar (opcional)», dentro del bloque 3.

- Un texto libre, vacío, con el ejemplo gris «Por ejemplo: «Quiero que este contenido sea formato
  bajo 30 segundos.»». El chef lo recibe tal cual.
- Debajo, a la izquierda, «El chef la lee tal cual, junto con tu material y tu marca.» y, a la
  derecha, el contador: «<N> / 1000». Desde los 900 caracteres se pone ámbar; pasado el tope, rojo.
- Pasado el tope, el recuadro se pone rojo y debajo aparece, en rojo, «Tu instrucción al chef cabe
  en 1000 caracteres: acórtala.». Se puede seguir escribiendo, pero no colgar la comanda hasta
  acortarla. Los espacios del principio y del final no cuentan.
- «Ideas para empezar: un toque las suma a lo que escribiste.», y cinco botones redondeados, cada
  uno con un «+»: «Clips de menos de 30 segundos.», «Destaca la parte de ventas.», «No uses la
  anécdota del final.», «Empieza cada clip con la pregunta, no con la respuesta.» y «Tono cercano,
  como una conversación.». Uno apretado se suma al final del texto y queda apagado; también se
  apaga si ya no cabe.

**Bloque «Tu marca».** Bajo el título: «Lo que el chef usa para vestir lo que cocina. Se guarda
para las comandas que vengan.». Viene con lo de la última comanda; la primera vez, el nombre de
la cuenta.

- «El nombre», obligatorio.
- «El @ (opcional)»: se le pone la arroba si no la tiene.
- «El color de acento (opcional)», con la ayuda «El de los titulares. Sin él, el chef usa el del
  estilo.»: un cuadrado de color que abre la ventana del color (ver «Las ventanas del panel» en
  [index.md](index.md)), el código al lado (o «el
  del estilo») y, con un color elegido, el botón «Usar el del estilo», que lo quita.
- «El llamado final (opcional)», con la ayuda «El texto del cierre: «Sígueme para más», «Agenda tu
  clase».».

**Bloque «5. Confirmar».** Lo que se va a pedir, una línea por cosa: «Plato principal: <nombre>
(<qué es>) · <minutos> min», «Lo acompañan: <nombre> (<para intercalar, otra cámara, la pantalla o su
uso>), …», «Qué sale: …», «Los estilos: los elige el chef»,
«Tu instrucción al chef: «<texto>»» (o «ninguna») y «Tu marca: …». Debajo, cuántas irían antes («Hay 2 comandas antes que la tuya.»), la «Hora
estimada» si se puede calcular, «La cocina está cerrada por ahora: tu comanda espera su turno.»
si lo está, y cuánto cupo consume: «Consume <N> minutos de tu cupo, los del plato principal. Por
ahora el cupo no tiene tope.».

Al final, el botón anaranjado «Colgar la comanda» (mientras trabaja, «Colgando…»). Mientras no se
puede, está apagado y al lado dice qué falta: «Espera a que termine de guardarse lo que sube.»,
«Elige un video de la cámara: es el plato principal.», «Elige qué quieres que salga.» o «Acorta tu
instrucción al chef.». Al colgarla, la pantalla vuelve a La Cocina y la comanda
aparece arriba de todo, «Comanda colgada».

### El mesón

`/admin/ia/meson` —de día, la bandeja—: lo que el chef entregó, listo para revisar y programar o
descartar. Se llega con «El mesón (<N>)» o con «Ver en el mesón →» de una comanda, que agrega
`?comanda=<id>` y muestra solo esa. Solo con la cocina encendida. Mientras se está acá, la pestaña
«La Cocina» queda marcada.

No es La Vitrina, que son las páginas públicas ([la-vitrina.md](la-vitrina.md)). Si la persona
dice «la vitrina» hablando de los videos que le entregó el chef, casi seguro quiere decir el mesón:
el primer día se llamó así de día, y después pasó a llamarse «La bandeja».

Arriba, el enlace «← La Cocina», el título «El mesón» (de día, «La bandeja») y el párrafo «Lo que
el chef te entregó, listo para programar. Las versiones de una misma pieza —la misma idea en
estilos distintos— van juntas. Programa las que te gusten y descarta las que no, diciendo por qué:
el chef aprende de eso. Lo que nadie programa en 30 días se borra solo.». Con una sola comanda,
debajo, «Ver todo el mesón». Si hay creativos que
se pasaron a un borrador y todavía no se programaron: «<N> esperan en tus borradores de La
Parrilla, con sus cuentas y su hora por elegir.» y el enlace «Ver los borradores».

Sin nada, «Todavía no hay nada en el mesón.» (de día, «… en la bandeja.»). Con algo, un bloque por
comanda, de la más nueva a la más vieja, con el nombre del plato principal de título y «Pedida el
<fecha>» debajo. Adentro, lo entregado por pieza: «Pieza «<pieza>» · <N> estilos» y sus versiones
una al lado de la otra (en el teléfono, de a dos). Cada creativo es una tarjeta:

- el video, que se reproduce ahí mismo, con su portada antes de darle play; o la primera lámina
  del carrusel con «<N> láminas» encima y las demás en chico debajo;
- en su última semana, en ámbar, «Se borra el <fecha> si no lo programas.»;
- «Estilo: <estilo> · <N> s» y, en etiquetas, lo que rotó: la letra, la entrada, la música;
- «Título de YouTube: …», si el chef lo escribió;
- «El texto», un desplegable con el texto que propone el chef;
- los botones «Programar» y «Descartar».

**«Programar»** (mientras trabaja, «Abriendo…») pasa el creativo a un borrador de La Parrilla y
abre el compositor con él: el texto, el título de YouTube y los archivos ya puestos. Faltan las
cuentas y la hora ([la-parrilla.md](la-parrilla.md), «El compositor»). El creativo sale del mesón
mientras espera en ese borrador. Al programarlo, el post lleva además la portada y los atributos
del creativo (con su pieza y su estilo, para que Los Números compare versiones y estilos), y en
YouTube el título va como primera línea del texto. Si el borrador se descarta, el creativo vuelve
al mesón.

**«Descartar»** abre, en la misma tarjeta, «¿Por qué no sirvió?» y cuatro botones: «El corte», «La
letra», «El tema» y «El audio». Hay que elegir uno. Debajo, una nota opcional para el chef, de hasta
500 caracteres, y los botones «Descartar» (mientras trabaja, «Descartando…») y «Volver». El
creativo sale del mesón, sus archivos se borran, y el motivo y la nota le quedan al chef.

Cuando todo lo que entregó una comanda lista se programó o se descartó, la comanda queda
«Servida».

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
  wiki), «Entrar al panel», «La Parrilla», «La Mesa», «Los Números», «La Cocina», «La cámara de
  frío», «Los Fierros», «La Vitrina», «Los Maestros», «Tu Cuenta», «El libro de sugerencias» y «La
  app del teléfono». La que se está leyendo,
  marcada.
- La página, con su título arriba. Las tablas anchas se deslizan de lado. Los enlaces a otra
  página llevan a esa página del manual; los de las guías de la API abren aparte. Sin la última
  sección de cada página, la de los archivos de donde sale, que es para quien la mantiene.

## Qué se puede hacer

### Para pedir una comanda

1. Guardar el material en la cámara de frío, si no está ([la-camara-de-frio.md](la-camara-de-frio.md)),
   o desde «Guardar algo nuevo», en el mismo formulario.
2. En La Cocina, «Pedir una comanda».
3. En «1. De la cámara de frío», tocar lo que va: por ejemplo, dos videos y cuatro fotos. Cada cosa
   se cuelga en «2. El riel de la comanda».
4. En el riel, revisar qué es cada video: el plato principal (el primero que se eligió, si no se
   cambia), para intercalar, otra cámara o la pantalla. Elegir qué es el plato principal: un video
   largo, un podcast en videollamada o tomas sueltas.
5. En «3. Qué quieres que salga», elegir los formatos y cuántos y, si se quiere, para cuándo.
6. Si se quiere, en «4. Tu instrucción al chef», escribirle lo que se le pide: la duración, el
   tono, qué destacar o qué evitar. Las ideas de abajo se suman con un toque.
7. Revisar «Tu marca».
8. Apretar «Colgar la comanda».

Lo elegido sigue en la cámara: sirve para otra comanda. Mientras algo sube desde «Guardar algo
nuevo», la página tiene que quedar abierta; un archivo de varios GB tarda lo que tarde la conexión:
un largo de 4 GB por una conexión doméstica puede ser media hora o más.

### Para retomar una subida que se cortó

Si se cerró la página, se cayó la red o el archivo quedó en rojo:

- con la página abierta, «Reintentar» en su tarjeta;
- si se cerró, volver a la cámara (o a «Guardar algo nuevo») y elegir **el mismo archivo** otra vez
  (el mismo, del mismo lugar): sigue desde la última parte que llegó, sin empezar de cero.

Lo que alcanzó a subir entero ya está en la cámara.

### Para sacar algo de la comanda, o de la cámara

De la comanda que se está pidiendo: «Quitar» en su fila del riel, o tocar otra vez su tarjeta. Sigue
en la cámara. Para borrarlo de verdad, «Sacar de la cámara», en la cámara
([la-camara-de-frio.md](la-camara-de-frio.md)).

### Para programar lo que entregó el chef

1. En La Cocina, «El mesón (<N>)», o «Ver en el mesón →» en la comanda.
2. Mirar cada versión. Las de una misma pieza están juntas.
3. En la que sirve, «Programar».
4. En el compositor que se abre, revisar el texto y el «Título de YouTube», marcar las cuentas y
   elegir la hora.
5. «Programar».

### Para descartar un creativo

1. En su tarjeta del mesón, «Descartar».
2. Elegir por qué: «El corte», «La letra», «El tema» o «El audio». Si se quiere, escribir una nota
   para el chef.
3. «Descartar».

No se deshace: los archivos se borran.

### Para seguir una comanda

En «El chef de la casa», buscar su tarjeta por el nombre del plato principal. El estado dice en
qué va, la estación y el recorrido lo muestran, y «Lo que pasó» cuenta cada paso con su hora. No
hace falta recargar: mientras la pestaña esté a la vista, la tarjeta se pone al día sola en unos
segundos. Cuando termina, llega un correo.

### Para cancelar una comanda

Solo mientras no esté en el horno: con «Comanda colgada», «El chef mira la res» o «El desposte».

1. Apretar «Cancelar la comanda» en su tarjeta.
2. Se abre una ventana con «¿Cancelar esta comanda?» y «El chef deja de prepararla. Lo que llevaba
   sigue en tu cámara de frío.» (de día, «… en tu nevera.»). Apretar «Cancelar la comanda», en la ventana («Volver» la deja como está).

La tarjeta queda «Cancelada». Lo que llevaba sigue en la cámara de frío, para otra comanda.

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
3. Se abre una ventana con «¿Revocar «<nombre>»?» y «Lo que la use deja de entrar en su próxima
   petición.». Apretar «Revocar», en la ventana.

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
| «Se actualiza sola» | Hay comandas en marcha, y las tarjetas se ponen al día sin recargar. | Nada: dejar la pestaña abierta para verlas avanzar. |
| «Tu instrucción al chef cabe en 1000 caracteres: acórtala.» | La instrucción al chef pasó el tope. | Acortarla hasta que el contador diga 1000 o menos. |
| «Acorta tu instrucción al chef.» | Al lado de «Colgar la comanda», apagado: la instrucción pasó el tope. | Acortarla en el bloque 4. |
| «¿Cancelar esta comanda?» y «El chef deja de prepararla. Lo que llevaba sigue en tu cámara de frío.» | Ventana antes de cancelar. | «Cancelar la comanda» para cancelarla; «Volver» para dejarla. |
| «Esa comanda ya está en el horno o terminó: no se puede cancelar.» | El chef la metió al horno, o terminó, entre que se cargó la página y se apretó el botón. | Recargar: la tarjeta muestra su estado de ahora. |
| «Esa comanda no existe.» | La comanda ya no está, o no es de esta cuenta. | Recargar. |
| «No se pudo terminar la subida: elige el mismo archivo otra vez para retomarla donde quedó.» | En «Guardar algo nuevo», una parte no subió después de varios intentos: la red se cortó. | «Reintentar», o volver a elegir el mismo archivo: sigue donde quedó. |
| «No hay espacio para «<archivo>»: pesa <N> y te quedan <M> libres de <cuota>. Saca algo que ya no uses, o pide más espacio.» | En «Guardar algo nuevo», ese archivo no cabe en la cámara. | Ver [la-camara-de-frio.md](la-camara-de-frio.md). Los demás mensajes de guardar están ahí. |
| «La Cocina no está encendida para tu cuenta.» | El admin la apagó mientras se pedía. | Pedírsela de nuevo al admin. |
| «Elige un video de la cámara: es el plato principal.» | Al lado de «Colgar la comanda», apagado: no hay ningún video en el riel. | Tocar un video de la cámara. |
| «Espera a que termine de guardarse lo que sube.» | Al lado de «Colgar la comanda», apagado: algo de «Guardar algo nuevo» sigue subiendo. | Esperar a que entre a la cámara. |
| «Elige el plato principal: el video que el chef va a cocinar.» | Se intentó colgar sin plato principal. | Tocar un video de la cámara. |
| «Di qué es el plato principal: un video largo, un podcast en videollamada o tomas sueltas.» | Llegó una comanda sin decir qué es el plato principal. | Recargar y elegirlo en «Qué es el plato principal». |
| «Elige qué quieres que salga: clips, carruseles o los dos.» | No quedó marcado ningún formato. | Marcar al menos uno. |
| «Ponle nombre a tu marca: es el que el chef usa en los videos.» | «El nombre» de «Tu marca» quedó vacío. | Escribirlo. |
| «El nombre de la marca, el @ y el llamado final son textos cortos: acórtalos.» | Uno de los tres es demasiado largo. | Acortarlo. |
| «Una comanda lleva hasta 20 materiales además del plato principal.» | Se eligieron demasiados. | Quitar alguno del riel. |
| «El plato principal ya no está en la cámara, o no es un video: elige otro.» | Entre que se abrió el formulario y se colgó, el video se sacó de la cámara (por ejemplo, desde otra pestaña). | Recargar «Pedir una comanda» y elegir otro. |
| «Uno de los materiales ya no está en la cámara: recarga la página y vuelve a elegir.» | Lo mismo, con otro de los elegidos. | Recargar y volver a elegir. |
| «Todavía no hay nada en el mesón.» | El chef no ha entregado nada, o todo se programó o se descartó. | Nada. |
| «Se borra el <fecha> si no lo programas.» | Ese creativo lleva más de tres semanas en el mesón: a los 30 días se borra solo. El resumen del día lo avisa también. | Programarlo o descartarlo antes de esa fecha. |
| «Ese creativo ya no está en el mesón.» | Se programó o se descartó entre que se cargó la página y se apretó el botón (por ejemplo, en otra pestaña). | Recargar el mesón. Si se programó, está en los borradores de La Parrilla. |
| «Elige por qué no sirvió: el corte, la letra, el tema o el audio.» | Se intentó descartar sin motivo. | Elegir uno de los cuatro. |
| «La nota cabe en 500 caracteres.» | La nota del descarte es demasiado larga. | Acortarla. |
| «Ponle un nombre: el del agente que la va a usar.» | El nombre de la llave quedó vacío (por ejemplo, solo con espacios). | Escribir un nombre y volver a «Generar llave». |
| «El nombre puede tener hasta 60 caracteres.» | El nombre de la llave es demasiado largo. | Acortarlo. |
| «Ya tienes 10 llaves: revoca una antes de generar otra.» | Se llegó al tope de diez llaves por persona. | Revocar alguna que no se use (las «sin usar», o las de uso más viejo) y generar de nuevo. |
| «Tu llave «<nombre>». Cópiala ahora: no se vuelve a mostrar. Si la pierdes, revócala y genera otra.» | La llave se generó. | Copiarla ahora con uno de los dos botones. |
| «Copiado» | El texto quedó en el portapapeles. | Pegarlo donde corresponda. |
| «¿Revocar «<nombre>»?» y «Lo que la use deja de entrar en su próxima petición.» | Ventana antes de revocar. | «Revocar» para revocarla; «Cancelar» para dejarla. |
| «Ponle un nombre: el del agente que la va a usar.» | Se apretó «Generar llave» con el nombre vacío. | Escribir un nombre. |
| «Todavía no tienes llaves.» | No hay ninguna llave viva. | Generar una si una IA la necesita. |

## Si el humano dice…

- **«¿Dónde está Tu IA?».** Es esta pestaña: desde el 2026-10-22 se llama «La Cocina», y lo de
  Tu IA está abajo, en «Tu propio chef». Las llaves que tenía siguen vivas, con su mismo nombre.
- **«¿Qué es el chef de la casa?».** Un editor de videos: se le lleva el material crudo y
  devuelve clips y carruseles con sus textos, para programarlos. Está en piloto y se enciende
  cuenta por cuenta.
- **«Quiero el chef de la casa» / «No me deja pedir».** Si la pantalla dice «Si quieres probarla,
  pídesela a quien administra Tu Parrilla.», su cuenta no tiene la cocina encendida: se la tiene
  que encender el admin, en Los Maestros.
- **«¿Cómo pido una comanda?».** En La Cocina, «Pedir una comanda» (ver «Para pedir una
  comanda»). Si el botón no está, su cuenta no tiene la cocina encendida.
- **«Se cortó la subida» / «Cerré la página sin querer».** Volver a la cámara de frío (o a «Guardar
  algo nuevo») y elegir el mismo archivo: sigue donde quedó. Si ya había terminado de subir, está en
  la cámara.
- **«¿Dónde subo mis videos?» / «¿Dónde está la bodega?».** En la cámara de frío (de día, la
  nevera): el botón al lado de «Pedir una comanda» ([la-camara-de-frio.md](la-camara-de-frio.md)).
- **«¿Puedo usar el mismo video en dos comandas?».** Sí: lo de la cámara sirve para todas las que
  se quiera. Tocarlo de nuevo en «Pedir una comanda».
- **«¿Qué tan grande puede ser el video?».** Hasta 20 GB; las imágenes, hasta 50 MB; y todo junto
  cabe en la cuota de la cámara, 20 GB si el admin no le dio otra.
- **«¿Qué estilos va a usar?».** Por ahora los elige el chef, con lo que mejor le vaya al
  material. Lo que se quiera destacar o evitar va en «4. Tu instrucción al chef».
- **«Quiero clips cortos» / «¿Cómo le digo al chef lo que quiero?».** En «Pedir una comanda», el
  bloque «4. Tu instrucción al chef»: escribirlo ahí, por ejemplo «Quiero que este contenido sea
  formato bajo 30 segundos.». Una comanda ya colgada no se corrige: si todavía se puede cancelar,
  cancelarla y pedirla de nuevo.
- **«¿Dónde quedó “Qué destacar o qué evitar”?».** Desde el 2026-11-02 es «4. Tu instrucción al
  chef», su propio bloque.
- **«¿Me avisan cuando esté lista?».** Sí: llega un correo cuando queda lista en el mesón, y
  también si el chef la rechaza o no la pudo terminar. Mientras tanto, la tarjeta se actualiza
  sola. Si no llegó, mirar la carpeta de spam; la tarjeta dice el estado igual.
- **«La animación no se mueve».** Con «Reducir movimiento» activado en el sistema, las estaciones
  quedan quietas a propósito. Una comanda lista, servida o terminada tampoco se mueve: no hay
  nada en marcha.
- **«¿Puedo pedir desde la app del teléfono?».** Sí, desde la versión 1.2.0: la pestaña «La
  Cocina» de la app graba un video (o saca una foto), lo guarda en la cámara de frío y lo manda al
  chef con la instrucción, en su camino corto —un video largo, clips verticales, lo que dé el
  material—. Lo demás de esta pantalla (el mesón, cancelar, el formulario completo) sigue en el
  panel. Ver [La app del teléfono](app-movil.md), «La Cocina».
- **«Algo desapareció del mesón».** Lo que nadie programa en 30 días se borra solo; en su última
  semana, la tarjeta y el resumen del día lo avisan. Lo que se pasó a un borrador no vence: está en
  los borradores de La Parrilla.
- **«¿Cuánto se guarda lo que subí?».** Lo que está en la cámara de frío no vence: se queda hasta que
  la persona lo saca. Lo entregado por el chef en el mesón, 30 días.
- **«¿Dónde está lo que me cocinó el chef?».** En el mesón: La Cocina → «El mesón (<N>)», o «Ver en
  el mesón →» en la comanda. De día se llama «La bandeja».
- **«Apreté Programar y no lo programé».** Quedó en un borrador de La Parrilla («Borradores (<N>)»),
  con todo puesto: abrirlo, marcar las cuentas y la hora, y «Programar». Si se descarta el
  borrador, el creativo vuelve al mesón.
- **«¿Por qué YouTube le puso ese título?».** Es el «Título de YouTube» del compositor, que viene
  del chef y se puede cambiar antes de programar. Vacío, YouTube usa la primera línea del texto.
- **«Descarté uno sin querer».** No se deshace: el archivo se borró. Se le puede pedir al chef en
  una comanda nueva.
- **«Me dice que hay comandas antes que la mía».** Es la fila: el chef cocina una de cada cuenta
  por vuelta. «Hora estimada» dice cuándo debería salir.
- **«¿Cuándo está lista mi comanda?».** En su tarjeta, «Hora estimada». Si no aparece, el chef
  todavía no la estimó.
- **«Dice que la cocina está cerrada».** El servidor del chef no da señales hace más de diez
  minutos. Las comandas esperan y no se pierden; la hora estimada se corre.
- **«Mi comanda dice No se puede cocinar» / «No se pudo terminar».** El motivo está en la
  tarjeta, debajo del estado. Lo que llevaba sigue en la cámara de frío.
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

- En el mesón no se comenta todavía: lo que se le dice al chef va en el motivo y la nota de un
  descarte.
- No programa solo: cada creativo se programa a mano, desde el compositor.
- No deshace un descarte.
- No elige estilos: en esta fase los elige el chef.
- No pide desde la app del teléfono: solo desde el panel.
- No avisa por correo cada paso: solo cuando la comanda termina (lista, rechazada o que no se
  pudo terminar).
- No cambia la instrucción al chef de una comanda ya colgada.
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
  línea de la cocina abierta o cerrada, el botón de la cámara de frío y las tarjetas de las comandas.
- `src/components/escena-cocina.tsx`: la escena, de noche y de día, con el fuego y el farol.
- `src/components/estacion-comanda.tsx`: la estación de cada tarjeta, de noche y de día, y lo que
  se mueve en cada estado; sus movimientos y su versión quieta están en `src/app/globals.css`.
- `src/app/admin/(dash)/ia/vigia.tsx` y `src/app/api/admin/cocina/pulso/route.ts`: «Se actualiza
  sola», cada cuánto mira y cuándo deja de mirar.
- `src/lib/cocina/correo-de-comanda.ts`: el correo cuando la comanda termina, su asunto y su texto.
- `src/app/admin/(dash)/ia/cancelar.tsx` y `src/app/admin/cocina-actions.ts`: «Cancelar la
  comanda», su pregunta y sus mensajes, y lo que hace «Colgar la comanda».
- `src/app/admin/(dash)/ia/pedir/page.tsx` y `src/app/admin/(dash)/ia/pedir/formulario.tsx`:
  «Pedir una comanda», sus seis bloques, lo que se elige de la cámara y su vuelo al riel, el riel
  con el rol de cada material, «Tu instrucción al chef» con su contador y sus ideas, y lo que falta
  para colgar.
- `src/components/dibujos-material.tsx` y `src/components/dibujos-insumo.tsx`: el dibujo de cada
  material de la cámara, por lo que es y lo que pesa, de noche y de día.
- `src/app/admin/(dash)/ia/bodega/guardar.tsx` y `src/app/admin/(dash)/ia/bodega/camara.tsx`:
  «Guardar algo nuevo», los filtros y el peso de cada material en el formulario.
- `src/lib/cocina/bodega.ts`: lo que se puede guardar, los topes, la cuota y sus frases.
- `src/lib/cocina/pedido.ts` y `src/lib/cocina/pedir.ts`: lo que se pide, el tope y las ideas de
  la instrucción al chef, sus frases, la marca que
  se guarda, lo que se congela y lo que entra en una comanda.
- `src/lib/subida-por-partes.ts`: la subida por partes, retomar y cancelar.
- `src/app/admin/(dash)/ia/meson/page.tsx`, `src/app/admin/(dash)/ia/meson/tarjeta.tsx` y
  `src/app/admin/(dash)/ia/meson/acciones.tsx`: el mesón, cada creativo, «Programar» y
  «Descartar» con sus motivos.
- `src/lib/cocina/meson.ts` y `src/lib/cocina/meson-motivos.ts`: qué se ve en el mesón, el
  borrador que abre «Programar», qué hace descartar y cuándo una comanda queda servida.
- `src/lib/cocina/barrido.ts`: lo que se borra solo, cuándo, y desde cuándo avisa la tarjeta.
- `src/lib/social/publish/crear.ts`: lo que el post se lleva del creativo al programarse.
- `src/lib/cocina/panel.ts`: qué comandas se ven, cuántas van antes, la hora estimada de la fila,
  los diez minutos sin señal y qué hace cancelar.
- `src/lib/cocina/nombres.ts` y `src/lib/cocina/tarjeta.ts`: el estado en palabras, de noche y de
  día, cuántas van antes y el tramo del recorrido.
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
