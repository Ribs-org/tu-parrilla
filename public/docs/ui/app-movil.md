# La app del teléfono

Una app para Android que muestra de un vistazo lo programado y cómo van las redes de quien entra, y le deja publicar desde la galería del teléfono. Tiene las mismas tres pestañas que el panel web —La Parrilla, Publicar en el medio y Los Números—, pero hace mucho menos: mira lo programado y los números, y programa o publica fotos y videos en Instagram, Facebook y YouTube. Todo lo demás —conectar redes, corregir, reprogramar o borrar lo programado, TikTok, comentarios, la página pública— se hace en el panel web.

## Cómo se llega

- Es solo para Android; no hay versión para iPhone. No se encuentra buscándola en una tienda: se instala con el archivo `.apk` que entrega quien administra el sitio, o por la prueba interna de Google Play si a la persona la invitaron. En el teléfono, el ícono se llama «Vicente · Números».
- Se entra igual que al panel web ([Entrar al panel](ingresar.md)): con el correo y un código de seis dígitos que llega a ese correo. Entra solo quien está invitado, y cada persona ve sus propias cuentas. No hay contraseña.
- La primera vez pide el correo y el código. Después la sesión queda abierta: no los vuelve a pedir.
- Si el teléfono tiene PIN, patrón, huella o reconocimiento de cara, cada vez que se abre la app pide desbloquear con el aviso «Desbloquea para entrar a Tu Parrilla». Si se cancela, la app muestra la pantalla de entrada.
- Si la sesión deja de valer (por ejemplo, porque quien administra el sitio revocó el acceso de los teléfonos), la app vuelve sola a la pantalla de entrada, sin ningún mensaje.
- Al entrar se abre La Parrilla.

## Qué se ve

Los títulos y rótulos se ven en mayúsculas por diseño; aquí van escritos como están en el código.

### La pantalla de entrada

Tiene dos pasos, uno detrás del otro en la misma pantalla:

- **El correo.** El título «Tu Parrilla», la frase «Entra con tu correo: te mandamos un código.», un campo con el texto de ayuda «tu@correo.cl» y el botón «Mandarme un código» (mientras lo pide, «Enviando…»; apagado mientras el campo esté vacío).
- **El código.** El título «Tu código», la frase «Si tu correo está invitado, te llegará un código en un minuto. Vale diez minutos.», un campo con el texto de ayuda «000000» que solo acepta números, el botón «Entrar» (mientras comprueba, «Entrando…»; apagado hasta que haya seis dígitos) y, debajo, «Usar otro correo», que vuelve al paso del correo.

Si algo falla, el mensaje sale en rojo debajo del campo.

### La barra de pestañas

Abajo, tres pestañas en este orden: «La Parrilla», «Publicar» y «Los Números». «Publicar» va al medio y se ve como un círculo naranjo con una cruz. La pestaña activa se ve en naranjo y su nombre sale también como título arriba de la pantalla.

En «La Parrilla», «Los Números» y «Tus publicaciones», la app muestra al instante lo último que descargó y lo actualiza por detrás; por eso funciona sin señal, con datos viejos. Arriba dice cuándo se actualizó: «Actualizado recién», «Actualizado hace 5 min», «Actualizado hace 2 h» o «Actualizado hace 1 d». Para actualizar a mano, se arrastra la pantalla hacia abajo.

### La Parrilla

Lo programado, de hoy en adelante, y lo que se quemó. De arriba abajo:

