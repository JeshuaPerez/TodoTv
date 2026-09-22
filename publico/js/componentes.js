const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

// todo lo que viene de la base pasa por acá antes de entrar al HTML
export function escapar(valor) {
    return String(valor ?? '').replace(/[&<>"']/g, (caracter) => ESCAPES[caracter]);
}

export function vistaCarga(mensaje = 'Cargando…') {
    return '<div class="estado"><span class="girador"></span>' + escapar(mensaje) + '</div>';
}

export function vistaVacio(mensaje, detalle = '') {
    return '<div class="estado estado--vacio"><p class="estado__titulo">' + escapar(mensaje) + '</p>' +
        (detalle ? '<p class="estado__detalle">' + escapar(detalle) + '</p>' : '') + '</div>';
}

export function vistaError(mensaje, { reintentar = true } = {}) {
    return '<div class="estado estado--error"><p class="estado__titulo">' + escapar(mensaje) + '</p>' +
        (reintentar ? '<button class="boton" data-accion="reintentar">Reintentar</button>' : '') + '</div>';
}

export function tarjetaPrograma(programa, { favorito = false, mostrarBoton = false } = {}) {
    const categoria = programa.categoria?.nombre ?? '';
    return '<article class="tarjeta">' +
        '<a class="tarjeta__enlace" href="#/programa/' + escapar(programa.id) + '">' +
        '<img class="tarjeta__poster" src="' + escapar(programa.poster) + '" alt="Poster de ' + escapar(programa.titulo) + '" loading="lazy">' +
        '<div class="tarjeta__cuerpo">' +
        (categoria ? '<span class="etiqueta">' + escapar(categoria) + '</span>' : '') +
        '<h3 class="tarjeta__titulo">' + escapar(programa.titulo) + '</h3>' +
        '</div></a>' +
        (mostrarBoton
            ? '<button class="boton boton--favorito' + (favorito ? ' es-favorito' : '') + '" data-favorito="' +
              escapar(programa.id) + '" title="' + (favorito ? 'Quitar de favoritos' : 'Marcar como favorito') + '">' +
              (favorito ? '★' : '☆') + '</button>'
            : '') +
        '</article>';
}

export function rejilla(programas, { mostrarBoton = false, esFavorito = () => false } = {}) {
    const tarjetas = programas.map((programa) => tarjetaPrograma(programa, {
        mostrarBoton,
        favorito: esFavorito(programa)
    }));
    return '<div class="rejilla">' + tarjetas.join('') + '</div>';
}

let temporizadorAviso = null;

export function avisar(mensaje, tipo = 'exito') {
    let aviso = document.querySelector('.aviso');
    if (!aviso) {
        aviso = document.createElement('div');
        aviso.className = 'aviso';
        document.body.append(aviso);
    }
    aviso.textContent = mensaje;
    aviso.dataset.tipo = tipo;
    aviso.classList.add('aviso--visible');

    clearTimeout(temporizadorAviso);
    temporizadorAviso = setTimeout(() => aviso.classList.remove('aviso--visible'), 3500);
}

export function detallesDeError(error) {
    if (!Array.isArray(error?.detalles)) return error?.message ?? 'Ocurrió un error';
    return error.detalles.map((detalle) => detalle.mensaje).join(' · ');
}
