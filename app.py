import streamlit as st
import yfinance as yf
import pandas as pd
import plotly.graph_objects as go
from plotly.subplots import make_subplots
from datetime import datetime, timedelta
import numpy as np

# --- CONFIGURAÇÃO DA PÁGINA ---
st.set_page_config(page_title="Stock Analysis Dashboard - B3", layout="wide", initial_sidebar_state="expanded")

# CSS para visual minimalista e moderno
st.markdown("""
    <style>
    :root {
        --primary: #00ff88;
        --danger: #ff3366;
        --warning: #ffaa00;
        --info: #00ccff;
        --dark: #0e1117;
        --darker: #010409;
    }

    * {
        color-scheme: dark;
    }

    .main {
        background: linear-gradient(135deg, #0e1117 0%, #1c2128 100%);
        color: #e6edf3;
    }

    .stMetric {
        background: rgba(30, 30, 40, 0.8);
        border: 1px solid rgba(0, 255, 136, 0.2);
        padding: 20px;
        border-radius: 12px;
        backdrop-filter: blur(10px);
    }

    div.stButton > button {
        background: linear-gradient(90deg, #00ff88 0%, #00dd77 100%);
        color: #000;
        border: none;
        font-weight: bold;
        border-radius: 8px;
        transition: all 0.3s ease;
    }

    div.stButton > button:hover {
        background: linear-gradient(90deg, #00dd77 0%, #00aa66 100%);
        box-shadow: 0 0 20px rgba(0, 255, 136, 0.5);
    }

    .stSelectbox, .stNumberInput, .stRadio {
        background-color: rgba(30, 30, 40, 0.6) !important;
    }

    .card-analysis {
        background: rgba(20, 20, 30, 0.9);
        border: 2px solid rgba(0, 255, 136, 0.3);
        padding: 20px;
        border-radius: 12px;
        margin: 10px 0;
        backdrop-filter: blur(10px);
    }

    .signal-buy {
        color: #00ff88;
        font-weight: bold;
    }

    .signal-sell {
        color: #ff3366;
        font-weight: bold;
    }

    .signal-wait {
        color: #ffaa00;
        font-weight: bold;
    }
    </style>
    """, unsafe_allow_html=True)

# --- FUNÇÕES DE INDICADORES TÉCNICOS ---

def ema(data, period):
    """Calcula Média Móvel Exponencial"""
    return data.ewm(span=period, adjust=False).mean()

def rsi(data, period=14):
    """Calcula Índice de Força Relativa (RSI)"""
    delta = data.diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
    rs = gain / loss
    return 100 - (100 / (1 + rs))

def macd(data, fast=12, slow=26, signal=9):
    """Calcula MACD"""
    ema_fast = ema(data, fast)
    ema_slow = ema(data, slow)
    macd_line = ema_fast - ema_slow
    signal_line = ema(macd_line, signal)
    return macd_line, signal_line, macd_line - signal_line

def bollinger_bands(data, period=20, num_std=2):
    """Calcula Bandas de Bollinger"""
    sma = data.rolling(window=period).mean()
    std = data.rolling(window=period).std()
    upper = sma + (std * num_std)
    lower = sma - (std * num_std)
    return upper, sma, lower

def atr(high, low, close, period=14):
    """Calcula Average True Range (ATR)"""
    tr1 = high - low
    tr2 = abs(high - close.shift())
    tr3 = abs(low - close.shift())
    tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
    return tr.rolling(window=period).mean()

def roc(data, period=10):
    """Calcula Rate of Change (ROC)"""
    return ((data - data.shift(period)) / data.shift(period)) * 100