- La línea «lo que viene y cómo salió lo que ya se fue».
- **«Se quemó»**, en rojo, solo si algo falló en los últimos siete días. Una tarjeta por cada red donde un corte falló (un corte que falló en dos redes da dos tarjetas), de la más reciente a la más vieja: arriba la hora —solo «19:00» si era de hoy, o «14 oct · 19:00»— y la cuenta, «Instagram · nombre_de_cuenta»; el texto del post (o «(sin texto)»); el motivo en rojo, cuando lo hay, y «Se reprograma en el panel web, en La Parrilla.». Las tarjetas no se pueden tocar.
- **Los días**, uno debajo del otro: siempre hoy y los seis siguientes, aunque estén vacíos, y después solo los que tienen algo, hasta treinta días adelante. Cada día lleva su rótulo —«Hoy · jue 15», «Mañana · vie 16», «sáb 17»—, a la derecha cuánto fuego tiene —«Apagada» (nada), «Prendida» (uno o dos posts) o «Parrilla llena» (tres o más)— y un botón redondo con una cruz, que abre «Publicar» con ese día puesto (un lector de pantalla lo lee «Programar el jue 15»). Un día vacío dice «No hay nada puesto. Préndela.», en naranjo, y hace lo mismo que la cruz.
- Cada post es una tarjeta color carne, de la más clara (programada) a la más oscura (falló): la hora (con «  ·  SALIENDO» al lado mientras se publica), la miniatura si hay, el texto (o «(sin texto)»), una línea por cuenta «Red · nombre_de_cuenta» y, si esa cuenta falló, « — » seguido del error. Al final, el estado en palabras: «Programada», «Saliendo ahora», «Publicada» o «Falló». Las tarjetas no se pueden tocar ni editar.
- Al pie: «Ayer no salió nada.», «Ayer: 1 corte servido» o «Ayer: N cortes servidos». Cuenta cortes y no redes: uno que salió en tres redes es un corte.

Las horas y los días están en la zona horaria de [Tu Cuenta](tu-cuenta.md).

### Publicar

De arriba abajo:

- Un cuadro de texto con la ayuda «Texto del post…» (hasta 2200 caracteres). Debajo, a la izquierda, «En YouTube el primer renglón es el título» y, a la derecha, el contador, por ejemplo «120 / 2200».
- Los archivos elegidos, como miniaturas (un video se ve como un cuadro que dice «Video»), cada uno con una «✕» para quitarlo, y el botón «+ Fotos o video» mientras queden menos de diez.
- Las cuentas a las que se puede publicar, como botones «Red · nombre_de_cuenta». Solo salen cuentas de Instagram, Facebook y YouTube conectadas en el panel; TikTok no aparece nunca. Con una sola cuenta conectada, viene marcada; con dos o más, ninguna. Una cuenta que se desconectó sale como «Instagram · nombre_de_cuenta · reconéctala», con «reconéctala» en rojo, y no se puede marcar. Mientras no haya ninguna marcada: «Elige al menos una cuenta.»
- Solo si hay una cuenta de Instagram marcada y exactamente un video (sin fotos): un botón «Trial reel · nombre_de_cuenta» por cada cuenta de Instagram marcada, y la explicación «Un trial reel solo lo ven quienes no te siguen. Tú decides desde Instagram cuándo compartirlo con todos.»
- El botón «Cuándo: 14/10 a las 19:00» (con el día y la hora elegidos). De partida trae la próxima hora en punto; si se llegó desde la cruz de un día de La Parrilla, trae ese día a esa misma hora en punto.
- Los mensajes, en rojo si son problemas y en gris si son el avance del envío.
- Mientras se sube un archivo, una barra de avance.
- Abajo, «Programar» y «Publicar ahora». Los dos están apagados hasta que haya texto o algún archivo, y al menos una cuenta marcada. Durante el envío, en su lugar sale «Cancelar» (solo se puede tocar mientras sube un archivo); si el envío se cayó, sale «Reintentar».

Mientras se cargan las cuentas dice «Cargando cuentas…». Si no se pudieron cargar: «No se pudieron cargar las cuentas.» con «Reintentar». Si no hay ninguna que sirva: «No hay ninguna cuenta lista para publicar desde el teléfono. Conéctala en el panel web, en Los Fierros.»

### Los Números

Las dos mitades del tablero del panel ([Los Números](los-numeros.md)), más cortas. De arriba abajo:

