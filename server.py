# Save this as server.py
import serial
import time
import functools
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

# --- Protocol Configuration (Confirmed) ---
HEADER = b'\x57\x4B\x4C\x59'  # "WKLY"
BOARD_ADDR = b'\x01'
CMD_BYTE_OPEN = b'\x82'
CMD_BYTE_CHECK = b'\x83'
CMD_OK_RESPONSE = b'\x00'

# --- Serial Port Configuration ---
SERIAL_PORT = '/dev/ttyUSB0'
BAUD_RATE = 9600
RESPONSE_LENGTH = 11

# --- Flask App Setup ---
# Le decimos a Flask que los archivos estáticos (js, css, images) 
# están en el directorio actual ('.')
app = Flask(__name__, static_folder='.')
CORS(app)

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
            response = ser.read(RESPONSE_LENGTH * 2) # Lee más para limpiar
            
            if not response:
                print("Received Response: ...No response (OK for 'open')")
                return b''
            
            print(f"Received Response(s): {response.hex(' ')}")
            return response
            
    except serial.SerialException as e:
        print(f"SERIAL ERROR: {e}")
        return None
    except Exception as e:
        print(f"GENERAL ERROR: {e}")
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

# --- NUEVO: Rutas para servir la GUI ---

@app.route('/')
def serve_index():
    """Sirve el archivo index.html principal."""
    # Busca 'index.html' en el directorio raíz ('.')
    return send_from_directory('.', 'index.html')

@app.route('/js/<path:path>')
def serve_js(path):
    """Sirve cualquier archivo del directorio 'js'."""
    return send_from_directory('js', path)

@app.route('/css/<path:path>')
def serve_css(path):
    """Sirve cualquier archivo del directorio 'css'."""
    return send_from_directory('css', path)

@app.route('/images/<path:path>')
def serve_images(path):
    """Sirve cualquier archivo del directorio 'images'."""
    return send_from_directory('images', path)

# --- FIN NUEVO ---


# --- API Endpoints (Sin cambios) ---

@app.route('/open-locker', methods=['POST'])
def handle_open_locker():
    data = request.get_json()
    locker_num = int(data['lockerId'])
    print(f"\n--- Request received for Locker {locker_num} ---")
    command = build_command(CMD_BYTE_OPEN, locker_num)
    response = _send_serial_command(command) 
    if response is not None:
        return jsonify({"success": True, "message": f"Locker {locker_num} command sent."})
    else:
        return jsonify({"success": False, "error": "Failed to communicate."}), 500

@app.route('/check-status/<int:locker_id>', methods=['GET'])
def handle_check_status(locker_id):
    status_dict = _get_lock_status(locker_id)
    return jsonify({"success": True, "status": status_dict["status"], "channel": locker_id})

@app.route('/check-all-statuses', methods=['GET'])
def handle_check_all_statuses():
    print("\n--- Request received for ALL STATUSES ---")
    all_statuses = []
    for i in range(1, 9):
        all_statuses.append(_get_lock_status(i))
    return jsonify({"success": True, "bays": all_statuses})

# --- Start the Server ---
if __name__ == '__main__':
    print("--- Starting Kiosk Lock Server (v4 - Full Stack) ---")
    print("GUI and API running on: http://127.0.0.1:5000")
    app.run(host='127.0.0.1', port=5000)