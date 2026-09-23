import { sesion } from './nucleo/sesion.js';
import { iniciarEnrutador, navegar } from './nucleo/enrutador.js';
import { escuchar, versionDeLaApi } from './nucleo/peticiones.js';
import { CONFIGURACION } from './nucleo/configuracion.js';
import { html, pintar } from './nucleo/plantilla.js';
import { avisar } from './nucleo/avisos.js';
import { vistaLogin } from './vistas/login.js';
import { vistaRegistro } from './vistas/registro.js';
import { vistaCatalogo } from './vistas/catalogo.js';
import { vistaPrograma } from './vistas/programa.js';
import { vistaActores } from './vistas/actores.js';
import { vistaActor } from './vistas/actor.js';
import { vistaProductoras } from './vistas/productoras.js';
import { vistaFavoritos } from './vistas/favoritos.js';
import { vistaPerfil } from './vistas/perfil.js';
import { vistaAdmin } from './vistas/admin/panel.js';

const RUTAS = [
    { patron: 'login', vista: vistaLogin, acceso: 'invitado', titulo: 'Iniciar sesión' },
    { patron: 'registro', vista: vistaRegistro, acceso: 'invitado', titulo: 'Crear cuenta' },
    { patron: 'catalogo', vista: vistaCatalogo, acceso: 'sesion', titulo: 'Catálogo', menu: 'catalogo' },
    { patron: 'programa/:id', vista: vistaPrograma, acceso: 'sesion', menu: 'catalogo' },
    { patron: 'actores', vista: vistaActores, acceso: 'sesion', titulo: 'Actores', menu: 'actores' },
    { patron: 'actor/:id', vista: vistaActor, acceso: 'sesion', menu: 'actores' },
    { patron: 'productoras', vista: vistaProductoras, acceso: 'sesion', titulo: 'Productoras', menu: 'productoras' },
    { patron: 'favoritos', vista: vistaFavoritos, acceso: 'sesion', titulo: 'Favoritos', menu: 'favoritos' },
    { patron: 'perfil', vista: vistaPerfil, acceso: 'sesion', titulo: 'Mi cuenta', menu: 'perfil' },
    { patron: 'admin', vista: () => navegar('#/admin/programas'), acceso: 'administrador' },
    { patron: 'admin/:recurso', vista: vistaAdmin, acceso: 'administrador', titulo: 'Administración', menu: 'admin' }
];

const MENU = [
    { clave: 'catalogo', destino: '#/catalogo', texto: 'Catálogo' },
    { clave: 'actores', destino: '#/actores', texto: 'Actores' },
    { clave: 'productoras', destino: '#/productoras', texto: 'Productoras' },
    { clave: 'favoritos', destino: '#/favoritos', texto: 'Favoritos' },
    { clave: 'admin', destino: '#/admin/programas', texto: 'Administración', soloAdministrador: true }
];

const navegacion = document.querySelector('#navegacion');
const contenedor = document.querySelector('#contenido');
const banda = document.querySelector('#banda');
const pieVersion = document.querySelector('#pie-version');

function dibujarMenu(ruta) {
    const usuario = sesion.usuario();

    if (!usuario) {
        pintar(navegacion, html`
            <a href="#/login">Entrar</a>
            <a href="#/registro">Crear cuenta</a>`);
        return;
    }

    // el enlace de administración solo se le muestra al administrador;
    // la autorización de verdad la sigue haciendo el backend en cada endpoint
    const visibles = MENU.filter((entrada) => !entrada.soloAdministrador || sesion.esAdministrador());
    const activo = ruta?.menu ?? '';

    pintar(navegacion, html`
        ${visibles.map((entrada) => html`
            <a class="${entrada.clave === activo ? 'es-activa' : ''}" href="${entrada.destino}">${entrada.texto}</a>`)}
        <a class="navegacion__usuario ${activo === 'perfil' ? 'es-activa' : ''}" href="#/perfil" title="Mi cuenta">
            <span class="avatar" aria-hidden="true">${usuario.nombreUsuario.slice(0, 1).toUpperCase()}</span>
            <span>${usuario.nombreUsuario}</span>
        </a>`);
}

function mostrarBanda(mensaje) {
    banda.textContent = mensaje;
    banda.hidden = false;
}

function actualizarPie() {
    const version = versionDeLaApi();
    pieVersion.textContent = version
        ? 'API ' + version + ' · cliente ' + CONFIGURACION.version
        : 'cliente ' + CONFIGURACION.version;
}

escuchar('version-conocida', actualizarPie);

escuchar('version-incompatible', (error) => {
    mostrarBanda(error.message + ' Actualizá la interfaz para seguir usándola.');
});

// cualquier 401 que no sea de un formulario de acceso corta la sesión
escuchar('sesion-perdida', () => {
    if (!sesion.abierta()) return;
    sesion.cerrar();
    avisar('Tu sesión terminó. Entrá de nuevo.', 'error');
    navegar('#/login');
});

await sesion.recuperar();
actualizarPie();

await iniciarEnrutador({
    rutas: RUTAS,
    contenedor,
    alCambiar: dibujarMenu
});
