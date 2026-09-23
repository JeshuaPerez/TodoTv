import { entorno } from './entorno.js';

const referencia = (nombre) => ({ $ref: '#/components/schemas/' + nombre });

const cuerpo = (nombre) => ({
    required: true,
    content: { 'application/json': { schema: referencia(nombre) } }
});

const respuesta = (descripcion, esquema = null) => ({
    description: descripcion,
    ...(esquema ? { content: { 'application/json': { schema: esquema } } } : {})
});

const fallo = (descripcion) => respuesta(descripcion, referencia('Error'));

const fallosDeEscritura = {
    400: fallo('Datos inválidos'),
    401: fallo('Falta iniciar sesión'),
    403: fallo('Hace falta ser administrador'),
    409: fallo('Duplicado o recurso en uso')
};

const parametroId = (etiqueta) => ({
    name: 'id',
    in: 'path',
    required: true,
    schema: { type: 'string' },
    description: etiqueta
});

// las cinco operaciones se repiten en todos los recursos: se generan una vez
function crudDeRecurso({ ruta, etiqueta, salida, entrada, singular, filtros = [] }) {
    return {
        ['/' + ruta]: {
            get: {
                tags: [etiqueta],
                summary: 'Lista ' + etiqueta.toLowerCase(),
                ...(filtros.length > 0 ? { parameters: filtros } : {}),
                responses: { 200: respuesta('Listado', { type: 'array', items: referencia(salida) }) }
            },
            post: {
                tags: [etiqueta],
                summary: 'Crea ' + singular + ' (administrador)',
                security: [{ cookieAuth: [] }],
                requestBody: cuerpo(entrada),
                responses: { 201: respuesta('Creado', referencia(salida)), ...fallosDeEscritura }
            }
        },
        ['/' + ruta + '/{id}']: {
            get: {
                tags: [etiqueta],
                summary: 'Obtiene ' + singular,
                parameters: [parametroId('Identificador de ' + singular)],
                responses: { 200: respuesta('Encontrado', referencia(salida)), 404: fallo('No existe') }
            },
            put: {
                tags: [etiqueta],
                summary: 'Actualiza ' + singular + ' (administrador)',
                security: [{ cookieAuth: [] }],
                parameters: [parametroId('Identificador de ' + singular)],
                requestBody: cuerpo(entrada),
                responses: { 200: respuesta('Actualizado', referencia(salida)), ...fallosDeEscritura, 404: fallo('No existe') }
            },
            delete: {
                tags: [etiqueta],
                summary: 'Borra ' + singular + ' (administrador)',
                security: [{ cookieAuth: [] }],
                parameters: [parametroId('Identificador de ' + singular)],
                responses: { 204: respuesta('Borrado'), ...fallosDeEscritura, 404: fallo('No existe') }
            }
        }
    };
}

