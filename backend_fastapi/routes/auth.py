"""
Rutas de autenticación: registro, login y perfil.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from config.database import get_db
from models.models import Usuario, Rol
from schemas.schemas import RegisterRequest, LoginRequest
from middleware.auth import generate_token, get_current_user

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

router = APIRouter(prefix="/api/auth", tags=["Auth"])

# Alias de ruta para compatibilidad con el checklist del SENA
registro_router = APIRouter(prefix="/api/usuarios", tags=["Auth"])


@registro_router.post("/registro")
def register_alias(data: RegisterRequest, db: Session = Depends(get_db)):
    """
    POST /api/usuarios/registro
    Alias del endpoint de registro (compatibilidad con checklist SENA).
    """
    # Verificar si el correo ya está registrado
    existing = db.query(Usuario).filter(Usuario.email == data.email).first()
    if existing:
        msg = "Ya existe una cuenta con este correo electrónico."
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={"error": msg, "mensaje": msg},
        )

    # Verificar si el número de documento ya está registrado
    existing_doc = db.query(Usuario).filter(
        Usuario.numero_documento == data.numero_documento
    ).first()
    if existing_doc:
        msg = "Ya existe una cuenta con este número de documento."
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={"error": msg, "mensaje": msg},
        )

    # Hash de la contraseña
    password_hash = pwd_context.hash(data.password)

    # Crear usuario con rol de Cliente (rol_id = 3)
    user = Usuario(
        nombre=data.nombre,
        apellido=data.apellido,
        tipo_documento=data.tipo_documento,
        numero_documento=data.numero_documento,
        direccion=data.direccion,
        telefono=data.telefono,
        email=data.email,
        password_hash=password_hash,
        rol_id=3,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    rol = db.query(Rol).filter(Rol.id == user.rol_id).first()

    return {
        "mensaje": "Registro exitoso.",
        "usuario": {
            "id": user.id,
            "nombre": user.nombre,
            "apellido": user.apellido,
            "tipo_documento": user.tipo_documento,
            "numero_documento": user.numero_documento,
            "direccion": user.direccion,
            "telefono": user.telefono,
            "email": user.email,
            "rol": rol.nombre if rol else "Cliente",
            "estado": user.estado,
        },
    }


@router.post("/register")
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    """
    POST /api/auth/register
    Registra un nuevo cliente en la base de datos.
    """
    # Verificar si el correo ya está registrado
    existing = db.query(Usuario).filter(Usuario.email == data.email).first()
    if existing:
        msg = "Ya existe una cuenta con este correo electrónico."
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={"error": msg, "mensaje": msg},
        )

    # Verificar si el número de documento ya está registrado
    existing_doc = db.query(Usuario).filter(
        Usuario.numero_documento == data.numero_documento
    ).first()
    if existing_doc:
        msg = "Ya existe una cuenta con este número de documento."
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={"error": msg, "mensaje": msg},
        )

    # Hash de la contraseña
    password_hash = pwd_context.hash(data.password)

    # Crear usuario con rol de Cliente (rol_id = 3)
    user = Usuario(
        nombre=data.nombre,
        apellido=data.apellido,
        tipo_documento=data.tipo_documento,
        numero_documento=data.numero_documento,
        direccion=data.direccion,
        telefono=data.telefono,
        email=data.email,
        password_hash=password_hash,
        rol_id=3,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Obtener el rol
    rol = db.query(Rol).filter(Rol.id == user.rol_id).first()

    return {
        "mensaje": "Registro exitoso.",
        "usuario": {
            "id": user.id,
            "nombre": user.nombre,
            "apellido": user.apellido,
            "tipo_documento": user.tipo_documento,
            "numero_documento": user.numero_documento,
            "direccion": user.direccion,
            "telefono": user.telefono,
            "email": user.email,
            "rol": rol.nombre if rol else "Cliente",
            "estado": user.estado,
        },
    }


@router.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    """
    POST /api/auth/login
    Valida credenciales y devuelve un JWT.
    """
    # Buscar usuario por correo
    user = (
        db.query(Usuario)
        .filter(Usuario.email == data.email)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contraseña incorrectos.",
        )

    # Verificar estado
    if user.estado == "Inactivo":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tu cuenta está inactiva. Contacta al administrador.",
        )

    # Verificar contraseña
    if not pwd_context.verify(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contraseña incorrectos.",
        )

    # Obtener el rol
    rol = db.query(Rol).filter(Rol.id == user.rol_id).first()

    # Generar JWT
    token = generate_token(user, rol_nombre=rol.nombre if rol else "Cliente")

    return {
        "mensaje": "Inicio de sesión exitoso.",
        "token": token,
        "usuario": {
            "id": user.id,
            "nombre": user.nombre,
            "apellido": user.apellido,
            "email": user.email,
            "rol": rol.nombre if rol else "Cliente",
            "rol_id": user.rol_id,
            "estado": user.estado,
        },
    }


@router.get("/me")
def get_profile(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    GET /api/auth/me
    Devuelve los datos del usuario autenticado actual.
    """
    user = db.query(Usuario).filter(Usuario.id == current_user["id"]).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado.",
        )

    rol = db.query(Rol).filter(Rol.id == user.rol_id).first()

    return {
        "usuario": {
            "id": user.id,
            "nombre": user.nombre,
            "apellido": user.apellido,
            "tipo_documento": user.tipo_documento,
            "numero_documento": user.numero_documento,
            "direccion": user.direccion,
            "telefono": user.telefono,
            "email": user.email,
            "estado": user.estado,
            "created_at": str(user.created_at) if user.created_at else None,
            "rol_id": user.rol_id,
            "rol_nombre": rol.nombre if rol else None,
        }
    }
