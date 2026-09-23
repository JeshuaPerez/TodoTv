import { RepositorioBase } from './RepositorioBase.js';
import { Capitulo } from '../modelos/Capitulo.js';
import { COLECCIONES } from '../config/colecciones.js';
import { aObjectId } from '../utilidades/identificadores.js';

export class RepositorioCapitulos extends RepositorioBase {
    constructor(base) {
        super(base, COLECCIONES.CAPITULOS, Capitulo);
    }

    async porPrograma(programaId, sesion = null) {
        return this.listar(
            { programaId: aObjectId(programaId, 'id del programa') },
            { sort: { temporada: 1, numero: 1 } },
            sesion
        );
    }

    async borrarDelPrograma(programaId, sesion = null) {
        return this.borrarPorFiltro({ programaId: aObjectId(programaId, 'id del programa') }, sesion);
    }

    async contarDelPrograma(programaId, sesion = null) {
        return this.contar({ programaId: aObjectId(programaId, 'id del programa') }, {}, sesion);
    }
}
