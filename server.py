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
        with serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1.0) as ser:
            ser.flushInput()
            ser.flushOutput()
            ser.write(command)
            time.sleep(0.1)
            response = ser.read(RESPONSE_LENGTH)
            
            if not response:
                print("Received Response: ...No response from board.")
                return None
            
            print(f"Received Response: {response.hex(' ')}")
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

    if response:
        try:
            # Check if response is a valid status packet
            if (response[0:4] == HEADER and
                response[6] == CMD_BYTE_CHECK[0] and
                response[8] == locker_id):
                
                state_byte = response[9]
                if state_byte == 0x01:
                    status_dict["status"] = "LOCKED"
                elif state_byte == 0x00:
                    status_dict["status"] = "UNLOCKED"
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
    
    ack_payload = (BOARD_ADDR + CMD_BYTE_OPEN + CMD_OK_RESPONSE + 
                   bytes([locker_num]) + b'\x00')
    expected_ack = (HEADER + b'\x0B' + ack_payload + 
                    calculate_checksum(ack_payload))

    response = _send_serial_command(command)

    if response == expected_ack:
        print(f"Success: Locker {locker_num} acknowledged open.")
        return jsonify({"success": True, "message": f"Locker {locker_num} opened."})
    elif response is None:
        print("Failure: No response from controller.")
        return jsonify({"success": False, "error": "No response from controller."}), 500
    else:
        print("Failure: Received an unexpected response.")
        return jsonify({"success": False, "error": "Unexpected response from controller."}), 500

@app.route('/check-status/<int:locker_id>', methods=['GET'])
def handle_check_status(locker_id):
    """Endpoint for checking a single lock (used for polling)."""
    if not 1 <= locker_id <= 8:
        return jsonify({"success": False, "error": "Invalid lockerId. Must be 1-8."}), 400
    
    status_dict = _get_lock_status(locker_id)
    
    if status_dict["status"] == "UNKNOWN":
        return jsonify({"success": False, "error": "No response from controller."}), 500
    
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
    print("--- Starting Kiosk Lock Server (v2 - Synced) ---")
    print("Listening on http://127.0.0.1:5000")
    app.run(host='127.0.0.1', port=5000)