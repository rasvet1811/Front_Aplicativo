import "./index.css";
import Nav from "../components/Nav/Nav.jsx";
import user from "../../Imagenes/Perfil/user.png";

export default function Profile() {
  return (
    <div className="profile-container">
      <Nav showNotification={true} />
      <main className="profile-content">
        <aside className="profile-sidebar">
          <div className="profile-photo">
            <img src={user} alt="User" />
          </div>
          <div className="profile-basic-info">
            <p className="profile-name">Sara Corrales Jaramillo</p>
            <p className="profile-title">Aprendiz Tecnología</p>
          </div>
          <div className="profile-division">
            <div className="division-label">División</div>
            <div className="division-value">
              <p>ARTMODE</p>
            </div>
          </div>
        </aside>

        <section className="profile-details">
          <div className="profile-edit-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 17.25V21H6.75L17.81 9.94L14.06 6.19L3 17.25ZM20.71 7.04C21.1 6.65 21.1 6.02 20.71 5.63L18.37 3.29C17.98 2.9 17.35 2.9 16.96 3.29L15.12 5.13L18.87 8.88L20.71 7.04Z" fill="#666"/>
            </svg>
          </div>
          <div className="details-grid">
            <div className="details-cell">
              <div className="details-label">My role</div>
              <div className="details-value">
                <p>Analista de Soluciones</p>
                <p>Dirección de Tecnología y Transformación Digital</p>
              </div>
            </div>
            <div className="details-cell">
              <div className="details-label">City</div>
              <div className="details-value">
                <p>Medellín</p>
                <p>Colombia</p>
              </div>
            </div>
            <div className="details-cell">
              <div className="details-label">Experience</div>
              <div className="details-value">
                <p>2 años</p>
                <p>Desarrollo de software y análisis de sistemas</p>
              </div>
            </div>
            <div className="details-cell">
              <div className="details-label">Correo</div>
              <div className="details-value">
                <p>sara.corrales@maaji.co</p>
                <p>sara.corrales.jaramillo@gmail.com</p>
              </div>
            </div>
            <div className="details-cell">
              <div className="details-label">Fecha de ingreso</div>
              <div className="details-value">
                <p>19 de mayo del 2025</p>
                <p>Contrato indefinido</p>
              </div>
            </div>
            <div className="details-cell">
              <div className="details-label">Area</div>
              <div className="details-value">
                <p>Dirección de Talento, Cultura & Tecnología</p>
                <p>Sub-área: Soluciones & Arquitectura</p>
              </div>
            </div>
            <div className="details-cell">
              <div className="details-label">División</div>
              <div className="details-value">
                <p>ARTMODE</p>
                <p>Supervisor: Gloria Patricia Gonzalez</p>
              </div>
            </div>
            <div className="details-cell empty"></div>
          </div>
        </section>
      </main>
    </div>
  );
}
