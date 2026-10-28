const { modificarFechaCompromiso } = require("../js/logica.js");

const crear = (estado) => ({
  idPedido: 1,
  estado,
  fechaCreacion: "2026-10-20",
  fechaCompromiso: "2026-10-30",
});

console.log("Pendiente + fecha válida  ->", modificarFechaCompromiso(crear("Pendiente"), "2026-11-05").ok);   // true
console.log("En proceso + fecha válida ->", modificarFechaCompromiso(crear("En proceso"), "2026-11-05").ok);  // true
console.log("Entregado                 ->", modificarFechaCompromiso(crear("Entregado"), "2026-11-05").ok);   // false
console.log("Cancelado                 ->", modificarFechaCompromiso(crear("Cancelado"), "2026-11-05").ok);   // false
console.log("Fecha vacía               ->", modificarFechaCompromiso(crear("Pendiente"), "").ok);             // false
console.log("Anterior a la creación    ->", modificarFechaCompromiso(crear("Pendiente"), "2026-10-10").ok);   // false
console.log("Fecha inexistente         ->", modificarFechaCompromiso(crear("Pendiente"), "2026-02-30").ok);   // false