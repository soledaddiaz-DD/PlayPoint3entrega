import { assetUrl } from "../api";
import { colorDe } from "./colorDe";

/** Los primeros miembros de un grupo (foto o inicial) y un "+N" con el resto. */
export default function PilaAvatares({ miembros, total, className = "grupo-avatar-stack" }) {
  const extra = Math.max(0, total - miembros.length);
  return (
    <div className={className}>
      {miembros.map((m) =>
        m.avatarUrl ? (
          <img
            key={m.username}
            className="av av-img"
            src={assetUrl(m.avatarUrl)}
            alt=""
            title={m.username}
          />
        ) : (
          <div key={m.username} className="av" style={{ background: colorDe(m.username) }} title={m.username}>
            {m.username[0].toUpperCase()}
          </div>
        )
      )}
      {extra > 0 && <div className="av av-more">+{extra}</div>}
    </div>
  );
}
