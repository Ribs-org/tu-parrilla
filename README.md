# Tu Parrilla

Programa y publica en Instagram, Facebook, YouTube y TikTok desde un panel o desde la app del
teléfono, con una página de links propia, los comentarios en un solo lugar y analítica de
primera parte, sin cookies. Una API deja que un agente —el editor de los videos, por ejemplo—
cargue y mida lo publicado. Sin suscripción, sin marca de agua, sin que un tercero se quede con
tus números.

**[Ver la portada →](https://tu-parrilla.cl)**

| URL | Qué es |
| --- | --- |
| `/` | En el dominio del producto (`DOMINIO_PRODUCTO`), la portada de Tu Parrilla, con los enlaces a privacidad y términos. En cualquier otro, la página principal del dueño del dominio: cada usuario tiene una, pero solo la del admin se sirve en la raíz |
| `/ingresar` | La entrada al panel: el correo y el código de seis dígitos que llega a ese correo. Como el panel, se abre en el dominio del producto |
| `/privacidad`, `/terminos` | La política de privacidad y los términos, públicos y sin sesión. Google y Meta los revisan para verificar la app |
| `/<slug>` | La página de un usuario. Cada dominio sirve solo las de su dueño; el del producto las sirve todas |
| `/admin` | Tu panel: entra a La Parrilla, el calendario con lo que se quemó arriba; adentro, los números, los comentarios, el editor y La Cocina (`/admin/ia`): el chef de la casa y, en «Tu propio chef», las llaves para tu agente, con el manual del parrillero (`/admin/ia/manual`). Se abre en el dominio del producto: en cualquier otro, `/admin` e `/ingresar` redirigen ahí con la misma ruta |
| `/borrado/<código>` | El estado de un borrado que pidió Meta: cuándo fue y cuántas cuentas. Pública, sin sesión; el código es la llave |
| `/docs/…` | Las guías para LLMs, públicas y sin sesión: la de la API (`api-llm.md`, `api-editor.md`, `api.json`) y la wiki de la interfaz (`ui/index.md`), para guiar a quien se pierde en el panel |
| `/api/social/meta/baja` | `POST` de Meta cuando alguien quita la app desde Facebook: deja sin credencial sus cuentas de Instagram y Facebook |
| `/api/social/meta/borrado` | `POST` de Meta cuando alguien pide borrar sus datos: borra lo que vino de esas dos redes y devuelve el código de estado |
| `/api/schedule/…`, `/api/metrics/…` | La API para tu agente, con una llave de La Cocina («Tu propio chef»): cargar, ver y sacar lo programado, archivar lo quemado, las cuentas y los números (ver «Carga masiva por API» y las secciones que le siguen) |
| `/api/cocina/…` | La API de La Cocina, con `COCINA_SECRET`: el servidor del chef toma las comandas, baja sus insumos, informa cada estado y entrega lo cocinado al mesón del dueño (ver «La Cocina» y `docs/cocina-api.md`) |
| `/api/media` | `POST` con la misma llave: firma la subida de un archivo directo a R2, para nombrarlo después en varias filas del lote sin que se vuelva a bajar (ver «Carga masiva por API») |
| `/api/admin/…` | Lo que el panel llama desde el navegador, con la cookie de la sesión: la firma de una subida directa (`upload-url`) y las subidas por partes de La Cocina (`cocina/…`; ver «La Cocina») |
| `/api/mobile/…` | La API de la app del teléfono, con el token de su sesión (ver `mobile/README.md`) |
| `/api/cron/…` | Las corridas programadas: la publicación y la sincronización. Solo con `CRON_SECRET` |
| `/api/track/…` | Las balizas de visitas y clics de las páginas públicas |

Corre en planes gratis: Next.js 16 en Vercel, Postgres en Supabase y la media en Cloudflare R2
(10 GB gratis, egress $0).

---

## Cómo entra un cambio

Cada pull request contra `main` dispara la reja: dos trabajos en paralelo que tienen que
quedar verdes antes de poder fusionar.

- **sitio** corre los tests, el typecheck, el lint, el chequeo de que el esquema no cambió
  sin su migración y el build de producción. Las pruebas de integración usan una Postgres
  vacía que el trabajo levanta para ellas (ver «Comandos») y migran una base desde cero, así
  que una migración que no corre se ve acá y no en el despliegue. Corre sin ninguna
  credencial, a propósito: si el build empieza a necesitar un secreto para compilar, queremos
  enterarnos acá y no en Vercel.
- **app** corre los tests, el typecheck y el lint del proyecto de `mobile/`.

Entre los tests del sitio hay dos que cuidan lo que no se ve leyendo el código:

- `src/lib/variables-de-entorno.test.ts` pide que cada variable que lee el código esté en
  `.env.example` y en la tabla de «Variables de entorno», y que esas dos no nombren ninguna que
  ya no se lea.
- `src/lib/migraciones.test.ts` revisa el journal de `drizzle/`: numerado de corrido, cada
  migración más nueva que la anterior, y cada una con su archivo. El migrador aplica solo las
  más nuevas que la última aplicada, así que una fuera de orden se saltaría en silencio.

Las acciones de los flujos van fijadas por commit, no por etiqueta (una etiqueta se puede mover
a otro código), y cada trabajo tiene su tope de minutos. Una vez al mes Dependabot
(`.github/dependabot.yml`) abre un pull request con lo nuevo de las dependencias del sitio —sin
las versiones mayores, que son mudanzas— y otro con lo de las acciones, y los dos pasan por la
misma reja. La app del teléfono queda fuera a propósito. Su JavaScript llega por aire a un
binario ya instalado, y sus módulos nativos los fija el SDK de Expo: subir uno solo puede dejar
a la app pidiendo algo que el binario no trae. Se actualiza con el SDK entero y un build nuevo.

`main` está protegida: los dos trabajos son obligatorios, y la rama tiene que estar al día con
`main` antes de fusionar, para que la reja haya corrido sobre el código que de verdad va a
quedar. Un empujón directo no entra, porque su commit no trae esas dos comprobaciones: el CI
corre sobre pull requests.

Por eso Vercel no espera a nadie. Lo que llega a `main` ya pasó por la reja.

Si alguna vez hay que reconfigurar esto, la protección vive en **Settings → Branches →
Branch protection rules** del repositorio, sobre `main`. Hoy tiene encendidas dos casillas:
exigir que las comprobaciones `sitio` y `app` pasen, y exigir que la rama esté al día. La de
exigir pull request antes de fusionar está apagada; encenderla está en `docs/pendientes.md`.

---

## Desplegar el tuyo

Toma unos 10 minutos. Necesitas una cuenta de GitHub, una de Vercel y Node 24, la versión
fijada en `.nvmrc` y en `engines` de `package.json`.

### 1. Genera tus dos secretos

El botón del paso siguiente te los va a pedir. Córrelo dos veces y guarda cada resultado:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

El primero es `AUTH_SECRET` (firma tu sesión del panel), el segundo `FINGERPRINT_SALT`
(la sal del hash de visitantes). No los reutilices entre proyectos y no los publiques.

### 2. Aprieta el botón

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FRibs-org%2Ftu-parrilla&env=ADMIN_EMAIL,AUTH_SECRET,FINGERPRINT_SALT,RESEND_API_KEY&envDescription=Tu%20correo%2C%20la%20llave%20de%20Resend%20y%20los%20dos%20secretos%20que%20generaste&envLink=https%3A%2F%2Fgithub.com%2FRibs-org%2Ftu-parrilla%2Fblob%2Fmain%2F.env.example&project-name=tu-parrilla&repository-name=tu-parrilla)

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
  una vez por hora en el cron de publicación borra del bucket todo lo que la base de datos
  no referencia y lleva más de una hora subido, así que cualquier otra cosa que guardes ahí
  dura un par de horas como mucho. Después carga `R2_ACCOUNT_ID`,
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
(Analítica) y La Cocina (el chef de la casa, las llaves y el manual)— y el botón de Ajustes (un trinche y un
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

En **La Cocina** (`/admin/ia`), la cuarta pestaña, están los dos chefs que pueden cocinar para
ti. Arriba, el chef de la casa, que se enciende por cuenta en Los Maestros (ver «La Cocina», más
abajo). Abajo, en **«Tu propio chef»**, generas las **llaves para tu IA**: una llave deja que un
programa —el agente que te edita los videos, un asistente, un script— use la API a tu nombre sin
entrar al panel. La pestaña lleva un maestro cocinero dibujado
(`src/components/icono-maestro.tsx`): un parrillero de noche y un maestro de sushi de día.
Hasta el 2026-10-22 se llamaba Tu IA y tenía solo las llaves, y hasta el 2026-10-19 las llaves
vivían en Tu Cuenta; ahora están junto a las guías que tu IA tiene que leer y lo que puede hacer
con ellas. Le pones un nombre (el del agente), aprietas «Generar llave» y la ves **una sola
vez**, con un botón que la copia junto con las instrucciones para el agente (la base de la
API, el header, dónde está la guía y dónde la wiki del panel). En la base se guarda solo su hash, así que no hay forma
de volver a leerla: si se pierde, se revoca y se genera otra. La lista muestra cada llave
por su nombre y sus últimos cuatro caracteres, cuándo se creó y cuándo se usó por última
vez; revocar la borra y lo que la use deja de entrar en su próxima petición. Hasta diez por
usuario. Cerrar las sesiones de alguien desde Los Maestros no toca sus llaves: son
credenciales aparte, y las maneja cada uno.

Al final de La Cocina está **el manual del parrillero** (`/admin/ia/manual`): la wiki de la UI
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
semana —la lista queda a un clic—, con cada corte en una fila de una línea (lo que ya salió,
hundido y sin chapa), la mezcla de redes y cuánto salió de cada día, una línea de «ahora» que se
corre sola en el de hoy, y un «+» en cada día que abre el compositor con ese día puesto. El nombre de cada día abre la vista **Día** (`?vista=dia&fecha=…`): ese día con
una columna por cuenta y las horas hacia abajo, como Google Calendar —lo que ya pasó rayado y
la línea de «ahora» cruzando todas—, cada una con su propio fuego y un «+» que abre el
compositor con el día y la cuenta puestos; un post que sale a varias cuentas aparece en cada
una, cocido según el estado de ese destino. **Por hora** (`?vista=hora`) es la misma semana del
calendario con las horas hacia abajo, con bloques chicos que van lado a lado cuando se juntan;
las dos rejas salen de `schedule/reja-de-horas.tsx`. Arriba de lo programado, un **filtro por red** (`?red=`, con la red
o con el id de una cuenta) dice cuántos cortes tiene cada una en lo que se mira y deja ver solo
esa; «Se quemó» no lo obedece. El ícono de cada red va en su color de marca
(`--color-marca-*`, `src/lib/color-de-red.ts`), nunca de fondo: el fondo rojo es lo quemado.
El porqué, en `docs/superpowers/specs/2026-10-20-parrilla-en-el-tiempo-design.md`. Cada post se dibuja como un **corte** (`src/components/corte.tsx`):
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
se quema: es pescado pasado, y la sección «Se quemó» se llama «Se echó a perder». Cambian
también las palabras que con sushi no tenían sentido: de día La Parrilla es **La Barra**, Los
Fierros son **Los Cuchillos** —el fierro de cada cuenta es un cuchillo, que se desafila en vez
de enfriarse—, un corte es una pieza y el botón de Ajustes lleva dos palillos en vez del trinche
y el cuchillo. Todas salen de `src/lib/vocabulario.ts` (`PALABRAS_DE_DIA`, que la wiki tiene
que nombrar entera) y van en la página en los dos modos (`src/components/de-noche-y-de-dia.tsx`),
para que el botón las cambie sin recargar; las direcciones, los estados, las frases de error y
la API no cambian. La noche sigue por defecto, y la página pública de cada creador no cambia
nunca. La portada tiene los dos modos, con el mismo
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
convierte en publicación y lo saca de los borradores en la misma operación, así que un
borrador se programa una sola vez aunque se apriete en dos pestañas, o en el teléfono, a la
vez; «Descartar» lo borra. Los borradores
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
de API, y las marcas, comandas, insumos y creativos de La Cocina) tiene dueño: el panel solo te muestra lo tuyo, nunca lo de otro usuario invitado. Lo mismo
la API: lo que entra con una llave es del dueño de la llave, y un agente con la tuya no ve
ni toca lo de nadie más. Tu fila de usuario —el nombre, la zona y el modo del panel— la
cambias solo tú: Tu Cuenta, el botón del modo y la app del teléfono escriben la fila de la
sesión o del token, nunca una que llegue en la petición. Los crons (sync,
publicación, comentarios) siguen recorriendo *todo* el despliegue sin filtrar por
dueño — un cron por inquilino es otro subproyecto, no esta entrega. La credencial de La
Cocina (`COCINA_SECRET`) también cruza dueños, pero solo los que tienen la cocina encendida, y
de ellos solo sus comandas, sus insumos y sus creativos: el servidor del chef no ve posts,
cuentas ni números de nadie (ver «La Cocina»). La llave del despliegue
(`SCHEDULE_API_KEY`) y la raíz pública (`/`) siguen siendo del admin. Y hasta la entrega
3, dos usuarios todavía no pueden conectar la misma cuenta de la misma red: quien llega
segundo recibe un aviso, no la cuenta de otro. Eso es entre dos usuarios distintos: un
mismo dueño sí puede conectar varias cuentas suyas de la misma red y elegir a cuáles sale
cada publicación — ver «Varias cuentas de una misma red», más abajo.

