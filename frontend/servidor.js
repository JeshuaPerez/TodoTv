import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = fileURLToPath(new URL('./src/', import.meta.url));
// PUERTO_WEB y no PUERTO: el backend usa PUERTO y las dos partes corren a la vez,
// así que compartir el nombre las hacía pelear por el mismo puerto
const PUERTO = Number(process.env.PUERTO_WEB ?? 4000);
const API = process.env.API_DESTINO ?? 'http://127.0.0.1:3500';

const TIPOS = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon'
};

const SIN_COPIAR = ['content-encoding', 'content-length', 'transfer-encoding', 'set-cookie', 'connection'];

function leerCuerpo(peticion) {
    return new Promise((listo, fallo) => {
        const trozos = [];
        peticion.on('data', (trozo) => trozos.push(trozo));
        peticion.on('end', () => listo(Buffer.concat(trozos)));
        peticion.on('error', fallo);
    });
}

// el proxy deja todo en el mismo origen: la cookie sameSite strict viaja sin problemas
async function reenviar(peticion, respuesta) {
    const cabeceras = { ...peticion.headers };
    delete cabeceras.host;
    delete cabeceras.connection;
    delete cabeceras['content-length'];
    delete cabeceras['accept-encoding'];

    const cuerpo = ['GET', 'HEAD'].includes(peticion.method) ? null : await leerCuerpo(peticion);

    let respuestaApi;
    try {
        respuestaApi = await fetch(API + peticion.url, {
            method: peticion.method,
            headers: cabeceras,
            body: cuerpo && cuerpo.length > 0 ? cuerpo : undefined,
            redirect: 'manual'
        });
    } catch {
        respuesta.writeHead(502, { 'content-type': 'application/json; charset=utf-8' });
        respuesta.end(JSON.stringify({
            error: { codigo: 'API_INALCANZABLE', mensaje: 'La API no responde en ' + API }
        }));
        return;
    }

    const salientes = {};
    for (const [nombre, valor] of respuestaApi.headers) {
        if (!SIN_COPIAR.includes(nombre)) salientes[nombre] = valor;
    }
    const cookies = respuestaApi.headers.getSetCookie();
    if (cookies.length > 0) salientes['set-cookie'] = cookies;

    respuesta.writeHead(respuestaApi.status, salientes);
    respuesta.end(Buffer.from(await respuestaApi.arrayBuffer()));
}

async function servirEstatico(peticion, respuesta) {
    const { pathname } = new URL(peticion.url, 'http://interno');
    const pedida = decodeURIComponent(pathname === '/' ? '/index.html' : pathname);
    const destino = join(RAIZ, normalize(pedida));
    const extension = extname(destino);

    if (!destino.startsWith(RAIZ)) {
        respuesta.writeHead(403).end('Prohibido');
        return;
    }

    try {
        const contenido = await readFile(destino);
        respuesta.writeHead(200, {
            'content-type': TIPOS[extension] ?? 'application/octet-stream',
            'cache-control': 'no-cache'
        });
        respuesta.end(contenido);
    } catch {
        // las rutas del enrutador no tienen extensión y caen en el index
        if (extension !== '') {
            respuesta.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
            respuesta.end('No existe ' + pedida);
            return;
        }
        respuesta.writeHead(200, { 'content-type': TIPOS['.html'], 'cache-control': 'no-cache' });
        respuesta.end(await readFile(join(RAIZ, 'index.html')));
    }
}

export const servidor = createServer(async (peticion, respuesta) => {
    try {
        if (peticion.url.startsWith('/api')) await reenviar(peticion, respuesta);
        else await servirEstatico(peticion, respuesta);
    } catch (error) {
        respuesta.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
        respuesta.end('Error del servidor de la interfaz: ' + error.message);
    }
});

// el fallo más común al arrancar es de puertos, así que se explica en vez de tirar la traza
servidor.on('error', (error) => {
    if (error.code !== 'EADDRINUSE') throw error;
    console.error('El puerto ' + PUERTO + ' ya está ocupado.');
    console.error('Probablemente lo tenga la API: revisá PUERTO en backend/.env, o levantá');
    console.error('la interfaz en otro puerto con PUERTO_WEB=4010.');
    process.exit(1);
});

// si el proxy apunta al puerto de la interfaz, /api se reenvía a sí mismo y nada funciona
function revisarDestino() {
    const { port, hostname } = new URL(API);
    const propio = ['localhost', '127.0.0.1', '::1', '0.0.0.0'].includes(hostname);
    if (!propio || Number(port || 80) !== PUERTO) return;
    console.error('API_DESTINO apunta al puerto de esta misma interfaz (' + PUERTO + ').');
    console.error('La API tiene que escuchar en otro puerto: revisá PUERTO en backend/.env.');
    process.exit(1);
}

// un aviso al arrancar ahorra descubrir por el 502 que la API no está donde se la busca
async function avisarSiLaApiNoResponde() {
    try {
        const respuesta = await fetch(API + '/api/programas', { signal: AbortSignal.timeout(3000) });
        // la cabecera de versión la pone la API en cada respuesta: alcanza para reconocerla
        if (respuesta.ok || respuesta.headers.has('x-api-version')) return;
        console.warn('Aviso: ' + API + ' contestó ' + respuesta.status + ' y no parece la API de TodoTv.');
    } catch {
        console.warn('Aviso: la API no responde en ' + API + '.');
        console.warn('Levantala con "npm run demo" en backend/, o corregí API_DESTINO si usa otro puerto.');
    }
}

if (process.env.NO_ARRANCAR !== '1') {
    revisarDestino();
    servidor.listen(PUERTO, () => {
        console.log('TodoTv Web en http://localhost:' + PUERTO);
        console.log('Las peticiones a /api se reenvían a ' + API);
        avisarSiLaApiNoResponde();
    });
}
