import bcrypt from 'bcrypt';
import { verificarEntorno } from '../src/config/entorno.js';
import { Conexion } from '../src/config/db.js';
import { crearIndices } from '../src/config/indices.js';
import { COLECCIONES } from '../src/config/colecciones.js';
import { RepositorioCategorias } from '../src/repositorios/RepositorioCategorias.js';
import { RepositorioProductoras } from '../src/repositorios/RepositorioProductoras.js';
import { RepositorioProgramas } from '../src/repositorios/RepositorioProgramas.js';
import { RepositorioCapitulos } from '../src/repositorios/RepositorioCapitulos.js';
import { RepositorioActores } from '../src/repositorios/RepositorioActores.js';
import { RepositorioPersonajes } from '../src/repositorios/RepositorioPersonajes.js';
import { RepositorioUsuarios } from '../src/repositorios/RepositorioUsuarios.js';
import { CategoriaPrograma } from '../src/modelos/CategoriaPrograma.js';
import { Productora } from '../src/modelos/Productora.js';
import { Programa } from '../src/modelos/Programa.js';
import { Capitulo } from '../src/modelos/Capitulo.js';
import { Actor } from '../src/modelos/Actor.js';
import { Personaje } from '../src/modelos/Personaje.js';
import { Usuario } from '../src/modelos/Usuario.js';

const poster = (semilla) => 'https://picsum.photos/seed/' + semilla + '/300/450';
const TRAILER = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

const CATEGORIAS = [
    { nombre: 'anime', descripcion: 'Animación japonesa' },
    { nombre: 'novelas', descripcion: 'Telenovelas y dramas' },
    { nombre: 'cartoons', descripcion: 'Animación occidental' }
];

const PRODUCTORAS = [
    { nombre: 'Toei Animation', pais: 'Japón', anioFundacion: 1948 },
    { nombre: 'Cartoon Network Studios', pais: 'Estados Unidos', anioFundacion: 1994 },
    { nombre: 'Televisa', pais: 'México', anioFundacion: 1973 },
    { nombre: 'Studio Pierrot', pais: 'Japón', anioFundacion: 1979 },
    { nombre: 'Madhouse', pais: 'Japón', anioFundacion: 1972 },
    { nombre: 'Bones', pais: 'Japón', anioFundacion: 1998 },
    { nombre: 'Wit Studio', pais: 'Japón', anioFundacion: 2012 },
    { nombre: 'MAPPA', pais: 'Japón', anioFundacion: 2011 },
    { nombre: 'Ufotable', pais: 'Japón', anioFundacion: 2000 },
    { nombre: 'Sunrise', pais: 'Japón', anioFundacion: 1972 },
    { nombre: 'Gainax', pais: 'Japón', anioFundacion: 1984 },
    { nombre: 'A-1 Pictures', pais: 'Japón', anioFundacion: 2005 },
    { nombre: 'White Fox', pais: 'Japón', anioFundacion: 2007 },
    { nombre: 'CloverWorks', pais: 'Japón', anioFundacion: 2018 },
    { nombre: 'OLM', pais: 'Japón', anioFundacion: 1963 },
    { nombre: 'Kyoto Animation', pais: 'Japón', anioFundacion: 1981 }
];

const ACTORES = [
    { nombre: 'Masako Nozawa', nacionalidad: 'Japonesa', fechaNacimiento: '1936-10-25', foto: poster('nozawa') },
    { nombre: 'Ryo Horikawa', nacionalidad: 'Japonesa', fechaNacimiento: '1958-02-01', foto: poster('horikawa') },
    { nombre: 'John DiMaggio', nacionalidad: 'Estadounidense', fechaNacimiento: '1968-09-04', foto: poster('dimaggio') },
    { nombre: 'Thalía', nacionalidad: 'Mexicana', fechaNacimiento: '1971-08-26', foto: poster('thalia') }
];

const USUARIOS = [
    { nombreUsuario: 'admin', correo: 'admin@todotv.test', contrasena: 'Admin1234', rol: Usuario.ROLES.ADMINISTRADOR },
    { nombreUsuario: 'demo', correo: 'demo@todotv.test', contrasena: 'Demo1234', rol: Usuario.ROLES.USUARIO }
];

