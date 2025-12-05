import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Escuchar eventos de token expirado
window.addEventListener('token-expired', () => {
  console.log('[Permisos] Token expirado detectado, redirigiendo al login...');
});
import "./index.css";
import Nav from "../components/Nav/Nav.jsx";
import { usuariosAPI, rolesAPI, authService } from "../../services/api.js";

// Verificar que el usuario tenga permisos para acceder
const checkPermissions = () => {
  const user = authService.getUser();
  if (!user) {
    return false;
  }
  const rolTipo = (user.rol_tipo || user.rol?.tipo || '').toLowerCase();
  return rolTipo === 'administrador' || rolTipo === 'tha';
};

export default function Permisos() {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showChangeRoleModal, setShowChangeRoleModal] = useState(false);
  const [showChangeStatusModal, setShowChangeStatusModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Estados para crear usuario
  const [newUserData, setNewUserData] = useState({
    username: '',
    nombre: '',
    correo: '',
    password: '',
    rol: '',
    estado: 'Activo',
    ciudad: '',
    puesto: '',
    experiencia: '',
    fecha_ingreso: '',
    area: '',
    division: ''
  });

  // Estados para cambiar rol
  const [changeRoleData, setChangeRoleData] = useState({
    nuevoRolId: '',
    password: ''
  });

  useEffect(() => {
    // Verificar permisos antes de cargar datos
    const user = authService.getUser();
    if (!user) {
      navigate('/dashboard');
      return;
    }
    const rolTipo = (user.rol_tipo || user.rol?.tipo || '').toLowerCase();
    if (rolTipo !== 'administrador' && rolTipo !== 'tha') {
      alert('No tienes permisos para acceder a esta sección.');
      navigate('/dashboard');
      return;
    }
    loadInitialData();
  }, [navigate]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [usuariosData, rolesData] = await Promise.all([
        usuariosAPI.getAll(),
        rolesAPI.getAll()
      ]);

      // Procesar usuarios
      let usuariosArray = [];
      if (Array.isArray(usuariosData)) {
        usuariosArray = usuariosData;
      } else if (usuariosData?.results) {
        usuariosArray = usuariosData.results;
      } else if (usuariosData?.data) {
        usuariosArray = usuariosData.data;
      }

      // Procesar roles
      let rolesArray = [];
      if (Array.isArray(rolesData)) {
        rolesArray = rolesData;
      } else if (rolesData?.results) {
        rolesArray = rolesData.results;
      } else if (rolesData?.data) {
        rolesArray = rolesData.data;
      }

      setUsuarios(usuariosArray);
      setRoles(rolesArray);

      // Obtener usuario actual - siempre desde la API para tener datos actualizados
      const localUser = authService.getUser();
      console.log('[Permisos] Usuario local desde authService:', localUser);
      
      if (localUser && localUser.id) {
        try {
          const fullUserData = await usuariosAPI.getById(localUser.id);
          console.log('[Permisos] Usuario completo desde API:', fullUserData);
          console.log('[Permisos] Rol del usuario completo:', fullUserData.rol_tipo || fullUserData.rol?.tipo);
          console.log('[Permisos] Rol completo objeto:', fullUserData.rol);
          
          // Verificar que el usuario tenga rol
          if (!fullUserData.rol && !fullUserData.rol_tipo) {
            console.error('[Permisos] ⚠️ El usuario no tiene rol asignado!');
            alert('Tu usuario no tiene un rol asignado. Por favor, contacta al administrador.');
          }
          
          setCurrentUser(fullUserData);
        } catch (error) {
          console.error('[Permisos] Error al obtener usuario completo:', error);
          console.warn('[Permisos] Usando datos locales como fallback');
          setCurrentUser(localUser);
        }
      } else {
        console.warn('[Permisos] No se encontró usuario en localStorage');
        alert('No se pudo identificar tu usuario. Por favor, inicia sesión nuevamente.');
        navigate('/login');
      }
    } catch (error) {
      console.error('[Permisos] Error al cargar datos:', error);
      alert('Error al cargar los datos. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  const handleOpenCreateModal = () => {
    setNewUserData({
      username: '',
      nombre: '',
      correo: '',
      password: '',
      rol: '',
      estado: 'Activo',
      ciudad: '',
      puesto: '',
      experiencia: '',
      fecha_ingreso: '',
      area: '',
      division: ''
    });
    setShowCreateModal(true);
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
  };

  const handleOpenChangeRoleModal = (usuario) => {
    setSelectedUser(usuario);
    setChangeRoleData({
      nuevoRolId: '',
      password: ''
    });
    setShowChangeRoleModal(true);
  };

  const handleCloseChangeRoleModal = () => {
    setShowChangeRoleModal(false);
    setSelectedUser(null);
  };

  const handleOpenChangeStatusModal = (usuario) => {
    setSelectedUser(usuario);
    setShowChangeStatusModal(true);
  };

  const handleCloseChangeStatusModal = () => {
    setShowChangeStatusModal(false);
    setSelectedUser(null);
  };

  const handleChangeStatus = async () => {
    if (!selectedUser) {
      alert('No se ha seleccionado un usuario');
      return;
    }

    const nuevoEstado = selectedUser.estado === 'Activo' ? 'Inactivo' : 'Activo';
    
    if (!window.confirm(`¿Estás seguro de que deseas cambiar el estado de "${selectedUser.nombre || selectedUser.username}" a "${nuevoEstado}"?`)) {
      return;
    }

    try {
      await usuariosAPI.update(selectedUser.id || selectedUser.Id_Usuario, {
        estado: nuevoEstado
      });
      
      alert(`Estado del usuario cambiado a "${nuevoEstado}" exitosamente`);
      handleCloseChangeStatusModal();
      await loadInitialData();
    } catch (error) {
      console.error('[Permisos] Error al cambiar estado:', error);
      let errorMessage = 'Error al cambiar el estado del usuario. Por favor, intenta nuevamente.';
      if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      alert(errorMessage);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    
    if (!newUserData.username || !newUserData.nombre || !newUserData.correo || !newUserData.password || !newUserData.rol) {
      alert('Por favor, complete todos los campos requeridos');
      return;
    }

    // Validar formato de correo electrónico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUserData.correo)) {
      alert('Por favor, ingrese un correo electrónico válido (ejemplo: usuario@dominio.com)');
      return;
    }

    // Verificar permisos antes de intentar crear
    console.log('[Permisos] Usuario actual:', currentUser);
    console.log('[Permisos] Rol del usuario:', currentUser?.rol_tipo || currentUser?.rol?.tipo);
    
    if (!currentUser) {
      alert('No se pudo verificar tu identidad. Por favor, recarga la página.');
      return;
    }

    const rolTipo = currentUser.rol_tipo || currentUser.rol?.tipo || '';
    console.log('[Permisos] Tipo de rol detectado:', rolTipo);
    
    // Verificar que el usuario tenga permisos (Administrador o THA)
    const rolTipoLower = rolTipo.toLowerCase();
    if (rolTipoLower !== 'administrador' && rolTipoLower !== 'tha') {
      alert(`No tienes permisos para crear usuarios. Tu rol actual es: ${rolTipo || 'Sin rol'}`);
      return;
    }

    try {
      const userData = {
        username: newUserData.username,
        nombre: newUserData.nombre,
        correo: newUserData.correo,
        password: newUserData.password,
        rol: parseInt(newUserData.rol),
        estado: newUserData.estado,
        ciudad: newUserData.ciudad || null,
        puesto: newUserData.puesto || null,
        experiencia: newUserData.experiencia || null,
        fecha_ingreso: newUserData.fecha_ingreso || null,
        area: newUserData.area || null,
        division: newUserData.division || null
      };

      console.log('[Permisos] Intentando crear usuario con datos:', { ...userData, password: '***' });
      console.log('[Permisos] Token de autenticación:', authService.getToken() ? 'Presente' : 'Ausente');
      
      // Verificar que el token esté presente
      const token = authService.getToken();
      if (!token) {
        alert('No estás autenticado. Por favor, inicia sesión nuevamente.');
        return;
      }
      
      await usuariosAPI.create(userData);
      alert('Usuario creado exitosamente');
      handleCloseCreateModal();
      await loadInitialData();
    } catch (error) {
      console.error('[Permisos] Error al crear usuario:', error);
      console.error('[Permisos] Error completo:', JSON.stringify(error, null, 2));
      
      let errorMessage = 'Error al crear el usuario. Por favor, intenta nuevamente.';
      
      // Manejar diferentes tipos de errores
      if (error.response) {
        const errorData = error.response;
        
        // Manejar errores de validación de campos
        if (errorData.correo) {
          const correoError = Array.isArray(errorData.correo) ? errorData.correo[0] : errorData.correo;
          errorMessage = `Error en el correo electrónico: ${correoError}`;
        } else if (errorData.username) {
          const usernameError = Array.isArray(errorData.username) ? errorData.username[0] : errorData.username;
          errorMessage = `Error en el nombre de usuario: ${usernameError}`;
        } else if (errorData.password) {
          const passwordError = Array.isArray(errorData.password) ? errorData.password[0] : errorData.password;
          errorMessage = `Error en la contraseña: ${passwordError}`;
        } else if (errorData.rol) {
          const rolError = Array.isArray(errorData.rol) ? errorData.rol[0] : errorData.rol;
          errorMessage = `Error en el rol: ${rolError}`;
        } else if (errorData.detail) {
          errorMessage = `Error: ${errorData.detail}`;
        } else if (errorData.message) {
          errorMessage = `Error: ${errorData.message}`;
        } else if (typeof errorData === 'string') {
          errorMessage = `Error: ${errorData}`;
        } else {
          // Si hay múltiples errores, mostrarlos todos
          const errores = [];
          for (const [campo, mensajes] of Object.entries(errorData)) {
            if (Array.isArray(mensajes)) {
              errores.push(`${campo}: ${mensajes.join(', ')}`);
            } else {
              errores.push(`${campo}: ${mensajes}`);
            }
          }
          if (errores.length > 0) {
            errorMessage = `Errores de validación:\n${errores.join('\n')}`;
          }
        }
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      // Verificar si es un error de permisos
      if (errorMessage.includes('permission') || errorMessage.includes('permiso') || errorMessage.includes('You do not have permission')) {
        errorMessage = 'No tienes permisos para crear usuarios. Solo los administradores y THA pueden realizar esta acción.';
      }
      
      alert(errorMessage);
    }
  };

  const handleChangeRole = async (e) => {
    e.preventDefault();
    
    if (!changeRoleData.nuevoRolId || !changeRoleData.password) {
      alert('Por favor, complete todos los campos requeridos');
      return;
    }

    if (!selectedUser) {
      alert('No se ha seleccionado un usuario');
      return;
    }

    // Verificar que el usuario actual tenga permisos
    const currentUserRol = (currentUser?.rol_tipo || currentUser?.rol?.tipo || '').toLowerCase();
    const nuevoRol = roles.find(r => r.id === parseInt(changeRoleData.nuevoRolId) || r.id_rol === parseInt(changeRoleData.nuevoRolId));
    const nuevoRolTipo = (nuevoRol?.tipo || '').toLowerCase();

    // Validar permisos
    if (currentUserRol === 'tha') {
      if (nuevoRolTipo === 'administrador') {
        alert('No tienes permisos para asignar el rol de Administrador');
        return;
      }
    }

    try {
      // Verificar que el token esté presente y válido antes de continuar
      const token = authService.getToken();
      if (!token) {
        alert('No estás autenticado. Por favor, inicia sesión nuevamente.');
        navigate('/login');
        return;
      }

      // Verificar que el token sea válido antes de continuar
      try {
        const tokenVerification = await authService.verifyToken();
        if (!tokenVerification || !tokenVerification.valido) {
          alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
          navigate('/login');
          return;
        }
        console.log('[Permisos] Token verificado correctamente, continuando con cambio de rol...');
      } catch (verifyTokenError) {
        console.error('[Permisos] Error al verificar token:', verifyTokenError);
        alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
        navigate('/login');
        return;
      }

      // Verificar contraseña intentando hacer login
      try {
        // Usar la misma URL base que la API
        const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
        const verifyResponse = await fetch(`${BASE_URL}/auth/login/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: currentUser.username,
            password: changeRoleData.password
          })
        });

        if (!verifyResponse.ok) {
          alert('Contraseña incorrecta. Por favor, verifica tu contraseña.');
          return;
        }
      } catch (verifyError) {
        alert('Error al verificar la contraseña. Por favor, intenta nuevamente.');
        return;
      }

      // Solicitar token de verificación
      const verifResponse = await usuariosAPI.solicitarVerificacionRol(
        selectedUser.id || selectedUser.Id_Usuario,
        parseInt(changeRoleData.nuevoRolId)
      );

      // Cambiar el rol
      await usuariosAPI.cambiarRol(
        selectedUser.id || selectedUser.Id_Usuario,
        selectedUser.id || selectedUser.Id_Usuario,
        parseInt(changeRoleData.nuevoRolId),
        verifResponse.token_verificacion
      );

      alert('Rol cambiado exitosamente');
      handleCloseChangeRoleModal();
      await loadInitialData();
    } catch (error) {
      console.error('[Permisos] Error al cambiar rol:', error);
      
      // Si el error es por token expirado, redirigir al login
      if (error.isTokenExpired || (error.message && error.message.includes('expirado'))) {
        alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
        navigate('/login');
        return;
      }
      
      let errorMessage = 'Error al cambiar el rol. Por favor, intenta nuevamente.';
      if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      // Si el error viene de la respuesta HTTP
      if (error.response) {
        const errorData = error.response;
        if (errorData.detail) {
          errorMessage = `Error: ${errorData.detail}`;
        } else if (errorData.message) {
          errorMessage = `Error: ${errorData.message}`;
        }
      }
      
      alert(errorMessage);
    }
  };

  // Obtener roles disponibles según el usuario actual
  const getAvailableRoles = () => {
    if (!currentUser) return roles;
    
    const currentUserRol = (currentUser.rol_tipo || currentUser.rol?.tipo || '').toLowerCase();
    
    if (currentUserRol === 'administrador') {
      return roles; // Administrador puede cambiar a cualquier rol
    } else if (currentUserRol === 'tha') {
      return roles.filter(r => {
        const rolTipo = (r.tipo || '').toLowerCase();
        return rolTipo === 'tha' || rolTipo === 'usuario';
      });
    }
    
    return [];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No especificada';
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    } catch (error) {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="permisos-container">
        <Nav />
        <main className="permisos-content">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p>Cargando información...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="permisos-container">
      <Nav />
      <main className="permisos-content">
        <div className="permisos-header">
          <h1 className="permisos-title">Gestión de Permisos</h1>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={handleRefresh} 
              className={`refresh-button ${refreshing ? 'rotating' : ''}`}
              disabled={refreshing}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path 
                  d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" 
                  fill="currentColor"
                />
              </svg>
              {refreshing ? 'Actualizando...' : 'Actualizar'}
            </button>
            <button onClick={handleOpenCreateModal} className="create-user-button">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z" fill="currentColor"/>
              </svg>
              Crear Usuario
            </button>
          </div>
        </div>

        <div className="usuarios-table-container">
          <table className="usuarios-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Usuario</th>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Puesto</th>
                <th>Área</th>
                <th>División</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '2rem' }}>
                    No hay usuarios registrados
                  </td>
                </tr>
              ) : (
                usuarios.map((usuario) => (
                  <tr key={usuario.id || usuario.Id_Usuario}>
                    <td>{usuario.id || usuario.Id_Usuario}</td>
                    <td>{usuario.username || usuario.Username}</td>
                    <td>{usuario.nombre || usuario.Nombre}</td>
                    <td>{usuario.correo || usuario.Correo}</td>
                    <td>
                      <span className={`role-badge role-${(usuario.rol_tipo || usuario.rol?.tipo || '').toLowerCase()}`}>
                        {usuario.rol_tipo || usuario.rol?.tipo || 'Sin rol'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge status-${(usuario.estado || 'Inactivo').toLowerCase()}`}>
                        {usuario.estado || 'Inactivo'}
                      </span>
                    </td>
                    <td>{usuario.puesto || 'Sin puesto'}</td>
                    <td>{usuario.area || 'Sin área'}</td>
                    <td>{usuario.division || 'Sin división'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button 
                          className="change-role-button"
                          onClick={() => handleOpenChangeRoleModal(usuario)}
                        >
                          Cambiar Rol
                        </button>
                        <button 
                          className={`change-status-button ${(usuario.estado || 'Inactivo').toLowerCase() === 'activo' ? 'status-active' : 'status-inactive'}`}
                          onClick={() => handleOpenChangeStatusModal(usuario)}
                        >
                          {usuario.estado === 'Activo' ? 'Desactivar' : 'Activar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Modal para crear usuario */}
        {showCreateModal && (
          <div className="modal-overlay" onClick={handleCloseCreateModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Crear Nuevo Usuario</h2>
                <button className="modal-close" onClick={handleCloseCreateModal}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="#666"/>
                  </svg>
                </button>
              </div>
              <form onSubmit={handleCreateUser} className="modal-form">
                <div className="form-group">
                  <label>Usuario (username) *</label>
                  <input
                    type="text"
                    value={newUserData.username}
                    onChange={(e) => setNewUserData(prev => ({ ...prev, username: e.target.value }))}
                    required
                    placeholder="Nombre de usuario"
                  />
                </div>
                <div className="form-group">
                  <label>Nombre completo *</label>
                  <input
                    type="text"
                    value={newUserData.nombre}
                    onChange={(e) => setNewUserData(prev => ({ ...prev, nombre: e.target.value }))}
                    required
                    placeholder="Nombre completo"
                  />
                </div>
                <div className="form-group">
                  <label>Correo electrónico *</label>
                  <input
                    type="email"
                    value={newUserData.correo}
                    onChange={(e) => setNewUserData(prev => ({ ...prev, correo: e.target.value }))}
                    required
                    placeholder="correo@ejemplo.com"
                  />
                </div>
                <div className="form-group">
                  <label>Contraseña *</label>
                  <input
                    type="password"
                    value={newUserData.password}
                    onChange={(e) => setNewUserData(prev => ({ ...prev, password: e.target.value }))}
                    required
                    placeholder="Contraseña"
                  />
                </div>
                <div className="form-group">
                  <label>Rol *</label>
                  <select
                    value={newUserData.rol}
                    onChange={(e) => setNewUserData(prev => ({ ...prev, rol: e.target.value }))}
                    required
                  >
                    <option value="">Seleccione un rol...</option>
                    {roles.map((rol) => (
                      <option key={rol.id || rol.id_rol} value={rol.id || rol.id_rol}>
                        {rol.tipo || rol.Tipo}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Estado</label>
                  <select
                    value={newUserData.estado}
                    onChange={(e) => setNewUserData(prev => ({ ...prev, estado: e.target.value }))}
                  >
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Ciudad</label>
                  <input
                    type="text"
                    value={newUserData.ciudad}
                    onChange={(e) => setNewUserData(prev => ({ ...prev, ciudad: e.target.value }))}
                    placeholder="Ciudad"
                  />
                </div>
                <div className="form-group">
                  <label>Puesto</label>
                  <input
                    type="text"
                    value={newUserData.puesto}
                    onChange={(e) => setNewUserData(prev => ({ ...prev, puesto: e.target.value }))}
                    placeholder="Puesto de trabajo"
                  />
                </div>
                <div className="form-group">
                  <label>Experiencia</label>
                  <textarea
                    value={newUserData.experiencia}
                    onChange={(e) => setNewUserData(prev => ({ ...prev, experiencia: e.target.value }))}
                    rows="3"
                    placeholder="Experiencia laboral"
                  />
                </div>
                <div className="form-group">
                  <label>Fecha de ingreso</label>
                  <input
                    type="date"
                    value={newUserData.fecha_ingreso}
                    onChange={(e) => setNewUserData(prev => ({ ...prev, fecha_ingreso: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>Área</label>
                  <input
                    type="text"
                    value={newUserData.area}
                    onChange={(e) => setNewUserData(prev => ({ ...prev, area: e.target.value }))}
                    placeholder="Área de trabajo"
                  />
                </div>
                <div className="form-group">
                  <label>División</label>
                  <input
                    type="text"
                    value={newUserData.division}
                    onChange={(e) => setNewUserData(prev => ({ ...prev, division: e.target.value }))}
                    placeholder="División"
                  />
                </div>
                <div className="modal-actions">
                  <button type="button" className="modal-cancel" onClick={handleCloseCreateModal}>
                    Cancelar
                  </button>
                  <button type="submit" className="modal-submit">
                    Crear Usuario
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal para cambiar rol */}
        {showChangeRoleModal && selectedUser && (
          <div className="modal-overlay" onClick={handleCloseChangeRoleModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Cambiar Rol de Usuario</h2>
                <button className="modal-close" onClick={handleCloseChangeRoleModal}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="#666"/>
                  </svg>
                </button>
              </div>
              <div className="modal-form">
                <div className="form-group">
                  <label>Usuario:</label>
                  <p style={{ fontWeight: 'bold', fontSize: '16px', color: '#333' }}>
                    {selectedUser.nombre || selectedUser.Nombre} ({selectedUser.username || selectedUser.Username})
                  </p>
                </div>
                <div className="form-group">
                  <label>Rol actual:</label>
                  <p style={{ fontSize: '14px', color: '#666' }}>
                    {selectedUser.rol_tipo || selectedUser.rol?.tipo || 'Sin rol'}
                  </p>
                </div>
                <div className="form-group">
                  <label>Nuevo rol *</label>
                  <select
                    value={changeRoleData.nuevoRolId}
                    onChange={(e) => setChangeRoleData(prev => ({ ...prev, nuevoRolId: e.target.value }))}
                    required
                  >
                    <option value="">Seleccione un rol...</option>
                    {getAvailableRoles().map((rol) => (
                      <option key={rol.id || rol.id_rol} value={rol.id || rol.id_rol}>
                        {rol.tipo || rol.Tipo}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Confirma tu contraseña *</label>
                  <input
                    type="password"
                    value={changeRoleData.password}
                    onChange={(e) => setChangeRoleData(prev => ({ ...prev, password: e.target.value }))}
                    required
                    placeholder="Ingresa tu contraseña para confirmar"
                  />
                  <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                    Debes ingresar tu contraseña para confirmar el cambio de rol
                  </p>
                </div>
                <div className="modal-actions">
                  <button type="button" className="modal-cancel" onClick={handleCloseChangeRoleModal}>
                    Cancelar
                  </button>
                  <button type="button" className="modal-submit" onClick={handleChangeRole}>
                    Cambiar Rol
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal para cambiar estado del usuario */}
        {showChangeStatusModal && selectedUser && (
          <div className="modal-overlay" onClick={handleCloseChangeStatusModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Cambiar Estado de Usuario</h2>
                <button className="modal-close" onClick={handleCloseChangeStatusModal}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="#666"/>
                  </svg>
                </button>
              </div>
              <div className="modal-form">
                <div className="form-group">
                  <label>Usuario:</label>
                  <p style={{ fontWeight: 'bold', fontSize: '16px', color: '#333' }}>
                    {selectedUser.nombre || selectedUser.Nombre} ({selectedUser.username || selectedUser.Username})
                  </p>
                </div>
                <div className="form-group">
                  <label>Estado actual:</label>
                  <p style={{ fontSize: '14px', color: '#666' }}>
                    <span className={`status-badge status-${(selectedUser.estado || 'Inactivo').toLowerCase()}`}>
                      {selectedUser.estado || 'Inactivo'}
                    </span>
                  </p>
                </div>
                <div className="form-group">
                  <label>Nuevo estado:</label>
                  <p style={{ fontSize: '14px', color: '#666', fontWeight: 'bold' }}>
                    <span className={`status-badge status-${(selectedUser.estado === 'Activo' ? 'Inactivo' : 'Activo').toLowerCase()}`}>
                      {selectedUser.estado === 'Activo' ? 'Inactivo' : 'Activo'}
                    </span>
                  </p>
                  {selectedUser.estado === 'Activo' && (
                    <p style={{ fontSize: '12px', color: '#dc2626', marginTop: '8px' }}>
                      ⚠️ Si desactivas este usuario, no podrá acceder al sistema hasta que sea reactivado.
                    </p>
                  )}
                </div>
                <div className="modal-actions">
                  <button type="button" className="modal-cancel" onClick={handleCloseChangeStatusModal}>
                    Cancelar
                  </button>
                  <button type="button" className="modal-submit" onClick={handleChangeStatus}>
                    Confirmar Cambio
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

