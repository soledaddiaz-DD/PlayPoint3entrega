import { useState } from "react";
import { useNavigate } from "react-router-dom";
import botImage from "../assets/bot.png";
import "../CSS/Chatbot.css";

function Chatbot() {
    const [abierto, setAbierto] = useState(false);
    const [opcion, setOpcion] = useState(null);

    const navigate = useNavigate();

    return (
        <div className="bot-ayuda">

            {/* VENTANA DEL CHAT */}

            {abierto && (

                <div className="chatbot">

                    {/* HEADER */}

                    <div className="chat-header">

                        <img
                            src={botImage}
                            alt="Asistente PlayPoint"
                            className="chat-bot-image"
                        />

                        <div className="chat-header-text">

                            <strong>
                                PlayPoint
                            </strong>

                            <span>
                                Asistente deportivo
                            </span>

                        </div>

                    </div>


                    {/* CUERPO DEL CHAT */}

                    <div className="chat-body">

                        {/* MENÚ PRINCIPAL */}

                        {!opcion && (

                            <>

                                <div className="chat-welcome">

                                    <p>
                                        ¡Hola! 👋
                                    </p>

                                    <span>
                                        ¿En qué puedo ayudarte?
                                    </span>

                                </div>


                                <button
                                    onClick={() =>
                                        setOpcion("talleres")
                                    }
                                >
                                    <span>🏀</span>
                                    Talleres
                                </button>


                                <button
                                    onClick={() =>
                                        setOpcion("horarios")
                                    }
                                >
                                    <span>📅</span>
                                    Horarios
                                </button>


                                <button
                                    onClick={() =>
                                        setOpcion("cuenta")
                                    }
                                >
                                    <span>👤</span>
                                    Mi cuenta
                                </button>


                                <button
                                    onClick={() =>
                                        setOpcion("otro")
                                    }
                                >
                                    <span>❓</span>
                                    Otro problema
                                </button>

                            </>

                        )}

                        {/* ==================================================
    TALLERES
================================================== */}

                        {opcion === "talleres" && (
                            <>
                                <div className="chat-option-title">
                                    <span>🏀</span>
                                    <strong>Talleres</strong>
                                </div>

                                <p>
                                    Podés consultar los talleres deportivos disponibles e
                                    inscribirte al que más te guste.
                                </p>

                                <button onClick={() => navigate("/talleres")}>
                                    <span>🏀</span>
                                    Ver talleres
                                </button>

                                <button onClick={() => navigate("/talleres")}>
                                    <span>✓</span>
                                    Inscribirme
                                </button>

                                <button
                                    className="back-button"
                                    onClick={() => setOpcion(null)}
                                >
                                    ← Volver
                                </button>
                            </>
                        )}


                        {/* ==================================================
    HORARIOS
================================================== */}

                        {opcion === "horarios" && (
                            <>
                                <div className="chat-option-title">
                                    <span>📅</span>
                                    <strong>Horarios</strong>
                                </div>

                                <p>
                                    Acá podés consultar los horarios de los talleres disponibles.
                                </p>

                                <button onClick={() => navigate("/talleres")}>
                                    <span>📅</span>
                                    Ver horarios
                                </button>

                                <button
                                    className="back-button"
                                    onClick={() => setOpcion(null)}
                                >
                                    ← Volver
                                </button>
                            </>
                        )}


                        {/* ==================================================
    MI CUENTA
================================================== */}

                        {opcion === "cuenta" && (
                            <>
                                <div className="chat-option-title">
                                    <span>👤</span>
                                    <strong>Mi cuenta</strong>
                                </div>

                                <p>
                                    Desde acá podés administrar tu perfil, tus inscripciones y
                                    tus talleres.
                                </p>

                                <button onClick={() => navigate("/perfil")}>
                                    <span>👤</span>
                                    Ir a mi cuenta
                                </button>

                                <button
                                    className="back-button"
                                    onClick={() => setOpcion(null)}
                                >
                                    ← Volver
                                </button>
                            </>
                        )}

                        {/* OTRO PROBLEMA */}

                        {opcion === "otro" && (

                            <>

                                <div className="chat-option-title">

                                    <span>❓</span>

                                    <strong>
                                        ¿Necesitás otra cosa?
                                    </strong>

                                </div>


                                <p>
                                    Si tenés algún problema o
                                    pregunta, podés comunicarte
                                    con nosotros.
                                </p>


                                <button>
                                    <span>💬</span>
                                    Contactarnos
                                </button>


                                <button
                                    className="back-button"
                                    onClick={() =>
                                        setOpcion(null)
                                    }
                                >
                                    ← Volver
                                </button>

                            </>

                        )}

                    </div>

                </div>

            )}


            {/* MENSAJE DE AYUDA */}

            {!abierto && (

                <div className="mensaje-ayuda">
                    ¿Necesitás ayuda?
                </div>

            )}


            {/* BOTÓN DEL ROBOT */}

            <button
                className="bot-icono"
                onClick={() => {

                    setAbierto(!abierto);

                    // Cuando se cierra el chat,
                    // vuelve al menú principal
                    if (abierto) {
                        setOpcion(null);
                    }

                }}
                aria-label="Abrir asistente PlayPoint"
            >

                {abierto ? (

                    <span className="close-icon">
                        ✕
                    </span>

                ) : (

                    <img
                        src={botImage}
                        alt="Asistente PlayPoint"
                    />

                )}

            </button>

        </div>
    );
}

export default Chatbot;