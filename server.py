import serial
import time
from flask import Flask, request, jsonify

# --- Configuration ---
# You may need to change '/dev/ttyUSB0' depending on your Raspberry Pi's port
SERIAL_PORT = '/dev/ttyUSB0'
BAUD_RATE = 9600  # Default baud rate from the datasheet [cite: 80]
BOARD_ADDRESS = 0x01  # Assuming the board is at address 1

app = Flask(__name__)

# --- Serial Communication Helper ---
def send_command(command):
    """Sends a command to the serial port and returns the response."""
    try:
        with serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1) as ser:
            ser.write(command)
            # The datasheet notes a 1s delay for the lock to open [cite: 149]
            time.sleep(1.2) 
            response = ser.read(10) # Read up to 10 bytes of the response
            return response
    except serial.SerialException as e:
        print(f"Error communicating with serial port: {e}")
        return None

# --- Command Generation ---
def create_open_command(cabinet_number):
    """Creates the byte command to open a specific cabinet."""
    # Based on the "Command of open cabinet" section [cite: 135]
    byte0 = 0x8A  # Frame header
    byte1 = BOARD_ADDRESS
    byte2 = int(cabinet_number)
    byte3 = 0x11  # Open cabinet command
    
    # Checksum is the XOR of all previous bytes [cite: 140]
    checksum = byte0 ^ byte1 ^ byte2 ^ byte3
    
    return bytes([byte0, byte1, byte2, byte3, checksum])

# --- API Endpoints ---
@app.route('/open-locker', methods=['POST'])
def open_locker():
    data = request.get_json()
    locker_id = data.get('lockerId')

    if not locker_id:
        return jsonify({"success": False, "error": "Missing lockerId"}), 400

    print(f"Received request to open locker: {locker_id}")
    command_to_send = create_open_command(locker_id)
    
    print(f"Sending command: {' '.join(f'0x{b:02X}' for b in command_to_send)}")
    
    response = send_command(command_to_send)

    if response:
        print(f"Received response: {' '.join(f'0x{r:02X}' for r in response)}")
        # You can add more sophisticated response checking here based on the datasheet
        return jsonify({"success": True, "message": f"Locker {locker_id} opened."})
    else:
        return jsonify({"success": False, "error": "Failed to communicate with controller."}), 500

if __name__ == '__main__':
    # Runs the server on port 5000, accessible from the kiosk app
    app.run(host='127.0.0.1', port=5000)