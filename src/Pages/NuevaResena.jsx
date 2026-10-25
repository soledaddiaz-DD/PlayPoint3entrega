import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Star } from "lucide-react";
import "../CSS/Formularios.css";
import { api } from "../api";
import { useAuth } from "../auth/AuthContext";
import { talleres } from "../data/Talleresdata";
import "../CSS/Cuenta.css";

function NuevaResena() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [taller, setTaller] = useState("");
  const [puntaje, setPuntaje] = useState(0);
  const [texto, setTexto] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (enviando) return;

    if (puntaje === 0) {
      setError("Elegí una puntuación de 1 a 5 estrellas.");
      return;
    }

    setEnviando(true);
    setError("");
    try {
      await api.post("/reviews", { workshopId: taller, rating: puntaje, text: texto });
      navigate("/resenas");
    } catch (err) {
      setError(err.message);
      setEnviando(false);
    }
  };

  return (
    <div className="form-page">
      <div className="form-container">
        <Link to="/resenas" className="form-back">
          <ArrowLeft size={17} />
          Volver a reseñas
        </Link>

        <div className="form-card">
          <h1>Escribir reseña</h1>
          <p>Contanos cómo fue tu experiencia.</p>

          <form onSubmit={handleSubmit}>
            <p className="cuenta-ayuda">
              Vas a publicar como <strong>@{user.username}</strong>.
            </p>

            <label>
              Taller
              <select
                required
                value={taller}
                onChange={(e) => setTaller(e.target.value)}
              >
                <option value="" disabled>
                  Elegir taller
                </option>
                {talleres.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre}
                  </option>
                ))}
              </select>
            </label>

            <div className="rating-field">
              <span>Tu puntuación</span>

              <div className="rating-stars">
                {[1, 2, 3, 4, 5].map((numero) => (
                  <button
                    type="button"
                    key={numero}
                    onClick={() => setPuntaje(numero)}
                    className={numero <= puntaje ? "selected" : ""}
                  >
                    <Star
                      size={26}
                      fill={numero <= puntaje ? "currentColor" : "none"}
                    />
                  </button>
                ))}
              </div>
            </div>

            <label>
              Tu reseña
              <textarea
                rows="6"
                maxLength={1000}
                placeholder="Contanos tu experiencia..."
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                required
              />
            </label>

            {error && <p className="form-error">{error}</p>}

            <button type="submit" className="form-submit" disabled={enviando}>
              {enviando ? "Publicando..." : "Publicar reseña"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default NuevaResena;