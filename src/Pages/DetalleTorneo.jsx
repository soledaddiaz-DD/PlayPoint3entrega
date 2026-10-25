import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import logo from "../assets/imagotipo.png";
import "../CSS/DetalleTorneo.css";
import { api } from "../api";
import { useAuth } from "../auth/AuthContext";
import "../CSS/Cuenta.css";

const tournaments = [
    {
        id: 1,
        title: "Torneo Intercolegial de Fútbol",
        category: "Fútbol",
        dates: "24 de Mayo al 30 de Junio",
        location: "Polideportivo ANU",
        status: "Proximos",
        description:
            "Una competencia pensada para disfrutar del fútbol, compartir con otros equipos y vivir una experiencia deportiva única.",
        image:
            "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=1200&q=80",
    },
    {
        id: 2,
        title: "Copa Ánima de Básquetbol",
        category: "Básquetbol",
        dates: "10 de Junio al 20 de Julio",
        location: "Polideportivo ANU",
        status: "Proximos",
        description:
            "Sumate a una nueva edición de la Copa Ánima y disfrutá de la competencia junto a otros equipos.",
        image:
            "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1200&q=80",
    },
    {
        id: 3,
        title: "Torneo de Voley Mixto",
        category: "Voley",
        dates: "5 de Julio al 20 de Julio",
        location: "Gimnasio ANU",
        status: "EnCurso",
        description:
            "Un torneo para disfrutar del voley en equipo, conocer nuevas personas y compartir la pasión por el deporte.",
        image:
            "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&w=1200&q=80",
    },
    {
        id: 4,
        title: "Desafío Running 5K",
        category: "Running",
        dates: "10 de Agosto",
        location: "Pista ANU",
        status: "Finalizados",
        description:
            "Aceptá el desafío, superá tus límites y disfrutá de una jornada deportiva junto a la comunidad PlayPoint.",
        image:
            "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=1200&q=80",
    },
];

const DetalleTorneo = () => {
    const { id } = useParams();

    const tournament = tournaments.find(
        (item) => item.id === Number(id)
    );

    const { user } = useAuth();

    const [mostrarForm, setMostrarForm] = useState(false);
    const [inscripto, setInscripto] = useState(false);
    const [enviando, setEnviando] = useState(false);
    const [error, setError] = useState("");
    const [form, setForm] = useState({
        nombre: user.fullName,
        email: user.email,
        telefono: user.phone,
        equipo: "",
        integrantes: "1",
    });

    // ¿Ya estoy inscripto? Lo sabe el servidor.
    useEffect(() => {
        let cancelado = false;
        api
            .get("/tournaments")
            .then((r) => {
                if (!cancelado) {
                    setInscripto(
                        r.tournaments.some((t) => t.id === Number(id) && t.isRegistered)
                    );
                }
            })
            .catch(() => {});
        return () => {
            cancelado = true;
        };
    }, [id]);

    const handleChange = (e) =>
        setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (enviando) return;

        setEnviando(true);
        setError("");
        try {
            await api.post(`/tournaments/${tournament.id}/register`, {
                fullName: form.nombre,
                email: form.email,
                phone: form.telefono,
                teamName: form.equipo,
                membersCount: Number(form.integrantes),
            });
            setInscripto(true);
            setMostrarForm(false);
        } catch (err) {
            if (err.code === "ALREADY_REGISTERED") {
                setInscripto(true);
                setMostrarForm(false);
            } else {
                setError(err.message);
            }
        } finally {
            setEnviando(false);
        }
    };

    if (!tournament) {
        return (
            <div className="detallePage">
                <h1>Torneo no encontrado</h1>

                <Link to="/Torneos" className="backButton">
                    ← Volver a torneos
                </Link>
            </div>
        );
    }

    const finalizado = tournament.status === "Finalizados";

    return (
        <div className="detallePage">

            {/* HEADER */}
            <header className="detalleHeader">
                <Link to="/Torneos" className="backLink">
                    ← Volver a torneos
                </Link>

                <div className="nav-brand">
                    <img src={logo} alt="PlayPoint" />
                </div>
            </header>

            {/* CONTENIDO */}
            <main className="detalleContainer">

                <div className="detalleImageContainer">
                    <img
                        src={tournament.image}
                        alt={tournament.title}
                        className="detalleImage"
                    />

                    <span className="detalleCategory">
                        {tournament.category}
                    </span>
                </div>

                <div className="detalleContent">

                    <span className="detalleEyebrow">
                        PLAYPOINT · TORNEOS
                    </span>

                    <h1>{tournament.title}</h1>

                    <p className="detalleDescription">
                        {tournament.description}
                    </p>

                    <div className="detalleInfo">

                        <div className="infoItem">
                            <span className="infoIcon">📅</span>

                            <div>
                                <small>FECHA</small>
                                <strong>{tournament.dates}</strong>
                            </div>
                        </div>

                        <div className="infoItem">
                            <span className="infoIcon">📍</span>

                            <div>
                                <small>LUGAR</small>
                                <strong>{tournament.location}</strong>
                            </div>
                        </div>

                        <div className="infoItem">
                            <span className="infoIcon">🏆</span>

                            <div>
                                <small>CATEGORÍA</small>
                                <strong>{tournament.category}</strong>
                            </div>
                        </div>

                    </div>

                    {finalizado ? (
                        <p className="inscripcionAviso">
                            Este torneo ya finalizó. Las inscripciones están cerradas.
                        </p>
                    ) : inscripto ? (
                        <p className="inscripcionAviso ok">
                            ✓ Ya estás inscripto en este torneo
                        </p>
                    ) : (
                        <button
                            className="inscriptionButton"
                            onClick={() => setMostrarForm(true)}
                        >
                            Inscribirme al torneo
                            <span>→</span>
                        </button>
                    )}

                </div>

            </main>

            {/* FORMULARIO DE INSCRIPCIÓN */}
            {mostrarForm && (
                <div
                    className="modalOverlay"
                    onClick={() => setMostrarForm(false)}
                >
                    <div
                        className="modalCard"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            className="modalClose"
                            onClick={() => setMostrarForm(false)}
                            aria-label="Cerrar"
                        >
                            ×
                        </button>

                        <h2>Inscripción al torneo</h2>
                        <p className="modalSub">{tournament.title}</p>

                        <form onSubmit={handleSubmit} className="modalForm">

                            <label>
                                Nombre completo
                                <input
                                    name="nombre"
                                    value={form.nombre}
                                    onChange={handleChange}
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
                                    onChange={handleChange}
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
                                    onChange={handleChange}
                                    required
                                />
                            </label>

                            <div className="modalRow">
                                <label>
                                    Nombre del equipo
                                    <input
                                        name="equipo"
                                        placeholder="Opcional"
                                        value={form.equipo}
                                        onChange={handleChange}
                                    />
                                </label>

                                <label>
                                    Integrantes
                                    <input
                                        type="number"
                                        name="integrantes"
                                        min="1"
                                        max="30"
                                        value={form.integrantes}
                                        onChange={handleChange}
                                        required
                                    />
                                </label>
                            </div>

                            {error && (
                                <p className="pp-alert error" role="alert">
                                    {error}
                                </p>
                            )}

                            <button
                                type="submit"
                                className="modalSubmit"
                                disabled={enviando}
                            >
                                {enviando ? "Enviando..." : "Confirmar inscripción"}
                            </button>

                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

export default DetalleTorneo;