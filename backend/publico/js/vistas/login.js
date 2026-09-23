import { api } from '../api/api.js';
import { sesion } from '../estado.js';
import { navegar } from '../enrutador.js';
import { detallesDeError } from '../componentes.js';

export async function vistaLogin(contenedor) {
    contenedor.innerHTML = `
        <section class="panel panel--angosto">
            <h1>Iniciar sesión</h1>
            <p class="nota">Entrá para ver el catálogo y marcar tus favoritos.</p>
            <form class="formulario" novalidate>
                <label class="campo">
                    <span>Correo</span>
                    <input name="correo" type="email" autocomplete="email" required>
                </label>
                <label class="campo">
                    <span>Contraseña</span>
                    <input name="contrasena" type="password" autocomplete="current-password" required>
                </label>
                <p class="formulario__error" hidden></p>
                <button class="boton boton--principal" type="submit">Entrar</button>
            </form>
            <p class="nota">¿Todavía no tenés cuenta? <a href="#/registro">Registrate</a></p>
        </section>`;

    const formulario = contenedor.querySelector('form');
    const error = contenedor.querySelector('.formulario__error');
    const boton = contenedor.querySelector('button[type="submit"]');

    formulario.addEventListener('submit', async (evento) => {
        evento.preventDefault();
        error.hidden = true;
        boton.disabled = true;
        boton.textContent = 'Entrando…';

        const datos = Object.fromEntries(new FormData(formulario));
        try {
            const usuario = await api.autenticacion.inicioSesion(datos);
            sesion.establecer(usuario);
            navegar('#/catalogo');
        } catch (fallo) {
            error.textContent = detallesDeError(fallo);
            error.hidden = false;
        } finally {
            boton.disabled = false;
            boton.textContent = 'Entrar';
        }
    });
}
