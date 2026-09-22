export class ClienteHttp {
    constructor(base, version = null) {
        this.base = base;
        this.version = version;
        this.cookies = new Map();
    }

    // el navegador guarda la cookie solo; acá hay que hacerlo a mano
    guardarCookies(respuesta) {
        for (const cruda of respuesta.headers.getSetCookie()) {
            const par = cruda.split(';')[0];
            const corte = par.indexOf('=');
            const nombre = par.slice(0, corte).trim();
            const valor = par.slice(corte + 1).trim();
            if (valor === '') this.cookies.delete(nombre);
            else this.cookies.set(nombre, valor);
        }
    }

    tieneCookie(nombre) {
        return this.cookies.has(nombre);
    }

    async peticion(metodo, ruta, cuerpo = null, cabeceras = {}) {
        const opciones = { method: metodo, headers: { ...cabeceras } };
        if (this.version && !('Accept-Version' in opciones.headers)) {
            opciones.headers['Accept-Version'] = this.version;
        }
        if (cuerpo !== null) {
            opciones.headers['Content-Type'] = 'application/json';
            opciones.body = typeof cuerpo === 'string' ? cuerpo : JSON.stringify(cuerpo);
        }
        const cookies = [...this.cookies].map(([nombre, valor]) => nombre + '=' + valor).join('; ');
        if (cookies) opciones.headers.Cookie = cookies;

        const respuesta = await fetch(this.base + ruta, opciones);
        this.guardarCookies(respuesta);

        const texto = await respuesta.text();
        let datos = null;
        if (texto) {
            try { datos = JSON.parse(texto); } catch { datos = texto; }
        }
        return { estado: respuesta.status, datos, cabeceras: respuesta.headers };
    }

    get(ruta, cabeceras) { return this.peticion('GET', ruta, null, cabeceras); }
    post(ruta, cuerpo, cabeceras) { return this.peticion('POST', ruta, cuerpo, cabeceras); }
    put(ruta, cuerpo, cabeceras) { return this.peticion('PUT', ruta, cuerpo, cabeceras); }
    borrar(ruta, cabeceras) { return this.peticion('DELETE', ruta, null, cabeceras); }
}

export function igual(obtenido, esperado, mensaje = 'Valor inesperado') {
    if (obtenido !== esperado) {
        throw new Error(mensaje + ': esperaba ' + JSON.stringify(esperado) + ' y llegó ' + JSON.stringify(obtenido));
    }
}

export function verdadero(condicion, mensaje = 'La condición no se cumplió') {
    if (!condicion) throw new Error(mensaje);
}

export function estado(respuesta, esperado, mensaje = 'Estado HTTP inesperado') {
    if (respuesta.estado !== esperado) {
        const detalle = JSON.stringify(respuesta.datos);
        throw new Error(mensaje + ': esperaba ' + esperado + ' y llegó ' + respuesta.estado + ' con ' + detalle);
    }
}

export function codigoError(respuesta, esperado) {
    igual(respuesta.datos?.error?.codigo, esperado, 'Código de error inesperado');
}

export function crearRegistro() {
    const resultados = [];
    return {
        resultados,
        grupo(nombre) {
            console.log('\n' + nombre);
        },
        async prueba(nombre, funcion) {
            try {
                await funcion();
                resultados.push({ nombre, ok: true });
                console.log('  ok    ' + nombre);
            } catch (error) {
                resultados.push({ nombre, ok: false, error });
                console.log('  FALLA ' + nombre);
                console.log('        ' + error.message);
            }
        }
    };
}
