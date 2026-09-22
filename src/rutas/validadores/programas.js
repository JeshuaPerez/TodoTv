import { body } from 'express-validator';
import { idEnCuerpo, urlEnCuerpo } from './comunes.js';

const titulo = (opcional) => {
    const validador = body('titulo').trim();
    if (opcional) validador.optional();
    return validador.isLength({ min: 1, max: 120 }).withMessage('El título debe tener entre 1 y 120 caracteres');
};

const sinopsis = (opcional) => {
    const validador = body('sinopsis').trim();
    if (opcional) validador.optional();
    return validador.isLength({ min: 10, max: 2000 }).withMessage('La sinopsis debe tener entre 10 y 2000 caracteres');
};

// capítulos iniciales opcionales: si vienen, el alta entra en una transacción
const capitulosIniciales = [
    body('capitulos').optional().isArray({ max: 50 }).withMessage('Los capítulos deben venir en una lista de hasta 50'),
    body('capitulos.*.temporada').isInt({ min: 1 }).withMessage('La temporada debe ser un entero mayor o igual a 1'),
    body('capitulos.*.numero').isInt({ min: 1 }).withMessage('El número de capítulo debe ser un entero mayor o igual a 1'),
    body('capitulos.*.titulo').trim().isLength({ min: 1, max: 120 }).withMessage('El título del capítulo es obligatorio'),
    body('capitulos.*.duracionMinutos').isInt({ min: 1, max: 600 }).withMessage('La duración debe estar entre 1 y 600 minutos'),
    body('capitulos.*.fechaEstreno').optional({ values: 'falsy' }).isISO8601().withMessage('La fecha de estreno debe ser una fecha válida')
];

export const alCrearPrograma = [
    titulo(false),
    sinopsis(false),
    urlEnCuerpo('poster', 'poster'),
    urlEnCuerpo('trailer', 'trailer'),
    idEnCuerpo('categoriaId', 'id de la categoría'),
    idEnCuerpo('productoraId', 'id de la productora'),
    ...capitulosIniciales
];

export const alActualizarPrograma = [
    titulo(true),
    sinopsis(true),
    urlEnCuerpo('poster', 'poster', true),
    urlEnCuerpo('trailer', 'trailer', true),
    idEnCuerpo('categoriaId', 'id de la categoría', true),
    idEnCuerpo('productoraId', 'id de la productora', true)
];
