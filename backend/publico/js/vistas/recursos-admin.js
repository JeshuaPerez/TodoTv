import { api } from '../api/api.js';

const opcionesDe = async (recurso, campo = 'nombre') => {
    const filas = await recurso.listar();
    return filas.map((fila) => ({ valor: fila.id, texto: fila[campo] }));
};

const mapaDe = async (recurso, campo = 'nombre') => {
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
        campos: [
            { nombre: 'titulo', etiqueta: 'Título', tipo: 'text', requerido: true },
            { nombre: 'sinopsis', etiqueta: 'Sinopsis', tipo: 'textarea', requerido: true },
            { nombre: 'poster', etiqueta: 'Poster (URL de imagen)', tipo: 'url', requerido: true },
            { nombre: 'trailer', etiqueta: 'Trailer (URL de video)', tipo: 'url', requerido: true },
            { nombre: 'categoriaId', etiqueta: 'Categoría', tipo: 'select', requerido: true, opciones: () => opcionesDe(api.categorias) },
            { nombre: 'productoraId', etiqueta: 'Productora', tipo: 'select', requerido: true, opciones: () => opcionesDe(api.productoras) }
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
        campos: [
            { nombre: 'nombre', etiqueta: 'Nombre', tipo: 'text', requerido: true },
            { nombre: 'descripcion', etiqueta: 'Descripción', tipo: 'text' }
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
        campos: [
            { nombre: 'nombre', etiqueta: 'Nombre', tipo: 'text', requerido: true },
            { nombre: 'pais', etiqueta: 'País', tipo: 'text', requerido: true },
            { nombre: 'anioFundacion', etiqueta: 'Año de fundación', tipo: 'number', requerido: true }
        ]
    },

    actores: {
        titulo: 'Actores',
        singular: 'actor',
        api: api.actores,
        columnas: [
            { etiqueta: 'Nombre', valor: (fila) => fila.nombre },
            { etiqueta: 'Nacionalidad', valor: (fila) => fila.nacionalidad },
            { etiqueta: 'Edad', valor: (fila) => (fila.edad ?? '') + '' }
        ],
        campos: [
            { nombre: 'nombre', etiqueta: 'Nombre', tipo: 'text', requerido: true },
            { nombre: 'nacionalidad', etiqueta: 'Nacionalidad', tipo: 'text', requerido: true },
            { nombre: 'fechaNacimiento', etiqueta: 'Fecha de nacimiento', tipo: 'date', requerido: true },
            { nombre: 'foto', etiqueta: 'Foto (URL)', tipo: 'url' }
        ]
    },

    capitulos: {
        titulo: 'Capítulos',
        singular: 'capítulo',
        api: api.capitulos,
        preparar: async () => ({ programas: await mapaDe(api.programas, 'titulo') }),
        columnas: [
            { etiqueta: 'Programa', valor: (fila, contexto) => contexto.programas.get(fila.programaId) ?? '' },
            { etiqueta: 'Nº', valor: (fila) => fila.etiqueta },
            { etiqueta: 'Título', valor: (fila) => fila.titulo },
            { etiqueta: 'Duración', valor: (fila) => fila.duracionMinutos + ' min' }
        ],
        campos: [
            { nombre: 'programaId', etiqueta: 'Programa', tipo: 'select', requerido: true, soloAlCrear: true, opciones: () => opcionesDe(api.programas, 'titulo') },
            { nombre: 'temporada', etiqueta: 'Temporada', tipo: 'number', requerido: true },
            { nombre: 'numero', etiqueta: 'Número de capítulo', tipo: 'number', requerido: true },
            { nombre: 'titulo', etiqueta: 'Título', tipo: 'text', requerido: true },
            { nombre: 'duracionMinutos', etiqueta: 'Duración (minutos)', tipo: 'number', requerido: true },
            { nombre: 'fechaEstreno', etiqueta: 'Fecha de estreno', tipo: 'date' }
        ]
    },

    personajes: {
        titulo: 'Personajes',
        singular: 'personaje',
        api: api.personajes,
        preparar: async () => ({
            programas: await mapaDe(api.programas, 'titulo'),
            actores: await mapaDe(api.actores)
        }),
        columnas: [
            { etiqueta: 'Personaje', valor: (fila) => fila.nombre },
            { etiqueta: 'Programa', valor: (fila, contexto) => contexto.programas.get(fila.programaId) ?? '' },
            { etiqueta: 'Actor', valor: (fila, contexto) => contexto.actores.get(fila.actorId) ?? '' }
        ],
        campos: [
            { nombre: 'nombre', etiqueta: 'Nombre del personaje', tipo: 'text', requerido: true },
            { nombre: 'programaId', etiqueta: 'Programa', tipo: 'select', requerido: true, soloAlCrear: true, opciones: () => opcionesDe(api.programas, 'titulo') },
            { nombre: 'actorId', etiqueta: 'Actor', tipo: 'select', requerido: true, opciones: () => opcionesDe(api.actores) }
        ]
    }
};
