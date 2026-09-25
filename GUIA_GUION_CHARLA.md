# GUION PURO para aprender de memoria — ExploraTur

> Lo que está **sin corchetes** se dice tal cual. Lo que está en **[CORCHETES]** es una
> acción (clic, abrir archivo), no se lee en voz alta.

---

# ⏱ PARTE 1 — LA PÁGINA (7 min)

**[Pantalla: landing `/` y DevTools abiertas en F12]**

> Buenas tardes. Mi nombre es Anderson Florez y les voy a presentar **ExploraTur**, una
> plataforma web de turismo hecha con **React + Vite** en el frontend y una **API REST en
> FastAPI** en el backend, con base de datos **MySQL**, autenticación con **JWT** y control
> de roles. Tiene catálogo de vuelos, ventas, facturación, reportes con exportación a PDF y
> Excel, dashboards con gráficos, módulo PQR y un chatbot con inteligencia artificial.
> Todas las rutas de la aplicación están en `frontend/src/App.jsx`, y acá en la portada se
> ve el menú público: inicio, quiénes somos, contacto y vuelos.

**[Clic en "Vuelos"]**

> Vamos al catálogo de vuelos. Esto es totalmente público: cualquiera puede entrar y
> buscar. Acá filtre por origen y me muestra los resultados, cada uno con su precio, su
> horario y también el **porcentaje de impuesto y de descuento** que tiene ese vuelo, que
> es lo que se va a aplicar cuando alguien lo compre.
>
> Ahora intento guardar un vuelo en favoritos sin haber iniciado sesión… y me aparece el
> modal que me pide iniciar sesión. Eso es **control de acceso**: el catálogo se puede ver,
> pero las acciones que modifican datos exigen token. El backend es el que lo exige, no el
> frontend.

**[Clic en "Ingresar", escribir admin@exploratur.com / Admin1@, DevTools → Network]**

> Me logueo como administrador. Antes de dar clic, dejé abierta la pestaña **Network** de
> las herramientas de desarrollo. Entro… y acá está lo importante: miren el request de
> login, en **Headers → Request Headers** aparece `Authorization: Bearer eyJ…`. Ese es el
> **JWT**: lo genera el backend, lo firma con HS256 y a partir de ese momento **todas** las
> peticiones lo traen en el header. Si el token expira, el backend responde 401 y la
> aplicación cierra la sesión sola. El token se guarda en `localStorage` con la llave
> `exploratur_token`, que es justo lo que lee `utils/api.js`.

**[Pantalla: panel `/admin`, recorrer las pestañas]**

> Entré al panel de administración. Tiene nueve módulos: dashboard, usuarios, productos,
> servicios, vuelos, ventas, facturación, reportes y PQR. En **usuarios** puedo crear,
> editar y desactivar cuentas con validación en vivo. En **productos y servicios** hago el
> CRUD completo. En **vuelos** ven la columna nueva **"Imp. / Desc."**, que muestra el 19%
> de IVA y el 5% de descuento, y esos dos porcentajes se pueden editar desde el
> formulario.
>
> Acá en **ventas** voy a registrar una venta en vivo… selecciono el producto, la
> cantidad… y al guardar, el sistema valida que exista el producto, que esté activo y que
> haya stock, y **descuenta el stock** en la misma operación. En **facturación** aparece
> la factura de esa venta.
>
> En **reportes** tengo el reporte diario del día de hoy, con las tarjetas de totales y
> la tabla de ventas; esto mismo lo vemos por dentro en la segunda parte. Y en **PQR**
> están las peticiones de los clientes con sus estadísticas.

**[Ventana incógnito: login como cliente o registro]**

> Ahora me voy a la ventana de incógnito para mostrar el rol **cliente**. En `/vuelos`
> compro un vuelo con dos pasajeros. Fíjense que el modal ya me desglosa la compra:
> subtotal, descuento, impuestos y total. Confirmando… el sistema crea la venta, resta
> los asientos y **genera automáticamente la factura en estado Pagada**, todo en una sola
> operación.

