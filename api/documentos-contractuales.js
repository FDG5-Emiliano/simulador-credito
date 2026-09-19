import { createClient } from "@supabase/supabase-js";

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

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      ok: false,
      error: "Método no permitido.",
    });
  }

  try {
    const authorization = req.headers.authorization || "";

    const token = authorization.startsWith("Bearer ")
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

    if (authError || !authData?.user) {
      return res.status(401).json({
        ok: false,
        error: "La sesión no es válida.",
      });
    }

    const aplicacionId = String(
      req.query?.aplicacion_id || ""
    ).trim();

    const tipoDocumento = String(
      req.query?.tipo_documento || ""
    )
      .trim()
      .toUpperCase();

    if (!aplicacionId) {
      return res.status(400).json({
        ok: false,
        error: "Falta aplicacion_id.",
      });
    }

    /* =====================================================
       1. BUSCAR SOLICITUD NORMALIZADA
    ===================================================== */

    const {
      data: application,
      error: applicationError,
    } = await supabaseAdmin
      .schema("origination")
      .from("credit_applications")
      .select(
        "id, borrower_party_id, legacy_application_id"
      )
      .eq(
        "legacy_application_id",
        aplicacionId
      )
      .maybeSingle();

    if (applicationError) {
      throw applicationError;
    }

    if (!application) {
      return res.status(404).json({
        ok: false,
        error:
          "No encontramos la solicitud normalizada.",
      });
    }

    /* =====================================================
       2. VALIDAR QUE EL CLIENTE SEA DUEÑO
    ===================================================== */

    const {
      data: borrower,
      error: borrowerError,
    } = await supabaseAdmin
      .schema("core")
      .from("parties")
      .select("id, auth_user_id")
      .eq(
        "id",
        application.borrower_party_id
      )
      .single();

    if (borrowerError) {
      throw borrowerError;
    }

    if (
      borrower.auth_user_id !==
      authData.user.id
    ) {
      return res.status(403).json({
        ok: false,
        error:
          "No tienes permiso para consultar estos documentos.",
      });
    }

    /* =====================================================
       3. BUSCAR CONTRATO
    ===================================================== */

    const {
      data: contract,
      error: contractError,
    } = await supabaseAdmin
      .schema("contracts")
      .from("contracts")
      .select("id, contract_number")
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

    if (contractError) {
      throw contractError;
    }

    if (!contract) {
      return res.status(404).json({
        ok: false,
        error:
          "Todavía no existe un contrato para esta solicitud.",
      });
    }

    /* =====================================================
       4. BUSCAR DOCUMENTOS
    ===================================================== */

    let query = supabaseAdmin
      .schema("contracts")
      .from("contract_documents")
      .select(
        `
        id,
        document_type,
        document_version,
        template_version,
        storage_path,
        status,
        requires_signature,
        generated_at
        `
      )
      .eq(
        "contract_id",
        contract.id
      )
      .order(
        "document_version",
        { ascending: false }
      )
      .order(
        "generated_at",
        { ascending: false }
      );

    if (tipoDocumento) {
      query = query.eq(
        "document_type",
        tipoDocumento
      );
    }

    const {
      data: documents,
      error: documentsError,
    } = await query;

    if (documentsError) {
      throw documentsError;
    }

    /* =====================================================
       5. SI PIDIERON UN DOCUMENTO ESPECÍFICO
       GENERAR URL TEMPORAL
    ===================================================== */

    if (tipoDocumento) {
      const documento =
        documents?.[0] || null;

      if (!documento) {
        return res.status(404).json({
          ok: false,
          error:
            "Este documento todavía no está disponible.",
        });
      }

      const {
        data: signedData,
        error: signedError,
      } = await supabaseAdmin.storage
        .from(
          "expedientes-contractuales"
        )
        .createSignedUrl(
          documento.storage_path,
          300
        );

      if (signedError) {
        throw signedError;
      }

      return res.status(200).json({
        ok: true,

        contract_id:
          contract.id,

        contract_number:
          contract.contract_number,

        document: {
          ...documento,

          signed_url:
            signedData?.signedUrl ||
            null,
        },
      });
    }

    /* =====================================================
       6. DEVOLVER ÚLTIMA VERSIÓN DE CADA DOCUMENTO
    ===================================================== */

    const latest = {};

    for (
      const documento of
      documents || []
    ) {
      if (
        !latest[
          documento.document_type
        ]
      ) {
        latest[
          documento.document_type
        ] = documento;
      }
    }

    return res.status(200).json({
      ok: true,

      contract_id:
        contract.id,

      contract_number:
        contract.contract_number,

      documents:
        Object.values(latest),
    });
  } catch (error) {
    console.error(
      "TRISAL CONTRACT DOCUMENTS API:",
      error
    );

    return res.status(500).json({
      ok: false,

      error:
        error?.message ||
        "No se pudieron recuperar los documentos contractuales.",
    });
  }
}