# Abrir el cobro con Mercado Pago, paso a paso

Para el dueño. Lleva el cobro del plan Maestro Parrillero desde «escrito y cerrado» hasta abierto
para todos. El porqué de cada pieza está en el README («Los planes») y en
`docs/superpowers/specs/2026-11-08-planes-design.md`; lo pendiente, en `docs/pendientes.md`
(«Probar y abrir el cobro con Mercado Pago»).

Contrastado el 2026-11-11 con la documentación de Mercado Pago para Chile: la referencia de la API,
«Cuentas de prueba», «Tarjetas de prueba», «Webhooks» y el panel de «Integraciones». Los nombres de
los botones salen de esa documentación y no de haberlos visto con una sesión abierta: si uno no está
donde dice, lo que importa es lo que hace el paso. Las credenciales y la clave secreta no se pegan
en ningún chat ni issue: van directo a Vercel.

## 1. Lo que ya está en `main`

#359 y #360 trajeron el cobro, y sus migraciones (`0035_planes.sql` y
`0036_suscripciones_y_cobros.sql`) corrieron en producción. El 2026-11-11 se corrigió lo que la
documentación mostró distinto: la prueba gratis como fecha del primer cobro, la cancelación, los
días de gracia y que solo un cobro de verdad alargue el plan. Nadie ve nada del cobro todavía: sin
`MERCADOPAGO_ACCESS_TOKEN`, «Pasar a Maestro Parrillero» no aparece.

Para mirarlo, con la sesión del admin, en `https://tu-parrilla.cl/admin/usuarios`, «Los planes»: dos
tarjetas, «El gratis» (7 cuentas, 50 esperando, 20 GB, 100.000 tokens) y «El pagado», «Maestro
Parrillero» ($34.990, 7 días de prueba, 15 cuentas, «Esperando en la parrilla» vacío, 200 GB,
2.000.000 tokens, prioridad 1). Y en Tu Cuenta, el bloque «Tu plan».

## 2. La cuenta de Mercado Pago de Pyxis

1. Entrar a `mercadopago.cl` con la cuenta a nombre de Pyxis (de empresa, con su RUT). Si hoy la
   cuenta es personal, conviene abrir la de Pyxis antes de seguir: la aplicación y todo lo que
   cobre quedan en la cuenta donde se crea.
2. Para el retiro: «Retirar dinero» (o «Transferir» → «A una cuenta bancaria») → agregar la cuenta
   del Santander: banco, tipo de cuenta, número y RUT del titular. Mercado Pago suele pedir que el
   titular sea el mismo de la cuenta.

## 3. La aplicación

1. Ir a `https://www.mercadopago.cl/developers/panel/app` («Integraciones») → «Crear aplicación».
2. Elegir la solución que se va a integrar: **Suscripciones** si aparece en la lista; si no, la de
   pagos online. Después, el nombre: «Tu Parrilla». Aceptar los términos → «Crear aplicación». Las
   preguntas sobre el tipo de negocio, si las pide, se cambian después en «Editar datos».
3. Dentro de la aplicación, activar las credenciales de producción. Según el panel, es uno de estos
   dos caminos:
   - «Credenciales de producción» → aceptar los términos y el reCAPTCHA → «Activar credenciales»;
   - o «Credenciales» → el selector «Producción» → «Activar ambiente de producción» → rubro
     (software o servicios digitales) y sitio web `https://tu-parrilla.cl` → «Activar».

   Esas credenciales se usan en el paso 8, no antes.

## 4. La prueba: el comprador de prueba y las credenciales de prueba

Se prueba con las **credenciales de prueba de la aplicación de Pyxis** y un **comprador de prueba**:
no mueven dinero de verdad. Cada aplicación nace con sus credenciales de prueba, y la documentación
dice que una cuenta de prueba no puede ver las suyas, así que el camino de antes —entrar como
vendedor de prueba a crear otra aplicación— puede no funcionar. Queda como respaldo (ver «Si
Mercado Pago rechaza la prueba», abajo).

1. En la aplicación, «Cuentas de prueba» → «+ Crear cuenta de prueba».
2. Formulario: país **Chile**; descripción «Comprador»; tipo de cuenta **Comprador**. Saldo ficticio
   no hace falta (se paga con tarjeta de prueba).
3. Anotar el usuario, la contraseña y el **correo** que muestra su perfil: tiene que ser exacto. Si
   el correo no calza con el de la suscripción, Mercado Pago rechaza el pago, a veces con «Tu e-mail
   no coincide con el de la suscripción» y a veces como si fuera riesgo (`cc_rejected_high_risk`).
4. Para entrar con esa cuenta, en una ventana de incógnito, Mercado Pago pide un **código de
   verificación de 6 dígitos**: es el que muestra la cuenta de prueba en el panel, en
   «Cuentas de prueba».
