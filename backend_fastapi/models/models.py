"""
Modelos SQLAlchemy que representan las tablas de la base de datos.
"""

from sqlalchemy import (
    Column, Integer, String, Text, Enum, ForeignKey, DECIMAL, TIMESTAMP, Date
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from config.database import Base


class Rol(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(50), nullable=False, unique=True)
    descripcion = Column(String(255), nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())

    usuarios = relationship("Usuario", back_populates="rol")


class Permiso(Base):
    __tablename__ = "permisos"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(100), nullable=False, unique=True)
    descripcion = Column(String(255), nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())


class RolPermiso(Base):
    __tablename__ = "rol_permiso"

    rol_id = Column(Integer, ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True)
    permiso_id = Column(Integer, ForeignKey("permisos.id", ondelete="CASCADE"), primary_key=True)


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(100), nullable=False)
    apellido = Column(String(100), nullable=False)
    tipo_documento = Column(Enum("CC", "TI", "CE", "NIT", "PA", name="tipo_documento_enum"), nullable=False)
    numero_documento = Column(String(20), nullable=False, unique=True)
    direccion = Column(String(200), nullable=False)
    telefono = Column(String(20), nullable=False)
    email = Column(String(150), nullable=False, unique=True)
    password_hash = Column(String(255), nullable=False)
    rol_id = Column(Integer, ForeignKey("roles.id", ondelete="RESTRICT"), nullable=False, default=3)
    estado = Column(Enum("Activo", "Inactivo", name="estado_usuario_enum"), nullable=False, default="Activo")
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, server_default=func.current_timestamp(), onupdate=func.current_timestamp())

    rol = relationship("Rol", back_populates="usuarios")


class Categoria(Base):
    __tablename__ = "categorias"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(100), nullable=False, unique=True)
    descripcion = Column(String(255), nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())

    productos = relationship("Producto", back_populates="categoria")


class Producto(Base):
    __tablename__ = "productos"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(200), nullable=False)
    descripcion = Column(Text, nullable=True)
    precio = Column(DECIMAL(12, 2), nullable=False)
    categoria_id = Column(Integer, ForeignKey("categorias.id", ondelete="SET NULL"), nullable=True)
    imagen_url = Column(String(500), nullable=True)
    estado = Column(Enum("Activo", "Inactivo", name="estado_producto_enum"), nullable=False, default="Activo")
    stock = Column(Integer, default=0)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, server_default=func.current_timestamp(), onupdate=func.current_timestamp())

    categoria = relationship("Categoria", back_populates="productos")


class Servicio(Base):
    __tablename__ = "servicios"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(200), nullable=False)
    descripcion = Column(Text, nullable=True)
    precio = Column(DECIMAL(12, 2), nullable=False)
    estado = Column(Enum("Activo", "Inactivo", name="estado_servicio_enum"), nullable=False, default="Activo")
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, server_default=func.current_timestamp(), onupdate=func.current_timestamp())


class Compra(Base):
    __tablename__ = "compras"

    id = Column(Integer, primary_key=True, autoincrement=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="RESTRICT"), nullable=False)
    producto_id = Column(Integer, ForeignKey("productos.id", ondelete="RESTRICT"), nullable=False)
    cantidad = Column(Integer, nullable=False, default=1)
    total = Column(DECIMAL(12, 2), nullable=False)
    estado = Column(Enum("Pendiente", "Confirmada", "Cancelada", name="estado_compra_enum"), nullable=False, default="Confirmada")
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())


class Vuelo(Base):
    __tablename__ = "vuelos"

    id = Column(Integer, primary_key=True, autoincrement=True)
    aerolinea = Column(String(100), nullable=False)
    numero_vuelo = Column(String(20), nullable=False)
    origen = Column(String(100), nullable=False)
    codigo_origen = Column(String(10), nullable=False)
    destino = Column(String(100), nullable=False)
    codigo_destino = Column(String(10), nullable=False)
    fecha = Column(Date, nullable=False)
    hora_salida = Column(String(10), nullable=False)
    hora_llegada = Column(String(10), nullable=False)
    duracion = Column(String(20), nullable=False)
    escalas = Column(String(50), default="Directo")
    precio = Column(DECIMAL(12, 2), nullable=False)
    impuesto_porcentaje = Column(DECIMAL(5, 2), nullable=False, default=19)
    descuento_porcentaje = Column(DECIMAL(5, 2), nullable=False, default=5)
    clase = Column(String(50), default="Económica")
    asientos_disponibles = Column(Integer, default=50)
    estado = Column(Enum("Activo", "Inactivo", name="estado_vuelo_enum"), nullable=False, default="Activo")
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, server_default=func.current_timestamp(), onupdate=func.current_timestamp())


