# Abrir Tu Parrilla a terceros: qué exige cada red y qué falta en la app

Fecha: 2026-09-30. Levantamiento para pasar de «la uso yo con mis cuentas» a «la usan
otras personas con las suyas», en las cuatro redes: Facebook, Instagram, TikTok y YouTube.
Parte de lo que el código pide hoy a cada red (`src/app/api/social/[network]/connect/route.ts`)
y del estado real de cada app de plataforma; lo que es papeleo del dueño va separado de lo
que es código. Al final, el orden propuesto y lo que se puede hacer **hoy** mientras los
trámites avanzan.

El 2026-11-07 se sumaron los comentarios de TikTok (§3.5) y la pasada de permisos red por red
(§8), que es la lista para armar cada vuelta de revisión.

Las cifras de límites y cuotas son las publicadas por cada plataforma a la fecha; cada una
las cambia sin avisar, así que antes de prometer un número a un usuario, comprobarlo en el
panel de la plataforma correspondiente.

## 1. Dónde estamos, red por red

| Red | Qué pide la app hoy | Estado de la app de plataforma | Si hoy conecta alguien que no eres tú |
|---|---|---|---|
| **Instagram** | `instagram_basic`, `instagram_manage_insights`, `pages_show_list`, `pages_read_engagement`, `instagram_content_publish`, `business_management`, `instagram_manage_comments` | App de Meta en **modo desarrollo** | El diálogo de Facebook le dice que la función no está disponible; no puede conectar (es lo que le pasó a una usuaria el 2026-09-29). Solo entran cuentas con un rol en la app. |
| **Facebook** | `pages_show_list`, `pages_read_engagement`, `pages_read_user_content`, `pages_manage_posts`, `business_management`, `pages_manage_engagement` (+ `publish_video` al confirmar) | La misma app de Meta, mismo modo | Igual que Instagram. |
| **TikTok** | `user.info.basic`, `video.list`, `video.upload`, `video.publish` (los comentarios y los números de TikTok for Business, aparte y cerrados: §3.5) | App **aprobada y en producción** desde el 2026-09-28 (Login Kit + Content Posting API); **auditoría de Direct Post aprobada** (aviso del 2026-10-06) | Puede conectar y publicar con la privacidad que elija, desde una cuenta pública o privada, sin cupo de usuarios por día. |
| **YouTube** | `youtube.upload`, `youtube.force-ssl` (OAuth), más una API key para métricas | Proyecto de Google Cloud *In production* y **verificado** (2026-10-14) | Entra sin cartel ni tope de usuarios; falta la auditoría de cuota, que sube los cupos. Según la documentación, sin ella los videos quedan privados, pero a este proyecto no se le aplica: lo subido el 2026-10-09 y el 2026-10-16 salió público. |

Lo que ya está resuelto del lado del producto y no hay que rehacer: usuarios invitados por
correo con código, cada uno con su página y sus cuentas aisladas por dueño (`owner_id` en
toda lectura, con arnés de pruebas), varias cuentas por red, páginas legales de privacidad y
términos (`/privacidad`, `/terminos`), dominio propio con TLS, y la app de Android en
trámite en Play (`docs/play-store.md`).

## 2. Meta (Facebook e Instagram)

Una sola app de Meta sirve a las dos redes; el trámite es uno.

### 2.1 Salir del modo desarrollo

Para que cualquier persona pueda autorizar, la app tiene que estar en **modo Live**, y
para eso Meta exige **App Review** de cada permiso que la app pide con **acceso avanzado**.
Con acceso estándar (sin review) los permisos solo funcionan para gente con rol en la app,
que es exactamente lo de hoy.

Antes del review, Meta pide que la app tenga completo lo básico (App Settings → Basic):

- Icono, categoría, correo de contacto, **URL de política de privacidad** (existe:
  `https://tu-parrilla.cl/privacidad`) y **URL de términos** (existe).
- **URL de borrado de datos** («Data Deletion Request»): obligatoria para toda app con
  Facebook Login. O una URL con instrucciones para el usuario, o un *callback* al que
  Facebook manda un `signed_request` cuando alguien quita la app desde su cuenta de
  Facebook, y que tiene que responder con un código de confirmación y una URL de estado.
  **No existe hoy**; la página de privacidad solo dice «escribe a …». Ver §5.
- **Deauthorize callback** (opcional pero conviene): cuando el usuario quita la app desde
  Facebook, nosotros marcamos sus cuentas de Meta como sin credencial en vez de enterarnos
  al primer 190 del sync.
