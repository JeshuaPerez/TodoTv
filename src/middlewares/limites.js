import rateLimit from 'express-rate-limit';
import { entorno } from '../config/entorno.js';
import { DemasiadasPeticionesError } from '../errores/index.js';

function crearLimite({ maximo, minutos, mensaje }) {
    return rateLimit({
        windowMs: minutos * 60 * 1000,
        limit: maximo,
        standardHeaders: 'draft-7',
        legacyHeaders: false,
        handler: (peticion, respuesta, siguiente) => siguiente(new DemasiadasPeticionesError(mensaje))
    });
}

export function limiteGlobal() {
    return crearLimite({
        maximo: entorno.limites.global,
        minutos: entorno.limites.ventanaMinutos,
        mensaje: 'Demasiadas peticiones. Probá de nuevo en unos minutos.'
    });
}

// más estricto: registro e inicio de sesión son los que se atacan a fuerza bruta
export function limiteAutenticacion() {
    return crearLimite({
        maximo: entorno.limites.autenticacion,
        minutos: entorno.limites.ventanaMinutos,
        mensaje: 'Demasiados intentos de autenticación. Esperá unos minutos.'
    });
}
