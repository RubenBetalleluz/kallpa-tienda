# Kallpa Sport - Tienda de ropa y accesorios deportivos

Tienda web de ropa, calzado y accesorios deportivos, con catálogo conectado a
una base de datos SQL, filtros combinables, carrito de compras, varios métodos
de pago y contacto por WhatsApp.

**Tecnologías:** HTML5, CSS3, JavaScript (sin frameworks), PHP con PDO y MySQL.

## Qué incluye

- **Catálogo** con 24 productos de ejemplo. Cada uno tiene categoría, nombre,
  precio, descuento, color, artículos disponibles, tallas y año de producción.
- **Filtros**, que se pueden combinar:
  - Sexo: hombres, mujeres, niños y unisex.
  - Tipo de producto: ropa, calzado y accesorios, con su categoría.
  - Color, con muestras de cada color.
  - Solo productos con descuento.
  - Rango de precios, sobre el precio ya rebajado.
  - Año de producción, con desde y hasta.
  - Búsqueda por texto y orden por precio, descuento o año.
- **Stock visible**: unidades disponibles, aviso de últimas unidades y productos agotados.
- **Carrito** con tallas, cantidades, precio rebajado y total ahorrado.
- **Métodos de pago:** tarjeta de crédito o débito, Yape, Plin, transferencia
  bancaria y pago contra entrega.
- **Pedido** guardado en la base de datos, con control de stock.
- **Contacto por WhatsApp** y envío del pedido confirmado por chat.
- Diseño adaptable a celular, tablet y computadora.

Los filtros quedan en la dirección de la página, así que un resultado se puede
compartir o guardar. Por ejemplo:
`index.html?genero=mujeres&tipo=ropa&descuento=1&precio_max=100`

## Estructura

```
kallpa-tienda/
├── index.html              Inicio y catálogo con filtros
├── carrito.html            Carrito, datos de entrega y pago
├── contacto.html           Contacto por WhatsApp
├── css/estilos.css
├── js/
│   ├── config.js           WhatsApp, envío y opciones del filtro de precio
│   ├── app.js              Carrito, conexión con la API y utilidades
│   ├── tienda.js           Filtros y resultados
│   ├── carrito.js          Carrito y registro del pedido
│   ├── contacto.js         Mensajes de WhatsApp
│   └── datos-demo.js       Catálogo de respaldo sin base de datos
├── api/                    PHP que conecta la página con MySQL
│   ├── config.php          Datos de conexión
│   ├── productos.php       GET  productos con filtros
│   ├── catalogos.php       GET  opciones de los filtros
│   ├── metodos_pago.php    GET  formas de pago
│   └── pedidos.php         POST registra el pedido
└── database/
    ├── kallpa_sport.sql        Tablas y datos iniciales
    └── consultas_reportes.sql  Consultas de ejemplo y reportes
```

## Cómo ejecutarlo con XAMPP

1. Copia la carpeta `kallpa-tienda` dentro de `C:\xampp\htdocs\`.
2. Abre el panel de XAMPP e inicia **Apache** y **MySQL**.
3. Entra a `http://localhost/phpmyadmin`, abre la pestaña **Importar** y
   selecciona `database/kallpa_sport.sql`. El script crea la base de datos
   `kallpa_sport` con sus tablas y productos.
4. Abre `http://localhost/kallpa-tienda/`.

En el pie de página debe aparecer "Catálogo conectado a la base de datos MySQL".
Si tu MySQL tiene otro usuario o contraseña, cámbialos en `api/config.php`.

**Si ya importaste la versión anterior de Kallpa Sport:** este script usa el
mismo nombre de base de datos y la reemplaza, porque las tablas cambiaron.

### Modo demostración

Si abres `index.html` con doble clic, sin XAMPP, la tienda funciona con el
catálogo de `js/datos-demo.js` y los pedidos solo se simulan. Sirve para
revisar el diseño y los filtros; para guardar pedidos se necesita la base de datos.

## Cómo funcionan los filtros

Cada vez que cambias un filtro, `js/tienda.js` llama a `api/productos.php` con
los valores elegidos y PHP arma la consulta SQL con sentencias preparadas:

```sql
SELECT p.nombre, p.precio, p.descuento_porcentaje,
       ROUND(p.precio * (100 - p.descuento_porcentaje) / 100, 2) AS precio_final, ...
FROM productos p
JOIN generos g    ON g.id = p.genero_id
JOIN categorias c ON c.id = p.categoria_id
JOIN tipos t      ON t.id = c.tipo_id
JOIN colores co   ON co.id = p.color_id
WHERE p.activo = 1
  AND g.slug  IN (?, ?)                -- sexo
  AND t.slug  IN (?)                   -- tipo de producto
  AND co.slug IN (?, ?)                -- color
  AND p.descuento_porcentaje > 0       -- solo con descuento
  AND ROUND(p.precio * (100 - p.descuento_porcentaje) / 100, 2) >= ?   -- precio mínimo
  AND ROUND(p.precio * (100 - p.descuento_porcentaje) / 100, 2) <= ?   -- precio máximo
  AND p.anio >= ? AND p.anio <= ?      -- año de producción
```

## Base de datos

| Tabla | Contenido |
|---|---|
| `generos` | Sexo del producto: hombres, mujeres, niños, unisex |
| `tipos` | Ropa, calzado, accesorios |
| `categorias` | Polos, shorts, zapatillas, gorras, mochilas... cada una con su tipo |
| `colores` | Nombre y código de cada color |
| `productos` | Nombre, precio, descuento, stock, sexo, categoría, color y año |
| `producto_tallas` | Tallas disponibles de cada producto |
| `metodos_pago` | Formas de pago e instrucciones |
| `clientes` | Datos de quien compra |
| `pedidos` | Cliente, pago, tipo de tarjeta, ahorro, totales y estado |
| `pedido_detalle` | Productos de cada pedido con el precio y el descuento del momento |

Para agregar un producto basta un `INSERT` en `productos` y sus tallas en
`producto_tallas`; aparece en el catálogo y en los filtros sin tocar el código.
Para poner una oferta, se cambia `descuento_porcentaje`.

Al registrar un pedido, `api/pedidos.php` valida los datos, calcula precios y
descuentos con los valores de la base de datos, verifica el stock y guarda
todo dentro de una transacción.

## Antes de usarlo de verdad

- **Pago con tarjeta:** la tienda registra si el cliente paga con crédito o
  débito, pero no pide ni guarda el número de la tarjeta. Guardar esos datos
  exige cumplir la norma PCI DSS, así que para cobrar en línea hay que integrar
  una pasarela de pagos (por ejemplo Culqi, Mercado Pago, Izipay o Niubiz).
- **WhatsApp:** cambia el número en `js/config.js` (formato `51` + celular).
- **Yape, Plin y cuenta bancaria:** los números del script SQL son de ejemplo.
- **Fotos:** los productos usan ilustraciones. Se pueden reemplazar por fotos
  agregando una columna `imagen` a la tabla `productos`.

## Ideas para ampliarlo

- Panel de administración para productos, ofertas y pedidos.
- Stock por talla y varios colores por producto.
- Cupones de descuento.
- Inicio de sesión de clientes e historial de compras.
