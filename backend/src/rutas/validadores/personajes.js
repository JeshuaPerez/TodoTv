import { body } from 'express-validator';
import { idEnCuerpo } from './comunes.js';

const nombre = (opcional) => {
    const validador = body('nombre').trim();
    if (opcional) validador.optional();
    return validador.isLength({ min: 2, max: 80 }).withMessage('El nombre debe tener entre 2 y 80 caracteres');
};

export const alCrearPersonaje = [
    nombre(false),
    idEnCuerpo('programaId', 'id del programa'),
    idEnCuerpo('actorId', 'id del actor')
];

export const alActualizarPersonaje = [
    nombre(true),
    idEnCuerpo('actorId', 'id del actor', true)
];
