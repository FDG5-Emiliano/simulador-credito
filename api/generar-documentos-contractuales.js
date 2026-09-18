import { createClient } from "@supabase/supabase-js";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import crypto from "crypto";


/* =========================================================
   SUPABASE ADMIN
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
    } =
      await supabaseAdmin.auth.getUser(token);

    if (
      authError ||
      !authData?.user
    ) {
      return res.status(401).json({
        ok: false,
        error: "La sesión no es válida.",
      });
    }

    const usuario =
      authData.user;


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
       3. RESOLVER APPLICATION NUEVA
    ===================================================== */

    let application = null;

    if (application_id) {

      const {
        data,
        error,
      } =
        await supabaseAdmin
          .schema("origination")
          .from("credit_applications")
          .select("*")
          .eq("id", application_id)
          .maybeSingle();

      if (error) throw error;

      application = data;
    }


    /*
      Compatibilidad temporal:
      el frontend todavía manda solicitudId legacy.
    */

    if (
      !application &&
      aplicacion_id
    ) {

      const {
        data,
        error,
      } =
        await supabaseAdmin
          .schema("origination")
          .from("credit_applications")
          .select("*")
          .eq(
            "legacy_application_id",
            aplicacion_id
          )
          .maybeSingle();

      if (error) throw error;

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
      } =
        await supabaseAdmin
          .schema("contracts")
          .from("contracts")
          .select("*")
          .eq("id", contract_id)
          .maybeSingle();

      if (error) throw error;

      contract = data;

    } else if (application) {

      const {
        data,
        error,
      } =
        await supabaseAdmin
          .schema("contracts")
          .from("contracts")
          .select("*")
          .eq(
            "application_id",
            application.id
          )
          .order(
            "created_at",
            { ascending: false }
          )
          .limit(1)
          .maybeSingle();

      if (error) throw error;

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
      } =
        await supabaseAdmin
          .schema("origination")
          .from("credit_applications")
          .select("*")
          .eq(
            "id",
            contract.application_id
          )
          .single();

      if (error) throw error;

      application = data;
    }


    /* =====================================================
       5. VALIDAR PROPIEDAD
    ===================================================== */

    const {
      data: borrower,
      error: borrowerError,
    } =
      await supabaseAdmin
        .schema("core")
        .from("parties")
        .select(
          "id, auth_user_id, display_name"
        )
        .eq(
          "id",
          application.borrower_party_id
        )
        .single();

    if (borrowerError) {
      throw borrowerError;
    }


    /*
      Por ahora:
      cliente dueño de la solicitud.

      Posteriormente agregaremos autorización
      formal de usuarios internos por IAM/RBAC.
    */

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
       6. SNAPSHOT CONTRACTUAL VIGENTE
    ===================================================== */

    const {
      data: snapshot,
      error: snapshotError,
    } =
      await supabaseAdmin
        .schema("contracts")
        .from("contract_snapshots")
        .select(
          "id, contract_id, snapshot_version, schema_version, sha256, snapshot_data, created_at"
        )
        .eq(
          "contract_id",
          contract.id
        )
        .order(
          "snapshot_version",
          { ascending: false }
        )
        .limit(1)
        .single();

    if (snapshotError) {
      throw snapshotError;
    }

    if (!snapshot?.snapshot_data) {
      throw new Error(
        "El contrato no tiene snapshot contractual."
      );
    }


    const S =
      snapshot.snapshot_data;


    /* =====================================================
       7. VALIDAR SNAPSHOT
    ===================================================== */

    if (
      !Array.isArray(
        S.payment_schedule
      )
    ) {
      throw new Error(
        "El snapshot contractual no contiene la tabla de amortización."
      );
    }

    if (
      S.payment_schedule.length === 0
    ) {
      throw new Error(
        "La tabla de amortización contractual está vacía."
      );
    }


    /* =====================================================
       8. MAPA SEMÁNTICO
    ===================================================== */

    const semantic =
      buildSemanticModel(S);


    /* =====================================================
       9. PLANTILLAS ACTIVAS
    ===================================================== */

    const {
      data: templates,
      error: templatesError,
    } =
      await supabaseAdmin
        .from("PlantillasContractuales")
        .select("*")
        .eq("activa", true)
        .order(
          "tipo_documento",
          { ascending: true }
        );

    if (templatesError) {
      throw templatesError;
    }


    /*
      Por ahora los documentos DOCX.

      CARATULA sigue siendo PDF y se
      incorporará en el siguiente paso.
    */

    const docxTemplates =
      (templates || []).filter(
        (t) =>
          t.storage_path
            ?.toLowerCase()
            .endsWith(".docx")
      );


    /* =====================================================
       10. GENERAR
    ===================================================== */

    const generatedDocuments =
      [];

    for (
      const template of
      docxTemplates
    ) {

      const {
        data: templateBlob,
        error: downloadError,
      } =
        await supabaseAdmin
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


      const templateBuffer =
        Buffer.from(
          await templateBlob.arrayBuffer()
        );


      /* ===============================================
         DOCXTEMPLATER
      =============================================== */

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


      /*
        Modelo común para todos los documentos.
      */

      const templateData = {
        ...semantic,

        PAGOS:
          semantic.PAYMENT_SCHEDULE,
      };


      doc.render(
        templateData
      );


      const output =
        doc
          .getZip()
          .generate({
            type: "nodebuffer",
            compression:
              "DEFLATE",
          });


      /* ===============================================
         HASH DEL ARCHIVO
      =============================================== */

      const fileHash =
        crypto
          .createHash("sha256")
          .update(output)
          .digest("hex");


      /* ===============================================
         VERSION DOCUMENTAL
      =============================================== */

      const {
        data:
          previousDocuments,
        error:
          previousError,
      } =
        await supabaseAdmin
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


      /* ===============================================
         NOMBRE
      =============================================== */

      const loanNumber =
        S.contract
          ?.legacy_credit_number ||
        contract.legacy_credit_number ||
        contract.contract_number;


      const filename =
        `${template.tipo_documento}_${loanNumber}_v${documentVersion}.docx`;


      const storagePath =
        [
          "contracts",
          contract.id,
          `snapshot-${snapshot.snapshot_version}`,
          filename,
        ].join("/");


      /* ===============================================
         STORAGE
      =============================================== */

      const {
        error: uploadError,
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

              upsert: false,
            }
          );

      if (uploadError) {
        throw new Error(
          `No se pudo guardar ${filename}: ${uploadError.message}`
        );
      }


      /* ===============================================
         REGISTRO OFICIAL
      =============================================== */

      const {
        data: registeredDocument,
        error: documentError,
      } =
        await supabaseAdmin
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
              String(
                template.version ||
                ""
              ),

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
          .single();

      if (documentError) {
        throw documentError;
      }


      /* ===============================================
         AUDIT EVENT
      =============================================== */

      const {
        error: eventError,
      } =
        await supabaseAdmin
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
              "TRISAL_DOCUMENT_GENERATOR_V3",

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
                String(
                  template.version ||
                  ""
                ),

              storage_path:
                storagePath,

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

        version:
          documentVersion,

        template_version:
          String(
            template.version ||
            ""
          ),

        filename,

        storage_path:
          storagePath,

        sha256:
          fileHash,

        requires_signature:
          Boolean(
            template.requiere_firma
          ),
      });
    }


    /* =====================================================
       11. CONTRACT STATUS
    ===================================================== */

    const {
      error: contractUpdateError,
    } =
      await supabaseAdmin
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
       12. RESPONSE
    ===================================================== */

    return res.status(200).json({

      ok: true,

      architecture:
        "SNAPSHOT_V3",

      contract_id:
        contract.id,

      contract_number:
        contract.contract_number,

      loan_number:
        S.contract
          ?.legacy_credit_number ||
        contract.legacy_credit_number,

      snapshot_id:
        snapshot.id,

      snapshot_version:
        snapshot.snapshot_version,

      snapshot_sha256:
        snapshot.sha256,

      documents:
        generatedDocuments,

      pending: [
        "CARATULA_PDF",
        "PDF_CONVERSION",
        "E_SIGNATURE",
      ],

      message:
        `${generatedDocuments.length} documentos fueron generados desde el snapshot contractual.`,

    });


  } catch (error) {

    console.error(
      "TRISAL DOCUMENT GENERATOR V3:",
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


  /* =====================================================
     IDENTIFIERS
  ===================================================== */

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


  /* =====================================================
     CONTACT
  ===================================================== */

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


  /* =====================================================
     ADDRESS
  ===================================================== */

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


  /* =====================================================
     BANK ACCOUNT
  ===================================================== */

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


  /* =====================================================
     RATES
  ===================================================== */

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


  /* =====================================================
     DATE OF GENERATION
  ===================================================== */

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


  /* =====================================================
     PAYMENT SCHEDULE
  ===================================================== */

  const paymentSchedule =
    schedule.map(
      (row) => ({

        numero:
          row.installment_number,

        fecha:
          formatDateShort(
            row.due_date
          ),

        saldo_inicial:
          formatMoney(
            row.opening_balance
          ),

        principal:
          formatMoney(
            row.principal_due
          ),

        interes:
          formatMoney(
            row.interest_due
          ),

        iva_interes:
          formatMoney(
            row.vat_interest_due
          ),

        comisiones:
          formatMoney(
            row.fees_due
          ),

        iva_comision:
          formatMoney(
            row.vat_fees_due
          ),

        total:
          formatMoney(
            row.total_due
          ),

      })
    );


  /* =====================================================
     OUTPUT SEMANTIC CONTRACT
  ===================================================== */

  return {

    /* -----------------------------------------------------
       CONTRACT
    ----------------------------------------------------- */

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


    /* -----------------------------------------------------
       BORROWER
    ----------------------------------------------------- */

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


    /* -----------------------------------------------------
       ADDRESS
    ----------------------------------------------------- */

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


    /* -----------------------------------------------------
       CREDIT TERMS
    ----------------------------------------------------- */

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


    /* -----------------------------------------------------
       CONTRACTUAL TOTALS
    ----------------------------------------------------- */

    MONTO_TOTAL:
      formatMoney(
        legacyTerms
          .monto_total_pagar
      ),

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


    /* -----------------------------------------------------
       BANK
    ----------------------------------------------------- */

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


    /* -----------------------------------------------------
       LENDER
    ----------------------------------------------------- */

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


    /* -----------------------------------------------------
       UNE
    ----------------------------------------------------- */

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

    CORREO_ACREDITANTE:
      institution.CORREO_UNE ||
      "",


    /* -----------------------------------------------------
       JURISDICTION
    ----------------------------------------------------- */

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


    /* -----------------------------------------------------
       SIGNING
    ----------------------------------------------------- */

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


    /* -----------------------------------------------------
       PERSONA MORAL
       El modelo ya reserva conceptos.
       Se llenarán cuando el onboarding PM
       esté completamente normalizado.
    ----------------------------------------------------- */

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


    /* -----------------------------------------------------
       GUARANTORS
       V4 migrará obligados al Party Model.
    ----------------------------------------------------- */

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


    /* -----------------------------------------------------
       SCHEDULE
    ----------------------------------------------------- */

    PAYMENT_SCHEDULE:
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


/*
  Por ahora conserva la representación
  numérica segura.

  Después agregaremos un motor formal
  número-a-letras MXN.
*/

function moneyInWordsPlaceholder(
  value
) {

  return `${formatMoney(value)} PESOS 00/100 M.N.`;
}