import { validationResult } from 'express-validator';
import { ValidacionError } from '../errores/index.js';

export function revisarValidaciones(peticion, respuesta, siguiente) {
    const resultado = validationResult(peticion);
    if (resultado.isEmpty()) return siguiente();

    const detalles = resultado.array().map((fallo) => ({ campo: fallo.path, mensaje: fallo.msg }));
    siguiente(new ValidacionError('Los datos enviados no son válidos', detalles));
}
