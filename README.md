# ExploraTur — Aplicación Web Full Stack

Proyecto académico desarrollado con **React + Vite** (Frontend) y **Python + FastAPI + MySQL** (Backend).

## Estructura del proyecto

```
ExploraTur-React-FastAPI/
├── frontend/                  ← React + Vite + Tailwind CSS v4
│   ├── src/
│   │   ├── components/        ← Componentes reutilizables
│   │   │   ├── auth/          ← Registro, recuperación de contraseña
│   │   │   ├── charts/        ← Gráficos Recharts (Barras, Líneas, Pie)
│   │   │   └── ui/            ← Button, Input, Modal, Select, WhatsApp
│   │   ├── pages/             ← Páginas y paneles
│   │   ├── data/              ← Datos estáticos (slides, flights)
│   │   ├── utils/             ← api.js, storage.js, theme.js, validators.js
│   │   └── assets/images/     ← Imágenes SVG del carrusel
│   ├── package.json
│   └── vite.config.js
│
├── backend_fastapi/           ← API REST con Python + FastAPI
│   ├── config/                ← Conexión MySQL (SQLAlchemy)
│   ├── models/                ← Modelos SQLAlchemy (15 modelos)
│   ├── schemas/               ← Esquemas Pydantic (validación)
│   ├── middleware/            ← JWT + control de roles
│   ├── routes/                ← 11 routers de la API
│   │   ├── auth.py            ← Login, registro, perfil
│   │   ├── users.py           ← CRUD usuarios (Admin)
│   │   ├── products.py        ← CRUD productos
│   │   ├── services.py        ← CRUD servicios
│   │   ├── flights.py         ← CRUD vuelos
│   │   ├── ventas.py          ← Ventas + reporte diario
│   │   ├── facturas.py        ← Facturación
│   │   ├── pqr.py             ← Peticiones, Quejas, Reclamos
│   │   ├── stats.py           ← Estadísticas del dashboard
│   │   └── chatbot.py         ← Chatbot con Google Gemini IA
│   ├── main.py                ← Servidor principal
│   ├── schema.sql             ← Script SQL (13 tablas)
│   ├── seed.py                ← Datos de prueba
│   ├── Dockerfile             ← Configuración Docker
│   └── requirements.txt       ← Dependencias Python
│
├── render.yaml                ← Blueprint de despliegue en Render
└── README.md
```

## Instalación y ejecución

### Requisitos
- Python 3.10+
- MySQL (XAMPP, WAMP o instalación directa)
- npm

### 1. Base de datos MySQL
```bash
mysql -u root < backend_fastapi/schema.sql
```

### 2. Backend (FastAPI)
```bash
cd backend_fastapi
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
cp .env.example .env         # Configurar variables de entorno
python main.py
# Servidor: http://localhost:8000
# Swagger: http://localhost:8000/docs
```

### 3. Frontend
```bash
cd frontend
npm install
cp .env.example .env         # Configurar VITE_API_URL
npm run dev
# Aplicación: http://localhost:5173
```

## Usuarios de prueba

| Email | Contraseña | Rol |
|-------|-----------|-----|
| admin@exploratur.com | Admin1@ | Administrador |
| empleado@exploratur.com | Empleado1@ | Empleado |

> Los usuarios con rol Cliente se crean desde el formulario de registro.

## Variables de entorno

### Backend (.env)
| Variable | Descripción |
|----------|-------------|
| `DB_HOST` | Host de MySQL |
| `DB_PORT` | Puerto de MySQL (3306) |
| `DB_USER` | Usuario de MySQL |
| `DB_PASSWORD` | Contraseña de MySQL |
| `DB_NAME` | Nombre de la BD (exploratur_db) |
| `JWT_SECRET` | Clave secreta para JWT |
| `JWT_EXPIRES_IN` | Tiempo de expiración del token (24h) |
| `FRONTEND_URL` | URL del frontend para CORS |
| `PORT` | Puerto del servidor (8000) |
| `GEMINI_API_KEY` | Clave de Google Gemini para el Chatbot |
| `GEMINI_MODEL` | Modelo de Gemini (opcional) |

