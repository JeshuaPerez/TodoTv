import { api } from '../nucleo/api.js';
import { html, pintar } from '../nucleo/plantilla.js';
import { fecha, plural } from '../nucleo/formato.js';
import { cargando, fallo, vacio } from '../componentes/estados.js';
import { tarjetaPersonaje } from '../componentes/tarjetas.js';

export async function vistaActor({ contenedor, parametros, vigente }) {
    pintar(contenedor, cargando('Cargando la ficha…'));

    let actor;
    try {
        actor = await api.actores.obtener(parametros.id);
    } catch (error) {
        if (!vigente()) return;
        pintar(contenedor, html`
            ${fallo(error, { reintentar: false })}
            <p class="centrado"><a href="#/actores">Ver todos los actores</a></p>`);
        return;
    }
    if (!vigente()) return;

    document.title = actor.nombre + ' · TodoTv';

    pintar(contenedor, html`
        <a class="volver" href="#/actores">← Volver a los actores</a>

        <article class="ficha">
            <div class="ficha__imagen ficha__imagen--retrato">
                <img src="${actor.foto}" alt="Foto de ${actor.nombre}">
            </div>
            <div class="ficha__datos">
                <h1>${actor.nombre}</h1>
                <p class="ficha__meta">
                    <span class="etiqueta">${actor.nacionalidad}</span>
                    <span>${fecha(actor.fechaNacimiento)}${actor.edad === null ? '' : ' · ' + actor.edad + ' años'}</span>
                </p>
                <p class="nota">${plural(actor.personajes.length, 'personaje', 'personajes')} en el catálogo</p>
            </div>
        </article>

        <section class="panel">
            <h2>Personajes que interpreta</h2>
            ${actor.personajes.length === 0
                ? vacio('Todavía no interpreta ningún personaje')
                : html`<ul class="personajes">${actor.personajes.map(tarjetaPersonaje)}</ul>`}
        </section>`);
}
