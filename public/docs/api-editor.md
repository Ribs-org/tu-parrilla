# API del calendario de Tu Parrilla — guía para el editor de contenido

Escrita para un LLM que programa y analiza contenido. Es autosuficiente: todo lo que
puedes hacer, con qué forma exacta, y qué significa cada respuesta. Si algo no está
aquí, el sistema no lo hace.

## Qué es este sistema

Un calendario de publicación, conectado a las cuentas reales del dueño de tu llave —la
persona que te la dio—. Tú
programas posts por API; un proceso automático los publica a su hora en cada red y
guarda el resultado. Otro proceso sincroniza a diario las métricas de lo publicado.
Cierras el ciclo leyendo esas métricas junto a las etiquetas que tú mismo pusiste al
programar.

**Redes que publican hoy:** `instagram`, `facebook`, `youtube`, `tiktok`. `threads` y `x` están
en «Próximamente»: el dueño no puede conectarlas, y una fila que las nombre se rechaza con su
frase (`Threads todavía no está disponible en Tu Parrilla: próximamente.` o
`X / Twitter todavía no está disponible en Tu Parrilla: próximamente.`). Lo que esta guía dice
de ellas vale para el día en que se abran.

**Zona horaria:** todo lo que escribes y lees en horas está en la zona horaria del
dueño de la llave — la que tiene puesta en Tu Cuenta (`/admin/cuenta`).

## Autenticación

Una sola llave para todos los endpoints, en cada petición:

```
Authorization: Bearer <tu llave>
```

La llave te la da el dueño: la genera en Tu IA (`/admin/ia`), y las que salen de
ahí empiezan con `tp_`.
Todo lo que hagas con ella lo haces a su nombre —sus cuentas, sus posts, su zona horaria—,
y no ves nada de nadie más. Sin ella, con una incorrecta o con una que el dueño revocó:
`401` con el cuerpo `No autorizado`. Un `401` con una llave que antes andaba significa que
la revocaron: pídele una nueva al dueño, no reintentes.

Base: `https://tu-parrilla.cl`

**Si el dueño se pierde en su panel** (dónde se conecta una red, dónde se genera la llave, qué
significa un error que le salió), la wiki de la interfaz lo cuenta pantalla por pantalla,
con el texto literal de cada botón: `https://tu-parrilla.cl/docs/ui/index.md`. Esta guía nombra
las pantallas como se ven de noche; si el dueño usa el modo día, La Parrilla se llama «La
Barra» y Los Fierros, «Los Cuchillos» (la wiki tiene la lista entera, en «El modo día»).

---

# 1. Programar posts — `POST /api/schedule/batch`

```http
POST /api/schedule/batch
Authorization: Bearer <tu llave>
Content-Type: application/json
```

```json
{
  "posts": [
    {
      "fecha": "2026-09-08 19:00",
      "texto": "El primer renglón es el título en YouTube.\n\nY el resto es la descripción.",
      "redes": ["instagram", "facebook", "youtube"],
      "media": ["https://drive.usercontent.google.com/download?id=ABC&export=download"],
      "portada": "https://ejemplo.com/portada.jpg",
      "atributos": { "hook": "pregunta-polemica", "tema": "negocios", "estilo": "a-camara" },
      "opciones": { "tiktok": { "modo": "directo", "privacidad": "SELF_ONLY", "comentarios": true, "comercial": "no" } },
      "ref": "septiembre-fila-12"
    }
  ]
}
```

El destino de cada post se elige con `cuentas` o con `redes` — no hace falta el campo
`cuentas` si nombrar la red alcanza (ver la sección de cada campo, abajo).

**Máximo 50 posts por request** (el tope vive en `MAX_BATCH_ITEMS`). Más de eso: `400` con `Máximo 50 posts por lote.`
Cuerpo que no sea `{ posts: [...] }`: `400` con
`El cuerpo debe ser JSON con { posts: [...] }.`

## Los campos

### `fecha` (obligatorio)

Exactamente `YYYY-MM-DD HH:MM` (también se acepta una `T` en vez del espacio). Hora
de la zona del dueño, futura, precisión de minutos.

No se aceptan segundos, ni `Z`, ni offsets: un ISO completo se **rechaza** a
propósito, para que nunca se reinterprete tu instante UTC como hora de pared.

### `texto` (obligatorio salvo que haya media)

El caption. Se usa completo en todas las redes, con una excepción: en YouTube el
**primer renglón no vacío** (recortado a 100 caracteres) se convierte en el **título**
del video, y el texto completo va como descripción. Escribe pensando en eso.

Límites, que solo aplican si esa red está en el post:
- con `x`: 280 caracteres
- con `threads`: 500 caracteres
- siempre: 2200 caracteres (límite de Instagram)

### `cuentas` (opcional) — elige cuentas exactas, sin ambigüedad

Array de identificadores de cuenta. Si la fila trae `cuentas` con al menos un elemento,
**esas mandan**: es la única forma de elegir a cuál de dos cuentas de la misma red sale
el post. Para elegir destino, `redes` se ignora cuando `cuentas` no está vacío — aunque
la mandes igual, sigue debiendo tener nombres válidos y sin repetir (ver abajo), así que
lo más simple es no mandarla en ese caso.

**De dónde salen los identificadores:** no los inventas ni los adivinas. `GET
/api/schedule/cuentas` (sección 3c, más abajo) los lista todos, cada uno con su red y su
handle, también el de una cuenta recién conectada que todavía no tiene nada programado. El
dueño ve el mismo id en Los Fierros (`/admin/accounts`), en el detalle que abre la flecha de
cada fila, con un botón para copiarlo; y cada destino de `GET /api/schedule/posts` (sección
3) trae el suyo en `cuentaId`.

Lo que **no** resuelve la ambigüedad: programar primero con `redes` para leer el id
después en el post recién creado. Esa entrada solo se acepta cuando la red no es
ambigua (ver abajo) — que es justo el caso en que nombrar la red ya alcanza y el id no
hacía falta.

Un identificador que no es tuyo, o que es de una cuenta desconectada, rechaza la fila
entera — ver la tabla de errores.

En el CSV (panel, no esta API), `cuentas` es la octava columna, después de `regla`,
con los identificadores separados por `|` igual que `redes` y `media`.

### `redes` (obligatorio si la fila no trae `cuentas`)

Array con una o más de: `instagram`, `facebook`, `youtube`, `tiktok` (`threads` y `x`, en
«Próximamente», se rechazan).
Sin repetir. Un mismo post sale a todas las que pongas.

Cada nombre se resuelve a una cuenta **solo si tienes exactamente una** conectada de
esa red — es el atajo para cuando no hay ambigüedad, y sigue siendo la forma más simple
de programar si todavía solo tienes una cuenta por red. Con dos cuentas conectadas de la
misma red, nombrar solo la red ya no alcanza: la fila se rechaza nombrando las cuentas
candidatas y sus handles, y hay que usar `cuentas` para decir cuál.

Una fila sin `cuentas` y sin `redes` (o con ambas vacías) se rechaza: no hay a dónde
publicar.

### `media` (opcional)

Array de **URLs públicas**. El sistema las descarga (30 s de tope por archivo),
verifica que el tipo real coincida, y **las re-sube a su propio almacenamiento** —
la URL de origen puede morir después sin afectar la publicación.

