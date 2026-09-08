# Backend ExploraTur - FastAPI

Backend desarrollado con **Python FastAPI** para la plataforma ExploraTur.

## Arquitectura

```
React + Vite → FastAPI → MySQL
```

## Estructura del proyecto

```
backend_fastapi/
├── main.py              # Punto de entrada de la aplicación
├── config/
│   └── database.py      # Configuración de SQLAlchemy
├── models/
│   └── models.py        # Modelos SQLAlchemy (tablas)
├── schemas/
│   └── schemas.py       # Esquemas Pydantic (validación)
├── middleware/
│   └── auth.py          # Autenticación JWT
├── routes/
│   ├── auth.py          # Registro, login, perfil
│   ├── users.py         # CRUD de usuarios (admin)
│   ├── products.py      # CRUD de productos
│   ├── services.py      # CRUD de servicios
│   └── flights.py       # CRUD de vuelos
├── requirements.txt     # Dependencias de Python
├── .env                 # Variables de entorno
├── seed.py              # Script de datos de prueba
└── schema.sql           # Script SQL de la base de datos
```

## Instalación

1. Crear entorno virtual:
   ```bash
   python -m venv venv
   venv\Scripts\activate  # Windows
   ```

2. Instalar dependencias:
   ```bash
   pip install -r requirements.txt
   ```

3. Configurar variables de entorno en `.env`

4. Ejecutar el servidor:
   ```bash
   python main.py
   ```

## Endpoints

### Auth
- `POST /api/auth/register` - Registro de clientes
- `POST /api/auth/login` - Inicio de sesión (JWT)
- `GET /api/auth/me` - Perfil del usuario autenticado

### Usuarios (Admin)
- `GET /api/users` - Listar usuarios
- `GET /api/users/roles` - Listar roles
- `GET /api/users/{id}` - Obtener usuario
- `POST /api/users` - Crear usuario
- `PUT /api/users/{id}` - Actualizar usuario
- `PATCH /api/users/{id}/estado` - Cambiar estado
- `DELETE /api/users/{id}` - Eliminar usuario

### Productos
- `GET /api/products` - Listar productos
- `GET /api/products/categories` - Listar categorías
- `GET /api/products/{id}` - Obtener producto
- `POST /api/products` - Crear producto (Admin/Empleado)
- `PUT /api/products/{id}` - Actualizar producto
- `PATCH /api/products/{id}/estado` - Cambiar estado
- `DELETE /api/products/{id}` - Eliminar producto (Admin)

### Servicios
- `GET /api/services` - Listar servicios
- `GET /api/services/{id}` - Obtener servicio
- `POST /api/services` - Crear servicio (Admin)
- `PUT /api/services/{id}` - Actualizar servicio
- `PATCH /api/services/{id}/estado` - Cambiar estado
- `DELETE /api/services/{id}` - Eliminar servicio

### Vuelos
- `GET /api/flights` - Listar vuelos
- `GET /api/flights/{id}` - Obtener vuelo
- `POST /api/flights` - Crear vuelo (Admin)
- `PUT /api/flights/{id}` - Actualizar vuelo
- `PATCH /api/flights/{id}/estado` - Cambiar estado
- `DELETE /api/flights/{id}` - Eliminar vuelo

## Documentación

- Swagger UI: http://127.0.0.1:8000/docs
- ReDoc: http://127.0.0.1:8000/redoc

## Roles

- **Administrador**: Gestión total de usuarios, productos, servicios y vuelos
- **Empleado**: Gestión parcial de productos
- **Cliente**: Consulta de productos, servicios y vuelos
