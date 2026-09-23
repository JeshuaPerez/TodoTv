import { api } from '../../nucleo/api.js';
import { duracion } from '../../nucleo/formato.js';

const opciones = async (recurso, campo = 'nombre') => {
    const filas = await recurso.listar();
    return filas.map((fila) => ({ valor: fila.id, texto: fila[campo] }));
};

const mapa = async (recurso, campo = 'nombre') => {
    const filas = await recurso.listar();
    return new Map(filas.map((fila) => [fila.id, fila[campo]]));
};

export const RECURSOS = {
    programas: {
        titulo: 'Programas',
        singular: 'programa',
        api: api.programas,
        columnas: [
            { etiqueta: 'Título', valor: (fila) => fila.titulo },
            { etiqueta: 'Categoría', valor: (fila) => fila.categoria?.nombre ?? '' },
            { etiqueta: 'Productora', valor: (fila) => fila.productora?.nombre ?? '' }
        ],
        campos: async () => [
            { nombre: 'titulo', etiqueta: 'Título', tipo: 'texto', requerido: true },
            { nombre: 'sinopsis', etiqueta: 'Sinopsis', tipo: 'parrafo', requerido: true },
            { nombre: 'poster', etiqueta: 'Poster (URL de imagen)', tipo: 'enlace', requerido: true },
            { nombre: 'trailer', etiqueta: 'Trailer (URL de video)', tipo: 'enlace', requerido: true },
            {
                nombre: 'categoriaId',
                etiqueta: 'Categoría',
                tipo: 'seleccion',
                requerido: true,
                valores: await opciones(api.categorias)
            },
            {
                nombre: 'productoraId',
                etiqueta: 'Productora',
                tipo: 'seleccion',
                requerido: true,
                valores: await opciones(api.productoras)
            },
            {
                nombre: 'capitulos',
                etiqueta: 'Capítulos iniciales',
                tipo: 'lista',
                soloAlCrear: true,
                ayuda: 'Se crean junto con el programa en una sola transacción: si uno choca, no se guarda nada.',
                subcampos: [
                    { nombre: 'temporada', etiqueta: 'Temporada', tipo: 'numero', porDefecto: 1 },
                    { nombre: 'numero', etiqueta: 'Nº', tipo: 'numero' },
                    { nombre: 'titulo', etiqueta: 'Título', tipo: 'texto' },
                    { nombre: 'duracionMinutos', etiqueta: 'Minutos', tipo: 'numero' }
                ]
            }
        ]
    },

    categorias: {
        titulo: 'Categorías',
        singular: 'categoría',
        api: api.categorias,
        columnas: [
            { etiqueta: 'Nombre', valor: (fila) => fila.nombre },
            { etiqueta: 'Descripción', valor: (fila) => fila.descripcion }
        ],
        campos: async () => [
            { nombre: 'nombre', etiqueta: 'Nombre', tipo: 'texto', requerido: true },
            { nombre: 'descripcion', etiqueta: 'Descripción', tipo: 'texto' }
        ]
    },

    productoras: {
        titulo: 'Productoras',
        singular: 'productora',
        api: api.productoras,
        columnas: [
            { etiqueta: 'Nombre', valor: (fila) => fila.nombre },
            { etiqueta: 'País', valor: (fila) => fila.pais },
            { etiqueta: 'Fundación', valor: (fila) => fila.anioFundacion }
        ],
        campos: async () => [
            { nombre: 'nombre', etiqueta: 'Nombre', tipo: 'texto', requerido: true },
            { nombre: 'pais', etiqueta: 'País', tipo: 'texto', requerido: true },
            { nombre: 'anioFundacion', etiqueta: 'Año de fundación', tipo: 'numero', requerido: true, minimo: 1888 }
        ]
    },

    actores: {
        titulo: 'Actores',
        singular: 'actor',
        api: api.actores,
        columnas: [
            { etiqueta: 'Nombre', valor: (fila) => fila.nombre },
            { etiqueta: 'Nacionalidad', valor: (fila) => fila.nacionalidad },
            { etiqueta: 'Edad', valor: (fila) => fila.edad ?? '' }
        ],
        campos: async () => [
            { nombre: 'nombre', etiqueta: 'Nombre', tipo: 'texto', requerido: true },
            { nombre: 'nacionalidad', etiqueta: 'Nacionalidad', tipo: 'texto', requerido: true },
            { nombre: 'fechaNacimiento', etiqueta: 'Fecha de nacimiento', tipo: 'fecha', requerido: true },
            { nombre: 'foto', etiqueta: 'Foto (URL)', tipo: 'enlace' }
        ]
    },

    capitulos: {
        titulo: 'Capítulos',
        singular: 'capítulo',
        api: api.capitulos,
        preparar: async () => ({ programas: await mapa(api.programas, 'titulo') }),
        columnas: [
            { etiqueta: 'Programa', valor: (fila, contexto) => contexto.programas.get(fila.programaId) ?? '' },
            { etiqueta: 'Nº', valor: (fila) => fila.etiqueta },
            { etiqueta: 'Título', valor: (fila) => fila.titulo },
            { etiqueta: 'Duración', valor: (fila) => duracion(fila.duracionMinutos) }
        ],
        campos: async () => [
            {
                nombre: 'programaId',
                etiqueta: 'Programa',
                tipo: 'seleccion',
                requerido: true,
                soloAlCrear: true,
                valores: await opciones(api.programas, 'titulo')
            },
            { nombre: 'temporada', etiqueta: 'Temporada', tipo: 'numero', requerido: true, minimo: 1 },
            { nombre: 'numero', etiqueta: 'Número de capítulo', tipo: 'numero', requerido: true, minimo: 1 },
            { nombre: 'titulo', etiqueta: 'Título', tipo: 'texto', requerido: true },
            { nombre: 'duracionMinutos', etiqueta: 'Duración (minutos)', tipo: 'numero', requerido: true, minimo: 1 },
            { nombre: 'fechaEstreno', etiqueta: 'Fecha de estreno', tipo: 'fecha' }
        ]
    },

    personajes: {
        titulo: 'Personajes',
        singular: 'personaje',
        api: api.personajes,
        preparar: async () => ({
            programas: await mapa(api.programas, 'titulo'),
            actores: await mapa(api.actores)
        }),
        columnas: [
            { etiqueta: 'Personaje', valor: (fila) => fila.nombre },
            { etiqueta: 'Programa', valor: (fila, contexto) => contexto.programas.get(fila.programaId) ?? '' },
            { etiqueta: 'Actor', valor: (fila, contexto) => contexto.actores.get(fila.actorId) ?? '' }
        ],
        campos: async () => [
            { nombre: 'nombre', etiqueta: 'Nombre del personaje', tipo: 'texto', requerido: true },
            {
                nombre: 'programaId',
                etiqueta: 'Programa',
                tipo: 'seleccion',
                requerido: true,
                soloAlCrear: true,
                valores: await opciones(api.programas, 'titulo')
            },
            {
                nombre: 'actorId',
                etiqueta: 'Actor',
                tipo: 'seleccion',
                requerido: true,
                valores: await opciones(api.actores)
            }
        ]
    }
};
