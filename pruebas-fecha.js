// pruebas-fecha.js - Pruebas de la Tarea 2 (validar fecha de compromiso)
(function (global) {
  "use strict";

  const Logica = typeof require !== "undefined" && typeof module !== "undefined"
    ? require("./logica.js")
    : global.Logica;

  function correrPruebasFecha() {
    const resultados = [];
    const creacion = "2026-10-26";

    function prueba(nombre, fn) {
      try {
        fn();
        resultados.push({ nombre, ok: true });
      } catch (e) {
        resultados.push({ nombre, ok: false, error: e.message });
      }
    }

    function esperar(fecha, valida) {
      const r = Logica.validarFechaCompromiso(fecha, creacion);
      if (r.valida !== valida) {
        throw new Error("esperado valida=" + valida + ", real " + r.valida + " (" + r.mensaje + ")");
      }
    }

    prueba("Rechaza fecha vacía (RN-01)", () => esperar("", false));
    prueba("Rechaza solo espacios (RN-01)", () => esperar("   ", false));
    prueba("Rechaza null (RN-01)", () => esperar(null, false));
    prueba("Rechaza texto que no es fecha", () => esperar("hola", false));
    prueba("Rechaza formato distinto a AAAA-MM-DD", () => esperar("15/11/2026", false));
    prueba("Rechaza fecha que no existe (2026-02-30)", () => esperar("2026-02-30", false));
    prueba("Rechaza fecha anterior a la creación (RN-08)", () => esperar("2026-10-25", false));
    prueba("Acepta fecha igual a la creación", () => esperar("2026-10-26", true));
    prueba("Acepta fecha posterior a la creación", () => esperar("2026-11-15", true));

    return resultados;
  }

  if (typeof module !== "undefined" && module.exports && typeof window === "undefined") {
    const r = correrPruebasFecha();
    r.forEach((x) => console.log((x.ok ? "✔ " : "✘ ") + x.nombre + (x.ok ? "" : "\n    " + x.error)));
    const fallas = r.filter((x) => !x.ok).length;
    console.log("\n" + (r.length - fallas) + "/" + r.length + " pruebas correctas");
    process.exit(fallas ? 1 : 0);
  } else {
    global.correrPruebasFecha = correrPruebasFecha;
  }
})(typeof window !== "undefined" ? window : globalThis);
