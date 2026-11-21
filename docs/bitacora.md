# Bitácora

Registro cronológico de las decisiones de diseño de Pulse y del porqué de cada una. Las decisiones formales se recogen además como ADR en [`adr/`](adr/README.md).

---

## 2026-11-19 — Arranque del proyecto

Todo diseño empieza por conocer y entender bien los casos de uso. Para los tests de aceptación he elegido Gherkin porque se pueden automatizar más adelante: así puedo automatizar los casos de uso más importantes y tener una red de seguridad.

Todo proyecto empieza también con una convención de commits, para que todos se escriban de la misma forma y el changelog se genere solo, y con un CI inicial que nos acompañe hasta que la arquitectura y el stack estén más definidos. La idea es tener una base pequeñita pero consistente sobre la que empezar a desarrollar la arquitectura.

En esta primera parte tenemos:

- Los [tests de aceptación](../acceptance-test/), es decir, los tests de usuario de los que se derivará absolutamente todo.
- Un [ADR](adr/0001-use-conventional-commits.md) que establece que el proyecto usa una convención de commits para automatizar el changelog.
- El setup inicial del CI, que valida esos commits y pone en marcha release-please. Con él entramos desde el principio en el ciclo de vida de la aplicación, para que la release esté lista cuando la queramos.
- Por otro lado, me gusta diseñar el arnés alrededor de los ADR. Así el proyecto es consistente y no hacen falta ficheros específicos para agentes: el [`CLAUDE.md`](../CLAUDE.md) solo pide seguir los ADR y, como están [indexados](adr/README.md), el agente los va descubriendo de forma progresiva a medida que los necesita.

---

## 2026-11-20 — Arquitectura y stack

Con los casos de uso definidos, toca elegir la arquitectura y el stack. Lo primero que define la arquitectura de un sistema es si es pesado en lectura o en escritura.

Por la naturaleza de este proyecto, Pulse es claramente de **lectura pesada**:

- **Escritura:** las asesorías generan sus métricas en *batches* mensuales. Es una carga poco frecuente y predecible, no un flujo de transacciones concurrentes.
- **Lectura:** un manager necesita conocer el estado de la red, el detalle de cada asesoría y las agregaciones (totales, medias ponderadas, evolución mensual, comparación con hace seis meses).

Esto pone el peso del sistema en el **modelo de datos**: ahí vivirán las agregaciones y es lo que soportará la parte más pesada. Hay que tener especial cuidado al diseñarlo. En cambio, los servicios apenas tendrán lógica de negocio: casi todo es leer, agregar y presentar.

### Por qué valoré Go

Mi primera idea fue Go en el backend y React en el frontend. Go tenía argumentos sólidos:

- Compila a un binario estático, con imágenes Docker mínimas (unos 15 MB) y un arranque casi instantáneo, lo que encaja muy bien con `docker compose up` y un CI rápido.
- Tipado fuerte y un ecosistema de acceso a datos muy honesto: `sqlc` genera código tipado a partir de SQL escrito a mano y lo valida contra el esquema al compilar, y `goose` gestiona migraciones en SQL puro embebidas en el binario.
- Rendimiento y concurrencia excelentes.

### Por qué no Go

Viendo el perfil de la aplicación, esas ventajas no aplican. Concurrencia y velocidad no significan nada para una herramienta interna con un único usuario, en la que lo pesado vive en la base de datos. A cambio, tener dos lenguajes supone mantener dos toolings: dos linters, dos frameworks de test, dos gestores de dependencias, dos formas de construir imágenes y un contrato entre front y back que hay que sincronizar.

### Decisión

Uso un **stack full TypeScript**. Así no tengo que mantener dos toolings, puedo compartir tipos y contratos entre frontend y backend, y se facilita la entrada de personas al proyecto, porque basta con conocer un lenguaje.

En concreto:

