// js-pruebas/datos-supabase.test.js · Pruebas de la capa de datos en la nube (datos-supabase.js)
// Usan falso-supabase.js (una imitación de Supabase), no el servicio real.
// Correr con: npm test   (Vitest)
import { describe, it, expect, beforeEach } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { crearServidor, crearCliente } = require('./falso-supabase.cjs');
const { crearDatosNube } = require('../js/datos-supabase.js');

let servidor;
let Datos;
let cliente;

function memoria() {
  let token = null;
  return { get: () => token, set: (t) => { token = t; }, remove: () => { token = null; } };
}

async function conectar(iniciarSesion = true) {
  servidor = crearServidor();
  cliente = crearCliente(async (p, t) => servidor.ejecutar(p, t), memoria());
  if (iniciarSesion) {
    await cliente.auth.signInWithPassword({ email: 'propietaria@movika.test', password: 'Clave-Segura-1' });
  }
  Datos = crearDatosNube(cliente);
}

// Devuelve el error si la promesa falla (o null si no falla)
async function falla(promesa) {
  try {
    await promesa;
  } catch (e) {
    return e;
  }
  return null;
}

async function pedidoDePrueba() {
  const c = await Datos.guardarCliente({ nombre: 'Ana López', contactoWhatsapp: '5512345678' });
  const p = await Datos.guardarProducto({ nombrePieza: 'Anillo luna', tipoAccesorio: 'Anillo', precio: 350 });
  const k = await Datos.guardarProducto({ nombrePieza: 'Collar gota', tipoAccesorio: 'Collar', precio: 480 });
  const pedido = await Datos.guardarPedido(
    { idCliente: c.idCliente, fechaCreacion: '2026-11-16', fechaCompromiso: '2026-11-20', puntoEntrega: 'Metro Cuautitlán', total: 1180 },
    [
      { idProducto: p.idProducto, cantidad: 2, precioUnitario: 350, subtotal: 700, personalizacion: 'Inicial A' },
      { idProducto: k.idProducto, cantidad: 1, precioUnitario: 480, subtotal: 480 },
    ]
  );
  return { c, p, k, pedido };
}

describe('NUBE · clientes y productos', () => {
  beforeEach(() => conectar());

  it('CP-NUBE-01 · un cliente se guarda y se lee con los mismos nombres de campo que usa la página', async () => {
    const guardado = await Datos.guardarCliente({
      nombre: 'Ana López', contactoWhatsapp: '5512345678', metalPreferido: 'Plata 925', talla: '7',
      fechaImportante: '2026-12-12', notasPreferencias: 'Minimalista',
    });
    expect(guardado.idCliente).toBe(1);
    const leidos = await Datos.obtenerClientes();
    expect(leidos.length).toBe(1);
    expect(leidos[0].contactoWhatsapp).toBe('5512345678');
    expect(leidos[0].fechaImportante).toBe('2026-12-12');
    expect((await Datos.obtenerClientePorId(1)).nombre).toBe('Ana López');
  });

  it('CP-NUBE-02 · sin fecha importante se guarda vacía y vuelve como texto vacío', async () => {
    await Datos.guardarCliente({ nombre: 'Luis', contactoWhatsapp: '5598765432', fechaImportante: '' });
    expect((await Datos.obtenerClientes())[0].fechaImportante).toBe('');
  });

  it('CP-NUBE-03 · un producto se guarda con su precio como número y uno inexistente regresa null', async () => {
    const p = await Datos.guardarProducto({ nombrePieza: 'Anillo luna', tipoAccesorio: 'Anillo', precio: '350' });
    expect(p.precio).toBe(350);
    expect(await Datos.obtenerProductoPorId(999)).toBeNull();
    expect(await Datos.obtenerClientePorId(999)).toBeNull();
  });

  it('CP-NUBE-04 · inválido: la base rechaza un producto con precio 0 o un tipo que no existe', async () => {
    const e1 = await falla(Datos.guardarProducto({ nombrePieza: 'X', tipoAccesorio: 'Anillo', precio: 0 }));
    const e2 = await falla(Datos.guardarProducto({ nombrePieza: 'X', tipoAccesorio: 'Reloj', precio: 100 }));
    expect(e1.message).toMatch(/reglas de la base de datos/);
    expect(e2.message).toMatch(/reglas de la base de datos/);
    expect((await Datos.obtenerProductos()).length).toBe(0);
  });
});

