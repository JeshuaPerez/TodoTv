import { api } from '../nucleo/api.js';
import { sesion } from '../nucleo/sesion.js';
import { navegar } from '../nucleo/enrutador.js';
import { html, pintar } from '../nucleo/plantilla.js';
import { avisar } from '../nucleo/avisos.js';
import { marcarErrores } from '../componentes/formulario.js';

export async function vistaRegistro({ contenedor }) {
    pintar(contenedor, html`
        <section class="panel panel--angosto">
            <h1>Crear cuenta</h1>

            <form class="formulario" novalidate>
                <div class="campo">
                    <label for="nombreUsuario">Nombre de usuario</label>
                    <input id="nombreUsuario" name="nombreUsuario" type="text" minlength="3" maxlength="20"
                           autocomplete="username" required>
                    <small class="campo__ayuda">Entre 3 y 20 caracteres: letras, números, punto o guion.</small>
                    <small class="campo__error" data-error-de="nombreUsuario" hidden></small>
                </div>
                <div class="campo">
                    <label for="correo">Correo</label>
                    <input id="correo" name="correo" type="email" autocomplete="email" required>
                    <small class="campo__error" data-error-de="correo" hidden></small>
                </div>
                <div class="campo">
                    <label for="contrasena">Contraseña</label>
                    <input id="contrasena" name="contrasena" type="password" minlength="8"
                           autocomplete="new-password" required>
                    <small class="campo__ayuda">Al menos 8 caracteres, con una letra y un número.</small>
                    <small class="campo__error" data-error-de="contrasena" hidden></small>
                </div>
                <p class="formulario__error" role="alert" hidden></p>
                <button class="boton boton--principal" type="submit">Registrarme</button>
            </form>

            <p class="nota">¿Ya tenés cuenta? <a href="#/login">Iniciá sesión</a></p>
        </section>`);

    const formulario = contenedor.querySelector('form');
    const aviso = formulario.querySelector('.formulario__error');
    const boton = formulario.querySelector('button[type="submit"]');

    formulario.addEventListener('submit', async (evento) => {
        evento.preventDefault();
        aviso.hidden = true;
        boton.disabled = true;
        boton.textContent = 'Creando…';

        try {
            const usuario = await api.autenticacion.registro({
                nombreUsuario: formulario.nombreUsuario.value.trim(),
                correo: formulario.correo.value.trim(),
                contrasena: formulario.contrasena.value
            });
            sesion.establecer(usuario);
            avisar('Cuenta creada, bienvenido');
            navegar('#/catalogo');
        } catch (error) {
            marcarErrores(formulario, error);
            aviso.textContent = error.message;
            aviso.hidden = false;
        } finally {
            boton.disabled = false;
            boton.textContent = 'Registrarme';
        }
    });
}
