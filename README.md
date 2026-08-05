# ArtcenKiosk — Casillero Inteligente de Paquetería

Kiosco de autoservicio para depósito y recogida de paquetes, construido sobre
una Raspberry Pi 5 en modo kiosco, una placa controladora de casilleros
(protocolo serie) y un lector de códigos QR USB.

El servidor (Flask + SQLite) es la única autoridad sobre qué casillero se
abre y qué código de recogida es válido — el frontend nunca decide eso por
su cuenta, solo muestra lo que el servidor confirma.

## Hardware

- **Raspberry Pi 5**, corriendo Chromium en modo kiosco.
- **Placa controladora de casilleros** ("Chinese locker board"), conectada
  por USB-serie. Se le habla con un protocolo binario propio (ver
  [`hardware.py`](hardware.py)).
- **Lector de códigos QR USB**, funciona como teclado ("wedge"): al escanear,
  escribe el contenido del QR donde esté el foco y termina con Enter. No
  necesita driver ni integración especial — el frontend solo mantiene el
  campo de código enfocado.

## Arquitectura

```
Navegador (Chromium kiosco)
   │  fetch /api/...
   ▼
server.py (Flask)  ──lee──►  config.py (.env)
   │                              
   ├──► db.py ──► kiosk.db (SQLite: casilleros + auditoría)
   │
   └──► hardware.py ──serie──► Placa de casilleros
```

- **`server.py`** — único punto de entrada HTTP. Sirve el frontend estático
  y expone la API. Traduce casillero lógico → canal físico, valida sesión de
  admin, y es el único lugar donde se decide si un código de recogida es
  válido.
- **`config.py`** — única fuente de configuración por sitio (lee `.env`).
- **`db.py`** — única fuente de estado persistente (SQLite): quién tiene qué
  casillero, y un registro de auditoría de cada depósito/recogida/apertura
  manual.
- **`hardware.py`** — único lugar que toca el puerto serie. No sabe qué es
  un "casillero", solo abre/consulta canales físicos.

### Frontend (`js/`)

| Archivo | Rol |
|---|---|
| `main.js` | Punto de entrada: carga configuración y estado, conecta los botones principales. |
| `utils/config.js` | Claves de EmailJS y URL base de la API; `NUM_LOCKERS` se pide al servidor. |
| `utils/state.js` | Estado en memoria de los casilleros (`GET /api/lockers`), sin lógica propia de validación. |
| `utils/hardware.js` | `waitForDoorClose()` — sondea el estado de la puerta hasta que se cierra. |
| `utils/csv.js` | Exporta un reporte de solo lectura del estado actual. |
| `widgets/modal.js` | Sistema genérico de modales + teclado en pantalla. |
| `widgets/admin.js` | Login, panel de administración, depósito, gestión de casilleros. |
| `widgets/customer.js` | Pantalla de recogida (código manual o escaneado). |

## Puesta en marcha

```bash
git clone https://github.com/Sepu2002/ArtcenKiosk.git
cd ArtcenKiosk
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Dar acceso al puerto serie sin necesitar `sudo`:

```bash
sudo usermod -aG dialout $USER
sudo reboot   # el grupo solo aplica en una sesión nueva
```

Configurar el sitio:

```bash
cp .env.example .env
python3 -c "import secrets; print(secrets.token_hex(32))"   # → pegar como SECRET_KEY
python3 set_admin_password.py                                 # → pegar como ADMIN_PASSWORD_HASH
```

Ajustar en `.env` lo que corresponda a este sitio (ver tabla abajo), y
arrancar:

```bash
./venv/bin/python server.py
```

El frontend queda servido en `http://127.0.0.1:5000/` — no hace falta
ningún servidor web aparte.

## Variables de entorno (`.env`)

| Variable | Default | Descripción |
|---|---|---|
| `NUM_LOCKERS` | `8` | Cantidad de casilleros de este sitio. |
| `LOCKER_CHANNELS` | `1..NUM_LOCKERS` | Mapeo casillero → canal físico de la placa, en orden. Se usa cuando un puerto dañado obliga a recablear a otros canales (ej. `2,3,4,5`). |
| `DISABLED_LOCKERS` | *(vacío)* | IDs de casilleros que existen pero están fuera de servicio (ej. `1` o `1,4`). Se excluyen de todo flujo y nunca se sondean por serie. |
| `SERIAL_PORT` | `/dev/ttyUSB0` | Puerto serie de la placa. |
| `BAUD_RATE` | `9600` | Velocidad del puerto serie. |
| `PICKUP_CODE_LENGTH` | `8` | Longitud (caracteres hex) del código de recogida generado. |
| `SECRET_KEY` | *(aleatoria)* | Clave de sesión de Flask — generar una fija en producción o las sesiones de admin no sobreviven un reinicio. |
| `ADMIN_PASSWORD_HASH` | *(admin123 por defecto)* | Hash de la contraseña de administrador — generar con `set_admin_password.py`. |
| `SESSION_LIFETIME_MINUTES` | `30` | Duración de la sesión de admin. |
| `PICKUP_RATE_LIMIT_ATTEMPTS` | `5` | Intentos de código de recogida permitidos por IP... |
| `PICKUP_RATE_LIMIT_WINDOW_SECONDS` | `60` | ...dentro de esta ventana, antes de bloquear temporalmente. |
| `DB_PATH` | `kiosk.db` | Ruta de la base de datos SQLite. |
| `LOG_FILE` | `action_log.log` | Ruta del archivo de log. |

