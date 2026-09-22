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
  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "Método no permitido.",
    });
  }

  try {
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

    const usuario =
      authData.user;

    const {
      aplicacion_id,
      tipo_documento,
    } = req.body || {};

    if (
      !aplicacion_id ||
      !tipo_documento
    ) {
      return res.status(400).json({
        ok: false,
        error:
          "Falta aplicacion_id o tipo_documento.",
      });
    }

    /* =====================================================
       1. APPLICATION NORMALIZADA
    ===================================================== */

    const {
      data: application,
      error: applicationError,
    } = await supabaseAdmin
      .schema("origination")
      .from("credit_applications")
      .select(
        `
        id,
        borrower_party_id,
        legacy_application_id
        `
      )
      .eq(
        "legacy_application_id",
        aplicacion_id
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
       2. VALIDAR PROPIEDAD
    ===================================================== */

    const {
      data: borrower,
      error: borrowerError,
    } = await supabaseAdmin
      .schema("core")
      .from("parties")
      .select(
        "id, auth_user_id"
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
          "No encontramos al acreditado.",
      });
    }

    if (
      borrower.auth_user_id !==
      usuario.id
    ) {
      return res.status(403).json({
        ok: false,
        error:
          "No tienes permiso para consultar este documento.",
      });
    }

    /* =====================================================
       3. CONTRATO
    ===================================================== */

    const {
      data: contract,
      error: contractError,
    } = await supabaseAdmin
      .schema("contracts")
      .from("contracts")
      .select(
        "id, contract_number"
      )
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

    if (contractError) {
      throw contractError;
    }

    if (!contract) {
      return res.status(404).json({
        ok: false,
        error:
          "No encontramos el contrato.",
      });
    }

    /* =====================================================
       4. DOCUMENTO VIGENTE

       No usamos el documento que tenga React.
       Buscamos directamente la versión más reciente.
    ===================================================== */

    const tiposPermitidos =
      new Set([
        "CONTRATO_PF",
        "CONTRATO_PM",
        "TABLA_AMORTIZACION",
        "DOMICILIACION",
        "PAGARE",
      ]);

    if (
      !tiposPermitidos.has(
        tipo_documento
      )
    ) {
      return res.status(400).json({
        ok: false,
        error:
          "Tipo de documento no permitido.",
      });
    }

    const {
      data: documento,
      error: documentoError,
    } = await supabaseAdmin
      .schema("contracts")
      .from("contract_documents")
      .select(
        `
        id,
        document_type,
        document_version,
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
        "document_type",
        tipo_documento
      )
      .eq(
        "status",
        "GENERATED"
      )
      .order(
        "document_version",
        {
          ascending: false,
        }
      )
      .limit(1)
      .maybeSingle();

    if (documentoError) {
      throw documentoError;
    }

    if (
      !documento ||
      !documento.storage_path
    ) {
      return res.status(404).json({
        ok: false,
        error:
          "El documento todavía no está disponible.",
      });
    }

    /* =====================================================
       5. SIGNED URL DESDE SERVIDOR
    ===================================================== */

    const filename =
      documento.storage_path
        .split("/")
        .pop() ||
      "documento.docx";

    const {
      data: signedData,
      error: signedError,
    } = await supabaseAdmin.storage
      .from(
        "expedientes-contractuales"
      )
      .createSignedUrl(
        documento.storage_path,
        60 * 10,
        {
          download: filename,
        }
      );

    if (signedError) {
      console.error(
        "SIGNED URL ERROR:",
        {
          signedError,
          storage_path:
            documento.storage_path,
        }
      );

      throw signedError;
    }

    if (!signedData?.signedUrl) {
      throw new Error(
        "Supabase no devolvió la URL del documento."
      );
    }

    return res.status(200).json({
      ok: true,

      document: {
        id:
          documento.id,

        document_type:
          documento.document_type,

        document_version:
          documento.document_version,

        filename,

        storage_path:
          documento.storage_path,

        url:
          signedData.signedUrl,
      },
    });
  } catch (error) {
    console.error(
      "TRISAL OPEN CONTRACT DOCUMENT:",
      error
    );

    return res.status(500).json({
      ok: false,
      error:
        error?.message ||
        "No pudimos abrir el documento.",
    });
  }
}