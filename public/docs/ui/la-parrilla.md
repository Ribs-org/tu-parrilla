# La Parrilla — lo que viene y cómo salió lo que ya se fue

`/admin/schedule` es la pestaña «La Parrilla» de la barra del panel. El editor de cada
publicación vive en `/admin/schedule/<id>`.

La Parrilla es el calendario de publicación. Aquí se programa un post para una o varias
cuentas (Instagram, Facebook, YouTube, Threads, X y TikTok), se programan muchos de una vez
con un CSV, y se ve cómo va cada uno —programado, saliendo, publicado o quemado— en una lista
o en una semana. También es donde se corrige, se reintenta o se borra lo que falló. El panel
llama «corte» a cada publicación programada, y «quemado» a lo que no salió. Todas las horas
son las de la zona horaria que la persona eligió en [Tu Cuenta](tu-cuenta.md), aunque su
computador esté en otra. Aparece aquí todo lo programado, venga de esta pantalla, de la
[app del teléfono](app-movil.md) o de la API.

En esta página, lo que va entre ángulos (`<usuario>`, `<N>`) es un dato que la pantalla
reemplaza por el real. Los títulos y los rótulos de los campos se ven en mayúsculas por
estilo; aquí van escritos como están en el código.

## Cómo se llega

- En la barra de arriba, la pestaña «La Parrilla», la segunda después de «El Fuego».
- Desde [El Fuego](el-fuego.md) (`/admin`, la pantalla de entrada):
  - «Poner al fuego» abre La Parrilla con el formulario «Programar una publicación» ya
    desplegado y el cursor en «Texto».
  - Cada fila de «Ahora en la parrilla» abre el editor de esa publicación.
  - En la sección «Se quemó», el texto de cada fila abre su editor, y el botón «Reprogramar»
    de la fila es el mismo que el de la lista de aquí.
  - Cada día del termómetro de la semana abre el «Calendario» en la semana de ese día.
- El correo que avisa que algo no salió termina con «Revisa el calendario en /admin/schedule
  para reprogramarla.»
- Por dirección: `https://tu-parrilla.cl/admin/schedule`. Con `?vista=calendario` abre el
  calendario; con `?componer=1`, el formulario desplegado.

## Qué se ve

De arriba abajo: el título, dos bloques plegables («Programar una publicación» y «Carga
masiva (CSV)») y, debajo, lo programado en lista o en calendario.

### Encabezado

«La Parrilla», y debajo, en chico, «lo que viene y cómo salió lo que ya se fue».

### «Programar una publicación»

Viene plegado: se abre con un clic en el título (llega abierto si se vino desde «Poner al
fuego»). Adentro, en este orden:

1. **«Texto»**, con el placeholder «Texto del post…». No deja escribir más de 2200
   caracteres.
2. **«Archivos»**, el botón de archivos del navegador, que acepta varios a la vez; debajo
   dice «Imágenes o video, opcional». Solo deja elegir imágenes y videos. El carrusel sale en
   el orden en que quedaron elegidos; para reordenarlo después está el editor.
3. **La revisión para TikTok**, solo si hay una cuenta de TikTok marcada y archivos elegidos.
   Mide cada archivo en el navegador y dice, en verde, «El archivo cumple lo que pide
   TikTok.» o «Los archivos cumplen lo que pide TikTok.»; o, en un recuadro rojo, «TikTok va
   a rechazar esto:» con una línea por archivo, «<nombre del archivo>: <problema>.». Es un
   aviso: no impide programar.
4. **«Cuentas»**, una casilla por cuenta, rotulada «<Red> · <usuario>» (X aparece como «X /
   Twitter»; una cuenta sin usuario dice «sin nombre»). Una cuenta desconectada sale
   atenuada, no se puede marcar y lleva al lado «reconéctala». Si hay una sola cuenta
   conectada viene marcada; con dos o más no viene ninguna. Sin ninguna cuenta, el bloque
   dice «Todavía no tienes cuentas conectadas. Conecta una para poder programar.», y «Conecta
   una» lleva a [Los Fierros](los-fierros.md) (tus redes conectadas).
