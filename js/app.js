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
 *  2) regístrala al final, en arrancar()
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

  // ------------------------------------------------------------------
  // Carga de datos
  // En modo nube (Supabase) las funciones de Datos son asíncronas; con datos.js (local) también
  // funcionan con `await`. Por eso todas las pantallas las usan con await.
  // ------------------------------------------------------------------

  // Cada pantalla que carga datos toma un número. Si la persona cambia de pantalla mientras se
  // espera la respuesta, la pantalla anterior ya no dibuja encima de la nueva.
  let vistaActiva = 0;

  function mensajeDeError(error) {
    return (error && error.message) || "Ocurrió un error inesperado.";
  }

  function mostrarCargando(contenedor) {
    contenedor.innerHTML = '<section class="panel"><p class="vacio" id="cargando">Cargando…</p></section>';
  }

  function mostrarErrorDeCarga(contenedor, error, reintentar) {
    contenedor.innerHTML =
      '<section class="panel"><h2>No se pudo cargar</h2>' +
      '<p id="err-carga" role="alert" class="mensaje mensaje-error"></p>' +
      '<div class="acciones"><button type="button" class="boton" data-accion="reintentar">Reintentar</button></div></section>';
    contenedor.querySelector("#err-carga").textContent = mensajeDeError(error);
    contenedor.querySelector('[data-accion="reintentar"]').addEventListener("click", reintentar);
  }

  // Evita guardar dos veces si se pulsa el botón varias veces mientras espera al servidor.
  function bloquearEnvio(form, bloqueado) {
    const boton = form.querySelector('button[type="submit"]');
    if (boton) boton.disabled = bloqueado;
  }

  // ==================================================================
  // PANTALLA: CLIENTES (Tarea 4 · RF1)
  // ==================================================================

  async function mostrarClientes(contenedor) {
    const mi = ++vistaActiva;
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

    async function pintarLista() {
      const lista = contenedor.querySelector("#cli-lista");
      const contador = contenedor.querySelector("#cli-contador");
      let clientes;
      try {
        clientes = (await window.Datos.obtenerClientes()).reverse(); // el más reciente primero
      } catch (error) {
        if (mi !== vistaActiva) return;
        contador.textContent = "";
        lista.innerHTML = '<p class="mensaje mensaje-error" role="alert" id="cli-error-carga"></p>';
        lista.querySelector("#cli-error-carga").textContent = mensajeDeError(error);
        return;
      }
      if (mi !== vistaActiva) return;

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

    form.addEventListener("submit", async function (evento) {
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

      // El guardado vive en datos.js (o datos-supabase.js).
      bloquearEnvio(form, true);
      try {
        await window.Datos.guardarCliente(cliente);
      } catch (error) {
        bloquearEnvio(form, false);
        if (mi === vistaActiva) mostrarMensaje(contenedor.querySelector("#cli-error"), mensajeDeError(error));
        return;
      }
      bloquearEnvio(form, false);
      if (mi !== vistaActiva) return;
      form.reset();
      mostrarMensaje(contenedor.querySelector("#cli-exito"), "Cliente guardado: " + cliente.nombre + ".");
      await pintarLista();
      if (mi !== vistaActiva) return;
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

  async function mostrarCatalogo(contenedor) {
    const mi = ++vistaActiva;
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

    async function pintarLista() {
      const lista = contenedor.querySelector("#cat-lista");
      const contador = contenedor.querySelector("#cat-contador");
      let todos;
      try {
        todos = await window.Datos.obtenerProductos();
      } catch (error) {
        if (mi !== vistaActiva) return;
        contador.textContent = "";
        lista.innerHTML = '<p class="mensaje mensaje-error" role="alert" id="cat-error-carga"></p>';
        lista.querySelector("#cat-error-carga").textContent = mensajeDeError(error);
        return;
      }
      if (mi !== vistaActiva) return;

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

    form.addEventListener("submit", async function (evento) {
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

      // El guardado vive en datos.js (o datos-supabase.js).
      bloquearEnvio(form, true);
      try {
        await window.Datos.guardarProducto({ ...producto, precio: Number(producto.precio) });
      } catch (error) {
        bloquearEnvio(form, false);
        if (mi === vistaActiva) mostrarMensaje(contenedor.querySelector("#cat-error"), mensajeDeError(error));
        return;
      }
      bloquearEnvio(form, false);
      if (mi !== vistaActiva) return;
      form.reset();
      // Si el filtro activo ocultaría la pieza recién guardada, se muestran todas.
      if (filtroActual !== "" && filtroActual !== producto.tipoAccesorio) filtroActual = "";
      mostrarMensaje(contenedor.querySelector("#cat-exito"), "Pieza guardada: " + producto.nombrePieza + ".");
      pintarFiltros();
      await pintarLista();
      if (mi !== vistaActiva) return;
      contenedor.querySelector("#cat-nombre").focus();
    });

    pintarFiltros();
    pintarLista();
  }

  // ==================================================================
  // PANTALLA: NUEVO PEDIDO (Tarea 6 · RF3 · RN-04, RN-06)
  // ==================================================================

  async function mostrarNuevoPedido(contenedor) {
    const mi = ++vistaActiva;
    mostrarCargando(contenedor);

    let clientes, productos, pedidosPrevios;
    try {
      [clientes, productos, pedidosPrevios] = await Promise.all([
        window.Datos.obtenerClientes(),
        window.Datos.obtenerProductos(),
        window.Datos.obtenerPedidos(),
      ]);
    } catch (error) {
      if (mi !== vistaActiva) return;
      mostrarErrorDeCarga(contenedor, error, function () {
        mostrarNuevoPedido(contenedor);
      });
      return;
    }
    if (mi !== vistaActiva) return;

    // Sin clientes o sin piezas no se puede crear un pedido: se guía a la persona.
    if (clientes.length === 0 || productos.length === 0) {
      let guia = "";
      if (clientes.length === 0) {
        guia +=
          '<p class="vacio">Primero registra al menos un cliente.</p>' +
          '<div class="acciones"><button type="button" class="boton" data-ir="clientes">Ir a Clientes</button></div>';
      }
      if (productos.length === 0) {
        guia +=
          '<p class="vacio">Primero registra al menos una pieza en el catálogo.</p>' +
          '<div class="acciones"><button type="button" class="boton" data-ir="catalogo">Ir al Catálogo</button></div>';
      }
      contenedor.innerHTML = '<section class="panel"><h2>Nuevo pedido</h2>' + guia + "</section>";
      contenedor.querySelectorAll("[data-ir]").forEach(function (boton) {
        boton.addEventListener("click", function () {
          window.UI.mostrar(boton.getAttribute("data-ir"));
        });
      });
      return;
    }

    const puntosUsados = Array.from(new Set(pedidosPrevios.map((p) => p.puntoEntrega).filter(Boolean)));

    let partidas = []; // { idProducto, nombre, cantidad, precioUnitario, personalizacion }

    contenedor.innerHTML = `
      <section class="panel" aria-labelledby="ped-titulo">
        <h2 id="ped-titulo">Nuevo pedido</h2>
        <form id="ped-form" class="formulario" novalidate>
          <div class="grupo">
            <label for="ped-cliente" class="etiqueta">Cliente <span class="obligatorio">*</span></label>
            <select id="ped-cliente" name="idCliente" class="campo">
              <option value="">Selecciona</option>
              ${clientes
                .map((c) => '<option value="' + c.idCliente + '">' + escapar(c.nombre) + "</option>")
                .join("")}
            </select>
          </div>

          <div class="caja">
            <p class="etiqueta">Piezas del pedido <span class="obligatorio">*</span></p>

            <div class="grupo">
              <label for="ped-producto" class="etiqueta">Pieza</label>
              <select id="ped-producto" class="campo">
                <option value="">Selecciona</option>
                ${productos
                  .map(
                    (pr) =>
                      '<option value="' + pr.idProducto + '">' +
                      escapar(pr.nombrePieza + " · " + pr.tipoAccesorio + " · " + formatoPesos.format(pr.precio)) +
                      "</option>"
                  )
                  .join("")}
              </select>
            </div>

            <div class="grupo fila-doble">
              <div>
                <label for="ped-cantidad" class="etiqueta">Cantidad</label>
                <input id="ped-cantidad" type="number" min="1" step="1" value="1" inputmode="numeric" class="campo">
              </div>
              <div>
                <label for="ped-personalizacion" class="etiqueta">Personalización</label>
                <input id="ped-personalizacion" type="text" autocomplete="off" placeholder="Ej. Inicial A" class="campo">
              </div>
            </div>

            <p id="ped-error-pieza" role="alert" hidden class="mensaje mensaje-error"></p>
            <div class="acciones">
              <button type="button" id="ped-agregar" class="boton boton-chico">Agregar pieza</button>
            </div>

            <div id="ped-carrito" class="carrito"></div>
            <p id="ped-total" class="total"></p>
          </div>

          <div class="grupo">
            <label for="ped-entrega" class="etiqueta">Punto de entrega <span class="obligatorio">*</span></label>
            <input id="ped-entrega" name="puntoEntrega" type="text" autocomplete="off" list="ped-puntos"
                   placeholder="Ej. Metro Cuautitlán" class="campo">
            <datalist id="ped-puntos">
              ${puntosUsados.map((x) => '<option value="' + escapar(x) + '"></option>').join("")}
            </datalist>
          </div>

          <div class="grupo">
            <label for="ped-fecha" class="etiqueta">Fecha de compromiso <span class="obligatorio">*</span></label>
            <input id="ped-fecha" name="fechaCompromiso" type="date" min="${window.Logica.fechaDeHoy()}" class="campo">
          </div>

          <p id="ped-error" role="alert" hidden class="mensaje mensaje-error"></p>
          <p id="ped-exito" role="status" hidden class="mensaje mensaje-exito"></p>

          <div class="acciones">
            <button type="submit" class="boton">Crear pedido</button>
          </div>
        </form>
      </section>`;

    const form = contenedor.querySelector("#ped-form");
    const errorPieza = contenedor.querySelector("#ped-error-pieza");
    const mostrarMensaje = crearMensajero(
      contenedor.querySelector("#ped-error"),
      contenedor.querySelector("#ped-exito")
    );

    function pintarCarrito() {
      const carrito = contenedor.querySelector("#ped-carrito");
      const total = contenedor.querySelector("#ped-total");

      if (partidas.length === 0) {
        carrito.innerHTML = '<p class="vacio">Todavía no hay piezas en el pedido.</p>';
        total.textContent = "";
        return;
      }

      carrito.innerHTML = partidas
        .map(function (p, i) {
          const subtotal = window.Logica.calcularTotal([p]);
          return `
            <div class="linea">
              <div class="info">
                <strong>${escapar(p.nombre)}</strong>
                <span>${p.cantidad} × ${escapar(formatoPesos.format(p.precioUnitario))} = ${escapar(formatoPesos.format(subtotal))}</span>
                ${p.personalizacion ? "<span>Personalización: " + escapar(p.personalizacion) + "</span>" : ""}
              </div>
              <button type="button" class="boton boton-chico" data-quitar="${i}">Quitar</button>
            </div>`;
        })
        .join("");

      total.textContent = "Total: " + formatoPesos.format(window.Logica.calcularTotal(partidas));
    }

    function agregarPieza() {
      const selector = contenedor.querySelector("#ped-producto");
      const cantidad = contenedor.querySelector("#ped-cantidad");
      const personalizacion = contenedor.querySelector("#ped-personalizacion");

      // La regla vive en logica.js
      const resultado = window.Logica.validarPartida({ idProducto: selector.value, cantidad: cantidad.value });
      if (!resultado.valida) {
        errorPieza.textContent = resultado.mensaje;
        errorPieza.hidden = false;
        (resultado.campo === "cantidad" ? cantidad : selector).focus();
        return;
      }
      errorPieza.hidden = true;

      const producto = productos.find((pr) => pr.idProducto === Number(selector.value));
      const texto = personalizacion.value.trim();
      const existente = partidas.find(
        (p) => p.idProducto === producto.idProducto && p.personalizacion.toLowerCase() === texto.toLowerCase()
      );

      if (existente) {
        existente.cantidad += Number(cantidad.value);
      } else {
        partidas.push({
          idProducto: producto.idProducto,
          nombre: producto.nombrePieza,
          cantidad: Number(cantidad.value),
          precioUnitario: producto.precio, // el precio queda congelado al agregar la pieza
          personalizacion: texto,
        });
      }

      selector.value = "";
      cantidad.value = "1";
      personalizacion.value = "";
      mostrarMensaje(null, ""); // oculta el error o el éxito anterior del pedido
      pintarCarrito();
    }

    contenedor.querySelector("#ped-agregar").addEventListener("click", agregarPieza);

    // Enter en estos campos agrega la pieza (no envía el pedido por accidente)
    ["#ped-cantidad", "#ped-personalizacion"].forEach(function (selector) {
      contenedor.querySelector(selector).addEventListener("keydown", function (evento) {
        if (evento.key === "Enter") {
          evento.preventDefault();
          agregarPieza();
        }
      });
    });

    contenedor.querySelector("#ped-carrito").addEventListener("click", function (evento) {
      const boton = evento.target.closest("button[data-quitar]");
      if (!boton) return;
      partidas.splice(Number(boton.getAttribute("data-quitar")), 1);
      pintarCarrito();
    });

    form.addEventListener("submit", async function (evento) {
      evento.preventDefault();

      const f = new FormData(form);

      // Las reglas viven en logica.js; aquí solo se muestra el resultado.
      const resultado = window.Logica.armarPedido({
        idCliente: String(f.get("idCliente") || ""),
        partidas: partidas,
        puntoEntrega: String(f.get("puntoEntrega") || ""),
        fechaCompromiso: String(f.get("fechaCompromiso") || ""),
        fechaCreacion: window.Logica.fechaDeHoy(),
      });

      if (!resultado.ok) {
        mostrarMensaje(contenedor.querySelector("#ped-error"), resultado.mensaje);
        const campos = {
          idCliente: "#ped-cliente",
          partidas: "#ped-producto",
          puntoEntrega: "#ped-entrega",
          fechaCompromiso: "#ped-fecha",
        };
        contenedor.querySelector(campos[resultado.campo] || "#ped-cliente").focus();
        return;
      }

      // El guardado vive en datos.js (o datos-supabase.js).
      let guardado;
      bloquearEnvio(form, true);
      try {
        guardado = await window.Datos.guardarPedido(resultado.pedido, resultado.partidas);
      } catch (error) {
        bloquearEnvio(form, false);
        if (mi === vistaActiva) mostrarMensaje(contenedor.querySelector("#ped-error"), mensajeDeError(error));
        return;
      }
      bloquearEnvio(form, false);
      if (mi !== vistaActiva) return;
      const cliente = clientes.find((c) => c.idCliente === guardado.idCliente);

      partidas = [];
      form.reset();
      pintarCarrito();
      mostrarMensaje(
        contenedor.querySelector("#ped-exito"),
        "Pedido #" + guardado.idPedido + " creado para " + (cliente ? cliente.nombre : "el cliente") +
          ". Total: " + formatoPesos.format(guardado.total) + ". Estado: " + guardado.estado + "."
      );
      contenedor.querySelector("#ped-cliente").focus();
    });

    pintarCarrito();
  }

  // ==================================================================
  // PANTALLA: PEDIDOS — lista y DETALLE con cambio de estado (Tarea 7 · RF4)
  // ==================================================================
  // La lista (Tarea 8) tiene filtros, agrupa por punto de entrega y muestra primero los atrasados.
  // El detalle (Tarea 7) permite cambiar el estado, cancelar con motivo y modificar la fecha.

  const ETIQUETAS_ACCION = {
    iniciarPreparacion: "Iniciar preparación",
    registrarEntrega: "Registrar entrega",
    cancelar: "Cancelar pedido",
    modificarFecha: "Modificar fecha de compromiso",
  };

  /** "En proceso" → "estado-en-proceso" (para el color de la etiqueta de estado). */
  function claseEstado(estado) {
    return "estado-" + String(estado || "").toLowerCase().replace(/\s+/g, "-");
  }

  function mostrarPedidos(contenedor) {
    mostrarListaPedidos(contenedor);
  }

  // Filtros del listado: se conservan al entrar a un detalle y volver.
  let filtrosPedidos = { estado: "", idCliente: "", soloAtrasados: false };

  function textoPedidos(n) {
    return n === 1 ? "1 pedido" : n + " pedidos";
  }

  function textoAtrasados(n) {
    return n === 1 ? "1 atrasado" : n + " atrasados";
  }

  // Listado de pedidos (Tarea 8 · RF5): filtros, pendientes agrupados por punto de entrega y atrasados primero.
  async function mostrarListaPedidos(contenedor) {
    const mi = ++vistaActiva;
    mostrarCargando(contenedor);

    let todos, clientes;
    try {
      [todos, clientes] = await Promise.all([window.Datos.obtenerPedidos(), window.Datos.obtenerClientes()]);
    } catch (error) {
      if (mi !== vistaActiva) return;
      mostrarErrorDeCarga(contenedor, error, function () {
        mostrarListaPedidos(contenedor);
      });
      return;
    }
    if (mi !== vistaActiva) return;

    if (todos.length === 0) {
      contenedor.innerHTML = `
        <div id="lst-raiz">
          <section class="panel">
            <h2>Pedidos</h2>
            <p class="vacio">Todavía no hay pedidos. Crea el primero en "Nuevo pedido".</p>
            <div class="acciones"><button type="button" class="boton" data-ir="pedido">Ir a Nuevo pedido</button></div>
          </section>
        </div>`;
      contenedor.querySelector("#lst-raiz").addEventListener("click", function (evento) {
        const ir = evento.target.closest("button[data-ir]");
        if (ir) window.UI.mostrar(ir.getAttribute("data-ir"));
      });
      return;
    }

    const nombreCliente = (id) => {
      const c = clientes.find((x) => x.idCliente === Number(id));
      return c ? c.nombre : "Cliente #" + id;
    };

    contenedor.innerHTML = `
      <div id="lst-raiz">
        <section class="panel" aria-labelledby="lst-titulo">
          <div class="encabezado-lista">
            <h2 id="lst-titulo">Pedidos</h2>
            <span id="lst-contador" class="contador"></span>
          </div>

          <div class="grupo fila-doble">
            <div>
              <label for="lst-estado" class="etiqueta">Estado</label>
              <select id="lst-estado" class="campo">
                <option value="">Todos</option>
                ${window.Logica.ESTADOS_PEDIDO.map((e) => '<option value="' + escapar(e) + '">' + escapar(e) + "</option>").join("")}
              </select>
            </div>
            <div>
              <label for="lst-cliente" class="etiqueta">Cliente</label>
              <select id="lst-cliente" class="campo">
                <option value="">Todos</option>
                ${clientes.map((c) => '<option value="' + c.idCliente + '">' + escapar(c.nombre) + "</option>").join("")}
              </select>
            </div>
          </div>

          <div class="grupo">
            <label class="casilla"><input type="checkbox" id="lst-atrasados"> Solo pedidos atrasados</label>
          </div>
          <div class="acciones">
            <button type="button" class="boton boton-chico" data-accion="limpiar">Limpiar filtros</button>
          </div>
        </section>

        <div id="lst-resultados"></div>
      </div>`;

    const raiz = contenedor.querySelector("#lst-raiz");
    const selEstado = raiz.querySelector("#lst-estado");
    const selCliente = raiz.querySelector("#lst-cliente");
    const casillaAtrasados = raiz.querySelector("#lst-atrasados");

    selEstado.value = filtrosPedidos.estado;
    selCliente.value = String(filtrosPedidos.idCliente);
    casillaAtrasados.checked = filtrosPedidos.soloAtrasados;

    function filaPedido(p, hoy, conEntrega) {
      const atrasado = window.Logica.esAtrasado(p, hoy);
      const dias = window.Logica.diasDeRetraso(p, hoy);
      return `
        <tr class="${atrasado ? "atrasado" : ""}">
          <td data-label="Pedido">#${p.idPedido}</td>
          <td data-label="Cliente">${escapar(nombreCliente(p.idCliente))}</td>
          <td data-label="Estado">
            <span class="etiquetas">
              <span class="dato ${claseEstado(p.estado)}">${escapar(p.estado)}</span>
              ${atrasado ? '<span class="dato atrasado-etiqueta">Atrasado · ' + dias + (dias === 1 ? " día" : " días") + "</span>" : ""}
            </span>
          </td>
          ${
            conEntrega
              ? '<td data-label="Entrega">' + escapar(p.puntoEntrega) + "</td>"
              : '<td data-label="Compromiso">' + formatearFecha(p.fechaCompromiso) + "</td>"
          }
          <td data-label="Total">${escapar(formatoPesos.format(p.total))}</td>
          <td data-label="Detalle"><button type="button" class="boton boton-chico" data-ver="${p.idPedido}">Ver detalle</button></td>
        </tr>`;
    }

    function tabla(pedidos, hoy, conEntrega) {
      return `
        <div class="tabla-envoltura">
          <table class="tabla-pedidos">
            <thead>
              <tr>
                <th>Pedido</th><th>Cliente</th><th>Estado</th>
                ${conEntrega ? "<th>Entrega</th>" : "<th>Compromiso</th>"}<th>Total</th><th>Detalle</th>
              </tr>
            </thead>
            <tbody>${pedidos.map((p) => filaPedido(p, hoy, conEntrega)).join("")}</tbody>
          </table>
        </div>`;
    }

    function pintarResultados() {
      const hoy = window.Logica.fechaDeHoy();
      const visibles = window.Logica.filtrarPedidos(todos, {
        estado: filtrosPedidos.estado,
        idCliente: filtrosPedidos.idCliente,
        soloAtrasados: filtrosPedidos.soloAtrasados,
        hoy: hoy,
      });
      const ordenados = window.Logica.ordenarPedidos(visibles, hoy); // atrasados primero
      const porEntregar = ordenados.filter((p) => p.estado === "Pendiente" || p.estado === "En proceso");
      const cerrados = ordenados.filter((p) => p.estado === "Entregado" || p.estado === "Cancelado");
      const nAtrasados = porEntregar.filter((p) => window.Logica.esAtrasado(p, hoy)).length;

      raiz.querySelector("#lst-contador").textContent = textoPedidos(visibles.length);

      let html = "";

      if (visibles.length === 0) {
        html = '<section class="panel"><p class="vacio" id="lst-sin-resultados">No hay pedidos con estos filtros.</p></section>';
      } else {
        if (nAtrasados > 0) {
          html +=
            '<p id="lst-aviso" role="status" class="mensaje mensaje-error">Atención: ' +
            (nAtrasados === 1 ? "hay 1 pedido atrasado" : "hay " + nAtrasados + " pedidos atrasados") +
            ". Aparecen primero y resaltados.</p>";
        }

        // Pendientes y en proceso: agrupados por punto de entrega, con los atrasados primero.
        window.Logica.agruparPorPuntoEntrega(porEntregar, hoy).forEach(function (g) {
          html += `
            <section class="panel grupo-entrega" aria-label="Entrega: ${escapar(g.puntoEntrega)}">
              <div class="encabezado-lista">
                <h2>${escapar(g.puntoEntrega)}</h2>
                <span class="contador">${textoPedidos(g.total)}${g.atrasados ? " · " + textoAtrasados(g.atrasados) : ""}</span>
              </div>
              ${tabla(g.pedidos, hoy, false)}
            </section>`;
        });

        if (cerrados.length > 0) {
          html += `
            <section class="panel grupo-cerrados" aria-label="Entregados y cancelados">
              <div class="encabezado-lista">
                <h2>Entregados y cancelados</h2>
                <span class="contador">${textoPedidos(cerrados.length)}</span>
              </div>
              ${tabla(cerrados, hoy, true)}
            </section>`;
        }
      }

      raiz.querySelector("#lst-resultados").innerHTML = html;
    }

    selEstado.addEventListener("change", function () {
      filtrosPedidos.estado = selEstado.value;
      pintarResultados();
    });
    selCliente.addEventListener("change", function () {
      filtrosPedidos.idCliente = selCliente.value;
      pintarResultados();
    });
    casillaAtrasados.addEventListener("change", function () {
      filtrosPedidos.soloAtrasados = casillaAtrasados.checked;
      pintarResultados();
    });

    raiz.addEventListener("click", function (evento) {
      const ver = evento.target.closest("button[data-ver]");
      if (ver) {
        mostrarDetallePedido(contenedor, Number(ver.getAttribute("data-ver")));
        return;
      }
      if (evento.target.closest('button[data-accion="limpiar"]')) {
        filtrosPedidos = { estado: "", idCliente: "", soloAtrasados: false };
        selEstado.value = "";
        selCliente.value = "";
        casillaAtrasados.checked = false;
        pintarResultados();
      }
    });

    pintarResultados();
  }

  /**
   * Detalle de un pedido: estado, datos, piezas y las acciones que su estado permite.
   * `aviso` = { exito } con el mensaje que se muestra tras una acción (la pantalla se vuelve a dibujar).
   */
  async function mostrarDetallePedido(contenedor, idPedido, aviso) {
    const mi = ++vistaActiva;
    mostrarCargando(contenedor);

    let pedido, cliente, partidas, productos;
    try {
      pedido = await window.Datos.obtenerPedidoPorId(idPedido);
      if (pedido) {
        [cliente, partidas, productos] = await Promise.all([
          window.Datos.obtenerClientePorId(pedido.idCliente),
          window.Datos.obtenerPartidasDePedido(pedido.idPedido),
          window.Datos.obtenerProductos(),
        ]);
      }
    } catch (error) {
      if (mi !== vistaActiva) return;
      mostrarErrorDeCarga(contenedor, error, function () {
        mostrarDetallePedido(contenedor, idPedido, aviso);
      });
      return;
    }
    if (mi !== vistaActiva) return;

    if (!pedido) {
      contenedor.innerHTML = `
        <div id="det-raiz">
          <section class="panel">
            <h2>Pedido no encontrado</h2>
            <div class="acciones"><button type="button" class="boton" data-accion="volver">Volver a la lista</button></div>
          </section>
        </div>`;
      contenedor.querySelector("#det-raiz").addEventListener("click", function (evento) {
        if (evento.target.closest('button[data-accion="volver"]')) mostrarListaPedidos(contenedor);
      });
      return;
    }

    const acciones = window.Logica.accionesDisponibles(pedido); // la regla vive en logica.js

    contenedor.innerHTML = `
      <div id="det-raiz">
        <section class="panel" aria-labelledby="det-titulo">
          <div class="encabezado-lista">
            <h2 id="det-titulo">Pedido #${pedido.idPedido}</h2>
            <span>
              <span id="det-estado" class="dato ${claseEstado(pedido.estado)}">${escapar(pedido.estado)}</span>
              ${
                window.Logica.esAtrasado(pedido)
                  ? '<span id="det-atrasado" class="dato atrasado-etiqueta">Atrasado · ' + window.Logica.diasDeRetraso(pedido) +
                    (window.Logica.diasDeRetraso(pedido) === 1 ? " día" : " días") + "</span>"
                  : ""
              }
            </span>
          </div>
          <p>Cliente: ${escapar(cliente ? cliente.nombre : "Cliente #" + pedido.idCliente)}${
            cliente ? " · WhatsApp: " + escapar(cliente.contactoWhatsapp) : ""
          }</p>
          <p>Punto de entrega: ${escapar(pedido.puntoEntrega)}</p>
          <p>Creado: ${formatearFecha(String(pedido.fechaCreacion).slice(0, 10))} · Compromiso: <span id="det-compromiso">${formatearFecha(pedido.fechaCompromiso)}</span></p>
          ${
            pedido.estado === "Cancelado"
              ? '<p id="det-motivo" class="mensaje mensaje-error">Motivo de la cancelación: ' + escapar(pedido.motivoCancelacion) + "</p>"
              : ""
          }
        </section>

        <section class="panel" aria-labelledby="det-piezas-titulo">
          <h2 id="det-piezas-titulo">Piezas</h2>
          <div class="carrito">
            ${partidas
              .map((pa) => {
                const producto = productos.find((x) => x.idProducto === pa.idProducto);
                return `
                  <div class="linea">
                    <div class="info">
                      <strong>${escapar(producto ? producto.nombrePieza : "Pieza #" + pa.idProducto)}</strong>
                      <span>${pa.cantidad} × ${escapar(formatoPesos.format(pa.precioUnitario))} = ${escapar(formatoPesos.format(pa.subtotal))}</span>
                      ${pa.personalizacion ? "<span>Personalización: " + escapar(pa.personalizacion) + "</span>" : ""}
                    </div>
                  </div>`;
              })
              .join("")}
          </div>
          <p class="total">Total: ${escapar(formatoPesos.format(pedido.total))}</p>
        </section>

        <section class="panel" aria-labelledby="det-acciones-titulo">
          <h2 id="det-acciones-titulo">Acciones</h2>
          <p id="det-error" role="alert" hidden class="mensaje mensaje-error"></p>
          <p id="det-exito" role="status" hidden class="mensaje mensaje-exito"></p>
          ${
            acciones.length === 0
              ? '<p id="det-cerrado" class="vacio">Este pedido está cerrado: ya no admite cambios.</p>'
              : '<div id="det-acciones" class="filtros">' +
                acciones
                  .map((a) => '<button type="button" class="boton boton-chico" data-accion="' + a + '">' + ETIQUETAS_ACCION[a] + "</button>")
                  .join("") +
                "</div>"
          }
          <div id="det-formulario"></div>
          <div class="acciones">
            <button type="button" class="boton boton-chico" data-accion="volver">Volver a la lista</button>
          </div>
        </section>
      </div>`;

    const raiz = contenedor.querySelector("#det-raiz");
    const cajaError = raiz.querySelector("#det-error");
    const cajaExito = raiz.querySelector("#det-exito");
    const zonaFormulario = raiz.querySelector("#det-formulario");
    const mostrarMensaje = crearMensajero(cajaError, cajaExito);

    if (aviso && aviso.exito) mostrarMensaje(cajaExito, aviso.exito);

    // Guarda el pedido que devolvió logica.js y vuelve a dibujar el detalle con el aviso de éxito.
    // Si otra persona ya cambió el pedido, la base de datos lo rechaza y se muestra el aviso.
    let ocupado = false;
    async function guardarYRefrescar(resultado) {
      ocupado = true;
      try {
        await window.Datos.actualizarPedido(resultado.pedido, { estadoAnterior: pedido.estado });
      } catch (error) {
        ocupado = false;
        if (mi === vistaActiva) mostrarMensaje(cajaError, mensajeDeError(error));
        return;
      }
      ocupado = false;
      if (mi !== vistaActiva) return;
      await mostrarDetallePedido(contenedor, pedido.idPedido, { exito: resultado.mensaje });
    }

    function abrirFormulario(accion) {
      mostrarMensaje(null, "");
      if (accion === "cancelar") {
        zonaFormulario.innerHTML = `
          <div class="caja">
            <label for="det-motivo-texto" class="etiqueta">Motivo de la cancelación <span class="obligatorio">*</span></label>
            <textarea id="det-motivo-texto" rows="3" class="campo"></textarea>
            <div class="acciones">
              <button type="button" class="boton boton-chico" data-accion="confirmarCancelacion">Confirmar cancelación</button>
              <button type="button" class="boton boton-chico" data-accion="cerrarFormulario">No cancelar</button>
            </div>
          </div>`;
        zonaFormulario.querySelector("#det-motivo-texto").focus();
      } else {
        zonaFormulario.innerHTML = `
          <div class="caja">
            <label for="det-fecha-nueva" class="etiqueta">Nueva fecha de compromiso <span class="obligatorio">*</span></label>
            <input id="det-fecha-nueva" type="date" value="${escapar(pedido.fechaCompromiso)}" class="campo">
            <div class="acciones">
              <button type="button" class="boton boton-chico" data-accion="confirmarFecha">Guardar fecha</button>
              <button type="button" class="boton boton-chico" data-accion="cerrarFormulario">Cerrar</button>
            </div>
          </div>`;
        zonaFormulario.querySelector("#det-fecha-nueva").focus();
      }
    }

    raiz.addEventListener("click", function (evento) {
      const boton = evento.target.closest("button[data-accion]");
      if (!boton || ocupado) return;
      const accion = boton.getAttribute("data-accion");

      if (accion === "volver") {
        mostrarListaPedidos(contenedor);
      } else if (accion === "iniciarPreparacion" || accion === "registrarEntrega") {
        const destino = accion === "iniciarPreparacion" ? "En proceso" : "Entregado";
        const resultado = window.Logica.cambiarEstadoPedido(pedido, destino); // la regla vive en logica.js
        if (resultado.ok) guardarYRefrescar(resultado);
        else mostrarMensaje(cajaError, resultado.mensaje);
      } else if (accion === "cancelar" || accion === "modificarFecha") {
        abrirFormulario(accion);
      } else if (accion === "cerrarFormulario") {
        zonaFormulario.innerHTML = "";
        mostrarMensaje(null, "");
      } else if (accion === "confirmarCancelacion") {
        const campo = zonaFormulario.querySelector("#det-motivo-texto");
        const resultado = window.Logica.cancelarPedido(pedido, campo.value);
        if (resultado.ok) {
          guardarYRefrescar(resultado);
        } else {
          mostrarMensaje(cajaError, resultado.mensaje);
          campo.focus();
        }
      } else if (accion === "confirmarFecha") {
        const campo = zonaFormulario.querySelector("#det-fecha-nueva");
        const resultado = window.Logica.modificarFechaCompromiso(pedido, campo.value); // Tarea 3
        if (resultado.ok) {
          guardarYRefrescar(resultado);
        } else {
          mostrarMensaje(cajaError, resultado.mensaje);
          campo.focus();
        }
      }
    });
  }

  // ==================================================================
  // REGISTRO DE PANTALLAS (el menú y la navegación están en ui-pixel.js)
  // ==================================================================
  function mostrarErrorGeneral(texto) {
    const c = document.getElementById("contenido");
    if (!c) return;
    c.innerHTML = '<section class="panel"><h2>Error</h2><p class="mensaje mensaje-error" role="alert" id="error-general"></p></section>';
    c.querySelector("#error-general").textContent = texto;
  }

  async function arrancar() {
    if (!window.UI || !window.Logica) {
      mostrarErrorGeneral("No se cargaron ui-pixel.js o logica.js. Revisa el orden de los scripts en index.html.");
      return;
    }
    if (window.ERROR_NUBE) {
      mostrarErrorGeneral(window.ERROR_NUBE);
      return;
    }
    if (!window.Datos) {
      mostrarErrorGeneral("No se cargó datos.js. Revisa el orden de los scripts en index.html.");
      return;
    }

    // Modo nube: nadie ve la aplicación hasta iniciar sesión.
    if (window.Datos.esNube) {
      if (!window.Acceso) {
        mostrarErrorGeneral("No se cargó acceso.js. Revisa el orden de los scripts en index.html.");
        return;
      }
      try {
        await window.Acceso.exigirSesion();
      } catch (error) {
        mostrarErrorGeneral(mensajeDeError(error));
        return;
      }
    }

    try {
      await window.Datos.inicializarDatos();
    } catch (error) {
      mostrarErrorGeneral(mensajeDeError(error));
      return;
    }

    window.UI.registrarVista("clientes", mostrarClientes);   // Tarea 4
    window.UI.registrarVista("catalogo", mostrarCatalogo);   // Tarea 5
    window.UI.registrarVista("pedido", mostrarNuevoPedido);   // Tarea 6
    window.UI.registrarVista("pedidos", mostrarPedidos);      // Tareas 7 y 8
  }

  arrancar();
})();