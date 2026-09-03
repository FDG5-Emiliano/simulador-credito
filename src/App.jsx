import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "./lib/supabase";

/* =========================================================
   CONFIGURACIÓN DEL FLUJO
========================================================= */

const PASOS = [
  {
    numero: 1,
    nombre: "Simula",
    pantallaBase: "simulacion",
  },
  {
    numero: 2,
    nombre: "Solicitud",
    pantallaBase: "tipoPersona",
  },
  {
    numero: 3,
    nombre: "Garantía",
    pantallaBase: "tipoCredito",
  },
  {
    numero: 4,
    nombre: "Revisión",
    pantallaBase: "revision",
  },
  {
    numero: 5,
    nombre: "Oferta",
    pantallaBase: "oferta",
  },
  {
    numero: 6,
    nombre: "Firma",
    pantallaBase: "cuentaBanco",
  },
];

const PASO_POR_PANTALLA = {
  simulacion: 1,

  tipoPersona: 2,
  registro: 2,
  loginCliente: 2,
  confirmarCorreo: 2,
  consentimientos: 2,
  datosSolicitante: 2,
  pep: 2,
  documentosIdentidad: 2,
  domicilio: 2,
  ingresos: 2,
  documentosFinancieros: 2,
  solicitud: 2,

  tipoCredito: 3,
  garantia: 3,
  obligado: 3,
  garantiaStatus: 3,

  revision: 4,
  enRevision: 4,

  oferta: 5,

  cuentaBanco: 6,
  contratos: 6,
  firma: 6,
  tesoreriaCliente: 6,
  dispersado: 6,
  creditoActivo: 6,
};

const PANTALLAS_PUBLICAS = [
  "inicio",
  "producto",
  "comoFunciona",
  "une",
  "normatividad",
  "buro",
  "privacidad",
];

const ESTADOS_ENVIADOS = [
  "SUBMITTED",
  "IN_REVIEW",
  "APPROVED",
  "SIGNED",
  "DISBURSED",
];

const DOCUMENTOS_BUCKET = "documentos-solicitudes";

/* =========================================================
   APP
========================================================= */