5. **Un bloque «TikTok · <usuario>»** por cada cuenta de TikTok marcada (ver abajo).
6. **Un bloque «Instagram · <usuario>»** por cada cuenta de Instagram marcada, solo cuando
   se eligió exactamente un archivo y es un video (ver abajo).
7. **«Respuesta automática por palabra clave»**, plegado (ver abajo).
8. **«Fecha y hora»**, un selector de día y hora con el botón «Ahora» al lado. Al elegir el
   día aparece debajo cómo está ese día según lo que ya hay programado para adelante: «Ese
   día está apagado. Buen lugar para este.» (nada), «Ese día ya tiene un corte.» o «Ese día
   ya tiene <N> cortes.» (uno o dos), o «Ese día ya va lleno, con <N>. Mira si te sirve uno
   más flojo.» (tres o más). «Ahora» se enciende y se apaga con un clic; encendido, el
   selector queda vacío y bloqueado y el post queda para el minuto siguiente.
9. Mientras suben los archivos, «Subiendo…» o «Subiendo <N> de <M>…». Los errores salen en
   rojo justo encima del botón; si todo salió bien, «Programado.» en verde.
10. **El botón «Programar»**, que dice «Guardando…» mientras trabaja (también mientras
    suben los archivos, que con un video puede tardar).

#### El bloque «TikTok · <usuario>»

- Debajo del nombre, con la foto de la cuenta: «Se publicará en la cuenta <nombre en
  TikTok>». Mientras pregunta a TikTok dice «Leyendo tu cuenta…»; si TikTok no contesta,
  ahí sale el error (ver la tabla de TikTok en los mensajes, más abajo).
- El interruptor **«Enviar como borrador a mi bandeja de TikTok»**. Encendido, dice «Te
  llegará una notificación en TikTok para terminar la publicación desde el teléfono.» y el
  resto del bloque desaparece: no hay nada más que elegir.
- Apagado (publicación directa), aparece:
  - **«Quién puede verlo»**, una lista que parte en «Elige quién puede verlo» y ofrece
    «Todos», «Amigos mutuos», «Seguidores» y «Solo yo» (solo las que la cuenta permite). Es
    obligatoria: sin elegir, el navegador no deja programar. Si se elige algo distinto de
    «Solo yo», aparece: «Mientras TikTok no apruebe la app, solo «Solo yo» llega a
    publicarse, y solo desde una cuenta de TikTok privada.»
  - **«Permitir»**, con las casillas «Comentarios», «Dúos» y «Pegar (Stitch)», todas
    desmarcadas al partir. «Dúos» y «Pegar (Stitch)» no aparecen cuando todos los archivos
    son fotos. Una casilla gris es algo que la cuenta tiene bloqueado en TikTok.
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

Un solo interruptor, **«Publicar como trial reel»**, apagado al partir, con «Solo lo ven
quienes no te siguen. Tú decides desde Instagram cuándo compartirlo con todos.»

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

### «Carga masiva (CSV)»

También plegado. Adentro, un párrafo de ayuda que resume el formato y termina en «Máximo 50
filas.», con un enlace «Cuentas» que lleva a [Los Fierros](los-fierros.md); un ejemplo de
tres filas en letra de máquina; el botón de archivo del navegador (solo deja elegir `.csv`), y
el botón **«Cargar lote»**, que dice «Cargando…» mientras procesa. Las fechas del ejemplo ya
pasaron: copiado tal cual, todas las filas fallan por hora.

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
API](../api-llm.md).

### «Lista» y «Calendario»

Dos botoncitos sobre lo programado. «Lista» es la vista de entrada.

### La lista

Primero lo que todavía tiene algo pendiente (incluido lo quemado), de lo más próximo a lo más
lejano; después lo que ya salió en todas sus redes, de lo más reciente a lo más viejo. Se ven
los primeros 20; debajo, «Ver el restante» o «Ver los <N> restantes», que se vuelve «Mostrar
menos». Sin nada: «Nada programado todavía.»

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

### El calendario

Arriba, «Semana anterior», el rango de la semana (por ejemplo `12 – 18 oct`) y «Semana
siguiente». Debajo, siete columnas de lunes a domingo, cada una con el día abreviado y su
número (por ejemplo `lun 12`) y cuánto fuego tiene: «Apagada» (nada), «Prendida» (uno o
dos cortes) o «Parrilla llena» (tres o más). El día de hoy tiene el nombre más claro y un
borde fino. Un día vacío dice «No hay nada puesto. Préndela.» En el teléfono, la semana se
desliza de lado.

