(function (global) {
  "use strict";

  const secciones = [
    { clave: "clientes", titulo: "Clientes", detalle: "Registro de clientes (RF1)", tarea: 4 },
    { clave: "catalogo", titulo: "Catálogo", detalle: "Catálogo de accesorios (RF2)", tarea: 5 },
    { clave: "pedido", titulo: "Nuevo pedido", detalle: "Crear pedido (RF3)", tarea: 6 },
    { clave: "pedidos", titulo: "Pedidos", detalle: "Listado de pedidos (RF5)", tarea: 8 },
  ];

  const vistas = {};
  const menu = document.getElementById("menu");
  const contenido = document.getElementById("contenido");

  function marcarActivo(clave) {
    menu.querySelectorAll("button").forEach(function (b) {
      if (b.dataset.clave === clave) b.setAttribute("aria-current", "page");
      else b.removeAttribute("aria-current");
    });
  }

  function crearPanel(html) {
    const panel = document.createElement("section");
    panel.className = "panel";
    panel.innerHTML = html;
    return panel;
  }

  function mostrarInicio() {
    marcarActivo(null);
    contenido.innerHTML = "";
    contenido.appendChild(
      crearPanel(
        "<h2>Bienvenida</h2>" +
          "<p>Gestiona los clientes, el catálogo y los pedidos de Movika Accesorios.</p>" +
          "<p>Elige una opción del menú para empezar.</p>"
      )
    );
    const start = document.createElement("button");
    start.className = "boton boton-start";
    start.textContent = "START";
    start.addEventListener("click", function () {
      mostrar("clientes");
    });
    const centro = document.createElement("div");
    centro.className = "centrado";
    centro.appendChild(start);
    contenido.appendChild(centro);
  }

  function mostrar(clave) {
    const seccion = secciones.find(function (s) {
      return s.clave === clave;
    });
    if (!seccion) {
      mostrarInicio();
      return;
    }
    marcarActivo(clave);
    contenido.innerHTML = "";
    if (vistas[clave]) {
      vistas[clave](contenido);
      return;
    }
    contenido.appendChild(
      crearPanel(
        "<h2>" + seccion.titulo + "</h2>" +
          "<p>" + seccion.detalle + "</p>" +
          "<p>En construcción: esta pantalla se programa en la tarea " + seccion.tarea + ".</p>"
      )
    );
  }

  function registrarVista(clave, dibujar) {
    vistas[clave] = dibujar;
  }

  secciones.forEach(function (s) {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "boton";
    boton.dataset.clave = s.clave;
    boton.textContent = s.titulo;
    boton.addEventListener("click", function () {
      mostrar(s.clave);
    });
    menu.appendChild(boton);
  });

  document.querySelector(".titulo").addEventListener("click", mostrarInicio);

  global.UI = { mostrar, mostrarInicio, registrarVista };
  mostrarInicio();
})(typeof window !== "undefined" ? window : globalThis);
