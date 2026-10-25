import { Link } from "react-router-dom";
import { User } from "lucide-react";
import { assetUrl } from "../api";
import { useAuth } from "../auth/AuthContext";
import "../CSS/Cuenta.css";

/** Botón redondo de la barra superior: muestra tu foto (o el ícono) y lleva a tu perfil. */
export default function NavProfileBtn({ className = "nav-profile-btn" }) {
  const { user } = useAuth();
  return (
    <Link
      to="/perfil"
      className={`${className} nav-profile-link`}
      aria-label={user ? `Mi perfil (${user.username})` : "Mi perfil"}
    >
      {user?.avatarUrl ? (
        <img src={assetUrl(user.avatarUrl)} alt="" className="nav-profile-img" />
      ) : (
        <User size={18} />
      )}
    </Link>
  );
}
