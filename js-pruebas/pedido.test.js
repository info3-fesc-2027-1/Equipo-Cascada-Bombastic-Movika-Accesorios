// js-pruebas/pedido.test.js · Pruebas de la Tarea 6 (crear pedido · RF3 · RN-04, RN-06)
// Correr con: npm test   (Vitest)
import { describe, it, expect, beforeEach } from 'vitest';
import { createRequire } from 'node:module';

// datos.js y logica.js son archivos clásicos (module.exports), por eso se cargan con require
const require = createRequire(import.meta.url);
const Datos = require('../js/datos.js');
const Logica = require('../js/logica.js');

// Fechas fijas para que las pruebas no dependan del día en que se corran
const CREACION = '2026-11-16';
const COMPROMISO = '2026-11-20';

const piezas = [
  { idProducto: 1, cantidad: 2, precioUnitario: 350, personalizacion: 'Inicial A' },
  { idProducto: 2, cantidad: 1, precioUnitario: 480 },
];

function pedidoCompleto(cambios) {
  return {
    idCliente: '1',
    partidas: piezas,
    puntoEntrega: 'Metro Cuautitlán',
    fechaCompromiso: COMPROMISO,
    fechaCreacion: CREACION,
    ...cambios,
  };
}

// ---------------------------------------------------------------
// calcularTotal
// ---------------------------------------------------------------
describe('RF3 · calcularTotal', () => {
  it('CP-RF3-01 · válido: 2 × $350 + 1 × $480 suma $1,180', () => {
    expect(Logica.calcularTotal(piezas)).toBe(1180);
  });

  it('CP-RF3-02 · límite: una sola pieza de cantidad 1 vale su precio, y los centavos salen exactos', () => {
    expect(Logica.calcularTotal([{ cantidad: 1, precioUnitario: 350 }])).toBe(350);
    expect(Logica.calcularTotal([{ cantidad: 1, precioUnitario: 0.1 }, { cantidad: 1, precioUnitario: 0.2 }])).toBe(0.3);
  });

  it('CP-RF3-03 · inválido: una cantidad de 0 se rechaza con error', () => {
    expect(() => Logica.calcularTotal([{ cantidad: 0, precioUnitario: 350 }])).toThrow();
  });
});

// ---------------------------------------------------------------
// validarPedido (RN-04, RN-06, RN-01, RN-08)
// ---------------------------------------------------------------
describe('RF3 · validarPedido', () => {
  it('CP-RF3-04 · válido: cliente, piezas, punto de entrega y fecha se aceptan', () => {
    expect(Logica.validarPedido(pedidoCompleto()).valida).toBe(true);
  });

  it('CP-RF3-05 · límite: una fecha de compromiso igual a la de creación se acepta', () => {
    expect(Logica.validarPedido(pedidoCompleto({ fechaCompromiso: CREACION })).valida).toBe(true);
  });

  it('CP-RF3-06 · inválido (RN-04): sin cliente se rechaza', () => {
    const r = Logica.validarPedido(pedidoCompleto({ idCliente: '' }));
    expect(r.valida).toBe(false);
    expect(r.campo).toBe('idCliente');
  });

  it('CP-RF3-07 · inválido (RN-06): sin ninguna pieza se rechaza', () => {
    const r = Logica.validarPedido(pedidoCompleto({ partidas: [] }));
    expect(r.valida).toBe(false);
    expect(r.mensaje).toMatch(/al menos una pieza/i);
  });

  it('CP-RF3-08 · inválido: una pieza con cantidad 0 se rechaza', () => {
    const r = Logica.validarPedido(pedidoCompleto({ partidas: [{ idProducto: 1, cantidad: 0, precioUnitario: 350 }] }));
    expect(r.valida).toBe(false);
    expect(r.campo).toBe('partidas');
  });

  it('CP-RF3-09 · inválido: sin punto de entrega se rechaza', () => {
    const r = Logica.validarPedido(pedidoCompleto({ puntoEntrega: '   ' }));
    expect(r.valida).toBe(false);
    expect(r.campo).toBe('puntoEntrega');
  });

  it('CP-RF3-10 · inválido (RN-01): fecha de compromiso vacía se rechaza y dice que es obligatoria', () => {
    const r = Logica.validarPedido(pedidoCompleto({ fechaCompromiso: '' }));
    expect(r.valida).toBe(false);
    expect(r.mensaje).toMatch(/obligatoria/i);
  });

  it('CP-RF3-11 · inválido (RN-08): fecha de compromiso anterior a la creación se rechaza', () => {
    const r = Logica.validarPedido(pedidoCompleto({ fechaCompromiso: '2026-11-15' }));
    expect(r.valida).toBe(false);
    expect(r.campo).toBe('fechaCompromiso');
  });
});

// ---------------------------------------------------------------
// armarPedido y guardado
// ---------------------------------------------------------------
describe('RF3 · armarPedido y guardado', () => {
  beforeEach(() => Datos.reiniciarDatos());

  it('CP-RF3-12 · válido: el pedido nace Pendiente, con subtotales y total de $1,180', () => {
    const r = Logica.armarPedido(pedidoCompleto());
    expect(r.ok).toBe(true);
    expect(r.pedido.estado).toBe('Pendiente');
    expect(r.pedido.total).toBe(1180);
    expect(r.partidas.map((p) => p.subtotal)).toEqual([700, 480]);
  });

  it('CP-RF3-13 · inválido: con datos incompletos no arma nada', () => {
    const r = Logica.armarPedido(pedidoCompleto({ idCliente: '' }));
    expect(r.ok).toBe(false);
    expect(r.pedido).toBeNull();
  });

  it('CP-RF3-14 · se guarda ligado al cliente y un cambio de precio en el catálogo no altera su total', () => {
    const cliente = Datos.guardarCliente({ nombre: 'Ana López', contactoWhatsapp: '5512345678' });
    const anillo = Datos.guardarProducto({ nombrePieza: 'Anillo luna', tipoAccesorio: 'Anillo', precio: 350 });
    const collar = Datos.guardarProducto({ nombrePieza: 'Collar gota', tipoAccesorio: 'Collar', precio: 480 });

    const r = Logica.armarPedido(pedidoCompleto({
      idCliente: String(cliente.idCliente),
      partidas: [
        { idProducto: anillo.idProducto, cantidad: 2, precioUnitario: anillo.precio },
        { idProducto: collar.idProducto, cantidad: 1, precioUnitario: collar.precio },
      ],
    }));
    const guardado = Datos.guardarPedido(r.pedido, r.partidas);

    expect(Datos.obtenerPedidoPorId(guardado.idPedido).idCliente).toBe(cliente.idCliente);
    expect(Datos.obtenerPartidasDePedido(guardado.idPedido).length).toBe(2);

    Datos.guardarProducto({ nombrePieza: 'Anillo luna (nuevo precio)', tipoAccesorio: 'Anillo', precio: 999 });
    expect(Datos.obtenerPedidoPorId(guardado.idPedido).total).toBe(1180);
  });
});