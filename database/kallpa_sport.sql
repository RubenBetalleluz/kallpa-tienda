-- ============================================================
--  Kallpa Sport - Tienda de ropa y accesorios deportivos
--  Base de datos MySQL / MariaDB
--  Importar desde phpMyAdmin o con:  mysql -u root < kallpa_sport.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS kallpa_sport
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE kallpa_sport;
SET NAMES utf8mb4;

DROP TABLE IF EXISTS pedido_detalle;
DROP TABLE IF EXISTS pedidos;
DROP TABLE IF EXISTS clientes;
DROP TABLE IF EXISTS metodos_pago;
DROP TABLE IF EXISTS producto_tallas;
DROP TABLE IF EXISTS productos;
DROP TABLE IF EXISTS colores;
DROP TABLE IF EXISTS categorias;
DROP TABLE IF EXISTS tipos;
DROP TABLE IF EXISTS generos;

-- ------------------------------------------------------------
--  Catálogo
-- ------------------------------------------------------------

-- Sexo o público del producto: hombres, mujeres, niños, unisex
CREATE TABLE generos (
  id      TINYINT UNSIGNED PRIMARY KEY,
  nombre  VARCHAR(30) NOT NULL,
  slug    VARCHAR(30) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- Tipo de producto: ropa, calzado, accesorios
CREATE TABLE tipos (
  id      TINYINT UNSIGNED PRIMARY KEY,
  nombre  VARCHAR(30) NOT NULL,
  slug    VARCHAR(30) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- Categoría dentro de cada tipo: polos, shorts, zapatillas, gorras, etc.
CREATE TABLE categorias (
  id       SMALLINT UNSIGNED PRIMARY KEY,
  tipo_id  TINYINT UNSIGNED NOT NULL,
  nombre   VARCHAR(60) NOT NULL,
  slug     VARCHAR(60) NOT NULL UNIQUE,
  CONSTRAINT fk_categoria_tipo FOREIGN KEY (tipo_id) REFERENCES tipos(id)
) ENGINE=InnoDB;

CREATE TABLE colores (
  id      TINYINT UNSIGNED PRIMARY KEY,
  nombre  VARCHAR(30) NOT NULL,
  slug    VARCHAR(30) NOT NULL UNIQUE,
  hex     CHAR(7)     NOT NULL
) ENGINE=InnoDB;

CREATE TABLE productos (
  id                    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre                VARCHAR(120) NOT NULL,
  descripcion           VARCHAR(255) NOT NULL,
  precio                DECIMAL(8,2) NOT NULL,                 -- precio regular en soles
  descuento_porcentaje  TINYINT UNSIGNED NOT NULL DEFAULT 0,   -- 0 = sin descuento
  stock                 INT UNSIGNED NOT NULL DEFAULT 0,       -- artículos disponibles
  genero_id             TINYINT UNSIGNED NOT NULL,
  categoria_id          SMALLINT UNSIGNED NOT NULL,
  color_id              TINYINT UNSIGNED NOT NULL,
  anio                  SMALLINT UNSIGNED NOT NULL,            -- año de producción
  destacado             TINYINT(1) NOT NULL DEFAULT 0,
  activo                TINYINT(1) NOT NULL DEFAULT 1,
  creado_en             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_producto_genero    FOREIGN KEY (genero_id)    REFERENCES generos(id),
  CONSTRAINT fk_producto_categoria FOREIGN KEY (categoria_id) REFERENCES categorias(id),
  CONSTRAINT fk_producto_color     FOREIGN KEY (color_id)     REFERENCES colores(id),
  CONSTRAINT chk_producto_precio    CHECK (precio > 0),
  CONSTRAINT chk_producto_descuento CHECK (descuento_porcentaje <= 90),
  -- Índices para los filtros del catálogo
  INDEX idx_producto_genero (genero_id),
  INDEX idx_producto_categoria (categoria_id),
  INDEX idx_producto_color (color_id),
  INDEX idx_producto_precio (precio),
  INDEX idx_producto_anio (anio)
) ENGINE=InnoDB;

-- Tallas disponibles por producto (relación uno a muchos)
CREATE TABLE producto_tallas (
  producto_id  INT UNSIGNED NOT NULL,
  talla        VARCHAR(10) NOT NULL,
  orden        TINYINT UNSIGNED NOT NULL DEFAULT 1,
  PRIMARY KEY (producto_id, talla),
  CONSTRAINT fk_talla_producto FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
--  Ventas
-- ------------------------------------------------------------

CREATE TABLE metodos_pago (
  id                   TINYINT UNSIGNED PRIMARY KEY,
  nombre               VARCHAR(60) NOT NULL,
  slug                 VARCHAR(30) NOT NULL UNIQUE,
  instrucciones        VARCHAR(255) NOT NULL,
  requiere_referencia  TINYINT(1) NOT NULL DEFAULT 0,  -- 1 = el cliente escribe el código de operación
  pide_tipo_tarjeta    TINYINT(1) NOT NULL DEFAULT 0,  -- 1 = el cliente elige crédito o débito
  activo               TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB;

CREATE TABLE clientes (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre     VARCHAR(120) NOT NULL,
  email      VARCHAR(120) NOT NULL UNIQUE,
  telefono   VARCHAR(15)  NOT NULL,
  direccion  VARCHAR(200) NOT NULL,
  distrito   VARCHAR(80)  NOT NULL,
  creado_en  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE pedidos (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  codigo           VARCHAR(12) UNIQUE,
  cliente_id       INT UNSIGNED NOT NULL,
  metodo_pago_id   TINYINT UNSIGNED NOT NULL,
  tipo_tarjeta     ENUM('credito','debito') NULL,     -- solo para pago con tarjeta
  subtotal         DECIMAL(10,2) NOT NULL,            -- con los descuentos ya aplicados
  ahorro           DECIMAL(10,2) NOT NULL DEFAULT 0,  -- total descontado
  envio            DECIMAL(8,2)  NOT NULL DEFAULT 0,
  total            DECIMAL(10,2) NOT NULL,
  estado           ENUM('pendiente','pagado','enviado','entregado','cancelado') NOT NULL DEFAULT 'pendiente',
  referencia_pago  VARCHAR(40),
  notas            VARCHAR(255),
  creado_en        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pedido_cliente FOREIGN KEY (cliente_id)     REFERENCES clientes(id),
  CONSTRAINT fk_pedido_metodo  FOREIGN KEY (metodo_pago_id) REFERENCES metodos_pago(id),
  INDEX idx_pedido_fecha (creado_en)
) ENGINE=InnoDB;

CREATE TABLE pedido_detalle (
  id                    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  pedido_id             INT UNSIGNED NOT NULL,
  producto_id           INT UNSIGNED NOT NULL,
  talla                 VARCHAR(10) NOT NULL,
  cantidad              SMALLINT UNSIGNED NOT NULL,
  precio_regular        DECIMAL(8,2) NOT NULL,              -- precio de lista al momento de la compra
  descuento_porcentaje  TINYINT UNSIGNED NOT NULL DEFAULT 0,
  precio_unitario       DECIMAL(8,2) NOT NULL,              -- precio pagado, con descuento
  subtotal              DECIMAL(10,2) NOT NULL,
  CONSTRAINT fk_detalle_pedido   FOREIGN KEY (pedido_id)   REFERENCES pedidos(id) ON DELETE CASCADE,
  CONSTRAINT fk_detalle_producto FOREIGN KEY (producto_id) REFERENCES productos(id),
  CONSTRAINT chk_detalle_cantidad CHECK (cantidad > 0)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
--  Datos iniciales
-- ------------------------------------------------------------

INSERT INTO generos (id, nombre, slug) VALUES
  (1, 'Hombres', 'hombres'),
  (2, 'Mujeres', 'mujeres'),
  (3, 'Niños',   'ninos'),
  (4, 'Unisex',  'unisex');

INSERT INTO tipos (id, nombre, slug) VALUES
  (1, 'Ropa',       'ropa'),
  (2, 'Calzado',    'calzado'),
  (3, 'Accesorios', 'accesorios');

INSERT INTO categorias (id, tipo_id, nombre, slug) VALUES
  (1, 1, 'Polos y tops',          'polos'),
  (2, 1, 'Shorts',                'shorts'),
  (3, 1, 'Pantalones y leggings', 'pantalones'),
  (4, 1, 'Casacas y poleras',     'casacas'),
  (5, 2, 'Zapatillas',            'zapatillas'),
  (6, 3, 'Gorras',                'gorras'),
  (7, 3, 'Mochilas',              'mochilas'),
  (8, 3, 'Tomatodos',             'tomatodos'),
  (9, 3, 'Medias',                'medias');

INSERT INTO colores (id, nombre, slug, hex) VALUES
  (1, 'Negro',    'negro',    '#1B1F27'),
  (2, 'Blanco',   'blanco',   '#F4F4F1'),
  (3, 'Gris',     'gris',     '#7A8494'),
  (4, 'Azul',     'azul',     '#1F4FD8'),
  (5, 'Rojo',     'rojo',     '#D93A3A'),
  (6, 'Verde',    'verde',    '#0CA678'),
  (7, 'Amarillo', 'amarillo', '#F2A900'),
  (8, 'Rosado',   'rosado',   '#D6336C'),
  (9, 'Morado',   'morado',   '#6741D9');

INSERT INTO productos (id, nombre, descripcion, precio, descuento_porcentaje, stock, genero_id, categoria_id, color_id, anio, destacado) VALUES
  -- Hombres
  (1,  'Polo Dry-Fit Andes',           'Tela de secado rápido para entrenamientos intensos.',         59.90,  0, 40, 1, 1, 4, 2026, 1),
  (2,  'Short Running 5 pulgadas',     'Liviano, con malla interior y bolsillo para llaves.',         69.90, 15, 35, 1, 2, 1, 2025, 0),
  (3,  'Jogger Training',              'Algodón con elastano y puños ajustados.',                    119.90,  0, 25, 1, 3, 3, 2026, 0),
  (4,  'Casaca Cortaviento Misti',     'Repele la llovizna y se guarda en su propio bolsillo.',      189.90, 20, 18, 1, 4, 5, 2025, 1),
  (5,  'Zapatillas Runner Pro',        'Amortiguación para asfalto y malla transpirable.',           279.90,  0, 20, 1, 5, 7, 2026, 0),
  (6,  'Polo Manga Larga Térmico',     'Primera capa para entrenar en las mañanas frías.',            79.90, 30, 12, 1, 1, 1, 2024, 0),
  (7,  'Zapatillas Trail Apu',         'Suela con agarre para tierra y piedra suelta.',              319.90, 10,  9, 1, 5, 6, 2025, 0),
  -- Mujeres
  (8,  'Top Deportivo Soporte Medio',  'Tirantes cruzados y copas removibles.',                       64.90,  0, 38, 2, 1, 8, 2026, 1),
  (9,  'Short Ciclista',               'Compresión ligera, no se sube al moverte.',                   59.90,  0, 30, 2, 2, 1, 2026, 0),
  (10, 'Legging Compresión Tiro Alto', 'Cintura alta y tela que no transparenta.',                    99.90, 25, 42, 2, 3, 9, 2025, 1),
  (11, 'Polera Térmica con Capucha',   'Interior afranelado para entrenar en invierno.',             149.90,  0, 22, 2, 4, 6, 2026, 0),
  (12, 'Zapatillas Training Flex',     'Suela flexible para gimnasio y clases funcionales.',         249.90, 15, 16, 2, 5, 8, 2025, 0),
  (13, 'Polo Oversize Algodón',        'Corte holgado para después de entrenar.',                     54.90, 40,  3, 2, 1, 2, 2024, 0),
  (14, 'Casaca Rompeviento Colca',     'Ligera, con capucha y cierres sellados.',                    179.90,  0, 14, 2, 4, 4, 2026, 0),
  -- Niños
  (15, 'Polo Deportivo Junior',        'Suave, fresco y resistente a muchas lavadas.',                39.90,  0, 45, 3, 1, 6, 2026, 0),
  (16, 'Short Fútbol Kids',            'Cintura elástica con cordón y tela ligera.',                  34.90, 10, 40, 3, 2, 4, 2025, 1),
  (17, 'Buzo Escolar Deportivo',       'Pantalón con rodilleras reforzadas.',                         79.90,  0, 30, 3, 3, 3, 2026, 0),
  (18, 'Casaca Liviana Kids',          'Con capucha y cierre fácil de subir.',                       109.90, 20, 20, 3, 4, 7, 2025, 0),
  (19, 'Zapatillas Kids Velcro',       'Se ponen solas: doble velcro y suela antideslizante.',       139.90,  0, 24, 3, 5, 5, 2026, 1),
  (20, 'Tomatodo Infantil 500 ml',     'Libre de BPA, con tapa a prueba de derrames.',                24.90, 30,  0, 3, 8, 6, 2024, 0),
  -- Unisex
  (21, 'Gorra Deportiva Ajustable',    'Visera curva y tela que absorbe el sudor.',                   39.90,  0, 50, 4, 6, 4, 2026, 0),
  (22, 'Mochila Gym 20 L',             'Compartimento separado para zapatillas.',                     89.90, 15, 28, 4, 7, 1, 2025, 1),
  (23, 'Tomatodo Térmico 750 ml',      'Acero inoxidable: mantiene el agua fría 12 horas.',           49.90,  0, 60, 4, 8, 3, 2026, 0),
  (24, 'Medias Running Pack x3',       'Sin costuras en la punta, con soporte en el arco.',           29.90,  0, 80, 4, 9, 2, 2026, 0);

-- Tallas de ropa para adultos
INSERT INTO producto_tallas (producto_id, talla, orden)
SELECT p.id, t.talla, t.orden
FROM productos p
CROSS JOIN (SELECT 'S' AS talla, 1 AS orden UNION ALL SELECT 'M', 2 UNION ALL SELECT 'L', 3 UNION ALL SELECT 'XL', 4) t
WHERE p.genero_id IN (1, 2) AND p.categoria_id IN (1, 2, 3, 4);

-- Tallas de ropa para niños
INSERT INTO producto_tallas (producto_id, talla, orden)
SELECT p.id, t.talla, t.orden
FROM productos p
CROSS JOIN (SELECT '6' AS talla, 1 AS orden UNION ALL SELECT '8', 2 UNION ALL SELECT '10', 3 UNION ALL SELECT '12', 4 UNION ALL SELECT '14', 5) t
WHERE p.genero_id = 3 AND p.categoria_id IN (1, 2, 3, 4);

-- Tallas de zapatillas
INSERT INTO producto_tallas (producto_id, talla, orden)
SELECT p.id, t.talla, t.orden
FROM productos p
CROSS JOIN (SELECT '39' AS talla, 1 AS orden UNION ALL SELECT '40', 2 UNION ALL SELECT '41', 3 UNION ALL SELECT '42', 4 UNION ALL SELECT '43', 5) t
WHERE p.genero_id = 1 AND p.categoria_id = 5;

INSERT INTO producto_tallas (producto_id, talla, orden)
SELECT p.id, t.talla, t.orden
FROM productos p
CROSS JOIN (SELECT '36' AS talla, 1 AS orden UNION ALL SELECT '37', 2 UNION ALL SELECT '38', 3 UNION ALL SELECT '39', 4) t
WHERE p.genero_id = 2 AND p.categoria_id = 5;

INSERT INTO producto_tallas (producto_id, talla, orden)
SELECT p.id, t.talla, t.orden
FROM productos p
CROSS JOIN (SELECT '28' AS talla, 1 AS orden UNION ALL SELECT '30', 2 UNION ALL SELECT '32', 3 UNION ALL SELECT '34', 4) t
WHERE p.genero_id = 3 AND p.categoria_id = 5;

-- Accesorios: talla única
INSERT INTO producto_tallas (producto_id, talla, orden)
SELECT p.id, 'Única', 1
FROM productos p
JOIN categorias c ON c.id = p.categoria_id
WHERE c.tipo_id = 3;

-- Los números de celular y de cuenta son de ejemplo: cámbialos por los reales
INSERT INTO metodos_pago (id, nombre, slug, instrucciones, requiere_referencia, pide_tipo_tarjeta) VALUES
  (1, 'Tarjeta de crédito o débito', 'tarjeta',       'Al confirmar el pedido te enviamos por WhatsApp un enlace de pago seguro. Por tu seguridad no pedimos los datos de la tarjeta en esta página.', 0, 1),
  (2, 'Yape',                        'yape',          'Yapea el total al 999 999 999 (Kallpa Sport) y escribe el código de operación.', 1, 0),
  (3, 'Plin',                        'plin',          'Envía el total por Plin al 999 999 999 (Kallpa Sport) y escribe el código de operación.', 1, 0),
  (4, 'Transferencia bancaria',      'transferencia', 'Transfiere el total a la cuenta corriente en soles 000-0000000-0-00 y escribe el número de operación.', 1, 0),
  (5, 'Pago contra entrega',         'contraentrega', 'Pagas en efectivo al recibir tu pedido. Disponible solo en Lima Metropolitana.', 0, 0);
