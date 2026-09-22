"""
Script de seed: crea roles, usuarios y vuelos de prueba.
Se ejecuta automáticamente al iniciar el servidor.
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from datetime import datetime, timedelta
from dotenv import load_dotenv
from passlib.context import CryptContext
from config.database import SessionLocal
from models.models import Rol, Usuario, Vuelo

load_dotenv()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def seed_roles():
    db = SessionLocal()
    try:
        roles = [
            {"nombre": "Administrador", "descripcion": "Acceso total al sistema"},
            {"nombre": "Empleado", "descripcion": "Gestión de productos y ventas"},
            {"nombre": "Cliente", "descripcion": "Consulta y compras"},
        ]
        for r in roles:
            existing = db.query(Rol).filter(Rol.nombre == r["nombre"]).first()
            if not existing:
                db.add(Rol(nombre=r["nombre"], descripcion=r["descripcion"]))
        db.commit()
        print("[OK] Roles verified/created")
    except Exception as e:
        print(f"[ERROR] Seed roles: {e}")
        db.rollback()
    finally:
        db.close()


def seed_users():
    db = SessionLocal()
    try:
        usuarios = [
            {
                "nombre": "Carlos", "apellido": "Admin",
                "tipo_documento": "CC", "numero_documento": "1000000001",
                "direccion": "Carrera 10 # 1-10, Bogotá", "telefono": "3000000001",
                "email": "admin@exploratur.com", "password": "Admin1@", "rol_id": 1,
            },
            {
                "nombre": "María", "apellido": "Empleado",
                "tipo_documento": "CC", "numero_documento": "1000000002",
                "direccion": "Carrera 20 # 2-20, Bogotá", "telefono": "3000000002",
                "email": "empleado@exploratur.com", "password": "Empleado1@", "rol_id": 2,
            },
        ]
        for u in usuarios:
            existing = db.query(Usuario).filter(Usuario.email == u["email"]).first()
            if not existing:
                password_hash = pwd_context.hash(u["password"])
                db.add(Usuario(
                    nombre=u["nombre"], apellido=u["apellido"],
                    tipo_documento=u["tipo_documento"], numero_documento=u["numero_documento"],
                    direccion=u["direccion"], telefono=u["telefono"],
                    email=u["email"], password_hash=password_hash, rol_id=u["rol_id"],
                ))
                print(f"[USER CREATED] {u['email']}")
            else:
                existing.password_hash = pwd_context.hash(u["password"])
                existing.estado = "Activo"
        db.commit()
        print("[OK] Users verified")
    except Exception as e:
        print(f"[ERROR] Seed users: {e}")
        db.rollback()
    finally:
        db.close()


def seed_flights():
    db = SessionLocal()
    try:
        count = db.query(Vuelo).count()
        if count > 0:
            print(f"[OK] {count} flights already exist, skipping seed")
            return

        today = datetime.now()
        vuelos = [
            {"aerolinea": "Avianca", "numero_vuelo": "AV 123", "origen": "Bogotá", "codigo_origen": "BOG", "destino": "Cartagena", "codigo_destino": "CTG", "precio": 250000, "clase": "Económica"},
            {"aerolinea": "LATAM", "numero_vuelo": "LA 456", "origen": "Bogotá", "codigo_origen": "BOG", "destino": "Medellín", "codigo_destino": "MDE", "precio": 180000, "clase": "Económica"},
            {"aerolinea": "Wingo", "numero_vuelo": "WO 789", "origen": "Bogotá", "codigo_origen": "BOG", "destino": "Santa Marta", "codigo_destino": "SMR", "precio": 220000, "clase": "Económica"},
            {"aerolinea": "Avianca", "numero_vuelo": "AV 321", "origen": "Bogotá", "codigo_origen": "BOG", "destino": "San Andrés", "codigo_destino": "ADZ", "precio": 450000, "clase": "Ejecutiva"},
            {"aerolinea": "LATAM", "numero_vuelo": "LA 654", "origen": "Bogotá", "codigo_origen": "BOG", "destino": "Cali", "codigo_destino": "CLO", "precio": 160000, "clase": "Económica"},
            {"aerolinea": "Avianca", "numero_vuelo": "AV 987", "origen": "Bogotá", "codigo_origen": "BOG", "destino": "Miami", "codigo_destino": "MIA", "precio": 1200000, "clase": "Ejecutiva"},
            {"aerolinea": "LATAM", "numero_vuelo": "LA 147", "origen": "Bogotá", "codigo_origen": "BOG", "destino": "Nueva York", "codigo_destino": "JFK", "precio": 1800000, "clase": "Primera Clase"},
            {"aerolinea": "Iberia", "numero_vuelo": "IB 258", "origen": "Bogotá", "codigo_origen": "BOG", "destino": "Madrid", "codigo_destino": "MAD", "precio": 3500000, "clase": "Ejecutiva"},
            {"aerolinea": "Copa Airlines", "numero_vuelo": "CM 369", "origen": "Bogotá", "codigo_origen": "BOG", "destino": "Panamá", "codigo_destino": "PTY", "precio": 800000, "clase": "Económica"},
            {"aerolinea": "Viva Air", "numero_vuelo": "VH 741", "origen": "Bogotá", "codigo_origen": "BOG", "destino": "Cancún", "codigo_destino": "CUN", "precio": 950000, "clase": "Económica"},
            {"aerolinea": "Avianca", "numero_vuelo": "AV 852", "origen": "Bogotá", "codigo_origen": "BOG", "destino": "Lima", "codigo_destino": "LIM", "precio": 700000, "clase": "Económica"},
            {"aerolinea": "LATAM", "numero_vuelo": "LA 963", "origen": "Bogotá", "codigo_origen": "BOG", "destino": "Ciudad de México", "codigo_destino": "MEX", "precio": 1100000, "clase": "Ejecutiva"},
        ]
        for i, v in enumerate(vuelos):
            fecha = (today + timedelta(days=5 + i)).strftime("%Y-%m-%d")
            db.add(Vuelo(
                aerolinea=v["aerolinea"], numero_vuelo=v["numero_vuelo"],
                origen=v["origen"], codigo_origen=v["codigo_origen"],
                destino=v["destino"], codigo_destino=v["codigo_destino"],
                fecha=fecha, hora_salida="08:00", hora_llegada="10:30",
                duracion="2h 30m", escalas="Directo",
                precio=v["precio"], clase=v["clase"], asientos_disponibles=50,
            ))
        db.commit()
        print(f"[OK] {len(vuelos)} flights created")
    except Exception as e:
        print(f"[ERROR] Seed flights: {e}")
        db.rollback()
    finally:
        db.close()
