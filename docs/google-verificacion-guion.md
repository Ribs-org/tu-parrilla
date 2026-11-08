# Google y YouTube: qué preparar, qué grabar y qué escribir

Fecha: 2026-09-30; revisado contra el código el 2026-10-06. Son **dos trámites** en Google Cloud y **uno** en YouTube, y conviene
hacerlos en paralelo porque cada uno tarda semanas:

1. **Verificación del OAuth: aprobada el 2026-10-14**, para `youtube.upload` y
   `youtube.force-ssl` (correo de Google a pyxis.latam@gmail.com). Hasta entonces el
   proyecto estaba *In production* sin verificar: se conectaba pasando por el cartel «Google
   no ha verificado esta app», con un tope de 100 usuarios en toda la vida del proyecto. La
   marca quedó verificada el 2026-10-12, y la pantalla de Google muestra «Tu Parrilla» con
   su logo. **La aprobación no se hereda:** un permiso nuevo, o cualquier cambio en la
   configuración de la pantalla de consentimiento (nombre, logo, dominios, enlaces,
   permisos), pide una verificación nueva antes de usarse.
2. **Auditoría y extensión de cuota de la YouTube Data API.** Sin ella: 10.000 unidades al
   día para todos los usuarios juntos, más un cupo aparte de 100 subidas al día (desde el
   1 de junio de 2026 `videos.insert` cuenta en su propio cupo; antes costaba 1.600
   unidades del general). Según la documentación, además, **los videos subidos quedan
   privados** aunque el usuario pida público. A este proyecto no se le aplica: lo que subió
   Tu Parrilla el 2026-10-09 (en la grabación) y el 2026-10-16 (un Short, visto desde afuera
   sin sesión: `isPrivate: false`) salió público, y por eso Los Fierros ya no lleva el aviso.
   Si un día un video sale «Privado» con candado, es esa regla: vuelve el aviso
   (`AVISO_ANTES_DE_CONECTAR` en `src/lib/networks.ts`).
3. El proyecto ya usa `youtube.upload` y `youtube.force-ssl` (`SCOPES.youtube` en
   `src/app/api/social/[network]/connect/route.ts`); son *sensibles*, no *restringidos*: no
   hay auditoría de seguridad externa (CASA).

Formato igual al de los otros guiones: qué dejar listo, el texto que se pega, las escenas
con su subtítulo, y lo que suele fallar. El paso a paso para hacerlo con las manos —en el
orden de las pantallas, con los textos listos para pegar— vive en la carpeta «YouTube -
Verification» del escritorio de Vicente, como los de Meta y TikTok.

Google reordenó la consola en 2025: lo que antes era «Pantalla de consentimiento de OAuth»
ahora es **Google Auth Platform**, con las secciones *Branding* (marca), *Audience*
(estado de publicación y tope de usuarios), *Clients* (clientes OAuth), *Data Access* (permisos) y
*Verification Center*. Los nombres de abajo son los nuevos.

## Antes de apretar grabar

### En Google Cloud Console (Google Auth Platform)

1. **Branding, público externo.** Nombre de la app «Tu Parrilla», correo de asistencia,
   **logo** (el mismo de `public/`; subirlo es lo que dispara la verificación con marca),
   dominio de la app `tu-parrilla.cl`, página principal `https://tu-parrilla.cl`,
   privacidad `https://tu-parrilla.cl/privacidad`, términos `https://tu-parrilla.cl/terminos`.
2. **Dominios autorizados:** `tu-parrilla.cl`, verificado en **Search Console** con el
   mismo usuario de Google que es dueño del proyecto (DNS TXT o el archivo HTML en
   `public/`; el DNS es lo estable).
3. **Data Access** (los *scopes*): exactamente `…/auth/youtube.upload` y
   `…/auth/youtube.force-ssl`, con la justificación de cada uno (tabla de abajo). No pedir
   `youtube.readonly`: `force-ssl` lo cubre y pedir de más alarga el review.
4. **Clients → el cliente OAuth tipo Web:** *URIs de redireccionamiento autorizados* con
   `https://tu-parrilla.cl/api/social/youtube/callback`. El `GOOGLE_CLIENT_ID` de Vercel es
   el de este cliente.
