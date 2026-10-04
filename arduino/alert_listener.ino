const int ledPin = 13;
const int buzzerPin = 12;

void setup() {
  Serial.begin(9600);
  pinMode(ledPin, OUTPUT);
  pinMode(buzzerPin, OUTPUT);
}

void loop() {
  if (Serial.available() > 0) {
    String level = Serial.readStringUntil('\n');
    level.trim();

    if (level == "block") {
      // Blink LED and buzz
      for(int i=0; i<3; i++) {
        digitalWrite(ledPin, HIGH);
        tone(buzzerPin, 1000, 200);
        delay(200);
        digitalWrite(ledPin, LOW);
        delay(200);
      }
    } else if (level == "watch") {
      // Steady LED
      digitalWrite(ledPin, HIGH);
      noTone(buzzerPin);
      delay(1000);
      digitalWrite(ledPin, LOW);
    } else {
      digitalWrite(ledPin, LOW);
      noTone(buzzerPin);
    }
  }
}
