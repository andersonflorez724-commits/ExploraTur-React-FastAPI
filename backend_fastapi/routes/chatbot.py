"""
Rutas del chatbot con integración de Inteligencia Artificial (Google Gemini).
"""

import os
import re
import uuid
import unicodedata
from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from config.database import get_db
from models.models import Conversacion, Mensaje, Producto, Servicio, Vuelo
from schemas.schemas import ChatbotRequest, ChatbotResponse
from middleware.auth import get_current_user

router = APIRouter(prefix="/api/chatbot", tags=["Chatbot"])

# Modelo de Gemini a usar (configurable por variable de entorno).
# 'gemini-2.0-flash' fue retirado por Google (error 404); 'gemini-flash-latest'
# apunta siempre al modelo flash vigente, así el chatbot no vuelve a romperse.
DEFAULT_GEMINI_MODEL = "gemini-flash-latest"
FALLBACK_GEMINI_MODELS = ["gemini-flash-latest", "gemini-3.6-flash", "gemini-flash-lite-latest"]

# Errores temporales de Google (503 = alta demanda). Vale la pena reintentar.
STATUS_REINTENTABLES = {500, 502, 503, 504}
MAX_INTENTOS_POR_MODELO = 2
ESPERA_BASE_SEGUNDOS = 0.8
TIMEOUT_SEGUNDOS = 20
# Tope de tiempo para todo el proceso (modelo + reintentos). Sin esto, con varios
# timeouts y errores 503 la petición del frontend podía tardar minutos.
LIMITE_TOTAL_SEGUNDOS = 45

# Los modelos 2.5+ "piensan" antes de responder y esos tokens consumen
# maxOutputTokens: la respuesta visible quedaba cortada. Se desactiva el thinking.
THINKING_DESHABILITADO = {"thinkingBudget": 0}


# Las variables se leen en tiempo de ejecución y no a nivel de módulo: main.py
# importa esta ruta antes de su propia llamada a load_dotenv(), así que una lectura
# en el import depende de quién cargue el .env primero (hoy lo hace config.database).
def get_api_key() -> str:
    """Lee la API key de Gemini en tiempo de ejecución."""
    return (os.getenv("GEMINI_API_KEY") or "").strip()


def get_model_name() -> str:
    """Lee el modelo de Gemini en tiempo de ejecución."""
    return (os.getenv("GEMINI_MODEL") or "").strip() or DEFAULT_GEMINI_MODEL


def get_model_candidates() -> list:
    """Modelos a intentar, en orden: el configurado y luego los de respaldo."""
    candidatos = [get_model_name()] + FALLBACK_GEMINI_MODELS
    vistos = []
    for modelo in candidatos:
        if modelo and modelo not in vistos:
            vistos.append(modelo)
    return vistos


class GeminiAPIError(Exception):
    """Error devuelto por la API de Gemini, con su código HTTP."""

    def __init__(self, code: int, detalle: str):
        super().__init__(f"HTTP {code}: {detalle}")
        self.code = code
        self.detalle = detalle or ""

    @property
    def es_clave_invalida(self) -> bool:
        """Google responde 400 (no 401) cuando la API key no sirve."""
        detalle = self.detalle.lower()
        return "api_key_invalid" in detalle or "api key not valid" in detalle or "api key expired" in detalle

    @property
    def es_error_de_thinking(self) -> bool:
        """El modelo no acepta 'thinkingConfig' (se reintenta sin ese campo)."""
        return self.code == 400 and "thinking" in self.detalle.lower()


SYSTEM_PROMPT = """Eres el asistente virtual de ExploraTur, una empresa de turismo y viajes en Colombia.
Tu nombre es ExploraBot. Debes ser amable, profesional y útil.

Información de la empresa:
- Nombre: ExploraTur
- Servicios: Vuelos nacionales e internacionales, hoteles, paquetes turísticos, excursiones, transporte, seguros de viaje, alquiler de vehículos.
- Ubicación: Bogotá, Colombia
- Teléfono: +57 300 123 4567
- Email: info@exploratur.com
- Horario: Lunes a Viernes 8:00am - 6:00pm, Sábados 9:00am - 1:00pm

Puedes ayudar con:
1. Información sobre productos y servicios de la empresa.
2. Orientación sobre procesos de compra.
3. Información general de turismo en Colombia.
4. Recibir y orientar solicitudes de PQR (Peticiones, Quejas, Reclamos).
5. Resolver preguntas frecuentes.

Responde siempre en español de forma concisa y amable. Si no sabes algo, di que pueden contactar a soporte.
Usa entre 3 y 6 oraciones. Si la pregunta es compleja o implica varios pasos, responde en puntos breves sin omitir información importante.
No inventes precios, disponibilidad ni políticas: cuando falte un dato concreto, indícalo y ofrece el canal de contacto."""


