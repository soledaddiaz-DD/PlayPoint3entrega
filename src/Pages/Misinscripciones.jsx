import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { getTallerPorId } from "../data/Talleresdata";
import "../CSS/Cuenta.css";

function MisInscripciones() {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState("");

  const cargar = useCallback(async () => {
    try {
      setDatos(await api.get("/me/enrollments"));
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function cancelar(tipo, id, nombre) {
    if (!window.confirm(`¿Cancelar tu inscripción a ${nombre}?`)) return;
    setError("");
    try {
      await api.del(tipo === "taller" ? `/workshops/${id}/enroll` : `/tournaments/${id}/register`);
      await cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  if (!datos && !error) return <p className="cuenta-ayuda">Cargando tus inscripciones…</p>;

  const talleres = datos?.workshops ?? [];
  const torneos = datos?.tournaments ?? [];
  const vacio = datos && !talleres.length && !torneos.length;

  return (
    <div>
      <h1 className="perfil-titulo">Mis inscripciones</h1>

      {error && <p className="pp-alert error" role="alert">{error}</p>}

      {vacio && (
        <div className="perfil-card vacio-card">
          <p>Todavía no te inscribiste a ningún taller ni torneo.</p>
          <div className="cuenta-acciones">
            <Link to="/talleres" className="btn-outline-perfil">Ver talleres</Link>
            <Link to="/torneos" className="btn-outline-perfil">Ver torneos</Link>
          </div>
        </div>
      )}

      <div className="inscripciones-lista">
        {talleres.map((t) => {
          const info = getTallerPorId(t.workshopId);
          return (
            <div className="perfil-card inscripcion-card" key={`t-${t.workshopId}`}>
              <div className="inscripcion-emoji">{info?.emoji ?? "🏅"}</div>

              <div className="inscripcion-info">
                <span className="inscripcion-nombre">Taller de {t.name}</span>
                <span className="inscripcion-detalle">
                  {info ? `${info.dias} · ${info.horario}` : "Taller"}
                </span>
              </div>

              <span className="inscripcion-estado activa">Activa</span>
              <button
                type="button"
                className="btn-cancelar-inscripcion"
                onClick={() => cancelar("taller", t.workshopId, `el taller de ${t.name}`)}
              >
                Cancelar
              </button>
            </div>
          );
        })}

        {torneos.map((t) => (
          <div className="perfil-card inscripcion-card" key={`o-${t.tournamentId}`}>
            <div className="inscripcion-emoji">🏆</div>

            <div className="inscripcion-info">
              <span className="inscripcion-nombre">{t.title}</span>
              <span className="inscripcion-detalle">
                {t.dates} · {t.location}
                {t.teamName ? ` · Equipo ${t.teamName}` : ""}
              </span>
            </div>

            <span className="inscripcion-estado activa">Inscripto</span>
            {t.tournamentStatus !== "finalizado" && (
              <button
                type="button"
                className="btn-cancelar-inscripcion"
                onClick={() => cancelar("torneo", t.tournamentId, t.title)}
              >
                Cancelar
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default MisInscripciones;
