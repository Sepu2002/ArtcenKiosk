#!/bin/bash
# Lanza el backend del kiosco (Flask) y luego Chromium en modo kiosco
# apuntando a él. Pensado para ejecutarse al arrancar el Pi.

set -uo pipefail

APP_DIR="/home/pi/ArtcenKiosk"
LOG_FILE="$APP_DIR/kiosk_launch.log"
SERVER_URL="http://127.0.0.1:5000"

cd "$APP_DIR" || { echo "No se encontró $APP_DIR"; exit 1; }

echo "$(date '+%F %T') Iniciando servidor de Kiosco..." >> "$LOG_FILE"

# --- Servidor Flask ---
# Corre en un bucle: si server.py se cae (error de puerto serie, excepción
# no manejada, etc.) se reinicia solo en vez de dejar al kiosco sin backend.
(
  while true; do
    ./venv/bin/python server.py >> "$LOG_FILE" 2>&1
    echo "$(date '+%F %T') server.py terminó (código $?), reiniciando en 2s..." >> "$LOG_FILE"
    sleep 2
  done
) &
SERVER_WATCHDOG_PID=$!

# --- Espera activa a que el servidor responda, en vez de un sleep fijo ---
echo "Esperando a que el servidor responda en $SERVER_URL..."
READY=0
for i in $(seq 1 30); do
    if curl -sf "$SERVER_URL/api/config" > /dev/null 2>&1; then
        echo "Servidor listo."
        READY=1
        break
    fi
    sleep 1
done
if [ "$READY" -ne 1 ]; then
    echo "$(date '+%F %T') El servidor no respondió tras 30s, abriendo Chromium igual." >> "$LOG_FILE"
fi

# --- Navegador en modo Kiosco, apuntando al servidor LOCAL ---
echo "Iniciando Chromium en modo Kiosco."
/bin/chromium \
  --kiosk \
  --ozone-platform=wayland \
  --start-fullscreen \
  --noerrdialogs \
  --disable-infobars \
  --disable-session-crashed-bubble \
  --disable-pinch \
  --overscroll-history-navigation=0 \
  --app="$SERVER_URL/" &
CHROMIUM_PID=$!

# Mantiene este script "vivo" mientras Chromium esté abierto. Si Chromium se
# cierra (se lo mata, crashea, se reinicia el escritorio), el script termina
# y lo que lo haya lanzado (autostart/systemd) puede reintentar desde cero.
wait "$CHROMIUM_PID"

kill "$SERVER_WATCHDOG_PID" 2>/dev/null
