# Modelo de datos

Siete colecciones. Nada de actores embebidos dentro del programa: `personajes` es la
tabla puente entre `programas` y `actores`.

## Relaciones

```
categorias 1 ──< programas >── 1 productoras
                  │
                  ├──< capitulos
                  │
                  └──< personajes >── actores
                         (puente)

usuarios.favoritos ──> programas
```

- Un programa tiene muchos capítulos y muchos personajes.
- Un actor interpreta muchos personajes, en programas distintos.
- La relación actor ↔ programa siempre pasa por `personajes`.

## Colecciones

### categorias
| campo | tipo | notas |
|---|---|---|
| `_id` | ObjectId | |
| `nombre` | string | único, sin distinguir mayúsculas |
| `descripcion` | string | opcional |
| `creadoEn` / `actualizadoEn` | Date | |

### productoras
| campo | tipo | notas |
|---|---|---|
| `_id` | ObjectId | |
| `nombre` | string | único |
| `pais` | string | |
| `anioFundacion` | int | entre 1888 y el año actual |
| `creadoEn` / `actualizadoEn` | Date | |

### programas
| campo | tipo | notas |
|---|---|---|
| `_id` | ObjectId | |
| `titulo` | string | único |
| `sinopsis` | string | mínimo 10 caracteres |
| `poster` | string | URL de imagen |
| `trailer` | string | URL de video |
| `categoriaId` | ObjectId | → `categorias` |
| `productoraId` | ObjectId | → `productoras` |
| `creadoEn` / `actualizadoEn` | Date | |

### capitulos
| campo | tipo | notas |
|---|---|---|
| `_id` | ObjectId | |
| `programaId` | ObjectId | → `programas` |
| `temporada` | int | ≥ 1 |
| `numero` | int | ≥ 1, único dentro de la temporada del programa |
| `titulo` | string | |
| `duracionMinutos` | int | 1 a 600 |
| `fechaEstreno` | Date | |
| `creadoEn` / `actualizadoEn` | Date | |

### actores
| campo | tipo | notas |
|---|---|---|
| `_id` | ObjectId | |
| `nombre` | string | |
| `nacionalidad` | string | |
| `fechaNacimiento` | Date | no puede ser futura |
| `foto` | string | URL de imagen |
| `creadoEn` / `actualizadoEn` | Date | |

La edad no se guarda: la calcula el modelo y sale en `aPublico()`.

### personajes
| campo | tipo | notas |
|---|---|---|
| `_id` | ObjectId | |
| `nombre` | string | nombre del personaje |
| `programaId` | ObjectId | → `programas` |
| `actorId` | ObjectId | → `actores` |
| `creadoEn` / `actualizadoEn` | Date | |

### usuarios
| campo | tipo | notas |
|---|---|---|
| `_id` | ObjectId | |
| `nombreUsuario` | string | único |
| `correo` | string | único, se guarda en minúsculas |
| `contrasena` | string | hash de bcrypt, nunca sale en ninguna respuesta |
| `rol` | string | `administrador` o `usuario` |
| `favoritos` | ObjectId[] | → `programas` |
| `creadoEn` / `actualizadoEn` | Date | |

## Índices

| colección | índice | tipo |
|---|---|---|
| categorias | `nombre` | único |
| productoras | `nombre` | único |
| programas | `titulo` | único |
| programas | `categoriaId`, `productoraId` | búsqueda |
| capitulos | `programaId + temporada + numero` | único |
| personajes | `programaId + nombre + actorId` | único |
| personajes | `actorId` | búsqueda |
| actores | `nombre` | búsqueda |
| usuarios | `correo`, `nombreUsuario` | únicos |

Los índices de texto usan cotejo `{ locale: 'es', strength: 2 }`: ignoran mayúsculas
pero respetan los acentos. Así no hace falta guardar un campo normalizado aparte.

El índice de personajes deja que dos actores interpreten al mismo personaje (el mismo
papel en distintas etapas) pero impide que un actor lo interprete dos veces, que es
la regla pedida.

## Reglas que no cubre un índice

- Borrar un programa borra sus capítulos y sus personajes — transacción.
- Crear un programa con sus capítulos iniciales — transacción.
- No se puede borrar una categoría, productora o actor en uso — lo revisa el servicio
  antes de borrar y responde 409.

## Dónde vive cada validación

| nivel | qué revisa |
|---|---|
| express-validator (rutas) | formato de URL, tipos, longitudes, rangos, ObjectId válido |
| modelo (`verificar()`) | invariantes del dominio: campos obligatorios, rangos, fecha no futura |
| índice único (Mongo) | unicidad, con carrera incluida |
| servicio | existencia de las referencias, uso previo, transacciones |

Sin duplicar: el validador mira la forma del dato, el modelo mira que la entidad tenga
sentido, el índice es la última palabra.
