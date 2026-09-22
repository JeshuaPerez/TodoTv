import { api } from '../api/api.js';
import { sesion } from '../estado.js';
import { avisar, escapar, rejilla, vistaCarga, vistaError, vistaVacio } from '../componentes.js';

export async function vistaCatalogo(contenedor) {
    contenedor.innerHTML = `
        <section class="panel">
            <div class="encabezado">
                <h1>Catálogo</h1>
                <div class="filtros">
                    <select class="control" id="filtro-categoria">
                        <option value="">Todas las categorías</option>
                    </select>
                    <input class="control" id="filtro-texto" type="search" placeholder="Buscar por título…">
                </div>
            </div>
            <div id="resultados"></div>
        </section>`;

    const resultados = contenedor.querySelector('#resultados');
    const selector = contenedor.querySelector('#filtro-categoria');
    const buscador = contenedor.querySelector('#filtro-texto');

    try {
        const categorias = await api.categorias.listar();
        selector.insertAdjacentHTML('beforeend', categorias
            .map((categoria) => '<option value="' + escapar(categoria.id) + '">' + escapar(categoria.nombre) + '</option>')
            .join(''));
    } catch {
        // sin el filtro el catálogo igual se puede mirar
    }

    async function cargar() {
        resultados.innerHTML = vistaCarga('Buscando programas…');
        try {
            const programas = await api.programas.listar({
                categoria: selector.value,
                texto: buscador.value.trim()
            });
            if (programas.length === 0) {
                resultados.innerHTML = vistaVacio(
                    'No hay programas que coincidan',
                    'Probá con otra categoría o limpiá la búsqueda.'
                );
                return;
            }
            resultados.innerHTML = rejilla(programas, {
                mostrarBoton: sesion.haySesion(),
                esFavorito: (programa) => sesion.tieneFavorito(programa.id)
            });
        } catch (error) {
            resultados.innerHTML = vistaError(error.message);
        }
    }

    let temporizador = null;
    buscador.addEventListener('input', () => {
        clearTimeout(temporizador);
        temporizador = setTimeout(cargar, 300);
    });
    selector.addEventListener('change', cargar);

    resultados.addEventListener('click', async (evento) => {
        if (evento.target.closest('[data-accion="reintentar"]')) {
            cargar();
            return;
        }
        const boton = evento.target.closest('[data-favorito]');
        if (!boton) return;

        const programaId = boton.dataset.favorito;
        boton.disabled = true;
        try {
            const favoritos = sesion.tieneFavorito(programaId)
                ? await api.favoritos.quitar(programaId)
                : await api.favoritos.agregar(programaId);
            sesion.fijarFavoritos(favoritos.map((programa) => programa.id));

            const marcado = sesion.tieneFavorito(programaId);
            boton.classList.toggle('es-favorito', marcado);
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