Cada corte es una tarjeta con la hora (y «saliendo» al lado si se está publicando), los
íconos de sus redes (rojo el que se quemó, verde el que salió), una miniatura (la foto, la
portada o el primer cuadro del video), el texto en dos líneas o «(sin texto)», y una línea
«Reintentando <Red> · <usuario>: <motivo>» por cada destino que falló y espera otro intento.
El color de la tarjeta dice cómo va, de claro a oscuro: programada, saliendo ahora,
publicada en todas y, casi negra, falló alguna. Al dejar el mouse encima aparece el estado de
cada red. Un clic abre el editor. El calendario no tiene botones de «Subir ahora»,
«Eliminar» ni «Reprogramar»: esos están en la lista.

### Estados de un destino

Cada publicación tiene un destino por cuenta, y cada destino va por su lado.

| Lo que dice | Cómo se ve | Qué está pasando |
|---|---|---|
| «Programado» | Píldora gris; tarjeta clara | Espera su hora |
| «Reintentando» | Píldora gris con « — <motivo>»; en el calendario, la línea «Reintentando <Red> · <usuario>: <motivo>» | Falló un intento y se volverá a probar solo. Son tres intentos en total; algunos rechazos se queman al primero |
| «Publicando…» | Píldora gris; «saliendo» en la tarjeta | La red recibió el archivo y lo está procesando. Si pasan 24 horas así, cuenta como un intento fallido |
| «Publicado» | Píldora verde; ícono verde | Ya salió en esa red |
| «En tu bandeja de TikTok» | Píldora verde | Se mandó como borrador: hay que terminarlo en la app de TikTok |
| «Falló» | Píldora roja con « — <motivo>» y «Reprogramar»; ícono rojo; tarjeta casi negra | Se quemó: no se volverá a intentar sola. Aparece también en «Se quemó» de El Fuego, y puede llegar un correo con el asunto «No se pudo publicar en <Red>» |

Lo programado sale en la pasada siguiente del publicador, que corre cada pocos minutos: no
en el segundo exacto de la hora elegida.

### El editor de un post (`/admin/schedule/<id>`)

Arriba, el título «Editar post» y el enlace «Volver», que regresa a la vista desde la que se
entró (la lista o la semana del calendario). Debajo, según el caso:

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
   `{"hook": "pregunta-polemica", "tema": "negocios"}`. Es para el agente que analiza las
   publicaciones por la API: el panel no los muestra en otra parte. Hasta 20 claves con
   valores simples.
8. Los errores, en rojo, y los botones **«Guardar»** («Guardando…») y **«Eliminar»**
   («Eliminando…»). Guardar bien devuelve a la vista de donde se vino; eliminar bien, también.

Si el post no existe o ya se borró, el editor muestra la página «No encontramos esa página».

### El panel «Reprogramar»

Se abre al apretar «Reprogramar» en una píldora roja (o en «Se quemó» de El Fuego) y queda
encima de todo, con el fondo oscurecido. Arriba dice de qué destino se trata, «<Red> ·
<usuario>»; debajo, un selector de fecha y hora, **«Guardar»** (bloqueado hasta elegir una
hora) y **«Cancelar»**. Se cierra también con Esc o con un clic fuera.

## Qué se puede hacer

Todo lo que sigue es para quien tiene sesión en el panel. Programar en lote y borrar también
se puede por API: ver [la guía de la API](../api-llm.md).

### Para programar una publicación

1. Ir a «La Parrilla» y abrir «Programar una publicación».
2. Escribir en «Texto».
3. Si lleva fotos o video, apretar el botón de «Archivos» y elegirlos.
4. En «Cuentas», marcar cada cuenta donde tiene que salir.
5. Si apareció un bloque de TikTok o de Instagram, llenarlo (ver las tareas de abajo).
6. En «Fecha y hora», elegir día y hora. Mirar el aviso de debajo: si dice que el día va
   lleno, conviene otro.
