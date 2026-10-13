# Los Fierros — tus redes conectadas

`/admin/accounts`, dentro del engranaje «Ajustes» de la barra del panel (no es una pestaña). La lista para elegir cuentas, que aparece sola cuando una red devuelve varias, vive en `/admin/accounts/elegir`.

Los Fierros (en llano: las cuentas conectadas) es donde se conectan a Tu Parrilla las cuentas de Instagram, TikTok, YouTube, Facebook, Threads y X / Twitter, donde se renuevan cuando su permiso vence y donde se desconectan. Cada cuenta es una tarjeta con su «fierro», una barra de color que dice si la conexión está viva. Sin una cuenta conectada aquí, el panel no puede publicar en esa red. Las seis redes sirven para publicar; los números de los posts se traen de Instagram, TikTok, YouTube y Facebook; los comentarios (en [La Mesa](la-mesa.md)) llegan de Instagram, Facebook y YouTube.

## Cómo se llega

1. En la barra de arriba del panel, abre el engranaje «Ajustes», a la derecha. En un teléfono se ve solo el ícono del engranaje, sin la palabra.
2. En el menú que se despliega, elige «Los Fierros» (debajo dice «tus redes conectadas»).

También se entra directo a `https://tu-parrilla.cl/admin/accounts`. Sin sesión abierta, primero hay que entrar (ver [Ingresar](ingresar.md)).

La lista de `/admin/accounts/elegir` no tiene enlace propio: aparece después de conectar Instagram, Facebook o YouTube cuando la red devuelve más de una cuenta.

## Qué se ve

Los títulos de la pantalla se ven en mayúsculas; aquí van como están escritos.

### Arriba

- El título «Los Fierros» y debajo «tus redes conectadas».
- Solo al volver de conectar, o de un intento fallido: una franja con una frase, por ejemplo «Instagram conectado.». Todas las posibles están en «Mensajes que puede ver». La frase viaja en la dirección de la página: si se recarga, vuelve a aparecer, y eso no significa que se haya conectado otra vez.

### Un bloque por red

En este orden: Instagram, TikTok, YouTube, Facebook, Threads, X / Twitter. Cada bloque tiene:

- El nombre de la red y, a su lado, un enlace: «Conectar →» si la red no tiene ninguna cuenta, «Agregar cuenta →» si ya tiene alguna. Los dos llevan al mismo lugar: la ventana de la red.
- Debajo, en letra chica, los avisos de esa red:
  - Instagram: «Cuenta Business o Creator, enlazada a una página de Facebook. Una cuenta personal no puede conectar.»
  - Facebook: «Una página, no un perfil personal.»
  - YouTube: «Hasta que Google apruebe la cuota de la app, lo que publiques sale privado.»
  - Instagram y Facebook, además, solo mientras la instalación tenga marcada la revisión de Meta: «Mientras Meta revisa la app, solo pueden conectar las cuentas que invitamos como testers. Si Facebook dice que la función no está disponible, escríbenos.»
  - TikTok, Threads y X / Twitter no tienen aviso.
- «Sin cuentas.» si la red no tiene ninguna; si tiene, una tarjeta por cuenta.

### La tarjeta de una cuenta

De arriba abajo:

1. **El fierro**, una barra delgada de color:
   - naranja encendido, con brillo («al rojo»): la conexión está viva;
   - ámbar («enfriándose»): la conexión vence en siete días o menos;
   - gris apagado, sin brillo («frío»): la cuenta no tiene credencial, su última sincronización falló, o la conexión ya venció.

   TikTok y YouTube nunca se ponen en ámbar, porque se renuevan solos; Facebook tampoco, porque el permiso de una página no vence. X / Twitter sí, y por otro motivo: ver «Para conectar X / Twitter».
