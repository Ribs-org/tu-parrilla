# Tu Parrilla, la app del teléfono

Esta es la app del teléfono de Tu Parrilla. En el teléfono se llama **Tu Parrilla**, con el
bife sobre la reja de ícono, desde el build de la Play Store (2026-10-16); el APK de prueba
de antes se llama «Vicente · Números» y tiene otro identificador, así que las dos pueden
convivir instaladas hasta que se borre el APK. Desde el 2026-10-16 tiene las pestañas del
panel web, en versión corta: **La Parrilla** (lo programado día por
día —con un filtro por red, lo que ya salió hundido en un renglón y, hoy, la línea de
«ahora»—, lo que se quemó, los borradores y cuántos cortes salieron ayer), **Publicar**
(eliges fotos o un video de la galería, escribes el texto, marcas las cuentas —TikTok
incluido desde el 2026-11-07, con su bloque de opciones— y lo programas, o lo mandas a salir
ahora, con su respuesta automática por palabra clave si quieres; o, con «Historia», una historia
o una secuencia de historias para Instagram y Facebook), **Los Números** (las dos mitades del tablero, con «Tus
publicaciones» un toque adentro y los seguidores de cada red detrás de «⋯ Más») y, desde la versión
1.2.0 (2026-11-02), **La Cocina** (grabar un video o sacar una foto con la cámara del teléfono,
ordenar la cámara de frío y pedirle una comanda al chef de la casa con las opciones del panel; ver
«La Cocina desde el teléfono», más abajo). Desde el 2026-11-07, La Parrilla tiene arriba una tarjeta
**La Mesa**, con cuántos comentarios esperan respuesta, que abre los comentarios con su borrador
para corregir y mandar (ver «La Mesa desde el teléfono»).
Arriba a la derecha de todas, el botón de **Ajustes** (un trinche y un cuchillo, lado a lado): tus cuentas con la temperatura de su
fierro (`/api/mobile/fierros`), con un punto en el botón si alguna se enfría o se apagó,
el modo —la noche o el día con sushi, el mismo de la cuenta—, desde la 1.2.0 «Los avisos» (encender o
apagar los avisos al teléfono; ver «Los avisos al teléfono», más abajo), «Cerrar sesión» y, al final, el
libro de sugerencias (de día, la caja) para escribirle al equipo y leer lo que respondió, como en el panel
(`/api/mobile/sugerencias`, y `…/{id}/leida` al abrir una respuesta). Antes eran cinco con nombres propios: Resumen, Contenido, Publicar, Cuentas y
Calendario. Los datos son los mismos que ve el panel web, leídos desde
`https://tu-parrilla.cl/api/mobile/*`; `/api/mobile/overview` y
`/api/mobile/schedule/check` ya no los usa la app nueva y siguen solo para las
instalaciones que no se han actualizado.

No está en la Play Store pública ni en la App Store: se instala desde la pista interna
de Google Play (ver `docs/play-store.md`) o directamente desde un archivo `.apk` que se
genera bajo pedido.

## Qué necesitas

