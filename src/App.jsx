import { useState } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

function App() {
  const [monto, setMonto] = useState(250000);
  const [tasa, setTasa] = useState(18);
  const [plazo, setPlazo] = useState(24);
  const [tipo, setTipo] = useState("frances");

  const calcularTabla = () => {
    const tasaMensual = tasa / 100 / 12;
    let saldo = monto;
    const tabla = [];
    let pagoFijo = 0;

    if (tipo === "frances") {
      pagoFijo =
        tasaMensual === 0
          ? monto / plazo
          : (monto * tasaMensual) / (1 - Math.pow(1 + tasaMensual, -plazo));
    }

    const capitalFijo = monto / plazo;

    for (let i = 1; i <= plazo; i++) {
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
        capital = i === plazo ? saldoInicial : 0;
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

  const formato = (n) =>
    n.toLocaleString("es-MX", {
      style: "currency",
      currency: "MXN",
    });

  const exportarExcel = () => {
    const data = tabla.map((r) => ({
      Periodo: r.periodo,
      "Saldo inicial": r.saldoInicial,
      Pago: r.pago,
      Interés: r.interes,
      Capital: r.capital,
      "Saldo final": r.saldo,
    }));

    const hoja = XLSX.utils.json_to_sheet(data);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Amortización");
    XLSX.writeFile(libro, "tabla_amortizacion.xlsx");
  };

  const exportarPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Simulador de Crédito TRISAL", 14, 20);

    doc.setFontSize(11);
    doc.text(`Monto: ${formato(monto)}`, 14, 30);
    doc.text(`Tasa anual: ${tasa}%`, 14, 37);
    doc.text(`Plazo: ${plazo} meses`, 14, 44);
    doc.text(`Tipo: ${tipo}`, 14, 51);

    autoTable(doc, {
      startY: 60,
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

    doc.save("tabla_amortizacion.pdf");
  };

  const totalInteres = tabla.reduce((acc, r) => acc + r.interes, 0);
  const totalPago = tabla.reduce((acc, r) => acc + r.pago, 0);

  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <img src="/logo-trisal.jpeg" alt="TRISAL" style={styles.navLogo} />
        <div style={styles.navLinks}>
          <a href="#inicio">Inicio</a>
          <a href="#servicios">Servicios</a>
          <a href="#productos">Productos</a>
          <a href="#quienes">Quiénes somos</a>
          <a href="#ubicacion">Ubicación</a>
          <a href="#contacto">Contacto</a>
          <a href="#info">Información</a>
          <a href="#simulador" style={styles.navButton}>Simula tu crédito</a>
        </div>
      </nav>

      <section id="inicio" style={styles.hero}>
        <div>
          <p style={styles.kicker}>SOFOM · Norte de México</p>
          <h1 style={styles.heroTitle}>Crédito ágil para empresas, campo y crecimiento regional.</h1>
          <p style={styles.heroText}>
            En TRISAL apoyamos proyectos productivos con soluciones de financiamiento claras,
            cercanas y adaptadas a las necesidades del norte del país.
          </p>
          <a href="#simulador" style={styles.cta}>Simula tu crédito</a>
        </div>
        <img src="/logo-trisal.jpeg" alt="TRISAL" style={styles.heroLogo} />
      </section>

      <Section id="servicios" title="Servicios">
        <div style={styles.cards3}>
          <InfoCard title="Análisis de crédito" text="Evaluamos capacidad de pago, flujo y destino del financiamiento." />
          <InfoCard title="Estructuración financiera" text="Diseñamos pagos, plazos y esquemas según el perfil del cliente." />
          <InfoCard title="Acompañamiento" text="Atención cercana durante la solicitud, autorización y vida del crédito." />
        </div>
      </Section>

      <Section id="productos" title="Productos que ofrecemos">
        <div style={styles.cards3}>
          <InfoCard title="Crédito simple" text="Capital para inversión, operación o crecimiento del negocio." />
          <InfoCard title="Crédito agropecuario" text="Financiamiento para productores, ranchos, maquinaria e insumos." />
          <InfoCard title="Crédito empresarial" text="Soluciones para PyMEs, comercio, transporte y servicios." />
        </div>
      </Section>

      <Section id="quienes" title="Quiénes somos">
        <p style={styles.paragraph}>
          Somos una financiera enfocada en crear relaciones de largo plazo con clientes que
          buscan crecer con orden, transparencia y responsabilidad. Nuestro enfoque combina
          conocimiento regional, atención personalizada y herramientas digitales para tomar
          mejores decisiones de crédito.
        </p>
      </Section>

      <Section id="ubicacion" title="Ubicación">
        <p style={styles.paragraph}>
          Atendemos clientes del norte del país. Puedes agregar aquí la dirección exacta,
          mapa, horarios de atención y zonas de cobertura.
        </p>
      </Section>

      <Section id="contacto" title="Contacto">
        <div style={styles.contactBox}>
          <p><b>Teléfono:</b> Agrega aquí tu teléfono</p>
          <p><b>Correo:</b> contacto@trisal.com</p>
          <p><b>WhatsApp:</b> Agrega aquí tu número</p>
        </div>
      </Section>

      <Section id="info" title="Dónde buscar información">
        <p style={styles.paragraph}>
          Para consultar información de instituciones financieras en México, puedes revisar
          registros oficiales como SIPRES de CONDUSEF y publicaciones de la CNBV sobre SOFOMES.
          CONDUSEF concentra registros como SIPRES, RECA, REUNE y otros con información de
          instituciones, productos y servicios financieros; la CNBV publica información de
          SOFOMES reguladas. :contentReference[oaicite:0]{index=0} :contentReference[oaicite:1]{index=1}
        </p>
      </Section>

      <section id="simulador" style={styles.simulatorSection}>
        <h2 style={styles.sectionTitle}>Simula tu crédito</h2>

        <section style={styles.card}>
          <h3>Parámetros</h3>

          <div style={styles.grid}>
            <Input label="Monto" value={monto} setValue={setMonto} />
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

          <div style={styles.buttons}>
            <button onClick={exportarExcel} style={styles.primaryButton}>Exportar Excel</button>
            <button onClick={exportarPDF} style={styles.secondaryButton}>Exportar PDF</button>
          </div>
        </section>

        <section style={styles.summaryGrid}>
          <MetricCard title="Pago inicial" value={formato(tabla[0]?.pago || 0)} />
          <MetricCard title="Total intereses" value={formato(totalInteres)} />
          <MetricCard title="Total pagado" value={formato(totalPago)} />
        </section>

        <section style={styles.card}>
          <h3>Gráfica de saldo</h3>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={tabla}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="periodo" />
                <YAxis />
                <Tooltip formatter={(value) => formato(value)} />
                <Line type="monotone" dataKey="saldo" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
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
      </section>
    </div>
  );
}

function Section({ id, title, children }) {
  return (
    <section id={id} style={styles.section}>
      <h2 style={styles.sectionTitle}>{title}</h2>
      {children}
    </section>
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
      <input type="number" value={value} onChange={(e) => setValue(Number(e.target.value))} style={styles.input} />
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

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f4f1ea",
    fontFamily: "Arial, sans-serif",
    color: "#172033",
  },
  nav: {
    position: "sticky",
    top: 0,
    zIndex: 10,
    background: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 32px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
  },
  navLogo: { width: "110px" },
  navLinks: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
    flexWrap: "wrap",
  },
  navButton: {
    background: "#002b66",
    color: "white",
    padding: "10px 14px",
    borderRadius: "10px",
    textDecoration: "none",
  },
  hero: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "70px 30px",
    display: "grid",
    gridTemplateColumns: "1.5fr 0.7fr",
    gap: "30px",
    alignItems: "center",
  },
  kicker: { color: "#b8792b", fontWeight: "bold" },
  heroTitle: {
    fontSize: "48px",
    lineHeight: "1.05",
    margin: "10px 0",
    color: "#002b66",
  },
  heroText: { fontSize: "18px", color: "#475467", maxWidth: "720px" },
  cta: {
    display: "inline-block",
    marginTop: "18px",
    background: "#b8792b",
    color: "white",
    padding: "14px 20px",
    borderRadius: "12px",
    textDecoration: "none",
    fontWeight: "bold",
  },
  heroLogo: {
    width: "100%",
    background: "white",
    padding: "30px",
    borderRadius: "24px",
    boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
  },
  section: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "42px 30px",
  },
  sectionTitle: {
    color: "#002b66",
    fontSize: "32px",
    marginBottom: "20px",
  },
  paragraph: {
    background: "white",
    padding: "24px",
    borderRadius: "16px",
    fontSize: "17px",
    lineHeight: 1.6,
    boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
  },
  cards3: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "20px",
  },
  infoCard: {
    background: "white",
    padding: "24px",
    borderRadius: "16px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
    borderTop: "5px solid #b8792b",
  },
  contactBox: {
    background: "white",
    padding: "24px",
    borderRadius: "16px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
  },
  simulatorSection: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "42px 30px 80px",
  },
  card: {
    background: "white",
    padding: "24px",
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
    padding: "12px",
    marginTop: "8px",
    borderRadius: "10px",
    border: "1px solid #d0d5dd",
    fontSize: "16px",
  },
  buttons: { display: "flex", gap: "12px", marginTop: "24px" },
  primaryButton: {
    background: "#002b66",
    color: "white",
    border: "none",
    padding: "12px 20px",
    borderRadius: "10px",
    cursor: "pointer",
  },
  secondaryButton: {
    background: "white",
    color: "#002b66",
    border: "1px solid #002b66",
    padding: "12px 20px",
    borderRadius: "10px",
    cursor: "pointer",
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
};

export default App;