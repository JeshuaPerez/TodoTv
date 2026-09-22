import { body } from 'express-validator';

export const alRegistrar = [
    body('nombreUsuario')
        .trim()
        .isLength({ min: 3, max: 20 })
        .withMessage('El nombre de usuario debe tener entre 3 y 20 caracteres')
        .bail()
        .matches(/^[\w.-]+$/)
        .withMessage('El nombre de usuario solo admite letras, números, punto, guion y guion bajo'),
    body('correo')
        .trim()
        .isEmail()
        .withMessage('El correo no tiene un formato válido')
        .normalizeEmail({ gmail_remove_dots: false }),
    body('contrasena')
        .isLength({ min: 8, max: 72 })
        .withMessage('La contraseña debe tener entre 8 y 72 caracteres')
        .bail()
        .matches(/\d/)
        .withMessage('La contraseña debe incluir al menos un número')
        .matches(/[a-zA-Z]/)
        .withMessage('La contraseña debe incluir al menos una letra')
];

export const alIniciarSesion = [
    body('correo').trim().isEmail().withMessage('El correo no tiene un formato válido'),
    body('contrasena').notEmpty().withMessage('La contraseña es obligatoria')
];