# =====================================================
# Contexto real: datos de la base de datos para el modelo
# =====================================================
def normalizar(texto: str) -> str:
    """Quita tildes y pasa a minúsculas para comparar palabras clave."""
    texto = unicodedata.normalize("NFD", texto or "")
    texto = "".join(c for c in texto if unicodedata.category(c) != "Mn")
    return texto.lower()


def formato_precio(valor) -> str:
    """Precio en pesos colombianos: 460000 -> '460.000'."""
    try:
        return f"{float(valor):,.0f}".replace(",", ".")
    except (TypeError, ValueError):
        return str(valor)


def recortar(texto, limite: int = 90) -> str:
    texto = (texto or "").strip().replace("\n", " ")
    return texto if len(texto) <= limite else texto[:limite].rstrip() + "…"


def formato_vuelo(v: Vuelo) -> str:
    iva = float(v.impuesto_porcentaje or 0)
    descuento = float(v.descuento_porcentaje or 0)
    return (
        f"- {v.numero_vuelo} · {v.aerolinea} · {v.origen} ({v.codigo_origen}) → "
        f"{v.destino} ({v.codigo_destino}) · {v.fecha} · sale {v.hora_salida}, "
        f"llega {v.hora_llegada} · {v.duracion} · {v.escalas} · clase {v.clase} · "
        f"${formato_precio(v.precio)} COP por persona · "
        f"{v.asientos_disponibles or 0} asientos · IVA {iva}% · descuento {descuento}%"
    )


def construir_contexto(db: Session, mensaje: str) -> str:
    """Trae vuelos, productos y servicios reales de la DB para el prompt.

    Sin estos datos el modelo solo puede ser vago ("consulte con un asesor");
    con ellos responde con precios, fechas y números de vuelo exactos.
    """
    try:
        hoy = date.today()
        claves = {p for p in re.split(r"[^a-z0-9]+", normalizar(mensaje)) if len(p) >= 3}

        activos = db.query(Vuelo).filter(Vuelo.estado == "Activo").order_by(Vuelo.fecha.asc()).all()

        coincidencias = [
            v for v in activos
            if any(
                k in normalizar(
                    f"{v.destino} {v.origen} {v.codigo_destino} {v.codigo_origen} {v.aerolinea}"
                )
                for k in claves
            )
        ]
        futuros = [v for v in activos if v.fecha and v.fecha >= hoy]
        seleccion = (coincidencias or futuros or activos)[:8]

        productos = (
            db.query(Producto).filter(Producto.estado == "Activo")
            .order_by(Producto.id.desc()).limit(6).all()
        )
        servicios = (
            db.query(Servicio).filter(Servicio.estado == "Activo")
            .order_by(Servicio.id.desc()).limit(6).all()
        )

        lineas = [
            f"DATOS REALES DE LA BASE DE DATOS DE ExploraTur (hoy es {hoy.isoformat()}):",
            "",
            f"VUELOS EN VENTA ({len(seleccion)}):",
        ]
        if seleccion:
            lineas += [formato_vuelo(v) for v in seleccion]
        else:
            lineas.append("- Ahora mismo no hay vuelos registrados en la base.")

        destinos = sorted({f"{v.destino} ({v.codigo_destino})" for v in activos})
        if destinos:
            lineas.append(f"- Destinos con vuelos en la base: {', '.join(destinos)}.")

        if productos:
            lineas += ["", f"PRODUCTOS ACTIVOS ({len(productos)}):"]
            lineas += [
                f"- {p.nombre} · ${formato_precio(p.precio)} COP · stock {p.stock} · {recortar(p.descripcion)}"
                for p in productos
            ]

        if servicios:
            lineas += ["", f"SERVICIOS ACTIVOS ({len(servicios)}):"]
            lineas += [
                f"- {s.nombre} · ${formato_precio(s.precio)} COP · {recortar(s.descripcion)}"
                for s in servicios
            ]

        lineas += [
            "",
            "REGLAS PARA RESPONDER CON DATOS EXACTOS:",
            "1. Usa SOLO las cifras, fechas, horarios y números de vuelo de esta lista, escritos tal cual.",
            "2. Si la ruta, el producto o el servicio consultado NO aparece en la lista, dilo claramente y ofrece los destinos disponibles o el canal de contacto: no inventes.",
            "3. Los vuelos se venden por persona; al comprar se aplica el descuento y el IVA que aparecen en cada uno.",
            "4. Para preguntas que no son de catálogo (horarios de la empresa, PQR, pasos para comprar), respóndelas normalmente con tu instrucción de sistema.",
        ]
        return "\n".join(lineas)
    except Exception as e:
        print(f"[CHATBOT WARN] No se pudo construir el contexto: {e}")
        return ""


