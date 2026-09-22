import { verdadero, codigoError } from '../ayudas.js';

export async function pruebasLimites(registro, contexto) {
    await registro.prueba('el límite estricto corta los intentos de inicio de sesión', async () => {
        let ultima = null;
        // el contador ya viene gastado por las suites anteriores, por eso el tope alto
        for (let intento = 0; intento < 60; intento += 1) {
            ultima = await contexto.cliente().post('/autenticacion/inicio-sesion', {
                correo: 'fuerza@bruta.test',
                contrasena: 'probando1234'
            });
            if (ultima.estado === 429) break;
        }
        verdadero(ultima.estado === 429, 'nunca llegó el 429, llegó ' + ultima.estado);
        codigoError(ultima, 'DEMASIADAS_PETICIONES');
    });
}
