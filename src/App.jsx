import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'
import { useState } from "react";
import { Analytics } from '@vercel/analytics/react';

function App() {
  const [monto, setMonto] = useState(250000);
  const [tasa, setTasa] = useState(18);
  const [plazo, setPlazo] = useState(24);

  const calcularTabla = () => {
    const tasaMensual = tasa / 100 / 12;

    const pago =
      (monto * tasaMensual) /
      (1 - Math.pow(1 + tasaMensual, -plazo));

    let saldo = monto;

    const tabla = [];

    for (let i = 1; i <= plazo; i++) {
      const interes = saldo * tasaMensual;
      const capital = pago - interes;
      saldo = saldo - capital;

      tabla.push({
        periodo: i,
        pago: pago,
        interes: interes,
        capital: capital,
        saldo: saldo > 0 ? saldo : 0,
      });
    }

    return tabla;
  };

  const tabla = calcularTabla();

  const exportarCSV = () => {
    let csv =
      "Periodo,Pago,Interes,Capital,Saldo\\n";

    tabla.forEach((fila) => {
      csv += `${fila.periodo},${fila.pago.toFixed(
        2
      )},${fila.interes.toFixed(
        2
      )},${fila.capital.toFixed(
        2
      )},${fila.saldo.toFixed(2)}\\n`;
    });

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const link = document.createElement("a");

    link.href = URL.createObjectURL(blob);

    link.download = "tabla_amortizacion.csv";

    link.click();
  };

  return (
    <div
      style={{
        padding: "40px",
        fontFamily: "Arial",
        background: "#f4f4f4",
        minHeight: "100vh",
      }}
    >
      {/* LOGO */}
      <img
        src="https://upload.wikimedia.org/wikipedia/commons/2/2a/BBVA_2019.svg"
        alt="Logo"
        style={{
          width: "140px",
          marginBottom: "20px",
        }}
      />

      <h1>Simulador de Crédito</h1>

      <div
        style={{
          background: "white",
          padding: "20px",
          borderRadius: "10px",
          marginBottom: "30px",
        }}
      >
        <label>Monto:</label>
        <br />

        <input
          type="number"
          value={monto}
          onChange={(e) =>
            setMonto(Number(e.target.value))
          }
        />

        <br />
        <br />

        <label>Tasa anual (%):</label>
        <br />

        <input
          type="number"
          value={tasa}
          onChange={(e) =>
            setTasa(Number(e.target.value))
          }
        />

        <br />
        <br />

        <label>Plazo (meses):</label>
        <br />

        <input
          type="number"
          value={plazo}
          onChange={(e) =>
            setPlazo(Number(e.target.value))
          }
        />

        <br />
        <br />

        <button onClick={exportarCSV}>
          Exportar CSV
        </button>
      </div>

      {/* TABLA */}
      <div
        style={{
          background: "white",
          padding: "20px",
          borderRadius: "10px",
          overflowX: "auto",
        }}
      >
        <h2>Tabla de amortización</h2>

        <table
          border="1"
          cellPadding="10"
          style={{
            borderCollapse: "collapse",
            width: "100%",
          }}
        >
          <thead>
            <tr>
              <th>Periodo</th>
              <th>Pago</th>
              <th>Interés</th>
              <th>Capital</th>
              <th>Saldo</th>
            </tr>
          </thead>

          <tbody>
            {tabla.map((fila) => (
              <tr key={fila.periodo}>
                <td>{fila.periodo}</td>

                <td>
                  $
                  {fila.pago.toFixed(2)}
                </td>

                <td>
                  $
                  {fila.interes.toFixed(2)}
                </td>

                <td>
                  $
                  {fila.capital.toFixed(2)}
                </td>

                <td>
                  $
                  {fila.saldo.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Analytics />
    </div>
  );
}

export default App;