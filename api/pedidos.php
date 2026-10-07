<?php
/**
 * POST api/pedidos.php
 * Registra un pedido. Recibe JSON:
 * {
 *   "cliente": { "nombre", "email", "telefono", "direccion", "distrito" },
 *   "metodo_pago": "tarjeta",
 *   "tipo_tarjeta": "credito",       // solo si el método es tarjeta
 *   "referencia_pago": "123456",     // solo para Yape, Plin o transferencia
 *   "notas": "",
 *   "items": [ { "producto_id": 1, "talla": "M", "cantidad": 2 } ]
 * }
 * Los precios, descuentos y totales se calculan aquí con los datos de la base
 * de datos: nunca se confía en los montos que envía el navegador.
 * Por seguridad, la página no recibe ni guarda números de tarjeta.
 */
require __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    responder(['ok' => false, 'error' => 'Método no permitido.'], 405);
}

$datos = json_decode(file_get_contents('php://input'), true);
if (!is_array($datos)) {
    responder(['ok' => false, 'error' => 'Los datos del pedido no son válidos.'], 400);
}

// ---------- Validación de los datos del cliente ----------
$cliente     = is_array($datos['cliente'] ?? null) ? $datos['cliente'] : [];
$nombre      = trim((string) ($cliente['nombre'] ?? ''));
$email       = trim((string) ($cliente['email'] ?? ''));
$telefono    = preg_replace('/\D+/', '', (string) ($cliente['telefono'] ?? ''));
$direccion   = trim((string) ($cliente['direccion'] ?? ''));
$distrito    = trim((string) ($cliente['distrito'] ?? ''));
$metodo      = trim((string) ($datos['metodo_pago'] ?? ''));
$tipoTarjeta = trim((string) ($datos['tipo_tarjeta'] ?? ''));
$referencia  = mb_substr(trim((string) ($datos['referencia_pago'] ?? '')), 0, 40);
$notas       = mb_substr(trim((string) ($datos['notas'] ?? '')), 0, 255);
$items       = is_array($datos['items'] ?? null) ? $datos['items'] : [];

if (mb_strlen($nombre) < 3)                         responder(['ok' => false, 'error' => 'Escribe tu nombre completo.'], 400);
if (!filter_var($email, FILTER_VALIDATE_EMAIL))     responder(['ok' => false, 'error' => 'El correo no es válido.'], 400);
if (!preg_match('/^9\d{8}$/', $telefono))           responder(['ok' => false, 'error' => 'El celular debe tener 9 dígitos y empezar con 9.'], 400);
if (mb_strlen($direccion) < 5 || $distrito === '')  responder(['ok' => false, 'error' => 'Completa la dirección y el distrito de entrega.'], 400);
if (count($items) === 0 || count($items) > 50)      responder(['ok' => false, 'error' => 'El carrito está vacío.'], 400);

$pdo = conexion();