1. **Frontend en React.**
2. **Backend en Node.js.**
3. **Un design system.** Asevia es una empresa con múltiples productos que itera rápido. Un design system simplifica mucho las decisiones de diseño, estilo e imagen de marca: los componentes y sus reglas se deciden una vez y se reutilizan en todos los productos, en vez de rediseñarlos en cada iteración.

### Construir producto desde el minuto uno

Otra parte importante del diseño es **cómo** se construye. Desde el minuto uno se construye producto: no se hace primero el backend y luego el frontend, ni se termina una capa para empezar la siguiente.

La idea es aportar valor desde el inicio para poder iterar sobre las ideas:

- **Primero, un mínimo desplegado de punta a punta:** base de datos, API, frontend, CI y despliegue conectados, aunque solo muestren algo muy pequeño. A partir de ahí el producto ya está vivo y entra en un ciclo de release constante.
- **Después, piezas usables:** cada incremento es una porción vertical que atraviesa todas las capas (por ejemplo, "ver el listado de asesorías" y después "filtrar por provincia"), conectada al CI y desplegada. Nada se queda a medias en una rama esperando a que otra parte esté lista.
- **Los casos de uso marcan el orden:** cada pieza corresponde a uno o varios escenarios de los [tests de aceptación](../acceptance-test/), así que se sabe cuándo está terminada.

Así el software crece por piezas que funcionan, cada release se puede enseñar y validar, y los problemas de integración aparecen el primer día, no al final.

### Decisiones de arquitectura

Todas las decisiones de arquitectura de esta fase están escritas como ADR, con su contexto, las alternativas que valoré y sus consecuencias:

- [ADR-0001](adr/0001-use-conventional-commits.md): Conventional Commits para automatizar el changelog, y versionado del monorepo (la aplicación con una versión común y el design system con la suya).
- [ADR-0002](adr/0002-use-typescript-across-the-project.md): TypeScript en todo el proyecto, y por qué descarté Go.
- [ADR-0003](adr/0003-backend-hono-modular-monolith.md): backend como monolito modular en Hono, con arquitectura hexagonal, screaming architecture y vertical slicing, y OpenAPI generado automáticamente.
- [ADR-0004](adr/0004-frontend-react-redux-observable.md): frontend en React con Redux y redux-observable, componentes tontos y efectos secundarios detrás de interfaces.
- [ADR-0005](adr/0005-use-postgresql.md): PostgreSQL como base de datos.
- [ADR-0006](adr/0006-quality-and-observability.md): calidad con SonarQube Cloud y observabilidad con Sentry, sin analítica de comportamiento porque el usuario es un manager con el que tenemos contacto directo.
- [ADR-0007](adr/0007-design-system-react-aria-tokens.md): design system sobre React Aria Components, CSS Modules y tokens de diseño, accesible, responsive y con Storybook como catálogo.
- [ADR-0008](adr/0008-infrastructure-docker-compose-and-k3s.md): Docker Compose para desarrollo local y Kubernetes (k3s) en un VPS para el despliegue, con las imágenes en GitHub Container Registry.

El modelo de datos no está decidido todavía: se irá diseñando a medida que descubramos el problema, porción a porción.

---

## 2026-11-21 — Setup compartido del monorepo

Con la arquitectura diseñada y las decisiones escritas como ADR, el primer paso de construcción es montar el setup compartido. Como decidí que todo el proyecto sería TypeScript ([ADR-0002](adr/0002-use-typescript-across-the-project.md)), todos los proyectos pueden compartir un único tooling, y lo monto una sola vez en la raíz antes de crear ningún proyecto:

- **Workspace de pnpm** (`apps/*` y `packages/*`): una sola instalación y un único lockfile para todo el repo, y proyectos enlazados entre sí sin publicarlos.
- **`tsconfig.base.json`**: una única fuente de verdad para las reglas del compilador (`strict`, `noUncheckedIndexedAccess`). Cada proyecto la extiende y solo añade lo suyo, así el rigor es el mismo en todo el repo y no se desalinea con el tiempo.
- **ESLint, Prettier y Vitest** instalados en la raíz, con una sola versión y una sola configuración para todos los proyectos.
- **CI** que comprueba formato, lint y tipos en cada PR y en cada push a `main`. Los tests están preparados pero desactivados: Vitest no arranca sin proyectos, así que se activan con el primer proyecto, junto con la publicación de la cobertura, que después leerá Sonar.

