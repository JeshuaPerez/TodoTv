import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const CARPETA_BACKEND = fileURLToPath(new URL('../../backend/', import.meta.url));
const PUERTO_API = 3999;

const resultados = [];

async function prueba(nombre, funcion) {
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

function grupo(nombre) {
    console.log('\n' + nombre);
}

function igual(obtenido, esperado, mensaje = 'Valor inesperado') {
    if (obtenido !== esperado) {
        throw new Error(mensaje + ': esperaba ' + JSON.stringify(esperado) + ' y llegó ' + JSON.stringify(obtenido));
    }
}

function verdadero(condicion, mensaje = 'La condición no se cumplió') {
    if (!condicion) throw new Error(mensaje);
}

async function fallaCon(funcion, codigo) {
    try {
        await funcion();
    } catch (error) {
        igual(error.codigo, codigo, 'Código de error inesperado');
        return error;
    }
    throw new Error('Se esperaba un error con código ' + codigo + ' y no falló');
}

// ---- backend de demostración ----------------------------------------------

console.log('Levantando la API de demostración (MongoDB en memoria)…');
const backend = spawn(process.execPath, ['scripts/demo.js'], {
    cwd: CARPETA_BACKEND,
    // INIT_CWD lo pone npm y mongodb-memory-server lo usa para ubicar su caché:
    // sin corregirlo, el proceso hijo se bajaría el binario de Mongo otra vez
    env: { ...process.env, INIT_CWD: CARPETA_BACKEND, PUERTO: String(PUERTO_API) }
});
let salidaBackend = '';
backend.stdout.on('data', (dato) => { salidaBackend += dato; });
backend.stderr.on('data', (dato) => { salidaBackend += dato; });

async function esperarApi() {
    for (let intento = 0; intento < 60; intento += 1) {
        try {
            const respuesta = await fetch('http://127.0.0.1:' + PUERTO_API + '/api/programas');
            if (respuesta.ok) return;
        } catch { /* todavía no */ }
        await new Promise((listo) => setTimeout(listo, 500));
    }
    throw new Error('la API no arrancó\n' + salidaBackend);
}
await esperarApi();

// ---- servidor de la interfaz ----------------------------------------------

process.env.NO_ARRANCAR = '1';
process.env.API_DESTINO = 'http://127.0.0.1:' + PUERTO_API;
const { servidor } = await import('../servidor.js');

servidor.listen(0);
await new Promise((listo) => servidor.once('listening', listo));
const RAIZ = 'http://127.0.0.1:' + servidor.address().port;
console.log('Interfaz en ' + RAIZ + ', proxy hacia ' + process.env.API_DESTINO);

// ---- el navegador guarda las cookies solo; acá hay que imitarlo ------------

const galletas = new Map();
const fetchOriginal = globalThis.fetch;

globalThis.fetch = async (recurso, opciones = {}) => {
    const cabeceras = new Headers(opciones.headers ?? {});
    const cookie = [...galletas].map(([nombre, valor]) => nombre + '=' + valor).join('; ');
    if (cookie) cabeceras.set('cookie', cookie);

    const respuesta = await fetchOriginal(recurso, { ...opciones, headers: cabeceras });
    for (const cruda of respuesta.headers.getSetCookie()) {
        const par = cruda.split(';')[0];
        const corte = par.indexOf('=');
        const nombre = par.slice(0, corte).trim();
        const valor = par.slice(corte + 1).trim();
        if (valor === '') galletas.delete(nombre);
        else galletas.set(nombre, valor);
    }
    return respuesta;
};

// el módulo real de la interfaz, apuntado al servidor de pruebas
const { CONFIGURACION } = await import('../src/js/nucleo/configuracion.js');
CONFIGURACION.api = RAIZ + '/api';

const { api } = await import('../src/js/nucleo/api.js');
const { escuchar, versionDeLaApi, ErrorApi } = await import('../src/js/nucleo/peticiones.js');

grupo('Servidor de la interfaz');

await prueba('sirve el index en la raíz', async () => {
    const respuesta = await fetchOriginal(RAIZ + '/');
    igual(respuesta.status, 200);
    verdadero(respuesta.headers.get('content-type').includes('text/html'), 'no llegó como HTML');

    const cuerpo = await respuesta.text();
    verdadero(cuerpo.includes('id="contenido"'), 'falta el contenedor de las vistas');
    verdadero(cuerpo.includes('type="module"'), 'el script no se carga como módulo');
});

await prueba('sirve las tres hojas de estilo', async () => {
    for (const hoja of ['base', 'componentes', 'vistas']) {
        const respuesta = await fetchOriginal(RAIZ + '/css/' + hoja + '.css');
        igual(respuesta.status, 200, 'no se sirve ' + hoja + '.css');
        verdadero(respuesta.headers.get('content-type').includes('text/css'), hoja + '.css no llega como CSS');
    }
});

await prueba('sirve todos los módulos y ningún import queda roto', async () => {
    const { readdir, readFile } = await import('node:fs/promises');
    const { join, dirname, resolve, relative, sep } = await import('node:path');
    const carpeta = fileURLToPath(new URL('../src/', import.meta.url));

    const entradas = await readdir(carpeta, { withFileTypes: true, recursive: true });
    const modulos = entradas
        .filter((entrada) => entrada.isFile() && entrada.name.endsWith('.js'))
        .map((entrada) => join(entrada.parentPath ?? entrada.path, entrada.name));
    verdadero(modulos.length >= 15, 'se esperaban más módulos, se encontraron ' + modulos.length);

    const aRuta = (absoluta) => '/' + relative(carpeta, absoluta).split(sep).join('/');
    const rotos = [];

    for (const modulo of modulos) {
        const respuesta = await fetchOriginal(RAIZ + aRuta(modulo));
        igual(respuesta.status, 200, 'no se sirve ' + aRuta(modulo));
        verdadero(respuesta.headers.get('content-type').includes('javascript'), aRuta(modulo) + ' no llega como JavaScript');

        const codigo = await readFile(modulo, 'utf8');
        for (const [, especificador] of codigo.matchAll(/from\s+'(\.[^']+)'/g)) {
            const destino = resolve(dirname(modulo), especificador);
            const apuntado = await fetchOriginal(RAIZ + aRuta(destino));
            if (apuntado.status !== 200) rotos.push(aRuta(modulo) + ' -> ' + especificador);
        }
    }
    igual(rotos.length, 0, 'imports rotos: ' + rotos.join(', '));
});

