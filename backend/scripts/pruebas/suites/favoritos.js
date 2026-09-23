import { estado, igual, codigoError } from '../ayudas.js';

export async function pruebasFavoritos(registro, contexto) {
    const { cliente } = await contexto.clienteUsuario();
    const programaId = contexto.datos.programaConCapitulos.id;

    await registro.prueba('sin sesión los favoritos responden 401', async () => {
        const respuesta = await contexto.cliente().get('/favoritos');
        estado(respuesta, 401);
        codigoError(respuesta, 'NO_AUTENTICADO');
    });

    await registro.prueba('un usuario nuevo arranca sin favoritos', async () => {
        const respuesta = await cliente.get('/favoritos');
        estado(respuesta, 200);
        igual(respuesta.datos.length, 0);
    });

    await registro.prueba('marcar un favorito lo agrega a la lista', async () => {
        const respuesta = await cliente.post('/favoritos/' + programaId);
        estado(respuesta, 201);
        igual(respuesta.datos.length, 1);
        igual(respuesta.datos[0].id, programaId);
    });

    await registro.prueba('marcarlo dos veces no lo duplica', async () => {
        const respuesta = await cliente.post('/favoritos/' + programaId);
        estado(respuesta, 201);
        igual(respuesta.datos.length, 1);
    });

    await registro.prueba('el favorito sobrevive a un nuevo inicio de sesión', async () => {
        const respuesta = await cliente.get('/autenticacion/perfil');
        igual(respuesta.datos.favoritos.length, 1);
        igual(respuesta.datos.favoritos[0], programaId);
    });

    await registro.prueba('un programa inexistente no se puede marcar', async () => {
        const respuesta = await cliente.post('/favoritos/000000000000000000000000');
        estado(respuesta, 404);
    });

    await registro.prueba('quitar el favorito deja la lista vacía', async () => {
        const respuesta = await cliente.borrar('/favoritos/' + programaId);
        estado(respuesta, 200);
        igual(respuesta.datos.length, 0);
    });

    await registro.prueba('los favoritos de un usuario no se mezclan con los de otro', async () => {
        const { cliente: otro } = await contexto.clienteUsuario();
        await otro.post('/favoritos/' + programaId);

        igual((await cliente.get('/favoritos')).datos.length, 0);
        igual((await otro.get('/favoritos')).datos.length, 1);
    });
}
