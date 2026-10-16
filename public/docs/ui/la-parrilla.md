# La Parrilla — lo que viene y cómo salió lo que ya se fue

`/admin/schedule` es la pestaña «La Parrilla», la primera de la barra del panel, y es la
entrada del panel: `/admin` lleva acá. El editor de cada publicación vive en
`/admin/schedule/<id>`.

La Parrilla es el calendario de publicación y la pantalla con que abre el panel. Aquí se
programa un post para una o varias cuentas (Instagram, Facebook, YouTube, Threads, X y
TikTok), se retoma lo que quedó a medio escribir (los borradores, que se guardan solos), se
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

## Cómo se llega

- Al entrar al panel con el código ([ingresar.md](ingresar.md)) se llega siempre acá, y
  `https://tu-parrilla.cl/admin` también lleva acá.
- En la barra de arriba, la pestaña «La Parrilla», la primera.
- Desde la pantalla de error de cualquier otra pantalla del panel (y del editor de un post),
  el enlace «Ir a La Parrilla».
- Quien no es admin y abre la dirección de [Los Maestros](los-maestros.md) vuelve acá.
- El correo que avisa que algo no salió termina con «Revisa el calendario en /admin/schedule
  para reprogramarla.»
- Por dirección: `https://tu-parrilla.cl/admin/schedule` abre el calendario en la semana de
  hoy. Se le puede agregar:
  - `?vista=lista`: la lista en vez del calendario (los enlaces viejos con
    `?vista=calendario` abren el calendario igual);
  - `?vista=dia`: un solo día, por cuenta (ver «El día»); con `&fecha=AAAA-MM-DD`, ese día, y
    sin ella, hoy;
  - `?semana=AAAA-MM-DD`: el calendario en la semana que contiene ese día;
  - `?componer=1`: el panel «Nueva publicación»; con `&dia=AAAA-MM-DD`, con ese día puesto
    en «Fecha y hora», y con `&cuenta=<id de la cuenta>`, con esa cuenta marcada;
  - `?borrador=<id>`: ese borrador, abierto en el compositor;
  - `?panel=borradores`: el panel «Borradores»;
  - `?panel=csv`: el panel «Subir CSV».

## Qué se ve

De arriba abajo: el encabezado con sus botones, el aviso «Programado.» (solo cuando se acaba
de programar), la tarjeta «Conecta tu primera red» (solo sin ninguna red conectada), la
sección «Se quemó» (solo si algo falló), los botones «Calendario», «Día» y «Lista» con lo
programado debajo, y el pie de ayer. El formulario para programar, la lista de borradores y la carga por
CSV no están en la página: se abren en un panel que se desliza desde la derecha (ver «El panel
lateral», más abajo).

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
al cambiar de semana o de vista, o al abrir otro panel.

### «Conecta tu primera red»

Solo mientras no haya ninguna red conectada: una tarjeta arriba de todo con el título
«Conecta tu primera red», la frase «Sin una red conectada no hay nada que poner al fuego.» y
el botón «Ir a Los Fierros →», que lleva a [Los Fierros](los-fierros.md) (tus redes
conectadas). Con una sola red conectada, la tarjeta se va. El resto de la pantalla se ve
igual debajo de ella.

### «Se quemó»

El título va en rojo, con cuántas filas hay al lado (por ejemplo «Se quemó 22»). Aparece solo
si hay algo que falló, de cualquier fecha; si no falló nada, la sección no existe. Cada fila es
una red donde un corte falló: un corte que falló en dos redes da dos filas. Van de la más
reciente a la más vieja.

Si lo quemado es de dos redes o más, al lado del título hay un botón por red, con su ícono, su
nombre y cuántas tiene (por ejemplo «TikTok 8»). Todos parten encendidos, con borde rojo; un
clic apaga esa red —el botón queda con borde punteado y gris— y sus filas salen de la vista, y
otro clic la vuelve a encender. Apagar una red no borra ni arregla nada: solo deja de
mostrarla, y al recargar la página vuelven a estar todas. Con todas apagadas, la sección dice
«Apagaste todas las redes.» y «Encender todas».

De entrada se ven las primeras quince filas; si hay más, abajo aparece «Ver más (quedan
<N>)», que suma otras quince. Cambiar el filtro vuelve a las primeras quince. Cada fila trae:

- el corte en chico, con todas sus marcas: se ve cuál se quemó y si las demás salieron (ver
  «El corte», más abajo);
- la hora, solo HH:MM si el corte era de hoy, o con día y mes delante si no
  («<día> <número> de <mes> · HH:MM», por ejemplo «vie 25 de sep · 09:15»);
- el chip de la red que falló, con su ícono y una «✕»;
- el texto del post, que es un enlace a su editor (o «(sin texto)»);
- debajo, en rojo, el motivo, cuando lo hay: una frase fija en español que dice por qué no
  salió (ver «Motivos de un destino que no salió», más abajo);
- el botón «Reprogramar», que abre la misma ventana que el de la lista (ver «La ventana
  «Reprogramar»», más abajo).

### El corte

El calendario, el día y «Se quemó» dibujan cada publicación como un corte de carne sobre la
parrilla. El dibujo no lleva texto encima; lo dice todo en cuatro cosas que se leen sin leer:

- **La forma es el formato.** Una entraña (larga y con la fibra en diagonal) es un video; una
  tira de asado, con un hueso por archivo, es un carrusel (cinco huesos, cinco fotos; se
  dibujan hasta diez); un bife (ovalado) es una foto; un chori, sin archivos, es solo texto.
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

