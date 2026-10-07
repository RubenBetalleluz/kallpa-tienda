/* Kallpa Sport - Configuración general de la tienda.
   Cambia aquí el número de WhatsApp y las reglas de envío. */
const CONFIG = {
  tienda: 'Kallpa Sport',
  // Número de WhatsApp con código de país (51 = Perú), sin "+" ni espacios
  whatsapp: '51999999999',
  // Carpeta donde está la API en PHP que consulta la base de datos
  api: 'api',
  moneda: 'S/',
  // Deben coincidir con las constantes de api/config.php
  envioGratisDesde: 199,
  costoEnvio: 10,
  claveCarrito: 'kallpa_carrito_v2',
  maximoPorProducto: 20,
  // Opciones del filtro de precio, en soles
  preciosFiltro: [30, 50, 80, 100, 150, 200, 300],
  // Con esta cantidad o menos se muestra "Últimas unidades"
  stockBajo: 5
};
