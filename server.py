# Save this as server.py
import serial
import time
import functools
from flask import Flask, request, jsonify
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
app = Flask(__name__)
CORS(app)  # Enable Cross-Origin Resource Sharing

# --- Protocol Helper Functions ---

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
    """Internal function to send a command and return the raw response."""
    print(f"Sending Command:   {command.hex(' ')}")
    try:
        # Usamos un timeout más corto para la escritura, 
        # pero el timeout de lectura sigue siendo 1.0
        with serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1.0) as ser:
            ser.flushInput()
            ser.flushOutput()
            ser.write(command)
            time.sleep(0.1) # Damos tiempo al adaptador
            
            # Leemos cualquier cosa que la placa envíe para limpiar el buffer
            response = ser.read(RESPONSE_LENGTH * 2) # Lee hasta 22 bytes
            
            if not response:
                print("Received Response: ...No response from board (this is OK for 'open').")
                # Para 'open', no tener respuesta puede ser normal
                return b'' # Retorna bytes vacíos en lugar de None
            
            print(f"Received Response(s): {response.hex(' ')}")
            return response
            
    except serial.SerialException as e:
        print(f"SERIAL ERROR: {e}")
        return None
    except Exception as e:
        print(f"GENERAL ERROR: {e}")
        return None

def _get_lock_status(locker_id):
    """
    Internal function to check a single lock's status.
    Returns a dictionary: {"channel": id, "status": "LOCKED" | "UNLOCKED" | "UNKNOWN"}
    """
    command = build_command(CMD_BYTE_CHECK, locker_id)
    response = _send_serial_command(command)
    
    status_dict = {"channel": locker_id, "status": "UNKNOWN"}

    if response is not None:
        try:
            # Busca el paquete de respuesta de status (0x83)
            # A veces la respuesta 0x85 (no solicitada) puede colarse.
            # Necesitamos encontrar la respuesta 0x83.
            
            # Simple check: Asumimos que la respuesta 0x83 es la primera.
            if (response[0:4] == HEADER and
                response[6] == CMD_BYTE_CHECK[0] and
                response[8] == locker_id):
                
                state_byte = response[9]
                if state_byte == 0x01:
                    status_dict["status"] = "LOCKED"
                elif state_byte == 0x00:
                    status_dict["status"] = "UNLOCKED"
            else:
                 print(f"Info: Received non-check packet (e.g., 0x85) while checking status.")

        except IndexError:
            pass  # Status remains "UNKNOWN"
            
    return status_dict

# --- Web Server API Endpoints ---

@app.route('/open-locker', methods=['POST'])
def handle_open_locker():
    data = request.get_json()
    if not data or 'lockerId' not in data:
        return jsonify({"success": False, "error": "Missing lockerId"}), 400

    try:
        locker_num = int(data['lockerId'])
        if not 1 <= locker_num <= 8:
            return jsonify({"success": False, "error": "Invalid lockerId. Must be 1-8."}), 400
    except ValueError:
        return jsonify({"success": False, "error": "Invalid lockerId. Must be a number."}), 400

    print(f"\n--- Request received for Locker {locker_num} ---")
    command = build_command(CMD_BYTE_OPEN, locker_num)
    
    # --- MODIFICACIÓN (FIRE AND FORGET) ---
    # Ya no comprobamos la respuesta "ACK" porque la placa envía múltiples
    # mensajes (ACK y estado 0x85) que confunden a nuestro lector.
    # Simplemente enviamos el comando. La lógica de sondeo (polling)
    # en el frontend (waitForDoorClose) se encargará de verificar.
    
    response = _send_serial_command(command) 

    # Asumimos que funcionó si el puerto no dio un error (response is not None)
    if response is not None:
        print(f"Success: 'Open' command sent for locker {locker_num}.")
        return jsonify({"success": True, "message": f"Locker {locker_num} command sent."})
    else:
        # Esto solo falla si el puerto serial falló
        print("Failure: Serial port error.")
        return jsonify({"success": False, "error": "Failed to communicate with controller."}), 500

@app.route('/check-status/<int:locker_id>', methods=['GET'])
def handle_check_status(locker_id):
    """Endpoint for checking a single lock (used for polling)."""
    if not 1 <= locker_id <= 8:
        return jsonify({"success": False, "error": "Invalid lockerId. Must be 1-8."}), 400
    
    status_dict = _get_lock_status(locker_id)
    
    if status_dict["status"] == "UNKNOWN":
        # ¡Importante! No devuelvas un error 500.
        # Simplemente di que el estado es desconocido. El JS
        # lo interpretará y volverá a intentarlo.
        return jsonify({"success": True, "status": "UNKNOWN", "channel": locker_id})
    
    return jsonify({"success": True, "status": status_dict["status"], "channel": locker_id})

@app.route('/check-all-statuses', methods=['GET'])
def handle_check_all_statuses():
    """
    NEW ENDPOINT: Checks all 8 locks and returns their hardware status.
    This is used on startup to fix desynchronization.
    """
    print("\n--- Request received for ALL STATUSES ---")
    all_statuses = []
    for i in range(1, 9):  # Check channels 1 through 8
        all_statuses.append(_get_lock_status(i))
    
    return jsonify({"success": True, "bays": all_statuses})

# --- Start the Server ---
if __name__ == '__main__':
    print("--- Starting Kiosk Lock Server (v3 - Open Fix) ---")
    print("Listening on http://127.0.0.1:5000")
    app.run(host='127.0.0.1', port=5000)