**[Volver a la ventana principal, abrir el chatbot]**

> Y por último el asistente **ExploraBot**, que está abajo a la derecha. Le pregunto
> "¿tienen vuelos a Cartagena?" y me responde con inteligencia real **y con datos
> exactos de la base**: número de vuelo, fecha, horarios, precio por persona, asientos,
> IVA y descuento. Esto también lo explico a fondo en la parte 2.

> Hasta acá la vista de usuario. Ahora abrimos el código y los endpoints para ver cómo
> funciona por dentro cada módulo: primero el **dashboard** del panel de administrador,
> después los **reportes diarios** y al final el **chatbot**.

---

# ⏱ PARTE 2 — A FONDO: CÓDIGO + ENDPOINTS (13 min)

**[Pantalla: VS Code con las pestañas ya abiertas. Para cada bloque: código → app → `/docs` → comparar JSON con la tarjeta]**

---

## BLOQUE A — El dashboard del panel de administrador (4 min)

**[Abrir `frontend/src/pages/AdminPanel.jsx`, línea 204]**

> Bueno, el dashboard empieza en el frontend. En `AdminPanel.jsx`, en la **línea 204**,
> está la función **`loadDashStats`**. Eso es literalmente tres líneas: hace
> `const d = await apiGetDashboardStats()` y luego `setDashStats(d)` en la línea 207,
> o sea guarda la respuesta en el estado de React. Y en la **línea 414**, cuando
> `tab === 'dashboard'`, se pintan las tarjetas: por ejemplo la **línea 423** es la
> tarjeta "Total Ventas", y su valor es `dashStats.total_ventas`, con el subtítulo
> `dashStats.ingresos_totales`.

**[Abrir `frontend/src/utils/api.js`, líneas 391 y 39]**

> ¿Y de dónde sale `apiGetDashboardStats`? De `utils/api.js`, **línea 391**, y lo único
> que hace es llamar a `apiRequest('/stats/dashboard')`. Y `apiRequest`, que está en la
> **línea 39** de ese mismo archivo, es **el puente por el que pasa todo el frontend**:
> agarra el token con `getToken()`, que lee `localStorage['exploratur_token']`, y en la
> **línea 49** lo monta en el header `Authorization: Bearer …`, hace el `fetch` y devuelve
> el JSON. Y ojo con la **línea 62**: si el backend responde **401**, borra el token, borra
> la sesión y dispara el evento `session-changed`, que es lo que hace que la UI cierre la
> sesión automáticamente. Ese mismo `apiRequest` es el que usan todos los módulos, así que
> la autenticación se resuelve en un solo lugar.

**[Abrir `backend_fastapi/routes/stats.py`, línea 20]**

> En el backend, FastAPI enruta esa petición a `routes/stats.py`, función
> **`dashboard_stats`** en la **línea 20**. Lo primero que se fija es esta dependencia:
> `current_user: dict = Depends(get_current_user)`. Eso significa que **antes de ejecutar
> una sola consulta**, la petición pasa por `middleware/auth.py`, **línea 67**, donde se
> decodifica el JWT con la clave secreta, se verifica que no haya expirado y se devuelve el
> usuario. Si no hay token o está vencido, responde 401 y esta función **nunca se ejecuta**.
>
> Una vez dentro, ¿qué hace? **Agregaciones directamente en SQL**, no en Python. En la
> **línea 25**, `func.count(Usuario.id)` para total de usuarios; en la **línea 35**,
> `func.sum(Venta.total)` filtrando solo ventas **Confirmada o Completada** para los
> ingresos; en la 38, la suma de las facturas pagadas; y así sucesivamente: productos,
> servicios, vuelos, PQR, pendientes. Cada dato de una tarjeta es una consulta.

**[stats.py, líneas 64 a 77]**

> Y acá está lo más interesante, en las **líneas 64 a 77**: **el mismo endpoint devuelve
> formas distintas según el rol**. Si el rol es Empleado, con `pop` se le quitan
> `total_usuarios` y `usuarios_activos`, porque un empleado no debe ver la gestión de
> usuarios. Y si el rol es Cliente, la respuesta se **reemplaza por completo** y solo
> trae `mis_ventas`, `mis_pqr`, `total_productos` y `total_servicios`. O sea, la
> seguridad no está en el frontend: está acá, en el backend, mirando el rol que viene
> dentro del token.