# --- LISTA COMPLETA DE AÇÕES B3 ---
LISTA_B3 = {
    "Financeiro": ["ITUB4.SA", "BBDC4.SA", "BBAS3.SA", "BRADESCO", "SANTANDER", "INTER4.SA"],
    "Commodities": ["PETR4.SA", "VALE3.SA", "GGBR4.SA", "CSNA3.SA", "USIM5.SA"],
    "Varejo": ["MGLU3.SA", "PETZ3.SA", "VVAR3.SA", "LREN3.SA"],
    "Infraestrutura": ["WEGE3.SA", "RENT3.SA", "CCRO3.SA", "TAEE11.SA", "TRPL4.SA"],
    "Utilidades": ["SBSP3.SA", "SAPR11.SA"],
    "Telecomunicações": ["VIVT3.SA", "TELE3.SA"],
    "Índices": ["B3SA3.SA", "PRIO3.SA"],
    "Energia": ["ENEM6.SA", "ENGI11.SA"],
    "Alimentos": ["ABEV3.SA", "JBSS3.SA", "MARFM3.SA"],
}

# Flatten para lista simples
LISTA_FLAT = []
for categoria, acoes in LISTA_B3.items():
    LISTA_FLAT.extend(acoes)
LISTA_FLAT = sorted(list(set(LISTA_FLAT)))

# --- INICIALIZAÇÃO DE ESTADOS ---
if 'carteira' not in st.session_state:
    st.session_state.carteira = []
if 'saldo' not in st.session_state:
    st.session_state.saldo = 100000.0
if 'historico_operacoes' not in st.session_state:
    st.session_state.historico_operacoes = []

# --- FUNÇÕES DE ANÁLISE TÉCNICA ---

def calcular_indicadores(df):
    """Calcula todos os indicadores técnicos"""
    df = df.copy()

    # Médias móveis
    df['EMA9'] = ema(df['Close'], 9)
    df['EMA21'] = ema(df['Close'], 21)
    df['EMA50'] = ema(df['Close'], 50)
    df['SMA200'] = df['Close'].rolling(window=200).mean()

    # Momentum
    df['RSI'] = rsi(df['Close'], 14)
    macd_line, signal_line, histogram = macd(df['Close'], 12, 26, 9)
    df['MACD'] = macd_line
    df['MACD_Signal'] = signal_line
    df['MACD_Hist'] = histogram

    # Bandas de Bollinger
    bb_upper, bb_mid, bb_lower = bollinger_bands(df['Close'], 20, 2)
    df['BB_Upper'] = bb_upper
    df['BB_Mid'] = bb_mid
    df['BB_Lower'] = bb_lower

    # Volume
    df['Volume_MA'] = df['Volume'].rolling(window=20).mean()

    # ATR para volatilidade
    df['ATR'] = atr(df['High'], df['Low'], df['Close'], 14)

    # Taxa de variação
    df['ROC'] = roc(df['Close'], 10)

    return df

