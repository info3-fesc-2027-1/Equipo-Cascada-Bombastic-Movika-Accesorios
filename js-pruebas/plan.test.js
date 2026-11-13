// js-pruebas/plan.test.js · Plan de pruebas · Equipo 2 · Movika Accesorios
// Correr con: npm test   (Vitest)
import { describe, it, expect, beforeEach } from 'vitest';
import { createRequire } from 'node:module';

// datos.js y logica.js son archivos "clásicos" (module.exports), por eso se cargan con require
const require = createRequire(import.meta.url);
const Datos = require('../js/datos.js');
const Logica = require('../js/logica.js');

const catalogo = [
  { idProducto: 1, nombrePieza: 'Anillo luna', tipoAccesorio: 'Anillo' },
  { idProducto: 2, nombrePieza: 'Collar gota', tipoAccesorio: 'Collar' },
];

// ---------------------------------------------------------------
// RF1 · guardarCliente / obtenerClientePorId  (datos.js)
// ---------------------------------------------------------------
describe('RF1 · guardarCliente / obtenerClientePorId', () => {
  beforeEach(() => Datos.reiniciarDatos());

  it('CP-RF_-01 · válido: se guarda con idCliente 1 y se consulta igual', () => {
    const guardado = Datos.guardarCliente({ nombre: 'Ana López', contactoWhatsapp: '5512345678' });
    expect(guardado.idCliente).toBe(1);
    const leido = Datos.obtenerClientePorId(1);
    expect(leido.nombre).toBe('Ana López');
    expect(leido.contactoWhatsapp).toBe('5512345678');
  });

  it('CP-RF_-07 · límite: solo con los datos obligatorios (sin talla ni notas) se guarda', () => {
    Datos.guardarCliente({ nombre: 'Luis Pérez', contactoWhatsapp: '5598765432' });
    const lista = Datos.obtenerClientes();
    expect(lista.length).toBe(1);
    expect(lista[0].talla).toBe('');
    expect(lista[0].notasPreferencias).toBe('');
  });

  it('CP-RF_-08 · inválido: consultar un cliente que no existe regresa null', () => {
    expect(Datos.obtenerClientePorId(999)).toBeNull();
  });
});

// ---------------------------------------------------------------
// RF1 · validarCliente  (logica.js)
// ---------------------------------------------------------------
describe('RF1 · validarCliente', () => {
  it('CP-RF_-09 · válido: nombre y WhatsApp presentes se aceptan', () => {
    const r = Logica.validarCliente({ nombre: 'Ana López', contactoWhatsapp: '5512345678' });
    expect(r.valida).toBe(true);
  });

  it('CP-RF_-10 · límite: un nombre de solo espacios se trata como vacío', () => {
    const r = Logica.validarCliente({ nombre: '   ', contactoWhatsapp: '5512345678' });
    expect(r.valida).toBe(false);
  });

  it('CP-RF_-02 · inválido: nombre vacío se rechaza e indica que es obligatorio', () => {
    const r = Logica.validarCliente({ nombre: '', contactoWhatsapp: '5512345678' });
    expect(r.valida).toBe(false);
    expect(r.mensaje).toMatch(/nombre/i);
  });
});

// ---------------------------------------------------------------
// RF2 · filtrarProductosPorTipo  (logica.js)
// ---------------------------------------------------------------
describe('RF2 · filtrarProductosPorTipo', () => {
  it('CP-RF_-03 · válido: el filtro "Anillo" regresa solo "Anillo luna"', () => {
    const r = Logica.filtrarProductosPorTipo(catalogo, 'Anillo');
    expect(r.map((p) => p.nombrePieza)).toEqual(['Anillo luna']);
  });

  it('CP-RF_-04 · límite: "Pulsera" sin ninguna pulsera regresa lista vacía, sin error', () => {
    const r = Logica.filtrarProductosPorTipo(catalogo, 'Pulsera');
    expect(r).toEqual([]);
  });

  it('CP-RF_-11 · inválido: un tipo que no existe en el catálogo ("Reloj") se rechaza', () => {
    expect(() => Logica.filtrarProductosPorTipo(catalogo, 'Reloj')).toThrow();
  });
});

// ---------------------------------------------------------------
// RF3 · validarFechaCompromiso  (logica.js) · RN-01 y RN-08
// ---------------------------------------------------------------
describe('RF3 · validarFechaCompromiso', () => {
  it('CP-RF_-05 · válido: una fecha posterior a la creación se acepta', () => {
    const r = Logica.validarFechaCompromiso('2026-11-20', '2026-11-04');
    expect(r.valida).toBe(true);
  });

  it('CP-RF_-12 · límite: la misma fecha de creación se acepta (no es anterior)', () => {
    const r = Logica.validarFechaCompromiso('2026-11-04', '2026-11-04');
    expect(r.valida).toBe(true);
  });

  it('CP-RF_-06 · inválido: fecha vacía se rechaza y dice que es obligatoria', () => {
    const r = Logica.validarFechaCompromiso('', '2026-11-04');
    expect(r.valida).toBe(false);
    expect(r.mensaje).toMatch(/obligatoria/i);
  });
});