5. En la aplicación, las **credenciales de prueba** («Credenciales» → «Prueba», o «Credenciales de
   prueba»): el Access Token de prueba es el que va en Vercel en el paso 6.

## 5. El webhook

En la misma aplicación de donde sale el token: durante la prueba y al abrir, la de Pyxis.

1. En la aplicación, «Webhooks» → «Configurar notificaciones» (en el panel nuevo, «Configuración de
   Webhooks»).
2. «URL modo pruebas» y «URL modo producción»: las dos `https://tu-parrilla.cl/api/pagos/mercadopago`.
3. Eventos: «Planes y suscripciones» y **«Pagos»** (Mercado Pago pide «Pagos» también en
   suscripciones; Tu Parrilla lo contesta sin mirarlo).
4. «Guardar configuración».
5. Aparece la «Clave secreta». Copiarla: es `MERCADOPAGO_WEBHOOK_SECRET`. «Restablecer» la cambia, y
   entonces hay que cambiarla también en Vercel.

## 6. Las variables en Vercel

1. Vercel → el proyecto `tu-parrilla` → «Settings» → «Environment Variables».
2. Agregar, cada una solo en «Production»:
   - `MERCADOPAGO_ACCESS_TOKEN`: el Access Token **de prueba** del paso 4.5, marcada «Sensitive»;
   - `MERCADOPAGO_WEBHOOK_SECRET`: la clave del paso 5.5, marcada «Sensitive»;
   - `PAGOS_ABIERTO_PARA`: el id de la cuenta de Tu Parrilla con que se va a probar. Está en Los
     Maestros, en la fila de esa persona, abajo y en letra chica («id …»). Conviene una cuenta
     aparte: invitar en Los Maestros otro correo propio, para no gastar la prueba de 7 días ni
     cambiarle el plan a la cuenta del admin.
3. «Deployments» → el último de producción → «⋯» → «Redeploy». Una variable cuenta recién desde el
   despliegue siguiente.

## 7. La prueba completa

1. Entrar a `https://tu-parrilla.cl` con la cuenta de prueba → «Ajustes» → «Tu Cuenta» → «Tu plan».
   Tiene que estar el campo «Correo de tu cuenta de Mercado Pago» y el botón «Pasar a Maestro
   Parrillero».
2. En ese campo, cambiar el correo por el del comprador de prueba (paso 4.3), exacto.
3. «Pasar a Maestro Parrillero». Se abre Mercado Pago. Si en cambio dice «Mercado Pago no respondió.
   Inténtalo de nuevo en un rato.», en Vercel → «Logs», buscar `[pagos] no se creó`: ahí está lo
   que contestó.
4. En Mercado Pago, entrar con el **comprador** de prueba. Si esa ventana tiene otra sesión, salir de
   ella o abrir otra de incógnito.
5. Pagar con una tarjeta de prueba de Chile, con titular **`APRO`** (es lo que la aprueba),
   vencimiento **11/30** y documento «otro» `123456789`:

   | Tarjeta | Número | Código |
   |---|---|---|
   | Mastercard crédito | 5416 7526 0258 2580 | 123 |
   | Visa crédito | 4998 4704 7065 8262 | 123 |
   | Mastercard débito | 5597 7917 5464 0466 | 123 |

6. Mercado Pago devuelve a Tu Cuenta con «Listo: ya tienes el plan Maestro Parrillero.». Si dice
   «Mercado Pago todavía no confirma la suscripción…», recargar en un par de minutos.
7. Comprobar:
   - en «Tu plan», «Lo pagas con Mercado Pago (<correo>). Próximo cobro: <fecha>», **a 7 días**;
   - en Los Maestros, la fila de esa cuenta, «Maestro Parrillero · lo paga hasta el <fecha>»;
   - en Los Maestros, «Los cobros»: **ningún cobro de $34.990 todavía**. Si apareció uno, la prueba
     no se respetó (ver abajo);
   - en Mercado Pago, en la aplicación, «Webhooks»: cada aviso que mandó, con su código. Tienen que
     ser `200`. Un `401` es que la clave secreta no calza o que no se redesplegó; un `400`, que falta
     `MERCADOPAGO_WEBHOOK_SECRET`. Desde ahí se puede reenviar un aviso.
8. «Cancelar la suscripción», en Tu Cuenta. Queda «Cancelaste la suscripción: no se vuelve a
   cobrar.», y el plan sigue hasta la fecha. Si en cambio dice «Mercado Pago no respondió», buscar
   `[pagos] no se canceló` en los logs.