def analisar_day_trade(df):
    """Análise especializada para Day Trade - horários e sinais intraday"""
    df = calcular_indicadores(df)

    last = df.iloc[-1]
    prev = df.iloc[-2]
    prev2 = df.iloc[-3]

    sinais = {
        'acao': 'AGUARDAR',
        'confianca': 0,
        'motivos': [],
        'entrada': None,
        'saida': None,
        'indicadores': {}
    }

    # Indicadores para análise
    sinais['indicadores'] = {
        'RSI': round(last['RSI'], 2),
        'EMA9 vs EMA21': 'ALTA' if last['EMA9'] > last['EMA21'] else 'BAIXA',
        'Preço vs BB': 'Topo' if last['Close'] > last['BB_Upper'] else ('Fundo' if last['Close'] < last['BB_Lower'] else 'Meio'),
        'Volume': 'Alto' if last['Volume'] > last['Volume_MA'] else 'Normal'
    }

    # Sinal de COMPRA Day Trade
    compra_score = 0

    # Cruzamento de EMAs (bullish)
    if last['EMA9'] > last['EMA21'] and prev['EMA9'] <= prev['EMA21']:
        compra_score += 2
        sinais['motivos'].append("✓ Cruzamento de EMAs (9 > 21) - Sinal de alta")

    # RSI em zona neutra ou baixa (não sobrecomprado)
    if last['RSI'] < 70:
        compra_score += 1
        sinais['motivos'].append(f"✓ RSI em {last['RSI']:.0f} - Não sobrecomprado")

    # Preço acima do BB Mid e da EMA21
    if last['Close'] > last['BB_Mid'] and last['Close'] > last['EMA21']:
        compra_score += 1
        sinais['motivos'].append("✓ Preço acima das médias - Tendência positiva")

    # Volume alto
    if last['Volume'] > last['Volume_MA'] * 1.2:
        compra_score += 1
        sinais['motivos'].append("✓ Volume alto - Confirmação de movimento")

    # Sinal de VENDA Day Trade
    venda_score = 0

    # Cruzamento de EMAs (bearish)
    if last['EMA9'] < last['EMA21'] and prev['EMA9'] >= prev['EMA21']:
        venda_score += 2
        sinais['motivos'].append("✗ Cruzamento de EMAs (9 < 21) - Sinal de baixa")

    # RSI em zona de venda
    if last['RSI'] > 70:
        venda_score += 2
        sinais['motivos'].append(f"✗ RSI em {last['RSI']:.0f} - Sobrecomprado")

    # Preço no topo das Bandas de Bollinger
    if last['Close'] > last['BB_Upper']:
        venda_score += 1
        sinais['motivos'].append("✗ Preço no topo das Bandas - Risco de queda")

    # Determinação final
    if compra_score >= 3:
        sinais['acao'] = '🟢 COMPRA'
        sinais['confianca'] = min(compra_score / 5 * 100, 100)
        sinais['entrada'] = round(last['Close'], 2)
        sinais['saida'] = round(last['Close'] * 1.02, 2)  # 2% de lucro
        sinais['stop_loss'] = round(last['Close'] * 0.98, 2)  # 2% de perda
    elif venda_score >= 2:
        sinais['acao'] = '🔴 VENDA'
        sinais['confianca'] = min(venda_score / 3 * 100, 100)
    else:
        sinais['acao'] = '🟡 AGUARDAR'
        sinais['confianca'] = 50
        sinais['motivos'].append("Sinais mistos - Aguarde melhor confirmação")

    return sinais

def analisar_swing_trade(df):
    """Análise para Swing Trade - tendências de 3-20 dias"""
    df = calcular_indicadores(df)

    last = df.iloc[-1]
    prev = df.iloc[-2]

    sinais = {
        'acao': 'AGUARDAR',
        'confianca': 0,
        'motivos': [],
        'horizonte': '3-20 dias',
        'indicadores': {}
    }

    sinais['indicadores'] = {
        'RSI': round(last['RSI'], 2),
        'Tendência EMA': 'ALTA' if last['Close'] > last['EMA21'] else 'BAIXA',
        'BB Position': f"{round((last['Close'] - last['BB_Lower']) / (last['BB_Upper'] - last['BB_Lower']) * 100, 0):.0f}%",
        'Tendência 50 dias': 'ALTA' if last['Close'] > last['EMA50'] else 'BAIXA'
    }

    # COMPRA Swing Trade
    compra_score = 0

    # Preço acima da EMA21 + RSI baixo = Oportunidade
    if last['Close'] > last['EMA21'] and last['RSI'] < 40:
        compra_score += 2
        sinais['motivos'].append("✓ Ativo em tendência de alta mas sobrevendido - Oportunidade")

    # Cruzamento da EMA9 > EMA21 (recente)
    if last['EMA9'] > last['EMA21']:
        compra_score += 1
        sinais['motivos'].append("✓ Tendência de alta confirmada (EMA9 > EMA21)")

    # Preço próximo ao BB Mid (zona suporte)
    if last['Close'] > last['BB_Lower'] and last['Close'] < last['BB_Mid']:
        compra_score += 1
        sinais['motivos'].append("✓ Preço em zona de suporte - Bom ponto de entrada")

    # Preço acima da SMA200 (tendência de longo prazo)
    if last['Close'] > last['SMA200']:
        compra_score += 1
        sinais['motivos'].append("✓ Acima da média de 200 dias - Mercado otimista")

    # VENDA Swing Trade
    venda_score = 0

    # RSI muito alto + preço no topo
    if last['RSI'] > 70 and last['Close'] > last['BB_Upper']:
        venda_score += 2
        sinais['motivos'].append("✗ Ativo muito esticado - Alto risco de correção")

    # Preço caindo abaixo da EMA21
    if last['Close'] < last['EMA21'] and prev['Close'] > prev['EMA21']:
        venda_score += 2
        sinais['motivos'].append("✗ Rompimento para baixo da EMA21 - Tendência reversão")

    # Volume decrescente
    if last['Volume'] < last['Volume_MA']:
        venda_score += 1
        sinais['motivos'].append("✗ Volume decrescente - Confirmação fraca de movimento")

    # Determinação final
    if compra_score >= 3:
        sinais['acao'] = '🟢 COMPRA'
        sinais['confianca'] = min(compra_score / 5 * 100, 100)
        sinais['entrada'] = round(last['Close'], 2)
        sinais['saida'] = round(last['Close'] * 1.05, 2)  # 5% de lucro esperado
        sinais['stop_loss'] = round(last['Close'] * 0.97, 2)
    elif venda_score >= 2:
        sinais['acao'] = '🔴 VENDA'
        sinais['confianca'] = min(venda_score / 3 * 100, 100)
    else:
        sinais['acao'] = '🟡 AGUARDAR'
        sinais['confianca'] = 50
        if compra_score > 0:
            sinais['motivos'].append("Alguns sinais de compra presentes - Aguarde confirmação")
        else:
            sinais['motivos'].append("Sem sinais claros - Aguarde desenvolvimentos")

    return sinais

