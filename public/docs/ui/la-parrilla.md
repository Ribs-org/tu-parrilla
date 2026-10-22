# La Parrilla — lo que viene y cómo salió lo que ya se fue

`/admin/schedule` es la pestaña «La Parrilla», la primera de la barra del panel, y es la
entrada del panel: `/admin` lleva acá. El editor de cada publicación vive en
`/admin/schedule/<id>`.

**De día** esta pantalla se llama «La Barra», en la pestaña y en su título, y unas palabras
cambian: «Se quemó» es «Se echó a perder»; el calor de cada día dice «Vacía», «Con piezas» o
«Tabla llena» en vez de «Apagada», «Prendida» o «Parrilla llena»; los cortes son piezas («Ayer:
3 piezas servidas», «Ese día ya tiene una pieza.»); «Su fierro está frío: reconéctala» es «Su
cuchillo está sin filo: reconéctala», y «se enfría», «se desafila». Cada frase que aquí dice «La
Parrilla» o «Los Fierros» dice de día «La Barra» o «Los Cuchillos». La lista entera, en «El modo
día», en [index.md](index.md).

La Parrilla es el calendario de publicación y la pantalla con que abre el panel. Aquí se
programa un post para una o varias cuentas (Instagram, Facebook, YouTube y TikTok; Threads
y X dicen «Próximamente»), se retoma lo que quedó a medio escribir (los borradores, que se guardan solos), se
programan muchos de una vez con un CSV, y se ve cómo va cada uno —programado, saliendo,
publicado o quemado— en una semana o en una lista. Arriba aparece lo que falló, para
reprogramarlo, y al pie cuánto salió ayer. También es donde se corrige, se reintenta o se
borra lo que falló. El panel llama «corte» a cada publicación programada, y «quemado» a lo
que no salió. Todas las horas son las de la zona horaria que la persona eligió en [Tu
Cuenta](tu-cuenta.md), aunque su computador esté en otra. Aparece aquí todo lo programado,
venga de esta pantalla, de la [app del teléfono](app-movil.md) o de la API.

En esta página, lo que va entre ángulos (`<usuario>`, `<N>`) es un dato que la pantalla
reemplaza por el real. Los títulos y los rótulos de los campos se ven en mayúsculas por
estilo; aquí van escritos como están en el código.

Esta página describe los dibujos de noche, el modo de entrada. En el modo día los cortes son
piezas de sushi y los días, tablas de servir, con las mismas palabras salvo una: «Se quemó» se
llama «Se echó a perder». La equivalencia está en «El modo día», en [index.md](index.md).

## Cómo se llega

- Al entrar al panel con el código ([ingresar.md](ingresar.md)) se llega siempre acá, y
  `https://tu-parrilla.cl/admin` también lleva acá.
- En la barra de arriba, la pestaña «La Parrilla», la primera.
- Desde la pantalla de error de cualquier otra pantalla del panel (y del editor de un post),
  el enlace «Ir a La Parrilla».
- Quien no es admin y abre la dirección de [Los Maestros](los-maestros.md) vuelve acá.
- El correo que avisa que algo no salió termina con «Revisa el calendario en /admin/schedule
  para reprogramarla.»
- El resumen del día que llega por correo, cuando algo se quemó: «Revísalos en «Se quemó», en
  La Parrilla: …/admin/schedule». Con la cuenta en el modo día: «Revísalos en «Se echó a
  perder», en La Parrilla: …».
- Por dirección: `https://tu-parrilla.cl/admin/schedule` abre el calendario en la semana de
  hoy. Se le puede agregar:
  - `?vista=lista`: la lista en vez del calendario (los enlaces viejos con
    `?vista=calendario` abren el calendario igual);
  - `?vista=hora`: la misma semana por hora, como Google Calendar (ver «Por hora»); con
    `&semana=AAAA-MM-DD`, la semana que contiene ese día;
  - `?vista=dia`: un solo día, por cuenta y por hora (ver «El día»); con `&fecha=AAAA-MM-DD`,
    ese día, y sin ella, hoy;
  - `?semana=AAAA-MM-DD`: el calendario en la semana que contiene ese día;
  - `?red=<red>` (`instagram`, `tiktok`, `youtube` o `facebook`): solo lo que sale a esa red,
    en el calendario, el día y la lista (ver «El filtro por red»); con el id de una cuenta en
    vez de la red (`?red=<id de la cuenta>`), solo lo de esa cuenta. Una red en la que no
    tienes cuentas, o un id que no es tuyo, muestra todo;
  - `?componer=1`: el panel «Nueva publicación»; con `&dia=AAAA-MM-DD`, con ese día puesto
    en «Fecha y hora», y con `&cuenta=<id de la cuenta>`, con esa cuenta marcada;
  - `?borrador=<id>`: ese borrador, abierto en el compositor;
  - `?panel=borradores`: el panel «Borradores»;
  - `?panel=csv`: el panel «Subir CSV».

## Qué se ve

De arriba abajo: el encabezado con sus botones, el aviso «Programado.» (solo cuando se acaba
de programar), la tarjeta «Conecta tu primera red» (solo sin ninguna red conectada), la
sección «Se quemó» (solo si algo falló), los botones «Calendario», «Por hora», «Día» y «Lista»
—con el filtro por red al lado— y lo programado debajo, y el pie de ayer. El formulario para programar, la lista de borradores y la carga por
CSV no están en la página: se abren en un panel que se desliza desde la derecha (ver «El panel
lateral», más abajo).

Mientras carga se ve la forma de lo que viene, sin texto salvo el título «La Parrilla»: el
lugar de los botones, el de «Calendario», «Por hora», «Día» y «Lista», y siete parrillas tibias, sin
cortes, que se encienden y se apagan de a poco como brasas, una un poco después de la otra
(con «reducir movimiento» activado en el sistema, quietas a media luz). No son días vacíos:
un día vacío es gris ceniza y no se mueve. En «Día» son tres columnas y en «Por hora» siete, con
el lugar del canal de las horas a la izquierda; en «Lista» son filas, y al abrir un post se ve el editor: el título «Editar post» y el lugar de cada
campo.

### Encabezado

«La Parrilla», y debajo, en chico, «lo que viene y cómo salió lo que ya se fue». A la derecha
(en un teléfono, debajo del título), en este orden:

- **«Borradores (<N>)»**, solo si hay al menos un borrador guardado. Abre el panel
  «Borradores».
- **«Subir CSV»**. Abre el panel «Subir CSV».
- **«Nueva publicación»**, con un signo + delante: el botón naranjo. Abre el panel «Nueva
  publicación» con un formulario nuevo.

### «Programado.»

En verde, bajo el encabezado, justo después de programar algo desde el panel lateral. Se va
al cambiar de semana o de vista, o al abrir otro panel. A la vez, el corte recién programado
cae en su día y queda encendido un momento con un borde naranjo que se apaga solo (ver «El
compositor», al final de «Fecha y hora»).

### «Conecta tu primera red»

Solo mientras no haya ninguna red conectada: una tarjeta arriba de todo con el título
«Conecta tu primera red», la frase «Sin una red conectada no hay nada que poner al fuego.» y
el botón «Ir a Los Fierros →», que lleva a [Los Fierros](los-fierros.md) (tus redes
conectadas). Con una sola red conectada, la tarjeta se va. El resto de la pantalla se ve
igual debajo de ella.

### «Se quemó»

En el modo día se llama «Se echó a perder»; lo demás es igual.

Aparece solo si hay algo que falló y nadie archivó, de cualquier fecha; si no, la sección no
existe.
Parte plegada, en una sola línea: «Se quemó» en rojo, cuántas hay (por ejemplo «22»), los
cortes quemados en chico —uno por cada uno, hasta cinco, y «+<N>» si hay más— y «Ver» con una
flecha. Un clic en esa línea la abre (y la flecha pasa a «Ocultar»); otro la vuelve a
plegar. Si se deja abierta, la próxima vez que se entre en ese navegador abre abierta.

Abierta, cada fila es una red donde un corte falló: un corte que falló en dos redes da dos
filas. Van de la más reciente a la más vieja.

Si lo quemado es de dos redes o más, al lado del título hay un botón por red, con su ícono (en
el color de la red), su nombre y cuántas tiene (por ejemplo «TikTok 8»). Es un filtro solo de
«Se quemó», distinto del filtro por red de lo programado (ver «El filtro por red»): no va en la
dirección, y apagar una red aquí no cambia el calendario. Todos parten encendidos, con borde rojo; un
clic apaga esa red —el botón queda con borde punteado y gris— y sus filas salen de la vista, y
otro clic la vuelve a encender. Apagar una red no borra ni arregla nada: solo deja de
mostrarla, y al recargar la página vuelven a estar todas. Con todas apagadas, la sección dice
«Apagaste todas las redes.» y «Encender todas».

De entrada se ven las primeras diez filas; si hay más, abajo aparece «Ver más (quedan <N>)»,
que suma otras diez. Cambiar el filtro vuelve a las primeras diez. Cada fila trae, en dos
líneas:

- el corte en chico, con todas sus marcas: se ve cuál se quemó y si las demás salieron (ver
  «El corte», más abajo);
- la hora, solo HH:MM si el corte era de hoy, o con día y mes delante si no
  («<día> <número> de <mes> · HH:MM», por ejemplo «vie 25 de sep · 09:15»);
- el chip de la red que falló, con su ícono y una «✕»;
- el texto del post, que es un enlace a su editor (o «(sin texto)»);
- debajo, en rojo, el motivo, cuando lo hay: una frase fija en español que dice por qué no
  salió (ver «Motivos de un destino que no salió», más abajo);
- debajo del motivo, los botones. Si el motivo dice cómo se arregla, primero el arreglo, en
  naranjo: **«Reconectar»** cuando la cuenta perdió la conexión (lleva a [Los
  Fierros](los-fierros.md)) o **«Cambiar el archivo»** cuando la red no acepta los archivos
  (abre el editor del post, en sus archivos). Al lado, siempre, **«Reprogramar»**, que abre la
  misma ventana que el de la lista (ver «La ventana «Reprogramar»», más abajo), y
  **«Archivar»** (mientras se guarda dice «Archivando…»), que saca la fila de «Se quemó» sin
  borrar nada. Es para lo que ya no pide nada: lo programaste aparte, o era una prueba. El post
  se queda con su motivo y el calendario lo sigue mostrando quemado; tampoco sale en el resumen
  del día. Se desarchiva desde el editor del post (ver «El editor de un post»), y vuelve solo
  si se reprograma y se quema de nuevo.

### El corte

El calendario, el día y «Se quemó» dibujan cada publicación como un corte de carne sobre la
parrilla. El dibujo no lleva texto encima; lo dice todo en cuatro cosas que se leen sin leer:

- **La forma es el formato.** Una entraña (larga y con la fibra en diagonal) es un video; una
  tira de asado, con un hueso por archivo, es un carrusel (cinco huesos, cinco fotos; se
  dibujan hasta diez); un bife (ovalado) es una foto; un chori, sin archivos, es solo texto.
  Un video que ya salió en todas sus redes sigue siendo entraña, aunque su archivo ya no esté
  en el sitio.
- **La carne es cómo va.** De clara a oscura: cruda (rosada), programada; sellada (naranjo),
  saliendo ahora; a punto (dorada y café), publicada en todas; carbonizada y casi negra, falló
  en todas.
- **Las marcas son los destinos.** Una diagonal del fierro por cada cuenta, en el orden de sus
  chips. Punteada, todavía no sale (o está saliendo); oscura y llena, ya salió; carbonizada y
  con una brasa roja adentro, se quemó; quemada hasta la mitad con un punto ámbar, llegó a la
  bandeja de TikTok y falta terminarla; punteada en ámbar, reintenta; punteada en gris acero,
  su cuenta tiene el fierro frío y así no va a salir.
- **El halo rojo y la banderita** dicen que algo se quemó. Si se quemó solo en una red, la
  carne sigue con el color de lo demás (a punto si lo demás salió) y lleva el halo; si se
  quemó en todas, además está carbonizada.

Mientras algo está saliendo, sube humo por encima del corte: es lo único que se mueve todo
el tiempo. El halo de lo quemado late tres veces al cargar la página y después queda
encendido. Con «reducir movimiento» activado en el sistema, el humo queda en dos volutas
quietas y el halo encendido sin latir.

Junto al corte, un chip por destino con el ícono de su red, en el color de la red —Instagram
rosado, TikTok gris (su marca es blanco y negro), YouTube rojo, Facebook azul; de día, los
mismos más hondos—, y un signo: «✓» salió, «…» saliendo, «✕» se quemó, «◐» en la bandeja de
TikTok, «↻» reintentando, «!» fierro frío; sin signo, programado. El color del ícono dice la
red, nunca el estado: el estado lo dicen el signo y el borde del chip, y lo quemado, además,
el chip teñido de rojo. El rojo de YouTube no es un fallo. En el calendario, lo que ya salió en
todas sus redes lleva solo los íconos, sin chip, y un «✓» para todas. Un lector de pantalla lee el formato y la cocción («Video · Programada»,
«Carrusel · Falló en parte») y cada destino con su estado.

La tarjeta en que va el corte (en el calendario, su fila; en «Día», su bloque) es de acero, no del color de la carne,
y cambia de borde solo cuando pide algo: ámbar si algo espera en la bandeja de TikTok, reintenta
o tiene el fierro frío; rojo si se quemó. En el calendario, además, lo que ya salió en todas sus
redes deja la chapa (ver «El calendario»).

### «Calendario», «Por hora», «Día» y «Lista»

Cuatro botoncitos sobre lo programado. «Calendario» es la vista con que abre la pantalla: la
semana, en filas. «Por hora» muestra la misma semana con las horas hacia abajo, como Google
Calendar (ver «Por hora»). «Día» muestra un solo día, separado por cuenta y por hora; abre en el
día que se estaba mirando (hoy, si la semana a la vista es la de hoy, y si no, el lunes de esa
semana). «Lista» cambia a la lista. Desde «Día», «Calendario» y «Por hora» vuelven a la semana que
contiene ese día.

### El filtro por red

A la derecha de «Calendario», «Por hora», «Día» y «Lista» (en el teléfono, debajo, en un solo renglón que
se desliza de lado), un botón por red: «Todas» y, en este orden, las redes en las que tienes
cuentas —Instagram, TikTok, YouTube, Facebook—, cada una con su ícono en el color de la red y
cuántas publicaciones tiene en lo que estás mirando: la semana en el calendario y en «Por hora»,
el día en «Día», todo en «Lista». Una publicación que sale a dos redes cuenta en las dos, y una vez en
«Todas»: cada número es lo que queda a la vista al apretar ese botón. Con una sola cuenta, el
filtro no aparece.

El botón elegido tiene borde naranjo. Un clic en una red muestra solo lo que sale a ella; otro
clic en la misma, o «Todas», vuelve a mostrar todo. El filtro sigue puesto al cambiar de
semana, de día o de vista, porque va en la dirección (`?red=`); entrar a La Parrilla desde la
barra lo saca.

