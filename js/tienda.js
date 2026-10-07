/* Kallpa Sport - Página de inicio: catálogo con filtros por sexo, tipo de producto,
   color, descuento, rango de precio y año de producción. */

const filtros = {
  genero: [],        // sexo: varios a la vez
  tipo: [],          // ropa, calzado, accesorios
  categoria: '',
  color: [],
  descuento: '',     // '1' = solo con descuento
  precio_min: '',
  precio_max: '',
  anio_min: '',
  anio_max: '',
  q: '',
  orden: ''
};
const FILTROS_LISTA = ['genero', 'tipo', 'color'];

let catalogos = null;
let productos = [];
let numeroPeticion = 0;
let esperaBusqueda;
const tallasElegidas = new Map(); // id de producto -> talla elegida en su tarjeta
const ui = {};

document.addEventListener('DOMContentLoaded', async () => {
  ui.formulario = document.getElementById('filtros');
  ui.generos = document.getElementById('filtro-generos');
  ui.tipos = document.getElementById('filtro-tipos');
  ui.colores = document.getElementById('filtro-colores');
  ui.categoria = document.getElementById('categoria');
  ui.descuento = document.getElementById('solo-descuento');
  ui.precioMin = document.getElementById('precio-min');
  ui.precioMax = document.getElementById('precio-max');
  ui.anioMin = document.getElementById('anio-min');
  ui.anioMax = document.getElementById('anio-max');
  ui.busqueda = document.getElementById('busqueda');
  ui.orden = document.getElementById('orden');
  ui.resumen = document.getElementById('resumen-resultados');
  ui.rejilla = document.getElementById('rejilla-productos');
  ui.quitar = document.getElementById('quitar-filtros');
  ui.panel = document.getElementById('panel-filtros');
  ui.catalogo = document.getElementById('catalogo');

  // En pantallas pequeñas el panel de filtros empieza cerrado
  if (window.matchMedia('(max-width: 900px)').matches) ui.panel.open = false;

  leerFiltrosDeLaUrl();
  catalogos = await API.catalogos();
  pintarCarriles();
  pintarOpciones();
  conectarEventos();
  await buscar();
});

// ---------- Filtros y URL ----------

function leerFiltrosDeLaUrl() {
  const parametros = new URLSearchParams(location.search);
  Object.keys(filtros).forEach((clave) => {
    const valor = parametros.get(clave);
    if (valor === null) return;
    filtros[clave] = FILTROS_LISTA.includes(clave) ? valor.split(',').filter(Boolean) : valor;
  });
}

function guardarFiltrosEnLaUrl() {
  const parametros = new URLSearchParams();
  Object.entries(filtros).forEach(([clave, valor]) => {
    if (Array.isArray(valor)) {
      if (valor.length) parametros.set(clave, valor.join(','));
    } else if (valor !== '') {
      parametros.set(clave, valor);
    }
  });
  const consulta = parametros.toString();
  history.replaceState(null, '', `${location.pathname}${consulta ? '?' + consulta : ''}${location.hash}`);
}

function hayFiltros() {
  return Object.entries(filtros).some(([clave, valor]) =>
    clave !== 'orden' && (Array.isArray(valor) ? valor.length > 0 : valor !== ''));
}

// ---------- Opciones de los filtros ----------

function casillas(nombre, lista, elegidos) {
  return lista.map((opcion) => `
    <label class="opcion">
      <input type="checkbox" name="${nombre}" value="${esc(opcion.slug)}" ${elegidos.includes(opcion.slug) ? 'checked' : ''}>
      <span>${esc(opcion.nombre)}</span>
    </label>`).join('');
}

function opciones(lista, elegido, textoVacio) {
  return `<option value="">${esc(textoVacio)}</option>` + lista.map((opcion) =>
    `<option value="${esc(opcion.valor)}" ${String(opcion.valor) === String(elegido) ? 'selected' : ''}>${esc(opcion.texto)}</option>`
  ).join('');
}

/** Las categorías dependen del tipo: si se marca "Calzado", solo se ofrecen las de calzado. */
function pintarCategorias() {
  const disponibles = catalogos.categorias.filter((c) => filtros.tipo.length === 0 || filtros.tipo.includes(c.tipo));
  if (filtros.categoria && !disponibles.some((c) => c.slug === filtros.categoria)) filtros.categoria = '';
  ui.categoria.innerHTML = opciones(
    disponibles.map((c) => ({ valor: c.slug, texto: c.nombre })), filtros.categoria, 'Todas las categorías');
}

