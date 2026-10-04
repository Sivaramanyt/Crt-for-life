import type {Candle} from "./types";

export const PAIRS = [
  {symbol:"BTCUSDT",display:"BTCUSDT.P",name:"Bitcoin"},
  {symbol:"ETHUSDT",display:"ETHUSDT.P",name:"Ethereum"},
  {symbol:"SOLUSDT",display:"SOLUSDT.P",name:"Solana"},
  {symbol:"AVAXUSDT",display:"AVAXUSDT.P",name:"Avalanche"},
  {symbol:"SUIUSDT",display:"SUIUSDT.P",name:"Sui"},
  {symbol:"XRPUSDT",display:"XRPUSDT.P",name:"XRP"},
  {symbol:"LINKUSDT",display:"LINKUSDT.P",name:"Chainlink"},
  {symbol:"ADAUSDT",display:"ADAUSDT.P",name:"Cardano"}
];

export async function fetchFuturesKlines(symbol:string, interval:string, limit=500):Promise<Candle[]> {
  const url = `https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
  const res = await fetch(url,{cache:"no-store"});
  if(!res.ok) throw new Error(`Binance Futures HTTP ${res.status}`);
  const rows:any[] = await res.json();
  return rows.map(r=>({time:Math.floor(r[0]/1000),open:+r[1],high:+r[2],low:+r[3],close:+r[4],volume:+r[5]}));
}

export function futuresWsUrl(symbol:string, interval:string){
  return `wss://fstream.binance.com/ws/${symbol.toLowerCase()}@kline_${interval}`;
}