- **En el calendario, en «Por hora» y en «Día»**, una publicación que sale a varias redes se ve solo con lo
  de la red elegida: su corte, cocido según esa red, con una sola marca y un solo chip. En
  «Día» quedan solo las columnas de las cuentas de esa red.
- **En la lista** se ve entera, con todas sus píldoras: ahí se sube, se reprograma y se borra
  el post completo.
- **«Se quemó» y el pie de ayer no cambian**: muestran todo, con filtro o sin él. Tampoco el
  aviso del compositor de cuánto tiene ya el día que elegiste.
- **Los borradores con fecha** se ven si tienen marcada una cuenta de esa red; los que no
  tienen ninguna cuenta marcada no se ven con un filtro puesto.

**Por cuenta.** Si en una red tienes dos cuentas o más, al pasar el mouse por su botón (o al
llegar a él con el teclado) se abre debajo un menú «Por cuenta» con cada cuenta y cuántas
tiene. Un clic en una muestra solo lo de esa cuenta, y el botón de la red pasa a decir «<Red>
· <usuario>» con lo de esa cuenta. Con una cuenta elegida, el menú empieza con «Todas las de
<Red>», y un clic en el botón de la red también vuelve a la red entera. En un teléfono, que
no tiene mouse, las cuentas aparecen en un renglón debajo apenas eliges la red: «Todas las de
<Red>» y cada cuenta, con lo suyo.

Sin nada en lo elegido, la lista dice «Nada programado en <Red>.» (o «Nada programado en
<usuario>.», con una cuenta elegida), y el calendario y «Día» muestran sus parrillas frías como
siempre. Si en «Día» la red elegida no tiene ninguna cuenta conectada y ese día no tiene nada
ahí: «No tienes ninguna cuenta de <Red> conectada, y ese día no hay nada ahí.» (con una cuenta
elegida: «<usuario> no está conectada, y ese día no tiene nada.»).

### El calendario

Arriba, «Semana anterior», el rango de la semana (por ejemplo `12 – 18 oct`) y «Semana
siguiente». Abre en la semana de hoy. Debajo, siete columnas de lunes a domingo. Cada una
lleva arriba el día abreviado y su número (por ejemplo `lun 12`) —es un enlace: abre ese día
en la vista «Día», y un lector de pantalla lo lee «lun 12: ver por cuenta»—, cuánto fuego tiene
—«Apagada» (nada), «Prendida» (uno o dos cortes) o «Parrilla llena» (tres o más)— y, en los
días de hoy en adelante, un «+» chico que abre el panel «Nueva publicación» con ese día puesto
(un lector de pantalla lo lee «Programar el <día> <número>», por ejemplo «Programar el lun
12»). Debajo del nombre, una barra fina con la mezcla de redes del día —un tramo por red, del
largo de lo que sale a ella, en su color; al dejar el mouse encima, «Instagram 10 · TikTok 18 ·
…»— y un renglón con cuánto salió, cuánto se quemó y cuánto viene, con los signos de los
chips: «42 ✓ · 2 ✕» (42 salieron en todas sus redes y 2 fallaron en alguna), «21 ✓ · 23 por
salir» o «44 por salir». Un lector de pantalla lo lee en palabras: «42 cortes servidos, 2
fallaron» (de día, «piezas servidas»). Un día sin nada tiene la barra vacía y el renglón en
blanco. El día de hoy tiene el nombre más claro y un borde fino. Un día vacío es una parrilla
fría: los fierros en gris ceniza, sin brasa debajo y sin ninguna frase a la vista. Si es de hoy
en adelante, al pasar el mouse por encima aparece en el medio **«+ Poner algo»**, un botón con
borde punteado que hace lo mismo que el «+» (en el teléfono, que no tiene mouse, está siempre a
la vista; un lector de pantalla lo lee «No hay nada puesto. Poner algo»). Un día vacío que ya
pasó no tiene ni ese botón ni el «+», y un lector de pantalla lee «No hay nada puesto.». En el
teléfono la semana se desliza de lado, y abre corrida hasta hoy, con el día de antes asomado a
la izquierda.

Cada publicación es una fila de una línea, por hora: a la izquierda el corte en chico (ver «El
corte»), la hora, y a la derecha sus redes. El texto no va en la fila: al dejar el mouse encima
aparecen la hora y el texto, y debajo cada red con su estado y su motivo, si lo hay. La fila no
lleva miniatura: la foto, el video y el texto están en el editor, que se abre con un clic, y el
texto se ve también en «Día» y en la lista. En una columna angosta (en el teléfono), las redes
de una publicación que sale a dos bajan a un segundo renglón.

Cómo se ve la fila dice cómo va:

- **Lo que ya salió en todas sus redes** deja la chapa: la fila no tiene borde y va hundida —más
  oscura que la chapa de noche, tostada de día—, con el corte apagado, la hora en gris, los
  íconos de sus redes sin chip y un solo «✓» verde.
- **Lo que viene** va en la chapa, con borde, y un chip por red, sin signo mientras está
  programado.
- **Lo que está saliendo** tiene el borde naranjo, humo sobre el corte y «…» en su chip.
- **Lo que se quemó**, en todas sus redes o en parte, tiene el borde rojo y la fila teñida de
  rojo, con «✕» en el chip de la red que falló.
- **Lo que pide atención** —llegó a la bandeja de TikTok y falta terminarlo, reintenta, o su
  cuenta tiene el fierro frío— tiene el borde ámbar y su chip con «◐», «↻» o «!».

Una publicación cuya hora ya pasó pero que todavía no salió sigue en la chapa: no está servida.

En el día de hoy, una línea naranja con «ahora · HH:MM» separa lo que ya tuvo su hora de lo que
viene. Se corre sola a medida que pasa el tiempo, sin recargar la página; la fila que deja atrás
no cambia de aspecto hasta que la página se vuelve a cargar. Un lector de pantalla la lee
«Ahora, HH:MM».

Los borradores que tienen fecha aparecen en su día, debajo de los cortes, como filas con
borde punteado: «Borrador» y la hora; el texto (o «(sin texto)»), al dejar el mouse encima.
Un clic abre ese borrador en el compositor, no en el editor. Un borrador no está programado:
no sale a ninguna red hasta que se abre y se aprieta «Programar». Por eso no cuenta para el
fuego del día: un día que solo tiene borradores sigue diciendo «Apagada». Los borradores sin
fecha no salen en el calendario; están en «Borradores (<N>)».

El calendario no tiene botones de «Subir ahora», «Eliminar» ni «Reprogramar»: esos están en
la lista (y «Reprogramar», también en «Se quemó» y en el editor).

### Por hora

La misma semana que el calendario, con las horas hacia abajo, como Google Calendar: siete
columnas, de lunes a domingo, y cada publicación a la altura de su hora. Todo calza: lo que sale
a la misma hora queda a la misma altura en todos los días, y se ven los huecos y los choques.
Arriba, «Semana anterior», el rango de la semana y «Semana siguiente», y cada día lleva arriba lo
mismo que en el calendario: su nombre (que abre ese día en «Día»), su fuego, el «+», la mezcla de
redes y el renglón «42 ✓ · 2 ✕». A la izquierda, el canal de las horas: de 07:00 a 23:00, o más
si algo cae antes o después.

Cada publicación es un bloque chico: a la izquierda una franja con el color de cada red a la que
sale (Instagram rosado, TikTok gris, YouTube rojo, Facebook azul; partida si sale a varias), la
hora y el signo de la red que más pide: «✕» si se quemó en alguna; «!», «↻» o «◐» si pide
atención; «…» si está saliendo; «✓» si salió en todas; sin signo, programada. El corte y el texto
no caben: al dejar el mouse encima aparecen la hora, el texto y cada red con su estado, y un clic
abre el editor. Las que caen a menos de veinte minutos van lado a lado. Se ven como las filas del
calendario: lo que ya salió, hundido; lo quemado, teñido de rojo; lo que está saliendo, con borde
naranjo; lo que pide atención, con borde ámbar.

Los días que ya pasaron van rayados en diagonal, y hoy, hasta la hora de ahora, donde cruza la
línea naranja con la hora escrita en el canal («14:20»); la línea se corre sola. Los borradores
con fecha van a su hora, con borde punteado y sin franja. Un día sin nada no tiene bloques; si es
de hoy en adelante, al pasar el mouse aparece arriba **«+ Poner algo»**, como en el calendario.
En el teléfono la reja se desliza de lado, con el canal de las horas fijo a la izquierda, y abre
corrida hasta hoy.

### El día

Un solo día, con una columna por cuenta y las horas hacia abajo, como Google Calendar: lo que
sale a la misma hora queda a la misma altura en todas las columnas. Sirve para ver qué sale en
cada cuenta ese día, qué sale a la vez y dónde hay huecos.

Arriba, «Día anterior», el día —«Hoy · vie 16 de oct», «Mañana · sáb 17 de oct», «Ayer · jue
15 de oct» o solo «mar 20 de oct»— con el fuego del día entero al lado («Apagada»,
«Prendida» o «Parrilla llena», contando cada corte una vez aunque salga a varias cuentas),
«Ir a hoy» si el día no es hoy, y «Día siguiente». En el teléfono las flechas dicen
«Anterior» y «Siguiente».

Debajo, a la izquierda, el canal de las horas («07:00», «08:00»…: de 07:00 a 23:00, o más si
algo cae antes o después) y una columna por cuenta, en el orden de [Los Fierros](los-fierros.md).
Cada cuenta conectada tiene la suya aunque ese día no tenga nada; una desconectada aparece solo
si ese día tiene algo, con «reconéctala» debajo del nombre. En el teléfono la reja se desliza de
lado, con el canal de las horas fijo a la izquierda. Cada columna lleva arriba el ícono de la red,
en su color, y el @usuario (o el nombre de la página); si el día no pasó y la cuenta está
conectada, un «+» que abre «Nueva publicación» con ese día puesto y esa cuenta ya marcada (un
lector de pantalla lo lee «Programar en <Red> · <usuario>»); y debajo, cuántas publicaciones
tiene ese día y su fuego, con las mismas reglas que el día: uno o dos, «Prendida»; tres o más,
«Parrilla llena».

Lo que ya pasó va rayado en diagonal: el día entero si ya pasó, y hoy hasta la hora de ahora,
donde una línea naranja cruza todas las columnas, con la hora escrita en el canal («14:20»). La
línea se corre sola.

Cada publicación que sale a esa cuenta es un bloque a la altura de su hora: el corte en chico,
cocido según ese destino solo y con una sola marca, la suya; la hora; el texto en un renglón (o
«(sin texto)»); y el signo de cómo le fue en esa red: «✓» salió, «…» saliendo, «✕» se quemó,
«◐» en la bandeja de TikTok, «↻» reintentando, «!» fierro frío; sin signo, programada. Si sale
también a otras cuentas, sus íconos van al final del bloque. Al dejar el mouse encima aparecen el
texto entero, el estado de esa red con su motivo y «También en: …» con el estado de las otras.
Una que sale a tres cuentas aparece en las tres columnas, cada una cocida según su destino: la
misma publicación puede verse publicada en una columna y quemada en otra. El bloque se ve como una
fila del calendario: lo que ya salió, hundido; lo quemado, teñido de rojo; lo que está saliendo,
con borde naranjo; lo que pide atención, con borde ámbar. Dos de la misma cuenta a menos de media
hora van lado a lado. Un clic abre el editor.

Los borradores con fecha de ese día van en la columna de cada cuenta que tienen marcada, a su
hora y con borde punteado: «Borrador», la hora y el texto. Los que no tienen ninguna cuenta
marcada van en una columna «Sin cuenta elegida», al final. No cuentan para el fuego.

Una columna vacía no tiene bloques. Si todavía se puede programar en ella, al pasar el mouse
aparece arriba **«+ Poner algo»**, que hace lo mismo que su «+» (en el
teléfono, siempre a la vista; un lector de pantalla lo lee «Nada para esta cuenta. Poner
algo»). Si no se puede —el día ya pasó, o la cuenta está desconectada—, no lleva nada a la
vista, y un lector de pantalla lee «No salió nada en esta cuenta.» o «Nada para esta
cuenta.». Sin ninguna cuenta conectada y sin nada ese día: «No tienes cuentas conectadas, y
ese día no hay nada puesto.».

### La lista

Primero lo que todavía tiene algo pendiente (incluido lo quemado), de lo más próximo a lo más
lejano; después lo que ya salió en todas sus redes, de lo más reciente a lo más viejo. Se ven
los primeros 20; debajo, «Ver el restante» o «Ver los <N> restantes», que se vuelve «Mostrar
menos». Sin nada: «Nada programado todavía.» Los borradores no aparecen en la lista.

Cada publicación es una tarjeta con:

- A la izquierda, el corte en chico, con todas sus marcas, como en «Se quemó» (ver «El
  corte», más arriba).
- El texto (dos líneas como mucho), o «(sin texto)», y debajo el día y la hora, en la misma
  forma que «Se quemó» pero siempre con el día: «<día> <número> de <mes> · HH:MM», por
  ejemplo «jue 15 de oct · 13:00».
- A la derecha (en un teléfono, debajo del texto): **«Editar»** (abre el editor), **«Subir
  ahora»** (solo si a alguna red le falta salir: programada, publicándose o quemada) y
  **«Eliminar»**, que pregunta antes «¿Eliminar este post? Se borra de La Parrilla y ya no
  sale en ninguna red.».
- Abajo, una píldora por cada destino: el ícono de la red (en su color), el usuario, « · » y
  el estado (ver la tabla de estados, más abajo); la píldora es verde si ya salió. Si hay un motivo de falla, sigue « — <motivo>». Si el
  destino se quemó, la píldora es roja y termina en el botón subrayado **«Reprogramar»**.

El resultado de «Subir ahora» y los errores de «Eliminar» aparecen arriba de la lista, en
verde o en rojo; un post eliminado simplemente desaparece. Mientras una de esas acciones
trabaja, los botones de la lista se bloquean y los «Subir ahora» dicen «Subiendo…».

### El pie

Al final de la pantalla, en letra chica y solo con al menos una red conectada: «Ayer no salió
nada.», «Ayer: 1 corte servido» o «Ayer: <N> cortes servidos». Cuando las redes ya informaron
vistas de esos posts, se agrega « · <M> miradas» (desde diez mil, abreviado: «12 mil»).
Cuenta cortes y no redes: uno que salió en tres redes es un corte.

### El panel lateral

El formulario para programar, la lista de borradores y la carga por CSV se abren en un panel
que se desliza desde la derecha, encima de la pantalla, que queda oscurecida detrás. En un
teléfono ocupa la pantalla entera. Arriba lleva su título —«Nueva publicación», «Borrador»,
«Borradores» o «Subir CSV»— y a la derecha una ✕ para cerrarlo (un lector de pantalla la lee
«Cerrar»). También se cierra con la tecla Escape o con un clic en la parte oscurecida, fuera
del panel. Cerrar el compositor no pierde lo escrito: queda como borrador (ver «Los
borradores», más abajo).

