"""
Middleware de autenticación JWT para FastAPI.
Maneja generación de tokens, verificación y control de roles.
"""

import os
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from config.database import get_db
from models.models import Usuario, Rol

JWT_SECRET = os.getenv("JWT_SECRET", "exploratur_clave_secreta_2026_academico")
JWT_EXPIRES_IN = os.getenv("JWT_EXPIRES_IN", "24h")

security = HTTPBearer()


def generate_token(user: Usuario, rol_nombre: str = None) -> str:
    """Genera un JWT para un usuario."""
    expire_hours = int(JWT_EXPIRES_IN.replace("h", ""))
    expire = datetime.now(timezone.utc) + timedelta(hours=expire_hours)

    # Use provided rol_nombre or fallback to relationship
    nombre_rol = rol_nombre
    if not nombre_rol:
        try:
            nombre_rol = user.rol.nombre
        except Exception:
            nombre_rol = "Cliente"

    payload = {
        "id": user.id,
        "email": user.email,
        "nombre": user.nombre,
        "apellido": user.apellido,
        "rol": nombre_rol,
        "rol_id": user.rol_id,
        "estado": user.estado,
        "exp": expire,
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def decode_token(token: str) -> dict:
    """Decodifica y valida un JWT. Retorna el payload o lanza excepción."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido.",
        )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> dict:
    """Dependency: obtiene el usuario autenticado actual."""
    payload = decode_token(credentials.credentials)

    user = db.query(Usuario).filter(Usuario.id == payload.get("id")).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado.",
        )

    if user.estado == "Inactivo":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tu cuenta está inactiva. Contacta al administrador.",
        )

    return payload


async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    """Dependency: requiere rol de Administrador."""
    if user.get("rol") != "Administrador":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado. Se requiere rol de Administrador.",
        )
    return user


async def require_admin_or_employee(user: dict = Depends(get_current_user)) -> dict:
    """Dependency: requiere rol de Administrador o Empleado."""
    if user.get("rol") not in ["Administrador", "Empleado"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado. Se requiere rol de Administrador o Empleado.",
        )
    return user
