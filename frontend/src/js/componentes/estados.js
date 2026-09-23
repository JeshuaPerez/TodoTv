import { html, pintar } from '../nucleo/plantilla.js';

// mensajes propios para los códigos que el backend sabe devolver
const MENSAJES = {
    SIN_RED: 'No hay conexión con el servidor.',
    API_INALCANZABLE: 'La API no está respondiendo.',
    BASE_DE_DATOS: 'La base de datos no está disponible en este momento.',
    DEMASIADAS_PETICIONES: 'Hiciste muchas peticiones seguidas, esperá un momento.',
    VERSION_NO_COMPATIBLE: 'Esta interfaz no habla la misma versión que la API.',
    NO_AUTORIZADO: 'No tenés permiso para ver esto.'
};

export function cargando(mensaje = 'Cargando…') {
    return html`
        <div class="estado" role="status">
            <span class="girador" aria-hidden="true"></span>
            <p class="estado__detalle">${mensaje}</p>
        </div>`;
}

export function vacio(titulo, detalle = '') {
    return html`
        <div class="estado estado--vacio">
            <p class="estado__titulo">${titulo}</p>
            ${detalle ? html`<p class="estado__detalle">${detalle}</p>` : ''}
        </div>`;
}

export function fallo(error, { reintentar = true } = {}) {
    const mensaje = MENSAJES[error?.codigo] ?? error?.message ?? 'Ocurrió un error inesperado';
    const detalle = error?.codigo === 'VALIDACION' ? error.resumen() : '';

    return html`
        <div class="estado estado--error" role="alert">
            <p class="estado__titulo">${mensaje}</p>
            ${detalle ? html`<p class="estado__detalle">${detalle}</p>` : ''}
            ${reintentar ? html`<button class="boton" data-accion="reintentar">Reintentar</button>` : ''}
        </div>`;
}

// carga, error con reintento y lista vacía resueltos en un solo lugar
export async function conEstados(contenedor, opciones) {
    const {
        cargar,
        dibujar,
        vacio: sinDatos = null,
        vigente = () => true,
        mensajeCarga = 'Cargando…'
    } = opciones;

    pintar(contenedor, cargando(mensajeCarga));
    try {
        const datos = await cargar();
        if (!vigente()) return null;

        if (sinDatos && Array.isArray(datos) && datos.length === 0) {
            pintar(contenedor, vacio(sinDatos.titulo, sinDatos.detalle));
            return datos;
        }
        pintar(contenedor, dibujar(datos));
        return datos;
    } catch (error) {
        if (!vigente()) return null;
        pintar(contenedor, fallo(error));
        contenedor.querySelector('[data-accion="reintentar"]')
            ?.addEventListener('click', () => conEstados(contenedor, opciones));
        return null;
    }
}
