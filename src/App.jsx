import { useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [pantalla, setPantalla] = useState("inicio");
  const [menuMovil, setMenuMovil] = useState(false);
  const [legalAbierto, setLegalAbierto] = useState(false);

  const [mensajeError, setMensajeError] = useState("");
  const [mensajeInfo, setMensajeInfo] = useState("");
  const [folio, setFolio] = useState("");
  const [guardando, setGuardando] = useState(false);

  const [archivos, setArchivos] = useState({});

  const [consentimientos, setConsentimientos] = useState({
    privacidad: false,
    buro: false,
    tratamiento: false,
    identidad: false,
  });

  const [datos, setDatos] = useState({
    montoSolicitado: "10000",
    plazoSolicitado: "6",
    destino: "",

    tipoPersona: "",

    celular: "",
    correo: "",
    password: "",

    /* PERSONA FÍSICA */

    nombre: "",
    apellidoPaterno: "",
    apellidoMaterno: "",
    curp: "",
    rfc: "",
    nacimiento: "",
    estadoCivil: "",
    regimenMatrimonial: "",
    dependientes: "",

    conyugeNombre: "",
    conyugeCurp: "",
    conyugeRfc: "",

    /* PERSONA MORAL */

    razonSocial: "",
    rfcEmpresa: "",
    fechaConstitucion: "",
    actividadEconomica: "",
    giroMercantil: "",
    nacionalidadEmpresa: "Mexicana",

    representanteLegal: "",
    rfcRepresentante: "",
    curpRepresentante: "",

    propietarioReal: "",
    rfcPropietarioReal: "",

    /* DOMICILIO */

    calle: "",
    numeroExterior: "",
    colonia: "",
    cp: "",
    municipio: "",
    estado: "",

    /* INGRESOS */

    ocupacion: "",
    empresaActividad: "",
    antiguedad: "",
    ingreso: "",
    ventasMensuales: "",
    frecuenciaPago: "",

    /* GARANTÍA */

    tipoCredito: "",
    tipoGarantia: "",
    descripcionGarantia: "",
    valorGarantia: "",

    garanteNombre: "",
    garanteTelefono: "",
    garanteCorreo: "",
    garanteRfc: "",

    /* BANCO */

    clabe: "",

    /*
      ESTOS VALORES LOS DEFINIRÁ MESA DE CRÉDITO.
      NO SE MUESTRAN AL CLIENTE ANTES DE LA OFERTA.
    */

    montoAprobado: "10000",
    plazoAprobado: "6",
    tasaAprobada: "49",
    comisionAprobada: "3",

    /*
      PROTOTIPO.
      Posteriormente deberá calcularse automáticamente.
    */
    catAprobado: "68.5",
  });

  const empresa = {
    razonSocial:
      "FDG5 SERVICIOS, S.A. DE C.V. SOFOM ENR",

    marca: "TRISAL",

    telefonoComercial: "844-102-9900",
    correoComercial: "contactofdg5@gmail.com",

    direccion:
      "Paseo del Valle 310, Colonia San Patricio, Saltillo, Coahuila",

    /*
      SUSTITUIR POR INFORMACIÓN OFICIAL
      ANTES DE PRODUCCIÓN.
    */
    uneTelefono: "PENDIENTE",
    uneCorreo: "PENDIENTE",

    condusefTelefono: "55 53 400 999",
    condusefCorreo: "asesoria@condusef.gob.mx",
  };

  /*
    DATOS GENERALES DEL PRODUCTO.

    Posteriormente moveremos estos valores
    a Supabase para que sean configurables.
  */

  const producto = {
    nombre: "Crédito Simple TRISAL",

    tipo:
      "Crédito simple con tasa de interés fija.",

    mercadoObjetivo:
      "Personas físicas con actividad empresarial, profesionistas, comerciantes y personas morales que requieran financiamiento para capital de trabajo, inventario, adquisición de equipo, liquidez u otros destinos autorizados.",

    montoMinimo: 10000,
    montoMaximo: null,

    plazoMinimo: 3,
    plazoMaximo: 12,

    tasaTipo: "Fija",

    /*
      NO INVENTAR.
      Capturar valores definitivos antes de producción.
    */
    tasaMaxima: null,
    catPromedio: null,
    fechaCalculoCat: null,

    metodologiaCat:
      "Calculado conforme a la metodología, fórmula, componentes y supuestos aplicables establecidos por Banco de México.",
  };

  /* =====================================================
     FUNCIONES GENERALES
  ===================================================== */

  function actualizar(campo, valor) {
    setDatos((prev) => ({
      ...prev,
      [campo]: valor,
    }));

    setMensajeError("");
  }

  function actualizarConsentimiento(campo, valor) {
    setConsentimientos((prev) => ({
      ...prev,
      [campo]: valor,
    }));

    setMensajeError("");
  }

  function seleccionarArchivo(campo, file) {
    setArchivos((prev) => ({
      ...prev,
      [campo]: file || null,
    }));

    setMensajeError("");
  }

  function ir(nuevaPantalla) {
    setPantalla(nuevaPantalla);

    setLegalAbierto(false);
    setMenuMovil(false);

    setMensajeError("");
    setMensajeInfo("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function mostrarError(texto) {
    setMensajeError(texto);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function emailValido(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function numeroPositivo(valor) {
    return Number(valor) > 0;
  }

  function documentoExiste(nombre) {
    return Boolean(archivos[nombre]);
  }

  /* =====================================================
     VALIDACIONES
  ===================================================== */

  function validarSimulacion() {
    if (!numeroPositivo(datos.montoSolicitado)) {
      mostrarError(
        "Ingresa un monto solicitado mayor a cero."
      );
      return;
    }

    if (!datos.plazoSolicitado) {
      mostrarError("Selecciona un plazo.");
      return;
    }

    ir("tipoPersona");
  }

  function validarTipoPersona() {
    if (!datos.tipoPersona) {
      mostrarError(
        "Selecciona si la solicitud corresponde a Persona Física o Persona Moral."
      );
      return;
    }

    ir("registro");
  }

  async function crearCuenta() {
    setMensajeError("");
    setMensajeInfo("");

    if (
      !datos.celular.trim() ||
      !datos.correo.trim() ||
      !datos.password
    ) {
      mostrarError(
        "Completa celular, correo y contraseña."
      );
      return;
    }

    if (!emailValido(datos.correo)) {
      mostrarError(
        "Ingresa un correo electrónico válido."
      );
      return;
    }

    if (datos.password.length < 8) {
      mostrarError(
        "La contraseña debe tener al menos 8 caracteres."
      );
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: datos.correo,
        password: datos.password,
      });

      if (error) {
        setMensajeInfo(
          `Supabase respondió: ${error.message}`
        );
      } else if (data?.session) {
        setMensajeInfo(
          "Cuenta creada y sesión iniciada."
        );
      } else {
        setMensajeInfo(
          "Cuenta creada. Revisa tu correo si Supabase solicita confirmación."
        );
      }

      ir("otp");
    } catch (e) {
      console.error(e);

      mostrarError(
        "No se pudo crear la cuenta en este momento."
      );
    }
  }

  function validarConsentimientos() {
    const completos = Object.values(
      consentimientos
    ).every(Boolean);

    if (!completos) {
      mostrarError(
        "Debes aceptar todas las autorizaciones obligatorias."
      );
      return;
    }

    ir("datosSolicitante");
  }

  function validarDatosSolicitante() {
    if (datos.tipoPersona === "fisica") {
      if (
        !datos.nombre.trim() ||
        !datos.apellidoPaterno.trim() ||
        !datos.curp.trim() ||
        !datos.rfc.trim() ||
        !datos.nacimiento ||
        !datos.estadoCivil
      ) {
        mostrarError(
          "Completa todos los datos obligatorios de la Persona Física."
        );
        return;
      }

      if (
        datos.estadoCivil === "Casado" &&
        !datos.regimenMatrimonial
      ) {
        mostrarError(
          "Selecciona el régimen matrimonial."
        );
        return;
      }

      if (
        datos.estadoCivil === "Casado" &&
        datos.regimenMatrimonial ===
          "Sociedad conyugal" &&
        (!datos.conyugeNombre.trim() ||
          !datos.conyugeCurp.trim() ||
          !datos.conyugeRfc.trim())
      ) {
        mostrarError(
          "Completa la información del cónyuge."
        );
        return;
      }
    }

    if (datos.tipoPersona === "moral") {
      if (
        !datos.razonSocial.trim() ||
        !datos.rfcEmpresa.trim() ||
        !datos.fechaConstitucion ||
        !datos.actividadEconomica.trim() ||
        !datos.representanteLegal.trim() ||
        !datos.propietarioReal.trim()
      ) {
        mostrarError(
          "Completa todos los datos obligatorios de la Persona Moral."
        );
        return;
      }
    }

    ir("documentosIdentidad");
  }

  function validarDocumentosIdentidad() {
    if (datos.tipoPersona === "fisica") {
      const requeridos = [
        "pfIneFrente",
        "pfIneReverso",
        "pfComprobanteDomicilio",
        "pfCsf",
        "pfCaratulaBancaria",
        "pfSolicitudKyc",
        "pfAutorizacionBuro",
      ];

      if (
        requeridos.some(
          (nombre) => !documentoExiste(nombre)
        )
      ) {
        mostrarError(
          "Carga todos los documentos obligatorios de Persona Física."
        );
        return;
      }

      if (
        datos.estadoCivil === "Casado" &&
        datos.regimenMatrimonial ===
          "Sociedad conyugal" &&
        (!documentoExiste("conyugeIne") ||
          !documentoExiste("conyugeCsf"))
      ) {
        mostrarError(
          "Carga los documentos obligatorios del cónyuge."
        );
        return;
      }
    }

    if (datos.tipoPersona === "moral") {
      const requeridos = [
        "pmActaConstitutiva",
        "pmPoderes",
        "pmComprobanteDomicilio",
        "pmCaratulaBancaria",
        "pmIdRepresentante",
        "pmCsfRepresentante",
        "pmIdPropietario",
        "pmCsfPropietario",
      ];

      if (
        requeridos.some(
          (nombre) => !documentoExiste(nombre)
        )
      ) {
        mostrarError(
          "Carga todos los documentos obligatorios de Persona Moral."
        );
        return;
      }
    }

    ir("domicilio");
  }

  function validarDomicilio() {
    if (
      !datos.calle.trim() ||
      !datos.numeroExterior.trim() ||
      !datos.colonia.trim() ||
      !datos.cp.trim() ||
      !datos.municipio.trim() ||
      !datos.estado.trim()
    ) {
      mostrarError(
        "Completa todos los datos del domicilio."
      );
      return;
    }

    if (!/^\d{5}$/.test(datos.cp)) {
      mostrarError(
        "El código postal debe contener 5 dígitos."
      );
      return;
    }

    ir("ingresos");
  }

  function validarIngresos() {
    if (datos.tipoPersona === "fisica") {
      if (
        !datos.ocupacion ||
        !datos.empresaActividad.trim() ||
        !datos.antiguedad.trim() ||
        !numeroPositivo(datos.ingreso)
      ) {
        mostrarError(
          "Completa la información de actividad e ingresos."
        );
        return;
      }
    }

    if (
      datos.tipoPersona === "moral" &&
      !numeroPositivo(datos.ventasMensuales)
    ) {
      mostrarError(
        "Ingresa las ventas mensuales aproximadas."
      );
      return;
    }

    ir("documentosFinancieros");
  }

  function validarDocumentosFinancieros() {
    if (!documentoExiste("estadosCuenta")) {
      mostrarError(
        "Carga los estados de cuenta para continuar."
      );
      return;
    }

    if (
      datos.tipoPersona === "moral" &&
      !documentoExiste("estadosFinancieros")
    ) {
      mostrarError(
        "Carga los estados financieros de la empresa."
      );
      return;
    }

    ir("solicitud");
  }

  function validarSolicitud() {
    if (
      !numeroPositivo(datos.montoSolicitado) ||
      !datos.plazoSolicitado ||
      !datos.destino
    ) {
      mostrarError(
        "Completa monto, plazo y destino del crédito."
      );
      return;
    }

    ir("tipoCredito");
  }

  function validarTipoCredito() {
    if (!datos.tipoCredito) {
      mostrarError(
        "Selecciona la estructura de la operación."
      );
      return;
    }

    if (datos.tipoCredito === "con") {
      ir("garantia");
      return;
    }

    ir("revision");
  }

  function validarGarantia() {
    if (!datos.tipoGarantia) {
      mostrarError(
        "Selecciona el tipo de garantía."
      );
      return;
    }

    if (
      datos.tipoGarantia ===
      "Obligado solidario"
    ) {
      ir("obligado");
      return;
    }

    if (
      !datos.descripcionGarantia.trim() ||
      !numeroPositivo(datos.valorGarantia)
    ) {
      mostrarError(
        "Completa la descripción y valor de la garantía."
      );
      return;
    }

    if (
      !documentoExiste(
        "garantiaDocumentacion"
      )
    ) {
      mostrarError(
        "Carga documentación de la garantía."
      );
      return;
    }

    ir("garantiaStatus");
  }

  function validarObligado() {
    if (
      !datos.garanteNombre.trim() ||
      !datos.garanteRfc.trim() ||
      !datos.garanteTelefono.trim() ||
      !datos.garanteCorreo.trim()
    ) {
      mostrarError(
        "Completa la información del obligado solidario."
      );
      return;
    }

    if (!emailValido(datos.garanteCorreo)) {
      mostrarError(
        "Ingresa un correo válido para el obligado solidario."
      );
      return;
    }

    ir("garantiaStatus");
  }

  /* =====================================================
     SUPABASE — GUARDAR SOLICITUD
  ===================================================== */

  async function guardarSolicitudSupabase() {
    setMensajeError("");
    setGuardando(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        mostrarError(
          "Necesitas una sesión activa para enviar la solicitud. Revisa si debes confirmar tu correo."
        );

        setGuardando(false);
        return;
      }

      const nuevoFolio =
        "TRI-" +
        Math.floor(
          100000 + Math.random() * 900000
        );

      const nombreSolicitud =
        datos.tipoPersona === "fisica"
          ? `${datos.nombre} ${datos.apellidoPaterno} ${datos.apellidoMaterno}`.trim()
          : datos.razonSocial;

      /*
        ESTA VERSIÓN GUARDA ÚNICAMENTE
        LOS CAMPOS QUE YA ESTAMOS PREPARANDO
        EN LA TABLA "Aplicaciones".

        Después crearemos tablas específicas
        para expediente, documentos, garantías,
        decisiones, etc.
      */

      const payload = {
        folio: nuevoFolio,

        nombre: nombreSolicitud,

        correo: datos.correo,

        celular: datos.celular,

        monto: Number(
          datos.montoSolicitado
        ),

        plazo: Number(
          datos.plazoSolicitado
        ),

        ingreso:
          datos.tipoPersona === "fisica"
            ? Number(datos.ingreso || 0)
            : Number(
                datos.ventasMensuales || 0
              ),

        tipo_credito:
          datos.tipoCredito,

        tipo_garantia:
          datos.tipoGarantia || null,

        estado: "SUBMITTED",

        user_id: session.user.id,
      };

      const { error } = await supabase
        .from("Aplicaciones")
        .insert([payload]);

      if (error) {
        console.error(error);

        mostrarError(
          `No se pudo guardar la solicitud: ${error.message}`
        );

        setGuardando(false);
        return;
      }

      setFolio(nuevoFolio);
      setGuardando(false);

      ir("enRevision");
    } catch (e) {
      console.error(e);

      mostrarError(
        "Ocurrió un error al enviar la solicitud."
      );

      setGuardando(false);
    }
  }

  const pagoOferta = calcularPago(
    Number(datos.montoAprobado),
    Number(datos.tasaAprobada),
    Number(datos.plazoAprobado)
  );

  return (
    <div className="app">
      <style>{css}</style>

      <Header
        ir={ir}
        menuMovil={menuMovil}
        setMenuMovil={setMenuMovil}
        legalAbierto={legalAbierto}
        setLegalAbierto={setLegalAbierto}
      />

      <main className="container">
        {mensajeError && (
          <div className="globalError">
            <strong>
              Revisa la información
            </strong>

            <span>
              {mensajeError}
            </span>
          </div>
        )}

        {mensajeInfo && (
          <div className="globalInfo">
            {mensajeInfo}
          </div>
        )}

        {pantalla === "inicio" && (
          <Inicio
            ir={ir}
            producto={producto}
          />
        )}

        {pantalla === "producto" && (
          <Producto
            producto={producto}
            ir={ir}
          />
        )}

        {pantalla === "comoFunciona" && (
          <ComoFunciona ir={ir} />
        )}

        {pantalla === "simulacion" && (
          <Simulacion
            datos={datos}
            actualizar={actualizar}
            continuar={validarSimulacion}
          />
        )}

        {pantalla === "tipoPersona" && (
          <TipoPersona
            datos={datos}
            actualizar={actualizar}
            continuar={validarTipoPersona}
          />
        )}

        {pantalla === "registro" && (
          <Registro
            datos={datos}
            actualizar={actualizar}
            crearCuenta={crearCuenta}
            ir={ir}
          />
        )}

        {pantalla === "otp" && (
          <OTP
            datos={datos}
            ir={ir}
          />
        )}

        {pantalla === "consentimientos" && (
          <Consentimientos
            consentimientos={
              consentimientos
            }
            actualizar={
              actualizarConsentimiento
            }
            continuar={
              validarConsentimientos
            }
            ir={ir}
          />
        )}

        {pantalla === "datosSolicitante" && (
          <DatosSolicitante
            datos={datos}
            actualizar={actualizar}
            continuar={
              validarDatosSolicitante
            }
            ir={ir}
          />
        )}

        {pantalla ===
          "documentosIdentidad" && (
          <DocumentosIdentidad
            datos={datos}
            archivos={archivos}
            seleccionarArchivo={
              seleccionarArchivo
            }
            continuar={
              validarDocumentosIdentidad
            }
            ir={ir}
          />
        )}

        {pantalla === "domicilio" && (
          <Domicilio
            datos={datos}
            actualizar={actualizar}
            continuar={validarDomicilio}
            ir={ir}
          />
        )}

        {pantalla === "ingresos" && (
          <Ingresos
            datos={datos}
            actualizar={actualizar}
            continuar={validarIngresos}
            ir={ir}
          />
        )}

        {pantalla ===
          "documentosFinancieros" && (
          <DocumentosFinancieros
            datos={datos}
            archivos={archivos}
            seleccionarArchivo={
              seleccionarArchivo
            }
            continuar={
              validarDocumentosFinancieros
            }
            ir={ir}
          />
        )}

        {pantalla === "solicitud" && (
          <Solicitud
            datos={datos}
            actualizar={actualizar}
            continuar={validarSolicitud}
            ir={ir}
          />
        )}

        {pantalla === "tipoCredito" && (
          <TipoCredito
            datos={datos}
            actualizar={actualizar}
            continuar={
              validarTipoCredito
            }
            ir={ir}
          />
        )}

        {pantalla === "garantia" && (
          <Garantia
            datos={datos}
            actualizar={actualizar}
            archivos={archivos}
            seleccionarArchivo={
              seleccionarArchivo
            }
            continuar={validarGarantia}
            ir={ir}
          />
        )}

        {pantalla === "obligado" && (
          <Obligado
            datos={datos}
            actualizar={actualizar}
            continuar={validarObligado}
            ir={ir}
          />
        )}

        {pantalla ===
          "garantiaStatus" && (
          <GarantiaStatus
            datos={datos}
            ir={ir}
          />
        )}

        {pantalla === "revision" && (
          <Revision
            datos={datos}
            guardar={
              guardarSolicitudSupabase
            }
            guardando={guardando}
            ir={ir}
          />
        )}

        {pantalla === "enRevision" && (
          <EnRevision
            datos={datos}
            folio={folio}
            ir={ir}
          />
        )}

        {pantalla === "oferta" && (
          <Oferta
            datos={datos}
            pagoOferta={pagoOferta}
            ir={ir}
          />
        )}

        {pantalla === "cuentaBanco" && (
          <CuentaBanco
            datos={datos}
            actualizar={actualizar}
            ir={ir}
          />
        )}

        {pantalla === "contratos" && (
          <Contratos ir={ir} />
        )}

        {pantalla === "firma" && (
          <Firma
            datos={datos}
            ir={ir}
          />
        )}

        {pantalla ===
          "tesoreriaCliente" && (
          <TesoreriaCliente ir={ir} />
        )}

        {pantalla === "dispersado" && (
          <Dispersado ir={ir} />
        )}

        {pantalla === "creditoActivo" && (
          <CreditoActivo
            datos={datos}
            pagoOferta={pagoOferta}
          />
        )}

        {pantalla === "une" && (
          <UNE empresa={empresa} />
        )}

        {pantalla === "normatividad" && (
          <Normatividad
            empresa={empresa}
          />
        )}

        {pantalla === "buro" && (
          <Buro />
        )}

        {pantalla === "privacidad" && (
          <Privacidad
            empresa={empresa}
          />
        )}
      </main>

      <Footer
        empresa={empresa}
        ir={ir}
      />
    </div>
  );
}

