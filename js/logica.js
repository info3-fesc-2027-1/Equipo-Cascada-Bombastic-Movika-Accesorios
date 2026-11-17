// logica.js - Capa de lógica (Tarea 2: validar fecha de compromiso · Tarea 3: modificar fecha de compromiso)
(function (global) {
  "use strict";

  // ============================================================
  // Tarea 2 (Wendy) · Validar fecha de compromiso · RN-01, RN-08
  // ============================================================
  function fechaDeHoy() {
    const d = new Date();
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const dia = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "-" + mes + "-" + dia;
  }

  function esFechaReal(texto) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);
    if (!m) return false;
    const anio = Number(m[1]);
    const mes = Number(m[2]);
    const dia = Number(m[3]);
    const f = new Date(anio, mes - 1, dia);
    return f.getFullYear() === anio && f.getMonth() === mes - 1 && f.getDate() === dia;
  }

  // RN-01: la fecha es obligatoria. RN-08: no puede ser anterior a la creación.
  function validarFechaCompromiso(fecha, fechaCreacion) {
    if (fecha === undefined || fecha === null || String(fecha).trim() === "") {
      return { valida: false, mensaje: "La fecha de compromiso es obligatoria." };
    }
    const texto = String(fecha).trim();

    if (!esFechaReal(texto)) {
      return { valida: false, mensaje: "La fecha no es válida. Usa el formato AAAA-MM-DD." };
    }

    const creacion = fechaCreacion ? String(fechaCreacion).slice(0, 10) : fechaDeHoy();
    if (texto < creacion) {
      return { valida: false, mensaje: "La fecha de compromiso no puede ser anterior a la fecha de creación." };
    }

    return { valida: true, mensaje: "" };
  }

  // ============================================================
  // Tarea 3 (Isaí) · Modificar fecha de compromiso · B-16 · RF6, RC-01(a), RN-07
  // ============================================================
  const ESTADOS_EDITABLES = ["Pendiente", "En proceso"];
  const ESTADOS_CERRADOS = ["Entregado", "Cancelado"];

  // RN-07: solo se puede modificar mientras el pedido no esté cerrado
  function puedeModificarFecha(pedido) {
    return !!pedido && ESTADOS_EDITABLES.includes(pedido.estado);
  }

  function modificarFechaCompromiso(pedido, nuevaFecha) {
    if (!pedido) {
      return { ok: false, mensaje: "El pedido no existe.", pedido: pedido };
    }

    if (ESTADOS_CERRADOS.includes(pedido.estado)) {
      return {
        ok: false,
        mensaje: "No se puede modificar la fecha: el pedido está " + pedido.estado + ".",
        pedido: pedido,
      };
    }

    if (!puedeModificarFecha(pedido)) {
      return { ok: false, mensaje: "Estado de pedido no reconocido.", pedido: pedido };
    }

    // Reutiliza la validación de la tarea 2
    const resultado = validarFechaCompromiso(nuevaFecha, pedido.fechaCreacion);
    if (!resultado.valida) {
      return { ok: false, mensaje: resultado.mensaje, pedido: pedido };
    }

    // Devuelve una copia: el pedido original no cambia hasta que se guarde
    const actualizado = { ...pedido, fechaCompromiso: String(nuevaFecha).trim() };
    return { ok: true, mensaje: "Fecha de compromiso actualizada.", pedido: actualizado };
  }

  // ============================================================
  // Tarea 4 (Mónica) · Validar cliente · RF1
  // ============================================================
  function validarCliente(cliente) {
    const c = cliente || {};
    if (String(c.nombre ?? "").trim() === "") {
      return { valida: false, mensaje: "El nombre es obligatorio." };
    }
    if (String(c.contactoWhatsapp ?? "").trim() === "") {
      return { valida: false, mensaje: "El contacto de WhatsApp es obligatorio." };
    }
    return { valida: true, mensaje: "" };
  }

  // ============================================================
  // Tarea 5 (Donovan) · Catálogo de productos · RF2
  // ============================================================
  const TIPOS_ACCESORIO = ["Anillo", "Aretes", "Collar", "Pulsera"];

  // Regresa solo las piezas del tipo pedido. Si no hay ninguna, regresa una lista vacía.
  // Un tipo que no existe en el catálogo se rechaza con un error.
  function filtrarProductosPorTipo(productos, tipo) {
    if (!TIPOS_ACCESORIO.includes(tipo)) {
      throw new Error("Tipo de accesorio no válido.");
    }
    return productos.filter((p) => p.tipoAccesorio === tipo);
  }

  // Valida una pieza nueva antes de guardarla en el catálogo.
  // Obligatorios: nombre de la pieza, tipo de accesorio y precio mayor que 0.
  // Opcionales: descripción y material personalizable.
  function validarProducto(producto) {
    const p = producto || {};

    if (String(p.nombrePieza ?? "").trim() === "") {
      return { valida: false, mensaje: "El nombre de la pieza es obligatorio." };
    }

    const tipo = String(p.tipoAccesorio ?? "").trim();
    if (tipo === "") {
      return { valida: false, mensaje: "El tipo de accesorio es obligatorio." };
    }
    if (!TIPOS_ACCESORIO.includes(tipo)) {
      return { valida: false, mensaje: "El tipo de accesorio no es válido." };
    }

    if (p.precio === undefined || p.precio === null || String(p.precio).trim() === "") {
      return { valida: false, mensaje: "El precio es obligatorio." };
    }
    const precio = Number(p.precio);
    if (!Number.isFinite(precio) || precio <= 0) {
      return { valida: false, mensaje: "El precio debe ser un número mayor que 0." };
    }

    return { valida: true, mensaje: "" };
  }

  // ============================================================
  // Tarea 6 (Isaí) · Crear pedido · RF3 · RN-04, RN-06
  // ============================================================
  // Un pedido: un cliente (RN-04), al menos una pieza (RN-06), punto de entrega,
  // fecha de compromiso obligatoria y válida (RN-01, RN-08) y estado inicial Pendiente.
  // El total se calcula al crear el pedido y se guarda congelado (no cambia si luego
  // cambia el precio de la pieza en el catálogo).
  // Esta capa NO guarda nada: armarPedido devuelve lo que la pantalla le pasa a Datos.guardarPedido.
  const ESTADO_INICIAL = "Pendiente";

  function redondear(numero) {
    return Math.round((numero + Number.EPSILON) * 100) / 100;
  }

  // Una partida es una pieza del catálogo con su cantidad (entero, mínimo 1).
  function validarPartida(partida) {
    const p = partida || {};
    if (p.idProducto === undefined || p.idProducto === null || String(p.idProducto).trim() === "") {
      return { valida: false, mensaje: "Elige una pieza del catálogo.", campo: "idProducto" };
    }
    const cantidad = Number(p.cantidad);
    if (!Number.isInteger(cantidad) || cantidad < 1) {
      return { valida: false, mensaje: "La cantidad debe ser un número entero de 1 en adelante.", campo: "cantidad" };
    }
    return { valida: true, mensaje: "", campo: "" };
  }

  // Suma cantidad × precioUnitario de cada partida, con centavos exactos.
  // Una partida mal formada es un error de programación, por eso lanza una excepción.
  function calcularTotal(partidas) {
    if (!Array.isArray(partidas)) {
      throw new Error("Las partidas deben ser una lista.");
    }
    let total = 0;
    partidas.forEach((p) => {
      const cantidad = Number(p.cantidad);
      const precio = Number(p.precioUnitario);
      if (!Number.isInteger(cantidad) || cantidad < 1 || !Number.isFinite(precio) || precio < 0) {
        throw new Error("Partida inválida: revisa la cantidad y el precio.");
      }
      total += redondear(cantidad * precio);
    });
    return redondear(total);
  }

  // Devuelve { valida, mensaje, campo }. `campo` dice qué corregir (la pantalla le pone el foco).
  function validarPedido(pedido) {
    const d = pedido || {};

    // RN-04: el pedido va ligado a un cliente
    if (d.idCliente === undefined || d.idCliente === null || String(d.idCliente).trim() === "") {
      return { valida: false, mensaje: "Elige el cliente del pedido.", campo: "idCliente" };
    }

    // RN-06: al menos una pieza
    const partidas = Array.isArray(d.partidas) ? d.partidas : [];
    if (partidas.length === 0) {
      return { valida: false, mensaje: "Agrega al menos una pieza al pedido.", campo: "partidas" };
    }
    for (const partida of partidas) {
      const r = validarPartida(partida);
      if (!r.valida) {
        return { valida: false, mensaje: r.mensaje, campo: "partidas" };
      }
      const precio = Number((partida || {}).precioUnitario);
      if (!Number.isFinite(precio) || precio < 0) {
        return { valida: false, mensaje: "Una pieza no tiene un precio válido.", campo: "partidas" };
      }
    }

    if (String(d.puntoEntrega ?? "").trim() === "") {
      return { valida: false, mensaje: "El punto de entrega es obligatorio.", campo: "puntoEntrega" };
    }

    // RN-01 y RN-08: reutiliza la validación de la Tarea 2
    const fecha = validarFechaCompromiso(d.fechaCompromiso, d.fechaCreacion);
    if (!fecha.valida) {
      return { valida: false, mensaje: fecha.mensaje, campo: "fechaCompromiso" };
    }

    return { valida: true, mensaje: "", campo: "" };
  }

  // Valida y arma el pedido listo para guardar: estado Pendiente, subtotales y total congelado.
  // Si algo falla: { ok: false, mensaje, campo, pedido: null, partidas: [] }
  function armarPedido(datos) {
    const d = datos || {};
    const r = validarPedido(d);
    if (!r.valida) {
      return { ok: false, mensaje: r.mensaje, campo: r.campo, pedido: null, partidas: [] };
    }

    const partidas = d.partidas.map((p) => ({
      idProducto: Number(p.idProducto),
      cantidad: Number(p.cantidad),
      precioUnitario: Number(p.precioUnitario),
      subtotal: redondear(Number(p.cantidad) * Number(p.precioUnitario)),
      personalizacion: String(p.personalizacion ?? "").trim(),
    }));

    const pedido = {
      idCliente: Number(d.idCliente),
      fechaCreacion: d.fechaCreacion || fechaDeHoy(),
      fechaCompromiso: String(d.fechaCompromiso).trim(),
      estado: ESTADO_INICIAL,
      puntoEntrega: String(d.puntoEntrega).trim(),
      total: calcularTotal(partidas),
    };

    return { ok: true, mensaje: "", campo: "", pedido: pedido, partidas: partidas };
  }

  // ============================================================
  // Exportación (una sola declaración de API para todo el archivo)
  // ============================================================
  const API = {
    fechaDeHoy,
    esFechaReal,
    validarFechaCompromiso,
    puedeModificarFecha,
    modificarFechaCompromiso,
    validarCliente,
    filtrarProductosPorTipo,
    validarProducto,
    TIPOS_ACCESORIO,
    validarPartida,
    calcularTotal,
    validarPedido,
    armarPedido,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = API;
  } else {
    global.Logica = Object.assign(global.Logica || {}, API);
  }
})(typeof window !== "undefined" ? window : globalThis);