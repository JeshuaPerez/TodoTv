import { asincrono } from '../utilidades/asincrono.js';
import { entorno } from '../config/entorno.js';

export class ControladorAutenticacion {
    constructor(servicio) {
        this.servicio = servicio;
    }

    // httpOnly para que el JavaScript no la lea, strict para cerrarle la puerta al CSRF
    opcionesCookie(duracionMs = null) {
        const opciones = {
            httpOnly: true,
            sameSite: 'strict',
            secure: entorno.esProduccion,
            path: '/'
        };
        if (duracionMs) opciones.maxAge = duracionMs;
        return opciones;
    }

    registrar = asincrono(async (peticion, respuesta) => {
        const { usuario, token, duracionMs } = await this.servicio.registrar(peticion.body);
        respuesta.cookie(entorno.cookie.nombre, token, this.opcionesCookie(duracionMs));
        respuesta.status(201).json(usuario);
    });

    iniciarSesion = asincrono(async (peticion, respuesta) => {
        const { usuario, token, duracionMs } = await this.servicio.iniciarSesion(peticion.body);
        respuesta.cookie(entorno.cookie.nombre, token, this.opcionesCookie(duracionMs));
        respuesta.json(usuario);
    });

    cerrarSesion = (peticion, respuesta) => {
        respuesta.clearCookie(entorno.cookie.nombre, this.opcionesCookie());
        respuesta.status(204).end();
    };

    perfil = asincrono(async (peticion, respuesta) => {
        respuesta.json(peticion.usuario.aPublico());
    });
}
