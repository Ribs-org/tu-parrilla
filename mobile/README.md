# Tu Parrilla, la app del teléfono

Esta es la app del teléfono de Tu Parrilla. En el teléfono se llama **Tu Parrilla**, con el
bife sobre la reja de ícono, desde el build de la Play Store (2026-10-16); el APK de prueba
de antes se llama «Vicente · Números» y tiene otro identificador, así que las dos pueden
convivir instaladas hasta que se borre el APK. Desde el 2026-10-16 tiene las pestañas del
panel web, en versión corta: **La Parrilla** (lo programado día por
día —con un filtro por red, lo que ya salió hundido en un renglón y, hoy, la línea de
«ahora»—, lo que se quemó, los borradores y cuántos cortes salieron ayer), **Publicar**
(eliges fotos o un video de la galería, escribes el texto, marcas las cuentas y lo
programas, o lo mandas a salir ahora), **Los Números** (las dos mitades del tablero, con «Tus
publicaciones» un toque adentro y los seguidores de cada red detrás de «⋯ Más») y, desde la versión
1.2.0 (2026-11-02), **La Cocina** (grabar un video o sacar una foto con la cámara del teléfono,
ordenar la cámara de frío y pedirle una comanda al chef de la casa con las opciones del panel; ver
«La Cocina desde el teléfono», más abajo).
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

## Cómo publicar desde el teléfono

En la pestaña **Publicar**:

1. Escribe el texto. En YouTube, el primer renglón es el título del video.
2. Toca **Fotos o video** y elige de la galería (hasta diez archivos; un video de
   hasta 500 MB).
3. Marca las cuentas a las que sale (el chip lleva la red y el handle, para distinguir
   dos cuentas de una misma red). Si tienes una sola cuenta conectada viene marcada,
   porque no hay entre qué elegir; con dos o más, ninguna. TikTok no se ofrece todavía
   como destino desde el teléfono: el bloque de TikTok necesita consultar la cuenta del
   creador (`creator_info`) y sus interacciones, y eso el teléfono todavía no lo tiene.
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
5. Toca **Cuándo** para elegir día y hora, y luego **Programar**. O toca
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

- El teléfono no ve las opciones de TikTok ni la respuesta automática por palabra clave.
  Al guardar, el servidor las conserva tal como las dejó el panel, y un borrador que las
  tiene no se programa desde el teléfono —sale un aviso y los botones se apagan—, porque
  programarlo dejaría eso fuera y el borrador, que lo guardaba, se borraría.
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
portada, etiquetar con atributos y programar en TikTok o con una palabra clave.

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
  a paso, la hora estimada, cuántos creativos esperan en el mesón y **Cancelar la comanda** mientras
  no esté en el horno.

La línea de arriba dice cómo atiende la cocina —sola, a mano o cerrada— con la frase que manda el
servidor. El mesón (programar o descartar lo que entregó el chef) sigue en el panel: ver
`docs/pendientes.md`. La estación dibujada de cada comanda también: el teléfono dice lo mismo con el
estado y las cinco rayas del recorrido, sin `react-native-svg`.

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

### La 1.2.0 necesita un build nativo y pasar por las tiendas