### Frontend (.env)
| Variable | Descripción |
|----------|-------------|
| `VITE_API_URL` | URL del backend API (default: http://localhost:8000/api) |

## Tecnologías

### Frontend
- React 19 + Vite 8
- Tailwind CSS v4
- React Router DOM v7
- Recharts 3 (gráficos)
- jsPDF + jspdf-autotable (exportación PDF)
- xlsx (exportación Excel)

### Backend
- Python + FastAPI + Uvicorn
- SQLAlchemy + PyMySQL (MySQL)
- python-jose (JWT)
- passlib + bcrypt (hashing)
- Pydantic (validaciones)
- Google Gemini API (Chatbot IA)

### Seguridad
- JWT con expiración configurable
- Control de roles (Administrador, Empleado, Cliente)
- Protección de endpoints por rol
- Hashing de contraseñas con bcrypt
- Variables de entorno para credenciales
- CORS configurado por dominio

## Funcionalidades

### Cuarto Avance (Base)
- ✅ Carrusel de 10 imágenes con auto-play
- ✅ Inicio de sesión y registro de clientes
- ✅ Panel de Administrador (CRUD completo)
- ✅ Panel de Empleado (gestión de productos)
- ✅ Panel de Cliente (perfil, catálogo, compras)
- ✅ Autenticación JWT + control de roles
- ✅ Modo oscuro / claro
- ✅ Responsive (menú hamburguesa móvil)
- ✅ Botón flotante de WhatsApp

### Quinto Avance (Nuevo)
- ✅ **Módulo de ventas**: Registro de ventas con productos/servicios, cantidades, precios, descuentos, impuestos
- ✅ **Historial de ventas**: Consulta con filtros por fecha, cliente, estado y búsqueda
- ✅ **Reporte diario de ventas**: Endpoint y página con resumen y tabla detallada
- ✅ **Exportación PDF**: Reportes y facturas en formato PDF (jsPDF)
- ✅ **Exportación Excel**: Reportes en formato .xlsx (SheetJS)
- ✅ **Módulo de facturación**: Generación, consulta y descarga de facturas
- ✅ **Dashboard administrativo**: 8 indicadores (Cards) + gráficos de ventas
- ✅ **Dashboard de ventas**: Gráficos de barras, líneas y torta
- ✅ **Dashboards por roles**: Admin, Empleado y Cliente con información diferenciada
- ✅ **Filtros en dashboards**: Selector de período (diario/semanal/mensual) y rango de fechas
- ✅ **Gráficos Recharts**: Barras, líneas, torta (productos más vendidos)
- ✅ **Módulo PQR**: Registro, consulta, asignación y gestión de Peticiones, Quejas y Reclamos
- ✅ **Chatbot IA**: Asistente virtual con Google Gemini para atención al cliente
- ✅ **13 tablas SQL**: ventas, detalle_ventas, facturas, pqr, conversaciones, mensajes, etc.
- ✅ **11 routers FastAPI**: Auth, Users, Products, Services, Flights, Ventas, Facturas, PQR, Stats, Chatbot
- ✅ **Variables de entorno**: API keys y credenciales protegidas
- ✅ **Docker**: Dockerfile + .dockerignore para el backend
- ✅ **Despliegue**: render.yaml para Render (Web Service + Static Site)

## Despliegue en Render

1. Crear cuenta en [render.com](https://render.com)
2. Conectar el repositorio de GitHub
3. Configurar variables de entorno en el dashboard:
   - `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` (MySQL externo)
   - `GEMINI_API_KEY` (Google Gemini)
   - `FRONTEND_URL` (URL del frontend desplegado)
   - `VITE_API_URL` (URL del backend + /api)
4. Render usará automáticamente `render.yaml`

## API Endpoints

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | /api/auth/register | Registro de cliente | Público |
| POST | /api/auth/login | Inicio de sesión | Público |
| GET | /api/auth/me | Perfil autenticado | JWT |
| GET | /api/users | Listar usuarios | Admin |
| POST | /api/users | Crear usuario | Admin |
| PUT | /api/users/:id | Editar usuario | Admin |
| DELETE | /api/users/:id | Eliminar usuario | Admin |
| GET | /api/products | Listar productos | JWT |
| POST | /api/products | Crear producto | Admin/Empleado |
| GET | /api/services | Listar servicios | JWT |
| POST | /api/services | Crear servicio | Admin |
| GET | /api/flights | Listar vuelos | Público |
| POST | /api/ventas | Crear venta | Admin/Empleado |
| GET | /api/ventas | Listar ventas | JWT |
| GET | /api/ventas/reporte-diario | Reporte diario | Admin/Empleado |
| POST | /api/facturas | Generar factura | Admin/Empleado |
| GET | /api/facturas | Listar facturas | JWT |
| GET | /api/facturas/por-numero/:num | Buscar por número | JWT |
| POST | /api/pqr | Crear PQR | JWT |
| GET | /api/pqr | Listar PQRs | JWT |
| GET | /api/pqr/estadisticas | Estadísticas PQR | Admin/Empleado |
| GET | /api/stats/dashboard | Estadísticas dashboard | JWT |
| GET | /api/stats/ventas-por-periodo | Ventas por período | Admin/Empleado |
| GET | /api/stats/ventas-por-producto | Top productos | Admin/Empleado |
| GET | /api/stats/ventas-mensuales | Ventas mensuales | Admin/Empleado |
| POST | /api/chatbot | Enviar mensaje IA | Público |
| GET | /api/chatbot/historial/:id | Historial chat | Público |

## Pruebas con Postman

La colección completa se encuentra en:
```
backend_fastapi/ExploraTur_API_Coleccion.postman_collection.json
```

Incluye pruebas automatizadas para:
- Autenticación JWT
- CRUD de usuarios, productos, servicios, vuelos
- Ventas y reportes
- Facturación
- PQR
- Estadísticas del dashboard
- Chatbot con IA

## Licencia

Proyecto académico - Ficha 3406204 - Trimestre 03
