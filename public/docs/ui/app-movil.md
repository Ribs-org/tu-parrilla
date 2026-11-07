# La app del teléfono

Una app para Android que muestra de un vistazo lo programado y cómo van las redes de quien entra, y le deja publicar desde la galería del teléfono. Tiene cuatro pestañas, las del panel web en versión corta —La Parrilla, Publicar, Los Números y La Cocina— y, como el panel, un botón de Ajustes, pero hace mucho menos: mira lo programado y los números, y programa o publica fotos y videos en Instagram, Facebook y YouTube. También reprograma lo que se quemó, corrige el texto, la hora y las cuentas de lo programado o lo borra, y guarda solo lo que se está escribiendo como borrador: los borradores son los mismos del panel web, así que lo empezado en un lado se sigue en el otro. En La Cocina graba un video o saca una foto con la cámara del teléfono, ordena la cámara de frío (guardar, cambiar el nombre o el uso, sacar) y le pide una comanda al chef de la casa con las mismas opciones que el panel; también la sigue, le contesta al chef y la cancela. Todo lo demás —conectar redes, cambiar los archivos de lo programado, TikTok, comentarios, la página pública, el mesón del chef— se hace en el panel web.

## Cómo se llega

- Es solo para Android; no hay versión para iPhone. No se encuentra buscándola en una tienda: se instala con el archivo `.apk` que entrega quien administra el sitio, o por la prueba interna de Google Play si a la persona la invitaron. En el teléfono, la de la Play Store se llama «Tu Parrilla», con un bife sobre la reja de ícono; el APK de prueba de antes se llama «Vicente · Números», con la bandera de Chile. Son dos apps distintas para el teléfono: pueden estar las dos instaladas, y el APK se puede borrar cuando la de la tienda funcione.
- Se entra igual que al panel web ([Entrar al panel](ingresar.md)): con el correo y un código de seis dígitos que llega a ese correo. Entra solo quien está invitado, y cada persona ve sus propias cuentas. No hay contraseña.
- La primera vez pide el correo y el código. Después la sesión queda abierta: no los vuelve a pedir.
- Si el teléfono tiene PIN, patrón, huella o reconocimiento de cara, cada vez que la app arranca pide desbloquear con el aviso «Desbloquea para entrar a Tu Parrilla» (si seguía abierta en segundo plano, al volver a ella no lo pide). Si se cancela, la app muestra la pantalla de entrada, y la próxima vez que arranque lo vuelve a pedir. Sin desbloquear no se llega a ninguna pantalla de la cuenta, ni con un enlace.
- Si la sesión deja de valer (por ejemplo, porque quien administra el sitio revocó el acceso de los teléfonos), la app vuelve sola a la pantalla de entrada, sin ningún mensaje, y borra lo que tenía guardado de la cuenta, como al cerrar sesión.
- Para salir: el botón de arriba a la derecha → «Ajustes» → «Cerrar sesión» (ver «Ajustes», más abajo).
- Al entrar se abre La Parrilla.

## Qué se ve

Los títulos y rótulos se ven en mayúsculas por diseño; aquí van escritos como están en el código.

La app tiene los dos modos del panel, y es el mismo de la cuenta: lo que se elige en Ajustes vale
también en el panel web, y al revés. Esta página describe la noche, la de entrada. De día el
fondo es claro, los cortes son piezas de sushi y la sección «Se quemó» se llama «Se echó a
perder»; la equivalencia de cada dibujo está en «El modo día», en [index.md](index.md). Y unas
palabras cambian, como en el panel:
- la pestaña «La Parrilla» se llama «La Barra», y donde una frase dice «La Parrilla» dice «La
  Barra»;
- en Ajustes, «Los Fierros» son «Los Cuchillos» —también en «Abrir Los Cuchillos en el panel»—,
  y la frase de cada cuenta es «Con filo: conectada.», «Se está desafilando: su permiso vence
  esta semana. Reconéctala en el panel.» o «Sin filo: así no publica. Reconéctala en el panel.»;
- el botón de Ajustes lleva dos palillos en diagonal en vez del trinche y el cuchillo, y su aviso
  se lee «Ajustes: 1 se desafila» o «Ajustes: 2 sin filo»;
- el calor de cada día dice «Vacía», «Con piezas» o «Tabla llena», y el pie, «Ayer: 1 pieza
  servida» o «Ayer: N piezas servidas»;
- en La Cocina, «La cámara de frío» es «La nevera» —también en «Lo grabado queda guardado en la
  nevera.», «La nevera está vacía.», «De la nevera», «Guardar en la nevera» y «Sacar de la
  nevera»—, el mesón es «la bandeja», cada material se llama por su
  peso como pescado («un trozo», «un salmón entero», «un atún») y los estados de una comanda
  cambian como en el panel: «El chef mira el atún», «El despiece», «Armando las piezas», «Lista
  en la bandeja: N piezas».

Las frases de error que vienen del servidor no cambian: si una dice «Los Fierros», de día es
Los Cuchillos. Lo único
que dibuja el teléfono mismo es la pantalla de arranque, y sigue oscura en los dos modos.

Las preguntas y los avisos («¿Cerrar sesión en este teléfono?», «Publicar ahora», «Descartar»,
«No se pudo reprogramar») son de la app y van con el modo: una tarjeta al centro, con el resto
oscurecido, el título en mayúsculas, el detalle debajo y los botones de la app; el de lo que no
tiene vuelta, en rojo. Tocar fuera o el botón Atrás es lo mismo que el botón de la izquierda
(«Cancelar», «Quedarme»), salvo en «No se pudo guardar el borrador», donde hay que elegir. Un
aviso trae un solo botón, «Entendido».

### La pantalla de entrada

Tiene dos pasos, uno detrás del otro en la misma pantalla:

- **El correo.** El título «Tu Parrilla», la frase «Entra con tu correo: te mandamos un código.», un campo con el texto de ayuda «tu@correo.cl» y el botón «Mandarme un código» (mientras lo pide, «Enviando…»; apagado mientras el campo esté vacío).
- **El código.** El título «Tu código», la frase «Si tu correo está invitado, te llegará un código en un minuto. Vale diez minutos.», un campo con el texto de ayuda «000000» que solo acepta números, el botón «Entrar» (mientras comprueba, «Entrando…»; apagado hasta que haya seis dígitos) y, debajo, «Usar otro correo», que vuelve al paso del correo.

Si algo falla, el mensaje sale en rojo debajo del campo.

### La barra de pestañas

Abajo, cuatro pestañas en este orden: «La Parrilla», «Publicar», «Los Números» y «La Cocina». «Publicar» se ve como un círculo naranjo con una cruz, y «La Cocina», como un gorro de chef. La pestaña activa se ve en naranjo y su nombre sale también como título arriba de la pantalla. La Cocina llegó con la versión 1.2.0 de la app: un teléfono con la 1.1.0 tiene solo las otras tres hasta que se actualice desde la tienda (ver «La Cocina», más abajo).

Arriba a la derecha de las cuatro, al lado del título, un botón redondo con un trinche y un cuchillo, lado a lado: abre «Ajustes». Si alguna cuenta conectada necesita que la reconecten, el botón lleva un punto: ámbar si su permiso vence esta semana, rojo si ya se apagó (venció o dejó de sincronizar). Sin nada que avisar, no hay punto. Un lector de pantalla lo lee «Ajustes» o, con aviso, «Ajustes: 1 se enfría» (o «2 se apagaron», etc.).

En «La Parrilla», «Los Números» y «Tus publicaciones», la app muestra al instante lo último que descargó y lo actualiza por detrás; por eso funciona sin señal, con datos viejos. Arriba dice cuándo se actualizó: «Actualizado recién», «Actualizado hace 5 min», «Actualizado hace 2 h» o «Actualizado hace 1 d». Para actualizar a mano, se arrastra la pantalla hacia abajo.

### La Parrilla

Lo programado, de hoy en adelante, y lo que se quemó. De arriba abajo:

- La línea «lo que viene y cómo salió lo que ya se fue».
- **«Se quemó»**, en rojo, solo si algo falló en los últimos siete días y nadie lo archivó (en el panel web, con «Archivar», o por la API): lo archivado no sale acá. Una tarjeta con borde rojo por cada red donde un corte falló (un corte que falló en dos redes da dos tarjetas), de la más reciente a la más vieja. A la izquierda, el corte dibujado con todas sus marcas, quemado y con su banderita, como en el panel (ver «El corte» en [La Parrilla](la-parrilla.md)): se ve cuál de sus redes se quemó y si las demás salieron. Al lado: arriba la hora —solo «19:00» si era de hoy, o con el día y el mes delante, «mié 14 de oct · 19:00», como en el panel— y la cuenta, «Instagram · nombre_de_cuenta»; el texto del post (o «(sin texto)»); el motivo en rojo, cuando lo hay, y el botón con borde «Reprogramar» (mientras trabaja, «Reprogramando…», y los demás botones esperan).
- **«▸ Borradores (N)»**, solo si hay al menos un borrador guardado, del teléfono o del panel web. Al tocarlo se abre la lista (el triángulo pasa a «▾») y al tocarlo de nuevo se cierra. Cada borrador es una tarjeta con su texto en dos líneas (o «(sin texto)») y debajo, en chico, «para el vie 16 de oct a las 19:00» o «sin fecha», « · 1 archivo» o « · N archivos» si tiene, y « · guardado el mar 13 de oct a las 14:05». Van del guardado más recientemente al más viejo. Tocar uno lo abre en «Publicar».
- **El filtro por red**, debajo de «Se quemó» y de los borradores, como el del panel (ver «El filtro por red» en [La Parrilla](la-parrilla.md)): un renglón que se desliza de lado con «Todas» y un botón por red —cada uno con un punto en el color de la red: Instagram rosado, TikTok gris, YouTube rojo, Facebook azul— y cuántos posts tiene de hoy en adelante. Un post que sale a dos redes cuenta en las dos. Tocar una red deja solo lo que sale a ella, cada post con solo sus cuentas de esa red; tocarla de nuevo, o «Todas», vuelve a mostrar todo. Si la red elegida tiene dos cuentas o más, aparece debajo otro renglón con «Todas las de <Red>» y cada cuenta, con lo suyo. Con un filtro puesto, los borradores no aparecen en sus días (siguen en «▸ Borradores (N)»), y «Se quemó» muestra todo igual. El filtro no se guarda: al cerrar la app vuelve a «Todas». Con una sola cuenta no aparece.
- **Los días**, uno debajo del otro: siempre hoy y los seis siguientes, aunque estén vacíos, y después solo los que tienen algo, hasta treinta días adelante. Cada día lleva su rótulo —«Hoy · jue 15», «Mañana · vie 16», «sáb 17»—, a la derecha cuánto fuego tiene —«Apagada» (nada), «Prendida» (uno o dos posts) o «Parrilla llena» (tres o más)— y un botón redondo con una cruz, que abre «Publicar» con ese día puesto (un lector de pantalla lo lee «Programar el jue 15»). Debajo del rótulo, una barra fina con la mezcla de redes del día —un tramo por red, en su color, del largo de lo que sale a ella— y un renglón con cuánto salió, cuánto se quemó y cuánto falta, con los signos de los chips: «5 ✓ · 1 ✕ · 6 por salir» (un lector de pantalla lo oye en palabras: «5 cortes servidos, 1 falló, 6 por salir»; de día, «piezas servidas»). Un día sin posts ni borradores dice «No hay nada puesto. Préndela.», en naranjo, y hace lo mismo que la cruz.
- Cada post es una tarjeta con el mismo corte dibujado que el panel a la izquierda (ver «El corte» en [La Parrilla](la-parrilla.md)): la forma es el formato —entraña video, tira de asado carrusel con un hueso por archivo, bife foto, chori solo texto—, el color de la carne cómo va —rosada programada, naranja saliendo, dorada publicada, casi negra falló en todas—, una diagonal por cuenta —punteada todavía no sale, llena ya salió, carbonizada se quemó—, y un halo rojo con banderita si algo se quemó. Mientras algo se está publicando, sube humo encima (con «Quitar animaciones» del teléfono, dos volutas quietas). Al lado del dibujo: la hora, el texto (o «(sin texto)»), una línea por cuenta «Red · nombre_de_cuenta» con un punto en el color de la red, un signo y el color de su estado —«✓» en verde si salió, «…» y «· saliendo» en naranjo, «✕» en rojo si falló, «◐» y «· en tu bandeja de TikTok» en ámbar, «↻» y «· reintentando» en ámbar, «!» y «· reconéctala en el panel» en ámbar si su cuenta tiene el fierro frío— y, si esa cuenta falló o reintenta, « — » seguido del error. Al final, el formato y el estado en palabras, por ejemplo «Video · Programada» o «Carrusel · Falló en parte» (los estados: «Programada», «Saliendo ahora», «Publicada», «Falló en parte» o «Falló»). Si alguna cuenta dice «· en tu bandeja de TikTok» y el post tiene texto, debajo de las cuentas va un botón con borde ámbar, **«Copiar el texto»** (o **«Pasar el texto…»**, ver «Para copiar el texto de lo que llegó a TikTok»), y si el post es un video, debajo, «TikTok no recibe el texto de un video en la bandeja: pégalo al terminarlo allá.». Tocar ese botón no abre la publicación. La tarjeta lleva el borde ámbar si algo pide atención y rojo si se quemó. Ya no lleva la miniatura de la foto. Tocar la tarjeta abre «Editar publicación» (ver más abajo); un lector de pantalla la anuncia como botón, con la pista «Abre la publicación para corregirla o borrarla».
- **Lo que ya salió en todas sus redes** deja la tarjeta y se hunde (ese renglón no se toca), como en el calendario del panel: un renglón sin borde, sobre un fondo más hondo (de día, tostado), con el corte en chico y apagado, la hora, un punto por red, un «✓» verde y el texto en una línea. Lo que llegó a la bandeja de TikTok, lo quemado y lo que reintenta siguen en su tarjeta, aunque su hora haya pasado.
- **Hoy**, una línea naranja con «ahora · 14:20» separa lo que ya tuvo su hora de lo que viene, y se corre sola mientras la app está abierta (un lector de pantalla la lee «Ahora, 14:20»). La hora es la de la zona de tu cuenta. Lo que salió mientras la app estaba abierta se ve al arrastrar hacia abajo para actualizar.
- Un borrador con fecha aparece también en su día, debajo de los posts, como una tarjeta con borde punteado: arriba «BORRADOR · 19:00» y debajo su texto (o «(sin texto)»). Tocarla lo abre en «Publicar». Un borrador no está programado y no cuenta para el fuego del día: un día que solo tiene borradores sigue diciendo «Apagada».
- Al pie: «Ayer no salió nada.», «Ayer: 1 corte servido» o «Ayer: N cortes servidos». Cuenta cortes y no redes: uno que salió en tres redes es un corte.