- La línea «cómo te fue en las redes y en tu página».
- Cinco botones de período, que se deslizan de lado: «Hoy», «7 días», «30 días» (el que viene marcado), «90 días» y «Todo».
- Solo con más de una cuenta: botones de cuenta, también deslizables: «Todas las cuentas» (el que viene marcado) y uno por cuenta, «Red · nombre_de_cuenta». La cuenta filtra «En las redes»; «En tu página» es siempre de todas.
- **Tarjeta «En las redes»**, con la bajada «Lo que hicieron tus publicaciones donde las publicaste. Lo cuentan las redes.» Dos cifras: «Views ganadas» y «Seguidores ganados» (con «+» delante si es más que cero), las dos con «En el período · sin YouTube» debajo; una raya «—» es que no se sabe, no que sea cero. Después **«Lo que más creció»**: hasta cinco publicaciones, de más a menos views ganadas, cada una con una barra detrás que la compara con la primera, el texto (o su etiqueta), «Red · nombre_de_cuenta» y las views ganadas. Tocar una abre su detalle. Al final, el botón «Ver todas las publicaciones →».
- **Tarjeta «En tu página»**, con la bajada «Quién entró a tu página de links y qué apretó. Lo cuenta Tu Parrilla, sin cookies.» Dos cifras: «Visitas» y «Clicks en tus links», cada una con la comparación con el período anterior debajo: «↑ +12% vs. período anterior» en verde, «↓ -8% …» en rojo, «→ 0% …» si casi no cambió, o «—» si no hay con qué comparar (el período anterior tuvo cero, o es «Todo»). Después **«Qué publicación te trajo gente»**: hasta cinco etiquetas, de más a menos visitas, con su barra, el texto del post y su cuenta (o «?s=etiqueta» si no es de una publicación) y las visitas. Estas filas no se pueden tocar.
- El botón «⋯ Más: tus cuentas», que abre debajo **las tarjetas de cada red** del período elegido: el nombre, el número de seguidores y debajo «seguidores · +12 en el período», «seguidores · sin cambio» o «seguidores · — en el período»; «Visitas al perfil: N · Alcance: N», a veces con el día de la lectura entre paréntesis; y, con más de un día de datos, el gráfico de barras «Visitas al perfil por día». Abierto, el botón dice «Menos». Mientras carga: «Cargando tus cuentas…».

### Tus publicaciones

Se abre con «Ver todas las publicaciones →» en Los Números. Arriba, la barra con el título «Tus publicaciones» y la flecha para volver.

- Los cinco botones de período, deslizables: «Hoy», «7 días», «30 días» (el que viene marcado), «90 días» y «Todo».
- Botones de red: «Todas», «Instagram», «TikTok», «YouTube» y «Facebook». Se pueden marcar varios; «Todas» quita el filtro. Threads y X no tienen botón: publican, pero Tu Parrilla no trae sus publicaciones.
- La lista de lo publicado en el período, ordenada de más a menos views ganadas. Cada fila: la miniatura, el texto, «Red · fecha», la marca «Se pasó» cuando el post sacó al menos el doble de views ganadas que la mediana (el valor del medio) de los posts que se están mirando, y abajo «N views» y «P% arrastre».
- Si no hay nada: «No publicaste nada en este período.»
- Tocar una fila abre su detalle.

### El detalle de una publicación

Arriba, la barra con el título «Publicación» y la flecha para volver. Después: la red y la fecha, el texto completo, y una tarjeta con «Views (acumulado)», «Views ganadas», «Likes», «Comentarios», «Compartidos», «Alcance», «Visitas al sitio», «Clicks», «CTR» y «Arrastre». Si el post tiene atributos, una tarjeta «Atributos» con cada uno. Al final, si existe, «Abrir en Instagram ↗» (o la red que corresponda), que abre el post en su red.

Si el post no está entre lo descargado: «Vuelve a la lista y ábrelo de nuevo: este post no está en lo descargado.» y el botón «Volver».

## Qué se puede hacer

### Para entrar por primera vez

1. Abre la app.
2. Escribe tu correo en «tu@correo.cl» y toca «Mandarme un código».
3. Abre el correo «… es tu código para entrar a Parrilla» y copia los seis dígitos.
4. Escríbelos en «000000» y toca «Entrar» (o la tecla de enviar del teclado). Se abre «La Parrilla».

Si el código no llega, revisa el spam y que el correo esté bien escrito; «Usar otro correo» vuelve al primer paso para pedir otro. Son a lo más tres códigos cada quince minutos.

### Para ver qué viene y qué se quemó

1. Pestaña «La Parrilla». Lo que falló está arriba, en «Se quemó», con el motivo; lo que viene, día por día debajo.
2. Para reprogramar o corregir lo quemado: en el panel web, en [La Parrilla](la-parrilla.md), botón «Reprogramar».

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
3. Toca «+ Fotos o video», da permiso para ver la galería si lo pide y elige hasta diez archivos en total (un video puede pesar hasta 500 MB). Para sacar uno, toca su «✕».
4. Toca las cuentas a las que debe salir: quedan marcadas en naranjo.
5. Toca «Cuándo: …», elige el día y después la hora (en formato de 24 horas). La hora es la del reloj del teléfono.
6. Toca «Programar».
7. Abajo se ve el avance: «Comprobando…», «Subiendo 1 de 2 · 45 %», «Guardando…» y «Listo». Un segundo después el formulario se vacía y la app salta a «La Parrilla», donde ya aparece el post si cae dentro de los próximos treinta días.

