import { RepositorioBase } from './RepositorioBase.js';
import { Usuario } from '../modelos/Usuario.js';
import { COLECCIONES, COTEJO_ES } from '../config/colecciones.js';

export class RepositorioUsuarios extends RepositorioBase {
    constructor(base) {
        super(base, COLECCIONES.USUARIOS, Usuario);
    }

    async porCorreo(correo, sesion = null) {
        return this.uno({ correo: String(correo).toLowerCase() }, { collation: COTEJO_ES }, sesion);
    }

    async porNombreUsuario(nombreUsuario, sesion = null) {
        return this.uno({ nombreUsuario }, { collation: COTEJO_ES }, sesion);
    }

    async guardarFavoritos(usuario, sesion = null) {
        await this.modificar(
            usuario.id,
            { favoritos: usuario.favoritos, actualizadoEn: usuario.actualizadoEn },
            sesion
        );
        return usuario;
    }
}