2. **El nombre de la cuenta**: el @usuario en Instagram, el nombre de la página en Facebook, el título del canal en YouTube, el nombre visible en TikTok, el usuario en Threads y en X. Si la red no dio nombre, se ve el número que la red le da a la cuenta, o «Sin nombre». Al lado, un triángulo rojo si la última sincronización falló, un visto verde si está conectada y sin error, y nada si no tiene credencial.
3. En letra chica, el identificador que la red le da a la cuenta. Es solo informativo.
4. Debajo, el **id de la cuenta en Tu Parrilla**, con un ícono de copiar. Es un botón: al apretarlo copia el id y el ícono pasa a un visto durante dos segundos. Al pasar el mouse dice «Id de cuenta — para «cuentas» en la carga masiva o la API».
5. Cuándo se trajeron sus números por última vez: «Sincronizado recién», «Sincronizado hace 3 horas», «Sincronizado ayer», «Sincronizado hace 4 días»… o «Sin sincronizar» si nunca se trajeron. Threads y X / Twitter dicen siempre «Sin sincronizar», porque de ellas no se traen números.
6. «Sin credencial», solo si la cuenta no está conectada: se desconectó, o quedó de una conexión anterior.
7. Solo con el fierro en ámbar: «Este fierro se está enfriando: la conexión vence hoy. Reconéctala antes de que se apague.» En lugar de «hoy» puede decir «mañana», «pasado mañana» o «dentro de 5 días».
8. Solo si la última sincronización falló, en rojo: «La conexión falló; reconecta la cuenta.» Al pasar el mouse sobre esa frase aparece el error original de la red, a veces en inglés.
9. Avisos de un momento: «Desconectada.» después de desconectar (se va sola), y el resultado de fusionar.
10. Solo en una tarjeta «Sin credencial» cuando la misma red tiene otra cuenta conectada: «¿Es la misma cuenta con otro identificador? Fusiónala y su historial pasa a la viva.», una lista desplegable con las cuentas conectadas de esa red y el botón «Es la misma cuenta →» (dice «Fusionando…» mientras trabaja).
11. Al pie: «Reconectar» y «Desconectar» si la cuenta está conectada («Desconectar» dice «Desconectando…» mientras trabaja); solo «Conectar →» si no lo está.

### Abajo de todo

El botón «Sincronizar ahora», con un ícono de flechas que gira mientras trabaja. A su lado aparece el resultado: «Listo.», que se va solo a los dos segundos, o un error, que se queda.

### La lista para elegir (`/admin/accounts/elegir`)

- El título «¿Qué cuentas de Instagram conectar?», con el nombre de la red que corresponda (Instagram, Facebook o YouTube).
- «Marca las que quieres ver en el panel. Las ya conectadas solo renuevan su acceso.»
- Una casilla por cuenta, con su nombre: el @usuario en Instagram, el nombre de la página en Facebook, el título del canal en YouTube. Las que ya están conectadas vienen marcadas y dicen «ya conectada» a la derecha.
- El botón «Conectar» (dice «Conectando…» mientras trabaja, que puede tardar unos segundos) y el enlace «Cancelar», que vuelve a Los Fierros sin conectar nada.
- Si se aprieta «Conectar» sin marcar nada, en rojo: «Elige al menos una cuenta.»
- Si pasaron más de diez minutos desde el login en la red, en lugar de la lista: «El login venció. Vuelve a conectar.» y el enlace «← Volver a Los Fierros».

## Qué se puede hacer

En todas las redes, la vuelta desde la ventana de la red tiene que hacerse en menos de diez minutos y en el mismo navegador donde se apretó «Conectar →»; si no, vuelve con un error y basta con empezar de nuevo.

### Para conectar Instagram

Hace falta una cuenta de Instagram Business o Creator enlazada a una página de Facebook, y entrar con la cuenta de Facebook que administra esa página. Instagram se conecta a través del login de Facebook.

