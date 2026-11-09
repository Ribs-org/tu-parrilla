# Los planes: el gratis y el pagado, y el cobro con Mercado Pago

Fecha: 2026-11-08. **Diseño. La fase 1 está implementada** en la rama `planes`; la fase 2, no.
Va en dos partes, cada una en su rama: la **fase 1**
(`planes`) son los dos planes, sus topes, la prioridad, el admin y «Tu plan»; la **fase 2**
(`planes-mercadopago`) es el cobro. La fase 1 se sostiene sola: sin cobro, el admin da el
pagado a mano. Cierra las entradas «Tres niveles de cuenta y una forma de pagar» y «Que el
admin maneje los planes a mano» de `docs/pendientes.md` (eran tres niveles; el dueño eligió dos).

## Lo que pidió el dueño

> «Diseñar 2 planes para parrilla: gratis y pagado. Luego va a crear algo para el admin para
> administrar este tipo de cosas y vamos a implementar pasarela de pagos. (Hoy cuento con
> mercado pago y una cuenta del santander)»

Y al revisar la propuesta, el mismo día:

- el pagado cuesta **$34.990 al mes**;
- las funciones quedan **en los dos planes**: el pagado tiene **más espacio en la cámara de
  frío, más tokens de IA y prioridad en las colas**;
- quienes ya usan Tu Parrilla (la beta por invitación) **pasan al gratis**;
- el pagado parte con **7 días de prueba**.

La propuesta también traía un tope de cuentas conectadas y de publicaciones esperando en el
gratis (3 y 10). Al revisar los PRs, el mismo día, el dueño los subió y le puso nombre al pagado:

- el pagado se llama **«Maestro Parrillero»** y lleva **200 GB** en la cámara de frío;
- el gratis conecta **7 cuentas** y deja **50 publicaciones** esperando a la vez.

Son topes del plan, editables, y se pueden dejar sin tope desde el admin.

## Los dos planes

Todo lo de esta tabla es una fila de la base y se cambia desde Los Maestros, sin tocar el
código. Lo único fijo son las dos claves, `gratis` y `pagado`: el código sabe cuál se vende.

| | Gratis | Maestro Parrillero (el pagado) |
|---|---|---|
| Precio al mes | $0 | **$34.990**, IVA incluido |
| Días de prueba | — | **7**, una vez por persona |
| Cuentas conectadas | 7 | 15 |
| Publicaciones esperando a la vez | 50 | sin tope |
| Cámara de frío | 20 GB (lo de hoy) | 200 GB |
| Tokens de IA al mes | 100.000 | 2.000.000 |
| Prioridad en las colas | normal | primero |

Todo lo demás —La Parrilla, Los Números con su planilla, La Mesa con los borradores y la palabra
clave, La Cocina, la API para tu agente, la página de links, la app del teléfono— está en los dos.

**Por qué esos números.** La cámara de 20 GB es la de hoy: bajarla dejaría a la beta con más
de lo que le cabe. 200 GB en R2 cuestan cerca de US$3 al mes. Un borrador de La Mesa son unos
mil tokens con Claude Haiku (tope de 300 de salida), y «Sugiéreme una», hasta dos llamadas de 200:
100.000 tokens son unos cien borradores al mes, y dos millones, unos dos mil, alrededor de US$3 de
pasarela. Las 15 cuentas cuidan las cuotas que comparten todos, sobre todo la de YouTube, que es
una sola para el proyecto.

**El nombre.** «Maestro Parrillero», el que eligió el dueño. Es el nombre con que nace la fila y
se cambia en el admin; el gratis se llama «Gratis». No es lo mismo que «Los Maestros», la pantalla
del admin: tener el plan no da acceso a ella. Donde la frase lo pide, el panel dice «el plan
Maestro Parrillero» y no «el Maestro Parrillero», para que no se lea como una persona. Son los
nombres que ve la persona en «Tu plan» y en los avisos de los topes.

## El modelo de datos

