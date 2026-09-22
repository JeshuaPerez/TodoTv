export function texto(valor) {
    return valor === null || valor === undefined ? '' : String(valor).trim();
}

export function fecha(valor) {
    if (!valor) return null;
    const convertida = valor instanceof Date ? valor : new Date(valor);
    return Number.isNaN(convertida.getTime()) ? null : convertida;
}

export function entero(valor) {
    const convertido = Number.parseInt(valor, 10);
    return Number.isNaN(convertido) ? null : convertido;
}
