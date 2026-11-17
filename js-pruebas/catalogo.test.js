// js-pruebas/catalogo.test.js · Pruebas de la Tarea 5 (catálogo, RF2) · Equipo 2 · Movika Accesorios
// Correr con: npm test   (Vitest)
import { describe, it, expect, beforeEach } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Datos = require('../js/datos.js');
const Logica = require('../js/logica.js');

const pieza = {
  nombrePieza: 'Anillo luna',
  tipoAccesorio: 'Anillo',
  precio: 350,
  descripcion: 'Plata 925 con grabado',
  materialPersonalizable: 'Plata 925',
};

describe('RF2 · validarProducto', () => {
  it('válido: una pieza completa se acepta', () => {
    expect(Logica.validarProducto(pieza).valida).toBe(true);
  });

  it('válido: la descripción y el material personalizable son opcionales', () => {
    const r = Logica.validarProducto({ ...pieza, descripcion: '', materialPersonalizable: '' });
    expect(r.valida).toBe(true);
  });

  it('válido: el precio puede llegar como texto numérico (así lo manda el formulario)', () => {
    expect(Logica.validarProducto({ ...pieza, precio: '350' }).valida).toBe(true);
  });

  it('límite: el precio más bajo posible (0.01) se acepta', () => {
    expect(Logica.validarProducto({ ...pieza, precio: 0.01 }).valida).toBe(true);
  });

  it('límite: un precio de 0 se rechaza', () => {
    const r = Logica.validarProducto({ ...pieza, precio: 0 });
    expect(r.valida).toBe(false);
    expect(r.mensaje).toMatch(/mayor que 0/);
  });

  it('inválido: sin nombre (vacío o solo espacios) se rechaza', () => {
    const r = Logica.validarProducto({ ...pieza, nombrePieza: '   ' });
    expect(r.valida).toBe(false);
    expect(r.mensaje).toMatch(/nombre/i);
  });

  it('inválido: sin tipo de accesorio se rechaza', () => {
    const r = Logica.validarProducto({ ...pieza, tipoAccesorio: '' });
    expect(r.valida).toBe(false);
    expect(r.mensaje).toMatch(/tipo/i);
  });

  it('inválido: un tipo que no existe ("Reloj") se rechaza', () => {
    const r = Logica.validarProducto({ ...pieza, tipoAccesorio: 'Reloj' });
    expect(r.valida).toBe(false);
    expect(r.mensaje).toMatch(/tipo/i);
  });

  it('inválido: sin precio se rechaza e indica que es obligatorio', () => {
    const r = Logica.validarProducto({ ...pieza, precio: '' });
    expect(r.valida).toBe(false);
    expect(r.mensaje).toMatch(/obligatorio/i);
  });

  it('inválido: un precio negativo o que no es número se rechaza', () => {
    expect(Logica.validarProducto({ ...pieza, precio: -5 }).valida).toBe(false);
    expect(Logica.validarProducto({ ...pieza, precio: 'abc' }).valida).toBe(false);
  });
});

describe('RF2 · tipos y filtro por tipo', () => {
  beforeEach(() => Datos.reiniciarDatos());

  it('los tipos del catálogo son anillos, aretes, collares y pulseras', () => {
    expect(Logica.TIPOS_ACCESORIO).toEqual(['Anillo', 'Aretes', 'Collar', 'Pulsera']);
  });

  it('se registra una pieza con tipo y atributos y se puede filtrar por tipo', () => {
    Datos.guardarProducto(pieza);
    Datos.guardarProducto({ nombrePieza: 'Collar gota', tipoAccesorio: 'Collar', precio: 480 });
    Datos.guardarProducto({ nombrePieza: 'Anillo sol', tipoAccesorio: 'Anillo', precio: 320 });

    const anillos = Logica.filtrarProductosPorTipo(Datos.obtenerProductos(), 'Anillo');
    expect(anillos.map((p) => p.nombrePieza)).toEqual(['Anillo luna', 'Anillo sol']);
    expect(anillos[0].precio).toBe(350);
    expect(anillos[0].materialPersonalizable).toBe('Plata 925');
  });

  it('filtrar un tipo sin piezas regresa una lista vacía, sin error', () => {
    Datos.guardarProducto(pieza);
    expect(Logica.filtrarProductosPorTipo(Datos.obtenerProductos(), 'Pulsera')).toEqual([]);
  });
});