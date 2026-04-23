from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
from optimizer import optimize

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE = Path(__file__).parent.parent
df = pd.read_excel(BASE / "Final_Companies_with_Latest_Prices.xlsx")
df.columns = df.columns.str.strip()


@app.get("/companies")
def get_companies():
    result = {}
    for sector, group in df.groupby("Sector"):
        result[sector] = [
            {
                "ticker": row["Ticker"],
                "company": row["Company"],
                "price": float(row["Latest_Price"]),
            }
            for _, row in group.iterrows()
        ]
    return result


class OptimizeRequest(BaseModel):
    tickers: list[str]


@app.post("/optimize")
def run_optimizer(req: OptimizeRequest):
    if len(req.tickers) < 2:
        raise HTTPException(status_code=400, detail="Select at least 2 stocks")
    result = optimize(req.tickers)
    if result is None:
        raise HTTPException(status_code=422, detail="Optimization failed — try different stocks")
    return result
