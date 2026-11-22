/**
 * acceso.js — Inicio de sesión · Movika Accesorios
 *
 * Solo se usa en modo nube (cuando config.js trae los datos de Supabase).
 * Muestra una pantalla de acceso que cubre toda la página hasta que alguien inicia sesión con
 * correo y contraseña. No hay botón de "Crear cuenta": las cuentas las crea la propietaria o
 * quien administra el proyecto desde el panel de Supabase.
 *
 * IMPORTANTE sobre seguridad: esta pantalla es la puerta de la página; lo que de verdad protege
 * los datos son las reglas de la base (RLS en supabase/esquema.sql), que rechazan cualquier
 * petición sin sesión aunque alguien se salte esta pantalla.
 */
(function (global) {
  "use strict";

  const ocultables = () => Array.from(document.querySelectorAll("header, main, footer"));

  function bloquearPagina(bloquear) {
    ocultables().forEach(function (el) {
      el.inert = bloquear; // sin foco ni teclado mientras se ve la pantalla de acceso
    });
  }

  function mensajeDeLogin(error) {
    const texto = String((error && error.message) || "");
    const codigo = String((error && (error.code || error.error_code)) || "");
    if (codigo === "invalid_credentials" || /invalid login credentials/i.test(texto)) {
      return "Correo o contraseña incorrectos.";
    }
    if (/failed to fetch|networkerror|load failed/i.test(texto)) {
      return "No se pudo conectar. Revisa tu conexión a internet e inténtalo de nuevo.";
    }
    if (codigo === "over_request_rate_limit" || /rate limit/i.test(texto)) {
      return "Demasiados intentos. Espera unos minutos e inténtalo de nuevo.";
    }
    return "No se pudo iniciar sesión. Inténtalo de nuevo.";
  }

  // Dibuja la pantalla de acceso y devuelve una promesa que se cumple cuando se inicia sesión.
  function pedirInicioDeSesion(cliente) {
    return new Promise(function (resolver) {
      const pantalla = document.createElement("div");
      pantalla.id = "acceso";
      pantalla.className = "acceso";
      pantalla.innerHTML = `
        <div class="acceso-caja">
          <p class="titulo">Movika Accesorios</p>
          <section class="panel" aria-labelledby="acc-titulo">
            <h2 id="acc-titulo">Iniciar sesión</h2>
            <p>Acceso exclusivo para la propietaria y su equipo.</p>
            <form id="acc-form" class="formulario" novalidate>
              <div class="grupo">
                <label for="acc-correo" class="etiqueta">Correo</label>
                <input id="acc-correo" name="correo" type="email" autocomplete="username" class="campo">
              </div>
              <div class="grupo">
                <label for="acc-clave" class="etiqueta">Contraseña</label>
                <input id="acc-clave" name="clave" type="password" autocomplete="current-password" class="campo">
              </div>
              <p id="acc-error" role="alert" hidden class="mensaje mensaje-error"></p>
              <div class="acciones">
                <button type="submit" id="acc-entrar" class="boton">Entrar</button>
              </div>
            </form>
          </section>
        </div>`;
      document.body.appendChild(pantalla);
      bloquearPagina(true);

      const form = pantalla.querySelector("#acc-form");
      const cajaError = pantalla.querySelector("#acc-error");
      const botonEntrar = pantalla.querySelector("#acc-entrar");
      pantalla.querySelector("#acc-correo").focus();

      form.addEventListener("submit", async function (evento) {
        evento.preventDefault();
        const correo = String(new FormData(form).get("correo") || "").trim();
        const clave = String(new FormData(form).get("clave") || "");

        if (correo === "" || clave === "") {
          cajaError.textContent = "Escribe tu correo y tu contraseña.";
          cajaError.hidden = false;
          return;
        }

        botonEntrar.disabled = true;
        cajaError.hidden = true;
        let respuesta;
        try {
          respuesta = await cliente.auth.signInWithPassword({ email: correo, password: clave });
        } catch (e) {
          respuesta = { data: null, error: e };
        }
        botonEntrar.disabled = false;

        if (respuesta.error || !respuesta.data || !respuesta.data.session) {
          cajaError.textContent = mensajeDeLogin(respuesta.error);
          cajaError.hidden = false;
          pantalla.querySelector("#acc-clave").value = "";
          pantalla.querySelector("#acc-clave").focus();
          return;
        }

        pantalla.remove();
        bloquearPagina(false);
        resolver(respuesta.data.session);
      });
    });
  }

  // Muestra quién tiene la sesión abierta y el botón para cerrarla.
  function mostrarBarraDeSesion(cliente, correo) {
    const encabezado = document.querySelector(".encabezado");
    if (!encabezado || document.getElementById("barra-sesion")) return;

    const barra = document.createElement("div");
    barra.id = "barra-sesion";
    barra.className = "barra-sesion";
    barra.innerHTML = '<span id="sesion-correo"></span><button type="button" id="btn-salir" class="boton boton-chico">Cerrar sesión</button>';
    barra.querySelector("#sesion-correo").textContent = correo || "";
    barra.querySelector("#btn-salir").addEventListener("click", async function () {
      this.disabled = true;
      try {
        await cliente.auth.signOut();
      } finally {
        global.location.reload();
      }
    });
    encabezado.appendChild(barra);
  }

  // Resuelve cuando hay una sesión válida (la que ya estaba abierta o la que se acaba de iniciar).
  async function exigirSesion() {
    const cliente = global.clienteSupabase;
    if (!cliente) throw new Error("No hay conexión con Supabase configurada.");

    let yaRecargando = false;
    const recargar = function () {
      if (yaRecargando) return;
      yaRecargando = true;
      global.location.reload();
    };

    cliente.auth.onAuthStateChange(function (evento) {
      if (evento === "SIGNED_OUT") recargar();
    });

    // Si el servidor deja de aceptar la sesión, se cierra y se vuelve a pedir el inicio de sesión.
    global.addEventListener("movika:sesion-expirada", async function () {
      if (yaRecargando) return;
      try {
        await cliente.auth.signOut();
      } finally {
        recargar();
      }
    });

    const actual = await cliente.auth.getSession();
    let sesion = actual && actual.data && actual.data.session;
    if (!sesion) {
      sesion = await pedirInicioDeSesion(cliente);
    }
    mostrarBarraDeSesion(cliente, sesion.user && sesion.user.email);
    return sesion;
  }

  global.Acceso = { exigirSesion };
})(typeof window !== "undefined" ? window : globalThis);