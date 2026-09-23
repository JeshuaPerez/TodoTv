import { asincrono } from '../utilidades/asincrono.js';

export class ControladorFavoritos {
    constructor(servicio) {
        this.servicio = servicio;
    }

    listar = asincrono(async (peticion, respuesta) => {
        respuesta.json(await this.servicio.listar(peticion.usuario));
    });

    agregar = asincrono(async (peticion, respuesta) => {
        respuesta.status(201).json(await this.servicio.agregar(peticion.usuario, peticion.params.programaId));
    });

    quitar = asincrono(async (peticion, respuesta) => {
        respuesta.json(await this.servicio.quitar(peticion.usuario, peticion.params.programaId));
    });
}
