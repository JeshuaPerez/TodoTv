import { rutasRecurso } from './recurso.js';
import { idEnRuta } from './validadores/comunes.js';
import { revisarValidaciones } from '../middlewares/validacion.js';
import { alCrearPrograma, alActualizarPrograma } from './validadores/programas.js';

export function rutasProgramas({ programas, capitulos, personajes }, autenticacion) {
    const rutas = rutasRecurso({
        controlador: programas,
        autenticacion,
        etiqueta: 'id del programa',
        alCrear: alCrearPrograma,
        alActualizar: alActualizarPrograma
    });
    const identificador = [idEnRuta('programaId', 'id del programa'), revisarValidaciones];

    rutas.get('/:programaId/capitulos', identificador, capitulos.porPrograma);
    rutas.get('/:programaId/personajes', identificador, personajes.porPrograma);

    return rutas;
}
