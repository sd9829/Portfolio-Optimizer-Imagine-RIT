

# STEP 0: Import libraries
import pandas as pd
import numpy as np
import yfinance as yf
import cvxpy as cp


# STEP 1: Load tickers from Excel
file_path = "Final_Companies_with_Latest_Prices.xlsx"

df = pd.read_excel(file_path)

# Clean column names (important)
df.columns = df.columns.str.strip()

print("DF COLUMNS:", df.columns)

# Extract tickers
tickers = df['Ticker'].dropna().tolist()

print("Tickers loaded:")
print(tickers)


# STEP 2: Define date range (YOU WERE MISSING THIS)
start_date = "2020-01-01"
end_date = "2024-01-01"


# STEP 3: Download historical price data (SAFE VERSION)
# STEP 3: Download historical price data (FIXED VERSION)

price_data = yf.download(
    tickers,
    start=start_date,
    end=end_date,
    group_by='ticker',
    threads=False  # VERY IMPORTANT (fixes locking / failures)
)

# Extract Adj Close properly
if isinstance(price_data.columns, pd.MultiIndex):
    price_data = price_data.xs('Adj Close', level=1, axis=1)
else:
    price_data = price_data[['Adj Close']]

# Clean data
price_data = price_data.dropna(axis=1, how='all')
price_data = price_data.ffill()
price_data = price_data.dropna()

print("\nColumns after cleaning:", len(price_data.columns))
print("Price data shape:", price_data.shape)


# STEP 4: CLEAN DATA (🔥 THIS IS WHERE YOUR FIX GOES)
price_data = price_data.dropna(axis=1, how='all')   # drop fully empty columns
price_data = price_data.ffill()                     # fill missing values forward
price_data = price_data.dropna()                    # drop remaining NA rows

print("\nColumns after cleaning:", len(price_data.columns))
print("Price data shape:", price_data.shape)


# STEP 5: Convert prices to returns
returns = price_data.pct_change().dropna()

print("\nReturns calculated.")


# STEP 6: Compute parameters for optimization
mu = returns.mean().values
Sigma = returns.cov().values

n = len(mu)

print("\nNumber of assets used:", n)

# Safety check (prevents crash)
if n == 0:
    raise ValueError("No valid assets found after cleaning. Check data download.")


# STEP 7: Define optimization variables
w = cp.Variable(n)


# STEP 8: Define optimization problem
target_return = 0.001  # adjust if needed

portfolio_variance = cp.quad_form(w, Sigma)

objective = cp.Minimize(portfolio_variance)

constraints = [
    cp.sum(w) == 1,
    mu @ w >= target_return,
    w >= 0
]


# STEP 9: Solve optimization
problem = cp.Problem(objective, constraints)
problem.solve()

print("\nOptimization status:", problem.status)


# STEP 10: Extract results
optimal_weights = w.value

portfolio_return = mu @ optimal_weights
portfolio_risk = np.sqrt(optimal_weights.T @ Sigma @ optimal_weights)


# STEP 11: Display results
print("\n================ RESULTS ================")

print("\nOptimal Weights:")
for ticker, weight in zip(price_data.columns, optimal_weights):
    print(f"{ticker}: {weight:.4f}")

print("\nExpected Portfolio Return:", portfolio_return)
print("Portfolio Risk (Std Dev):", portfolio_risk)


# STEP 12: Save results
results_df = pd.DataFrame({
    "Ticker": price_data.columns,
    "Weight": optimal_weights
})

results_df.to_csv("optimized_portfolio_weights.csv", index=False)

print("\nResults saved to optimized_portfolio_weights.csv")