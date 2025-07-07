# Uso avanzado del **FT232RL** en un bus Dynamixel

> Guía completa – hardware, software y depuración – para controlar servos AX‑series (protocolo 1.0) desde **macOS** con un adaptador **FT232RL USB‑TTL**, un buffer **74HC241** y la línea **DTR** como dirección TX/RX.

---

## 1. Arquitectura del enlace

```
Mac ⟷ FT232RL ⟷ 74HC241 ⟷ Bus DATA ↔ Servos Dynamixel
```

| Señal FT232RL   | 74HC241 | Bus                | Notas                         |
| --------------- | ------- | ------------------ | ----------------------------- |
| **TXD**         | 2A4     | DATA (hacia servo) | Datos salientes (1 Mbps).     |
| **RXD**         | 2Y1     | DATA (del servo)   | Datos entrantes.              |
| **DTR**         | /1G, 2G | —                  | Selección **Tx/Rx** (ver §2). |
| **GND**         | GND     | GND                | Tierra común.                 |
| +5 V (USB)      | Vcc     | —                  | Alimenta el 74HC241.          |
| +12 V (externo) | —       | Vcc servo          | Potencia de los AX‑12/18/12W. |

> **/1G** tiene burbuja (activo‑bajo), **2G** es activo‑alto. Al alimentar con +5 V el 74HC241 puede manejar 12 Mbps; 1 Mbps es seguro.

---

## 2. Tabla de verdad de **DTR**

| `ser.dtr` | Nivel en pin | /1G   | 2G    | Banco activo | Modo           | LED (test) |
| --------- | ------------ | ----- | ----- | ------------ | -------------- | ---------- |
| **False** | +5 V (HIGH)  | 1     | **1** | Banco‑2 (TX) | **Transmitir** | Encendido  |
| **True**  | 0 V  (LOW)   | **0** | 0     | Banco‑1 (RX) | **Recibir**    | Apagado    |

> Abre tu puerto y alterna `ser.dtr = False/True` con un LED + resistencia: verás la conmutación.

---

## 3. Temporización correcta

```python
ser.dtr = False            # ① TX
ser.write(pkt)
ser.flush()                # ② driver→chip
while ser.out_waiting:
    pass                   # ③ FIFO del FT232RL = 0
# margen para último byte
time.sleep(0.0001)         # ④ 100 µs
ser.dtr = True             # ⑤ RX
resp = ser.read(expected)
```

*Los 100 µs equivalen a \~100 bits a 1 Mbps → garantiza que el bus esté libre antes de escuchar.*

---

## 4. Construcción de paquetes (protocolo 1.0)

```python
def checksum(tx_bytes):
    """Complemento a 1 de la suma desde ID hasta último parámetro."""
    return (~sum(tx_bytes[2:]) & 0xFF) & 0xFF
```

### Plantillas

| Operación      | Bytes TX                                      | Respuesta                         |
| -------------- | --------------------------------------------- | --------------------------------- |
| **PING**       | `FF FF ID 02 01 CS`                           | `FF FF ID 02 ERR CS`              |
| **READ n**     | `FF FF ID 04 02 ADDR n CS`                    | `FF FF ID (n+2) ERR <n datos> CS` |
| **WRITE n**    | `FF FF ID (3+n) 03 ADDR … CS`                 | `FF FF ID 02 ERR CS`              |
| **SYNC WRITE** | `FF FF FE (4+n·m) 83 ADDR n (ID1 data…) … CS` | *(sin respuesta)*                 |

---

## 5. Scripts de referencia

### 5.1 Escanear IDs y leer modelo

```python
IDS=[1,2,3,4]
MODELS={0x000C:'AX‑12',0x0012:'AX‑18A',0x012C:'AX‑12W'}
...
```

(Script completo **scan\_dxl\_ids.py** incluido en la carpeta.)

### 5.2 Mover a un ángulo específico

```python
angle_deg = 80
pos = round(angle_deg * 1023 / 300)   # 274
cmd=[0xFF,0xFF,ID,0x05,0x03,30,pos&0xFF,pos>>8]
cmd.append(checksum(cmd))
```

### 5.3 SYNC WRITE (IDs 1‑4 a 512)

```python
ids=[1,2,3,4]; goal=512
params=b''.join([bytes([i,goal&0xFF,goal>>8]) for i in ids])
length=4+len(params)
pkt=[0xFF,0xFF,0xFE,length,0x83,30,0x02]+list(params)
pkt.append(checksum(pkt))
```

## 6. Lectura de parámetros de estado

| Nombre              | Dirección | Bytes | Conversión Python                                                  |                                 |
| ------------------- | --------- | ----- | ------------------------------------------------------------------ | ------------------------------- |
| Present Position    | 36‑37     | 2     | \`(lo                                                              | hi<<8) \* 300 / 1023\` → grados |
| Present Speed       | 38‑39     | 2     | \`(lo                                                              | hi<<8) \* 0.111\` → RPM         |
| Present Load        | 40‑41     | 2     | `sign = '-' if raw & 0x400 else '+'``pct = (raw & 0x3FF)*100/1023` |                                 |
| Present Voltage     | 42        | 1     | `raw/10` → voltios                                                 |                                 |
| Present Temperature | 43        | 1     | Valor directo en °C                                                |                                 |
| Torque Enable       | 24        | 1     | 0 = OFF, 1 = ON                                                    |                                 |
| Status Return Level | 16        | 1     | 0 = Sin status, 1 = Solo PING, 2 = Todas                           |                                 |

### Ejemplo rápido en Python

```python
pos,spd,load,vcc,tmp = 36,38,40,42,43
raw = read_n(ser, ID, load, 2)
rawv = raw[0] | (raw[1]<<8)
sign = '-' if rawv & 0x400 else '+'
percent = (rawv & 0x3FF)*100/1023
print(f"Carga: {sign}{percent:.1f} %")
```

**Nota sobre cargas negativas** – el bit 10 indica dirección de esfuerzo (CW/CCW). Por eso puedes ver `-9 %` aun sin mando; es la corrección interna del PID.

---

## 7. Conversión grados → unidades (redondeo)

```python
def deg_to_units(deg, res=1023):
    """0–300 ° → 0–res con redondeo al entero más cercano."""
    return int(deg * res / 300.0 + 0.5)      # +0.5 → round()
```

---

## 8. Resolución de problemas

| Problema                    | Diagnóstico rápido             | Solución                                                                     |
| --------------------------- | ------------------------------ | ---------------------------------------------------------------------------- |
| LED nunca cambia            | DTR no sale del FT232RL        | Conectar a pin DTR real, o usar FT\_PROG para reasignar CBUS→TXDEN.          |
| Sin respuesta a 1 Mbps      | Cable >30 cm, driver VCP viejo | Actualizar driver FTDI VCP, usar cables trenzados cortos, probar a 576 kbps. |
| Checksum siempre incorrecto | Incluyes byte CS en la suma    | Calcula CS solo hasta penúltimo byte.                                        |
| Doble apertura del puerto   | SDK + PySerial compiten        | Usa **un solo descriptor** (`ph.ser` o pySerial puro).                       |

---

## 7. Recursos

- Driver FTDI VCP macOS: [https://ftdichip.com/drivers/vcp-drivers/](https://ftdichip.com/drivers/vcp-drivers/)
- Datasheet 74HC241: SN74HC241‑EP (Texas Instruments).
- Dynamixel Protocol 1.0 manual: [http://emanual.robotis.com](http://emanual.robotis.com)

---

**Última revisión:** 6 jul 2025 23:15 UTC

