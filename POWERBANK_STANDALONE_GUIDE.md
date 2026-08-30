# ESP32 Standalone Power Bank Guide (No Laptop Needed)

Yes! The Smart Ration Dispenser **can run 100% independently from a Power Bank or standard 5V USB Mobile Charger adapter** without being connected to a laptop. 

Since the system communicates directly with **Supabase Cloud Database over Wi-Fi** and outputs status to the **16x2 I2C LCD**, it is completely autonomous.

---

## ⚠️ Potential Issues with Power Banks & Solutions

When moving from a Laptop USB port to a Power Bank, there are **3 common hardware behaviors** to be aware of:

---

### 1. Power Bank Auto-Shutoff (Low Current Sleep)

#### Why it happens:
Most modern smart power banks (Anker, Mi, Realme, Samsung) automatically cut power after 30–60 seconds if the connected device draws less than ~80mA. An idling ESP32 draws around ~50–70mA, which may cause the power bank to enter sleep mode and shut down.

#### Solutions:
- **Enable "Low Current / Trickle Charge Mode" on your Power Bank**:
  - Many power banks (e.g., Mi, Xiaomi, Anker) activate trickle charging when you **double-press the power button** (often indicated by an LED animation). This keeps the 5V line continuously active regardless of low current draw.
- **Use a Standard 5V Mobile Phone Charger Adapter**:
  - Plugging the ESP32's micro-USB cable into any standard 5V wall adapter (5V 1A or 5V 2A phone charger) completely eliminates auto-shutoff.
- **Keep-Alive Wi-Fi Activity**:
  - The current firmware already continuously polls Supabase every 1.5 seconds (`checkCloudDispenseQueue()`), which keeps the Wi-Fi radio transmitting bursts of 120–180mA to prevent sleep on most power banks.

---

### 2. Servo Motor Brownout / Instant ESP32 Reboot

#### Why it happens:
When the servo motor suddenly opens to $90^\circ$, it draws a temporary surge current (500mA – 1000mA for a few milliseconds). If the power bank voltage drops slightly, the ESP32 internal Brownout Detector may trigger an automatic reset.

#### Solutions:
- **Add a Buffer Capacitor (Recommended for Hardware)**:
  - Connect an electrolytic capacitor (**$470\mu\text{F}$ to $1000\mu\text{F}$, 10V or 16V**) across the **5V (VIN)** and **GND** rail near the servo motor power pins. This acts as a shock absorber for sudden current spikes.
- **Power Servo from 5V (VIN), Never 3.3V**:
  - Ensure the servo motor red wire is connected to the **VIN (5V)** pin of the ESP32, and brown/black wire to **GND**.
- **Software Brownout Suppression**:
  - If unexpected reboots occur when the servo moves, include these two lines at the very top of `setup()` in the Arduino sketch to disable software brownout halts:
    ```cpp
    #include "soc/soc.h"
    #include "soc/rtc_cntl_reg.h"

    void setup() {
      WRITE_PERI_REG(RTC_CNTL_BROWN_OUT_REG, 0); // Disable brownout detector
      // ... rest of setup
    }
    ```

---

### 3. Load Cell Tray Tare Timing

#### Why it happens:
During bootup, the ESP32 runs `scale.tare()`, setting whatever weight is currently on the tray to `0.0g`.

#### Solution:
- When you plug in the power bank, make sure the weighing tray/container is **empty** until the LCD finishes displaying `Smart Ration IoT / Initializing...` and transitions to the main ready screen.

---

## 📋 Summary Checklist for Standalone Operation

| Item | Requirement |
|---|---|
| **Power Source** | Power Bank with Trickle Mode OR standard 5V 2A USB wall adapter |
| **Wi-Fi Connection** | ESP32 and Laptop must have internet access (same hotspot or separate networks both work since Supabase Cloud acts as the bridge) |
| **User Flow** | 1. Power ESP32 from Power Bank.<br>2. Wait for LCD to display `WiFi Connected` and `Ready / Scan Face`.<br>3. Open Web App on Laptop / Phone.<br>4. Trigger Face Verification or Manual Dispense.<br>5. ESP32 detects cloud signal and dispenses 100g automatically! |