7. Apretar «Programar» y esperar «Programado.». El post aparece en la lista.

Si después se va a programar otro, conviene recargar la página para que el formulario parta
de cero.

### Para programar un video para TikTok

1. Abrir «Programar una publicación» y escribir el «Texto».
2. En «Archivos», elegir un solo video (MP4, MOV o WebM). Si aparece «TikTok va a rechazar
   esto:», cambiar el archivo antes de seguir.
3. En «Cuentas», marcar «TikTok · <usuario>». Aparece su bloque.
4. Elegir el camino:
   - Para terminarlo desde el teléfono: encender «Enviar como borrador a mi bandeja de
     TikTok». Llega a la app como borrador.
   - Para publicarlo directo: en «Quién puede verlo», elegir. Hoy solo «Solo yo», con la
     cuenta de TikTok puesta en privada, llega a publicarse. Marcar en «Permitir» lo que se
     quiera dejar abierto.
5. Si el video promociona una marca, encender «Este contenido promociona una marca» y elegir
   «Mi marca» o «Contenido patrocinado» (este último no admite «Solo yo»).
6. Elegir «Fecha y hora» (o «Ahora») y apretar «Programar».

Para fotos en TikTok es igual, con hasta 35 fotos JPG o WebP y sin video (hasta diez si el
post va también a otra red).

### Para publicar un reel como trial reel de Instagram

1. En «Programar una publicación», elegir en «Archivos» un solo video, nada más.
2. Marcar la cuenta de Instagram en «Cuentas». Aparece «Instagram · <usuario>».
3. Encender «Publicar como trial reel».
4. Fecha y hora, y «Programar». Después, se comparte con todos desde la app de Instagram.

### Para que salga ya

- Si todavía no está programado: en el formulario, apretar «Ahora» y luego «Programar».
  Queda para el minuto siguiente y sale en la pasada siguiente del publicador, en unos
  minutos.
- Si ya está programado (o se quemó) y tiene que salir en el acto: en «Lista», apretar
  «Subir ahora» en su tarjeta y aceptar la pregunta «¿Subirlo ahora, sin esperar la hora
  programada? Se publica en tus redes de inmediato.». Arriba de la lista aparece cómo le
  fue, por ejemplo `1 publicado, 1 en proceso.`. Lo que quede en proceso termina solo en
  las pasadas siguientes. Lo ya publicado no se vuelve a publicar.

### Para agregar una respuesta automática por palabra clave

1. En el formulario (o en el editor de un post ya programado), abrir «Respuesta automática
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
3. En La Parrilla, abrir «Carga masiva (CSV)», elegir el archivo y apretar «Cargar lote».
4. Leer las líneas «Fila <N>: …». Las que dicen «Programado» ya quedaron. Para las rojas,
   corregir y volver a subir un CSV solo con esas filas: subir de nuevo las buenas las
   duplica.

Hasta 50 filas por archivo. Los archivos van por dirección de descarga directa; aquí no se
suben archivos sueltos.

### Para ver qué hay en una semana

1. Apretar «Calendario».
2. Moverse con «Semana anterior» y «Semana siguiente».
3. Un clic en una tarjeta abre su editor.

### Para cambiar algo de un post programado

1. Abrirlo: «Editar» en la lista, o un clic en su tarjeta del calendario.
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

Primero leer el motivo, que está en la píldora roja de la lista (y en «Se quemó» de El Fuego
y en el correo). Si dice que hay que reconectar, hacerlo antes en [Los Fierros](los-fierros.md).
Después, una de tres:

- **Darle otra hora:** en «Lista», apretar «Reprogramar» en la píldora roja, elegir una
  fecha y hora futuras y «Guardar». Ojo: cambia la hora del post entero, así que si otra de
  sus redes todavía esperaba, también se mueve.
- **Reintentar ya:** «Subir ahora» en la tarjeta. Devuelve los destinos quemados a la cola y
  publica en el acto.
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

### Al programar o guardar