- Imágenes: `.jpg .jpeg .png .gif .webp`
- Videos: `.mp4 .mov .webm`
- **Sin extensión reconocible también sirve**: el tipo lo decide el `Content-Type`
  real de la descarga, que tiene que ser uno de esos mismos formatos (`image/jpeg`,
  `image/png`, `image/gif`, `image/webp`, `video/mp4`, `video/quicktime`, `video/webm`): un
  `image/svg+xml` o un `video/x-matroska` rechazan la fila.
- **Hasta 500 MB por archivo**: uno que declara más, o que pasa de eso mientras baja, rechaza
  la fila sin guardarse. Esto es lo que hace funcionar los links directos de Google
  Drive: usa la forma `https://drive.usercontent.google.com/download?id=<ID>&export=download`
  con el archivo compartido como «cualquiera con el enlace». El link normal de
  «compartir» devuelve una página HTML y la fila se rechaza.

### `portada` (opcional)

Una URL pública de imagen **JPG o PNG** para usar como portada del video. Solo tiene
sentido con video en `media`.

Dónde se aplica: **Instagram** (portada del reel) y **Facebook** (miniatura del
video), enviadas junto con el video; **YouTube** (thumbnail) se aplica después de
subir — si eso fallara, el video igual queda publicado, sin portada. **Threads y X**
la ignoran sin error.

### `atributos` (opcional) — tu memoria de decisiones creativas

Un objeto plano, de valores simples (texto, número o booleano), máximo 20 claves y
2000 caracteres serializado:

```json
"atributos": { "hook": "pregunta-polemica", "tema": "negocios", "serie": "mut", "duracion": "30-60" }
```

**Las claves y los valores los eliges tú.** El sistema los guarda tal cual y te los
devuelve junto a las métricas. Ese es el mecanismo con el que puedes descubrir qué
funciona: etiqueta de forma consistente lo que decides y después correlaciona. El dueño ve
lo mismo en su panel: Los Números tiene «Comparar por atributo», con las medianas de cada
valor —entre ellas «contra su cuenta», que compara a la misma edad y dentro de cada
cuenta—, y «Tu mejor 10 %», que dice qué se repite entre lo mejor y entre lo peor.

#### El vocabulario recomendado

Es opcional, y el sistema no lo valida: si no te sirve, usa el tuyo. Pero si etiquetas para
que el dueño compare, estas claves cubren lo que más se pregunta —qué tema pica, qué hook
engancha, y si algo de la edición hizo la diferencia—, y usarlas igual en todos los posts es
lo que permite comparar.

| Clave | Qué anota | Valores de ejemplo |
|---|---|---|
| `tema` | De qué trata: el tema principal, uno solo | `negocios`, `edicion`, `finanzas`, `recetas` |
| `hook` | Cómo abre: lo que pasa en los primeros 3 segundos | `pregunta`, `pregunta-polemica`, `dato`, `promesa`, `historia`, `lista`, `antes-despues`, `error-comun` |
| `estilo` | Cómo está hecho | `a-camara`, `voz-en-off`, `tutorial`, `entrevista`, `b-roll`, `meme`, `texto` |
| `serie` | La serie, si es parte de una | su nombre corto: `mut`, `lunes-de-numeros` |
| `color` | El tratamiento de color dominante | `calido`, `frio`, `saturado`, `desaturado`, `blanco-y-negro`, `de-marca` |
| `fuente` | La tipografía del texto en pantalla | su nombre (`montserrat`, `bebas-neue`), o `sin-texto` |
| `ritmo` | Cada cuánto hay un corte de edición | `rapido` (cada 1 a 2 segundos), `medio` (cada 3 a 5), `lento` (más de 5), `plano-secuencia` |
| `musica` | Qué suena | `tendencia`, `biblioteca`, `original`, `voz-sola`, `sin-musica` |
| `duracion` | El largo del video, en tramos de segundos | `0-15`, `15-30`, `30-60`, `60-90`, `90+` |

Cuatro reglas para que se puedan comparar:

- **Un valor por clave.** Los atributos no aceptan listas: si un post toca dos temas, elige
  el principal.
- **Minúsculas, sin tildes, con guiones en vez de espacios** (`voz-en-off`, no `Voz en off`).
  El panel compara los valores tal como están escritos, salvo los espacios de los bordes:
  «Pregunta» y «pregunta» son dos filas.
- **Tramos y categorías, no números exactos.** `"duracion": 42` deja cada largo en su propia
  fila; con `"duracion": "30-60"` se juntan y se comparan.
- **Siempre lo mismo.** `"hook": "pregunta"` en unos y `"gancho": "pregunta-directa"` en otros
  hace imposible comparar. Si cambias el vocabulario, que sea para los posts nuevos.

Y no anotes lo que no decidiste: si no sabes el color de un video, no mandes `color`. Una
clave que falta cae en «sin color», que es la vara contra la que se compara; un valor puesto
por poner la ensucia.

Dos nombres que conviene no usar: `formato`, porque el panel ya llama así al tipo de post
(«Reel», «Carrusel»…) en «Tu mejor 10 %» y quedarían dos «formato» distintos; y `corte`,
porque en el panel un corte es el post mismo (la entraña, la tira, el bife, el chori). Para
eso están `estilo` y `ritmo`.

**Una sola clave tiene significado: `pieza`.** Los posts con el mismo valor de `pieza` son
versiones de una misma pieza, y el panel los muestra juntos, lado a lado. Úsala cuando
pruebes variantes de un mismo video: dos hooks, o el trial reel y el reel normal en la
misma cuenta. Cada variante es un post aparte —un post no puede ir dos veces a la misma
cuenta, y sus atributos son uno solo—, así que sin `pieza` nada las une:

```json
{ "atributos": { "pieza": "chimichurri-30s", "hook": "pregunta" } }
{ "atributos": { "pieza": "chimichurri-30s", "hook": "lista" } }
```

No la uses como `serie`: es para variantes del mismo contenido, no para un tema que se repite.

### `opciones` (obligatorio si algún destino es una cuenta de TikTok; opcional para Instagram)

Lo que cada destino exige elegir. La clave del objeto **no
es la red**: es el identificador de la cuenta destino. Para no obligarte a conocer los
identificadores cuando no hace falta, cada clave se resuelve con la misma regla que
`redes`: se busca primero entre los identificadores de cuenta de los destinos de la
fila, y si no coincide con ninguno se acepta como **nombre de red**, resuelta a su
destino solo si la fila tiene exactamente uno de esa red. En el CSV, `opciones` es la
sexta columna, después de `portada`, con el mismo JSON entre comillas dobles escapadas.

Con una sola cuenta de TikTok en la fila (el caso normal), seguir escribiendo `"tiktok"`
como clave funciona igual que siempre:

```json
"opciones": {
  "tiktok": {
    "modo": "directo",
    "privacidad": "SELF_ONLY",
    "comentarios": true,
    "duo": false,
    "pegar": false,
    "comercial": "no"
  }
}
```

Con `cuentas` y dos cuentas de TikTok en la misma fila, `"tiktok"` como clave es
**ambiguo** — la fila se rechaza nombrando las dos cuentas — y hace falta una clave por
cuenta:

```json
"opciones": {
  "<id de la primera cuenta de TikTok>": { "modo": "directo", "privacidad": "SELF_ONLY", "comercial": "no" },
  "<id de la segunda cuenta de TikTok>": { "modo": "borrador" }
}
```

No mezcles las dos formas para el mismo destino: con una sola cuenta de TikTok en la
fila, `"tiktok"` y su id resuelven al mismo destino, así que traer las dos claves a la
vez (`{"tiktok": …, "<id>": …}`) es ambiguo igual que traer dos cuentas — la fila se
rechaza nombrando las dos claves en vez de quedarse en silencio con la última que trae
el JSON.

