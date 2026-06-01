import { useState } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function App() {
  const [pagina, setPagina] = useState("inicio");
  const [menuAbierto, setMenuAbierto] = useState(false);

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

  function cambiarPagina(nuevaPagina) {
    setPagina(nuevaPagina);
    setMenuAbierto(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

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
    <div className="page">
      <style>{css}</style>

      <nav className="nav">
        <button onClick={() => cambiarPagina("inicio")} className="logoButton">
          <img src="/logo-trisal.jpeg" alt="TRISAL" className="logo" />
        </button>

        <button onClick={() => setMenuAbierto(!menuAbierto)} className="mobileMenuButton">
          {menuAbierto ? "Cerrar" : "Menú"}
        </button>

        <div className={menuAbierto ? "menu menuOpen" : "menu"}>
          <MenuButton texto="Inicio" activo={pagina === "inicio"} onClick={() => cambiarPagina("inicio")} />
          <MenuButton texto="Servicios" activo={pagina === "servicios"} onClick={() => cambiarPagina("servicios")} />
          <MenuButton texto="Productos" activo={pagina === "productos"} onClick={() => cambiarPagina("productos")} />
          <MenuButton texto="Ubicación" activo={pagina === "ubicacion"} onClick={() => cambiarPagina("ubicacion")} />
          <MenuButton texto="Contacto" activo={pagina === "contacto"} onClick={() => cambiarPagina("contacto")} />
          <MenuButton texto="Normatividad" activo={pagina === "normatividad"} onClick={() => cambiarPagina("normatividad")} />
          <MenuButton texto="Privacidad" activo={pagina === "privacidad"} onClick={() => cambiarPagina("privacidad")} />
          <button onClick={() => cambiarPagina("simulador")} className="goldButton">
            Simula tu crédito
          </button>
        </div>
      </nav>

      <main className="main">
        {pagina === "inicio" && (
          <section className="hero animatedPage">
            <div className="slideUp">
              <p className="kicker">SOFOM ENR · Norte de México</p>
              <h1 className="heroTitle">Financiamiento serio para proyectos productivos.</h1>
              <p className="heroText">
                Soluciones de crédito y estructuras fiduciarias para empresas, productores y negocios.
              </p>
              <button onClick={() => cambiarPagina("simulador")} className="cta">
                Simula tu crédito
              </button>
            </div>
            <img src="/logo-trisal.jpeg" alt="TRISAL" className="heroLogo slideUp delay1" />
          </section>
        )}

        {pagina === "servicios" && (
          <Pagina titulo="Servicios">
            <div className="cards">
              <Tarjeta titulo="Análisis de crédito" texto="Evaluamos capacidad de pago, flujo, garantías y destino del financiamiento." />
              <Tarjeta titulo="Estructuración financiera" texto="Diseñamos pagos, plazos y condiciones según cada cliente." />
              <Tarjeta titulo="Acompañamiento" texto="Atención durante solicitud, autorización, disposición y seguimiento." />
            </div>
          </Pagina>
        )}

        {pagina === "productos" && (
          <Pagina titulo="Productos">
            <div className="cards">
              <Tarjeta
                titulo="Crédito simple"
                texto={`Tasa de interés fija. CAT estimado calculado al ${fechaCalculo}. Comisión por apertura de ${comisionApertura}% más IVA. Requisitos sujetos a evaluación.`}
              />
              <Tarjeta
                titulo="Fideicomiso"
                texto="Estructuras para administración, garantía y protección patrimonial. Condiciones y requisitos sujetos al tipo de operación."
              />
            </div>

            <div className="card advertenciasCard slideUp delay2">
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
            <div className="card slideUp">
              <p><b>Dirección:</b> {empresa.direccion}</p>
              <p><b>Horario:</b> Lunes a viernes de 9:00 AM a 5:00 PM</p>
              <a
                href="https://www.google.com/maps/search/?api=1&query=Paseo+del+Valle+310+San+Patricio+Saltillo+Coahuila"
                target="_blank"
                rel="noreferrer"
                className="mapButton"
              >
                Abrir ubicación en Google Maps
              </a>
              <iframe
                title="Mapa TRISAL"
                src="https://www.google.com/maps?q=Paseo%20del%20Valle%20310%20San%20Patricio%20Saltillo%20Coahuila&output=embed"
                width="100%"
                height="360"
                className="map"
                loading="lazy"
              ></iframe>
            </div>
          </Pagina>
        )}

        {pagina === "contacto" && (
          <Pagina titulo="Contacto">
            <div className="card slideUp">
              <p><b>Teléfono:</b> <a href={"tel:" + empresa.telefono} className="link">{empresa.telefonoVisible}</a></p>
              <p>
                <b>WhatsApp:</b>{" "}
                <a
                  href={"https://wa.me/52" + empresa.telefono + "?text=Hola,%20quiero%20información%20sobre%20un%20crédito."}
                  target="_blank"
                  rel="noreferrer"
                  className="link"
                >
                  Enviar mensaje por WhatsApp
                </a>
              </p>
              <p><b>Correo:</b> <a href={"mailto:" + empresa.correo} className="link">{empresa.correo}</a></p>
            </div>
          </Pagina>
        )}

        {pagina === "normatividad" && (
          <Pagina titulo="Normatividad y transparencia">
            <div className="card slideUp">
              <h3>Unidad Especializada de Atención a Usuarios</h3>
              <p><b>Teléfono UNE:</b> {empresa.uneTelefono}</p>
              <p><b>Correo UNE:</b> {empresa.uneCorreo}</p>
            </div>

            <div className="card slideUp delay1">
              <h3>CONDUSEF y Buró de Entidades Financieras</h3>
              <p><b>CONDUSEF:</b> <a href="https://www.condusef.gob.mx/" target="_blank" rel="noreferrer" className="link">www.condusef.gob.mx</a></p>
              <p><b>Buró de Entidades Financieras:</b> <a href="http://www.buro.gob.mx" target="_blank" rel="noreferrer" className="link">www.buro.gob.mx</a></p>

              <div className="buroBox">Buró de Entidades Financieras</div>

              <p>
                El Buró de Entidades Financieras permite conocer información de entidades financieras,
                productos y servicios, así como comparar y evaluar alternativas. La información mostrada
                corresponde únicamente a la Entidad Financiera de que se trate.
              </p>
            </div>

            <div className="card slideUp delay2">
              <h3>Despachos de cobranza</h3>
              <p>
                Los datos de los despachos de cobranza estarán disponibles para los clientes por medios
                electrónicos y en sucursales o establecimientos.
              </p>
            </div>
          </Pagina>
        )}

        {pagina === "privacidad" && (
          <Pagina titulo="Aviso de privacidad">
            <div className="card slideUp">
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
            <section className="card slideUp">
              <h3>Parámetros del crédito</h3>
              <div className="grid">
                <Input label="Monto solicitado" value={monto} setValue={setMonto} />
                <Input label="Tasa anual fija (%)" value={tasa} setValue={setTasa} />
                <Input label="Plazo (meses)" value={plazo} setValue={setPlazo} />
                <div>
                  <label>Tipo de amortización</label>
                  <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="input">
                    <option value="frances">Francés / pago fijo</option>
                    <option value="aleman">Alemán / capital fijo</option>
                    <option value="bullet">Bullet / pago final</option>
                  </select>
                </div>
              </div>
            </section>

            <section className="resumen slideUp delay1">
              <Metrica titulo="Pago mensual estimado" valor={formato(tabla[0]?.pago || 0)} />
            </section>

            <section className="card slideUp delay2">
              <p>
                CAT estimado para fines informativos y de comparación: {catEstimado.toFixed(2)}%.
                Fecha de cálculo: {fechaCalculo}. Tasa de interés fija. Comisión por apertura considerada:
                {comisionApertura}% más IVA.
              </p>
              <p><b>Advertencia:</b> Contratar créditos que excedan tu capacidad de pago afecta tu historial crediticio.</p>
            </section>

            <section className="card slideUp delay3">
              <h3>Exportar o enviar cotización</h3>
              <input
                type="email"
                value={correoCliente}
                onChange={(e) => setCorreoCliente(e.target.value)}
                placeholder="cliente@correo.com"
                className="input"
              />
              <div className="buttons">
                <button onClick={exportarExcel} className="primaryButton">Descargar Excel</button>
                <button onClick={generarPDF} className="secondaryButton">Descargar PDF</button>
                <button onClick={enviarCotizacion} className="goldSmallButton">Enviar por correo</button>
              </div>
            </section>

            <section className="card slideUp delay4">
              <h3>Tabla de amortización</h3>
              <div style={{ overflowX: "auto" }}>
                <table className="table">
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

      <footer className="footer">
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
    <div className="animatedPage">
      <h2 className="sectionTitle slideUp">{titulo}</h2>
      {children}
    </div>
  );
}

function MenuButton({ texto, activo, onClick }) {
  return (
    <button onClick={onClick} className={activo ? "menuButton activeMenuButton" : "menuButton"}>
      {texto}
    </button>
  );
}

function Tarjeta({ titulo, texto }) {
  return (
    <div className="infoCard slideUp">
      <h3>{titulo}</h3>
      <p>{texto}</p>
    </div>
  );
}

function Input({ label, value, setValue }) {
  return (
    <div>
      <label>{label}</label>
      <input type="number" value={value} onChange={(e) => setValue(e.target.value)} className="input" />
    </div>
  );
}

function Metrica({ titulo, valor }) {
  return (
    <div className="metricCard">
      <p>{titulo}</p>
      <h3>{valor}</h3>
    </div>
  );
}

const css = `
* {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  margin: 0;
}

.page {
  min-height: 100vh;
  background: #f5f3ef;
  font-family: Arial, sans-serif;
  color: #111827;
}

.nav {
  position: sticky;
  top: 0;
  z-index: 20;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 16px 36px;
  box-shadow: 0 4px 18px rgba(0,0,0,0.08);
}

.logoButton {
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 0;
}

.logo {
  width: 115px;
  display: block;
}

.menu {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.mobileMenuButton {
  display: none;
  background: #111827;
  color: white;
  border: none;
  padding: 11px 16px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 700;
  font-size: 16px;
}

.menuButton {
  background: transparent;
  color: #111827;
  border: none;
  padding: 12px 15px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 700;
  font-size: 17px;
  transition: all 0.25s ease;
}

.menuButton:hover {
  transform: translateY(-2px);
  background: #f2f2f2;
}

.activeMenuButton {
  background: #111827;
  color: white;
}

.goldButton {
  background: #8a6a2f;
  color: white;
  border: none;
  padding: 12px 16px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 700;
  font-size: 17px;
  transition: all 0.25s ease;
}

.goldButton:hover,
.cta:hover,
.primaryButton:hover,
.secondaryButton:hover,
.goldSmallButton:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(0,0,0,0.16);
}

.main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 26px 70px;
}

.animatedPage {
  animation: pageFade 0.45s ease both;
}

.slideUp {
  animation: slideUp 0.7s ease both;
}

.delay1 {
  animation-delay: 0.12s;
}

.delay2 {
  animation-delay: 0.22s;
}

.delay3 {
  animation-delay: 0.32s;
}

.delay4 {
  animation-delay: 0.42s;
}

@keyframes pageFade {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(34px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.hero {
  min-height: 72vh;
  display: grid;
  grid-template-columns: 1.4fr 0.8fr;
  gap: 34px;
  align-items: center;
}

.kicker {
  color: #8a6a2f;
  font-weight: bold;
}

.heroTitle {
  font-size: 48px;
  line-height: 1.05;
  color: #111827;
}

.heroText {
  font-size: 18px;
  color: #4b5563;
  line-height: 1.6;
}

.cta {
  margin-top: 18px;
  background: #111827;
  color: white;
  padding: 14px 20px;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  font-weight: bold;
  font-size: 16px;
  transition: all 0.25s ease;
}

.heroLogo {
  width: 100%;
  background: white;
  padding: 30px;
  border-radius: 24px;
  box-shadow: 0 12px 30px rgba(0,0,0,0.08);
}

.sectionTitle {
  color: #111827;
  font-size: 38px;
  margin-bottom: 24px;
}

.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
}

.infoCard {
  background: white;
  padding: 26px;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.06);
  border-top: 5px solid #8a6a2f;
}

.card {
  background: white;
  padding: 28px;
  border-radius: 16px;
  margin-bottom: 24px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.06);
}

.advertenciasCard {
  margin-top: 42px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
}

.input {
  width: 100%;
  padding: 13px;
  margin-top: 8px;
  border-radius: 10px;
  border: 1px solid #cbd5e1;
  font-size: 16px;
}

.resumen {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.metricCard {
  background: white;
  padding: 22px;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.06);
}

.buttons {
  display: flex;
  gap: 12px;
  margin-top: 24px;
  flex-wrap: wrap;
}

.primaryButton {
  background: #111827;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.25s ease;
}

.secondaryButton {
  background: white;
  color: #111827;
  border: 1px solid #111827;
  padding: 12px 20px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.25s ease;
}

.goldSmallButton {
  background: #8a6a2f;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.25s ease;
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table th,
.table td {
  padding: 12px;
  border-bottom: 1px solid #e5e7eb;
  text-align: left;
  white-space: nowrap;
}

.mapButton {
  display: inline-block;
  margin: 14px 0;
  background: #111827;
  color: white;
  padding: 12px 16px;
  border-radius: 10px;
  text-decoration: none;
  font-weight: bold;
}

.map {
  border: 0;
  border-radius: 16px;
  margin-top: 14px;
}

.link {
  color: #111827;
  font-weight: bold;
}

.buroBox {
  display: inline-block;
  background: #111827;
  color: white;
  padding: 14px 18px;
  border-radius: 12px;
  margin: 12px 0;
  font-weight: bold;
}

.footer {
  background: #111827;
  color: white;
  padding: 24px 36px;
  font-size: 13px;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .nav {
    padding: 12px 18px;
  }

  .logo {
    width: 92px;
  }

  .mobileMenuButton {
    display: block;
  }

  .menu {
    display: none;
  }

  .menuOpen {
    display: flex;
    position: absolute;
    top: 72px;
    left: 12px;
    right: 12px;
    background: white;
    padding: 18px;
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    box-shadow: 0 18px 40px rgba(0,0,0,0.16);
    border-radius: 18px;
    animation: mobileMenuIn 0.25s ease both;
  }

  @keyframes mobileMenuIn {
    from {
      opacity: 0;
      transform: translateY(-14px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .menuButton,
  .goldButton {
    width: 100%;
    text-align: center;
    font-size: 16px;
  }

  .main {
    padding: 28px 18px 60px;
  }

  .hero {
    min-height: auto;
    grid-template-columns: 1fr;
    text-align: center;
    padding-top: 24px;
  }

  .heroTitle {
    font-size: 42px;
  }

  .heroText {
    font-size: 17px;
  }

  .heroLogo {
    max-width: 280px;
    margin: 0 auto;
  }

  .sectionTitle {
    font-size: 34px;
  }

  .card {
    padding: 22px;
  }
}
`;