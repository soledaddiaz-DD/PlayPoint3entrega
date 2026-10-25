import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Trophy } from "lucide-react";
import logo from "../assets/imagotipo.png";
import Footer from "./Footer";
import "../CSS/Comunidad.css";
import "../CSS/DetalleGrupo.css";
import "../CSS/Cuenta.css";
import { api } from "../api";
import NavProfileBtn from "../components/NavProfileBtn";
import PilaAvatares from "../components/PilaAvatares";

function DetalleGrupo() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [grupo, setGrupo] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [trabajando, setTrabajando] = useState(false);

    useEffect(() => {
        let cancelado = false;
        setCargando(true);
        api
            .get(`/groups/${id}`)
            .then((r) => !cancelado && setGrupo(r.group))
            .catch((err) => {
                if (!cancelado && err.status !== 404) setError(err.message);
            })
            .finally(() => !cancelado && setCargando(false));
        return () => {
            cancelado = true;
        };
    }, [id]);

    const esMiembro = grupo?.isMember ?? false;

    const alternar = async () => {
        if (!esMiembro) {
            navigate(`/comunidad/unirse/${id}`);
            return;
        }
        setTrabajando(true);
        setError("");
        try {
            const r = await api.del(`/groups/${id}/join`);
            setGrupo(r.group);
        } catch (err) {
            setError(err.message);
        } finally {
            setTrabajando(false);
        }
    };

    return (
        <div className="comunidad-page">
            <header className="navbar">
                <div className="nav-brand">
                    <img src={logo} alt="PlayPoint" />
                </div>

                <nav className="nav-links">
                    <Link to="/home">Inicio</Link>
                    <Link to="/talleres">Talleres</Link>
                    <Link to="/torneos">Torneos</Link>
                    <Link to="/comunidad" className="active">
                        Comunidad
                    </Link>
                    <Link to="/membresias">Membresía</Link>
                    <Link to="/resenas">Reseñas</Link>
                </nav>

                <NavProfileBtn />
            </header>

            <div className="grupo-detalle">
                <Link to="/comunidad" className="grupo-volver">
                    <ArrowLeft size={16} /> Volver a comunidad
                </Link>

                {cargando ? (
                    <p className="cuenta-ayuda">Cargando grupo…</p>
                ) : !grupo ? (
                    <div className="grupo-detalle-card">
                        <h1>{error || "Grupo no encontrado"}</h1>
                    </div>
                ) : (
                    <div className="grupo-detalle-card">
                        <div className="grupo-detalle-top">
                            <div className="grupo-detalle-emoji">{grupo.emoji}</div>

                            <div className="grupo-detalle-titulo">
                                <span className="grupo-detalle-tag">{grupo.sport}</span>
                                <h1>{grupo.name}</h1>
                            </div>
                        </div>

                        <p className="grupo-detalle-desc">{grupo.description}</p>

                        <div className="grupo-detalle-datos">
                            <div>
                                <Users size={18} />
                                <span>
                                    <strong>{grupo.memberCount}</strong>{" "}
                                    {grupo.memberCount === 1 ? "miembro" : "miembros"}
                                </span>
                            </div>
                            <div>
                                <Trophy size={18} />
                                <span>
                                    Deporte: <strong>{grupo.sport}</strong>
                                </span>
                            </div>
                        </div>

                        <PilaAvatares
                            miembros={grupo.members}
                            total={grupo.memberCount}
                            className="grupo-avatar-stack grupo-detalle-avatares"
                        />

                        {error && <p className="pp-alert error" role="alert">{error}</p>}

                        <button
                            className={esMiembro ? "btn-outline" : "btn-primary"}
                            onClick={alternar}
                            disabled={trabajando}
                        >
                            {esMiembro ? "Salir del grupo" : "Unirme al grupo"}
                        </button>

                        {esMiembro && (
                            <p className="grupo-detalle-ok">✓ Ya sos parte de este grupo</p>
                        )}
                    </div>
                )}
            </div>

            <Footer />
        </div>
    );
}

export default DetalleGrupo;