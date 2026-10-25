# Historias en Instagram y Facebook — diseño

**Fecha:** 2026-10-24.

**En una frase:** que un post pueda salir como **historia** en Instagram y en Facebook —sola o
en una secuencia que sale en orden—, programable desde el compositor del panel, la API, el CSV
y el teléfono, con una pantalla de teléfono pensada para eso, y que en la parrilla se vea como
su propio corte: el **choripán al paso**.

Se apoya en «Trial reels en Instagram» (`2026-09-28-trial-reels-design.md`): la historia viaja
por el mismo carril de opciones por destino que abrió esa entrega.

---

## 1. Qué ya existe

- **Opciones por destino.** `scheduled_post_targets.opciones` (`jsonb`) guarda lo que una red
  pidió elegir; la forma la valida `src/lib/social/publish/opciones.ts`. El trial reel ya vive
  ahí (`{ trialReel: true }`) y atraviesa los cuatro caminos que crean posts: el lote
  (`batch.ts`, que inserta por su cuenta), el compositor (`actions.ts` → `crear.ts`), el
  teléfono (`api/mobile/schedule` y su `check`) y los borradores (`borrador.ts`, que guarda
  los campos del formulario y traduce los del teléfono).
- **Facebook no recibe opciones.** `validarOpciones` rechaza cualquier cosa que no sea `null`
  fuera de TikTok e Instagram.
- **Publicadores.** `instagram.ts` crea contenedores (`/media`) y publica (`/media_publish`);
  un video queda `processing` con su `containerId` y la corrida siguiente consulta
  `status_code`. `facebook.ts` publica en `/feed`, `/photos` y `/videos`, y espera un video
  por su id. Ojo con `storyId()` en `facebook.ts`: es el id del post del *feed* (`page_post`),
  no una historia; se renombra a `idDelFeed` en esta entrega para que nadie los confunda.
- **El corte.** `formatoDe` (`src/lib/parrilla.ts`) decide la silueta solo por los archivos:
  entraña (video), tira (carrusel), bife (foto), chori (texto). En el modo día son nigiri,
  maki, sashimi y temaki (`pieza-sushi.tsx`). El teléfono tiene su copia, vigilada por test.
- **El publicador corre cada cinco minutos** (un pinger externo) y toma lo vencido en orden de
  `scheduledAt`. Dos posts a la misma hora no tienen orden garantizado.
- **Comentarios.** `comentarios/run.ts` también sondea destinos publicados de los últimos
  siete días que la sincronización todavía no trajo. Una historia no tiene comentarios.

## 2. Lo que las redes permiten (investigado el 2026-10-24)

| | Instagram | Facebook (página) |
|---|---|---|
| Cómo | contenedor `media_type=STORIES` con `image_url` o `video_url`, luego `media_publish` | foto: `/photos` con `url` y `published=false`, luego `/photo_stories` con `photo_id`. Video: `/video_stories` `upload_phase=start` → subir con header `file_url` a `rupload.facebook.com` → esperar `status` → `upload_phase=finish` |
| Foto | JPG, hasta 8 MB | jpg/png/…, hasta 10 MB |
| Video | MP4/MOV, 3–60 s, hasta 100 MB | MP4, 3–60 s (la guía dice 90 en un lado y 60 en otro: 60) |
| Texto | no lleva | no lleva |
| Enlace, stickers, encuestas | no por API | no por API |
| Permisos | los que ya tenemos (`instagram_content_publish` / `instagram_business_content_publish`) | los que ya tenemos (`pages_manage_posts`…) |
| Tope | cuenta para las publicaciones por día de la cuenta | no documentado |
| Programar en la red | no existe: publica nuestro cron | no existe |

Riesgos conocidos: Instagram rechazaba historias de **cuentas Creator** con el error `#10`
(«The user is not an Instagram Business»); no hay confirmación de que lo hayan levantado. Una
foto o video ya usado en un post de Facebook no se puede reusar como historia (no aplica: cada
historia sube su archivo).

Fuentes: developers.facebook.com, `content-publishing`, `ig-user/media`, `page-stories-api`.

## 3. El contrato

**Una historia es una opción por destino**, sin migración:

```ts
export type OpcionesInstagram = { trialReel: true } | { historia: Historia }
export type OpcionesFacebook = { historia: Historia }
/** `secuencia` y `orden` solo cuando la historia es parte de una secuencia. */
export type Historia = true | { secuencia: string; orden: number }
```

- **Un post historia lleva exactamente un archivo** (foto o video). Una secuencia de N
  historias son **N posts**, uno por archivo, cada uno con su lugar en la parrilla y su propio
  estado. Así una historia que falla no arrastra a las demás, y borrar o reprogramar una sigue
  siendo la regla de siempre.