5. **YouTube Data API v3** habilitada en el mismo proyecto (ya lo está: es el de
   `YOUTUBE_API_KEY`).

### La página principal tiene que explicar la app

Google mira `https://tu-parrilla.cl` y exige que diga **qué hace la app y para qué usa los
datos de Google**, con enlace a la privacidad, sin pedir ingreso. Sin eso, Google rechaza
por «Homepage requirements not met». Está cubierto: la landing (`src/components/landing.tsx`,
servida en `DOMINIO_PRODUCTO`) nombra el canal de YouTube entre lo que se conecta, dice para qué
lo usa en «Qué se conecta, y para qué» —sube los videos que programas y lee sus contadores y sus
comentarios, tal como los entrega YouTube— y enlaza a Términos y Privacidad en el pie y junto a
esa sección. Desde el rediseño del 2026-10-17 lo cuida una prueba (`src/components/landing.test.ts`):
si una versión nueva de la portada se come una de estas cosas, el test falla antes del merge.

### La política de privacidad y los términos tienen que nombrar a Google y a YouTube

Dos reglamentos distintos, y la auditoría de YouTube mira los dos:

- La *Google API Services User Data Policy* (verificación del OAuth): `/privacidad` dice que
  el uso se ajusta a ella, incluidos los requisitos de *Limited Use*; qué datos de YouTube se
  guardan (id, título, miniatura, contadores y comentarios de **tu** canal), que se
  refrescan a diario, y cómo revocar (Los Fierros o myaccount.google.com/permissions).
- Las políticas de los Servicios de API de YouTube (auditoría de cuota): `/privacidad` dice
  que se usan los Servicios de API de YouTube y enlaza la Política de Privacidad de Google;
  `/terminos` y `/privacidad` enlazan los Términos de Servicio de YouTube y dicen que, al
  conectar el canal, se aceptan. Sin esto la auditoría vuelve con la lista de lo que falta.

Las dos cosas están desde el 2026-10-06.

Dos preguntas que la auditoría puede hacer y que conviene tener contestadas:

- **Qué pasa con los datos al desconectar.** Desde el 2026-11-07, desconectar borra en el
  acto las credenciales y lo que vino de la API: las lecturas de los videos y del canal, los
  comentarios, y el título y la miniatura de cada video (`desconectarCuenta`, en
  `src/lib/social/desconectar.ts`; son los mismos pasos que la retención de 30 días, acotados a
  esa cuenta). Quedan el id y el nombre del canal, para que la tarjeta siga en Los Fierros y se
  pueda reconectar o quitar, y la fila de cada video con su id, que une las visitas a la página
  del creador con su etiqueta: esas visitas las mide Tu Parrilla. La ventana de «Desconectar» lo
  avisa antes, y la privacidad lo dice así. «Quitar» borra también lo que queda.
- **Los borradores de respuesta con IA.** El texto de un comentario de YouTube se manda a un
  modelo de lenguaje para proponer la respuesta, y la privacidad lo cuenta. *Limited Use*
  prohíbe usar datos de Google para entrenar modelos, no para una función que el usuario
  ve y aprueba; la respuesta honesta es esa: se usa solo para el borrador que el dueño del
  canal aprueba, y no se entrena nada con él.

### Lo que la auditoría mira de los datos guardados

Las políticas para desarrolladores de YouTube (§III.E.4) tienen dos reglas que Los Cortes
no cumplía hasta el 2026-10-10, y la declaración final del formulario de cuota pide
afirmar que se cumplen:

- **Nada de métricas derivadas** (§III.E.4.h). Lo ganado en un período sale de restar dos
  lecturas, y el arrastre divide visitas por eso: las dos son derivadas, igual que sumar
  suscriptores de YouTube con seguidores de otra red. Desde entonces, las filas de YouTube
  traen solo los contadores de la API, y las visitas, clicks y CTR —que son de Tu Parrilla—
  van bajo «En tu página · lo mide Tu Parrilla» (hasta el 2026-10-13, «Medido por Tu
  Parrilla»), porque un dato propio al lado de los de YouTube tiene que leerse claro como no
  suyo. La planilla de Excel de Los Números («Llevar para la casa», desde el 2026-11-02) sigue
  la misma regla: de YouTube lleva solo los contadores, los títulos y los comentarios tal como
  llegaron, ninguna columna calculada, y su hoja «Léeme» lo dice.
