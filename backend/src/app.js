import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { construirApi } from './rutas/index.js';
import { verificarVersion } from './middlewares/version.js';
import { limiteGlobal } from './middlewares/limites.js';
import { rutaNoEncontrada } from './middlewares/noEncontrado.js';
import { documentoSwagger } from './config/swagger.js';

const CARPETA_PUBLICA = fileURLToPath(new URL('../publico/', import.meta.url));

export function crearApp(base, cliente) {
    const app = express();
    const { rutas, manejadorErrores } = construirApi(base, cliente);

    app.disable('x-powered-by');
    app.use(cors({ origin: true, credentials: true }));
    app.use(express.json({ limit: '100kb' }));
    app.use(cookieParser());
    app.use(limiteGlobal());

    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(documentoSwagger));
    app.use('/api', verificarVersion(), rutas);
    app.use('/api', rutaNoEncontrada);

    // el mismo servidor sirve el frontend: mismo origen y la cookie viaja sin CORS especial
    app.use(express.static(CARPETA_PUBLICA));
    app.get('*', (peticion, respuesta) => {
        respuesta.sendFile(path.join(CARPETA_PUBLICA, 'index.html'));
    });

    app.use(manejadorErrores.manejar);

    return app;
}
