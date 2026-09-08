"""
Rutas de gestión de usuarios (solo administrador).
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from config.database import get_db
from models.models import Usuario, Rol
from schemas.schemas import CreateUserRequest, UpdateUserRequest, ToggleStatusRequest
from middleware.auth import require_admin

router = APIRouter(prefix="/api/users", tags=["Users"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def user_to_dict(user: Usuario, rol: Rol = None) -> dict:
    """Convierte un usuario a diccionario para respuesta JSON."""
    return {
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
        "updated_at": str(user.updated_at) if user.updated_at else None,
        "rol_id": user.rol_id,
        "rol_nombre": rol.nombre if rol else None,
    }


@router.get("")
def get_all_users(
    estado: Optional[str] = Query(None),
    rol: Optional[str] = Query(None),
    busqueda: Optional[str] = Query(None),
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    GET /api/users
    Lista todos los usuarios (solo admin).
    """
    query = (
        db.query(Usuario, Rol)
        .join(Rol, Usuario.rol_id == Rol.id)
    )

    if estado:
        query = query.filter(Usuario.estado == estado)

    if rol:
        query = query.filter(Rol.nombre == rol)

    if busqueda:
        term = f"%{busqueda}%"
        query = query.filter(
            (Usuario.nombre.like(term))
            | (Usuario.apellido.like(term))
            | (Usuario.email.like(term))
            | (Usuario.numero_documento.like(term))
        )

    query = query.order_by(Usuario.created_at.desc())
    results = query.all()

    usuarios = [user_to_dict(u, r) for u, r in results]

    return {"usuarios": usuarios, "total": len(usuarios)}


@router.get("/roles")
def get_roles(
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    GET /api/users/roles
    Lista todos los roles disponibles.
    """
    roles = db.query(Rol).order_by(Rol.id).all()
    return {
        "roles": [
            {"id": r.id, "nombre": r.nombre, "descripcion": r.descripcion}
            for r in roles
        ]
    }


@router.get("/{user_id}")
def get_user_by_id(
    user_id: int,
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    GET /api/users/:id
    Obtiene un usuario por ID.
    """
    user = db.query(Usuario).filter(Usuario.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado.",
        )

    rol = db.query(Rol).filter(Rol.id == user.rol_id).first()

    return {"usuario": user_to_dict(user, rol)}


@router.post("")
def create_user(
    data: CreateUserRequest,
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    POST /api/users
    Crea un nuevo usuario (solo admin).
    """
    # Verificar duplicados
    existing = (
        db.query(Usuario)
        .filter(
            (Usuario.email == data.email)
            | (Usuario.numero_documento == data.numero_documento)
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe un usuario con ese correo o número de documento.",
        )

    password_hash = pwd_context.hash(data.password)

    user = Usuario(
        nombre=data.nombre,
        apellido=data.apellido,
        tipo_documento=data.tipo_documento,
        numero_documento=data.numero_documento,
        direccion=data.direccion,
        telefono=data.telefono,
        email=data.email,
        password_hash=password_hash,
        rol_id=data.rol_id or 3,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    rol = db.query(Rol).filter(Rol.id == user.rol_id).first()

    return {
        "mensaje": "Usuario creado exitosamente.",
        "usuario": user_to_dict(user, rol),
    }


@router.put("/{user_id}")
def update_user(
    user_id: int,
    data: UpdateUserRequest,
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    PUT /api/users/:id
    Actualiza la información de un usuario.
    """
    user = db.query(Usuario).filter(Usuario.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado.",
        )

    # Verificar duplicados (excluyendo al usuario actual)
    duplicate = (
        db.query(Usuario)
        .filter(
            ((Usuario.email == data.email) | (Usuario.numero_documento == data.numero_documento))
            & (Usuario.id != user_id)
        )
        .first()
    )
    if duplicate:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe otro usuario con ese correo o documento.",
        )

    user.nombre = data.nombre
    user.apellido = data.apellido
    user.tipo_documento = data.tipo_documento
    user.numero_documento = data.numero_documento
    user.direccion = data.direccion
    user.telefono = data.telefono
    user.email = data.email
    user.rol_id = data.rol_id or 3

    if data.password and data.password.strip():
        user.password_hash = pwd_context.hash(data.password)

    db.commit()
    db.refresh(user)

    rol = db.query(Rol).filter(Rol.id == user.rol_id).first()

    return {
        "mensaje": "Usuario actualizado exitosamente.",
        "usuario": user_to_dict(user, rol),
    }


@router.patch("/{user_id}/estado")
def toggle_user_status(
    user_id: int,
    data: ToggleStatusRequest,
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    PATCH /api/users/:id/estado
    Cambia el estado de un usuario (Activo/Inactivo).
    """
    user = db.query(Usuario).filter(Usuario.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado.",
        )

    # No permitir desactivarse a sí mismo
    if user_id == current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes cambiar tu propio estado.",
        )

    user.estado = data.estado
    db.commit()

    return {
        "mensaje": f"Usuario {data.estado.lower()} exitosamente.",
        "id": user_id,
        "estado": data.estado,
    }


@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    DELETE /api/users/:id
    Elimina un usuario (solo admin).
    """
    if user_id == current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes eliminar tu propia cuenta.",
        )

    user = db.query(Usuario).filter(Usuario.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado.",
        )

    db.delete(user)
    db.commit()

    return {"mensaje": "Usuario eliminado exitosamente."}
