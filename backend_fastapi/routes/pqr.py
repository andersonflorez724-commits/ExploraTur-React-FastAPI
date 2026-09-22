"""
Rutas de PQR (Peticiones, Quejas, Reclamos).
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date

from config.database import get_db
from models.models import PQR, Usuario
from schemas.schemas import PQRRequest, PQREsponse, PQRUpdateEstado, PQRUpdateAsignacion
from middleware.auth import get_current_user, require_admin, require_admin_or_employee

router = APIRouter(prefix="/api/pqr", tags=["PQR"])


def generar_numero_pqr(db: Session) -> str:
    """Genera un número de PQR único."""
    today = date.today().strftime("%Y%m%d")
    count = db.query(func.count(PQR.id)).filter(
        func.date(PQR.created_at) == date.today()
    ).scalar() or 0
    return f"PQR-{today}-{count + 1:04d}"


def pqr_to_dict(pqr: PQR, db: Session = None) -> dict:
    """Convierte un objeto PQR a diccionario."""
    cliente_nombre = None
    usuario_asignado_nombre = None

    if pqr.cliente_id and db:
        cliente = db.query(Usuario).filter(Usuario.id == pqr.cliente_id).first()
        if cliente:
            cliente_nombre = f"{cliente.nombre} {cliente.apellido}"

    if pqr.usuario_asignado_id and db:
        usuario = db.query(Usuario).filter(Usuario.id == pqr.usuario_asignado_id).first()
        if usuario:
            usuario_asignado_nombre = f"{usuario.nombre} {usuario.apellido}"

    return {
        "id": pqr.id,
        "numero_pqr": pqr.numero_pqr,
        "cliente_id": pqr.cliente_id,
        "cliente_nombre": cliente_nombre,
        "usuario_asignado_id": pqr.usuario_asignado_id,
        "usuario_asignado_nombre": usuario_asignado_nombre,
        "tipo": pqr.tipo,
        "asunto": pqr.asunto,
        "descripcion": pqr.descripcion,
        "estado": pqr.estado,
        "respuesta": pqr.respuesta,
        "created_at": pqr.created_at.isoformat() if pqr.created_at else None,
        "updated_at": pqr.updated_at.isoformat() if pqr.updated_at else None,
    }


@router.post("")
def crear_pqr(data: PQRRequest, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Crea un nuevo PQR."""
    numero = generar_numero_pqr(db)

    pqr = PQR(
        numero_pqr=numero,
        cliente_id=current_user["id"],
        tipo=data.tipo,
        asunto=data.asunto,
        descripcion=data.descripcion,
        estado="Pendiente",
    )
    db.add(pqr)
    db.commit()
    db.refresh(pqr)

    return {"mensaje": "PQR registrado exitosamente.", "pqr": pqr_to_dict(pqr, db)}


@router.get("")
def listar_pqr(
    estado: str = Query(None),
    tipo: str = Query(None),
    busqueda: str = Query(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Lista PQRs con filtros. Clientes ven solo los suyos."""
    query = db.query(PQR)

    if current_user["rol"] == "Cliente":
        query = query.filter(PQR.cliente_id == current_user["id"])

    if estado:
        query = query.filter(PQR.estado == estado)

    if tipo:
        query = query.filter(PQR.tipo == tipo)

    if busqueda:
        query = query.join(Usuario, PQR.cliente_id == Usuario.id, isouter=True).filter(
            (PQR.numero_pqr.ilike(f"%{busqueda}%")) |
            (PQR.asunto.ilike(f"%{busqueda}%")) |
            (Usuario.nombre.ilike(f"%{busqueda}%")) |
            (Usuario.apellido.ilike(f"%{busqueda}%"))
        )

    pqr_list = query.order_by(PQR.created_at.desc()).all()
    return {"pqr": [pqr_to_dict(p, db) for p in pqr_list]}


@router.get("/estadisticas")
def estadisticas_pqr(db: Session = Depends(get_db), current_user: dict = Depends(require_admin_or_employee)):
    """Retorna estadísticas de PQR."""
    total = db.query(func.count(PQR.id)).scalar() or 0
    pendientes = db.query(func.count(PQR.id)).filter(PQR.estado == "Pendiente").scalar() or 0
    en_proceso = db.query(func.count(PQR.id)).filter(PQR.estado == "En Proceso").scalar() or 0
    respondidas = db.query(func.count(PQR.id)).filter(PQR.estado == "Respondida").scalar() or 0
    cerradas = db.query(func.count(PQR.id)).filter(PQR.estado == "Cerrada").scalar() or 0

    peticiones = db.query(func.count(PQR.id)).filter(PQR.tipo == "Peticion").scalar() or 0
    quejas = db.query(func.count(PQR.id)).filter(PQR.tipo == "Queja").scalar() or 0
    reclamos = db.query(func.count(PQR.id)).filter(PQR.tipo == "Reclamo").scalar() or 0
    solicitudes = db.query(func.count(PQR.id)).filter(PQR.tipo == "Solicitud").scalar() or 0

    return {
        "total": total,
        "por_estado": {
            "Pendiente": pendientes,
            "En Proceso": en_proceso,
            "Respondida": respondidas,
            "Cerrada": cerradas,
        },
        "por_tipo": {
            "Peticion": peticiones,
            "Queja": quejas,
            "Reclamo": reclamos,
            "Solicitud": solicitudes,
        },
    }


@router.get("/{pqr_id}")
def obtener_pqr(pqr_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Obtiene un PQR por ID."""
    pqr = db.query(PQR).filter(PQR.id == pqr_id).first()
    if not pqr:
        raise HTTPException(status_code=404, detail="PQR no encontrado.")

    if current_user["rol"] == "Cliente" and pqr.cliente_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="No autorizado.")

    return {"pqr": pqr_to_dict(pqr, db)}


@router.patch("/{pqr_id}/estado")
def actualizar_estado_pqr(pqr_id: int, data: PQRUpdateEstado, db: Session = Depends(get_db), current_user: dict = Depends(require_admin_or_employee)):
    """Actualiza el estado y/o respuesta de un PQR."""
    pqr = db.query(PQR).filter(PQR.id == pqr_id).first()
    if not pqr:
        raise HTTPException(status_code=404, detail="PQR no encontrado.")

    pqr.estado = data.estado
    if data.respuesta:
        pqr.respuesta = data.respuesta

    db.commit()
    db.refresh(pqr)

    return {"mensaje": f"PQR actualizado a estado '{data.estado}'.", "pqr": pqr_to_dict(pqr, db)}


@router.patch("/{pqr_id}/asignar")
def asignar_pqr(pqr_id: int, data: PQRUpdateAsignacion, db: Session = Depends(get_db), current_user: dict = Depends(require_admin)):
    """Asigna un PQR a un usuario (solo admin)."""
    pqr = db.query(PQR).filter(PQR.id == pqr_id).first()
    if not pqr:
        raise HTTPException(status_code=404, detail="PQR no encontrado.")

    usuario = db.query(Usuario).filter(Usuario.id == data.usuario_asignado_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")

    pqr.usuario_asignado_id = data.usuario_asignado_id
    if pqr.estado == "Pendiente":
        pqr.estado = "En Proceso"

    db.commit()
    db.refresh(pqr)

    return {"mensaje": f"PQR asignado a {usuario.nombre} {usuario.apellido}.", "pqr": pqr_to_dict(pqr, db)}
