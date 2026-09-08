"""
Aplicación principal ExploraTur con FastAPI.
Backend para React + Vite con autenticación JWT y base de datos MySQL.
"""

import os
import sys
import io

# Fix Windows console encoding for emoji characters
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# Agregar el directorio actual al path para que los imports funcionen
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from fastapi import Request
from fastapi.responses import JSONResponse
from config.database import engine, SessionLocal, Base
from models.models import Usuario, Rol
from routes.auth import router as auth_router, registro_router as registro_router
from routes.users import router as users_router
from routes.products import router as products_router
from routes.services import router as services_router
from routes.flights import router as flights_router

load_dotenv()

port = int(os.getenv("PORT", "8000"))

app = FastAPI(
    title="ExploraTur API",
    description="API REST para la plataforma ExploraTur - Turismo y viajes",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# =====================================================
# CORS
# =====================================================
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

# =====================================================
# Registrar rutas
# =====================================================
app.include_router(auth_router)
app.include_router(registro_router)
app.include_router(users_router)
app.include_router(products_router)
app.include_router(services_router)
app.include_router(flights_router)


# =====================================================
# Exception handler para mantener compatibilidad con el frontend
# El frontend espera { "error": "..." } pero FastAPI usa { "detail": "..." }
# =====================================================
from fastapi.exceptions import HTTPException as FastAPIHTTPException
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException


@app.exception_handler(FastAPIHTTPException)
async def http_exception_handler(request: Request, exc: FastAPIHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail},
    )


@app.exception_handler(StarletteHTTPException)
async def starlette_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status.status_code,
        content={"error": exc.detail},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Handler para errores de validación de Pydantic.
    Convierte el formato detail a error para compatibilidad con el frontend.
    """
    errors = []
    for e in exc.errors():
        loc = " -> ".join(str(l) for l in e.get("loc", []))
        msg = e.get("msg", "Error de validación")
        errors.append(f"{loc}: {msg}")

    error_msg = "; ".join(errors) if errors else "Error de validación"
    return JSONResponse(
        status_code=422,
        content={"error": error_msg},
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"error": "Error interno del servidor."},
    )


# =====================================================
# Ruta de prueba
# =====================================================
@app.get("/api")
def root():
    """Ruta de prueba de la API."""
    return {
        "mensaje": "API de ExploraTur funcionando correctamente.",
        "version": "1.0.0",
        "framework": "FastAPI",
        "endpoints": {
            "auth": "/api/auth",
            "users": "/api/users",
            "products": "/api/products",
            "services": "/api/services",
            "flights": "/api/flights",
            "docs": "/docs",
        },
    }


# =====================================================
# Seed: crear usuarios de prueba al iniciar
# =====================================================
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def seed_roles():
    """Crea los 3 roles por defecto si no existen."""
    db = SessionLocal()
    try:
        roles = [
            {"nombre": "Administrador", "descripcion": "Gestión total de usuarios, productos y servicios"},
            {"nombre": "Empleado", "descripcion": "Gestión parcial según funciones asignadas"},
            {"nombre": "Cliente", "descripcion": "Consulta y compra de productos y servicios"},
        ]
        for r in roles:
            existing = db.query(Rol).filter(Rol.nombre == r["nombre"]).first()
            if not existing:
                rol = Rol(nombre=r["nombre"], descripcion=r["descripcion"])
                db.add(rol)
                print(f"[ROLE CREATED] {r['nombre']}")
            else:
                print(f"[ROLE EXISTS] {r['nombre']}")
        db.commit()
    except Exception as e:
        print(f"[WARN] Error creating roles: {e}")
        db.rollback()
    finally:
        db.close()


def seed_users():
    """Crea usuarios de prueba si no existen."""
    db = SessionLocal()
    try:
        usuarios = [
            {
                "nombre": "Carlos",
                "apellido": "Admin",
                "tipo_documento": "CC",
                "numero_documento": "1000000001",
                "direccion": "Carrera 10 # 1-10, Bogotá",
                "telefono": "3000000001",
                "email": "admin@exploratur.com",
                "password": "Admin1@",
                "rol_id": 1,
            },
            {
                "nombre": "María",
                "apellido": "Empleado",
                "tipo_documento": "CC",
                "numero_documento": "1000000002",
                "direccion": "Carrera 20 # 2-20, Bogotá",
                "telefono": "3000000002",
                "email": "empleado@exploratur.com",
                "password": "Empleado1@",
                "rol_id": 2,
            },
        ]

        for u in usuarios:
            existing = db.query(Usuario).filter(Usuario.email == u["email"]).first()
            if not existing:
                password_hash = pwd_context.hash(u["password"])
                user = Usuario(
                    nombre=u["nombre"],
                    apellido=u["apellido"],
                    tipo_documento=u["tipo_documento"],
                    numero_documento=u["numero_documento"],
                    direccion=u["direccion"],
                    telefono=u["telefono"],
                    email=u["email"],
                    password_hash=password_hash,
                    rol_id=u["rol_id"],
                )
                db.add(user)
                print(f"[USER CREATED] {u['email']}")
            else:
                # Actualizar password y estado
                password_hash = pwd_context.hash(u["password"])
                existing.password_hash = password_hash
                existing.estado = "Activo"
                print(f"[USER VERIFIED] {u['email']}")

        db.commit()
    except Exception as e:
        print(f"[WARN] Error creating seed users: {e}")
        db.rollback()
    finally:
        db.close()


# =====================================================
# Evento de inicio
# =====================================================
@app.on_event("startup")
def startup_event():
    """Inicializa la base de datos y crea usuarios de prueba."""
    print("\nConnecting to MySQL...")

    try:
        # Crear tablas si no existen
        Base.metadata.create_all(bind=engine)
        print("[OK] Tables verified/created successfully")

        # Crear roles por defecto
        seed_roles()

        # Crear usuarios de prueba
        seed_users()

        print(f"\n[OK] ExploraTur FastAPI server running at http://localhost:{port}")
        print(f"[OK] API available at http://localhost:{port}/api")
        print(f"[OK] Swagger docs at http://localhost:{port}/docs\n")

    except Exception as e:
        print(f"\n[ERROR] Error connecting to MySQL: {e}")
        print("\n   Make sure MySQL is running.")
        print("   Solutions:")
        print("   1. Open XAMPP Control Panel and start MySQL")
        print("   2. Check the .env configuration")
        raise


# =====================================================
# Punto de entrada
# =====================================================
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True,
    )