const PROGRAMAS = [
    {
        titulo: 'Dragon Ball',
        categoria: 'anime',
        productora: 'Toei Animation',
        sinopsis: 'Goku recorre el mundo buscando las esferas del dragón y se cruza con rivales cada vez más fuertes.',
        capitulos: [
            { temporada: 1, numero: 1, titulo: 'Bulma y Son Goku', duracionMinutos: 24, fechaEstreno: '1986-02-26' },
            { temporada: 1, numero: 2, titulo: 'No hay tal abuelo', duracionMinutos: 24, fechaEstreno: '1986-03-05' },
            { temporada: 2, numero: 1, titulo: 'El torneo de las artes marciales', duracionMinutos: 24, fechaEstreno: '1986-09-03' }
        ],
        personajes: [
            { nombre: 'Son Goku', actor: 'Masako Nozawa' },
            { nombre: 'Vegeta', actor: 'Ryo Horikawa' }
        ]
    },
    {
        titulo: 'Adventure Time',
        categoria: 'cartoons',
        productora: 'Cartoon Network Studios',
        sinopsis: 'Finn y Jake viven aventuras absurdas en la Tierra de Ooo, un mundo mágico después del desastre.',
        capitulos: [
            { temporada: 1, numero: 1, titulo: 'El cuarto de mazmorra', duracionMinutos: 11, fechaEstreno: '2010-04-05' },
            { temporada: 1, numero: 2, titulo: 'Rehenes del rey helado', duracionMinutos: 11, fechaEstreno: '2010-04-12' }
        ],
        personajes: [
            { nombre: 'Jake el perro', actor: 'John DiMaggio' }
        ]
    },
    {
        titulo: 'María la del Barrio',
        categoria: 'novelas',
        productora: 'Televisa',
        sinopsis: 'Una joven humilde entra a servir en una casa rica y se enfrenta a la familia que la desprecia.',
        capitulos: [
            { temporada: 1, numero: 1, titulo: 'La llegada', duracionMinutos: 45, fechaEstreno: '1995-06-19' }
        ],
        personajes: [
            { nombre: 'María Hernández', actor: 'Thalía' }
        ]
    },
    {
        titulo: 'Dragon Ball Z',
        categoria: 'anime',
        productora: 'Toei Animation',
        sinopsis: 'Goku descubre su origen saiyajin y defiende la Tierra de enemigos cada vez más poderosos junto a sus aliados.',
        capitulos: [],
        personajes: []
    },
    {
        titulo: 'Naruto',
        categoria: 'anime',
        productora: 'Studio Pierrot',
        sinopsis: 'Un ninja adolescente busca el reconocimiento de su aldea y sueña con convertirse algún día en Hokage.',
        capitulos: [],
        personajes: []
    },
    {
        titulo: 'One Piece',
        categoria: 'anime',
        productora: 'Toei Animation',
        sinopsis: 'Monkey D. Luffy zarpa con su tripulación pirata en busca del legendario tesoro One Piece.',
        capitulos: [],
        personajes: []
    },
    {
        titulo: 'Death Note',
        categoria: 'anime',
        productora: 'Madhouse',
        sinopsis: 'Un estudiante encuentra un cuaderno que mata a quien escriba su nombre y decide usarlo para purgar el crimen.',
        capitulos: [],
        personajes: []
    },
    {
        titulo: 'Fullmetal Alchemist: Brotherhood',
        categoria: 'anime',
        productora: 'Bones',
        sinopsis: 'Dos hermanos alquimistas buscan la piedra filosofal para recuperar lo que perdieron en un ritual prohibido.',
        capitulos: [],
        personajes: []
    },
    {
        titulo: 'Attack on Titan',
        categoria: 'anime',
        productora: 'Wit Studio',
        sinopsis: 'La humanidad sobrevive tras murallas mientras titanes gigantes amenazan con devorar a quien quede fuera.',
        capitulos: [],
        personajes: []
    },
    {
        titulo: 'My Hero Academia',
        categoria: 'anime',
        productora: 'Bones',
        sinopsis: 'En un mundo donde casi todos tienen superpoderes, un chico sin ellos sueña con convertirse en el héroe número uno.',
        capitulos: [],
        personajes: []
    },
    {
        titulo: 'Demon Slayer',
        categoria: 'anime',
        productora: 'Ufotable',
        sinopsis: 'Un joven se convierte en cazador de demonios para vengar a su familia y curar a su hermana convertida en demonio.',
        capitulos: [],
        personajes: []
    },
    {
        titulo: 'Jujutsu Kaisen',
        categoria: 'anime',
        productora: 'MAPPA',
        sinopsis: 'Un estudiante se une a una organización secreta de hechiceros para combatir maldiciones y buscar los dedos de un rey demonio.',
        capitulos: [],
        personajes: []
    },
    {
        titulo: 'Cowboy Bebop',
        categoria: 'anime',
        productora: 'Sunrise',
        sinopsis: 'Un grupo de cazarrecompensas viaja por el espacio resolviendo casos mientras huye de su propio pasado.',
        capitulos: [],
        personajes: []
    },
    {
        titulo: 'Neon Genesis Evangelion',
        categoria: 'anime',
        productora: 'Gainax',
        sinopsis: 'Adolescentes pilotan gigantescos robots biomecánicos para defender a la humanidad de misteriosos ángeles.',
        capitulos: [],
        personajes: []
    },
    {
        titulo: 'Sailor Moon',
        categoria: 'anime',
        productora: 'Toei Animation',
        sinopsis: 'Una estudiante se transforma en guerrera mágica para proteger la Tierra junto a sus compañeras Sailor Scouts.',
        capitulos: [],
        personajes: []
    },
    {
        titulo: 'One Punch Man',
        categoria: 'anime',
        productora: 'Madhouse',
        sinopsis: 'Un héroe capaz de derrotar a cualquier rival de un solo golpe busca un desafío que lo haga sentir vivo otra vez.',
        capitulos: [],
        personajes: []
    },
    {
        titulo: 'Tokyo Ghoul',
        categoria: 'anime',
        productora: 'Studio Pierrot',
        sinopsis: 'Tras un encuentro casi mortal, un joven queda a medio camino entre humano y ghoul devorador de carne humana.',
        capitulos: [],
        personajes: []
    },
    {
        titulo: 'Bleach',
        categoria: 'anime',
        productora: 'Studio Pierrot',
        sinopsis: 'Un adolescente obtiene poderes de shinigami y asume la tarea de guiar almas y combatir espíritus corruptos.',
        capitulos: [],
        personajes: []
    },
    {
        titulo: 'Hunter x Hunter',
        categoria: 'anime',
        productora: 'Madhouse',
        sinopsis: 'Un niño se convierte en cazador profesional con la esperanza de encontrar a su padre desaparecido.',
        capitulos: [],
        personajes: []
    },
    {
        titulo: 'Fairy Tail',
        categoria: 'anime',
        productora: 'A-1 Pictures',
        sinopsis: 'Una maga se une al gremio Fairy Tail y vive aventuras junto a un grupo de magos excéntricos y leales.',
        capitulos: [],
        personajes: []
    },
    {
        titulo: 'Code Geass',
        categoria: 'anime',
        productora: 'Sunrise',
        sinopsis: 'Un príncipe exiliado obtiene el poder de dar órdenes absolutas y lo usa para liderar una rebelión contra el imperio.',
        capitulos: [],
        personajes: []
    },
    {
        titulo: 'Steins;Gate',
        categoria: 'anime',
        productora: 'White Fox',
        sinopsis: 'Un grupo de amigos descubre cómo enviar mensajes al pasado y desata consecuencias que amenazan con destruir el mundo.',
        capitulos: [],
        personajes: []
    },
    {
        titulo: 'Re:Zero',
        categoria: 'anime',
        productora: 'White Fox',
        sinopsis: 'Un joven transportado a otro mundo descubre que puede regresar en el tiempo cada vez que muere.',
        capitulos: [],
        personajes: []
    },
    {
        titulo: 'Chainsaw Man',
        categoria: 'anime',
        productora: 'MAPPA',
        sinopsis: 'Un joven fusionado con un demonio motosierra se convierte en cazador de demonios para pagar sus deudas.',
        capitulos: [],
        personajes: []
    },
    {
        titulo: 'Spy x Family',
        categoria: 'anime',
        productora: 'Wit Studio',
        sinopsis: 'Un espía, una asesina y una niña telépata forman una familia falsa que esconde secretos entre sí.',
        capitulos: [],
        personajes: []
    },
    {
        titulo: 'Pokémon',
        categoria: 'anime',
        productora: 'OLM',
        sinopsis: 'Un joven entrenador viaja por distintas regiones capturando y entrenando criaturas Pokémon junto a sus amigos.',
        capitulos: [],
        personajes: []
    },
    {
        titulo: 'Violet Evergarden',
        categoria: 'anime',
        productora: 'Kyoto Animation',
        sinopsis: 'Una ex soldado se convierte en escritora de cartas para comprender el significado de las palabras "te amo".',
        capitulos: [],
        personajes: []
    }
];

