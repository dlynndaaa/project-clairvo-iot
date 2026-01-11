#include <Wire.h>

#include <LiquidCrystal_I2C.h>

#include <WiFi.h>

#include <HTTPClient.h>



// WIFI

const char* ssid = "TrojanVirus";

const char* password = "walahweh";



// FIREBASE

// Pastikan path ini sesuai

String databaseURL = "https://project-iot-14988-default-rtdb.asia-southeast1.firebasedatabase.app";

String databaseSecret = "hi05UGB8C3G2ifEfyfQCcPsL7TmQsLaZAvJ5KyZ2";



// LCD

LiquidCrystal_I2C lcd(0x27, 16, 2);



// PIN

#define MQ_PIN 34

#define DUST_LED_PIN 14

#define DUST_PIN 33

#define RELAY_PIN 32



// STATUS

bool fanOn = false;

bool showGas = true;

bool isAutoMode = true; // Variable baru untuk mode



unsigned long lastSend = 0;

unsigned long lastLCD = 0;



// FILTER BUFFER

#define GAS_SAMPLES 50

#define DUST_SAMPLES 30



int gasBuf[GAS_SAMPLES], gasIndex = 0;

float dustBuf[DUST_SAMPLES];

int dustIndex = 0;



bool gasFilled = false, dustFilled = false;





// ===== SENSOR =====

float readDustRaw() {

  digitalWrite(DUST_LED_PIN, LOW);

  delayMicroseconds(280);

  int raw = analogRead(DUST_PIN);

  delayMicroseconds(40);

  digitalWrite(DUST_LED_PIN, HIGH);

  delayMicroseconds(9680);

  float volt = raw * (3.3 / 4095.0);

  float dust = (volt - 0.05) * 1000.0;

  return max(dust, 0.0f);

}



int readGasRaw() {

  return analogRead(MQ_PIN);

}





// ===== FILTER =====

float getDust() {

  dustBuf[dustIndex++] = readDustRaw();

  if (dustIndex >= DUST_SAMPLES) dustIndex = 0, dustFilled = true;

  float sum = 0;

  int count = dustFilled ? DUST_SAMPLES : dustIndex;

  for (int i = 0; i < count; i++) sum += dustBuf[i];

  return sum / count;

}



int getGas() {

  gasBuf[gasIndex++] = readGasRaw();

  if (gasIndex >= GAS_SAMPLES) gasIndex = 0, gasFilled = true;

  long sum = 0;

  int count = gasFilled ? GAS_SAMPLES : gasIndex;

  for (int i = 0; i < count; i++) sum += gasBuf[i];

  return sum / count;

}



// ===== FUNGSI BACA DATA DARI FIREBASE (BARU) =====

bool getFirebaseBool(String path) {

  if (WiFi.status() != WL_CONNECTED) return false;

  HTTPClient http;

  http.begin(databaseURL + path + ".json?auth=" + databaseSecret);

  int httpCode = http.GET();

  bool result = false;

  if (httpCode == 200) {

    String payload = http.getString();

    if (payload == "true") result = true;

  }

  http.end();

  return result;

}



// ===== SETUP =====

void setup() {

  Serial.begin(115200);

 

  // Wajib agar sensor tidak loncat-loncat

  analogSetAttenuation(ADC_11db);



  pinMode(DUST_LED_PIN, OUTPUT);

  pinMode(RELAY_PIN, OUTPUT);



  digitalWrite(RELAY_PIN, LOW);

  digitalWrite(DUST_LED_PIN, HIGH);



  Wire.begin(21, 22);



  lcd.init();

  lcd.backlight();

  lcd.print("Connecting WiFi");



  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {

    lcd.print(".");

    delay(400);

  }



  lcd.clear();

  lcd.print("WiFi Connected");

  delay(1000);

}





// ===== LOOP =====

void loop() {



  int gas = getGas();

  float dust = getDust();

 

  // --- LOGIKA UTAMA (CONTROL & SEND) ---

  // Dijalankan setiap 3 detik agar tidak membuat sensor lemot (karena internet butuh waktu)

  if (millis() - lastSend > 5000 && WiFi.status() == WL_CONNECTED) {



    // 1. Baca Mode dari Web (Auto / Manual)

    isAutoMode = getFirebaseBool("/fan_settings/is_auto_mode");



    // 2. Tentukan Status Kipas

    if (isAutoMode) {

      // === MODE OTOMATIS (Pakai Sensor) ===

      // if (!fanOn && (gas >= 1500 || dust >= 2000)) fanOn = true;

      // else if (fanOn && (gas < 1450 && dust < 1950)) fanOn = false;

      if (!fanOn && (gas >= 1500 || dust >= 1000)) fanOn = true;

      else if (fanOn && (gas < 1450 && dust < 950)) fanOn = false;

    } else {

      // === MODE MANUAL (Pakai Tombol Web) ===

      fanOn = getFirebaseBool("/sensor_readings/latest/fan_status");

    }



    // 3. Eksekusi ke Alat

    digitalWrite(RELAY_PIN, fanOn ? HIGH : LOW);



    // 4. Kirim Data Balik ke Firebase

    HTTPClient http;

    // Path disamakan dengan Web Dashboard Anda

    http.begin(databaseURL + "/sensor_readings/latest.json?auth=" + databaseSecret);

    http.addHeader("Content-Type", "application/json");



    // JSON Key disesuaikan: "co2" & "particulate" agar Web bisa baca

    String json = "{";

    json += "\"co2\":" + String(gas) + ",";

    json += "\"particulate\":" + String((int)dust) + ",";

    json += "\"fan_status\":" + String(fanOn ? "true" : "false");

    json += "}";



    int code = http.PUT(json);

   

    if (code > 0) Serial.printf("Mode: %s | Fan: %s | Kirim OK\n", isAutoMode ? "AUTO" : "MANUAL", fanOn ? "ON" : "OFF");

    else Serial.println("Send failed");



    http.end();

    lastSend = millis();

  }



  // LCD SWITCH

  if (millis() - lastLCD > 3000) {

    showGas = !showGas;

    lastLCD = millis();

    lcd.clear();

   

    if (showGas) {

      lcd.setCursor(0,0); lcd.print("GAS: "); lcd.print(gas);

      lcd.setCursor(0,1); lcd.print(isAutoMode ? "AUTO " : "MAN "); lcd.print(fanOn ? "ON" : "OFF");

    } else {

      lcd.setCursor(0,0); lcd.print("DUST: "); lcd.print((int)dust); lcd.print(" ug");

      lcd.setCursor(0,1);

      lcd.print(dust < 550 ? "AQI BAIK" : (dust < 900 ? "AQI SEDANG" : "AQI BURUK"));

    }

  }



  delay(50);

}