/* =====================================================
   HEADER PÚBLICO
   NO CONTIENE BACKOFFICE
===================================================== */

function Header({
  ir,
  menuMovil,
  setMenuMovil,
  legalAbierto,
  setLegalAbierto,
}) {
  return (
    <header className="header">
      <button
        className="logoButton"
        onClick={() => ir("inicio")}
      >
        <img
          src="/logo-trisal.jpeg"
          alt="TRISAL"
          className="logo"
        />
      </button>

      <button
        className="hamburger"
        onClick={() =>
          setMenuMovil(!menuMovil)
        }
      >
        {menuMovil ? "Cerrar" : "Menú"}
      </button>

      <nav
        className={
          menuMovil
            ? "desktopNav mobileNavOpen"
            : "desktopNav"
        }
      >
        <button
          className="navButton"
          onClick={() => ir("inicio")}
        >
          Inicio
        </button>

        <button
          className="navButton"
          onClick={() => ir("producto")}
        >
          Producto
        </button>

        <button
          className="navButton"
          onClick={() =>
            ir("comoFunciona")
          }
        >
          Cómo funciona
        </button>

        <div className="legalDropdown">
          <button
            className="navButton"
            onClick={() =>
              setLegalAbierto(
                !legalAbierto
              )
            }
          >
            Información legal
          </button>

          {legalAbierto && (
            <div className="legalMenu">
              <button
                onClick={() => ir("une")}
              >
                UNE
              </button>

              <button
                onClick={() =>
                  ir("normatividad")
                }
              >
                Normatividad
              </button>

              <button
                onClick={() => ir("buro")}
              >
                Buró de Entidades
                Financieras
              </button>

              <button
                onClick={() =>
                  ir("privacidad")
                }
              >
                Aviso de privacidad
              </button>
            </div>
          )}
        </div>

        <button
          className="navCta"
          onClick={() =>
            ir("simulacion")
          }
        >
          Solicita tu crédito
        </button>
      </nav>
    </header>
  );
}

/* =====================================================
   INICIO
===================================================== */

function Inicio({
  ir,
  producto,
}) {
  return (
    <section className="hero fadeUp">
      <div className="heroContent">
        <p className="eyebrow">
          CRÉDITO DIGITAL TRISAL
        </p>

        <h1>
          Financiamiento sencillo para
          seguir creciendo.
        </h1>

        <p className="heroText">
          Inicia tu solicitud, completa
          tu expediente digital y conoce
          el avance de tu crédito en todo
          momento.
        </p>

        <div className="buttonRow">
          <button
            className="primary"
            onClick={() =>
              ir("simulacion")
            }
          >
            Solicita tu crédito
          </button>

          <button
            className="secondary"
            onClick={() =>
              ir("comoFunciona")
            }
          >
            Ver cómo funciona
          </button>
        </div>

        <button
          className="textLinkButton"
          onClick={() =>
            ir("producto")
          }
        >
          Conocer características del
          producto →
        </button>
      </div>

      <div className="heroCard">
        <p className="cardEyebrow">
          PROCESO
        </p>

        <h2>
          Una solicitud clara y
          sencilla.
        </h2>

        <MiniStep
          numero="1"
          texto="Elige monto y plazo"
        />

        <MiniStep
          numero="2"
          texto="Completa tu expediente"
        />

        <MiniStep
          numero="3"
          texto="Analizamos tu solicitud"
        />

        <MiniStep
          numero="4"
          texto="Recibe tu oferta"
        />

        <MiniStep
          numero="5"
          texto="Firma y recibe"
        />

        <div className="heroProductTag">
          {producto.nombre}
        </div>
      </div>
    </section>
  );
}

/* =====================================================
   PRODUCTO
===================================================== */

function Producto({
  producto,
  ir,
}) {
  const tasaMaxima =
    producto.tasaMaxima === null
      ? "Pendiente de configurar"
      : `${Number(
          producto.tasaMaxima
        ).toFixed(1)}%`;

  const catPromedio =
    producto.catPromedio === null
      ? "Pendiente de cálculo"
      : `${Number(
          producto.catPromedio
        ).toFixed(1)}% Sin IVA`;

  return (
    <Pagina
      titulo="Crédito Simple TRISAL"
      subtitulo="Conoce las características generales del producto antes de iniciar tu solicitud."
    >
      <section className="productHero">
        <div className="productHeroText">
          <p className="productKicker">
            CRÉDITO SIMPLE
          </p>

          <h2>
            Financiamiento para
            necesidades productivas y de
            liquidez.
          </h2>

          <p>
            {producto.mercadoObjetivo}
          </p>
        </div>

        <div className="productHeroAction">
          <button
            className="goldButton"
            onClick={() =>
              ir("simulacion")
            }
          >
            Iniciar solicitud
          </button>
        </div>
      </section>

      <div className="productDataGrid">
        <ProductData
          titulo="Tipo de crédito"
          valor={producto.tipo}
        />

        <ProductData
          titulo="Tipo de tasa"
          valor={producto.tasaTipo}
        />

        <ProductData
          titulo="Monto mínimo"
          valor={moneda(
            producto.montoMinimo
          )}
        />

        <ProductData
          titulo="Monto máximo"
          valor={
            producto.montoMaximo
              ? moneda(
                  producto.montoMaximo
                )
              : "Pendiente de configurar"
          }
        />

        <ProductData
          titulo="Plazos"
          valor={`${producto.plazoMinimo} a ${producto.plazoMaximo} meses`}
        />

        <ProductData
          titulo="Tasa anual máxima"
          valor={tasaMaxima}
        />
      </div>

      <div className="catPublicCard">
        <div>
          <span className="catLabel">
            CAT PROMEDIO
          </span>

          <strong>
            {catPromedio}
          </strong>
        </div>

        <div className="catMeta">
          <span>
            Fecha de cálculo
          </span>

          <strong>
            {producto.fechaCalculoCat ||
              "Pendiente"}
          </strong>
        </div>

        <p>
          {producto.metodologiaCat}
        </p>
      </div>

      <div className="requirementsGrid">
        <div className="card">
          <p className="cardEyebrow">
            PERSONA FÍSICA
          </p>

          <h2>
            Requisitos principales
          </h2>

          <RequirementList
            items={[
              "INE vigente.",
              "Comprobante de domicilio no mayor a 3 meses.",
              "Constancia de Situación Fiscal actualizada.",
              "Carátula bancaria.",
              "Solicitud de crédito con KYC.",
              "Autorización de consulta de Buró de Crédito.",
              "Estados de cuenta e información de ingresos.",
              "Información del cónyuge u obligado solidario cuando corresponda.",
            ]}
          />
        </div>

        <div className="card">
          <p className="cardEyebrow">
            PERSONA MORAL
          </p>

          <h2>
            Requisitos principales
          </h2>

          <RequirementList
            items={[
              "Acta constitutiva.",
              "Poderes del representante legal.",
              "Comprobante de domicilio.",
              "Carátula bancaria.",
              "Identificación y CSF del representante legal.",
              "Identificación y CSF del propietario real.",
              "Estados de cuenta.",
              "Estados financieros.",
              "Documentación de garantía u obligado solidario cuando corresponda.",
            ]}
          />
        </div>
      </div>

      <div className="importantNotice">
        Las condiciones específicas de
        cada crédito —incluyendo monto
        aprobado, tasa, CAT, comisión y
        pago— se determinan después del
        análisis de la solicitud.
      </div>
    </Pagina>
  );
}

