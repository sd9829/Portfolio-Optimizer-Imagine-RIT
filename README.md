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

### 2. Node.js

Node.js runs the frontend (the visual part of the website).

1. Go to **https://nodejs.org**
2. Click the **"LTS"** button (the left one — it says "Recommended for most users")
3. Run the installer with all default settings — just keep clicking Next
4. **Restart PowerShell (Windows) / Terminal (Mac)** after installation finishes

To verify it worked, open a fresh PowerShell (Windows) / Terminal (Mac) and type:
```
node --version
npm --version
```
Both should print version numbers (e.g. `v20.11.0` and `10.2.4`)

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

Windows:
```
py -m pip install -r requirements.txt
```
Mac:
```
pip3 install -r requirements.txt
```

> This installs the required Python libraries. You only need to do this once — skip it next time.

Windows:
```
py -m uvicorn main:app --reload --port 8000
```
Mac:
```
uvicorn main:app --reload --port 8000
```

You should see output like:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

**Leave this window open.** Do not close it while using the app.

---

### Step 3 — Start the Frontend (the visual interface)

Open a **second PowerShell (Windows) / Terminal (Mac) window**.

Windows: right-click PowerShell in the taskbar → "New window"
Mac: press `Cmd + T` to open a new tab in Terminal, or open a new Terminal window

Paste these commands one at a time:

Windows:
```
cd C:\GitHub\Portfolio-Optimizer-Imagine-RIT\frontend
```
Mac:
```
cd ~/GitHub/Portfolio-Optimizer-Imagine-RIT/frontend
```
```
npm install
```

> This installs the required JavaScript libraries. You only need to do this once — skip it next time.

```
npm run dev
```

You should see output like:
```
  VITE v5.4.2  ready in 300 ms

  ➜  Local:   http://localhost:3000/
```

**Leave this window open too.**

---

### Step 4 — Open the App in Your Browser

Open any browser (Chrome, Edge, Firefox) and go to:

```
http://localhost:3000
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

## Explanation of results

The Max Sharpe Portfolio is the recommended allocation. Its "Annual Return" is what the player would expect to earn (annualized, based on historical data 2020–2024) if they follow those exact weights. That's the number to show the user as "your expected return."

The Min Variance card is more of a reference point — it answers "what's the safest I can be with these stocks?" which is useful context but not the primary recommendation.

---

## Project Structure (for reference)

```
Portfolio-Optimizer-Imagine-RIT/
│
├── backend/                   ← Python math engine
│   ├── main.py                ← API server
│   ├── optimizer.py           ← portfolio optimization logic
│   └── requirements.txt       ← Python library list
│
├── frontend/                  ← Visual web interface
│   ├── src/
│   │   ├── App.jsx            ← main app logic
│   │   ├── components/
│   │   │   ├── BubblePicker.jsx   ← interactive bubble chart
│   │   │   └── Results.jsx        ← results charts
│   └── package.json           ← JavaScript library list
│
├── portfolio-optimizer.py     ← original standalone script
└── Final_Companies_with_Latest_Prices.xlsx   ← company data
```

---

## Technologies Used

| Part | Technology | What it does |
|------|-----------|--------------|
| Optimization math | Python + CVXPY | Solves the portfolio optimization problem |
| Price data | yfinance | Downloads historical stock prices from Yahoo Finance |
| API server | FastAPI | Connects the math to the frontend |
| Bubble chart | D3.js | Force-directed interactive bubble layout |
| Result charts | Recharts | Efficient frontier and weight bar charts |
| Frontend framework | React + Vite | Builds the visual interface |
