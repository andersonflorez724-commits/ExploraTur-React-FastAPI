-- =====================================================
-- Script de creación de la base de datos ExploraTur
-- Base de datos relacional SQL para el tercer avance
-- =====================================================

CREATE DATABASE IF NOT EXISTS exploratur_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE exploratur_db;

-- =====================================================
-- Tabla de roles
-- =====================================================
CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE,
  descripcion VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar roles por defecto
INSERT INTO roles (nombre, descripcion) VALUES
  ('Administrador', 'Gestión total de usuarios, productos y servicios'),
  ('Empleado', 'Gestión parcial según funciones asignadas'),
  ('Cliente', 'Consulta y compra de productos y servicios')
ON DUPLICATE KEY UPDATE nombre = nombre;

-- =====================================================
-- Tabla de permisos
-- =====================================================
CREATE TABLE IF NOT EXISTS permisos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  descripcion VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Permisos por defecto
INSERT INTO permisos (nombre, descripcion) VALUES
  ('gestionar_usuarios', 'Crear, editar, eliminar y cambiar estado de usuarios'),
  ('gestionar_productos', 'Crear, editar, eliminar productos'),
  ('gestionar_servicios', 'Crear, editar, eliminar servicios'),
  ('ver_productos', 'Consultar catálogo de productos'),
  ('comprar', 'Realizar compras de productos'),
  ('ver_perfil', 'Ver información del perfil propio')
ON DUPLICATE KEY UPDATE nombre = nombre;

-- =====================================================
-- Tabla de relación roles-permisos
-- =====================================================
CREATE TABLE IF NOT EXISTS rol_permiso (
  rol_id INT NOT NULL,
  permiso_id INT NOT NULL,
  PRIMARY KEY (rol_id, permiso_id),
  FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permiso_id) REFERENCES permisos(id) ON DELETE CASCADE
);

-- Asignar permisos a roles
-- Administrador: todos los permisos
INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r, permisos p
WHERE r.nombre = 'Administrador'
ON DUPLICATE KEY UPDATE rol_id = rol_id;

-- Empleado: ver productos, gestionar productos (limitado), ver perfil
INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r, permisos p
WHERE r.nombre = 'Empleado' AND p.nombre IN ('ver_productos', 'gestionar_productos', 'ver_perfil')
ON DUPLICATE KEY UPDATE rol_id = rol_id;

-- Cliente: ver productos, comprar, ver perfil
INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r, permisos p
WHERE r.nombre = 'Cliente' AND p.nombre IN ('ver_productos', 'comprar', 'ver_perfil')
ON DUPLICATE KEY UPDATE rol_id = rol_id;

-- =====================================================
-- Tabla de usuarios
-- =====================================================
CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  tipo_documento ENUM('CC', 'TI', 'CE', 'NIT', 'PA') NOT NULL,
  numero_documento VARCHAR(20) NOT NULL UNIQUE,
  direccion VARCHAR(200) NOT NULL,
  telefono VARCHAR(20) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  rol_id INT NOT NULL DEFAULT 3,
  estado ENUM('Activo', 'Inactivo') NOT NULL DEFAULT 'Activo',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE RESTRICT
);

-- =====================================================
-- Tabla de categorías de productos
-- =====================================================
CREATE TABLE IF NOT EXISTS categorias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  descripcion VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO categorias (nombre, descripcion) VALUES
  ('Vuelos', 'Servicios de transporte aéreo'),
  ('Hoteles', 'Alojamiento turístico'),
  ('Paquetes', 'Paquetes turísticos completos'),
  ('Excursiones', 'Tours y excursiones guiadas')
ON DUPLICATE KEY UPDATE nombre = nombre;

-- =====================================================
-- Tabla de productos
-- =====================================================
CREATE TABLE IF NOT EXISTS productos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(200) NOT NULL,
  descripcion TEXT,
  precio DECIMAL(12, 2) NOT NULL,
  categoria_id INT,
  imagen_url VARCHAR(500),
  estado ENUM('Activo', 'Inactivo') NOT NULL DEFAULT 'Activo',
  stock INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL
);

-- Productos de ejemplo
INSERT INTO productos (nombre, descripcion, precio, categoria_id, stock) VALUES
  ('Vuelo Bogotá → Cartagena', 'Vuelo directo Avianca, clase económica', 385000.00, 1, 50),
  ('Vuelo Bogotá → Medellín', 'Vuelo directo Latam, clase económica', 198000.00, 1, 40),
  ('Hotel Caribe Playa', 'Hotel 5 estrellas frente al mar, habitación doble', 450000.00, 2, 15),
  ('Paquete Caribe 5 noches', 'Vuelo + Hotel + Desayuno incluido', 2200000.00, 3, 10),
  ('Tour Ciudad Amurallada', 'Recorrido guiado por el centro histórico de Cartagena', 120000.00, 4, 30);