/* =====================================================
   CÓMO FUNCIONA
===================================================== */

function ComoFunciona({ ir }) {
  const pasos = [
    {
      titulo: "Simula",
      texto:
        "Elige cuánto necesitas y el plazo que prefieres.",
    },

    {
      titulo:
        "Completa tu solicitud",
      texto:
        "Selecciona Persona Física o Persona Moral y completa tu expediente.",
    },

    {
      titulo: "Garantía",
      texto:
        "Si la operación la requiere, te indicaremos la información necesaria.",
    },

    {
      titulo: "Revisión",
      texto:
        "TRISAL analiza tu información y capacidad de pago.",
    },

    {
      titulo: "Oferta",
      texto:
        "Si la solicitud es aprobada, conocerás las condiciones del crédito.",
    },

    {
      titulo: "Firma y recibe",
      texto:
        "Acepta las condiciones, firma y recibe tu crédito.",
    },
  ];

  return (
    <Pagina
      titulo="Solicitar tu crédito es sencillo"
      subtitulo="Puedes conocer en todo momento la etapa en la que se encuentra tu solicitud."
    >
      <div className="simpleFlow">
        {pasos.map(
          (paso, index) => (
            <div
              className="simpleFlowCard"
              key={paso.titulo}
            >
              <div className="stepCircle">
                {index + 1}
              </div>

              <h3>
                {paso.titulo}
              </h3>

              <p>
                {paso.texto}
              </p>
            </div>
          )
        )}
      </div>

      <div className="bottomAction">
        <button
          className="primary"
          onClick={() =>
            ir("simulacion")
          }
        >
          Comenzar solicitud
        </button>
      </div>
    </Pagina>
  );
}

/* =====================================================
   SIMULACIÓN
===================================================== */

function Simulacion({
  datos,
  actualizar,
  continuar,
}) {
  return (
    <Pagina
      titulo="¿Cuánto necesitas?"
      subtitulo="Elige monto y plazo. Las condiciones financieras se determinarán después del análisis."
    >
      <Tracker paso={1} />

      <div className="card formCard">
        <Campo
          label="Monto solicitado *"
          type="number"
          value={
            datos.montoSolicitado
          }
          onChange={(v) =>
            actualizar(
              "montoSolicitado",
              v
            )
          }
        />

        <label className="label">
          Plazo solicitado *
        </label>

        <div className="optionRow">
          {["3", "6", "9", "12"].map(
            (mes) => (
              <button
                key={mes}
                type="button"
                className={
                  datos.plazoSolicitado ===
                  mes
                    ? "optionButton selectedOption"
                    : "optionButton"
                }
                onClick={() =>
                  actualizar(
                    "plazoSolicitado",
                    mes
                  )
                }
              >
                {mes} meses
              </button>
            )
          )}
        </div>

        <div className="notice">
          La tasa, CAT, comisión y pago
          definitivo no se muestran en
          esta etapa. Las condiciones
          dependerán del análisis de
          crédito.
        </div>

        <div className="formAction">
          <button
            className="primary"
            onClick={continuar}
          >
            Continuar
          </button>
        </div>
      </div>
    </Pagina>
  );
}

/* =====================================================
   TIPO PERSONA
===================================================== */

function TipoPersona({
  datos,
  actualizar,
  continuar,
}) {
  return (
    <Pagina
      titulo="¿Quién solicita el crédito?"
      subtitulo="Selecciona una opción para mostrar únicamente la información y documentos que corresponden."
    >
      <Tracker paso={2} />

      <div className="choiceGrid">
        <button
          className={
            datos.tipoPersona ===
            "fisica"
              ? "bigChoice chosen"
              : "bigChoice"
          }
          onClick={() =>
            actualizar(
              "tipoPersona",
              "fisica"
            )
          }
        >
          <span className="choiceIcon">
            PF
          </span>

          <h2>
            Persona Física
          </h2>

          <p>
            Crédito solicitado a nombre
            propio.
          </p>
        </button>

        <button
          className={
            datos.tipoPersona ===
            "moral"
              ? "bigChoice chosen"
              : "bigChoice"
          }
          onClick={() =>
            actualizar(
              "tipoPersona",
              "moral"
            )
          }
        >
          <span className="choiceIcon">
            PM
          </span>

          <h2>
            Persona Moral
          </h2>

          <p>
            Crédito solicitado por una
            empresa o sociedad.
          </p>
        </button>
      </div>

      <div className="bottomAction">
        <button
          className="primary"
          onClick={continuar}
        >
          Continuar
        </button>
      </div>
    </Pagina>
  );
}

/* =====================================================
   REGISTRO
===================================================== */

function Registro({
  datos,
  actualizar,
  crearCuenta,
  ir,
}) {
  return (
    <Pagina
      titulo="Crea tu cuenta"
      subtitulo="Tu cuenta nos permitirá guardar el avance de tu solicitud."
    >
      <Tracker paso={2} />

      <div className="card formCard">
        <Campo
          label="Celular *"
          value={datos.celular}
          placeholder="844 000 0000"
          onChange={(v) =>
            actualizar("celular", v)
          }
        />

        <Campo
          label="Correo electrónico *"
          value={datos.correo}
          type="email"
          placeholder="correo@ejemplo.com"
          onChange={(v) =>
            actualizar("correo", v)
          }
        />

        <Campo
          label="Contraseña *"
          type="password"
          value={datos.password}
          placeholder="Mínimo 8 caracteres"
          onChange={(v) =>
            actualizar(
              "password",
              v
            )
          }
        />

        <NavButtons
          atras={() =>
            ir("tipoPersona")
          }
          continuar={crearCuenta}
          textoContinuar="Crear cuenta y continuar"
        />
      </div>
    </Pagina>
  );
}

function OTP({
  datos,
  ir,
}) {
  return (
    <Pagina
      titulo="Verifica tu cuenta"
      subtitulo={`Continuaremos con la solicitud asociada a ${datos.correo || "tu correo"}.`}
    >
      <Tracker paso={2} />

      <div className="card formCard">
        <div className="notice">
          La verificación OTP sigue como
          simulación en este prototipo.
          Posteriormente conectaremos el
          servicio real de SMS.
        </div>

        <Campo
          label="Código de verificación"
          placeholder="000000"
        />

        <div className="formAction">
          <button
            className="primary"
            onClick={() =>
              ir("consentimientos")
            }
          >
            Validar y continuar
          </button>
        </div>
      </div>
    </Pagina>
  );
}

/* =====================================================
   CONSENTIMIENTOS
===================================================== */

function Consentimientos({
  consentimientos,
  actualizar,
  continuar,
  ir,
}) {
  return (
    <Pagina
      titulo="Autorizaciones"
      subtitulo="Necesitamos estas autorizaciones para continuar con la evaluación."
    >
      <Tracker paso={2} />

      <div className="card">
        <CheckControl
          texto="He leído y acepto el Aviso de Privacidad. *"
          checked={
            consentimientos.privacidad
          }
          onChange={(v) =>
            actualizar(
              "privacidad",
              v
            )
          }
        />

        <CheckControl
          texto="Autorizo la consulta de información crediticia. *"
          checked={
            consentimientos.buro
          }
          onChange={(v) =>
            actualizar("buro", v)
          }
        />

        <CheckControl
          texto="Autorizo el tratamiento de mi información para evaluar la solicitud. *"
          checked={
            consentimientos.tratamiento
          }
          onChange={(v) =>
            actualizar(
              "tratamiento",
              v
            )
          }
        />

        <CheckControl
          texto="Autorizo las validaciones de identidad y geolocalización que correspondan. *"
          checked={
            consentimientos.identidad
          }
          onChange={(v) =>
            actualizar(
              "identidad",
              v
            )
          }
        />

        <NavButtons
          atras={() => ir("otp")}
          continuar={continuar}
        />
      </div>
    </Pagina>
  );
}

/* =====================================================
   DATOS SOLICITANTE
===================================================== */

function DatosSolicitante({
  datos,
  actualizar,
  continuar,
  ir,
}) {
  if (
    datos.tipoPersona === "moral"
  ) {
    return (
      <Pagina
        titulo="Datos de la empresa"
        subtitulo="Completa la información de la Persona Moral, representante legal y propietario real."
      >
        <Tracker paso={2} />

        <div className="card">
          <SectionDivider
            titulo="Empresa"
          />

          <div className="grid2">
            <Campo
              label="Razón social *"
              value={
                datos.razonSocial
              }
              onChange={(v) =>
                actualizar(
                  "razonSocial",
                  v
                )
              }
            />

            <Campo
              label="RFC *"
              value={
                datos.rfcEmpresa
              }
              onChange={(v) =>
                actualizar(
                  "rfcEmpresa",
                  v
                )
              }
            />

            <Campo
              label="Fecha de constitución *"
              type="date"
              value={
                datos.fechaConstitucion
              }
              onChange={(v) =>
                actualizar(
                  "fechaConstitucion",
                  v
                )
              }
            />

            <Campo
              label="Actividad económica *"
              value={
                datos.actividadEconomica
              }
              onChange={(v) =>
                actualizar(
                  "actividadEconomica",
                  v
                )
              }
            />

            <Campo
              label="Giro / objeto social"
              value={
                datos.giroMercantil
              }
              onChange={(v) =>
                actualizar(
                  "giroMercantil",
                  v
                )
              }
            />

            <Campo
              label="Nacionalidad"
              value={
                datos.nacionalidadEmpresa
              }
              onChange={(v) =>
                actualizar(
                  "nacionalidadEmpresa",
                  v
                )
              }
            />
          </div>

          <SectionDivider
            titulo="Representante legal"
          />

          <div className="grid2">
            <Campo
              label="Nombre completo *"
              value={
                datos.representanteLegal
              }
              onChange={(v) =>
                actualizar(
                  "representanteLegal",
                  v
                )
              }
            />

            <Campo
              label="RFC"
              value={
                datos.rfcRepresentante
              }
              onChange={(v) =>
                actualizar(
                  "rfcRepresentante",
                  v
                )
              }
            />

            <Campo
              label="CURP"
              value={
                datos.curpRepresentante
              }
              onChange={(v) =>
                actualizar(
                  "curpRepresentante",
                  v
                )
              }
            />
          </div>

          <SectionDivider
            titulo="Propietario real / beneficiario controlador"
          />

          <div className="grid2">
            <Campo
              label="Nombre *"
              value={
                datos.propietarioReal
              }
              onChange={(v) =>
                actualizar(
                  "propietarioReal",
                  v
                )
              }
            />

            <Campo
              label="RFC"
              value={
                datos.rfcPropietarioReal
              }
              onChange={(v) =>
                actualizar(
                  "rfcPropietarioReal",
                  v
                )
              }
            />
          </div>

          <NavButtons
            atras={() =>
              ir("consentimientos")
            }
            continuar={continuar}
          />
        </div>
      </Pagina>
    );
  }

  return (
    <Pagina
      titulo="Cuéntanos sobre ti"
      subtitulo="Completa los datos de la Persona Física solicitante."
    >
      <Tracker paso={2} />

      <div className="card">
        <SectionDivider
          titulo="Datos personales"
        />

        <div className="grid2">
          <Campo
            label="Nombre *"
            value={datos.nombre}
            onChange={(v) =>
              actualizar("nombre", v)
            }
          />

          <Campo
            label="Apellido paterno *"
            value={
              datos.apellidoPaterno
            }
            onChange={(v) =>
              actualizar(
                "apellidoPaterno",
                v
              )
            }
          />

          <Campo
            label="Apellido materno"
            value={
              datos.apellidoMaterno
            }
            onChange={(v) =>
              actualizar(
                "apellidoMaterno",
                v
              )
            }
          />

          <Campo
            label="CURP *"
            value={datos.curp}
            onChange={(v) =>
              actualizar("curp", v)
            }
          />

          <Campo
            label="RFC *"
            value={datos.rfc}
            onChange={(v) =>
              actualizar("rfc", v)
            }
          />

          <Campo
            label="Fecha de nacimiento *"
            type="date"
            value={
              datos.nacimiento
            }
            onChange={(v) =>
              actualizar(
                "nacimiento",
                v
              )
            }
          />

          <Select
            label="Estado civil *"
            value={
              datos.estadoCivil
            }
            onChange={(v) =>
              actualizar(
                "estadoCivil",
                v
              )
            }
            opciones={[
              "",
              "Soltero",
              "Casado",
              "Unión libre",
              "Divorciado",
              "Viudo",
            ]}
          />

          <Campo
            label="Dependientes económicos"
            type="number"
            value={
              datos.dependientes
            }
            onChange={(v) =>
              actualizar(
                "dependientes",
                v
              )
            }
          />
        </div>

        {datos.estadoCivil ===
          "Casado" && (
          <>
            <SectionDivider
              titulo="Información matrimonial"
            />

            <Select
              label="Régimen matrimonial *"
              value={
                datos.regimenMatrimonial
              }
              onChange={(v) =>
                actualizar(
                  "regimenMatrimonial",
                  v
                )
              }
              opciones={[
                "",
                "Separación de bienes",
                "Sociedad conyugal",
              ]}
            />
          </>
        )}

        {datos.estadoCivil ===
          "Casado" &&
          datos.regimenMatrimonial ===
            "Sociedad conyugal" && (
            <>
              <div className="importantNotice">
                Necesitamos información
                adicional del cónyuge por
                tratarse de sociedad
                conyugal.
              </div>

              <div className="grid2">
                <Campo
                  label="Nombre del cónyuge *"
                  value={
                    datos.conyugeNombre
                  }
                  onChange={(v) =>
                    actualizar(
                      "conyugeNombre",
                      v
                    )
                  }
                />

                <Campo
                  label="CURP *"
                  value={
                    datos.conyugeCurp
                  }
                  onChange={(v) =>
                    actualizar(
                      "conyugeCurp",
                      v
                    )
                  }
                />

                <Campo
                  label="RFC *"
                  value={
                    datos.conyugeRfc
                  }
                  onChange={(v) =>
                    actualizar(
                      "conyugeRfc",
                      v
                    )
                  }
                />
              </div>
            </>
          )}

        <NavButtons
          atras={() =>
            ir("consentimientos")
          }
          continuar={continuar}
        />
      </div>
    </Pagina>
  );
}

