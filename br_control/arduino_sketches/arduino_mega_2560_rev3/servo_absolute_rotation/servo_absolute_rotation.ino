#include <Arduino.h>
#include <Dynamixel.h>

// ——— Parámetros del bus ———
#define DXL_DIR_PIN    2
#define DXL_BAUDRATE   1000000UL
#define DXL_PROTOCOL   1
#define DXL_RESOLUTION 1023           // 0–1023 ↔ 0–300 ° en AX-/MX-series

HardwareSerial& dxlSerial = Serial1;  // Mega: TX1=18, RX1=19

// Lista de servos que componen tu brazo (ajusta IDs)
const uint8_t SERVO_IDS[] = {1, 2, 3, 4};

// ——— Función utilitaria: grados → posición cruda ———
uint16_t degToRaw(float deg) {
  deg = constrain(deg, 0, 300);       // AX-12/18A solo giran 0-300 °
  return uint16_t(deg * DXL_RESOLUTION / 300.0 + 0.5);
}

void setup() {
  Serial.begin(115200);
  dxlSerial.begin(DXL_BAUDRATE);
  Dynamixel.begin(&dxlSerial, DXL_BAUDRATE, DXL_DIR_PIN, DXL_PROTOCOL);

  Serial.println(F("\nEscribe un comando:"));
  Serial.println(F("  ID,GRADO   → mueve un solo servo"));
  Serial.println(F("  all,GRADO  → mueve todos los de la lista\n"));
}

void loop() {
  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();                    // quita espacios/nueva línea

    int comma = cmd.indexOf(',');
    if (comma < 0) return;         // formato inválido

    String target = cmd.substring(0, comma);
    float  deg    = cmd.substring(comma + 1).toFloat();
    uint16_t raw  = degToRaw(deg);

    if (target.equalsIgnoreCase("all")) {
      for (uint8_t id : SERVO_IDS) {
        Dynamixel.setTorque(id, ON);
        Dynamixel.move(id, raw);
      }
      Serial.print(F("→ Todos los servos a "));
      Serial.print(deg); Serial.println(F("°"));
    } else {
      uint8_t id = (uint8_t) target.toInt();
      Dynamixel.setTorque(id, ON);
      Dynamixel.move(id, raw);
      Serial.print(F("→ Servo ID ")); Serial.print(id);
      Serial.print(F(" a "));          Serial.print(deg);
      Serial.println(F("°"));
    }
  }
}