- `modo`: `directo` publica en el perfil a la hora programada; `borrador` deja el video o las
  fotos en la bandeja de TikTok del dueño para terminarlos desde el teléfono. En `borrador`
  los demás campos se ignoran.
- `privacidad` (obligatoria en `directo`): `PUBLIC_TO_EVERYONE`, `MUTUAL_FOLLOW_FRIENDS`,
  `FOLLOWER_OF_CREATOR` o `SELF_ONLY`, siempre que la cuenta la ofrezca (TikTok decide cuáles
  ofrece cada cuenta).
- `comentarios`, `duo`, `pegar`: booleanos, ausentes valen `false`. `duo` y `pegar` no
  aplican a fotos.
- `comercial`: `no`, `marca_propia` (etiqueta «Contenido promocional») o `patrocinado`
  (etiqueta «Colaboración pagada»; no puede ir con `SELF_ONLY`).

Media de TikTok: **un solo video** (mp4, mov, webm) **o de 1 a 35 fotos** (jpg, webp),
nunca mezcla.

**Instagram — trial reel.** Con un destino de Instagram, `opciones` acepta:

```json
"opciones": { "instagram": { "trialReel": true } }
```

Con dos cuentas de Instagram en la misma fila, `"instagram"` como clave es ambiguo, igual
que con TikTok: hay que usar el id de cada cuenta como clave (`{ "<id de la cuenta>": {
"trialReel": true } }`).

Un trial reel solo lo ven, al principio, quienes no siguen la cuenta; **el dueño lo
comparte con todos desde la app de Instagram** cuando quiera. No hay graduación
automática por API — nada acá la dispara ni la consulta.

**Solo aplica a un video.** Con fotos, carrusel o sin ningún video en `media`, la fila se
rechaza con `Un trial reel es un solo video, sin fotos.`, antes de subir nada.

**La elegibilidad se descubre al publicar, no al programar.** Instagram tiene que tener la
función habilitada en esa cuenta (profesional, pública y con seguidores suficientes, según
los términos de Meta): una fila aceptada acá puede fallar después en ese destino, con su
propia frase: `Instagram no permite trial reels en esta cuenta.` Ese rechazo lo reconoce
Meta como definitivo, así que el destino queda en fallo en la misma corrida, sin reintentos
—a diferencia de un error de red normal, que se reintenta hasta tres veces antes de fallar.

**Después no hay forma de saber por API si se graduó.** Eso se mira en la app de Instagram.

### `regla` (opcional) — respuesta automática por palabra clave

```json
"regla": { "palabra": "GUIA", "mensaje": "Acá tienes la guía: https://www.vicente-pareja.cl/guia", "respuestaPublica": "Te lo mandé por privado 📩" }
```

Cuando alguien comente esa palabra (completa, sin importar mayúsculas ni tildes), el
sistema responde solo en la corrida siguiente del cron, en Instagram, Facebook y YouTube
(TikTok todavía no tiene cola de comentarios, así que una regla en un post que solo va a
TikTok no hace nada). Hoy el mensaje con el enlace se publica siempre como `mensaje`, la
respuesta pública; el privado (`respuestaPublica` en público y `mensaje` por DM, en
Instagram y Facebook) llega en una próxima entrega. Si el enlace es del sitio propio se le
agrega `?s=dm-<palabra>` y aparece como fila propia en Analítica. `palabra`: una sola
palabra, hasta 30 letras. `mensaje`: 1 a 1000 caracteres. `respuestaPublica`: opcional, 1 a
300. En el CSV es la séptima columna, después de `opciones`.

`documentoUrl` (opcional): un enlace absoluto (`http://` o `https://`) a un PDF de hasta
25 MB. Se descarga al programar el post — no tres días después, cuando alguien ya comentó
— y se copia al almacenamiento propio, porque el enlace que mandaste puede morir antes de
que alguien comente, o ser un enlace de Drive que sirve una página HTML y no el PDF. El
documento **nunca se manda como adjunto**: su enlace (ya el propio, no el tuyo) se agrega
al final de `mensaje`, separado por una línea en blanco, así que hoy sale dentro de la
misma respuesta pública que el resto de `mensaje` — la nota del párrafo de arriba sobre el
privado aplica igual al documento.

### `ref` (opcional, recomendado) — para reenviar un lote sin duplicar

```json
"ref": "septiembre-fila-12"
```

Un texto tuyo, de 1 a 100 caracteres, que identifica la fila: el id de la fila en tu
planilla, por ejemplo. Es único por dueño de la llave: si mandas una fila con una `ref` que
ya entró, no se programa de nuevo y vuelve el post que ya existía, con `"repetido": true`
(ver «Respuesta»). Se recortan los espacios de los bordes.

Sirve para el caso del lote cortado: si la respuesta no llega (se acabó el tiempo con muchas
descargas, se cortó la conexión), reenvía **el lote entero, con las mismas `ref`**. Las filas
que ya habían entrado vuelven como repetidas, sin descargar su media otra vez ni volver a
validarse —aunque su hora haya pasado desde el primer envío—, y se programan solo las que
faltaban.

La `ref` **no compara contenidos**: si cambiaste el texto de una fila y la reenvías con la
misma `ref`, vuelve el post de antes, sin el cambio. Para cambiar un post, bórralo
(`DELETE /api/schedule/posts/{id}`) y mándalo de nuevo; una vez borrado, su `ref` queda
libre. Sin `ref`, reenviar una fila la programa otra vez.

## Reglas por red (las que rechazan una fila)

| Regla | Cuándo se rompe | Frase exacta |
|---|---|---|
| Red en «Próximamente» | `threads` o `x` en `redes`, o una cuenta suya en `cuentas` | `Threads todavía no está disponible en Tu Parrilla: próximamente.` (o `X / Twitter todavía no está disponible en Tu Parrilla: próximamente.`) |
| Instagram, YouTube y TikTok exigen archivo | los pones sin `media` | `Instagram, YouTube y TikTok necesitan al menos un archivo.` |
| Un post necesita algo | sin texto y sin media | `Escribe un texto o adjunta un archivo.` |
| X no recibe video | `x` + un video | `X aún no recibe video desde el calendario.` |
| X hasta 4 imágenes | `x` + 5 o más | `X recibe hasta cuatro imágenes.` |
| Threads: un archivo | `threads` + 2 o más | `Threads recibe un solo archivo por post.` |
| Tope general | 11 o más archivos, con alguna red además de `tiktok` (una fila solo con `tiktok` admite hasta 35 fotos) | `Máximo diez archivos por publicación.` |
| Al menos un destino | sin `cuentas` y sin `redes` (o ambas vacías) | `Elige al menos una cuenta o una red.` |
| Fecha futura | hora ya pasada | `La hora debe estar en el futuro.` |

Las reglas de `x` y de `threads` quedan para cuando salgan de «Próximamente»: hoy esas filas
se rechazan antes, con la frase de la primera.

Facebook además no admite **mezclar** video y fotos en un mismo post; eso se detecta
al publicar y el destino falla con `Facebook no admite mezclar video y fotos en un post.`

Instagram acepta: 1 foto, 1 video, o 2–10 fotos (carrusel).

## Errores por fila (formato y contenido)

