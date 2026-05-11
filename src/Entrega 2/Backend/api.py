from flask import Flask, jsonify
from flask_cors import CORS
import sqlite3

app = Flask(__name__)
CORS(app)

DB_PATH = "SQL/databasePI.db"

@app.route('/api/temperaturas', methods=['GET'])
def buscar_temperaturas():
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Adicionado 'umidade' no SELECT
        cursor.execute("SELECT horario, dispositivo, temperatura, umidade, status FROM historico_temperaturas ORDER BY id DESC LIMIT 15")
        linhas = cursor.fetchall()
        conn.close()
        
        dados_formatados = []
        for linha in linhas:
            dados_formatados.append({
                "horario": linha[0],
                "dispositivo": linha[1],
                "temperatura": linha[2],
                "umidade": linha[3], # Lendo a umidade do banco
                "status": linha[4]
            })
            
        return jsonify(dados_formatados)
    
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

if __name__ == '__main__':
    print("🌐 API FlexHealth no ar! Servindo dados na porta 5000...")
    app.run(debug=True, port=5000)