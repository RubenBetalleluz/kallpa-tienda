<?php
/**
 * GET api/productos.php
 * Lista los productos del catálogo. Todos los filtros son opcionales y
 * los que aceptan varios valores van separados por coma:
 *   genero        hombres,mujeres,ninos,unisex   (sexo del producto)
 *   tipo          ropa,calzado,accesorios        (tipo de producto)
 *   categoria     polos | shorts | zapatillas | gorras ...
 *   color         negro,blanco,azul ...
 *   descuento     1 = solo productos con descuento
 *   precio_min, precio_max   rango sobre el precio final, con descuento
 *   anio_min, anio_max       rango del año de producción
 *   q             texto a buscar en el nombre o la descripción
 *   orden         precio-menor | precio-mayor | descuento | anio
 */
require __DIR__ . '/config.php';

// Precio final: el precio regular menos el descuento
const PRECIO_FINAL = "ROUND(p.precio * (100 - p.descuento_porcentaje) / 100, 2)";

$sql = "SELECT p.id, p.nombre, p.descripcion, p.precio, p.descuento_porcentaje,
               " . PRECIO_FINAL . " AS precio_final,
               p.stock, p.anio, p.destacado,
               g.slug AS genero, g.nombre AS genero_nombre,
               t.slug AS tipo, t.nombre AS tipo_nombre,
               c.slug AS categoria, c.nombre AS categoria_nombre,
               co.slug AS color, co.nombre AS color_nombre, co.hex AS color_hex,
               (SELECT GROUP_CONCAT(pt.talla ORDER BY pt.orden SEPARATOR ',')
                  FROM producto_tallas pt WHERE pt.producto_id = p.id) AS tallas
        FROM productos p
        JOIN generos g    ON g.id = p.genero_id
        JOIN categorias c ON c.id = p.categoria_id
        JOIN tipos t      ON t.id = c.tipo_id
        JOIN colores co   ON co.id = p.color_id
        WHERE p.activo = 1";
$parametros = [];

/** Agrega al SQL un filtro "columna IN (?, ?, ...)" a partir de una lista separada por comas. */
function filtroLista(string &$sql, array &$parametros, string $columna, ?string $valores): void
{
    $lista = array_values(array_filter(array_map('trim', explode(',', (string) $valores)), 'strlen'));
    if (count($lista) === 0) {
        return;
    }
    $sql .= " AND $columna IN (" . implode(', ', array_fill(0, count($lista), '?')) . ")";
    foreach ($lista as $valor) {
        $parametros[] = $valor;
    }
}

filtroLista($sql, $parametros, 'g.slug',  $_GET['genero'] ?? null);     // sexo
filtroLista($sql, $parametros, 't.slug',  $_GET['tipo'] ?? null);       // tipo de producto
filtroLista($sql, $parametros, 'co.slug', $_GET['color'] ?? null);      // color

if (!empty($_GET['categoria'])) {
    $sql .= " AND c.slug = ?";
    $parametros[] = $_GET['categoria'];
}

// Solo productos con descuento
if (($_GET['descuento'] ?? '') === '1') {
    $sql .= " AND p.descuento_porcentaje > 0";
}

// Rango de precios, sobre el precio final
if (isset($_GET['precio_min']) && is_numeric($_GET['precio_min'])) {
    $sql .= " AND " . PRECIO_FINAL . " >= ?";
    $parametros[] = (float) $_GET['precio_min'];
}
if (isset($_GET['precio_max']) && is_numeric($_GET['precio_max'])) {
    $sql .= " AND " . PRECIO_FINAL . " <= ?";
    $parametros[] = (float) $_GET['precio_max'];
}

// Rango del año de producción
if (isset($_GET['anio_min']) && is_numeric($_GET['anio_min'])) {
    $sql .= " AND p.anio >= ?";
    $parametros[] = (int) $_GET['anio_min'];
}
if (isset($_GET['anio_max']) && is_numeric($_GET['anio_max'])) {
    $sql .= " AND p.anio <= ?";
    $parametros[] = (int) $_GET['anio_max'];
}

if (!empty($_GET['q'])) {
    $sql .= " AND (p.nombre LIKE ? OR p.descripcion LIKE ? OR c.nombre LIKE ?)";
    $texto = '%' . $_GET['q'] . '%';
    array_push($parametros, $texto, $texto, $texto);
}

// El orden sale de una lista fija: nunca se inserta texto del usuario en el SQL
$ordenes = [
    'precio-menor' => 'precio_final ASC',
    'precio-mayor' => 'precio_final DESC',
    'descuento'    => 'p.descuento_porcentaje DESC, precio_final ASC',
    'anio'         => 'p.anio DESC, p.id ASC',
];
$sql .= " ORDER BY " . ($ordenes[$_GET['orden'] ?? ''] ?? 'p.destacado DESC, p.id ASC');

$consulta = conexion()->prepare($sql);
$consulta->execute($parametros);

$productos = array_map(function (array $fila): array {
    $fila['id']                   = (int) $fila['id'];
    $fila['precio']               = (float) $fila['precio'];
    $fila['descuento_porcentaje'] = (int) $fila['descuento_porcentaje'];
    $fila['precio_final']         = (float) $fila['precio_final'];
    $fila['stock']                = (int) $fila['stock'];
    $fila['anio']                 = (int) $fila['anio'];
    $fila['destacado']            = (bool) $fila['destacado'];
    $fila['tallas']               = $fila['tallas'] ? explode(',', $fila['tallas']) : [];
    return $fila;
}, $consulta->fetchAll());

responder($productos);
