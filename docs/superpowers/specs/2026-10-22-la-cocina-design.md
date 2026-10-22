# La Cocina: la fábrica de creativos del chef, dentro de Tu Parrilla

Fecha: 2026-10-22. **Diseño. Implementado** lo de «Antes» (qué cuenta acepta trial reels) y la
fase 0 entera:

- la base: las tablas y la API del chef, cuyo contrato está en `docs/cocina-api.md`;
- la subida por partes del panel (`subidas`);
- la pestaña La Cocina, donde se pide y se sigue una comanda;
- el mesón;
- los barridos de 14 y 30 días.

Lo siguiente es la fase 1. Reemplaza y amplía «El chef de la casa»
(`2026-10-19-chef-de-la-casa-design.md`), que ya decía para qué sirve el chef y cómo se dibuja;
esto dice cómo se pide, cómo se sigue y qué se entrega, y fija el contrato entre Tu Parrilla y
el chef. Lo pidió el dueño el 2026-10-22, y los nueve puntos del líder de creación de contenido
de ese día están acá adentro, cada uno con lo que se decidió. Lo que el dueño contestó a las
preguntas que este diseño dejaba abiertas está al final, en «Decisiones del dueño».

## La idea

Cada usuario tiene su propia fábrica de creativos. Le lleva al chef el material crudo —de noche
la res entera, de día el atún—, le suma lo que acompaña —otra cámara, la pantalla, fotos— y lo
que es de su marca —letras, colores, música—, elige en qué estilos lo quiere, y unas horas
después tiene una tanda de creativos listos en Tu Parrilla, con sus textos y sus atributos, para
repartir en sus redes. Tu Parrilla es donde se encarga, se sigue y se dispone lo cocinado; el
chef es quien cocina.

El chef es el pipeline de `marca-personal` (el repositorio privado `VicentePareja/marca-personal`)
corriendo en un servidor propio, con un agente que toma las decisiones editoriales y una cola
que hace lo mecánico. No es 100 % automático, y el diseño no finge que lo es: hay estados en que
el chef pregunta, y una forma de decirle qué no gustó.

## Por qué ahora se puede

**Del lado del chef**, el 2026-10-22 quedó hecho el producto multiusuario
(`pipeline/estilos/AGENTS.md` en `marca-personal`):

- un **catálogo** de diecisiete estilos sobre seis motores, cada uno en Markdown;
- las **perillas** de cada motor declaradas en un solo lugar (nombre, valores posibles, defecto,
  si rota por clip), y en cada estilo cuáles puede ajustar una marca;
- la **cascada** motor → marca → estilo → paleta → clip, con la procedencia de cada valor;
- la **marca** y la **paleta** de cada cliente, con su memoria creativa al lado del ajuste que la
  resuelve;
- el **probador** (un clip en cada estilo de la paleta) y la **carta** en PDF;
- la **paleta que aprende** (`estilos evaluar`): compara estilos por la mediana contra su red y
  su modo, y propone pesos;
- los **clientes**, el largo de un cliente y el publicar por cliente;
- la **cola**, que hace lo pesado de a dos, con reintentos, aviso al celular y la hora estimada
  de término.

**Del lado de Tu Parrilla:**

