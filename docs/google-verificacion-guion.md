# Google y YouTube: qué preparar, qué grabar y qué escribir

Fecha: 2026-09-30; revisado contra el código el 2026-10-06. Son **dos trámites** en Google Cloud y **uno** en YouTube, y conviene
hacerlos en paralelo porque cada uno tarda semanas:

1. **Verificación del OAuth.** El proyecto ya está *In production*, pero sin verificar
   (visto el 2026-10-06): cualquiera puede conectar, pasando por el cartel «Google no ha
   verificado esta app», con un tope de **100 usuarios en toda la vida del proyecto** que
   no se reinicia (iban 3), y la pantalla de Google muestra el dominio en vez del nombre y
   el logo. No hay lista de *test users*: eso es solo de *Testing*, y los tokens de 7 días
   también.
2. **Auditoría y extensión de cuota de la YouTube Data API.** Sin ella: 10.000 unidades al
   día para todos los usuarios juntos, más un cupo aparte de 100 subidas al día (desde el
   1 de junio de 2026 `videos.insert` cuenta en su propio cupo; antes costaba 1.600
   unidades del general). Según la documentación, además, **los videos subidos quedan
   privados** aunque el usuario pida público; en la grabación del 2026-10-09 el video
   subido salió público, y eso está por revisar en `docs/pendientes.md`.
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
servida en `DOMINIO_PRODUCTO`) nombra el canal de YouTube entre lo que se conecta y enlaza a
Términos y Privacidad en el pie.

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

- **Qué pasa con los datos al desconectar.** Desconectar borra las credenciales
  (`disconnectAccount`, en `src/app/admin/actions.ts`) y el canal deja de leerse; lo ya
  guardado se borra solo en 30 días, como todo dato de YouTube que nadie refresca (ver
  abajo). La privacidad lo dice así. Si YouTube pide borrarlo en el acto, hay que cambiar
  el código y la página: está anotado en `docs/pendientes.md`.
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
  van bajo «Medido por Tu Parrilla», porque un dato propio al lado de los de YouTube tiene
  que leerse claro como no suyo.
- **Nada guardado más de 30 días sin refrescar** (§III.E.4.b–d). Las estadísticas se leen
  con la API key, y leídas así no pueden pasar de 30 días; el resto de los datos se borra
  o se refresca dentro de ese plazo. La sincronización diaria termina borrando lo que se
  pasó: lecturas diarias, comentarios y los títulos y miniaturas de videos que ya no llegan.

La regla vive en `src/lib/social/politica-youtube.ts` y el borrado en
`retencion-youtube.ts`. Existe un permiso aparte (§III.L) para que un desarrollador de
analítica calcule métricas propias y guarde historia; no se pidió en la primera auditoría.

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
| 3 | Engranaje → **Los Fierros**. Bajo YouTube, el aviso «Hasta que Google apruebe la cuota…». Pulsar **Conectar →**. | 3 |
| 4 | Pantalla de consentimiento de Google: **detenerse tres segundos** en el nombre «Tu Parrilla» y en los dos permisos con su descripción. Continuar. | 4 |
| 5 | Volver a Los Fierros con la tarjeta del canal. Pulsar **Sincronizar**; **Los Cortes** muestra los videos con sus números. | 5 |
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
  Fierros y Google); que no se venden; que al desconectar se borran las credenciales y se
  deja de leer, y que se borra todo a petición.
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

- Verificación aprobada: desaparecen el cartel de app no verificada y el tope de 100
  usuarios, y la pantalla de Google muestra «Tu Parrilla» con su logo.
- Con la cuota aprobada: quitar el aviso de YouTube en `AVISO_ANTES_DE_CONECTAR`
  (`src/lib/networks.ts`) y su test, y la frase del README.
