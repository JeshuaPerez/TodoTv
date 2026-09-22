import { body } from 'express-validator';

const ANIO_MINIMO = 1888;

const nombre = (opcional) => {
    const validador = body('nombre').trim();
    if (opcional) validador.optional();
    return validador.isLength({ min: 2, max: 80 }).withMessage('El nombre debe tener entre 2 y 80 caracteres');
};

const pais = (opcional) => {
    const validador = body('pais').trim();
    if (opcional) validador.optional();
    return validador.isLength({ min: 2, max: 50 }).withMessage('El país debe tener entre 2 y 50 caracteres');
};

const anioFundacion = (opcional) => {
    const validador = body('anioFundacion');
    if (opcional) validador.optional();
    return validador
        .isInt({ min: ANIO_MINIMO, max: new Date().getFullYear() })
        .withMessage('El año de fundación debe estar entre ' + ANIO_MINIMO + ' y el año actual');
};

export const alCrearProductora = [nombre(false), pais(false), anioFundacion(false)];
export const alActualizarProductora = [nombre(true), pais(true), anioFundacion(true)];