| Frase exacta | Qué la causa |
|---|---|
| `La fecha no se entendió (usa YYYY-MM-DD HH:MM).` | formato de fecha inválido |
| `Red desconocida o sin publicación: <red>.` | red inexistente |
| `Hay redes repetidas en la fila.` | la misma red dos veces |
| `No se pudo leer una media de la fila.` | descarga fallida, timeout, o tipo ajeno (HTML, PDF) |
| `La portada requiere un video en media.` | portada sin video |
| `La portada debe ser una imagen.` | la portada resultó ser video u otra cosa |
| `La portada debe ser JPG o PNG.` | portada gif/webp u otro formato |
| `Los atributos deben ser un objeto plano de valores simples.` | array, anidado, o excede 20 claves / 2000 chars |
| `El texto excede los 280 caracteres de X.` | caption largo con `x` en las redes |
| `El texto excede los 500 caracteres de Threads.` | caption largo con `threads` |
| `El texto es demasiado largo para Instagram.` | caption sobre 2200 |
| `TikTok necesita que elijas la privacidad.` | un destino de TikTok en la fila sin sus `opciones`, o `directo` sin `privacidad` válida |
| `Un contenido patrocinado no puede ser privado.` | `comercial: patrocinado` con `SELF_ONLY` |
| `Las opciones de la red no se entendieron.` | `opciones` no es objeto, `modo` desconocido, casilla no booleana, u opciones para un destino que no las pide |
| `«<handle>»: <cualquiera de las dos frases de TikTok de arriba>` | la fila tiene **dos** cuentas de TikTok y la que falló no se puede nombrar por red sola, así que el handle va primero |
| `«<red>» en opciones es ambiguo: la fila tiene N cuentas de esa red (<handles>). Usa el id de cada cuenta como clave.` | la clave de `opciones` nombra una red con dos o más destinos en esta fila |
| `«<clave1>» y «<clave2>» en opciones nombran el mismo destino. Deja una sola clave por destino.` | dos claves de `opciones` (por ejemplo el id de una cuenta y el nombre de su única red) resuelven al mismo destino |
| `TikTok recibe un video, o hasta 35 fotos JPG o WebP.` | dos videos, mezcla, más de 35 fotos, png/gif, o video que no es mp4/mov/webm |
| `Un trial reel es un solo video, sin fotos.` | `opciones.<destino>.trialReel: true` con fotos, carrusel, dos videos o sin ningún video en `media` |
| `Instagram no permite trial reels en esta cuenta.` | **no es un error de fila:** la fila con `trialReel: true` se acepta al programar; esta frase aparece después, en el `error` del destino que ya publicó (panel y `GET /api/schedule/posts`), porque Instagram solo revela la elegibilidad al crear el contenedor |
| `Una de las cuentas elegidas no es tuya.` | un identificador en `cuentas` que no es una cuenta del dueño (o no existe) |
| `La cuenta <handle> no está conectada. Vuelve a conectarla en Los Fierros.` | un identificador en `cuentas` que existe pero perdió la credencial — **solo con `cuentas`**: con `redes`, una cuenta desconectada da la frase de abajo |
| `No hay una cuenta de <red> conectada.` | un nombre en `redes` sin ninguna cuenta *conectada* de esa red — no tiene ninguna, o la única que tiene está desconectada; las dos dan la misma frase |
| `Tienes N cuentas de <red> (<handles>). Elige cuál con «cuentas».` | un nombre en `redes` con dos o más cuentas conectadas de esa red — hay que repetir la fila usando `cuentas` |
| `La palabra clave es una sola palabra, sin espacios, hasta 30 letras.` | `regla.palabra` vacía con mensaje, con espacios o símbolos, o `regla` que no es objeto |
| `El mensaje del privado va de 1 a 1000 caracteres.` | `regla.mensaje` ausente, vacío o largo |
| `La respuesta pública va de 1 a 300 caracteres.` | `regla.respuestaPublica` larga |
| `El documento tiene que ser una URL absoluta a un PDF de hasta 25 MB.` | `regla.documentoUrl` no es una URL absoluta http/https, o sí lo es pero al descargarla no resultó un PDF de hasta 25 MB (u otro fallo de descarga) |
| `«ref» tiene que ser un texto de 1 a 100 caracteres.` | `ref` vacía, de puros espacios, de más de 100 caracteres, o que no es texto (un número, por ejemplo) |
| `No se pudo guardar la fila. Inténtalo de nuevo.` | fallo transitorio de base de datos |

## Respuesta

`200` siempre que el lote se procesó — **incluso con filas rechazadas**: el rechazo
por fila es dato, no error del endpoint.

```json
{
  "resultados": [
    { "index": 0, "ok": true,  "postId": "3f2a…" },
    { "index": 1, "ok": false, "error": "El texto es demasiado largo para Instagram." },
    { "index": 2, "ok": true,  "postId": "9c41…", "repetido": true }
  ]
}
```

`index` es la posición en tu array `posts` (base 0). `repetido: true` dice que esa fila
traía una `ref` que ya había entrado: el `postId` es el del post que ya existía, y no se
programó nada nuevo.

**Éxito parcial:** las filas buenas quedan programadas aunque otras fallen. Corrige
las malas y reenvíalas. Con `ref` puedes reenviar el lote entero: lo que ya entró vuelve
como repetido. Sin `ref` no hay deduplicación: reenviar una fila ya programada la programa
**otra vez**, así que reenvía solo las malas.

**Si no recibes respuesta** (timeout con muchas descargas, conexión cortada): las filas ya
procesadas quedaron programadas. Con `ref` en cada fila, reenvía el lote igual y listo. Sin
ella, verifica con `GET /api/schedule/posts` antes de reintentar, o duplicarás posts.

---

# 2. Leer métricas — `GET /api/metrics/posts`

```http
GET /api/metrics/posts?desde=2026-09-01&hasta=2026-09-30&red=instagram
Authorization: Bearer <tu llave>
```

Parámetros, todos opcionales:
- `desde`, `hasta`: `YYYY-MM-DD` en la zona del dueño, **ambos inclusive**. Por defecto,
  los últimos 30 días. Formato inválido o rango invertido: `400` con
  `El rango de fechas no se entendió (usa YYYY-MM-DD).`
- `red`: una de las conocidas. Otra cosa: `400` con `Red desconocida: <valor>.`
- `cuenta`: solo las publicaciones de una cuenta. Va su `id` (el de `/api/schedule/cuentas`,
  el `cuenta.id` de cualquier fila de esta misma respuesta, o el `cuentaId` de
  `/api/schedule/posts`) o su nombre en la
  red, con o sin «@» y sin importar mayúsculas (`cuenta=@vicente`). Si ninguna calza: `400`
  con `Cuenta desconocida: <valor>.` Si el nombre lo tienen dos cuentas de redes distintas:
  `400` con `Hay más de una cuenta llamada <valor>: usa su id, o agrega red=.`

## Respuesta

```json
{
  "truncado": false,
  "posts": [
    {
      "red": "instagram",
      "cuenta": { "id": "3f1c…", "red": "instagram", "nombre": "@vicente" },
      "externalId": "18114074218999893",
      "permalink": "https://www.instagram.com/p/…",
      "texto": "¿Cómo sacar plata con software…",
      "publicadoEl": "2026-09-03T11:15:00-03:00",
      "etiqueta": "reel-42",
      "atributos": { "hook": "pregunta-polemica", "tema": "negocios" },
      "archivado": false,
      "metricas": {
        "views": 5210,
        "viewsGanadas": 1200,
        "viewsA7Dias": 4800,
        "contraSuCuenta": 1.6,
        "likes": 310,
        "comentarios": 12,
        "compartidos": 8,
        "alcance": 4100,
        "visitasAlSitio": 85,
        "clicks": 40,
        "ctr": 3.3,
        "arrastre": 7.1
      }
    }
  ]
}
```

