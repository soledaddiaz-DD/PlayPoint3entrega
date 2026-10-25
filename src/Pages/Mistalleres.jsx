import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { getTallerPorId } from "../data/Talleresdata";
import "../CSS/Cuenta.css";

function MisTalleres() {
  const [talleres, setTalleres] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelado = false;
    api
      .get("/me/enrollments")
      .then((r) => !cancelado && setTalleres(r.workshops))
      .catch((err) => !cancelado && setError(err.message));
    return () => {
      cancelado = true;
    };
  }, []);

  if (!talleres && !error) return <p className="cuenta-ayuda">Cargando tus talleres…</p>;

  return (
    <div>
      <h1 className="perfil-titulo">Mis talleres</h1>

      {error && <p className="pp-alert error" role="alert">{error}</p>}

      {talleres && !talleres.length && (
        <div className="perfil-card vacio-card">
          <p>Todavía no estás inscripto en ningún taller.</p>
          <Link to="/talleres" className="btn-outline-perfil">Ver talleres</Link>
        </div>
      )}

      <div className="talleres-perfil-lista">
        {talleres?.map((t) => {
          const info = getTallerPorId(t.workshopId);
          return (
            <div className="perfil-card taller-perfil-card" key={t.workshopId}>
              <div className="taller-perfil-header">
                <div className="taller-perfil-emoji">{info?.emoji ?? "🏅"}</div>

                <div>
                  <span className="taller-perfil-nombre">{t.name}</span>
                  <span className="taller-perfil-profesor">
                    {info ? `${info.profesor} · ${info.dias} · ${info.horario}` : ""}
                  </span>
                </div>
              </div>

              <Link to={`/talleres/${t.workshopId}`} className="btn-outline-perfil">
                Ver taller
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default MisTalleres;
