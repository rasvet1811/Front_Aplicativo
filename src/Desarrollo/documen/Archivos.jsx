import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./archivos.css";
import Nav from "../components/Nav/Nav.jsx";
import { empleadosAPI } from "../../services/api.js";

export default function Archivos() {
  const navigate = useNavigate();
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderData, setNewFolderData] = useState({
    personName: "",
    area: ""
  });
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const loadEmpleados = async () => {
    try {
      setLoading(true);
      const data = await empleadosAPI.getAll();
      // Mapear empleados al formato de carpetas
      const mappedFolders = data.map(emp => ({
        id: emp.id || emp.Id_Empleado,
        personName: `${emp.nombre || emp.Nombre || ''} ${emp.apellido || emp.Apellido || ''}`.trim(),
        area: emp.area || emp.Area || emp.division || emp.Division || 'Sin área'
      }));
      setFolders(mappedFolders);
    } catch (error) {
      console.error('Error al cargar empleados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFolderClick = (folderId) => {
    navigate("/documents/folder", { state: { empleadoId: folderId } });
  };

  const handleNewDocument = () => {
    navigate("/documents/form");
  };

  const handleNewFolderClick = () => {
    setShowNewFolderModal(true);
  };

  const handleCloseNewFolderModal = () => {
    setShowNewFolderModal(false);
    setNewFolderData({
      personName: "",
      area: ""
    });
  };

  const handleNewFolderInputChange = (e) => {
    const { name, value } = e.target;
    setNewFolderData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!newFolderData.personName || !newFolderData.area) {
      alert('Por favor, complete todos los campos');
      return;
    }

    try {
      // Separar nombre y apellido
      const nameParts = newFolderData.personName.trim().split(' ');
      const nombre = nameParts[0] || '';
      const apellido = nameParts.slice(1).join(' ') || '';

      const empleadoData = {
        nombre: nombre,
        apellido: apellido,
        area: newFolderData.area,
        estado: 'Activo',
        cargo: 'Sin especificar',
        division: newFolderData.area
      };

      await empleadosAPI.create(empleadoData);
      
      // Recargar empleados desde el backend
      await loadEmpleados();
      handleCloseNewFolderModal();
    } catch (error) {
      console.error('Error al crear empleado:', error);
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
            {folders.map((folder) => (
              <div 
                key={folder.id} 
                className="folder-item"
                onClick={() => handleFolderClick(folder.id)}
              >
                <div className="folder-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V8C22 6.9 21.1 6 20 6H12L10 4Z" fill="#9CA3AF"/>
                  </svg>
                </div>
                <div className="folder-info">
                  <p className="folder-person-name">{folder.personName}</p>
                  <p className="folder-area">{folder.area}</p>
                </div>
                <div className="folder-arrow">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7 10L12 15L17 10H7Z" fill="#666"/>
                  </svg>
                </div>
              </div>
            ))}
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
                <label>Nombre *</label>
                <input
                  type="text"
                  name="personName"
                  value={newFolderData.personName}
                  onChange={handleNewFolderInputChange}
                  required
                  placeholder="Nombre de la persona"
                />
              </div>
              <div className="form-group">
                <label>Área *</label>
                <input
                  type="text"
                  name="area"
                  value={newFolderData.area}
                  onChange={handleNewFolderInputChange}
                  required
                  placeholder="Área de trabajo"
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