**[AdminPanel.jsx línea 213 y luego DashboardCharts]**

> Para los gráficos hay tres endpoints más: `ventas-por-periodo` en `stats.py` línea 82,
> `ventas-por-producto` en la 140 y `ventas-mensuales` en la 216. Los llama la función
> **`loadChartData`** de `AdminPanel.jsx`, **línea 213**, que manda el período
> (diario, semanal o mensual) y las fechas, y esos arreglos los pinta la librería
> **Recharts** en `components/charts/DashboardCharts.jsx`.

**[Demo: abrir `localhost:8000/docs` → GET /api/stats/dashboard → Authorize → Execute]**

> Ahora lo pruebo en vivo desde la documentación interactiva. `GET /api/stats/dashboard`,
> le doy en **Authorize**, pego el token —que lo copio del `localStorage` en Application,
> llave `exploratur_token`— y **Execute**. Y miren la respuesta: `total_usuarios: 8`,
> `ingresos_totales: …`, `total_ventas: …`. Ese JSON es **exactamente** lo que se pinta en
> las tarjetas de la pantalla. Si quito el token y lo ejecuto de nuevo, me devuelve
> **401**. Y si lo ejecuto con el token de un cliente, la respuesta cambia de forma, tal
> como les dije.
>
> Resumen: el frontend nunca toca la base de datos; pide JSON a la API, y la API decide
> qué ve cada rol.

**Pregunta típica del jurado:** *¿por qué los conteos están en el backend y no en el
frontend?* → "Porque el cliente no debe ver datos crudos, y porque sumar en SQL con
`func.sum` y `func.count` es mucho más eficiente que traer todos los registros y
agregarlos en JavaScript."

---

## BLOQUE B — Los reportes diarios (4,5 min)

**[Abrir `frontend/src/pages/ReportesPage.jsx`, líneas 10 y 15]**

> El reporte diario empieza en `ReportesPage.jsx`. En la **línea 10** se guarda la fecha
> en el estado, con hoy como valor por defecto, y en la **línea 15** está la función
> **`loadReport`**: toma esa fecha y hace
> `const data = await apiGetDailyReport(fecha)` y con `setReporte(data)` pinta todo. Esa
> función vive en `utils/api.js` **línea 314** y hace
> `apiRequest('/ventas/reporte-diario?fecha=' + fecha)`… el mismo puente, con el mismo
> JWT.

**[Abrir `backend_fastapi/routes/ventas.py`, línea 294]**

> En el backend está en `routes/ventas.py`, función **`reporte_diario`**, **línea 294**.
> Primero valida el parámetro `fecha` con `Query(...)`: si no viene o no tiene formato
> `YYYY-MM-DD`, devuelve **400**. Y fíjense en el decorador: tiene
> `Depends(require_admin_or_employee)`, que está en `middleware/auth.py` **línea 125**.
> Eso significa que **un cliente no puede leer reportes**, recibiría un 403.
>
> La consulta es la **línea 305**:
> `db.query(Venta).filter(func.date(Venta.created_at) == fecha_date)` — trae todas las
> ventas de ese día. Luego, en las **líneas 306 a 310**, arma el resumen con cuatro
> sumatorias: `total_ventas` contando registros, `total_ingresos` sumando `v.total`,
> `total_impuestos` sumando `v.impuestos` y `total_descuentos` sumando `v.descuento`.
> Y a partir de la **línea 311** recorre cada venta y devuelve el detalle: número de
> venta, hora, cliente, los ítems —que resuelve a nombres legibles con la función
> `resolver_nombre_item` de la **línea 31**, que según el tipo consulta la tabla de
> productos, la de servicios o la de vuelos—, subtotal, impuestos, descuento, total y
> estado.
>
> De vuelta en el frontend, ese `resumen` es el que alimenta las tarjetas de las
> **líneas 143 a 151** de `ReportesPage.jsx`, y ese arreglo de ventas es el que alimenta
> la tabla.

