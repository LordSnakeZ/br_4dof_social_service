/**
 * @file DynamixelServoControl.ino
 * @brief Controls a Dynamixel servo in joint mode with absolute angle input (0-300°).
 * @details Uses Protocol 1.0 on Arduino Mega 2560 with half-duplex communication.
 * @author Santiago S. Sánchez
 * @date 2025-07-08
 */

#include <Arduino.h>
#include <Dynamixel.h>

// ------ Hardware Configuration ------
#define DXL_DIR_PIN     2           ///< Direction pin for half-duplex buffer (OĒ/RĒ)
#define DXL_BAUDRATE    1000000UL   ///< Communication speed (1 Mbps)
#define DXL_PROTOCOL    1           ///< Dynamixel protocol version (1.0)
#define SERVO_ID        1           ///< Target servo ID

HardwareSerial& dxlSerial = Serial1;  ///< Mega 2560: TX1=18 → DIN, RX1=19 ← DOUT

/**
 * @brief Converts degrees (0-300°) to Dynamixel raw position value (0-1023).
 * @param deg Angle in degrees (0-300).
 * @return uint16_t Raw position value for Dynamixel servo.
 */
uint16_t degToRaw(float deg) {
  deg = constrain(deg, 0, 300);  // Clamp to valid range
  return uint16_t(deg * 1023.0 / 300.0 + 0.5);  // Linear mapping with rounding
}

void setup() {
  Serial.begin(115200);
  dxlSerial.begin(DXL_BAUDRATE);
  Dynamixel.begin(&dxlSerial, DXL_BAUDRATE, DXL_DIR_PIN, DXL_PROTOCOL);

  /*  ------ OPTIONAL: Joint Mode Configuration ------
   *  Uncomment this block to force joint mode if servo is misconfigured.
   *  Sets CW limit to 0 and CCW limit to 1023 (full range).
   *
  Dynamixel.setTorque(SERVO_ID, OFF);
  Dynamixel.writeWord(SERVO_ID, 6,   0);     // CW limit (raw)
  Dynamixel.writeWord(SERVO_ID, 8, 1023);    // CCW limit (raw)
  Dynamixel.setTorque(SERVO_ID, ON);
  */

  Serial.println(F("\nEnter absolute angle (0-300°) and press ENTER:"));
}

void loop() {
  if (Serial.available()) {
    float deg = Serial.parseFloat();  // Read angle input
    if (Serial.read() == '\n') {      // Wait for newline/CR
      uint16_t goal = degToRaw(deg);
      Dynamixel.move(SERVO_ID, goal);  // Send position command
      
      Serial.print(F("→ Moving servo ID "));
      Serial.print(SERVO_ID);
      Serial.print(F(" to "));
      Serial.print(deg);
      Serial.println(F(" °"));
    }
  }
}