Las únicas tablas sin dueño son dos:

- **`solicitudes_borrado`**, donde queda constancia de cada borrado que Meta pide: cuando se
  escribe una fila, ese dueño ya no tiene cuentas de Meta y Meta no sabe quién es. La escribe
  `/api/social/meta/borrado`, y `/borrado/<código>` la lee por el código —tampoco por dueño,
  por la misma razón—.
- **`latidos`**, donde el servidor del chef anota que está vivo: es de la cocina, no de un
  usuario.

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
gh repo fork Ribs-org/tu-parrilla --clone
cd tu-parrilla
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
incluidos (la media la borra el barrido de huérfanos en una o dos horas), porque un corte sin destinos no
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
modelo no pudo redactar, la tarjeta lo dice. La flecha de arriba a la derecha de cada tarjeta
pide otro borrador, haya o no uno. Arriba está el campo con las instrucciones que sigue el
modelo: las editas ahí y rigen desde el siguiente borrador. **Regenerar todos**, al lado de
Guardar, rehace con ellas los borradores pendientes que ya estaban escritos, hasta 40 por vez y
cuatro a la par, dentro de unos 40 segundos.

Nada sale sin tu toque. Dos toques, o el panel abierto en dos pestañas, mandan una sola vez
(la app del teléfono no tiene comentarios): justo antes de enviar, la respuesta reclama el
comentario en la base por dos minutos (`enviando_hasta`), y el toque que no lo obtiene no
manda nada. Las respuestas automáticas lo reclaman igual, así que dos sondeos encimados, o
una respuesta a mano en el mismo momento, tampoco mandan dos.

