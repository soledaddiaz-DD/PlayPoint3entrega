import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { api } from "../api";
import { useAuth } from "../auth/AuthContext";
import "../CSS/Formularios.css";
import "../CSS/Cuenta.css";

function UnirseGrupo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [grupo, setGrupo] = useState(null);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    let cancelado = false;
    api
      .get(`/groups/${id}`)
      .then((r) => !cancelado && setGrupo(r.group))
      .catch((err) => !cancelado && setError(err.message));
    return () => {
      cancelado = true;
    };
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (enviando) return;

    setEnviando(true);
    setError("");
    try {
      await api.post(`/groups/${id}/join`);
      navigate(`/comunidad/grupo/${id}`, { replace: true });
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
          <h1>Unirme al grupo</h1>
          <p>
            {grupo
              ? `Vas a sumarte a ${grupo.name} como @${user.username}.`
              : "Confirmá para sumarte al grupo."}
          </p>

          <form onSubmit={handleSubmit}>
            {error && <p className="pp-alert error" role="alert">{error}</p>}

            <button type="submit" className="form-submit" disabled={enviando || !grupo || grupo.isMember}>
              {grupo?.isMember ? "Ya sos miembro" : enviando ? "Uniéndome..." : "Unirme"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default UnirseGrupo;
