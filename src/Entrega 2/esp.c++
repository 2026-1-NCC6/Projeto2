#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

// Configurações do DHT11
#define DHTPIN 13
#define DHTTYPE DHT11 
DHT dht(DHTPIN, DHTTYPE);

// Configurações do OLED
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_SDA 4
#define OLED_SCL 15
#define OLED_RST 16 
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RST);

// Configurações Wi-Fi e MQTT
const char* ssid          = "Gama";
const char* password      = "fecapppp";
const char* mqtt_server   = "c04818ea06b54a5d96916a6294eca5e0.s1.eu.hivemq.cloud"; 
const int   mqtt_port     = 8883;                                              
const char* mqtt_user     = "admin";                                    
const char* mqtt_password = "Teste123";                                    
const char* mqtt_topic    = "flexhealth/geladeira01/dados";

WiFiClientSecure espClient;   
PubSubClient client(espClient);

unsigned long lastMsg = 0;

// Atualizado para receber e mostrar a umidade no OLED
void updateOLED(float temp, float umid, String status, bool mqttConn) {
  display.clearDisplay();
  display.setCursor(0,0);
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  
  display.println("FLEXHEALTH MONITOR");
  display.drawFastHLine(0, 10, 128, SSD1306_WHITE);
  
  display.setCursor(0, 15);
  display.printf("Temp: %.1f C", temp);
  
  // Nova linha para mostrar a umidade
  display.setCursor(0, 25);
  display.printf("Umid: %.1f %%", umid);
  
  display.setCursor(0, 40);
  display.print("Status: ");
  display.println(status);

  display.setCursor(0, 55);
  display.print("MQTT: ");
  display.println(mqttConn ? "CONECTADO" : "ERRO");
  
  display.display();
}

void setup_wifi() {
  delay(10);
  Serial.println("\nConectando a " + String(ssid));

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi conectado! IP: " + WiFi.localIP().toString());
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Tentando conexao MQTT...");
    String clientId = "ESP32Client-FlexHealth-";
    clientId += String(random(0xffff), HEX);

    if (client.connect(clientId.c_str(), mqtt_user, mqtt_password)) {
      Serial.println("Conectado ao HiveMQ Cloud!");
    } else {
      Serial.print("Falhou, rc=");
      Serial.print(client.state());
      Serial.println(" Tentando novamente em 5 segundos...");
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(115200);

  // Inicializa OLED
  Wire.begin(OLED_SDA, OLED_SCL);
  if(!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) { 
    Serial.println(F("Falha no OLED"));
  }
  display.clearDisplay();
  display.display();

  dht.begin();
  setup_wifi();

  espClient.setInsecure(); 
  client.setServer(mqtt_server, mqtt_port); 

  delay(1500);
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  unsigned long now = millis();
  if (now - lastMsg > 2000) {
    lastMsg = now;

    // Lendo a temperatura e AGORA A UMIDADE
    float temperature = dht.readTemperature();
    float humidity = dht.readHumidity(); 
    
    String statusAtual = "NORMAL";

    // Verifica se os dois valores estão corretos (não são NaN)
    if (!isnan(temperature) && !isnan(humidity)) {
      if (temperature < 2.0 || temperature > 8.0) {
        statusAtual = "ALERTA";
      }

      // Payload JSON atualizado com a chave "umidade"
      String payload = "{";
      payload += "\"dispositivo\":\"geladeira_01\",";
      payload += "\"temperatura\":" + String(temperature, 1) + ",";
      payload += "\"umidade\":" + String(humidity, 1) + ","; 
      payload += "\"status\":\"" + statusAtual + "\"";
      payload += "}";

      Serial.print("Enviando MQTT: ");
      Serial.println(payload);
      client.publish(mqtt_topic, payload.c_str());
      
      // Manda os dados atualizados para a telinha
      updateOLED(temperature, humidity, statusAtual, client.connected());

    } else {
      Serial.println("FALHA: Erro na leitura do sensor DHT11"); 
      updateOLED(0.0, 0.0, "ERRO SENSOR", client.connected());
    }
  }
}