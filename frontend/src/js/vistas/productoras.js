import { api } from '../nucleo/api.js';
import { html, pintar } from '../nucleo/plantilla.js';
import { conEstados } from '../componentes/estados.js';

export async function vistaProductoras({ contenedor, vigente }) {
    pintar(contenedor, html`
        <section class="panel">
            <h1>Productoras</h1>
            <p class="nota">Las casas que están detrás de los programas del catálogo.</p>
            <div id="resultados"></div>
        </section>`);

    const resultados = contenedor.querySelector('#resultados');

    await conEstados(resultados, {
        vigente,
        cargar: async () => {
            const [productoras, programas] = await Promise.all([
                api.productoras.listar(),
                api.programas.listar()
            ]);
            // cuántos programas tiene cada una, para no mostrar una lista pelada
            return productoras.map((productora) => ({
                ...productora,
                programas: programas.filter((programa) => programa.productoraId === productora.id)
            }));
        },
        vacio: { titulo: 'Todavía no hay productoras cargadas' },
        dibujar: (productoras) => html`
            <ul class="lista-fichas">
                ${productoras.map((productora) => html`
                    <li class="ficha-chica">
                        <div class="ficha-chica__cabecera">
                            <h3>${productora.nombre}</h3>
                            <span class="etiqueta">${productora.pais}</span>
                        </div>
                        <p class="nota">Fundada en ${productora.anioFundacion}</p>
                        ${productora.programas.length === 0
                            ? html`<p class="nota">Sin programas en el catálogo</p>`
                            : html`<ul class="enlaces-linea">
                                ${productora.programas.map((programa) => html`
                                    <li><a href="#/programa/${programa.id}">${programa.titulo}</a></li>`)}
                              </ul>`}
                    </li>`)}
            </ul>`
    });
}
