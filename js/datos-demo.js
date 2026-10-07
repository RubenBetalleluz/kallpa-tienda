/* Kallpa Sport - Datos de demostración.
   Se usan solo cuando la página no puede conectarse a la base de datos
   (por ejemplo, al abrir index.html directamente sin XAMPP).
   Son una copia de los datos de database/kallpa_sport.sql. */
const DATOS_DEMO = (() => {
  const generos = [
    { nombre: 'Hombres', slug: 'hombres' },
    { nombre: 'Mujeres', slug: 'mujeres' },
    { nombre: 'Niños', slug: 'ninos' },
    { nombre: 'Unisex', slug: 'unisex' }
  ];

  const tipos = [
    { nombre: 'Ropa', slug: 'ropa' },
    { nombre: 'Calzado', slug: 'calzado' },
    { nombre: 'Accesorios', slug: 'accesorios' }
  ];

  const categorias = [
    { nombre: 'Polos y tops', slug: 'polos', tipo: 'ropa' },
    { nombre: 'Shorts', slug: 'shorts', tipo: 'ropa' },
    { nombre: 'Pantalones y leggings', slug: 'pantalones', tipo: 'ropa' },
    { nombre: 'Casacas y poleras', slug: 'casacas', tipo: 'ropa' },
    { nombre: 'Zapatillas', slug: 'zapatillas', tipo: 'calzado' },
    { nombre: 'Gorras', slug: 'gorras', tipo: 'accesorios' },
    { nombre: 'Mochilas', slug: 'mochilas', tipo: 'accesorios' },
    { nombre: 'Tomatodos', slug: 'tomatodos', tipo: 'accesorios' },
    { nombre: 'Medias', slug: 'medias', tipo: 'accesorios' }
  ];

  const colores = [
    { nombre: 'Negro', slug: 'negro', hex: '#1B1F27' },
    { nombre: 'Blanco', slug: 'blanco', hex: '#F4F4F1' },
    { nombre: 'Gris', slug: 'gris', hex: '#7A8494' },
    { nombre: 'Azul', slug: 'azul', hex: '#1F4FD8' },
    { nombre: 'Rojo', slug: 'rojo', hex: '#D93A3A' },
    { nombre: 'Verde', slug: 'verde', hex: '#0CA678' },
    { nombre: 'Amarillo', slug: 'amarillo', hex: '#F2A900' },
    { nombre: 'Rosado', slug: 'rosado', hex: '#D6336C' },
    { nombre: 'Morado', slug: 'morado', hex: '#6741D9' }
  ];

  const metodosPago = [
    { nombre: 'Tarjeta de crédito o débito', slug: 'tarjeta', requiere_referencia: false, pide_tipo_tarjeta: true,
      instrucciones: 'Al confirmar el pedido te enviamos por WhatsApp un enlace de pago seguro. Por tu seguridad no pedimos los datos de la tarjeta en esta página.' },
    { nombre: 'Yape', slug: 'yape', requiere_referencia: true, pide_tipo_tarjeta: false,
      instrucciones: 'Yapea el total al 999 999 999 (Kallpa Sport) y escribe el código de operación.' },
    { nombre: 'Plin', slug: 'plin', requiere_referencia: true, pide_tipo_tarjeta: false,
      instrucciones: 'Envía el total por Plin al 999 999 999 (Kallpa Sport) y escribe el código de operación.' },
    { nombre: 'Transferencia bancaria', slug: 'transferencia', requiere_referencia: true, pide_tipo_tarjeta: false,
      instrucciones: 'Transfiere el total a la cuenta corriente en soles 000-0000000-0-00 y escribe el número de operación.' },
    { nombre: 'Pago contra entrega', slug: 'contraentrega', requiere_referencia: false, pide_tipo_tarjeta: false,
      instrucciones: 'Pagas en efectivo al recibir tu pedido. Disponible solo en Lima Metropolitana.' }
  ];

  // [nombre, descripción, precio, descuento %, stock, sexo, categoría, color, año, destacado]
  const filas = [
    ['Polo Dry-Fit Andes', 'Tela de secado rápido para entrenamientos intensos.', 59.90, 0, 40, 'hombres', 'polos', 'azul', 2026, true],
    ['Short Running 5 pulgadas', 'Liviano, con malla interior y bolsillo para llaves.', 69.90, 15, 35, 'hombres', 'shorts', 'negro', 2025, false],
    ['Jogger Training', 'Algodón con elastano y puños ajustados.', 119.90, 0, 25, 'hombres', 'pantalones', 'gris', 2026, false],
    ['Casaca Cortaviento Misti', 'Repele la llovizna y se guarda en su propio bolsillo.', 189.90, 20, 18, 'hombres', 'casacas', 'rojo', 2025, true],
    ['Zapatillas Runner Pro', 'Amortiguación para asfalto y malla transpirable.', 279.90, 0, 20, 'hombres', 'zapatillas', 'amarillo', 2026, false],
    ['Polo Manga Larga Térmico', 'Primera capa para entrenar en las mañanas frías.', 79.90, 30, 12, 'hombres', 'polos', 'negro', 2024, false],
    ['Zapatillas Trail Apu', 'Suela con agarre para tierra y piedra suelta.', 319.90, 10, 9, 'hombres', 'zapatillas', 'verde', 2025, false],
    ['Top Deportivo Soporte Medio', 'Tirantes cruzados y copas removibles.', 64.90, 0, 38, 'mujeres', 'polos', 'rosado', 2026, true],
    ['Short Ciclista', 'Compresión ligera, no se sube al moverte.', 59.90, 0, 30, 'mujeres', 'shorts', 'negro', 2026, false],
    ['Legging Compresión Tiro Alto', 'Cintura alta y tela que no transparenta.', 99.90, 25, 42, 'mujeres', 'pantalones', 'morado', 2025, true],
    ['Polera Térmica con Capucha', 'Interior afranelado para entrenar en invierno.', 149.90, 0, 22, 'mujeres', 'casacas', 'verde', 2026, false],
    ['Zapatillas Training Flex', 'Suela flexible para gimnasio y clases funcionales.', 249.90, 15, 16, 'mujeres', 'zapatillas', 'rosado', 2025, false],
    ['Polo Oversize Algodón', 'Corte holgado para después de entrenar.', 54.90, 40, 3, 'mujeres', 'polos', 'blanco', 2024, false],
    ['Casaca Rompeviento Colca', 'Ligera, con capucha y cierres sellados.', 179.90, 0, 14, 'mujeres', 'casacas', 'azul', 2026, false],
    ['Polo Deportivo Junior', 'Suave, fresco y resistente a muchas lavadas.', 39.90, 0, 45, 'ninos', 'polos', 'verde', 2026, false],
    ['Short Fútbol Kids', 'Cintura elástica con cordón y tela ligera.', 34.90, 10, 40, 'ninos', 'shorts', 'azul', 2025, true],
    ['Buzo Escolar Deportivo', 'Pantalón con rodilleras reforzadas.', 79.90, 0, 30, 'ninos', 'pantalones', 'gris', 2026, false],
    ['Casaca Liviana Kids', 'Con capucha y cierre fácil de subir.', 109.90, 20, 20, 'ninos', 'casacas', 'amarillo', 2025, false],
    ['Zapatillas Kids Velcro', 'Se ponen solas: doble velcro y suela antideslizante.', 139.90, 0, 24, 'ninos', 'zapatillas', 'rojo', 2026, true],
    ['Tomatodo Infantil 500 ml', 'Libre de BPA, con tapa a prueba de derrames.', 24.90, 30, 0, 'ninos', 'tomatodos', 'verde', 2024, false],
    ['Gorra Deportiva Ajustable', 'Visera curva y tela que absorbe el sudor.', 39.90, 0, 50, 'unisex', 'gorras', 'azul', 2026, false],
    ['Mochila Gym 20 L', 'Compartimento separado para zapatillas.', 89.90, 15, 28, 'unisex', 'mochilas', 'negro', 2025, true],
    ['Tomatodo Térmico 750 ml', 'Acero inoxidable: mantiene el agua fría 12 horas.', 49.90, 0, 60, 'unisex', 'tomatodos', 'gris', 2026, false],
    ['Medias Running Pack x3', 'Sin costuras en la punta, con soporte en el arco.', 29.90, 0, 80, 'unisex', 'medias', 'blanco', 2026, false]
  ];

  // Misma regla de tallas que el script SQL
  function tallasDe(genero, categoria, tipo) {
    if (tipo === 'accesorios') return ['Única'];
    if (categoria === 'zapatillas') {
      if (genero === 'hombres') return ['39', '40', '41', '42', '43'];
      if (genero === 'mujeres') return ['36', '37', '38', '39'];
      return ['28', '30', '32', '34'];
    }
    return genero === 'ninos' ? ['6', '8', '10', '12', '14'] : ['S', 'M', 'L', 'XL'];
  }

  const buscar = (lista, slug) => lista.find((x) => x.slug === slug);

  const productos = filas.map((f, indice) => {
    const categoria = buscar(categorias, f[6]);
    const color = buscar(colores, f[7]);
    return {
      id: indice + 1,
      nombre: f[0], descripcion: f[1],
      precio: f[2], descuento_porcentaje: f[3],
      // Se calcula en céntimos para redondear igual que ROUND() en SQL
      precio_final: Math.round(Math.round(f[2] * 100) * (100 - f[3]) / 100) / 100,
      stock: f[4], anio: f[8], destacado: f[9],
      genero: f[5], genero_nombre: buscar(generos, f[5]).nombre,
      tipo: categoria.tipo, tipo_nombre: buscar(tipos, categoria.tipo).nombre,
      categoria: f[6], categoria_nombre: categoria.nombre,
      color: f[7], color_nombre: color.nombre, color_hex: color.hex,
      tallas: tallasDe(f[5], f[6], categoria.tipo)
    };
  });

  return { generos, tipos, categorias, colores, metodosPago, productos };
})();
