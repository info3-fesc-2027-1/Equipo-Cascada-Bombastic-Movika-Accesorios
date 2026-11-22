/**
 * datos-supabase.js — Capa de DATOS en la nube (Supabase) · Movika Accesorios
 *
 * Tiene las MISMAS funciones que datos.js (guardarCliente, obtenerClientes, guardarPedido...),
 * pero todas son asíncronas: devuelven una promesa y hay que usarlas con `await`.
 * Las pantallas ya las usan con `await`, por eso funcionan igual con datos.js (local) y con este archivo.
 *
 * Qué hace al cargar:
 *  - Si config.js trae la URL y la clave de Supabase, reemplaza window.Datos por la versión en la nube.
 *  - Si no, no hace nada y la página sigue en modo local con datos.js.
 *
 * REGLA DE DISEÑO: aquí solo se guardan y leen datos. Las reglas (validar, calcular el total,
 * cambiar de estado) siguen viviendo en logica.js. La base de datos repite las más importantes
 * como segunda línea de defensa (ver supabase/esquema.sql).
 */
(function (global) {
  "use strict";

  const ESTADOS = { PENDIENTE: "Pendiente", EN_PROCESO: "En proceso", ENTREGADO: "Entregado", CANCELADO: "Cancelado" };
  const TIPOS_ACCESORIO = ["Anillo", "Aretes", "Collar", "Pulsera"];

  // ------------------------------------------------------------------
  // Traducción de errores a mensajes que una persona entiende
  // ------------------------------------------------------------------
  function traducirError(error) {
    const codigo = String((error && error.code) || "");
    const mensaje = String((error && error.message) || "");

    if (/failed to fetch|networkerror|load failed/i.test(mensaje)) {
      return new Error("No se pudo conectar con el servidor. Revisa tu conexión a internet e inténtalo de nuevo.");
    }
    if (codigo === "42501" || codigo === "PGRST301" || /jwt|row-level security|permission denied/i.test(mensaje)) {
      if (typeof global.dispatchEvent === "function" && typeof global.Event === "function") {
        global.dispatchEvent(new global.Event("movika:sesion-expirada"));
      }
      return new Error("Tu sesión ya no es válida o no tienes permiso. Inicia sesión de nuevo.");
    }
    if (codigo === "23503") {
      return new Error("El cliente o la pieza ya no existe. Actualiza la pantalla.");
    }
    if (codigo === "23514" || codigo === "23502" || codigo === "22P02") {
      return new Error("Los datos no cumplen las reglas de la base de datos. Revísalos e inténtalo de nuevo.");
    }
    if (codigo === "P0001") {
      return new Error(mensaje || "La base de datos rechazó el cambio.");
    }
    return new Error("Error de la base de datos: " + (mensaje || "desconocido"));
  }

  // ------------------------------------------------------------------
  // Conversión entre las filas de la base (snake_case) y los objetos de la página (camelCase)
  // ------------------------------------------------------------------
  const aCliente = (f) => ({
    idCliente: f.id,
    nombre: f.nombre,
    contactoWhatsapp: f.contacto_whatsapp,
    metalPreferido: f.metal_preferido ?? "",
    talla: f.talla ?? "",
    fechaImportante: f.fecha_importante ?? "",
    notasPreferencias: f.notas_preferencias ?? "",
  });

  const aProducto = (f) => ({
    idProducto: f.id,
    nombrePieza: f.nombre_pieza,
    tipoAccesorio: f.tipo_accesorio,
    precio: Number(f.precio),
    descripcion: f.descripcion ?? "",
    materialPersonalizable: f.material_personalizable ?? "",
  });

  const aPedido = (f) => ({
    idPedido: f.id,
    idCliente: f.id_cliente,
    fechaCreacion: f.fecha_creacion,
    fechaCompromiso: f.fecha_compromiso,
    estado: f.estado,
    puntoEntrega: f.punto_entrega,
    motivoCancelacion: f.motivo_cancelacion ?? "",
    total: Number(f.total),
  });

  const aPartida = (f) => ({
    idPartida: f.id,
    idPedido: f.id_pedido,
    idProducto: f.id_producto,
    cantidad: f.cantidad,
    precioUnitario: Number(f.precio_unitario),
    subtotal: Number(f.subtotal),
    personalizacion: f.personalizacion ?? "",
  });

  function fechaLocalHoy() {
    const d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  // ------------------------------------------------------------------
  // Fábrica: recibe el cliente de Supabase y devuelve el objeto Datos
  // ------------------------------------------------------------------
  function crearDatosNube(cliente) {
    // Espera la respuesta; si trae error, lo traduce y lo lanza.
    async function esperar(consulta) {
      let respuesta;
      try {
        respuesta = await consulta;
      } catch (e) {
        throw traducirError(e);
      }
      if (respuesta.error) throw traducirError(respuesta.error);
      return respuesta.data;
    }

    // ---- Clientes (RF1) ----
    async function guardarCliente(d) {
      const x = d || {};
      const fila = await esperar(
        cliente
          .from("clientes")
          .insert({
            nombre: x.nombre ?? "",
            contacto_whatsapp: x.contactoWhatsapp ?? "",
            metal_preferido: x.metalPreferido ?? "",
            talla: x.talla ?? "",
            fecha_importante: x.fechaImportante ? x.fechaImportante : null,
            notas_preferencias: x.notasPreferencias ?? "",
          })
          .select()
          .single()
      );
      return aCliente(fila);
    }

    async function obtenerClientes() {
      const filas = await esperar(cliente.from("clientes").select("*").order("id", { ascending: true }));
      return (filas || []).map(aCliente);
    }

    async function obtenerClientePorId(id) {
      const fila = await esperar(cliente.from("clientes").select("*").eq("id", Number(id)).maybeSingle());
      return fila ? aCliente(fila) : null;
    }

    // ---- Productos (RF2) ----
    async function guardarProducto(d) {
      const x = d || {};
      const fila = await esperar(
        cliente
          .from("productos")
          .insert({
            nombre_pieza: x.nombrePieza ?? "",
            tipo_accesorio: x.tipoAccesorio ?? "",
            precio: Number(x.precio),
            descripcion: x.descripcion ?? "",
            material_personalizable: x.materialPersonalizable ?? "",
          })
          .select()
          .single()
      );
      return aProducto(fila);
    }

    async function obtenerProductos() {
      const filas = await esperar(cliente.from("productos").select("*").order("id", { ascending: true }));
      return (filas || []).map(aProducto);
    }

    async function obtenerProductoPorId(id) {
      const fila = await esperar(cliente.from("productos").select("*").eq("id", Number(id)).maybeSingle());
      return fila ? aProducto(fila) : null;
    }

    // ---- Pedidos (RF3, RF4, RF5) ----
    async function obtenerPedidos() {
      const filas = await esperar(cliente.from("pedidos").select("*").order("id", { ascending: true }));
      return (filas || []).map(aPedido);
    }

    async function obtenerPedidoPorId(id) {
      const fila = await esperar(cliente.from("pedidos").select("*").eq("id", Number(id)).maybeSingle());
      return fila ? aPedido(fila) : null;
    }

    async function obtenerPartidasDePedido(idPedido) {
      const filas = await esperar(
        cliente.from("partidas_pedido").select("*").eq("id_pedido", Number(idPedido)).order("id", { ascending: true })
      );
      return (filas || []).map(aPartida);
    }

    // Guarda el pedido y sus partidas en UNA sola operación (todo o nada) con la función crear_pedido.
    // El total llega ya calculado desde logica.js y queda congelado.
    async function guardarPedido(datosPedido, partidas) {
      const d = datosPedido || {};
      const nuevoId = await esperar(
        cliente.rpc("crear_pedido", {
          p_pedido: {
            id_cliente: Number(d.idCliente),
            fecha_creacion: d.fechaCreacion ? String(d.fechaCreacion).slice(0, 10) : fechaLocalHoy(),
            fecha_compromiso: d.fechaCompromiso,
            estado: d.estado || ESTADOS.PENDIENTE,
            punto_entrega: d.puntoEntrega,
            total: Number(d.total),
          },
          p_partidas: (partidas || []).map((p) => ({
            id_producto: Number(p.idProducto),
            cantidad: Number(p.cantidad),
            precio_unitario: Number(p.precioUnitario),
            subtotal: Number(p.subtotal),
            personalizacion: p.personalizacion ?? "",
          })),
        })
      );
      return obtenerPedidoPorId(nuevoId);
    }

    // Guarda los cambios de estado, motivo de cancelación y fecha de compromiso (lo demás no se puede cambiar).
    // condiciones.estadoAnterior protege cuando dos personas editan el mismo pedido a la vez:
    // si el estado ya cambió, no se pisa y se avisa.
    async function actualizarPedido(pedido, condiciones) {
      const p = pedido || {};
      const cambios = {};
      if (p.estado !== undefined) cambios.estado = p.estado;
      if (p.fechaCompromiso !== undefined) cambios.fecha_compromiso = p.fechaCompromiso;
      if (p.motivoCancelacion !== undefined) cambios.motivo_cancelacion = p.motivoCancelacion;

      let consulta = cliente.from("pedidos").update(cambios).eq("id", Number(p.idPedido));
      if (condiciones && condiciones.estadoAnterior) {
        consulta = consulta.eq("estado", condiciones.estadoAnterior);
      }
      const filas = await esperar(consulta.select());
      if (!filas || filas.length === 0) {
        throw new Error("El pedido ya cambió (otra persona lo modificó) o no existe. Actualiza la pantalla.");
      }
      return aPedido(filas[0]);
    }

    return {
      esNube: true,
      ESTADOS,
      TIPOS_ACCESORIO,
      inicializarDatos: async () => true,
      guardarCliente, obtenerClientes, obtenerClientePorId,
      guardarProducto, obtenerProductos, obtenerProductoPorId,
      guardarPedido, actualizarPedido, obtenerPedidos, obtenerPedidoPorId,
      obtenerPartidasDePedido,
    };
  }

  // ------------------------------------------------------------------
  // En el navegador: se activa solo si config.js trae la URL y la clave
  // ------------------------------------------------------------------
  const API = { crearDatosNube, traducirError };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = API; // Node (pruebas)
  } else {
    global.DatosNube = API;
    const cfg = global.MOVIKA_CONFIG || {};
    if (cfg.supabaseUrl && cfg.supabaseKey) {
      if (global.supabase && typeof global.supabase.createClient === "function") {
        global.clienteSupabase = global.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey);
        global.Datos = crearDatosNube(global.clienteSupabase);
      } else {
        // Hay configuración, pero la librería de Supabase no cargó: no se cae a modo local en silencio.
        global.Datos = null;
        global.ERROR_NUBE = "No se pudo cargar la librería de Supabase. Revisa tu conexión a internet y recarga la página.";
      }
    }
  }
})(typeof window !== "undefined" ? window : globalThis);