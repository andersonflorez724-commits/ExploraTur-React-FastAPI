"""
Rutas de estadísticas y dashboards.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date, extract
from datetime import datetime, date, timedelta
import calendar

from config.database import get_db
from models.models import (
    Usuario, Producto, Servicio, Vuelo, Venta, DetalleVenta, Factura, PQR, Compra
)
from middleware.auth import get_current_user, require_admin, require_admin_or_employee

router = APIRouter(prefix="/api/stats", tags=["Estadísticas"])


@router.get("/dashboard")
def dashboard_stats(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Estadísticas generales del dashboard según el rol."""
    rol = current_user["rol"]

    total_usuarios = db.query(func.count(Usuario.id)).scalar() or 0
    total_productos = db.query(func.count(Producto.id)).scalar() or 0
    total_servicios = db.query(func.count(Servicio.id)).scalar() or 0
    total_vuelos = db.query(func.count(Vuelo.id)).scalar() or 0
    total_ventas = db.query(func.count(Venta.id)).scalar() or 0
    total_facturas = db.query(func.count(Factura.id)).scalar() or 0
    total_pqr = db.query(func.count(PQR.id)).scalar() or 0
    ventas_pendientes = db.query(func.count(Venta.id)).filter(Venta.estado == "Pendiente").scalar() or 0
    pqr_pendientes = db.query(func.count(PQR.id)).filter(PQR.estado == "Pendiente").scalar() or 0

    ingresos_result = db.query(func.sum(Venta.total)).filter(Venta.estado.in_(["Confirmada", "Completada"])).scalar()
    ingresos_totales = float(ingresos_result) if ingresos_result else 0

    facturacion_result = db.query(func.sum(Factura.total)).filter(Factura.estado == "Pagada").scalar()
    facturacion_total = float(facturacion_result) if facturacion_result else 0

    usuarios_activos = db.query(func.count(Usuario.id)).filter(Usuario.estado == "Activo").scalar() or 0
    productos_activos = db.query(func.count(Producto.id)).filter(Producto.estado == "Activo").scalar() or 0
    servicios_activos = db.query(func.count(Servicio.id)).filter(Servicio.estado == "Activo").scalar() or 0
    vuelos_activos = db.query(func.count(Vuelo.id)).filter(Vuelo.estado == "Activo").scalar() or 0

    result = {
        "total_usuarios": total_usuarios,
        "total_productos": total_productos,
        "total_servicios": total_servicios,
        "total_vuelos": total_vuelos,
        "total_ventas": total_ventas,
        "total_facturas": total_facturas,
        "total_pqr": total_pqr,
        "ventas_pendientes": ventas_pendientes,
        "pqr_pendientes": pqr_pendientes,
        "ingresos_totales": ingresos_totales,
        "facturacion_total": facturacion_total,
        "usuarios_activos": usuarios_activos,
        "productos_activos": productos_activos,
        "servicios_activos": servicios_activos,
        "vuelos_activos": vuelos_activos,
    }

    if rol == "Empleado":
        result.pop("total_usuarios", None)
        result.pop("usuarios_activos", None)

    if rol == "Cliente":
        cliente_id = current_user["id"]
        mis_ventas = db.query(func.count(Venta.id)).filter(Venta.cliente_id == cliente_id).scalar() or 0
        mis_pqr = db.query(func.count(PQR.id)).filter(PQR.cliente_id == cliente_id).scalar() or 0
        result = {
            "mis_ventas": mis_ventas,
            "mis_pqr": mis_pqr,
            "total_productos": total_productos,
            "total_servicios": total_servicios,
        }

    return result


@router.get("/ventas-por-periodo")
def ventas_por_periodo(
    periodo: str = Query("diario"),
    fecha_inicio: str = Query(None),
    fecha_fin: str = Query(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin_or_employee),
):
    """Ventas agrupadas por día, semana o mes."""
    hoy = date.today()

    if not fecha_inicio:
        if periodo == "diario":
            fi = hoy - timedelta(days=30)
        elif periodo == "semanal":
            fi = hoy - timedelta(weeks=12)
        else:
            fi = hoy.replace(month=1, day=1)
    else:
        try:
            fi = datetime.strptime(fecha_inicio, "%Y-%m-%d").date()
        except ValueError:
            fi = hoy - timedelta(days=30)

    if not fecha_fin:
        ff = hoy
    else:
        try:
            ff = datetime.strptime(fecha_fin, "%Y-%m-%d").date()
        except ValueError:
            ff = hoy

    ventas = db.query(Venta).filter(
        func.date(Venta.created_at) >= fi,
        func.date(Venta.created_at) <= ff,
        Venta.estado.in_(["Confirmada", "Completada"])
    ).all()

    data = {}
    for v in ventas:
        if v.created_at:
            if periodo == "diario":
                key = v.created_at.strftime("%Y-%m-%d")
            elif periodo == "semanal":
                key = v.created_at.strftime("%Y-W%W")
            else:
                key = v.created_at.strftime("%Y-%m")

            if key not in data:
                data[key] = {"fecha": key, "cantidad": 0, "total": 0}
            data[key]["cantidad"] += 1
            data[key]["total"] += float(v.total)

    resultado = sorted(data.values(), key=lambda x: x["fecha"])

    return {"periodo": periodo, "datos": resultado}


