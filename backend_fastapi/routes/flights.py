"""
Rutas de gestión de vuelos.
"""

from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from config.database import get_db
from models.models import Vuelo
from schemas.schemas import FlightRequest, FlightUpdateRequest, ToggleStatusRequest
from middleware.auth import get_optional_user, require_admin

router = APIRouter(prefix="/api/flights", tags=["Flights"])


def flight_to_dict(flight: Vuelo) -> dict:
    """Convierra un vuelo a diccionario para respuesta JSON."""
    return {
        "id": flight.id,
        "aerolinea": flight.aerolinea,
        "numero_vuelo": flight.numero_vuelo,
        "origen": flight.origen,
        "codigo_origen": flight.codigo_origen,
        "destino": flight.destino,
        "codigo_destino": flight.codigo_destino,
        "fecha": str(flight.fecha) if flight.fecha else None,
        "hora_salida": flight.hora_salida,
        "hora_llegada": flight.hora_llegada,
        "duracion": flight.duracion,
        "escalas": flight.escalas,
        "precio": float(flight.precio),
        "impuesto_porcentaje": float(flight.impuesto_porcentaje or 0),
        "descuento_porcentaje": float(flight.descuento_porcentaje or 0),
        "clase": flight.clase,
        "asientos_disponibles": flight.asientos_disponibles,
        "estado": flight.estado,
        "created_at": str(flight.created_at) if flight.created_at else None,
        "updated_at": str(flight.updated_at) if flight.updated_at else None,
    }


@router.get("")
def get_all_flights(
    origen: Optional[str] = Query(None),
    destino: Optional[str] = Query(None),
    fecha: Optional[str] = Query(None),
    estado: Optional[str] = Query(None),
    busqueda: Optional[str] = Query(None),
    current_user: Optional[dict] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    """
    GET /api/flights
    Lista los vuelos. Es público: la página /vuelos se ve sin iniciar sesión,
    así que la petición anónima devuelve el catálogo activo. Un administrador
    autenticado ve además los vuelos inactivos.
    """
    query = db.query(Vuelo)

    if origen:
        term = f"%{origen}%"
        query = query.filter(
            or_(Vuelo.origen.like(term), Vuelo.codigo_origen.like(term))
        )

    if destino:
        term = f"%{destino}%"
        query = query.filter(
            or_(Vuelo.destino.like(term), Vuelo.codigo_destino.like(term))
        )

    if fecha:
        query = query.filter(Vuelo.fecha == fecha)

    if estado:
        query = query.filter(Vuelo.estado == estado)
    else:
        if (current_user or {}).get("rol") != "Administrador":
            query = query.filter(Vuelo.estado == "Activo")

    if busqueda:
        term = f"%{busqueda}%"
        query = query.filter(
            or_(
                Vuelo.aerolinea.like(term),
                Vuelo.numero_vuelo.like(term),
                Vuelo.origen.like(term),
                Vuelo.destino.like(term),
            )
        )

    query = query.order_by(Vuelo.fecha.asc(), Vuelo.hora_salida.asc())
    flights = query.all()

    return {
        "vuelos": [flight_to_dict(f) for f in flights],
        "total": len(flights),
    }


@router.get("/{flight_id}")
def get_flight_by_id(
    flight_id: int,
    current_user: Optional[dict] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    """
    GET /api/flights/:id
    Obtiene un vuelo por ID (público, igual que el listado).
    """
    flight = db.query(Vuelo).filter(Vuelo.id == flight_id).first()
    if not flight:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vuelo no encontrado.",
        )

    return {"vuelo": flight_to_dict(flight)}


@router.post("")
def create_flight(
    data: FlightRequest,
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    POST /api/flights
    Crea un nuevo vuelo (solo Admin).
    """
    try:
        fecha = datetime.strptime(data.fecha, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La fecha debe tener formato válido (YYYY-MM-DD).",
        )

    flight = Vuelo(
        aerolinea=data.aerolinea,
        numero_vuelo=data.numero_vuelo,
        origen=data.origen,
        codigo_origen=data.codigo_origen,
        destino=data.destino,
        codigo_destino=data.codigo_destino,
        fecha=fecha,
        hora_salida=data.hora_salida,
        hora_llegada=data.hora_llegada,
        duracion=data.duracion,
        escalas=data.escalas or "Directo",
        precio=data.precio,
        impuesto_porcentaje=data.impuesto_porcentaje,
        descuento_porcentaje=data.descuento_porcentaje,
        clase=data.clase or "Económica",
        asientos_disponibles=data.asientos_disponibles or 50,
    )
    db.add(flight)
    db.commit()
    db.refresh(flight)

    return {
        "mensaje": "Vuelo creado exitosamente.",
        "vuelo": flight_to_dict(flight),
    }


@router.put("/{flight_id}")
def update_flight(
    flight_id: int,
    data: FlightUpdateRequest,
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    PUT /api/flights/:id
    Actualiza un vuelo (solo Admin).
    """
    flight = db.query(Vuelo).filter(Vuelo.id == flight_id).first()
    if not flight:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vuelo no encontrado.",
        )

    try:
        fecha = datetime.strptime(data.fecha, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La fecha debe tener formato válido (YYYY-MM-DD).",
        )

    flight.aerolinea = data.aerolinea
    flight.numero_vuelo = data.numero_vuelo
    flight.origen = data.origen
    flight.codigo_origen = data.codigo_origen
    flight.destino = data.destino
    flight.codigo_destino = data.codigo_destino
    flight.fecha = fecha
    flight.hora_salida = data.hora_salida
    flight.hora_llegada = data.hora_llegada
    flight.duracion = data.duracion
    flight.escalas = data.escalas or "Directo"
    flight.precio = data.precio
    flight.impuesto_porcentaje = data.impuesto_porcentaje
    flight.descuento_porcentaje = data.descuento_porcentaje
    flight.clase = data.clase or "Económica"
    flight.asientos_disponibles = data.asientos_disponibles or 50
    flight.estado = data.estado or "Activo"

    db.commit()
    db.refresh(flight)

    return {
        "mensaje": "Vuelo actualizado exitosamente.",
        "vuelo": flight_to_dict(flight),
    }


@router.patch("/{flight_id}/estado")
def toggle_flight_status(
    flight_id: int,
    data: ToggleStatusRequest,
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    PATCH /api/flights/:id/estado
    Cambia el estado de un vuelo (solo Admin).
    """
    flight = db.query(Vuelo).filter(Vuelo.id == flight_id).first()
    if not flight:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vuelo no encontrado.",
        )

    flight.estado = data.estado
    db.commit()

    return {
        "mensaje": f"Vuelo {data.estado.lower()} exitosamente.",
        "id": flight_id,
        "estado": data.estado,
    }


@router.delete("/{flight_id}")
def delete_flight(
    flight_id: int,
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    DELETE /api/flights/:id
    Elimina un vuelo (solo Admin).
    """
    flight = db.query(Vuelo).filter(Vuelo.id == flight_id).first()
    if not flight:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vuelo no encontrado.",
        )

    db.delete(flight)
    db.commit()

    return {"mensaje": "Vuelo eliminado exitosamente."}
