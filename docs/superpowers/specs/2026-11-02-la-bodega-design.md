# La bodega: el material en bruto que se guarda, y la comanda que elige de ahí

Fecha: 2026-11-02. **Diseño. Implementado** en la rama `la-bodega`. Amplía La Cocina
(`2026-10-22-la-cocina-design.md`): hasta hoy cada archivo nacía para una comanda y se borraba con
ella; desde esta rama el material vive en un lugar propio, persistente, y una comanda elige de ahí.

## Lo que pidió el dueño

> «Además del chef va a haber una bodega de materiales brutos persistentes que el usuario pueda
> subir. […] Puedo subir un video de 20 segundos que va a ser mi intro o mi outro. Puedo subir un
> video de 10 minutos sin necesariamente pedir una comanda y, para pedir una comanda, voy a
> seleccionar parte de estos videos. […] Una comanda implica seleccionar algunos de esos
> materiales más esa instrucción que ya hemos comentado.»

Y una cuota de espacio por usuario, que más adelante ponen los planes de pago: 20 GB para partir.
La temática manda: el lugar tiene nombre de cocina, y cada material, un dibujo que dice qué es y
cuánto pesa, de un corte chico a la vaca entera.

## Los nombres

| | De noche | De día | Por qué |
|---|---|---|---|
| El lugar | **«La cámara de frío»** | **«La nevera»** | En una carnicería la carne entera espera colgada en la cámara, a la temperatura que la conserva, hasta que alguien la corta. En una barra de sushi el pescado entero espera en la nevera, sobre hielo. Las dos guardan sin que nada venza, que es lo nuevo. «Bodega» es la palabra del encargo y queda en el código (`/admin/ia/bodega`, `src/lib/cocina/bodega.ts`): es la de dentro, la que no cambia de día. |
| Subir | «Guardar en la cámara» | «Guardar en la nevera» | Lo que se hace con la carne que llega. |
| Sacar | «Sacar de la cámara» | «Sacar de la nevera» | |
| Casi llena | «La cámara se está llenando» | «La nevera se está llenando» | |
| Llena | «La cámara está llena» | «La nevera está llena» | |

Cada material lleva el nombre de lo que pesa. Un video de noche va de **«un corte»** (menos de 100
MB) a **«un lomo»**, **«un cuarto»**, **«media res»** y **«la vaca entera»** (10 GB o más); de día,
de **«un trozo»** a **«un filete»**, **«un salmón entero»**, **«un atún»** y **«un atún gigante»**.
Un audio es una ristra de longanizas que se alarga (de día, un pulpo que crece): una ristra
colgando se parece a la onda de un sonido, y los tentáculos también. Una imagen son las verduras
—un pimentón, el choclo con el pimentón, un cajón— y de día el arroz —un onigiri, el bol, la tina—,
como ya eran los acompañamientos. Lo demás (una tipografía, un PDF, unos subtítulos) va envuelto: un
paquete de papel de carnicería con su pita, o un furoshiki. Todos van en `vocabulario.ts` y en «El
modo día» de la wiki.

La cámara no es pestaña: vive dentro de La Cocina, como el mesón, porque es de donde sale lo que el
chef cocina. Una ruta hermana del mesón (`/admin/ia/bodega`), con su botón al lado de «Pedir una
comanda», y un bloque de elegir en el formulario de pedir.

## El modelo de datos

**Dos tablas, no una con dos usos.** `materiales` es la cámara: cada fila, un archivo del dueño, con
su nombre, su uso y su peso, que no vence. `insumos`, la que ya existía, pasa a ser lo que una
comanda lleva: una fila por material en cada comanda, con su rol ahí (plato principal, otra cámara,
la pantalla, para intercalar) y un `material_id` que la ata a la cámara. Es la tabla de muchos a
muchos entre comandas y materiales, con el rol que el par necesita.

Por qué no hacer de `insumos` la cámara y sumarle una tabla de unión, que era lo primero que se ve
(`comanda_id` ya es opcional):