async function asegurar(buscar, crear) {
    const existente = await buscar();
    if (existente) return existente;
    return crear();
}

verificarEntorno();

const reiniciar = process.argv.includes('--reset');
const conexion = Conexion.instancia();
const base = await conexion.conectar();

if (reiniciar) {
    for (const coleccion of Object.values(COLECCIONES)) {
        await base.collection(coleccion).deleteMany({});
    }
    console.log('Colecciones vaciadas por --reset');
}

await crearIndices(base);

const repositorios = {
    categorias: new RepositorioCategorias(base),
    productoras: new RepositorioProductoras(base),
    programas: new RepositorioProgramas(base),
    capitulos: new RepositorioCapitulos(base),
    actores: new RepositorioActores(base),
    personajes: new RepositorioPersonajes(base),
    usuarios: new RepositorioUsuarios(base)
};

const categorias = new Map();
for (const datos of CATEGORIAS) {
    const categoria = await asegurar(
        () => repositorios.categorias.porNombre(datos.nombre),
        () => repositorios.categorias.crear(CategoriaPrograma.nueva(datos))
    );
    categorias.set(datos.nombre, categoria);
}

const productoras = new Map();
for (const datos of PRODUCTORAS) {
    const productora = await asegurar(
        () => repositorios.productoras.porNombre(datos.nombre),
        () => repositorios.productoras.crear(Productora.nueva(datos))
    );
    productoras.set(datos.nombre, productora);
}

