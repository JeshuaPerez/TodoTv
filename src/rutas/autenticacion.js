import { Router } from 'express';
import { revisarValidaciones } from '../middlewares/validacion.js';
import { limiteAutenticacion } from '../middlewares/limites.js';
import { alRegistrar, alIniciarSesion } from './validadores/autenticacion.js';

export function rutasAutenticacion(controlador, autenticacion) {
    const rutas = Router();
    // límite más estricto que el global sobre las puertas de entrada
    const limite = limiteAutenticacion();

    rutas.post('/registro', limite, alRegistrar, revisarValidaciones, controlador.registrar);
    rutas.post('/inicio-sesion', limite, alIniciarSesion, revisarValidaciones, controlador.iniciarSesion);
    rutas.post('/cierre-sesion', controlador.cerrarSesion);
    rutas.get('/perfil', autenticacion.requerido(), controlador.perfil);

    return rutas;
}