- **El contrato con el chef no cambia de forma.** El chef baja cada insumo por su id
  (`/insumos/{id}/enlace`) y lee su `tipo`. Con `insumos` como unión, cada id sigue siendo «este
  archivo en esta comanda», y el mismo material en dos comandas son dos insumos con su rol propio:
  el intro puede ser «para intercalar» en una y nada en otra. Con `insumos` como cámara, el id
  dejaría de nombrar algo de la comanda, y el rol tendría que viajar por otro lado.
- **Un rollback no vacía la cámara.** El código de antes borra, cada hora, los insumos sin comanda
  de más de tres días (`barrerSubidas`), y los insumos vencidos con su archivo (`barrerCocina`). Si
  la cámara fuera `insumos`, volver atrás un despliegue borraría todo lo guardado. Con la cámara en
  su propia tabla, el código viejo no la ve. Lo que sí queda expuesto, y está escrito en el README
  («Cómo cambia el esquema»), es que el código viejo le pone vencimiento a lo crudo de una comanda
  que se cancela: dos semanas después borraría ese archivo, que ahora es de la cámara.
- **La foto de lo que se pidió.** El insumo copia el nombre, el uso y el peso del material al
  colgar la comanda, como la receta congela la marca. Renombrar el material mañana no cambia lo que
  el chef ya tiene.

Los dos apuntan al mismo objeto del almacén: un material no se copia para cada comanda. El dueño
del archivo es la cámara; el insumo solo lo nombra.

### Las columnas nuevas

- `materiales`: `owner_id`, `nombre`, `uso` (opcional: `crudo`, `intro`, `outro`, `broll`,
  `musica`, `logo`, `letras` u `otro`), `url`, `bytes`, `tipo_archivo`, `duracion_s`, `derechos_en`,
  `creado_en`, `borrado_en`. Con RLS, como cada tabla.
- `insumos.material_id`, `insumos.uso` y `insumos.posicion` (el orden en que el chef los recibe).
  El tipo `extra` se suma a los cuatro de siempre, para lo que no es video ni foto.
- `subidas.material_id` y `subidas.uso`; `subidas.tipo` deja de ser obligatorio. Una subida cerrada
  nombra su material.
- `users.bodega_bytes`: la cuota de cada uno, nula para la de siempre.

### La cuota

**20 GB por usuario**, en una constante (`CUOTA_BODEGA_POR_DEFECTO`), y `users.bodega_bytes` para el
que tenga otra. Nula es la de siempre: un plan de pago, mañana, escribe la columna y no toca el
código. El admin la cambia en Los Maestros.

Cuenta lo que hay en la cámara **y lo que está subiendo**: un archivo de 15 GB a medio subir ya
ocupa su lugar. Se mira en el servidor al abrir la subida, antes de firmar nada, con la fila del
usuario bloqueada (`FOR UPDATE`): dos subidas que abren a la vez se ponen en fila, y la segunda ve
lo que reservó la primera. Lo que se sacó deja de contar en el acto, y una subida abandonada, a las
24 horas, cuando el barrido la aborta.

En la cámara la cuota se dibuja como la cámara misma: un riel con diez ganchos que se van ocupando
con carne (de día, la nevera con diez lugares sobre el hielo que se van llenando de pescado). Desde
el 85 % lo dice: «La cámara se está llenando»; al 100 %, «La cámara está llena», y «Guardar» no deja
elegir nada. «¿Necesitas más espacio?» abre el libro de sugerencias con el pedido escrito, porque
comprar espacio todavía no existe.

**El costo.** 20 GB por usuario pasa el plan gratis de R2, que da 10 GB para todo el bucket: con
diez usuarios llenos son unos 200 GB, del orden de US$3 al mes (US$0,015 el GB-mes, sin cobro por
bajar). Dónde vive el material a la larga —R2 o el Drive del dueño— lo decide el dueño
(`docs/pendientes.md`).

## Lo que cambia en la comanda

