# Abrir el cobro con Mercado Pago, paso a paso

Para el dueño. Lleva el cobro del plan Maestro Parrillero desde «escrito y cerrado» hasta abierto
para todos. El porqué de cada pieza está en el README («Los planes») y en
`docs/superpowers/specs/2026-11-08-planes-design.md`; lo pendiente, en `docs/pendientes.md`
(«Finanzas: planes y pagos»).

Escrito el 2026-11-08 **sin poder leer la documentación de Mercado Pago**: su sitio no se deja leer
desde un servidor, así que los nombres de los menús son los que tenía su panel, y pueden haber
cambiado. Si un botón no está donde dice, lo que importa es lo que hace el paso. Las credenciales y
la clave secreta no se pegan en ningún chat ni issue: van directo a Vercel.

## 1. Fusionar los dos PRs, en orden

1. En GitHub, fusionar el PR de la fase 1 (#359). El despliegue de producción corre la migración
   `0035_planes.sql` antes de construir; si falla, el código nuevo no se promueve.
2. En Vercel → el proyecto → «Deployments», esperar a que el de `main` quede «Ready».
3. Comprobar en `https://tu-parrilla.cl/admin/usuarios`, «Los planes»: dos tarjetas, «El gratis»
   (7 cuentas, 50 esperando, 20 GB, 100.000 tokens) y «El pagado», «Maestro Parrillero» ($34.990,
   7 días de prueba, 15 cuentas, «Esperando en la parrilla» vacío, 200 GB, 2.000.000 tokens,
   prioridad 1). Y en Tu Cuenta, el bloque «Tu plan».
4. Fusionar el de la fase 2 (#360), después de ponerlo al día con `main` y de que su CI pase. Corre
   la migración `0036_suscripciones_y_cobros.sql`. Nadie ve nada nuevo todavía: sin
   `MERCADOPAGO_ACCESS_TOKEN`, «Pasar a Maestro Parrillero» no aparece.

## 2. La cuenta de Mercado Pago de Pyxis

1. Entrar a `mercadopago.cl` con la cuenta a nombre de Pyxis (de empresa, con su RUT). Si hoy la
   cuenta es personal, conviene abrir la de Pyxis antes de seguir: la aplicación y todo lo que
   cobre quedan en la cuenta donde se crea.
2. Para el retiro: «Retirar dinero» (o «Transferir» → «A una cuenta bancaria») → agregar la cuenta
   del Santander: banco, tipo de cuenta, número y RUT del titular. Mercado Pago suele pedir que el
   titular sea el mismo de la cuenta.

## 3. La aplicación

1. Ir a `https://www.mercadopago.cl/developers/panel/app` («Tus integraciones») → «Crear
   aplicación».
2. Nombre: «Tu Parrilla». Tipo de solución: «Pagos online». ¿Plataforma de e-commerce?: «No».
   Producto: «Suscripciones». Aceptar los términos → «Crear aplicación».
3. Dentro de la aplicación, «Credenciales de producción» → «Activar credenciales»: rubro (software
   o servicios digitales) y sitio web `https://tu-parrilla.cl`. Esas credenciales se usan en el
   paso 8, no antes.

## 4. Los usuarios de prueba

En suscripciones, Mercado Pago pide que quien vende y quien paga sean los dos de prueba, o los dos
reales. Mezclarlos da «Both payer and collector must be real or test users».

1. En la aplicación, «Cuentas de prueba» → «Crear cuenta de prueba». País: Chile. Descripción:
   «Vendedor». No hace falta dinero ficticio.
2. Otra igual, con descripción «Comprador».
3. Anotar de cada una el usuario, la contraseña y el «User ID». El correo del comprador es
   `test_user_<User ID>@testuser.com`; si al entrar con esa cuenta su perfil dice otro, vale ese.
4. En una ventana de incógnito, entrar a `mercadopago.cl` con el usuario y la contraseña del
   **vendedor**. Si pide un código por correo, Mercado Pago indica usar los últimos 6 dígitos del
   User ID.
5. Con esa sesión, crear en «Tus integraciones» una aplicación igual a la del paso 3 («Tu Parrilla
   prueba») y abrir sus «Credenciales de producción». Su Access Token, que empieza con `APP_USR-`,
   es el de la prueba: como la cuenta es de prueba, sus credenciales «de producción» no mueven
   dinero de verdad.

## 5. El webhook, en la aplicación del vendedor de prueba

El webhook va en la misma aplicación de donde sale el token. Durante la prueba, la del vendedor de
prueba; al abrir, la de Pyxis (paso 8).

1. En la aplicación, «Webhooks» → «Configurar notificaciones».
2. URL, en el modo de prueba y en el productivo: `https://tu-parrilla.cl/api/pagos/mercadopago`.
3. Eventos: solo «Planes y suscripciones».
4. «Guardar configuración».
5. Aparece la «Clave secreta». Copiarla: es `MERCADOPAGO_WEBHOOK_SECRET`.

## 6. Las variables en Vercel

1. Vercel → el proyecto `tu-parrilla` → «Settings» → «Environment Variables».
2. Agregar, cada una solo en «Production»:
   - `MERCADOPAGO_ACCESS_TOKEN`: el `APP_USR-…` del paso 4.5, marcada «Sensitive»;
   - `MERCADOPAGO_WEBHOOK_SECRET`: la clave del paso 5.5, marcada «Sensitive»;
   - `PAGOS_ABIERTO_PARA`: el id de la cuenta de Tu Parrilla con que se va a probar. Está en Los
     Maestros, en la fila de esa persona, abajo y en letra chica («id …»). Conviene una cuenta
     aparte: invitar en Los Maestros otro correo propio, para no gastar la prueba de 7 días ni
     cambiarle el plan a la cuenta del admin.
3. «Deployments» → el último de producción → «⋯» → «Redeploy». Una variable cuenta recién desde el
   despliegue siguiente.

## 7. La prueba completa

1. En la aplicación del vendedor de prueba, «Webhooks» → «Simular notificación», con el evento de
   suscripciones. Tiene que contestar `200`. Un `401` es que la clave secreta no calza, o que no se
   redesplegó; un `400`, que falta `MERCADOPAGO_WEBHOOK_SECRET`. Si da `401` con la clave bien
   puesta, puede que la simulación no venga firmada: seguir, que la prueba real es la que cuenta.
2. Entrar a `https://tu-parrilla.cl` con la cuenta de prueba → «Ajustes» → «Tu Cuenta» → «Tu plan».
   Tiene que estar el campo «Correo de tu cuenta de Mercado Pago» y el botón «Pasar a Maestro
   Parrillero».
3. En ese campo, cambiar el correo por el del comprador de prueba (`test_user_…@testuser.com`).
4. «Pasar a Maestro Parrillero». Se abre Mercado Pago. Si en cambio dice «Mercado Pago no respondió.
   Inténtalo de nuevo en un rato.», en Vercel → «Logs», buscar `[pagos]`: ahí está lo que contestó.
5. En Mercado Pago, entrar con el **comprador** de prueba. Si esa ventana tiene la sesión del
   vendedor, salir de ella o abrir otra de incógnito.
6. Pagar con una tarjeta de la tabla «Tarjetas de prueba» de Chile de la documentación de Mercado
   Pago: titular `APRO` (es lo que la aprueba), código `123`, cualquier vencimiento futuro.
7. Mercado Pago devuelve a Tu Cuenta con «Listo: ya tienes el plan Maestro Parrillero.». Si dice
   «Mercado Pago todavía no confirma la suscripción…», recargar en un par de minutos.
8. Comprobar:
   - en «Tu plan», «Lo pagas con Mercado Pago (<correo>). Próximo cobro: <fecha>», a 7 días;
   - en Los Maestros, la fila de esa cuenta, «Maestro Parrillero · lo paga hasta el <fecha>».
9. «Cancelar la suscripción», en Tu Cuenta. Queda «Cancelaste la suscripción: no se vuelve a
   cobrar.», y el plan sigue hasta la fecha.
10. El primer cobro sale al terminar la prueba. Para verlo sin esperar 7 días:
    1. En Los Maestros, «Plan» en la fila de esa cuenta → «Pasar al gratis».
    2. En Tu Cuenta, «Pasar a Maestro Parrillero» de nuevo, con el mismo comprador de prueba. La
       prueba ya está usada, así que esta suscripción no la trae.
    3. Mirar si el cobro sale al autorizar y si aparece en «Los cobros», en Los Maestros.
    4. «Cancelar la suscripción».
11. Contarle al equipo lo que se vio:
    - si `Simular notificación` dio `200`;
    - si el primer cobro sin prueba salió al autorizar;
    - cuántos días reintenta Mercado Pago un cobro rechazado (preguntarlo a su soporte si no se
      ve). Si no son unos 5, se ajusta `GRACIA_DIAS` en `src/lib/pagos/reglas.ts`.

## 8. Abrir a todos

Antes, lo de `docs/pendientes.md` («Lo que pide cobrar, fuera del código»):

- la boleta electrónica de cada cobro, al SII: Mercado Pago no la emite. Con el contador: o
  emitirlas a mano desde el SII con la lista de «Los cobros», o un proveedor de boletas con API,
  que se conecta después;
- que el abogado revise `/terminos`, `/privacidad` y `/borrar-mis-datos` con el cobro;
- Vercel Pro: el plan Hobby es solo para uso no comercial. Vercel → «Settings» del equipo →
  «Billing» → pasar a Pro.

Después:

1. En la aplicación de Pyxis (paso 3), configurar el webhook igual que en el paso 5, y copiar su
   clave secreta: no es la misma de la aplicación de prueba.
2. En Vercel, cambiar `MERCADOPAGO_ACCESS_TOKEN` por el Access Token de producción de la
   aplicación de Pyxis, y `MERCADOPAGO_WEBHOOK_SECRET` por su clave. Dejar `PAGOS_ABIERTO_PARA`
   con el id de la cuenta de prueba. Redesplegar.
3. Una suscripción de verdad, con una tarjeta propia, y cancelarla. Es la única forma de ver el
   camino real entero.
4. `PAGOS_ABIERTO_PARA=1` y redesplegar. Desde ahí, «Pasar a Maestro Parrillero» lo ve todo el que
   tenga el gratis.
5. Pedirle al equipo que cambie el README («Sin suscripción», arriba de todo) y la portada.

Lo de la prueba queda en la base: las suscripciones canceladas no se vuelven a leer, y los cobros
de prueba quedan en «Los cobros». Al hacer las boletas, no cuentan los anteriores al día del paso 4.
