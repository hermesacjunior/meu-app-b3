# 📊 Stock Analysis Dashboard - B3

Dashboard profissional para análise de ações brasileiras da B3 em tempo real com técnicas avançadas de trading.

## 🎯 Características Principais

### 1. **Três Estratégias de Trading Independentes**

#### 🔴 **Day Trade** (Intraday - Minutos)
- **Horizonte**: Mesmo dia (minutos)
- **Indicadores**: EMA9, EMA21, RSI, Bandas de Bollinger, Volume
- **Sinais**:
  - **COMPRA**: Cruzamento bullish EMA9 > EMA21 + RSI < 70 + Volume alto
  - **VENDA**: Cruzamento bearish EMA9 < EMA21 + RSI > 70 + Preço no topo
- **Metas**:
  - Take Profit: +2% (lucro rápido)
  - Stop Loss: -2% (proteção agressiva)

#### 🟡 **Swing Trade** (Médio Prazo - 3-20 dias)
- **Horizonte**: 3 a 20 dias
- **Indicadores**: EMA21, EMA50, RSI, Bandas de Bollinger, Volume, SMA200
- **Sinais**:
  - **COMPRA**: Acima EMA21 + RSI sobrevendido (< 40) + Preço em suporte
  - **VENDA**: RSI sobrecomprado (> 70) + Preço no topo + Rompimento para baixo
- **Metas**:
  - Take Profit: +5% (crescimento moderado)
  - Stop Loss: -3% (proteção moderada)

#### 🟢 **Hold** (Longo Prazo - 6+ meses)
- **Horizonte**: 6+ meses (acumulação)
- **Indicadores**: SMA200, EMA21, EMA50, RSI, ROE, P/L, Dividend Yield
- **Sinais**:
  - **COMPRA**: Preço < SMA200 × 1.15 + Tendência consolidada + Fundamentos sólidos
  - **VENDA**: Sobrevalorização + Tendência estruturalmente quebrada
- **Metas**:
  - Alvo 12 meses: +15% (apreciação a longo prazo)
  - Stop Loss: Abaixo suporte SMA200 × 0.95

---

## 📈 Indicadores Técnicos Implementados

### **Médias Móveis**
- **EMA9**: Reação rápida a movimentos (curto prazo)
- **EMA21**: Tendência de médio prazo
- **EMA50**: Confirmação de tendência
- **SMA200**: Tendência de longo prazo (grande suporte/resistência)

### **Momentum**
- **RSI (14 períodos)**: Detecta sobrecompra (>70) e sobrevenda (<30)
- **MACD**: Confirmação de mudança de tendência
- **Rate of Change (ROC)**: Velocidade de movimento

### **Volatilidade**
- **Bandas de Bollinger (20 períodos, 2σ)**:
  - Zona de suporte (Lower Band)
  - Zona de resistência (Upper Band)
  - Zona de equilíbrio (Middle Band)
- **ATR (14 períodos)**: Amplitude de volatilidade

### **Volume**
- **Volume Médio (20 períodos)**: Confirmação de movimento
- **Alto volume** = movimento confirmado
- **Baixo volume** = movimento fraco

---

## 💰 Como Usar

### **1. Selecione uma Ação**
```
Clique no seletor e escolha uma ação da B3
Exemplo: PETR4.SA, VALE3.SA, ITUB4.SA, ABEV3.SA, etc.
```

### **2. Escolha a Estratégia**
```
- Day Trade: Para operações intraday com rápido lucro
- Swing Trade: Para operações de 3-20 dias
- Hold: Para acumulação de longo prazo (6+ meses)
```

### **3. Analise o Sinal**
```
O app fornece:
- Recomendação: COMPRA 🟢 | VENDA 🔴 | AGUARDAR 🟡
- Confiança: % de certeza da análise
- Preço de entrada recomendado
- Alvo de lucro (Take Profit)
- Nível de proteção (Stop Loss)
```