def analisar_hold(df, ticker):
    """Análise para HOLD - acumulação de longo prazo"""
    df = calcular_indicadores(df)

    last = df.iloc[-1]

    sinais = {
        'acao': 'AGUARDAR',
        'confianca': 0,
        'motivos': [],
        'horizonte': '+6 meses',
        'metricas': {}
    }

    try:
        # Buscar dados fundamentalistas
        ticker_obj = yf.Ticker(ticker)
        info = ticker_obj.info

        sinais['metricas'] = {
            'P/L (EPS)': f"{info.get('trailingPE', 'N/A')}x" if isinstance(info.get('trailingPE'), (int, float)) else 'N/A',
            'Div Yield': f"{info.get('dividendYield', 0) * 100:.2f}%" if isinstance(info.get('dividendYield'), (int, float)) else 'N/A',
            'ROE': f"{info.get('returnOnEquity', 0) * 100:.2f}%" if isinstance(info.get('returnOnEquity'), (int, float)) else 'N/A',
        }
    except:
        sinais['metricas'] = {'P/L': 'N/A', 'Div Yield': 'N/A', 'ROE': 'N/A'}

    compra_score = 0

    # Preço abaixo ou próximo à EMA200 = Oportunidade
    if last['Close'] < last['SMA200'] * 1.15:
        compra_score += 2
        sinais['motivos'].append("✓ Preço atrativo para acumulação (próximo da média de 200 dias)")

    # EMA21 > EMA50 > SMA200 = Tendência de alta consolidada
    if last['EMA21'] > last['EMA50'] > last['SMA200']:
        compra_score += 2
        sinais['motivos'].append("✓ Tendência de alta de longo prazo consolidada")

    # RSI em zona neutra (30-70)
    if 30 < last['RSI'] < 70:
        compra_score += 1
        sinais['motivos'].append("✓ Momentum neutro - Bom para acumulação de longo prazo")

    # Volume consistente
    if last['Volume'] > last['Volume_MA'] * 0.8:
        compra_score += 1
        sinais['motivos'].append("✓ Volume adequado para entrada em longo prazo")

    # Preço abaixo do BB Mid
    if last['Close'] < last['BB_Mid']:
        compra_score += 1
        sinais['motivos'].append("✓ Preço em posição confortável - Potencial de alta")

    venda_score = 0

    # Preço acima do BB Upper (sobrevalorizado)
    if last['Close'] > last['BB_Upper'] * 1.05:
        venda_score += 1
        sinais['motivos'].append("✗ Preço potencialmente sobrevalorizado - Aguarde queda")

    # Tendência claramente de baixa
    if last['Close'] < last['EMA21'] < last['EMA50'] < last['SMA200']:
        venda_score += 2
        sinais['motivos'].append("✗ Tendência claramente de baixa - Risco sistêmico")

    # Determinação final
    if compra_score >= 4:
        sinais['acao'] = '🟢 COMPRA'
        sinais['confianca'] = min(compra_score / 6 * 100, 100)
        sinais['entrada'] = round(last['Close'], 2)
        sinais['alvo_12m'] = round(last['Close'] * 1.15, 2)  # Alvo de 15% em 12 meses
        sinais['stop_loss'] = round(last['SMA200'] * 0.95, 2)  # Stop no suporte importante
        sinais['tipo'] = 'Acumulação'
    elif venda_score >= 2:
        sinais['acao'] = '🔴 VENDA'
        sinais['confianca'] = min(venda_score / 3 * 100, 100)
        sinais['tipo'] = 'Realização'
    else:
        sinais['acao'] = '🟡 AGUARDAR'
        sinais['confianca'] = 50
        sinais['motivos'].append("Condições neutras - Continue monitorando a tendência")
        sinais['tipo'] = 'Espera'

    return sinais

