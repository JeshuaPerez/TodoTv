import { sesion } from './sesion.js';
import { pintar, html } from './plantilla.js';
import { fallo, vacio } from '../componentes/estados.js';
import { CONFIGURACION } from './configuracion.js';

let rutas = [];
let contenedor = null;
let alCambiar = () => {};
let generacion = 0;

function segmentos() {
    const limpia = location.hash.replace(/^#\/?/, '').replace(/\/+$/, '');
    return limpia === '' ? [] : limpia.split('/');
}

function coincidir(patron, partes) {
    const esperados = patron === '' ? [] : patron.split('/');
    if (esperados.length !== partes.length) return null;

    const parametros = {};
    for (let indice = 0; indice < esperados.length; indice += 1) {
        const esperado = esperados[indice];
        if (esperado.startsWith(':')) parametros[esperado.slice(1)] = decodeURIComponent(partes[indice]);
        else if (esperado !== partes[indice]) return null;
    }
    return parametros;
}

export function navegar(destino) {
    const ruta = destino.startsWith('#') ? destino : '#/' + destino;
    if (location.hash === ruta) resolver();
    else location.hash = ruta;
}

export function rutaActual() {
    return segmentos().join('/');
}

function permitida(ruta) {
    if (ruta.acceso === 'invitado' && sesion.abierta()) return '#/catalogo';
    if (ruta.acceso === 'sesion' && !sesion.abierta()) return '#/login';
    if (ruta.acceso === 'administrador' && !sesion.abierta()) return '#/login';
    return null;
}

async function resolver() {
    const partes = segmentos();

    if (partes.length === 0) {
        navegar(sesion.abierta() ? '#/catalogo' : '#/login');
        return;
    }

    for (const ruta of rutas) {
        const parametros = coincidir(ruta.patron, partes);
        if (parametros === null) continue;

        const desvio = permitida(ruta);
        if (desvio) {
            navegar(desvio);
            return;
        }

        document.title = ruta.titulo ? ruta.titulo + ' · ' + CONFIGURACION.nombre : CONFIGURACION.nombre;
        alCambiar(ruta, parametros);

        if (ruta.acceso === 'administrador' && !sesion.esAdministrador()) {
            pintar(contenedor, fallo({ codigo: 'NO_AUTORIZADO' }, { reintentar: false }));
            return;
        }

        // si el usuario navega otra vez mientras esta vista carga, la vieja se descarta
        const mia = ++generacion;
        window.scrollTo(0, 0);
        try {
            await ruta.vista({ contenedor, parametros, vigente: () => mia === generacion });
        } catch (error) {
            if (mia === generacion) pintar(contenedor, fallo(error, { reintentar: false }));
        }
        return;
    }

    alCambiar(null, {});
    pintar(contenedor, html`
        ${vacio('Esa página no existe', 'Puede que el enlace esté viejo.')}
        <p class="centrado"><a href="#/catalogo">Ir al catálogo</a></p>`);
}

export function iniciarEnrutador(opciones) {
    rutas = opciones.rutas;
    contenedor = opciones.contenedor;
    alCambiar = opciones.alCambiar ?? alCambiar;

    window.addEventListener('hashchange', resolver);
    return resolver();
}
