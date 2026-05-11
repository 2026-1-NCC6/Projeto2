import paho.mqtt.client as mqtt
import json
import sqlite3
from datetime import datetime
import os

DB_PATH = "SQL/databasePI.db"
MQTT_BROKER = "c04818ea06b54a5d96916a6294eca5e0.s1.eu.hivemq.cloud"
MQTT_PORT = 8883
MQTT_USER = "admin"
MQTT_PASSWORD = "Teste123"
MQTT_TOPIC = "flexhealth/geladeira01/dados"

def iniciar_banco():
    os.makedirs("SQL", exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    # Tabela atualizada com UMIDADE
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS historico_temperaturas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            horario DATETIME,
            dispositivo TEXT,
            temperatura REAL,
            umidade REAL,
            status TEXT
        )
    ''')
    conn.commit()
    conn.close()
    print(f"🗄️  Banco de Dados verificado no caminho: {DB_PATH}")

def salvar_no_banco(dispositivo, temperatura, umidade, status):
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        horario_atual = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        cursor.execute('''
            INSERT INTO historico_temperaturas (horario, dispositivo, temperatura, umidade, status)
            VALUES (?, ?, ?, ?, ?)
        ''', (horario_atual, dispositivo, temperatura, umidade, status))
        
        conn.commit()
        conn.close()
        print(f"💾 Dado salvo! Temp: {temperatura}°C | Umi: {umidade}%")
    except Exception as e:
        print(f"❌ Erro ao salvar no banco: {e}")

def on_connect(client, userdata, flags, reason_code, properties):
    if reason_code == 0:
        print("✅ Conectado ao HiveMQ!")
        client.subscribe(MQTT_TOPIC)
    else:
        print(f"❌ Falha na conexão: {reason_code}")

def on_message(client, userdata, msg):
    try:
        payload_str = msg.payload.decode("utf-8")
        dados = json.loads(payload_str)
        
        dispositivo = dados.get("dispositivo")
        temperatura = dados.get("temperatura")
        umidade = dados.get("umidade", 0.0) # Pegando a umidade do JSON
        status = dados.get("status")
        
        salvar_no_banco(dispositivo, temperatura, umidade, status)
            
    except Exception as e:
        print(f"⚠️ Erro ao processar mensagem: {e}")

iniciar_banco()

client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id="Python-Backend-FlexHealth")
client.on_connect = on_connect
client.on_message = on_message
client.tls_set() 
client.username_pw_set(MQTT_USER, MQTT_PASSWORD)

print("🚀 Iniciando Coletor FlexHealth...")
client.connect(MQTT_BROKER, MQTT_PORT, 60)
client.loop_forever()