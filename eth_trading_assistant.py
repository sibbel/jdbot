#!/usr/bin/env python3
"""
Poloniex Futures Trading Assistant - ETHUSDTPERP
Analyse: EMA(5/10/30) + KDJ(9,3,3) auf 15m & 1h
Management: Position, TP/SL Orders, RRR
"""

import hmac
import hashlib
import base64
import time
import json
import sys
import os
import requests
from urllib.parse import urlencode

# ─────────────────────────────────────────────
#  CREDENTIALS  (via Env-Variablen oder direkt)
# ─────────────────────────────────────────────
API_KEY    = os.getenv("POLO_API_KEY",    "[DEIN API KEY]")
SECRET_KEY = os.getenv("POLO_SECRET_KEY", "[DEIN SECRET]")
# Hinweis: Poloniex Futures nutzt kein Passphrase – nur Key + Secret (HMAC-SHA256)

BASE_URL = "https://api.poloniex.com"
SYMBOL   = "ETHUSDTPERP"
HEADERS_BASE = {
    "Content-Type": "application/json",
    "User-Agent":   "polo-futures/1.0.0 (Skill)",
    "signatureMethod":  "HmacSHA256",
    "signatureVersion": "2",
}

# ─────────────────────────────────────────────
#  AUTH HELPER
# ─────────────────────────────────────────────
def _sign(method: str, path: str, params: dict | None = None, body: dict | None = None) -> dict:
    """Berechnet Signatur und gibt Auth-Header zurück."""
    ts = str(int(time.time() * 1000))

    if method == "GET":
        all_params = dict(params or {})
        all_params["signTimestamp"] = ts
        sorted_qs = urlencode(sorted(all_params.items()))
        presign = f"{method}\n{path}\n{sorted_qs}"
    elif body:
        body_str = json.dumps(body, separators=(",", ":"))
        presign = f"{method}\n{path}\nrequestBody={body_str}&signTimestamp={ts}"
    else:
        presign = f"{method}\n{path}\nsignTimestamp={ts}"

    sig = base64.b64encode(
        hmac.new(SECRET_KEY.encode(), presign.encode(), hashlib.sha256).digest()
    ).decode()

    return {**HEADERS_BASE, "key": API_KEY, "signTimestamp": ts, "signature": sig}


def _get(path: str, params: dict | None = None) -> dict:
    headers = _sign("GET", path, params=params)
    qs = ""
    if params:
        ts = headers["signTimestamp"]
        all_p = dict(params)
        all_p["signTimestamp"] = ts
        qs = "?" + urlencode(sorted(all_p.items()))
    r = requests.get(BASE_URL + path + qs, headers=headers, timeout=10)
    r.raise_for_status()
    return r.json()


def _get_public(path: str, params: dict | None = None) -> dict:
    r = requests.get(BASE_URL + path, params=params,
                     headers={"User-Agent": "polo-futures/1.0.0 (Skill)"}, timeout=10)
    r.raise_for_status()
    return r.json()


def _post(path: str, body: dict) -> dict:
    headers = _sign("POST", path, body=body)
    r = requests.post(BASE_URL + path, headers=headers, json=body, timeout=10)
    r.raise_for_status()
    return r.json()


def _delete(path: str, body: dict | None = None) -> dict:
    b = body or {}
    headers = _sign("DELETE", path, body=b if b else None)
    if b:
        r = requests.delete(BASE_URL + path, headers=headers, json=b, timeout=10)
    else:
        r = requests.delete(BASE_URL + path, headers={**headers, "Content-Type": "application/json"},
                            json={}, timeout=10)
    r.raise_for_status()
    return r.json()


# ─────────────────────────────────────────────
#  MARKTDATEN
# ─────────────────────────────────────────────
def fetch_candles(interval: str, limit: int = 100) -> list[dict]:
    """Kerzendaten abrufen. interval: MINUTE_15, HOUR_1, etc."""
    data = _get_public("/v3/market/candles", {
        "symbol": SYMBOL, "interval": interval, "limit": limit
    })
    # API gibt Liste zurück: [[ts, open, high, low, close, volume], ...]
    candles = []
    if isinstance(data, list):
        for c in data:
            candles.append({
                "ts": int(c[0]), "open": float(c[1]), "high": float(c[2]),
                "low": float(c[3]), "close": float(c[4]), "volume": float(c[5])
            })
    return sorted(candles, key=lambda x: x["ts"])