Una cuenta gratuita en [expo.dev](https://expo.dev). Basta con registrarse una vez
con un correo; no cuesta nada y no requiere tarjeta.

## Cómo generar el instalable (`.apk`)

Solo hace falta cuando cambia algo **nativo** de la app (un módulo nuevo, la versión
en `app.json`). Los cambios de pantalla y de lógica llegan solos, ver la sección
siguiente.

1. Abre una terminal **dentro de la carpeta `mobile/`** de este proyecto. Todos los
   comandos de abajo se corren ahí; corridos desde la raíz crean archivos sueltos
   que no sirven.
2. **La primera vez en un computador**, inicia sesión con tu cuenta de Expo:

   ```bash
   npx eas-cli login
   ```

   El proyecto ya está creado y vinculado en la cuenta `vicentepareja` (se hizo el
   2026-09-10 con `eas init` y `eas update:configure`; `app.json` guarda el id). No
   hay que volver a hacerlo.
3. Ejecuta:

   ```bash
   npx eas-cli build -p android --profile preview
   ```

4. El comando sube el proyecto y lo construye en los servidores de Expo, no en tu
   computador. En el plan gratis puede pasar un rato en cola antes de empezar; en
   total suele ser entre diez y treinta minutos. Al terminar, imprime un link (algo
   como `https://expo.dev/artifacts/eas/....apk`). Si cerraste la terminal, el
   mismo link aparece en
   [expo.dev/accounts/vicentepareja/projects/vicente-numeros/builds](https://expo.dev/accounts/vicentepareja/projects/vicente-numeros/builds).

## Cómo mandar un cambio sin reinstalar

Cuando cambia una pantalla o la lógica (no un módulo nativo), basta con:

```bash
npx eas-cli update --channel preview --environment preview --message "qué cambió"
```

La app lo descarga la próxima vez que se abre y lo aplica en la apertura siguiente.

### Cuidado con el canal: hay dos, y una actualización solo llega al suyo

Cada instalación escucha el canal con el que se construyó, y **una actualización publicada
en el otro canal no le llega nunca** —sin error, sin aviso: se queda con el código del día
que se instaló—.

| Cómo la instalaste | Canal |
|---|---|
| El APK que se descarga a mano (perfil `preview`) | `preview` |
| Desde la Play Store, pista interna (perfil `production`) | `production` |

Así que **mientras tengas las dos instaladas hay que publicar a las dos**, una detrás de la
otra:

```bash
npx eas-cli update --channel preview    --environment preview    --message "qué cambió"
npx eas-cli update --channel production --environment production --message "qué cambió"
```

Cuando el APK a mano quede retirado —que es el plan en cuanto la app esté en la tienda—,
queda solo el segundo comando.

La separación no es burocracia: es lo que deja probar algo en el teléfono antes de que
llegue a la versión que usas de verdad.
Solo llega a los teléfonos que tengan instalada la misma versión de `app.json`; si
subiste la versión, hay que generar el APK de nuevo.

**Si el cambio también toca la API del sitio** (algo bajo `src/app/api/mobile/`), el
orden deja de ser libre: corre este comando **inmediatamente después** de que ese
cambio llegue a `main` —Vercel despliega solo con cada fusión, ver «Cómo entra un
cambio» en el `README.md` de la raíz—, no cuando convenga. El despliegue web y esta
actualización dejaron de ser independientes: si la web sale primero y el OTA se
demora, un teléfono con la versión vieja instalada puede toparse con un error que le
pide un campo que esa versión no sabe mandar (pasa con las cuentas: una app vieja que
manda `redes` para una red con dos cuentas ahora conectadas recibe un rechazo pidiendo
`cuentas`, campo que esa versión nunca aprendió a enviar). Si el OTA sale primero, la
app nueva pide un endpoint que el backend todavía no tiene — degrada bien, con
reintento, pero no publica hasta que la web la alcance.

### Si Metro se queda sin memoria

`eas update` arma el paquete de las tres plataformas, también la web, que una actualización
por aire no usa, y el armado estático de la web es lo que más memoria pide. En el servidor de
desarrollo la sesión tiene un tope de 5 GB, y al pasarlo el núcleo mata a Metro: el comando
termina en `exited with signal: SIGKILL`, sin otro aviso. Entonces se arma solo Android e iOS
y se publica ese paquete, el mismo para los dos canales mientras ninguno tenga variables en
EAS (`npx eas-cli env:list --environment preview` y `production` dicen «No variables found»):

```bash
npx expo export --output-dir dist --dump-sourcemap --dump-assetmap --platform android --platform ios
npx eas-cli update --skip-bundler --channel preview    --environment preview    --message "qué cambió"
npx eas-cli update --skip-bundler --channel production --environment production --message "qué cambió"
```

## Cómo instalarla en el teléfono

1. Abre ese link **desde el navegador del teléfono** (no hace falta cable ni
   computador: puedes mandarte el link por WhatsApp o correo y abrirlo ahí mismo).
2. El teléfono va a descargar un archivo `.apk` y, al abrirlo, Android va a pedir
   permiso para "instalar apps desconocidas" (porque no viene de Google Play).
   Se acepta una vez; queda guardado para la próxima.
3. Termina la instalación como cualquier app. Va a aparecer un ícono llamado
   "Vicente · Números" (el APK de prueba; la de la Play Store se llama "Tu Parrilla").

## Cómo entrar

Igual que el panel web: la primera vez que se abre, pide el **correo** y después el
**código de seis dígitos** que llega a ese correo. Entra cualquier usuario invitado en
Los Maestros, y cada uno ve sus propias cuentas. Se hace una sola vez: después la
sesión queda abierta. Si el teléfono tiene huella digital o PIN configurado, la app
usa ese candado para protegerse cada vez que arranca — no hay que volver a pedir un
código. Sin el candado no se llega a ninguna pantalla de la cuenta, ni con un enlace: la raíz
(`src/app/_layout.tsx`) las deja detrás de la sesión (`src/components/sesion.tsx`).

Hasta la versión del 2026-10-15 se entraba con una contraseña del despliegue
(`ADMIN_PASSWORD`). Ya no existe: una app que todavía la pida es una instalación sin
actualizar, y se pone al día sola al abrirla dos veces con señal. La sesión que ya
tenía abierta sigue valiendo mientras tanto.

Para salir: el botón de Ajustes → **Cerrar sesión**. Borra la sesión de este teléfono y lo que
la app guardó de la cuenta —lo último que mostró cada pantalla, para abrir al instante—, y nada
más. Entrar también lo borra, por si el teléfono cambió de manos. Para cortar todos los teléfonos
a la vez, «Si se pierde el teléfono», abajo.

## La primera vuelta

Lo justo para partir, sin un recorrido por cada pantalla (el porqué, en
`docs/superpowers/specs/2026-11-10-primera-vuelta-design.md`):

- **La bienvenida** (`src/app/bienvenida.tsx`). Al canjear el código, el servidor dice si la
  cuenta no tiene ninguna red conectada (`sinRedes`, en la respuesta de `POST /api/mobile/session`).
  Si no tiene, la raíz abre la bienvenida en vez de las pestañas: una guardia más en
  `src/app/_layout.tsx`, como la de la sesión. Su botón abre Los Fierros del panel con el puente
  (abajo). La pregunta de los avisos vive en las pestañas, así que no sale mientras dura.
- **El puente** (`src/lib/puente.ts`, y del lado del sitio `src/lib/puente.ts` y
  `/api/mobile/puente`). Las redes se conectan en el panel, y abrirlo en el navegador pedía otro
  código. Ahora la app pide una dirección de un solo uso que vale dos minutos y la abre:
  `/ingresar/puente#t=<llave>` muestra con qué correo se entra y, al apretar «Entrar», abre la
  sesión del panel y lleva a Los Fierros. El botón «Abrir Los
  Fierros en el panel» de Ajustes usa lo mismo. Contra un sitio de antes, abre Los Fierros sin
  sesión, como antes.
- **El chef, a la quinta** (`src/components/tarjeta-del-chef.tsx`). La app cuenta las aperturas
  (arrancar, o volver después de media hora fuera) y a la quinta presenta al chef en La Parrilla,
  una vez, si La Cocina está encendida, sin comandas y nunca abierta en ese teléfono.

Lo que recuerda —la bienvenida a medias o vista, las aperturas y el chef— va en AsyncStorage
(`primera-vuelta`, `src/lib/primera-vuelta.ts`) y es de la cuenta: se borra al salir y al entrar.
Todo es JavaScript: llega por aire, también a la 1.1.0 (usa `Linking`, `AppState` y `BackHandler`
de React Native y AsyncStorage, que ya están en los dos builds). Salió por aire a la 1.1.0 el
2026-11-10, con el servidor ya en producción, en el commit `3765d0b` de `ota-1.1.0` —que también
lleva, de #372, el texto de Los Números que ya no promete los números «mañana»—, a los dos
canales. Lo probado en esa rama: `tsc`, los tests, el lint y `expo export`; no se probó en un
teléfono.

## Cómo publicar desde el teléfono

En la pestaña **Publicar**:

1. Escribe el texto. En YouTube, el primer renglón es el título del video.
2. Toca **Fotos o video** y elige de la galería (hasta diez archivos; un video de
   hasta 500 MB).
3. Marca las cuentas a las que sale (el chip lleva la red y el handle, para distinguir
   dos cuentas de una misma red). Si tienes una sola cuenta conectada viene marcada,
   porque no hay entre qué elegir; con dos o más, ninguna. Con una cuenta de TikTok marcada
   aparece su bloque, el del panel (ver «TikTok y la palabra clave», abajo).
4. Con una cuenta de Instagram marcada y **un solo video** elegido aparece el chip
   «Trial reel · @handle». Encendido, el reel sale solo para quienes no te siguen, y
   **tú lo compartes con todos desde la app de Instagram** cuando quieras. Con fotos o
   con más de un archivo el chip no aparece. Si Instagram no tiene la función habilitada
   en esa cuenta, el destino falla al publicar con su propia frase. El editor no deja
   apagar la opción ni «Reintentar» la cambia —volvería a pedir el trial y a fallar—: la
   forma de mandarlo como reel normal es borrar el post y programar otro sin la opción.
   Con esa misma condición aparece además **«Música de Instagram · @handle»**: lo que está
   sonando en Instagram, una búsqueda, **«Sugiéreme una»** con su **«Otra»** (la elige un modelo
   en el servidor, o el azar sin él; ver «Música de Instagram» en el `README.md` de la raíz),
   **Escuchar** la muestra y dos volúmenes, canción y video, de a 10 con «−» y «+». Con una cuenta
   conectada con el login de Instagram el bloque dice que ahí no hay música. La canción viaja en
   las opciones del destino (`musica`) y se guarda en el borrador; el editor no la cambia.
5. Si quieres, abre **«▸ Respuesta automática por palabra clave»** y escribe la palabra, el
   mensaje y la respuesta pública, como en el panel.
6. Toca **Cuándo** para elegir día y hora, y luego **Programar**. O toca
   **Publicar ahora**: confirma, y sale en los próximos cinco minutos.

Cada archivo se sube apenas lo eliges, de a uno, con su avance sobre la miniatura; si
se corta la señal, esa miniatura queda en **Reintentar** y se toca para intentarlo de
nuevo. **Programar** se enciende cuando todos terminaron, y es un solo pedido: al
terminar, la app salta a La Parrilla con el post recién programado.

### Los borradores

Lo que escribes en Publicar se guarda solo como **borrador**, un momento después del
último cambio y también si la app pasa a segundo plano, igual que en el compositor del
panel. Son los mismos borradores del panel (`borradores` y `borrador_media`, por
`/api/mobile/borradores`): lo empezado en un lado se sigue en el otro. En La Parrilla
están en **Borradores (N)**, y los que tienen fecha, también en su día con borde
punteado (no con un filtro por red puesto: la app no sabe a qué cuentas va un borrador). **Programar** sale del borrador y el servidor lo borra al crear el post;
**Nueva publicación** deja el que está en los borradores y vacía el formulario;
**Descartar** lo borra.

Por qué los archivos suben al elegirlos y no al programar, como antes: un borrador tiene
que conservarlos para que el panel los vea. El costo es que las reglas de cada red se
revisan al programar, con el archivo ya arriba: un video que X no acepta se entera
después de subirlo. Antes la app preguntaba primero (`/api/mobile/schedule/check`)
justamente para no gastar datos móviles en eso; el compositor del panel ya vivía con el
mismo costo, y la razón es la misma.

Dos reglas que protegen a los dos lados:

- Lo que la app no ve, el servidor lo conserva. Desde el 2026-11-07 la app ve y guarda las
  opciones de TikTok y la palabra clave; una instalación sin actualizar no, y para ella sigue
  la regla de antes: al guardar, el servidor conserva lo que dejó el panel, y un borrador que
  lo tiene no se programa desde ese teléfono —sale un aviso y los botones se apagan—, porque
  programarlo dejaría eso fuera y el borrador, que lo guardaba, se borraría. Lo mismo pasa,
  en cualquier versión, con un borrador que va a una red en «Próximamente».
- Programar con un borrador que ya no existe se rechaza. Cubre dos casos: que se haya
  programado o descartado en el panel, y que este mismo envío ya haya salido y se haya
  perdido la respuesta, en el que repetirlo publicaría dos veces.

El trial reel es puro JavaScript, sin cambio nativo: llega por aire a los dos canales
con el orden de siempre (web primero), como se explica en
[«Cómo mandar un cambio sin reinstalar»](#cómo-mandar-un-cambio-sin-reinstalar).

«Música de Instagram» también llega por aire a la 1.1.0, con una diferencia: **Escuchar** usa
`expo-audio`, que es un módulo nativo y entró en `package.json` para la próxima build. La 1.1.0
no lo trae, y cargar `expo-audio` en una app sin su módulo revienta al abrir; por eso
`src/lib/reproductor.ts` pregunta primero si el módulo nativo existe
(`requireOptionalNativeModule('ExpoAudio')`, que devuelve null en vez de lanzar) y solo entonces
carga `expo-audio` con un `require` adentro de la función. Sin él, la muestra se abre fuera de la
app con `Linking.openURL` y el bloque lo dice. Lo cuida `src/lib/reproductor.test.ts`. Dos cosas
para quien publique la OTA desde `ota-1.1.0`:

- La rama necesita `expo-audio` en su `package.json` igual —solo la parte de JavaScript—, o Metro
  no arma el paquete. Como `runtimeVersion` es la versión de la app (`appVersion`), sumarlo no
  cambia a qué teléfonos llega la actualización.
- **No** se agrega el plugin `expo-audio` a `app.json`: pide el micrófono y el servicio de
  reproducción en segundo plano, y acá solo se escucha una muestra con la app abierta.

Mientras una app 1.1.0 no tenga la actualización, no sabe de música, y el servidor la cuida: la
app nueva manda `conMusica: true` al guardar un borrador y al programar, la vieja no, y entonces
la canción que el borrador traía del panel se conserva al guardar y se suma al programar.

Lo que no se puede hacer desde el teléfono, y sigue siendo del panel web: poner una
portada y etiquetar con atributos.

### TikTok y la palabra clave (2026-11-07)

Con una cuenta de TikTok marcada, Publicar muestra el bloque del compositor del panel
(`src/components/tiktok-opciones.tsx`, que copia `src/app/admin/(dash)/schedule/tiktok-opciones.tsx`
de la raíz), porque la auditoría de publicación directa de TikTok exige lo mismo a cada cliente:
los datos de la cuenta que da `creator_info` («Se publicará en la cuenta …», con el avatar, y el
largo máximo de un video), **«Quién puede verlo»** sin nada elegido y solo con las privacidades que
la cuenta permite, **«Permitir»** con Comentarios, Dúos y Pegar (Stitch) apagados —grises si la
cuenta los tiene bloqueados; con fotos, solo Comentarios—, **«Este contenido promociona una
marca»** con «Mi marca» y «Contenido patrocinado» (que no deja «Solo yo»), **«Hecho con IA»**,
**«Música de TikTok»** con fotos, y el consentimiento («Al publicar aceptas la … de TikTok.»,
con sus enlaces). **«Enviar como borrador a mi bandeja de TikTok»** esconde todo eso. Los textos
son los del panel, letra por letra: los compara `src/lib/telefono-copias.test.ts` de la raíz.

`creator_info` lo pide `GET /api/mobile/schedule/accounts/{id}/tiktok`, la misma consulta del
compositor (`creadorDeCuenta`); sin él se ofrecen las cuatro privacidades y el bloque dice por qué,
como el panel. Lo que el teléfono hace de más: con un video, dice el largo máximo de la cuenta y no
deja programar uno más largo —TikTok lo rechazaría después de subirlo—, si el selector dio la
duración (un archivo que vuelve de un borrador no la trae).

Debajo de las cuentas, **«▸ Respuesta automática por palabra clave»**, plegada salvo que el borrador
traiga una: la palabra, el mensaje y la respuesta pública, con los topes y los textos del panel
(`src/components/regla-clave.tsx`). Las reglas —una palabra, el mensaje de 1 a 1000— las pone el
servidor al programar, con sus frases. En «Historia» no se muestra ni viaja: una historia no tiene
comentarios, y la palabra queda en el borrador para cuando se vuelva a Post.

La app lo avisa con el encabezado `X-Parrilla-Publicar: tiktok,palabra-clave` (`src/lib/api.ts`), y
solo entonces el servidor le ofrece las cuentas de TikTok, le abre los borradores con sus opciones
de TikTok (`tiktok`) y su regla (`regla`), guarda lo que manda y la deja programarlos. Las opciones
de TikTok viajan en `opciones`, por cuenta, como las de Instagram; la regla, en `regla`, al guardar
(null la borra) y al programar. Todo es JavaScript y React Native (`Switch`, `Linking`,
`expo-image`): llega por aire también a la 1.1.0 (ver «TikTok y la palabra clave por aire a la
1.1.0», abajo).

### Las historias (2026-11-07)

Arriba de Publicar, **«Post · Historia»**. En Historia, cada foto o video es una historia de
Instagram o Facebook: sin texto, sin trial reel, sin canción y solo con las cuentas de esas dos
redes. Lo primero es el **visor**: la historia en 9:16, recortada como se va a ver, con una raya
por historia arriba y deslizando de lado para pasar de una a otra; debajo, la tira con el orden en
que salen, «← Antes» y «Después →» para cambiarlo y la «✕» de cada una. El botón dice
**«Programar historia»** o **«Programar N historias»**. El diseño entero, y lo que se decidió al
construir esta parte, está en `docs/superpowers/specs/2026-10-24-historias-design.md`.

- **Una secuencia entra entera.** La app manda un solo pedido con `secuencia: true`, las cuentas en
  `{ historia: true }` y los archivos en su orden; el servidor crea una historia por archivo, con
  la misma hora y su lugar (`{ secuencia, orden }`), en una sola transacción, y consume el borrador
  una vez para todas. Así una secuencia no queda a medias por una señal que se corta, y un envío
  repetido no la duplica: el borrador ya no está. Contra un servidor de antes, varios archivos se
  rechazan con «Una historia es un solo archivo, foto o video.»; una sola historia funciona igual.
- **Lo que se avisa antes**, sobre el visor y con las frases del servidor: una foto que no es JPG
  hacia Instagram apaga «Programar» (`HISTORIA_JPG`, que el servidor rechazaría igual); un video de
  más de 60 s y lo que no es 9:16 se avisan en ámbar y se programa igual, porque el servidor no
  mide. El ancho, el alto y la duración los da el selector de imágenes (`medidasDe`); un archivo
  que vuelve de un borrador no los trae, y no se avisa.
- **El borrador recuerda el modo** (`modo: 'historia'`, en `src/lib/borrador.ts` de la raíz) y
  guarda igual el texto, el trial reel y la canción: cambiar a Historia y volver a Post no pierde
  nada. Una app sin actualizar no manda `modo`, y el servidor conserva el que había; si esa app
  intenta programar como post un borrador de historia, se rechaza (`BORRADOR_ES_HISTORIA`) en vez
  de publicar un carrusel. El compositor del panel todavía no tiene «Historia»: abre ese borrador
  como un post (ver `docs/pendientes.md`).
- **Un video no se reproduce en el visor**: pediría `expo-video`, que es nativo y entró con el build
  1.2.0 para el mesón; el visor todavía no lo usa, porque también va por aire a la 1.1.0. Se ve «▶» con
  su duración. El orden se cambia con flechas y no arrastrando: arrastrar pedía armar el gesto con
  `react-native-gesture-handler` sobre una tira que también se desliza, y las flechas dicen lo
  mismo con un toque y se leen con el lector de pantalla.
- **Editar publicación** abre una historia sin el cuadro del texto («Es una historia: no lleva
  texto…»): el servidor rechazaría guardarlo. Lo dice el campo `historia` de
  `GET /api/mobile/schedule/posts/{id}`; uno de antes no lo manda y la pantalla muestra el texto.

Todo es JavaScript y lo que la app ya trae (`expo-image`, `expo-image-picker`, el `ScrollView` de
React Native): sin módulos ni permisos nuevos, llega por aire también a la 1.1.0 (ver «Las
historias por aire a la 1.1.0», abajo).

### Corregir o borrar lo programado

Tocar la tarjeta de un post en La Parrilla abre **Editar publicación**: el texto, la hora
(«Cuándo: …», con la misma hoja de «Reprogramar»), las cuentas con un **Quitar** cada una
—menos la última: para eso está borrar—, **Guardar** y **Borrar publicación**, con su
pregunta. Llama a `GET`, `PATCH` y `DELETE /api/mobile/schedule/posts/{id}`.

Las reglas son las del editor del panel, y no hay una copia: el panel y el teléfono llaman a
la misma función (`editarPostProgramado`, en `src/lib/social/publish/editar.ts`; borrar, a
`borrarPostProgramado`), así que los límites de cada red, la hora en el futuro y lo que pasa
con un intento en curso se deciden en un solo lugar, y el teléfono muestra las mismas frases.
Lo que el teléfono no edita —los archivos, la portada, los atributos, la palabra clave y las
opciones de cada red— lo manda como «conservar» y queda tal como está guardado; la pantalla
lo dice en una nota amarilla, como el aviso de los borradores, para que nadie crea que se
perdió. Sin hora nueva, la hora no se toca aunque ya haya pasado: corregir el texto de lo
que falló no obliga a moverla, igual que en el panel.

Una reja que el panel no tiene: un post que ya salió en alguna cuenta (o que está saliendo)
se abre, pero solo para decir que eso se corrige en el panel web. El editor del panel deja
corregir lo que falta de un post a medio publicar mostrando qué cuenta ya salió; en el
teléfono, sin esa vista, era fácil creer que se estaba corrigiendo también lo publicado.

## Lo que trajo

Arriba de La Parrilla, debajo de La Mesa, la fila **«Lo que trajo»**: una burbuja por corte que
salió en los últimos siete días, del más nuevo al más viejo, con su dibujo de siempre. La de un
corte con algo nuevo lleva el anillo en brasa y un circulito rojo con cuánto («+37», «+1,2 mil»);
la de uno sin nada, el anillo apagado. Tocar una —o el renglón de un corte que ya salió en todas
sus redes— abre su detalle (`src/app/corte/[id].tsx`): lo nuevo, lo que lleva cada red tal como
la red lo da y las visitas a tu página. Qué cuenta como nuevo, y por qué YouTube no suma sus «me
gusta», está en el README de la raíz («Lo que trajo, en el teléfono»).

- **La fila** (`src/components/lo-que-trajo.tsx`) lee `GET /api/mobile/lo-que-trajo` con
  `useScreenData`, como lo demás de La Parrilla: lo guardado apenas abre, y se refresca al volver
  a la pestaña y al tirar hacia abajo. Sin cortes en la semana no aparece.
- **El detalle no usa la caché**: abrirlo deja la marca (`POST /api/mobile/cortes/{id}/visto`) y
  el circulito vuelve a cero, así que lo que muestra tiene que ser lo de ahora. Primero lee y
  después marca, para que lo nuevo alcance a verse; si la marca no llega, el circulito sigue hasta
  la próxima vez. Marcar anota un cambio (`anotarCambio`), y La Parrilla vuelve a leer la fila al
  volver.
- **El número** —los cortes con algo nuevo más los comentarios que esperan en La Mesa— lo cuenta
  el servidor y viene con la fila y con cada marca. `src/lib/numero-del-icono.ts` lo guarda en
  memoria para la pestaña La Parrilla (`tabBarBadge`) y lo pone en el ícono hablándole directo al
  módulo nativo de `expo-notifications` (`ExpoBadgeModule`, lo mismo que hace
  `setBadgeCountAsync` en Android), sin cargar `expo-notifications`. Al salir de la cuenta vuelve
  a cero.

- **La racha** (`RachaDeLaParrilla`, en el mismo archivo) va primera en La Parrilla, con lo que
  trae la fila (`racha`); desde dos días. **La llamita** de una burbuja es su hito más alto
  (`hito`), y el detalle lista todos.
- **La celebración** (`src/components/celebracion.tsx`) sale sobre La Parrilla con lo que trae la
  fila en `porCelebrar`, uno detrás de otro: un `Modal` con una fila de llamas que cruza con
  `Animated` y la tarjeta del corte. Al mostrarla avisa al servidor
  (`POST /api/mobile/hitos/{id}/celebrado`) y anota el id en AsyncStorage
  (`hitos-celebrados`, los últimos 50): lo guardado de la vez anterior puede traer un hito que ya
  se celebró, y sin esa lista se celebraría otra vez al abrir, antes de que llegue lo nuevo. Con
  «Quitar animaciones», sin las llamas.
- **La llama** (`src/components/llama.tsx`) está dibujada con vistas —un cuadrado con tres esquinas
  redondas, girado y estirado— y con `Animated` del núcleo, no con SVG ni Reanimated: `react-native-svg`
  no está en la 1.1.0, y así lo mismo le llega por aire. De día es la llama azul del soplete.

**El número del ícono es solo de la 1.2.0**: el módulo nativo entró con los avisos, y la 1.1.0 no
lo trae. Ahí `requireOptionalNativeModule` devuelve null y el ícono no cambia; la fila, el detalle
y el número de la pestaña andan igual. Por eso no se importa `expo-notifications`: la rama
`ota-1.1.0` no lo tiene en `package.json` y Metro no armaría el paquete. Aun en la 1.2.0 depende
del teléfono: Samsung y otros muestran el número; un Pixel, un punto mientras haya un aviso sin
abrir. Con la app cerrada, el número solo cambia si llega un aviso.

**Se publica después del servidor**, como siempre que cambia `src/app/api/mobile/`. Con un sitio
de antes la fila no aparece (la ruta contesta 404), y tocar un renglón servido abre el detalle con
«No se pudo conectar. Revisa tu señal.».
Salió por aire a la 1.1.0 el 2026-11-11, con el servidor ya en producción, en el commit
`08c880c` de `ota-1.1.0`, a los dos canales. Los hitos, la llamita y la racha (#379) salieron el
mismo día, en el commit `14f7698`. Lo probado en esa rama, las dos veces: `tsc`, los tests, el
lint y `expo export`; no se probó en un teléfono.

## La Cocina desde el teléfono

La cuarta pestaña, desde la versión 1.2.0 (2026-11-02), y desde el 2026-11-06 con lo mismo que el
panel en la cámara de frío —de día, la nevera— y en las comandas. Tiene tres partes, que se eligen
con unas burbujas arriba:

- **Tu comanda.** Se marca la casilla de los derechos, se toca **Grabar video** (o **Sacar foto**, o
  **Elegir de la galería**) y lo grabado se guarda en la cámara de frío y entra al riel de la
  comanda; también se elige de lo guardado. En el riel cada video dice qué es, como en el panel
  (plato principal, para intercalar, otra cámara, la pantalla), y debajo van las opciones del
  formulario «Pedir una comanda»: qué es el plato principal, los formatos, cuántos, para cuándo (la
  hoja de fecha de la app, en modo solo día), la instrucción y la marca —el nombre, el @ y el
  llamado final; el color de acento se queda el guardado, porque elegir un color en el teléfono pide
  un selector que la app no tiene—, con «Confirmar», la fila y la hora estimada. **Mandar al chef**
  la cuelga.
- **La cámara de frío.** La cuota, **Guardar en la cámara** sin pedir comanda (con «Para qué es»), y
  lo que hay adentro con **Cambiar** (nombre y uso) y **Sacar de la cámara**, con su pregunta.
- **Tus comandas.** Las últimas quince con su estado, que se actualizan solas mientras alguna está en
  marcha; la pregunta del chef con sus opciones y su plazo, para contestarla ahí; «Lo que pasó» paso
  a paso, la hora estimada, cuántos creativos esperan en el mesón con **Ver el mesón** (desde la 1.2.0)
  y **Cancelar la comanda** mientras no esté en el horno.

La línea de arriba dice cómo atiende la cocina —sola, a mano o cerrada— con la frase que manda el
servidor. La estación dibujada de cada comanda sigue en el panel: el teléfono dice lo mismo con el
estado y las cinco rayas del recorrido, con vistas, porque la pantalla también va por aire a la 1.1.0,
que no trae `react-native-svg`.

**Las opciones viajan desde el servidor.** Los nombres de los formatos, las cantidades, los tipos de
plato principal, los roles de un video y los usos no están copiados en la app: `GET
/api/mobile/cocina` los manda en `opciones`, con los textos del panel (`OPCIONES_DEL_PEDIDO`, en
`src/lib/cocina/telefono.ts` de la raíz). Eso sirve además de señal: **contra un servidor de antes,
que no manda `opciones`, la app vuelve al camino corto de la 1.2.0** —el riel y la instrucción, sin
cambiar, sacar ni cancelar, y la comanda con el cuerpo de antes—, así que da lo mismo qué sale
primero, la web o la actualización por aire. Al revés también: una app de antes manda la comanda
corta y el servidor la completa como el panel la trae marcada.

Las rutas son `/api/mobile/cocina` (todo lo que la pantalla muestra), `/api/mobile/cocina/subidas…`
(las mismas subidas por partes del panel, con el token del teléfono), `/api/mobile/cocina/comandas`,
`/api/mobile/cocina/comandas/{id}/cancelar`, `/api/mobile/cocina/materiales/{id}` (`PATCH` cambia,
`DELETE` saca) y contestarle al chef, `/api/mobile/cocina/preguntas/{id}/respuesta`. Lo que validan y
sus frases son las del panel (`src/lib/cocina/subidas-http.ts`, `src/lib/cocina/telefono.ts` y
`src/lib/cocina/del-dueno.ts`, en la raíz): la cuota se mira en el servidor igual que desde el panel.

**Cómo sube un video de varios GB sin reventar el teléfono** (`src/lib/subir-por-partes.ts` y
`src/lib/archivo-local.ts`): el servidor abre la subida y dice el tamaño de cada parte (64 MB); la
app pide el enlace firmado de una parte justo antes de subirla, copia ese tramo del archivo a un
temporal de a 4 MB —con el `FileHandle` de `expo-file-system`, que lee desde una posición— y el
temporal lo sube el propio `File.upload`, que lee del disco y avisa el avance. En la memoria de
JavaScript nunca hay más que un trozo; en disco, una parte. De a una parte por vez, con cuatro
intentos cada una. No se mandan los bytes con `fetch` porque React Native pasa un `ArrayBuffer` a
base64 para cruzarlo a la parte nativa. No hizo falta ninguna dependencia nativa nueva:
`expo-file-system` ya estaba.

Lo grabado no queda en la galería: la cámara del sistema lo deja en la caché de la app, que el
teléfono limpia cuando quiere. Por eso la app lo pasa a su carpeta de documentos (`cocina/`) hasta
que termina de subir, y guarda la cola en AsyncStorage (`cocina-pendientes`): si la app se cierra a
medias, al abrir La Cocina sigue donde quedó —el servidor dice qué partes llegaron—. Al terminar o
al quitarlo, la copia se borra; al abrir La Cocina se barre lo que ya nadie espera, y cerrar sesión
borra la cola. En la web (`archivo-local.web.ts`) el archivo es el del navegador y no se guarda.

### El mesón (desde la 1.2.0, 2026-11-07)

**Ver el mesón** (de día, **Ver la bandeja**), en la tarjeta de una comanda que tiene creativos
esperando, abre una pantalla de la pila (`src/app/meson.tsx`) con lo de esa comanda —y **Ver todo el
mesón** para lo de todas—, como la página del panel: por comanda y por pieza, cada creativo con su video
(la portada con «▶ Ver el video», que al tocarla monta el reproductor) o sus láminas, cuándo se borra
en su última semana, el estilo, lo que rotó, el título de YouTube, «El texto ▾», **Programar** y
**Descartar**, que pide el motivo de un toque y una nota opcional. Las frases y los motivos vienen del
servidor (`GET /api/mobile/cocina/meson`); las del panel, en `src/lib/meson.ts`.

**Programar** llama a `POST /api/mobile/cocina/creativos/{id}/programar`, que hace lo mismo que el
botón del panel —pasa el creativo a un borrador de La Parrilla con su texto, su título y su media— y la
app abre ese borrador en Publicar, como uno de la lista de borradores: faltan las cuentas y la hora. Que
programarlo desde el teléfono no pierda nada se comprobó antes de abrirlo: la portada y los atributos
los pone el servidor al crear el post, desde el creativo del borrador (`crearVariosProgramados`, con
su test de integración en `src/lib/cocina/meson.integracion.test.ts`), y el título de YouTube del
borrador lo toma `POST /api/mobile/schedule` de sus campos (`route.test.ts`), porque Publicar no lo
muestra. TikTok y la palabra clave siguen siendo del panel, como para cualquier borrador.

**El video** usa `expo-video`, que es nativo y llega con el build 1.2.0 (sin reproducir en segundo
plano ni en ventana flotante: el plugin en `app.json` lo deja apagado). Como el audio, no se importa
directo: `src/components/meson.tsx` pregunta por el módulo (`src/lib/video.ts`) y recién entonces carga
`src/components/video-del-creativo.tsx`; sin él, el video se abre fuera de la app. Aun así, **ni
`src/app/meson.tsx` ni `src/components/meson.tsx` ni `src/components/video-del-creativo.tsx` se copian a
`ota-1.1.0`**: esa rama no tiene `expo-video` en `package.json` y Metro no armaría el paquete. Lo que
sí se puede copiar es `src/components/cocina.tsx`: sin `onVerMeson`, la tarjeta dice como antes que lo
que espera está en el panel web.

Contra un servidor de antes, sin la ruta, la pantalla dice «Tu Parrilla todavía no muestra el mesón en
el teléfono…» en vez de «No se pudo actualizar.».

### La 1.2.0 necesita un build nativo y pasar por las tiendas

Grabar pide los permisos de cámara y micrófono (`cameraPermission` y `microphonePermission` del
plugin `expo-image-picker` en `app.json`, que hasta la 1.1.0 estaban en `false`), y eso solo llega
con un binario nuevo. Como la `runtimeVersion` es la versión de la app (`appVersion`), lo que se
publique por aire para la 1.2.0 no le llega a un teléfono con la 1.1.0: ese se queda sin la
pestaña de grabar: desde el 2026-11-07 la 1.1.0 tiene La Cocina por aire, sin «Grabar video» ni
«Sacar foto» (ver «La Cocina por aire a la 1.1.0», abajo). Lo de la 1.1.0 se sigue
publicando por aire desde la rama `ota-1.1.0` (en GitHub): un commit anterior a este cambio con lo
que se le fue agregando después —la edición de lo programado (#319), las respuestas del libro de
sugerencias y «Pasar el texto» (#325, #326), la música de Instagram (#328) y La Cocina sin grabar
(#333, publicada el 2026-11-07 en los dos canales)—. La próxima actualización de la 1.1.0
sale de esa rama, con el cambio nuevo encima; sacarla de `main` no llega a ningún teléfono, y
sacarla de un commit más viejo que la punta de la rama le quita a la gente lo que ya tenía. El build y el envío los hace el dueño (ver `docs/pendientes.md`): el flujo «App a la
tienda» de GitHub, o a mano con la cuenta de Expo, `npx eas-cli build -p android --profile
production` y `npx eas-cli submit -p android --profile production`; lo mismo con `-p ios` cuando
exista la cuenta de Apple. En la Play Console, la sección de seguridad de los datos tiene que
decir que la app usa la cámara y el micrófono para lo que la persona sube, y desde el 2026-11-07 que
guarda el token de los avisos (`docs/play-store.md`). El build lleva también `expo-notifications`, y
antes de armarlo van las credenciales de FCM (ver «Los avisos al teléfono», abajo). Y deja afuera
`@react-native-community/datetimepicker`: el día y la hora se eligen desde el 2026-11-02 en la hoja de
la app (`src/components/selector-fecha.tsx`), y el módulo se había quedado en `package.json` y en los
plugins de `app.json` solo para no cambiar el binario antes de tiempo. La rama `ota-1.1.0` lo conserva:
es el binario de la 1.1.0. Y suma `expo-haptics` **sin usarlo todavía**: la vibración corta cuando algo
sale o se quema (`docs/pendientes.md`, «La propuesta de diseño 2.1») es puro JavaScript sobre el
módulo, y con él en el binario puede llegar por aire a la 1.2.0 en vez de esperar otro build. Solo
declara el permiso `VIBRATE`, que Android concede sin preguntar.

Antes del build se pasó `npx expo-doctor` (2026-11-07): faltaba `expo-asset`, que `expo-audio` pide
como dependencia nativa y sin el que la app puede caerse fuera de Expo Go, y los módulos de Expo
estaban unos parches atrás de lo que pide el SDK 57; los dos se arreglaron con `npx expo install`
(`expo-asset` y `--fix`), que además sumó los plugins sin opciones de `expo-asset` y `expo-image` a
`app.json`. El paso a paso del dueño para armarlo y subirlo, en `docs/play-store.md`, «La 1.2.0, de
punta a punta».

Lo que no se pudo probar sin un teléfono: la cámara misma, los permisos, la copia a documentos, la
cola que sigue después de cerrar la app y la subida nativa por partes. El 2026-11-06 se probó en Expo
web, contra una API falsa, lo de la cámara de frío y las comandas: elegir y cambiar el rol de cada
video, las opciones con «Para cuándo», el cuerpo que sale al mandar, «Cambiar», «Sacar de la cámara»,
«Lo que pasó», «Cancelar la comanda», y el camino corto contra un servidor de antes.

### La Cocina por aire a la 1.1.0 (publicada el 2026-11-07)

Se puede, y el código ya está hecho para eso. Lo único nativo que la pestaña necesita y la 1.1.0 no
trae es el permiso de la cámara y el del micrófono: sin ellos, Android contesta que no al pedirlos,
sin preguntar, y «Grabar video» diría «Sin permiso para la cámara». Por eso `src/lib/grabar.ts` mira
la versión del binario (`Updates.runtimeVersion`, que con `appVersion` es la de `app.json` el día del
build) y, antes de la 1.2.0, la pantalla no muestra «Grabar video» ni «Sacar foto»: queda «Elegir de
la galería», que la 1.1.0 sí trae (`expo-image-picker` con `photosPermission`). No se le puede
preguntar al sistema por el permiso: sin declararlo, Android responde lo mismo que cuando la persona
lo negó para siempre. Lo cuida `src/lib/grabar.test.ts`. Todo lo demás es JavaScript o módulos que la
1.1.0 ya tiene: `expo-file-system` (la misma versión, con `FileHandle` y `File.upload`), AsyncStorage,
`expo-image`, `expo-updates`.

Se publicó el 2026-11-07 (`3ac1c80` en `ota-1.1.0`, canales `production` y `preview`). Lo que se
copió de `main` a la rama, tal cual, por si hay que repetirlo con un cambio de La Cocina:

- `src/app/(tabs)/_layout.tsx` (la cuarta pestaña) y `src/components/iconos.tsx` (el gorro);
- `src/app/(tabs)/cocina.tsx` y `src/components/cocina.tsx`;
- `src/components/selector-fecha.tsx` («Para cuándo», solo el día);
- `src/lib/cocina.ts`, `src/lib/grabar.ts`, `src/lib/subir-por-partes.ts`, `src/lib/archivo-local.ts` y
  `src/lib/archivo-local.web.ts`, con sus tests (`cocina.test.ts`, `grabar.test.ts`,
  `subir-por-partes.test.ts`);
- `src/lib/session.ts` (cerrar sesión borra la cola de La Cocina) y `src/lib/tema.ts` (las palabras de
  la cámara de frío y el mesón).

**No** se tocan `app.json` —ni la versión, que tiene que seguir en 1.1.0 para que la actualización le
llegue a esos teléfonos, ni los permisos, que no llegan por aire— ni `package.json`: la rama no
necesita `expo-clipboard` para esto. Se probó el 2026-11-06 en una copia de la rama con esos archivos:
`tsc`, los tests y `npx expo export --platform android` pasan. Y se publica después de que el
servidor de esta rama esté en producción, aunque la app aguanta el orden contrario (ver «Las opciones
viajan desde el servidor», arriba). En Expo web, contra una API
falsa, sí se probó el resto: elegir de la galería, subir en dos partes con su avance, la frase de
la cuota, mandar la comanda con la instrucción y la cocina apagada.

### Las historias por aire a la 1.1.0 (publicadas el 2026-11-07)

No piden nada nativo, así que se copian tal cual, sobre la punta de `ota-1.1.0`, de `main` con la
rama de las historias fusionada (archivos de `mobile/`):

- `src/app/(tabs)/publicar.tsx` y `src/app/programado/[id].tsx`;
- `src/components/visor-historias.tsx`;
- `src/lib/historias.ts` (con `historias.test.ts`), `src/lib/publicar.ts`, `src/lib/borradores.ts`
  (con `borradores.test.ts`), `src/lib/editar.ts` y `src/lib/tipos.ts`.

El 2026-11-07 esos archivos eran iguales en `main` y en `ota-1.1.0` antes de este cambio
(`publicar.tsx` ya traía ahí la música de #328), así que copiarlos no pisa nada de la rama. **No**
se tocan `app.json` ni `package.json`. Y se publica **después** de que el servidor de esta rama esté
en producción: con un servidor de antes, una sola historia sale bien, pero una secuencia se
rechaza («Una historia es un solo archivo, foto o video.») y el borrador no recuerda el modo.
Salieron el 2026-11-07 junto con La Mesa, en el commit `9968a71` de `ota-1.1.0`, a los dos canales,
con el servidor ya en producción.

### TikTok y la palabra clave por aire a la 1.1.0 (publicados el 2026-11-07)

No piden nada nativo ni permisos nuevos. Para publicarlos, sobre la punta de `ota-1.1.0`, se copian
de `main` (con esta rama fusionada) estos archivos de `mobile/`, tal cual:

- `src/components/tiktok-opciones.tsx`, `src/components/regla-clave.tsx`, `src/lib/tiktok.ts` y
  `src/lib/regla.ts`, con sus tests (`tiktok.test.ts`, `regla.test.ts`) (nuevos);
- `src/app/(tabs)/publicar.tsx`;
- `src/lib/api.ts` (el encabezado `X-Parrilla-Publicar`), `src/lib/borradores.ts` (con
  `borradores.test.ts`), `src/lib/publicar.ts` (solo un comentario) y `src/lib/tipos.ts`.

El 2026-11-07 esos archivos eran iguales en `main` y en `ota-1.1.0` antes de este cambio: lo único
de `mobile/src` que difiere entre las dos es lo de la 1.2.0 —los avisos (`avisos.ts`,
`components/avisos.tsx`, `ajustes.tsx`, `sesion.tsx`), `(tabs)/_layout.tsx` y `(tabs)/cocina.tsx`—,
y ninguno está en la lista, así que copiarlos no le lleva a la 1.1.0 nada de la 1.2.0. Si antes
entra a `main` otro cambio a uno de estos archivos que no vaya a la 1.1.0 (por ejemplo, algo que use
`expo-video` o `react-native-svg`, que la 1.1.0 no trae), hay que copiar solo la parte de TikTok y la
palabra clave. **No** se tocan `app.json` ni `package.json`.

Se publica **después** de que el servidor de esta rama esté en producción. Al revés no se rompe
nada, pero tampoco aparece: un servidor de antes no lee el encabezado, no ofrece TikTok ni manda la
regla del borrador, y al guardar ignora la regla que manda la app. Salió el 2026-11-07, con el
servidor ya en producción, en el commit `b7e45a2` de `ota-1.1.0`, a los dos canales.

Lo que se probó el 2026-11-07 en Expo web contra una API falsa: el bloque con los datos de
`creator_info`, las privacidades que permite, «Dúos» gris por bloqueado, la marca con «Contenido
patrocinado» y su aviso, el consentimiento con los dos enlaces, la palabra clave abierta, y el
borrador que sale con `X-Parrilla-Publicar`, las opciones de TikTok a medias y la regla. Lo que no:
un teléfono de verdad (el `Switch` de Android) y TikTok real (lo cubren las pruebas del servidor).

### Las opciones de YouTube por aire a la 1.1.0 (publicadas el 2026-11-08)

El bloque «YouTube · <canal>» de Publicar —«Quién lo ve», «Hecho con IA» y «Agregar a una
playlist»— es puro JavaScript sobre lo que la 1.1.0 ya trae (`Switch`, los `Chip` de
`components/ui.tsx`, `apiGet`): no pide módulos ni permisos nuevos. Para publicarlo, sobre la punta
de `ota-1.1.0`, se copian de `main` (con esta rama fusionada) estos archivos de `mobile/`, tal cual:

- `src/components/youtube-opciones.tsx`, `src/lib/youtube.ts` y `src/lib/youtube.test.ts` (nuevos);
- `src/app/(tabs)/publicar.tsx`;
- `src/components/tiktok-opciones.tsx` (solo exporta `Interruptor`, que el bloque de YouTube usa);
- `src/lib/api.ts` (`youtube` en `X-Parrilla-Publicar`), `src/lib/borradores.ts` (con
  `borradores.test.ts`) y `src/lib/tipos.ts`.

El 2026-11-08 esos archivos eran iguales en `main` y en `ota-1.1.0` antes de este cambio
(`git diff origin/ota-1.1.0 origin/main` sobre ellos no da nada), así que copiarlos no le lleva a
la 1.1.0 nada de la 1.2.0. Si antes entra a `main` otro cambio a uno de ellos que no vaya a la
1.1.0, hay que copiar solo la parte de YouTube. **No** se tocan `app.json` ni `package.json`.

Se publica **después** de que el servidor de esta rama esté en producción. Con un servidor de antes
el bloque se ve, pero la lista de playlists contesta 404 («YouTube no respondió con tus
playlists…») y el servidor rechaza al programar las opciones de YouTube con «Las opciones de la red
no se entendieron.». Al revés no pasa nada: una app sin el bloque no manda `youtube` en el
encabezado, y el servidor programa un borrador con las opciones de YouTube que dejó el panel. Lo
probado: `tsc`, los tests y el lint de la app, y los del sitio; no se probó en un teléfono ni en
Expo web.
Salieron el 2026-11-08, con el servidor ya en producción, en el commit `1200f3a` de `ota-1.1.0`, a
los dos canales.

### El portapapeles, con y sin su módulo nativo

«Copiar el texto», en la tarjeta de lo que espera en la bandeja de TikTok, usa `expo-clipboard`,
que es un módulo nativo: está en `package.json` desde la 1.2.0 y entra con el próximo build, pero
no llega por aire a un binario que no lo trae. Por eso `src/lib/portapapeles.ts` no importa
`expo-clipboard` —su JavaScript lanza al cargarse si el nativo no está, y la app se caería al
abrir—: le pide el nativo por su nombre (`requireOptionalNativeModule('ExpoClipboard')`, de
`expo`), que sin él devuelve null. Sin el nativo, el botón dice «Pasar el texto…» y abre la lista
de compartir del sistema (`Share`, de React Native), que en Android 10 en adelante y en iOS trae
«Copiar», pero no en todos los teléfonos: por eso no promete copiar. El mismo archivo sirve tal
cual en la rama `ota-1.1.0`, que no tiene `expo-clipboard` en `package.json`: ahí siempre es la
lista de compartir.

### El corte en SVG, solo desde la 1.2.0

Desde el build 1.2.0 la app trae `react-native-svg`, y el corte de cada post (`src/components/pieza.tsx`)
se dibuja con las curvas del panel: las siluetas, las motas del chori y dónde cae cada marca están
copiadas en `src/lib/corte.ts`, y un test de la raíz (`src/components/corte.test.ts`) las compara con
las de `src/components/corte.tsx`. Antes la app armaba cada silueta con vistas de bordes redondeados y
la entraña de un video quedaba como una barra larga, casi el chori. Los difuminados del panel
(`feGaussianBlur`) se fingen con opacidad, y lo único que late es el halo de lo quemado.

A diferencia del portapapeles, del audio y de los avisos, **acá no hay camino sin el módulo**: el
dibujo entero es SVG. Así que, desde ahora, **`pieza.tsx` no se copia a la rama `ota-1.1.0`** —en un
binario sin `react-native-svg`, La Parrilla se caería al abrir— ni nada que importe `react-native-svg`.
La rama se queda con su `pieza.tsx` de vistas, y `src/lib/corte.ts` no le hace falta. Lo que se copie a
esa rama de acá en adelante, mirarlo con `grep react-native-svg` antes.

La pieza de sushi del día (`src/components/pieza-sushi.tsx`) sigue con vistas: pasarla a SVG es puro
JavaScript sobre el build 1.2.0 (ver `docs/pendientes.md`).

## Los avisos al teléfono

Desde la 1.2.0 (2026-11-07), la app avisa en el teléfono lo mismo que el correo: lo que se quemó, una
cuenta que se enfría o se apaga, una pregunta del chef, una comanda que terminó y la respuesta del
equipo en el libro de sugerencias; y, sin correo, un resumen de los comentarios nuevos de La Mesa, uno
por hora como mucho, y lo bueno de «Lo que trajo» —un hito, o lo que trajo el día—, uno al día como
mucho. Los manda el servidor (`src/lib/push/` en la raíz; ver «Avisos al teléfono» en el
`README.md` de la raíz). Acá, `src/lib/avisos.ts` y `src/components/avisos.tsx`:

- **Cuándo pregunta.** No al abrir: unos ocho segundos después de entrar, la primera vez, con la
  ventana de la app «¿Te avisamos al teléfono?», «Ahora no» y «Avisarme». Recién con «Avisarme» se
  pide el permiso del sistema —en Android 13 en adelante, `POST_NOTIFICATIONS`, que declara el propio
  `expo-notifications`—. Antes se crea el canal de Android `avisos`: sin un canal, Android 13 no
  pregunta, y un aviso a un canal que no existe no se muestra. «Ahora no», o un permiso negado, no
  vuelve a preguntar: quedan en Ajustes → «Los avisos». La respuesta se guarda en el teléfono
  (`avisos-telefono` en AsyncStorage), y cerrar sesión la borra, para que quien entre después elija.
- **El token.** Con el permiso, `getExpoPushTokenAsync` (con el `projectId` de EAS) da el token de
  Expo, que va a `POST /api/mobile/push`. Se vuelve a mandar cada vez que la app abre con los avisos
  encendidos, porque Expo lo puede cambiar. «Apagar los avisos» y «Cerrar sesión» lo borran con
  `DELETE /api/mobile/push/{token}`; si al salir no hay señal, queda anotado en el almacén seguro y se
  borra al abrir la app la vez siguiente. El servidor, además, deja de mandarle a un token cuya sesión
  se revocó (`MOBILE_TOKEN_VERSION`, «Si se pierde el teléfono»).
- **Tocar un aviso** abre su pantalla (`rutaDelAviso`): el fierro y la respuesta del equipo, Ajustes;
  la pregunta del chef y la comanda, «Tus comandas» de La Cocina (`/cocina?vista=comandas`); los
  comentarios, La Mesa (`/mesa`); un hito, el detalle de su corte (`/corte/[id]`, con el `id` del
  aviso); lo quemado y lo que trajo el día, La Parrilla. También si el aviso abrió la app cerrada
  (`getLastNotificationResponse`). Con la app abierta, el aviso se muestra igual, arriba.

- **«Avisos de lo bueno»**, en Ajustes, debajo de «Los avisos» cuando están encendidos: se apagan
  aparte, y son de la cuenta, no del teléfono (`GET`/`PUT /api/mobile/push/bueno`, en
  `leerLoBueno` y `guardarLoBueno`). Sin señal, o con un sitio de antes, se ve el texto sin el botón.

**Con y sin el módulo nativo**, como el portapapeles y el audio: `expo-notifications` es nativo y
entra con el build 1.2.0; un binario que no lo trae revienta al cargarlo, porque pide sus módulos
nativos con `requireNativeModule` apenas se importa. Por eso `src/lib/avisos.ts` no lo importa:
pregunta por `ExpoPushTokenManager` y `ExpoNotificationPermissionsModule` con
`requireOptionalNativeModule` y solo entonces lo carga con un `require`. Sin el módulo, la app no
pregunta nada y Ajustes dice que los avisos llegan con la versión nueva. Lo cuida
`src/lib/avisos.test.ts`. La rama `ota-1.1.0` no lleva esto; si algún día se porta, el archivo sirve
tal cual, con `expo-notifications` en su `package.json` (solo el JavaScript) y **sin** tocar su
`app.json`.

**Lo que pide el build.** `app.json` trae el plugin de `expo-notifications` con el ícono de la
notificación (la silueta blanca de `android-icon-monochrome.png`) y el color de la brasa. En Android,
los avisos salen por Firebase Cloud Messaging, que pide dos cosas antes del build: el
`google-services.json` en esta carpeta, nombrado en `app.json` (`android.googleServicesFile`), y la
clave de la cuenta de servicio de FCM subida a EAS. Las hace el dueño; los pasos, en
`docs/pendientes.md`. Sin ellas el build sale igual, pero «Avisarme» dice «No se pudieron encender los
avisos…». En iPhone, el build de iOS crea la llave de push de Apple.

Lo que no se pudo probar: sin un build nativo no se recibe un aviso de verdad, ni se ve la pregunta
del sistema. Los tests cubren que sin el módulo no se carga nada, adónde lleva cada aviso y que el
token se borra al apagar y al salir; el servidor, contra una Postgres de verdad, con Expo de mentira.

## La Mesa desde el teléfono

Desde el 2026-11-07. No es una pestaña: cinco no caben cómodas en la barra, y una tarjeta con el
número en la entrada avisa sin pedir un toque. Es una pantalla de la pila, como «Tus publicaciones», que se
abre con la tarjeta «La Mesa» de La Parrilla (`AccesoALaMesa`, en `src/components/mesa.tsx`); la
tarjeta dice cuántos esperan respuesta, con `GET /api/mobile/comentarios/pendientes`.

La pantalla (`src/app/mesa.tsx`) trae lo esencial de La Mesa del panel: «Pendientes», «Enviados» y
«Automáticas», el filtro por red, y en cada comentario el borrador editable, «Enviar», «Descartar»
y el botón para pedir otro borrador, con las preguntas del panel antes de descartar y antes de
pisar lo corregido a mano. Las instrucciones para el modelo, «Regenerar todos», «Descartados»,
«Todos» y la fila de emojis se quedan en el panel: lo primero es para una sentada frente al
computador, y el teclado del teléfono ya trae emojis. Las rutas y lo que responden, en el
`README.md` de la raíz, «Responder comentarios»: son las funciones del panel, con el dueño del
token, así que las reglas y las frases son las mismas. Lo que la app copia del panel —cuántos
esperan, la cola vacía y «hace 3 horas»— está en `src/lib/mesa.ts`, y un test de la raíz lo
compara con el panel (`telefono-copias.test.ts`). «Hace cuánto» está escrito a mano, no con
`Intl.RelativeTimeFormat`, que Hermes no trae completo.

Un comentario que llega con el texto vacío (la investigación de Instagram en `docs/pendientes.md`)
dice «(sin texto)»; la pantalla no hace nada más con él.

Desde el 2026-11-07, si el servidor manda `faltantes`, La Mesa muestra arriba de la cola el aviso del
panel «Comentarios que Instagram no entrega» (`AvisoDeFaltantes`, en `src/components/mesa.tsx`). La
frase de cada publicación llega escrita del servidor; el título y el pie son copias en `src/lib/mesa.ts`
que vigila `telefono-copias.test.ts`. Un servidor de antes no manda el campo y el aviso no aparece. No
pide nada nativo: llega por aire a la 1.1.0 copiando `src/app/mesa.tsx`, `src/components/mesa.tsx` y
`src/lib/mesa.ts` sobre la punta de `ota-1.1.0` (si allá son iguales a los de `main` antes de este
cambio; si no, solo la parte del aviso). Salió el 2026-11-07 con TikTok y la palabra clave, en el
commit `b7e45a2` de `ota-1.1.0`, a los dos canales.

**Contra un servidor de antes**, que no tiene estas rutas, la API contesta `404` sin frase:
`useScreenData` lo avisa (`sinRuta`), y La Mesa dice «Tu Parrilla todavía no responde comentarios
desde el teléfono. Mientras, respóndelos en La Mesa del panel web.» en vez de «No se pudo
actualizar.»; la tarjeta de La Parrilla se queda con el subtítulo, sin número. Así da lo mismo qué
sale primero, la web o la actualización por aire.

### La Mesa por aire a la 1.1.0 (publicada el 2026-11-07)

No pide nada nativo: `TextInput`, `Linking`, `KeyboardAvoidingView` y `Modal` son de React Native,
y `expo-image`, `expo-router` y `react-native-safe-area-context` ya están en la 1.1.0. Ni permisos
nuevos. Para publicarla, sobre la punta de `ota-1.1.0`, se copian de `main` (con esta rama
fusionada) estos archivos de `mobile/`, tal cual:

- `src/app/mesa.tsx`, `src/components/mesa.tsx`, `src/lib/mesa.ts` y su test, `src/lib/mesa.test.ts`
  (nuevos);
- `src/app/_layout.tsx` (la pantalla «La Mesa» en la pila, detrás de la sesión);
- `src/app/(tabs)/index.tsx` (la tarjeta en La Parrilla);
- `src/lib/useScreenData.ts` (`sinRuta`).

El 2026-11-07, `mobile/src` de `ota-1.1.0` era igual al de `main`, así que los siete caen sin
choques. Si antes entra a `main` otro cambio a `_layout.tsx` o a `(tabs)/index.tsx` que no vaya a la
1.1.0, hay que copiar solo la parte de La Mesa. **No** se tocan `app.json` ni `package.json`. Se
publica después de que el servidor esté en producción, aunque la app aguanta el orden contrario.
Salió el 2026-11-07 junto con las historias, en el commit `9968a71` de `ota-1.1.0`, a los dos canales.

Lo que se probó el 2026-11-07, en Expo web contra una API falsa: la tarjeta con el número, los tres
filtros y el de red, «(sin texto)», «Alguien», el borrador que falló y la automática que falló,
«Enviar» con sus errores («Escribe una respuesta.», «Esa cuenta ya no está conectada.»), pedir otro
borrador sobre lo corregido, «Descartar» con su pregunta, el número que baja al enviar, y el mensaje
contra un servidor sin La Mesa. Lo que no: un teléfono de verdad (el teclado encima del cuadro) y
el servidor real contra la red (lo cubren las pruebas del panel y las de aislamiento).

## El modo día

La app tiene los dos modos del panel: la noche de entrada y el día con sushi. Es el modo de la
cuenta (`/api/mobile/tema`): se cambia en Ajustes, con «Modo día» o «Modo noche», o en la barra
del panel web, y vale en los dos. El teléfono guarda una copia para abrir en el modo de la última
vez sin esperar a la red, vuelve a preguntarle a la cuenta cada vez que la app pasa al frente, y
un cambio hecho sin señal se manda cuando vuelve la conexión (`src/components/tema.tsx`).

De día también cambian unas palabras, como en el panel: La Parrilla es La Barra, Los Fierros son
Los Cuchillos —el fierro de una cuenta se desafila en vez de enfriarse—, los cortes son piezas y
el botón de Ajustes lleva dos palillos. Salen de `src/lib/tema.ts`, que copia las del panel
(`src/lib/vocabulario.ts` en la raíz) y que un test del panel compara.

Para quien agregue una pantalla: los colores salen de `useColores()` (`src/components/tema.tsx`),
nunca escritos a mano, y lo que sombrea con transparencia usa el velo del modo
(`colores.velo + '10'`), blanco de noche y tinta de día. Las dos paletas viven en
`src/components/colores.ts`, y un test del panel las compara con las suyas. Los dibujos de cada
post también son dos, el corte de carne (`src/components/pieza.tsx`, en SVG desde la 1.2.0) y la
pieza de sushi (`src/components/pieza-sushi.tsx`, con vistas), y `Pieza` elige según el modo.

Lo único que dibuja el teléfono mismo es la pantalla de arranque, y sigue oscura en los dos
modos: cambiarla pide un build nativo (ver `docs/deuda-tecnica.md`). Las preguntas
(`src/components/ventana.tsx`, con `useVentanas()`) y el selector de día y hora
(`src/components/selector-fecha.tsx`) son de la app, con sus colores: nada de `Alert.alert` ni de
los selectores del sistema, que no siguen el modo y llegan solo con un build nuevo.

## iPhone (iOS)

**El código ya está listo para iOS; falta todo lo que pide Apple.** Lo que se hizo
(2026-10-16):

- `app.json` tiene la sección `ios`: el identificador `cl.tuparrilla.app`, solo
  iPhone (`supportsTablet: false`), sin cifrado propio que declarar
  (`ITSAppUsesNonExemptEncryption: false`), conexiones solo por HTTPS salvo la red local
  de desarrollo, y su propio ícono, `assets/images/icon-ios.png`: el mismo de Android pero
  cuadrado y sin transparencia, porque iOS le pone las esquinas solo y el App Store
  rechaza un ícono con canal alfa.
- Los permisos que iOS exige escribir: el de Face ID (`expo-local-authentication`; sin
  ese texto, la app se cerraría al pedir la cara), el de las fotos y, desde la 1.2.0, los de
  la cámara y el micrófono, que La Cocina usa para grabar lo que se le manda al chef. Hasta la
  1.1.0 quedaban fuera porque la app no grababa, y Apple rechaza permisos que no se usan.
- Lo que en el código era solo de Android: el teclado empuja la pantalla con `padding`, que es lo que
  corresponde en iOS; la cabecera mide 44 puntos; las fotos llegan en JPEG y no en HEIC
  (Instagram y Facebook rechazan HEIC), y no se pide acceso a la galería entera.
- `npx expo export --platform ios` arma el paquete de iOS sin errores. Ninguna de estas
  pantallas se ha visto todavía en un iPhone de verdad.

**Lo que falta, y por qué no se hizo:**

1. **Una cuenta del Apple Developer Program** (USD 99 al año). Lo ordenado es sacarla a
   nombre de Pyxis SpA, que pide el número D-U-N-S de la empresa; a nombre de una persona
   sale más rápido. Ver «Que todo quede a nombre de Pyxis» en `docs/pendientes.md`.
2. **Confirmar el identificador** antes del primer build: `cl.tuparrilla.app` queda
   registrado en Apple para siempre. Android usa el mismo desde el primer build de la Play
   Store (2026-10-16); el APK de prueba de antes tenía `cl.vicentepareja.numeros`.
3. **La ficha en App Store Connect** (nombre, privacidad, capturas) y la primera subida a
   TestFlight:

   ```bash
   npx eas-cli build -p ios --profile production   # pide entrar con la cuenta de Apple; crea los certificados
   npx eas-cli submit -p ios --profile production  # sube el build a App Store Connect / TestFlight
   ```

   Sin cuenta de Apple sí se puede armar un build para el simulador de un Mac:
   `npx eas-cli build -p ios --profile simulador`.
4. **Las actualizaciones por aire valen igual** una vez que haya un build de iOS: los
   comandos de «Cómo mandar un cambio sin reinstalar», sin `--platform`, publican para
   las dos plataformas. El build de TestFlight y del App Store escucha el canal
   `production`; uno armado con el perfil `preview` o `simulador`, el canal `preview`.

## Si se pierde el teléfono

Para revocar el acceso de un teléfono perdido o robado, sin tener que hacer nada
más:

1. Entra al proyecto en Vercel.
2. Sube en 1 la variable de entorno `MOBILE_TOKEN_VERSION` (por defecto vale `1`;
   súbela a `2`).
3. Eso invalida de inmediato todas las sesiones de la app ya abiertas en
   cualquier teléfono — van a pedir el correo y el código de nuevo la próxima vez
   que se abran. También corta los avisos al teléfono: el servidor deja de mandarlos a
   los teléfonos que se registraron con la sesión anterior.

Este paso **no afecta** las conexiones con Instagram, Facebook o YouTube: no hace
falta volver a autorizar nada de eso, solo se cierra el acceso desde el celular.

## Qué no hace todavía

- No pone portada ni atributos, y de lo ya programado no cambia los archivos, ni suma
  cuentas, ni toca lo que ya salió en alguna, ni cambia las opciones de TikTok o la palabra
  clave: eso sigue en el panel. Tampoco cambia el orden de
  una secuencia de historias ya programada, ni reproduce un video en el visor.
- En La Cocina no elige el color de acento de la marca ni dibuja la estación de cada comanda, y no
  sigue subiendo con la app en segundo plano: lo primero es del panel, y lo último retoma al volver a
  abrir La Cocina. El mesón llega con la 1.2.0; en la 1.1.0, sigue en el panel.
- En La Mesa no cambia las instrucciones para el modelo, no regenera todos los borradores, no muestra
  los descartados ni «Todos» y no trae la fila de emojis: eso sigue en el panel.
- No hay versión para iPhone que se pueda instalar: el código está listo, falta la
  cuenta de Apple (ver «iPhone (iOS)», arriba).
