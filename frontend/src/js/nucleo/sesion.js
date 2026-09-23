import { api } from './api.js';

let usuario = null;

export const sesion = {
    usuario: () => usuario,
    abierta: () => usuario !== null,
    esAdministrador: () => usuario?.rol === 'administrador',

    establecer(nuevo) {
        usuario = nuevo;
        return usuario;
    },

    cerrar() {
        usuario = null;
    },

    // al cargar la página la cookie puede seguir viva: se le pregunta al backend
    async recuperar() {
        try {
            usuario = await api.autenticacion.perfil();
        } catch {
            usuario = null;
        }
        return usuario;
    },

    favoritos: () => usuario?.favoritos ?? [],

    esFavorito(programaId) {
        return (usuario?.favoritos ?? []).includes(programaId);
    },

    anotarFavoritos(programas) {
        if (usuario) usuario.favoritos = programas.map((programa) => programa.id);
    },

    // marca o desmarca según el estado actual y devuelve el nuevo
    async alternarFavorito(programaId) {
        const programas = this.esFavorito(programaId)
            ? await api.favoritos.quitar(programaId)
            : await api.favoritos.agregar(programaId);
        this.anotarFavoritos(programas);
        return this.esFavorito(programaId);
    }
};
