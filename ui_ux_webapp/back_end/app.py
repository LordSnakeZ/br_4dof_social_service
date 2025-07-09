"""
app.py – FastAPI + Dynamixel protocol 1.0 (compatible con Python 3.9)

Endpoints
──────────
/api/status          → salud del backend
/api/move            → mueve un servo (reactiva torque si estaba OFF)
/api/stop            → paro de emergencia  (Torque OFF broadcast)
/api/resume          → reactiva torque     (Torque ON broadcast)
/api/reset           → coloca 1-4 en ángulos predeterminados
/api/inspect/{id}    → lee posición, velocidad, carga, voltaje, temperatura…

Funciona con FT232RL + 74LS125 en half-duplex conmutando por DTR.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from contextlib import contextmanager
from typing import List, Optional
import os, serial, time

# ─────────── Configuración ───────────
PORT       = os.getenv("DXL_PORT", "/dev/tty.usbserial-A5XK3RJT")
BAUD       = int(os.getenv("DXL_BAUD", 1_000_000))
TIMEOUT    = 0.02                # 20 ms para lecturas
DXL_RES    = 1023
GOAL_POS   = 30                  # dirección Goal Position
TORQUE_EN  = 24                  # dirección Torque Enable
STATUS_LEN = 6

# Control Table de parámetros a leer
ADDR = {
    'RETURN_LEVEL':    16,
    'TORQUE_ENABLE':   24,
    'PRESENT_POSITION':36,
    'PRESENT_SPEED':   38,
    'PRESENT_LOAD':    40,
    'PRESENT_VOLTAGE': 42,
    'PRESENT_TEMP':    43
}

# ─────────── FastAPI ───────────
app = FastAPI(title="Dynamixel Web API (Python 3.9)")

# CORS amplio para desarrollo
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_methods=["*"], allow_headers=["*"]
)

# ─────────── Utilidades Dynamixel ───────────
def checksum(payload: List[int]) -> int:
    return (~sum(payload)) & 0xFF

def deg_to_units(angle: float) -> int:
    return int(angle * DXL_RES / 300.0 + 0.5)

def pkt_write(sid: int, addr: int, *data: int) -> bytes:
    length  = 3 + len(data)
    payload = [sid, length, 3, addr, *data]
    return bytes([0xFF, 0xFF, *payload, checksum(payload)])

def pkt_read(sid: int, addr: int, length: int) -> bytes:
    payload = [sid, 4, 2, addr, length]
    return bytes([0xFF, 0xFF, *payload, checksum(payload)])

@contextmanager
def open_bus():
    ser = serial.Serial(PORT, BAUD, timeout=TIMEOUT, write_timeout=0.2)
    try:
        yield ser
    finally:
        ser.close()

def dxl_send(packet: bytes, expect: int = 0) -> bytes:
    """Envía un paquete y lee 'expect' bytes (maneja DTR)."""
    with open_bus() as ser:
        # — TX —
        ser.dtr = False            # habilita TX
        ser.reset_input_buffer()
        ser.write(packet)
        ser.flush()
        while ser.out_waiting:
            time.sleep(0)
        time.sleep(0.00005)
        # — RX —
        ser.dtr = True             # habilita RX
        return ser.read(expect)

def dxl_read(sid: int, addr: int, length: int) -> Optional[List[int]]:
    """Lee 'length' bytes de la tabla de control."""
    resp = dxl_send(pkt_read(sid, addr, length), expect=6 + length)
    if len(resp) != 6 + length or resp[:2] != b'\xFF\xFF':
        return None
    if checksum(list(resp[2:-1])) != resp[-1]:
        return None
    return list(resp[5:5 + length])

def format_load(raw: int) -> str:
    direction   = '-' if raw & 0x400 else '+'
    percentage  = (raw & 0x3FF) * 100 / 1023
    return f"{direction}{percentage:.1f}%"

# ─────────── Modelos Pydantic ───────────
class MoveCmd(BaseModel):
    id: int
    angle: float

# ─────────── Endpoints ───────────
@app.get("/api/status")
def api_status():
    return {"status":"active","port":PORT,"baud":BAUD,"time":time.time()}

@app.post("/api/move")
def api_move(cmd: MoveCmd):
    if not (0 <= cmd.angle <= 300):
        raise HTTPException(400,"Angle must be 0-300°")
    if not (1 <= cmd.id <= 253):
        raise HTTPException(400,"Servo ID must be 1-253")

    pos = deg_to_units(cmd.angle)
    dxl_send(pkt_write(cmd.id, TORQUE_EN, 0x01))                      # torque ON
    dxl_send(pkt_write(cmd.id, GOAL_POS, pos & 0xFF, pos >> 8))       # posición
    return {"servo_id":cmd.id,"angle_deg":cmd.angle}

@app.post("/api/stop")
def api_stop():
    dxl_send(pkt_write(0xFE, TORQUE_EN, 0x00))   # broadcast OFF
    return {"status":"torque_disabled_all"}

@app.post("/api/resume")
def api_resume():
    dxl_send(pkt_write(0xFE, TORQUE_EN, 0x01))   # broadcast ON
    return {"status":"torque_enabled_all"}

@app.post("/api/reset")
def api_reset():
    targets = {1:80, 2:64, 3:64, 4:120}
    for sid, ang in targets.items():
        pos = deg_to_units(ang)
        dxl_send(pkt_write(sid, TORQUE_EN, 0x01))
        dxl_send(pkt_write(sid, GOAL_POS, pos & 0xFF, pos >> 8))
    return {"status":"custom_reset_done","targets_deg":targets}

@app.get("/api/inspect/{sid}")
def api_inspect(sid: int):
    if not (1 <= sid <= 253):
        raise HTTPException(400,"Servo ID must be 1-253")

    pos  = dxl_read(sid, ADDR['PRESENT_POSITION'], 2)
    spd  = dxl_read(sid, ADDR['PRESENT_SPEED'],    2)
    load = dxl_read(sid, ADDR['PRESENT_LOAD'],     2)
    volt = dxl_read(sid, ADDR['PRESENT_VOLTAGE'],  1)
    temp = dxl_read(sid, ADDR['PRESENT_TEMP'],     1)
    tq   = dxl_read(sid, ADDR['TORQUE_ENABLE'],    1)
    ret  = dxl_read(sid, ADDR['RETURN_LEVEL'],     1)

    if pos is None:
        raise HTTPException(504,"No response from servo")

    pos_raw = pos[0] | (pos[1] << 8)
    pos_deg = round(pos_raw * 300 / 1023, 1)
    spd_rpm = ((spd[0] | (spd[1] << 8)) * 0.111) if spd else None
    load_pct = format_load(load[0] | (load[1] << 8)) if load else None

    return {
        "servo_id": sid,
        "position_deg": pos_deg,
        "position_raw": pos_raw,
        "speed_rpm": round(spd_rpm,1) if spd else None,
        "load": load_pct,
        "voltage_v": volt[0]/10 if volt else None,
        "temperature_c": temp[0] if temp else None,
        "torque_enabled": bool(tq[0]) if tq else None,
        "status_return_level": ret[0] if ret else None
    }