| Lo que dice la pantalla | Qué significa | Qué hacer |
|---|---|---|
| «Programado.» | Quedó guardado | Nada; está en la lista |
| «Elige al menos una cuenta.» | No hay ninguna cuenta marcada | Marcar al menos una en «Cuentas» |
| «Escribe un texto o adjunta un archivo.» | No hay ni texto ni archivos | Agregar uno de los dos |
| «La fecha no se entendió.» | La fecha está vacía o incompleta | Completar día y hora |
| «La hora debe estar en el futuro.» | La hora elegida ya pasó | Elegir una futura, o «Ahora» |
| «Máximo diez archivos por publicación.» | Más de diez archivos (si TikTok es la única red, admite hasta 35 fotos) | Quitar archivos |
| «Una de las cuentas elegidas no es tuya.» | Una cuenta dejó de existir mientras la pantalla estaba abierta | Recargar la página |
| «La cuenta <usuario> no está conectada. Vuelve a conectarla en Cuentas.» | Se desconectó; «Cuentas» es Los Fierros | Reconectarla en Los Fierros y volver |
| «Subiendo…» o «Subiendo <N> de <M>…» | Están subiendo los archivos | Esperar |
| «El archivo supera los 500 MB.» | Un archivo pasa del máximo | Achicarlo |
| «Ese tipo de archivo no se puede publicar.» | No es imagen ni video | Elegir otro |
| «No se pudo preparar la subida. (<código>)», «No se pudo subir el archivo. (<código>)» o «No se pudo subir el archivo.» | Falló la conexión al subir | Volver a apretar «Programar»; si se repite, avisar a quien administra el sitio |
| «Un archivo no es del almacén.», «Falta subir un archivo.» o «El cuerpo no se entendió.» | La subida quedó a medias | Volver a elegir los archivos y programar |
| «Falta configurar Cloudflare R2 (R2_*).» | El sitio no tiene almacenamiento configurado | Avisar a quien administra el sitio |

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
| «Conecta TikTok en Cuentas antes de programar.» | La cuenta no tiene conexión válida | Reconectarla en Los Fierros |
| «Reconecta TikTok para autorizar la publicación.» | TikTok quitó o venció el permiso | Reconectarla en Los Fierros |
| «No pude leer tu cuenta de TikTok.» | TikTok no contestó | Se puede programar igual: se ofrecen las cuatro privacidades y se vuelve a comprobar al publicar |
| «TikTok necesita que elijas la privacidad.» | Falta «Quién puede verlo» | Elegirla en el bloque de esa cuenta |
| «Un contenido patrocinado no puede ser privado. Vuelve a elegir quién puede verlo.» o «Un contenido patrocinado no puede ser privado.» | «Contenido patrocinado» con «Solo yo», o sin privacidad elegida | Elegir otra privacidad, o «Mi marca» |
| «Las opciones de la red no se entendieron.» | El formulario llegó raro | Recargar y volver a llenarlo |
| «Mientras TikTok no apruebe la app, solo «Solo yo» llega a publicarse, y solo desde una cuenta de TikTok privada.» | Aviso: otra privacidad se acepta ahora pero falla al publicar | Elegir «Solo yo» con la cuenta en privada, o mandarlo como borrador |
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

### Carga masiva

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
| «La cuenta <usuario> no está conectada. Vuelve a conectarla en Cuentas.» | La cuenta de `cuentas` está desconectada | Reconectarla en Los Fierros |
| ««<red>» en opciones es ambiguo: la fila tiene <N> cuentas de esa red (<usuarios>). Usa el id de cada cuenta como clave.» | `opciones` nombra una red que tiene dos cuentas en la fila | Usar el identificador de cada cuenta |
| ««<clave1>» y «<clave2>» en opciones nombran el mismo destino. Deja una sola clave por destino.» | Dos claves de `opciones` apuntan a la misma cuenta | Dejar una |
| «No se pudo guardar la fila. Inténtalo de nuevo.» | Falla pasajera | Subir de nuevo solo esa fila |

### Lista, «Subir ahora», «Reprogramar» y «Eliminar»