-- =====================================================
-- Tabla de servicios
-- =====================================================
CREATE TABLE IF NOT EXISTS servicios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(200) NOT NULL,
  descripcion TEXT,
  precio DECIMAL(12, 2) NOT NULL,
  estado ENUM('Activo', 'Inactivo') NOT NULL DEFAULT 'Activo',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Servicios de ejemplo
INSERT INTO servicios (nombre, descripcion, precio) VALUES
  ('Transporte aeropuerto', 'Traslado privado desde/hacia el aeropuerto', 85000.00),
  ('Seguro de viaje', 'Cobertura médica internacional durante el viaje', 65000.00),
  ('Alquiler de carro', 'Vehículo compacto por día', 180000.00);

-- =====================================================
-- Tabla de compras (historial)
-- =====================================================
CREATE TABLE IF NOT EXISTS compras (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  producto_id INT NOT NULL,
  cantidad INT NOT NULL DEFAULT 1,
  total DECIMAL(12, 2) NOT NULL,
  estado ENUM('Pendiente', 'Confirmada', 'Cancelada') NOT NULL DEFAULT 'Confirmada',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
  FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE RESTRICT
);

-- =====================================================
-- Tabla de vuelos
-- =====================================================
CREATE TABLE IF NOT EXISTS vuelos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  aerolinea VARCHAR(100) NOT NULL,
  numero_vuelo VARCHAR(20) NOT NULL,
  origen VARCHAR(100) NOT NULL,
  codigo_origen VARCHAR(10) NOT NULL,
  destino VARCHAR(100) NOT NULL,
  codigo_destino VARCHAR(10) NOT NULL,
  fecha DATE NOT NULL,
  hora_salida VARCHAR(10) NOT NULL,
  hora_llegada VARCHAR(10) NOT NULL,
  duracion VARCHAR(20) NOT NULL,
  escalas VARCHAR(50) DEFAULT 'Directo',
  precio DECIMAL(12, 2) NOT NULL,
  impuesto_porcentaje DECIMAL(5, 2) NOT NULL DEFAULT 19,
  descuento_porcentaje DECIMAL(5, 2) NOT NULL DEFAULT 5,
  clase VARCHAR(50) DEFAULT 'Económica',
  asientos_disponibles INT DEFAULT 50,
  estado ENUM('Activo', 'Inactivo') NOT NULL DEFAULT 'Activo',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Vuelos de ejemplo
INSERT INTO vuelos (aerolinea, numero_vuelo, origen, codigo_origen, destino, codigo_destino, fecha, hora_salida, hora_llegada, duracion, escalas, precio, clase, asientos_disponibles) VALUES
  ('Avianca', 'AV 123', 'Bogotá', 'BOG', 'Cartagena', 'CTG', '2026-08-20', '08:15', '09:40', '1h 25m', 'Directo', 385000, 'Económica', 50),
  ('Latam', 'LA 845', 'Bogotá', 'BOG', 'Medellín', 'MDE', '2026-08-20', '07:05', '08:00', '55m', 'Directo', 198000, 'Económica', 40),
  ('Avianca', 'AV 910', 'Bogotá', 'BOG', 'Santa Marta', 'SMR', '2026-08-21', '10:30', '11:55', '1h 25m', 'Directo', 312000, 'Económica', 45),
  ('Wingo', 'CM 234', 'Bogotá', 'BOG', 'San Andrés', 'ADZ', '2026-08-21', '06:40', '08:50', '2h 10m', '1 escala', 460000, 'Económica', 30),
  ('JetSmart', 'JA 552', 'Medellín', 'MDE', 'Cali', 'CLO', '2026-08-22', '12:20', '13:35', '1h 15m', 'Directo', 175000, 'Económica', 35),
  ('Avianca', 'AV 218', 'Cartagena', 'CTG', 'Bogotá', 'BOG', '2026-08-22', '16:45', '18:05', '1h 20m', 'Directo', 289000, 'Económica', 50),
  ('Latam', 'LA 707', 'Bogotá', 'BOG', 'Miami', 'MIA', '2026-08-23', '14:10', '20:30', '4h 20m', 'Directo', 1240000, 'Ejecutiva', 20),
  ('American Airlines', 'AA 350', 'Bogotá', 'BOG', 'Nueva York', 'JFK', '2026-08-23', '11:00', '17:45', '5h 45m', '1 escala', 1890000, 'Económica', 25),
  ('Iberia', 'IB 6402', 'Bogotá', 'BOG', 'Madrid', 'MAD', '2026-08-24', '17:30', '09:50', '9h 20m', 'Directo', 2350000, 'Ejecutiva', 15),
  ('Copa Airlines', 'CM 310', 'Medellín', 'MDE', 'Panamá', 'PTY', '2026-08-25', '09:25', '11:15', '1h 50m', 'Directo', 780000, 'Económica', 40),
  ('Avianca', 'AV 651', 'Bogotá', 'BOG', 'Ciudad de México', 'MEX', '2026-08-26', '07:50', '11:40', '4h 50m', 'Directo', 1420000, 'Económica', 35),
  ('JetSmart', 'JA 481', 'Cali', 'CLO', 'Bogotá', 'BOG', '2026-08-27', '18:05', '19:20', '1h 15m', 'Directo', 165000, 'Económica', 45)