Lo que respondes directo en la app de Instagram, Facebook o YouTube tampoco se responde dos
veces. El sondeo pide cada comentario con sus respuestas, en la misma llamada y sin gastar cuota
extra. Si una respuesta es de tu cuenta, el comentario sale de la cola al estado `en_la_red`, con
tu respuesta guardada, y se ve en «Enviados». Lo hace en cada pasada, sobre todo lo que sigue
pendiente de los últimos siete días. Una fila que se está mandando desde la cola (`enviando_hasta`
vigente) no se toca. YouTube entrega solo unas pocas respuestas por hilo, así que en un
comentario con muchas la tuya puede no verse.

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
`SHA-256(IP + user-agent + FINGERPRINT_SALT + fecha UTC)` (sin `FINGERPRINT_SALT`, la sal sale
de `AUTH_SECRET`: nunca es una que esté escrita en el código). Como la fecha entra en el hash,
el mismo visitante recibe uno distinto al día siguiente: "visitantes únicos" es una métrica
diaria. Ese es el precio deliberado de no usar cookies, y es lo que evita el banner de
consentimiento.

---

## Comandos

```bash
npm run dev          # servidor local
npm test             # tests (los de integración, solo con DATABASE_URL_PRUEBAS)
npm run typecheck    # tipos
npm run build        # build de producción
npm run lint         # eslint
```

**Pruebas de integración.** Los archivos `*.integracion.test.ts` corren el SQL de verdad
contra una Postgres: cada uno crea su propia base en el servidor de `DATABASE_URL_PRUEBAS`
(la borra si ya estaba), le aplica todas las migraciones de `drizzle/` y la usa. Sin esa
variable se saltan, así que `npm test` sin nada más sigue andando; en el CI, el trabajo
`sitio` levanta una Postgres 17 vacía para ellas. En local sirve cualquier Postgres
desechable —`docker run --rm -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:17` y
`DATABASE_URL_PRUEBAS=postgres://postgres:postgres@localhost:5432/postgres npm test`—, nunca la
de producción: las pruebas crean y borran bases en ese servidor.

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