# --- INTERFACE ---
st.sidebar.title("📊 B3 STOCK ANALYZER")
st.sidebar.divider()

menu = st.sidebar.radio("📍 Navegação", [
    "🔍 Scanner & Trade",
    "💼 Minha Carteira",
    "📈 Histórico",
    "⚙️ Configurações"
])

# --- SCANNER & TRADE ---
if menu == "🔍 Scanner & Trade":
    st.title("🎯 Terminal de Análise Real-Time")
    st.caption("Análise técnica avançada para Day Trade, Swing Trade e Hold")

    col_select, col_mode = st.columns([2, 1])

    with col_select:
        ticker = st.selectbox(
            "Selecione a ação B3:",
            LISTA_FLAT,
            help="Escolha uma ação da B3 para análise"
        )

    with col_mode:
        modo = st.radio(
            "Estratégia:",
            ["Day Trade", "Swing Trade", "Hold"],
            horizontal=True
        )

    # Buscar dados conforme a estratégia
    st.divider()

    try:
        if modo == "Day Trade":
            periodo, intervalo = "5d", "1m"
            periodo_hist = "20d"
        elif modo == "Swing Trade":
            periodo, intervalo = "60d", "1h"
            periodo_hist = "200d"
        else:  # Hold
            periodo, intervalo = "1y", "1d"
            periodo_hist = "1000d"

        # Dados para análise
        with st.spinner(f"Carregando dados de {ticker}..."):
            dados = yf.download(ticker, period=periodo, interval=intervalo, progress=False)
            dados_hist = yf.download(ticker, period=periodo_hist, interval='1d', progress=False)

        if not dados.empty:
            # Análise conforme o modo
            if modo == "Day Trade":
                analise = analisar_day_trade(dados)
            elif modo == "Swing Trade":
                analise = analisar_swing_trade(dados)
            else:
                analise = analisar_hold(dados_hist, ticker)

            # Layout com 2 colunas: Gráfico + Análise
            col_grafico, col_analise = st.columns([2.5, 1.5])

            with col_grafico:
                # Gráfico com candlestick + médias móveis
                df_plot = dados_hist.tail(100)
                df_plot = calcular_indicadores(df_plot)

                fig = make_subplots(
                    rows=2, cols=1,
                    shared_xaxes=True,
                    vertical_spacing=0.08,
                    row_heights=[0.7, 0.3],
                    subplot_titles=("Preço & Médias Móveis", "Volume")
                )

                # Candlestick
                fig.add_trace(
                    go.Candlestick(
                        x=df_plot.index,
                        open=df_plot['Open'],
                        high=df_plot['High'],
                        low=df_plot['Low'],
                        close=df_plot['Close'],
                        name='Preço',
                        increasing_line_color='#00ff88',
                        decreasing_line_color='#ff3366'
                    ),
                    row=1, col=1
                )

                # EMAs e SMA
                fig.add_trace(
                    go.Scatter(x=df_plot.index, y=df_plot['EMA9'], name='EMA9', line=dict(color='#00ccff', width=1.5)),
                    row=1, col=1
                )
                fig.add_trace(
                    go.Scatter(x=df_plot.index, y=df_plot['EMA21'], name='EMA21', line=dict(color='#ffaa00', width=1.5)),
                    row=1, col=1
                )

                if modo != "Day Trade":
                    fig.add_trace(
                        go.Scatter(x=df_plot.index, y=df_plot['SMA200'], name='SMA200', line=dict(color='#ff3366', width=1.5, dash='dash')),
                        row=1, col=1
                    )

                # Bandas de Bollinger
                fig.add_trace(
                    go.Scatter(x=df_plot.index, y=df_plot['BB_Upper'], name='BB Upper', line=dict(color='rgba(255,170,0,0.3)', width=0), showlegend=False),
                    row=1, col=1
                )
                fig.add_trace(
                    go.Scatter(
                        x=df_plot.index, y=df_plot['BB_Lower'],
                        name='BB Lower',
                        fill='tonexty',
                        fillcolor='rgba(255,170,0,0.1)',
                        line=dict(color='rgba(255,170,0,0.3)', width=0),
                        showlegend=False
                    ),
                    row=1, col=1
                )

                # Volume
                colors = ['#00ff88' if df_plot['Close'].iloc[i] >= df_plot['Open'].iloc[i] else '#ff3366'
                         for i in range(len(df_plot))]
                fig.add_trace(
                    go.Bar(x=df_plot.index, y=df_plot['Volume'], name='Volume', marker=dict(color=colors), showlegend=False),
                    row=2, col=1
                )

                fig.update_layout(
                    template="plotly_dark",
                    height=550,
                    xaxis_rangeslider_visible=False,
                    margin=dict(l=0, r=0, b=0, t=0),
                    hovermode='x unified',
                    paper_bgcolor='rgba(14,17,23,0.9)',
                    plot_bgcolor='rgba(30,30,40,0.5)'
                )

                st.plotly_chart(fig, use_container_width=True)

            with col_analise:
                # CARD PRINCIPAL
                st.markdown(f"""
                <div class="card-analysis">
                    <h3 style="margin: 0 0 10px 0; text-align: center;">
                        {analise['acao']}
                    </h3>
                    <p style="text-align: center; font-size: 14px; color: #888; margin: 0 0 10px 0;">
                        {analise.get('horizonte', 'Curto prazo')} • Confiança: {analise['confianca']:.0f}%
                    </p>
                """, unsafe_allow_html=True)

                # Informações de Preço
                st.metric("Preço Atual", f"R$ {dados['Close'].iloc[-1]:.2f}")

                if 'entrada' in analise and analise['entrada']:
                    col1, col2 = st.columns(2)
                    with col1:
                        st.metric("Entrada", f"R$ {analise['entrada']:.2f}")
                    with col2:
                        st.metric("Alvo", f"R$ {analise.get('saida', analise.get('alvo_12m', 'N/A')):.2f}")

                if 'stop_loss' in analise:
                    st.metric("Stop Loss", f"R$ {analise['stop_loss']:.2f}")

                st.markdown("</div>", unsafe_allow_html=True)

                # INDICADORES
                st.subheader("📊 Indicadores")
                for key, val in analise['indicadores'].items():
                    st.write(f"**{key}:** {val}")

                # MOTIVOS
                if analise['motivos']:
                    st.subheader("📝 Análise")
                    for motivo in analise['motivos']:
                        st.caption(motivo)

            st.divider()

            # SEÇÃO DE OPERAÇÃO
            st.subheader("💰 Executar Operação")
            col1, col2, col3, col4 = st.columns(4)

            with col1:
                qtd = st.number_input("Quantidade (ações)", min_value=1, value=100, step=1)

            with col2:
                entrada = st.number_input("Preço Entrada (R$)", value=float(analise.get('entrada', dados['Close'].iloc[-1])), step=0.01)

            with col3:
                tp = st.number_input("Take Profit (R$)", value=float(analise.get('saida', analise.get('alvo_12m', dados['Close'].iloc[-1] * 1.05))), step=0.01)

            with col4:
                sl = st.number_input("Stop Loss (R$)", value=float(analise.get('stop_loss', dados['Close'].iloc[-1] * 0.98)), step=0.01)

            col_btn1, col_btn2 = st.columns(2)

            with col_btn1:
                if st.button("✅ EXECUTAR COMPRA", use_container_width=True):
                    custo = entrada * qtd
                    if st.session_state.saldo >= custo:
                        operacao = {
                            "id": len(st.session_state.historico_operacoes) + 1,
                            "ticker": ticker,
                            "tipo": "COMPRA",
                            "estrategia": modo,
                            "entrada": entrada,
                            "qtd": qtd,
                            "tp": tp,
                            "sl": sl,
                            "data": datetime.now().strftime("%d/%m/%Y %H:%M"),
                            "status": "ABERTA"
                        }
                        st.session_state.carteira.append(operacao)
                        st.session_state.saldo -= custo
                        st.session_state.historico_operacoes.append(operacao)
                        st.success(f"✅ Operação executada! R$ {custo:,.2f} debitado")
                        st.rerun()
                    else:
                        st.error(f"❌ Saldo insuficiente. Disponível: R$ {st.session_state.saldo:,.2f}")

            with col_btn2:
                if st.button("📋 ADICIONAR À WATCHLIST", use_container_width=True):
                    st.info(f"✓ {ticker} adicionado à watchlist para monitoramento")

        else:
            st.error("Erro ao buscar dados. Verifique o ticker.")

    except Exception as e:
        st.error(f"Erro na análise: {str(e)}")