Instagram y YouTube necesitan al menos un archivo; Facebook acepta solo texto. YouTube necesita un video: con solo fotos, el post se programa igual, pero el destino de YouTube falla al publicarse con «YouTube solo recibe video.», que se ve en «La Parrilla».

### Para publicar de inmediato

1. Arma el post como en los pasos 1 a 4 de arriba.
2. Toca «Publicar ahora».
3. Aparece la pregunta «Publicar ahora» con el texto «¿Publicar ahora en nombre_de_cuenta y otra_cuenta? Saldrá en los próximos 5 minutos.».
4. Toca «Publicar» (o «Cancelar» para no hacer nada).

### Para mandar un trial reel a Instagram

Un trial reel lo ven solo quienes no siguen la cuenta; después, desde la app de Instagram, la persona decide si lo comparte con todos.

1. En «Publicar», elige un solo video, sin fotos.
2. Marca la cuenta de Instagram.
3. Toca «Trial reel · nombre_de_cuenta» para encenderlo (queda en naranjo).
4. «Programar» o «Publicar ahora».

Si Instagram no tiene la función habilitada para esa cuenta, el destino falla al publicarse y en «La Parrilla» sale «Instagram no permite trial reels en esta cuenta.». Corregirlo se hace en el panel web, en [La Parrilla](la-parrilla.md).

### Si se corta la señal mientras se envía

1. Aparece en rojo «No se pudo subir el archivo. Revisa tu señal.» o «No se pudo conectar. Revisa tu señal.», y el botón «Reintentar».
2. Cuando vuelva la señal, toca «Reintentar». Sigue desde el archivo que falló, sin volver a subir los anteriores.

Ojo: si el corte fue durante la subida o al guardar, «Reintentar» manda el texto, las cuentas y la hora que había al primer intento, aunque se hayan cambiado después. Para mandar algo distinto, reinicia el envío quitando un archivo y volviendo a agregarlo (o, si el post no tiene archivos, agregando uno y quitándolo) y toca de nuevo «Programar».

### Para cancelar una subida

1. Mientras sube un archivo, toca «Cancelar». El formulario vuelve a quedar listo, con todo lo que tenía.

### Para corregir, reprogramar o borrar algo programado desde el teléfono

No se puede desde la app. Se hace en el panel web, en [La Parrilla](la-parrilla.md).

## Mensajes que puede ver

