# Portafolio

Un linktree propio: varios perfiles públicos, editables desde un panel, con analítica de
primera parte y sin cookies. Sin suscripción, sin marca de agua, sin que un tercero se
quede con tus números.

**[Ver uno funcionando →](https://portafolio-page-inky.vercel.app)**

| URL | Qué es |
| --- | --- |
| `/` | La página principal del dueño del dominio. Cada usuario tiene una principal, pero solo la del admin se sirve en la raíz |
| `/<slug>` | La página de un usuario. Cada dominio sirve solo las de su dueño; el del producto las sirve todas |
| `/admin` | Tu panel: entra a La Parrilla, el calendario con lo que se quemó arriba; adentro, los números, los comentarios, el editor y Tu IA (`/admin/ia`), con las llaves para tu agente y el manual del parrillero (`/admin/ia/manual`). Se abre en el dominio del producto: en cualquier otro, `/admin` e `/ingresar` redirigen ahí con la misma ruta |
| `/borrado/<código>` | El estado de un borrado que pidió Meta: cuándo fue y cuántas cuentas. Pública, sin sesión; el código es la llave |
| `/docs/…` | Las guías para LLMs, públicas y sin sesión: la de la API (`api-llm.md`, `api-editor.md`, `api.json`) y la wiki de la interfaz (`ui/index.md`), para guiar a quien se pierde en el panel |
| `/api/social/meta/baja` | `POST` de Meta cuando alguien quita la app desde Facebook: deja sin credencial sus cuentas de Instagram y Facebook |
| `/api/social/meta/borrado` | `POST` de Meta cuando alguien pide borrar sus datos: borra lo que vino de esas dos redes y devuelve el código de estado |

Corre en planes gratis: Next.js 16 en Vercel, Postgres en Supabase y la media en Cloudflare R2
(10 GB gratis, egress $0).

---

## Cómo entra un cambio

Cada pull request contra `main` dispara la reja: dos trabajos en paralelo que tienen que
quedar verdes antes de poder fusionar.

- **sitio** corre los tests, el typecheck, el lint y el build de producción. Corre sin
  ninguna credencial, a propósito: si el build empieza a necesitar un secreto para compilar,
  queremos enterarnos acá y no en Vercel.
- **app** corre los tests, el typecheck y el lint del proyecto de `mobile/`.

`main` está protegida. No se puede empujar directo: todo entra por pull request, los dos
trabajos son obligatorios, y la rama tiene que estar al día con `main` antes de fusionar,
para que la reja haya corrido sobre el código que de verdad va a quedar.

Por eso Vercel no espera a nadie. Lo que llega a `main` ya pasó por la reja.

Si alguna vez hay que reconfigurar esto, la protección vive en **Settings → Branches →
Branch protection rules** del repositorio, sobre `main`, con estas casillas: exigir pull
request antes de fusionar, exigir que las comprobaciones `sitio` y `app` pasen, y exigir que
la rama esté al día.

---

## Desplegar el tuyo

Toma unos 10 minutos. Necesitas una cuenta de GitHub, una de Vercel y Node 24 o superior,
la versión fijada en `.nvmrc`.

### 1. Genera tus dos secretos

El botón del paso siguiente te los va a pedir. Córrelo dos veces y guarda cada resultado:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

El primero es `AUTH_SECRET` (firma tu sesión del panel), el segundo `FINGERPRINT_SALT`
(la sal del hash de visitantes). No los reutilices entre proyectos y no los publiques.

### 2. Aprieta el botón

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FRibs-org%2Fportafolio-page&env=ADMIN_EMAIL,AUTH_SECRET,FINGERPRINT_SALT,RESEND_API_KEY&envDescription=Tu%20correo%2C%20la%20llave%20de%20Resend%20y%20los%20dos%20secretos%20que%20generaste&envLink=https%3A%2F%2Fgithub.com%2FRibs-org%2Fportafolio-page%2Fblob%2Fmain%2F.env.example&project-name=portafolio&repository-name=portafolio)

Vercel copia este repositorio a tu cuenta de GitHub y te pide cuatro variables:

| Variable | Qué pones |
| --- | --- |
| `ADMIN_EMAIL` | Tu correo. Con él entras al panel en `/ingresar` |
| `AUTH_SECRET` | El primer valor del paso 1 |
| `FINGERPRINT_SALT` | El segundo valor del paso 1 |
| `RESEND_API_KEY` | La llave de Resend: sin ella no salen los códigos de ingreso. La provisiona la integración de Resend |

El deploy va a terminar bien, pero al abrir el sitio verás **"No se pudo leer la base de
datos"**. Es lo esperado: todavía no hay base de datos. Sigue.

### 3. Conecta la base de datos y el almacenamiento

En tu proyecto de Vercel, pestaña **Storage**:

- **Create Database → Supabase** — inyecta `DATABASE_URL` sola. Obligatoria. Usa el
  *pooler* (`aws-0-<región>.pooler.supabase.com`), no la conexión directa: esa es solo IPv6
  y las funciones de Vercel no la alcanzan. La app entra como `postgres` y solo por esa
  conexión: la **Data API** de Supabase (la que usa la llave `anon`) no se usa nunca, y las
  migraciones la dejan a ciegas —RLS activo en todas las tablas, sin políticas, y sin
  permisos para `anon` ni `authenticated`—. Si un día hiciera falta, es escribir políticas,
  no apagar RLS.
- **Almacenamiento de media** — no es de Vercel: un bucket de Cloudflare R2, porque
  su plan gratis son 10 GB con egress $0 y los videos programados no caben en menos.
  En dash.cloudflare.com → R2: crea el bucket, cuélgale un subdominio propio y emite
  un token con permiso solo sobre él. No lo compartas con nada más: un barrido que va
  en cada corrida del cron de publicación borra del bucket todo lo que la base de datos no
  referencia y lleva más de una hora subido, así que cualquier otra cosa que guardes ahí
  dura poco más que eso. Después carga `R2_ACCOUNT_ID`,
  `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` y `R2_PUBLIC_BASE` (ver
  `.env.example`). Opcional: sin esto todo funciona, solo que no puedes subir media.

### 4. Crea las tablas

`db:setup` migra el esquema y siembra dos perfiles de ejemplo; desde ahí el esquema viaja
solo con cada despliegue. Esto es lo único que no se puede hacer desde el navegador. En tu
computador, sobre el repositorio que Vercel acaba de crear en tu GitHub:

```bash
git clone https://github.com/TU-USUARIO/portafolio.git
cd portafolio
npm install

npx vercel link              # elige el proyecto que acabas de crear
npx vercel env pull .env.local
npm run db:setup             # crea las tablas y siembra dos perfiles de ejemplo
```

`db:setup` es idempotente en lo que importa: si ya existen perfiles, no siembra de nuevo.

### 5. Redespliega

Las variables que agregaste (Supabase y R2) no entran en un deploy que ya terminó. En Vercel:
**Deployments → ⋯ del último → Redeploy**. O desde la terminal:

```bash
npx vercel --prod
```

Abre el sitio: ahora se ve un perfil de ejemplo.

### 6. Hazlo tuyo

Entra en `/ingresar` con tu correo (el de `ADMIN_EMAIL`): te llega un código de seis
dígitos que vale diez minutos.

El panel tiene cuatro pestañas —La Parrilla (Calendario), La Mesa (Comentarios), Los Números
(Analítica) y Tu IA (las llaves y el manual)— y el botón de Ajustes (un trinche y un
cuchillo, lado a lado),
con Los Fierros (Cuentas), La Vitrina (Perfiles), Los Maestros (Usuarios, solo el admin) y
Tu Cuenta. Las rutas no cambiaron. Cada pantalla lleva su subtítulo en llano por si el
nombre no dice nada.

En **Tu Cuenta** (`/admin/cuenta`) cambias dos cosas tuyas: el nombre con el que apareces
y tu zona horaria. La zona es de cada usuario, no del sitio: naces con la de
`SITE_TIMEZONE` y la cambias cuando quieras, y debajo del selector se ve qué hora es en la
tuya ahora mismo, calculada en el servidor. El correo con el que entras no se cambia desde
ahí. Tu zona manda en el panel —el calendario, la lista, el editor de un corte y las
ventanas de los links— y en lo que guardas desde ahí: si escribes «19:00», son las
19:00 tuyas. También manda por dentro: Los Números y su lista de publicaciones agrupan los días en tu
zona.

En **Tu IA** (`/admin/ia`), la cuarta pestaña, generas las **llaves para tu IA**: una llave
deja que un programa —el agente que te edita los videos, un asistente, un script— use la API
a tu nombre sin entrar al panel. La pestaña lleva un maestro cocinero dibujado
(`src/components/icono-maestro.tsx`): un parrillero de noche y un maestro de sushi de día.
Hasta el 2026-10-19 las llaves vivían en Tu Cuenta; ahora están junto a las guías que tu IA
tiene que leer y lo que puede hacer con ellas. Le pones un nombre (el del agente), aprietas «Generar llave» y la ves **una sola
vez**, con un botón que la copia junto con las instrucciones para el agente (la base de la
API, el header, dónde está la guía y dónde la wiki del panel). En la base se guarda solo su hash, así que no hay forma
de volver a leerla: si se pierde, se revoca y se genera otra. La lista muestra cada llave
por su nombre y sus últimos cuatro caracteres, cuándo se creó y cuándo se usó por última
vez; revocar la borra y lo que la use deja de entrar en su próxima petición. Hasta diez por
usuario. Cerrar las sesiones de alguien desde Los Maestros no toca sus llaves: son
credenciales aparte, y las maneja cada uno.

Al final de Tu IA está **el manual del parrillero** (`/admin/ia/manual`): la wiki de la UI
(`public/docs/ui/`) pasada a HTML para que la lea la persona, una página por dirección, sin el
pie con los archivos de cada una y con los enlaces llevados al manual (`src/lib/manual.ts`, con
`marked`). La función lee la wiki del disco: `next.config.ts` la incluye en ella
(`outputFileTracingIncludes`), porque lo de `public/` lo sirve la CDN.

Fuera del panel, «el dueño» no siempre eres tú, así que conviene el detalle:

- La **API con llave** (`/api/schedule/posts`, `/api/schedule/resumen`, `/api/schedule/cuentas`, `/api/metrics/posts`, `/api/metrics/mejores`) habla en la zona del
  dueño de la llave: la tuya si el agente usa una llave que generaste tú, la del admin si
  usa `SCHEDULE_API_KEY`, la llave del despliegue. Lo que el agente escribe como «19:00»
  son las 19:00 del dueño, y los días de `desde`/`hasta` son sus días.
- El **lote de publicación** hace las dos cosas en la zona del dueño del lote: lee la
  `fecha` que le mandas como hora de pared suya y devuelve en la misma.
- La **app móvil** solo lee horas en la zona del dueño. Lo que manda al programar es un
  instante absoluto (ISO con offset), así que el selector del teléfono no depende de
  `users.zona` — y ahí queda una costura anotada en `docs/deuda-tecnica.md`.