**[Explicar impuestos y descuentos]**

> ¿Y de dónde salen los impuestos y los descuentos? Cada vuelo tiene dos columnas en la
> base de datos: **`impuesto_porcentaje`**, que es el IVA del 19%, y
> **`descuento_porcentaje`**, que es el 5%. Están definidas en el modelo `Vuelo` de
> `backend_fastapi/models/models.py` y se editan desde Admin → Vuelos.
>
> Cuando un cliente compra, se ejecuta **`comprar_vuelo`** en `routes/ventas.py`,
> **línea 164**. En la **línea 181** toma el precio del vuelo y lo multiplica por la
> cantidad, y de ahí calcula con `Decimal` —no con `float`, porque el flotante pierde
> centavos en dinero—: en la **línea 187** hace el descuento
> (`bruto × porcentaje`), en la **189** los impuestos sobre la base
> (`base × porcentaje`) y en la **190** `total = base + impuestos`. Con esos valores crea
> la venta, el detalle, y genera la factura en estado Pagada.
>
> Además, al arrancar el servidor, `main.py` ejecuta dos funciones de migración:
> `migrate_vuelos_impuestos`, que agrega las columnas a la tabla `vuelos` si no existen,
> y **`backfill_impuestos_vuelos`**, que recorre las ventas de vuelos que quedaron en cero
> y les recalcula impuestos, descuento y total. Por eso el reporte de hoy ya no muestra
> esas tarjetas en $0.

**[Demo en vivo: pestaña Reportes]**

> Lo pruebo en vivo: pestaña **Reportes**, dejo la fecha de hoy, **Generar Reporte**, y
> acá están las cuatro tarjetas con los totales y la tabla con cada venta. Ahora le doy
> **Exportar PDF**… y abre el archivo con el encabezado, las tarjetas y la tabla. Y
> **Exportar Excel**… con el detalle fila por fila y una fila de totales al final. El PDF
> lo genera la **línea 24** `exportPDF` con la librería **jsPDF**, y el Excel la **línea
> 78** `exportExcel` con **SheetJS**.

**Pregunta típica del jurado:** *¿cómo se calcula el total de una venta?*
→ "`total = subtotal − descuento + impuestos`, en `routes/ventas.py`, con `Decimal` para
no perder precisión monetaria."

---

## BLOQUE C — El chatbot (4 min)

**[Abrir `frontend/src/components/Chatbot.jsx`]**

> Bueno, y el chatbot funciona de la siguiente manera. En
> **`components/Chatbot.jsx`** hay un componente con varias variables de estado en las
> **líneas 30 a 36**: `isOpen` para abrir y cerrar la ventana, `messages` que es el
> arreglo donde se guardan todos los mensajes, `loading` para el indicador de
> "escribiendo", y **`sessionId`, que arranca en `null`**.
>
> Cuando el usuario escribe y oprime Enter, se ejecuta **`handleSend`** en la **línea
> 43**: limpia el input, mete el mensaje del usuario en el arreglo con `setMessages` en
> la **línea 48** —para que se pinte al instante sin esperar al servidor—, pone `loading`
> en `true` y en la **línea 52** llama a **`apiChatbot(userMsg, sessionId)`**. Esa
> función está en `utils/api.js`, **línea 421**, y simplemente hace un **POST a
> `/api/chatbot`** con el body `{ mensaje, session_id }`. Cuando llega la respuesta, en la
> **línea 53** agrega `data.respuesta` a los mensajes y en la **línea 54** guarda
> `data.session_id`.
>
> Y ahí está la clave de la memoria: la **primera** vez mandamos `session_id: null`,
> entonces el backend nos devuelve uno nuevo, y **a partir de ahí lo mandamos siempre
> el mismo**, por eso la conversación se recuerda.

**[Abrir `backend_fastapi/routes/chatbot.py`, línea 427]**

