import { html } from '../nucleo/plantilla.js';

function valorDe(fila, definicion) {
    if (!fila) return '';
    const valor = fila[definicion.nombre];
    if (valor === null || valor === undefined) return '';
    if (definicion.tipo === 'fecha') return String(valor).slice(0, 10);
    return String(valor);
}

function control(definicion, valor, edicion) {
    const bloqueado = definicion.soloAlCrear && edicion;
    const comunes = html`name="${definicion.nombre}" id="campo-${definicion.nombre}"
        ${definicion.requerido && !bloqueado ? 'required' : ''} ${bloqueado ? 'disabled' : ''}`;

    if (definicion.tipo === 'parrafo') {
        return html`<textarea ${comunes} rows="4">${valor}</textarea>`;
    }
    if (definicion.tipo === 'seleccion') {
        return html`
            <select ${comunes}>
                <option value="">Elegí una opción</option>
                ${(definicion.valores ?? []).map((opcion) => html`
                    <option value="${opcion.valor}" ${opcion.valor === valor ? 'selected' : ''}>${opcion.texto}</option>`)}
            </select>`;
    }

    const tipos = { fecha: 'date', numero: 'number', enlace: 'url', texto: 'text' };
    // el mínimo se arma con la plantilla: como texto suelto, las comillas se escaparían
    const minimo = definicion.minimo === undefined ? '' : html`min="${definicion.minimo}"`;

    return html`<input ${comunes} type="${tipos[definicion.tipo] ?? 'text'}" value="${valor}" ${minimo}>`;
}

function filaDeLista(definicion, valores = {}) {
    return html`
        <div class="fila-lista">
            ${definicion.subcampos.map((subcampo) => html`
                <input data-campo="${subcampo.nombre}"
                       type="${subcampo.tipo === 'numero' ? 'number' : 'text'}"
                       placeholder="${subcampo.etiqueta}"
                       aria-label="${subcampo.etiqueta}"
                       value="${valores[subcampo.nombre] ?? subcampo.porDefecto ?? ''}">`)}
            <button type="button" class="boton boton--chico boton--peligro" data-quitar-fila>Quitar</button>
        </div>`;
}

export function campos(definiciones, fila, { edicion = false } = {}) {
    return definiciones
        .filter((definicion) => !(definicion.soloAlCrear && edicion && definicion.tipo === 'lista'))
        .map((definicion) => {
            if (definicion.tipo === 'lista') {
                return html`
                    <fieldset class="lista-campos" data-lista="${definicion.nombre}">
                        <legend>${definicion.etiqueta}</legend>
                        ${definicion.ayuda ? html`<p class="campo__ayuda">${definicion.ayuda}</p>` : ''}
                        <div class="lista-campos__filas"></div>
                        <button type="button" class="boton boton--chico" data-agregar-fila>Agregar</button>
                    </fieldset>`;
            }
            return html`
                <div class="campo">
                    <label for="campo-${definicion.nombre}">${definicion.etiqueta}</label>
                    ${control(definicion, valorDe(fila, definicion), edicion)}
                    ${definicion.ayuda ? html`<small class="campo__ayuda">${definicion.ayuda}</small>` : ''}
                    <small class="campo__error" data-error-de="${definicion.nombre}" hidden></small>
                </div>`;
        });
}

export function conectarListas(formulario, definiciones) {
    for (const definicion of definiciones.filter((candidata) => candidata.tipo === 'lista')) {
        const bloque = formulario.querySelector('[data-lista="' + definicion.nombre + '"]');
        if (!bloque) continue;

        const filas = bloque.querySelector('.lista-campos__filas');
        const agregar = () => filas.insertAdjacentHTML('beforeend', filaDeLista(definicion).texto);

        bloque.querySelector('[data-agregar-fila]').addEventListener('click', agregar);
        filas.addEventListener('click', (evento) => {
            if (evento.target.closest('[data-quitar-fila]')) evento.target.closest('.fila-lista').remove();
        });
    }
}

export function leerValores(formulario, definiciones) {
    const datos = {};

    for (const definicion of definiciones) {
        if (definicion.tipo === 'lista') {
            const bloque = formulario.querySelector('[data-lista="' + definicion.nombre + '"]');
            if (!bloque) continue;

            const filas = [...bloque.querySelectorAll('.fila-lista')].map((fila) => {
                const valores = {};
                for (const entrada of fila.querySelectorAll('[data-campo]')) {
                    valores[entrada.dataset.campo] = entrada.value.trim();
                }
                return valores;
            }).filter((valores) => Object.values(valores).some((valor) => valor !== ''));

            // si no se cargó ninguna fila, el campo no se manda
            if (filas.length > 0) datos[definicion.nombre] = filas;
            continue;
        }

        const control = formulario.elements[definicion.nombre];
        if (!control || control.disabled) continue;
        datos[definicion.nombre] = control.value.trim();
    }
    return datos;
}

export function marcarErrores(formulario, error) {
    for (const marca of formulario.querySelectorAll('[data-error-de]')) {
        marca.hidden = true;
        marca.textContent = '';
    }

    let reconocidos = 0;
    for (const [campo, mensaje] of error.porCampo()) {
        const marca = formulario.querySelector('[data-error-de="' + campo + '"]');
        if (!marca) continue;
        marca.textContent = mensaje;
        marca.hidden = false;
        reconocidos += 1;
    }
    return reconocidos;
}
