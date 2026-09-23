import semver from 'semver';
import { entorno } from '../config/entorno.js';
import { VersionNoCompatibleError } from '../errores/index.js';

export const CABECERA_PEDIDA = 'Accept-Version';
export const CABECERA_ACTUAL = 'X-API-Version';

export function verificarVersion(version = entorno.version) {
    return (peticion, respuesta, siguiente) => {
        respuesta.set(CABECERA_ACTUAL, version);
        const pedida = peticion.get(CABECERA_PEDIDA);

        // sin cabecera se asume que el cliente acepta la versión actual
        if (!pedida) return siguiente();

        if (!semver.validRange(pedida)) {
            return siguiente(new VersionNoCompatibleError(
                'La versión pedida "' + pedida + '" no es un rango semver válido'
            ));
        }
        if (!semver.satisfies(version, pedida)) {
            return siguiente(new VersionNoCompatibleError(
                'Esta API es la ' + version + ' y el cliente pide ' + pedida + '. Actualizá el cliente.',
                { versionApi: version, versionPedida: pedida }
            ));
        }
        siguiente();
    };
}
