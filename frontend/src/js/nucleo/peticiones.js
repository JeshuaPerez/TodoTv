import { CONFIGURACION } from './configuracion.js';

export class ErrorApi extends Error {
    constructor(mensaje, { estado = 0, codigo = null, detalles = null } = {}) {
        super(mensaje);
        this.name = 'ErrorApi';
        this.estado = estado;
        this.codigo = codigo;
        this.detalles = detalles;
    }

    // el backend manda un detalle por campo cuando falla express-validator
    porCampo() {
        if (!Array.isArray(this.detalles)) return new Map();
        return new Map(this.detalles.map((detalle) => [detalle.campo, detalle.mensaje]));
    }

    resumen() {
        if (!Array.isArray(this.detalles) || this.detalles.length === 0) return this.message;
        return this.detalles.map((detalle) => detalle.mensaje).join(' · ');
    }
}

const oyentes = new Map();

export function escuchar(senal, funcion) {
    if (!oyentes.has(senal)) oyentes.set(senal, new Set());
    oyentes.get(senal).add(funcion);
    return () => oyentes.get(senal).delete(funcion);
}

function emitir(senal, dato) {
    for (const oyente of oyentes.get(senal) ?? []) oyente(dato);
}

let versionServidor = null;

export function versionDeLaApi() {
    return versionServidor;
}

export async function peticion(metodo, ruta, { cuerpo, silencioso = false } = {}) {
    const opciones = {
        method: metodo,
        // sin esto la cookie httpOnly no sale ni vuelve
        credentials: 'include',
        headers: { 'Accept-Version': CONFIGURACION.version }
    };
    if (cuerpo !== undefined) {
        opciones.headers['Content-Type'] = 'application/json';
        opciones.body = JSON.stringify(cuerpo);
    }

    let respuesta;
    try {
        respuesta = await fetch(CONFIGURACION.api + ruta, opciones);
    } catch {
        throw new ErrorApi('No se pudo contactar con el servidor. Revisá tu conexión.', { codigo: 'SIN_RED' });
    }

    const anunciada = respuesta.headers.get('X-API-Version');
    if (anunciada && anunciada !== versionServidor) {
        versionServidor = anunciada;
        emitir('version-conocida', anunciada);
    }

    if (respuesta.status === 204) return null;

    const datos = await respuesta.json().catch(() => null);
    if (respuesta.ok) return datos;

    const error = new ErrorApi(datos?.error?.mensaje ?? 'Ocurrió un error inesperado', {
        estado: respuesta.status,
        codigo: datos?.error?.codigo ?? null,
        detalles: datos?.error?.detalles ?? null
    });

    if (error.estado === 401 && !silencioso) emitir('sesion-perdida', error);
    if (error.codigo === 'VERSION_NO_COMPATIBLE') emitir('version-incompatible', error);

    throw error;
}

export function consulta(parametros) {
    const limpios = Object.entries(parametros)
        .filter(([, valor]) => valor !== null && valor !== undefined && valor !== '');
    return limpios.length === 0 ? '' : '?' + new URLSearchParams(limpios).toString();
}
