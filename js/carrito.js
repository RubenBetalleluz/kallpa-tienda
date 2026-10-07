/* Kallpa Sport - Página del carrito: productos elegidos, datos de entrega,
   métodos de pago y registro del pedido en la base de datos. */

const vista = {};
let metodosPago = [];

document.addEventListener('DOMContentLoaded', async () => {
  vista.lleno = document.getElementById('carrito-lleno');
  vista.vacio = document.getElementById('carrito-vacio');
  vista.lista = document.getElementById('lista-carrito');
  vista.subtotal = document.getElementById('resumen-subtotal');
  vista.ahorro = document.getElementById('resumen-ahorro');
  vista.envio = document.getElementById('resumen-envio');
  vista.total = document.getElementById('resumen-total');
  vista.notaEnvio = document.getElementById('nota-envio');
  vista.formulario = document.getElementById('formulario-pedido');
  vista.metodos = document.getElementById('metodos-pago');
  vista.instrucciones = document.getElementById('pago-instrucciones');
  vista.bloqueTarjeta = document.getElementById('bloque-tarjeta');
  vista.campoReferencia = document.getElementById('campo-referencia');
  vista.referencia = document.getElementById('referencia');
  vista.error = document.getElementById('error-pedido');
  vista.confirmar = document.getElementById('confirmar-pedido');
  vista.confirmacion = document.getElementById('confirmacion');

  pintarCarrito();
  conectarCarrito();

  metodosPago = await API.metodosPago();
  pintarMetodosPago();
});

function pintarCarrito() {
  const items = Carrito.leer();
  const hayProductos = items.length > 0;
  vista.lleno.hidden = !hayProductos;
  vista.vacio.hidden = hayProductos || !vista.confirmacion.hidden;
  if (!hayProductos) return;

  vista.lista.innerHTML = items.map((item) => `
    <li class="linea" data-id="${item.id}" data-talla="${esc(item.talla)}">
      <div class="linea-visual">${ilustracion(item)}</div>
      <div class="linea-datos">
        <h3>${esc(item.nombre)}</h3>
        <p>${esc(item.genero_nombre)}, ${esc(item.color_nombre).toLowerCase()}, talla ${esc(item.talla)}</p>
        <p class="linea-unitario">
          ${item.descuento > 0 ? `<span class="linea-antes">${precio(item.precio_regular)}</span> ` : ''}${precio(item.precio)} cada uno${item.descuento > 0 ? ` (-${item.descuento} %)` : ''}
        </p>
      </div>
      <div class="cantidad">
        <button type="button" data-restar aria-label="Quitar una unidad de ${esc(item.nombre)}" ${item.cantidad <= 1 ? 'disabled' : ''}>−</button>
        <output aria-label="Cantidad">${item.cantidad}</output>
        <button type="button" data-sumar aria-label="Agregar una unidad de ${esc(item.nombre)}" ${item.cantidad >= CONFIG.maximoPorProducto ? 'disabled' : ''}>+</button>
      </div>
      <p class="linea-importe">${precio(item.precio * item.cantidad)}</p>
      <button type="button" class="enlace-boton" data-quitar>Quitar</button>
    </li>`).join('');

  const subtotal = Carrito.subtotal();
  const ahorro = Carrito.ahorro();
  const envio = Carrito.envio(subtotal);
  vista.subtotal.textContent = precio(subtotal);
  vista.ahorro.textContent = precio(ahorro);
  document.querySelectorAll('.fila-ahorro').forEach((fila) => { fila.hidden = ahorro <= 0; });
  vista.envio.textContent = envio === 0 ? 'Gratis' : precio(envio);
  vista.total.textContent = precio(subtotal + envio);
  vista.notaEnvio.textContent = envio === 0
    ? 'Tu pedido tiene envío gratis.'
    : `Agrega ${precio(CONFIG.envioGratisDesde - subtotal)} más y el envío es gratis.`;
}

function pintarMetodosPago() {
  vista.metodos.innerHTML = metodosPago.map((m, i) => `
    <label class="metodo">
      <input type="radio" name="metodo_pago" value="${esc(m.slug)}" ${i === 0 ? 'checked' : ''} required>
      <span>${esc(m.nombre)}</span>
    </label>`).join('');
  mostrarInstrucciones();
}

function metodoElegido() {
  const marcado = vista.formulario.querySelector('input[name="metodo_pago"]:checked');
  return marcado ? metodosPago.find((m) => m.slug === marcado.value) : null;
}

