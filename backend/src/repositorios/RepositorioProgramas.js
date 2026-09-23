import { RepositorioBase } from './RepositorioBase.js';
import { Programa } from '../modelos/Programa.js';
import { COLECCIONES, COTEJO_ES } from '../config/colecciones.js';
import { aObjectId } from '../utilidades/identificadores.js';

export class RepositorioProgramas extends RepositorioBase {
    constructor(base) {
        super(base, COLECCIONES.PROGRAMAS, Programa);
    }

    async buscar({ categoriaId = null, texto = '' } = {}) {
        const filtro = {};
        if (categoriaId) filtro.categoriaId = aObjectId(categoriaId, 'id de la categoría');
        if (texto) filtro.titulo = { $regex: texto, $options: 'i' };
        return this.listar(filtro, { sort: { titulo: 1 }, collation: COTEJO_ES });
    }

    async porTitulo(titulo, sesion = null) {
        return this.uno({ titulo }, { collation: COTEJO_ES }, sesion);
    }

    async porIds(ids, sesion = null) {
        const identificadores = ids.map((id) => aObjectId(id, 'id del programa'));
        return this.listar({ _id: { $in: identificadores } }, { sort: { titulo: 1 } }, sesion);
    }

    async usaCategoria(categoriaId) {
        return this.existe({ categoriaId: aObjectId(categoriaId, 'id de la categoría') });
    }

    async usaProductora(productoraId) {
        return this.existe({ productoraId: aObjectId(productoraId, 'id de la productora') });
    }
}