| Lo que dice la pantalla | Qué significa | Qué hacer |
|---|---|---|
| «Desbloquea para entrar a Tu Parrilla» | La app pide el bloqueo del teléfono. | Usar el PIN, patrón, huella o cara del teléfono. Si se cancela, sale la pantalla de entrada. |
| «Ese correo no se ve bien.» | Al correo le falta algo, como la @ o el dominio. | Revisarlo y volver a tocar «Mandarme un código». |
| «Si tu correo está invitado, te llegará un código en un minuto. Vale diez minutos.» | Es lo mismo que dice el panel web, esté o no invitado el correo: no revela quién lo está. | Esperar el correo. Si no llega en unos minutos, revisar el spam y que el correo esté bien escrito, o pedirle a quien administra el sitio que lo invite. |
| «Ese código no es válido o ya venció.» | El código está mal escrito, venció (dura diez minutos), ya se usó, se pidió otro después (vale solo el último) o ese correo no está invitado. | Revisarlo, o «Usar otro correo» y pedir uno nuevo. |
| «Demasiados intentos. Pide un código nuevo.» | Cinco códigos equivocados seguidos agotan ese código; también sale con muchos intentos seguidos desde la misma conexión. | «Usar otro correo» y pedir un código nuevo. |
| «Demasiados intentos en las últimas 24 horas. Prueba de nuevo más tarde.» | Diez códigos equivocados en un día, sumando la web y el teléfono. | Esperar; hasta un día después del primer error. Ver [Entrar al panel](ingresar.md). |
| «El servidor no respondió bien. Prueba de nuevo en un rato.» | Falla del servidor, no de lo que se escribió. | Esperar y volver a intentar; si se repite, avisar a quien administra el sitio. |
| «No se pudo conectar. Revisa tu señal.» | Sin conexión al pedir el código, al entrar, al comprobar el post o al guardarlo. | Revisar la señal; en «Publicar», tocar «Reintentar». |
| «No se pudo actualizar.» | Falló la descarga de datos nuevos; lo que se ve puede ser viejo. | Arrastrar hacia abajo o tocar «Reintentar» cuando haya señal. |
| «No se pudo cargar.» | No hay datos guardados y no se pudieron descargar. | «Reintentar». |
| «Se reprograma en el panel web, en La Parrilla.» (en «Se quemó») | Ese destino falló y la app no lo reprograma. | En el panel web, [La Parrilla](la-parrilla.md), botón «Reprogramar». |
| «No hay nada puesto. Préndela.» | Ese día no tiene nada programado. | Tocarlo (o la cruz) para programar algo ese día. |
| «Ayer no salió nada.» / «Ayer: N cortes servidos» | Cuántos posts de ayer salieron en al menos una red. | Nada. |
| «Ninguna publicación ganó views en este período. Las métricas llegan con la sincronización diaria, así que lo publicado hoy aparece mañana.» (en «Lo que más creció») | Ninguna publicación ganó views conocidas en el período. | Elegir un período más largo, o esperar la sincronización del día siguiente. |
| «Ninguna visita llegó todavía por el link de una publicación.» (en «Qué publicación te trajo gente») | En el período no llegó ninguna visita con etiqueta. | Elegir un período más largo; pegar los links con etiqueta (ver [Los Números](los-numeros.md)). |
| «—» bajo «Visitas» o «Clicks en tus links» | No hay con qué comparar: el período anterior tuvo cero, o el período es «Todo». | Nada. |
| «Cargando tus cuentas…» | Se están descargando las tarjetas de «⋯ Más: tus cuentas». | Esperar. |
| «Todavía no hay lecturas de cuenta. La primera llega con la sincronización de esta noche.» | Las cuentas aún no tienen números guardados. | Esperar al día siguiente. |
| «No publicaste nada en este período.» (en «Tus publicaciones») | No hay publicaciones sincronizadas en el período con ese filtro. | Elegir un período más largo, u otra red. |
| «Se pasó» (en «Tus publicaciones») | Ese post sacó al menos el doble de views ganadas que la mediana de la lista. | Nada; es una marca para ubicar lo que anduvo mejor. |
| «Sin permiso para ver la galería.» | El teléfono no le dio permiso a la app para ver fotos y videos. | Dar el permiso en los ajustes del teléfono y volver a tocar «+ Fotos o video». |
| «Ese tipo de archivo no se puede publicar.» | Uno de los archivos elegidos no es una imagen ni un video que se pueda publicar. | Elegir otro archivo. |
| «El archivo supera los 500 MB.» | Un archivo es demasiado grande. | Elegir uno más liviano. |
| «Elige al menos una cuenta.» | No hay ninguna cuenta marcada. | Tocar al menos una. |
| «No se pudieron cargar las cuentas.» | Falló la descarga de la lista de cuentas. | «Reintentar». |
| «No hay ninguna cuenta lista para publicar desde el teléfono. Conéctala en el panel web, en Los Fierros.» | No hay ninguna cuenta de Instagram, Facebook o YouTube. | Conectar la cuenta en el panel web, en [Los Fierros](los-fierros.md). Si solo hay TikTok, desde el teléfono no se puede publicar. |
| «… · reconéctala» | Esa cuenta perdió la conexión. | Reconectarla en el panel web, en [Los Fierros](los-fierros.md). |
| «Comprobando…», «Subiendo 1 de 2 · 45 %», «Guardando…», «Listo» | El avance del envío. | Esperar; con «Listo» el post quedó programado. |
| «No se pudo subir el archivo. Revisa tu señal.» | Se cortó la subida de un archivo. | «Reintentar» cuando haya señal. |
| «Publicar ahora» / «¿Publicar ahora en …? Saldrá en los próximos 5 minutos.» | Confirmación de publicar de inmediato. | «Publicar» o «Cancelar». |
| «Instagram, YouTube y TikTok necesitan al menos un archivo.» | Hay una cuenta de Instagram o YouTube marcada y ningún archivo. | Agregar una foto o video, o desmarcar esas cuentas. |
| «Escribe un texto o adjunta un archivo.» | El post está vacío. | Escribir texto o agregar un archivo. |
| «Máximo diez archivos por publicación.» | Hay más de diez archivos. | Quitar algunos. |
| «La hora debe estar en el futuro.» | La hora elegida ya pasó. | Tocar «Cuándo: …» y elegir una hora futura. |
| «La fecha no se entendió.» | La fecha no llegó bien al servidor. | Volver a elegirla. |
| «Un trial reel es un solo video, sin fotos.» | El trial reel quedó con más de un archivo o con fotos. | Dejar un solo video. |
| «La cuenta x no está conectada. Vuelve a conectarla en Cuentas.» (con el nombre de la cuenta en lugar de x) | La cuenta elegida perdió la conexión. «Cuentas» aquí es [Los Fierros](los-fierros.md) del panel web: la app no tiene una pestaña con ese nombre. | Reconectarla en el panel web. |
| «Una de las cuentas elegidas no es tuya.» | Una cuenta ya no pertenece a quien publica (por ejemplo, se borró). | Cerrar la app del todo y volver a abrirla: la lista de cuentas de «Publicar» se carga al abrir. |
| «Red desconocida o sin publicación: x.» | Se intentó publicar en una red que el teléfono no maneja (hoy, TikTok). | Publicar en esa red desde el panel web, en [La Parrilla](la-parrilla.md). |
| «Falta subir un archivo.» | Uno de los archivos subidos ya no está en el servidor. | Tocar de nuevo «Programar» o «Publicar ahora»: los archivos se vuelven a subir. |
| «No se pudo guardar. Intenta de nuevo.» | Falla del servidor al guardar el post. | Volver a tocar «Programar» o «Publicar ahora». |
| «Falta configurar Cloudflare R2 (R2_*).» | El sitio no tiene configurado dónde guardar archivos. | Avisar a quien administra el sitio. |
| «Un archivo no es del almacén.», «El cuerpo no se entendió.», «Las opciones de la red no se entendieron.» | Errores internos que no deberían verse. | Cerrar y abrir la app, armar el post de nuevo; si se repite, avisar a quien administra el sitio. |
| «Programada», «Saliendo ahora», «Publicada», «Falló» (en «La Parrilla») | El estado del post. «Falló» lleva al lado de la cuenta el error de la red. | Si falló, revisarlo en el panel web, en [La Parrilla](la-parrilla.md). |
| En «La Parrilla», después de la cuenta: «YouTube solo recibe video.», «Instagram no permite trial reels en esta cuenta.», «Instagram rechazó la publicación.», «La red no terminó de procesar el video.», «La cuenta no está conectada. Reconéctala y reprograma.» | Por qué falló ese destino al publicarse. | Corregir en el panel web: reconectar en [Los Fierros](los-fierros.md) si es la conexión, y corregir el post en [La Parrilla](la-parrilla.md). |
| En «La Parrilla», después de la cuenta: «No se pudo hablar con la red. Se reintentará.» | Falla pasajera de la red. | Esperar: se reintenta solo. |
| «Vuelve a la lista y ábrelo de nuevo: este post no está en lo descargado.» | El detalle no encontró el post entre lo descargado. | «Volver», actualizar la lista y tocarlo de nuevo. |