/* =====================================================
   DOCUMENTOS
===================================================== */

function DocumentosIdentidad({
  datos,
  archivos,
  seleccionarArchivo,
  continuar,
  ir,
}) {
  if (
    datos.tipoPersona === "moral"
  ) {
    return (
      <Pagina
        titulo="Documentos de la empresa"
        subtitulo="Carga los documentos necesarios para integrar el expediente de la Persona Moral."
      >
        <Tracker paso={2} />

        <div className="card">
          <SectionDivider
            titulo="Empresa"
          />

          <Upload
            titulo="Acta constitutiva *"
            archivo={
              archivos.pmActaConstitutiva
            }
            onChange={(f) =>
              seleccionarArchivo(
                "pmActaConstitutiva",
                f
              )
            }
          />

          <Upload
            titulo="Poderes del representante legal *"
            archivo={
              archivos.pmPoderes
            }
            onChange={(f) =>
              seleccionarArchivo(
                "pmPoderes",
                f
              )
            }
          />

          <Upload
            titulo="Asambleas o reformas aplicables"
            archivo={
              archivos.pmAsambleas
            }
            onChange={(f) =>
              seleccionarArchivo(
                "pmAsambleas",
                f
              )
            }
          />

          <Upload
            titulo="Comprobante de domicilio *"
            archivo={
              archivos.pmComprobanteDomicilio
            }
            onChange={(f) =>
              seleccionarArchivo(
                "pmComprobanteDomicilio",
                f
              )
            }
          />

          <Upload
            titulo="Carátula bancaria *"
            archivo={
              archivos.pmCaratulaBancaria
            }
            onChange={(f) =>
              seleccionarArchivo(
                "pmCaratulaBancaria",
                f
              )
            }
          />

          <SectionDivider
            titulo="Representante legal"
          />

          <Upload
            titulo="Identificación oficial *"
            archivo={
              archivos.pmIdRepresentante
            }
            onChange={(f) =>
              seleccionarArchivo(
                "pmIdRepresentante",
                f
              )
            }
          />

          <Upload
            titulo="Constancia de Situación Fiscal *"
            archivo={
              archivos.pmCsfRepresentante
            }
            onChange={(f) =>
              seleccionarArchivo(
                "pmCsfRepresentante",
                f
              )
            }
          />

          <SectionDivider
            titulo="Propietario real"
          />

          <Upload
            titulo="Identificación oficial *"
            archivo={
              archivos.pmIdPropietario
            }
            onChange={(f) =>
              seleccionarArchivo(
                "pmIdPropietario",
                f
              )
            }
          />

          <Upload
            titulo="Constancia de Situación Fiscal *"
            archivo={
              archivos.pmCsfPropietario
            }
            onChange={(f) =>
              seleccionarArchivo(
                "pmCsfPropietario",
                f
              )
            }
          />

          <NavButtons
            atras={() =>
              ir("datosSolicitante")
            }
            continuar={continuar}
          />
        </div>
      </Pagina>
    );
  }

  return (
    <Pagina
      titulo="Tus documentos"
      subtitulo="Carga los documentos necesarios para integrar tu expediente."
    >
      <Tracker paso={2} />

      <div className="card">
        <SectionDivider
          titulo="Solicitante"
        />

        <Upload
          titulo="INE vigente — frente *"
          archivo={
            archivos.pfIneFrente
          }
          onChange={(f) =>
            seleccionarArchivo(
              "pfIneFrente",
              f
            )
          }
        />

        <Upload
          titulo="INE vigente — reverso *"
          archivo={
            archivos.pfIneReverso
          }
          onChange={(f) =>
            seleccionarArchivo(
              "pfIneReverso",
              f
            )
          }
        />

        <Upload
          titulo="Comprobante de domicilio no mayor a 3 meses *"
          archivo={
            archivos.pfComprobanteDomicilio
          }
          onChange={(f) =>
            seleccionarArchivo(
              "pfComprobanteDomicilio",
              f
            )
          }
        />

        <Upload
          titulo="Constancia de Situación Fiscal actualizada *"
          archivo={
            archivos.pfCsf
          }
          onChange={(f) =>
            seleccionarArchivo(
              "pfCsf",
              f
            )
          }
        />

        <Upload
          titulo="Carátula bancaria *"
          archivo={
            archivos.pfCaratulaBancaria
          }
          onChange={(f) =>
            seleccionarArchivo(
              "pfCaratulaBancaria",
              f
            )
          }
        />

        <Upload
          titulo="Solicitud de crédito / KYC *"
          archivo={
            archivos.pfSolicitudKyc
          }
          onChange={(f) =>
            seleccionarArchivo(
              "pfSolicitudKyc",
              f
            )
          }
        />

        <Upload
          titulo="Autorización de consulta de Buró *"
          archivo={
            archivos.pfAutorizacionBuro
          }
          onChange={(f) =>
            seleccionarArchivo(
              "pfAutorizacionBuro",
              f
            )
          }
        />

        <Upload
          titulo="Selfie / validación de identidad"
          archivo={
            archivos.pfSelfie
          }
          onChange={(f) =>
            seleccionarArchivo(
              "pfSelfie",
              f
            )
          }
        />

        {datos.estadoCivil ===
          "Casado" &&
          datos.regimenMatrimonial ===
            "Sociedad conyugal" && (
            <>
              <SectionDivider
                titulo="Cónyuge"
              />

              <Upload
                titulo="INE del cónyuge *"
                archivo={
                  archivos.conyugeIne
                }
                onChange={(f) =>
                  seleccionarArchivo(
                    "conyugeIne",
                    f
                  )
                }
              />

              <Upload
                titulo="CSF del cónyuge *"
                archivo={
                  archivos.conyugeCsf
                }
                onChange={(f) =>
                  seleccionarArchivo(
                    "conyugeCsf",
                    f
                  )
                }
              />
            </>
          )}

        <NavButtons
          atras={() =>
            ir("datosSolicitante")
          }
          continuar={continuar}
        />
      </div>
    </Pagina>
  );
}

/* =====================================================
   DOMICILIO
===================================================== */

function Domicilio({
  datos,
  actualizar,
  continuar,
  ir,
}) {
  return (
    <Pagina
      titulo="Domicilio"
      subtitulo={
        datos.tipoPersona === "moral"
          ? "Ingresa el domicilio fiscal u operativo de la empresa."
          : "Ingresa el domicilio actual del solicitante."
      }
    >
      <Tracker paso={2} />

      <div className="card">
        <div className="grid2">
          <Campo
            label="Calle *"
            value={datos.calle}
            onChange={(v) =>
              actualizar("calle", v)
            }
          />

          <Campo
            label="Número exterior *"
            value={
              datos.numeroExterior
            }
            onChange={(v) =>
              actualizar(
                "numeroExterior",
                v
              )
            }
          />

          <Campo
            label="Colonia *"
            value={datos.colonia}
            onChange={(v) =>
              actualizar("colonia", v)
            }
          />

          <Campo
            label="Código postal *"
            value={datos.cp}
            onChange={(v) =>
              actualizar("cp", v)
            }
          />

          <Campo
            label="Municipio *"
            value={datos.municipio}
            onChange={(v) =>
              actualizar(
                "municipio",
                v
              )
            }
          />

          <Campo
            label="Estado *"
            value={datos.estado}
            onChange={(v) =>
              actualizar("estado", v)
            }
          />
        </div>

        <NavButtons
          atras={() =>
            ir(
              "documentosIdentidad"
            )
          }
          continuar={continuar}
        />
      </div>
    </Pagina>
  );
}

/* =====================================================
   INGRESOS
===================================================== */

function Ingresos({
  datos,
  actualizar,
  continuar,
  ir,
}) {
  if (
    datos.tipoPersona === "moral"
  ) {
    return (
      <Pagina
        titulo="Información financiera"
        subtitulo="Ayúdanos a conocer la capacidad financiera de la empresa."
      >
        <Tracker paso={2} />

        <div className="card formCard">
          <Campo
            label="Ventas mensuales aproximadas *"
            type="number"
            value={
              datos.ventasMensuales
            }
            onChange={(v) =>
              actualizar(
                "ventasMensuales",
                v
              )
            }
          />

          <Campo
            label="Antigüedad de la empresa"
            value={
              datos.antiguedad
            }
            placeholder="Ej. 5 años"
            onChange={(v) =>
              actualizar(
                "antiguedad",
                v
              )
            }
          />

          <NavButtons
            atras={() =>
              ir("domicilio")
            }
            continuar={continuar}
          />
        </div>
      </Pagina>
    );
  }

  return (
    <Pagina
      titulo="Trabajo e ingresos"
      subtitulo="Esta información nos ayuda a evaluar tu capacidad de pago."
    >
      <Tracker paso={2} />

      <div className="card">
        <div className="grid2">
          <Select
            label="Actividad *"
            value={datos.ocupacion}
            onChange={(v) =>
              actualizar(
                "ocupacion",
                v
              )
            }
            opciones={[
              "",
              "Empleado",
              "Independiente",
              "Negocio propio",
            ]}
          />

          <Campo
            label="Empresa o actividad *"
            value={
              datos.empresaActividad
            }
            onChange={(v) =>
              actualizar(
                "empresaActividad",
                v
              )
            }
          />

          <Campo
            label="Antigüedad *"
            value={
              datos.antiguedad
            }
            placeholder="Ej. 2 años"
            onChange={(v) =>
              actualizar(
                "antiguedad",
                v
              )
            }
          />

          <Campo
            label="Ingreso mensual *"
            type="number"
            value={datos.ingreso}
            onChange={(v) =>
              actualizar("ingreso", v)
            }
          />

          <Select
            label="Frecuencia de ingreso"
            value={
              datos.frecuenciaPago
            }
            onChange={(v) =>
              actualizar(
                "frecuenciaPago",
                v
              )
            }
            opciones={[
              "",
              "Semanal",
              "Quincenal",
              "Mensual",
              "Variable",
            ]}
          />
        </div>

        <NavButtons
          atras={() =>
            ir("domicilio")
          }
          continuar={continuar}
        />
      </div>
    </Pagina>
  );
}

/* =====================================================
   FINANCIEROS
===================================================== */

function DocumentosFinancieros({
  datos,
  archivos,
  seleccionarArchivo,
  continuar,
  ir,
}) {
  return (
    <Pagina
      titulo="Información financiera"
      subtitulo="Carga la documentación financiera disponible."
    >
      <Tracker paso={2} />

      <div className="card">
        <Upload
          titulo="Estados de cuenta — últimos meses *"
          archivo={
            archivos.estadosCuenta
          }
          onChange={(f) =>
            seleccionarArchivo(
              "estadosCuenta",
              f
            )
          }
        />

        {datos.tipoPersona ===
          "fisica" && (
          <>
            <Upload
              titulo="Recibos de nómina / comprobantes de ingresos"
              archivo={
                archivos.comprobanteIngresos
              }
              onChange={(f) =>
                seleccionarArchivo(
                  "comprobanteIngresos",
                  f
                )
              }
            />

            <Upload
              titulo="Declaraciones fiscales"
              archivo={
                archivos.declaraciones
              }
              onChange={(f) =>
                seleccionarArchivo(
                  "declaraciones",
                  f
                )
              }
            />
          </>
        )}

        {datos.tipoPersona ===
          "moral" && (
          <Upload
            titulo="Estados financieros *"
            archivo={
              archivos.estadosFinancieros
            }
            onChange={(f) =>
              seleccionarArchivo(
                "estadosFinancieros",
                f
              )
            }
          />
        )}

        <NavButtons
          atras={() =>
            ir("ingresos")
          }
          continuar={continuar}
        />
      </div>
    </Pagina>
  );
}

/* =====================================================
   CONFIRMAR SOLICITUD
===================================================== */

function Solicitud({
  datos,
  actualizar,
  continuar,
  ir,
}) {
  return (
    <Pagina
      titulo="Confirma lo que necesitas"
      subtitulo="Estas son las condiciones solicitadas. Todavía no representan una oferta de crédito."
    >
      <Tracker paso={2} />

      <div className="card">
        <div className="grid2">
          <Campo
            label="Monto solicitado *"
            type="number"
            value={
              datos.montoSolicitado
            }
            onChange={(v) =>
              actualizar(
                "montoSolicitado",
                v
              )
            }
          />

          <Select
            label="Plazo solicitado *"
            value={
              datos.plazoSolicitado
            }
            onChange={(v) =>
              actualizar(
                "plazoSolicitado",
                v
              )
            }
            opciones={[
              "3",
              "6",
              "9",
              "12",
            ]}
          />

          <Select
            label="Destino del crédito *"
            value={datos.destino}
            onChange={(v) =>
              actualizar("destino", v)
            }
            opciones={[
              "",
              "Capital de trabajo",
              "Inventario",
              "Equipo o maquinaria",
              "Liquidez",
              "Proyecto productivo",
              "Otro",
            ]}
          />
        </div>

        <div className="notice">
          La tasa, CAT, comisión y pago
          serán determinados después del
          análisis de la solicitud.
        </div>

        <NavButtons
          atras={() =>
            ir(
              "documentosFinancieros"
            )
          }
          continuar={continuar}
        />
      </div>
    </Pagina>
  );
}

