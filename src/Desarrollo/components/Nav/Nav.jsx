import { Link, useNavigate } from "react-router-dom";
import "./Nav.css";
import maajiLogo from "../../../Imagenes/Login/maaji.png";
import user from "../../../Imagenes/Perfil/user.png";
import notificacion from "../../../Imagenes/Perfil/campana.jpg";
import { authService } from "../../../services/api.js";

export default function Nav({ showNotification = false }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      navigate("/login");
    }
  };

  return (
    <header className="nav-header">
      <div className="nav-left">
        <img src={maajiLogo} alt="Maaji logo" className="nav-logo" />
        <div className="nav-search-bar">
          <input type="text" placeholder="Search" />
        </div>
      </div>

      <nav className="nav-links">
        <Link to="/dashboard">Home</Link>
        <Link to="/documents">Documents</Link>
        <Link to="/cases">Cases</Link>
        <button 
          className="nav-notification-icon" 
          onClick={() => {
            // Aquí puedes agregar lógica para mostrar notificaciones
          }}
        >
          <img src={notificacion} alt="Notification" className="nav-icon" />
        </button>
        <Link to="/profile" className="nav-user-icon">
          <img src={user} alt="User" />
        </Link>
        <button className="nav-logout" onClick={handleLogout}>
          Salir
        </button>
      </nav>
    </header>
  );
}

