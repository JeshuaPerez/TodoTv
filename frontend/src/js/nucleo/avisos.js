let zona = null;

function contenedor() {
    if (!zona) {
        zona = document.createElement('div');
        zona.className = 'avisos';
        document.body.append(zona);
    }
    return zona;
}

export function avisar(mensaje, tipo = 'exito') {
    const aviso = document.createElement('div');
    aviso.className = 'aviso aviso--' + tipo;
    aviso.setAttribute('role', tipo === 'error' ? 'alert' : 'status');
    aviso.textContent = mensaje;
    contenedor().append(aviso);

    requestAnimationFrame(() => aviso.classList.add('aviso--visible'));
    setTimeout(() => {
        aviso.classList.remove('aviso--visible');
        setTimeout(() => aviso.remove(), 300);
    }, 3800);
}