try {
    $pdo->beginTransaction();

    // ---------- Método de pago ----------
    $consulta = $pdo->prepare("SELECT id, nombre, requiere_referencia, pide_tipo_tarjeta
                               FROM metodos_pago WHERE slug = ? AND activo = 1");
    $consulta->execute([$metodo]);
    $metodoPago = $consulta->fetch();
    if (!$metodoPago) {
        throw new InvalidArgumentException('Elige un método de pago.');
    }
    if ($metodoPago['requiere_referencia'] && $referencia === '') {
        throw new InvalidArgumentException('Escribe el código de operación de tu pago.');
    }
    if ($metodoPago['pide_tipo_tarjeta']) {
        if (!in_array($tipoTarjeta, ['credito', 'debito'], true)) {
            throw new InvalidArgumentException('Indica si tu tarjeta es de crédito o de débito.');
        }
    } else {
        $tipoTarjeta = '';
    }
    if (!$metodoPago['requiere_referencia']) {
        $referencia = '';
    }

    // ---------- Productos: precio, descuento y stock reales ----------
    $buscarProducto = $pdo->prepare("SELECT id, nombre, precio, descuento_porcentaje, stock
                                     FROM productos WHERE id = ? AND activo = 1 FOR UPDATE");
    $buscarTalla    = $pdo->prepare("SELECT 1 FROM producto_tallas WHERE producto_id = ? AND talla = ?");

    $lineas    = [];
    $pedidoPor = [];   // unidades pedidas por producto (un producto puede venir en varias tallas)
    $subtotal  = 0.0;
    $ahorro    = 0.0;

    foreach ($items as $item) {
        $productoId = (int) ($item['producto_id'] ?? 0);
        $talla      = trim((string) ($item['talla'] ?? ''));
        $cantidad   = (int) ($item['cantidad'] ?? 0);

        if ($productoId <= 0 || $cantidad < 1 || $cantidad > 20) {
            throw new InvalidArgumentException('Hay un producto con cantidad no válida en el carrito.');
        }

        $buscarProducto->execute([$productoId]);
        $producto = $buscarProducto->fetch();
        if (!$producto) {
            throw new InvalidArgumentException('Un producto del carrito ya no está disponible.');
        }

        $buscarTalla->execute([$productoId, $talla]);
        if (!$buscarTalla->fetch()) {
            throw new InvalidArgumentException('La talla elegida para "' . $producto['nombre'] . '" no existe.');
        }

        $pedidoPor[$productoId] = ($pedidoPor[$productoId] ?? 0) + $cantidad;
        if ($pedidoPor[$productoId] > (int) $producto['stock']) {
            throw new InvalidArgumentException('No hay stock suficiente de "' . $producto['nombre'] . '" (quedan ' . $producto['stock'] . ').');
        }

        $precioRegular = (float) $producto['precio'];
        $descuento     = (int) $producto['descuento_porcentaje'];
        $precioFinal   = round($precioRegular * (100 - $descuento) / 100, 2);
        $importe       = round($precioFinal * $cantidad, 2);

        $subtotal += $importe;
        $ahorro   += round(($precioRegular - $precioFinal) * $cantidad, 2);
        $lineas[]  = [$productoId, $talla, $cantidad, $precioRegular, $descuento, $precioFinal, $importe];
    }

    $subtotal = round($subtotal, 2);
    $ahorro   = round($ahorro, 2);
    $envio    = $subtotal >= ENVIO_GRATIS_DESDE ? 0.0 : COSTO_ENVIO;
    $total    = round($subtotal + $envio, 2);

    // ---------- Cliente: se crea o se actualiza según su correo ----------
    $consulta = $pdo->prepare("SELECT id FROM clientes WHERE email = ?");
    $consulta->execute([$email]);
    $clienteId = $consulta->fetchColumn();

    if ($clienteId) {
        $pdo->prepare("UPDATE clientes SET nombre = ?, telefono = ?, direccion = ?, distrito = ? WHERE id = ?")
            ->execute([$nombre, $telefono, $direccion, $distrito, $clienteId]);
    } else {
        $pdo->prepare("INSERT INTO clientes (nombre, email, telefono, direccion, distrito) VALUES (?, ?, ?, ?, ?)")
            ->execute([$nombre, $email, $telefono, $direccion, $distrito]);
        $clienteId = $pdo->lastInsertId();
    }

    // ---------- Pedido y detalle ----------
    $pdo->prepare("INSERT INTO pedidos (cliente_id, metodo_pago_id, tipo_tarjeta, subtotal, ahorro, envio, total, referencia_pago, notas)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
        ->execute([$clienteId, $metodoPago['id'],
                   $tipoTarjeta !== '' ? $tipoTarjeta : null,
                   $subtotal, $ahorro, $envio, $total,
                   $referencia !== '' ? $referencia : null,
                   $notas !== '' ? $notas : null]);
    $pedidoId = (int) $pdo->lastInsertId();
    $codigo   = 'KS-' . str_pad((string) $pedidoId, 6, '0', STR_PAD_LEFT);
    $pdo->prepare("UPDATE pedidos SET codigo = ? WHERE id = ?")->execute([$codigo, $pedidoId]);

    $insertarDetalle = $pdo->prepare("INSERT INTO pedido_detalle
                                        (pedido_id, producto_id, talla, cantidad, precio_regular, descuento_porcentaje, precio_unitario, subtotal)
                                      VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    $descontarStock  = $pdo->prepare("UPDATE productos SET stock = stock - ? WHERE id = ?");

    foreach ($lineas as [$productoId, $talla, $cantidad, $precioRegular, $descuento, $precioFinal, $importe]) {
        $insertarDetalle->execute([$pedidoId, $productoId, $talla, $cantidad, $precioRegular, $descuento, $precioFinal, $importe]);
        $descontarStock->execute([$cantidad, $productoId]);
    }

    $pdo->commit();

    responder([
        'ok'           => true,
        'codigo'       => $codigo,
        'subtotal'     => $subtotal,
        'ahorro'       => $ahorro,
        'envio'        => $envio,
        'total'        => $total,
        'metodo_pago'  => $metodoPago['nombre'],
        'tipo_tarjeta' => $tipoTarjeta !== '' ? $tipoTarjeta : null,
    ], 201);
} catch (InvalidArgumentException $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    responder(['ok' => false, 'error' => $e->getMessage()], 400);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    responder(['ok' => false, 'error' => 'No se pudo registrar el pedido. Inténtalo de nuevo.'], 500);
}