**`planes`**, una fila por plan:

| Columna | Qué es |
|---|---|
| `clave` | `gratis` o `pagado`, la llave. No se edita |
| `nombre` | Lo que ve la persona |
| `precio_clp` | Entero: el peso chileno no tiene decimales. En el gratis es 0 |
| `dias_de_prueba` | 0 en el gratis |
| `cuentas_max`, `en_la_parrilla_max`, `tokens_mes` | Nulo es sin tope |
| `bodega_bytes` | La cámara de frío |
| `prioridad` | Entero: más alto pasa primero en las colas |

**En `users`**:

| Columna | Qué es |
|---|---|
| `plan` | La clave del plan que tiene, `gratis` al nacer |
| `plan_hasta` | Hasta cuándo rige `plan`; nulo es sin fecha. Pasada la fecha, rige el gratis sin que nadie la escriba |
| `plan_origen` | `cortesia` (lo dio el admin) o `suscripcion` (lo paga); nulo en el gratis |
| `prueba_usada_en` | Cuándo usó los días de prueba: no se repiten |

`users.bodega_bytes`, que ya existía, se queda como lo que el admin pone **a mano**: si está, gana
sobre la del plan; nula, rige la del plan.

**`uso_ia`**, los tokens gastados por dueño y por mes: `owner_id`, `mes` (`2026-11`, en la zona del
dueño, como todo lo que se cuenta por día o por mes en Tu Parrilla) y `tokens`.

La fase 2 suma `suscripciones` y `cobros` (ver «El cobro con Mercado Pago»).

## El plan que rige

`planQueRige(usuario, ahora)`: el de `users.plan` si no es el gratis y su `plan_hasta` no pasó; si
no, el gratis. Se calcula al leer, y por eso nada tiene que bajar a nadie a medianoche: una
cortesía que vence o una suscripción que dejó de pagarse vuelve sola al gratis.

**Bajar de plan no borra ni desconecta nada.** Quien tenía 8 cuentas sigue con las 8 conectadas, y
lo programado sale igual; lo que no puede es conectar otra ni programar más hasta quedar bajo el
tope. Lo mismo en la cámara: lo guardado se queda, y no entra nada nuevo mientras no haya espacio.
Los tokens se cortan al llegar al tope: los borradores de La Mesa dejan de salir (los comentarios
siguen entrando, para responderlos a mano) y «Sugiéreme una» elige sin el modelo.

## Los topes, y dónde se miran

| Tope | Dónde | Qué dice |
|---|---|---|
| Cuentas conectadas | `guardarCuenta` (`social/conectar.ts`), cuando la cuenta no estaba conectada: cuenta las conectadas del dueño (con credencial), sin esa | «Tu plan <nombre> conecta hasta <N> cuentas: desconecta una en Los Fierros para conectar esta.» |
| Publicaciones esperando | `crearVariosProgramados` (el panel y el teléfono), el lote de la API (`publish/batch.ts`) y el rearme de un destino fallido (`publish/reprogramar.ts`). Una publicación es un corte de La Parrilla con algún destino en `scheduled` o `publishing`, salga a una red o a cuatro | «Tu plan <nombre> deja hasta <N> publicaciones esperando a la vez: espera a que salga alguna o borra una.» |
| Cámara de frío | Donde ya se mira (`abrirSubida`), con la cuota del plan en vez de la constante | La frase de siempre |
| Tokens del mes | Antes de cada llamada al modelo (`pedirBorrador`, `pedirAlModelo`, por `conTokens`); después de la llamada se suma `usage.totalTokens` | En La Mesa, el borrador queda con «Se acabaron los tokens de IA de tu plan este mes.» como error; «Sugiéreme una» elige sin el modelo, al azar entre lo que encontró, como cuando no hay pasarela |

El tope de tokens es blando por una llamada: se mira antes y se suma después, así que la última
del mes puede pasarse por unos cientos. Medirlo exacto pediría reservar antes de saber cuánto
gasta, y una llamada de más no le cuesta a nadie.

