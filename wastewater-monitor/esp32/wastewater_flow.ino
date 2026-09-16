/*
 Wastewater Flow Prototype
 ESP32 + 4-20mA receiver (0-3.3V output) + Supabase REST API

 IMPORTANT:
 - Do NOT connect a 4-20mA industrial loop directly to an ESP32 ADC pin.
 - Use an isolated/appropriate 4-20mA receiver module whose output is safe for 0-3.3V ADC.
 - FLOW_MAX is initially 72 m3/h based on the current prototype assumption; verify MV110 configuration.
*/
#include <WiFi.h>
#include <HTTPClient.h>

const char* WIFI_SSID = "YOUR_WIFI";
const char* WIFI_PASSWORD = "YOUR_PASSWORD";
const char* SUPABASE_URL = "https://YOUR_PROJECT.supabase.co";
const char* SUPABASE_ANON_KEY = "YOUR_ANON_KEY";
const char* DEVICE_ID = "WWTP-FLOW-01";

const int FLOW_ADC_PIN = 34;

// Calibrate these after measuring the actual receiver-module voltage at 4 and 20 mA.
float VOLT_AT_4MA  = 0.66;
float VOLT_AT_20MA = 3.30;
float FLOW_MIN = 0.0;
float FLOW_MAX = 72.0;

unsigned long lastSend = 0;
const unsigned long SEND_INTERVAL_MS = 60000; // database: every minute

float readVoltage() {
  uint32_t mv = analogReadMilliVolts(FLOW_ADC_PIN);
  return mv / 1000.0;
}

float voltageToFlow(float v) {
  float flow = (v - VOLT_AT_4MA) * (FLOW_MAX - FLOW_MIN)
             / (VOLT_AT_20MA - VOLT_AT_4MA) + FLOW_MIN;
  if (flow < FLOW_MIN) flow = FLOW_MIN;
  if (flow > FLOW_MAX) flow = FLOW_MAX;
  return flow;
}

void connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected");
}

void sendReading(float flow, float voltage) {
  if (WiFi.status() != WL_CONNECTED) connectWiFi();

  HTTPClient http;
  String endpoint = String(SUPABASE_URL) + "/rest/v1/flow_readings";
  http.begin(endpoint);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", SUPABASE_ANON_KEY);
  http.addHeader("Authorization", String("Bearer ") + SUPABASE_ANON_KEY);
  http.addHeader("Prefer", "return=minimal");

  String json = "{\"device_id\":\"" + String(DEVICE_ID) +
                "\",\"flow_m3h\":" + String(flow, 2) +
                ",\"input_voltage\":" + String(voltage, 3) + "}";

  int code = http.POST(json);
  Serial.printf("POST %d | Flow %.2f m3/h | %.3f V\n", code, flow, voltage);
  http.end();
}

void setup() {
  Serial.begin(115200);
  analogReadResolution(12);
  analogSetPinAttenuation(FLOW_ADC_PIN, ADC_11db);
  connectWiFi();
}

void loop() {
  float voltage = readVoltage();
  float flow = voltageToFlow(voltage);

  Serial.printf("Flow %.2f m3/h | %.3f V\n", flow, voltage);

  if (millis() - lastSend >= SEND_INTERVAL_MS || lastSend == 0) {
    lastSend = millis();
    sendReading(flow, voltage);
  }
  delay(2000);
}
