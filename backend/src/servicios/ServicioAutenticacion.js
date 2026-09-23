import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Usuario } from '../modelos/Usuario.js';
import { entorno } from '../config/entorno.js';
import { duracionAMilisegundos } from '../utilidades/valores.js';
import { NoAutenticadoError } from '../errores/index.js';

const VUELTAS = 10;
// se compara contra este hash cuando el correo no existe, para que fallar tarde lo mismo
const HASH_INEXISTENTE = bcrypt.hashSync('usuario-que-no-existe', VUELTAS);

export class ServicioAutenticacion {
    constructor(repositorioUsuarios) {
        this.usuarios = repositorioUsuarios;
    }

    async registrar({ nombreUsuario, correo, contrasena }) {
        // el rol nunca llega del cliente: quien se registra siempre es usuario
        const cifrada = await bcrypt.hash(contrasena, VUELTAS);
        const usuario = Usuario.nuevo({
            nombreUsuario,
            correo,
            contrasena: cifrada,
            rol: Usuario.ROLES.USUARIO
        });
        await this.usuarios.crear(usuario);
        return this.credenciales(usuario);
    }

    async iniciarSesion({ correo, contrasena }) {
        const usuario = await this.usuarios.porCorreo(correo);
        if (!usuario) {
            await bcrypt.compare(contrasena, HASH_INEXISTENTE);
            throw new NoAutenticadoError('El correo o la contraseña no son correctos');
        }
        if (!(await bcrypt.compare(contrasena, usuario.contrasena))) {
            throw new NoAutenticadoError('El correo o la contraseña no son correctos');
        }
        return this.credenciales(usuario);
    }

    credenciales(usuario) {
        const token = jwt.sign(
            { sub: usuario.id.toString(), rol: usuario.rol },
            entorno.jwt.secreto,
            { expiresIn: entorno.jwt.expiracion }
        );
        return {
            usuario: usuario.aPublico(),
            token,
            duracionMs: duracionAMilisegundos(entorno.jwt.expiracion)
        };
    }

    async porId(id) {
        return this.usuarios.porId(id);
    }
}
