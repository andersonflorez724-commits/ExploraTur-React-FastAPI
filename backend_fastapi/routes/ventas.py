"""
Rutas de ventas - Registro, consulta, historial y reportes.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date
from datetime import datetime, date
import decimal

from config.database import get_db
from models.models import Venta, DetalleVenta, Usuario, Producto, Servicio
from schemas.schemas import (
    VentaRequest, VentaResponse, VentaUpdateEstado, ReporteDiarioRequest
)
from middleware.auth import get_current_user, require_admin, require_admin_or_employee

router = APIRouter(prefix="/api/ventas", tags=["Ventas"])


def generar_numero_venta(db: Session) -> str:
    """Genera un número de venta único."""
    today = date.today().strftime("%Y%m%d")
    count = db.query(func.count(Venta.id)).filter(
        func.date(Venta.created_at) == date.today()
    ).scalar() or 0
    return f"VTA-{today}-{count + 1:04d}"


def venta_to_dict(venta: Venta, db: Session = None) -> dict:
    """Convierte un objeto Venta a diccionario."""
    cliente_nombre = None
    usuario_nombre = None

    if venta.cliente_id and db:
        cliente = db.query(Usuario).filter(Usuario.id == venta.cliente_id).first()
        if cliente:
            cliente_nombre = f"{cliente.nombre} {cliente.apellido}"

    if venta.usuario_id and db:
        usuario = db.query(Usuario).filter(Usuario.id == venta.usuario_id).first()
        if usuario:
            usuario_nombre = f"{usuario.nombre} {usuario.apellido}"

    detalles = []
    if hasattr(venta, 'detalles') and venta.detalles:
        for d in venta.detalles:
            item_nombre = ""
            if db:
                if d.tipo_item == "Producto":
                    prod = db.query(Producto).filter(Producto.id == d.item_id).first()
                    item_nombre = prod.nombre if prod else "Producto eliminado"
                elif d.tipo_item == "Servicio":
                    serv = db.query(Servicio).filter(Servicio.id == d.item_id).first()
                    item_nombre = serv.nombre if serv else "Servicio eliminado"

            detalles.append({
                "id": d.id,
                "tipo_item": d.tipo_item,
                "item_id": d.item_id,
                "item_nombre": item_nombre,
                "cantidad": d.cantidad,
                "precio_unitario": float(d.precio_unitario),
                "descuento": float(d.descuento),
                "subtotal": float(d.subtotal),
            })

    return {
        "id": venta.id,
        "numero_venta": f"VTA-{venta.created_at.strftime('%Y%m%d')}-{venta.id:04d}" if venta.created_at else None,
        "usuario_id": venta.usuario_id,
        "cliente_id": venta.cliente_id,
        "cliente_nombre": cliente_nombre,
        "usuario_nombre": usuario_nombre,
        "subtotal": float(venta.subtotal),
        "impuestos": float(venta.impuestos),
        "descuento": float(venta.descuento),
        "total": float(venta.total),
        "estado": venta.estado,
        "observaciones": venta.observaciones,
        "detalles": detalles,
        "created_at": venta.created_at.isoformat() if venta.created_at else None,
    }


@router.post("")
def crear_venta(data: VentaRequest, db: Session = Depends(get_db), current_user: dict = Depends(require_admin_or_employee)):
    """Crea una nueva venta."""
    subtotal_venta = decimal.Decimal("0")

    for item in data.detalles:
        if item.tipo_item == "Producto":
            producto = db.query(Producto).filter(Producto.id == item.item_id).first()
            if not producto:
                raise HTTPException(status_code=404, detail=f"Producto con id {item.item_id} no encontrado.")
            if producto.estado != "Activo":
                raise HTTPException(status_code=400, detail=f"Producto '{producto.nombre}' no está activo.")
            if producto.stock < item.cantidad:
                raise HTTPException(status_code=400, detail=f"Stock insuficiente para '{producto.nombre}'. Stock disponible: {producto.stock}")
        elif item.tipo_item == "Servicio":
            servicio = db.query(Servicio).filter(Servicio.id == item.item_id).first()
            if not servicio:
                raise HTTPException(status_code=404, detail=f"Servicio con id {item.item_id} no encontrado.")
            if servicio.estado != "Activo":
                raise HTTPException(status_code=400, detail=f"Servicio '{servicio.nombre}' no está activo.")
        else:
            raise HTTPException(status_code=400, detail="Tipo de item no válido.")

        item_subtotal = decimal.Decimal(str(item.precio_unitario)) * item.cantidad - decimal.Decimal(str(item.descuento))
        subtotal_venta += item_subtotal

    impuestos = decimal.Decimal(str(data.impuestos))
    descuento = decimal.Decimal(str(data.descuento))
    total = subtotal_venta + impuestos - descuento

    venta = Venta(
        usuario_id=current_user["id"],
        cliente_id=data.cliente_id,
        subtotal=subtotal_venta,
        impuestos=impuestos,
        descuento=descuento,
        total=total,
        estado="Pendiente",
        observaciones=data.observaciones,
    )
    db.add(venta)
    db.flush()

    for item in data.detalles:
        item_subtotal = decimal.Decimal(str(item.precio_unitario)) * item.cantidad - decimal.Decimal(str(item.descuento))
        detalle = DetalleVenta(
            venta_id=venta.id,
            tipo_item=item.tipo_item,
            item_id=item.item_id,
            cantidad=item.cantidad,
            precio_unitario=decimal.Decimal(str(item.precio_unitario)),
            descuento=decimal.Decimal(str(item.descuento)),
            subtotal=item_subtotal,
        )
        db.add(detalle)

        if item.tipo_item == "Producto":
            producto = db.query(Producto).filter(Producto.id == item.item_id).first()
            if producto:
                producto.stock -= item.cantidad

    db.commit()
    db.refresh(venta)

    return {"mensaje": "Venta creada exitosamente.", "venta": venta_to_dict(venta, db)}


@router.get("")
def listar_ventas(
    fecha_inicio: str = Query(None),
    fecha_fin: str = Query(None),
    cliente_id: int = Query(None),
    estado: str = Query(None),
    busqueda: str = Query(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Lista ventas con filtros opcionales."""
    query = db.query(Venta)

    if current_user["rol"] == "Cliente":
        query = query.filter(Venta.cliente_id == current_user["id"])

    if fecha_inicio:
        try:
            fi = datetime.strptime(fecha_inicio, "%Y-%m-%d").date()
            query = query.filter(func.date(Venta.created_at) >= fi)
        except ValueError:
            pass

    if fecha_fin:
        try:
            ff = datetime.strptime(fecha_fin, "%Y-%m-%d").date()
            query = query.filter(func.date(Venta.created_at) <= ff)
        except ValueError:
            pass

    if cliente_id:
        query = query.filter(Venta.cliente_id == cliente_id)

    if estado:
        query = query.filter(Venta.estado == estado)

    if busqueda:
        query = query.join(Usuario, Venta.cliente_id == Usuario.id, isouter=True).filter(
            (Usuario.nombre.ilike(f"%{busqueda}%")) |
            (Usuario.apellido.ilike(f"%{busqueda}%")) |
            (Usuario.email.ilike(f"%{busqueda}%"))
        )

    ventas = query.order_by(Venta.created_at.desc()).all()
    return {"ventas": [venta_to_dict(v, db) for v in ventas]}


