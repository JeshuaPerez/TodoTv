import { NoEncontradoError } from '../errores/index.js';

export class ServicioFavoritos {
    constructor(repositorioUsuarios, repositorioProgramas) {
        this.usuarios = repositorioUsuarios;
        this.programas = repositorioProgramas;
    }

    async listar(usuario) {
        const programas = await this.programas.porIds(usuario.favoritos);
        return programas.map((programa) => programa.aPublico());
    }

    async agregar(usuario, programaId) {
        const programa = await this.programas.porId(programaId);
        if (!programa) throw new NoEncontradoError('El programa no existe');
        usuario.agregarFavorito(programa.id);
        await this.usuarios.guardarFavoritos(usuario);
        return this.listar(usuario);
    }

    async quitar(usuario, programaId) {
        usuario.quitarFavorito(programaId);
        await this.usuarios.guardarFavoritos(usuario);
        return this.listar(usuario);
    }
}
