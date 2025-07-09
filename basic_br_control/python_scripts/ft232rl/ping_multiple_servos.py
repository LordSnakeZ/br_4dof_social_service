"""
Dynamixel Servo Scanner (Protocol 1.0)

Scans for Dynamixel servos using direct serial communication via FTDI adapter.
Identifies servo models and validates responses with checksums.

Author: Santiago S. Sánchez
Date: 2025-07-08
"""

import serial
import time
import binascii

# ------ Configuration ------
PORT = '/dev/tty.usbserial-A5XK3RJT'  # FTDI serial port (adjust for your device)
BAUD = 1_000_000                      # 1 Mbps communication speed
IDS = [1, 2, 3, 4, 5, 6]              # Servo IDs to scan
TIMEOUT = 0.02                        # 20ms response timeout

# Known model numbers (hex) and their human-readable names
MODEL_NAMES = {
    0x000C: "AX-12A",
    0x0012: "AX-18A",
    0x012C: "AX-12W",
}

def tx_cs(packet: list) -> int:
    """
    Calculate transmission checksum for Dynamixel Protocol 1.0.
    
    Args:
        packet: List of bytes in packet (excluding leading 0xFF 0xFF)
    
    Returns:
        Checksum byte
    """
    return (~sum(packet[2:]) & 0xFF)

def rx_cs(response: bytes) -> int:
    """
    Calculate received packet checksum for validation.
    
    Args:
        response: Full received packet (including headers)
    
    Returns:
        Calculated checksum byte for comparison
    """
    return (~sum(response[2:-1]) & 0xFF)

def pkt_read_model(dxl_id: int) -> bytes:
    """
    Generate a model number read request packet.
    
    Args:
        dxl_id: Servo ID to query
    
    Returns:
        Ready-to-transmit packet bytes
    """
    p = [0xFF, 0xFF, dxl_id, 0x04, 0x02, 0x00, 0x02]  # Instruction: READ_DATA
    p.append(tx_cs(p))
    return bytes(p)

def main():
    """Execute the Dynamixel servo scanning routine."""
    print(f"Scanning IDs {IDS} at {BAUD/1_000_000} Mbps...")

    with serial.Serial(PORT, BAUD, timeout=TIMEOUT) as ser:
        for dxl_id in IDS:
            # ----- Transmission Phase -----
            ser.dtr = False  # FTDI LED ON indicates TX mode
            ser.reset_input_buffer()
            pkt = pkt_read_model(dxl_id)
            ser.write(pkt)
            ser.flush()
            while ser.out_waiting:  # Wait for transmission to complete
                pass
            time.sleep(0.0001)  # Brief pause before switching to RX

            # ----- Reception Phase -----
            ser.dtr = True  # FTDI LED OFF indicates RX mode
            resp = ser.read(8)  # Expected response length

            if (len(resp) == 8 and resp[:2] == b'\xFF\xFF' 
                and rx_cs(resp) == resp[-1]):
                # Successful response
                model = resp[5] | (resp[6] << 8)
                name = MODEL_NAMES.get(model, "unknown")
                print(f"✅ ID {dxl_id}: Model 0x{model:04X} → {name}")
            else:
                # Failed response
                hex_resp = binascii.hexlify(resp).decode() if resp else "timeout"
                print(f"⛔ ID {dxl_id}: No response (raw: {hex_resp})")

if __name__ == "__main__":
    main()