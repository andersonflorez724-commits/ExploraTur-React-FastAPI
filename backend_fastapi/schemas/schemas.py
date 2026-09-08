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
