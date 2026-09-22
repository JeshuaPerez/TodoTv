import { api } from '../api/api.js';
import { sesion } from '../estado.js';
import { avisar, rejilla, vistaCarga, vistaError, vistaVacio } from '../componentes.js';

export async function vistaFavoritos(contenedor) {
    contenedor.innerHTML = `
        <section class="panel">
            <h1>Mis favoritos</h1>
            <div id="resultados"></div>
        </section>`;

    const resultados = contenedor.querySelector('#resultados');

    async function cargar() {
        resultados.innerHTML = vistaCarga('Cargando tus favoritos…');
        try {
            const programas = await api.favoritos.listar();
            sesion.fijarFavoritos(programas.map((programa) => programa.id));

            if (programas.length === 0) {
                resultados.innerHTML = vistaVacio(
                    'Todavía no marcaste ningún favorito',
                    'Entrá al catálogo y tocá la estrella de los programas que te gusten.'
                );
                return;
            }
            resultados.innerHTML = rejilla(programas, { mostrarBoton: true, esFavorito: () => true });
        } catch (error) {
            resultados.innerHTML = vistaError(error.message);
        }
    }

    resultados.addEventListener('click', async (evento) => {
        if (evento.target.closest('[data-accion="reintentar"]')) {
            cargar();
            return;
        }
        const boton = evento.target.closest('[data-favorito]');
        if (!boton) return;

        boton.disabled = true;
        try {
            await api.favoritos.quitar(boton.dataset.favorito);
            avisar('Quitado de favoritos');
            await cargar();
        } catch (error) {
            avisar(error.message, 'error');
            boton.disabled = false;
        }
    });

    await cargar();
}