describe('NUBE · pedidos', () => {
  beforeEach(() => conectar());

  it('CP-NUBE-05 · un pedido se guarda con sus partidas y el total queda congelado', async () => {
    const { pedido, c } = await pedidoDePrueba();
    expect(pedido.estado).toBe('Pendiente');
    expect(pedido.total).toBe(1180);
    expect(pedido.idCliente).toBe(c.idCliente);
    const partidas = await Datos.obtenerPartidasDePedido(pedido.idPedido);
    expect(partidas.length).toBe(2);
    expect(partidas[0].personalizacion).toBe('Inicial A');
    expect(partidas[0].subtotal).toBe(700);
  });

  it('CP-NUBE-06 · inválido: un pedido sin piezas no se guarda (todo o nada)', async () => {
    const c = await Datos.guardarCliente({ nombre: 'Ana', contactoWhatsapp: '5512345678' });
    const e = await falla(Datos.guardarPedido({ idCliente: c.idCliente, fechaCreacion: '2026-11-16', fechaCompromiso: '2026-11-20', puntoEntrega: 'Metro', total: 0 }, []));
    expect(e.message).toMatch(/al menos una pieza/);
    expect((await Datos.obtenerPedidos()).length).toBe(0);
  });

  it('CP-NUBE-07 · avanzar de estado y cambiar la fecha se guardan, y el total no cambia', async () => {
    const { pedido } = await pedidoDePrueba();
    const a = await Datos.actualizarPedido({ idPedido: pedido.idPedido, estado: 'En proceso' }, { estadoAnterior: 'Pendiente' });
    expect(a.estado).toBe('En proceso');
    const b = await Datos.actualizarPedido({ idPedido: pedido.idPedido, fechaCompromiso: '2026-11-25' }, { estadoAnterior: 'En proceso' });
    expect(b.fechaCompromiso).toBe('2026-11-25');
    expect(b.total).toBe(1180);
  });

  it('CP-NUBE-08 · si otra persona ya cambió el estado, no se pisa y se avisa', async () => {
    const { pedido } = await pedidoDePrueba();
    await Datos.actualizarPedido({ idPedido: pedido.idPedido, estado: 'En proceso' }, { estadoAnterior: 'Pendiente' });
    const e = await falla(Datos.actualizarPedido({ idPedido: pedido.idPedido, estado: 'En proceso' }, { estadoAnterior: 'Pendiente' }));
    expect(e.message).toMatch(/ya cambió/);
  });

  it('CP-NUBE-09 · cancelar guarda el motivo y un pedido cerrado ya no se puede modificar', async () => {
    const { pedido } = await pedidoDePrueba();
    const c = await Datos.actualizarPedido({ idPedido: pedido.idPedido, estado: 'Cancelado', motivoCancelacion: 'El cliente ya no lo requiere' });
    expect(c.motivoCancelacion).toBe('El cliente ya no lo requiere');
    const e = await falla(Datos.actualizarPedido({ idPedido: pedido.idPedido, fechaCompromiso: '2026-11-30' }));
    expect(e.message).toMatch(/Cancelado y ya no se puede modificar/);
  });

  it('CP-NUBE-10 · inválido: la base rechaza cancelar sin motivo y saltarse el orden de estados', async () => {
    const { pedido } = await pedidoDePrueba();
    const sinMotivo = await falla(Datos.actualizarPedido({ idPedido: pedido.idPedido, estado: 'Cancelado', motivoCancelacion: '' }));
    expect(sinMotivo.message).toMatch(/reglas de la base de datos/);
    const salto = await falla(Datos.actualizarPedido({ idPedido: pedido.idPedido, estado: 'Entregado' }));
    expect(salto.message).toMatch(/Cambio de estado no permitido/);
    expect((await Datos.obtenerPedidoPorId(pedido.idPedido)).estado).toBe('Pendiente');
  });
});

describe('NUBE · sesión y conexión', () => {
  it('CP-NUBE-11 · sin iniciar sesión no se ve nada y no se puede guardar', async () => {
    await conectar(false);
    expect(await Datos.obtenerClientes()).toEqual([]);
    const e = await falla(Datos.guardarCliente({ nombre: 'Intruso', contactoWhatsapp: '5500000000' }));
    expect(e.message).toMatch(/sesión/);
    expect(servidor.tablas.clientes.length).toBe(0);
  });

  it('CP-NUBE-12 · quien tiene la sesión vencida recibe un aviso para iniciar sesión de nuevo', async () => {
    await conectar();
    servidor.expirarSesiones();
    const e = await falla(Datos.obtenerClientes());
    expect(e.message).toMatch(/Inicia sesión de nuevo/);
  });

  it('CP-NUBE-13 · sin conexión se explica en palabras claras', async () => {
    await conectar();
    servidor.sinConexion = true;
    const e = await falla(Datos.obtenerProductos());
    expect(e.message).toMatch(/No se pudo conectar/);
  });

  it('CP-NUBE-14 · las cuentas se comparten: lo que guarda una persona lo ve otra desde otro equipo', async () => {
    await conectar();
    await Datos.guardarCliente({ nombre: 'Ana López', contactoWhatsapp: '5512345678' });

    const otro = crearCliente(async (p, t) => servidor.ejecutar(p, t), memoria());
    await otro.auth.signInWithPassword({ email: 'trabajadora@movika.test', password: 'Otra-Clave-2' });
    const DatosOtro = crearDatosNube(otro);
    expect((await DatosOtro.obtenerClientes()).map((x) => x.nombre)).toEqual(['Ana López']);
  });
});