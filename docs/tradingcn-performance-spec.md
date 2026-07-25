# Adding tradingcn (CN pairs strategy) performance

Goal: display the **tradingcn** CN strategy on the site the same way the US /
dotnet strategy is shown — a daily cumulative **account return vs. benchmark**
curve. The data model is identical to the existing US feed (`outperform.csv`
consumed by `lib/perf.ts` → `loadOutPerform()`), so this is mostly a second
dataset plus a benchmark that is a CN index ETF instead of ES/SPY.

## Target schema (unchanged from US)

Emit an `outperform.csv` with the columns `loadOutPerform()` already parses:

| Column            | Meaning                                                        |
|-------------------|----------------------------------------------------------------|
| `Date`            | Trading day, `YYYY-MM-DD`                                       |
| `RawBalance`      | Account equity that day, as reported by the broker             |
| `AdjustedBalance` | `RawBalance` adjusted for deposits/withdrawals (see note)      |
| `BaseBalance`     | Equity on the baseline day (constant for the whole series)     |
| `AccountReturn`   | `AdjustedBalance / BaseBalance - 1` (cumulative, as a fraction) |
| `MarketReturn`    | `Benchmark / BenchmarkBase - 1` (cumulative, as a fraction)    |
| `OutPerform`      | `AccountReturn - MarketReturn`                                  |

Returns are **fractions** (e.g. `-0.0321`), not percents — the UI multiplies by 100.

Keep the two feeds separate (e.g. ship a `outperform_cn.csv` alongside
`outperform.csv`, or partition `PERF_DATA_DIR` by market) and add a `market`
param to `loadOutPerform()`. Everything else (the chart, the table) is reusable.

## Data sources (on the `mtus` VM, user `shsieh`)

1. **Account balances** — `~/data/stockcn_chuangye/trading/balances.csv`
   ```
   date,account_id,account_name,balance
   2026-06-30,guojin,guojin,700000.00
   2026-07-01,guojin,guojin,707021.27
   ...
   ```
   One row per trading day; account is `guojin`. `balance` → `RawBalance`.

2. **Benchmark = 159915.SZ** (ChiNext ETF, the chuangye universe reference) —
   `~/data/stockcn_chuangye/159915.SZ.parquet`. It's **minute bars**
   (`Date, Open, High, Low, Close, Volume`); the **daily close is the last bar
   of the day** (the 15:00 CST closing-auction bar). Use `Close`.
   - The hfq factor file `~/data/stockcn_chuangye/trading/159915_hfq.csv` is a
     single `factor = 1.0` row, i.e. no ETF distributions to adjust for, so
     **raw close == adjusted close** here. If that file ever gains rows, divide
     close by the forward-filled factor to get the adjusted benchmark.

3. **Baseline** — first row of `balances.csv`: `2026-06-30`, `BaseBalance =
   700000`. `BenchmarkBase` = 159915.SZ close on that same date (4.36 on 6/30).
   Both series are 0% on the baseline day.

## Formulas

For each date `d` in `balances.csv`:
```
BaseBalance      = balance[baseline_date]              # 700000, constant
AdjustedBalance  = balance[d] adjusted for cash flows  # == balance[d] if none
AccountReturn(d) = AdjustedBalance(d) / BaseBalance - 1
MarketReturn(d)  = etf_close(d) / etf_close(baseline) - 1
OutPerform(d)    = AccountReturn(d) - MarketReturn(d)
```

**Deposits/withdrawals:** the `guojin` account currently has no cash flows, so
`AdjustedBalance == RawBalance`. Keep the column anyway — the moment money is
added/removed, `RawBalance/BaseBalance` stops being a true return, and you must
subtract the net external flow (same as the US pipeline already does) so the
curve reflects trading P&L, not deposits.

## Reference generator (Python 3, pandas + pyarrow — both present on mtus)

```python
import pandas as pd

BAL = "/home/shsieh/data/stockcn_chuangye/trading/balances.csv"
ETF = "/home/shsieh/data/stockcn_chuangye/159915.SZ.parquet"   # chuangye benchmark

bal = pd.read_csv(BAL, parse_dates=["date"]); bal["date"] = bal["date"].dt.date

px = pd.read_parquet(ETF, columns=["Date", "Close"])
px = px[px["Date"] >= str(bal["date"].min())]
px["d"] = px["Date"].dt.date
etf_close = px.sort_values("Date").groupby("d")["Close"].last()   # last bar = daily close

bal["etf"] = bal["date"].map(etf_close)
bal["AdjustedBalance"] = bal["balance"]                 # == raw until there are cash flows
b0, e0 = bal["balance"].iloc[0], bal["etf"].iloc[0]     # baseline row

out = pd.DataFrame({
    "Date":            bal["date"],
    "RawBalance":      bal["balance"],
    "AdjustedBalance": bal["AdjustedBalance"],
    "BaseBalance":     b0,
    "AccountReturn":   bal["AdjustedBalance"] / b0 - 1,
    "MarketReturn":    bal["etf"] / e0 - 1,
})
out["OutPerform"] = out["AccountReturn"] - out["MarketReturn"]
out.to_csv("outperform_cn.csv", index=False)
```

Run this on a daily cron after `tradingcn` writes the day's balance, then ship
`outperform_cn.csv` into `PERF_DATA_DIR` the same way the US CSVs are deployed.

## Expected output (validate your implementation against this)

Baseline 2026-06-30, `BaseBalance = 700000`, returns shown as % for readability:

| Date       | RawBalance | 159915 close | AccountReturn | MarketReturn | OutPerform |
|------------|-----------:|-------------:|--------------:|-------------:|-----------:|
| 2026-06-30 | 700,000.00 | 4.36 |   0.00% |   0.00% |  0.00% |
| 2026-07-01 | 707,021.27 | 4.27 |  +1.00% |  -2.06% | +3.07% |
| 2026-07-02 | 694,418.07 | 4.04 |  -0.80% |  -7.52% | +6.72% |
| 2026-07-03 | 699,224.58 | 4.04 |  -0.11% |  -7.49% | +7.38% |
| 2026-07-06 | 694,174.85 | 3.97 |  -0.83% |  -9.03% | +8.20% |
| 2026-07-07 | 684,206.43 | 3.93 |  -2.26% |  -9.90% | +7.64% |
| 2026-07-08 | 670,315.89 | 3.87 |  -4.24% | -11.39% | +7.15% |
| 2026-07-09 | 668,223.13 | 4.04 |  -4.54% |  -7.42% | +2.88% |
| 2026-07-10 | 677,555.86 | 3.86 |  -3.21% | -11.50% | +8.30% |

(7/04–7/05 absent = weekend; day gaps are expected and fine.)

## Gotchas

- **Benchmark is `159915.SZ`** (the chuangye universe reference) — that's all
  this covers.
- **Daily close = last minute bar**, not `Open`/first bar. The 15:00 bar carries
  the closing-auction volume.
- **Timezone** is Asia/Shanghai (CST). Balance dates and ETF bar dates are both
  CN trading days, so they align without conversion.
- The account is currently long-only-gated pairs; the curve is the *account*
  equity, so it already reflects whatever the strategy actually did.
