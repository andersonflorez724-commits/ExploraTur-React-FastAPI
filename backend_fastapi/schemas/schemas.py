"""
Esquemas Pydantic para validación de datos de entrada y salida.
"""

from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, field_validator
import re


# =====================================================
# Auth
# =====================================================

class RegisterRequest(BaseModel):
    nombre: str
    apellido: str
    tipo_documento: str
    numero_documento: str
    direccion: str
    telefono: str
    email: str
    password: str

    @field_validator("nombre")
    @classmethod
    def validate_nombre(cls, v):
        if not v or not v.strip():
            raise ValueError("El nombre es obligatorio.")
        v = v.strip()
        if len(v) < 2 or len(v) > 100:
            raise ValueError("El nombre debe tener entre 2 y 100 caracteres.")
        if not re.match(r"^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$", v):
            raise ValueError("El nombre solo puede contener letras y espacios.")
        return v

    @field_validator("apellido")
    @classmethod
    def validate_apellido(cls, v):
        if not v or not v.strip():
            raise ValueError("El apellido es obligatorio.")
        v = v.strip()
        if len(v) < 2 or len(v) > 100:
            raise ValueError("El apellido debe tener entre 2 y 100 caracteres.")
        if not re.match(r"^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$", v):
            raise ValueError("El apellido solo puede contener letras y espacios.")
        return v

    @field_validator("tipo_documento")
    @classmethod
    def validate_tipo_documento(cls, v):
        if not v:
            raise ValueError("El tipo de documento es obligatorio.")
        if v not in ["CC", "TI", "CE", "NIT", "PA"]:
            raise ValueError("Tipo de documento no válido.")
        return v

    @field_validator("numero_documento")
    @classmethod
    def validate_numero_documento(cls, v):
        if not v or not v.strip():
            raise ValueError("El número de documento es obligatorio.")
        v = v.strip()
        if len(v) < 6 or len(v) > 15:
            raise ValueError("El número de documento debe tener entre 6 y 15 caracteres.")
        if not re.match(r"^\d+$", v):
            raise ValueError("El número de documento solo puede contener números.")
        return v

    @field_validator("direccion")
    @classmethod
    def validate_direccion(cls, v):
        if not v or not v.strip():
            raise ValueError("La dirección es obligatoria.")
        v = v.strip()
        if len(v) < 5 or len(v) > 200:
            raise ValueError("La dirección debe tener entre 5 y 200 caracteres.")
        return v

    @field_validator("telefono")
    @classmethod
    def validate_telefono(cls, v):
        if not v or not v.strip():
            raise ValueError("El teléfono es obligatorio.")
        v = v.strip()
        if not re.match(r"^\d{7,15}$", v):
            raise ValueError("El teléfono debe tener entre 7 y 15 dígitos.")
        return v

    @field_validator("email")
    @classmethod
    def validate_email(cls, v):
        if not v or not v.strip():
            raise ValueError("El correo es obligatorio.")
        v = v.strip().lower()
        if not re.match(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", v):
            raise ValueError("Ingresa un correo electrónico válido.")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        if not v:
            raise ValueError("La contraseña es obligatoria.")
        if len(v) < 8 or len(v) > 20:
            raise ValueError("La contraseña debe tener entre 8 y 20 caracteres.")
        if not re.match(r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#_+-])", v):
            raise ValueError("Debe incluir mayúscula, minúscula, número y un símbolo.")
        return v


class LoginRequest(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def validate_email(cls, v):
        if not v or not v.strip():
            raise ValueError("El correo es obligatorio.")
        return v.strip().lower()

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        if not v:
            raise ValueError("La contraseña es obligatoria.")
        return v


class UsuarioResponse(BaseModel):
    id: int
    nombre: str
    apellido: str
    tipo_documento: str
    numero_documento: str
    direccion: str
    telefono: str
    email: str
    estado: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    rol_id: int
    rol_nombre: str

    class Config:
        from_attributes = True


class RegisterResponse(BaseModel):
    mensaje: str
    usuario: dict


class LoginResponse(BaseModel):
    mensaje: str
    token: str
    usuario: dict


# =====================================================
# Users
# =====================================================

class CreateUserRequest(BaseModel):
    nombre: str
    apellido: str
    tipo_documento: str
    numero_documento: str
    direccion: str
    telefono: str
    email: str
    password: str
    rol_id: int = 3

    @field_validator("nombre")
    @classmethod
    def validate_nombre(cls, v):
        if not v or not v.strip():
            raise ValueError("El nombre es obligatorio.")
        v = v.strip()
        if len(v) < 2 or len(v) > 100:
            raise ValueError("El nombre debe tener entre 2 y 100 caracteres.")
        return v

    @field_validator("apellido")
    @classmethod
    def validate_apellido(cls, v):
        if not v or not v.strip():
            raise ValueError("El apellido es obligatorio.")
        v = v.strip()
        if len(v) < 2 or len(v) > 100:
            raise ValueError("El apellido debe tener entre 2 y 100 caracteres.")
        return v

    @field_validator("tipo_documento")
    @classmethod
    def validate_tipo_documento(cls, v):
        if not v:
            raise ValueError("El tipo de documento es obligatorio.")
        if v not in ["CC", "TI", "CE", "NIT", "PA"]:
            raise ValueError("Tipo de documento no válido.")
        return v

    @field_validator("numero_documento")
    @classmethod
    def validate_numero_documento(cls, v):
        if not v or not v.strip():
            raise ValueError("El número de documento es obligatorio.")
        v = v.strip()
        if not re.match(r"^\d+$", v):
            raise ValueError("El número de documento solo puede contener números.")
        if len(v) < 6 or len(v) > 15:
            raise ValueError("Debe tener entre 6 y 15 dígitos.")
        return v

    @field_validator("direccion")
    @classmethod
    def validate_direccion(cls, v):
        if not v or not v.strip():
            raise ValueError("La dirección es obligatoria.")
        v = v.strip()
        if len(v) < 5 or len(v) > 200:
            raise ValueError("La dirección debe tener entre 5 y 200 caracteres.")
        return v

    @field_validator("telefono")
    @classmethod
    def validate_telefono(cls, v):
        if not v or not v.strip():
            raise ValueError("El teléfono es obligatorio.")
        v = v.strip()
        if not re.match(r"^\d{7,15}$", v):
            raise ValueError("El teléfono debe tener entre 7 y 15 dígitos.")
        return v

    @field_validator("email")
    @classmethod
    def validate_email(cls, v):
        if not v or not v.strip():
            raise ValueError("El correo es obligatorio.")
        v = v.strip().lower()
        if not re.match(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", v):
            raise ValueError("Correo no válido.")
        return v

    @field_validator("rol_id")
    @classmethod
    def validate_rol_id(cls, v):
        if v not in [1, 2, 3]:
            raise ValueError("Rol no válido.")
        return v


class UpdateUserRequest(BaseModel):
    nombre: str
    apellido: str
    tipo_documento: str
    numero_documento: str
    direccion: str
    telefono: str
    email: str
    password: Optional[str] = ""
    rol_id: int = 3

    @field_validator("nombre")
    @classmethod
    def validate_nombre(cls, v):
        if not v or not v.strip():
            raise ValueError("El nombre es obligatorio.")
        return v.strip()

    @field_validator("apellido")
    @classmethod
    def validate_apellido(cls, v):
        if not v or not v.strip():
            raise ValueError("El apellido es obligatorio.")
        return v.strip()

    @field_validator("email")
    @classmethod
    def validate_email(cls, v):
        if not v or not v.strip():
            raise ValueError("El correo es obligatorio.")
        return v.strip().lower()

    @field_validator("rol_id")
    @classmethod
    def validate_rol_id(cls, v):
        if v not in [1, 2, 3]:
            raise ValueError("Rol no válido.")
        return v


class ToggleStatusRequest(BaseModel):
    estado: str

    @field_validator("estado")
    @classmethod
    def validate_estado(cls, v):
        if v not in ["Activo", "Inactivo"]:
            raise ValueError('El estado debe ser "Activo" o "Inactivo".')
        return v


# =====================================================
# Products
# =====================================================

class ProductRequest(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    precio: float
    categoria_id: Optional[int] = None
    imagen_url: Optional[str] = None
    stock: int = 0

    @field_validator("nombre")
    @classmethod
    def validate_nombre(cls, v):
        if not v or not v.strip():
            raise ValueError("El nombre es obligatorio.")
        v = v.strip()
        if len(v) < 2 or len(v) > 200:
            raise ValueError("El nombre debe tener entre 2 y 200 caracteres.")
        return v

    @field_validator("precio")
    @classmethod
    def validate_precio(cls, v):
        if v < 0:
            raise ValueError("El precio debe ser un número positivo.")
        return v


class ProductUpdateRequest(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    precio: float
    categoria_id: Optional[int] = None
    imagen_url: Optional[str] = None
    stock: int = 0
    estado: Optional[str] = "Activo"


# =====================================================
# Services
# =====================================================

class ServiceRequest(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    precio: float

    @field_validator("nombre")
    @classmethod
    def validate_nombre(cls, v):
        if not v or not v.strip():
            raise ValueError("El nombre es obligatorio.")
        v = v.strip()
        if len(v) < 2 or len(v) > 200:
            raise ValueError("El nombre debe tener entre 2 y 200 caracteres.")
        return v

    @field_validator("precio")
    @classmethod
    def validate_precio(cls, v):
        if v < 0:
            raise ValueError("El precio debe ser un número positivo.")
        return v


class ServiceUpdateRequest(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    precio: float
    estado: Optional[str] = "Activo"


# =====================================================
# Flights
# =====================================================

class FlightRequest(BaseModel):
    aerolinea: str
    numero_vuelo: str
    origen: str
    codigo_origen: str
    destino: str
    codigo_destino: str
    fecha: str
    hora_salida: str
    hora_llegada: str
    duracion: str
    escalas: Optional[str] = "Directo"
    precio: float
    clase: Optional[str] = "Económica"
    asientos_disponibles: int = 50

    @field_validator("aerolinea")
    @classmethod
    def validate_aerolinea(cls, v):
        if not v or not v.strip():
            raise ValueError("La aerolínea es obligatoria.")
        return v.strip()

    @field_validator("numero_vuelo")
    @classmethod
    def validate_numero_vuelo(cls, v):
        if not v or not v.strip():
            raise ValueError("El número de vuelo es obligatorio.")
        return v.strip()

    @field_validator("precio")
    @classmethod
    def validate_precio(cls, v):
        if v < 0:
            raise ValueError("El precio debe ser un número positivo.")
        return v


class FlightUpdateRequest(BaseModel):
    aerolinea: str
    numero_vuelo: str
    origen: str
    codigo_origen: str
    destino: str
    codigo_destino: str
    fecha: str
    hora_salida: str
    hora_llegada: str
    duracion: str
    escalas: Optional[str] = "Directo"
    precio: float
    clase: Optional[str] = "Económica"
    asientos_disponibles: int = 50
    estado: Optional[str] = "Activo"


# =====================================================
# Ventas
# =====================================================

class DetalleVentaItem(BaseModel):
    tipo_item: str
    item_id: int
    cantidad: int = 1
    precio_unitario: float
    descuento: float = 0

    @field_validator("tipo_item")
    @classmethod
    def validate_tipo_item(cls, v):
        if v not in ["Producto", "Servicio"]:
            raise ValueError("El tipo de item debe ser 'Producto' o 'Servicio'.")
        return v

    @field_validator("cantidad")
    @classmethod
    def validate_cantidad(cls, v):
        if v < 1:
            raise ValueError("La cantidad debe ser al menos 1.")
        return v

    @field_validator("precio_unitario")
    @classmethod
    def validate_precio_unitario(cls, v):
        if v < 0:
            raise ValueError("El precio unitario no puede ser negativo.")
        return v


class VentaRequest(BaseModel):
    cliente_id: Optional[int] = None
    detalles: List[DetalleVentaItem]
    descuento: float = 0
    impuestos: float = 0
    observaciones: Optional[str] = None

    @field_validator("detalles")
    @classmethod
    def validate_detalles(cls, v):
        if not v:
            raise ValueError("Debe incluir al menos un item en la venta.")
        return v


class VentaResponse(BaseModel):
    id: int
    numero_venta: Optional[str] = None
    usuario_id: int
    cliente_id: Optional[int] = None
    cliente_nombre: Optional[str] = None
    usuario_nombre: Optional[str] = None
    subtotal: float
    impuestos: float
    descuento: float
    total: float
    estado: str
    observaciones: Optional[str] = None
    detalles: List[dict] = []
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class VentaUpdateEstado(BaseModel):
    estado: str

    @field_validator("estado")
    @classmethod
    def validate_estado(cls, v):
        if v not in ["Pendiente", "Confirmada", "Cancelada", "Completada"]:
            raise ValueError("Estado no válido.")
        return v


# =====================================================
# Facturas
# =====================================================

class FacturaRequest(BaseModel):
    venta_id: int
    cliente_id: Optional[int] = None
    fecha_vencimiento: Optional[str] = None


class FacturaResponse(BaseModel):
    id: int
    numero_factura: str
    venta_id: int
    cliente_id: Optional[int] = None
    cliente_nombre: Optional[str] = None
    usuario_nombre: Optional[str] = None
    subtotal: float
    impuestos: float
    descuento: float
    total: float
    estado: str
    fecha_vencimiento: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class FacturaUpdateEstado(BaseModel):
    estado: str

    @field_validator("estado")
    @classmethod
    def validate_estado(cls, v):
        if v not in ["Pendiente", "Pagada", "Anulada", "Vencida"]:
            raise ValueError("Estado no válido.")
        return v


# =====================================================
# PQR
# =====================================================

class PQRRequest(BaseModel):
    tipo: str = "Peticion"
    asunto: str
    descripcion: str

    @field_validator("tipo")
    @classmethod
    def validate_tipo(cls, v):
        if v not in ["Peticion", "Queja", "Reclamo", "Solicitud"]:
            raise ValueError("Tipo de PQR no válido.")
        return v

    @field_validator("asunto")
    @classmethod
    def validate_asunto(cls, v):
        if not v or not v.strip():
            raise ValueError("El asunto es obligatorio.")
        if len(v.strip()) < 5 or len(v.strip()) > 200:
            raise ValueError("El asunto debe tener entre 5 y 200 caracteres.")
        return v.strip()

    @field_validator("descripcion")
    @classmethod
    def validate_descripcion(cls, v):
        if not v or not v.strip():
            raise ValueError("La descripción es obligatoria.")
        if len(v.strip()) < 10:
            raise ValueError("La descripción debe tener al menos 10 caracteres.")
        return v.strip()


class PQREsponse(BaseModel):
    id: int
    numero_pqr: str
    cliente_id: int
    cliente_nombre: Optional[str] = None
    usuario_asignado_id: Optional[int] = None
    usuario_asignado_nombre: Optional[str] = None
    tipo: str
    asunto: str
    descripcion: str
    estado: str
    respuesta: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PQRUpdateEstado(BaseModel):
    estado: str
    respuesta: Optional[str] = None

    @field_validator("estado")
    @classmethod
    def validate_estado(cls, v):
        if v not in ["Pendiente", "En Proceso", "Respondida", "Cerrada"]:
            raise ValueError("Estado no válido.")
        return v


class PQRUpdateAsignacion(BaseModel):
    usuario_asignado_id: int


# =====================================================
# Chatbot
# =====================================================

class ChatbotRequest(BaseModel):
    mensaje: str
    session_id: Optional[str] = None

    @field_validator("mensaje")
    @classmethod
    def validate_mensaje(cls, v):
        if not v or not v.strip():
            raise ValueError("El mensaje es obligatorio.")
        return v.strip()


class ChatbotResponse(BaseModel):
    respuesta: str
    session_id: str


# =====================================================
# Reportes
# =====================================================

class ReporteDiarioRequest(BaseModel):
    fecha: str

    @field_validator("fecha")
    @classmethod
    def validate_fecha(cls, v):
        if not v:
            raise ValueError("La fecha es obligatoria.")
        try:
            from datetime import datetime as dt
            dt.strptime(v, "%Y-%m-%d")
        except ValueError:
            raise ValueError("Formato de fecha inválido. Use YYYY-MM-DD.")
        return v


# =====================================================
# Estadísticas / Dashboard
# =====================================================

class DashboardStats(BaseModel):
    total_usuarios: int = 0
    total_productos: int = 0
    total_servicios: int = 0
    total_ventas: int = 0
    total_facturas: int = 0
    total_pqr: int = 0
    ventas_pendientes: int = 0
    pqr_pendientes: int = 0
    ingresos_totales: float = 0
    facturacion_total: float = 0


class VentasPorPeriodo(BaseModel):
    fecha: str
    cantidad: int
    total: float