/* =====================================================
   GARANTÍA
===================================================== */

function TipoCredito({
  datos,
  actualizar,
  continuar,
  ir,
}) {
  return (
    <Pagina
      titulo="Estructura de la operación"
      subtitulo="Para esta demostración puedes visualizar las dos posibles rutas."
    >
      <Tracker paso={3} />

      <div className="choiceGrid">
        <button
          className={
            datos.tipoCredito === "sin"
              ? "bigChoice chosen"
              : "bigChoice"
          }
          onClick={() =>
            actualizar(
              "tipoCredito",
              "sin"
            )
          }
        >
          <span className="choiceIcon">
            SG
          </span>

          <h2>
            Sin garantía
          </h2>

          <p>
            La evaluación se concentra
            principalmente en el perfil
            y capacidad de pago.
          </p>
        </button>

        <button
          className={
            datos.tipoCredito === "con"
              ? "bigChoice chosen"
              : "bigChoice"
          }
          onClick={() =>
            actualizar(
              "tipoCredito",
              "con"
            )
          }
        >
          <span className="choiceIcon">
            CG
          </span>

          <h2>
            Con garantía
          </h2>

          <p>
            La operación incorpora una
            garantía adicional como
            respaldo.
          </p>
        </button>
      </div>

      <NavButtons
        atras={() =>
          ir("solicitud")
        }
        continuar={continuar}
      />
    </Pagina>
  );
}

function Garantia({
  datos,
  actualizar,
  archivos,
  seleccionarArchivo,
  continuar,
  ir,
}) {
  return (
    <Pagina
      titulo="Garantía"
      subtitulo="Indica cómo se respaldará la operación."
    >
      <Tracker paso={3} />

      <div className="card">
        <Select
          label="Tipo de garantía *"
          value={
            datos.tipoGarantia
          }
          onChange={(v) =>
            actualizar(
              "tipoGarantia",
              v
            )
          }
          opciones={[
            "",
            "Obligado solidario",
            "Vehículo",
            "Equipo o maquinaria",
            "Inmueble",
            "Otra",
          ]}
        />

        {datos.tipoGarantia &&
          datos.tipoGarantia !==
            "Obligado solidario" && (
            <>
              <Campo
                label="Descripción *"
                value={
                  datos.descripcionGarantia
                }
                onChange={(v) =>
                  actualizar(
                    "descripcionGarantia",
                    v
                  )
                }
              />

              <Campo
                label="Valor estimado *"
                type="number"
                value={
                  datos.valorGarantia
                }
                onChange={(v) =>
                  actualizar(
                    "valorGarantia",
                    v
                  )
                }
              />

              <Upload
                titulo="Documentación de la garantía *"
                archivo={
                  archivos.garantiaDocumentacion
                }
                onChange={(f) =>
                  seleccionarArchivo(
                    "garantiaDocumentacion",
                    f
                  )
                }
              />
            </>
          )}

        <NavButtons
          atras={() =>
            ir("tipoCredito")
          }
          continuar={continuar}
        />
      </div>
    </Pagina>
  );
}

function Obligado({
  datos,
  actualizar,
  continuar,
  ir,
}) {
  return (
    <Pagina
      titulo="Obligado solidario"
      subtitulo="El obligado solidario tendrá posteriormente un expediente independiente."
    >
      <Tracker paso={3} />

      <div className="card formCard">
        <Campo
          label="Nombre completo *"
          value={
            datos.garanteNombre
          }
          onChange={(v) =>
            actualizar(
              "garanteNombre",
              v
            )
          }
        />

        <Campo
          label="RFC *"
          value={
            datos.garanteRfc
          }
          onChange={(v) =>
            actualizar(
              "garanteRfc",
              v
            )
          }
        />

        <Campo
          label="Celular *"
          value={
            datos.garanteTelefono
          }
          onChange={(v) =>
            actualizar(
              "garanteTelefono",
              v
            )
          }
        />

        <Campo
          label="Correo *"
          type="email"
          value={
            datos.garanteCorreo
          }
          onChange={(v) =>
            actualizar(
              "garanteCorreo",
              v
            )
          }
        />

        <NavButtons
          atras={() =>
            ir("garantia")
          }
          continuar={continuar}
        />
      </div>
    </Pagina>
  );
}

function GarantiaStatus({
  datos,
  ir,
}) {
  return (
    <Pagina
      titulo="Validación de garantía"
      subtitulo="Podrás consultar el estado sin visualizar información privada de terceros."
    >
      <Tracker paso={3} />

      <div className="card">
        <div className="statusRow">
          <div>
            <span className="summaryLabel">
              Garantía
            </span>

            <h2>
              {datos.tipoGarantia}
            </h2>
          </div>

          <span className="yellowStatus">
            En proceso
          </span>
        </div>

        <div className="demoNotice">
          Para continuar con el prototipo,
          puedes simular la validación.
        </div>

        <div className="formAction">
          <button
            className="primary"
            onClick={() =>
              ir("revision")
            }
          >
            Simular garantía validada
          </button>
        </div>
      </div>
    </Pagina>
  );
}

/* =====================================================
   REVISIÓN
===================================================== */

function Revision({
  datos,
  guardar,
  guardando,
  ir,
}) {
  const nombre =
    datos.tipoPersona === "fisica"
      ? `${datos.nombre} ${datos.apellidoPaterno}`
      : datos.razonSocial;

  return (
    <Pagina
      titulo="Revisa tu solicitud"
      subtitulo="Confirma que la información sea correcta antes de enviarla."
    >
      <Tracker paso={4} />

      <div className="card">
        <div className="summaryGrid">
          <SummaryCard
            titulo="Solicitante"
            valor={nombre}
          />

          <SummaryCard
            titulo="Tipo"
            valor={
              datos.tipoPersona ===
              "fisica"
                ? "Persona Física"
                : "Persona Moral"
            }
          />

          <SummaryCard
            titulo="Monto"
            valor={moneda(
              datos.montoSolicitado
            )}
          />

          <SummaryCard
            titulo="Plazo"
            valor={`${datos.plazoSolicitado} meses`}
          />

          <SummaryCard
            titulo="Destino"
            valor={datos.destino}
          />

          <SummaryCard
            titulo="Garantía"
            valor={
              datos.tipoCredito === "con"
                ? datos.tipoGarantia
                : "No requerida"
            }
          />
        </div>

        <div className="importantNotice">
          En esta etapa todavía no existe
          tasa, CAT, comisión ni pago
          definitivo. Las condiciones
          serán determinadas durante el
          análisis de crédito.
        </div>

        <NavButtons
          atras={() =>
            ir("tipoCredito")
          }
          continuar={guardar}
          textoContinuar={
            guardando
              ? "Enviando..."
              : "Enviar solicitud"
          }
          disabled={guardando}
        />
      </div>
    </Pagina>
  );
}

function EnRevision({
  datos,
  folio,
  ir,
}) {
  return (
    <Pagina
      titulo="Solicitud recibida"
      subtitulo={`Folio ${folio || "TRI-XXXXXX"}`}
    >
      <Tracker paso={4} />

      <div className="statusCard">
        <div className="statusIcon">
          04
        </div>

        <div>
          <p className="cardEyebrow">
            EN REVISIÓN
          </p>

          <h2>
            Estamos analizando tu
            solicitud.
          </h2>

          <p>
            Nuestro equipo revisará tu
            información para determinar
            las condiciones que, en su
            caso, puedan ofrecerse.
          </p>
        </div>
      </div>

      <div className="summaryGrid">
        <SummaryCard
          titulo="Monto solicitado"
          valor={moneda(
            datos.montoSolicitado
          )}
        />

        <SummaryCard
          titulo="Plazo solicitado"
          valor={`${datos.plazoSolicitado} meses`}
        />
      </div>

      <div className="demoArea">
        <button
          className="demoButton"
          onClick={() =>
            ir("oferta")
          }
        >
          DEMO: Simular aprobación
        </button>
      </div>
    </Pagina>
  );
}

/* =====================================================
   OFERTA
===================================================== */

function Oferta({
  datos,
  pagoOferta,
  ir,
}) {
  return (
    <Pagina
      titulo="Tenemos una oferta para ti"
      subtitulo="Aquí aparecen por primera vez las condiciones financieras de tu oferta individual."
    >
      <Tracker paso={5} />

      <div className="offerHero">
        <p className="offerEyebrow">
          MONTO APROBADO
        </p>

        <h2>
          {moneda(
            datos.montoAprobado
          )}
        </h2>
      </div>

      <div className="offerGrid">
        <OfertaDato
          titulo="Plazo"
          valor={`${datos.plazoAprobado} meses`}
        />

        <OfertaDato
          titulo="Tasa anual fija"
          valor={`${Number(
            datos.tasaAprobada
          ).toFixed(1)}%`}
        />

        <OfertaDato
          titulo="Pago estimado"
          valor={moneda(
            pagoOferta
          )}
        />

        <OfertaDato
          titulo="Comisión"
          valor={`${Number(
            datos.comisionAprobada
          ).toFixed(1)}%`}
        />

        <OfertaDato
          titulo="CAT"
          valor={`${Number(
            datos.catAprobado
          ).toFixed(1)}%`}
        />

        <OfertaDato
          titulo="Garantía"
          valor={
            datos.tipoCredito === "con"
              ? datos.tipoGarantia
              : "No requerida"
          }
        />
      </div>

      <div className="catDisclosure">
        <strong>
          CAT{" "}
          {Number(
            datos.catAprobado
          ).toFixed(1)}
          % Sin IVA
        </strong>

        <p>
          Para fines informativos y de
          comparación. En producción se
          calculará automáticamente con
          las condiciones específicas de
          la operación.
        </p>
      </div>

      <div className="warningBox">
        <strong>
          Información importante
        </strong>

        <p>
          Contratar créditos que excedan
          tu capacidad de pago afecta tu
          historial crediticio.
        </p>

        <p>
          Incumplir tus obligaciones
          puede generar intereses
          moratorios y comisiones cuando
          correspondan.
        </p>
      </div>

      <div className="buttonRow">
        <button
          className="primary"
          onClick={() =>
            ir("cuentaBanco")
          }
        >
          Aceptar oferta
        </button>

        <button className="secondary">
          Rechazar oferta
        </button>
      </div>
    </Pagina>
  );
}

/* =====================================================
   CONTRATACIÓN
===================================================== */

function CuentaBanco({
  datos,
  actualizar,
  ir,
}) {
  return (
    <Pagina
      titulo="Cuenta bancaria"
      subtitulo="Indica dónde deseas recibir el crédito."
    >
      <Tracker paso={6} />

      <div className="card formCard">
        <Campo
          label="CLABE *"
          value={datos.clabe}
          placeholder="18 dígitos"
          onChange={(v) =>
            actualizar("clabe", v)
          }
        />

        <div className="formAction">
          <button
            className="primary"
            onClick={() => {
              if (
                !/^\d{18}$/.test(
                  datos.clabe
                )
              ) {
                alert(
                  "La CLABE debe contener 18 dígitos."
                );
                return;
              }

              ir("contratos");
            }}
          >
            Continuar
          </button>
        </div>
      </div>
    </Pagina>
  );
}

function Contratos({ ir }) {
  return (
    <Pagina
      titulo="Documentos contractuales"
      subtitulo="Revisa los documentos antes de firmar."
    >
      <Tracker paso={6} />

      <div className="card">
        <Documento
          titulo="Contrato de crédito"
        />

        <Documento
          titulo="Tabla de amortización"
        />

        <Documento
          titulo="Pagaré"
        />

        <Documento
          titulo="Autorización de domiciliación"
        />

        <div className="formAction">
          <button
            className="primary"
            onClick={() =>
              ir("firma")
            }
          >
            Continuar a firma
          </button>
        </div>
      </div>
    </Pagina>
  );
}

function Firma({
  datos,
  ir,
}) {
  return (
    <Pagina
      titulo="Firma tus documentos"
      subtitulo="Último paso antes de enviar la operación a tesorería."
    >
      <Tracker paso={6} />

      <div className="statusCard">
        <div className="statusIcon">
          ✍
        </div>

        <div>
          <p className="cardEyebrow">
            FIRMA
          </p>

          <h2>
            Firma del solicitante
          </h2>

          <p>
            Se registrará evidencia de
            firma y versión documental.
          </p>

          {datos.tipoCredito ===
            "con" && (
            <div className="smallNotice">
              También deberán completarse
              las formalidades asociadas
              a la garantía.
            </div>
          )}

          <button
            className="primary"
            onClick={() =>
              ir(
                "tesoreriaCliente"
              )
            }
          >
            Simular firma
          </button>
        </div>
      </div>
    </Pagina>
  );
}

function TesoreriaCliente({ ir }) {
  return (
    <Pagina
      titulo="Todo listo"
      subtitulo="Tu crédito pasó a las validaciones finales de tesorería."
    >
      <Tracker paso={6} />

      <div className="statusCard">
        <div className="successIcon">
          ✓
        </div>

        <div>
          <p className="cardEyebrow">
            DOCUMENTACIÓN COMPLETA
          </p>

          <h2>
            La operación está lista para
            dispersión.
          </h2>

          <p>
            Tesorería realizará las
            últimas validaciones antes de
            transferir los recursos.
          </p>
        </div>
      </div>

      <div className="demoArea">
        <button
          className="demoButton"
          onClick={() =>
            ir("dispersado")
          }
        >
          DEMO: Simular dispersión
        </button>
      </div>
    </Pagina>
  );
}

