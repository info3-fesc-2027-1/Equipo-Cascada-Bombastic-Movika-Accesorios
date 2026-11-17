/**
 * app.js — Pantallas de la interfaz: Clientes (Tarea 4 · RF1) y Catálogo (Tarea 5 · RF2)
 * Informática III · Grupo 1301 · Equipo 2 · Modelo Cascada
 *
 * REGLA DE DISEÑO: aquí solo hay vistas y manejadores de eventos.
 *  - Las reglas (validar, filtrar) viven en logica.js → Logica.validarCliente, Logica.validarProducto...
 *  - El guardado y la lectura viven en datos.js      → Datos.guardarCliente, Datos.obtenerProductos...
 *
 * El menú y la navegación los maneja ui-pixel.js. Cada pantalla se registra con
 * UI.registrarVista(clave, funcionQueDibuja). Para agregar otra (pedidos...):
 *  1) escribe su función mostrarXxx(contenedor) en su propia sección de este archivo
 *  2) regístrala al final, en registrarPantallas()
 */
(function () {
  "use strict";

  // ------------------------------------------------------------------
  // Utilidades de interfaz
  // ------------------------------------------------------------------

  /** Escapa texto para insertarlo de forma segura dentro de HTML. */
  function escapar(texto) {
    return String(texto ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /** "2026-12-12" → "12/12/2026" (sin pasar por Date, para evitar problemas de zona horaria). */
  function formatearFecha(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
    return m ? m[3] + "/" + m[2] + "/" + m[1] : "";
  }

  /** Muestra un solo mensaje a la vez (error o éxito) usando el atributo hidden. */
  function crearMensajero(cajaError, cajaExito) {
    return function (caja, texto) {
      cajaError.hidden = true;
      cajaExito.hidden = true;
      if (texto) {
        caja.textContent = texto;
        caja.hidden = false;
      }
    };
  }

  // ==================================================================
  // PANTALLA: CLIENTES (Tarea 4 · RF1)
  // ==================================================================

  function mostrarClientes(contenedor) {
    contenedor.innerHTML = `
      <section class="panel" aria-labelledby="cli-titulo">
        <h2 id="cli-titulo">Registrar cliente</h2>
        <form id="cli-form" class="formulario" novalidate>
          <div class="grupo">
            <label for="cli-nombre" class="etiqueta">Nombre <span class="obligatorio">*</span></label>
            <input id="cli-nombre" name="nombre" type="text" autocomplete="off" class="campo">
          </div>

          <div class="grupo">
            <label for="cli-whatsapp" class="etiqueta">WhatsApp <span class="obligatorio">*</span></label>
            <input id="cli-whatsapp" name="contactoWhatsapp" type="tel" inputmode="tel"
                   autocomplete="off" placeholder="Ej. 5512345678" class="campo">
          </div>

          <div class="grupo fila-doble">
            <div>
              <label for="cli-metal" class="etiqueta">Metal preferido</label>
              <input id="cli-metal" name="metalPreferido" type="text" autocomplete="off"
                     placeholder="Ej. Plata 925" class="campo">
            </div>
            <div>
              <label for="cli-talla" class="etiqueta">Talla</label>
              <input id="cli-talla" name="talla" type="text" autocomplete="off"
                     placeholder="Ej. 7" class="campo">
            </div>
          </div>

          <div class="grupo">
            <label for="cli-fecha" class="etiqueta">Fecha importante</label>
            <input id="cli-fecha" name="fechaImportante" type="date" class="campo">
          </div>

          <div class="grupo">
            <label for="cli-notas" class="etiqueta">Notas y preferencias</label>
            <textarea id="cli-notas" name="notasPreferencias" rows="3" class="campo"></textarea>
          </div>

          <p id="cli-error" role="alert" hidden class="mensaje mensaje-error"></p>
          <p id="cli-exito" role="status" hidden class="mensaje mensaje-exito"></p>

          <div class="acciones">
            <button type="submit" class="boton">Guardar cliente</button>
          </div>
        </form>
      </section>

      <section class="panel" aria-labelledby="cli-lista-titulo">
        <div class="encabezado-lista">
          <h2 id="cli-lista-titulo">Clientes registrados</h2>
          <span id="cli-contador" class="contador"></span>
        </div>
        <div id="cli-lista" class="lista"></div>
      </section>`;

    const form = contenedor.querySelector("#cli-form");
    const mostrarMensaje = crearMensajero(
      contenedor.querySelector("#cli-error"),
      contenedor.querySelector("#cli-exito")
    );

    function pintarLista() {
      const lista = contenedor.querySelector("#cli-lista");
      const contador = contenedor.querySelector("#cli-contador");
      const clientes = window.Datos.obtenerClientes().reverse(); // el más reciente primero

      contador.textContent = clientes.length === 1 ? "1 cliente" : clientes.length + " clientes";

      if (clientes.length === 0) {
        lista.innerHTML = '<p class="vacio">Todavía no hay clientes registrados.</p>';
        return;
      }

      lista.innerHTML = clientes
        .map((c) => {
          const datos = [
            c.metalPreferido ? "Metal: " + escapar(c.metalPreferido) : "",
            c.talla ? "Talla: " + escapar(c.talla) : "",
            c.fechaImportante ? "Fecha importante: " + formatearFecha(c.fechaImportante) : "",
          ].filter(Boolean);

          return `
            <article class="ficha">
              <h3>${escapar(c.nombre)}</h3>
              <p>WhatsApp: ${escapar(c.contactoWhatsapp)}</p>
              ${
                datos.length
                  ? '<p class="datos">' + datos.map((d) => '<span class="dato">' + d + "</span>").join("") + "</p>"
                  : ""
              }
              ${c.notasPreferencias ? "<p>" + escapar(c.notasPreferencias) + "</p>" : ""}
            </article>`;
        })
        .join("");
    }

    form.addEventListener("submit", function (evento) {
      evento.preventDefault();

      const f = new FormData(form);
      const cliente = {
        nombre: String(f.get("nombre") || "").trim(),
        contactoWhatsapp: String(f.get("contactoWhatsapp") || "").trim(),
        metalPreferido: String(f.get("metalPreferido") || "").trim(),
        talla: String(f.get("talla") || "").trim(),
        fechaImportante: String(f.get("fechaImportante") || ""),
        notasPreferencias: String(f.get("notasPreferencias") || "").trim(),
      };

      // La regla vive en logica.js; aquí solo se muestra el resultado.
      const resultado = window.Logica.validarCliente(cliente);
      if (!resultado.valida) {
        mostrarMensaje(contenedor.querySelector("#cli-error"), resultado.mensaje);
        const campoConError = cliente.nombre === "" ? "#cli-nombre" : "#cli-whatsapp";
        contenedor.querySelector(campoConError).focus();
        return;
      }

      // El guardado vive en datos.js.
      window.Datos.guardarCliente(cliente);
      form.reset();
      mostrarMensaje(contenedor.querySelector("#cli-exito"), "Cliente guardado: " + cliente.nombre + ".");
      pintarLista();
      contenedor.querySelector("#cli-nombre").focus();
    });

    pintarLista();
  }

  // ==================================================================
  // PANTALLA: CATÁLOGO DE ACCESORIOS (Tarea 5 · RF2)
  // ==================================================================

  // Nombre en plural para los botones del filtro (el valor guardado sigue siendo el singular).
  const ETIQUETA_FILTRO = { Anillo: "Anillos", Aretes: "Aretes", Collar: "Collares", Pulsera: "Pulseras" };

  const formatoPesos = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });

  function mostrarCatalogo(contenedor) {
    const tipos = window.Logica.TIPOS_ACCESORIO;
    let filtroActual = ""; // "" = todos

    contenedor.innerHTML = `
      <section class="panel" aria-labelledby="cat-titulo">
        <h2 id="cat-titulo">Registrar pieza</h2>
        <form id="cat-form" class="formulario" novalidate>
          <div class="grupo">
            <label for="cat-nombre" class="etiqueta">Nombre de la pieza <span class="obligatorio">*</span></label>
            <input id="cat-nombre" name="nombrePieza" type="text" autocomplete="off"
                   placeholder="Ej. Anillo luna" class="campo">
          </div>

          <div class="grupo fila-doble">
            <div>
              <label for="cat-tipo" class="etiqueta">Tipo <span class="obligatorio">*</span></label>
              <select id="cat-tipo" name="tipoAccesorio" class="campo">
                <option value="">Selecciona</option>
                ${tipos.map((t) => '<option value="' + escapar(t) + '">' + escapar(t) + "</option>").join("")}
              </select>
            </div>
            <div>
              <label for="cat-precio" class="etiqueta">Precio (MXN) <span class="obligatorio">*</span></label>
              <input id="cat-precio" name="precio" type="number" min="0" step="0.01" inputmode="decimal"
                     placeholder="Ej. 350" class="campo">
            </div>
          </div>

          <div class="grupo">
            <label for="cat-descripcion" class="etiqueta">Descripción</label>
            <textarea id="cat-descripcion" name="descripcion" rows="3" class="campo"></textarea>
          </div>

          <div class="grupo">
            <label for="cat-material" class="etiqueta">Material personalizable</label>
            <input id="cat-material" name="materialPersonalizable" type="text" autocomplete="off"
                   placeholder="Ej. Plata 925" class="campo">
          </div>

          <p id="cat-error" role="alert" hidden class="mensaje mensaje-error"></p>
          <p id="cat-exito" role="status" hidden class="mensaje mensaje-exito"></p>

          <div class="acciones">
            <button type="submit" class="boton">Guardar pieza</button>
          </div>
        </form>
      </section>

      <section class="panel" aria-labelledby="cat-lista-titulo">
        <div class="encabezado-lista">
          <h2 id="cat-lista-titulo">Piezas del catálogo</h2>
          <span id="cat-contador" class="contador"></span>
        </div>
        <div id="cat-filtros" class="filtros" role="group" aria-label="Filtrar por tipo"></div>
        <div id="cat-lista" class="lista dos-columnas"></div>
      </section>`;

    const form = contenedor.querySelector("#cat-form");
    const mostrarMensaje = crearMensajero(
      contenedor.querySelector("#cat-error"),
      contenedor.querySelector("#cat-exito")
    );

    function pintarFiltros() {
      const opciones = [{ valor: "", etiqueta: "Todos" }].concat(
        tipos.map((t) => ({ valor: t, etiqueta: ETIQUETA_FILTRO[t] || t }))
      );
      contenedor.querySelector("#cat-filtros").innerHTML = opciones
        .map(
          (o) =>
            '<button type="button" class="boton boton-chico" data-tipo="' + escapar(o.valor) + '"' +
            ' aria-pressed="' + (o.valor === filtroActual) + '">' + escapar(o.etiqueta) + "</button>"
        )
        .join("");
    }

    function pintarLista() {
      const lista = contenedor.querySelector("#cat-lista");
      const contador = contenedor.querySelector("#cat-contador");
      const todos = window.Datos.obtenerProductos();

      // El filtrado es una regla: vive en logica.js
      const productos = (filtroActual === ""
        ? todos
        : window.Logica.filtrarProductosPorTipo(todos, filtroActual)
      ).slice().reverse(); // la pieza más reciente primero

      contador.textContent = productos.length === 1 ? "1 pieza" : productos.length + " piezas";

      if (productos.length === 0) {
        lista.innerHTML =
          '<p class="vacio">' +
          (todos.length === 0
            ? "El catálogo está vacío. Registra la primera pieza."
            : "No hay piezas de este tipo todavía.") +
          "</p>";
        return;
      }

      lista.innerHTML = productos
        .map(
          (pr) => `
            <article class="ficha">
              <h3>${escapar(pr.nombrePieza)}</h3>
              <p class="precio">${escapar(formatoPesos.format(pr.precio))}</p>
              <p class="datos"><span class="dato">${escapar(pr.tipoAccesorio)}</span></p>
              ${pr.descripcion ? "<p>" + escapar(pr.descripcion) + "</p>" : ""}
              ${pr.materialPersonalizable ? "<p>Material personalizable: " + escapar(pr.materialPersonalizable) + "</p>" : ""}
            </article>`
        )
        .join("");
    }

    contenedor.querySelector("#cat-filtros").addEventListener("click", function (evento) {
      const boton = evento.target.closest("button[data-tipo]");
      if (!boton) return;
      filtroActual = boton.getAttribute("data-tipo");
      pintarFiltros();
      pintarLista();
    });

    form.addEventListener("submit", function (evento) {
      evento.preventDefault();

      const f = new FormData(form);
      const producto = {
        nombrePieza: String(f.get("nombrePieza") || "").trim(),
        tipoAccesorio: String(f.get("tipoAccesorio") || ""),
        precio: String(f.get("precio") || "").trim(),
        descripcion: String(f.get("descripcion") || "").trim(),
        materialPersonalizable: String(f.get("materialPersonalizable") || "").trim(),
      };

      // La regla vive en logica.js; aquí solo se muestra el resultado.
      const resultado = window.Logica.validarProducto(producto);
      if (!resultado.valida) {
        mostrarMensaje(contenedor.querySelector("#cat-error"), resultado.mensaje);
        let campo = "#cat-precio";
        if (producto.nombrePieza === "") campo = "#cat-nombre";
        else if (!tipos.includes(producto.tipoAccesorio)) campo = "#cat-tipo";
        contenedor.querySelector(campo).focus();
        return;
      }

      // El guardado vive en datos.js.
      window.Datos.guardarProducto({ ...producto, precio: Number(producto.precio) });
      form.reset();
      // Si el filtro activo ocultaría la pieza recién guardada, se muestran todas.
      if (filtroActual !== "" && filtroActual !== producto.tipoAccesorio) filtroActual = "";
      mostrarMensaje(contenedor.querySelector("#cat-exito"), "Pieza guardada: " + producto.nombrePieza + ".");
      pintarFiltros();
      pintarLista();
      contenedor.querySelector("#cat-nombre").focus();
    });

    pintarFiltros();
    pintarLista();
  }

  // ==================================================================
  // REGISTRO DE PANTALLAS (el menú y la navegación están en ui-pixel.js)
  // ==================================================================
  function registrarPantallas() {
    if (!window.UI || !window.Datos || !window.Logica) {
      const c = document.getElementById("contenido");
      if (c) {
        c.innerHTML =
          '<section class="panel"><h2>Error</h2>' +
          "<p>No se cargaron ui-pixel.js, datos.js o logica.js. Revisa el orden de los scripts en index.html.</p></section>";
      }
      return;
    }
    window.Datos.inicializarDatos();
    window.UI.registrarVista("clientes", mostrarClientes);   // Tarea 4
    window.UI.registrarVista("catalogo", mostrarCatalogo);   // Tarea 5
    // window.UI.registrarVista("pedido",  mostrarNuevoPedido);  ← Tarea 6
    // window.UI.registrarVista("pedidos", mostrarPedidos);      ← Tareas 7 y 8
  }

  registrarPantallas();
})();