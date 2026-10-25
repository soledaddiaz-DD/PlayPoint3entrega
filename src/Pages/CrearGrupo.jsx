import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { api } from "../api";
import "../CSS/Formularios.css";
import "../CSS/Cuenta.css";

const DEPORTES = ["Running", "Fútbol", "Basketball", "Vóley", "Handball", "Tenis", "Entrenamiento", "Otro"];

function CrearGrupo() {
  const navigate = useNavigate();
  const [nombre, setNombre] = useState("");
  const [deporte, setDeporte] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (enviando) return;

    setEnviando(true);
    setError("");
    try {
      // El que crea el grupo queda como miembro automáticamente
      const { group } = await api.post("/groups", {
        name: nombre,
        sport: deporte,
        description: descripcion,
      });
      navigate(`/comunidad/grupo/${group.id}`);
    } catch (err) {
      setError(err.message);
      setEnviando(false);
    }
  };

  return (
    <div className="form-page">
      <div className="form-container">
        <Link to="/comunidad" className="form-back">
          <ArrowLeft size={17} />
          Volver a comunidad
        </Link>

        <div className="form-card">
          <h1>Crear un grupo</h1>
          <p>Creá tu espacio y empezá a sumar personas.</p>

          <form onSubmit={handleSubmit}>
            <label>
              Nombre del grupo
              <input
                type="text"
                placeholder="Ej: Running Pocitos"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                maxLength={80}
                required
              />
            </label>

            <label>
              Deporte
              <select
                required
                value={deporte}
                onChange={(e) => setDeporte(e.target.value)}
              >
                <option value="" disabled>
                  Seleccionar deporte
                </option>
                {DEPORTES.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </label>

            <label>
              Descripción
              <textarea
                rows="4"
                placeholder="Contá de qué se trata tu grupo..."
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                maxLength={500}
                required
              />
            </label>

            {error && <p className="pp-alert error" role="alert">{error}</p>}

            <button type="submit" className="form-submit" disabled={enviando}>
              {enviando ? "Creando..." : "Crear grupo"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CrearGrupo;
