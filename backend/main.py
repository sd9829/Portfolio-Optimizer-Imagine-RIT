from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import yfinance as yf
import time
import threading
from optimizer import optimize

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE = Path(__file__).parent.parent
df = pd.read_excel(BASE / "Final_Companies_with_Latest_Prices.xlsx")
df.columns = df.columns.str.strip()

_price_cache: dict = {}
_cache_time: float = 0.0
_CACHE_TTL = 300  # seconds
_optimize_lock = threading.Lock()  # yf.download is not thread-safe under concurrency


def _fetch_live_prices() -> dict:
    global _price_cache, _cache_time
    if time.time() - _cache_time < _CACHE_TTL:
        return _price_cache
    try:
        tickers = df["Ticker"].tolist()
        raw = yf.download(tickers, period="1d", auto_adjust=True, progress=False)
        closes = raw["Close"] if isinstance(raw.columns, pd.MultiIndex) else raw[["Close"]]
        _price_cache = closes.iloc[-1].dropna().to_dict()
        _cache_time = time.time()
    except Exception:
        pass
    return _price_cache


@app.get("/companies")
def get_companies():
    live = _fetch_live_prices()
    result = {}
    for sector, group in df.groupby("Sector"):
        result[sector] = [
            {
                "ticker": row["Ticker"],
                "company": row["Company"],
                "price": float(live.get(row["Ticker"], row["Latest_Price"])),
            }
            for _, row in group.iterrows()
        ]
    return result


class OptimizeRequest(BaseModel):
    tickers: list[str]


@app.post("/optimize")
def run_optimizer(req: OptimizeRequest):
    if len(req.tickers) < 2:
        raise HTTPException(status_code=400, detail="Select at least 2 stocks")
    with _optimize_lock:
        result = optimize(req.tickers)
    if result is None:
        raise HTTPException(status_code=422, detail="Optimization failed — try different stocks")

    name_map = df.set_index("Ticker")["Company"].to_dict()
    for w in result["optimal"]["weights"]:
        w["name"] = name_map.get(w["ticker"], w["ticker"])

    return result