- **Verificación de negocio** (*Business Verification*): desde 2023 Meta la exige para
  dar acceso avanzado a casi todos estos permisos. Pide un Business Manager con documentos
  de la empresa (o de la persona con giro), y tarda de días a dos semanas. Es el paso más
  lento y el que conviene empezar **primero**, porque el review no avanza sin él.

### 2.2 Qué se revisa, permiso por permiso

Cada permiso se pide en el review con una explicación de para qué se usa y un **video**
(*screencast*) que muestre a un usuario real usándolo en la app. Por lo que la app hace hoy:

| Permiso | Para qué lo usamos | Qué mostrar en el video |
|---|---|---|
| `instagram_basic`, `pages_show_list`, `pages_read_engagement` | Listar las cuentas y páginas al conectar; leer posts y métricas | Conectar, elegir la cuenta, ver Los Cortes con sus números |
| `instagram_manage_insights` | Alcance, impresiones, seguidores por día | Los Números |
| `instagram_content_publish` | Publicar reels y fotos programados (incluidos trial reels) | Programar un corte y verlo salir |
| `instagram_manage_comments`, `pages_manage_engagement`, `pages_read_user_content` | Leer comentarios, responder, respuesta automática por palabra clave | La cola de comentarios y una regla de palabra clave |
| `pages_manage_posts` | Publicar en la página de Facebook (`publish_video` no se pide mientras la app no lo incluya al conectar) | Programar un corte a Facebook |
| `business_management` | Que aparezcan páginas administradas desde un Business Manager | Conectar con una cuenta que administra por Business |
| `instagram_manage_messages`, `pages_messaging` | **Todavía no se piden.** Son los del privado (mandar el PDF por DM), que hoy está apagado a la espera de este mismo trámite | Solo si se incluye el privado en esta vuelta |
| `ads_read` | **Tercera vuelta; solo se pide con `META_PERMISOS_ANUNCIOS=1`.** Leer cómo les fue a los anuncios del creador —lo gastado, el alcance, las impresiones y los clics de cada publicación promocionada— en «Lo pagado», en Los Números | Reconectar Instagram aceptando el permiso, «Sincronizar ahora» y «Lo pagado» con una publicación promocionada (ver `docs/pendientes.md`, «Meta: los anuncios») |
| `ads_management` | **Tercera vuelta; solo se pide con `META_PERMISOS_PROMOCIONAR=1`, junto a la de arriba.** Promocionar desde Tu Parrilla una publicación ya publicada: crear la campaña, el conjunto y el anuncio en la cuenta publicitaria del creador, siempre con su confirmación del gasto máximo, y pausarla, reanudarla o detenerla | La pieza → «Promocionar» con un presupuesto mínimo → «Revisar» → confirmar → el estado → «Pausar» → «Lo pagado» (el guion, en la misma entrada de `docs/pendientes.md`) |

Cuanto más se pide, más largo el review y más riesgo de rechazo por un permiso cuyo uso
no quedó claro en el video. Lo razonable es pedir en una primera vuelta lo que ya funciona
en pantalla y dejar los del privado para una segunda, salvo que el privado sea prioridad.

### 2.3 Con varios usuarios

- **Publicación en Instagram:** el límite es **por cuenta**, no por app (históricamente 25
  publicaciones por cuenta cada 24 h; el endpoint `content_publishing_limit` dice el vigente).
  No hay que hacer nada en la app salvo, en algún momento, mostrarle al usuario el cupo.
- **Llamadas a la Graph API:** el límite de la app crece con el número de usuarios (del
  orden de 200 llamadas por hora por usuario conectado). Con decenas de usuarios no es un
  problema; con cientos, el sync de métricas y de comentarios tiene que repartirse (ver §5).
- **Tokens:** los de larga duración de páginas no caducan mientras el usuario no cambie la
  contraseña ni quite la app; cuando pase, hoy la tarjeta pasa a «sin credencial» y el
  usuario reconecta. Con el *deauthorize callback* nos enteraríamos al instante.
- **Cuentas personales de Instagram** (no Business ni Creator, o sin página de Facebook
  enlazada) **no pueden conectar por este camino**. Hay que decirlo en pantalla antes del
  botón, no después del error. La alternativa, el «Instagram API con Instagram Login», que no
  exige página de Facebook, está hecha desde el 2026-11-05 y cerrada hasta su review: es el caso
  de uso de Instagram de la misma app, con su propio id y su propio secreto (README, «Instagram
  sin página de Facebook: el login de Instagram»). Una cuenta personal tampoco conecta por ahí.

### 2.4 Tiempo

