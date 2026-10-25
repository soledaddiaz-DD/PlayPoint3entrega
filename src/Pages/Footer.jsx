import { Link } from "react-router-dom";
import logo from "../assets/footer-logo.png";
import "../CSS/Footer.css";

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div className="footer-brand">
          <img src={logo} alt="PlayPoint" />
          <p>
            Talleres deportivos. Sumate a nuestra comunidad y formá parte de
            algo que se mueve.
          </p>
          <div className="footer-social">
            <a href="#" aria-label="Facebook">f</a>
            <a href="#" aria-label="LinkedIn">in</a>
            <a href="#" aria-label="YouTube">yt</a>
          </div>
        </div>

        <div className="footer-col">
          <h4>Contacto</h4>
          <p>
            contacto@playpoint.uy
            <br />
            098 123 456
            <br />
            Montevideo, Uruguay
          </p>
        </div>
      </div>

      <div className="footer-bottom">
        © 2026 PlayPoint — Montevideo, Uruguay
      </div>
    </footer>
  );
}

export default Footer;