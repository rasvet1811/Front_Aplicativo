import { useState, useRef, useEffect } from "react";
import "./index.css";
import Nav from "../components/Nav/Nav.jsx";
import { casosAPI, empleadosAPI, usuariosAPI } from "../../services/api.js";

export default function Cases() {
  const [selectedDate, setSelectedDate] = useState("");
  const dateInputRef = useRef(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState(""); // "A-Z", "Z-A", or letter filter
  const [statusFilter, setStatusFilter] = useState(""); // "Pendiente", "Terminado", ""
  const [dateFilter, setDateFilter] = useState(""); // Date filter for finished cases
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [empleados, setEmpleados] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showChangeStatusModal, setShowChangeStatusModal] = useState(false);
  const [statusChangeData, setStatusChangeData] = useState({
    nuevoEstado: '',
    motivo: ''
  });

  // Estados para el formulario
  const [formData, setFormData] = useState({
    title: '',
    personName: '',
    createdAt: '',
    endDate: '',
    requestInfo: '',
    responsable: ''
  });

  const createdAtRef = useRef(null);
  const endDateRef = useRef(null);

  // Cargar casos, empleados y usuarios al montar el componente
  useEffect(() => {
    console.log('[Cases] Componente montado, cargando datos iniciales...');
    const loadInitialData = async () => {
      try {
        await Promise.all([
          loadCases(),
          loadEmpleados(),
          loadUsuarios()
        ]);
        console.log('[Cases] Datos iniciales cargados correctamente');
      } catch (error) {
        console.error('[Cases] Error al cargar datos iniciales:', error);
      }
    };
    loadInitialData();
  }, []);

  // Actualizar datos automáticamente cada 30 segundos
  useEffect(() => {
    const intervalId = setInterval(() => {
      console.log('[Cases] Actualización automática de datos...');
      loadCases(true); // Mostrar indicador de actualización
      loadEmpleados();
      loadUsuarios();
    }, 30000); // 30 segundos

    // Limpiar el intervalo cuando el componente se desmonte
    return () => clearInterval(intervalId);
  }, []);

  // Función para refrescar manualmente
  const handleRefresh = async () => {
    console.log('[Cases] Refrescando datos manualmente...');
    setRefreshing(true);
    try {
      await Promise.all([
        loadCases(true),
        loadEmpleados(),
        loadUsuarios()
      ]);
    } catch (error) {
      console.error('[Cases] Error al refrescar:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Refrescar datos cuando la ventana vuelve a tener foco
  useEffect(() => {
    const handleFocus = () => {
      console.log('[Cases] Ventana recuperó el foco, refrescando datos...');
      loadCases();
      loadEmpleados();
      loadUsuarios();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Refrescar datos cuando se abre el modal
  useEffect(() => {
    if (showModal) {
      console.log('[Cases] Modal abierto, refrescando usuarios y empleados...');
      loadEmpleados();
      loadUsuarios();
    }
  }, [showModal]);

  const loadCases = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const data = await casosAPI.getAll();
      console.log('[Cases] Casos recibidos (raw):', data);
      
      // Asegurar que siempre sea un array
      let casosArray = [];
      if (Array.isArray(data)) {
        casosArray = data;
      } else if (data && typeof data === 'object') {
        // Intentar extraer el array de diferentes formatos
        if (Array.isArray(data.results)) {
          casosArray = data.results;
        } else if (Array.isArray(data.data)) {
          casosArray = data.data;
        } else {
          // Si es un objeto único, convertirlo a array
          casosArray = [data];
        }
      }
      
      console.log('[Cases] Casos procesados (array):', casosArray);
      
      // Mapear datos del backend al formato del frontend
      const mappedCases = casosArray.map(caso => ({
        id: caso.id || caso.Id_Caso,
        caseType: caso.diagnostico || caso.Diagnostico || 'Sin título',
        entityName: caso.empleado_nombre || caso.empleado?.nombre || 'Sin empleado',
        status: mapStatusToFrontend(caso.estado || caso.Estado),
        createdAt: caso.fecha_inicio || caso.Fecha_Inicio || '',
        endDate: caso.fecha_cierre || caso.Fecha_Cierre || '',
        requestInfo: caso.observaciones || caso.Observaciones || caso.diagnostico || caso.Diagnostico || '',
        empleadoId: caso.empleado || caso.Id_Empleado,
        tipoFuero: caso.tipo_fuero || caso.Tipo_Fuero,
        responsable: caso.responsable || caso.Responsable,
        responsableNombre: caso.responsable_nombre || caso.responsable?.nombre || 'Sin responsable asignado'
      }));
      setCases(mappedCases);
    } catch (error) {
      console.error('Error al cargar casos:', error);
      // Mantener casos por defecto si hay error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadEmpleados = async () => {
    try {
      console.log('[Cases] Iniciando carga de empleados...');
      const data = await empleadosAPI.getAll();
      console.log('[Cases] Empleados recibidos (raw):', data);
      console.log('[Cases] Tipo de datos:', typeof data, 'Es array?', Array.isArray(data));
      
      // Asegurar que siempre sea un array
      let empleadosArray = [];
      if (Array.isArray(data)) {
        empleadosArray = data;
        console.log('[Cases] Los datos ya son un array');
      } else if (data && typeof data === 'object') {
        console.log('[Cases] Los datos son un objeto, buscando array dentro...');
        console.log('[Cases] Keys del objeto:', Object.keys(data));
        // Intentar extraer el array de diferentes formatos
        if (Array.isArray(data.results)) {
          empleadosArray = data.results;
          console.log('[Cases] Array encontrado en data.results');
        } else if (Array.isArray(data.data)) {
          empleadosArray = data.data;
          console.log('[Cases] Array encontrado en data.data');
        } else if (Array.isArray(data.empleados)) {
          empleadosArray = data.empleados;
          console.log('[Cases] Array encontrado en data.empleados');
        } else {
          // Buscar cualquier propiedad que sea un array
          for (const key in data) {
            if (Array.isArray(data[key])) {
              empleadosArray = data[key];
              console.log('[Cases] Array encontrado en propiedad:', key);
              break;
            }
          }
          // Si no se encontró ningún array, intentar convertir el objeto a array
          if (empleadosArray.length === 0 && data !== null) {
            console.warn('[Cases] No se encontró array, el objeto completo:', data);
          }
        }
      } else if (data === null || data === undefined) {
        console.warn('[Cases] Los datos son null o undefined');
        empleadosArray = [];
      }
      
      console.log('[Cases] Empleados procesados (array):', empleadosArray);
      console.log('[Cases] Cantidad de empleados:', empleadosArray.length);
      
      if (empleadosArray.length === 0) {
        console.warn('[Cases] ⚠️ No se encontraron empleados. Verifica la conexión con el servidor.');
      }
      
      setEmpleados(empleadosArray);
    } catch (error) {
      console.error('[Cases] ❌ Error al cargar empleados:', error);
      console.error('[Cases] Detalles del error:', error.message);
      if (error.stack) {
        console.error('[Cases] Stack trace:', error.stack);
      }
      setEmpleados([]); // Asegurar que siempre sea un array vacío en caso de error
    }
  };

  const loadUsuarios = async () => {
    try {
      console.log('[Cases] Iniciando carga de usuarios...');
      const data = await usuariosAPI.getAll();
      console.log('[Cases] Respuesta completa de la API:', data);
      console.log('[Cases] Tipo de datos:', typeof data, 'Es array?', Array.isArray(data));
      
      if (!data) {
        console.error('[Cases] No se recibieron datos de la API');
        setUsuarios([]);
        return;
      }
      
      // Manejar diferentes formatos de respuesta
      let usuariosArray = [];
      if (Array.isArray(data)) {
        usuariosArray = data;
      } else if (data.results && Array.isArray(data.results)) {
        usuariosArray = data.results;
      } else if (data.data && Array.isArray(data.data)) {
        usuariosArray = data.data;
      } else {
        console.error('[Cases] Formato de datos no reconocido:', data);
        setUsuarios([]);
        return;
      }
      
      console.log('[Cases] Total de usuarios recibidos:', usuariosArray.length);
      console.log('[Cases] Primer usuario (ejemplo):', usuariosArray[0]);
      
      // Filtrar usuarios que sean solo THA o Usuario
      const usuariosFiltrados = usuariosArray.filter(user => {
        if (!user) {
          console.warn('[Cases] Usuario nulo o indefinido encontrado');
          return false;
        }
        
        // Obtener el tipo de rol de diferentes formas posibles
        let rolTipo = '';
        
        // Prioridad 1: rol_tipo (viene del serializer)
        if (user.rol_tipo) {
          rolTipo = String(user.rol_tipo);
        }
        // Prioridad 2: rol como objeto con tipo
        else if (user.rol) {
          if (typeof user.rol === 'object' && user.rol.tipo) {
            rolTipo = String(user.rol.tipo);
          } else if (typeof user.rol === 'string' || typeof user.rol === 'number') {
            rolTipo = String(user.rol);
          }
        }
        
        // Normalizar el rol
        const rolTipoNormalizado = rolTipo.toLowerCase().trim();
        const nombreUsuario = user.nombre || user.username || 'Sin nombre';
        const userId = user.id || user.Id_Usuario;
        
        // Log detallado para debugging
        console.log('[Cases] Analizando usuario:', {
          id: userId,
          nombre: nombreUsuario,
          rolTipoOriginal: rolTipo,
          rolTipoNormalizado: rolTipoNormalizado,
          tieneRolTipo: !!user.rol_tipo,
          tieneRol: !!user.rol,
          rolCompleto: user.rol,
          userKeys: Object.keys(user)
        });
        
        // Verificar si el rol es THA o Usuario
        // Comparar de forma flexible pero precisa
        const esTHA = rolTipoNormalizado === 'tha' || 
                     rolTipoNormalizado.includes('tha');
        const esUsuario = rolTipoNormalizado === 'usuario' || 
                         rolTipoNormalizado.includes('usuario');
        
        const cumpleFiltro = esTHA || esUsuario;
        
        if (cumpleFiltro) {
          console.log('[Cases] ✓ Usuario ACEPTADO:', nombreUsuario, 'Rol:', rolTipoNormalizado);
        } else {
          console.log('[Cases] ✗ Usuario RECHAZADO:', nombreUsuario, 'Rol:', rolTipoNormalizado);
        }
        
        return cumpleFiltro;
      });
      
      console.log('[Cases] ========================================');
      console.log('[Cases] Usuarios filtrados (THA/Usuario):', usuariosFiltrados);
      console.log('[Cases] Cantidad de usuarios filtrados:', usuariosFiltrados.length);
      console.log('[Cases] ========================================');
      
      // Asegurar que cada usuario tenga un ID válido
      const usuariosConId = usuariosFiltrados.filter(user => {
        const userId = user.id || user.Id_Usuario;
        if (!userId) {
          console.warn('[Cases] ⚠️ Usuario sin ID válido:', user);
          return false;
        }
        return true;
      });
      
      console.log('[Cases] Usuarios con ID válido:', usuariosConId.length);
      setUsuarios(usuariosConId);
      
      if (usuariosConId.length === 0) {
        console.warn('[Cases] ⚠️ No se encontraron usuarios con rol THA o Usuario');
        console.warn('[Cases] Todos los usuarios recibidos:', usuariosArray.map(u => ({
          nombre: u.nombre || u.username,
          rol: u.rol_tipo || u.rol?.tipo || u.rol
        })));
      }
    } catch (error) {
      console.error('[Cases] ❌ Error al cargar usuarios:', error);
      console.error('[Cases] Error completo:', error.message);
      if (error.stack) {
        console.error('[Cases] Stack trace:', error.stack);
      }
      setUsuarios([]);
    }
  };

  const mapStatusToFrontend = (backendStatus) => {
    // El backend ahora usa estados en minúsculas: 'pendiente', 'abierto', 'cerrado'
    const statusMap = {
      'abierto': 'Abierto',
      'cerrado': 'Terminado',
      'pendiente': 'Pendiente',
      // Compatibilidad con valores antiguos (por si acaso)
      'Abierto': 'Abierto',
      'Cerrado': 'Terminado',
      'Pendiente': 'Pendiente',
    };
    const statusNormalizado = (backendStatus || '').toLowerCase();
    return statusMap[statusNormalizado] || statusMap[backendStatus] || 'Abierto';
  };

  const mapStatusToBackend = (frontendStatus) => {
    // Mapear estados del frontend a los estados del backend (en minúsculas)
    const statusMap = {
      'Pendiente': 'pendiente',
      'Abierto': 'abierto',
      'Terminado': 'cerrado',
      'In progrest': 'pendiente',
    };
    return statusMap[frontendStatus] || 'abierto';
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}-${month}-${year}`;
  };

  const handleCalendarIconClick = () => {
    if (dateInputRef.current) {
      if (dateInputRef.current.showPicker) {
        dateInputRef.current.showPicker();
      } else {
        dateInputRef.current.click();
      }
    }
  };

  const handleDateChange = (event) => {
    const dateValue = event.target.value;
    if (dateValue) {
      const date = new Date(dateValue);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = String(date.getFullYear()).slice(-2);
      const formattedDate = `${day}-${month}-${year}`;
      setSelectedDate(formattedDate);
      setDateFilter(dateValue);
    } else {
      setSelectedDate("");
      setDateFilter("");
    }
  };

  // Filtrar y ordenar casos
  const getFilteredAndSortedCases = () => {
    let filtered = [...cases];

    // Filtro de búsqueda (por nombre o título)
    if (searchTerm) {
      filtered = filtered.filter(c => 
        c.entityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.caseType.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por estado
    if (statusFilter) {
      filtered = filtered.filter(c => c.status === statusFilter);
    }

    // Filtro por fecha (solo para casos terminados)
    if (dateFilter) {
      filtered = filtered.filter(c => 
        c.status === 'Terminado' && c.endDate === dateFilter
      );
    }

    // Ordenamiento
    if (sortOrder === "A-Z") {
      filtered.sort((a, b) => a.caseType.localeCompare(b.caseType));
    } else if (sortOrder === "Z-A") {
      filtered.sort((a, b) => b.caseType.localeCompare(a.caseType));
    } else if (sortOrder && sortOrder.length === 1) {
      // Filtrar por letra específica
      filtered = filtered.filter(c => 
        c.caseType.charAt(0).toUpperCase() === sortOrder.toUpperCase()
      );
    }

    return filtered;
  };

  const handleSortClick = () => {
    if (sortOrder === "") {
      setSortOrder("A-Z");
    } else if (sortOrder === "A-Z") {
      setSortOrder("Z-A");
    } else {
      setSortOrder("");
    }
  };

  const handleStatusFilterClick = () => {
    if (statusFilter === "") {
      setStatusFilter("Abierto");
    } else if (statusFilter === "Abierto") {
      setStatusFilter("Pendiente");
    } else if (statusFilter === "Pendiente") {
      setStatusFilter("Terminado");
    } else {
      setStatusFilter("");
    }
  };

  const handleLetterClick = (letter) => {
    if (sortOrder === letter) {
      setSortOrder("A-Z"); // Si ya está seleccionada, volver a A-Z
    } else {
      setSortOrder(letter);
    }
  };

  const filteredCases = getFilteredAndSortedCases();

  const handleOpenModal = () => {
    const today = new Date().toISOString().split('T')[0];
    setFormData({
      title: '',
      personName: '',
      createdAt: today,
      endDate: '',
      requestInfo: '',
      responsable: ''
    });
    // Refrescar datos cuando se abre el modal para tener la información más actualizada
    console.log('[Cases] Abriendo modal, refrescando datos...');
    loadEmpleados();
    loadUsuarios();
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({
      title: '',
      personName: '',
      createdAt: '',
      endDate: '',
      requestInfo: '',
      responsable: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateClick = (ref) => {
    if (ref.current) {
      if (ref.current.showPicker) {
        ref.current.showPicker();
      } else {
        ref.current.click();
      }
    }
  };

  const handleSubmitCase = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.personName || !formData.createdAt || !formData.requestInfo || !formData.responsable) {
      alert('Por favor, complete todos los campos requeridos');
      return;
    }

    try {
      // Validar que empleados sea un array
      if (!Array.isArray(empleados)) {
        console.error('[Cases] Error: empleados no es un array:', empleados);
        console.error('[Cases] Tipo de empleados:', typeof empleados);
        alert('Error: No se pudieron cargar los empleados. Por favor, recarga la página o intenta nuevamente.');
        return;
      }

      if (empleados.length === 0) {
        console.warn('[Cases] Advertencia: No hay empleados cargados. Intentando recargar...');
        // Intentar recargar empleados una vez más
        await loadEmpleados();
        
        // Si después de recargar sigue vacío, mostrar error
        if (empleados.length === 0) {
          alert('Error: No hay empleados disponibles en la base de datos. Por favor, verifica que haya empleados registrados o contacta al administrador.');
          return;
        }
      }

      // Buscar el empleado por nombre
      const empleado = empleados.find(emp => {
        if (!emp) return false;
        const nombreCompleto = `${emp.nombre || emp.Nombre || ''} ${emp.apellido || emp.Apellido || ''}`.trim();
        const nombreSolo = emp.nombre || emp.Nombre || '';
        const nombreBuscado = formData.personName.trim();
        return nombreCompleto.toLowerCase() === nombreBuscado.toLowerCase() || 
               nombreSolo.toLowerCase() === nombreBuscado.toLowerCase();
      });

      if (!empleado) {
        console.error('[Cases] Empleado no encontrado. Nombre buscado:', formData.personName);
        console.error('[Cases] Empleados disponibles:', empleados.map(e => ({
          nombre: e?.nombre || e?.Nombre,
          apellido: e?.apellido || e?.Apellido,
          id: e?.id || e?.Id_Empleado
        })));
        alert(`Empleado "${formData.personName}" no encontrado. Por favor, verifique el nombre o seleccione uno de la lista si está disponible.`);
        return;
      }

      // Obtener el ID del empleado - según el serializer del backend, viene como 'id'
      const empleadoId = empleado.id || empleado.Id_Empleado || empleado.id_empleado;
      
      if (!empleadoId) {
        console.error('[Cases] Empleado encontrado pero sin ID válido:', empleado);
        alert('Error: El empleado seleccionado no tiene un ID válido.');
        return;
      }

      console.log('[Cases] Empleado encontrado:', {
        nombre: empleado.nombre || empleado.Nombre,
        apellido: empleado.apellido || empleado.Apellido,
        id: empleadoId,
        empleadoCompleto: empleado
      });

      // Validar que se haya seleccionado un responsable
      if (!formData.responsable) {
        alert('Por favor, seleccione un responsable para el caso.');
        return;
      }

      const responsableId = parseInt(formData.responsable);
      
      if (isNaN(responsableId)) {
        console.error('[Cases] Responsable ID inválido:', formData.responsable);
        alert('Error: El responsable seleccionado no es válido.');
        return;
      }

      console.log('[Cases] Creando caso con:', {
        empleadoId: empleadoId,
        responsableId: responsableId,
        empleadoIdTipo: typeof empleadoId,
        responsableIdTipo: typeof responsableId
      });

      // Asegurar que el empleadoId sea un número
      const empleadoIdNum = parseInt(empleadoId);
      if (isNaN(empleadoIdNum)) {
        console.error('[Cases] Error: empleadoId no es un número válido:', empleadoId);
        alert('Error: El ID del empleado no es válido.');
        return;
      }

      const casoData = {
        empleado: empleadoIdNum, // Asegurar que sea un número entero (requerido)
        tipo_fuero: formData.title || null, // Opcional
        diagnostico: formData.requestInfo || null, // Opcional
        estado: 'abierto', // Estado en minúsculas según el modelo del backend (opcional, default: "abierto")
        observaciones: formData.requestInfo || null, // Opcional
        responsable: responsableId // ID del usuario responsable (opcional, si no se envía se asigna automáticamente)
        // fecha_inicio NO se envía porque es read-only y se genera automáticamente
      };

      console.log('[Cases] Datos del caso a crear:', casoData);
      const response = await casosAPI.create(casoData);
      console.log('[Cases] Respuesta del servidor:', response);
      
      // Recargar todos los datos desde el backend
      console.log('[Cases] Caso creado exitosamente, refrescando datos...');
      await Promise.all([
        loadCases(),
        loadEmpleados(),
        loadUsuarios()
      ]);
      
      alert('Caso creado exitosamente');
      
      // Disparar evento personalizado para actualizar notificaciones
      window.dispatchEvent(new CustomEvent('caso-creado', { 
        detail: { casoId: response.id || response.Id_Caso } 
      }));
      
      handleCloseModal();
    } catch (error) {
      console.error('[Cases] Error al crear caso:', error);
      console.error('[Cases] Detalles del error:', error.message);
      
      // Mostrar mensaje de error más específico
      let errorMessage = 'Error al crear el caso. Por favor, intenta nuevamente.';
      if (error.message) {
        if (error.message.includes('empleado')) {
          errorMessage = 'Error: El empleado seleccionado no es válido.';
        } else if (error.message.includes('responsable')) {
          errorMessage = 'Error: El responsable seleccionado no es válido.';
        } else if (error.message.includes('400')) {
          errorMessage = 'Error: Datos inválidos. Verifica que todos los campos estén correctos.';
        } else if (error.message.includes('401')) {
          errorMessage = 'Error: Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }
      
      alert(errorMessage);
    }
  };

  const handleCaseClick = (caseItem) => {
    setSelectedCase(caseItem);
  };

  const handleCloseDetails = () => {
    setSelectedCase(null);
  };

  const handleOpenChangeStatusModal = () => {
    // Prevenir abrir el modal si el caso está terminado
    if (selectedCase && selectedCase.status === 'Terminado') {
      alert('No se puede cambiar el estado de un caso terminado.');
      return;
    }
    setStatusChangeData({
      nuevoEstado: '',
      motivo: ''
    });
    setShowChangeStatusModal(true);
  };

  const handleCloseChangeStatusModal = () => {
    setShowChangeStatusModal(false);
    setStatusChangeData({
      nuevoEstado: '',
      motivo: ''
    });
  };

  const handleChangeStatus = async () => {
    if (!selectedCase) return;

    // Prevenir cambios si el caso está terminado
    if (selectedCase.status === 'Terminado') {
      alert('No se puede cambiar el estado de un caso terminado.');
      handleCloseChangeStatusModal();
      return;
    }

    const { nuevoEstado, motivo } = statusChangeData;

    if (!nuevoEstado) {
      alert('Por favor, seleccione un nuevo estado.');
      return;
    }

    // Mapear el estado del frontend al backend (minúsculas)
    const estadoMap = {
      'Pendiente': 'pendiente',
      'Abierto': 'abierto',
      'Terminado': 'cerrado'
    };
    const estadoBackend = estadoMap[nuevoEstado] || 'abierto';

    // Si el nuevo estado es "pendiente" o "cerrado", el motivo es requerido
    if ((estadoBackend === 'pendiente' || estadoBackend === 'cerrado') && !motivo.trim()) {
      alert('Por favor, ingrese el motivo del cambio de estado.');
      return;
    }

    try {
      const casoId = selectedCase.id;
      
      // Preparar los datos para actualizar
      const updateData = {
        estado: estadoBackend
      };

      // Si hay motivo, agregarlo a las observaciones
      let nuevasObservaciones = null;
      if (motivo.trim()) {
        // Obtener las observaciones actuales del caso desde el backend
        let observacionesActuales = '';
        try {
          const casoActual = await casosAPI.getById(casoId);
          observacionesActuales = casoActual.observaciones || selectedCase.requestInfo || '';
        } catch (error) {
          console.warn('[Cases] No se pudieron obtener las observaciones actuales, usando las del estado local:', error);
          observacionesActuales = selectedCase.requestInfo || '';
        }
        
        const fechaCambio = new Date().toLocaleDateString('es-ES', { 
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
        const nuevaObservacion = `[Cambio de estado a ${nuevoEstado} - ${fechaCambio}]: ${motivo}`;
        nuevasObservaciones = observacionesActuales 
          ? `${observacionesActuales}\n\n${nuevaObservacion}`
          : nuevaObservacion;
        updateData.observaciones = nuevasObservaciones;
      }

      console.log('[Cases] Cambiando estado del caso:', {
        casoId,
        nuevoEstadoFrontend: nuevoEstado,
        nuevoEstadoBackend: estadoBackend,
        updateData
      });

      // Según la documentación, PUT/PATCH solo requiere los campos que se quieren actualizar
      // Si el estado es "cerrado", el backend actualiza automáticamente la fecha_cierre
      // Usar PATCH para actualizaciones parciales (más apropiado que PUT)
      const datosActualizacion = {
        estado: estadoBackend
      };

      // Si hay motivo, agregar las observaciones
      if (nuevasObservaciones) {
        datosActualizacion.observaciones = nuevasObservaciones;
      }

      // Usar PATCH para actualización parcial (más apropiado que PUT)
      await casosAPI.patch(casoId, datosActualizacion);

      console.log('[Cases] Estado cambiado exitosamente, refrescando datos...');
      // Recargar todos los datos desde el backend
      await Promise.all([
        loadCases(),
        loadEmpleados(),
        loadUsuarios()
      ]);

      alert(`Estado del caso cambiado a "${nuevoEstado}" exitosamente`);
      
      // Disparar evento personalizado para actualizar notificaciones
      if (estadoBackend === 'cerrado') {
        window.dispatchEvent(new CustomEvent('caso-cerrado', { 
          detail: { casoId: casoId } 
        }));
      } else {
        window.dispatchEvent(new CustomEvent('caso-actualizado', { 
          detail: { casoId: casoId, nuevoEstado: estadoBackend } 
        }));
      }
      
      handleCloseChangeStatusModal();
      setSelectedCase(null);
    } catch (error) {
      console.error('[Cases] Error al cambiar estado del caso:', error);
      let errorMessage = 'Error al cambiar el estado del caso. Por favor, intenta nuevamente.';
      if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      alert(errorMessage);
    }
  };

  return (
    <div className="cases-container">
      <Nav />
      <main className="cases-main-content">
        {/* Left Sidebar */}
        <aside className="cases-sidebar">
          <div className="cases-sidebar-search">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="search-icon">
              <path d="M15.5 14H14.71L14.43 13.73C15.41 12.59 16 11.11 16 9.5C16 5.91 13.09 3 9.5 3C5.91 3 3 5.91 3 9.5C3 13.09 5.91 16 9.5 16C11.11 16 12.59 15.41 13.73 14.43L14 14.71V15.5L19 20.49L20.49 19L15.5 14ZM9.5 14C7.01 14 5 11.99 5 9.5C5 7.01 7.01 5 9.5 5C11.99 5 14 7.01 14 9.5C14 11.99 11.99 14 9.5 14Z" fill="#666"/>
            </svg>
            <input 
              type="text" 
              placeholder="Search" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="cases-filters">
            <div 
              className={`cases-filter-item ${sortOrder ? 'active' : ''}`}
              onClick={handleSortClick}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="filter-icon">
                <path d="M10 18H14V16H10V18ZM3 6V8H21V6H3ZM6 13H18V11H6V13Z" fill={sortOrder ? "#fff" : "#666"}/>
              </svg>
              <span>{sortOrder || "A-Z"}</span>
            </div>
            <div 
              className={`cases-filter-item ${statusFilter ? 'active' : ''}`}
              onClick={handleStatusFilterClick}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="filter-icon">
                <path d="M10 18H14V16H10V18ZM3 6V8H21V6H3ZM6 13H18V11H6V13Z" fill={statusFilter ? "#fff" : "#666"}/>
              </svg>
              <span>{statusFilter || "Estado"}</span>
            </div>
          </div>

          {/* Selector de letras para A-Z */}
          {sortOrder && (sortOrder === "A-Z" || sortOrder === "Z-A" || sortOrder.length === 1) && (
            <div className="letter-filter">
              <div className="letter-filter-title">Filtrar por letra:</div>
              <div className="letter-buttons">
                {Array.from({ length: 26 }, (_, i) => {
                  const letter = String.fromCharCode(65 + i);
                  return (
                    <button
                      key={letter}
                      className={`letter-button ${sortOrder === letter ? 'active' : ''}`}
                      onClick={() => handleLetterClick(letter)}
                    >
                      {letter}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="cases-date-input">
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg" 
              className="calendar-icon"
              onClick={handleCalendarIconClick}
              style={{ cursor: 'pointer' }}
            >
              <path d="M19 3H18V1H16V3H8V1H6V3H5C3.89 3 3.01 3.9 3.01 5L3 19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V8H19V19ZM7 10H9V12H7V10ZM11 10H13V12H11V10ZM15 10H17V12H15V10Z" fill="#666"/>
            </svg>
            <input 
              type="text" 
              placeholder="dd-mm-aa (Fecha terminación)" 
              value={selectedDate}
              readOnly
              onClick={handleCalendarIconClick}
              style={{ cursor: 'pointer' }}
            />
            <input
              ref={dateInputRef}
              type="date"
              style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }}
              onChange={handleDateChange}
            />
          </div>

          <button className="cases-new-button" onClick={handleOpenModal}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z" fill="currentColor"/>
            </svg>
            New case
          </button>
        </aside>

        {/* Right Main Content */}
        <section className="cases-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 className="cases-title">Cases</h2>
            <button 
              onClick={handleRefresh}
              disabled={refreshing}
              style={{
                padding: '8px 16px',
                backgroundColor: refreshing ? '#ccc' : '#9333EA',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: refreshing ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px'
              }}
              title="Refrescar datos"
            >
              <svg 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                style={{ 
                  animation: refreshing ? 'spin 1s linear infinite' : 'none',
                  transform: refreshing ? 'rotate(360deg)' : 'none'
                }}
              >
                <path 
                  d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" 
                  fill="currentColor"
                />
              </svg>
              {refreshing ? 'Actualizando...' : 'Actualizar'}
            </button>
          </div>
          
          <div className="cases-list">
            {filteredCases.length === 0 ? (
              <div className="no-cases-message">
                <p>No se encontraron casos que coincidan con los filtros aplicados.</p>
              </div>
            ) : (
              filteredCases.map((caseItem) => (
              <div 
                key={caseItem.id} 
                className="cases-item"
                onClick={() => handleCaseClick(caseItem)}
                style={{ cursor: 'pointer' }}
              >
                <div className="cases-avatar">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="12" fill="#86EFAC"/>
                    <circle cx="12" cy="9" r="4" fill="#9333EA"/>
                    <path d="M12 14C8.67 14 6 15.34 6 17V18H18V17C18 15.34 15.33 14 12 14Z" fill="#9333EA"/>
                  </svg>
                </div>
                <div className="cases-info">
                  <p className="cases-type">{caseItem.caseType}</p>
                  <p className="cases-entity">{caseItem.entityName}</p>
                  {caseItem.responsableNombre && (
                    <p className="cases-responsable" style={{ 
                      fontSize: '0.875rem', 
                      color: '#666', 
                      marginTop: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="#16a34a"/>
                      </svg>
                      {caseItem.responsableNombre}
                    </p>
                  )}
                  <div className="cases-dates">
                    <p className="cases-date">Creado: {formatDate(caseItem.createdAt)}</p>
                    {caseItem.endDate && (
                      <p className="cases-date">Fin: {formatDate(caseItem.endDate)}</p>
                    )}
                  </div>
                </div>
                <span className={`cases-status ${
                  caseItem.status === 'Pendiente' ? 'status-yellow' : 
                  caseItem.status === 'Terminado' ? 'status-green' : 
                  caseItem.status === 'Abierto' ? 'status-blue' :
                  caseItem.status === 'In progrest' ? 'status-red' : 'status-blue'
                }`}>
                  {caseItem.status}
                </span>
              </div>
              ))
            )}
          </div>
        </section>
      </main>

      {/* Modal de detalles del caso */}
      {selectedCase && (
        <div className="modal-overlay" onClick={handleCloseDetails}>
          <div className="modal-content case-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Detalles del Caso</h2>
              <button className="modal-close" onClick={handleCloseDetails}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="#666"/>
                </svg>
              </button>
            </div>
            <div className="case-details-content">
              <div className="case-detail-item">
                <label>Título del caso:</label>
                <p>{selectedCase.caseType}</p>
              </div>
              <div className="case-detail-item">
                <label>Nombre de la persona:</label>
                <p>{selectedCase.entityName}</p>
              </div>
              <div className="case-detail-item">
                <label>Fecha de creación:</label>
                <p>{formatDate(selectedCase.createdAt)}</p>
              </div>
              {selectedCase.endDate && (
                <div className="case-detail-item">
                  <label>Fecha de fin:</label>
                  <p>{formatDate(selectedCase.endDate)}</p>
                </div>
              )}
              <div className="case-detail-item">
                <label>Estado:</label>
                <span className={`cases-status ${
                  selectedCase.status === 'Pendiente' ? 'status-yellow' : 
                  selectedCase.status === 'Terminado' ? 'status-green' : 
                  selectedCase.status === 'Abierto' ? 'status-blue' :
                  selectedCase.status === 'In progrest' ? 'status-red' : 'status-blue'
                }`}>
                  {selectedCase.status}
                </span>
              </div>
              <div className="case-detail-item">
                <label>Responsable:</label>
                <p>{selectedCase.responsableNombre || 'Sin responsable asignado'}</p>
              </div>
              <div className="case-detail-item full-width">
                <label>Información de que se solicita en el caso:</label>
                <div className="case-description">
                  <p>{selectedCase.requestInfo || 'No hay información adicional disponible.'}</p>
                </div>
              </div>
              {selectedCase.status !== 'Terminado' && (
                <div className="case-details-actions">
                  <button className="modal-submit" onClick={handleOpenChangeStatusModal}>
                    Cambiar Estado
                  </button>
                </div>
              )}
              {selectedCase.status === 'Terminado' && (
                <div className="case-details-actions">
                  <p style={{ 
                    color: '#666', 
                    fontStyle: 'italic', 
                    textAlign: 'center',
                    padding: '10px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '6px'
                  }}>
                    Este caso está terminado y no puede cambiar de estado.
                    <br />
                    <strong>Responsable:</strong> {selectedCase.responsableNombre || 'Sin responsable asignado'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal para cambiar estado del caso */}
      {showChangeStatusModal && selectedCase && (
        <div className="modal-overlay" onClick={handleCloseChangeStatusModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Cambiar Estado del Caso</h2>
              <button className="modal-close" onClick={handleCloseChangeStatusModal}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="#666"/>
                </svg>
              </button>
            </div>
            <div className="modal-form">
              <div className="form-group">
                <label>Estado actual:</label>
                <p style={{ fontWeight: 'bold', color: '#9333EA', fontSize: '16px' }}>
                  {selectedCase.status}
                </p>
              </div>
              <div className="form-group">
                <label>Nuevo estado *</label>
                <select
                  value={statusChangeData.nuevoEstado}
                  onChange={(e) => setStatusChangeData(prev => ({ ...prev, nuevoEstado: e.target.value }))}
                  required
                >
                  <option value="">Seleccione un estado...</option>
                  {selectedCase.status !== 'Pendiente' && (
                    <option value="Pendiente">Pendiente</option>
                  )}
                  {selectedCase.status !== 'Abierto' && (
                    <option value="Abierto">Abierto</option>
                  )}
                  {selectedCase.status !== 'Terminado' && (
                    <option value="Terminado">Terminado</option>
                  )}
                </select>
              </div>
              {(statusChangeData.nuevoEstado === 'Pendiente' || statusChangeData.nuevoEstado === 'Terminado') && (
                <div className="form-group">
                  <label>Motivo del cambio *</label>
                  <textarea
                    value={statusChangeData.motivo}
                    onChange={(e) => setStatusChangeData(prev => ({ ...prev, motivo: e.target.value }))}
                    required
                    rows="4"
                    placeholder="Ingrese el motivo del cambio de estado..."
                  />
                </div>
              )}
              <div className="modal-actions">
                <button type="button" className="modal-cancel" onClick={handleCloseChangeStatusModal}>
                  Cancelar
                </button>
                <button type="button" className="modal-submit" onClick={handleChangeStatus}>
                  Cambiar Estado
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para crear nuevo caso */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Crear Nuevo Caso</h2>
              <button className="modal-close" onClick={handleCloseModal}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="#666"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmitCase} className="modal-form">
              <div className="form-group">
                <label>Título del caso *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  placeholder="Ej: Gestión de documento"
                />
              </div>
              <div className="form-group">
                <label>Nombre de la persona que pide el caso *</label>
                <input
                  type="text"
                  name="personName"
                  value={formData.personName}
                  onChange={handleInputChange}
                  required
                  placeholder="Nombre completo"
                />
              </div>
              <div className="form-group">
                <label>Fecha de creación de caso *</label>
                <div className="date-input-wrapper">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="calendar-icon"
                    onClick={() => handleDateClick(createdAtRef)}
                  >
                    <path
                      d="M19 3H18V1H16V3H8V1H6V3H5C3.89 3 3.01 3.9 3.01 5L3 19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V8H19V19ZM7 10H9V12H7V10ZM11 10H13V12H11V10ZM15 10H17V12H15V10Z"
                      fill="#666"
                    />
                  </svg>
                  <input
                    type="text"
                    value={formatDate(formData.createdAt)}
                    readOnly
                    onClick={() => handleDateClick(createdAtRef)}
                    placeholder="dd-mm-aa"
                  />
                  <input
                    ref={createdAtRef}
                    type="date"
                    name="createdAt"
                    value={formData.createdAt}
                    onChange={handleInputChange}
                    style={{
                      position: "absolute",
                      opacity: 0,
                      pointerEvents: "none",
                      width: 0,
                      height: 0,
                    }}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Fecha de fin de caso</label>
                <div className="date-input-wrapper">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="calendar-icon"
                    onClick={() => handleDateClick(endDateRef)}
                  >
                    <path
                      d="M19 3H18V1H16V3H8V1H6V3H5C3.89 3 3.01 3.9 3.01 5L3 19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V8H19V19ZM7 10H9V12H7V10ZM11 10H13V12H11V10ZM15 10H17V12H15V10Z"
                      fill="#666"
                    />
                  </svg>
                  <input
                    type="text"
                    value={formatDate(formData.endDate)}
                    readOnly
                    onClick={() => handleDateClick(endDateRef)}
                    placeholder="dd-mm-aa (opcional)"
                  />
                  <input
                    ref={endDateRef}
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    style={{
                      position: "absolute",
                      opacity: 0,
                      pointerEvents: "none",
                      width: 0,
                      height: 0,
                    }}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Responsable del caso *</label>
                <select
                  name="responsable"
                  value={formData.responsable}
                  onChange={handleInputChange}
                  required
                  disabled={usuarios.length === 0}
                >
                  <option value="">
                    {usuarios.length === 0 
                      ? 'No hay usuarios disponibles (THA/Usuario)' 
                      : 'Seleccione un responsable...'}
                  </option>
                  {usuarios.map((usuario) => {
                    const userId = usuario.id || usuario.Id_Usuario;
                    const nombreUsuario = usuario.nombre || usuario.username || 'Sin nombre';
                    const rolTipo = usuario.rol_tipo || usuario.rol?.tipo || '';
                    return (
                      <option key={userId} value={userId}>
                        {nombreUsuario} {rolTipo ? `(${rolTipo})` : ''}
                      </option>
                    );
                  })}
                </select>
                {usuarios.length === 0 && (
                  <p style={{ color: '#ff6b6b', fontSize: '12px', marginTop: '5px' }}>
                    No se encontraron usuarios con rol THA o Usuario. Verifique la conexión con el servidor.
                  </p>
                )}
              </div>
              <div className="form-group">
                <label>Información de que se solicita en el caso *</label>
                <textarea
                  name="requestInfo"
                  value={formData.requestInfo}
                  onChange={handleInputChange}
                  required
                  rows="4"
                  placeholder="Describa qué se solicita en este caso..."
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="modal-cancel" onClick={handleCloseModal}>
                  Cancelar
                </button>
                <button type="submit" className="modal-submit">
                  Crear Caso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

