import { Personaje } from '../modelos/Personaje.js';
import { NoEncontradoError } from '../errores/index.js';

export class ServicioPersonajes {
    constructor(repositorioPersonajes, repositorioProgramas, repositorioActores) {
        this.personajes = repositorioPersonajes;
        this.programas = repositorioProgramas;
        this.actores = repositorioActores;
    }

    async buscar(id) {
        const personaje = await this.personajes.porId(id);
        if (!personaje) throw new NoEncontradoError('El personaje no existe');
        return personaje;
    }

    async verificarReferencias({ programaId, actorId }) {
        if (programaId !== undefined && !(await this.programas.porId(programaId))) {
            throw new NoEncontradoError('El programa indicado no existe');
        }
        if (actorId !== undefined && !(await this.actores.porId(actorId))) {
            throw new NoEncontradoError('El actor indicado no existe');
        }
    }

    async listar() {
        const personajes = await this.personajes.listar({}, { sort: { nombre: 1 } });
        return personajes.map((personaje) => personaje.aPublico());
    }

    // el reparto de un programa, cada personaje con el actor que lo interpreta
    async porPrograma(programaId) {
        await this.verificarReferencias({ programaId });
        const personajes = await this.personajes.porPrograma(programaId);
        const actores = await this.actores.porIds(personajes.map((personaje) => personaje.actorId));
        const porActor = new Map(actores.map((actor) => [actor.id.toString(), actor.aPublico()]));

        return personajes.map((personaje) => ({
            ...personaje.aPublico(),
            actor: porActor.get(personaje.actorId.toString()) ?? null
        }));
    }

    async obtener(id) {
        return (await this.buscar(id)).aPublico();
    }

    async crear(datos) {
        await this.verificarReferencias(datos);
        const personaje = Personaje.nuevo(datos);
        await this.personajes.crear(personaje);
        return personaje.aPublico();
    }

    async actualizar(id, cambios) {
        const personaje = await this.buscar(id);
        await this.verificarReferencias(cambios);
        personaje.actualizar(cambios);
        await this.personajes.reemplazar(personaje);
        return personaje.aPublico();
    }

    async borrar(id) {
        const personaje = await this.buscar(id);
        await this.personajes.borrar(personaje.id);
    }
}