### **4. Execute a Operação**
```
Defina:
- Quantidade de ações
- Preço de entrada
- Take Profit
- Stop Loss

Clique em "EXECUTAR COMPRA" para registrar a operação
```

### **5. Monitor sua Carteira**
```
Na seção "Minha Carteira":
- Veja todas as posições abertas
- Acompanhe P&L em tempo real
- Feche posições quando necessário
```

---

## 📊 Interpretação das Análises

### **COMPRA 🟢** (Confiança: 60-100%)
Significa que múltiplos indicadores estão alinhados para uma entrada:

**Day Trade**:
- EMA9 cruzou acima de EMA21
- RSI não está sobrecomprado
- Volume está acima da média
- Preço está acima das bandas de Bollinger (momentum)

**Swing Trade**:
- Preço está em tendência de alta (> EMA21)
- RSI está sobrevendido (< 40) = oportunidade
- Preço está se recuperando para cima

**Hold**:
- Preço próximo da média de 200 dias
- Tendência estrutural é de alta
- Fundamentos são sólidos

**Ação recomendada**: Comprar e definir TP e SL

### **VENDA 🔴** (Confiança: 60-100%)
Significa que o ativo está em risco ou em reversão:

**Day Trade**:
- EMA9 cruzou abaixo de EMA21
- RSI está acima de 70 (sobrecomprado)
- Preço no topo das Bandas de Bollinger

**Swing Trade**:
- Rompimento para baixo da EMA21
- RSI em zona extrema de compra (>70)
- Volume decrescente

**Hold**:
- Sobrevalorização significativa
- Tendência estrutural quebrou
- Risco sistêmico aumentou

**Ação recomendada**: Vender/Realizar lucro ou proteger patrimônio

### **AGUARDAR 🟡** (Confiança: 50%)
Significa que os sinais estão mistos ou inconclusivos:

**Ação recomendada**: Aguarde confirmação adicional, não abra posição ainda

---

## 🎯 Exemplo Prático: PETR4.SA

### **Análise Day Trade**
```
Preço Atual: R$ 28.50
Sinal: COMPRA 🟢 (75% confiança)

Indicadores:
- EMA9: 28.20 > EMA21: 27.80 ✓ (Alta)
- RSI: 62 (não sobrecomprado) ✓
- Preço vs BB: Meio (espaço para subir) ✓
- Volume: Alto (movimento confirmado) ✓

Recomendação:
- Entrada: R$ 28.50
- Take Profit: R$ 29.07 (+2%)
- Stop Loss: R$ 27.93 (-2%)
- Quantidade: 100 ações = R$ 2.850,00

Explicação: A ação está em tendência de alta com força crescente.
A EMA9 cruzou acima da EMA21 ontem, confirmando aumento de momentum.
O RSI em 62 indica força mas sem sobrecompra. Risco/retorno favorável.
```

### **Análise Swing Trade**
```
Preço Atual: R$ 28.50
Sinal: AGUARDAR 🟡 (55% confiança)

Indicadores:
- Preço > EMA21: Sim ✓
- RSI: 62 (não sobrevendido) ✗
- Preço em suporte: Não (no meio da faixa)
- SMA200: 26.80 (Preço > SMA200) ✓

Recomendação:
Aguarde RSI cair abaixo de 40 para melhor entrada
ou confirmação de nova mínima acima do suporte anterior
```

### **Análise Hold**
```
Preço Atual: R$ 28.50
Sinal: COMPRA 🟢 (80% confiança)

Fundamentos:
- P/L: 8x (bom)
- Div Yield: 3.2% (acima da média)
- ROE: 18% (excelente)
- SMA200: 26.80 (Preço 6% acima - bom valor)

Recomendação:
- Entrada: R$ 28.50
- Alvo 12 meses: R$ 32.78 (+15%)
- Stop Loss: R$ 25.46 (Suporte SMA200)
- Quantidade: 500 ações (investimento maior)

Explicação: Empresa com excelentes fundamentos. Dividend yield
acima da média. Preço em nível confortável para acumulação.
Potencial de 15%+ em 12 meses. Ideal para investidores de longo prazo.
```