await prueba('una ruta del enrutador cae en el index y un archivo inexistente da 404', async () => {
    const ruta = await fetchOriginal(RAIZ + '/favoritos');
    igual(ruta.status, 200);
    verdadero((await ruta.text()).includes('id="contenido"'), 'no devolvió el index');

    const archivo = await fetchOriginal(RAIZ + '/js/no-existe.js');
    igual(archivo.status, 404, 'un módulo inexistente debería dar 404, no el index');
});

await prueba('la documentación de Swagger llega a través del proxy', async () => {
    const respuesta = await fetchOriginal(RAIZ + '/api/docs/');
    igual(respuesta.status, 200);
});

grupo('Sesión con cookie a través del proxy');

await prueba('sin sesión el perfil falla y el catálogo se lee igual', async () => {
    await fallaCon(() => api.autenticacion.perfil(), 'NO_AUTENTICADO');
    const programas = await api.programas.listar();
    verdadero(programas.length >= 3, 'la semilla debería haber dejado programas');
});

await prueba('el inicio de sesión guarda la cookie httpOnly', async () => {
    const usuario = await api.autenticacion.inicioSesion({
        correo: 'admin@todotv.test',
        contrasena: 'Admin1234'
    });
    igual(usuario.rol, 'administrador');
    verdadero(!('contrasena' in usuario), 'la contraseña salió en la respuesta');
    verdadero(galletas.has('todotv_token'), 'la cookie no atravesó el proxy');
});

await prueba('el perfil responde con la cookie puesta', async () => {
    const perfil = await api.autenticacion.perfil();
    igual(perfil.correo, 'admin@todotv.test');
});

await prueba('la interfaz conoce la versión que anuncia la API', async () => {
    igual(versionDeLaApi(), '1.0.0');
});

grupo('Catálogo');

const catalogo = {};

