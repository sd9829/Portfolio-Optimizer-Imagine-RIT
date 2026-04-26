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

The app opens directly on the stock bubble picker. Two modes are available.

---

### Mode 1 — Personal Portfolio Optimizer

**Picking Stocks**
- Each **bubble** is a company — hover over it to see the ticker and live price
- **Click a bubble** to select it — it glows with a white ring
- **Click it again** to deselect
- You need at least **2 stocks** selected to run the optimizer

**Running the Optimizer**
- Once you have 2 or more stocks selected, the **"Optimize Portfolio →"** button in the top-right becomes active
- Click it — takes about **30 seconds** (downloads 4 years of price data and solves the quadratic program)

**Reading the Results**
- **Optimal · Max Sharpe** — best return-to-risk ratio; includes a weighted allocation table for each stock
- **Minimum Variance** — lowest possible risk with your chosen stocks
- **Efficient Frontier** — every point on the curve is a valid portfolio; the star is the optimal, the green dot is minimum variance

---

### Mode 2 — Lemme Fight AI

Click **"Lemme Fight AI"** in the top-right header to enter competition mode.

- The screen splits in half — **User's Choices** on the left, **AI's Choices** on the right
- Select your stocks on the left and a competing portfolio on the right
- A stock claimed by one side is **dimmed and unclickable** on the other side — the two portfolios must be distinct
- Both sides need at least 2 stocks selected before **"Optimize Both →"** becomes active
- Results are shown side by side with the same metrics as personal mode

---

### Market Roulette

After any optimization, a **"Spin the Wheel"** button appears at the bottom of the results page.

The wheel has 8 historically-grounded market events:

| Event | Return Impact |
|-------|--------------|
| 1999 Dot-Com Frenzy | +7% |
| 2017 FAANG Rally | +5% |
| 2021 Meme Stock Mania | +3% |
| 1995 Goldilocks Economy | +1% |
| 2011 US Debt Ceiling Crisis | 0% |
| 2022 Fed Rate Shock | −3% |
| 2020 COVID Crash | −5% |
| 2008 Lehman Collapse | −8% |

When the wheel lands:
- The result is shown with the historical context of that event
- **Your portfolio's expected return is adjusted** by the event's return impact and updated live in the results card
- Adjustments are **cumulative** across multiple spins in the same session
- In Fight AI mode, **only your portfolio is affected** — the AI's results are never touched

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
├── backend/
│   ├── main.py                ← FastAPI server + threading lock for yf.download
│   ├── optimizer.py           ← quadratic portfolio optimization (CVXPY)
│   └── requirements.txt
│
├── frontend/src/
│   ├── App.jsx                ← top-level routing (personal / fight-AI modes)
│   ├── App.css                ← all styles
│   └── components/
│       ├── BubblePicker.jsx   ← D3 force-directed bubble chart (supports blocked tickers)
│       ├── Results.jsx        ← single-portfolio results page
│       ├── PortfolioCard.jsx  ← shared stats + weights table + frontier canvas
│       ├── FightAI.jsx        ← split-screen stock selection + sequential optimization
│       ├── FightResults.jsx   ← side-by-side results for fight mode
│       └── SpinWheel.jsx      ← Market Roulette wheel with historical events
│
└── Final_Companies_with_Latest_Prices.xlsx   ← company and price data
```

---

## Technologies Used

| Part | Technology | What it does |
|------|-----------|--------------|
| Optimization math | Python + CVXPY | Solves the quadratic portfolio optimization problem |
| Price data | yfinance | Downloads historical stock prices from Yahoo Finance |
| API server | FastAPI | Connects the math engine to the frontend |
| Bubble chart | D3.js | Force-directed interactive bubble layout |
| Frontier chart | Canvas 2D API | Custom efficient frontier plot |
| Frontend framework | React + Vite | Builds the visual interface |
