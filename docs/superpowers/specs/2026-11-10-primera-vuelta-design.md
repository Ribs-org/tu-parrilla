# La primera vuelta: lo justo para partir, en la app

2026-11-10. Lo pidió el dueño: «un onboarding para la primera vez que un usuario entra a la app,
tal vez que entre en la parte de conectar cuentas en vez de donde está la parrilla… no quiero que
sea aparatoso, pero que reduzca fricción inicial. Incluso podría ser después, la quinta vez que se
mete, introducir al chef».

## Lo que frena hoy

- **Sin redes conectadas, la app no tiene nada que mostrar.** La Parrilla dibuja siete días con
  «No hay nada puesto. Préndela.», y Publicar dice que no hay cuenta lista. Nada dice que lo
  primero es conectar.
- **Las redes no se conectan en la app**, sino en el panel web (Los Fierros), porque Meta solo
  acepta los retornos de OAuth de `tu-parrilla.cl` y el navegador ya sabe hacerlo. El botón de
  Ajustes abre el panel en el navegador del teléfono, **sin sesión**: la persona tiene que pedir
  otro código, escribirlo, y después de entrar cae en La Parrilla del panel, no en Los Fierros.
  Es el paso más caro de todo el arranque, y le toca justo a quien recién llega.
- **El chef no se presenta.** La Cocina es una pestaña más; quien no la abre no sabe que hay
  alguien que le corta los videos.

## Lo que hace

Tres piezas chicas. Ninguna tapa la app ni pregunta nada que no haga falta.

### 1. La bienvenida, solo si no hay redes

Al entrar por primera vez en un teléfono (canjear el código), si la cuenta **no tiene ninguna red
conectada**, la app abre «Prende los fierros» (de día, «Afila los cuchillos») en vez de La
Parrilla. Una pantalla, una acción:

- «Te damos la bienvenida a Tu Parrilla.» y para qué sirve conectar: publicar, ver los números
  y responder los comentarios desde acá.
- Las redes que se pueden conectar, y las que ya están, con su nombre.
- **«Conectar mis redes»**: abre Los Fierros del panel en el navegador, **con la sesión ya
  abierta** (el puente, abajo).
- **«Después»**, chico, que va a La Parrilla. La bienvenida no vuelve a salir en ese teléfono.

Al volver a la app la lista se vuelve a leer. Con una red conectada, la pantalla lo celebra
(«Fierros prendidos», «Listo. Ya está conectada:» y la cuenta) y el botón grande pasa a ser «Ir a
La Parrilla».

Quien ya tiene redes —porque partió en el panel, o porque entra en un segundo teléfono— no ve
nada: va directo a La Parrilla. Lo decide el servidor, que en la respuesta del ingreso dice si la
cuenta tiene alguna red conectada (`sinRedes`), así que no hay espera ni parpadeo.

Mientras la bienvenida está abierta no sale la pregunta de los avisos al teléfono: esa vive en
las pestañas y llega ocho segundos después de entrar a La Parrilla, como siempre. Dos preguntas
seguidas al llegar es lo aparatoso que no se quiere.

Si el sistema cierra la app mientras la persona está en el navegador (Android lo hace con poca
memoria), al volver la bienvenida sigue ahí: el teléfono anota que está a medias y solo la da
por vista cuando la persona sale de ella.

### 2. El puente: del teléfono al panel, sin otro código

`POST /api/mobile/puente`, con el token del teléfono, devuelve una dirección de un solo uso que
vale dos minutos: `/ingresar/puente#t=<llave>`. Esa página abre la sesión del panel en ese
navegador y lleva a Los Fierros.

- **Un solo uso y dos minutos**: la llave se guarda con hash (`puentes`) y se gasta al cruzar,
  en la misma sentencia que comprueba que siga viva. Es lo mismo que el teléfono ya puede hacer
  con su token, en el mismo teléfono, así que no abre una puerta nueva; solo evita el código.
- **La llave va en el fragmento** (`#t=`), como el código del botón del correo: el navegador no
  lo manda, así que no queda en los registros del servidor ni en un Referer.
- **No cruza sola.** La página muestra «Vas a entrar al panel como <correo>.» y espera que la
  persona apriete «Entrar». Si cruzara sola, cualquiera podría pedir una llave de su propia cuenta
  y hacer que otra persona abra el enlace: quedaría dentro de un panel ajeno, y podría conectar
  ahí sus redes sin darse cuenta. Mirar el correo no gasta la llave.
- **También lo usa el botón de Ajustes** («Abrir Los Fierros en el panel»), que tenía el mismo
  problema.
- Los Fierros del panel, abierto desde el puente, dice arriba «Cuando termines, vuelve a la app
  de Tu Parrilla.»: después de conectar con Meta o TikTok, el navegador queda en el panel y nada
  le dice a la persona que ya puede volver.

### 3. El chef, a la quinta

A la quinta vez que se abre la app (contando las veces que vuelve después de media hora fuera),
La Parrilla muestra arriba una tarjeta: «Te presento al chef», qué hace en una frase, «Ir a La
Cocina» y una ✕. Sale una vez. No sale:

- si La Cocina no está encendida para esa cuenta (es un piloto; presentarla para decir «pídesela a
  quien administra» sería una puerta cerrada);
- si la persona ya abrió La Cocina por su cuenta, o ya tiene comandas.

¿Por qué la quinta? Las primeras veces son de conectar y de mirar La Parrilla; el chef es lo
segundo que conviene conocer, cuando ya hay redes y algo que publicar. Es un número en
`lib/primera-vuelta.ts`, fácil de mover.

## Lo que no hace

- **Un recorrido con globitos por cada pestaña.** Cada pantalla ya se explica sola; un tour se
  salta y se olvida, que es lo aparatoso.
- **Conectar las redes dentro de la app.** Pide `expo-web-browser` (un build nuevo por la tienda)
  y retornos de OAuth al esquema `tuparrilla://`, que Meta no acepta. El puente da casi lo mismo
  sin tocar la tubería nativa: todo esto llega por actualización en el aire.
- **Guardar en el servidor que la bienvenida ya se vio.** Va en el teléfono, con lo demás de la
  cuenta, y se borra al salir. Entrar de nuevo vuelve a preguntar al servidor si hay redes: si las
  hay, no sale nada.
- **El panel web.** Quien parte en el panel ya cae en La Parrilla del panel, con la barra de Los
  Fierros a la vista; la fricción era la del teléfono.