### El compositor: «Nueva publicación» o «Borrador»

El panel se llama «Nueva publicación» cuando se abre con ese botón, con el «+» de un día o con
«+ Poner algo», y «Borrador» cuando se abre un borrador guardado. El
formulario viene abierto, con el cursor en «Texto». En este orden:

1. **«Así va a quedar»**: el corte del post mientras se arma (ver «El corte», más arriba),
   sobre la parrilla del día elegido con este post encima. La silueta sale de los archivos
   —también de los que todavía suben—: un chori sin archivos, un bife con una foto, una
   entraña con un video, una tira con un hueso por archivo. Lleva una marca punteada por cada
   cuenta marcada (fría, en gris acero, si el fierro de esa cuenta se apagó) y se llena de
   carne cruda de izquierda a derecha a medida que llegan los archivos; lo que falta se ve
   como la silueta punteada. Si un archivo no llegó, lleva el halo rojo y la banderita. Al
   lado, en palabras: la forma («Solo texto.», «Una foto.», «Un video.» o «Un carrusel de
   <N>.»), a quién va («A Instagram y TikTok.», con el usuario cuando hay dos cuentas de la
   misma red, o «Todavía sin cuenta: elige al menos una.») y, mientras suben, «Llegando: <N>
   de <M>.» o «Un archivo no llegó: reintenta o quítalo. Los que siguen esperan.».
2. **«Texto»**, con el placeholder «Texto del post…». No deja escribir más de 2200
   caracteres.

   Si el borrador viene del mesón de La Cocina (se abrió con «Programar» en un creativo), antes del
   texto va un recuadro: «Viene del mesón, en el estilo «<estilo>»: lleva su portada y sus
   atributos.» (de día, «Viene de la bandeja…»), y el campo **«Título de YouTube»**, con lo que
   escribió el chef y la ayuda «En YouTube va como primera línea del texto, que es de donde
   YouTube saca el título. Hasta 100 caracteres. Vacío, YouTube usa la primera línea del texto.».
   Solo cuenta si se marca una cuenta de YouTube. Al programarlo, el post lleva la portada y los
   atributos del creativo, aunque no se vean acá ([la-cocina.md](la-cocina.md), «El mesón»).
3. **«Archivos»**: una zona con borde punteado que dice «Suelta fotos o un video acá, o
   elígelos» y, debajo, «Opcional. Suben apenas los sueltas y se guardan con el borrador.»
   Se puede soltar ahí archivos arrastrados desde la computadora (la zona se pinta de
   naranjo mientras se arrastra encima) o apretarla para elegirlos; acepta varios a la vez,
   solo imágenes y videos. Con algo elegido, la zona se achica y dice «Suelta más acá, o
   elígelos». Debajo, una miniatura por archivo, en el orden del carrusel, con su número
   arriba a la izquierda («· ▶» si es video) y una ✕ arriba a la derecha para quitarlo (un
   lector de pantalla la lee «Quitar <nombre del archivo>»). Suben de a uno y en orden: el que
   espera dice «En cola», el que sube dice cuánto lleva («45 %») con una barra del color de la
   carne cruda, y los dos se ven apagados hasta que llegan. Uno que no llegó queda con borde
   rojo, «No llegó» y el botón «Reintentar», y debajo de las miniaturas sale en rojo «<nombre
   del archivo>: <error>»; los que venían atrás esperan hasta que se reintente o se quite. Lo
   que ya llegó se queda. Quitar uno que está subiendo corta su subida. Se pueden agregar más
   después: van al final. Para cambiar el orden hay que quitar y volver a elegir, o usar el
   editor después de programar. Mientras algo sube o no llegó, «Programar» queda apagado.
4. **La revisión para TikTok**, solo si hay una cuenta de TikTok marcada y archivos elegidos.
   Mide cada archivo en el navegador y dice, en verde, «El archivo cumple lo que pide
   TikTok.» o «Los archivos cumplen lo que pide TikTok.»; o, en un recuadro rojo, «TikTok va
   a rechazar esto:» con una línea por archivo, «<nombre del archivo>: <problema>.». Es un
   aviso: no impide programar. Solo mide lo elegido desde que se abrió el panel: los archivos
   que vienen de un borrador guardado no se vuelven a medir.
5. **«Cuentas»**, una ficha redonda por cuenta: el fierro de la cuenta —la rayita que dice la
   temperatura de su conexión, como en [Los Fierros](los-fierros.md): naranja al rojo, ámbar
   si se enfría, gris si se apagó—, el ícono de la red y «<Red> · <usuario>» (una cuenta sin
   usuario dice «sin nombre»). Las de Threads y X / Twitter no aparecen: esas redes están en
   «Próximamente». Un clic la marca o la desmarca;
   la marcada se enciende con borde naranjo. Una que se está enfriando lleva al lado «se
   enfría», en ámbar. Una cuenta desconectada sale atenuada, no se puede marcar y lleva al
   lado «reconéctala». En un formulario nuevo, si hay una sola cuenta conectada viene
   marcada; con dos o más no viene ninguna. En un borrador vienen marcadas las que tenía
   marcadas, si siguen conectadas. Si el permiso de una cuenta marcada vence antes de la hora
   elegida, debajo de las fichas aparece en ámbar «El permiso de <Red> · <usuario> vence el
   <día> <número> de <mes> a las HH:MM, antes de que salga esto: así no va a salir ahí.
   Reconéctala en Los Fierros antes, o elige un día anterior.», con «Reconéctala en Los
   Fierros» como enlace, y su marca en «Así va a quedar» sale fría. No avisa por TikTok ni
   YouTube, que renuevan su permiso solas. Sin ninguna cuenta, el bloque dice «Todavía
   no tienes cuentas conectadas. Conecta una para poder programar.», y «Conecta una» lleva a
   Los Fierros (tus redes conectadas).
6. **Un bloque «TikTok · <usuario>»** por cada cuenta de TikTok marcada (ver abajo).
7. **Un bloque «Instagram · <usuario>»** por cada cuenta de Instagram marcada, solo cuando
   hay exactamente un archivo y es un video (ver abajo).
8. **«Respuesta automática por palabra clave»**, plegado (ver abajo); viene abierto y lleno si
   el borrador tenía una palabra.
9. **«Fecha y hora»**, un selector de día y hora con el botón «Ahora» al lado. Al abrir desde
   un día del calendario, viene puesto ese día a las 09:00; si el día es hoy, la hora en punto
   siguiente (o las 09:00, si todavía no son las nueve), y vacío desde las 23:00. Al abrir un
   borrador, viene la fecha que tenía. Al elegir el día aparece debajo cómo está ese día según
   lo que ya hay programado para adelante: «Ese día está apagado. Buen lugar para este.»
   (nada), «Ese día ya tiene un corte.» o «Ese día ya tiene <N> cortes.» (uno o dos), o «Ese
   día ya va lleno, con <N>. Mira si te sirve uno más flojo.» (tres o más). Los borradores no
   cuentan. «Ahora» se enciende y se apaga con un clic; encendido, el selector queda vacío y
   bloqueado y el post queda para el minuto siguiente.

   Debajo del selector, la semana en chico: hoy y los seis días que siguen, cada uno con su
   nombre («hoy», «sáb», «dom»…), su número y una rayita con su fuego (apagada, prendida o
   llena, con lo que ya hay programado; un lector de pantalla lee, por ejemplo, «sáb 17 de
   oct: prendida, 2 cortes»). Un clic pone ese día en el selector, con la hora que ya tenía si
   todavía no pasó; si no tenía hora, o ya pasó, la de siempre: las 09:00, o la hora en punto
   siguiente si es hoy. El día elegido lleva borde naranjo. Con «Ahora» encendido, la semana
   en chico no aparece.

   Al programar, el panel se cierra y el corte cae en su día: en el calendario, la semana se
   pasa a la de ese día y su fila queda encendida un momento con un borde naranjo; en la
   vista «Día», se va a ese día y su tarjeta se enciende igual; en la lista, su fila se trae a
   la vista y se enciende. En el teléfono, la semana se corre hasta él. Con «reducir
   movimiento» activado en el sistema, no cae: queda con el borde naranjo quieto hasta que se
   va a otra parte.
10. **El pie del panel**, fijo abajo: los errores en rojo, encima de los botones; **«Programar»**,
   que dice «Programando…» mientras trabaja; **«Descartar»**; y a la derecha, en chico, cómo va
   el guardado del borrador (ver abajo).

#### El bloque «TikTok · <usuario>»

- Debajo del nombre, con la foto de la cuenta: «Se publicará en la cuenta <nombre en
  TikTok>». Mientras pregunta a TikTok dice «Leyendo tu cuenta…»; si TikTok no contesta,
  ahí sale el error (ver la tabla de TikTok en los mensajes, más abajo).
- El interruptor **«Enviar como borrador a mi bandeja de TikTok»**. Encendido, dice «Te
  llegará una notificación en TikTok para terminar la publicación desde el teléfono.» y el
  resto del bloque desaparece: no hay nada más que elegir. Ojo: este «borrador» es de TikTok
  (el post llega a la app de TikTok sin publicar) y no tiene que ver con los borradores de
  Tu Parrilla.
- Apagado (publicación directa), aparece:
  - **«Quién puede verlo»**, una lista que parte en «Elige quién puede verlo» y ofrece
    «Todos», «Amigos mutuos», «Seguidores» y «Solo yo» (solo las que la cuenta permite). Es
    obligatoria: sin elegir, el navegador no deja programar.
  - **«Permitir»**, con las casillas «Comentarios», «Dúos» y «Pegar (Stitch)», todas
    desmarcadas al partir (en un borrador, como quedaron). «Dúos» y «Pegar (Stitch)» no
    aparecen cuando todos los archivos son fotos. Una casilla gris es algo que la cuenta tiene
    bloqueado en TikTok.
  - El interruptor **«Este contenido promociona una marca»**. Encendido, ofrece «Mi marca»
    («Se etiquetará como Contenido promocional») y «Contenido patrocinado» («Se etiquetará
    como Colaboración pagada»). Con «Contenido patrocinado», «Solo yo» queda deshabilitado
    en la lista y, mientras no haya otra privacidad elegida, sale en rojo «Un contenido
    patrocinado no puede ser privado. Vuelve a elegir quién puede verlo.»
  - Al pie, «Al publicar aceptas la Music Usage Confirmation de TikTok.» (con contenido
    patrocinado, también la «Branded Content Policy»), seguido de «Después de publicar,
    TikTok puede tardar unos minutos en mostrarlo en tu perfil.»

Con dos cuentas de TikTok marcadas hay dos bloques, y cada uno se llena por separado.

#### El bloque «Instagram · <usuario>»

Un solo interruptor, **«Publicar como trial reel»**, apagado al partir (en un borrador, como
quedó), con «Solo lo ven quienes no te siguen. Tú decides desde Instagram cuándo compartirlo
con todos.» Si Instagram ya rechazó un trial reel de esa cuenta, debajo va, en ámbar, la frase
del rechazo («@cuenta no tiene trial reels: Instagram los da solo a cuentas con un mínimo de
seguidores…», o «Instagram ya rechazó un trial reel en esta cuenta: prográmalo como reel normal.»). El interruptor se puede encender igual, porque una cuenta que crece pasa
a aceptarlos, pero lo más probable es que se queme: conviene programarlo como reel normal.

#### «Respuesta automática por palabra clave»

- **«Palabra clave»**, con el placeholder «GUIA» y la ayuda «Una sola palabra. Quien la
  comente recibe la respuesta sin que hagas nada.» Hasta 30 caracteres, solo letras y
  números. Se guarda en minúsculas y sin tildes, y reconoce la palabra entera escrita de
  cualquier forma: `guía`, `GUIA` o `#Guía!` cuentan; `guiar` no.
- **«Mensaje»**, con el placeholder «Acá tienes la guía: https://…» y la ayuda «Pon el
  enlace aquí; si es de tu sitio se mide solo en Los Números.» Hasta 1000 caracteres.
- **«Respuesta pública»**, que viene escrita con «Te lo mandé por privado» seguido de un
  emoji de sobre, y la ayuda «Se usará cuando el privado esté activo; por ahora se publica el
  mensaje completo.» Hasta 300 caracteres.
- Al pie: «Hoy la respuesta se publica con el mensaje y el enlace en Instagram, Facebook y
  YouTube. El privado llega con la próxima entrega; en TikTok todavía no hay cola de
  comentarios.»

Sin palabra no hay regla, aunque el mensaje esté escrito. Aquí no hay dónde adjuntar un PDF:
eso solo se puede por API o en la columna `regla` del CSV.

### Los borradores

Lo que se escribe en el compositor se guarda solo, como borrador, un segundo después del
último cambio (una tecla, un archivo, una casilla). Hace falta algo propio: texto, un archivo
o una palabra clave. Abrir el panel y cerrarlo sin escribir, o solo marcar cuentas o elegir
una fecha, no deja borrador. A la derecha del pie del panel se ve cómo va: «Guardando
borrador…», «Borrador guardado.» o, en rojo, «No se pudo guardar el borrador.» o «Este
borrador ya no existe: se programó o se descartó en otra pestaña o en el teléfono. Cierra el panel para ver
cómo quedó.» (desde ese aviso, el panel ya no guarda nada más y «Programar» queda apagado:
si se programó en la otra pestaña, saldría dos veces).

Un borrador guarda el texto, los archivos, las cuentas marcadas, lo elegido en los bloques de
TikTok y de Instagram, la respuesta automática y la fecha. «Ahora» no se guarda: un borrador
que se guardó con «Ahora» encendido vuelve sin fecha y con «Ahora» apagado.

- **Cerrar el panel** (la ✕, Escape, un clic fuera, o el botón Atrás del navegador) guarda lo
  que faltaba y deja el borrador.
- **«Programar»** convierte el borrador en publicación y lo saca de los borradores. Si sale
  bien, el panel se cierra y la pantalla dice «Programado.». Si no, el error sale en rojo en el
  pie, el panel sigue abierto y el borrador se guarda de nuevo, con lo último que se escribió.
- **«Descartar»** pregunta «¿Descartar este borrador? Lo escrito y los archivos elegidos se
  pierden.»; al aceptar, borra el borrador y cierra el panel. En un formulario nuevo y vacío no
  pregunta: solo lo cierra. Un borrador que vino del mesón devuelve su creativo al mesón: ahí
  sigue, con sus archivos.

Los borradores son los mismos que los de la app del teléfono ([La app del teléfono](app-movil.md)):
lo empezado en Publicar, en el teléfono, aparece acá en «Borradores (<N>)» y se sigue acá, y al
revés. El teléfono no tiene las opciones de TikTok ni la respuesta automática: un borrador que
las tiene se puede editar allá sin perderlas, pero se programa acá. La API no ve los
borradores.