# --- MINHA CARTEIRA ---
elif menu == "💼 Minha Carteira":
    st.title("💼 Minhas Posições")

    col1, col2, col3 = st.columns(3)
    with col1:
        st.metric("Saldo Disponível", f"R$ {st.session_state.saldo:,.2f}")
    with col2:
        total_posicoes = sum(op['entrada'] * op['qtd'] for op in st.session_state.carteira if op['status'] == 'ABERTA')
        st.metric("Capital Alocado", f"R$ {total_posicoes:,.2f}")
    with col3:
        st.metric("Posições Abertas", len([o for o in st.session_state.carteira if o['status'] == 'ABERTA']))

    st.divider()

    if not st.session_state.carteira:
        st.info("📭 Nenhuma posição aberta. Comece adicionando uma operação!")
    else:
        for i, pos in enumerate(st.session_state.carteira):
            if pos['status'] != 'ABERTA':
                continue

            try:
                dados_live = yf.download(pos['ticker'], period="1d", interval="1m", progress=False)
                preco_agora = dados_live['Close'].iloc[-1] if not dados_live.empty else pos['entrada']
            except:
                preco_agora = pos['entrada']

            pnl = (preco_agora - pos['entrada']) * pos['qtd']
            pnl_pct = ((preco_agora / pos['entrada']) - 1) * 100

            cor = '🟢' if pnl >= 0 else '🔴'

            with st.container(border=True):
                col1, col2, col3, col4, col5 = st.columns([1.5, 1.5, 1.5, 1.5, 1])

                with col1:
                    st.write(f"**{pos['ticker']}**")
                    st.caption(f"{pos['estrategia']} • {pos['data']}")

                with col2:
                    st.metric("Qtd", f"{pos['qtd']} ações")
                    st.caption(f"Entrada: R$ {pos['entrada']:.2f}")

                with col3:
                    st.metric("Preço Atual", f"R$ {preco_agora:.2f}")
                    st.caption(f"TP: R$ {pos['tp']:.2f} | SL: R$ {pos['sl']:.2f}")

                with col4:
                    st.metric(f"{cor} P&L", f"R$ {pnl:.2f}", f"{pnl_pct:+.2f}%")

                with col5:
                    if st.button("🗑️ Fechar", key=f"close_{i}"):
                        st.session_state.saldo += (preco_agora * pos['qtd'])
                        pos['status'] = 'FECHADA'
                        st.success(f"Posição fechada! Realizado: R$ {pnl:.2f}")
                        st.rerun()