1. En el bloque «Instagram», aprieta «Conectar →» (o «Agregar cuenta →» si ya hay una).
2. Se abre la ventana de Facebook. Entra con la cuenta de Facebook que administra la página enlazada y acepta los permisos que pida: se piden todos juntos, y uno que falte después obliga a reconectar.
3. Vuelve solo al panel:
   - si Facebook encontró una sola cuenta de Instagram, vuelve a Los Fierros con «Instagram conectado.» y la tarjeta nueva (o renovada);
   - si encontró varias, aparece «¿Qué cuentas de Instagram conectar?»: marca las que quieras y aprieta «Conectar». Vuelve con «Instagram conectado.» o «2 cuentas conectadas.» (con el número que corresponda).
4. Si vuelve con «Ninguna página de Facebook tiene una cuenta de Instagram asociada.», la cuenta de Instagram no es Business o Creator, o no está enlazada a ninguna página que administre esa cuenta de Facebook.

La conexión de Instagram dura unos 60 días; la semana anterior la tarjeta se pone en ámbar y hay que apretar «Reconectar». Conectar Instagram no conecta la página de Facebook, ni al revés: son dos bloques y dos conexiones.

### Para conectar Facebook

Se conecta una página de Facebook, no un perfil personal.

1. En el bloque «Facebook», aprieta «Conectar →».
2. En la ventana de Facebook, entra con la cuenta que administra la página y acepta los permisos.
3. Con una sola página vuelve con «Facebook conectado.». Con varias aparece «¿Qué cuentas de Facebook conectar?»: marca las páginas y aprieta «Conectar».
4. «Esta cuenta no administra ninguna página de Facebook.» quiere decir que esa cuenta no tiene página: hay que crearla o entrar con la cuenta que la administra.

### Para conectar YouTube

1. En el bloque «YouTube», aprieta «Conectar →».
2. Se abre la ventana de Google. Elige la cuenta de Google del canal y acepta los permisos. Google pide aceptar cada vez, también al reconectar.
3. Con un canal vuelve con «YouTube conectado.». Si Google devuelve varios aparece «¿Qué cuentas de YouTube conectar?»: marca los canales y aprieta «Conectar».
4. «Esta cuenta de Google no tiene canal de YouTube.» quiere decir que se eligió una cuenta de Google sin canal: hay que repetir eligiendo la del canal.

### Para conectar TikTok

1. En el bloque «TikTok», aprieta «Conectar →».
2. En la ventana de TikTok, entra con la cuenta y autoriza.
3. Vuelve con «TikTok conectado.». TikTok conecta siempre una cuenta por vez.

El aviso del bloque habla de publicar, no de conectar: una cuenta pública se conecta igual. Si la tarjeta muestra un número largo en vez del nombre, TikTok no entregó el nombre; «Reconectar» lo vuelve a pedir.

### Para conectar Threads

1. En el bloque «Threads», aprieta «Conectar →».
2. En la ventana de Threads, entra y autoriza.
3. Vuelve con «Threads conectado.».

La conexión de Threads dura unos 60 días. En la última semana se renueva sola si se publica en Threads; si no, la tarjeta se pone en ámbar y hay que apretar «Reconectar».

### Para conectar X / Twitter

1. En el bloque «X / Twitter», aprieta «Conectar →».
2. En la ventana de X, entra y autoriza, en menos de diez minutos.
3. Vuelve con «X / Twitter conectado.».

El acceso que entrega X dura dos horas y Tu Parrilla lo renueva solo cada vez que publica en X. Por eso, apenas conectada, la tarjeta de X dice «Este fierro se está enfriando: la conexión vence hoy…», y pasadas dos horas la barra queda gris sin ninguna frase. En X eso no significa que la conexión murió: hay que reconectar solo si una publicación a X falla con «La cuenta no está conectada. Reconéctala y reprograma.».

### Para agregar otra cuenta de la misma red

1. Aprieta «Agregar cuenta →» al lado del nombre de la red.
2. En la ventana de la red, entra con la otra cuenta. Si la red entra sola con la cuenta que ya estaba conectada, solo se renueva esa y no aparece tarjeta nueva: hay que cambiar de cuenta en la ventana de la red (o cerrar la sesión de la red en ese navegador) y repetir.
3. En Instagram, Facebook y YouTube, si el login ve varias cuentas aparece la lista: marca la nueva. Las ya conectadas vienen marcadas, y dejarlas así solo renueva su acceso.