### El panel «Borradores»

Lista los borradores, del guardado más recientemente al más viejo. Cada fila trae el texto en
dos líneas como mucho (o «(sin texto)») y, debajo, en chico:

- «para el <día> <número> de <mes> a las HH:MM» (por ejemplo «para el vie 16 de oct a las
  19:00»), o «sin fecha»;
- « · 1 archivo» o « · <N> archivos», si tiene;
- « · guardado el <día> <número> de <mes> a las HH:MM», la última vez que se guardó (por ejemplo «guardado el mar 13 de oct a las 14:05»).

Un clic en la fila abre ese borrador en el compositor. Sin borradores dice «No tienes
borradores.» (el botón «Borradores» no aparece sin borradores, así que eso solo se ve al
llegar por un enlace). Si se abre un enlace a un borrador que ya no existe —se programó o se
descartó—, se abre esta lista en su lugar.

### El panel «Subir CSV»

Adentro, un párrafo de ayuda que resume el formato y termina en «Máximo 50 filas.», con un
enlace «Los Fierros» que lleva a [Los Fierros](los-fierros.md); un ejemplo de tres filas en
letra de máquina; el botón de archivo del navegador (solo deja elegir `.csv`), y el botón
**«Cargar lote»**, que dice «Cargando…» mientras procesa. Las fechas del ejemplo ya pasaron:
copiado tal cual, todas las filas fallan por hora.

Al terminar aparece una línea por fila: «Fila <N>: Programado» en verde, o «Fila <N>:
<motivo>» en rojo. La fila 1 del archivo es el encabezado, así que la primera fila de datos es
«Fila 2: …». Las filas buenas quedan programadas aunque otras fallen.

El archivo lleva un encabezado con estas columnas, exactamente en este orden. Las cuatro
primeras son obligatorias; para usar una de las siguientes hay que poner también todas las
anteriores, aunque vayan vacías.

| Columna | Qué va |
|---|---|
| `fecha` | `AAAA-MM-DD HH:MM`, en la zona horaria de Tu Cuenta, en el futuro |
| `texto` | El texto del post; entre comillas si lleva comas |
| `redes` | `instagram`, `facebook`, `youtube` o `tiktok`, separadas por `\|` (`threads` y `x` se rechazan: están en «Próximamente») |
| `media` | Direcciones de descarga directa de los archivos, separadas por `\|`; puede ir vacía si hay texto y ninguna red exige archivo |
| `portada` | Dirección de una imagen JPG o PNG; solo vale si hay un video en `media` |
| `opciones` | JSON con lo que piden TikTok (privacidad, borrador) o Instagram (trial reel) |
| `regla` | JSON con la palabra clave, el mensaje, la respuesta pública y, si se quiere, el PDF |
| `cuentas` | Identificadores de cuenta separados por `\|`; hace falta cuando hay dos cuentas de la misma red. Cada cuenta de Los Fierros trae el suyo en su detalle (la flecha de su fila), con un botón para copiarlo |

La forma exacta de `opciones` y `regla` es la misma de la API: ver [la guía de la
API](../api-llm.md). La carga por CSV no crea borradores: cada fila buena queda programada.

### Estados de un destino

Cada publicación tiene un destino por cuenta, y cada destino va por su lado.

| Lo que dice | Cómo se ve | Qué está pasando |
|---|---|---|
| «Programado» | Píldora gris; en el corte, marca punteada y chip sin signo | Espera su hora |
| «Reintentando» | Píldora gris con « — <motivo>»; en el corte, marca punteada en ámbar y chip «↻»; en el calendario, en «Por hora» y en «Día», el borde ámbar y «↻» | Falló un intento y se volverá a probar solo: quince minutos después del primer fallo y dos horas después del segundo. Son tres intentos en total; algunos rechazos se queman al primero. También dice «Reintentando», sin gastar intentos, un destino de Instagram que espera a que la cuenta recupere cupo (ver «Motivos de un destino que no salió») |
| «Publicando…» | Píldora gris; humo sobre el corte y chip «…»; en el calendario, en «Por hora» y en «Día», el borde naranjo y «…» | La red recibió el archivo y lo está procesando. Si pasan 24 horas así, cuenta como un intento fallido |
| «Publicado» | Píldora verde; marca llena en el corte y chip verde «✓»; en el calendario, en «Por hora» y en «Día», cuando salió en todas sus redes, hundida y sin chapa, con un solo «✓» | Ya salió en esa red |
| «En tu bandeja de TikTok» | Píldora verde; marca quemada hasta la mitad con un punto ámbar, chip «◐» y la tarjeta (o la fila) con borde ámbar | Se mandó como borrador de TikTok: hay que terminarlo en la app de TikTok. Cuando se publica desde allá, la sincronización siguiente (la diaria, o «Sincronizar ahora» en [Los Fierros](los-fierros.md)) encuentra el video y pasa a «Publicado» |
| «Falló» | Píldora roja con « — <motivo>» y «Reprogramar»; marca carbonizada, chip rojo «✕», el corte con halo rojo y banderita, y la tarjeta con borde rojo (en el calendario, en «Por hora» y en «Día», con borde rojo y teñida de rojo) | Se quemó: no se volverá a intentar sola. Aparece también en «Se quemó», arriba del calendario, y puede llegar un correo con el asunto «No se pudo publicar en <Red>» (no llega si el motivo es la conexión de la cuenta: de eso avisa un solo correo por cuenta, ver [Los Fierros](los-fierros.md)). También sale en el resumen del día, el correo de la mañana |

Un destino programado en una cuenta con el fierro frío (desconectada, vencida o que no
sincroniza; ver [Los Fierros](los-fierros.md)) lleva en el corte la marca punteada en gris
acero, el chip «!» en ámbar y la tarjeta (o la fila) con borde ámbar: así como está, no va a
salir.

Lo programado sale en la pasada siguiente del publicador, que corre cada pocos minutos: no
en el segundo exacto de la hora elegida.

### El editor de un post (`/admin/schedule/<id>`)

Además de desde el calendario y la lista, se llega desde la pieza de una publicación en
[Los Números](los-numeros.md), con su enlace «Editar atributos».

Arriba, el título «Editar post» y el enlace «Volver», que regresa a la vista desde la que se
entró: la semana del calendario, la lista o, si se entró con «Editar atributos», esa pieza de
Los Números.

Debajo, un recuadro con cómo va el post en cada red: a la izquierda, su corte con todas sus
marcas (ver «El corte»); al lado, una línea por destino con su chip, «<Red> · <usuario>» y el
estado en palabras («· Programado», «· Reintentando», «· Publicando…», «· Publicado», «· En tu
bandeja de TikTok», «· Falló» o «· Su fierro está frío: reconéctala»). Si el destino reintenta
o falló, debajo va el motivo, en ámbar o en rojo. Si falló, debajo del motivo van los mismos
botones que en «Se quemó»: el arreglo cuando el motivo lo dice —**«Reconectar»**, que lleva a
Los Fierros, o **«Cambiar el archivo»**, que baja a «Media» en este mismo editor—,
**«Reprogramar»** y **«Archivar»**. Si ya estaba archivado, debajo del motivo dice
«Archivado: ya no sale en «Se quemó» ni en el resumen del día.» (de día, «Se echó a perder»), y
en vez de «Archivar» va **«Desarchivar»** («Desarchivando…» mientras se guarda), que lo
devuelve a «Se quemó». Es el único lugar del panel donde se ve lo archivado. Si el fierro de
su cuenta está frío, **«Reconectar»**. Al pie del
recuadro, según el caso:

- «Hay una publicación en curso. Vuelve en un minuto.», en amarillo, si algún destino está
  «Publicando…». Mientras tanto todo el formulario queda bloqueado, también «Eliminar». La
  misma frase puede salir al apretar «Guardar» en un post que se veía programado: el
  publicador lo estaba subiendo justo en ese momento, y no se guardó nada.
- «Los cambios no tocan lo publicado.», si alguna red ya salió.

El formulario, en orden:

1. **«Texto»**.
2. **«Fecha y hora»**.
3. **«Cuentas»**: las mismas casillas que al programar, marcadas las que son destino. Una red
   donde ya se publicó lleva « ✓» y no se puede desmarcar. Una desconectada lleva
   «reconéctala»: si ya era destino se puede desmarcar, pero no se puede agregar. Las cuentas
   de TikTok solo aparecen si ya eran destino: desde aquí no se agregan. Las de Threads y X /
   Twitter tampoco se agregan («Próximamente»); si una ya era destino de algo que no salió, hay
   que desmarcarla para poder guardar. Junto a un destino
   con opciones va, tras un punto medio, un resumen: «Borrador a tu bandeja de TikTok»;
   «Directo» seguido de la privacidad y de lo permitido, por ejemplo «Directo · Solo yo · sin
   comentarios · sin dúo · sin pegar · sin comercial»; o «Trial reel — lo compartes tú desde
   Instagram». Esas opciones no se pueden cambiar aquí.
