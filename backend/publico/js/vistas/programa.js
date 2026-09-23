import { api } from '../api/api.js';
import { sesion } from '../estado.js';
import { avisar, escapar, vistaCarga, vistaError, vistaVacio } from '../componentes.js';

function fechaCorta(valor) {
    return valor ? new Date(valor).toLocaleDateString('es') : '';
}

function listaCapitulos(capitulos) {
    if (capitulos.length === 0) return vistaVacio('Todavía no hay capítulos cargados');

    const temporadas = new Map();
    for (const capitulo of capitulos) {
        if (!temporadas.has(capitulo.temporada)) temporadas.set(capitulo.temporada, []);
        temporadas.get(capitulo.temporada).push(capitulo);
    }

    return [...temporadas.entries()].map(([temporada, lista]) => `
        <div class="temporada">
            <h3 class="temporada__titulo">Temporada ${temporada}</h3>
            <ul class="lista-capitulos">
                ${lista.map((capitulo) => `
                    <li class="capitulo">
                        <span class="capitulo__etiqueta">${escapar(capitulo.etiqueta)}</span>
                        <span class="capitulo__titulo">${escapar(capitulo.titulo)}</span>
                        <span class="capitulo__datos">${capitulo.duracionMinutos} min · ${escapar(fechaCorta(capitulo.fechaEstreno))}</span>
                    </li>`).join('')}
            </ul>
        </div>`).join('');
}

function listaReparto(reparto) {
    if (reparto.length === 0) return vistaVacio('Este programa todavía no tiene reparto cargado');

    return '<ul class="reparto">' + reparto.map((personaje) => `
        <li class="reparto__item">
            <a href="#/actor/${escapar(personaje.actor?.id ?? '')}" class="reparto__enlace">
                <img class="reparto__foto" src="${escapar(personaje.actor?.foto ?? '')}" alt="" loading="lazy">
                <span>
                    <strong>${escapar(personaje.nombre)}</strong>
                    <small>${escapar(personaje.actor?.nombre ?? 'Actor desconocido')}</small>
                </span>
            </a>
        </li>`).join('') + '</ul>';
}

export async function vistaPrograma(contenedor, [programaId]) {
    contenedor.innerHTML = vistaCarga('Cargando el programa…');

    let programa;
    try {
        programa = await api.programas.obtener(programaId);
    } catch (error) {
        contenedor.innerHTML = vistaError(error.message, { reintentar: false }) +
            '<p class="nota centrado"><a href="#/catalogo">Volver al catálogo</a></p>';
        return;
    }

    const favorito = sesion.tieneFavorito(programa.id);
    contenedor.innerHTML = `
        <article class="ficha">
            <img class="ficha__poster" src="${escapar(programa.poster)}" alt="Poster de ${escapar(programa.titulo)}">
            <div class="ficha__datos">
                <a class="volver" href="#/catalogo">← Volver al catálogo</a>
                <h1>${escapar(programa.titulo)}</h1>
                <p class="ficha__meta">
                    <span class="etiqueta">${escapar(programa.categoria?.nombre ?? 'sin categoría')}</span>
                    <span>${escapar(programa.productora?.nombre ?? '')}</span>
                </p>
                <p class="ficha__sinopsis">${escapar(programa.sinopsis)}</p>
                <button class="boton boton--principal${favorito ? ' es-favorito' : ''}" id="boton-favorito">
                    ${favorito ? '★ En favoritos' : '☆ Agregar a favoritos'}
                </button>
            </div>
        </article>

        <section class="panel">
            <h2>Trailer</h2>
            <video class="trailer" src="${escapar(programa.trailer)}" controls preload="none"
                   poster="${escapar(programa.poster)}"></video>
        </section>

        <section class="panel">
            <h2>Capítulos</h2>
            ${listaCapitulos(programa.capitulos)}
        </section>

        <section class="panel">
            <h2>Reparto</h2>
            ${listaReparto(programa.reparto)}
        </section>`;

    contenedor.querySelector('#boton-favorito').addEventListener('click', async (evento) => {
        const boton = evento.currentTarget;
        boton.disabled = true;
        try {
            const favoritos = sesion.tieneFavorito(programa.id)
                ? await api.favoritos.quitar(programa.id)
                : await api.favoritos.agregar(programa.id);
            sesion.fijarFavoritos(favoritos.map((elemento) => elemento.id));

            const marcado = sesion.tieneFavorito(programa.id);
            boton.classList.toggle('es-favorito', marcado);
            boton.textContent = marcado ? '★ En favoritos' : '☆ Agregar a favoritos';
            avisar(marcado ? 'Agregado a favoritos' : 'Quitado de favoritos');
        } catch (error) {
            avisar(error.message, 'error');
        } finally {
            boton.disabled = false;
        }
    });
}
