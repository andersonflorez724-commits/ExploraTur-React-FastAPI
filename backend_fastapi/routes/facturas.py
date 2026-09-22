"""
Rutas de facturación - Generar, consultar y gestionar facturas.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, date, timedelta
import decimal

from config.database import get_db
from models.models import Factura, Venta, DetalleVenta, Usuario, Producto, Servicio, Vuelo
from schemas.schemas import FacturaRequest, FacturaResponse, FacturaUpdateEstado
from middleware.auth import get_current_user, require_admin, require_admin_or_employee
from routes.ventas import resolver_nombre_item

router = APIRouter(prefix="/api/facturas", tags=["Facturas"])


def generar_numero_factura(db: Session) -> str:
    """Genera un número de factura único."""
    today = date.today().strftime("%Y%m%d")
    count = db.query(func.count(Factura.id)).filter(
        func.date(Factura.created_at) == date.today()
    ).scalar() or 0
    return f"FAC-{today}-{count + 1:04d}"


def factura_to_dict(factura: Factura, db: Session = None) -> dict:
    """Convierte un objeto Factura a diccionario."""
    cliente_nombre = None
    usuario_nombre = None

    if factura.cliente_id and db:
        cliente = db.query(Usuario).filter(Usuario.id == factura.cliente_id).first()
        if cliente:
            cliente_nombre = f"{cliente.nombre} {cliente.apellido}"

    if factura.usuario_id and db:
        usuario = db.query(Usuario).filter(Usuario.id == factura.usuario_id).first()
        if usuario:
            usuario_nombre = f"{usuario.nombre} {usuario.apellido}"

    return {
        "id": factura.id,
        "numero_factura": factura.numero_factura,
        "venta_id": factura.venta_id,
        "cliente_id": factura.cliente_id,
        "cliente_nombre": cliente_nombre,
        "usuario_nombre": usuario_nombre,
        "subtotal": float(factura.subtotal),
        "impuestos": float(factura.impuestos),
        "descuento": float(factura.descuento),
        "total": float(factura.total),
        "estado": factura.estado,
        "fecha_vencimiento": factura.fecha_vencimiento.isoformat() if factura.fecha_vencimiento else None,
        "created_at": factura.created_at.isoformat() if factura.created_at else None,
    }


def factura_completa_to_dict(factura: Factura, db: Session) -> dict:
    """Convierte factura con información de la venta asociada."""
    result = factura_to_dict(factura, db)

    venta = db.query(Venta).filter(Venta.id == factura.venta_id).first()
    if venta:
        detalles = []
        for d in (venta.detalles if hasattr(venta, 'detalles') and venta.detalles else []):
            item_nombre = resolver_nombre_item(db, d.tipo_item, d.item_id)
            detalles.append({
                "tipo": d.tipo_item,
                "nombre": item_nombre,
                "cantidad": d.cantidad,
                "precio_unitario": float(d.precio_unitario),
                "descuento": float(d.descuento),
                "subtotal": float(d.subtotal),
            })
        result["detalles_venta"] = detalles

    return result


@router.post("")
def crear_factura(data: FacturaRequest, db: Session = Depends(get_db), current_user: dict = Depends(require_admin_or_employee)):
    """Genera una factura a partir de una venta."""
    venta = db.query(Venta).filter(Venta.id == data.venta_id).first()
    if not venta:
        raise HTTPException(status_code=404, detail="Venta no encontrada.")

    existing = db.query(Factura).filter(Factura.venta_id == data.venta_id).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Ya existe una factura para la venta #{data.venta_id}.")

    numero = generar_numero_factura(db)

    fecha_venc = None
    if data.fecha_vencimiento:
        try:
            fecha_venc = datetime.strptime(data.fecha_vencimiento, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Formato de fecha inválido.")
    else:
        fecha_venc = date.today() + timedelta(days=30)

    cliente_id = data.cliente_id or venta.cliente_id

    factura = Factura(
        numero_factura=numero,
        venta_id=venta.id,
        cliente_id=cliente_id,
        usuario_id=current_user["id"],
        subtotal=venta.subtotal,
        impuestos=venta.impuestos,
        descuento=venta.descuento,
        total=venta.total,
        estado="Pendiente",
        fecha_vencimiento=fecha_venc,
    )
    db.add(factura)
    db.commit()
    db.refresh(factura)

    return {"mensaje": "Factura generada exitosamente.", "factura": factura_to_dict(factura, db)}


@router.get("")
def listar_facturas(
    cliente_id: int = Query(None),
    estado: str = Query(None),
    fecha_inicio: str = Query(None),
    fecha_fin: str = Query(None),
    busqueda: str = Query(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Lista facturas con filtros opcionales."""
    query = db.query(Factura)

    if current_user["rol"] == "Cliente":
        query = query.filter(Factura.cliente_id == current_user["id"])

    if cliente_id:
        query = query.filter(Factura.cliente_id == cliente_id)

    if estado:
        query = query.filter(Factura.estado == estado)

    if fecha_inicio:
        try:
            fi = datetime.strptime(fecha_inicio, "%Y-%m-%d").date()
            query = query.filter(func.date(Factura.created_at) >= fi)
        except ValueError:
            pass

    if fecha_fin:
        try:
            ff = datetime.strptime(fecha_fin, "%Y-%m-%d").date()
            query = query.filter(func.date(Factura.created_at) <= ff)
        except ValueError:
            pass

    if busqueda:
        query = query.join(Usuario, Factura.cliente_id == Usuario.id, isouter=True).filter(
            (Factura.numero_factura.ilike(f"%{busqueda}%")) |
            (Usuario.nombre.ilike(f"%{busqueda}%")) |
            (Usuario.apellido.ilike(f"%{busqueda}%"))
        )

    facturas = query.order_by(Factura.created_at.desc()).all()
    return {"facturas": [factura_to_dict(f, db) for f in facturas]}


@router.get("/{factura_id}")
def obtener_factura(factura_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Obtiene una factura por ID con detalles completos."""
    factura = db.query(Factura).filter(Factura.id == factura_id).first()
    if not factura:
        raise HTTPException(status_code=404, detail="Factura no encontrada.")

    if current_user["rol"] == "Cliente" and factura.cliente_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="No autorizado.")

    return {"factura": factura_completa_to_dict(factura, db)}


@router.get("/por-numero/{numero_factura}")
def obtener_factura_por_numero(numero_factura: str, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Obtiene una factura por su número."""
    factura = db.query(Factura).filter(Factura.numero_factura == numero_factura).first()
    if not factura:
        raise HTTPException(status_code=404, detail="Factura no encontrada.")

    return {"factura": factura_completa_to_dict(factura, db)}


@router.patch("/{factura_id}/estado")
def actualizar_estado_factura(factura_id: int, data: FacturaUpdateEstado, db: Session = Depends(get_db), current_user: dict = Depends(require_admin_or_employee)):
    """Actualiza el estado de una factura."""
    factura = db.query(Factura).filter(Factura.id == factura_id).first()
    if not factura:
        raise HTTPException(status_code=404, detail="Factura no encontrada.")

    factura.estado = data.estado
    db.commit()
    db.refresh(factura)

    return {"mensaje": f"Estado de factura actualizado a '{data.estado}'.", "factura": factura_to_dict(factura, db)}