const actores = new Map();
for (const datos of ACTORES) {
    const encontrados = await repositorios.actores.listarOrdenados(datos.nombre);
    const actor = encontrados[0] ?? await repositorios.actores.crear(Actor.nuevo(datos));
    actores.set(datos.nombre, actor);
}

for (const datos of PROGRAMAS) {
    const programa = await asegurar(
        () => repositorios.programas.porTitulo(datos.titulo),
        () => repositorios.programas.crear(Programa.nuevo({
            titulo: datos.titulo,
            sinopsis: datos.sinopsis,
            poster: poster(datos.titulo.toLowerCase().replace(/\s+/g, '-')),
            trailer: TRAILER,
            categoriaId: categorias.get(datos.categoria).id,
            productoraId: productoras.get(datos.productora).id
        }))
    );

    const capitulosExistentes = await repositorios.capitulos.porPrograma(programa.id);
    for (const datosCapitulo of datos.capitulos) {
        const yaEsta = capitulosExistentes.some(
            (capitulo) => capitulo.temporada === datosCapitulo.temporada && capitulo.numero === datosCapitulo.numero
        );
        if (!yaEsta) {
            await repositorios.capitulos.crear(Capitulo.nuevo({ ...datosCapitulo, programaId: programa.id }));
        }
    }

    const personajesExistentes = await repositorios.personajes.porPrograma(programa.id);
    for (const datosPersonaje of datos.personajes) {
        const yaEsta = personajesExistentes.some((personaje) => personaje.nombre === datosPersonaje.nombre);
        if (!yaEsta) {
            await repositorios.personajes.crear(Personaje.nuevo({
                nombre: datosPersonaje.nombre,
                programaId: programa.id,
                actorId: actores.get(datosPersonaje.actor).id
            }));
        }
    }
}

for (const datos of USUARIOS) {
    await asegurar(
        () => repositorios.usuarios.porCorreo(datos.correo),
        async () => repositorios.usuarios.crear(Usuario.nuevo({
            ...datos,
            contrasena: await bcrypt.hash(datos.contrasena, 10)
        }))
    );
}

const resumen = {
    categorias: await repositorios.categorias.contar(),
    productoras: await repositorios.productoras.contar(),
    programas: await repositorios.programas.contar(),
    capitulos: await repositorios.capitulos.contar(),
    actores: await repositorios.actores.contar(),
    personajes: await repositorios.personajes.contar(),
    usuarios: await repositorios.usuarios.contar()
};

console.log('\nSemilla lista:');
for (const [nombre, cantidad] of Object.entries(resumen)) {
    console.log('  ' + nombre.padEnd(12) + cantidad);
}
console.log('\nAdministrador: admin@todotv.test / Admin1234');
console.log('Usuario:       demo@todotv.test / Demo1234');

await conexion.cerrar();
