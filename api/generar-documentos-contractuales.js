import { createClient } from "@supabase/supabase-js";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import crypto from "crypto";
import CloudConvert from "cloudconvert";

/* =========================================================
   CONFIG
========================================================= */

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

const cloudConvert = new CloudConvert(
  process.env.CLOUDCONVERT_API_KEY
);

/* =========================================================
   API
========================================================= */

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "Método no permitido.",
    });
  }

  try {
    /* =====================================================
       1. AUTENTICACIÓN
    ===================================================== */

    const authorization =
      req.headers.authorization || "";

    const token =
      authorization.startsWith("Bearer ")
        ? authorization.slice(7)
        : null;

    if (!token) {
      return res.status(401).json({
        ok: false,
        error: "No se recibió una sesión válida.",
      });
    }

    const {
      data: authData,
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (
      authError ||
      !authData?.user
    ) {
      return res.status(401).json({
        ok: false,
        error: "La sesión no es válida.",
      });
    }

    const usuario = authData.user;

    /* =====================================================
       2. INPUT
    ===================================================== */

    const {
      aplicacion_id,
      application_id,
      contract_id,
    } = req.body || {};

    if (
      !aplicacion_id &&
      !application_id &&
      !contract_id
    ) {
      return res.status(400).json({
        ok: false,
        error:
          "Debe enviarse aplicacion_id, application_id o contract_id.",
      });
    }

    /* =====================================================
       3. RESOLVER APPLICATION
    ===================================================== */

    let application = null;

    if (application_id) {
      const {
        data,
        error,
      } = await supabaseAdmin
        .schema("origination")
        .from("credit_applications")
        .select("*")
        .eq("id", application_id)
        .maybeSingle();

      if (error) {
        throw error;
      }

      application = data;
    }

    if (
      !application &&
      aplicacion_id
    ) {
      const {
        data,
        error,
      } = await supabaseAdmin
        .schema("origination")
        .from("credit_applications")
        .select("*")
        .eq(
          "legacy_application_id",
          aplicacion_id
        )
        .maybeSingle();

      if (error) {
        throw error;
      }

      application = data;
    }

    /* =====================================================
       4. RESOLVER CONTRATO
    ===================================================== */

    let contract = null;

    if (contract_id) {
      const {
        data,
        error,
      } = await supabaseAdmin
        .schema("contracts")
        .from("contracts")
        .select("*")
        .eq("id", contract_id)
        .maybeSingle();

      if (error) {
        throw error;
      }

      contract = data;
    } else if (application) {
      const {
        data,
        error,
      } = await supabaseAdmin
        .schema("contracts")
        .from("contracts")
        .select("*")
        .eq(
          "application_id",
          application.id
        )
        .order(
          "created_at",
          {
            ascending: false,
          }
        )
        .limit(1)
        .maybeSingle();

      if (error) {
        throw error;
      }

      contract = data;
    }

    if (!contract) {
      return res.status(404).json({
        ok: false,
        error:
          "No existe un contrato normalizado para esta solicitud.",
      });
    }

    if (!application) {
      const {
        data,
        error,
      } = await supabaseAdmin
        .schema("origination")
        .from("credit_applications")
        .select("*")
        .eq(
          "id",
          contract.application_id
        )
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        return res.status(404).json({
          ok: false,
          error:
            "No existe la aplicación normalizada asociada al contrato.",
        });
      }

      application = data;
    }

    /* =====================================================
       5. VALIDAR PROPIEDAD
    ===================================================== */

    const {
      data: borrower,
      error: borrowerError,
    } = await supabaseAdmin
      .schema("core")
      .from("parties")
      .select(
        "id, auth_user_id, display_name"
      )
      .eq(
        "id",
        application.borrower_party_id
      )
      .maybeSingle();

    if (borrowerError) {
      throw borrowerError;
    }

    if (!borrower) {
      return res.status(404).json({
        ok: false,
        error:
          "No existe el acreditado normalizado asociado a esta solicitud.",
      });
    }

    if (
      borrower.auth_user_id !==
      usuario.id
    ) {
      return res.status(403).json({
        ok: false,
        error:
          "No tienes permiso para generar documentos de esta operación.",
      });
    }

    /* =====================================================
       6. SNAPSHOT VIGENTE

       IMPORTANTE:
       usamos maybeSingle porque un contrato DRAFT puede existir
       antes de que se haya preparado su snapshot.

       No permitimos que PostgREST devuelva PGRST116 al cliente.
    ===================================================== */

    const {
      data: snapshot,
      error: snapshotError,
    } = await supabaseAdmin
      .schema("contracts")
      .from("contract_snapshots")
      .select(
        `
        id,
        contract_id,
        snapshot_version,
        schema_version,
        sha256,
        snapshot_data,
        created_at
        `
      )
      .eq(
        "contract_id",
        contract.id
      )
      .order(
        "snapshot_version",
        {
          ascending: false,
        }
      )
      .limit(1)
      .maybeSingle();

    if (snapshotError) {
      throw snapshotError;
    }

    if (!snapshot) {
      return res.status(409).json({
        ok: false,
        code: "CONTRACT_SNAPSHOT_MISSING",
        error:
          "El expediente contractual todavía no ha sido preparado.",
        contract_id:
          contract.id,
        contract_number:
          contract.contract_number,
      });
    }

    if (!snapshot.snapshot_data) {
      return res.status(409).json({
        ok: false,
        code: "CONTRACT_SNAPSHOT_EMPTY",
        error:
          "El expediente contractual no contiene información para generar documentos.",
        snapshot_id:
          snapshot.id,
      });
    }

    const S =
      snapshot.snapshot_data;

    /* =====================================================
       7. VALIDAR SNAPSHOT
    ===================================================== */

    if (
      String(
        snapshot.schema_version ||
        S.schema_version ||
        ""
      ) !== "2.0"
    ) {
      return res.status(409).json({
        ok: false,
        code:
          "CONTRACT_SNAPSHOT_VERSION_UNSUPPORTED",
        error:
          "El expediente contractual no tiene la versión requerida para generar documentos.",
        snapshot_version:
          snapshot.snapshot_version,
        schema_version:
          snapshot.schema_version ||
          S.schema_version ||
          null,
      });
    }

    if (
      !Array.isArray(
        S.payment_schedule
      )
    ) {
      return res.status(409).json({
        ok: false,
        code:
          "PAYMENT_SCHEDULE_MISSING",
        error:
          "El expediente contractual no contiene la tabla de amortización.",
      });
    }

    if (
      S.payment_schedule.length === 0
    ) {
      return res.status(409).json({
        ok: false,
        code:
          "PAYMENT_SCHEDULE_EMPTY",
        error:
          "La tabla de amortización contractual está vacía.",
      });
    }

    /* =====================================================
       8. MODELO SEMÁNTICO
    ===================================================== */

    const semantic =
      normalizeContractualModel(
        buildSemanticModel(S)
      );

    /* =====================================================
       9. PLANTILLAS
    ===================================================== */

    const {
      data: templates,
      error: templatesError,
    } = await supabaseAdmin
      .from("PlantillasContractuales")
      .select("*")
      .eq("activa", true)
      .order(
        "tipo_documento",
        {
          ascending: true,
        }
      );

    if (templatesError) {
      throw templatesError;
    }

    const borrowerPartyType =
      String(
        S.borrower?.party_type || ""
      ).toUpperCase();

    const contractTemplateType =
      borrowerPartyType ===
      "ORGANIZATION"
        ? "CONTRATO_PM"
        : "CONTRATO_PF";

    const docxTemplates =
      (templates || []).filter(
        (template) => {
          const isDocx =
            template.storage_path
              ?.toLowerCase()
              .endsWith(".docx");

          if (!isDocx) {
            return false;
          }

          if (
            template.tipo_documento ===
              "CONTRATO_PF" ||
            template.tipo_documento ===
              "CONTRATO_PM"
          ) {
            return (
              template.tipo_documento ===
              contractTemplateType
            );
          }

          return true;
        }
      );

    if (docxTemplates.length === 0) {
      return res.status(409).json({
        ok: false,
        code:
          "NO_ACTIVE_CONTRACT_TEMPLATES",
        error:
          "No existen plantillas contractuales activas para esta operación.",
      });
    }

    /* =====================================================
       10. GENERACIÓN IDEMPOTENTE
    ===================================================== */

    const generatedDocuments = [];
    const skippedDocuments = [];

    for (
      const template of
      docxTemplates
    ) {
      const templateVersion =
        String(
          template.version || ""
        );

      /* ===================================================
         EVITAR DUPLICADOS
      =================================================== */

      const {
        data: existing,
        error: existingError,
      } = await supabaseAdmin
        .schema("contracts")
        .from("contract_documents")
        .select(
          `
          id,
          document_type,
          document_version,
          template_version,
          snapshot_id,
          storage_path,
          status,
          generated_at
          `
        )
        .eq(
          "contract_id",
          contract.id
        )
        .eq(
          "snapshot_id",
          snapshot.id
        )
        .eq(
          "document_type",
          template.tipo_documento
        )
        .eq(
          "template_version",
          templateVersion
        )
        .order(
          "document_version",
          {
            ascending: false,
          }
        )
        .limit(1)
        .maybeSingle();

      if (existingError) {
        throw existingError;
      }

      if (
        existing &&
        existing.status ===
          "GENERATED"
      ) {
        skippedDocuments.push({
          id: existing.id,
          type:
            existing.document_type,
          version:
            existing.document_version,
          reason:
            "ALREADY_GENERATED_FOR_SNAPSHOT",
          storage_path:
            existing.storage_path,
        });

        continue;
      }

      /* ===================================================
         DESCARGAR PLANTILLA
      =================================================== */

      const {
        data: templateBlob,
        error: downloadError,
      } = await supabaseAdmin
        .storage
        .from(
          "plantillas-contractuales"
        )
        .download(
          template.storage_path
        );

      if (downloadError) {
        throw new Error(
          `No se pudo descargar la plantilla ${template.tipo_documento}: ${downloadError.message}`
        );
      }

      if (!templateBlob) {
        throw new Error(
          `La plantilla ${template.tipo_documento} no contiene datos.`
        );
      }

      const templateBuffer =
        Buffer.from(
          await templateBlob.arrayBuffer()
        );

      /* ===================================================
         RENDER DOCX
      =================================================== */

      const zip =
        new PizZip(
          templateBuffer
        );

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

            nullGetter() {
              return "";
            },
          }
        );

      const templateData = {
        ...semantic,

        PAGOS:
          semantic.PAYMENT_SCHEDULE,
      };

      doc.render(
        templateData
      );

      const docxBuffer =
        doc
          .getZip()
          .generate({
            type: "nodebuffer",
            compression:
              "DEFLATE",
          });

      /* ===================================================
         VERSIÓN DOCUMENTAL
      =================================================== */

      const {
        data:
          previousDocuments,
        error:
          previousError,
      } = await supabaseAdmin
        .schema("contracts")
        .from(
          "contract_documents"
        )
        .select(
          "document_version"
        )
        .eq(
          "contract_id",
          contract.id
        )
        .eq(
          "document_type",
          template.tipo_documento
        )
        .order(
          "document_version",
          {
            ascending: false,
          }
        )
        .limit(1);

      if (previousError) {
        throw previousError;
      }

      const documentVersion =
        previousDocuments?.length
          ? Number(
              previousDocuments[0]
                .document_version
            ) + 1
          : 1;

      /* ===================================================
         NOMBRE DE CRÉDITO
      =================================================== */

      const loanNumber =
        S.contract
          ?.legacy_credit_number ||
        contract.legacy_credit_number ||
        contract.contract_number;

      if (!loanNumber) {
        throw new Error(
          "No existe un número contractual para nombrar los documentos."
        );
      }

      const docxFilename =
        `${template.tipo_documento}_${loanNumber}_v${documentVersion}.docx`;

      /* ===================================================
         DOCX -> PDF
      =================================================== */

      const pdfBuffer =
        await convertDocxToPdf(
          docxBuffer,
          docxFilename
        );

      /* ===================================================
         HASH PDF
      =================================================== */

      const fileHash =
        crypto
          .createHash("sha256")
          .update(pdfBuffer)
          .digest("hex");

      const pdfFilename =
        `${template.tipo_documento}_${loanNumber}_v${documentVersion}.pdf`;

      const storagePath =
        [
          "contracts",
          contract.id,
          `snapshot-${snapshot.snapshot_version}`,
          pdfFilename,
        ].join("/");

      /* ===================================================
         GUARDAR PDF
      =================================================== */

      const {
        error: uploadError,
      } = await supabaseAdmin
        .storage
        .from(
          "expedientes-contractuales"
        )
        .upload(
          storagePath,
          pdfBuffer,
          {
            contentType:
              "application/pdf",
            upsert: false,
          }
        );

      if (uploadError) {
        throw new Error(
          `No se pudo guardar ${pdfFilename}: ${uploadError.message}`
        );
      }

      /* ===================================================
         REGISTRAR DOCUMENTO
      =================================================== */

      const {
        data:
          registeredDocument,
        error:
          documentError,
      } = await supabaseAdmin
        .schema("contracts")
        .from(
          "contract_documents"
        )
        .insert({
          contract_id:
            contract.id,

          snapshot_id:
            snapshot.id,

          document_type:
            template.tipo_documento,

          document_version:
            documentVersion,

          template_version:
            templateVersion,

          storage_path:
            storagePath,

          file_hash:
            fileHash,

          status:
            "GENERATED",

          requires_signature:
            Boolean(
              template.requiere_firma
            ),

          generated_at:
            new Date()
              .toISOString(),
        })
        .select("*")
        .maybeSingle();

      if (
        documentError ||
        !registeredDocument
      ) {
        await supabaseAdmin
          .storage
          .from(
            "expedientes-contractuales"
          )
          .remove([
            storagePath,
          ]);

        if (documentError) {
          throw documentError;
        }

        throw new Error(
          `No se pudo registrar ${pdfFilename}.`
        );
      }

      /* ===================================================
         AUDITORÍA
      =================================================== */

      const {
        error: eventError,
      } = await supabaseAdmin
        .schema("audit")
        .from(
          "business_events"
        )
        .insert({
          aggregate_type:
            "CONTRACT",

          aggregate_id:
            contract.id,

          event_type:
            "CONTRACT_DOCUMENT_GENERATED",

          actor_type:
            "CUSTOMER",

          actor_id:
            usuario.id,

          source:
            "TRISAL_DOCUMENT_GENERATOR_V6",

          payload: {
            document_id:
              registeredDocument.id,

            document_type:
              template.tipo_documento,

            document_version:
              documentVersion,

            snapshot_id:
              snapshot.id,

            snapshot_version:
              snapshot.snapshot_version,

            template_version:
              templateVersion,

            storage_path:
              storagePath,

            mime_type:
              "application/pdf",

            sha256:
              fileHash,
          },
        });

      if (eventError) {
        throw eventError;
      }

      generatedDocuments.push({
        id:
          registeredDocument.id,

        type:
          template.tipo_documento,

        tipo:
          template.tipo_documento,

        document_type:
          template.tipo_documento,

        version:
          documentVersion,

        template_version:
          templateVersion,

        filename:
          pdfFilename,

        storage_path:
          storagePath,

        mime_type:
          "application/pdf",

        sha256:
          fileHash,

        requires_signature:
          Boolean(
            template.requiere_firma
          ),
      });
    }

    /* =====================================================
       11. ACTUALIZAR CONTRATO
    ===================================================== */

    const {
      error:
        contractUpdateError,
    } = await supabaseAdmin
      .schema("contracts")
      .from("contracts")
      .update({
        contract_status:
          "GENERATED",

        updated_at:
          new Date()
            .toISOString(),
      })
      .eq(
        "id",
        contract.id
      );

    if (contractUpdateError) {
      throw contractUpdateError;
    }

    /* =====================================================
       12. RESPUESTA
    ===================================================== */

    return res.status(200).json({
      ok: true,

      architecture:
        "SNAPSHOT_V6",

      contract_id:
        contract.id,

      contract_number:
        contract.contract_number,

      loan_number:
        S.contract
          ?.legacy_credit_number ||
        contract.legacy_credit_number ||
        contract.contract_number,

      snapshot_id:
        snapshot.id,

      snapshot_version:
        snapshot.snapshot_version,

      snapshot_sha256:
        snapshot.sha256,

      documents:
        generatedDocuments,

      skipped:
        skippedDocuments,

      generated_count:
        generatedDocuments.length,

      skipped_count:
        skippedDocuments.length,

      message:
        generatedDocuments.length > 0
          ? `${generatedDocuments.length} documentos PDF fueron generados.`
          : "Los documentos de este snapshot ya habían sido generados.",
    });
  } catch (error) {
    console.error(
      "TRISAL DOCUMENT GENERATOR V6:",
      error
    );

    return res.status(500).json({
      ok: false,

      error:
        error?.message ||
        "No se pudieron generar los documentos contractuales.",
    });
  }
}

