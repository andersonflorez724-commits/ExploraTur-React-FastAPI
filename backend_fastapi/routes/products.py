"""
Rutas de gestión de productos.
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from config.database import get_db
from models.models import Producto, Categoria
from schemas.schemas import ProductRequest, ProductUpdateRequest, ToggleStatusRequest
from middleware.auth import get_current_user, require_admin, require_admin_or_employee

router = APIRouter(prefix="/api/products", tags=["Products"])


def product_to_dict(product: Producto, categoria: Categoria = None) -> dict:
    """Convierte un producto a diccionario para respuesta JSON."""
    return {
        "id": product.id,
        "nombre": product.nombre,
        "descripcion": product.descripcion,
        "precio": float(product.precio),
        "categoria_id": product.categoria_id,
        "categoria_nombre": categoria.nombre if categoria else None,
        "imagen_url": product.imagen_url,
        "estado": product.estado,
        "stock": product.stock,
        "created_at": str(product.created_at) if product.created_at else None,
        "updated_at": str(product.updated_at) if product.updated_at else None,
    }


@router.get("")
def get_all_products(
    categoria: Optional[str] = Query(None),
    estado: Optional[str] = Query(None),
    busqueda: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    GET /api/products
    Lista todos los productos (público para clientes autenticados).
    """
    query = db.query(Producto).outerjoin(Categoria, Producto.categoria_id == Categoria.id)

    if categoria:
        query = query.filter(Categoria.nombre == categoria)

    if estado:
        query = query.filter(Producto.estado == estado)
    else:
        # Por defecto solo mostrar activos (a menos que sea admin buscando todos)
        if current_user.get("rol") != "Administrador":
            query = query.filter(Producto.estado == "Activo")

    if busqueda:
        term = f"%{busqueda}%"
        query = query.filter(
            or_(
                Producto.nombre.like(term),
                Producto.descripcion.like(term),
            )
        )

    query = query.order_by(Producto.created_at.desc())
    products = query.all()

    result = []
    for p in products:
        cat = db.query(Categoria).filter(Categoria.id == p.categoria_id).first() if p.categoria_id else None
        result.append(product_to_dict(p, cat))

    return {"productos": result, "total": len(result)}


@router.get("/categories")
def get_categories(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    GET /api/products/categories
    Lista todas las categorías.
    """
    categories = db.query(Categoria).order_by(Categoria.id).all()
    return {
        "categorias": [
            {"id": c.id, "nombre": c.nombre, "descripcion": c.descripcion}
            for c in categories
        ]
    }


@router.get("/{product_id}")
def get_product_by_id(
    product_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    GET /api/products/:id
    Obtiene un producto por ID.
    """
    product = db.query(Producto).filter(Producto.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado.",
        )

    cat = db.query(Categoria).filter(Categoria.id == product.categoria_id).first() if product.categoria_id else None

    return {"producto": product_to_dict(product, cat)}


@router.post("")
def create_product(
    data: ProductRequest,
    current_user: dict = Depends(require_admin_or_employee),
    db: Session = Depends(get_db),
):
    """
    POST /api/products
    Crea un nuevo producto (Admin/Empleado).
    """
    product = Producto(
        nombre=data.nombre,
        descripcion=data.descripcion,
        precio=data.precio,
        categoria_id=data.categoria_id,
        imagen_url=data.imagen_url,
        stock=data.stock,
    )
    db.add(product)
    db.commit()
    db.refresh(product)

    cat = db.query(Categoria).filter(Categoria.id == product.categoria_id).first() if product.categoria_id else None

    return {
        "mensaje": "Producto creado exitosamente.",
        "producto": product_to_dict(product, cat),
    }


@router.put("/{product_id}")
def update_product(
    product_id: int,
    data: ProductUpdateRequest,
    current_user: dict = Depends(require_admin_or_employee),
    db: Session = Depends(get_db),
):
    """
    PUT /api/products/:id
    Actualiza un producto.
    """
    product = db.query(Producto).filter(Producto.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado.",
        )

    product.nombre = data.nombre
    product.descripcion = data.descripcion
    product.precio = data.precio
    product.categoria_id = data.categoria_id
    product.imagen_url = data.imagen_url
    product.stock = data.stock
    product.estado = data.estado or "Activo"

    db.commit()
    db.refresh(product)

    cat = db.query(Categoria).filter(Categoria.id == product.categoria_id).first() if product.categoria_id else None

    return {
        "mensaje": "Producto actualizado exitosamente.",
        "producto": product_to_dict(product, cat),
    }


@router.patch("/{product_id}/estado")
def toggle_product_status(
    product_id: int,
    data: ToggleStatusRequest,
    current_user: dict = Depends(require_admin_or_employee),
    db: Session = Depends(get_db),
):
    """
    PATCH /api/products/:id/estado
    Cambia el estado de un producto.
    """
    product = db.query(Producto).filter(Producto.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado.",
        )

    product.estado = data.estado
    db.commit()

    return {
        "mensaje": f"Producto {data.estado.lower()} exitosamente.",
        "id": product_id,
        "estado": data.estado,
    }


@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    DELETE /api/products/:id
    Elimina un producto (solo Admin).
    """
    product = db.query(Producto).filter(Producto.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado.",
        )

    db.delete(product)
    db.commit()

    return {"mensaje": "Producto eliminado exitosamente."}
