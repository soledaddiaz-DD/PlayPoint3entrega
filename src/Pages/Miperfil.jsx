import { useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../auth/AuthContext";
import Avatar from "../components/Avatar";
import "../CSS/Cuenta.css";

const GENEROS = {
  femenino: "Femenino",
  masculino: "Masculino",
  otro: "Otro",
  "prefiero-no-decir": "Prefiero no decir",
};

/* "2000-05-17" -> "17/05/2000" (sin pasar por Date, para que no se corra un día) */
const fechaCorta = (iso) => (iso ? iso.split("-").reverse().join("/") : "");

function MiPerfil() {
  const { user, setUser } = useAuth();

  const [editando, setEditando] = useState(false);
  const [datos, setDatos] = useState({
    fullName: user.fullName,
    phone: user.phone,
    city: user.city,
    description: user.description,
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const [inscripciones, setInscripciones] = useState(null);
  useEffect(() => {
    let cancelado = false;
    api
      .get("/me/enrollments")
      .then((r) => !cancelado && setInscripciones(r))
      .catch(() => {});
    return () => {
      cancelado = true;
    };
  }, []);

  function handleChange(e) {
    setDatos({ ...datos, [e.target.name]: e.target.value });
    setError("");
  }

  function empezarEdicion() {
    setDatos({
      fullName: user.fullName,
      phone: user.phone,
      city: user.city,
      description: user.description,
    });
    setError("");
    setEditando(true);
  }

  async function guardar() {
    setGuardando(true);
    setError("");
    try {
      const { user: actualizado } = await api.patch("/me", datos);
      setUser(actualizado);
      setEditando(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  const desde = new Date(user.createdAt).toLocaleDateString("es-UY", {
    month: "short",
    year: "numeric",
  });

  return (
    <div>
      <h1 className="perfil-titulo">Mi perfil</h1>

      <div className="perfil-card">
        <div className="perfil-cabecera">
          <Avatar avatarUrl={user.avatarUrl} nombre={user.fullName} size={72} />
          <div>
            <span className="perfil-cabecera-usuario">@{user.username}</span>
            <span className="perfil-cabecera-correo">{user.email}</span>
          </div>
        </div>

        <div className="perfil-card-header">
          <h3>Información personal</h3>

          {editando ? (
            <div className="cuenta-acciones">
              <button className="btn-outline-perfil" onClick={() => setEditando(false)} disabled={guardando}>
                Cancelar
              </button>
              <button className="btn-outline-perfil" onClick={guardar} disabled={guardando}>
                {guardando ? "Guardando..." : "Guardar"}
              </button>
            </div>
          ) : (
            <button className="btn-outline-perfil" onClick={empezarEdicion}>
              Editar perfil
            </button>
          )}
        </div>

        {error && <p className="pp-alert error" role="alert">{error}</p>}

        <div className="perfil-info-grid">
          <div className="perfil-info-item">
            <span className="label">Nombre completo</span>
            {editando ? (
              <input name="fullName" value={datos.fullName} onChange={handleChange} maxLength={80} />
            ) : (
              <span className="valor">{user.fullName}</span>
            )}
          </div>

          <div className="perfil-info-item">
            <span className="label">Fecha de nacimiento</span>
            <span className="valor">{fechaCorta(user.birthDate)}</span>
          </div>

          <div className="perfil-info-item">
            <span className="label">Teléfono</span>
            {editando ? (
              <input name="phone" value={datos.phone} onChange={handleChange} maxLength={20} />
            ) : (
              <span className="valor">{user.phone}</span>
            )}
          </div>

          <div className="perfil-info-item">
            <span className="label">Ciudad</span>
            {editando ? (
              <input name="city" value={datos.city} onChange={handleChange} maxLength={80} placeholder="Ej: Montevideo, Uruguay" />
            ) : (
              <span className="valor">{user.city || "—"}</span>
            )}
          </div>

          <div className="perfil-info-item">
            <span className="label">Género</span>
            <span className="valor">{GENEROS[user.gender] ?? "—"}</span>
          </div>

          <div className="perfil-info-item perfil-info-ancho">
            <span className="label">Descripción</span>
            {editando ? (
              <textarea
                name="description"
                value={datos.description}
                onChange={handleChange}
                maxLength={300}
                rows={3}
                placeholder="Contanos algo sobre vos..."
              />
            ) : (
              <span className="valor valor-descripcion">{user.description || "Todavía no escribiste una descripción."}</span>
            )}
          </div>
        </div>
      </div>

      <div className="perfil-card">
        <h3>Estadísticas</h3>

        <div className="perfil-stats-grid">
          <div className="perfil-stat">
            <span className="stat-valor">{inscripciones ? inscripciones.workshops.length : "–"}</span>
            <span className="stat-label">Talleres inscriptos</span>
          </div>

          <div className="perfil-stat">
            <span className="stat-valor">{inscripciones ? inscripciones.tournaments.length : "–"}</span>
            <span className="stat-label">Torneos inscriptos</span>
          </div>

          <div className="perfil-stat">
            <span className="stat-valor">{desde}</span>
            <span className="stat-label">Desde</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MiPerfil;
