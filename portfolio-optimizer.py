
# This script:
# 1. Reads stock tickers from an Excel file
# 2. Downloads historical price data
# 3. Computes returns and covariance matrix
# 4. Solves a portfolio optimization problem
# 5. Outputs optimal weights, return, and risk
 


# STEP 0: Import libraries
import pandas as pd
import numpy as np
import yfinance as yf
import cvxpy as cp


# STEP 1: Load tickers from Excel
# Make sure your Excel has a column named 'Ticker'
file_path = "Final_Companies_with_Latest_Prices.xlsx"

df = pd.read_excel(file_path)

# Extract tickers
tickers = df['Ticker'].dropna().tolist()

print("Tickers loaded:")
print(tickers)


# STEP 2: Download historical price data
# Using adjusted close prices (accounts for splits/dividends)
start_date = "2020-01-01"
end_date = "2024-01-01"

price_data = yf.download(tickers, start=start_date, end=end_date)['Adj Close']

# Drop columns with missing data
price_data = price_data.dropna(axis=1)

print("\nDownloaded price data shape:", price_data.shape)


# STEP 3: Convert prices to returns
# Daily percentage returns
returns = price_data.pct_change().dropna()

print("\nReturns calculated.")


# STEP 4: Compute parameters for optimization
# Expected returns (mean)
mu = returns.mean().values

# Covariance matrix (risk + correlation)
Sigma = returns.cov().values

n = len(mu)

print("\nNumber of assets used:", n)

# STEP 5: Define optimization variables
# Portfolio weights (what we solve for)
w = cp.Variable(n)


# STEP 6: Define optimization problem
# Target return (adjust as needed)
target_return = 0.001  # ~0.1% daily

# Portfolio variance (risk)
portfolio_variance = cp.quad_form(w, Sigma)

# Objective: minimize risk
objective = cp.Minimize(portfolio_variance)

# Constraints:
constraints = [
    cp.sum(w) == 1,            # fully invested
    mu @ w >= target_return,   # achieve minimum return
    w >= 0                     # no short selling
]


# STEP 7: Solve optimization problem
problem = cp.Problem(objective, constraints)
problem.solve()

print("\nOptimization status:", problem.status)


# STEP 8: Extract results
optimal_weights = w.value

# Portfolio return
portfolio_return = mu @ optimal_weights

# Portfolio risk (standard deviation)
portfolio_risk = np.sqrt(optimal_weights.T @ Sigma @ optimal_weights)


# STEP 9: Display results
print("\n================ RESULTS ================")

print("\nOptimal Weights:")
for ticker, weight in zip(price_data.columns, optimal_weights):
    print(f"{ticker}: {weight:.4f}")

print("\nExpected Portfolio Return:", portfolio_return)
print("Portfolio Risk (Std Dev):", portfolio_risk)


# STEP 10: Optional - Save results
results_df = pd.DataFrame({
    "Ticker": price_data.columns,
    "Weight": optimal_weights
})

results_df.to_csv("optimized_portfolio_weights.csv", index=False)

print("\nResults saved to optimized_portfolio_weights.csv")