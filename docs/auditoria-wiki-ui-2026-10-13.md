# Auditoría de la interfaz al escribir la wiki — 13 de octubre de 2026

Escribir `public/docs/ui/` obligó a leer cada pantalla del panel y de la app del teléfono
línea por línea, y de esa lectura salieron estos defectos. Ninguno se arregló en el mismo
cambio, salvo dos que eran de una línea (las tildes rotas de la página pública y
«Prendela»). La wiki describe la interfaz **como es hoy**, defectos incluidos: al arreglar
uno, se corrige también la página que lo cuenta.

Las líneas citadas son las del 2026-10-13. Cada entrada dice qué ve la persona, por qué
está mal y dónde está.

## 1. Cambian resultados o dejan a la persona sin salida

1. **Los Cortes: el link copiado pierde la atribución.** El botón de copiar entrega
   `<dominio del panel>/?s=<etiqueta>`, y en tu-parrilla.cl —el único dominio donde se abre
   el panel— la raíz es la portada del producto, que no anota visitas. Todo post que lleve
   ese link suma cero en «Visitas». Es el mismo error que ya se corrigió en el editor de
   perfil (ver `urlPublicaDe` en `src/lib/utils.ts`). Lo empujan además el aviso de
   `content/page.tsx:136` y el ejemplo `/?s=reel-gimnasio` de
   `src/components/charts/campaign-table.tsx:40`. Origen:
   `src/app/admin/(dash)/content/post-table.tsx:333`.
2. **App: «Contraseña incorrecta.» para cualquier error**, incluido el 503 «El servidor no
   pudo preparar tu ingreso.»: la persona cree que se equivocó de contraseña cuando el
   problema es el servidor. Es justo lo que el comentario de
   `src/app/api/mobile/session/route.ts:50-52` quería evitar. `mobile/src/lib/session.ts:34`.
3. **App: «Conecta una en la pestaña Cuentas.»** manda a una pestaña que solo muestra
   números; las redes se conectan en Los Fierros, en el panel web.
   `mobile/src/app/(tabs)/publicar.tsx:338-340`.
4. **Los Fierros: falsa alarma en X.** La tarjeta dice «vence hoy» apenas se conecta y a las
   dos horas queda gris, aunque X renueva su credencial sola al publicar. Es el mismo caso
   que se arregló para TikTok y YouTube en #154: `src/lib/parrilla.ts:291` exime solo a esas
   dos.
5. **Los Fierros: conexión vencida sin explicación.** Una cuenta vencida sin error de
   sincronización queda con la barra gris, el visto verde y ninguna frase; el color es la
   única señal, contra lo que pide el propio comentario de `cuentas.tsx:241-245`. En
   Threads y X pasa siempre. `src/app/admin/(dash)/accounts/cuentas.tsx:249-253, 292`.
6. **Los Fierros: el aviso de login vencido nunca sale.** Un login en la red que tarda más
   de diez minutos muestra «El estado no corresponde a esa red.», que no explica nada: la
   rama que daría la frase correcta (`src/app/api/social/[network]/callback/route.ts:575-580`)
   está muerta porque `src/lib/social/oauth-state.ts:42-48` se traga el vencimiento.
7. **Los Fierros: la baja desde Facebook no se dice.** La tarjeta muestra «La conexión falló;
   reconecta la cuenta.»; el motivo («Quitaste la app desde Facebook: vuelve a conectar.»,
   que deja `src/lib/social/meta-bajas.ts:22-24`) sale solo al pasar el mouse.
8. **Los Fierros: una cuenta tomada por otro usuario no se libera nunca.** «Esa cuenta ya
   está conectada por otra persona.» sigue aunque el otro la desconecte, porque la fila
   conserva su dueño. Es la limitación conocida de la entrega 3, pero la persona no tiene
   salida desde el panel. `src/lib/social/conectar.ts:487`.
9. **Tu Cuenta: el selector cambia la zona sin que nadie lo note.** Si la zona guardada es un
   alias que `Intl.supportedValuesOf` no lista (por ejemplo `UTC`, con
   `SITE_TIMEZONE=UTC`), el selector muestra «Africa/Abidjan» y «Guardar» la cambia aunque
   solo se haya editado el nombre. `src/app/admin/(dash)/cuenta/formulario.tsx:30`,
   `src/lib/zona.ts:55`.
