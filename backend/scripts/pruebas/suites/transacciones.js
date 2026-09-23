import { ObjectId } from 'mongodb';
import { estado, igual, verdadero, codigoError } from '../ayudas.js';

export async function pruebasTransacciones(registro, contexto) {
    const admin = await contexto.clienteAdministrador();
    const datos = contexto.datos;
    const programas = contexto.base.collection('programas');
    const capitulos = contexto.base.collection('capitulos');
    const personajes = contexto.base.collection('personajes');

    await registro.prueba('un programa se crea junto con sus capítulos iniciales', async () => {
        const respuesta = await admin.post('/programas', {
            titulo: 'Sailor Moon',
            sinopsis: 'Guerreras que luchan en nombre de la Luna.',
            poster: 'https://ejemplo.com/sm.jpg',
            trailer: 'https://ejemplo.com/sm.mp4',
            categoriaId: datos.categoria.id,
            productoraId: datos.productora.id,
            capitulos: [
                { temporada: 1, numero: 1, titulo: 'La llorona', duracionMinutos: 24 },
                { temporada: 1, numero: 2, titulo: 'El anillo', duracionMinutos: 24 }
            ]
        });
        estado(respuesta, 201);
        igual(respuesta.datos.capitulos.length, 2);
        datos.programaConCapitulos = respuesta.datos;
    });

    await registro.prueba('si un capítulo inicial choca, no queda nada creado', async () => {
        const respuesta = await admin.post('/programas', {
            titulo: 'Candy Candy',
            sinopsis: 'La historia de una huérfana en un orfanato.',
            poster: 'https://ejemplo.com/cc.jpg',
            trailer: 'https://ejemplo.com/cc.mp4',
            categoriaId: datos.categoria.id,
            productoraId: datos.productora.id,
            capitulos: [
                { temporada: 1, numero: 1, titulo: 'Uno', duracionMinutos: 24 },
                { temporada: 1, numero: 1, titulo: 'Uno otra vez', duracionMinutos: 24 }
            ]
        });
        estado(respuesta, 409);
        codigoError(respuesta, 'DUPLICADO');

        igual(await programas.countDocuments({ titulo: 'Candy Candy' }), 0, 'el programa quedó a medio crear');
        igual(await capitulos.countDocuments({ titulo: 'Uno' }), 0, 'quedaron capítulos huérfanos');
    });

    await registro.prueba('borrar un programa arrastra sus capítulos y personajes', async () => {
        const programaId = datos.programa.id;
        verdadero(await capitulos.countDocuments({ programaId: { $exists: true } }) > 0);

        const antesCapitulos = await capitulos.countDocuments();
        const antesPersonajes = await personajes.countDocuments();

        const respuesta = await admin.borrar('/programas/' + programaId);
        estado(respuesta, 204);

        estado(await contexto.cliente().get('/programas/' + programaId), 404);
        igual(await capitulos.countDocuments({ programaId: new ObjectId(programaId) }), 0, 'quedaron capítulos');
        igual(await personajes.countDocuments({ programaId: new ObjectId(programaId) }), 0, 'quedaron personajes');
        verdadero(await capitulos.countDocuments() < antesCapitulos, 'no se borró ningún capítulo');
        verdadero(await personajes.countDocuments() < antesPersonajes, 'no se borró ningún personaje');
    });

    await registro.prueba('borrado el programa, su categoría y su actor ya se pueden borrar', async () => {
        estado(await admin.borrar('/actores/' + datos.actor.id), 204);
        estado(await admin.borrar('/actores/' + datos.actorSecundario.id), 204);
    });
}