Las horas y los días están en la zona horaria de [Tu Cuenta](tu-cuenta.md).

### Editar publicación

Se abre al tocar la tarjeta de un post en «La Parrilla». Arriba, la barra con el título «Editar publicación» y la flecha para volver. Mientras carga, la ruedita.

Si el post ya salió en alguna de sus cuentas, la pantalla solo dice en ámbar «Ya salió en alguna cuenta: lo que queda se corrige en el panel web.», muestra el texto del post —se puede seleccionar y copiar manteniéndolo apretado— y el botón «Volver». Si alguna cuenta lo está publicando en ese momento, lo mismo con «Hay una publicación en curso. Vuelve en un minuto.».

Si se puede editar, de arriba abajo:

- **«Texto»**: el texto del post, en un recuadro que se puede cambiar, con «Texto del post…» si está vacío. Debajo, a la derecha, cuántos caracteres lleva y el máximo, por ejemplo «30 / 280»: el máximo es el de la red más estricta entre las cuentas que siguen —280 si va a X, 500 a Threads, 2200 en las demás—, y pasado el máximo la cifra se pone roja.
- **«Cuándo sale»**: una ficha naranja «Cuándo: 07/11 a las 19:00» (día/mes y hora, en el reloj del teléfono). Tocarla abre la hoja «Cuándo sale» (ver «Para programar un post»). Si no se toca, la hora no cambia, aunque ya haya pasado.
- **«Cuentas»**: una línea por cuenta, «Red · nombre_de_cuenta» con el punto en el color de la red, y a la derecha «Quitar». Una cuenta quitada queda tachada, con « · se quita al guardar» y el botón «Devolver»; no se quita de verdad hasta tocar «Guardar». La última cuenta que queda no se puede quitar («Quitar» apagado), y debajo dice «Para sacarla de la última cuenta, borra la publicación.». No se pueden sumar cuentas.
- Una nota en ámbar, si el post tiene algo que el teléfono no cambia: «Desde el teléfono no se cambia y queda como está: …. Eso se cambia en el panel web.», con la lista de lo que tenga —«el archivo» o «los N archivos», «la portada», «los atributos», «la palabra clave «…»», «las opciones de TikTok» (o de Instagram o Facebook, si es un trial reel o una historia)—. Todo eso se guarda tal cual.
- El botón naranjo **«Guardar»** (mientras trabaja, «Guardando…»). Si sale bien, vuelve a «La Parrilla», que se actualiza sola.
- Debajo, en rojo, **«Borrar publicación»** (mientras trabaja, «Borrando…»). Pregunta antes: «Borrar publicación», «¿Borrar esta publicación? Sale de La Parrilla y no se publica en ninguna cuenta.», con «Cancelar» y «Borrar» en rojo. Si sale bien, vuelve a «La Parrilla» y el post ya no está.

Mientras guarda o borra, el texto, la ficha y los botones esperan.

### Publicar

De arriba abajo:

- Mientras se abre un borrador, «Abriendo borrador…», y no se puede tocar nada.
- Si el borrador abierto tiene algo que el teléfono no programa, un aviso en amarillo: «Este borrador va también a TikTok: eso se programa en el panel web.», «Este borrador tiene la palabra clave «GUIA»: eso se programa en el panel web.» (con la palabra que tenga) o, con las dos cosas, «Este borrador va también a TikTok y tiene la palabra clave «GUIA»: eso se programa en el panel web.». Con ese aviso se puede seguir editando —se guarda igual, sin perder lo de TikTok ni la palabra clave—, pero «Programar» y «Publicar ahora» quedan apagados.
- Un cuadro de texto con la ayuda «Texto del post…» (hasta 2200 caracteres). Debajo, a la izquierda, «En YouTube el primer renglón es el título» y, a la derecha, el contador, por ejemplo «120 / 2200».
- Los archivos elegidos, como miniaturas (un video se ve como un cuadro que dice «Video»), cada uno con una «✕» para quitarlo, y el botón «+ Fotos o video» mientras queden menos de diez. Cada archivo se sube apenas se elige, uno detrás del otro; mientras tanto la miniatura lleva una franja abajo: «45 %» el que está subiendo, «En cola» los que esperan y, en rojo, «Reintentar» uno cuya subida falló (tocarlo la vuelve a intentar). Quitar uno que está subiendo cancela su subida.
- Las cuentas a las que se puede publicar, como botones redondos con borde, «Red · nombre_de_cuenta»; la marcada se pinta en naranjo. Solo salen cuentas de Instagram, Facebook y YouTube conectadas en el panel; TikTok no aparece nunca. Con una sola cuenta conectada, viene marcada; con dos o más, ninguna. Un borrador abierto trae marcadas las suyas. Una cuenta que se desconectó sale como «Instagram · nombre_de_cuenta · reconéctala», con «reconéctala» en rojo, y no se puede marcar. Mientras no haya ninguna marcada: «Elige al menos una cuenta.»
- Solo si hay una cuenta de Instagram marcada y exactamente un video (sin fotos): un botón «Trial reel · nombre_de_cuenta» por cada cuenta de Instagram marcada, y la explicación «Un trial reel solo lo ven quienes no te siguen. Tú decides desde Instagram cuándo compartirlo con todos.» Debajo, en ámbar, una línea por cada una de esas cuentas donde Instagram ya rechazó un trial reel, con la frase del rechazo (o «Instagram ya rechazó un trial reel en esta cuenta: prográmalo como reel normal.»). El botón se puede tocar igual, pero lo más probable es que se queme.
- Con la misma condición —una cuenta de Instagram marcada y exactamente un video—, un bloque **«Música de Instagram · nombre_de_cuenta»** por cada cuenta de Instagram marcada, con «Una canción de la biblioteca de Instagram encima del sonido del video. Instagram no deja ver el reel con la canción antes de publicarlo: sale tal como lo dejes acá.» Tiene:
  - **«Sugiéreme una»** («Buscando una…» mientras piensa): propone una canción que le quede al post, leyendo el texto escrito. Sale en un recuadro con ««Título» de Artista», una frase de por qué (o «Es de las que están sonando en Instagram estos días.» / «Salió buscando «…».»), «Escuchar», **«Usar esta»** y **«Otra»** («Buscando otra…»), que trae una distinta sin repetir las ya mostradas. Cuando no quedan: «Ya te mostré todas las que encontré para este post. Busca una por nombre.»
  - **«Elegir canción»** (o «Cambiar canción» si ya hay una): un buscador «Busca una canción o un artista» con «Buscar», el título «Sonando ahora en Instagram» o «Resultados para «…»», y una fila por canción con su título, su artista, «Escuchar» («Pausar» mientras suena) y «Usar esta» («Elegida» en la puesta). Al final, «Cerrar la lista». Sin resultados: «Instagram no encontró canciones con «…».» o «Instagram no tiene canciones para mostrar ahora.»
  - Con una canción puesta: «Canción elegida: «Título» de Artista», «Escuchar», «Quitar» (en rojo), y dos filas de volumen, «Canción: 50 %» y «Video: 100 %», cada una con «−» y «+» que suben o bajan de a 10 (de 1 a 100 %), con «Si en el video hablas, bájale a la canción para que no tape tu voz.»
  - Con la versión 1.1.0 de la app (la que no trae el reproductor de audio), «Escuchar» abre la muestra fuera de la app —en el navegador o el reproductor del teléfono—, y el bloque lo dice: «En esta versión de la app, la muestra se abre fuera de ella.» Desde la 1.2.0 suena ahí mismo.
  - Con una cuenta conectada con el login de Instagram, en vez de todo eso: «La música de Instagram no está disponible en esta cuenta: se conectó con el login de Instagram, y Meta solo la da a las cuentas conectadas con Facebook.»
- El botón «Cuándo: 14/10 a las 19:00» (con el día y la hora elegidos). De partida trae la próxima hora en punto; si se llegó desde la cruz de un día de La Parrilla, trae ese día a esa misma hora en punto, y un borrador con fecha trae la suya.
- Los mensajes: en rojo los problemas; en gris cómo van las subidas («Subiendo el archivo…» o «Subiendo 3 archivos…») y el envío («Programando…» o «Publicando…», y después «Listo»).
- Abajo, «Programar» y «Publicar ahora». Los dos están apagados mientras no haya texto o algún archivo y al menos una cuenta marcada, mientras algún archivo no haya terminado de subir, mientras se envía, y con el aviso amarillo de arriba.
- Debajo, en chico, cómo va el borrador: «Lo que escribas se guarda solo como borrador.» (antes de escribir nada), «Abriste un borrador: lo que cambies se guarda solo.», «Guardando borrador…», «Borrador guardado.» o, en rojo, «No se pudo guardar el borrador.» o «Este borrador ya no existe: se programó o se descartó. Mira cómo quedó en La Parrilla.».
- Si hay algo escrito, algún archivo o un borrador abierto, dos botones de texto: «Nueva publicación» y, en rojo, «Descartar». Con el borrador que ya no existe, solo «Nueva publicación».

Lo que se escribe se guarda solo, como borrador, un momento después del último cambio, y también si la app pasa a segundo plano. Hace falta texto o un archivo ya subido: abrir «Publicar» y salir no deja un borrador vacío. El borrador guarda el texto, los archivos ya subidos, las cuentas marcadas, el trial reel, la canción de «Música de Instagram» y la fecha, pero la fecha solo si alguien la eligió (la próxima hora en punto con que abre no se guarda). Es el mismo borrador que se ve en el panel web.

Mientras se cargan las cuentas dice «Cargando cuentas…». Si no se pudieron cargar: «No se pudieron cargar las cuentas.» con «Reintentar». Si no hay ninguna que sirva: «No hay ninguna cuenta lista para publicar desde el teléfono. Conéctala en el panel web, en Los Fierros.»

### Los Números

Las dos mitades del tablero del panel ([Los Números](los-numeros.md)), más cortas. De arriba abajo:

- La línea «cómo te fue en las redes y en tu página».
- Cinco botones de período, que se deslizan de lado: «Hoy», «7 días», «30 días» (el que viene marcado), «90 días» y «Todo».
- Solo con más de una cuenta: botones de cuenta, también deslizables: «Todas las cuentas» (el que viene marcado) y uno por cuenta, «Red · nombre_de_cuenta». La cuenta filtra «En las redes»; «En tu página» es siempre de todas.
- **Tarjeta «En las redes»**, con la bajada «Lo que hicieron tus publicaciones donde las publicaste. Lo cuentan las redes.» Dos cifras: «Views ganadas» y «Seguidores ganados» (con «+» delante si es más que cero), las dos con «En el período · sin YouTube» debajo; una raya «—» es que no se sabe, no que sea cero. Después **«Lo que más creció»**: hasta cinco publicaciones, de más a menos views ganadas, cada una con una barra detrás que la compara con la primera, el texto (o su etiqueta), «Red · nombre_de_cuenta» y las views ganadas. Tocar una abre su detalle. Al final, el botón «Ver todas las publicaciones →».
- **Tarjeta «En tu página»**, con la bajada «Quién entró a tu página de links y qué apretó. Lo cuenta Tu Parrilla, sin cookies.» Dos cifras: «Visitas» y «Clicks en tus links», cada una con la comparación con el período anterior debajo: «↑ +12% vs. período anterior» en verde, «↓ -8% …» en rojo, «→ 0% …» si casi no cambió, o «—» si no hay con qué comparar (el período anterior tuvo cero, o es «Todo»). Después **«Qué publicación te trajo gente»**: hasta cinco etiquetas, de más a menos visitas, con su barra, el texto del post y su cuenta (o «?s=etiqueta» si no es de una publicación) y las visitas. Estas filas no se pueden tocar.
- El botón «⋯ Más: tus cuentas», que abre debajo **una tarjeta por cuenta** del período elegido: la red y el nombre de la cuenta («Instagram · @cuenta»; con dos cuentas de una red, dos tarjetas), el número de seguidores y debajo «seguidores · +12 en el período», «seguidores · sin cambio» o «seguidores · — en el período»; «Visitas al perfil: N · Alcance: N», a veces con el día de la lectura entre paréntesis; y, con más de un día de datos, el gráfico de barras «Visitas al perfil por día». Abierto, el botón dice «Menos». Mientras carga: «Cargando tus cuentas…».

### La Cocina

Para grabar un video (o sacar una foto) con la cámara del teléfono, ordenar lo guardado en la cámara de frío y pedirle una comanda al chef de la casa, sin pasar por el panel. Es la misma Cocina del panel ([La Cocina](la-cocina.md)): lo grabado se guarda en la cámara de frío ([La cámara de frío](la-camara-de-frio.md)), la comanda que sale es la misma que el chef ve llegar desde el panel, con las mismas opciones del formulario «Pedir una comanda», y lo que se cambia o se saca en un lado se ve en el otro. Llegó con la versión 1.2.0 de la app; desde el 2026-11-06 hace también lo de la cámara de frío y las comandas que antes eran solo del panel.