def build_gemini_contents(user_message: str, conversation_history: list = None) -> list:
    """Convierte el historial de la BD al formato de 'contents' de Gemini."""
    contents = []

    def add_turn(role: str, text: str):
        """Agrega un turno fusionando consecutivos del mismo rol.

        Gemini espera turnos alternados de 'user' y 'model'; si llegan dos
        seguidos del mismo rol se combinan en uno para no arriesgar un error 400.
        """
        text = (text or "").strip()
        if not text:
            return
        if contents and contents[-1]["role"] == role:
            contents[-1]["parts"][0]["text"] += f"\n{text}"
        else:
            contents.append({"role": role, "parts": [{"text": text}]})

    for msg in (conversation_history or [])[-10:]:
        # Gemini usa 'model' donde la BD guarda 'assistant'.
        rol = "model" if msg.get("rol") in ("assistant", "model", "bot") else "user"
        add_turn(rol, msg.get("contenido", ""))

    # Evita duplicar el mensaje actual si ya viene incluido en el historial.
    if contents and contents[-1]["role"] == "user" and contents[-1]["parts"][0]["text"].strip() == user_message.strip():
        contents.pop()

    add_turn("user", user_message)
    return contents


def call_gemini(
    api_key: str,
    model: str,
    contents: list,
    deshabilitar_thinking: bool = True,
    system_prompt: str = SYSTEM_PROMPT,
) -> tuple:
    """Hace una llamada a Gemini. Devuelve (texto, finish_reason).

    Lanza GeminiAPIError si la API responde con un error HTTP.
    """
    import json
    import urllib.error
    import urllib.request

    generation_config = {
        "temperature": 0.7,
        "topP": 0.9,
        # 200 tokens (valor anterior) truncaba las respuestas complejas. Se deja
        # margen suficiente para respuestas detalladas.
        "maxOutputTokens": 2048,
    }
    if deshabilitar_thinking:
        generation_config["thinkingConfig"] = THINKING_DESHABILITADO

    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"{model}:generateContent?key={api_key}"
    )

    payload = json.dumps({
        "system_instruction": {"parts": [{"text": system_prompt}]},
        "contents": contents,
        "generationConfig": generation_config,
    }).encode("utf-8")

    req = urllib.request.Request(
        url,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT_SEGUNDOS) as response:
            result = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        # El cuerpo del error de Google explica la causa real (clave inválida,
        # modelo retirado, cuota agotada, roles mal formados, etc.).
        raise GeminiAPIError(e.code, e.read().decode("utf-8", errors="replace"))

    candidates = result.get("candidates") or []
    if not candidates:
        block_reason = (result.get("promptFeedback") or {}).get("blockReason")
        motivo = f"bloqueado ({block_reason})" if block_reason else "sin candidatos"
        raise GeminiAPIError(0, f"respuesta {motivo}: {result}")

    candidate = candidates[0]
    parts = (candidate.get("content") or {}).get("parts") or []
    texto = "".join(p.get("text", "") for p in parts).strip()
    return texto, candidate.get("finishReason")


