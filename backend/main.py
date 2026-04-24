from pathlib import Path
from flask import Flask, render_template, jsonify, request
import pandas as pd
from optimizer import optimize

app = Flask(__name__)

BASE = Path(__file__).parent
df = pd.read_excel(BASE / "Final_Companies_with_Latest_Prices.xlsx")
df.columns = df.columns.str.strip()


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/results")
def results():
    return render_template("results.html")


@app.route("/companies")
def get_companies():
    result = {}
    for sector, group in df.groupby("Sector"):
        result[sector] = [
            {"ticker": row["Ticker"], "company": row["Company"], "price": float(row["Latest_Price"])}
            for _, row in group.iterrows()
        ]
    return jsonify(result)


@app.route("/optimize", methods=["POST"])
def run_optimizer():
    data = request.json
    t1 = data.get("tickers", [])
    t2 = data.get("tickers2", None)

    if len(t1) < 2:
        return jsonify({"error": "Portfolio 1 needs at least 2 stocks"}), 400

    r1 = optimize(t1)
    if r1 is None:
        return jsonify({"error": "Optimization failed for Portfolio 1 — try different stocks"}), 422

    resp = {"portfolio1": r1}

    if t2:
        if len(t2) < 2:
            return jsonify({"error": "Portfolio 2 needs at least 2 stocks"}), 400
        r2 = optimize(t2)
        if r2 is None:
            return jsonify({"error": "Optimization failed for Portfolio 2 — try different stocks"}), 422
        resp["portfolio2"] = r2

    return jsonify(resp)


if __name__ == "__main__":
    app.run(debug=True, port=5000)
