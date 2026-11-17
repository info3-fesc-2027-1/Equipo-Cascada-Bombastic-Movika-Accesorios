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
    // window.UI.registrarVista("catalogo", mostrarCatalogo);   ← Tarea 5
    // window.UI.registrarVista("pedido",  mostrarNuevoPedido);  ← Tarea 6
    // window.UI.registrarVista("pedidos", mostrarPedidos);      ← Tareas 7 y 8
  }

  registrarPantallas();
})();