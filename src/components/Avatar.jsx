import { assetUrl } from "../api";
import { iniciales } from "../data/store";
import { colorDe } from "./colorDe";
import "../CSS/Cuenta.css";

/** Foto de perfil, o las iniciales sobre un color si todavía no subió una. */
export default function Avatar({ avatarUrl, nombre = "", size = 42, className = "" }) {
  const style = { width: size, height: size, fontSize: Math.round(size * 0.38) };

  if (avatarUrl) {
    return <img className={`pp-avatar pp-avatar-img ${className}`} style={style} src={assetUrl(avatarUrl)} alt="" />;
  }
  return (
    <span className={`pp-avatar ${className}`} style={{ ...style, background: colorDe(nombre) }} aria-hidden="true">
      {iniciales(nombre)}
    </span>
  );
}
