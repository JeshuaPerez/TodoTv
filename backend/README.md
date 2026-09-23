# TodoTv

API REST y aplicación web para gestionar información de programas de televisión:
catálogo por categorías, capítulos, reparto, productoras y favoritos por usuario.

Node.js con ESM, Express y el driver nativo de MongoDB. Sin mongoose y sin frameworks
en el frontend.

## Requisitos

- Node.js 20 o superior.
- Una base MongoDB con replica set. Las transacciones no funcionan en un `mongod`
  suelto, por eso MongoDB Atlas (el plan gratuito ya viene con replica set).

## Instalación

```bash
npm install
cp .env.example .env     # y completá los valores
npm run indices          # crea los índices únicos
npm run semilla          # datos de ejemplo (idempotente)
npm run inicio
```

La aplicación queda en `http://localhost:3000` y la documentación interactiva en
`http://localhost:3000/api/docs`.

Usuarios que deja la semilla:

| rol | correo | contraseña |
|---|---|---|
| administrador | admin@todotv.test | Admin1234 |
| usuario | demo@todotv.test | Demo1234 |

## Variables de entorno

| variable | por defecto | para qué |
|---|---|---|
| `PUERTO` | 3000 | puerto del servidor |
| `ENTORNO` | desarrollo | `produccion` activa la cookie `secure` |
| `MONGO_URI` | — | obligatoria, cadena de conexión de Atlas |
| `MONGO_BASE` | todotv | nombre de la base |
| `JWT_SECRETO` | — | obligatoria, secreto para firmar los tokens |
| `JWT_EXPIRACION` | 2h | vida del token y de la cookie |
| `COOKIE_NOMBRE` | todotv_token | nombre de la cookie de sesión |
| `API_VERSION` | 1.0.0 | versión que se negocia con semver |
| `LIMITE_VENTANA_MINUTOS` | 15 | ventana del límite de peticiones |
| `LIMITE_GLOBAL` | 300 | peticiones por ventana e IP |
| `LIMITE_AUTENTICACION` | 10 | intentos de registro e inicio de sesión |

Si cambiás `PUERTO`, acordate de que la interfaz de [frontend/](../frontend) corre al mismo
tiempo en el 4000 y reenvía `/api` al 3000: hay que mover su `API_DESTINO` al puerto nuevo,
y el valor no puede ser el 4000 porque ese lo ocupa la interfaz.

## Scripts

| comando | qué hace |
|---|---|
| `npm run inicio` | levanta el servidor |
| `npm run desarrollo` | igual, recargando con `--watch` |
| `npm run demo` | levanta la API con MongoDB en memoria y datos de ejemplo, sin Atlas |
| `npm run indices` | crea o confirma los índices |
| `npm run semilla` | carga datos de ejemplo sin duplicar nada |
| `npm run semilla:reset` | vacía las colecciones y vuelve a cargarlas |
| `npm run pruebas` | 65 pruebas de integración contra un MongoMemoryReplSet |
| `npm run simulacion` | recorre el consumo del frontend, incluida la caída de la base |

Las pruebas y la simulación levantan su propio MongoDB en memoria: no tocan la base real
ni necesitan que el servidor esté corriendo.

## Endpoints

Todo cuelga de `/api`. Leer el catálogo es público, escribirlo es solo del administrador
y los favoritos piden sesión.

### Autenticación

| método | ruta | quién |
|---|---|---|
| POST | `/api/autenticacion/registro` | cualquiera |
| POST | `/api/autenticacion/inicio-sesion` | cualquiera |
| POST | `/api/autenticacion/cierre-sesion` | cualquiera |
| GET | `/api/autenticacion/perfil` | con sesión |

### Catálogo

| método | ruta | quién |
|---|---|---|
| GET | `/api/programas?categoria=&texto=` | público |
| GET | `/api/programas/:id` | público |
| GET | `/api/programas/:id/capitulos` | público |
| GET | `/api/programas/:id/personajes` | público |
| POST/PUT/DELETE | `/api/programas/:id` | administrador |
| GET · POST/PUT/DELETE | `/api/categorias` | público · administrador |
| GET · POST/PUT/DELETE | `/api/productoras` | público · administrador |
| GET · POST/PUT/DELETE | `/api/actores?texto=` | público · administrador |
| GET · POST/PUT/DELETE | `/api/capitulos` | público · administrador |
| GET · POST/PUT/DELETE | `/api/personajes` | público · administrador |

