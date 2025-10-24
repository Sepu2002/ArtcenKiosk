# Save this as server.py
import serial
import time
import functools
import logging # <-- 1. IMPORTAR LOGGING
from logging.handlers import RotatingFileHandler
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

# --- Protocol Configuration (Sin cambios) ---
HEADER = b'\x57\x4B\x4C\x59'  # "WKLY"
BOARD_ADDR = b'\x01'
CMD_BYTE_OPEN = b'\x82'
CMD_BYTE_CHECK = b'\x83'
CMD_OK_RESPONSE = b'\x00'

# --- Serial Port Configuration (Sin cambios) ---
SERIAL_PORT = '/dev/ttyUSB0'
BAUD_RATE = 9600
RESPONSE_LENGTH = 11

# --- Flask App Setup ---
app = Flask(__name__)
CORS(app)

# --- 2. CONFIGURACIÓN DEL LOGGING ---
# Configura el logger para que escriba en un archivo llamado 'action_log.log'
# 'RotatingFileHandler' asegura que el archivo no crezca indefinidamente.
# Creará hasta 5 archivos de respaldo de 1MB.
log_file = 'action_log.log'
log_handler = RotatingFileHandler(log_file, maxBytes=1024*1024, backupCount=5)
log_formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
log_handler.setFormatter(log_formatter)

app.logger.addHandler(log_handler)
app.logger.setLevel(logging.INFO)
app.logger.info('--- Kiosk Lock Server INICIADO ---')
# --- FIN DE CONFIGURACIÓN DE LOGGING ---


# --- Protocol Helper Functions (Sin cambios) ---
def calculate_checksum(payload):
    checksum = functools.reduce(lambda a, b: a ^ b, payload)
    return bytes([checksum])

def build_command(cmd_byte, channel, data_bytes=b''):
    channel_byte = bytes([channel])
    payload = BOARD_ADDR + cmd_byte + channel_byte + data_bytes
    length = 4 + 1 + len(payload) + 1
    length_byte = bytes([length])
    checksum = calculate_checksum(payload)
    packet = HEADER + length_byte + payload + checksum
    return packet

def _send_serial_command(command):
    print(f"Sending Command:   {command.hex(' ')}")
    try:
        with serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1.0) as ser:
            ser.flushInput()
            ser.flushOutput()
            ser.write(command)
            time.sleep(0.1)
            response = ser.read(RESPONSE_LENGTH * 2)
            if not response:
                print("Received Response: ...No response (OK for 'open')")
                return b''
            print(f"Received Response(s): {response.hex(' ')}")
            return response
    except serial.SerialException as e:
        print(f"SERIAL ERROR: {e}")
        app.logger.error(f"SERIAL ERROR: {e}") # Log del error
        return None
    except Exception as e:
        print(f"GENERAL ERROR: {e}")
        app.logger.error(f"GENERAL ERROR: {e}") # Log del error
        return None

def _get_lock_status(locker_id):
    command = build_command(CMD_BYTE_CHECK, locker_id)
    response = _send_serial_command(command)
    status_dict = {"channel": locker_id, "status": "UNKNOWN"}
    if response is not None:
        try:
            if (response[0:4] == HEADER and
                response[6] == CMD_BYTE_CHECK[0] and
                response[8] == locker_id):
                state_byte = response[9]
                if state_byte == 0x01:
                    status_dict["status"] = "LOCKED"
                elif state_byte == 0x00:
                    status_dict["status"] = "UNLOCKED"
        except IndexError:
            pass
    return status_dict

# --- Web Server API Endpoints ---

@app.route('/open-locker', methods=['POST'])
def handle_open_locker():
    data = request.get_json()
    locker_num = int(data['lockerId'])
    app.logger.info(f"Comando de APERTURA recibido para el casillero {locker_num}") # <-- LOG
    command = build_command(CMD_BYTE_OPEN, locker_num)
    response = _send_serial_command(command) 
    if response is not None:
        return jsonify({"success": True, "message": f"Locker {locker_num} command sent."})
    else:
        app.logger.error(f"Fallo al enviar comando de APERTURA al casillero {locker_num}") # <-- LOG
        return jsonify({"success": False, "error": "Failed to communicate."}), 500

@app.route('/check-status/<int:locker_id>', methods=['GET'])
def handle_check_status(locker_id):
    status_dict = _get_lock_status(locker_id)
    return jsonify({"success": True, "status": status_dict["status"], "channel": locker_id})

@app.route('/check-all-statuses', methods=['GET'])
def handle_check_all_statuses():
    all_statuses = []
    for i in range(1, 9):
        all_statuses.append(_get_lock_status(i))
    return jsonify({"success": True, "bays": all_statuses})


# --- 3. NUEVO ENDPOINT DE LOGGING ---
@app.route('/log', methods=['POST'])
def handle_log_event():
    """
    Recibe un evento de log desde el frontend (GitHub Pages) y 
    lo escribe en el archivo de log local.
    """
    data = request.get_json()
    message = data.get('message')
    level = data.get('level', 'info').upper()

    if not message:
        return jsonify({"success": False, "error": "Missing message"}), 400

    # Escribe en el archivo action_log.log
    if level == 'INFO':
        app.logger.info(f"FRONTEND: {message}")
    elif level == 'WARNING':
        app.logger.warning(f"FRONTEND: {message}")
    elif level == 'ERROR':
        app.logger.error(f"FRONTEND: {message}")
    
    return jsonify({"success": True})
# --- FIN DE NUEVO ENDPOINT ---


# --- Start the Server ---
if __name__ == '__main__':
    print("--- Starting Kiosk Lock Server (v4 - Con Logging) ---")
    print("API de logging lista en POST /log")
    print("Archivo de log guardado en: action_log.log")
    app.run(host='127.0.0.1', port=5000)