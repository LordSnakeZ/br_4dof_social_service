"""
app.py — FastAPI  + Dynamixel (Protocol 1.0)
Versión “elegante”: un solo endpoint /api/inspect que devuelve la lista
completa y un lock global para evitar colisiones en el puerto serie.
Compatible con Python 3.9
────────────────────────────────────────────────────────────────────────
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from contextlib import contextmanager
from typing import List, Optional
import os, serial, time, threading

# ───────────── Config ─────────────
PORT       = os.getenv("DXL_PORT", "/dev/tty.usbserial-A5XK3RJT")
BAUD       = int(os.getenv("DXL_BAUD", 1_000_000))
TIMEOUT    = 0.02           # 20 ms
DXL_RES    = 1023
GOAL_POS   = 30             # Goal Position
TORQUE_EN  = 24             # Torque Enable
STATUS_LEN = 6

ADDR = {
    "RETURN_LEVEL":     16,
    "TORQUE_ENABLE":    24,
    "PRESENT_POSITION": 36,
    "PRESENT_SPEED":    38,
    "PRESENT_LOAD":     40,
    "PRESENT_VOLTAGE":  42,
    "PRESENT_TEMP":     43,
}

# ───────────── FastAPI ─────────────
app = FastAPI(title="Dynamixel Web API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_methods=["*"], allow_headers=["*"],
)

# ───────────── Utilidades DXL ─────────────
serial_lock = threading.Lock()           # <── evita accesos simultáneos

def checksum(payload: List[int]) -> int: return (~sum(payload)) & 0xFF
def deg_to_units(angle: float) -> int:   return int(angle * DXL_RES / 300 + 0.5)

def pkt_write(sid:int, addr:int, *data:int) -> bytes:
    p = [sid, 3+len(data), 3, addr, *data]
    return bytes([0xFF,0xFF,*p, checksum(p)])

def pkt_read(sid:int, addr:int, length:int) -> bytes:
    p = [sid, 4, 2, addr, length]
    return bytes([0xFF,0xFF,*p, checksum(p)])

@contextmanager
def open_bus():
    ser = serial.Serial(PORT, BAUD, timeout=TIMEOUT, write_timeout=0.2)
    try:    yield ser
    finally:ser.close()

def dxl_send(pkt:bytes, expect:int=0) -> bytes:
    """TX/RX protegido por lock global."""
    with serial_lock:
        with open_bus() as ser:
            ser.dtr = False; ser.reset_input_buffer()
            ser.write(pkt);  ser.flush()
            while ser.out_waiting: time.sleep(0)
            time.sleep(0.00005)     # cambio RX
            ser.dtr = True
            return ser.read(expect)

def dxl_read(sid:int, addr:int, length:int) -> Optional[List[int]]:
    resp = dxl_send(pkt_read(sid, addr, length), expect=6+length)
    if len(resp) != 6+length or resp[:2] != b"\xFF\xFF": return None
    if checksum(list(resp[2:-1])) != resp[-1]:            return None
    return list(resp[5:5+length])

def format_load(raw:int)->str:
    return f'{"-" if raw & 0x400 else "+"}{(raw&0x3FF)*100/1023:.1f}%'

# ───────────── Pydantic ─────────────
class MoveCmd(BaseModel):
    id:int; angle:float

# ───────────── Endpoints ─────────────
@app.get("/api/status")
def api_status(): return {"status":"active","port":PORT,"baud":BAUD,"time":time.time()}

@app.post("/api/move")
def api_move(cmd:MoveCmd):
    if not (0<=cmd.angle<=300):      raise HTTPException(400,"Angle 0-300°")
    if not (1<=cmd.id<=253):         raise HTTPException(400,"Servo ID 1-253")
    pos=deg_to_units(cmd.angle)
    dxl_send(pkt_write(cmd.id, TORQUE_EN, 0x01))
    dxl_send(pkt_write(cmd.id, GOAL_POS, pos&0xFF, pos>>8))
    return {"servo_id":cmd.id,"angle_deg":cmd.angle}

@app.post("/api/stop")
def api_stop():   dxl_send(pkt_write(0xFE,TORQUE_EN,0x00)); return {"status":"torque_disabled_all"}
@app.post("/api/resume")
def api_resume(): dxl_send(pkt_write(0xFE,TORQUE_EN,0x01)); return {"status":"torque_enabled_all"}

@app.post("/api/reset")
def api_reset():
    targets={1:80,2:64,3:64,4:120}
    for sid,ang in targets.items():
        pos=deg_to_units(ang)
        dxl_send(pkt_write(sid,TORQUE_EN,0x01))
        dxl_send(pkt_write(sid,GOAL_POS,pos&0xFF,pos>>8))
    return {"status":"custom_reset_done","targets_deg":targets}

# ---------- helper para un solo servo ----------
def inspect_one(sid:int):
    pos  = dxl_read(sid,ADDR["PRESENT_POSITION"],2)
    if pos is None: raise HTTPException(504,f"No response from {sid}")
    spd  = dxl_read(sid,ADDR["PRESENT_SPEED"],2)
    load = dxl_read(sid,ADDR["PRESENT_LOAD"],2)
    volt = dxl_read(sid,ADDR["PRESENT_VOLTAGE"],1)
    temp = dxl_read(sid,ADDR["PRESENT_TEMP"],1)
    tq   = dxl_read(sid,ADDR["TORQUE_ENABLE"],1)
    ret  = dxl_read(sid,ADDR["RETURN_LEVEL"],1)

    pos_raw = pos[0]|(pos[1]<<8)
    return {
        "servo_id":sid,
        "position_deg": round(pos_raw*300/1023,1),
        "position_raw": pos_raw,
        "speed_rpm":    round(((spd[0]|(spd[1]<<8))*0.111),1) if spd else None,
        "load":         format_load(load[0]|(load[1]<<8))      if load else None,
        "voltage_v":    volt[0]/10    if volt else None,
        "temperature_c":temp[0]       if temp else None,
        "torque_enabled":bool(tq[0])  if tq else None,
        "status_return_level":ret[0]  if ret else None,
    }

# ---------- endpoint por ID (se mantiene) ----------
@app.get("/api/inspect/{sid}")
def api_inspect(sid:int): return inspect_one(sid)

# ---------- endpoint “elegante” lista completa ----------
@app.get("/api/inspect")
def api_inspect_all(ids:str="1,2,3,4"):
    try:
        id_list=[i for i in map(int,ids.split(",")) if 1<=i<=253]
    except ValueError:
        raise HTTPException(400,"ids must be CSV of integers")

    result=[]
    for sid in id_list:
        try:
            result.append(inspect_one(sid))
        except HTTPException:
            continue                    # omite servos que no respondan
    if not result:
        raise HTTPException(504,"No servos responded")
    return result

class TorqueCmd(BaseModel):
    id: int
    enable: bool

@app.post("/api/torque")
def api_torque(cmd: TorqueCmd):
    if not (1 <= cmd.id <= 253):
        raise HTTPException(400, "Servo ID 1-253")

    dxl_send(pkt_write(cmd.id, TORQUE_EN, 0x01 if cmd.enable else 0x00))
    return {"servo_id": cmd.id, "torque": cmd.enable}
