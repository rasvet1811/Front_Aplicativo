# Configuración de CORS para el Backend Django

El error "Failed to fetch" generalmente indica un problema de CORS (Cross-Origin Resource Sharing).

## Solución: Configurar CORS en Django

### 1. Instalar django-cors-headers (si no está instalado)

```bash
pip install django-cors-headers
```

### 2. Agregar a INSTALLED_APPS en settings.py

```python
INSTALLED_APPS = [
    ...
    'corsheaders',
    ...
]
```

### 3. Agregar el middleware en settings.py

```python
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # Debe estar al principio
    'django.middleware.common.CommonMiddleware',
    ...
]
```

### 4. Configurar CORS en settings.py

```python
# Permitir todas las solicitudes desde localhost (solo para desarrollo)
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",  # Puerto de Vite
    "http://localhost:3000",  # Puerto alternativo de React
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]

# O para desarrollo, permitir todos los orígenes (NO usar en producción)
# CORS_ALLOW_ALL_ORIGINS = True

# Permitir credenciales
CORS_ALLOW_CREDENTIALS = True

# Métodos permitidos
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

# Headers permitidos
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]
```

### 5. Reiniciar el servidor Django

```bash
python manage.py runserver
```

## Verificar que funciona

1. Abre la consola del navegador (F12)
2. Intenta iniciar sesión
3. Revisa los mensajes en la consola
4. Si ves errores de CORS, verifica la configuración anterior




