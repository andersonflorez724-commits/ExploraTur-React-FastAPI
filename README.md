# ExploraTur — Aplicación Web Full Stack

Proyecto académico desarrollado con **React + Vite** (Frontend) y **Python + FastAPI + MySQL** (Backend).

## 📁 Estructura del proyecto

```
exploratur/
├── frontend/              ← Aplicación React + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/    ← Componentes reutilizables (Header, Footer, Carousel, UI)
│   │   ├── pages/         ← Páginas (Index, Login, Vuelos, Contacto, Paneles)
│   │   ├── data/          ← Datos estáticos (slides, flights)
│   │   ├── utils/         ← Utilidades (api, storage, validators, theme)
│   │   └── assets/        ← Imágenes SVG del carrusel
│   ├── package.json
│   └── vite.config.js
│
├── backend_fastapi/       ← API REST con Python + FastAPI
│   ├── config/            ← Conexión a MySQL (SQLAlchemy) y variables de entorno
│   ├── models/            ← Modelos SQLAlchemy (tablas)
│   ├── schemas/           ← Esquemas Pydantic (validación)
│   ├── middleware/        ← Autenticación JWT y control de roles
│   ├── routes/            ← Rutas de la API (auth, users, products, services, flights)
│   ├── main.py            ← Servidor principal (FastAPI + Uvicorn)
│   ├── requirements.txt   ← Dependencias de Python
│   ├── schema.sql         ← Script de creación de la BD
│   └── .env               ← Variables de entorno (no subir al repositorio)
│
└── README.md
```

## 🚀 Instalación y ejecución

### Requisitos
- Python 3.10+
- MySQL (XAMPP, WAMP o instalación directa)
- npm

### 1. Base de datos MySQL
```bash
# Ejecutar el script SQL para crear la BD y tablas
mysql -u root < backend_fastapi/schema.sql
```

### 2. Backend (FastAPI)
```bash
cd backend_fastapi
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
python main.py
# Servidor en http://localhost:8000 — Swagger UI en http://localhost:8000/docs
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
# Aplicación en http://localhost:5173
```

## 👤 Usuarios de prueba

| Email | Contraseña | Rol |
|-------|-----------|-----|
| admin@exploratur.com | Admin1@ | Administrador |
| empleado@exploratur.com | Empleado1@ | Empleado |

> Los usuarios con rol Cliente se crean desde el formulario de registro de la aplicación.

## 🔧 Tecnologías

### Frontend
- React 19 + Vite
- Tailwind CSS v4
- React Router DOM v7

### Backend
- Python + FastAPI + Uvicorn
- MySQL (MariaDB via XAMPP) con SQLAlchemy y PyMySQL
- passlib/bcrypt (hashing de contraseñas)
- python-jose (JWT)
- Pydantic (validaciones)

## 📋 Funcionalidades

- ✅ Carrusel de 10 imágenes con auto-play
- ✅ Inicio de sesión y registro de clientes
- ✅ Recuperación de contraseña
- ✅ Panel de Administrador (CRUD usuarios, productos, servicios)
- ✅ Panel de Empleado (gestión de productos)
- ✅ Panel de Cliente (perfil, productos, servicios)
- ✅ Autenticación JWT
- ✅ Contraseñas con hashing seguro (bcryptjs)
- ✅ Control de roles (Admin, Empleado, Cliente)
- ✅ Validaciones en tiempo real (Frontend + Backend)
- ✅ Modo oscuro / claro
- ✅ Botón flotante de WhatsApp
- ✅ Responsive (menú hamburguesa móvil)
