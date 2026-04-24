import numpy as np
import pandas as pd
import yfinance as yf
import cvxpy as cp
import warnings
from pathlib import Path
warnings.filterwarnings("ignore")

TRADING_DAYS = 252
RISK_FREE_RATE = 0.05

_CACHE_FILE = Path(__file__).parent / "cache" / "prices.csv"
_cache_df: pd.DataFrame | None = None


def _load_cache() -> pd.DataFrame | None:
    global _cache_df
    if _cache_df is not None:
        return _cache_df
    if _CACHE_FILE.exists():
        _cache_df = pd.read_csv(_CACHE_FILE, index_col=0, parse_dates=True)
    return _cache_df


def _get_prices(tickers: list) -> pd.DataFrame:
    cache = _load_cache()
    if cache is not None:
        available = [t for t in tickers if t in cache.columns]
        return cache[available].copy()
    # fallback: live download if cache was never built
    raw = yf.download(tickers, start="2020-01-01", end="2024-01-01",
                      auto_adjust=True, progress=False)
    if isinstance(raw.columns, pd.MultiIndex):
        return raw["Close"]
    return raw[["Close"]]


def optimize(tickers: list) -> dict | None:
    price_data = _get_prices(tickers)

    price_data = price_data.dropna(axis=1, how="all").ffill().dropna()
    if price_data.shape[1] < 2:
        return None

    returns = price_data.pct_change().dropna()
    mu = returns.mean().values * TRADING_DAYS
    Sigma = returns.cov().values * TRADING_DAYS
    n = len(mu)
    tickers_clean = list(price_data.columns)

    min_weight = 0.01
    max_weight = max(0.33, 1.0 / n)

    # Global minimum variance (lower return bound)
    w_mv = cp.Variable(n)
    prob_mv = cp.Problem(
        cp.Minimize(cp.quad_form(w_mv, Sigma)),
        [cp.sum(w_mv) == 1, w_mv >= min_weight, w_mv <= max_weight]
    )
    try:
        prob_mv.solve(solver=cp.CLARABEL)
    except cp.SolverError:
        return None
    if w_mv.value is None:
        return None

    ret_min = float(mu @ w_mv.value)
    ret_max = float(np.max(mu))

    # Efficient frontier
    frontier_ret, frontier_std, frontier_sharpe, frontier_weights = [], [], [], []

    for tr in np.linspace(ret_min, ret_max, 60):
        w = cp.Variable(n)
        prob = cp.Problem(
            cp.Minimize(cp.quad_form(w, Sigma)),
            [cp.sum(w) == 1, mu @ w >= tr, w >= min_weight, w <= max_weight]
        )
        try:
            prob.solve(solver=cp.CLARABEL)
        except cp.SolverError:
            continue
        if prob.status not in ("optimal", "optimal_inaccurate") or w.value is None:
            continue
        wv = w.value
        r = float(mu @ wv)
        s = float(np.sqrt(wv @ Sigma @ wv))
        sharpe = (r - RISK_FREE_RATE) / s if s > 0 else -np.inf
        frontier_ret.append(r)
        frontier_std.append(s)
        frontier_sharpe.append(sharpe)
        frontier_weights.append(wv.tolist())

    if not frontier_ret:
        return None

    arr_ret = np.array(frontier_ret)
    arr_std = np.array(frontier_std)
    arr_sharpe = np.array(frontier_sharpe)

    best_idx = int(np.argmax(arr_sharpe))
    opt_w = frontier_weights[best_idx]

    weight_list = sorted(
        [{"ticker": t, "weight": round(w, 6)}
         for t, w in zip(tickers_clean, opt_w)],
        key=lambda x: x["weight"], reverse=True
    )

    return {
        "optimal": {
            "return": round(float(arr_ret[best_idx]), 6),
            "risk": round(float(arr_std[best_idx]), 6),
            "sharpe": round(float(arr_sharpe[best_idx]), 4),
            "weights": weight_list,
        },
        "min_variance": {
            "return": round(float(arr_ret[0]), 6),
            "risk": round(float(arr_std[0]), 6),
            "sharpe": round(float((arr_ret[0] - RISK_FREE_RATE) / arr_std[0]), 4),
        },
        "frontier": [
            {"return": r, "risk": s, "sharpe": sh}
            for r, s, sh in zip(
                arr_ret.tolist(),
                arr_std.tolist(),
                arr_sharpe.tolist()
            )
            if np.isfinite(sh)
        ],
    }
