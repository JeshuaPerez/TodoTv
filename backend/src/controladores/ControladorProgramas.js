import { ControladorRecurso } from './ControladorRecurso.js';
import { asincrono } from '../utilidades/asincrono.js';

export class ControladorProgramas extends ControladorRecurso {
    listar = asincrono(async (peticion, respuesta) => {
        const { categoria = null, texto = '' } = peticion.query;
        respuesta.json(await this.servicio.listar({ categoriaId: categoria, texto }));
    });
}
