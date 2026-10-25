import React, { useState } from "react";
import "../CSS/Torneos.css";
import Footer from "./Footer";
import logo from "../assets/imagotipo.png";
import { Link } from "react-router-dom";
import NavProfileBtn from "../components/NavProfileBtn";

const TournamentsSection = () => {
    const [activeTab, setActiveTab] = useState("Proximos");

    const tournaments = [
        {
            id: 1,
            title: "Torneo Intercolegial de Fútbol",
            category: "Fútbol",
            dates: "24 de Mayo al 30 de Junio",
            location: "Polideportivo ANU",
            status: "Proximos",
            image:
                "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=800&q=80",
        },
        {
            id: 2,
            title: "Copa Ánima de Básquetbol",
            category: "Básquetbol",
            dates: "10 de Junio al 20 de Julio",
            location: "Polideportivo ANU",
            status: "Proximos",
            image:
                "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=800&q=80",
        },
        {
            id: 3,
            title: "Torneo de Voley Mixto",
            category: "Voley",
            dates: "5 de Julio al 20 de Julio",
            location: "Gimnasio ANU",
            status: "EnCurso",
            image:
                "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&w=800&q=80",
        },
        {
            id: 4,
            title: "Desafío Running 5K",
            category: "Running",
            dates: "10 de Agosto",
            location: "Pista ANU",
            status: "Finalizados",
            image:
                "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=800&q=80",
        },
    ];

    const filteredTournaments = tournaments.filter(
        (tournament) => tournament.status === activeTab
    );

    return (
        <div className="torneosPage">

            {/* ================= HEADER ================= */}
            <header className="navbar">
                <div className="nav-brand">
                    <img src={logo} alt="PlayPoint" />
                </div>

                {/* NAVEGACIÓN */}
                <nav className="nav-links">

                    <Link to="/Home">Inicio</Link>
                    <Link to="/Talleres">Talleres</Link>
                    <a href="/torneos" className="active">Torneos</a>
                    <Link to="/Comunidad">Comunidad</Link>
                    <Link to="/Membresias">Membresía</Link>
                    <Link to="/Resenas">Reseñas</Link>

                </nav>

                {/* USUARIO */}
                <NavProfileBtn className="userButton" />
            </header>

            {/* ================= CONTENIDO ================= */}
            <main>

                {/* HERO */}
                <section className="tournamentsHero">

                    <div className="heroContent">

                        <div className="heroText">

                            <span className="eyebrow">
                                PLAYPOINT · COMPETENCIAS
                            </span>

                            <h1>
                                Viví la competencia.
                                <br />
                                Viví <span>PlayPoint.</span>
                            </h1>

                            <p>
                                Encontrá torneos, competí con otros equipos y disfrutá
                                del deporte en una comunidad que se mueve, se esfuerza
                                y crece unida.
                            </p>

                        </div>

                        <div className="heroDecoration">

                            <div className="sportCircle">
                                ⚽
                            </div>

                            <div className="smallCircle circleOne"></div>

                            <div className="smallCircle circleTwo"></div>

                            <div className="smallCircle circleThree"></div>

                        </div>

                    </div>

                </section>

                {/* ================= TORNEOS ================= */}
                <section className="tournamentsSection">

                    <div className="sectionHeader">

                        <div>

                            <span className="sectionEyebrow">
                                COMPETÍ · COMPARTÍ · DISFRUTÁ
                            </span>

                            <h2>
                                Torneos disponibles
                            </h2>

                            <p>
                                Elegí una competencia y formá parte de la comunidad
                                deportiva de PlayPoint.
                            </p>

                        </div>

                    </div>

                    {/* TABS */}
                    <div className="tabs">

                        <button
                            className={`tabBtn ${activeTab === "Proximos" ? "activeTab" : ""
                                }`}
                            onClick={() => setActiveTab("Proximos")}
                        >
                            Próximos
                        </button>

                        <button
                            className={`tabBtn ${activeTab === "EnCurso" ? "activeTab" : ""
                                }`}
                            onClick={() => setActiveTab("EnCurso")}
                        >
                            En curso
                        </button>

                        <button
                            className={`tabBtn ${activeTab === "Finalizados" ? "activeTab" : ""
                                }`}
                            onClick={() => setActiveTab("Finalizados")}
                        >
                            Finalizados
                        </button>

                    </div>

                    {/* ================= LISTA DE TORNEOS ================= */}

                    {filteredTournaments.length > 0 ? (

                        <div className="tournamentsGrid">

                            {filteredTournaments.map((tournament) => (

                                <article
                                    className="tournamentCard"
                                    key={tournament.id}
                                >

                                    {/* IMAGEN */}
                                    <div className="imageContainer">

                                        <img
                                            src={tournament.image}
                                            alt={tournament.title}
                                            className="cardImage"
                                        />

                                        <span className="categoryBadge">
                                            {tournament.category}
                                        </span>

                                    </div>

                                    {/* INFORMACIÓN */}
                                    <div className="cardContent">

                                        <h3>
                                            {tournament.title}
                                        </h3>

                                        <div className="cardDetail">

                                            <span className="detailIcon">
                                                📅
                                            </span>

                                            <span>
                                                {tournament.dates}
                                            </span>

                                        </div>

                                        <div className="cardDetail">

                                            <span className="detailIcon">
                                                📍
                                            </span>

                                            <span>
                                                {tournament.location}
                                            </span>

                                        </div>

                                        <Link
                                            to={`/Torneos/${tournament.id}`}
                                            className="detailsButton"
                                        >
                                            <span>Ver detalles</span>
                                            <span>→</span>
                                        </Link>

                                    </div>

                                </article>

                            ))}

                        </div>

                    ) : (

                        /* ================= ESTADO VACÍO ================= */

                        <div className="emptyState">

                            <div className="emptyIcon">
                                🏆
                            </div>

                            <h3>
                                No hay torneos disponibles
                            </h3>

                            <p>
                                Actualmente no tenemos torneos en esta categoría.
                            </p>

                        </div>

                    )}

                </section>

            </main>

            {/* ================= FOOTER EXISTENTE ================= */}
            <Footer />

        </div>
    );
};

export default TournamentsSection;