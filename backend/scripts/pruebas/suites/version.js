import { estado, igual, verdadero, codigoError } from '../ayudas.js';

export async function pruebasVersion(registro, contexto) {
    const cliente = contexto.cliente();

    await registro.prueba('la respuesta anuncia la versión de la API', async () => {
        const respuesta = await cliente.get('/programas');
        estado(respuesta, 200);
        igual(respuesta.cabeceras.get('x-api-version'), '1.0.0');
    });

    await registro.prueba('sin cabecera se asume la versión actual', async () => {
        const respuesta = await contexto.cliente().get('/programas', { 'Accept-Version': '' });
        estado(respuesta, 200);
    });

    await registro.prueba('un rango compatible pasa', async () => {
        estado(await cliente.get('/programas', { 'Accept-Version': '1.x' }), 200);
        estado(await cliente.get('/programas', { 'Accept-Version': '^1.0.0' }), 200);
        estado(await cliente.get('/programas', { 'Accept-Version': '1.0.0' }), 200);
    });

    await registro.prueba('un rango incompatible responde 409', async () => {
        const respuesta = await cliente.get('/programas', { 'Accept-Version': '2.x' });
        estado(respuesta, 409);
        codigoError(respuesta, 'VERSION_NO_COMPATIBLE');
        igual(respuesta.datos.error.detalles.versionApi, '1.0.0');
    });

    await registro.prueba('un rango que no es semver responde 409', async () => {
        const respuesta = await cliente.get('/programas', { 'Accept-Version': 'la-ultima' });
        estado(respuesta, 409);
        verdadero(respuesta.datos.error.mensaje.includes('semver'), 'el mensaje no explica el problema');
    });
}