9. Un cobro de verdad, sin prueba:
   1. En Los Maestros, «Plan» en la fila de esa cuenta → «Pasar al gratis».
   2. En Tu Cuenta, «Pasar a Maestro Parrillero» de nuevo, con el mismo comprador de prueba. La
      prueba ya está usada, así que esta suscripción no la trae.
   3. Mercado Pago cobra la primera cuota **como una hora después** de autorizar. Pasada esa hora,
      tiene que aparecer en «Los cobros», aprobado, y «Tu plan» tiene que decir el próximo cobro a un
      mes.
   4. «Cancelar la suscripción».
10. Un cobro rechazado: lo mismo del paso 9, con el titular **`FUND`** (fondos insuficientes) en vez
    de `APRO`. El cobro tiene que aparecer rechazado, y el plan, quedar solo unos días desde la
    autorización (no un mes). «Cancelar la suscripción» al final.
11. Contarle al equipo lo que se vio, con lo de «Lo que la prueba tiene que mirar».

### Lo que la prueba tiene que mirar

Lo que la documentación no deja seguro, y el código ya cubre de la forma más prudente:

- **La prueba gratis.** Se manda como `start_date` (el día del primer cobro, a 7 días) con un
  `end_date` a diez años, que es lo que la referencia documenta; `free_trial` no está entre lo que
  se manda en una suscripción sin plan. Si al pedir la suscripción Mercado Pago rechaza el `end_date`,
  el paso 7.3 falla y el log lo dice. Si se cobra al autorizar, el paso 7.7 lo muestra.
- **La cancelación.** Se pide con `canceled`, como la referencia; si Mercado Pago no la acepta, con
  `cancelled`, como su SDK. Si en los logs aparece «`canceled` no sirvió», contarlo: se deja la que
  funcionó.
- **La marca de tiempo de la firma.** La documentación la da en segundos en su ejemplo y dice
  milisegundos en el texto; el código acepta las dos. Si todos los avisos dan `401` con la clave
  bien puesta, contarlo.
- **Qué manda el evento «Pagos».** El webhook no lo mira, pero deja en el log
  `[pagos] webhook: aviso de tipo …`. Con eso se sabe qué llega.
- **Los reintentos** ya están documentados: hasta 4 en 10 días, y tras 3 cuotas rechazadas Mercado
  Pago cancela la suscripción y le avisa al vendedor por correo. La gracia es de 11 días
  (`GRACIA_DIAS`, en `src/lib/pagos/reglas.ts`).

### Si Mercado Pago rechaza la prueba

Si con las credenciales de prueba de Pyxis y el comprador de prueba Mercado Pago no deja pagar (un
error que diga que comprador y vendedor tienen que ser los dos de prueba, o los dos reales), el
respaldo es un **vendedor de prueba**:

1. «+ Crear cuenta de prueba», país Chile, tipo de cuenta **Vendedor**.
2. Entrar con esa cuenta en una ventana de incógnito (con su código de verificación), crear ahí una
   aplicación igual a la del paso 3 y sacar su Access Token, que empieza con `APP_USR-`. Como la
   cuenta es de prueba, no mueve dinero de verdad.
3. Configurar el webhook en esa aplicación (paso 5), y poner en Vercel su token y su clave.

## 8. Abrir a todos

Antes, lo de `docs/pendientes.md` («Lo que pide cobrar, fuera del código»):

- la boleta electrónica de cada cobro, al SII: Mercado Pago no la emite. Con el contador: o
  emitirlas a mano desde el SII con la lista de «Los cobros», o un proveedor de boletas con API,
  que se conecta después;
- que el abogado revise `/terminos`, `/privacidad` y `/borrar-mis-datos` con el cobro;
- Vercel Pro: el plan Hobby es solo para uso no comercial. Vercel → «Settings» del equipo →
  «Billing» → pasar a Pro.

Después:

1. En Vercel, cambiar `MERCADOPAGO_ACCESS_TOKEN` por el Access Token **de producción** de la
   aplicación de Pyxis (paso 3.3). La clave secreta del webhook probablemente es la misma, porque es
   una por aplicación; si la prueba se hizo con el vendedor de prueba, hay que configurar el webhook
   en la de Pyxis y cambiar también `MERCADOPAGO_WEBHOOK_SECRET`. Dejar `PAGOS_ABIERTO_PARA` con el
   id de la cuenta de prueba. Redesplegar.
2. Una suscripción de verdad, con una tarjeta propia, y cancelarla. Es la única forma de ver el
   camino real entero.
3. `PAGOS_ABIERTO_PARA=1` y redesplegar. Desde ahí, «Pasar a Maestro Parrillero» lo ve todo el que
   tenga el gratis.
4. Pedirle al equipo que cambie el README («Sin suscripción», arriba de todo) y la portada.

Lo de la prueba queda en la base: las suscripciones canceladas no se vuelven a leer, y los cobros
de prueba quedan en «Los cobros». Al hacer las boletas, no cuentan los anteriores al día del paso 1
de esta sección.