Verificación de negocio: 1–2 semanas. App Review: de una a tres semanas por vuelta, y una
vuelta rechazada por un video poco claro vuelve a la cola. Planificar **un mes** desde que
se manda el primer papel hasta que la app está en Live, si no hay rechazos.

## 3. TikTok

### 3.1 Lo que ya está

La app está aprobada y en producción: Login Kit y Content Posting API funcionan para
cualquier usuario. Términos, privacidad y el dominio verificado ya están cargados en el
portal de desarrolladores.

### 3.2 La auditoría de Direct Post: aprobada

Aprobada, con aviso del 2026-10-06. Sin ella, TikTok solo acepta publicaciones de **cuentas
privadas** y en «Solo yo» —con la cuenta pública rechaza el post entero, no lo deja en
privado—, y la app tiene un cupo de **5 usuarios distintos por día** que publican. Con ella
el cupo desaparece y cada cuenta publica con la privacidad que elija; los avisos que lo
advertían en Los Fierros y en el compositor se quitaron.

Para una revisión futura: la auditoría es un formulario en el portal (las respuestas en
inglés y el guion del video están en `docs/tiktok-revision-guion.md`) más un **video
demostrativo** del flujo
completo: conectar, programar un video con la privacidad que el usuario eligió, verlo
salir con esa privacidad, y el aviso que la app muestra sobre las reglas de TikTok
(el compositor ya lo muestra). Pide también el detalle de los campos de la respuesta que se
usan y el cálculo del uso diario estimado.

### 3.3 Con varios usuarios

- Los límites de publicación son por usuario (TikTok los publica en el portal por app; hoy
  el habitual es unas pocas decenas de publicaciones por usuario al día) y hay un tope de
  llamadas por app por minuto. Ninguno aprieta con decenas de usuarios.
- Los tokens duran 24 h y el *refresh* un año: la app ya los renueva sola; el usuario
  reconecta una vez al año o si revoca desde TikTok.
- Cada app de TikTok da un `open_id` distinto por usuario (por eso las cuentas del sandbox
  quedaron duplicadas al pasar a producción): ya está resuelto con «Es la misma cuenta →»
  en Los Fierros, y no volverá a pasar mientras la app no cambie.

### 3.4 Tiempo

Una a dos semanas por vuelta de auditoría. Se puede mandar **esta semana**: no depende de
nada más.

### 3.5 Los comentarios: la Accounts API de TikTok for Business

Levantado el 2026-11-07, leyendo la documentación oficial. Lo que se concluyó: **sí hay una API
que lee y responde los comentarios de los videos propios, pero no es la que usa Tu Parrilla**.

