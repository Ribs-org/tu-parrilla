# Tu Parrilla, la app del teléfono

Esta es la app del teléfono de Tu Parrilla. En el teléfono se llama **Tu Parrilla**, con el
bife sobre la reja de ícono, desde el build de la Play Store (2026-10-16); el APK de prueba
de antes se llama «Vicente · Números» y tiene otro identificador, así que las dos pueden
convivir instaladas hasta que se borre el APK. Desde el 2026-10-16 tiene las mismas tres
pestañas que el panel web, en versión corta: **La Parrilla** (lo programado día por
día, lo que se quemó, los borradores y cuántos cortes salieron ayer), **Publicar** al
medio (eliges fotos o un video de la galería, escribes el texto, marcas las cuentas y lo
programas, o lo mandas a salir ahora) y **Los Números** (las dos mitades del tablero, con «Tus
publicaciones» un toque adentro y los seguidores de cada red detrás de «⋯ Más»). Arriba a
la derecha de las tres, el engranaje de **Ajustes**: tus cuentas con la temperatura de su
fierro (`/api/mobile/fierros`), con un punto en el engranaje si alguna se enfría o se apagó,
y «Cerrar sesión». Antes eran cinco con nombres propios: Resumen, Contenido, Publicar, Cuentas y
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
usa ese candado para protegerse cada vez que se abre — no hay que volver a pedir un
código.

Hasta la versión del 2026-10-15 se entraba con una contraseña del despliegue
(`ADMIN_PASSWORD`). Ya no existe: una app que todavía la pida es una instalación sin
actualizar, y se pone al día sola al abrirla dos veces con señal. La sesión que ya
tenía abierta sigue valiendo mientras tanto.

Para salir: el engranaje → **Cerrar sesión**. Borra la sesión de este teléfono y nada más;
para cortar todos los teléfonos a la vez, «Si se pierde el teléfono», abajo.

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
punteado. **Programar** sale del borrador y el servidor lo borra al crear el post;
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

Lo que no se puede hacer desde el teléfono, y sigue siendo del panel web: poner una
portada, etiquetar con atributos, programar en TikTok o con una palabra clave, y editar o
borrar lo ya programado.

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
  ese texto, la app se cerraría al pedir la cara) y el de las fotos. Cámara y micrófono
  quedan fuera: la app no los usa, y Apple rechaza permisos que no se usan.
- Lo que en el código era solo de Android: el día y la hora se eligen en una hoja con
  el selector del sistema (`src/components/selector-fecha.tsx`) en vez de los dos
  diálogos de Android; el teclado empuja la pantalla con `padding`, que es lo que
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
   que se abran.

Este paso **no afecta** las conexiones con Instagram, Facebook o YouTube: no hace
falta volver a autorizar nada de eso, solo se cierra el acceso desde el celular.

## Qué no hace todavía

- No pone portada ni atributos, y no edita lo ya programado: eso sigue en el panel.
- No manda notificaciones (no avisa solo cuando hay un dato nuevo).
- No hay versión para iPhone que se pueda instalar: el código está listo, falta la
  cuenta de Apple (ver «iPhone (iOS)», arriba).
