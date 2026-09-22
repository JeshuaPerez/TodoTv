import { Capitulo } from '../modelos/Capitulo.js';
import { NoEncontradoError } from '../errores/index.js';

export class ServicioCapitulos {
    constructor(repositorioCapitulos, repositorioProgramas) {
        this.capitulos = repositorioCapitulos;
        this.programas = repositorioProgramas;
    }

    async buscar(id) {
        const capitulo = await this.capitulos.porId(id);
        if (!capitulo) throw new NoEncontradoError('El capítulo no existe');
        return capitulo;
    }

    async verificarPrograma(programaId) {
        const programa = await this.programas.porId(programaId);
        if (!programa) throw new NoEncontradoError('El programa indicado no existe');
        return programa;
    }

    async porPrograma(programaId) {
        await this.verificarPrograma(programaId);
        const capitulos = await this.capitulos.porPrograma(programaId);
        return capitulos.map((capitulo) => capitulo.aPublico());
    }

    async obtener(id) {
        return (await this.buscar(id)).aPublico();
    }

    async crear(datos) {
        await this.verificarPrograma(datos.programaId);
        const capitulo = Capitulo.nuevo(datos);
        await this.capitulos.crear(capitulo);
        return capitulo.aPublico();
    }

    async actualizar(id, cambios) {
        const capitulo = await this.buscar(id);
        capitulo.actualizar(cambios);
        await this.capitulos.reemplazar(capitulo);
        return capitulo.aPublico();
    }

    async borrar(id) {
        const capitulo = await this.buscar(id);
        await this.capitulos.borrar(capitulo.id);
    }
}
