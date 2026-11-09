# Plan de despliegue del incremento

Informática III · Grupo 1301 · Ciclo 2027-1 · Tema: 3.5 Fase de Despliegue

| Dato | Respuesta |
|---|---|
| Equipo (número) | 2 |
| Modelo asignado | Cascada |
| Integrantes | Barrera Farfán Landon Donovan · Felipe Mondragón Isaí · Hernández Hernández Wendy Génesis Ashlan · Paredes Sánchez Mónica Fernanda |
| Contexto de negocio de nuestro sistema | Movika Accesorios es un negocio de joyería de plata que gestionaba sus ventas por WhatsApp. El sistema web centraliza el registro de clientes, el catálogo y los pedidos, con fecha de compromiso obligatoria, cancelación con motivo y prioridad para los pedidos atrasados. |

## 1. Alcance del incremento

Hoy está desplegada la base del sistema: la capa de datos y la lógica de la fecha de compromiso (Tareas 1 a 3), que se verifican con páginas de pruebas. Las pantallas (Tareas 4 a 8) todavía no se construyen; empiezan el lunes 9 de noviembre.

| Requisito | ¿Entra en este despliegue? (Sí / Parcial / No) | Qué incluye exactamente o por qué queda fuera |
|---|---|---|
| RF1 | Parcial | Entra: guardar y consultar clientes en la capa de datos (Tarea 1). Queda fuera: el formulario, la lista y `validarCliente` (Tarea 4). |
| RF2 | Parcial | Entra: guardar y consultar productos en la capa de datos (Tarea 1). Queda fuera: la pantalla del catálogo y el filtro por tipo (Tarea 5). |
| RF3 | Parcial | Entra: guardar un pedido con sus partidas y el total congelado (Tarea 1) y la validación de la fecha de compromiso (Tarea 2). Queda fuera: el formulario para crear pedido (Tarea 6). |
| RF4 | No | El cambio de estado y la cancelación con motivo (Tarea 7) no se han construido. La capa de datos ya puede guardar el estado y el motivo. |
| RF5 | No | El listado de pedidos agrupado por punto de entrega, con atrasados primero (Tarea 8), no se ha construido. |
| Cambio de requisito (5 oct) | Parcial | Entra: la fecha de compromiso obligatoria y válida al crear el pedido (Tarea 2) y modificarla mientras el pedido no esté cerrado (Tarea 3). Queda fuera: la cancelación con motivo (Tarea 7) y los pedidos atrasados primero (Tarea 8). |

Meta para el despliegue final: todas las tareas integradas y las funciones congeladas el jueves 19 de noviembre.

## 2. Destino y configuración

| Elemento | Respuesta |
|---|---|
| Destino | Vercel |
| Proyecto o URL en Vercel | https://equipo-cascada-bombastic-movika-acc.vercel.app (proyecto creado en la cuenta de Donovan) |
| Repositorio desde el que se despliega | info3-fesc-2027-1/Equipo-Cascada-Bombastic-Movika-Accesorios |
| Rama que se publica en producción | `main` |
| Comando de build (si aplica) | Ninguno. Es un sitio estático de HTML y JavaScript (Application Preset: Other). Tailwind se carga por CDN con una etiqueta `<script>`, sin compilar. |

Variables de entorno necesarias

| Nombre de la variable | Para qué sirve |
|---|---|
| Ninguna | El sistema no usa credenciales ni claves. |

Servicios externos de los que depende el sistema

- Ningún servidor, base de datos ni API: los datos se guardan en el LocalStorage del navegador.
- Tailwind CSS por CDN (`cdn.tailwindcss.com`), para los estilos. El profesor permitió usarlo y lo sugirió para este proyecto.

## 3. Checklist pre-despliegue

