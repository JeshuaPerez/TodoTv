import { verificarEntorno } from '../src/config/entorno.js';
import { Conexion } from '../src/config/db.js';
import { crearIndices } from '../src/config/indices.js';

verificarEntorno();

const conexion = Conexion.instancia();
const base = await conexion.conectar();
const colecciones = await crearIndices(base);

console.log('Índices creados o confirmados en: ' + colecciones.join(', '));
await conexion.cerrar();
