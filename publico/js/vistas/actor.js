import { api } from '../api/api.js';
import { escapar, vistaCarga, vistaError, vistaVacio } from '../componentes.js';

export async function vistaActor(contenedor, [actorId]) {
    contenedor.innerHTML = vistaCarga('Cargando la ficha…');

    let actor;
    try {
        actor = await api.actores.obtener(actorId);
    } catch (error) {
        contenedor.innerHTML = vistaError(error.message, { reintentar: false }) +
            '<p class="nota centrado"><a href="#/catalogo">Volver al catálogo</a></p>';
        return;
    }

    const nacimiento = actor.fechaNacimiento ? new Date(actor.fechaNacimiento).toLocaleDateString('es') : '';
    const personajes = actor.personajes.length === 0
        ? vistaVacio('Todavía no interpreta ningún personaje')
        : '<ul class="reparto">' + actor.personajes.map((personaje) => `
            <li class="reparto__item">
                <a href="#/programa/${escapar(personaje.programa?.id ?? '')}" class="reparto__enlace">
                    <img class="reparto__foto reparto__foto--poster" src="${escapar(personaje.programa?.poster ?? '')}" alt="" loading="lazy">
                    <span>
                        <strong>${escapar(personaje.nombre)}</strong>
                        <small>${escapar(personaje.programa?.titulo ?? 'Programa desconocido')}</small>
                    </span>
                </a>
            </li>`).join('') + '</ul>';

    contenedor.innerHTML = `
        <article class="ficha">
            <img class="ficha__poster ficha__poster--actor" src="${escapar(actor.foto)}" alt="Foto de ${escapar(actor.nombre)}">
            <div class="ficha__datos">
                <a class="volver" href="#/catalogo">← Volver al catálogo</a>
                <h1>${escapar(actor.nombre)}</h1>
                <p class="ficha__meta">
                    <span class="etiqueta">${escapar(actor.nacionalidad)}</span>
                    <span>${escapar(nacimiento)}${actor.edad !== null ? ' · ' + actor.edad + ' años' : ''}</span>
                </p>
            </div>
        </article>

        <section class="panel">
            <h2>Personajes que interpreta</h2>
            ${personajes}
        </section>`;
}
