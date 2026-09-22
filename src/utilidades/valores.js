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

// "2h" -> 7200000. Acepta s, m, h, d o un número de segundos.
export function duracionAMilisegundos(duracion) {
    const coincidencia = String(duracion).trim().match(/^(\d+)\s*([smhd])?$/);
    if (!coincidencia) return null;
    const cantidad = Number(coincidencia[1]);
    const unidades = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    return cantidad * (unidades[coincidencia[2] ?? 's']);
}
