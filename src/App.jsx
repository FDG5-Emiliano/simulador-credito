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
          : (monto * tasaMensual) /
            (1 - Math.pow(1 + tasaMensual, -plazo));
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
      <div style={styles.container}>
        <header style={styles.header}>
          <img src="/logo-trisal.jpeg" alt="TRISAL" style={styles.logo} />

          <div>
            <h1 style={styles.title}>Simulador de Crédito</h1>
            <p style={styles.subtitle}>
              Calcula pagos, intereses y tabla de amortización.
            </p>
          </div>
        </header>

        <section style={styles.card}>
          <h2>Parámetros</h2>

          <div style={styles.grid}>
            <Input label="Monto" value={monto} setValue={setMonto} />
            <Input label="Tasa anual (%)" value={tasa} setValue={setTasa} />
            <Input label="Plazo (meses)" value={plazo} setValue={setPlazo} />

            <div>
              <label>Tipo de amortización</label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                style={styles.input}
              >
                <option value="frances">Francés / pago fijo</option>
                <option value="aleman">Alemán / capital fijo</option>
                <option value="bullet">Bullet / pago final</option>
              </select>
            </div>
          </div>

          <div style={styles.buttons}>
            <button onClick={exportarExcel} style={styles.primaryButton}>
              Exportar Excel
            </button>

            <button onClick={exportarPDF} style={styles.secondaryButton}>
              Exportar PDF
            </button>
          </div>
        </section>

        <section style={styles.summaryGrid}>
          <Card title="Pago inicial" value={formato(tabla[0]?.pago || 0)} />
          <Card title="Total intereses" value={formato(totalInteres)} />
          <Card title="Total pagado" value={formato(totalPago)} />
        </section>

        <section style={styles.card}>
          <h2>Gráfica de saldo</h2>

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
          <h2>Tabla de amortización</h2>

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
      </div>
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
        onChange={(e) => setValue(Number(e.target.value))}
        style={styles.input}
      />
    </div>
  );
}

function Card({ title, value }) {
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
    background: "#f3f6fb",
    padding: "30px",
    fontFamily: "Arial, sans-serif",
  },
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "24px",
    marginBottom: "30px",
  },
  logo: {
    width: "160px",
    background: "white",
    padding: "16px",
    borderRadius: "14px",
  },
  title: {
    margin: 0,
    color: "#002b66",
    fontSize: "36px",
  },
  subtitle: {
    color: "#667085",
    fontSize: "16px",
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
  buttons: {
    display: "flex",
    gap: "12px",
    marginTop: "24px",
  },
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