# ─────────────────────────────────────────────
#  INDIKATOREN
# ─────────────────────────────────────────────
def ema(closes: list[float], period: int) -> list[float]:
    """Exponential Moving Average."""
    k = 2 / (period + 1)
    result = [None] * len(closes)
    # Seed: SMA der ersten `period` Werte
    if len(closes) < period:
        return result
    seed = sum(closes[:period]) / period
    result[period - 1] = seed
    for i in range(period, len(closes)):
        result[i] = closes[i] * k + result[i - 1] * (1 - k)
    return result


def kdj(highs: list[float], lows: list[float], closes: list[float],
        n: int = 9, m1: int = 3, m2: int = 3) -> tuple[list, list, list]:
    """KDJ(9,3,3) – Stochastik-Variante."""
    length = len(closes)
    k_vals = [None] * length
    d_vals = [None] * length
    j_vals = [None] * length

    rsv = [None] * length
    for i in range(n - 1, length):
        h = max(highs[i - n + 1: i + 1])
        l = min(lows[i  - n + 1: i + 1])
        if h == l:
            rsv[i] = 50.0
        else:
            rsv[i] = (closes[i] - l) / (h - l) * 100

    # K-Linie: EWM mit alpha=1/m1
    k_prev = 50.0
    d_prev = 50.0
    for i in range(n - 1, length):
        k_cur = (m1 - 1) / m1 * k_prev + (1 / m1) * rsv[i]
        d_cur = (m2 - 1) / m2 * d_prev + (1 / m2) * k_cur
        j_cur = 3 * k_cur - 2 * d_cur
        k_vals[i] = round(k_cur, 2)
        d_vals[i] = round(d_cur, 2)
        j_vals[i] = round(j_cur, 2)
        k_prev = k_cur
        d_prev = d_cur

    return k_vals, d_vals, j_vals


def analyse_candles(candles: list[dict], tf_label: str) -> dict:
    """EMA + KDJ auf Kerzenliste berechnen und letzten Wert ausgeben."""
    closes = [c["close"] for c in candles]
    highs  = [c["high"]  for c in candles]
    lows   = [c["low"]   for c in candles]

    e5  = ema(closes, 5)
    e10 = ema(closes, 10)
    e30 = ema(closes, 30)
    k, d, j = kdj(highs, lows, closes)

    i = -1  # letzter Wert
    return {
        "tf":    tf_label,
        "close": closes[i],
        "ema5":  round(e5[i],  4) if e5[i]  is not None else None,
        "ema10": round(e10[i], 4) if e10[i] is not None else None,
        "ema30": round(e30[i], 4) if e30[i] is not None else None,
        "k":     k[i],
        "d":     d[i],
        "j":     j[i],
        # Trend-Flags
        "ema_bullish":  e5[i] > e10[i] > e30[i] if all(v is not None for v in [e5[i], e10[i], e30[i]]) else False,
        "ema_bearish":  e5[i] < e10[i] < e30[i] if all(v is not None for v in [e5[i], e10[i], e30[i]]) else False,
        "kdj_oversold":  j[i] < 20  if j[i] is not None else False,
        "kdj_overbought":j[i] > 80  if j[i] is not None else False,
    }


# ─────────────────────────────────────────────
#  SIGNAL
# ─────────────────────────────────────────────
def generate_signal(m15: dict, h1: dict) -> dict:
    """LONG / SHORT / WARTEN Signal mit Begründung."""
    reasons = []
    long_score  = 0
    short_score = 0

    # ─ EMA Alignment ─
    if m15["ema_bullish"]:
        long_score += 2; reasons.append("15m EMA bullish (5>10>30)")
    if m15["ema_bearish"]:
        short_score += 2; reasons.append("15m EMA bearish (5<10<30)")
    if h1["ema_bullish"]:
        long_score += 3; reasons.append("1h EMA bullish (5>10>30)")
    if h1["ema_bearish"]:
        short_score += 3; reasons.append("1h EMA bearish (5<10<30)")

    # ─ KDJ ─
    if m15["kdj_oversold"]:
        long_score += 1; reasons.append(f"15m KDJ überverkauft (J={m15['j']})")
    if m15["kdj_overbought"]:
        short_score += 1; reasons.append(f"15m KDJ überkauft (J={m15['j']})")
    if h1["kdj_oversold"]:
        long_score += 2; reasons.append(f"1h KDJ überverkauft (J={h1['j']})")
    if h1["kdj_overbought"]:
        short_score += 2; reasons.append(f"1h KDJ überkauft (J={h1['j']})")

    if long_score >= 4 and long_score > short_score:
        signal = "LONG"
    elif short_score >= 4 and short_score > long_score:
        signal = "SHORT"
    else:
        signal = "WARTEN"
        if not reasons:
            reasons.append("Keine klare EMA-Ausrichtung, kein KDJ-Extremwert")

    return {"signal": signal, "long_score": long_score, "short_score": short_score, "reasons": reasons}


