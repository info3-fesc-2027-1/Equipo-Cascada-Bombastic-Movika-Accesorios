/**
// Capa de datos: modelos Cliente, Producto, Pedido y Detalle
// datos.js — Capa de datos (Tarea 1)
// Modelos: Cliente, Producto, Pedido, PartidaPedido (Detalle)
// Esta capa SOLO guarda y lee. No valida, no calcula totales y no cambia
// estados: eso vive en logica.js.
 *
 * REGLA DE DISEÑO: este archivo solo guarda y lee datos.
 * Las validaciones, el cálculo del total y los cambios de estado
 * viven en logica.js. Aquí el total llega ya calculado.
 *
 * Fechas: texto ISO "AAAA-MM-DD" (fechaCreacion también acepta ISO completo).
 */

(function (global) {
  "use strict";

  // ------------------------------------------------------------------
  // 1. CONSTANTES
  // ------------------------------------------------------------------
  const VERSION_ESQUEMA = 1;

  const CLAVES = {
    clientes: "movika_clientes",
    productos: "movika_productos",
    pedidos: "movika_pedidos",
    partidas: "movika_partidas",
    contadores: "movika_contadores",
    version: "movika_version",
  };

  const ESTADOS = {
    PENDIENTE: "Pendiente",
    EN_PROCESO: "En proceso",
    ENTREGADO: "Entregado",
    CANCELADO: "Cancelado",
  };

  const TIPOS_ACCESORIO = ["Anillo", "Aretes", "Collar", "Pulsera"];

  // ------------------------------------------------------------------
  // 2. ALMACENAMIENTO
  // Usa localStorage en el navegador. Si no existe (por ejemplo al probar
  // con Node), usa un objeto en memoria con la misma interfaz.
  // ------------------------------------------------------------------
  function crearAlmacenEnMemoria() {
    const mem = {};
    return {
      getItem: (k) => (k in mem ? mem[k] : null),
      setItem: (k, v) => { mem[k] = String(v); },
      removeItem: (k) => { delete mem[k]; },
    };
  }

  let almacen;
  try {
    almacen = (typeof localStorage !== "undefined" && localStorage) || crearAlmacenEnMemoria();
    // Algunos navegadores bloquean localStorage: se prueba que realmente escriba.
    almacen.setItem("__movika_test", "1");
    almacen.removeItem("__movika_test");
  } catch (e) {
    almacen = crearAlmacenEnMemoria();
  }

  function leerJSON(clave, valorPorDefecto) {
    const crudo = almacen.getItem(clave);
    if (crudo === null) return valorPorDefecto;
    try {
      return JSON.parse(crudo);
    } catch (e) {
      return valorPorDefecto;
    }
  }

  function escribirJSON(clave, valor) {
    almacen.setItem(clave, JSON.stringify(valor));
  }

  // ------------------------------------------------------------------
  // 3. INICIALIZACIÓN (equivale a la "migración" del plan)
  // Crea las colecciones vacías y los contadores de llaves si no existen.
  // Es seguro llamarla varias veces: no borra datos existentes.
  // ------------------------------------------------------------------
  function inicializarDatos() {
    if (almacen.getItem(CLAVES.clientes) === null) escribirJSON(CLAVES.clientes, []);
    if (almacen.getItem(CLAVES.productos) === null) escribirJSON(CLAVES.productos, []);
    if (almacen.getItem(CLAVES.pedidos) === null) escribirJSON(CLAVES.pedidos, []);
    if (almacen.getItem(CLAVES.partidas) === null) escribirJSON(CLAVES.partidas, []);
    if (almacen.getItem(CLAVES.contadores) === null) {
      escribirJSON(CLAVES.contadores, { cliente: 0, producto: 0, pedido: 0, partida: 0 });
    }
    almacen.setItem(CLAVES.version, String(VERSION_ESQUEMA));
    return true;
  }

  /** Borra todos los datos de Movika y vuelve a dejar las colecciones vacías. */
  function reiniciarDatos() {
    Object.values(CLAVES).forEach((c) => almacen.removeItem(c));
    return inicializarDatos();
  }

  /** Genera la siguiente llave numérica autoincremental de una entidad. */
  function siguienteId(entidad) {
    const contadores = leerJSON(CLAVES.contadores, { cliente: 0, producto: 0, pedido: 0, partida: 0 });
    contadores[entidad] = (contadores[entidad] || 0) + 1;
    escribirJSON(CLAVES.contadores, contadores);
    return contadores[entidad];
  }

  function copia(obj) {
    return obj === null || obj === undefined ? obj : JSON.parse(JSON.stringify(obj));
  }

  // ------------------------------------------------------------------
  // 4. CLIENTE (RF1)
  // idCliente, nombre, contactoWhatsapp, metalPreferido, talla,
  // fechaImportante, notasPreferencias
  // ------------------------------------------------------------------
  function guardarCliente(datos) {
    inicializarDatos();
    const d = datos || {};
    const cliente = {
      idCliente: siguienteId("cliente"),
      nombre: d.nombre ?? "",
      contactoWhatsapp: d.contactoWhatsapp ?? "",
      metalPreferido: d.metalPreferido ?? "",
      talla: d.talla ?? "",
      fechaImportante: d.fechaImportante ?? "",
      notasPreferencias: d.notasPreferencias ?? "",
    };
    const lista = leerJSON(CLAVES.clientes, []);
    lista.push(cliente);
    escribirJSON(CLAVES.clientes, lista);
    return copia(cliente);
  }

  function obtenerClientes() {
    inicializarDatos();
    return copia(leerJSON(CLAVES.clientes, []));
  }

  function obtenerClientePorId(idCliente) {
    const c = obtenerClientes().find((x) => x.idCliente === Number(idCliente));
    return c || null;
  }

  // ------------------------------------------------------------------
  // 5. PRODUCTO (RF2)
  // idProducto, nombrePieza, tipoAccesorio, precio, descripcion,
  // materialPersonalizable
  // ------------------------------------------------------------------
  function guardarProducto(datos) {
    inicializarDatos();
    const d = datos || {};
    const producto = {
      idProducto: siguienteId("producto"),
      nombrePieza: d.nombrePieza ?? "",
      tipoAccesorio: d.tipoAccesorio ?? "",
      precio: Number(d.precio) || 0,
      descripcion: d.descripcion ?? "",
      materialPersonalizable: d.materialPersonalizable ?? "",
    };
    const lista = leerJSON(CLAVES.productos, []);
    lista.push(producto);
    escribirJSON(CLAVES.productos, lista);
    return copia(producto);
  }

  function obtenerProductos() {
    inicializarDatos();
    return copia(leerJSON(CLAVES.productos, []));
  }

  function obtenerProductoPorId(idProducto) {
    const p = obtenerProductos().find((x) => x.idProducto === Number(idProducto));
    return p || null;
  }

  // ------------------------------------------------------------------
  // 6. PARTIDA DE PEDIDO (detalle)
  // idPartida, idPedido, idProducto, cantidad, precioUnitario,
  // subtotal, personalizacion (opcional)
  // ------------------------------------------------------------------
  function guardarPartida(datos) {
    inicializarDatos();
    const d = datos || {};
    const partida = {
      idPartida: siguienteId("partida"),
      idPedido: Number(d.idPedido),
      idProducto: Number(d.idProducto),
      cantidad: Number(d.cantidad) || 0,
      precioUnitario: Number(d.precioUnitario) || 0,
      subtotal: Number(d.subtotal) || 0,
      personalizacion: d.personalizacion ?? "",
    };
    const lista = leerJSON(CLAVES.partidas, []);
    lista.push(partida);
    escribirJSON(CLAVES.partidas, lista);
    return copia(partida);
  }

  function obtenerPartidasDePedido(idPedido) {
    inicializarDatos();
    return copia(leerJSON(CLAVES.partidas, []).filter((p) => p.idPedido === Number(idPedido)));
  }

  // ------------------------------------------------------------------
  // 7. PEDIDO (RF3, RF4, RF5)
  // idPedido, idCliente, fechaCreacion, fechaCompromiso, estado,
  // puntoEntrega, motivoCancelacion (opcional), total
  // ------------------------------------------------------------------

  /**
   * Guarda un pedido junto con sus partidas.
   * El total llega YA CALCULADO desde logica.js y se guarda congelado.
   * El estado inicial es "Pendiente".
   * @param {Object} datosPedido  idCliente, fechaCompromiso, puntoEntrega, total
   * @param {Array}  partidas     [{idProducto, cantidad, precioUnitario, subtotal, personalizacion}]
   */
  function guardarPedido(datosPedido, partidas) {
    inicializarDatos();
    const d = datosPedido || {};
    const pedido = {
      idPedido: siguienteId("pedido"),
      idCliente: Number(d.idCliente),
      fechaCreacion: d.fechaCreacion ?? new Date().toISOString(),
      fechaCompromiso: d.fechaCompromiso ?? "",
      estado: d.estado ?? ESTADOS.PENDIENTE,
      puntoEntrega: d.puntoEntrega ?? "",
      motivoCancelacion: d.motivoCancelacion ?? "",
      total: Number(d.total) || 0,
    };
    const lista = leerJSON(CLAVES.pedidos, []);
    lista.push(pedido);
    escribirJSON(CLAVES.pedidos, lista);

    (partidas || []).forEach((p) => guardarPartida({ ...p, idPedido: pedido.idPedido }));
    return copia(pedido);
  }

  /**
   * Reemplaza los datos de un pedido ya guardado (por ejemplo, cuando
   * logica.js cambia el estado o la fecha de compromiso).
   * Devuelve el pedido actualizado o null si no existe.
   */
  function actualizarPedido(pedidoActualizado) {
    inicializarDatos();
    const lista = leerJSON(CLAVES.pedidos, []);
    const i = lista.findIndex((p) => p.idPedido === Number(pedidoActualizado.idPedido));
    if (i === -1) return null;
    lista[i] = { ...lista[i], ...pedidoActualizado, idPedido: lista[i].idPedido };
    escribirJSON(CLAVES.pedidos, lista);
    return copia(lista[i]);
  }

  function obtenerPedidos() {
    inicializarDatos();
    return copia(leerJSON(CLAVES.pedidos, []));
  }

  function obtenerPedidoPorId(idPedido) {
    const p = obtenerPedidos().find((x) => x.idPedido === Number(idPedido));
    return p || null;
  }

  // ------------------------------------------------------------------
  // 8. API PÚBLICA
  // ------------------------------------------------------------------
  const API = {
    VERSION_ESQUEMA, CLAVES, ESTADOS, TIPOS_ACCESORIO,
    inicializarDatos, reiniciarDatos,
    guardarCliente, obtenerClientes, obtenerClientePorId,
    guardarProducto, obtenerProductos, obtenerProductoPorId,
    guardarPedido, actualizarPedido, obtenerPedidos, obtenerPedidoPorId,
    guardarPartida, obtenerPartidasDePedido,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = API; // Node (pruebas)
  } else {
    global.Datos = API;   // Navegador: se usa como Datos.guardarCliente(...)
  }
})(typeof window !== "undefined" ? window : globalThis);