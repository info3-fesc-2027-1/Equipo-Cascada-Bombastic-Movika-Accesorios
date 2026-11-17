// js-pruebas/estado-pedido.test.js · Pruebas de la Tarea 7 (estado del pedido y cancelación · RF4 · RC-01(b), RN-02)
// Correr con: npm test   (Vitest)
import { describe, it, expect, beforeEach } from 'vitest';
import { createRequire } from 'node:module';

// datos.js y logica.js son archivos clásicos (module.exports), por eso se cargan con require
const require = createRequire(import.meta.url);
const Datos = require('../js/datos.js');
const Logica = require('../js/logica.js');

function pedido(estado, cambios) {
  return {
    idPedido: 1,
    idCliente: 1,
    estado,
    fechaCreacion: '2026-11-16',
    fechaCompromiso: '2026-11-20',
    puntoEntrega: 'Metro Cuautitlán',
    total: 1180,
    ...cambios,
  };
}

// ---------------------------------------------------------------
// cambiarEstadoPedido: Pendiente → En proceso → Entregado
// ---------------------------------------------------------------
describe('RF4 · cambiarEstadoPedido', () => {
  it('CP-RF4-01 · válido: Pendiente avanza a En proceso', () => {
    const r = Logica.cambiarEstadoPedido(pedido('Pendiente'), 'En proceso');
    expect(r.ok).toBe(true);
    expect(r.pedido.estado).toBe('En proceso');
  });

  it('CP-RF4-02 · válido: En proceso avanza a Entregado', () => {
    const r = Logica.cambiarEstadoPedido(pedido('En proceso'), 'Entregado');
    expect(r.ok).toBe(true);
    expect(r.pedido.estado).toBe('Entregado');
  });

  it('CP-RF4-03 · inválido: no se puede saltar de Pendiente a Entregado', () => {
    const r = Logica.cambiarEstadoPedido(pedido('Pendiente'), 'Entregado');
    expect(r.ok).toBe(false);
    expect(r.pedido.estado).toBe('Pendiente');
  });

  it('CP-RF4-04 · inválido: un pedido Entregado o Cancelado ya no cambia', () => {
    expect(Logica.cambiarEstadoPedido(pedido('Entregado'), 'En proceso').ok).toBe(false);
    expect(Logica.cambiarEstadoPedido(pedido('Cancelado'), 'Pendiente').ok).toBe(false);
  });

  it('CP-RF4-05 · inválido: no se puede retroceder de En proceso a Pendiente', () => {
    const r = Logica.cambiarEstadoPedido(pedido('En proceso'), 'Pendiente');
    expect(r.ok).toBe(false);
    expect(r.pedido.estado).toBe('En proceso');
  });

  it('CP-RF4-06 · inválido: cancelar no se hace por aquí, porque exige un motivo', () => {
    const r = Logica.cambiarEstadoPedido(pedido('Pendiente'), 'Cancelado');
    expect(r.ok).toBe(false);
    expect(r.mensaje).toMatch(/motivo/i);
  });

  it('CP-RF4-07 · límite: un pedido inexistente o con estado desconocido se rechaza sin romperse', () => {
    expect(Logica.cambiarEstadoPedido(null, 'En proceso').ok).toBe(false);
    expect(Logica.cambiarEstadoPedido(pedido('Archivado'), 'En proceso').ok).toBe(false);
  });

  it('CP-RF4-08 · el pedido original no se modifica hasta guardar', () => {
    const original = pedido('Pendiente');
    Logica.cambiarEstadoPedido(original, 'En proceso');
    expect(original.estado).toBe('Pendiente');
  });
});

