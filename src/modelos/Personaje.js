import { aObjectId, aTexto } from '../utilidades/identificadores.js';
import { texto } from '../utilidades/valores.js';
import { ValidacionError } from '../errores/index.js';

export class Personaje {
    constructor({ id = null, nombre, programaId, actorId, creadoEn = null, actualizadoEn = null }) {
        this.id = aObjectId(id, 'id del personaje');
        this.nombre = texto(nombre);
        this.programaId = aObjectId(programaId, 'id del programa');
        this.actorId = aObjectId(actorId, 'id del actor');
        this.creadoEn = creadoEn;
        this.actualizadoEn = actualizadoEn;
    }

    static desde(documento) {
        if (!documento) return null;
        return new Personaje({
            id: documento._id,
            nombre: documento.nombre,
            programaId: documento.programaId,
            actorId: documento.actorId,
            creadoEn: documento.creadoEn,
            actualizadoEn: documento.actualizadoEn
        });
    }

    static nuevo(datos) {
        const ahora = new Date();
        const personaje = new Personaje({ ...datos, id: null, creadoEn: ahora, actualizadoEn: ahora });
        personaje.verificar();
        return personaje;
    }

    verificar() {
        if (this.nombre.length < 2) {
            throw new ValidacionError('El nombre del personaje necesita al menos 2 caracteres');
        }
        if (!this.programaId) {
            throw new ValidacionError('El personaje debe pertenecer a un programa');
        }
        if (!this.actorId) {
            throw new ValidacionError('El personaje debe tener un actor que lo interprete');
        }
    }

    actualizar({ nombre, actorId }) {
        if (nombre !== undefined) this.nombre = texto(nombre);
        if (actorId !== undefined) this.actorId = aObjectId(actorId, 'id del actor');
        this.actualizadoEn = new Date();
        this.verificar();
        return this;
    }

    perteneceA(programaId) {
        const otro = aObjectId(programaId, 'id del programa');
        return Boolean(this.programaId && otro && this.programaId.equals(otro));
    }

    esInterpretadoPor(actorId) {
        const otro = aObjectId(actorId, 'id del actor');
        return Boolean(this.actorId && otro && this.actorId.equals(otro));
    }

    aDocumento() {
        return {
            nombre: this.nombre,
            programaId: this.programaId,
            actorId: this.actorId,
            creadoEn: this.creadoEn,
            actualizadoEn: this.actualizadoEn
        };
    }

    aPublico() {
        return {
            id: aTexto(this.id),
            nombre: this.nombre,
            programaId: aTexto(this.programaId),
            actorId: aTexto(this.actorId),
            creadoEn: this.creadoEn,
            actualizadoEn: this.actualizadoEn
        };
    }
}