Grabar pide los permisos de cámara y micrófono (`cameraPermission` y `microphonePermission` del
plugin `expo-image-picker` en `app.json`, que hasta la 1.1.0 estaban en `false`), y eso solo llega
con un binario nuevo. Como la `runtimeVersion` es la versión de la app (`appVersion`), lo que se
publique por aire para la 1.2.0 no le llega a un teléfono con la 1.1.0: ese se queda sin la
pestaña hasta instalar el binario nuevo, o hasta que se le publique desde `ota-1.1.0` La Cocina sin
grabar, que ya está preparada (ver «La Cocina por aire a la 1.1.0», abajo). Lo de la 1.1.0 se sigue
publicando por aire desde la rama `ota-1.1.0` (en GitHub): un commit anterior a este cambio con lo
que se le fue agregando después —la edición de lo programado (#319), las respuestas del libro de
sugerencias y «Pasar el texto» (#325, #326) y la música de Instagram (#328)—. La próxima actualización de la 1.1.0
sale de esa rama, con el cambio nuevo encima; sacarla de `main` no llega a ningún teléfono, y
sacarla de un commit más viejo que la punta de la rama le quita a la gente lo que ya tenía. El build y el envío los hace el dueño (ver `docs/pendientes.md`): el flujo «App a la
tienda» de GitHub, o a mano con la cuenta de Expo, `npx eas-cli build -p android --profile
production` y `npx eas-cli submit -p android --profile production`; lo mismo con `-p ios` cuando
exista la cuenta de Apple. En la Play Console, la sección de seguridad de los datos tiene que
decir que la app usa la cámara y el micrófono para lo que la persona sube, y desde el 2026-11-07 que
guarda el token de los avisos (`docs/play-store.md`). El build lleva también `expo-notifications`, y
antes de armarlo van las credenciales de FCM (ver «Los avisos al teléfono», abajo).

Lo que no se pudo probar sin un teléfono: la cámara misma, los permisos, la copia a documentos, la
cola que sigue después de cerrar la app y la subida nativa por partes. El 2026-11-06 se probó en Expo
web, contra una API falsa, lo de la cámara de frío y las comandas: elegir y cambiar el rol de cada
video, las opciones con «Para cuándo», el cuerpo que sale al mandar, «Cambiar», «Sacar de la cámara»,
«Lo que pasó», «Cancelar la comanda», y el camino corto contra un servidor de antes.

### La Cocina por aire a la 1.1.0 (preparada el 2026-11-06, sin publicar)

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

Para publicarla, sobre la punta de `ota-1.1.0`, se copian de `main` (con esta rama fusionada) estos
archivos de `mobile/`, tal cual:

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
viajan desde el servidor», arriba). Publicarla es decisión del dueño: está en `docs/pendientes.md`. En Expo web, contra una API
falsa, sí se probó el resto: elegir de la galería, subir en dos partes con su avance, la frase de
la cuota, mandar la comanda con la instrucción y la cocina apagada.

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

## Los avisos al teléfono

Desde la 1.2.0 (2026-11-07), la app avisa en el teléfono lo mismo que el correo: lo que se quemó, una
cuenta que se enfría o se apaga, una pregunta del chef, una comanda que terminó y la respuesta del
equipo en el libro de sugerencias; y, sin correo, un resumen de los comentarios nuevos de La Mesa, uno
por hora como mucho. Los manda el servidor (`src/lib/push/` en la raíz; ver «Avisos al teléfono» en el
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
  la pregunta del chef y la comanda, «Tus comandas» de La Cocina (`/cocina?vista=comandas`); lo
  quemado y los comentarios, La Parrilla. También si el aviso abrió la app cerrada
  (`getLastNotificationResponse`). Con la app abierta, el aviso se muestra igual, arriba.

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
post también son dos, el corte de carne (`src/components/pieza.tsx`) y la pieza de sushi
(`src/components/pieza-sushi.tsx`), y `Pieza` elige según el modo.

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
  cuentas, ni toca lo que ya salió en alguna: eso sigue en el panel.
- En La Cocina no muestra el mesón (ver `docs/pendientes.md`), no elige el color de acento de la
  marca ni dibuja la estación de cada comanda, y no sigue subiendo con la app en segundo plano: lo
  primero es del panel, y lo último retoma al volver a abrir La Cocina.
- No muestra La Mesa: el aviso de comentarios nuevos abre La Parrilla (ver `docs/pendientes.md`).
- No hay versión para iPhone que se pueda instalar: el código está listo, falta la
  cuenta de Apple (ver «iPhone (iOS)», arriba).
