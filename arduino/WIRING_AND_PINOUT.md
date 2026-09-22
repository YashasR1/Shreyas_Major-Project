# Digitalize Ration: Hardware Wiring & Pinout Guide

This document specifies the complete pinout, schematic interconnects, and electrical wiring specifications for the **Digitalize Ration Dispensing Unit**, verified on the ESP32 microcontroller platform.

---

## 🔌 Master Pinout Table

| Peripheral Module | Pin Name | ESP32 GPIO | Electrical Level | Functional Role |
| :--- | :--- | :--- | :--- | :--- |
| **RFID Reader (RC522)** | SDA (SS) | **GPIO 5** | 3.3V Logic | SPI Slave Select (Chip Select) |
| **RFID Reader (RC522)** | SCK | **GPIO 18** | 3.3V Logic | SPI Serial Bus Clock |
| **RFID Reader (RC522)** | MOSI | **GPIO 23** | 3.3V Logic | SPI Master Out Slave In |
| **RFID Reader (RC522)** | MISO | **GPIO 19** | 3.3V Logic | SPI Master In Slave Out |
| **RFID Reader (RC522)** | RST | **GPIO 4** | 3.3V Logic | Hardware Reset / Sleep Pin |
| **RFID Reader (RC522)** | 3.3V / GND | **3V3 / GND** | 3.3V Power | Module Power Supply (**Never connect to 5V!**) |
| **HX711 24-Bit ADC** | DT (DOUT) | **GPIO 32** | 3.3V/5V Logic | Serial Weighing Data Output |
| **HX711 24-Bit ADC** | SCK (CLK) | **GPIO 33** | 3.3V/5V Logic | Serial Clock Input |
| **HX711 24-Bit ADC** | VCC / GND | **VIN (5V) / GND** | 5V Power | Excitation and Analog Circuit Power |
| **Grain Gate Servo** | PWM Signal | **GPIO 13** | 5V Logic (Tolerant) | Dispenser Valve Angle Control (0° Closed, 90° Open) |
| **Grain Gate Servo** | VCC (Red) | **VIN (5V)** | 5V Power (High Current) | Motor Power (**Must be 5V, never ESP32 3.3V rail**) |
| **Grain Gate Servo** | GND (Brown/Black)| **GND** | Ground Reference | Common System Ground Bus |
| **16×2 Character LCD** | SDA | **GPIO 21** | 3.3V/5V (I2C) | PCF8574 I2C Serial Data |
| **16×2 Character LCD** | SCL | **GPIO 22** | 3.3V/5V (I2C) | PCF8574 I2C Serial Clock |
| **16×2 Character LCD** | VCC / GND | **VIN (5V) / GND** | 5V Power | I2C Display Backlight and Controller Power |
| **Access Granted LED** | Anode (+) | **GPIO 26** | 3.3V via 220Ω | Green Status Indicator (Lit on authorized card/dispense) |
| **Access Denied LED** | Anode (+) | **GPIO 27** | 3.3V via 220Ω | Red Status Indicator (Lit on unauthorized card/empty quota) |

---

## ⚖️ Load Cell to HX711 Color Code Interconnect

The 4-wire strain gauge load cell attaches to the analog terminal block of the HX711 board:

| Strain Gauge Wire Color | HX711 Terminal Pin | Signal Designation |
| :--- | :--- | :--- |
| **Red** | **E+** | Excitation Positive (+5V) |
| **Black** | **E-** | Excitation Ground (0V) |
| **White** | **A-** | Analog Input Channel A Negative Differential |
| **Green** | **A+** | Analog Input Channel A Positive Differential |

*(If using a 5-wire shielded load cell, connect the bare shielding wire to the HX711 **B-** or ground pad).*

---

## ⚡ Power Supply & Decoupling Capacitor Guidelines

1. **Servo Surge Isolation**:
   When the SG90/MG90S servo motor opens to 90°, it draws a transient surge current of 500mA–1000mA. 
   - **Requirement**: Solder or insert an electrolytic capacitor (**470µF to 1000µF, 10V or 16V**) directly across the **VIN (5V)** and **GND** rails adjacent to the servo leads.
   - This prevents supply voltage sagging that would otherwise trip the ESP32 Brownout Detector (`RTC_CNTL_BROWN_OUT_REG`).

2. **Standalone Power Bank Operation**:
   - Standard smart power banks shut off after 30 seconds due to low idle current (<80mA).
   - Use a power bank with **Trickle Mode** (double-tap power button) or an external 5V 2A USB wall adapter.
   - For complete details, see [POWERBANK_STANDALONE_GUIDE.md](../POWERBANK_STANDALONE_GUIDE.md).

3. **I2C Bus Address**:
   - Default I2C address for the PCF8574 backpack is **`0x27`** (or `0x3F` on select clones).
   - Connected to standard ESP32 hardware I2C pins: SDA on GPIO 21, SCL on GPIO 22.
