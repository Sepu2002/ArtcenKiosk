import serial
import time
from flask import Flask, request, jsonify

# --- Configuration ---
SERIAL_PORT = '/dev/ttyUSB0'  # This is correct from your dmesg
BAUD_RATE = 9600  # Default baud rate for YCSB08M
BOARD_ADDRESS = 0x01  # Assuming the board is at address 1 (check DIP switches!)

app = Flask(__name__)

# --- Serial Communication Helper ---
def send_command(command):
    """Sends a command to the serial port and returns the response."""
    try:
        with serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1.2) as ser:
            ser.write(command)
            # Wait for the lock to react and send a response
            time.sleep(1) 
            response = ser.read(10) # Read up to 10 bytes
            return response
    except serial.SerialException as e:
        print(f"Error communicating with serial port: {e}")
        return None

# --- Command Generation (From your PDF) ---
def create_open_command(cabinet_number):
    """Creates the byte command to open a specific cabinet."""
    byte0 = 0x8A  # Frame header
    byte1 = BOARD_ADDRESS
    byte2 = int(cabinet_number)
    byte3 = 0x11  # Open cabinet command
    
    # Checksum is the XOR of all previous bytes
    checksum = byte0 ^ byte1 ^ byte2 ^ byte3
    
    return bytes([byte0, byte1, byte2, byte3, checksum])

# --- API Endpoints ---
@app.route('/open-locker', methods=['POST'])
def open_locker():
    data = request.get_json()
    locker_id = data.get('lockerId')

    if not locker_id:
        return jsonify({"success": False, "error": "Missing lockerId"}), 400
    
    # --- THIS IS THE ONLY CHANGE ---
    # Validate that the locker ID is between 1 and 8
    try:
        locker_num = int(locker_id)
        if not 1 <= locker_num <= 8:
            raise ValueError
    except ValueError:
        return jsonify({"success": False, "error": f"Invalid lockerId: {locker_id}. Must be 1-8."}), 400
    # --- END OF CHANGE ---

    print(f"Received request to open locker: {locker_num}")
    command_to_send = create_open_command(locker_num)
    
    print(f"Sending command: {' '.join(f'0x{b:02X}' for b in command_to_send)}")
    
    response = send_command(command_to_send)

    if response:
        print(f"Received response: {' '.join(f'0x{r:02X}' for r in response)}")
        # You can add response checking here
        return jsonify({"success": True, "message": f"Locker {locker_num} opened."})
    else:
        return jsonify({"success": False, "error": "Failed to communicate with controller."}), 500

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000)