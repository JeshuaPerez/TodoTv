import { estado, igual, verdadero, codigoError } from '../ayudas.js';

export async function pruebasAutenticacion(registro, contexto) {
    const credenciales = {
        nombreUsuario: 'televidente',
        correo: 'televidente@todotv.test',
        contrasena: 'secreta1234'
    };
    const cliente = contexto.cliente();

    await registro.prueba('el registro abre sesión en una cookie httpOnly y sameSite strict', async () => {
        const respuesta = await cliente.post('/autenticacion/registro', credenciales);
        estado(respuesta, 201);
        igual(respuesta.datos.rol, 'usuario', 'quien se registra no puede elegir su rol');
        verdadero(cliente.tieneCookie('todotv_token'), 'no llegó la cookie de sesión');

        const cookie = respuesta.cabeceras.getSetCookie()[0];
        verdadero(cookie.includes('HttpOnly'), 'la cookie no es httpOnly');
        verdadero(cookie.includes('SameSite=Strict'), 'la cookie no es sameSite strict');
    });

    await registro.prueba('la contraseña no sale en ninguna respuesta', async () => {
        const respuesta = await cliente.get('/autenticacion/perfil');
        estado(respuesta, 200);
        verdadero(!('contrasena' in respuesta.datos), 'el perfil devolvió la contraseña');
    });

    await registro.prueba('el rol que manda el cliente se ignora', async () => {
        const respuesta = await contexto.cliente().post('/autenticacion/registro', {
            nombreUsuario: 'vivillo',
            correo: 'vivillo@todotv.test',
            contrasena: 'secreta1234',
            rol: 'administrador'
        });
        estado(respuesta, 201);
        igual(respuesta.datos.rol, 'usuario');
    });

    await registro.prueba('el correo repetido responde 409', async () => {
        const respuesta = await contexto.cliente().post('/autenticacion/registro', credenciales);
        estado(respuesta, 409);
        codigoError(respuesta, 'DUPLICADO');
    });

    await registro.prueba('la contraseña corta responde 400 con el detalle del campo', async () => {
        const respuesta = await contexto.cliente().post('/autenticacion/registro', {
            nombreUsuario: 'corto',
            correo: 'corto@todotv.test',
            contrasena: 'abc'
        });
        estado(respuesta, 400);
        codigoError(respuesta, 'VALIDACION');
        verdadero(
            respuesta.datos.error.detalles.some((detalle) => detalle.campo === 'contrasena'),
            'el detalle no menciona el campo contrasena'
        );
    });

    await registro.prueba('el perfil sin cookie responde 401', async () => {
        const respuesta = await contexto.cliente().get('/autenticacion/perfil');
        estado(respuesta, 401);
        codigoError(respuesta, 'NO_AUTENTICADO');
    });

    await registro.prueba('el token en la cabecera Authorization no sirve, solo la cookie', async () => {
        const token = cliente.cookies.get('todotv_token');
        verdadero(Boolean(token), 'no se pudo leer el token de la cookie');
        const respuesta = await contexto.cliente().get('/autenticacion/perfil', {
            Authorization: 'Bearer ' + token
        });
        estado(respuesta, 401);
    });

    await registro.prueba('las credenciales incorrectas responden 401', async () => {
        const respuesta = await contexto.cliente().post('/autenticacion/inicio-sesion', {
            correo: credenciales.correo,
            contrasena: 'equivocada123'
        });
        estado(respuesta, 401);
    });

    await registro.prueba('el correo inexistente responde 401 igual que la contraseña mala', async () => {
        const respuesta = await contexto.cliente().post('/autenticacion/inicio-sesion', {
            correo: 'nadie@todotv.test',
            contrasena: 'secreta1234'
        });
        estado(respuesta, 401);
    });

    await registro.prueba('el inicio de sesión devuelve el usuario y la cookie', async () => {
        const otro = contexto.cliente();
        const respuesta = await otro.post('/autenticacion/inicio-sesion', {
            correo: credenciales.correo,
            contrasena: credenciales.contrasena
        });
        estado(respuesta, 200);
        igual(respuesta.datos.correo, credenciales.correo);
        verdadero(otro.tieneCookie('todotv_token'), 'no llegó la cookie');
    });

    await registro.prueba('el cierre de sesión limpia la cookie', async () => {
        const respuesta = await cliente.post('/autenticacion/cierre-sesion');
        estado(respuesta, 204);
        verdadero(!cliente.tieneCookie('todotv_token'), 'la cookie sigue viva');
        estado(await cliente.get('/autenticacion/perfil'), 401);
    });
}
