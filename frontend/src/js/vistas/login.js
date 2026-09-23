import { api } from '../nucleo/api.js';
import { sesion } from '../nucleo/sesion.js';
import { navegar } from '../nucleo/enrutador.js';
import { html, pintar } from '../nucleo/plantilla.js';
import { avisar } from '../nucleo/avisos.js';
import { marcarErrores } from '../componentes/formulario.js';

export async function vistaLogin({ contenedor }) {
    pintar(contenedor, html`
        <section class="panel panel--angosto">
            <h1>Iniciar sesión</h1>
            <p class="nota">Entrá para ver el catálogo y guardar tus favoritos.</p>

            <form class="formulario" novalidate>
                <div class="campo">
                    <label for="correo">Correo</label>
                    <input id="correo" name="correo" type="email" autocomplete="email" required>
                    <small class="campo__error" data-error-de="correo" hidden></small>
                </div>
                <div class="campo">
                    <label for="contrasena">Contraseña</label>
                    <input id="contrasena" name="contrasena" type="password" autocomplete="current-password" required>
                    <small class="campo__error" data-error-de="contrasena" hidden></small>
                </div>
                <p class="formulario__error" role="alert" hidden></p>
                <button class="boton boton--principal" type="submit">Entrar</button>
            </form>

            <p class="nota">¿Todavía no tenés cuenta? <a href="#/registro">Creá una</a></p>
            <details class="nota">
                <summary>Usuarios de la semilla</summary>
                <p>admin@todotv.test / Admin1234 — administrador<br>
                   demo@todotv.test / Demo1234 — usuario</p>
            </details>
        </section>`);

    const formulario = contenedor.querySelector('form');
    const aviso = formulario.querySelector('.formulario__error');
    const boton = formulario.querySelector('button[type="submit"]');

    formulario.addEventListener('submit', async (evento) => {
        evento.preventDefault();
        aviso.hidden = true;
        boton.disabled = true;
        boton.textContent = 'Entrando…';

        try {
            const usuario = await api.autenticacion.inicioSesion({
                correo: formulario.correo.value.trim(),
                contrasena: formulario.contrasena.value
            });
            sesion.establecer(usuario);
            avisar('Hola, ' + usuario.nombreUsuario);
            navegar('#/catalogo');
        } catch (error) {
            marcarErrores(formulario, error);
            aviso.textContent = error.message;
            aviso.hidden = false;
        } finally {
            boton.disabled = false;
            boton.textContent = 'Entrar';
        }
    });
}
