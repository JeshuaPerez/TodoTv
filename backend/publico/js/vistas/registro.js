import { api } from '../api/api.js';
import { sesion } from '../estado.js';
import { navegar } from '../enrutador.js';
import { detallesDeError } from '../componentes.js';

export async function vistaRegistro(contenedor) {
    contenedor.innerHTML = `
        <section class="panel panel--angosto">
            <h1>Crear cuenta</h1>
            <form class="formulario" novalidate>
                <label class="campo">
                    <span>Nombre de usuario</span>
                    <input name="nombreUsuario" type="text" minlength="3" maxlength="20" autocomplete="username" required>
                </label>
                <label class="campo">
                    <span>Correo</span>
                    <input name="correo" type="email" autocomplete="email" required>
                </label>
                <label class="campo">
                    <span>Contraseña</span>
                    <input name="contrasena" type="password" minlength="8" autocomplete="new-password" required>
                    <small class="campo__ayuda">Al menos 8 caracteres, con una letra y un número.</small>
                </label>
                <p class="formulario__error" hidden></p>
                <button class="boton boton--principal" type="submit">Registrarme</button>
            </form>
            <p class="nota">¿Ya tenés cuenta? <a href="#/login">Iniciá sesión</a></p>
        </section>`;

    const formulario = contenedor.querySelector('form');
    const error = contenedor.querySelector('.formulario__error');
    const boton = contenedor.querySelector('button[type="submit"]');

    formulario.addEventListener('submit', async (evento) => {
        evento.preventDefault();
        error.hidden = true;
        boton.disabled = true;
        boton.textContent = 'Creando…';

        const datos = Object.fromEntries(new FormData(formulario));
        try {
            const usuario = await api.autenticacion.registro(datos);
            sesion.establecer(usuario);
            navegar('#/catalogo');
        } catch (fallo) {
            error.textContent = detallesDeError(fallo);
            error.hidden = false;
        } finally {
            boton.disabled = false;
            boton.textContent = 'Registrarme';
        }
    });
}