class Venta(Base):
    __tablename__ = "ventas"

    id = Column(Integer, primary_key=True, autoincrement=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="RESTRICT"), nullable=False)
    cliente_id = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    subtotal = Column(DECIMAL(12, 2), nullable=False, default=0)
    impuestos = Column(DECIMAL(12, 2), nullable=False, default=0)
    descuento = Column(DECIMAL(12, 2), nullable=False, default=0)
    total = Column(DECIMAL(12, 2), nullable=False, default=0)
    estado = Column(Enum("Pendiente", "Confirmada", "Cancelada", "Completada", name="estado_venta_enum"), nullable=False, default="Pendiente")
    observaciones = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, server_default=func.current_timestamp(), onupdate=func.current_timestamp())

    usuario = relationship("Usuario", foreign_keys=[usuario_id])
    cliente = relationship("Usuario", foreign_keys=[cliente_id])
    detalles = relationship("DetalleVenta", back_populates="venta", cascade="all, delete-orphan")


class DetalleVenta(Base):
    __tablename__ = "detalle_ventas"

    id = Column(Integer, primary_key=True, autoincrement=True)
    venta_id = Column(Integer, ForeignKey("ventas.id", ondelete="CASCADE"), nullable=False)
    tipo_item = Column(Enum("Producto", "Servicio", "Vuelo", name="tipo_item_enum"), nullable=False)
    item_id = Column(Integer, nullable=False)
    cantidad = Column(Integer, nullable=False, default=1)
    precio_unitario = Column(DECIMAL(12, 2), nullable=False)
    descuento = Column(DECIMAL(12, 2), nullable=False, default=0)
    subtotal = Column(DECIMAL(12, 2), nullable=False, default=0)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())

    venta = relationship("Venta", back_populates="detalles")


class Factura(Base):
    __tablename__ = "facturas"

    id = Column(Integer, primary_key=True, autoincrement=True)
    numero_factura = Column(String(30), nullable=False, unique=True)
    venta_id = Column(Integer, ForeignKey("ventas.id", ondelete="RESTRICT"), nullable=False)
    cliente_id = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="RESTRICT"), nullable=False)
    subtotal = Column(DECIMAL(12, 2), nullable=False, default=0)
    impuestos = Column(DECIMAL(12, 2), nullable=False, default=0)
    descuento = Column(DECIMAL(12, 2), nullable=False, default=0)
    total = Column(DECIMAL(12, 2), nullable=False, default=0)
    estado = Column(Enum("Pendiente", "Pagada", "Anulada", "Vencida", name="estado_factura_enum"), nullable=False, default="Pendiente")
    fecha_vencimiento = Column(Date, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, server_default=func.current_timestamp(), onupdate=func.current_timestamp())

    venta = relationship("Venta")
    cliente = relationship("Usuario", foreign_keys=[cliente_id])
    usuario = relationship("Usuario", foreign_keys=[usuario_id])


class PQR(Base):
    __tablename__ = "pqr"

    id = Column(Integer, primary_key=True, autoincrement=True)
    numero_pqr = Column(String(30), nullable=False, unique=True)
    cliente_id = Column(Integer, ForeignKey("usuarios.id", ondelete="RESTRICT"), nullable=False)
    usuario_asignado_id = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    tipo = Column(Enum("Peticion", "Queja", "Reclamo", "Solicitud", name="tipo_pqr_enum"), nullable=False, default="Peticion")
    asunto = Column(String(200), nullable=False)
    descripcion = Column(Text, nullable=False)
    estado = Column(Enum("Pendiente", "En Proceso", "Respondida", "Cerrada", name="estado_pqr_enum"), nullable=False, default="Pendiente")
    respuesta = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, server_default=func.current_timestamp(), onupdate=func.current_timestamp())

    cliente = relationship("Usuario", foreign_keys=[cliente_id])
    usuario_asignado = relationship("Usuario", foreign_keys=[usuario_asignado_id])


class Conversacion(Base):
    __tablename__ = "conversaciones"

    id = Column(Integer, primary_key=True, autoincrement=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    session_id = Column(String(100), nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, server_default=func.current_timestamp(), onupdate=func.current_timestamp())

    mensajes = relationship("Mensaje", back_populates="conversacion", cascade="all, delete-orphan")


class Mensaje(Base):
    __tablename__ = "mensajes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    conversacion_id = Column(Integer, ForeignKey("conversaciones.id", ondelete="CASCADE"), nullable=False)
    rol = Column(Enum("user", "assistant", name="rol_mensaje_enum"), nullable=False)
    contenido = Column(Text, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())

    conversacion = relationship("Conversacion", back_populates="mensajes")
