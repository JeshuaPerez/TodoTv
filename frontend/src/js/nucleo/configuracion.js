// Si algún día la interfaz se publica en otro dominio que el de la API, se define
// window.TODOTV = { api: 'https://…' } en el index y hay que pasar la cookie del
// backend a sameSite 'none' con secure. Mientras el servidor de esta carpeta haga
// de proxy, todo queda en el mismo origen y la cookie strict funciona sola.
const propia = globalThis.TODOTV ?? {};

export const CONFIGURACION = {
    nombre: 'TodoTv',
    api: propia.api ?? '/api',
    // rango semver que este cliente sabe leer, va en Accept-Version
    version: propia.version ?? '1.x'
};