---

## 2026-11-21 — Contratos compartidos

El primer proyecto del monorepo es `packages/contracts`: los esquemas que comparten la API y la web. Elegí compartir **esquemas zod** en un paquete propio, y no compartir tipos por RPC (importar la API desde la web), por tres motivos:

- **Un esquema sirve para todo:** valida las peticiones en la API, genera el OpenAPI y da los tipos a la web. Con RPC solo se comparten tipos, que desaparecen al ejecutar, y harían falta igualmente esquemas para validar y documentar.
- **Sin acoplamiento:** ni la API ni la web conocen el código de la otra, solo el contrato. Así se pueden separar en repos distintos sin reescribir nada.
- **Cualquiera puede consumir la API:** REST con OpenAPI vale para otros productos, otros lenguajes y los tests E2E, no solo para clientes TypeScript.

Los contratos de negocio todavía no los conocemos: saldrán al construir cada porción. De momento el paquete solo tiene lo que ya está decidido: `Problem`, el formato de error RFC 9457 de todas las respuestas de error, y `Health`, el primer contrato del *walking skeleton*, que conecta la API con la web desde el primer día.

Con el primer proyecto, el CI ya ejecuta los tests y publica la cobertura.

---

## 2026-11-21 — Esqueleto de la API

El segundo proyecto es `apps/api`, el primer paso del *walking skeleton*: una API mínima pero completa, que se construye, se empaqueta en una imagen y se publica en cada release.

La estructura sigue el [ADR-0003](adr/0003-backend-hono-modular-monolith.md) desde el primer día. Aunque `health` es trivial, lo monté como un módulo más para que el patrón quede visible y el resto de módulos lo copien:

- **Casos de uso como funciones**, no como clases. Un caso de uso es una sola operación, así que una función lo expresa sin ceremonia. Cuando necesite dependencias, una factoría las recibe y las cierra en un *closure*.
- **Puertos según su dirección.** Los de entrada (lo que el módulo ofrece) son el tipo del caso de uso y viven junto a él en `application/`. Los de salida (lo que el módulo necesita de fuera, como un repositorio) se definen en `domain/` y se implementan en `infrastructure/`. La infraestructura técnica que solo usa el *composition root* (crear la app, arrancar el servidor) no lleva interfaz: nadie del núcleo depende de ella.
- **Un `index.ts` por caso de uso o adaptador.** El nombre de la carpeta ya dice qué es, así que los imports se leen como la arquitectura (`@health/application/check-health`). Nunca un `index.ts` por capa o módulo, para no romper los límites.
- **`main.ts` solo conecta piezas.** No conoce Hono ni Node.
- **Sin comentarios en el código.** Los nombres tienen que explicarlo.

La API se versiona en la URL (`/api/v1`): `/api` la separa de la web en el mismo dominio y `/v1` es la versión del contrato. El OpenAPI y Swagger se generan solos y muestran esa versión.

Para el empaquetado, el build mete todas las dependencias en un único fichero, así que la imagen final solo lleva Node y ese fichero: sin `node_modules`, sin pnpm, y con un usuario sin privilegios. `docker compose up` ya levanta la API, y el resto de piezas se irán sumando.

Cada release de la API publica su imagen en GitHub Container Registry con tres tags: la versión, el commit y `latest`. La publicación va en el mismo workflow que release-please, porque lo que crea el `GITHUB_TOKEN` no dispara otros workflows. Además, el CI construye la imagen en cada PR, para detectar un Dockerfile roto antes de la release. La API y los contratos comparten versión, como dice el [ADR-0001](adr/0001-use-conventional-commits.md).

