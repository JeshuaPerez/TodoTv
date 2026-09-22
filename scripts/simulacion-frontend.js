import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { ClienteHttp } from './pruebas/ayudas.js';

const replica = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' } });

process.env.ENTORNO = 'prueba';
process.env.MONGO_URI = replica.getUri();
process.env.MONGO_BASE = 'todotv_simulacion';
process.env.JWT_SECRETO = 'secreto-de-la-simulacion-0123456789';
process.env.API_VERSION = '1.0.0';
process.env.LIMITE_GLOBAL = '5000';
process.env.LIMITE_AUTENTICACION = '200';

const { Conexion } = await import('../src/config/db.js');
const { crearIndices } = await import('../src/config/indices.js');
const { crearApp } = await import('../src/app.js');
const { Usuario } = await import('../src/modelos/Usuario.js');
const bcrypt = (await import('bcrypt')).default;

const conexion = Conexion.instancia();
const base = await conexion.conectar();
await crearIndices(base);

const app = crearApp(base, conexion.cliente());
const servidor = app.listen(0);
await new Promise((listo) => servidor.once('listening', listo));
const direccion = 'http://127.0.0.1:' + servidor.address().port + '/api';

await base.collection('usuarios').insertOne(Usuario.nuevo({
    nombreUsuario: 'admin',
    correo: 'admin@todotv.test',
    contrasena: await bcrypt.hash('Admin1234', 10),
    rol: Usuario.ROLES.ADMINISTRADOR
}).aDocumento());

function titulo(texto) {
    console.log('\n=== ' + texto + ' ===');
}

function mostrar(etiqueta, respuesta, resumen = '') {
    const marca = respuesta.estado < 400 ? 'ok  ' : 'err ';
    const codigo = respuesta.datos?.error?.codigo ? ' [' + respuesta.datos.error.codigo + ']' : '';
    console.log('  ' + marca + etiqueta.padEnd(50) + respuesta.estado + codigo + (resumen ? '  ' + resumen : ''));
}

titulo('El administrador carga el catálogo desde el panel');
const admin = new ClienteHttp(direccion, '1.x');
mostrar('POST /autenticacion/inicio-sesion', await admin.post('/autenticacion/inicio-sesion', {
    correo: 'admin@todotv.test',
    contrasena: 'Admin1234'
}));

const categoria = await admin.post('/categorias', { nombre: 'anime', descripcion: 'Animación japonesa' });
mostrar('POST /categorias', categoria, categoria.datos?.nombre);

const productora = await admin.post('/productoras', { nombre: 'Toei Animation', pais: 'Japón', anioFundacion: 1948 });
mostrar('POST /productoras', productora, productora.datos?.nombre);

const actor = await admin.post('/actores', {
    nombre: 'Masako Nozawa',
    nacionalidad: 'Japonesa',
    fechaNacimiento: '1936-10-25',
    foto: 'https://picsum.photos/seed/nozawa/300/450'
});
mostrar('POST /actores', actor, actor.datos?.nombre);

const programa = await admin.post('/programas', {
    titulo: 'Dragon Ball',
    sinopsis: 'Goku recorre el mundo buscando las esferas del dragón.',
    poster: 'https://picsum.photos/seed/dragon-ball/300/450',
    trailer: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    categoriaId: categoria.datos.id,
    productoraId: productora.datos.id,
    capitulos: [
        { temporada: 1, numero: 1, titulo: 'Bulma y Son Goku', duracionMinutos: 24 },
        { temporada: 1, numero: 2, titulo: 'No hay tal abuelo', duracionMinutos: 24 }
    ]
});
mostrar('POST /programas (con capítulos, transacción)', programa, programa.datos?.capitulos.length + ' capítulos');

mostrar('POST /personajes', await admin.post('/personajes', {
    nombre: 'Son Goku',
    programaId: programa.datos.id,
    actorId: actor.datos.id
}));

titulo('Un visitante entra sin sesión');
const visitante = new ClienteHttp(direccion, '1.x');
const catalogoPublico = await visitante.get('/programas');
mostrar('GET /programas', catalogoPublico, catalogoPublico.datos?.length + ' programas');
mostrar('GET /favoritos (el frontend redirige al login)', await visitante.get('/favoritos'));

titulo('El usuario se registra y usa la aplicación');
const usuario = new ClienteHttp(direccion, '1.x');
mostrar('POST /autenticacion/registro', await usuario.post('/autenticacion/registro', {
    nombreUsuario: 'espectador',
    correo: 'espectador@todotv.test',
    contrasena: 'secreta1234'
}));

const catalogo = await usuario.get('/programas?categoria=' + categoria.datos.id);
mostrar('GET /programas?categoria=...', catalogo, catalogo.datos?.length + ' resultados');

const detalle = await usuario.get('/programas/' + programa.datos.id);
mostrar('GET /programas/:id', detalle, detalle.datos?.capitulos.length + ' capítulos, ' + detalle.datos?.reparto.length + ' en el reparto');

const ficha = await usuario.get('/actores/' + actor.datos.id);
mostrar('GET /actores/:id', ficha, ficha.datos?.personajes.length + ' personajes');

const marcado = await usuario.post('/favoritos/' + programa.datos.id);
mostrar('POST /favoritos/:programaId', marcado, marcado.datos?.length + ' favoritos');
mostrar('GET /favoritos', await usuario.get('/favoritos'));
mostrar('POST /categorias (no es administrador)', await usuario.post('/categorias', { nombre: 'novelas' }));

titulo('El cliente pide una versión que la API no habla');
mostrar('GET /programas con Accept-Version: 2.x', await visitante.get('/programas', { 'Accept-Version': '2.x' }));

titulo('Se cae la base de datos');
console.log('  (apagando el servidor de Mongo, puede tardar unos segundos)');
await replica.stop();

const catalogoCaido = await usuario.get('/programas');
mostrar('GET /programas', catalogoCaido, catalogoCaido.datos?.error?.mensaje);

const detalleCaido = await usuario.get('/programas/' + programa.datos.id);
mostrar('GET /programas/:id', detalleCaido);

const perfilCaido = await usuario.get('/autenticacion/perfil');
mostrar('GET /autenticacion/perfil', perfilCaido);

const altaCaida = await admin.post('/categorias', { nombre: 'cartoons' });
mostrar('POST /categorias', altaCaida);

console.log('\nLa API sigue en pie y responde 503 con un cuerpo de error parseable.');
console.log('El servidor nunca se cayó: el frontend puede mostrar el estado de error y reintentar.');

servidor.close();
await conexion.cerrar().catch(() => {});
process.exit(0);
