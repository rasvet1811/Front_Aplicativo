import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./archivos.css";
import Nav from "../components/Nav/Nav.jsx";
import { empleadosAPI, carpetasAPI } from "../../services/api.js";

export default function Archivos() {
  const navigate = useNavigate();
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderData, setNewFolderData] = useState({
    empleadoId: "",
    nombreCarpeta: "",
    personName: "",
    area: ""
  });
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allEmployees, setAllEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [showEmployeeList, setShowEmployeeList] = useState(false);
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState("");

  const sidebarFolders = [
    { id: 1, name: "Medicina" },
    { id: 2, name: "Permisos" },
    { id: 3, name: "Despidos" },
    { id: 4, name: "Contratos" },
    { id: 5, name: "Documentos importantes" },
  ];

  // Cargar empleados al montar el componente
  useEffect(() => {
    loadEmpleados();
  }, []);

  // Cargar todos los empleados cuando se abre el modal
  useEffect(() => {
    if (showNewFolderModal) {
      loadAllEmployees();
    }
  }, [showNewFolderModal]);

  // Cerrar la lista de empleados al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showEmployeeList && !event.target.closest('.employee-search-container')) {
        setShowEmployeeList(false);
      }
    };

    if (showEmployeeList) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showEmployeeList]);

  const loadEmpleados = async () => {
    try {
      setLoading(true);
      console.log('[Archivos] Cargando carpetas...');
      
      // Cargar todas las carpetas de todos los empleados
      const carpetasData = await carpetasAPI.getAll();
      console.log('[Archivos] Respuesta de carpetas API:', carpetasData);
      console.log('[Archivos] Tipo de datos:', typeof carpetasData, Array.isArray(carpetasData));
      
      const carpetasArray = Array.isArray(carpetasData) ? carpetasData : (carpetasData.results || []);
      console.log('[Archivos] Carpetas extraídas:', carpetasArray.length);
      
      // Cargar empleados para obtener información adicional
      const empleadosData = await empleadosAPI.getAll();
      const empleadosArray = Array.isArray(empleadosData) ? empleadosData : (empleadosData.results || []);
      console.log('[Archivos] Empleados cargados:', empleadosArray.length);
      
      // Crear un mapa de empleados por ID para acceso rápido
      const empleadosMap = {};
      empleadosArray.forEach(emp => {
        const id = emp.id || emp.Id_Empleado;
        empleadosMap[id] = emp;
      });
      
      // Mapear carpetas con información del empleado
      const mappedFolders = carpetasArray.map(carpeta => {
        const empleadoId = carpeta.empleado || carpeta.Id_Empleado || carpeta.empleado_id;
        const empleado = empleadosMap[empleadoId] || {};
        
        console.log('[Archivos] Procesando carpeta:', carpeta, 'Empleado ID:', empleadoId, 'Empleado:', empleado);
        
        return {
          id: carpeta.id || carpeta.Id_Carpeta,
          carpetaId: carpeta.id || carpeta.Id_Carpeta,
          empleadoId: empleadoId,
          personName: `${empleado.nombre || empleado.Nombre || ''} ${empleado.apellido || empleado.Apellido || ''}`.trim() || 'Empleado desconocido',
          area: empleado.area || empleado.Area || empleado.division || empleado.Division || 'Sin área',
          nombreCarpeta: carpeta.nombre || carpeta.Nombre || 'Sin nombre',
          fechaCreacion: carpeta.fecha_creacion || carpeta.Fecha_Creacion
        };
      });
      
      console.log('[Archivos] Carpetas mapeadas:', mappedFolders);
      setFolders(mappedFolders);
      
      // Si no hay carpetas, mostrar empleados como alternativa
      if (mappedFolders.length === 0) {
        console.log('[Archivos] No hay carpetas, mostrando empleados como alternativa...');
        const mappedEmpleados = empleadosArray.map(emp => ({
          id: emp.id || emp.Id_Empleado,
          personName: `${emp.nombre || emp.Nombre || ''} ${emp.apellido || emp.Apellido || ''}`.trim(),
          area: emp.area || emp.Area || emp.division || emp.Division || 'Sin área'
        }));
        setFolders(mappedEmpleados);
      }
    } catch (error) {
      console.error('[Archivos] Error al cargar carpetas:', error);
      console.error('[Archivos] Detalles del error:', {
        message: error.message,
        stack: error.stack
      });
      
      // Si falla, cargar solo empleados como respaldo
      try {
        console.log('[Archivos] Intentando cargar empleados como respaldo...');
        const data = await empleadosAPI.getAll();
        const empleadosArray = Array.isArray(data) ? data : (data.results || []);
        const mappedFolders = empleadosArray.map(emp => ({
          id: emp.id || emp.Id_Empleado,
          personName: `${emp.nombre || emp.Nombre || ''} ${emp.apellido || emp.Apellido || ''}`.trim(),
          area: emp.area || emp.Area || emp.division || emp.Division || 'Sin área'
        }));
        console.log('[Archivos] Empleados cargados como respaldo:', mappedFolders.length);
        setFolders(mappedFolders);
      } catch (err) {
        console.error('[Archivos] Error al cargar empleados como respaldo:', err);
        setFolders([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFolderClick = (folder) => {
    // Si tiene empleadoId, navegar a la vista de carpetas del empleado
    if (folder.empleadoId) {
      navigate("/documents/folder", { state: { empleadoId: folder.empleadoId } });
    } else {
      // Si es solo un ID (compatibilidad con formato anterior), usarlo como empleadoId
      navigate("/documents/folder", { state: { empleadoId: folder.id || folder } });
    }
  };

  const handleNewDocument = () => {
    navigate("/documents/form");
  };

  const handleNewFolderClick = () => {
    setShowNewFolderModal(true);
  };

  const loadAllEmployees = async () => {
    try {
      setLoadingEmployees(true);
      const data = await empleadosAPI.getAll();
      const employeesArray = Array.isArray(data) ? data : (data.results || []);
      setAllEmployees(employeesArray);
    } catch (error) {
      console.error('Error al cargar empleados:', error);
      setAllEmployees([]);
    } finally {
      setLoadingEmployees(false);
    }
  };

  const handleCloseNewFolderModal = () => {
    setShowNewFolderModal(false);
    setNewFolderData({
      empleadoId: "",
      nombreCarpeta: "",
      personName: "",
      area: ""
    });
    setEmployeeSearchTerm("");
    setShowEmployeeList(false);
  };

  const handleNewFolderInputChange = (e) => {
    const { name, value } = e.target;
    setNewFolderData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEmployeeSearch = (value) => {
    setEmployeeSearchTerm(value);
    setShowEmployeeList(value.length > 0);
  };

  const handleEmployeeSelect = (employee) => {
    const empleadoId = employee.id || employee.Id_Empleado;
    const nombre = employee.nombre || employee.Nombre || '';
    const apellido = employee.apellido || employee.Apellido || '';
    const area = employee.area || employee.Area || employee.division || employee.Division || 'Sin área';
    
    setNewFolderData(prev => ({
      ...prev,
      empleadoId: empleadoId,
      personName: `${nombre} ${apellido}`.trim(),
      area: area
    }));
    setEmployeeSearchTerm(`${nombre} ${apellido}`.trim());
    setShowEmployeeList(false);
  };

  const filteredEmployees = allEmployees.filter(emp => {
    if (!employeeSearchTerm) return false;
    const nombre = (emp.nombre || emp.Nombre || '').toLowerCase();
    const apellido = (emp.apellido || emp.Apellido || '').toLowerCase();
    const searchLower = employeeSearchTerm.toLowerCase();
    return nombre.includes(searchLower) || 
           apellido.includes(searchLower) ||
           `${nombre} ${apellido}`.includes(searchLower);
  });

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!newFolderData.empleadoId) {
      alert('Por favor, selecciona un empleado');
      return;
    }
    if (!newFolderData.nombreCarpeta || !newFolderData.nombreCarpeta.trim()) {
      alert('Por favor, ingresa un nombre para la carpeta');
      return;
    }

    try {
      const carpetaData = {
        empleado: parseInt(newFolderData.empleadoId),
        nombre: newFolderData.nombreCarpeta.trim()
      };

      const nuevaCarpeta = await carpetasAPI.create(carpetaData);
      
      // Cerrar el modal
      handleCloseNewFolderModal();
      
      // Agregar la nueva carpeta a la lista visible inmediatamente
      const carpetaCreada = {
        id: nuevaCarpeta.id || nuevaCarpeta.Id_Carpeta,
        carpetaId: nuevaCarpeta.id || nuevaCarpeta.Id_Carpeta,
        empleadoId: parseInt(newFolderData.empleadoId),
        personName: newFolderData.personName,
        area: newFolderData.area,
        nombreCarpeta: nuevaCarpeta.nombre || nuevaCarpeta.Nombre || newFolderData.nombreCarpeta.trim(),
        fechaCreacion: nuevaCarpeta.fecha_creacion || nuevaCarpeta.Fecha_Creacion || new Date().toISOString().split('T')[0]
      };
      
      // Agregar la nueva carpeta al inicio de la lista
      setFolders(prevFolders => [carpetaCreada, ...prevFolders]);
      
      alert('Carpeta creada exitosamente');
    } catch (error) {
      console.error('Error al crear carpeta:', error);
      alert('Error al crear la carpeta. Por favor, intenta nuevamente.');
    }
  };

  return (
    <div className="archivos-container">
      <Nav />
      <main className="archivos-main-content">
        <div className="archivos-content-wrapper">
          <aside className="archivos-sidebar">
            <h2 className="sidebar-title">Agrupación</h2>
            <div className="sidebar-folders-list">
              {sidebarFolders.map((folder) => (
                <div 
                  key={folder.id} 
                  className="sidebar-folder-item"
                  onClick={() => handleFolderClick(folder.id)}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="sidebar-folder-icon">
                    <path d="M10 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V8C22 6.9 21.1 6 20 6H12L10 4Z" fill="#9CA3AF"/>
                  </svg>
                  <span className="sidebar-folder-name">{folder.name}</span>
                </div>
              ))}
            </div>
          </aside>

          <div className="archivos-main-panel">
            <div className="archivos-header">
            <h1 className="archivos-title">Documents</h1>
            <div className="new-button-container">
              <button 
                className="new-button"
                onClick={handleNewDocument}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z" fill="currentColor"/>
                </svg>
                New
              </button>
            </div>
          </div>

          <div className="new-folder-area" onClick={handleNewFolderClick}>
            <div className="new-folder-card">
              <div className="folder-icon-plus">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V8C22 6.9 21.1 6 20 6H12L10 4Z" fill="#9CA3AF"/>
                </svg>
                <div className="plus-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z" fill="#fff"/>
                  </svg>
                </div>
              </div>
              <p className="new-folder-text">New folder</p>
            </div>
          </div>

          <div className="folders-list">
            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center' }}>
                <p>Cargando carpetas...</p>
              </div>
            ) : folders.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center' }}>
                <p style={{ marginBottom: '1rem', color: '#666' }}>
                  No hay carpetas disponibles.
                </p>
                <p style={{ fontSize: '0.875rem', color: '#999' }}>
                  Haz clic en "New folder" para crear una nueva carpeta y organizar tus documentos.
                </p>
              </div>
            ) : (
              folders.map((folder) => (
                <div 
                  key={folder.id || folder.carpetaId} 
                  className="folder-item"
                  onClick={() => handleFolderClick(folder)}
                >
                  <div className="folder-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V8C22 6.9 21.1 6 20 6H12L10 4Z" fill="#9CA3AF"/>
                    </svg>
                  </div>
                  <div className="folder-info">
                    <p className="folder-person-name">
                      {folder.nombreCarpeta || folder.personName}
                    </p>
                    <p className="folder-area">
                      {folder.personName && folder.nombreCarpeta ? folder.personName : folder.area}
                    </p>
                    {folder.nombreCarpeta && folder.personName && (
                      <p style={{ fontSize: '0.75rem', color: '#999', marginTop: '0.25rem' }}>
                        {folder.area}
                      </p>
                    )}
                  </div>
                  <div className="folder-arrow">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M7 10L12 15L17 10H7Z" fill="#666"/>
                    </svg>
                  </div>
                </div>
              ))
            )}
          </div>
          </div>
        </div>
      </main>

      {/* Modal para crear nueva carpeta */}
      {showNewFolderModal && (
        <div className="modal-overlay" onClick={handleCloseNewFolderModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Crear Nueva Carpeta</h2>
              <button className="modal-close" onClick={handleCloseNewFolderModal}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="#666"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreateFolder} className="modal-form">
              <div className="form-group">
                <label>Empleado *</label>
                <div className="employee-search-container" style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={employeeSearchTerm}
                    onChange={(e) => handleEmployeeSearch(e.target.value)}
                    onFocus={() => {
                      if (employeeSearchTerm || allEmployees.length > 0) {
                        setShowEmployeeList(true);
                      }
                    }}
                    placeholder="Buscar empleado..."
                    required
                    style={{ width: '100%' }}
                  />
                  {showEmployeeList && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      maxHeight: '200px',
                      overflowY: 'auto',
                      backgroundColor: '#fff',
                      border: '1px solid #ccc',
                      borderRadius: '6px',
                      marginTop: '4px',
                      zIndex: 1000,
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                    }}>
                      {loadingEmployees ? (
                        <div style={{ padding: '1rem', textAlign: 'center' }}>
                          <p>Cargando empleados...</p>
                        </div>
                      ) : filteredEmployees.length === 0 ? (
                        <div style={{ padding: '1rem', textAlign: 'center' }}>
                          <p>No se encontraron empleados</p>
                        </div>
                      ) : (
                        filteredEmployees.map((emp) => {
                          const nombre = emp.nombre || emp.Nombre || '';
                          const apellido = emp.apellido || emp.Apellido || '';
                          const nombreCompleto = `${nombre} ${apellido}`.trim();
                          return (
                            <div
                              key={emp.id || emp.Id_Empleado}
                              onClick={() => handleEmployeeSelect(emp)}
                              style={{
                                padding: '0.75rem',
                                cursor: 'pointer',
                                borderBottom: '1px solid #eee',
                                transition: 'background-color 0.2s'
                              }}
                              onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                              onMouseLeave={(e) => e.target.style.backgroundColor = '#fff'}
                            >
                              <div style={{ fontWeight: 600, color: '#333' }}>{nombreCompleto}</div>
                              <div style={{ fontSize: '0.875rem', color: '#666' }}>
                                {emp.area || emp.Area || emp.division || emp.Division || 'Sin área'}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
                {newFolderData.personName && (
                  <div style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: '#f3f4f6', borderRadius: '4px' }}>
                    <div style={{ fontSize: '0.875rem', color: '#666' }}>
                      <strong>Empleado seleccionado:</strong> {newFolderData.personName}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#666' }}>
                      <strong>Área:</strong> {newFolderData.area}
                    </div>
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>Nombre de la carpeta *</label>
                <input
                  type="text"
                  name="nombreCarpeta"
                  value={newFolderData.nombreCarpeta}
                  onChange={handleNewFolderInputChange}
                  required
                  placeholder="Ej: Documentos médicos, Permisos, etc."
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="modal-cancel" onClick={handleCloseNewFolderModal}>
                  Cancelar
                </button>
                <button type="submit" className="modal-submit">
                  Crear Carpeta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

