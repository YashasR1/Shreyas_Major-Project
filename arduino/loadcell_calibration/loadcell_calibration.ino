#include "HX711.h"

// ---------- Pin Configuration ----------
#define LOADCELL_DOUT_PIN 32
#define LOADCELL_SCK_PIN 33

HX711 scale;
float calibration_factor = -650;
// Starting point (negative assumes it's upside down)

void setup() {
  Serial.begin(115200);
  Serial.println("===========================================");
  Serial.println("      HX711 CALIBRATION MODE (ESP32)       ");
  Serial.println("===========================================");
  Serial.println("1. Remove all weight from the scale.");
  Serial.println("2. Waiting 3 seconds to auto-tare...");
  delay(3000);

  scale.begin(LOADCELL_DOUT_PIN, LOADCELL_SCK_PIN);
  scale.set_scale();
  scale.tare(); // Reset the scale to 0

  Serial.println("Scale is zeroed!");
  Serial.println("\n--- INSTRUCTIONS ---");
  Serial.println("1. Place a KNOWN weight on the scale (e.g. exactly 500g bag).");
  Serial.println("2. Open the Serial Monitor input box at the top.");
  Serial.println("3. Type '+' or 'a' to increase the calibration factor.");
  Serial.println("4. Type '-' or 'z' to decrease the calibration factor.");
  Serial.println("5. Keep typing and pressing Enter until the weight reading exactly matches your object!");
  Serial.println("--------------------\n");
}

void loop() {
  scale.set_scale(calibration_factor);

  Serial.print("Reading: ");
  Serial.print(scale.get_units(), 1); // 1 decimal point
  Serial.print(" g");
  Serial.print(" | Calibration Factor: ");
  Serial.println(calibration_factor);

  if (Serial.available()) {
    char temp = Serial.read();
    
    // Large adjustments
    if (temp == '+' || temp == 'a') {
      calibration_factor += 10;
    } else if (temp == '-' || temp == 'z') {
      calibration_factor -= 10;
    }
    
    // Fine-tune adjustments (optional: type 'w' or 's' for smaller steps)
    if (temp == 'w') {
      calibration_factor += 1;
    } else if (temp == 's') {
      calibration_factor -= 1;
    }
  }

  delay(500); // Wait half a second before reading again
}