Si La Cocina no está encendida para la cuenta, la pestaña muestra solo el rótulo «El chef de la casa» y una tarjeta: «El chef de la casa edita tus videos: le llevas un video largo, un podcast en videollamada o tus tomas sueltas, y te devuelve una tanda de clips y carruseles con sus textos, para que los programes en tus redes. Está en piloto, con pocas cuentas.» y «Si quieres probarla, pídesela a quien administra Tu Parrilla.».

Encendida, arriba de todo:

- «Actualizado …» y un punto con una frase, la misma del panel: verde, «La cocina está abierta: el chef toma las comandas apenas llegan.» (a veces con «Cada una tarda unas <N> horas.»); ámbar, «La cocina atiende a mano: una persona toma las comandas, así que la tuya puede tardar hasta el próximo día hábil.» o «La cocina está cerrada por ahora: lo que pidas espera su turno.».
- Tres burbujas que cambian lo que se ve debajo: **«Tu comanda»** (la que viene marcada), **«La cámara de frío»** y **«Tus comandas»**.
- Si el chef está preguntando algo en alguna comanda, en naranjo, «El chef te pregunta algo: contéstale en «Tus comandas».»; tocarlo lleva ahí.

**«Tu comanda»** es una tarjeta con el borde de arriba naranjo:

- «Graba el video, dile al chef qué quieres que salga y mándaselo. Lo grabado queda guardado en la cámara de frío.» En un teléfono que no puede grabar (ver abajo), «Elige el video de la galería o de la cámara de frío, dile al chef qué quieres que salga y mándaselo.».
- La casilla «Tengo los derechos de lo que guardo y el permiso de quienes aparecen.». Sin marcarla, los botones de abajo están apagados y se lee «Marca la casilla de los derechos para grabar o elegir.» (o «… para elegir.» si no puede grabar). Se marca una vez cada vez que se abre la app; vale también para «Guardar en la cámara».
- Los botones «Grabar video» (naranjo) y «Sacar foto», y debajo «Elegir de la galería» (fotos y videos, hasta diez de una vez). «Grabar video» y «Sacar foto» abren la cámara del teléfono; la primera vez, el teléfono pide permiso para la cámara y, para el sonido del video, el micrófono. **Un teléfono con la app 1.1.0** (que no trae esos permisos) no muestra «Grabar video» ni «Sacar foto»: solo «Elegir de la galería», como botón naranjo. Lo que se graba o se elige acá se guarda en la cámara de frío y entra solo a esta comanda.
- **«De la cámara de frío»**: «Toca lo que va en esta comanda: un video es el plato principal, y lo demás lo acompaña.», los filtros («Todo (N)», «Videos (N)», «Audios (N)», «Imágenes (N)», «Otros (N)», solo si hay de más de una clase) y lo guardado, de lo más nuevo a lo más viejo: una tarjeta por cosa con «VIDEO», «FOTO», «AUDIO» o «ARCHIVO» a la izquierda, el nombre, una línea con cómo se llama por su peso, lo que dura y lo que pesa («un cuarto · 30:30 · 1,4 GB») y un gancho a la derecha: vacío, o naranjo con «✓» si va en la comanda. Tocarla la suma o la saca. Caben el plato principal y 20 más. Vacía: «La cámara está vacía.».
- **«El riel de la comanda»**: sin nada, «Todavía no hay nada colgado: toca un material para traerlo.». Con algo, una barra gris y, debajo, cada cosa en su tarjeta, colgada de un gancho, con una «✕» para sacarla de la comanda (sigue guardada). Lo que todavía se está guardando dice «Guardando…» o «Guardando… 45 %», con una barra naranja que avanza, y una «✕» para cancelarlo. Debajo del nombre de cada video, cuatro burbujas, como en el panel: «Plato principal», «Para intercalar», «Otra cámara» y «La pantalla». El primer video que se elige es el plato principal; los demás van «Para intercalar» hasta que se cambie. Una foto dice «Para intercalar»; un audio u otro archivo, «Va aparte: <su uso>» o «Va aparte, para que el chef lo use». Lo grabado se llama por su día y su hora, por ejemplo «Video del 2 de nov, 14.05.mp4» o «Foto del 2 de nov, 14.05.jpg»; lo de la galería, con su nombre.
- Si algo no se pudo guardar, su tarjeta dice por qué en rojo —la frase de la cuota, «No hay espacio para «…»: pesa … y te quedan … libres de …. Saca algo que ya no uses, o pide más espacio.», o «Se cortó la subida. Toca «Reintentar» para seguir donde quedó.»— con «Reintentar» y «Quitar».
- Con un plato principal, **«Qué es el plato principal»**: «Un video largo» (viene marcado), «Un podcast en videollamada» o «Tomas sueltas», con la ayuda del elegido debajo («Una persona a cámara: una charla, una clase, un video editado o crudo.», «Una videollamada con varias caras en mosaico.» o «Varias respuestas cortas de una persona.»).
- **«Qué quieres que salga»**: «Los formatos», «Clips verticales» (viene marcado) y «Carruseles», al menos uno; «Cuántos, más o menos», «Lo que dé el material» (viene marcado), «Unos 10» o «Unos 20»; la línea «Los estilos los elige el chef, con lo que mejor le vaya al material.»; y «Para cuándo (opcional)», una burbuja «Elegir el día» que abre una hoja «Para cuándo» con el mes (sin hora; hoy se puede elegir) y «Cancelar» / «Listo». Elegido, la burbuja dice el día («10 de noviembre») y al lado aparece «Quitar». Debajo, «Informativo: la hora real la estima el chef.».
- **«Tu instrucción al chef»**: un cuadro de texto con la ayuda «Qué quieres que salga: la duración, el tono, qué destacar o qué evitar.». Debajo, «Si no escribes nada, el chef elige.» y el contador «0 / 1000» (en rojo si se pasa). Después, una fila que se desliza de lado con ejemplos que se suman al texto al tocarlos: «+ Clips de menos de 30 segundos.», «+ Destaca la parte de ventas.», «+ No uses la anécdota del final.», «+ Empieza cada clip con la pregunta, no con la respuesta.» y «+ Tono cercano, como una conversación.».
- **«Tu marca»**: «El chef firma los videos con «<nombre>».» (o «Todavía no tiene nombre.») y «Cambiar», que abre debajo «Lo que el chef usa para vestir lo que cocina. Se guarda para las comandas que vengan.» y tres campos: «El nombre», «El @ (opcional)» y «El llamado final (opcional)»; el botón pasa a decir «Listo» y lo cierra. Viene con la marca de la última comanda o, la primera vez, con el nombre de [Tu Cuenta](tu-cuenta.md). El color de acento no se elige en el teléfono: la línea dice «El color de acento, #3D7BFF, se cambia en el panel web.» o «El color de acento se elige en el panel web; sin él, el chef usa el del estilo.», y la comanda lleva el que ya estaba guardado.
- **«Confirmar»**: un renglón por cosa, como el bloque del panel —«Plato principal: <nombre> (<qué es>)», «Lo acompañan: <nombre> (<otra cámara, para intercalar…>), …», «Qué sale: Clips verticales y Carruseles · Unos 10», «Los estilos: los elige el chef», «Para cuándo: <día>» si se eligió, y «Tu marca: <nombre> · <@> · «<llamado>»»—, y debajo cuántas irían antes («Es la próxima en la fila.» o «Hay N comandas antes que la tuya.») y, si la cocina toma las comandas sola, «Hora estimada: <día y hora>».
- Lo que falta, en gris, mientras el botón esté apagado: «Espera a que termine de guardarse lo que sube.», «Graba un video o elige uno guardado: es el plato principal.», «Elige qué quieres que salga.», «Acorta tu instrucción al chef.» o «Ponle nombre a tu marca: es el que el chef usa en los videos.».
- El botón «Mandar al chef» (mientras manda, «Mandando…»). Al colgarse, un aviso: «Comanda colgada» / «El chef la toma en su turno. La ves avanzar en «Tus comandas» y te avisamos por correo cuando esté lista.», con «Entendido». El formulario vuelve a como viene, con la marca que se escribió.

**«La cámara de frío»** (de día, «La nevera»):

- La cuota como el riel de la cámara, diez ganchos que se llenan en naranjo (en ámbar desde el 85 %, en rojo llena), con «1,5 GB de 20 GB» debajo y « · subiendo …» si algo está subiendo. Desde el 85 %, «La cámara se está llenando.»; llena, «La cámara está llena: saca lo que ya no uses para guardar más.».
- **«Guardar en la cámara»** (de día, «Guardar en la nevera»), una tarjeta con el borde de arriba naranjo: «Sin pedir comanda: queda guardado, y de acá lo eliges cuando pidas una.»; «Para qué es (opcional)», con «Sin uso» (viene marcado), «Material crudo», «Intro», «Outro», «B-roll», «Música», «Logo», «Tipografía» y «Otro», y «Le dice al chef para qué es: tu intro, tu música, tu logo. Se cambia después.»; la misma casilla de los derechos y los mismos botones de «Tu comanda». Lo que se graba o se elige acá se guarda con ese uso y **no** entra a la comanda; mientras sube, su tarjeta aparece en esta misma tarjeta, con su avance o su error.
- **«Lo que hay adentro (N)»**: los filtros, si hay de más de una clase, y una tarjeta por material: la ficha, el nombre, la línea de su peso, su uso («Intro», «Música»…) o, sin uso, lo que es («Video», «Audio», «Imagen», «Otro archivo»), y en naranjo «En una comanda en marcha» (o «En N comandas en marcha») si una comanda que el chef tiene o va a tomar lo usa. Debajo, «Cambiar» y «Sacar de la cámara» (de día, «Sacar de la nevera»; mientras trabaja, «Sacando…»). En uso, «Sacar de la cámara» está apagado y se lee «Se puede sacar cuando la comanda termine.». Vacía: «La cámara está vacía. Lo que guardes queda acá, y no vence.».
- «Cambiar» abre una hoja desde abajo, «Cambiar», con «El nombre», «Para qué es» (las mismas burbujas, con «Sin uso»), «Las comandas que ya lo usaron siguen con el nombre y el uso que tenía.» y los botones «Cancelar» y «Guardar» (mientras guarda, «Guardando…»).
- «Sacar de la cámara» pregunta antes: «¿Sacar «<nombre>» de la cámara?» (de día, «… de la nevera?»), «Se borra, y no se puede deshacer. Las comandas que ya lo usaron no cambian.», con «Cancelar» y «Sacar de la cámara» en rojo.

**«Tus comandas»**: las últimas quince, de la más nueva a la más vieja. Cada una es una tarjeta con su estado en palabras, como en el panel —«Comanda colgada», «El chef mira la res», «El desposte», «Al fuego», «Sirviendo: 3 de 5 tandas en el mesón», «Lista en el mesón: 12 cortes», «No se puede cocinar», «Cancelada»…—, en naranjo mientras el chef la tiene, en verde lista y en rojo si no se pudo; la fecha y la hora en que se pidió; cinco rayas con el recorrido (colgada, el chef mira, el desposte, al fuego, el mesón) encendidas hasta donde va; el nombre del plato principal; la instrucción entre «»; mientras espera, «Es la próxima en la fila.» o «Hay N comandas antes que la tuya.»; «Hora estimada: <día y hora>» si se sabe; «El chef: «<mensaje>»» si dejó uno, o en rojo por qué no la cocinó; y, si algo espera en el mesón, «Te espera 1 creativo en el mesón, en el panel web.» (o «Te esperan N creativos…»). Una en «El chef te pregunta» lleva el borde naranjo y, dentro, un recuadro con la pregunta del chef y: si dio opciones, una burbuja por opción (la que el chef usa si nadie contesta va en naranjo), y tocar una responde (esa dice «Respondiendo…» mientras manda); si la respuesta es libre, un cuadro «Tu respuesta al chef», el botón «Responder» (apagado vacío o con más de 500 caracteres; mientras manda, «Respondiendo…») y el contador «0 / 500». Debajo, en chico, el plazo: «Si no contestas hoy antes de las 18:00, el chef sigue con «…».» (o «mañana antes de las …», o «el <día> <N> de <mes> antes de las …»). Después, «Lo que pasó ▾», que despliega cada paso con su fecha y hora, el estado y, si lo hubo, el mensaje del chef («6 nov, 12:05 · El chef mira la res — Lo miro.»). Mientras no esté en el horno («Comanda colgada», «El chef mira la res», «El desposte» o «El chef te pregunta»), «Cancelar la comanda» en rojo (mientras trabaja, «Cancelando…»), que pregunta antes: «¿Cancelar esta comanda?», «El chef deja de prepararla. Lo que llevaba sigue en tu cámara de frío.» (de día, «… en tu nevera.»), con «Volver» y «Cancelar la comanda». Sin comandas: «Todavía no tienes comandas.». Mientras alguna está en marcha y la pestaña está a la vista, se actualiza sola cada veinte segundos. Al pie: «Lo que el chef cocina espera en el mesón, en el panel web: desde ahí lo programas o lo descartas.».

La estación dibujada de cada comanda (la parrilla, la res, la tabla) es solo del panel: el teléfono dice lo mismo con el estado y las cinco rayas.

**Con un servidor que todavía no se actualizó** (por un rato, mientras sale una versión nueva), «Tu comanda» es el camino corto de antes: sin las burbujas de cada video ni «Qué es el plato principal», «Qué quieres que salga», «Tu marca» ni «Confirmar» —la comanda sale como «Un video largo», «Clips verticales» y «Lo que dé el material», y lo que acompaña va «Para intercalar»—; en vez de «Tu marca», «El chef firma los videos con tu marca: «…».». En «La cámara de frío» no hay «Para qué es», «Cambiar» ni «Sacar», y al pie se lee «Cambiar o sacar algo de la cámara de frío se hace en el panel web.»; en «Tus comandas» no hay «Cancelar la comanda».

### Ajustes

Se abre con el botón de Ajustes de cualquier pestaña. Arriba, la flecha para volver y el título «Ajustes». Debajo:

