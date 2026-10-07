<?php
/**
 * GET api/catalogos.php
 * Devuelve las opciones de los filtros: sexos, tipos, categorías, colores
 * y los rangos de precio y de año de producción.
 */
require __DIR__ . '/config.php';

$pdo = conexion();

// Cantidad de productos por sexo, para la portada
$generos = $pdo->query(
    "SELECT g.nombre, g.slug, COUNT(p.id) AS total
     FROM generos g
     LEFT JOIN productos p ON p.genero_id = g.id AND p.activo = 1
     GROUP BY g.id, g.nombre, g.slug
     ORDER BY g.id"
)->fetchAll();
foreach ($generos as &$genero) {
    $genero['total'] = (int) $genero['total'];
}
unset($genero);

// Solo los colores que tienen productos
$colores = $pdo->query(
    "SELECT co.nombre, co.slug, co.hex
     FROM colores co
     WHERE EXISTS (SELECT 1 FROM productos p WHERE p.color_id = co.id AND p.activo = 1)
     ORDER BY co.id"
)->fetchAll();

$rango = $pdo->query(
    "SELECT MIN(ROUND(precio * (100 - descuento_porcentaje) / 100, 2)) AS precio_min,
            MAX(ROUND(precio * (100 - descuento_porcentaje) / 100, 2)) AS precio_max,
            MIN(anio) AS anio_min, MAX(anio) AS anio_max
     FROM productos WHERE activo = 1"
)->fetch();

responder([
    'generos'    => $generos,
    'tipos'      => $pdo->query("SELECT nombre, slug FROM tipos ORDER BY id")->fetchAll(),
    'categorias' => $pdo->query(
        "SELECT c.nombre, c.slug, t.slug AS tipo
         FROM categorias c JOIN tipos t ON t.id = c.tipo_id ORDER BY c.id"
    )->fetchAll(),
    'colores'    => $colores,
    'rango'      => [
        'precio_min' => (float) $rango['precio_min'],
        'precio_max' => (float) $rango['precio_max'],
        'anio_min'   => (int) $rango['anio_min'],
        'anio_max'   => (int) $rango['anio_max'],
    ],
]);