10. **La Vitrina: «Cambiar la URL secreta» se deshace sola.** El campo «URL» se carga una
    sola vez al abrir el editor: tras cambiar la URL secreta sigue mostrando la vieja, y
    «Guardar perfil» la restaura. `src/app/admin/(dash)/profiles/[id]/editor.tsx:57-67,
    390-393`.
11. **La Vitrina: «Publicado» apagado no siempre oculta.** La principal del dueño sigue
    saliendo en `/` de su dominio propio aunque esté apagada, contra la ayuda «Si lo apagas,
    la URL responde 404» (`editor.tsx:252`). `src/app/page.tsx:46-48`,
    `src/lib/profiles.ts:26-33`.
12. **La Parrilla: se programa lo que va a fallar.** YouTube acepta un post con solo fotos y
    Facebook acepta video con fotos; los dos pasan al programar y se queman al publicar,
    después de tres intentos («YouTube solo recibe video.», «Facebook no admite mezclar
    video y fotos en un post.»). `src/lib/social/publish/validate.ts`.
13. **La Parrilla: un error manda a hacer algo imposible.** «TikTok ya no permite esa
    privacidad en tu cuenta; edita la publicación.», pero el editor no deja cambiar las
    opciones de TikTok. `src/lib/social/publish/tiktok.ts:10`.
14. **La Parrilla: borrar no pide confirmación**, en la lista y en el editor, mientras «Subir
    ahora» sí pregunta. `src/app/admin/(dash)/schedule/queue.tsx:91-97`,
    `schedule/[id]/editor.tsx:290`.
15. **La Parrilla: «Reprogramar» mueve el post entero**, no solo la red que falló: las redes
    que ya salieron no se republican, pero su hora en el calendario, en El Fuego y en el
    pie de «ayer» se corre a la nueva. Y con todo publicado, el editor deja cambiar la fecha.
    `src/app/admin/actions.ts:898-906, 1124`.

## 2. Textos que dicen algo que no es cierto

- **Nombres viejos de pantallas.** «Cuentas» por Los Fierros: `src/lib/social/cuentas.ts:32`
  (llega también por la API: revisar `public/docs/api-llm.md` al cambiarla),
  `src/app/admin/actions.ts:461`, `src/lib/social/publish/tiktok-creador.ts:21` y el enlace
  de `schedule/batch-upload.tsx`. «Perfiles» por La Vitrina: `profiles/[id]/editor.tsx:420`,
  `src/app/admin/actions.ts:225`.
- **La Vitrina: «El perfil principal se sirve en /…»** (`profiles/page.tsx:38-41, 100, 104`):
  falso para los invitados y para cualquiera en tu-parrilla.cl, donde la raíz es la portada.
- **Tu Cuenta: «Con el que apareces en el panel.»** (`cuenta/formulario.tsx:26`): ese nombre
  solo se ve en la lista de Los Maestros.
- **Los Maestros: «Invitado. Le llegó su primer código.»** (`usuarios/formularios.tsx:16`):
  solo se sabe que el envío salió, no que llegó.
- **La Mesa: «Los nuevos llegan cada cinco minutos.»** (`comments/cola.tsx:142`): YouTube se
  revisa cada media hora.
- **La Parrilla: el ejemplo del CSV** tiene fechas de septiembre (copiado tal cual, todas las
  filas fallan por hora) y la ayuda no nombra las columnas sexta y séptima, que hacen falta
  en el encabezado para usar la octava. `schedule/batch-upload.tsx:8-11, 23-31`.
- **Los Cortes: la explicación de «Tus posts»** dice que sale «—» cuando el crecimiento no se
  puede saber (lo que pasa es que falta el «+N»), y que «Incluir anteriores» suma lo que
  sigue con actividad (trae las 200 más recientes). El mensaje de lista vacía pide activar
  «Incluir anteriores» aunque ya esté activo. `content/page.tsx:186, 256`.
- **Los Cortes: «Views ganadas por día»** con el rango «Todo», donde cada punto es una semana.
  `content/page.tsx:267`.
