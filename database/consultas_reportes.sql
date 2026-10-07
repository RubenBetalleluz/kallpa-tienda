-- ============================================================
--  Kallpa Sport - Consultas de ejemplo y reportes
-- ============================================================
USE kallpa_sport;

-- 1. Catálogo completo: categoría, nombre, precio, descuento, color y stock
SELECT p.id, t.nombre AS tipo, c.nombre AS categoria, p.nombre, g.nombre AS sexo, co.nombre AS color,
       p.precio AS precio_regular, p.descuento_porcentaje,
       ROUND(p.precio * (100 - p.descuento_porcentaje) / 100, 2) AS precio_final,
       p.stock, p.anio
FROM productos p
JOIN generos g    ON g.id = p.genero_id
JOIN categorias c ON c.id = p.categoria_id
JOIN tipos t      ON t.id = c.tipo_id
JOIN colores co   ON co.id = p.color_id
ORDER BY t.id, c.id, p.nombre;

-- 2. Los mismos filtros de la página combinados: ropa para mujeres, con descuento,
--    en color negro, blanco o morado, entre S/ 30 y S/ 100, del 2024 en adelante
SELECT p.nombre, co.nombre AS color, p.descuento_porcentaje,
       ROUND(p.precio * (100 - p.descuento_porcentaje) / 100, 2) AS precio_final, p.anio
FROM productos p
JOIN generos g    ON g.id = p.genero_id
JOIN categorias c ON c.id = p.categoria_id
JOIN tipos t      ON t.id = c.tipo_id
JOIN colores co   ON co.id = p.color_id
WHERE g.slug = 'mujeres'
  AND t.slug = 'ropa'
  AND p.descuento_porcentaje > 0
  AND co.slug IN ('negro', 'blanco', 'morado')
  AND ROUND(p.precio * (100 - p.descuento_porcentaje) / 100, 2) BETWEEN 30 AND 100
  AND p.anio >= 2024
ORDER BY precio_final;

-- 3. Productos con descuento, del mayor al menor
SELECT p.nombre, p.precio, p.descuento_porcentaje,
       ROUND(p.precio * (100 - p.descuento_porcentaje) / 100, 2) AS precio_final
FROM productos p
WHERE p.descuento_porcentaje > 0 AND p.activo = 1
ORDER BY p.descuento_porcentaje DESC;

-- 4. Stock y valor del inventario por tipo de producto
SELECT t.nombre AS tipo, COUNT(p.id) AS productos, SUM(p.stock) AS unidades,
       ROUND(SUM(p.stock * p.precio), 2) AS valor_inventario
FROM tipos t
JOIN categorias c ON c.tipo_id = t.id
JOIN productos p  ON p.categoria_id = c.id
GROUP BY t.id, t.nombre;

-- 5. Productos agotados o con poco stock (5 unidades o menos)
SELECT p.nombre, co.nombre AS color, p.stock
FROM productos p
JOIN colores co ON co.id = p.color_id
WHERE p.activo = 1 AND p.stock <= 5
ORDER BY p.stock;

-- 6. Pedidos con cliente y forma de pago
SELECT pe.codigo, pe.creado_en, cl.nombre AS cliente, cl.telefono,
       mp.nombre AS metodo_pago, pe.tipo_tarjeta, pe.ahorro, pe.total, pe.estado
FROM pedidos pe
JOIN clientes cl     ON cl.id = pe.cliente_id
JOIN metodos_pago mp ON mp.id = pe.metodo_pago_id
ORDER BY pe.creado_en DESC;

-- 7. Ventas por categoría (sin pedidos cancelados)
SELECT c.nombre AS categoria, SUM(d.cantidad) AS unidades, SUM(d.subtotal) AS ventas
FROM pedido_detalle d
JOIN pedidos pe   ON pe.id = d.pedido_id
JOIN productos p  ON p.id = d.producto_id
JOIN categorias c ON c.id = p.categoria_id
WHERE pe.estado <> 'cancelado'
GROUP BY c.id, c.nombre
ORDER BY ventas DESC;

-- 8. Uso de cada método de pago
SELECT mp.nombre AS metodo_pago, COUNT(pe.id) AS pedidos, COALESCE(SUM(pe.total), 0) AS total
FROM metodos_pago mp
LEFT JOIN pedidos pe ON pe.metodo_pago_id = mp.id AND pe.estado <> 'cancelado'
GROUP BY mp.id, mp.nombre
ORDER BY pedidos DESC;