# ─────────────────────────────────────────────
#  POSITION
# ─────────────────────────────────────────────
def get_position() -> dict | None:
    """Aktuelle ETHUSDTPERP Position abrufen."""
    data = _get("/v3/trade/position/opens", {"symbol": SYMBOL})
    positions = data.get("data", data) if isinstance(data, dict) else data
    if isinstance(positions, list) and positions:
        return positions[0]
    return None


def parse_position(pos: dict) -> dict:
    """Position in lesbare Struktur umwandeln."""
    return {
        "symbol":    pos.get("symbol"),
        "side":      pos.get("posSide"),
        "contracts": float(pos.get("pos",    0)),
        "entry":     float(pos.get("avgPx",  0)),
        "mark":      float(pos.get("markPx", 0)),
        "pnl_unr":   float(pos.get("upl",    0)),
        "margin":    float(pos.get("imr",    0)),
        "liq_price": float(pos.get("liqPx",  0)) if pos.get("liqPx") else None,
        "lever":     int(pos.get("lever",    0)),
        "mgn_mode":  pos.get("mgnMode"),
    }


# ─────────────────────────────────────────────
#  MANAGEMENT PLAN
# ─────────────────────────────────────────────
def calc_management_plan(pos: dict, sl_pct: float = 1.5,
                          tp1_pct: float = 1.5, tp2_pct: float = 3.0, tp3_pct: float = 5.0) -> dict:
    """
    TP1/TP2/TP3 mit 50/30/20% Positionsgröße + SL berechnen.
    sl_pct / tp_pct = % vom Entry-Preis.
    """
    entry = pos["entry"]
    contracts = pos["contracts"]
    side = pos["side"].upper()  # LONG oder SHORT
    lever = pos["lever"] or 1

    direction = 1 if side == "LONG" else -1

    sl_price  = round(entry * (1 - direction * sl_pct  / 100), 4)
    tp1_price = round(entry * (1 + direction * tp1_pct / 100), 4)
    tp2_price = round(entry * (1 + direction * tp2_pct / 100), 4)
    tp3_price = round(entry * (1 + direction * tp3_pct / 100), 4)

    # Kontrakte pro TP-Level
    tp1_sz = round(contracts * 0.50)
    tp2_sz = round(contracts * 0.30)
    tp3_sz = contracts - tp1_sz - tp2_sz  # Rest

    # Profit pro Szenario (näherungsweise: contracts × (tp - entry) bei Linear-Kontrakten)
    # Bei ETHUSDTPERP ist 1 Kontrakt = 0.01 ETH (typisch) – hier vereinfacht in USDT
    contract_value = entry * 0.01  # Schätzwert; ggf. anpassen
    sl_loss    = round(abs(sl_price  - entry) * 0.01 * contracts * lever, 2)
    tp1_profit = round(abs(tp1_price - entry) * 0.01 * tp1_sz    * lever, 2)
    tp2_profit = round(abs(tp2_price - entry) * 0.01 * tp2_sz    * lever, 2)
    tp3_profit = round(abs(tp3_price - entry) * 0.01 * tp3_sz    * lever, 2)

    rrr_tp1 = round(tp1_profit / sl_loss, 2) if sl_loss else None
    rrr_tp2 = round((tp1_profit + tp2_profit) / sl_loss, 2) if sl_loss else None
    rrr_tp3 = round((tp1_profit + tp2_profit + tp3_profit) / sl_loss, 2) if sl_loss else None

    return {
        "entry": entry, "side": side,
        "sl":  {"price": sl_price,  "loss_usdt":   sl_loss},
        "tp1": {"price": tp1_price, "sz": tp1_sz, "profit_usdt": tp1_profit, "rrr": rrr_tp1, "pct": "50%"},
        "tp2": {"price": tp2_price, "sz": tp2_sz, "profit_usdt": tp2_profit, "rrr": rrr_tp2, "pct": "30%"},
        "tp3": {"price": tp3_price, "sz": tp3_sz, "profit_usdt": tp3_profit, "rrr": rrr_tp3, "pct": "20%"},
    }


