let productos = [];

const listaProductos = document.getElementById("listaProductos");
const mensajeCarga = document.getElementById("mensajeCarga");
const resumenCompra = document.getElementById("resumenCompra");
const totalVisual = document.getElementById("totalVisual");
const formBoleta = document.getElementById("formBoleta");
const btnLimpiar = document.getElementById("btnLimpiar");
const mensajeFormulario = document.getElementById("mensajeFormulario");

document.addEventListener("DOMContentLoaded", cargarProductos);

async function cargarProductos() {
  try {
    const respuesta = await fetch("data/productos.json");

    if (!respuesta.ok) {
      throw new Error("No se pudo leer el archivo productos.json");
    }

    productos = await respuesta.json();
    mostrarProductos();
    mensajeCarga.style.display = "none";
  } catch (error) {
    console.error("Error al cargar productos:", error);

    mensajeCarga.innerHTML = `
      No se pudo cargar el archivo JSON. 
      Recuerde probar el proyecto desde GitHub Pages o con Live Server.
    `;

    // Productos de respaldo para que el ejemplo igual pueda visualizarse.
    productos = [
      { "id": 1, "nombre": "Mouse Gamer", "precio": 12990, "stock": 10, "categoria": "Periféricos" },
      { "id": 2, "nombre": "Teclado Mecánico", "precio": 29990, "stock": 8, "categoria": "Periféricos" },
      { "id": 3, "nombre": "Audífonos USB", "precio": 19990, "stock": 12, "categoria": "Audio" }
    ];

    mostrarProductos();
  }
}

function mostrarProductos() {
  listaProductos.innerHTML = "";

  productos.forEach(producto => {
    const tarjeta = document.createElement("article");
    tarjeta.classList.add("producto");

    tarjeta.innerHTML = `
      <h3>${producto.nombre}</h3>
      <p>Categoría: ${producto.categoria}</p>
      <p class="precio">${formatoMoneda(producto.precio)}</p>
      <p class="stock">Stock disponible: ${producto.stock}</p>

      <label for="producto-${producto.id}">Cantidad</label>
      <input 
        type="number"
        id="producto-${producto.id}"
        class="cantidad"
        min="0"
        max="${producto.stock}"
        value="0"
        data-id="${producto.id}"
      >
    `;

    listaProductos.appendChild(tarjeta);
  });

  document.querySelectorAll(".cantidad").forEach(input => {
    input.addEventListener("input", () => {
      validarCantidad(input);
      actualizarResumen();
    });
  });

  actualizarResumen();
}

function validarCantidad(input) {
  const max = Number(input.max);
  let valor = Number(input.value);

  if (valor < 0) {
    input.value = 0;
  }

  if (valor > max) {
    input.value = max;
    mostrarMensajeGlobal(`La cantidad no puede superar el stock disponible (${max}).`, "error");
  }
}

function obtenerProductosSeleccionados() {
  const seleccionados = [];

  document.querySelectorAll(".cantidad").forEach(input => {
    const cantidad = Number(input.value);
    const id = Number(input.dataset.id);

    if (cantidad > 0) {
      const producto = productos.find(item => item.id === id);

      if (producto) {
        seleccionados.push({
          ...producto,
          cantidad,
          subtotal: producto.precio * cantidad
        });
      }
    }
  });

  return seleccionados;
}

function actualizarResumen() {
  const seleccionados = obtenerProductosSeleccionados();

  if (seleccionados.length === 0) {
    resumenCompra.innerHTML = "<p>No hay productos seleccionados.</p>";
    totalVisual.textContent = formatoMoneda(0);
    prepararDatosCorreo([]);
    return;
  }

  let total = 0;
  resumenCompra.innerHTML = "";

  seleccionados.forEach(item => {
    total += item.subtotal;

    const fila = document.createElement("div");
    fila.classList.add("item-resumen");

    fila.innerHTML = `
      <span>${item.nombre} x ${item.cantidad}</span>
      <strong>${formatoMoneda(item.subtotal)}</strong>
    `;

    resumenCompra.appendChild(fila);
  });

  totalVisual.textContent = formatoMoneda(total);
  prepararDatosCorreo(seleccionados);
}

