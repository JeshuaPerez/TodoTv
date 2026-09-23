const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const MARCA = Symbol('html');

export function escapar(valor) {
    return String(valor).replace(/[&<>"']/g, (caracter) => ESCAPES[caracter]);
}

// envuelve HTML ya armado para que no se vuelva a escapar al anidarlo
export function crudo(texto) {
    return { [MARCA]: true, texto: String(texto) };
}

function resolver(valor) {
    if (valor === null || valor === undefined || valor === false) return '';
    if (Array.isArray(valor)) return valor.map(resolver).join('');
    if (typeof valor === 'object' && valor[MARCA]) return valor.texto;
    return escapar(valor);
}

// html`<h1>${titulo}</h1>` escapa titulo solo: no hace falta acordarse de hacerlo
export function html(partes, ...valores) {
    const armado = partes.reduce((acumulado, parte, indice) => acumulado + resolver(valores[indice - 1]) + parte);
    return crudo(armado);
}

export function pintar(elemento, contenido) {
    elemento.innerHTML = resolver(contenido);
    return elemento;
}

export function agregar(elemento, contenido) {
    elemento.insertAdjacentHTML('beforeend', resolver(contenido));
    return elemento;
}
