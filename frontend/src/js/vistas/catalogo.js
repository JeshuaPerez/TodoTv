import { api } from '../nucleo/api.js';
import { sesion } from '../nucleo/sesion.js';
import { html, pintar, agregar } from '../nucleo/plantilla.js';
import { avisar } from '../nucleo/avisos.js';
import { conEstados } from '../componentes/estados.js';
import { rejillaProgramas } from '../componentes/tarjetas.js';

export async function vistaCatalogo({ contenedor, vigente }) {
    pintar(contenedor, html`
        <section class="panel">
            <div class="encabezado">
                <div>
                    <h1>Catálogo</h1>
                    <p class="nota" id="resumen">&nbsp;</p>
                </div>
                <div class="filtros">
                    <select class="control" id="categoria" aria-label="Filtrar por categoría">
                        <option value="">Todas las categorías</option>
                    </select>
                    <input class="control" id="busqueda" type="search" placeholder="Buscar por título…"
                           aria-label="Buscar por título">
                </div>
            </div>
            <div id="resultados"></div>
        </section>`);

    const resultados = contenedor.querySelector('#resultados');
    const resumen = contenedor.querySelector('#resumen');
    const selector = contenedor.querySelector('#categoria');
    const busqueda = contenedor.querySelector('#busqueda');

    try {
        const categorias = await api.categorias.listar();
        if (!vigente()) return;
        agregar(selector, categorias.map((categoria) => html`
            <option value="${categoria.id}">${categoria.nombre}</option>`));
    } catch {
        // si el filtro no carga, el catálogo igual se puede mirar
    }

    async function cargar() {
        const programas = await conEstados(resultados, {
            vigente,
            mensajeCarga: 'Buscando programas…',
            cargar: () => api.programas.listar({
                categoria: selector.value,
                texto: busqueda.value.trim()
            }),
            vacio: {
                titulo: 'No hay programas que coincidan',
                detalle: 'Probá con otra categoría o limpiá la búsqueda.'
            },
            dibujar: (lista) => rejillaProgramas(lista, {
                conBoton: sesion.abierta(),
                esFavorito: (programa) => sesion.esFavorito(programa.id)
            })
        });

        if (!programas) return;
        resumen.textContent = programas.length === 1
            ? '1 programa en el catálogo'
            : programas.length + ' programas en el catálogo';
    }

    let temporizador = null;
    busqueda.addEventListener('input', () => {
        clearTimeout(temporizador);
        temporizador = setTimeout(cargar, 300);
    });
    selector.addEventListener('change', cargar);

    resultados.addEventListener('click', async (evento) => {
        const boton = evento.target.closest('[data-favorito]');
        if (!boton) return;

        boton.disabled = true;
        try {
            const marcado = await sesion.alternarFavorito(boton.dataset.favorito);
            boton.classList.toggle('es-favorito', marcado);
            boton.setAttribute('aria-pressed', String(marcado));
            boton.textContent = marcado ? '★' : '☆';
            avisar(marcado ? 'Agregado a favoritos' : 'Quitado de favoritos');
        } catch (error) {
            avisar(error.message, 'error');
        } finally {
            boton.disabled = false;
        }
    });

    await cargar();
}