await prueba('lista, filtra por categoría y busca por texto', async () => {
    const categorias = await api.categorias.listar();
    igual(categorias.length, 3);
    catalogo.categoria = categorias.find((categoria) => categoria.nombre === 'anime');

    const porCategoria = await api.programas.listar({ categoria: catalogo.categoria.id });
    verdadero(porCategoria.length > 1, 'esperaba varios animes en el catálogo');
    catalogo.programa = porCategoria.find((programa) => programa.titulo === 'Dragon Ball');
    verdadero(catalogo.programa !== undefined, 'no se encontró Dragon Ball entre los animes');

    const porTexto = await api.programas.listar({ texto: 'adventure' });
    igual(porTexto.length, 1);
    igual((await api.programas.listar({ texto: 'zzzz' })).length, 0);
});

await prueba('el detalle trae categoría, productora, capítulos y reparto', async () => {
    const programa = await api.programas.obtener(catalogo.programa.id);
    igual(programa.categoria.nombre, 'anime');
    verdadero(programa.productora !== null, 'falta la productora');
    verdadero(programa.capitulos.length >= 3, 'faltan capítulos');
    verdadero(programa.reparto.length >= 2, 'falta el reparto');
    verdadero(programa.reparto[0].actor !== null, 'el reparto no resolvió el actor');
});

await prueba('los endpoints de capítulos y reparto del programa responden', async () => {
    const capitulos = await api.programas.capitulos(catalogo.programa.id);
    const reparto = await api.programas.personajes(catalogo.programa.id);
    verdadero(capitulos.length >= 3, 'faltan capítulos');
    igual(capitulos[0].etiqueta, 'T1E01');
    verdadero(reparto.every((personaje) => personaje.actor !== null), 'algún personaje quedó sin actor');
});

await prueba('los actores se listan, se filtran y traen su ficha', async () => {
    const todos = await api.actores.listar();
    igual(todos.length, 4);

    const filtrados = await api.actores.listar({ texto: 'nozawa' });
    igual(filtrados.length, 1);

    const ficha = await api.actores.obtener(filtrados[0].id);
    verdadero(ficha.edad > 80, 'no llegó la edad calculada');
    verdadero(ficha.personajes.length >= 1, 'la ficha no trae personajes');
    verdadero(ficha.personajes[0].programa !== null, 'el personaje no resolvió su programa');
});

await prueba('las productoras se listan con su país y año', async () => {
    const productoras = await api.productoras.listar();
    igual(productoras.length, 16);
    verdadero(productoras.every((productora) => productora.pais && productora.anioFundacion), 'faltan datos');
    catalogo.productora = productoras[0];
});

grupo('Favoritos');

await prueba('marcar, listar, no duplicar y quitar', async () => {
    const programaId = catalogo.programa.id;

    igual((await api.favoritos.listar()).length, 0);
    igual((await api.favoritos.agregar(programaId)).length, 1);
    igual((await api.favoritos.agregar(programaId)).length, 1, 'se duplicó el favorito');

    const perfil = await api.autenticacion.perfil();
    igual(perfil.favoritos.length, 1);

    igual((await api.favoritos.quitar(programaId)).length, 0);
});

await prueba('un programa inexistente no se puede marcar', async () => {
    await fallaCon(() => api.favoritos.agregar('000000000000000000000000'), 'NO_ENCONTRADO');
});

grupo('Panel de administración');

const creados = {};

await prueba('el administrador da de alta una categoría y una productora', async () => {
    creados.categoria = await api.categorias.crear({ nombre: 'documentales', descripcion: 'Cine de lo real' });
    creados.productora = await api.productoras.crear({ nombre: 'Estudio Prueba', pais: 'Argentina', anioFundacion: 2001 });
    igual(creados.categoria.nombre, 'documentales');
    igual(creados.productora.anioFundacion, 2001);
});

await prueba('crea un programa con sus capítulos iniciales en una transacción', async () => {
    creados.programa = await api.programas.crear({
        titulo: 'Programa de prueba',
        sinopsis: 'Una sinopsis suficientemente larga para pasar la validación.',
        poster: 'https://picsum.photos/seed/prueba/300/450',
        trailer: 'https://ejemplo.com/trailer.mp4',
        categoriaId: creados.categoria.id,
        productoraId: creados.productora.id,
        capitulos: [
            { temporada: '1', numero: '1', titulo: 'Piloto', duracionMinutos: '30' },
            { temporada: '1', numero: '2', titulo: 'Segundo', duracionMinutos: '30' }
        ]
    });
    igual(creados.programa.capitulos.length, 2);
    igual(creados.programa.capitulos[1].etiqueta, 'T1E02');
});