/** Muestra las instrucciones del método y, según el caso, el tipo de tarjeta o el código de operación. */
function mostrarInstrucciones() {
  const metodo = metodoElegido();
  if (!metodo) return;
  vista.instrucciones.textContent = metodo.instrucciones;
  vista.bloqueTarjeta.hidden = !metodo.pide_tipo_tarjeta;
  vista.campoReferencia.hidden = !metodo.requiere_referencia;
  vista.referencia.required = metodo.requiere_referencia;
  if (!metodo.requiere_referencia) vista.referencia.value = '';
}

function conectarCarrito() {
  vista.lista.addEventListener('click', (evento) => {
    const linea = evento.target.closest('.linea');
    if (!linea) return;
    const id = Number(linea.dataset.id);
    const talla = linea.dataset.talla;
    const item = Carrito.leer().find((i) => i.id === id && i.talla === talla);
    if (!item) return;

    if (evento.target.closest('[data-sumar]')) Carrito.cambiarCantidad(id, talla, item.cantidad + 1);
    else if (evento.target.closest('[data-restar]')) Carrito.cambiarCantidad(id, talla, item.cantidad - 1);
    else if (evento.target.closest('[data-quitar]')) { Carrito.quitar(id, talla); aviso(`Quitado del carrito: ${item.nombre}`); }
    else return;
    pintarCarrito();
  });

  vista.metodos.addEventListener('change', mostrarInstrucciones);
  vista.formulario.addEventListener('submit', enviarPedido);
}

async function enviarPedido(evento) {
  evento.preventDefault();
  vista.error.hidden = true;

  if (!vista.formulario.reportValidity()) return;

  const datos = new FormData(vista.formulario);
  const items = Carrito.leer();
  const metodo = metodoElegido();
  const pedido = {
    cliente: {
      nombre: datos.get('nombre').trim(),
      email: datos.get('email').trim(),
      telefono: datos.get('telefono').trim(),
      direccion: datos.get('direccion').trim(),
      distrito: datos.get('distrito').trim()
    },
    metodo_pago: metodo.slug,
    tipo_tarjeta: metodo.pide_tipo_tarjeta ? datos.get('tipo_tarjeta') : null,
    referencia_pago: metodo.requiere_referencia ? (datos.get('referencia') || '').trim() : '',
    notas: (datos.get('notas') || '').trim(),
    items: items.map((i) => ({ producto_id: i.id, talla: i.talla, cantidad: i.cantidad }))
  };

  vista.confirmar.disabled = true;
  vista.confirmar.textContent = 'Registrando pedido…';

  try {
    const resultado = await API.crearPedido(pedido);
    mostrarConfirmacion(resultado, pedido, items);
    Carrito.vaciar();
    vista.lleno.hidden = true;
  } catch (error) {
    vista.error.textContent = error.message;
    vista.error.hidden = false;
    vista.error.focus();
  } finally {
    vista.confirmar.disabled = false;
    vista.confirmar.textContent = 'Confirmar pedido';
  }
}

function mostrarConfirmacion(resultado, pedido, items) {
  const tarjeta = { credito: 'Tarjeta de crédito', debito: 'Tarjeta de débito' }[resultado.tipo_tarjeta];
  const formaPago = tarjeta || resultado.metodo_pago;
  const detalle = items.map((i) => `- ${i.cantidad} x ${i.nombre} (${i.color_nombre.toLowerCase()}, talla ${i.talla})`).join('\n');
  const mensaje =
    `Hola, ${CONFIG.tienda}. Acabo de hacer el pedido ${resultado.codigo}.\n\n` +
    `${detalle}\n\n` +
    `Total: ${precio(resultado.total)}\n` +
    `Pago: ${formaPago}` +
    (pedido.referencia_pago ? ` (operación ${pedido.referencia_pago})` : '') + '\n' +
    `Entrega: ${pedido.cliente.direccion}, ${pedido.cliente.distrito}\n` +
    `Nombre: ${pedido.cliente.nombre}`;

  document.getElementById('confirmacion-codigo').textContent = resultado.codigo;
  document.getElementById('confirmacion-total').textContent = precio(resultado.total);
  document.getElementById('confirmacion-pago').textContent = formaPago;
  document.getElementById('confirmacion-demo').hidden = !resultado.demo;

  const enlace = document.getElementById('confirmacion-whatsapp');
  enlace.href = enlaceWhatsApp(mensaje);

  vista.confirmacion.hidden = false;
  vista.confirmacion.focus();
  vista.confirmacion.scrollIntoView({ block: 'start' });
}