Con la imagen publicada, el último paso del esqueleto es verla desplegada. Cada release de la API se despliega sola en k3s, en el VPS, como dice el [ADR-0008](adr/0008-infrastructure-docker-compose-and-k3s.md), con algunas adaptaciones al servidor que ya tenía:

- **k3s detrás del Caddy existente.** El VPS ya sirve otra aplicación, cuyo Caddy ocupa los puertos 80 y 443. En lugar de quitarlo, instalé k3s sin Traefik y Caddy sirve Pulse desde su propio fichero de sitio, con HTTPS automático. La API se expone en k3s con una IP interna fija, así que no abre ningún puerto a internet.
- **Despliegue por SSH con una clave restringida.** El CI entra con una clave que solo puede ejecutar el script de despliegue: recibe los manifiestos, los aplica y espera a que el *rollout* termine. La API de Kubernetes queda cerrada a internet.
- **Imagen privada con un token de solo lectura.** El clúster descarga la imagen con un token que solo tiene `read:packages`, nunca con un token personal.

Los manifiestos viven en el repo (`deploy/k8s/`), igual que el script y la configuración de Caddy (`deploy/vps/`), así que el despliegue se puede reconstruir desde el código.

---

## 2026-11-21 — Esqueleto del design system

El tercer proyecto es `packages/design-system`, siguiendo el [ADR-0007](adr/0007-design-system-react-aria-tokens.md). Igual que con la API, el objetivo no es tener muchos componentes, sino fijar el patrón y tenerlo publicado desde el primer día, para que crezca componente a componente a medida que lo pidan las porciones.

- **Tokens en tres niveles.** Los primitivos recogen la identidad de la marca: la paleta sacada de su web y la tipografía Figtree, cargada desde Google Fonts. Los semánticos dan significado a esos valores (texto, superficies, acciones, foco), y los componentes solo usan estos. Así se puede cambiar la imagen sin tocar ningún componente. Cada par de texto y fondo cumple el contraste AA: el acento claro de la marca lleva texto oscuro, no blanco.
- **Un primer componente como patrón.** `Button` envuelve el de React Aria, que aporta el teclado, el foco y la semántica accesible. Sus estilos viven en un CSS Module que solo consume tokens, y los estados se estilan con los atributos que expone React Aria. Llega con sus historias y con tests que incluyen una comprobación automática de accesibilidad.
- **Storybook como catálogo vivo.** Con el addon de accesibilidad, cualquier violación aparece como error en cada historia.

Storybook también se publica. Se construye como una imagen propia (los ficheros estáticos servidos con nginx), `docker compose up` lo levanta junto a la API, y cada release del design system lo despliega en k3s con su propio subdominio, para que el equipo pueda verlo sin instalar nada. El design system tiene versión propia, independiente de la aplicación, como dice el [ADR-0001](adr/0001-use-conventional-commits.md).

Para no repetir la publicación de imágenes, la API y Storybook comparten un workflow reutilizable que construye la imagen y la publica con sus tres tags. El despliegue se lanza cuando hay release de cualquiera de los dos, y fija siempre ambas imágenes a la versión que indica el manifest de release-please.

---

## 2026-11-21 — SCSS y BEM para los estilos

Con el primer componente ya escrito, decido que todos los estilos del proyecto se escriben en **SCSS** y que los nombres de clase siguen **BEM**. Lo recojo en el [ADR-0009](adr/0009-scss-and-bem-for-styles.md).

- **SCSS para escribir mejor:** el anidamiento y el selector padre (`&`) agrupan en un solo sitio todo lo de un componente (sus elementos, variantes y estados), y los mixins evitan copiar la misma lógica, como el anillo de foco.
- **BEM para nombrar igual en todas partes:** un bloque por componente, elementos con `__` y variantes como modificadores con `--`. Los estados de interacción no son modificadores: los da React Aria con sus atributos.
- **No cambia lo que ya funcionaba:** cada componente sigue siendo un CSS Module, que aísla sus estilos, y los tokens siguen siendo variables CSS, que se pueden cambiar en tiempo de ejecución. Las variables de SCSS no se usan para decisiones de diseño.