`config.py` es la única parte del código que lee estas variables — nada más
debería tocar `os.environ` directamente.

## API

Toda la API vive bajo `/api/`. Las rutas `/api/admin/*` requieren sesión de
administrador (`POST /api/admin/login`); el resto son públicas.

| Ruta | Método | Descripción |
|---|---|---|
| `/api/config` | GET | `{ numLockers }` |
| `/api/lockers` | GET | Estado combinado (hardware + BD) de todos los casilleros. Incluye `pickupCode` solo si hay sesión de admin. |
| `/api/lockers/<id>/status` | GET | Estado físico de un casillero (usado para el sondeo de puerta cerrada). |
| `/api/admin/login` | POST | `{ password }` → inicia sesión. |
| `/api/admin/logout` | POST | Cierra sesión. |
| `/api/admin/session` | GET | `{ isAdmin }` |
| `/api/admin/deposit` | POST | `{ bayId, email }` → abre el casillero y genera el código de recogida. |
| `/api/admin/deposit/confirm` | POST | `{ bayId }` → confirma el depósito una vez cerrada la puerta. |
| `/api/admin/open` | POST | `{ bayId }` → apertura manual (mantenimiento). |
| `/api/admin/clear` | POST | `{ bayId }` → libera un casillero. |
| `/api/pickup` | POST | `{ code }` → valida el código y abre el casillero (con límite de intentos). |
| `/api/pickup/confirm` | POST | `{ bayId, code }` → confirma la recogida una vez cerrada la puerta. |
| `/api/log` | POST | Registra un evento del frontend en el log del servidor. |

## Seguridad

- La contraseña de admin y los códigos de recogida se validan **solo en el
  servidor** — nunca en el navegador.
- Los códigos de recogida son aleatorios (`secrets.token_hex`), no derivados
  de la hora.
- `/api/pickup` tiene límite de intentos por IP para evitar fuerza bruta.
- La sesión de admin es una cookie firmada por Flask con expiración
  configurable.
- El estado vive en SQLite en el servidor, no en `localStorage` del
  navegador — sobrevive a que se borre la caché y queda un registro de
  auditoría (`events` en `kiosk.db`).

## Despliegue en el kiosco (Raspberry Pi)

`run_kiosk.sh` arranca todo al iniciar el Pi:

1. Lanza `server.py` en un bucle (se reinicia solo si se cae).
2. Espera activamente a que el servidor responda.
3. Espera a que el socket de Wayland del compositor exista (evita pantalla
   en blanco por arrancar Chromium antes de tiempo).
4. Abre Chromium en modo kiosco apuntando a `http://127.0.0.1:5000/`, y lo
   reintenta si se cierra casi de inmediato tras arrancar.

Se dispara vía `~/.config/autostart/kiosk.desktop` (autostart XDG), que
apunta a `/home/pi/ArtcenKiosk/run_kiosk.sh`. Todo lo que imprime queda en
`kiosk_launch.log`, dentro de la carpeta del proyecto.

## Limitaciones conocidas / próximos pasos

- El servidor Flask corre con el servidor de desarrollo integrado (`app.run`)
  — suficiente para un kiosco de un solo sitio, pero no pensado para alta
  concurrencia. Si esto se convierte en algo con más tráfico, pasar a un WSGI
  de producción (gunicorn/waitress) sería el siguiente paso natural.
- El envío de correo usa EmailJS directo desde el navegador (claves
  públicas por diseño de EmailJS) — vale la pena restringir los orígenes
  permitidos desde el panel de EmailJS.
- Pensado para un único kiosco: todo corre en `127.0.0.1` y el panel de
  administración solo es accesible desde la pantalla del propio kiosco. No
  hay administración remota ni sincronización entre sitios — fue una
  decisión consciente para este despliegue, no una limitación técnica del
  diseño (agregarlo más adelante implicaría sumar autenticación de red y
  HTTPS reales).
