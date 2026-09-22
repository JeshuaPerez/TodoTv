import { body } from 'express-validator';

const nombre = (opcional) => {
    const validador = body('nombre').trim();
    if (opcional) validador.optional();
    return validador.isLength({ min: 3, max: 40 }).withMessage('El nombre debe tener entre 3 y 40 caracteres');
};

const descripcion = () => body('descripcion')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 200 })
    .withMessage('La descripción no puede pasar de 200 caracteres');

export const alCrearCategoria = [nombre(false), descripcion()];
export const alActualizarCategoria = [nombre(true), descripcion()];