## Cómo leer cada número

- **`views`** — el contador acumulado de por vida, al cierre del rango.
- **`viewsGanadas`** — cuánto creció ese contador **dentro** del rango. Compara mejor que
  `views`, que favorece a lo viejo solo por llevar más tiempo publicado; pero dentro del
  rango también le gana lo que salió al principio a lo que salió ayer.
- **`viewsA7Dias`** — el contador una semana después de publicar: la primera lectura
  después de cumplir 7 días desde la hora de publicación, si llegó antes de los 9. Mide a
  todas a la misma edad. `null` si todavía no cumple 7 días o si esos días no se leyó.
- **`contraSuCuenta`** — `viewsA7Dias` dividido por la mediana de las de su cuenta en el
  rango: `2` es el doble de lo normal de esa cuenta, `0.5` la mitad. Compara publicaciones
  de cuentas distintas sin que gane la que tiene más seguidores ni la de la red más grande:
  **para saber qué funciona, esta es casi siempre la métrica correcta**. `null` si la
  publicación no tiene `viewsA7Dias`, o si su cuenta tiene menos de 5 publicaciones del
  rango con `viewsA7Dias`. Depende del rango, porque «lo normal» es lo de ese rango; no de
  `red` ni de `cuenta`, que no cambian qué publicaciones tiene cada cuenta.
- En YouTube, `viewsGanadas`, `viewsA7Dias`, `contraSuCuenta` y `arrastre` vienen siempre
  `null`: sus políticas no permiten calcular métricas con sus datos.
- **`likes`, `comentarios`, `compartidos`, `alcance`** — lo que reporta la red.
- **`visitasAlSitio`, `clicks`, `ctr`** — tráfico real que ese post llevó a la
  página pública del dueño, atribuido por la etiqueta `?s=` (ver abajo). Ninguna red te da
  esto: es la métrica de negocio.
- **`arrastre`** — `visitasAlSitio / viewsGanadas` en porcentaje: de la gente que vio
  el post en el período, qué fracción llegó efectivamente al sitio. Mide capacidad de
  convertir atención en visita, sin castigar a los posts chicos.
- **`null` significa que la red no reportó ese dato — nunca es cero.** No lo trates
  como 0 en promedios: distorsiona. Instagram, por ejemplo, no entrega métricas de lo
  publicado antes de que la cuenta fuera profesional.

**`etiqueta`** es el identificador `?s=` del post: el link que se pega en la red
lleva la página pública del dueño con `?s=<etiqueta>` al final
(`https://tu-parrilla.cl/<su-página>?s=<etiqueta>`, o su dominio propio si tiene uno), y
así se atribuyen visitas y
clicks. Si un post nunca tuvo su link pegado, `visitasAlSitio` viene `null`.

**`atributos`** trae exactamente lo que enviaste al programar; es `null` para posts
subidos a mano fuera del calendario (también aparecen: también enseñan). En TikTok, un post
que salió del calendario puede venir con `null` hasta la sincronización siguiente a su
publicación: es la que le encuentra su video (ver `externalId` en la sección 3).

**`cuenta`** es la cuenta de la que salió el post: su `id` (el que va en `cuenta=` y en
`cuentas` al programar), su `red` y su `nombre` en la red. Es `null` si esa cuenta ya no
está entre las del dueño.

**`truncado: true`** avisa que el tope de filas mordió y la respuesta es parcial —
parte el rango en trozos más chicos.

## Dos semánticas que debes tener claras

1. **El rango filtra por fecha de publicación, no por actividad.** Un video publicado
   el 30 de agosto que explota el 5 de septiembre aparece en una consulta de *agosto*
   (con sus views ganadas dentro del rango que pidas), no en una de septiembre.
2. **Las métricas llegan con la sincronización diaria.** Lo publicado hoy tendrá
   números recién mañana. No concluyas nada de un post de hace dos horas. Y lo viejo se
   lee menos seguido: una publicación de los últimos 10 días se lee todos los días; una
   más vieja, una vez por semana hasta el mes, cada dos semanas hasta los tres meses y
   cada cuatro después. Sus números pueden ir hasta esas semanas atrás de lo que muestra
   la red.

---

# 2b. Tu mejor X % (o el peor) — `GET /api/metrics/mejores`

```http
GET /api/metrics/mejores?desde=2026-09-01&hasta=2026-09-30&cuenta=@vicente&metrica=viewsGanadas&percentil=10
Authorization: Bearer <tu llave>
```

La pregunta que más se hace con las métricas, ya respondida: de lo publicado en el rango,
¿qué fue lo mejor (o lo peor), cuánto había que sacar para estar ahí, cuánto rindió contra el
resto, y qué tiene en común? Es la misma cuenta que la pantalla «Tu mejor 10 %» del panel.

Parámetros, todos opcionales:
- `desde`, `hasta`, `red`, `cuenta`: igual que en `/api/metrics/posts`, con las mismas
  frases de error. El rango filtra por **fecha de publicación**.
- `metrica`: por cuál se ordena. `viewsGanadas` (por defecto), `contraSuCuenta`,
  `viewsA7Dias` (las dos de la sección 2), `visitas` (visitas a la página del dueño),
  `clicks`, `interacciones` (likes, comentarios y compartidos ganados en el rango) o
  `arrastre`. La pantalla entra con `contraSuCuenta`; la API se queda en `viewsGanadas`
  para no cambiarle la respuesta a quien ya la usa. Otra cosa: `400` con `La métrica no se entendió (usa contraSuCuenta, viewsA7Dias, viewsGanadas, visitas, clicks, interacciones o arrastre).`
- `percentil`: qué tajada, un entero de 1 a 50; por defecto `10`. Otra cosa: `400` con
  `El percentil tiene que ser un entero entre 1 y 50.`
- `lado`: `mejor` (por defecto), la tajada de arriba, o `peor`, la de abajo. Otra cosa:
  `400` con `El lado no se entendió (usa mejor o peor).`
- `recientes`: `si` (por defecto) o `no`. Con `no`, en las métricas que no son a igual
  edad (todas menos `contraSuCuenta` y `viewsA7Dias`) no compite lo que tenía menos de 7
  días al cierre del rango: casi no tuvo tiempo de sumar, y en el peor X % llenaría la
  tajada. La pantalla entra con `no`; la API, con `si`, como respondió siempre. Otra cosa:
  `400` con `recientes va con si o no.`

## Respuesta

```json
{
  "metrica": "viewsGanadas",
  "lado": "mejor",
  "percentil": 10,
  "recientes": "si",
  "cuenta": { "id": "3f1c…", "red": "instagram", "nombre": "@vicente" },
  "publicaciones": 64,
  "compiten": 58,
  "fueraPorRecientes": 0,
  "pocas": false,
  "corte": 4200,
  "rinden": 4.6,
  "truncado": false,
  "mejores": [
    {
      "puesto": 1,
      "valor": 21000,
      "red": "instagram",
      "cuenta": { "id": "3f1c…", "red": "instagram", "nombre": "@vicente" },
      "externalId": "18114074218999893",
      "texto": "Tres errores al editar reels",
      "atributos": { "hook": "pregunta", "tema": "edicion" },
      "metricas": { "viewsGanadas": 21000, "viewsA7Dias": 18500, "contraSuCuenta": 3.4, "visitasAlSitio": 214, "…": "…" }
    }
  ],
  "medianas": {
    "mejores": { "contraSuCuenta": 2.6, "viewsA7Dias": 8900, "viewsGanadas": 9800, "visitas": 120, "interacciones": 640, "arrastre": 1.1 },
    "resto": { "contraSuCuenta": 0.9, "viewsA7Dias": 2300, "viewsGanadas": 2100, "visitas": 18, "interacciones": 95, "arrastre": 0.8 }
  },
  "enComun": [
    { "rasgo": "hook", "valor": "pregunta", "enMejores": 4, "mejores": 6, "enTodas": 9, "todas": 58, "veces": 4.3 },
    { "rasgo": "hora", "valor": "noche (18 a 24)", "enMejores": 5, "mejores": 6, "enTodas": 20, "todas": 58, "veces": 2.4 }
  ]
}
```