## Si el humano dice…

- «Me pide una contraseña» → es una versión vieja de la app: la nueva llega sola al abrirla dos veces con señal. La contraseña ya no sirve; si no se actualiza, hay que pedirle el instalador nuevo a quien administra el sitio.
- «No me llega el código» → revisar el spam y que el correo esté bien escrito. Si sigue sin llegar, ese correo puede no estar invitado: lo invita quien administra el sitio, en [Los Maestros](los-maestros.md).
- «Me dice que espere 24 horas» → se equivocó diez veces en un día con el código; ver [Entrar al panel](ingresar.md).
- «¿Dónde quedó el Resumen?», «el Calendario», «Contenido» o «Cuentas» → desde el 2026-10-16 la app tiene las pestañas del panel. Lo programado y lo que salió está en «La Parrilla»; los números, en «Los Números»; la lista de publicaciones, en «Los Números» → «Ver todas las publicaciones →»; los seguidores de cada red, en «Los Números» → «⋯ Más: tus cuentas».
- «Me pide desbloquear cada vez» → es el bloqueo del propio teléfono; se usa el PIN, patrón, huella o cara del teléfono.
- «Quiero cerrar sesión» → la app no tiene botón para eso.
- «Perdí el teléfono» → quien administra el sitio puede revocar el acceso de todos los teléfonos a la vez; las conexiones con las redes no se tocan.
- «No me aparece TikTok para publicar» → desde el teléfono no se publica en TikTok; se hace en el panel web, en [La Parrilla](la-parrilla.md).
- «No aparece mi cuenta» o «dice reconéctala» → las cuentas se conectan y reconectan en el panel web, en [Los Fierros](los-fierros.md). La app no conecta nada.
- «Los botones Programar y Publicar ahora están grises» → falta texto o un archivo, o falta marcar una cuenta.
- «No me sale el botón de trial reel» → hace falta una cuenta de Instagram marcada y exactamente un video, sin fotos.
- «Programé algo mal desde el teléfono» → se corrige o se borra en el panel web, en [La Parrilla](la-parrilla.md).
- «No veo el post que acabo de programar» → abre «La Parrilla» (la app salta sola ahí al terminar); si no aparece, arrastra la pantalla hacia abajo para actualizar. Si es para más de treinta días adelante, la app no lo muestra.
- «Un post dice Falló» → está arriba, en «Se quemó», con el motivo; se reprograma en el panel web, en [La Parrilla](la-parrilla.md).
- «Los números no cambian» → mirar «Actualizado hace…» arriba y arrastrar hacia abajo para actualizar.
- «Quiero ver los comentarios» → no están en la app; se ven en el panel web, en [La Mesa](la-mesa.md).
- «Quiero cambiar mi página de links desde el teléfono» → no se puede en la app; se hace en el panel web, en [La Vitrina](la-vitrina.md), que también funciona en el navegador del teléfono.
- «No encuentro la app» → en el teléfono se llama «Vicente · Números». Si no está instalada, hay que pedirle el instalador a quien administra el sitio. En iPhone no existe.