/* =========================================================
   DOCX -> PDF
========================================================= */

async function convertDocxToPdf(
  docxBuffer,
  filename
) {
  if (
    !process.env
      .CLOUDCONVERT_API_KEY
  ) {
    throw new Error(
      "Falta CLOUDCONVERT_API_KEY en las variables de entorno."
    );
  }

  let job =
    await cloudConvert.jobs.create({
      tasks: {
        "import-docx": {
          operation:
            "import/base64",

          file:
            docxBuffer.toString(
              "base64"
            ),

          filename,
        },

        "convert-pdf": {
          operation:
            "convert",

          input:
            "import-docx",

          input_format:
            "docx",

          output_format:
            "pdf",
        },

        "export-pdf": {
          operation:
            "export/url",

          input:
            "convert-pdf",
        },
      },
    });

  job =
    await cloudConvert.jobs.wait(
      job.id
    );

  if (
    job.status !== "finished"
  ) {
    throw new Error(
      "CloudConvert no pudo convertir el documento a PDF."
    );
  }

  const files =
    cloudConvert.jobs
      .getExportUrls(job);

  const pdfFile =
    files?.[0];

  if (!pdfFile?.url) {
    throw new Error(
      "CloudConvert no devolvió el PDF convertido."
    );
  }

  const response =
    await fetch(
      pdfFile.url
    );

  if (!response.ok) {
    throw new Error(
      `No se pudo descargar el PDF convertido (${response.status}).`
    );
  }

  const arrayBuffer =
    await response.arrayBuffer();

  return Buffer.from(
    arrayBuffer
  );
}