**Reparaciones de una vez**

Dos scripts de `scripts/` no tienen comando en `package.json`, a propósito: arreglaron datos de
antes de un cambio y no hay que correrlos de nuevo salvo que vuelva a pasar lo mismo. Se corren
con `npx dotenv -e .env.local -- tsx scripts/<archivo>.ts`, y cada uno explica al principio qué
toca:

- `marcar-bots-historicos.ts` reclasifica como bots las visitas de antes de la baliza del
  navegador que tienen la firma de un escáner (sin `?s=`, sin referente, entre otras señales).
- `reparar-ids-facebook.ts` pasa los `externalId` de Facebook publicados antes del arreglo del
  publicador al formato `páginaID_postID`, el mismo con que se leen las métricas.

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

### Si una migración falla

El migrador de Drizzle aplica todas las migraciones pendientes de un despliegue en una sola
transacción, y registra cada una dentro de ella (`migrate` en
`drizzle-orm/pg-core/dialect.js`). Si una sentencia falla, se deshace todo, también las
migraciones anteriores de esa misma tanda, y la base queda como estaba. El build cae, el código
nuevo no se promueve, y el próximo despliegue vuelve a intentar desde la misma migración. Se
arregla el SQL en otro pull request, y listo: no hay nada que reparar a mano.

Lo que no cabe en esa transacción tiene que ir aparte:

- `CREATE INDEX CONCURRENTLY`, que Postgres no acepta dentro de una transacción;
- usar en la misma tanda un valor que se acaba de agregar a un enum (`ALTER TYPE … ADD VALUE`).

Una migración así va sola en su despliegue. Si ni así se puede, se aplica a mano: la sentencia
en el editor SQL de Supabase y la fila en `drizzle.__drizzle_migrations`, con el hash del
archivo y el `when` del journal.

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
| `DATABASE_URL_UNPOOLED` | La misma base por el *session pooler* (puerto 5432): la usan las migraciones al desplegar y el respaldo diario, que necesitan una conexión de verdad | Sí — sin ella el migrador prueba con `DATABASE_URL` y lo más probable es que falle; el respaldo la lee de los secretos del repositorio |
| `ADMIN_EMAIL` | El correo del primer usuario | Sí |
| `AUTH_SECRET` | Firma las sesiones —la cookie del panel y el token del teléfono— y los mensajes de los redirects, y de ella sale la llave que cifra los tokens de las redes guardados en la base | Sí — cambiarla cierra todas las sesiones y deja ilegibles los tokens guardados: hay que reconectar cada cuenta |
| `MOBILE_TOKEN_VERSION` | La versión de las sesiones de la app del teléfono: subirla en 1 cierra la de todos los teléfonos a la vez (ver `mobile/README.md`, «Si se pierde el teléfono») | No — por defecto `1` |
| `FINGERPRINT_SALT` | Sal del hash de visitante | Conviene — sin ella se usa una derivada de `AUTH_SECRET`; ponerla o cambiarla después cambia los visitantes únicos de ese día |
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
| `X_BEARER_TOKEN` | Leer los tuits públicos de los creadores del modo Tinder (ver «Modo Tinder») | No — sin ella el modo Tinder no trae nada de X |
| `AI_GATEWAY_API_KEY` | Redactar con un modelo los borradores de respuesta a comentarios (ver «Responder comentarios») | No — en Vercel puede omitirse si el proyecto usa OIDC; sin ninguna de las dos, los comentarios entran a la cola sin borrador |
| `COMENTARIOS_MODELO` | El modelo de esos borradores, con la forma `proveedor/modelo` | No — tiene uno por defecto |
| `COMENTARIOS_DM` | Con `1`, tras responder un comentario de Instagram o Facebook se le manda un privado a quien comentó | No — apagada por defecto; exige `pages_messaging` aprobado por Meta |
| `SITE_URL` | Tu dominio, para etiquetar los enlaces del mensaje automático | No — sin ella se usa el dominio de producción de Vercel |
| `COCINA_SECRET` | La credencial de La Cocina: la que el servidor del chef manda en `Authorization: Bearer …` a `/api/cocina/…` para tomar comandas, bajar insumos, informar estados y entregar creativos (ver «La Cocina» y `docs/cocina-api.md`). La conocen solo este despliegue y el servidor del chef | No — sin ella esas rutas responden `401` y la cocina queda cerrada; si la pones, genérala igual que `CRON_SECRET` y dásela al servidor del chef |
| `CRON_SECRET` | Autoriza las corridas programadas: el sync diario y la publicación cada 5 minutos. Vercel la manda sola a su cron; el pinger externo la manda en `Authorization: Bearer …` | Sí — Vercel no la crea: se genera igual que `AUTH_SECRET` y se agrega. Sin ella los crons responden `401` y no corre nada |
| `MIGRAR_PREVIEWS` | Que los previews migren la base | Solo cuando el preview tenga una base propia; contra la de producción, no |
| `DATABASE_URL_PRUEBAS` | Solo para las pruebas de integración: una Postgres desechable donde cada archivo crea y migra su propia base (ver «Comandos»). No va en Vercel | No — sin ella esas pruebas se saltan. Nunca la de producción |
| `SCHEDULE_API_KEY` | La llave del despliegue: abre `POST /api/schedule/batch` (carga masiva), `POST /api/media` (subir un archivo una vez), `GET` y `DELETE /api/schedule/posts/{id}` (un post, o sacarlo), `POST /api/schedule/posts/{id}/archivar` y `…/desarchivar` (archivar lo quemado), `GET /api/schedule/posts` (calendario), `GET /api/schedule/resumen` (el resumen del día), `GET /api/schedule/cuentas` (las cuentas), `GET /api/metrics/posts` (métricas) y `GET /api/metrics/mejores` (el mejor X %) a nombre del admin. Es anterior a las llaves por usuario y sigue para el agente que ya la usa | No — sin ella los once endpoints aceptan solo las llaves que cada usuario genera en La Cocina («Tu propio chef»); si la pones, genérala igual que `CRON_SECRET` |
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
(hasta los 120 segundos de la corrida) y, una vez por hora, barre los archivos huérfanos de
R2, las subidas de La Cocina que quedaron a medias y lo que en La Cocina ya venció (ver «La
Cocina»): le toca a la corrida que
empieza en los primeros cinco minutos de la hora, si no viene atrasada. Al terminar cada fase escribe `[cron] <fase> listo a los N ms` en el log, y el
barrido dice cuántos objetos leyó: si una corrida muere por `maxDuration` (240 s), la fase
colgada es la primera que no dejó su línea. El barrido tiene un plazo de un minuto por
lectura —el listado de R2 y la consulta a la base, cada una con su línea `[barrido]`— y, si
no le alcanza, se rinde hasta la pasada siguiente sin borrar nada: un barrido que no termina
no puede llevarse la corrida.