Cada cuenta queda como una tarjeta aparte. Con dos cuentas de una red, el compositor de [La Parrilla](la-parrilla.md) las lista por separado, y la carga masiva o la API piden el id de la cuenta (ver «Para copiar el id de una cuenta»).

### Para renovar una conexión

Cuándo: la tarjeta está en ámbar, dice «La conexión falló; reconecta la cuenta.», dice «Sin credencial», o otra pantalla pide reconectar.

1. En la tarjeta, aprieta «Reconectar» (o «Conectar →» si dice «Sin credencial»).
2. En la ventana de la red, entra con **la misma cuenta** de esa tarjeta. El botón no está atado a la tarjeta: la red decide qué cuenta vuelve, y si vuelve otra, aparece una tarjeta nueva en vez de renovarse esta.
3. Vuelve con la frase «… conectado.» de esa red, la tarjeta al rojo y sin el error. Los posts y números ya traídos no se tocan.

### Para desconectar una cuenta

1. En la tarjeta, aprieta «Desconectar».
2. El navegador pregunta: «Se desconecta «<nombre>» de <red>. Sus posts y métricas ya bajados se quedan, pero no se sincroniza nada más hasta que la vuelvas a conectar. ¿Seguir?». Acepta.
3. Aparece «Desconectada.» un momento, y la tarjeta queda con «Sin credencial» y «Conectar →».

La tarjeta no desaparece. Una cuenta desconectada deja de traer números y comentarios, sus comentarios pendientes en La Mesa ya no se pueden responder, y no se puede publicar en ella hasta reconectarla.

### Para copiar el id de una cuenta

1. En la tarjeta, aprieta el id que tiene el ícono de copiar (el segundo número de la tarjeta, no el de arriba).
2. El ícono pasa a un visto por dos segundos: quedó copiado. Si no cambia, no se copió.

Ese id es el que piden el campo «cuentas» de la carga masiva en [La Parrilla](la-parrilla.md) y la API (ver [la guía de la API](../api-llm.md)) cuando hay dos cuentas conectadas de la misma red. El número de arriba, el de la red, no sirve para eso.

### Para fusionar una cuenta repetida

Cuándo: hay dos tarjetas de la misma cuenta, una «Sin credencial» y otra conectada. Pasa cuando la red le da a la misma cuenta un identificador nuevo (TikTok, Instagram y Facebook dan uno distinto por cada app) y la cuenta vuelve como tarjeta nueva.

1. En la tarjeta «Sin credencial», bajo «¿Es la misma cuenta con otro identificador? …», elige en la lista desplegable la cuenta conectada.
2. Aprieta «Es la misma cuenta →».
3. El navegador pregunta: ««<la vieja>» se fusiona en «<la conectada>»: sus posts, sus métricas y su historial de publicaciones pasan a esa cuenta, y esta tarjeta desaparece. No se puede deshacer. ¿Seguir?». Acepta.
4. Aparece «Fusionada en «<la conectada>».» y la tarjeta vieja desaparece. Sus comentarios también pasan a la conectada.

No se puede deshacer. Si las dos tarjetas están conectadas, la opción no aparece: primero hay que desconectar la vieja.

### Para traer los números ahora

1. Aprieta «Sincronizar ahora», abajo de todo.
2. Espera «Listo.» o un error.

Trae los posts y los números de las cuentas de Instagram, TikTok, YouTube y Facebook; no toca Threads, X ni los comentarios. Se puede apretar una vez cada cinco minutos. Los números también se traen solos una vez al día.

## Mensajes que puede ver

