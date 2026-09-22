import { ControladorRecurso } from './ControladorRecurso.js';
import { asincrono } from '../utilidades/asincrono.js';

export class ControladorActores extends ControladorRecurso {
    listar = asincrono(async (peticion, respuesta) => {
        respuesta.json(await this.servicio.listar(peticion.query.texto ?? ''));
    });
}
