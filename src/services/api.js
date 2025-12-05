const BASE_URL = 'http://localhost:8000/api';

// ==================== GESTIÓN DE TOKEN ====================
const TOKEN_KEY = 'authToken';
const USER_KEY = 'user';

const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

const setToken = (token) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
};

const getUser = () => {
  const userStr = localStorage.getItem(USER_KEY);
  return userStr ? JSON.parse(userStr) : null;
};

const setUser = (user) => {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_KEY);
  }
};

const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

// ==================== SERVICIO DE AUTENTICACIÓN ====================
export const authService = {
  // POST /api/auth/login/
  login: async (username, password) => {
    try {
      const response = await fetch(`${BASE_URL}/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { message: `Error ${response.status}: ${response.statusText}` };
        }
        
        // Manejo específico de errores 500
        if (response.status === 500) {
          throw new Error('Error interno del servidor. Por favor, contacta al administrador o verifica los logs del backend.');
        }
        
        throw new Error(errorData.message || errorData.detail || errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.token) {
        setToken(data.token);
        if (data.user) {
          setUser(data.user);
        }
      }
      
      return data;
    } catch (error) {
      console.error('[Auth] Login error:', error);
      if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
        throw new Error('No se pudo conectar con el servidor. Verifica que el backend esté corriendo en http://localhost:8000 y que CORS esté configurado correctamente.');
      }
      throw error;
    }
  },

  // POST /api/auth/logout/
  logout: async () => {
    try {
      const token = getToken();
      if (token) {
        await fetch(`${BASE_URL}/auth/logout/`, {
          method: 'POST',
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('[Auth] Logout error:', error);
    } finally {
      clearAuth();
    }
  },

  // GET /api/auth/verificar-token/
  verifyToken: async () => {
    try {
      const token = getToken();
      if (!token) {
        return { valido: false, user: null, tiempo_restante: 0 };
      }

      const response = await fetch(`${BASE_URL}/auth/verificar-token/`, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return { valido: false, user: null, tiempo_restante: 0 };
      }

      return await response.json();
    } catch (error) {
      console.error('[Auth] Verify token error:', error);
      return { valido: false, user: null, tiempo_restante: 0 };
    }
  },

  // POST /api/auth/renovar-token/
  renewToken: async () => {
    try {
      const token = getToken();
      if (!token) {
        throw new Error('No hay token para renovar');
      }

      const response = await fetch(`${BASE_URL}/auth/renovar-token/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Error al renovar el token');
      }

      const data = await response.json();
      if (data.token) {
        setToken(data.token);
      }
      
      return data;
    } catch (error) {
      console.error('[Auth] Renew token error:', error);
      throw error;
    }
  },

  // Utilidades
  getToken: () => getToken(),
  getUser: () => getUser(),
  isAuthenticated: () => !!getToken(),
};

