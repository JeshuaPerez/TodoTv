import { RepositorioBase } from './RepositorioBase.js';
import { Personaje } from '../modelos/Personaje.js';
import { COLECCIONES } from '../config/colecciones.js';
import { aObjectId } from '../utilidades/identificadores.js';

export class RepositorioPersonajes extends RepositorioBase {
    constructor(base) {
        super(base, COLECCIONES.PERSONAJES, Personaje);
    }

    async porPrograma(programaId, sesion = null) {
        return this.listar(
            { programaId: aObjectId(programaId, 'id del programa') },
            { sort: { nombre: 1 } },
            sesion
        );
    }

    async porActor(actorId, sesion = null) {
        return this.listar(
            { actorId: aObjectId(actorId, 'id del actor') },
            { sort: { nombre: 1 } },
            sesion
        );
    }

    async borrarDelPrograma(programaId, sesion = null) {
        return this.borrarPorFiltro({ programaId: aObjectId(programaId, 'id del programa') }, sesion);
    }

    async usaActor(actorId) {
        return this.existe({ actorId: aObjectId(actorId, 'id del actor') });
    }
}