def get_gemini_response(
    user_message: str,
    conversation_history: list = None,
    contexto: str = "",
) -> str:
    """Genera la respuesta con Gemini, reintentando y cambiando de modelo si falla."""
    import time

    system_prompt = SYSTEM_PROMPT
    if contexto:
        system_prompt = f"{SYSTEM_PROMPT}\n\n{contexto}"

    api_key = get_api_key()
    if not api_key:
        print("[CHATBOT WARN] GEMINI_API_KEY no configurada: usando respuestas de respaldo.")
        return get_fallback_response(user_message, contexto)

    contents = build_gemini_contents(user_message, conversation_history)
    limite = time.monotonic() + LIMITE_TOTAL_SEGUNDOS

    for model in get_model_candidates():
        for intento in range(MAX_INTENTOS_POR_MODELO):
            if time.monotonic() >= limite:
                print("[CHATBOT ERROR] Se agotó el tiempo máximo esperando a Gemini.")
                return get_fallback_response(user_message, contexto)

            # El primer intento desactiva el thinking; si el modelo no lo admite
            # (error 400) se reintenta sin ese campo.
            deshabilitar_thinking = intento == 0
            try:
                texto, finish_reason = call_gemini(
                    api_key, model, contents, deshabilitar_thinking, system_prompt
                )
            except GeminiAPIError as e:
                print(f"[CHATBOT ERROR] Gemini ({model}) intento {intento + 1}: {e}")

                if e.es_clave_invalida or e.code in (401, 403):
                    print("[CHATBOT ERROR] GEMINI_API_KEY inválida o sin permisos: revisa el .env.")
                    return get_fallback_response(user_message, contexto)

                if deshabilitar_thinking and e.es_error_de_thinking:
                    continue  # thinkingConfig no soportado por este modelo

                if e.code == 429:
                    # Cuota del modelo agotada (el plan gratuito limita las
                    # peticiones por día): reintentar no ayuda, se pasa al
                    # siguiente modelo, que tiene su propia cuota.
                    print(f"[CHATBOT WARN] Cuota agotada para {model}, probando otro modelo.")
                    break

                if e.code in STATUS_REINTENTABLES or e.code == 0:
                    time.sleep(ESPERA_BASE_SEGUNDOS * (intento + 1))
                    continue

                break  # error del modelo (p. ej. 404 retirado): pasar al siguiente
            except Exception as e:
                print(f"[CHATBOT ERROR] Gemini ({model}) intento {intento + 1}: {type(e).__name__}: {e}")
                time.sleep(ESPERA_BASE_SEGUNDOS * (intento + 1))
                continue

            if texto:
                if finish_reason == "MAX_TOKENS":
                    print(f"[CHATBOT WARN] Respuesta de {model} truncada por maxOutputTokens.")
                return texto

            print(f"[CHATBOT WARN] Gemini ({model}) devolvió texto vacío (finishReason={finish_reason}).")
            break

    print("[CHATBOT ERROR] Todos los modelos de Gemini fallaron: usando respuestas de respaldo.")
    return get_fallback_response(user_message, contexto)


def _vuelos_relevantes(message: str, contexto: str) -> list:
    """Líneas de vuelo del contexto que tienen relación con el mensaje."""
    lineas = [l for l in (contexto or "").splitlines() if l.startswith("- ") and "→" in l]
    if not lineas:
        return []
    palabras = {p for p in re.split(r"[^a-z0-9]+", normalizar(message)) if len(p) >= 4}
    relevantes = [l for l in lineas if any(p in normalizar(l) for p in palabras)]
    return (relevantes or lineas)[:3]