- **«Los Fierros»**, con «Actualizado …» debajo, y una tarjeta por cada cuenta conectada a Tu Parrilla, de todas las redes (también TikTok, X y Threads, aunque desde el teléfono no se publique en ellas). Cada tarjeta trae «Red · nombre_de_cuenta», el fierro —una barra delgada: naranja si la conexión está viva, ámbar si se enfría, gris si se apagó o está desconectada— y una frase:
  - «Al rojo: conectada.»
  - «Se está enfriando: su permiso vence esta semana. Reconéctala en el panel.» (en ámbar)
  - «Se apagó: así no publica. Reconéctala en el panel.» (en rojo)
  - «Desconectada.»
  Sin cuentas, «Todavía no conectas ninguna cuenta.». Mientras carga, «Cargando tus cuentas…».
- Debajo, «Tus redes conectadas. Se conectan y se reconectan en el panel web.» y el botón «Abrir Los Fierros en el panel», que abre [Los Fierros](los-fierros.md) en el navegador del teléfono (ahí puede pedir entrar con el correo, como el panel).
- **«El modo»**, con la frase «De noche: el acero y los cortes de la parrilla. Se guarda en tu cuenta: vale también en el panel web.» (de día, «De día: el fondo claro y piezas de sushi. Se guarda…») y un botón que dice adónde lleva: «Modo día» de noche, «Modo noche» de día. Cambia en el momento y lo guarda en la cuenta; sin señal, el teléfono lo recuerda y lo manda cuando vuelve la conexión.
- **«Los avisos»**, para que la app avise en el teléfono. Una frase según cómo estén, y un botón:
  - Encendidos: «Te llegan a este teléfono: lo que se quemó, las cuentas que se enfrían o se apagan, las preguntas del chef, las comandas que terminan, las respuestas del equipo y, una vez por hora como mucho, los comentarios nuevos de La Mesa. El correo te sigue llegando igual.» y el botón «Apagar los avisos».
  - Apagados: «Apagados en este teléfono. Encendidos, te llegan: …» con la misma lista, y el botón «Encender los avisos». Al tocarlo, el teléfono puede preguntar si deja que Tu Parrilla mande notificaciones: hay que permitirlo.
  - Si el teléfono no deja: «El teléfono no deja que Tu Parrilla te avise. Actívalo en los ajustes del teléfono, en Notificaciones.», con los botones «Abrir los ajustes del teléfono» y «Apagar los avisos».
  - En una app que todavía no tiene la versión 1.2.0 desde la tienda: «Este teléfono todavía no tiene los avisos: llegan con la versión nueva de la app, la que se instala desde la tienda.», sin botón.
  De día dice «lo que se echó a perder» y «las cuentas que se desafilan o quedan sin filo». Apagarlos o encenderlos vale solo para este teléfono; los correos no cambian.
- **«Tu sesión»**, con «Cerrar sesión» en rojo. Pregunta «¿Cerrar sesión en este teléfono?» / «Para volver a entrar te va a llegar un código a tu correo.», con «Cancelar» y «Cerrar sesión» (en rojo). Al confirmar, la app vuelve a la pantalla de entrada y borra del teléfono lo que guardó de la cuenta —lo último que mostró cada pantalla—: quien entre después en ese teléfono no lo ve, y «atrás» ya no vuelve a ninguna pantalla de la cuenta. Las cuentas conectadas, lo programado y los borradores no se tocan: están en la cuenta, no en el teléfono.
- **«El libro de sugerencias»** (de día, «La caja de sugerencias»), para escribirle al equipo que hace Tu Parrilla y leer lo que le respondió. Si hay respuestas que no abrió, al lado del rótulo va un punto naranjo y «1 respuesta nueva» (o «<N> respuestas nuevas»). Una tarjeta con dos botones redondeados arriba, «Escribir» y «Lo que nos escribiste» (este con un punto naranjo si hay algo sin leer); arranca en «Lo que nos escribiste» si hay respuestas sin leer, si no en «Escribir».
  - En «Escribir»: el dibujo de un libro abierto (de día, una caja de madera con una ranura), los botones «Una idea», «Algo no funciona» y «Otra cosa», un campo para escribir y el botón «Dejarlo en el libro» (de día, «Echarlo a la caja»). Es lo mismo que el libro del panel, con sus mismos textos y mensajes: está contado en [El libro de sugerencias](libro-de-sugerencias.md). En la app, en vez del navegador, el mensaje lleva la versión de la app, y al recibirse dice «Quedó en el libro.» (de día, «Quedó en la caja.») con «Escribir otra». Lo escrito no se borra al pasar a la otra pestaña.
  - En «Lo que nos escribiste»: lo que escribió, de lo más nuevo a lo más viejo, cada cosa en un recuadro con su tipo y su fecha («Una idea · 6 nov 2026»), a la derecha «Respuesta nueva» en naranjo con un punto, «Respondida» o «Sin respuesta todavía», y el primer renglón de lo que escribió. Tocarlo lo abre: el texto entero y, si hay respuesta, «Te respondió el equipo · <fecha>» en naranjo con la respuesta debajo; sin respuesta, «Todavía no te respondemos. Cuando lo hagamos, aparece acá y te llega un correo.». Abrir una respuesta nueva la deja leída: se apagan su «Respuesta nueva» y el punto del rótulo. Mientras carga, «Abriendo…»; sin nada escrito, «Todavía no nos escribes nada. Lo que escribas aparece acá, con lo que te respondamos.»; sin señal y sin nada guardado, «No se pudo actualizar.».
- Al pie, la versión de la app: «Versión 1.2.0» (o «Versión 1.1.0» en un teléfono que todavía no se actualiza desde la tienda: esa no tiene La Cocina) y, si llegó una actualización por aire, « · actualización » seguido de ocho letras y números que la identifican. Sirve para saber qué versión tiene alguien que pide ayuda.

Aquí no se conecta ni se desconecta nada: eso es del panel web.

### Tus publicaciones

Se abre con «Ver todas las publicaciones →» en Los Números. Arriba, la barra con el título «Tus publicaciones» y la flecha para volver.

- Los cinco botones de período, deslizables: «Hoy», «7 días», «30 días» (el que viene marcado), «90 días» y «Todo».
- Botones de red: «Todas», «Instagram», «TikTok», «YouTube» y «Facebook». Se pueden marcar varios; «Todas» quita el filtro. Threads y X no tienen botón: hoy están en «Próximamente». (En la cuenta del revisor de Meta, las publicaciones de Threads pueden aparecer con «Todas».)
- La lista de lo publicado en el período, ordenada de más a menos views ganadas. Cada fila: la miniatura, el texto, «Red · fecha», la marca «Se pasó» cuando el post sacó al menos el doble de views ganadas que la mediana (el valor del medio) de los posts que se están mirando, y abajo «N views» y «P% arrastre».
- Si no hay nada: «No publicaste nada en este período.»
- Tocar una fila abre su detalle.

### El detalle de una publicación

Arriba, la barra con el título «Publicación» y la flecha para volver. Después: la red y la fecha, el texto completo, y una tarjeta con «Views (acumulado)», «Views ganadas», «Likes», «Comentarios», «Compartidos», «Alcance», «Visitas al sitio», «Clicks», «CTR» y «Arrastre». Si el post tiene atributos, una tarjeta «Atributos» con cada uno. Al final, si la red mandó el enlace del post (y es `https`), «Abrir en Instagram ↗» (o la red que corresponda), que abre el post en su red.

Si el post no está entre lo descargado: «Vuelve a la lista y ábrelo de nuevo: este post no está en lo descargado.» y el botón «Volver».

## Qué se puede hacer

### Para entrar por primera vez

1. Abre la app.
2. Escribe tu correo en «tu@correo.cl» y toca «Mandarme un código».
3. Abre el correo «… es tu código para entrar a Parrilla» y copia los seis dígitos.
4. Escríbelos en «000000» y toca «Entrar» (o la tecla de enviar del teclado). Se abre «La Parrilla».

Si el código no llega, revisa el spam y que el correo esté bien escrito; «Usar otro correo» vuelve al primer paso para pedir otro. Son a lo más tres códigos cada quince minutos.

### Para que la app te avise en el teléfono

La primera vez que entras, unos segundos después, la app pregunta «¿Te avisamos al teléfono?» —«Cuando algo se quema, una cuenta se enfría, el chef te pregunta o te deja una comanda, el equipo te responde o te llegan comentarios a La Mesa. Se apagan cuando quieras en Ajustes.»— con «Ahora no» y «Avisarme».

1. Toca «Avisarme».
2. Si el teléfono pregunta si Tu Parrilla puede mandar notificaciones, toca «Permitir».

Si tocaste «Ahora no», no vuelve a preguntar: se encienden en Ajustes → «Los avisos» → «Encender los avisos». Tocar un aviso abre su pantalla: lo que se quemó, en La Parrilla; una cuenta que se enfría o se apaga y la respuesta del equipo, en Ajustes; una pregunta del chef o una comanda, en «Tus comandas» de La Cocina; los comentarios nuevos, en La Parrilla (La Mesa todavía no está en la app). Los comentarios llegan como un resumen («3 comentarios nuevos en La Mesa», con las redes), uno por hora como mucho.

### Para apagar los avisos

1. Toca el botón de Ajustes.
2. En «Los avisos», toca «Apagar los avisos».

Deja de llegar todo a este teléfono; los correos siguen igual. Cerrar sesión también los apaga en ese teléfono.

### Para ver qué viene y qué se quemó

1. Pestaña «La Parrilla». Lo que falló está arriba, en «Se quemó», con el motivo; lo que viene, día por día debajo. Hoy, la línea «ahora» separa lo que ya pasó de lo que viene.
2. Para ver solo una red, tocar su botón en el filtro, debajo de los borradores; para una sola cuenta de esa red, tocarla en el renglón que aparece debajo. «Todas» vuelve a mostrar todo.

### Para reprogramar lo que se quemó

1. En «La Parrilla», en la tarjeta de «Se quemó», toca «Reprogramar».
2. Se abre la hoja «Cuándo sale» (ver «Para programar un post»): elige el día, la hora y los minutos, y toca «Listo». De partida trae la próxima hora en punto.
3. El post entero pasa a esa hora y el destino que falló vuelve a la cola, sin intentos gastados. La tarjeta sale de «Se quemó» y el post aparece en su día.

Reprogramar no arregla la causa: si falló porque la cuenta se desconectó o el archivo no sirve, va a volver a fallar. Eso se corrige en el panel web —reconectar en [Los Fierros](los-fierros.md), o el post en [La Parrilla](la-parrilla.md)—.

### Para ver cómo va una semana o un mes

1. Pestaña «Los Números».
2. Toca «Hoy», «7 días», «30 días», «90 días» o «Todo». Con más de una cuenta, se puede elegir una.

### Para ver cómo le fue a un post

1. Pestaña «Los Números». Las que más crecieron están en «Lo que más creció»: toca una.
2. Para verlas todas, «Ver todas las publicaciones →»; ahí, si hace falta, elige el período y la red, y toca el post.
3. En el detalle, para verlo en su red, «Abrir en … ↗».

### Para ver los seguidores de cada red

1. Pestaña «Los Números», abajo, «⋯ Más: tus cuentas».

### Para programar un post

1. Pestaña «Publicar», o la cruz de un día en «La Parrilla» (así ya trae ese día puesto).
2. Escribe el texto en el cuadro «Texto del post…». En YouTube, el primer renglón es el título del video.
3. Toca «+ Fotos o video», da permiso para ver la galería si lo pide y elige hasta diez archivos en total (un video puede pesar hasta 500 MB). Empiezan a subir solos: cada miniatura dice cuánto lleva. Para sacar uno, toca su «✕».
4. Toca las cuentas a las que debe salir: quedan marcadas en naranjo.
5. Toca «Cuándo: …». Sube desde abajo la hoja «Cuándo sale»: el mes, con «‹» y «›» para cambiarlo (hoy con un borde naranjo, el elegido relleno y los días que ya pasaron apagados); debajo, la fila «Hora» (de 00 a 23) y la fila «Minutos» (de cinco en cinco), que se deslizan de lado. Toca el día, la hora y los minutos, y «Listo». Lo que ya pasó no se puede elegir, y «Listo» se apaga si la fecha que traía ya pasó. «Cancelar», o tocar fuera de la hoja, la deja como estaba. La hora es la del reloj del teléfono.
6. Cuando los archivos terminaron de subir, toca «Programar».
7. Abajo se ve «Programando…» y después «Listo». Un segundo después el formulario se vacía y la app salta a «La Parrilla», donde ya aparece el post si cae dentro de los próximos treinta días. Si venía de un borrador, el borrador sale de la lista.

Instagram y YouTube necesitan al menos un archivo; Facebook acepta solo texto. YouTube necesita un video: con solo fotos, el post se programa igual, pero el destino de YouTube falla al publicarse con «YouTube solo recibe video.», que se ve en «La Parrilla».

### Para publicar de inmediato

1. Arma el post como en los pasos 1 a 4 de arriba.
2. Toca «Publicar ahora».
3. Aparece la ventana «Publicar ahora» con el texto «¿Publicar ahora en nombre_de_cuenta y otra_cuenta? Saldrá en los próximos 5 minutos.».
4. Toca «Publicar» (o «Cancelar» para no hacer nada).

### Para mandar un trial reel a Instagram

Un trial reel lo ven solo quienes no siguen la cuenta; después, desde la app de Instagram, la persona decide si lo comparte con todos.

1. En «Publicar», elige un solo video, sin fotos.
2. Marca la cuenta de Instagram.
3. Toca «Trial reel · nombre_de_cuenta» para encenderlo (queda en naranjo).
4. «Programar» o «Publicar ahora».