| Lo que dice la pantalla | Qué significa | Qué hacer |
|---|---|---|
| «Instagram conectado.» (o «Facebook conectado.», «YouTube conectado.», «TikTok conectado.», «Threads conectado.», «X / Twitter conectado.») | Se conectó una cuenta, o se renovó una que ya estaba. | Nada. Si no apareció tarjeta nueva, se renovó la que ya estaba. |
| «2 cuentas conectadas.» (con el número que corresponda) | Se conectaron o renovaron varias desde la lista. | Nada. |
| «La red no devolvió el código de autorización.» | La ventana de la red devolvió al panel sin la autorización; pasa, por ejemplo, al cancelar en ella. | Volver a apretar «Conectar →» y aceptar en la ventana de la red. |
| «El estado no corresponde a esa red.» | La vuelta no calza con la conexión que se empezó: pasaron más de diez minutos, o en medio se empezó a conectar otra red o se cambió de sesión. | Volver a apretar «Conectar →» y terminar de corrido, en el mismo navegador. |
| «El enlace de conexión expiró. Inténtalo de nuevo.» | Igual que el anterior. | Volver a apretar «Conectar →». |
| «La conexión con X expiró. Inténtalo de nuevo.» | Pasaron más de diez minutos en la ventana de X, o se terminó en otro navegador. | Volver a apretar «Conectar →» en el bloque de X / Twitter. |
| «El login venció. Vuelve a conectar.» | Pasaron más de diez minutos entre el login y apretar «Conectar» en la lista. | Volver a apretar «Conectar →» en esa red. |
| «Elige al menos una cuenta.» | Se apretó «Conectar» en la lista sin marcar ninguna casilla. | Marcar al menos una, o «Cancelar». |
| «Esa cuenta ya está conectada por otra persona.» | Otro usuario de Tu Parrilla ya tiene esa cuenta conectada. Una cuenta solo puede estar en un usuario. | No se arregla desde esta pantalla: avisar a quien administra Tu Parrilla. |
| «Ninguna página de Facebook tiene una cuenta de Instagram asociada.» | Ninguna página que administra esa cuenta de Facebook tiene una cuenta de Instagram Business o Creator enlazada. | Pasar la cuenta de Instagram a Business o Creator, enlazarla a una página de Facebook y conectar con la cuenta de Facebook que administra esa página. |
| «Esta cuenta no administra ninguna página de Facebook.» | La cuenta de Facebook con que se entró no tiene páginas. | Entrar con la cuenta que administra la página, o crear una. |
| «Facebook no entregó el token de la página. Inténtalo de nuevo.» | Facebook no dio el permiso de la página. | Volver a conectar. |
| «No se pudieron leer las páginas de Facebook: <número>» | Facebook no dejó leer las páginas. | Volver a conectar; si se repite, avisar a quien administra Tu Parrilla. |
| «Instagram rechazó el código: <número>», «Instagram no devolvió token», «Instagram no canjeó el token largo: <número>», «Instagram no devolvió el token largo» (y las mismas con «Facebook») | Meta no terminó de entregar el permiso. | Volver a conectar; si se repite, avisar a quien administra Tu Parrilla. |
| «Esta cuenta de Google no tiene canal de YouTube.» | La cuenta de Google elegida no tiene canal. | Repetir eligiendo la cuenta de Google del canal. |
| «Google no entregó el token de refresco. Reintenta la conexión.» | Google no dio el permiso para renovar la conexión sola. | Volver a conectar. |
| «Google rechazó el código. Inténtalo de nuevo.», «Google no devolvió token.», «No se pudo leer el canal de YouTube.» | Google no terminó de entregar el permiso o no dejó leer el canal. | Volver a conectar. |
| «TikTok rechazó el código: <número>», «TikTok no devolvió token», «TikTok no devolvió el id de la cuenta. Vuelve a conectar.» | TikTok no terminó de entregar el permiso. | Volver a conectar. |
| «Threads rechazó el código. Inténtalo de nuevo.», «Threads no devolvió token.», «Threads no canjeó el token largo. Inténtalo de nuevo.», «Threads no devolvió el token largo.», «No se pudo leer el perfil de Threads.», «Threads no devolvió el perfil.» | Threads no terminó de entregar el permiso o no dejó leer el perfil. | Volver a conectar. |
| «X rechazó el código. Inténtalo de nuevo.», «X no devolvió token.», «X no entregó el token de refresco. Inténtalo de nuevo.», «No se pudo leer la cuenta de X.», «X no devolvió la cuenta.» | X no terminó de entregar el permiso o no dejó leer la cuenta. | Volver a conectar. |
| «Faltan las credenciales de la app de Meta (INSTAGRAM_APP_ID / INSTAGRAM_APP_SECRET).», «Faltan las credenciales de Google (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET).», «Faltan las credenciales de TikTok», «Faltan las credenciales de Threads (THREADS_APP_ID / THREADS_APP_SECRET).», «Faltan las credenciales de X (X_CLIENT_ID / X_CLIENT_SECRET).» | La instalación de Tu Parrilla no tiene configurada esa red. | Avisar a quien administra Tu Parrilla. |
| Una página en blanco que dice «Falta INSTAGRAM_APP_ID» (o «Falta GOOGLE_CLIENT_ID», «Falta THREADS_APP_ID», «Falta X_CLIENT_ID», «Falta TIKTOK_CLIENT_KEY») | Lo mismo, detectado antes de abrir la ventana de la red. | Avisar a quien administra Tu Parrilla. |
| Una página en blanco que dice «No autorizado» | La sesión del panel se cerró. | Entrar de nuevo ([Ingresar](ingresar.md)) y repetir. |
| «Esa red no usa OAuth» o «Esa red no usa OAuth.» | Se abrió una dirección de conexión de una red que no existe. | Volver a Los Fierros y usar los enlaces de cada bloque. |
| «No se pudo conectar. Inténtalo de nuevo.» | Falló algo inesperado al guardar la conexión. | Volver a conectar; si se repite, avisar a quien administra Tu Parrilla. |
| «No se pudo guardar la cuenta. Inténtalo de nuevo.» | Falló guardar las cuentas elegidas en la lista. | Volver a conectar. |
| «Este fierro se está enfriando: la conexión vence <hoy / mañana / pasado mañana / dentro de N días>. Reconéctala antes de que se apague.» | El permiso de esa cuenta vence pronto. En X / Twitter aparece siempre, ver «Para conectar X / Twitter». | «Reconectar» en esa tarjeta, con la misma cuenta. |
| «La conexión falló; reconecta la cuenta.» | La última vez que se trajeron sus números, la red rechazó la conexión (permiso vencido o quitado desde la red). Si al pasar el mouse dice «Quitaste la app desde Facebook: vuelve a conectar.», alguien quitó Tu Parrilla desde la configuración de Facebook. | «Reconectar» (o «Conectar →») en esa tarjeta. |
| «Sin credencial» | La cuenta no está conectada; su historial se conserva. | «Conectar →» en la tarjeta, o fusionarla si es una repetida. |
| «Se desconecta «<nombre>» de <red>. Sus posts y métricas ya bajados se quedan, pero no se sincroniza nada más hasta que la vuelvas a conectar. ¿Seguir?» | Confirmación antes de desconectar. | Aceptar para desconectar, cancelar para dejarla. |
| «Desconectada.» | Se desconectó. | Nada. |
| ««<la vieja>» se fusiona en «<la conectada>»: sus posts, sus métricas y su historial de publicaciones pasan a esa cuenta, y esta tarjeta desaparece. No se puede deshacer. ¿Seguir?» | Confirmación antes de fusionar. | Aceptar solo si de verdad son la misma cuenta. |
| «Fusionada en «<la conectada>».» | Se fusionó. | Nada. |
| «La cuenta que se absorbe tiene que estar sin credencial. Desconéctala primero si es lo que quieres.» | La tarjeta vieja quedó conectada mientras tanto. | Recargar la página; si de verdad es la misma cuenta, desconectarla primero. |
| «La cuenta que absorbe tiene que estar conectada.» | La cuenta elegida en la lista perdió su conexión. | Reconectarla y repetir. |
| «Una cuenta no se fusiona en sí misma.», «Una de las cuentas no es tuya.», «Solo se fusionan dos cuentas de la misma red.» | La pantalla quedó desactualizada. | Recargar la página y repetir. |
| «No se pudo fusionar. Inténtalo de nuevo.» | Falló la fusión; no se cambió nada. | Repetir. |
| «Listo.» | Se trajeron los números. | Nada. |
| «Espera unos minutos antes de volver a sincronizar.» | Se apretó «Sincronizar ahora» hace menos de cinco minutos. | Esperar cinco minutos. |
| «Ninguna red respondió. Revisa las tarjetas en Cuentas.» | Fallaron todas las cuentas. «Cuentas» es esta misma pantalla. | Buscar las tarjetas con la frase roja y reconectarlas. |
| «No se pudo sincronizar. Intenta de nuevo.» | Falló todo el proceso. | Repetir más tarde. |

