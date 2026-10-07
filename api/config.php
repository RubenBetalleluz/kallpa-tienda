<?php
/**
 * Kallpa Sport - Configuración y conexión a la base de datos.
 * Ajusta los datos de conexión según tu servidor (XAMPP usa root sin contraseña).
 */
declare(strict_types=1);

const DB_HOST = 'localhost';
const DB_NAME = 'kallpa_sport';
const DB_USER = 'root';
const DB_PASS = '';

// Reglas de envío: deben coincidir con js/config.js
const ENVIO_GRATIS_DESDE = 199.00;
const COSTO_ENVIO        = 10.00;

header('Content-Type: application/json; charset=utf-8');

/** Devuelve una respuesta JSON y termina el script. */
function responder($datos, int $codigo = 200): void
{
    http_response_code($codigo);
    echo json_encode($datos, JSON_UNESCAPED_UNICODE);
    exit;
}

/** Conexión PDO reutilizable. */
function conexion(): PDO
{
    static $pdo = null;
    if ($pdo === null) {
        try {
            $pdo = new PDO(
                'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
                DB_USER,
                DB_PASS,
                [
                    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES   => false,
                ]
            );
        } catch (PDOException $e) {
            responder(['ok' => false, 'error' => 'No se pudo conectar a la base de datos.'], 500);
        }
    }
    return $pdo;
}
