/**
 * @file DynamixelArmControl.ino
 * @brief Controls a multi-servo Dynamixel robotic arm with individual or synchronized movement commands.
 * @details Supports Protocol 1.0 servos (AX/MX series) with angle-to-position conversion.
 * @author Santiago S. Sánchez
 * @date 2025-07-08
 */

#include <Arduino.h>
#include <Dynamixel.h>

// ------ Bus Configuration ------
#define DXL_DIR_PIN    2           ///< Half-duplex direction control pin
#define DXL_BAUDRATE   1000000UL   ///< Communication speed (1Mbps)
#define DXL_PROTOCOL   1           ///< Dynamixel protocol version (1.0)
#define DXL_RESOLUTION 1023        ///< Position resolution (0-1023 for 0-300° range)

HardwareSerial& dxlSerial = Serial1;  ///< Hardware Serial: TX1=18, RX1=19 on Mega

// ------ Servo Configuration ------
const uint8_t SERVO_IDS[] = {1, 2, 3, 4};  ///< Array of servo IDs in the arm

/**
 * @brief Converts degrees to raw Dynamixel position value
 * @param deg Angle in degrees (0-300)
 * @return uint16_t Raw position value (0-1023)
 * @note Clamps input to valid range (0-300°) for AX/MX series servos
 */
uint16_t degToRaw(float deg) {
  deg = constrain(deg, 0, 300);       // Limit to physical range
  return uint16_t(deg * DXL_RESOLUTION / 300.0 + 0.5);  // Linear conversion with rounding
}

void setup() {
  Serial.begin(115200);
  dxlSerial.begin(DXL_BAUDRATE);
  Dynamixel.begin(&dxlSerial, DXL_BAUDRATE, DXL_DIR_PIN, DXL_PROTOCOL);

  Serial.println(F("\nAvailable commands:"));
  Serial.println(F("  ID,DEGREE   → Move single servo (e.g., '1,90')"));
  Serial.println(F("  all,DEGREE  → Move all arm servos (e.g., 'all,45')"));
}

void loop() {
  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();                    // Remove whitespace

    int comma = cmd.indexOf(',');
    if (comma < 0) return;         // Invalid format

    String target = cmd.substring(0, comma);
    float deg = cmd.substring(comma + 1).toFloat();
    uint16_t raw = degToRaw(deg);

    if (target.equalsIgnoreCase("all")) {
      // Move all servos synchronously
      for (uint8_t id : SERVO_IDS) {
        Dynamixel.setTorque(id, ON);
        Dynamixel.move(id, raw);
      }
      Serial.print(F("→ All servos to "));
      Serial.print(deg); Serial.println(F("°"));
    } else {
      // Move individual servo
      uint8_t id = (uint8_t)target.toInt();
      Dynamixel.setTorque(id, ON);
      Dynamixel.move(id, raw);
      Serial.print(F("→ Servo ID ")); Serial.print(id);
      Serial.print(F(" to ")); Serial.print(deg);
      Serial.println(F("°"));
    }
  }
}