# --- HISTÓRICO ---
elif menu == "📈 Histórico":
    st.title("📈 Histórico de Operações")

    if not st.session_state.historico_operacoes:
        st.info("📭 Nenhuma operação registrada ainda")
    else:
        df_hist = pd.DataFrame(st.session_state.historico_operacoes)
        st.dataframe(
            df_hist[['id', 'ticker', 'estrategia', 'entrada', 'qtd', 'tp', 'sl', 'data']],
            use_container_width=True,
            hide_index=True
        )

        st.subheader("📊 Estatísticas")
        col1, col2, col3 = st.columns(3)

        with col1:
            st.metric("Total de Operações", len(st.session_state.historico_operacoes))
        with col2:
            compras = len([o for o in st.session_state.historico_operacoes if o['tipo'] == 'COMPRA'])
            st.metric("Compras Realizadas", compras)
        with col3:
            total_alocado = sum(o['entrada'] * o['qtd'] for o in st.session_state.historico_operacoes)
            st.metric("Capital Total Alocado", f"R$ {total_alocado:,.2f}")

# --- CONFIGURAÇÕES ---
elif menu == "⚙️ Configurações":
    st.title("⚙️ Configurações")

    tab1, tab2, tab3 = st.tabs(["📋 Perfil", "🎯 Estratégias", "🔄 Reset"])

    with tab1:
        st.subheader("Seu Perfil de Investidor")

        col1, col2 = st.columns(2)
        with col1:
            saldo_inicial = st.number_input("Saldo Inicial (R$)", value=100000.0, step=1000.0)
        with col2:
            st.metric("Saldo Atual", f"R$ {st.session_state.saldo:,.2f}")

        st.divider()

        st.subheader("Preferências de Risco")
        risco = st.select_slider(
            "Nível de Risco Aceitável",
            options=['Muito Conservador', 'Conservador', 'Moderado', 'Agressivo', 'Muito Agressivo'],
            value='Moderado'
        )
        st.caption(f"Você selecionou: **{risco}**")

    with tab2:
        st.subheader("Configuração de Estratégias")

        st.write("**Day Trade**")
        col1, col2 = st.columns(2)
        with col1:
            st.number_input("Lucro Alvo (%)", value=2.0, min_value=0.1, step=0.1, key="dt_lucro")
        with col2:
            st.number_input("Stop Loss (%)", value=2.0, min_value=0.1, step=0.1, key="dt_sl")

        st.write("**Swing Trade**")
        col1, col2 = st.columns(2)
        with col1:
            st.number_input("Lucro Alvo (%)", value=5.0, min_value=0.1, step=0.1, key="st_lucro")
        with col2:
            st.number_input("Stop Loss (%)", value=3.0, min_value=0.1, step=0.1, key="st_sl")

        st.write("**Hold**")
        col1, col2 = st.columns(2)
        with col1:
            st.number_input("Lucro Alvo (%)", value=15.0, min_value=0.1, step=0.1, key="h_lucro")
        with col2:
            st.number_input("Stop Loss (%)", value=5.0, min_value=0.1, step=0.1, key="h_sl")

    with tab3:
        st.subheader("⚠️ Reset da Simulação")

        if st.button("🔄 Resetar Saldo e Histórico", use_container_width=True):
            st.session_state.saldo = 100000.0
            st.session_state.carteira = []
            st.session_state.historico_operacoes = []
            st.success("✅ Simulação resetada! Saldo restaurado para R$ 100.000,00")
            st.rerun()

# --- FOOTER ---
st.divider()
st.caption("📊 Stock Analysis Dashboard • Análise Técnica em Tempo Real • B3 Brasil Bolsa Balcão")
