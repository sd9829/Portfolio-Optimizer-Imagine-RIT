# Portfolio Optimizer — Imagine RIT

An interactive web app that lets you pick stocks from 11 sectors and find the mathematically optimal portfolio allocation using Modern Portfolio Theory.

---

## What This App Does

1. Shows all 108 companies grouped by industry as clickable bubbles
2. You click the stocks you want to include
3. The app runs a quadratic optimization algorithm on your selection
4. It shows you the best possible portfolio — maximum return per unit of risk (Sharpe ratio), with no short selling allowed

---

## What You Need to Install First

You only need to do this section **once ever** on your computer.

### 1. Python

Python runs the math and optimization engine.

1. Go to **https://www.python.org/downloads/**
2. Click the big yellow **"Download Python 3.x.x"** button
3. Run the installer
4. **IMPORTANT:** On the first screen of the installer, check the box that says **"Add Python to PATH"** before clicking Install
5. Click **Install Now**

To verify it worked, open PowerShell (Windows) / Terminal (Mac) and type:

Windows:
```
py --version
```
Mac:
```
python3 --version
```
You should see something like `Python 3.12.3`

---

### 2. Flask

Flask runs the frontend (the visual part of the website).

In your terminal or virutal environment -> 
pip install Flask

---

## How to Run the App

Every time you want to use the app, follow these steps. You need **two PowerShell (Windows) / Terminal (Mac) windows open at the same time.**

---

### Step 1 — Open a Terminal

Windows: Press `Windows key + S`, type **PowerShell**, and open it.
Mac: Press `Cmd + Space`, type **Terminal**, and open it.

---

### Step 2 — Start the Backend (the math engine)

In your **first PowerShell / Terminal window**, paste these commands one at a time and press Enter after each:

Windows:
```
cd C:\GitHub\Portfolio-Optimizer-Imagine-RIT\backend
```
Mac:
```
cd ~/GitHub/Portfolio-Optimizer-Imagine-RIT/backend
```


To run the server->
python -u /backend/main.py

You should see output like:
```
INFO:     Uvicorn running on http://127.0.0.1:5000
INFO:     Application startup complete.
```

**Leave this window open.** Do not close it while using the app.





### Step 4 — Open the App in Your Browser

Open any browser (Chrome, Edge, Firefox) and go to:

```
http://localhost:5000
```

The app will load and you'll see all 108 companies as bubbles grouped by sector.

---

## How to Use the App

### Picking Stocks
- Each **bubble** is a company — hover over it to see the company name, ticker, and price
- **Click a bubble** to select it — it will glow with a white ring
- **Click it again** to deselect
- Select stocks from as many or as few sectors as you like
- You need at least **2 stocks** selected to run the optimizer

### Running the Optimizer
- Once you have 2 or more stocks selected, the **"Optimize Portfolio"** button in the top-right becomes active
- Click it — optimization takes about **30 seconds** (it downloads 4 years of price data and solves the math)
- A loading screen will appear while it works

### Reading the Results
- **Max Sharpe Portfolio** — the best return-to-risk ratio possible with your chosen stocks
- **Min Variance Portfolio** — the lowest risk possible with your chosen stocks
- **Efficient Frontier chart** — every point is a valid portfolio; the red star is the optimal one
- **Weight bar chart** — how much of your money to put in each stock
- Click **"Back to picker"** to go back and try a different selection

---

## Shutting Down

When you're done, go to each PowerShell / Terminal window and press `Ctrl + C` (Windows) / `Cmd + C` (Mac) to stop the servers.

---

## Troubleshooting

**"pip is not recognized"**
Use `py -m pip` instead of `pip`

**"npm is not recognized"**
Node.js is not installed or PowerShell / Terminal wasn't restarted after installing it. Close and reopen the window, then try again.

**The browser shows "This site can't be reached"**
Make sure both PowerShell windows are still running. If either was closed, restart that server.

**Optimization failed error**
Try selecting more stocks (at least 5 recommended). Some combinations of very few stocks may not have enough data overlap.

**Port already in use error**
Another program is using port 8000 or 3000. Restart your computer and try again.

---

## Project Structure (for reference)

```
Portfolio-Optimizer-Imagine-RIT/
│
├── backend/                   ← Python math engine
│   ├── main.py                ← API server
│   ├── optimizer.py           ← portfolio optimization logic
│   └── requirements.txt       ← Python library list
|   └── Final_Companies_with_Latest_Prices.xlsx   ← company data
|    ├── Templates/
│        ├── index.html
│        ├── results.html
│
├── portfolio-optimizer.py     ← original standalone script

```

---

## Technologies Used

| Part | Technology | What it does |
|------|-----------|--------------|
| Optimization math | Python + CVXPY | Solves the portfolio optimization problem |
| Price data | yfinance | Downloads historical stock prices from Yahoo Finance |
| Frontend framework | Flask + JS + CSS | Builds the visual interface |
