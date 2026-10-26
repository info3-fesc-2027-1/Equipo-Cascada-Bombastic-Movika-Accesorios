/**
 * pruebas-datos.js — Pruebas de la Tarea 1 (capa de datos)
 * Funciona en Node (node pruebas-datos.js) y en el navegador (pruebas-datos.html).
 */
(function (global) {
  "use strict";

  const Datos = typeof require !== "undefined" && typeof module !== "undefined"
    ? require("./datos.js")
    : global.Datos;

  function correrPruebas() {
    const resultados = [];

    function prueba(nombre, fn) {
      try {
        fn();
        resultados.push({ nombre, ok: true });
      } catch (e) {
        resultados.push({ nombre, ok: false, error: e.message });
      }
    }

    function igual(real, esperado, msg) {
      if (JSON.stringify(real) !== JSON.stringify(esperado)) {
        throw new Error((msg || "Valor distinto") + " → esperado " + JSON.stringify(esperado) + ", real " + JSON.stringify(real));
      }
    }

    Datos.reiniciarDatos();

    prueba("Inicializar crea colecciones vacías", () => {
      igual(Datos.obtenerClientes(), []);
      igual(Datos.obtenerProductos(), []);
      igual(Datos.obtenerPedidos(), []);
    });

    prueba("Guardar y leer un cliente (RF1)", () => {
      const c = Datos.guardarCliente({
        nombre: "Ana López", contactoWhatsapp: "5512345678",
        metalPreferido: "Plata 925", talla: "7",
        fechaImportante: "2026-12-12", notasPreferencias: "Le gustan los diseños minimalistas",
      });
      igual(c.idCliente, 1, "idCliente");
      igual(Datos.obtenerClientePorId(1).nombre, "Ana López");
      igual(Datos.obtenerClientes().length, 1);
    });

    prueba("Las llaves de cliente son autoincrementales y únicas", () => {
      const c2 = Datos.guardarCliente({ nombre: "Luis Pérez" });
      igual(c2.idCliente, 2);
    });

    prueba("Guardar y leer productos (RF2)", () => {
      const p1 = Datos.guardarProducto({
        nombrePieza: "Anillo luna", tipoAccesorio: "Anillo", precio: 350,
        descripcion: "Plata 925 con grabado", materialPersonalizable: "Plata",
      });
      const p2 = Datos.guardarProducto({
        nombrePieza: "Collar gota", tipoAccesorio: "Collar", precio: 480,
        descripcion: "Cadena 45 cm", materialPersonalizable: "Plata",
      });
      igual(p1.idProducto, 1);
      igual(p2.idProducto, 2);
      igual(Datos.obtenerProductoPorId(2).precio, 480);
      igual(Datos.obtenerProductos().length, 2);
    });

    prueba("Guardar un pedido con 3 partidas conserva el total congelado (RF3)", () => {
      const pedido = Datos.guardarPedido(
        { idCliente: 1, fechaCompromiso: "2026-11-15", puntoEntrega: "Metro Cuautitlán", total: 1180 },
        [
          { idProducto: 1, cantidad: 2, precioUnitario: 350, subtotal: 700, personalizacion: "Inicial A" },
          { idProducto: 2, cantidad: 1, precioUnitario: 480, subtotal: 480 },
          { idProducto: 1, cantidad: 0, precioUnitario: 350, subtotal: 0 },
        ]
      );
      igual(pedido.idPedido, 1);
      igual(pedido.estado, "Pendiente", "estado inicial");
      igual(pedido.total, 1180);
      igual(Datos.obtenerPartidasDePedido(1).length, 3);
      igual(Datos.obtenerPartidasDePedido(1)[0].personalizacion, "Inicial A");
    });

    prueba("Cambiar el precio del catálogo no altera el total guardado del pedido", () => {
      // Simula un cambio de precio posterior: el pedido ya guardado no se toca.
      Datos.guardarProducto({ nombrePieza: "Anillo luna (nuevo precio)", precio: 999 });
      igual(Datos.obtenerPedidoPorId(1).total, 1180);
      igual(Datos.obtenerPartidasDePedido(1)[0].precioUnitario, 350);
    });

    prueba("Actualizar pedido guarda estado y motivo de cancelación (RF4)", () => {
      Datos.actualizarPedido({ idPedido: 1, estado: "Cancelado", motivoCancelacion: "Cliente ya no lo requiere" });
      const p = Datos.obtenerPedidoPorId(1);
      igual(p.estado, "Cancelado");
      igual(p.motivoCancelacion, "Cliente ya no lo requiere");
      igual(p.total, 1180, "el total no cambia");
    });

    prueba("Actualizar un pedido inexistente devuelve null", () => {
      igual(Datos.actualizarPedido({ idPedido: 999, estado: "Entregado" }), null);
    });

    prueba("Leer un id inexistente devuelve null", () => {
      igual(Datos.obtenerClientePorId(999), null);
      igual(Datos.obtenerProductoPorId(999), null);
      igual(Datos.obtenerPedidoPorId(999), null);
    });

    prueba("Los datos devueltos son copias (no modifican lo guardado)", () => {
      const lista = Datos.obtenerClientes();
      lista[0].nombre = "MODIFICADO";
      igual(Datos.obtenerClientes()[0].nombre, "Ana López");
    });

    prueba("Listar pedidos devuelve todos (RF5)", () => {
      Datos.guardarPedido({ idCliente: 2, fechaCompromiso: "2026-11-20", puntoEntrega: "FES Cuautitlán", total: 350 },
        [{ idProducto: 1, cantidad: 1, precioUnitario: 350, subtotal: 350 }]);
      igual(Datos.obtenerPedidos().length, 2);
    });

    prueba("reiniciarDatos deja todo vacío", () => {
      Datos.reiniciarDatos();
      igual(Datos.obtenerClientes(), []);
      igual(Datos.obtenerPedidos(), []);
    });

    return resultados;
  }

  if (typeof module !== "undefined" && module.exports && typeof window === "undefined") {
    // Ejecución en Node
    const r = correrPruebas();
    r.forEach((x) => console.log((x.ok ? "✔ " : "✘ ") + x.nombre + (x.ok ? "" : "\n    " + x.error)));
    const fallas = r.filter((x) => !x.ok).length;
    console.log("\n" + (r.length - fallas) + "/" + r.length + " pruebas correctas");
    process.exit(fallas ? 1 : 0);
  } else {
    global.correrPruebasDatos = correrPruebas;
  }
})(typeof window !== "undefined" ? window : globalThis);
