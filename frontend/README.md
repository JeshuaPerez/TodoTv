# TodoTv Web

Interfaz gráfica para la API de [TodoTv](../backend). HTML, CSS y JavaScript puros:
sin React, sin Vue, sin jQuery, sin Bootstrap, sin proceso de build y **sin una sola
dependencia** en `package.json`. Módulos ES nativos en el navegador y `fetch` con
`credentials: 'include'`.

## Cómo levantarla

Hacen falta dos procesos. En una terminal, la API:

```bash
cd ../backend
npm run demo      # levanta la API con MongoDB en memoria y datos de ejemplo
```

`npm run demo` no necesita Atlas ni configuración: arranca un replica set en memoria,
corre la semilla y queda escuchando en el puerto 3500, o en el que diga `PUERTO` si hay un
`backend/.env`. Para usar la base de verdad, `npm run inicio` con el `.env` completo.

En otra terminal, la interfaz:

```bash
npm run inicio    # http://localhost:4000
```

| variable | por defecto | para qué |
|---|---|---|
| `PUERTO_WEB` | 4000 | puerto de la interfaz |
| `API_DESTINO` | http://127.0.0.1:3500 | a dónde se reenvía `/api` |

La variable se llama `PUERTO_WEB` y no `PUERTO` a propósito: el backend usa `PUERTO` y las
dos partes corren al mismo tiempo, así que con el nombre compartido alcanzaba con definirlo
una vez para que las dos quisieran el mismo puerto.

Los dos puertos tienen que coincidir con lo que espera cada lado. Si la API escucha en otro
puerto (`PUERTO` en `backend/.env`), hay que mover `API_DESTINO` al mismo número; si no, la
interfaz se sirve igual pero cada llamada a `/api` vuelve como 502 `API_INALCANZABLE`. Al
arrancar, `servidor.js` avisa si la API no contesta y si el puerto ya está ocupado.

Usuarios que deja la semilla: `admin@todotv.test / Admin1234` (administrador) y
`demo@todotv.test / Demo1234` (usuario).

## Por qué hay un servidor y no archivos sueltos

La sesión de TodoTv viaja en una cookie `httpOnly` con `sameSite: 'strict'`. Una cookie
así **no se manda a otro origen**: si la interfaz se abriera con `file://` o desde otro
puerto contra la API directamente, el navegador no la enviaría nunca y no habría forma
de iniciar sesión.

`servidor.js` resuelve eso sin tocar el backend ni debilitar la cookie: sirve los
estáticos y reenvía todo lo que empieza con `/api` a la API. Para el navegador hay un
solo origen, así que la cookie viaja sola y tampoco hace falta configurar CORS.

Son 115 líneas con los módulos `http` y `fs` de Node, sin dependencias.

Si algún día la interfaz se publica en un dominio distinto al de la API, hay que definir
`window.TODOTV = { api: 'https://…' }` en el `index.html` y, en el backend, pasar la
cookie a `sameSite: 'none'` con `secure: true` y permitir ese origen en CORS.

## Estructura

```
frontend/
├── servidor.js               estáticos + proxy de /api, sin dependencias
├── scripts/pruebas.js        levanta API e interfaz de verdad y prueba contra ellas
└── src/
    ├── index.html
    ├── css/
    │   ├── base.css          variables, reset, cabecera y pie
    │   ├── componentes.css   botones, campos, tablas, diálogos, avisos
    │   └── vistas.css        tarjetas, fichas, capítulos, reparto, responsive
    └── js/
        ├── principal.js      rutas, menú según el rol y señales globales
        ├── nucleo/
        │   ├── peticiones.js único módulo que llama a fetch
        │   ├── api.js        los endpoints, agrupados por recurso
        │   ├── plantilla.js  html`` con escapado automático
        │   ├── enrutador.js  rutas con parámetros y guardas por rol
        │   ├── sesion.js     el usuario actual y sus favoritos
        │   ├── formato.js    fechas, duraciones y plurales
        │   ├── avisos.js     mensajes flotantes
        │   └── configuracion.js
        ├── componentes/      estados, tarjetas, formularios, diálogos
        └── vistas/           una por pantalla, más el panel de administración
```

Reglas que sigue el código:

- **Solo `peticiones.js` llama a `fetch`.** Las vistas usan `api.js` y nunca ven una URL.
- **Nada entra al HTML sin escapar.** Todo se arma con la plantilla `html` de
  `plantilla.js`, que escapa cada valor interpolado. No hay forma de olvidarse.
- **Carga, error y vacío en un solo lugar.** `conEstados()` resuelve los tres estados y
  el botón de reintentar para cualquier vista.
- **El menú reacciona al rol, pero es cosmético.** La autorización real la hace el
  backend en cada endpoint; la interfaz solo evita mostrar lo que no corresponde.

## Qué consume de la API

| grupo | endpoints | dónde se usa |
|---|---|---|
| Autenticación | registro, inicio y cierre de sesión, perfil | login, registro, mi cuenta |
| Programas | listar con filtros, detalle, alta, edición y baja | catálogo, detalle, administración |
| Programas | capítulos y personajes del programa | pestañas del detalle |
| Categorías | listar y CRUD | filtro del catálogo, administración |
| Productoras | listar y CRUD | vista de productoras, administración |
| Actores | listar con búsqueda, ficha y CRUD | actores, ficha, administración |
| Capítulos | CRUD | administración |
| Personajes | CRUD | administración |
| Favoritos | listar, marcar y desmarcar | catálogo, detalle, favoritos |

El alta de programa incluye los **capítulos iniciales**: el formulario deja agregar filas
y el backend los crea junto con el programa en una transacción, así que si uno choca no
queda nada a medio guardar.

La cabecera `Accept-Version` va en todas las peticiones. Si la API contesta 409 por
versión incompatible, aparece una banda roja arriba de todo. El pie muestra siempre qué
versión pide el cliente y cuál anuncia el servidor.

## Vistas

Login, registro, catálogo con filtro por categoría y búsqueda por título, detalle del
programa con trailer y pestañas de capítulos y reparto, listado de actores con búsqueda,
ficha de actor con los personajes que interpreta, productoras con sus programas,
favoritos, mi cuenta y el panel de administración con el CRUD de los seis recursos.

## Pruebas

```bash
npm run pruebas
```

Levanta la API de demostración y esta interfaz de verdad, y corre 36 pruebas contra las
dos: que cada módulo y hoja de estilo se sirva, que ningún import quede roto, que la
cookie atraviese el proxy, que el `api.js` real haga bien todo el recorrido (catálogo,
favoritos, CRUD completo, transacción de capítulos iniciales), que los formularios salgan con sus atributos
intactos, que los errores lleguen con su detalle por campo y que, con la API caída, el proxy conteste 502 y la interfaz se
siga sirviendo.
