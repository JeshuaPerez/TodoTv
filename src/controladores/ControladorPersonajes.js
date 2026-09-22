import { ControladorRecurso } from './ControladorRecurso.js';
import { asincrono } from '../utilidades/asincrono.js';

export class ControladorPersonajes extends ControladorRecurso {
    porPrograma = asincrono(async (peticion, respuesta) => {
        respuesta.json(await this.servicio.porPrograma(peticion.params.programaId));
    });
}