function pintarOpciones() {
  ui.generos.innerHTML = casillas('genero', catalogos.generos, filtros.genero);
  ui.tipos.innerHTML = casillas('tipo', catalogos.tipos, filtros.tipo);
  pintarCategorias();

  ui.colores.innerHTML = catalogos.colores.map((c) => `
    <label class="muestra" title="${esc(c.nombre)}">
      <input type="checkbox" name="color" value="${esc(c.slug)}" aria-label="${esc(c.nombre)}" ${filtros.color.includes(c.slug) ? 'checked' : ''}>
      <span style="--muestra:${colorSeguro(c.hex)}"></span>
    </label>`).join('');

  ui.descuento.checked = filtros.descuento === '1';

  const precios = CONFIG.preciosFiltro.map((p) => ({ valor: p, texto: `${CONFIG.moneda} ${p}` }));
  ui.precioMin.innerHTML = opciones(precios, filtros.precio_min, 'Sin mínimo');
  ui.precioMax.innerHTML = opciones(precios, filtros.precio_max, 'Sin máximo');

  const anios = [];
  for (let anio = catalogos.rango.anio_max; anio >= catalogos.rango.anio_min; anio--) {
    anios.push({ valor: anio, texto: String(anio) });
  }
  ui.anioMin.innerHTML = opciones(anios, filtros.anio_min, 'Cualquiera');
  ui.anioMax.innerHTML = opciones(anios, filtros.anio_max, 'Cualquiera');

  ui.busqueda.value = filtros.q;
  ui.orden.value = filtros.orden;
}

/** Carriles de la portada: cantidad de productos y carril activo. */
function pintarCarriles() {
  document.querySelectorAll('[data-carril]').forEach((carril) => {
    const genero = catalogos.generos.find((g) => g.slug === carril.dataset.carril);
    const contador = carril.querySelector('.carril-total');
    if (genero && contador) contador.textContent = genero.total === 1 ? '1 producto' : `${genero.total} productos`;
  });
}

// ---------- Resultados ----------

function textoStock(stock) {
  if (stock <= 0) return '<p class="producto-stock agotado">Agotado</p>';
  if (stock <= CONFIG.stockBajo) {
    return `<p class="producto-stock poco">${stock === 1 ? 'Última unidad' : `Últimas ${stock} unidades`}</p>`;
  }
  return `<p class="producto-stock">${stock} disponibles</p>`;
}

function tarjeta(p) {
  const tallaElegida = tallasElegidas.get(p.id) || p.tallas[0] || 'Única';
  const agotado = p.stock <= 0;
  const conDescuento = p.descuento_porcentaje > 0;
  const tallas = p.tallas.length > 1
    ? `<div class="tallas" role="group" aria-label="Talla de ${esc(p.nombre)}">${p.tallas.map((t) =>
        `<button type="button" class="talla" data-talla="${esc(t)}" aria-pressed="${t === tallaElegida}">${esc(t)}</button>`).join('')}</div>`
    : '<p class="talla-unica">Talla única</p>';

  return `
    <article class="producto" data-id="${p.id}">
      <div class="producto-visual">
        ${ilustracion(p)}
        ${p.destacado ? '<span class="sello">Más vendido</span>' : ''}
        ${conDescuento ? `<span class="sello-descuento">-${p.descuento_porcentaje} %</span>` : ''}
      </div>
      <div class="producto-cuerpo">
        <p class="producto-clase">${esc(p.genero_nombre)}, ${esc(p.categoria_nombre).toLowerCase()}</p>
        <h3>${esc(p.nombre)}</h3>
        <p class="producto-color"><i style="--muestra:${colorSeguro(p.color_hex)}"></i>${esc(p.color_nombre)}, año ${p.anio}</p>
        ${textoStock(p.stock)}
        ${tallas}
        <div class="producto-pie">
          <div class="producto-precios">
            ${conDescuento ? `<span class="precio-antes"><span class="solo-lectores">Precio regular </span>${precio(p.precio)}</span>` : ''}
            <span class="producto-precio ${conDescuento ? 'con-descuento' : ''}">${precio(p.precio_final)}</span>
          </div>
          <button type="button" class="boton boton-primario" data-agregar ${agotado ? 'disabled' : ''}>
            ${agotado ? 'Agotado' : 'Agregar'}
          </button>
        </div>
      </div>
    </article>`;
}