Debajo del corte, un chip por destino con el ícono de su red y un signo: «✓» salió, «…»
saliendo, «✕» se quemó, «◐» en la bandeja de TikTok, «↻» reintentando, «!» fierro frío; sin
signo, programado. Un lector de pantalla lee el formato y la cocción («Video · Programada»,
«Carrusel · Falló en parte») y cada destino con su estado.

La tarjeta en que va el corte es de acero, no del color de la carne, y cambia de borde solo
cuando pide algo: ámbar si algo espera en la bandeja de TikTok, reintenta o tiene el fierro
frío; rojo si se quemó.

### «Calendario», «Día» y «Lista»

Tres botoncitos sobre lo programado. «Calendario» es la vista con que abre la pantalla: la
semana. «Día» muestra un solo día, separado por cuenta; abre en el día que se estaba mirando
(hoy, si la semana a la vista es la de hoy, y si no, el lunes de esa semana). «Lista» cambia a
la lista. Desde «Día», «Calendario» vuelve a la semana que contiene ese día.

### El calendario

Arriba, «Semana anterior», el rango de la semana (por ejemplo `12 – 18 oct`) y «Semana
siguiente». Abre en la semana de hoy. Debajo, siete columnas de lunes a domingo. Cada una
lleva arriba el día abreviado y su número (por ejemplo `lun 12`) —es un enlace: abre ese día
en la vista «Día», y un lector de pantalla lo lee «lun 12: ver por cuenta»—, cuánto fuego tiene
—«Apagada» (nada), «Prendida» (uno o dos cortes) o «Parrilla llena» (tres o más)— y, en los
días de hoy en adelante, un «+» chico que abre el panel «Nueva publicación» con ese día puesto
(un lector de pantalla lo lee «Programar el <día> <número>», por ejemplo «Programar el lun
12»). El día de hoy tiene el nombre más claro y un borde fino. Un día vacío de hoy en
adelante dice «No hay nada puesto. Préndela.», y esa frase es un enlace que hace lo mismo que
el «+»; un día vacío que ya pasó dice «No hay nada puesto.», sin enlace y sin «+». En el
teléfono, la semana se desliza de lado.

Cada publicación es una tarjeta con el corte arriba (ver «El corte»), la hora con su estado al
lado cuando no es solo programado —«· saliendo», «· publicado» en verde, «· falló en <N> de
<M>» o «· falló» en rojo—, los chips de sus destinos, el texto en dos líneas o «(sin texto)»,
y una línea en ámbar «Reintentando <Red> · <usuario>: <motivo>» por cada destino que falló y
espera otro intento. La tarjeta no lleva miniatura: la foto o el video se ven en el editor. Al
dejar el mouse encima aparece el estado de cada red, con su motivo. Un clic abre el editor.

Los borradores que tienen fecha aparecen en su día, debajo de los cortes, como tarjetas con
borde punteado: arriba «Borrador · HH:MM» y debajo el texto en dos líneas (o «(sin texto)»).
Un clic abre ese borrador en el compositor, no en el editor. Un borrador no está programado:
no sale a ninguna red hasta que se abre y se aprieta «Programar». Por eso no cuenta para el
fuego del día: un día que solo tiene borradores sigue diciendo «Apagada». Los borradores sin
fecha no salen en el calendario; están en «Borradores (<N>)».

El calendario no tiene botones de «Subir ahora», «Eliminar» ni «Reprogramar»: esos están en
la lista (y «Reprogramar», también en «Se quemó»).

### El día

Un solo día, con una columna por cuenta. Sirve para ver qué sale en cada cuenta ese día y
dónde hay huecos: cuántas veces sale una misma cuenta en un día no se ve en la semana.

Arriba, «Día anterior», el día —«Hoy · vie 16 de oct», «Mañana · sáb 17 de oct», «Ayer · jue
15 de oct» o solo «mar 20 de oct»— con el fuego del día entero al lado («Apagada»,
«Prendida» o «Parrilla llena», contando cada corte una vez aunque salga a varias cuentas),
«Ir a hoy» si el día no es hoy, y «Día siguiente». En el teléfono las flechas dicen
«Anterior» y «Siguiente».

Debajo, una columna por cuenta, en el orden de [Los Fierros](los-fierros.md). Cada cuenta
conectada tiene la suya aunque ese día no tenga nada; una desconectada aparece solo si ese
día tiene algo, con «reconéctala» al lado del nombre. En el teléfono las columnas van una
debajo de otra. Cada columna lleva arriba el ícono de la red y el @usuario (o el nombre de la
página), el fuego de esa cuenta ese día —con las mismas reglas que el día: uno o dos,
«Prendida»; tres o más, «Parrilla llena»— y, si el día no pasó y la cuenta está conectada, un
«+» que abre «Nueva publicación» con ese día puesto y esa cuenta ya marcada (un lector de
pantalla lo lee «Programar en <Red> · <usuario>»).

En cada columna, por hora, una tarjeta por cada publicación que sale a esa cuenta: una que
sale a tres cuentas aparece en las tres. La tarjeta trae a la izquierda el corte, cocido según
ese destino solo y con una sola marca, la suya; y al lado la hora (con «· saliendo»,
«· publicado» o «· falló» si corresponde), el texto en tres líneas o «(sin texto)», el estado
de ese destino en palabras («Programado», «Reintentando», «Publicando…», «Publicado», «En tu
bandeja de TikTok», «Falló» o «Su fierro está frío: reconéctala», con el motivo después de
dos puntos si lo hay) y, si sale también a otras cuentas, «También en» con sus chips. La misma
publicación puede verse publicada en una columna y quemada en otra. Un clic abre el editor.

