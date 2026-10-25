import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Star, MessageCircle, Trash2 } from "lucide-react";
import logo from "../assets/imagotipo.png";
import Footer from "./Footer";
import "../CSS/Resenas.css";
import "../CSS/Cuenta.css";
import { api, assetUrl, tiempoRelativo } from "../api";
import NavProfileBtn from "../components/NavProfileBtn";

const COLORES = ["verde", "naranja", "violeta"];

function Estrellas({ puntaje }) {
  return (
    <div className="review-stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={16}
          className={i < puntaje ? "star filled" : "star"}
        />
      ))}
    </div>
  );
}

/* Foto de la persona, o su inicial si no subió una */
function Foto({ autor }) {
  return autor.avatarUrl ? (
    <img className="review-avatar-img" src={assetUrl(autor.avatarUrl)} alt="" />
  ) : (
    autor.username[0].toUpperCase()
  );
}

function Resenas() {
  const [resenas, setResenas] = useState(null);
  const [error, setError] = useState("");

  const [abierta, setAbierta] = useState(null); // id de la reseña que se está respondiendo
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const r = await api.get("/reviews");
      setResenas(r.reviews);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const enviarRespuesta = async (e, resenaId) => {
    e.preventDefault();
    if (!texto.trim() || enviando) return;

    setEnviando(true);
    try {
      await api.post(`/reviews/${resenaId}/replies`, { text: texto });
      setTexto("");
      setAbierta(null);
      await cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  const borrar = async (url, pregunta) => {
    if (!window.confirm(pregunta)) return;
    try {
      await api.del(url);
      await cargar();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="resenas-page">
      {/* NAVBAR */}
      <header className="navbar">
        <div className="nav-brand">
          <img src={logo} alt="PlayPoint" />
        </div>

        <nav className="nav-links">
          <Link to="/home">Inicio</Link>
          <Link to="/talleres">Talleres</Link>
          <Link to="/torneos">Torneos</Link>
          <Link to="/comunidad">Comunidad</Link>
          <Link to="/membresias">Membresía</Link>
          <Link to="/resenas" className="active">
            Reseñas
          </Link>
        </nav>

        <NavProfileBtn />
      </header>

      {/* HEADER */}
      <section className="resenas-header">
        <div>
          <h1>Reseñas de talleres</h1>
          <p>Lo que dice nuestra comunidad</p>
        </div>

        <Link to="/resenas/escribir" className="btn-primary">
          Escribir reseña
        </Link>
      </section>

      <div className="resenas-content">
        {error && <p className="pp-alert error" role="alert">{error}</p>}
        {!resenas && !error && <p className="cuenta-ayuda">Cargando reseñas…</p>}
        {resenas && !resenas.length && (
          <p className="cuenta-ayuda">Todavía no hay reseñas. ¡Escribí la primera!</p>
        )}

        {/* LISTA DE RESEÑAS */}
        <div className="resenas-lista">
          {(resenas ?? []).map((r, i) => (
            <div className="review-card" key={r.id}>
              <div className="review-top">
                <div className={`review-avatar ${COLORES[i % COLORES.length]}`}>
                  <Foto autor={r.author} />
                </div>

                <div className="review-info">
                  <span className="review-nombre">@{r.author.username}</span>
                  <span className="review-fecha">
                    {tiempoRelativo(r.createdAt)} · {r.workshopName}
                  </span>
                </div>

                <Estrellas puntaje={r.rating} />
              </div>

              <p className="review-texto">{r.text}</p>

              {/* RESPUESTAS */}
              {r.replies.length > 0 && (
                <div className="review-respuestas">
                  {r.replies.map((resp) => (
                    <div className="respuesta" key={resp.id}>
                      <div className="respuesta-avatar">
                        <Foto autor={resp.author} />
                      </div>
                      <div>
                        <div className="respuesta-head">
                          <strong>@{resp.author.username}</strong>
                          <span>{tiempoRelativo(resp.createdAt)}</span>
                        </div>
                        <p>{resp.text}</p>
                        {resp.author.isMe && (
                          <button
                            type="button"
                            className="btn-borrar-mini"
                            onClick={() =>
                              borrar(`/reviews/replies/${resp.id}`, "¿Borrar tu respuesta?")
                            }
                          >
                            <Trash2 size={12} /> Borrar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* FORMULARIO PARA RESPONDER */}
              {abierta === r.id ? (
                <form
                  className="respuesta-form"
                  onSubmit={(e) => enviarRespuesta(e, r.id)}
                >
                  <textarea
                    rows="3"
                    placeholder="Escribí tu respuesta..."
                    value={texto}
                    onChange={(e) => setTexto(e.target.value)}
                    maxLength={600}
                    autoFocus
                    required
                  />
                  <div className="respuesta-botones">
                    <button
                      type="button"
                      className="respuesta-cancelar"
                      onClick={() => {
                        setAbierta(null);
                        setTexto("");
                      }}
                    >
                      Cancelar
                    </button>
                    <button type="submit" className="respuesta-enviar" disabled={enviando}>
                      Responder
                    </button>
                  </div>
                </form>
              ) : (
                <div className="review-acciones">
                  <button
                    type="button"
                    className="btn-responder"
                    onClick={() => {
                      setAbierta(r.id);
                      setTexto("");
                    }}
                  >
                    <MessageCircle size={15} /> Responder
                    {r.replies.length > 0 && ` (${r.replies.length})`}
                  </button>

                  {r.author.isMe && (
                    <button
                      type="button"
                      className="btn-borrar-mini"
                      onClick={() => borrar(`/reviews/${r.id}`, "¿Borrar tu reseña?")}
                    >
                      <Trash2 size={13} /> Borrar mi reseña
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="resenas-cta">
          <h2>Tu opinión ayuda a que más personas elijan moverse.</h2>
          <p>¡Gracias por ser parte de PlayPoint!</p>

          <Link to="/resenas/escribir" className="btn-primary">
            Escribir reseña
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default Resenas;
