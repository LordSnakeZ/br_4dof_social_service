"""
Dynamixel Servo Inspector (Protocol 1.0)

Reads and displays critical servo parameters including position, speed, load,
and system status. Designed for AX/MX-series servos.

Author: Santiago S. Sánchez
Date: 2025-07-08
"""

import serial
import time

# ------ Configuration ------
PORT = '/dev/tty.usbserial-A5XK3RJT'  # FTDI serial port
BAUD = 1_000_000                      # 1 Mbps communication
DXL_ID = 1                            # Target servo ID
TIMEOUT = 0.02                        # 20ms response timeout

# Dynamixel Control Table Addresses (Protocol 1.0)
ADDR = {
    'RETURN_LEVEL': 16,
    'TORQUE_ENABLE': 24,
    'PRESENT_POSITION': 36,
    'PRESENT_SPEED': 38,
    'PRESENT_LOAD': 40,
    'PRESENT_VOLTAGE': 42,
    'PRESENT_TEMP': 43
}

def tx_checksum(packet: list) -> int:
    """Calculate transmission checksum for Dynamixel packets.
    
    Args:
        packet: Byte list excluding 0xFF headers
        
    Returns:
        Checksum byte
    """
    return (~sum(packet[2:])) & 0xFF

def rx_checksum(response: list) -> int:
    """Verify received packet checksum.
    
    Args:
        response: Full received packet including headers
        
    Returns:
        Calculated checksum for verification
    """
    return (~sum(response[2:-1])) & 0xFF

def create_read_packet(servo_id: int, address: int, length: int) -> bytes:
    """Generate a parameter read request packet.
    
    Args:
        servo_id: Target servo ID
        address: Control table address
        length: Bytes to read
        
    Returns:
        Ready-to-transmit packet
    """
    packet = [
        0xFF, 0xFF,           # Header
        servo_id,             # ID
        0x04,                  # Packet length
        0x02,                  # READ_DATA instruction
        address & 0xFF,        # Address LSB
        length & 0xFF          # Data length
    ]
    packet.append(tx_checksum(packet))
    return bytes(packet)

def read_parameter(ser: serial.Serial, servo_id: int, address: int, length: int) -> list:
    """Read a parameter from servo's control table.
    
    Args:
        ser: Active serial connection
        servo_id: Target servo ID
        address: Parameter address
        length: Expected data length
        
    Returns:
        List of received bytes or None if failed
    """
    # Transmission phase
    ser.dtr = False  # FTDI LED ON = TX mode
    ser.reset_input_buffer()
    packet = create_read_packet(servo_id, address, length)
    ser.write(packet)
    ser.flush()
    while ser.out_waiting:  # Ensure transmission completes
        pass
    time.sleep(0.00005)     # Critical delay before RX
    
    # Reception phase
    ser.dtr = True  # FTDI LED OFF = RX mode
    response = ser.read(6 + length)  # Header(2)+ID(1)+Len(1)+Err(1)+Data(n)+CS(1)
    
    if (len(response) == 6 + length and 
        response[:2] == b'\xFF\xFF' and 
        rx_checksum(response) == response[-1]):
        return list(response[5:5+length])
    return None

def format_load(raw: int) -> str:
    """Convert raw load value to percentage with direction.
    
    Args:
        raw: 2-byte load value
        
    Returns:
        Formatted string with sign and percentage
    """
    direction = '-' if raw & 0x400 else '+'
    percentage = (raw & 0x3FF) * 100 / 1023
    return f"{direction}{percentage:.1f}%"

def main():
    """Main execution routine."""
    with serial.Serial(PORT, BAUD, timeout=TIMEOUT) as ser:
        # Read all parameters
        params = {
            'status_return': read_parameter(ser, DXL_ID, ADDR['RETURN_LEVEL'], 1),
            'position': read_parameter(ser, DXL_ID, ADDR['PRESENT_POSITION'], 2),
            'speed': read_parameter(ser, DXL_ID, ADDR['PRESENT_SPEED'], 2),
            'load': read_parameter(ser, DXL_ID, ADDR['PRESENT_LOAD'], 2),
            'voltage': read_parameter(ser, DXL_ID, ADDR['PRESENT_VOLTAGE'], 1),
            'temperature': read_parameter(ser, DXL_ID, ADDR['PRESENT_TEMP'], 1),
            'torque_enable': read_parameter(ser, DXL_ID, ADDR['TORQUE_ENABLE'], 1)
        }

    # Display results
    if params['status_return']:
        modes = {
            0: 'No status return',
            1: 'Only for PING',
            2: 'For all instructions'
        }
        print(f"Status Return : {params['status_return'][0]} ({modes.get(params['status_return'][0], 'Unknown')})")

    if params['position']:
        pos_raw = params['position'][0] | (params['position'][1] << 8)
        pos_deg = round(pos_raw * 300 / 1023, 1)
        print(f"Position      : {pos_deg}° ({pos_raw} raw)")

    if params['speed']:
        speed_rpm = (params['speed'][0] | (params['speed'][1] << 8)) * 0.111
        print(f"Speed         : {speed_rpm:.1f} RPM")

    if params['load']:
        load_raw = params['load'][0] | (params['load'][1] << 8)
        print(f"Load          : {format_load(load_raw)}")

    if params['voltage']:
        print(f"Voltage       : {params['voltage'][0]/10:.1f}V")

    if params['temperature']:
        print(f"Temperature   : {params['temperature'][0]}°C")

    if params['torque_enable']:
        print(f"Torque Enable : {'ON' if params['torque_enable'][0] else 'OFF'}")

if __name__ == "__main__":
    main()