- **Nada guardado más de 30 días sin refrescar** (§III.E.4.b–d). Las estadísticas se leen
  con la API key, y leídas así no pueden pasar de 30 días; el resto de los datos se borra
  o se refresca dentro de ese plazo. La sincronización diaria termina borrando lo que se
  pasó: lecturas diarias, comentarios y los títulos y miniaturas de videos que ya no llegan.
  La planilla de Los Números, además, deja fuera por su cuenta lo de más de 30 días, para no
  llevarse lo que la limpieza de ese día todavía no alcanzó a borrar.

La regla vive en `src/lib/social/politica-youtube.ts` y el borrado en
`retencion-youtube.ts`. Existe un permiso aparte (§III.L) para que un desarrollador de
analítica calcule métricas propias y guarde historia; no se pidió en la primera auditoría.

Lo de YouTube Analytics, escrito y cerrado desde el 2026-11-08 (abajo, «La analítica: segunda
verificación»), sigue otra regla, y conviene saberla contestar: leído con el token del dueño, es
dato **autorizado** de §III.E.4.b, que se guarda mientras haga falta con una condición —comprobar
cada 30 días que el dueño sigue autorizando y que el video sigue ahí—. La comprobación es la
lectura diaria misma (queda `analitica_verificada_en`); sin ella en 30 días, sin el permiso, con
un 401 de YouTube o al desconectar, se borra todo lo de analítica del canal. §III.E.4.h vale
igual: se muestra tal cual, sin sumar ni restar nada.

### La cuenta de prueba y su contenido

Un canal de YouTube que administres, con dos videos subidos y un par de comentarios de
otra cuenta. Es el canal «Pyxis oficial» de pyxis.latam@gmail.com, con dos videos de
prueba (2026-10-06). Para grabar se entra con el usuario revisor
(`REVISION_CORREO`, el mismo de Meta; ver la sección de Meta del README): así el video
muestra un panel sin cuentas de nadie más, y si Google pide credenciales de prueba, son
esas.

### Justo antes de rodar

- Revocar Tu Parrilla en myaccount.google.com → Seguridad → Acceso de terceros, para que
  el consentimiento salga entero.
- Cerrar sesión del panel. Ventana limpia, 1280×800 o más.
- Un video vertical corto listo para subir.

## Texto de verificación (inglés)

Justificación por permiso, en *Data Access* (cada permiso sensible pide la suya):

| Permiso | Justificación |
|---|---|
| `youtube.upload` | «The creator schedules a video from the Calendar; at the scheduled time we upload it to the creator's own channel as a public video, with the first line of their text as the title and the full text as the description. We never upload to any other channel. Shown at 1:10–2:00 in the demo video.» |
| `youtube.force-ssl` | «We read new comments on the creator's own recent videos and show them in a queue; the creator approves a reply with one tap, and can set a keyword rule that replies automatically. force-ssl is required to post comment replies (youtube.readonly cannot). 2:00–2:40.» |

Y la nota general, la misma que en Meta: panel privado, sin registro público, cada creador
ve solo su canal.

## Qué hacer, en orden (video de la verificación del OAuth)

Google pide ver: la URL de la app, el flujo completo de consentimiento **con el nombre de
la app y del proyecto visibles**, cada permiso en uso, y cómo se revoca.