Si Instagram no tiene la función habilitada para esa cuenta, el destino falla al publicarse y en «La Parrilla» sale, después de la cuenta, «@cuenta no tiene trial reels: Instagram los da solo a cuentas con un mínimo de seguidores, y esta no lo alcanza. Prográmalo como reel normal o en otra cuenta.» (si le faltan seguidores) o «@cuenta no tiene trial reels disponibles, probablemente porque Instagram no le habilitó la función. Prográmalo como reel normal o en otra cuenta.» (por otro motivo, con lo que dijo Instagram al final). Corregirlo se hace en el panel web, en [La Parrilla](la-parrilla.md).

### Para ponerle música de Instagram a un reel

1. En «Publicar», elige un solo video, sin fotos, y marca la cuenta de Instagram. Aparece «Música de Instagram · nombre_de_cuenta».
2. Escribe el texto primero si quieres una sugerencia que le quede: «Sugiéreme una» lo lee.
3. Toca «Sugiéreme una» (y «Otra» hasta que te guste), o «Elegir canción» para ver lo que está sonando o buscar. «Escuchar» deja oír la muestra.
4. Toca «Usar esta». Si en el video hablas, baja «Canción» con «−».
5. «Programar» o «Publicar ahora». No hay vista previa del reel con la canción: Instagram la pega al publicar.

Si Instagram rechaza la canción al publicar, el destino se quema con «Instagram no aceptó la canción «Título» de Artista en @cuenta. … Borra esta publicación y prográmala de nuevo con otra canción o sin música.»: ni el teléfono ni el panel cambian la canción de algo ya programado.

### Para dejar algo a medias y seguirlo después

No hay que hacer nada: lo escrito se guarda solo como borrador («Borrador guardado.»). Se puede cerrar la app, cambiar de pestaña o seguirlo en el panel web, en «Borradores (<N>)» de [La Parrilla](la-parrilla.md). Si un archivo todavía está subiendo, conviene esperar a que termine: el borrador guarda solo los archivos ya subidos.

### Para retomar un borrador

1. En «La Parrilla», toca «▸ Borradores (N)» y después el borrador. Si tiene fecha, también está como tarjeta punteada en su día.
2. Se abre en «Publicar» con lo que tenía: el texto, los archivos, las cuentas, el trial reel y la fecha. Lo que estaba en «Publicar» antes queda en los borradores.
3. Sigue escribiendo («Abriste un borrador: lo que cambies se guarda solo.»), o «Programar».

Un borrador empezado en el panel web se abre igual. Si va también a TikTok o tiene una palabra clave, sale el aviso amarillo y se programa en el panel web; desde el teléfono se puede editar sin que eso se pierda.

### Para empezar otra publicación sin perder la que está

1. Toca «Nueva publicación». Lo que había queda en «Borradores (N)» y el formulario se vacía.

La cruz de un día en «La Parrilla» hace lo mismo, con ese día ya puesto.

### Para descartar un borrador

1. Ábrelo en «Publicar» (o, si es el que se está escribiendo, quédate ahí).
2. Toca «Descartar».
3. Aparece «Descartar» con «¿Descartar este borrador? Lo escrito y los archivos elegidos se pierden.». Toca «Descartar» (o «Cancelar»).

El borrador desaparece también del panel web.

### Si se corta la señal

- **Mientras sube un archivo:** la miniatura queda en rojo con «Reintentar» y abajo sale «No se pudo subir el archivo. Revisa tu señal. Toca el archivo para reintentar.». Cuando vuelva la señal, toca la miniatura. Los demás archivos siguen subiendo.
- **Al programar:** sale en rojo «No se pudo conectar. Revisa tu señal.». Cuando vuelva, toca de nuevo «Programar» o «Publicar ahora»; los archivos ya subidos no se vuelven a subir. Si el primer intento sí había alcanzado a programarlo, el segundo no lo publica dos veces: sale «Este borrador ya no existe: se programó o se descartó. Mira cómo quedó en La Parrilla.». Si el servidor no contesta en 30 segundos, la app deja de esperar y dice lo mismo que sin señal. Y si tampoco se pudo guardar el borrador («No se pudo guardar el borrador.»), «Programar» no manda nada y dice «No se programó: primero tiene que guardarse el borrador. Revisa tu señal y vuelve a intentarlo.»: el borrador guardado es lo que impide que un segundo toque publique dos veces.

### Para cancelar una subida

1. Toca la «✕» del archivo que está subiendo: se cancela y sale de la lista.

### Para grabar un video y mandárselo al chef

1. Abre la pestaña «La Cocina» (el gorro de chef). Viene en «Tu comanda».
2. Marca «Tengo los derechos de lo que guardo y el permiso de quienes aparecen.».
3. Toca «Grabar video» (o «Sacar foto»). La primera vez, dale permiso a la cámara y al micrófono. Si la app no muestra esos botones, es la 1.1.0: toca «Elegir de la galería» y elige un video que ya grabaste.
4. Graba y acepta en la cámara del teléfono. Al volver, el video empieza a guardarse en la cámara de frío con su avance, «Guardando… N %», y al terminar queda colgado en el riel con «Plato principal» marcado.
5. Si quieres, elige qué es el plato principal, qué quieres que salga, cuántos y para cuándo. Si no tocas nada, va como viene: un video largo, clips verticales, lo que dé el material.
6. Escribe en «Tu instrucción al chef» qué quieres que salga, o toca algún ejemplo. Si no escribes nada, el chef elige.
7. Revisa «Confirmar» y toca «Mandar al chef». Sale el aviso «Comanda colgada», y la comanda aparece arriba en «Tus comandas».

Mientras sube, conviene dejar la app abierta: en segundo plano el teléfono puede pausarla (ver «Si se corta la subida a La Cocina»). Un video largo pesa varios GB: con Wi-Fi sube mucho más rápido que con datos. Lo grabado con la app no queda en la galería del teléfono: queda guardado en la cámara de frío.

### Para sumar a la comanda algo que ya está guardado

1. En «La Cocina» → «Tu comanda», baja hasta «De la cámara de frío».
2. Toca cada cosa que quieras sumar: su gancho se pone naranjo con «✓» y se cuelga en el riel. El primer video que elijas es el plato principal.
3. Para decir qué es otro video, toca su burbuja en el riel: «Para intercalar», «Otra cámara» o «La pantalla». Para que otro sea el principal, «Plato principal» en ese.
4. Para sacar algo de la comanda, tócalo de nuevo, o toca su «✕» en el riel. Sigue guardado.

Lo que se guardó desde el panel también está aquí, y lo que se graba en el teléfono también aparece en la cámara de frío del panel.

### Para guardar algo sin pedir comanda

1. En «La Cocina», toca la burbuja «La cámara de frío».
2. En «Guardar en la cámara», si quieres, elige para qué es («Intro», «Música»…).
3. Marca la casilla de los derechos y toca «Grabar video», «Sacar foto» o «Elegir de la galería». Queda guardado, con ese uso, y no entra a ninguna comanda.

### Para cambiarle el nombre o el uso a algo guardado

1. En «La cámara de frío» → «Lo que hay adentro», toca «Cambiar» en su tarjeta.
2. Escribe el nombre, elige para qué es y toca «Guardar».

### Para sacar algo de la cámara de frío

1. En su tarjeta, toca «Sacar de la cámara».
2. En la pregunta, «Sacar de la cámara». Se borra y libera su espacio; no se puede deshacer.

Si «Sacar de la cámara» está apagado, una comanda en marcha lo usa: se puede cuando termine.

### Para cancelar una comanda

1. En «Tus comandas», toca «Cancelar la comanda» en su tarjeta (solo está mientras no esté en el horno).
2. En la pregunta, «Cancelar la comanda». Lo que llevaba sigue en la cámara de frío.

### Si se corta la subida a La Cocina

- Su tarjeta queda en rojo con «Se cortó la subida. Toca «Reintentar» para seguir donde quedó.». Con señal, toca «Reintentar»: sigue desde la última parte que llegó, sin subir de nuevo lo que ya estaba. «Quitar» la descarta y libera su lugar en la cuota.
- Si la app se cerró mientras subía, al volver a abrir «La Cocina» sigue sola donde quedó, si la subida tiene menos de un día. Lo grabado con la app no se pierde aunque se cierre: la app guarda una copia hasta que termina de subir (no queda en la galería del teléfono) y la borra al terminar o al tocar «Quitar». Una subida que quedó a medias más de un día se borra sola y empieza de nuevo desde el principio.

### Para corregir o borrar algo programado desde el teléfono

1. En «La Parrilla», toca la tarjeta del post. Se abre «Editar publicación».
2. Cambia el texto, toca «Cuándo: …» para elegir otra hora y toca «Listo», o toca «Quitar» en la cuenta donde ya no debe salir.
3. Toca «Guardar». Vuelve a «La Parrilla» con el cambio puesto.

Para sacarlo entero, en la misma pantalla toca «Borrar publicación» y confirma con «Borrar».

Se puede mientras no haya salido en ninguna cuenta. Lo que ya salió en alguna, los archivos, la portada, la palabra clave, las opciones de TikTok y sumar cuentas se cambian en el panel web, en [La Parrilla](la-parrilla.md). Las reglas son las mismas del panel: el texto que cabe en cada red y una hora nueva en el futuro.

### Para copiar el texto de lo que llegó a TikTok

Un video que se mandó desde el panel web con «Enviar como borrador a mi bandeja de TikTok» llega a la app de TikTok sin su texto: la bandeja de TikTok recibe solo el archivo. Las fotos sí llevan su texto.

1. En «La Parrilla», busca la tarjeta del post: su cuenta de TikTok dice «◐ … · en tu bandeja de TikTok».
2. Toca «Copiar el texto». Dice «Copiado» un momento: el texto ya está para pegar.
3. En TikTok, abre el aviso del borrador, pega el texto en la descripción y publica.

En las versiones de la app que todavía no traen el portapapeles, el botón dice «Pasar el texto…» y abre la lista de compartir del teléfono: ahí, toca «Copiar». Si la lista no tiene «Copiar», abre la publicación (toca la tarjeta) y copia el texto manteniéndolo apretado.

## Mensajes que puede ver

