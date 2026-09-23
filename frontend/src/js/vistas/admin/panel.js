import { RECURSOS } from './recursos.js';
import { html, pintar } from '../../nucleo/plantilla.js';
import { avisar } from '../../nucleo/avisos.js';
import { conEstados } from '../../componentes/estados.js';
import { abrirFormulario, confirmar } from '../../componentes/dialogo.js';
import { campos, conectarListas, leerValores, marcarErrores } from '../../componentes/formulario.js';

function tabla(recurso, filas, contexto) {
    return html`
        <div class="tabla__marco">
            <table class="tabla">
                <thead>
                    <tr>
                        ${recurso.columnas.map((columna) => html`<th>${columna.etiqueta}</th>`)}
                        <th><span class="solo-lectores">Acciones</span></th>
                    </tr>
                </thead>
                <tbody>
                    ${filas.map((fila) => html`
                        <tr>
                            ${recurso.columnas.map((columna) => html`<td>${columna.valor(fila, contexto)}</td>`)}
                            <td class="tabla__acciones">
                                <button class="boton boton--chico" data-editar="${fila.id}">Editar</button>
                                <button class="boton boton--chico boton--peligro" data-borrar="${fila.id}">Borrar</button>
                            </td>
                        </tr>`)}
                </tbody>
            </table>
        </div>`;
}

export async function vistaAdmin({ contenedor, parametros, vigente }) {
    const clave = RECURSOS[parametros.recurso] ? parametros.recurso : 'programas';
    const recurso = RECURSOS[clave];

    pintar(contenedor, html`
        <section class="panel">
            <div class="encabezado">
                <div>
                    <h1>Administración</h1>
                    <p class="nota">Alta, edición y baja de ${recurso.titulo.toLowerCase()}.</p>
                </div>
                <button class="boton boton--principal" id="nuevo">Nuevo ${recurso.singular}</button>
            </div>

            <nav class="pestanas">
                ${Object.entries(RECURSOS).map(([id, definicion]) => html`
                    <a class="pestana ${id === clave ? 'es-activa' : ''}" href="#/admin/${id}">${definicion.titulo}</a>`)}
            </nav>

            <div id="tabla"></div>
        </section>`);

    const zona = contenedor.querySelector('#tabla');
    let filas = [];
    let contexto = {};

    const cargar = () => conEstados(zona, {
        vigente,
        mensajeCarga: 'Cargando ' + recurso.titulo.toLowerCase() + '…',
        cargar: async () => {
            contexto = recurso.preparar ? await recurso.preparar() : {};
            filas = await recurso.api.listar();
            return filas;
        },
        vacio: {
            titulo: 'Todavía no hay nada cargado',
            detalle: 'Usá el botón de arriba para crear el primero.'
        },
        dibujar: (lista) => tabla(recurso, lista, contexto)
    });

    async function abrir(fila = null) {
        const edicion = fila !== null;
        let definiciones;
        try {
            definiciones = await recurso.campos();
        } catch (error) {
            avisar(error.message, 'error');
            return;
        }

        await abrirFormulario({
            titulo: (edicion ? 'Editar ' : 'Nuevo ') + recurso.singular,
            cuerpo: campos(definiciones, fila, { edicion }),
            alMontar: (formulario) => conectarListas(formulario, definiciones),
            alAceptar: async (formulario) => {
                const datos = leerValores(formulario, definiciones);
                if (edicion) await recurso.api.actualizar(fila.id, datos);
                else await recurso.api.crear(datos);

                avisar(edicion ? 'Cambios guardados' : recurso.singular + ' creado');
                await cargar();
            },
            alFallar: marcarErrores
        });
    }

    contenedor.querySelector('#nuevo').addEventListener('click', () => abrir());

    zona.addEventListener('click', async (evento) => {
        const editar = evento.target.closest('[data-editar]');
        if (editar) {
            await abrir(filas.find((candidata) => candidata.id === editar.dataset.editar) ?? null);
            return;
        }

        const borrar = evento.target.closest('[data-borrar]');
        if (!borrar) return;

        const confirmado = await confirmar('¿Seguro que querés borrar este ' + recurso.singular + '?');
        if (!confirmado) return;

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