/* =========================================================
   SEMANTIC MODEL
========================================================= */

function buildSemanticModel(S) {
  const borrower =
    S.borrower || {};

  const person =
    borrower.person || {};

  const organization =
    borrower.organization || {};

  const identifiers =
    Array.isArray(S.identifiers)
      ? S.identifiers
      : [];

  const addresses =
    Array.isArray(S.addresses)
      ? S.addresses
      : [];

  const contacts =
    Array.isArray(S.contacts)
      ? S.contacts
      : [];

  const bankAccounts =
    Array.isArray(
      S.bank_accounts
    )
      ? S.bank_accounts
      : [];

  const institution =
    S.institution || {};

  const terms =
    S.credit_terms || {};

  const contract =
    S.contract || {};

  const legacyTerms =
    S.legacy_contract_terms ||
    {};

  const schedule =
    Array.isArray(
      S.payment_schedule
    )
      ? S.payment_schedule
      : [];

  /* IDENTIFICADORES */

  const rfc =
    findIdentifier(
      identifiers,
      "RFC"
    );

  const curp =
    findIdentifier(
      identifiers,
      "CURP"
    );

  /* CONTACTOS */

  const email =
    findContact(
      contacts,
      "EMAIL"
    );

  const phone =
    findContact(
      contacts,
      "MOBILE"
    ) ||
    findContact(
      contacts,
      "PHONE"
    );

  /* DOMICILIO */

  const address =
    addresses.find(
      (x) =>
        x.type ===
        "NOTIFICATION"
    ) ||
    addresses.find(
      (x) =>
        x.type ===
        "FISCAL"
    ) ||
    addresses.find(
      (x) =>
        x.type ===
        "HOME"
    ) ||
    addresses[0] ||
    {};

  /* CUENTA BANCARIA */

  const bank =
    bankAccounts.find(
      (x) =>
        x.purpose ===
        "DISBURSEMENT"
    ) ||
    bankAccounts.find(
      (x) =>
        x.purpose ===
        "COLLECTION"
    ) ||
    bankAccounts[0] ||
    {};

  /* TASAS */

  const annualRate =
    numberOrNull(
      terms.annual_rate
    );

  const moratoryRate =
    numberOrNull(
      terms.moratory_rate
    );

  const catRate =
    numberOrNull(
      terms.cat_rate
    );

  const openingFeeRate =
    numberOrNull(
      terms.opening_fee_rate
    );

  /* FECHA */

  const today =
    new Date();

  const monthNames = [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
  ];

  /* TABLA */

  const paymentSchedule =
    schedule.map(
      (row) => {
        const saldoInicial =
          Number(
            row.opening_balance || 0
          );

        const principal =
          Number(
            row.principal_due || 0
          );

        const interes =
          Number(
            row.interest_due || 0
          );

        const ivaInteres =
          Number(
            row.vat_interest_due || 0
          );

        const comision =
          Number(
            row.fees_due || 0
          );

        const ivaComision =
          Number(
            row.vat_fees_due || 0
          );

        const total =
          Number(
            row.total_due || 0
          );

        const saldoFinal =
          Math.max(
            0,
            saldoInicial -
              principal
          );

        const comisionesConIva =
          comision +
          ivaComision;

        return {
          numero:
            row.installment_number,

          fecha:
            formatDateShort(
              row.due_date
            ),

          saldo_inicial:
            formatMoney(
              saldoInicial
            ),

          principal:
            formatMoney(
              principal
            ),

          interes:
            formatMoney(
              interes
            ),

          iva_interes:
            formatMoney(
              ivaInteres
            ),

          comisiones:
            formatMoney(
              comision
            ),

          iva_comision:
            formatMoney(
              ivaComision
            ),

          comisiones_con_iva:
            formatMoney(
              comisionesConIva
            ),

          total:
            formatMoney(
              total
            ),

          saldo_final:
            formatMoney(
              saldoFinal
            ),
        };
      }
    );

  /* TOTALES */

  const totalCapital =
    schedule.reduce(
      (acc, row) =>
        acc +
        Number(
          row.principal_due || 0
        ),
      0
    );

  const totalInteres =
    schedule.reduce(
      (acc, row) =>
        acc +
        Number(
          row.interest_due || 0
        ),
      0
    );

  const totalIvaInteres =
    schedule.reduce(
      (acc, row) =>
        acc +
        Number(
          row.vat_interest_due || 0
        ),
      0
    );

  const totalComisiones =
    schedule.reduce(
      (acc, row) =>
        acc +
        Number(
          row.fees_due || 0
        ),
      0
    );

  const totalIvaComisiones =
    schedule.reduce(
      (acc, row) =>
        acc +
        Number(
          row.vat_fees_due || 0
        ),
      0
    );

  const totalComisionesConIva =
    totalComisiones +
    totalIvaComisiones;

  const totalPagar =
    schedule.reduce(
      (acc, row) =>
        acc +
        Number(
          row.total_due || 0
        ),
      0
    );

  /* DOMICILIACIÓN */

  const firstPaymentDate =
    legacyTerms.fecha_primer_pago
      ? normalizeDate(
          legacyTerms
            .fecha_primer_pago
        )
      : null;

  const maxPayment =
    schedule.length > 0
      ? Math.max(
          ...schedule.map(
            (row) =>
              Number(
                row.total_due || 0
              )
          )
        )
      : 0;

  return {
    /* CONTRATO */

    CONTRACT_ID:
      contract.contract_id ||
      "",

    CONTRACT_NUMBER:
      contract.contract_number ||
      "",

    NUMERO_CREDITO:
      contract.legacy_credit_number ||
      legacyTerms.numero_credito ||
      "",

    CONTRACT_RECA:
      contract.reca ||
      institution.RECA ||
      "",

    RECA:
      contract.reca ||
      institution.RECA ||
      "",

    /* ACREDITADO */

    BORROWER_NAME:
      borrower.display_name ||
      "",

    NOMBRE_ACREDITADO:
      borrower.display_name ||
      "",

    BORROWER_TYPE:
      borrower.party_type ||
      "",

    BORROWER_RFC:
      rfc,

    RFC:
      rfc,

    BORROWER_CURP:
      curp,

    CURP:
      curp,

    BORROWER_EMAIL:
      email,

    CORREO_ACREDITADO:
      email,

    BORROWER_PHONE:
      phone,

    TELEFONO:
      phone,

    NACIONALIDAD:
      person.nationality_code ===
      "MX"
        ? "Mexicana"
        : person.nationality_code ||
          "",

    /* DOMICILIO */

    BORROWER_ADDRESS:
      buildAddress(address),

    DOMICILIO_ACREDITADO:
      buildAddress(address),

    DOMICILIO:
      buildAddress(address),

    CALLE_NUMERO:
      [
        address.street,
        address.exterior_number,
        address.interior_number,
      ]
        .filter(Boolean)
        .join(" "),

    COLONIA:
      address.neighborhood ||
      "",

    MUNICIPIO:
      address.municipality ||
      "",

    ESTADO:
      address.state ||
      "",

    CP:
      address.postal_code ||
      "",

    /* CRÉDITO */

    CREDIT_APPROVED_AMOUNT:
      formatMoney(
        terms.approved_amount
      ),

    MONTO_CREDITO:
      formatMoney(
        terms.approved_amount
      ),

    MONTO_LETRA:
      moneyInWordsPlaceholder(
        terms.approved_amount
      ),

    CREDIT_TERM_MONTHS:
      terms.approved_term_months ??
      "",

    PLAZO_MESES:
      terms.approved_term_months ??
      "",

    CREDIT_ANNUAL_RATE:
      formatPercent(
        annualRate,
        2
      ),

    TASA_ORDINARIA:
      formatPercent(
        annualRate,
        2
      ),

    CREDIT_MORATORY_RATE:
      formatPercent(
        moratoryRate,
        2
      ),

    TASA_MORATORIA:
      formatPercent(
        moratoryRate,
        2
      ),

    CREDIT_CAT:
      formatPercent(
        catRate,
        1
      ),

    CAT:
      formatPercent(
        catRate,
        1
      ),

    CREDIT_OPENING_FEE_RATE:
      formatPercent(
        openingFeeRate,
        2
      ),

    COMISION_APERTURA:
      formatPercent(
        openingFeeRate,
        2
      ),

    /* TOTALES */

    MONTO_TOTAL:
      formatMoney(
        totalPagar
      ),

    TOTAL_CAPITAL:
      formatMoney(
        totalCapital
      ),

    TOTAL_INTERES:
      formatMoney(
        totalInteres
      ),

    TOTAL_IVA_INTERES:
      formatMoney(
        totalIvaInteres
      ),

    TOTAL_COMISIONES:
      formatMoney(
        totalComisiones
      ),

    TOTAL_IVA_COMISIONES:
      formatMoney(
        totalIvaComisiones
      ),

    TOTAL_COMISIONES_CON_IVA:
      formatMoney(
        totalComisionesConIva
      ),

    TOTAL_PAGAR:
      formatMoney(
        totalPagar
      ),

    /* PAGOS */

    PERIODICIDAD:
      legacyTerms.periodicidad ||
      "MENSUAL",

    FECHA_PRIMER_PAGO:
      formatDateLong(
        legacyTerms
          .fecha_primer_pago
      ),

    FECHA_VENCIMIENTO:
      formatDateLong(
        legacyTerms
          .fecha_vencimiento
      ),

    NUMERO_PAGOS:
      schedule.length,

    /* CUENTA */

    DISBURSEMENT_BANK:
      bank.institution_name ||
      "",

    BANCO:
      bank.institution_name ||
      "",

    DISBURSEMENT_ACCOUNT_NUMBER:
      bank.account_number ||
      "",

    NUMERO_CUENTA:
      bank.account_number ||
      "",

    DISBURSEMENT_CLABE:
      bank.clabe ||
      "",

    CLABE:
      bank.clabe ||
      "",

    CLABE_ULTIMOS_4:
      bank.clabe_last4 ||
      "",

    TITULAR_CUENTA:
      borrower.display_name ||
      "",

    /* DOMICILIACIÓN */

    DIA_CARGO:
      firstPaymentDate
        ? firstPaymentDate.getDate()
        : "",

    PERIODICIDAD_UNIDAD:
      String(
        legacyTerms.periodicidad ||
        ""
      ).toUpperCase() ===
      "MENSUAL"
        ? "mes"
        : String(
              legacyTerms.periodicidad ||
              ""
            ).toUpperCase() ===
            "QUINCENAL"
        ? "quincena"
        : "",

    MONTO_MAXIMO_CARGO:
      formatMoney(
        maxPayment
      ),

    MONTO_MAXIMO_CARGO_LETRA:
      moneyInWordsPlaceholder(
        maxPayment
      ),

    /* ACREDITANTE */

    LENDER_LEGAL_NAME:
      institution.RAZON_SOCIAL ||
      "",

    RAZON_SOCIAL:
      institution.RAZON_SOCIAL ||
      "",

    LENDER_RFC:
      institution.RFC_ACREDITANTE ||
      "",

    RFC_ACREDITANTE:
      institution.RFC_ACREDITANTE ||
      "",

    FOLIO_MERCANTIL:
      institution.FOLIO_MERCANTIL ||
      "",

    ESCRITURA_CONSTITUTIVA:
      institution
        .ESCRITURA_CONSTITUTIVA ||
      "",

    FECHA_ESCRITURA_CONSTITUTIVA:
      formatDateLong(
        institution
          .FECHA_ESCRITURA_CONSTITUTIVA
      ),

    FECHA_INSCRIPCION_RPC:
      formatDateLong(
        institution
          .FECHA_INSCRIPCION_RPC_CONSTITUCION
      ),

    ESCRITURA_PODER:
      institution.ESCRITURA_PODER ||
      "",

    FECHA_PODER:
      formatDateLong(
        institution.FECHA_PODER
      ),

    NOTARIO_PODER:
      institution.NOTARIO_PODER ||
      "",

    NUMERO_NOTARIA:
      institution.NUMERO_NOTARIA ||
      "",

    PLAZA_NOTARIA:
      institution.PLAZA_NOTARIA ||
      "",

    REPRESENTANTE_LEGAL:
      institution
        .REPRESENTANTE_LEGAL ||
      "",

    DOMICILIO_ACREDITANTE:
      institution
        .DOMICILIO_ACREDITANTE ||
      "",

    CORREO_ACREDITANTE:
      institution.CORREO_UNE ||
      "",

    /* UNE */

    LENDER_UNE_PHONE:
      institution.TELEFONO_UNE ||
      "",

    TELEFONO_UNE:
      institution.TELEFONO_UNE ||
      "",

    LENDER_UNE_EMAIL:
      institution.CORREO_UNE ||
      "",

    CORREO_UNE:
      institution.CORREO_UNE ||
      "",

    DOMICILIO_UNE:
      institution.DOMICILIO_UNE ||
      "",

    HORARIO_UNE:
      institution.HORARIO_UNE ||
      "",

    /* JURISDICCIÓN */

    FUERO:
      institution.FUERO ||
      "COMÚN",

    CIUDAD_JURISDICCION:
      institution
        .CIUDAD_JURISDICCION ||
      "Saltillo",

    ESTADO_JURISDICCION:
      institution
        .ESTADO_JURISDICCION ||
      "Coahuila de Zaragoza",

    JURISDICCION:
      [
        institution
          .CIUDAD_JURISDICCION ||
          "Saltillo",

        institution
          .ESTADO_JURISDICCION ||
          "Coahuila de Zaragoza",
      ]
        .filter(Boolean)
        .join(", "),

    /* FIRMA */

    CIUDAD_FIRMA:
      institution.CIUDAD_FIRMA ||
      "Saltillo",

    ESTADO_FIRMA:
      institution.ESTADO_FIRMA ||
      "Coahuila de Zaragoza",

    DIA_FIRMA:
      String(
        today.getDate()
      ),

    MES_FIRMA:
      monthNames[
        today.getMonth()
      ],

    ANIO_FIRMA:
      String(
        today.getFullYear()
      ),

    FECHA_ELABORACION:
      formatDateLong(
        today
      ),

    /* PERSONA MORAL */

    PM_ESCRITURA_CONSTITUTIVA:
      organization
        .incorporation_deed_number ||
      "",

    PM_FECHA_CONSTITUCION:
      formatDateLong(
        organization
          .incorporation_date
      ),

    PM_NOTARIO_CONSTITUCION:
      "",

    PM_NUMERO_NOTARIA_CONSTITUCION:
      "",

    PM_PLAZA_NOTARIA_CONSTITUCION:
      "",

    PM_FOLIO_MERCANTIL:
      "",

    PM_FECHA_INSCRIPCION_RPC:
      "",

    PM_ESCRITURA_PODER:
      "",

    PM_FECHA_PODER:
      "",

    PM_NOTARIO_PODER:
      "",

    PM_NUMERO_NOTARIA_PODER:
      "",

    PM_PLAZA_NOTARIA_PODER:
      "",

    /* OBLIGADOS */

    OBLIGADO_NOMBRE:
      "",

    OBLIGADO_RFC:
      "",

    OBLIGADO_CORREO:
      "",

    OBLIGADO_TELEFONO:
      "",

    OBLIGADO_DOMICILIO:
      "",

    OBLIGADO_2_NOMBRE:
      "",

    /* TABLA */

    PAYMENT_SCHEDULE:
      paymentSchedule,

    PAGOS:
      paymentSchedule,
  };
}