# ─────────────────────────────────────────────
#  ORDERS SETZEN
# ─────────────────────────────────────────────
def place_tp_sl_orders(pos: dict, plan: dict, mgn_mode: str = "CROSS") -> list:
    """TP1/TP2/TP3 und SL als Limit-Orders auf Poloniex setzen."""
    side = pos["side"].upper()
    close_side = "SELL" if side == "LONG" else "BUY"

    results = []

    def place(label: str, price: float, sz: int, reduce_only: bool = True):
        body = {
            "symbol":     SYMBOL,
            "side":       close_side,
            "mgnMode":    mgn_mode,
            "posSide":    side,
            "type":       "LIMIT",
            "sz":         str(int(sz)),
            "px":         str(price),
            "reduceOnly": reduce_only,
            "timeInForce": "GTC",
        }
        resp = _post("/v3/trade/order", body)
        results.append({"label": label, "price": price, "sz": sz, "response": resp})
        return resp

    # SL als reduceOnly LIMIT (Markt wäre sicherer, hier LIMIT für RRR-Kontrolle)
    place("SL",  plan["sl"]["price"],  int(pos["contracts"]))
    place("TP1", plan["tp1"]["price"], plan["tp1"]["sz"])
    place("TP2", plan["tp2"]["price"], plan["tp2"]["sz"])
    place("TP3", plan["tp3"]["price"], plan["tp3"]["sz"])

    return results


# ─────────────────────────────────────────────
#  OUTPUT HELPER
# ─────────────────────────────────────────────
def sep(char="─", n=55): print(char * n)

def print_analysis(m15: dict, h1: dict, sig: dict):
    sep()
    print(f"  ANALYSE  {SYMBOL}")
    sep()
    for tf in [m15, h1]:
        label = tf["tf"]
        print(f"\n  [{label}]  Close: {tf['close']}")
        print(f"    EMA5={tf['ema5']}  EMA10={tf['ema10']}  EMA30={tf['ema30']}")
        trend = "BULLISH" if tf["ema_bullish"] else ("BEARISH" if tf["ema_bearish"] else "NEUTRAL")
        print(f"    EMA-Trend: {trend}")
        print(f"    KDJ  K={tf['k']}  D={tf['d']}  J={tf['j']}", end="")
        if tf["kdj_overbought"]: print("  ⚠ ÜBERKAUFT")
        elif tf["kdj_oversold"]:  print("  ⚠ ÜBERVERKAUFT")
        else: print()

    sep()
    print(f"\n  SIGNAL: *** {sig['signal']} ***")
    print(f"  Score  LONG={sig['long_score']}  SHORT={sig['short_score']}")
    print("  Begründung:")
    for r in sig["reasons"]:
        print(f"    • {r}")
    sep()


def print_position(p: dict):
    sep()
    print("  AKTUELLE POSITION")
    sep()
    print(f"  Symbol:    {p['symbol']}")
    print(f"  Seite:     {p['side']}")
    print(f"  Kontrakte: {p['contracts']}")
    print(f"  Entry:     {p['entry']}")
    print(f"  Mark:      {p['mark']}")
    print(f"  PNL (unr): {p['pnl_unr']} USDT")
    print(f"  Margin:    {p['margin']}")
    print(f"  Hebel:     {p['lever']}x  ({p['mgn_mode']})")
    if p["liq_price"]:
        print(f"  Liq.Preis: {p['liq_price']}")
    sep()