const esquemas = {
    Error: {
        type: 'object',
        properties: {
            error: {
                type: 'object',
                properties: {
                    codigo: { type: 'string', example: 'NO_ENCONTRADO' },
                    mensaje: { type: 'string', example: 'El programa no existe' },
                    detalles: { type: 'array', items: { type: 'object' } }
                }
            }
        }
    },
    Categoria: {
        type: 'object',
        properties: {
            id: { type: 'string' },
            nombre: { type: 'string', example: 'anime' },
            descripcion: { type: 'string' }
        }
    },
    CategoriaEntrada: {
        type: 'object',
        required: ['nombre'],
        properties: { nombre: { type: 'string' }, descripcion: { type: 'string' } }
    },
    Productora: {
        type: 'object',
        properties: {
            id: { type: 'string' },
            nombre: { type: 'string', example: 'Toei Animation' },
            pais: { type: 'string', example: 'Japón' },
            anioFundacion: { type: 'integer', example: 1948 }
        }
    },
    ProductoraEntrada: {
        type: 'object',
        required: ['nombre', 'pais', 'anioFundacion'],
        properties: {
            nombre: { type: 'string' },
            pais: { type: 'string' },
            anioFundacion: { type: 'integer', minimum: 1888 }
        }
    },
    Programa: {
        type: 'object',
        properties: {
            id: { type: 'string' },
            titulo: { type: 'string', example: 'Dragon Ball' },
            sinopsis: { type: 'string' },
            poster: { type: 'string', format: 'uri' },
            trailer: { type: 'string', format: 'uri' },
            categoriaId: { type: 'string' },
            productoraId: { type: 'string' },
            categoria: referencia('Categoria'),
            productora: referencia('Productora'),
            capitulos: { type: 'array', items: referencia('Capitulo') },
            reparto: { type: 'array', items: referencia('Personaje') }
        }
    },
    ProgramaEntrada: {
        type: 'object',
        required: ['titulo', 'sinopsis', 'poster', 'trailer', 'categoriaId', 'productoraId'],
        properties: {
            titulo: { type: 'string' },
            sinopsis: { type: 'string', minLength: 10 },
            poster: { type: 'string', format: 'uri' },
            trailer: { type: 'string', format: 'uri' },
            categoriaId: { type: 'string' },
            productoraId: { type: 'string' },
            capitulos: {
                type: 'array',
                description: 'Capítulos iniciales opcionales: se crean con el programa en una transacción',
                items: referencia('CapituloEntrada')
            }
        }
    },
    Capitulo: {
        type: 'object',
        properties: {
            id: { type: 'string' },
            programaId: { type: 'string' },
            temporada: { type: 'integer', example: 1 },
            numero: { type: 'integer', example: 5 },
            titulo: { type: 'string' },
            duracionMinutos: { type: 'integer', example: 24 },
            fechaEstreno: { type: 'string', format: 'date-time' },
            etiqueta: { type: 'string', example: 'T1E05' }
        }
    },
    CapituloEntrada: {
        type: 'object',
        required: ['programaId', 'temporada', 'numero', 'titulo', 'duracionMinutos'],
        properties: {
            programaId: { type: 'string' },
            temporada: { type: 'integer', minimum: 1 },
            numero: { type: 'integer', minimum: 1 },
            titulo: { type: 'string' },
            duracionMinutos: { type: 'integer', minimum: 1, maximum: 600 },
            fechaEstreno: { type: 'string', format: 'date' }
        }
    },
    Actor: {
        type: 'object',
        properties: {
            id: { type: 'string' },
            nombre: { type: 'string' },
            nacionalidad: { type: 'string' },
            fechaNacimiento: { type: 'string', format: 'date-time' },
            edad: { type: 'integer' },
            foto: { type: 'string', format: 'uri' },
            personajes: { type: 'array', items: referencia('Personaje') }
        }
    },
    ActorEntrada: {
        type: 'object',
        required: ['nombre', 'nacionalidad', 'fechaNacimiento'],
        properties: {
            nombre: { type: 'string' },
            nacionalidad: { type: 'string' },
            fechaNacimiento: { type: 'string', format: 'date' },
            foto: { type: 'string', format: 'uri' }
        }
    },
    Personaje: {
        type: 'object',
        properties: {
            id: { type: 'string' },
            nombre: { type: 'string', example: 'Son Goku' },
            programaId: { type: 'string' },
            actorId: { type: 'string' },
            actor: referencia('Actor'),
            programa: referencia('Programa')
        }
    },
    PersonajeEntrada: {
        type: 'object',
        required: ['nombre', 'programaId', 'actorId'],
        properties: {
            nombre: { type: 'string' },
            programaId: { type: 'string' },
            actorId: { type: 'string' }
        }
    },
    Usuario: {
        type: 'object',
        properties: {
            id: { type: 'string' },
            nombreUsuario: { type: 'string' },
            correo: { type: 'string', format: 'email' },
            rol: { type: 'string', enum: ['usuario', 'administrador'] },
            favoritos: { type: 'array', items: { type: 'string' } }
        }
    },
    RegistroEntrada: {
        type: 'object',
        required: ['nombreUsuario', 'correo', 'contrasena'],
        properties: {
            nombreUsuario: { type: 'string', minLength: 3 },
            correo: { type: 'string', format: 'email' },
            contrasena: { type: 'string', minLength: 8 }
        }
    },
    InicioSesionEntrada: {
        type: 'object',
        required: ['correo', 'contrasena'],
        properties: {
            correo: { type: 'string', format: 'email' },
            contrasena: { type: 'string' }
        }
    }
};

