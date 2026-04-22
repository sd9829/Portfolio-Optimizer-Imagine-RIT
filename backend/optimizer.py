import numpy as np
import pandas as pd
import yfinance as yf
import cvxpy as cp
import warnings
warnings.filterwarnings("ignore")

TRADING_DAYS = 252
RISK_FREE_RATE = 0.05


def optimize(tickers: list) -> dict | None:
    raw = yf.download(tickers, start="2020-01-01", end="2024-01-01",
                      auto_adjust=True, progress=False)

    if isinstance(raw.columns, pd.MultiIndex):
        price_data = raw["Close"]
    else:
        price_data = raw[["Close"]]

    price_data = price_data.dropna(axis=1, how="all").ffill().dropna()
    if price_data.shape[1] < 2:
        return None

    returns = price_data.pct_change().dropna()
    mu = returns.mean().values * TRADING_DAYS
    Sigma = returns.cov().values * TRADING_DAYS
    n = len(mu)
    tickers_clean = list(price_data.columns)

    # Global minimum variance (lower return bound)
    w_mv = cp.Variable(n)
    prob_mv = cp.Problem(
        cp.Minimize(cp.quad_form(w_mv, Sigma)),
        [cp.sum(w_mv) == 1, w_mv >= 0]
    )
    prob_mv.solve(solver=cp.CLARABEL)
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
            [cp.sum(w) == 1, mu @ w >= tr, w >= 0]
        )
        prob.solve(solver=cp.CLARABEL)
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
         for t, w in zip(tickers_clean, opt_w) if w > 0.005],
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
