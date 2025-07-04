#include <Arduino.h>
#include <Dynamixel.h>

// -------- Parámetros de tu bus ----------
#define DXL_DIR_PIN     2           // Pin OĒ/RĒ del buffer half-duplex
#define DXL_BAUDRATE    1000000UL   // 1 Mbps
#define DXL_PROTOCOL    1           // Protocolo 1.0
#define SERVO_ID        1           // ID del servo que vas a probar

// Mega 2560  →  TX1 = 18,  RX1 = 19
HardwareSerial& dxlSerial = Serial1;

// ---------- util: grados → posición cruda ----------
uint16_t degToRaw(float deg) {                   // 0–300 °  → 0–1023
  deg = constrain(deg, 0, 300);
  return uint16_t(deg * 1023.0 / 300.0 + 0.5);
}

void setup() {
  Serial.begin(115200);
  dxlSerial.begin(DXL_BAUDRATE);
  Dynamixel.begin(&dxlSerial, DXL_BAUDRATE, DXL_DIR_PIN, DXL_PROTOCOL);

  /*  —— OPCIONAL ——
   *  Si no estás seguro de que el servo ya esté en modo “joint”,
   *  quita los comentarios de este bloque para forzarlo una sola vez.
   *
   *  Dynamixel.setTorque(SERVO_ID, OFF);
   *  Dynamixel.writeWord(SERVO_ID, 6,   0);     // CW  limit
   *  Dynamixel.writeWord(SERVO_ID, 8, 1023);    // CCW limit
   *  Dynamixel.setTorque(SERVO_ID, ON);
   */

  Serial.println(F("\nEnvía un ángulo absoluto (0–300) y ENTER:"));
}

void loop() {
  if (Serial.available()) {
    float deg = Serial.parseFloat();        // lee número
    if (Serial.read() == '\n') {            // espera NL/CR
      uint16_t goal = degToRaw(deg);
      Dynamixel.move(SERVO_ID, goal);
      Serial.print(F("→ Servo ID "));
      Serial.print(SERVO_ID);
      Serial.print(F(" a "));
      Serial.print(deg);
      Serial.println(F(" °"));
    }
  }
}
