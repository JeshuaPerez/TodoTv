import { RepositorioBase } from './RepositorioBase.js';
import { Actor } from '../modelos/Actor.js';
import { COLECCIONES, COTEJO_ES } from '../config/colecciones.js';
import { aObjectId } from '../utilidades/identificadores.js';

export class RepositorioActores extends RepositorioBase {
    constructor(base) {
        super(base, COLECCIONES.ACTORES, Actor);
    }

    async listarOrdenados(texto = '') {
        const filtro = texto ? { nombre: { $regex: texto, $options: 'i' } } : {};
        return this.listar(filtro, { sort: { nombre: 1 }, collation: COTEJO_ES });
    }

    async porIds(ids, sesion = null) {
        const identificadores = ids.map((id) => aObjectId(id, 'id del actor'));
        return this.listar({ _id: { $in: identificadores } }, {}, sesion);
    }
}
