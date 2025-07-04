#include <Arduino.h>
#include <AX12A.h>           // Librería para controlar Dynamixel

// Pin de dirección half-duplex (OĒ/RĒ del 74LS244)
#define DIRECTION_PIN  5   

// Baud rate del bus Dynamixel
#define BAUDRATE     1000000UL  

// ID del servo a probar
#define SERVO_ID         2u   

// Pin analógico del potenciómetro (si lo usas)
#define POT_PIN          A4  

// Límites de movimiento
int initial_pos = 512;
int maximum     = initial_pos + 511;
int minimum     = initial_pos - 512;
int pos         = initial_pos;
int delta       = 5;

// Variables para entrada por Serial USB
String data        = "";
int     commaIndex = -1;
String  strID      = "";
String  strAngle   = "";

void setup() {
  // 1) Debug por USB
  Serial.begin(115200);

  // 2) Serial1 para Dynamixel en Mega (TX1=18, RX1=19)
  Serial1.begin(BAUDRATE);

  // 3) Inicializa el bus Dynamixel usando Serial1 y el pin de dirección
  ax12a.begin(BAUDRATE, DIRECTION_PIN, &Serial1);

  // 4) Asegura que el servo arranque sin torque
  ax12a.torqueStatus(SERVO_ID, OFF);
  ax12a.setEndless(SERVO_ID, OFF);
}

void loop() {
  // --- Movimiento continuo (descomenta para probar) ---
  /*
  pos += delta;
  if (pos > maximum || pos < minimum) {
    delta = -delta;
    pos += delta;
  }
  ax12a.move(SERVO_ID, pos);
  delay(20);
  */

  // --- Movimiento con potenciómetro (descomenta) ---
  /*
  int potVal = analogRead(POT_PIN);
  pos = map(potVal, 0, 1023, 0, 1023); // en Mega A4 es 10-bit
  ax12a.move(SERVO_ID, pos);
  delay(20);
  */

  // --- Movimiento vía comando por USB ---
  if (Serial.available()) {
    data = Serial.readStringUntil('\n');
    data.trim();

    if (data.equalsIgnoreCase("read")) {
      // Lectura de posición de varios servos
      for (uint8_t id = 1; id <= 4; id++) {
        Serial.print("ID ");
        Serial.print(id);
        Serial.print(": ");
        Serial.println(ax12a.readPosition(id));
      }
    } else {
      // Parseo "ID,POS"
      commaIndex = data.indexOf(',');
      if (commaIndex > 0) {
        strID    = data.substring(0, commaIndex);
        strAngle = data.substring(commaIndex + 1);
        uint8_t id  = (uint8_t) strID.toInt();
        uint16_t p  = (uint16_t) strAngle.toInt();
        Serial.print("Moviendo ID ");
        Serial.print(id);
        Serial.print(" a ");
        Serial.println(p);
        ax12a.torqueStatus(id, ON);
        ax12a.move(id, p);
      }
    }
    data = "";
  }
}
