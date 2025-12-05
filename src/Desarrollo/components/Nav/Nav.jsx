import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import "./Nav.css";
import maajiLogo from "../../../Imagenes/Login/maaji.png";
import user from "../../../Imagenes/Perfil/user.png";
import notificacion from "../../../Imagenes/Perfil/campana.jpg";
import { authService, alertasAPI, casosAPI } from "../../../services/api.js";

export default function Nav({ showNotification = false }) {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [canAccessPermisos, setCanAccessPermisos] = useState(false);

  // Verificar permisos del usuario actual
  useEffect(() => {
    const user = authService.getUser();
    if (user) {
      setCurrentUser(user);
      const rolTipo = (user.rol_tipo || user.rol?.tipo || '').toLowerCase();
      // Solo Administrador y THA pueden acceder a Permisos
      setCanAccessPermisos(rolTipo === 'administrador' || rolTipo === 'tha');
    }
  }, []);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [lastCheckedCases, setLastCheckedCases] = useState([]);
  const [lastCasesState, setLastCasesState] = useState({}); // Guardar estado anterior de casos { casoId: { estado, fechaCierre } }
  const [viewedNotifications, setViewedNotifications] = useState(new Set()); // IDs de notificaciones vistas
  const notificationRef = useRef(null);

  // Cargar notificaciones vistas desde localStorage
  useEffect(() => {
    const savedViewed = localStorage.getItem('viewedNotifications');
    if (savedViewed) {
      try {
        const viewedArray = JSON.parse(savedViewed);
        setViewedNotifications(new Set(viewedArray));
      } catch (error) {
        console.warn('[Nav] Error al cargar notificaciones vistas:', error);
      }
    }
  }, []);

  // Cargar notificaciones
  const loadNotifications = async () => {
    try {
      const token = authService.getToken();
      if (!token) {
        console.log('[Nav] No hay token, no se cargarán notificaciones');
        setNotifications([]);
        return;
      }

      console.log('[Nav] Cargando notificaciones...');

      // Intentar cargar datos directamente sin verificar token primero
      // (la API manejará la autenticación)
      const [alertasData, casosData] = await Promise.all([
        alertasAPI.getAll().catch(err => {
          // Silenciar errores de token expirado para no mostrar errores en consola
          if (err.message && err.message.includes('expirado')) {
            console.warn('[Nav] Token expirado al cargar alertas, omitiendo...');
            return [];
          }
          console.warn('[Nav] Error al cargar alertas:', err);
          return [];
        }),
        casosAPI.getAll().catch(err => {
          // Silenciar errores de token expirado para no mostrar errores en consola
          if (err.message && err.message.includes('expirado')) {
            console.warn('[Nav] Token expirado al cargar casos, omitiendo...');
            return [];
          }
          console.warn('[Nav] Error al cargar casos:', err);
          return [];
        })
      ]);

      console.log('[Nav] Datos recibidos - Alertas:', alertasData?.length || 0, 'Casos:', casosData?.length || 0);

      // Procesar alertas
      let alertasArray = [];
      if (Array.isArray(alertasData)) {
        alertasArray = alertasData;
      } else if (alertasData?.results) {
        alertasArray = alertasData.results;
      } else if (alertasData?.data) {
        alertasArray = alertasData.data;
      }

      console.log('[Nav] Alertas procesadas:', alertasArray.length);

      // Procesar casos
      let casosArray = [];
      if (Array.isArray(casosData)) {
        casosArray = casosData;
      } else if (casosData?.results) {
        casosArray = casosData.results;
      } else if (casosData?.data) {
        casosArray = casosData.data;
      }

      console.log('[Nav] Casos procesados:', casosArray.length);

      const nuevasNotificaciones = [];

      // 1. Alertas próximas a vencer (1 día o menos)
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      alertasArray.forEach(alerta => {
        if (alerta.fecha_vencimiento) {
          const fechaVencimiento = new Date(alerta.fecha_vencimiento);
          fechaVencimiento.setHours(0, 0, 0, 0);
          
          const diasRestantes = Math.ceil((fechaVencimiento - hoy) / (1000 * 60 * 60 * 24));
          
          if (diasRestantes <= 1 && diasRestantes >= 0 && alerta.estado !== 'vencida') {
            nuevasNotificaciones.push({
              id: `alerta-${alerta.id || alerta.Id_Alerta}`,
              tipo: 'alerta_vencimiento',
              titulo: alerta.titulo || 'Alerta próxima a vencer',
              mensaje: diasRestantes === 0 
                ? `La alerta "${alerta.titulo || 'Sin título'}" vence hoy`
                : `La alerta "${alerta.titulo || 'Sin título'}" vence mañana`,
              fecha: alerta.fecha_vencimiento,
              casoId: alerta.caso || alerta.Id_Caso,
              prioridad: 'alta'
            });
          }
        }
      });

      // 2. Alertas vencidas
      let alertasVencidas = 0;
      alertasArray.forEach(alerta => {
        const estadoAlerta = (alerta.estado || '').toLowerCase();
        if (alerta.fecha_vencimiento && estadoAlerta === 'pendiente') {
          const fechaVencimiento = new Date(alerta.fecha_vencimiento);
          fechaVencimiento.setHours(0, 0, 0, 0);
          
          if (fechaVencimiento < hoy) {
            alertasVencidas++;
            nuevasNotificaciones.push({
              id: `alerta-vencida-${alerta.id || alerta.Id_Alerta}`,
              tipo: 'alerta_vencida',
              titulo: alerta.titulo || 'Alerta vencida',
              mensaje: `La alerta "${alerta.titulo || 'Sin título'}" ha vencido`,
              fecha: alerta.fecha_vencimiento,
              casoId: alerta.caso || alerta.Id_Caso,
              prioridad: 'urgente'
            });
          }
        }
      });
      console.log('[Nav] Alertas vencidas:', alertasVencidas);

      // 3. Casos nuevos (creados en las últimas 24 horas)
      const casosActualesIds = casosArray.map(c => c.id || c.Id_Caso);
      const ultimas24Horas = new Date();
      ultimas24Horas.setHours(ultimas24Horas.getHours() - 24);

      casosArray.forEach(caso => {
        const casoId = caso.id || caso.Id_Caso;
        const fechaInicio = caso.fecha_inicio || caso.Fecha_Inicio;
        const estadoCaso = (caso.estado || '').toLowerCase();
        const estaAbierto = estadoCaso === 'abierto' || estadoCaso === 'pendiente';
        
        // Verificar si es un caso nuevo (creado en las últimas 24 horas)
        if (fechaInicio && estaAbierto) {
          const fechaInicioDate = new Date(fechaInicio);
          const esReciente = fechaInicioDate >= ultimas24Horas;
          const esNuevo = !lastCheckedCases.includes(casoId);
          
          if (esReciente || esNuevo) {
            // Evitar duplicados
            const yaExiste = nuevasNotificaciones.some(n => n.id === `caso-nuevo-${casoId}`);
            if (!yaExiste) {
              nuevasNotificaciones.push({
                id: `caso-nuevo-${casoId}`,
                tipo: 'caso_nuevo',
                titulo: 'Nuevo caso creado',
                mensaje: `Se ha creado un nuevo caso: "${caso.diagnostico || caso.Diagnostico || 'Sin título'}"`,
                fecha: fechaInicio,
                casoId: casoId,
                empleadoNombre: caso.empleado_nombre || caso.empleado?.nombre,
                prioridad: 'media'
              });
            }
          }
        }
      });

      // 4. Casos cerrados recientemente (últimas 24 horas o que cambiaron de estado)
      const ayer = new Date();
      ayer.setDate(ayer.getDate() - 1);
      ayer.setHours(0, 0, 0, 0);

      // Crear mapa del estado actual de casos
      const casosActualesState = {};
      casosArray.forEach(caso => {
        const casoId = caso.id || caso.Id_Caso;
        casosActualesState[casoId] = {
          estado: (caso.estado || '').toLowerCase(),
          fechaCierre: caso.fecha_cierre || caso.Fecha_Cierre
        };
      });

      let casosCerradosCount = 0;
      casosArray.forEach(caso => {
        const casoId = caso.id || caso.Id_Caso;
        const estadoCaso = (caso.estado || '').toLowerCase();
        const fechaCierre = caso.fecha_cierre || caso.Fecha_Cierre;
        
        // Verificar si el caso está cerrado
        const estaCerrado = estadoCaso === 'cerrado';
        
        if (estaCerrado && fechaCierre) {
          const fechaCierreDate = new Date(fechaCierre);
          fechaCierreDate.setHours(0, 0, 0, 0);
          
          // Verificar si se cerró en las últimas 24 horas
          const seCerroRecientemente = fechaCierreDate >= ayer;
          
          // Verificar si cambió de estado (estaba abierto/pendiente antes y ahora está cerrado)
          const casoAnterior = lastCasesState[casoId];
          const cambioEstado = casoAnterior && 
            (casoAnterior.estado === 'abierto' || casoAnterior.estado === 'pendiente') &&
            estadoCaso === 'cerrado' &&
            (!casoAnterior.fechaCierre || casoAnterior.fechaCierre !== fechaCierre);
          
          // Solo notificar si se cerró recientemente O si cambió de estado
          if (seCerroRecientemente || cambioEstado) {
            // Evitar duplicados verificando si ya existe esta notificación
            const yaExiste = nuevasNotificaciones.some(n => n.id === `caso-cerrado-${casoId}`);
            
            if (!yaExiste) {
              casosCerradosCount++;
              nuevasNotificaciones.push({
                id: `caso-cerrado-${casoId}`,
                tipo: 'caso_cerrado',
                titulo: 'Caso cerrado',
                mensaje: `El caso "${caso.diagnostico || caso.Diagnostico || 'Sin título'}" ha sido cerrado`,
                fecha: fechaCierre,
                casoId: casoId,
                empleadoNombre: caso.empleado_nombre || caso.empleado?.nombre,
                prioridad: 'baja'
              });
            }
          }
        }
      });
      console.log('[Nav] Casos cerrados detectados:', casosCerradosCount);

      // 5. Casos pendientes o abiertos cerca de su fecha límite (1 día antes)
      // Buscar alertas asociadas a casos abiertos/pendientes que están próximas a vencer
      casosArray.forEach(caso => {
        const casoId = caso.id || caso.Id_Caso;
        const estadoCaso = (caso.estado || '').toLowerCase();
        const estaAbiertoOPendiente = estadoCaso === 'abierto' || estadoCaso === 'pendiente';
        
        if (estaAbiertoOPendiente) {
          // Buscar alertas asociadas a este caso que están próximas a vencer
          const alertasDelCaso = alertasArray.filter(alerta => {
            const alertaCasoId = alerta.caso || alerta.Id_Caso;
            return alertaCasoId === casoId;
          });

          alertasDelCaso.forEach(alerta => {
            if (alerta.fecha_vencimiento) {
              const fechaVencimiento = new Date(alerta.fecha_vencimiento);
              fechaVencimiento.setHours(0, 0, 0, 0);
              
              const diasRestantes = Math.ceil((fechaVencimiento - hoy) / (1000 * 60 * 60 * 24));
              
              // Notificar si la alerta vence en 1 día o menos y el caso está abierto/pendiente
              if (diasRestantes <= 1 && diasRestantes >= 0 && alerta.estado !== 'vencida') {
                const yaExiste = nuevasNotificaciones.some(n => 
                  n.id === `caso-fecha-limite-${casoId}-${alerta.id || alerta.Id_Alerta}`
                );
                
                if (!yaExiste) {
                  nuevasNotificaciones.push({
                    id: `caso-fecha-limite-${casoId}-${alerta.id || alerta.Id_Alerta}`,
                    tipo: 'caso_fecha_limite',
                    titulo: `Caso ${estadoCaso === 'pendiente' ? 'pendiente' : 'abierto'} cerca de fecha límite`,
                    mensaje: `El caso "${caso.diagnostico || caso.Diagnostico || 'Sin título'}" tiene una alerta que vence ${diasRestantes === 0 ? 'hoy' : 'mañana'}`,
                    fecha: alerta.fecha_vencimiento,
                    casoId: casoId,
                    empleadoNombre: caso.empleado_nombre || caso.empleado?.nombre,
                    prioridad: diasRestantes === 0 ? 'urgente' : 'alta'
                  });
                }
              }
            }
          });
        }
      });

      // Actualizar el estado de casos para la próxima verificación
      setLastCasesState(casosActualesState);

      // Ordenar por prioridad y fecha
      nuevasNotificaciones.sort((a, b) => {
        const prioridadOrder = { 'urgente': 0, 'alta': 1, 'media': 2, 'baja': 3 };
        if (prioridadOrder[a.prioridad] !== prioridadOrder[b.prioridad]) {
          return prioridadOrder[a.prioridad] - prioridadOrder[b.prioridad];
        }
        return new Date(b.fecha) - new Date(a.fecha);
      });

      console.log('[Nav] Notificaciones generadas:', nuevasNotificaciones.length);
      nuevasNotificaciones.forEach((notif, index) => {
        console.log(`[Nav] Notificación ${index + 1}:`, notif.tipo, '-', notif.titulo);
      });

      // Limpiar notificaciones vistas que ya no existen (para evitar acumulación en localStorage)
      const nuevasNotificacionesIds = new Set(nuevasNotificaciones.map(n => n.id));
      const viewedCleaned = new Set(
        Array.from(viewedNotifications).filter(id => nuevasNotificacionesIds.has(id))
      );
      
      // Si se limpiaron notificaciones vistas, actualizar el estado y localStorage
      if (viewedCleaned.size !== viewedNotifications.size) {
        setViewedNotifications(viewedCleaned);
        try {
          localStorage.setItem('viewedNotifications', JSON.stringify(Array.from(viewedCleaned)));
        } catch (error) {
          console.warn('[Nav] Error al limpiar notificaciones vistas:', error);
        }
      }

      setNotifications(nuevasNotificaciones);
      setLastCheckedCases(casosActualesIds);
    } catch (error) {
      // Silenciar errores de token expirado para no mostrar errores en consola
      if (error.message && (error.message.includes('expirado') || error.message.includes('Token expirado'))) {
        console.log('[Nav] Token expirado, no se cargarán notificaciones');
        setNotifications([]);
        return;
      }
      // Solo mostrar errores que no sean de autenticación
      if (error.status !== 401 && !error.isTokenExpired) {
        console.error('[Nav] Error al cargar notificaciones:', error);
      }
      setNotifications([]);
    }
  };

  // Cargar notificaciones al montar y actualizar frecuentemente
  useEffect(() => {
    // Cargar inmediatamente
    loadNotifications();
    
    // Actualizar cada 10 segundos (más frecuente para tiempo real)
    const interval = setInterval(loadNotifications, 10000);
    
    // Actualizar cuando la ventana recupera el foco
    const handleFocus = () => {
      console.log('[Nav] Ventana recuperó el foco, actualizando notificaciones...');
      loadNotifications();
    };
    
    // Actualizar cuando la página se hace visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('[Nav] Página visible, actualizando notificaciones...');
        loadNotifications();
      }
    };
    
    // Escuchar eventos personalizados de cambios en casos
    const handleCaseChange = () => {
      console.log('[Nav] Evento de cambio de caso detectado, actualizando notificaciones...');
      loadNotifications();
    };
    
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('caso-creado', handleCaseChange);
    window.addEventListener('caso-cerrado', handleCaseChange);
    window.addEventListener('caso-actualizado', handleCaseChange);
    window.addEventListener('alerta-creada', handleCaseChange);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('caso-creado', handleCaseChange);
      window.removeEventListener('caso-cerrado', handleCaseChange);
      window.removeEventListener('caso-actualizado', handleCaseChange);
      window.removeEventListener('alerta-creada', handleCaseChange);
    };
  }, []);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtrar notificaciones no vistas para el contador y la lista
  const unreadNotifications = notifications.filter(notif => !viewedNotifications.has(notif.id));

  const handleNotificationClick = (notificacion) => {
    // Marcar notificación como vista
    const newViewed = new Set(viewedNotifications);
    newViewed.add(notificacion.id);
    setViewedNotifications(newViewed);
    
    // Guardar en localStorage para persistencia
    try {
      localStorage.setItem('viewedNotifications', JSON.stringify(Array.from(newViewed)));
      console.log('[Nav] Notificación marcada como vista:', notificacion.id);
    } catch (error) {
      console.warn('[Nav] Error al guardar notificaciones vistas:', error);
    }

    // Navegar al caso si tiene casoId
    if (notificacion.casoId) {
      navigate(`/cases`);
      setShowNotifications(false);
    }
  };

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
        {canAccessPermisos && (
          <Link to="/permisos">Permisos</Link>
        )}
        <div className="nav-notification-container" ref={notificationRef}>
          <button 
            className="nav-notification-icon" 
            onClick={() => setShowNotifications(!showNotifications)}
            style={{ position: 'relative' }}
          >
            <img src={notificacion} alt="Notification" className="nav-icon" />
            {unreadNotifications.length > 0 && (
              <span className="notification-badge">{unreadNotifications.length}</span>
            )}
          </button>
          
          {showNotifications && (
            <div className="notification-dropdown">
              <div className="notification-header">
                <h3>Notificaciones</h3>
                {unreadNotifications.length === 0 && (
                  <p className="no-notifications">
                    {notifications.length === 0 ? 'No hay notificaciones' : 'No hay notificaciones nuevas'}
                  </p>
                )}
              </div>
              <div className="notification-list">
                {unreadNotifications.length === 0 && notifications.length > 0 && (
                  <div style={{ padding: '1rem', textAlign: 'center', color: '#666', fontSize: '0.875rem' }}>
                    Todas las notificaciones han sido vistas
                  </div>
                )}
                {unreadNotifications.map((notif) => (
                  <div 
                    key={notif.id} 
                    className={`notification-item ${notif.prioridad}`}
                    onClick={() => handleNotificationClick(notif)}
                  >
                    <div className="notification-icon">
                      {notif.tipo === 'alerta_vencida' && '⚠️'}
                      {notif.tipo === 'alerta_vencimiento' && '⏰'}
                      {notif.tipo === 'caso_nuevo' && '🆕'}
                      {notif.tipo === 'caso_cerrado' && '✅'}
                      {notif.tipo === 'caso_fecha_limite' && '📅'}
                    </div>
                    <div className="notification-content">
                      <p className="notification-title">{notif.titulo}</p>
                      <p className="notification-message">{notif.mensaje}</p>
                      {notif.fecha && (
                        <p className="notification-date">
                          {new Date(notif.fecha).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
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

