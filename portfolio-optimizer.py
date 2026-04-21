import pandas as pd
import numpy as np
import yfinance as yf
import cvxpy as cp
import matplotlib.pyplot as plt
import warnings
warnings.filterwarnings("ignore")

TRADING_DAYS = 252  # number of trading days in a year; can be parameterized?
RISK_FREE_RATE = 0.05  # annualized

# STEP 1: Load tickers; data cleaning
file_path = "Final_Companies_with_Latest_Prices.xlsx"
df = pd.read_excel(file_path)
df.columns = df.columns.str.strip()

tickers = df["Ticker"].dropna().tolist()
print(f"Loaded {len(tickers)} tickers across {df['Sector'].nunique()} sectors")

# STEP 2: Download historical prices (yfinance 1.3+)
start_date = "2020-01-01"
end_date   = "2024-01-01"   # also can be paramterized

raw = yf.download(tickers, start=start_date, end=end_date, auto_adjust=True)

# auto_adjust=True: column level-0 is price type (Close, High, etc.)
if isinstance(raw.columns, pd.MultiIndex):
    price_data = raw["Close"]
else:
    price_data = raw[["Close"]]

# Drop columns that are entirely NaN, forward-fill gaps, then drop remaining NaN rows
price_data = price_data.dropna(axis=1, how="all").ffill().dropna()

print(f"Assets with full data: {price_data.shape[1]}  |  Trading days: {price_data.shape[0]}")

# STEP 3: Daily returns -> annualised parameters
"""
  Computes daily percentage returns from the price series, then annualizes them:
  - mu — expected annual return for each asset (mean daily return × 252)
  - Sigma — annualized covariance matrix (daily cov × 252), capturing how assets move together
  - n — number of assets
"""
returns = price_data.pct_change().dropna()

mu    = returns.mean().values * TRADING_DAYS
Sigma = returns.cov().values  * TRADING_DAYS
n     = len(mu)

if n == 0:
    raise ValueError("No valid assets after cleaning. Check data download.")

print(f"\nAssets used in optimisation: {n}")

# STEP 4: Helper - solve minimum-variance for a given target return - this can be easily customized
def min_variance_portfolio(mu, Sigma, target_return):
    """
    Given a target return, it finds the portfolio with the lowest possible risk
    that still meets that return — the definition of an efficient portfolio.

      It sets up a convex optimization problem using cvxpy:
      - Variable: w — the weight vector (one weight per asset)
      - Objective: minimize w^T Σ w (portfolio variance)
      - Constraints:
        - sum(w) == 1 — weights must sum to 100%
        - mu @ w >= target_return — must hit the target return
        - w >= 0 — no short selling allowed

      Returns the weights, realized return, and standard deviation, or None if no feasible solution exists.
    """
    n = len(mu)
    w = cp.Variable(n)
    objective = cp.Minimize(cp.quad_form(w, Sigma))
    constraints = [cp.sum(w) == 1, mu @ w >= target_return, w >= 0]
    prob = cp.Problem(objective, constraints)
    prob.solve(solver=cp.CLARABEL)
    if prob.status not in ("optimal", "optimal_inaccurate") or w.value is None:
        return None
    wv  = w.value
    ret = float(mu @ wv)
    std = float(np.sqrt(wv @ Sigma @ wv))
    return wv, ret, std

# STEP 5: Find return bounds for efficient frontier
w_mv = cp.Variable(n)
prob_mv = cp.Problem(cp.Minimize(cp.quad_form(w_mv, Sigma)),
                     [cp.sum(w_mv) == 1, w_mv >= 0])
prob_mv.solve(solver=cp.CLARABEL)
ret_min = float(mu @ w_mv.value)
ret_max = float(np.max(mu))

target_returns = np.linspace(ret_min, ret_max, 60)

# STEP 6: Build efficient frontier
"""
Calls min_variance_portfolio 60 times across evenly spaced target 
returns between ret_min and ret_max. Each call gives one point on 
the frontier. Stores the resulting return, risk, Sharpe ratio, 
and weights for every feasible point.
"""
frontier_ret, frontier_std, frontier_sharpe = [], [], []
frontier_weights = []

for tr in target_returns:
    result = min_variance_portfolio(mu, Sigma, tr)
    if result is None:
        continue
    wv, r, s = result
    frontier_ret.append(r)
    frontier_std.append(s)
    frontier_sharpe.append((r - RISK_FREE_RATE) / s if s > 0 else -np.inf)
    frontier_weights.append(wv)

frontier_ret    = np.array(frontier_ret)
frontier_std    = np.array(frontier_std)
frontier_sharpe = np.array(frontier_sharpe)

# STEP 7: Optimal (maximum Sharpe ratio) portfolio
best_idx = int(np.argmax(frontier_sharpe))
opt_weights = frontier_weights[best_idx]
opt_return  = frontier_ret[best_idx]
opt_std     = frontier_std[best_idx]
opt_sharpe  = frontier_sharpe[best_idx]

print("\n========== OPTIMAL PORTFOLIO (Max Sharpe Ratio) ==========")
print(f"  Expected Annual Return : {opt_return:.4%}")
print(f"  Annual Std Dev (Risk)  : {opt_std:.4%}")
print(f"  Sharpe Ratio           : {opt_sharpe:.4f}")

tickers_clean = list(price_data.columns)
weight_df = pd.DataFrame({"Ticker": tickers_clean, "Weight": opt_weights})
weight_df = weight_df[weight_df["Weight"] > 0.005].sort_values("Weight", ascending=False)

print("\nTop Holdings:")
print(weight_df.to_string(index=False, float_format="{:.4%}".format))

# STEP 8: Minimum-variance portfolio stats
mv_weights = frontier_weights[0]
mv_return  = frontier_ret[0]
mv_std     = frontier_std[0]

print("\n========== MINIMUM VARIANCE PORTFOLIO ==========")
print(f"  Expected Annual Return : {mv_return:.4%}")
print(f"  Annual Std Dev (Risk)  : {mv_std:.4%}")
print(f"  Sharpe Ratio           : {(mv_return - RISK_FREE_RATE) / mv_std:.4f}")

# STEP 9: Plot efficient frontier
fig, ax = plt.subplots(figsize=(10, 6))

sc = ax.scatter(frontier_std, frontier_ret,
                c=frontier_sharpe, cmap="viridis", s=20, zorder=2,
                label="Efficient Frontier")
plt.colorbar(sc, ax=ax, label="Sharpe Ratio")

ax.scatter(opt_std, opt_return, marker="*", color="red", s=250, zorder=5,
           label=f"Max Sharpe ({opt_sharpe:.2f})")
ax.scatter(mv_std, mv_return, marker="D", color="blue", s=80, zorder=5,
           label="Min Variance")

ax.set_xlabel("Annual Risk (Std Dev)")
ax.set_ylabel("Annual Expected Return")
ax.set_title("Efficient Frontier - Portfolio Optimisation")
ax.xaxis.set_major_formatter(plt.FuncFormatter(lambda v, _: f"{v:.1%}"))
ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda v, _: f"{v:.1%}"))
ax.legend()
ax.grid(True, alpha=0.3)

plt.tight_layout()
plt.savefig("efficient_frontier.png", dpi=150)
print("\nEfficient frontier saved -> efficient_frontier.png")
plt.show()

# STEP 10: Save results
all_weights = pd.DataFrame({"Ticker": tickers_clean, "Weight": opt_weights})
all_weights.to_csv("optimized_portfolio_weights.csv", index=False)
print("Optimal weights saved -> optimized_portfolio_weights.csv")
