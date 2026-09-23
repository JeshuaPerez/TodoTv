export function navegar(ruta) {
    if (location.hash === ruta) {
        window.dispatchEvent(new HashChangeEvent('hashchange'));
        return;
    }
    location.hash = ruta;
}

export function partesDeRuta() {
    const limpia = location.hash.replace(/^#\/?/, '');
    return limpia ? limpia.split('/') : [];
}
