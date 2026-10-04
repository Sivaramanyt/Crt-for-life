# CRT for Life

TradingView-style Binance Futures CRT analysis app.

## Pairs
BTCUSDT, ETHUSDT, SOLUSDT, AVAXUSDT, SUIUSDT, XRPUSDT, LINKUSDT, ADAUSDT.

## Data
Uses Binance USD-M Futures historical klines and public WebSocket kline streams.

## Strategy source
The attached CRT transcript is the primary source. The current engine is an initial, conservative implementation of the clearly supported concepts: HTF/ITF/LTF structure, meaningful old highs/lows, sweep-before-entry, C1/C2/C3 confirmation, and chart-side trade levels.

Rules that are ambiguous in the transcript must be verified before being treated as final strategy rules. This project must not use look-ahead data or repaint historical signals.

## Local development
`npm install`
`npm run dev`

Then open the local Next.js URL.
