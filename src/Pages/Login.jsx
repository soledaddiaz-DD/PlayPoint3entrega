import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
    Mail,
    Eye,
    EyeOff
} from "lucide-react";
import logo from "../assets/imagotipo.png";
import { useAuth } from "../auth/AuthContext";
import "../CSS/Login.css";
import "../CSS/Cuenta.css";

function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [remember, setRemember] = useState(false);
    const [error, setError] = useState("");
    const [enviando, setEnviando] = useState(false);

    const iniciarsesion = async (e) => {
        e.preventDefault();
        if (enviando) return;

        setError("");
        setEnviando(true);
        try {
            await login(email, password, remember);
            navigate(location.state?.from || "/home", { replace: true });
        } catch (err) {
            setError(err.message);
            setEnviando(false);
        }
    };

    return (

        <div className="login-page">

            {/* =========================
                PANEL IZQUIERDO
            ========================= */}
            <div className="page-background">

                <div className="visual-overlay"></div>

                {/* Ondas decorativas */}
                <div className="wave wave-1"></div>
                <div className="wave wave-2"></div>
                <div className="wave wave-3"></div>
                <div className="wave wave-4"></div>
                <div className="wave wave-5"></div>
                <div className="wave wave-6"></div>

            </div>
            <div className="visual-content">

                <div className="visual-bottom">

                    <h1>
                        Somos
                        <br />
                        PlayPoint
                    </h1>

                    <p>
                       Una comunidad que conecta personas a través del deporte.
                        <br />
                        Descubrí actividades, participá en torneos
                        <br />
                        y encontrá personas que comparten tu misma pasión.
                    </p>

                </div>

            </div>

            {/* =========================
                PANEL DERECHO
            ========================= */}
            <section className="form-panel">

                <div className="login-content">

                    <div className="top-brand">
                         <img src={logo} alt="PlayPoint" className="brand-logo" />
                    </div>

                    <div className="form-header">

                        <h2>
                            Bienvenido/a
                        </h2>

                        <p>
                            Iniciá sesión para acceder a tu cuenta
                        </p>

                    </div>


                    <form onSubmit={iniciarsesion}>

                        {/* CORREO */}
                        <div className="input-group">

                            <label>
                                Correo electrónico
                            </label>

                            <div className="input-wrapper">

                                <input
                                    type="email"
                                    placeholder="Ingresá tu correo"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    autoComplete="email"
                                    required
                                />

                                <Mail
                                    size={18}
                                    className="input-icon"
                                />

                            </div>

                        </div>


                        {/* CONTRASEÑA */}
                        <div className="input-group">

                            <label>
                                Contraseña
                            </label>

                            <div className="input-wrapper">

                                <input
                                    type={
                                        showPassword
                                            ? "text"
                                            : "password"
                                    }
                                    placeholder="Ingresá tu contraseña"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoComplete="current-password"
                                    required
                                />

                                <button
                                    type="button"
                                    className="password-btn"
                                    onClick={() =>
                                        setShowPassword(
                                            !showPassword
                                        )
                                    }
                                >
                                    {showPassword ? (
                                        <EyeOff size={18} />
                                    ) : (
                                        <Eye size={18} />
                                    )}
                                </button>

                            </div>

                        </div>


                        {/* OPCIONES */}
                        <div className="form-options">

                            <label className="remember">

                                <input
                                    type="checkbox"
                                    checked={remember}
                                    onChange={(e) => setRemember(e.target.checked)}
                                />

                                <span>
                                    Recordarme
                                </span>

                            </label>

                            <a href="#">
                                ¿Olvidaste tu contraseña?
                            </a>

                        </div>


                        {error && (
                            <p className="pp-alert error" role="alert">
                                {error}
                            </p>
                        )}

                        {/* BOTÓN */}
                        <button
                            type="submit"
                            className="submit-btn"
                            disabled={enviando}
                        >
                            <span style={{ position: "relative", zIndex: 2 }}>
                                {enviando ? "Ingresando..." : "Iniciar sesión"}
                            </span>
                        </button>

                    </form>


                    {/* REGISTRO */}
                    <p className="register-text">

                        ¿No tenés una cuenta?

                        <Link to="/register">
                            Registrate
                        </Link>

                    </p>

                </div>

            </section>

        </div>
    );
}

export default Login;