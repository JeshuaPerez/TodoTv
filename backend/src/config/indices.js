import { COLECCIONES, COTEJO_ES } from './colecciones.js';

const INDICES = {
    [COLECCIONES.CATEGORIAS]: [
        { key: { nombre: 1 }, name: 'categoria_nombre_unico', unique: true, collation: COTEJO_ES }
    ],
    [COLECCIONES.PRODUCTORAS]: [
        { key: { nombre: 1 }, name: 'productora_nombre_unico', unique: true, collation: COTEJO_ES }
    ],
    [COLECCIONES.PROGRAMAS]: [
        { key: { titulo: 1 }, name: 'programa_titulo_unico', unique: true, collation: COTEJO_ES },
        { key: { categoriaId: 1 }, name: 'programa_categoria' },
        { key: { productoraId: 1 }, name: 'programa_productora' }
    ],
    [COLECCIONES.CAPITULOS]: [
        { key: { programaId: 1, temporada: 1, numero: 1 }, name: 'capitulo_unico_en_temporada', unique: true }
    ],
    [COLECCIONES.ACTORES]: [
        { key: { nombre: 1 }, name: 'actor_nombre', collation: COTEJO_ES }
    ],
    [COLECCIONES.PERSONAJES]: [
        { key: { programaId: 1, nombre: 1, actorId: 1 }, name: 'personaje_unico_por_actor', unique: true, collation: COTEJO_ES },
        { key: { actorId: 1 }, name: 'personaje_actor' }
    ],
    [COLECCIONES.USUARIOS]: [
        { key: { correo: 1 }, name: 'usuario_correo_unico', unique: true, collation: COTEJO_ES },
        { key: { nombreUsuario: 1 }, name: 'usuario_nombre_unico', unique: true, collation: COTEJO_ES }
    ]
};

export async function crearIndices(base) {
    for (const [coleccion, indices] of Object.entries(INDICES)) {
        await base.collection(coleccion).createIndexes(indices);
    }
    return Object.keys(INDICES);
}

export { INDICES };