export default function App() {
  const [pantalla, setPantalla] = useState("inicio");

  const [menuMovil, setMenuMovil] = useState(false);
  const [legalAbierto, setLegalAbierto] = useState(false);

  const [usuario, setUsuario] = useState(null);
  const [cargandoSesion, setCargandoSesion] = useState(true);

  const [solicitudId, setSolicitudId] = useState(null);
  const [folio, setFolio] = useState("");

  const [estadoSolicitud, setEstadoSolicitud] = useState("DRAFT");

  const [pasoMaximo, setPasoMaximo] = useState(1);

  const [ultimaPantallaPorPaso, setUltimaPantallaPorPaso] = useState({
    1: "simulacion",
    2: "tipoPersona",
    3: "tipoCredito",
    4: "revision",
    5: "oferta",
    6: "cuentaBanco",
  });

  const [mensajeError, setMensajeError] = useState("");
  const [mensajeInfo, setMensajeInfo] = useState("");

  const [guardando, setGuardando] = useState(false);

  const [archivos, setArchivos] = useState({});

  const yaRecuperoRef = useRef(false);

  const [consentimientos, setConsentimientos] = useState({
    privacidad: false,
    buro: false,
    tratamiento: false,
    identidad: false,
  });

  const [datos, setDatos] = useState({
    /* CRÉDITO */
    montoSolicitado: "",
    plazoSolicitado: "",
    destino: "",

    /* TIPO PERSONA */
    tipoPersona: "",

    /* CUENTA */
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

    /* DECLARACIÓN PEP */
    esPep: "",
    tipoPep: "",
    detallePep: "",
    declaracionPepAceptada: false,
    declaracionPepFecha: "",

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
banco: "",
clabe: "",
fechaPrimerPago: "",

    /* OFERTA DEMO */
    montoAprobado: "10000",
    plazoAprobado: "6",
    tasaAprobada: "49",
    tasaMoratoriaAprobada: "73.5",
    comisionAprobada: "3",
    catAprobado: "68.5",
  });

  const empresa = {
    razonSocial: "FDG5 SERVICIOS, S.A. DE C.V., SOFOM, E.N.R.",
    marca: "TRISAL",

    telefonoComercial: "8441001493",
    correoComercial: "informacion.fdg5@gmail.com",
    sitioWeb: "https://trisalmx.com",

    direccion:
      "Paseo del Valle No. 310, Colonia San Patricio, C.P. 25204, Saltillo, Coahuila de Zaragoza",

    uneTitular: "MAYELA DEL ROSARIO GONZÁLEZ RAMOS",
    uneDireccion:
      "Paseo del Valle No. 310, Colonia San Patricio, C.P. 25204, Saltillo, Coahuila de Zaragoza",
    uneTelefono: "8441001493",
    uneCorreo: "informacion.fdg5@gmail.com",
    uneHorario: "Lunes a viernes de 09:00 a 15:00 horas",
    uneEntidad: "Coahuila",
    uneSucursales: "1",
    uneCanal: "UNE",

    folioMercantil: "N-2024072786",
    escrituraConstitutiva: "187",
    fechaEscrituraConstitutiva: "16/07/2024",
    fechaInscripcionRpc: "14/08/2024",
    representanteLegal: "MAYELA DEL ROSARIO GONZÁLEZ RAMOS",
    reca: "17307-439-043916/01-01273-0626",
    jurisdiccion: "Tribunales locales competentes de Saltillo, Coahuila de Zaragoza",
    ciudadFirma: "Saltillo, Coahuila de Zaragoza",

    condusefTelefono: "55 53 400 999",
    condusefCorreo: "asesoria@condusef.gob.mx",
  };

  const producto = {
    nombre: "Crédito Simple TRISAL",

    tipo: "Crédito simple con tasa de interés fija.",

    mercadoObjetivo:
      "Personas físicas con actividad empresarial, profesionistas, comerciantes y personas morales que requieran financiamiento para capital de trabajo, inventario, adquisición de equipo, liquidez u otros destinos autorizados.",

    montoMinimo: 10000,
    montoMaximo: null,

    plazoMinimo: 3,
    plazoMaximo: 12,

    tasaTipo: "Fija",

    tasaMaxima: null,
    catPromedio: null,
    fechaCalculoCat: null,

    metodologiaCat:
      "Calculado conforme a la metodología, fórmula, componentes y supuestos aplicables establecidos por Banco de México.",
  };

  /* =========================================================
     HELPERS NUMÉRICOS
  ========================================================= */

  function numeroONull(valor) {
    if (
      valor === "" ||
      valor === null ||
      valor === undefined
    ) {
      return null;
    }

    const convertido = Number(valor);

    return Number.isFinite(convertido) ? convertido : null;
  }

  function numeroObligatorio(valor) {
    const convertido = numeroONull(valor);

    return convertido ?? 0;
  }

  function esNumeroPositivo(valor) {
    const convertido = numeroONull(valor);

    return convertido !== null && convertido > 0;
  }

  /* =========================================================
     SESIÓN
  ========================================================= */

  useEffect(() => {
    iniciarSesionPersistente();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user || null;

      setUsuario(user);

      if (user) {
        setDatos((prev) => ({
          ...prev,
          correo: prev.correo || user.email || "",
        }));
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function iniciarSesionPersistente() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        setUsuario(session.user);

        setDatos((prev) => ({
          ...prev,
          correo: prev.correo || session.user.email || "",
        }));

        await recuperarSolicitud(session.user.id);
      } else {
        recuperarLocal();
      }
    } catch (error) {
      console.error(error);
      recuperarLocal();
    } finally {
      yaRecuperoRef.current = true;
      setCargandoSesion(false);
    }
  }

  /* =========================================================
     NAVEGACIÓN
  ========================================================= */

  function ir(nuevaPantalla, opciones = {}) {
    const { noGuardarHistorial = false } = opciones;

    setMensajeError("");

    setLegalAbierto(false);
    setMenuMovil(false);

    const pasoNuevo = PASO_POR_PANTALLA[nuevaPantalla];

    if (pasoNuevo) {
      setPasoMaximo((prev) => Math.max(prev, pasoNuevo));

      if (!noGuardarHistorial) {
        setUltimaPantallaPorPaso((prev) => ({
          ...prev,
          [pasoNuevo]: nuevaPantalla,
        }));
      }
    }

    setPantalla(nuevaPantalla);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function navegarPorTracker(numeroPaso) {
    /*
      Solo permite etapas que el usuario ya alcanzó.
      Después de una solicitud enviada, se respetan
      las restricciones del estado.
    */

    if (numeroPaso > pasoMaximo) {
      return;
    }

    if (
      ESTADOS_ENVIADOS.includes(estadoSolicitud) &&
      numeroPaso < 4
    ) {
      /*
        Una solicitud enviada ya no debe reabrirse
        como editable desde el tracker.
      */
      return;
    }

    const destino =
      ultimaPantallaPorPaso[numeroPaso] ||
      PASOS.find((p) => p.numero === numeroPaso)?.pantallaBase;

    if (!destino) {
      return;
    }

    ir(destino, {
      noGuardarHistorial: true,
    });
  }

  function regresarA(pantallaAnterior) {
    ir(pantallaAnterior);
  }

  /* =========================================================
     BORRADOR LOCAL
  ========================================================= */

  useEffect(() => {
    if (cargandoSesion || !yaRecuperoRef.current) {
      return;
    }

    if (PANTALLAS_PUBLICAS.includes(pantalla)) {
      return;
    }

    const datosSeguros = {
      ...datos,
      password: "",
    };

    const borrador = {
      datos: datosSeguros,
      pantalla,
      consentimientos,
      pasoMaximo,
      ultimaPantallaPorPaso,
      guardadoEn: new Date().toISOString(),
    };

    localStorage.setItem(
      "trisal_solicitud_borrador",
      JSON.stringify(borrador)
    );
  }, [
    datos,
    pantalla,
    consentimientos,
    pasoMaximo,
    ultimaPantallaPorPaso,
    cargandoSesion,
  ]);

  function recuperarLocal() {
    try {
      const guardado = localStorage.getItem(
        "trisal_solicitud_borrador"
      );

      if (!guardado) {
        return;
      }

      const borrador = JSON.parse(guardado);

      if (borrador.datos) {
        setDatos((prev) => ({
          ...prev,
          ...borrador.datos,
          password: "",
        }));
      }

      if (borrador.consentimientos) {
        setConsentimientos(borrador.consentimientos);
      }

      if (borrador.pasoMaximo) {
        setPasoMaximo(borrador.pasoMaximo);
      }

      if (borrador.ultimaPantallaPorPaso) {
        setUltimaPantallaPorPaso((prev) => ({
          ...prev,
          ...borrador.ultimaPantallaPorPaso,
        }));
      }

      if (
        borrador.pantalla &&
        !PANTALLAS_PUBLICAS.includes(borrador.pantalla)
      ) {
        setPantalla(borrador.pantalla);
      }
    } catch (error) {
      console.error("Error recuperando borrador local:", error);
    }
  }

  /* =========================================================
     AUTO-GUARDADO SUPABASE
  ========================================================= */

  useEffect(() => {
    if (
      !usuario ||
      cargandoSesion ||
      !yaRecuperoRef.current
    ) {
      return;
    }

    if (PANTALLAS_PUBLICAS.includes(pantalla)) {
      return;
    }

    if (ESTADOS_ENVIADOS.includes(estadoSolicitud)) {
      return;
    }

    const timer = setTimeout(() => {
      guardarBorradorSupabase();
    }, 1400);

    return () => clearTimeout(timer);
  }, [
    datos,
    pantalla,
    consentimientos,
    usuario,
    cargandoSesion,
    pasoMaximo,
    ultimaPantallaPorPaso,
    estadoSolicitud,
  ]);

  async function guardarBorradorSupabase() {
    if (!usuario) {
      return;
    }

    try {
      const nombreSolicitud = obtenerNombreSolicitud();

      const datosSeguros = {
        ...datos,
        password: "",
      };

      const payload = {
        user_id: usuario.id,

        tipo_persona: datos.tipoPersona || null,

        nombre: nombreSolicitud || null,

        correo: datos.correo || usuario.email || null,

        celular: datos.celular || null,

        monto: numeroONull(datos.montoSolicitado),

        plazo: numeroONull(datos.plazoSolicitado),

        destino: datos.destino || null,

        /*
          AQUÍ ESTÁ UNA DE LAS CORRECCIONES IMPORTANTES:
          jamás enviamos "" a una columna numeric.
        */
        ingreso:
          datos.tipoPersona === "fisica"
            ? numeroONull(datos.ingreso)
            : numeroONull(datos.ventasMensuales),

        tipo_credito: datos.tipoCredito || null,

        tipo_garantia: datos.tipoGarantia || null,

        es_pep:
          datos.esPep === "si"
            ? true
            : datos.esPep === "no"
            ? false
            : null,

        tipo_pep:
          datos.esPep === "no"
            ? "NO_PEP"
            : datos.tipoPep || null,

        detalle_pep:
          datos.esPep === "si"
            ? datos.detallePep || null
            : null,

        declaracion_pep_aceptada: Boolean(datos.declaracionPepAceptada),
        declaracion_pep_fecha: datos.declaracionPepFecha || null,

        estado: "DRAFT",

        pantalla_actual: pantalla,

        datos_borrador: {
          datos: datosSeguros,
          consentimientos,
          pasoMaximo,
          ultimaPantallaPorPaso,
        },

        actualizado_en: new Date().toISOString(),
      };

      if (solicitudId) {
        const { error } = await supabase
          .from("Aplicaciones")
          .update(payload)
          .eq("id", solicitudId);

        if (error) {
          console.error("Error guardando borrador:", error);
        }

        return;
      }

      const {
        data: existente,
        error: errorBuscar,
      } = await supabase
        .from("Aplicaciones")
        .select("id")
        .eq("user_id", usuario.id)
        .eq("estado", "DRAFT")
        .order("actualizado_en", {
          ascending: false,
        })
        .limit(1)
        .maybeSingle();

      if (errorBuscar) {
        console.error(errorBuscar);
      }

      if (existente?.id) {
        setSolicitudId(existente.id);

        const { error } = await supabase
          .from("Aplicaciones")
          .update(payload)
          .eq("id", existente.id);

        if (error) {
          console.error(error);
        }

        return;
      }

      const { data, error } = await supabase
        .from("Aplicaciones")
        .insert([payload])
        .select("id")
        .single();

      if (error) {
        console.error("Error creando borrador:", error);
        return;
      }

      if (data?.id) {
        setSolicitudId(data.id);
      }
    } catch (error) {
      console.error(error);
    }
  }

  async function cargarDocumentos(aplicacionId) {
    if (!aplicacionId) return;

    const { data, error } = await supabase
      .from("DocumentosSolicitud")
      .select(
        "id, tipo_documento, nombre_archivo, storage_path, estado, observaciones, version, es_actual, subido_en, updated_at"
      )
      .eq("aplicacion_id", aplicacionId)
      .eq("es_actual", true);

    if (error) {
      console.error("No se pudieron recuperar los documentos:", error);
      return;
    }

    const documentosRecuperados = {};

    (data || []).forEach((documento) => {
      documentosRecuperados[documento.tipo_documento] = {
        id: documento.id,
        name: documento.nombre_archivo || documento.tipo_documento,
        storagePath: documento.storage_path,
        estado: documento.estado || "PENDING",
        observaciones: documento.observaciones || "",
        version: documento.version || 1,
        subidoEn: documento.subido_en || documento.updated_at || null,
        remoto: true,
      };
    });

    setArchivos(documentosRecuperados);
  }

  async function cargarDecisionCredito(aplicacionId) {
    if (!aplicacionId) return null;

    const { data, error } = await supabase
      .from("DecisionesCredito")
      .select(
        "decision, monto_aprobado, plazo_aprobado, tasa_anual, tasa_moratoria, comision_apertura, cat, condiciones"
      )
      .eq("aplicacion_id", aplicacionId)
      .maybeSingle();

    if (error) {
      console.error("No se pudo recuperar la decisión:", error);
      return null;
    }

    if (!data) return null;

    setDatos((prev) => ({
      ...prev,
      montoAprobado:
        data.monto_aprobado === null || data.monto_aprobado === undefined
          ? prev.montoAprobado
          : String(data.monto_aprobado),
      plazoAprobado:
        data.plazo_aprobado === null || data.plazo_aprobado === undefined
          ? prev.plazoAprobado
          : String(data.plazo_aprobado),
      tasaAprobada:
        data.tasa_anual === null || data.tasa_anual === undefined
          ? prev.tasaAprobada
          : String(data.tasa_anual),
      tasaMoratoriaAprobada:
        data.tasa_moratoria === null || data.tasa_moratoria === undefined
          ? String(
              Number(
                (Number(data.tasa_anual ?? prev.tasaAprobada ?? 0) * 1.5).toFixed(2)
              )
            )
          : String(data.tasa_moratoria),
      comisionAprobada:
        data.comision_apertura === null || data.comision_apertura === undefined
          ? prev.comisionAprobada
          : String(data.comision_apertura),
      catAprobado:
        data.cat === null || data.cat === undefined
          ? prev.catAprobado
          : String(data.cat),
    }));

    return data;
  }

  /* =========================================================
     RECUPERAR SOLICITUD
  ========================================================= */

  async function recuperarSolicitud(userId) {
    try {
      const { data, error } = await supabase
        .from("Aplicaciones")
        .select(
          `
          id,
          folio,
          estado,
          pantalla_actual,
          datos_borrador,
          es_pep,
          tipo_pep,
          detalle_pep,
          declaracion_pep_aceptada,
          declaracion_pep_fecha,
          actualizado_en
        `
        )
        .eq("user_id", userId)
        .in("estado", [
          "DRAFT",
          "SUBMITTED",
          "IN_REVIEW",
          "APPROVED",
          "SIGNED",
          "DISBURSED",
        ])
        .order("actualizado_en", {
          ascending: false,
        })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error(error);
        recuperarLocal();
        return false;
      }

      if (!data) {
        recuperarLocal();
        return false;
      }

      setSolicitudId(data.id);
      setEstadoSolicitud(data.estado || "DRAFT");

      await cargarDocumentos(data.id);

      if (data.folio) {
        setFolio(data.folio);
      }

      const borrador = data.datos_borrador;

      if (borrador?.datos) {
        setDatos((prev) => ({
          ...prev,
          ...borrador.datos,
          password: "",
        }));
      }

      setDatos((prev) => ({
        ...prev,
        esPep:
          data.es_pep === true
            ? "si"
            : data.es_pep === false
            ? "no"
            : prev.esPep,
        tipoPep: data.tipo_pep || prev.tipoPep,
        detallePep: data.detalle_pep || prev.detallePep,
        declaracionPepAceptada:
          data.declaracion_pep_aceptada ?? prev.declaracionPepAceptada,
        declaracionPepFecha:
          data.declaracion_pep_fecha || prev.declaracionPepFecha,
      }));

      if (borrador?.consentimientos) {
        setConsentimientos(borrador.consentimientos);
      }

      if (borrador?.pasoMaximo) {
        setPasoMaximo(borrador.pasoMaximo);
      }

      if (borrador?.ultimaPantallaPorPaso) {
        setUltimaPantallaPorPaso((prev) => ({
          ...prev,
          ...borrador.ultimaPantallaPorPaso,
        }));
      }

      if (data.estado === "DRAFT") {
        const pantallaRecuperada =
          data.pantalla_actual || "simulacion";

        const paso =
          PASO_POR_PANTALLA[pantallaRecuperada] || 1;

        setPasoMaximo((prev) => Math.max(prev, paso));

        setPantalla(pantallaRecuperada);

        return true;
      }

      if (
        data.estado === "SUBMITTED" ||
        data.estado === "IN_REVIEW"
      ) {
        setPasoMaximo((prev) => Math.max(prev, 4));
        setPantalla("enRevision");
        return true;
      }

      if (data.estado === "APPROVED") {
  setPasoMaximo((prev) => Math.max(prev, 5));
  setPantalla("oferta");
  return true;
}


/* =========================================
   CONTRATACIÓN
========================================= */

if (data.estado === "CONTRACTING") {
  setPasoMaximo(6);

  setPantalla(
    data.pantalla_actual || "contratos"
  );

  return true;
}


if (data.estado === "READY_TO_DISBURSE") {
  setPasoMaximo(6);
  setPantalla("tesoreriaCliente");

  return true;
}


if (data.estado === "SIGNED") {
  setPasoMaximo(6);
  setPantalla("tesoreriaCliente");
  return true;
}


if (data.estado === "DISBURSED") {
  setPasoMaximo(6);
  setPantalla("creditoActivo");
  return true;
}
      return true;
    } catch (error) {
      console.error(error);
      recuperarLocal();
      return false;
    }
  }

  /* =========================================================
     FORM HELPERS
  ========================================================= */

function actualizar(campo, valor) {
  setDatos((prev) => ({
    ...prev,
    [campo]: valor,
  }));

  setMensajeError("");
}


/* =========================================
   CONTRATACIÓN AUTOMÁTICA
========================================= */

async function prepararContratacion() {
  try {
    setGuardando(true);
    setMensajeError("");
    setMensajeInfo("");

    // ...TODO EL CÓDIGO QUE TE DI...
  } catch (error) {
    console.error(error);

    mostrarError(
      "Ocurrió un error al preparar la contratación."
    );

    return false;
  } finally {
    setGuardando(false);
  }
}

  function actualizarConsentimiento(campo, valor) {
    setConsentimientos((prev) => ({
      ...prev,
      [campo]: valor,
    }));

    setMensajeError("");
  }

  async function asegurarSolicitudId() {
    if (solicitudId) return solicitudId;

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      throw new Error("Necesitas iniciar sesión para subir documentos.");
    }

    const { data: existente, error: errorBuscar } = await supabase
      .from("Aplicaciones")
      .select("id")
      .eq("user_id", session.user.id)
      .eq("estado", "DRAFT")
      .order("actualizado_en", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (errorBuscar) throw errorBuscar;

    if (existente?.id) {
      setSolicitudId(existente.id);
      return existente.id;
    }

    const { data: creada, error: errorCrear } = await supabase
      .from("Aplicaciones")
      .insert([
        {
          user_id: session.user.id,
          correo: datos.correo || session.user.email || null,
          celular: datos.celular || null,
          tipo_persona: datos.tipoPersona || null,
          nombre: obtenerNombreSolicitud() || null,
          monto: numeroONull(datos.montoSolicitado),
          plazo: numeroONull(datos.plazoSolicitado),
          estado: "DRAFT",
          pantalla_actual: pantalla,
          datos_borrador: {
            datos: { ...datos, password: "" },
            consentimientos,
            pasoMaximo,
            ultimaPantallaPorPaso,
          },
          actualizado_en: new Date().toISOString(),
        },
      ])
      .select("id")
      .single();

    if (errorCrear) throw errorCrear;

    setSolicitudId(creada.id);
    return creada.id;
  }

  async function seleccionarArchivo(campo, archivo) {
    if (!archivo) return;

    setMensajeError("");
    setMensajeInfo("");

    const tiposPermitidos = ["application/pdf", "image/jpeg", "image/png"];
    const limiteBytes = 15 * 1024 * 1024;

    if (!tiposPermitidos.includes(archivo.type)) {
      mostrarError("El documento debe ser PDF, JPG o PNG.");
      return;
    }

    if (archivo.size > limiteBytes) {
      mostrarError("El documento no puede pesar más de 15 MB.");
      return;
    }

    const documentoAnterior = archivos[campo] || null;

    setArchivos((prev) => ({
      ...prev,
      [campo]: {
        ...documentoAnterior,
        name: archivo.name,
        estado: "UPLOADING",
        observaciones: "",
      },
    }));

    let documentoActualAnterior = null;
    let storagePathNuevo = null;

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        throw new Error("Necesitas iniciar sesión para subir documentos.");
      }

      const aplicacionId = await asegurarSolicitudId();

      /*
        Buscamos la última versión histórica para calcular
        el número de la siguiente versión.
      */
      const { data: ultimaVersion, error: errorVersion } = await supabase
        .from("DocumentosSolicitud")
        .select("id, version, es_actual, estado")
        .eq("aplicacion_id", aplicacionId)
        .eq("tipo_documento", campo)
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (errorVersion) throw errorVersion;

      const nuevaVersion = Number(ultimaVersion?.version || 0) + 1;
      documentoActualAnterior = ultimaVersion?.es_actual ? ultimaVersion : null;

      const extension = (archivo.name.split(".").pop() || "pdf")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");

      const nombreSeguro = archivo.name
        .replace(/\.[^/.]+$/, "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9_-]+/g, "_")
        .slice(0, 60);

      storagePathNuevo = `${session.user.id}/${aplicacionId}/${campo}/v${nuevaVersion}_${Date.now()}_${nombreSeguro}.${extension}`;

      /*
        Primero subimos el nuevo archivo. El anterior NO se elimina.
        Así conservamos historial físico en Storage.
      */
      const { error: errorStorage } = await supabase.storage
        .from(DOCUMENTOS_BUCKET)
        .upload(storagePathNuevo, archivo, {
          upsert: false,
          contentType: archivo.type,
        });

      if (errorStorage) throw errorStorage;

      /*
        La versión anterior deja de ser la actual, pero permanece
        intacta en la tabla y en Storage para auditoría.
      */
      if (documentoActualAnterior?.id) {
        const { error: errorAnterior } = await supabase
          .from("DocumentosSolicitud")
          .update({
            es_actual: false,
            updated_at: new Date().toISOString(),
          })
          .eq("id", documentoActualAnterior.id);

        if (errorAnterior) throw errorAnterior;
      }

      const { data: registro, error: errorRegistro } = await supabase
        .from("DocumentosSolicitud")
        .insert({
          aplicacion_id: aplicacionId,
          tipo_documento: campo,
          nombre_archivo: archivo.name,
          storage_path: storagePathNuevo,
          estado: "PENDING",
          observaciones: null,
          revisado_por: null,
          revisado_en: null,
          version: nuevaVersion,
          es_actual: true,
          reemplaza_documento_id: documentoActualAnterior?.id || null,
          subido_por: session.user.id,
          subido_en: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select(
          "id, tipo_documento, nombre_archivo, storage_path, estado, observaciones, version, subido_en"
        )
        .single();

      if (errorRegistro) {
        /*
          Si algo falla al crear la nueva fila, tratamos de restaurar
          la versión anterior como actual para no dejar el expediente
          sin documento vigente.
        */
        if (documentoActualAnterior?.id) {
          await supabase
            .from("DocumentosSolicitud")
            .update({ es_actual: true })
            .eq("id", documentoActualAnterior.id);
        }

        throw errorRegistro;
      }

      setArchivos((prev) => ({
        ...prev,
        [campo]: {
          id: registro.id,
          name: registro.nombre_archivo,
          storagePath: registro.storage_path,
          estado: registro.estado,
          observaciones: registro.observaciones || "",
          version: registro.version,
          subidoEn: registro.subido_en,
          remoto: true,
        },
      }));

      setMensajeInfo("Documento cargado y enviado a revisión.");
    } catch (error) {
      console.error("Error subiendo documento:", error);

      /*
        Si el archivo alcanzó a subirse a Storage pero falló el registro,
        intentamos limpiar únicamente la nueva versión fallida.
      */
      if (storagePathNuevo) {
        try {
          await supabase.storage
            .from(DOCUMENTOS_BUCKET)
            .remove([storagePathNuevo]);
        } catch (cleanupError) {
          console.error("No se pudo limpiar el archivo fallido:", cleanupError);
        }
      }

      setArchivos((prev) => {
        const copia = { ...prev };

        if (documentoAnterior) {
          copia[campo] = documentoAnterior;
        } else {
          delete copia[campo];
        }

        return copia;
      });

      mostrarError(
        error?.message || "No se pudo subir el documento. Intenta nuevamente."
      );
    }
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

  function documentoExiste(nombre) {
    const documento = archivos[nombre];

    return Boolean(
      documento &&
        documento.estado !== "UPLOADING" &&
        documento.estado !== "REJECTED"
    );
  }

  function obtenerNombreSolicitud() {
    if (datos.tipoPersona === "moral") {
      return datos.razonSocial.trim();
    }

    return `${datos.nombre} ${datos.apellidoPaterno} ${datos.apellidoMaterno}`.trim();
  }

  /* =========================================================
     VALIDACIONES
  ========================================================= */

  function validarSimulacion() {
    if (!esNumeroPositivo(datos.montoSolicitado)) {
      mostrarError("Ingresa un monto solicitado mayor a cero.");
      return;
    }

    if (!esNumeroPositivo(datos.plazoSolicitado)) {
      mostrarError("Selecciona un plazo válido.");
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

    if (usuario) {
      ir("consentimientos");
      return;
    }

    ir("registro");
  }

  function validarConsentimientos() {
    const completos = Object.values(consentimientos).every(Boolean);

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
        mostrarError("Selecciona el régimen matrimonial.");
        return;
      }

      if (
        datos.estadoCivil === "Casado" &&
        datos.regimenMatrimonial === "Sociedad conyugal" &&
        (!datos.conyugeNombre.trim() ||
          !datos.conyugeCurp.trim() ||
          !datos.conyugeRfc.trim())
      ) {
        mostrarError("Completa la información del cónyuge.");
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

    ir("pep");
  }

  async function validarPep() {
    if (datos.esPep !== "si" && datos.esPep !== "no") {
      mostrarError(
        "Selecciona si eres o puedes ser una Persona Políticamente Expuesta."
      );
      return;
    }

    if (!datos.declaracionPepAceptada) {
      mostrarError(
        "Confirma que la declaración PEP proporcionada es verdadera."
      );
      return;
    }

    if (datos.esPep === "si" && !datos.tipoPep) {
      mostrarError(
        "Selecciona el supuesto de Persona Políticamente Expuesta que corresponda."
      );
      return;
    }

    if (datos.esPep === "si" && !datos.detallePep.trim()) {
      mostrarError(
        "Describe brevemente el cargo, relación o vínculo PEP."
      );
      return;
    }

    try {
      const aplicacionId = await asegurarSolicitudId();
      const fechaDeclaracion = new Date().toISOString();
      const tipoPep = datos.esPep === "no" ? "NO_PEP" : datos.tipoPep;

      const { error } = await supabase
        .from("Aplicaciones")
        .update({
          es_pep: datos.esPep === "si",
          tipo_pep: tipoPep,
          detalle_pep:
            datos.esPep === "si" ? datos.detallePep.trim() : null,
          declaracion_pep_aceptada: true,
          declaracion_pep_fecha: fechaDeclaracion,
          actualizado_en: fechaDeclaracion,
        })
        .eq("id", aplicacionId);

      if (error) throw error;

      setDatos((prev) => ({
        ...prev,
        tipoPep,
        detallePep: prev.esPep === "si" ? prev.detallePep : "",
        declaracionPepFecha: fechaDeclaracion,
      }));

      ir("documentosIdentidad");
    } catch (error) {
      console.error("Error guardando declaración PEP:", error);
      mostrarError(
        error?.message || "No se pudo guardar la declaración PEP."
      );
    }
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

      const falta = requeridos.some(
        (nombre) => !documentoExiste(nombre)
      );

      if (falta) {
        mostrarError(
          "Carga todos los documentos obligatorios de Persona Física."
        );
        return;
      }

      if (
        datos.estadoCivil === "Casado" &&
        datos.regimenMatrimonial === "Sociedad conyugal" &&
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
        requeridos.some((nombre) => !documentoExiste(nombre))
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
      mostrarError("Completa todos los datos del domicilio.");
      return;
    }

    if (!/^\d{5}$/.test(datos.cp)) {
      mostrarError("El código postal debe contener 5 dígitos.");
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
        !esNumeroPositivo(datos.ingreso)
      ) {
        mostrarError(
          "Completa la información de actividad e ingresos."
        );
        return;
      }
    }

    if (
      datos.tipoPersona === "moral" &&
      !esNumeroPositivo(datos.ventasMensuales)
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
      !esNumeroPositivo(datos.montoSolicitado) ||
      !esNumeroPositivo(datos.plazoSolicitado) ||
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
      mostrarError("Selecciona el tipo de garantía.");
      return;
    }

    if (datos.tipoGarantia === "Obligado solidario") {
      ir("obligado");
      return;
    }

    if (
      !datos.descripcionGarantia.trim() ||
      !esNumeroPositivo(datos.valorGarantia)
    ) {
      mostrarError(
        "Completa la descripción y valor de la garantía."
      );
      return;
    }

    if (!documentoExiste("garantiaDocumentacion")) {
      mostrarError(
        "Carga la documentación de la garantía."
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

  /* =========================================================
     CUENTA
  ========================================================= */

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
      mostrarError("Ingresa un correo electrónico válido.");
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

        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) {
        console.error(error);

        mostrarError(
          error.message ||
            "No pudimos crear la cuenta. Si ya existe, inicia sesión."
        );
        return;
      }

      if (data?.session) {
        setUsuario(data.session.user);

        ir("consentimientos");
        return;
      }

      setMensajeInfo(
        "Te enviamos un correo para confirmar tu cuenta."
      );

      ir("confirmarCorreo");
    } catch (error) {
      console.error(error);
      mostrarError("No pudimos crear la cuenta.");
    }
  }

  async function cerrarSesion() {
    await supabase.auth.signOut();

    setUsuario(null);
    setSolicitudId(null);
    setFolio("");
    setEstadoSolicitud("DRAFT");

    setDatos((prev) => ({
      ...prev,
      correo: "",
      password: "",
    }));

    localStorage.removeItem("trisal_solicitud_borrador");

    ir("inicio");
  }

  /* =========================================================
     ENVIAR SOLICITUD
  ========================================================= */

  async function guardarSolicitudSupabase() {
    setMensajeError("");
    setGuardando(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setGuardando(false);

        mostrarError(
          "Necesitas iniciar sesión para enviar tu solicitud."
        );

        ir("loginCliente");
        return;
      }

      if (
        !esNumeroPositivo(datos.montoSolicitado) ||
        !esNumeroPositivo(datos.plazoSolicitado)
      ) {
        setGuardando(false);

        mostrarError(
          "Monto y plazo deben contener valores válidos."
        );
        return;
      }

      const nuevoFolio =
        folio ||
        `TRI-${Math.floor(
          100000 + Math.random() * 900000
        )}`;

      const datosSeguros = {
        ...datos,
        password: "",
      };

      /*
        IMPORTANTE:
        No usamos "" para ningún campo numérico.
        Obligatorios -> número real.
        Opcionales -> número o null.
      */

      const payloadFinal = {
        user_id: session.user.id,

        folio: nuevoFolio,

        tipo_persona: datos.tipoPersona || null,

        nombre: obtenerNombreSolicitud() || null,

        correo: datos.correo || session.user.email || null,

        celular: datos.celular || null,

        monto: numeroObligatorio(datos.montoSolicitado),

        plazo: numeroObligatorio(datos.plazoSolicitado),

        destino: datos.destino || null,

        ingreso:
          datos.tipoPersona === "fisica"
            ? numeroONull(datos.ingreso)
            : numeroONull(datos.ventasMensuales),

        tipo_credito: datos.tipoCredito || null,

        tipo_garantia: datos.tipoGarantia || null,

        es_pep:
          datos.esPep === "si"
            ? true
            : datos.esPep === "no"
            ? false
            : null,

        tipo_pep:
          datos.esPep === "no"
            ? "NO_PEP"
            : datos.tipoPep || null,

        detalle_pep:
          datos.esPep === "si"
            ? datos.detallePep || null
            : null,

        declaracion_pep_aceptada: Boolean(datos.declaracionPepAceptada),
        declaracion_pep_fecha: datos.declaracionPepFecha || null,

        estado: "SUBMITTED",

        pantalla_actual: "enRevision",

        datos_borrador: {
          datos: datosSeguros,
          consentimientos,

          pasoMaximo: Math.max(pasoMaximo, 4),

          ultimaPantallaPorPaso: {
            ...ultimaPantallaPorPaso,
            4: "enRevision",
          },
        },

        actualizado_en: new Date().toISOString(),
      };

      if (solicitudId) {
        const { error } = await supabase
          .from("Aplicaciones")
          .update(payloadFinal)
          .eq("id", solicitudId);

        if (error) {
          console.error(error);

          setGuardando(false);

          mostrarError(
            `No se pudo enviar la solicitud: ${error.message}`
          );

          return;
        }
      } else {
        const { data, error } = await supabase
          .from("Aplicaciones")
          .insert([payloadFinal])
          .select("id")
          .single();

        if (error) {
          console.error(error);

          setGuardando(false);

          mostrarError(
            `No se pudo enviar la solicitud: ${error.message}`
          );

          return;
        }

        if (data?.id) {
          setSolicitudId(data.id);
        }
      }

      setFolio(nuevoFolio);

      setEstadoSolicitud("SUBMITTED");

      setPasoMaximo((prev) => Math.max(prev, 4));

      setUltimaPantallaPorPaso((prev) => ({
        ...prev,
        4: "enRevision",
      }));

      localStorage.removeItem("trisal_solicitud_borrador");

      setGuardando(false);

      ir("enRevision");
    } catch (error) {
      console.error(error);

      setGuardando(false);

      mostrarError(
        "Ocurrió un error al enviar la solicitud."
      );
    }
  }

  /* =========================================================
     OFERTA DEMO
  ========================================================= */

  const pagoOferta = useMemo(() => {
    return calcularPago(
      numeroObligatorio(datos.montoAprobado),
      numeroObligatorio(datos.tasaAprobada),
      numeroObligatorio(datos.plazoAprobado)
    );
  }, [
    datos.montoAprobado,
    datos.tasaAprobada,
    datos.plazoAprobado,
  ]);

  if (cargandoSesion) {
    return (
      <div className="app">
        <style>{css}</style>

        <div className="loadingScreen">
          <strong>TRISAL</strong>
          <span>Cargando tu información...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <style>{css}</style>

      <Header
        ir={ir}
        usuario={usuario}
        cerrarSesion={cerrarSesion}
        menuMovil={menuMovil}
        setMenuMovil={setMenuMovil}
        legalAbierto={legalAbierto}
        setLegalAbierto={setLegalAbierto}
      />

      <main className="container">
        {mensajeError && (
          <div className="globalError">
            <strong>Revisa la información</strong>
            <span>{mensajeError}</span>
          </div>
        )}

        {mensajeInfo && (
          <div className="globalInfo">{mensajeInfo}</div>
        )}

        {pantalla === "inicio" && (
          <Inicio
            ir={ir}
            producto={producto}
            usuario={usuario}
          />
        )}

        {pantalla === "producto" && (
          <Producto producto={producto} ir={ir} />
        )}

        {pantalla === "comoFunciona" && (
          <ComoFunciona ir={ir} />
        )}

        {pantalla === "simulacion" && (
          <Simulacion
            datos={datos}
            actualizar={actualizar}
            continuar={validarSimulacion}
            trackerProps={{
              pasoActual: 1,
              pasoMaximo,
              navegarPorTracker,
              estadoSolicitud,
            }}
          />
        )}

        {pantalla === "tipoPersona" && (
          <TipoPersona
            datos={datos}
            actualizar={actualizar}
            continuar={validarTipoPersona}
            regresar={() => regresarA("simulacion")}
            trackerProps={{
              pasoActual: 2,
              pasoMaximo,
              navegarPorTracker,
              estadoSolicitud,
            }}
          />
        )}

        {pantalla === "registro" && (
          <Registro
            datos={datos}
            actualizar={actualizar}
            crearCuenta={crearCuenta}
            ir={ir}
            regresar={() => regresarA("tipoPersona")}
            trackerProps={{
              pasoActual: 2,
              pasoMaximo,
              navegarPorTracker,
              estadoSolicitud,
            }}
          />
        )}

        {pantalla === "loginCliente" && (
          <LoginCliente
            ir={ir}
            recuperarSolicitud={recuperarSolicitud}
          />
        )}

        {pantalla === "confirmarCorreo" && (
          <ConfirmarCorreo
            datos={datos}
            ir={ir}
            recuperarSolicitud={recuperarSolicitud}
          />
        )}

        {pantalla === "consentimientos" && (
          <Consentimientos
            consentimientos={consentimientos}
            actualizar={actualizarConsentimiento}
            continuar={validarConsentimientos}
            regresar={() =>
              usuario
                ? regresarA("tipoPersona")
                : regresarA("registro")
            }
            trackerProps={{
              pasoActual: 2,
              pasoMaximo,
              navegarPorTracker,
              estadoSolicitud,
            }}
          />
        )}

        {pantalla === "datosSolicitante" && (
          <DatosSolicitante
            datos={datos}
            actualizar={actualizar}
            continuar={validarDatosSolicitante}
            regresar={() => regresarA("consentimientos")}
            trackerProps={{
              pasoActual: 2,
              pasoMaximo,
              navegarPorTracker,
              estadoSolicitud,
            }}
          />
        )}

        {pantalla === "pep" && (
          <DeclaracionPep
            datos={datos}
            actualizar={actualizar}
            continuar={validarPep}
            regresar={() => regresarA("datosSolicitante")}
            trackerProps={{
              pasoActual: 2,
              pasoMaximo,
              navegarPorTracker,
              estadoSolicitud,
            }}
          />
        )}

        {pantalla === "documentosIdentidad" && (
          <DocumentosIdentidad
            datos={datos}
            archivos={archivos}
            seleccionarArchivo={seleccionarArchivo}
            continuar={validarDocumentosIdentidad}
            regresar={() => regresarA("pep")}
            trackerProps={{
              pasoActual: 2,
              pasoMaximo,
              navegarPorTracker,
              estadoSolicitud,
            }}
          />
        )}

        {pantalla === "domicilio" && (
          <Domicilio
            datos={datos}
            actualizar={actualizar}
            continuar={validarDomicilio}
            regresar={() => regresarA("documentosIdentidad")}
            trackerProps={{
              pasoActual: 2,
              pasoMaximo,
              navegarPorTracker,
              estadoSolicitud,
            }}
          />
        )}

        {pantalla === "ingresos" && (
          <Ingresos
            datos={datos}
            actualizar={actualizar}
            continuar={validarIngresos}
            regresar={() => regresarA("domicilio")}
            trackerProps={{
              pasoActual: 2,
              pasoMaximo,
              navegarPorTracker,
              estadoSolicitud,
            }}
          />
        )}

        {pantalla === "documentosFinancieros" && (
          <DocumentosFinancieros
            datos={datos}
            archivos={archivos}
            seleccionarArchivo={seleccionarArchivo}
            continuar={validarDocumentosFinancieros}
            regresar={() => regresarA("ingresos")}
            trackerProps={{
              pasoActual: 2,
              pasoMaximo,
              navegarPorTracker,
              estadoSolicitud,
            }}
          />
        )}

        {pantalla === "solicitud" && (
          <Solicitud
            datos={datos}
            actualizar={actualizar}
            continuar={validarSolicitud}
            regresar={() =>
              regresarA("documentosFinancieros")
            }
            trackerProps={{
              pasoActual: 2,
              pasoMaximo,
              navegarPorTracker,
              estadoSolicitud,
            }}
          />
        )}

        {pantalla === "tipoCredito" && (
          <TipoCredito
            datos={datos}
            actualizar={actualizar}
            continuar={validarTipoCredito}
            regresar={() => regresarA("solicitud")}
            trackerProps={{
              pasoActual: 3,
              pasoMaximo,
              navegarPorTracker,
              estadoSolicitud,
            }}
          />
        )}

        {pantalla === "garantia" && (
          <Garantia
            datos={datos}
            actualizar={actualizar}
            archivos={archivos}
            seleccionarArchivo={seleccionarArchivo}
            continuar={validarGarantia}
            regresar={() => regresarA("tipoCredito")}
            trackerProps={{
              pasoActual: 3,
              pasoMaximo,
              navegarPorTracker,
              estadoSolicitud,
            }}
          />
        )}

        {pantalla === "obligado" && (
          <Obligado
            datos={datos}
            actualizar={actualizar}
            continuar={validarObligado}
            regresar={() => regresarA("garantia")}
            trackerProps={{
              pasoActual: 3,
              pasoMaximo,
              navegarPorTracker,
              estadoSolicitud,
            }}
          />
        )}

        {pantalla === "garantiaStatus" && (
          <GarantiaStatus
            datos={datos}
            ir={ir}
            regresar={() =>
              datos.tipoGarantia === "Obligado solidario"
                ? regresarA("obligado")
                : regresarA("garantia")
            }
            trackerProps={{
              pasoActual: 3,
              pasoMaximo,
              navegarPorTracker,
              estadoSolicitud,
            }}
          />
        )}

        {pantalla === "revision" && (
          <Revision
            datos={datos}
            guardar={guardarSolicitudSupabase}
            guardando={guardando}
            regresar={() => regresarA("tipoCredito")}
            trackerProps={{
              pasoActual: 4,
              pasoMaximo,
              navegarPorTracker,
              estadoSolicitud,
            }}
          />
        )}

        {pantalla === "enRevision" && (
          <EnRevision
            datos={datos}
            folio={folio}
            ir={ir}
            trackerProps={{
              pasoActual: 4,
              pasoMaximo,
              navegarPorTracker,
              estadoSolicitud,
            }}
          />
        )}

        {pantalla === "oferta" && (
          <Oferta
            datos={datos}
            pagoOferta={pagoOferta}
            ir={ir}
            trackerProps={{
              pasoActual: 5,
              pasoMaximo,
              navegarPorTracker,
              estadoSolicitud,
            }}
          />
        )}

        {pantalla === "cuentaBanco" && (
          <CuentaBanco
  datos={datos}
  actualizar={actualizar}
  continuar={
    prepararContratacion
  }
  guardando={
    guardando
  }
  regresar={() =>
    regresarA("oferta")
  }
  trackerProps={{
    pasoActual: 6,
    pasoMaximo,
    navegarPorTracker,
    estadoSolicitud,
  }}
/>
        )}

        {pantalla === "contratos" && (
          <Contratos
            ir={ir}
            regresar={() => regresarA("cuentaBanco")}
            trackerProps={{
              pasoActual: 6,
              pasoMaximo,
              navegarPorTracker,
              estadoSolicitud,
            }}
          />
        )}

        {pantalla === "firma" && (
          <Firma
            ir={ir}
            regresar={() => regresarA("contratos")}
            trackerProps={{
              pasoActual: 6,
              pasoMaximo,
              navegarPorTracker,
              estadoSolicitud,
            }}
          />
        )}

        {pantalla === "tesoreriaCliente" && (
          <TesoreriaCliente
            ir={ir}
            trackerProps={{
              pasoActual: 6,
              pasoMaximo,
              navegarPorTracker,
              estadoSolicitud,
            }}
          />
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
          <Normatividad empresa={empresa} />
        )}

        {pantalla === "buro" && <Buro />}

        {pantalla === "privacidad" && (
          <Privacidad empresa={empresa} />
        )}
      </main>

      <Footer empresa={empresa} ir={ir} />
    </div>
  );
}

/* =========================================================
   HEADER
========================================================= */

function Header({
  ir,
  usuario,
  cerrarSesion,
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
        onClick={() => setMenuMovil(!menuMovil)}
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
          onClick={() => ir("comoFunciona")}
        >
          Cómo funciona
        </button>

        <div className="legalDropdown">
          <button
            className="navButton"
            onClick={() => setLegalAbierto(!legalAbierto)}
          >
            Información legal
          </button>

          {legalAbierto && (
            <div className="legalMenu">
              <button onClick={() => ir("une")}>
                UNE
              </button>

              <button onClick={() => ir("normatividad")}>
                Normatividad
              </button>

              <button onClick={() => ir("buro")}>
                Buró de Entidades Financieras
              </button>

              <button onClick={() => ir("privacidad")}>
                Aviso de privacidad
              </button>
            </div>
          )}
        </div>

        {usuario ? (
          <>
            <button
              className="navButton"
              onClick={() => ir("simulacion")}
            >
              Mi solicitud
            </button>

            <button
              className="logoutButton"
              onClick={cerrarSesion}
            >
              Cerrar sesión
            </button>
          </>
        ) : (
          <>
            <button
              className="navButton"
              onClick={() => ir("loginCliente")}
            >
              Iniciar sesión
            </button>

            <button
              className="navCta"
              onClick={() => ir("simulacion")}
            >
              Solicita tu crédito
            </button>
          </>
        )}
      </nav>
    </header>
  );
}

/* =========================================================
   INICIO
========================================================= */

function Inicio({ ir, producto, usuario }) {
  return (
    <section className="hero fadeUp">
      <div className="heroContent">
        <p className="eyebrow">
          CRÉDITO DIGITAL TRISAL
        </p>

        <h1>
          Financiamiento sencillo para seguir creciendo.
        </h1>

        <p className="heroText">
          Inicia tu solicitud, completa tu expediente digital
          y conoce el avance de tu crédito en todo momento.
        </p>

        <div className="buttonRow">
          <button
            className="primary"
            onClick={() => ir("simulacion")}
          >
            {usuario
              ? "Continuar mi solicitud"
              : "Solicita tu crédito"}
          </button>

          <button
            className="secondary"
            onClick={() => ir("comoFunciona")}
          >
            Ver cómo funciona
          </button>
        </div>

        <button
          className="textLinkButton"
          onClick={() => ir("producto")}
        >
          Conocer características del producto →
        </button>
      </div>

      <div className="heroCard">
        <p className="cardEyebrow">PROCESO</p>

        <h2>
          Una solicitud clara y sencilla.
        </h2>

        <MiniStep numero="1" texto="Elige monto y plazo" />
        <MiniStep numero="2" texto="Completa tu expediente" />
        <MiniStep numero="3" texto="Analizamos tu solicitud" />
        <MiniStep numero="4" texto="Recibe tu oferta" />
        <MiniStep numero="5" texto="Firma y recibe" />

        <div className="heroProductTag">
          {producto.nombre}
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   PRODUCTO
========================================================= */

function Producto({ producto, ir }) {
  const tasaMaxima =
    producto.tasaMaxima === null
      ? "Pendiente de configurar"
      : `${Number(producto.tasaMaxima).toFixed(1)}%`;

  const catPromedio =
    producto.catPromedio === null
      ? "Pendiente de cálculo"
      : `${Number(producto.catPromedio).toFixed(1)}% Sin IVA`;

  return (
    <Pagina
      titulo="Crédito Simple TRISAL"
      subtitulo="Conoce las características generales del producto antes de iniciar tu solicitud."
    >
      <section className="productHero">
        <div className="productHeroText">
          <p className="productKicker">CRÉDITO SIMPLE</p>

          <h2>
            Financiamiento para necesidades productivas y de liquidez.
          </h2>

          <p>{producto.mercadoObjetivo}</p>
        </div>

        <div className="productHeroAction">
          <button
            className="goldButton"
            onClick={() => ir("simulacion")}
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
          valor={moneda(producto.montoMinimo)}
        />

        <ProductData
          titulo="Monto máximo"
          valor={
            producto.montoMaximo
              ? moneda(producto.montoMaximo)
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

          <strong>{catPromedio}</strong>
        </div>

        <div className="catMeta">
          <span>Fecha de cálculo</span>

          <strong>
            {producto.fechaCalculoCat || "Pendiente"}
          </strong>
        </div>

        <p>{producto.metodologiaCat}</p>
      </div>

      <div className="requirementsGrid">
        <div className="card">
          <p className="cardEyebrow">PERSONA FÍSICA</p>

          <h2>Requisitos principales</h2>

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
          <p className="cardEyebrow">PERSONA MORAL</p>

          <h2>Requisitos principales</h2>

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
    </Pagina>
  );
}

/* =========================================================
   CÓMO FUNCIONA
========================================================= */

function ComoFunciona({ ir }) {
  const pasos = [
    {
      titulo: "Simula",
      texto: "Elige cuánto necesitas y el plazo que prefieres.",
    },
    {
      titulo: "Completa tu solicitud",
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
        {pasos.map((paso, index) => (
          <div
            className="simpleFlowCard"
            key={paso.titulo}
          >
            <div className="stepCircle">{index + 1}</div>

            <h3>{paso.titulo}</h3>

            <p>{paso.texto}</p>
          </div>
        ))}
      </div>

      <div className="bottomAction">
        <button
          className="primary"
          onClick={() => ir("simulacion")}
        >
          Comenzar solicitud
        </button>
      </div>
    </Pagina>
  );
}

/* =========================================================
   SIMULACIÓN
========================================================= */

function Simulacion({
  datos,
  actualizar,
  continuar,
  trackerProps,
}) {
  const simulacionCompleta =
    Number(datos.montoSolicitado) > 0 &&
    Boolean(datos.plazoSolicitado);

  return (
    <Pagina
      titulo="¿Cuánto necesitas?"
      subtitulo="Elige monto y plazo. Las condiciones financieras se determinarán después del análisis."
    >
      <Tracker {...trackerProps} />

      <div className="card formCard">
        <Campo
          label="Monto solicitado *"
          type="number"
          value={datos.montoSolicitado}
          onChange={(valor) =>
            actualizar("montoSolicitado", valor)
          }
        />

        <label className="label">
          Plazo solicitado *
        </label>

        <div className="optionRow">
          {["3", "6", "9", "12"].map((mes) => (
            <button
              key={mes}
              type="button"
              className={
                datos.plazoSolicitado === mes
                  ? "optionButton selectedOption"
                  : "optionButton"
              }
              onClick={() =>
                actualizar("plazoSolicitado", mes)
              }
            >
              {mes} meses
            </button>
          ))}
        </div>

        <div className="notice">
          La tasa, CAT, comisión y pago definitivo no se
          muestran en esta etapa. Las condiciones dependerán
          del análisis de crédito.
        </div>

        <div className="formAction">
          <button
            className="primary"
            onClick={continuar}
            disabled={!simulacionCompleta}
          >
            Continuar
          </button>
        </div>
      </div>
    </Pagina>
  );
}

/* =========================================================
   PERSONA
========================================================= */

function TipoPersona({
  datos,
  actualizar,
  continuar,
  regresar,
  trackerProps,
}) {
  return (
    <Pagina
      titulo="¿Quién solicita el crédito?"
      subtitulo="Selecciona una opción para mostrar únicamente la información y documentos que corresponden."
    >
      <Tracker {...trackerProps} />

      <div className="choiceGrid">
        <button
          className={
            datos.tipoPersona === "fisica"
              ? "bigChoice chosen"
              : "bigChoice"
          }
          onClick={() =>
            actualizar("tipoPersona", "fisica")
          }
        >
          <span className="choiceIcon">PF</span>

          <h2>Persona Física</h2>

          <p>
            Crédito solicitado a nombre propio.
          </p>
        </button>

        <button
          className={
            datos.tipoPersona === "moral"
              ? "bigChoice chosen"
              : "bigChoice"
          }
          onClick={() =>
            actualizar("tipoPersona", "moral")
          }
        >
          <span className="choiceIcon">PM</span>

          <h2>Persona Moral</h2>

          <p>
            Crédito solicitado por una empresa o sociedad.
          </p>
        </button>
      </div>

      <NavButtons
        atras={regresar}
        continuar={continuar}
      />
    </Pagina>
  );
}

/* =========================================================
   REGISTRO / LOGIN
========================================================= */

function Registro({
  datos,
  actualizar,
  crearCuenta,
  ir,
  regresar,
  trackerProps,
}) {
  return (
    <Pagina
      titulo="Crea tu cuenta"
      subtitulo="Tu cuenta nos permitirá guardar el avance de tu solicitud."
    >
      <Tracker {...trackerProps} />

      <div className="card formCard">
        <Campo
          label="Celular *"
          value={datos.celular}
          onChange={(v) => actualizar("celular", v)}
        />

        <Campo
          label="Correo electrónico *"
          type="email"
          value={datos.correo}
          onChange={(v) => actualizar("correo", v)}
        />

        <Campo
          label="Contraseña *"
          type="password"
          value={datos.password}
          onChange={(v) => actualizar("password", v)}
        />

        <NavButtons
          atras={regresar}
          continuar={crearCuenta}
          textoContinuar="Crear cuenta"
        />

        <div className="loginPrompt">
          <span>¿Ya tienes cuenta?</span>

          <button
            className="linkButton"
            onClick={() => ir("loginCliente")}
          >
            Iniciar sesión
          </button>
        </div>
      </div>
    </Pagina>
  );
}

function LoginCliente({
  ir,
  recuperarSolicitud,
}) {
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [errorLogin, setErrorLogin] = useState("");
  const [cargando, setCargando] = useState(false);

  async function login() {
    setErrorLogin("");
    setCargando(true);

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email: correo,
        password,
      });

    if (error) {
      setErrorLogin(
        "Correo o contraseña incorrectos, o el correo todavía no ha sido confirmado."
      );

      setCargando(false);
      return;
    }

    if (data?.user) {
      const recuperada =
        await recuperarSolicitud(data.user.id);

      if (!recuperada) {
        ir("simulacion");
      }
    }

    setCargando(false);
  }

  return (
    <Pagina
      titulo="Bienvenido de nuevo"
      subtitulo="Inicia sesión para continuar con tu solicitud."
    >
      <div className="card formCard">
        <Campo
          label="Correo"
          type="email"
          value={correo}
          onChange={setCorreo}
        />

        <Campo
          label="Contraseña"
          type="password"
          value={password}
          onChange={setPassword}
        />

        {errorLogin && (
          <div className="globalError">
            {errorLogin}
          </div>
        )}

        <button
          className="primary"
          disabled={cargando}
          onClick={login}
        >
          {cargando ? "Ingresando..." : "Iniciar sesión"}
        </button>

        <div className="loginPrompt">
          <span>¿No tienes cuenta?</span>

          <button
            className="linkButton"
            onClick={() => ir("simulacion")}
          >
            Iniciar solicitud
          </button>
        </div>
      </div>
    </Pagina>
  );
}

function ConfirmarCorreo({
  datos,
  ir,
  recuperarSolicitud,
}) {
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  async function verificar() {
    setCargando(true);
    setMensaje("");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        await recuperarSolicitud(session.user.id);

        ir("consentimientos");

        setCargando(false);
        return;
      }

      const { data, error } =
        await supabase.auth.signInWithPassword({
          email: datos.correo,
          password: datos.password,
        });

      if (error) {
        setMensaje(
          "No pudimos iniciar sesión todavía. Confirma el correo y vuelve a intentarlo."
        );

        setCargando(false);
        return;
      }

      if (data?.user) {
        await recuperarSolicitud(data.user.id);

        ir("consentimientos");
      }
    } catch (error) {
      console.error(error);

      setMensaje(
        "No pudimos verificar tu sesión."
      );
    }

    setCargando(false);
  }

  return (
    <Pagina
      titulo="Confirma tu correo"
      subtitulo={`Enviamos un mensaje a ${
        datos.correo || "tu correo"
      }.`}
    >
      <div className="card formCard">
        <div className="notice">
          <strong>Sigue estos pasos:</strong>

          <p>1. Abre el correo de confirmación.</p>
          <p>2. Haz clic en confirmar.</p>
          <p>3. Regresa a esta página.</p>
          <p>4. Presiona el botón de abajo.</p>
        </div>

        {mensaje && (
          <div className="globalError">{mensaje}</div>
        )}

        <button
          className="primary"
          disabled={cargando}
          onClick={verificar}
        >
          {cargando
            ? "Verificando..."
            : "Ya confirmé mi correo"}
        </button>

        <button
          className="linkButton blockLink"
          onClick={() => ir("loginCliente")}
        >
          Iniciar sesión
        </button>
      </div>
    </Pagina>
  );
}

/* =========================================================
   AUTORIZACIONES
========================================================= */

function Consentimientos({
  consentimientos,
  actualizar,
  continuar,
  regresar,
  trackerProps,
}) {
  return (
    <Pagina
      titulo="Autorizaciones"
      subtitulo="Necesitamos estas autorizaciones para continuar con la evaluación."
    >
      <Tracker {...trackerProps} />

      <div className="card">
        <CheckControl
          texto="He leído y acepto el Aviso de Privacidad. *"
          checked={consentimientos.privacidad}
          onChange={(v) =>
            actualizar("privacidad", v)
          }
        />

        <CheckControl
          texto="Autorizo la consulta de información crediticia. *"
          checked={consentimientos.buro}
          onChange={(v) =>
            actualizar("buro", v)
          }
        />

        <CheckControl
          texto="Autorizo el tratamiento de mi información para evaluar la solicitud. *"
          checked={consentimientos.tratamiento}
          onChange={(v) =>
            actualizar("tratamiento", v)
          }
        />

        <CheckControl
          texto="Autorizo las validaciones de identidad y geolocalización que correspondan. *"
          checked={consentimientos.identidad}
          onChange={(v) =>
            actualizar("identidad", v)
          }
        />

        <NavButtons
          atras={regresar}
          continuar={continuar}
        />
      </div>
    </Pagina>
  );
}

/* =========================================================
   DATOS SOLICITANTE
========================================================= */

function DatosSolicitante({
  datos,
  actualizar,
  continuar,
  regresar,
  trackerProps,
}) {
  if (datos.tipoPersona === "moral") {
    return (
      <Pagina
        titulo="Datos de la empresa"
        subtitulo="Completa la información de la Persona Moral, representante legal y propietario real."
      >
        <Tracker {...trackerProps} />

        <div className="card">
          <SectionDivider titulo="Empresa" />

          <div className="grid2">
            <Campo
              label="Razón social *"
              value={datos.razonSocial}
              onChange={(v) =>
                actualizar("razonSocial", v)
              }
            />

            <Campo
              label="RFC *"
              value={datos.rfcEmpresa}
              onChange={(v) =>
                actualizar("rfcEmpresa", v)
              }
            />

            <Campo
              label="Fecha de constitución *"
              type="date"
              value={datos.fechaConstitucion}
              onChange={(v) =>
                actualizar("fechaConstitucion", v)
              }
            />

            <Campo
              label="Actividad económica *"
              value={datos.actividadEconomica}
              onChange={(v) =>
                actualizar("actividadEconomica", v)
              }
            />

            <Campo
              label="Giro / objeto social"
              value={datos.giroMercantil}
              onChange={(v) =>
                actualizar("giroMercantil", v)
              }
            />

            <Campo
              label="Nacionalidad"
              value={datos.nacionalidadEmpresa}
              onChange={(v) =>
                actualizar("nacionalidadEmpresa", v)
              }
            />
          </div>

          <SectionDivider titulo="Representante legal" />

          <div className="grid2">
            <Campo
              label="Nombre completo *"
              value={datos.representanteLegal}
              onChange={(v) =>
                actualizar("representanteLegal", v)
              }
            />

            <Campo
              label="RFC"
              value={datos.rfcRepresentante}
              onChange={(v) =>
                actualizar("rfcRepresentante", v)
              }
            />

            <Campo
              label="CURP"
              value={datos.curpRepresentante}
              onChange={(v) =>
                actualizar("curpRepresentante", v)
              }
            />
          </div>

          <SectionDivider
            titulo="Propietario real / beneficiario controlador"
          />

          <div className="grid2">
            <Campo
              label="Nombre *"
              value={datos.propietarioReal}
              onChange={(v) =>
                actualizar("propietarioReal", v)
              }
            />

            <Campo
              label="RFC"
              value={datos.rfcPropietarioReal}
              onChange={(v) =>
                actualizar("rfcPropietarioReal", v)
              }
            />
          </div>

          <NavButtons
            atras={regresar}
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
      <Tracker {...trackerProps} />

      <div className="card">
        <SectionDivider titulo="Datos personales" />

        <div className="grid2">
          <Campo
            label="Nombre *"
            value={datos.nombre}
            onChange={(v) => actualizar("nombre", v)}
          />

          <Campo
            label="Apellido paterno *"
            value={datos.apellidoPaterno}
            onChange={(v) =>
              actualizar("apellidoPaterno", v)
            }
          />

          <Campo
            label="Apellido materno"
            value={datos.apellidoMaterno}
            onChange={(v) =>
              actualizar("apellidoMaterno", v)
            }
          />

          <Campo
            label="CURP *"
            value={datos.curp}
            onChange={(v) => actualizar("curp", v)}
          />

          <Campo
            label="RFC *"
            value={datos.rfc}
            onChange={(v) => actualizar("rfc", v)}
          />

          <Campo
            label="Fecha de nacimiento *"
            type="date"
            value={datos.nacimiento}
            onChange={(v) =>
              actualizar("nacimiento", v)
            }
          />

          <Select
            label="Estado civil *"
            value={datos.estadoCivil}
            onChange={(v) =>
              actualizar("estadoCivil", v)
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
            value={datos.dependientes}
            onChange={(v) =>
              actualizar("dependientes", v)
            }
          />
        </div>

        {datos.estadoCivil === "Casado" && (
          <>
            <SectionDivider titulo="Información matrimonial" />

            <Select
              label="Régimen matrimonial *"
              value={datos.regimenMatrimonial}
              onChange={(v) =>
                actualizar("regimenMatrimonial", v)
              }
              opciones={[
                "",
                "Separación de bienes",
                "Sociedad conyugal",
              ]}
            />
          </>
        )}

        {datos.estadoCivil === "Casado" &&
          datos.regimenMatrimonial === "Sociedad conyugal" && (
            <>
              <div className="importantNotice">
                Necesitamos información adicional del cónyuge
                por tratarse de sociedad conyugal.
              </div>

              <div className="grid2">
                <Campo
                  label="Nombre del cónyuge *"
                  value={datos.conyugeNombre}
                  onChange={(v) =>
                    actualizar("conyugeNombre", v)
                  }
                />

                <Campo
                  label="CURP *"
                  value={datos.conyugeCurp}
                  onChange={(v) =>
                    actualizar("conyugeCurp", v)
                  }
                />

                <Campo
                  label="RFC *"
                  value={datos.conyugeRfc}
                  onChange={(v) =>
                    actualizar("conyugeRfc", v)
                  }
                />
              </div>
            </>
          )}

        <NavButtons
          atras={regresar}
          continuar={continuar}
        />
      </div>
    </Pagina>
  );
}

/* =========================================================
   DECLARACIÓN PEP
========================================================= */

function DeclaracionPep({
  datos,
  actualizar,
  continuar,
  regresar,
  trackerProps,
}) {
  const esMoral = datos.tipoPersona === "moral";

  function seleccionarRespuesta(valor) {
    actualizar("esPep", valor);

    if (valor === "no") {
      actualizar("tipoPep", "NO_PEP");
      actualizar("detallePep", "");
    } else if (datos.tipoPep === "NO_PEP") {
      actualizar("tipoPep", "");
    }
  }

  return (
    <Pagina
      titulo="Declaración PEP"
      subtitulo={
        esMoral
          ? "Necesitamos conocer si el representante legal o propietario real se encuentra en un supuesto de Persona Políticamente Expuesta."
          : "Necesitamos conocer si te encuentras en un supuesto de Persona Políticamente Expuesta."
      }
    >
      <Tracker {...trackerProps} />

      <div className="card">
        <div className="pepExplanation">
          <span className="pepLabel">¿QUÉ ES UNA PEP?</span>

          <h3>Persona Políticamente Expuesta</h3>

          <p>
            Es una persona que desempeña o ha desempeñado funciones públicas
            relevantes. También pueden existir supuestos relacionados con
            familiares cercanos o personas con determinados vínculos
            patrimoniales con una PEP.
          </p>

          <p>
            La mayoría de las personas no se encuentran dentro de esta
            categoría. Si nunca has desempeñado una función pública de alta
            relevancia y no tienes alguno de estos vínculos, normalmente
            deberás seleccionar “No”.
          </p>
        </div>

        <SectionDivider
          titulo={
            esMoral
              ? "¿El representante legal o propietario real es o puede ser PEP? *"
              : "¿Eres o has sido una Persona Políticamente Expuesta? *"
          }
        />

        <div className="choiceGrid pepChoiceGrid">
          <button
            type="button"
            className={
              datos.esPep === "no"
                ? "bigChoice chosen pepChoice"
                : "bigChoice pepChoice"
            }
            onClick={() => seleccionarRespuesta("no")}
          >
            <span className="choiceIcon">NO</span>
            <h2>No, no soy PEP</h2>
            <p>No me encuentro en los supuestos descritos.</p>
          </button>

          <button
            type="button"
            className={
              datos.esPep === "si"
                ? "bigChoice chosen pepChoice"
                : "bigChoice pepChoice"
            }
            onClick={() => seleccionarRespuesta("si")}
          >
            <span className="choiceIcon">SÍ</span>
            <h2>Sí, soy o puedo ser PEP</h2>
            <p>Quiero proporcionar información adicional.</p>
          </button>
        </div>

        {datos.esPep === "si" && (
          <div className="pepDetails">
            <Select
              label="Supuesto PEP *"
              value={datos.tipoPep}
              onChange={(v) => actualizar("tipoPep", v)}
              opciones={[
                "",
                "PEP_DIRECTO",
                "FAMILIAR_PEP",
                "VINCULO_PATRIMONIAL_PEP",
              ]}
            />

            <label className="field">
              <span>Describe el cargo, relación o vínculo * </span>
              <textarea
                value={datos.detallePep}
                onChange={(e) => actualizar("detallePep", e.target.value)}
                placeholder="Ej. cargo público, institución, parentesco o vínculo relevante."
              />
            </label>

            <div className="importantNotice">
              Declarar que eres o puedes ser PEP no significa que tu crédito sea
              rechazado automáticamente. La información será revisada como parte
              del proceso de conocimiento del cliente.
            </div>
          </div>
        )}

        <CheckControl
          texto="Declaro que la información proporcionada en esta declaración es verdadera y completa. *"
          checked={Boolean(datos.declaracionPepAceptada)}
          onChange={(v) => actualizar("declaracionPepAceptada", v)}
        />

        <NavButtons atras={regresar} continuar={continuar} />
      </div>
    </Pagina>
  );
}

/* =========================================================
   DOCUMENTOS
========================================================= */

function DocumentosIdentidad({
  datos,
  archivos,
  seleccionarArchivo,
  continuar,
  regresar,
  trackerProps,
}) {
  const fisica = datos.tipoPersona === "fisica";

  return (
    <Pagina
      titulo={
        fisica
          ? "Tus documentos"
          : "Documentos de la empresa"
      }
      subtitulo="Carga la documentación necesaria para integrar el expediente."
    >
      <Tracker {...trackerProps} />

      <div className="card">
        {fisica ? (
          <>
            <Upload
              titulo="INE vigente — frente *"
              archivo={archivos.pfIneFrente}
              onChange={(f) =>
                seleccionarArchivo("pfIneFrente", f)
              }
            />

            <Upload
              titulo="INE vigente — reverso *"
              archivo={archivos.pfIneReverso}
              onChange={(f) =>
                seleccionarArchivo("pfIneReverso", f)
              }
            />

            <Upload
              titulo="Comprobante de domicilio no mayor a 3 meses *"
              archivo={archivos.pfComprobanteDomicilio}
              onChange={(f) =>
                seleccionarArchivo(
                  "pfComprobanteDomicilio",
                  f
                )
              }
            />

            <Upload
              titulo="Constancia de Situación Fiscal actualizada *"
              archivo={archivos.pfCsf}
              onChange={(f) =>
                seleccionarArchivo("pfCsf", f)
              }
            />

            <Upload
              titulo="Carátula bancaria *"
              archivo={archivos.pfCaratulaBancaria}
              onChange={(f) =>
                seleccionarArchivo(
                  "pfCaratulaBancaria",
                  f
                )
              }
            />

            <Upload
              titulo="Solicitud de crédito / KYC *"
              archivo={archivos.pfSolicitudKyc}
              onChange={(f) =>
                seleccionarArchivo("pfSolicitudKyc", f)
              }
            />

            <Upload
              titulo="Autorización de consulta de Buró *"
              archivo={archivos.pfAutorizacionBuro}
              onChange={(f) =>
                seleccionarArchivo(
                  "pfAutorizacionBuro",
                  f
                )
              }
            />

            {datos.estadoCivil === "Casado" &&
              datos.regimenMatrimonial ===
                "Sociedad conyugal" && (
                <>
                  <SectionDivider titulo="Cónyuge" />

                  <Upload
                    titulo="INE del cónyuge *"
                    archivo={archivos.conyugeIne}
                    onChange={(f) =>
                      seleccionarArchivo("conyugeIne", f)
                    }
                  />

                  <Upload
                    titulo="CSF del cónyuge *"
                    archivo={archivos.conyugeCsf}
                    onChange={(f) =>
                      seleccionarArchivo("conyugeCsf", f)
                    }
                  />
                </>
              )}
          </>
        ) : (
          <>
            <Upload
              titulo="Acta constitutiva *"
              archivo={archivos.pmActaConstitutiva}
              onChange={(f) =>
                seleccionarArchivo("pmActaConstitutiva", f)
              }
            />

            <Upload
              titulo="Poderes del representante legal *"
              archivo={archivos.pmPoderes}
              onChange={(f) =>
                seleccionarArchivo("pmPoderes", f)
              }
            />

            <Upload
              titulo="Comprobante de domicilio *"
              archivo={archivos.pmComprobanteDomicilio}
              onChange={(f) =>
                seleccionarArchivo(
                  "pmComprobanteDomicilio",
                  f
                )
              }
            />

            <Upload
              titulo="Carátula bancaria *"
              archivo={archivos.pmCaratulaBancaria}
              onChange={(f) =>
                seleccionarArchivo(
                  "pmCaratulaBancaria",
                  f
                )
              }
            />

            <Upload
              titulo="Identificación representante legal *"
              archivo={archivos.pmIdRepresentante}
              onChange={(f) =>
                seleccionarArchivo("pmIdRepresentante", f)
              }
            />

            <Upload
              titulo="CSF representante legal *"
              archivo={archivos.pmCsfRepresentante}
              onChange={(f) =>
                seleccionarArchivo("pmCsfRepresentante", f)
              }
            />

            <Upload
              titulo="Identificación propietario real *"
              archivo={archivos.pmIdPropietario}
              onChange={(f) =>
                seleccionarArchivo("pmIdPropietario", f)
              }
            />

            <Upload
              titulo="CSF propietario real *"
              archivo={archivos.pmCsfPropietario}
              onChange={(f) =>
                seleccionarArchivo("pmCsfPropietario", f)
              }
            />
          </>
        )}

        <NavButtons
          atras={regresar}
          continuar={continuar}
        />
      </div>
    </Pagina>
  );
}

/* =========================================================
   DOMICILIO
========================================================= */

function Domicilio({
  datos,
  actualizar,
  continuar,
  regresar,
  trackerProps,
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
      <Tracker {...trackerProps} />

      <div className="card">
        <div className="grid2">
          <Campo
            label="Calle *"
            value={datos.calle}
            onChange={(v) => actualizar("calle", v)}
          />

          <Campo
            label="Número exterior *"
            value={datos.numeroExterior}
            onChange={(v) =>
              actualizar("numeroExterior", v)
            }
          />

          <Campo
            label="Colonia *"
            value={datos.colonia}
            onChange={(v) => actualizar("colonia", v)}
          />

          <Campo
            label="Código postal *"
            value={datos.cp}
            onChange={(v) => actualizar("cp", v)}
          />

          <Campo
            label="Municipio *"
            value={datos.municipio}
            onChange={(v) => actualizar("municipio", v)}
          />

          <Campo
            label="Estado *"
            value={datos.estado}
            onChange={(v) => actualizar("estado", v)}
          />
        </div>

        <NavButtons
          atras={regresar}
          continuar={continuar}
        />
      </div>
    </Pagina>
  );
}

/* =========================================================
   INGRESOS
========================================================= */

function Ingresos({
  datos,
  actualizar,
  continuar,
  regresar,
  trackerProps,
}) {
  const fisica = datos.tipoPersona === "fisica";

  return (
    <Pagina
      titulo={
        fisica
          ? "Trabajo e ingresos"
          : "Información financiera"
      }
      subtitulo="Esta información nos ayuda a evaluar la capacidad de pago."
    >
      <Tracker {...trackerProps} />

      <div className="card">
        {fisica ? (
          <div className="grid2">
            <Select
              label="Actividad *"
              value={datos.ocupacion}
              onChange={(v) =>
                actualizar("ocupacion", v)
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
              value={datos.empresaActividad}
              onChange={(v) =>
                actualizar("empresaActividad", v)
              }
            />

            <Campo
              label="Antigüedad *"
              value={datos.antiguedad}
              onChange={(v) =>
                actualizar("antiguedad", v)
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
          </div>
        ) : (
          <div className="grid2">
            <Campo
              label="Ventas mensuales aproximadas *"
              type="number"
              value={datos.ventasMensuales}
              onChange={(v) =>
                actualizar("ventasMensuales", v)
              }
            />

            <Campo
              label="Antigüedad de la empresa"
              value={datos.antiguedad}
              onChange={(v) =>
                actualizar("antiguedad", v)
              }
            />
          </div>
        )}

        <NavButtons
          atras={regresar}
          continuar={continuar}
        />
      </div>
    </Pagina>
  );
}

/* =========================================================
   FINANCIEROS
========================================================= */

function DocumentosFinancieros({
  datos,
  archivos,
  seleccionarArchivo,
  continuar,
  regresar,
  trackerProps,
}) {
  return (
    <Pagina
      titulo="Información financiera"
      subtitulo="Carga la documentación financiera disponible."
    >
      <Tracker {...trackerProps} />

      <div className="card">
        <Upload
          titulo="Estados de cuenta — últimos meses *"
          archivo={archivos.estadosCuenta}
          onChange={(f) =>
            seleccionarArchivo("estadosCuenta", f)
          }
        />

        {datos.tipoPersona === "fisica" && (
          <>
            <Upload
              titulo="Recibos de nómina / comprobantes de ingresos"
              archivo={archivos.comprobanteIngresos}
              onChange={(f) =>
                seleccionarArchivo(
                  "comprobanteIngresos",
                  f
                )
              }
            />

            <Upload
              titulo="Declaraciones fiscales"
              archivo={archivos.declaraciones}
              onChange={(f) =>
                seleccionarArchivo("declaraciones", f)
              }
            />
          </>
        )}

        {datos.tipoPersona === "moral" && (
          <Upload
            titulo="Estados financieros *"
            archivo={archivos.estadosFinancieros}
            onChange={(f) =>
              seleccionarArchivo("estadosFinancieros", f)
            }
          />
        )}

        <NavButtons
          atras={regresar}
          continuar={continuar}
        />
      </div>
    </Pagina>
  );
}

/* =========================================================
   SOLICITUD
========================================================= */

function Solicitud({
  datos,
  actualizar,
  continuar,
  regresar,
  trackerProps,
}) {
  return (
    <Pagina
      titulo="Confirma lo que necesitas"
      subtitulo="Estas son las condiciones solicitadas. Todavía no representan una oferta de crédito."
    >
      <Tracker {...trackerProps} />

      <div className="card">
        <div className="grid2">
          <Campo
            label="Monto solicitado *"
            type="number"
            value={datos.montoSolicitado}
            onChange={(v) =>
              actualizar("montoSolicitado", v)
            }
          />

          <Select
            label="Plazo solicitado *"
            value={datos.plazoSolicitado}
            onChange={(v) =>
              actualizar("plazoSolicitado", v)
            }
            opciones={["3", "6", "9", "12"]}
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
          La tasa, CAT, comisión y pago serán determinados
          después del análisis de la solicitud.
        </div>

        <NavButtons
          atras={regresar}
          continuar={continuar}
        />
      </div>
    </Pagina>
  );
}

/* =========================================================
   GARANTÍA
========================================================= */

function TipoCredito({
  datos,
  actualizar,
  continuar,
  regresar,
  trackerProps,
}) {
  return (
    <Pagina
      titulo="Estructura de la operación"
      subtitulo="Para esta demostración puedes visualizar las dos posibles rutas."
    >
      <Tracker {...trackerProps} />

      <div className="choiceGrid">
        <button
          className={
            datos.tipoCredito === "sin"
              ? "bigChoice chosen"
              : "bigChoice"
          }
          onClick={() =>
            actualizar("tipoCredito", "sin")
          }
        >
          <span className="choiceIcon">SG</span>

          <h2>Sin garantía</h2>

          <p>
            La evaluación se concentra principalmente en
            el perfil y capacidad de pago.
          </p>
        </button>

        <button
          className={
            datos.tipoCredito === "con"
              ? "bigChoice chosen"
              : "bigChoice"
          }
          onClick={() =>
            actualizar("tipoCredito", "con")
          }
        >
          <span className="choiceIcon">CG</span>

          <h2>Con garantía</h2>

          <p>
            La operación incorpora una garantía adicional
            como respaldo.
          </p>
        </button>
      </div>

      <NavButtons
        atras={regresar}
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
  regresar,
  trackerProps,
}) {
  return (
    <Pagina
      titulo="Garantía"
      subtitulo="Indica cómo se respaldará la operación."
    >
      <Tracker {...trackerProps} />

      <div className="card">
        <Select
          label="Tipo de garantía *"
          value={datos.tipoGarantia}
          onChange={(v) =>
            actualizar("tipoGarantia", v)
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
          datos.tipoGarantia !== "Obligado solidario" && (
            <>
              <Campo
                label="Descripción *"
                value={datos.descripcionGarantia}
                onChange={(v) =>
                  actualizar("descripcionGarantia", v)
                }
              />

              <Campo
                label="Valor estimado *"
                type="number"
                value={datos.valorGarantia}
                onChange={(v) =>
                  actualizar("valorGarantia", v)
                }
              />

              <Upload
                titulo="Documentación de la garantía *"
                archivo={archivos.garantiaDocumentacion}
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
          atras={regresar}
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
  regresar,
  trackerProps,
}) {
  return (
    <Pagina
      titulo="Obligado solidario"
      subtitulo="El obligado solidario tendrá posteriormente un expediente independiente."
    >
      <Tracker {...trackerProps} />

      <div className="card formCard">
        <Campo
          label="Nombre completo *"
          value={datos.garanteNombre}
          onChange={(v) =>
            actualizar("garanteNombre", v)
          }
        />

        <Campo
          label="RFC *"
          value={datos.garanteRfc}
          onChange={(v) =>
            actualizar("garanteRfc", v)
          }
        />

        <Campo
          label="Celular *"
          value={datos.garanteTelefono}
          onChange={(v) =>
            actualizar("garanteTelefono", v)
          }
        />

        <Campo
          label="Correo *"
          type="email"
          value={datos.garanteCorreo}
          onChange={(v) =>
            actualizar("garanteCorreo", v)
          }
        />

        <NavButtons
          atras={regresar}
          continuar={continuar}
        />
      </div>
    </Pagina>
  );
}

function GarantiaStatus({
  datos,
  ir,
  regresar,
  trackerProps,
}) {
  return (
    <Pagina
      titulo="Validación de garantía"
      subtitulo="Podrás consultar el estado sin visualizar información privada de terceros."
    >
      <Tracker {...trackerProps} />

      <div className="card">
        <div className="statusRow">
          <div>
            <span className="summaryLabel">
              Garantía
            </span>

            <h2>{datos.tipoGarantia}</h2>
          </div>

          <span className="yellowStatus">
            En proceso
          </span>
        </div>

        <div className="demoNotice">
          Para continuar con el prototipo, puedes simular la
          validación.
        </div>

        <NavButtons
          atras={regresar}
          continuar={() => ir("revision")}
          textoContinuar="Simular garantía validada"
        />
      </div>
    </Pagina>
  );
}

/* =========================================================
   REVISIÓN
========================================================= */

function Revision({
  datos,
  guardar,
  guardando,
  regresar,
  trackerProps,
}) {
  const nombre =
    datos.tipoPersona === "moral"
      ? datos.razonSocial
      : `${datos.nombre} ${datos.apellidoPaterno}`.trim();

  return (
    <Pagina
      titulo="Revisa tu solicitud"
      subtitulo="Confirma que la información sea correcta antes de enviarla."
    >
      <Tracker {...trackerProps} />

      <div className="card reviewCard">
        <div className="summaryGrid">
          <SummaryCard
            titulo="Solicitante"
            valor={nombre}
          />

          <SummaryCard
            titulo="Tipo"
            valor={
              datos.tipoPersona === "moral"
                ? "Persona Moral"
                : "Persona Física"
            }
          />

          <SummaryCard
            titulo="Monto"
            valor={moneda(datos.montoSolicitado)}
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
          En esta etapa todavía no existe tasa, CAT, comisión
          ni pago definitivo. Las condiciones serán determinadas
          durante el análisis de crédito.
        </div>

        <NavButtons
          atras={regresar}
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
  trackerProps,
}) {
  return (
    <Pagina
      titulo="Solicitud recibida"
      subtitulo={`Folio ${folio || "TRI-XXXXXX"}`}
    >
      <Tracker {...trackerProps} />

      <div className="statusCard">
        <div className="statusIcon">04</div>

        <div>
          <p className="cardEyebrow">
            EN REVISIÓN
          </p>

          <h2>
            Estamos analizando tu solicitud.
          </h2>

          <p>
            Nuestro equipo revisará tu información para
            determinar las condiciones que, en su caso,
            puedan ofrecerse.
          </p>
        </div>
      </div>

      <div className="summaryGrid">
        <SummaryCard
          titulo="Monto solicitado"
          valor={moneda(datos.montoSolicitado)}
        />

        <SummaryCard
          titulo="Plazo solicitado"
          valor={`${datos.plazoSolicitado} meses`}
        />
      </div>

      <div className="demoArea">
        <button
          className="demoButton"
          onClick={() => ir("oferta")}
        >
          DEMO: Simular aprobación
        </button>
      </div>
    </Pagina>
  );
}

/* =========================================================
   OFERTA
========================================================= */

function Oferta({
  datos,
  pagoOferta,
  ir,
  trackerProps,
}) {
  return (
    <Pagina
      titulo="Tenemos una oferta para ti"
      subtitulo="Aquí aparecen por primera vez las condiciones financieras de tu oferta individual."
    >
      <Tracker {...trackerProps} />

      <div className="offerHero">
        <p className="offerEyebrow">
          MONTO APROBADO
        </p>

        <h2>{moneda(datos.montoAprobado)}</h2>
      </div>

      <div className="offerGrid">
        <OfertaDato
          titulo="Plazo"
          valor={`${datos.plazoAprobado} meses`}
        />

        <OfertaDato
          titulo="Tasa anual fija"
          valor={`${Number(datos.tasaAprobada).toFixed(1)}%`}
        />

        <OfertaDato
          titulo="Tasa moratoria anual"
          valor={`${Number(datos.tasaMoratoriaAprobada || 0).toFixed(1)}%`}
        />

        <OfertaDato
          titulo="Pago estimado"
          valor={moneda(pagoOferta)}
        />

        <OfertaDato
          titulo="Comisión"
          valor={`${Number(datos.comisionAprobada).toFixed(1)}%`}
        />

        <OfertaDato
          titulo="CAT"
          valor={`${Number(datos.catAprobado).toFixed(1)}%`}
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
          CAT {Number(datos.catAprobado).toFixed(1)}% Sin IVA
        </strong>

        <p>
          Para fines informativos y de comparación. En producción
          se calculará automáticamente con las condiciones
          específicas de la operación.
        </p>
      </div>

      <div className="warningBox">
        <strong>Información importante</strong>

        <p>
          Contratar créditos que excedan tu capacidad de pago
          afecta tu historial crediticio.
        </p>

        <p>
          Incumplir tus obligaciones puede generar intereses
          moratorios y comisiones cuando correspondan.
        </p>
      </div>

      <div className="buttonRow">
        <button
          className="primary"
          onClick={() => ir("cuentaBanco")}
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

/* =========================================================
   FIRMA
========================================================= */

function CuentaBanco({
  datos,
  actualizar,
  continuar,
  guardando,
  regresar,
  trackerProps,
}) {
  return (
    <Pagina
      titulo="Cuenta bancaria"
      subtitulo="Confirma la cuenta donde deseas recibir el crédito y prepara tu calendario de pagos."
    >
      <Tracker {...trackerProps} />

      <div className="card formCard">
        <Campo
          label="Banco *"
          value={datos.banco}
          onChange={(v) =>
            actualizar("banco", v)
          }
        />

        <Campo
          label="CLABE interbancaria *"
          value={datos.clabe}
          onChange={(v) =>
            actualizar(
              "clabe",
              v.replace(/\D/g, "").slice(0, 18)
            )
          }
        />

        <Campo
          label="Fecha del primer pago *"
          type="date"
          value={datos.fechaPrimerPago}
          onChange={(v) =>
            actualizar(
              "fechaPrimerPago",
              v
            )
          }
        />

        {datos.clabe.length > 0 && (
          <div className="notice">
            La CLABE debe contener 18 dígitos.
            Terminación:{" "}
            <strong>
              {datos.clabe.length >= 4
                ? datos.clabe.slice(-4)
                : "----"}
            </strong>
          </div>
        )}

        <div className="importantNotice">
          La autorización para domiciliar los pagos se
          presentará por separado dentro de tus documentos
          contractuales. Registrar esta cuenta no sustituye
          dicha autorización.
        </div>

        <NavButtons
          atras={regresar}
          continuar={continuar}
          textoContinuar={
            guardando
              ? "Preparando contrato..."
              : "Continuar a documentos"
          }
          disabled={guardando}
        />
      </div>
    </Pagina>
  );
}

function Contratos({
  ir,
  regresar,
  trackerProps,
}) {
  return (
    <Pagina
      titulo="Documentos contractuales"
      subtitulo="Revisa los documentos antes de firmar."
    >
      <Tracker {...trackerProps} />

      <div className="card">
        <Documento titulo="Contrato de crédito" />
        <Documento titulo="Tabla de amortización" />
        <Documento titulo="Pagaré" />
        <Documento titulo="Autorización de domiciliación" />

        <NavButtons
          atras={regresar}
          continuar={() => ir("firma")}
          textoContinuar="Continuar a firma"
        />
      </div>
    </Pagina>
  );
}

function Firma({
  ir,
  regresar,
  trackerProps,
}) {
  return (
    <Pagina
      titulo="Firma tus documentos"
      subtitulo="Último paso antes de enviar la operación a tesorería."
    >
      <Tracker {...trackerProps} />

      <div className="statusCard">
        <div className="statusIcon">✍</div>

        <div>
          <p className="cardEyebrow">
            FIRMA
          </p>

          <h2>Firma del solicitante</h2>

          <p>
            Se registrará evidencia de firma y versión documental.
          </p>
        </div>
      </div>

      <NavButtons
        atras={regresar}
        continuar={() => ir("tesoreriaCliente")}
        textoContinuar="Simular firma"
      />
    </Pagina>
  );
}

function TesoreriaCliente({
  ir,
  trackerProps,
}) {
  return (
    <Pagina
      titulo="Todo listo"
      subtitulo="Tu crédito pasó a las validaciones finales de tesorería."
    >
      <Tracker {...trackerProps} />

      <div className="statusCard">
        <div className="successIcon">✓</div>

        <div>
          <p className="cardEyebrow">
            DOCUMENTACIÓN COMPLETA
          </p>

          <h2>
            La operación está lista para dispersión.
          </h2>

          <p>
            Tesorería realizará las últimas validaciones antes
            de transferir los recursos.
          </p>
        </div>
      </div>

      <div className="demoArea">
        <button
          className="demoButton"
          onClick={() => ir("dispersado")}
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
        <div className="successIcon">✓</div>

        <div>
          <p className="cardEyebrow">
            CRÉDITO ACTIVO
          </p>

          <h2>
            Los recursos fueron dispersados.
          </h2>

          <button
            className="primary"
            onClick={() => ir("creditoActivo")}
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
          valor={moneda(datos.montoAprobado)}
        />

        <SummaryCard
          titulo="Próximo pago"
          valor={moneda(pagoOferta)}
        />
      </div>

      <div className="portalOptions">
        <button>Tabla de amortización</button>
        <button>Pagos realizados</button>
        <button>Estado de cuenta</button>
        <button>Contrato</button>
        <button>Pagaré</button>
        <button>Método de pago</button>
      </div>
    </Pagina>
  );
}

/* =========================================================
   LEGAL
========================================================= */

function UNE({ empresa }) {
  return (
    <Pagina
      titulo="Unidad Especializada de Atención a Usuarios"
      subtitulo="Información oficial para consultas, aclaraciones y reclamaciones."
    >
      <div className="card legalText">
        <SectionDivider titulo="UNE de TRISAL" />

        <Resumen titulo="Entidad" valor={empresa.razonSocial} />
        <Resumen titulo="Titular de la UNE" valor={empresa.uneTitular} />
        <Resumen titulo="Domicilio" valor={empresa.uneDireccion} />
        <Resumen titulo="Teléfono UNE" valor={empresa.uneTelefono} />
        <Resumen titulo="Correo UNE" valor={empresa.uneCorreo} />
        <Resumen titulo="Horario de atención" valor={empresa.uneHorario} />
        <Resumen titulo="Entidad federativa" valor={empresa.uneEntidad} />
        <Resumen titulo="Sucursales u oficinas de atención" valor={empresa.uneSucursales} />
        <Resumen titulo="Medio de recepción o canal" valor={empresa.uneCanal} />

 
      </div>

      <div className="card legalText">
        <SectionDivider titulo="CONDUSEF" />

        <Resumen titulo="Teléfono" valor={empresa.condusefTelefono} />
        <Resumen titulo="Correo" valor={empresa.condusefCorreo} />

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

function Normatividad({ empresa }) {
  return (
    <Pagina
      titulo="Normatividad y transparencia"
      subtitulo="Información institucional y contractual relevante para nuestros usuarios."
    >
      <div className="card legalText">
        <SectionDivider titulo="Información institucional" />

        <Resumen titulo="Razón social" valor={empresa.razonSocial} />
        <Resumen titulo="Folio Mercantil Electrónico" valor={empresa.folioMercantil} />
        <Resumen titulo="Escritura constitutiva" valor={empresa.escrituraConstitutiva} />
        <Resumen titulo="Fecha de escritura constitutiva" valor={empresa.fechaEscrituraConstitutiva} />
        <Resumen titulo="Fecha de inscripción en el RPC" valor={empresa.fechaInscripcionRpc} />
        <Resumen titulo="Representante legal" valor={empresa.representanteLegal} />
        <Resumen titulo="Domicilio" valor={empresa.direccion} />
        <Resumen titulo="Página de internet" valor="trisalmx.com" />
      </div>

      <div className="card legalText">
        <SectionDivider titulo="Información del contrato" />

        <Resumen titulo="Número de registro RECA" valor={empresa.reca} />
        <Resumen titulo="Lugar de firma" valor={empresa.ciudadFirma} />
        <Resumen titulo="Jurisdicción pactada" valor={empresa.jurisdiccion} />

        <p>
          Para la constitución y operación de {empresa.razonSocial}{" "}
          con tal carácter, no requiere de autorización de la Secretaría
          de Hacienda y Crédito Público.
        </p>

        <p>
          {empresa.razonSocial} se encuentra sujeta a la supervisión
          de la Comisión Nacional Bancaria y de Valores únicamente
          para los efectos previstos en la legislación aplicable a las
          sociedades financieras de objeto múltiple, entidades no reguladas.
        </p>
      </div>

      <div className="card legalText">
        <SectionDivider titulo="UNE" />
        <Resumen titulo="Titular" valor={empresa.uneTitular} />
        <Resumen titulo="Teléfono" valor={empresa.uneTelefono} />
        <Resumen titulo="Correo" valor={empresa.uneCorreo} />
        <Resumen titulo="Horario" valor={empresa.uneHorario} />
      </div>

      <div className="card legalText">
        <SectionDivider titulo="Despachos de cobranza" />

        <p>
          Los datos de los despachos de cobranza que correspondan
          se publicarán y mantendrán actualizados conforme a la
          regulación aplicable.
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
          Esta sección deberá incorporar la descripción, alcance e
          información oficial correspondiente a FDG5 SERVICIOS
          conforme a las disposiciones aplicables.
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

function Privacidad({ empresa }) {
  return (
    <Pagina
      titulo="Aviso de privacidad"
      subtitulo="Información sobre el tratamiento de datos personales."
    >
      <div className="card legalText">
        <SectionDivider titulo="Responsable" />

        <p>
          {empresa.razonSocial}, con domicilio en {empresa.direccion},
          es responsable del tratamiento de los datos personales que
          recabe.
        </p>

        <SectionDivider titulo="Finalidades" />

        <p>
          Los datos podrán utilizarse para identificación, integración
          del expediente, análisis de crédito, contratación,
          administración, cumplimiento regulatorio y prevención
          de fraude.
        </p>

        <SectionDivider titulo="Derechos ARCO" />

        <p>
          El titular podrá ejercer los derechos correspondientes
          conforme al procedimiento establecido por la entidad.
        </p>

        <div className="importantNotice">
          Esta es una versión de prototipo. Sustituye este texto por
          el Aviso de Privacidad definitivo validado por el área legal.
        </div>
      </div>
    </Pagina>
  );
}

/* =========================================================
   COMPONENTES
========================================================= */

function Pagina({
  titulo,
  subtitulo,
  children,
}) {
  return (
    <section className="page fadeUp">
      <header className="pageTitle">
        <h1>{titulo}</h1>

        {subtitulo && <p>{subtitulo}</p>}
      </header>

      {children}
    </section>
  );
}

/* =========================================================
   TRACKER CLICKEABLE
========================================================= */

function Tracker({
  pasoActual,
  pasoMaximo,
  navegarPorTracker,
  estadoSolicitud,
}) {
  function bloqueado(numero) {
    if (numero > pasoMaximo) {
      return true;
    }

    if (
      ESTADOS_ENVIADOS.includes(estadoSolicitud) &&
      numero < 4
    ) {
      return true;
    }

    return false;
  }

  return (
    <>
      <div className="desktopTracker">
        {PASOS.map((paso, index) => {
          const completado =
            paso.numero < pasoActual;

          const actual =
            paso.numero === pasoActual;

          const disabled =
            bloqueado(paso.numero);

          return (
            <div
              className="trackerItem"
              key={paso.numero}
            >
              <button
                type="button"
                disabled={disabled}
                className={
                  completado
                    ? "trackerDot completed trackerClickable"
                    : actual
                    ? "trackerDot current trackerClickable"
                    : disabled
                    ? "trackerDot trackerDisabled"
                    : "trackerDot trackerClickable"
                }
                onClick={() =>
                  navegarPorTracker(paso.numero)
                }
                title={
                  disabled
                    ? "Completa primero las etapas anteriores"
                    : `Ir a ${paso.nombre}`
                }
              >
                {completado ? "✓" : paso.numero}
              </button>

              <button
                type="button"
                disabled={disabled}
                className={
                  actual
                    ? "trackerTextButton trackerTextActive"
                    : disabled
                    ? "trackerTextButton trackerTextDisabled"
                    : "trackerTextButton"
                }
                onClick={() =>
                  navegarPorTracker(paso.numero)
                }
              >
                {paso.nombre}
              </button>

              {index < PASOS.length - 1 && (
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
        })}
      </div>

      <div className="mobileTracker">
        <div className="mobileTrackerHeader">
          <strong>
            Paso {pasoActual} de 6
          </strong>

          <span>
            {PASOS[pasoActual - 1]?.nombre}
          </span>
        </div>

        <div className="mobileProgress">
          <div
            className="mobileProgressFill"
            style={{
              width: `${(pasoActual / 6) * 100}%`,
            }}
          />
        </div>

        <div className="mobileStepButtons">
          {PASOS.map((paso) => {
            const disabled =
              bloqueado(paso.numero);

            return (
              <button
                key={paso.numero}
                type="button"
                disabled={disabled}
                className={
                  paso.numero === pasoActual
                    ? "mobileStepButton mobileStepCurrent"
                    : paso.numero < pasoActual
                    ? "mobileStepButton mobileStepCompleted"
                    : "mobileStepButton"
                }
                onClick={() =>
                  navegarPorTracker(paso.numero)
                }
              >
                {paso.numero}
              </button>
            );
          })}
        </div>
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
          onChange?.(e.target.value)
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
          onChange(e.target.value)
        }
      >
        {opciones.map((opcion) => (
          <option
            key={opcion}
            value={opcion}
          >
            {opcion || "Selecciona"}
          </option>
        ))}
      </select>
    </label>
  );
}

function Upload({
  titulo,
  archivo,
  onChange,
}) {
  const estado = archivo?.estado || "";

  const [abriendo, setAbriendo] = useState(false);

  const textoEstado =
    estado === "UPLOADING"
      ? "Subiendo..."
      : estado === "PENDING"
      ? "Pendiente de revisión"
      : estado === "APPROVED"
      ? "Documento aprobado"
      : estado === "REJECTED"
      ? "Documento rechazado · debes reemplazarlo"
      : "";

  const puedeVer =
    Boolean(archivo?.storagePath) &&
    estado !== "REJECTED" &&
    estado !== "UPLOADING";

  const debeReemplazar = estado === "REJECTED";
  const yaTieneDocumento = estado === "PENDING" || estado === "APPROVED";

  async function verDocumento() {
    if (!archivo?.storagePath || abriendo) return;

    try {
      setAbriendo(true);

      const { data, error } = await supabase.storage
        .from(DOCUMENTOS_BUCKET)
        .createSignedUrl(archivo.storagePath, 300);

      if (error) throw error;

      if (!data?.signedUrl) {
        throw new Error("No se pudo generar el enlace temporal.");
      }

      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("No se pudo abrir el documento:", error);
      alert("No se pudo abrir el documento. Intenta nuevamente.");
    } finally {
      setAbriendo(false);
    }
  }

  return (
    <div className="uploadWrapper">
      <div
        className={
          estado === "REJECTED"
            ? "upload uploadRejected"
            : estado === "APPROVED"
            ? "upload uploadApproved"
            : "upload"
        }
      >
        <div className="uploadIcon">
          {estado === "APPROVED" ? "✓" : estado === "REJECTED" ? "!" : "↑"}
        </div>

        <div className="uploadInfo">
          <strong>{titulo}</strong>

          {/*
            Si el documento fue rechazado ya no lo mostramos como
            documento vigente al cliente. El archivo histórico sigue
            guardado para Backoffice/auditoría.
          */}
          {estado === "REJECTED" ? (
            <span>Debes cargar un documento nuevo.</span>
          ) : (
            <span>
              {archivo?.name || "PDF, JPG o PNG · Máx. 15 MB"}
            </span>
          )}

          {textoEstado && (
            <span
              className={
                estado === "APPROVED"
                  ? "documentStatus documentApproved"
                  : estado === "REJECTED"
                  ? "documentStatus documentRejected"
                  : estado === "UPLOADING"
                  ? "documentStatus documentUploading"
                  : "documentStatus documentPending"
              }
            >
              {textoEstado}
            </span>
          )}
        </div>

        <div className="uploadButtons">
          {puedeVer && (
            <button
              type="button"
              className="viewDocumentButton"
              disabled={abriendo}
              onClick={verDocumento}
            >
              {abriendo ? "Abriendo..." : "Ver documento"}
            </button>
          )}

          {/*
            La versión vigente pendiente/aprobada se conserva tal cual.
            Sólo pedimos reemplazo directo cuando fue rechazada o cuando
            todavía no existe archivo.
          */}
          {(!yaTieneDocumento || debeReemplazar || estado === "UPLOADING") && (
            <label className="uploadAction uploadActionLabel">
              {estado === "UPLOADING"
                ? "Subiendo..."
                : debeReemplazar
                ? "Subir nuevo"
                : "Seleccionar"}

              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                disabled={estado === "UPLOADING"}
                onChange={(e) => {
                  const nuevoArchivo = e.target.files?.[0];
                  onChange(nuevoArchivo);
                  e.target.value = "";
                }}
              />
            </label>
          )}
        </div>
      </div>

      {estado === "REJECTED" && (
        <div className="documentObservation">
          <strong>Necesitamos que reemplaces este documento.</strong>
          {archivo?.observaciones ? (
            <span> Motivo: {archivo.observaciones}</span>
          ) : (
            <span> El documento no pasó la revisión.</span>
          )}
        </div>
      )}
    </div>
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
          onChange(e.target.checked)
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
        className="secondary backButton"
        onClick={atras}
      >
        ← Regresar
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

function SectionDivider({ titulo }) {
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
      <strong>{valor || "-"}</strong>
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
      <strong>{valor || "-"}</strong>
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

function Documento({ titulo }) {
  return (
    <div className="document">
      <div>
        <strong>{titulo}</strong>
        <span>Documento generado</span>
      </div>

      <button>Ver</button>
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

function RequirementList({ items }) {
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

          <strong>TRISAL</strong>
        </div>

        <div className="footerLegal">
          <p>
            Para la constitución y operación de{" "}
            {empresa.razonSocial} con tal carácter, no requiere de
            autorización de la Secretaría de Hacienda y Crédito
            Público.
          </p>

          <p>
            {empresa.razonSocial} se encuentra sujeta a la
            supervisión de la Comisión Nacional Bancaria y de
            Valores, únicamente para efectos de lo dispuesto por
            el artículo 56 de la Ley General de Organizaciones y
            Actividades Auxiliares del Crédito.
          </p>
        </div>

        <div className="footerLinks">
          <button onClick={() => ir("une")}>
            UNE
          </button>

          <button onClick={() => ir("normatividad")}>
            Normatividad
          </button>

          <button onClick={() => ir("buro")}>
            Buró de Entidades Financieras
          </button>

          <button onClick={() => ir("privacidad")}>
            Aviso de privacidad
          </button>
        </div>
      </div>
    </footer>
  );
}

/* =========================================================
   CÁLCULOS
========================================================= */

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
  return Number(valor || 0).toLocaleString(
    "es-MX",
    {
      style: "currency",
      currency: "MXN",
    }
  );
}

/* =========================================================
   CSS
========================================================= */

const css = `
:root {
  --navy: #111a2a;
  --navy2: #17243a;
  --gold: #9c7427;
  --goldHover: #b18632;
  --green: #1c815c;

  --text: #151c2a;
  --muted: #667489;
  --bg: #f6f6f3;
  --white: #ffffff;
  --border: #dfe4ea;

  --shadow:
    0 10px 32px rgba(15, 23, 42, .055);
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
      rgba(156,116,39,.055),
      transparent 31%
    ),
    var(--bg);

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
    transform .18s ease,
    box-shadow .18s ease,
    background .18s ease;
}

button:not(:disabled):hover {
  transform: translateY(-1px);
}

button:disabled {
  cursor: default;
}

.app {
  min-height: 100vh;
}

/* =========================================================
   LOADING
========================================================= */

.loadingScreen {
  min-height: 100vh;

  display: flex;
  flex-direction: column;

  justify-content: center;
  align-items: center;

  gap: 10px;
}

.loadingScreen strong {
  color: #0a326f;

  font-size: 42px;

  letter-spacing: .05em;
}

.loadingScreen span {
  color: var(--muted);
}

/* =========================================================
   HEADER
========================================================= */

.header {
  min-height: 92px;

  position: sticky;
  top: 0;

  z-index: 100;

  display: flex;

  align-items: center;
  justify-content: space-between;

  padding-left:
    max(
      32px,
      calc((100vw - 1240px) / 2)
    );

  padding-right:
    max(
      32px,
      calc((100vw - 1240px) / 2)
    );

  background: rgba(255,255,255,.97);

  backdrop-filter: blur(14px);

  border-bottom:
    1px solid rgba(17,26,42,.05);
}

.logoButton {
  border: 0;
  background: transparent;
  padding: 0;
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

  padding: 13px 15px;

  border-radius: 9px;

  font-size: 15.5px;
  font-weight: 750;

  cursor: pointer;
}

.navButton:hover {
  background: #f0f2f5;
}

.navCta,
.goldButton {
  border: 0;

  background: var(--gold);

  color: white;

  border-radius: 10px;

  padding: 14px 19px;

  font-size: 15.5px;
  font-weight: 850;

  cursor: pointer;
}

.navCta:hover,
.goldButton:hover {
  background: var(--goldHover);
}

.logoutButton {
  border: 1px solid #d7dde5;

  background: white;

  color: var(--navy);

  border-radius: 10px;

  padding: 12px 15px;

  font-weight: 750;

  cursor: pointer;
}

.hamburger {
  display: none;
}

.legalDropdown {
  position: relative;
}

.legalMenu {
  position: absolute;

  top: 50px;
  right: 0;

  width: 265px;

  background: white;

  border: 1px solid var(--border);

  border-radius: 13px;

  padding: 8px;

  box-shadow:
    0 18px 45px rgba(15,23,42,.13);
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

/* =========================================================
   PAGE
========================================================= */

.container {
  width:
    min(
      1240px,
      calc(100% - 64px)
    );

  margin: 0 auto;

  padding: 58px 0 100px;
}

.page {
  width: 100%;
}

.pageTitle {
  width: 100%;

  margin: 0 0 35px;

  text-align: left;
}

.pageTitle h1 {
  max-width: 920px;

  margin: 0;

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
  max-width: 810px;

  margin: 10px 0 0;

  color: var(--muted);

  font-size: 18px;

  line-height: 1.55;

  text-align: left;
}

.fadeUp {
  animation:
    fadeUp .48s ease both;
}

@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* =========================================================
   ERRORS
========================================================= */

.globalError,
.globalInfo {
  width: 100%;

  display: flex;
  flex-direction: column;

  gap: 4px;

  margin-bottom: 25px;

  padding: 16px 19px;

  border-radius: 12px;
}

.globalError {
  background: #fff0f0;

  border: 1px solid #efc4c4;

  color: #912c2c;
}

.globalInfo {
  background: #edf5ff;

  border: 1px solid #ccdef3;

  color: #315e90;
}

/* =========================================================
   HERO
========================================================= */

.hero {
  min-height: 68vh;

  display: grid;

  grid-template-columns:
    minmax(0,1.35fr)
    minmax(350px,.65fr);

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

  margin: 14px 0 23px;

  color: var(--text);

  font-size:
    clamp(
      48px,
      5.5vw,
      73px
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

  border: 1px solid var(--border);

  border-radius: 22px;

  box-shadow: var(--shadow);

  text-align: left;
}

.heroCard h2 {
  margin: 8px 0 20px;

  font-size: 27px;

  line-height: 1.2;
}

.miniStep {
  display: grid;

  grid-template-columns: 35px 1fr;

  gap: 12px;

  align-items: center;

  padding: 13px 0;

  border-bottom: 1px solid #edf0f3;
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

/* =========================================================
   BUTTONS
========================================================= */

.primary,
.secondary,
.demoButton {
  min-height: 49px;

  border-radius: 10px;

  padding: 12px 20px;

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
    0 8px 22px rgba(17,26,42,.14);
}

.primary:disabled {
  opacity: .45;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.optionRow {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 10px;
}

.optionButton {
  min-width: 118px;
  min-height: 49px;

  border: 1px solid #c8d0db;
  background: white;
  color: var(--navy);

  border-radius: 10px;
  padding: 12px 18px;

  font-size: 15px;
  font-weight: 850;

  cursor: pointer;
}

.optionButton:hover {
  border-color: var(--gold);
  background: #fffdf8;
}

.optionButton.selectedOption {
  border-color: var(--gold);
  background: var(--gold);
  color: white;

  box-shadow:
    0 7px 18px rgba(156,116,39,.18);
}

.secondary {
  border: 1px solid #c8d0db;

  background: white;

  color: var(--navy);
}

.backButton {
  min-width: 130px;
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

  align-items: center;
}

.formAction,
.bottomAction,
.demoArea {
  display: flex;

  justify-content: flex-start;

  margin-top: 26px;
}

.textLinkButton,
.linkButton {
  border: 0;

  background: transparent;

  color: #76591e;

  padding: 0;

  cursor: pointer;

  font-weight: 800;

  text-align: left;
}

.textLinkButton {
  padding-top: 20px;
}

.blockLink {
  display: block;

  margin-top: 18px;
}

.loginPrompt {
  display: flex;

  gap: 7px;

  align-items: center;

  margin-top: 20px;

  color: var(--muted);
}

/* =========================================================
   CARDS
========================================================= */

.card {
  width: 100%;

  background: white;

  padding: 30px;

  margin-bottom: 24px;

  border: 1px solid var(--border);

  border-radius: 18px;

  box-shadow: var(--shadow);

  text-align: left;
}

.reviewCard {
  padding: 34px;
}

.formCard {
  max-width: 830px;
}

.grid2 {
  display: grid;

  grid-template-columns:
    repeat(2,minmax(0,1fr));

  gap: 0 28px;
}

/* =========================================================
   FIELDS
========================================================= */

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

  min-height: 51px;

  border: 1px solid #d1d8e2;

  border-radius: 10px;

  padding: 13px 15px;

  background: white;

  color: var(--text);

  font-size: 16px;

  outline: none;
}

.field input:focus,
.field select:focus {
  border-color: var(--gold);

  box-shadow:
    0 0 0 3px rgba(156,116,39,.09);
}

.sectionDivider {
  display: grid;

  grid-template-columns: auto 1fr;

  gap: 18px;

  align-items: center;

  margin: 10px 0 24px;
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

/* =========================================================
   TRACKER
========================================================= */

.desktopTracker {
  display: flex;

  align-items: center;

  width: 100%;

  margin: 0 0 43px;
}

.trackerItem {
  flex: 1;

  min-width: 0;

  display: flex;

  align-items: center;
}

.trackerDot {
  width: 38px;
  height: 38px;

  flex-shrink: 0;

  display: grid;
  place-items: center;

  border: 2px solid #d2dae4;

  border-radius: 50%;

  color: #8b95a4;

  background: var(--bg);

  font-size: 14px;

  font-weight: 850;
}

.trackerClickable {
  cursor: pointer;
}

.trackerClickable:hover {
  border-color: var(--gold);

  box-shadow:
    0 0 0 4px rgba(156,116,39,.08);
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

.trackerDisabled {
  opacity: .48;

  cursor: not-allowed;
}

.trackerTextButton {
  border: 0;

  background: transparent;

  margin-left: 9px;

  padding: 3px;

  color: #7d8999;

  font-size: 14px;

  cursor: pointer;

  white-space: nowrap;
}

.trackerTextButton:hover:not(:disabled) {
  color: var(--gold);
}

.trackerTextActive {
  color: var(--navy);

  font-weight: 850;
}

.trackerTextDisabled {
  opacity: .5;

  cursor: not-allowed;
}

.trackerLine {
  height: 2px;

  flex: 1;

  min-width: 10px;

  margin: 0 12px;

  background: #dde2e8;
}

.completedLine {
  background: var(--green);
}

.mobileTracker {
  display: none;
}

/* =========================================================
   HOW IT WORKS
========================================================= */

.simpleFlow {
  width: 100%;

  display: flex;

  flex-direction: column;

  gap: 13px;

  margin-bottom: 30px;
}

.simpleFlowCard {
  width: 100%;

  min-height: 95px;

  display: grid;

  grid-template-columns:
    54px
    minmax(190px,280px)
    minmax(0,1fr);

  gap: 25px;

  align-items: center;

  padding: 19px 25px;

  background: white;

  border: 1px solid var(--border);

  border-radius: 16px;

  box-shadow:
    0 7px 23px rgba(15,23,42,.04);

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
}

.simpleFlowCard p {
  margin: 0;

  color: var(--muted);

  font-size: 16px;

  line-height: 1.5;
}

/* =========================================================
   PRODUCT
========================================================= */

.productHero {
  display: grid;

  grid-template-columns:
    minmax(0,1.5fr)
    minmax(230px,.5fr);

  gap: 50px;

  align-items: center;

  padding: 42px 45px;

  margin-bottom: 24px;

  background:
    linear-gradient(
      135deg,
      #111a2a 0%,
      #17263d 100%
    );

  border-radius: 20px;

  box-shadow:
    0 14px 35px rgba(15,23,42,.1);

  text-align: left;
}

.productHero h2 {
  max-width: 680px;

  margin: 10px 0 16px;

  color: white;

  font-size:
    clamp(
      29px,
      3.3vw,
      41px
    );

  line-height: 1.14;

  letter-spacing: -.025em;
}

.productHero p:not(.productKicker) {
  max-width: 720px;

  margin: 0;

  color: #d7dde7;

  font-size: 16px;

  line-height: 1.65;
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

  border: 1px solid var(--border);

  border-radius: 14px;

  box-shadow:
    0 7px 22px rgba(15,23,42,.04);
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

  padding: 24px 27px;

  background: #f4efe4;

  border: 1px solid #dfd3b8;

  border-left: 5px solid var(--gold);

  border-radius: 13px;
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
  margin: 8px 0 20px;

  font-size: 24px;
}

.requirement {
  display: grid;

  grid-template-columns: 20px 1fr;

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

/* =========================================================
   CHOICES
========================================================= */

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

  border: 2px solid transparent;

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
  margin: 15px 0 7px;

  font-size: 25px;
}

.bigChoice p {
  max-width: 480px;

  margin: 0;

  color: var(--muted);

  line-height: 1.55;
}

/* =========================================================
   UPLOADS
========================================================= */

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

  border: 1px dashed #bac4d0;

  border-radius: 12px;

  cursor: pointer;
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
  padding: 8px 11px;

  border: 1px solid #ccd3dc;

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

/* =========================================================
   CHECKS / NOTICES
========================================================= */

.check {
  display: flex;

  gap: 12px;

  align-items: flex-start;

  padding: 14px 0;

  border-bottom: 1px solid #edf0f3;

  line-height: 1.5;
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
  margin: 20px 0;

  padding: 15px 17px;

  border-radius: 10px;

  line-height: 1.55;
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

/* =========================================================
   SUMMARY
========================================================= */

.summaryGrid {
  display: grid;

  grid-template-columns:
    repeat(3,minmax(0,1fr));

  gap: 18px;

  margin-bottom: 22px;
}

.summaryCard {
  min-height: 130px;

  display: flex;

  flex-direction: column;

  justify-content: center;

  align-items: flex-start;

  padding: 24px;

  background: white;

  border: 1px solid var(--border);

  border-radius: 15px;

  box-shadow:
    0 6px 20px rgba(15,23,42,.03);
}

.summaryCard span,
.summaryLabel {
  color: var(--muted);

  margin-bottom: 9px;

  font-size: 14px;
}

.summaryCard strong {
  color: var(--text);

  font-size: 20px;

  line-height: 1.35;
}

.summaryRow {
  display: flex;

  justify-content: space-between;

  gap: 30px;

  padding: 14px 0;

  border-bottom: 1px solid #edf0f3;
}

/* =========================================================
   STATUS
========================================================= */

.statusRow {
  display: flex;

  justify-content: space-between;

  align-items: center;
}

.statusRow h2 {
  margin: 5px 0 0;
}

.yellowStatus {
  display: inline-block;

  background: #fff0c1;

  color: #775a11;

  padding: 8px 11px;

  border-radius: 8px;

  font-weight: 850;
}

.statusCard {
  display: grid;

  grid-template-columns: 75px 1fr;

  gap: 25px;

  align-items: start;

  max-width: 860px;

  margin-bottom: 25px;

  padding: 30px;

  background: white;

  border: 1px solid var(--border);

  border-radius: 18px;

  box-shadow: var(--shadow);
}

.statusCard h2 {
  margin: 7px 0 10px;

  font-size: 29px;
}

.statusCard p:not(.cardEyebrow) {
  max-width: 650px;

  margin: 0 0 18px;

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

/* =========================================================
   OFFER
========================================================= */

.offerHero {
  margin-bottom: 18px;

  padding: 28px;

  background:
    linear-gradient(
      135deg,
      var(--navy),
      var(--navy2)
    );

  border-radius: 17px;

  color: white;
}

.offerHero h2 {
  margin: 7px 0 0;

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

  border: 1px solid var(--border);

  border-radius: 13px;
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

  border-left: 4px solid var(--gold);

  border-radius: 12px;
}

.catDisclosure strong {
  font-size: 20px;
}

.catDisclosure p {
  margin: 7px 0 0;

  color: #615b50;

  line-height: 1.5;
}

.warningBox {
  margin-top: 17px;

  padding: 19px;

  background: #fff7e5;

  border-radius: 12px;
}

.warningBox p {
  color: #67582f;

  line-height: 1.5;
}

/* =========================================================
   DOCUMENTS / PORTAL
========================================================= */

.document {
  display: flex;

  align-items: center;

  justify-content: space-between;

  gap: 20px;

  padding: 15px 0;

  border-bottom: 1px solid #edf0f3;
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

  border: 1px solid var(--border);

  background: white;

  border-radius: 13px;

  color: var(--text);

  cursor: pointer;

  font-weight: 750;

  text-align: left;

  padding: 18px;
}

/* =========================================================
   LEGAL
========================================================= */

.legalText {
  max-width: 1000px;

  color: #4d596b;

  line-height: 1.7;
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

  padding: 15px 18px;

  background: var(--navy);

  color: white;

  border-radius: 10px;

  font-size: 13px;

  font-weight: 900;

  letter-spacing: .06em;
}

/* =========================================================
   FOOTER
========================================================= */

.legalFooter {
  background: var(--navy);

  color: white;

  padding: 38px 28px;
}

.footerContent {
  width: min(1240px,100%);

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
}

.footerLegal p {
  margin: 0 0 10px;
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

/* =========================================================
   PEP + ESTADO DOCUMENTAL
========================================================= */

.pepExplanation {
  margin-bottom: 24px;
  padding: 22px;
  background: #f4f6f8;
  border: 1px solid #e0e5eb;
  border-radius: 13px;
}

.pepExplanation h3 {
  margin: 7px 0 10px;
  font-size: 23px;
}

.pepExplanation p {
  max-width: 900px;
  margin: 8px 0;
  color: var(--muted);
  line-height: 1.6;
}

.pepLabel {
  color: var(--gold);
  font-size: 11px;
  font-weight: 900;
  letter-spacing: .12em;
}

.pepChoice {
  min-height: 175px;
}

.pepDetails {
  margin: 5px 0 20px;
  padding: 22px;
  background: #fafafa;
  border: 1px solid var(--border);
  border-radius: 13px;
}

.field textarea {
  width: 100%;
  min-height: 105px;
  padding: 13px 15px;
  border: 1px solid #d1d8e2;
  border-radius: 10px;
  background: white;
  color: var(--text);
  font-size: 16px;
  resize: vertical;
  outline: none;
}

.field textarea:focus {
  border-color: var(--gold);
  box-shadow: 0 0 0 3px rgba(156,116,39,.09);
}

.uploadWrapper {
  margin-bottom: 13px;
}

.uploadWrapper .upload {
  margin-bottom: 0;
}

.uploadRejected {
  border-color: #d58a8a;
  background: #fffafa;
}

.uploadApproved {
  border-color: #add7c2;
  background: #fbfffd;
}

.uploadButtons {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}

.viewDocumentButton {
  border: 1px solid #c8d0db;
  background: white;
  color: var(--navy);
  padding: 8px 11px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
}

.viewDocumentButton:hover:not(:disabled) {
  border-color: var(--gold);
  color: #76591f;
}

.uploadActionLabel {
  position: relative;
  overflow: hidden;
  cursor: pointer;
}

.uploadActionLabel input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.documentStatus {
  display: inline-block;
  width: fit-content;
  margin-top: 3px;
  padding: 4px 7px;
  border-radius: 6px;
  font-size: 11px !important;
  font-weight: 850;
}

.documentPending {
  background: #fff4d6;
  color: #765b18 !important;
}

.documentApproved {
  background: #e8f5ee;
  color: #1c7554 !important;
}

.documentRejected {
  background: #fdecec;
  color: #923535 !important;
}

.documentUploading {
  background: #edf4fc;
  color: #315d8d !important;
}

.documentObservation {
  margin-top: 7px;
  padding: 10px 12px;
  background: #fdecec;
  color: #8f3434;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.45;
}

.uploadButtons {
  min-width: 210px;
}

/* =========================================================
   MOBILE
========================================================= */

@media (max-width: 820px) {

  .header {
    min-height: 66px;

    padding: 8px 14px;
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

    padding: 9px 12px;

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

    border: 1px solid var(--border);

    border-radius: 14px;

    box-shadow:
      0 20px 45px rgba(15,23,42,.16);
  }

  .mobileNavOpen .navButton,
  .mobileNavOpen .navCta,
  .mobileNavOpen .logoutButton {
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
    width: calc(100% - 26px);

    padding: 30px 0 65px;
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

    margin: 0 0 28px;
  }

  .mobileTrackerHeader {
    display: flex;

    justify-content: space-between;

    gap: 10px;

    margin-bottom: 9px;
  }

  .mobileTrackerHeader span {
    color: var(--muted);
  }

  .mobileProgress {
    width: 100%;

    height: 7px;

    overflow: hidden;

    background: #dfe3e8;

    border-radius: 20px;

    margin-bottom: 13px;
  }

  .mobileProgressFill {
    height: 100%;

    background: var(--gold);

    border-radius: 20px;
  }

  .mobileStepButtons {
    display: grid;

    grid-template-columns:
      repeat(6,1fr);

    gap: 6px;
  }

  .mobileStepButton {
    width: 100%;

    aspect-ratio: 1;

    max-height: 45px;

    border: 1px solid #d3dae4;

    background: white;

    color: #778397;

    border-radius: 9px;

    font-weight: 800;
  }

  .mobileStepCurrent {
    background: var(--navy);

    color: white;

    border-color: var(--navy);
  }

  .mobileStepCompleted {
    background: #e6f4ee;

    color: var(--green);

    border-color: #bddfce;
  }

  .mobileStepButton:disabled {
    opacity: .4;
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
    padding: 21px;
  }

  .formCard {
    max-width: none;
  }

  .simpleFlowCard {
    grid-template-columns:
      45px 1fr;

    gap: 10px 15px;

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

  .navigation {
    flex-direction: column-reverse;
  }

  .navigation button,
  .buttonRow button,
  .formAction button,
  .bottomAction button {
    width: 100%;
  }

  .upload {
    grid-template-columns:
      42px 1fr;
  }

  .uploadAction {
    display: none;
  }

  .uploadButtons {
    grid-column: 1 / -1;
    width: 100%;
    min-width: 0;
    justify-content: flex-start;
  }

  .viewDocumentButton,
  .uploadButtons .uploadActionLabel {
    display: inline-flex;
  }

  .statusCard {
    grid-template-columns: 1fr;

    gap: 18px;

    padding: 21px;
  }

  .summaryCard {
    min-height: 105px;
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

  .loginPrompt {
    flex-direction: column;

    align-items: flex-start;
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
