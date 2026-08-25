import { useState } from "react";

export default function App() {
  const [modo, setModo] = useState("cliente");
  const [pantalla, setPantalla] = useState("inicio");
  const [legalAbierto, setLegalAbierto] = useState(false);

  const [datos, setDatos] = useState({
    montoSolicitado: "10000",
    plazoSolicitado: "6",

    celular: "",
    correo: "",
    nombre: "",
    apellidoPaterno: "",
    apellidoMaterno: "",
    curp: "",
    rfc: "",
    nacimiento: "",

    calle: "",
    colonia: "",
    cp: "",
    municipio: "",
    estado: "",

    ocupacion: "",
    empresa: "",
    antiguedad: "",
    ingreso: "",
    destino: "",

    tipoCredito: "",
    tipoGarantia: "",

    garanteNombre: "",
    garanteTelefono: "",
    garanteCorreo: "",

    descripcionGarantia: "",
    valorGarantia: "",

    clabe: "",

    /*
      ESTOS DATOS NO LOS DEFINE EL CLIENTE.

      En producción serán determinados por:
      - Motor de decisión
      - Mesa de Crédito
      - Políticas vigentes
      - Cálculo regulatorio correspondiente
    */

    montoAprobado: "10000",
    plazoAprobado: "6",
    tasaAprobada: "49",
    comisionAprobada: "3",

    /*
      IMPORTANTE:
      Este CAT sigue siendo MOCK para el prototipo.

      En producción NO debe capturarse manualmente.
      Debe calcularse conforme a las condiciones
      aprobadas y a la metodología aplicable.
    */
    catAprobado: "68.50",
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
      SUSTITUIR POR LOS DATOS REALES DE LA UNE
      ANTES DE PUBLICAR.
    */
    uneTelefono: "PENDIENTE",
    uneCorreo: "PENDIENTE",

    condusefTelefono: "55 53 400 999",
    condusefCorreo: "asesoria@condusef.gob.mx",
  };

  function actualizar(campo, valor) {
    setDatos((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  }

  function ir(nuevaPantalla) {
    setPantalla(nuevaPantalla);
    setLegalAbierto(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function entrarCliente() {
    setModo("cliente");
    ir("inicio");
  }

  function entrarBackoffice() {
    setModo("backoffice");
    ir("backofficeLogin");
  }

  const pagoOferta = calcularPago(
    Number(datos.montoAprobado || 0),
    Number(datos.tasaAprobada || 0),
    Number(datos.plazoAprobado || 1)
  );

  return (
    <div className="app">
      <style>{css}</style>

      {/* ==============================
          HEADER
      ============================== */}

      <header className="header">
        <button
          className="logoButton"
          onClick={entrarCliente}
        >
          <img
            src="/logo-trisal.jpeg"
            alt="TRISAL"
            className="logo"
          />
        </button>

        <div className="topActions">
          <button
            className={
              modo === "cliente"
                ? "topButton selected"
                : "topButton"
            }
            onClick={entrarCliente}
          >
            Portal cliente
          </button>

          <div className="legalDropdown">
            <button
              className="topButton"
              onClick={() =>
                setLegalAbierto(!legalAbierto)
              }
            >
              Información legal
            </button>

            {legalAbierto && (
              <div className="legalMenu">
                <button
                  onClick={() => {
                    setModo("cliente");
                    ir("une");
                  }}
                >
                  UNE
                </button>

                <button
                  onClick={() => {
                    setModo("cliente");
                    ir("normatividad");
                  }}
                >
                  Normatividad
                </button>

                <button
                  onClick={() => {
                    setModo("cliente");
                    ir("buro");
                  }}
                >
                  Buró de Entidades Financieras
                </button>

                <button
                  onClick={() => {
                    setModo("cliente");
                    ir("privacidad");
                  }}
                >
                  Aviso de privacidad
                </button>
              </div>
            )}
          </div>

          <button
            className={
              modo === "backoffice"
                ? "topButton selected"
                : "topButton"
            }
            onClick={entrarBackoffice}
          >
            Backoffice
          </button>
        </div>
      </header>

      <main className="container">
        {/* ==============================
            PORTAL CLIENTE
        ============================== */}

        {modo === "cliente" && (
          <>
            {pantalla === "inicio" && (
              <Inicio ir={ir} />
            )}

            {pantalla === "comoFunciona" && (
              <ComoFunciona ir={ir} />
            )}

            {pantalla === "simulacion" && (
              <Simulacion
                datos={datos}
                actualizar={actualizar}
                ir={ir}
              />
            )}

            {pantalla === "registro" && (
              <Registro
                datos={datos}
                actualizar={actualizar}
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
              <Consentimientos ir={ir} />
            )}

            {pantalla === "personales" && (
              <Personales
                datos={datos}
                actualizar={actualizar}
                ir={ir}
              />
            )}

            {pantalla === "identidad" && (
              <Identidad ir={ir} />
            )}

            {pantalla === "domicilio" && (
              <Domicilio
                datos={datos}
                actualizar={actualizar}
                ir={ir}
              />
            )}

            {pantalla === "ingresos" && (
              <Ingresos
                datos={datos}
                actualizar={actualizar}
                ir={ir}
              />
            )}

            {pantalla ===
              "documentosFinancieros" && (
              <DocumentosFinancieros ir={ir} />
            )}

            {pantalla === "solicitud" && (
              <Solicitud
                datos={datos}
                actualizar={actualizar}
                ir={ir}
              />
            )}

            {pantalla === "tipoCredito" && (
              <TipoCredito
                datos={datos}
                actualizar={actualizar}
                ir={ir}
              />
            )}

            {pantalla === "garantia" && (
              <Garantia
                datos={datos}
                actualizar={actualizar}
                ir={ir}
              />
            )}

            {pantalla === "obligado" && (
              <Obligado
                datos={datos}
                actualizar={actualizar}
                ir={ir}
              />
            )}

            {pantalla === "garantiaStatus" && (
              <GarantiaStatus
                datos={datos}
                ir={ir}
              />
            )}

            {pantalla === "revision" && (
              <Revision
                datos={datos}
                ir={ir}
              />
            )}

            {pantalla === "enRevision" && (
              <EnRevision
                datos={datos}
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

            {pantalla === "tesoreriaCliente" && (
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

            {/* REGULATORIO */}

            {pantalla === "une" && (
              <UNE empresa={empresa} />
            )}

            {pantalla === "normatividad" && (
              <Normatividad empresa={empresa} />
            )}

            {pantalla === "buro" && (
              <Buro />
            )}

            {pantalla === "privacidad" && (
              <Privacidad empresa={empresa} />
            )}
          </>
        )}

        {/* ==============================
            BACKOFFICE
        ============================== */}

        {modo === "backoffice" && (
          <>
            {pantalla === "backofficeLogin" && (
              <BackofficeLogin ir={ir} />
            )}

            {pantalla === "dashboard" && (
              <Dashboard ir={ir} />
            )}

            {pantalla === "bandeja" && (
              <Bandeja ir={ir} />
            )}

            {pantalla === "expediente" && (
              <Expediente
                datos={datos}
                ir={ir}
              />
            )}

            {pantalla === "mesaCredito" && (
              <MesaCredito
                datos={datos}
                actualizar={actualizar}
                ir={ir}
              />
            )}

            {pantalla === "tesoreria" && (
              <Tesoreria />
            )}

            {pantalla === "cobranza" && (
              <Cobranza />
            )}
          </>
        )}
      </main>

      {/* ==============================
          FOOTER REGULATORIO
      ============================== */}

      <footer className="legalFooter">
        <div className="footerContent">
          <div>
            <img
              src="/logo-trisal.jpeg"
              alt="TRISAL"
              className="footerLogo"
            />
          </div>

          <div className="footerLegal">
            <p>
              Para la constitución y operación de{" "}
              {empresa.razonSocial} con tal carácter,
              no requiere de autorización de la
              Secretaría de Hacienda y Crédito Público.
            </p>

            <p>
              {empresa.razonSocial} se encuentra sujeta
              a la supervisión de la Comisión Nacional
              Bancaria y de Valores, únicamente para
              efectos de lo dispuesto por el artículo
              56 de la Ley General de Organizaciones y
              Actividades Auxiliares del Crédito.
            </p>
          </div>

          <div className="footerLinks">
            <button
              onClick={() => {
                setModo("cliente");
                ir("une");
              }}
            >
              UNE
            </button>

            <button
              onClick={() => {
                setModo("cliente");
                ir("normatividad");
              }}
            >
              Normatividad
            </button>

            <button
              onClick={() => {
                setModo("cliente");
                ir("buro");
              }}
            >
              Buró de Entidades Financieras
            </button>

            <button
              onClick={() => {
                setModo("cliente");
                ir("privacidad");
              }}
            >
              Aviso de privacidad
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* =====================================================
   LANDING
===================================================== */

function Inicio({ ir }) {
  return (
    <section className="hero fadeUp">
      <div>
        <p className="eyebrow">
          CRÉDITO DIGITAL TRISAL
        </p>

        <h1>
          El impulso que necesitas para seguir creciendo.
        </h1>

        <p className="heroText">
          Solicita tu crédito de forma sencilla y conoce
          el avance de tu solicitud en todo momento.
        </p>

        <div className="buttonRow">
          <button
            className="primary"
            onClick={() => ir("simulacion")}
          >
            Solicita tu crédito
          </button>

          <button
            className="secondary"
            onClick={() => ir("comoFunciona")}
          >
            ¿Cómo funciona?
          </button>
        </div>
      </div>

      <div className="heroCard">
        <h3>Un proceso sencillo</h3>

        <MiniStep
          numero="1"
          texto="Elige monto y plazo"
        />

        <MiniStep
          numero="2"
          texto="Completa tu solicitud"
        />

        <MiniStep
          numero="3"
          texto="Recibe una oferta"
        />

        <MiniStep
          numero="4"
          texto="Firma y recibe tu dinero"
        />
      </div>
    </section>
  );
}

/* =====================================================
   CÓMO FUNCIONA
===================================================== */

function ComoFunciona({ ir }) {
  const pasos = [
    {
      numero: 1,
      titulo: "Simula",
      texto:
        "Elige cuánto necesitas y el plazo que prefieres.",
    },
    {
      numero: 2,
      titulo: "Completa tu solicitud",
      texto:
        "Cuéntanos sobre ti, tus ingresos y tu actividad.",
    },
    {
      numero: 3,
      titulo: "Garantía",
      texto:
        "Si tu operación requiere garantía, te indicaremos qué necesitamos.",
    },
    {
      numero: 4,
      titulo: "Revisamos tu solicitud",
      texto:
        "TRISAL analiza tu información y capacidad de pago.",
    },
    {
      numero: 5,
      titulo: "Recibe tu oferta",
      texto:
        "Conoce monto aprobado, plazo, tasa, CAT y pago.",
    },
    {
      numero: 6,
      titulo: "Firma y recibe",
      texto:
        "Acepta las condiciones, firma y recibe tu crédito.",
    },
  ];

  return (
    <Pagina
      titulo="Solicitar tu crédito es sencillo"
      subtitulo="Te acompañamos durante todo el proceso."
    >
      <div className="simpleFlow">
        {pasos.map((paso) => (
          <div
            className="simpleFlowCard"
            key={paso.numero}
          >
            <div className="stepCircle">
              {paso.numero}
            </div>

            <div>
              <h3>{paso.titulo}</h3>
              <p>{paso.texto}</p>
            </div>
          </div>
        ))}
      </div>

      <button
        className="primary centerButton"
        onClick={() => ir("simulacion")}
      >
        Comenzar solicitud
      </button>
    </Pagina>
  );
}

/* =====================================================
   PASO 1 - SIMULACIÓN
===================================================== */

function Simulacion({
  datos,
  actualizar,
  ir,
}) {
  return (
    <Pagina
      titulo="¿Cuánto necesitas?"
      subtitulo="Elige el monto y plazo que te gustaría solicitar."
    >
      <Tracker paso={1} />

      <div className="card">
        <Campo
          label="Monto solicitado"
          value={datos.montoSolicitado}
          type="number"
          onChange={(v) =>
            actualizar("montoSolicitado", v)
          }
        />

        <label className="label">
          ¿En cuánto tiempo quieres pagarlo?
        </label>

        <div className="optionRow">
          {["3", "6", "9", "12"].map((mes) => (
            <button
              key={mes}
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
          Las condiciones finales, incluyendo tasa,
          CAT, comisión y pago, se determinarán
          después de analizar tu solicitud.
        </div>

        <button
          className="primary full"
          onClick={() => ir("registro")}
        >
          Continuar
        </button>
      </div>
    </Pagina>
  );
}

/* =====================================================
   PASO 2 - SOLICITUD
===================================================== */

function Registro({
  datos,
  actualizar,
  ir,
}) {
  return (
    <Pagina
      titulo="Comencemos"
      subtitulo="Crea tu cuenta para guardar tu avance."
    >
      <Tracker paso={2} />

      <div className="card narrow">
        <Campo
          label="Celular"
          value={datos.celular}
          onChange={(v) =>
            actualizar("celular", v)
          }
          placeholder="844 000 0000"
        />

        <Campo
          label="Correo electrónico"
          value={datos.correo}
          onChange={(v) =>
            actualizar("correo", v)
          }
          type="email"
          placeholder="correo@ejemplo.com"
        />

        <Campo
          label="Contraseña"
          type="password"
          placeholder="Crea una contraseña"
        />

        <Navegacion
          atras={() => ir("simulacion")}
          continuar={() => ir("otp")}
        />
      </div>
    </Pagina>
  );
}

function OTP({ datos, ir }) {
  return (
    <Pagina
      titulo="Verifica tu celular"
      subtitulo={
        datos.celular
          ? `Enviamos un código a ${datos.celular}`
          : "Ingresa el código que enviamos a tu celular."
      }
    >
      <Tracker paso={2} />

      <div className="card narrow">
        <Campo
          label="Código de verificación"
          placeholder="000000"
        />

        <button
          className="primary full"
          onClick={() =>
            ir("consentimientos")
          }
        >
          Validar
        </button>
      </div>
    </Pagina>
  );
}

function Consentimientos({ ir }) {
  return (
    <Pagina
      titulo="Antes de continuar"
      subtitulo="Necesitamos algunas autorizaciones."
    >
      <Tracker paso={2} />

      <div className="card">
        <Check
          texto="He leído y acepto el aviso de privacidad."
        />

        <Check
          texto="Autorizo la consulta de información crediticia."
        />

        <Check
          texto="Autorizo el tratamiento de mi información para evaluar la solicitud."
        />

        <Check
          texto="Autorizo validaciones de identidad y geolocalización cuando correspondan."
        />

        <Navegacion
          atras={() => ir("otp")}
          continuar={() =>
            ir("personales")
          }
        />
      </div>
    </Pagina>
  );
}

function Personales({
  datos,
  actualizar,
  ir,
}) {
  return (
    <Pagina
      titulo="Cuéntanos sobre ti"
      subtitulo="Información básica del solicitante."
    >
      <Tracker paso={2} />

      <div className="card">
        <div className="grid2">
          <Campo
            label="Nombre"
            value={datos.nombre}
            onChange={(v) =>
              actualizar("nombre", v)
            }
          />

          <Campo
            label="Apellido paterno"
            value={datos.apellidoPaterno}
            onChange={(v) =>
              actualizar(
                "apellidoPaterno",
                v
              )
            }
          />

          <Campo
            label="Apellido materno"
            value={datos.apellidoMaterno}
            onChange={(v) =>
              actualizar(
                "apellidoMaterno",
                v
              )
            }
          />

          <Campo
            label="CURP"
            value={datos.curp}
            onChange={(v) =>
              actualizar("curp", v)
            }
          />

          <Campo
            label="RFC"
            value={datos.rfc}
            onChange={(v) =>
              actualizar("rfc", v)
            }
          />

          <Campo
            label="Fecha de nacimiento"
            type="date"
            value={datos.nacimiento}
            onChange={(v) =>
              actualizar(
                "nacimiento",
                v
              )
            }
          />
        </div>

        <Navegacion
          atras={() =>
            ir("consentimientos")
          }
          continuar={() =>
            ir("identidad")
          }
        />
      </div>
    </Pagina>
  );
}

function Identidad({ ir }) {
  return (
    <Pagina
      titulo="Verifica tu identidad"
      subtitulo="Necesitamos confirmar que eres tú."
    >
      <Tracker paso={2} />

      <div className="card">
        <Upload
          titulo="INE - frente"
          descripcion="Toma una fotografía clara."
        />

        <Upload
          titulo="INE - reverso"
          descripcion="Asegúrate de que toda la información sea visible."
        />

        <Upload
          titulo="Selfie"
          descripcion="Utilizaremos esta fotografía para validar tu identidad."
        />

        <Navegacion
          atras={() => ir("personales")}
          continuar={() =>
            ir("domicilio")
          }
        />
      </div>
    </Pagina>
  );
}

function Domicilio({
  datos,
  actualizar,
  ir,
}) {
  return (
    <Pagina
      titulo="¿Dónde vives?"
      subtitulo="Ingresa tu domicilio actual."
    >
      <Tracker paso={2} />

      <div className="card">
        <div className="grid2">
          <Campo
            label="Calle"
            value={datos.calle}
            onChange={(v) =>
              actualizar("calle", v)
            }
          />

          <Campo
            label="Colonia"
            value={datos.colonia}
            onChange={(v) =>
              actualizar("colonia", v)
            }
          />

          <Campo
            label="Código postal"
            value={datos.cp}
            onChange={(v) =>
              actualizar("cp", v)
            }
          />

          <Campo
            label="Municipio"
            value={datos.municipio}
            onChange={(v) =>
              actualizar(
                "municipio",
                v
              )
            }
          />

          <Campo
            label="Estado"
            value={datos.estado}
            onChange={(v) =>
              actualizar("estado", v)
            }
          />
        </div>

        <Upload
          titulo="Comprobante de domicilio"
          descripcion="Sube un comprobante reciente."
        />

        <Navegacion
          atras={() =>
            ir("identidad")
          }
          continuar={() =>
            ir("ingresos")
          }
        />
      </div>
    </Pagina>
  );
}

function Ingresos({
  datos,
  actualizar,
  ir,
}) {
  return (
    <Pagina
      titulo="¿A qué te dedicas?"
      subtitulo="Esta información nos ayuda a evaluar tu capacidad de pago."
    >
      <Tracker paso={2} />

      <div className="card">
        <Select
          label="Actividad"
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

        <div className="grid2">
          <Campo
            label="Empresa o actividad"
            value={datos.empresa}
            onChange={(v) =>
              actualizar("empresa", v)
            }
          />

          <Campo
            label="Antigüedad"
            value={datos.antiguedad}
            onChange={(v) =>
              actualizar(
                "antiguedad",
                v
              )
            }
            placeholder="Ej. 2 años"
          />

          <Campo
            label="Ingreso mensual"
            value={datos.ingreso}
            type="number"
            onChange={(v) =>
              actualizar("ingreso", v)
            }
          />
        </div>

        <Navegacion
          atras={() =>
            ir("domicilio")
          }
          continuar={() =>
            ir(
              "documentosFinancieros"
            )
          }
        />
      </div>
    </Pagina>
  );
}

function DocumentosFinancieros({
  ir,
}) {
  return (
    <Pagina
      titulo="Comprueba tus ingresos"
      subtitulo="Sube la información disponible."
    >
      <Tracker paso={2} />

      <div className="card">
        <Upload
          titulo="Estados de cuenta"
          descripcion="Preferentemente los últimos tres meses."
        />

        <Upload
          titulo="Recibos de nómina"
          descripcion="Cuando corresponda."
        />

        <Upload
          titulo="Otro comprobante"
          descripcion="Opcional."
        />

        <Navegacion
          atras={() =>
            ir("ingresos")
          }
          continuar={() =>
            ir("solicitud")
          }
        />
      </div>
    </Pagina>
  );
}

function Solicitud({
  datos,
  actualizar,
  ir,
}) {
  return (
    <Pagina
      titulo="Confirma lo que necesitas"
      subtitulo="Puedes modificar monto, plazo y destino."
    >
      <Tracker paso={2} />

      <div className="card">
        <div className="grid2">
          <Campo
            label="Monto"
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
            label="Plazo"
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
            label="Destino del crédito"
            value={datos.destino}
            onChange={(v) =>
              actualizar("destino", v)
            }
            opciones={[
              "",
              "Capital de trabajo",
              "Inventario",
              "Equipo o maquinaria",
              "Gastos personales",
              "Emergencia",
              "Otro",
            ]}
          />
        </div>

        <Navegacion
          atras={() =>
            ir(
              "documentosFinancieros"
            )
          }
          continuar={() =>
            ir("tipoCredito")
          }
        />
      </div>
    </Pagina>
  );
}

/* =====================================================
   PASO 3 - GARANTÍA
===================================================== */

function TipoCredito({
  datos,
  actualizar,
  ir,
}) {
  return (
    <Pagina
      titulo="Estructura de tu solicitud"
      subtitulo="Selecciona la modalidad para esta demostración."
    >
      <Tracker paso={3} />

      <div className="choiceGrid">
        <button
          className={
            datos.tipoCredito ===
            "sin"
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
            ○
          </span>

          <h3>
            Crédito sin garantía
          </h3>

          <p>
            La evaluación se basará
            principalmente en tu perfil
            y capacidad de pago.
          </p>
        </button>

        <button
          className={
            datos.tipoCredito ===
            "con"
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
            ◇
          </span>

          <h3>
            Crédito con garantía
          </h3>

          <p>
            La operación tendrá una
            garantía adicional como
            respaldo.
          </p>
        </button>
      </div>

      {datos.tipoCredito && (
        <button
          className="primary full"
          onClick={() =>
            datos.tipoCredito ===
            "con"
              ? ir("garantia")
              : ir("revision")
          }
        >
          Continuar
        </button>
      )}
    </Pagina>
  );
}

function Garantia({
  datos,
  actualizar,
  ir,
}) {
  function siguiente() {
    if (
      datos.tipoGarantia ===
      "Obligado solidario"
    ) {
      ir("obligado");
    } else {
      ir("garantiaStatus");
    }
  }

  return (
    <Pagina
      titulo="Garantía del crédito"
      subtitulo="Selecciona el tipo de garantía."
    >
      <Tracker paso={3} />

      <div className="card">
        <Select
          label="Tipo de garantía"
          value={datos.tipoGarantia}
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
                label="Descripción"
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
                label="Valor estimado"
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
                titulo="Documentación"
                descripcion="Sube los documentos disponibles de la garantía."
              />
            </>
          )}

        {datos.tipoGarantia && (
          <button
            className="primary full"
            onClick={siguiente}
          >
            Continuar
          </button>
        )}
      </div>
    </Pagina>
  );
}

function Obligado({
  datos,
  actualizar,
  ir,
}) {
  return (
    <Pagina
      titulo="Invita a tu obligado solidario"
      subtitulo="Realizará su proceso de forma independiente."
    >
      <Tracker paso={3} />

      <div className="card narrow">
        <Campo
          label="Nombre completo"
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
          label="Celular"
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
          label="Correo"
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

        <button
          className="primary full"
          onClick={() =>
            ir("garantiaStatus")
          }
        >
          Enviar invitación
        </button>
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
      titulo="Garantía"
      subtitulo="Te mostraremos únicamente el avance."
    >
      <Tracker paso={3} />

      <div className="card">
        <div className="statusHeader">
          <div>
            <h3>
              {datos.tipoGarantia ||
                "Garantía"}
            </h3>

            <p>
              Validación requerida para
              continuar.
            </p>
          </div>

          <span className="yellowStatus">
            En proceso
          </span>
        </div>

        <div className="demoNotice">
          DEMO: simularemos la validación
          para continuar con el flujo.
        </div>

        <button
          className="primary full"
          onClick={() =>
            ir("revision")
          }
        >
          Simular garantía validada
        </button>
      </div>
    </Pagina>
  );
}

/* =====================================================
   PASO 4 - REVISIÓN
===================================================== */

function Revision({
  datos,
  ir,
}) {
  return (
    <Pagina
      titulo="Revisa tu solicitud"
      subtitulo="Confirma que la información sea correcta."
    >
      <Tracker paso={4} />

      <div className="card">
        <Resumen
          titulo="Solicitante"
          valor={`${datos.nombre} ${datos.apellidoPaterno}`}
        />

        <Resumen
          titulo="Monto solicitado"
          valor={moneda(
            Number(
              datos.montoSolicitado
            )
          )}
        />

        <Resumen
          titulo="Plazo solicitado"
          valor={`${datos.plazoSolicitado} meses`}
        />

        <Resumen
          titulo="Destino"
          valor={datos.destino}
        />

        <Resumen
          titulo="Garantía"
          valor={
            datos.tipoCredito ===
            "con"
              ? datos.tipoGarantia
              : "No requerida"
          }
        />

        <div className="importantNotice">
          Todavía no existe una tasa,
          CAT, comisión ni pago
          definitivo. Las condiciones se
          determinarán durante la
          evaluación de crédito.
        </div>

        <button
          className="primary full"
          onClick={() =>
            ir("enRevision")
          }
        >
          Enviar solicitud
        </button>
      </div>
    </Pagina>
  );
}

function EnRevision({
  datos,
  ir,
}) {
  return (
    <Pagina
      titulo="Estamos revisando tu solicitud"
      subtitulo="Folio TRI-482917"
    >
      <Tracker paso={4} />

      <div className="reviewCard">
        <div className="loaderCircle">
          ...
        </div>

        <h3>
          Solicitud en revisión
        </h3>

        <p>
          Estamos analizando tu
          información para determinar las
          condiciones de tu crédito.
        </p>

        <div className="requestSummary">
          <Resumen
            titulo="Monto solicitado"
            valor={moneda(
              Number(
                datos.montoSolicitado
              )
            )}
          />

          <Resumen
            titulo="Plazo solicitado"
            valor={`${datos.plazoSolicitado} meses`}
          />
        </div>

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
   PASO 5 - OFERTA
   AQUÍ APARECE CAT / TASA / COMISIÓN
===================================================== */

function Oferta({
  datos,
  pagoOferta,
  ir,
}) {
  return (
    <Pagina
      titulo="Tenemos una oferta para ti"
      subtitulo="Revisa cuidadosamente las condiciones aprobadas."
    >
      <Tracker paso={5} />

      <div className="offerCard">
        <p className="offerLabel">
          Monto aprobado
        </p>

        <h2>
          {moneda(
            Number(
              datos.montoAprobado
            )
          )}
        </h2>

        <div className="offerGrid">
          <OfertaDato
            titulo="Plazo"
            valor={`${datos.plazoAprobado} meses`}
          />

          <OfertaDato
            titulo="Tasa anual fija"
            valor={`${datos.tasaAprobada}%`}
          />

          <OfertaDato
            titulo="Pago mensual"
            valor={moneda(
              pagoOferta
            )}
          />

          <OfertaDato
            titulo="Comisión"
            valor={`${datos.comisionAprobada}%`}
          />

          <OfertaDato
            titulo="CAT"
            valor={`${datos.catAprobado}%`}
          />

          <OfertaDato
            titulo="Garantía"
            valor={
              datos.tipoCredito ===
              "con"
                ? datos.tipoGarantia
                : "No requerida"
            }
          />
        </div>

        <div className="catDisclosure">
          <strong>
            CAT {datos.catAprobado}%
          </strong>

          <p>
            Para fines informativos y de
            comparación. Las condiciones
            mostradas corresponden a esta
            oferta.
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
            moratorios y, cuando
            corresponda, comisiones.
          </p>

          {datos.tipoCredito === "con" &&
            datos.tipoGarantia ===
              "Obligado solidario" && (
              <p>
                El obligado solidario
                responderá conforme a las
                obligaciones establecidas
                en los documentos del
                crédito.
              </p>
            )}
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
            Rechazar
          </button>
        </div>
      </div>
    </Pagina>
  );
}

/* =====================================================
   PASO 6 - CONTRATACIÓN
===================================================== */

function CuentaBanco({
  datos,
  actualizar,
  ir,
}) {
  return (
    <Pagina
      titulo="Cuenta bancaria"
      subtitulo="Indica dónde quieres recibir tu crédito."
    >
      <Tracker paso={6} />

      <div className="card narrow">
        <Campo
          label="CLABE"
          value={datos.clabe}
          onChange={(v) =>
            actualizar("clabe", v)
          }
          placeholder="18 dígitos"
        />

        <Check
          texto="Autorizo la domiciliación de los pagos."
        />

        <div className="paymentBox">
          <h3>
            Tarjeta de débito de respaldo
          </h3>

          <p>
            La tarjeta será tokenizada por
            un proveedor externo. TRISAL
            no almacenará CVV.
          </p>

          <button className="secondary">
            Agregar tarjeta
          </button>
        </div>

        <button
          className="primary full"
          onClick={() =>
            ir("contratos")
          }
        >
          Continuar
        </button>
      </div>
    </Pagina>
  );
}

function Contratos({ ir }) {
  return (
    <Pagina
      titulo="Tus documentos"
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

        <button
          className="primary full"
          onClick={() =>
            ir("firma")
          }
        >
          Continuar a firma
        </button>
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
      subtitulo="Último paso antes de enviar el crédito a tesorería."
    >
      <Tracker paso={6} />

      <div className="signatureCard">
        <div className="signatureIcon">
          ✍
        </div>

        <h3>
          Firma del solicitante
        </h3>

        <p>
          Se registrará evidencia de la
          firma y versión documental.
        </p>

        {datos.tipoCredito ===
          "con" && (
          <div className="smallNotice">
            También deberán completarse
            las firmas o formalidades
            asociadas a la garantía.
          </div>
        )}

        <button
          className="primary"
          onClick={() =>
            ir("tesoreriaCliente")
          }
        >
          Firmar
        </button>
      </div>
    </Pagina>
  );
}

function TesoreriaCliente({
  ir,
}) {
  return (
    <Pagina
      titulo="Todo listo"
      subtitulo="Tu crédito pasó a tesorería."
    >
      <Tracker paso={6} />

      <div className="successCard">
        <div className="successIcon">
          ✓
        </div>

        <h2>
          Documentación completa
        </h2>

        <p>
          Estamos validando los últimos
          datos antes de realizar la
          dispersión.
        </p>

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
      subtitulo="El dinero fue enviado a tu cuenta bancaria."
    >
      <div className="successCard">
        <div className="successIcon">
          ✓
        </div>

        <h2>
          Crédito activo
        </h2>

        <p>
          Ya puedes consultar tus pagos
          y documentos desde tu portal.
        </p>

        <button
          className="primary"
          onClick={() =>
            ir("creditoActivo")
          }
        >
          Ver mi crédito
        </button>
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
      titulo={
        datos.nombre
          ? `Hola, ${datos.nombre}`
          : "Mi crédito"
      }
      subtitulo="Consulta y administra tu crédito."
    >
      <div className="clientDashboard">
        <div className="balance">
          <span>
            Saldo inicial
          </span>

          <h2>
            {moneda(
              Number(
                datos.montoAprobado
              )
            )}
          </h2>
        </div>

        <div className="nextPayment">
          <span>
            Próximo pago
          </span>

          <h2>
            {moneda(pagoOferta)}
          </h2>

          <p>
            Próximo vencimiento
          </p>

          <button className="primary">
            Pagar ahora
          </button>
        </div>
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
   PANTALLAS REGULATORIAS
===================================================== */

function UNE({ empresa }) {
  return (
    <Pagina
      titulo="Unidad Especializada de Atención a Usuarios"
      subtitulo="Atención de consultas, aclaraciones y reclamaciones."
    >
      <div className="card">
        <h3>UNE de TRISAL</h3>

        <Resumen
          titulo="Entidad"
          valor={empresa.razonSocial}
        />

        <Resumen
          titulo="Teléfono UNE"
          valor={empresa.uneTelefono}
        />

        <Resumen
          titulo="Correo UNE"
          valor={empresa.uneCorreo}
        />

        <div className="importantNotice">
          Antes de publicar esta página,
          sustituye los campos PENDIENTE
          por los datos oficiales de la
          Unidad Especializada de TRISAL.
        </div>
      </div>

      <div className="card">
        <h3>CONDUSEF</h3>

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
          Ir al sitio oficial de CONDUSEF
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
      <div className="card">
        <h3>
          FDG5 SERVICIOS
        </h3>

        <p className="legalParagraph">
          Para la constitución y operación
          de {empresa.razonSocial} con tal
          carácter, no requiere de
          autorización de la Secretaría de
          Hacienda y Crédito Público.
        </p>

        <p className="legalParagraph">
          {empresa.razonSocial} se
          encuentra sujeta a la supervisión
          de la Comisión Nacional Bancaria
          y de Valores, únicamente para
          efectos de lo dispuesto por el
          artículo 56 de la Ley General de
          Organizaciones y Actividades
          Auxiliares del Crédito.
        </p>
      </div>

      <div className="card">
        <h3>
          Despachos de cobranza
        </h3>

        <p className="legalParagraph">
          La información de los despachos
          de cobranza que, en su caso,
          actúen a nombre de la entidad
          deberá encontrarse disponible
          para que los usuarios puedan
          identificarlos y localizarlos.
        </p>

        <button className="secondary">
          Consultar despachos
        </button>
      </div>
    </Pagina>
  );
}

function Buro() {
  return (
    <Pagina
      titulo="Buró de Entidades Financieras"
      subtitulo="Información para ayudarte a comparar y tomar decisiones."
    >
      <div className="card">
        <div className="buroLogoMock">
          BURÓ DE ENTIDADES FINANCIERAS
        </div>

        <p className="legalParagraph">
          El Buró de Entidades Financieras
          es una herramienta de consulta
          que permite conocer información
          sobre las entidades financieras y
          los productos que ofrecen.
        </p>

        <p className="legalParagraph">
          En el sitio oficial podrás
          consultar información sobre
          productos, comisiones, tasas,
          reclamaciones, sanciones y otros
          elementos relevantes.
        </p>

        <p className="legalParagraph">
          La información correspondiente
          a FDG5 SERVICIOS deberá
          presentarse conforme a la
          información oficial que conste
          en el Buró.
        </p>

        <a
          href="https://www.buro.gob.mx/"
          target="_blank"
          rel="noreferrer"
          className="primary legalAnchor"
        >
          Consultar Buró de Entidades Financieras
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
      subtitulo="Conoce cómo tratamos tus datos personales."
    >
      <div className="card privacyText">
        <h3>
          Responsable
        </h3>

        <p>
          {empresa.razonSocial}, con
          domicilio en{" "}
          {empresa.direccion}, es
          responsable del tratamiento de
          los datos personales que recabe.
        </p>

        <h3>
          Finalidades
        </h3>

        <p>
          Los datos podrán utilizarse para
          identificación, integración de
          expediente, análisis de crédito,
          contratación, administración del
          producto, cumplimiento
          regulatorio, prevención de fraude
          y atención de solicitudes.
        </p>

        <h3>
          Derechos ARCO
        </h3>

        <p>
          El titular podrá ejercer sus
          derechos de acceso,
          rectificación, cancelación y
          oposición conforme al
          procedimiento establecido por la
          entidad.
        </p>

        <div className="importantNotice">
          Esta es una versión de prototipo.
          Antes de producción sustituye
          esta sección por el aviso de
          privacidad definitivo aprobado
          por el área legal.
        </div>
      </div>
    </Pagina>
  );
}

/* =====================================================
   BACKOFFICE
===================================================== */

function BackofficeLogin({ ir }) {
  return (
    <Pagina
      titulo="TRISAL Operaciones"
      subtitulo="Acceso exclusivo para personal autorizado."
    >
      <div className="card narrow">
        <Campo
          label="Correo corporativo"
          placeholder="usuario@trisal.mx"
        />

        <Campo
          label="Contraseña"
          type="password"
        />

        <button
          className="primary full"
          onClick={() =>
            ir("dashboard")
          }
        >
          Iniciar sesión
        </button>
      </div>
    </Pagina>
  );
}

function Dashboard({ ir }) {
  const indicadores = [
    ["Nuevas", "28"],
    ["En revisión", "12"],
    [
      "Información pendiente",
      "6",
    ],
    ["Aprobadas", "9"],
    [
      "Pendientes de firma",
      "4",
    ],
    [
      "Pendientes de dispersión",
      "3",
    ],
    ["Activos", "82"],
    ["Mora", "7"],
  ];

  return (
    <Pagina
      titulo="Dashboard"
      subtitulo="Operación de crédito TRISAL"
    >
      <div className="kpiGrid">
        {indicadores.map(
          ([nombre, numero]) => (
            <div
              className="kpiCard"
              key={nombre}
            >
              <span>{nombre}</span>
              <strong>{numero}</strong>
            </div>
          )
        )}
      </div>

      <div className="buttonRow">
        <button
          className="primary"
          onClick={() =>
            ir("bandeja")
          }
        >
          Solicitudes
        </button>

        <button
          className="secondary"
          onClick={() =>
            ir("tesoreria")
          }
        >
          Tesorería
        </button>

        <button
          className="secondary"
          onClick={() =>
            ir("cobranza")
          }
        >
          Cobranza
        </button>
      </div>
    </Pagina>
  );
}

function Bandeja({ ir }) {
  return (
    <Pagina
      titulo="Solicitudes"
      subtitulo="Bandeja de originación"
    >
      <div className="tableContainer">
        <table>
          <thead>
            <tr>
              <th>Folio</th>
              <th>Cliente</th>
              <th>Monto</th>
              <th>Plazo</th>
              <th>Garantía</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td>TRI-482917</td>
              <td>Cliente demo</td>
              <td>$10,000</td>
              <td>6 meses</td>
              <td>
                Obligado solidario
              </td>
              <td>
                <span className="yellowStatus">
                  En revisión
                </span>
              </td>

              <td>
                <button
                  className="smallDarkButton"
                  onClick={() =>
                    ir("expediente")
                  }
                >
                  Abrir
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Pagina>
  );
}

function Expediente({
  datos,
  ir,
}) {
  const validaciones = [
    ["Identidad", "OK"],
    ["Documentos", "OK"],
    ["Buró", "Revisar"],
    ["PEP/Listas", "OK"],
    ["Ingresos", "OK"],
    [
      "Capacidad de pago",
      "Revisar",
    ],
    [
      "Garantía",
      datos.tipoCredito === "con"
        ? "OK"
        : "No requerida",
    ],
    ["Fraude", "OK"],
  ];

  return (
    <Pagina
      titulo="TRI-482917"
      subtitulo="Expediente digital"
    >
      <div className="tabs">
        {[
          "Resumen",
          "Perfil",
          "Identidad",
          "Domicilio",
          "Ingresos",
          "Bancario",
          "Buró",
          "Documentos",
          "Garantía",
          "Riesgo",
          "Comentarios",
          "Historial",
        ].map((item) => (
          <button key={item}>
            {item}
          </button>
        ))}
      </div>

      <div className="riskGrid">
        {validaciones.map(
          ([nombre, estado]) => (
            <div
              className="riskCard"
              key={nombre}
            >
              <span>
                {nombre}
              </span>

              <strong
                className={
                  estado === "OK"
                    ? "green"
                    : estado ===
                      "Revisar"
                    ? "orange"
                    : ""
                }
              >
                {estado}
              </strong>
            </div>
          )
        )}
      </div>

      <button
        className="primary"
        onClick={() =>
          ir("mesaCredito")
        }
      >
        Ir a Mesa de Crédito
      </button>
    </Pagina>
  );
}

/* =====================================================
   MESA DE CRÉDITO
   DEFINE LAS CONDICIONES
===================================================== */

function MesaCredito({
  datos,
  actualizar,
  ir,
}) {
  const pago =
    calcularPago(
      Number(
        datos.montoAprobado
      ),
      Number(
        datos.tasaAprobada
      ),
      Number(
        datos.plazoAprobado
      )
    );

  return (
    <Pagina
      titulo="Mesa de Crédito"
      subtitulo="Define las condiciones aprobadas para esta solicitud."
    >
      <div className="creditDecisionLayout">
        <div className="card">
          <h3>
            Solicitud
          </h3>

          <Resumen
            titulo="Monto solicitado"
            valor={moneda(
              Number(
                datos.montoSolicitado
              )
            )}
          />

          <Resumen
            titulo="Plazo solicitado"
            valor={`${datos.plazoSolicitado} meses`}
          />

          <Resumen
            titulo="Ingreso mensual"
            valor={moneda(
              Number(datos.ingreso)
            )}
          />

          <Resumen
            titulo="Garantía"
            valor={
              datos.tipoCredito ===
              "con"
                ? datos.tipoGarantia
                : "No requerida"
            }
          />
        </div>

        <div className="card">
          <h3>
            Oferta propuesta
          </h3>

          <Campo
            label="Monto aprobado"
            type="number"
            value={
              datos.montoAprobado
            }
            onChange={(v) =>
              actualizar(
                "montoAprobado",
                v
              )
            }
          />

          <Select
            label="Plazo aprobado"
            value={
              datos.plazoAprobado
            }
            onChange={(v) =>
              actualizar(
                "plazoAprobado",
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

          <Campo
            label="Tasa anual fija (%)"
            type="number"
            value={
              datos.tasaAprobada
            }
            onChange={(v) =>
              actualizar(
                "tasaAprobada",
                v
              )
            }
          />

          <Campo
            label="Comisión (%)"
            type="number"
            value={
              datos.comisionAprobada
            }
            onChange={(v) =>
              actualizar(
                "comisionAprobada",
                v
              )
            }
          />

          <Campo
            label="CAT (%)"
            type="number"
            value={
              datos.catAprobado
            }
            onChange={(v) =>
              actualizar(
                "catAprobado",
                v
              )
            }
          />

          <div className="approvedPayment">
            <span>
              Pago calculado
            </span>

            <strong>
              {moneda(pago)}
            </strong>
          </div>

          <div className="importantNotice">
            En producción, el CAT no debe
            ser un número manual. Debe
            calcularse automáticamente con
            las condiciones aprobadas.
          </div>
        </div>
      </div>

      <div className="decisionButtons">
        <button className="infoDecision">
          Solicitar información
        </button>

        <button
          className="approveDecision"
          onClick={() =>
            ir("dashboard")
          }
        >
          Aprobar
        </button>

        <button className="warningDecision">
          Aprobar con cambios
        </button>

        <button className="rejectDecision">
          Rechazar
        </button>

        <button className="committeeDecision">
          Escalar a comité
        </button>
      </div>
    </Pagina>
  );
}

function Tesoreria() {
  return (
    <Pagina
      titulo="Tesorería"
      subtitulo="Pendientes de dispersar"
    >
      <div className="card">
        <h3>
          TRI-482917
        </h3>

        <Check
          texto="Crédito aprobado"
          marcado
        />

        <Check
          texto="Contrato firmado"
          marcado
        />

        <Check
          texto="Pagaré firmado"
          marcado
        />

        <Check
          texto="Garantía validada o no requerida"
          marcado
        />

        <Check
          texto="CLABE validada"
          marcado
        />

        <Check
          texto="Firmas completas"
          marcado
        />

        <button className="primary full">
          DISPERSAR
        </button>
      </div>
    </Pagina>
  );
}

function Cobranza() {
  return (
    <Pagina
      titulo="Cobranza"
      subtitulo="Seguimiento de cartera"
    >
      <div className="collectionGrid">
        <Cartera
          titulo="CURRENT"
          cantidad="75"
        />

        <Cartera
          titulo="1-7 DPD"
          cantidad="4"
        />

        <Cartera
          titulo="8-30 DPD"
          cantidad="2"
        />

        <Cartera
          titulo="31-60 DPD"
          cantidad="1"
        />

        <Cartera
          titulo="61+ DPD"
          cantidad="0"
        />
      </div>

      <div className="card">
        <h3>
          Automatizaciones
        </h3>

        <ul>
          <li>
            Recordatorio antes del
            vencimiento.
          </li>

          <li>
            Intento automático de cobro.
          </li>

          <li>
            Reintento en caso de fallo.
          </li>

          <li>
            Notificación de pago fallido.
          </li>

          <li>
            Escalamiento a cobranza.
          </li>
        </ul>
      </div>
    </Pagina>
  );
}

/* =====================================================
   COMPONENTES GENERALES
===================================================== */

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

            const activo =
              numero === paso;

            return (
              <div
                className="trackerSection"
                key={nombre}
              >
                <div
                  className={
                    completado
                      ? "trackerDot completed"
                      : activo
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
                    activo
                      ? "trackerLabel currentLabel"
                      : "trackerLabel"
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
        <div className="mobileTrackerHeader">
          <span>
            Paso {paso} de 6
          </span>

          <strong>
            {pasos[paso - 1]}
          </strong>
        </div>

        <div className="mobileProgress">
          <div
            className="mobileProgressValue"
            style={{
              width: `${
                (paso / 6) *
                100
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

function Pagina({
  titulo,
  subtitulo,
  children,
}) {
  return (
    <section className="fadeUp">
      <div className="pageTitle">
        <h1>{titulo}</h1>

        {subtitulo && (
          <p>{subtitulo}</p>
        )}
      </div>

      {children}
    </section>
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
          onChange &&
          onChange(
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

function Check({
  texto,
  marcado = false,
}) {
  return (
    <label className="check">
      <input
        type="checkbox"
        defaultChecked={marcado}
      />

      <span>{texto}</span>
    </label>
  );
}

function Upload({
  titulo,
  descripcion,
}) {
  return (
    <div className="upload">
      <div className="uploadIcon">
        ↑
      </div>

      <div className="uploadInfo">
        <strong>
          {titulo}
        </strong>

        <p>
          {descripcion}
        </p>
      </div>

      <button className="secondary uploadButton">
        Subir
      </button>
    </div>
  );
}

function Navegacion({
  atras,
  continuar,
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
      >
        Continuar
      </button>
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

function OfertaDato({
  titulo,
  valor,
}) {
  return (
    <div className="offerData">
      <span>
        {titulo}
      </span>

      <strong>
        {valor}
      </strong>
    </div>
  );
}

function Documento({
  titulo,
}) {
  return (
    <div className="document">
      <div>
        <strong>
          {titulo}
        </strong>

        <p>
          Documento generado
        </p>
      </div>

      <button className="textButton">
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
      <span>
        {numero}
      </span>

      <strong>
        {texto}
      </strong>
    </div>
  );
}

function Cartera({
  titulo,
  cantidad,
}) {
  return (
    <div className="collectionCard">
      <span>
        {titulo}
      </span>

      <strong>
        {cantidad}
      </strong>
    </div>
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
  ).toLocaleString(
    "es-MX",
    {
      style: "currency",
      currency: "MXN",
    }
  );
}

/* =====================================================
   CSS
===================================================== */

const css = `
* {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  margin: 0;
  background: #f5f5f3;
}

button,
input,
select {
  font-family: inherit;
}

button {
  transition:
    transform .2s ease,
    box-shadow .2s ease,
    background .2s ease;
}

button:hover {
  transform: translateY(-1px);
}

.app {
  min-height: 100vh;
  background:
    radial-gradient(
      circle at 100% 0%,
      rgba(155,117,44,.08),
      transparent 30%
    ),
    #f6f6f4;
  color: #121927;
  font-family:
    Inter,
    Arial,
    sans-serif;
}

/* HEADER */

.header {
  min-height: 82px;
  position: sticky;
  top: 0;
  z-index: 50;
  background:
    rgba(255,255,255,.96);
  backdrop-filter: blur(16px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding:
    10px
    max(
      22px,
      calc(
        (100vw - 1180px)
        / 2
      )
    );
  box-shadow:
    0 1px 18px
    rgba(15,23,42,.06);
}

.logoButton {
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 0;
}

.logo {
  width: 110px;
  display: block;
}

.topActions {
  display: flex;
  align-items: center;
  gap: 5px;
  background: #eef0f3;
  border-radius: 11px;
  padding: 4px;
}

.topButton {
  border: none;
  background: transparent;
  padding: 9px 14px;
  border-radius: 8px;
  color: #697386;
  cursor: pointer;
  font-weight: 750;
}

.topButton.selected {
  background: #121927;
  color: white;
}

.legalDropdown {
  position: relative;
}

.legalMenu {
  position: absolute;
  top: 48px;
  right: 0;
  background: white;
  border-radius: 13px;
  padding: 9px;
  min-width: 250px;
  box-shadow:
    0 18px 50px
    rgba(15,23,42,.16);
  z-index: 100;
}

.legalMenu button {
  display: block;
  width: 100%;
  border: none;
  background: transparent;
  text-align: left;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 700;
  color: #121927;
}

.legalMenu button:hover {
  background: #f3f4f6;
}

/* LAYOUT */

.container {
  width:
    min(
      1100px,
      calc(100% - 36px)
    );
  margin: 0 auto;
  padding: 55px 0 90px;
}

.fadeUp {
  animation:
    fadeUp .55s ease both;
}

@keyframes fadeUp {
  from {
    opacity: 0;
    transform:
      translateY(24px);
  }

  to {
    opacity: 1;
    transform:
      translateY(0);
  }
}

/* LANDING */

.hero {
  min-height: 72vh;
  display: grid;
  grid-template-columns:
    1.2fr .8fr;
  align-items: center;
  gap: 60px;
}

.hero h1 {
  max-width: 720px;
  font-size:
    clamp(
      45px,
      6vw,
      73px
    );
  line-height: .99;
  letter-spacing: -.045em;
  margin: 16px 0 25px;
}

.eyebrow {
  color: #957028;
  font-size: 13px;
  font-weight: 900;
  letter-spacing: .13em;
}

.heroText {
  max-width: 650px;
  font-size: 19px;
  line-height: 1.65;
  color: #5b6779;
}

.heroCard {
  background: white;
  padding: 33px;
  border-radius: 24px;
  box-shadow:
    0 24px 65px
    rgba(15,23,42,.09);
}

.miniStep {
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 16px 0;
  border-bottom:
    1px solid #edf0f3;
}

.miniStep span {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: #121927;
  color: white;
  font-weight: 900;
}

/* PAGE TITLE */

.pageTitle {
  margin-bottom: 26px;
}

.pageTitle h1 {
  font-size:
    clamp(
      34px,
      4vw,
      51px
    );
  letter-spacing: -.035em;
  margin: 0 0 9px;
}

.pageTitle p {
  font-size: 18px;
  color: #657287;
  margin: 0;
  line-height: 1.5;
}

/* TRACKER */

.desktopTracker {
  display: flex;
  align-items: flex-start;
  justify-content:
    space-between;
  margin: 35px 0 43px;
}

.trackerSection {
  flex: 1;
  display: flex;
  align-items: center;
  position: relative;
}

.trackerDot {
  width: 35px;
  height: 35px;
  border-radius: 50%;
  border:
    2px solid #d7dde5;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  color: #8993a1;
  background: #f6f6f4;
  font-weight: 800;
  z-index: 2;
}

.trackerDot.completed {
  background: #1c7551;
  border-color: #1c7551;
  color: white;
}

.trackerDot.current {
  background: #121927;
  border-color: #121927;
  color: white;
}

.trackerLabel {
  position: absolute;
  top: 43px;
  left: -8px;
  font-size: 12px;
  color: #8a94a3;
  white-space: nowrap;
}

.currentLabel {
  color: #121927;
  font-weight: 800;
}

.trackerLine {
  height: 2px;
  background: #dfe3e8;
  flex: 1;
  margin: 0 9px;
}

.completedLine {
  background: #1c7551;
}

.mobileTracker {
  display: none;
}

/* SIMPLE FLOW */

.simpleFlow {
  max-width: 760px;
  margin: 36px auto;
}

.simpleFlowCard {
  background: white;
  border-radius: 18px;
  padding: 21px 25px;
  display: flex;
  align-items: center;
  gap: 19px;
  margin-bottom: 14px;
  box-shadow:
    0 8px 28px
    rgba(15,23,42,.055);
}

.simpleFlowCard h3 {
  margin: 0 0 4px;
}

.simpleFlowCard p {
  margin: 0;
  color: #657287;
}

.stepCircle {
  width: 46px;
  height: 46px;
  border-radius: 13px;
  display: grid;
  place-items: center;
  background: #121927;
  color: white;
  font-weight: 900;
  font-size: 18px;
  flex-shrink: 0;
}

.centerButton {
  display: block;
  margin: 30px auto;
}

/* CARDS */

.card,
.offerCard,
.signatureCard,
.reviewCard,
.successCard {
  background: white;
  border-radius: 21px;
  padding: 30px;
  margin-bottom: 25px;
  box-shadow:
    0 12px 40px
    rgba(15,23,42,.065);
}

.card.narrow {
  max-width: 560px;
}

.grid2 {
  display: grid;
  grid-template-columns:
    1fr 1fr;
  column-gap: 22px;
}

/* FORMS */

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
  color: #364152;
  font-weight: 750;
}

.field input,
.field select {
  width: 100%;
  border:
    1px solid #d4dbe4;
  padding: 14px 15px;
  border-radius: 10px;
  outline: none;
  background: white;
  font-size: 16px;
}

.field input:focus,
.field select:focus {
  border-color: #947128;
  box-shadow:
    0 0 0 3px
    rgba(148,113,40,.09);
}

.label {
  font-weight: 750;
  color: #364152;
}

.optionRow {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin: 12px 0 25px;
}

.optionButton {
  border:
    1px solid #d5dce4;
  background: white;
  padding: 13px 19px;
  border-radius: 11px;
  cursor: pointer;
  font-weight: 750;
}

.selectedOption {
  background: #121927;
  border-color: #121927;
  color: white;
}

/* BUTTONS */

.primary,
.secondary,
.demoButton {
  border: none;
  border-radius: 10px;
  padding: 13px 20px;
  font-size: 15px;
  font-weight: 850;
  cursor: pointer;
}

.primary {
  background: #121927;
  color: white;
}

.primary:hover {
  background: #202a3a;
  box-shadow:
    0 10px 25px
    rgba(15,23,42,.15);
}

.secondary {
  background: white;
  color: #121927;
  border:
    1px solid #cbd3dd;
}

.full {
  width: 100%;
}

.buttonRow,
.navigation {
  display: flex;
  gap: 12px;
  margin-top: 25px;
}

.navigation {
  justify-content:
    space-between;
}

/* NOTICES */

.notice,
.importantNotice,
.smallNotice,
.demoNotice {
  padding: 16px 18px;
  border-radius: 11px;
  margin: 20px 0;
  line-height: 1.55;
}

.notice {
  background: #f2f4f7;
  color: #596579;
}

.importantNotice {
  background: #fff6df;
  color: #71561b;
}

.smallNotice {
  background: #f4f1e9;
  color: #5f4d29;
}

.demoNotice {
  background: #edf3fb;
  color: #335c8c;
}

/* CHECK */

.check {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 15px 0;
  border-bottom:
    1px solid #edf0f3;
  font-weight: 650;
}

.check input {
  width: 18px;
  height: 18px;
}

/* UPLOAD */

.upload {
  border:
    1px dashed #bec7d2;
  padding: 19px;
  border-radius: 14px;
  margin-bottom: 15px;
  display: flex;
  gap: 15px;
  align-items: center;
}

.uploadIcon {
  width: 43px;
  height: 43px;
  border-radius: 50%;
  background: #f1eee6;
  color: #957028;
  display: grid;
  place-items: center;
  font-size: 21px;
  font-weight: 900;
}

.uploadInfo {
  flex: 1;
}

.uploadInfo p {
  margin: 4px 0 0;
  color: #697587;
}

.uploadButton {
  padding: 9px 13px;
}

/* GUARANTEE */

.choiceGrid {
  display: grid;
  grid-template-columns:
    1fr 1fr;
  gap: 22px;
  margin: 30px 0;
}

.bigChoice {
  border:
    2px solid transparent;
  background: white;
  text-align: left;
  padding: 30px;
  border-radius: 20px;
  box-shadow:
    0 10px 35px
    rgba(15,23,42,.06);
  cursor: pointer;
}

.bigChoice:hover {
  border-color: #c7b47f;
  transform:
    translateY(-3px);
}

.bigChoice.chosen {
  border-color: #957028;
  background: #fffcf5;
}

.choiceIcon {
  font-size: 28px;
  color: #957028;
}

.statusHeader {
  display: flex;
  justify-content:
    space-between;
  align-items: center;
}

.yellowStatus {
  background: #fff2c9;
  color: #80600f;
  padding: 8px 11px;
  border-radius: 8px;
  font-weight: 800;
}

/* REVIEW */

.summaryRow {
  display: flex;
  justify-content:
    space-between;
  gap: 30px;
  padding: 15px 0;
  border-bottom:
    1px solid #edf0f3;
}

.reviewCard {
  text-align: center;
  max-width: 680px;
  margin-left: auto;
  margin-right: auto;
}

.loaderCircle {
  width: 68px;
  height: 68px;
  margin:
    0 auto 20px;
  border-radius: 50%;
  background: #f1eee5;
  color: #957028;
  display: grid;
  place-items: center;
  font-size: 25px;
  font-weight: 900;
}

.reviewCard > p {
  color: #697587;
  line-height: 1.6;
}

.requestSummary {
  text-align: left;
  margin: 25px 0;
}

.demoButton {
  background: #eef1f4;
  color: #485465;
}

/* OFFER */

.offerLabel {
  color: #697587;
  margin-bottom: 5px;
}

.offerCard > h2 {
  font-size: 48px;
  margin: 0 0 30px;
}

.offerGrid {
  display: grid;
  grid-template-columns:
    repeat(3, 1fr);
  gap: 14px;
}

.offerData {
  background: #f7f8fa;
  padding: 18px;
  border-radius: 13px;
}

.offerData span {
  display: block;
  color: #697587;
  font-size: 13px;
  margin-bottom: 7px;
}

.offerData strong {
  font-size: 18px;
}

.catDisclosure {
  margin-top: 26px;
  padding: 20px;
  background: #f6f2e8;
  border-radius: 13px;
  border-left:
    4px solid #957028;
}

.catDisclosure strong {
  font-size: 22px;
}

.catDisclosure p {
  margin: 7px 0 0;
  color: #657287;
}

.warningBox {
  margin-top: 18px;
  padding: 19px;
  background: #fff8e8;
  border-radius: 13px;
}

.warningBox p {
  color: #65572f;
  line-height: 1.55;
  margin-bottom: 7px;
}

/* PAYMENT */

.paymentBox {
  background: #f7f8fa;
  border-radius: 13px;
  padding: 19px;
  margin: 20px 0;
}

/* DOCUMENT */

.document {
  display: flex;
  justify-content:
    space-between;
  padding: 17px 0;
  border-bottom:
    1px solid #edf0f3;
}

.document p {
  margin: 4px 0 0;
  color: #697587;
}

.textButton {
  border: none;
  background: none;
  color: #957028;
  cursor: pointer;
  font-weight: 850;
}

/* SIGNATURE */

.signatureCard {
  text-align: center;
  max-width: 650px;
  margin-left: auto;
  margin-right: auto;
  padding: 50px 30px;
}

.signatureIcon {
  font-size: 48px;
}

/* SUCCESS */

.successCard {
  text-align: center;
  max-width: 680px;
  margin-left: auto;
  margin-right: auto;
  padding: 50px 30px;
}

.successIcon {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  margin:
    0 auto 17px;
  background: #1b7951;
  color: white;
  font-size: 34px;
  font-weight: 900;
}

/* CLIENT DASHBOARD */

.clientDashboard {
  display: grid;
  grid-template-columns:
    1.3fr .7fr;
  gap: 20px;
}

.balance,
.nextPayment {
  background: white;
  border-radius: 18px;
  padding: 28px;
  box-shadow:
    0 10px 35px
    rgba(15,23,42,.06);
}

.balance h2,
.nextPayment h2 {
  font-size: 38px;
  margin: 8px 0 15px;
}

.portalOptions {
  display: grid;
  grid-template-columns:
    repeat(3, 1fr);
  gap: 13px;
  margin-top: 22px;
}

.portalOptions button {
  border: none;
  background: white;
  border-radius: 13px;
  padding: 20px;
  cursor: pointer;
  box-shadow:
    0 8px 28px
    rgba(15,23,42,.05);
  font-weight: 750;
}

/* LEGAL */

.legalParagraph {
  color: #4f5b6d;
  line-height: 1.7;
}

.legalLink {
  display: inline-block;
  margin-top: 15px;
  color: #121927;
  font-weight: 800;
}

.legalAnchor {
  text-decoration: none;
  display: inline-block;
  margin-top: 15px;
}

.buroLogoMock {
  background: #121927;
  color: white;
  display: inline-block;
  padding: 17px 20px;
  border-radius: 12px;
  margin-bottom: 18px;
  font-weight: 900;
  letter-spacing: .04em;
}

.privacyText {
  line-height: 1.7;
}

.privacyText h3 {
  margin-top: 28px;
}

/* BACKOFFICE */

.kpiGrid {
  display: grid;
  grid-template-columns:
    repeat(4, 1fr);
  gap: 15px;
}

.kpiCard {
  background: white;
  border-radius: 15px;
  padding: 21px;
  box-shadow:
    0 8px 30px
    rgba(15,23,42,.055);
}

.kpiCard span {
  display: block;
  color: #697587;
}

.kpiCard strong {
  font-size: 31px;
  display: block;
  margin-top: 7px;
}

.tableContainer {
  background: white;
  padding: 10px;
  border-radius: 17px;
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 14px;
  text-align: left;
  border-bottom:
    1px solid #edf0f3;
  white-space: nowrap;
}

th {
  font-size: 13px;
  color: #697587;
}

.smallDarkButton {
  background: #121927;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
}

.tabs {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  margin-bottom: 22px;
}

.tabs button {
  white-space: nowrap;
  background: white;
  border:
    1px solid #d9dfe6;
  padding: 9px 12px;
  border-radius: 8px;
}

.riskGrid {
  display: grid;
  grid-template-columns:
    repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 28px;
}

.riskCard {
  background: white;
  border-radius: 13px;
  padding: 18px;
  display: flex;
  justify-content:
    space-between;
  gap: 10px;
}

.green {
  color: #18744d;
}

.orange {
  color: #b56d19;
}

/* MESA */

.creditDecisionLayout {
  display: grid;
  grid-template-columns:
    1fr 1fr;
  gap: 20px;
}

.approvedPayment {
  background: #f5f2eb;
  padding: 18px;
  border-radius: 12px;
}

.approvedPayment span {
  display: block;
  color: #697587;
}

.approvedPayment strong {
  display: block;
  font-size: 28px;
  margin-top: 6px;
}

.decisionButtons {
  display: grid;
  grid-template-columns:
    repeat(5, 1fr);
  gap: 10px;
}

.decisionButtons button {
  border: none;
  border-radius: 11px;
  padding: 15px 12px;
  font-weight: 800;
  cursor: pointer;
}

.infoDecision {
  background: #e9f2ff;
  color: #285e9a;
}

.approveDecision {
  background: #def4e8;
  color: #17643f;
}

.warningDecision {
  background: #fff1d5;
  color: #80600f;
}

.rejectDecision {
  background: #ffe2e2;
  color: #942c2c;
}

.committeeDecision {
  background: #ece6f5;
  color: #634583;
}

/* COLLECTION */

.collectionGrid {
  display: grid;
  grid-template-columns:
    repeat(5, 1fr);
  gap: 13px;
  margin-bottom: 22px;
}

.collectionCard {
  background: white;
  border-radius: 14px;
  padding: 20px;
}

.collectionCard span {
  color: #697587;
  display: block;
}

.collectionCard strong {
  font-size: 30px;
}

/* FOOTER */

.legalFooter {
  background: #121927;
  color: white;
  padding: 35px 24px;
}

.footerContent {
  width:
    min(
      1180px,
      100%
    );
  margin: auto;
  display: grid;
  grid-template-columns:
    130px
    1fr
    250px;
  gap: 32px;
  align-items: start;
}

.footerLogo {
  width: 100px;
  background: white;
  border-radius: 10px;
}

.footerLegal {
  font-size: 12px;
  line-height: 1.6;
  color: #d1d5db;
}

.footerLegal p {
  margin: 0 0 10px;
}

.footerLinks {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.footerLinks button {
  color: white;
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
  font-weight: 700;
  padding: 5px 0;
}

/* MOBILE */

@media (max-width: 800px) {

  .header {
    min-height: 69px;
    padding: 9px 15px;
  }

  .logo {
    width: 78px;
  }

  .topActions {
    gap: 1px;
  }

  .topButton {
    font-size: 10px;
    padding: 8px 6px;
  }

  .legalMenu {
    position: fixed;
    top: 65px;
    left: 12px;
    right: 12px;
    width: auto;
    min-width: 0;
  }

  .container {
    width:
      calc(
        100% - 26px
      );
    padding:
      30px 0 65px;
  }

  .hero {
    grid-template-columns:
      1fr;
    min-height: auto;
    gap: 32px;
  }

  .hero h1 {
    font-size: 45px;
  }

  .heroCard {
    padding: 23px;
  }

  .desktopTracker {
    display: none;
  }

  .mobileTracker {
    display: block;
    margin:
      25px 0 30px;
  }

  .mobileTrackerHeader {
    display: flex;
    justify-content:
      space-between;
    margin-bottom: 9px;
  }

  .mobileProgress {
    width: 100%;
    height: 7px;
    background: #e3e6ea;
    border-radius: 20px;
    overflow: hidden;
    margin-bottom: 7px;
  }

  .mobileProgressValue {
    height: 100%;
    background: #957028;
    border-radius: 20px;
    transition:
      width .4s ease;
  }

  .mobileTracker small {
    color: #697587;
  }

  .grid2,
  .choiceGrid,
  .offerGrid,
  .clientDashboard,
  .kpiGrid,
  .riskGrid,
  .creditDecisionLayout,
  .collectionGrid {
    grid-template-columns:
      1fr;
  }

  .portalOptions {
    grid-template-columns:
      1fr 1fr;
  }

  .card,
  .offerCard,
  .reviewCard {
    padding: 21px;
  }

  .pageTitle h1 {
    font-size: 36px;
  }

  .pageTitle p {
    font-size: 16px;
  }

  .navigation,
  .buttonRow {
    flex-direction: column;
  }

  .navigation button,
  .buttonRow button {
    width: 100%;
  }

  .decisionButtons {
    grid-template-columns:
      1fr;
  }

  .simpleFlowCard {
    padding: 18px;
  }

  .summaryRow {
    flex-direction: column;
    gap: 5px;
  }

  .footerContent {
    grid-template-columns:
      1fr;
  }

  .footerLogo {
    width: 85px;
  }
}
`;