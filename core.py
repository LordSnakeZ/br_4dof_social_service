from dynamixel_sdk import *                    # Importa librería SDK

# Configuración
DEVICENAME = 'COM4'        # Cambia esto según tu sistema
BAUDRATE = 1000000
PROTOCOL_VERSION = 1.0
DXL_ID = 1                 # Cambia al ID de tu servo
ADDR_GOAL_POSITION = 30
ADDR_PRESENT_POSITION = 36

# Inicializa puerto
portHandler = PortHandler(DEVICENAME)
packetHandler = PacketHandler(PROTOCOL_VERSION)

if portHandler.openPort():
    print("Puerto abierto correctamente")
else:
    print("Error al abrir puerto")

if portHandler.setBaudRate(BAUDRATE):
    print("Baudrate configurado correctamente")
else:
    print("Error al configurar baudrate")

# Mover a posición 512 (centro = 90°)
goal_position = 512
dxl_comm_result, dxl_error = packetHandler.write2ByteTxRx(
    portHandler, DXL_ID, ADDR_GOAL_POSITION, goal_position)

if dxl_comm_result != COMM_SUCCESS:
    print(f"Fallo de comunicación: {packetHandler.getTxRxResult(dxl_comm_result)}")
elif dxl_error != 0:
    print(f"Error en servo: {packetHandler.getRxPacketError(dxl_error)}")
else:
    print("Movimiento exitoso")

# Cierra puerto
portHandler.closePort()