const rutasPropias = {
    '/autenticacion/registro': {
        post: {
            tags: ['Autenticación'],
            summary: 'Registra un usuario y deja la sesión abierta en una cookie httpOnly',
            requestBody: cuerpo('RegistroEntrada'),
            responses: {
                201: respuesta('Registrado', referencia('Usuario')),
                400: fallo('Datos inválidos'),
                409: fallo('El correo o el nombre de usuario ya existen'),
                429: fallo('Demasiados intentos')
            }
        }
    },
    '/autenticacion/inicio-sesion': {
        post: {
            tags: ['Autenticación'],
            summary: 'Inicia sesión y guarda el JWT en una cookie httpOnly',
            requestBody: cuerpo('InicioSesionEntrada'),
            responses: {
                200: respuesta('Sesión iniciada', referencia('Usuario')),
                401: fallo('Credenciales incorrectas'),
                429: fallo('Demasiados intentos')
            }
        }
    },
    '/autenticacion/cierre-sesion': {
        post: {
            tags: ['Autenticación'],
            summary: 'Limpia la cookie de sesión',
            responses: { 204: respuesta('Sesión cerrada') }
        }
    },
    '/autenticacion/perfil': {
        get: {
            tags: ['Autenticación'],
            summary: 'Devuelve el usuario de la sesión actual',
            security: [{ cookieAuth: [] }],
            responses: { 200: respuesta('Perfil', referencia('Usuario')), 401: fallo('Sin sesión') }
        }
    },
    '/programas/{programaId}/capitulos': {
        get: {
            tags: ['Programas'],
            summary: 'Capítulos de un programa, ordenados por temporada y número',
            parameters: [{ name: 'programaId', in: 'path', required: true, schema: { type: 'string' } }],
            responses: { 200: respuesta('Listado', { type: 'array', items: referencia('Capitulo') }), 404: fallo('No existe') }
        }
    },
    '/programas/{programaId}/personajes': {
        get: {
            tags: ['Programas'],
            summary: 'Reparto de un programa, cada personaje con su actor',
            parameters: [{ name: 'programaId', in: 'path', required: true, schema: { type: 'string' } }],
            responses: { 200: respuesta('Listado', { type: 'array', items: referencia('Personaje') }), 404: fallo('No existe') }
        }
    },
    '/favoritos': {
        get: {
            tags: ['Favoritos'],
            summary: 'Programas favoritos del usuario de la sesión',
            security: [{ cookieAuth: [] }],
            responses: { 200: respuesta('Listado', { type: 'array', items: referencia('Programa') }), 401: fallo('Sin sesión') }
        }
    },
    '/favoritos/{programaId}': {
        post: {
            tags: ['Favoritos'],
            summary: 'Marca un programa como favorito',
            security: [{ cookieAuth: [] }],
            parameters: [{ name: 'programaId', in: 'path', required: true, schema: { type: 'string' } }],
            responses: { 201: respuesta('Favoritos actualizados'), 401: fallo('Sin sesión'), 404: fallo('No existe') }
        },
        delete: {
            tags: ['Favoritos'],
            summary: 'Quita un programa de favoritos',
            security: [{ cookieAuth: [] }],
            parameters: [{ name: 'programaId', in: 'path', required: true, schema: { type: 'string' } }],
            responses: { 200: respuesta('Favoritos actualizados'), 401: fallo('Sin sesión') }
        }
    }
};

const recursos = [
    {
        ruta: 'programas',
        etiqueta: 'Programas',
        salida: 'Programa',
        entrada: 'ProgramaEntrada',
        singular: 'un programa',
        filtros: [
            { name: 'categoria', in: 'query', schema: { type: 'string' }, description: 'Filtra por id de categoría' },
            { name: 'texto', in: 'query', schema: { type: 'string' }, description: 'Filtra por coincidencia en el título' }
        ]
    },
    { ruta: 'categorias', etiqueta: 'Categorías', salida: 'Categoria', entrada: 'CategoriaEntrada', singular: 'una categoría' },
    { ruta: 'productoras', etiqueta: 'Productoras', salida: 'Productora', entrada: 'ProductoraEntrada', singular: 'una productora' },
    { ruta: 'actores', etiqueta: 'Actores', salida: 'Actor', entrada: 'ActorEntrada', singular: 'un actor', filtros: [{ name: 'texto', in: 'query', schema: { type: 'string' }, description: 'Filtra por coincidencia en el nombre' }] },
    { ruta: 'capitulos', etiqueta: 'Capítulos', salida: 'Capitulo', entrada: 'CapituloEntrada', singular: 'un capítulo' },
    { ruta: 'personajes', etiqueta: 'Personajes', salida: 'Personaje', entrada: 'PersonajeEntrada', singular: 'un personaje' }
];

export const documentoSwagger = {
    openapi: '3.0.3',
    info: {
        title: 'TodoTv API',
        version: entorno.version,
        description: 'API para gestionar programas de televisión: catálogo, capítulos, reparto y favoritos.\n\n' +
            'La sesión viaja en una cookie httpOnly. Para probar los endpoints protegidos, primero ' +
            'iniciá sesión en /autenticacion/inicio-sesion y el navegador guardará la cookie.\n\n' +
            'Podés pedir una versión concreta de la API con la cabecera Accept-Version (rango semver). ' +
            'Si no es compatible con la versión actual, la respuesta es 409.'
    },
    servers: [{ url: '/api', description: 'Servidor actual' }],
    tags: [
        { name: 'Autenticación' },
        { name: 'Programas' },
        { name: 'Categorías' },
        { name: 'Productoras' },
        { name: 'Actores' },
        { name: 'Capítulos' },
        { name: 'Personajes' },
        { name: 'Favoritos' }
    ],
    components: {
        schemas: esquemas,
        securitySchemes: {
            cookieAuth: { type: 'apiKey', in: 'cookie', name: entorno.cookie.nombre }
        }
    },
    paths: {
        ...rutasPropias,
        ...recursos.reduce((acumulado, recurso) => ({ ...acumulado, ...crudDeRecurso(recurso) }), {})
    }
};
