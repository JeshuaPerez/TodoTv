import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { ClienteHttp, crearRegistro } from './ayudas.js';

const replica = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' } });

process.env.ENTORNO = 'prueba';
process.env.MONGO_URI = replica.getUri();
process.env.MONGO_BASE = 'todotv_pruebas';
process.env.JWT_SECRETO = 'secreto-solo-para-las-pruebas-0123456789';
process.env.JWT_EXPIRACION = '1h';
process.env.API_VERSION = '1.0.0';
process.env.LIMITE_GLOBAL = '5000';
process.env.LIMITE_AUTENTICACION = '25';

// se importan recién ahora: estos módulos leen el entorno al cargarse
const { Conexion } = await import('../../src/config/db.js');
const { crearIndices } = await import('../../src/config/indices.js');
const { crearApp } = await import('../../src/app.js');
const { Usuario } = await import('../../src/modelos/Usuario.js');
const bcrypt = (await import('bcrypt')).default;

const { pruebasAutenticacion } = await import('./suites/autenticacion.js');
const { pruebasCatalogo } = await import('./suites/catalogo.js');
const { pruebasReglas } = await import('./suites/reglas.js');
const { pruebasTransacciones } = await import('./suites/transacciones.js');
const { pruebasFavoritos } = await import('./suites/favoritos.js');
const { pruebasVersion } = await import('./suites/version.js');
const { pruebasLimites } = await import('./suites/limites.js');

const conexion = Conexion.instancia();
const base = await conexion.conectar();
await crearIndices(base);

const app = crearApp(base, conexion.cliente());
const servidor = app.listen(0);
await new Promise((listo) => servidor.once('listening', listo));
const direccion = 'http://127.0.0.1:' + servidor.address().port + '/api';

const ADMINISTRADOR = { correo: 'admin@todotv.test', contrasena: 'admin1234' };
const administrador = Usuario.nuevo({
    nombreUsuario: 'admin',
    correo: ADMINISTRADOR.correo,
    contrasena: await bcrypt.hash(ADMINISTRADOR.contrasena, 10),
    rol: Usuario.ROLES.ADMINISTRADOR
});
await base.collection('usuarios').insertOne(administrador.aDocumento());

let contador = 0;
const contexto = {
    base,
    direccion,
    administrador: ADMINISTRADOR,
    cliente: () => new ClienteHttp(direccion, '1.x'),

    async clienteAdministrador() {
        const cliente = contexto.cliente();
        await cliente.post('/autenticacion/inicio-sesion', ADMINISTRADOR);
        return cliente;
    },

    async clienteUsuario() {
        contador += 1;
        const credenciales = {
            nombreUsuario: 'espectador' + contador,
            correo: 'espectador' + contador + '@todotv.test',
            contrasena: 'secreta1234'
        };
        const cliente = contexto.cliente();
        await cliente.post('/autenticacion/registro', credenciales);
        return { cliente, credenciales };
    }
};

const registro = crearRegistro();
const suites = [
    ['Autenticación y cookies', pruebasAutenticacion],
    ['Catálogo y permisos', pruebasCatalogo],
    ['Reglas de negocio', pruebasReglas],
    ['Transacciones', pruebasTransacciones],
    ['Favoritos', pruebasFavoritos],
    ['Versionado con semver', pruebasVersion],
    ['Límite de peticiones', pruebasLimites]
];

for (const [nombre, suite] of suites) {
    registro.grupo(nombre);
    await suite(registro, contexto);
}

const fallidas = registro.resultados.filter((resultado) => !resultado.ok);
console.log('\n' + '-'.repeat(50));
console.log(registro.resultados.length - fallidas.length + ' pasadas, ' + fallidas.length + ' fallidas');
if (fallidas.length > 0) {
    console.log('\nFallaron:');
    for (const fallo of fallidas) console.log('  - ' + fallo.nombre + ': ' + fallo.error.message);
}

servidor.close();
await conexion.cerrar();
await replica.stop();
process.exit(fallidas.length > 0 ? 1 : 0);
