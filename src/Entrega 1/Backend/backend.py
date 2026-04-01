import paho.mqtt.client as mqtt
import json
import ssl
from datetime import datetime

# ==========================================
# 1. Configurações MQTT (HiveMQ Cloud)
# ==========================================
MQTT_BROKER = "c04818ea06b54a5d96916a6294eca5e0.s1.eu.hivemq.cloud"
MQTT_PORT = 8883
MQTT_USER = "admin"
MQTT_PASSWORD = "Teste123"
MQTT_TOPIC = "flexhealth/geladeira01/dados"

# ==========================================
# 2. Funções de Callback do MQTT
# ==========================================
def on_connect(client, userdata, flags, rc):
    """Executada quando o Python consegue logar no HiveMQ"""
    if rc == 0:
        print("✅ Conectado ao HiveMQ Cloud com sucesso!")
        client.subscribe(MQTT_TOPIC)
        print(f"📡 Inscrito e escutando o tópico: {MQTT_TOPIC}")
        print("⏳ Aguardando envio de dados do simulador Wokwi...\n")
        print("=" * 50)
    else:
        print(f"❌ Falha na conexão MQTT. Código de retorno: {rc}")

def on_message(client, userdata, msg):
    """Executada toda vez que o ESP32 publica um pacote no tópico"""
    payload = msg.payload.decode('utf-8')
    agora = datetime.now().strftime('%d/%m/%Y %H:%M:%S')
    
    print(f"[{agora}] 📩 NOVO PACOTE RECEBIDO:")
    print(f"   ➔ Dados Brutos: {payload}")
    
    # Tenta ler o JSON para mostrar formatado
    try:
        dados = json.loads(payload)
        print(f"   ➔ 🌡️  Temperatura: {dados.get('temperatura')} °C")
        
        status = dados.get('status')
        if status == "ALERTA":
            print(f"   ➔ 🚨 Status: {status} (CRÍTICO!)")
        else:
            print(f"   ➔ ✅ Status: {status}")
            
    except json.JSONDecodeError:
        print("   ❌ Erro: O pacote recebido não é um formato JSON válido.")
        
    print("-" * 50)

# ==========================================
# 3. Inicialização do Motor Backend
# ==========================================
# Tratamento de compatibilidade para versões novas e antigas da biblioteca paho-mqtt
try:
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION1, client_id="PythonBackend-FlexHealth-01")
except AttributeError:
    client = mqtt.Client(client_id="PythonBackend-FlexHealth-01")

client.username_pw_set(MQTT_USER, MQTT_PASSWORD)
client.tls_set(tls_version=ssl.PROTOCOL_TLS)

client.on_connect = on_connect
client.on_message = on_message

print("Iniciando Motor Backend FlexHealth (Modo Teste de Console)...")
client.connect(MQTT_BROKER, MQTT_PORT, 60)

try:
    # Trava o script num loop infinito para ficar sempre escutando a nuvem
    client.loop_forever()
except KeyboardInterrupt:
    print("\n🛑 Backend encerrado com segurança pelo usuário.")