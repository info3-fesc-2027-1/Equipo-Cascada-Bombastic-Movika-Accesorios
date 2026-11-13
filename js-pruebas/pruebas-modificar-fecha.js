/**
 * pruebas-modificar-fecha.js — Pruebas de la Tarea 3 (modificar fecha de compromiso)
 * RF6, RC-01(a), RN-07. Corre en Node (node pruebas-modificar-fecha.js)
 * y en el navegador (html-pruebas/pruebas-modificar-fecha.html).
 */
(function (global) {
  "use strict";

  const esNode = typeof require !== "undefined" && typeof module !== "undefined";
  const Logica = esNode ? require("../js/logica.js") : global.Logica;

  const crear = (estado) => ({
    idPedido: 1,
    estado: estado,
    fechaCreacion: "2026-10-20",
    fechaCompromiso: "2026-10-30",
    total: 500,
  });

  function correrPruebas() {
    const resultados = [];

    function prueba(nombre, fn) {
      try { fn(); resultados.push({ nombre: nombre, ok: true }); }
      catch (e) { resultados.push({ nombre: nombre, ok: false, error: e.message }); }
    }
    function igual(real, esperado, msg) {
      if (JSON.stringify(real) !== JSON.stringify(esperado)) {
        throw new Error((msg || "Valor distinto") + " → esperado " + JSON.stringify(esperado) + ", real " + JSON.stringify(real));
      }
    }

    prueba("Pendiente + fecha válida se acepta", () => {
      const r = Logica.modificarFechaCompromiso(crear("Pendiente"), "2026-11-05");
      igual(r.ok, true);
      igual(r.pedido.fechaCompromiso, "2026-11-05", "fecha nueva");
    });

    prueba("En proceso + fecha válida se acepta", () => {
      const r = Logica.modificarFechaCompromiso(crear("En proceso"), "2026-11-05");
      igual(r.ok, true);
      igual(r.pedido.fechaCompromiso, "2026-11-05", "fecha nueva");
    });

    prueba("Entregado se rechaza y la fecha no cambia", () => {
      const r = Logica.modificarFechaCompromiso(crear("Entregado"), "2026-11-05");
      igual(r.ok, false);
      igual(r.pedido.fechaCompromiso, "2026-10-30", "fecha intacta");
    });

    prueba("Cancelado se rechaza y la fecha no cambia", () => {
      const r = Logica.modificarFechaCompromiso(crear("Cancelado"), "2026-11-05");
      igual(r.ok, false);
      igual(r.pedido.fechaCompromiso, "2026-10-30", "fecha intacta");
    });

    prueba("Fecha vacía, null y undefined se rechazan", () => {
      igual(Logica.modificarFechaCompromiso(crear("Pendiente"), "").ok, false);
      igual(Logica.modificarFechaCompromiso(crear("Pendiente"), null).ok, false);
      igual(Logica.modificarFechaCompromiso(crear("Pendiente"), undefined).ok, false);
    });

    prueba("Fecha anterior a la creación se rechaza", () => {
      igual(Logica.modificarFechaCompromiso(crear("Pendiente"), "2026-10-10").ok, false);
    });

    prueba("Fecha inexistente (30 de febrero) se rechaza", () => {
      igual(Logica.modificarFechaCompromiso(crear("Pendiente"), "2026-02-30").ok, false);
    });

    prueba("Formato inválido se rechaza", () => {
      igual(Logica.modificarFechaCompromiso(crear("Pendiente"), "05/11/2026").ok, false);
    });

    prueba("Fecha igual a la de creación se acepta", () => {
      igual(Logica.modificarFechaCompromiso(crear("Pendiente"), "2026-10-20").ok, true);
    });

    prueba("Pedido inexistente se rechaza sin romperse", () => {
      const r = Logica.modificarFechaCompromiso(null, "2026-11-05");
      igual(r.ok, false);
      igual(r.mensaje, "El pedido no existe.");
    });

    prueba("Estado desconocido se rechaza", () => {
      igual(Logica.modificarFechaCompromiso(crear("Archivado"), "2026-11-05").ok, false);
    });

    prueba("El total y el estado no cambian al modificar la fecha", () => {
      const r = Logica.modificarFechaCompromiso(crear("En proceso"), "2026-11-05");
      igual(r.pedido.total, 500, "total");
      igual(r.pedido.estado, "En proceso", "estado");
    });

    prueba("El pedido original no se modifica hasta guardar", () => {
      const original = crear("Pendiente");
      Logica.modificarFechaCompromiso(original, "2026-11-05");
      igual(original.fechaCompromiso, "2026-10-30", "el original debe quedar igual");
    });

    return resultados;
  }

  if (esNode && typeof window === "undefined") {
    const r = correrPruebas();
    r.forEach((x) => console.log((x.ok ? "✔ " : "✘ ") + x.nombre + (x.ok ? "" : "\n    " + x.error)));
    const fallas = r.filter((x) => !x.ok).length;
    console.log("\n" + (r.length - fallas) + "/" + r.length + " pruebas correctas");
    process.exit(fallas ? 1 : 0);
  } else {
    global.correrPruebasModificarFecha = correrPruebas;
  }
})(typeof window !== "undefined" ? window : globalThis);