> En el backend, la función **`chat`** está en `routes/chatbot.py`, **línea 427**. Como
> `session_id` viene vacío, en la **línea 429** genera uno con **`uuid.uuid4()`**; en la
> **línea 431** busca la conversación en la tabla **`conversaciones`** y si no existe la
> crea, en las líneas 438 a 444. Luego, en la **línea 449**, trae los **últimos 10
> mensajes** de la tabla **`mensajes`**, los invierte para que queden en orden, y esos
> son el historial. En la **línea 457** guarda el mensaje del usuario con `rol="user"` y
> hace `commit`.
>
> Y acá viene lo importante de este módulo: en la **línea 467** está
> **`contexto = construir_contexto(db, data.mensaje)`**. Ahí el chatbot **consulta la
> base de datos antes de preguntarle a la IA**, y por eso no responde cosas vagas como
> "consulte con un asesor". Esa función está en la **línea 141** y hace esto: en la
> **línea 149** limpia las palabras del mensaje —saca tildes y mayúsculas con
> `normalizar`, de la **línea 109**— y se queda con las de tres letras o más; en la
> **línea 151** trae todos los vuelos activos; en la **línea 153** se queda con los que
> **coinciden con el mensaje**, o sea si preguntan por "cartagena" agarra los vuelos con
> destino Cartagena —y si no coincide ninguno, usa los vuelos futuros, en la **línea
> 163**—. Les pone formato con **`formato_vuelo`**, de la **línea 129**: número de vuelo,
> aerolínea, ruta, fecha, horarios, duración, clase, **precio por persona, asientos,
> IVA y descuento**, tal como están en la tabla. Después agrega los productos y servicios
> activos (línea 165) y cierra con las **reglas para responder con datos exactos** de la
> **línea 204**: *"usa SOLO estas cifras, escritas tal cual; si la ruta no aparece en la
> lista, dilo y ofrece los destinos disponibles; no inventes"*.
>
> Con ese contexto, en la **línea 469** llama a
> **`get_gemini_response(mensaje, history, contexto)`**; cuando termina, guarda la
> respuesta con `rol="assistant"` en la **línea 471** y devuelve
> `{ respuesta, session_id }` en la **línea 479**.

**[chatbot.py, línea 310]**

> ¿Y qué hace `get_gemini_response`, en la **línea 310**? Primero arma el prompt: en las
> **líneas 318 a 320** une el **`SYSTEM_PROMPT`** —que está en la **línea 83** y es la
> personalidad de ExploraBot: responde en español, entre 3 y 6 oraciones y **no inventa
> precios**— **con el contexto que acabamos de traer de la base de datos**. Ese texto
> completo es el que viaja como `system_instruction`. Después lee la API key con
> `get_api_key()` de la **línea 43** —**si no hay clave no truena, se va al fallback**—,
> arma el contenido con **`build_gemini_contents`**, de la **línea 216**, que convierte
> el historial de la base al formato que exige Gemini y fusiona dos turnos consecutivos
> del mismo rol, y entra al bucle de la **línea 330**: recorre los modelos candidatos
> —el configurado y los de respaldo de la **línea 24**— con **2 intentos por modelo** y
> un **tope total de 45 segundos**, que está en la **línea 33**, para que la interfaz
> nunca se quede colgada.
>
> La llamada HTTP está en **`call_gemini`**, **línea 247**: usa `urllib` contra la URL de
> `generativelanguage.googleapis.com` (línea 272), le manda el prompt en
> `system_instruction` (línea 278) y la configuración de la **línea 262**: `temperature`
> 0.7, `maxOutputTokens` 2048 y `thinking` deshabilitado.
>
> Y acá está la resiliencia: si Google responde **503** reintenta; si responde **429**,
> que es cuota agotada, pasa al siguiente modelo; si la clave no sirve o se acaban los
> modelos, cae en **`get_fallback_response`**, de la **línea 392**, que responde con
> textos locales por palabras clave **y le añade los vuelos del contexto con
> `_vuelos_relevantes`**, de la **línea 382**. **O sea: el chatbot nunca se queda mudo y
> nunca responde sin decirte antes qué hay en la base.**