## Si el humano dice…

- **«¿Cómo conecto mi Instagram?»** → Engranaje «Ajustes» → «Los Fierros» → bloque «Instagram» → «Conectar →». Ver «Para conectar Instagram».
- **«No encuentro Los Fierros» o «no encuentro Cuentas»** → No es una pestaña: está dentro del engranaje «Ajustes», a la derecha de la barra. En el teléfono el engranaje no tiene texto.
- **«Me dice que el token venció»**, **«la tarjeta está gris»** o **«dice que se está enfriando»** → «Reconectar» en esa tarjeta, entrando con la misma cuenta en la ventana de la red.
- **«En La Parrilla me sale "reconéctala" al lado de una cuenta»** o **«una publicación falló con "La cuenta no está conectada. Reconéctala y reprograma."»** → Esa cuenta perdió la conexión: «Reconectar» o «Conectar →» en su tarjeta, y después volver a programar.
- **«El compositor me pide "Reconecta TikTok para autorizar la publicación."»** → «Reconectar» en la tarjeta de TikTok.
- **«Facebook dice que la función no está disponible»** → Mientras Meta revisa la app, solo pueden conectar las cuentas invitadas como testers, y ese error no vuelve al panel. Hay que pedirle a quien administra Tu Parrilla que la invite.
- **«Facebook dice "Invalid Scopes"»** → Es un problema de configuración de la app de Meta de Tu Parrilla, no de la cuenta: avisar a quien administra Tu Parrilla.
- **«Google dice que la app no está verificada»** → Mientras Google no termine de verificar la app de Tu Parrilla, muestra ese cartel; hay que pasarlo para seguir.
- **«Conecté Instagram y no aparece mi página de Facebook»** → Son conexiones separadas: hay que apretar también «Conectar →» en el bloque «Facebook».
- **«Apreté "Agregar cuenta" y no apareció otra tarjeta»** → La red entró con la cuenta que ya estaba conectada y solo la renovó. Ver «Para agregar otra cuenta de la misma red».
- **«Reconecté y apareció una tarjeta nueva»** → En la ventana de la red se entró con otra cuenta, o la red le dio un identificador nuevo a la misma. Si es la misma cuenta, desconectar la vieja y fusionarla (ver «Para fusionar una cuenta repetida»).
- **«Tengo dos tarjetas de la misma cuenta»** → «Para fusionar una cuenta repetida».
- **«Mi TikTok aparece con un número largo en vez del nombre»** → TikTok no entregó el nombre al conectar; «Reconectar» lo vuelve a pedir.
- **«¿Tengo que poner mi TikTok en privada?»** → No, ni para conectar ni para publicar: la publicación directa está aprobada y sale con la privacidad que se elija en el compositor de [La Parrilla](la-parrilla.md).
- **«La tarjeta de X dice que vence hoy»** → En X es lo normal; ver «Para conectar X / Twitter».
- **«Threads o X dicen "Sin sincronizar"»** → Es lo normal: de esas redes no se traen números, solo se publica.
- **«Sincronizar ahora no hace nada» o «me dice que espere»** → Se puede apretar una vez cada cinco minutos. Los números de Threads y X no se traen nunca.
- **«¿Dónde saco el id de la cuenta para la API o la carga masiva?»** → Es el segundo número de la tarjeta, el del ícono de copiar.
- **«No me llegan los comentarios de Instagram, Facebook o YouTube»** → Si la cuenta se conectó antes de que existieran los comentarios, hay que apretar «Reconectar» una vez para dar ese permiso. Más en [La Mesa](la-mesa.md).
- **«Hay una tarjeta de YouTube con un código que empieza con UC y dice "Sin credencial"»** → Solo le pasa a quien administra la instalación: es el canal configurado en ella, esperando que lo conecten. «Conectar →» con la cuenta de Google de ese canal la activa.
- **«Quiero borrar una cuenta del todo»** → No se puede desde aquí; ver «Lo que esta pantalla no hace».

