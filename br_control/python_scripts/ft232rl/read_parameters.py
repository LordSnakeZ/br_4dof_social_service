import serial, time

# ---------- CONFIGURA ----------
PORT     = '/dev/tty.usbserial-A5XK3RJT'
BAUD     = 1_000_000
DXL_ID   = 2              # servo a inspeccionar
TIMEOUT  = 0.02           # 20 ms
# --------------------------------

def tx_cs(p): return (~sum(p[2:]) & 0xFF) & 0xFF
def rx_cs(r): return (~sum(r[2:-1]) & 0xFF) & 0xFF
def pkt_read(i,a,n): 
    p=[0xFF,0xFF,i,0x04,0x02,a,n]; p.append(tx_cs(p)); return bytes(p)

def read_n(ser,i,a,n):
    ser.dtr=False
    ser.reset_input_buffer()
    ser.write(pkt_read(i,a,n)); ser.flush()
    while ser.out_waiting: pass
    time.sleep(0.00005)
    ser.dtr=True
    r=ser.read(6+n)
    return list(r[5:5+n]) if len(r)==6+n and rx_cs(r)==r[-1] else None

with serial.Serial(PORT, BAUD, timeout=TIMEOUT) as s:
    srl  = read_n(s, DXL_ID, 16, 1)   # Status Return Level
    pos  = read_n(s, DXL_ID, 36, 2)   # Position
    spd  = read_n(s, DXL_ID, 38, 2)   # Speed
    load = read_n(s, DXL_ID, 40, 2)   # Load
    vcc  = read_n(s, DXL_ID, 42, 1)   # Voltage
    temp = read_n(s, DXL_ID, 43, 1)   # Temperature
    ten  = read_n(s, DXL_ID, 24, 1)   # Torque Enable

# ---------- PRESENTA ----------
def ok(val): return val is not None

if ok(srl):
    mode = {0:'No status',1:'Only Ping',2:'All instr.'}.get(srl[0],'¿?')
    print(f"SRL          : {srl[0]} ({mode})")

if ok(pos):
    p = pos[0]|(pos[1]<<8);  print(f"Posición     : {round(p*300/1023,1)}°  ({p}u)")
if ok(spd):
    rpm=(spd[0]|(spd[1]<<8))*0.111;    print(f"Velocidad    : {rpm:.1f} RPM")
if ok(load):
    raw=load[0]|(load[1]<<8)
    sign='-' if raw&0x400 else '+'; pct=(raw&0x3FF)*100/1023
    print(f"Carga        : {sign}{pct:.1f} %")
if ok(vcc):
    print(f"Voltaje      : {vcc[0]/10:.1f} V")
if ok(temp):
    print(f"Temperatura  : {temp[0]} °C")
if ok(ten):
    print(f"Torque       : {'ON' if ten[0] else 'OFF'}")
