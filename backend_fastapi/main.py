"""
Aplicación principal ExploraTur con FastAPI.
Backend para React + Vite con autenticación JWT y base de datos MySQL.
"""

import os
import sys

# Agregar el directorio actual al path para que los imports funcionen
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Cargar el .env ANTES de importar los módulos locales, para que las variables
# (DB_*, JWT_SECRET, GEMINI_API_KEY...) estén disponibles en cuanto se importen.
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from fastapi import Request
from fastapi.responses import JSONResponse
from config.database import engine, SessionLocal, Base
from models.models import Usuario, Rol
from seed import seed_flights
from routes.auth import router as auth_router, registro_router as registro_router
from routes.users import router as users_router
from routes.products import router as products_router
from routes.services import router as services_router
from routes.flights import router as flights_router
from routes.ventas import router as ventas_router
from routes.facturas import router as facturas_router
from routes.pqr import router as pqr_router
from routes.stats import router as stats_router
from routes.chatbot import router as chatbot_router

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
app.include_router(ventas_router)
app.include_router(facturas_router)
app.include_router(pqr_router)
app.include_router(stats_router)
app.include_router(chatbot_router)


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
# Rutas
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
            "ventas": "/api/ventas",
            "facturas": "/api/facturas",
            "pqr": "/api/pqr",
            "stats": "/api/stats",
            "chatbot": "/api/chatbot",
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
# Health check endpoint
# =====================================================
@app.get("/")
def root():
    return {"status": "ok", "message": "ExploraTur API is running", "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "ok"}


# =====================================================
# Migraciones ligeras de enums (create_all no altera tablas existentes)
# =====================================================
def migrate_enums():
    """Aplica cambios de ENUM que create_all no puede hacer en tablas ya creadas."""
    from sqlalchemy import text

    if engine.dialect.name != "mysql":
        return

    alters = [
        "ALTER TABLE detalle_ventas MODIFY tipo_item ENUM('Producto', 'Servicio', 'Vuelo') NOT NULL",
    ]
    for stmt in alters:
        try:
            with engine.begin() as conn:
                conn.execute(text(stmt))
            print(f"[OK] Enum migration: {stmt.split(' MODIFY ')[1][:60]}...")
        except Exception as e:
            print(f"[WARN] Enum migration skipped: {e}")


# =====================================================
# Migración ligera: impuestos y descuentos por vuelo
# =====================================================
def migrate_vuelos_impuestos():
    """Agrega las columnas de % de impuesto y % de descuento a la tabla vuelos."""
    from sqlalchemy import text, inspect

    try:
        inspector = inspect(engine)
        if not inspector.has_table("vuelos"):
            return
        existing = {col["name"] for col in inspector.get_columns("vuelos")}
        alters = []
        if "impuesto_porcentaje" not in existing:
            alters.append(
                "ALTER TABLE vuelos ADD COLUMN impuesto_porcentaje DECIMAL(5,2) NOT NULL DEFAULT 19"
            )
        if "descuento_porcentaje" not in existing:
            alters.append(
                "ALTER TABLE vuelos ADD COLUMN descuento_porcentaje DECIMAL(5,2) NOT NULL DEFAULT 5"
            )
        for stmt in alters:
            with engine.begin() as conn:
                conn.execute(text(stmt))
            print(f"[OK] Vuelos migration: {stmt.split('ADD COLUMN ')[1].split(' ')[0]} added")
    except Exception as e:
        print(f"[WARN] Vuelos migration skipped: {e}")


def backfill_impuestos_vuelos():
    """Recalcula impuestos y descuentos de las ventas de vuelos registradas en 0."""
    from decimal import Decimal, ROUND_HALF_UP
    from models.models import Venta, DetalleVenta, Vuelo, Factura

    db = SessionLocal()
    try:
        ventas = (
            db.query(Venta)
            .join(DetalleVenta, DetalleVenta.venta_id == Venta.id)
            .filter(DetalleVenta.tipo_item == "Vuelo")
            .filter(Venta.impuestos == 0, Venta.descuento == 0)
            .distinct()
            .all()
        )

        actualizadas = 0
        for venta in ventas:
            detalles_vuelo = [d for d in venta.detalles if d.tipo_item == "Vuelo"]
            if not detalles_vuelo:
                continue
            vuelo = db.query(Vuelo).filter(Vuelo.id == detalles_vuelo[0].item_id).first()
            if not vuelo:
                continue

            pct_desc = Decimal(str(vuelo.descuento_porcentaje or 0)) / Decimal("100")
            pct_imp = Decimal(str(vuelo.impuesto_porcentaje or 0)) / Decimal("100")

            bruto = Decimal(str(venta.subtotal))
            descuento = (bruto * pct_desc).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            base = bruto - descuento
            impuestos = (base * pct_imp).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

            venta.descuento = descuento
            venta.impuestos = impuestos
            venta.total = base + impuestos

            for d in detalles_vuelo:
                d.descuento = (Decimal(str(d.subtotal)) * pct_desc).quantize(
                    Decimal("0.01"), rounding=ROUND_HALF_UP
                )

            for factura in db.query(Factura).filter(Factura.venta_id == venta.id).all():
                factura.descuento = descuento
                factura.impuestos = impuestos
                factura.total = base + impuestos

            actualizadas += 1

        if actualizadas:
            db.commit()
            print(f"[OK] Backfill impuestos/descuentos: {actualizadas} ventas de vuelo actualizadas")
        else:
            print("[OK] Backfill impuestos/descuentos: nada que actualizar")
    except Exception as e:
        print(f"[WARN] Backfill impuestos/descuentos: {e}")
        db.rollback()
    finally:
        db.close()

# =====================================================
# Evento de inicio
# =====================================================
@app.on_event("startup")
def startup_event():
    import threading

    def init_db():
        print("\nConnecting to MySQL...")
        try:
            Base.metadata.create_all(bind=engine)
            print("[OK] Tables verified/created successfully")
            migrate_enums()
            migrate_vuelos_impuestos()
            backfill_impuestos_vuelos()
            seed_roles()
            seed_users()
            seed_flights()
            print("[OK] Seed completed")
        except Exception as e:
            print(f"[WARN] Seed error: {e}")

    threading.Thread(target=init_db, daemon=True).start()
    print(f"[OK] ExploraTur FastAPI server running on port {port}")


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
