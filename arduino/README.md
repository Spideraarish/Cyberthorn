# Arduino Uno R3 — Cyber-Physical Alert & Airgap Actuator

A standalone hardware module that receives threat alerts over USB Serial (9600 baud) and triggers physical actuators: a warning LED, an acoustic buzzer, and an optocoupled relay circuit breaker.

---

## 1. Components

| Component | Quantity | Purpose |
| :--- | :--- | :--- |
| **Arduino Uno R3** | 1 | Microcontroller (ATmega328P) |
| **Alert LED** | 1 (Yellow or Red) | Visual threat warning beacon |
| **Resistor** | 1 (220Ω) | Current limiter for LED |
| **Piezo Buzzer** | 1 | Acoustic alarm sounder |
| **5V Relay Module** | 1 (Songle SRD-05VDC) | Physical airgap circuit breaker |
| **USB Cable** | 1 (Type-A to Type-B) | Serial communication & 5V power |
| **Jumper Wires** | 6-8 Dupont wires | Breadboard / pin connections |

---

## 2. Wiring & Pinout Table

| Arduino Pin | Connected Component | Terminal / Pin | Wire Color (Standard) |
| :--- | :--- | :--- | :--- |
| **Pin 13** | Alert LED | Anode (+) via 220Ω resistor | Yellow |
| **Pin 12** | Piezo Buzzer | Positive terminal (+) | Orange |
| **Pin 11** | 5V Relay Module | Signal / IN pin | Blue |
| **5V** | 5V Relay Module | VCC (+) | Red |
| **GND** | LED, Buzzer, Relay | Common Ground (Cathode / - / GND) | Black |

---

## 3. Circuit Schematic

```text
                     +---------------------------+
                     |      ARDUINO UNO R3       |
                     +---------------------------+
                     |                           |
   USB (from PC) ====| [USB-B]                   |
                     |                           |
                     |                   [PIN 13]|---> [ 220Ω Resistor ] ---> (+) LED (-) ---> GND
                     |                   [PIN 12]|---> (+) BUZZER (-) -----------------------> GND
                     |                   [PIN 11]|---> (IN) RELAY MODULE
                     |                      [5V] |---> (VCC) RELAY MODULE
                     |                     [GND] |---> (GND) RELAY MODULE -------------------> GND
                     +---------------------------+

                                 RELAY CONTACTS:
                            [ COM ] === Input Line
                            [ NC  ] === Connected Device (Normally Closed)
                            [ NO  ] === (Trips open on alert)
```

---

## 4. Arduino Code (`alert_listener.ino`)

Upload this code using the **Arduino IDE** (select board: *Arduino Uno*, select port: `/dev/cu.usbmodem*` on Mac or `/dev/ttyACM*` on Linux):

```cpp
const int ledPin = 13;
const int buzzerPin = 12;
const int relayPin = 11;

void setup() {
  Serial.begin(9600);
  pinMode(ledPin, OUTPUT);
  pinMode(buzzerPin, OUTPUT);
  pinMode(relayPin, OUTPUT);

  // Initial State: Safe / Normal
  digitalWrite(ledPin, LOW);
  noTone(buzzerPin);
  digitalWrite(relayPin, LOW);
}

void loop() {
  if (Serial.available() > 0) {
    String level = Serial.readStringUntil('\n');
    level.trim();

    if (level == "block") {
      // 1. Trip the physical relay open (Airgap)
      digitalWrite(relayPin, HIGH);

      // 2. Flash LED and sound acoustic alarm 3 times
      for (int i = 0; i < 3; i++) {
        digitalWrite(ledPin, HIGH);
        tone(buzzerPin, 1000, 200); // 1000 Hz, 200ms
        delay(200);
        digitalWrite(ledPin, LOW);
        delay(200);
      }
    } 
    else if (level == "watch") {
      // Steady LED for 1 second, buzzer silent, relay closed
      digitalWrite(relayPin, LOW);
      noTone(buzzerPin);
      digitalWrite(ledPin, HIGH);
      delay(1000);
      digitalWrite(ledPin, LOW);
    } 
    else {
      // Normal / Safe state: all off, relay closed
      digitalWrite(ledPin, LOW);
      noTone(buzzerPin);
      digitalWrite(relayPin, LOW);
    }
  }
}
```

---

## 5. Serial Commands & Behavior

The Arduino listens on the serial port at **9600 baud** for text strings ending with a newline (`\n`):

| Command String | Status | LED (Pin 13) | Buzzer (Pin 12) | Relay (Pin 11) |
| :--- | :--- | :--- | :--- | :--- |
| `block\n` | **DANGER / ATTACK** | Blinks 3 times | Buzzes 3 times (1000 Hz) | **TRIPS OPEN** (Airgap severed) |
| `watch\n` | **SUSPICIOUS** | Steady ON for 1s | Silent | Stays Closed |
| `ignore\n` | **BENIGN / SAFE** | OFF | Silent | Stays Closed |

---

## 6. How to Test Manually

### Option A: Using the Arduino IDE Serial Monitor
1. Open the Arduino IDE.
2. Go to **Tools > Serial Monitor**.
3. Set the baud rate to **9600 baud** and line ending to **Newline**.
4. Type `block` and press Enter -> watch the LED strobe, buzzer sound, and relay click.
5. Type `watch` and press Enter -> watch the LED turn on steadily for 1 second.
6. Type `ignore` and press Enter -> all indicators return to idle.

### Option B: Quick Python One-Liner
```python
import serial, time

# Replace with your actual port (/dev/ttyACM0 on Linux, /dev/cu.usbmodem14101 on Mac)
s = serial.Serial('/dev/cu.usbmodem14101', 9600, timeout=1)
time.sleep(2)  # Wait for Arduino auto-reset

s.write(b"block\n")  # Triggers the alert
s.close()
```