def get_fallback_response(message: str, contexto: str = "") -> str:
    """Respuestas de fallback cuando la IA no está disponible."""
    message_lower = message.lower()

    if any(word in message_lower for word in ["hola", "buenos", "buenas", "saludos"]):
        return "¡Hola! Soy ExploraBot, el asistente virtual de ExploraTur. ¿En qué puedo ayudarte hoy?"

    if any(word in message_lower for word in ["gracias", "muchas"]):
        return "¡De nada! Estoy aquí para ayudarte. ¿Hay algo más en lo que pueda asistirte?"

    if any(word in message_lower for word in ["adiós", "adios", "chao", "hasta"]):
        return "¡Hasta pronto! Gracias por contactar a ExploraTur. ¡Que tengas un excelente viaje!"

    if any(word in message_lower for word in ["vuelo", "vuelos", "avion", "aéreo"]):
        base = "Ofrecemos vuelos nacionales e internacionales con las principales aerolíneas."
    elif any(word in message_lower for word in ["hotel", "hoteles", "alojamiento"]):
        base = "Trabajamos con hoteles en los principales destinos turísticos de Colombia. ¿Buscas alojamiento en alguna ciudad?"
    elif any(word in message_lower for word in ["precio", "costo", "valor", "cuanto"]):
        base = "Nuestros precios varían según el producto y servicio. Te recomiendo consultar nuestro catálogo o contactar a nuestro equipo de ventas."
    elif any(word in message_lower for word in ["pqr", "queja", "reclamo", "petición", "solicitud"]):
        base = "Puedo ayudarte a registrar tu PQR (Petición, Queja o Reclamo). Para mayor agilidad, te sugiero hacerlo desde la sección de PQR en tu panel de usuario, o contactar directamente a soporte@exploratur.com."
    elif any(word in message_lower for word in ["contacto", "teléfono", "email", "correo", "dirección"]):
        base = "Puedes contactarnos:\n- Teléfono: +57 300 123 4567\n- Email: info@exploratur.com\n- Dirección: Bogotá, Colombia\n- Horario: Lunes a Viernes 8am-6pm"
    elif any(word in message_lower for word in ["compra", "comprar", "reservar", "reserva"]):
        base = "Para realizar una compra, puedes explorar nuestros productos y servicios en el catálogo. Si necesitas ayuda, nuestro equipo está disponible para asistirte en el proceso."
    else:
        base = "Puedo ayudarte con información sobre nuestros productos (vuelos, hoteles, paquetes, excursiones), procesos de compra, o recibir tus PQR. ¿En qué puedo asistirte?"

    vuelos = _vuelos_relevantes(message, contexto)
    if vuelos:
        base += "\n\nVuelos que tenemos registrados ahora mismo:\n" + "\n".join(vuelos)
    return base


@router.post("")
def chat(data: ChatbotRequest, db: Session = Depends(get_db)):
    """Endpoint principal del chatbot."""
    session_id = data.session_id or str(uuid.uuid4())

    conversacion = db.query(Conversacion).filter(Conversacion.session_id == session_id).first()
    if not conversacion:
        try:
            current_user = None
        except Exception:
            current_user = None

        conversacion = Conversacion(
            usuario_id=None,
            session_id=session_id,
        )
        db.add(conversacion)
        db.commit()
        db.refresh(conversacion)

    # El historial se arma ANTES de guardar el mensaje nuevo; de lo contrario el
    # mensaje actual se enviaba duplicado a Gemini (dos turnos 'user' seguidos).
    history = []
    mensajes_previos = db.query(Mensaje).filter(
        Mensaje.conversacion_id == conversacion.id
    ).order_by(Mensaje.id.desc()).limit(10).all()
    mensajes_previos.reverse()

    for m in mensajes_previos:
        history.append({"rol": m.rol, "contenido": m.contenido})

    msg_user = Mensaje(
        conversacion_id=conversacion.id,
        rol="user",
        contenido=data.mensaje,
    )
    db.add(msg_user)
    db.commit()

    # Datos reales de vuelos/productos/servicios para que el modelo responda
    # con cifras exactas en vez de respuestas genéricas ("consulte con un asesor").
    contexto = construir_contexto(db, data.mensaje)

    respuesta_texto = get_gemini_response(data.mensaje, history, contexto)

    msg_assistant = Mensaje(
        conversacion_id=conversacion.id,
        rol="assistant",
        contenido=respuesta_texto,
    )
    db.add(msg_assistant)
    db.commit()

    return {
        "respuesta": respuesta_texto,
        "session_id": session_id,
    }


@router.get("/historial/{session_id}")
def historial_conversacion(session_id: str, db: Session = Depends(get_db)):
    """Obtiene el historial de una conversación."""
    conversacion = db.query(Conversacion).filter(Conversacion.session_id == session_id).first()
    if not conversacion:
        return {"mensajes": [], "session_id": session_id}

    mensajes = db.query(Mensaje).filter(
        Mensaje.conversacion_id == conversacion.id
    ).order_by(Mensaje.created_at.asc()).all()

    return {
        "session_id": session_id,
        "mensajes": [
            {
                "rol": m.rol,
                "contenido": m.contenido,
                "created_at": m.created_at.isoformat() if m.created_at else None,
            }
            for m in mensajes
        ],
    }