- **Todos los destinos de un post historia son historia.** Mezclar «reel en Instagram e
  historia en Facebook» en un mismo post no se ofrece: si hace falta, son dos posts. Lo
  rechaza la validación con `Una historia va solo a Instagram y Facebook, y todos sus destinos son historia.`
- **Sin texto.** El `caption` de un post historia se guarda vacío; si llega texto se rechaza
  con `Una historia no lleva texto.` (mejor que perderlo en silencio). Los `atributos` sí.
- **Historia y trial reel se excluyen** (la forma de `OpcionesInstagram` ya lo impide).
- **Sin regla de palabra clave**: `Una historia no tiene comentarios: no lleva palabra clave.`
- **Media:** `errorDeMediaPorOpciones` suma la regla `Una historia es un solo archivo, foto o video.`
  En Instagram la foto de una historia tiene que ser JPG (Meta no acepta otra, y el almacén no
  convierte nada): una PNG o WebP hacia Instagram se rechaza al programar con
  `Instagram recibe la historia en foto solo en JPG.` —el compositor y el teléfono lo avisan
  antes, al elegir el archivo—. La duración (más de 60 s) y la forma (no vertical) se **avisan** en
  el compositor y el teléfono, que miden el archivo; el servidor no mide, y si Meta lo
  rechaza, el destino falla con lo que Meta dijo.

**En la API y el CSV**, igual que el trial reel:

```json
{ "fecha": "2026-11-02 19:00", "redes": ["instagram", "facebook"],
  "media": ["https://…/1.jpg"], "opciones": { "instagram": { "historia": true }, "facebook": { "historia": true } } }
```

Para una secuencia por API hay un atajo: una fila con `"historia": true` en el nivel de la
fila y **varios archivos** en `media` se expande en una historia por archivo, en ese orden,
con la misma `fecha` y una `secuencia` compartida. La respuesta trae un `postId` por historia
(`postIds`). Sin el atajo, cada fila es una historia suelta.

