import { body } from 'express-validator';
import { urlEnCuerpo } from './comunes.js';

const nombre = (opcional) => {
    const validador = body('nombre').trim();
    if (opcional) validador.optional();
    return validador.isLength({ min: 2, max: 80 }).withMessage('El nombre debe tener entre 2 y 80 caracteres');
};

const nacionalidad = (opcional) => {
    const validador = body('nacionalidad').trim();
    if (opcional) validador.optional();
    return validador.isLength({ min: 2, max: 50 }).withMessage('La nacionalidad debe tener entre 2 y 50 caracteres');
};

const fechaNacimiento = (opcional) => {
    const validador = body('fechaNacimiento');
    if (opcional) validador.optional();
    return validador
        .isISO8601()
        .withMessage('La fecha de nacimiento debe ser una fecha válida')
        .bail()
        .custom((valor) => new Date(valor) <= new Date())
        .withMessage('La fecha de nacimiento no puede estar en el futuro');
};

export const alCrearActor = [
    nombre(false),
    nacionalidad(false),
    fechaNacimiento(false),
    urlEnCuerpo('foto', 'foto', true)
];

export const alActualizarActor = [
    nombre(true),
    nacionalidad(true),
    fechaNacimiento(true),
    urlEnCuerpo('foto', 'foto', true)
];