**Cada destino sale una sola vez.** Dos corridas pueden cruzarse —la diaria de respaldo cae
encima del pinger, «Subir ahora» encima de cualquiera—, así que antes de intentar un destino
la corrida lo reclama por diez minutos (`reclamado_hasta`): la otra lo ve reclamado y lo
salta, y el editor y el borrado tampoco lo tocan («Hay una publicación en curso.»). El
intento se cuenta al reclamarlo y no al terminar: si la corrida muere a la mitad, el reclamo
vence y el destino vuelve a la fila con ese intento gastado; si se le acaban así, se quema con
«La publicación se cortó a la mitad y ya no quedan intentos. Revisa el archivo y
reprográmala.». Para que eso casi no pase, cada llamada a una red tiene su tiempo máximo
—30 segundos; bajar y subir el video de YouTube, 45 y 120—, ninguna corrida empieza un
intento pasados los 120 segundos, y subir un video nuevo a YouTube empieza solo si le caben
todos esos plazos antes del corte (si no, lo toma la corrida siguiente). Un video que lleva 24
horas en «Publicando…», contadas desde que entró ahí (`publicando_desde`), se quema sin
reintentarse: la red ya lo tiene, y subirlo de nuevo dejaría dos. «Subir ahora» y
«Reprogramar» conservan el contenedor del intento anterior, y el siguiente le pregunta
primero a la red cómo terminó; un contenedor de Instagram que Meta ya descartó se rehace en
el mismo intento. Lo que queda sin cerrar —una función que se cae justo después de que la red
recibió la publicación— está en `docs/deuda-tecnica.md`.

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
día: sale apenas se libere un cupo.» (`esTopeDiario`, en `social/publish/instagram.ts`). Si en
esa espera se cambia el texto o los archivos en el editor, el contenedor se tira y el intento
siguiente arma otro con lo nuevo. En las demás redes el contenedor es el video ya subido: se
tira solo si cambian los archivos, porque subirlo de nuevo por un texto dejaría dos.

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
- **El resumen del día**: lo que se quemó en las últimas 24 horas y nadie archivó (con la
  cuenta en el modo día, lo que «se echó a perder», como se llama ahí la sección), las cuentas por reconectar
  (frías o a menos de siete días de vencer) y las cuentas en uso —con algo programado en los
  últimos 30 días— que tienen menos de tres días programados hacia adelante. Con La Cocina,
  también lo que vence en el mesón en los próximos siete días, por comanda. Sale después de
  la sincronización diaria (9:00 UTC), y solo los días en que hay algo que contar. Lo mismo,
  salvo lo del mesón, se lee por API en `GET /api/schedule/resumen` (ver «Resumen por API»),
  para que quien programa con un agente se entere aunque los correos le lleguen al dueño.

### Guía para el editor de contenido

`public/docs/api-editor.md` documenta los once endpoints en detalle, escrito para que un
LLM que crea contenido lo lea entero y no necesite explicaciones: contratos, reglas
por red, todas las frases de error y qué significa cada métrica. Se sirve tal cual en
<https://tu-parrilla.cl/docs/api-editor.md>. No contiene secretos — la llave
viaja aparte: cada usuario la genera en La Cocina («Tu propio chef»), y el botón que la copia pega al lado
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

Los once endpoints de abajo piden el header `Authorization: Bearer <llave>`, y lo que
hacen lo hacen a nombre del dueño de la llave: sus cuentas, sus posts, su zona. Valen dos
clases de llave:

- **Las de cada usuario** (`tp_…`), que se generan y se revocan en La Cocina («Tu propio chef»). Viven en
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

La media de cada fila se baja de su URL y se copia a R2 dentro de la misma petición
(`scheduleBatch`, `src/lib/social/publish/batch.ts`). Corren cuatro filas a la vez
(`FILAS_A_LA_VEZ`), con un cupo de memoria compartido por el proceso (`BYTES_EN_MEMORIA`: cada
archivo está entero en memoria entre que baja y que se sube), y la misma URL se baja una vez por
lote. Cada descarga tiene 30 s para contestar y se corta si deja de llegar 30 s seguidos, pero un
archivo que baja parejo no tiene tope propio: hasta el 2026-10-21 había treinta segundos para
todo, y así fallaban los videos grandes de Drive. Un fallo pasajero se reintenta una vez. El lote
entero deja de empezar filas cuarenta segundos antes del `maxDuration` de la ruta y contesta con
lo que alcanzó; el resto vuelve con su frase. Cada resultado trae `ms` y, si bajó media, `bytes`,
`origen` y, si falló, `motivo` (las guías de la API los listan).

