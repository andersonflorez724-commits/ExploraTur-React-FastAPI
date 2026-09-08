"""
Rutas de gestión de servicios.
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from config.database import get_db
from models.models import Servicio
from schemas.schemas import ServiceRequest, ServiceUpdateRequest, ToggleStatusRequest
from middleware.auth import get_current_user, require_admin

router = APIRouter(prefix="/api/services", tags=["Services"])


def service_to_dict(service: Servicio) -> dict:
    """Convierte un servicio a diccionario para respuesta JSON."""
    return {
        "id": service.id,
        "nombre": service.nombre,
        "descripcion": service.descripcion,
        "precio": float(service.precio),
        "estado": service.estado,
        "created_at": str(service.created_at) if service.created_at else None,
        "updated_at": str(service.updated_at) if service.updated_at else None,
    }


@router.get("")
def get_all_services(
    estado: Optional[str] = Query(None),
    busqueda: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    GET /api/services
    Lista todos los servicios.
    """
    query = db.query(Servicio)

    if estado:
        query = query.filter(Servicio.estado == estado)
    else:
        if current_user.get("rol") != "Administrador":
            query = query.filter(Servicio.estado == "Activo")

    if busqueda:
        term = f"%{busqueda}%"
        query = query.filter(
            or_(
                Servicio.nombre.like(term),
                Servicio.descripcion.like(term),
            )
        )

    query = query.order_by(Servicio.created_at.desc())
    services = query.all()

    return {
        "servicios": [service_to_dict(s) for s in services],
        "total": len(services),
    }


@router.get("/{service_id}")
def get_service_by_id(
    service_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    GET /api/services/:id
    Obtiene un servicio por ID.
    """
    service = db.query(Servicio).filter(Servicio.id == service_id).first()
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Servicio no encontrado.",
        )

    return {"servicio": service_to_dict(service)}


@router.post("")
def create_service(
    data: ServiceRequest,
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    POST /api/services
    Crea un nuevo servicio (Admin).
    """
    service = Servicio(
        nombre=data.nombre,
        descripcion=data.descripcion,
        precio=data.precio,
    )
    db.add(service)
    db.commit()
    db.refresh(service)

    return {
        "mensaje": "Servicio creado exitosamente.",
        "servicio": service_to_dict(service),
    }


@router.put("/{service_id}")
def update_service(
    service_id: int,
    data: ServiceUpdateRequest,
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    PUT /api/services/:id
    Actualiza un servicio (Admin).
    """
    service = db.query(Servicio).filter(Servicio.id == service_id).first()
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Servicio no encontrado.",
        )

    service.nombre = data.nombre
    service.descripcion = data.descripcion
    service.precio = data.precio
    service.estado = data.estado or "Activo"

    db.commit()
    db.refresh(service)

    return {
        "mensaje": "Servicio actualizado exitosamente.",
        "servicio": service_to_dict(service),
    }


@router.patch("/{service_id}/estado")
def toggle_service_status(
    service_id: int,
    data: ToggleStatusRequest,
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    PATCH /api/services/:id/estado
    Cambia el estado de un servicio (Admin).
    """
    service = db.query(Servicio).filter(Servicio.id == service_id).first()
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Servicio no encontrado.",
        )

    service.estado = data.estado
    db.commit()

    return {
        "mensaje": f"Servicio {data.estado.lower()} exitosamente.",
        "id": service_id,
        "estado": data.estado,
    }


@router.delete("/{service_id}")
def delete_service(
    service_id: int,
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    DELETE /api/services/:id
    Elimina un servicio (Admin).
    """
    service = db.query(Servicio).filter(Servicio.id == service_id).first()
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Servicio no encontrado.",
        )

    db.delete(service)
    db.commit()

    return {"mensaje": "Servicio eliminado exitosamente."}