## La prioridad en las colas

`prioridad` ordena, de mayor a menor, lo que hoy va por orden de llegada. Dentro de una misma
prioridad sigue el orden de siempre:

- **El chef de La Cocina** (`ordenarFila`, en `cocina/fila.ts`): primero las pruebas, como hoy;
  después la ronda de los dueños de mayor prioridad, y después la de los demás. La consulta que
  lista las comandas ordena por prioridad antes de su límite de 100, para que una comanda pagada
  nueva no quede fuera detrás de cien gratis.
- **La publicación** (`publishDue`): lo que vence a la vez sale primero si es de un dueño de mayor
  prioridad. La corrida tiene tiempo para unos dos minutos de publicaciones: si no alcanza, lo que
  queda para la pasada siguiente es lo del gratis. Una secuencia de historias sigue en su orden,
  porque es de un solo dueño.
- **El sondeo de comentarios y los borradores** (`sondearComentarios`, `redactarPendientes`): las
  cuentas pagadas se sondean primero, y sus comentarios se redactan primero.
- **La sincronización diaria** (`syncAll`): las cuentas pagadas primero dentro de cada red.

No es un carril aparte: con pocas personas nadie lo nota, y cuando la cola se llena, el pagado
no espera detrás del gratis.

## El admin: «Los planes», en Los Maestros

En Los Maestros, que ya es solo del admin, un bloque nuevo arriba, **«Los planes»**: una tarjeta por
plan con su nombre, su precio, los días de prueba y cada tope, y «Guardar». Un tope vacío es sin
tope.

En la fila de cada persona, su plan: «Gratis», o «Maestro Parrillero · cortesía hasta el 8 dic» /
«Maestro Parrillero · cortesía» / «Maestro Parrillero · paga con Mercado Pago» (fase 2). Y un
botón **«Plan»** que abre: el plan que rige, «Dar cortesía» —el pagado, hasta una fecha o sin fecha— y «Pasar al gratis». Lo que la
persona paga no se toca desde acá: una cortesía sobre una suscripción viva no la cancela, y la
fase 2 lo dice al lado.

## Tu plan, en Tu Cuenta

Un bloque **«Tu plan»** debajo de «Tus datos»: el nombre del plan que rige y hasta cuándo, y lo que
lleva usado de cada tope —«Cuentas conectadas: 2 de 3», «Esperando en la parrilla: 4 de 10», «La
cámara de frío: 3,1 GB de 20 GB», «Tokens de IA este mes: 12.400 de 100.000»—, con el plan pagado
al lado para comparar. En la fase 1 no tiene botones: el pagado lo da el admin. En la fase 2 suma
«Pasar a Maestro Parrillero» y, con una suscripción, «Cancelar la suscripción».

## El cobro con Mercado Pago (fase 2)

Mercado Pago Chile, con una **suscripción sin plan asociado** (`POST /preapproval`): Tu Parrilla
crea la suscripción de esa persona con su monto, y la persona la autoriza en la página de Mercado
Pago (`init_point`). Tu Parrilla nunca ve una tarjeta. Se eligió sin plan asociado porque así cada
suscripción lleva `external_reference` —el id de la fila de `suscripciones`— y el webhook sabe de
quién es sin adivinar por el correo.

El flujo:

1. En «Tu plan», **«Pasar a Maestro Parrillero»** pide el correo de la cuenta de Mercado Pago con
   que se va a pagar, que nace con el de Tu Parrilla: Mercado Pago rechaza la autorización si `payer_email` no
   es el de la cuenta que paga (lo reporta su SDK de Node, issue 421).
2. El servidor crea la fila de `suscripciones` (`pendiente`) y la suscripción en Mercado Pago:
   `reason` («Tu Parrilla — Maestro Parrillero»), `external_reference`, `payer_email`, `back_url`
   (Tu Cuenta), `status: pending` y `auto_recurring` con `frequency: 1`, `frequency_type: months`,
   `transaction_amount` (el precio del plan), `currency_id: CLP` y, si nunca usó la prueba,
   `free_trial: { frequency: 7, frequency_type: days }`. Redirige al `init_point`.
