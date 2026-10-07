/* Kallpa Sport - Página de contacto: arma el mensaje y abre WhatsApp. */

document.addEventListener('DOMContentLoaded', () => {
  const formulario = document.getElementById('formulario-contacto');
  const mensaje = document.getElementById('mensaje');

  // Preguntas frecuentes: llenan el mensaje con un texto listo para enviar
  document.querySelectorAll('[data-mensaje]').forEach((boton) => {
    boton.addEventListener('click', () => {
      mensaje.value = boton.dataset.mensaje;
      mensaje.focus();
    });
  });

  formulario.addEventListener('submit', (evento) => {
    evento.preventDefault();
    if (!formulario.reportValidity()) return;

    const datos = new FormData(formulario);
    const texto =
      `Hola, ${CONFIG.tienda}. Soy ${datos.get('nombre').trim()}.\n` +
      `Motivo: ${datos.get('motivo')}\n\n` +
      datos.get('mensaje').trim();

    window.open(enlaceWhatsApp(texto), '_blank', 'noopener');
  });
});
