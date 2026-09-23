import { api } from '../nucleo/api.js';
import { sesion } from '../nucleo/sesion.js';
import { html, pintar } from '../nucleo/plantilla.js';
import { avisar } from '../nucleo/avisos.js';
import { conEstados } from '../componentes/estados.js';
import { rejillaProgramas } from '../componentes/tarjetas.js';

export async function vistaFavoritos({ contenedor, vigente }) {
    pintar(contenedor, html`
        <section class="panel">
            <h1>Mis favoritos</h1>
            <p class="nota">Los programas que marcaste con la estrella.</p>
            <div id="resultados"></div>
        </section>`);

    const resultados = contenedor.querySelector('#resultados');

    const cargar = () => conEstados(resultados, {
        vigente,
        mensajeCarga: 'Cargando tus favoritos…',
        cargar: async () => {
            const programas = await api.favoritos.listar();
            // la lista del servidor manda: así el catálogo queda al día
            sesion.anotarFavoritos(programas);
            return programas;
        },
        vacio: {
            titulo: 'Todavía no marcaste ningún favorito',
            detalle: 'Entrá al catálogo y tocá la estrella de los programas que te gusten.'
        },
        dibujar: (programas) => rejillaProgramas(programas, { conBoton: true, esFavorito: () => true })
    });

    resultados.addEventListener('click', async (evento) => {
        const boton = evento.target.closest('[data-favorito]');
        if (!boton) return;

        boton.disabled = true;
        try {
            await sesion.alternarFavorito(boton.dataset.favorito);
            avisar('Quitado de favoritos');
            await cargar();
        } catch (error) {
            avisar(error.message, 'error');
            boton.disabled = false;
        }
    });

    await cargar();
}
