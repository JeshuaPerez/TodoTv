const FECHA = new Intl.DateTimeFormat('es', { day: '2-digit', month: 'short', year: 'numeric' });

export function fecha(valor) {
    if (!valor) return '';
    const convertida = new Date(valor);
    return Number.isNaN(convertida.getTime()) ? '' : FECHA.format(convertida);
}

export function duracion(minutos) {
    if (!minutos) return '';
    if (minutos < 60) return minutos + ' min';
    const horas = Math.floor(minutos / 60);
    const resto = minutos % 60;
    return resto === 0 ? horas + ' h' : horas + ' h ' + resto + ' min';
}

export function plural(cantidad, singular, muchos) {
    return cantidad === 1 ? '1 ' + singular : cantidad + ' ' + muchos;
}