**[Demo en vivo]**

> Lo pruebo en vivo. Mando dos mensajes encadenados en la página: primero "hola" y luego
> "¿tienen vuelos a Cartagena?"… y miren la respuesta: me da el **número de vuelo, la
> fecha, los horarios, el precio por persona, los asientos y el IVA y el descuento** —
> datos que salen de MySQL, no los inventó—, y además recuerda la conversación porque
> reutiliza el `session_id`. Ahora lo hago desde la API: abro `localhost:8000/docs`,
> **POST `/api/chatbot`**, en el body pongo `{"mensaje": "¿Cuánto cuesta el vuelo a
> Cali?"}` y **Execute**… ahí está el JSON con `respuesta` y `session_id`. Con ese mismo
> `session_id` ejecuto **GET `/api/chatbot/historial/{session_id}`** y me devuelve todos
> los turnos `user` y `assistant`. Y si quiero verlo en la base de datos:
> `SELECT rol, contenido FROM mensajes ORDER BY id DESC LIMIT 4;` — están las dos filas
> que se acaban de crear.

**Pregunta típica del jurado:** *¿de dónde saca el chatbot los precios y las fechas?*
→ "De la propia base de datos: la función `construir_contexto` de la línea 141 consulta
los vuelos, productos y servicios y se los entrega al modelo como parte del prompt, con
la regla de que use solo esos datos. Si no aparece, lo dice y no inventa."

**Otra pregunta:** *¿y si se cae Gemini o se acaba la cuota?*
→ "Se reintenta con otros modelos y, si nada funciona, responde con el fallback local de
la línea 392, que también lista los vuelos del contexto. La conversación igual queda
guardada en MySQL."

---

## CIERRE (30 s)

> Para cerrar: **FastAPI** como única puerta de entrada, **JWT con roles** para proteger
> cada endpoint, **MySQL con SQLAlchemy** para persistir, y **React** que solo consume
> JSON a través de `utils/api.js`. Vimos el **dashboard**, que agrega métricas en SQL y
> entrega datos distintos según el rol; el **reporte diario**, que consolida las ventas
> del día con sus impuestos y descuentos y se exporta a PDF y Excel; y el **chatbot**,
> con memoria en base de datos, **datos reales de la propia BD inyectados en el prompt**,
> integración real con Gemini y una capa de respaldo para
> no fallar nunca. Todo desplegado con `render.yaml`. ¡Muchas gracias! Quedo atento a sus
> preguntas.

---

## CHULETA RÁPIDA (velo 2 minutos antes)

```
A) AdminPanel.jsx:204 loadDashStats → api.js:391 → api.js:39 (Bearer)
   → stats.py:20 dashboard_stats → get_current_user (auth.py:67)
   → func.count/sum → rol: líneas 64-77 → AdminPanel.jsx:414 tarjetas → docs /stats/dashboard

B) ReportesPage.jsx:15 loadReport → api.js:314
   → ventas.py:294 reporte_diario → require_admin_or_employee (auth.py:125)
   → consulta línea 305 → resumen 306-310 → detalle 311 → tarjetas 143-151
   → impuestos: vuelo 19%/5% → comprar_vuelo 164 → cálculo 187-190 → backfill en main.py
   → exportPDF línea 24 / exportExcel línea 78

C) Chatbot.jsx:43 handleSend → :52 apiChatbot → api.js:421 POST /chatbot
   → chatbot.py:427 chat → uuid 429 → historial 449 → guarda user 457
   → construir_contexto 141 (vuelos/productos/servicios de la DB, palabras clave 149,
     coincidencias 153, formato_vuelo 129, reglas 204) → contexto en línea 467
   → get_gemini_response 310 → prompt = SYSTEM_PROMPT 83 + contexto (318-320)
   → build_gemini_contents 216 → call_gemini 247 → bucle 330 (2 intentos, 45s línea 33)
   → fallback 392 + _vuelos_relevantes 382 → guarda assistant 471 → respuesta 479
```