| # | Acción | Subt. |
|---|---|---|
| 1 | `tu-parrilla.cl` con la barra de direcciones visible; bajar al párrafo que explica la app y su enlace a privacidad. | 1 |
| 2 | `/ingresar`: correo, código, entrar. | 2 |
| 3 | Ajustes → **Los Fierros**. Pulsar **Conectar →** bajo YouTube. | 3 |
| 4 | Pantalla de consentimiento de Google: **detenerse tres segundos** en el nombre «Tu Parrilla» y en los dos permisos con su descripción. Continuar. | 4 |
| 5 | Volver a Los Fierros con la tarjeta del canal. Pulsar **Sincronizar**; **Los Números** → «Ver todas las publicaciones →» muestra los videos con sus números (hasta el 2026-10-13 era la pestaña Los Cortes). | 5 |
| 6 | **El Fuego → «Poner al fuego»** (abre el compositor en La Parrilla): subir el video, marcar **YouTube**, título, «Ahora», **Programar**. De vuelta en El Fuego, verlo pasar a publicado. Abrir YouTube Studio y mostrar el video (privado, hasta la auditoría de cuota: decirlo en el subtítulo). | 6 |
| 7 | Desde otra cuenta, comentar en el video. Esperar la corrida de YouTube (cada media hora: mejor tener un comentario **anterior** ya en la cola y usar ese). | |
| 8 | **La Mesa**: el comentario, la respuesta propuesta, **Enviar**. Abrir YouTube y mostrar la respuesta publicada. | 7 |
| 9 | Los Fierros → **Desconectar**. Y myaccount.google.com → Seguridad → Acceso de terceros → quitar Tu Parrilla. | 8 |
| 10 | `/privacidad`, en la parte que nombra a Google y el *Limited Use*. | 9 |
| 11 | Terminar la grabación. | |

## Los subtítulos

1. Tu Parrilla: a private dashboard for creators. This page explains the app.
2. Invited by email, one-time code. No public signup.
3. Accounts: the creator connects their own YouTube channel.
4. Google consent: app name and the two scopes, shown in full.
5. Their own videos and counters, read once a day.
6. youtube.upload: a video scheduled and uploaded to their own channel.
7. youtube.force-ssl: a comment on their own video, replied with one tap.
8. Disconnect removes the stored tokens; revoking in Google works too.
9. Privacy policy: Google API Services User Data Policy, Limited Use.

### Cómo es el Verification Center de verdad

Así estaba el 2026-10-12, cuando se envió. Lo que no se ve venir:

- **La marca se verifica primero, y el botón está escondido.** El Verification Center no
  deja pedir nada («You need to verify and publish your branding…») hasta que la marca esté
  verificada y publicada, y la página *Branding* no muestra ningún botón para hacerlo: está
  detrás del **círculo azul con una «i»** a la derecha del título «Branding», que abre el
  panel *Verification status* con **Verify branding**. Tardó minutos. Después hay que
  apretar **Publish branding** antes de siete días, o el resultado vence.
- **El video va en Data Access**, en un campo *YouTube link* debajo de la justificación, y
  Google exige que muestre **todos los clientes OAuth del proyecto**: hoy hay uno solo,
  `portafolio-web`, el del video. Si se agrega otro cliente, el video ya no alcanza.
- **«Prepare for verification» es un resumen** de la marca, los permisos, la justificación
  y el video, más una caja *Additional info* de **1000 caracteres** como máximo, donde van
  las credenciales del revisor. Las notas largas de arriba no caben: se mandó un resumen.
- **Después pregunta cuatro cosas** (uso personal, interno, solo pruebas, plugin SMTP de
  WordPress) —las cuatro van en *No*— y pide dos confirmaciones; la de CASA no aplica,
  porque los dos permisos son sensibles y no restringidos.
- **El aviso de facturación de *Project Checkup* no es requisito.** Dice que el proyecto no
  tiene cuenta de facturación; es una recomendación, y la API de YouTube no cobra.

Lo que se pegó está en `TEXTOS-FORMULARIO.txt` de la carpeta «YouTube - Verification» del
escritorio de Vicente: sirve si Google pide reenviar.

## La auditoría de cuota de YouTube (formulario aparte)

Es el «YouTube API Services – Audit and Quota Extension Form». Pide:

- **Qué hace la app con la API**, funcionalidad por funcionalidad, con capturas: (a)
  listar los videos y contadores del propio canal (`videos.list`, `channels.list`), (b)
  subir videos programados (`videos.insert`), (c) leer comentarios de los propios videos
  (`commentThreads.list`) y responder (`comments.insert`). Las mismas escenas 5, 6 y 8.
