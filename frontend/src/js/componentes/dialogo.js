import { html, pintar } from '../nucleo/plantilla.js';

function montar(contenido) {
    const dialogo = document.createElement('dialog');
    dialogo.className = 'dialogo';
    pintar(dialogo, contenido);
    document.body.append(dialogo);
    return dialogo;
}

export function abrirFormulario({ titulo, cuerpo, textoAceptar = 'Guardar', alMontar, alAceptar, alFallar }) {
    return new Promise((resolver) => {
        const dialogo = montar(html`
            <form class="formulario" novalidate>
                <h2>${titulo}</h2>
                ${cuerpo}
                <p class="formulario__error" role="alert" hidden></p>
                <div class="acciones">
                    <button type="button" class="boton" data-cancelar>Cancelar</button>
                    <button type="submit" class="boton boton--principal">${textoAceptar}</button>
                </div>
            </form>`);

        const formulario = dialogo.querySelector('form');
        const aviso = dialogo.querySelector('.formulario__error');
        const guardar = dialogo.querySelector('button[type="submit"]');

        const cerrar = (resultado) => {
            dialogo.close();
            dialogo.remove();
            resolver(resultado);
        };

        dialogo.querySelector('[data-cancelar]').addEventListener('click', () => cerrar(false));
        dialogo.addEventListener('cancel', (evento) => {
            evento.preventDefault();
            cerrar(false);
        });

        formulario.addEventListener('submit', async (evento) => {
            evento.preventDefault();
            aviso.hidden = true;
            guardar.disabled = true;
            try {
                await alAceptar(formulario);
                cerrar(true);
            } catch (error) {
                alFallar?.(formulario, error);
                aviso.textContent = error.message;
                aviso.hidden = false;
            } finally {
                guardar.disabled = false;
            }
        });

        alMontar?.(formulario);
        dialogo.showModal();
        formulario.querySelector('input, select, textarea')?.focus();
        return dialogo;
    });
}

export function confirmar(mensaje, { textoAceptar = 'Borrar', peligro = true } = {}) {
    return new Promise((resolver) => {
        const dialogo = montar(html`
            <div class="dialogo__confirmar">
                <p>${mensaje}</p>
                <div class="acciones">
                    <button type="button" class="boton" data-cancelar>Cancelar</button>
                    <button type="button" class="boton ${peligro ? 'boton--peligro' : 'boton--principal'}" data-aceptar>
                        ${textoAceptar}
                    </button>
                </div>
            </div>`);

        const cerrar = (resultado) => {
            dialogo.close();
            dialogo.remove();
            resolver(resultado);
        };

        dialogo.querySelector('[data-cancelar]').addEventListener('click', () => cerrar(false));
        dialogo.querySelector('[data-aceptar]').addEventListener('click', () => cerrar(true));
        dialogo.addEventListener('cancel', (evento) => {
            evento.preventDefault();
            cerrar(false);
        });

        dialogo.showModal();
    });
}
