// js-pruebas/listado.test.js · Pruebas de la Tarea 8 (listado de pedidos · RF5 · RC-01(c))
// Correr con: npm test   (Vitest)
import { describe, it, expect, beforeEach } from 'vitest';
import { createRequire } from 'node:module';

// datos.js y logica.js son archivos clásicos (module.exports), por eso se cargan con require
const require = createRequire(import.meta.url);
const Datos = require('../js/datos.js');
const Logica = require('../js/logica.js');

// Fecha fija de referencia para que las pruebas no dependan del día en que se corran
const HOY = '2026-11-18';

function pedido(id, estado, compromiso, extra) {
  return { idPedido: id, idCliente: 1, estado, fechaCreacion: '2026-11-01', fechaCompromiso: compromiso, puntoEntrega: 'Metro Cuautitlán', total: 500, ...extra };
}

// ---------------------------------------------------------------
// esAtrasado y diasDeRetraso («Atrasado» no es un estado: se calcula)
// ---------------------------------------------------------------
describe('RF5 · esAtrasado', () => {
  it('CP-RF5-01 · válido: un pedido Pendiente o En proceso con la fecha de compromiso ya pasada está atrasado', () => {
    expect(Logica.esAtrasado(pedido(1, 'Pendiente', '2026-11-15'), HOY)).toBe(true);
    expect(Logica.esAtrasado(pedido(2, 'En proceso', '2026-11-17'), HOY)).toBe(true);
  });

  it('CP-RF5-02 · límite: con fecha de compromiso de hoy o de mañana todavía no está atrasado', () => {
    expect(Logica.esAtrasado(pedido(1, 'Pendiente', HOY), HOY)).toBe(false);
    expect(Logica.esAtrasado(pedido(2, 'Pendiente', '2026-11-19'), HOY)).toBe(false);
  });

  it('CP-RF5-03 · inválido: Entregado y Cancelado nunca están atrasados, ni un estado desconocido ni un pedido inexistente', () => {
    expect(Logica.esAtrasado(pedido(1, 'Entregado', '2026-11-01'), HOY)).toBe(false);
    expect(Logica.esAtrasado(pedido(2, 'Cancelado', '2026-11-01'), HOY)).toBe(false);
    expect(Logica.esAtrasado(pedido(3, 'Archivado', '2026-11-01'), HOY)).toBe(false);
    expect(Logica.esAtrasado(null, HOY)).toBe(false);
  });

  it('CP-RF5-04 · los días de retraso se cuentan bien, también al cruzar de mes', () => {
    expect(Logica.diasDeRetraso(pedido(1, 'Pendiente', '2026-11-15'), HOY)).toBe(3);
    expect(Logica.diasDeRetraso(pedido(2, 'Pendiente', '2026-10-30'), '2026-11-02')).toBe(3);
    expect(Logica.diasDeRetraso(pedido(3, 'Pendiente', HOY), HOY)).toBe(0);
    expect(Logica.diasDeRetraso(pedido(4, 'Entregado', '2026-11-01'), HOY)).toBe(0);
  });
});

// ---------------------------------------------------------------
// ordenarPedidos
// ---------------------------------------------------------------
describe('RF5 · ordenarPedidos', () => {
  const lista = [
    pedido(1, 'Pendiente', '2026-11-25'),
    pedido(2, 'Entregado', '2026-11-10'),
    pedido(3, 'Pendiente', '2026-11-16'),   // atrasado (2 días)
    pedido(4, 'En proceso', '2026-11-20'),
    pedido(5, 'Pendiente', '2026-11-12'),   // atrasado (6 días)
    pedido(6, 'Cancelado', '2026-11-30'),
  ];

  it('CP-RF5-05 · válido: primero los atrasados (el más viejo antes), luego los demás por fecha, al final los cerrados', () => {
    const ids = Logica.ordenarPedidos(lista, HOY).map((p) => p.idPedido);
    expect(ids).toEqual([5, 3, 4, 1, 6, 2]);
  });

  it('CP-RF5-06 · límite: con la misma fecha de compromiso se ordena por número de pedido, y una lista vacía regresa vacía', () => {
    const ids = Logica.ordenarPedidos([pedido(9, 'Pendiente', '2026-11-20'), pedido(7, 'Pendiente', '2026-11-20')], HOY).map((p) => p.idPedido);
    expect(ids).toEqual([7, 9]);
    expect(Logica.ordenarPedidos([], HOY)).toEqual([]);
  });

  it('CP-RF5-07 · la lista original no se modifica', () => {
    const copia = lista.map((p) => p.idPedido);
    Logica.ordenarPedidos(lista, HOY);
    expect(lista.map((p) => p.idPedido)).toEqual(copia);
  });
});

