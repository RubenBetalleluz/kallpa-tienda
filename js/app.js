/* Kallpa Sport - Funciones compartidas por todas las páginas:
   utilidades, ilustraciones, carrito (localStorage), conexión con la API y WhatsApp. */

// ---------- Utilidades ----------

/** Escapa texto antes de insertarlo como HTML (los datos vienen de la base de datos). */
function esc(texto) {
  return String(texto ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

function precio(valor) {
  return `${CONFIG.moneda} ${Number(valor).toFixed(2)}`;
}

function colorSeguro(color) {
  return /^#[0-9a-f]{6}$/i.test(color) ? color : '#1F4FD8';
}

/** Enlace que abre WhatsApp con un mensaje ya escrito. */
function enlaceWhatsApp(mensaje) {
  return `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(mensaje)}`;
}

// ---------- Ilustración de cada producto según su categoría ----------

const SILUETAS = {
  polos: '<path d="M30 14 42 10Q50 20 58 10L70 14 90 30 80 46 72 40V90H28V40L20 46 10 30Z"/>',
  shorts: '<path d="M22 20H78L88 80H56L50 46 44 80H12Z"/><path class="detalle" d="M23 30H77"/>',
  pantalones: '<path d="M30 8H70L76 92H58L50 34 42 92H24Z"/><path class="detalle" d="M30 18H70"/>',
  casacas: '<path d="M32 12 44 8 50 16 56 8 68 12 84 24 92 78 80 82 72 44V92H28V44L20 82 8 78 16 24Z"/><path class="detalle" d="M50 16V92"/>',
  zapatillas: '<path d="M8 68V54Q8 46 18 46L34 30Q40 26 44 32 52 46 70 52L86 58Q94 62 94 68Z"/><path class="suela" d="M6 70H94V76Q94 82 88 82H12Q6 82 6 76Z"/>',
  gorras: '<path d="M14 64Q14 26 50 26 80 26 83 58L96 64Q96 72 88 72H14Z"/><path class="detalle" d="M14 58H83"/>',
  mochilas: '<path d="M32 30Q32 12 50 12 68 12 68 30V32Q84 34 84 50V84Q84 90 78 90H22Q16 90 16 84V50Q16 34 32 32Z"/><path class="detalle" d="M30 58H70V78H30Z"/>',
  tomatodos: '<path d="M42 8H58V20Q67 24 67 34V86Q67 92 61 92H39Q33 92 33 86V34Q33 24 42 20Z"/><path class="detalle" d="M42 20H58M33 44H67"/>',
  medias: '<path d="M36 8H62V50L80 70Q87 79 79 87 71 94 62 87L38 66Q36 64 36 60Z"/><path class="detalle" d="M36 20H62"/>'
};

function ilustracion(producto) {
  const forma = SILUETAS[producto.categoria] || SILUETAS.polos;
  return `<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false" style="--prenda:${colorSeguro(producto.color_hex)}">${forma}</svg>`;
}

// ---------- Carrito (se guarda en el navegador con localStorage) ----------

const Carrito = {
  leer() {
    try {
      const guardado = JSON.parse(localStorage.getItem(CONFIG.claveCarrito));
      return Array.isArray(guardado) ? guardado : [];
    } catch (error) {
      return [];
    }
  },

  guardar(items) {
    try {
      localStorage.setItem(CONFIG.claveCarrito, JSON.stringify(items));
    } catch (error) {
      /* Si el navegador bloquea el almacenamiento, el carrito no se conserva */
    }
    actualizarContador();
  },

  agregar(producto, talla, cantidad = 1) {
    const items = this.leer();
    const existente = items.find((i) => i.id === producto.id && i.talla === talla);
    if (existente) {
      existente.cantidad = Math.min(existente.cantidad + cantidad, CONFIG.maximoPorProducto);
    } else {
      items.push({
        id: producto.id,
        nombre: producto.nombre,
        precio: producto.precio_final,          // precio que se paga, con descuento
        precio_regular: producto.precio,
        descuento: producto.descuento_porcentaje,
        color_hex: producto.color_hex,
        color_nombre: producto.color_nombre,
        categoria: producto.categoria,
        genero_nombre: producto.genero_nombre,
        talla,
        cantidad
      });
    }
    this.guardar(items);
  },

  cambiarCantidad(id, talla, cantidad) {
    const items = this.leer();
    const item = items.find((i) => i.id === id && i.talla === talla);
    if (!item) return;
    item.cantidad = Math.max(1, Math.min(cantidad, CONFIG.maximoPorProducto));
    this.guardar(items);
  },

  quitar(id, talla) {
    this.guardar(this.leer().filter((i) => !(i.id === id && i.talla === talla)));
  },

  vaciar() {
    this.guardar([]);
  },

  unidades() {
    return this.leer().reduce((suma, i) => suma + i.cantidad, 0);
  },

  subtotal() {
    return this.leer().reduce((suma, i) => suma + i.precio * i.cantidad, 0);
  },

  /** Total descontado respecto al precio regular. */
  ahorro() {
    return this.leer().reduce((suma, i) => suma + (i.precio_regular - i.precio) * i.cantidad, 0);
  },

  envio(subtotal) {
    return subtotal >= CONFIG.envioGratisDesde ? 0 : CONFIG.costoEnvio;
  }
};

// ---------- Filtros aplicados sobre los datos de demostración ----------
// Hace lo mismo que la consulta SQL de api/productos.php

function filtrarDemo(filtros) {
  const lista = (valor) => valor || [];
  const numero = (valor) => (valor === '' || valor == null ? null : Number(valor));
  const generos = lista(filtros.genero);
  const tipos = lista(filtros.tipo);
  const colores = lista(filtros.color);
  const precioMin = numero(filtros.precio_min);
  const precioMax = numero(filtros.precio_max);
  const anioMin = numero(filtros.anio_min);
  const anioMax = numero(filtros.anio_max);
  const texto = (filtros.q || '').trim().toLowerCase();

  const resultado = DATOS_DEMO.productos.filter((p) =>
    (generos.length === 0 || generos.includes(p.genero)) &&
    (tipos.length === 0 || tipos.includes(p.tipo)) &&
    (colores.length === 0 || colores.includes(p.color)) &&
    (!filtros.categoria || p.categoria === filtros.categoria) &&
    (filtros.descuento !== '1' || p.descuento_porcentaje > 0) &&
    (precioMin === null || p.precio_final >= precioMin) &&
    (precioMax === null || p.precio_final <= precioMax) &&
    (anioMin === null || p.anio >= anioMin) &&
    (anioMax === null || p.anio <= anioMax) &&
    (!texto || `${p.nombre} ${p.descripcion} ${p.categoria_nombre}`.toLowerCase().includes(texto))
  );

  const ordenes = {
    'precio-menor': (a, b) => a.precio_final - b.precio_final,
    'precio-mayor': (a, b) => b.precio_final - a.precio_final,
    descuento: (a, b) => b.descuento_porcentaje - a.descuento_porcentaje || a.precio_final - b.precio_final,
    anio: (a, b) => b.anio - a.anio || a.id - b.id
  };
  const porDefecto = (a, b) => Number(b.destacado) - Number(a.destacado) || a.id - b.id;
  return resultado.sort(ordenes[filtros.orden] || porDefecto);
}

function catalogosDemo() {
  const productos = DATOS_DEMO.productos;
  const precios = productos.map((p) => p.precio_final);
  const anios = productos.map((p) => p.anio);
  return {
    generos: DATOS_DEMO.generos.map((g) => ({ ...g, total: productos.filter((p) => p.genero === g.slug).length })),
    tipos: DATOS_DEMO.tipos,
    categorias: DATOS_DEMO.categorias,
    colores: DATOS_DEMO.colores.filter((c) => productos.some((p) => p.color === c.slug)),
    rango: {
      precio_min: Math.min(...precios), precio_max: Math.max(...precios),
      anio_min: Math.min(...anios), anio_max: Math.max(...anios)
    }
  };
}

// ---------- Conexión con la API en PHP (base de datos MySQL) ----------

const API = {
  modo: null, // 'mysql' cuando responde la base de datos, 'demo' cuando no

  async pedir(ruta) {
    const respuesta = await fetch(`${CONFIG.api}/${ruta}`, { headers: { Accept: 'application/json' } });
    if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
    return respuesta.json();
  },

  /** Intenta leer de la base de datos; si no hay conexión usa los datos de demostración. */
  async leer(ruta, respaldo) {
    if (this.modo !== 'demo') {
      try {
        const datos = await this.pedir(ruta);
        this.cambiarModo('mysql');
        return datos;
      } catch (error) {
        this.cambiarModo('demo');
      }
    }
    return respaldo();
  },

  cambiarModo(modo) {
    this.modo = modo;
    const estado = document.getElementById('estado-conexion');
    if (!estado) return;
    estado.textContent = modo === 'mysql'
      ? 'Catálogo conectado a la base de datos MySQL.'
      : 'Modo demostración: catálogo de ejemplo, sin conexión a la base de datos.';
    estado.dataset.modo = modo;
  },

  catalogos() {
    return this.leer('catalogos.php', catalogosDemo);
  },

  /** Lista de productos. Los filtros viajan en la URL y la API los aplica en la consulta SQL. */
  productos(filtros = {}) {
    const parametros = new URLSearchParams();
    Object.entries(filtros).forEach(([clave, valor]) => {
      if (Array.isArray(valor)) {
        if (valor.length) parametros.set(clave, valor.join(','));
      } else if (valor !== '' && valor != null) {
        parametros.set(clave, valor);
      }
    });
    const consulta = parametros.toString();
    return this.leer(`productos.php${consulta ? '?' + consulta : ''}`, () => filtrarDemo(filtros));
  },

  metodosPago() {
    return this.leer('metodos_pago.php', () => DATOS_DEMO.metodosPago);
  },

  /** Registra el pedido en la base de datos. En modo demostración solo lo simula. */
  async crearPedido(pedido) {
    if (this.modo === null) await this.metodosPago();

    if (this.modo === 'demo') {
      let subtotal = 0;
      let ahorro = 0;
      pedido.items.forEach((item) => {
        const producto = DATOS_DEMO.productos.find((p) => p.id === item.producto_id);
        if (!producto) return;
        subtotal += producto.precio_final * item.cantidad;
        ahorro += (producto.precio - producto.precio_final) * item.cantidad;
      });
      const envio = Carrito.envio(subtotal);
      const metodo = DATOS_DEMO.metodosPago.find((m) => m.slug === pedido.metodo_pago);
      return {
        ok: true,
        demo: true,
        codigo: `DEMO-${Math.floor(1000 + Math.random() * 9000)}`,
        subtotal,
        ahorro,
        envio,
        total: subtotal + envio,
        metodo_pago: metodo ? metodo.nombre : pedido.metodo_pago,
        tipo_tarjeta: metodo && metodo.pide_tipo_tarjeta ? pedido.tipo_tarjeta : null
      };
    }

    const respuesta = await fetch(`${CONFIG.api}/pedidos.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(pedido)
    });
    let datos = null;
    try { datos = await respuesta.json(); } catch (error) { /* respuesta sin JSON */ }
    if (!respuesta.ok || !datos || !datos.ok) {
      throw new Error(datos && datos.error ? datos.error : 'No se pudo registrar el pedido. Inténtalo de nuevo.');
    }
    return datos;
  }
};

// ---------- Elementos comunes de la interfaz ----------

function actualizarContador() {
  const unidades = Carrito.unidades();
  document.querySelectorAll('[data-contador-carrito]').forEach((el) => {
    el.textContent = unidades;
    el.hidden = unidades === 0;
  });
  const enlace = document.querySelector('.enlace-carrito');
  if (enlace) {
    enlace.setAttribute('aria-label', unidades === 1 ? 'Carrito, 1 producto' : `Carrito, ${unidades} productos`);
  }
}

let temporizadorAviso;
function aviso(mensaje) {
  let caja = document.getElementById('aviso');
  if (!caja) {
    caja = document.createElement('div');
    caja.id = 'aviso';
    caja.className = 'aviso';
    caja.setAttribute('role', 'status');
    caja.setAttribute('aria-live', 'polite');
    document.body.appendChild(caja);
  }
  caja.textContent = mensaje;
  caja.classList.add('visible');
  clearTimeout(temporizadorAviso);
  temporizadorAviso = setTimeout(() => caja.classList.remove('visible'), 2600);
}

document.addEventListener('DOMContentLoaded', () => {
  actualizarContador();

  // Enlaces a WhatsApp: <a data-whatsapp="mensaje">
  document.querySelectorAll('[data-whatsapp]').forEach((enlace) => {
    enlace.href = enlaceWhatsApp(enlace.dataset.whatsapp);
    enlace.target = '_blank';
    enlace.rel = 'noopener';
  });

  // Menú en pantallas pequeñas
  const botonMenu = document.querySelector('.boton-menu');
  const menu = document.getElementById('menu');
  if (botonMenu && menu) {
    botonMenu.addEventListener('click', () => {
      const abierto = menu.classList.toggle('abierto');
      botonMenu.setAttribute('aria-expanded', String(abierto));
    });
  }

  // El carrito se actualiza si se modifica en otra pestaña
  window.addEventListener('storage', actualizarContador);
});
