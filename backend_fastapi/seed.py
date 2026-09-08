"""
Script de seed: crea usuarios de prueba en la base de datos.
Se puede ejecutar directamente: python seed.py
"""

import os
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
from passlib.context import CryptContext
from config.database import SessionLocal, engine, Base
from models.models import Usuario, Rol

load_dotenv()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def seed():
    """Crea usuarios de prueba si no existen."""
    # Crear tablas
    Base.metadata.create_all(bind=engine)

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
                password_hash = pwd_context.hash(u["password"])
                existing.password_hash = password_hash
                existing.estado = "Activo"
                print(f"[USER VERIFIED] {u['email']}")

        db.commit()
        print("\n[OK] Seed completed successfully.")
    except Exception as e:
        print(f"\n[ERROR] Error creating seed users: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed()
