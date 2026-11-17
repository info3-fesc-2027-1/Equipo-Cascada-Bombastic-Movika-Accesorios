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
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = API;
  } else {
    global.Logica = Object.assign(global.Logica || {}, API);
  }
})(typeof window !== "undefined" ? window : globalThis);