- **Lo de hoy no alcanza.** Los permisos de developers.tiktok.com (Login Kit, Display, Content
  Posting) no tienen ninguno de comentarios: la lista completa
  (<https://developers.tiktok.com/doc/tiktok-api-scopes>) llega a `video.list` y
  `video.manage`, y de cada video da solo `comment_count`. La Research API sí lee comentarios
  públicos, pero es para investigación académica y no responde.
- **La que sirve es la Accounts API** (antes «Organic API») de *TikTok API for Business*, en
  business-api.tiktok.com. Su resumen
  (<https://business-api.tiktok.com/portal/docs?id=1737944384433218>) la parte en tres:
  métricas, **moderación de comentarios** y publicación, y entre los usos autorizados nombra
  «manejar la presencia orgánica de las cuentas propias de marcas o creadores», con moderar
  comentarios. Los endpoints
  (<https://business-api.tiktok.com/portal/docs?id=1776065099288577>):
  `GET /v1.3/business/comment/list/` (los comentarios de un video propio, públicos y ocultos, de
  a 30 por página, con hasta tres respuestas cada uno; <https://business-api.tiktok.com/portal/docs?id=1760232109619202>),
  `/business/comment/reply/list/`, `POST /business/comment/reply/create/` (responder, hasta
  1.200 caracteres; <https://business-api.tiktok.com/portal/docs?id=1762228448779266>), y
  además crear, dar «me gusta», ocultar y borrar. Hay un webhook `comment.update` que avisa en
  menos de cinco minutos, que Tu Parrilla no usa: sondea, como en las demás redes.
- **Los permisos** son `comment.list` («Get Business Comment») y `comment.list.manage`
  («Manage Account Comment»), dentro del grupo «TikTok Accounts»
  (<https://business-api.tiktok.com/portal/docs?id=1735713875563521>). El token de ejemplo del
  canje trae también `user.info.basic`, `user.info.stats`, `video.list`, `video.insights`,
  `user.insights` y otros.
- **Cuentas personales.** La documentación define tres niveles de cuenta: la general o personal,
  la «con acceso avanzado» (enlazada a TikTok for Business) y la de empresa verificada. Solo
  algunas **métricas** se reservan a las dos últimas (lo dice campo por campo en
  `/business/get/` y `/business/video/list/`); los comentarios no tienen esa restricción, y la
  autorización se describe como «de una cuenta orgánica de TikTok». Así que, según lo escrito,
  sirve para creadores con cuenta personal. Falta confirmarlo con una cuenta real: es la primera
  prueba al tener la app.
- **Es otra app, otro portal y otra revisión.** Hay que tener una cuenta de TikTok for Business,
  registrarse como desarrollador, crear una app nueva con el permiso «TikTok Accounts» y
  mandarla a revisión (dos a tres días hábiles, según
  <https://business-api.tiktok.com/portal/docs?id=1738855242728450>). **Desde el 2026-03-20**,
  antes de mandar una app nueva con «TikTok Accounts» hay que llenar el *Accounts API Access
  Application Form* (enlazado desde esa misma página). Cada desarrollador tiene hasta cinco
  apps.
- **Su autorización es aparte.** El dueño sigue conectando TikTok como hoy para publicar, y
  autoriza la cuenta una segunda vez en la app nueva: TikTok da un `open_id` distinto por app, y
  ese es el `business_id` de cada llamada. El enlace lo da el portal («TikTok account holder
  authorization URL», que es `https://www.tiktok.com/v2/auth/authorize?...`); la vuelta tiene
  que terminar en `/`, sin parámetros; el código dura diez minutos y se canjea en
  `/tt_user/oauth2/token/`; el token dura un día y el de renovación un año
  (<https://business-api.tiktok.com/portal/docs?id=1738083939371009> y
  <https://business-api.tiktok.com/portal/docs?id=1738084387220481>).
- **Límites:** 40 llamadas por minuto por cuenta y endpoint, más un tope por app según su nivel
  (<https://business-api.tiktok.com/portal/docs?id=1738084416214017>). Con el sondeo de cinco
  minutos y cinco páginas por video, no aprieta.

- **Los números** (leído el 2026-11-08). La misma autorización da lo que la app de siempre no
  da, cada cosa con su casilla en el grupo «TikTok Accounts» del portal:
  - `GET /business/get/` (<https://business-api.tiktok.com/portal/docs?id=1762228399168514>): de
    por vida, seguidores, «me gusta» y videos (`user.info.stats`, «Get account user info»); por
    día, hasta 60 días atrás y con 24 a 48 horas de atraso, visitas al perfil, views, likes,
    comentarios, compartidos y seguidores, y la audiencia por país, género y edad desde 100
    seguidores (`user.insights`, «Get account insights»). El alcance diario, la gente que
    interactuó y el neto de seguidores son solo para cuentas con acceso avanzado o de empresa.
  - `GET /business/video/list/` (<https://business-api.tiktok.com/portal/docs?id=1762228421622786>):
    cada video público, de a 20 por página con cursor, con views, likes, comentarios,
    compartidos, guardados y alcance (`video.list`) y tiempo visto, cuántos lo vieron completo,
    seguidores que trajo, visitas al perfil, fuentes de tráfico y tipos de audiencia
    (`video.insights`); los dos, «Get account media». Son totales de la vida del video, y dejan de
    actualizarse al año.
  - `GET /business/benchmark/` (<https://business-api.tiktok.com/portal/docs?id=1822388944791617>):
    el promedio de las cuentas de empresa verificadas de un rubro (`business_category`, 25
    valores) —seguidores, lo ganado en 30 días, videos, interacción y otros—. Su documentación no
    dice con qué permiso llega al token («Business benchmark» en el portal).
  - `GET /discovery/trending/search/` y `/discovery/trending/search/keyword/`
    (<https://business-api.tiktok.com/portal/docs?id=1832798345014338> y
    <https://business-api.tiktok.com/portal/docs?id=1832798361818114>): 20 búsquedas en tendencia,
    o recomendadas para una consulta de hasta 255 caracteres, personalizadas o no para la cuenta
    (`discovery.search.words`, «Discover trending search keywords»). Solo para cuentas con acceso
    avanzado o de empresa.

Lo que se hizo con esto: el comentarista de TikTok y los números están escritos y cerrados detrás
de `TIKTOK_COMENTARIOS_ABIERTO_PARA` (README, «TikTok for Business: comentarios y números»). Lo
que queda —crear la app cuando aprueben el registro de desarrollador, el formulario, la revisión y
el video— está en `docs/pendientes.md`, «TikTok for Business: comentarios en La Mesa y números en
Los Números».

Las páginas del portal se dibujan con JavaScript y un lector sin navegador las ve vacías; el
texto se leyó por la misma API con que las arma el portal
(`/gateway/api/doc/client/node/get/v2/`, con el `doc_id` de cada página).

## 4. YouTube

Es la red con más trámite escondido, porque son **dos trámites distintos** en Google y un
tercero en YouTube.

### 4.1 Verificación del OAuth (pantalla de consentimiento a *Production*)

**Aprobada el 2026-10-14.** Hasta entonces el proyecto estaba *In production* sin
verificar: se conectaba pasando por la pantalla «Google no ha verificado esta app», con un
tope de 100 usuarios en toda la vida del proyecto. Para quedar verificado con
`youtube.upload` y `youtube.force-ssl` —que Google clasifica como **sensibles**, no
restringidos— Google pidió:

- **Dominio verificado** en Search Console (`tu-parrilla.cl`) y que la página principal
  explique qué hace la app y enlace a la privacidad.
- Política de privacidad en ese dominio (existe) que mencione el uso de datos de Google.
- Un **video** que muestre el flujo de consentimiento y cómo se usan los permisos.
- Nombre, logo y correo de soporte en la pantalla de consentimiento; el logo obliga a
  verificación, sin logo se puede publicar sin ella pero con aviso al usuario.

Por ser sensibles y no restringidos, **no** pide la auditoría de seguridad externa (CASA);
eso es solo para Gmail, Drive y similares. Se envió el 2026-10-12 y se aprobó en dos días.
La aprobación no se hereda: un permiso nuevo o un cambio en la pantalla de consentimiento
pide verificar de nuevo.

### 4.2 Cuota de la YouTube Data API

Cada proyecto nace con **10.000 unidades al día** para todos sus usuarios juntos, y desde
el 1 de junio de 2026 con un cupo aparte de **100 subidas al día** (`videos.insert`; antes
cada subida gastaba 1.600 unidades del general, o sea seis videos al día en total). Lo que
se come el cupo general es leer comentarios: hasta unas 960 unidades por creador al día,
aun acotado a media hora (ver `src/lib/social/comentarios/ventana.ts`), más 50 por cada
respuesta. Con unos seis creadores activos se acaba.

Pedir más cuota es el **formulario de auditoría y extensión de cuota de YouTube API
Services**: revisan que la app cumple los términos de YouTube (cómo muestra los datos, qué
guarda, por cuánto tiempo, que no calcula métricas con ellos, que el usuario pueda
revocar) y piden un video y capturas. Tarda semanas y se puede pedir en paralelo con la
verificación del OAuth. Lo que la app hace para cumplir está en
`docs/google-verificacion-guion.md`, «Lo que la auditoría mira de los datos guardados».

### 4.3 Videos privados hasta la auditoría

Según la política de YouTube desde 2020, los videos subidos por un proyecto que no ha
pasado esa auditoría quedan **privados** aunque se pidan públicos. A este proyecto no se le
aplica: lo que subió Tu Parrilla el 2026-10-09 y el 2026-10-16 salió público, así que la
tarjeta de YouTube ya no lo advierte. Si un día un video sale «Privado» con candado, es esa
regla, y el aviso vuelve hasta la auditoría.

### 4.4 Tiempo

El más largo de los cuatro: entre un mes y dos, contando la cuota. Se puede empezar hoy
(Search Console y la pantalla de consentimiento no dependen de nada).

## 5. Lo que hay que hacer en la app (código)

Ordenado por lo que bloquea un trámite primero.

1. **Callback de borrado de datos de Meta** (bloquea el review). Una ruta
   `POST /api/social/facebook/deletion` que verifique el `signed_request` con el
   `INSTAGRAM_APP_SECRET`, borre las cuentas de Meta de ese usuario (credenciales, métricas,
   destinos programados que no salieron) y responda `{ url, confirmation_code }`, más una
   página `/borrado/<código>` que diga en qué estado quedó. Y el **deauthorize callback**,
   que es la misma verificación con otra acción (marcar sin credencial). Alcance: una ruta,
   una página, tests de la firma y del aislamiento por dueño; un día.
2. **Zona horaria por usuario.** Hecho. Existe el campo `users.zona`, el selector en Tu
   Cuenta (`/admin/cuenta`), y la zona pasa por el panel entero (el calendario,
   la cola, el editor de un corte, las ventanas de los links), por las acciones que
   guardan horas —quien está en Madrid escribe «19:00» y salen las 19:00 de Madrid— y por
   dentro: Los Números y Los Cortes agrupan en ella. La API con llave
   (`/api/schedule/posts`, `/api/metrics/posts`) y el lote leen y devuelven en la zona del
   dueño de la llave —el usuario que la generó en Tu Cuenta, o el admin si es
   `SCHEDULE_API_KEY`, la del despliegue—; `api/mobile/*`
   solo devuelve en ella, porque la app manda instantes absolutos. `SITE_TIMEZONE` se queda
   como la zona con la que nace un usuario (los cuatro `insert into users` la pasan) y la
   del sitio público. Lo que la app móvil no hace es *componer* la hora en la zona del
   dueño: eso quedó anotado en `docs/deuda-tecnica.md`.
3. **Avisos honestos antes de conectar.** En Los Fierros, junto a cada botón: Instagram
   pide cuenta Business/Creator con página de Facebook; YouTube publica en privado hasta la
   auditoría de cuota. (TikTok llevó el suyo, «solo en privado», hasta que se aprobó su
   auditoría de Direct Post, y se quitó.) Y en el
   error del diálogo de Meta, un mensaje que diga «esta app todavía no está abierta a todos»
   en vez del genérico de Facebook.
4. **Cupos y reparto de los crons.** Los crons de sync, comentarios y publicación recorren
   a todos los usuarios en un bucle dentro de una sola ejecución. Con decenas de usuarios
   el tiempo de ejecución y las cuotas por app (YouTube sobre todo) se agotan. Es el ítem 4
   de la hoja de ruta: cola de trabajo, cupo por usuario, y una alerta cuando una red se
   queda sin cuota. Primero con pocos usuarios no hace falta; con más de diez, sí.
5. **Plan de Vercel.** El plan Hobby es para uso **personal y no comercial**, y además
   limita los crons a dos (por eso el pinger externo). Abrir el producto a terceros pide
   **Vercel Pro** (USD 20/mes por asiento): más crons, más tiempo de ejecución, y estar en
   regla. Supabase (500 MB y pausa por inactividad en el plan gratis, ya cubierta por el
   pinger), Resend (100 correos al día, de sobra para invitaciones y avisos) y R2 (10 GB)
   aguantan una beta; la primera que se queda corta con videos es R2.

## 6. Orden propuesto

Todo lo de papeleo va en paralelo desde el día uno, porque cada trámite tarda semanas y
ninguno depende de otro. Lo de código se intercala por lo que cada trámite pide.

| Semana | Papeleo (dueño) | Código |
|---|---|---|
| 1 | Verificación de negocio en Meta (documentos). Auditoría de Direct Post de TikTok (formulario + video). Search Console y pantalla de consentimiento de Google. Vercel Pro. | Callback de borrado y deauthorize de Meta (§5.1). Avisos antes de conectar (§5.3). |
| 2 | Enviar App Review de Meta (videos por permiso) en cuanto la verificación de negocio esté. Formulario de verificación del OAuth de Google. | Zona horaria por usuario (§5.2). |
| 3–4 | Responder a los rechazos, si los hay. Formulario de cuota de YouTube. | Cupos y alerta de cuota (§5.4), si la beta pasa de diez usuarios. |
| 5–8 | Esperar a Google. | — |

**Mientras tanto se puede probar con gente real hoy mismo**, sin esperar ningún trámite:

- Meta: agregarlos como **Testers** de la app (App Roles); con rol, el diálogo funciona y
  todos los permisos actuales van con acceso estándar. Sirve para una beta cerrada de hasta
  unas decenas de personas.
- TikTok: pueden conectar y publicar con la privacidad que elijan (la auditoría de Direct
  Post ya pasó).
- YouTube: conectan sin cartel ni tope (la verificación del OAuth se aprobó el
  2026-10-14) y lo que publican sale público; la auditoría de cuota sube los cupos.

Eso da una beta cerrada útil para Instagram y Facebook (el uso principal) en la semana 1,
y la apertura de verdad al mes para Meta y TikTok, y al mes o dos para YouTube.

## 7. Preguntas abiertas que deciden alcance

1. **¿El privado (DM con el PDF) va en la primera vuelta de App Review de Meta?** Suma
   dos permisos, un video más y riesgo de rechazo; a cambio, la función que hoy está
   apagada se enciende junto con el resto. Recomendación: segunda vuelta.
2. **¿Empresa o persona para la verificación de negocio de Meta?** Meta acepta ambas con
   documentos distintos; con empresa es más directo. Decide quién firma.
3. **¿YouTube entra en la beta o se deja para después?** Es el trámite más largo y el que
   menos usa la app hoy. Si la beta es de creadores de Instagram y TikTok, YouTube puede
   esperar sin frenar nada.
4. **¿Hasta cuántos usuarios en la beta?** Por debajo de diez, nada de §5.4 hace falta;
   por encima, sí, y conviene saberlo antes de invitar.

## 8. Permisos red por red: lo pedido, lo que falta y en qué vuelta

Pasada del 2026-11-07, comparando lo que el producto hace o tiene escrito (README,
`docs/pendientes.md`, `src/lib/social/**`) con lo que el código pide al conectar
(`src/app/api/social/[network]/connect/route.ts`, `SCOPES_LOGIN_DE_INSTAGRAM` en
`instagram-login.ts`, `SCOPES_THREADS_EXTRA` en `threads.ts`). Sirve para armar cada vuelta de
una vez y no volver a grabar. Ningún permiso nuevo entra al pedido de siempre: los que esperan
revisión van detrás de su bandera, apagada, porque la ventana de la red rechaza el pedido entero
si nombra uno que la app no tiene activado.

| Permiso | Red | Qué lo usa | Estado | Vuelta |
|---|---|---|---|---|
| `instagram_basic`, `pages_show_list`, `pages_read_engagement`, `business_management` | Instagram y Facebook (Meta) | Conectar, encontrar la cuenta por su página, leer los posts | Aprobados, acceso avanzado (2026-10-19) | 1.ª, hecha |
| `instagram_manage_insights` | Instagram | Los Números | Aprobado | 1.ª, hecha |
| `instagram_content_publish` | Instagram | Publicar reels, fotos, carruseles, trial reels **e historias** | Aprobado | 1.ª, hecha. Nombrar las historias en el uso si Meta vuelve a revisar (`pendientes.md`) |
| `instagram_manage_comments` | Instagram | La Mesa y la palabra clave | Aprobado | 1.ª, hecha |
| `pages_read_user_content`, `pages_manage_engagement` | Facebook | La Mesa y la palabra clave | Aprobados | 1.ª, hecha |
| `pages_manage_posts` | Facebook | Publicar en la página, historias incluidas | Aprobado | 1.ª, hecha |
| `instagram_manage_messages`, `pages_messaging` | Instagram y Facebook | El privado de la palabra clave | Pedidos; código detrás de `META_PERMISOS_PRIVADO` y `COMENTARIOS_DM` | 2.ª, enviada el 2026-11-06 |
| `threads_basic`, `threads_content_publish` | Threads | Conectar y publicar | Pedidos; Threads en «Próximamente» salvo `THREADS_ABIERTO_PARA` | 2.ª, enviada el 2026-11-06 |
| `threads_manage_insights`, `threads_read_replies`, `threads_manage_replies` | Threads | Los Números y La Mesa | Escritos, sin pedir; detrás de `THREADS_PERMISOS_EXTRA` | 3.ª |
| `instagram_business_basic`, `…_content_publish`, `…_manage_comments`, `…_manage_messages`, `…_manage_insights` | Instagram (login de Instagram) | Conectar sin página de Facebook, con todo lo de arriba | Escritos, sin pedir; detrás de `INSTAGRAM_LOGIN_ABIERTO_PARA` | 3.ª |
| `ads_read` | Instagram y Facebook | «Lo pagado» en Los Números | Escrito, sin pedir; `META_PERMISOS_ANUNCIOS` | 3.ª |
| `ads_management` | Instagram y Facebook | «Promocionar» | Escrito, sin pedir; `META_PERMISOS_PROMOCIONAR` | 3.ª |
| Métricas de las historias de Instagram | Instagram | **Por decidir.** El alcance, las respuestas, la navegación y los clics de cada historia | No pide permiso nuevo: `instagram_manage_insights` (aprobado) o `instagram_business_manage_insights` (3.ª). Es código: Meta las da solo 24 horas, así que hay que leerlas antes de que venzan, o suscribir el webhook `story_insights`, que no existe para el login de Instagram (<https://developers.facebook.com/docs/instagram-platform/reference/instagram-media/insights/>) | Ninguna; si se hace antes de la 3.ª, mostrarlas en su video |
| `publish_video`, `read_insights` | Facebook | — | No se piden: Facebook publica hoy con `pages_manage_posts`, y `publish_video` espera a confirmar que la ventana lo acepta (un permiso rechazado anula el pedido entero, ver `connect/route.ts`); Meta retiró `read_insights` como permiso de login (las métricas de página no responden para esta página; solo se leen seguidores) | — |
| `user.info.basic`, `video.list` | TikTok | Conectar (el id y el nombre visible) y Los Números | Aprobados (app en producción, 2026-09-28) | Hecha |
| `video.upload`, `video.publish` | TikTok | Publicar en borrador y directo | Aprobados; auditoría de Direct Post aprobada (2026-10-06) | Hecha |
| `user.info.stats` en la app de siempre | TikTok | — | **No se pide**: los números de la cuenta llegan por la app de TikTok for Business (abajo), decidido el 2026-11-08. Pedirlo aquí sería otra revisión y reconectar cada cuenta, porque TikTok no suma permisos a un token (<https://developers.tiktok.com/doc/scopes-overview/>) | — |
| `user.info.profile` | TikTok | **Por decidir.** El @usuario: hoy la fila muestra el nombre visible, porque `user.info.basic` no trae el usuario (<https://developers.tiktok.com/bulletin/user-info-scope-migration>) | No se pide, en ninguna de las dos apps | Una revisión de la app de developers.tiktok.com, o sumarlo a la de TikTok for Business |
| «Get account user info» (`user.info.basic`, `user.info.stats`) | TikTok (app de TikTok for Business) | Reconocer la cuenta al autorizar (nombre visible); seguidores, «me gusta» y videos de por vida en Los Números («Tus cuentas», «TikTok, más a fondo») | Escrito y cerrado (`TIKTOK_COMENTARIOS_ABIERTO_PARA`); la app todavía no existe —se crea cuando aprueben el registro de desarrollador— | La revisión de la app nueva, con el formulario de acceso: los siete de este grupo juntos |
| «Get account insights» (`user.insights`) | TikTok (app de TikTok for Business) | Lo del día de la cuenta (visitas al perfil, views, alcance) en «Tus cuentas», y la audiencia (países, género, edad) en «TikTok, más a fondo» | Igual | Igual |
| «Get account media» (`video.list`, `video.insights`) | TikTok (app de TikTok for Business) | Guardados y alcance de cada video en «Tus publicaciones»; tiempo visto, lo vieron completo, seguidores que trajo y de dónde llegaron en la pieza («En TikTok, más a fondo»); los videos de los últimos siete días para La Mesa | Igual | Igual |
| «Get account comment» y «Manage account comment» (`comment.list`, `comment.list.manage`) | TikTok (app de TikTok for Business) | La Mesa y la palabra clave en TikTok | Igual; son los únicos que la autorización exige | Igual |
| «Business benchmark» | TikTok (app de TikTok for Business) | «Cuentas parecidas a la tuya» en «TikTok, más a fondo», con «Tu rubro» | Igual; su nombre en el token no está documentado, así que se pide y, si TikTok la niega, no se muestra | Igual |
| «Discover trending search keywords» (`discovery.search.words`) | TikTok (app de TikTok for Business) | «Lo que se busca en TikTok» en el compositor de La Parrilla | Igual; solo responde a cuentas con acceso avanzado o de empresa | Igual |
| `youtube.upload`, `youtube.force-ssl` | YouTube | Publicar, leer el canal y los videos, comentar | Verificados (2026-10-14) | Hecha |
| `yt-analytics.readonly` | YouTube | **Por decidir.** Suscriptores ganados por día, y lo ganado y el arrastre que hoy la política de 30 días borra (`pendientes.md`, «YouTube: la historia y el arrastre») | **No se pide.** En septiembre se descartó reconectar por él (`docs/superpowers/specs/2026-09-03-metricas-de-cuenta-design.md`). Pedirlo cambia la pantalla de consentimiento, y Google pide verificar de nuevo; después, cada canal reconecta | Con la auditoría de cuota (§4.2), o después de ella, como dice la entrada de `pendientes.md` |
| `youtube.readonly` | YouTube | — | No hace falta: `youtube.force-ssl` lo cubre | — |

Lo que sale de la tabla: la **tercera vuelta de Meta** ya tiene todo lo escrito (diez permisos);
si se deciden las métricas de las historias, no suman permisos pero sí una escena al video. En
**TikTok** la que importa es la de la app nueva de TikTok for Business, con sus siete permisos
del grupo «TikTok Accounts» —comentarios y números juntos, todo ya escrito—, y la app de siempre
se queda quieta; solo `user.info.profile` sigue por decidir. En **YouTube** no falta nada para lo
que el producto hace hoy.