| Lo que dice la pantalla | Qué significa | Qué hacer |
|---|---|---|
| «No se encendieron los avisos» con «No se pudieron encender los avisos. Revisa tu conexión y vuelve a intentarlo.» | El teléfono no pudo registrarse para los avisos: sin señal, o el servidor no respondió. | Volver a intentarlo en Ajustes → «Los avisos» → «Encender los avisos» con señal. Si sigue, avisarle a quien administra el sitio: puede faltar algo en la configuración de la app. |
| «No se apagaron los avisos» con «No se pudieron apagar los avisos. Revisa tu conexión y vuelve a intentarlo.» | No se pudo avisar al servidor; los avisos siguen encendidos. | Volver a intentarlo con señal. |
| «El teléfono no deja que Tu Parrilla te avise. Actívalo en los ajustes del teléfono, en Notificaciones.» | Se negó el permiso de notificaciones, y la app ya no lo puede volver a pedir. | Tocar «Abrir los ajustes del teléfono», entrar a Notificaciones y encenderlas para Tu Parrilla. |
| «Desbloquea para entrar a Tu Parrilla» | La app pide el bloqueo del teléfono. | Usar el PIN, patrón, huella o cara del teléfono. Si se cancela, sale la pantalla de entrada. |
| «Ese correo no se ve bien.» | Al correo le falta algo, como la @ o el dominio. | Revisarlo y volver a tocar «Mandarme un código». |
| «Si tu correo está invitado, te llegará un código en un minuto. Vale diez minutos.» | Es lo mismo que dice el panel web, esté o no invitado el correo: no revela quién lo está. | Esperar el correo. Si no llega en unos minutos, revisar el spam y que el correo esté bien escrito, o pedirle a quien administra el sitio que lo invite. |
| «Ese código no es válido o ya venció.» | El código está mal escrito, venció (dura diez minutos), ya se usó, se pidió otro después (vale solo el último) o ese correo no está invitado. | Revisarlo, o «Usar otro correo» y pedir uno nuevo. |
| «Demasiados intentos. Pide un código nuevo.» | Cinco códigos equivocados seguidos agotan ese código; también sale con muchos intentos seguidos desde la misma conexión. | «Usar otro correo» y pedir un código nuevo. |
| «Demasiados intentos en las últimas 24 horas. Prueba de nuevo más tarde.» | Diez códigos equivocados en un día, sumando la web y el teléfono. | Esperar; hasta un día después del primer error. Ver [Entrar al panel](ingresar.md). |
| «El servidor no respondió bien. Prueba de nuevo en un rato.» | Falla del servidor, no de lo que se escribió. | Esperar y volver a intentar; si se repite, avisar a quien administra el sitio. |
| «No se pudo conectar. Revisa tu señal.» | Sin conexión al pedir el código, al entrar o al programar el post, o el servidor no contestó en 30 segundos. | Revisar la señal; en «Publicar», volver a tocar «Programar» o «Publicar ahora». |
| «No se pudo actualizar.» | Falló la descarga de datos nuevos; lo que se ve puede ser viejo. | Arrastrar hacia abajo o tocar «Reintentar» cuando haya señal. |
| «No se pudo cargar.» | No hay datos guardados y no se pudieron descargar. | «Reintentar». |
| «Algo se rompió», con «No fue nada que hicieras. Vuelve a intentarlo; si se repite, cierra la app y ábrela de nuevo.» y el botón «Reintentar» | Una pantalla falló al dibujarse; lo más probable, un dato que guardó una versión anterior de la app. | «Reintentar»: borra lo que la app guardó de las pantallas y las vuelve a cargar. Si se repite, cerrar la app y abrirla; si sigue, avisar a quien administra el sitio. |
| «No se pudo reprogramar» con «La hora debe estar en el futuro.» | La hora elegida ya pasó. | Volver a tocar «Reprogramar» y elegir una hora futura. |
| «No se pudo reprogramar» con «Ese destino ya no existe.» | El post se borró (por ejemplo, desde el panel web). | Arrastrar hacia abajo para actualizar. |
| «No se pudo reprogramar» con «No se pudo conectar. Revisa tu señal.» | Sin conexión. | Volver a intentarlo cuando haya señal. |
| «No se pudo copiar» con «Abre la publicación y mantén apretado su texto para copiarlo.» | Al tocar «Copiar el texto» o «Pasar el texto…», el teléfono no dejó copiar ni compartir. | Tocar la tarjeta del post y, en «Editar publicación», mantener apretado el texto para copiarlo. |
| «Ya salió en alguna cuenta: lo que queda se corrige en el panel web.» (en «Editar publicación») | El post ya se publicó en al menos una de sus cuentas: desde el teléfono no se edita ni se borra. | Corregirlo en el panel web, en [La Parrilla](la-parrilla.md); lo publicado se cambia en la red. |
| «Hay una publicación en curso. Vuelve en un minuto.» (en «Editar publicación», o con «No se pudo guardar») | Alguna cuenta está publicando ese post en este momento. | Esperar un minuto y volver a abrirlo. |
| «Desde el teléfono no se cambia y queda como está: … Eso se cambia en el panel web.» | El post tiene archivos, portada, atributos, palabra clave u opciones de una red: al guardar se conservan tal cual. | Nada, si solo hay que corregir el texto, la hora o las cuentas; lo demás, en el panel web. |
| «No se pudo abrir la publicación. Revisa tu señal.» | Sin conexión al abrir «Editar publicación». | «Reintentar» cuando haya señal, o «Volver». |
| «El post ya no existe.» (al abrirlo, o con «No se pudo guardar» o «No se pudo borrar») | Se borró en el panel web o en otro teléfono. | «Volver» y arrastrar «La Parrilla» hacia abajo para actualizar. |
| «No se pudo guardar» con «El texto excede los 280 caracteres de X.» (o «… 500 caracteres de Threads.», o «El texto es demasiado largo para Instagram.») | El texto no cabe en una de las redes que siguen. | Acortarlo (la cifra de abajo a la derecha dice cuánto cabe) o quitar esa cuenta. |
| «No se pudo guardar» con «La hora debe estar en el futuro.» | La hora elegida ya pasó. | Tocar «Cuándo: …» y elegir una hora futura. |
| «No se pudo guardar» con «Escribe un texto o adjunta un archivo.» | Se borró todo el texto de un post sin archivos. | Escribir algo, o borrar la publicación. |
| «No se pudo guardar» con otra frase (por ejemplo, de una cuenta que se desconectó) | La misma regla que rechazaría el cambio en el panel web. | Seguir lo que dice; si es la conexión, reconectar en [Los Fierros](los-fierros.md). |
| «No se pudo borrar» con «Ya se publicó (o está publicando): elimínalo en la red.» | Mientras estaba abierta la pantalla, el post salió en alguna cuenta. | Borrarlo en la red; en el panel web se ve qué salió. |
| «No se pudo guardar» o «No se pudo borrar» con «No se pudo conectar. Revisa tu señal.» | Sin conexión. | Volver a tocar cuando haya señal. |
| «No hay nada puesto. Préndela.» | Ese día no tiene nada programado ni ningún borrador. | Tocarlo (o la cruz) para programar algo ese día. |
| «▸ Borradores (N)» | Hay N borradores guardados, del teléfono o del panel web. | Tocarlo para ver la lista. |
| «BORRADOR · 19:00» (tarjeta punteada en un día) | Un borrador con esa fecha. Todavía no está programado: no va a salir solo. | Tocarlo para abrirlo y programarlo. |
| «Ayer no salió nada.» / «Ayer: N cortes servidos» | Cuántos posts de ayer salieron en al menos una red. | Nada. |
| «Ninguna publicación ganó views en este período. Las métricas llegan con la sincronización diaria, así que lo publicado hoy aparece mañana.» (en «Lo que más creció») | Ninguna publicación ganó views conocidas en el período. | Elegir un período más largo, o esperar la sincronización del día siguiente. |
| «Ninguna visita llegó todavía por el link de una publicación.» (en «Qué publicación te trajo gente») | En el período no llegó ninguna visita con etiqueta. | Elegir un período más largo; pegar los links con etiqueta (ver [Los Números](los-numeros.md)). |
| «—» bajo «Visitas» o «Clicks en tus links» | No hay con qué comparar: el período anterior tuvo cero, o el período es «Todo». | Nada. |
| «Cargando tus cuentas…» | Se están descargando las tarjetas de «⋯ Más: tus cuentas». | Esperar. |
| «Todavía no hay lecturas de cuenta. La primera llega con la sincronización de esta noche.» | Las cuentas aún no tienen números guardados. | Esperar al día siguiente. |
| «No publicaste nada en este período.» (en «Tus publicaciones») | No hay publicaciones sincronizadas en el período con ese filtro. | Elegir un período más largo, u otra red. |
| «Se pasó» (en «Tus publicaciones») | Ese post sacó al menos el doble de views ganadas que la mediana de la lista. | Nada; es una marca para ubicar lo que anduvo mejor. |
| «Sin permiso para ver la galería.» | El teléfono no le dio permiso a la app para ver fotos y videos. | Dar el permiso en los ajustes del teléfono y volver a tocar «+ Fotos o video». |
| «Ese tipo de archivo no se puede publicar.» | Uno de los archivos elegidos no es una foto JPG, PNG, GIF o WebP ni un video MP4, MOV o WebM, que es lo que se puede publicar (una foto HEIC o un video 3GP, por ejemplo). Sale al elegirlo. | Elegir otro archivo. |
| «El archivo supera los 500 MB.» | Un archivo es demasiado grande. | Elegir uno más liviano. |
| «Elige al menos una cuenta.» | No hay ninguna cuenta marcada. | Tocar al menos una. |
| «No se pudieron cargar las cuentas.» | Falló la descarga de la lista de cuentas. | «Reintentar». |
| «No hay ninguna cuenta lista para publicar desde el teléfono. Conéctala en el panel web, en Los Fierros.» | No hay ninguna cuenta de Instagram, Facebook o YouTube. | Conectar la cuenta en el panel web, en [Los Fierros](los-fierros.md). Si solo hay TikTok, desde el teléfono no se puede publicar. |
| «… · reconéctala» | Esa cuenta perdió la conexión. | Reconectarla en el panel web, en [Los Fierros](los-fierros.md). |
| «45 %», «En cola» (sobre una miniatura) | El archivo está subiendo, o espera su turno. | Esperar. |
| «Subiendo el archivo…», «Subiendo N archivos…» | Faltan archivos por subir; mientras tanto «Programar» y «Publicar ahora» están apagados. | Esperar. |
| «Reintentar» (en rojo, sobre una miniatura) y «No se pudo subir el archivo. Revisa tu señal. Toca el archivo para reintentar.» | Se cortó la subida de ese archivo. | Tocar la miniatura cuando haya señal, o quitarlo con su «✕». |
| «Programando…», «Publicando…», «Listo» | El avance del envío. | Esperar; con «Listo» el post quedó programado. |
| «Lo que escribas se guarda solo como borrador.» | Todavía no hay nada escrito. | Nada. |
| «Abriste un borrador: lo que cambies se guarda solo.» | Se abrió un borrador desde «La Parrilla». | Seguir escribiendo, o «Programar». |
| «Guardando borrador…», «Borrador guardado.» | Lo escrito se está guardando, o ya quedó guardado. | Nada. |
| «No se pudo guardar el borrador.» | El último guardado falló (sin señal, por ejemplo). | Hacer cualquier cambio cuando haya señal para que lo intente de nuevo. |
| «No se programó: primero tiene que guardarse el borrador. Revisa tu señal y vuelve a intentarlo.» | Se tocó «Programar» o «Publicar ahora» y el borrador no se pudo guardar (sin señal). Para no publicar dos veces, no se mandó nada. | Volver a tocar cuando haya señal: primero se guarda el borrador y después se programa. |
| «Este borrador ya no existe: se programó o se descartó. Mira cómo quedó en La Parrilla.» | Ese borrador se programó o se descartó en el panel web o en otro teléfono, o ya se programó desde acá y se perdió la respuesta. La pantalla dejó de guardar y los botones de enviar se apagan. | Mirar «La Parrilla». Para seguir, «Nueva publicación». |
| «Abriendo borrador…» | Se está descargando el borrador que se tocó. | Esperar. |
| «Ese borrador ya no existe: se programó o se descartó.» | Se tocó un borrador que ya no está. | Arrastrar «La Parrilla» hacia abajo para actualizar la lista. |
| «No se pudo abrir el borrador. Revisa tu señal.» | Sin conexión al abrir un borrador. | Volver a tocarlo cuando haya señal. |
| «Este borrador va también a TikTok: eso se programa en el panel web.» (o con «tiene la palabra clave «…»») | El borrador tiene algo que el teléfono no programa. Se puede editar, pero no enviar desde acá. | Programarlo en el panel web, en [La Parrilla](la-parrilla.md). |
| «Descartar» / «¿Descartar este borrador? Lo escrito y los archivos elegidos se pierden.» | Confirmación de descartar. | «Descartar» o «Cancelar». |
| «No se pudo descartar el borrador: sigue en la lista de borradores.» | Sin conexión al descartar; el formulario se vació, pero el borrador sigue guardado. | Abrirlo desde «Borradores (N)» y volver a descartarlo cuando haya señal. |
| «Hay un archivo que no terminó de subir» / «Espera a que termine, reinténtalo o quítalo antes de dejar esta publicación.» | Se tocó «Nueva publicación», un borrador o la cruz de un día con un archivo todavía subiendo o caído. | Esperar a que suba, tocar «Reintentar» en la miniatura o quitarlo, y volver a intentar. |
| «No se pudo guardar el borrador» / «Si sigues, lo último que cambiaste se pierde.» | Se quiso dejar la publicación, pero el último guardado falló. | «Quedarme» y esperar a tener señal, o «Seguir igual» si no importa perder lo último. |
| «Publicar ahora» / «¿Publicar ahora en …? Saldrá en los próximos 5 minutos.» | Confirmación de publicar de inmediato. | «Publicar» o «Cancelar». |
| «Instagram, YouTube y TikTok necesitan al menos un archivo.» | Hay una cuenta de Instagram o YouTube marcada y ningún archivo. | Agregar una foto o video, o desmarcar esas cuentas. |
| «Escribe un texto o adjunta un archivo.» | El post está vacío. | Escribir texto o agregar un archivo. |
| «Máximo diez archivos por publicación.» | Hay más de diez archivos. | Quitar algunos. |
| «La hora debe estar en el futuro.» | La hora elegida ya pasó. | Tocar «Cuándo: …» y elegir una hora futura. |
| «La fecha no se entendió.» | La fecha no llegó bien al servidor. | Volver a elegirla. |
| «Un trial reel es un solo video, sin fotos.» | El trial reel quedó con más de un archivo o con fotos. | Dejar un solo video. |
| «Instagram no respondió con su música. Inténtalo de nuevo en un rato.» | En «Música de Instagram», Instagram no contestó. | Volver a tocar en un rato. |
| «Instagram no dejó ver su música con esta cuenta. Reconéctala en Los Fierros y vuelve a intentarlo.» | El permiso de la cuenta venció o no alcanza. | Reconectarla en el panel web, en Los Fierros. |
| «Instagram no tiene una muestra de esa canción para escuchar.» | Esa canción no trae muestra, o no se pudo abrir. | Elegirla igual si se conoce, u otra. |
| «La música de Instagram solo funciona en cuentas conectadas con Facebook, y esta se conectó con el login de Instagram.» | Al programar, la cuenta de Instagram está conectada con el login de Instagram. | Tocar «Quitar» en la canción, o reconectar la cuenta con Facebook en el panel web. |
| «La cuenta x no está conectada. Vuelve a conectarla en Los Fierros.» (con el nombre de la cuenta en lugar de x) | La cuenta elegida perdió la conexión. Los Fierros está en el panel web, en el botón «Ajustes»: la app no tiene esa pantalla. | Reconectarla en el panel web. |
| «Una de las cuentas elegidas no es tuya.» | Una cuenta ya no pertenece a quien publica (por ejemplo, se borró). | Cerrar la app del todo y volver a abrirla: la lista de cuentas de «Publicar» se carga al abrir. |
| «Red desconocida o sin publicación: x.» | Se intentó publicar en una red que el teléfono no maneja (hoy, TikTok). | Publicar en esa red desde el panel web, en [La Parrilla](la-parrilla.md). |
| «Falta subir un archivo.» | Uno de los archivos subidos ya no está en el servidor. | Los elegidos en el teléfono se vuelven a subir solos: esperar y tocar de nuevo «Programar». Si el archivo venía de un borrador, quitarlo con su «✕» y volver a elegirlo. |
| «No se pudo guardar. Intenta de nuevo.» | Falla del servidor al programar el post. | Volver a tocar «Programar» o «Publicar ahora». |
| «Falta configurar Cloudflare R2 (R2_*).» | El sitio no tiene configurado dónde guardar archivos. | Avisar a quien administra el sitio. |
| «Un archivo no es del almacén.», «El cuerpo no se entendió.», «Las opciones de la red no se entendieron.» | Errores internos que no deberían verse. | Cerrar y abrir la app, armar el post de nuevo; si se repite, avisar a quien administra el sitio. |
| «Programada», «Saliendo ahora», «Publicada», «Falló en parte», «Falló» (en «La Parrilla», después del formato: «Video · …») | El estado del post. «Falló en parte»: salió o sigue pendiente en alguna cuenta y falló en otra. La línea de la cuenta que falló lleva «✕» y el error de la red. | Si falló, revisarlo en el panel web, en [La Parrilla](la-parrilla.md). |
| En «La Parrilla», después de la cuenta: «YouTube solo recibe video.», «@cuenta no tiene trial reels: …» o «@cuenta no tiene trial reels disponibles, …», «Instagram rechazó la publicación.» o «Instagram rechazó la publicación en @cuenta: «…» (código …).» (con lo que dijo Meta), «La red no terminó de procesar el video.», «La publicación se cortó a la mitad y ya no quedan intentos. Revisa el archivo y reprográmala.», «La cuenta no está conectada. Reconéctala y reprograma.» | Por qué falló ese destino al publicarse. | Corregir en el panel web: reconectar en [Los Fierros](los-fierros.md) si es la conexión, y corregir el post en [La Parrilla](la-parrilla.md). |
| En «La Parrilla», después de la cuenta: «No se pudo hablar con la red. Se reintentará.» | Falla pasajera de la red. | Esperar: se reintenta solo, a los quince minutos y después a las dos horas. |
| En «La Parrilla», después de la cuenta: «Instagram llegó a su tope de publicaciones por día: sale apenas se libere un cupo.» | Esa cuenta de Instagram ya publicó por la API lo máximo que Instagram deja en 24 horas. No es un fallo: no gasta intentos. | Esperar: se vuelve a probar cada hora y sale solo. |
| «Vuelve a la lista y ábrelo de nuevo: este post no está en lo descargado.» | El detalle no encontró el post entre lo descargado. | «Volver», actualizar la lista y tocarlo de nuevo. |
| «Si quieres probarla, pídesela a quien administra Tu Parrilla.» (en «La Cocina») | La Cocina no está encendida para esta cuenta. | Pedírsela a quien administra el sitio; la enciende en [Los Maestros](los-maestros.md). |
| «La cocina está cerrada por ahora: lo que pidas espera su turno.» | El chef no está trabajando en este momento. | Se puede mandar igual: la comanda espera en la fila. |
| «La cocina atiende a mano: una persona toma las comandas, así que la tuya puede tardar hasta el próximo día hábil.» | El servidor del chef está conectado, pero las comandas las toma una persona del equipo. | Se puede mandar igual: la comanda espera su turno. |
| «Esa pregunta ya no espera respuesta: se respondió, pasó su plazo o la comanda se canceló.» (al responder al chef) | Se contestó desde el panel, pasó el plazo y el chef siguió con la opción por defecto, o la comanda se canceló. La lista se actualiza sola. | Nada: la tarjeta ya muestra cómo siguió. |
| «Elige una de las opciones del chef.» | La respuesta no es una de las opciones (la pregunta cambió entre medio). | Arrastrar hacia abajo para actualizar y tocar una opción. |
| «No se pudo mandar tu respuesta: revisa la señal y vuelve a intentarlo.» | La respuesta no llegó: se cortó la señal. | Volver a tocar la opción o «Responder». |
| «Marca la casilla de los derechos para grabar o elegir.» | Falta marcar «Tengo los derechos de lo que guardo y el permiso de quienes aparecen.». | Marcarla, si es cierto. |
| «Sin permiso para la cámara» / «Dale permiso a Tu Parrilla para usar la cámara en los ajustes del teléfono, y vuelve a intentarlo.» | El teléfono no le dio permiso a la app para la cámara. | Darlo en los ajustes del teléfono (Aplicaciones → Tu Parrilla → Permisos) y volver a tocar «Grabar video». |
| «Guardando…», «Guardando… N %» | Lo grabado o elegido está subiendo a la cámara de frío. | Esperar con la app abierta. «Mandar al chef» se enciende al terminar. |
| «Se cortó la subida. Toca «Reintentar» para seguir donde quedó.» | Se cortó la señal o el almacén no contestó, después de varios intentos. | «Reintentar» con señal: sigue desde donde quedó. |
| «No hay espacio para «…»: pesa … y te quedan … libres de …. Saca algo que ya no uses, o pide más espacio.» | No cabe en la cuota de la cámara de frío (contando lo que está subiendo). | Sacar algo de la cámara («La cámara de frío» → «Sacar de la cámara»), o pedir más espacio a quien administra el sitio. Después, «Reintentar». |
| «La Cocina no está encendida para tu cuenta.» | Se la apagaron mientras la pantalla estaba abierta. | Arrastrar hacia abajo para actualizar; pedirla de nuevo a quien administra el sitio. |
| ««…»: ese tipo de archivo no se guarda. Van videos (MP4, MOV, WebM o MKV), …» | Lo elegido de la galería no es algo que la cámara de frío guarde. | Elegir otro archivo. |
| ««…» pesa más de 20 GB, el tope de un video.» (o «50 MB, el tope de una imagen») | El archivo es más grande que el tope de su clase. | Elegir uno más liviano. |
| «La cámara se está llenando.» / «La cámara está llena: saca lo que ya no uses para guardar más.» | Lo guardado pasa del 85 % de la cuota, o la llenó. | Sacar lo que no se use: «La cámara de frío» → «Sacar de la cámara». |
| «Graba un video o elige uno guardado: es el plato principal.» | La comanda no tiene ningún video: una foto sola no se puede mandar. | Grabar un video o tocar uno de la cámara de frío. |
| «Espera a que termine de guardarse lo que sube.» | Algo todavía está subiendo. | Esperar. |
| «Acorta tu instrucción al chef.» | La instrucción pasa los 1000 caracteres. | Acortarla. |
| «Elige qué quieres que salga.» | Están desmarcados «Clips verticales» y «Carruseles». | Marcar al menos uno. |
| «Ponle nombre a tu marca: es el que el chef usa en los videos.» | En «Tu marca», «El nombre» quedó vacío. | «Cambiar» en «Tu marca» y escribirlo. |
| «Ese material va en una comanda en marcha: lo puedes sacar cuando termine.» | Se intentó sacar algo que una comanda en marcha usa (por ejemplo, desde el panel entre medio). | Esperar a que la comanda termine. |
| «Ese material ya no está: actualiza La Cocina.» | Se sacó (por ejemplo, desde el panel) antes de cambiarlo o sacarlo acá. | Arrastrar hacia abajo para actualizar. |
| «No se pudo sacar: el almacén no respondió. Vuelve a intentarlo en un rato.» | El almacén falló: no se borró nada. | Intentarlo de nuevo en un rato. |
| «Ponle un nombre: es como lo vas a reconocer.» / «El nombre cabe en 200 caracteres.» | En «Cambiar», el nombre quedó vacío o es demasiado largo. | Escribirlo, o acortarlo. |
| «Esa comanda ya está en el horno o terminó: no se puede cancelar.» | El chef la metió al horno entre medio. | Nada: la tarjeta se actualiza y ya no ofrece cancelar. |
| «No se pudo: revisa la señal y vuelve a intentarlo.» | Sin conexión al cambiar, sacar o cancelar. | Volver a intentarlo con señal. |
| Con un servidor que todavía no se actualizó: «Escribe tu nombre en Tu Cuenta, en el panel web: es con el que el chef firma los videos.» (o, al mandar, «Ponle nombre a tu marca: es el que el chef usa en los videos. Escribe tu nombre en Tu Cuenta, en el panel web, y vuelve a mandarla.») | La cuenta no tiene marca guardada ni nombre. | Escribir el nombre en [Tu Cuenta](tu-cuenta.md) en el panel web, y volver a tocar «Mandar al chef». |
| «Comanda colgada» / «El chef la toma en su turno. …» | La comanda quedó pedida. | «Entendido». Se ve en «Tus comandas». |
| «No se pudo mandar: revisa la señal y vuelve a tocar «Mandar al chef». No se va a pedir dos veces.» | Sin conexión al mandar, o el servidor no contestó. | Volver a tocar «Mandar al chef» con señal: si la primera sí llegó, no se pide dos veces. |
| «El plato principal ya no está en la cámara, o no es un video: elige otro.» o «Uno de los materiales ya no está en la cámara: actualiza La Cocina y vuelve a elegir.» | Algo de lo elegido se sacó de la cámara (por ejemplo, desde el panel). | Arrastrar hacia abajo para actualizar y volver a elegir. |
| «Comanda colgada», «El chef mira la res», «El desposte», «El chef te pregunta», «Al fuego», «Sirviendo: …», «Lista en el mesón: N cortes», «Servida», «No se puede cocinar», «No se pudo terminar», «Cancelada» (en «Tus comandas») | El estado de cada comanda, el mismo del panel. | Lo lista se programa desde el mesón, en el panel web ([La Cocina](la-cocina.md)). |