---

## 📋 Lista Completa de Ações B3 Disponíveis

### **Financeiro**
- ITUB4.SA (Itaú)
- BBDC4.SA (Bradesco)
- BBAS3.SA (Banco do Brasil)
- INTER4.SA (Inter)

### **Commodities**
- PETR4.SA (Petrobras)
- VALE3.SA (Vale)
- GGBR4.SA (Gerdau)
- CSNA3.SA (CSN)
- USIM5.SA (Usiminas)

### **Varejo**
- MGLU3.SA (Magazine Luiza)
- PETZ3.SA (Petzer)
- VVAR3.SA (Viavarejo)
- LREN3.SA (Lojas Renner)

### **Infraestrutura**
- WEGE3.SA (WEG)
- RENT3.SA (Localiza)
- CCRO3.SA (CCR)
- TAEE11.SA (Taesa)
- TRPL4.SA (Triplan)

### **Utilidades**
- SBSP3.SA (Sabesp)
- SAPR11.SA (Sapucaia)

### **Telecomunicações**
- VIVT3.SA (Vivo)
- TELE3.SA (Telefonica)

### **Energia**
- ENEM6.SA (Eletronorte)
- ENGI11.SA (Engie)

### **Alimentos**
- ABEV3.SA (Ambev)
- JBSS3.SA (JBS)
- MARFM3.SA (Marfrig)

### **Índices**
- B3SA3.SA (B3)
- PRIO3.SA (Prio)

---

## 🚀 Instalação e Execução

### **Pré-requisitos**
```bash
Python 3.9+
pip install -r requirements.txt
```

### **Dependências**
```
streamlit>=1.30
yfinance>=0.2.30
pandas>=2.0
plotly>=5.20
numpy>=1.26
```

### **Executar o App**
```bash
streamlit run app.py
```

O app abrirá em `http://localhost:8501`

---

## 💡 Dicas de Trading

### **Day Trade**
1. Comece com ações muito líquidas (PETR4, VALE3, ITUB4)
2. Não tenha medo de passar operação se o sinal não está claro
3. Lucre com 2% e proteja com Stop Loss de 2%
4. Máximo 3-5 operações por dia
5. Sempre acompanhe notícias econômicas

### **Swing Trade**
1. Escolha ações com bom volume (>10 milhões/dia)
2. Respeite os níveis de suporte e resistência
3. Use as quedas para comprar (compre na fraqueza)
4. Deixe o lucro correr enquanto a tendência é positiva
5. Mantenha o stop loss 3% abaixo da entrada

### **Hold**
1. Escolha empresas com crescimento consistente
2. Monitore os dividendos (buy the dip para aumentar yield)
3. Não se preocupe com variações diárias
4. Rebalanceie a carteira anualmente
5. Invista em setores que você entende

### **Gestão de Risco**
1. **Nunca** arrisque mais de 2% do patrimônio por operação
2. **Sempre** coloque Stop Loss
3. **Não** siga emoções, siga o plano
4. **Diversifique** em múltiplos ativos
5. **Acompanhe** suas operações (P&L)

---

## 📞 Suporte

Para problemas ou dúvidas:
1. Verifique se você tem internet estável
2. Atualize as dependências: `pip install -r requirements.txt --upgrade`
3. Reinicie o app: `streamlit run app.py`
4. Verifique os dados Yahoo Finance (yfinance)

---

## ⚠️ Disclaimer

**Este app é para fins educacionais e de análise técnica apenas.**

- Não é garantia de lucro
- Mercado de ações tem risco
- Passado não garante futuro
- Sempre faça sua própria pesquisa
- Consulte um consultor financeiro profissional
- Use capital que você pode perder

---

**Desenvolvido com ❤️ para traders brasileiros**