- el almacén propio, con subida directa del navegador y `POST /api/media` (#247);
- los borradores, compartidos entre el panel y el teléfono;
- los `atributos` que viajan con cada post y se miden en Los Números;
- el aislamiento por dueño en cada consulta;
- el resumen del día y los correos;
- el modo día, con su vocabulario y sus dibujos.

Lo que falta es lo que los une: la comanda, los insumos en el almacén, el mesón de lo
entregado y el contrato con el chef.

## Las decisiones de fondo

Los nueve puntos del líder, con lo que se decidió de cada uno, y dos más que el diseño
necesita.

### 1. Un pedido, no un chat: la comanda

Cada encargo es una **comanda** con estados, asíncrona: Tu Parrilla la crea, el chef la toma y
avisa cada cambio, y entrega. Reenviarla no la duplica: lleva una `ref`, como el lote. La
expectativa que se promete es de **horas o un día**, no de minutos, y la pantalla muestra la fila
y la hora estimada de entrega. Los estados están más abajo, en «La comanda».

### 2. Insumos con tipo, no solo un dibujo

Cada archivo que se sube dice qué es, porque cada tipo entra al chef por un camino distinto: el
plato principal (un largo, un podcast en videollamada o tomas sueltas), los acompañamientos
(otra cámara o la pantalla, que hay que sincronizar; imágenes o b-roll) y los condimentos de la
marca (logo, letras, música, colores). El dibujo es la cara de ese tipo, no su reemplazo. La
tabla está en «Los insumos y sus dibujos».

### 3. Todo en el almacén de Tu Parrilla, no en Drive

El usuario sube a Tu Parrilla, el chef baja de ahí con un enlace firmado, y lo que entrega vuelve
como media al mesón del usuario, lista para programar. Drive deja de estar en el camino: hoy
es el cuello de botella (carpetas públicas por enlace, el tope de unos 100 MB del enlace
directo, la lentitud). Un largo crudo pesa varios GB, así que la subida es por partes y se puede
retomar («Subir archivos grandes»).

### 4. Lo que se personaliza sale del chef, y cada comanda congela su receta

El chef **publica su catálogo** en Tu Parrilla: los estilos, sus perillas, los valores que
aceptan, cuáles puede ajustar una marca, el texto de la carta y una muestra de cada uno. Tu
Parrilla dibuja la paleta desde ahí: no hay una lista de estilos escrita a mano en el panel que
pueda desfasarse. Cuando el chef agrega un estilo, aparece solo.

Cada comanda **congela la receta resuelta** al crearse: la marca, los estilos con sus ajustes y
sus pesos, y la versión del catálogo. Si el usuario cambia su paleta a mitad de camino, lo que ya
está en el horno no cambia.

La misma idea vale del lado del chef, y ya es la regla de su catálogo: **un cambio grande a un estilo
que un cliente aprobó se publica como un estilo nuevo** (`golpes-2`), no como una edición del que
existe. Así nadie amanece con otro look sin haberlo elegido, y lo que ya se midió de un estilo sigue
siendo de ese estilo.

### 5. Probar antes de cocinar

El probador ya existe del lado del chef. En la pantalla es el paso «Prueba tus estilos»: un clip
corto renderizado en cada estilo de la paleta, lado a lado, antes de pedir una tanda entera. Es
lo que hace barato equivocarse: un clip en vez de treinta.

### 6. El chef no es 100 % automático

Un agente elige qué partes del video sirven y escribe los titulares, el b-roll y los textos: eso
es trabajo editorial, y a veces tiene una duda. Por eso hay un estado **«El chef te pregunta»**
(por ejemplo, qué tema destacar), que espera la respuesta del usuario. Cada pregunta trae **su plazo
y la opción por defecto**, dichos en la misma pregunta: «Si no me contestas antes de las 18:00, sigo
con la parte de ventas». Pasado el plazo, el chef sigue con esa opción, y una comanda nunca queda
colgada para siempre. Y cada creativo entregado se puede **comentar** («la letra se ve chica») o
**descartar con un motivo de un toque** («el corte», «la letra», «el tema», «el audio»), además del
texto libre: le llega al chef como memoria de la marca, que hoy vive en el cuerpo de la paleta, junto
al ajuste que lo resuelve. Un motivo le sirve más que un «descartado» a secas.

### 7. Cerrar el ciclo con las métricas

Cada creativo ya lleva su estilo, su letra, su entrada y su música como `atributos`. Al
programarlo, siguen viajando con el post, y Tu Parrilla puede mostrarle al usuario **qué estilos
le rinden**. La paleta se ajusta con su aprobación: la fábrica aprende de cada cliente, no solo
produce. Es lo que nos diferencia de un editor.

### 8. Clientes separados y capacidad acotada

- **Aislamiento:** cada usuario ve solo sus comandas, sus insumos, sus marcas y sus creativos,
  como hoy ve solo sus cuentas.
- **Retención:** los insumos crudos se borran a los 14 días de servida la comanda, en Tu Parrilla
  y en el servidor del chef. **Los clips ya cortados** —lo que el chef horneó a partir del crudo, antes
  de vestirlo en cada estilo— **se guardan en el servidor del chef mientras el cliente esté activo**:
  es lo que permite pedir otros estilos con el mismo material sin volver a subir nada. Los términos lo
  dicen.
- **Derechos:** al subir, el usuario declara que tiene los derechos de lo que sube y el permiso de
  quienes aparecen.
- **Cupos por plan:** minutos de material al mes. Con un solo servidor, el cupo es lo que decide
  cuántos clientes caben, y es donde se pone el precio. Se construye desde el principio, pero parte
  sin tope: primero se ve la cocina funcionando.

### 9. Fases

Las del líder, con lo que cada una pide de cada lado, en «Fases».

### 10. Quién manda en qué

Dos sistemas que guardan lo mismo divergen. Cada dato tiene un solo dueño:

| Lo manda Tu Parrilla | Lo manda el chef |
|---|---|
| El usuario, su plan y su cupo | El catálogo: los motores, las perillas, los estilos, la carta y las muestras |
| La marca que el usuario escribe: nombre, @, colores, letras, logo, música, CTA | Cómo se produce cada estilo y lo que necesita |
| La paleta: qué estilos, con qué ajustes y con cuánto peso | La memoria interna: el cuerpo de cada estilo y lo que el agente aprendió de una marca |
| Las comandas, sus insumos, sus preguntas y sus respuestas | El trabajo: la tanda, la cola, los renders |
| Los creativos entregados, sus comentarios, su programación y sus métricas | Los estilos hechos para una sola marca, que publica en el catálogo de esa marca |

El chef sigue guardando su Markdown por marca, pero como **copia de trabajo**: lo escribe desde la
receta congelada de cada comanda y le suma su memoria interna. Tu Parrilla nunca lee ese Markdown,
y el chef nunca edita la paleta del usuario: cuando quiere cambiarla (fase 3, o porque un comentario
lo pide), **propone** el cambio y el usuario lo aprueba en el panel.

Cuando un comentario pide algo que la paleta no puede expresar («la letra más grande», y esa perilla
no existe), el chef hace un **estilo propio de esa marca** que extiende uno del catálogo, como ya hace
hoy (`datos/marcas/<m>/estilos/`), y lo publica en el catálogo de esa marca: el usuario lo ve como
«hecho para ti», y su paleta lo puede usar.

### 11. Cómo se hablan: el chef pregunta, Tu Parrilla no llama

El servidor del chef no expone ningún puerto. Es el chef el que le pregunta a Tu Parrilla, cada
cierto tiempo y con una credencial propia, si hay comandas nuevas, y el que informa cada cambio. Así
no hay que abrir el servidor a internet, un corte de luz o de red en la cocina no pierde nada (la
comanda espera), y el chef puede ser otro programa mañana sin cambiar Tu Parrilla. Lo recomendaba
ya «El chef de la casa».

El chef no usa la llave de API de cada usuario para cocinar: con la credencial de la cocina solo ve
lo que una comanda le entrega, y no puede programar, borrar ni leer nada más de nadie. Lo que
programa es el usuario, desde el mesón. Apagar la cocina en el panel es despedir al chef.

## Cómo se ve

### Dónde vive: La Cocina

Una pestaña **«La Cocina»**, con el dibujo del maestro cocinero que hoy lleva Tu IA, que
**reemplaza a Tu IA**, con dos partes:

- **«El chef de la casa»**: arriba, lo nuevo.
- **«Tu propio chef»**: abajo, para quien quiere usar su propio Claude u otro agente. Como mínimo,
  generar la llave y saber dónde están las guías de la API, que es lo de hoy. Un comando que lo
  conecte en un paso queda como idea para después, sin complicarlo ahora.

Las dos cosas son el chef, el nuestro o el tuyo, y dos pestañas con el mismo dibujo confundirían.
Cambia la navegación y la wiki.

Dentro de «El chef de la casa» hay cuatro lugares:

| Lugar | De noche | De día | Qué hay |
|---|---|---|---|
| Las comandas | «Las comandas» | «Las comandas» | Pedir una nueva y seguir las que van: su estado dibujado, la hora estimada, las preguntas del chef |
| Lo entregado | **«El mesón»** | **«La bandeja»** | Los creativos listos, por comanda y por estilo: revisar, comentar, descartar, programar |
| La marca | «Tu marca» | «Tu marca» | Los condimentos: nombre, @, colores, letras, logo, música, CTA |
| Los estilos | «Tu paleta» | «Tu paleta» | Los estilos que usa tu marca, sus ajustes y sus pesos, y el probador |

El porqué del nombre de lo entregado: en una parrilla, los cortes esperan en el **mesón** antes de
ir al fuego; en una barra de sushi, las piezas salen en la **bandeja**. Lo que está ahí todavía
no está programado: cuando se programa, pasa a La Parrilla (de día, La Barra), como cualquier post.
Las dos palabras van a `PALABRAS_DE_DIA` y a la wiki.

De día se pensó primero en «La vitrina», donde se exhibe el pescado, pero ese nombre ya es de las
páginas públicas (`/admin/profiles`), en los dos modos. El dueño eligió «La bandeja» el 2026-10-22,
como la bandeja de sushi que se pide en Chile.

### Tu marca: los condimentos

Lo que se escribe una vez y vale para todas las comandas:

- el nombre y el @;
- los colores: el acento y el del texto encima, con vista previa del titular;
- las letras del titular y del texto (archivos `.ttf` u `.otf`, con la casilla «Tengo la licencia
  para usarlas en video»);
- el logo;
- la música: la del catálogo del chef, ninguna, o la propia, con la casilla de derechos;
- el CTA: su texto y su estilo.

Cada uno se dibuja como un condimento (ver «Los insumos y sus dibujos»). Una marca sin letras ni
colores propios usa los de un estilo del catálogo, y la pantalla lo dice: «Sin tus letras, el chef
usa las del estilo».

Un usuario tiene una marca al principio. Varias marcas por usuario, la agencia que encarga para sus
clientes, es una fase posterior: el modelo de datos ya la soporta (cada comanda nombra su marca).

### Tu paleta: los estilos

La paleta es **el catálogo del chef visto desde una marca**:

- **Los estilos:** cada uno es una tarjeta con su nombre, la frase de la carta y su muestra en
  video (la del chef, o la del probador con tu marca si ya la hiciste). Se agrega a la paleta o se
  saca.
- **El peso:** el de cada estilo dice cuánto sale de él en cada tanda.
- **Los ajustes:** las perillas que el estilo declara ajustables aparecen como elección. La
  pantalla la genera del catálogo: el nombre de la perilla, su descripción y sus valores. Elegir un
  valor lo fija para esa marca. Elegir varios hace un pozo, que rota por clip y se mide.
- **«Hecho para ti»:** arriba, los estilos que el chef hizo solo para esta marca.

**El probador**, «Prueba tus estilos»:

1. Se elige un clip de 15 a 60 segundos, subido aparte o marcado dentro de un largo ya subido.
2. Se pide una comanda de prueba: el chef renderiza ese clip en cada estilo de la paleta, con tu
   marca.
3. Los resultados vuelven lado a lado. Cada uno se aprueba, se comenta o se saca de la paleta.

La carta, la misma del chef, se descarga en PDF. Las dos primeras pruebas son gratis por ahora: el
modelo de negocio se decide después.

### La comanda nueva

Cuatro pasos, en una página:

1. **El plato principal.** Arrastrar o elegir el archivo. Se elige qué es: «Un video largo»,
   «Un podcast en videollamada» o «Tomas sueltas» (varias, de una persona respondiendo
   preguntas). La subida va con su dibujo: la res que se cuelga del gancho de noche, el atún que se
   pone sobre la tabla de día (`El chef de la casa`, «Cómo se ve»), y con la barra de cuánto subió.
   El navegador revisa al tiro la duración, el tamaño y el tipo («Validar al subir»). La casilla
   «Tengo los derechos de este material y el permiso de quienes aparecen» es obligatoria.
2. **Los acompañamientos**, opcionales: «Otra cámara» o «La pantalla» (se sincronizan con el
   principal por el audio, como el chef ya hace con la DJI y OBS) e «Imágenes o b-roll» (fotos o
   clips sin voz que el chef puede intercalar).
3. **Qué quieres que salga:**
   - **los formatos**, los que el chef ofrece hoy según su catálogo: clips verticales y carruseles;
   - **cuántos, más o menos**: «Lo que dé el material», «Unos 10» o «Unos 20»;
   - **los estilos**: por defecto los de tu paleta con sus pesos, o «Que elija el chef»;
   - **qué destacar o qué evitar**, en texto libre: «la parte de ventas», «no uses la anécdota del
     final»;
   - **para cuándo** lo quieres, que es informativo: la hora real la estima el chef.
4. **Confirmar.** Se muestra la receta que se va a congelar, cuánto cupo consume (los minutos del
   plato principal), lo que te queda este mes, la fila de hoy y la hora estimada de entrega, por
   ejemplo «Hay 2 comandas antes que la tuya: lista mañana cerca de las 14:00». Al confirmar, la
   comanda queda «Recibida».

Una comanda se puede **cancelar** mientras no esté en el horno, y devuelve el cupo.

Hay tres tipos de comanda:

| Tipo | Qué es | Cuánto horno |
|---|---|---|
| `tanda` | la de arriba: material nuevo, cocinado en los estilos de la paleta | horas: un largo son unas cinco tandas |
| `prueba` | un clip en cada estilo, para elegir (ver «Tu paleta») | minutos: unos diez. **Se salta la fila**: no espera detrás de un largo de cuatro horas |
| `reestilo` | **«Otros estilos con el mismo material»**: sobre una comanda ya servida, sin subir nada | lo del horno, sin la parte editorial: los clips ya están cortados |

El `reestilo` es la comanda más barata y la que más vende la paleta: con los clips que el chef ya
cortó, salen las mismas ideas en estilos nuevos. Se pide desde una comanda servida («Pedir otros
estilos»), eligiendo los estilos que no tuvo. Lo hizo el chef a mano el 2026-10-22: unos 190 reels en
estilos nuevos a partir de diez largos, sin tocar el material crudo.

### La fila de comandas

Una tarjeta por comanda, la más reciente arriba. Cada una muestra:

- **la pieza dibujada en su estado:** la res con las líneas punteadas por donde se va a cortar, los
  cortes que se desprenden a medida que salen del horno;
- **el estado en palabras**, con su variante de noche y de día;
- **la hora estimada**, y cuántas hay antes en la fila;
- **la línea de tiempo** de lo que pasó, con la hora de cada cambio.

Cuando el chef pregunta, la tarjeta se pone de color y trae la pregunta con su campo de respuesta (o
sus opciones), y la pestaña lleva un aviso, como «Se quemó». Responder la devuelve al chef.

### El mesón (de día, la bandeja)

Lo entregado, por comanda y dentro de ella **por pieza**: varios creativos son la misma idea en
estilos distintos (el clip 08 en golpes, en cinética y en pantalla animada), y se ven juntos, uno al
lado del otro. La `pieza` viaja como atributo, igual que hoy en Los Números, donde las versiones de una
pieza ya se comparan lado a lado. Cada creativo trae:

- el video o las láminas, que se reproducen o se pasan ahí mismo;
- la portada;
- **los textos**, que se pueden corregir antes de programar:
  - el texto que propone el chef;
  - aparte, **el título de YouTube**, de hasta 100 caracteres, como ya lo escribe el chef: en YouTube
    la primera línea es el título;
- el estilo y lo que rotó: la letra, la entrada, la música;
- y tres acciones, «Programar», «Comentar» y «Descartar».

Lo entregado llega **por tanda, no al final**: el chef sube cada tanda apenas sale del horno, y la
comanda dice «Sirviendo: 3 de 5 tandas en el mesón». Se revisa y se programa lo que ya está, sin
esperar el resto.

- **«Programar»** abre el compositor de siempre con todo puesto: la media, la portada, el texto, los
  `atributos` y, si eliges YouTube, su título como primera línea del texto de ese destino (el texto
  por destino que el publicador ya respeta, `captionOverride`). Faltan las cuentas y la hora.
- **«Servir todo como propone el chef»**, en la fase 2, programa la comanda entera con el plan que
  el chef sugiere: qué cuentas, qué días, cuántos trial reels. Usa el planificador que el chef ya
  tiene, con sus reglas:
  - una idea no se repite el mismo día en una cuenta;
  - la variante sale después de su base;
  - cada video va una vez por red;
  - se respetan los topes de cada red;
  - no se propone un trial reel a una cuenta que no los acepta (ver abajo).

  Antes de confirmar se ve el calendario que quedaría.
- **«Comentar»** deja una nota sobre ese creativo, que le llega al chef como memoria de la marca.
  Cuando el chef la lee, la nota lo dice («El chef lo leyó»), y si la resolvió con un ajuste o con un
  estilo propio, también lo dice.
- **«Descartar»** lo saca del mesón y le dice al chef que ese no sirvió, que también es dato. Pide
  un motivo de un toque —«El corte», «La letra», «El tema», «El audio»— y, si se quiere, una nota.

**Qué cuenta acepta trial reels.** Meta los rechaza en una cuenta con pocos seguidores (subcódigo
2207081, el de #250), y eso no cambia de un día para otro. Tu Parrilla guarda, por cuenta de
Instagram, si acepta trial reels —sí, no o todavía no se sabe— y el motivo real, aprendido de lo que
contestó Meta al publicar. Lo muestran Los Fierros y `GET /api/schedule/cuentas`, el compositor avisa
antes de programar un trial reel donde no va a salir, y «Servir todo» no lo propone. Sirve también
fuera de la cocina, así que se hace aparte y antes.

Un creativo que pasa 30 días sin programar se borra, con aviso una semana antes: un video pesa, y
el mesón no es un archivo. Lo programado sigue la regla de siempre: el video se borra del almacén
cuando salió en todas sus redes.

### Desde el teléfono

Lo mínimo útil en la app:

- ver la fila y responder las preguntas;
- programar desde el mesón;
- avisos cuando una comanda está lista o el chef pregunta.

Subir el plato principal desde el teléfono, que es donde muchas veces está grabado, pide subida por
partes en segundo plano. Es nativo (un build nuevo, no una actualización por aire), y entra en una
fase posterior. Mientras tanto, el teléfono sube acompañamientos e imágenes de hasta 500 MB, como hoy.

### Avisos

Llega un correo cuando el chef pregunta, cuando la comanda está lista, cuando se rechaza o falla, y
cuando un creativo del mesón está por borrarse. El resumen del día suma una línea si hay preguntas
sin responder o creativos sin programar.

## Los insumos y sus dibujos

El tipo dice por qué camino entra al chef. El dibujo es su cara en la pantalla, en la misma
gramática de los cortes (`src/components/corte.tsx` y el diseño del modo día).

| Tipo | Qué es | Cómo lo usa el chef | De noche | De día |
|---|---|---|---|---|
| Plato principal · un largo | un video editado o crudo, una persona a cámara | lo transcribe, elige los clips, los arma en cada estilo | **la res**: media res colgada del gancho, con las líneas por donde se corta | **el atún**: entero, sobre la tabla |
| Plato principal · podcast | una videollamada con varias caras en mosaico | el que habla va grande y los otros como reacción (`preparar_podcast`) | la res, con más de un gancho | el atún, con más de un corte marcado |
| Plato principal · tomas sueltas | varias respuestas cortas de una persona | pregunta y respuesta, una pieza por toma | **los cortes crudos** sobre la tabla de picar | **los filetes** sobre la tabla |
| Acompañamiento · otra cámara o la pantalla | otro ángulo, o la pantalla grabada | lo sincroniza con el principal por el audio; la pizarra a pantalla completa | **el cerdo**: un costillar, más chico que la res | **el salmón**: entero, más chico que el atún |
| Acompañamiento · imágenes o b-roll | fotos, clips sin voz | los intercala sobre la voz; las fotos de un evento con voz en off | **las verduras**: choclo y pimentón | **el arroz**: un bol |
| Condimento · letras | `.ttf` u `.otf` | los titulares y el texto | **la sal**: el salero | **la soya**: la botellita |
| Condimento · colores, logo, CTA | lo que identifica a la marca | el acento, el @, el llamado final | **el chimichurri** | **el wasabi** |
| Condimento · música | una pista propia, o ninguna | la cama bajo la voz | **la piscola**, o la botella de pisco | **el té** |

El dueño propuso pollo, cerdo y sal de noche, y arroz, nigiri y soya de día, y dejó el resto a
criterio del diseño. Quedó cerdo para lo que acompaña a la res, porque es otra carne que va a la
misma parrilla. La sal y la soya son lo que sazona: la marca. El arroz es el acompañamiento del
sushi. La música, de noche, es la piscola o la botella de pisco, como la pidió el dueño. El nigiri no entra porque ya es lo cocinado: un video entregado se dibuja como nigiri (de
noche, como entraña), y confundirlo con un insumo rompería la lectura.

## La comanda

### Los estados

| Estado | Qué pasa | De noche | De día | Quién lo mueve |
|---|---|---|---|---|
| `recibida` | creada en Tu Parrilla, espera que el chef la tome | «Comanda colgada» | «Comanda colgada» | el usuario |
| `revisando` | el chef bajó los insumos y los revisa: duración, idioma, persona a cámara. Son minutos | «El chef mira la res» | «El chef mira el atún» | el chef |
| `en_preparacion` | el agente elige los cortes, escribe titulares y textos. Son horas | «El desposte» | «El despiece» | el chef |
| `probando` | opcional: un clip en cada estilo, para elegir antes de cocinar todo. Espera la elección | «La degustación» | «La degustación» | el chef → el usuario |
| `pregunta` | el chef necesita una respuesta. Espera; responder la devuelve al estado de antes | «El chef te pregunta» | «El chef te pregunta» | el chef → el usuario |
| `en_el_horno` | render y armado, en la cola del chef. Son horas | «Al fuego» | «Armando las piezas» | el chef |
| `sirviendo` | algunas tandas ya están en el mesón y otras siguen en el horno | «Sirviendo: 3 de 5 tandas en el mesón» | «Sirviendo: 3 de 5 tandas en la bandeja» | el chef, al subir cada tanda |
| `lista` | todas las tandas están en el mesón, por revisar | «Listo: N cortes en el mesón» | «Listo: N piezas en la bandeja» | el chef |
| `servida` | cerrada: el usuario programó o descartó lo que quiso | «Servida» | «Servida» | el usuario, o sola a los 30 días, cuando vence lo que quedó en el mesón |
| `rechazada` | fuera de alcance, con el motivo, al revisar. No consume cupo | «No se puede cocinar» | «No se puede preparar» | el chef |
| `cancelada` | la canceló el usuario antes del horno. Devuelve el cupo | «Cancelada» | «Cancelada» | el usuario |
| `fallida` | algo se rompió y no se pudo terminar, con el motivo. Devuelve el cupo | «No se pudo terminar» | «No se pudo terminar» | el chef |

```
recibida → revisando → en_preparacion → (probando) → en_el_horno → sirviendo → lista → servida
              ↓              ↕                ↕            ↓           ↓
          rechazada       pregunta         pregunta      fallida     fallida
recibida, revisando, en_preparacion, probando, pregunta → cancelada (por el usuario)
```

«Se quemó» y «La Barra» ya tienen dueño —los posts que fallaron y el calendario de día—, así que
ninguna comanda las usa: una comanda que falla «no se pudo terminar», y la que espera está «colgada»,
como el papel de una comanda en la cocina.

Tu Parrilla valida cada transición: el chef no puede saltar de `recibida` a `lista`, ni mover una
comanda cancelada. Cada cambio queda en una línea de tiempo (`comanda_eventos`) con la hora, el
mensaje del chef y la hora estimada de ese momento, y es lo que dispara los avisos.

### La hora estimada

La da el chef, que sabe cuánto tarda cada paso: la cola guarda la duración de cada uno
(`historial.jsonl`). Al tomar la comanda estima, y la corrige en cada cambio. Tu Parrilla muestra la
última, y antes de que la tome usa la que el chef informó en su último latido: cuántas comandas hay
antes y cuánto tarda una, en promedio.

La cuenta de hoy:

- un largo da unas cinco tandas;
- cada tanda tarda unas 1,5 horas en renderizar;
- el servidor hace dos a la vez.

Son unas 4 horas de horno por largo, más el trabajo editorial y la bajada. Por eso se promete el día
siguiente, y no la tarde.

## Lo que se guarda

Tablas nuevas en Tu Parrilla, todas atadas al dueño (la regla del arnés de aislamiento,
`src/lib/aislamiento.test.ts`). Toda columna que guarde una URL del almacén entra en la lista del
barrido de huérfanos (`storage-gc.ts`). Si no entra, el barrido la borra a la hora.

| Tabla | Qué guarda |
|---|---|
| `marcas` | `owner_id`, nombre, @, colores, CTA, y las URLs de las letras, el logo y la música. Su `id` es el que el chef usa para su copia de trabajo |
| `paletas` | por marca: `estilo`, `peso`, `ajustes` (JSON, validado contra el catálogo) |
| `catalogo_chef` | la última versión que publicó el chef: el JSON entero, su versión y cuándo llegó. Uno global, y uno por marca para los estilos «hechos para ti» |
| `comandas` | `owner_id`, `marca_id`, `ref` (única por dueño), `estado`, `tipo` (`tanda` o `prueba`), el pedido (formatos, cantidad, estilos, notas, para cuándo), la `receta` congelada, `minutos` (lo que consume del cupo), `eta`, `tomada_en`, `lista_en`, `servida_en` y el motivo si se rechazó o falló |
| `comanda_eventos` | la línea de tiempo: estado, mensaje, `eta`, hora |
| `insumos` | `owner_id`, `comanda_id`, tipo, nombre, URL, bytes, duración, tipo de archivo, la validación (estado y motivos), cuándo se declararon los derechos y `expira_en` |
| `subidas` | las subidas por partes en curso: el id de la subida en el almacén, la clave y las partes que ya llegaron, para retomar |
| `preguntas` | `comanda_id`, el texto, las opciones si las hay, **el plazo y la opción por defecto**, la respuesta, cuándo se respondió y si fue por plazo |
| `creativos` | `owner_id`, `marca_id`, `comanda_id`, **la `pieza` y la tanda**, tipo (video, carrusel, imagen), la portada, **los textos (el propuesto y el título de YouTube)**, el estilo y los `atributos`, la duración, `estado` (en el mesón, programado, descartado), **el motivo del descarte y su nota**, el `post_id` cuando se programa y `expira_en` |
| `creativo_media` | los archivos de cada creativo en su orden: el video, o las láminas de un carrusel |
| `comentarios` | `creativo_id`, el texto, cuándo lo leyó el chef y qué hizo con él |

En `comandas` van además el `tipo` (`tanda`, `prueba` o `reestilo`), la comanda de origen de un
`reestilo` y las tandas, servidas y en total, que dibujan el «3 de 5». En las cuentas de Instagram
(`social_accounts`), si aceptan trial reels y por qué.

El plan y el cupo van en el usuario al principio: si tiene la cocina, cuántos minutos al mes y desde
cuándo. El cobro, a mano. Lo consumido se calcula sumando los `minutos` de sus comandas del mes que
no se rechazaron, cancelaron ni fallaron.

**La retención.** Un barrido diario, como el de huérfanos, borra los insumos cuya `expira_en` pasó:
14 días después de servida la comanda, o de rechazada, cancelada o fallida. El chef borra su copia
local con la misma regla, y lo dice al servir. Los creativos que nadie programó se borran a su
`expira_en`, a los 30 días, con aviso una semana antes.

## Cómo hablan el chef y Tu Parrilla

### La credencial de la cocina

Una variable de entorno nueva, `COCINA_SECRET`, que solo conocen Tu Parrilla y el servidor del chef.
Se compara en tiempo constante, como `CRON_SECRET`, y se rota cambiándola en los dos lados. Abre solo
las rutas de `/api/cocina/…`:

- solo ve las comandas de usuarios que tienen la cocina encendida;
- no lee posts, cuentas ni métricas;
- no programa ni borra nada.

Los archivos se mueven con enlaces firmados que vencen en una hora y nombran un solo objeto.

El contrato de lo que ya existe, con cada respuesta y cada frase de error, está en
`docs/cocina-api.md`, y se completa con cada fase.

### Las operaciones

| Operación | Qué hace |
|---|---|
| `POST /api/cocina/latido` | el chef dice que está vivo: cuántos trabajos tiene, cuánto tarda una comanda en promedio, su versión. Tu Parrilla muestra «La cocina está abierta» o «La cocina está cerrada por ahora: tu comanda espera su turno» si pasan diez minutos sin latido |
| `PUT /api/cocina/catalogo` | publica el catálogo: el global, o el de una marca. Las muestras se suben antes, con enlaces firmados |
| `GET /api/cocina/comandas?estado=recibida` | las comandas que esperan, con su receta y sus insumos (sin enlaces). **Las pruebas primero**, y después la más vieja; nunca dos seguidas del mismo usuario si otro espera |
| `POST /api/cocina/comandas/{id}/tomar` | la toma. Si ya es suya no hace nada, y si es de otro trabajador devuelve `409` |
| `GET /api/cocina/insumos/{id}/enlace` | un enlace firmado para bajar ese insumo, si es de una comanda tomada |
| `POST /api/cocina/insumos/{id}/validacion` | el resultado de la revisión rápida: si sirve y, si no, por qué, en palabras para el usuario |
| `POST /api/cocina/comandas/{id}/estado` | un cambio de estado, con su mensaje, su hora estimada y, al servir, las tandas («3 de 5»). Tu Parrilla valida que la transición exista |
| `POST /api/cocina/comandas/{id}/preguntas` | una pregunta, con opciones si las tiene, **su plazo y la opción por defecto**. Pasa la comanda a `pregunta` |
| `GET /api/cocina/comandas/{id}/respuestas` | las respuestas que llegaron. Una pregunta con el plazo vencido vuelve respondida con su opción por defecto, y lo dice (`porPlazo: true`) |
| `POST /api/cocina/comandas/{id}/creativos` | anuncia un creativo: sus archivos (nombre, tipo, bytes), **su `pieza` y su tanda**, sus textos (el propuesto y el título de YouTube), su estilo y sus `atributos`. Devuelve un enlace firmado por archivo, en la carpeta del dueño. Su `ref` evita duplicarlo si se reenvía |
| `POST /api/cocina/creativos/{id}/listo` | lo cierra después de subir. Tu Parrilla mira que cada archivo exista y pese lo que se dijo (`objetoEnAlmacen`, el mismo de `POST /api/media`) y recién ahí lo muestra en el mesón |
| `GET /api/cocina/comentarios?desde=…` | los comentarios nuevos sobre creativos de usuarios con la cocina encendida, y los descartes con su motivo |
| `POST /api/cocina/comentarios/{id}/leido` | lo marca leído, con lo que hizo el chef: «subí el tamaño de la letra en tu paleta» |
| `POST /api/cocina/marcas/{id}/propuesta` | fase 3: propone un cambio de paleta (pesos, ajustes), con el porqué y los números. El usuario lo aprueba o no en el panel |

El chef pregunta cada minuto por comandas nuevas y respuestas. Una comanda en `pregunta` o
`probando` no consume horno: el chef sigue con otra mientras espera.

### Lo que el usuario hace por API

Al principio, nada nuevo: la cocina se usa desde el panel. Más adelante, una llave de Tu IA podrá
crear comandas y leer el mesón, para que el chef propio de un usuario, o una agencia, encargue al
chef de la casa. Va en las guías de la API cuando exista.

## Lo que cambia en el chef

Va en `marca-personal`, y su plan lo escribe el equipo de contenido. Lo que este diseño necesita de
ese lado:

- **Un módulo `pipeline/cocina`:**
  - el cliente de esta API: tomar, bajar, informar, preguntar, entregar **por tanda**, con la `pieza`,
    los textos y el título de YouTube de cada creativo;
  - un servicio de `systemd` que pregunta cada minuto y late;
  - en la fase 0, una herramienta de línea de comandos para que el operador mueva las comandas a mano.
- **`estilos exportar`:** el catálogo como JSON, con:
  - los motores y sus perillas: nombre, descripción, valores, defecto, si rota;
  - de cada estilo, el nombre, el resumen, la carta, el formato, lo ajustable y lo que rota;
  - una muestra.

  Lo publica al cambiar.
- **La receta desde la comanda.** El chef escribe la copia de trabajo de la marca (`datos/marcas/<id>/`)
  desde la receta congelada, y la tanda nace con su `ref` de comanda. El cuerpo de la paleta sigue
  siendo suyo: ahí escribe la memoria que saca de los comentarios.
- **Bajar de Tu Parrilla.** `clientes.largo` ya sabe bajar de YouTube, de Drive y del disco. Suma «un
  enlace firmado de Tu Parrilla».
- **La revisión rápida**, antes de encolar nada pesado:
  - la duración y las pistas, con `ffprobe`;
  - el idioma, con Whisper sobre el primer minuto;
  - cuántas caras hay, con YuNet (`comun/caras`).

  Lo que no se puede, se dice ahí, en el estado `rechazada` y con palabras para el usuario.
- **Entregar a Tu Parrilla y no a Drive.** `cortos.upload` y el subir de carruseles suman el destino
  «comanda», con el texto (`captions.json`), el estilo y lo que rotó como `atributos`. Lo de Drive
  queda para el respaldo propio.
- **Guardar los clips ya cortados** de cada cliente mientras esté activo, para el `reestilo`; el
  crudo, solo 14 días.
- **Avisar los estados desde la cola.** Cuando un trabajo de una tanda de comanda empieza, termina o
  falla, la cola lo informa a Tu Parrilla, además de al celular.

## Subir archivos grandes

Un largo crudo pesa de 2 a 20 GB. La subida directa de hoy es un solo `PUT` firmado, y el almacén lo
acepta hasta 5 GB. Para el plato principal la subida es **por partes**, con la API de subida por
partes del almacén, compatible con S3:

1. Tu Parrilla abre la subida y guarda su id en `subidas`.
2. Firma un enlace por cada parte, de 64 MB.
3. El navegador sube las partes directo al almacén, varias a la vez.
4. Tu Parrilla cierra la subida con la lista de partes.

Si se corta, se retoma desde la última parte que llegó: el navegador recuerda la subida, y Tu Parrilla
sabe qué partes tiene. Lo que pide el almacén es que su CORS deje leer la cabecera `ETag`. Ninguna
parte cruza las funciones de Vercel.

El tope por archivo lo pone el plan (recomendado: 20 GB). Una subida abierta y abandonada se aborta a
las 24 horas, y sus partes se borran.

## Validar al subir

Validar cuesta menos que dos horas de render que no sirven. Por eso se valida tres veces, de lo más
barato a lo más caro:

1. **En el navegador, al elegir el archivo:** el tipo, el tamaño, la duración y las dimensiones,
   leídos de los metadatos sin subir nada. Si el plan pide entre 5 y 120 minutos y el video dura 3,
   se dice al tiro. Si el navegador no puede leer el video (algunos HEVC), se sube igual y lo decide
   el chef.
2. **En el formulario:** solo se ofrece lo que el chef declara en su catálogo, que es lo de su
   `docs/servicio.md`. Lo que no se ofrece no se puede pedir: un video en inglés, un horizontal, un
   spot sin voz.
3. **La revisión rápida del chef**, en minutos y antes del horno: el idioma, cuántas personas, si hay
   voz. Si no sirve, la comanda queda `rechazada` con el motivo en palabras («El video está en inglés:
   por ahora el chef trabaja en español») y no consume cupo.

## Capacidad, cupos y tiempos

Hoy el servidor hace dos trabajos pesados a la vez. Con unas 4 horas de horno por largo, y el trabajo
editorial en paralelo, caben del orden de tres o cuatro largos al día si no para. Eso es lo que se
reparte entre todos los clientes, y es lo que el cupo protege:

- **El cupo, en minutos del plato principal al mes**, porque es lo que hace crecer el trabajo: más
  material da más clips, más tandas y más horno. Se descuenta al confirmar, y se devuelve si la
  comanda se rechaza, se cancela o falla. Al principio no tiene tope: la cuenta se lleva y se
  muestra, pero no frena nada, hasta que se decida el número.
- **Una fila pareja:** el chef no toma dos comandas del mismo usuario mientras haya otro esperando.
  Un cliente con diez comandas no tapa a los demás.
- **Las pruebas se saltan la fila:** son unos diez minutos de horno, y no esperan detrás de un largo de
  cuatro horas. El chef las toma primero.
- **Lo que se mide por comanda**, para poner el precio con datos (el piloto ya anota esto a mano):
  - las horas de cada estado;
  - los minutos de horno;
  - los tokens del agente;
  - lo que pesó en el almacén.

## Seguridad, derechos y lo legal

- Cada tabla atada al dueño, y las rutas nuevas en el arnés de aislamiento.
- La credencial de la cocina, en tiempo constante, con enlaces firmados por objeto.
- La casilla de derechos, guardada con su hora, en cada insumo y en cada condimento: letras,
  música, logo.
- `/privacidad` y `/terminos` dicen que el material se procesa en un servidor propio y con la API de
  Anthropic, qué se guarda y por cuánto tiempo: el crudo, 14 días; los clips ya cortados, mientras el
  cliente esté activo. Ya está pendiente que los revise un abogado
  **[dueño]**.
- Si el chef genera algo sintético, como voz en off o imágenes, TikTok y YouTube piden declararlo. Hoy
  la música se compone en el servidor y la voz es la de la persona; si eso cambia, se revisa antes de
  ofrecerlo.
- Vercel Pro antes de cobrar: el plan Hobby es de uso personal (ya en `docs/pendientes.md`).

## Fases

Las del líder, con lo que cada una pide de cada lado.

| Fase | Para qué | En Tu Parrilla | En el chef |
|---|---|---|---|
| **Antes** | que «Servir todo» y el compositor sepan dónde no sale un trial reel | qué cuenta acepta trial reels, aprendido de Meta, en Los Fierros, en `GET /api/schedule/cuentas` y en el compositor | nada |
| **0. La comanda a mano** | validar la demanda sin construirlo todo | La Cocina con «Las comandas»: el formulario (el plato principal por partes, las notas, la marca básica), la fila con sus estados y su «Sirviendo: 3 de 5», el mesón por pieza con los dos textos, «Programar» y «Descartar» con motivo, la credencial de la cocina con lo mínimo (tomar, enlace del insumo, estado, entregar por tanda) | el dueño, que hoy pilota con un cliente, mueve las comandas con la línea de comandos: baja los insumos a una tanda, cocina como hoy, entrega al mesón. Nada automático todavía |
| **1. La prueba** | elegir estilos con un clip y no con una tanda | «Prueba tus estilos»: la comanda de tipo `prueba`, que se salta la fila, los resultados lado a lado, la carta en PDF; el `reestilo` («Otros estilos con el mismo material»); las preguntas del chef con su plazo y su opción por defecto | el probador recibe la comanda de prueba; la carta sale del catálogo; el `reestilo` sale de los clips ya cortados |
| **2. La paleta sola** | que el usuario arme su fábrica sin hablar con nadie | el catálogo publicado, «Tu paleta» generada de él, «Tu marca» completa, la receta congelada, los comentarios, «Servir todo como propone el chef» | `estilos exportar`, el servicio que pregunta y late, la revisión rápida automática, la memoria desde los comentarios, el plan sugerido de cada comanda |
| **3. La fábrica que aprende** | que la paleta se ajuste con lo que rinde | «Tus estilos» en Los Números (cada estilo contra la mediana de su red y su modo), las propuestas del chef para aprobar | `estilos evaluar` lee lo que necesita por la API y propone por `marcas/{id}/propuesta` |
| Después | | varias marcas por usuario, comandas por API, el plato principal desde el teléfono (build nativo), el cobro | más servidores, o uno con GPU |

Cada fase deja la documentación al día al terminar (`AGENTS.md`):

- las guías de la API;
- la wiki de la UI, con una página nueva para La Cocina;
- el README, con las URLs, las variables, el árbol y la sección de aislamiento.

## Riesgos

- **Una sola cocina, en una casa.** Un corte de luz o de internet para todo. La comanda espera sin
  perderse y la pantalla lo dice («La cocina está cerrada por ahora»), pero la hora estimada se
  corre. Se mide con el latido.
- **El trabajo editorial no escala igual que el horno.** En la fase 0 lo hace una persona con el agente.
  Pasar a un agente que corre solo es la apuesta de la fase 2, y las preguntas al usuario son su red de
  seguridad.
- **Subidas grandes desde redes malas.** Por eso la subida por partes se retoma.
- **El costo del almacén.** El material crudo pesa GB. La retención lo acota y se mide por comanda.
- **Que la pantalla prometa lo que el chef no hace.** Por eso el formulario sale del catálogo, y la
  revisión rápida rechaza antes del horno.

## Decisiones del dueño

Las contestó el 2026-10-22, sobre las ocho preguntas que este diseño dejaba abiertas:

1. **La Cocina reemplaza a Tu IA**, y adentro sigue «Tu propio chef» para quien quiere usar su propio
   Claude: como mínimo, generar la llave y saber dónde están las guías. Un comando que lo conecte en
   un paso queda como idea, sin complicarlo ahora.
2. **Los nombres, aprobados:** La Cocina, Las comandas, El mesón de noche y, de día, La bandeja,
   y los insumos de la tabla, con la piscola en vez del vino. Primero se aprobó «La vitrina» de
   día; ese mismo día se cambió por «La bandeja», porque La Vitrina ya son las páginas públicas.
3. **El cupo se construye, pero parte sin tope:** primero ver la cocina funcionando. El número, y el
   precio, después.
4. **Los insumos se guardan 14 días** después de servida la comanda. Lo que nadie programó en el
   mesón, 30 días, como proponía el diseño, hasta que se diga otra cosa.
5. **Las dos primeras pruebas de estilos son gratis** por ahora. El modelo de negocio se decide
   después.
6. **La fase 0 la opera el dueño**, que hoy pilota con un cliente.
7. **Una marca por usuario.** El modelo ya permite varias, para cuando una agencia lo pida.
8. **Nada se programa solo.** «Servir todo como propone el chef» es un botón que el usuario aprieta,
   después de ver el calendario que quedaría.

## El feedback del equipo de contenido

Lo mandó el 2026-10-22, después de leer este diseño. Entraron los nueve puntos:

| Punto | Dónde quedó |
|---|---|
| 1. Entregar por tanda, no al final | el estado `sirviendo` («3 de 5 tandas en el mesón») y la entrega por tanda en la API |
| 2. Pedir más sobre lo ya cocinado | la comanda `reestilo` («Otros estilos con el mismo material»), y la retención: el crudo 14 días, los clips ya cortados mientras el cliente esté activo |
| 3. La pieza en cada creativo | el mesón agrupa por pieza, y «Servir todo» respeta las reglas del planificador |
| 4. Qué cuenta acepta trial reels | se guarda por cuenta, aprendido de Meta, y se hace antes de la fase 0 |
| 5. Las pruebas se saltan la fila | la prioridad propia, en la API y en «Capacidad» |
| 6. Las preguntas con plazo | el plazo y la opción por defecto en cada pregunta |
| 7. Un texto por red | el texto propuesto y el título de YouTube, aparte |
| 8. Descartar con un motivo rápido | los cuatro motivos de un toque, más la nota |
| 9. Un cambio grande es un estilo nuevo | junto a la receta congelada, en la decisión 4 |

## Para quien siga

- El diseño anterior, con el dibujo de la pieza entera y las palabras de cada estado:
  `2026-10-19-chef-de-la-casa-design.md`.
- Los estilos, las perillas, el probador, la carta y la paleta que aprende, en `marca-personal`:
  `pipeline/estilos/AGENTS.md`.
- Lo que el chef ofrece hoy: `docs/servicio.md`.
- La cola y sus tiempos: `pipeline/cola/AGENTS.md`.
- Del lado de Tu Parrilla:
  - el almacén y la subida directa, en `src/lib/storage.ts` y `src/lib/subida-directa.ts`;
  - el barrido de huérfanos, en `src/lib/storage-gc.ts`;
  - `POST /api/media`, en `src/app/api/media/route.ts`;
  - los dibujos, en `src/components/corte.tsx` y en el diseño del modo día;
  - el vocabulario de día, en `src/lib/vocabulario.ts`;
  - Tu IA, en `src/app/admin/(dash)/ia/`.
