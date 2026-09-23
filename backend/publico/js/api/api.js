const RAIZ = '/api';
const VERSION = '1.x';

export class ErrorApi extends Error {
    constructor(mensaje, estado, codigo = null, detalles = null) {
        super(mensaje);
        this.estado = estado;
        this.codigo = codigo;
        this.detalles = detalles;
    }
}

async function peticion(metodo, ruta, cuerpo, { silencioso = false } = {}) {
    const opciones = {
        method: metodo,
        // la sesión viaja en la cookie httpOnly, hay que dejarla salir
        credentials: 'include',
        headers: { 'Accept-Version': VERSION }
    };
    if (cuerpo !== undefined) {
        opciones.headers['Content-Type'] = 'application/json';
        opciones.body = JSON.stringify(cuerpo);
    }

    let respuesta;
    try {
        respuesta = await fetch(RAIZ + ruta, opciones);
    } catch {
        throw new ErrorApi('No se pudo contactar al servidor. Revisá tu conexión.', 0, 'SIN_RED');
    }

    if (respuesta.status === 401 && !silencioso) {
        document.dispatchEvent(new CustomEvent('sesion-perdida'));
    }
    if (respuesta.status === 204) return null;

    const datos = await respuesta.json().catch(() => null);
    if (!respuesta.ok) {
        throw new ErrorApi(
            datos?.error?.mensaje ?? 'Ocurrió un error inesperado',
            respuesta.status,
            datos?.error?.codigo ?? null,
            datos?.error?.detalles ?? null
        );
    }
    return datos;
}

function consulta(parametros) {
    const limpios = Object.entries(parametros).filter(([, valor]) => valor !== null && valor !== undefined && valor !== '');
    if (limpios.length === 0) return '';
    return '?' + new URLSearchParams(limpios).toString();
}

function recurso(ruta) {
    return {
        listar: () => peticion('GET', ruta),
        obtener: (id) => peticion('GET', ruta + '/' + id),
        crear: (datos) => peticion('POST', ruta, datos),
        actualizar: (id, datos) => peticion('PUT', ruta + '/' + id, datos),
        borrar: (id) => peticion('DELETE', ruta + '/' + id)
    };
}

export const api = {
    autenticacion: {
        registro: (datos) => peticion('POST', '/autenticacion/registro', datos),
        // un 401 acá es una credencial equivocada, no una sesión perdida
        inicioSesion: (datos) => peticion('POST', '/autenticacion/inicio-sesion', datos, { silencioso: true }),
        cierreSesion: () => peticion('POST', '/autenticacion/cierre-sesion'),
        perfil: () => peticion('GET', '/autenticacion/perfil', undefined, { silencioso: true })
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
