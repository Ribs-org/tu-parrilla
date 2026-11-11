# Tu Parrilla

Programa y publica en Instagram, Facebook, YouTube y TikTok desde un panel o desde la app del
teléfono, con una página de links propia, los comentarios en un solo lugar y analítica de
primera parte, sin cookies. Una API deja que un agente —el editor de los videos, por ejemplo—
cargue y mida lo publicado. Sin suscripción, sin marca de agua, sin que un tercero se quede con
tus números.

**[Ver la portada →](https://tu-parrilla.cl)**

| URL | Qué es |
| --- | --- |
| `/` | En el dominio del producto (`DOMINIO_PRODUCTO`), la portada de Tu Parrilla, con los enlaces a privacidad y términos, los creadores que trabajan con Tu Parrilla (cada uno dio su permiso; sus fotos, en `public/creadores/`) y un contador de las vistas y los «me gusta» de todas las cuentas conectadas, sin YouTube (`src/lib/portada-numeros.ts`). En cualquier otro, la página principal del dueño del dominio: cada usuario tiene una, pero solo la del admin se sirve en la raíz |
| `/ingresar` | La entrada al panel: el correo y el código de seis dígitos que llega a ese correo, con un botón que abre `/ingresar/codigo` con el código puesto (en el fragmento, `#codigo=`, que no llega al servidor). Como el panel, se abre en el dominio del producto |
| `/ingresar/puente` | La puerta que abre la app del teléfono para ir a Los Fierros del panel sin código: muestra con qué correo se entra y, con «Entrar», abre la sesión. Una llave de dos minutos y un solo uso, en el fragmento (`#t=`), que pide `POST /api/mobile/puente` (`src/lib/puente.ts`) |
| `/borrar-mis-datos` | Cómo pedir que se borre una cuenta con todos sus datos, qué se borra y qué se guarda (los respaldos, 90 días). Pública y sin sesión: es la «Delete data URL» de la ficha de Google Play, que la revisa (`docs/play-store.md`). El borrado lo hace hoy el equipo a mano (ver `docs/pendientes.md`) |
| `/privacidad`, `/terminos` | La política de privacidad y los términos, públicos y sin sesión. Google y Meta los revisan para verificar la app. Además los enlaza, junto con `/`, el *Branding* de `rclone-servidor`, otra app de Google de Infraestructura (#294): si alguna de las tres cambia de ruta o se baja, avisar en `VicentePareja/servidor_propio` |
| `/<slug>` | La página de un usuario. Cada dominio sirve solo las de su dueño; el del producto las sirve todas |
| `/admin` | Tu panel: entra a La Parrilla, el calendario con lo que se quemó arriba; adentro, los números, los comentarios, el editor y La Cocina (`/admin/ia`): el chef de la casa, con la cámara de frío donde se guarda el material (`/admin/ia/bodega`), y, en «Tu propio chef», las llaves para tu agente, con el manual del parrillero (`/admin/ia/manual`). Se abre en el dominio del producto: en cualquier otro, `/admin` e `/ingresar` redirigen ahí con la misma ruta |
| `/borrado/<código>` | El estado de un borrado que pidió Meta: cuándo fue y cuántas cuentas. Pública, sin sesión; el código es la llave |
| `/docs/…` | Las guías para LLMs, públicas y sin sesión: la de la API (`api-llm.md`, `api-editor.md`, `api.json`) y la wiki de la interfaz (`ui/index.md`), para guiar a quien se pierde en el panel |
| `/api/social/meta/baja` | `POST` de Meta cuando alguien quita la app desde Facebook: deja sin credencial sus cuentas de Instagram y Facebook |
| `/api/social/meta/borrado` | `POST` de Meta cuando alguien pide borrar sus datos: borra lo que vino de esas dos redes y devuelve el código de estado |
| `/api/social/instagram/baja`, `/api/social/instagram/borrado` | Lo mismo, del caso de uso de Instagram de la app de Meta: solo para las cuentas de Instagram conectadas con el login de Instagram (ver «Instagram sin página de Facebook: el login de Instagram») |
| `/api/social/tiktok/comentarios/vuelta/` | La vuelta de la app de TikTok for Business, registrada así, con la barra final, en su portal: guarda la credencial de TikTok for Business (comentarios y números) de una cuenta de TikTok. Cerrada salvo para quien diga `TIKTOK_COMENTARIOS_ABIERTO_PARA` (ver «TikTok for Business: comentarios y números») |
| `/api/schedule/…`, `/api/metrics/…` | La API para tu agente, con una llave de La Cocina («Tu propio chef»): cargar, ver y sacar lo programado, archivar lo quemado, las cuentas y los números (ver «Carga masiva por API» y las secciones que le siguen) |
| `/api/cocina/…` | La API de La Cocina, con `COCINA_SECRET`: el servidor del chef toma las comandas, baja sus insumos, informa cada estado, le pregunta al dueño y lee lo que contestó, y entrega lo cocinado al mesón del dueño (ver «La Cocina» y `docs/cocina-api.md`) |
| `/api/media` | `POST` con la misma llave: firma la subida de un archivo directo a R2, para nombrarlo después en varias filas del lote sin que se vuelva a bajar (ver «Carga masiva por API») |
| `/api/sugerencias/respuesta` | `POST` con una llave **del admin** (o `SCHEDULE_API_KEY`): la respuesta del equipo a lo que alguien escribió en el libro de sugerencias, por el número de su issue o por su id, para responder sin el navegador. Con la llave de otra cuenta, `403` (ver «El libro de sugerencias») |
| `/api/bodega…` | Con la misma llave: lo que hay en la cámara de frío de La Cocina (`GET /api/bodega`) y las subidas por partes para guardar ahí (`/api/bodega/subidas…`), las mismas del panel y del teléfono (ver «La Cocina») |
| `/api/admin/…` | Lo que el panel llama desde el navegador, con la cookie de la sesión: la firma de una subida directa (`upload-url`), las subidas por partes a la cámara de frío de La Cocina (`cocina/subidas…`) y el pulso que mantiene al día sus tarjetas (`cocina/pulso`; ver «La Cocina») y la planilla de Excel de Los Números (`planilla`, y `planilla/adelanto` para lo que no cabe; ver «Llevar para la casa») |
| `/api/mobile/…` | La API de la app del teléfono, con el token de su sesión (ver `mobile/README.md`); `cocina…` es La Cocina desde el teléfono: lo que muestra, las subidas por partes a la cámara de frío, cambiar y sacar lo de adentro, «Mandar al chef», cancelar, contestarle al chef y el mesón con «Programar» y «Descartar» (ver «La Cocina»); `comentarios…` es La Mesa desde el teléfono: la cola, el número de La Parrilla, «Enviar», «Descartar» y otro borrador (ver «Responder comentarios»); `push` registra el teléfono para los avisos y `push/{token}` lo borra (ver «Avisos al teléfono»); `puente` da la dirección de un solo uso de `/ingresar/puente` (ver `mobile/README.md`, «La primera vuelta»); `lo-que-trajo` es la fila de La Parrilla con lo nuevo de cada corte y el número del ícono, y `cortes/{id}` su detalle y la marca de que se miró (ver «Lo que trajo, en el teléfono»); `session`, al canjear el código, devuelve el token y `sinRedes`, si la cuenta no tiene ninguna red conectada; `schedule/accounts/{id}/tiktok` es `creator_info` para el bloque de TikTok de Publicar (ver `mobile/README.md`, «TikTok y la palabra clave») |
| `/api/cron/…` | Las corridas programadas: la publicación, la sincronización —que también reintenta los mensajes del libro de sugerencias que no salieron a GitHub y relee en Mercado Pago las suscripciones del plan pagado— y los números de cada hora. Solo con `CRON_SECRET` |
| `/api/pagos/mercadopago` | `POST` de Mercado Pago cuando cambia una suscripción al plan pagado o uno de sus cobros. Pública y sin sesión: la llave es la firma (`MERCADOPAGO_WEBHOOK_SECRET`). Ver «Los planes» |
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
y tu zona horaria; y abajo, en «Tu plan», ves qué plan tienes y cuánto llevas usado de cada tope
(ver «Los planes»). La zona es de cada usuario, no del sitio: naces con la de
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

- La **API con llave** (`/api/schedule/posts`, `/api/schedule/resumen`, `/api/schedule/cuentas`, `/api/metrics/posts`, `/api/metrics/mejores`, `/api/metrics/que-funciona`) habla en la zona del
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
bife foto, chori texto, choripán al paso historia—, la carne cómo va, una marca por destino que se quema cuando ese
destino sale, y un halo rojo con banderita si algo se quemó; humo mientras sale. El texto va
al lado, en la chapa, nunca sobre la carne. La app del teléfono dibuja el mismo corte
(`mobile/src/components/pieza.tsx`): desde la 1.2.0 en SVG, con las mismas curvas
(`mobile/src/lib/corte.ts`, que compara `src/components/corte.test.ts`), y en la 1.1.0 con vistas
aproximadas; con el formato y el sello de cada destino que le
manda `GET /api/mobile/schedule`. Un formato nuevo solo le llega a la app que dice saber
dibujarlo en el encabezado `X-Parrilla-Cortes` (hoy, `choripan`): una instalación vieja que
recibiera uno desconocido se caería al dibujarlo, así que a ella la historia le llega con el
corte de su archivo. El porqué, en
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
lista. «En las redes» suma **Qué te funciona**: qué tema, qué estilo (los atributos `tema` y
`estilo`) y qué formato de la red anduvieron mejor en el período, contra lo normal de cada
cuenta y dicho en una frase; solo nombra un ganador si hay al menos dos valores con 10
publicaciones medidas a los 7 días y el mejor saca ×1,2 o más (`src/lib/que-funciona.ts`, con
las mismas medianas de «Comparar por atributo»). Su línea «Música» compara lo publicado desde
Tu Parrilla con la música de la red —«Música de TikTok» en las fotos— contra lo publicado sin
ella, dentro de cada red y formato, y gana un lado si saca ×1,2 lo del otro; lo subido directo
en la red no entra, porque no se sabe. Es en views: ninguna red da los seguidores
que trajo cada publicación. El resto (interacciones, arrastre, tus cuentas, la audiencia, los links, de dónde
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
cuenta más grande (`src/lib/igual-edad.ts`). Lo mismo a las 48 horas («Contra su cuenta, a
las 48 horas» y «Por views a las 48 horas»), para decidir en 2 días y no en 7 qué pasa de una
cuenta de prueba a la principal. En las métricas que no son a igual edad, lo publicado hace
menos de 7 días no compite salvo que se prenda «Con las de menos de 7 días». **Lado a lado**
(`/admin/analytics/lado-a-lado`) pone dos publicaciones —al entrar, la mejor y la peor— con
su portada, el link para ver el video en la red, sus atributos y cómo crecieron sus views por
días desde que salieron; el video no se guarda (`src/lib/lado-a-lado.ts`). El porqué del tablero, en
`docs/superpowers/specs/2026-10-13-numeros-tablero-design.md`.

**Llevar para la casa** (de día, «Para llevar»), el botón al lado del título de Los Números,
baja todo a una planilla de Excel: dieciséis hojas —publicaciones con sus números y atributos,
la comparación por atributo, las lecturas diarias, las cuentas y sus seguidores día a día, las
visitas y los clicks uno por uno con su etiqueta `?s=` y sus UTM, las etiquetas, los links, la
audiencia, lo programado, publicado y quemado, y los comentarios de La Mesa— y una primera,
«Léeme», que explica cada hoja y cada columna, con la fecha y la zona horaria del dueño. Sale con
el período y los filtros de la pantalla, solo con lo del dueño. El `.xlsx` se escribe a mano
(`src/lib/planilla/xlsx.ts` y `zip.ts`, sobre `node:zlib`): las bibliotecas de Excel de npm
estaban abandonadas (`xlsx`) o traían dependencias con avisos abiertos (`exceljs`). Ningún texto
es una fórmula: van como texto, y uno que empieza con `=`, `+`, `-`, `@`, tabulador o retorno
lleva un apóstrofo adelante. Para que una cuenta grande no tumbe la función, la planilla sale
por partes mientras se escribe (sin el tope de 4,5 MB de una respuesta de Vercel), las hojas
largas se leen por tandas y tienen tope —100.000 visitas, clicks o lecturas, 50.000
comentarios…—, y a los cuatro minutos deja de leer las hojas largas: lo que no entró lo dice
«Léeme», y la ventana avisa antes de armar si el período no cabe (`src/lib/planilla/armar.ts`).

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
de API, anuncios y promociones —por la cuenta conectada de la que cuelgan—, lo escrito en el libro de sugerencias con su respuesta, la última vez que miraste cada corte en el teléfono y los hitos de cada uno, y las marcas, comandas, insumos, materiales de la cámara de frío, subidas y creativos de La
Cocina, con las preguntas del chef) tiene dueño: el panel solo te muestra lo tuyo, nunca lo de otro usuario invitado. Lo mismo
la API: lo que entra con una llave es del dueño de la llave, y un agente con la tuya no ve
ni toca lo de nadie más. Tu fila de usuario —el nombre, la zona y el modo del panel— la
cambias solo tú: Tu Cuenta, el botón del modo y la app del teléfono escriben la fila de la
sesión o del token, nunca una que llegue en la petición. Los crons (sync,
publicación, comentarios) siguen recorriendo *todo* el despliegue sin filtrar por
dueño — un cron por inquilino es otro subproyecto, no esta entrega. La credencial de La
Cocina (`COCINA_SECRET`) también cruza dueños, pero solo los que tienen la cocina encendida, y
de ellos solo sus comandas, sus insumos y sus creativos —de la cámara de frío ve solo lo que una
comanda lleva—: el servidor del chef no ve posts,
cuentas ni números de nadie (ver «La Cocina»). La alarma de La Cocina, que corre con el cron de
publicación, lee las comandas en marcha de todos los dueños con la cocina encendida y le escribe
solo al admin: el nombre y el correo del cliente, la comanda y lo que pidió. La llave del despliegue
(`SCHEDULE_API_KEY`) y la raíz pública (`/`) siguen siendo del admin. Y hasta la entrega
3, dos usuarios todavía no pueden conectar la misma cuenta de la misma red: quien llega
segundo recibe un aviso, no la cuenta de otro. Eso es entre dos usuarios distintos: un
mismo dueño sí puede conectar varias cuentas suyas de la misma red y elegir a cuáles sale
cada publicación — ver «Varias cuentas de una misma red», más abajo.

**Traspasar una cuenta**, en Los Maestros, es lo único del panel que cruza dueños, y por eso solo
lo hace el admin (`src/lib/social/traspasar.ts`). Cambia de dueño la cuenta, sus publicaciones y
los cortes que salen solo a ella, y su credencial y sus números de TikTok for Business, que viven
en `ajustes` por dueño (ver «TikTok for Business: comentarios y números»); lo demás —métricas, comentarios, los anuncios que se leyeron
con su token, las promociones de sus publicaciones— cuelga de la cuenta y la sigue. Un corte que sale
además a otras cuentas se queda con quien lo programó, con un destino en una cuenta que ya no es
suya: sale igual, porque publicar busca la cuenta por su id y no por su dueño. La credencial no
cambia hasta que quien recibe la cuenta aprieta **Reconectar**.

**Responder una sugerencia**, en Las Sugerencias, es lo otro que cruza dueños, y también solo lo
hace el admin (`src/lib/sugerencias/responder.ts`): ve lo que escribió cada persona, con su correo,
y escribe la respuesta en esa fila. Lo que la persona ve en el libro —lo suyo, el punto de las
respuestas sin leer y marcarlas leídas— va atado a ella, como todo lo demás.

Las únicas tablas sin dueño son dos:

- **`solicitudes_borrado`**, donde queda constancia de cada borrado que Meta pide: cuando se
  escribe una fila, ese dueño ya no tiene cuentas de Meta y Meta no sabe quién es. La escriben
  `/api/social/meta/borrado`, `/api/social/threads/borrado` y `/api/social/instagram/borrado`, y
  `/borrado/<código>` la lee por el código —tampoco por dueño, por la misma razón—.
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

El panel puede traer las métricas de tus posts desde Instagram, Facebook, TikTok y YouTube
(y desde Threads, por ahora solo para la cuenta del revisor de Meta: ver «Threads», abajo) y
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
borra las credenciales, el canal deja de leerse y, en el acto, se borra lo que vino de la API
(ver el párrafo siguiente). Cambiar el id no reemplaza la cuenta:
crea una segunda fila de YouTube, sin conectar, que no se sincroniza.

**Lo que YouTube no deja hacer con sus datos.** Las políticas de los Servicios de API de
YouTube (§III.E.4) prohíben calcular métricas nuevas con sus datos y guardarlos más de 30
días sin refrescarlos, y la auditoría de cuota lo revisa. Por eso, en Los Números (el
tablero y la lista de publicaciones), la planilla de «Llevar para la casa», la API de métricas y la app del teléfono, las filas de YouTube traen sus
contadores tal como los da la API, **sin lo ganado, sin arrastre y sin entrar en los
totales**; sus suscriptores van sin «ganados» y fuera de la suma de seguidores. Las
visitas, los clicks y el CTR los mide Tu Parrilla y la tabla los marca como propios
(«En tu página · lo mide Tu Parrilla»), que es lo que la política pide para un dato propio al lado de
los de YouTube. Y al final de la sincronización diaria se borra lo que pasó el plazo: las
lecturas diarias de más de 30 días, los comentarios guardados hace más de 30 días, y el
título y la miniatura de los videos que llevan 30 días sin llegar. Un canal que su dueño
desconecta no espera ese plazo: *Desconectar* borra en el acto sus lecturas, las de sus videos,
sus comentarios y los títulos y miniaturas (`src/lib/social/desconectar.ts`), y deja el id y el
nombre del canal y la fila de cada video, que une las visitas a su etiqueta `?s=`. La regla vive en
`src/lib/social/politica-youtube.ts` y el borrado en `retencion-youtube.ts`. El permiso de
§III.L —calcular métricas propias y guardar historia de las estadísticas— no se pidió. Las playlists
de «Agregar a una playlist» siguen la misma regla: sus títulos viven unos minutos en la memoria
del servidor y no se guardan; del destino queda solo el id de la elegida (ver el bloque de YouTube
en «Varias cuentas de una misma red», más abajo).

**YouTube Analytics: escrito y cerrado.** La historia del canal llega por otra vía: la API de
YouTube Analytics, con el token del dueño y el permiso `yt-analytics.readonly`
(`src/lib/social/analitica-youtube.ts`, puro, y `analitica-youtube-sync.ts`). Al final de la
sincronización diaria, para cada canal conectado con ese permiso de un dueño que nombra
`YOUTUBE_ANALITICA_ABIERTO_PARA`, se leen los totales del canal día por día (la primera vez,
tres años; después, los últimos 30, que YouTube todavía corrige), las fuentes de tráfico, los
países y la edad y el género de los últimos 28 días, y cada video conocido desde que se publicó
—views, views con interacción, minutos vistos, duración media, porcentaje visto, me gusta,
comentarios, compartidos, suscriptores ganados y perdidos—. Una métrica que YouTube no acepta
en un reporte (`engagedViews` es nueva) se vuelve a pedir sin ella, y queda en `—`. Va a las
tablas `youtube_analitica_dias`, `youtube_analitica_desgloses` y `youtube_analitica_videos`,
que cuelgan de la cuenta (o del video) en cascada, y Los Números lo muestran en «Tu canal de
YouTube» y en «En YouTube Analytics», en la pieza. La API de Analytics tiene su propio cupo:
no gasta las unidades de la Data API que pidió la auditoría.

Son datos **autorizados** (§III.E.4.b): se pueden guardar mientras el dueño siga autorizando,
con la condición de comprobarlo cada 30 días. La comprobación es la lectura misma: cada vez que
la API contesta con su token queda `social_accounts.analitica_verificada_en`; un canal sin
marca en 30 días, o sin el permiso en `social_accounts.scopes` (lo que Google dijo conceder al
conectar, porque la ventana deja destildarlo), pierde todo lo de analítica en la retención
diaria, y la fila de un video que lleva 30 días sin refrescarse o que el sync marcó borrado,
también. Si YouTube contesta 401, o 403 por permisos, se borra en el acto y el canal deja de
decir que tiene el permiso. *Desconectar* lo borra con lo demás. Lo de §III.E.4.h no se afloja:
se muestra tal cual, sin sumar días ni restar ganados de perdidos.

Lo abren dos variables: `YOUTUBE_PERMISOS_ANALITICA=1` (el permiso está agregado en la consola
de Google) y `YOUTUBE_ANALITICA_ABIERTO_PARA` (para quién). El conectar pide el permiso solo a
quien está en la lista: la pantalla de consentimiento se verificó el 2026-10-14 sin él, y uno
sin verificar le muestra el cartel de «app no verificada» a quien conecta. Con la bandera puesta,
`/privacidad` suma el párrafo que lo cuenta. Encenderlo para todos espera la segunda
verificación de Google, que a su vez espera la auditoría de cuota (ver
`docs/google-verificacion-guion.md`, «La analítica: segunda verificación»).

### Instagram — cuenta profesional y página de Facebook

Necesitas una cuenta Business o Creator **ligada a una página de Facebook**. La conexión
usa *Instagram API with Facebook Login*: el id de la cuenta de Instagram se descubre a
través de las páginas que administras, así que sin esa página no hay nada que leer. Hay una
segunda vía, sin página, que hoy solo ven los usuarios que se le habilitan: más abajo, «Instagram
sin página de Facebook: el login de Instagram».

En [developers.facebook.com](https://developers.facebook.com), crea una app, agrega el
producto **Facebook Login**, y configura como redirect URI válida:

```
https://TU-DOMINIO/api/social/instagram/callback
```

Los permisos que pide la app son `instagram_basic`, `instagram_manage_insights`,
`pages_show_list`, `pages_read_engagement` e `instagram_content_publish`. El último es el
que usa la publicación (reels, fotos, carruseles y trial reels); se pide junto con los demás
porque los permisos se conceden una sola vez, al autorizar. Con `instagram_basic` y ese mismo,
sin nada más que pedir, funciona también la **Audio API** de Meta (2026-06-01): la música de la
biblioteca de Instagram que «Música de Instagram» le pega a un reel. Solo existe con este login,
el de Facebook; con el login de Instagram, Meta no la tiene (ver abajo).

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

#### Facebook: las views y el alcance

La página de Facebook se lee con la misma app (`src/lib/social/facebook.ts`): los posts de
`/{página}/published_posts`, con sus likes, comentarios y compartidos exactos en el post mismo.
Las **views y el alcance llegan hoy en `null`**, en todos los posts de Facebook (issue #338).
Meta los da en las insights, y las insights piden `read_insights`, que la conexión de Facebook
no pide: el diálogo lo rechazó en agosto de 2026 porque la app de Meta no lo tiene agregado en su
caso de uso. Y un reel tiene además las suyas aparte: las del post no cuentan lo que pasa en los
reels, y sus reproducciones y su alcance salen de `/{video-id}/video_insights`
(`blue_reels_play_count` y `post_impressions_unique`), que también piden `read_insights`.

Esa segunda lectura está escrita y cerrada detrás de `FACEBOOK_INSIGHTS_DE_REELS=1`: con ella,
cada reel pide el id de su video y sus insights. Se enciende cuando la app tenga `read_insights`
aprobado y las páginas se hayan reconectado con él, lo que es la tercera vuelta de Meta (ver
`docs/levantamiento-terceros.md`, §8). `compartidos` sigue viniendo del campo `shares` del post
(no pide `read_insights`): cuando Graph no lo trae, queda en `null`.

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
cuentas, los anuncios que se leyeron con ellas y las promociones armadas desde Tu Parrilla, que siguen en la cuenta publicitaria de la persona— y devuelve a Meta un código y la dirección `https://TU-DOMINIO/borrado/<código>`,
una página pública donde ese código confirma cuándo fue y cuántas cuentas se borraron. Lo
que escribiste tú —el texto y la media de una publicación programada— no es de Meta y no
se toca mientras el corte conserve algún destino: uno que todavía salga en otra red sigue
en la parrilla. Un corte que se quede sin ningún destino se borra con ellos, texto y media
incluidos (la media la borra el barrido de huérfanos en una o dos horas), porque un corte sin destinos no
aparecería en ninguna pantalla y no habría forma de abrirlo ni de borrarlo.

Si tu cuenta se conectó antes del 2026-09-30 y no la has reconectado, su `meta_user_id`
está vacío: el callback responde igual, pero con cero cuentas afectadas.

**Estas dos URLs cubren Instagram y Facebook, no Threads.** Threads se conecta por el caso
de uso «API de Threads» de la misma app, que tiene su propio par de campos, firmados con
`THREADS_APP_SECRET` y no con el de arriba: en ese caso de uso, *Uninstall callback URL* es
`https://<tu-dominio>/api/social/threads/baja` y *Delete callback URL*
`https://<tu-dominio>/api/social/threads/borrado`. Hacen lo mismo que las de Meta, con las
cuentas de Threads de esa persona, que se buscan por su id de Threads (`external_id`), y la
página de estado del borrado dice que eran de Threads.

#### Instagram sin página de Facebook: el login de Instagram

La otra vía de Meta es *Instagram API with Instagram Login* (*Business Login for Instagram*):
la persona entra con su usuario de Instagram, sin página ni cuenta de Facebook, y todo va a
`graph.instagram.com` con un token de la cuenta. Sigue pidiendo una cuenta profesional,
Business o Creator. En Tu Parrilla es la misma red, `instagram`, y la cuenta guarda con qué login
se conectó (`social_accounts.login`, `facebook` o `instagram`): el conector, el publicador y los
comentarios son los mismos y solo cambian de host (`src/lib/social/instagram-login.ts`). Lo que
de verdad cambia:

- **El token se renueva solo.** Dura 60 días y la sincronización lo renueva con
  `refresh_access_token` cuando le queda menos de un mes, sin el secreto; no hay que reconectar
  cada dos meses, como con el de Facebook.
- **El privado sale de la cuenta**, no de una página: `POST /<id>/messages` en
  `graph.instagram.com`, con el token de la cuenta. Sigue apagado salvo para quien diga
  `COMENTARIOS_DM`.
- **Una cuenta por login.** El login de Instagram autoriza la cuenta con que se entra, así que
  no hay lista para elegir. La fila se identifica por el id de la cuenta profesional (`user_id`
  de `/me`), el mismo que el login de Facebook encuentra en la página: si la misma cuenta se
  conecta por el otro login, se renueva la fila que ya estaba y cambia de login, con su historial.
- **Sin anuncios.** Su token es de `graph.instagram.com`, que no tiene Marketing API: «Lo pagado»
  no lo usa para leer (`ordenDeTokens`, en `anuncios-sync.ts`), y «Promocionar» una publicación
  suya responde que falta la página de Facebook, que Meta pide para promocionar.
- **Sin «Música de Instagram».** La Audio API de Meta existe solo con el login de Facebook (y el
  unificado): el bloque del compositor y del teléfono lo dice en vez de ofrecer canciones, la API
  rechaza `musica` para esta cuenta, y si una cuenta se reconecta con este login con un reel con
  música ya programado, ese destino falla diciendo por qué en vez de publicar sin la canción.

Se conecta con el caso de uso de **Instagram** de la app de Meta, en su parte «API setup with
Instagram login», que tiene su propio **Instagram app ID** y su propio secreto, distintos del id y
el secreto de la app que usa el login de Facebook:

```
INSTAGRAM_LOGIN_APP_ID=
INSTAGRAM_LOGIN_APP_SECRET=
INSTAGRAM_LOGIN_ABIERTO_PARA=
```

En ese caso de uso, en *Business login settings*: *OAuth redirect URIs*
`https://TU-DOMINIO/api/social/instagram/callback` (la misma vuelta que el login de Facebook: el
`state` firmado dice cuál fue), *Deauthorize callback URL*
`https://TU-DOMINIO/api/social/instagram/baja` y *Data deletion request URL*
`https://TU-DOMINIO/api/social/instagram/borrado`. Las dos últimas hacen lo de `meta/baja` y
`meta/borrado`, firmadas con `INSTAGRAM_LOGIN_APP_SECRET`, solo con las cuentas conectadas por este
login; como Meta no documenta cuál de los dos ids de la cuenta manda, se buscan por cualquiera. Las
de `meta/…`, por su lado, ya no tocan esas cuentas. Los permisos que pide la ventana son
`instagram_business_basic`, `instagram_business_content_publish`,
`instagram_business_manage_comments`, `instagram_business_manage_messages` e
`instagram_business_manage_insights`, los cinco juntos: si el caso de uso no tiene activado alguno,
Meta rechaza la ventana entera.

**Está cerrado para casi todos** mientras Meta no apruebe esos permisos: sin la aprobación, solo
autoriza quien tiene un rol en la app. `INSTAGRAM_LOGIN_ABIERTO_PARA` lleva los ids de usuario que
ven «Conectar con Instagram →» en Los Fierros (la cuenta del revisor, para grabar la revisión), o
`1` para todos cuando se apruebe (`loginDeInstagramAbiertoPara`, en `src/lib/redes-abiertas.ts`).
Para los demás, Los Fierros se ve como siempre y la conexión no arranca ni termina aunque se
escriba la dirección a mano (`/api/social/instagram/connect?login=instagram`). Una cuenta que ya se
conectó así sigue publicando y leyendo aunque se cierre; su «Reconectar» vuelve por Facebook.

Lo que no se pudo probar sin la app real, y hay que mirar al grabar: la forma exacta de la
respuesta del canje del código (la documentación la muestra envuelta en `data` y la referencia
plana: se aceptan las dos), si `/me` devuelve `user_id`, las historias y los trial reels por
`graph.instagram.com`, y qué id llega en la baja y el borrado.

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
4. Las cuentas de prueba del revisor no tienen por qué quedar paradas ese año. Si son
   cuentas reales del dueño, se publica en ellas con una llave del propio revisor: entrando
   como el revisor, La Cocina → «Tu propio chef» → «Generar llave», y esa llave se le da a la
   IA que programa (por ejemplo, la del editor). Programa a nombre del revisor, así que sus
   cuentas siguen donde Meta las revisa. Lo que no se hace mientras Meta revisa es
   traspasarlas ni desconectarlas: el revisor puede entrar cualquier día de la revisión.

El guion completo del video y de los pasos que el revisor sigue en el panel está en
`docs/meta-revision-guion.md`.

Si administras **más de una cuenta de Instagram**, al conectar el panel te muestra la
lista y marcas cuáles quieres ver. Cada una queda como una cuenta aparte, con sus
posts y sus métricas. Volver a conectar una que ya está solo renueva su acceso.

La analítica todavía agrupa por red: mientras una red tenga más de una cuenta conectada,
su tarjeta de seguidores y sus «ganados» muestran los números de una sola cuenta como si
fueran los de la red entera —eso se arregla en la próxima entrega—.

#### Renovar la conexión, cada ~60 días

Esto es del login de Facebook; una cuenta de Instagram conectada con el login de Instagram se
renueva sola (ver «Instagram sin página de Facebook: el login de Instagram»).

El token de Facebook dura unos 60 días. El cron intenta extenderlo una semana antes de que
venza, pero **no está garantizado que eso funcione** sobre un token que ya es de larga
duración: la vía documentada por Meta para uno que se está muriendo es volver a pasar por
el login. Si el intento no sirve, la credencial caduca y la tarjeta de esa cuenta en
**Los Fierros** se pone roja con el error de la API.

Cuando pase, entra al panel y pulsa **Reconectar** en la tarjeta de esa cuenta. El
historial de métricas ya recogido no se toca. Cuenta con hacerlo cada dos meses más o menos.

Desconectar borra las credenciales de esa cuenta y conserva su historial, salvo en YouTube, donde
lo que vino de su API se borra en el acto (ver «YouTube»). Para volver,
**Reconectar** en su tarjeta; para sumar otra cuenta de la misma red, **Agregar
cuenta** en el bloque de la red. Una tarjeta ya desconectada tiene además **Quitar**, que
pregunta en una ventana y borra la cuenta con su historial (sus publicaciones, números,
comentarios y destinos ya publicados); no deja si tiene publicaciones por salir. Liberar
una cuenta para otro usuario pide eso, porque mientras su fila exista queda atada a quien la
conectó, o que el admin la traspase en Los Maestros, que no borra nada.

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
sobre las cuentas que cada pantalla puede ofrecer: el panel, todas las tuyas; el teléfono, las
que puede publicar, que desde el 2026-11-07 incluyen TikTok (ver más abajo). Una instalación
del teléfono sin actualizar todavía no ofrece TikTok, así que con una cuenta de Instagram y
una de TikTok marca la de Instagram, porque ahí es la única que existe. Es deliberado: antes el sistema mandaba siempre a
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
puede no admitirlo. Con fotos publicadas directo, el bloque ofrece además «Música de TikTok»
(`musica`, que viaja como `auto_add_music`): TikTok les pone una canción recomendada. Su API no
la ofrece para videos ni para lo que va a la bandeja, así que ahí no se manda. Es la única
opción de TikTok que se recuerda: al programar fotos desde el compositor queda en
`social_accounts.tiktok_musica` y el interruptor de esa cuenta nace así la próxima vez —quien
tiene tres cuentas la elige una vez por cuenta—; la privacidad y las casillas nacen siempre sin
elegir, porque la guía de TikTok prohíbe dejarlas puestas. Instagram también puede pedir una opción por destino —si el reel sale
como trial reel—, y tanto el compositor del panel como Publicar en el teléfono la ofrecen:
un bloque (panel) o un chip (teléfono) por cuenta de Instagram marcada —«Publicar como
trial reel» / «Trial reel · @handle»—, pero solo cuando hay exactamente un video elegido:
con fotos, carrusel o sin archivo no aparece, y sin marcarlo no se manda nada. Un trial reel
es exactamente un video, sin fotos: si eliges otra cosa con la opción marcada, el lote lo
rechaza antes de subir nada; el compositor y el teléfono no, porque los dos suben cada
archivo apenas se elige —el bloque y el chip no se ofrecen sin un video único, y la regla
del servidor queda como reja de fondo, no como el primer filtro.

Con ese mismo video solo, el bloque de Instagram ofrece además **«Música de Instagram»** (en el
teléfono también, debajo del chip del trial reel): una canción de la biblioteca de Instagram
encima del sonido del video, con un volumen para la canción y otro para el video —para que la
canción no tape la voz—. Muestra lo que está sonando, busca por nombre y deja escuchar la muestra
antes de elegir. **«Sugiéreme una»** propone una sola que le quede al post, y **«Otra»** saca una
distinta sin repetir las ya mostradas: un modelo por la pasarela de IA (`MUSICA_MODELO`, el mismo
barato de los comentarios por defecto) lee el texto del post, propone una o dos búsquedas y elige
por id entre lo que está sonando y lo que esas búsquedas encontraron, con una frase de por qué.
No puede inventar una canción: lo que conteste que no sea una de esas candidatas se descarta.
Sin la pasarela, o si el modelo no contesta algo usable, elige el azar entre lo que está sonando:
el botón funciona igual. La canción viaja en las opciones del destino (`musica`, con su id, título,
artista y los dos volúmenes), así que la guardan el post, el borrador y la API sin columnas
nuevas, y el publicador la manda como `audio_configuration` al crear el contenedor del reel. Meta
solo la acepta en un reel: con fotos o carrusel no se manda aunque esté guardada, y una historia
no la lleva. No se puede ver el reel con la canción antes de publicarlo. Si Meta rechaza la
canción al crear el contenedor (ya no está disponible, por ejemplo), el destino falla al tiro con
el nombre de la canción y lo que dijo Meta, en vez de publicar sin la música que se eligió: como
el trial reel, el editor no cambia las opciones de un destino, así que se borra y se programa de
nuevo. Con el login de Instagram la música no existe: el bloque lo dice y no ofrece nada, y la API
lo rechaza. Lo que está sonando y cada búsqueda se guardan diez minutos en la memoria del
servidor, por cuenta (`social/instagram-audio.ts`).

YouTube también tiene un bloque por canal marcado, en el compositor y en Publicar del teléfono
(desde el 2026-11-08): **quién lo ve** —Público, que es lo de siempre, No listado o Privado
(`privacyStatus`)—, **«Hecho con IA»** —la declaración de contenido alterado o sintético de
YouTube, `containsSyntheticMedia`, que se manda solo encendida, como la de TikTok— y **«Agregar a
una playlist»**. Ninguna pide un permiso de Google nuevo: las dos primeras viajan en el
`videos.insert` de siempre, y las playlists se leen y se llenan con `youtube.force-ssl`, que la app
ya tiene (la pantalla de consentimiento está verificada, y cambiarle un permiso pediría otra
verificación). La lista se le pide a YouTube recién al encender el interruptor
(`playlists.list mine=true`, 1 unidad del cupo por página de 50) y vive cinco minutos en la memoria
del servidor, por canal (`social/playlists-youtube.ts`); de la elegida se guarda solo el id en las
opciones del destino, no el título, porque los datos de la API de YouTube no se guardan sin
refrescar. Cuando el video termina de procesarse, el publicador lo agrega al final de esa
playlist (`playlistItems.insert`, 50 unidades: una subida con playlist cuesta eso más lo de
siempre). Si YouTube no lo deja —la playlist se borró, el permiso, la red—, el destino **no
falla**: el video ya está en el canal y reintentar lo subiría otra vez. Queda publicado con un
aviso (`scheduled_post_targets.aviso`) que el editor muestra en ámbar debajo de su estado y que
`GET /api/schedule/posts` devuelve como `aviso`. Un teléfono sin actualizar no trae el bloque: al
programar un borrador, el servidor le pone las opciones de YouTube que dejó el panel
(`opcionesConYoutubeDelBorrador`), para que un video que quedó privado no salga público.

Desde el 2026-11-07 la app del teléfono ofrece TikTok como destino, con el mismo bloque que el
compositor —los datos de la cuenta de `creator_info`, la privacidad sin elegir, las
interacciones, la marca, «Hecho con IA», «Música de TikTok» y el consentimiento— y la
respuesta automática por palabra clave. Las dos rutas comparten el código del servidor: la
consulta a `creator_info` (`GET /api/mobile/schedule/accounts/{id}/tiktok` y la acción del
compositor llaman a `creadorDeCuenta`, en `src/lib/social/publish/tiktok-cuenta.ts`, igual que
`recordarMusicaTikTok`), y `POST /api/mobile/schedule` valida las opciones con
`validarOpcionesPorCuenta` y la regla con `validarRegla`, como el compositor. El teléfono además
no deja programar un video más largo de lo que `creator_info` dice que esa cuenta publica
(`max_video_post_duration_sec`); el compositor todavía no lo mira (ver `docs/pendientes.md`).

Solo la app que lo trae recibe eso: lo avisa en el encabezado `X-Parrilla-Publicar` (`tiktok`,
`palabra-clave` y, desde el 2026-11-08, `youtube`; `sabeDe`, en `src/lib/mobile-api.ts`). A una instalación sin actualizar no le
llegan las cuentas de TikTok, sus borradores con TikTok o con palabra clave se guardan sin
perder eso y se programan en el panel (`soloEnElPanel`, en `src/lib/borrador.ts`), y si
intentara programarlos se rechaza con el motivo. El encabezado y no un campo del cuerpo, como
`conMusica`, porque también lo necesitan los `GET`: las cuentas que se ofrecen y el borrador
que se abre.

Un post también puede salir como **historia** en Instagram y en la página de Facebook: es
otra opción por destino (`{ historia: true }`), con un solo archivo, sin texto, sin palabra
clave ni portada, y todos sus destinos tienen que ser historia. Una secuencia son varios posts,
uno por archivo, que comparten `{ secuencia, orden }`: el publicador no publica la historia
`n` de una cuenta hasta que salió la `n − 1` (o se quemó, o la borraron), así que salen en
orden aunque tengan la misma hora (`secuencia.ts`). Instagram la publica con un contenedor
`STORIES`; Facebook, con `/photo_stories` o, el video, con `/video_stories` en tres pasos. En La
Parrilla una historia es el **choripán al paso**, y en el modo día un onigiri. Hoy se
programan por la API, el CSV y el teléfono («Post · Historia» en Publicar, con su visor 9:16; ver
`mobile/README.md`); el compositor del panel las ofrece en una entrega siguiente
(`docs/superpowers/specs/2026-10-24-historias-design.md`). Una secuencia armada en el teléfono
entra entera o no entra: `POST /api/mobile/schedule` con `secuencia: true` crea una historia por
archivo en una sola transacción (`crearVariosProgramados`), y el borrador del que sale se consume
una vez para todas. El borrador recuerda si es una historia en el campo `modo`; el compositor del
panel todavía no lo lee, y abre ese borrador como un post. Las historias no entran al sondeo de
comentarios ni a las métricas.

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

#### TikTok for Business: comentarios y números

La app de TikTok de arriba (Login Kit, Display y Content Posting) no lee ni responde
comentarios —de cada video da solo cuántos tiene— y de la cuenta no da ningún número. Lo único
de TikTok que lee y responde comentarios, y que da los números de la cuenta, su audiencia y cada
video más a fondo, es la **Accounts API** de *TikTok API for Business* (business-api.tiktok.com),
que es otra app, en otro portal, con su propia revisión y su propio formulario de acceso. Lo que
dice su documentación, con las direcciones, está en `docs/levantamiento-terceros.md`, §3.5.

Está **escrito y cerrado**: solo lo ve quien diga `TIKTOK_COMENTARIOS_ABIERTO_PARA` —que se sigue
llamando así porque nació para los comentarios, pero hoy es la reja de toda la app—, y además
hacen falta las tres variables de esa app (`TIKTOK_BUSINESS_APP_ID`, `TIKTOK_BUSINESS_SECRET` y
`TIKTOK_BUSINESS_AUTORIZACION`). Con la reja cerrada no cambia nada que se vea, y ni la
sincronización ni el panel le piden nada a TikTok por esta vía. Para quien lo tiene abierto:

- En **Los Fierros**, el detalle de cada cuenta de TikTok conectada ofrece «Activar TikTok for
  Business (comentarios y números) →». Lleva a TikTok a autorizar esa misma cuenta por segunda
  vez, ahora en la app de TikTok for Business, con los permisos que el portal tenga marcados en
  la app: el enlace del portal los trae, así que `TIKTOK_BUSINESS_AUTORIZACION` se vuelve a copiar
  cada vez que cambian. La vuelta (`/api/social/tiktok/comentarios/vuelta`) canjea el código,
  exige los dos de comentarios (`comment.list` y `comment.list.manage`), comprueba que la cuenta
  que autorizó tiene el mismo nombre visible que la fila, y guarda esa segunda credencial
  **cifrada** junto a la cuenta, en `ajustes` (`tiktok_comentarios:<id de la cuenta>`): sin
  migración, porque es una sola por cuenta y nace cerrada (`docs/deuda-tecnica.md`). Los permisos
  de los números (`user.info.stats`, `user.insights`, `video.list`, `video.insights`,
  `discovery.search.words`) no se exigen: lo que falte solo apaga lo suyo, y a una cuenta activada
  sin alguno el detalle le ofrece «Autorizar de nuevo para traer todos sus números →». El token
  dura un día y se renueva solo, con el de renovación, que dura un año.
- En **La Mesa**, TikTok aparece como red y sus comentarios llegan cada cinco minutos, como los
  de Instagram (`src/lib/social/comentarios/tiktok.ts`): los públicos de primer nivel de cada
  video de los últimos siete días, con hasta tres respuestas cada uno, que dicen si la cuenta ya
  contestó desde la app. TikTok marca lo de la propia cuenta (`owner`), y con eso se reconoce lo
  del dueño. Responder es `/business/comment/reply/create/`, de hasta 1.200 caracteres. La regla
  de palabra clave funciona igual, en público: TikTok no tiene privado por esta vía.
- En la **sincronización diaria** (`src/lib/social/tiktok-numeros.ts`, que pide y traduce, y
  `tiktok-numeros-guardar.ts`, que guarda), cada cuenta activada lee además:
  - **La cuenta** (`/business/get/`, «Get account user info» y «Get account insights»): los
    últimos 30 días van a `account_metrics`, como los de las demás redes, cada uno en su propio
    día —TikTok los da con 24 a 48 horas de atraso—, con seguidores, visitas al perfil, views,
    alcance y gente que interactuó; la fila de hoy lleva los seguidores y los videos de por vida.
    Con eso TikTok entra a las tarjetas de «Tus cuentas» en Los Números. La audiencia (países,
    género y edad, desde 100 seguidores) y lo ganado en 30 días quedan en `ajustes`.
  - **Cada video** (`/business/video/list/`, «Get account media»): sus guardados y su alcance
    completan la lectura del día en `post_metrics`, que la app de siempre deja vacíos; las views,
    los likes, los comentarios y los compartidos se quedan con los de siempre, que son al
    instante (los de Business llegan atrasados y harían «perder» views en la serie). Lo demás
    —tiempo visto, cuántos lo vieron completo, seguidores que trajo, visitas al perfil, de dónde
    llegó la gente— son totales de toda la vida del video y se guardan, lo último leído, en
    `ajustes`: los muestra la pieza, en «En TikTok, más a fondo». Cada video se cruza con el de la
    fila por su id y, si no calza, por el número de su enlace; el registro dice cuántos calzaron
    de cada forma («[tiktok-business] videos de …»).
  - **La comparación** (`/business/benchmark/`, «Business benchmark»): el promedio de las cuentas
    de empresa verificadas de un rubro, una vez por semana o al cambiar el rubro en Los Números
    («Tu rubro»; por defecto, «Creador de contenido»).
  Si Business falla o falta un permiso, la sincronización de siempre sigue sola, sin aviso: nunca
  la tumba.
- En **Los Números**, con «⋯ Más», debajo de «Tus cuentas», aparece «TikTok, más a fondo»: la
  audiencia de cada cuenta activada y «Cuentas parecidas a la tuya», la comparación con el rubro.
- En el **compositor**, debajo del bloque de TikTok de una cuenta activada con su permiso, «Lo que
  se busca en TikTok» (`/discovery/trending/search/` y `.../keyword/`, «Discover trending search
  keywords»): las búsquedas en tendencia para esa cuenta, o las recomendadas para una consulta.
  No se pide nada hasta que se aprieta, y cada respuesta se recuerda seis horas por cuenta y
  consulta (`ajustes`), por el cupo de 40 llamadas por minuto. Es solo para cuentas con acceso
  avanzado o de empresa: a las demás les dice que TikTok no lo dio.

Todo lo de TikTok for Business de una cuenta vive en `ajustes` con la credencial
(`tiktok_comentarios:<id>`) o bajo `tiktok_business:<id>:` (audiencia, videos, rubro, comparación,
búsquedas): desconectar o quitar la cuenta lo borra entero, y traspasarla lo pasa con ella.

La dirección de vuelta que se registra en el portal lleva la barra final, que TikTok exige:
`https://tu-parrilla.cl/api/social/tiktok/comentarios/vuelta/`. Next redirige esa dirección a la
que no la lleva, con el código intacto.

Lo que no se pudo probar sin la app aprobada: que el id de video que da la Display API (el de
`social_posts`) sea el mismo `item_id` de la Accounts API —los dos son el número de la dirección
del video, así que debería; el cruce por el enlace cubre el caso contrario y el registro lo
contesta con la primera cuenta—, que una cuenta personal (no de empresa) pueda autorizar —la
documentación no lo restringe para los comentarios, solo para algunas métricas, la comparación
de su rubro y las búsquedas—, con qué nombre llega el código a la vuelta (se acepta `code` y
`auth_code`) y con qué nombre llega al token el permiso de la comparación, que su documentación no
dice (se pide igual, y si TikTok la niega no se muestra). El registro de Vercel dice qué contestó
TikTok.

### Threads

Threads publica desde el caso de uso «API de Threads» de la misma app de Meta
(`THREADS_APP_ID` y `THREADS_APP_SECRET`) y hoy está en «Próximamente» para todos menos los
usuarios de `THREADS_ABIERTO_PARA` (ver «Conectar y sincronizar»). Además de publicar, tiene
escritos sus números y sus respuestas, para la tercera vuelta del App Review:

- **Números** (`threads_manage_insights`, `src/lib/social/threads.ts`): la sincronización
  diaria lista las publicaciones propias de la cuenta —deja fuera los reposts de publicaciones
  ajenas— y pide a cada una sus views, likes, respuestas, reposts y citas. Van a las columnas de
  siempre: las respuestas son los comentarios, y reposts más citas son los compartidos. De la
  cuenta, los seguidores y las views del último día. Threads no entrega guardados, alcance ni
  visitas al perfil.
- **Respuestas en La Mesa** (`threads_read_replies` y `threads_manage_replies`,
  `src/lib/social/comentarios/threads.ts`): cada cinco minutos, la conversación de cada
  publicación de los últimos siete días. Los comentarios de la cola son las respuestas
  directas al post, y las respuestas a ellas dicen si la cuenta ya contestó desde la app.
  Threads no da el id de quien responde, solo su usuario y si la respuesta es de la propia
  cuenta (`is_reply_owned_by_me`), que alcanza para reconocer lo del dueño. Responder es
  publicar un post de texto con `reply_to_id`, de hasta 500 caracteres.
- **Palabra clave**: la regla funciona igual que en YouTube, siempre en público, porque Threads
  no tiene mensajes privados. Un «Mensaje» de más de 500 caracteres no sale solo —recortado
  perdería el enlace— y queda en la cola.

Los tres permisos se piden al conectar solo con `THREADS_PERMISOS_EXTRA=1`: la ventana de
Threads rechaza el pedido entero si nombra un permiso que el caso de uso no tiene activado.
Sin la bandera, el conector y la cola de Threads se quedan quietos, como con una cuenta
desconectada, y publicar sigue igual. Con la bandera, una cuenta de Threads conectada antes
tiene que reconectarse para concederlos; mientras no lo haga, su sincronización falla y su
fila en Los Fierros queda en rojo.

### Responder comentarios

El panel puede traer los comentarios nuevos de tus publicaciones de Instagram, Facebook y
YouTube (y de Threads en la cuenta del revisor de Meta, ver «Threads»; y de TikTok solo donde
`TIKTOK_COMENTARIOS_ABIERTO_PARA` lo abre, ver «TikTok for Business: comentarios y números»), y en la cola te propone una respuesta que apruebas de un toque. El descubrimiento
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

**Desde el teléfono** (desde el 2026-11-07), La Mesa se abre con una tarjeta en La Parrilla que
dice cuántos esperan, y trae lo esencial: «Pendientes», «Enviados» y «Automáticas», el filtro por
red, y en cada comentario el borrador para corregir, «Enviar», «Descartar» y pedir otro borrador.
Las instrucciones, «Regenerar todos», «Descartados» y «Todos» se quedan en el panel. Las rutas,
con el token del teléfono, llaman a las mismas funciones que el panel —con el dueño del token, las
mismas reglas y las mismas frases— y no tienen reglas propias:

| Ruta | Qué hace |
|---|---|
| `GET /api/mobile/comentarios?estado=&red=` | La cola de `getCola` agrupada por publicación (`src/lib/comentarios-movil.ts`), con cuántos esperan en esa red (`contarPendientes`), las redes de los botones (`redesDeLaMesa`, la misma lista del panel) y, en `faltantes`, el aviso «Comentarios que Instagram no entrega» (`getComentariosQueFaltan`, con la frase ya escrita; vacío con otra red elegida). |
| `GET /api/mobile/comentarios/pendientes` | Solo el número, para la tarjeta de La Parrilla. |
| `POST /api/mobile/comentarios/{id}/respuesta` | «Enviar», con `{ texto }`: `responderComentario`. |
| `POST /api/mobile/comentarios/{id}/descartar` | «Descartar»: `descartarComentario`. |
| `POST /api/mobile/comentarios/{id}/borrador` | Otro borrador: `redactarUno`. |

Un error vuelve con la frase del panel y un código según la frase (`codigoDeLaMesa`): `400` lo que
hay que corregir en el texto, `404` el comentario que ya no está, `409` la cuenta desconectada y
`502` lo que la red o la IA no aceptaron. Un `404` sin frase es un sitio sin estas rutas, y la app lo
dice así (ver `mobile/README.md`, «La Mesa desde el teléfono»).

Nada sale sin tu toque. Dos toques, el panel abierto en dos pestañas, o el panel y el teléfono a
la vez, mandan una sola vez: justo antes de enviar, la respuesta reclama el
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

El mensaje privado a quien comentó está escrito y **apagado** salvo para quien diga
`COMENTARIOS_DM`. Meta exige `instagram_manage_messages` y `pages_messaging`; sin su acceso
avanzado, que pasa por la revisión de la app, solo deja escribirle a quien tiene un rol en ella.
Para grabar esa revisión, `COMENTARIOS_DM` lleva el id del usuario revisor (una lista de ids
separados por comas lo enciende solo para esos); aprobado, `COMENTARIOS_DM=1` lo enciende para
todos, en Instagram y Facebook, dentro de los siete días que Meta permite. Los permisos se piden
al conectar solo con `META_PERMISOS_PRIVADO=1`, que se enciende después de activarlos en los
casos de uso de la app de Meta, y la cuenta tiene que reconectarse para concederlos. En
Instagram el privado sale de la página de Facebook enlazada, con su token, que se busca al
mandarlo (`paginaParaPrivado`, en `comentarios/privado.ts`). Una cuenta conectada con el login de
Instagram no tiene página: el privado sale de la cuenta misma, por `graph.instagram.com`, y su
permiso (`instagram_business_manage_messages`) se pide siempre al conectar, sin
`META_PERMISOS_PRIVADO`. Con el privado apagado, la cola no
muestra nada de él.

Después de fusionar, la migración se aplica sola al desplegar: la tabla de comentarios gana
dos columnas para el estado del privado.

#### Respuesta automática por palabra clave

Al programar un post puedes ponerle una palabra clave, un mensaje con enlace y una
respuesta pública. Funciona en Instagram, Facebook y YouTube (y en Threads, ver «Threads»): cuando alguien comenta esa
palabra, la corrida siguiente del cron que la sondea (cinco minutos como mucho en Instagram y
Facebook; en YouTube, media hora) responde sola, sin pasar
por la cola de aprobación, y la cola lo marca como «Automática». Con el privado encendido para
el dueño (`COMENTARIOS_DM`), en Instagram y Facebook la respuesta pública es la corta y el
mensaje con el enlace va por privado, una sola vez por persona en cada post; si el privado no
sale, queda anotado en la fila y la respuesta pública ya salió igual. Con el privado apagado, o
en YouTube, o pasados los siete días, el mensaje con el enlace se publica como la respuesta
pública: nunca se promete un privado que no salió. TikTok
tiene cola de comentarios solo donde está abierta (ver «TikTok for Business: comentarios y
números»): para los demás, una regla en un post que solo va a TikTok no hace nada. Si el enlace es de tu sitio, se le agrega `?s=dm-<palabra>` y aparece como fila
propia en **Los Números** (Analítica) → «En tu página» → «⋯ Más» → «Todas las etiquetas». Para eso el servidor necesita saber
cuál es tu dominio: `SITE_URL=https://www.tu-dominio.cl` (si falta, usa el dominio de
producción que Vercel inyecta).

La regla puede traer además un PDF (`documentoUrl` en la API de lote, hasta 25 MB): se
descarga y se copia al almacenamiento propio al programar, no al comentar, para que un
enlace que muere después o una página de Drive no rompan la respuesta días más tarde. El
documento nunca se manda como adjunto, siempre como enlace al final del mismo mensaje —así
que, igual que el resto de la regla, sale en la respuesta pública mientras el privado esté
apagado.

Instagram esconde a veces el comentario que es **solo** la palabra: lo suma en su cuenta de
comentarios, pero no se lo muestra a la dueña ni a la API, así que la regla nunca lo ve (el
caso está en `docs/pendientes.md`). La ayuda de «Palabra clave» pide la palabra dentro de una
frase o una distinta por post, y La Mesa avisa con «Comentarios que Instagram no entrega»
cuando, en una publicación de Instagram de los últimos siete días, la última lectura del sync
cuenta al menos dos comentarios más de los que llegaron (los guardados más las respuestas de la
dueña que se conocen). Se calcula al abrir La Mesa, sin columna propia
(`src/lib/social/comentarios/faltantes.ts` y `getComentariosQueFaltan`, en
`src/lib/comentarios-cola.ts`). Las respuestas que otras personas se dan entre ellas también
suman en Instagram y no se guardan, y por eso el aviso dice que parte de la diferencia puede ser
eso.

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
no publica hoy (el detalle, en `docs/pendientes.md`). Lo programado antes a esas redes se quema
en su primer intento, con la misma frase. Abrir una es sacarla de esa lista. Para grabar la
revisión de Threads, `THREADS_ABIERTO_PARA` la abre solo para los usuarios que nombra
(`proximamentePara`, en `src/lib/redes-abiertas.ts`): para ellos, Los Fierros, el compositor, el
editor, la API y el publicador la tratan como cualquier otra red. La portada sigue con la lista
fija. Sus números y sus respuestas dependen además de `THREADS_PERMISOS_EXTRA` (ver «Threads»).

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

**Y cada hora, lo de las últimas 48 horas** (`src/lib/social/reciente.ts`, en
`/api/cron/numeros-recientes`; ver «Los números cada hora», más abajo). Instagram, Facebook y
TikTok listan solo lo publicado en ese plazo —sin el mínimo de 200— y escriben la lectura de
hoy en `post_metrics`, la misma fila del día, más al día; lo que no conocían lo guardan, con su
`?s=`. YouTube no, por su cupo. Nada con más de 48 horas, para no tocar la lectura «a las 48
horas» de Los Números (`viewsA48h`, que es la primera entre las 48 y las 72). Esa lectura no
archiva, no lee la cuenta ni TikTok for Business y no cambia la tarjeta de Los Fierros: eso es
de la del día. Una lectura que no trae un número no borra el que la fila del día ya tenía
(`writeSnapshots`), así que los guardados y el alcance que completó Business se quedan.

**Los seguidores de cada publicación** (`post_metrics.seguidores`) los da solo Instagram, y solo
en las fotos y los carruseles (`follows`): Meta no tiene esa métrica en los reels, y pedirla en
uno contesta un error, así que no se pide. Si Meta rechaza la llamada con `follows`, se repite
sin él. Los de TikTok for Business no van ahí, sino con el resto de su detalle en `ajustes`,
que se borra al desconectar.

**Lo pagado: leer los anuncios de Meta.** Al final de cada sincronización, para
cada dueño que nombra `ANUNCIOS_ABIERTO_PARA`, Tu Parrilla lee con la Marketing API sus cuentas
publicitarias (`me/adaccounts`) y los anuncios de cada una, con sus totales de principio a fin
—gasto, alcance, impresiones, clics y fechas— y el creativo, que dice qué publicación se
promocionó. Lo cruza contra sus publicaciones de Instagram (`effective_instagram_media_id`) y
de Facebook (`effective_object_story_id`, el mismo `páginaID_postID` con que se guardan) y lo
guarda en la tabla `anuncios`, que cuelga de la cuenta conectada cuyo token lo leyó
(`src/lib/social/anuncios.ts` y `anuncios-sync.ts`). Los Números lo muestran en «Lo pagado».
Una promoción hecha desde la app de Instagram o desde la página es un anuncio más de la cuenta
publicitaria, así que entra igual. Se lee una vez por dueño, no por cuenta, y primero con el
token de Instagram: es el de usuario, el que la Marketing API acepta; el de Facebook es de
página y se prueba solo si no hay otro. Un Instagram conectado con el login de Instagram no se
prueba: su token no es de `graph.facebook.com`. Un error acá —lo normal mientras falte el permiso— no
pinta ninguna cuenta de rojo: queda en el registro del cron. Leer pide `ads_read`, y solo al
conectar con `META_PERMISOS_ANUNCIOS=1`.

**Promocionar desde Tu Parrilla.** En la pieza de una publicación ya publicada de Instagram o
Facebook, «Promocionar» arma lo mismo que el botón de la app, en la cuenta publicitaria del
creador (`src/lib/social/promocionar.ts`, puro, y `promocionar-meta.ts`): una campaña con el
objetivo elegido —alcance, interacción o visitas a su página— y `special_ad_categories: []`, que
el creador confirma que no es vivienda, empleo, crédito ni política; un conjunto con el
presupuesto (por día o total, en la moneda de la cuenta y en su unidad mínima: pesos chilenos
enteros, centavos de dólar), las fechas, los países, las edades y el público Advantage+ si se
pide; un creativo que apunta a la publicación que ya existe (`object_story_id` en Facebook;
`source_instagram_media_id`, la cuenta y su página en Instagram), y el anuncio. Antes de crear
nada, el formulario muestra lo máximo que se puede gastar (el total, o el diario por los días) y
la acción solo sigue si el gasto que el creador confirmó es el que calcula el servidor. La
campaña nace siempre en pausa y se enciende al final, solo si el creador eligió activarla; si
Meta rechaza un paso, la campaña se borra y no queda nada. Antes de intentar se mira la cuenta
publicitaria —deshabilitada, con un pago pendiente, sin medio de pago, sin permiso para anunciar—
y el mínimo diario de Meta (`minimum_budgets`); los errores de Meta se piden en castellano
(`locale=es_LA`) y se muestran tal cual. Pausar, reanudar y detener (archivar: los resultados
quedan) le cambian el estado a la campaña. Cada promoción queda en la tabla `promociones`, que
cuelga de la cuenta de la publicación; cómo va se lee en vivo, y lo que logra llega a «Lo pagado»
por la lectura de arriba. Quitar la cuenta, o el borrado de Meta, borra la fila pero no toca la
campaña en Meta: es de la cuenta publicitaria del creador, que la maneja en el Administrador de
anuncios. Promocionar pide `ads_management`, solo con `META_PERMISOS_PROMOCIONAR=1` y junto a la
de leer, y se ofrece a quien nombra `ANUNCIOS_ABIERTO_PARA` con las dos banderas puestas
(`promocionarAbiertoPara`). Todo espera la revisión de Meta (ver `docs/pendientes.md`).

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

Una excepción que conviene saber: `0025_la_bodega.sql` mueve lo crudo de La Cocina a la cámara de
frío (`materiales`). Volver atrás de ese despliegue es seguro por unos días, pero el código de antes
le pone 14 días de vencimiento a lo crudo de una comanda que se cancela o termina, y al vencer
borraría el archivo, que ahora es de la cámara. Si hubiera que quedarse atrás más que eso, hay que
quitarle ese vencimiento a mano a lo que viene de la cámara, en el editor SQL:
`update insumos set expira_en = null where material_id is not null`.

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
| `ADMIN_EMAIL` | El correo del primer usuario, el admin. También es adonde llega la alarma de La Cocina: las comandas que llevan media hora sin tomar o pasaron su hora estimada (ver «La Cocina») | Sí |
| `AUTH_SECRET` | Firma las sesiones —la cookie del panel y el token del teléfono— y los mensajes de los redirects, y de ella sale la llave que cifra los tokens de las redes guardados en la base | Sí — cambiarla cierra todas las sesiones y deja ilegibles los tokens guardados: hay que reconectar cada cuenta |
| `MOBILE_TOKEN_VERSION` | La versión de las sesiones de la app del teléfono: subirla en 1 cierra la de todos los teléfonos a la vez (ver `mobile/README.md`, «Si se pierde el teléfono») | No — por defecto `1` |
| `FINGERPRINT_SALT` | Sal del hash de visitante | Conviene — sin ella se usa una derivada de `AUTH_SECRET`; ponerla o cambiarla después cambia los visitantes únicos de ese día |
| `INGRESO_FROM` | Remitente de los códigos de ingreso | No — sin ella se usa el remitente de prueba de Resend |
| `R2_ACCOUNT_ID` | ID de tu cuenta de Cloudflare | No — sin ella no puedes subir media |
| `R2_ACCESS_KEY_ID` | Llave de acceso para R2 | No — sin ella no puedes subir media |
| `R2_SECRET_ACCESS_KEY` | Llave secreta para R2 | No — sin ella no puedes subir media |
| `R2_BUCKET` | Nombre del bucket de R2 | No — sin ella no puedes subir media |
| `R2_PUBLIC_BASE` | URL pública del bucket de R2 | No — sin ella no puedes subir media |
| `R2_ENDPOINT` | Solo en local: el de otro almacén compatible con S3 (un S3Mock o un MinIO en Docker), para probar las subidas sin R2. Sin ella, el de R2 | No — en producción no va |
| `DOMINIO_PRODUCTO` | El dominio donde vive la landing del producto. Ese dominio sirve las páginas de todos; los demás, solo las de su dueño. Es también el único donde se abre el panel, y al que lleva el botón del correo del código (sin ella, el correo va sin botón) | No — sin ella ningún dominio es el del producto y todos sirven solo lo del dueño |
| `SITE_TIMEZONE` | Zona por defecto de los usuarios nuevos y del sitio público; cada usuario cambia la suya en Tu Cuenta. Si no es una zona IANA conocida, se avisa por consola y se usa `America/Santiago` | No — por defecto `America/Santiago` |
| `YOUTUBE_API_KEY` | Lee las estadísticas públicas de los canales conectados | No — sin ella YouTube no trae métricas |
| `YOUTUBE_CHANNEL_ID` | Deja creada la tarjeta del canal del dueño del despliegue; se sincroniza recién cuando lo conecta con OAuth | No |
| `GOOGLE_CLIENT_ID` | Conectar YouTube para publicar (OAuth de Google) | El OAuth Client tipo Web del mismo proyecto de la API key |
| `GOOGLE_CLIENT_SECRET` | El secreto de ese OAuth Client | Junto con el anterior; el sync de solo lectura sigue usando `YOUTUBE_API_KEY` |
| `YOUTUBE_PERMISOS_ANALITICA` | Con `1`, conectar YouTube pide además `yt-analytics.readonly` a quien nombra la de abajo, y `/privacidad` suma el párrafo de YouTube Analytics (ver «YouTube») | No — apagada por defecto; se enciende solo con el permiso agregado en *Data Access* de la consola de Google |
| `YOUTUBE_ANALITICA_ABIERTO_PARA` | Para quién se pide ese permiso, se lee YouTube Analytics cada noche y se ve «Tu canal de YouTube» en Los Números y «En YouTube Analytics» en la pieza. `1`, todos; ids de usuario separados por comas, solo esos | No — vacía, para nadie; sin la de arriba, cerrada igual. Es para grabar la verificación con la cuenta del revisor; aprobada, va en `1` |
| `INSTAGRAM_APP_ID` | Conectar Instagram | No — sin ella esa red aparece como no conectada |
| `INSTAGRAM_APP_SECRET` | Conectar Instagram, y verificar la firma de los callbacks de baja y borrado de Meta | No — sin ella esa red aparece como no conectada y esos dos callbacks responden `400` |
| `INSTAGRAM_LOGIN_APP_ID` | Conectar Instagram con el login de Instagram, sin página de Facebook (ver «Instagram sin página de Facebook: el login de Instagram») | No — el «Instagram app ID» del caso de uso de Instagram de la app de Meta, que no es `INSTAGRAM_APP_ID`; sin ella, «Conectar con Instagram →» responde «Falta INSTAGRAM_LOGIN_APP_ID» |
| `INSTAGRAM_LOGIN_APP_SECRET` | El secreto de ese caso de uso: canjea el código y firma la baja y el borrado de ese login (`/api/social/instagram/baja` y `/borrado`) | Junto con el anterior; sin ella esos dos callbacks responden `400` |
| `INSTAGRAM_LOGIN_ABIERTO_PARA` | Ids de usuario, separados por comas, que ven «Conectar con Instagram →» en Los Fierros y pueden conectar por ese login; `1`, todos | No — vacía, el login de Instagram está cerrado para todos. Es para grabar la revisión de Meta de los permisos `instagram_business_*` con la cuenta del revisor; aprobados, va en `1` |
| `TIKTOK_CLIENT_KEY` | Conectar TikTok | No — sin ella esa red aparece como no conectada |
| `TIKTOK_CLIENT_SECRET` | Conectar TikTok | No — sin ella esa red aparece como no conectada |
| `TIKTOK_BUSINESS_APP_ID` | TikTok for Business —los comentarios de TikTok en La Mesa y los números que la app de siempre no da—: el App ID de la app de TikTok for Business (business-api.tiktok.com), que no es la de `TIKTOK_CLIENT_KEY` (ver «TikTok for Business: comentarios y números») | No — sin ella TikTok for Business queda cerrado para todos |
| `TIKTOK_BUSINESS_SECRET` | El Secret de esa app: canjea y renueva la credencial de TikTok for Business | Junto con el anterior |
| `TIKTOK_BUSINESS_AUTORIZACION` | La «TikTok account holder authorization URL» de esa app, tal cual la da el portal (App Detail → Basic Information); de ella salen la dirección de vuelta del canje y los permisos que se piden, así que se vuelve a copiar cada vez que cambian los permisos de la app | Junto con los dos anteriores |
| `TIKTOK_COMENTARIOS_ABIERTO_PARA` | La reja de toda la app de TikTok for Business, aunque el nombre diga comentarios (nació para ellos y ya está puesta): ids de usuario, separados por comas, que ven «Activar TikTok for Business (comentarios y números) →» en sus cuentas de TikTok, cuya Mesa trae los comentarios de las que activaron, cuyos Números muestran «TikTok, más a fondo» y cuyo compositor ofrece «Lo que se busca en TikTok»; `1`, todos | No — vacía, cerrado para todos. Es para grabar la revisión de la app de TikTok for Business con la cuenta del revisor; aprobada, va en `1` |
| `META_EN_REVISION` | Enciende en Los Fierros el aviso de que, mientras la app de Meta esté en revisión, solo conectan las cuentas invitadas como testers | No — solo mientras la app de Meta esté en modo desarrollo |
| `REVISION_CORREO` | El único correo (ya invitado en Los Maestros) que recibe un código de ingreso fijo en vez de uno mandado por correo, para que el revisor de Meta entre | No — solo con la app de Meta en revisión o publicada (Meta vuelve a revisarla) |
| `REVISION_CODIGO` | El código fijo de seis dígitos que vale para ese correo; el mismo que dicen las instrucciones para revisores en Meta | No — va junto a `REVISION_CORREO` |
| `THREADS_APP_ID` | Conectar Threads para publicar; hoy en «Próximamente» (ver «Conectar y sincronizar») | El Threads App ID del caso de uso «API de Threads» de la app de Meta |
| `THREADS_APP_SECRET` | El secreto de ese caso de uso; firma también la baja y el borrado que manda Threads (`/api/social/threads/baja` y `/borrado`) | Junto con el anterior |
| `THREADS_ABIERTO_PARA` | Ids de usuario, separados por comas, para los que Threads no dice «Próximamente»: pueden conectarlo, programarle y publicar en él | No — es para grabar la revisión de Meta de Threads con la cuenta del revisor; aprobada, Threads sale de «Próximamente» para todos y esta variable sobra |
| `THREADS_PERMISOS_EXTRA` | Con `1`, conectar Threads pide además `threads_manage_insights`, `threads_read_replies` y `threads_manage_replies`, y Tu Parrilla lee sus números y sus respuestas (ver «Threads») | No — encenderla solo después de activarlos en el caso de uso de Threads de la app de Meta: si no, Threads rechaza la ventana entera. Las cuentas conectadas antes se reconectan una vez |
| `X_CLIENT_ID` | Conectar X para publicar (OAuth 2.0 + PKCE); hoy en «Próximamente» | El Client ID de la app en developer.x.com |
| `X_CLIENT_SECRET` | El secreto de esa app | Junto con el anterior |
| `X_BEARER_TOKEN` | Leer los tuits públicos de los creadores del modo Tinder (ver «Modo Tinder») | No — sin ella el modo Tinder no trae nada de X |
| `AI_GATEWAY_API_KEY` | Redactar con un modelo los borradores de respuesta a comentarios (ver «Responder comentarios») | No — en Vercel puede omitirse si el proyecto usa OIDC; sin ninguna de las dos, los comentarios entran a la cola sin borrador |
| `COMENTARIOS_MODELO` | El modelo de esos borradores, con la forma `proveedor/modelo` | No — tiene uno por defecto |
| `MUSICA_MODELO` | El modelo de «Sugiéreme una» en «Música de Instagram», con la forma `proveedor/modelo`; usa la misma pasarela (`AI_GATEWAY_API_KEY` u OIDC) | No — tiene uno por defecto (`anthropic/claude-haiku-4.5`); sin pasarela, o con un nombre que no existe, la sugerencia la elige el azar entre lo que está sonando |
| `COMENTARIOS_DM` | El privado a quien comentó en Instagram o Facebook, tras responderle a mano y en la regla de palabra clave. `1` lo enciende para todos; una lista de ids de usuario separados por comas, solo para esos (la cuenta del revisor de Meta mientras revisa) | No — apagada por defecto; exige `instagram_manage_messages` y `pages_messaging` (sin acceso avanzado, solo llega a quien tiene un rol en la app de Meta) |
| `META_PERMISOS_PRIVADO` | Con `1`, conectar Instagram y Facebook pide además los permisos del privado | No — encenderla solo después de activarlos en los casos de uso de la app de Meta: si no, Meta rechaza la ventana entera |
| `META_PERMISOS_ANUNCIOS` | Con `1`, conectar Instagram y Facebook pide además `ads_read`, para leer los resultados de los anuncios («Lo pagado») | No — encenderla solo después de activar `ads_read` en los casos de uso de la app de Meta: si no, Meta rechaza la ventana entera |
| `META_PERMISOS_PROMOCIONAR` | Con `1`, y solo junto a `META_PERMISOS_ANUNCIOS=1`, conectar Instagram y Facebook pide además `ads_management`, para promocionar una publicación desde Tu Parrilla | No — encenderla solo después de activar `ads_management` en los casos de uso de la app de Meta: si no, Meta rechaza la ventana entera. Sin ella no se ofrece «Promocionar» |
| `ANUNCIOS_ABIERTO_PARA` | Para quién se leen los anuncios de Meta y se ve «Lo pagado» en Los Números; con las dos banderas de arriba, también «Promocionar». `1`, para todos; una lista de ids de usuario separados por comas, solo para esos (la cuenta del revisor de Meta mientras revisa) | No — apagada por defecto; sin `ads_read` concedido la lectura falla cada noche, así que se abre para todos solo con los permisos aprobados |
| `FACEBOOK_INSIGHTS_DE_REELS` | Con `1`, la lectura diaria de Facebook pide además las insights del video de cada reel (`/video_insights`) y trae sus views y su alcance, que hoy llegan en `null` (ver «Facebook: las views y el alcance») | No — apagada por defecto; Meta exige `read_insights`, que la conexión de Facebook todavía no pide. Encendida antes de tiempo no rompe nada: gasta una llamada por reel y los números siguen en `null` |
| `MERCADOPAGO_ACCESS_TOKEN` | El Access Token de la aplicación de Mercado Pago (Tus integraciones → Credenciales): con él se crean, leen y cancelan las suscripciones al plan pagado. El de prueba sirve para probar con usuarios de prueba | No — sin él, «Tu plan» no ofrece pagar y la relectura diaria no corre (ver «Los planes») |
| `MERCADOPAGO_WEBHOOK_SECRET` | La clave secreta del webhook de esa aplicación (Webhooks → «Planes y suscripciones»): con ella `/api/pagos/mercadopago` verifica la firma de cada aviso | No — sin ella el webhook contesta `400` a todo, y las suscripciones se ponen al día solo al volver de Mercado Pago y en la relectura diaria |
| `PAGOS_ABIERTO_PARA` | Para quién aparece «Pasar a Maestro Parrillero» en Tu Cuenta: `1`, para todos; una lista de ids de usuario separados por comas, solo para esos (para probar con una cuenta de prueba) | No — vacía, cerrado para todos. Se abre a todos cuando `/terminos` y `/privacidad` cuenten el cobro |
| `SITE_URL` | Tu dominio, para etiquetar los enlaces del mensaje automático | No — sin ella se usa el dominio de producción de Vercel |
| `COCINA_SECRET` | La credencial de La Cocina: la que el servidor del chef manda en `Authorization: Bearer …` a `/api/cocina/…` para tomar comandas, bajar insumos, informar estados y entregar creativos (ver «La Cocina» y `docs/cocina-api.md`). La conocen solo este despliegue y el servidor del chef | No — sin ella esas rutas responden `401` y la cocina queda cerrada; si la pones, genérala igual que `CRON_SECRET` y dásela al servidor del chef |
| `CRON_SECRET` | Autoriza las corridas programadas: el sync diario, la publicación cada 5 minutos y los números cada hora. Vercel la manda sola a su cron; el pinger externo la manda en `Authorization: Bearer …` | Sí — Vercel no la crea: se genera igual que `AUTH_SECRET` y se agrega. Sin ella los crons responden `401` y no corre nada |
| `MIGRAR_PREVIEWS` | Que los previews migren la base | Solo cuando el preview tenga una base propia; contra la de producción, no |
| `DATABASE_URL_PRUEBAS` | Solo para las pruebas de integración: una Postgres desechable donde cada archivo crea y migra su propia base (ver «Comandos»). No va en Vercel | No — sin ella esas pruebas se saltan. Nunca la de producción |
| `SCHEDULE_API_KEY` | La llave del despliegue: abre `POST /api/schedule/batch` (carga masiva), `POST /api/media` (subir un archivo una vez), `GET` y `DELETE /api/schedule/posts/{id}` (un post, o sacarlo), `POST /api/schedule/posts/{id}/archivar` y `…/desarchivar` (archivar lo quemado), `GET /api/schedule/posts` (calendario), `GET /api/schedule/resumen` (el resumen del día), `GET /api/schedule/cuentas` (las cuentas), `GET /api/metrics/posts` (métricas), `GET /api/metrics/mejores` (el mejor X %), `GET /api/metrics/que-funciona` (qué tema, estilo y formato funcionan, y si la música ayuda) y `/api/bodega…` (la cámara de frío de La Cocina) a nombre del admin. Es anterior a las llaves por usuario y sigue para el agente que ya la usa | No — sin ella esos endpoints aceptan solo las llaves que cada usuario genera en La Cocina («Tu propio chef»); si la pones, genérala igual que `CRON_SECRET` |
| `RESEND_API_KEY` | Manda los códigos de ingreso y los avisos: la publicación que se quemó, la cuenta que se cayó, el resumen del día y la comanda de La Cocina que entregó o terminó (ver «Avisos por correo») | Sí — sin ella nadie puede entrar al panel |
| `PUBLISH_ALERT_TO` | Adónde va un aviso sin dueño con correo: un post o una cuenta de antes de los usuarios, y la alarma de La Cocina si falta `ADMIN_EMAIL`. Lo demás va al correo de su dueño | No — sin ella, lo que no tiene dueño no avisa; el calendario y Los Fierros lo siguen mostrando |
| `PUBLISH_ALERT_FROM` | Remitente de los avisos | Opcional; default `onboarding@resend.dev`, que solo entrega al correo de la cuenta de Resend |
| `EXPO_ACCESS_TOKEN` | Un access token de la cuenta de Expo, para mandar los avisos al teléfono por el servicio de push de Expo cuando el proyecto tiene encendida la «seguridad extra de push» (ver «Avisos al teléfono») | No — sin la seguridad extra Expo no pide llave; con ella encendida y sin esta variable, Expo rechaza cada aviso y solo llega el correo |
| `SUGERENCIAS_GITHUB_TOKEN` | Abre un issue en GitHub por cada mensaje del libro de sugerencias, y comenta en él la respuesta del equipo (ver «El libro de sugerencias»). Un token *fine-grained* con acceso solo al repositorio de `SUGERENCIAS_REPO` y un único permiso: Issues, lectura y escritura | No — sin ella los mensajes se guardan igual y salen solos con el cron diario el primer día que la tenga |
| `SUGERENCIAS_REPO` | El repositorio, con la forma `dueño/repo`, donde caen esos issues | No — por defecto `Ribs-org/tu-parrilla`. Si no tiene esa forma, no se manda nada y los mensajes esperan guardados |

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

Cada corrida hace seis cosas, en orden: publica lo vencido, vigila las conexiones de las
cuentas (manda el correo de las que se cayeron, y el aviso al teléfono de las que se enfrían o se
apagan; ver «Avisos por correo» y «Avisos al teléfono»), mira La Cocina —cierra
con su opción por defecto las preguntas del chef cuyo plazo pasó, y le avisa al admin de las
comandas que llevan media hora sin tomar o pasaron su hora estimada (ver «La Cocina»)—, sondea
comentarios (hasta los 120 segundos de la corrida), le manda al teléfono el resumen de los
comentarios nuevos de La Mesa (uno por hora como mucho) y, una vez por hora, barre los archivos huérfanos de
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
intento anterior —en el editor del post y en la cola; en el calendario, la fila del corte marca
esa red con ↻ y dice «Reintentando» con el motivo al pasar el mouse—, y el correo de aviso llega
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

Tampoco es un fallo que Meta diga que el contenedor no está listo para publicarse (subcódigo
2207027, «Espera un momento»): le pasa a veces hasta a una foto, que suele estar lista al tiro.
El destino queda saliendo con su contenedor, y la corrida siguiente pregunta su estado y lo
publica cuando termine (`esMediaNoLista`, en `social/publish/instagram.ts`).

### Los números cada hora

`/api/cron/numeros-recientes` relee lo publicado en las últimas 48 horas en Instagram, Facebook
y TikTok (ver «Y cada hora, lo de las últimas 48 horas», en «Conectar y sincronizar»). Como la
publicación, la llama **el pinger externo, cada hora**, con el mismo header `Authorization:
Bearer <CRON_SECRET>`: el plan Hobby de Vercel no deja más crons que los dos diarios de
`vercel.json`. Está dado de alta en cron-job.org desde el 2026-11-11 (la tarea «Parrilla números
cada hora»), a los 30 minutos de cada hora: así no
cae encima de la sincronización diaria de las 9:00 UTC, que escribe las mismas filas. Sin esa
entrada la ruta existe y no la llama nadie: los números siguen llegando una vez al día, sin
ningún error a la vista.

Las redes van en paralelo y las cuentas de una red en serie, las de los planes con prioridad
primero. Ninguna cuenta empieza pasados los 200 segundos de la corrida (`maxDuration` es 240):
lo que no alcanzó dice `saltada` en el informe y queda para la hora siguiente. Una cuenta que
falla deja su error en el informe y en el log (`[reciente] …`) y las demás siguen; la ruta
contesta 200 igual, y 500 solo si se rompió la corrida entera.

Después de leer, la misma corrida busca los hitos nuevos de «Lo que trajo» (`detectarHitos`, abajo)
y la respuesta queda `{"informe": […], "hitos": {"nuevos": n}}`; la sincronización diaria hace lo
mismo apenas termina, y lo devuelve como `hitos` junto a su `report`. Si la detección falla, `hitos`
trae `{"error": …}`, el detalle va al log y la lectura igual quedó escrita.

### Lo que trajo, en el teléfono

Arriba de La Parrilla de la app, debajo de La Mesa, una fila con una burbuja por cada corte que
salió en los últimos siete días; la de un corte con algo nuevo lleva el anillo en brasa y un
circulito con cuánto («+37»). Lo nuevo es lo que llegó desde que el dueño miró el corte —abrir su
detalle— (`src/lib/lo-que-trajo.ts`), sumado en sus redes:

- los «me gusta» y comentarios: la última lectura de cada publicación (`post_metrics`) menos lo
  que tenía al mirarlo, sin bajar de cero. **Sin YouTube**: es una resta, y sus políticas no la
  dejan (`politica-youtube.ts`);
- los comentarios de YouTube que entraron a La Mesa después de mirarlo: filas guardadas, no una
  resta;
- las visitas a sus páginas con la etiqueta `?s=` de cualquiera de sus publicaciones, sin bots y
  solo a páginas del dueño, la regla de Los Números.

Mirarlo deja la marca en `cortes_vistos` —la hora y los dos contadores de ese momento—, una fila
por corte y del servidor, así que dos teléfonos de la misma cuenta ven lo mismo. Un corte que nunca
se miró cuenta todo desde que salió. Un corte entra a la fila si salió en al menos una red (un
borrador en la bandeja de TikTok todavía no salió), con la hora de La Parrilla; lo publicado fuera
de Tu Parrilla no tiene burbuja. Los números se mueven con la lectura de cada hora (arriba).

El número del ícono de la app y de la pestaña La Parrilla es **cuántos cortes de la fila tienen
algo nuevo, más cuántos comentarios esperan respuesta en La Mesa**. La app lo pone cada vez que
lee la fila; en el ícono, solo desde la 1.2.0 y en los lanzadores que muestran números (ver
`mobile/README.md`, «Lo que trajo»).

| Ruta | Qué hace |
|---|---|
**Los hitos** (`src/lib/hitos.ts`): cuando las vistas de un corte —la última lectura de cada
publicación, sumada en sus redes **sin YouTube**, que no deja sumar sus números con los de otra
red— pasan 100, 1.000, 10.000, 100.000 o 1.000.000, el corte gana ese hito, una fila de `hitos` por
corte y umbral. Los busca `detectarHitos` después de cada lectura de los números, la de cada hora y
la del día (ver «Los números cada hora» y el cron de sincronización), para todos los dueños a la
vez; si falla, la lectura ya quedó escrita y la corrida siguiente encuentra lo que faltó. La app
celebra cada hito una vez —el más alto de cada corte, hasta tres por vuelta— y avisa que lo hizo;
eso deja celebrados también los más bajos del mismo corte. **Al estrenarse** (migración 0041) los
cortes que ya habían pasado un umbral lo ganaron sin fecha y ya celebrados (`alcanzado_en` nulo):
solo se celebra lo que se alcanza desde ese día.

**La racha** (`src/lib/racha.ts`): cuántos días seguidos salió al menos un corte, en la zona del
dueño, por la hora del corte, como el pie de ayer de La Parrilla. Es lo que Tu Parrilla publicó, así
que YouTube cuenta como las demás; un borrador en la bandeja de TikTok no. Si hoy todavía no salió
nada cuenta hasta ayer: se apaga a medianoche. La app la muestra desde dos días.

| Ruta | Qué hace |
|---|---|
| `GET /api/mobile/lo-que-trajo` | La fila: cada corte como lo dibuja La Parrilla (`src/lib/cortes-movil.ts`) con `nuevo` (`meGusta`, `comentarios` y `visitas`) y `hito` (el umbral más alto que pasó, o null), del más nuevo al más viejo; `numero`, el del ícono; `racha` (`dias` y `hoy`, si ya salió algo hoy); `porCelebrar`, los hitos que la app celebra al abrir, de cualquier fecha, con su corte, y `hoy`, el día del dueño. |
| `GET /api/mobile/cortes/{id}` | El detalle: el corte, lo nuevo, `vistoEn` (null si nunca se miró), lo que lleva cada red tal como la red lo da —con los seguidores donde los da: las fotos y carruseles de Instagram, TikTok for Business y los suscriptores de YouTube Analytics—, todas sus visitas y sus `hitos` de menor a mayor, con `alcanzadoEn` (null en los de antes del estreno). No deja la marca. |
| `POST /api/mobile/cortes/{id}/visto` | Deja la marca y devuelve `{ numero }`, el del ícono que queda. La app la llama después de mostrar el detalle. |
| `POST /api/mobile/hitos/{id}/celebrado` | La app mostró la celebración: queda celebrado, con los más bajos del mismo corte. Devuelve `{ celebrado: true }`. |

Un corte que no existe, es de otro o no salió contesta `404` con «Ese corte no está, o todavía no
salió en ninguna red.», sin distinguir; un hito, con «Ese hito no está.». Lo que viene después —el
aviso de lo bueno— está en el diseño (`docs/superpowers/specs/2026-11-10-lo-que-trajo-design.md`).

### Avisos por correo

Seis correos, todos con el remitente `PUBLISH_ALERT_FROM` y al correo del dueño (o a
`PUBLISH_ALERT_TO` si lo que avisa no tiene dueño con correo), salvo la alarma de La Cocina, que va
al admin. Las reglas viven en
`src/lib/avisos/reglas.ts`, sin base; lo que lee y manda, en `src/lib/avisos/run.ts`. Todos menos el
resumen del día y la alarma salen también al teléfono de quien encendió los avisos en la app (ver
«Avisos al teléfono»).

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
- **Una comanda de La Cocina que entregó o terminó**: «Salió la primera tanda: «<archivo>»»,
  «Lista en el mesón: …», «No se puede cocinar: …» o «No se pudo terminar: …» (de día, con las
  palabras del día), con lo que hay en el mesón y el `mensaje` del chef, o su `motivo`. Sale una vez
  por cambio: la primera vez que la comanda pasa a sirviendo, y cuando el chef la deja lista, la
  rechaza o la da por fallida. El chef puede mandar el asunto (`asunto`, en
  `docs/cocina-api.md`). El dueño los apaga en Tu Cuenta, «Los correos de La Cocina» (una fila
  `cocina_correos` en `ajustes`); apagados, el aviso al teléfono y el correo de una pregunta siguen
  (ver «La Cocina»).
- **Una pregunta del chef**: «El chef te pregunta: «<archivo>»», con la pregunta, sus opciones,
  el plazo en la zona del dueño y lo que hace el chef si nadie contesta. Una por pregunta.
- **La alarma de La Cocina, al admin** (`ADMIN_EMAIL`, o `PUBLISH_ALERT_TO` si falta): «La Cocina:
  una comanda sin tomar y …», con las comandas que llevan más de media hora en «Comanda colgada» o
  pasaron su hora estimada hace más de una hora. Va todo junto en un correo por pasada, y cada
  comanda suena una vez por motivo (ver «La Cocina»).

### Avisos al teléfono

Desde la versión 1.2.0 de la app, los avisos también llegan al teléfono, al lado del correo y nunca en
su lugar: cada uno sale por correo igual que antes —salvo los de La Cocina de quien los apagó—, y si
el teléfono falla, el correo no se entera.
Salen por el servicio de push de Expo (`https://exp.host/--/api/v2/push/send`), que los entrega por
Firebase Cloud Messaging en Android y por el servicio de Apple en iPhone. El código, en
`src/lib/push/`: el cliente de Expo y los textos sin base (`expo.ts`, `avisos.ts`), y lo que lee y
borra (`enviar.ts`, `comentarios.ts`).

- **Una publicación que se quemó**: «Se quemó: <Red>» (de día, «Se echó a perder»), con el comienzo
  del texto y el motivo. Uno por destino, cuando sale el correo.
- **Una cuenta que se enfría o se apaga**: «<Red> · <cuenta> se enfría» cuando su permiso vence en la
  semana, y «Se apagó <Red> · <cuenta>» cuando su fierro queda frío (de día, el cuchillo se desafila
  o queda sin filo). Uno por cada estado nuevo del fierro: `social_accounts.push_fierro` guarda el que
  ya se avisó y se borra cuando vuelve al rojo. Va aparte de `caida_avisada_en`, para no cambiar
  cuándo se reintenta el correo. El enfriarse no tiene correo propio: está en el resumen del día.
- **Una pregunta del chef** y **una comanda que entregó o terminó** —la primera tanda, lista en el
  mesón, rechazada o fallida—: los mismos de su correo, en una línea, con el título de siempre aunque
  el chef haya mandado otro asunto. Salen aunque el dueño haya apagado los correos de La Cocina.
- **La respuesta del equipo** en el libro de sugerencias, la primera vez, como el correo.
- **Los comentarios nuevos de La Mesa**: un resumen, no uno por comentario. «3 comentarios nuevos en
  La Mesa», con las redes, sin el texto de nadie. Sale en la pasada del cron siguiente a que entre un
  comentario pendiente, y después como mucho uno por hora; cuenta los que entraron desde el resumen
  anterior y siguen esperando respuesta, sin lo que respondió una palabra clave. La marca es
  `users.push_comentarios_hasta`. Este no tiene correo.

Cada teléfono registra su token de Expo en `push_tokens` (`POST /api/mobile/push`), una fila por
instalación, del dueño de la sesión. El token es único: si en el mismo teléfono entra otra cuenta, la
fila pasa a ella. Se borra al apagar los avisos en Ajustes o al cerrar sesión (`DELETE
/api/mobile/push/{token}`, solo el del dueño), cuando Expo dice que el teléfono ya no lo usa
(`DeviceNotRegistered`), y cuando la sesión con que se registró deja de valer: cada fila guarda
`MOBILE_TOKEN_VERSION` y la versión de sesión de la cuenta (`push_tokens.sesion`), y subir cualquiera
de las dos —un teléfono perdido— corta también sus avisos. Los mensajes van de a 100 por pedido, el
tope de Expo, y un 429 o un 5xx se reintenta una vez. Expo no pide llave salvo que la cuenta tenga
encendida la seguridad extra de push; entonces hace falta `EXPO_ACCESS_TOKEN`.

Lo que no hace todavía: leer los recibos de Expo, que son los que dicen si el aviso de verdad salió
(ver `docs/deuda-tecnica.md`). Para que lleguen en Android, el build de la app necesita las
credenciales de FCM: `google-services.json` en `mobile/` y la clave de la cuenta de servicio subida a
EAS (los pasos, en `docs/pendientes.md`). En la app, el lado del teléfono está en `mobile/README.md`,
«Los avisos al teléfono».

### El libro de sugerencias

El canal para que quien usa la app le escriba al equipo que la hace: una idea («quiero X
cuando apriete Y»), algo que no funciona u otra cosa. De noche es el libro de sugerencias y
reclamos de un restorán chileno; de día, la caja de sugerencias de un local japonés. Está al
final del menú de Ajustes del panel, donde abre una ventana, y al final de Ajustes en la app del
teléfono (`POST /api/mobile/sugerencias`). Cada mensaje se vuelve un issue de GitHub en
`SUGERENCIAS_REPO`, con las etiquetas `sugerencia` y la de su tipo (`sugerencia: idea`,
`sugerencia: no funciona`, `sugerencia: otra cosa`), que el cliente crea si el repositorio no
las tiene. Nada promete que se implemente: es para leerlo, y para responderlo.

**La respuesta vive adentro de Tu Parrilla**, no en GitHub. El admin la escribe en Las
Sugerencias (`/admin/sugerencias`, en Ajustes), donde ve lo que escribió cada persona con su
nombre, su correo y el enlace al issue; o, sin el navegador, el equipo de desarrollo la manda con
una llave del admin, `POST /api/sugerencias/respuesta` con `{ "issue": <número>, "respuesta": "…" }`
(o `"id"`, el de la sugerencia; ver la sección 3e de `public/docs/api-editor.md`). Hay una por
sugerencia, en la misma fila (`respuesta`, `respondida_en`, `respondida_por`,
`respuesta_leida_en`), y cambiarla la reemplaza. La persona la lee en el libro, en «Lo que nos
escribiste»; mientras no la abre, el botón de Ajustes del panel lleva un punto de brasa y la
entrada del libro dice cuántas son nuevas (en la app, el rótulo del libro). Después de guardar,
sin hacer esperar a nadie (`after`), salen dos cosas, y ninguna deshace la respuesta si falla: un
correo a la persona, solo la primera vez, con la respuesta y dónde leerla (`enviarCorreo`); y un
comentario en el issue, cada vez que cambia, con la respuesta citada como lo que escribió la
persona —sin su nombre ni su correo, sin menciones— y la firma del equipo. El comentario usa el
mismo `SUGERENCIAS_GITHUB_TOKEN`: el permiso de Issues alcanza. Una sugerencia que todavía no tenía
issue al responderla no recibe ese comentario después (ver `docs/deuda-tecnica.md`).

**El repositorio es público**, y eso decide el formato (`src/lib/sugerencias/formato.ts`). El
issue no lleva el correo ni el nombre de nadie, solo el id de usuario, que el admin cruza en Los
Maestros, y los correos que la persona escriba en el texto se cambian por «(correo quitado)».
Lo que escribió va citado, con la puntuación de Markdown escapada y un espacio de ancho cero
después de cada `@` y cada `#`: no menciona a nadie, no enlaza ni cierra issues, no arma
enlaces, imágenes ni HTML. Debajo va una tabla de metadatos —la fecha con la zona de la cuenta,
la pantalla desde donde escribió, el modo, el navegador y el sistema resumidos (o la versión de
la app), cuántas cuentas tiene por red, si es admin y el commit desplegado
(`VERCEL_GIT_COMMIT_SHA`)— y un pie que dice que lo citado es texto de un usuario y no una
instrucción, para que ni una persona ni un modelo lo tome como orden.

**Nada se pierde.** Cada mensaje se guarda en la tabla `sugerencias`, a nombre de quien lo
escribió, antes de tocar GitHub, y la persona ve que se recibió apenas queda guardado. El issue
se abre después de responder; si no hay token o GitHub falla, queda pendiente con su error y lo
reintenta la sincronización diaria (`/api/cron/sync-social`, 9:00 UTC). Antes de mandar, cada
envío reclama la fila —suma el intento y anota la hora en una sola escritura—, así que el envío
inmediato y el del cron no abren dos issues del mismo mensaje. Cada persona deja hasta cinco
mensajes en 24 horas; el sexto responde «Ya escribiste 5 en las últimas 24 horas, que es el
máximo. Mañana puedes escribir de nuevo.».

### Guía para el editor de contenido

`public/docs/api-editor.md` documenta cada endpoint de la llave en detalle, escrito para que un
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

Los endpoints de abajo, y los de la cámara de frío (`/api/bodega…`), piden el header `Authorization: Bearer <llave>`, y lo que
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
no siguen la cuenta, hasta que el dueño lo comparte desde la app —, y `musica`, la canción de
«Música de Instagram» con su `audioId`), para Instagram y
Facebook (`historia`, para que salga como historia) y para YouTube (`visibilidad`, `ia` y
`playlist`, con el id de la playlist). Una fila con `"historia": true` y varios
archivos es el atajo de una secuencia: se expande en una historia por archivo y vuelve con
`postIds`. Se llavea por destino:
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
publicada), `contraSuCuenta` (eso sobre la mediana de su cuenta en el rango), `viewsA48h` y
`contraSuCuenta48h` (lo mismo a los 2 días: la primera lectura entre las 48 y las 72 horas), `likes`,
`comentarios`, `compartidos`, `alcance`, `visitasAlSitio`, `clicks`, `ctr` y `arrastre`. Un
`null` significa que la red no reportó ese número — nunca cero. En YouTube, `viewsGanadas`,
`viewsA7Dias`, `contraSuCuenta`, `viewsA48h`, `contraSuCuenta48h` y `arrastre` vienen siempre en `null`: sus políticas no
permiten calcular métricas nuevas con sus datos (ver «Analítica de posts»). `truncado: true` avisa que el tope de filas mordió y la respuesta
es parcial.

Las métricas las trae la sincronización diaria y, para lo publicado en las últimas 48 horas en
Instagram, Facebook y TikTok, la lectura de cada hora: lo publicado hoy en esas redes aparece con
números dentro de la hora siguiente; en YouTube, recién al día siguiente.

`GET /api/metrics/mejores`, con los mismos parámetros más `metrica` (`viewsGanadas` por
defecto, `contraSuCuenta`, `viewsA7Dias`, `contraSuCuenta48h`, `viewsA48h`, `visitas`,
`clicks`, `interacciones` o `arrastre`), `percentil` (entero de 1 a 50, 10 por defecto), `lado` (`mejor` por defecto, o
`peor`) y `recientes` (`si` por defecto, o `no` para dejar fuera lo de menos de 7 días),
devuelve el mejor (o el peor) X % de lo publicado en el rango: el corte para entrar, cuántas
compiten, las del grupo con sus métricas, las medianas del grupo contra las del resto y lo
que se repite más en el grupo. Lee hasta 10.000 publicaciones, como la pantalla, porque
responde solo el grupo. Las mismas reglas que la pantalla «Tu mejor 10 %», salvo lo que esta
cambió por defecto (la métrica y las recientes), que en la API sigue como antes para no
moverle la respuesta a quien ya la usa; la lógica, sin base, está en `src/lib/mejores.ts`.

`GET /api/metrics/que-funciona`, con los mismos `desde`, `hasta`, `red` y `cuenta`, responde lo
del panel «Qué te funciona»: para `tema`, `estilo` y `formato`, un `estado` (`gana`, `parejo`,
`faltan` o `sinValor`), la `frase` que muestra el tablero, los dos mejores con muestra
suficiente y cada valor con sus `publicaciones`, sus `medidas` y la mediana de
`contraSuCuenta`. Trae además `musica`: con música contra sin música, un grupo por red y
formato donde algo la llevó, con la misma forma. La música es la clave `musica` de las
`opciones` guardadas del destino —hoy, «Música de TikTok» en las fotos—, así que lo subido
directo en la red no tiene cómo saberse y no entra (`sinSaber` lo cuenta); las fotos de TikTok
se reconocen por el post, porque TikTok da todo como video (`publicadosDesdeTuParrilla`, en
`src/lib/post-attributes.ts`). Lee hasta 10.000 publicaciones; la lógica, sin base, está en
`src/lib/que-funciona.ts`.

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

## Los planes

Dos planes, el gratis y el pagado («Maestro Parrillero»), con las mismas funciones: lo que cambia son los
topes, el espacio, los tokens de IA y quién pasa primero en las colas. El diseño, con el porqué de
cada número, está en `docs/superpowers/specs/2026-11-08-planes-design.md`. Cada plan es una fila de
`planes` que el admin edita en Los Maestros («Los planes»); las dos nacen en la migración
`0035_planes.sql`:

| | Gratis | Maestro Parrillero |
|---|---|---|
| Precio al mes | $0 | $34.990, IVA incluido |
| Cuentas conectadas | 7 | 15 |
| Publicaciones esperando a la vez | 50 | sin tope |
| Cámara de frío | 20 GB | 200 GB |
| Tokens de IA al mes | 100.000 | 2.000.000 |
| Prioridad en las colas | 0 | 1 |

**Toda persona nace en el gratis.** El pagado lo da el admin como cortesía —hasta un día o sin
fecha— con «Plan» en la fila de cada persona en Los Maestros, o lo paga la persona con Mercado Pago
desde «Tu plan» (abajo, cerrado por ahora). El plan de alguien es `users.plan`, que rige mientras
`users.plan_hasta` no pase: después rige el gratis sin que nadie lo escriba (`claveQueRige`, en
`src/lib/planes/plan.ts`).

**Los topes se miran al escribir, nunca al leer.** Bajar de plan no desconecta ni borra nada: lo que
ya está sigue y lo programado sale, pero no se puede conectar otra cuenta ni programar más hasta
quedar bajo el tope. Las cuentas se cuentan al conectar (`guardarCuenta`): solo las que tienen
credencial, y renovar una que ya estaba conectada no suma. Las publicaciones esperando se cuentan
al programar desde el panel, el teléfono o la API (`crearVariosProgramados` y el lote) y al
reprogramar un destino quemado: una publicación es un corte con algún destino por salir, vaya a una
red o a cuatro. Los dos corren en la transacción que escribe, con la fila del dueño trabada, para
que dos pestañas a la vez no se pasen del tope entre las dos (`src/lib/planes/topes.ts`).

**Los tokens** son los de los borradores de La Mesa y de «Sugiéreme una»: antes de cada llamada se
mira si al dueño le quedan, y después se suma lo que la pasarela dice que gastó (`usage.totalTokens`)
en `uso_ia`, por mes en la zona del dueño (`conTokens`, en `src/lib/planes/tokens.ts`). Sin tokens,
el borrador queda con «Se acabaron los tokens de IA de tu plan este mes.» y se responde a mano, y
«Sugiéreme una» elige sin el modelo.

**La prioridad** ordena las cinco colas que recorren a todos: la fila del chef de La Cocina
(`ordenarFila`: las pruebas primero, después la ronda de los de mayor prioridad, después la de los
demás), la publicación, el sondeo de comentarios con sus borradores, la sincronización diaria y
la lectura de cada hora.
Dentro de una misma prioridad, el orden de siempre (`prioridadDelDueno`, en
`src/lib/planes/prioridad.ts`).

**El cobro, con Mercado Pago, está escrito y cerrado**: «Pasar a Maestro Parrillero» solo aparece para quien
diga `PAGOS_ABIERTO_PARA`, y solo con `MERCADOPAGO_ACCESS_TOKEN` puesta. Se abre a todos cuando
`/terminos` y `/privacidad` lo cuenten (`docs/pendientes.md`). Es una suscripción mensual sin plan
asociado por persona (`src/lib/pagos/`):

1. «Pasar a Maestro Parrillero» pide el correo de la cuenta de Mercado Pago con que se va a pagar —Mercado Pago lo
   compara al autorizar—, crea una fila de `suscripciones` y la suscripción en Mercado Pago
   (`POST /preapproval`, con el id de la fila como `external_reference`, el precio del plan en CLP y,
   si la persona nunca los usó, los días de prueba), y manda a la persona a su `init_point`. Tu
   Parrilla nunca ve una tarjeta. Un enlace de menos de un día se reusa.
2. La vuelta es Tu Cuenta con `?plan=vuelta`, que relee la suscripción sin esperar al webhook.
3. El webhook (`/api/pagos/mercadopago`) verifica la firma (`x-signature`: HMAC-SHA256 de
   `id:<data.id>;request-id:<x-request-id>;ts:<ts>;`, y no más vieja que 15 minutos) y vuelve a leer
   en Mercado Pago la suscripción o el cobro del aviso: del cuerpo solo se cree el id. Un id que
   Mercado Pago no conoce —el de «Simular notificación», en su panel— se contesta `200` y no se mira.
4. Autorizada, la persona tiene el pagado hasta el próximo cobro más cinco días de gracia
   (`GRACIA_DIAS`, una suposición: la documentación de Mercado Pago no se deja leer desde un servidor
   y no se pudo confirmar cuántos días reintenta un cobro rechazado). Cada cobro aprobado se anota en
   `cobros` y corre la fecha; uno rechazado no, y si en la gracia no entra, el plan cae solo al
   gratis. Nunca acorta lo que ya tenía: una cortesía sin fecha se queda.
5. «Cancelar la suscripción» la cancela en Mercado Pago; el pagado sigue hasta el fin de lo pagado (o
   de la prueba), y después, el gratis.
6. Cada día, la sincronización relee las suscripciones vivas y las que esperan desde hace menos de
   una semana (`releerSuscripciones`).

En Mercado Pago, la aplicación lleva el webhook `https://tu-parrilla.cl/api/pagos/mercadopago` con
el evento «Planes y suscripciones». Ponerlo en marcha, con los usuarios de prueba y cada clic, está
en `docs/mercadopago-paso-a-paso.md`. Los nombres de los campos y la firma salen del SDK oficial de
Node (`mercadopago` 3.6.1), no de su documentación. Al borrar a una persona, sus suscripciones y
cobros se quedan sin dueño, para la contabilidad. La app del teléfono no cobra ni enlaza al cobro: lo
que se vende dentro de una app de Android tiene que ir por Google Play Billing.

## La Cocina

La Cocina es la fábrica de creativos de cada usuario dentro de Tu Parrilla:

1. el usuario guarda su material en bruto en la cámara de frío y pide una comanda eligiendo de ahí;
2. el chef la cocina: es el pipeline de edición de `marca-personal`, que corre en un servidor
   propio;
3. el chef devuelve los creativos al mesón del usuario, listos para programar.

El diseño, con sus fases, está en `docs/superpowers/specs/2026-10-22-la-cocina-design.md`.

La cámara de frío, con su modelo y su cuota, está en
`docs/superpowers/specs/2026-11-02-la-bodega-design.md`.

**Hoy existen cuatro piezas:**

- la base: las tablas y la API por la que habla el chef;
- la subida por partes, por la que el panel le lleva el material;
- la cámara de frío (la bodega), donde ese material espera;
- La Cocina en la app del teléfono (desde la 1.2.0, el 2026-11-02): grabar con la cámara del
  teléfono y mandárselo al chef.

**Lo que ve el usuario:**

- la pestaña La Cocina (`/admin/ia`), que reemplazó a Tu IA el 2026-10-22: arriba «El chef de la
  casa» y abajo «Tu propio chef», con las llaves de siempre;
- cómo atiende la cocina, según el latido del chef (`src/lib/cocina/latido.ts`): **sola** si algún
  trabajador latió en los últimos diez minutos con `datos.automatico: true` —«La cocina está
  abierta: el chef toma las comandas apenas llegan.», con cuánto tarda una si lo contó—; **a mano**
  si late pero nadie toma solo —«La cocina atiende a mano: una persona toma las comandas, así que la
  tuya puede tardar hasta el próximo día hábil.», y sin hora estimada para lo que espera—; y
  **cerrada** si nadie latió. Nació el 2026-11-06: una comanda de un cliente esperó cuatro días
  mientras el temporizador del latido hacía decir «abierta» al panel;
- sus comandas, cada una con su estación —un dibujo que se mueve según en qué va: la comanda
  que se mece en el riel, la lupa, el cuchillo, la parrilla con fuego y humo, la tanda que viaja a
  la tabla; de día, la barra de sushi con el soplete—, su estado, el recorrido en cinco tramos,
  cuántas van antes, la hora estimada, su instrucción al chef y lo que pasó. Con
  `prefers-reduced-motion`, cada estación queda quieta en un cuadro que dice lo mismo
  (`src/components/estacion-comanda.tsx`);
- **las tarjetas se actualizan solas** mientras alguna comanda está en marcha (de colgada a
  sirviendo): con la pestaña a la vista, el panel pregunta cada 4 a 15 segundos a
  `/api/admin/cocina/pulso`, que devuelve una firma de lo que la tarjeta muestra en cuatro
  consultas chicas, y solo si cambió vuelve a pedir la página (`router.refresh`, sin recargarla).
  Con la pestaña oculta o sin nada en marcha, no pregunta (`ia/vigia.tsx`);
- **la entrega** (desde el 2026-11-08): la primera vez que el dueño ve una comanda que pasó a
  sirviendo (la primera tanda) o a lista, el plato sale de la cocina —la estación entra desde el
  pase, se levanta la campana (de día, se abre la cortina) y la tarjeta se enciende en brasa—, en
  La Cocina o en el mesón si llega por el correo. Una vez por entrega: lo que vio se anota en
  `comandas.entrega_vista` y no en el navegador, para que no se repita en otro equipo
  (`ia/entrega-del-plato.tsx`). Con `prefers-reduced-motion`, queda el borde y la frase, sin
  movimiento;
- **las preguntas del chef** (desde el 2026-11-06): cuando el chef tiene una duda, la comanda pasa
  a «El chef te pregunta», la tarjeta se pone de color con la pregunta, sus opciones (o un campo
  libre) y el plazo con lo que hace si nadie contesta, y llega un correo. Contestar —en el panel o
  en el teléfono— la devuelve a donde estaba; si pasa el plazo, el chef sigue con la opción por
  defecto. Cada pregunta es una fila de `preguntas`, con su dueño; las reglas, en
  `src/lib/cocina/pregunta.ts`, y quién las escribe, en `src/lib/cocina/preguntar.ts`;
- «Cancelar la comanda», mientras no esté en el horno (también mientras el chef pregunta);
- **la cámara de frío** (`/admin/ia/bodega`; de día, la nevera), donde guarda su material en bruto
  sin pedir comanda: videos, audios, imágenes y otros archivos, cada uno con su nombre y un uso
  opcional (intro, outro, música, logo…), que se renombra, se le cambia el uso y se saca. Cada
  material se dibuja según lo que es y lo que pesa, de un corte a la vaca entera
  (`src/components/dibujos-material.tsx`), y la cuota, como el riel de la cámara que se va llenando;
- «Pedir una comanda» (`/admin/ia/pedir`). Ahí elige de la cámara cualquier combinación —dos de cuatro
  videos y cuatro fotos—, que se cuelga en el riel de la comanda: un video es el plato principal y
  los demás dicen qué son. Desde el mismo formulario puede guardar algo nuevo, que entra elegido.
  Dice qué quiere que salga, le escribe al chef su instrucción («Tu instrucción al chef», hasta 1000
  caracteres, con contador e ideas para empezar; el chef la recibe como `instruccion`), guarda su
  marca básica (nombre, @, color de acento y llamado final) y ve la fila y la hora estimada antes de
  colgarla.

**Desde el teléfono**, la pestaña La Cocina de la app hace lo mismo que el panel en la cámara de
frío y en las comandas (desde el 2026-11-06): graba un video (o saca una foto, o elige de la
galería) y lo guarda en la cámara de frío por partes, para la comanda o sin pedir comanda con su
uso; muestra lo que hay adentro con «Cambiar» y «Sacar de la cámara»; pide la comanda con las
opciones de «Pedir una comanda» —qué es el plato principal y cada video, los formatos, cuántos,
para cuándo, la instrucción y la marca, salvo el color de acento, que va el guardado—, y sigue las
comandas con «Lo que pasó», le contesta al chef y las cancela. Desde la 1.2.0 (2026-11-07), también el
mesón: «Ver el mesón» en la tarjeta de una comanda abre lo que entregó el chef, con el video que se
reproduce ahí mismo (`expo-video`), «Programar» y «Descartar» con su motivo. Las rutas, con el token
del teléfono (`src/lib/cocina/telefono-api.ts`):

| Ruta | Qué hace |
|---|---|
| `GET /api/mobile/cocina` | Todo lo que muestra la pestaña: cómo atiende la cocina, la marca, la cámara con su cuota, las últimas 15 comandas con su estado en palabras de noche y de día, «Lo que pasó» y lo que pregunta el chef, las opciones del pedido con los nombres del panel (`opciones`) y el lugar que tendría una nueva en la fila (`nueva`). |
| `/api/mobile/cocina/subidas…` | Las subidas por partes a la cámara, con `src/lib/cocina/subidas-http.ts`, el mismo de las del panel. |
| `POST /api/mobile/cocina/comandas` | Cuelga la comanda: pasa por `leerPedido` y `pedirComanda`, como la del panel (`src/lib/cocina/telefono.ts`). Lo que una app de antes no manda va como el panel lo trae marcado. |
| `POST /api/mobile/cocina/comandas/{id}/cancelar` | «Cancelar la comanda», mientras no esté en el horno. |
| `PATCH` y `DELETE /api/mobile/cocina/materiales/{id}` | «Cambiar» el nombre y el uso, y «Sacar de la cámara». |
| `POST /api/mobile/cocina/preguntas/{id}/respuesta` | Contestarle al chef. |
| `GET /api/mobile/cocina/meson` | El mesón, por comanda y por pieza, como la página del panel (`mesonDelDueno`); con `?comanda=<id>`, solo esa. Cada creativo con su media, su portada, su estilo, sus atributos, el título de YouTube, el texto y, en su última semana, «Se borra el … si no lo programas.»; además cuántos esperan en un borrador y los motivos de un descarte con sus nombres (`src/lib/cocina/meson-telefono.ts`). Pide la cocina encendida, como la página. |
| `POST /api/mobile/cocina/creativos/{id}/programar` | «Programar»: lo pasa a un borrador (`programarCreativo`) y devuelve `{ borradorId }`, que la app abre en Publicar. |
| `POST /api/mobile/cocina/creativos/{id}/descartar` | «Descartar», con `{ motivo, nota }` (`descartarCreativo`, con `leerDescarte`). |

Cancelar, cambiar y sacar no tienen una copia para el teléfono: el panel (`src/app/admin/cocina-actions.ts`)
y estas rutas llaman a las mismas funciones (`src/lib/cocina/del-dueno.ts`), con las mismas reglas y
frases; las que mandan a «recargar la página» se dicen «actualiza La Cocina» en el teléfono. Ninguna
de las tres pide la cocina encendida, como en el panel. El mesón tampoco tiene copia: programar y
descartar llaman a `programarCreativo` y `descartarCreativo` (`src/lib/cocina/meson.ts`), las de
`cocina-actions.ts`. Cómo sube el teléfono un video de varios GB,
y qué hace la app con un servidor de antes o en la 1.1.0, en `mobile/README.md`.

El admin enciende y apaga la cocina de cada cuenta en Los Maestros (`users.cocina_desde`).
Apagarla es despedir al chef: deja de ver esas comandas, aunque siguen ahí.

**Colgar una comanda congela su receta.** La marca y lo que se pidió se guardan en la comanda,
así que lo que está en el horno no cambia aunque el dueño cambie su marca después. La marca queda
además en `marcas`, para la siguiente. La `ref` que pone el formulario al abrirse hace que mandarla
dos veces no la duplique, y un material solo entra si es del dueño y sigue en la cámara.
La comanda guarda una foto de cada uno (`insumos`: su rol, su nombre, su uso y su peso), que nombra
el mismo archivo: el mismo material sirve para varias comandas. En esta
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

  Lo hace el mismo camino para el panel y el teléfono: `crearVariosProgramados` lo lee del creativo
  del borrador, venga el pedido de donde venga. El título es el que tenga el borrador
  (`campos.tituloYoutube`, el del chef o el corregido en el compositor); el teléfono no lo muestra,
  y `POST /api/mobile/schedule` lo toma del borrador.
- **Desde el teléfono** (1.2.0), «Programar» deja el creativo en el mismo borrador y lo abre en
  Publicar, donde faltan las cuentas y la hora; TikTok y la palabra clave siguen siendo del panel.
- **«Descartar»** pide el motivo de un toque (el corte, la letra, el tema o el audio), borra los
  archivos y deja la fila con su motivo, que es memoria para el chef.
- **Una comanda lista queda servida** sola cuando ya no le queda nada por decidir.

**Lo que vence se borra solo** (`barrerCocina`, una vez por hora con el barrido de huérfanos):

- **Lo de la cámara de frío no vence**: sale cuando el dueño lo saca, y no puede sacar lo que una
  comanda en marcha está usando. Lo crudo de antes de la cámara, con archivo propio, se borraba a
  los 14 días de terminada su comanda; la regla sigue para esos (`insumos` sin `material_id`): la
  fila queda con `borrado_en`, y uno que el almacén no dejó borrar se intenta en la pasada
  siguiente. Nunca toca un archivo de la cámara.
- **Lo que nadie programó en el mesón**, a los 30 días: sale como descartado, con el motivo
  `vencido` para que el chef no lo tome como un juicio, y suelta sus archivos. Lo que espera en un
  borrador no vence: ya está en La Parrilla.

Una comanda que se quedó sin nada por decidir queda servida. En su última semana, la tarjeta del
mesón dice cuándo se borra, y el resumen del día lo avisa.

**El chef pregunta; Tu Parrilla nunca lo llama.** El servidor del chef no expone puertos:

- toma las comandas que esperan;
- baja sus insumos con un enlace firmado que vence en una hora;
- informa cada estado;
- le pregunta al dueño lo que no sabe, con un plazo y una opción por defecto, y lee la respuesta
  en su vuelta siguiente;
- entrega cada creativo apenas sale, por tanda.

**Las preguntas vencidas se cierran solas** (`vencerPreguntas`): en cada pasada del cron de
publicación y cada vez que el chef lee sus comandas o sus respuestas. Una comanda nunca queda
esperando al dueño para siempre.

**La red de seguridad** (`src/lib/cocina/alarma.ts`, en cada pasada del cron de publicación): si una
comanda lleva más de 30 minutos en `recibida`, o pasó su hora estimada hace más de una hora sin que
el chef dé otra, el admin recibe un correo con el cliente, la comanda, lo que pidió y cuánto lleva.
No es el proceso: es lo que avisa si el proceso se cayó. Suena una vez por comanda y por motivo
—`comandas.alarma_recibida_en` y `comandas.alarma_eta` guardan lo que ya sonó—, y otra vez si el
chef da una hora nueva y también pasa. Si el correo no sale, la marca se suelta y lo intenta la
pasada siguiente. Sin `ADMIN_EMAIL` (ni `PUBLISH_ALERT_TO`) o sin `RESEND_API_KEY`, no marca nada.

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

**El dueño recibe un correo cuando el chef le pregunta algo**, uno por pregunta: lo pide solo la
llamada que la hizo, no un reintento. Y **cuando el chef le entrega o la comanda termina**: la
primera tanda y lista (con cuántos cortes hay en el mesón, el `mensaje` del chef y el enlace a
`/admin/ia/meson?comanda=<id>`), rechazada o fallida (con el motivo del chef). La primera tanda es
el paso que entra a sirviendo; las tandas que siguen no avisan. Si el chef manda `asunto` con el
cambio, reemplaza al de siempre (saneado en una línea, hasta 120 caracteres; `asuntoDe`, en
`src/lib/cocina/api.ts`). Sale con el remitente de los avisos, `PUBLISH_ALERT_FROM`, en el modo de
la cuenta, y después de responderle al chef (`after`), con el mensaje y las tandas de ese cambio y no
los de la tanda siguiente. Uno por cambio: la misma condición sobre el estado decide qué petición
escribió la transición, y solo esa lo pide (`aviso`, en `cambiarEstado`); un reintento o dos
peticiones iguales a la vez reciben `409` y no mandan nada. Servida no avisa: llega siempre después
de lista, y la hace el dueño. El dueño los apaga en Tu Cuenta (`cocina_correos` en `ajustes`; sin
fila, salen), y entonces no sale el correo pero sí el aviso al teléfono; el de la pregunta no se
apaga, porque tiene plazo. Desde el 2026-11-08, sin aprobación de por medio: el chef escribe y
entrega solo, y el aviso sale cuando él cambia el estado (#283 se cerró así). Si Resend falla, ese
correo no se reintenta (`docs/deuda-tecnica.md`). El texto está en
`src/lib/cocina/correo-de-comanda.ts`.

**Un creativo llega al mesón solo con sus archivos arriba.** Pasa por tres pasos:

1. se anuncia, y a cada archivo le toca su lugar en la carpeta del dueño
   (`scheduled/<dueño>/cocina/<comanda>/`), para que programarlo no lo vuelva a bajar;
2. se sube con PUTs firmados;
3. se cierra: Tu Parrilla mira que cada archivo esté en el almacén y pese lo anunciado.

La `ref` de cada creativo lo hace repetible: un reintento del chef nunca lo duplica.

**El material sube por partes, directo al almacén.** Un largo crudo pesa de 2 a 20 GB, y un solo
PUT llega hasta 5, así que el navegador lo corta en partes de 64 MB y sube tres a la vez, cada una
con su enlace firmado. Ninguna parte cruza una función de Vercel. Va por cuatro pasos:

1. `/api/admin/cocina/subidas` abre la subida (desde el teléfono, `/api/mobile/cocina/subidas`,
   y desde la IA del dueño, con su llave, `/api/bodega/subidas`; las tres responden lo mismo:
   `src/lib/cocina/subidas-http.ts`);
2. `…/partes` firma los enlaces de a pocos, justo antes de usarlos;
3. el navegador sube las partes;
4. `…/cerrar` junta las partes. Ahí nace el material, en la cámara de frío.

Las partes que llegaron se le preguntan al almacén (`ListParts`), no al navegador. Por eso:

- el CORS del bucket no tiene que dejar leer la cabecera `ETag`;
- una parte que llegó con otro peso se vuelve a subir;
- si la subida se corta, elegir el mismo archivo otra vez la retoma donde quedó, porque el
  navegador recuerda qué subida era.

El servidor está en `src/lib/cocina/subidas.ts`, y el navegador en `src/lib/subida-por-partes.ts`.
El teléfono sube de a una parte, copiando cada tramo del archivo a un temporal que sube el propio
sistema (`mobile/src/lib/subir-por-partes.ts` y `archivo-local.ts`).

**Lo crudo vive fuera de `scheduled/`.** Va en `cocina/<dueño>/bodega/` (lo de antes de la cámara,
en `…/insumos/`), con un uuid en la clave, y su URL nunca sale al navegador: el chef lo baja con un
enlace firmado que vence en una hora.

**La cuota de la cámara.** La de su plan: 20 GB en el gratis y 200 GB en el pagado (ver «Los
planes»); el que tenga otra puesta a mano la lleva en `users.bodega_bytes`, que el admin cambia en Los
Maestros y que gana sobre la del plan (`cuotaDeLaCamara`). Se mira en el servidor al
abrir cada subida, antes de firmar nada, contando lo guardado **y lo que está subiendo**, con la
fila del usuario bloqueada para que dos subidas a la vez no pasen las dos. «¿Necesitas más
espacio?» abre el libro de sugerencias: pagar el plan desde el panel todavía no existe. Pesa: 20 GB por usuario
pasa los 10 GB gratis de R2 para todo el bucket, y cada GB de más cuesta unos US$0,015 al mes
(diez usuarios llenos, unos US$3). Si el material se queda en R2 o va al Drive del dueño está en
`docs/pendientes.md`.

**Lo que queda a medias se barre** una vez por hora, con el barrido de huérfanos (`barrerSubidas`):

- una subida abierta hace más de 24 horas se aborta, y el almacén borra sus partes y libera su
  lugar en la cuota. Lo que está en la cámara no se toca.

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
    estacion-comanda.tsx   la estación de cada comanda en su tarjeta: un dibujo que se mueve según en qué va, la parrilla de noche y la barra de sushi de día
    dibujos-insumo.tsx     las piezas crudas de La Cocina, sin su lienzo: la media res, el atún, el salmón, las verduras, el arroz, la tabla
    dibujos-material.tsx   lo que hay en la cámara de frío, por lo que es y lo que pesa (de un corte a la vaca entera; de día, de un trozo al atún gigante), y la cuota como el riel que se llena
    boton-tema.tsx         el botón de la barra que cambia entre la noche y el día
    de-noche-y-de-dia.tsx  lo que se dice distinto de día, en sus dos versiones (el modo esconde una), y el nombre de cada pantalla
    tema-vivo.ts           el modo que se ve ahora, para lo que el CSS no alcanza: un aria-label, un title, el texto de una pregunta
    ventana.tsx            la ventana del panel: un <dialog> modal con el velo, que comparten las preguntas, los selectores y «Reprogramar»
    confirmar.tsx          las preguntas del panel, en vez del confirm() del navegador: useConfirmar() y la ventana del layout
    libro-de-sugerencias.tsx  la ventana del libro de sugerencias (de día, la caja), con su dibujo y la hoja que entra al recibirse
    revision.ts            un formulario que se revisa solo, con su mensaje en línea y no el globito del navegador
    selector-color.tsx     el color a elección, en vez del type="color": una muestra y el código, en una ventana
    globitos.tsx           los globitos de ayuda de todo el sitio, en vez del title del navegador: data-globito="…"
    selector-fecha.tsx     el campo de fecha y de fecha y hora, con su calendario: manda el mismo texto que el campo del navegador
    icono-maestro.tsx      el dibujo de la pestaña La Cocina: el parrillero de noche, el maestro de sushi de día
    icono-ajustes.tsx      el botón de Ajustes: el trinche y el cuchillo de noche, los palillos de día
    landing.tsx            la portada del producto, armada con las piezas del panel y con los dos modos; landing-demos.tsx, lo que se toca
    landing-semana.ts      la semana de ejemplo, que comparten la portada y sus imágenes para compartir (/api/og, /api/og/dia)
    contador-que-sube.tsx  una cifra que sube desde cero al aparecer: el contador de la portada
    esqueleto.tsx          las piezas de la carga del panel: la forma de cada pantalla, con su pulso tibio
    profile-view.tsx       la página pública (también alimenta la vista previa del editor)
    click-tracker.tsx      escucha delegada de clicks
    charts/                gráficos y paleta validada
  lib/
    tema.ts                el modo de la cuenta (noche o día) y su copia en una cookie; tema-servidor.ts lee la cookie
    networks.ts            las redes que existen y las que están en «Próximamente»; lo leen el panel y el navegador
    ingreso-frases.ts      las frases de la entrada, sin código de servidor: las usan los formularios del navegador
    forma-del-correo.ts    qué correo vale: lo comparten el servidor y el navegador
    revisiones.ts          lo que cada formulario revisa antes de enviar, con las frases del servidor
    paleta-de-acento.ts    la muestra del selector de color y la lectura de un código escrito a mano
    globito.ts             dónde va un globito: encima, o debajo si no cabe, y siempre adentro de la pantalla
    calendario.ts          la aritmética del calendario del panel, en texto y sin zona: meses, semanas, teclas y la hora
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
    lo-pagado.ts           los anuncios del dueño que corrieron en el período, para «Lo pagado» en Los Números
    analitica-youtube-lectura.ts  lo de YouTube Analytics que leen «Tu canal de YouTube» y la pieza, atado al dueño
    enlace-de-la-pagina.ts la dirección pública de la página principal del dueño: el link con ?s= de cada publicación
    pagos/                 el cobro del plan pagado con Mercado Pago: la firma, el cuerpo y los estados (reglas.ts, sin base), lo que se le pide (mercadopago.ts) y las suscripciones y sus cobros (suscripciones.ts)
    planes/                los dos planes: cuál rige y sus frases (plan.ts, sin base), leerlos y cambiarlos (planes.ts), los topes al escribir (topes.ts), los tokens de IA del mes (tokens.ts), la prioridad en las colas (prioridad.ts) y lo que dibuja «Tu plan» (uso.ts)
    planilla/              «Llevar para la casa»: las hojas y su «Léeme», lo que se lee fila por fila, y el .xlsx escrito a mano
    tablero.ts             las reglas de Los Números sin base: cuenta elegida, «⋯ Más» abiertos, la URL
    pieza.ts               qué junta las versiones de una pieza y las medianas por atributo (sin base)
    mejores.ts             el mejor (o el peor) X % de lo publicado: el corte, las medianas y lo que se repite (sin base)
    que-funciona.ts        «Qué te funciona»: qué tema, estilo y formato anduvieron mejor, y si la música ayudó, con su mínimo y su frase (sin base)
    igual-edad.ts          comparar a la misma edad y contra la propia cuenta: los 7 días, las 48 horas y «contra su cuenta» (sin base)
    lado-a-lado.ts         dos publicaciones lado a lado: la curva por edad y sus atributos (sin base)
    metrics-consulta.ts    lo que comparten las rutas de /api/metrics: la llave, el rango, la red y la cuenta
    cuentas-api.ts         las cuentas de GET /api/schedule/cuentas: los dos ids y cómo está la conexión (sin base)
    media-api.ts           la clave de un archivo que sube un cliente de la API, en la carpeta de su dueño (sin base)
    archivar-api.ts        el cuerpo y las respuestas de archivar y desarchivar lo quemado por API
    cocina/                La Cocina: la cámara de frío (lo que se guarda, su cuota y sus nombres por tamaño en bodega.ts; lo de adentro en materiales.ts), los estados de una comanda, la fila del chef, lo que entrega, lo que lee y escribe su API (/api/cocina), las subidas por partes del panel, del teléfono y de la API (subidas-http.ts, que sirve a /api/admin/cocina, /api/mobile/cocina y /api/bodega; la puerta de la llave en llave-api.ts), colgar una comanda, la comanda que pide el teléfono (telefono.ts), cancelar, cambiar y sacar para el panel y el teléfono (del-dueno.ts), el pulso de las tarjetas vivas, cómo atiende la cocina según el latido (latido.ts), las preguntas del chef con su plazo (pregunta.ts y preguntar.ts), la alarma al admin (alarma.ts), los correos de la comanda que entregó o terminó y de la pregunta, la entrega que el dueño todavía no vio (tarjeta.ts), y el mesón (lo que manda al teléfono, en meson-telefono.ts)
    color-de-red.ts        el color de marca de cada red en La Parrilla, como clases de Tailwind escritas enteras
    piezas.ts              la pieza de una publicación: sus destinos programados unidos a lo publicado
    lo-que-trajo.ts        «Lo que trajo» del teléfono: lo nuevo de cada corte desde que se miró, la marca y el número del ícono
    hitos.ts               los hitos de cada corte (100, 1.000… vistas): la detección después de cada lectura y lo que la app celebra
    racha.ts               la racha: los días seguidos con algo servido, en la zona del dueño
    cortes-movil.ts        un corte de La Parrilla en la forma de la app del teléfono: su dibujo y sus redes (sin base)
    auth.ts                sesión del panel
    puente.ts              el puente del teléfono al panel: una llave de dos minutos y un solo uso que abre la sesión del panel sin código
    llaves.ts              las llaves de API de cada usuario, y a nombre de quién entra cada petición
    llaves-api.ts          cómo se ve, se guarda y se lee una llave (sin base: lo prueban los tests)
    manual.ts              el manual del parrillero: cada página de la wiki de la UI pasada a HTML (sin base)
    borradores.ts          los borradores del compositor: guardar, cargar, listar y borrar, siempre por dueño
    borrador.ts            qué se guarda de un formulario y cómo se restaura, también desde el teléfono (sin base)
    borradores-movil.ts    los mismos borradores en la forma de la app del teléfono
    editar-movil.ts        un post programado abierto para corregirlo en el teléfono: lo que se ve y lo que se guarda sin tocar
    comentarios-movil.ts   La Mesa en la forma de la app del teléfono: la cola agrupada por publicación y el código de cada frase (sin base)
    musica-instagram.ts    «Música de Instagram» del panel y del teléfono: la cuenta del dueño con su token, la memoria de lo que suena y la sugerencia con el modelo
    playlists-youtube.ts   «Agregar a una playlist» del panel y del teléfono: el canal del dueño con su token y la memoria corta de sus playlists
    pruebas/               la Postgres de las pruebas de integración: una base nueva y migrada por archivo; y un lector de zip para mirar el XML de una planilla
    empresa.ts             quién presta el servicio: lo leen la portada, privacidad y términos
    portada-numeros.ts     el contador de la portada: las vistas y los «me gusta» de todas las cuentas conectadas, sumados, sin YouTube (§III.E.4.h) y guardados un cuarto de hora
    avisos/                la caída de una cuenta y el resumen del día: las reglas sin base y lo que lee y manda
    push/                  los avisos al teléfono por el servicio de push de Expo: el cliente y los textos sin base, el token de cada teléfono, y el resumen de La Mesa
    sugerencias/           el libro de sugerencias: qué se acepta y cómo queda el issue (sin base), el cliente de GitHub, guardar y reintentar, y la respuesta del equipo (lo que se acepta, el correo y el comentario sin base en respuestas.ts; guardarla, leerla y avisar en responder.ts)
    social/
      instagram-login.ts   el login de Instagram, sin página de Facebook: el host, los permisos y cómo leer su token
      tiktok-business.ts   TikTok for Business: la segunda autorización de la cuenta, su canje, su renovación, sus permisos y dónde se guarda; el comentarista, en comentarios/tiktok.ts
      tiktok-numeros.ts    los números de TikTok for Business —la cuenta y su audiencia, cada video a fondo, la comparación y lo que se busca—, pedidos y traducidos sin base; tiktok-rubros.ts, los rubros de la comparación
      tiktok-numeros-guardar.ts dónde quedan esos números (account_metrics, post_metrics y ajustes), el paso de la sincronización diaria y lo que leen Los Números, la pieza y el compositor
      instagram-audio.ts   la biblioteca de música de Instagram (Audio API de Meta): lo que suena, la búsqueda y una canción, leídos sin base
      musica-sugerencia.ts «Sugiéreme una»: el modelo elige por id entre canciones reales, y sin él el azar (sin base)
      playlists-youtube.ts las playlists de un canal de YouTube y agregarle un video, con sus avisos, leídos sin base
      lectura.ts           qué publicaciones se leen cada día: lo nuevo a diario, lo viejo cada vez más espaciado
      reciente.ts          los números de cada hora: lo de las últimas 48 horas, otra vez, sin YouTube
      politica-youtube.ts  lo que las políticas de YouTube no dejan hacer con sus datos
      retencion-youtube.ts borra lo de YouTube que lleva 30 días sin refrescarse, y lo de Analytics sin autorización comprobada
      analitica-youtube.ts YouTube Analytics: el permiso, las consultas, cómo se lee una respuesta y los nombres (sin base); analitica-youtube-sync.ts lo lee y lo guarda
      desconectar.ts       «Desconectar»: la cuenta suelta sus credenciales y, en YouTube, lo que vino de su API en el acto
      traspasar.ts         le cambia el dueño a una cuenta con lo que se bajó de ella, sin borrar nada
      anuncios.ts          leer los anuncios de Meta: qué se le pide a la Marketing API, el cruce con las publicaciones y el resumen de «Lo pagado» (sin base); anuncios-sync.ts los guarda
      promocionar.ts       promocionar una publicación: qué se acepta, el gasto máximo, lo que se le manda a Meta y sus errores en castellano (sin base); promocionar-meta.ts crea, pausa y detiene
      publish/secuencia.ts las historias de una secuencia salen en orden: cada una espera a la anterior
      publish/editar.ts    guardar los cambios de un post programado: la regla que comparten el editor del panel y la app del teléfono
      publish/tiktok-cuenta.ts  creator_info de una cuenta del dueño y «Música de TikTok» recordada: lo que comparten el compositor y Publicar del teléfono
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
