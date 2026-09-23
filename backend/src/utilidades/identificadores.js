import { ObjectId } from 'mongodb';
import { ValidacionError } from '../errores/index.js';

export function esObjectIdValido(valor) {
    return ObjectId.isValid(valor) && String(new ObjectId(valor)) === String(valor);
}

export function aObjectId(valor, campo = 'identificador') {
    if (valor === null || valor === undefined || valor === '') return null;
    if (valor instanceof ObjectId) return valor;
    if (!esObjectIdValido(valor)) {
        throw new ValidacionError(`El ${campo} no es válido`);
    }
    return new ObjectId(valor);
}

export function aTexto(identificador) {
    return identificador ? identificador.toString() : null;
}
