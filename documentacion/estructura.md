# Estructura de carpetas

```
TodoTv/
├── package.json
├── .env.example
├── src/
│   ├── servidor.js              arranque: entorno, conexión, escucha
│   ├── app.js                   arma Express: middlewares, estáticos, rutas
│   ├── config/
│   │   ├── entorno.js           lee y valida process.env
│   │   ├── db.js                Singleton de la conexión a Mongo
│   │   ├── colecciones.js       nombres de colección y cotejo
│   │   ├── indices.js           definición de los índices
│   │   └── swagger.js           documento OpenAPI
│   ├── modelos/                 clases entidad (7)
│   ├── repositorios/            RepositorioBase + una subclase por colección
│   ├── servicios/               reglas de negocio, transacciones
│   ├── controladores/           traducen HTTP, nada más
│   ├── rutas/
│   │   ├── index.js             composition root: el único lugar con `new`
│   │   └── validadores/         express-validator por recurso
│   ├── middlewares/             autenticación, autorización, versión, límites, errores
│   ├── errores/                 AppError y su jerarquía
│   └── utilidades/              helpers de identificadores y valores
├── publico/                     interfaz gráfica, HTML/CSS/JS puro
│   ├── index.html
│   ├── css/estilos.css
│   └── js/
│       ├── principal.js         enrutado por hash y menú según el rol
│       ├── enrutador.js         navegar() y lectura del hash
│       ├── estado.js            el usuario de la sesión
│       ├── componentes.js       escapado, tarjetas y estados de carga/error/vacío
│       ├── api/api.js           único módulo que llama a fetch
│       └── vistas/              una vista por pantalla
├── scripts/
│   ├── indices.js               crea los índices
│   ├── semilla.js               datos de prueba, idempotente, --reset
│   ├── simulacion-frontend.js   recorre el consumo real, incluida la caída de la base
│   └── pruebas/                 pruebas contra MongoMemoryReplSet
└── documentacion/
```

`config/` y `scripts/` conservan su nombre porque así aparecen en la especificación
(`config/db.js`, `/scripts`). El resto va en español, igual que el código.

## El flujo va en un solo sentido

```
rutas -> controladores -> servicios -> repositorios -> MongoDB
  │
  └── validadores/ (express-validator)
```

- Una capa solo conoce a la de abajo. Un servicio no sabe qué es `req`, un repositorio
  no sabe qué es un servicio.
- `modelos/` y `errores/` los usa cualquier capa: son el vocabulario común.
- `rutas/index.js` construye todo y lo inyecta hacia abajo. En el resto del código
  no aparece ningún `new` de repositorio, servicio ni controlador.