- **Los Cortes: «Se pasó»** dice «Más del doble», pero alcanza con el doble justo.
  `content/post-table.tsx:199`.
- **Los Números: «la sincronización de esta noche»** (`analytics/accounts.tsx:25`): corre a las
  9:00 UTC, de madrugada en Chile.
- **Los Números: «Sin tráfico en este período.»** bajo las tarjetas de cuentas cuando solo hay
  Facebook: esas cifras no son tráfico. `analytics/accounts.tsx:75`.
- **404: «Ir al inicio»** lleva a `/`, que en tu-parrilla.cl es la portada del producto, también
  cuando se llega desde un enlace muerto del panel. `src/app/not-found.tsx:26`.
- **Correo de falla:** el asunto escribe «Youtube» y «Tiktok». `src/lib/social/publish/alert.ts:8`.

## 3. Números que no cuadran

- **Una baja de seguidores se ve como «sin cambio»**: el cálculo lleva los negativos a cero.
  `src/lib/account-stats.ts:51`, `src/lib/social/delta.ts:51`.
- **Dos cuentas de la misma red mezclan sus lecturas** en una tarjeta (ya en
  `docs/deuda-tecnica.md`, «Las métricas siguen agrupadas por red»).
- **El arrastre total puede salir inflado**: el numerador cuenta visitas de filas sin views
  ganadas. `src/lib/posts-kpis.ts:105`.
- **Las tres primeras cifras de Los Cortes muestran «0» sin datos**, contra la regla de «—,
  nunca 0». `content/page.tsx:158-166`.
- **«Todavía no llega tráfico etiquetado.»** sale solo cuando no hay ninguna visita: las sin
  etiqueta van a «(sin etiqueta)». `campaign-table.tsx`.
- **El anillo puede mostrar dos «Otro».** `src/components/charts/donut.tsx:21`.

## 4. Flujos y detalles

- **Entrar:** el correo del código no trae enlace ni dirección (`src/lib/usuarios.ts:249-250`);
  la pantalla del código no dice a qué correo se mandó (`ingresar/formularios.tsx:33-34`); y
  la frase de sesión vencida existe pero no se usa, así que quien pierde la sesión cae en
  «Entra con tu correo» sin explicación (`src/lib/ingreso.ts:11`).
- **Los Maestros:** las fechas salen en la zona del servidor, no en la de quien mira
  (`usuarios/page.tsx:9`).
- **La Mesa:** «Enviar» dice «Enviando…» al apretar «Descartar» o «Reintentar borrador»
  (`comments/cola.tsx:254`).
- **La Parrilla:** un solo estado de espera para toda la lista: al «Eliminar» un post, todos
  los «Subir ahora» dicen «Subiendo…» (`queue.tsx:26, 88`); y el aviso del contenido
  patrocinado sale antes de elegir privacidad (`tiktok-opciones.tsx:184-187`).
- **Los Cortes:** con el filtro de red puesto y una sola red en la lista, desaparecen los
  botones de red y con ellos «Todas» (`content/page.tsx:212`); un post de Instagram con texto
  vacío deja la línea en blanco en vez de «Sin descripción» (`post-table.tsx:180, 184`;
  `campaign-table.tsx:111`); en la vista normal casi todas las filas llevan «nuevo»; el
  mensaje «Todavía no hay posts sincronizados…» nunca se ve, porque la página muestra antes
  el suyo (`post-table.tsx:56-69`, `content/page.tsx:253`).
- **La Vitrina:** la vista previa muestra los links fuera de sus fechas
  (`profiles/[id]/editor.tsx:107-121`); el interruptor de un link guarda también lo editado
  sin «Guardar link» y se traga los errores (`link-row.tsx:99-117`); los tipos de link se
  llaman distinto al agregar y al editar (`editor.tsx:332-335`, `link-row.tsx:26-31`).
- **App:** «Contenido» ofrece Threads y X, que no se conectan, y no ofrece TikTok
  (`(tabs)/contenido.tsx:24`); «Reintentar» reenvía el texto, las cuentas y la hora del
  primer intento aunque se hayan editado (`(tabs)/publicar.tsx:189-200, 236-241`); solo
  «Resumen» avisa «No se pudo actualizar.» cuando falla la actualización.