/* =========================================================
   HELPERS
========================================================= */

function findIdentifier(
  identifiers,
  type
) {
  return (
    identifiers.find(
      (x) =>
        String(x.type)
          .toUpperCase() ===
        String(type)
          .toUpperCase()
    )?.value || ""
  );
}

function findContact(
  contacts,
  type
) {
  return (
    contacts.find(
      (x) =>
        String(x.type)
          .toUpperCase() ===
        String(type)
          .toUpperCase()
    )?.value || ""
  );
}

function buildAddress(
  address
) {
  if (!address) return "";

  return [
    [
      address.street,
      address.exterior_number,
      address.interior_number,
    ]
      .filter(Boolean)
      .join(" "),

    address.neighborhood
      ? `Col. ${address.neighborhood}`
      : "",

    address.municipality,

    address.state,

    address.postal_code
      ? `C.P. ${address.postal_code}`
      : "",
  ]
    .filter(Boolean)
    .join(", ");
}

function numberOrNull(
  value
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const n =
    Number(value);

  return Number.isFinite(n)
    ? n
    : null;
}

function formatMoney(
  value
) {
  const number =
    Number(value || 0);

  return number.toLocaleString(
    "es-MX",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  );
}

function formatPercent(
  decimalRate,
  decimals = 2
) {
  if (
    decimalRate === null ||
    decimalRate === undefined
  ) {
    return "";
  }

  return (
    Number(
      decimalRate
    ) * 100
  ).toFixed(decimals);
}

