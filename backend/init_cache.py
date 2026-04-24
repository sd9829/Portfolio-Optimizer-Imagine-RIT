"""
Run this script ONCE before the presentation to pre-download all stock price
data and save it to backend/cache/prices.csv. this way During the exhibition,
optimize() reads entirely from disk. Zero network calls, zero rate-limit risk,
faster results, works even with no internet at all.

How to run:
go to your terminal and run these commands:
    cd backend
    py init_cache.py (may have to install py to run it, see readme for more)

The optimizer will automatically use the cached file instead of hitting
yfinance during the exhibition.
"""

from pathlib import Path
import pandas as pd
import yfinance as yf

CACHE_DIR  = Path(__file__).parent / "cache"
CACHE_FILE = CACHE_DIR / "prices.csv"
EXCEL_FILE = Path(__file__).parent / "Final_Companies_with_Latest_Prices.xlsx"
START_DATE = "2020-01-01"
END_DATE   = "2024-01-01"




def main():
    CACHE_DIR.mkdir(exist_ok=True)

    df = pd.read_excel(EXCEL_FILE)
    df.columns = df.columns.str.strip()
    tickers = df["Ticker"].tolist()

    print(f"Downloading price history for {len(tickers)} tickers "
          f"({START_DATE} -> {END_DATE})...")

    raw = yf.download(tickers, start=START_DATE, end=END_DATE,
                      auto_adjust=True, progress=True)

    prices = raw["Close"] if isinstance(raw.columns, pd.MultiIndex) else raw[["Close"]]
    prices = prices.dropna(axis=1, how="all")

    prices.to_csv(CACHE_FILE)
    print(f"\nSaved {prices.shape[1]} tickers × {prices.shape[0]} days "
          f"→ {CACHE_FILE}")
    missing = set(tickers) - set(prices.columns)
    if missing:
        print(f"Warning: no data for {sorted(missing)}")


if __name__ == "__main__":
    main()