await prueba('si un capítulo inicial choca, no se guarda nada', async () => {
    await fallaCon(() => api.programas.crear({
        titulo: 'Programa que no debe quedar',
        sinopsis: 'Otra sinopsis suficientemente larga para validar.',
        poster: 'https://picsum.photos/seed/roto/300/450',
        trailer: 'https://ejemplo.com/roto.mp4',
        categoriaId: creados.categoria.id,
        productoraId: creados.productora.id,
        capitulos: [
            { temporada: '1', numero: '1', titulo: 'Uno', duracionMinutos: '20' },
            { temporada: '1', numero: '1', titulo: 'Uno otra vez', duracionMinutos: '20' }
        ]
    }), 'DUPLICADO');

    const encontrados = await api.programas.listar({ texto: 'no debe quedar' });
    igual(encontrados.length, 0, 'el programa quedó a medio crear');
});

await prueba('agrega un capítulo suelto y un personaje', async () => {
    creados.actor = await api.actores.crear({
        nombre: 'Actor de prueba',
        nacionalidad: 'Uruguaya',
        fechaNacimiento: '1980-03-15',
        foto: 'https://picsum.photos/seed/actor/300/300'
    });
    creados.capitulo = await api.capitulos.crear({
        programaId: creados.programa.id,
        temporada: '2',
        numero: '1',
        titulo: 'Vuelve el programa',
        duracionMinutos: '31',
        fechaEstreno: '2024-05-05'
    });
    creados.personaje = await api.personajes.crear({
        nombre: 'Protagonista',
        programaId: creados.programa.id,
        actorId: creados.actor.id
    });
    igual(creados.capitulo.etiqueta, 'T2E01');
    igual(creados.personaje.nombre, 'Protagonista');
});

await prueba('edita y respeta las reglas de negocio', async () => {
    const editado = await api.programas.actualizar(creados.programa.id, { titulo: 'Programa de prueba editado' });
    igual(editado.titulo, 'Programa de prueba editado');

    await fallaCon(() => api.capitulos.crear({
        programaId: creados.programa.id,
        temporada: '2',
        numero: '1',
        titulo: 'Repetido',
        duracionMinutos: '31'
    }), 'DUPLICADO');

    await fallaCon(() => api.personajes.crear({
        nombre: 'Protagonista',
        programaId: creados.programa.id,
        actorId: creados.actor.id
    }), 'DUPLICADO');

    await fallaCon(() => api.categorias.borrar(creados.categoria.id), 'EN_USO');
    await fallaCon(() => api.actores.borrar(creados.actor.id), 'EN_USO');
});

await prueba('borrar el programa arrastra capítulos y personajes', async () => {
    await api.programas.borrar(creados.programa.id);
    await fallaCon(() => api.programas.obtener(creados.programa.id), 'NO_ENCONTRADO');
    await fallaCon(() => api.capitulos.obtener(creados.capitulo.id), 'NO_ENCONTRADO');
    await fallaCon(() => api.personajes.obtener(creados.personaje.id), 'NO_ENCONTRADO');

    // ya sin programas encima, estos sí se pueden borrar
    await api.actores.borrar(creados.actor.id);
    await api.categorias.borrar(creados.categoria.id);
    await api.productoras.borrar(creados.productora.id);
});

grupo('Manejo de errores del cliente');

await prueba('un error de validación llega con el detalle por campo', async () => {
    const error = await fallaCon(() => api.actores.crear({ nombre: 'A', nacionalidad: '', fechaNacimiento: 'ayer' }), 'VALIDACION');
    verdadero(error instanceof ErrorApi, 'no es un ErrorApi');

    const campos = error.porCampo();
    verdadero(campos.has('nombre'), 'el detalle no menciona el nombre');
    verdadero(campos.has('fechaNacimiento'), 'el detalle no menciona la fecha');
    verdadero(error.resumen().length > 0, 'el resumen quedó vacío');
});

