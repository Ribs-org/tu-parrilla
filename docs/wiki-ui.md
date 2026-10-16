# La wiki de la UI: qué es y cómo se mantiene

`public/docs/ui/` describe, pantalla por pantalla, la interfaz para personas: el panel web y
la app del teléfono. Se sirve en <https://tu-parrilla.cl/docs/ui/index.md>.

**Quién la lee:** un LLM que guía a una persona que se perdió. Típicamente el agente que le
edita los videos a un creador —que ya lee las guías de la API de al lado—, cuando el creador
le pregunta «¿dónde genero una llave?» o «me salió un error rojo al programar». Ese LLM no ve
la pantalla ni tiene este repositorio: todo lo que sabe del panel es lo que dice la wiki. Por
eso cada botón va con su texto literal, y por eso una página desactualizada es peor que una
que no existe: el LLM manda a la persona a apretar un botón que ya no se llama así, con toda
la confianza del mundo.

## La revisión al terminar cada cambio

Antes de dar por terminado un cambio —el mismo momento en que se revisa la tabla de
`AGENTS.md`—, si el diff toca algo que una persona ve, se revisa la wiki:

1. **¿El diff toca la UI?** Cualquier archivo de `src/app/admin/`, `src/app/ingresar/`,
   `src/components/`, `mobile/src/`, o un `src/lib/` que ponga texto en pantalla (frases de
   error, avisos, el vocabulario). Si no, no hay nada que revisar.
2. **¿Qué página lo cuenta?** Cada página termina con «Para quien mantiene esta página», la
   lista de archivos de los que sale. Se encuentra así:
   `grep -rl "<ruta del archivo que tocaste>" public/docs/ui/`. Si un archivo no aparece en
   ningún pie y pone algo en pantalla, la página que corresponde tiene que sumarlo.
3. **¿Qué cambió para quien mira?** Un texto de botón, un campo, un mensaje de error, un paso
   más o uno menos, algo que ahora aparece solo en ciertos casos, una pantalla nueva. Eso se
   corrige en la página, en el mismo commit. Lo que no se ve —una consulta más rápida, un
   refactor— no se documenta.
4. **Navegación o vocabulario:** si cambió la barra, el botón de Ajustes, el nombre o el subtítulo de
   una pantalla (`src/lib/vocabulario.ts`), se actualizan `index.md` y la primera línea de la
   página de esa pantalla.
5. **En el informe**, una línea: «Wiki de la UI: actualicé `la-parrilla.md` (el botón nuevo)»
   o «Wiki de la UI: revisé, nada que actualizar».

`src/lib/docs-ui.test.ts` sostiene lo que se puede medir y falla si: una pantalla del
vocabulario no tiene página con su nombre, subtítulo y ruta; el índice no enlaza alguna
página; un enlace va a una página que no existe; o el pie de una página cita un archivo que
ya no existe (se renombró o se borró: la página casi seguro quedó vieja). Lo que el test no
puede ver —que el texto de un botón cambió— depende de la revisión de arriba.

## Cómo es una página

Cada pantalla del vocabulario tiene la suya. La primera línea es exactamente
`# <nombre> — <subtítulo>`, tal como los dice `src/lib/vocabulario.ts`, y la segunda empieza
con la ruta entre comillas invertidas y dice dónde está (pestaña de la barra, o dentro del
botón de Ajustes, y si es solo para el admin). Después, en este orden:

- Un párrafo: para qué sirve, en llano.
- `## Cómo se llega`
- `## Qué se ve`: de arriba abajo, por bloques, con cada título, botón, campo y casilla con
  su texto literal entre «». Lo que aparece solo en ciertos casos, con su condición.
- `## Qué se puede hacer`: una subsección `### Para …` por tarea, en pasos numerados.
- `## Mensajes que puede ver`: tabla `| Lo que dice la pantalla | Qué significa | Qué hacer |`.
- `## Si el humano dice…`: «no encuentro X» → dónde está o por qué no aparece.
- `## Lo que esta pantalla no hace`: para que el LLM no mande a buscar lo que no existe.
- `## Para quien mantiene esta página`: los archivos de los que sale, y la frase «Si cambias lo
  que se ve en alguno de ellos, actualiza esta página en el mismo commit.»

Las páginas que no son una pantalla del vocabulario (entrar, la app del teléfono) siguen el
mismo esqueleto con un título libre. Una pantalla nueva necesita su página **y** su enlace
en `index.md`.

Reglas de escritura:

- **Todo sale del código.** Cada texto entre «» existe tal cual en el código; si se arma con
  variables, se describe el patrón. Lo que no se pudo confirmar leyendo, no se escribe.
- Nada de detalles internos en el cuerpo (consultas, funciones): solo en el pie.
- Lo que también se puede hacer por API se enlaza a `../api-llm.md` o `../api-editor.md`, no
  se repite.
- Es pública, como las guías de la API: nada de secretos, correos ni datos de usuarios.