## Lo que esta pantalla no hace

- No borra cuentas ni su historial. «Desconectar» deja la tarjeta y sus números; la única forma de que una tarjeta desaparezca es fusionarla en otra.
- No deshace una fusión.
- No elige a qué cuenta sale cada publicación: eso se marca en el compositor de [La Parrilla](la-parrilla.md).
- No muestra los números de las cuentas: están en [Los Cortes](los-cortes.md) y [Los Números](los-numeros.md).
- No muestra ni responde comentarios: eso es [La Mesa](la-mesa.md).
- No conecta otras redes que las seis de la lista (ni LinkedIn, ni WhatsApp, ni otras).
- No trae números de Threads ni de X / Twitter, ni comentarios de TikTok, Threads o X.
- No elige con qué cuenta se entra en la ventana de la red: eso lo decide la red, y «Reconectar» no está atado a la tarjeta.
- Desmarcar una cuenta ya conectada en la lista no la desconecta: solo no la renueva.
- No genera llaves de API: eso es [Tu Cuenta](tu-cuenta.md).
- No existe en la app del teléfono: las redes se conectan solo desde el panel web (ver [la app del teléfono](app-movil.md)).

## Para quien mantiene esta página

Lo que describe sale de:

- `src/app/admin/(dash)/accounts/page.tsx`
- `src/app/admin/(dash)/accounts/cuentas.tsx`
- `src/app/admin/(dash)/accounts/elegir/page.tsx`
- `src/app/admin/actions.ts` (`syncSocialNow`, `disconnectAccount`, `fusionarCuenta`, `conectarElegidas`)
- `src/app/api/social/[network]/connect/route.ts`
- `src/app/api/social/[network]/callback/route.ts`
- `src/lib/networks.ts` (nombres de las redes, avisos, `META_EN_REVISION`)
- `src/lib/parrilla.ts` (`estadoDelFierro`, los siete días del aviso)
- `src/app/globals.css` (los colores del fierro)
- `src/lib/social/pendiente.ts`
- `src/lib/social/conectar.ts`
- `src/lib/social/fusion.ts`
- `src/lib/social/oauth-state.ts` (los diez minutos)
- `src/lib/social/facebook.ts` y `src/lib/social/instagram.ts` (frases de la conexión de Meta)
- `src/lib/social/meta-bajas.ts` (la frase de la baja desde Facebook)
- `src/lib/social/sync.ts` y `src/lib/social/index.ts` (qué redes traen números)
- `src/lib/social/publish/x.ts` y `src/lib/social/publish/threads.ts` (la renovación al publicar)
- `src/lib/social/publish/publisher.ts`, `src/lib/social/publish/tiktok-creador.ts` y `src/app/admin/(dash)/schedule/composer.tsx` (las frases de otras pantallas que mandan a reconectar)
- `src/db/schema.ts` (`SOCIAL_NETWORKS`, el orden de los bloques)
- `src/app/admin/(dash)/nav.tsx` y `src/lib/vocabulario.ts` (cómo se llega)

Si cambias lo que se ve en alguno de ellos, actualiza esta página en el mismo commit.