// ==================== INTERCEPTOR PARA PETICIONES ====================
const makeRequest = async (endpoint, options = {}) => {
  const { requiresAuth = true, ...fetchOptions } = options;
  
  const headers = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };

  // Agregar token automáticamente si requiere autenticación
  if (requiresAuth) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Token ${token}`;
      console.log(`[API] Token agregado a headers para ${endpoint}`);
    } else {
      console.error(`[API] ⚠️ No hay token disponible para ${endpoint}. La petición fallará con 401.`);
      throw new Error('No estás autenticado. Por favor, inicia sesión para continuar.');
    }
  }

  const config = {
    ...fetchOptions,
    headers,
  };

  try {
    console.log(`[API] ${config.method || 'GET'} ${BASE_URL}${endpoint}`, config);
    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    
    console.log(`[API] Response status: ${response.status}`);

    // Si el token expiró, intentar renovarlo
    if (response.status === 401 && requiresAuth) {
      try {
        await authService.renewToken();
        // Reintentar la petición con el nuevo token
        const newToken = getToken();
        if (newToken) {
          headers['Authorization'] = `Token ${newToken}`;
          const retryResponse = await fetch(`${BASE_URL}${endpoint}`, {
            ...config,
            headers,
          });
          
          if (!retryResponse.ok) {
            const errorData = await retryResponse.json().catch(() => ({}));
            throw new Error(errorData.message || errorData.detail || `Error ${retryResponse.status}`);
          }
          
          return await retryResponse.json();
        }
      } catch (renewError) {
        // Si no se puede renovar, limpiar auth
        console.error('[API] Error al renovar token:', renewError);
        clearAuth();
        window.dispatchEvent(new CustomEvent('token-expired'));
        const error = new Error('Token expirado. Por favor, inicia sesión nuevamente.');
        error.isTokenExpired = true;
        throw error;
      }
    }

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { message: `Error ${response.status}: ${response.statusText}` };
      }
      
      // Manejo específico de errores 500
      if (response.status === 500) {
        throw new Error('Error interno del servidor. Por favor, contacta al administrador o verifica los logs del backend.');
      }
      
      const error = new Error(errorData.detail || errorData.message || errorData.error || errorData.non_field_errors?.[0] || `Error ${response.status}: ${response.statusText}`);
      error.response = errorData;
      error.status = response.status;
      
      // Marcar errores de autenticación
      if (response.status === 401) {
        error.isTokenExpired = true;
        clearAuth();
        window.dispatchEvent(new CustomEvent('token-expired'));
      }
      
      throw error;
    }

    const data = await response.json();
    console.log('[API] Success response:', data);
    return data;
  } catch (error) {
    console.error('[API] Request error:', error);
    if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
      throw new Error('No se pudo conectar con el servidor. Verifica que el backend esté corriendo en http://localhost:8000 y que CORS esté configurado correctamente.');
    }
    throw error;
  }
};

// ==================== PETICIONES CON FORMDATA ====================
const makeFormDataRequest = async (endpoint, formData, options = {}) => {
  const { requiresAuth = true, ...fetchOptions } = options;
  
  const headers = {
    ...fetchOptions.headers,
  };

  // Agregar token automáticamente si requiere autenticación
  if (requiresAuth) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Token ${token}`;
      console.log(`[API] Token agregado a headers para ${endpoint} (FormData)`);
    } else {
      console.error(`[API] ⚠️ No hay token disponible para ${endpoint}. La petición fallará con 401.`);
      throw new Error('No estás autenticado. Por favor, inicia sesión para continuar.');
    }
  }

  const config = {
    ...fetchOptions,
    headers,
    body: formData,
  };

  try {
    console.log(`[API] ${config.method || 'POST'} ${BASE_URL}${endpoint} (FormData)`);
    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      let errorData;
      try {
        const text = await response.text();
        try {
          errorData = JSON.parse(text);
        } catch (e) {
          errorData = { message: text || `Error ${response.status}: ${response.statusText}` };
        }
      } catch (e) {
        errorData = { message: `Error ${response.status}: ${response.statusText}` };
      }
      
      // Log detallado del error para debugging
      console.error('[API] Error response:', {
        status: response.status,
        statusText: response.statusText,
        errorData: errorData
      });
      
      // Manejo específico de errores 500
      if (response.status === 500) {
        throw new Error('Error interno del servidor. Por favor, contacta al administrador o verifica los logs del backend.');
      }
      
      // Manejo específico de errores 400 con detalles
      if (response.status === 400) {
        let errorMessage = 'Error en los datos enviados. ';
        if (errorData) {
          if (typeof errorData === 'object') {
            // Si hay errores de validación por campo
            const fieldErrors = Object.keys(errorData)
              .filter(key => Array.isArray(errorData[key]))
              .map(key => `${key}: ${errorData[key].join(', ')}`)
              .join('; ');
            if (fieldErrors) {
              errorMessage += fieldErrors;
            } else if (errorData.non_field_errors && Array.isArray(errorData.non_field_errors)) {
              errorMessage += errorData.non_field_errors.join('; ');
            } else {
              errorMessage += errorData.message || errorData.detail || errorData.error || JSON.stringify(errorData);
            }
          } else {
            errorMessage += errorData;
          }
        }
        
        // Log completo del error para debugging
        console.error('[API] Error 400 - Detalles completos:', {
          endpoint,
          errorData,
          errorMessage
        });
        
        throw new Error(errorMessage);
      }
      
      throw new Error(errorData.message || errorData.detail || errorData.error || `Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[API] FormData request error:', error);
    if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
      throw new Error('No se pudo conectar con el servidor. Verifica que el backend esté corriendo en http://localhost:8000 y que CORS esté configurado correctamente.');
    }
    throw error;
  }
};

// ==================== API SERVICE (ESTILO AXIOS) ====================
const api = {
  // GET
  get: async (endpoint, options = {}) => {
    return makeRequest(endpoint, { ...options, method: 'GET' });
  },

  // POST
  post: async (endpoint, data = null, options = {}) => {
    if (data instanceof FormData) {
      return makeFormDataRequest(endpoint, data, { ...options, method: 'POST' });
    }
    return makeRequest(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  // PUT
  put: async (endpoint, data = null, options = {}) => {
    if (data instanceof FormData) {
      return makeFormDataRequest(endpoint, data, { ...options, method: 'PUT' });
    }
    return makeRequest(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  // DELETE
  delete: async (endpoint, options = {}) => {
    return makeRequest(endpoint, { ...options, method: 'DELETE' });
  },

  // PATCH
  patch: async (endpoint, data = null, options = {}) => {
    if (data instanceof FormData) {
      return makeFormDataRequest(endpoint, data, { ...options, method: 'PATCH' });
    }
    return makeRequest(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  },
};

// ==================== EXPORTAR ====================
export default api;

// Exportar también funciones específicas para compatibilidad
export const empleadosAPI = {
  getAll: (search = '', estado = null) => {
    let url = '/empleados/';
    const params = new URLSearchParams();
    // El backend acepta tanto 'search' como 'nombre' para compatibilidad
    if (search) {
      params.append('search', search);
      params.append('nombre', search); // También enviar como 'nombre' para compatibilidad
    }
    if (estado !== null) params.append('estado', estado);
    if (params.toString()) url += `?${params.toString()}`;
    return api.get(url);
  },
  getById: (id) => api.get(`/empleados/${id}/`),
  create: (empleadoData, foto = null) => {
    const formData = new FormData();
    Object.keys(empleadoData).forEach(key => {
      if (empleadoData[key] !== null && empleadoData[key] !== undefined) {
        formData.append(key, empleadoData[key]);
      }
    });
    if (foto) formData.append('foto', foto);
    return api.post('/empleados/', formData);
  },
  update: (id, empleadoData, foto = null) => {
    const formData = new FormData();
    Object.keys(empleadoData).forEach(key => {
      if (empleadoData[key] !== null && empleadoData[key] !== undefined) {
        formData.append(key, empleadoData[key]);
      }
    });
    if (foto) formData.append('foto', foto);
    return api.put(`/empleados/${id}/`, formData);
  },
  delete: (id) => api.delete(`/empleados/${id}/`),
  getHistorial: (id) => api.get(`/empleados/${id}/historial/`, { requiresAuth: false }),
};

export const casosAPI = {
  getAll: (estado = null, empleado = null, tipo_fuero = null) => {
    let url = '/casos/';
    const params = new URLSearchParams();
    if (estado) params.append('estado', estado);
    if (empleado) params.append('empleado', empleado);
    if (tipo_fuero) params.append('tipo_fuero', tipo_fuero);
    if (params.toString()) url += `?${params.toString()}`;
    return api.get(url); // Requiere autenticación
  },
  getById: (id) => api.get(`/casos/${id}/`), // Requiere autenticación por defecto
  create: (casoData) => api.post('/casos/', casoData),
  update: (id, casoData) => api.put(`/casos/${id}/`, casoData),
  patch: (id, casoData) => api.patch(`/casos/${id}/`, casoData),
  delete: (id) => api.delete(`/casos/${id}/`),
  cerrar: (id) => api.post(`/casos/${id}/cerrar/`),
};

export const documentosAPI = {
  getAll: (caso = null, tipo = null, empleado = null, carpeta = null) => {
    let url = '/documentos/';
    const params = new URLSearchParams();
    if (caso) params.append('caso', caso);
    if (tipo) params.append('tipo', tipo);
    if (empleado) params.append('empleado', empleado);
    if (carpeta) params.append('carpeta', carpeta);
    if (params.toString()) url += `?${params.toString()}`;
    return api.get(url);
  },
  getById: (id) => api.get(`/documentos/${id}/`),
  create: async (documentoData, archivo) => {
    const formData = new FormData();
    
    // Campos requeridos que siempre deben enviarse
    const requiredFields = ['nombre', 'empleado'];
    requiredFields.forEach(key => {
      if (documentoData[key] !== null && documentoData[key] !== undefined) {
        const value = documentoData[key];
        formData.append(key, typeof value === 'number' ? value.toString() : value);
      }
    });
    
    // Campos opcionales - solo agregar si tienen valor válido
    const optionalFields = ['tipo', 'descripcion', 'extension', 'caso', 'carpeta', 'usuario_creador'];
    optionalFields.forEach(key => {
      const value = documentoData[key];
      if (value !== null && value !== undefined && value !== '') {
        formData.append(key, typeof value === 'number' ? value.toString() : value);
      }
    });
    
    if (archivo) {
      // El backend espera 'archivo' según el modelo FileField
      // Asegurarse de que el archivo tenga un nombre
      const nombreArchivo = archivo.name || `documento_${Date.now()}.${documentoData.extension || 'bin'}`;
      formData.append('archivo', archivo, nombreArchivo);
      console.log('[documentosAPI] Archivo agregado al FormData:', nombreArchivo, 'Tamaño:', archivo.size, 'bytes');
    } else {
      console.warn('[documentosAPI] ⚠️ No se proporcionó archivo para el documento');
    }
    
    // Log para debugging - mostrar qué se está enviando
    console.log('[documentosAPI] Datos a enviar:', documentoData);
    console.log('[documentosAPI] Archivo:', archivo?.name || 'No hay archivo');
    console.log('[documentosAPI] FormData entries:');
    for (let pair of formData.entries()) {
      if (pair[0] === 'archivo') {
        console.log(`  ${pair[0]}: [File] ${pair[1].name} (${pair[1].size} bytes)`);
      } else {
        console.log(`  ${pair[0]}: ${pair[1]}`);
      }
    }
    
    const response = await api.post('/documentos/', formData);
    
    // Verificar la respuesta
    if (response && !response.archivo) {
      console.warn('[documentosAPI] ⚠️ El documento se creó pero no tiene archivo en la respuesta:', response);
    }
    
    return response;
  },
  update: (id, documentoData, archivo = null) => {
    const formData = new FormData();
    Object.keys(documentoData).forEach(key => {
      if (documentoData[key] !== null && documentoData[key] !== undefined) {
        formData.append(key, documentoData[key]);
      }
    });
    if (archivo) {
      formData.append('archivo', archivo);
    }
    return api.put(`/documentos/${id}/`, formData);
  },
  delete: (id) => api.delete(`/documentos/${id}/`),
  download: async (id) => {
    const token = getToken();
    
    if (!token) {
      throw new Error('No estás autenticado. Por favor, inicia sesión para descargar documentos.');
    }
    
    try {
      console.log(`[documentosAPI] Intentando descargar documento con ID: ${id}`);
      
      // Usar el endpoint de descarga del backend
      const response = await fetch(`${BASE_URL}/documentos/${id}/descargar/`, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${token}`,
        },
      });
      
      console.log(`[documentosAPI] Respuesta del servidor: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        let errorMessage = 'Error al descargar el documento';
        
        // Intentar obtener el mensaje de error del backend
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = errorData.error;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.detail) {
            errorMessage = errorData.detail;
          }
        } catch (e) {
          // Si no se puede parsear como JSON, usar el texto de respuesta
          const errorText = await response.text();
          if (errorText) {
            errorMessage = errorText;
          }
        }
        
        // Mensajes específicos según el código de estado
        if (response.status === 404) {
          errorMessage = 'El documento no tiene archivo asociado o el archivo no existe en el servidor.';
        } else if (response.status === 401) {
          errorMessage = 'No estás autenticado. Por favor, inicia sesión nuevamente.';
        } else if (response.status === 500) {
          errorMessage = 'Error interno del servidor al procesar el archivo.';
        }
        
        console.error('[documentosAPI] Error al descargar:', response.status, errorMessage);
        throw new Error(errorMessage);
      }
      
      // Obtener el nombre del archivo del header Content-Disposition si está disponible
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = null;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+?)"?$/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      const blob = await response.blob();
      console.log(`[documentosAPI] Archivo descargado exitosamente. Tamaño: ${blob.size} bytes`);
      
      // Retornar el blob y el nombre del archivo si está disponible
      return { blob, filename };
    } catch (error) {
      console.error('[documentosAPI] Error completo al descargar:', error);
      throw error;
    }
  },
};

export const alertasAPI = {
  getAll: (caso = null, estado = null, tipo = null) => {
    let url = '/alertas/';
    const params = new URLSearchParams();
    if (caso) params.append('caso', caso);
    if (estado) params.append('estado', estado);
    if (tipo) params.append('tipo', tipo);
    if (params.toString()) url += `?${params.toString()}`;
    return api.get(url); // Requiere autenticación por defecto
  },
  getById: (id) => api.get(`/alertas/${id}/`), // Requiere autenticación por defecto
  create: (alertaData) => api.post('/alertas/', alertaData),
  update: (id, alertaData) => api.put(`/alertas/${id}/`, alertaData),
  delete: (id) => api.delete(`/alertas/${id}/`),
};

export const seguimientosAPI = {
  getAll: (caso = null, usuario = null) => {
    let url = '/seguimientos/';
    const params = new URLSearchParams();
    if (caso) params.append('caso', caso);
    if (usuario) params.append('usuario', usuario);
    if (params.toString()) url += `?${params.toString()}`;
    return api.get(url, { requiresAuth: false });
  },
  getById: (id) => api.get(`/seguimientos/${id}/`, { requiresAuth: false }),
  create: (seguimientoData) => api.post('/seguimientos/', seguimientoData),
  update: (id, seguimientoData) => api.put(`/seguimientos/${id}/`, seguimientoData),
  delete: (id) => api.delete(`/seguimientos/${id}/`),
};

export const reportesAPI = {
  getAll: (tipo = null, estado = null, formato = null) => {
    let url = '/reportes/';
    const params = new URLSearchParams();
    if (tipo) params.append('tipo', tipo);
    if (estado) params.append('estado', estado);
    if (formato) params.append('formato', formato);
    if (params.toString()) url += `?${params.toString()}`;
    return api.get(url, { requiresAuth: false });
  },
  getById: (id) => api.get(`/reportes/${id}/`, { requiresAuth: false }),
  create: (reporteData) => api.post('/reportes/', reporteData),
  update: (id, reporteData) => api.put(`/reportes/${id}/`, reporteData),
  delete: (id) => api.delete(`/reportes/${id}/`),
};

export const rolesAPI = {
  getAll: () => api.get('/roles/'), // Requiere autenticación por defecto
  getById: (id) => api.get(`/roles/${id}/`), // Requiere autenticación por defecto
  create: (tipo) => api.post('/roles/', { tipo }),
  update: (id, tipo) => api.put(`/roles/${id}/`, { tipo }),
  delete: (id) => api.delete(`/roles/${id}/`),
};

export const carpetasAPI = {
  getAll: (empleado = null) => {
    let url = '/carpetas/';
    const params = new URLSearchParams();
    if (empleado) params.append('empleado', empleado);
    if (params.toString()) url += `?${params.toString()}`;
    return api.get(url);
  },
  getById: (id) => api.get(`/carpetas/${id}/`),
  create: (carpetaData) => api.post('/carpetas/', carpetaData),
  update: (id, carpetaData) => api.put(`/carpetas/${id}/`, carpetaData),
  delete: (id) => api.delete(`/carpetas/${id}/`),
};

export const usuariosAPI = {
  getAll: () => api.get('/usuarios/'),
  getMe: () => api.get('/usuarios/me/'),
  getById: (id) => api.get(`/usuarios/${id}/`),
  create: (usuarioData) => api.post('/usuarios/', usuarioData),
  update: (id, usuarioData) => api.put(`/usuarios/${id}/`, usuarioData),
  delete: (id) => api.delete(`/usuarios/${id}/`),
  solicitarVerificacionRol: async (user_id, nuevo_rol_id) => {
    return api.post('/auth/solicitar-verificacion-rol/', {
      user_id,
      nuevo_rol_id
    });
  },
  cambiarRol: async (id, user_id, nuevo_rol_id, token_verificacion) => {
    return api.post(`/usuarios/${id}/cambiar_rol/`, {
      user_id,
      nuevo_rol_id,
      token_verificacion
    });
  },
};