Cada elemento de `mejores` es una fila con la misma forma que las de `/api/metrics/posts`,
más `puesto` y `valor` (el número de la métrica elegida).

**Con `lado=peor`, las claves del grupo dicen «peores»**: la lista es `peores` (de la peor a
la menos mala), las medianas son `medianas.peores` contra `medianas.resto`, y cada rasgo de
`enComun` trae `enPeores` y `peores` en vez de `enMejores` y `mejores`. Así nadie lee lo de
abajo como lo de arriba.

## Cómo leerla

- **`compiten`** son las publicaciones del rango que tienen la métrica; `publicaciones`,
  todas. Las que no la tienen no compiten (un `null` es «no se sabe», nunca cero):
  - En `viewsGanadas`, `contraSuCuenta`, `viewsA7Dias`, `interacciones` y `arrastre`,
    **YouTube no compite**: sus políticas no permiten calcular métricas con sus datos. En
    `visitas` y `clicks` sí, porque esas las mide Tu Parrilla.
  - En `viewsA7Dias` y `contraSuCuenta` no compite lo publicado hace menos de 7 días, que
    todavía no tiene su lectura; en `contraSuCuenta`, tampoco una cuenta con menos de 5
    publicaciones del rango con `viewsA7Dias`.
  - Con `recientes=no`, en las demás tampoco compite lo que tenía menos de 7 días al cierre
    del rango. **`fueraPorRecientes`** dice cuántas habrían competido y quedaron fuera.
  - En `visitas` y `clicks` no compite un post cuyo link con `?s=` nunca se usó.
  - En `arrastre` solo compiten las que ganaron al menos la mediana de views del rango:
    con 30 views, una visita ya es un 3 %, y el ranking se llenaría de casualidades.
- **Quién entra:** las primeras `ceil(compiten × percentil / 100)` —al menos una— y todas
  las empatadas con la última. Arriba, nunca una con valor cero; abajo sí, que es lo que se
  busca. **`corte`** es el valor de la última que entra (`null` si ninguna): lo mínimo para
  entrar arriba, lo máximo para entrar abajo.
- **`rinden`**: la mediana de la métrica en el grupo dividida por la del resto. `4.6` es
  «rinden 4,6 veces más que una publicación típica»; abajo sale menos de uno: `0.2` es «un
  quinto de lo típico».
- **`medianas`**: la publicación del medio de cada grupo, en seis métricas. Mediana y no
  promedio: un viral no arrastra al grupo entero.
- **`enComun`**: lo que se repite más en el grupo que entre todas las que compiten.
  `rasgo` es una clave de tus `atributos` (sin `pieza`) o uno de `red`, `formato`, `día`,
  `hora` (franja: madrugada, mañana, tarde o noche, en la zona del dueño). Entra si está en
  al menos dos de arriba y es al menos 1,5 veces más frecuente ahí (`veces`). Viene vacío
  con menos de tres arriba. Que se repita no prueba que sea la causa: es la pista para la
  próxima prueba.
- **`pocas: true`** cuando compiten menos de 20: el mejor 10 % son una o dos publicaciones,
  que sirven para mirarlas, no para concluir. Amplía el rango o sube `percentil`.
- **`truncado`**, como en `/api/metrics/posts`, con otro tope: acá se leen hasta 10.000
  publicaciones, porque la respuesta trae solo el grupo.

Para mirar una cuenta sola, pasa `cuenta`: con «todas», una cuenta grande llena la tajada
de arriba y las chicas no aparecen nunca. Con `metrica=contraSuCuenta` no hace falta: cada
publicación compite contra lo normal de su propia cuenta.

---

# 3. Leer el calendario — `GET /api/schedule/posts`

```http
GET /api/schedule/posts?desde=2026-09-10&hasta=2026-09-30
Authorization: Bearer <tu llave>
```

Lo que hay en el calendario entre dos días, **por fecha de salida** y sin importar si
ya salió: programado, publicando, publicado o fallido. Úsalo antes de armar una tanda,
para no pisar horas ni repetir temas, y después, para saber qué salió y qué falló.

Parámetros, ambos opcionales, `YYYY-MM-DD` en la zona del dueño, **ambos inclusive**:
- `desde`: por defecto hoy.
- `hasta`: por defecto 30 días después de `desde`.

Un rango pasado vale (lista lo ya publicado). Formato inválido o rango invertido:
`400` con `El rango de fechas no se entendió (usa YYYY-MM-DD).`

## Respuesta

```json
{
  "desde": "2026-09-10",
  "hasta": "2026-09-30",
  "posts": [
    {
      "id": "3f2a…",
      "texto": "¿El negocio con más margen del retail?\n\nTe sorprendería.",
      "fecha": "2026-09-10T09:00:00-03:00",
      "portada": "https://media.vicente-pareja.cl/scheduled/…jpg",
      "media": [{ "url": "https://media.vicente-pareja.cl/scheduled/…mp4", "tipo": "video" }],
      "atributos": { "hook": "pregunta-polemica", "tema": "retail" },
      "ref": "septiembre-fila-12",
      "redes": [
        { "red": "instagram", "estado": "published", "error": null, "externalId": "18114074218999893", "intentos": 1, "proximoIntento": null, "cuentaId": "8f0a…", "handle": "@vicente" },
        { "red": "youtube", "estado": "scheduled", "error": "No se pudo hablar con la red. Se reintentará.", "externalId": null, "intentos": 1, "proximoIntento": "2026-09-10T09:15:00-03:00", "cuentaId": "b21c…", "handle": null },
        { "red": "tiktok", "estado": "failed", "error": "TikTok no acepta el archivo: revisa formato, tamaño o duración.", "externalId": null, "intentos": 3, "proximoIntento": null, "cuentaId": "9d4e…", "handle": "@vicente" }
      ]
    }
  ]
}
```

- **`id`** es el `postId` que devolvió el lote al programar.
- **`fecha`** es la hora de salida, ISO con el offset de la zona del dueño. Los posts vienen
  ordenados por ella.
- **`media`** viene en el orden del carrusel, ya en el almacén propio (la URL de
  origen que mandaste no se conserva).
- **`atributos`** trae exactamente lo que enviaste; `null` si no mandaste ninguno.
- **`ref`** es la que mandaste en la fila (sección 1), o `null`: con ella cruzas un lote
  que reenviaste contra lo que ya entró.
