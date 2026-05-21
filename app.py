import streamlit as st
import yfinance as yf
import pandas as pd
import plotly.graph_objects as go
from datetime import datetime

# --- CONFIGURAÇÃO DA PÁGINA ---
st.set_page_config(page_title="Alpha Vision v5 PRO", layout="wide")

# CSS para visual minimalista e moderno
st.markdown("""
    <style>
    .main { background-color: #0e1117; color: #ffffff; }
    .stMetric { background-color: #1c2128; border: 1px solid #30363d; padding: 15px; border-radius: 10px; }
    div.stButton > button:first-child { background-color: #00ff88; color: black; border: none; width: 100%; font-weight: bold; }
    div.stButton > button:hover { background-color: #00cc6e; color: black; }
    </style>
    """, unsafe_allow_html=True)

# --- LISTA DE AÇÕES B3 ---
LISTA_B3 = [
    "PETR4.SA", "VALE3.SA", "ITUB4.SA", "BBDC4.SA", "ABEV3.SA", "BBAS3.SA", 
    "MGLU3.SA", "WEGE3.SA", "RENT3.SA", "PRIO3.SA", "B3SA3.SA", "GGBR4.SA"
]

# --- INICIALIZAÇÃO DE ESTADOS ---
if 'carteira' not in st.session_state: st.session_state.carteira = []
if 'saldo' not in st.session_state: st.session_state.saldo = 100000.0

# --- FUNÇÕES DE ANÁLISE ---
def analisar_ativo(df, modo):
    df['EMA9'] = ta.ema(df['Close'], length=9)
    df['EMA21'] = ta.ema(df['Close'], length=21)
    df['RSI'] = ta.rsi(df['Close'], length=14)
    
    last = df.iloc[-1]
    prev = df.iloc[-2]
    
    if modo == "Day Trade":
        # Estratégia de Cruzamento Rápido + RSI
        if last['EMA9'] > last['EMA21'] and prev['EMA9'] <= prev['EMA21'] and last['RSI'] < 65:
            return "COMPRA", "Cruzamento de médias curto-prazo com força alta."
        elif last['EMA9'] < last['EMA21']:
            return "VENDA", "Tendência de queda no intraday. Saída sugerida."
    
    elif modo == "Swing Trade":
        # Estratégia de Tendência + RSI
        if last['Close'] > last['EMA21'] and last['RSI'] < 40:
            return "COMPRA", "Ativo em tendência de alta, porém sobrevendido (oportunidade)."
        elif last['RSI'] > 70:
            return "VENDA", "Ativo muito esticado. Risco de correção."
            
    else: # HOLD
        roe = 15 # Valor simulado para exemplo
        if last['Close'] < last['EMA21'] * 1.10: # Próximo da média de longo prazo
            return "COMPRA (HOLD)", "Preço atrativo para acumulação de longo prazo."
    
    return "AGUARDAR", "Sem sinais claros no momento."

# --- INTERFACE ---
st.sidebar.title("💎 ALPHA PRO")
menu = st.sidebar.radio("Navegação", ["Scanner & Trade", "Minha Carteira", "Configurações"])

if menu == "Scanner & Trade":
    st.title("🎯 Terminal de Análise Real-Time")
    
    col1, col2 = st.columns([3, 1])
    
    with col2:
        ticker = st.selectbox("Escolha a Ação:", LISTA_B3)
        modo = st.radio("Modalidade:", ["Day Trade", "Swing Trade", "Hold"])
        
        # Parâmetros de tempo
        tf = {"Day Trade": "1m", "Swing Trade": "1h", "Hold": "1d"}
        periodo = "1d" if modo == "Day Trade" else "60d"
        
        data = yf.download(ticker, period=periodo, interval=tf[modo], progress=False)
        
        if not data.empty:
            preco_atual = data['Close'].iloc[-1]
            status, motivo = analisar_ativo(data, modo)
            
            st.metric("Preço Atual", f"R$ {preco_atual:.2f}")
            st.write(f"**Análise:** {status}")
            st.caption(motivo)
            
            qtd = st.number_input("Quantidade", min_value=1, value=100)
            sl = st.number_input("Stop Loss (R$)", value=preco_atual * 0.97)
            tp = st.number_input("Take Profit (R$)", value=preco_atual * 1.06)
            
            if st.button("EXECUTAR OPERAÇÃO"):
                custo = preco_atual * qtd
                if st.session_state.saldo >= custo:
                    ordem = {
                        "ticker": ticker, "entrada": preco_atual, "qtd": qtd,
                        "sl": sl, "tp": tp, "tipo": modo, "data": datetime.now()
                    }
                    st.session_state.carteira.append(ordem)
                    st.session_state.saldo -= custo
                    st.success("Ordem executada com sucesso!")
                else:
                    st.error("Saldo insuficiente.")

    with col1:
        if not data.empty:
            fig = go.Figure(data=[go.Candlestick(x=data.index, open=data['Open'], high=data['High'], low=data['Low'], close=data['Close'])])
            fig.update_layout(template="plotly_dark", height=600, xaxis_rangeslider_visible=False, margin=dict(l=0,r=0,b=0,t=0))
            st.plotly_chart(fig, use_container_width=True)

elif menu == "Minha Carteira":
    st.title("💼 Minhas Posições")
    st.write(f"**Saldo disponível:** R$ {st.session_state.saldo:,.2f}")
    
    if not st.session_state.carteira:
        st.info("Nenhuma posição aberta.")
    else:
        for i, pos in enumerate(st.session_state.carteira):
            # Simulando atualização de lucro
            d_live = yf.download(pos['ticker'], period="1d", interval="1m", progress=False)
            p_agora = d_live['Close'].iloc[-1]
            pnl = (p_agora - pos['entrada']) * pos['qtd']
            
            c1, c2, c3 = st.columns([2, 2, 1])
            c1.write(f"**{pos['ticker']}** ({pos['tipo']})")
            c2.metric("P&L", f"R$ {pnl:.2f}", f"{((p_agora/pos['entrada'])-1)*100:.2f}%")
            
            if c3.button("Fechar", key=f"f_{i}"):
                st.session_state.saldo += (p_agora * pos['qtd'])
                st.session_state.carteira.pop(i)
                st.rerun()
