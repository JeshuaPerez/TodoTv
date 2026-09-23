import { api } from '../nucleo/api.js';
import { html, pintar } from '../nucleo/plantilla.js';
import { conEstados } from '../componentes/estados.js';
import { rejillaActores } from '../componentes/tarjetas.js';

export async function vistaActores({ contenedor, vigente }) {
    pintar(contenedor, html`
        <section class="panel">
            <div class="encabezado">
                <h1>Actores</h1>
                <div class="filtros">
                    <input class="control" id="busqueda" type="search" placeholder="Buscar por nombre…"
                           aria-label="Buscar actores por nombre">
                </div>
            </div>
            <div id="resultados"></div>
        </section>`);

    const resultados = contenedor.querySelector('#resultados');
    const busqueda = contenedor.querySelector('#busqueda');

    const cargar = () => conEstados(resultados, {
        vigente,
        mensajeCarga: 'Buscando actores…',
        cargar: () => api.actores.listar({ texto: busqueda.value.trim() }),
        vacio: { titulo: 'No hay actores que coincidan', detalle: 'Probá con otro nombre.' },
        dibujar: rejillaActores
    });

    let temporizador = null;
    busqueda.addEventListener('input', () => {
        clearTimeout(temporizador);
        temporizador = setTimeout(cargar, 300);
    });

    await cargar();
}