- **Cuánta cuota y por qué.** Cálculo honesto, por creador y día, en el cupo general: un
  sync de métricas (≈ 4 llamadas × 1 unidad); la corrida de comentarios cada media hora,
  que hace **una llamada `commentThreads.list` por video** hasta un tope de 20 videos por
  pasada (`MAX_POSTS_POR_PASADA` en `src/lib/social/comentarios/ventana.ts`): hasta
  48 × 20 = 960 unidades; las respuestas (`comments.insert`, 50 cada una: unas diez al
  día, 500); y unas diez consultas de estado por subida. Con 30 creadores:
  30 × (4 + 960 + 500 + 10) ≈ **44.000 unidades/día**. Se piden **100.000**, para que
  quepan unos 65 creadores sin volver a pedir. Las subidas van en su cupo propio de 100
  al día, que alcanza para un video diario de cada creador; no se pide más. Google cambia
  estos costos de vez en cuando (el de subir pasó de 1.600 unidades a un cupo aparte entre
  diciembre de 2025 y junio de 2026): antes de una reauditoría, mirar la página de cuotas
  del proyecto en Cloud Console, que muestra los dos cupos.
- **Cumplimiento de los términos de YouTube**: que los datos de la API se muestran solo al
  dueño del canal; que se refrescan a diario y nada se guarda más de 30 días sin
  refrescar; que no se calculan métricas con ellos y lo propio va marcado como propio (ver
  «Lo que la auditoría mira de los datos guardados»); que el usuario puede revocar (Los
  Fierros y Google); que no se venden; que al desconectar se borran las credenciales, se deja
  de leer y se borra en el acto lo guardado de YouTube, y que se borra todo a petición.
- **Enlaces**: privacidad, términos, y el video de arriba sirve.

Sin esta auditoría, la app funciona para leer y responder comentarios, pero **no para
publicar en público**: el aviso de Los Fierros lo dice hasta que pase.

### Cómo es el formulario de verdad

El que se envió el 2026-10-10 tenía siete secciones: tipo de pedido, organización y
contactos, modelo de negocio, el cliente de la API (con una cuenta de prueba que tenga
datos), casos de uso y cuota por método, materiales de apoyo opcionales y declaraciones.
Cuatro cosas que no se ven venir:

- **No guarda borradores.** Si se recarga la página o se navega hacia atrás, se pierde todo.
  Conviene tener las respuestas escritas antes y dejar lista la cuenta de prueba (el canal
  conectado al usuario revisor) antes de abrirlo.
- **No hay dónde subir el video.** El enlace va en las instrucciones de acceso y en un PDF
  de materiales de apoyo con los minutos de cada parte.
- **Cada campo de archivo acepta uno solo**, imagen o PDF, de menos de 10 MB, y pide
  capturas con la barra de direcciones a la vista. Lo que son varias capturas va en un PDF.
- **El cupo de `videos.insert` se pide aparte**, en un campo propio que aparece al marcarlo
  entre los métodos; el cupo general se elige por rango. Los dos tienen que cuadrar con la
  justificación.

Las respuestas que se mandaron están, sección por sección, al final de
`TEXTOS-FORMULARIO.txt` en la carpeta «YouTube - Verification» del escritorio de Vicente, y
la evidencia en `evidencia/` de la misma carpeta: son la base para una reauditoría.

## Errores que Google castiga

- **La portada no explica la app** o no enlaza a la privacidad: rechazo inmediato.
- **El dominio no está verificado** en Search Console con el mismo usuario del proyecto.
- **El video no muestra el nombre de la app en el consentimiento**, o el consentimiento
  está recortado.
- **Pedir permisos que el video no usa** (`youtube.readonly` además de `force-ssl`).
- **La privacidad no nombra la User Data Policy / Limited Use.**
- Para la cuota: un cálculo sin números, o números que no cuadran con las funciones
  mostradas.
- Para la cuota también: métricas calculadas con datos de YouTube, o estadísticas
  guardadas más de 30 días (ver «Lo que la auditoría mira de los datos guardados»).

## Después de aprobar

- Verificación aprobada (2026-10-14): desaparecen el cartel de app no verificada y el tope
  de 100 usuarios. No tocar la pantalla de consentimiento sin pedir otra verificación.
