<?php
/**
 * GET api/metodos_pago.php
 * Devuelve los métodos de pago activos.
 */
require __DIR__ . '/config.php';

$filas = conexion()
    ->query("SELECT nombre, slug, instrucciones, requiere_referencia, pide_tipo_tarjeta
             FROM metodos_pago WHERE activo = 1 ORDER BY id")
    ->fetchAll();

responder(array_map(function (array $fila): array {
    $fila['requiere_referencia'] = (bool) $fila['requiere_referencia'];
    $fila['pide_tipo_tarjeta']   = (bool) $fila['pide_tipo_tarjeta'];
    return $fila;
}, $filas));
