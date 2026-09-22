import { Programa } from '../modelos/Programa.js';
import { Capitulo } from '../modelos/Capitulo.js';
import { NoEncontradoError } from '../errores/index.js';

export class ServicioProgramas {
    constructor({ programas, categorias, productoras, capitulos, personajes, actores, transacciones }) {
        this.programas = programas;
        this.categorias = categorias;
        this.productoras = productoras;
        this.capitulos = capitulos;
        this.personajes = personajes;
        this.actores = actores;
        this.transacciones = transacciones;
    }

    async buscar(id) {
        const programa = await this.programas.porId(id);
        if (!programa) throw new NoEncontradoError('El programa no existe');
        return programa;
    }

    async verificarReferencias({ categoriaId, productoraId }) {
        if (categoriaId !== undefined && !(await this.categorias.porId(categoriaId))) {
            throw new NoEncontradoError('La categoría indicada no existe');
        }
        if (productoraId !== undefined && !(await this.productoras.porId(productoraId))) {
            throw new NoEncontradoError('La productora indicada no existe');
        }
    }

    async listar({ categoriaId = null, texto = '' } = {}) {
        const programas = await this.programas.buscar({ categoriaId, texto });
        const [categorias, productoras] = await Promise.all([
            this.categorias.listarOrdenadas(),
            this.productoras.listarOrdenadas()
        ]);
        const porCategoria = new Map(categorias.map((categoria) => [categoria.id.toString(), categoria.aPublico()]));
        const porProductora = new Map(productoras.map((productora) => [productora.id.toString(), productora.aPublico()]));

        return programas.map((programa) => ({
            ...programa.aPublico(),
            categoria: porCategoria.get(programa.categoriaId?.toString()) ?? null,
            productora: porProductora.get(programa.productoraId?.toString()) ?? null
        }));
    }

    // detalle con capítulos y reparto; el reparto sale de personajes, no del programa
    async obtener(id) {
        const programa = await this.buscar(id);
        const [categoria, productora, capitulos, personajes] = await Promise.all([
            this.categorias.porId(programa.categoriaId),
            this.productoras.porId(programa.productoraId),
            this.capitulos.porPrograma(programa.id),
            this.personajes.porPrograma(programa.id)
        ]);
        const actores = await this.actores.porIds(personajes.map((personaje) => personaje.actorId));
        const porActor = new Map(actores.map((actor) => [actor.id.toString(), actor.aPublico()]));

        return {
            ...programa.aPublico(),
            categoria: categoria?.aPublico() ?? null,
            productora: productora?.aPublico() ?? null,
            capitulos: capitulos.map((capitulo) => capitulo.aPublico()),
            reparto: personajes.map((personaje) => ({
                ...personaje.aPublico(),
                actor: porActor.get(personaje.actorId.toString()) ?? null
            }))
        };
    }

    async crear({ capitulos = [], ...datos }) {
        await this.verificarReferencias(datos);
        const programa = Programa.nuevo(datos);

        if (capitulos.length === 0) {
            await this.programas.crear(programa);
            return this.obtener(programa.id);
        }

        // el programa y sus capítulos iniciales entran juntos o no entra ninguno
        await this.transacciones.ejecutar(async (sesion) => {
            await this.programas.crear(programa, sesion);
            const iniciales = capitulos.map((datosCapitulo) => Capitulo.nuevo({ ...datosCapitulo, programaId: programa.id }));
            await this.capitulos.crearVarios(iniciales, sesion);
        });
        return this.obtener(programa.id);
    }

    async actualizar(id, cambios) {
        const programa = await this.buscar(id);
        await this.verificarReferencias(cambios);
        programa.actualizar(cambios);
        await this.programas.reemplazar(programa);
        return this.obtener(programa.id);
    }

    // borrar el programa arrastra capítulos y personajes, todo en la misma transacción
    async borrar(id) {
        const programa = await this.buscar(id);
        return this.transacciones.ejecutar(async (sesion) => {
            const capitulos = await this.capitulos.borrarDelPrograma(programa.id, sesion);
            const personajes = await this.personajes.borrarDelPrograma(programa.id, sesion);
            await this.programas.borrar(programa.id, sesion);
            return { capitulosBorrados: capitulos, personajesBorrados: personajes };
        });
    }
}