- **`redes`**: un estado por destino. `scheduled` espera su hora; `publishing` está en
  vuelo (Meta procesando un video); `published` salió y `externalId` es su id en la
  red, el mismo que usa `/api/metrics/posts`. **En TikTok puede venir `null` un tiempo**:
  TikTok no siempre entrega el id al publicar (un post en «Solo yo», un borrador mandado a
  la bandeja, o uno que todavía modera). La sincronización de la cuenta —la diaria, o
  «Sincronizar ahora» en Los Fierros— lo completa cruzando el video por su texto y su hora,
  y desde ahí cruza con sus métricas y sus `atributos`; un borrador, recién cuando el dueño
  lo publica desde su app. `failed` agotó los tres intentos y
  `error` dice por qué con una frase fija. `intentos` cuenta los intentos hechos.
  Un `scheduled` con `error` es uno que falló y espera el siguiente intento:
  **`proximoIntento`** dice cuándo (quince minutos después del primer fallo, dos horas
  después del segundo), y es `null` en todo destino que no espera nada más que su hora. Un
  destino de Instagram que chocó con el tope diario de publicaciones también espera así, sin
  gastar intentos, con `error` `Instagram llegó a su tope de publicaciones por día: sale apenas se libere un cupo.`
  y una hora de espera cada vez.
  **`cuentaId`** es el identificador de cuenta de ese destino — la fuente para el
  campo `cuentas` de la sección 1, cuando nombrar la red no alcanza — y **`handle`**
  es el de esa cuenta, o `null` si la cuenta ya no existe (el destino se conserva
  igual, solo pierde el handle).

Un post `published` en todas sus redes aparece en `/api/metrics/posts` desde la
sincronización del día siguiente, con `atributos` idénticos: ese es el puente entre
lo que decidiste y lo que rindió.

---

# 3b. Lo que pide atención — `GET /api/schedule/resumen`

```http
GET /api/schedule/resumen?dias=3&horas=24
Authorization: Bearer <tu llave>
```

Lo mismo que el resumen del día que le llega al dueño por correo, calculado en el momento:
lo que se quemó, las cuentas que hay que reconectar y las que se están quedando sin
parrilla. Pídelo antes de armar una tanda, o una vez al día: es la forma de enterarte sin
leer el correo del dueño.

Parámetros, ambos opcionales:
- `dias`: entero de 1 a 30, por defecto 3. Una cuenta entra en `pista` si tiene menos de
  esos días programados. Fuera de rango: `400` con `«dias» tiene que ser un entero de 1 a 30.`
- `horas`: entero de 1 a 168, por defecto 24. Cuántas horas hacia atrás mira `fallidos`.
  Fuera de rango: `400` con `«horas» tiene que ser un entero de 1 a 168.`

```json
{
  "generado": "2026-10-17T09:00:00-03:00",
  "horas": 24,
  "dias": 3,
  "fallidos": [
    { "postId": "3f2a…", "fecha": "2026-10-16T19:00:00-03:00", "texto": "¿El negocio con más margen?", "red": "instagram", "cuentaId": "8f0a…", "handle": "@vicente", "error": "Instagram rechazó la publicación.", "intentos": 3 }
  ],
  "cuentas": [
    { "cuentaId": "c71d…", "red": "tiktok", "handle": "@vicente", "fierro": "frio", "vence": null, "motivo": "La conexión falló; reconecta la cuenta." },
    { "cuentaId": "8f0a…", "red": "instagram", "handle": "@vicente", "fierro": "enfriandose", "vence": "2026-10-20T10:00:00-03:00", "motivo": "La conexión está por vencer; reconéctala antes." }
  ],
  "pista": [
    { "cuentaId": "b21c…", "red": "youtube", "handle": null, "ultima": "2026-10-18T19:00:00-03:00", "dias": 1 },
    { "cuentaId": "9d4e…", "red": "facebook", "handle": "Vicente Pareja", "ultima": null, "dias": 0 }
  ]
}
```

- **`fallidos`**: los destinos que se quemaron en las últimas `horas`, el más reciente
  primero. `fecha` es la hora de salida del post; `error`, la misma frase fija de
  `/api/schedule/posts`. Para reprogramarlo, el dueño tiene «Reprogramar» en su panel; por
  API, se borra y se programa de nuevo.
- **`cuentas`**: las que hay que reconectar. `fierro` `frio` ya no publica (la conexión
  falló, venció, o el dueño quitó la app desde Facebook); `enfriandose` vence en menos de
  siete días, y `vence` dice cuándo (`null` en TikTok, YouTube y X, que se renuevan solas y
  no tienen una fecha que diga algo). Lo programado en una cuenta fría no sale hasta que el
  dueño la reconecte en Los Fierros: avísale. Una cuenta que el dueño desconectó a propósito
  no aparece.
- **`pista`**: las cuentas en uso —con algo programado en los últimos 30 días— que tienen
  menos de `dias` días programados hacia adelante. `ultima` es la hora de lo último que
  tienen por salir (`null` si nada), y `dias` los días completos de aquí a esa hora. Las más
  cortas primero: es la lista de lo que conviene programar primero.

Las tres listas vacías significan que no hay nada que mirar. El correo del dueño sale ese
día solo si alguna tiene algo, después de la sincronización de la mañana.

---

# 3c. Las cuentas — `GET /api/schedule/cuentas`

```http
GET /api/schedule/cuentas
Authorization: Bearer <tu llave>
```

Todas las cuentas del dueño de la llave, con los dos identificadores de cada una: el de Tu
Parrilla, que es el que usas en esta API, y el que le da la red. No lleva parámetros.
Pídela antes de la primera tanda, y cada vez que el dueño te cuente que conectó una cuenta.

```json
{
  "cuentas": [
    { "id": "8f0a…", "red": "instagram", "handle": "@vicente", "externalId": "17841400000000000", "conectada": true, "proximamente": false, "fierro": "al-rojo", "vence": "2026-12-01T10:00:00-03:00", "motivo": null },
    { "id": "9d4e…", "red": "tiktok", "handle": "@vicente", "externalId": "-000Ab1Cd2…", "conectada": true, "proximamente": false, "fierro": "al-rojo", "vence": null, "motivo": null },
    { "id": "c71d…", "red": "facebook", "handle": "Vicente Pareja", "externalId": "1029384756", "conectada": false, "proximamente": false, "fierro": "frio", "vence": null, "motivo": "La cuenta está desconectada; reconéctala para programarle." }
  ]
}
```

- **`id`** es el identificador de la cuenta en Tu Parrilla: el que va en `cuentas` al
  programar (sección 1), como clave de `opciones` y en `cuenta=` de las métricas (sección 2).
  Es el mismo `cuentaId` de `/api/schedule/posts` y de `/api/schedule/resumen`, y el
  `cuenta.id` de `/api/metrics/posts`.
- **`externalId`** es el identificador que la red le da a la cuenta: el de la cuenta de
  Instagram, el de la página de Facebook, el del canal de YouTube o el `open_id` de TikTok.
  Sirve para cruzar con lo que leas en la red; ningún campo de esta API lo recibe. `null` si
  la red no lo dio.
- **`handle`** es el nombre de la cuenta en la red (en Facebook y YouTube, el de la página o
  el canal), o `null`.
- **`conectada`** dice si tiene credencial. Una cuenta con `false` sigue en la lista porque el
  dueño la ve en Los Fierros, pero una fila con su id en `cuentas` se rechaza con
  `La cuenta <handle> no está conectada. Vuelve a conectarla en Los Fierros.`
- **`proximamente`** es `true` en las cuentas de Threads y X, que están en «Próximamente»:
  una fila hacia ellas se rechaza aunque estén conectadas.
- **`fierro`** es cómo está la conexión, con la misma lectura de Los Fierros y del resumen:
  `al-rojo` (viva), `enfriandose` (el permiso vence en siete días o menos) o `frio` (ya no
  publica: desconectada, vencida o con la sincronización rota). Una cuenta fría con
  `conectada: true` acepta la fila, pero lo programado no sale hasta que el dueño la
  reconecte: avísale antes de programarle.