`SITE_TIMEZONE` solo queda como la zona con la que naces y la del sitio público.

**La Parrilla es la entrada** (`/admin` lleva ahí). Arriba va lo único que pide una acción
sin que la busques: lo que se quemó, con su motivo, el arreglo cuando el motivo lo dice
(«Reconectar», «Cambiar el archivo») y el botón para darle hora nueva; sin
ninguna red conectada, una tarjeta que te manda a Los Fierros. Debajo, el calendario de la
semana —la lista queda a un clic—, con un «+» en cada día que abre el compositor con ese
día puesto. El nombre de cada día abre la vista **Día** (`?vista=dia&fecha=…`): ese día con
una columna por cuenta, cada una con su propio fuego y un «+» que abre el compositor con el
día y la cuenta puestos; un post que sale a varias cuentas aparece en cada una, cocido según
el estado de ese destino. Cada post se dibuja como un **corte** (`src/components/corte.tsx`):
la silueta dice el formato —entraña video, tira de asado carrusel con un hueso por archivo,
bife foto, chori texto—, la carne cómo va, una marca por destino que se quema cuando ese
destino sale, y un halo rojo con banderita si algo se quemó; humo mientras sale. El texto va
al lado, en la chapa, nunca sobre la carne. La app del teléfono dibuja el mismo corte con
vistas (`mobile/src/components/pieza.tsx`), con el formato y el sello de cada destino que le
manda `GET /api/mobile/schedule`. El porqué, en
`docs/superpowers/specs/2026-10-16-el-corte-que-se-lee-design.md`. El panel tiene además un
**modo día**, que se elige con el botón de la barra y se recuerda en la cuenta (`users.tema`,
`src/lib/tema.ts`), así que vale en cualquier equipo donde entres y en la app del teléfono, que lo lee y lo cambia
en Ajustes con `GET`/`PUT /api/mobile/tema` y lo dibuja con sus colores de día
(`mobile/src/components/colores.ts`) y sus piezas de sushi hechas con vistas
(`mobile/src/components/pieza-sushi.tsx`). Una cookie lo copia en cada equipo para la
puerta, que se dibuja antes de saber de quién es. El modo día es el fondo claro y, en vez de cortes, piezas de sushi
(`src/components/pieza-sushi.tsx`) que dicen lo mismo con la misma gramática —nigiri, un roll
que se corta al servirse, sashimi y temaki; el pescado bajo el soplete; una banda de nori por
destino—. Lo que falló no
se quema: es pescado pasado, y la sección «Se quemó» se llama «Se echó a perder» (`SE_QUEMO`,
en `src/lib/vocabulario.ts`). Las demás palabras no cambian, la noche sigue por defecto, y la
página pública de cada creador no cambia nunca. La portada tiene los dos modos, con el mismo
botón: de día su marca es el nigiri, y `?modo=dia` la abre de día, con su imagen para compartir
(`/api/og/dia`). El
diseño, en `docs/superpowers/specs/2026-10-19-modo-dia-sushi-design.md`. Al pie, cuántos cortes salieron ayer; las miradas solo si la sincronización ya
trajo sus métricas, porque un cero inventado diría «nadie miró» cuando lo cierto es
«todavía no se sabe». Lo que no pide una acción está un clic más adentro: el tráfico, los
links y qué contenido te trae gente viven en **Los Números**, y tus páginas públicas en
**La Vitrina**.

**Los Números es un solo tablero** con dos mitades que dicen qué miden. **En las redes**: lo
que hicieron tus publicaciones donde las publicaste —views y seguidores ganados en el
período, y lo que más creció—, filtrable por cuenta. **En tu página**: quién entró a tu
página de links y qué apretó —visitas y clicks, y qué publicación te trajo gente—,
filtrable por página. El período vale para las dos. Cada mitad muestra dos números y una
lista; el resto (interacciones, arrastre, tus cuentas, la audiencia, los links, de dónde
vienen…) espera detrás de su «⋯ Más», que no se consulta mientras está cerrado. La lista de
todas las publicaciones, que antes era la pestaña Los Cortes, está un clic adentro («Ver todas
las publicaciones →», `/admin/analytics/publicaciones`; `/admin/content` redirige ahí), con
filtro por cuenta, dos columnas a la vista y las demás con «⋯ Más». Cada publicación abre su
**pieza** (`/admin/analytics/publicaciones/<id>`): cada lugar donde salió —cada cuenta, cada
red, si fue trial reel— con sus números lado a lado. Las versiones son los destinos del post
programado del que salió y, si sus atributos traen `pieza`, los de todos los posts
programados con el mismo valor: dos hooks del mismo video, o el trial reel y el reel normal
en una cuenta, son por fuerza dos posts. **Comparar por atributo** (`/admin/analytics/comparar`)
muestra, para cada valor de un atributo —el hook, el tema, la serie—, cuántas publicaciones
lo llevan y sus medianas: «contra su cuenta», views a los 7 días, views ganadas, visitas y
arrastre. **Tu mejor 10 %** (`/admin/analytics/mejores`) ordena lo publicado en el período
por una métrica, muestra el 5, 10, 20 o 25 % de arriba —o de abajo, con «Lo peor»— con el
corte para entrar, sus medianas contra las del resto y lo que se repite más entre ellas (un
atributo, la red, el formato, el día o la franja horaria); la misma cuenta la hace
`GET /api/metrics/mejores` para un agente. Entra con «contra su cuenta»: las views de cada
publicación a los 7 días de publicada, divididas por la mediana de su cuenta en el período,
para comparar mil publicaciones por semana en varias cuentas sin que gane la más vieja ni la
cuenta más grande (`src/lib/igual-edad.ts`). En las otras métricas, lo publicado hace menos
de 7 días no compite salvo que se prenda «Con las de menos de 7 días». **Lado a lado**
(`/admin/analytics/lado-a-lado`) pone dos publicaciones —al entrar, la mejor y la peor— con
su portada, el link para ver el video en la red, sus atributos y cómo crecieron sus views por
días desde que salieron; el video no se guarda (`src/lib/lado-a-lado.ts`). El porqué del tablero, en
`docs/superpowers/specs/2026-10-13-numeros-tablero-design.md`.

**Componer** pasa en un panel que se abre desde la derecha con «+ Nueva publicación», sin
perder de vista el calendario; ahí mismo están «Subir CSV» y «Borradores». Lo que escribes
se guarda solo como **borrador** un segundo después de la última tecla, como un correo, y los
archivos se suben apenas los eliges para que el borrador los conserve. «Programar» lo
convierte en publicación y lo saca de los borradores; «Descartar» lo borra. Los borradores
con fecha aparecen en su día del calendario con borde punteado. Viven en sus propias tablas
(`borradores` y `borrador_media`): el publicador y la API no los ven. La app del teléfono sí:
Publicar guarda en los mismos borradores (`/api/mobile/borradores`), así que lo empezado en
el teléfono se sigue en el panel y al revés (ver `mobile/README.md`, «Los borradores»). El porqué de todo
esto está en `docs/superpowers/specs/2026-10-13-parrilla-entrada-y-borradores-design.md`.

Solo entran los correos invitados; desde **Los Maestros** (Usuarios, dentro de Ajustes),
visible para el admin, invitas a más gente. Ya adentro cambias foto, bio, colores, links y
slugs.

Cada usuario nace con su página, en el mismo momento en que lo invitas: la dirección sale
de su correo —`juanito@gmail.com` da `/juanito`—, y si esa ya está tomada se numera
(`/juanito-2`). No hace falta que entre para que su página exista, y no hay ningún momento
en que un usuario esté creado sin ella. Las direcciones que la app ya usa para otra cosa
—`admin`, `api`, `ingresar`— están reservadas: nadie recibe una página que quede tapada por
una ruta real, y tampoco puede tomarlas después editando su URL.

Esa página no se le puede quitar: el panel no ofrece borrar la última que le queda a un
usuario, y el servidor se niega aunque se lo pidan por otro camino. Quitar a un usuario sí
borra su página, y las dos cosas pasan juntas o no pasa ninguna.
Los dos perfiles de ejemplo están para que los edites, no para que los borres y empieces
de cero.

Cada fila de cada tabla (perfiles, cuentas, posts, borradores, comentarios, ajustes, llaves
de API) tiene dueño: el panel solo te muestra lo tuyo, nunca lo de otro usuario invitado. Lo mismo
la API: lo que entra con una llave es del dueño de la llave, y un agente con la tuya no ve
ni toca lo de nadie más. Tu fila de usuario —el nombre, la zona y el modo del panel— la
cambias solo tú: Tu Cuenta, el botón del modo y la app del teléfono escriben la fila de la
sesión o del token, nunca una que llegue en la petición. Los crons (sync,
publicación, comentarios) siguen recorriendo *todo* el despliegue sin filtrar por
dueño — un cron por inquilino es otro subproyecto, no esta entrega. La llave del despliegue
(`SCHEDULE_API_KEY`) y la raíz pública (`/`) siguen siendo del admin. Y hasta la entrega
3, dos usuarios todavía no pueden conectar la misma cuenta de la misma red: quien llega
segundo recibe un aviso, no la cuenta de otro. Eso es entre dos usuarios distintos: un
mismo dueño sí puede conectar varias cuentas suyas de la misma red y elegir a cuáles sale
cada publicación — ver «Varias cuentas de una misma red», más abajo.

La única tabla sin dueño es `solicitudes_borrado`, donde queda constancia de cada borrado
que Meta pide: cuando se escribe una fila, ese dueño ya no tiene cuentas de Meta y Meta no
sabe quién es. La escribe `/api/social/meta/borrado`, y `/borrado/<código>` la lee por el
código —tampoco por dueño, por la misma razón—.

> El segundo perfil nace con un slug aleatorio (`circulo-a1b2c3d4`) y con `noindex`, para
> que exista una versión que solo compartes a mano. Cámbialo por lo que quieras.

### 7. Tu dominio

En Vercel: **Settings → Domains → Add**, escribe tu dominio y copia los registros DNS que
te muestre en tu proveedor. El certificado HTTPS lo emite Vercel solo, en minutos.

**Un dominio sirve las páginas de su dueño; el del producto las sirve todas.** Varios
dominios pueden apuntar al mismo despliegue, y lo que cada uno muestra depende de si es el
que declaraste en `DOMINIO_PRODUCTO`:

| | `/` | `/<slug>` |
| --- | --- | --- |
| El dominio de `DOMINIO_PRODUCTO` | la landing del producto | la página de cualquier usuario |
| Cualquier otro dominio | la página principal del dueño | solo las páginas del dueño; el resto responde 404 |

Ese 404 es indistinguible del de una dirección que no existe —mismo código, mismo cuerpo,
mismos metadatos—, a propósito: si se notara la diferencia, tu dominio serviría para
averiguar qué usuarios hay.

Sin `DOMINIO_PRODUCTO` configurada no hay dominio del producto: todos sirven solo lo del
dueño, que es como funcionaba antes de que existiera la landing.

