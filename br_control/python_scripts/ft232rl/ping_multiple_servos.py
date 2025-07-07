import serial, time, binascii

# ---------- CONFIGURACIÓN ----------
PORT   = '/dev/tty.usbserial-A5XK3RJT'   # ajusta tu FT232RL
BAUD   = 1_000_000                       # 1 Mbps
IDS    = [1, 2, 3, 4, 5, 6]                    # IDs a escanear
TIMEOUT = 0.02                           # 20 ms
# ------------------------------------

# Diccionario de modelos conocidos
MODEL_NAMES = {
    0x000C: "AX-12A",
    0x0012: "AX-18A",
    0x012C: "AX-12W",
}

# --- utilidades de checksum (protocolo 1.0) ---
def tx_cs(pkt):
    return (~sum(pkt[2:]) & 0xFF) & 0xFF

def rx_cs(resp):
    return (~sum(resp[2:-1]) & 0xFF) & 0xFF

# paquete READ (Model Number, 2 bytes en dir 0)
def pkt_read_model(dxl_id):
    p = [0xFF, 0xFF, dxl_id, 0x04, 0x02, 0x00, 0x02]
    p.append(tx_cs(p))
    return bytes(p)

print(f"Escaneando IDs {IDS} a {BAUD} bps…")

with serial.Serial(PORT, BAUD, timeout=TIMEOUT) as ser:
    for dxl_id in IDS:
        # ----- TX -----
        ser.dtr = False                # LED ON  → TX
        ser.reset_input_buffer()
        pkt = pkt_read_model(dxl_id)
        ser.write(pkt);  ser.flush()
        while ser.out_waiting:
            pass
        time.sleep(0.0001)

        # ----- RX -----
        ser.dtr = True                 # LED OFF → RX
        resp = ser.read(8)             # esperamos 8 bytes

        if len(resp) == 8 and resp[:2] == b'\xFF\xFF' and rx_cs(resp) == resp[-1]:
            model = resp[5] | (resp[6] << 8)
            name  = MODEL_NAMES.get(model, "desconocido")
            print(f"✅ ID {dxl_id}: Modelo 0x{model:04X} → {name}")
        else:
            print(f"⛔ ID {dxl_id}: sin respuesta o paquete inválido")
