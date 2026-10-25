import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { api } from "../api";
import { useAuth } from "../auth/AuthContext";
import { getTallerPorId } from "../data/Talleresdata";
import "../CSS/Formularios.css";
import "../CSS/Cuenta.css";

function InscripcionTaller() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const taller = getTallerPorId(id);

  const [form, setForm] = useState({
    nombre: user.fullName,
    email: user.email,
    telefono: user.phone,
    comentarios: "",
  });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [estado, setEstado] = useState(null); // { available, isEnrolled }

  useEffect(() => {
    let cancelado = false;
    api
      .get("/workshops")
      .then((r) => {
        if (!cancelado) setEstado(r.workshops.find((w) => w.id === id) ?? null);
      })
      .catch(() => {});
    return () => {
      cancelado = true;
    };
  }, [id]);

  const cambiar = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (enviando) return;

    setEnviando(true);
    setError("");
    try {
      await api.post(`/workshops/${id}/enroll`, {
        fullName: form.nombre,
        email: form.email,
        phone: form.telefono,
        comments: form.comentarios,
      });
      navigate("/perfil/inscripciones", { replace: true });
    } catch (err) {
      setError(err.message);
      setEnviando(false);
    }
  };

  if (!taller) {
    return (
      <div className="form-page">
        <div className="form-container">
          <Link to="/talleres" className="form-back">
            <ArrowLeft size={17} />
            Volver a talleres
          </Link>
          <div className="form-card">
            <h1>No encontramos ese taller</h1>
          </div>
        </div>
      </div>
    );
  }

  const sinCupos = estado && estado.available === 0 && !estado.isEnrolled;

  return (
    <div className="form-page">
      <div className="form-container">
        <Link to={`/talleres/${id}`} className="form-back">
          <ArrowLeft size={17} />
          Volver al taller
        </Link>

        <div className="form-card">
          <h1>Inscribirme al taller de {taller.nombre}</h1>
          <p>Completá tus datos para reservar tu lugar.</p>

          {estado?.isEnrolled ? (
            <p className="pp-alert ok">
              ✓ Ya estás inscripto en este taller. Podés verlo en{" "}
              <Link to="/perfil/inscripciones">Mis inscripciones</Link>.
            </p>
          ) : sinCupos ? (
            <p className="pp-alert error">Este taller ya no tiene cupos disponibles.</p>
          ) : (
            <form onSubmit={handleSubmit}>
              <label>
                Nombre completo
                <input
                  type="text"
                  name="nombre"
                  placeholder="Tu nombre"
                  value={form.nombre}
                  onChange={cambiar}
                  required
                />
              </label>

              <label>
                Correo electrónico
                <input
                  type="email"
                  name="email"
                  placeholder="nombre@email.com"
                  value={form.email}
                  onChange={cambiar}
                  required
                />
              </label>

              <label>
                Teléfono
                <input
                  type="tel"
                  name="telefono"
                  placeholder="099 123 456"
                  value={form.telefono}
                  onChange={cambiar}
                  required
                />
              </label>

              <label>
                Comentarios
                <textarea
                  name="comentarios"
                  placeholder="¿Querés contarnos algo?"
                  rows="4"
                  maxLength={500}
                  value={form.comentarios}
                  onChange={cambiar}
                />
              </label>

              {error && <p className="pp-alert error" role="alert">{error}</p>}

              <button type="submit" className="form-submit" disabled={enviando}>
                {enviando ? "Enviando..." : "Confirmar inscripción"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default InscripcionTaller;