**El panel vive solo en el dominio del producto.** Abrir `/admin` o `/ingresar` en otro
dominio redirige al del producto con la misma ruta (`src/proxy.ts`), porque Meta solo
acepta los retornos de OAuth del dominio que registraste, y conectar Instagram o Facebook
desde otro falla sin explicar por qué. La API no se redirige —la app del teléfono puede
seguir llamando a un dominio viejo—, y tampoco los previews de Vercel ni local, donde el
panel se abre para probar una rama. Sin `DOMINIO_PRODUCTO`, nada se redirige.

<details>
<summary>Sin el botón (fork manual)</summary>

```bash
gh repo fork Ribs-org/portafolio-page --clone
cd portafolio-page
npm install
npm run setup        # crea .env.local con AUTH_SECRET y FINGERPRINT_SALT ya generados
```

Llena `DATABASE_URL` y `ADMIN_EMAIL` en el `.env.local`, y después:

```bash
npm run db:setup
npm run dev
npx vercel           # cuando quieras subirlo
```

Sin `RESEND_API_KEY` en desarrollo, el código de ingreso no se manda por correo: aparece
en la consola del servidor, y con eso basta para entrar en local.

Antes de publicar un fork, cambia `src/lib/empresa.ts`: el nombre legal, el RUT y el
correo de quien presta el servicio. Lo muestran el pie de la portada, la política de
privacidad y los términos, y Meta exige que coincida con el negocio que verificaste.

</details>

---

## Analítica de posts (opcional)

El panel puede traer las métricas de tus posts desde Instagram, TikTok y YouTube y
cruzarlas con el tráfico que cada uno te trajo. La columna que importa es **arrastre**:
qué porcentaje de quienes vieron el post llegó efectivamente a tu página.
YouTube es la excepción: ver abajo.

Sin configurar nada, la mitad «En las redes» de **Los Números** aparece vacía y el resto del sitio funciona
igual. Cada red se activa por separado.

### YouTube

