import { useState, useEffect } from "react";
import "./index.css";
import Nav from "../components/Nav/Nav.jsx";
import user from "../../Imagenes/Perfil/user.png";
import { authService, usuariosAPI } from "../../services/api.js";

export default function Profile() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      // Obtener usuario del localStorage primero
      const localUser = authService.getUser();
      
      if (localUser && localUser.id) {
        // Cargar datos completos del usuario desde la API
        try {
          const fullUserData = await usuariosAPI.getById(localUser.id);
          setUserData(fullUserData);
        } catch (error) {
          console.warn('[Profile] Error al cargar datos completos, usando datos locales:', error);
          // Si falla, usar datos locales
          setUserData(localUser);
        }
      } else {
        // Si no hay usuario en localStorage, intentar verificar token
        const tokenData = await authService.verifyToken();
        if (tokenData && tokenData.user) {
          setUserData(tokenData.user);
        }
      }
    } catch (error) {
      console.error('[Profile] Error al cargar datos del usuario:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No especificada';
    try {
      const date = new Date(dateString);
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return date.toLocaleDateString('es-ES', options);
    } catch (error) {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="profile-container">
        <Nav showNotification={true} />
        <main className="profile-content">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p>Cargando información del perfil...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <Nav showNotification={true} />
      <main className="profile-content">
        <aside className="profile-sidebar">
          <div className="profile-photo">
            <img src={user} alt="User" />
          </div>
          <div className="profile-basic-info">
            <p className="profile-name">
              {userData?.nombre || 'Usuario'}
            </p>
            <p className="profile-title">
              {userData?.puesto || userData?.rol_tipo || 'Sin puesto asignado'}
            </p>
          </div>
          <div className="profile-division">
            <div className="division-label">División</div>
            <div className="division-value">
              <p>{userData?.division || 'Sin división asignada'}</p>
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
                <p>{userData?.puesto || 'Sin puesto asignado'}</p>
                <p>{userData?.rol_tipo || userData?.rol?.tipo || 'Sin rol'}</p>
              </div>
            </div>
            <div className="details-cell">
              <div className="details-label">City</div>
              <div className="details-value">
                <p>{userData?.ciudad || 'Sin ciudad asignada'}</p>
                <p>Colombia</p>
              </div>
            </div>
            <div className="details-cell">
              <div className="details-label">Experience</div>
              <div className="details-value">
                <p>{userData?.experiencia || 'Sin experiencia registrada'}</p>
              </div>
            </div>
            <div className="details-cell">
              <div className="details-label">Correo</div>
              <div className="details-value">
                <p>{userData?.correo || 'Sin correo asignado'}</p>
              </div>
            </div>
            <div className="details-cell">
              <div className="details-label">Fecha de ingreso</div>
              <div className="details-value">
                <p>{formatDate(userData?.fecha_ingreso)}</p>
              </div>
            </div>
            <div className="details-cell">
              <div className="details-label">Area</div>
              <div className="details-value">
                <p>{userData?.area || 'Sin área asignada'}</p>
              </div>
            </div>
            <div className="details-cell">
              <div className="details-label">División</div>
              <div className="details-value">
                <p>{userData?.division || 'Sin división asignada'}</p>
              </div>
            </div>
            <div className="details-cell empty"></div>
          </div>
        </section>
      </main>
    </div>
  );
}