## Si el humano dice…

- «Me pide una contraseña» → es una versión vieja de la app: la nueva llega sola al abrirla dos veces con señal. La contraseña ya no sirve; si no se actualiza, hay que pedirle el instalador nuevo a quien administra el sitio.
- «No me llega el código» → revisar el spam y que el correo esté bien escrito. Si sigue sin llegar, ese correo puede no estar invitado: lo invita quien administra el sitio, en [Los Maestros](los-maestros.md).
- «Me dice que espere 24 horas» → se equivocó diez veces en un día con el código; ver [Entrar al panel](ingresar.md).
- «¿Dónde quedó el Resumen?», «el Calendario», «Contenido» o «Cuentas» → desde el 2026-10-16 la app tiene las pestañas del panel. Lo programado y lo que salió está en «La Parrilla»; los números, en «Los Números»; la lista de publicaciones, en «Los Números» → «Ver todas las publicaciones →»; los seguidores de cada red, en «Los Números» → «⋯ Más: tus cuentas».
- «Me pide desbloquear cada vez» → es el bloqueo del propio teléfono; se usa el PIN, patrón, huella o cara del teléfono.
- «Quiero cerrar sesión» → el botón de arriba a la derecha (el cuchillo y el trinche) → «Cerrar sesión», y confirmar.
- «El botón de Ajustes (o "el engranaje") tiene un punto» → una cuenta se está enfriando (ámbar) o se apagó (rojo). En «Ajustes» se ve cuál; se reconecta en el panel web, con «Abrir Los Fierros en el panel». En la app, ese botón no avisa de las respuestas del libro de sugerencias: esas se ven en el rótulo del libro, al final de «Ajustes».
- «Me llegó un correo de que me respondieron» → al final de «Ajustes», en el libro de sugerencias, «Lo que nos escribiste»: la que dice «Respuesta nueva».
- «¿Qué versión tengo?» → «Ajustes», al pie.
- «No me llegan los avisos» o «quiero notificaciones» → «Ajustes» → «Los avisos»: si dice «Apagados en este teléfono», tocar «Encender los avisos» y permitir las notificaciones; si dice que el teléfono no deja, «Abrir los ajustes del teléfono». Si dice que llegan con la versión nueva, hay que instalar la app desde la tienda. Los comentarios llegan como resumen, uno por hora como mucho.
- «Me llegan demasiados avisos» o «quiero apagarlos» → «Ajustes» → «Los avisos» → «Apagar los avisos». Los correos siguen llegando.
- «El video llegó a TikTok sin el texto» → es así con lo que va a la bandeja de TikTok. En «La Parrilla», la tarjeta del post tiene «Copiar el texto» (o «Pasar el texto…»); ver «Para copiar el texto de lo que llegó a TikTok».
- «Toco "Pasar el texto…" y no aparece "Copiar"» → esa versión de la app no trae el portapapeles y la lista de compartir de ese teléfono no ofrece copiar. Abrir la publicación y mantener apretado el texto; una versión más nueva de la app, instalada desde la tienda, copia directo.
- «Perdí el teléfono» → quien administra el sitio puede revocar el acceso de todos los teléfonos a la vez; las conexiones con las redes no se tocan.
- «No me aparece TikTok para publicar» → desde el teléfono no se publica en TikTok; se hace en el panel web, en [La Parrilla](la-parrilla.md).
- «No aparece mi cuenta» o «dice reconéctala» → las cuentas se conectan y reconectan en el panel web, en [Los Fierros](los-fierros.md). La app no conecta nada.
- «Los botones Programar y Publicar ahora están grises» → falta texto o un archivo, falta marcar una cuenta, un archivo todavía está subiendo («Subiendo…») o falló («Reintentar» en la miniatura), o el borrador tiene el aviso amarillo de TikTok o palabra clave.
- «Perdí lo que estaba escribiendo» → se guarda solo: está en «La Parrilla» → «▸ Borradores (N)». Si no está, no tenía texto ni archivos subidos, o el guardado falló («No se pudo guardar el borrador.»).
- «Toqué Programar y dice que primero tiene que guardarse el borrador» → no hubo señal para guardarlo, y sin borrador la app no programa, para no publicar dos veces. Con señal, volver a tocar «Programar»: guarda el borrador y lo programa.
- «Me sale Algo se rompió» → «Reintentar». Si se repite, cerrar la app y abrirla de nuevo; si sigue, avisar a quien administra el sitio.
- «Empecé en el computador y quiero terminar en el teléfono» (o al revés) → es el mismo borrador: en el teléfono, «La Parrilla» → «▸ Borradores (N)»; en el panel web, «Borradores (N)» en [La Parrilla](la-parrilla.md).
- «Me dice que el borrador va también a TikTok» o «que tiene la palabra clave» → eso no se programa desde el teléfono; se programa en el panel web, en [La Parrilla](la-parrilla.md). Se puede seguir editando el texto en el teléfono sin perderlo.
- «Toqué la cruz de un día y desapareció lo que estaba escribiendo» → la cruz empieza otra publicación; lo anterior quedó en «▸ Borradores (N)».
- «No me sale el botón de trial reel» → hace falta una cuenta de Instagram marcada y exactamente un video, sin fotos.
- «Programé algo mal» (desde el teléfono o el panel) → en «La Parrilla», tocar la tarjeta del post: «Editar publicación» corrige el texto, la hora y las cuentas, o «Borrar publicación». Los archivos se cambian en el panel web, en [La Parrilla](la-parrilla.md).
- «Toqué un post y dice que ya salió en alguna cuenta» → desde el teléfono solo se edita lo que no ha salido en ninguna; se corrige en el panel web, en [La Parrilla](la-parrilla.md), y lo publicado, en la red.
- «No puedo quitar la última cuenta» → para que no salga en ninguna, «Borrar publicación».
- «Quiero cambiar el video (o la portada, o la palabra clave) de algo programado» → no se puede desde el teléfono; en el panel web, en [La Parrilla](la-parrilla.md). Al guardar desde el teléfono eso queda como estaba.
- «El borrador apareció hoy en La Parrilla y no le puse fecha» → no debería: solo guarda la fecha si se eligió con «Cuándo: …», o si se llegó desde la cruz de un día.
- «No veo el post que acabo de programar» → abre «La Parrilla» (la app salta sola ahí al terminar); si hay un filtro puesto (un botón de red con borde naranjo), toca «Todas». Si no aparece, arrastra la pantalla hacia abajo para actualizar.
- «Quiero ver solo Facebook» (o solo una red, o una cuenta) → el filtro de La Parrilla, debajo de los borradores: el botón de esa red y, para una cuenta, el renglón que aparece debajo.
- «¿Qué es el punto de color al lado de cada cuenta?» → la red: Instagram rosado, TikTok gris, YouTube rojo, Facebook azul. El estado lo dicen el signo y el color del texto.
- «Lo de la mañana se ve apagado, en un renglón» → ya salió en todas sus redes: se hunde para que lo que viene quede a la vista. Encima de la línea «ahora» va lo que ya tuvo su hora. Si es para más de treinta días adelante, la app no lo muestra.
- «Un post dice Falló» → está arriba, en «Se quemó», con el motivo y el botón «Reprogramar». Si falló por la conexión o por el archivo, primero se arregla eso en el panel web.
- «Los números no cambian» → mirar «Actualizado hace…» arriba y arrastrar hacia abajo para actualizar.
- «Quiero ver los comentarios» → no están en la app; se ven en el panel web, en [La Mesa](la-mesa.md).
- «Quiero cambiar mi página de links desde el teléfono» → no se puede en la app; se hace en el panel web, en [La Vitrina](la-vitrina.md), que también funciona en el navegador del teléfono.
- «Quiero grabar un video y mandárselo al chef» → la pestaña «La Cocina» (el gorro de chef) → «Tu comanda» → marcar la casilla de los derechos → «Grabar video» → escribir la instrucción → «Mandar al chef».
- «No me aparece "Grabar video"» → es la app 1.1.0, que no trae el permiso de la cámara: se elige de la galería («Elegir de la galería») lo grabado con la cámara del teléfono. Para grabar desde la app hay que actualizarla desde la tienda cuando salga la nueva.
- «Quiero pedir carruseles» / «cambiar cuántos clips» / «decir para cuándo» → en «Tu comanda», «Qué quieres que salga», antes de «Mandar al chef».
- «¿Dónde está la bodega?» / «quiero ver lo que subí» → «La Cocina» → la burbuja «La cámara de frío».
- «Quiero borrar un video que subí» → «La cámara de frío» → «Sacar de la cámara» en su tarjeta. Si está apagado, lo usa una comanda en marcha.
- «No tengo la pestaña La Cocina» → es de la versión 1.2.0 de la app; la 1.1.0 no la tiene. Se actualiza desde la tienda (o con el instalador nuevo que entrega quien administra el sitio). Mirar la versión en «Ajustes», al pie.
- «Grabar video está gris» → falta marcar «Tengo los derechos de lo que guardo y el permiso de quienes aparecen.».
- «El video que grabé no está en mi galería» → lo grabado desde la app no se guarda en la galería: queda en la cámara de frío de La Cocina, y desde el panel web se puede ver y sacar ([La cámara de frío](la-camara-de-frio.md)).
- «¿Dónde están los clips que hizo el chef?» → en el mesón, en el panel web ([La Cocina](la-cocina.md)); desde ahí se programan. La app solo muestra el estado de cada comanda.
- «El chef me preguntó algo» o «me llegó un correo de que el chef pregunta» → en «La Cocina», «Tus comandas»: la tarjeta con el borde naranjo dice «El chef te pregunta»; tocar una opción, o escribir y «Responder». También se contesta en el panel web. Si no contesta, al pasar el plazo el chef sigue con la opción que dice la tarjeta.
- «Quiero cancelar una comanda» → «Tus comandas» → «Cancelar la comanda», mientras no esté en el horno. «Cambiar lo que pedí» no se puede, ni en el panel: se cancela y se pide otra.
- «No me deja mandar una foto sola al chef» → el chef cocina a partir de un video, el plato principal; las fotos lo acompañan.
- «Se me cerró la app mientras subía» → al abrir «La Cocina» sigue sola donde quedó.
- «No encuentro la app» → en el teléfono se llama «Tu Parrilla» (o «Vicente · Números», si es el APK de prueba de antes). Si no está instalada, hay que pedirle el instalador a quien administra el sitio. En iPhone no existe.

