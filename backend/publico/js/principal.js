import { api } from './api/api.js';
import { sesion } from './estado.js';
import { navegar, partesDeRuta } from './enrutador.js';
import { avisar, escapar, vistaError, vistaVacio } from './componentes.js';
import { vistaLogin } from './vistas/login.js';
import { vistaRegistro } from './vistas/registro.js';
import { vistaCatalogo } from './vistas/catalogo.js';
import { vistaPrograma } from './vistas/programa.js';
import { vistaActor } from './vistas/actor.js';
import { vistaFavoritos } from './vistas/favoritos.js';
import { vistaAdmin } from './vistas/admin.js';

const RUTAS = {
    login: { vista: vistaLogin, publica: true },
    registro: { vista: vistaRegistro, publica: true },
    catalogo: { vista: vistaCatalogo },
    programa: { vista: vistaPrograma },
    actor: { vista: vistaActor },
    favoritos: { vista: vistaFavoritos },
    admin: { vista: vistaAdmin, soloAdministrador: true }
};

const contenido = document.querySelector('#contenido');
const navegacion = document.querySelector('#navegacion');

function dibujarNavegacion() {
    const usuario = sesion.usuario();
    const actual = partesDeRuta()[0] ?? '';

    if (!usuario) {
        navegacion.innerHTML = '<a href="#/login">Entrar</a><a href="#/registro">Crear cuenta</a>';
        return;
    }

    const enlaces = [
        { ruta: 'catalogo', destino: '#/catalogo', texto: 'Catálogo' },
        { ruta: 'favoritos', destino: '#/favoritos', texto: 'Favoritos' }
    ];
    // el panel se esconde al usuario común, pero la autorización real la hace el backend
    if (sesion.esAdministrador()) {
        enlaces.push({ ruta: 'admin', destino: '#/admin/programas', texto: 'Administración' });
    }

    navegacion.innerHTML = enlaces
        .map((enlace) => `<a class="${enlace.ruta === actual ? 'es-activa' : ''}" href="${enlace.destino}">${enlace.texto}</a>`)
        .join('') +
        `<span class="usuario" title="${escapar(usuario.correo)}">${escapar(usuario.nombreUsuario)}</span>` +
        '<button class="boton boton--chico" id="salir">Salir</button>';

    navegacion.querySelector('#salir').addEventListener('click', async () => {
        try {
            await api.autenticacion.cierreSesion();
        } finally {
            sesion.limpiar();
            avisar('Sesión cerrada');
            navegar('#/login');
        }
    });
}

async function enrutar() {
    const partes = partesDeRuta();
    const nombre = partes[0] ?? '';

    if (!nombre) {
        navegar(sesion.haySesion() ? '#/catalogo' : '#/login');
        return;
    }

    const ruta = RUTAS[nombre];
    dibujarNavegacion();

    if (!ruta) {
        contenido.innerHTML = vistaVacio('Esa página no existe') +
            '<p class="nota centrado"><a href="#/catalogo">Ir al catálogo</a></p>';
        return;
    }
    if (ruta.publica && sesion.haySesion()) {
        navegar('#/catalogo');
        return;
    }
    if (!ruta.publica && !sesion.haySesion()) {
        navegar('#/login');
        return;
    }
    if (ruta.soloAdministrador && !sesion.esAdministrador()) {
        contenido.innerHTML = vistaError('Esta sección es solo para administradores', { reintentar: false });
        return;
    }

    window.scrollTo(0, 0);
    try {
        await ruta.vista(contenido, partes.slice(1));
    } catch (error) {
        contenido.innerHTML = vistaError(error.message ?? 'No se pudo mostrar la página', { reintentar: false });
    }
}

// cualquier 401 que se escape corta la sesión y manda al login
document.addEventListener('sesion-perdida', () => {
    sesion.limpiar();
    avisar('Tu sesión terminó. Iniciá sesión de nuevo.', 'error');
    navegar('#/login');
});

window.addEventListener('hashchange', enrutar);

await sesion.recuperar();
await enrutar();