Para no bajar nada, `POST /api/media` (`src/app/api/media/route.ts`) firma un PUT directo a R2,
como el teléfono, y devuelve la URL pública del archivo. La clave va en la carpeta del dueño de
la llave (`scheduled/<ownerId>/`, `carpetaDeLaApi`), y el lote acepta sin bajarlo lo que esté en
la carpeta del dueño del lote: solo comprueba con un HEAD que exista, lo que pesa y el tipo con
que se firmó. Una URL de la carpeta de otro dueño se trata como cualquier URL pública. Varias
filas pueden nombrar el mismo objeto: `limpiarMedia` no borra un video que otro post todavía usa,
y el barrido de huérfanos se lleva lo que nadie nombró en una hora.

Cada fila puede traer una `ref`: un texto de hasta 100 caracteres, único por dueño, que el
que llama elige (el id de la fila en su planilla, por ejemplo). Sirve para el caso que antes
duplicaba: si se corta la conexión a mitad de un lote, la respuesta se pierde pero las filas ya
procesadas quedan programadas; y si el lote no alcanza a terminar, las que faltaron vuelven con
su frase. Reenviar el lote
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
días), y `estado`, que deja solo los posts con algún destino en ese estado; con `estado` y sin
fechas no hay ventana, así que `?estado=failed` es todo lo quemado. Devuelve
`{ desde, hasta, posts }` con lo programado cuya **hora de salida** cae en la ventana, salido o
no: texto, `fecha` (ISO con offset), portada, media en orden,
`atributos`, la `ref` con que llegó por el lote (o `null`), y por cada destino su estado
(`scheduled`, `publishing`, `published`, `failed`), el `externalId` si ya salió, los
intentos, la frase de error del último intento fallido (también en un `scheduled` que espera
reintentarse), `proximoIntento` (cuándo vuelve a probar uno que espera, o `null`),
`cuentaId`/`handle` de la cuenta, `archivado` y `opciones` (lo elegido para esa red al
programar, con las casillas de TikTok explícitas; `null` si la red no pide nada).
`GET /api/schedule/posts/{id}` devuelve un solo post con esa misma forma, para comprobar lo
guardado justo después de programar. Las dos leen con `leerProgramados`
(`src/lib/schedule-leer.ts`). Los ids de todas las cuentas, también los de una recién
conectada que todavía no tiene nada programado, los lista `GET /api/schedule/cuentas` (ver
«Cuentas por API»); en el panel están en el detalle de cada fila de **Los Fierros** (en
Ajustes) —la flecha de la fila—, con un botón para copiarlo.

`DELETE /api/schedule/posts/{id}` con el mismo `Authorization` saca un post programado
entero —destinos, media y regla— con la regla del panel, que comparten en
`borrarPostProgramado`: si algún destino ya se publicó o está publicando —también uno que el
publicador está intentando en ese momento—, responde `409`
con `Ya se publicó (o está publicando): elimínalo en la red.`, porque borrar la fila no
despublica nada; si el id no existe (o no es del dueño), `404`; borrado, `200`. No hay
edición por API: para cambiar algo se borra y se programa de nuevo.

`POST /api/schedule/posts/{id}/archivar` archiva lo quemado sin borrarlo —con
`{ "cuentaId": "…" }`, ese destino; sin cuerpo, todos los quemados del post—, y `…/desarchivar`
lo devuelve. Un destino archivado sigue `failed` y con su error, pero ya no sale en «Se
quemó» (panel y teléfono), en el resumen ni en el correo del día; el calendario lo sigue
dibujando quemado, y el rearme («Reprogramar», «Subir ahora», el editor) lo desarchiva. La
regla, la misma del botón «Archivar» del panel, vive en `archivarQuemados`
(`src/lib/social/publish/archivar.ts`); solo se archiva lo quemado (`409` si no), y repetirlo
no hace nada.

### Resumen por API