## Lo que esta pantalla no hace

Comparada con el panel web, la app no:

- conecta, desconecta ni reconecta redes ([Los Fierros](los-fierros.md));
- publica en TikTok;
- edita, mueve, reprograma ni borra lo programado ([La Parrilla](la-parrilla.md));
- guarda borradores;
- pone portada a un video, atributos a un post ni reglas de respuesta a comentarios con palabra clave;
- carga posts por lote;
- muestra ni responde comentarios ([La Mesa](la-mesa.md));
- muestra la pieza de una publicación con sus versiones, «Comparar por atributo», el «⋯ Más» de «En tu página» (orígenes, links, países, equipos) ni el filtro de página o de bots ([Los Números](los-numeros.md));
- edita la página pública ([La Vitrina](la-vitrina.md));
- cambia la zona horaria ni genera llaves ([Tu Cuenta](tu-cuenta.md));
- invita usuarios ([Los Maestros](los-maestros.md));
- cierra sesión desde la propia app;
- manda notificaciones;
- existe para iPhone.

## Para quien mantiene esta página

Lo que describe sale de estos archivos:

- `mobile/app.json` (el nombre del ícono)
- `mobile/src/app/_layout.tsx` (el desbloqueo y las cabeceras de «Publicación» y «Tus publicaciones»)
- `mobile/src/app/login.tsx`
- `mobile/src/app/(tabs)/_layout.tsx` (la barra de pestañas)
- `mobile/src/app/(tabs)/index.tsx` (La Parrilla)
- `mobile/src/app/(tabs)/publicar.tsx`
- `mobile/src/app/(tabs)/numeros.tsx` (Los Números)
- `mobile/src/app/publicaciones.tsx` (Tus publicaciones)
- `mobile/src/app/post/[id].tsx`
- `mobile/src/components/ui.tsx`
- `mobile/src/components/corte-programado.tsx`
- `mobile/src/components/tus-cuentas.tsx`
- `mobile/src/components/selector-fecha.tsx` (solo iPhone, que todavía no se distribuye: la hoja «Cuándo sale» con «Cancelar» y «Listo»)
- `mobile/src/components/parrilla.tsx`
- `mobile/src/components/iconos.tsx`
- `mobile/src/lib/agenda.ts` (qué días se ven, «Se quemó», el pie de ayer)
- `mobile/src/lib/publicar.ts`
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
- `src/lib/social/publish/validate.ts`
- `src/lib/social/publish/opciones.ts`
- `src/lib/social/publish/youtube.ts`
- `src/lib/social/publish/publisher.ts`
- `src/lib/social/cuentas.ts`
- `src/lib/storage.ts`

Si cambias lo que se ve en alguno de ellos, actualiza esta página en el mismo commit.
