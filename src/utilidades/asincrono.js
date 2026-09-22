// los controladores son async: sin esto un rechazo nunca llegaría al manejador de errores
export function asincrono(manejador) {
    return (peticion, respuesta, siguiente) => {
        Promise.resolve(manejador(peticion, respuesta, siguiente)).catch(siguiente);
    };
}