def print_plan(plan: dict):
    sep()
    print("  MANAGEMENT PLAN")
    sep()
    print(f"  Entry: {plan['entry']}  |  Seite: {plan['side']}")
    print(f"\n  SL  → {plan['sl']['price']}  (Verlust ~{plan['sl']['loss_usdt']} USDT)")
    print(f"\n  TP1 → {plan['tp1']['price']}  |  {plan['tp1']['pct']} "
          f"({plan['tp1']['sz']} Kt)  +{plan['tp1']['profit_usdt']} USDT  |  RRR: {plan['tp1']['rrr']}")
    print(f"  TP2 → {plan['tp2']['price']}  |  {plan['tp2']['pct']} "
          f"({plan['tp2']['sz']} Kt)  +{plan['tp2']['profit_usdt']} USDT  |  RRR kum: {plan['tp2']['rrr']}")
    print(f"  TP3 → {plan['tp3']['price']}  |  {plan['tp3']['pct']} "
          f"({plan['tp3']['sz']} Kt)  +{plan['tp3']['profit_usdt']} USDT  |  RRR kum: {plan['tp3']['rrr']}")
    sep()


# ─────────────────────────────────────────────
#  MAIN
# ─────────────────────────────────────────────
def run_analyse():
    print("\nLade Kerzendaten …")
    c15 = fetch_candles("MINUTE_15", 100)
    c1h = fetch_candles("HOUR_1",    100)
    m15 = analyse_candles(c15, "15m")
    h1  = analyse_candles(c1h, "1h")
    sig = generate_signal(m15, h1)
    print_analysis(m15, h1, sig)


def run_management(sl_pct=1.5, tp1_pct=1.5, tp2_pct=3.0, tp3_pct=5.0):
    print("\nAbrufen Position …")
    raw = get_position()
    if not raw:
        print("  Keine offene Position für", SYMBOL)
        return
    pos = parse_position(raw)
    print_position(pos)
    plan = calc_management_plan(pos, sl_pct, tp1_pct, tp2_pct, tp3_pct)
    print_plan(plan)
    return pos, plan


def run_set_orders(sl_pct=1.5, tp1_pct=1.5, tp2_pct=3.0, tp3_pct=5.0):
    result = run_management(sl_pct, tp1_pct, tp2_pct, tp3_pct)
    if not result:
        return
    pos, plan = result
    confirm = input("\n  TP/SL Orders jetzt setzen? [ja/nein]: ").strip().lower()
    if confirm != "ja":
        print("  Abgebrochen.")
        return
    print("\nSetze Orders …")
    results = place_tp_sl_orders(pos, plan, mgn_mode=pos.get("mgn_mode", "CROSS"))
    for r in results:
        status = r["response"].get("msg", "OK")
        print(f"  {r['label']:4s} @ {r['price']:>12}  ({r['sz']} Kt)  →  {status}")
    sep()


# ─────────────────────────────────────────────
#  CLI
# ─────────────────────────────────────────────
USAGE = """
Poloniex Futures Trading Assistant – ETHUSDTPERP
─────────────────────────────────────────────────
Befehle:
  analyse             EMA + KDJ Signal auf 15m & 1h
  position            Aktuelle Position anzeigen
  plan                Management Plan (TP/SL berechnen)
  orders              Plan berechnen + Orders direkt setzen

Optionale Argumente für plan/orders:
  --sl=1.5 --tp1=1.5 --tp2=3.0 --tp3=5.0   (in % vom Entry)

Credentials via Env-Variablen:
  export POLO_API_KEY="..."
  export POLO_SECRET_KEY="..."
"""

if __name__ == "__main__":
    args = sys.argv[1:]
    if not args:
        print(USAGE)
        sys.exit(0)

    cmd = args[0]

    # Parse optionale Params
    kw = {}
    for a in args[1:]:
        if a.startswith("--sl="):  kw["sl_pct"]  = float(a.split("=")[1])
        if a.startswith("--tp1="): kw["tp1_pct"] = float(a.split("=")[1])
        if a.startswith("--tp2="): kw["tp2_pct"] = float(a.split("=")[1])
        if a.startswith("--tp3="): kw["tp3_pct"] = float(a.split("=")[1])

    if cmd == "analyse":
        run_analyse()
    elif cmd == "position":
        raw = get_position()
        if raw:
            print_position(parse_position(raw))
        else:
            print("  Keine offene Position.")
    elif cmd == "plan":
        run_management(**kw)
    elif cmd == "orders":
        run_set_orders(**kw)
    else:
        print(USAGE)
