
# FECAP - Fundação de Comércio Álvares Penteado

<p align="center">
<a href="https://www.fecap.br/"><img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRhZPrRa89Kma0ZZogxm0pi-tCn_TLKeHGVxywp-LXAFGR3B1DPouAJYHgKZGV0XTEf4AE&usqp=CAU" alt="FECAP" border="0"></a>
</p>

# **FlexHealth**

<p align="center">
<img src="/imagens/FlexHealth.png" width="620">
</p>

## Grupo 2

### Integrantes:
- **Ettore Grecco** — 23025294
- **Luis Sparrapan** — 23025521
- **Rafaella Morelli** — 23024902
- **Rodrigo Gama** — 23025472

### Professores Orientadores:
Victor Bruno Alexander Rosetti de Queiroz,  
Edson Ricardo Barbeiro,  
Lucy Mari Tabuti,  
Rodnil da Silva Moreira Lisboa,  
João Francisco Trencher Martins.

---

## 🎯 Descrição
<p align="center">
<img src="/imagens/flexhealthDashboard.jpeg" width="720">
</p>
 A FlexHealth é uma solução IoT desenvolvida para o monitoramento contínuo e automatizado da cadeia de frio de vacinas e medicamentos de alto custo, garantindo compliance e evitando o descarte de lotes por excursão térmica.

---

## 🛠 Estrutura de pastas

-Raiz<br>
|<br>
|-->documentos<br>
  &emsp;|-->Entrega 1<br>
    &emsp;|-->Inovação e Empreendedorismo<br>
    &emsp;|-->Sistemas Embarcados e Robótica<br>
    &emsp;|-->Projeto Interdisciplinar | Internet das coisas e Robótica<br>
    &emsp;|-->Teoria da Computação e Linguagens Formais<br>
    &emsp;|-->Redes de Computadores e Cibersegurança<br>
  &emsp;|-->Entrega 2<br>
    &emsp;|-->Inovação e Empreendedorismo<br>
    &emsp;|--Sistemas Embarcados e Robótica<br>
    &emsp;|-->Projeto Interdisciplinar | Internet das coisas e Robótica<br>
    &emsp;|-->Teoria da Computação e Linguagens Formais<br>
    &emsp;|-->Redes de Computadores e Cibersegurança<br>
  &emsp;|readme.md<br>
|-->src/smart_feeders<br>
  &emsp;|-->windows<br>
  &emsp;|-->android<br>
  &emsp;|-->HTML<br>
|-->imagens<br>
|-->src<br>
|.gitignore<br>
|readme.md<br>

---

# Estrutura do Projeto
<p align="center">
<img src="/imagens/EstruturaDoProjeto.png" width="720">
</p>

## 🛠 Estrutura de pastas

# ▶️ Como Executar o Projeto

Siga os passos abaixo para iniciar corretamente todos os componentes do sistema.

---

## 1️⃣ Ligar o Receptor MQTT

Este script é responsável por ouvir o broker HiveMQ e salvar as temperaturas no banco de dados SQLite.

### Abra o primeiro terminal no VS Code

Entre na pasta do backend:

```powershell
cd "src\Entrega 2\Backend"
```

Execute o arquivo Python:

```powershell
python backend.py
```

### ✅ Sinal de sucesso

O terminal permanecerá em execução, indicando que o sistema conectou ao broker MQTT e está aguardando mensagens.

---

## 2️⃣ Ligar a API REST

Este servidor Flask é responsável por buscar os dados no banco e entregá-los ao frontend.

### Abra um segundo terminal
> Deixe o primeiro terminal rodando em segundo plano.

Entre novamente na pasta do backend:

```powershell
cd "src\Entrega 2\Backend"
```

Execute a API:

```powershell
python api.py
```

### ✅ Sinal de sucesso

Aparecerá uma mensagem semelhante a:

```powershell
Running on http://127.0.0.1:5000
```

---

## 3️⃣ Ligar o Site Web

Agora vamos iniciar a interface React responsável pela visualização dos dados.

### Abra um terceiro terminal

Entre na pasta do frontend:

```powershell
cd "src\Entrega 2\Frontend\Site"
```

Inicie o servidor web:

```powershell
npm run dev
```

### ✅ Sinal de sucesso

O terminal exibirá um link semelhante a:

```powershell
http://localhost:5173
```

Segure a tecla `Ctrl` e clique no link para abrir o dashboard no navegador.

---

# ✅ Ordem Recomendada de Inicialização

1. `backend.py`
2. `api.py`
3. `npm run dev`

## 📋 Licença/License
Este projeto está licenciado sob a licença CC BY 4.0.
Você pode criar a sua própria licença Creative Commons em: https://chooser-beta.creativecommons.org/

## 🎓 Referências

Aqui estão as referências usadas no projeto:
