import { asincrono } from '../utilidades/asincrono.js';

export class ControladorRecurso {
    constructor(servicio) {
        this.servicio = servicio;
    }

    listar = asincrono(async (peticion, respuesta) => {
        respuesta.json(await this.servicio.listar());
    });

    obtener = asincrono(async (peticion, respuesta) => {
        respuesta.json(await this.servicio.obtener(peticion.params.id));
    });

    crear = asincrono(async (peticion, respuesta) => {
        respuesta.status(201).json(await this.servicio.crear(peticion.body));
    });

    actualizar = asincrono(async (peticion, respuesta) => {
        respuesta.json(await this.servicio.actualizar(peticion.params.id, peticion.body));
    });

    borrar = asincrono(async (peticion, respuesta) => {
        await this.servicio.borrar(peticion.params.id);
        respuesta.status(204).end();
    });
}
