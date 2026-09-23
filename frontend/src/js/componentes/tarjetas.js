import { html } from '../nucleo/plantilla.js';

export function tarjetaPrograma(programa, { favorito = false, conBoton = false } = {}) {
    return html`
        <article class="tarjeta">
            <a class="tarjeta__enlace" href="#/programa/${programa.id}">
                <div class="tarjeta__imagen">
                    <img src="${programa.poster}" alt="Poster de ${programa.titulo}" loading="lazy">
                </div>
                <div class="tarjeta__cuerpo">
                    ${programa.categoria?.nombre ? html`<span class="etiqueta">${programa.categoria.nombre}</span>` : ''}
                    <h3 class="tarjeta__titulo">${programa.titulo}</h3>
                    ${programa.productora?.nombre ? html`<p class="tarjeta__pie">${programa.productora.nombre}</p>` : ''}
                </div>
            </a>
            ${conBoton ? html`
                <button class="boton-estrella ${favorito ? 'es-favorito' : ''}"
                        data-favorito="${programa.id}"
                        aria-pressed="${favorito ? 'true' : 'false'}"
                        title="${favorito ? 'Quitar de favoritos' : 'Marcar como favorito'}">
                    ${favorito ? '★' : '☆'}
                </button>` : ''}
        </article>`;
}

export function rejillaProgramas(programas, { conBoton = false, esFavorito = () => false } = {}) {
    return html`
        <div class="rejilla">
            ${programas.map((programa) => tarjetaPrograma(programa, { conBoton, favorito: esFavorito(programa) }))}
        </div>`;
}

export function tarjetaActor(actor) {
    return html`
        <a class="tarjeta-actor" href="#/actor/${actor.id}">
            <div class="tarjeta-actor__imagen">
                <img src="${actor.foto}" alt="Foto de ${actor.nombre}" loading="lazy">
            </div>
            <div>
                <h3 class="tarjeta-actor__nombre">${actor.nombre}</h3>
                <p class="tarjeta-actor__datos">
                    ${actor.nacionalidad}${actor.edad === null ? '' : ' · ' + actor.edad + ' años'}
                </p>
            </div>
        </a>`;
}

export function rejillaActores(actores) {
    return html`<div class="rejilla rejilla--actores">${actores.map(tarjetaActor)}</div>`;
}

// enlaza a un actor o a un programa según lo que traiga el personaje
export function tarjetaPersonaje(personaje) {
    const destino = personaje.actor
        ? '#/actor/' + personaje.actor.id
        : '#/programa/' + (personaje.programa?.id ?? '');
    const foto = personaje.actor?.foto ?? personaje.programa?.poster ?? '';
    const pie = personaje.actor?.nombre ?? personaje.programa?.titulo ?? '';

    return html`
        <li class="personaje">
            <a class="personaje__enlace" href="${destino}">
                <img class="personaje__foto ${personaje.actor ? '' : 'personaje__foto--poster'}"
                     src="${foto}" alt="" loading="lazy">
                <span>
                    <strong>${personaje.nombre}</strong>
                    <small>${pie}</small>
                </span>
            </a>
        </li>`;
}
