import { readdir, readFile } from 'node:fs/promises';
import { join, dirname, resolve, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { igual, verdadero } from '../ayudas.js';

const CARPETA = fileURLToPath(new URL('../../../publico/', import.meta.url));

async function archivos(carpeta, extension) {
    const entradas = await readdir(carpeta, { withFileTypes: true, recursive: true });
    return entradas
        .filter((entrada) => entrada.isFile() && entrada.name.endsWith(extension))
        .map((entrada) => join(entrada.parentPath ?? entrada.path, entrada.name));
}

const aRuta = (absoluta) => '/' + relative(CARPETA, absoluta).split(sep).join('/');

export async function pruebasFrontend(registro, contexto) {
    const pedir = (ruta) => fetch(contexto.raiz + ruta);

    await registro.prueba('el servidor sirve el index del frontend', async () => {
        const respuesta = await pedir('/');
        igual(respuesta.status, 200);
        verdadero(respuesta.headers.get('content-type').includes('text/html'), 'no llegó como HTML');

        const cuerpo = await respuesta.text();
        verdadero(cuerpo.includes('id="contenido"'), 'falta el contenedor de las vistas');
        verdadero(cuerpo.includes('type="module"'), 'el script no se carga como módulo');
    });

    await registro.prueba('la hoja de estilos se sirve como CSS', async () => {
        const respuesta = await pedir('/css/estilos.css');
        igual(respuesta.status, 200);
        verdadero(respuesta.headers.get('content-type').includes('text/css'), 'no llegó como CSS');
    });

    await registro.prueba('todos los módulos del frontend se sirven como JavaScript', async () => {
        const modulos = await archivos(CARPETA, '.js');
        verdadero(modulos.length >= 10, 'se esperaban más módulos, se encontraron ' + modulos.length);

        for (const modulo of modulos) {
            const respuesta = await pedir(aRuta(modulo));
            igual(respuesta.status, 200, 'no se sirve ' + aRuta(modulo));
            verdadero(
                respuesta.headers.get('content-type').includes('javascript'),
                aRuta(modulo) + ' no llega con un tipo de JavaScript'
            );
        }
    });

    // sin proceso de build, un import mal escrito recién se ve en el navegador
    await registro.prueba('ningún import relativo apunta a un archivo que no existe', async () => {
        const modulos = await archivos(CARPETA, '.js');
        const rotos = [];

        for (const modulo of modulos) {
            const codigo = await readFile(modulo, 'utf8');
            const especificadores = [...codigo.matchAll(/from\s+'(\.[^']+)'/g)].map((coincidencia) => coincidencia[1]);

            for (const especificador of especificadores) {
                const destino = resolve(dirname(modulo), especificador);
                const respuesta = await pedir(aRuta(destino));
                if (respuesta.status !== 200) rotos.push(aRuta(modulo) + ' -> ' + especificador);
            }
        }
        igual(rotos.length, 0, 'imports rotos: ' + rotos.join(', '));
    });

    await registro.prueba('una ruta del frontend cae en el index y no en un 404', async () => {
        const respuesta = await pedir('/favoritos');
        igual(respuesta.status, 200);
        verdadero((await respuesta.text()).includes('id="contenido"'), 'no devolvió el index');
    });

    await registro.prueba('la documentación de Swagger responde', async () => {
        const respuesta = await pedir('/api/docs/');
        igual(respuesta.status, 200);
    });
}

// componentes.js no toca el DOM al importarse, así que sus funciones puras se prueban acá
export async function pruebasComponentes(registro) {
    const { escapar, tarjetaPrograma, rejilla } = await import('../../../publico/js/componentes.js');

    await registro.prueba('el escapado neutraliza el HTML que venga de la base', async () => {
        const salida = escapar('<img src=x onerror="alert(1)">');
        verdadero(!salida.includes('<img'), 'quedó una etiqueta viva');
        verdadero(salida.includes('&lt;img'), 'no se escapó el menor que');
        igual(escapar(null), '');
    });

    await registro.prueba('la tarjeta escapa el título y marca el favorito', async () => {
        const programa = {
            id: '000000000000000000000001',
            titulo: 'Dragon <script>Ball</script>',
            poster: 'https://ejemplo.com/p.jpg',
            categoria: { nombre: 'anime' }
        };
        const marcada = tarjetaPrograma(programa, { favorito: true, mostrarBoton: true });
        verdadero(!marcada.includes('<script>'), 'el título entró sin escapar');
        verdadero(marcada.includes('es-favorito'), 'no se marcó como favorito');
        verdadero(marcada.includes('#/programa/' + programa.id), 'el enlace al detalle no está');

        const suelta = tarjetaPrograma(programa, { favorito: false, mostrarBoton: false });
        verdadero(!suelta.includes('data-favorito'), 'apareció el botón donde no debía');
    });

    await registro.prueba('la rejilla decide el favorito programa por programa', async () => {
        const programas = [
            { id: 'a', titulo: 'Uno', poster: '', categoria: null },
            { id: 'b', titulo: 'Dos', poster: '', categoria: null }
        ];
        const html = rejilla(programas, { mostrarBoton: true, esFavorito: (programa) => programa.id === 'a' });
        igual((html.match(/es-favorito/g) ?? []).length, 1);
    });
}
