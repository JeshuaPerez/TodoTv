import { body } from 'express-validator';
import { idEnCuerpo } from './comunes.js';

const temporada = (opcional) => {
    const validador = body('temporada');
    if (opcional) validador.optional();
    return validador.isInt({ min: 1 }).withMessage('La temporada debe ser un entero mayor o igual a 1');
};

const numero = (opcional) => {
    const validador = body('numero');
    if (opcional) validador.optional();
    return validador.isInt({ min: 1 }).withMessage('El número de capítulo debe ser un entero mayor o igual a 1');
};

const titulo = (opcional) => {
    const validador = body('titulo').trim();
    if (opcional) validador.optional();
    return validador.isLength({ min: 1, max: 120 }).withMessage('El título debe tener entre 1 y 120 caracteres');
};

const duracion = (opcional) => {
    const validador = body('duracionMinutos');
    if (opcional) validador.optional();
    return validador.isInt({ min: 1, max: 600 }).withMessage('La duración debe estar entre 1 y 600 minutos');
};

const fechaEstreno = () => body('fechaEstreno')
    .optional({ values: 'falsy' })
    .isISO8601()
    .withMessage('La fecha de estreno debe ser una fecha válida');

export const alCrearCapitulo = [
    idEnCuerpo('programaId', 'id del programa'),
    temporada(false),
    numero(false),
    titulo(false),
    duracion(false),
    fechaEstreno()
];

export const alActualizarCapitulo = [
    temporada(true),
    numero(true),
    titulo(true),
    duracion(true),
    fechaEstreno()
];
