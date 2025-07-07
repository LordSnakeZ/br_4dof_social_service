#include <Arduino.h>
#include <Dynamixel2Arduino.h>

// ——— Pines y puerto para Arduino Mega 2560 ———
#define DXL_DIR_PIN   2           // OĒ/RĒ del buffer half-duplex
HardwareSerial& DXL_SERIAL = Serial1;  // Serial1: TX1=18 → DIN, RX1=19 ← DOUT

// ——— Lista de baud rates a escanear ———
#define MAX_BAUD 13
const unsigned long baudRates[MAX_BAUD] = {
  9600UL, 19200UL, 57600UL, 115200UL, 200000UL, 250000UL, 400000UL,
  500000UL, 1000000UL, 2000000UL, 3000000UL, 4000000UL, 4500000UL
};

// ——— Driver Dynamixel ———
Dynamixel2Arduino dxl( DXL_SERIAL, DXL_DIR_PIN );

void setup() {
  Serial.begin(115200);
  while (!Serial);
  Serial.println(F("=== ESCANEO DE SERVOS DYNAMIXEL (Mega2560) ==="));

  // Escaneo de protocolos 1.0 y 2.0
  for (float protocol = 1.0; protocol <= 2.0; protocol += 1.0) {
    dxl.setPortProtocolVersion(protocol);
    Serial.print(F("\n--- Protocolo "));
    Serial.print(protocol, 1);
    Serial.println(F(" ---"));

    // Escaneo de cada baud rate
    for (int i = 0; i < MAX_BAUD; i++) {
      unsigned long bps = baudRates[i];
      Serial.print(F("\n-> Baudrate: "));
      Serial.println(bps);

      // Inicializa Serial1 al baud actual
      DXL_SERIAL.begin(bps);
      delay(20);

      // Inicializa driver con ese baud
      dxl.begin(bps);
      delay(20);

      // Escanea todas las IDs (0–253)
      for (uint8_t id = 0; id < 254; id++) {
        if (dxl.ping(id)) {
          Serial.print(F("✅ Encontrado servo ID: "));
          Serial.print(id);
          Serial.print(F(", Modelo: "));
          Serial.println(dxl.getModelNumber(id));

          // Parpadeo del LED del servo para confirmación visual
          dxl.ledOn(id);
          delay(200);
          dxl.ledOff(id);
        }
      }
    }
  }

  Serial.println(F("\n=== Escaneo completo ==="));
}

void loop() {
  // El escaneo se hace una sola vez en setup()
}

