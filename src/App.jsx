import { useState } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function App() {
  const [pagina, setPagina] = useState("inicio");

  const [monto, setMonto] = useState("250000");
  const [tasa, setTasa] = useState("18");
  const [plazo, setPlazo] = useState("24");
  const [tipo, setTipo] = useState("frances");
  const [correoCliente, setCorreoCliente] = useState("");

  const EMPRESA = {
    nombre: "TRISAL",
    telefono: "8441029900",
    telefonoVisible: "844-102-9900",
    correo: "contactofdg5@gmail.com",
    direccion: "Paseo del Valle 310, Colonia San Patricio, Saltillo, Coahuila",
  };

  const n = (valor) => Number(valor || 0);

  const formato = (valor) =>
    n(valor).toLocaleString("es-MX", {
      style: "currency",
      currency: "MXN",
    });

  const calcularTabla = () => {
    const montoNum = n(monto);
    const tasaMensual = n(tasa) / 100 / 12;
    const meses = n(plazo);
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
  };

  const tabla = calcularTabla();

  const totalInteres = tabla.reduce((acc, r) => acc + r.interes, 0);
  const totalPago = tabla.reduce((acc, r) => acc + r.pago, 0);

  const exportarExcel = () => {
    const libro = XLSX.utils.book_new();

    const resumen = [
      ["Empresa", EMPRESA.nombre],
      ["Teléfono", EMPRESA.telefonoVisible],
      ["Correo", EMPRESA.correo],
      ["Dirección", EMPRESA.direccion],
      ["Monto solicitado", n(monto)],
      ["Tasa anual", `${tasa}%`],
      ["Plazo", `${plazo} meses`],
      ["Tipo de amortización", tipo],
      ["Pago estimado", tabla[0]?.pago || 0],
      ["Total intereses", totalInteres],
      ["Total pagado", totalPago],
    ];

    const detalle = tabla.map((r) => ({
      Periodo: r.periodo,
      "Saldo inicial": r.saldoInicial,
      Pago: r.pago,
      Interés: r.interes,
      Capital: r.capital,
      "Saldo final": r.saldo,
    }));

    XLSX.utils.book_append_sheet(libro, XLSX.utils.aoa_to_sheet(resumen), "Resumen");
    XLSX.utils.book_append_sheet(libro, XLSX.utils.json_to_sheet(detalle), "Amortización");
    XLSX.writeFile(libro, "cotizacion_trisal.xlsx");
  };

  const generarPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Cotización de Crédito TRISAL", 14, 18);

    doc.setFontSize(10);
    doc.text(`Teléfono: ${EMPRESA.telefonoVisible}`, 14, 28);
    doc.text(`Correo: ${EMPRESA.correo}`, 14, 34);
    doc.text(`Dirección: ${EMPRESA.direccion}`, 14, 40);

    doc.setFontSize(11);
    doc.text(`Monto solicitado: ${formato(monto)}`, 14, 52);
    doc.text(`Tasa anual: ${tasa}%`, 14, 59);
    doc.text(`Plazo: ${plazo} meses`, 14, 66);
    doc.text(`Tipo de amortización: ${tipo}`, 14, 73);
    doc.text(`Pago estimado: ${formato(tabla[0]?.pago || 0)}`, 14, 80);

    autoTable(doc, {
      startY: 90,
      head: [["Periodo", "Saldo inicial", "Pago", "Interés", "Capital", "Saldo"]],
      body: tabla.map((r) => [
        r.periodo,
        formato(r.saldoInicial),
        formato(r.pago),
        formato(r.interes),
        formato(r.capital),
        formato(r.saldo),
      ]),
    });

    doc.save("cotizacion_trisal.pdf");
  };

  const enviarCotizacion = () => {
    if (!correoCliente) {
      alert("Escribe el correo del cliente.");
      return;
    }

    alert(
      "Para enviar PDF y Excel por correo automáticamente necesitamos configurar backend con Vercel + Resend o SendGrid. Por ahora puedes descargar los archivos."
    );
  };

  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <button onClick={() => setPagina("inicio")} style={styles.logoButton}>
          <img src="/logo-trisal.jpeg" alt="TRISAL" style={styles.navLogo} />
        </button>

        <div style={styles.navLinks}>
          <button onClick={() => setPagina("inicio")} style={navStyle(pagina === "inicio")}>Inicio</button>
          <button onClick={() => setPagina("servicios")} style={navStyle(pagina === "servicios")}>Servicios</button>
          <button onClick={() => setPagina("productos")} style={navStyle(pagina === "productos")}>Productos</button>
          <button onClick={() => setPagina("ubicacion")} style={navStyle(pagina === "ubicacion")}>Ubicación</button>
          <button onClick={() => setPagina("contacto")} style={navStyle(pagina === "contacto")}>Contacto</button>
          <button onClick={() => setPagina("simulador")} style={styles.navButton}>Simula tu crédito</button>
        </div>
      </nav>

      <main style={styles.main}>
        {pagina === "inicio" && (
          <div style={styles.hero}>
            <div>
              <p style={styles.kicker}>SOFOM · Norte de México</p>
              <h1 style={styles.heroTitle}>Financiamiento serio para proyectos productivos.</h1>
              <p style={styles.heroText}>
                Soluciones de crédito para empresas, productores y negocios que buscan crecer
                con estructura, claridad y acompañamiento financiero.
              </p>
              <button onClick={() => setPagina("simulador")} style={styles.cta}>
                Simula tu crédito
              </button>
            </div>

            <img src="/logo-trisal.jpeg" alt="TRISAL" style={styles.heroLogo} />
          </div>
        )}

        {pagina === "servicios" && (
          <Page title="Servicios">
            <div style={styles.cards3}>
              <InfoCard title="Análisis de crédito" text="Evaluamos capacidad de pago, flujo, garantías y destino del financiamiento." />
              <InfoCard title="Estructuración financiera" text="Diseñamos pagos, plazos y condiciones según cada cliente." />
              <InfoCard title="Acompañamiento" text="Atención durante solicitud, autorización, disposición y seguimiento." />
            </div>
          </Page>
        )}

        {pagina === "productos" && (
          <Page title="Productos">
            <div style={styles.cards3}>
              <InfoCard title="Crédito simple" text="Capital para operación, inversión, inventario o crecimiento." />
              <InfoCard title="Crédito agropecuario" text="Financiamiento para productores, ranchos, maquinaria e insumos." />
              <InfoCard title="Crédito empresarial" text="Soluciones para PyMEs, comercio, transporte y servicios." />
              <InfoCard title="Fideicomisos" text="Estructuras para administración, garantía y protección patrimonial." />
            </div>
          </Page>
        )}

        {pagina === "ubicacion" && (
          <Page title="Ubicación">
            <div style={styles.card}>
              <p><b>Dirección:</b> {EMPRESA.direccion}</p>
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
              />
            </div>
          </Page>
        )}

        {pagina === "contacto" && (
          <Page title="Contacto">
            <div style={styles.card}>
              <p>
                <b>Teléfono:</b>{" "}
                <a href={`tel:${EMPRESA.telefono}`} style={styles.link}>
                  {EMPRESA.telefonoVisible}
                </a>
              </p>

              <p>
                <b>WhatsApp:</b>{" "}
                <a
                  href={`https://wa.me/52${EMPRESA.telefono}?text=Hola,%20quiero%20información%20sobre%20un%20crédito.`}
                  target="_blank"
                  rel="noreferrer"
                  style={styles.link}
                >
                  Enviar mensaje por WhatsApp
                </a>
              </p>

              <p>
                <b>Correo:</b>{" "}
                <a
                  href={`mailto:${EMPRESA.correo}?subject=Solicitud%20de%20información%20de%20crédito`}
                  style={styles.link}
                >
                  {EMPRESA.correo}
                </a>
              </p>
            </div>
          </Page>
        )}

        {pagina === "simulador" && (
          <Page title="Simula tu crédito">
            <section style={styles.card}>
              <h3>Parámetros del crédito</h3>

              <div style={styles.grid}>
                <Input label="Monto solicitado" value={monto} setValue={setMonto} />
                <Input label="Tasa anual (%)" value={tasa} setValue={setTasa} />
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

            <section style={styles.summaryGrid}>
              <MetricCard title="Pago mensual estimado" value={formato(tabla[0]?.pago || 0)} />
              <MetricCard title="Total intereses" value={formato(totalInteres)} />
              <MetricCard title="Total pagado" value={formato(totalPago)} />
            </section>

            <section style={styles.card}>
              <h3>Exportar o enviar cotización</h3>

              <div style={styles.grid}>
                <div>
                  <label>Correo del cliente</label>
                  <input
                    type="email"
                    value={correoCliente}
                    onChange={(e) => setCorreoCliente(e.target.value)}
                    placeholder="cliente@correo.com"
                    style={styles.input}
                  />
                </div>
              </div>

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
                    {tabla.map((r) => (
                      <tr key={r.periodo}>
                        <td>{r.periodo}</td>
                        <td>{formato(r.saldoInicial)}</td>
                        <td>{formato(r.pago)}</td>
                        <td>{formato(r.interes)}</td>
                        <td>{formato(r.capital)}</td>
                        <td>{formato(r.saldo)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </Page>
        )}
      </main>
    </div>
  );
}

function Page({ title, children }) {
  return (
    <div>
      <h2 style={styles.sectionTitle}>{title}</h2>
      {children}
    </div>
  );
}

function InfoCard({ title, text }) {
  return (
    <div style={styles.infoCard}>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

function Input({ label, value, setValue }) {
  return (
    <div>
      <label>{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        style={styles.input}
      />
    </div>
  );
}

function MetricCard({ title, value }) {
  return (
    <div style={styles.metricCard}>
      <p>{title}</p>
      <h3>{value}</h3>
    </div>
  );
}

function navStyle(active) {
  return {
    background: active ? "#111827" : "transparent",
    color: active ? "white" : "#111827",
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
    borderBottom: "1px solid #e5e7eb",
  },
  logoButton: {
    border: "none",
    background: "transparent",
    cursor: "pointer",
  },
  navLogo: {
    width: "115px",
  },
  navLinks: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  },
  navButton: {
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
    letterSpacing: "0.08em",
  },
  heroTitle: {
    fontSize: "48px",
    lineHeight: "1.05",
    margin: "12px 0",
    color: "#111827",
  },
  heroText: {
    fontSize: "18px",
    color: "#4b5563",
    maxWidth: "720px",
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
  cards3: {
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
    lineHeight: 1.5,
  },
  card: {
    background: "white",
    padding: "28px",
    borderRadius: "16px",
    marginBottom: "24px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
    lineHeight: 1.6,
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
  summaryGrid: {
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
};

export default App;