| # | Verificación | ¿Cumple? (Sí / No) | Responsable |
|---|---|---|---|
| 1 | Las páginas de pruebas de `html-pruebas/` abren en Vercel y muestran sus pruebas en ✔ | Pendiente (se llena el lunes) | Donovan |
| 2 | `npm test` corre en Codespaces y los casos del plan pasan, o las fallas conocidas están anotadas | Pendiente (se llena el lunes) | Isaí |
| 3 | `index.html` abre sin errores en la consola y Tailwind carga (existen `css/styles.css` y `js/app.js`) | Pendiente (se llena el lunes) | Wendy |
| 4 | Cada cambio que entra a `main` tiene un revisor distinto del autor, según los pares de revisión | Pendiente (se llena el lunes) | Mónica |
| 5 | El último despliegue de `main` en Vercel dice Ready y la URL muestra lo último | Pendiente (se llena el lunes) | Donovan |

## 4. Smoke test (verificación posdespliegue)

| # | Acción | Resultado esperado | Resultado obtenido (se llena el lunes) |
|---|---|---|---|
| 1 | Abrir la URL base de Vercel | `index.html` carga con los estilos de Tailwind, sin 404 y sin errores en la consola | |
| 2 | Abrir la página de pruebas de la Tarea 1 (`html-pruebas/pruebas-datos.html`) | Todas las pruebas aparecen con ✔ | |
| 3 | Abrir las páginas de pruebas de las Tareas 2 y 3 | Todas las pruebas aparecen con ✔ | |
| 4 | Solo si la Tarea 4 entra el lunes: registrar un cliente nuevo | Aparece en la lista de clientes | |
| 5 | Solo si la Tarea 6 entra el lunes: crear un pedido con la fecha de compromiso vacía | Muestra un error y no guarda el pedido | |

## 5. Plan de reversión

Responsable de la reversión: Donovan (dueño del proyecto de Vercel).

Señal para revertir: falla cualquiera de las pruebas 1 a 3 del smoke test, o la URL da error o 404.

Pasos:

1. En Vercel, abrir el proyecto, ir a Deployments y elegir el último despliegue que funcionaba. Restaurarlo con Instant Rollback (o Promote to Production).
2. En GitHub, revertir el PR o commit que causó el fallo (botón Revert) y hacer merge a `main`, para que el repositorio coincida con lo publicado.
3. Abrir la URL, repetir las pruebas 1 a 3 del smoke test y avisar al equipo.

## 6. Despliegue según nuestro modelo

En Cascada las fases van en orden: análisis, diseño, implementación, pruebas y despliegue, sin volver atrás. Por eso un equipo en Cascada debería desplegar una sola vez, hasta el final, cuando el sistema completo ya pasó las pruebas. Nuestro plan real no es del todo coherente con eso. Desde la práctica del 26 de octubre tenemos una URL en Vercel que se actualiza con cada cambio a `main`, así que en la práctica desplegamos varias veces y con funcionalidad incompleta. Lo hicimos por tres razones: la materia pide una URL funcionando desde el primer laboratorio, Vercel despliega automáticamente al subir a `main`, y detectar errores de rutas o configuración temprano es más barato que descubrirlos al final. Tratamos esos despliegues intermedios como verificaciones y no como entregas: el despliegue que cuenta es el de la versión final, que haremos después de correr todo el plan de pruebas y de congelar las funciones, el jueves 19 de noviembre. Lo que sí respetamos de Cascada es que el diseño y las firmas de las funciones se congelaron antes de programar, y que las pruebas se escribieron a partir de los requisitos.

## Bloqueos para el lunes

- Las Tareas 4 a 8 (pantallas y su lógica) todavía no se han empezado. Con solo un laboratorio con computadora, el lunes 9 es el momento de avanzar las tareas 4 a 6.
- Las funciones `validarCliente`, `filtrarProductosPorTipo`, `calcularTotal` y `validarPedido` todavía no están escritas en `js/logica.js`.
- Todavía no existe `package.json` con Vitest para correr `npm test`.
- `js/app.js` y `css/styles.css` aún no tienen contenido, así que la interfaz está vacía.

## Declaración de uso de IA

| Herramienta | Para qué la usamos | Qué verificamos nosotros |
|---|---|---|
| Claude | Explicar la plantilla y redactar un borrador de este plan a partir de lo que ya tenemos del proyecto | Que la URL, el repositorio y la rama coinciden con Vercel y GitHub, y que el alcance y los bloqueos reflejan el estado real del equipo |