function formatDateShort(
  value
) {
  if (!value) return "";

  const date =
    normalizeDate(value);

  return date.toLocaleDateString(
    "es-MX",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }
  );
}

function formatDateLong(
  value
) {
  if (!value) return "";

  const date =
    normalizeDate(value);

  return date.toLocaleDateString(
    "es-MX",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );
}

function normalizeDate(
  value
) {
  if (
    value instanceof Date
  ) {
    return value;
  }

  const text =
    String(value);

  if (
    /^\d{4}-\d{2}-\d{2}$/.test(
      text
    )
  ) {
    return new Date(
      `${text}T12:00:00`
    );
  }

  return new Date(text);
}

function moneyInWordsPlaceholder(
  value
) {
  return `${formatMoney(value)} PESOS 00/100 M.N.`;
}

/* =========================================================
   NORMALIZACIÓN CONTRACTUAL
========================================================= */

function normalizeContractualModel(
  model
) {
  if (
    !model ||
    typeof model !== "object"
  ) {
    return model;
  }

  const normalized = {};

  for (
    const [key, value] of
    Object.entries(model)
  ) {
    normalized[key] =
      normalizeContractualValue(
        key,
        value
      );
  }

  return normalized;
}

function normalizeContractualValue(
  key,
  value
) {
  if (
    value === null ||
    value === undefined
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(
      (item) => {
        if (
          item &&
          typeof item === "object"
        ) {
          const normalizedItem = {};

          for (
            const [
              childKey,
              childValue,
            ] of Object.entries(
              item
            )
          ) {
            normalizedItem[
              childKey
            ] =
              normalizeContractualValue(
                childKey,
                childValue
              );
          }

          return normalizedItem;
        }

        return item;
      }
    );
  }

  if (
    typeof value === "object"
  ) {
    const normalizedObject = {};

    for (
      const [
        childKey,
        childValue,
      ] of Object.entries(
        value
      )
    ) {
      normalizedObject[
        childKey
      ] =
        normalizeContractualValue(
          childKey,
          childValue
        );
    }

    return normalizedObject;
  }

  if (
    typeof value !== "string"
  ) {
    return value;
  }

  if (
    shouldPreserveContractualValue(
      key
    )
  ) {
    return value;
  }

  return normalizeContractualText(
    value
  );
}