// ---------------------------------------------------------------
// cancelarPedido: motivo obligatorio
// ---------------------------------------------------------------
describe('RF4 · cancelarPedido', () => {
  it('CP-RF4-09 · válido: desde Pendiente, con motivo, queda Cancelado con la razón guardada', () => {
    const r = Logica.cancelarPedido(pedido('Pendiente'), 'El cliente ya no lo requiere');
    expect(r.ok).toBe(true);
    expect(r.pedido.estado).toBe('Cancelado');
    expect(r.pedido.motivoCancelacion).toBe('El cliente ya no lo requiere');
  });

  it('CP-RF4-10 · válido: también se puede cancelar desde En proceso', () => {
    const r = Logica.cancelarPedido(pedido('En proceso'), 'No se consiguió el material');
    expect(r.ok).toBe(true);
    expect(r.pedido.estado).toBe('Cancelado');
  });

  it('CP-RF4-11 · inválido: sin motivo (vacío o solo espacios) no se cancela', () => {
    const vacio = Logica.cancelarPedido(pedido('Pendiente'), '');
    expect(vacio.ok).toBe(false);
    expect(vacio.campo).toBe('motivo');
    expect(vacio.pedido.estado).toBe('Pendiente');
    expect(Logica.cancelarPedido(pedido('En proceso'), '   ').ok).toBe(false);
  });

  it('CP-RF4-12 · inválido: un pedido Entregado no se cancela y uno Cancelado no se reactiva', () => {
    expect(Logica.cancelarPedido(pedido('Entregado'), 'Motivo').ok).toBe(false);
    const ya = Logica.cancelarPedido(pedido('Cancelado', { motivoCancelacion: 'Primero' }), 'Otro motivo');
    expect(ya.ok).toBe(false);
    expect(ya.pedido.motivoCancelacion).toBe('Primero');
  });

  it('CP-RF4-13 · límite: un motivo con espacios alrededor se guarda sin ellos', () => {
    const r = Logica.cancelarPedido(pedido('Pendiente'), '  Cambio de fecha del evento  ');
    expect(r.pedido.motivoCancelacion).toBe('Cambio de fecha del evento');
  });
});

// ---------------------------------------------------------------
// accionesDisponibles: qué botones muestra la pantalla
// ---------------------------------------------------------------
describe('RF4 · accionesDisponibles', () => {
  it('CP-RF4-14 · Pendiente ofrece iniciar, cancelar y modificar fecha; En proceso ofrece entregar, cancelar y modificar fecha', () => {
    expect(Logica.accionesDisponibles(pedido('Pendiente'))).toEqual(['iniciarPreparacion', 'cancelar', 'modificarFecha']);
    expect(Logica.accionesDisponibles(pedido('En proceso'))).toEqual(['registrarEntrega', 'cancelar', 'modificarFecha']);
  });

  it('CP-RF4-15 · un pedido cerrado no ofrece ninguna opción', () => {
    expect(Logica.accionesDisponibles(pedido('Entregado'))).toEqual([]);
    expect(Logica.accionesDisponibles(pedido('Cancelado'))).toEqual([]);
    expect(Logica.accionesDisponibles(null)).toEqual([]);
  });
});

// ---------------------------------------------------------------
// Integración con datos.js: lo que se cambia queda guardado
// ---------------------------------------------------------------
describe('RF4 · los cambios quedan guardados', () => {
  beforeEach(() => Datos.reiniciarDatos());

  function pedidoGuardado() {
    const r = Logica.armarPedido({
      idCliente: '1',
      partidas: [{ idProducto: 1, cantidad: 2, precioUnitario: 350 }],
      puntoEntrega: 'Metro Cuautitlán',
      fechaCompromiso: '2026-11-20',
      fechaCreacion: '2026-11-16',
    });
    return Datos.guardarPedido(r.pedido, r.partidas);
  }

  it('CP-RF4-16 · avanzar de estado y modificar la fecha se guardan, y el total no cambia', () => {
    const creado = pedidoGuardado();
    expect(creado.estado).toBe('Pendiente');

    const avance = Logica.cambiarEstadoPedido(Datos.obtenerPedidoPorId(creado.idPedido), 'En proceso');
    Datos.actualizarPedido(avance.pedido);

    const cambioFecha = Logica.modificarFechaCompromiso(Datos.obtenerPedidoPorId(creado.idPedido), '2026-11-25');
    Datos.actualizarPedido(cambioFecha.pedido);

    const leido = Datos.obtenerPedidoPorId(creado.idPedido);
    expect(leido.estado).toBe('En proceso');
    expect(leido.fechaCompromiso).toBe('2026-11-25');
    expect(leido.total).toBe(700);
  });

  it('CP-RF4-17 · cancelar guarda el motivo y después ya no se puede cambiar nada', () => {
    const creado = pedidoGuardado();
    const cancelado = Logica.cancelarPedido(Datos.obtenerPedidoPorId(creado.idPedido), 'El cliente ya no lo requiere');
    Datos.actualizarPedido(cancelado.pedido);

    const leido = Datos.obtenerPedidoPorId(creado.idPedido);
    expect(leido.estado).toBe('Cancelado');
    expect(leido.motivoCancelacion).toBe('El cliente ya no lo requiere');
    expect(Logica.accionesDisponibles(leido)).toEqual([]);
    expect(Logica.modificarFechaCompromiso(leido, '2026-11-30').ok).toBe(false);
  });
});