import { api } from '../nucleo/api.js';
import { sesion } from '../nucleo/sesion.js';
import { navegar } from '../nucleo/enrutador.js';
import { html, pintar } from '../nucleo/plantilla.js';
import { avisar } from '../nucleo/avisos.js';
import { fecha, plural } from '../nucleo/formato.js';
import { versionDeLaApi } from '../nucleo/peticiones.js';
import { CONFIGURACION } from '../nucleo/configuracion.js';

export async function vistaPerfil({ contenedor }) {
    const usuario = sesion.usuario();

    pintar(contenedor, html`
        <section class="panel panel--angosto">
            <h1>Mi cuenta</h1>

            <dl class="datos">
                <dt>Usuario</dt><dd>${usuario.nombreUsuario}</dd>
                <dt>Correo</dt><dd>${usuario.correo}</dd>
                <dt>Rol</dt><dd><span class="etiqueta">${usuario.rol}</span></dd>
                <dt>Favoritos</dt><dd>${plural(usuario.favoritos.length, 'programa', 'programas')}</dd>
                <dt>Cuenta creada</dt><dd>${fecha(usuario.creadoEn)}</dd>
            </dl>

            <h2>Conexión</h2>
            <dl class="datos">
                <dt>API</dt><dd><code>${CONFIGURACION.api}</code></dd>
                <dt>Versión que pido</dt><dd><code>${CONFIGURACION.version}</code></dd>
                <dt>Versión del servidor</dt><dd><code>${versionDeLaApi() ?? 'desconocida'}</code></dd>
                <dt>Documentación</dt><dd><a href="/api/docs/" target="_blank" rel="noreferrer">Swagger</a></dd>
            </dl>

            <div class="acciones acciones--izquierda">
                <button class="boton boton--peligro" id="salir">Cerrar sesión</button>
            </div>
        </section>`);

    contenedor.querySelector('#salir').addEventListener('click', async (evento) => {
        evento.currentTarget.disabled = true;
        try {
            await api.autenticacion.cierreSesion();
        } finally {
            sesion.cerrar();
            avisar('Sesión cerrada');
            navegar('#/login');
        }
    });
}