He migrado los tokens y el `Button` a esta forma de escribir, y he centrado los componentes en Storybook para verlos mejor.

---

## 2026-11-21 — Esqueleto de la web

La última pieza del *walking skeleton* es `apps/web`, siguiendo el [ADR-0004](adr/0004-frontend-react-redux-observable.md). Muestra una sola cosa, el estado de la API, pero recorre todo el camino: la web llama a la API, valida la respuesta con el contrato compartido y la pinta con el design system.

Elegí una *screaming architecture* lo más simple posible. Cada feature es una carpeta con su componente tonto, su container, su slice, sus epics y sus tests, y nada más. Lo que comparten las features vive en `shared/`:

- **Un único módulo `api`.** Es lo que se inyecta a los epics, en vez de que cada feature tenga su propio cliente. Cada entidad tiene su fichero, con un objeto del mismo nombre y sus verbos (`api.health.get()`), y lo común (la URL base, el cuerpo JSON, los errores y la validación con el contrato) está en un solo sitio. En los tests, la API es un objeto en memoria con solo lo que usa cada caso, así que ninguna feature necesita backend para probarse.
- **Un módulo `config`** que lee en tiempo de ejecución la URL de la API. La misma imagen sirve para cualquier entorno: el contenedor genera la configuración al arrancar a partir de sus variables de entorno.

En local, con `docker compose`, la web llama directamente a la API en otro puerto, así que la API activa CORS solo en desarrollo (`NODE_ENV=development`) y solo para el origen de la web. En producción, en k3s, la web y la API comparten dominio y no hace falta CORS.

Los tests cubren cada nivel: el componente tonto, los epics con *marble testing* (incluida la cancelación de una petición pendiente) y la feature completa con el store real y la API en memoria. La web entra en la versión enlazada de la aplicación, junto con la API y los contratos, y se publica y despliega igual que el resto.

---

## 2026-11-21 — Base de datos

Para tener usuarios registrados y sesiones de verdad empieza a hacer falta la base de datos, así que la monto antes que el login, como una pieza de infraestructura sin lógica de negocio.

- **PostgreSQL con `pgvector` y `unaccent`**, como dice el [ADR-0005](adr/0005-use-postgresql.md). En local es un servicio más de `docker compose`; en k3s, un StatefulSet con su volumen persistente y la contraseña en un Secret que nunca pasa por el repositorio.
- **Drizzle para el acceso a datos y las migraciones**, que recojo en el [ADR-0010](adr/0010-drizzle-for-data-access-and-migrations.md): el esquema tipado vive en el módulo dueño de las tablas, solo los repositorios lo importan, y las migraciones son ficheros SQL revisables en el repositorio. La primera crea las extensiones.
- **Las migraciones se aplican antes de que arranque la API**, nunca al arrancar: en compose, un servicio de un solo uso del que depende la API; en k3s, un Job que el despliegue espera antes de actualizar la API.
- **El health comprueba la base de datos.** Es el primer puerto de salida del proyecto: `checkHealth` recibe una lista de indicadores y no sabe nada de Postgres. Si la base de datos cae, la API responde `503` con `down` y Kubernetes deja de enviarle tráfico, pero no la reinicia, porque el problema no es de la API.

Todo lo de la base de datos vive junto en `shared/infrastructure/database`: el cliente, el comando que aplica las migraciones, la configuración de drizzle-kit y las propias migraciones. Los comandos de terminal no van sueltos en la raíz de `src`: son puertas de entrada a la aplicación, igual que HTTP, así que cada uno vive con el módulo al que pertenece.

Con esto llega también el primer test de integración contra una base de datos real, levantada con testcontainers: aplica las migraciones y comprueba el indicador de salud.