| Lo que dice la pantalla | Qué significa | Qué hacer |
|---|---|---|
| «Nada programado todavía.» | No hay nada programado | Programar algo |
| «¿Subirlo ahora, sin esperar la hora programada? Se publica en tus redes de inmediato.» | Pregunta de «Subir ahora» | Aceptar para publicar ya; cancelar para dejarlo como estaba |
| Una lista con las partes que apliquen, separadas por comas y con punto final: «<N> publicado» (o «publicados»), «<N> en proceso», «<N> en espera de la red», «<N> para reintentar», «<N> con error» | Cómo le fue a «Subir ahora» | Lo que está en proceso o en espera de la red termina solo; para lo que quedó para reintentar o con error, leer el motivo en la píldora |
| «Este post no tenía destinos pendientes.» | Ya había salido en todas sus redes | Nada |
| «El post ya no existe.» | Se borró antes | Recargar |
| «Ya se publicó (o está publicando): elimínalo en la red.» | Se intentó eliminar algo que ya salió en alguna red | Borrarlo en la red misma; para sacar solo las redes que no salieron, desmarcarlas en el editor |
| «La hora debe estar en el futuro.» | En «Reprogramar», la hora ya pasó | Elegir una futura |
| «Ese destino ya no existe.» | El destino se borró mientras tanto | Recargar |

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
| «El post ya no existe.» | Se borró mientras estaba abierto | Volver a la lista |
| «Algo se rompió», con «No fue nada que hicieras: una consulta no respondió. Vuelve a intentarlo; el detalle quedó en la consola del navegador.» y los botones «Reintentar» e «Ir a El Fuego» | Algo falló en el servidor. Si se estaba guardando con «Agregar archivos», lo más probable es que lo elegido pese más de unos 4 MB, que el editor no alcanza a subir | Volver al editor, quitar el archivo y agregarlo con «Agregar por URL»; si no había archivo, «Reintentar» |
| «No encontramos esa página» | El post no existe o no es de esta persona | Volver a La Parrilla |

### Motivos de un destino que no salió

Aparecen en la píldora de la lista, en la línea «Reintentando <Red> · <usuario>: <motivo>»
del calendario, en «Se quemó» de El Fuego y en el correo. Mientras el destino dice
«Reintentando», se reintenta solo; cuando dice «Falló», hay que actuar (ver la tarea de
arreglar un post quemado, más arriba).

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
| «TikTok solo publica en cuentas privadas hasta que apruebe la app: pon tu cuenta de TikTok en privada y reprograma.» | La cuenta de TikTok es pública | Ponerla en privada en TikTok y «Reprogramar» |
| «Tienes 5 borradores pendientes en TikTok; publica alguno antes.» | La bandeja de TikTok está llena | Publicar o borrar borradores en la app y «Reprogramar» |
| «Reconecta TikTok para autorizar la publicación.» | TikTok quitó el permiso | Reconectar en Los Fierros y «Reprogramar» |
| «TikTok no reconoce el dominio de tus archivos; verifícalo en el portal.» | Problema de configuración del sitio con TikTok | Avisar a quien administra el sitio |
| «TikTok necesita que elijas la privacidad.» / «TikTok recibe un video, o hasta 35 fotos JPG o WebP.» | Las opciones o los archivos no sirven para TikTok | Si nada salió, «Eliminar» y programarlo de nuevo; si no, desmarcar TikTok y programarlo aparte |

## Si el humano dice…

- **No encuentro dónde programar.** Pestaña «La Parrilla», y abrir «Programar una
  publicación», que viene plegado. Desde El Fuego, «Poner al fuego» lo abre directo.
- **No me deja marcar una cuenta.** Dice «reconéctala» al lado: hay que reconectarla en
  [Los Fierros](los-fierros.md). Si no aparece ninguna, no hay cuentas conectadas.
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
- **Se me quemó un post.** Leer el motivo en la píldora roja y seguir la tarea de arreglar
  un post quemado.
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
- **¿Dónde adjunto el PDF de la respuesta automática?** En el panel no se puede; solo por
  [la API](../api-llm.md) o en la columna `regla` del CSV.
- **El CSV me dice que la hora debe estar en el futuro y copié el ejemplo.** Las fechas
  del ejemplo ya pasaron: cambiarlas.
- **Se me duplicaron posts con el CSV.** Se subió dos veces el mismo archivo: no se
  descartan repetidos. Borrar los sobrantes con «Eliminar».
- **¿De dónde saco el identificador para la columna cuentas?** De la tarjeta de la cuenta
  en Los Fierros: el código chico con el ícono de copiar.