function shouldPreserveContractualValue(
  key
) {
  const normalizedKey =
    String(key || "")
      .trim()
      .toUpperCase();

  const exactPreserveKeys =
    new Set([
      "CONTRACT_ID",
      "SNAPSHOT_ID",
      "APPLICATION_ID",
      "PARTY_ID",
      "CREDIT_ACCOUNT_ID",
      "DOCUMENT_ID",

      "BORROWER_EMAIL",
      "CORREO_ACREDITADO",
      "CORREO_ACREDITANTE",
      "LENDER_UNE_EMAIL",
      "CORREO_UNE",
      "OBLIGADO_CORREO",

      "DISBURSEMENT_ACCOUNT_NUMBER",
      "NUMERO_CUENTA",
      "DISBURSEMENT_CLABE",
      "CLABE",
      "CLABE_ULTIMOS_4",

      "BORROWER_PHONE",
      "TELEFONO",
      "LENDER_UNE_PHONE",
      "TELEFONO_UNE",
      "OBLIGADO_TELEFONO",

      "CREDIT_APPROVED_AMOUNT",
      "MONTO_CREDITO",
      "CREDIT_TERM_MONTHS",
      "PLAZO_MESES",
      "CREDIT_ANNUAL_RATE",
      "TASA_ORDINARIA",
      "CREDIT_MORATORY_RATE",
      "TASA_MORATORIA",
      "CREDIT_CAT",
      "CAT",
      "CREDIT_OPENING_FEE_RATE",
      "COMISION_APERTURA",
      "MONTO_TOTAL",
      "TOTAL_CAPITAL",
      "TOTAL_INTERES",
      "TOTAL_IVA_INTERES",
      "TOTAL_COMISIONES",
      "TOTAL_IVA_COMISIONES",
      "TOTAL_COMISIONES_CON_IVA",
      "TOTAL_PAGAR",
      "NUMERO_PAGOS",
      "DIA_CARGO",
      "MONTO_MAXIMO_CARGO",

      "DIA_FIRMA",
      "ANIO_FIRMA",

      "NUMERO",
      "FECHA",
      "SALDO_INICIAL",
      "PRINCIPAL",
      "INTERES",
      "IVA_INTERES",
      "COMISIONES",
      "IVA_COMISION",
      "COMISIONES_CON_IVA",
      "TOTAL",
      "SALDO_FINAL",
    ]);

  if (
    exactPreserveKeys.has(
      normalizedKey
    )
  ) {
    return true;
  }

  const protectedFragments = [
    "_ID",
    "UUID",
    "HASH",
    "SHA256",
    "STORAGE_PATH",
    "URL",
    "TOKEN",
    "SECRET",
    "PASSWORD",
  ];

  return protectedFragments.some(
    (fragment) =>
      normalizedKey.includes(
        fragment
      )
  );
}

function normalizeContractualText(
  value
) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value)
    .normalize("NFC")
    .trim()
    .replace(
      /\s+/g,
      " "
    )
    .toLocaleUpperCase(
      "es-MX"
    );
}