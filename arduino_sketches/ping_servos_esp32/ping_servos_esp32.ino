#include <Arduino.h>
#include <Dynamixel2Arduino.h>

// ——— Pines y baudios ———
#define DXL_RX_PIN    16          // ESP32 GPIO16 ← nivel lógico
#define DXL_TX_PIN    17          // ESP32 GPIO17 → nivel lógico
#define DXL_DIR_PIN    5          // OĒ/RĒ del HD74LS271P

#define DXL_BPS     1000000UL     // 1 Mbps para AX-12A/AX-18A
#define DEBUG_BPS   115200UL      // para el Monitor Serie

// ——— IDs de los servos ———
const uint8_t AX18A_ID    = 1;
const uint8_t AX12A_IDS[] = {2, 3, 4};

// Instancia de Serial2 + driver Dynamixel
HardwareSerial&    DXL_SERIAL = Serial2;
Dynamixel2Arduino dxl( DXL_SERIAL, DXL_DIR_PIN );

void setup() {
  // Monitor Serie al PC
  Serial.begin(DEBUG_BPS);
  Serial.println("\n=== TEST DYNAMIXEL2Arduino ===");

  // UART2 para el bus Dynamixel
  DXL_SERIAL.begin(DXL_BPS, SERIAL_8N1, DXL_RX_PIN, DXL_TX_PIN);

  // Inicializa driver y fija protocolo 1.0
  dxl.begin(DXL_BPS);
  dxl.setPortProtocolVersion(1.0);

  Serial.println("Bus inicializado.");
}

void loop() {
  // Ping al AX-18A
  Serial.print("Ping AX-18A (ID "); Serial.print(AX18A_ID); Serial.print(") ... ");
  Serial.println(dxl.ping(AX18A_ID) ? "OK" : "FAIL");

  // Ping a cada AX-12A
  for (auto id : AX12A_IDS) {
    Serial.print("Ping AX-12A (ID "); Serial.print(id); Serial.print(") ... ");
    Serial.println(dxl.ping(id) ? "OK" : "FAIL");
  }

  delay(1000);
}