await prueba('un id mal formado da 400 y uno inexistente 404', async () => {
    const malo = await fallaCon(() => api.programas.obtener('abc'), 'VALIDACION');
    igual(malo.estado, 400);

    const ausente = await fallaCon(() => api.programas.obtener('000000000000000000000000'), 'NO_ENCONTRADO');
    igual(ausente.estado, 404);
});

await prueba('una versión incompatible avisa por su señal', async () => {
    let avisada = null;
    const dejarDeEscuchar = escuchar('version-incompatible', (error) => { avisada = error; });

    CONFIGURACION.version = '2.x';
    await fallaCon(() => api.programas.listar(), 'VERSION_NO_COMPATIBLE');
    CONFIGURACION.version = '1.x';
    dejarDeEscuchar();

    verdadero(avisada !== null, 'la señal no se emitió');
    igual(avisada.detalles.versionApi, '1.0.0');
});

await prueba('el 401 de una ruta protegida emite la señal de sesión perdida', async () => {
    let perdida = false;
    const dejarDeEscuchar = escuchar('sesion-perdida', () => { perdida = true; });

    await api.autenticacion.cierreSesion();
    verdadero(!galletas.has('todotv_token'), 'la cookie no se limpió al cerrar sesión');

    await fallaCon(() => api.favoritos.listar(), 'NO_AUTENTICADO');
    dejarDeEscuchar();
    verdadero(perdida, 'no se emitió sesion-perdida');
});

await prueba('un usuario común no puede tocar el catálogo', async () => {
    await api.autenticacion.inicioSesion({ correo: 'demo@todotv.test', contrasena: 'Demo1234' });
    await fallaCon(() => api.categorias.crear({ nombre: 'prohibida' }), 'NO_AUTORIZADO');
    await api.autenticacion.cierreSesion();
});

grupo('La API se cae');

await prueba('el proxy responde 502 cuando la API no está', async () => {
    backend.kill('SIGTERM');
    await new Promise((listo) => backend.once('exit', listo));

    const error = await fallaCon(() => api.programas.listar(), 'API_INALCANZABLE');
    igual(error.estado, 502);
});

await prueba('la interfaz se sigue sirviendo con la API caída', async () => {
    const respuesta = await fetchOriginal(RAIZ + '/');
    igual(respuesta.status, 200);
    verdadero((await respuesta.text()).includes('id="contenido"'), 'no devolvió el index');
});

grupo('Plantillas y formato');

await prueba('el escapado neutraliza el HTML que venga de la base', async () => {
    const { escapar, html } = await import('../src/js/nucleo/plantilla.js');

    const salida = escapar('<img src=x onerror="alert(1)">');
    verdadero(!salida.includes('<img'), 'quedó una etiqueta viva');
    igual(escapar('a & b'), 'a &amp; b');

    const armado = html`<h1>${'<script>alert(1)</script>'}</h1>`;
    verdadero(!armado.texto.includes('<script>'), 'el script entró sin escapar');
});

await prueba('anidar plantillas no escapa dos veces', async () => {
    const { html } = await import('../src/js/nucleo/plantilla.js');

    const fila = html`<li>${'Tom & Jerry'}</li>`;
    const lista = html`<ul>${[fila, fila]}</ul>`;
    igual(lista.texto, '<ul><li>Tom &amp; Jerry</li><li>Tom &amp; Jerry</li></ul>');
});

await prueba('una tarjeta con título malicioso no inyecta nada', async () => {
    const { tarjetaPrograma } = await import('../src/js/componentes/tarjetas.js');

    const salida = tarjetaPrograma({
        id: '000000000000000000000001',
        titulo: '<script>robar()</script>',
        poster: 'https://ejemplo.com/p.jpg',
        categoria: { nombre: 'anime' }
    }, { favorito: true, conBoton: true }).texto;

    verdadero(!salida.includes('<script>'), 'el título entró sin escapar');
    verdadero(salida.includes('es-favorito'), 'no se marcó el favorito');
    verdadero(salida.includes('#/programa/000000000000000000000001'), 'falta el enlace al detalle');
});