Los borradores con fecha de ese día van en la columna de cada cuenta que tienen marcada, con
borde punteado, como en la semana; los que no tienen ninguna cuenta marcada, en una columna
«Sin cuenta elegida» al final. No cuentan para el fuego.

Una columna vacía dice «Nada para esta cuenta. Préndela.» —un enlace que hace lo mismo que su
«+»— si todavía se puede programar en ella; en un día que ya pasó, «No salió nada en esta
cuenta.». Sin ninguna cuenta conectada y sin nada ese día: «No tienes cuentas conectadas, y
ese día no hay nada puesto.».

### La lista

Primero lo que todavía tiene algo pendiente (incluido lo quemado), de lo más próximo a lo más
lejano; después lo que ya salió en todas sus redes, de lo más reciente a lo más viejo. Se ven
los primeros 20; debajo, «Ver el restante» o «Ver los <N> restantes», que se vuelve «Mostrar
menos». Sin nada: «Nada programado todavía.» Los borradores no aparecen en la lista.

Cada publicación es una tarjeta con:

- El texto (dos líneas como mucho), o «(sin texto)», y debajo el día y la hora.
- A la derecha: **«Editar»** (abre el editor), **«Subir ahora»** (solo si a alguna red le
  falta salir: programada, publicándose o quemada) y **«Eliminar»**.
- Abajo, una píldora por cada destino: el ícono de la red, el usuario, « · » y el estado
  (ver la tabla de estados, más abajo). Si hay un motivo de falla, sigue « — <motivo>». Si el
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
«No hay nada puesto. Préndela.», y «Borrador» cuando se abre un borrador guardado. El
formulario viene abierto, con el cursor en «Texto». En este orden:

1. **«Texto»**, con el placeholder «Texto del post…». No deja escribir más de 2200
   caracteres.
2. **«Archivos»**, el botón de archivos del navegador, que acepta varios a la vez; debajo
   dice «Imágenes o video, opcional. Se suben apenas los eliges.» Solo deja elegir imágenes y
   videos. Empiezan a subir en cuanto se eligen: mientras tanto dice «Subiendo…» o «Subiendo
   <N> de <M>…», y el botón de archivos y «Programar» quedan apagados (con un video puede
   tardar). Lo subido aparece debajo en una lista numerada, en el orden del carrusel: el
   número, el nombre del archivo, «imagen» o «video», y una ✕ para quitarlo (un lector de
   pantalla la lee «Quitar <nombre del archivo>»). Se pueden elegir más después: se agregan al
   final. Para cambiar el orden hay que quitar y volver a elegir, o usar el editor después de
   programar. Si una subida falla, el error sale en rojo debajo de la lista, y no queda
   ninguno de los archivos de esa tanda.
3. **La revisión para TikTok**, solo si hay una cuenta de TikTok marcada y archivos elegidos.
   Mide cada archivo en el navegador y dice, en verde, «El archivo cumple lo que pide
   TikTok.» o «Los archivos cumplen lo que pide TikTok.»; o, en un recuadro rojo, «TikTok va
   a rechazar esto:» con una línea por archivo, «<nombre del archivo>: <problema>.». Es un
   aviso: no impide programar. Solo mide lo elegido desde que se abrió el panel: los archivos
   que vienen de un borrador guardado no se vuelven a medir.
4. **«Cuentas»**, una casilla por cuenta, rotulada «<Red> · <usuario>» (X aparece como «X /
   Twitter»; una cuenta sin usuario dice «sin nombre»). Una cuenta desconectada sale
   atenuada, no se puede marcar y lleva al lado «reconéctala». En un formulario nuevo, si hay
   una sola cuenta conectada viene marcada; con dos o más no viene ninguna. En un borrador
   vienen marcadas las que tenía marcadas, si siguen conectadas. Sin ninguna cuenta, el
   bloque dice «Todavía no tienes cuentas conectadas. Conecta una para poder programar.», y
   «Conecta una» lleva a [Los Fierros](los-fierros.md) (tus redes conectadas).
5. **Un bloque «TikTok · <usuario>»** por cada cuenta de TikTok marcada (ver abajo).
6. **Un bloque «Instagram · <usuario>»** por cada cuenta de Instagram marcada, solo cuando
   hay exactamente un archivo y es un video (ver abajo).
7. **«Respuesta automática por palabra clave»**, plegado (ver abajo); viene abierto y lleno si
   el borrador tenía una palabra.
8. **«Fecha y hora»**, un selector de día y hora con el botón «Ahora» al lado. Al abrir desde
   un día del calendario, viene puesto ese día a las 09:00; si el día es hoy, la hora en punto
   siguiente (o las 09:00, si todavía no son las nueve), y vacío desde las 23:00. Al abrir un
   borrador, viene la fecha que tenía. Al elegir el día aparece debajo cómo está ese día según
   lo que ya hay programado para adelante: «Ese día está apagado. Buen lugar para este.»
   (nada), «Ese día ya tiene un corte.» o «Ese día ya tiene <N> cortes.» (uno o dos), o «Ese
   día ya va lleno, con <N>. Mira si te sirve uno más flojo.» (tres o más). Los borradores no
   cuentan. «Ahora» se enciende y se apaga con un clic; encendido, el selector queda vacío y
   bloqueado y el post queda para el minuto siguiente.