- Con la cuota aprobada: suben los cupos (10.000 unidades y 100 subidas al día). El aviso
  de «sale privado» ya se quitó el 2026-10-16, porque al proyecto no se le aplicaba.
- Con la cuota aprobada, y no antes: la segunda verificación, la de YouTube Analytics (abajo).

## La analítica: segunda verificación

Fecha: 2026-11-08. El código está escrito y cerrado (README, «YouTube Analytics: escrito y
cerrado»): con el permiso `https://www.googleapis.com/auth/yt-analytics.readonly`, la
sincronización diaria lee de YouTube Analytics la historia del canal día por día, cada video
desde que salió (tiempo visto, duración media, porcentaje visto, suscriptores ganados y
perdidos), las fuentes de tráfico y la audiencia, y Los Números lo muestran en «Tu canal de
YouTube» y, en la pieza de cada video, en «En YouTube Analytics». Es lo que el dueño pidió para
que sus canales guarden la historia (`docs/pendientes.md`, «YouTube: la historia y el arrastre
de las cuentas propias»).

**No se pide antes de que aprueben la auditoría de cuota.** Agregar un permiso es cambiar la
pantalla de consentimiento, y eso abre una verificación nueva mientras la auditoría sigue
mirando la de hoy. Además, un permiso sin verificar le muestra el cartel de «Google no ha
verificado esta app» a quien lo pida; por eso el conectar lo pide solo a quien nombra
`YOUTUBE_ANALITICA_ABIERTO_PARA`, y solo con `YOUTUBE_PERMISOS_ANALITICA=1`.

El permiso es *sensible*, no *restringido* (como los dos de hoy): no hay CASA. La API de
YouTube Analytics tiene su propio cupo, aparte del de la Data API: no cambia el cálculo que se
mandó en la auditoría.

### La justificación (inglés, para Data Access; 924 caracteres)

> Tu Parrilla is a private, invite-only dashboard where each creator schedules and measures
> posts on their own channel. With yt-analytics.readonly we read, once a day, YouTube Analytics
> reports for the creator's own channel only (ids=channel==MINE): daily views and watch time;
> per video, average view duration, average percentage viewed, likes, comments, shares and
> subscribers gained/lost; traffic sources (Shorts feed, search, external) and audience country,
> age and gender. We show these figures unchanged, only to the channel owner, in the Numbers tab
> and on each video's page, so they can see which Shorts hold attention and where viewers come
> from. We compute no new metrics from them. Data is kept only while the user stays authorized:
> every daily read re-checks the grant, and data is deleted after 30 days without a successful
> check, when the scope is revoked, or on Disconnect. Shown at 0:40-2:10 in the demo video.

Se pega en una sola línea; los minutos se corrigen con los del video que se grabe. Para la caja
*Additional info* (1000 caracteres) sirve el resumen que se mandó la primera vez, cambiando la
primera frase por: «Second verification: adds yt-analytics.readonly to the two scopes verified
on 2026-10-14; nothing else changed on the consent screen.»

### El video (con la cuenta del revisor)

Mismas reglas que el primero: barra de direcciones a la vista, el nombre de la app en el
consentimiento, todos los clientes OAuth del proyecto (hoy uno, `portafolio-web`). Antes de
rodar: revocar Tu Parrilla en myaccount.google.com → Seguridad → Acceso de terceros con la
cuenta de «Pyxis oficial», para que el consentimiento salga entero, y que el canal tenga al
menos un Short con vistas de los últimos días.

