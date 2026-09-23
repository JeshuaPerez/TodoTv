import { peticion, consulta } from './peticiones.js';

const recurso = (ruta) => ({
    listar: () => peticion('GET', ruta),
    obtener: (id) => peticion('GET', ruta + '/' + id),
    crear: (datos) => peticion('POST', ruta, { cuerpo: datos }),
    actualizar: (id, datos) => peticion('PUT', ruta + '/' + id, { cuerpo: datos }),
    borrar: (id) => peticion('DELETE', ruta + '/' + id)
});

export const api = {
    autenticacion: {
        registro: (datos) => peticion('POST', '/autenticacion/registro', { cuerpo: datos, silencioso: true }),
        // un 401 acá es una credencial equivocada, no una sesión que se cayó
        inicioSesion: (datos) => peticion('POST', '/autenticacion/inicio-sesion', { cuerpo: datos, silencioso: true }),
        cierreSesion: () => peticion('POST', '/autenticacion/cierre-sesion'),
        perfil: () => peticion('GET', '/autenticacion/perfil', { silencioso: true })
    },

    programas: {
        ...recurso('/programas'),
        listar: (filtros = {}) => peticion('GET', '/programas' + consulta(filtros)),
        capitulos: (id) => peticion('GET', '/programas/' + id + '/capitulos'),
        personajes: (id) => peticion('GET', '/programas/' + id + '/personajes')
    },

    categorias: recurso('/categorias'),
    productoras: recurso('/productoras'),

    actores: {
        ...recurso('/actores'),
        listar: (filtros = {}) => peticion('GET', '/actores' + consulta(filtros))
    },

    capitulos: recurso('/capitulos'),
    personajes: recurso('/personajes'),

    favoritos: {
        listar: () => peticion('GET', '/favoritos'),
        agregar: (programaId) => peticion('POST', '/favoritos/' + programaId),
        quitar: (programaId) => peticion('DELETE', '/favoritos/' + programaId)
    }
};