### Favoritos

| método | ruta | quién |
|---|---|---|
| GET | `/api/favoritos` | con sesión |
| POST | `/api/favoritos/:programaId` | con sesión |
| DELETE | `/api/favoritos/:programaId` | con sesión |

### Errores

Todos salen con la misma forma y el código HTTP fijo de su clase:

```json
{ "error": { "codigo": "DUPLICADO", "mensaje": "Ya existe un programa con ese título" } }
```

| código | HTTP | cuándo |
|---|---|---|
| `VALIDACION` | 400 | datos mal formados, con `detalles` por campo |
| `NO_AUTENTICADO` | 401 | falta la cookie o el token no sirve |
| `NO_AUTORIZADO` | 403 | hay sesión pero no alcanza el rol |
| `NO_ENCONTRADO` | 404 | el recurso o la ruta no existen |
| `DUPLICADO` | 409 | chocó contra un índice único |
| `EN_USO` | 409 | se quiso borrar algo que otro recurso usa |
| `VERSION_NO_COMPATIBLE` | 409 | el cliente pide una versión que la API no habla |
| `DEMASIADAS_PETICIONES` | 429 | se pasó del límite |
| `BASE_DE_DATOS` | 503 | la base no responde |

### Versionado

El cliente manda la versión que acepta en la cabecera `Accept-Version`, con cualquier
rango que entienda semver (`1.x`, `^1.0.0`, `1.0.0`). Si la versión de la API no lo
satisface, la respuesta es 409. Sin cabecera se asume la versión actual, que siempre
viaja de vuelta en `X-API-Version`.

## Interfaz

Hay dos interfaces sobre esta misma API:

- la que sirve este servidor en `publico/`, descrita acá abajo;
- [frontend/](../frontend), una aplicación aparte con su propio servidor y proxy, que
  consume todos los endpoints.

HTML, CSS y JavaScript puros: sin React, sin jQuery, sin Bootstrap y sin proceso de build.
Módulos ES nativos en el navegador y `fetch` con `credentials: 'include'`.

Las vistas son login, registro, catálogo con filtro por categoría y búsqueda, detalle del
programa con sus capítulos y su reparto, ficha de actor con los personajes que interpreta,
favoritos y el panel de administración con el CRUD de los seis recursos.

`publico/js/api/api.js` es el único módulo que llama a `fetch`; las vistas nunca lo tocan.
Cada vista maneja sus tres estados: cargando, error con botón de reintentar y lista vacía.
Si una respuesta vuelve 401, la sesión se limpia y la aplicación va al login.

El menú de administración solo se le muestra al administrador, pero eso es cosmético:
la autorización de verdad la hace el backend en cada endpoint.

## Arquitectura

```
rutas -> controladores -> servicios -> repositorios -> MongoDB
```

Cada capa solo conoce a la de abajo. Los servicios no saben qué es `req` y los
repositorios son el único lugar que toca la base. `src/rutas/index.js` es el composition
root: ahí se construyen repositorios, servicios y controladores, y todo lo demás recibe
sus dependencias ya armadas.

Patrones: **Repository**, **DTO** (`aPublico()`), **Factory** (`nuevo()` / `nueva()` /
`desde()`) y **Singleton** (la conexión en `src/config/db.js`). MVC es la arquitectura
general, no un patrón más.

Más detalle en [documentacion/modelo-datos.md](documentacion/modelo-datos.md) y
[documentacion/estructura.md](documentacion/estructura.md).

## Decisiones

- **La sesión vive en una cookie httpOnly**, no en `localStorage` ni en la cabecera
  `Authorization`. Con `sameSite: 'strict'` el CSRF queda cubierto sin token extra, y
  el mismo servidor sirve el frontend para que todo sea del mismo origen.
- **Los índices únicos usan cotejo** `{ locale: 'es', strength: 2 }` en vez de guardar
  un campo normalizado al lado de cada nombre.
- **La validación está repartida en tres niveles sin repetirse**: express-validator mira
  la forma del dato, el modelo mira que la entidad tenga sentido y el índice único es la
  última palabra. El manejador de errores traduce el 11000 de Mongo a un 409 con un
  mensaje en español.
- **Dos operaciones van en transacción**: borrar un programa con sus capítulos y
  personajes, y crear un programa junto con sus capítulos iniciales.