9. **El pie del panel**, fijo abajo: los errores en rojo, encima de los botones; **«Programar»**,
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
con todos.»

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
  pregunta: solo lo cierra.

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
| `redes` | `instagram`, `facebook`, `youtube`, `threads`, `x` o `tiktok`, separadas por `\|` |
| `media` | Direcciones de descarga directa de los archivos, separadas por `\|`; puede ir vacía si hay texto y ninguna red exige archivo |
| `portada` | Dirección de una imagen JPG o PNG; solo vale si hay un video en `media` |
| `opciones` | JSON con lo que piden TikTok (privacidad, borrador) o Instagram (trial reel) |
| `regla` | JSON con la palabra clave, el mensaje, la respuesta pública y, si se quiere, el PDF |
| `cuentas` | Identificadores de cuenta separados por `\|`; hace falta cuando hay dos cuentas de la misma red. Cada tarjeta de Los Fierros trae el suyo con un botón para copiarlo |

La forma exacta de `opciones` y `regla` es la misma de la API: ver [la guía de la
API](../api-llm.md). La carga por CSV no crea borradores: cada fila buena queda programada.

### Estados de un destino

Cada publicación tiene un destino por cuenta, y cada destino va por su lado.

| Lo que dice | Cómo se ve | Qué está pasando |
|---|---|---|
| «Programado» | Píldora gris; en el corte, marca punteada y chip sin signo | Espera su hora |
| «Reintentando» | Píldora gris con « — <motivo>»; en el corte, marca punteada en ámbar y chip «↻»; en el calendario, la línea «Reintentando <Red> · <usuario>: <motivo>» | Falló un intento y se volverá a probar solo. Son tres intentos en total; algunos rechazos se queman al primero |
| «Publicando…» | Píldora gris; humo sobre el corte, chip «…» y «· saliendo» al lado de la hora | La red recibió el archivo y lo está procesando. Si pasan 24 horas así, cuenta como un intento fallido |
| «Publicado» | Píldora verde; marca llena en el corte y chip verde «✓» | Ya salió en esa red |
| «En tu bandeja de TikTok» | Píldora verde; marca quemada hasta la mitad con un punto ámbar, chip «◐» y la tarjeta con borde ámbar | Se mandó como borrador de TikTok: hay que terminarlo en la app de TikTok |
| «Falló» | Píldora roja con « — <motivo>» y «Reprogramar»; marca carbonizada, chip rojo «✕», el corte con halo rojo y banderita, y la tarjeta con borde rojo | Se quemó: no se volverá a intentar sola. Aparece también en «Se quemó», arriba del calendario, y puede llegar un correo con el asunto «No se pudo publicar en <Red>» |

Un destino programado en una cuenta con el fierro frío (desconectada, vencida o que no
sincroniza; ver [Los Fierros](los-fierros.md)) lleva en el corte la marca punteada en gris
acero, el chip «!» en ámbar y la tarjeta con borde ámbar: así como está, no va a salir.

Lo programado sale en la pasada siguiente del publicador, que corre cada pocos minutos: no
en el segundo exacto de la hora elegida.

### El editor de un post (`/admin/schedule/<id>`)

Además de desde el calendario y la lista, se llega desde la pieza de una publicación en
[Los Números](los-numeros.md), con su enlace «Editar atributos».

Arriba, el título «Editar post» y el enlace «Volver», que regresa a la vista desde la que se
entró: la semana del calendario, la lista o, si se entró con «Editar atributos», esa pieza de
Los Números. Debajo, según el caso:

- «Hay una publicación en curso. Vuelve en un minuto.», en amarillo, si algún destino está
  «Publicando…». Mientras tanto todo el formulario queda bloqueado, también «Eliminar».
- «Ya publicado en <Red> · <usuario>, <…>. Los cambios no tocan lo publicado.», en verde, si
  alguna red ya salió.

El formulario, en orden:

1. **«Texto»**.
2. **«Fecha y hora»**.
3. **«Cuentas»**: las mismas casillas que al programar, marcadas las que son destino. Una red
   donde ya se publicó lleva « ✓» y no se puede desmarcar. Una desconectada lleva
   «reconéctala»: si ya era destino se puede desmarcar, pero no se puede agregar. Las cuentas
   de TikTok solo aparecen si ya eran destino: desde aquí no se agregan. Junto a un destino
   con opciones va, tras un punto medio, un resumen: «Borrador a tu bandeja de TikTok»;
   «Directo» seguido de la privacidad y de lo permitido, por ejemplo «Directo · Solo yo · sin
   comentarios · sin dúo · sin pegar · sin comercial»; o «Trial reel — lo compartes tú desde
   Instagram». Esas opciones no se pueden cambiar aquí.
