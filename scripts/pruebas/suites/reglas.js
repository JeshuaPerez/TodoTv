import { estado, igual, codigoError } from '../ayudas.js';

export async function pruebasReglas(registro, contexto) {
    const admin = await contexto.clienteAdministrador();
    const datos = contexto.datos;

    await registro.prueba('el mismo número de capítulo en la misma temporada responde 409', async () => {
        const respuesta = await admin.post('/capitulos', {
            programaId: datos.programa.id,
            temporada: 1,
            numero: 1,
            titulo: 'Repetido',
            duracionMinutos: 24
        });
        estado(respuesta, 409);
        codigoError(respuesta, 'DUPLICADO');
    });

    await registro.prueba('el mismo número en otra temporada sí entra', async () => {
        const respuesta = await admin.post('/capitulos', {
            programaId: datos.programa.id,
            temporada: 2,
            numero: 1,
            titulo: 'Arranca la segunda temporada',
            duracionMinutos: 24
        });
        estado(respuesta, 201);
        igual(respuesta.datos.etiqueta, 'T2E01');
    });

    await registro.prueba('un actor no puede interpretar dos veces el mismo personaje', async () => {
        const respuesta = await admin.post('/personajes', {
            nombre: 'Son Goku',
            programaId: datos.programa.id,
            actorId: datos.actor.id
        });
        estado(respuesta, 409);
        codigoError(respuesta, 'DUPLICADO');
    });

    await registro.prueba('otro actor sí puede interpretar al mismo personaje', async () => {
        const otro = await admin.post('/actores', {
            nombre: 'Otro intérprete',
            nacionalidad: 'Japonesa',
            fechaNacimiento: '1970-01-01'
        });
        estado(otro, 201);

        const respuesta = await admin.post('/personajes', {
            nombre: 'Son Goku',
            programaId: datos.programa.id,
            actorId: otro.datos.id
        });
        estado(respuesta, 201);
        datos.actorSecundario = otro.datos;
        datos.personajeSecundario = respuesta.datos;
    });

    await registro.prueba('no se borra una categoría que tiene programas', async () => {
        const respuesta = await admin.borrar('/categorias/' + datos.categoria.id);
        estado(respuesta, 409);
        codigoError(respuesta, 'EN_USO');
    });

    await registro.prueba('no se borra una productora que tiene programas', async () => {
        const respuesta = await admin.borrar('/productoras/' + datos.productora.id);
        estado(respuesta, 409);
        codigoError(respuesta, 'EN_USO');
    });

    await registro.prueba('no se borra un actor que interpreta personajes', async () => {
        const respuesta = await admin.borrar('/actores/' + datos.actor.id);
        estado(respuesta, 409);
        codigoError(respuesta, 'EN_USO');
    });

    await registro.prueba('un actor libre sí se borra', async () => {
        const libre = await admin.post('/actores', {
            nombre: 'Actor sin papeles',
            nacionalidad: 'Argentina',
            fechaNacimiento: '1990-05-05'
        });
        estado(libre, 201);
        estado(await admin.borrar('/actores/' + libre.datos.id), 204);
        estado(await contexto.cliente().get('/actores/' + libre.datos.id), 404);
    });
}
