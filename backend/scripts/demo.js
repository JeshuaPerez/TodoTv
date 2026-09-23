import { MongoMemoryReplSet } from 'mongodb-memory-server';

// levanta la API contra un MongoDB en memoria con replica set, sin depender de Atlas
const replica = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' } });

process.env.MONGO_URI = replica.getUri();
process.env.MONGO_BASE = 'todotv_demo';
process.env.ENTORNO = 'desarrollo';
process.env.JWT_SECRETO = process.env.JWT_SECRETO || 'secreto-de-demostracion-0123456789';

// la semilla abre y cierra su propia conexión, por eso va antes de levantar el servidor
await import('./semilla.js');

const { entorno } = await import('../src/config/entorno.js');
const { Conexion } = await import('../src/config/db.js');
const { crearApp } = await import('../src/app.js');

const conexion = Conexion.instancia();
const base = await conexion.conectar();
const servidor = crearApp(base, conexion.cliente()).listen(entorno.puerto, () => {
    console.log('\nAPI de demostración en http://localhost:' + entorno.puerto);
    console.log('Documentación en http://localhost:' + entorno.puerto + '/api/docs');
    console.log('Los datos viven en memoria: al cortar el proceso se borran.\n');
});

const apagar = async () => {
    servidor.close();
    await conexion.cerrar().catch(() => {});
    await replica.stop().catch(() => {});
    process.exit(0);
};

process.on('SIGINT', apagar);
process.on('SIGTERM', apagar);