3. La vuelta a Tu Cuenta lee la suscripción en Mercado Pago (`GET /preapproval/{id}`) y la deja al
   día, sin esperar el webhook.
4. **El webhook** (`POST /api/pagos/mercadopago`) verifica la firma (`x-signature` con
   `ts=…,v1=…`: HMAC-SHA256 con el secreto de la integración sobre `id:<data.id>;request-id:<x-request-id>;ts:<ts>;`)
   y, según el tema, vuelve a leer el recurso: `subscription_preapproval` → la suscripción;
   `subscription_authorized_payment` → el cobro (`GET /authorized_payments/{id}`). Nunca cree lo
   que trae el cuerpo: solo el id.
5. **Lo que cambia el plan:**
   - autorizada: `plan = pagado`, `plan_origen = suscripcion`, `plan_hasta` = el próximo cobro
     (`next_payment_date`) más 5 días de gracia; si traía prueba, `prueba_usada_en`;
   - cada cobro aprobado corre `plan_hasta` al próximo cobro más la gracia;
   - un cobro rechazado no la corre: Mercado Pago lo reintenta, y si en la gracia no entra, el
     plan cae solo al gratis;
   - cancelada (por la persona, desde «Tu plan», o en Mercado Pago): no cambia `plan_hasta`; queda
     pagado hasta el fin de lo que pagó (o de la prueba) y después, gratis.
6. **Cada día**, la sincronización relee las suscripciones vivas: un webhook perdido no deja a
   nadie con el plan equivocado más de un día.

`cobros` guarda cada cobro (el id del cobro autorizado y el del pago, el monto, el estado y su
detalle, la fecha), para el admin y para la boleta.

Variables: `MERCADOPAGO_ACCESS_TOKEN` y `MERCADOPAGO_WEBHOOK_SECRET`, y `PAGOS_ABIERTO_PARA` como
las demás puertas del repo: mientras no diga `1`, «Pasar a Maestro Parrillero» se ve solo para esos ids. En
Mercado Pago (Tus integraciones → Webhooks), la URL `https://tu-parrilla.cl/api/pagos/mercadopago`
con el evento «Planes y suscripciones».

**La gracia de 5 días** es una suposición: la documentación de Mercado Pago bloquea a los
lectores automáticos (403) y no se pudo confirmar cuántos días reintenta un cobro rechazado. Si
reintenta más, se alarga la constante.

## El teléfono

La app no cobra ni enlaza al cobro. Google Play exige su propio sistema de pagos (con su comisión)
para lo que se vende dentro de una app, y cobrar solo en la web, sin botón ni enlace en la app, lo
deja fuera (`docs/pendientes.md`, la entrada de los planes). En el teléfono se ven los topes cuando
se topa con ellos —la misma frase del servidor— y nada más.

## Lo que no entra, y lo que es del dueño

- **La cuenta de Mercado Pago a nombre de Pyxis**, con el retiro a la cuenta del Santander. La
  integración es la misma con la cuenta que sea; las credenciales se cambian en Vercel.
- **La boleta electrónica** de cada cobro, al SII. Mercado Pago no la emite en Chile; `cobros` tiene
  lo que hace falta para emitirla, a mano o con un servicio después.
- **`/terminos` y `/privacidad`** con los planes, el cobro, la prueba y la baja, revisados por el
  abogado, antes de abrir el cobro a todos (`PAGOS_ABIERTO_PARA=1`). Mientras esté cerrado, no se
  promete nada a nadie.
- **Vercel Pro**, que ya hacía falta para cobrar: el plan Hobby es de uso no comercial.
- Más de dos planes, cupones, pagos anuales y el cambio de precio de una suscripción ya tomada:
  la tabla admite más filas, pero el código sabe de dos.