En [Google Cloud Console](https://console.cloud.google.com), crea un proyecto, habilita
**YouTube Data API v3** y genera una API key: con ella se leen las estadísticas públicas
de los videos. El channel id sale de
[youtube.com/account_advanced](https://www.youtube.com/account_advanced).

```
YOUTUBE_API_KEY=AIza...
YOUTUBE_CHANNEL_ID=UC...
```

Un canal se sincroniza **solo mientras su dueño lo tiene conectado** con el OAuth de
Google desde **Los Fierros** (Cuentas, en Ajustes); eso pide además `GOOGLE_CLIENT_ID` y
`GOOGLE_CLIENT_SECRET` (ver «Variables de entorno»). `YOUTUBE_CHANNEL_ID` solo deja
creada la tarjeta del canal del dueño del despliegue, esperando su *Conectar*. Desconectar
borra las credenciales y el canal deja de leerse. Cambiar el id no reemplaza la cuenta:
crea una segunda fila de YouTube, sin conectar, que no se sincroniza.

**Lo que YouTube no deja hacer con sus datos.** Las políticas de los Servicios de API de
YouTube (§III.E.4) prohíben calcular métricas nuevas con sus datos y guardarlos más de 30
días sin refrescarlos, y la auditoría de cuota lo revisa. Por eso, en Los Números (el
tablero y la lista de publicaciones), la API de métricas y la app del teléfono, las filas de YouTube traen sus
contadores tal como los da la API, **sin lo ganado, sin arrastre y sin entrar en los
totales**; sus suscriptores van sin «ganados» y fuera de la suma de seguidores. Las
visitas, los clicks y el CTR los mide Tu Parrilla y la tabla los marca como propios
(«En tu página · lo mide Tu Parrilla»), que es lo que la política pide para un dato propio al lado de
los de YouTube. Y al final de la sincronización diaria se borra lo que pasó el plazo: las
lecturas diarias de más de 30 días, los comentarios guardados hace más de 30 días, y el
título y la miniatura de los videos que llevan 30 días sin llegar. La regla vive en
`src/lib/social/politica-youtube.ts` y el borrado en `retencion-youtube.ts`. Si algún día
se pide y se obtiene el permiso de analítica de §III.L, es ahí donde se afloja.

### Instagram — cuenta profesional y página de Facebook

Necesitas una cuenta Business o Creator **ligada a una página de Facebook**. La conexión
usa *Instagram API with Facebook Login*: el id de la cuenta de Instagram se descubre a
través de las páginas que administras, así que sin esa página no hay nada que leer.

En [developers.facebook.com](https://developers.facebook.com), crea una app, agrega el
producto **Facebook Login**, y configura como redirect URI válida:

```
https://TU-DOMINIO/api/social/instagram/callback
```

Los permisos que pide la app son `instagram_basic`, `instagram_manage_insights`,
`pages_show_list`, `pages_read_engagement` e `instagram_content_publish`. El último es el
que usa la publicación (reels, fotos, carruseles y trial reels); se pide junto con los demás
porque los permisos se conceden una sola vez, al autorizar.

Copia el app id y el secret. Mientras la app esté en **modo desarrollo** y tú seas su
dueño, no necesitas App Review.

```
INSTAGRAM_APP_ID=
INSTAGRAM_APP_SECRET=
```

Mientras la app siga en modo desarrollo, solo conectan las cuentas que tienen un rol en
ella (testers): a cualquier otra, Facebook le dice que la función no está disponible, y
ese error no vuelve a nuestro callback, así que no hay forma de interceptarlo. Pon
`META_EN_REVISION=1` para que Los Fierros lo avisen junto al botón de Instagram y de
Facebook, y quítala al pasar la app a Live. La de Tu Parrilla está en Live desde el 2026-10-19,
con los permisos aprobados: en producción la variable ya no está.

Al conectar se guarda tu **id de usuario de Meta**, que es lo que Meta manda cuando quitas
la app desde tu cuenta de Facebook: sin él no hay forma de saber a qué cuentas se refiere.
Las cuentas conectadas antes del 2026-09-30 lo tienen vacío hasta que vuelvas a conectar
Instagram y Facebook.

#### Las dos URLs que Meta exige

En **App Settings → Basic**, al final del formulario, hay dos campos que el App Review pide
llenos. Los dos apuntan a este sitio y los dos ya están implementados:

```
Deauthorize callback URL:    https://TU-DOMINIO/api/social/meta/baja
Data deletion request URL:   https://TU-DOMINIO/api/social/meta/borrado
```

Meta les hace `POST` con un `signed_request` firmado con `INSTAGRAM_APP_SECRET`; sin ese
secreto configurado, o con una firma que no calza, las rutas responden `400` y no tocan
nada. La **baja** deja sin credencial tus cuentas de Instagram y Facebook, igual que
*Desconectar* en Los Fierros, y su fila queda con «La conexión falló; reconecta la
cuenta.» —el motivo, «Quitaste la app desde Facebook: vuelve a conectar.», sale solo al
pasar el mouse—; el historial de métricas se conserva. El **borrado** sí borra lo que
vino de esas dos redes —posts, comentarios, métricas y los destinos programados de esas
cuentas— y devuelve a Meta un código y la dirección `https://TU-DOMINIO/borrado/<código>`,
una página pública donde ese código confirma cuándo fue y cuántas cuentas se borraron. Lo
que escribiste tú —el texto y la media de una publicación programada— no es de Meta y no
se toca mientras el corte conserve algún destino: uno que todavía salga en otra red sigue
en la parrilla. Un corte que se quede sin ningún destino se borra con ellos, texto y media
incluidos (la media la barre R2 al día siguiente), porque un corte sin destinos no
aparecería en ninguna pantalla y no habría forma de abrirlo ni de borrarlo.

Si tu cuenta se conectó antes del 2026-09-30 y no la has reconectado, su `meta_user_id`
está vacío: el callback responde igual, pero con cero cuentas afectadas.

**Estas dos URLs cubren Instagram y Facebook, no Threads.** Threads se conecta por el caso
de uso «API de Threads» de la misma app, que tiene su propio par de campos —firmados con
`THREADS_APP_SECRET`, no con el de arriba— y **todavía no está implementado**: quien quite
la app o pida el borrado desde Threads no llega a ninguna parte. Está anotado en
`docs/deuda-tecnica.md`. Mientras Threads esté en «Próximamente» (ver «Conectar y
sincronizar») nadie nuevo lo conecta.

#### Dejar entrar al revisor de Meta

El App Review de Meta lo hace una persona que entra al panel por su cuenta, y el ingreso es
solo por correo con un código de seis dígitos que esa persona no puede leer (no tiene
acceso a nuestro correo). Para dejarla entrar:

1. Invítala en **Los Maestros** (Usuarios, dentro de Ajustes) con el correo que va a usar
   Meta para revisar.
2. En Vercel, pon `REVISION_CORREO` con ese mismo correo y `REVISION_CODIGO` con un código
   fijo de seis dígitos. Mientras las dos estén puestas, ese correo recibe siempre ese
   código —no se le manda nada— y cualquier otro correo sigue como siempre.
3. Déjalas puestas también después de que la app pase a Live. Meta pide que las
   credenciales de prueba sigan activas un año y vuelve a revisar las apps cada cierto
   tiempo; sin la puerta, esa revisión no puede entrar y la app arriesga restricciones. La
   puerta solo abre el panel de ese usuario, con sus propias cuentas de prueba. Si cambias
   el código, cámbialo también en las instrucciones para revisores de la app de Meta.
   Como cualquier código, el fijo cuenta para el tope de diez errores por día
   (`MAX_FALLOS_POR_DIA` en `src/lib/ingreso.ts`): es lo que impide adivinarlo, y también
   quiere decir que quien pruebe códigos con ese correo deja al revisor fuera hasta el día
   siguiente.

El guion completo del video y de los pasos que el revisor sigue en el panel está en
`docs/meta-revision-guion.md`.

Si administras **más de una cuenta de Instagram**, al conectar el panel te muestra la
lista y marcas cuáles quieres ver. Cada una queda como una cuenta aparte, con sus
posts y sus métricas. Volver a conectar una que ya está solo renueva su acceso.

La analítica todavía agrupa por red: mientras una red tenga más de una cuenta conectada,
su tarjeta de seguidores y sus «ganados» muestran los números de una sola cuenta como si
fueran los de la red entera —eso se arregla en la próxima entrega—.

#### Renovar la conexión, cada ~60 días

El token de Facebook dura unos 60 días. El cron intenta extenderlo una semana antes de que
venza, pero **no está garantizado que eso funcione** sobre un token que ya es de larga
duración: la vía documentada por Meta para uno que se está muriendo es volver a pasar por
el login. Si el intento no sirve, la credencial caduca y la tarjeta de esa cuenta en
**Los Fierros** se pone roja con el error de la API.

Cuando pase, entra al panel y pulsa **Reconectar** en la tarjeta de esa cuenta. El
historial de métricas ya recogido no se toca. Cuenta con hacerlo cada dos meses más o menos.

Desconectar borra las credenciales de esa cuenta y conserva su historial. Para volver,
**Reconectar** en su tarjeta; para sumar otra cuenta de la misma red, **Agregar
cuenta** en el bloque de la red. Una tarjeta ya desconectada tiene además **Quitar**, que
pregunta en una ventana y borra la cuenta con su historial (sus publicaciones, números,
comentarios y destinos ya publicados); no deja si tiene publicaciones por salir. Es la
forma de liberar una cuenta para otro usuario: mientras su fila exista, queda atada a
quien la conectó.

#### Varias cuentas de una misma red

Puedes tener dos cuentas de Instagram —`@vicente` y `@vicenteclips`— y decidir a cuáles
sale cada publicación. **El compositor del panel, y Publicar en la app del teléfono,
listan tus cuentas, no las redes**, con su handle a la vista, y marcas las que quieras: el
mismo corte puede salir a las dos.

**Agregar la segunda** es «Agregar cuenta →» en el bloque de la red, y las redes tienden a
entrar solas con la cuenta que ya conectaste: TikTok autoriza la sesión abierta en el
navegador sin mostrar nada, Google entra con la única cuenta abierta y Meta repite lo que se
compartió con la app la vez anterior. Por eso TikTok se abre con `disable_auto_auth=1`
(muestra siempre su pantalla, con la cuenta que va a autorizar) y Google con
`prompt=select_account consent`. Y «Agregar cuenta →» marca su vuelta (`?agregar=1`, que deja
una cookie de diez minutos en la ruta de esa red): si la red trae la cuenta de antes, Los
Fierros no dice «conectado», dice que se renovó y no se agregó otra, y abre los pasos para
conseguirla (`src/lib/social/vuelta.ts` y `ayuda-conexion.ts`). En Meta no hay parámetro que
fuerce la elección de páginas: los pasos dicen cómo editar el acceso en la ventana de Facebook.

Nada viene marcado por omisión, salvo que tengas exactamente una cuenta conectada — contada
sobre las cuentas que cada pantalla puede ofrecer, que no es el mismo universo en las dos:
el panel cuenta sobre todas las tuyas, TikTok incluido; el teléfono, solo sobre las que
puede publicar, que hoy excluye TikTok (ver más abajo). Con una cuenta de Instagram y una de
TikTok, por ejemplo, el panel no marca nada —dos candidatas— y el teléfono marca la de
Instagram, porque ahí es la única que existe de verdad. No es una discrepancia: cada
pantalla acierta sobre su propio universo. Es deliberado: antes el sistema mandaba siempre a
la más antigua de cada red sin preguntar, y la segunda quedaba conectada y muda. Una sola
posibilidad no es una elección; dos sí, y las eliges tú.

Una cuenta cuya credencial venció aparece igual, en vez de desaparecer sin explicación, con
el mismo aviso de reconectarla en las dos superficies: en el panel, apagada y con el
texto aparte; en el teléfono, sin poder tocarse y con «reconéctala» al lado del nombre. Y
donde antes se leía solo la red —el calendario, la cola, el editor, y en el teléfono La
Parrilla— ahora se leen la red **y** el handle: `Instagram · @vicenteclips`.
Las dos cosas, porque casi ninguna de esas pantallas dibuja un icono de la red —el
calendario, la vista «Día», la cola y «Se quemó» son la excepción: el calendario, el día y «Se
quemó» con un chip por destino bajo el corte (el logo y un signo de cómo le fue), la cola con
ese mismo logo junto al handle y el estado, y en todas el handle en el `title` o al lado del
icono—, así que en el resto (el editor, y en el teléfono La Parrilla) el
handle sigue siendo lo que distingue cada destino, y la red sola no distingue dos cuentas
de la misma red en el mismo corte.

TikTok pide sus propias opciones por destino —privacidad, comentarios, dúo, comercial—, así
que con dos cuentas de TikTok marcadas verás dos bloques, uno por cuenta. No se comparten a
propósito: TikTok consulta los permisos por creador, y lo que una cuenta admite la otra
puede no admitirlo. Instagram también puede pedir una opción por destino —si el reel sale
como trial reel—, y tanto el compositor del panel como Publicar en el teléfono la ofrecen:
un bloque (panel) o un chip (teléfono) por cuenta de Instagram marcada —«Publicar como
trial reel» / «Trial reel · @handle»—, pero solo cuando hay exactamente un video elegido:
con fotos, carrusel o sin archivo no aparece, y sin marcarlo no se manda nada. Un trial reel
es exactamente un video, sin fotos: si eliges otra cosa con la opción marcada, el lote lo
rechaza antes de subir nada; el compositor y el teléfono no, porque los dos suben cada
archivo apenas se elige —el bloque y el chip no se ofrecen sin un video único, y la regla
del servidor queda como reja de fondo, no como el primer filtro. La app
del teléfono todavía no ofrece TikTok como destino: el bloque de TikTok necesita consultar
la cuenta del creador (`creator_info`) y sus interacciones, y eso el teléfono todavía no lo
tiene.

### TikTok

En [developers.tiktok.com](https://developers.tiktok.com), registra una app con los
productos **Login Kit** y **Content Posting API** (con *Direct Post* activado) y los
scopes `user.info.basic`, `video.list`, `video.upload` y `video.publish`. Redirect URI:

```
https://TU-DOMINIO/api/social/tiktok/callback
```

En *URL properties* verifica tu dominio raíz por registro TXT en el DNS: cubre el sitio y
el subdominio de R2 (`R2_PUBLIC_BASE`), de donde TikTok descarga los archivos. No uses el
archivo de firma dentro del bucket: el barrido de huérfanos lo borraría.

Una app nueva pasa por dos aprobaciones. Mientras TikTok no apruebe la app, solo el
**sandbox** deja autorizar cuentas: créalo en la pestaña Sandbox, agrega tu usuario como
*target user*, y usa **sus** credenciales. Y esa aprobación **no** incluye la auditoría de
Direct Post: hasta que se pida y pase, la publicación directa sale solo como «Solo yo» en
cuentas privadas, para un cupo de cinco usuarios al día. La app de este despliegue pasó las
dos —la app el 2026-09-28, Direct Post con aviso del 2026-10-06—: cualquier cuenta autoriza
y publica con la privacidad que elija, y el sandbox queda solo para grabar una revisión
futura. Y ojo al cambiar de app: TikTok da un id distinto por app, así que cada cuenta
vuelve como fila nueva y la vieja se fusiona desde Los Fierros (en su detalle, «Es la misma cuenta →»).


```
TIKTOK_CLIENT_KEY=
TIKTOK_CLIENT_SECRET=
```

Al pasar de solo lectura a publicar, las cuentas ya conectadas deben **reconectarse una
vez** desde Los Fierros para otorgar los scopes nuevos; el compositor lo pide con «Reconecta
TikTok para autorizar la publicación». A una app sin la auditoría de Direct Post, TikTok le
publica solo en **cuentas privadas** y como «Solo yo»: con la cuenta pública rechaza el init
con `unaudited_client_can_only_post_to_private_accounts`, aunque la publicación pida «Solo
yo». Ese rechazo no se reintenta —falla al primer intento, con la frase que pide poner la
cuenta en privada—, porque reintentar da lo mismo hasta que el dueño cambie su cuenta. Con
la auditoría aprobada, como la de este despliegue, ese rechazo no debería llegar, y el panel
ya no avisa nada de esto ni al conectar ni al elegir la privacidad.

### Responder comentarios

El panel puede traer los comentarios nuevos de tus publicaciones de Instagram, Facebook y
YouTube, y en la cola te propone una respuesta que apruebas de un toque. El descubrimiento
viaja en la misma corrida que publica, cada cinco minutos, y mira tus publicaciones de los
últimos siete días. A YouTube lo mira cada media hora, no cada cinco minutos: su cuota
diaria es la misma que usa la sincronización de métricas, y gastarla acá te dejaría sin
las dos cosas.

Después de fusionar, la migración se aplica sola al desplegar: las tablas de comentarios y de
ajustes son nuevas, y sin ellas el sondeo no tiene dónde guardar nada.

Para que funcione hay que **reconectar una vez cada red**, porque el permiso se concede
en el consentimiento: entra a **Los Fierros** (Cuentas, dentro de Ajustes) y pulsa
*Reconectar* en cada tarjeta de Instagram, Facebook y YouTube. Mientras no lo hagas, esa
red simplemente no trae
comentarios; nada más se rompe.

Los permisos que se agregan son `instagram_manage_comments`, `pages_manage_engagement` y,
en YouTube, `youtube.force-ssl` en vez de `youtube.readonly`. Con tus propias cuentas
ninguno espera un trámite: la app de Meta, en modo desarrollo, se los da a quien tenga un
rol en ella, y el proyecto de Google, verificado desde el 2026-10-14, a cualquiera.

Si al reconectar te sale **«Invalid Scopes»**, es que el caso de uso que da ese permiso no
está activado en tu app de Meta. Actívalo en el panel de desarrolladores y vuelve a
intentar.

El borrador lo escribe un modelo por la pasarela de IA de Vercel. Necesita
`AI_GATEWAY_API_KEY` en el entorno; en Vercel puedes omitirla si el proyecto usa OIDC. Sin
ella no se rompe nada: los comentarios entran a la cola sin borrador y los respondes a mano.
Con `COMENTARIOS_MODELO` cambias el modelo sin desplegar, con la forma `proveedor/modelo`.
El borrador tiene un tope de salida corto, así que la petición sale siempre con el
razonamiento apagado: un modelo de razonamiento se gastaría el tope pensando y te
devolvería el pensamiento a medias en vez de la frase. Con eso puedes usar uno de
razonamiento sin miedo. Sin la variable se usa `anthropic/claude-haiku-4.5`. Los modelos
gratuitos de la pasarela desaparecen sin aviso —`inclusionai/ling-3.0-flash-fin-free` dejó
de existir en octubre de 2026—, y entonces cada borrador falla con «No se pudo redactar la
respuesta» y el log dice `GatewayModelNotFoundError`: se arregla cambiando o borrando
`COMENTARIOS_MODELO` en Vercel, sin desplegar. El modelo por defecto, en cambio, es de pago:
con la pasarela en el plan gratuito, sin créditos cargados, cada borrador falla igual y el log
dice «Free tier users do not have access to this model». Se arregla cargando créditos en la
sección AI Gateway del equipo en Vercel.

De tu infraestructura salen tres cosas hacia el proveedor del modelo: el texto del
comentario, el nombre de quien lo dejó y el texto de la publicación. Nada más: ni tus
métricas, ni tus otros comentarios, ni datos de la persona.

Si el campo de instrucciones queda vacío rigen las de la casa: responder en español, en
primera persona, breve y cálido, sin inventar datos ni dar precios.

La cola vive en **La Mesa** (Comentarios), en el panel. Cada comentario nuevo llega con el borrador que
escribió el modelo; lo corriges si quieres y lo mandas con **Enviar**, o lo descartas. Si el
modelo no pudo redactar, la tarjeta lo dice y tiene **Reintentar borrador**. Arriba está el
campo con las instrucciones que sigue el modelo: las editas ahí y rigen desde el siguiente
borrador.

Nada sale sin tu toque. Dos toques, o el panel abierto en dos pestañas, mandan una sola vez
(la app del teléfono no tiene comentarios):
antes de enviar se relee el comentario y si ya salió no pasa nada.

El mensaje privado a quien comentó está escrito y **apagado**. Meta exige para eso
`pages_messaging` con acceso avanzado, que pasa por revisión de la app. El día que la
consigas, `COMENTARIOS_DM=1` en Vercel lo enciende para Instagram y Facebook, dentro de los
siete días que Meta permite. Hasta entonces la cola no muestra nada del privado.

Después de fusionar, la migración se aplica sola al desplegar: la tabla de comentarios gana
dos columnas para el estado del privado.

#### Respuesta automática por palabra clave

Al programar un post puedes ponerle una palabra clave, un mensaje con enlace y una
respuesta pública. Funciona en Instagram, Facebook y YouTube: cuando alguien comenta esa
palabra, la corrida siguiente del cron que la sondea (cinco minutos como mucho en Instagram y
Facebook; en YouTube, media hora) responde sola, sin pasar
por la cola de aprobación, y la cola lo marca como «Automática». Hoy el mensaje con el
enlace se publica siempre como la respuesta pública; el privado (respuesta corta en público
y el mensaje por DM, en Instagram y Facebook) llega en la próxima entrega, y va a depender
de que Meta apruebe `pages_messaging` con acceso avanzado y de `COMENTARIOS_DM=1`. TikTok
todavía no tiene cola de comentarios, así que una regla en un post que solo va a TikTok no
hace nada. Si el enlace es de tu sitio, se le agrega `?s=dm-<palabra>` y aparece como fila
propia en **Los Números** (Analítica) → «En tu página» → «⋯ Más» → «Todas las etiquetas». Para eso el servidor necesita saber
cuál es tu dominio: `SITE_URL=https://www.tu-dominio.cl` (si falta, usa el dominio de
producción que Vercel inyecta).

La regla puede traer además un PDF (`documentoUrl` en la API de lote, hasta 25 MB): se
descarga y se copia al almacenamiento propio al programar, no al comentar, para que un
enlace que muere después o una página de Drive no rompan la respuesta días más tarde. El
documento nunca se manda como adjunto, siempre como enlace al final del mismo mensaje —así
que hoy, igual que el resto de la regla, sale en la respuesta pública hasta que el privado
esté encendido.

### Modo Tinder

El panel puede leer los tuits nuevos de una lista de creadores que tú curas y —en las
entregas siguientes— proponerte una reescritura con tu voz que apruebas de un toque. Nada
sale publicado sin que lo veas.

Para que funcione necesitas `X_BEARER_TOKEN` en el entorno, que sacas del portal de
desarrolladores de X, en la misma app de la publicación en X (hoy en «Próximamente»). X ya no tiene capa
gratuita: hay que **activar facturación por uso en la app**. Cobra unos 0,005 dólares por
publicación leída, así que veinte creadores publicando tres veces al día salen por unos
nueve dólares al mes.

La traída corre cuatro veces al día, en su propio cron, y solo pide lo publicado desde la
última vez. Un creador que no publicó nada no cuesta nada. Hay un techo diario de 300
lecturas como red de seguridad; al alcanzarlo la traída para y sigue al día siguiente sin
perder nada.

El cron nuevo lo dispara el mismo pinger externo que el de publicación, así que hay que
darlo de alta en cron-job.org apuntando a `/api/cron/traer-ideas` con el mismo
`CRON_SECRET`, a las 9, 13, 17 y 21 UTC. Ese pinger es la única forma en que la traída
corre: sin esa entrada el endpoint existe y no lo llama nadie, y el síntoma sería una baraja
vacía sin ningún error a la vista.

Las tablas de creadores y de fichas son nuevas; su migración se aplica sola al desplegar.

Los creadores todavía no tienen pantalla: son filas que insertas a mano en la tabla
`source_authors`. Con los valores por defecto te basta la red y el nombre de usuario:
`INSERT INTO source_authors (network, username) VALUES ('x', 'algun_creador');`. El nombre
va sin arroba.

### Conectar y sincronizar

Antes que nada, la migración se aplica sola al desplegar: la analítica de posts agrega
tablas nuevas. La migración corre antes del build, así que ese peligro no existe:
`/admin/analytics` y el cron nunca corren contra un esquema viejo.

Con eso hecho, las variables puestas y un redeploy encima, entra a `/admin/accounts`
(**Los Fierros**, Cuentas, dentro de Ajustes) y aprieta *Conectar* en cada red; con varias
páginas o cuentas, elige cuáles. El `vercel.json` del repo declara una corrida diaria a las
9:00 UTC; Vercel inyecta `CRON_SECRET` solo. También puedes apretar *Sincronizar ahora*
cuando quieras.

**Threads y X, en «Próximamente».** Su código está entero, pero no se ofrecen: en Los Fierros
dicen «Próximamente» en vez de *Conectar*, la conexión no arranca ni termina, el compositor, el
editor y el teléfono no las ofrecen como destino, y lo que llegue por la API o por el lote se
rechaza con una frase fija (`REDES_PROXIMAMENTE` y `fraseProximamente`, en
`src/lib/networks.ts`; la reja vive en `validateScheduleDraft`). Así un usuario nuevo no se
topa con una red que no funciona: Threads espera la segunda vuelta del App Review de Meta, y X
no publica hoy (el detalle, en `docs/pendientes.md`). Lo programado antes a esas redes se
sigue intentando. Abrir una es sacarla de esa lista.

**Qué se lee cada día.** La lectura va por edad, no por cantidad (`src/lib/social/lectura.ts`).
Lo publicado en los últimos 10 días —y, como mínimo, las 200 publicaciones más nuevas de la
cuenta— se lista y se lee entero, todos los días. Lo más viejo se pide por su id, cada vez
más espaciado: una vez por semana hasta los 30 días, cada 14 hasta los 90 y cada 28 después
(28 y no más, porque la retención de YouTube borra sus lecturas de más de 30 días). Hasta
octubre de 2026 se leían solo las 200 más recientes de cada cuenta, y con unas 50
publicaciones diarias lo de la semana anterior quedaba congelado con los números del día en
que salió de esa ventana. Lo viejo se lee al final y con plazo: 180 segundos desde que
empieza la corrida, contados para todas las cuentas; lo que no alcanza sigue en la fila al
día siguiente, de lo más nuevo a lo más viejo, y un error leyéndolo no pinta la cuenta de
rojo. Lo nuevo no tiene plazo. A unas 50 publicaciones diarias por cuenta, cada red alcanza
para cinco o seis cuentas así en serie dentro de los 300 segundos del cron; más que eso pide
partir la corrida.

Una publicación que ya no responde cuando se la pide por id (borrada, casi siempre) se salta
y nada más: no se archiva, porque la misma respuesta de Meta cubre «sin permiso». Solo se
archiva lo que falta dentro de lo que el listado alcanzó a ver, como siempre.

**Si una cuenta aparece dos veces —una «Sin credencial» y otra viva—, no es un error tuyo.**
TikTok, Instagram y Facebook le dan a la misma persona un identificador distinto por cada
app: al pasar del sandbox a la app real (o al crear una app nueva) la misma cuenta vuelve
a conectarse como una fila nueva, y la vieja queda muerta para siempre, con sus posts, sus
métricas y su historial de publicaciones. Esa tarjeta ofrece **«Es la misma cuenta →»**:
elige la viva y todo lo de la vieja pasa a ella —posts, métricas por día, historial y
comentarios; ante un mismo video sincronizado bajo las dos, gana la viva y se completan sus
días—, y la vieja desaparece. No se puede deshacer, y solo se ofrece en tarjetas sin
credencial: una cuenta viva se desconecta primero, a propósito.

Y una nota sobre TikTok: su tarjeta nunca avisa «la conexión vence mañana», aunque su
token dure 24 horas. Se renueva solo con uno de refresco de un año; lo que sí la enfría es
quedarse sin credencial o que falle una sincronización.

Después de sincronizar, cada post trae su etiqueta `?s=` lista. Copia el link de la fila,
pégalo en el post, y de ahí en adelante el cruce es automático.

#### Migrar a multicuentas (una vez, 2026-09)

El esquema pasa a identificar posts, métricas y destinos por cuenta. Con datos ya
cargados, el orden importaba.

(Hecho el 2026-09-1x, antes de las migraciones versionadas; se conserva como historia.
Hoy un cambio así iría en dos PRs, ver «Cómo cambia el esquema».)

0. `.env.local` apuntaba a la base de producción (`npx vercel env pull .env.local`); y
   esta consulta tenía que devolver cero filas: `select network, external_id from
   social_accounts where external_id is null;` — una cuenta sin id externo no tenía
   identidad para la migración; se reconectó antes.
1. Con el código de **antes** del cambio corriendo en producción, se corrió `npm run
   db:push` para la fase 1 del esquema: desde el commit `f47bca7`, «Agrega account_id a
   posts, métricas y destinos, con su backfill».
2. Se corrió `npm run cuentas:backfill`: asignó cada fila a la única cuenta de su red.
   Terminó en «Filas sin cuenta: 0».
3. Se desplegó el código nuevo (merge y promoción a `main`).
4. Se volvió a correr `npm run cuentas:backfill` (por si una sincronización corrió entre
   los pasos 2 y 3) y, desde `main`, se corrió `npm run db:push` para la fase 2: columnas
   obligatorias y claves únicas viejas retiradas.

El backfill del paso 4 corre **inmediatamente después del deploy, antes del próximo
cron**: el pinger de publicación pasa cada 5 minutos y el cron de sincronización a las
9:00 UTC, y una sincronización entre el deploy y ese backfill tumba toda la cuenta por
el día — las filas viejas (`account_id` nulo) no chocan con la unique nueva, así que el
insert cae en la unique vieja de `(network, external_id)`. Por eso conviene desplegar
lejos de las 9:00 UTC.

Además del riesgo de sincronización, un post que el código viejo agenda entre el paso 2
y el 3 consigue su cuenta por el respaldo por red (mismo mecanismo que la publicación,
más abajo), y sigue así hasta que corre el backfill del paso 4 — por eso **no se
programa nada entre el paso 2 y el 3**. Y la migración no tiene vuelta atrás: hecho el
paso 4, revertir el deploy al código viejo lo rompe de inmediato, porque sus
`ON CONFLICT` apuntan a `social_accounts.network` y a `social_posts (network,
external_id)`, claves que ya no existen.

---

## Atribuir tráfico a una pieza de contenido

Agrega `?s=` al link que pones en la bio:

```
tudominio.com/?s=reel-agosto
tudominio.com/?s=tiktok-rutina
```

Cada etiqueta aparece por separado en **Los Números** (Analítica): las cinco que más traen en
«Qué publicación te trajo gente», y todas en el «⋯ Más» de «En tu página», con sus
visitas, únicos, clicks y CTR. Es el mecanismo principal de atribución porque Instagram y
TikTok abren los links en su navegador interno y borran el referrer.

También se leen `utm_source`, `utm_medium`, `utm_campaign` y `utm_content`.

## Qué se guarda de cada visita

País, región, ciudad y zona horaria (headers de Vercel), dispositivo, sistema operativo,
navegador, referrer y red de origen, la etiqueta `?s=`, idioma del navegador y si es un bot.

**La IP nunca se guarda.** El identificador de visitante es
`SHA-256(IP + user-agent + FINGERPRINT_SALT + fecha UTC)`. Como la fecha entra en el hash,
el mismo visitante recibe uno distinto al día siguiente: "visitantes únicos" es una métrica
diaria. Ese es el precio deliberado de no usar cookies, y es lo que evita el banner de
consentimiento.

---

## Comandos

```bash
npm run dev          # servidor local
npm run typecheck    # tipos
npm run build        # build de producción
npm run lint         # eslint
```

**Base de datos**

```bash
npm run setup             # crea .env.local a partir de .env.example, con secretos generados
npm run db:setup          # db:migrate:local + db:seed, para un proyecto recién creado
npm run db:migrate        # lo corre Vercel en el build; sin .env.local, a mano no hace nada
npm run db:migrate:local  # aplica las migraciones pendientes con .env.local
npm run db:baseline       # una sola vez sobre una base que ya tenía el esquema; antes de fusionar el cambio a migraciones
npm run db:seed           # crea los dos perfiles iniciales (solo si no hay ninguno)
npm run db:studio         # explorador visual de las tablas
```

**Analítica**

```bash
npm run demo:seed        # llena el dashboard con 30 días de tráfico falso
npm run demo:clear       # borra solo ese tráfico falso
npm run analytics:reset  # borra TODAS las visitas y clicks, reales incluidos
npm run analytics:check  # imprime la última visita y el último click
```

`demo:seed` sirve para ver cómo se ve el dashboard antes de tener tráfico real. Las filas
que crea llevan un prefijo `demo:` en `visitor_hash`, así que `demo:clear` las quita sin
tocar nada real.

## Cómo cambia el esquema

El esquema vive en `src/db/schema.ts` y cambia por migraciones en `drizzle/`, que van en el
PR y se revisan como código:

1. Edita `src/db/schema.ts`.
2. `npm run db:generate` crea `drizzle/NNNN_*.sql`; commitéalo junto al cambio. El CI falla
   si el esquema cambió y la migración no está.
3. Al desplegar, Vercel corre `npm run db:migrate` antes de construir: si la migración
   falla, el código nuevo no se promueve. Los previews solo migran con `MIGRAR_PREVIEWS=1`;
   hasta entonces se saltan.

Mientras los previews no migren, un preview de un PR que agrega una columna corre código
nuevo contra la base de producción sin esa columna: las páginas que la usan responden 500
hasta que el cambio llegue a producción.

**Regla de convivencia:** una migración tiene que convivir con el código anterior mientras
dura el despliegue y ante un rollback instantáneo. Agregar columnas con default o nulables,
tablas e índices, sí. Borrar o renombrar, solo en un PR posterior al que dejó de usarlas.

Una base que ya tenía el esquema antes de las migraciones (producción el 2026-09-16) se
registra una sola vez con `npm run db:baseline`; una base nueva se crea entera con
`db:setup`. Se corre **antes** de fusionar el cambio que trae las migraciones: si
producción se despliega primero, el build intentará aplicar la migración inicial entera,
fallará en la primera tabla que ya existe y no se promoverá (sin daño, pero un deploy
perdido).

### Si una migración falla a medias

El migrador aplica las sentencias de cada archivo una por una, sin
transacción, y solo registra la migración cuando todas terminan bien. Si una falla a
mitad de camino, las sentencias anteriores quedan aplicadas y nada queda registrado: el
próximo build vuelve a intentar el mismo archivo desde el principio y falla en la primera
sentencia con «already exists». Se repara a mano: se aplican las sentencias que faltaban y
se inserta la fila correspondiente en `drizzle.__drizzle_migrations`, con el hash del
archivo y el `when` del journal. Por eso conviene una sola sentencia por migración: así una
falla a medias dura cero sentencias aplicadas.

## Respaldos

El plan gratis de Supabase no respalda nada, así que `.github/workflows/respaldo.yml` vuelca
la base entera cada día a las 06:40 UTC y la deja como artefacto de GitHub Actions por 90
días. Necesita el secreto `DATABASE_URL_UNPOOLED` en el repositorio.

**El volcado sale cifrado, y tiene que seguir así.** El repositorio es público, y los
artefactos de un repositorio público los baja cualquiera con cuenta de GitHub: un respaldo
en claro es la base entera —correos, publicaciones, comentarios de terceros— a la vista.
El workflow cifra con [`age`](https://age-encryption.org) para la llave pública que tiene
escrita (`DESTINATARIO`); la privada no está en GitHub ni en el repositorio, la guarda el
dueño. Sin ella los respaldos no se abren, así que va en un gestor de contraseñas o en un
lugar con copia.

Para restaurar, en una base nueva o local (nunca encima de producción sin pensarlo):

```bash
gh run download <id-de-la-corrida> -R Ribs-org/tu-parrilla   # o bájalo desde la pestaña Actions
age -d -i clave-respaldos.txt parrilla.dump.age > parrilla.dump
pg_restore --no-owner --no-privileges -d "<url-de-la-base>" parrilla.dump
```

`pg_restore` tiene que ser de la versión 17 o mayor, como el `pg_dump` que lo generó; el de
un contenedor `postgres:17` sirve. Si la llave privada se pierde, se genera otra con
`age-keygen`, se cambia `DESTINATARIO` en el workflow, y los respaldos viejos quedan
perdidos.

## Variables de entorno

La plantilla comentada está en [`.env.example`](.env.example). En producción viven en
Vercel y bajan con `vercel env pull .env.local`.

| Variable | Para qué | ¿Obligatoria? |
| --- | --- | --- |
| `DATABASE_URL` | Supabase Postgres, por el *pooler* | Sí — la pone la integración |
| `ADMIN_EMAIL` | El correo del primer usuario | Sí |
| `AUTH_SECRET` | Firma de la cookie de sesión | Sí |
| `FINGERPRINT_SALT` | Sal del hash de visitante | Sí |
| `INGRESO_FROM` | Remitente de los códigos de ingreso | No — sin ella se usa el remitente de prueba de Resend |
| `R2_ACCOUNT_ID` | ID de tu cuenta de Cloudflare | No — sin ella no puedes subir media |
| `R2_ACCESS_KEY_ID` | Llave de acceso para R2 | No — sin ella no puedes subir media |
| `R2_SECRET_ACCESS_KEY` | Llave secreta para R2 | No — sin ella no puedes subir media |
| `R2_BUCKET` | Nombre del bucket de R2 | No — sin ella no puedes subir media |
| `R2_PUBLIC_BASE` | URL pública del bucket de R2 | No — sin ella no puedes subir media |
| `DOMINIO_PRODUCTO` | El dominio donde vive la landing del producto. Ese dominio sirve las páginas de todos; los demás, solo las de su dueño. Es también el único donde se abre el panel | No — sin ella ningún dominio es el del producto y todos sirven solo lo del dueño |
| `SITE_TIMEZONE` | Zona por defecto de los usuarios nuevos y del sitio público; cada usuario cambia la suya en Tu Cuenta. Si no es una zona IANA conocida, se avisa por consola y se usa `America/Santiago` | No — por defecto `America/Santiago` |
| `YOUTUBE_API_KEY` | Lee las estadísticas públicas de los canales conectados | No — sin ella YouTube no trae métricas |
| `YOUTUBE_CHANNEL_ID` | Deja creada la tarjeta del canal del dueño del despliegue; se sincroniza recién cuando lo conecta con OAuth | No |
| `GOOGLE_CLIENT_ID` | Conectar YouTube para publicar (OAuth de Google) | El OAuth Client tipo Web del mismo proyecto de la API key |
| `GOOGLE_CLIENT_SECRET` | El secreto de ese OAuth Client | Junto con el anterior; el sync de solo lectura sigue usando `YOUTUBE_API_KEY` |
| `INSTAGRAM_APP_ID` | Conectar Instagram | No — sin ella esa red aparece como no conectada |
| `INSTAGRAM_APP_SECRET` | Conectar Instagram, y verificar la firma de los callbacks de baja y borrado de Meta | No — sin ella esa red aparece como no conectada y esos dos callbacks responden `400` |
| `TIKTOK_CLIENT_KEY` | Conectar TikTok | No — sin ella esa red aparece como no conectada |
| `TIKTOK_CLIENT_SECRET` | Conectar TikTok | No — sin ella esa red aparece como no conectada |
| `META_EN_REVISION` | Enciende en Los Fierros el aviso de que, mientras la app de Meta esté en revisión, solo conectan las cuentas invitadas como testers | No — solo mientras la app de Meta esté en modo desarrollo |
| `REVISION_CORREO` | El único correo (ya invitado en Los Maestros) que recibe un código de ingreso fijo en vez de uno mandado por correo, para que el revisor de Meta entre | No — solo con la app de Meta en revisión o publicada (Meta vuelve a revisarla) |
| `REVISION_CODIGO` | El código fijo de seis dígitos que vale para ese correo; el mismo que dicen las instrucciones para revisores en Meta | No — va junto a `REVISION_CORREO` |
| `THREADS_APP_ID` | Conectar Threads para publicar; hoy en «Próximamente» (ver «Conectar y sincronizar») | El Threads App ID del caso de uso «API de Threads» de la app de Meta |
| `THREADS_APP_SECRET` | El secreto de ese caso de uso | Junto con el anterior |
| `X_CLIENT_ID` | Conectar X para publicar (OAuth 2.0 + PKCE); hoy en «Próximamente» | El Client ID de la app en developer.x.com |
| `X_CLIENT_SECRET` | El secreto de esa app | Junto con el anterior |
| `CRON_SECRET` | Autoriza las corridas programadas (sync diario y publicación cada 5 minutos) | No — la pone Vercel solo, al declarar el cron |
| `MIGRAR_PREVIEWS` | Que los previews migren la base | Solo cuando el preview tenga una base propia; contra la de producción, no |
| `SCHEDULE_API_KEY` | La llave del despliegue: abre `POST /api/schedule/batch` (carga masiva), `DELETE /api/schedule/posts/{id}` (sacar lo programado), `GET /api/schedule/posts` (calendario), `GET /api/schedule/resumen` (el resumen del día), `GET /api/schedule/cuentas` (las cuentas), `GET /api/metrics/posts` (métricas) y `GET /api/metrics/mejores` (el mejor X %) a nombre del admin. Es anterior a las llaves por usuario y sigue para el agente que ya la usa | No — sin ella los siete endpoints aceptan solo las llaves que cada usuario genera en Tu IA; si la pones, genérala igual que `CRON_SECRET` |
| `RESEND_API_KEY` | Manda los códigos de ingreso y los avisos: la publicación que se quemó, la cuenta que se cayó y el resumen del día (ver «Avisos por correo») | Sí — sin ella nadie puede entrar al panel |
| `PUBLISH_ALERT_TO` | Adónde va un aviso sin dueño con correo: un post o una cuenta de antes de los usuarios. Lo demás va al correo de su dueño | No — sin ella, lo que no tiene dueño no avisa; el calendario y Los Fierros lo siguen mostrando |
| `PUBLISH_ALERT_FROM` | Remitente de los avisos | Opcional; default `onboarding@resend.dev`, que solo entrega al correo de la cuenta de Resend |

Para cambiar una variable en producción:

```bash
vercel env rm NOMBRE production --yes
printf '%s' 'el-valor-nuevo' | vercel env add NOMBRE production
vercel --prod
```

Repite para `preview` y `development` si quieres el mismo valor en todos lados.

> En PowerShell, `"valor" | vercel env add ...` escribe un BOM al principio del valor y lo
> corrompe en silencio. Usa `printf` desde Git Bash, o la interfaz web de Vercel.

### Cron de publicación cada 5 minutos

La cadencia real de `/api/cron/publish-social` la da un pinger externo (por ejemplo
[cron-job.org](https://cron-job.org)) que lo llama cada 5 minutos con el header
`Authorization: Bearer <CRON_SECRET>` — el plan Hobby de Vercel solo permite crons
diarios, así que `vercel.json` declara apenas una corrida diaria de respaldo. En plan
Pro puedes cambiar ese schedule a `*/5 * * * *` y prescindir del pinger: el endpoint
es el mismo en los dos casos, cambia solo quién lo dispara.

Cada corrida hace cuatro cosas, en orden: publica lo vencido, vigila las conexiones de las
cuentas (manda el correo de las que se cayeron; ver «Avisos por correo»), sondea comentarios
(con la mitad del presupuesto como mucho) y barre los archivos huérfanos de R2. Al terminar cada
fase escribe `[cron] <fase> listo a los N ms` en el log, y el barrido dice cuántos objetos
leyó: si una corrida muere por `maxDuration` (240 s), la fase colgada es la primera que no
dejó su línea. El barrido tiene un plazo de un minuto por lectura —el listado de R2 y la
consulta a la base, cada una con su línea `[barrido]`— y, si no le alcanza, se rinde hasta la
pasada siguiente sin borrar nada: un barrido que no termina no puede llevarse la corrida.

Un destino que falla se reintenta, hasta tres intentos, salvo los rechazos que la red ya
decidió, que se queman al primero. Entre un intento y el siguiente hay una espera
(`reintentarDesde`): quince minutos después del primero y dos horas después del segundo,
así que un destino se quema recién unas dos horas y cuarto después de su hora, y una red
caída hasta dos horas ya no lo pierde. Antes los tres intentos iban en corridas seguidas y
se gastaban en diez minutos. «Subir ahora» no espera: es el dueño pidiendo el intento ya.
Mientras espera el siguiente, el panel lo muestra como **Reintentando** con el motivo del
intento anterior —en el editor del post y en la cola; la tarjeta del calendario dice
«Reintentando» con sus redes y deja el motivo al pasar el mouse—, y el correo de aviso llega
solo cuando se quema: sin ese motivo a la vista, un reintento escondía el error real hasta
agotar los intentos.

El tope diario de Instagram (las publicaciones por API que una cuenta puede hacer en 24
horas) no es un fallo: el cupo vuelve solo, una publicación a la vez, 24 horas después de la
que lo gastó. Un destino que choca con él no gasta intento ni se quema; espera una hora y
prueba de nuevo, con el contenedor ya hecho para no volver a subir el video, y el panel lo
muestra como «Reintentando» con la frase «Instagram llegó a su tope de publicaciones por
día: sale apenas se libere un cupo.» (`esTopeDiario`, en `social/publish/instagram.ts`).

### Avisos por correo

Tres correos, todos con el remitente `PUBLISH_ALERT_FROM` y al correo del dueño (o a
`PUBLISH_ALERT_TO` si lo que avisa no tiene dueño con correo). Las reglas viven en
`src/lib/avisos/reglas.ts`, sin base; lo que lee y manda, en `src/lib/avisos/run.ts`.

- **Una publicación que se quemó**: «No se pudo publicar en <Red>», con el motivo. Sale al
  quemarse, una vez por destino. No sale cuando el motivo es la conexión de la cuenta: de eso
  avisa el correo siguiente, una sola vez.
- **Una cuenta cuya conexión se cayó**: «Se cayó la conexión con <Red> · <cuenta>», con
  cuántas publicaciones tiene por salir ahí. Sale cuando su fierro queda frío —vencida, con la
  sincronización rota, con una baja desde Facebook, o porque la red rechazó la conexión al
  publicar (`marcarCaida` lo anota en la cuenta desde el primer intento)—, a los cinco
  minutos, en la pasada siguiente del cron de publicación. Llega uno por caída, no uno por
  post: `social_accounts.caida_avisada_en` lo marca y se borra cuando el fierro vuelve a
  calentarse. Una cuenta que el dueño desconectó a propósito no avisa. El día que esto se
  despliega, cada cuenta que ya estaba caída manda el suyo una vez.
- **El resumen del día**: lo que se quemó en las últimas 24 horas (con la cuenta en el modo
  día, lo que «se echó a perder», como se llama ahí la sección), las cuentas por reconectar
  (frías o a menos de siete días de vencer) y las cuentas en uso —con algo programado en los
  últimos 30 días— que tienen menos de tres días programados hacia adelante. Sale después de
  la sincronización diaria (9:00 UTC), y solo los días en que hay algo que contar. Lo mismo
  se lee por API en `GET /api/schedule/resumen` (ver «Resumen por API»), para que quien
  programa con un agente se entere aunque los correos le lleguen al dueño.

### Guía para el editor de contenido

`public/docs/api-editor.md` documenta los siete endpoints en detalle, escrito para que un
LLM que crea contenido lo lea entero y no necesite explicaciones: contratos, reglas
por red, todas las frases de error y qué significa cada métrica. Se sirve tal cual en
<https://tu-parrilla.cl/docs/api-editor.md>. No contiene secretos — la llave
viaja aparte: cada usuario la genera en Tu IA, y el botón que la copia pega al lado
la dirección de la guía compacta — pero es público: si prefieres que no lo sea, muévelo
fuera de `public/`.

Al lado, para un LLM que llama a la API a ciegas y no tiene este repositorio delante:
`public/docs/api.json` (el JSON Schema exacto del cuerpo del lote, con los límites que
aplica el validador) y `public/docs/api-llm.md` (la guía compacta orientada a la tarea,
con las frases de error literales y lo que Meta no permite en el mensaje privado). Una
prueba (`src/lib/docs-api.test.ts`) falla si cualquiera de los dos se aparta de las
constantes reales del código.

Y para cuando la persona —no el agente— se pierde en el panel: `public/docs/ui/`, la wiki
de la interfaz, una página por pantalla del panel y otra para la app del teléfono, con cada
botón por su texto literal, los mensajes que puede ver y qué hacer con cada uno. La lee el
mismo LLM para guiarla («¿dónde genero una llave?») sin ver la pantalla; se sirve en
<https://tu-parrilla.cl/docs/ui/index.md>. Se actualiza en el mismo commit que cambia lo que
se ve (`AGENTS.md`, «La wiki de la UI»; el formato, en `docs/wiki-ui.md`), y
`src/lib/docs-ui.test.ts` falla si una pantalla del vocabulario no tiene su página o si una
página cita archivos que ya no existen.

### La llave de la API

Los siete endpoints de abajo piden el header `Authorization: Bearer <llave>`, y lo que
hacen lo hacen a nombre del dueño de la llave: sus cuentas, sus posts, su zona. Valen dos
clases de llave:

- **Las de cada usuario** (`tp_…`), que se generan y se revocan en Tu IA. Viven en
  `llaves_api`, de la que solo se guarda el hash; cada uso anota la fecha en la fila.
- **La del despliegue**, `SCHEDULE_API_KEY`, que actúa como el admin. Es la que existía
  antes de las llaves por usuario y sigue andando para no romper al agente que ya la usa.

Sin header, con una llave que no es ninguna de las dos o con una revocada: `401` con el
cuerpo `No autorizado`. La lógica vive en `duenoDeLaLlave` (`src/lib/llaves.ts`).

### Carga masiva por API

`POST /api/schedule/batch` con header `Authorization: Bearer <llave>` y
cuerpo `{ "posts": [{ "fecha": "2026-09-03 10:00", "texto": "Hola", "redes": ["x"], "media": [] }] }`
(máximo 50). Cada item elige su destino de dos formas: `cuentas` (identificadores de
cuenta) o `redes` (nombres de red). Si la fila trae `cuentas`, esas mandan y `redes` se
ignora. Nombrar solo `redes` sigue funcionando, pero cada nombre se resuelve a una
cuenta solo cuando el dueño tiene **exactamente una** conectada de esa red — con dos, la
fila se rechaza nombrando las candidatas y sus handles; no hay adivinanza posible.
Responde el resultado por item; las filas rechazadas traen su motivo.

Cada fila puede traer una `ref`: un texto de hasta 100 caracteres, único por dueño, que el
que llama elige (el id de la fila en su planilla, por ejemplo). Sirve para el caso que antes
duplicaba: si la función alcanza su tiempo máximo a mitad de un lote, o se corta la conexión,
la respuesta se pierde pero las filas ya procesadas quedan programadas. Reenviar el lote
entero devuelve esas filas con su `postId` y `repetido: true`, sin programarlas de nuevo —ni
descargar su media, ni volver a validarlas: su hora pudo pasar desde el primer envío—, y
programa solo las que faltaban. La `ref` no compara contenidos: si la fila cambió, el post
que vuelve es el de antes. Para que eso valga, cada post entra con sus destinos, su media y su
regla en una sola transacción, y la unicidad `(owner_id, ref)` de `scheduled_posts` resuelve
dos envíos simultáneos. Sin `ref`, reenviar sigue duplicando.

Cada item acepta además `atributos`: un objeto plano de valores simples
(`{"hook": "pregunta-polemica", "tema": "negocios", "serie": "mut"}`, máximo 20
claves) que el sistema guarda sin interpretar y devuelve junto a las métricas. Es la
taxonomía de quien crea el contenido: sirve para correlacionar decisiones creativas
con resultados, y el panel la usa en «Comparar por atributo». Las guías de la API recomiendan
un vocabulario —`tema`, `hook`, `estilo`, `serie` y, para la edición, `color`, `fuente`,
`ritmo`, `musica` y `duracion`—, opcional y sin validar: sirve si el agente que edita los
videos lo usa siempre igual (`public/docs/api-llm.md`, sección 2b). No hay etiquetado
automático, a propósito: costaría tokens por cada post. Una sola clave tiene significado
para el panel: `pieza`, que junta como versiones de una misma pieza a los posts que
comparten su valor. El CSV no lo lleva; el editor de un post programado lo muestra y
permite corregirlo.

Y `opciones`, obligatorio cuando algún destino de la fila es una cuenta de TikTok (el
modo, la privacidad y las casillas que TikTok exige elegir por publicación) y opcional
para Instagram (`trialReel`, para que el reel salga como trial reel — solo lo ven quienes
no siguen la cuenta, hasta que el dueño lo comparte desde la app). Se llavea por destino:
cada clave se busca primero entre los identificadores de cuenta de la fila, y si no
coincide con ninguno se acepta como nombre de red — resuelta solo si la fila tiene una
única cuenta de esa red, igual que `redes`. El detalle está en `public/docs/api-editor.md`.

### Métricas por API

`GET /api/metrics/posts` con el mismo `Authorization: Bearer <llave>`.
Parámetros opcionales: `desde` y `hasta` (`YYYY-MM-DD` en la zona horaria del dueño, la de Tu Cuenta; ambos
inclusive; por defecto los últimos 30 días), `red` (una de las conocidas) y `cuenta` (el id
de una cuenta, o su nombre en la red con o sin «@»; si el nombre se repite en dos redes, va
con `red`).

Devuelve `{ truncado, posts: [...] }` con una fila por publicación **publicada dentro
del rango** — no por métrica movida en él: un video de agosto que crece en septiembre
aparece en una consulta de agosto, no de septiembre. Cada fila trae red, `cuenta` (`id`,
`red` y `nombre`), `externalId`,
permalink, texto, `publicadoEl` (ISO con el offset de la zona del dueño), la etiqueta `?s=`, sus
`atributos` (o `null` si el post no salió del calendario; en TikTok, también hasta la
sincronización siguiente a su publicación, que es la que le encuentra el id del video —ver
`docs/deuda-tecnica.md`, «TikTok: el id del video se recupera por texto y hora»—) y `metricas`: `views`
(acumulado), `viewsGanadas` (dentro del rango), `viewsA7Dias` (el contador a la semana de
publicada), `contraSuCuenta` (eso sobre la mediana de su cuenta en el rango), `likes`,
`comentarios`, `compartidos`, `alcance`, `visitasAlSitio`, `clicks`, `ctr` y `arrastre`. Un
`null` significa que la red no reportó ese número — nunca cero. En YouTube, `viewsGanadas`,
`viewsA7Dias`, `contraSuCuenta` y `arrastre` vienen siempre en `null`: sus políticas no
permiten calcular métricas nuevas con sus datos (ver «Analítica de posts»). `truncado: true` avisa que el tope de filas mordió y la respuesta
es parcial.

Las métricas las trae la sincronización diaria, así que lo publicado hoy aparece con
números recién al día siguiente.

`GET /api/metrics/mejores`, con los mismos parámetros más `metrica` (`viewsGanadas` por
defecto, `contraSuCuenta`, `viewsA7Dias`, `visitas`, `clicks`, `interacciones` o
`arrastre`), `percentil` (entero de 1 a 50, 10 por defecto), `lado` (`mejor` por defecto, o
`peor`) y `recientes` (`si` por defecto, o `no` para dejar fuera lo de menos de 7 días),
devuelve el mejor (o el peor) X % de lo publicado en el rango: el corte para entrar, cuántas
compiten, las del grupo con sus métricas, las medianas del grupo contra las del resto y lo
que se repite más en el grupo. Lee hasta 10.000 publicaciones, como la pantalla, porque
responde solo el grupo. Las mismas reglas que la pantalla «Tu mejor 10 %», salvo lo que esta
cambió por defecto (la métrica y las recientes), que en la API sigue como antes para no
moverle la respuesta a quien ya la usa; la lógica, sin base, está en `src/lib/mejores.ts`.

### Calendario por API

`GET /api/schedule/posts` con el mismo `Authorization`. Parámetros opcionales `desde`
y `hasta` (`YYYY-MM-DD` en la zona horaria del dueño, la de Tu Cuenta; ambos inclusive; por defecto de hoy a 30
días). Devuelve `{ desde, hasta, posts }` con lo programado cuya **hora de salida** cae
en la ventana, salido o no: texto, `fecha` (ISO con offset), portada, media en orden,
`atributos`, la `ref` con que llegó por el lote (o `null`), y por cada destino su estado
(`scheduled`, `publishing`, `published`, `failed`), el `externalId` si ya salió, los
intentos, la frase de error del último intento fallido (también en un `scheduled` que espera
reintentarse), `proximoIntento` (cuándo vuelve a probar uno que espera, o `null`), y
`cuentaId`/`handle` de la cuenta. Los ids de todas las cuentas, también los de una recién
conectada que todavía no tiene nada programado, los lista `GET /api/schedule/cuentas` (ver
«Cuentas por API»); en el panel están en el detalle de cada fila de **Los Fierros** (en
Ajustes) —la flecha de la fila—, con un botón para copiarlo.

`DELETE /api/schedule/posts/{id}` con el mismo `Authorization` saca un post programado
entero —destinos, media y regla— con la regla del panel, que comparten en
`borrarPostProgramado`: si algún destino ya se publicó o está publicando, responde `409`
con `Ya se publicó (o está publicando): elimínalo en la red.`, porque borrar la fila no
despublica nada; si el id no existe (o no es del dueño), `404`; borrado, `200`. No hay
edición por API: para cambiar algo se borra y se programa de nuevo.

### Resumen por API

`GET /api/schedule/resumen` con el mismo `Authorization` devuelve lo mismo que el resumen
del día que llega por correo (ver «Avisos por correo»), calculado en el momento: `fallidos`
(los destinos que se quemaron en las últimas `horas`, con su post, red, cuenta, motivo e
intentos), `cuentas` (las que hay que reconectar: `fierro` `frio` o `enfriandose`, cuándo
vence y el motivo) y `pista` (las cuentas en uso con menos de `dias` días programados: la
hora de lo último que tienen por salir, o `null`, y los días completos que quedan).
Parámetros opcionales: `dias`, entero de 1 a 30 (3 por defecto), y `horas`, entero de 1 a
168 (24 por defecto); fuera de rango, `400` con la frase fija. Las horas van en ISO con el
offset de la zona del dueño. Es para que un agente que programa por la API se entere de lo
que se quemó o se está por acabar aunque los correos le lleguen al dueño de la llave.

### Cuentas por API

`GET /api/schedule/cuentas` con el mismo `Authorization` devuelve `{ cuentas }`: todas las
cuentas del dueño de la llave, también las desconectadas, cada una con su `id` de Tu Parrilla
(el de `cuentas` en el lote, `cuenta=` en las métricas y las claves de `opciones`), su red,
su `handle`, su `externalId` (el id que le da la red), si tiene credencial (`conectada`), si es
de una red en «Próximamente» y cómo está su conexión: el `fierro`, cuándo `vence` y el
`motivo` para reconectarla, con las frases del resumen más una para la desconectada a
propósito. Sin parámetros. Antes, un agente solo veía el id de una cuenta pasando por un post
ya programado, y para una recién conectada había que pedirle al dueño que lo copiara de Los
Fierros. Lo puro está en `src/lib/cuentas-api.ts`.

## Estructura

```
src/
  proxy.ts                 manda el panel abierto en otro dominio al del producto
  app/
    page.tsx               la landing en el dominio del producto; el perfil principal en el resto
    [slug]/                la página de un usuario, acotada al dueño del dominio
    icon.svg               favicon
    api/track/click/       endpoint del sendBeacon
    ingresar/              entrada: correo y código
    admin/
      login/               redirige a /ingresar
      (dash)/              panel protegido
  components/
    corte.tsx              el corte dibujado de La Parrilla: silueta, carne, marcas, halo y humo
    pieza-sushi.tsx        el mismo corte en el modo día: nigiri, roll, sashimi y temaki
    boton-tema.tsx         el botón de la barra que cambia entre la noche y el día
    icono-maestro.tsx      el dibujo de la pestaña Tu IA: el parrillero de noche, el maestro de sushi de día
    landing.tsx            la portada del producto, armada con las piezas del panel y con los dos modos; landing-demos.tsx, lo que se toca
    landing-semana.ts      la semana de ejemplo, que comparten la portada y sus imágenes para compartir (/api/og, /api/og/dia)
    esqueleto.tsx          las piezas de la carga del panel: la forma de cada pantalla, con su pulso tibio
    profile-view.tsx       la página pública (también alimenta la vista previa del editor)
    click-tracker.tsx      escucha delegada de clicks
    charts/                gráficos y paleta validada
  lib/
    tema.ts                el modo de la cuenta (noche o día) y su copia en una cookie; tema-servidor.ts lee la cookie
    slugs.ts               qué direcciones están reservadas y cuál le toca a cada correo
    dominios.ts            si un host es el del producto, y adónde va el panel si no lo es
    tracking.ts            contexto de la visita desde headers
    analytics.ts           consultas del dashboard
    tablero.ts             las reglas de Los Números sin base: cuenta elegida, «⋯ Más» abiertos, la URL
    pieza.ts               qué junta las versiones de una pieza y las medianas por atributo (sin base)
    mejores.ts             el mejor (o el peor) X % de lo publicado: el corte, las medianas y lo que se repite (sin base)
    igual-edad.ts          comparar a la misma edad y contra la propia cuenta: los 7 días y «contra su cuenta» (sin base)
    lado-a-lado.ts         dos publicaciones lado a lado: la curva por edad y sus atributos (sin base)
    metrics-consulta.ts    lo que comparten las rutas de /api/metrics: la llave, el rango, la red y la cuenta
    cuentas-api.ts         las cuentas de GET /api/schedule/cuentas: los dos ids y cómo está la conexión (sin base)
    piezas.ts              la pieza de una publicación: sus destinos programados unidos a lo publicado
    auth.ts                sesión del panel
    llaves.ts              las llaves de API de cada usuario, y a nombre de quién entra cada petición
    llaves-api.ts          cómo se ve, se guarda y se lee una llave (sin base: lo prueban los tests)
    manual.ts              el manual del parrillero: cada página de la wiki de la UI pasada a HTML (sin base)
    borradores.ts          los borradores del compositor: guardar, cargar, listar y borrar, siempre por dueño
    borrador.ts            qué se guarda de un formulario y cómo se restaura, también desde el teléfono (sin base)
    borradores-movil.ts    los mismos borradores en la forma de la app del teléfono
    empresa.ts             quién presta el servicio: lo leen la portada, privacidad y términos
    avisos/                la caída de una cuenta y el resumen del día: las reglas sin base y lo que lee y manda
    social/
      lectura.ts           qué publicaciones se leen cada día: lo nuevo a diario, lo viejo cada vez más espaciado
      politica-youtube.ts  lo que las políticas de YouTube no dejan hacer con sus datos
      retencion-youtube.ts borra lo de YouTube que lleva 30 días sin refrescarse
public/docs/
  api-llm.md, api-editor.md, api.json   las guías de la API para un LLM
  ui/                      la wiki de la interfaz: una página por pantalla, para guiar a quien se pierde
scripts/
  setup.ts                 genera el .env.local
  seed.ts                  perfiles iniciales
  demo-data.ts             tráfico falso para probar el dashboard
```

## Licencia

MIT — ver [LICENSE](LICENSE). Úsalo, cámbialo y publícalo como quieras. Si te sirvió, una
estrella en el repo se agradece.