function Dispersado({ ir }) {
  return (
    <Pagina
      titulo="¡Tu crédito fue depositado!"
      subtitulo="La operación ahora se encuentra activa."
    >
      <div className="statusCard">
        <div className="successIcon">
          ✓
        </div>

        <div>
          <p className="cardEyebrow">
            CRÉDITO ACTIVO
          </p>

          <h2>
            Los recursos fueron
            dispersados.
          </h2>

          <button
            className="primary"
            onClick={() =>
              ir("creditoActivo")
            }
          >
            Ver mi crédito
          </button>
        </div>
      </div>
    </Pagina>
  );
}

function CreditoActivo({
  datos,
  pagoOferta,
}) {
  return (
    <Pagina
      titulo="Mi crédito"
      subtitulo="Consulta información y documentos de tu operación."
    >
      <div className="summaryGrid">
        <SummaryCard
          titulo="Monto original"
          valor={moneda(
            datos.montoAprobado
          )}
        />

        <SummaryCard
          titulo="Próximo pago"
          valor={moneda(
            pagoOferta
          )}
        />
      </div>

      <div className="portalOptions">
        <button>
          Tabla de amortización
        </button>

        <button>
          Pagos realizados
        </button>

        <button>
          Estado de cuenta
        </button>

        <button>
          Contrato
        </button>

        <button>
          Pagaré
        </button>

        <button>
          Método de pago
        </button>
      </div>
    </Pagina>
  );
}

/* =====================================================
   REGULATORIO
===================================================== */

function UNE({ empresa }) {
  return (
    <Pagina
      titulo="Unidad Especializada de Atención a Usuarios"
      subtitulo="Información para consultas, aclaraciones y reclamaciones."
    >
      <div className="card legalText">
        <SectionDivider
          titulo="UNE de TRISAL"
        />

        <Resumen
          titulo="Entidad"
          valor={
            empresa.razonSocial
          }
        />

        <Resumen
          titulo="Teléfono UNE"
          valor={
            empresa.uneTelefono
          }
        />

        <Resumen
          titulo="Correo UNE"
          valor={
            empresa.uneCorreo
          }
        />

        <div className="importantNotice">
          Sustituye los campos PENDIENTE
          por los datos oficiales de la
          UNE antes de producción.
        </div>
      </div>

      <div className="card legalText">
        <SectionDivider
          titulo="CONDUSEF"
        />

        <Resumen
          titulo="Teléfono"
          valor={
            empresa.condusefTelefono
          }
        />

        <Resumen
          titulo="Correo"
          valor={
            empresa.condusefCorreo
          }
        />

        <a
          className="legalLink"
          href="https://www.condusef.gob.mx/"
          target="_blank"
          rel="noreferrer"
        >
          Consultar sitio de CONDUSEF →
        </a>
      </div>
    </Pagina>
  );
}

function Normatividad({
  empresa,
}) {
  return (
    <Pagina
      titulo="Normatividad y transparencia"
      subtitulo="Información relevante para nuestros usuarios."
    >
      <div className="card legalText">
        <p>
          Para la constitución y operación
          de {empresa.razonSocial} con tal
          carácter, no requiere de
          autorización de la Secretaría de
          Hacienda y Crédito Público.
        </p>

        <p>
          {empresa.razonSocial} se
          encuentra sujeta a la
          supervisión de la Comisión
          Nacional Bancaria y de Valores,
          únicamente para efectos de lo
          dispuesto por el artículo 56 de
          la Ley General de Organizaciones
          y Actividades Auxiliares del
          Crédito.
        </p>
      </div>

      <div className="card legalText">
        <SectionDivider
          titulo="Despachos de cobranza"
        />

        <p>
          Los datos de los despachos de
          cobranza que correspondan
          estarán disponibles para que
          nuestros clientes puedan
          identificarlos y localizarlos.
        </p>
      </div>
    </Pagina>
  );
}

function Buro() {
  return (
    <Pagina
      titulo="Buró de Entidades Financieras"
      subtitulo="Información para conocer y comparar entidades financieras."
    >
      <div className="card legalText">
        <div className="buroLogoMock">
          BURÓ DE ENTIDADES FINANCIERAS
        </div>

        <p>
          Esta sección deberá incorporar
          la descripción, alcance e
          información oficial
          correspondiente a FDG5
          SERVICIOS conforme a las
          disposiciones aplicables.
        </p>

        <a
          className="legalLink"
          href="https://www.buro.gob.mx/"
          target="_blank"
          rel="noreferrer"
        >
          Consultar sitio oficial →
        </a>
      </div>
    </Pagina>
  );
}

function Privacidad({
  empresa,
}) {
  return (
    <Pagina
      titulo="Aviso de privacidad"
      subtitulo="Información sobre el tratamiento de datos personales."
    >
      <div className="card legalText">
        <SectionDivider
          titulo="Responsable"
        />

        <p>
          {empresa.razonSocial}, con
          domicilio en{" "}
          {empresa.direccion}, es
          responsable del tratamiento de
          los datos personales que
          recabe.
        </p>

        <SectionDivider
          titulo="Finalidades"
        />

        <p>
          Los datos podrán utilizarse
          para identificación,
          integración del expediente,
          análisis de crédito,
          contratación, administración,
          cumplimiento regulatorio y
          prevención de fraude.
        </p>

        <SectionDivider
          titulo="Derechos ARCO"
        />

        <p>
          El titular podrá ejercer los
          derechos correspondientes
          conforme al procedimiento
          establecido por la entidad.
        </p>

        <div className="importantNotice">
          Esta es una versión de
          prototipo. Sustituye este texto
          por el Aviso de Privacidad
          definitivo validado por el área
          legal.
        </div>
      </div>
    </Pagina>
  );
}

/* =====================================================
   COMPONENTES
===================================================== */

function Pagina({
  titulo,
  subtitulo,
  children,
}) {
  return (
    <section className="page fadeUp">
      <header className="pageTitle">
        <h1>{titulo}</h1>

        {subtitulo && (
          <p>{subtitulo}</p>
        )}
      </header>

      {children}
    </section>
  );
}

function Tracker({ paso }) {
  const pasos = [
    "Simula",
    "Solicitud",
    "Garantía",
    "Revisión",
    "Oferta",
    "Firma",
  ];

  return (
    <>
      <div className="desktopTracker">
        {pasos.map(
          (nombre, index) => {
            const numero =
              index + 1;

            const completado =
              numero < paso;

            const actual =
              numero === paso;

            return (
              <div
                className="trackerItem"
                key={nombre}
              >
                <div
                  className={
                    completado
                      ? "trackerDot completed"
                      : actual
                      ? "trackerDot current"
                      : "trackerDot"
                  }
                >
                  {completado
                    ? "✓"
                    : numero}
                </div>

                <span
                  className={
                    actual
                      ? "trackerText activeTrackerText"
                      : "trackerText"
                  }
                >
                  {nombre}
                </span>

                {index <
                  pasos.length -
                    1 && (
                  <div
                    className={
                      completado
                        ? "trackerLine completedLine"
                        : "trackerLine"
                    }
                  />
                )}
              </div>
            );
          }
        )}
      </div>

      <div className="mobileTracker">
        <div className="mobileTrackerTop">
          <strong>
            Paso {paso} de 6
          </strong>

          <span>
            {pasos[paso - 1]}
          </span>
        </div>

        <div className="mobileProgress">
          <div
            className="mobileProgressFill"
            style={{
              width: `${
                (paso / 6) * 100
              }%`,
            }}
          />
        </div>

        {paso < 6 && (
          <small>
            Siguiente:{" "}
            {pasos[paso]}
          </small>
        )}
      </div>
    </>
  );
}

function Campo({
  label,
  value = "",
  onChange,
  type = "text",
  placeholder = "",
}) {
  return (
    <label className="field">
      <span>{label}</span>

      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) =>
          onChange?.(
            e.target.value
          )
        }
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  opciones,
}) {
  return (
    <label className="field">
      <span>{label}</span>

      <select
        value={value}
        onChange={(e) =>
          onChange(
            e.target.value
          )
        }
      >
        {opciones.map(
          (opcion) => (
            <option
              key={opcion}
              value={opcion}
            >
              {opcion ||
                "Selecciona"}
            </option>
          )
        )}
      </select>
    </label>
  );
}

function Upload({
  titulo,
  archivo,
  onChange,
}) {
  return (
    <label className="upload">
      <div className="uploadIcon">
        ↑
      </div>

      <div className="uploadInfo">
        <strong>
          {titulo}
        </strong>

        <span>
          {archivo
            ? archivo.name
            : "PDF, JPG o PNG"}
        </span>
      </div>

      <div className="uploadAction">
        {archivo
          ? "Cambiar"
          : "Seleccionar"}
      </div>

      <input
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={(e) =>
          onChange(
            e.target.files?.[0]
          )
        }
      />
    </label>
  );
}

function CheckControl({
  texto,
  checked,
  onChange,
}) {
  return (
    <label className="check">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) =>
          onChange(
            e.target.checked
          )
        }
      />

      <span>{texto}</span>
    </label>
  );
}

function NavButtons({
  atras,
  continuar,
  textoContinuar = "Continuar",
  disabled = false,
}) {
  return (
    <div className="navigation">
      <button
        className="secondary"
        onClick={atras}
      >
        Regresar
      </button>

      <button
        className="primary"
        onClick={continuar}
        disabled={disabled}
      >
        {textoContinuar}
      </button>
    </div>
  );
}

function SectionDivider({
  titulo,
}) {
  return (
    <div className="sectionDivider">
      <h3>{titulo}</h3>

      <div />
    </div>
  );
}

function Resumen({
  titulo,
  valor,
}) {
  return (
    <div className="summaryRow">
      <span>{titulo}</span>

      <strong>
        {valor || "-"}
      </strong>
    </div>
  );
}

function SummaryCard({
  titulo,
  valor,
}) {
  return (
    <div className="summaryCard">
      <span>{titulo}</span>

      <strong>
        {valor || "-"}
      </strong>
    </div>
  );
}

function OfertaDato({
  titulo,
  valor,
}) {
  return (
    <div className="offerData">
      <span>{titulo}</span>

      <strong>{valor}</strong>
    </div>
  );
}

function Documento({
  titulo,
}) {
  return (
    <div className="document">
      <div>
        <strong>{titulo}</strong>

        <span>
          Documento generado
        </span>
      </div>

      <button>
        Ver
      </button>
    </div>
  );
}

function MiniStep({
  numero,
  texto,
}) {
  return (
    <div className="miniStep">
      <span>{numero}</span>

      <strong>{texto}</strong>
    </div>
  );
}

function ProductData({
  titulo,
  valor,
}) {
  return (
    <div className="productData">
      <span>{titulo}</span>

      <strong>{valor}</strong>
    </div>
  );
}

function RequirementList({
  items,
}) {
  return (
    <div className="requirementList">
      {items.map((item) => (
        <div
          className="requirement"
          key={item}
        >
          <span>✓</span>

          <p>{item}</p>
        </div>
      ))}
    </div>
  );
}

function Footer({
  empresa,
  ir,
}) {
  return (
    <footer className="legalFooter">
      <div className="footerContent">
        <div className="footerBrand">
          <img
            src="/logo-trisal.jpeg"
            alt="TRISAL"
          />

          <strong>
            TRISAL
          </strong>
        </div>

        <div className="footerLegal">
          <p>
            Para la constitución y
            operación de{" "}
            {empresa.razonSocial} con tal
            carácter, no requiere de
            autorización de la Secretaría
            de Hacienda y Crédito Público.
          </p>

          <p>
            {empresa.razonSocial} se
            encuentra sujeta a la
            supervisión de la Comisión
            Nacional Bancaria y de Valores,
            únicamente para efectos de lo
            dispuesto por el artículo 56
            de la Ley General de
            Organizaciones y Actividades
            Auxiliares del Crédito.
          </p>
        </div>

        <div className="footerLinks">
          <button
            onClick={() => ir("une")}
          >
            UNE
          </button>

          <button
            onClick={() =>
              ir("normatividad")
            }
          >
            Normatividad
          </button>

          <button
            onClick={() => ir("buro")}
          >
            Buró de Entidades Financieras
          </button>

          <button
            onClick={() =>
              ir("privacidad")
            }
          >
            Aviso de privacidad
          </button>
        </div>
      </div>
    </footer>
  );
}

function calcularPago(
  monto,
  tasaAnual,
  plazo
) {
  if (!monto || !plazo) {
    return 0;
  }

  const tasaMensual =
    tasaAnual / 100 / 12;

  if (tasaMensual === 0) {
    return monto / plazo;
  }

  return (
    (monto * tasaMensual) /
    (1 -
      Math.pow(
        1 + tasaMensual,
        -plazo
      ))
  );
}

function moneda(valor) {
  return Number(
    valor || 0
  ).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
  });
}

/* =====================================================
   CSS
===================================================== */