4. **«Media»**: una fila por archivo, con su miniatura (los videos se pueden reproducir ahí
   mismo), su dirección, un ícono para abrirlo en otra pestaña («Abrir en una pestaña
   nueva»), un ícono para copiar la dirección («Copiar la URL»; muestra «Copiada» o «No se
   pudo copiar»), dos flechas para subirlo o bajarlo en el orden del carrusel, y «Quitar».
   Debajo, **«Agregar archivos»** (botón de archivos) y **«Agregar por URL»** (placeholder
   «https://…», con la ayuda «Una por línea»). Lo agregado queda al final del carrusel. Los
   archivos elegidos suben al apretar «Guardar», antes de guardar: el botón dice «Subiendo el
   archivo…» (o «Subiendo 1 de 3…» con varios) y después «Guardando…».
5. **«Portada (solo para video)»**: si hay portada, su miniatura con los mismos íconos y
   «Quitar»; debajo, un campo de dirección, «Agregar por URL» o «Cambiar por URL» si ya hay
   una, con el placeholder «https://…/portada.jpg». La portada solo entra por dirección.
6. **«Respuesta automática por palabra clave»**, igual que al programar; viene abierta y
   llena si el post ya tenía una.
7. **«Atributos (JSON del editor de contenido)»**, un cuadro de texto con el placeholder
   `{"hook": "pregunta-polemica", "tema": "negocios"}`. Son anotaciones libres sobre el post
   —el hook, el tema, la serie—, hasta 20 claves con valores simples (texto, número, o `true` /
   `false`). Las claves que recomienda la guía de la API, para que todo se pueda comparar,
   son `tema`, `hook`, `estilo`, `serie`, `color`, `fuente`, `ritmo`, `musica` y
   `duracion`, con valores en minúsculas y sin tildes (`"ritmo": "rapido"`); la tabla con
   ejemplos está en [la guía para LLM](../api-llm.md), sección 2b. Los lee el agente que analiza las publicaciones por la API, y el panel los muestra
   en [Los Números](los-numeros.md): en la pieza de cada publicación y en «Comparar por
   atributo». Una sola clave cambia algo en el panel, **`pieza`**: los posts programados con el
   mismo valor (por ejemplo `{"pieza": "chimichurri-30s"}`) se muestran juntos, como versiones
   de una misma pieza. Sirve para juntar dos hooks del mismo video, o el trial reel y el reel
   normal en la misma cuenta, que por fuerza son dos posts programados. Se puede agregar o
   cambiar también en un post que ya salió: no toca lo publicado.
8. Los errores, en rojo, y los botones **«Guardar»** («Subiendo…» mientras suben los archivos
   nuevos, después «Guardando…») y **«Eliminar»**
   («Eliminando…»), que pregunta antes, como en la lista. Guardar bien devuelve a la vista de
   donde se vino —también a la pieza de Los Números, si se entró desde ahí—; eliminar bien,
   también.

El editor no es un panel lateral: es una pantalla aparte, y no guarda borradores. Si el post
no existe o ya se borró, el editor muestra la página «No encontramos esa página».

### La ventana «Reprogramar»

Se abre al apretar «Reprogramar» en una píldora roja de la lista, en una fila de «Se quemó» o
en un destino quemado del editor, y
queda al centro, encima de todo, con el fondo oscurecido. Arriba dice de qué destino se trata,
«<Red> · <usuario>»; debajo, un selector de fecha y hora, **«Guardar»** (bloqueado hasta
elegir una hora) y **«Cancelar»**. Se cierra también con Esc o con un clic fuera. Al guardar
bien, la ventana se cierra y la fila sale de «Se quemó».

## Qué se puede hacer

Todo lo que sigue es para quien tiene sesión en el panel. Programar en lote y borrar también
se puede por API: ver [la guía de la API](../api-llm.md).

### Para programar una publicación

1. En La Parrilla, apretar «Nueva publicación» (arriba a la derecha). Se abre el panel con el
   cursor en «Texto».
2. Escribir en «Texto».
3. Si lleva fotos o video, apretar el botón de «Archivos» y elegirlos. Esperar a que terminen
   de subir: aparecen en la lista numerada.
4. En «Cuentas», marcar la ficha de cada cuenta donde tiene que salir.
5. Si apareció un bloque de TikTok o de Instagram, llenarlo (ver las tareas de abajo).
6. En «Fecha y hora», elegir día y hora: en el selector, o con un clic en un día de la semana
   en chico. Mirar el aviso de debajo: si dice que el día va lleno, conviene otro. Si aparece
   en ámbar que el permiso de una cuenta vence antes, reconectarla en Los Fierros o elegir un
   día anterior.
7. Apretar «Programar». El panel se cierra, arriba dice «Programado.» y el post cae en su día
   del calendario, encendido un momento.

Si hay que dejarlo a medias, basta con cerrar el panel: queda como borrador.

### Para programar en un día del calendario

1. En «Calendario», ir a la semana con «Semana anterior» o «Semana siguiente».
2. Apretar el «+» junto al nombre del día o, si el día está vacío, «+ Poner algo» en el medio
   de su parrilla (con mouse, aparece al pasar por encima). Los días que ya pasaron no tienen
   ninguno de los dos.
3. Se abre «Nueva publicación» con la fecha puesta: ese día a las 09:00 (si es hoy, la hora
   en punto siguiente). Cambiar la hora si hace falta y seguir como en la tarea anterior.

### Para retomar un borrador

1. Apretar «Borradores (<N>)», arriba a la derecha. Si el borrador tiene fecha, también se
   puede apretar su fila punteada en el calendario.
2. Apretar el borrador. Se abre el panel «Borrador» con todo lo que tenía.
3. Seguir escribiendo (se sigue guardando solo) y, cuando esté listo, «Programar». Si se
   había usado «Ahora», volver a encenderlo.

### Para descartar un borrador

1. Abrirlo, como en la tarea anterior.
2. Apretar «Descartar» y aceptar la pregunta. Se borra con sus archivos y no se puede
   deshacer.

### Para programar un video para TikTok

1. Apretar «Nueva publicación» y escribir el «Texto».
2. En «Archivos», elegir un solo video (MP4, MOV o WebM) y esperar a que suba. Si aparece
   «TikTok va a rechazar esto:», quitarlo con su ✕ y elegir otro antes de seguir.
3. En «Cuentas», marcar «TikTok · <usuario>». Aparece su bloque.
4. Elegir el camino:
   - Para terminarlo desde el teléfono: encender «Enviar como borrador a mi bandeja de
     TikTok». Llega a la app de TikTok como borrador.
   - Para publicarlo directo: en «Quién puede verlo», elegir quién lo ve; sale con esa
     privacidad, desde una cuenta pública o privada. Marcar en «Permitir» lo que se quiera
     dejar abierto.
5. Si el video promociona una marca, encender «Este contenido promociona una marca» y elegir
   «Mi marca» o «Contenido patrocinado» (este último no admite «Solo yo»).
6. Elegir «Fecha y hora» (o «Ahora») y apretar «Programar».

Para fotos en TikTok es igual, con hasta 35 fotos JPG o WebP y sin video (hasta diez si el
post va también a otra red).

### Para publicar un reel como trial reel de Instagram

1. En «Nueva publicación», elegir en «Archivos» un solo video, nada más.
2. Marcar la cuenta de Instagram en «Cuentas». Aparece «Instagram · <usuario>».
3. Encender «Publicar como trial reel».
4. Fecha y hora, y «Programar». Después, se comparte con todos desde la app de Instagram.

### Para que salga ya

- Si todavía no está programado: en el compositor, apretar «Ahora» y luego «Programar».
  Queda para el minuto siguiente y sale en la pasada siguiente del publicador, en unos
  minutos.
- Si ya está programado (o se quemó) y tiene que salir en el acto: en «Lista», apretar
  «Subir ahora» en su tarjeta y aceptar la pregunta «¿Subirlo ahora, sin esperar la hora
  programada? Se publica en tus redes de inmediato.». Arriba de la lista aparece cómo le
  fue, por ejemplo `1 publicado, 1 en proceso.`. Lo que quede en proceso termina solo en
  las pasadas siguientes. Lo ya publicado no se vuelve a publicar.

### Para agregar una respuesta automática por palabra clave

1. En el compositor (o en el editor de un post ya programado), abrir «Respuesta automática
   por palabra clave».
2. Escribir la palabra en «Palabra clave»: una sola, sin espacios ni símbolos.
3. Escribir en «Mensaje» lo que se responde, con el enlace.
4. Dejar «Respuesta pública» como viene, o cambiarla.
5. «Programar» o «Guardar».

Solo funciona en Instagram, Facebook y YouTube. En un post ya publicado también se puede
agregar o cambiar desde el editor: rige para los comentarios que lleguen desde ese momento.
Para quitarla, borrar la palabra y guardar.

### Para programar muchas de una vez con un CSV

1. Armar el archivo con el encabezado de la tabla de arriba, una fila por post. Las fechas,
   en `AAAA-MM-DD HH:MM` y en el futuro.
2. Si alguna red tiene dos cuentas conectadas, agregar la columna `cuentas` con el
   identificador de cada una, copiado de su tarjeta en [Los Fierros](los-fierros.md).
3. En La Parrilla, apretar «Subir CSV», elegir el archivo y apretar «Cargar lote».
4. Leer las líneas «Fila <N>: …». Las que dicen «Programado» ya quedaron. Para las rojas,
   corregir y volver a subir un CSV solo con esas filas: subir de nuevo las buenas las
   duplica.

Hasta 50 filas por archivo. Los archivos van por dirección de descarga directa; aquí no se
suben archivos sueltos.

### Para ver qué hay en una semana

1. Mirar el «Calendario», que es la vista con que abre la pantalla.
2. Moverse con «Semana anterior» y «Semana siguiente».
3. Un clic en una fila abre su editor (o, si es punteada, el borrador). Al dejar el mouse
   encima de una fila se ven su hora, su texto y cómo le fue en cada red.

### Para ver solo una red (o una cuenta)

1. Arriba de lo programado, a la derecha, apretar el botón de la red (por ejemplo «Facebook
   28»).
2. Para una sola cuenta de una red que tiene varias: pasar el mouse por el botón de la red y
   elegir la cuenta en «Por cuenta». En el teléfono: apretar la red y después la cuenta, en el
   renglón que aparece debajo.
3. Para volver a ver todo: «Todas».

### Para ver la semana por hora, como Google Calendar

1. Apretar «Por hora», al lado de «Calendario».
2. Moverse con «Semana anterior» y «Semana siguiente».
3. Dejar el mouse encima de un bloque para ver su texto y cómo le fue en cada red; un clic abre
   su editor.

### Para ver qué sale en cada cuenta un día

1. Un clic en el nombre del día en el calendario (por ejemplo `sáb 17`), o el botoncito «Día»
   arriba de lo programado.
2. Cada columna es una cuenta, con las horas hacia abajo. Moverse con «Día anterior» y «Día
   siguiente»; «Ir a hoy» vuelve a hoy.
3. Para programar algo en una cuenta ese día, el «+» de su columna: abre «Nueva publicación»
   con el día y la cuenta ya puestos.

### Para cambiar algo de un post programado

1. Abrirlo: «Editar» en la lista, un clic en su fila del calendario o en su texto en «Se
   quemó».
2. Cambiar lo que haga falta: texto, fecha y hora, cuentas, orden de los archivos (flechas),
   quitar («Quitar») o agregar archivos, portada, respuesta automática.
3. Apretar «Guardar».

Los archivos del editor suben directo al almacenamiento, como en el compositor: un video de
hasta 500 MB entra por «Agregar archivos». «Agregar por URL» sirve para lo que ya está en
internet, con un enlace de descarga directa.

### Para ponerle portada a un video

1. Programar el video y abrirlo en el editor.
2. En «Portada (solo para video)», pegar en «Agregar por URL» la dirección de una imagen JPG
   o PNG.
3. «Guardar».

### Para arreglar un post quemado

Primero leer el motivo, que está en «Se quemó», arriba de la pantalla, en el editor del post,
en la píldora roja de la lista y en el correo. Si dice que hay que reconectar, hacerlo antes en
[Los Fierros](los-fierros.md): el botón «Reconectar» de su fila en «Se quemó» lleva ahí. Si la
red no acepta el archivo, «Cambiar el archivo» abre el editor en sus archivos. Después, una de
tres:

- **Darle otra hora:** apretar «Reprogramar» en su fila de «Se quemó» (o en la píldora roja de
  la lista), elegir una fecha y hora futuras, en la zona de Tu Cuenta, y «Guardar». La ventana
  se cierra y la fila sale de «Se quemó». Ojo: la hora nueva es la del post entero, así que
  si otra de sus redes todavía esperaba, también se mueve. Las redes donde ya salió no se
  vuelven a publicar; si el post había fallado en otra red más, esa sigue en «Se quemó» con
  su propio «Reprogramar».
- **Reintentar ya:** «Subir ahora» en la tarjeta de la lista. Devuelve los destinos quemados a
  la cola y publica en el acto. Lo que la red ya había recibido en un intento anterior no se
  sube de nuevo: primero se le pregunta cómo terminó.
- **Corregirlo y reintentar:** «Editar», arreglar lo que dice el motivo (por ejemplo, dejar
  un solo video para YouTube) y «Guardar» sin tocar la fecha. Los destinos quemados que sigan marcados
  vuelven a «Programado» y salen en la pasada siguiente (o a su hora, si todavía no llega).
  Si se cambia la fecha, tiene que ser futura. Si YouTube, Facebook o TikTok ya tenían el video
  de un intento anterior, cambiar solo el texto no lo cambia allá (en Instagram sí): el intento
  siguiente le pregunta a la red por ese mismo video. Para que suba otro, cambiar el archivo.

### Para sacar una red de un post sin borrarlo

1. «Editar» en la lista.
2. En «Cuentas», desmarcar esa red.
3. «Guardar».

No se puede con una red donde ya salió, ni dejar sin ninguna cuenta un post que todavía no
salió en ninguna (para eso está «Eliminar»). Sirve también para descartar un destino quemado
de un post que ya salió en otras redes.

### Para borrar un post

Apretar «Eliminar» en su tarjeta de la lista, o «Eliminar» en el editor, y aceptar la
pregunta «¿Eliminar este post? Se borra de La Parrilla y ya no sale en ninguna red.». No se
puede deshacer. Solo funciona si no salió ni se está publicando en ninguna red; si ya salió en
alguna, hay que borrarlo en la red misma.

## Mensajes que puede ver

### En la pantalla

| Lo que dice la pantalla | Qué significa | Qué hacer |
|---|---|---|
| «Programado.» | Lo que se programó desde el panel quedó guardado | Nada; está en el calendario |
| «Conecta tu primera red» | No hay ninguna red conectada | «Ir a Los Fierros →» y conectar una |
| «+ Poner algo», en el medio de un día con los fierros en gris ceniza (con mouse, al pasar por encima) | Ese día, de hoy en adelante, no tiene nada programado | Apretarlo para programar ahí |
| Un día con los fierros en gris ceniza y nada encima, sin «+» | Ese día ya pasó y no tuvo nada | Nada |
| Bloques sin texto que se encienden y se apagan de a poco, en tonos de brasa | La pantalla está cargando | Esperar |
| «Ayer no salió nada.» | Ningún corte de ayer salió en ninguna red | Si algo debía salir, mirar «Se quemó» |
| El motivo en rojo bajo una fila de «Se quemó» | Por qué no salió en esa red (ver «Motivos de un destino que no salió») | El botón de abajo: «Reconectar» o «Cambiar el archivo» cuando el motivo lo pide; si no, «Reprogramar» |
| «Algo se rompió», con «No fue nada que hicieras. Vuelve a intentarlo; el detalle quedó en la consola del navegador.» (a veces con «Si se repite, este código ayuda a encontrarlo: <código>.») y el botón «Reintentar» | Algo falló en el servidor; no fue la persona. Si falló la pantalla principal de La Parrilla, no aparece «Ir a La Parrilla» | «Reintentar» |

### Al programar

| Lo que dice la pantalla | Qué significa | Qué hacer |
|---|---|---|
| «Elige al menos una cuenta.» | No hay ninguna cuenta marcada | Marcar al menos una en «Cuentas» |
| «El permiso de <Red> · <usuario> vence el <día> a las HH:MM, antes de que salga esto: así no va a salir ahí. Reconéctala en Los Fierros antes, o elige un día anterior.», en ámbar debajo de las fichas | El permiso de esa cuenta vence antes de la hora elegida: así como está, el post se quemaría en esa red | Reconectarla en Los Fierros, o elegir un día anterior; no impide programar |
| «Escribe un texto o adjunta un archivo.» | No hay ni texto ni archivos | Agregar uno de los dos |
| «La fecha no se entendió.» | La fecha está vacía o incompleta | Completar día y hora |
| «La hora debe estar en el futuro.» | La hora elegida ya pasó (pasa con un borrador que tenía una fecha que ya llegó) | Elegir una futura, o «Ahora» |
| «Máximo diez archivos por publicación.» | Más de diez archivos (si TikTok es la única red, admite hasta 35 fotos) | Quitar archivos con su ✕ |
| «Una de las cuentas elegidas no es tuya.» | Una cuenta dejó de existir mientras la pantalla estaba abierta | Cerrar el panel (queda el borrador) y volver a abrirlo desde «Borradores (<N>)» |
| «Ese borrador ya no existe.» | El borrador abierto en el compositor ya se programó (en otra pestaña o en el teléfono) o se descartó: un borrador no se programa dos veces | Mirar el calendario: si ya está programado, no hay nada que hacer; si no, cerrar el panel y armarlo de nuevo con «Nueva publicación» |
| «El archivo supera los 500 MB.», al apretar «Programar» | Un archivo de la lista, ya subido, pesa más que el máximo: se mira lo que de verdad quedó en el almacenamiento | Quitarlo con su ✕ y subir uno más liviano |
| «La cuenta <usuario> no está conectada. Vuelve a conectarla en Los Fierros.» | Se desconectó | Reconectarla en Los Fierros y volver: lo escrito sigue en «Borradores» |
| «Espera a que terminen de subir los archivos.» | Se intentó programar mientras subían archivos | Esperar a que aparezcan en la lista y volver a apretar «Programar» |
| «Un archivo no llegó: reintenta o quítalo antes de programar.» | Se apretó «Programar» con un archivo que no llegó (con borde rojo y «No llegó») | «Reintentar» en su miniatura, o quitarlo con su ✕ |
| «Un archivo no es del almacén.», «Falta subir un archivo.» o «El cuerpo no se entendió.» | Un archivo de la lista ya no está en el almacenamiento, o la subida quedó a medias | Quitar los archivos de la lista con su ✕, volver a elegirlos y programar |

### Al subir archivos

Salen en rojo debajo de la lista de archivos, apenas falla la subida. Ninguno de los archivos
de esa tanda queda: hay que volver a elegirlos.

| Lo que dice la pantalla | Qué significa | Qué hacer |
|---|---|---|
| «Llegando: <N> de <M>.», en «Así va a quedar», y «En cola» o «<N> %» en las miniaturas | Están subiendo los archivos recién elegidos, de a uno | Esperar: «Programar» se enciende cuando llegan todos |
| «Un archivo no llegó: reintenta o quítalo. Los que siguen esperan.», y «No llegó» en una miniatura con borde rojo | Ese archivo no pudo subir; el error exacto sale en rojo debajo de las miniaturas | «Reintentar» en esa miniatura, o quitarlo con su ✕ |
| «El archivo supera los 500 MB.» | Un archivo pasa del máximo | Achicarlo |
| «Ese tipo de archivo no se puede publicar.» | No es uno de los formatos que se publican: fotos JPG, PNG, GIF o WebP; videos MP4, MOV o WebM | Elegir otro, o exportarlo a uno de esos |
| «No se pudo preparar la subida. (<código>)», «No se pudo subir el archivo. (<código>)» o «No se pudo subir el archivo.» | Falló la conexión al subir | Volver a elegirlos; si se repite, avisar a quien administra el sitio |
| «Falta configurar Cloudflare R2 (R2_*).» | El sitio no tiene almacenamiento configurado | Avisar a quien administra el sitio |

### Borradores

| Lo que dice la pantalla | Qué significa | Qué hacer |
|---|---|---|
| «Guardando borrador…» | Se está guardando lo escrito | Nada |
| «Borrador guardado.» | Lo escrito quedó guardado; se puede cerrar el panel sin perderlo | Nada |
| «No se pudo guardar el borrador.» | El último guardado falló | Hacer cualquier cambio para que lo intente de nuevo; si sigue fallando, copiar el texto antes de cerrar |
| «Este borrador ya no existe: se programó o se descartó en otra pestaña o en el teléfono. Cierra el panel para ver cómo quedó.» | Ese mismo borrador se programó o se descartó en otra pestaña o ventana, o en la app del teléfono; este panel dejó de guardar y «Programar» quedó apagado | Cerrar el panel y mirar el calendario. Si no estaba programado y se quiere, abrir «Nueva publicación» y escribirlo de nuevo |
| «¿Descartar este borrador? Lo escrito y los archivos elegidos se pierden.» | La pregunta de «Descartar» | Aceptar para borrarlo; cancelar para seguir escribiendo |
| «Ese creativo ya no está en el mesón.» | Al programar un borrador que vino del mesón, su creativo ya no estaba esperando en un borrador | Recargar La Parrilla y mirar el mesón, en La Cocina |
| «No tienes borradores.» | No hay ningún borrador guardado (o el que se pidió ya no existe y era el último) | Nada |

### Por red

| Lo que dice la pantalla | Qué significa | Qué hacer |
|---|---|---|
| «Instagram, YouTube y TikTok necesitan al menos un archivo.» | Hay una de esas redes marcada y ningún archivo | Agregar archivo o desmarcar esa red |
| «Threads todavía no está disponible en Tu Parrilla: próximamente.» (o «X / Twitter todavía no está disponible en Tu Parrilla: próximamente.») | Una cuenta de Threads o de X quedó entre los destinos de un post programado antes de que esas redes quedaran en «Próximamente» | Desmarcarla en el editor |
| «El texto es demasiado largo para Instagram.» | Más de 2200 caracteres, vaya a la red que vaya (pasa en el editor o el CSV) | Acortarlo |
| «TikTok recibe un video, o hasta 35 fotos JPG o WebP.» | Con TikTok marcado: dos videos, video con fotos, más de 35 fotos, o un formato que no acepta (por ejemplo PNG) | Dejar un video MP4, MOV o WebM, o fotos JPG o WebP |
| «Un trial reel es un solo video, sin fotos.» | En el editor se cambiaron los archivos de un trial reel | Dejar exactamente un video |

YouTube publica exactamente un video y nada más, y Facebook no mezcla video con fotos. La
pantalla no frena esos casos al programar: fallan al publicar (ver la tabla de motivos, al
final de esta sección).

### TikTok

| Lo que dice la pantalla | Qué significa | Qué hacer |
|---|---|---|
| «Leyendo tu cuenta…» | Está preguntando a TikTok | Esperar |
| «Se publicará en la cuenta <nombre>» | TikTok contestó; esa es la cuenta | Nada |
| «Conecta TikTok en Los Fierros antes de programar.» | La cuenta no tiene conexión válida | Reconectarla en Los Fierros |
| «Reconecta TikTok para autorizar la publicación.» | TikTok quitó o venció el permiso | Reconectarla en Los Fierros |
| «No pude leer tu cuenta de TikTok.» | TikTok no contestó | Se puede programar igual: se ofrecen las cuatro privacidades y se vuelve a comprobar al publicar |
| «TikTok necesita que elijas la privacidad.» | Falta «Quién puede verlo» | Elegirla en el bloque de esa cuenta |
| «Un contenido patrocinado no puede ser privado. Vuelve a elegir quién puede verlo.» o «Un contenido patrocinado no puede ser privado.» | «Contenido patrocinado» con «Solo yo», o sin privacidad elegida | Elegir otra privacidad, o «Mi marca» |
| «Las opciones de la red no se entendieron.» | El formulario llegó raro | Cerrar el panel, volver a abrir el borrador desde «Borradores (<N>)» y revisar el bloque de TikTok |
| «El archivo cumple lo que pide TikTok.» / «Los archivos cumplen lo que pide TikTok.» | La revisión no encontró problemas | Nada |
| «TikTok va a rechazar esto:» seguido de «<archivo>: pesa <N> MB y TikTok acepta hasta 20 MB por foto.» | Foto muy pesada | Comprimirla |
| «<archivo>: mide <ancho>×<alto> y TikTok no pasa de 1080p en fotos: redúcela a 1080 px de lado corto.» | Foto de más de 1080 px en su lado corto | Achicarla |
| «<archivo>: mide <ancho>×<alto> y TikTok pide al menos 360 px de lado.» | Video muy chico | Usar uno más grande |
| «<archivo>: mide <ancho>×<alto> y TikTok no pasa de 4096 px de lado.» | Video muy grande | Achicarlo |
| «<archivo>: dura <N> minutos y TikTok acepta hasta 10 por la API.» | Video de más de diez minutos | Cortarlo |
| «<archivo>: pesa <N> MB y TikTok acepta hasta 4 GB.» | Video muy pesado | Comprimirlo |

Con dos cuentas de TikTok marcadas, las frases de opciones van precedidas del usuario de la
cuenta, entre comillas angulares y seguido de dos puntos, para saber en cuál de los dos
bloques está el problema. Si un mismo archivo tiene varios problemas, van en la misma línea
separados por punto y coma.

### Respuesta automática

| Lo que dice la pantalla | Qué significa | Qué hacer |
|---|---|---|
| «La palabra clave es una sola palabra, sin espacios, hasta 30 letras.» | La palabra tiene espacios, símbolos o es muy larga | Dejar una sola palabra de letras y números |
| «El mensaje del privado va de 1 a 1000 caracteres.» | Hay palabra pero el «Mensaje» está vacío o es muy largo | Escribirlo o acortarlo |
| «La respuesta pública va de 1 a 300 caracteres.» | La «Respuesta pública» es muy larga | Acortarla |
| «El documento tiene que ser una URL absoluta a un PDF de hasta 25 MB.» | Solo en el CSV: el PDF de la columna `regla` no se pudo leer o no es un PDF que quepa | Usar un enlace de descarga directa a un PDF de hasta 25 MB |

### Carga por CSV

Además de las frases de las tablas de red, de TikTok y de respuesta automática, cada fila
puede decir:

| Lo que dice la pantalla | Qué significa | Qué hacer |
|---|---|---|
| «Adjunta un archivo CSV.» | Se apretó «Cargar lote» sin archivo | Elegir el archivo |
| «El CSV no trae filas de posts.» | Solo trae el encabezado | Agregar filas |
| «Máximo 50 posts por lote.» | Más de 50 filas | Partirlo en varios archivos |
| «El encabezado del CSV debe ser exactamente: fecha,texto,redes,media — con portada opcional como quinta columna, opciones como sexta, regla como séptima y cuentas como octava.» | El encabezado no calza | Copiar las columnas en ese orden, sin saltarse ninguna |
| «Fila <N>: Programado» | Esa fila quedó | Nada |
| «La fecha no se entendió (usa YYYY-MM-DD HH:MM).» | Fecha en otro formato | Escribirla como `2026-10-20 19:00` |
| «Elige al menos una cuenta o una red.» | `redes` y `cuentas` vacías | Llenar una |
| «Red desconocida o sin publicación: <red>.» | Nombre de red mal escrito | Usar `instagram`, `facebook`, `youtube` o `tiktok` |
| «Threads todavía no está disponible en Tu Parrilla: próximamente.» (o «X / Twitter todavía no está disponible en Tu Parrilla: próximamente.») | La fila nombra `threads` o `x`, que están en «Próximamente» | Sacar esa red de la fila |
| «Hay redes repetidas en la fila.» | La misma red dos veces | Dejarla una vez |
| «No hay una cuenta de <red> conectada.» | No hay cuenta conectada de esa red | Conectarla en Los Fierros, o sacar esa red |
| «Tienes <N> cuentas de <red> (<usuarios>). Elige cuál con «cuentas».» | Dos cuentas de la misma red | Usar la columna `cuentas` |
| «No se pudo leer una media de la fila.» | Un enlace de `media` o `portada` no se pudo descargar, o no era imagen ni video (pasa con enlaces de Drive que abren una página) | Usar enlaces de descarga directa |
| «Al lote se le acabó el tiempo antes de terminar esta fila. Reenvíala.» | El archivo traía tantos videos pesados que no alcanzaron todos en el tiempo de una carga; las filas que dicen «Programado» sí quedaron | Subir un CSV solo con las filas que dicen esto |
| «La portada requiere un video en media.» | Portada sin video | Quitar la portada o agregar el video |
| «La portada debe ser una imagen.» | La portada es un video u otra cosa | Usar una imagen |
| «La portada debe ser JPG o PNG.» | Portada GIF, WebP u otro formato | Convertirla |
| «Una de las cuentas elegidas no es tuya.» | Un identificador de `cuentas` no es de esta persona | Copiarlo de nuevo desde Los Fierros |
| «La cuenta <usuario> no está conectada. Vuelve a conectarla en Los Fierros.» | La cuenta de `cuentas` está desconectada | Reconectarla en Los Fierros |
| ««<red>» en opciones es ambiguo: la fila tiene <N> cuentas de esa red (<usuarios>). Usa el id de cada cuenta como clave.» | `opciones` nombra una red que tiene dos cuentas en la fila | Usar el identificador de cada cuenta |
| ««<clave1>» y «<clave2>» en opciones nombran el mismo destino. Deja una sola clave por destino.» | Dos claves de `opciones` apuntan a la misma cuenta | Dejar una |
| «No se pudo guardar la fila. Inténtalo de nuevo.» | Falla pasajera | Subir de nuevo solo esa fila |

### Lista, «Se quemó», «Subir ahora», «Reprogramar» y «Eliminar»

| Lo que dice la pantalla | Qué significa | Qué hacer |
|---|---|---|
| «Nada programado todavía.» | No hay nada programado | Programar algo |
| «¿Subirlo ahora, sin esperar la hora programada? Se publica en tus redes de inmediato.» | Pregunta de «Subir ahora» | Aceptar para publicar ya; cancelar para dejarlo como estaba |
| «¿Eliminar este post? Se borra de La Parrilla y ya no sale en ninguna red.» | Pregunta de «Eliminar», en la lista y en el editor | Aceptar para borrarlo; cancelar para dejarlo como estaba |
| Una lista con las partes que apliquen, separadas por comas y con punto final: «<N> publicado» (o «publicados»), «<N> en proceso», «<N> en espera de la red», «<N> para reintentar», «<N> con error» | Cómo le fue a «Subir ahora» | Lo que está en proceso o en espera de la red termina solo; para lo que quedó para reintentar o con error, leer el motivo en la píldora |
| «Este post no tenía destinos pendientes.» | Ya había salido en todas sus redes | Nada |
| «El post ya no existe.» | Se borró antes | Recargar |
| «Ya se publicó (o está publicando): elimínalo en la red.» | Se intentó eliminar algo que ya salió en alguna red, o que el publicador está subiendo en ese momento | Borrarlo en la red misma; para sacar solo las redes que no salieron, desmarcarlas en el editor. Si no había salido en ninguna, era el publicador subiéndolo: recargar en un minuto y ver cómo quedó |
| «La hora debe estar en el futuro.» | En «Reprogramar», la hora ya pasó | Elegir una futura |
| «Ese destino ya no existe.» | En «Reprogramar» o en «Archivar»: esa red del post, o el post entero, se borró mientras la ventana estaba abierta | Recargar |
| «Ese destino no está quemado: solo lo quemado se archiva o se desarchiva.» | En «Archivar» o «Desarchivar»: ese destino ya no está quemado (alguien lo reprogramó, o salió con «Subir ahora») | Recargar y ver cómo quedó |

### Editor

| Lo que dice la pantalla | Qué significa | Qué hacer |
|---|---|---|
| «Hay una publicación en curso. Vuelve en un minuto.» | Una red está procesando la publicación (el editor queda bloqueado), o el publicador la estaba subiendo al apretar «Guardar» y no se guardó nada | Esperar un minuto y recargar |
| «Los cambios no tocan lo publicado.» | Algo ya salió (el recuadro de arriba dice dónde) | Lo que se cambie solo vale para lo que falta salir |
| «No se puede quitar una cuenta en la que ya se publicó.» | Se intentó desmarcar una red donde ya salió | Dejarla marcada |
| «No se pudo leer una media por URL.» | Un enlace de «Agregar por URL» o de la portada no se pudo descargar | Usar un enlace de descarga directa |
| «La portada requiere un video en media.» | Portada sin video. El de un post que ya salió en todas sus redes cuenta aunque ya no esté en el sitio: guardar ese post con su portada no da este error | Quitar la portada o agregar el video |
| «La portada debe ser una imagen.» / «La portada debe ser JPG o PNG.» | La portada no sirve | Usar una imagen JPG o PNG |
| «Los atributos deben ser un objeto plano de valores simples.» | El JSON de «Atributos» está mal escrito o es demasiado grande | Corregirlo, o dejar el cuadro vacío |
| «El post ya no existe.» | Se borró mientras estaba abierto | Volver a La Parrilla |
| «Algo se rompió», con «No fue nada que hicieras. Vuelve a intentarlo; el detalle quedó en la consola del navegador.» (a veces con «Si se repite, este código ayuda a encontrarlo: <código>.») y los botones «Reintentar» e «Ir a La Parrilla» | Algo falló en el servidor | «Reintentar»; si se repite, anotar el código y avisar a quien administra el sitio |
| «Ese tipo de archivo no se puede publicar.», «El archivo supera los 500 MB.», «No se pudo preparar la subida. (<código>)» o «No se pudo subir el archivo. (<código>)», al apretar «Guardar» | Un archivo de «Agregar archivos» no pudo subir; no se guardó nada | Cambiar el archivo, o volver a apretar «Guardar» si fue la conexión |
| «No encontramos esa página» | El post no existe o no es de esta persona | Volver a La Parrilla |

### Motivos de un destino que no salió

Aparecen en «Se quemó», en el editor del post, en la píldora de la lista, al dejar el mouse
sobre su fila del calendario y en el correo. Mientras el destino dice «Reintentando»,
se reintenta solo; cuando dice «Falló», hay que actuar (ver la tarea de arreglar un post
quemado, más arriba).

Los de Threads y de X solo aparecen en un post programado antes de que esas redes quedaran en
«Próximamente». Un destino así ya no se intenta: se quema en la primera pasada con «Threads
todavía no está disponible en Tu Parrilla: próximamente.» (o lo mismo con X), y ni «Subir
ahora» ni «Reprogramar» lo hacen salir. Para sacarlo de «Se quemó», desmarcar esa red en el
editor.

| Lo que dice la pantalla | Qué significa | Qué hacer |
|---|---|---|
| «No se pudo hablar con la red. Se reintentará.» | Falla de conexión, o la red no contestó a tiempo | Esperar; si se quema, «Subir ahora» |
| «Instagram llegó a su tope de publicaciones por día: sale apenas se libere un cupo.» | La cuenta ya publicó por la API lo máximo que Instagram deja en 24 horas. No es un fallo: no gasta intentos ni se quema; se vuelve a probar cada hora y sale cuando se libera un cupo, 24 horas después de una publicación anterior | Esperar: sale solo |
| «La cuenta no está conectada. Reconéctala y reprograma.» | La cuenta perdió la conexión | Reconectar en Los Fierros y «Reprogramar» |
| «La red no terminó de procesar el video.» | Pasó 24 horas en «Publicando…», contadas desde que empezó a publicarse. No se reintenta solo: la red ya tiene el video, y subirlo de nuevo dejaría dos | «Subir ahora» o «Reprogramar»: primero se le pregunta a la red por ese mismo video, y si terminó, queda publicado sin subir otro. Si vuelve a quemarse con esta frase, la red no lo va a terminar: revisarlo en la red (puede haber quedado ahí a medias), «Eliminar» el post y programarlo de nuevo |
| «El archivo supera los 500 MB.» | El video de un post programado antes de que se mirara el tamaño pasa del máximo; YouTube no lo intenta | En el editor, cambiar el video por uno más liviano |
| «La publicación se cortó a la mitad y ya no quedan intentos. Revisa el archivo y reprográmala.» | El último intento se cortó a la mitad —la pasada del publicador terminó antes de que la red contestara, sobre todo con videos muy pesados— y ya no quedan intentos | Revisar el archivo (un video más liviano sube más rápido) y «Reprogramar» |
| «Threads todavía no está disponible en Tu Parrilla: próximamente.» / «X todavía no está disponible en Tu Parrilla: próximamente.» | Un destino de antes a una red que hoy está en «Próximamente» | Desmarcar esa red en el editor |
| «Instagram rechazó la publicación.» | Instagram dijo que no, sin decir por qué | «Subir ahora» o «Reprogramar»; si vuelve a fallar, revisar el archivo y el texto |
| «Instagram rechazó la publicación en @cuenta: «…» (código …).» | Instagram dijo que no, y entre comillas va lo que dijo Meta, en sus palabras; se reintenta como cualquier fallo | Leer lo que dijo Meta: si es algo de la cuenta, reintentar no lo cambia; si es el archivo o el texto, corregirlo en el editor |
| «@cuenta no tiene trial reels: Instagram los da solo a cuentas con un mínimo de seguidores, y esta no lo alcanza. Prográmalo como reel normal o en otra cuenta.» | La cuenta no tiene los seguidores que Instagram pide para los trial reels; se quema al primer intento, y los demás trial reels de esa cuenta van a fallar igual | El editor no apaga el trial reel: si nada salió, «Eliminar» y programarlo de nuevo sin trial reel; si otras redes ya salieron, desmarcar Instagram en el editor y programarlo aparte |
| «@cuenta no tiene trial reels disponibles, probablemente porque Instagram no le habilitó la función. Prográmalo como reel normal o en otra cuenta. Instagram dice: «…».» | Instagram rechazó el trial reel por otro motivo, que va al final en sus palabras; se quema al primer intento | Lo mismo que la fila de arriba |
| «Facebook rechazó la publicación.» | Facebook dijo que no | «Subir ahora» o «Reprogramar»; si vuelve a fallar, revisar el archivo y el texto |
| «Facebook no admite mezclar video y fotos en un post.» | Hay video y fotos | En el editor, quitar las fotos o el video; o desmarcar Facebook y programarlo aparte |
| «Threads rechazó la publicación.» | Threads dijo que no | «Subir ahora» o «Reprogramar»; si vuelve a fallar, revisar el archivo y el texto |
| «Threads recibe un solo archivo por post.» | Más de un archivo | Dejar uno en el editor, o desmarcar Threads y programarlo aparte |
| «X rechazó la publicación.» | X dijo que no | «Subir ahora» o «Reprogramar»; si vuelve a fallar, revisar el archivo y el texto |
| «X aún no recibe video desde el calendario.» / «X recibe hasta cuatro imágenes.» | El archivo no sirve para X | Ajustar los archivos o sacar X |
| «YouTube solo recibe video.» | Para YouTube hay fotos o más de un archivo | YouTube necesita exactamente un video: dejar solo ese en el editor, o desmarcar YouTube y programarlo aparte |
| «YouTube rechazó el video.» | YouTube dijo que no | Revisar el video |
| «TikTok rechazó la publicación.» | TikTok dijo que no | «Subir ahora» o «Reprogramar»; si vuelve a fallar, revisar el archivo |
| «TikTok no acepta el archivo: revisa formato, tamaño o duración.» | El archivo no pasó los límites de TikTok | Cambiar el archivo |
| «TikTok ya no permite esa privacidad en tu cuenta; edita la publicación.» | La privacidad elegida ya no está permitida | El editor no cambia la privacidad: si nada salió, eliminar y programar de nuevo; si no, desmarcar TikTok y programarlo aparte |
| «TikTok solo publica en cuentas privadas hasta que apruebe la app: pon tu cuenta de TikTok en privada y reprograma.» | TikTok rechazó publicar desde una cuenta pública, como hace con las apps sin auditoría. La de Tu Parrilla ya está auditada, así que no debería aparecer | Avisar a quien administra el sitio y, mientras tanto, ponerla en privada en TikTok y «Reprogramar» |
| «Tienes 5 borradores pendientes en TikTok; publica alguno antes.» | La bandeja de TikTok está llena (son borradores de la app de TikTok, no los de Tu Parrilla) | Publicar o borrar borradores en la app de TikTok y «Reprogramar» |
| «Reconecta TikTok para autorizar la publicación.» | TikTok quitó el permiso | Reconectar en Los Fierros y «Reprogramar» |
| «TikTok no reconoce el dominio de tus archivos; verifícalo en el portal.» | Problema de configuración del sitio con TikTok | Avisar a quien administra el sitio |
| «TikTok necesita que elijas la privacidad.» / «TikTok recibe un video, o hasta 35 fotos JPG o WebP.» | Las opciones o los archivos no sirven para TikTok | Si nada salió, «Eliminar» y programarlo de nuevo; si no, desmarcar TikTok y programarlo aparte |

## Si el humano dice…

- **¿Dónde está El Fuego? / No encuentro el botón Poner al fuego.** Ya no existen: El Fuego
  se fundió en La Parrilla, que es ahora la entrada del panel. Lo que falló está en «Se
  quemó», arriba; la semana, en el calendario; lo de ayer, en el pie; y para programar está
  «Nueva publicación».
- **No encuentro dónde programar.** «Nueva publicación», el botón naranjo arriba a la derecha
  de La Parrilla, o el «+» de un día en el calendario.
- **Perdí lo que estaba escribiendo / se me cerró el panel.** Se guarda solo como borrador:
  «Borradores (<N>)», arriba a la derecha. Si ese botón no aparece, no quedó nada guardado: no
  tenía texto, archivo ni palabra clave, el guardado falló («No se pudo guardar el
  borrador.»), o se descartó.
- **No veo el botón Borradores.** Solo aparece cuando hay al menos un borrador.
- **Hay una fila punteada en el calendario.** Es un borrador con fecha: todavía no está
  programado y no va a salir hasta abrirlo y apretar «Programar».
- **El día dice Apagada pero tiene algo.** Lo que tiene son borradores, que no cuentan para
  el fuego del día porque no van a salir solos.
- **Abrí un borrador y me salió la lista de borradores.** Ese borrador ya no existe: se
  programó o se descartó.
- **Empecé algo en el teléfono y quiero terminarlo acá (o al revés).** Es el mismo borrador:
  está en «Borradores (<N>)» en los dos lados ([La app del teléfono](app-movil.md)).
- **Programé un borrador y desapareció de Borradores.** Es lo esperado: ahora es una
  publicación y está en el calendario.
- **Mi borrador no aparece en el calendario.** Solo salen los que tienen fecha, en su semana;
  los demás están en «Borradores (<N>)».
- **El borrador volvió sin Ahora / sin fecha.** «Ahora» no se guarda en el borrador: hay que
  encenderlo de nuevo.
- **No veo el + en un día.** Solo lo tienen hoy y los días que vienen.
- **Quiero ver un día cuenta por cuenta** o **¿cuántas veces sale cada cuenta mañana?** El
  nombre del día en el calendario, o «Día»: una columna por cuenta, con su propio fuego.
- **En la vista Día un post aparece dos veces.** Sale a dos cuentas: es un bloque por cuenta,
  y al final de cada bloque van los íconos de las otras (al dejar el mouse encima, «También
  en: …»).
- **¿Hay una vista como Google Calendar, por hora?** Sí: «Por hora», al lado de «Calendario»,
  muestra la semana con las horas hacia abajo. «Día» muestra un día, por cuenta y por hora.
- **En «Por hora» no se lee el texto.** No cabe: aparece al dejar el mouse encima del bloque, y
  está en «Día», en la lista y en el editor.
- **¿Qué es la franja de color de cada bloque en «Por hora»?** La red a la que sale, en su
  color (Instagram rosado, TikTok gris, YouTube rojo, Facebook azul); partida si sale a varias.
- **Quiero ver solo Facebook (o solo una red).** El filtro por red, arriba de lo programado a
  la derecha: el botón de esa red. «Todas» vuelve a mostrar todo.
- **Quiero ver solo una de mis cuentas de TikTok.** Pasar el mouse por «TikTok» en el filtro y
  elegirla en «Por cuenta»; en el teléfono, apretar «TikTok» y elegirla en el renglón que
  aparece debajo.
- **Programé algo y no aparece.** Mira si hay un filtro puesto: un botón de red con borde
  naranjo, arriba a la derecha de lo programado. Lo de otras redes no se ve hasta apretar
  «Todas».
- **¿Qué es cada color de los íconos?** El de la red: Instagram rosado, TikTok gris, YouTube
  rojo y Facebook azul. El rojo de YouTube no es un fallo: un fallo tiñe el chip entero de rojo
  y lleva «✕».
- **Filtré una red y «Se quemó» sigue mostrando otras.** «Se quemó» no obedece el filtro: lo
  que falló se ve siempre. Tiene su propio filtro por red, adentro, al abrirla.
- **En la vista Día no aparece una cuenta.** Está desconectada y ese día no tiene nada:
  reconectarla en [Los Fierros](los-fierros.md).
- **La fecha viene puesta a las 9.** Es lo que propone al abrir desde un día del calendario;
  se cambia en «Fecha y hora».
- **Elegí un archivo y el botón Programar está gris.** Está subiendo («En cola» o «<N> %» en
  su miniatura): esperar a que llegue. Si dice «No llegó», apretar «Reintentar» o quitarlo.
- **Quiero cambiar el orden de los archivos.** En el compositor, quitarlos con su ✕ y volver a
  elegirlos en el orden que se quiere; o programar y reordenar en el editor con las flechas.
- **¿Dónde subo un CSV? / No encuentro la carga masiva.** «Subir CSV», arriba a la derecha de
  La Parrilla.
- **No me deja marcar una cuenta.** Dice «reconéctala» al lado: hay que reconectarla en
  [Los Fierros](los-fierros.md). Si no aparece ninguna, no hay cuentas conectadas.
- **La pantalla dice Conecta tu primera red.** No hay ninguna red conectada. Se conecta en
  Los Fierros, dentro del botón «Ajustes».
- **El botón Programar no hace nada / el navegador me marca un campo.** Falta «Fecha y
  hora» (o apretar «Ahora»), o falta «Quién puede verlo» en un bloque de TikTok.
- **No veo lo de trial reel.** Solo aparece con exactamente un archivo, que sea video, y
  una cuenta de Instagram marcada.
- **No veo Dúos ni Pegar.** No aparecen cuando todos los archivos son fotos, ni cuando
  está encendido «Enviar como borrador a mi bandeja de TikTok».
- **Programé con Ahora y todavía no sale.** Sale en la pasada siguiente del publicador,
  en unos minutos. Para que sea ya: «Subir ahora» en la lista.
- **Dice Reintentando.** Falló un intento y se va a volver a probar solo: a los quince minutos
  la primera vez y a las dos horas la segunda. El motivo va al lado. Si el motivo pide
  reconectar, conviene hacerlo ya: si se reconecta antes del intento siguiente, el post sale.
- **Se me quemó un post.** Leer el motivo en «Se quemó», arriba de la pantalla, y seguir la
  tarea de arreglar un post quemado.
- **No veo la sección Se quemó.** No hay nada que haya fallado: la sección solo aparece cuando
  hay algo.
- **Quiero quitar algo de Se quemó sin reprogramarlo.** No hay botón para descartarlo. La fila
  sale cuando ese destino vuelve a la cola (con «Reprogramar», «Subir ahora» o desde el editor),
  cuando se desmarca esa red en el editor o cuando se borra el post.
- **Hay fallos viejos de hace semanas en Se quemó.** Es lo esperado: la sección no tiene fecha
  límite, y un fallo se queda hasta que alguien lo arregla.
- **Ayer salió algo y el pie no dice miradas.** Las redes todavía no informaron las vistas; el
  número aparece cuando llegan.
- **No veo mis números / ¿dónde están las visitas?** No están acá: en [Los
  Números](los-numeros.md), y cada publicación con los suyos en «Tus publicaciones», dentro de
  esa misma pantalla.
- **No puedo borrar un post.** Ya salió (o se está publicando) en alguna red: hay que
  borrarlo en la red. Para sacar solo las redes que faltan, desmarcarlas en el editor.
- **Borré uno sin querer.** No hay deshacer: hay que programarlo de nuevo.
- **Quiero cambiar la privacidad de TikTok (o el trial reel) de algo ya programado.** El
  editor no lo permite. Si no ha salido en ninguna red, «Eliminar» y programarlo de nuevo.
- **En el editor no aparece mi TikTok para agregarlo.** El editor no agrega TikTok a un
  post existente: hay que programar uno nuevo para TikTok.
- **Al guardar en el editor me sale Algo se rompió.** Es una falla del servidor: «Reintentar».
  Un archivo que no pudo subir no llega hasta ahí: lo dice en rojo, arriba de «Guardar».
- **¿Dónde pongo la portada?** Al programar no hay campo: se pone después en el editor,
  «Portada (solo para video)», con la dirección de una imagen JPG o PNG.
- **¿Dónde anoto el hook o el tema de un post?** Al programar no hay campo (tampoco en el
  CSV): se anota después en el editor, «Atributos (JSON del editor de contenido)», o por [la
  API](../api-llm.md). Se comparan en Los Números, «Comparar por atributo».
- **Quiero que dos posts se vean como versiones del mismo video.** En el editor de cada uno,
  ponerles en «Atributos» la misma clave `pieza`, por ejemplo `{"pieza": "chimichurri-30s"}`.
  Aparecen juntos en la pieza de cualquiera de los dos, en [Los Números](los-numeros.md).
- **¿Dónde adjunto el PDF de la respuesta automática?** En el panel no se puede; solo por
  [la API](../api-llm.md) o en la columna `regla` del CSV.
- **El CSV me dice que la hora debe estar en el futuro y copié el ejemplo.** Las fechas
  del ejemplo ya pasaron: cambiarlas.
- **Se me duplicaron posts con el CSV.** Se subió dos veces el mismo archivo: no se
  descartan repetidos. Borrar los sobrantes con «Eliminar».
- **¿De dónde saco el identificador para la columna cuentas?** De la cuenta en Los Fierros:
  la flecha de su fila abre el detalle, y es el código de «En Tu Parrilla: », con el ícono de
  copiar.
- **«Se quemó» es una sola línea y no veo qué falló.** Está plegada: un clic en «Ver», al lado
  del número. Queda abierta para la próxima vez en ese navegador.
- **El botón «Ajustes» tiene un punto.** Ámbar: el permiso de alguna cuenta vence en
  la semana. Rojo: alguna se apagó (venció o dejó de sincronizar) y lo que se programe ahí no
  va a salir. Adentro, la entrada «Los Fierros» dice cuántas («1 se enfría», «2 se
  apagaron»); en [Los Fierros](los-fierros.md), «Reconectar» en esa tarjeta.
- **Publiqué en YouTube y salió privado.** No debería: Tu Parrilla sube a YouTube como
  público, y hasta ahora así sale. Si en YouTube Studio aparece «Privado» con un candado, es
  una restricción de Google para apps sin una auditoría que todavía está en trámite: avisar
  a quien administra el sitio. Sin candado, se puede cambiar a mano en YouTube Studio.
- **En TikTok no aparece en mi perfil.** TikTok puede tardar unos minutos. Si se mandó como
  borrador de TikTok, dice «En tu bandeja de TikTok»: hay que terminarlo en la app.
- **No veo el video en el editor de un post que ya salió.** Cuando un post sale en todas sus
  redes, el video se borra del almacenamiento del sitio; las fotos y la portada se quedan. El
  corte no cambia: sigue siendo una entraña, o la tira con todos sus huesos.
- **Un video que ya salió se ve como chori, o como una tira con un hueso menos.** Solo puede
  pasar con algunos posts antiguos, de cuando el sitio no guardaba que llevaban video, en los
  que no quedó cómo saberlo: uno que fue solo a Threads o X, sin portada, o un carrusel con el
  video al final. Es solo el dibujo: lo publicado está bien.
- **La hora está corrida / el «hoy» no calza.** Las horas son las de la zona de [Tu
  Cuenta](tu-cuenta.md).
- **No encuentro un post en el calendario.** Puede estar en otra semana: «Semana anterior» /
  «Semana siguiente», o mirar la «Lista», que tiene todo.
- **En el calendario no está el botón para borrar o subir.** Esos botones están en la
  «Lista»; en el calendario, un clic en la fila abre el editor, que tiene «Eliminar».
- **¿Qué significa el dibujo de cada publicación?** La forma es el formato (entraña video, tira
  carrusel, bife foto, chori texto); el color de la carne, cómo va (rosada programada, naranja
  saliendo, dorada publicada, negra falló); cada diagonal, un destino (llena salió, punteada
  todavía no). El halo rojo y la banderita, que algo se quemó. Con borde punteado y sin
  dibujo, es un borrador. Detalle en «El corte».
- **¿Por qué una publicación tiene el borde ámbar?** Algo espera en la bandeja de TikTok, un
  destino está reintentando o una de sus cuentas tiene el fierro frío. Rojo: se quemó.
- **¿Dónde quedó la miniatura de la foto, o el texto, en el calendario?** No van en la fila:
  el corte dice el formato y el estado, y el texto aparece al dejar el mouse encima. La foto, el
  video y el texto están en el editor (un clic en la fila); el texto se ve también en «Día» y en
  la lista.
- **¿Qué es la raya naranja que dice «ahora»?** La hora de ahora, en el día de hoy del
  calendario: arriba, lo que ya tuvo su hora; abajo, lo que viene. Se corre sola.
- **¿Cómo sé qué ya salió?** En el calendario, lo que salió en todas sus redes va hundido, sin
  borde y con un «✓»; lo que viene, en la chapa con borde. Bajo el nombre de cada día, cuántos:
  «42 ✓ · 2 ✕» o «44 por salir».
- **¿Qué es la barra de colores bajo cada día?** A qué red va lo de ese día: un tramo por red,
  en su color (Instagram rosado, TikTok gris, YouTube rojo, Facebook azul), del largo de lo que
  sale a ella. Al dejar el mouse encima dice cuántos de cada una.
- **Una publicación ya pasó la raya de «ahora» y no dice que salió.** La línea se corre sola,
  pero las filas no cambian hasta recargar la página. Si al recargar sigue en la chapa, todavía
  no salió: puede estar esperando la pasada siguiente del publicador, o tener el fierro frío.
- **Cambié la fecha de un post ya publicado.** No lo vuelve a publicar: solo cambia el día
  en que aparece en el calendario.

## Lo que esta pantalla no hace

- No publica en el segundo exacto: lo programado, incluso con «Ahora», sale en la pasada
  siguiente del publicador. Solo «Subir ahora» publica en el acto.
- No publica borradores: un borrador no sale nunca solo, aunque tenga fecha y esa fecha pase.
- No cambia ni borra nada en las redes: editar lo ya publicado no toca la red, y lo publicado
  no se puede eliminar desde aquí.
- No pregunta antes de «Eliminar», ni deja deshacer un borrado ni un «Descartar».
- No tiene una forma de descartar un destino quemado: se reprograma, se sube, se desmarca en el
  editor o se borra el post entero.
- No cambia las opciones de TikTok ni el trial reel de algo ya programado, ni agrega TikTok
  desde el editor.
- No reordena los archivos en el compositor: se quitan y se vuelven a elegir, o se ordenan en
  el editor después de programar.
- No guarda «Ahora» en un borrador, ni cuenta los borradores en el fuego del día.
- No muestra los borradores en la lista, en la app del teléfono ni en la API.
- No sube la portada como archivo, ni adjunta el PDF de la respuesta automática.
- No sube archivos sueltos en la carga por CSV: solo por dirección.
- No duplica un post ni arrastra filas en el calendario, ni programa en un día que ya pasó.
- El calendario no muestra el texto en la fila (va al dejar el mouse encima y en el editor), ni
  cambia una fila sin recargar: la línea de «ahora» se corre sola, pero lo que salió mientras la
  página estaba abierta se ve al volver a cargarla.
- «Día» y «Por hora» no tienen «Subir ahora», «Eliminar» ni «Reprogramar» (están en la
  lista), y no se programa con un clic en una hora vacía: para eso está el «+» de cada columna o
  «Nueva publicación». «Día» no muestra varios días a la vez, y «Por hora» no muestra el corte
  ni el texto de cada publicación: van al dejar el mouse encima y en el editor.
- El filtro por red no esconde «Se quemó» ni cambia el pie de ayer, y no se recuerda entre
  visitas: vive en la dirección (`?red=`), y entrar a La Parrilla desde la barra lo saca.
- No publica en Threads ni en X / Twitter, que dicen «Próximamente» (ver [Los Fierros](los-fierros.md)).
- No conecta cuentas: eso es [Los Fierros](los-fierros.md). No muestra cómo le fue a lo
  publicado: eso es [Los Números](los-numeros.md) (cómo te fue en las redes y en tu página; cada
  publicación, en «Tus publicaciones», un clic adentro). No responde
  comentarios: eso es [La Mesa](la-mesa.md) (lo que te responden y tus respuestas). No cambia
  la zona horaria: eso es [Tu Cuenta](tu-cuenta.md).

## Para quien mantiene esta página

Lo que describe esta página sale de:

- La pantalla, sus paneles y el editor:
  - `src/app/admin/(dash)/schedule/page.tsx`
  - `src/app/admin/(dash)/schedule/panel-lateral.tsx`
  - `src/app/admin/(dash)/schedule/composer.tsx`
  - `src/app/admin/(dash)/schedule/vista-previa.tsx`, `src/app/admin/(dash)/schedule/archivos.tsx` y `src/app/admin/(dash)/schedule/subidas.ts` («Así va a quedar», los archivos y su cola)
  - `src/app/admin/(dash)/schedule/vence.ts` (el aviso de que el permiso de una cuenta vence antes de la hora elegida)
  - `src/lib/subida-directa.ts` (la subida a R2, con su avance)
  - `src/app/admin/(dash)/schedule/lista-borradores.tsx`
  - `src/app/admin/(dash)/schedule/batch-upload.tsx`
  - `src/app/admin/(dash)/schedule/calendar.tsx`, `src/app/admin/(dash)/schedule/semana.ts` y `src/app/admin/(dash)/schedule/linea-de-ahora.tsx` (la semana en filas: cómo va cada fila, el renglón y la mezcla de cada día, y la línea de «ahora», también la de las rejas de horas)
  - `src/app/admin/(dash)/schedule/vista-dia.tsx` y `src/app/admin/(dash)/schedule/dia.ts` (la vista «Día»)
  - `src/app/admin/(dash)/schedule/semana-por-hora.tsx` («Por hora»)
  - `src/app/admin/(dash)/schedule/reja-de-horas.tsx` y `src/app/admin/(dash)/schedule/horas.ts` (la reja de horas de «Día» y «Por hora»: el canal de las horas, los carriles y lo rayado)
  - `src/app/admin/(dash)/schedule/filtro-redes.tsx` y `src/app/admin/(dash)/schedule/filtro-red.ts` (el filtro por red)
  - `src/app/admin/(dash)/schedule/se-quemo.tsx`, `src/app/admin/(dash)/schedule/lista-quemados.tsx` y `src/app/admin/(dash)/schedule/filtro-quemados.ts` («Se quemó»)
  - `src/app/admin/(dash)/schedule/queue.tsx`
  - `src/app/admin/(dash)/schedule/reprogramar.tsx`
  - `src/app/admin/(dash)/schedule/archivar.tsx` (el botón «Archivar» / «Desarchivar»)
  - `src/app/admin/(dash)/schedule/revision-media.tsx`
  - `src/app/admin/(dash)/schedule/redes.tsx`
  - `src/app/admin/(dash)/schedule/regla-clave.tsx`
  - `src/app/admin/(dash)/schedule/tiktok-opciones.tsx`
  - `src/app/admin/(dash)/schedule/instagram-opciones.tsx`
  - `src/app/admin/(dash)/schedule/etiqueta.ts`
  - `src/app/admin/(dash)/schedule/orden.ts`
  - `src/app/admin/(dash)/schedule/enlace.ts`
  - `src/app/admin/(dash)/schedule/[id]/page.tsx`
  - `src/app/admin/(dash)/schedule/[id]/editor.tsx`
  - `src/app/admin/(dash)/schedule/[id]/destinos.tsx` (cómo va el post en cada red, arriba del editor)
  - `src/app/admin/(dash)/schedule/arreglo.ts` (qué arreglo se ofrece junto a un destino quemado)
  - `src/app/admin/(dash)/schedule/desplazar-a-hoy.tsx` (la semana corrida hasta hoy en el teléfono)
  - `src/app/admin/(dash)/schedule/loading.tsx` y `src/components/esqueleto.tsx` (la carga, con la forma de cada vista y del editor)
  - `src/app/globals.css` (la parrilla fría de un día vacío, «Poner algo» al pasar el mouse, el menú «Por cuenta» del filtro, el color de cada red, el fondo de las filas servidas y quemadas de la semana, las rayas de la reja de horas y lo rayado de lo que ya pasó, y el pulso de la carga)
- Lo que hacen sus botones (programar, guardar y descartar un borrador, guardar en el editor, reprogramar, eliminar, «Subir ahora», la carga por CSV y la lectura de la cuenta de TikTok):
  - `src/app/admin/actions.ts`
- Los borradores (qué se guarda, cuándo hay algo que guardar, la fecha que se propone para un día):
  - `src/lib/borrador.ts`
  - `src/lib/borradores.ts`
- «Se quemó» y el pie de ayer:
  - `src/lib/fuego.ts`
  - `src/lib/social/publish/cortes.ts`
- Cómo se llega y lo que rodea a la pantalla:
  - `src/app/admin/(dash)/page.tsx`
  - `src/app/admin/(dash)/nav.tsx`
  - `src/app/admin/(dash)/accounts/cuentas.tsx`
  - `src/app/admin/(dash)/analytics/publicaciones/[id]/page.tsx` («Editar atributos», que
    abre el editor desde una pieza de Los Números)
  - `src/lib/piezas.ts` (la clave `pieza` de los atributos, que el panel lee)
  - `src/app/admin/(dash)/error.tsx`
  - `src/app/not-found.tsx`
  - `src/lib/auth.ts`
- La subida de archivos:
  - `src/app/api/admin/upload-url/route.ts`
  - `src/lib/subida-directa.ts`
  - `src/lib/mobile-api.ts`
- Las reglas y las frases de error y de falla:
  - `src/lib/social/publish/validate.ts`
  - `src/lib/social/publish/limites.ts`
  - `src/lib/social/publish/opciones.ts`
  - `src/lib/social/publish/atributos.ts`
  - `src/lib/social/publish/batch.ts`
  - `src/lib/social/publish/csv.ts`
  - `src/lib/social/publish/edit.ts`
  - `src/lib/social/publish/borrar.ts`
  - `src/lib/social/publish/reprogramar.ts` (la regla de «Reprogramar», compartida con la app del teléfono)
  - `src/lib/social/publish/archivar.ts` (la regla de «Archivar», compartida con la API)
  - `src/lib/social/publish/tiktok-creador.ts`
  - `src/lib/social/publish/publisher.ts` (las esperas entre intentos, `ESPERAS_TRAS_FALLO_MS`; el reclamo, `enVuelo`; el rearme, `REARME`; las frases de los motivos)
  - `src/lib/social/publish/run.ts`
  - `src/lib/social/publish/alert.ts`
  - `src/lib/avisos/reglas.ts` (el resumen del día)
  - `src/lib/social/publish/instagram.ts`
  - `src/lib/social/publish/facebook.ts`
  - `src/lib/social/publish/threads.ts`
  - `src/lib/social/publish/x.ts`
  - `src/lib/social/publish/youtube.ts`
  - `src/lib/social/publish/tiktok.ts`
  - `src/lib/social/cuentas.ts`
  - `src/lib/social/cuenta.ts`
  - `src/lib/social/comentarios/reglas.ts`
  - `src/lib/schedule-api.ts`
- Fechas, colores, nombres y componentes:
  - `src/components/corte.tsx` (el corte dibujado)
  - `src/app/admin/(dash)/schedule/dibujo.ts` (qué se dibuja de cada corte)
  - `src/lib/schedule-week.ts`
  - `src/lib/parrilla.ts`
  - `src/lib/networks.ts`
  - `src/lib/color-de-red.ts` (el color de cada red)
  - `src/lib/vocabulario.ts`
  - `src/lib/utils.ts`
  - `src/components/ui.tsx`
  - `src/components/boton.ts`

Si cambias lo que se ve en alguno de ellos, actualiza esta página en el mismo commit.