`GET /api/schedule/posts` ya devuelve las `opciones` por destino (PR #278): una historia se
reconoce ahí sin campo nuevo.

## 4. La secuencia sale en orden

Varias historias a la misma hora no basta: el publicador no garantiza el orden entre posts de
la misma hora, y un video que procesa deja pasar a la foto de atrás. La regla:

- Cada historia de una secuencia guarda `{ secuencia, orden }` en sus opciones; todas llevan
  la misma `scheduledAt`.
- Antes de publicar el destino de orden `n > 1`, el publicador mira el destino de **la misma
  cuenta** con orden `n − 1` en esa secuencia. Si no está `published`, el intento devuelve
  `deferred` sin gastar intento (espera corta, la corrida siguiente). Si ese anterior
  **falló** o ya no existe (lo borraron), la historia sigue sola: una que se quemó no deja
  atascadas a las demás.
- La consulta va atada al dueño (`aislamiento.test.ts` suma su caso).

## 5. El publicador

**Instagram** (`instagram.ts`): una rama antes de la foto suelta. Contenedor `STORIES` con
`image_url` o `video_url`, sin `caption` ni `cover_url`. Foto: se publica en la misma corrida
(mismo camino que la foto suelta). Video: queda `processing` y reutiliza la espera por
`status_code` que ya existe. El error `#10` de una cuenta Creator se traduce a una frase
definitiva, sin reintentos: `@<cuenta> no puede publicar historias por API: Instagram solo lo permite a cuentas de empresa (Business). Cámbiala en Instagram o publica la historia desde la app.`
El tope diario se trata igual que en el feed (`deferred`).

**Facebook** (`facebook.ts`):
- Foto: `/photos` con `url` del almacén y `published=false` → `/photo_stories` con el
  `photo_id`. Una sola corrida. `externalId` = el `post_id` que devuelve.
- Video: `start` → subida con `file_url` → queda `processing` con el `video_id` como
  `containerId`. La corrida siguiente consulta `status`; listo → `finish` → `post_id`. Un
  `containerId` de historia se distingue del de un video del feed por las opciones del
  destino, no por el id.

Los videos se borran del almacén al publicarse, como siempre (`limpiarMedia`).

## 6. Lo que se protege alrededor

- **Comentarios:** `comentarios/run.ts` excluye los destinos historia del sondeo de lo
  recién publicado. Sin esto, varias historias seguidas fallando al listar comentarios
  agotan los tres fallos seguidos de la cuenta y dejan sin mirar a los posts de verdad.
- **Sincronización y métricas:** las historias no aparecen en `/media` ni en
  `/published_posts`, así que nunca entran a `social_posts` ni rompen nada. **No tienen
  métricas** en esta entrega: Instagram las da solo durante 24 horas. Queda en
  `docs/pendientes.md`.
- **Trial reels:** `aprenderTrialReels` solo mira `trialReel`; no cambia.

## 7. La parrilla: el choripán al paso

- `Formato` suma `'choripan'`, con `NOMBRE_FORMATO.choripan = 'Historia'` (lo que lee el lector
  de pantalla y el pie de la carta). En pantalla, el nombre del corte es **choripán al paso**.
- `formatoDe` recibe las opciones de los destinos: si todos son historia, el corte es
  `choripan`, sin importar el archivo. Es el mismo precedente que `selloDe`, que ya mira
  opciones.
- Silueta de noche: un chori parado dentro de un pan cortado, vertical (la historia es 9:16).
  Se distingue del chori de texto, que va acostado y sin pan. En el modo día: un **onigiri**,
  lo que se come al paso en Japón. Una secuencia lleva un número chico («1/3») junto al corte.
- La copia del teléfono (`mobile/src/lib/parrilla.ts`) suma lo mismo; `parrilla.test.ts`
  vigila que no se aparten.

## 8. Las superficies

**Compositor del panel** (`composer.tsx`): arriba, un selector **«Post · Historia»**. En
Historia:
- el texto, la portada y la palabra clave desaparecen;
- solo se ofrecen cuentas de Instagram y Facebook;
- los archivos se muestran como una fila de **tarjetas verticales 9:16** en el orden en que
  van a salir, con flechas para cambiar el orden y una «×» para sacar una;
- cada tarjeta avisa, en ámbar, si el archivo no es vertical («Se va a ver con bordes») o si
  el video pasa de 60 s («Instagram corta en 60 s: súbelo partido»);
- el botón dice «Programar historia» o «Programar N historias».
- El bloque de trial reel no aparece en modo Historia.

**Teléfono** (`publicar.tsx`), la pantalla con más cuidado:
- El mismo selector «Post · Historia» arriba, como dos chips grandes.
- En Historia, lo primero es el **visor**: el archivo elegido ocupa el ancho de la pantalla en
  9:16, recortado como se va a ver, con una barra de progreso arriba por cada historia (como
  en Instagram) y deslizar a los lados para pasar de una a otra. Debajo, la tira de
  miniaturas verticales: mantener apretada una la deja arrastrar para cambiar el orden.
- Los avisos de forma y duración van sobre el visor, en la historia que los tiene.
- Las cuentas (solo Instagram y Facebook), el «Cuándo» y el botón «Programar historia» quedan
  abajo, como hoy.
- Todo con lo que la app ya trae (`expo-image`, `react-native-reanimated`,
  `react-native-gesture-handler`, el selector de imágenes que ya da ancho, alto y duración):
  **sin módulos nativos nuevos, sale por OTA**. Para el video, el visor muestra su primer
  cuadro (miniatura) con el ícono de play y la duración; reproducirlo pediría `expo-video`,
  que es nativo, y queda fuera.
- El borrador guarda el modo y el orden.

**La parrilla** (panel y teléfono): el choripán al paso; en el detalle del post, «Historia en
Instagram · @cuenta» y, si es parte de una secuencia, «2 de 3».

## 9. Entrega en tres partes

Cada parte deja la documentación cierta al terminar (`AGENTS.md`).

1. **El motor:** contrato de opciones, validación en los cuatro caminos, los dos publicadores,
   la secuencia en orden, los resguardos de comentarios, el corte `choripan` (datos y
   siluetas) y la API/CSV con su documentación (`api-llm.md`, `api-editor.md`, `api.json`).
   Probable con el arnés de pruebas de cada publicador, sin red.
2. **El compositor del panel**, con la página de la wiki (`la-parrilla.md`).
3. **El teléfono**, con `app-movil.md` y `mobile/README.md`; despliegue web primero y OTA a
   los dos canales después.

## 10. Fuera de alcance

- Métricas de historias (24 h en Instagram; las de Facebook no están documentadas).
- Enlaces, stickers, menciones o encuestas: la API no los permite (las menciones sí, desde
  2025, pero sin sticker; se pueden sumar después).
- Reproducir el video en el visor del teléfono (necesita `expo-video`, módulo nativo).
- Cortar un video largo en varias historias.
- Programar una historia desde TikTok, YouTube, Threads o X.

## 11. Puntos abiertos

- **Cuentas Creator en Instagram:** se sabrá con la primera prueba real. Si lo rechaza, el
  mensaje de la sección 5 ya está; si no, se borra la frase.
- **El primer intento real** en Facebook con video: la guía de Meta tiene contradicciones
  (60 vs. 90 s). Se prueba con una página propia antes de anunciarlo.
