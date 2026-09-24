# TodoTv

Aplicación completa para gestionar información de programas de televisión: novelas, anime
y cartoons, con sus capítulos, su reparto y sus productoras. La API y la interfaz viven en
este mismo repositorio, cada una en su carpeta y con su propio `package.json`.

| carpeta | qué es | dependencias |
|---|---|---|
| [backend/](backend) | API REST en Node con Express y el driver nativo de MongoDB | 13 |
| [frontend/](frontend) | Interfaz web en HTML, CSS y JavaScript puros | ninguna |

Cada carpeta tiene su propio README con el detalle: [backend](backend/README.md),
[frontend](frontend/README.md).

## Arrancar todo

Hacen falta dos terminales. En la primera, la API:

```bash
cd backend
npm install
npm run demo        # MongoDB en memoria, datos de ejemplo, sin configurar nada
```

Para usar MongoDB Atlas en vez de la base en memoria: copiá `.env.example` a `.env`,
completalo y usá `npm run inicio`.

En la segunda, la interfaz:

```bash
cd frontend
npm run inicio      # http://localhost:4000
```

La API queda en el **3500** y la interfaz en el **4000**: son dos procesos a la vez, así que
nunca pueden compartir puerto. Si cambiás `PUERTO` en `backend/.env`, la interfaz deja de
encontrar la API y todo contesta 502 `API_INALCANZABLE`; hay que mover también su
`API_DESTINO`. Cada parte tiene su propia variable (`PUERTO` la API, `PUERTO_WEB` la
interfaz) para que definir una no mueva la otra sin querer.

Si el 3500 ya está ocupado, las dos partes se mueven sin tocar código:

```bash
# PowerShell (Windows)
cd backend ; $env:PUERTO=3010 ; npm run demo
cd frontend ; $env:PUERTO_WEB=4010 ; $env:API_DESTINO='http://127.0.0.1:3010' ; npm run inicio
```

```bash
# bash (Linux, macOS, Git Bash)
cd backend  && PUERTO=3010 npm run demo
cd frontend && PUERTO_WEB=4010 API_DESTINO=http://127.0.0.1:3010 npm run inicio
```

| rol | correo | contraseña |
|---|---|---|
| administrador | admin@todotv.test | Admin1234 |
| usuario | demo@todotv.test | Demo1234 |

La documentación interactiva de la API queda en `http://localhost:3500/api/docs`.

## Pruebas

```bash
cd backend  && npm run pruebas     # 65 pruebas de la API
cd frontend && npm run pruebas     # 33 pruebas de la interfaz contra la API real
```

Ninguna de las dos toca una base real ni necesita que haya algo corriendo: levantan su
propio MongoDB en memoria.

## Por qué están separados

El backend puede vivir solo: sirve su propia interfaz mínima desde `backend/publico/` y
documenta todo en Swagger. `frontend/` es una aplicación aparte que consume esa misma API
por HTTP, con su propio servidor y su propio despliegue.

Ese servidor propio no es un capricho. La sesión viaja en una cookie `httpOnly` con
`sameSite: 'strict'`, que el navegador no manda a otro origen. El servidor de `frontend/`
sirve los estáticos y reenvía `/api` al backend, así que para el navegador hay un solo
origen y la cookie funciona sin aflojar nada ni configurar CORS.

## Arquitectura

```
rutas -> controladores -> servicios -> repositorios -> MongoDB
```

Patrones: Repository, DTO, Factory y Singleton, sobre MVC. El detalle del modelo de datos
está en [backend/documentacion/modelo-datos.md](backend/documentacion/modelo-datos.md) y
el de las capas en [backend/documentacion/estructura.md](backend/documentacion/estructura.md).
