import { useState } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function App() {
  const [pagina, setPagina] = useState("inicio");

  const [monto, setMonto] = useState("10000");
  const [tasa, setTasa] = useState("49");
  const [plazo, setPlazo] = useState("6");
  const [tipo, setTipo] = useState("frances");
  const [correoCliente, setCorreoCliente] = useState("");

  const comisionApertura = 3;
  const iva = 0.16;

  const empresa = {
    razonSocial: "FDG5 SERVICIOS, S.A. DE C.V. SOFOM ENR",
    marca: "TRISAL",
    telefono: "8441029900",
    telefonoVisible: "844-102-9900",
    correo: "contactofdg5@gmail.com",
    direccion: "Paseo del Valle 310, Colonia San Patricio, Saltillo, Coahuila",
    uneTelefono: "TELÉFONO UNE PENDIENTE",
    uneCorreo: "CORREO UNE PENDIENTE",
  };

  const fechaCalculo = new Date().toLocaleDateString("es-MX");

  const numero = (valor) => Number(valor || 0);

  const formato = (valor) =>
    numero(valor).toLocaleString("es-MX", {
      style: "currency",
      currency: "MXN",
    });

  function calcularTabla() {
    const montoNum = numero(monto);
    const tasaMensual = numero(tasa) / 100 / 12;
    const meses = numero(plazo);
    let saldo = montoNum;
    const tabla = [];

    if (montoNum <= 0 || meses <= 0) return [];

    let pagoFijo = 0;

    if (tipo === "frances") {
      pagoFijo =
        tasaMensual === 0
          ? montoNum / meses
          : (montoNum * tasaMensual) /
            (1 - Math.pow(1 + tasaMensual, -meses));
    }

    const capitalFijo = montoNum / meses;

    for (let i = 1; i <= meses; i++) {
      const saldoInicial = saldo;
      const interes = saldoInicial * tasaMensual;

      let capital = 0;
      let pago = 0;

      if (tipo === "frances") {
        pago = pagoFijo;
        capital = pago - interes;
      }

      if (tipo === "aleman") {
        capital = capitalFijo;
        pago = capital + interes;
      }

      if (tipo === "bullet") {
        capital = i === meses ? saldoInicial : 0;
        pago = interes + capital;
      }

      saldo = Math.max(0, saldoInicial - capital);

      tabla.push({
        periodo: i,
        saldoInicial,
        pago,
        interes,
        capital,
        saldo,
      });
    }

    return tabla;
  }

  const tabla = calcularTabla();

  function calcularCAT() {
    const montoNum = numero(monto);
    if (!tabla.length || montoNum <= 0) return 0;

    const comisionAperturaMonto = montoNum * (comisionApertura / 100);
    const ivaComision = comisionAperturaMonto * iva;
    const montoNetoCliente = montoNum - comisionAperturaMonto - ivaComision;

    const flujos = [montoNetoCliente, ...tabla.map((fila) => -fila.pago)];

    let bajo = 0;
    let alto = 1;

    function vpn(tasaPeriodo) {
      return flujos.reduce((acc, flujo, i) => {
        return acc + flujo / Math.pow(1 + tasaPeriodo, i);
      }, 0);
    }

    while (vpn(alto) > 0 && alto < 10) {
      alto = alto * 2;
    }

    for (let i = 0; i < 100; i++) {
      const medio = (bajo + alto) / 2;

      if (vpn(medio) > 0) {
        bajo = medio;
      } else {
        alto = medio;
      }
    }

    const tasaMensualCAT = (bajo + alto) / 2;
    return (Math.pow(1 + tasaMensualCAT, 12) - 1) * 100;
  }

  const catEstimado = calcularCAT();

  function exportarExcel() {
    const libro = XLSX.utils.book_new();

    const resumen = [
      ["Empresa", empresa.razonSocial],
      ["Marca", empresa.marca],
      ["Teléfono", empresa.telefonoVisible],
      ["Correo", empresa.correo],
      ["Dirección", empresa.direccion],
      ["Monto solicitado", numero(monto)],
      ["Tasa anual fija", tasa + "%"],
      ["Comisión por apertura", comisionApertura + "% + IVA"],
      ["CAT estimado", catEstimado.toFixed(2) + "%"],
      ["Fecha de cálculo CAT", fechaCalculo],
      ["Plazo", plazo + " meses"],
      ["Tipo de amortización", tipo],
      ["Pago estimado", tabla[0]?.pago || 0],
    ];

    const detalle = tabla.map((fila) => ({
      Periodo: fila.periodo,
      "Saldo inicial": fila.saldoInicial,
      Pago: fila.pago,
      Interes: fila.interes,
      Capital: fila.capital,
      "Saldo final": fila.saldo,
    }));

    XLSX.utils.book_append_sheet(libro, XLSX.utils.aoa_to_sheet(resumen), "Resumen");
    XLSX.utils.book_append_sheet(libro, XLSX.utils.json_to_sheet(detalle), "Amortizacion");
    XLSX.writeFile(libro, "cotizacion_trisal.xlsx");
  }

  function generarPDF() {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Cotización de Crédito TRISAL", 14, 18);

    doc.setFontSize(10);
    doc.text(empresa.razonSocial, 14, 28);
    doc.text("Teléfono: " + empresa.telefonoVisible, 14, 34);
    doc.text("Correo: " + empresa.correo, 14, 40);
    doc.text("Dirección: " + empresa.direccion, 14, 46);

    doc.setFontSize(11);
    doc.text("Monto solicitado: " + formato(monto), 14, 58);
    doc.text("Tasa anual fija: " + tasa + "%", 14, 65);
    doc.text("Comisión por apertura: " + comisionApertura + "% + IVA", 14, 72);
    doc.text("CAT estimado: " + catEstimado.toFixed(2) + "%", 14, 79);
    doc.text("Fecha de cálculo: " + fechaCalculo, 14, 86);
    doc.text("Plazo: " + plazo + " meses", 14, 93);
    doc.text("Pago estimado: " + formato(tabla[0]?.pago || 0), 14, 100);

    autoTable(doc, {
      startY: 108,
      head: [["Periodo", "Saldo inicial", "Pago", "Interés", "Capital", "Saldo"]],
      body: tabla.map((fila) => [
        fila.periodo,
        formato(fila.saldoInicial),
        formato(fila.pago),
        formato(fila.interes),
        formato(fila.capital),
        formato(fila.saldo),
      ]),
    });

    doc.save("cotizacion_trisal.pdf");
  }

  function enviarCotizacion() {
    if (!correoCliente) {
      alert("Escribe el correo del cliente.");
      return;
    }

    alert("Por ahora puedes descargar PDF y Excel. El envío automático requiere backend.");
  }

  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <button onClick={() => setPagina("inicio")} style={styles.logoButton}>
          <img src="/logo-trisal.jpeg" alt="TRISAL" style={styles.logo} />
        </button>

        <div style={styles.menu}>
          <button onClick={() => setPagina("inicio")} style={botonMenu(pagina === "inicio")}>Inicio</button>
          <button onClick={() => setPagina("servicios")} style={botonMenu(pagina === "servicios")}>Servicios</button>
          <button onClick={() => setPagina("productos")} style={botonMenu(pagina === "productos")}>Productos</button>
          <button onClick={() => setPagina("ubicacion")} style={botonMenu(pagina === "ubicacion")}>Ubicación</button>
          <button onClick={() => setPagina("contacto")} style={botonMenu(pagina === "contacto")}>Contacto</button>
          <button onClick={() => setPagina("normatividad")} style={botonMenu(pagina === "normatividad")}>Normatividad</button>
          <button onClick={() => setPagina("privacidad")} style={botonMenu(pagina === "privacidad")}>Privacidad</button>
          <button onClick={() => setPagina("simulador")} style={styles.botonDorado}>Simula tu crédito</button>
        </div>
      </nav>

      <main style={styles.main}>
        {pagina === "inicio" && (
          <section style={styles.hero}>
            <div>
              <p style={styles.kicker}>SOFOM ENR · Norte de México</p>
              <h1 style={styles.heroTitle}>Financiamiento serio para proyectos productivos.</h1>
              <p style={styles.heroText}>
                Soluciones de crédito y estructuras fiduciarias para empresas, productores y negocios.
              </p>
              <button onClick={() => setPagina("simulador")} style={styles.cta}>
                Simula tu crédito
              </button>
            </div>
            <img src="/logo-trisal.jpeg" alt="TRISAL" style={styles.heroLogo} />
          </section>
        )}

        {pagina === "servicios" && (
          <Pagina titulo="Servicios">
            <div style={styles.cards}>
              <Tarjeta titulo="Análisis de crédito" texto="Evaluamos capacidad de pago, flujo, garantías y destino del financiamiento." />
              <Tarjeta titulo="Estructuración financiera" texto="Diseñamos pagos, plazos y condiciones según cada cliente." />
              <Tarjeta titulo="Acompañamiento" texto="Atención durante solicitud, autorización, disposición y seguimiento." />
            </div>
          </Pagina>
        )}

        {pagina === "productos" && (
          <Pagina titulo="Productos">
            <div style={styles.cards}>
              <Tarjeta
                titulo="Crédito simple"
                texto={`Tasa de interés fija. CAT estimado calculado al ${fechaCalculo}. Comisión por apertura de ${comisionApertura}% más IVA. Requisitos sujetos a evaluación.`}
              />
              <Tarjeta
                titulo="Fideicomiso"
                texto="Estructuras para administración, garantía y protección patrimonial. Condiciones y requisitos sujetos al tipo de operación."
              />
            </div>

            <div style={styles.card}>
              <h3>Advertencias aplicables</h3>
              <ul>
                <li>Incumplir tus obligaciones te puede generar comisiones e intereses moratorios.</li>
                <li>Contratar créditos que excedan tu capacidad de pago afecta tu historial crediticio.</li>
                <li>El avalista, obligado solidario o coacreditado responderá como obligado principal por el total del pago frente a la Entidad Financiera.</li>
              </ul>
              <p><b>Tasa:</b> fija.</p>
              <p><b>Comisiones:</b> comisión por apertura de {comisionApertura}% más IVA, sujeta a autorización y condiciones finales.</p>
              <p><b>Requisitos de contratación:</b> pendientes de integrar con la información que nos proporciones.</p>
            </div>
          </Pagina>
        )}

        {pagina === "ubicacion" && (
          <Pagina titulo="Ubicación">
            <div style={styles.card}>
              <p><b>Dirección:</b> {empresa.direccion}</p>
              <p><b>Horario:</b> Lunes a viernes de 9:00 AM a 5:00 PM</p>
              <a
                href="https://www.google.com/maps/search/?api=1&query=Paseo+del+Valle+310+San+Patricio+Saltillo+Coahuila"
                target="_blank"
                rel="noreferrer"
                style={styles.mapButton}
              >
                Abrir ubicación en Google Maps
              </a>
              <iframe
                title="Mapa TRISAL"
                src="https://www.google.com/maps?q=Paseo%20del%20Valle%20310%20San%20Patricio%20Saltillo%20Coahuila&output=embed"
                width="100%"
                height="360"
                style={styles.map}
                loading="lazy"
              ></iframe>
            </div>
          </Pagina>
        )}

        {pagina === "contacto" && (
          <Pagina titulo="Contacto">
            <div style={styles.card}>
              <p><b>Teléfono:</b> <a href={"tel:" + empresa.telefono} style={styles.link}>{empresa.telefonoVisible}</a></p>
              <p>
                <b>WhatsApp:</b>{" "}
                <a
                  href={"https://wa.me/52" + empresa.telefono + "?text=Hola,%20quiero%20información%20sobre%20un%20crédito."}
                  target="_blank"
                  rel="noreferrer"
                  style={styles.link}
                >
                  Enviar mensaje por WhatsApp
                </a>
              </p>
              <p><b>Correo:</b> <a href={"mailto:" + empresa.correo} style={styles.link}>{empresa.correo}</a></p>
            </div>
          </Pagina>
        )}

        {pagina === "normatividad" && (
          <Pagina titulo="Normatividad y transparencia">
            <div style={styles.card}>
              <h3>Unidad Especializada de Atención a Usuarios</h3>
              <p><b>Teléfono UNE:</b> {empresa.uneTelefono}</p>
              <p><b>Correo UNE:</b> {empresa.uneCorreo}</p>
            </div>

            <div style={styles.card}>
              <h3>CONDUSEF y Buró de Entidades Financieras</h3>
              <p><b>CONDUSEF:</b> <a href="https://www.condusef.gob.mx/" target="_blank" rel="noreferrer" style={styles.link}>www.condusef.gob.mx</a></p>
              <p><b>Buró de Entidades Financieras:</b> <a href="http://www.buro.gob.mx" target="_blank" rel="noreferrer" style={styles.link}>www.buro.gob.mx</a></p>

              <div style={styles.buroBox}>
                Buró de Entidades Financieras
              </div>

              <p>
                El Buró de Entidades Financieras permite conocer información de entidades financieras,
                productos y servicios, así como comparar y evaluar alternativas. La información mostrada
                corresponde únicamente a la Entidad Financiera de que se trate; para consultar información
                del sector correspondiente, accede al sitio oficial.
              </p>
            </div>

            <div style={styles.card}>
              <h3>Despachos de cobranza</h3>
              <p>
                Los datos de los despachos de cobranza estarán disponibles para los clientes por medios
                electrónicos y en sucursales o establecimientos, a fin de que puedan identificarlos y localizarlos.
              </p>
            </div>
          </Pagina>
        )}

        {pagina === "privacidad" && (
          <Pagina titulo="Aviso de privacidad">
            <div style={styles.card}>
              <p>
                {empresa.razonSocial}, con domicilio en {empresa.direccion}, es responsable del tratamiento
                de los datos personales que recabe para fines de identificación, análisis, evaluación,
                contratación, administración y seguimiento de productos o servicios financieros.
              </p>
              <p>
                Los datos podrán utilizarse para contacto, integración de expediente, cumplimiento normativo,
                prevención de operaciones ilícitas y atención de solicitudes. El titular podrá ejercer sus
                derechos ARCO a través del correo {empresa.correo}.
              </p>
              <p>
                Este aviso es una versión base y debe ser revisado por asesor legal antes de publicarse como
                aviso definitivo.
              </p>
            </div>
          </Pagina>
        )}

        {pagina === "simulador" && (
          <Pagina titulo="Simula tu crédito">
            <section style={styles.card}>
              <h3>Parámetros del crédito</h3>
              <div style={styles.grid}>
                <Input label="Monto solicitado" value={monto} setValue={setMonto} />
                <Input label="Tasa anual fija (%)" value={tasa} setValue={setTasa} />
                <Input label="Plazo (meses)" value={plazo} setValue={setPlazo} />
                <div>
                  <label>Tipo de amortización</label>
                  <select value={tipo} onChange={(e) => setTipo(e.target.value)} style={styles.input}>
                    <option value="frances">Francés / pago fijo</option>
                    <option value="aleman">Alemán / capital fijo</option>
                    <option value="bullet">Bullet / pago final</option>
                  </select>
                </div>
              </div>
            </section>

            <section style={styles.resumen}>
              <Metrica titulo="Pago mensual estimado" valor={formato(tabla[0]?.pago || 0)} />
              <Metrica titulo="CAT estimado" valor={catEstimado.toFixed(2) + "%"} />
            </section>

            <section style={styles.card}>
              <p>
                CAT estimado para fines informativos y de comparación. Fecha de cálculo: {fechaCalculo}.
                Tasa de interés fija. Comisión por apertura considerada: {comisionApertura}% más IVA.
                El resultado puede variar conforme al monto, plazo y condiciones finales.
              </p>
              <p><b>Advertencia:</b> Contratar créditos que excedan tu capacidad de pago afecta tu historial crediticio.</p>
            </section>

            <section style={styles.card}>
              <h3>Exportar o enviar cotización</h3>
              <input
                type="email"
                value={correoCliente}
                onChange={(e) => setCorreoCliente(e.target.value)}
                placeholder="cliente@correo.com"
                style={styles.input}
              />
              <div style={styles.buttons}>
                <button onClick={exportarExcel} style={styles.primaryButton}>Descargar Excel</button>
                <button onClick={generarPDF} style={styles.secondaryButton}>Descargar PDF</button>
                <button onClick={enviarCotizacion} style={styles.goldButton}>Enviar por correo</button>
              </div>
            </section>

            <section style={styles.card}>
              <h3>Tabla de amortización</h3>
              <div style={{ overflowX: "auto" }}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th>Periodo</th>
                      <th>Saldo inicial</th>
                      <th>Pago</th>
                      <th>Interés</th>
                      <th>Capital</th>
                      <th>Saldo final</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tabla.map((fila) => (
                      <tr key={fila.periodo}>
                        <td>{fila.periodo}</td>
                        <td>{formato(fila.saldoInicial)}</td>
                        <td>{formato(fila.pago)}</td>
                        <td>{formato(fila.interes)}</td>
                        <td>{formato(fila.capital)}</td>
                        <td>{formato(fila.saldo)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </Pagina>
        )}
      </main>

      <footer style={styles.footer}>
        <p>
          Para la constitución y operación de {empresa.razonSocial} con tal carácter,
          no requiere de autorización de la Secretaría de Hacienda y Crédito Público.
        </p>
        <p>
          {empresa.razonSocial} se encuentra sujeta a la supervisión de la Comisión Nacional
          Bancaria y de Valores, únicamente para efectos de lo dispuesto por el artículo 56 de
          la Ley General de Organizaciones y Actividades Auxiliares del Crédito.
        </p>
      </footer>
    </div>
  );
}

function Pagina({ titulo, children }) {
  return (
    <div>
      <h2 style={styles.sectionTitle}>{titulo}</h2>
      {children}
    </div>
  );
}

function Tarjeta({ titulo, texto }) {
  return (
    <div style={styles.infoCard}>
      <h3>{titulo}</h3>
      <p>{texto}</p>
    </div>
  );
}

function Input({ label, value, setValue }) {
  return (
    <div>
      <label>{label}</label>
      <input type="number" value={value} onChange={(e) => setValue(e.target.value)} style={styles.input} />
    </div>
  );
}

function Metrica({ titulo, valor }) {
  return (
    <div style={styles.metricCard}>
      <p>{titulo}</p>
      <h3>{valor}</h3>
    </div>
  );
}

function botonMenu(activo) {
  return {
    background: activo ? "#111827" : "transparent",
    color: activo ? "white" : "#111827",
    border: "none",
    padding: "12px 15px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "17px",
  };
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f5f3ef",
    fontFamily: "Arial, sans-serif",
    color: "#111827",
  },
  nav: {
    position: "sticky",
    top: 0,
    zIndex: 10,
    background: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "18px",
    padding: "16px 36px",
    boxShadow: "0 4px 18px rgba(0,0,0,0.08)",
  },
  logoButton: {
    border: "none",
    background: "transparent",
    cursor: "pointer",
  },
  logo: {
    width: "115px",
  },
  menu: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  },
  botonDorado: {
    background: "#8a6a2f",
    color: "white",
    border: "none",
    padding: "12px 16px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "17px",
  },
  main: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "40px 26px 70px",
  },
  hero: {
    minHeight: "72vh",
    display: "grid",
    gridTemplateColumns: "1.4fr 0.8fr",
    gap: "34px",
    alignItems: "center",
  },
  kicker: {
    color: "#8a6a2f",
    fontWeight: "bold",
  },
  heroTitle: {
    fontSize: "48px",
    lineHeight: "1.05",
    color: "#111827",
  },
  heroText: {
    fontSize: "18px",
    color: "#4b5563",
    lineHeight: 1.6,
  },
  cta: {
    marginTop: "18px",
    background: "#111827",
    color: "white",
    padding: "14px 20px",
    borderRadius: "12px",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "16px",
  },
  heroLogo: {
    width: "100%",
    background: "white",
    padding: "30px",
    borderRadius: "24px",
    boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
  },
  sectionTitle: {
    color: "#111827",
    fontSize: "38px",
    marginBottom: "24px",
  },
  cards: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "20px",
  },
  infoCard: {
    background: "white",
    padding: "26px",
    borderRadius: "16px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
    borderTop: "5px solid #8a6a2f",
  },
  card: {
    background: "white",
    padding: "28px",
    borderRadius: "16px",
    marginBottom: "24px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "20px",
  },
  input: {
    width: "100%",
    padding: "13px",
    marginTop: "8px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    fontSize: "16px",
    boxSizing: "border-box",
  },
  resumen: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "20px",
    marginBottom: "24px",
  },
  metricCard: {
    background: "white",
    padding: "22px",
    borderRadius: "16px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
  },
  buttons: {
    display: "flex",
    gap: "12px",
    marginTop: "24px",
    flexWrap: "wrap",
  },
  primaryButton: {
    background: "#111827",
    color: "white",
    border: "none",
    padding: "12px 20px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  secondaryButton: {
    background: "white",
    color: "#111827",
    border: "1px solid #111827",
    padding: "12px 20px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  goldButton: {
    background: "#8a6a2f",
    color: "white",
    border: "none",
    padding: "12px 20px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  mapButton: {
    display: "inline-block",
    margin: "14px 0",
    background: "#111827",
    color: "white",
    padding: "12px 16px",
    borderRadius: "10px",
    textDecoration: "none",
    fontWeight: "bold",
  },
  map: {
    border: "0",
    borderRadius: "16px",
    marginTop: "14px",
  },
  link: {
    color: "#111827",
    fontWeight: "bold",
  },
  buroBox: {
    display: "inline-block",
    background: "#111827",
    color: "white",
    padding: "14px 18px",
    borderRadius: "12px",
    margin: "12px 0",
    fontWeight: "bold",
  },
  footer: {
    background: "#111827",
    color: "white",
    padding: "24px 36px",
    fontSize: "13px",
    lineHeight: 1.5,
  },
};