- **`vence`** es cuándo vence el permiso, en ISO con el offset de la zona del dueño. Viene
  `null` en TikTok, YouTube y X, que lo renuevan solas; en una red que no da la fecha; y en una
  cuenta sin credencial.
- **`motivo`** es `null` al rojo. Si no, dice por qué hay que reconectarla, con una de
  cuatro frases: `La conexión está por vencer; reconéctala antes.`,
  `La conexión falló; reconecta la cuenta.`, `La conexión venció; reconecta la cuenta.` o
  `La cuenta está desconectada; reconéctala para programarle.` Las tres primeras son las del
  resumen (sección 3b), que no nombra las desconectadas a propósito; esta lista sí.

Vienen ordenadas por red, en orden alfabético, y dentro de una red de la más antigua a la más
nueva. Conectar, reconectar o quitar una cuenta no se hace por API: lo hace el dueño en Los
Fierros.

---

# 4. El ciclo completo

1. **Mira** `/api/schedule/cuentas` para saber a qué cuentas puedes programar,
   `/api/schedule/posts` para saber qué ya está puesto en la ventana, y
   `/api/schedule/resumen` para saber qué se quemó y qué cuenta se está quedando sin parrilla.
2. **Programa** con `atributos` describiendo tus decisiones creativas, y una `ref` en cada fila.
3. El sistema **publica** a la hora indicada, en cada red. Si un destino falla, se
   reintenta hasta tres intentos —quince minutos después del primero, dos horas después
   del segundo—; al tercer fallo el dueño recibe un correo y el post queda marcado en rojo
   en su calendario, y en `failed` en `/api/schedule/posts`. Si lo que falló es la conexión
   de la cuenta, el correo es uno solo por cuenta, no uno por post.
4. La sincronización diaria trae **métricas reales**.
5. **Lee** `/api/metrics/posts` sobre un rango con suficiente historia, o pide directo
   `/api/metrics/mejores` para ver lo mejor de cada cuenta y qué lo distingue.
6. **Correlaciona** `atributos` contra `viewsGanadas` y `arrastre`, y decide la
   próxima parrilla. Ejemplos de preguntas que el dato responde:
   - ¿qué `hook` gana en views, y cuál gana en visitas al sitio? (rara vez es el mismo)
   - ¿un `tema` rinde distinto según la red?
   - ¿la `serie` sostiene el arrastre o se agota?

Cuantos más posts etiquetados con vocabulario consistente, antes aparecen los
patrones. Con menos de ~10 posts por valor de atributo, desconfía de la diferencia.

---

# 5. Lo que el sistema NO hace

- **No deduplica sin `ref`**: reenviar el mismo lote sin `ref` programa todo de nuevo. Con
  `ref`, lo que ya entró vuelve como repetido (sección 1).
- **No programa en el pasado** ni acepta media que no esté en una URL pública.
- **No edita por API**: para corregir un post ya programado, o lo borras con
  `DELETE /api/schedule/posts/{id}` y lo programas de nuevo, o el dueño lo cambia en su
  panel (`/admin/schedule`), donde puede tocar texto, hora, redes, media, portada y
  atributos, y ver la semana en calendario.
- **Sí borra por API**, con la regla del panel: `DELETE /api/schedule/posts/{id}` (el `postId`
  que devolvió el lote, o el `id` de `GET /api/schedule/posts`) saca el post entero con sus
  destinos, su media y su regla. Si algún destino ya se publicó o está publicando —también uno
  que el publicador está intentando en ese momento—, responde `409` con
  `Ya se publicó (o está publicando): elimínalo en la red.` — borrar la fila no despublica
  nada. Si el id no existe (o no es tuyo), `404`. Borrado, `200` con
  `{ "ok": true, "id" }`.
- **No republica lo ya publicado**: corregir un post afecta solo a los destinos que
  aún no salieron.
- **Entrega un solo agregado**: `/api/metrics/mejores`, el mejor (o el peor) X % con sus
  medianas y lo que se repite. Todo lo demás —promedios por red, tendencias, cruces de atributos— sale de
  las filas crudas de `/api/metrics/posts`, y el análisis es tuyo, a propósito.

# 6. Ejemplos ejecutables

Las cuentas del dueño, con el id que va en `cuentas`:

```bash
curl -s "https://tu-parrilla.cl/api/schedule/cuentas" \
  -H "Authorization: Bearer $LLAVE_PARRILLA"
```

Ver qué hay en el calendario las próximas dos semanas:

```bash
curl -s "https://tu-parrilla.cl/api/schedule/posts?hasta=$(date -d '+14 days' +%F)" \
  -H "Authorization: Bearer $LLAVE_PARRILLA"
```

Programar dos posts:

```bash
curl -X POST https://tu-parrilla.cl/api/schedule/batch \
  -H "Authorization: Bearer $LLAVE_PARRILLA" \
  -H "Content-Type: application/json" \
  -d '{
    "posts": [
      {
        "fecha": "2026-09-10 09:00",
        "texto": "¿El negocio con más margen del retail?\n\nTe sorprendería.",
        "redes": ["instagram", "youtube", "facebook"],
        "media": ["https://drive.usercontent.google.com/download?id=ABC&export=download"],
        "portada": "https://ejemplo.com/portada-01.jpg",
        "atributos": { "hook": "pregunta-polemica", "tema": "retail", "estilo": "tutorial" },
        "ref": "septiembre-01"
      },
      {
        "fecha": "2026-09-10 19:00",
        "texto": "Tres cosas que aprendí vendiendo software en Chile.",
        "redes": ["facebook"],
        "media": [],
        "atributos": { "hook": "lista", "tema": "software", "estilo": "texto" },
        "ref": "septiembre-02"
      }
    ]
  }'
```

Si ese envío no respondió, se manda igual otra vez: las filas que ya habían entrado vuelven
con `"repetido": true`.

Lo que pide atención hoy (lo quemado, las cuentas por reconectar, las que se quedan sin
parrilla):

```bash
curl -s "https://tu-parrilla.cl/api/schedule/resumen" \
  -H "Authorization: Bearer $LLAVE_PARRILLA"
```

Leer el mes:

```bash
curl -s "https://tu-parrilla.cl/api/metrics/posts?desde=2026-09-01&hasta=2026-09-30" \
  -H "Authorization: Bearer $LLAVE_PARRILLA"
```

El mejor 10 % de una cuenta en el mes, por visitas que trajo a la página:

```bash
curl -s "https://tu-parrilla.cl/api/metrics/mejores?desde=2026-09-01&hasta=2026-09-30&cuenta=@vicente&metrica=visitas"   -H "Authorization: Bearer $LLAVE_PARRILLA"
```

Programar a una cuenta exacta (útil cuando hay dos cuentas de la misma red — acá, dos
de TikTok — y nombrar solo `tiktok` sería ambiguo):

```bash
curl -X POST https://tu-parrilla.cl/api/schedule/batch \
  -H "Authorization: Bearer $LLAVE_PARRILLA" \
  -H "Content-Type: application/json" \
  -d '{
    "posts": [
      {
        "fecha": "2026-09-10 12:00",
        "texto": "Solo para la marca A.",
        "cuentas": ["<id de la cuenta TikTok de marca A>"],
        "media": ["https://ejemplo.com/clip-a.mp4"],
        "opciones": { "<id de la cuenta TikTok de marca A>": { "modo": "directo", "privacidad": "SELF_ONLY" } }
      }
    ]
  }'
```