---

## 2026-11-21 — Login en la API

Pulse es una herramienta interna, así que solo pueden entrar usuarios registrados. El registro queda fuera de alcance: los usuarios se crean con un comando de la API (`create-user`), que lee la contraseña de la entrada estándar para que no quede en el historial de la terminal.

La decisión está en el [ADR-0011](adr/0011-authentication-with-jwt-cookie-and-database-sessions.md). Lo importante:

- **El token va en una cookie `HttpOnly`, `Secure` y `SameSite=Strict`.** JavaScript no puede leerla, así que un fallo de XSS no roba la sesión, y el navegador no la envía desde otras webs, lo que corta el CSRF. Nunca viaja en el cuerpo de la respuesta ni en `localStorage`.
- **JWT y sesión en base de datos a la vez.** El JWT solo lleva el usuario y el id de la sesión, y la API rechaza sin tocar la base de datos cualquier token falsificado o caducado. Para los válidos comprueba además que la sesión sigue activa, así que cerrar sesión la revoca en el momento, aunque alguien hubiera copiado el token.
- **Las contraseñas se guardan con scrypt**, con una sal por contraseña. Un login fallido responde igual y tarda lo mismo exista o no el email, para no revelar qué usuarios hay.
- **Un recurso, tres verbos:** `POST /session` inicia sesión, `GET /session` dice quién soy y `DELETE /session` la cierra.

El módulo `auth` sigue la misma estructura que `health`: los puertos (`UserRepository`, `SessionRepository`, `PasswordHasher`, `TokenSigner`) en el dominio y los casos de uso como funciones. En infraestructura, cada carpeta lleva el nombre del puerto que implementa: `repository/` con sus adaptadores de Postgres y en memoria, y en `health`, `indicator/` con el de Postgres. El repositorio en memoria no es un doble de test escondido en otra carpeta, sino un adaptador más que cumple el mismo contrato: los casos de uso se prueban con él y con la criptografía real, y el de Postgres contra una base de datos real.

Queda pendiente limitar los intentos de login antes de abrir la herramienta más allá del uso interno.

---

## 2026-11-21 — Login en la web

La web ya no se ve sin sesión: quien llega sin ella va a `/login`, y tras entrar vuelve a la aplicación con su email y un botón para cerrar sesión en la cabecera.

- **Dos features que dicen lo que hacen:** `login` inicia sesión, y `session` sabe si hay una sesión activa, protege las rutas y la cierra. Cuando el login tiene éxito, `session` lo escucha y pasa a estar autenticada, así que `login` no depende de ella. Las rutas protegidas cuelgan de un contenedor que comprueba la sesión al cargar y redirige al login si no la hay.
- **El token nunca pasa por JavaScript.** La web solo envía las peticiones con `credentials: 'include'` y el navegador adjunta la cookie; el estado de Redux guarda el usuario, no el token.
- **El formulario distingue dos fallos:** credenciales incorrectas, o una API que no responde. Mientras se envía, el botón queda deshabilitado y el epic ignora nuevos intentos (`exhaustMap`), así que un doble clic no abre dos sesiones.
- **Cerrar sesión siempre cierra en la web**, aunque la API no responda: el usuario no se queda atrapado en una sesión que quiere terminar.
- **El design system crece con un `TextField`** sobre React Aria, con su etiqueta y su mensaje de error accesibles, sus historias y su test de axe.

La `api` compartida suma `session` con sus tres verbos.

**Cada fichero de la web tiene su propio test, con el mismo nombre y al lado.** Así se entiende qué hace cada pieza leyendo solo su test: el componente tonto, con props; el contenedor, con un store real; el slice, acción a acción; y los epics, con tests de canicas. Las utilidades comunes (la API falsa, `expectEpic` y el render con store y router) están en `shared/testing`. El recorrido completo de entrar, ver la app y salir quedará para los tests E2E.
