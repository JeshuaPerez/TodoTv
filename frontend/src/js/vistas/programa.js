import { api } from '../nucleo/api.js';
import { sesion } from '../nucleo/sesion.js';
import { html, pintar } from '../nucleo/plantilla.js';
import { avisar } from '../nucleo/avisos.js';
import { fecha, duracion, plural } from '../nucleo/formato.js';
import { cargando, fallo, conEstados } from '../componentes/estados.js';
import { tarjetaPersonaje } from '../componentes/tarjetas.js';

function porTemporada(capitulos) {
    const agrupados = new Map();
    for (const capitulo of capitulos) {
        if (!agrupados.has(capitulo.temporada)) agrupados.set(capitulo.temporada, []);
        agrupados.get(capitulo.temporada).push(capitulo);
    }
    return [...agrupados.entries()].sort(([una], [otra]) => una - otra);
}

function listaCapitulos(capitulos) {
    return html`
        ${porTemporada(capitulos).map(([temporada, lista]) => html`
            <div class="temporada">
                <h3 class="temporada__titulo">
                    Temporada ${temporada}
                    <span class="temporada__cuenta">${plural(lista.length, 'capítulo', 'capítulos')}</span>
                </h3>
                <ul class="lista-capitulos">
                    ${lista.map((capitulo) => html`
                        <li class="capitulo">
                            <span class="capitulo__etiqueta">${capitulo.etiqueta}</span>
                            <span class="capitulo__titulo">${capitulo.titulo}</span>
                            <span class="capitulo__datos">
                                ${duracion(capitulo.duracionMinutos)}${capitulo.fechaEstreno ? ' · ' + fecha(capitulo.fechaEstreno) : ''}
                            </span>
                        </li>`)}
                </ul>
            </div>`)}`;
}

function listaReparto(personajes) {
    return html`<ul class="personajes">${personajes.map(tarjetaPersonaje)}</ul>`;
}

export async function vistaPrograma({ contenedor, parametros, vigente }) {
    pintar(contenedor, cargando('Cargando el programa…'));

    let programa;
    try {
        programa = await api.programas.obtener(parametros.id);
    } catch (error) {
        if (!vigente()) return;
        pintar(contenedor, html`
            ${fallo(error, { reintentar: false })}
            <p class="centrado"><a href="#/catalogo">Volver al catálogo</a></p>`);
        return;
    }
    if (!vigente()) return;

    const favorito = sesion.esFavorito(programa.id);
    document.title = programa.titulo + ' · TodoTv';

    pintar(contenedor, html`
        <a class="volver" href="#/catalogo">← Volver al catálogo</a>

        <article class="ficha">
            <div class="ficha__imagen">
                <img src="${programa.poster}" alt="Poster de ${programa.titulo}">
            </div>
            <div class="ficha__datos">
                <h1>${programa.titulo}</h1>
                <p class="ficha__meta">
                    <span class="etiqueta">${programa.categoria?.nombre ?? 'sin categoría'}</span>
                    ${programa.productora ? html`<span>${programa.productora.nombre} · ${programa.productora.pais}</span>` : ''}
                </p>
                <p class="ficha__sinopsis">${programa.sinopsis}</p>
                <button class="boton boton--principal ${favorito ? 'es-favorito' : ''}" id="favorito">
                    ${favorito ? '★ En favoritos' : '☆ Agregar a favoritos'}
                </button>
            </div>
        </article>

        <section class="panel">
            <h2>Trailer</h2>
            <video class="trailer" src="${programa.trailer}" poster="${programa.poster}" controls preload="none"></video>
        </section>

        <section class="panel">
            <nav class="pestanas" id="pestanas">
                <button class="pestana es-activa" data-pestana="capitulos">
                    Capítulos <span class="pestana__cuenta">${programa.capitulos.length}</span>
                </button>
                <button class="pestana" data-pestana="reparto">
                    Reparto <span class="pestana__cuenta">${programa.reparto.length}</span>
                </button>
            </nav>
            <div id="panel-pestana"></div>
        </section>`);

    const panel = contenedor.querySelector('#panel-pestana');

    // cada pestaña se pide a su propio endpoint cuando se abre
    const cargadores = {
        capitulos: () => conEstados(panel, {
            vigente,
            mensajeCarga: 'Cargando capítulos…',
            cargar: () => api.programas.capitulos(programa.id),
            vacio: { titulo: 'Todavía no hay capítulos cargados' },
            dibujar: listaCapitulos
        }),
        reparto: () => conEstados(panel, {
            vigente,
            mensajeCarga: 'Cargando el reparto…',
            cargar: () => api.programas.personajes(programa.id),
            vacio: { titulo: 'Todavía no hay reparto cargado' },
            dibujar: listaReparto
        })
    };

    contenedor.querySelector('#pestanas').addEventListener('click', (evento) => {
        const boton = evento.target.closest('[data-pestana]');
        if (!boton) return;
        for (const pestana of contenedor.querySelectorAll('.pestana')) {
            pestana.classList.toggle('es-activa', pestana === boton);
        }
        cargadores[boton.dataset.pestana]();
    });

    contenedor.querySelector('#favorito').addEventListener('click', async (evento) => {
        const boton = evento.currentTarget;
        boton.disabled = true;
        try {
            const marcado = await sesion.alternarFavorito(programa.id);
            boton.classList.toggle('es-favorito', marcado);
            boton.textContent = marcado ? '★ En favoritos' : '☆ Agregar a favoritos';
            avisar(marcado ? 'Agregado a favoritos' : 'Quitado de favoritos');
        } catch (error) {
            avisar(error.message, 'error');
        } finally {
            boton.disabled = false;
        }
    });

    await cargadores.capitulos();
}
