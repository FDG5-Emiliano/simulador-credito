import { createClient } from "@supabase/supabase-js";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

const RECA =
  "17307-439-043916/01-01273-0626";


/* =========================================================
   API
========================================================= */

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Método no permitido.",
    });
  }

  try {

    /* =====================================================
       AUTENTICACIÓN
    ===================================================== */

    const authorization =
      req.headers.authorization;

    if (!authorization) {
      return res.status(401).json({
        error: "No se recibió sesión.",
      });
    }

    const token =
      authorization.replace(
        "Bearer ",
        ""
      );

    const {
      data: authData,
      error: authError,
    } =
      await supabaseAdmin.auth.getUser(
        token
      );

    if (
      authError ||
      !authData?.user
    ) {
      return res.status(401).json({
        error:
          "La sesión no es válida.",
      });
    }

    const usuario =
      authData.user;

    const {
      aplicacion_id,
    } = req.body || {};

    if (!aplicacion_id) {
      return res.status(400).json({
        error:
          "Falta aplicacion_id.",
      });
    }


    /* =====================================================
       APLICACIÓN
    ===================================================== */

    const {
      data: aplicacion,
      error: errorAplicacion,
    } =
      await supabaseAdmin
        .from("Aplicaciones")
        .select("*")
        .eq("id", aplicacion_id)
        .single();

    if (
      errorAplicacion ||
      !aplicacion
    ) {
      throw new Error(
        "No se encontró la aplicación."
      );
    }


    /* =====================================================
       PERMISOS
    ===================================================== */

    const esPropietario =
      aplicacion.user_id ===
      usuario.id;

    const {
      data: interno,
    } =
      await supabaseAdmin
        .from("UsuariosInternos")
        .select("id")
        .eq("id", usuario.id)
        .eq("activo", true)
        .maybeSingle();

    if (
      !esPropietario &&
      !interno
    ) {
      return res.status(403).json({
        error:
          "No tienes permiso sobre esta operación.",
      });
    }


    /* =====================================================
       DECISIÓN
    ===================================================== */

    const {
      data: decision,
      error: errorDecision,
    } =
      await supabaseAdmin
        .from("DecisionesCredito")
        .select("*")
        .eq(
          "aplicacion_id",
          aplicacion_id
        )
        .single();

    if (
      errorDecision ||
      !decision
    ) {
      throw new Error(
        "No existe decisión de crédito."
      );
    }

    if (
      decision.decision !==
      "APPROVED"
    ) {
      throw new Error(
        "La solicitud no está aprobada."
      );
    }


    /* =====================================================
       CONTRATO
    ===================================================== */

    const {
      data: contrato,
      error: errorContrato,
    } =
      await supabaseAdmin
        .from("Contratos")
        .select("*")
        .eq(
          "aplicacion_id",
          aplicacion_id
        )
        .single();

    if (
      errorContrato ||
      !contrato
    ) {
      throw new Error(
        "Primero debe generarse el contrato y calendario."
      );
    }


    /* =====================================================
       CUENTA BANCARIA
    ===================================================== */

    const {
      data: cuenta,
    } =
      await supabaseAdmin
        .from("CuentasBancarias")
        .select("*")
        .eq(
          "aplicacion_id",
          aplicacion_id
        )
        .maybeSingle();


    /* =====================================================
       CALENDARIO
    ===================================================== */

    const {
      data: calendario,
      error: errorCalendario,
    } =
      await supabaseAdmin
        .from("CalendarioPagos")
        .select("*")
        .eq(
          "credito_id",
          contrato.credito_id
        )
        .order(
          "numero_pago",
          {
            ascending: true,
          }
        );

    if (errorCalendario) {
      throw errorCalendario;
    }


    /* =====================================================
       CONFIGURACIÓN INSTITUCIONAL
    ===================================================== */

    const {
      data: configuracion,
      error: errorConfig,
    } =
      await supabaseAdmin
        .from(
          "ConfiguracionContractual"
        )
        .select(
          "clave, valor"
        );

    if (errorConfig) {
      throw errorConfig;
    }

    const config = {};

    for (
      const fila of
      configuracion || []
    ) {
      config[fila.clave] =
        fila.valor;
    }


    /* =====================================================
       PLANTILLAS
    ===================================================== */

    const {
      data: plantillas,
      error: errorPlantillas,
    } =
      await supabaseAdmin
        .from(
          "PlantillasContractuales"
        )
        .select("*")
        .eq(
          "version",
          "1.0"
        )
        .eq(
          "activa",
          true
        );

    if (errorPlantillas) {
      throw errorPlantillas;
    }


    /* =====================================================
       DATOS DEL CLIENTE
    ===================================================== */

    const borrador =
      aplicacion.datos_borrador || {};

    const datos =
      borrador.datos || {};

    const nombreAcreditado =
      datos.tipoPersona === "moral"
        ? datos.razonSocial || ""
        : [
            datos.nombre,
            datos.apellidoPaterno,
            datos.apellidoMaterno,
          ]
            .filter(Boolean)
            .join(" ");


    /* =====================================================
       DATOS CONTRACTUALES
    ===================================================== */

    const tasaOrdinaria =
      Number(
        decision.tasa_anual ||
        contrato.tasa_ordinaria ||
        0
      );

    const tasaMoratoria =
      Number(
        decision.tasa_moratoria ||
        contrato.tasa_moratoria ||
        (
          tasaOrdinaria * 1.5
        )
      );

    const monto =
      Number(
        contrato.monto_contratado ||
        decision.monto_aprobado ||
        0
      );

    const plazo =
      Number(
        contrato.plazo_meses ||
        decision.plazo_aprobado ||
        0
      );

    const montoTotal =
      Number(
        contrato.monto_total_pagar ||
        0
      );


    /* =====================================================
       MAPA DE VARIABLES
    ===================================================== */

    const variables = {

      RECA,

      NUMERO_CREDITO:
        contrato.numero_credito || "",

      NOMBRE_ACREDITADO:
        nombreAcreditado,

      RFC:
        datos.rfc || "",

      CURP:
        datos.curp || "",

      CORREO:
        datos.correo ||
        usuario.email ||
        "",

      TELEFONO:
        datos.celular || "",

      DOMICILIO:
        construirDomicilio(datos),

        CALLE_NUMERO: [
  datos.calle,
  datos.numeroExterior,
].filter(Boolean).join(" "),

COLONIA:
  datos.colonia || "",

MUNICIPIO:
  datos.municipio || "",

ESTADO:
  datos.estado || "",

CP:
  datos.cp || "",

      MONTO_CREDITO:
        formatoMoneda(monto),

      MONTO_LETRA:
        numeroALetras(monto),

      MONTO_TOTAL:
        formatoMoneda(
          montoTotal
        ),

      PLAZO_MESES:
        plazo,

      NUMERO_PAGOS:
        calendario?.length ||
        plazo,

      TASA_ORDINARIA:
        tasaOrdinaria.toFixed(2),

      TASA_MORATORIA:
        tasaMoratoria.toFixed(2),

      CAT:
        Number(
          decision.cat || 0
        ).toFixed(1),

      COMISION_APERTURA:
        Number(
          decision.comision_apertura ||
          0
        ).toFixed(2),

      PERIODICIDAD:
        contrato.periodicidad ||
        "MENSUAL",

      FECHA_PRIMER_PAGO:
        fechaLarga(
          contrato.fecha_primer_pago
        ),

      FECHA_VENCIMIENTO:
        fechaLarga(
          contrato.fecha_vencimiento
        ),

      DESTINO:
        datos.destino || "",

      BANCO:
        cuenta?.banco || "",

      CLABE:
        cuenta?.clabe || "",

      CLABE_ULTIMOS_4:
        cuenta?.ultimos_4 ||
        "",

      TITULAR_CUENTA:
        cuenta?.titular ||
        nombreAcreditado,

      /* Institucional */

      RAZON_SOCIAL:
        config.RAZON_SOCIAL ||
        "FDG5 SERVICIOS, S.A. DE C.V., SOFOM, E.N.R.",

      RFC_ACREDITANTE:
        config.RFC_ACREDITANTE ||
        "",

      FOLIO_MERCANTIL:
        config.FOLIO_MERCANTIL ||
        "",

      ESCRITURA_CONSTITUTIVA:
        config.ESCRITURA_CONSTITUTIVA ||
        "",

      FECHA_ESCRITURA_CONSTITUTIVA:
        fechaLarga(
          config.FECHA_ESCRITURA_CONSTITUTIVA
        ),

      FECHA_INSCRIPCION_RPC:
        fechaLarga(
          config.FECHA_INSCRIPCION_RPC_CONSTITUCION
        ),

      ESCRITURA_PODER:
        config.ESCRITURA_PODER ||
        "",

      FECHA_PODER:
        fechaLarga(
          config.FECHA_PODER
        ),

      NOTARIO_PODER:
        config.NOTARIO_PODER ||
        "",

      NUMERO_NOTARIA:
        config.NUMERO_NOTARIA ||
        "",

      PLAZA_NOTARIA:
        config.PLAZA_NOTARIA ||
        "",

      REPRESENTANTE_LEGAL:
        config.REPRESENTANTE_LEGAL ||
        "",

      TELEFONO_UNE:
        config.TELEFONO_UNE ||
        "",

      CORREO_UNE:
        config.CORREO_UNE ||
        "",

      DOMICILIO_UNE:
        config.DOMICILIO_UNE ||
        "",

      HORARIO_UNE:
        config.HORARIO_UNE ||
        "",

      FUERO:
        config.FUERO ||
        "COMÚN",

      CIUDAD_JURISDICCION:
        config.CIUDAD_JURISDICCION ||
        "Saltillo",

      ESTADO_JURISDICCION:
        config.ESTADO_JURISDICCION ||
        "Coahuila de Zaragoza",

      CIUDAD_FIRMA:
        config.CIUDAD_FIRMA ||
        "Saltillo",

      ESTADO_FIRMA:
        config.ESTADO_FIRMA ||
        "Coahuila de Zaragoza",

      FECHA_ELABORACION:
        fechaLarga(
          new Date()
            .toISOString()
            .slice(0, 10)
        ),
    };


    /* =====================================================
       GENERAR DOCX
    ===================================================== */

    const documentosGenerados =
      [];

    for (
      const plantilla of
      plantillas || []
    ) {

      /*
        La carátula es PDF y la vamos a
        resolver en el siguiente bloque.

        En esta primera ejecución generamos
        los DOCX reales.
      */

      if (
        !plantilla.storage_path
          ?.toLowerCase()
          .endsWith(".docx")
      ) {
        continue;
      }

      const {
        data: archivoPlantilla,
        error: errorDescarga,
      } =
        await supabaseAdmin
          .storage
          .from(
            "plantillas-contractuales"
          )
          .download(
            plantilla.storage_path
          );

      if (errorDescarga) {
        throw new Error(
          `No se pudo descargar ${plantilla.tipo_documento}: ${errorDescarga.message}`
        );
      }


      const arrayBuffer =
        await archivoPlantilla.arrayBuffer();

      const buffer =
        Buffer.from(
          arrayBuffer
        );


      /*
        Generamos el DOCX.

        Delimitadores adaptados para:
        {{VARIABLE}}
      */

      const zip =
        new PizZip(buffer);

      const doc =
        new Docxtemplater(
          zip,
          {
            paragraphLoop: true,
            linebreaks: true,
            delimiters: {
              start: "{{",
              end: "}}",
            },
          }
        );


      const dataDocumento = {
        ...variables,

        PAGOS:
          (calendario || []).map(
            (pago) => ({
              numero:
                pago.numero_pago,

              fecha:
                fechaCorta(
                  pago.fecha_vencimiento
                ),

              principal:
                formatoMoneda(
                  pago.capital
                ),

              interes:
                formatoMoneda(
                  pago.interes
                ),

              iva_interes:
                formatoMoneda(
                  pago.iva_interes
                ),

              comisiones:
                formatoMoneda(
                  Number(
                    pago.comisiones || 0
                  ) +
                  Number(
                    pago.iva_comision || 0
                  )
                ),

              total:
                formatoMoneda(
                  pago.pago_total
                ),

              saldo:
                formatoMoneda(
                  pago.saldo_insoluto ??
                  0
                ),
            })
          ),
      };


      doc.render(
        dataDocumento
      );


      const output =
        doc
          .getZip()
          .generate({
            type: "nodebuffer",
            compression: "DEFLATE",
          });


      const nombre =
        `${plantilla.tipo_documento}_${contrato.numero_credito}.docx`;

      const storagePath =
        `${usuario.id}/${aplicacion_id}/${contrato.id}/${nombre}`;


      const {
        error: errorSubida,
      } =
        await supabaseAdmin
          .storage
          .from(
            "expedientes-contractuales"
          )
          .upload(
            storagePath,
            output,
            {
              contentType:
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

              upsert: true,
            }
          );

      if (errorSubida) {
        throw new Error(
          `No se pudo guardar ${nombre}: ${errorSubida.message}`
        );
      }


      /* ===============================================
         REGISTRO DEL DOCUMENTO
      =============================================== */

      const {
        data:
          documentoExistente,
      } =
        await supabaseAdmin
          .from(
            "ContratosDocumentos"
          )
          .select("id")
          .eq(
            "contrato_id",
            contrato.id
          )
          .eq(
            "tipo_documento",
            plantilla.tipo_documento
          )
          .maybeSingle();


      let registro;

      if (documentoExistente) {

        const {
          data,
          error,
        } =
          await supabaseAdmin
            .from(
              "ContratosDocumentos"
            )
            .update({
              nombre_archivo:
                nombre,

              storage_path:
                storagePath,

              estado:
                "GENERATED",

              requiere_firma:
                plantilla.requiere_firma,

              version:
                "1.0",

              updated_at:
                new Date()
                  .toISOString(),
            })
            .eq(
              "id",
              documentoExistente.id
            )
            .select("*")
            .single();

        if (error) {
          throw error;
        }

        registro = data;

      } else {

        const {
          data,
          error,
        } =
          await supabaseAdmin
            .from(
              "ContratosDocumentos"
            )
            .insert({
              contrato_id:
                contrato.id,

              tipo_documento:
                plantilla.tipo_documento,

              nombre_archivo:
                nombre,

              storage_path:
                storagePath,

              estado:
                "GENERATED",

              requiere_firma:
                plantilla.requiere_firma,

              version:
                "1.0",

              firmado:
                false,
            })
            .select("*")
            .single();

        if (error) {
          throw error;
        }

        registro = data;
      }


      documentosGenerados.push(
        registro
      );
    }


    return res.status(200).json({

      ok: true,

      contrato_id:
        contrato.id,

      numero_credito:
        contrato.numero_credito,

      documentos:
        documentosGenerados,

      pendientes: [
        "CARATULA_PDF",
        "CONVERSION_DOCX_A_PDF",
      ],

      mensaje:
        "Las plantillas DOCX se generaron correctamente.",
    });


  } catch (error) {

    console.error(
      "GENERAR DOCUMENTOS:",
      error
    );

    return res.status(500).json({
      error:
        error?.message ||
        "Error generando documentos.",
    });
  }
}


/* =========================================================
   HELPERS
========================================================= */

function formatoMoneda(valor) {

  const numero =
    Number(valor || 0);

  return numero.toLocaleString(
    "es-MX",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  );
}


function fechaCorta(valor) {

  if (!valor) {
    return "";
  }

  const fecha =
    new Date(
      `${valor}T12:00:00`
    );

  return fecha.toLocaleDateString(
    "es-MX"
  );
}


function fechaLarga(valor) {

  if (!valor) {
    return "";
  }

  const fecha =
    new Date(
      `${valor}T12:00:00`
    );

  return fecha.toLocaleDateString(
    "es-MX",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );
}


function construirDomicilio(datos) {
  const partes = [
    datos.calle,
    datos.numeroExterior,
    datos.numeroInterior,
    datos.colonia,
    datos.cp,
    datos.municipio,
    datos.estado,
  ];

  return partes
    .filter(Boolean)
    .join(", ");
}


/*
  Versión inicial.

  Más adelante podemos sustituirla
  por un conversor completo de
  número a letra en español.
*/

function numeroALetras(numero) {

  const valor =
    Number(numero || 0);

  return `${formatoMoneda(valor)} PESOS`;
}