async function buscar() {
  const peticion = ++numeroPeticion;
  guardarFiltrosEnLaUrl();

  const resultado = await API.productos(filtros);
  if (peticion !== numeroPeticion) return; // llegó una búsqueda más reciente
  productos = resultado;

  ui.resumen.textContent = productos.length === 1 ? '1 producto encontrado' : `${productos.length} productos encontrados`;
  ui.quitar.hidden = !hayFiltros();

  ui.rejilla.innerHTML = productos.length
    ? productos.map(tarjeta).join('')
    : `<div class="vacio">
         <h3>No encontramos productos con esos filtros</h3>
         <p>Prueba con otro color, amplía el rango de precio o quita el filtro de descuento.</p>
         <button type="button" class="boton boton-secundario" data-quitar-filtros>Ver todo el catálogo</button>
       </div>`;
}

function quitarFiltros() {
  Object.keys(filtros).forEach((clave) => {
    if (clave !== 'orden') filtros[clave] = FILTROS_LISTA.includes(clave) ? [] : '';
  });
  pintarOpciones();
  buscar();
}

// ---------- Eventos ----------

function marcados(nombre) {
  return [...ui.formulario.querySelectorAll(`input[name="${nombre}"]:checked`)].map((casilla) => casilla.value);
}

function leerFormulario(cambiado) {
  filtros.genero = marcados('genero');
  filtros.tipo = marcados('tipo');
  filtros.color = marcados('color');
  filtros.categoria = ui.categoria.value;
  filtros.descuento = ui.descuento.checked ? '1' : '';
  filtros.precio_min = ui.precioMin.value;
  filtros.precio_max = ui.precioMax.value;
  filtros.anio_min = ui.anioMin.value;
  filtros.anio_max = ui.anioMax.value;

  // Si el mínimo supera al máximo, se suelta el extremo que no se acaba de cambiar
  corregirRango('precio_min', 'precio_max', ui.precioMin, ui.precioMax, cambiado);
  corregirRango('anio_min', 'anio_max', ui.anioMin, ui.anioMax, cambiado);

  if (cambiado && cambiado.name === 'tipo') pintarCategorias();
}

function corregirRango(claveMin, claveMax, selectorMin, selectorMax, cambiado) {
  if (filtros[claveMin] === '' || filtros[claveMax] === '') return;
  if (Number(filtros[claveMin]) <= Number(filtros[claveMax])) return;
  if (cambiado === selectorMin) {
    filtros[claveMax] = '';
    selectorMax.value = '';
  } else {
    filtros[claveMin] = '';
    selectorMin.value = '';
  }
}

function conectarEventos() {
  ui.formulario.addEventListener('submit', (evento) => evento.preventDefault());

  ui.formulario.addEventListener('change', (evento) => {
    if (evento.target === ui.busqueda) return;
    leerFormulario(evento.target);
    buscar();
  });

  // La búsqueda espera a que se deje de escribir
  ui.busqueda.addEventListener('input', () => {
    clearTimeout(esperaBusqueda);
    esperaBusqueda = setTimeout(() => {
      filtros.q = ui.busqueda.value.trim();
      buscar();
    }, 250);
  });

  ui.orden.addEventListener('change', () => {
    filtros.orden = ui.orden.value;
    buscar();
  });

  ui.quitar.addEventListener('click', quitarFiltros);

  // Carriles de la portada y enlaces del menú: filtran por sexo sin recargar
  document.querySelectorAll('[data-carril], [data-menu-genero]').forEach((enlace) => {
    enlace.addEventListener('click', (evento) => {
      evento.preventDefault();
      filtros.genero = [enlace.dataset.carril || enlace.dataset.menuGenero];
      pintarOpciones();
      buscar();
      const menu = document.getElementById('menu');
      if (menu) menu.classList.remove('abierto');
      const suave = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      ui.catalogo.scrollIntoView({ behavior: suave ? 'smooth' : 'auto', block: 'start' });
    });
  });

  ui.rejilla.addEventListener('click', (evento) => {
    if (evento.target.closest('[data-quitar-filtros]')) {
      quitarFiltros();
      return;
    }

    const tarjetaEl = evento.target.closest('.producto');
    if (!tarjetaEl) return;
    const producto = productos.find((p) => p.id === Number(tarjetaEl.dataset.id));
    if (!producto) return;

    const botonTalla = evento.target.closest('[data-talla]');
    if (botonTalla) {
      tallasElegidas.set(producto.id, botonTalla.dataset.talla);
      tarjetaEl.querySelectorAll('[data-talla]').forEach((b) =>
        b.setAttribute('aria-pressed', String(b === botonTalla)));
      return;
    }

    if (evento.target.closest('[data-agregar]')) {
      const talla = tallasElegidas.get(producto.id) || producto.tallas[0] || 'Única';
      Carrito.agregar(producto, talla);
      aviso(`Agregado al carrito: ${producto.nombre}, talla ${talla}`);
    }
  });
}
