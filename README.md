# Movika Accesorios

Plataforma web para la gestión de ventas de un negocio de joyería de plata. Proyecto académico de **Informática III. Análisis y Diseño de Sistemas I** (Grupo 1301), Licenciatura en Informática, **UNAM FES Cuautitlán**, ciclo 2027-1.

- **Equipo:** Equipo 2
- **Modelo de desarrollo:** Cascada
- **Sitio desplegado:** [https://….vercel.app](https://….vercel.app) <!-- TODO: pegar la URL real de Vercel -->

---

## Integrantes

| Integrante | Rol en el código |
|---|---|
| Barrera Farfán Landon Donovan | Datos (Tarea 1) y catálogo (Tarea 5) |
| Hernández Hernández Wendy Génesis Ashlan | Validación de fecha de compromiso (Tarea 2) y cambio de estado (Tarea 7) |
| Felipe Mondragón Isaí | Modificar fecha de compromiso (Tarea 3) y listado de pedidos (Tarea 8) |
| Paredes Sánchez Mónica Fernanda | Registro de clientes (Tarea 4) y creación de pedidos (Tarea 6) |

---

## Contexto y objetivo

Movika Accesorios gestionaba sus ventas de forma manual por WhatsApp. Este proyecto la sustituye por una plataforma web centralizada que permite:

- Automatizar los pedidos de los clientes.
- Optimizar la logística de entregas de la propietaria.
- Recuperar información de clientes y pedidos con rapidez.

---

## Funcionalidades (requisitos)

| Clave | Requisito | Descripción |
|---|---|---|
| RF1 | Registro de clientes | Alta y consulta de clientes con contacto de WhatsApp, metal preferido, talla, fecha importante y notas. |
| RF2 | Catálogo de productos | Alta de piezas de plata y filtrado por tipo (anillos, aretes, collares, pulseras). |
| RF3 | Crear pedido | Pedido ligado a un cliente, con piezas, cantidad, personalización, punto de entrega y fecha de compromiso. |
| RF4 | Seguimiento de estado | Cambio de estado del pedido y cancelación con motivo. |
| RF5 | Listado de pedidos | Tabla filtrable por estado o cliente, con pendientes agrupados por punto de entrega. |
| RC-01 | Cambio de requisito (5 oct) | Fecha de compromiso obligatoria, estado Cancelado con motivo obligatorio y prioridad para pedidos atrasados. |

### Reglas de negocio

- La **fecha de compromiso** es obligatoria al crear el pedido y solo puede modificarse mientras el pedido esté *Pendiente* o *En proceso*.
- Un pedido solo puede **cancelarse** desde *Pendiente* o *En proceso*, y el **motivo es obligatorio**.
- *Entregado* y *Cancelado* son estados finales: no cambian ni se reactivan.
- **«Atrasado» no es un estado.** Se calcula: la fecha de compromiso ya pasó y el pedido no está Entregado ni Cancelado. Los atrasados aparecen primero y resaltados en el listado.
- El **total** del pedido se calcula al crearlo (suma de subtotales de las partidas) y se guarda congelado, para que un cambio posterior de precio en el catálogo no altere pedidos históricos.

### Estados del pedido

```
Pendiente ──► En proceso ──► Entregado
    │             │
    └─────────────┴──► Cancelado (con motivo)
```

---

## Modelo de datos

| Entidad | Atributos | Relaciones |
|---|---|---|
| **Cliente** | idCliente, nombre, contactoWhatsapp, metalPreferido, talla, fechaImportante, notasPreferencias | 1 a N con Pedido |
| **Producto** | idProducto, nombrePieza, tipoAccesorio, precio, descripcion, materialPersonalizable | 1 a N con PartidaPedido |
| **Pedido** | idPedido, idCliente, fechaCreacion, fechaCompromiso, estado, puntoEntrega, motivoCancelacion (opcional), total | N a 1 con Cliente; 1 a N con PartidaPedido |
| **PartidaPedido** | idPartida, idPedido, idProducto, cantidad, precioUnitario, subtotal, personalizacion (opcional) | N a 1 con Pedido y con Producto |

---

## Arquitectura y estructura del proyecto

La lógica de negocio **no se mezcla con el HTML**, de modo que pueda probarse de forma independiente. El código se separa en tres capas:

| Archivo | Capa | Contenido |
|---|---|---|
| `datos.js` | Datos | Estructuras de Clientes, Productos, Pedidos y PartidaPedido, y funciones para guardarlos y leerlos. |
| `logica.js` | Lógica | `calcularTotal()`, `validarCliente()`, `validarPedido()`, `cambiarEstadoPedido()`, `cancelarPedido()`, `modificarFechaCompromiso()`, `esAtrasado()`, `ordenarPedidos()`, `agruparPorPuntoEntrega()`. |
| `index.html` / `app.js` | Interfaz | Vistas HTML y manejadores de eventos que llaman a `logica.js` y muestran resultados. No contienen reglas de negocio. |

> Ajusta esta tabla si las rutas reales del repo difieren (por ejemplo, si los archivos viven dentro de `src/`).

---

## Tecnologías

- **Frontend:** HTML, CSS y JavaScript, con diseño responsivo para catálogo y formularios.
- **Persistencia:** LocalStorage del navegador <!-- TODO: confirmar si el equipo usará otra solución -->.
- **Control de versiones:** Git y GitHub.
- **Desarrollo en la nube:** GitHub Codespaces.
- **Despliegue:** Vercel.

---

## Cómo ejecutarlo

```bash
# 1. Clonar el repositorio
git clone <URL-DEL-REPOSITORIO>
cd <nombre-del-repositorio>

# 2. Abrir index.html en el navegador
#    o servirlo localmente, por ejemplo:
npx serve .
```

En **GitHub Codespaces** basta con abrir el repositorio en un Codespace y usar la extensión *Live Server* o `npx serve .`.

---

## Flujo de trabajo del equipo

1. Cada integrante trabaja su tarea según el plan de implementación, en el orden **datos → lógica → interfaz**.
2. Cada commit indica el requisito que atiende, por ejemplo:
   - `RF2: registrar producto en catálogo`
   - `RF3: cálculo del total`
3. Una tarea se considera **terminada** cuando:
   - funciona en la URL de Vercel,
   - está en el repositorio con un commit que indica su RF,
   - y otra persona del equipo la probó.

---

## Plan de implementación

| # | Tarea | RF | Responsable | Capa | Estado |
|---|---|---|---|---|---|
| 1 | Base de datos y modelos base (Cliente, Producto, Pedido, Detalle) | RF1–RF5 | Donovan | Datos | [ ] |
| 2 | Validar fecha de compromiso obligatoria y válida | RC-01 | Wendy | Lógica | [ ] |
| 3 | Modificar fecha de compromiso de un pedido no cerrado | RC-01 | Isai | Lógica | [ ] |
| 4 | Registrar y consultar clientes | RF1 | Mónica | Interfaz–Lógica | [ ] |
| 5 | Registrar y consultar el catálogo | RF2 | Donovan | Lógica–Interfaz | [ ] |
| 6 | Formulario para crear pedido (estado inicial Pendiente) | RF3 | Mónica | Lógica–Interfaz | [ ] |
| 7 | Cambiar estado del pedido y cancelar con motivo | RF4, RC-01 | Wendy | Lógica | [ ] |
| 8 | Listado de pedidos agrupados por entrega y atrasados primero | RF5, RC-01 | Isai | Interfaz–Lógica | [ ] |

Las tareas 1 a 3 corresponden a la sesión del lunes 26 de octubre de 2026.

---

## Declaración de uso de IA

El equipo usó **Claude** para estructurar el modelo de datos, mapear los estados del pedido y dividir las tareas respetando la secuencia de la metodología en Cascada. El equipo verificó la división, la asignación de código a cada integrante y la adaptación de los requisitos al contexto de accesorios de plata.

---

## Licencia y uso

Proyecto con fines exclusivamente académicos. UNAM FES Cuautitlán, Informática III, Grupo 1301.
