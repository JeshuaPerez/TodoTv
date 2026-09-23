import { RECURSOS } from './recursos-admin.js';
import { avisar, detallesDeError, escapar, vistaCarga, vistaError, vistaVacio } from '../componentes.js';

function valorInicial(fila, campo) {
    if (!fila) return '';
    const valor = fila[campo.nombre];
    if (valor === null || valor === undefined) return '';
    if (campo.tipo === 'date') return String(valor).slice(0, 10);
    return String(valor);
}

function campoHtml(campo, valor, opciones, edicion) {
    const atributos = (campo.requerido ? ' required' : '') +
        (campo.soloAlCrear && edicion ? ' disabled' : '');
    let control;

    if (campo.tipo === 'textarea') {
        control = `<textarea name="${campo.nombre}" rows="4"${atributos}>${escapar(valor)}</textarea>`;
    } else if (campo.tipo === 'select') {
        const lista = (opciones ?? []).map((opcion) =>
            `<option value="${escapar(opcion.valor)}"${opcion.valor === valor ? ' selected' : ''}>${escapar(opcion.texto)}</option>`
        ).join('');
        control = `<select name="${campo.nombre}"${atributos}><option value="">Elegí una opción</option>${lista}</select>`;
    } else {
        control = `<input name="${campo.nombre}" type="${campo.tipo}" value="${escapar(valor)}"${atributos}>`;
    }

    return `<label class="campo"><span>${escapar(campo.etiqueta)}</span>${control}</label>`;
}

function tabla(recurso, filas, contexto) {
    if (filas.length === 0) {
        return vistaVacio('Todavía no hay nada cargado', 'Usá el botón de arriba para crear el primero.');
    }
    const encabezados = recurso.columnas.map((columna) => `<th>${escapar(columna.etiqueta)}</th>`).join('');
    const cuerpo = filas.map((fila) => `
        <tr>
            ${recurso.columnas.map((columna) => `<td>${escapar(columna.valor(fila, contexto))}</td>`).join('')}
            <td class="tabla__acciones">
                <button class="boton boton--chico" data-editar="${escapar(fila.id)}">Editar</button>
                <button class="boton boton--chico boton--peligro" data-borrar="${escapar(fila.id)}">Borrar</button>
            </td>
        </tr>`).join('');

    return `<div class="tabla__marco"><table class="tabla">
        <thead><tr>${encabezados}<th></th></tr></thead>
        <tbody>${cuerpo}</tbody>
    </table></div>`;
}

export async function vistaAdmin(contenedor, [nombre = 'programas']) {
    const clave = RECURSOS[nombre] ? nombre : 'programas';
    const recurso = RECURSOS[clave];

    const pestanas = Object.entries(RECURSOS).map(([id, definicion]) =>
        `<a class="pestana${id === clave ? ' es-activa' : ''}" href="#/admin/${id}">${escapar(definicion.titulo)}</a>`
    ).join('');

    contenedor.innerHTML = `
        <section class="panel">
            <div class="encabezado">
                <h1>Administración</h1>
                <button class="boton boton--principal" id="nuevo">Nuevo ${escapar(recurso.singular)}</button>
            </div>
            <nav class="pestanas">${pestanas}</nav>
            <div id="tabla"></div>
        </section>
        <dialog class="dialogo" id="dialogo"></dialog>`;

    const zona = contenedor.querySelector('#tabla');
    const dialogo = contenedor.querySelector('#dialogo');
    let filas = [];
    let contexto = {};

    async function cargar() {
        zona.innerHTML = vistaCarga();
        try {
            contexto = recurso.preparar ? await recurso.preparar() : {};
            filas = await recurso.api.listar();
            zona.innerHTML = tabla(recurso, filas, contexto);
        } catch (error) {
            zona.innerHTML = vistaError(error.message);
        }
    }

    async function abrirFormulario(fila = null) {
        const edicion = fila !== null;
        const opcionesPorCampo = new Map();
        for (const campo of recurso.campos) {
            if (campo.tipo === 'select') opcionesPorCampo.set(campo.nombre, await campo.opciones());
        }

        dialogo.innerHTML = `
            <form class="formulario" id="formulario">
                <h2>${edicion ? 'Editar' : 'Nuevo'} ${escapar(recurso.singular)}</h2>
                ${recurso.campos.map((campo) =>
                    campoHtml(campo, valorInicial(fila, campo), opcionesPorCampo.get(campo.nombre), edicion)
                ).join('')}
                <p class="formulario__error" hidden></p>
                <div class="acciones">
                    <button type="button" class="boton" data-accion="cancelar">Cancelar</button>
                    <button type="submit" class="boton boton--principal">Guardar</button>
                </div>
            </form>`;
        dialogo.showModal();

        const formulario = dialogo.querySelector('#formulario');
        const error = dialogo.querySelector('.formulario__error');
        const guardar = dialogo.querySelector('button[type="submit"]');

        dialogo.querySelector('[data-accion="cancelar"]').addEventListener('click', () => dialogo.close());

        formulario.addEventListener('submit', async (evento) => {
            evento.preventDefault();
            error.hidden = true;
            guardar.disabled = true;

            const datos = Object.fromEntries(new FormData(formulario));
            try {
                if (edicion) await recurso.api.actualizar(fila.id, datos);
                else await recurso.api.crear(datos);
                dialogo.close();
                avisar(edicion ? 'Cambios guardados' : 'Creado correctamente');
                await cargar();
            } catch (fallo) {
                error.textContent = detallesDeError(fallo);
                error.hidden = false;
            } finally {
                guardar.disabled = false;
            }
        });
    }

    contenedor.querySelector('#nuevo').addEventListener('click', () => abrirFormulario());

    zona.addEventListener('click', async (evento) => {
        if (evento.target.closest('[data-accion="reintentar"]')) {
            await cargar();
            return;
        }

        const editar = evento.target.closest('[data-editar]');
        if (editar) {
            const fila = filas.find((candidata) => candidata.id === editar.dataset.editar);
            await abrirFormulario(fila);
            return;
        }

        const borrar = evento.target.closest('[data-borrar]');
        if (!borrar) return;
        if (!confirm('¿Seguro que querés borrar este ' + recurso.singular + '?')) return;

        borrar.disabled = true;
        try {
            await recurso.api.borrar(borrar.dataset.borrar);
            avisar('Borrado');
            await cargar();
        } catch (error) {
            avisar(error.message, 'error');
            borrar.disabled = false;
        }
    });

    await cargar();
}
