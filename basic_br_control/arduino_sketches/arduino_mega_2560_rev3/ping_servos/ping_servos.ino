/**
 * @file DynamixelServoScanner.ino
 * @brief Scans for Dynamixel servos across all baud rates and protocols (1.0/2.0).
 * @details Uses HardwareSerial (Serial1) on Arduino Mega 2560 with half-duplex control.
 * @author Santiago S. Sánchez
 * @date 2025-07-08
 */

#include <Arduino.h>
#include <Dynamixel2Arduino.h>

// —— Hardware Configuration ——
#define DXL_DIR_PIN   2           ///< Direction pin for half-duplex buffer (OĒ/RĒ)
HardwareSerial& DXL_SERIAL = Serial1;  ///< Serial1: TX1=18 → DIN, RX1=19 ← DOUT

// —— Baud Rates to Scan ——
#define MAX_BAUD 13
const unsigned long baudRates[MAX_BAUD] = {
  9600UL, 19200UL, 57600UL, 115200UL, 200000UL, 250000UL, 400000UL,
  500000UL, 1000000UL, 2000000UL, 3000000UL, 4000000UL, 4500000UL
};

// —— Dynamixel Driver ——
Dynamixel2Arduino dxl(DXL_SERIAL, DXL_DIR_PIN);  ///< Dynamixel communication handler

/**
 * @brief Initial setup: scans for servos on all protocols and baud rates.
 */
void setup() {
  Serial.begin(115200);
  while (!Serial);  // Wait for serial monitor
  Serial.println(F("=== DYNAMIXEL SERVO SCANNER (Mega2560) ==="));

  // Scan Protocol 1.0 and 2.0
  for (float protocol = 1.0; protocol <= 2.0; protocol += 1.0) {
    dxl.setPortProtocolVersion(protocol);
    Serial.print(F("\n--- Protocol "));
    Serial.print(protocol, 1);
    Serial.println(F(" ---"));

    // Test each baud rate
    for (int i = 0; i < MAX_BAUD; i++) {
      unsigned long bps = baudRates[i];
      Serial.print(F("\n-> Baudrate: "));
      Serial.println(bps);

      // Initialize Serial1 at current baud
      DXL_SERIAL.begin(bps);
      delay(20);  // Stabilization time

      // Initialize driver
      dxl.begin(bps);
      delay(20);

      // Ping all possible IDs (0–253)
      for (uint8_t id = 0; id < 254; id++) {
        if (dxl.ping(id)) {
          Serial.print(F("✅ Found servo ID: "));
          Serial.print(id);
          Serial.print(F(", Model: "));
          Serial.println(dxl.getModelNumber(id));

          // Visual confirmation: blink servo LED
          dxl.ledOn(id);
          delay(200);
          dxl.ledOff(id);
        }
      }
    }
  }

  Serial.println(F("\n=== Scan complete ==="));
}

/**
 * @brief Empty loop (scan runs once in setup).
 */
void loop() {
  // No action needed
}