- **Un mensaje me dice que vaya a Cuentas.** «Cuentas» es [Los Fierros](los-fierros.md),
  en el engranaje «Ajustes».
- **Publiqué en YouTube y salió privado.** Los Fierros lo advierte: «Hasta que Google
  apruebe la cuota de la app, lo que publiques sale privado.»
- **En TikTok no aparece en mi perfil.** TikTok puede tardar unos minutos. Si se mandó como
  borrador, dice «En tu bandeja de TikTok»: hay que terminarlo en la app.
- **No veo el video en el editor de un post que ya salió.** Cuando un post sale en todas sus
  redes, el video se borra del almacenamiento del sitio; las fotos y la portada se quedan.
- **La hora está corrida.** Las horas son las de la zona de [Tu Cuenta](tu-cuenta.md).
- **No encuentro un post en el calendario.** Puede estar en otra semana: «Semana anterior» /
  «Semana siguiente», o mirar la «Lista», que tiene todo.
- **En el calendario no está el botón para borrar o subir.** Esos botones están en la
  «Lista»; en el calendario, un clic en la tarjeta abre el editor, que tiene «Eliminar».
- **¿Qué significa el color de la tarjeta?** Clara, programada; más oscura, saliendo o ya
  publicada; casi negra, se quemó alguna red.
- **Cambié la fecha de un post ya publicado.** No lo vuelve a publicar: solo cambia el día
  en que aparece en el calendario.

## Lo que esta pantalla no hace

- No publica en el segundo exacto: lo programado, incluso con «Ahora», sale en la pasada
  siguiente del publicador. Solo «Subir ahora» publica en el acto.
- No cambia ni borra nada en las redes: editar lo ya publicado no toca la red, y lo publicado
  no se puede eliminar desde aquí.
- No pregunta antes de «Eliminar», ni deja deshacer un borrado.
- No tiene una forma de descartar un destino quemado: se reprograma, se sube, se desmarca en el
  editor o se borra el post entero.
- No cambia las opciones de TikTok ni el trial reel de algo ya programado, ni agrega TikTok
  desde el editor.
- No sube la portada como archivo, ni adjunta el PDF de la respuesta automática.
- No sube archivos sueltos en la carga masiva: solo por dirección.
- No duplica un post ni arrastra tarjetas en el calendario.
- No publica video en X.
- No conecta cuentas: eso es [Los Fierros](los-fierros.md). No muestra cómo le fue a lo
  publicado: eso es [Los Cortes](los-cortes.md) (cada publicación, lo que hizo en la red y lo
  que trajo) y [Los Números](los-numeros.md) (visitas, clics y de dónde vienen). No responde
  comentarios: eso es [La Mesa](la-mesa.md) (lo que te responden y tus respuestas). No cambia
  la zona horaria: eso es [Tu Cuenta](tu-cuenta.md).

## Para quien mantiene esta página

Lo que describe esta página sale de:

- La pantalla y el editor:
  - `src/app/admin/(dash)/schedule/page.tsx`
  - `src/app/admin/(dash)/schedule/composer.tsx`
  - `src/app/admin/(dash)/schedule/batch-upload.tsx`
  - `src/app/admin/(dash)/schedule/calendar.tsx`
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
- Lo que hacen sus botones (programar, guardar, reprogramar, eliminar, «Subir ahora», la carga masiva y la lectura de la cuenta de TikTok):
  - `src/app/admin/actions.ts`
- Cómo se llega y lo que rodea a la pantalla:
  - `src/app/admin/(dash)/page.tsx`
  - `src/app/admin/(dash)/termometro.tsx`
  - `src/app/admin/(dash)/nav.tsx`
  - `src/app/admin/(dash)/accounts/cuentas.tsx`
  - `src/app/admin/(dash)/error.tsx`
  - `src/app/not-found.tsx`
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
  - `src/lib/schedule-week.ts`
  - `src/lib/parrilla.ts`
  - `src/lib/networks.ts`
  - `src/lib/vocabulario.ts`
  - `src/components/ui.tsx`

Si cambias lo que se ve en alguno de ellos, actualiza esta página en el mismo commit.