4. **«Media»**: una fila por archivo, con su miniatura (los videos se pueden reproducir ahí
   mismo), su dirección, un ícono para abrirlo en otra pestaña («Abrir en una pestaña
   nueva»), un ícono para copiar la dirección («Copiar la URL»; muestra «Copiada» o «No se
   pudo copiar»), dos flechas para subirlo o bajarlo en el orden del carrusel, y «Quitar».
   Debajo, **«Agregar archivos»** (botón de archivos) y **«Agregar por URL»** (placeholder
   «https://…», con la ayuda «Una por línea»). Lo agregado queda al final del carrusel.
5. **«Portada (solo para video)»**: si hay portada, su miniatura con los mismos íconos y
   «Quitar»; debajo, un campo de dirección, «Agregar por URL» o «Cambiar por URL» si ya hay
   una, con el placeholder «https://…/portada.jpg». La portada solo entra por dirección.
6. **«Respuesta automática por palabra clave»**, igual que al programar; viene abierta y
   llena si el post ya tenía una.
7. **«Atributos (JSON del editor de contenido)»**, un cuadro de texto con el placeholder
   `{"hook": "pregunta-polemica", "tema": "negocios"}`. Son anotaciones libres sobre el post
   —el hook, el tema, la serie—, hasta 20 claves con valores simples (texto, número, o `true` /
   `false`). Los lee el agente que analiza las publicaciones por la API, y el panel los muestra
   en [Los Números](los-numeros.md): en la pieza de cada publicación y en «Comparar por
   atributo». Una sola clave cambia algo en el panel, **`pieza`**: los posts programados con el
   mismo valor (por ejemplo `{"pieza": "chimichurri-30s"}`) se muestran juntos, como versiones
   de una misma pieza. Sirve para juntar dos hooks del mismo video, o el trial reel y el reel
   normal en la misma cuenta, que por fuerza son dos posts programados. Se puede agregar o
   cambiar también en un post que ya salió: no toca lo publicado.
8. Los errores, en rojo, y los botones **«Guardar»** («Guardando…») y **«Eliminar»**
   («Eliminando…»). Guardar bien devuelve a la vista de donde se vino —también a la pieza de
   Los Números, si se entró desde ahí—; eliminar bien, también.

El editor no es un panel lateral: es una pantalla aparte, y no guarda borradores. Si el post
no existe o ya se borró, el editor muestra la página «No encontramos esa página».

### La ventana «Reprogramar»

Se abre al apretar «Reprogramar» en una píldora roja de la lista o en una fila de «Se quemó», y
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
4. En «Cuentas», marcar cada cuenta donde tiene que salir.
5. Si apareció un bloque de TikTok o de Instagram, llenarlo (ver las tareas de abajo).
6. En «Fecha y hora», elegir día y hora. Mirar el aviso de debajo: si dice que el día va
   lleno, conviene otro.
7. Apretar «Programar». El panel se cierra, arriba dice «Programado.» y el post aparece en el
   calendario.

Si hay que dejarlo a medias, basta con cerrar el panel: queda como borrador.

### Para programar en un día del calendario

1. En «Calendario», ir a la semana con «Semana anterior» o «Semana siguiente».
2. Apretar el «+» junto al nombre del día o, si el día está vacío, «No hay nada puesto.
   Préndela.». Los días que ya pasaron no tienen ninguno de los dos.
3. Se abre «Nueva publicación» con la fecha puesta: ese día a las 09:00 (si es hoy, la hora
   en punto siguiente). Cambiar la hora si hace falta y seguir como en la tarea anterior.

### Para retomar un borrador

1. Apretar «Borradores (<N>)», arriba a la derecha. Si el borrador tiene fecha, también se
   puede apretar su tarjeta punteada en el calendario.
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
3. Un clic en una tarjeta abre su editor (o, si es punteada, el borrador).

### Para ver qué sale en cada cuenta un día

1. Un clic en el nombre del día en el calendario (por ejemplo `sáb 17`), o el botoncito «Día»
   arriba de lo programado.
2. Cada columna es una cuenta. Moverse con «Día anterior» y «Día siguiente»; «Ir a hoy»
   vuelve a hoy.
3. Para programar algo en una cuenta ese día, el «+» de su columna: abre «Nueva publicación»
   con el día y la cuenta ya puestos.

### Para cambiar algo de un post programado

1. Abrirlo: «Editar» en la lista, un clic en su tarjeta del calendario o en su texto en «Se
   quemó».
2. Cambiar lo que haga falta: texto, fecha y hora, cuentas, orden de los archivos (flechas),
   quitar («Quitar») o agregar archivos, portada, respuesta automática.
3. Apretar «Guardar».

Para agregar un video grande conviene «Agregar por URL» con un enlace de descarga directa:
el botón «Agregar archivos» del editor falla cuando lo elegido suma más de unos 4 MB.

### Para ponerle portada a un video

1. Programar el video y abrirlo en el editor.
2. En «Portada (solo para video)», pegar en «Agregar por URL» la dirección de una imagen JPG
   o PNG.
3. «Guardar».

### Para arreglar un post quemado

Primero leer el motivo, que está en «Se quemó», arriba de la pantalla, en la píldora roja de
la lista y en el correo. Si dice que hay que reconectar, hacerlo antes en [Los
Fierros](los-fierros.md). Después, una de tres:

- **Darle otra hora:** apretar «Reprogramar» en su fila de «Se quemó» (o en la píldora roja de
  la lista), elegir una fecha y hora futuras, en la zona de Tu Cuenta, y «Guardar». La ventana
  se cierra y la fila sale de «Se quemó». Ojo: la hora nueva es la del post entero, así que
  si otra de sus redes todavía esperaba, también se mueve. Las redes donde ya salió no se
  vuelven a publicar; si el post había fallado en otra red más, esa sigue en «Se quemó» con
  su propio «Reprogramar».
- **Reintentar ya:** «Subir ahora» en la tarjeta de la lista. Devuelve los destinos quemados a
  la cola y publica en el acto.
- **Corregirlo y reintentar:** «Editar», arreglar lo que dice el motivo (por ejemplo, acortar
  el texto para X) y «Guardar» sin tocar la fecha. Los destinos quemados que sigan marcados
  vuelven a «Programado» y salen en la pasada siguiente (o a su hora, si todavía no llega).
  Si se cambia la fecha, tiene que ser futura.

### Para sacar una red de un post sin borrarlo

1. «Editar» en la lista.
2. En «Cuentas», desmarcar esa red.
3. «Guardar».

No se puede con una red donde ya salió, ni dejar sin ninguna cuenta un post que todavía no
salió en ninguna (para eso está «Eliminar»). Sirve también para descartar un destino quemado
de un post que ya salió en otras redes.

### Para borrar un post

Apretar «Eliminar» en su tarjeta de la lista, o «Eliminar» en el editor. **No pide
confirmación** y no se puede deshacer. Solo funciona si no salió ni se está publicando en
ninguna red; si ya salió en alguna, hay que borrarlo en la red misma.

## Mensajes que puede ver

### En la pantalla

| Lo que dice la pantalla | Qué significa | Qué hacer |
|---|---|---|
| «Programado.» | Lo que se programó desde el panel quedó guardado | Nada; está en el calendario |
| «Conecta tu primera red» | No hay ninguna red conectada | «Ir a Los Fierros →» y conectar una |
| «No hay nada puesto. Préndela.» | Ese día, de hoy en adelante, no tiene nada programado | Apretarlo para programar ahí |
| «No hay nada puesto.» | Ese día ya pasó y no tuvo nada | Nada |
| «Ayer no salió nada.» | Ningún corte de ayer salió en ninguna red | Si algo debía salir, mirar «Se quemó» |
| El motivo en rojo bajo una fila de «Se quemó» | Por qué no salió en esa red (ver «Motivos de un destino que no salió») | Si pide reconectar, ir a Los Fierros; después «Reprogramar» |
| «Algo se rompió», con «No fue nada que hicieras: una consulta no respondió. Vuelve a intentarlo; el detalle quedó en la consola del navegador.» y el botón «Reintentar» | Una consulta del servidor falló; no fue la persona. Si falló la pantalla principal de La Parrilla, no aparece «Ir a La Parrilla» | «Reintentar» |

### Al programar

| Lo que dice la pantalla | Qué significa | Qué hacer |
|---|---|---|
| «Elige al menos una cuenta.» | No hay ninguna cuenta marcada | Marcar al menos una en «Cuentas» |
| «Escribe un texto o adjunta un archivo.» | No hay ni texto ni archivos | Agregar uno de los dos |
| «La fecha no se entendió.» | La fecha está vacía o incompleta | Completar día y hora |
| «La hora debe estar en el futuro.» | La hora elegida ya pasó (pasa con un borrador que tenía una fecha que ya llegó) | Elegir una futura, o «Ahora» |
| «Máximo diez archivos por publicación.» | Más de diez archivos (si TikTok es la única red, admite hasta 35 fotos) | Quitar archivos con su ✕ |
| «Una de las cuentas elegidas no es tuya.» | Una cuenta dejó de existir mientras la pantalla estaba abierta | Cerrar el panel (queda el borrador) y volver a abrirlo desde «Borradores (<N>)» |
| «La cuenta <usuario> no está conectada. Vuelve a conectarla en Los Fierros.» | Se desconectó | Reconectarla en Los Fierros y volver: lo escrito sigue en «Borradores» |
| «Espera a que terminen de subir los archivos.» | Se intentó programar mientras subían archivos | Esperar a que aparezcan en la lista y volver a apretar «Programar» |
| «Un archivo no es del almacén.», «Falta subir un archivo.» o «El cuerpo no se entendió.» | Un archivo de la lista ya no está en el almacenamiento, o la subida quedó a medias | Quitar los archivos de la lista con su ✕, volver a elegirlos y programar |

### Al subir archivos

Salen en rojo debajo de la lista de archivos, apenas falla la subida. Ninguno de los archivos
de esa tanda queda: hay que volver a elegirlos.

| Lo que dice la pantalla | Qué significa | Qué hacer |
|---|---|---|
| «Subiendo…» o «Subiendo <N> de <M>…» | Están subiendo los archivos recién elegidos | Esperar: «Programar» se enciende al terminar |
| «El archivo supera los 500 MB.» | Un archivo pasa del máximo | Achicarlo |
| «Ese tipo de archivo no se puede publicar.» | No es imagen ni video | Elegir otro |
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
| «No tienes borradores.» | No hay ningún borrador guardado (o el que se pidió ya no existe y era el último) | Nada |

### Por red

| Lo que dice la pantalla | Qué significa | Qué hacer |
|---|---|---|
| «Instagram, YouTube y TikTok necesitan al menos un archivo.» | Hay una de esas redes marcada y ningún archivo | Agregar archivo o desmarcar esa red |
| «X aún no recibe video desde el calendario.» | Hay video y X marcado | Sacar X o el video; programar X aparte con fotos o solo texto |
| «X recibe hasta cuatro imágenes.» | Más de cuatro fotos con X marcado | Dejar cuatro, o programar X aparte |
| «El texto excede los 280 caracteres de X.» | El texto es largo para X | Acortarlo o programar X aparte |
| «Threads recibe un solo archivo por post.» | Más de un archivo con Threads marcado | Dejar uno, o programar Threads aparte |
| «El texto excede los 500 caracteres de Threads.» | El texto es largo para Threads | Acortarlo o programar Threads aparte |
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
| «Red desconocida o sin publicación: <red>.» | Nombre de red mal escrito | Usar `instagram`, `facebook`, `youtube`, `threads`, `x` o `tiktok` |
| «Hay redes repetidas en la fila.» | La misma red dos veces | Dejarla una vez |
| «No hay una cuenta de <red> conectada.» | No hay cuenta conectada de esa red | Conectarla en Los Fierros, o sacar esa red |
| «Tienes <N> cuentas de <red> (<usuarios>). Elige cuál con «cuentas».» | Dos cuentas de la misma red | Usar la columna `cuentas` |
| «No se pudo leer una media de la fila.» | Un enlace de `media` o `portada` no se pudo descargar, o no era imagen ni video (pasa con enlaces de Drive que abren una página) | Usar enlaces de descarga directa |
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
| Una lista con las partes que apliquen, separadas por comas y con punto final: «<N> publicado» (o «publicados»), «<N> en proceso», «<N> en espera de la red», «<N> para reintentar», «<N> con error» | Cómo le fue a «Subir ahora» | Lo que está en proceso o en espera de la red termina solo; para lo que quedó para reintentar o con error, leer el motivo en la píldora |
| «Este post no tenía destinos pendientes.» | Ya había salido en todas sus redes | Nada |
| «El post ya no existe.» | Se borró antes | Recargar |
| «Ya se publicó (o está publicando): elimínalo en la red.» | Se intentó eliminar algo que ya salió en alguna red | Borrarlo en la red misma; para sacar solo las redes que no salieron, desmarcarlas en el editor |
| «La hora debe estar en el futuro.» | En «Reprogramar», la hora ya pasó | Elegir una futura |
| «Ese destino ya no existe.» | En «Reprogramar»: esa red del post, o el post entero, se borró mientras la ventana estaba abierta | Recargar |

### Editor

| Lo que dice la pantalla | Qué significa | Qué hacer |
|---|---|---|
| «Hay una publicación en curso. Vuelve en un minuto.» | Una red está procesando la publicación; el editor queda bloqueado | Esperar y recargar |
| «Ya publicado en <…>. Los cambios no tocan lo publicado.» | Algo ya salió | Lo que se cambie solo vale para lo que falta salir |
| «No se puede quitar una cuenta en la que ya se publicó.» | Se intentó desmarcar una red donde ya salió | Dejarla marcada |
| «No se pudo leer una media por URL.» | Un enlace de «Agregar por URL» o de la portada no se pudo descargar | Usar un enlace de descarga directa |
| «La portada requiere un video en media.» | Portada sin video | Quitar la portada o agregar el video |
| «La portada debe ser una imagen.» / «La portada debe ser JPG o PNG.» | La portada no sirve | Usar una imagen JPG o PNG |
| «Los atributos deben ser un objeto plano de valores simples.» | El JSON de «Atributos» está mal escrito o es demasiado grande | Corregirlo, o dejar el cuadro vacío |
| «El post ya no existe.» | Se borró mientras estaba abierto | Volver a La Parrilla |
| «Algo se rompió», con «No fue nada que hicieras: una consulta no respondió. Vuelve a intentarlo; el detalle quedó en la consola del navegador.» y los botones «Reintentar» e «Ir a La Parrilla» | Algo falló en el servidor. Si se estaba guardando con «Agregar archivos», lo más probable es que lo elegido pese más de unos 4 MB, que el editor no alcanza a subir | Volver al editor, quitar el archivo y agregarlo con «Agregar por URL»; si no había archivo, «Reintentar» |
| «No encontramos esa página» | El post no existe o no es de esta persona | Volver a La Parrilla |

### Motivos de un destino que no salió

Aparecen en «Se quemó», en la píldora de la lista, en la línea «Reintentando <Red> ·
<usuario>: <motivo>» del calendario y en el correo. Mientras el destino dice «Reintentando»,
se reintenta solo; cuando dice «Falló», hay que actuar (ver la tarea de arreglar un post
quemado, más arriba).

| Lo que dice la pantalla | Qué significa | Qué hacer |
|---|---|---|
| «No se pudo hablar con la red. Se reintentará.» | Falla de conexión | Esperar; si se quema, «Subir ahora» |
| «La cuenta no está conectada. Reconéctala y reprograma.» | La cuenta perdió la conexión | Reconectar en Los Fierros y «Reprogramar» |
| «La red no terminó de procesar el video.» | Pasó 24 horas en «Publicando…» | «Subir ahora» o «Reprogramar» |
| «Instagram rechazó la publicación.» | Instagram dijo que no | «Subir ahora» o «Reprogramar»; si vuelve a fallar, revisar el archivo y el texto |
| «Instagram no permite trial reels en esta cuenta.» | La cuenta no tiene trial reels; se quema al primer intento | El editor no apaga el trial reel: si nada salió, «Eliminar» y programarlo de nuevo sin trial reel; si otras redes ya salieron, desmarcar Instagram en el editor y programarlo aparte |
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
- **Hay una tarjeta punteada en el calendario.** Es un borrador con fecha: todavía no está
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
- **En la vista Día un post aparece dos veces.** Sale a dos cuentas: es una tarjeta por
  cuenta, y «También en» dice cuáles son las otras.
- **En la vista Día no aparece una cuenta.** Está desconectada y ese día no tiene nada:
  reconectarla en [Los Fierros](los-fierros.md).
- **La fecha viene puesta a las 9.** Es lo que propone al abrir desde un día del calendario;
  se cambia en «Fecha y hora».
- **Elegí un archivo y el botón Programar está gris.** Está subiendo («Subiendo…»): esperar
  a que aparezca en la lista.
- **Quiero cambiar el orden de los archivos.** En el compositor, quitarlos con su ✕ y volver a
  elegirlos en el orden que se quiere; o programar y reordenar en el editor con las flechas.
- **¿Dónde subo un CSV? / No encuentro la carga masiva.** «Subir CSV», arriba a la derecha de
  La Parrilla.
- **No me deja marcar una cuenta.** Dice «reconéctala» al lado: hay que reconectarla en
  [Los Fierros](los-fierros.md). Si no aparece ninguna, no hay cuentas conectadas.
- **La pantalla dice Conecta tu primera red.** No hay ninguna red conectada. Se conecta en
  Los Fierros, dentro del engranaje «Ajustes».
- **El botón Programar no hace nada / el navegador me marca un campo.** Falta «Fecha y
  hora» (o apretar «Ahora»), o falta «Quién puede verlo» en un bloque de TikTok.
- **No veo lo de trial reel.** Solo aparece con exactamente un archivo, que sea video, y
  una cuenta de Instagram marcada.
- **No veo Dúos ni Pegar.** No aparecen cuando todos los archivos son fotos, ni cuando
  está encendido «Enviar como borrador a mi bandeja de TikTok».
- **Programé con Ahora y todavía no sale.** Sale en la pasada siguiente del publicador,
  en unos minutos. Para que sea ya: «Subir ahora» en la lista.
- **Dice Reintentando.** Falló un intento y se va a volver a probar solo; el motivo va al
  lado. Si el motivo pide reconectar, conviene hacerlo ya.
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
- **Al guardar en el editor me sale Algo se rompió.** Si se estaba agregando un archivo, lo
  más probable es que pese más de unos 4 MB: agregarlo con «Agregar por URL».
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
- **¿De dónde saco el identificador para la columna cuentas?** De la tarjeta de la cuenta
  en Los Fierros: el código chico con el ícono de copiar.
- **El engranaje «Ajustes» tiene un punto.** Ámbar: el permiso de alguna cuenta vence en
  la semana. Rojo: alguna se apagó (venció o dejó de sincronizar) y lo que se programe ahí no
  va a salir. Adentro, la entrada «Los Fierros» dice cuántas («1 se enfría», «2 se
  apagaron»); en [Los Fierros](los-fierros.md), «Reconectar» en esa tarjeta.
- **Publiqué en YouTube y salió privado.** Los Fierros lo advierte: «Hasta que Google
  apruebe la cuota de la app, lo que publiques sale privado.»
- **En TikTok no aparece en mi perfil.** TikTok puede tardar unos minutos. Si se mandó como
  borrador de TikTok, dice «En tu bandeja de TikTok»: hay que terminarlo en la app.
- **No veo el video en el editor de un post que ya salió.** Cuando un post sale en todas sus
  redes, el video se borra del almacenamiento del sitio; las fotos y la portada se quedan.
- **La hora está corrida / el «hoy» no calza.** Las horas son las de la zona de [Tu
  Cuenta](tu-cuenta.md).
- **No encuentro un post en el calendario.** Puede estar en otra semana: «Semana anterior» /
  «Semana siguiente», o mirar la «Lista», que tiene todo.
- **En el calendario no está el botón para borrar o subir.** Esos botones están en la
  «Lista»; en el calendario, un clic en la tarjeta abre el editor, que tiene «Eliminar».
- **¿Qué significa el dibujo de la tarjeta?** La forma es el formato (entraña video, tira
  carrusel, bife foto, chori texto); el color de la carne, cómo va (rosada programada, naranja
  saliendo, dorada publicada, negra falló); cada diagonal, un destino (llena salió, punteada
  todavía no). El halo rojo y la banderita, que algo se quemó. Con borde punteado y sin
  dibujo, es un borrador. Detalle en «El corte».
- **¿Por qué una tarjeta tiene el borde ámbar?** Algo espera en la bandeja de TikTok, un
  destino está reintentando o una de sus cuentas tiene el fierro frío. Rojo: se quemó.
- **¿Dónde quedó la miniatura de la foto en el calendario?** Ya no va en la tarjeta: el corte
  dice el formato y el estado. La foto o el video están en el editor (un clic en la tarjeta).
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
- No duplica un post ni arrastra tarjetas en el calendario, ni programa en un día que ya pasó.
- La vista «Día» no tiene «Subir ahora», «Eliminar» ni «Reprogramar» (están en la lista), no
  alinea las horas entre columnas —cada columna va en su orden, de la más temprana a la más
  tarde— y no muestra varios días a la vez: para eso está la semana.
- No publica video en X.
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
  - `src/app/admin/(dash)/schedule/lista-borradores.tsx`
  - `src/app/admin/(dash)/schedule/batch-upload.tsx`
  - `src/app/admin/(dash)/schedule/calendar.tsx`
  - `src/app/admin/(dash)/schedule/vista-dia.tsx` y `src/app/admin/(dash)/schedule/dia.ts` (la vista «Día»)
  - `src/app/admin/(dash)/schedule/se-quemo.tsx`, `src/app/admin/(dash)/schedule/lista-quemados.tsx` y `src/app/admin/(dash)/schedule/filtro-quemados.ts` («Se quemó»)
  - `src/app/admin/(dash)/schedule/queue.tsx`
  - `src/app/admin/(dash)/schedule/reprogramar.tsx`
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
  - `src/lib/social/publish/tiktok-creador.ts`
  - `src/lib/social/publish/publisher.ts`
  - `src/lib/social/publish/run.ts`
  - `src/lib/social/publish/alert.ts`
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
  - `src/lib/vocabulario.ts`
  - `src/lib/utils.ts`
  - `src/components/ui.tsx`
  - `src/components/boton.ts`

Si cambias lo que se ve en alguno de ellos, actualiza esta página en el mismo commit.
