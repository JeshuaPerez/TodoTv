import { param, body } from 'express-validator';
import { esObjectIdValido } from '../../utilidades/identificadores.js';

export function idEnRuta(nombre = 'id', etiqueta = 'identificador') {
    return param(nombre)
        .custom(esObjectIdValido)
        .withMessage('El ' + etiqueta + ' no es un ObjectId válido');
}

export function idEnCuerpo(campo, etiqueta, opcional = false) {
    const validador = body(campo);
    if (opcional) validador.optional();
    return validador
        .custom(esObjectIdValido)
        .withMessage('El ' + etiqueta + ' no es un ObjectId válido');
}

export function urlEnCuerpo(campo, etiqueta, opcional = false) {
    const validador = body(campo).trim();
    if (opcional) validador.optional({ values: 'falsy' });
    return validador
        .isURL({ protocols: ['http', 'https'], require_protocol: true })
        .withMessage('El ' + etiqueta + ' debe ser una URL http o https');
}