@router.get("/reporte-diario")
def reporte_diario(
    fecha: str = Query(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin_or_employee),
):
    """Genera reporte diario de ventas."""
    try:
        fecha_date = datetime.strptime(fecha, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Formato de fecha inválido. Use YYYY-MM-DD.")

    ventas = db.query(Venta).filter(func.date(Venta.created_at) == fecha_date).all()

    total_ventas = len(ventas)
    total_ingresos = sum(float(v.total) for v in ventas)
    total_impuestos = sum(float(v.impuestos) for v in ventas)
    total_descuentos = sum(float(v.descuento) for v in ventas)

    ventas_detalle = []
    for v in ventas:
        cliente_nombre = "Sin cliente"
        if v.cliente_id:
            cliente = db.query(Usuario).filter(Usuario.id == v.cliente_id).first()
            if cliente:
                cliente_nombre = f"{cliente.nombre} {cliente.apellido}"

        items = []
        for d in (v.detalles if hasattr(v, 'detalles') and v.detalles else []):
            item_nombre = ""
            if d.tipo_item == "Producto":
                prod = db.query(Producto).filter(Producto.id == d.item_id).first()
                item_nombre = prod.nombre if prod else "N/A"
            elif d.tipo_item == "Servicio":
                serv = db.query(Servicio).filter(Servicio.id == d.item_id).first()
                item_nombre = serv.nombre if serv else "N/A"
            items.append({
                "tipo": d.tipo_item,
                "nombre": item_nombre,
                "cantidad": d.cantidad,
                "precio": float(d.precio_unitario),
                "subtotal": float(d.subtotal),
            })

        ventas_detalle.append({
            "id": v.id,
            "numero_venta": f"VTA-{v.created_at.strftime('%Y%m%d')}-{v.id:04d}" if v.created_at else f"VTA-{v.id}",
            "cliente": cliente_nombre,
            "items": items,
            "subtotal": float(v.subtotal),
            "impuestos": float(v.impuestos),
            "descuento": float(v.descuento),
            "total": float(v.total),
            "estado": v.estado,
            "hora": v.created_at.strftime("%H:%M") if v.created_at else "",
        })

    return {
        "fecha": fecha,
        "resumen": {
            "total_ventas": total_ventas,
            "total_ingresos": total_ingresos,
            "total_impuestos": total_impuestos,
            "total_descuentos": total_descuentos,
        },
        "ventas": ventas_detalle,
    }


@router.get("/{venta_id}")
def obtener_venta(venta_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Obtiene una venta por ID."""
    venta = db.query(Venta).filter(Venta.id == venta_id).first()
    if not venta:
        raise HTTPException(status_code=404, detail="Venta no encontrada.")

    if current_user["rol"] == "Cliente" and venta.cliente_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="No autorizado.")

    return {"venta": venta_to_dict(venta, db)}


@router.patch("/{venta_id}/estado")
def actualizar_estado_venta(venta_id: int, data: VentaUpdateEstado, db: Session = Depends(get_db), current_user: dict = Depends(require_admin_or_employee)):
    """Actualiza el estado de una venta."""
    venta = db.query(Venta).filter(Venta.id == venta_id).first()
    if not venta:
        raise HTTPException(status_code=404, detail="Venta no encontrada.")

    venta.estado = data.estado
    db.commit()
    db.refresh(venta)

    return {"mensaje": f"Estado de venta actualizado a '{data.estado}'.", "venta": venta_to_dict(venta, db)}
