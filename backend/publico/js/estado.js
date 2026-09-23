import { api } from './api/api.js';

let usuario = null;

export const sesion = {
    usuario: () => usuario,
    haySesion: () => usuario !== null,
    esAdministrador: () => usuario?.rol === 'administrador',

    establecer(nuevo) {
        usuario = nuevo;
    },

    limpiar() {
        usuario = null;
    },

    // al cargar la página no sabemos si la cookie sigue viva: se pregunta
    async recuperar() {
        try {
            usuario = await api.autenticacion.perfil();
        } catch {
            usuario = null;
        }
        return usuario;
    },

    tieneFavorito(programaId) {
        return (usuario?.favoritos ?? []).includes(programaId);
    },

    fijarFavoritos(identificadores) {
        if (!usuario) return;
        usuario.favoritos = identificadores;
    }
};
