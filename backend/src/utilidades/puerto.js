// el error de listen llega por evento y no por la promesa: sin engancharlo, un puerto
// ocupado sale como una traza de EADDRINUSE que no dice qué hacer
export function avisarSiElPuertoEstaOcupado(servidor, puerto) {
    servidor.on('error', (error) => {
        if (error.code !== 'EADDRINUSE') throw error;
        console.error('El puerto ' + puerto + ' ya está ocupado.');
        console.error('Lo usa otro proceso (¿la interfaz de frontend/, u otra API ya levantada?).');
        console.error('Cambialo con PUERTO en backend/.env y hacé que API_DESTINO de la');
        console.error('interfaz apunte al puerto nuevo.');
        process.exit(1);
    });
}