| # | Acción | Subt. |
|---|---|---|
| 1 | `tu-parrilla.cl/privacidad`, en el párrafo de YouTube Analytics (aparece con la bandera puesta). | 1 |
| 2 | `/ingresar` con el revisor. Ajustes → **Los Fierros** → **Reconectar** en «Pyxis oficial». | 2 |
| 3 | El consentimiento de Google: **detenerse tres segundos** en «Tu Parrilla» y en los **tres** permisos, con el de YouTube Analytics marcado. Continuar. (Puede salir el cartel de app no verificada: es lo esperado, se pasa por «Avanzado».) | 3 |
| 4 | De vuelta en Los Fierros, **Sincronizar**. Esperar que termine (lee también YouTube Analytics). | 4 |
| 5 | **Los Números** → bajar a «Tu canal de YouTube»: «Día a día», «De dónde llegó la gente» (mostrar «Feed de Shorts») y «Quién mira». | 5 |
| 6 | «Ver todas las publicaciones →» → un Short de Pyxis oficial → su pieza → «En YouTube Analytics»: duración media y porcentaje visto. | 6 |
| 7 | Los Fierros → la tarjeta → **Desconectar** → Los Números ya no muestra la sección. myaccount.google.com → quitar Tu Parrilla. | 7 |
| 8 | Terminar la grabación. Volver a conectar «Pyxis oficial» al revisor (**Conectar →**, dejando marcado el permiso), para que Google lo encuentre conectado. | |

Subtítulos:

1. Privacy policy: what YouTube Analytics data we keep, and for how long.
2. The creator reconnects their own YouTube channel.
3. Google consent: app name and the three scopes, including yt-analytics.readonly.
4. One daily read of YouTube Analytics for their own channel (ids=channel==MINE).
5. Channel reports, shown unchanged: daily views and watch time, traffic sources, audience.
6. Per video: average view duration and percentage viewed, as YouTube reports them.
7. Disconnect deletes the stored analytics at once; revoking in Google works too.

### Qué hacer, en orden

1. **[dueño]** Esperar el correo de que la auditoría de cuota quedó aprobada. Antes, nada de lo
   de abajo.
2. **[dueño]** Google Cloud Console, proyecto `portafolio-page` → *APIs & Services* → *Library*
   → **YouTube Analytics API** → *Enable*. Sin eso, cada lectura contesta 403 y la sección se
   queda vacía.
3. **[dueño]** Google Auth Platform → **Data Access** → *Add or remove scopes* → agregar
   `…/auth/yt-analytics.readonly` (si no aparece en la lista, pegarlo en *Manually add scopes*)
   → guardar, y pegar la justificación de arriba en el campo de ese permiso.
4. **[dueño]** Vercel, *Production*: `YOUTUBE_PERMISOS_ANALITICA=1` y
   `YOUTUBE_ANALITICA_ABIERTO_PARA=<id del revisor>` (el usuario de `revision@tu-parrilla.cl`).
   Redesplegar. Así lo pide solo el revisor, y `/privacidad` ya lo cuenta.
5. **[dueño]** Grabar el video de arriba, subirlo no listado al canal Pyxis oficial y pegar el
   enlace en el campo *YouTube link* del permiso, en Data Access.
6. **[dueño]** **Verification Center** → *Prepare for verification* → revisar el resumen →
   *Additional info* → las cuatro preguntas en *No* → enviar. Lo que se pegue, al final de
   `TEXTOS-FORMULARIO.txt` en la carpeta «YouTube - Verification».
7. Mientras revisan: no tocar la pantalla de consentimiento, y que «Pyxis oficial» siga
   conectado al revisor con el permiso.
8. **[dueño]** Aprobada: `YOUTUBE_ANALITICA_ABIERTO_PARA=1` y redesplegar. Cada creador ve en
   Los Números «Reconecta YouTube para ver sus números completos.» hasta que reconecta su canal
   y deja marcado el permiso. Después: sacar de la wiki (`los-numeros.md`) que la sección se ve
   solo en algunas cuentas, y borrar la entrada de `docs/pendientes.md`.

**Mientras tanto, el comentario de prueba.** El revisor de la auditoría tiene un comentario en
La Mesa sobre el Short «canal video 2» de Pyxis oficial, que se borra a los 30 días: hacia el
**2026-11-25**. Si la auditoría no contestó para entonces, subir un Short público nuevo desde
YouTube Studio, apretar «Sincronizar» entrando como el revisor y comentarlo desde parejavice
(el detalle, en `docs/pendientes.md`, en la entrada de la auditoría de cuota). Renovar el permiso
del revisor siempre con **Reconectar**, nunca con «Desconectar»: desconectar borra ese
comentario en el acto.
