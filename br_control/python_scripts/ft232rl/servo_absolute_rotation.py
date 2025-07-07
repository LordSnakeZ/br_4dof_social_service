import serial, time

# ---------- CONFIGURA ----------
PORT     = '/dev/tty.usbserial-A5XK3RJT'
BAUD     = 1_000_000
DXL_ID   = 4            # ID del servo
ANGLE_DEG = 120          # ← pon aquí el ángulo deseado
DXL_RES   = 1023        # 10-bit (AX-12/18/W). Usa 4095 para servos de 12-bit
TIMEOUT   = 0.005
# --------------------------------

def tx_cs(p): return (~sum(p[2:]) & 0xFF) & 0xFF
def rx_cs(r): return (~sum(r[2:-1]) & 0xFF) & 0xFF

def deg_to_units(angle, res=1023):
    """↳ Convierte grados (0-300) a unidades Dynamixel con redondeo."""
    return int(angle * res / 300.0 + 0.5)   # +0.5 → redondeo al entero más cercano

def packet_write_pos(dxl_id, pos):
    lo, hi = pos & 0xFF, (pos >> 8) & 0xFF
    pkt = [0xFF, 0xFF, dxl_id, 0x05, 0x03, 30, lo, hi]
    pkt.append(tx_cs(pkt))
    return bytes(pkt)

goal_units = deg_to_units(ANGLE_DEG, DXL_RES)
print(f"→ {ANGLE_DEG} °  ⇒  {goal_units} unidades")

with serial.Serial(PORT, BAUD, timeout=TIMEOUT) as ser:
    # --- TX ---
    ser.dtr = False
    ser.reset_input_buffer()
    cmd = packet_write_pos(DXL_ID, goal_units)
    ser.write(cmd); ser.flush()
    while ser.out_waiting: pass
    time.sleep(0.00005)

    # --- RX ---
    ser.dtr = True
    status = ser.read(6)          # FF FF ID 02 ERR CS

# ---------- RESULTADO ----------
if len(status) == 6 and status[:2] == b'\xFF\xFF' and rx_cs(status) == status[-1]:
    err = status[4]
    if err == 0:
        print("✅ Movimiento aceptado sin error.")
    else:
        print(f"⚠ Servo devolvió código de error 0x{err:02X}")
else:
    print("ℹ️  Servo se movió; no llegó (o falló) el paquete de estado.")