`GET /api/schedule/resumen` con el mismo `Authorization` devuelve lo mismo que el resumen
del día que llega por correo (ver «Avisos por correo»), calculado en el momento: `fallidos`
(los destinos que se quemaron en las últimas `horas` y nadie archivó, con su post, red,
cuenta, motivo e intentos), `cuentas` (las que hay que reconectar: `fierro` `frio` o `enfriandose`, cuándo
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
propósito. En Instagram, además, si acepta trial reels (`trialReels`: `si`, `no` o `null`) y la
frase con que Meta rechazó el último. Eso lo aprende la corrida del publicador: un rechazo por
elegibilidad (pocos seguidores, el subcódigo 2207081) marca la cuenta `no`, y un trial reel que
sale la marca `si` (`src/lib/social/publish/trial-reels.ts`, en `social_accounts`). No bloquea
nada; Los Fierros y el compositor lo muestran como aviso. Sin parámetros. Antes, un agente solo veía el id de una cuenta pasando por un post
ya programado, y para una recién conectada había que pedirle al dueño que lo copiara de Los
Fierros. Lo puro está en `src/lib/cuentas-api.ts`.

## La Cocina

La Cocina es la fábrica de creativos de cada usuario dentro de Tu Parrilla:

1. el usuario sube su material crudo y pide una comanda;
2. el chef la cocina: es el pipeline de edición de `marca-personal`, que corre en un servidor
   propio;
3. el chef devuelve los creativos al mesón del usuario, listos para programar.

El diseño, con sus fases, está en `docs/superpowers/specs/2026-10-22-la-cocina-design.md`.

**Hoy existen dos piezas:**

- la base: las tablas y la API por la que habla el chef;
- la subida por partes, por la que el panel le va a llevar el material.

**Lo que ve el usuario:**

- la pestaña La Cocina (`/admin/ia`), que reemplazó a Tu IA el 2026-10-22: arriba «El chef de la
  casa» y abajo «Tu propio chef», con las llaves de siempre;
- si la cocina está abierta (algún latido del chef en los últimos diez minutos);
- sus comandas, con el dibujo de su plato principal, su estado, cuántas van antes, la hora
  estimada y lo que pasó;
- «Cancelar la comanda», mientras no esté en el horno;
- «Pedir una comanda» (`/admin/ia/pedir`). Ahí sube el plato principal y lo que lo acompaña, cada
  archivo por partes y apenas lo elige, con su dibujo y su barra. Dice qué quiere que salga, guarda
  su marca básica (nombre, @, color de acento y llamado final) y ve la fila y la hora estimada antes
  de colgarla. Lo que subió y no pidió se le ofrece de nuevo, y se borra a los tres días.

El admin enciende y apaga la cocina de cada cuenta en Los Maestros (`users.cocina_desde`).
Apagarla es despedir al chef: deja de ver esas comandas, aunque siguen ahí.

**Colgar una comanda congela su receta.** La marca y lo que se pidió se guardan en la comanda,
así que lo que está en el horno no cambia aunque el dueño cambie su marca después. La marca queda
además en `marcas`, para la siguiente. La `ref` que pone el formulario al abrirse hace que mandarla
dos veces no la duplique, y un archivo solo entra si es del dueño y no está en otra comanda. En esta
fase no hay catálogo todavía, así que los estilos los elige el chef (`receta.estilos: "chef"`).

**El mesón** (`/admin/ia/meson`; de día, la bandeja) es donde espera lo que el chef entregó, por
comanda y por pieza, para programarlo o descartarlo:

- **«Programar»** lo pasa a un borrador de La Parrilla (`borradores.creativo_id`) y abre el
  compositor con el texto, el título de YouTube y los archivos puestos. El creativo sale del mesón
  mientras espera ahí, y si se descarta el borrador, vuelve.
- **Al programarse**, el post se lleva del creativo lo que el compositor no tiene
  (`crearPostProgramado`):
  - la portada;
  - los atributos, con su pieza y su estilo;
  - en cada destino de YouTube, el título como primera línea del texto (`captionOverride`).

  Lo hace el mismo camino para el panel y el teléfono.
- **«Descartar»** pide el motivo de un toque (el corte, la letra, el tema o el audio), borra los
  archivos y deja la fila con su motivo, que es memoria para el chef.
- **Una comanda lista queda servida** sola cuando ya no le queda nada por decidir.

**Lo que vence se borra solo** (`barrerCocina`, una vez por hora con el barrido de huérfanos):

- **Lo crudo**, a los 14 días de terminada la comanda: cancelada, rechazada, fallida o servida.
  La fila queda con `borrado_en`, para la historia de la comanda. Uno que el almacén no dejó
  borrar se intenta en la pasada siguiente.
- **Lo que nadie programó en el mesón**, a los 30 días: sale como descartado, con el motivo
  `vencido` para que el chef no lo tome como un juicio, y suelta sus archivos. Lo que espera en un
  borrador no vence: ya está en La Parrilla.

Una comanda que se quedó sin nada por decidir queda servida. En su última semana, la tarjeta del
mesón dice cuándo se borra, y el resumen del día lo avisa.

**El chef pregunta; Tu Parrilla nunca lo llama.** El servidor del chef no expone puertos:

- toma las comandas que esperan;
- baja sus insumos con un enlace firmado que vence en una hora;
- informa cada estado;
- entrega cada creativo apenas sale, por tanda.

Habla con `/api/cocina/…` y la credencial `COCINA_SECRET`, comparada en tiempo constante como
`CRON_SECRET`. Sin la variable, esas rutas responden `401`. El contrato entero, con cada respuesta,
cada frase de error y un ejemplo de punta a punta, está en `docs/cocina-api.md`.

**La credencial alcanza poco, a propósito.** Ve solo las comandas de los usuarios con la cocina
encendida, sus insumos y sus creativos. No lee posts, cuentas ni números, y no programa nada: lo
cocinado espera en el mesón del dueño, que es quien lo programa.

**Una comanda no se salta estados.** Cada cambio pasa por la tabla de transiciones
(`src/lib/cocina/estados.ts`) y por una condición sobre el estado actual en la misma escritura.
Por eso dos trabajadores no toman la misma comanda, y un cambio que llega tarde no pisa una
cancelación. Servir y cancelar son del usuario: el chef no lleva a ninguno de los dos.

**Un creativo llega al mesón solo con sus archivos arriba.** Pasa por tres pasos:

1. se anuncia, y a cada archivo le toca su lugar en la carpeta del dueño
   (`scheduled/<dueño>/cocina/<comanda>/`), para que programarlo no lo vuelva a bajar;
2. se sube con PUTs firmados;
3. se cierra: Tu Parrilla mira que cada archivo esté en el almacén y pese lo anunciado.

La `ref` de cada creativo lo hace repetible: un reintento del chef nunca lo duplica.

**El material sube por partes, directo al almacén.** Un largo crudo pesa de 2 a 20 GB, y un solo
PUT llega hasta 5, así que el navegador lo corta en partes de 64 MB y sube tres a la vez, cada una
con su enlace firmado. Ninguna parte cruza una función de Vercel. Va por cuatro pasos:

1. `/api/admin/cocina/subidas` abre la subida;
2. `…/partes` firma los enlaces de a pocos, justo antes de usarlos;
3. el navegador sube las partes;
4. `…/cerrar` junta las partes. Ahí nace el insumo, todavía sin comanda.

Las partes que llegaron se le preguntan al almacén (`ListParts`), no al navegador. Por eso:

- el CORS del bucket no tiene que dejar leer la cabecera `ETag`;
- una parte que llegó con otro peso se vuelve a subir;
- si la subida se corta, elegir el mismo archivo otra vez la retoma donde quedó, porque el
  navegador recuerda qué subida era.

El servidor está en `src/lib/cocina/subidas.ts`, y el navegador en `src/lib/subida-por-partes.ts`.

**Lo crudo vive fuera de `scheduled/`.** Va en `cocina/<dueño>/insumos/`, con un uuid en la clave, y
su URL nunca sale al navegador: el chef lo baja con un enlace firmado que vence en una hora. Pesa:
con la cocina encendida, el almacén pasa fácil los 10 GB gratis de R2, y cada GB de más cuesta
unos US$0,015 al mes.

**Lo que queda a medias se barre** una vez por hora, con el barrido de huérfanos (`barrerSubidas`):

- una subida abierta hace más de 24 horas se aborta, y el almacén borra sus partes;
- lo que se subió y lleva tres días sin llegar a una comanda se borra.

## Estructura

```
src/
  proxy.ts                 manda el panel abierto en otro dominio al del producto
  app/
    page.tsx               la landing en el dominio del producto; el perfil principal en el resto
    error.tsx              «Algo se rompió» de las páginas públicas; global-error.tsx, el de la raíz entera
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
    escena-cocina.tsx      la escena de La Cocina: el parrillero y el asado al palo de noche, el maestro de sushi y el atún de día; el fuego y el farol dicen si la cocina está abierta
    dibujos-insumo.tsx     lo que se le lleva a La Cocina: la res, el cerdo y las verduras de noche; el atún, el salmón y el arroz de día
    boton-tema.tsx         el botón de la barra que cambia entre la noche y el día
    de-noche-y-de-dia.tsx  lo que se dice distinto de día, en sus dos versiones (el modo esconde una), y el nombre de cada pantalla
    tema-vivo.ts           el modo que se ve ahora, para lo que el CSS no alcanza: un aria-label, un title, un confirm
    icono-maestro.tsx      el dibujo de la pestaña La Cocina: el parrillero de noche, el maestro de sushi de día
    icono-ajustes.tsx      el botón de Ajustes: el trinche y el cuchillo de noche, los palillos de día
    landing.tsx            la portada del producto, armada con las piezas del panel y con los dos modos; landing-demos.tsx, lo que se toca
    landing-semana.ts      la semana de ejemplo, que comparten la portada y sus imágenes para compartir (/api/og, /api/og/dia)
    esqueleto.tsx          las piezas de la carga del panel: la forma de cada pantalla, con su pulso tibio
    profile-view.tsx       la página pública (también alimenta la vista previa del editor)
    click-tracker.tsx      escucha delegada de clicks
    charts/                gráficos y paleta validada
  lib/
    tema.ts                el modo de la cuenta (noche o día) y su copia en una cookie; tema-servidor.ts lee la cookie
    networks.ts            las redes que existen y las que están en «Próximamente»; lo leen el panel y el navegador
    ingreso-frases.ts      las frases de la entrada, sin código de servidor: las usan los formularios del navegador
    cron-auth.ts           si una petición trae el CRON_SECRET, comparado en tiempo constante
    limite.ts              la cuenta de intentos por IP, pura; limite-ip.ts la guarda en la memoria de la instancia
    mensaje-firmado.ts     el aviso que viaja en la URL de un redirect, firmado para que nadie escriba uno falso
    uuid.ts                si un texto es un uuid: los ids de las URLs se revisan antes de consultar
    choque-de-unicidad.ts  si un error de la base es un choque con una restricción de unicidad dada
    subida-directa.ts      la subida del navegador directo al almacén, con la URL que firma /api/admin/upload-url
    subida-por-partes.ts   la subida por partes del navegador, para los archivos grandes de La Cocina: varias partes a la vez, y se retoma si se corta
    use-ahora.ts           la hora de ahora, al minuto: la del servidor al hidratar, y después se corre sola
    copiar.ts              copiar al portapapeles y saber si de verdad se copió
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
    media-api.ts           la clave de un archivo que sube un cliente de la API, en la carpeta de su dueño (sin base)
    archivar-api.ts        el cuerpo y las respuestas de archivar y desarchivar lo quemado por API
    cocina/                La Cocina: los estados de una comanda, la fila del chef, lo que entrega, lo que lee y escribe su API (/api/cocina), las subidas por partes del panel (/api/admin/cocina), colgar una comanda y el mesón
    color-de-red.ts        el color de marca de cada red en La Parrilla, como clases de Tailwind escritas enteras
    piezas.ts              la pieza de una publicación: sus destinos programados unidos a lo publicado
    auth.ts                sesión del panel
    llaves.ts              las llaves de API de cada usuario, y a nombre de quién entra cada petición
    llaves-api.ts          cómo se ve, se guarda y se lee una llave (sin base: lo prueban los tests)
    manual.ts              el manual del parrillero: cada página de la wiki de la UI pasada a HTML (sin base)
    borradores.ts          los borradores del compositor: guardar, cargar, listar y borrar, siempre por dueño
    borrador.ts            qué se guarda de un formulario y cómo se restaura, también desde el teléfono (sin base)
    borradores-movil.ts    los mismos borradores en la forma de la app del teléfono
    pruebas/               la Postgres de las pruebas de integración: una base nueva y migrada por archivo
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
  migrar.ts                migra la base en el build de Vercel, y adopta lo que no tenía dueño
  seed.ts                  perfiles iniciales
  demo-data.ts             tráfico falso para probar el dashboard
```

## Licencia

MIT — ver [LICENSE](LICENSE). Úsalo, cámbialo y publícalo como quieras. Si te sirvió, una
estrella en el repo se agradece.