@router.get("/ventas-por-producto")
def ventas_por_producto(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin_or_employee),
):
    """Top productos más vendidos."""
    resultados = db.query(
        DetalleVenta.item_id,
        func.sum(DetalleVenta.cantidad).label("total_cantidad"),
        func.sum(DetalleVenta.subtotal).label("total_valor")
    ).filter(
        DetalleVenta.tipo_item == "Producto"
    ).group_by(DetalleVenta.item_id).order_by(func.sum(DetalleVenta.cantidad).desc()).limit(10).all()

    data = []
    for r in resultados:
        prod = db.query(Producto).filter(Producto.id == r.item_id).first()
        data.append({
            "item_id": r.item_id,
            "nombre": prod.nombre if prod else "N/A",
            "total_cantidad": int(r.total_cantidad),
            "total_valor": float(r.total_valor),
        })

    return {"productos": data}


@router.get("/ventas-por-servicio")
def ventas_por_servicio(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin_or_employee),
):
    """Top servicios más vendidos."""
    resultados = db.query(
        DetalleVenta.item_id,
        func.sum(DetalleVenta.cantidad).label("total_cantidad"),
        func.sum(DetalleVenta.subtotal).label("total_valor")
    ).filter(
        DetalleVenta.tipo_item == "Servicio"
    ).group_by(DetalleVenta.item_id).order_by(func.sum(DetalleVenta.cantidad).desc()).limit(10).all()

    data = []
    for r in resultados:
        serv = db.query(Servicio).filter(Servicio.id == r.item_id).first()
        data.append({
            "item_id": r.item_id,
            "nombre": serv.nombre if serv else "N/A",
            "total_cantidad": int(r.total_cantidad),
            "total_valor": float(r.total_valor),
        })

    return {"servicios": data}


@router.get("/ventas-mensuales")
def ventas_mensuales(
    year: int = Query(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin_or_employee),
):
    """Ventas totales por mes del año indicado."""
    if not year:
        year = date.today().year

    meses_data = []
    for m in range(1, 13):
        count = db.query(func.count(Venta.id)).filter(
            extract("year", Venta.created_at) == year,
            extract("month", Venta.created_at) == m,
            Venta.estado.in_(["Confirmada", "Completada"])
        ).scalar() or 0

        total_result = db.query(func.sum(Venta.total)).filter(
            extract("year", Venta.created_at) == year,
            extract("month", Venta.created_at) == m,
            Venta.estado.in_(["Confirmada", "Completada"])
        ).scalar()
        total = float(total_result) if total_result else 0

        meses_data.append({
            "mes": calendar.month_name[m],
            "mes_numero": m,
            "cantidad": count,
            "total": total,
        })

    return {"year": year, "datos": meses_data}


@router.get("/resumen-ventas-hoy")
def resumen_ventas_hoy(db: Session = Depends(get_db), current_user: dict = Depends(require_admin_or_employee)):
    """Resumen de ventas del día actual."""
    hoy = date.today()

    ventas_hoy = db.query(Venta).filter(func.date(Venta.created_at) == hoy).all()
    total_ventas = len(ventas_hoy)
    total_ingresos = sum(float(v.total) for v in ventas_hoy)
    ventas_confirmadas = len([v for v in ventas_hoy if v.estado in ["Confirmada", "Completada"]])
    ventas_pendientes = len([v for v in ventas_hoy if v.estado == "Pendiente"])

    return {
        "fecha": hoy.isoformat(),
        "total_ventas": total_ventas,
        "total_ingresos": total_ingresos,
        "ventas_confirmadas": ventas_confirmadas,
        "ventas_pendientes": ventas_pendientes,
    }