function prepararDatosCorreo(seleccionados) {
  const numero = generarNumeroBoleta();
  const fecha = new Date().toLocaleString("es-CL");
  let total = 0;

  let detalle = "DETALLE DE COMPRA\n";
  detalle += "--------------------------------\n";

  seleccionados.forEach(item => {
    total += item.subtotal;

    detalle += `Producto: ${item.nombre}\n`;
    detalle += `Categoría: ${item.categoria}\n`;
    detalle += `Cantidad: ${item.cantidad}\n`;
    detalle += `Precio unitario: ${formatoMoneda(item.precio)}\n`;
    detalle += `Subtotal: ${formatoMoneda(item.subtotal)}\n`;
    detalle += "--------------------------------\n";
  });

  detalle += `TOTAL: ${formatoMoneda(total)}\n`;

  document.getElementById("numeroBoleta").value = numero;
  document.getElementById("fechaBoleta").value = fecha;
  document.getElementById("detalleBoleta").value = detalle;
  document.getElementById("totalBoleta").value = formatoMoneda(total);
}

function validarFormulario() {
  let valido = true;

  const cliente = document.getElementById("cliente");
  const email = document.getElementById("email");
  const telefono = document.getElementById("telefono");

  limpiarErrores();

  if (cliente.value.trim() === "") {
    mostrarErrorCampo(cliente, "errorCliente", "El nombre del cliente es obligatorio.");
    valido = false;
  }

  if (!validarEmail(email.value.trim())) {
    mostrarErrorCampo(email, "errorEmail", "Debe ingresar un correo válido.");
    valido = false;
  }

  if (!validarTelefono(telefono.value.trim())) {
    mostrarErrorCampo(telefono, "errorTelefono", "El teléfono debe contener solo números y tener al menos 8 dígitos.");
    valido = false;
  }

  const seleccionados = obtenerProductosSeleccionados();

  if (seleccionados.length === 0) {
    document.getElementById("errorProductos").textContent = "Debe seleccionar al menos un producto.";
    valido = false;
  }

  if (!valido) {
    mostrarMensajeGlobal("Revise los campos marcados antes de enviar la boleta.", "error");
  }

  return valido;
}

function mostrarErrorCampo(input, idError, mensaje) {
  input.classList.add("input-error");
  document.getElementById(idError).textContent = mensaje;
}

function limpiarErrores() {
  document.querySelectorAll(".error").forEach(error => error.textContent = "");
  document.querySelectorAll("input").forEach(input => input.classList.remove("input-error"));
  mensajeFormulario.className = "mensaje-formulario";
  mensajeFormulario.textContent = "";
}

function mostrarMensajeGlobal(mensaje, tipo) {
  mensajeFormulario.textContent = mensaje;

  if (tipo === "ok") {
    mensajeFormulario.className = "mensaje-formulario ok";
  } else {
    mensajeFormulario.className = "mensaje-formulario error-global";
  }
}

function validarEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

function validarTelefono(telefono) {
  const regex = /^[0-9]{8,12}$/;
  return regex.test(telefono);
}

function formatoMoneda(valor) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP"
  }).format(valor);
}

function generarNumeroBoleta() {
  return "BOL-" + Date.now();
}

btnLimpiar.addEventListener("click", () => {
  document.querySelectorAll(".cantidad").forEach(input => {
    input.value = 0;
  });

  actualizarResumen();
  limpiarErrores();
});

formBoleta.addEventListener("submit", event => {
  actualizarResumen();

  if (!validarFormulario()) {
    event.preventDefault();
    return;
  }

  mostrarMensajeGlobal("Formulario válido. Enviando boleta al correo...", "ok");

  // No se usa preventDefault cuando todo está correcto.
  // Esto permite que FormSubmit reciba y envíe los datos al correo configurado.
});