await prueba('las fechas, duraciones y plurales salen en español', async () => {
    const { fecha, duracion, plural } = await import('../src/js/nucleo/formato.js');

    igual(duracion(24), '24 min');
    igual(duracion(90), '1 h 30 min');
    igual(duracion(120), '2 h');
    igual(plural(1, 'capítulo', 'capítulos'), '1 capítulo');
    igual(plural(3, 'capítulo', 'capítulos'), '3 capítulos');
    igual(fecha(null), '');
    verdadero(fecha('1986-02-26').includes('1986'), 'la fecha no se formateó');
});

await prueba('los campos del formulario salen con sus atributos de verdad', async () => {
    const { campos } = await import('../src/js/componentes/formulario.js');

    const definiciones = [
        { nombre: 'anioFundacion', etiqueta: 'Año', tipo: 'numero', requerido: true, minimo: 1888 },
        { nombre: 'programaId', etiqueta: 'Programa', tipo: 'seleccion', requerido: true, soloAlCrear: true,
          valores: [{ valor: 'a1', texto: 'Dragon Ball' }] }
    ];

    const alta = definiciones.map((definicion) => campos([definicion], null, { edicion: false })[0].texto).join('');
    // si el mínimo se arma como texto suelto, las comillas se escapan y el atributo no existe
    verdadero(alta.includes('min="1888"'), 'el atributo min salió escapado: ' + alta.slice(0, 200));
    verdadero(alta.includes('required'), 'falta el required');

    const edicion = campos([definiciones[1]], { programaId: 'a1' }, { edicion: true })[0].texto;
    verdadero(edicion.includes('disabled'), 'el campo soloAlCrear debería quedar bloqueado al editar');
    verdadero(!edicion.includes('required'), 'un campo bloqueado no puede ser requerido');
    verdadero(edicion.includes('value="a1" selected'), 'no quedó seleccionada la opción actual');
});

await prueba('los valores hostiles no escapan del atributo', async () => {
    const { campos } = await import('../src/js/componentes/formulario.js');
    const { tarjetaPrograma } = await import('../src/js/componentes/tarjetas.js');

    // escapado, el atributo queda como onfocus=&quot;: inofensivo.
    // el peligro sería que sobreviviera una comilla de verdad
    const campo = campos([{ nombre: 'titulo', etiqueta: 'Título', tipo: 'texto' }],
        { titulo: '" onfocus="robar()' }, {})[0].texto;
    verdadero(!campo.includes('onfocus="'), 'el valor se escapó del atributo: ' + campo);
    verdadero(campo.includes('&quot;'), 'las comillas no se escaparon');

    const tarjeta = tarjetaPrograma({ id: 'x', titulo: 'T', poster: '" onerror="robar()' }, {}).texto;
    verdadero(!tarjeta.includes('onerror="'), 'el poster se escapó del atributo: ' + tarjeta);
});

await prueba('el formulario y sus enganches usan los mismos nombres', async () => {
    const { campos } = await import('../src/js/componentes/formulario.js');
    const codigo = await (await import('node:fs/promises')).readFile('src/js/componentes/formulario.js', 'utf8');

    const salida = campos([{
        nombre: 'capitulos',
        etiqueta: 'Capítulos iniciales',
        tipo: 'lista',
        soloAlCrear: true,
        subcampos: [{ nombre: 'numero', etiqueta: 'Nº', tipo: 'numero' }]
    }], null, { edicion: false })[0].texto;

    // conectarListas y leerValores buscan por estos selectores
    for (const enganche of ['data-lista="capitulos"', 'lista-campos__filas', 'data-agregar-fila']) {
        verdadero(salida.includes(enganche), 'falta el enganche ' + enganche);
        verdadero(codigo.includes(enganche.split('=')[0]), 'nadie busca ' + enganche);
    }
});

const fallidas = resultados.filter((resultado) => !resultado.ok);
console.log('\n' + '-'.repeat(52));
console.log(resultados.length - fallidas.length + ' pasadas, ' + fallidas.length + ' fallidas');
if (fallidas.length > 0) {
    console.log('\nFallaron:');
    for (const fallo of fallidas) console.log('  - ' + fallo.nombre + ': ' + fallo.error.message);
}

servidor.close();
if (!backend.killed) backend.kill('SIGTERM');
process.exit(fallidas.length > 0 ? 1 : 0);
