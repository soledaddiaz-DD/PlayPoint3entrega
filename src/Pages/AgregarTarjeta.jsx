import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CreditCard } from "lucide-react";
import "../CSS/Formularios.css";
import { cargar, guardar } from "../data/store";

/* Deja solo números y los agrupa de a 4: 1234 5678 9012 3456 */
const formatearNumero = (valor) =>
  valor
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(.{4})/g, "$1 ")
    .trim();

/* Vencimiento: 1225 -> 12/25 */
const formatearVencimiento = (valor) => {
  const n = valor.replace(/\D/g, "").slice(0, 4);
  return n.length > 2 ? `${n.slice(0, 2)}/${n.slice(2)}` : n;
};

const detectarMarca = (numero) => {
  const n = numero.replace(/\s/g, "");
  if (/^4/.test(n)) return "Visa";
  if (/^(5[1-5]|2[2-7])/.test(n)) return "Mastercard";
  if (/^3[47]/.test(n)) return "American Express";
  return "Tarjeta";
};

function AgregarTarjeta() {
  const navigate = useNavigate();
  const [titular, setTitular] = useState("");
  const [numero, setNumero] = useState("");
  const [vencimiento, setVencimiento] = useState("");
  const [cvv, setCvv] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    const digitos = numero.replace(/\s/g, "");
    if (digitos.length !== 16) {
      setError("El número de tarjeta debe tener 16 dígitos.");
      return;
    }

    const [mes, anio] = vencimiento.split("/");
    const m = Number(mes);
    const a = 2000 + Number(anio);
    const hoy = new Date();
    const vencida =
      a < hoy.getFullYear() ||
      (a === hoy.getFullYear() && m < hoy.getMonth() + 1);

    if (!mes || !anio || anio.length !== 2 || m < 1 || m > 12 || vencida) {
      setError("Revisá la fecha de vencimiento (formato MM/AA).");
      return;
    }

    if (cvv.length < 3) {
      setError("El CVV debe tener 3 o 4 dígitos.");
      return;
    }

    // Por seguridad NO guardamos el número completo ni el CVV
    const tarjeta = {
      id: `tarjeta-${Date.now()}`,
      titular: titular.trim(),
      marca: detectarMarca(numero),
      ultimos4: digitos.slice(-4),
      vencimiento,
    };

    guardar("pp_tarjetas", [...cargar("pp_tarjetas", []), tarjeta]);
    guardar("pp_tarjeta_sel", tarjeta.id);

    navigate("/membresias");
  };

  return (
    <div className="form-page">
      <div className="form-container">
        <Link to="/membresias" className="form-back">
          <ArrowLeft size={17} />
          Volver a membresías
        </Link>

        <div className="form-card">
          <CreditCard size={28} />

          <h1>Agregar tarjeta</h1>
          <p>Ingresá los datos de tu nueva tarjeta.</p>

          <form onSubmit={handleSubmit}>
            <label>
              Nombre del titular
              <input
                type="text"
                placeholder="Nombre y apellido"
                value={titular}
                onChange={(e) => setTitular(e.target.value)}
                required
              />
            </label>

            <label>
              Número de tarjeta
              <input
                type="text"
                inputMode="numeric"
                autoComplete="cc-number"
                placeholder="0000 0000 0000 0000"
                maxLength="19"
                value={numero}
                onChange={(e) => setNumero(formatearNumero(e.target.value))}
                required
              />
            </label>

            <div className="form-row">
              <label>
                Vencimiento
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="cc-exp"
                  placeholder="MM/AA"
                  maxLength="5"
                  value={vencimiento}
                  onChange={(e) =>
                    setVencimiento(formatearVencimiento(e.target.value))
                  }
                  required
                />
              </label>

              <label>
                CVV
                <input
                  type="password"
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  placeholder="123"
                  maxLength="4"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, ""))}
                  required
                />
              </label>
            </div>

            {error && <p className="form-error">{error}</p>}

            <button type="submit" className="form-submit">
              Agregar tarjeta
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AgregarTarjeta;