const css = `
:root {
  --navy: #111a2a;
  --navy-2: #17243a;
  --gold: #9c7427;
  --gold-hover: #ae8432;

  --text: #161d2b;
  --muted: #657287;

  --background: #f6f6f3;
  --white: #ffffff;

  --border: #e1e5ea;

  --green: #1d7552;

  --shadow:
    0 12px 35px rgba(15,23,42,.055);
}

* {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  margin: 0;

  background:
    radial-gradient(
      circle at 100% 0%,
      rgba(156,116,39,.06),
      transparent 32%
    ),
    var(--background);

  color: var(--text);

  font-family:
    Inter,
    Arial,
    sans-serif;

  text-align: left;
}

button,
input,
select {
  font-family: inherit;
}

button {
  transition:
    background .2s ease,
    transform .2s ease,
    box-shadow .2s ease;
}

button:not(:disabled):hover {
  transform: translateY(-1px);
}

button:disabled {
  opacity: .55;
  cursor: wait;
}

.app {
  min-height: 100vh;
}

/* =====================================================
   HEADER
===================================================== */

.header {
  min-height: 86px;

  position: sticky;
  top: 0;
  z-index: 100;

  display: flex;
  align-items: center;
  justify-content: space-between;

  padding-left:
    max(
      28px,
      calc((100vw - 1240px) / 2)
    );

  padding-right:
    max(
      28px,
      calc((100vw - 1240px) / 2)
    );

  background:
    rgba(255,255,255,.97);

  backdrop-filter: blur(14px);

  border-bottom:
    1px solid rgba(17,26,42,.05);
}

.logoButton {
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.logo {
  width: 112px;
  display: block;
}

.desktopNav {
  display: flex;
  align-items: center;
  gap: 8px;
}

.navButton {
  border: 0;
  background: transparent;

  color: #354052;

  padding: 12px 14px;

  border-radius: 9px;

  font-size: 15px;
  font-weight: 750;

  cursor: pointer;
}

.navButton:hover {
  background: #f1f3f6;
}

.navCta,
.goldButton {
  border: 0;

  background: var(--gold);

  color: white;

  border-radius: 10px;

  padding: 14px 19px;

  font-size: 15px;
  font-weight: 850;

  cursor: pointer;
}

.navCta:hover,
.goldButton:hover {
  background: var(--gold-hover);
}

.hamburger {
  display: none;
}

.legalDropdown {
  position: relative;
}

.legalMenu {
  position: absolute;

  top: 49px;
  right: 0;

  min-width: 255px;

  background: white;

  border:
    1px solid var(--border);

  border-radius: 13px;

  padding: 8px;

  box-shadow:
    0 18px 45px
    rgba(15,23,42,.13);
}

.legalMenu button {
  width: 100%;

  display: block;

  border: 0;

  background: transparent;

  color: var(--text);

  text-align: left;

  padding: 11px 12px;

  border-radius: 8px;

  cursor: pointer;

  font-weight: 700;
}

.legalMenu button:hover {
  background: #f3f4f6;
}

/* =====================================================
   GENERAL PAGE
===================================================== */

.container {
  width:
    min(
      1240px,
      calc(100% - 64px)
    );

  margin: 0 auto;

  padding:
    62px 0 100px;
}

.page {
  width: 100%;
}

.pageTitle {
  width: 100%;

  margin:
    0 0 38px;

  text-align: left;
}

.pageTitle h1 {
  margin: 0;

  max-width: 920px;

  color: var(--text);

  font-size:
    clamp(
      40px,
      4vw,
      56px
    );

  line-height: 1.03;

  letter-spacing: -.038em;

  text-align: left;
}

.pageTitle p {
  max-width: 800px;

  margin:
    11px 0 0;

  color: var(--muted);

  font-size: 18px;

  line-height: 1.55;

  text-align: left;
}

.fadeUp {
  animation:
    fadeUp .5s ease both;
}

@keyframes fadeUp {
  from {
    opacity: 0;

    transform:
      translateY(18px);
  }

  to {
    opacity: 1;

    transform:
      translateY(0);
  }
}

/* =====================================================
   ERRORS
===================================================== */

.globalError,
.globalInfo {
  width: 100%;

  display: flex;
  flex-direction: column;

  gap: 4px;

  margin-bottom: 25px;

  padding: 15px 18px;

  border-radius: 11px;
}

.globalError {
  background: #fff0f0;

  border:
    1px solid #efc6c6;

  color: #8a2929;
}

.globalInfo {
  background: #edf5ff;

  border:
    1px solid #ccdff5;

  color: #315f93;
}

/* =====================================================
   HERO HOME
===================================================== */

.hero {
  min-height: 68vh;

  display: grid;

  grid-template-columns:
    minmax(0, 1.35fr)
    minmax(350px, .65fr);

  gap: 70px;

  align-items: center;
}

.heroContent {
  text-align: left;
}

.eyebrow,
.cardEyebrow,
.productKicker,
.offerEyebrow {
  margin: 0;

  color: var(--gold);

  font-size: 12px;

  font-weight: 900;

  letter-spacing: .15em;
}

.hero h1 {
  max-width: 780px;

  margin:
    14px 0 24px;

  color: var(--text);

  font-size:
    clamp(
      48px,
      5.6vw,
      74px
    );

  line-height: .99;

  letter-spacing: -.047em;

  text-align: left;
}

.heroText {
  max-width: 670px;

  margin: 0;

  color: var(--muted);

  font-size: 19px;

  line-height: 1.65;

  text-align: left;
}

.heroCard {
  background: white;

  padding: 31px;

  border:
    1px solid var(--border);

  border-radius: 22px;

  box-shadow: var(--shadow);

  text-align: left;
}

.heroCard h2 {
  margin:
    8px 0 20px;

  font-size: 27px;

  line-height: 1.2;
}

.miniStep {
  display: grid;

  grid-template-columns:
    35px 1fr;

  gap: 12px;

  align-items: center;

  padding: 13px 0;

  border-bottom:
    1px solid #edf0f3;
}

.miniStep > span {
  width: 34px;
  height: 34px;

  display: grid;
  place-items: center;

  background: var(--navy);

  color: white;

  border-radius: 50%;

  font-weight: 900;
}

.heroProductTag {
  display: inline-block;

  margin-top: 18px;

  padding: 7px 10px;

  background: #f3efe6;

  color: #73571d;

  border-radius: 8px;

  font-size: 12px;

  font-weight: 850;
}

.textLinkButton {
  border: 0;

  background: transparent;

  color: #76591e;

  padding:
    20px 0 0;

  cursor: pointer;

  font-weight: 800;

  text-align: left;
}

/* =====================================================
   BUTTONS
===================================================== */

.primary,
.secondary,
.demoButton {
  min-height: 48px;

  border-radius: 10px;

  padding:
    12px 20px;

  font-size: 15px;

  font-weight: 850;

  cursor: pointer;
}

.primary {
  border: 0;

  background: var(--navy);

  color: white;
}

.primary:hover {
  background: #202b3e;

  box-shadow:
    0 8px 22px
    rgba(17,26,42,.14);
}

.secondary {
  border:
    1px solid #c8d0db;

  background: white;

  color: var(--navy);
}

.demoButton {
  border: 0;

  background: #e9edf2;

  color: #4a5668;
}

.buttonRow,
.navigation {
  display: flex;

  gap: 12px;

  margin-top: 26px;
}

.navigation {
  justify-content: space-between;
}

.formAction,
.bottomAction,
.demoArea {
  display: flex;

  justify-content: flex-start;

  margin-top: 26px;
}

/* =====================================================
   CARDS
===================================================== */

.card {
  width: 100%;

  background: white;

  padding: 30px;

  margin-bottom: 24px;

  border:
    1px solid var(--border);

  border-radius: 18px;

  box-shadow: var(--shadow);

  text-align: left;
}

.formCard {
  max-width: 820px;
}

.grid2 {
  display: grid;

  grid-template-columns:
    repeat(2, minmax(0,1fr));

  gap:
    0 28px;
}

/* =====================================================
   FIELDS
===================================================== */

.field {
  display: flex;

  flex-direction: column;

  gap: 8px;

  margin-bottom: 20px;

  color: #354052;

  font-weight: 750;

  text-align: left;
}

.field span,
.label {
  font-size: 15px;
}

.field input,
.field select {
  width: 100%;

  min-height: 50px;

  border:
    1px solid #d1d8e2;

  border-radius: 10px;

  padding:
    13px 15px;

  background: white;

  color: var(--text);

  font-size: 16px;

  outline: none;
}

.field input:focus,
.field select:focus {
  border-color: var(--gold);

  box-shadow:
    0 0 0 3px
    rgba(156,116,39,.09);
}

.sectionDivider {
  display: grid;

  grid-template-columns:
    auto 1fr;

  gap: 18px;

  align-items: center;

  margin:
    10px 0 24px;
}

.sectionDivider h3 {
  margin: 0;

  font-size: 17px;

  color: var(--text);
}

.sectionDivider > div {
  height: 1px;

  background: var(--border);
}

/* =====================================================
   TRACKER
===================================================== */

.desktopTracker {
  display: flex;

  align-items: center;

  width: 100%;

  margin:
    0 0 45px;
}

.trackerItem {
  flex: 1;

  min-width: 0;

  display: flex;

  align-items: center;
}

.trackerDot {
  width: 34px;
  height: 34px;

  flex-shrink: 0;

  display: grid;
  place-items: center;

  border:
    2px solid #d3dae4;

  border-radius: 50%;

  color: #8b95a4;

  background: var(--background);

  font-size: 13px;

  font-weight: 850;
}

.trackerDot.completed {
  background: var(--green);

  border-color: var(--green);

  color: white;
}

.trackerDot.current {
  background: var(--navy);

  border-color: var(--navy);

  color: white;
}

.trackerText {
  margin-left: 9px;

  color: #8993a1;

  font-size: 13px;

  white-space: nowrap;
}

.activeTrackerText {
  color: var(--navy);

  font-weight: 850;
}

.trackerLine {
  height: 2px;

  flex: 1;

  min-width: 10px;

  margin:
    0 12px;

  background: #dde2e8;
}

.completedLine {
  background: var(--green);
}

.mobileTracker {
  display: none;
}

/* =====================================================
   HOW IT WORKS
===================================================== */

.simpleFlow {
  width: 100%;

  display: flex;

  flex-direction: column;

  gap: 13px;
}

.simpleFlowCard {
  width: 100%;

  min-height: 95px;

  display: grid;

  grid-template-columns:
    54px
    minmax(190px, 280px)
    minmax(0,1fr);

  gap: 25px;

  align-items: center;

  padding:
    19px 25px;

  background: white;

  border:
    1px solid var(--border);

  border-radius: 16px;

  box-shadow:
    0 7px 23px
    rgba(15,23,42,.04);

  text-align: left;
}

.stepCircle {
  width: 48px;
  height: 48px;

  display: grid;
  place-items: center;

  background: var(--navy);

  color: white;

  border-radius: 13px;

  font-size: 18px;

  font-weight: 900;
}

.simpleFlowCard h3 {
  margin: 0;

  color: var(--text);

  font-size: 20px;

  line-height: 1.3;

  text-align: left;
}

.simpleFlowCard p {
  margin: 0;

  color: var(--muted);

  font-size: 16px;

  line-height: 1.5;

  text-align: left;
}

/* =====================================================
   PRODUCT
===================================================== */

.productHero {
  display: grid;

  grid-template-columns:
    minmax(0,1.5fr)
    minmax(230px,.5fr);

  gap: 50px;

  align-items: center;

  padding:
    42px 45px;

  margin-bottom: 24px;

  background:
    linear-gradient(
      135deg,
      #111a2a 0%,
      #17263d 100%
    );

  border-radius: 20px;

  box-shadow:
    0 14px 35px
    rgba(15,23,42,.1);

  text-align: left;
}

.productHeroText {
  text-align: left;
}

.productHero h2 {
  max-width: 680px;

  margin:
    10px 0 16px;

  color: white !important;

  font-size:
    clamp(
      29px,
      3.3vw,
      41px
    );

  line-height: 1.14;

  letter-spacing: -.025em;

  text-align: left;
}

.productHero p:not(.productKicker) {
  max-width: 720px;

  margin: 0;

  color: #d7dde7 !important;

  font-size: 16px;

  line-height: 1.65;

  text-align: left;
}

.productHeroAction {
  display: flex;

  justify-content: flex-end;
}

.productHeroAction button {
  width: 100%;

  max-width: 230px;

  min-height: 55px;
}

.productDataGrid {
  display: grid;

  grid-template-columns:
    repeat(3,minmax(0,1fr));

  gap: 15px;

  margin-bottom: 22px;
}

.productData {
  min-height: 120px;

  display: flex;

  flex-direction: column;

  justify-content: center;

  align-items: flex-start;

  padding: 21px;

  background: white;

  border:
    1px solid var(--border);

  border-radius: 14px;

  box-shadow:
    0 7px 22px
    rgba(15,23,42,.04);

  text-align: left;
}

.productData span {
  color: var(--muted);

  font-size: 13px;

  margin-bottom: 8px;
}

.productData strong {
  color: var(--text);

  font-size: 17px;

  line-height: 1.4;

  text-align: left;
}

.catPublicCard {
  display: grid;

  grid-template-columns:
    minmax(200px,.7fr)
    minmax(190px,.6fr)
    minmax(0,1.7fr);

  gap: 28px;

  align-items: center;

  margin-bottom: 22px;

  padding:
    24px 27px;

  background: #f4efe4;

  border:
    1px solid #dfd3b8;

  border-left:
    5px solid var(--gold);

  border-radius: 13px;

  text-align: left;
}

.catLabel {
  display: block;

  color: #75571b;

  margin-bottom: 6px;

  font-size: 12px;

  font-weight: 900;

  letter-spacing: .12em;
}

.catPublicCard strong {
  color: var(--text);

  font-size: 25px;
}

.catMeta {
  display: flex;

  flex-direction: column;

  gap: 4px;
}

.catMeta span {
  color: #726a5a;

  font-size: 13px;
}

.catMeta strong {
  font-size: 16px;
}

.catPublicCard > p {
  margin: 0;

  color: #61594c;

  line-height: 1.55;
}

.requirementsGrid {
  display: grid;

  grid-template-columns:
    repeat(2,minmax(0,1fr));

  gap: 20px;
}

.requirementsGrid .card {
  height: 100%;
}

.requirementsGrid h2 {
  margin:
    8px 0 20px;

  font-size: 24px;

  text-align: left;
}

.requirement {
  display: grid;

  grid-template-columns:
    20px 1fr;

  gap: 10px;

  padding: 7px 0;

  align-items: start;
}

.requirement > span {
  color: var(--green);

  font-weight: 900;
}

.requirement p {
  margin: 0;

  color: #4c586a;

  line-height: 1.5;
}

/* =====================================================
   CHOICES
===================================================== */

.choiceGrid {
  display: grid;

  grid-template-columns:
    repeat(2,minmax(0,1fr));

  gap: 20px;

  margin-bottom: 25px;
}

.bigChoice {
  min-height: 220px;

  display: flex;

  flex-direction: column;

  justify-content: center;

  align-items: flex-start;

  padding: 30px;

  background: white;

  border:
    2px solid transparent;

  border-radius: 18px;

  box-shadow: var(--shadow);

  cursor: pointer;

  text-align: left;
}

.bigChoice:hover {
  border-color: #d2bd8b;
}

.bigChoice.chosen {
  border-color: var(--gold);

  background: #fffdf8;
}

.choiceIcon {
  min-width: 43px;

  display: inline-grid;
  place-items: center;

  padding: 8px 9px;

  background: #f3efe5;

  color: #76591f;

  border-radius: 9px;

  font-size: 13px;

  font-weight: 900;
}

.bigChoice h2 {
  margin:
    15px 0 7px;

  font-size: 25px;

  text-align: left;
}

.bigChoice p {
  max-width: 480px;

  margin: 0;

  color: var(--muted);

  line-height: 1.55;

  text-align: left;
}

/* =====================================================
   UPLOADS
===================================================== */

.upload {
  position: relative;

  width: 100%;

  display: grid;

  grid-template-columns:
    43px 1fr auto;

  gap: 14px;

  align-items: center;

  margin-bottom: 13px;

  padding: 16px;

  border:
    1px dashed #bac4d0;

  border-radius: 12px;

  cursor: pointer;

  text-align: left;
}

.upload:hover {
  border-color: var(--gold);

  background: #fffdf8;
}

.uploadIcon {
  width: 42px;
  height: 42px;

  display: grid;
  place-items: center;

  background: #f3efe6;

  color: var(--gold);

  border-radius: 50%;

  font-size: 19px;

  font-weight: 900;
}

.uploadInfo {
  min-width: 0;

  display: flex;

  flex-direction: column;

  gap: 4px;
}

.uploadInfo strong {
  color: var(--text);
}

.uploadInfo span {
  overflow: hidden;

  text-overflow: ellipsis;

  color: var(--muted);

  white-space: nowrap;

  font-size: 13px;
}

.uploadAction {
  padding:
    8px 11px;

  border:
    1px solid #ccd3dc;

  border-radius: 8px;

  background: white;

  font-size: 13px;

  font-weight: 750;
}

.upload input {
  position: absolute;

  inset: 0;

  opacity: 0;

  cursor: pointer;
}

/* =====================================================
   CHECKS / NOTICES
===================================================== */

.check {
  display: flex;

  gap: 12px;

  align-items: flex-start;

  padding:
    14px 0;

  border-bottom:
    1px solid #edf0f3;

  line-height: 1.5;

  text-align: left;
}

.check input {
  width: 18px;
  height: 18px;

  flex-shrink: 0;

  margin-top: 2px;
}

.notice,
.importantNotice,
.smallNotice,
.demoNotice {
  margin:
    20px 0;

  padding:
    15px 17px;

  border-radius: 10px;

  line-height: 1.55;

  text-align: left;
}

.notice {
  background: #f1f3f6;

  color: #556174;
}

.importantNotice {
  background: #fff5dd;

  color: #70551d;
}

.smallNotice {
  background: #f2efe7;

  color: #5d4c2b;
}

.demoNotice {
  background: #edf4fc;

  color: #315d8d;
}

/* =====================================================
   SUMMARY / REVIEW
===================================================== */

.summaryGrid {
  display: grid;

  grid-template-columns:
    repeat(3,minmax(0,1fr));

  gap: 14px;

  margin-bottom: 22px;
}

.summaryCard {
  min-height: 105px;

  display: flex;

  flex-direction: column;

  justify-content: center;

  padding: 19px;

  background: white;

  border:
    1px solid var(--border);

  border-radius: 13px;

  text-align: left;
}

.summaryCard span,
.summaryLabel {
  color: var(--muted);

  margin-bottom: 7px;

  font-size: 13px;
}

.summaryCard strong {
  color: var(--text);

  font-size: 18px;
}

.summaryRow {
  display: flex;

  justify-content: space-between;

  gap: 30px;

  padding:
    14px 0;

  border-bottom:
    1px solid #edf0f3;

  text-align: left;
}

.statusRow {
  display: flex;

  justify-content: space-between;

  align-items: center;
}

.statusRow h2 {
  margin:
    5px 0 0;
}

.yellowStatus {
  display: inline-block;

  background: #fff0c1;

  color: #775a11;

  padding:
    8px 11px;

  border-radius: 8px;

  font-weight: 850;
}

.statusCard {
  display: grid;

  grid-template-columns:
    75px 1fr;

  gap: 25px;

  align-items: start;

  max-width: 850px;

  padding: 30px;

  background: white;

  border:
    1px solid var(--border);

  border-radius: 18px;

  box-shadow: var(--shadow);

  text-align: left;
}

.statusCard h2 {
  margin:
    7px 0 10px;

  font-size: 29px;
}

.statusCard p:not(.cardEyebrow) {
  max-width: 650px;

  margin:
    0 0 18px;

  color: var(--muted);

  line-height: 1.6;
}

.statusIcon,
.successIcon {
  width: 65px;
  height: 65px;

  display: grid;
  place-items: center;

  background: var(--navy);

  color: white;

  border-radius: 15px;

  font-size: 18px;

  font-weight: 900;
}

.successIcon {
  background: var(--green);

  font-size: 27px;
}

/* =====================================================
   OFFER
===================================================== */

.offerHero {
  margin-bottom: 18px;

  padding:
    28px;

  background:
    linear-gradient(
      135deg,
      var(--navy),
      var(--navy-2)
    );

  border-radius: 17px;

  color: white;

  text-align: left;
}

.offerHero h2 {
  margin:
    7px 0 0;

  color: white;

  font-size: 43px;
}

.offerGrid {
  display: grid;

  grid-template-columns:
    repeat(3,minmax(0,1fr));

  gap: 14px;
}

.offerData {
  min-height: 108px;

  display: flex;

  flex-direction: column;

  justify-content: center;

  align-items: flex-start;

  padding: 19px;

  background: white;

  border:
    1px solid var(--border);

  border-radius: 13px;

  text-align: left;
}

.offerData span {
  color: var(--muted);

  margin-bottom: 7px;

  font-size: 13px;
}

.offerData strong {
  font-size: 18px;
}

.catDisclosure {
  margin-top: 20px;

  padding: 19px;

  background: #f4efe4;

  border-left:
    4px solid var(--gold);

  border-radius: 12px;

  text-align: left;
}

.catDisclosure strong {
  font-size: 20px;
}

.catDisclosure p {
  margin:
    7px 0 0;

  color: #615b50;

  line-height: 1.5;
}

.warningBox {
  margin-top: 17px;

  padding: 19px;

  background: #fff7e5;

  border-radius: 12px;

  text-align: left;
}

.warningBox p {
  color: #67582f;

  line-height: 1.5;
}

/* =====================================================
   DOCUMENTS / CREDIT PORTAL
===================================================== */

.document {
  display: flex;

  align-items: center;

  justify-content: space-between;

  gap: 20px;

  padding:
    15px 0;

  border-bottom:
    1px solid #edf0f3;

  text-align: left;
}

.document > div {
  display: flex;

  flex-direction: column;

  gap: 4px;
}

.document span {
  color: var(--muted);

  font-size: 13px;
}

.document button {
  border: 0;

  background: transparent;

  color: var(--gold);

  font-weight: 850;

  cursor: pointer;
}

.portalOptions {
  display: grid;

  grid-template-columns:
    repeat(3,minmax(0,1fr));

  gap: 13px;
}

.portalOptions button {
  min-height: 80px;

  border:
    1px solid var(--border);

  background: white;

  border-radius: 13px;

  color: var(--text);

  cursor: pointer;

  font-weight: 750;

  text-align: left;

  padding: 18px;
}

/* =====================================================
   LEGAL
===================================================== */

.legalText {
  max-width: 1000px;

  color: #4d596b;

  line-height: 1.7;

  text-align: left;
}

.legalLink {
  display: inline-block;

  margin-top: 15px;

  color: var(--navy);

  font-weight: 850;
}

.buroLogoMock {
  display: inline-block;

  margin-bottom: 18px;

  padding:
    15px 18px;

  background: var(--navy);

  color: white;

  border-radius: 10px;

  font-size: 13px;

  font-weight: 900;

  letter-spacing: .06em;
}

/* =====================================================
   FOOTER
===================================================== */

.legalFooter {
  background: var(--navy);

  color: white;

  padding:
    38px 28px;
}

.footerContent {
  width:
    min(
      1240px,
      100%
    );

  display: grid;

  grid-template-columns:
    170px
    minmax(0,1fr)
    260px;

  gap: 35px;

  align-items: start;

  margin: 0 auto;
}

.footerBrand {
  display: flex;

  flex-direction: column;

  gap: 10px;

  align-items: flex-start;
}

.footerBrand img {
  width: 95px;

  background: white;

  border-radius: 8px;
}

.footerLegal {
  max-width: 720px;

  color: #d3d8e1;

  font-size: 12px;

  line-height: 1.65;

  text-align: left;
}

.footerLegal p {
  margin:
    0 0 10px;
}

.footerLinks {
  display: flex;

  flex-direction: column;

  align-items: flex-start;

  gap: 7px;
}

.footerLinks button {
  border: 0;

  background: transparent;

  color: white;

  padding: 3px 0;

  cursor: pointer;

  font-weight: 700;

  text-align: left;
}

/* =====================================================
   MOBILE
===================================================== */

@media (max-width: 820px) {

  .header {
    min-height: 66px;

    padding:
      8px 14px;
  }

  .logo {
    width: 82px;
  }

  .hamburger {
    display: block;

    border: 0;

    background: var(--navy);

    color: white;

    border-radius: 8px;

    padding:
      9px 12px;

    cursor: pointer;

    font-weight: 800;
  }

  .desktopNav {
    display: none;
  }

  .mobileNavOpen {
    position: absolute;

    top: 65px;

    left: 10px;
    right: 10px;

    display: flex;

    flex-direction: column;

    align-items: stretch;

    padding: 13px;

    background: white;

    border:
      1px solid var(--border);

    border-radius: 14px;

    box-shadow:
      0 20px 45px
      rgba(15,23,42,.16);
  }

  .mobileNavOpen .navButton,
  .mobileNavOpen .navCta {
    width: 100%;

    margin: 2px 0;

    text-align: left;
  }

  .legalDropdown {
    width: 100%;
  }

  .legalMenu {
    position: static;

    width: 100%;

    min-width: 0;

    box-shadow: none;

    margin-top: 5px;
  }

  .container {
    width:
      calc(100% - 26px);

    padding:
      30px 0 65px;
  }

  .pageTitle {
    margin-bottom: 25px;
  }

  .pageTitle h1 {
    font-size:
      clamp(
        34px,
        10.5vw,
        43px
      );

    line-height: 1.05;
  }

  .pageTitle p {
    font-size: 16px;
  }

  .hero {
    min-height: auto;

    grid-template-columns: 1fr;

    gap: 30px;
  }

  .hero h1 {
    font-size:
      clamp(
        43px,
        13vw,
        55px
      );

    line-height: 1.01;
  }

  .heroText {
    font-size: 17px;
  }

  .heroCard {
    padding: 22px;
  }

  .desktopTracker {
    display: none;
  }

  .mobileTracker {
    display: block;

    margin:
      0 0 27px;
  }

  .mobileTrackerTop {
    display: flex;

    justify-content: space-between;

    gap: 10px;

    margin-bottom: 8px;
  }

  .mobileProgress {
    width: 100%;

    height: 7px;

    overflow: hidden;

    background: #dfe3e8;

    border-radius: 20px;

    margin-bottom: 7px;
  }

  .mobileProgressFill {
    height: 100%;

    background: var(--gold);

    border-radius: 20px;
  }

  .mobileTracker small {
    color: var(--muted);
  }

  .grid2,
  .choiceGrid,
  .productDataGrid,
  .requirementsGrid,
  .offerGrid,
  .summaryGrid {
    grid-template-columns: 1fr;
  }

  .card {
    padding: 20px;
  }

  .formCard {
    max-width: none;
  }

  .simpleFlowCard {
    grid-template-columns:
      45px 1fr;

    gap:
      10px 15px;

    align-items: start;

    padding: 17px;
  }

  .simpleFlowCard h3 {
    align-self: center;

    font-size: 18px;
  }

  .simpleFlowCard p {
    grid-column: 2;

    font-size: 15px;
  }

  .stepCircle {
    width: 42px;
    height: 42px;
  }

  .productHero {
    grid-template-columns: 1fr;

    gap: 26px;

    padding: 24px;
  }

  .productHero h2 {
    font-size: 31px;
  }

  .productHeroAction {
    justify-content: stretch;
  }

  .productHeroAction button {
    max-width: none;
  }

  .catPublicCard {
    grid-template-columns: 1fr;

    gap: 15px;

    padding: 20px;
  }

  .navigation,
  .buttonRow {
    flex-direction: column;
  }

  .navigation button,
  .buttonRow button,
  .formAction button,
  .bottomAction button {
    width: 100%;
  }

  .navigation {
    flex-direction: column-reverse;
  }

  .upload {
    grid-template-columns:
      42px 1fr;
  }

  .uploadAction {
    display: none;
  }

  .statusCard {
    grid-template-columns: 1fr;

    gap: 18px;

    padding: 21px;
  }

  .summaryRow {
    flex-direction: column;

    gap: 4px;
  }

  .portalOptions {
    grid-template-columns:
      1fr 1fr;
  }

  .footerContent {
    grid-template-columns: 1fr;

    gap: 25px;
  }

  .footerLegal {
    max-width: none;
  }
}

@media (max-width: 440px) {

  .optionRow {
    display: grid;

    grid-template-columns:
      1fr 1fr;
  }

  .optionButton {
    width: 100%;
  }

  .portalOptions {
    grid-template-columns: 1fr;
  }
}
`;