## Lo que esta pantalla no hace

Comparada con el panel web, la app no:

- deja oír el reel con la canción de «Música de Instagram» puesta (Instagram no lo permite antes de publicar), ni cambia la canción de algo ya programado;

- conecta, desconecta ni reconecta redes ([Los Fierros](los-fierros.md));
- publica en TikTok;
- cambia los archivos, la portada, la palabra clave ni las opciones de lo programado, le suma cuentas, ni edita o borra lo que ya salió en alguna cuenta ([La Parrilla](la-parrilla.md)): corrige el texto, la hora y las cuentas, y borra, solo lo que no ha salido;
- programa un borrador que va también a TikTok o tiene una palabra clave (se edita, pero se programa en el panel web);
- pone portada a un video, atributos a un post ni reglas de respuesta a comentarios con palabra clave;
- carga posts por lote;
- muestra ni responde comentarios ([La Mesa](la-mesa.md));
- muestra la pieza de una publicación con sus versiones, «Comparar por atributo», el «⋯ Más» de «En tu página» (orígenes, links, países, equipos) ni el filtro de página o de bots ([Los Números](los-numeros.md));
- edita la página pública ([La Vitrina](la-vitrina.md));
- cambia la zona horaria ([Tu Cuenta](tu-cuenta.md)) ni genera llaves ([La Cocina](la-cocina.md));
- en La Cocina: muestra, programa ni descarta lo del mesón (eso es del panel, [La Cocina](la-cocina.md)), elige el color de acento de la marca ni dibuja la estación de cada comanda;
- guarda en la galería del teléfono lo que graba;
- invita usuarios ([Los Maestros](los-maestros.md)) ni responde sugerencias ([Las Sugerencias](las-sugerencias.md));
- muestra los avisos en la app: llegan como notificaciones del teléfono, y se encienden o apagan en Ajustes;
- existe para iPhone.

## Para quien mantiene esta página

Lo que describe sale de estos archivos:

- `mobile/app.json` (el nombre del ícono, la versión y los textos de los permisos de la cámara y el micrófono)
- `mobile/src/app/(tabs)/cocina.tsx` y `mobile/src/components/cocina.tsx` (La Cocina)
- `mobile/src/lib/cocina.ts`, `mobile/src/lib/subir-por-partes.ts` y `mobile/src/lib/archivo-local.ts` (el riel y los roles, lo que falta para mandar, «Confirmar», los filtros, el nombre de lo grabado, la subida por partes y la copia de lo grabado)
- `mobile/src/lib/grabar.ts` (si el teléfono muestra «Grabar video» y «Sacar foto») y `mobile/src/components/selector-fecha.tsx` (la hoja de «Para cuándo»)
- `src/lib/cocina/del-dueno.ts`, `src/app/api/mobile/cocina/materiales/[id]/route.ts` y `src/app/api/mobile/cocina/comandas/[id]/cancelar/route.ts` (cambiar, sacar y cancelar, con las frases del panel)
- `src/lib/cocina/latido.ts` (la frase de cómo atiende la cocina), `src/lib/cocina/pregunta.ts` (el plazo en palabras y las frases al responder), `src/app/api/mobile/cocina/preguntas/[id]/respuesta/route.ts` (contestarle al chef)
- `src/lib/cocina/telefono.ts` (la comanda que pide el teléfono y cómo se cuenta cada una), `src/lib/cocina/subidas.ts` y `src/lib/cocina/bodega.ts` (las frases de la subida y de la cuota), `src/lib/cocina/pedido.ts` y `src/lib/cocina/pedir.ts` (las de la comanda), `src/lib/cocina/nombres.ts` y `src/lib/cocina/tarjeta.ts` (los estados)
- `mobile/src/app/_layout.tsx` (qué pantallas se ven con sesión y sin ella, la pantalla «Algo se rompió» y las cabeceras de «Publicación», «Editar publicación», «Tus publicaciones» y «Ajustes»)
- `mobile/src/app/programado/[id].tsx` y `mobile/src/lib/editar.ts` (Editar publicación)
- `src/lib/editar-movil.ts` (lo que muestra Editar publicación: la nota de lo que queda como está, por qué no se edita y el máximo de cada red) y `src/lib/social/publish/editar.ts` (lo que se guarda y sus frases, las mismas del editor del panel)
- `mobile/src/components/sesion.tsx` (el desbloqueo, entrar y salir)
- `mobile/src/app/login.tsx`
- `mobile/src/app/(tabs)/_layout.tsx` (la barra de pestañas)
- `mobile/src/app/(tabs)/index.tsx` (La Parrilla)
- `mobile/src/app/(tabs)/publicar.tsx`
- `mobile/src/app/(tabs)/numeros.tsx` (Los Números)
- `mobile/src/app/publicaciones.tsx` (Tus publicaciones)
- `mobile/src/app/post/[id].tsx`
- `mobile/src/components/ui.tsx`
- `mobile/src/components/corte-programado.tsx`
- `mobile/src/components/copiar-texto.tsx`, `mobile/src/lib/portapapeles.ts` y `mobile/src/lib/bandeja.ts` («Copiar el texto» o «Pasar el texto…» de lo que espera en la bandeja de TikTok)
- `mobile/src/app/ajustes.tsx` y `mobile/src/components/boton-ajustes.tsx` (Ajustes y su botón en la cabecera)
- `mobile/src/components/avisos.tsx` y `mobile/src/lib/avisos.ts` (los avisos al teléfono: la pregunta de la primera vez, «Los avisos» de Ajustes, sus frases y adónde lleva tocar uno), y `src/lib/push/avisos.ts` (lo que dice cada aviso)
- `mobile/src/components/libro-de-sugerencias.tsx` y `mobile/src/lib/sugerencias.ts` (el libro de sugerencias, al final de Ajustes, con «Lo que nos escribiste»), y `src/app/api/mobile/sugerencias/route.ts` y `src/app/api/mobile/sugerencias/[id]/leida/route.ts` (lo que lee y marca leído)
- `src/app/api/mobile/fierros/route.ts` (lo que muestran)
- `mobile/src/components/pieza.tsx`, `mobile/src/components/pieza-sushi.tsx` y `mobile/src/components/lienzo.tsx` (el corte dibujado, de noche y de día)
- `mobile/src/components/tema.tsx`, `mobile/src/components/colores.ts` y `mobile/src/lib/tema.ts` (el modo de la cuenta y los colores de cada modo; las palabras de día: «Se echó a perder», La Barra, Los Cuchillos, el aviso de Ajustes y el pie de ayer)
- `src/app/api/mobile/tema/route.ts` (leer y cambiar el modo de la cuenta)
- `mobile/src/components/tus-cuentas.tsx`
- `mobile/src/components/selector-fecha.tsx` y `mobile/src/lib/calendario.ts` (elegir día y hora: la hoja «Cuándo sale», con «Cancelar» y «Listo»)
- `mobile/src/components/ventana.tsx` (las preguntas y los avisos)
- `mobile/src/components/parrilla.tsx` (la parrilla de cada día, su mezcla de redes, su renglón de cuánto salió y la línea de «ahora»)
- `mobile/src/components/filtro-de-redes.tsx` y `mobile/src/lib/filtro.ts` (el filtro por red)
- `mobile/src/lib/useAhora.ts` (la hora de la línea de «ahora», que se corre sola)
- `mobile/src/components/iconos.tsx`
- `mobile/src/lib/agenda.ts` (qué días se ven, «Se quemó», los borradores de cada día, el pie de ayer, lo que ya salió y dónde va «ahora»)
- `mobile/src/lib/borradores.ts` (las frases del borrador, qué se guarda, la línea de cada borrador en la lista)
- `mobile/src/lib/publicar.ts`
- `mobile/src/components/musica-instagram.tsx`, `mobile/src/lib/musica.ts` y `mobile/src/lib/reproductor.ts` («Música de Instagram»: el bloque, sus frases y la muestra, que con la 1.1.0 se abre afuera)
- `src/app/api/mobile/musica/route.ts`, `src/app/api/mobile/musica/[id]/route.ts`, `src/app/api/mobile/musica/sugerencia/route.ts` y `src/lib/musica-instagram.ts` (lo que suena, la búsqueda, la muestra de una canción y «Sugiéreme una»)
- `mobile/src/lib/subir.ts`
- `mobile/src/lib/session.ts`
- `mobile/src/lib/ingreso.ts`
- `mobile/src/lib/api.ts`
- `mobile/src/lib/cache.ts`
- `mobile/src/lib/useScreenData.ts`
- `mobile/src/lib/format.ts`
- `mobile/src/lib/tipos.ts`
- `mobile/src/lib/parrilla.ts`
- `src/app/api/mobile/` (las rutas que la app llama, con sus frases de error)
- `src/lib/mobile-api.ts`
- `src/lib/borrador.ts` (lo que el teléfono guarda de un borrador y el aviso de TikTok o palabra clave)
- `src/lib/borradores-movil.ts`
- `src/lib/social/publish/validate.ts`
- `src/lib/social/publish/opciones.ts`
- `src/lib/social/publish/youtube.ts`
- `src/lib/social/publish/publisher.ts`
- `src/lib/social/cuentas.ts`
- `src/lib/storage.ts`

Si cambias lo que se ve en alguno de ellos, actualiza esta página en el mismo commit.
