import { estado, igual, verdadero, codigoError } from '../ayudas.js';

export async function pruebasCatalogo(registro, contexto) {
    const admin = await contexto.clienteAdministrador();
    const { cliente: usuario } = await contexto.clienteUsuario();
    const datos = {};

    await registro.prueba('el administrador crea una categoría', async () => {
        const respuesta = await admin.post('/categorias', { nombre: 'anime', descripcion: 'Animación japonesa' });
        estado(respuesta, 201);
        igual(respuesta.datos.nombre, 'anime');
        datos.categoria = respuesta.datos;
    });

    await registro.prueba('un usuario normal no puede crear categorías', async () => {
        const respuesta = await usuario.post('/categorias', { nombre: 'novelas' });
        estado(respuesta, 403);
        codigoError(respuesta, 'NO_AUTORIZADO');
    });

    await registro.prueba('sin sesión tampoco se puede crear', async () => {
        const respuesta = await contexto.cliente().post('/categorias', { nombre: 'cartoons' });
        estado(respuesta, 401);
    });

    await registro.prueba('el nombre repetido choca aunque cambien las mayúsculas', async () => {
        const respuesta = await admin.post('/categorias', { nombre: 'ANIME' });
        estado(respuesta, 409);
        codigoError(respuesta, 'DUPLICADO');
    });

    await registro.prueba('el administrador crea una productora', async () => {
        const respuesta = await admin.post('/productoras', { nombre: 'Toei Animation', pais: 'Japón', anioFundacion: 1948 });
        estado(respuesta, 201);
        datos.productora = respuesta.datos;
    });

    await registro.prueba('el año de fundación fuera de rango responde 400', async () => {
        const respuesta = await admin.post('/productoras', { nombre: 'Futuro', pais: 'Japón', anioFundacion: 3000 });
        estado(respuesta, 400);
        codigoError(respuesta, 'VALIDACION');
    });

    await registro.prueba('el administrador crea un actor y le calcula la edad', async () => {
        const respuesta = await admin.post('/actores', {
            nombre: 'Masako Nozawa',
            nacionalidad: 'Japonesa',
            fechaNacimiento: '1936-10-25',
            foto: 'https://ejemplo.com/masako.jpg'
        });
        estado(respuesta, 201);
        verdadero(respuesta.datos.edad > 80, 'la edad no se calculó');
        datos.actor = respuesta.datos;
    });

    await registro.prueba('el poster que no es una URL responde 400', async () => {
        const respuesta = await admin.post('/programas', {
            titulo: 'Sin poster',
            sinopsis: 'Una sinopsis suficientemente larga.',
            poster: 'no-es-una-url',
            trailer: 'https://ejemplo.com/trailer.mp4',
            categoriaId: datos.categoria.id,
            productoraId: datos.productora.id
        });
        estado(respuesta, 400);
        verdadero(
            respuesta.datos.error.detalles.some((detalle) => detalle.campo === 'poster'),
            'el detalle no menciona el poster'
        );
    });

    await registro.prueba('el administrador crea un programa', async () => {
        const respuesta = await admin.post('/programas', {
            titulo: 'Dragon Ball',
            sinopsis: 'Las aventuras de Goku desde su infancia.',
            poster: 'https://ejemplo.com/db.jpg',
            trailer: 'https://ejemplo.com/db.mp4',
            categoriaId: datos.categoria.id,
            productoraId: datos.productora.id
        });
        estado(respuesta, 201);
        igual(respuesta.datos.categoria.nombre, 'anime', 'el detalle no trae la categoría resuelta');
        datos.programa = respuesta.datos;
    });

    await registro.prueba('el título repetido responde 409', async () => {
        const respuesta = await admin.post('/programas', {
            titulo: 'dragon ball',
            sinopsis: 'Otra sinopsis bastante larga.',
            poster: 'https://ejemplo.com/otro.jpg',
            trailer: 'https://ejemplo.com/otro.mp4',
            categoriaId: datos.categoria.id,
            productoraId: datos.productora.id
        });
        estado(respuesta, 409);
        codigoError(respuesta, 'DUPLICADO');
    });

    await registro.prueba('una categoría inexistente responde 404', async () => {
        const respuesta = await admin.post('/programas', {
            titulo: 'Huérfano',
            sinopsis: 'Una sinopsis suficientemente larga.',
            poster: 'https://ejemplo.com/h.jpg',
            trailer: 'https://ejemplo.com/h.mp4',
            categoriaId: '000000000000000000000000',
            productoraId: datos.productora.id
        });
        estado(respuesta, 404);
    });

    await registro.prueba('el administrador agrega capítulos y personajes', async () => {
        const capitulo = await admin.post('/capitulos', {
            programaId: datos.programa.id,
            temporada: 1,
            numero: 1,
            titulo: 'Bulma y Son Goku',
            duracionMinutos: 24,
            fechaEstreno: '1986-02-26'
        });
        estado(capitulo, 201);
        igual(capitulo.datos.etiqueta, 'T1E01');
        datos.capitulo = capitulo.datos;

        const personaje = await admin.post('/personajes', {
            nombre: 'Son Goku',
            programaId: datos.programa.id,
            actorId: datos.actor.id
        });
        estado(personaje, 201);
        datos.personaje = personaje.datos;
    });

    await registro.prueba('el detalle del programa trae capítulos y reparto', async () => {
        const respuesta = await contexto.cliente().get('/programas/' + datos.programa.id);
        estado(respuesta, 200);
        igual(respuesta.datos.capitulos.length, 1);
        igual(respuesta.datos.reparto.length, 1);
        igual(respuesta.datos.reparto[0].actor.nombre, 'Masako Nozawa', 'el reparto no resolvió el actor');
        igual(respuesta.datos.productora.nombre, 'Toei Animation');
    });

    await registro.prueba('la ficha del actor trae los personajes con su programa', async () => {
        const respuesta = await contexto.cliente().get('/actores/' + datos.actor.id);
        estado(respuesta, 200);
        igual(respuesta.datos.personajes.length, 1);
        igual(respuesta.datos.personajes[0].programa.titulo, 'Dragon Ball');
    });

    await registro.prueba('el catálogo filtra por categoría y por texto', async () => {
        const porCategoria = await contexto.cliente().get('/programas?categoria=' + datos.categoria.id);
        estado(porCategoria, 200);
        verdadero(porCategoria.datos.length >= 1, 'el filtro por categoría no devolvió nada');

        const porTexto = await contexto.cliente().get('/programas?texto=dragon');
        igual(porTexto.datos.length, 1);

        const sinResultados = await contexto.cliente().get('/programas?texto=zzzzz');
        igual(sinResultados.datos.length, 0);
    });

    await registro.prueba('el catálogo se lee sin iniciar sesión', async () => {
        estado(await contexto.cliente().get('/programas'), 200);
        estado(await contexto.cliente().get('/categorias'), 200);
    });

    await registro.prueba('un id mal formado responde 400 y uno inexistente 404', async () => {
        estado(await contexto.cliente().get('/programas/abc'), 400);
        estado(await contexto.cliente().get('/programas/000000000000000000000000'), 404);
    });

    await registro.prueba('el administrador actualiza el programa', async () => {
        const respuesta = await admin.put('/programas/' + datos.programa.id, { sinopsis: 'Sinopsis corregida y más larga.' });
        estado(respuesta, 200);
        igual(respuesta.datos.sinopsis, 'Sinopsis corregida y más larga.');
    });

    await registro.prueba('una ruta inventada responde 404 y un JSON roto 400', async () => {
        const inventada = await contexto.cliente().get('/inventada');
        estado(inventada, 404);
        codigoError(inventada, 'NO_ENCONTRADO');

        const roto = await admin.post('/categorias', '{ esto no cierra');
        estado(roto, 400);
        codigoError(roto, 'VALIDACION');
    });

    contexto.datos = datos;
}
