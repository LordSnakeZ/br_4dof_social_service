"""
Dynamixel Servo Position Controller (Protocol 1.0)

Sets servo to a specific angle and verifies command acceptance.
Supports AX/MX-series servos with configurable resolution.

Author: Santiago S. Sánchez
Date: 2025-07-08
"""

import serial
import time

# ------ Configuration ------
PORT = '/dev/tty.usbserial-A5XK3RJT'  # FTDI serial port
BAUD = 1_000_000                      # 1 Mbps communication
DXL_ID = 2                            # Target servo ID
ANGLE_DEG = 64                       # Desired angle (0-300°)
DXL_RES = 1023                        # 10-bit (AX-12/18/W). Use 4095 for 12-bit
TIMEOUT = 0.005                       # 5ms response timeout

# Control Table Addresses (Protocol 1.0)
GOAL_POSITION_ADDR = 30               # Address for goal position
STATUS_PACKET_LEN = 6                 # Expected status packet length

def calculate_checksum(packet: list) -> int:
    """Calculate Dynamixel Protocol 1.0 checksum.
    
    Args:
        packet: Byte list excluding 0xFF headers
        
    Returns:
        Checksum byte
    """
    return (~sum(packet[2:])) & 0xFF

def degrees_to_units(angle_deg: float, resolution: int = 1023) -> int:
    """Convert degrees to Dynamixel position units.
    
    Args:
        angle_deg: Target angle (0-300°)
        resolution: Servo resolution (1023 for 10-bit, 4095 for 12-bit)
        
    Returns:
        Position value in servo units
    """
    return int(angle_deg * resolution / 300.0 + 0.5)  # Rounded to nearest integer

def create_position_packet(servo_id: int, position: int) -> bytes:
    """Generate position command packet.
    
    Args:
        servo_id: Target servo ID
        position: Goal position in servo units
        
    Returns:
        Ready-to-transmit packet bytes
    """
    position_low = position & 0xFF
    position_high = (position >> 8) & 0xFF
    packet = [
        0xFF, 0xFF,               # Header
        servo_id,                 # Servo ID
        0x05,                      # Packet length
        0x03,                      # WRITE_DATA instruction
        GOAL_POSITION_ADDR,        # Address
        position_low, position_high  # Position data
    ]
    packet.append(calculate_checksum(packet))
    return bytes(packet)

def main():
    """Execute position control routine."""
    goal_units = degrees_to_units(ANGLE_DEG, DXL_RES)
    print(f"→ Command: {ANGLE_DEG}° ⇒ {goal_units} units (resolution: {DXL_RES})")

    with serial.Serial(PORT, BAUD, timeout=TIMEOUT) as ser:
        # Transmission phase
        ser.dtr = False  # FTDI LED ON = TX mode
        ser.reset_input_buffer()
        command = create_position_packet(DXL_ID, goal_units)
        ser.write(command)
        ser.flush()
        while ser.out_waiting:  # Wait for transmission to complete
            pass
        time.sleep(0.00005)     # Critical delay before RX

        # Reception phase
        ser.dtr = True  # FTDI LED OFF = RX mode
        status = ser.read(STATUS_PACKET_LEN)

    # Result analysis
    if (len(status) == STATUS_PACKET_LEN and 
        status[:2] == b'\xFF\xFF' and 
        calculate_checksum(status) == status[-1]):
        error_code = status[4]
        if error_code == 0:
            print("✅ Movement accepted (no errors)")
        else:
            print(f"⚠ Servo returned error code: 0x{error_code:02X}")
            print("See Dynamixel Protocol 1.0 error codes documentation")
    else:
        print("ℹ️  Position set (no status packet received)")

if __name__ == "__main__":
    main()