Pedir es elegir de la cámara: cualquier combinación, dos de cuatro videos y cuatro fotos. Uno de los
videos es el plato principal —el chef cocina a partir de uno, y sus minutos son los del cupo—, y por
defecto es el primero que se elige. Los demás videos dicen qué son: otra cámara o la pantalla (que
el chef sincroniza por el audio) o «para intercalar»; las fotos van para intercalar; lo que no es
video ni foto va como extra. Desde el mismo formulario se puede guardar algo nuevo, que queda en la
cámara y entra elegido.

La comanda congela lo elegido: el insumo copia nombre, uso y peso, y el plato principal lleva el
`subtipo` que se eligió al pedir (un largo, un podcast, tomas sueltas). Antes se elegía al subir; un
mismo video puede ser un largo hoy y tomas sueltas mañana.

**Un material que una comanda en marcha está usando no se saca** (de colgada a sirviendo, las que el
chef todavía puede bajar): «Ese material va en una comanda en marcha: lo puedes sacar cuando
termine.». La cámara lo marca. Pedir y sacar bloquean la fila del material, así que no se cruzan.

## Lo que recibe el chef

Lo mismo, por las mismas rutas. Dos cosas nuevas, las dos opcionales:

- en cada insumo, `uso` (el que le puso el dueño, o `null`) y `materialId` (el mismo material en
  dos comandas trae el mismo: si ya lo bajó, no hace falta bajarlo de nuevo);
- en cada comanda, `extras`: lo que no es video ni foto (un audio, una tipografía), con la misma
  forma y `tipo: "extra"`. Va aparte para que un cliente escrito antes de la cámara no se encuentre
  en `insumos` un tipo que no conoce.

## Los barridos

- **Lo de la cámara no vence.** Se fue el borrado a los tres días de lo que se subió y no se pidió:
  ahora eso es la cámara.
- **Lo crudo de una comanda (14 días)** queda solo para los insumos con archivo propio, los de antes
  de la cámara que ya se habían borrado. Uno que viene de la cámara no recibe vencimiento: el archivo
  es de la cámara, y sale de ahí cuando el dueño lo saca.
- **El mesón (30 días)** no cambia: lo que el chef entregó no es material en bruto, y un video
  cocinado que nadie programa no tiene por qué ocupar la cuota.
- **Las subidas abandonadas (24 horas)** siguen igual, y con ellas se libera su lugar en la cuota.

## Lo que ya existía

Hay usuarios en piloto. La migración pasa a la cámara todo lo crudo que sigue en el almacén (los
insumos sin `borrado_en`), con su mismo id y su misma URL, y ata cada insumo a su material:

- lo que se subió y no se pidió deja de ser insumo y queda solo en la cámara;
- lo que está en una comanda sigue ahí, con su id de siempre —el chef no nota nada—, y además
  aparece en la cámara;
- su vencimiento de 14 días se borra: ahora es de la cámara, y no vence.

El uso se deduce del tipo que tenía: el plato principal, otra cámara y la pantalla, «material
crudo»; un video de imágenes o b-roll, «b-roll»; una foto, sin uso.

## Las animaciones

Cada una dice una cosa, y con `prefers-reduced-motion` queda en su cuadro quieto:

- **Subir:** mientras sube, la pieza se va llenando de color de abajo hacia arriba, con lo que lleva.
  Al terminar, la puerta de la cámara se abre —acero de noche, vidrio esmerilado de día— con el vaho
  del frío, y la pieza queda adentro.
- **Elegir para la comanda:** la pieza sale volando de su lugar en la cámara hasta el riel de la
  comanda y se mece al colgarse; en la cámara queda el gancho vacío.
- **La cuota:** los ganchos se ocupan uno detrás del otro al abrir la cámara.

## Lo que no entra

- Comprar espacio: «¿Necesitas más espacio?» abre el libro de sugerencias.
- El material en el Drive del dueño (`docs/pendientes.md`, **[dueño]**).
- Vistas previas del contenido: el material no tiene URL pública a la vista, y la cámara se lee por
  sus dibujos y sus nombres. El chef lo baja con un enlace firmado, como siempre.
- Subir a la cámara desde la app del teléfono, que es el siguiente encargo.