// ---------------------------------------------------------------
// agruparPorPuntoEntrega
// ---------------------------------------------------------------
describe('RF5 · agruparPorPuntoEntrega', () => {
  it('CP-RF5-08 · válido: agrupa por punto de entrega aunque lo hayan escrito con otras mayúsculas, espacios o acentos', () => {
    const grupos = Logica.agruparPorPuntoEntrega([
      pedido(1, 'Pendiente', '2026-11-20', { puntoEntrega: 'Metro Cuautitlán' }),
      pedido(2, 'Pendiente', '2026-11-21', { puntoEntrega: '  metro  cuautitlan ' }),
      pedido(3, 'En proceso', '2026-11-22', { puntoEntrega: 'FES Cuautitlán' }),
    ], HOY);
    expect(grupos.length).toBe(2);
    expect(grupos.map((g) => g.total).sort()).toEqual([1, 2]);
  });

  it('CP-RF5-09 · el grupo con pedidos atrasados va primero y, dentro del grupo, el atrasado va antes', () => {
    const grupos = Logica.agruparPorPuntoEntrega([
      pedido(1, 'Pendiente', '2026-11-19', { puntoEntrega: 'FES Cuautitlán' }),
      pedido(2, 'Pendiente', '2026-11-22', { puntoEntrega: 'Metro Cuautitlán' }),
      pedido(3, 'Pendiente', '2026-11-16', { puntoEntrega: 'Metro Cuautitlán' }),   // atrasado
    ], HOY);
    expect(grupos[0].puntoEntrega).toBe('Metro Cuautitlán');
    expect(grupos[0].atrasados).toBe(1);
    expect(grupos[0].pedidos.map((p) => p.idPedido)).toEqual([3, 2]);
    expect(grupos[1].atrasados).toBe(0);
  });

  it('CP-RF5-16 · el grupo se llama como la mayoría de sus pedidos escribió el punto de entrega', () => {
    const grupos = Logica.agruparPorPuntoEntrega([
      pedido(1, 'Pendiente', '2026-11-20', { puntoEntrega: 'fes cuautitlan' }),
      pedido(2, 'Pendiente', '2026-11-21', { puntoEntrega: 'FES Cuautitlán' }),
      pedido(3, 'Pendiente', '2026-11-22', { puntoEntrega: 'FES Cuautitlán' }),
    ], HOY);
    expect(grupos.length).toBe(1);
    expect(grupos[0].puntoEntrega).toBe('FES Cuautitlán');
  });

  it('CP-RF5-10 · límite: sin pedidos no hay grupos, y un pedido sin punto de entrega queda en "Sin punto de entrega"', () => {
    expect(Logica.agruparPorPuntoEntrega([], HOY)).toEqual([]);
    const grupos = Logica.agruparPorPuntoEntrega([pedido(1, 'Pendiente', '2026-11-20', { puntoEntrega: '   ' })], HOY);
    expect(grupos[0].puntoEntrega).toBe('Sin punto de entrega');
  });
});

// ---------------------------------------------------------------
// filtrarPedidos
// ---------------------------------------------------------------
describe('RF5 · filtrarPedidos', () => {
  const lista = [
    pedido(1, 'Pendiente', '2026-11-15', { idCliente: 1 }),   // atrasado
    pedido(2, 'En proceso', '2026-11-25', { idCliente: 2 }),
    pedido(3, 'Entregado', '2026-11-10', { idCliente: 1 }),
    pedido(4, 'Pendiente', '2026-11-30', { idCliente: 2 }),
  ];
  const ids = (r) => r.map((p) => p.idPedido);

  it('CP-RF5-11 · válido: filtra por estado y por cliente, y se pueden combinar', () => {
    expect(ids(Logica.filtrarPedidos(lista, { estado: 'Pendiente', hoy: HOY }))).toEqual([1, 4]);
    expect(ids(Logica.filtrarPedidos(lista, { idCliente: '1', hoy: HOY }))).toEqual([1, 3]);
    expect(ids(Logica.filtrarPedidos(lista, { estado: 'Pendiente', idCliente: 2, hoy: HOY }))).toEqual([4]);
  });

  it('CP-RF5-12 · válido: "solo atrasados" deja únicamente los pedidos atrasados', () => {
    expect(ids(Logica.filtrarPedidos(lista, { soloAtrasados: true, hoy: HOY }))).toEqual([1]);
  });

  it('CP-RF5-13 · límite: sin filtros regresa todos y un filtro sin coincidencias regresa lista vacía', () => {
    expect(ids(Logica.filtrarPedidos(lista, {}))).toEqual([1, 2, 3, 4]);
    expect(Logica.filtrarPedidos(lista, { estado: 'Cancelado' })).toEqual([]);
  });

  it('CP-RF5-14 · inválido: un estado que no existe se rechaza con error', () => {
    expect(() => Logica.filtrarPedidos(lista, { estado: 'Atrasado' })).toThrow();
  });
});

// ---------------------------------------------------------------
// Integración con datos.js
// ---------------------------------------------------------------
describe('RF5 · listado con pedidos guardados', () => {
  beforeEach(() => Datos.reiniciarDatos());

  it('CP-RF5-15 · un pedido creado con fecha de compromiso vencida aparece atrasado, primero y agrupado en su punto de entrega', () => {
    const crear = (idCliente, compromiso, punto) => {
      const r = Logica.armarPedido({
        idCliente: String(idCliente),
        partidas: [{ idProducto: 1, cantidad: 1, precioUnitario: 350 }],
        puntoEntrega: punto,
        fechaCompromiso: compromiso,
        fechaCreacion: '2026-11-01',
      });
      return Datos.guardarPedido(r.pedido, r.partidas);
    };
    crear(1, '2026-11-25', 'Metro Cuautitlán');
    crear(1, '2026-11-10', 'Metro Cuautitlán');   // vencido antes de HOY

    const todos = Datos.obtenerPedidos();
    const ordenados = Logica.ordenarPedidos(todos, HOY);
    expect(ordenados[0].idPedido).toBe(2);
    expect(Logica.esAtrasado(ordenados[0], HOY)).toBe(true);

    const grupos = Logica.agruparPorPuntoEntrega(todos, HOY);
    expect(grupos.length).toBe(1);
    expect(grupos[0].atrasados).toBe(1);
  });
});