ON DUPLICATE KEY UPDATE numero_vuelo = numero_vuelo;

-- =====================================================
-- Usuarios de prueba (para la colección de Postman)
-- =====================================================
INSERT INTO usuarios (nombre, apellido, tipo_documento, numero_documento, direccion, telefono, email, password_hash, rol_id) VALUES
  ('Carlos', 'Admin', 'CC', '1000000001', 'Carrera 10 # 1-10, Bogotá', '3000000001', 'admin@exploratur.com', '$2b$10$U7fIH7x9vYMDGff7SK0XbOUyj20rhRY1/1ofAG/VQCqH.f4fAmsc.', 1),
  ('María', 'Empleado', 'CC', '1000000002', 'Carrera 20 # 2-20, Bogotá', '3000000002', 'empleado@exploratur.com', '$2b$10$pfSH1uEPyOtxiQAfiBkg2eHdFr/urVmGmTfDLhLTrEJaz1elJNWUC', 2)
ON DUPLICATE KEY UPDATE email = email;

-- =====================================================
-- Tabla de ventas
-- =====================================================
CREATE TABLE IF NOT EXISTS ventas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  cliente_id INT,
  subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
  impuestos DECIMAL(12, 2) NOT NULL DEFAULT 0,
  descuento DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total DECIMAL(12, 2) NOT NULL DEFAULT 0,
  estado ENUM('Pendiente', 'Confirmada', 'Cancelada', 'Completada') NOT NULL DEFAULT 'Pendiente',
  observaciones TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
  FOREIGN KEY (cliente_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- =====================================================
-- Tabla de detalle de ventas
-- =====================================================
CREATE TABLE IF NOT EXISTS detalle_ventas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  venta_id INT NOT NULL,
  tipo_item ENUM('Producto', 'Servicio', 'Vuelo') NOT NULL,
  item_id INT NOT NULL,
  cantidad INT NOT NULL DEFAULT 1,
  precio_unitario DECIMAL(12, 2) NOT NULL,
  descuento DECIMAL(12, 2) NOT NULL DEFAULT 0,
  subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE
);

-- =====================================================
-- Tabla de facturas
-- =====================================================
CREATE TABLE IF NOT EXISTS facturas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  numero_factura VARCHAR(30) NOT NULL UNIQUE,
  venta_id INT NOT NULL,
  cliente_id INT,
  usuario_id INT NOT NULL,
  subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
  impuestos DECIMAL(12, 2) NOT NULL DEFAULT 0,
  descuento DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total DECIMAL(12, 2) NOT NULL DEFAULT 0,
  estado ENUM('Pendiente', 'Pagada', 'Anulada', 'Vencida') NOT NULL DEFAULT 'Pendiente',
  fecha_vencimiento DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE RESTRICT,
  FOREIGN KEY (cliente_id) REFERENCES usuarios(id) ON DELETE SET NULL,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT
);

-- =====================================================
-- Tabla de PQR (Peticiones, Quejas, Reclamos)
-- =====================================================
CREATE TABLE IF NOT EXISTS pqr (
  id INT AUTO_INCREMENT PRIMARY KEY,
  numero_pqr VARCHAR(30) NOT NULL UNIQUE,
  cliente_id INT NOT NULL,
  usuario_asignado_id INT,
  tipo ENUM('Peticion', 'Queja', 'Reclamo', 'Solicitud') NOT NULL DEFAULT 'Peticion',
  asunto VARCHAR(200) NOT NULL,
  descripcion TEXT NOT NULL,
  estado ENUM('Pendiente', 'En Proceso', 'Respondida', 'Cerrada') NOT NULL DEFAULT 'Pendiente',
  respuesta TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (cliente_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
  FOREIGN KEY (usuario_asignado_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- =====================================================
-- Tabla de conversaciones del chatbot
-- =====================================================
CREATE TABLE IF NOT EXISTS conversaciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT,
  session_id VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- =====================================================
-- Tabla de mensajes del chatbot
-- =====================================================
CREATE TABLE IF NOT EXISTS mensajes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  conversacion_id INT NOT NULL,
  rol ENUM('user', 'assistant') NOT NULL,
  contenido TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversacion_id) REFERENCES conversaciones(id) ON DELETE CASCADE
);

-- =====================================================
-- Vista: usuarios con información de rol
-- =====================================================
CREATE OR REPLACE VIEW vista_usuarios AS
SELECT
  u.id,
  u.nombre,
  u.apellido,
  u.tipo_documento,
  u.numero_documento,
  u.direccion,
  u.telefono,
  u.email,
  u.estado,
  u.created_at,
  u.updated_at,
  r.id AS rol_id,
  r.nombre AS rol_nombre
FROM usuarios u
INNER JOIN roles r ON u.rol_id = r.id;
